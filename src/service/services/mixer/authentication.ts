
import * as httpm from "typed-rest-client/HttpClient";

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
 * @class MixerAuthenticater
 */
export class MixerAuthenticater {

    private mixerURL = "https://mixer.com/api/v1";
    private httpc: httpm.HttpClient = new httpm.HttpClient("aerophyl");

    private headers: any = {};

    /**
     * Setup the authenticater for use with accounts.
     *
     * @param {string} clientId the id for the OAuth client
     * @param {string} clientSecret the secret for the OAuth client
     * @param {string} redirect the redirect URI for the OAuth client
     * @memberof MixerAuthenticater
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
     * @memberof MixerAuthenticater
     */
    public async refreshToken(refreshToken: string) {

    }

    private async request(requestType: "refresh_token " | "authorization_code", extraData: Data): Promise<AuthenticationData> {
        let request = `${this.mixerURL}/oauth/token`;
        extraData["client_id"] = this.headers["client_id"];
        extraData["client_secret"] = this.headers["client_secret"];

        const result = await this.httpc.post(request, JSON.stringify(extraData));
        if (await result.message.statusCode !== 200) {
            throw new Error("Request for Mixer authentication was NON 200!");
        }

        return JSON.parse(await result.readBody());
    }
}
