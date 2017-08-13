
import { Subject } from "rxjs";
import { Cereus } from "../cereus";

/**
 * Authentication info for a named bot.
 *
 * @export
 * @interface BotInfo
 */
export interface BotInfo {
    [username: string]: {
        refresh: string,
        oauth: string
    }
}

/**
 * Status of the current handler.
 *
 * `CONNECTING` is the initial state of a bot, before it starts the conncetion process.
 * It then switches to `CONNECTED` after a connection to the service is confirmed.
 * Next, we switch to `AUTHENTICATING` when the authentication state begins.
 * Then, we set to `AUTHENTICATED` when the authentication is confirmed.
 * Finally, we switch to `READY` after the service has done it's post-initialization tasks.
 *
 * @export
 * @enum {number}
 */
export enum ServiceStatus {
    CONNECTING, AUTHENTICATING, READY
}

/**
 * Base services that other services implement
 *
 * @export
 * @interface Service
 */
export abstract class Service {

    public status: ServiceStatus;

    /**
     * Name of the service.
     *
     * Fufilled from the `Service` annotation.
     *
     * @type {string}
     * @memberof Service
     */
    public serviceName: string;

    /**
     * Events from any sort of service event system
     *
     * @type {Subject<CactusScope>}
     * @memberof Service
     */
    public events: Subject<CactusScope> = new Subject();


    /**
     * The current status of the service handler.
     *
     * @type {ServiceStatus}
     * @memberof Service
     */
    protected _status: ServiceStatus;
    protected _channel: string;


    constructor(protected cereus: Cereus) {

    }

    /**
     * Inital connection to the server.
     *
     * This should only include the actual socket connection.
     *
     * @returns {Promise<boolean>} connection status
     * @memberof Service
     */
    public abstract async connect(oauthKey: string, refresh?: string, expiry?: string): Promise<boolean>;

    /**
     * Authenticate this service instance with the service.
     *
     * @param {string | number} channel the channel to connect to
     * @returns {Promise<boolean>} authentication status
     * @memberof Service
     */
    public abstract async authenticate(channel: string | number, botId: string | number): Promise<boolean>;

    /**
     * Disconnect from the service
     *
     * @returns {Promise<boolean>} if the disconnection was clean
     * @memberof Service
     */
    public abstract async disconnect(): Promise<boolean>;

    /**
     * Convert a service packet into a Cactus formatted packet
     *
     * @param {*} packet the packet from the service
     * @returns {Promise<CactusScope>} the packet in the CactusBot format
     * @memberof Service
     */
    public abstract async convert(packet: any): Promise<CactusScope>;

    /**
     * Convert from a CactusPacket back into a service packet
     *
     * @param {CactusScope} packet the packet to convert
     * @returns {Promise<string>} the service packet
     * @memberof Service
     */
    public abstract async invert(...packet: CactusScope[]): Promise<string[]>;

    /**
     * Send a mesasge to the service
     *
     * @param {CactusScope} message the message to send
     * @memberof Service
     */
    public abstract async sendMessage(message: CactusScope): Promise<void>;

    /**
     * Convert from the service role to the Cactus version of the role.
     *
     * @abstract
     * @param {*} args arguments
     * @returns {Promise<Role>} the cactus version of the role
     * @memberof Service
     */
    public abstract async convertRole(...args: any[]): Promise<Role>;
}
