/* eslint-disable */
type TitlePatternFieldOptions = {
	ajax?: AjaxClient;
	value?: string | null;
	context?: TitlePatternContext;
};

type AjaxClient = {
	runAction(action: string, options: {
		data: Record<string, unknown>;
	}): Promise<TitlePatternResponse>;
};

type TitlePatternResponse = {
	status: string;
	data: TitlePatternResponseData | null;
	errors: TitlePatternValidationError[];
};

type TitlePatternResponseData = {
	maxLength?: number;
	groups?: TitlePatternGroup[];
	validation?: {
		checked?: boolean;
		isValid?: boolean | null;
		errors?: TitlePatternValidationError[];
	};
};

type TitlePatternGroup = {
	id: string;
	title: string;
	items: TitlePatternItem[];
};

type TitlePatternItem = {
	id: string;
	title: string;
	placeholder: string;
};

type TitlePatternValidationError = {
	message?: string;
	code?: string;
};

type TitlePatternContext = {
	fileId: number;
	providers: string[];
	moduleId: string;
	templateId?: number;
};

type TitlePatternState = 'inactive' | 'loading' | 'ready-valid' | 'ready-invalid' | 'request-error';

type StateListener = () => void;

declare namespace BX.DocumentGenerator {
	function mount(node: HTMLElement, options?: TitlePatternFieldOptions): TitlePatternField;

	class TitlePatternField {
		constructor(options?: TitlePatternFieldOptions);
		mount(node: HTMLElement): this;
		destroy(): void;
		setAjax(ajax: AjaxClient): void;
		setValue(value: string | null): void;
		validate(): void;
		getValue(): string | null;
		setContext(context: TitlePatternContext): void;
		canSave(): boolean;
		focusError(): void;
		setSelection(start: number, end?: number): void;
		getState(): TitlePatternState;
		isLoading(): boolean;
		getGroups(): TitlePatternGroup[];
		getEmptyGroups(): TitlePatternGroup[];
		getMaxLength(): number | null;
		getErrorMessages(): string[];
		subscribe(listener: StateListener): () => void;
		insertPlaceholder(placeholder: string): void;
		openPicker(): Promise<void>;
	}

	function setValue(value: string | null): void;

	function getValue(): string | null;

	function setContext(context: TitlePatternContext): void;

	function canSave(): boolean;

	function focusError(): void;
}
