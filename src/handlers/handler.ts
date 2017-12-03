
import { Logger } from "cactus-stl";

import { RabbitHandler } from "../rabbit";
import { title } from "../util";
import { EventHandler, HANDLERS, HANDLED_EVENT_METADATA_KEY } from "."

interface RegisteredHandlers {
	[event: string]: EventExecutor[];
};

const MESSAGE_HANDLER = "message";

export class HandlerController {
	private registeredHandlers: RegisteredHandlers = {};

	constructor(private rabbit: RabbitHandler) {
	}

	public async setup(handlers: any[] = HANDLERS) {
		// Validate all handlers, and register them.
		for (let handler of handlers) {
			if (!Reflect.hasOwnMetadata(HANDLED_EVENT_METADATA_KEY, handler)) {
				Logger.error("core", "Cannot register a handler of which has no event metadata.");
				continue;
			}
			// Valid, put it in our handled list.
			const event = Reflect.getOwnMetadata(HANDLED_EVENT_METADATA_KEY, handler);
			const current = this.registeredHandlers[event] || [];
			current.push(handler);
			this.registeredHandlers[event] = current;
		}

		this.rabbit.on("service:message", async (message: ProxyMessage) => {
			const registered = this.registeredHandlers[MESSAGE_HANDLER] || [];
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
