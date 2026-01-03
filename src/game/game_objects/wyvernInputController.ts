import { Communicator } from '../../util/communicator';
import { Heading } from './wyvernAnimationDriver';
import { Controls } from './wyvernSkillset';

export function connectInputControls(
    keyboard: Phaser.Input.Keyboard.KeyboardPlugin,
    bridge = new Communicator<Controls>(),
) {
    const headingKeyState = new Map<Phaser.Input.Keyboard.Key, number>([
        [keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W), 0x1],
        [keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A), 0x2],
        [keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S), 0x4],
        [keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D), 0x8]
    ]);

    function updateAimFromKeyState() {
        var key_state = 0;
        headingKeyState.forEach((bit, key) => {
            if (key.isDown) {
                key_state |= bit;
            }
        });
        return keyStateToDirection.get(key_state);
    }

    headingKeyState.forEach((_, key) => {
        key.on('down', () => { bridge.send('steer', updateAimFromKeyState()); });
        key.on('up',   () => { bridge.send('steer', updateAimFromKeyState()); });
    });
    keyboard.on('keydown-PERIOD', () => { bridge.send('dash'); });
    keyboard.on('keydown-COMMA',  () => { bridge.send('breath'); });
    keyboard.on('keyup-COMMA',    () => { bridge.send('interruptBreath'); });

    return bridge;
}

const keyStateToDirection: Map<number, Heading> = new Map([
    [0x1, 'N'],
    [0x3, 'NW'],
    [0x2, 'W'],
    [0x6, 'SW'],
    [0x4, 'S'],
    [0xC, 'SE'],
    [0x8, 'E'],
    [0x9, 'NE']
]);
