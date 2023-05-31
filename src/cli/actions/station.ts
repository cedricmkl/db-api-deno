import { irisStation } from "../../bahn/iris/iris.ts";
import { IrisStationDetails } from "../../bahn/iris/types.ts";
import * as color from "https://deno.land/x/coolors@v1.0.0/mod.js";

export async function station(query: string, raw: boolean) {
  if (!raw) console.log(`Searching for ${query}...`);

  const station = await irisStation(query);
  if (!station) throw new Error("Station not found");

  if (raw) {
    console.log(JSON.stringify(station, null, 2));
    return;
  }

  console.log(formatStation(station));
  if (station.meta.length > 0) {
    console.log("Meta stations:");
    station.meta.forEach((meta) => console.log(`  - ${formatStation(meta)} `));
  }
}

function formatStation(station: IrisStationDetails) {
  return `${color.green(station.name)} (${color.cyan(station.eva)} - ${
    color.blue(station.ds100)
  })`;
}
