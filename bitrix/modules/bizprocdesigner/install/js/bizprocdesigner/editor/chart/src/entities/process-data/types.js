import type { Block, Connection, DiagramTemplate } from '../../shared/types';

export type { ProcessDataSelector } from '../../shared/types';

export type Purpose = 'input' | 'internal' | 'constant' | 'shared';

export type Mechanics = 'new' | 'legacy';

/** Normalized property of a data element — the ten keys of `FieldType::normalizeProperty`. */
export type ProcessDataProperty = {
	Id: string | null;
	Type: string | null;
	BaseType: string | null;
	Name: string | null;
	Description: string | null;
	Multiple: boolean;
	Required: boolean;
	Options: mixed;
	Settings: { [string]: mixed } | null;
	Default: mixed;
};

export type ProcessDataElement = {
	key: string;
	sourceType: string;
	purpose: Purpose;
	property: ProcessDataProperty;
	acceptsStartValue: boolean;
	inputProperty: ProcessDataProperty | null;
	visibility: string | null;
	visibilityName: string | null;
	createdBy: number | null;
	modifiedBy: number | null;
};

export type ProcessDataUsage = {
	activityName: string;
	title: string;
};

export type ProcessDataError = {
	code: string | null;
	message: string;
	customData: { [string]: mixed } | null;
};

export type SharedAccess = {
	canUpsert: boolean;
	canDelete: boolean;
	visibility: { [string]: string };
};

export type ProcessDataCatalogResponse = {
	mechanics: Mechanics;
	canEdit: boolean;
	runningInstances: number;
	catalog: ProcessDataElement[];
	shared: {
		elements: ProcessDataElement[];
		canUpsert: boolean;
		canDelete: boolean;
		visibility: { [string]: string };
	};
};

/**
 * Answer of every mutating action: the rewritten blocks of the template and the rebuilt catalog.
 * `blocks`/`connections` come with rename and changePurpose alone — only they rewrite references.
 */
export type ProcessDataMutationResponse = {
	template: $Shape<DiagramTemplate>;
	blocks?: Block[];
	connections?: Connection[];
	catalog: ProcessDataElement[];
};

export type ProcessDataUsagesResponse = {
	usages: ProcessDataUsage[];
};

export type SharedElementResponse = {
	element: ProcessDataElement;
};
