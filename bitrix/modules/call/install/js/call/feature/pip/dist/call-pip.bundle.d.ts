/* eslint-disable */
interface WindowVisibilityPort {
	start(): void;
	stop(): void;
	isHidden(): boolean;
}

interface WindowVisibilityConfig {
	onHide: () => void;
	onShow: () => void;
}

interface AutoPipPolicyConfig {
	togglePip: (active: boolean) => void;
	isScreenSharing: () => boolean;
	isFolded: () => boolean;
	isVideoconf: () => boolean;
	updateButtons: () => void;
	isConnected: () => boolean;
	isShown: () => boolean;
}

interface PipCoordinatorConfig extends AutoPipPolicyConfig {
	isMacDesktop: boolean;
}

declare namespace BX.Call.Feature {
	class DocumentVisibilityAdapter implements WindowVisibilityPort {
		constructor(config: WindowVisibilityConfig);
		isHidden(): boolean;
		start(): void;
		stop(): void;
	}

	class WindowFocusVisibilityAdapter implements WindowVisibilityPort {
		constructor(config: WindowVisibilityConfig);
		isHidden(): boolean;
		start(): void;
		stop(): void;
	}

	class AutoPipPolicy {
		constructor(config: AutoPipPolicyConfig);
		get enableAutoPip(): boolean;
		onDocumentHide(): void;
		onDocumentShow(): void;
		onFocusHide(): void;
		onFocusShow(): void;
		deactivate(): void;
	}

	class PipCoordinator {
		constructor(config: PipCoordinatorConfig);
		get enableAutoPip(): boolean;
		isHidden(): boolean;
		deactivate(): void;
		start(): void;
		stop(): void;
	}
}
