export class StateMachine<S extends string> {

    private ping = new Phaser.Events.EventEmitter();
    private pong = new Phaser.Events.EventEmitter();
    constructor(private state: S) {}

    public allow<F extends S, T extends Exclude<S, F>>(from: F, to: T) {
        this.ping.on(to, () => {
            if (this.state === from) {
                this.state = to;
                this.pong.emit(`leave_${from}`);
                this.pong.emit(`enter_${to}`);
            }
        });
        return this;
    }

    public when<E extends `${'enter' | 'leave' | 'tick'}_${S}`>(event: E, callback: () => void) {
        this.pong.on(event, callback);
        return this;
    }

    public once<E extends `${'enter' | 'leave' | 'tick'}_${S}`>(event: E, callback: () => void) {
        this.pong.once(event, callback);
        return this;
    }

    public send(event: S) { this.ping.emit(event); }

    public startTick(scene: Phaser.Scene) {
        scene.events.on('update', () => { this.pong.emit(`tick_${this.state}`); });
    }
}