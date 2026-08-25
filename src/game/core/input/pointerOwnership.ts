export type PointerOwnerState = {
  active: boolean;
  id: number;
};

export function tryClaimPointer(
  state: PointerOwnerState,
  pointerId: number,
) {
  if (state.active) return false;
  state.active = true;
  state.id = pointerId;
  return true;
}

export function releaseClaimedPointer(
  state: PointerOwnerState,
  pointerId: number,
) {
  if (pointerId !== state.id) return false;
  state.active = false;
  state.id = -1;
  return true;
}
