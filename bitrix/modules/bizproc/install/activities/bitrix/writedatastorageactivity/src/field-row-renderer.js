import { Tag, Dom, Event, Runtime, Text, Type } from 'main.core';

import { Action } from './types';
import type { StorageField } from './types';

export class FieldRowRenderer
{
	#documentType: Array<string>;
	#currentValues: Object;
	#getStorageIdValue: () => ?string;
	#onFieldEdited: (field: StorageField) => void;
	#onFieldDeleted: (fieldId: number) => void;
	#onRowRemoved: () => void;

	constructor({
		documentType,
		currentValues,
		getStorageIdValue,
		onFieldEdited,
		onFieldDeleted,
		onRowRemoved,
	}: {
		documentType: Array<string>;
		currentValues: Object;
		getStorageIdValue: () => ?string;
		onFieldEdited: (field: StorageField) => void;
		onFieldDeleted: (fieldId: number) => void;
		onRowRemoved: () => void;
	})
	{
		this.#documentType = documentType;
		this.#currentValues = currentValues;
		this.#getStorageIdValue = getStorageIdValue;
		this.#onFieldEdited = onFieldEdited;
		this.#onFieldDeleted = onFieldDeleted;
		this.#onRowRemoved = onRowRemoved;
	}

	renderStaticFieldRow(row: HTMLElement, field: StorageField): void
	{
		const editBtn = this.#getEditButton(row, field.Id);
		const deleteBtn = this.#getDeleteButton(row);

		const { root, valueContainer } = Tag.render`
			<div ref="root" class="bizproc-write-activity__field-row">
				<div class="bizproc-write-activity__field-row-content">
					<div class="bizproc-write-activity__field-label">${Text.encode(field.Name)}</div>
					<div class="bizproc-write-activity__value-row">
						<div ref="valueContainer"></div>
						${editBtn || ''}
						${deleteBtn}
					</div>
				</div>
			</div>
		`;

		const keys = Tag.render`
			<input type="hidden" name="field_keys[]" value="${Text.encode(field.FieldName)}" />
		`;
		Dom.append(this.#getWriteField(field), valueContainer);
		Dom.append(keys, valueContainer);
		Dom.append(root, row);
	}

	openFieldEdit(fieldId: ?number = null): Promise<?StorageField>
	{
		return new Promise((resolve) => {
			Runtime
				.loadExtension('bizproc.router')
				.then(({ Router }) => {
					Router.openStorageFieldEdit({
						events: {
							onCloseComplete: (event: BX.SidePanel.Event) => {
								const slider = event.getSlider();
								const dictionary: ?BX.SidePanel.Dictionary = slider ? slider.getData() : null;
								let data = null;
								if (dictionary && dictionary.has('data'))
								{
									data = dictionary.get('data');
								}

								resolve(data);
							},
						},
						requestMethod: 'get',
						requestParams: { storageId: this.#getStorageIdValue(), fieldId },
					});
				})
				.catch((e) => {
					console.error(e);
					resolve(null);
				});
		});
	}

	#getWriteField(field: StorageField, value: mixed = null): HTMLElement
	{
		let currentValue = this.#currentValues[field.FieldName] ?? null;
		if (!Type.isNil(value))
		{
			currentValue = value;
		}

		return BX.Bizproc.FieldType.renderControl(
			this.#documentType,
			field,
			`field_values_${field.FieldName}__bpctl`,
			currentValue,
			'designer',
		);
	}

	#getDeleteButton(row: HTMLElement): HTMLElement
	{
		const button = Tag.render`
			<div class="bizproc-automation-popup-settings__condition-item_close">
				<div class="ui-icon-set --cross-m"></div>
			</div>
		`;

		Event.bind(button, 'click', (event) => {
			event.preventDefault();
			Dom.remove(row);
			this.#onRowRemoved();
		});

		return button;
	}

	#getEditButton(row: HTMLElement, fieldId: number): ?HTMLElement
	{
		if (!fieldId && fieldId !== 0)
		{
			return null;
		}

		if (!(Number(this.#getStorageIdValue()) > 0))
		{
			return null;
		}

		const button = Tag.render`
			<div
				class="bizproc-automation-popup-settings__condition-item_close"
			>
				<div class="ui-icon-set --edit-s"></div>
			</div>
		`;

		Event.bind(
			button,
			'click',
			async (event) => {
				event.preventDefault();
				const field = await this.openFieldEdit(fieldId);

				if (!field)
				{
					return;
				}

				const isDeleteAction = field.action === Action.DELETE_FIELD && field.id;
				if (isDeleteAction)
				{
					this.#onFieldDeleted(Number(field.id));
				}
				else
				{
					this.#onFieldEdited(field);
				}
			},
		);

		return button;
	}
}
