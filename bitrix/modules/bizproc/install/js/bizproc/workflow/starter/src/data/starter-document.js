import { Type } from 'main.core';

import { ComplexDocumentId } from './complex-document-id';
import { ComplexDocumentType } from './complex-document-type';

export type StarterComplexDocumentTypeInput =
	| ComplexDocumentType
	| {
		moduleId: string,
		entity: string,
		documentType: string,
	}
;

export type StarterComplexDocumentIdInput =
	| ComplexDocumentId
	| {
		moduleId: string,
		entity: string,
		documentId: string | number,
	}
;

export type StarterDocumentInit = {
	documentType: StarterComplexDocumentTypeInput,
	documentId: StarterComplexDocumentIdInput,
};

export class StarterDocument
{
	#documentType: ComplexDocumentType;
	#documentId: ComplexDocumentId;

	static tryCreate(document: mixed): ?StarterDocument
	{
		if (document instanceof StarterDocument)
		{
			return document;
		}

		if (!Type.isPlainObject(document))
		{
			return null;
		}

		const documentType = ComplexDocumentType.tryCreate(document.documentType);
		const documentId = ComplexDocumentId.tryCreate(document.documentId);
		if (!documentType || !documentId)
		{
			return null;
		}

		if (
			documentType.moduleId !== documentId.moduleId
			|| documentType.entity !== documentId.entity
		)
		{
			return null;
		}

		return new StarterDocument(documentType, documentId);
	}

	constructor(documentType: ComplexDocumentType, documentId: ComplexDocumentId)
	{
		if (
			documentType.moduleId !== documentId.moduleId
			|| documentType.entity !== documentId.entity
		)
		{
			throw new TypeError('document type and id are incompatible');
		}

		this.#documentType = documentType;
		this.#documentId = documentId;
	}

	get documentType(): ComplexDocumentType
	{
		return this.#documentType;
	}

	get documentId(): ComplexDocumentId
	{
		return this.#documentId;
	}

	get key(): string
	{
		return [
			this.documentType.moduleId,
			this.documentType.entity,
			this.documentType.documentType,
			String(this.documentId.documentId),
		].join('@');
	}
}
