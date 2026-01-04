export class Communicator<EventMap extends Record<string, (...args: any[]) => void>> {

    private emitter: Phaser.Events.EventEmitter = new Phaser.Events.EventEmitter();

    public when<K extends keyof EventMap & string>(event: K, callback: EventMap[K]) {
        this.emitter.on(event, callback);
        return this;
    }

    public send<K extends keyof EventMap & string>(event: K, ...args: Parameters<EventMap[K]>) {
        this.emitter.emit(event, ...args);
    }

    public removeListeners() {
        this.emitter.removeAllListeners();
    }

}