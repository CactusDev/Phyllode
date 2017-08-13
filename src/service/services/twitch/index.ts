import { Config } from "../../../config";
import { Cereus } from "../../../cereus";
import { Service, ServiceStatus } from "../../service";
import { emojis } from "./emoji";

import { Service as ServiceAnnotation } from "../../service.annotation";

const tmi = require("tmi.js");

@ServiceAnnotation("Twitch")
export class TwitchHandler extends Service {

    private instance: any;

    private channel = "";
    private oauth = "";

    private reversedEmoji: Emojis = {};

    constructor(protected cereus: Cereus) {
        super(cereus);

        // Emoji stuff
        for (let k of Object.keys(emojis)) {
            const v = emojis[k];
            this.reversedEmoji[v] = k;
        }
    }

    public async connect(oauthKey: string, refresh?: string, expiry?: number): Promise<boolean> {
        if (this.status === ServiceStatus.READY) {
            return;
        }
        this.oauth = oauthKey;
        return true;
    }

    public async authenticate(channel: string | number, botId: string | number): Promise<boolean> {
        // TODO: Handle number channel ids
        this.channel = (<string>channel).toLowerCase();

        // TODO: Support for multiple channels from the one handler.
        //       This shouldn't be too hard, probably just an observable
        //       that's hosted from this file, then we just watch that
        //       Probably would need some sort of an identifier
        //       in the service annotation or something saying that
        //       this handler can support multiple from one instance,
        //       so that we don't keep creating more.
        const connectionOptions = {
            options: {
                debug: true  // XXX: This shouldn't stay, but it's useful for debugging
            },
            connection: {
                reconnect: true
            },
            identity: {
                username: botId,
                password: `oauth:${this.oauth}`
            },
            channels: [channel]  // TODO: See the above todo.
        }

        this.instance = new tmi.client(connectionOptions);
        this.instance.connect();

        this.instance.on("message", async (fromChannel: string, state: any, message: string, self: boolean) => {
            // Make sure that this message didn't come from us.
            if (self) {
                return;
            }
            // Now that we know it's not us, then we can start parsing.
            const converted = await this.convert([message, state, fromChannel]);
            const responses = await this.cereus.handle(await this.cereus.parseServiceMessage(converted));
            if (!responses) {
                console.error("Mixer MessageHandler: Got no response from Cereus? " + JSON.stringify(converted));
                return;
            }
            responses.forEach(async response => this.sendMessage(response));
        });
        return true;
    }

    public async disconnect(): Promise<boolean> {
        return true;
    }

    public async convert(packet: any): Promise<CactusScope> {
        const message: any = packet[0];
        const state: any = packet[1];
        const channel: string = packet[2];

        let isMod = false;
        let isBroadcaster = false;
        let isSub = false;

        if (state.badges) {
            isBroadcaster = state.badges.broadcaster && state.badges.broadcaster === "1";
            isMod = state.mod;
            isSub = state.subscriber;
        }

        let textRole = "user";
        if (isMod) {
            textRole = "mod";
        } else if (isBroadcaster) {
            textRole = "broadcaster";
        }

        const role = await this.convertRole(textRole);

        const finished: Component[] = [];
        const segments: any[] = message.split(" ");
        for (let rawSegment of segments) {
            const segment = rawSegment.trim();
            let segmentType: "text" | "emoji" = "text";
            let segmentData: any;

            if (emojis[segment]) {
                segmentType = "emoji";
                segmentData = emojis[segment];
            } else {
                segmentData = segment;
            }
            finished.push({
                "type": segmentType,
                data: segmentData
            });
        }
        let isAction = false;
        let target: string = undefined;
        const messageType = state["message-type"]

        if (messageType === "action") {
            isAction = true;
        } else if (messageType === "whisper") {
            target = state.username;
        }

        const scope: CactusScope = {
            packet: {
                "type": "message",
                text: finished,
                action: isAction
            },
            channel: channel,
            user: state["display-name"],
            role: role,
            service: this.serviceName
        };

        if (target) {
            scope.target = target;
        }

        return scope;
    }

    public async invert(...scopes: CactusScope[]): Promise<string[]> {
        let finished: string[] = [];
        for (let scope of scopes) {
            // This needs something related to the contexts too. (See the todo below, and one of the many above)

            if (scope.packet.type === "message") {
                let packet = (<CactusMessagePacket>scope.packet);
                let messages = packet.text;
                let chatMessage = "";

                if (packet.action) {
                    chatMessage += "/me ";
                }

                for (let msg of messages) {
                    if (msg !== null) {
                        if (msg["type"] === "emoji") {
                            const emoji = await this.getEmoji(msg.data.trim());
                            chatMessage += ` ${emoji}`;
                        } else {
                            // HACK: Only kind of a hack, but for some reason all the ACTIONs contain this.
                            //       Can the replace be removed?
                            chatMessage += ` ${msg.data.replace("\u0001", "")}`;
                        }
                    }
                }
                finished.push(chatMessage.trim());
            }
        }
        return finished;
    }

    public async getEmoji(name: string): Promise<string> {
        return emojis[name] || this.reversedEmoji[name] || "";
    }

    public async sendMessage(message: CactusScope) {
        const inverted = await this.invert(message);
        inverted.forEach(packet => {
            if (message.target) {
                this.instance.whisper(message.target, packet);
                return;
            }
            this.instance.say(this.channel, packet)
        });
    }

    public async convertRole(role: string): Promise<Role> {
        role = role.toLowerCase();
        if (role === "mod") {
            return "moderator";
        } else if (role === "broadcaster") {
            return "owner";
        }
        return "user";
    }

    public async reauthenticate() {
        console.log("Twitch: Skipping reauthentication");
    }

    public get status(): ServiceStatus {
        return this._status;
    }

    public set status(state: ServiceStatus) {
        this._status = state;
    }
}
