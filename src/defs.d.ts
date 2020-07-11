
type ServiceType = "Twitch" | "Mixer" | "Discord";

interface ServiceEvent {
    type: "event";
    event: string;
    target: string | null;
    channel: string;
    service: ServiceType;
    extra: any;
}
