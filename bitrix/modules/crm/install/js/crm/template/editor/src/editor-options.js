import type { BaseEvent } from 'main.core.events';
import type { EditorOptions as MessageServiceEditorOptions } from 'messageservice.template.editor';
import type { DialogOptions } from 'ui.entity-selector';

export type EditorOptions = MessageServiceEditorOptions & {
	entityTypeId: number,
	entityId: number,
	categoryId?: number,
	events?: { [eventName: string]: (BaseEvent) => any },
	dialogOptions?: DialogOptions,
	usePlaceholderProvider?: boolean,
};
