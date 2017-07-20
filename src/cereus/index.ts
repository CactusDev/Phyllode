import { ServiceHandler } from "../service";

import { Subject } from "rxjs";
import * as httpm from "typed-rest-client/HttpClient";

export const messages: Subject<CactusMessagePacket> = new Subject();

/**
 * The CactusBot Cereus handler system.
 *
 * @export
 * @class Cereus
 */
export class Cereus {

    private httpc: httpm.HttpClient = new httpm.HttpClient("aerophyl-cereus-handler");

    constructor(private serviceHandler: ServiceHandler) {

    }

    private async parseServiceMessage(message: string, context: CactusContext): Promise<CactusMessagePacket> {
        let current = "";
        let inVariable = false;
        let last: CactusMessageComponent = {
            type: "text",
            data: ""
        };

        let packets: CactusMessageComponent[] = [];

        for (let i = 0; i < message.length; i++) {
            const char = message[i];
            if (char === " ") {
                inVariable = false;
                current += " ";
            } else if (char === "%") {
                if (inVariable) {
                    inVariable = false;
                    let modifiers: string[] = [];
                    let split = current.split("|");
                    let ready: any = [];
                    if (split && split.length > 0) {
                        const name = split[0];
                        delete split[0];
                        ready.push(name);
                        ready[1] = [];
                        split.filter(e => e !== null).forEach(e => ready[1].push(e));
                    } else {
                        ready = [current, []];
                    }
                    const now: CactusMessageComponent = {
                        type: "variable",
                        data: ready
                    };
                    last = now;
                    packets.push(now);
                    current = "";
                } else {
                    inVariable = true;
                    packets.push({
                        type: "text",
                        data: current
                    });
                    current = "";
                }
            } else {
                current += char;
                const now: CactusMessageComponent = {
                    type: "text",
                    data: current
                }
                if (i === message.length - 1) {
                    packets.push(now);
                }
                last = now;
            }
        }
        return {
            type: "message",
            action: context.action.enabled,
            role: context.role,
            user: context.user,
            text: packets
        }
    }

    /**
     * Boot the message watcher
     *
     * @memberof Cereus
     */
    public async boot() {
        messages.subscribe(
            // Actual packets
            async (packet: CactusMessagePacket) => {
                const response = await this.httpc.post("http://151.80.89.161:5023/response", JSON.stringify(packet));
                const message: CactusMessagePacket[] = JSON.parse(await response.readBody());
                console.log("Response from cereus: " + JSON.stringify(message));
                // this.serviceHandler.sendServiceMessage()
            },
            // Errors
            (error: any) => console.error,
            // Done
            () => {
                console.log("Done");
            }
        )
    }
}
