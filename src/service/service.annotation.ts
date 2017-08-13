
import { Logger } from "../logger";

export function Service(name: string) {
    return (target: Function) => {
        if (Reflect.hasMetadata("annotation:service:registration", target)) {
            throw new Error("Service already registered.");
        }
        Reflect.defineMetadata("annotation:service:registration", Service, target);

        target.prototype.serviceName = name;
        target.prototype.registered = true;
        Logger.info("Services", `Service "${name}" has been registered!`);
    };
}
