import { WyvernAnimationDriver } from "./wyvernAnimationDriver";
import { WyvernBasicSkillset, Controls } from "./wyvernBasicSkillset";
import { Communicator } from "../../util/communicator";

const sizeConfig = {
    'small':  { scale: 0.25, rate: 1.5, topSpeed: 300 },
    'medium': { scale: 0.50, rate: 1.0, topSpeed: 200 },
    'large':  { scale: 1.00, rate: 0.7, topSpeed: 150 }
}

export type Wyvern = ReturnType<typeof createWyvern>;

export function createWyvern(
    sprite: Phaser.GameObjects.Sprite,
    driver: WyvernAnimationDriver,
    skillset: WyvernBasicSkillset,
    size: keyof typeof sizeConfig = 'medium',
    controlBridge?: Communicator<Controls>
) {
    // Make sure physics are configured.
    const body = sprite.body as Phaser.Physics.Arcade.Body;
    body.setCircle(20, 108, 100);
    sprite.setScale(sizeConfig[size].scale);

    // Adjust animation speed based on size.
    sprite.anims.timeScale = sizeConfig[size].rate;
    skillset.setTimeRate(sizeConfig[size].rate);

    // Connect the animation driver to the actual sprite.
    driver.comms.when('change', (animationKey) => sprite.play(animationKey, true));

    // Connect the controller to the animation driver and the physics body.
    skillset.comms
        .when('setAnimation', (animation) => driver.setAnimation(animation))
        .when('setHeading', (heading) => driver.setHeading(heading))
        .when('stop', () => body.setVelocity(0, 0))
        .when('go', (vector, scale) => body.setVelocity(
            vector.x * scale * sizeConfig[size].topSpeed,
            vector.y * scale * sizeConfig[size].topSpeed
        ))
        .when('useSkill', (callback) => callback(sprite, driver.getCurrentHeading()));
    
    if (controlBridge) { skillset.listenTo(controlBridge); }
    
    // Initialize animation state.
    driver.setAnimation('Idle');
    skillset.startTick(sprite.scene);

    return { sprite, driver, skillset, size, controlBridge };
}
