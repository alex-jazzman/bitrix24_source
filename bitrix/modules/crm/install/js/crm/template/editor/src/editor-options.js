import type { DialogOptions } from 'ui.entity-selector';
import type { OnSelectParams } from './types';

export type EditorOptions = {
	id?: string,
	target: HTMLElement,
	entityTypeId: number,
	entityId: number,
	categoryId?: number,
	onSelect: (OnSelectParams) => void,
	onDeselect?: () => {},
	dialogOptions?: DialogOptions,
	usePlaceholderProvider?: boolean,
	canUseFieldsDialog?: boolean,
	canUseFieldValueInput?: boolean,
	canUsePreview: boolean,
	isReadOnly?: boolean,
};
