export interface ITextFormatTextField {
	getText(): string;
	setText(text: string): void;
	setSelectionRange(startIndex: number, endIndex: number): void;
	setTextActions(actions: Array<TextFormatAction>): void;
	on(eventType: string, handler: (...args: unknown[]) => void): void;
	off(eventType: string, handler: (...args: unknown[]) => void): void;
}

export type TextFormatAction = {
	id: string;
	title: string;
	items?: Array<TextFormatAction>,
}

export interface TextActionTapEvent {
	text: string;
	actionId: string;
	startIndex: number;
	endIndex: number;
}
