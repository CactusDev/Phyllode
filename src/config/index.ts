
export class Config {

    public core: {
        api_url: string;
        // This is temp, will be removed when we have an api
        authentication: {
            cactusbotdev: {
                twitch: string;
                mixer: string;
            }
        };
        oauth: {
            mixer: {
                clientId: string;
                clientSecret: string;
                redirectURI: string;
            },
            discord: {
                auth: string;
            }
        }
    }
}
