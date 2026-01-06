export class StateMachine<S extends string> {

    private host = new Phaser.Events.EventEmitter();
    constructor(private state: S) {}

    public when<E extends `${'enter' | 'leave' | 'tick'}_${S}`>(event: E, callback: () => void) {
        this.host.on(event, callback);
        return this;
    }

    public once<E extends `${'enter' | 'leave' | 'tick'}_${S}`>(event: E, callback: () => void) {
        this.host.once(event, callback);
        return this;
    }

    public go(to: S) {
        this.host.emit(`leave_${this.state}`);
        this.state = to;
        this.host.emit(`enter_${this.state}`);
    }

    public startTick(scene: Phaser.Scene) {
        scene.events.on('update', () => { this.host.emit(`tick_${this.state}`); });
    }
}