/* eslint-disable */
type IncomingCallMountProps = BX.Call.Store.IncomingCallParams & {
	languageId?: string;
	lang?: string;
	title?: string;
};

interface MountResult {
	unmount: () => void;
}

interface IncomingCallConfig {
	callType?: string;
	callerName?: string;
	callerAvatar?: string;
	callerType?: string;
	callerColor?: string;
	video?: boolean;
	hasCamera?: boolean;
	microphoneState?: boolean;
	cameraState?: boolean;
	zIndex?: number;
	onClose?: (...args: unknown[]) => void;
	onDestroy?: (...args: unknown[]) => void;
	onButtonClick?: (...args: unknown[]) => void;
}

declare namespace BX.Call.Application {
	class IncomingCall extends BX.Event.EventEmitter {
		static Events: BX.Call.Mapping.IncomingCallEventMap;
		static mount(container: HTMLElement, props: IncomingCallMountProps): MountResult;
		constructor(config: IncomingCallConfig);
		show(): void;
		setHasCamera(hasCamera: boolean): void;
		close(): void;
		destroy(): void;
		onResize(): void;
	}
}
