
export interface HandlerType {
	target: any,
	depends: any[]
};

export let HANDLERS: HandlerType[] = [];

export * from "./annotation";

export * from "./messages";
export * from "./events";
