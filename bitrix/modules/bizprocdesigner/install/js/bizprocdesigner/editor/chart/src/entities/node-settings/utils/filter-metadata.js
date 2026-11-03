import { Type } from 'main.core';

import { type FilterMetadataParams } from '../../../shared/utils';
import {
	DEV_NODE_FILTER_BACKING_ACTIVITY_TYPES,
	NODE_FILTER_BACKING_ACTIVITY_TYPES,
} from '../constants';

const FILTER_DOCUMENT_TYPE_LENGTH = 3;

const CRM_ENTITY_TYPE_IDS = Object.freeze({
	LEAD: 1,
	DEAL: 2,
	CONTACT: 3,
	COMPANY: 4,
	QUOTE: 7,
	SMART_INVOICE: 31,
});

// A node reacting to another document filters against that document, not against the workflow's.
export const resolveFilterContextDocumentType = (
	documentType: Array<string>,
	fixedDocumentType: ?Array<string>,
): Array<string> => {
	return (
		Type.isArrayFilled(fixedDocumentType)
		&& fixedDocumentType.length >= FILTER_DOCUMENT_TYPE_LENGTH
	)
		? fixedDocumentType
		: documentType
	;
};

export const resolveFilterBackingActivityType = (contextDocumentType: ?Array<string>): string => {
	const moduleId = Type.isArrayFilled(contextDocumentType) ? String(contextDocumentType[0]) : '';

	// The dev-only map is asked last: on a portal it never matches, on a developer stand it
	// adds the virtual `bizproc` document.
	return NODE_FILTER_BACKING_ACTIVITY_TYPES[moduleId]
		?? DEV_NODE_FILTER_BACKING_ACTIVITY_TYPES[moduleId]
		?? ''
	;
};

export const resolveFilterFixedEntityTypeId = (fixedDocumentType: ?Array<string>): number | null => {
	return CRM_ENTITY_TYPE_IDS[fixedDocumentType?.[FILTER_DOCUMENT_TYPE_LENGTH - 1] ?? ''] ?? null;
};

// The warm-up on node load and the filter editor must build one and the same key: a key differing
// by any parameter turns the warm-up into a second request instead of a shared one.
export const buildFilterMetadataParams = (
	documentType: Array<string>,
	fixedDocumentType: ?Array<string>,
	contextActivityType: ?string = null,
): FilterMetadataParams => {
	const contextDocumentType = resolveFilterContextDocumentType(documentType, fixedDocumentType);

	return {
		activityType: resolveFilterBackingActivityType(contextDocumentType),
		contextActivityType,
		documentType: contextDocumentType,
		onlyDynamicEntities: !resolveFilterFixedEntityTypeId(fixedDocumentType),
		includeRelatedEntityTypes: true,
	};
};
