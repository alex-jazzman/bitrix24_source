import { Type } from 'main.core';
import { type BaseField } from '../../model/base-field/base-field';

class FieldRegistryClass
{
	#registry: Map<string, typeof BaseField> = new Map();

	register(type: string, FieldClass: typeof BaseField): void
	{
		const registeredClass = this.#registry.get(type);

		if (!Type.isUndefined(registeredClass))
		{
			console.error(
				`[bizproc.fields] FieldRegistry: type "${type}" is already registered by `
				+ `${registeredClass.name}; registration of ${FieldClass.name} is ignored`,
			);

			return;
		}

		this.#registry.set(type, FieldClass);
	}

	get(type: string): typeof BaseField | null
	{
		return this.#registry.get(type) ?? null;
	}

	has(type: string): boolean
	{
		return this.#registry.has(type);
	}

	getRegisteredTypes(): string[]
	{
		return [...this.#registry.keys()];
	}

	reset(): void
	{
		this.#registry.clear();
	}
}

export const FieldRegistry = new FieldRegistryClass();
