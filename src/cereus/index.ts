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

    public async parseServiceMessage(messagePacket: CactusMessagePacket): Promise<CactusMessagePacket> {
        const messagePackets = messagePacket.text;
        const shouldParse = messagePackets.some(e => e.data.includes("%"));

        // Does this packet-set actually need to be parsed?
        // Packets that don't contain a variable, don't need to be parsed twice.
        // Besides, we only want to parse packets with variables.
        if (!shouldParse) {
            return messagePacket;
        }

        messagePacket.text.forEach(async packet => {
            // const packet = messagePacket.text[i];
            // We only care about components that can contain a variable, the text type.
            if (packet.type !== "text") {
                return;
            }
            const message = packet.data;

            let current = "";
            let inVariable = false;
            let packets: CactusMessageComponent[] = [];

            for (let pos = 0; pos < message.length; pos++) {
                const char = message[pos];
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
                            ready.push(split[0]);
                            ready[1] = split.slice(0);
                        } else {
                            ready = [current, []];
                        }
                        packets.push({
                            type: "variable",
                            data: ready
                        });
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
                    if (pos === message.length - 1) {
                        packets.push({
                            type: "text",
                            data: current
                        });
                    }
                }
            }
            // Now that we're done, set all the packets to the new ones.
            messagePacket.text = packets;
        });
        return messagePacket;
    }

    /**
     * Boot the message watcher
     *
     * @memberof Cereus
     */
    public async boot() {
        messages.subscribe(
            // Actual packets
            async (packet) => {
                const response = await this.httpc.post("http://151.80.89.161:5023/response", JSON.stringify(packet));
                const message: CactusMessagePacket[] = JSON.parse(await response.readBody());
                console.log("Response from cereus: " + JSON.stringify(message));
                // this.serviceHandler.sendServiceMessage()
            },
            // Errors
            (error) => console.error,
            // Done
            () => {
                console.log("Done");
            }
        )
    }
}
