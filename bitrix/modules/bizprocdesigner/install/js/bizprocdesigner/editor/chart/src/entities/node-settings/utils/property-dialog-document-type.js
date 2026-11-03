import { Type } from 'main.core';

import { type NodeSettings } from '../types';

/** A document type is complete only as the [moduleId, entity, documentType] triplet. */
export const CorrectDocumentTypeLength = 3;

/**
 * The document type fixed on the node, and only a whole one: a payload with a shorter array carries no
 * type of its own, and the caption, the control of the value and the warning all fall back to the
 * document of the template together instead of parting ways over a broken record.
 */
export function getFixedDocumentType(nodeSettings: ?NodeSettings): Array<string> | null
{
	const fixed = nodeSettings?.fixedDocumentType;

	return Type.isArray(fixed) && fixed.length === CorrectDocumentTypeLength ? fixed : null;
}

type PropertyDialogDocumentTypeParams = {
	action: ?{ handlesDocument?: boolean },
	fixedDocumentType: ?Array<string>,
	workflowDocumentType: Array<string>,
	selectedDocument: ?string,
	resolveSelectedDocumentType: () => Array<string>,
};

/**
 * documentType the action property dialog is built for; an incomplete result means
 * the caller must keep the parameters form empty.
 *
 * An action with handlesDocument needs its source document before any parameter, so the
 * source gate comes first and holds for a node without a fixed document type as well:
 * such a node takes the type from the selected source instead of the process document.
 * The source type is asked for lazily, only in the branch that needs it.
 */
export const resolvePropertyDialogDocumentType = ({
	action,
	fixedDocumentType,
	workflowDocumentType,
	selectedDocument,
	resolveSelectedDocumentType,
}: PropertyDialogDocumentTypeParams): Array<string> => {
	if (!action)
	{
		return [];
	}

	if (action.handlesDocument)
	{
		if (!selectedDocument)
		{
			return [];
		}

		return fixedDocumentType?.length === CorrectDocumentTypeLength
			? fixedDocumentType
			: resolveSelectedDocumentType()
		;
	}

	if (!Type.isArrayFilled(fixedDocumentType) || fixedDocumentType.length < CorrectDocumentTypeLength)
	{
		return workflowDocumentType;
	}

	return fixedDocumentType;
};
