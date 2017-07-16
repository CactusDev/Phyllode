import { Service, ServiceStatus } from '../../service';

const { Client, OAuthProvider, DefaultRequestRunner } = require("beam-client-node");

/**
 * Handle the Mixer service.
 * 
 * @export
 * @class MixerHandler
 * @implements {Service}
 */
export class MixerHandler implements Service {

    private client = new Client(new DefaultRequestRunner());
    protected _status: ServiceStatus = ServiceStatus.AUTHENTICATING;

    public async connect(): Promise<boolean> {
        // I don't think we need this?
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
        this.client.use(new OAuthProvider(this.client, {
            clientId: "",
            secret: ""
        }))
        .attempt()
            .then(() => this.client.chat.join(channel))
            .then((res: any) => console.log("Connected!"))
            .catch(console.error);
        return true; // This is bad /shrug
    }

    public async disconnect(): Promise<boolean> {
        return true; // TODO
    }

    public get status(): ServiceStatus {
        return this._status; // TODO
    }
}
