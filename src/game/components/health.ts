import { Broadcaster } from "../../util/broadcaster.js";

export function healthComponent(maxHealth: number) {
    var currentHealth = maxHealth;
    const comms = new Broadcaster<{
        modify: (amount: number) => void,
        died: () => void,
    }>();
}