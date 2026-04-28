import { Tag, Event, Runtime, Dom, Text, Type } from 'main.core';

type StorageField = {
	id: number;
	storageId: number;
	code: string;
	sort: number;
	name: string;
	description: string;
	type: string;
	multiple: boolean;
	mandatory: boolean;
	settings: Object | null;
};

type Options = {
	codeCaption: string;
	copyNotification: string;
};

export class CreateStorageNodeRenderer
{
	#storageFieldsWrapper: HTMLElement;
	#options: Options;

	getControlRenderers(): Object
	{
		return {
			'storage-fields': (field: Object) => {
				const element = Tag.render`
					<div class="storage-fields">
						<a ref="addField" class="custom-fields__add-button" href="#" id="add_field">${Text.encode(field.property.Name)}</a>
					</div>
				`;
				this.#storageFieldsWrapper = element.root;
				this.#options = field?.property?.Options || {};

				Event.bind(element.addField, 'click', this.handleAddFieldClick.bind(this));
				if (Type.isArrayFilled(field.value))
				{
					field.value.forEach((field) => {
						Dom.append(this.#getField(field), this.#storageFieldsWrapper);
					});
				}

				return element.root;
			},
		};
	}

	handleAddFieldClick(event: Event): void
	{
		event.preventDefault();
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
								Dom.append(this.#getField(data), this.#storageFieldsWrapper);
							}
						},
					},
					requestMethod: 'get',
					requestParams: { storageId: 0, fieldId: null, skipSave: true },
				});
			})
			.catch((e) => {
				console.error(e);
			});
	}

	#getField(field: StorageField): HTMLElement
	{
		const jsonValue = JSON.stringify(field);
		const fieldItem = Tag.render`
			<div class="storage-fields__item">
			   <input type="hidden" name="SelectedFields[]" value="${Text.encode(jsonValue)}">
			   <div class="storage-fields__item-content">
			      <span class="storage-fields__item-name">
			         ${Text.encode(field.name)}
			      </span>
			      <a ref="copyCode" class="storage-fields__code-button" href="#" title="${Text.encode(field.code)}">
			         ${Text.encode(this.#options.codeCaption ?? '')}
			      </a>
			      <a ref="deleteField" class="storage-fields__delete-button" href="#">
			         <div class="ui-icon-set --cross-m"></div>
			      </a>
			   </div>
			</div>
		`;

		Event.bind(
			fieldItem.copyCode,
			'click',
			(event) => {
				event.preventDefault();
				BX.clipboard.copy(field.code);
				BX.UI.Notification.Center.notify({
					content: this.#options.copyNotification ?? '',
				});
			},
		);

		Event.bind(
			fieldItem.deleteField,
			'click',
			(event) => {
				event.preventDefault();
				Dom.remove(fieldItem.root);
			},
		);

		return fieldItem.root;
	}
}
