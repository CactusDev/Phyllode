import { Injectable } from "@angular/core";
const winston = require("winston");
let logger = new (winston.Logger)();

@Injectable()
export class Logger {
    // public static winston: Winston.LoggerInstance = new Winston.Logger();

    public static setup() {
        winston.addColors({
            info: "green",
            warn: "yellow",
            error: "red"
        });

        winston.loggers.add("services", {
            console: {
                level: "debug",
                colorize: true,
                label: "Services"
            }
        });

        winston.loggers.add("cereus", {
            console: {
                level: "debug",
                colorize: true,
                label: "Cereus"
            }
        });

        winston.loggers.add("services", {
            console: {
                level: "debug",
                colorize: true,
                label: "Services"
            }
        });
    }

    public static info(container: string, msg: string) {
        container = container.toLowerCase();
        winston.loggers.get(container).info(msg);
    }

    public static warn(container: string, msg: string) {
        container = container.toLowerCase();
        winston.loggers.warn(container).warn(msg);
    }

    public static error(container: string, msg: string) {
        container = container.toLowerCase();
        winston.loggers.eror(container).error(msg);
    }
}
