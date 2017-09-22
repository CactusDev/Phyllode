
/**
 * The current status of a channel
 */
interface ChannelStatus {
    connected: boolean;
    reconnecting: boolean;
    botUser: string | number;
    controllerId: string;
}
