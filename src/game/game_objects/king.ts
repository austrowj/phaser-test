import { EntityBuilder } from '../../util/entityBuilder';
import { monsters4 } from '../data/spritesheetMaps';
import { flagForCleanup } from '../systems/cleanupSystem';
import { Vitality } from '../systems/damageSystem';
import { Loot } from '../systems/lootSystem';
import { WhenSpriteCreated } from '../systems/spriteManager';
import { SpriteConfig } from '../systems/spriteManager';
import { Step, xy } from '../world/parameters';

import * as ecs from 'bitecs';

export function createKing(world: ecs.World, x: number, y: number, physicsGroup?: Phaser.Physics.Arcade.Group) {

    return new EntityBuilder(world)
        .addSoA(Loot, {})
        .addSoA(Vitality, { current: 20, max: 20, min: 0 })
        .addAoS(SpriteConfig, {
            x: x,
            y: y,
            textureKey: 'monsters4',
            frame: monsters4.indexOf.KingArthur,
            origin: [0.5, 1],
            scale: 1,
            depth: 1,
        })
        .createRelated(WhenSpriteCreated, (sprite: Phaser.GameObjects.Sprite) => {
            sprite.setCrop(1, 0, sprite.width - 2, sprite.height);

            if (physicsGroup) {
                physicsGroup.add(sprite);
                (sprite.body as Phaser.Physics.Arcade.Body)
                    .setCircle(16)
                    .setVelocity(...xy('SW', 2*Step))
                ;
            }
            
            flagForCleanup(world, sprite.data.get('eid'), 20000, false);
        });
}