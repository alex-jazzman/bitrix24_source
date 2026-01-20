import { Type } from 'main.core';
import { MiniCardResolver } from './lib/model/mini-card-resolver';
import { MiniCard } from './mini-card';

const EntityTypeEnum = BX.CrmEntityType.enumeration;
const EntityType = BX.CrmEntityType;

export type EntityMiniCardOptions = {
	entityTypeId: number,
	entityId: number,
	bindElement: HTMLElement,
};

export class EntityMiniCard
{
	#entityTypeId: number;
	#entityId: number;
	#bindElement: HTMLElement;

	#miniCard: MiniCard;

	constructor(options: EntityMiniCardOptions)
	{
		this.#setEntityTypeId(options.entityTypeId);
		this.#setEntityId(options.entityId);
		this.#setBindElement(options.bindElement);

		this.#miniCard = new MiniCard({
			bindElement: this.#bindElement,
			miniCardResolver: new MiniCardResolver({
				entityTypeId: this.#entityTypeId,
				entityId: this.#entityId,
			}),
		});
	}

	getMiniCard(): MiniCard
	{
		return this.#miniCard;
	}

	#setEntityTypeId(entityTypeId: number): void
	{
		const availableEntityTypeIds = [
			EntityTypeEnum.lead,
			EntityTypeEnum.deal,
			EntityTypeEnum.contact,
			EntityTypeEnum.company,
			EntityTypeEnum.quote,
			EntityTypeEnum.order,
			EntityTypeEnum.smartinvoice,
		];

		const isAvailableEntityType = availableEntityTypeIds.includes(entityTypeId)
			|| EntityType.isDynamicTypeByTypeId(entityTypeId);

		if (!Type.isNumber(entityTypeId))
		{
			throw new RangeError(`BX.Crm.EntityMiniCard: entityTypeId ${entityTypeId} must be number`);
		}

		if (!isAvailableEntityType)
		{
			throw new RangeError(`BX.Crm.EntityMiniCard: entityTypeId ${entityTypeId} is not supported`);
		}

		this.#entityTypeId = entityTypeId;
	}

	#setEntityId(entityId: number): void
	{
		if (!Type.isNumber(entityId) || entityId <= 0)
		{
			throw new RangeError('BX.Crm.EntityMiniCard: entityId must be a number and greater than 0');
		}

		this.#entityId = entityId;
	}

	#setBindElement(element: HTMLElement): void
	{
		if (!Type.isElementNode(element))
		{
			throw new RangeError('BX.Crm.EntityMiniCard: bindElement must be an element node');
		}

		this.#bindElement = element;
	}
}
