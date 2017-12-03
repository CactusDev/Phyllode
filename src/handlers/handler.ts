
import { RabbitHandler } from "../rabbit";

import { title } from "../util";

import { EventHandler, HANDLERS } from "."

interface RegisteredHandlers {
	[event: string]: EventExecutor[];
};

export let registeredHandlers: RegisteredHandlers = {};
export function registerHandler(event: string, executor: EventExecutor) {
	const current = registeredHandlers[event] || [];
	current.push(executor);
	registeredHandlers[event] = current;
}

const MESSAGE_HANDLER = "message";

export class HandlerController {

	constructor(private rabbit: RabbitHandler) {
	}

	public async setup(handlers: any[] = HANDLERS) {
		this.rabbit.on("service:message", async (message: ProxyMessage) => {
			const registered = registeredHandlers[MESSAGE_HANDLER] || [];
			registered.forEach(async executor => {
				executor({
					service: message.service,
					channel: message.channel,
					data: message
				});
			});
		});
	}
}
