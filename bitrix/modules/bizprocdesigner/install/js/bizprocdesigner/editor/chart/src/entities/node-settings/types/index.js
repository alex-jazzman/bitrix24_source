import type { ActivityData, PortId } from '../../../shared/types';
import {
	CONSTRUCTION_OPERATORS, CONSTRUCTION_TYPES, GENERAL_CONSTRUCTION_TYPES, CONSTRUCTION_LABELS,
	FIELD_OBJECT_TYPES,
} from '../constants';

export type Construction = {
	id: string;
	type: $Values<typeof CONSTRUCTION_TYPES>;
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
}

export type FieldObjectType = $Values<typeof FIELD_OBJECT_TYPES> | string;

export type ActionConstruction = Construction & {
	type: CONSTRUCTION_TYPES.ACTION;
	expression: {
		actionId?: string,
		activityData?: ActivityData,
		rawActivityData?: Object,
		document: ?string,
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
};

export type Rule = {
	portId: PortId;
	ruleCards: Array<TRuleCard>;
};

export type Field = {
	title: string;
	values: Map<string, string>;
};

export type ActionDictEntry = {
	id: string,
	title: string,
	handlesDocument: boolean,
}

export type NodeSettings = {
	title: string,
	description: string,
	variables: Map<string, string>;
	rules: Map<string, Rule>;
	fields: Map<string, Field>;
	actions: Map<ActionDictEntry['id'], ActionDictEntry>;
	fixedDocumentType: Array | null;
};

export type GeneralConstructionTypes = {
	+[key: $Keys<typeof GENERAL_CONSTRUCTION_TYPES>]: $Values<typeof GENERAL_CONSTRUCTION_TYPES>,
};

export type СonstructionOperators = {
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
