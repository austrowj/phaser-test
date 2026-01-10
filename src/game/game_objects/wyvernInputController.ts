import { Heading } from '../world/parameters';
import { WyvernDriver } from './wyvernDriver';

export function createInputControls(keyboard: Phaser.Input.Keyboard.KeyboardPlugin, skillset: WyvernDriver) {

    const bridge = skillset.takeControls();

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

    headingKeyState.forEach((_, key) => key
        .on('down', () => { bridge.steer = updateAimFromKeyState(); })
        .on('up',   () => { bridge.steer = updateAimFromKeyState(); })
    );

    keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.PERIOD)
        .on('down', () => bridge.dash = true)
        .on('up',   () => bridge.dash = false);
    keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.COMMA)
        .on('down', () => bridge.wingBlast = true)
        .on('up',   () => bridge.wingBlast = false);
    keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE)
        .on('down', () => bridge.breathe = true)
        .on('up',   () => bridge.breathe = false);

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
