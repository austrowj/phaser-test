import * as z from 'zod';

export class WyvernDriver {
    private currentHeading: Heading = 'S';
    private currentAnimation: string = 'Idle';
    constructor(
        public readonly sprite: Phaser.GameObjects.Sprite,
        private variant: Variant = 'earth',
    ) {
        this.updateAnimation();
    }

    private updateAnimation() {
        this.sprite.play(this.variant + "_" + this.currentAnimation + '_' + this.currentHeading, true);
    }

    public setHeading(heading: Heading) {
        this.currentHeading = heading;
        this.updateAnimation();
    }

    public setAnimation(animation: string) {
        this.currentAnimation = animation;
        this.updateAnimation();
    }
    
    public getHeadingVector(): Phaser.Math.Vector2 {
        return Headings[this.currentHeading].vector;
    }

    public getHeadingConeAngleDegrees(): {min: number, max: number} {
        const headingVector = this.getHeadingVector();
        const base = Phaser.Math.RadToDeg(Math.atan2(headingVector.y, headingVector.x));
        return {min: base - 20, max: base + 20};
    }
}

export type Heading = keyof typeof Headings;

type Behavior = keyof typeof Behaviors;
type WyvernFrameIndex = typeof Headings[keyof typeof Headings]['index'];

const Variants = ['earth', 'air', 'fire', 'water'] as const;
type Variant = typeof Variants[number];
function variantSpriteKey(variant: Variant): string {
    return 'wyvern_' + variant;
}

const Headings = {
    W:  { index: 0, vector: new Phaser.Math.Vector2(-1,  0).normalize() },
    NW: { index: 1, vector: new Phaser.Math.Vector2(-2, -1).normalize() },
    N:  { index: 2, vector: new Phaser.Math.Vector2( 0, -1).normalize() },
    NE: { index: 3, vector: new Phaser.Math.Vector2( 2, -1).normalize() },
    E:  { index: 4, vector: new Phaser.Math.Vector2( 1,  0).normalize() },
    SE: { index: 5, vector: new Phaser.Math.Vector2( 2,  1).normalize() },
    S:  { index: 6, vector: new Phaser.Math.Vector2( 0,  1).normalize() },
    SW: { index: 7, vector: new Phaser.Math.Vector2(-2,  1).normalize() },
} as const;

const Behaviors = {
    Hover:   { index: 0, frames: {start: 0, end: 7} },
    Fly:     { index: 1, frames: {start: 0, end: 7} },
    Sting:   { index: 2, frames: {start: 0, end: 7} },
    Breathe: { index: 3, frames: {start: 0, end: 8} },
    Ram:     { index: 4, frames: {start: 0, end: 7} },
    Hit:     { index: 5, frames: {start: 0, end: 7} },
    Die:     { index: 6, frames: {start: 0, end: 7} },
} as const;

type WyvernAnimationDefinitions = z.infer<typeof WyvernAnimationDefinitions>;
const WyvernAnimationDefinitions = z.record(
    z.string(),
    z.strictObject({
        base: z.enum(['Hover', 'Fly', 'Sting', 'Breathe', 'Ram', 'Hit', 'Die']),
        animConfig: z.strictObject({
            frameRate: z.number().optional(),
            duration: z.number().optional(),
            skipMissedFrames: z.boolean().optional(),
            delay: z.number().optional(),
            repeat: z.number().optional(),
            repeatDelay: z.number().optional(),
            yoyo: z.boolean().optional(),
            showBeforeDelay: z.boolean().optional(),
            showOnStart: z.boolean().optional(),
            hideOnComplete: z.boolean().optional(),
            randomFrames: z.boolean().optional()
        }),
        framesTemplate: z.array(z.strictObject({
            frame: z.literal(0).or(z.literal(1)).or(z.literal(2)).or(z.literal(3)).or(z.literal(4)).or(z.literal(5)).or(z.literal(6)).or(z.literal(7)),
            duration: z.number().optional(),
            visible: z.boolean().optional()
        }))
    })
);

/** This looks super cursed but it should work.
    The idea is that you can pass any type of animation config and frame data,
    then this will generate the configs for all 8 heading variants.
*/
function createAnimationConfigs(
    key: string,
    variant: Variant,
    params: {
        base: Behavior,
        animConfig: Omit<Phaser.Types.Animations.Animation, 'frames' | 'defaultTextureKey' | 'key'>,
        framesTemplate: (Omit<Phaser.Types.Animations.AnimationFrame, 'key'> & {frame: WyvernFrameIndex})[]
    }
): Phaser.Types.Animations.Animation[] {

    return Object.entries(Headings).map(([heading, headingData]) => ({
        ...params.animConfig,
        defaultTextureKey: variantSpriteKey(variant),
        frames: params.framesTemplate.map(frame => ({
            ...frame,
            frame:
                frame.frame
                + Behaviors[params.base].index*8
                + headingData.index*8*7
        })),
        key: key + '_' + heading
    }));
}

export function load(scene: Phaser.Scene) {

    Variants.forEach(variant => {
        scene.load.spritesheet(
            'wyvern_' + variant,
            'character/wyvern_' + variant + '.png',
            { frameWidth: 256, frameHeight: 256 }
        );
    });

    scene.load.json('wyvernAnimations', '../data/wyvernAnimations.json');
    scene.load.on('complete', () => { // Eagerly register all the animations for every variant.
        try {
            const rawData = scene.cache.json.get('wyvernAnimations');
            const parsedDefs = WyvernAnimationDefinitions.parse(rawData);

            Object.entries(parsedDefs).forEach(([key, args]) => {
                Object.entries(Variants).forEach(([_, variant]) => {
                    const newAnims = createAnimationConfigs(variant + '_' + key, variant, args);
                    newAnims.forEach(config => { scene.anims.create(config); });
                });
            });
        } catch (error) {
            console.error("Failed to load wyvern animations JSON:", error);
        }
    });
}
