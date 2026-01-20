import {JNChatBaseClassInterface} from '../../../types/common';

declare class DialogTextField {
	ui: JNChatTextField;

	on<T extends keyof DialogTextFieldEvents>(eventType: T, handler: DialogTextFieldEvents[T]): void;
	off<T extends keyof DialogTextFieldEvents>(eventType: T, handler: DialogTextFieldEvents[T]): void;
	once<T extends keyof DialogTextFieldEvents>(eventType: T, handler: DialogTextFieldEvents[T]): void;
}

declare interface JNChatTextField extends JNChatBaseClassInterface<DialogTextFieldEvents>
{
	on<T extends keyof DialogTextFieldEvents>(eventType: T, handler: DialogTextFieldEvents[T]): void;
	off<T extends keyof DialogTextFieldEvents>(eventType: T, handler: DialogTextFieldEvents[T]): void;
	once<T extends keyof DialogTextFieldEvents>(eventType: T, handler: DialogTextFieldEvents[T]): void;

	getText(): string;
	setText(text: string): void;
	replaceText(fromIndex: number, toIndex: number, text: string): void;
	getCursorIndex(): number;
	setPlaceholder(text: string): void;
	show(params: { animated: boolean }): void;
	showActionButton(params: { id: string, icon: { name: string, tintColor: string } }): void;
	showActionButtonPopupMenu(items: Array<object>, sections: Array<object>): void;
	hideActionButton(): void;
	hide(params: { animated: boolean }): void;
	setQuote(message: object, params: QuoteParams): void;
	removeQuote(): void;
	hideKeyboard(): void;
	showKeyboard(): void;
	enableAlwaysSendButtonMode(allow: boolean): void;
	setSendButtonColors(colors: { enabled: string, disabled: string }): void;
	clear(): void;
	showAssistantButtons(buttons: AssistantButton[], animated: boolean): Promise<any>;
	hideAssistantButtons(animated: boolean): Promise<any>;
	updateAssistantButton(id: AssistantButton['id'], button:AssistantButton): Promise<any>;
	removeAssistantButton(id: AssistantButton['id']): Promise<any>;
}

declare type DialogTextFieldEvents = {
	changeState: (text: string, inputCharacters: string, cursorPosition: number) => any,
	changeText: (text: string) => any,
	quoteTap: (message: object) => any,
	quoteRemoveAnimationEnd: () => any,
	cancelQuote: () => any,
	blur: () => any,
	focus: () => any,
}

export interface AssistantButton {
	id: string
	text: string,
	testId: string,
	iconName: string,
	imageUrl: string,
	size: 'M' | 'S',
	design: 'primary' | 'success' | 'alert' | 'black' | 'grey' | 'disabled-alike',
	mode: 'solid' | 'outline',
	rounded: boolean,
	dropdown: boolean,
}

declare type DialogTextFieldEvents = {
	changeState: (text: string, inputCharacters: string, cursorPosition: number) => any,
	changeText: (text: string) => any,
	quoteTap: (message: object) => any,
	quoteRemoveAnimationEnd: () => any,
	cancelQuote: () => any,
	blur: () => any,
	focus: () => any,
}

declare type QuoteParams = {
	type: string,
	openKeyboard: boolean,
	title?: string | null,  // (56+ API)
	text?: string | null,  // (56+ API)
	icon?: { // (58+ API)
		name: string,
		tintColor: string,
	},
}
