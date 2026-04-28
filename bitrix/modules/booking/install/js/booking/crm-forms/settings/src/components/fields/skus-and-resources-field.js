import { Dom, Loc, Tag, Type } from 'main.core';

import type { CatalogSkuEntityOptions } from 'booking.model.sku';

import { SkusResourcesManager } from '../skus-resources-manager/skus-resources-manager';

export class SkusAndResourcesField
{
	#skusEditorButton: ?HTMLElement = null;
	#getResources: () => { id: number, skus: number[] }[];
	#getBodyContainer: () => HTMLElement;
	#onUpdateResources: ({ id: number, skus: number[] }[]) => void;
	#skuResourcesManager: SkusResourcesManager;

	constructor(options: SkusAndResourcesFieldOptions)
	{
		this.#skuResourcesManager = new SkusResourcesManager(
			options.catalogSkuEntityOptions,
			this.#onUpdate.bind(this),
		);
		this.#getBodyContainer = options.getBodyContainer;
		this.#getResources = options.getResources;
		this.#onUpdateResources = options.onUpdateResources;
	}

	get #skusAndResourcesCounterClassName(): string
	{
		return 'crm-form--booking-skus-and-resources-count';
	}

	get #skusCounterClassName(): string
	{
		return 'crm-form--booking-skus-count';
	}

	get #resourcesCounterClassName(): string
	{
		return 'crm-form--booking-resources-count';
	}

	render(isEmpty = false): HTMLElement
	{
		const buttonLabel = isEmpty
			? Loc.getMessage('BOOKING_CRM_FORMS_SETTINGS_SKUS_FIELD_ADD_BUTTON')
			: Loc.getMessage('BOOKING_CRM_FORMS_SETTINGS_SKUS_FIELD_CHANGE_BUTTON');

		this.#skusEditorButton = Tag.render`
			<button
				id="booking--crm-forms--services-editor-button"
				type="button"
				class="btn btn-primary g-btn-size-l"
				onclick="${this.#showSkusResourcesEditor.bind(this)}"
			>
				${buttonLabel}
			</button>
		`;

		return Tag.render`
			<div class="landing-ui-field d-flex">
				<div class="flex-grow-1">
					<div class="g-line-height-1_7 g-font-size-18 g-font-weight-500 g-color-gray-dark-v2">
						${Loc.getMessage('BOOKING_CRM_FORMS_SETTINGS_SKUS_FIELD_LABEL')}
					</div>
					<div class="${this.#skusAndResourcesCounterClassName}">
						<div class="${this.#skusCounterClassName}"></div>
						<span>&#8226;</span>
						<div class="${this.#resourcesCounterClassName}"></div>
					</div>
				</div>
				<div style="align-self: flex-end">
					${this.#skusEditorButton}
				</div>
			</div>
		`;
	}

	updateCounter(): void
	{
		const counterEl = this.#getBodyContainer().querySelector(`.${this.#skusAndResourcesCounterClassName}`);

		if (!Type.isDomNode(counterEl))
		{
			return;
		}

		const resources = this.#getResources();
		const skus = resources.reduce((skusSet, { skus: skuIds }: { skus: [] }) => {
			skuIds.forEach((skuId) => skusSet.add(skuId));

			return skusSet;
		}, new Set());

		if (skus.size === 0 && resources.length === 0)
		{
			counterEl.innerText = Loc.getMessage('BOOKING_CRM_FORMS_SETTINGS_SKUS_FIELD_EMPTY');

			return;
		}

		const skusCount = Loc.getMessagePlural(
			'BOOKING_CRM_FORMS_SETTINGS_SKUS_COUNT',
			skus.size,
			{
				'#COUNT#': skus.size,
			},
		);
		const resourcesCount = Loc.getMessagePlural(
			'BOOKING_CRM_FORMS_SETTINGS_RESOURCES_COUNT',
			resources.length,
			{
				'#COUNT#': resources.length,
			},
		);

		const counterContent = Tag.render`
			<div class="${this.#skusAndResourcesCounterClassName}">
				<div>${skusCount}</div>
				<span>&#8226;</span>
				<div>${resourcesCount}</div>
			</div>
		`;

		Dom.replace(counterEl, counterContent);
	}

	#showSkusResourcesEditor(): void
	{
		this.#skuResourcesManager.open(this.#getResources());
	}

	#onUpdate(resources: { id: number, skus: number[] }[]): void
	{
		this.#onUpdateResources(resources);
		this.updateCounter();
	}
}

type SkusAndResourcesFieldOptions = {
	catalogSkuEntityOptions: ?CatalogSkuEntityOptions;
	getResources: () => { id: number, skus: number[] }[];
	getBodyContainer: () => HTMLElement;
	onUpdateResources: ({ id: number, skus: number[] }[]) => void;
}
