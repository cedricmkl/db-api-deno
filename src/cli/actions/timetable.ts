import { format } from "https://deno.land/std@0.125.0/datetime/mod.ts";
import * as color from "https://deno.land/x/coolors@v1.0.0/mod.js";
import { combineMessages, iris } from "../../bahn/iris/iris.ts";
import { IrisStop } from "../../bahn/iris/types.ts";

export async function timetable(
  eva: number,
  showRoute: boolean,
  showRaw: boolean,
  showMessages: boolean,
  lookbehind: number,
  lookahead: number,
  max: number,
) {
  const timetable = await iris(eva, {
    startDate: new Date(Date.now() - (lookbehind * 1000)),
    endDate: new Date(Date.now() + (lookahead * 1000)),
    includeRoute: showRoute,
    includeMessages: showMessages
  });

  const stops = timetable.stops.slice(0, max);

  if (showRaw) {
    console.log(JSON.stringify(stops, null, 2));
    return;
  }

  console.log(
    `Timetable for ${color.green(timetable.station.name)} - ${
      color.red(timetable.station.eva)
    } (${stops.length} Stops): `,
  );

  console.log(
    stops.map((stop) => formatStop(stop, showRoute, showMessages, timetable.station.name))
      .join("\n\n"),
  );
}

const invalidIf = (
  str: string,
  condition: boolean,
  invalidText?: string,
) => {
  return condition
    ? `${color.strike(color.red(str))} ${invalidText ? invalidText : ""}`
    : str;
};

const formatChangeable = (planned: string, actual: string | null) => {
  return `${invalidIf(planned, planned !== actual, actual!)}`;
};

const formatDelay = (planned: Date, actual: Date): string => {
  const diff = actual.getTime() - planned.getTime();
  const minutes = Math.round(diff / 1000 / 60);
  if (minutes > 0) {
    return color.red(`+${minutes} min`);
  } else if (minutes < 0) {
    return color.green(`${minutes} min`);
  } else {
    return "";
  }
};

const formatTime = (planned: Date, actual: Date): string => {
  return `${
    formatChangeable(
      format(planned, "HH:mm"),
      format(actual, "HH:mm"),
    )
  } ${formatDelay(planned, actual)}`;
};

const formatRoute = (
  planned: string[],
  actual: string[],
  currentStation: string,
): string => {
  let route: string[] = [];
  if (actual != null) {
    planned.forEach((station) => {
      let tmp = station;
      if (station === currentStation) tmp = color.green(station);
      if (!actual.includes(station)) tmp = color.strike(color.red(station));
      route.push(tmp);
    });
  } else {
    route = planned;
  }
  return route.join(" -> ");
};

const formatMessages = (stop: IrisStop) => {
  const messages = combineMessages(stop.messages!, stop.arrival?.messages || [], stop.departure?.messages || [])
  .filter(m => m.text !== null)
  .map((m) => `  ${color.green(format(m.timeSent!, "HH:mm"))}: ${m.text}`)

  if(messages.length > 0) return `\n\n${messages.join("\n")}`
  return ""
}

const formatStop = (
  stop: IrisStop,
  showRoute: boolean,
  showMessages: boolean,
  currentStation: string,
) => {
  let str = `${
    color.cyan(`${stop.train.type} ${stop.train.line ?? stop.train.number}`)
  } (${color.green(stop.train.class ?? "UNKNOWN")}) -> ${
    formatChangeable(stop.plannedDestination, stop.destination)
  } `;

  str += `\n  Platform ${
    color.cyan(formatChangeable(stop.plannedPlatform, stop.platform))
  } `;

  if (stop.arrival) {
    str += invalidIf(
      `\n  Arrival: ${formatTime(stop.arrival.plannedTime, stop.arrival.time)}`,
      stop.arrival.cancelled,
      color.red("Cancelled"),
    );
  }

  if (stop.departure) {
    str += invalidIf(
      `\n  Departure: ${
        formatTime(stop.departure.plannedTime, stop.departure.time)
      }`,
      stop.departure.cancelled,
      color.red("Cancelled"),
    );
  }

  if (showRoute && stop.plannedRoute) {
    str += `\n  Route: ${
      formatRoute(stop.plannedRoute, stop.route!, currentStation)
    } `;
  }

  if(showMessages) str += formatMessages(stop)
  
  return str;
};
