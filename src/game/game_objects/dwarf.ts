import { EntityBuilder } from "../../util/entityBuilder";
import { monsters1, spellIcons } from "../data/spritesheetMaps";
import { flagForCleanup, WhenCleanedUp } from "../systems/cleanupSystem";
import { Vitality } from "../systems/damageSystem";
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
        .createRelated(WhenSpriteCreated, (sprite: Phaser.GameObjects.Sprite) => {
            if (physicsGroup) {
                physicsGroup.add(sprite);
                (sprite.body as Phaser.Physics.Arcade.Body)
                    .setCircle(16)
                    .setVelocity(...xy('SW', 2*Step))
                ;
            }
            
            // Set up wobble tween
            sprite.scene.tweens.add({
                targets: sprite,
                angle: { from: -3, to: 3 },
                yoyo: true,
                repeat: -1,
                duration: 400,
                delay: Phaser.Math.Between(0, 500),
                ease: 'Circ.inout'
            });
            sprite.flipX = true;

            flagForCleanup(world, sprite.data.get('eid'), 20000);

            new EntityBuilder(world, sprite.data.get('eid')).createRelated(WhenCleanedUp, (eid: number) => {
                if (ecs.hasComponent(world, eid, Vitality) && Vitality.current[eid] <= 0) {

                    const count = -5*Math.log(Phaser.Math.Between(1, 100)/100);
                    //console.log('Dwarf', myDwarf, 'expired, creating', count, 'particles');

                    const particles = sprite.scene.add.particles(sprite.x, sprite.y, 'spellIcons', {
                        frame: spellIcons.indexOf.Coin,
                        scaleX: {values: [.5, 0, .5, 0, .5] },
                        lifespan: count > 0 ? {min: 800, max: 1500} : {min: 2000, max: 2500},
                        scaleY: 0.5,
                        speed: {min: 150, max: 450},
                        angle: {min: 255, max: 285},
                        bounce: .8,
                        gravityY: 1200,
                        bounds: new Phaser.Geom.Rectangle(sprite.x - 400, sprite.y - 200, 800, 220),
                        advance: 50,
                        frequency: 10,
                        stopAfter: count > 0 ? count : 150,
                        blendMode: 'Normal',
                        active: true,
                    });
                    sprite.scene.time.delayedCall(5000, () => particles.destroy() );
                }
            });
        });
}