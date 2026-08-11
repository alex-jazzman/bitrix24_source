export interface WindowVisibilityConfig {
	onHide: () => void;
	onShow: () => void;
}

export interface WindowVisibilityPort {
	start(): void;
	stop(): void;
	isHidden(): boolean;
}
