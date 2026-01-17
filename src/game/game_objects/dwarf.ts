import { EntityBuilder } from "../../util/entityBuilder";
import { monsters1 } from "../data/spritesheetMaps";
import { flagForCleanup } from "../systems/cleanupSystem";
import { Vitality } from "../systems/damageSystem";
import { Loot } from "../systems/lootSystem";
import { SpriteConfig, WhenSpriteCreated } from "../systems/spriteManager";
import { Step, xy } from "../world/parameters";
//import { fadeOutAndDestroy } from "./effects";

import * as ecs from 'bitecs';

export function createDwarf(world: ecs.World, x: number, y: number, physicsGroup?: Phaser.Physics.Arcade.Group) {

    return new EntityBuilder(world)
        .addSoA(Vitality, {
            current: 40,
            max: 40,
            min: 0,
        })
        .addAoS(SpriteConfig, {
            x: x,
            y: y,
            textureKey: 'monsters1',
            frame: monsters1.indexOf.Dwarf,
            origin: [0.5, 1],
            scale: 1,
            depth: 1,
        })
        .addSoA(Loot, {})
        .createRelated(WhenSpriteCreated, (sprite: Phaser.GameObjects.Sprite) => {
            if (physicsGroup) {
                physicsGroup.add(sprite);
                (sprite.body as Phaser.Physics.Arcade.Body)
                    .setCircle(16)
                    .setVelocity(...xy('SW', 2*Step))
                ;
            }
            
            // Set up wobble tween
            const animation = sprite.scene.tweens.add({
                targets: sprite,
                angle: { from: -3, to: 3 },
                yoyo: true,
                repeat: -1,
                duration: 400,
                delay: Phaser.Math.Between(0, 500),
                ease: 'Circ.inout'
            });
            sprite.on('destroy', () => animation.destroy() ); // Have to make sure the tween is cleaned up manually

            sprite.flipX = true;

            flagForCleanup(world, sprite.data.get('eid'), 20000, false);
        });
}