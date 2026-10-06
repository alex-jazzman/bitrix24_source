import { Type } from 'main.core';

/** A document type is complete only as the [moduleId, entity, documentType] triplet. */
export const CorrectDocumentTypeLength = 3;

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
 * source gate comes first. The selected source document wins over a fixed node type,
 * because actions can work with a document produced by another activity inside the node.
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

		const selectedDocumentType = resolveSelectedDocumentType();

		return selectedDocumentType.length === CorrectDocumentTypeLength
			? selectedDocumentType
			: fixedDocumentType?.length === CorrectDocumentTypeLength
			? fixedDocumentType
			: []
		;
	}

	if (!Type.isArrayFilled(fixedDocumentType) || fixedDocumentType.length < CorrectDocumentTypeLength)
	{
		return workflowDocumentType;
	}

	return fixedDocumentType;
};
