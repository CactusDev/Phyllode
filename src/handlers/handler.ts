
import { Logger } from "cactus-stl";

import { RabbitHandler } from "../rabbit";
import { title } from "../util";
import { EventHandler, HANDLERS, HANDLED_EVENT_METADATA_KEY, MessageHandler } from "."

interface RegisteredHandlers {
	[event: string]: {
		function: EventExecutor;
		owner: any;
	}[];
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
			const events = Reflect.getOwnMetadata(HANDLED_EVENT_METADATA_KEY, handler);
			for (let event of events) {
				const current = this.registeredHandlers[event.event] || [];
				current.push({ function: event.function, owner: event.owner });
				this.registeredHandlers[event.event] = current;
			}
		}

		this.rabbit.on("service:message", async (message: ProxyMessage) => {
			const registered = this.registeredHandlers[MESSAGE_HANDLER] || [];
			registered.forEach(async executor => {
				executor.owner.prototype[executor.function.name]({
					service: "Testing",
					channel: "Another test",
					data: "Dank memes 123"
				});
			});
		});
	}

	public async test() {
		const registered = this.registeredHandlers[MESSAGE_HANDLER] || [];
		registered.forEach(async executor => {
			executor.owner.prototype[executor.function.name]({
				service: "Testing",
				channel: "Another test",
				data: "Dank memes 123"
			});
		});
	}
}
