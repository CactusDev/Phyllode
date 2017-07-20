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
        const shouldParse = messagePackets.map(packet => packet.data).join(" ").includes("%");

        // Does this packet-set actually need to be parsed?
        // Packets that don't contain a variable, don't need to be parsed twice.
        // Besides, we only want to parse packets with variables.
        if (!shouldParse) {
            console.log("Not attempting to parse " + shouldParse);
            return messagePacket;
        }

        for (let i = 0; i < messagePacket.text.length; i++) {
            const packet = messagePacket.text[i];
            // We only care about components that can contain a variable, the text type.
            if (packet.type !== "text") {
                continue;
            }
            console.log("Is text");
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
                            const name = split[0];
                            delete split[0];
                            ready.push(name);
                            ready[1] = [];
                            split.filter(e => e !== null).forEach(e => ready[1].push(e));
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
        }
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
