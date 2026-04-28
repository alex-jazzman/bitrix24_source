import { InputRow } from './input-row';
import { Tag } from 'main.core';

export class InputRowsContainer
{
	#inputRows: Array<InputRow>;
	#container: HTMLElement;

	constructor(inputRows: Array<InputRow>)
	{
		this.#inputRows = inputRows;
	}

	render(): HTMLElement
	{
		if (!this.#container)
		{
			this.#container = Tag.render`
				<div data-test-id="invite-input-rows" class="intranet-invite-form-rows-container"></div>
			`;

			this.#inputRows.forEach((inputRow: InputRow) => {
				inputRow.renderTo(this.#container);
			});
		}

		return this.#container;
	}

	addRow(inputRow: InputRow)
	{
		this.#inputRows.push(inputRow);

		if (this.#container)
		{
			inputRow.renderTo(this.#container);
		}
	}

	clearAll(): void
	{
		this.#inputRows.forEach((inputRow: InputRow) => {
			inputRow.clear();
		});
	}

	isInvitationInputRowsEmpty(): boolean
	{
		for (const inputRow of this.#inputRows)
		{
			if (!inputRow.isInvitationRowEmpty())
			{
				return false;
			}
		}

		return true;
	}

	getEnteredInvitations(): Array
	{
		const result = [];

		this.#inputRows.forEach((inputRow: InputRow) => {
			if (!inputRow.isEmpty())
			{
				result.push(inputRow.getValue());
			}
		});

		return result;
	}

	hasError(): boolean
	{
		for (const inputRow of this.#inputRows)
		{
			if (inputRow.hasContactsError())
			{
				return true;
			}
		}

		return false;
	}

	highlightErrorInputs(values: Array, error: string): void
	{
		this.#inputRows.forEach((inputRow: InputRow) => {
			const value = inputRow.getContactsValue();

			if (value && values.includes(value))
			{
				inputRow.setContactsError(error);
			}
		});
	}
}
