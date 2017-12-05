
export class ExecutorResponse {}

export class StopResponse extends ExecutorResponse {}

export type EventExecutor = (event: EventData) => ExecutorResponse | void;
