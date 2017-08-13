
import { Cereus } from "../../../cereus";
import { Service, ServiceStatus } from "../../service";
import { emojis } from "./emoji";

import * as httpm from "typed-rest-client/HttpClient";
import * as discord from "discord.js";

import { Service as ServiceAnnotation } from "../../service.annotation";

@ServiceAnnotation("Discord")
export class DiscordHandler extends Service {

    private reversedEmoji: Emojis = {};
    private oauth = "";

    private client: discord.Client;

    constructor(protected cereus: Cereus) {
        super(cereus);

        for (let k of Object.keys(emojis)) {
            const v = emojis[k];
            this.reversedEmoji[v] = k;
        }
    }

    public async connect(oauthKey: string, refresh?: string, expiry?: number): Promise<boolean> {
        if (this.status === ServiceStatus.READY) {
            return false;
        }
        this.oauth = oauthKey;
        return true;
    }

    public async authenticate(channel: string | number, botId: string | number): Promise<boolean> {
        this.client = new discord.Client();

        this.client.on("ready", () => {
            console.log("Connected to Discord.");
            this.client.user.setGame("CactusBot");
        });

        this.client.on("message", async (message: discord.Message) => {
            const converted = await this.convert([message.content, message.guild.id, message.channel.id]);
            const responses = await this.cereus.handle(await this.cereus.parseServiceMessage(converted));
            if (!responses) {
                console.error("Discord MessageHandler: Got no response from Cereus? " + JSON.stringify(converted));
                return;
            }
            responses.forEach(async response => await this.sendMessage(response));
        });

        this.client.login(this.oauth);
        return true;
    }

    public async disconnect(): Promise<boolean> {
        return true;
    }

    public async convert(packet: any): Promise<CactusScope> {
        // TODO: Needs the api to be able to determine what role a user is.
        const role: Role = "owner";
        const finished: Component[] = [];
        const segments = packet[0].split(" ");
        const guild = packet[1];
        const channel = packet[2];

        for (let segment of segments) {
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

        const scope: CactusScope = {
            packet: {
                "type": "message",
                text: finished,
                action: false // TODO
            },
            channel: channel,
            user: "Innectic",
            role: role,
            service: this.serviceName
        }
        return scope;
    }

    public async invert(...scopes: CactusScope[]): Promise<string[]> {
        let finished: string[] = []
        for (let scope of scopes) {
            if (scope.packet.type === "message") {
                let packet = (<CactusMessagePacket> scope.packet);
                let message = "";

                if (packet.action) {
                    message += "/me";
                }

                for (let msg of packet.text) {
                    if (message == null) {
                        continue;
                    }
                    if (msg.type === "emoji") {
                        message += await this.getEmoji(msg.data.trim());
                    } else {
                        message += msg.data;
                    }
                }
                finished.push(message.trim());
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
            const channel = this.client.channels.get(message.channel);
            // What in tarnation
            if (channel.type === "dm") {
                (<discord.DMChannel>channel).send(packet);
                return;
            } else if (channel.type === "text") {
                (<discord.TextChannel>channel).send(packet);
                return;
            } else if (channel.type === "group") {
                (<discord.GroupDMChannel>channel).send(packet);
                return;
            }
            console.error("Invalid channel type", channel.type);
        });
    }

    public async convertRole(role: string): Promise<Role> {
        return "owner"; // TODO: needs api
    }

    public async reauthenticate() {
        console.log("Discord: Skipping reauthentication");
    }

    public get status(): ServiceStatus {
        return this._status;
    }

    public set status(state: ServiceStatus) {
        this._status = state;
    }
}
