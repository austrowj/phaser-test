//import { Initialize } from '../../util/initComponent';
import { Heading } from '../world/parameters';
import * as ecs from 'bitecs';
import { Wyvern, WyvernState, WyvernVariant } from './wyvernDriver';
import { Sprite } from '../systems/spriteManager';

// Designed for external use and/or reference.
export function load(scene: Phaser.Scene) { loadInternal(scene); }

export const WyvernAnimation = {
    state: [] as WyvernState[],
    variant: [] as WyvernVariant[],
    heading: [] as Heading[],
};

export function syncWyvernAnimation(world: ecs.World) {
    for (const eid of ecs.query(world, [Wyvern, WyvernAnimation, Sprite])) {
        syncSprite(eid, Sprite[eid]);
    }
}

function syncSprite(eid: number, sprite: Phaser.GameObjects.Sprite) {

    if (!sprite.anims.isPlaying) {
        sprite.anims.timeScale = Wyvern.timeRate[eid];
        sprite.anims.play(animationKey(
            WyvernAnimation.variant[eid],
            WyvernAnimation.state[eid],
            WyvernAnimation.heading[eid],
        ));
    }

    if (WyvernAnimation.heading[eid] !== Wyvern.heading[eid]) {
        WyvernAnimation.heading[eid] = Wyvern.heading[eid];
        const curFrame = sprite.anims.currentFrame;
        sprite.anims.play({
            key: animationKey(
                WyvernAnimation.variant[eid],
                WyvernAnimation.state[eid],
                WyvernAnimation.heading[eid],
            ),
            // Have to check if last frame, otherwise phaser doesn't find the next frame correctly and crashes.
            startFrame: curFrame !== null && !curFrame.isLast ? curFrame.index : 0,
        });
    }

    if (WyvernAnimation.state[eid] !== Wyvern.state[eid]) {
        WyvernAnimation.state[eid] = Wyvern.state[eid];
        sprite.anims.play(animationKey(
            WyvernAnimation.variant[eid],
            WyvernAnimation.state[eid],
            WyvernAnimation.heading[eid],
        ), true);
    }

    if (WyvernAnimation.variant[eid] !== Wyvern.variant[eid]) {
        WyvernAnimation.variant[eid] = Wyvern.variant[eid];
        sprite.anims.play(animationKey(
            WyvernAnimation.variant[eid],
            WyvernAnimation.state[eid],
            WyvernAnimation.heading[eid],
        ), true);
    }
}

// Internal definitions below.

function animationKey(
    variant: WyvernVariant,
    animation: WyvernState,
    heading: Heading,
): AnimationKey { return `${variant}_${animation}_${heading}`; }

const HeadingIndexes = {
    W:  0,
    NW: 1,
    N:  2,
    NE: 3,
    E:  4,
    SE: 5,
    S:  6,
    SW: 7,
} as const satisfies Record<Heading, number>;
type WyvernFrameIndex = typeof HeadingIndexes[keyof typeof HeadingIndexes];

type AnimationKey = `${WyvernVariant}_${WyvernState}_${Heading}`;

const BaseBehaviors = {
    Hover:   { index: 0 },
    Fly:     { index: 1 },
    Sting:   { index: 2 },
    Breathe: { index: 3 },
    Ram:     { index: 4 },
    Hit:     { index: 5 },
    Die:     { index: 6 },
} as const;
type BaseBehavior = keyof typeof BaseBehaviors;

type AnimationParams = {
    base: BaseBehavior,
    animConfig: Phaser.Types.Animations.Animation & {
        frames?: never,
        defaultTextureKey?: never,
        key?: never,
    },
    framesTemplate: (Phaser.Types.Animations.AnimationFrame & {
        key?: never,
        frame: WyvernFrameIndex
    })[]
}

function createAnimationConfigs(
    key: string,
    variant: WyvernVariant,
    params: AnimationParams
): Phaser.Types.Animations.Animation[] {

    return Object.entries(HeadingIndexes).map(([heading, index]) => ({
        ...params.animConfig,
        defaultTextureKey: "wyvern_" + variant,
        frames: params.framesTemplate.map(frame => ({
            ...frame,
            frame:
                frame.frame
                + BaseBehaviors[params.base].index*8
                + index*8*7
        })),
        key: key + '_' + heading
    }));
}

// Loader function to be called in a Phaser scene's preload().

function loadInternal(scene: Phaser.Scene) {

    WyvernVariant.forEach(variant => {
        //if (variant !== 'earth') { // Skip because we're not using it for testing.
            scene.load.spritesheet(
                'wyvern_' + variant,
                'character/wyvern_' + variant + '.png',
                { frameWidth: 256, frameHeight: 256 }
            );
        //}
    });

    scene.load.on('complete', () => { // Eagerly register all the animations for every variant.
        console.log("Wyvern animations load complete, creating animations...");
        try {
            Object.entries(animationData).forEach(([key, args]) => {
                WyvernVariant.forEach(variant => {
                    const newAnims = createAnimationConfigs(variant + '_' + key, variant, args);
                    newAnims.forEach(config => { scene.anims.create(config); });
                });
            });
        } catch (error) {
            console.error("Failed to load wyvern animations JSON:", error);
        }
        console.log("Wyvern animations created.");
    });
}

// The actual animation data.

// Need a funky IIFE to create the animation data object with proper typing.
const animationData = (<T extends Record<WyvernState, AnimationParams>>(data: T) => data)({
    Idle: {
        base: "Hover",
        animConfig: {
            frameRate: 12,
            repeat: -1,
        },
        framesTemplate: [
            { frame: 0 }, { frame: 1 }, { frame: 2 }, { frame: 3 },
            { frame: 4 }, { frame: 5 }, { frame: 6 }, { frame: 7 },
        ]
    },
    Move: {
        base: "Fly",
        animConfig: {
            frameRate: 10,
            repeat: -1,
        },
        framesTemplate: [
            { frame: 5 }, { frame: 6 }, { frame: 7 },
            { frame: 0 }, { frame: 1 }, { frame: 2 }, { frame: 3 },
            { frame: 4 },
        ]
    },
    Dash: {
        base: "Ram",
        animConfig: {
            frameRate: 20,
            repeat: 0,
        },
        framesTemplate: [
            { frame: 0 }, { frame: 1 }, { frame: 2 }, { frame: 3, duration: 400 },
            { frame: 4 }, { frame: 5 }, { frame: 6 }, { frame: 7 },
        ]
    },
    BreathAttack:{
        base: "Breathe",
        animConfig : {
            frameRate: 6,
            repeat: -1,
        },
        framesTemplate: [ {frame: 4}, {frame: 5}, {frame: 6}, ]
    },
    WingBlast: {
        base: "Sting",
        animConfig: {
            repeat: 0,
        },
        framesTemplate: [
            { frame: 6, duration: 40 },
            { frame: 5, duration: 40 },
            { frame: 4, duration: 40 },
            { frame: 3, duration: 40 },
            { frame: 2, duration: 40 },
            { frame: 1, duration: 40 },
            { frame: 0, duration: 40 },
            { frame: 1, duration: 100 },
            { frame: 2, duration: 70 },
            { frame: 3, duration: 0 },
        ]
    },
    Slam: {
        base: "Die",
        animConfig: {
            frameRate: 10,
            repeat: 0,
        },
        framesTemplate: [
            { frame: 0 }, { frame: 1 }, { frame: 2 }, { frame: 3 },
            { frame: 4 }, { frame: 5 }, { frame: 6 }, { frame: 7 },
        ]
    },

} as const);
