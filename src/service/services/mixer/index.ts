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
        Authorization: "Bearer TODO AUTHENTICATION HANDLER"
    }

    public async connect(): Promise<boolean> {
        // TODO: This shouldn't be a static ip being used for all the chat
        // that's being used
        return true;
    }

    public async authenticate(channelRaw: string | number): Promise<boolean> {
        if (<any>channelRaw instanceof String) {
            // We don't allow this right now. In the future, this should get the ID from the
            // api. But for now this will do.
            return false;
        }
        const channel = <number>channelRaw
        // TODO: Authentication handler
        const result = await this.httpc.get(`${this.base}/chats/${channel}`, this.headers);
        const body: MixerChatResponse = JSON.parse(await result.readBody());
        this.chat = new ChatSocket(body.endpoints).boot();

        const isAuthed = await this.chat.auth(channel, 25873, body.authkey);
        if (!isAuthed) {
            return false;
        }
        this.chat.on("ChatMessage", async message => {
            console.log(message);
        });
        this.chat.on("UserUpdate", async update => {
            console.log(update);
        })
        return true; // This is bad /shrug
    }

    public async disconnect(): Promise<boolean> {
        return true; // TODO
    }

    public get status(): ServiceStatus {
        return this._status; // TODO
    }

    public setStatus(status: ServiceStatus) {
        this._status = status;
    }
}
