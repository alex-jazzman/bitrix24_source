import { type ActivityData, type PortId, type Block } from '../../../shared/types';
import {
	CONSTRUCTION_OPERATORS,
	CONSTRUCTION_TYPES,
	CONSTRUCTION_LABELS,
	FIELD_OBJECT_TYPES,
} from '../constants';

export type Construction = {
	id: string;
	type: $Values<typeof CONSTRUCTION_TYPES> | $Values<typeof CONSTRUCTION_TYPES['CONDITION']>;
	expression: {
		title: string;
		value: string;
		operator?: $Values<typeof CONSTRUCTION_OPERATORS>;
	}
};

export type ConditionConstruction = Construction &
{
	expression: {
		field: ConditionExpressionField | null;
		operator?: $Values<typeof CONSTRUCTION_OPERATORS>;
		value: string;
	}
}

export type ConditionExpressionField = {
	object: FieldObjectType,
	fieldId: string,
	type: string | null,
	multiple: number | null,
	options?: Object | null,
	settings?: Object | null,
}

export type FieldObjectType = $Values<typeof FIELD_OBJECT_TYPES> | string;

export type ActionConstruction = Construction & {
	type: CONSTRUCTION_TYPES.ACTION;
	expression: {
		actionId?: string,
		activityData?: ActivityData,
		rawActivityData?: Object,
		document: ?string,
		// Optional cascade navigation dimensions (PRD §13.1). Truth stays actionId;
		// the server cross-checks area/object against the catalog.
		area?: ?string,
		object?: ?string,
	}
}

export type OutputConstruction = Construction & {
	type: CONSTRUCTION_TYPES.OUTPUT;
	expression: {
		portId: PortId | null,
		title: string,
	}
}

export type TRuleCard = {
	id: string;
	constructions: Array<Construction>;
	// Optional human-readable group name. Does not affect execution semantics.
	groupTitle?: string;
};

export type Rule = {
	portId: PortId;
	ruleCards: Array<TRuleCard>;
	isFilled: boolean;
};

export type Field = {
	title: string;
	values: Map<string, string>;
};

export type ActionDictEntry = {
	id: string,
	title: string,
	handlesDocument: boolean,
	group?: string | null,
	properties: Array<string> | null,
	// True for a relation "Create" sub-action; gates relation autofill. Absent = false.
	isRelationCreate?: boolean,
}

export type CatalogActionArea = {
	id: string,
	title: string,
	icon: string,
};

// A universal action (intent) offered by the catalog. Titles live on the UI layer.
export type CatalogActionGroup = {
	id: string,
};

export type CatalogActionObject = {
	id: string,
	title: string,
	area: string,
};

// A single action entry of the full capability catalog (getCapabilityCatalog).
// areas/objects/sources are null for unclassified actions (flat mode).
export type CatalogActionEntry = {
	id: string,
	title: string,
	handlesDocument: boolean,
	group?: string | null,
	areas: Array<CatalogActionArea> | null,
	objects: Array<CatalogActionObject> | null,
	sources: Array<string> | null,
	parameters: Object | null,
};

export type CapabilityCatalog = {
	activityCode: string,
	nodeType: string,
	availableBlocks: AvailableBlocks,
	actions: Array<CatalogActionEntry>,
	meta: Object | null,
};

// Frozen decision on what an action being added inherits from the node's base settings, taken at
// the moment the add control was pressed and carried through the resolve round trip unchanged
// (see resolveActionPrefill). canInherit false means a plain empty action, and the other two fields
// are then null.
export type ActionPrefill = {
	canInherit: boolean,
	actionId: string | null,
	properties: Object | null,
};

export type AvailableBlock = {
	available: boolean,
	constraints?: Object | null,
};

export type AvailableBlocks = {
	[type: string]: AvailableBlock,
};

export type NodeSettings = {
	title: string,
	description: string,
	variables: Map<string, string>;
	rules: Map<string, Rule>;
	relations: Map<string, Rule>;
	fields: Map<string, Field>;
	actions: Map<ActionDictEntry['id'], ActionDictEntry>;
	fixedDocumentType: Array | null;
	relationAction: ?ActionDictEntry;
	filterSupported: boolean;
	availableBlocks?: AvailableBlocks,
};

export type ConnectedBlocksContext = {
	syntheticSourceBlock: Block | null,
	siblingBlocks: Block[],
	ancestorBlocks: Block[],
	allBlocks: Block[],
};

export type ConstructionOperators = {
	+[key: $Keys<typeof CONSTRUCTION_OPERATORS>]: $Values<typeof CONSTRUCTION_OPERATORS>
};

export type ConstructionLabels = {
	+[key: $Keys<typeof CONSTRUCTION_LABELS>]: $Values<typeof CONSTRUCTION_LABELS>
};

export type OrderPayload = {
	draggedId: string;
	targetId: string;
	insertion: 'over' | 'under';
	ruleCardId?: string;
};
