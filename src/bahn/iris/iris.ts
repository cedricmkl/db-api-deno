import { node as XMLNode } from "https://deno.land/x/xml@2.1.0/utils/types.ts";
import moment from "https://deno.land/x/momentjs@2.29.1-deno/mod.ts";
import { isWithhin, ONE_HOUR, parseDateYYMMDDHHmm } from "../../util/date.ts";
import { node, xml, attr, children, attrBool } from "../../util/xml.ts";
import { IrisMessage, IrisOptions, IrisResult, IrisStaionDetails, IrisStationDetilsResult, IrisStop, IrisStopChanges, IrisTimetable, IrisTimetableStop, TrainClass } from "./types.ts";
import { UserError } from "../../util/error.ts";

//TODO: messages, subsitution trains
const IRIS_BASE_URL = "https://iris.noncd.db.de"

export async function irisTimetable(eva: number, date: Date, options: IrisOptions): Promise<IrisTimetable> {
    const urlDate = `${moment(date).format("YYMMDD")}/${parseInt(moment(date).format("HH"))}`
    const response = await fetch(`${IRIS_BASE_URL}/iris-tts/timetable/plan/${eva}/${urlDate}`, {
        cache: "force-cache"
    })
    return parseIrisTimetable(eva, await response.text(), options)
}

export async function irisFullChanges(eva: number, options: IrisOptions): Promise<Array<IrisStopChanges>> {
    const response = await fetch(`${IRIS_BASE_URL}/iris-tts/timetable/fchg/${eva}`)
    return parseIrisChanges(await response.text(), options)
}

export async function iris(
    eva: number,
    options: IrisOptions
): Promise<IrisResult> {
    if (!options.endDate) options.endDate = new Date(options.startDate.getTime() + 2 * ONE_HOUR);
    if (options.startDate >= options.endDate) throw new UserError("End date must be after start date");
    if (options.endDate.getTime() > options.startDate.getTime() + 12 * ONE_HOUR)
        throw new UserError("End date must be within 12 hour of start date");
    let date = options.startDate;
    const timetablePromises: Array<Promise<IrisTimetable>> = [];
    while (date <= options.endDate) {
        timetablePromises.push(irisTimetable(eva, date, options));
        date = new Date(date.getTime() + ONE_HOUR);
    }

    const timetables = await Promise.all(timetablePromises);
    const changes = await irisFullChanges(eva, options);

    return {
        station: timetables[0].station,
        stops: combineStops(timetables.map((v) => v.stops).flat(), changes)
            .filter((s) => isWithhin(getStopTime(s), options.startDate, options.endDate!))
            .sort((a, b) => getStopTime(a).getTime() - getStopTime(b).getTime())
    };
}

export async function irisStation(input: string): Promise<IrisStationDetilsResult | null> {
    return parseIrisStaion(await fetchIrisStation(input))
}

async function fetchIrisStation(input: string): Promise<string> {
    const response = await fetch(`${IRIS_BASE_URL}/iris-tts/timetable/station/${input}`, {
        cache: "force-cache"
    })
    return await response.text()
}

async function parseIrisStaion(string: string): Promise<IrisStationDetilsResult | null> {
    const stations = node(xml(string), "stations")!;
    if (node(stations, "station") == null) return null;
    const station = node(stations, "station")!;

    const meta: Array<IrisStaionDetails> = [];
    if (attr(station, "meta") != null) {
        for (const eva of attr(station, "meta")!.toString().split("|")) {
            const data = await fetchIrisStation(eva);
            meta.push(parseSingleIrisStation(node(node(xml(data), "stations")!, "station")!));
        }
    }

    return {
        ...parseSingleIrisStation(station),
        meta
    }
}

function parseSingleIrisStation(station: XMLNode): IrisStaionDetails {
    return {
        name: attr(station, "name")!,
        eva: parseInt(attr(station, "eva")!),
        ds100: attr(station, "ds100")!,
        db: attrBool(station, "db")!,
        platforms: attr(station, "p")?.toString().split("|") || null
    }
}


function parseIrisTimetable(eva: number, string: string, options: IrisOptions): IrisTimetable {
    const timetable = node(xml(string), "timetable")!;
    const stationName = attr(timetable, "station")!;
    const stops: Array<IrisTimetableStop> = [];

    for (const stop of children(timetable, "s")) {
        const train = node(stop, "tl")!;
        const arrvial = node(stop, "ar");
        const departure = node(stop, "dp")

        const route: Array<string> = []
        attr(arrvial, "ppth")?.split("|").forEach((s) => route.push(s));
        route.push(stationName)
        attr(departure, "ppth")?.split("|").forEach((s) => route.push(s));

        stops.push({
            id: attr(stop, "id")!,
            plannedPlatform: attr(arrvial, "pp") || attr(departure, "pp") || "",
            arrival: arrvial ? {
                plannedTime: parseDateYYMMDDHHmm(attr(arrvial, "pt"))!
            } : null,
            departure: departure ? {
                plannedTime: parseDateYYMMDDHHmm(attr(departure, "pt"))!
            } : null,
            train: {
                type: attr(train, "c")!,
                number: parseInt(attr(train, "n")!),
                line: attr(arrvial, "l") || attr(departure, "l") || null,
                class: parseClass(attr(train, "f"))
            },
            plannedDestination: route[route.length - 1],
            plannedRoute: options.includeRoute ? route : null,
        })
    }
    return {
        station: {
            name: stationName,
            eva: eva
        },
        stops
    }
}


function parseIrisChanges(string: string, options: IrisOptions): Array<IrisStopChanges> {
    const timetable = node(xml(string), "timetable")!;
    const stationName = attr(timetable, "station")!;
    const stopChanges: Array<IrisStopChanges> = [];

    for (const stop of children(timetable, "s")) {
        const arrival = node(stop, "ar");
        const departure = node(stop, "dp")

        const route: Array<string> = [];
        attr(arrival, "cpth")?.split("|").forEach((s) => route.push(s));
        route.push(stationName)
        attr(departure, "cpth")?.split("|").forEach((s) => route.push(s));

        stopChanges.push({
            id: attr(stop, "id")!,
            platform: attr(arrival, "cp") || attr(departure, "cp") || null,
            messages: options.includeMessages ? children(stop, "m").map(parseMessage) : null,
            route: options.includeRoute ? route : null,
            destination: route.length > 1 ? route[route.length - 1] : null,
            arrival: arrival ? {
                time: parseDateYYMMDDHHmm(attr(arrival, "ct")),
                messages: options.includeMessages ? children(arrival, "m").map(parseMessage) : null,
                cancelled: attr(arrival, "cs") === "c"
            } : null,
            departure: departure ? {
                time: parseDateYYMMDDHHmm(attr(departure, "ct")),
                messages: options.includeMessages ? children(departure, "m").map(parseMessage) : null,
                cancelled: attr(departure, "cs") === "c"
            } : null,
        })
    }

    return stopChanges;

}


function combineStops(timetableStops: Array<IrisTimetableStop>, changes: Array<IrisStopChanges>): Array<IrisStop> {
    const resultStops: Array<IrisStop> = [];

    for (const stop of timetableStops) {
        const stopChanges = changes.find((c) => c.id === stop.id);
        let arrival = null;
        let departure = null;
        if (stop.arrival) {
            arrival = {
                plannedTime: stop.arrival.plannedTime,
                time: stopChanges?.arrival?.time || stop.arrival.plannedTime,
                messages: stopChanges?.arrival?.messages || null,
                cancelled: stopChanges?.arrival?.cancelled || false
            }
        }
        if (stop.departure) {
            departure = {
                plannedTime: stop.departure.plannedTime,
                time: stopChanges?.departure?.time || stop.departure.plannedTime,
                messages: stopChanges?.departure?.messages || null,
                cancelled: stopChanges?.departure?.cancelled || false
            }
        }

        resultStops.push(
            {
                id: stop.id,
                train: stop.train,
                plannedPlatform: stop.plannedPlatform,
                platform: stopChanges?.platform || stop.plannedPlatform,
                plannedDestination: stop.plannedDestination,
                destination: stopChanges?.destination || stop.plannedDestination,
                plannedRoute: stop.plannedRoute,
                route: stopChanges?.route || stop.plannedRoute,
                arrival,
                departure,
                messages: stopChanges?.messages || null
            }
        )
    }
    return resultStops
}

function getStopTime(stop: IrisTimetableStop): Date {
    return (stop.arrival?.plannedTime || stop.departure?.plannedTime)!
}

function parseClass(classString: string | null): TrainClass {
    switch (classString) {
        case "F": return "LONG_DISTANCE"
        case "N": return "REGIONAL"
        case "S": return "SUBURBAN"
        default: return null
    }
}

function parseMessage(message: XMLNode): IrisMessage {
    return {
        id: attr(message, "id")!,
        type: attr(message, "t")!,
        value: attr(message, "c"),
        category: attr(message, "cat") || null,
        priority: attr(message, "p") ? parseInt(attr(message, "p")!) : null,
        timeSent: parseDateYYMMDDHHmm(attr(message, "ts"))
    }
}