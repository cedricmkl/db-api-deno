import { iris, irisStation } from "./iris.ts";
import {
  assertEquals,
  assertNotEquals,
} from "https://deno.land/std@0.183.0/testing/asserts.ts";

Deno.test("Iris Station", async () => {
  const result = await irisStation("Basel Bad Bf");
  assertEquals(result, {
    name: "Basel Bad Bf",
    eva: 8000026,
    ds100: "RB",
    db: true,
    platforms: null,
    meta: [
      {
        name: "Basel, Badischer Bahnhof",
        eva: 8592321,
        ds100: "PSIXF",
        db: true,
        platforms: null,
      },
    ],
  });
});

Deno.test("Iris Station Board", async () => {
  const result = await iris(8000026, {
    startDate: new Date(),
  });
  assertEquals(result.station, {
    name: "Basel Bad Bf",
    eva: 8000026,
  }, "invalid station");
  assertNotEquals(result.stops.length, 0, "invalid stop length");
});
