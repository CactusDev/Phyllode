
import { Logger } from "cactus-stl";
import { HANDLERS } from "."

export const HANDLED_EVENT_METADATA_KEY = "event:handler:handled";

export function Event(handlerName: string) {
	return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
		if (Reflect.hasOwnMetadata(HANDLED_EVENT_METADATA_KEY, descriptor.value)) {
			Logger.error("core", `Cannot redefine the handled event for a handler function. Handler function: ${propertyKey} for the new event: ${handlerName}`);
			return;
		}

		Reflect.defineMetadata(HANDLED_EVENT_METADATA_KEY, handlerName, descriptor.value);
		HANDLERS.push(descriptor.value);
		Logger.info("core", `Registered handler for event ${handlerName}.`);
	}
}
