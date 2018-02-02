
export abstract class AbstractServiceParser {
    public abstract async parse(message: ProxyMessage): Promise<CactusContext | null>;
    public abstract async synthesize(message: CactusContext[]): Promise<ProxyResponse[]>;
}
