/* eslint-disable */
type LocationGridConfig = {
	gridId: string;
	filterId: string;
	addUrl: string;
	editUrlTemplate: string;
	importUrl: string;
	batchController: string;
};

type ConfirmationDialogDependencies = {
	Dialog: new (options: ConfirmationDialogOptions) => ConfirmationDialog;
	Button: new (options: ConfirmationButtonOptions) => unknown;
	buttonSizeLarge: string;
	buttonStyleFilled: string;
	buttonStyleOutline: string;
};

type ConfirmationDialogOptions = {
	title: string;
	content: HTMLElement;
	centerButtons: unknown[];
	hasOverlay: boolean;
	hasCloseButton: boolean;
	closeByEsc: boolean;
};

type ConfirmationDialog = {
	show: () => void;
	hide: () => void;
};

type ConfirmationButtonOptions = {
	text: string;
	size: string;
	style: string;
	useAirDesign: boolean;
	onclick: () => void;
};

declare namespace BX.Crm.Config {
	class LocationGridManager {
		static Instance: LocationGridManager | null;
		constructor(config: LocationGridConfig, confirmationDialogDependencies?: ConfirmationDialogDependencies);
		init(): void;
		reload(): void;
		openAdd(): void;
		openImport(): void;
		deleteSelected(): void;
		confirmDelete(locationName: string, onConfirm: () => void): void;
	}
}
