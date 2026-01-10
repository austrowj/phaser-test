export class Broadcaster<EventMap extends Record<string, (...args: any[]) => void>> {

    private emitter: Phaser.Events.EventEmitter = new Phaser.Events.EventEmitter();

    public when<K extends keyof EventMap & string>(event: K, callback: EventMap[K]) {
        this.emitter.on(event, callback);
        return this;
    }

    public broadcast<K extends keyof EventMap & string>(event: K, ...args: Parameters<EventMap[K]>) {
        this.emitter.emit(event, ...args);
    }

}