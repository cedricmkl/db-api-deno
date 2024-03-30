export type TrainClass = "LONG_DISTANCE" | "REGIONAL" | "SUBURBAN" | null;

export type IrisStation = {
  name: string;
  eva: number;
};

export type IrisStationDetails = IrisStation & {
  platforms: Array<string> | null;
  ds100: string;
  db: boolean;
};
export type IrisStationDetilsResult = IrisStationDetails & {
  meta: Array<IrisStationDetails>;
};

export type IrisTrain = {
  type: string;
  line: string | null;
  number: number;
  class: TrainClass;
};

export type IrisTimetable = {
  station: {
    name: string;
    eva: number;
  };
  stops: Array<IrisTimetableStop>;
};

export type IrisTimetableStop = {
  id: string;
  plannedPlatform: string;
  train: IrisTrain;
  arrival: null | {
    plannedTime: Date;
  };
  departure: null | {
    plannedTime: Date;
  };
  plannedDestination: string;
  plannedRoute: Array<string> | null;
};

export type IrisStopChanges = {
  id: string;
  platform: string | null;
  messages: Array<IrisMessage> | null;
  destination: string | null;
  arrival: null | {
    time: Date | null;
    messages: Array<IrisMessage> | null;
    cancelled: boolean;
    changedPath: Array<string> | null;
  };
  departure: null | {
    time: Date | null;
    messages: Array<IrisMessage> | null;
    cancelled: boolean;
    changedPath: Array<string> | null;
  };
};

export type IrisMessage = {
  id: string;
  type: string;
  value: number;
  text: string | null;
  category: string | null;
  priority: number | null;
  timeSent: Date | null;
};

export type IrisOptions = {
  startDate?: Date;
  endDate?: Date;
  includeRoute?: boolean;
  includeMessages?: boolean;
};

export type IrisResult = {
  station: IrisStation;
  stops: Array<IrisStop>;
};

export type IrisStop = {
  id: string;
  train: IrisTrain;
  plannedPlatform: string;
  platform: string;
  messages: Array<IrisMessage> | null;
  plannedRoute: Array<string> | null;
  route: Array<string> | null;
  plannedDestination: string;
  destination: string;
  arrival: null | {
    plannedTime: Date;
    time: Date;
    messages: Array<IrisMessage> | null;
    cancelled: boolean;
  };
  departure: null | {
    plannedTime: Date;
    time: Date;
    messages: Array<IrisMessage> | null;
    cancelled: boolean;
  };
};
