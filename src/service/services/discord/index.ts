
import { Cereus } from "../../../cereus";
import { Service, ServiceStatus } from "../../service";
import { discordEmojis } from "./emoji";

import { default as axios } from "axios";
import * as discord from "discord.js";

import { Service as ServiceAnnotation } from "../../service.annotation";
import { Logger } from "../../../logger";

import { eatSpaces } from "../../../util";

const isUrl = require("is-url");

@ServiceAnnotation("Discord", {singleInstance: true})
export class DiscordHandler extends Service {

    private reversedEmojis: ReverseEmojis = {};
    private oauth = "";

    private client: discord.Client;

    constructor(protected cereus: Cereus) {
        super(cereus);

        this.reversedEmojis = this.reverseEmojis(discordEmojis);
    }

    public async connect(oauthKey: string, refresh?: string, expiry?: number): Promise<boolean> {
        if (this.getStatus() === ServiceStatus.READY) {
            return false;
        }
        this.oauth = oauthKey;
        return true;
    }

    public async authenticate(channel: string | number, botId: string | number): Promise<boolean> {
        this.client = new discord.Client();

        this.client.on("ready", () => {
            Logger.info("Services", `Connected to Discord Guild '${channel}' on account '${botId}'`);
            this.client.user.setGame("CactusBot");
        });

        this.client.on("message", async (message: discord.Message) => {
            const converted = await this.convert([message.cleanContent, (message.guild ? message.guild.id :
                message.author.id), message.channel.id]);
            const responses = await this.cereus.handle(await this.cereus.parseServiceMessage(converted));
            if (!responses) {
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

    public async convert(packet: any): Promise<CactusContext> {
        // TODO: Needs the api to be able to determine what role a user is.
        const role: Role = "owner";
        const finished: Component[] = [];
        const rawMessage: string = packet[0];
        const segments = rawMessage.split(" ");
        const guild = packet[1];
        const channel = packet[2];

        for (let segment of segments) {
            let segmentType: "text" | "emoji" | "url" = "text";
            let segmentData: any;

            if (discordEmojis[segment]) {
                // This is bad. See same code in Twitch handler for full explanation.
                segmentType = "emoji";
                segmentData = discordEmojis[segment];
            } else if (isUrl(segment)) {
                segmentType = "url";
                segmentData = segment;
            } else {
                segmentData = segment;
            }
            finished.push({
                "type": segmentType,
                data: segmentData
            });
        }

        const context: CactusContext = {
            packet: {
                "type": "message",
                text: finished,
                action: rawMessage.startsWith("_") && rawMessage.endsWith("_")
            },
            channel: channel,
            user: "Innectic",
            role: role,
            service: "Discord"
        }
        return context;
    }

    public async invert(...contexts: CactusContext[]): Promise<string[]> {
        let finished: string[] = []
        for (let context of contexts) {
            if (context.packet.type === "message") {
                let packet = (<CactusMessagePacket>context.packet);
                let message = "";

                for (let msg of packet.text) {
                    if (!msg) {
                        continue;
                    }
                    if (msg.type === "emoji") {
                        message += await this.getEmoji(msg.data.trim());
                    } else {
                        message += ` ${msg.data}`;
                    }
                }
                if (packet.action) {
                    message = await eatSpaces(`_${message}_`);
                }
                if (message && message.trim() !== "") {
                    finished.push(message.trim());
                }
            }
        }
        return finished;
    }

    public async getEmoji(name: string): Promise<string> {
        return this.reversedEmojis[name] || `:${name}:`;
    }

    public async sendMessage(message: CactusContext) {
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
            }
            Logger.error("Services", "Invalid channel type " + channel.type);
        });
    }

    public async convertRole(role: string): Promise<Role> {
        return "owner"; // TODO: needs api
    }
}
