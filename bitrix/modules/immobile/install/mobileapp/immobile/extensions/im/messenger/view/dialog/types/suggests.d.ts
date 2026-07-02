import {JNChatBaseClassInterface} from '../../../types/common';

declare class DialogSuggests {
	ui: JNChatSuggests;

	on<T extends keyof SuggestsEvents>(eventName: T, handler: SuggestsEvents[T]): void;
	off<T extends keyof SuggestsEvents>(eventName: T, handler: SuggestsEvents[T]): void;
	once<T extends keyof SuggestsEvents>(eventName: T, handler: SuggestsEvents[T]): void;
}

declare interface JNChatSuggests extends JNChatBaseClassInterface<SuggestsEvents>
{
	on<T extends keyof SuggestsEvents>(eventName: T, handler: SuggestsEvents[T]): void;
	off<T extends keyof SuggestsEvents>(eventName: T, handler: SuggestsEvents[T]): void;
	once<T extends keyof SuggestsEvents>(eventName: T, handler: SuggestsEvents[T]): void;

	show(params: SuggestsShowParams): void;
	hide(): void;
}

export type SuggestsShowParams = {
	title: {
		text: string,
		color?: string,
	},
	items: Array<SuggestsItemParams>,
}

export type SuggestsItemParams = {
	id: string,
	testId: string,
	iconName?: string | null,
	imageUrl?: string | null,
	text: string,
	size: Size,
	design: Design,
	mode: Mode,
	rounded: boolean,
	dropdown: boolean,
	customStyle?: {
		backgroundColor: string
	}
}

declare type SuggestsEvents = {
	itemTap: (itemId: string) => any,
}

declare type Size = 'S' | 'M' | 'L'
declare type Design = 'primary' | 'success' | 'alert'| 'grey' | 'black' | 'disabled-alike' | 'bitrix-gpt'
declare type Mode = 'solid' | 'outline' | 'tinted'
