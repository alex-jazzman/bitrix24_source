export type MeasureGridOptions = Readonly<{
	gridId: string;
	componentName: string;
	editUrlTemplate: string;
	isSlider: boolean;
}>;

export type BatchDeleteRequest = {
	scope: 'selected' | 'all';
	ids?: number[];
};

export type BatchDeleteResult = {
	STATUS?: string;
	PROCESSED_ITEMS?: number;
	TOTAL_ITEMS?: number;
	DELETED_ITEMS?: number;
	ERRORS?: Array<{
		id: number;
		message: string;
	}>;
	WARNING?: string;
	SUMMARY?: string;
	FINALIZE?: boolean;
};

export type GridInstance = {
	removeSelected: () => void;
	sendRowAction: (action: string, data?: Record<string, unknown>) => void;
	getRows: () => {
		getSelectedIds: () => Array<number | string>;
	};
	getActionsPanel: () => null | {
		getValues: () => Record<string, unknown>;
	};
	getForAllKey: () => string;
	reload: () => void;
};

export type SidePanelSlider = {
	getData: () => {
		get: (key: string) => unknown;
	};
};

export type SidePanelEvent = {
	getSlider: () => SidePanelSlider | null;
};

export type SidePanelInstance = {
	open: (
		url: string,
		options: {
			cacheable: boolean;
			events: {
				onClose: (event: SidePanelEvent) => void;
			};
		},
	) => boolean;
};

export type StepProcess = {
	getState: () => string;
	showDialog: () => StepProcess;
	start: () => StepProcess;
	getId: () => string;
	getDialog: () => {
		setErrors: (messages: string[], isHtml?: boolean) => void;
	};
};
