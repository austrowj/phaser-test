import { WyvernDriver } from "./wyvernDriver";
import { ChangeAnimation, ChangeHeading, SpriteComponent, WyvernAnimation } from "./animatedWyvern";

import * as ecs from 'bitecs';

const sizeConfig = {
    'small':  { scale: 0.25, rate: 1.5, topSpeed: 300 },
    'medium': { scale: 0.50, rate: 1.0, topSpeed: 200 },
    'large':  { scale: 1.00, rate: 0.7, topSpeed: 150 }
}

export type Wyvern = ReturnType<typeof createWyvern>;

export function createWyvern(
    world: ecs.World,
    sprite: Phaser.GameObjects.Sprite,
    skillset: WyvernDriver,
    effectsGroup: Phaser.Physics.Arcade.Group,
    size: keyof typeof sizeConfig = 'medium',
) {
    const eid = ecs.addEntity(world);

    ecs.addComponent(world, eid, SpriteComponent);
    SpriteComponent.sprite[eid] = sprite;

    ecs.addComponent(world, eid, WyvernAnimation);

    // Make sure physics are configured.
    const body = sprite.body as Phaser.Physics.Arcade.Body;
    body.setCircle(20, 108, 100);
    sprite.setScale(sizeConfig[size].scale);

    // Adjust animation speed based on size.
    sprite.anims.timeScale = sizeConfig[size].rate;
    skillset.setTimeRate(sizeConfig[size].rate);

    // Connect the controller to the animation driver and the physics body.
    skillset.comms
        .when('setAnimation', (animation) => {
            ecs.addComponent(world, eid, ChangeAnimation);
            ChangeAnimation.animation[eid] = animation;
        })
        .when('setHeading', (heading) => {
            ecs.addComponent(world, eid, ChangeHeading);
            ChangeHeading.heading[eid] = heading;
            
        })
        .when('stop', () => body.setVelocity(0, 0))
        .when('go', (vector, scale) => body.setVelocity(
            vector.x * scale * sizeConfig[size].topSpeed,
            vector.y * scale * sizeConfig[size].topSpeed
        ))
        .when('useSkill', (callback) => callback(sprite, effectsGroup, 'S'));
    
    skillset.startTick(sprite.scene);
    return { sprite: sprite, skillset, size };
}
