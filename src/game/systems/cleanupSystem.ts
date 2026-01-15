import * as ecs from 'bitecs';

// Can optionally set a delay (in ms) before cleanup occurs.
// If the entity is flagged multiple times, I'm pretty sure the last one wins.
export function flagForCleanup(world: ecs.World, eid: number, when: number = 0) {
    ecs.addComponent(world, eid, Cleanup);
    Cleanup.when[eid] = when;
}

export const WhenCleanedUp = ecs.createRelation(
    ecs.withAutoRemoveSubject,
    ecs.makeExclusive,
    ecs.withStore(() => [] as ((eid: number) => void)[] )
);

export function cleanupEntities(world: ecs.World, _: number, delta: number) {
    for (const eid of ecs.query(world, [Cleanup])) {

        Cleanup.when[eid] -= delta;
        if (Cleanup.when[eid] <= 0) {

            // First, call all the callbacks.
            for (const scriptEID of ecs.query(world, [WhenCleanedUp(eid)])) {
                const script = WhenCleanedUp(scriptEID)[eid];
                script(eid);
                ecs.removeEntity(world, scriptEID);
            }

            // Then, remove entity.
            ecs.removeEntity(world, eid);

            // Notes:
            // Any relations having withAutoRemoveSubject will be unceremoniously removed
            // and their cleanup callbacks will not run.
        }
    }
}

 // Can't add directly, you have to use the flagging function.
const Cleanup = {
    when: [] as number[]
};