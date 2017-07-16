
import { Subject } from "rxjs";

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
    CONNECTING,  AUTHENTICATING, READY
}

/**
 * Base services that other services implement
 *
 * @export
 * @interface Service
 */
export interface Service {  // TODO: This should probably be turned into an abstract class.

    /**
     * The current status of the service handler.
     *
     * @type {ServiceStatus}
     * @memberof Service
     */
    status: ServiceStatus;

    /**
     * Events from any sort of service event system
     *
     * @type {Subject<CactusEventPacket>}
     * @memberof Service
     */
    events: Subject<CactusEventPacket>;

    /**
     * Inital connection to the server.
     *
     * This should only include the actual socket connection.
     *
     * @returns {Promise<boolean>} connection status
     * @memberof Service
     */
    connect(): Promise<boolean>;

    /**
     * Authenticate this service instance with the service.
     *
     * @param {string | number} channel the channel to connect to
     * @returns {Promise<boolean>} authentication status
     * @memberof Service
     */
    authenticate(channel: string | number, botId: number): Promise<boolean>;

    /**
     * Disconnect from the service
     *
     * @returns {Promise<boolean>} if the disconnection was clean
     * @memberof Service
     */
    disconnect(): Promise<boolean>;

    /**
     * Convert a service packet into a Cactus formatted packet
     *
     * @param {*} packet the packet from the service
     * @returns {Promise<CactusPacket>} the packet in the CactusBot format
     * @memberof Service
     */
    convert(packet: any): Promise<CactusPacket>;

    /**
     * Convert from a CactusPacket back into a service packet
     *
     * @param {CactusPacket} packet the packet to convert
     * @returns {Promise<string>} the service packet
     * @memberof Service
     */
    invert(packet: CactusMessagePacket): Promise<string>;

    /**
     * Send a mesasge to the service
     *
     * @param {string} message the message to send
     * @memberof Service
     */
    sendMessage(message: CactusMessagePacket): void;
}
