import { serve } from "https://deno.land/std@0.140.0/http/server.ts";
import { WorkerRouter } from "https://deno.land/x/workers_router@v0.3.0-pre.6/index.ts";
import { iris, irisStation } from "./bahn/iris/iris.ts";
import {
  badRequest,
  internalServerError,
  notFound,
  ok,
} from "https://ghuc.cc/worker-tools/response-creators/index.ts";
import { basics, cors } from "https://ghuc.cc/worker-tools/middleware/index.ts";
import { combine } from "https://ghuc.cc/worker-tools/middleware/context.ts";
import { UserError } from "./util/error.ts";

const middleware = combine(basics(), cors());
const router = new WorkerRouter()
  .get("/iris/station/:input", middleware, async (_, { params }) => {
    const result = await irisStation(params.input!);
    if (!result) return notFound();
    return ok(JSON.stringify(result));
  })
  .get(
    "/iris/timetable/:eva",
    middleware,
    async (_, { params, searchParams }) => {
      if (isNaN(parseInt(params.eva!))) {
        return badRequest("EVA is not a number");
      }
      if (
        searchParams.get("start") &&
        new Date(parseInt(searchParams.get("start")!)).toString() ==
          "Invalid Date"
      ) {
        return badRequest("Missing or invalid start date");
      }

      const result = await iris(parseInt(params.eva!), {
        startDate: searchParams.get("start")
          ? new Date(parseInt(searchParams.get("start")!))
          : undefined,
        endDate: searchParams.get("end")
          ? new Date(parseInt(searchParams.get("end")!))
          : undefined,
        includeMessages: searchParams.get("includeMessages") == "true",
        includeRoute: searchParams.get("includeRoute") == "true",
      });
      return ok(
        JSON.stringify({
          station: result.station,
          stops: result.stops.map((stop) => ({
            ...stop,
            arrival: stop.arrival
              ? {
                  ...stop.arrival,
                  time: stop.arrival.time.getTime(),
                  plannedTime: stop.arrival.plannedTime.getTime(),
                }
              : null,
            departure: stop.departure
              ? {
                  ...stop.departure,
                  time: stop.departure.time.getTime(),
                  plannedTime: stop.departure.plannedTime.getTime(),
                }
              : null,
          })),
        })
      );
    }
  )
  .any("*", () => notFound())
  .recover("*", (_, ctx) => {
    if (ctx.error instanceof UserError) return badRequest(ctx.error.message);
    console.error(ctx.error);
    return internalServerError();
  });

serve(router.serveCallback);
