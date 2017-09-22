const winston = require("winston");
let logger = new (winston.Logger)();

export class Logger {

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

        winston.loggers.add("messages", {
            console: {
                level: "debug",
                colorize: true,
                label: "Events"
            }
        });

        winston.loggers.add("events", {
            console: {
                level: "debug",
                colorize: true,
                label: "Events"
            }
        });

        winston.loggers.add("core", {
            console: {
                level: "debug",
                colorize: true,
                label: "Core"
            }
        });
    }

    public static info(container: string, msg: string) {
        if (process.env.TEST) {
            return;
        }
        winston.loggers.get(container.toLowerCase()).info(msg);
    }

    public static warn(container: string, msg: string) {
        if (process.env.TEST) {
            return;
        }
        winston.loggers.get(container.toLowerCase()).warn(msg);
    }

    public static error(container: string, msg: string) {
        if (process.env.TEST) {
            return;
        }
        winston.loggers.get(container.toLowerCase()).error(msg);
    }
}
