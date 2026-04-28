import { Binding } from './field-bindings/binding';

export type FieldBindingsOptions = {
	bindings: Binding[],
};

export class FieldBindings
{
	#bindings: Map<string, Binding> = new Map();

	constructor(options: FieldBindingsOptions)
	{
		options.bindings.forEach((binding) => {
			this.#bindings.set(binding.fieldId, new Binding(binding));
		});
	}

	set(fieldId: string, columnIndex: number | null): void
	{
		const binding = this.getBinding(fieldId);
		if (!binding)
		{
			this.#bindings.set(fieldId, new Binding({ fieldId, columnIndex }));

			return;
		}

		binding.setColumnIndex(columnIndex);
	}

	get(fieldId: string): ?number
	{
		return this.getBinding(fieldId)?.getColumnIndex();
	}

	getBinding(fieldId: string): ?Binding
	{
		return this.#bindings.get(fieldId);
	}

	json(): Object
	{
		return {
			bindings: [...this.#bindings].map(([, value]) => value?.json()),
		};
	}
}
