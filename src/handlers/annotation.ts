
import { Logger } from "cactus-stl";
import { HANDLERS } from "."

import { reflectAnnotations, createAnnotationFactory } from "reflect-annotations";

export const HANDLED_EVENT_METADATA_KEY = "handler:event:handled";

class EventAnnotation {
    constructor(public handlerName: string[] | string) {}
}
export const Event = createAnnotationFactory(EventAnnotation);

export function EventController() {
    return (target: Function) => {
        let events: any[] = [];

        const presentAnnotatedComponents = reflectAnnotations(target);
        for (let component of presentAnnotatedComponents) {
            // Figure out what decorators are on this component.
            // If it has @Event, then we want to turn this component
            // into a real event handler
            for (let decorator of component.methodAnnotations) {
                if (decorator instanceof EventAnnotation) {
                    if (!decorator.handlerName) {
                        Logger.error("Core", "Missing the name of the handler.");
                        return;
                    }

                    // Register each handler on the method
                    const names = typeof decorator.handlerName === "string" ? [decorator.handlerName] : [...decorator.handlerName];
                    for (let name of names) {
                        // This is an event handling function.
                        // So, lets put all the important information we need
                        // on it.
                        const eventHandler = target.prototype[component.name];
                        if (!eventHandler) {
                            Logger.error("Core", "Somehow, the event handler function isn't a thing but I see it?");
                            return;
                        }
                        if (Reflect.hasOwnMetadata(HANDLED_EVENT_METADATA_KEY, eventHandler)) {
                            Logger.error("Core", `Cannot redefine the handled event for a handler function. Handler function: ${component.name} for the new event: ${name}`);
                            return;
                        }
                        events.push({
                            function: eventHandler,
                            event: name,
                            owner: target
                        });

                        Reflect.defineMetadata(HANDLED_EVENT_METADATA_KEY, events, target);
                        HANDLERS.push(target);

                        Logger.info("Core", `Registered handler for event ${name}.`);
                    }
                }
            }
        }
    }
}
