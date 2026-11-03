import { TypeModel } from 'crm.type-model';

import { collectTypeFields, type TypeSeed } from '../../lib/collect-type-fields/collect-type-fields';
import { type TypeHubValues } from '../../model/type-hub-store';

// Maps the store values onto a single reused TypeModel instance and performs the wire calls. Reusing
// crm.type-model gives the wire names (crm.api.type.update / crm.api.type.add) and the empty-collection
// collapse in TypeModel.getData() without reimplementation. One model instance is
// kept for the whole form lifetime so its id/state survive add -> subsequent operations (e.g. delete).
export class TypeFormAdapter
{
	#seed: TypeSeed;
	#hasCustomSection: boolean;
	#normalizeDescription: (value: string) => string;
	#model: TypeModel;

	constructor(seed: TypeSeed, hasCustomSection: boolean, normalizeDescription: (value: string) => string)
	{
		this.#seed = clone(seed);
		this.#hasCustomSection = hasCustomSection;
		this.#normalizeDescription = normalizeDescription;
		this.#model = new TypeModel(clone(seed) as any);
	}

	getModel(): TypeModel
	{
		return this.#model;
	}

	isSaved(): boolean
	{
		return this.#model.isSaved();
	}

	save(values: TypeHubValues): Promise<{ data: Object }>
	{
		this.#model.setData(collectTypeFields(
			this.#seed,
			values,
			this.#hasCustomSection,
			this.#normalizeDescription,
		) as any);

		return this.#model.save();
	}

	delete(): Promise<{ data: Object }>
	{
		return this.#model.delete();
	}
}

function clone<T>(value: T): T
{
	return JSON.parse(JSON.stringify(value)) as T;
}
