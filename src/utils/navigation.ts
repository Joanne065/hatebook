export type AppLocationState = {
  backTo?: string;
  authorFeed?: boolean;
  fromPublish?: boolean;
  /** State to restore when navigating back to the previous section page */
  restoreState?: AppLocationState;
};

export function readLocationState(state: unknown): AppLocationState {
  return (state as AppLocationState | null) ?? {};
}

export function goBack(
  navigate: (to: string, options?: { replace?: boolean; state?: AppLocationState }) => void,
  to: string,
  state?: AppLocationState,
) {
  navigate(to, { replace: true, ...(state ? { state } : {}) });
}
