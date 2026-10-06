/* eslint-disable */
type TextEditorExports = {
	RichText: new (options: EditorOptions) => EditorInstance;
};

type EditorOptions = {
	toolbar: string[];
	placeholder: string;
	minHeight: number;
	copilot?: CopilotConfig;
};

type CopilotConfig = {
	copilotOptions: Record<string, unknown>;
	triggerBySpace?: boolean;
};

type EditorInstance = {
	renderTo: (container: HTMLElement) => void;
	setText: (text: string) => void;
	getText: () => string;
	subscribe: (event: string, handler: () => void) => void;
};

declare namespace BX.UI.UserField {
	class RichTextControl {
		static loadLibrary(): Promise<TextEditorExports>;
		static createEditor: (options: EditorOptions) => Promise<EditorInstance>;
		constructor(textarea: HTMLTextAreaElement);
		init(): Promise<boolean>;
		static boot(): void;
		static initWrap(wrap: HTMLElement): Promise<void>;
		static initField(textarea: HTMLTextAreaElement): Promise<boolean>;
	}
}
