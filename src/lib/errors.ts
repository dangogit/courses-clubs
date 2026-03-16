/** Thrown when a user's tier level is insufficient for an action */
export class TierAccessError extends Error {
  constructor(public requiredTierLevel: number) {
    super(`Tier level ${requiredTierLevel} required`);
    this.name = "TierAccessError";
  }
}
