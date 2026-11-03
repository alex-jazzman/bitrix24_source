import { Tag } from 'main.core';

import { InputRow } from './input-row';

export class InputRowsContainer
{
	#inputRows: Array<InputRow>;
	#submittedInputRows: Array<InputRow>;
	#container: HTMLElement;

	constructor(inputRows: Array<InputRow>)
	{
		this.#inputRows = inputRows;
		this.#submittedInputRows = [];
	}

	render(): HTMLElement
	{
		if (!this.#container)
		{
			this.#container = Tag.render`
				<div
					class="intranet-invite-form-rows-container"
					data-test-id="invite-input-rows"
					data-testid="invitation-input-rows-container"
				></div>
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
		this.#submittedInputRows = this.#inputRows.filter(
			(inputRow: InputRow) => !inputRow.isEmpty(),
		);

		return this.#submittedInputRows.map((inputRow: InputRow) => inputRow.getValue());
	}

	hasError(): boolean
	{
		return this.#getFirstErrorInputRow() !== null;
	}

	restoreErrors(): void
	{
		this.#inputRows.forEach((inputRow: InputRow) => {
			inputRow.restoreErrors();
		});
	}

	validate(): boolean
	{
		this.#inputRows.forEach((inputRow: InputRow) => {
			inputRow.validate();
		});

		return !this.hasError();
	}

	focusFirstErrorInput(): boolean
	{
		const inputRow = this.#getFirstErrorInputRow();
		if (!inputRow)
		{
			return false;
		}

		if (!inputRow.focusFirstErrorInput())
		{
			return false;
		}

		const activeElement = this.#container?.ownerDocument.activeElement;
		activeElement?.scrollIntoView({ block: 'center' });

		return true;
	}

	highlightErrorInputs(values: Array, error: string): boolean
	{
		let handled = false;

		this.#inputRows.forEach((inputRow: InputRow) => {
			const value = inputRow.getContactsValue();

			if (value && values.includes(value))
			{
				inputRow.setContactsError(error);
				handled = true;
			}
		});

		return handled;
	}

	setInvitationError(invitationIndex: number, error: string): boolean
	{
		const inputRow = this.#submittedInputRows[invitationIndex];
		if (!inputRow)
		{
			return false;
		}

		inputRow.setInvitationError(error);

		return true;
	}

	setFirstContactsError(error: string): boolean
	{
		const inputRow = this.#inputRows[0];
		if (!inputRow)
		{
			return false;
		}

		inputRow.setContactsError(error);

		return true;
	}

	#getFirstErrorInputRow(): ?InputRow
	{
		return this.#inputRows.find((inputRow: InputRow) => inputRow.hasError()) ?? null;
	}
}
