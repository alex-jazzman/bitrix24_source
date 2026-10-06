import { Type } from 'main.core';
import { normalizeCategoryId } from '../normalize-category-id';
import { type SignedDocumentType } from '../starter';

export class ComplexDocumentType
{
	#moduleId: string;
	#entity: string;
	#documentType: string;
	#categoryId: ?number;

	static tryCreate(documentType: mixed): ?ComplexDocumentType
	{
		if (documentType instanceof ComplexDocumentType)
		{
			return documentType;
		}

		if (!Type.isPlainObject(documentType))
		{
			return null;
		}

		if (
			!Type.isStringFilled(documentType.moduleId)
			|| !Type.isStringFilled(documentType.entity)
			|| !Type.isStringFilled(documentType.documentType)
		)
		{
			return null;
		}

		return new ComplexDocumentType(
			documentType.moduleId,
			documentType.entity,
			documentType.documentType,
			documentType.categoryId ?? null,
		);
	}

	withCategoryId(categoryId: mixed): ComplexDocumentType
	{
		const normalizedCategoryId = normalizeCategoryId(categoryId);
		if (normalizedCategoryId === this.#categoryId)
		{
			return this;
		}

		return new ComplexDocumentType(
			this.#moduleId,
			this.#entity,
			this.#documentType,
			normalizedCategoryId,
		);
	}

	constructor(moduleId: string, entity: string, documentType: string, categoryId: ?number = null)
	{
		if (
			!Type.isStringFilled(moduleId)
			|| !Type.isStringFilled(entity)
			|| !Type.isStringFilled(documentType)
		)
		{
			throw new TypeError('incorrect complex document type');
		}

		this.#moduleId = moduleId;
		this.#entity = entity;
		this.#documentType = documentType;
		this.#categoryId = normalizeCategoryId(categoryId);
	}

	get moduleId(): string
	{
		return this.#moduleId;
	}

	get entity(): string
	{
		return this.#entity;
	}

	get documentType(): string
	{
		return this.#documentType;
	}

	get categoryId(): ?number
	{
		return this.#categoryId;
	}

	isEqual(targetDocumentType: SignedDocumentType | ComplexDocumentType): boolean
	{
		if (Type.isString(targetDocumentType))
		{
			return (
				targetDocumentType.includes(this.moduleId)
				&& targetDocumentType.includes(this.entity)
				&& targetDocumentType.includes(this.documentType)
			);
		}

		if (Type.isObjectLike(targetDocumentType))
		{
			return (
				this.moduleId === targetDocumentType.moduleId
				&& this.entity === targetDocumentType.entity
				&& this.documentType === targetDocumentType.documentType
			);
		}

		return false;
	}
}
