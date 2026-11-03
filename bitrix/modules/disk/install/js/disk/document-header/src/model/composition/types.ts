import { type HeaderElementValue } from '../../const/element';

export type ObjectType = 'document' | 'board';

export type CompositionMode = 'view' | 'edit';

export type CompositionObject = {
	id: number,
	name: string,
	uniqueCode: string,
	extension: string,
};

export type CompositionUrls = {
	unifiedLink: string,
	/** Empty when the opening hands out no downloading at all. */
	download: string,
};

export type CompositionAccess = {
	controlType: string,
};

export type EditorItem = {
	code: string,
	name: string,
	isDefault: boolean,
};

export type CompositionModel = {
	elements: HeaderElementValue[],
	objectType: ObjectType,
	mode: CompositionMode,
	object: CompositionObject,
	urls: CompositionUrls,
	access: CompositionAccess,
	editors: EditorItem[],
};

export type CompositionState = {
	composition: CompositionModel | null,
};
