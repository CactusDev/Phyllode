
import { default as axios } from "axios";
import { Logger } from "../../../logger";

export interface Chats {
    authkey: string;
    endpoints: string[];
}

export class MixerAPI {

    constructor(protected baseURL: string) {

    }

    public async getChannelId(channelName: string, headers?: any): Promise<number> {
        const result = await axios.get(`${this.baseURL}/channels/${channelName}`);
        if (result.status !== 200) {
            return -1;
        }
        return result.data.id;
    }

    public async getUserId(channelName: string, headers?: any): Promise<number> {
        const result = await axios.get(`${this.baseURL}/channels/${channelName}`);
        if (result.status !== 200) {
            return -1;
        }
        return result.data.userId;
    }

    public async getChannelName(channelId: number, headers?: any): Promise<string> {
        const result = await axios.get(`${this.baseURL}/channels/${channelId}`);
        if (result.status !== 200) {
            return "";
        }
        return result.data.token;
    }

    public async getCurrentUserName(headers: any): Promise<string> {
        const result = await axios.get(`${this.baseURL}/users/current`, {headers: headers});
        if (result.status !== 200) {
            return "";
        }
        return result.data.username;
    }

    public async getChats(channel: number, headers: any): Promise<Chats> {
        let result = {status: 201, data: ""};

        try {
            result = await axios.get(`${this.baseURL}/chats/${channel}`, {headers: headers});
        } catch (e) {
            return null;
        }

        if (result.status !== 200) {
            // This is bad
            return null;
        }
        return result.data;
    }
}
