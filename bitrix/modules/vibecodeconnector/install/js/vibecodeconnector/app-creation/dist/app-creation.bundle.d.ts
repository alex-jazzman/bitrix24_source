/* eslint-disable */
type AppCreationOptions = {
	analytics?: AppCreationAnalytics;
	onOpen?: (mode: AppCreationMode) => void;
	onClose?: () => void;
};

type AppCreationAnalytics = {
	tool: string;
	category: string;
	[key: string]: string;
};

type AppCreationMode = 'create' | 'fallback';

declare namespace BX.Vibecodeconnector {
	function isAppCreationAvailable(): boolean;

	function openAppCreation(options?: AppCreationOptions): void;

	function bindAppCreation(node: Element, options?: AppCreationOptions): (() => void) | null;
}
