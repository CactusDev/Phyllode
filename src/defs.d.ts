
interface EventData {
	event: string;
    channel: string;
    service: string;
    data: any;
}

type EventExecutor = (event: EventData) => any | void;
