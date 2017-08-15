
import { default as axios } from "axios";

import { EventEmitter } from "events";
import { Logger } from "../../../logger";

interface Data {
    [name: string]: string;
}

export interface AuthenticationData {
    access_token: string;
    token_type: string;
    expires_in: number;
    refresh_token: string;
}

/**
 * Handle authentication for the Mixer service
 *
 * @export
 * @class MixerAuthenticator
 */
export class MixerAuthenticator extends EventEmitter {

    private mixerURL = "https://mixer.com/api/v1";
    private headers: any = {};

    /**
     * Setup the authenticater for use with accounts.
     *
     * @param {string} clientId the id for the OAuth client
     * @param {string} clientSecret the secret for the OAuth client
     * @param {string} redirect the redirect URI for the OAuth client
     * @memberof MixerAuthenticator
     */
    public async setup(clientId: string, clientSecret: string, redirect: string) {
        this.headers["client_id"] = clientId;
        this.headers["client_secret"] = clientSecret;
        this.headers["redirect_uri"] = redirect;
    }

    /**
     * Refresh an authorization token.
     *
     * @param {string} refreshToken the refresh token to use
     * @param {string} account the who's key is getting refreshed.
     * @memberof MixerAuthenticator
     */
    public async refreshToken(refreshToken: string, account: string) {
        Logger.info("Services", `Mixer: Refreshing OAuth for: ${account}.`);
        // Get the new tokens
        const result = await this.request("refresh_token", {refresh_token: refreshToken});
        // Emit to the rest of the app that accounts with that name need to reconnect with the new token
        console.log("Last refresh", result.refresh_token);
        this.emit("mixer:reauthenticate", result, account);
        Logger.info("Services", `Mixer: Reauthenticating '${account}' in ${result.expires_in} seconds.`);
        setTimeout(() => this.refreshToken(result.refresh_token, account), result.expires_in * 1000)
    }

    private async request(requestType: "refresh_token" | "authorization_code", extraData: Data): Promise<AuthenticationData> {
        let request = `${this.mixerURL}/oauth/token`;
        extraData["client_id"] = this.headers["client_id"];
        extraData["client_secret"] = this.headers["client_secret"];
        extraData["grant_type"] = requestType;

        const result = await axios.post(request, extraData)
        if (result.status !== 200) {
            throw new Error("Request for Mixer authentication was NON-200!");
        }
        return result.data;
    }
}
