import { Type } from 'main.core';

export class ComplexDocumentId
{
	#moduleId: string;
	#entity: string;
	#documentId: string | number;

	static tryCreate(documentId: mixed): ?ComplexDocumentId
	{
		if (documentId instanceof ComplexDocumentId)
		{
			return documentId;
		}

		if (!Type.isPlainObject(documentId))
		{
			return null;
		}

		if (
			!Type.isStringFilled(documentId.moduleId)
			|| !Type.isStringFilled(documentId.entity)
			|| !(Type.isStringFilled(documentId.documentId) || Type.isNumber(documentId.documentId))
		)
		{
			return null;
		}

		return new ComplexDocumentId(
			documentId.moduleId,
			documentId.entity,
			documentId.documentId,
		);
	}

	constructor(moduleId: string, entity: string, documentId: string | number)
	{
		if (
			!Type.isStringFilled(moduleId)
			|| !Type.isStringFilled(entity)
			|| !(Type.isStringFilled(documentId) || Type.isNumber(documentId))
		)
		{
			throw new TypeError('incorrect complex document id');
		}

		this.#moduleId = moduleId;
		this.#entity = entity;
		this.#documentId = documentId;
	}

	get moduleId(): string
	{
		return this.#moduleId;
	}

	get entity(): string
	{
		return this.#entity;
	}

	get documentId(): string | number
	{
		return this.#documentId;
	}
}
