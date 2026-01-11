import { Heading } from '../world/parameters';
import * as ecs from 'bitecs';
import { Controls } from './wyvernDriver';

export function createInputControlSystem(keyboard: Phaser.Input.Keyboard.KeyboardPlugin) {

    const headingKeyState = new Map<Phaser.Input.Keyboard.Key, number>([
        [keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W), 0x1],
        [keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A), 0x2],
        [keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S), 0x4],
        [keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D), 0x8]
    ]);
    const dashKey = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.PERIOD);
    const wingBlastKey = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.COMMA);
    const breatheKey = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    
    return (world: ecs.World) => {
        for (const eid of ecs.query(world, [Controls])) {

            var key_state = 0;
            headingKeyState.forEach((bit, key) => {
                if (key.isDown) {
                    key_state |= bit;
                }
            });
            Controls.steer[eid] = keyStateToDirection.get(key_state);

            Controls.dash[eid] = dashKey.isDown;
            Controls.wingBlast[eid] = wingBlastKey.isDown;
            Controls.breathe[eid] = breatheKey.isDown;
        }
    }
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
