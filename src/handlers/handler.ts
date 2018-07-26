
import { Logger } from "cactus-stl";

import { RabbitHandler } from "../rabbit";
import { title } from "../util";
import { EventHandler, HANDLERS, HandlerType, HANDLED_EVENT_METADATA_KEY, MessageHandler } from "."

import { StopResponse, EventExecutor } from "./responses"
import { Injector } from "dependy";

interface RegisteredHandlers {
    [event: string]: {
        function: EventExecutor;
        owner: any;
    }[];
};

const MESSAGE_HANDLER = "service:channel:message";

export class HandlerController {
    private registeredHandlers: RegisteredHandlers = {};

    constructor(private rabbit: RabbitHandler, private injector: Injector = null) {
    }

    public provideInjector(injector: Injector) {
        this.injector = injector;
    }

    public async setup(handlers: HandlerType[] = HANDLERS) {
        // Validate all handlers, and register them.
        for (let handler of handlers) {
            if (!Reflect.hasOwnMetadata(HANDLED_EVENT_METADATA_KEY, handler.target)) {
                Logger.error("Core", "Cannot register a handler of which has no event metadata.");
                continue;
            }
            // Valid, put it in our handled list.
            const events = Reflect.getOwnMetadata(HANDLED_EVENT_METADATA_KEY, handler.target);
            for (let event of events) {
                const current = this.registeredHandlers[event.event] || [];
                current.push({ function: event.function, owner: event.owner });
                this.registeredHandlers[event.event] = current;
            }
        }

        if (!this.rabbit) {
            return;
        }

        // @CLEANUP: Duplicated code in here, make it not duplicated
        // @CLEANUP: Duplicated code in here, make it not duplicated
        // @CLEANUP: Duplicated code in here, make it not duplicated
        // @CLEANUP: Duplicated code in here, make it not duplicated
        // @CLEANUP: Duplicated code in here, make it not duplicated
        // @CLEANUP: Duplicated code in here, make it not duplicated

        this.rabbit.on("service:message", async (message: ProxyMessage) => {
            const registered = this.registeredHandlers[MESSAGE_HANDLER] || [];
            registered.push(...this.registeredHandlers["*"] || []);

            registered.forEach(async executor => {
                const hackityHack = this.injector.get(executor.owner);
                if (!hackityHack) {
                    console.error("Hey Innectic remember when you told yourself that hack wouldn't break?")
                    console.error("Guess what broke.", hackityHack);
                    return;
                }
                const result = await hackityHack[executor.function.name]({
                    event: "message",
                    service: message.service,
                    channel: message.channel,
                    data: message
                });
                if (result) {
                    if (result instanceof StopResponse){
                        // If we got a stop result, that generally means there was some sort of a fatal
                        // error within a handler. In this case, we don't want to continue at all.
                        return;
                    }
                }
            });
        });
    }

    // public async push(event: string, data: any): Promise<any[]> {
    //     const registered = [...this.registeredHandlers[event] || [], ...this.registeredHandlers["*"] || []];

    //     let results: any = [];

    //     registered.forEach(async executor => {
    //         const hackityHack = this.injector.get(executor.owner);
    //         if (!hackityHack) {
    //             console.error("Hey Innectic remember when you told yourself that hack wouldn't break?")
    //             console.error("Guess what broke.", hackityHack);
    //             return null;
    //         }

    //         const result = await hackityHack[executor.function.name]({
    //             event,
    //             service: data.service,
    //             channel: data.channel,
    //             data
    //         });
    //         if (result) {
    //             if (result instanceof StopResponse) {
    //                 return;
    //             }
    //             results.push(result);
    //         }
    //     });
    //     return results;
    // }
}
