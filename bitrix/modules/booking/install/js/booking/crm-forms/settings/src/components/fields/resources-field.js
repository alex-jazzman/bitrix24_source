import { Loc, Tag, Type } from 'main.core';
import { ResourcesManager } from '../resources-manager/resources-manager';

export class ResourcesField
{
	#getResourceIds: Function;
	#getBodyContainer: () => HTMLElement;
	#onUpdateResourceIds: Function;

	#resourcesManagerButton: ?HTMLElement = null;

	constructor({ getResourceIds, onUpdateResourceIds, getBodyContainer }: ResourcesFieldOptions)
	{
		this.#getBodyContainer = getBodyContainer;
		this.#getResourceIds = getResourceIds;
		this.#onUpdateResourceIds = onUpdateResourceIds;
	}

	get #counterClassName(): string
	{
		return 'crm-form--booking-resources-count';
	}

	render(): HTMLElement
	{
		const buttonLabel = this.#getResourceIds().length > 0
			? Loc.getMessage('BOOKING_CRM_FORMS_SETTINGS_RESOURCES_FIELD_CHANGE_BUTTON')
			: Loc.getMessage('BOOKING_CRM_FORMS_SETTINGS_RESOURCES_FIELD_ADD_BUTTON');

		this.#resourcesManagerButton = Tag.render`
			<button
				id="booking--crm-forms--resource-manager-button"
				type="button"
				class="btn btn-primary g-btn-size-l"
				onclick="${this.#showResourcesManager.bind(this)}"
			>
				${buttonLabel}
			</button>
		`;

		return Tag.render`
			<div class="landing-ui-field d-flex">
				<div class="flex-grow-1">
					<div class="g-line-height-1_7 g-font-size-18 g-font-weight-500 g-color-gray-dark-v2">
						${Loc.getMessage('BOOKING_CRM_FORMS_SETTINGS_RESOURCES_FIELD_LABEL')}
					</div>
					<div class="crm-form--booking-resources-count"></div>
				</div>
				<div style="align-self: flex-end">
					${this.#resourcesManagerButton}
				</div>
			</div>
		`;
	}

	updateCounter(): void
	{
		const counterEl = (this.#getBodyContainer() || document).querySelector(`.${this.#counterClassName}`);

		if (Type.isDomNode(counterEl))
		{
			counterEl.innerText = this.#getResourceIds().length > 0
				? Loc.getMessage('BOOKING_CRM_FORMS_SETTINGS_RESOURCES_FIELD_TEXT', {
					'#COUNT#': this.#getResourceIds().length,
				})
				: Loc.getMessage('BOOKING_CRM_FORMS_SETTINGS_RESOURCES_FIELD_EMPTY');
		}
	}

	#showResourcesManager(): void
	{
		const resourcesManager = new ResourcesManager({
			target: this.#resourcesManagerButton,
			selectedIds: this.#getResourceIds(),
			onUpdateResourceIds: (resourceIds: number[]) => {
				this.#onUpdateResourceIds(resourceIds);
				this.updateCounter();
				this.#updateResourceManagerButton();
			},
		});
		resourcesManager.show();
	}

	#updateResourceManagerButton(): void
	{
		if (Type.isDomNode(this.#resourcesManagerButton))
		{
			this.#resourcesManagerButton.innerText = this.#getResourceIds().length > 0
				? Loc.getMessage('BOOKING_CRM_FORMS_SETTINGS_RESOURCES_FIELD_CHANGE_BUTTON')
				: Loc.getMessage('BOOKING_CRM_FORMS_SETTINGS_RESOURCES_FIELD_ADD_BUTTON');
		}
	}
}

type ResourcesFieldOptions = {
	getResourceIds: () => number[];
	onUpdateResourceIds: (number[]) => void;
	getBodyContainer: () => HTMLElement;
}
