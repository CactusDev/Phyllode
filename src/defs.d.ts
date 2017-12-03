
interface EventData {
	channel: string;
	service: string;
	data: any;
}

type EventExecutor = (event: EventData) => void;
