import * as ecs from 'bitecs';
import { flagForCleanup } from './cleanupSystem';

export const Vitality = {
    current: [] as number[],
    max: [] as number[],
    min: [] as number[]
}

export const Damaging = ecs.createRelation(
    ecs.withAutoRemoveSubject,
    ecs.makeExclusive,
    ecs.withStore(() => ({
        amount: [] as number[]
    }))
);

export function updateVitality(world: ecs.World) {

    // Process damage (/healing?) on all entities with Vitality.
    for (const eid of ecs.query(world, [Vitality])) {
        for (const damageEID of ecs.query(world, [Damaging(eid)])) {

            Vitality.current[eid] = Math.min(Vitality.max[eid],
                Math.max(Vitality.min[eid],
                    Vitality.current[eid] - Damaging(damageEID).amount[eid]
                )
            );

        }

        if (Vitality.current[eid] <= 0) {
            flagForCleanup(world, eid);
        }
    }

    // Then flag all damage instances for removal (even those on entites without Vitality).
    for (const damageEID of ecs.query(world, [Damaging(ecs.Wildcard)])) {
        flagForCleanup(world, damageEID);
    }
    
}
