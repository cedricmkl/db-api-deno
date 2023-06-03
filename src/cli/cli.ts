import {
  Flag,
  Option,
  PartialOption,
} from "https://deno.land/x/args@1.0.2/flag-types.ts";
import {
  MAIN_COMMAND,
  PARSE_FAILURE,
} from "https://deno.land/x/args@1.0.2/symbols.ts";
import { Integer, Text } from "https://deno.land/x/args@1.0.2/value-types.ts";
import args from "https://deno.land/x/args@1.0.2/wrapper.ts";
import { station } from "./actions/station.ts";
import { timetable } from "./actions/timetable.ts";

const parser = args
  .describe("DB Iris API CLI")
  .sub(
    "help",
    args
      .describe("Show help"),
  )
  .sub(
    "station",
    args
      .describe("Get station info")
      .with(Option("query", {
        type: Text,
        alias: ["q"],
        describe: "Query (name, EVA or DS100)",
      }))
      .with(Flag("raw", {
        describe: "Show raw result",
      })),
  ).sub(
    "timetable",
    args
      .describe("Get station timetable (with changes)")
      .with(Option("eva", {
        type: Integer,
        alias: ["e"],
        describe: "EVA number of the station",
      }))
      .with(Flag("route", {
        alias: ["r"],
        describe: "Show route",
      }))
      .with(Flag("messages", {
        alias: ["msg"],
        describe: "Show messages",
      }))
      .with(Flag("raw", {
        describe: "Show raw result",
      }))
      .with(PartialOption("lookbehind", {
        alias: ["lb"],
        default: 300,
        type: Integer,
        describe: "Lookbehind in seconds",
      }))
      .with(PartialOption("lookahead", {
        alias: ["la"],
        default: 3600,
        type: Integer,
        describe: "Lookahead in seconds",
      }))
      .with(PartialOption("max", {
        alias: ["m"],
        default: 10,
        type: Integer,
        describe: "Max number of results to show",
      })),
  );

const res = parser.parse(Deno.args);
switch (res.tag) {
  case "station": {
    const { query, raw } = res.value.value;
    await station(query, raw);
    break;
  }
  case "timetable": {
    const { eva, route, raw, lookbehind, lookahead, max, messages} = res.value.value;
    await timetable(
      Number(eva),
      route,
      raw,
      messages,
      Number(lookbehind),
      Number(lookahead),
      Number(max),
    );
    break;
  }
  case PARSE_FAILURE:
  case MAIN_COMMAND:
    console.log(parser.help());
    break;
  case "help":
    console.log(parser.help(...res.remaining().rawValues()));
    break;
}
