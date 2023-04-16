### Test Bahnhoefe:
 - Basel Bad Bf 8000026/RB (8592321/PSIXF Bus?)

## Ids
- eva
- d100

## Apis
### iris.noncd.db.de (XML)
https://iris.noncd.db.de/wbt/js/index.html?typ=ab&bhf=8000026


https://iris.noncd.db.de/iris-tts/timetable/station/{NAME/ID}
  - minimal information about a station (eva, metastations, name, ds100) 
 
https://iris.noncd.db.de/iris-tts/timetable/plan/{EVA}/{YYMMDD}/{HH}
```xml
<timetable station="Basel Bad Bf">
   <s id="-5048675999038902325-2304151804-2">
      <tl t="p" o="L7" c="SBB" n="87852" />
      <ar pt="23 04 15 1810" pp="6" l="S6" ppth="Basel SBB" />
      <dp pt="2304151817" pp="6" l="S6" ppth="Riehen Niederholz|...|Zell(Wiesental)" />
   </s>
</timetable>
```
 