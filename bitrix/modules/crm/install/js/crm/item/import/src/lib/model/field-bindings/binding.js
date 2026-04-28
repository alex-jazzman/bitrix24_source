declare type BindingOptions = {
	fieldId: string,
	columnIndex: number | null,
};

export class Binding
{
	#fieldId: string;
	#columnIndex: number | null;

	constructor(options: BindingOptions)
	{
		this.#fieldId = options.fieldId;
		this.#columnIndex = options.columnIndex;
	}

	getFieldId(): string
	{
		return this.#fieldId;
	}

	getColumnIndex(): number | null
	{
		return this.#columnIndex;
	}

	setColumnIndex(columnIndex: number | null): void
	{
		this.#columnIndex = columnIndex;

		return this;
	}

	json(): Object
	{
		return {
			fieldId: this.#fieldId,
			columnIndex: this.#columnIndex,
		};
	}
}
