/**
 * Both callbacks answer whether the default action of the key has to be suppressed.
 */
export interface KeyboardConfig {
	onKeyDown: (repeat: boolean, targetActivatesOnSpace: boolean) => boolean;
	onKeyUp: () => boolean;
}

export interface KeyboardPort {
	start(): void;
	stop(): void;
}
