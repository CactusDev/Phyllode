import { AuthenticationData } from "./services/mixer/authentication";

import { Config } from "../config";
import { Subject } from "rxjs";
import { Cereus } from "../cereus";
import { Logger } from "../logger";

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
    protected status: ServiceStatus = ServiceStatus.CONNECTING;
    protected channel: string;

    constructor(protected cereus: Cereus) {

    }

    protected reverseEmojis(emojis: Emojis): ReverseEmojis {
        let reversed: ReverseEmojis = {};

        for (let k of Object.keys(emojis)) {
            const v = emojis[k];
            reversed[v.standard] = k;
        }

        for (let k of Object.keys(emojis)) {
            const v = emojis[k];
            if (!v.alternatives) {
                continue;
            }
            for (let alt of v.alternatives) {
                if (!reversed[alt]) {
                    reversed[alt] = k;
                }
            }
        }

        return reversed;
    }

    /**
     * Inital connection to the server.
     *
     * This should only include the actual socket connection.
     *
     * @returns {Promise<boolean>} connection status
     * @memberof Service
     */
    public abstract async connect(oauthKey: string, refresh?: string, expiry?: number): Promise<boolean>;

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

    /**
     * Reauthenticate a user account.
     *
     * @abstract
     * @memberof Service
     */
    public async reauthenticate(data?: AuthenticationData): Promise<void> {
        return;
    }

    /**
     * Add a channel to the service handler, if supported.
     *
     * This method should only be implemented by services that support adding channels to the same handler,
     * like Twitch.
     *
     * @param {string} channel the extra channel to join
     * @memberof Service
     */
    public async addChannel(channel: string): Promise<void> {
        Logger.error("Services", `${this.serviceName}: Unsupported operation: Cannot add channels to handler.`);
    }

    /**
     * Set the status of the service, and log it.
     *
     * @param {ServiceStatus} status the new status of the service.
     * @memberof Service
     */
    public setStatus(status: ServiceStatus) {
        Logger.info("Services", `${this.serviceName}: Setting status to ${ServiceStatus[status]} from ${ServiceStatus[this.status]}`);
        this.status = status;
    }

    /**
     * Get the current status of the service
     *
     * @returns {ServiceStatus} the status of the service, in enum form.
     * @memberof Service
     */
    public getStatus(): ServiceStatus {
        return this.status;
    }
}
