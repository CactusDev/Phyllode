
import { Logger } from "../logger";

export function Service(name: string) {
    return (target: Function) => {
        if (Reflect.hasMetadata("annotation:service:registration", target)) {
            Logger.error("Services", `Attempt to reregister service ${name} on ${target.name}.`);
            return;
        }
        Reflect.defineMetadata("annotation:service:registration", Service, target);

        target.prototype.serviceName = name;
        target.prototype.registered = true;
        Logger.info("Services", `"${name}" has been registered!`);
    };
}
