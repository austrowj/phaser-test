export type Heading = keyof typeof HeadingVectors;
export const HeadingVectors = {
    N:  new Phaser.Math.Vector2( 0, -1).normalize(),
    NE: new Phaser.Math.Vector2( 2, -1).normalize(),
    E:  new Phaser.Math.Vector2( 1,  0).normalize(),
    SE: new Phaser.Math.Vector2( 2,  1).normalize(),
    S:  new Phaser.Math.Vector2( 0,  1).normalize(),
    SW: new Phaser.Math.Vector2(-2,  1).normalize(),
    W:  new Phaser.Math.Vector2(-1,  0).normalize(),
    NW: new Phaser.Math.Vector2(-2, -1).normalize(),
} as const;
