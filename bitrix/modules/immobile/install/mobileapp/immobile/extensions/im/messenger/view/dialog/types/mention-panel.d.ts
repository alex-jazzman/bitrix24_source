import {JNChatBaseClassInterface} from '../../../types/common';

declare class DialogMentionPanel {
	ui: JNChatMentionPanel;

	on<T extends keyof MentionPanelEvents>(eventName: T, handler: MentionPanelEvents[T]): void;
	off<T extends keyof MentionPanelEvents>(eventName: T, handler: MentionPanelEvents[T]): void;
	once<T extends keyof MentionPanelEvents>(eventName: T, handler: MentionPanelEvents[T]): void;
}

declare interface JNChatMentionPanel extends JNChatBaseClassInterface<MentionPanelEvents>
{
	on<T extends keyof MentionPanelEvents>(eventName: T, handler: MentionPanelEvents[T]): void;
	off<T extends keyof MentionPanelEvents>(eventName: T, handler: MentionPanelEvents[T]): void;
	once<T extends keyof MentionPanelEvents>(eventName: T, handler: MentionPanelEvents[T]): void;

	open(items : Array<MentionItem>): void;
	close(): void;
	setItems(items: Array<MentionItem>): void;
	setEmptyState(emptyState?: MentionEmptyState | null): void;
	update(id: string, item: Partial<MentionItem>): void;
	animateAction(id: string, item: MentionItem): void;
	showLoader(): void;
	hideLoader(): void;
}

declare type MentionEmptyState = {
	/** Icon resource name or image URL; an empty value hides the image. */
	image?: string,
	/** Placeholder title; an empty value hides the title. */
	title?: string,
	/** Placeholder description; an empty value hides the text. */
	text?: string,
}

declare type MentionItem = {
	id: string,
	title: string,
	/** Second-line row description; native panel collapses the row to a single line when empty. */
	description?: string,
	imageUrl: string,
	imageColor: string,
	displayedDate: string,
	titleColor: string,
	testId: string,
	actions?: MentionAction[],
}

declare type MentionAction = {
	action: {
		id: string,
		text: string,
		testId: string,
		iconName: string,
		imageUrl?: string,
		size: string,
		design: string,
		mode: string,
		rounded: boolean,
		dropdown: boolean,
		actionViewId: string,
	},
	options?: {
		autoHideDelay: number,
	}
}

declare type MentionPanelEvents = {
	itemTap: (item: MentionItem) => any,
}
