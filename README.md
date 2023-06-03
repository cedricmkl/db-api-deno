# DB-API Deno

This repo includes a deno library to access the Deutsche Bahn's half-public iris
api to get station and timetable data. You can find a small cli to interact with
the api in the `src/cli/` folder.

CLI examples:
```shell
# Install the cli
deno install -A -n db https://raw.githubusercontent.com/cedricmkl/db-api-deno/main/src/cli/cli.ts

# Get station data for "Berlin Hbf"
db station -q "Berlin Hbf"
# Berlin Hbf (8011160 - BLS)
# ...

# Get the timetable of "Berlin Hbf" using the id returned by the command above
db timetable -e 8011160
# ICE 858 (LONG_DISTANCE) -> Köln Hbf 
# Platform 14
# ... 

```
