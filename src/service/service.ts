
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
    CONNECTING, CONNECTED, AUTHENTICATING, AUTHENTICATED, READY
}

/**
 * Base services that other services implement
 * 
 * @export
 * @interface Service
 */
export interface Service {  // TODO: This should probably be turned into an abstract class.

    status: ServiceStatus;
    
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
    authenticate(channel: string | number): Promise<boolean>;

    /**
     * Disconnect from the service
     * 
     * @returns {Promise<boolean>} if the disconnection was clean
     * @memberof Service
     */
    disconnect(): Promise<boolean>;
}