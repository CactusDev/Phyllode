import { Service, ServiceStatus } from "../../service";
import { ChatSocket, IChatMessage, IUserUpdate } from "mixer-chat";
import * as httpm from "typed-rest-client/HttpClient";

interface MixerChatResponse {
    roles: string[];
    authkey: string;
    permissions: string[];
    endpoints: string[];
}

/**
 * Handle the Mixer service.
 *
 * @export
 * @class MixerHandler
 * @implements {Service}
 */
export class MixerHandler implements Service {

    private chat: ChatSocket;
    protected _status: ServiceStatus = ServiceStatus.AUTHENTICATING;

    private httpc: httpm.HttpClient = new httpm.HttpClient("aerophyl");

    private base = "https://mixer.com/api/v1";
    private headers = {
        Authorization: "Bearer"
    }

    public async connect(): Promise<boolean> {
        return true;
    }

    public async authenticate(channelRaw: string | number, botId: number): Promise<boolean> {
        let channelId;
        if (<any>channelRaw instanceof String) {
            const nameResult = await this.httpc.get(`${this.base}/channel/${channelRaw}`);
            if (nameResult.message.statusCode !== 200) {
                return false;
            }
            channelId = JSON.parse(await nameResult.readBody()).id;
        } else {
            channelId = <number>channelRaw;
        }
        // TODO: Authentication handler
        const result = await this.httpc.get(`${this.base}/chats/${channelId}`, this.headers);
        const body: MixerChatResponse = JSON.parse(await result.readBody());
        this.chat = new ChatSocket(body.endpoints).boot();

        const isAuthed = await this.chat.auth(channelId, botId, body.authkey);
        if (!isAuthed) {
            return false;
        }
        this.chat.on("ChatMessage", async message => {
            let converted: CactusMessagePacket = <CactusMessagePacket>await this.convert(message);
            console.log(converted);
        });
        this.chat.on("UserUpdate", async update => {
            console.log(update);
        })
        return true; // This is bad /shrug
    }

    public async disconnect(): Promise<boolean> {
        return true; // TODO
    }

    public async convert(packet: any): Promise<CactusPacket> {
        if (packet.message !== undefined) {
            // Message packet
            const message = packet.message.message;
            const meta = packet.message.meta;
            if (message.length < 1) {
                // This is bad, and a Mixer bug.
                throw new Error("No message");
            }
            let fullChatMessage = "";
            let target = undefined;
            // Parse each piece of the message
            message.forEach(async (msg: {type: string, data: string, text: string, username?: string}) => {
                if (msg.type === "tag") {
                    target = msg.username;
                }
                fullChatMessage += ` ${msg.text}`;
            });
            fullChatMessage = fullChatMessage.trim();
            let cactusPacket: CactusMessagePacket;

            // TODO: Can this be better?
            if (target !== undefined) {
                cactusPacket = {
                    type: "message",
                    text: fullChatMessage,
                    action: meta.me !== undefined,
                    user: packet.user_name,
                    role: packet.user_roles[0],
                    target: target
                }
            } else {
                cactusPacket = {
                    type: "message",
                    text: fullChatMessage,
                    action: meta.me !== undefined,
                    user: packet.user_name,
                    role: packet.user_roles[0]
                }
            }
            return cactusPacket;
        }
        return {
            type: "error"
        };
    }

    public get status(): ServiceStatus {
        return this._status; // TODO
    }

    public set status(status: ServiceStatus) {
        this._status = status;
    }
}
