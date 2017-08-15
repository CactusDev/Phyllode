
import { default as axios } from "axios";

export interface Chats {
    authkey: string;
    endpoints: string[];
}

export class MixerAPI {

    constructor(protected baseURL: string) {

    }

    public async getChannelId(channelName: string, headers?: any): Promise<number> {
        const result = await axios.get(`${this.baseURL}/channels/${channelName}?fields=id`);
        if (result.status !== 200) {
            return -1;
        }
        return result.data.id;
    }

    public async getUserId(channelName: string, headers?: any): Promise<number> {
        const result = await axios.get(`${this.baseURL}/channels/${channelName}?fields=userId`);
        if (result.status !== 200) {
            return -1;
        }
        return result.data.userId;
    }

    public async getChannelName(channelName: string, headers?: any): Promise<string> {
        const result = await axios.get(`${this.baseURL}/channels/${channelName}?fields=token`);
        if (result.status !== 200) {
            return "";
        }
        return result.data.userId;
    }

    public async getCurrentUserName(headers: any): Promise<string> {
        const result = await axios.get(`${this.baseURL}/users/current`, {headers: headers});
        if (result.status !== 200) {
            return "";
        }
        return result.data.username;
    }

    public async getChats(channel: number, headers: any): Promise<Chats> {
        const result = await axios.get(`${this.baseURL}/chats/${channel}`, {headers: headers});
        if (result.status !== 200) {
            // This is bad
            return null;
        }
        return result.data;
    }
}
