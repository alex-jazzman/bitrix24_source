import { Dom, Loc, Tag, Type } from 'main.core';
import { Loader } from 'main.loader';
import { EventEmitter } from 'main.core.events';
import type { ListItemOptions } from 'landing.ui.component.listitem';

import { CrmFormTemplatesWithSku } from 'booking.const';
import { crmFormService } from 'booking.provider.service.crm-form-service';
import type { ResourceModel } from 'booking.model.resources';
import type { CatalogSkuEntityOptions } from 'booking.model.sku';

import { resourceStore } from './services/resource-store';
import { BookingSettingsDataModel } from './model/booking-settings-data-model';
import {
	HasSlotsAllAvailableResourcesField,
	HintField,
	HintVisibilityField,
	LabelField,
	PlaceholderField,
	SkusAndResourcesField,
	ResourcesField,
} from './components/fields';
import type { BookingSettingsData, ManagerField } from './types';

import './booking-settings-popup.css';

type BookingSettingsPopupOptions = {
	listItemOptions: ListItemOptions & { sourceOptions: { settingsData: ?BookingSettingsData } },
	isAutoSelectionOn: boolean,
	templateId: string;
}

export class BookingSettingsPopup extends EventEmitter
{
	#options: ListItemOptions;
	#layout: {
		sku: {
			label: LabelField,
			placeholder: PlaceholderField,
			hint: HintField,
			isVisibleHint: HintVisibilityField,
		},
		label: LabelField,
		placeholder: PlaceholderField,
		hint: HintField,
		isVisibleHint: HintVisibilityField,
		hasSlotsAllAvailableResources: HasSlotsAllAvailableResourcesField,
	};

	#bookingSettingsDataModel: BookingSettingsDataModel;
	#isAutoSelectionOn: boolean;
	#templateId: string;

	#resourceLoader: ?Loader = null;
	#loadingResources: boolean = false;

	#catalogSkuEntityOptions: ?CatalogSkuEntityOptions = null;
	#managerField: ManagerField;

	constructor({ listItemOptions, isAutoSelectionOn, templateId }: BookingSettingsPopupOptions)
	{
		super();
		this.setEventNamespace('BX.Booking.CrmForm.PublicForm.BookingSettingsPopup');

		this.#options = listItemOptions;
		this.#isAutoSelectionOn = isAutoSelectionOn;
		this.#templateId = templateId;

		this.#bookingSettingsDataModel = new BookingSettingsDataModel(
			listItemOptions.sourceOptions.settingsData || {},
			isAutoSelectionOn,
			templateId,
		);

		this.#initFields(this.#bookingSettingsDataModel.form);
	}

	#initFields(settingsData: Object): void
	{
		const changeField = (field: { [key: string]: mixed }) => {
			this.#updateSettings(field);
		};

		this.#layout = {};
		this.#layout.label = new LabelField(
			settingsData.label || '',
			(label: string) => changeField({ label }),
		);
		this.#layout.placeholder = new PlaceholderField(
			settingsData.textHeader || '',
			(textHeader: string) => changeField({ textHeader }),
		);
		this.#layout.hint = new HintField(
			settingsData.hint || '',
			(hint: string) => changeField({ hint }),
		);
		this.#layout.isVisibleHint = new HintVisibilityField(
			Boolean(settingsData?.isVisibleHint),
			(isVisibleHint) => changeField({ isVisibleHint }),
		);
		this.#layout.hasSlotsAllAvailableResources = new HasSlotsAllAvailableResourcesField(
			Boolean(settingsData?.hasSlotsAllAvailableResources),
			(hasSlotsAllAvailableResources) => changeField({ hasSlotsAllAvailableResources }),
			this.#isAutoSelectionOn,
		);

		this.#layout.sku = {};
		this.#layout.sku.label = new LabelField(
			settingsData.skuLabel || '',
			(skuLabel: string) => changeField({ skuLabel }),
		);
		this.#layout.sku.placeholder = new PlaceholderField(
			settingsData.skuTextHeader || '',
			(skuTextHeader: string) => changeField({ skuTextHeader }),
		);
		this.#layout.sku.hint = new HintField(
			settingsData.skuHint || '',
			(skuHint: string) => changeField({ skuHint }),
		);
		this.#layout.sku.isVisibleHint = new HintVisibilityField(
			Boolean(settingsData?.isVisibleSkuHint),
			(isVisibleSkuHint) => changeField({ isVisibleSkuHint }),
		);
	}

	get #templateWithSkus(): boolean
	{
		return CrmFormTemplatesWithSku.includes(this.#templateId);
	}

	async show(): void
	{
		await this.#loadResources(this.#getResourceIds());

		if (this.#templateWithSkus)
		{
			await this.#loadSkus();
		}

		const container = this.#getBodyContainer();

		Dom.append(this.#renderContent(), container);
		BX.UI.Hint.init(container);
		this.#managerField.updateCounter();

		Dom.style(container, 'display', 'block');
	}

	async #loadResources(ids: number): Promise<void>
	{
		if (ids.length === 0)
		{
			return;
		}

		this.#setLoadingResources(true);

		await resourceStore.ensure(this.#getResourceIds());
		this.#setResourceIds(this.#filterAvailableResourceIds(ids));

		this.#setLoadingResources(false);
	}

	async #loadSkus(): Promise<void>
	{
		this.#setLoadingResources(true);
		this.#catalogSkuEntityOptions = await crmFormService.getCatalogSkuEntityOptions();
		this.#setLoadingResources(false);
	}

	#setLoadingResources(loading: boolean): void
	{
		const container = this.#getHeaderContainer();

		this.#loadingResources = loading;
		if (this.#loadingResources)
		{
			this.#resourceLoader ??= new Loader({ size: 40 });

			Dom.style(container, 'opacity', 0.8);
			void this.#resourceLoader.show(container);
		}
		else
		{
			Dom.style(container, 'opacity', 1);
			void this.#resourceLoader.hide();
		}
	}

	#filterAvailableResourceIds(ids: number[]): number[]
	{
		const availableResources: ResourceModel[] = resourceStore.getAll();
		const availableResourceIds: Set<number> = new Set(
			availableResources.map((resource: ResourceModel): number => resource.id),
		);

		return ids.filter((id: number) => availableResourceIds.has(id));
	}

	close(): void
	{
		const container = this.#getBodyContainer();
		this.emit('onClose');

		Dom.style(container, 'display', 'none');
		Dom.clean(container);
	}

	getSettings(): Object
	{
		this.#updateSettings();

		return this.#options.sourceOptions.settingsData;
	}

	#getHeaderContainer(): HTMLElement
	{
		return document.querySelector(`.landing-ui-component-list-item[data-id="${this.#options.id}"] .landing-ui-component-list-item-header`);
	}

	#getBodyContainer(): HTMLElement
	{
		return document.querySelector(`.landing-ui-component-list-item[data-id="${this.#options.id}"] .landing-ui-component-list-item-body`);
	}

	#renderContent(): HTMLElement
	{
		return Tag.render`
			<div class="landing-ui-form landing-ui-form-form-settings booking-crm-forms-settings">
				<div class="landing-ui-form-description"></div>
				${this.#templateWithSkus ? this.#renderSkuField() : this.#renderResourceField()}
				${this.#renderSkuLabelField()}
				${this.#renderSkuPlaceholderField()}
				${this.#renderSkuHintField()}
				${this.#renderIsVisibleSkuHint()}
				${this.#templateWithSkus ? '<div class="booking-crm-forms-settings-field-divider"></div>' : ''}
				${this.#renderLabelField()}
				${this.#renderPlaceholderField()}
				${this.#renderHintField()}
				${this.#renderIsVisibleHint()}
				${this.#renderHasSlotsAllAvailableResources()}
			</div>
		`;
	}

	#renderSkuField(): HTMLElement
	{
		this.#managerField = new SkusAndResourcesField({
			catalogSkuEntityOptions: this.#catalogSkuEntityOptions,
			getResources: this.#getResources.bind(this),
			getBodyContainer: this.#getBodyContainer.bind(this),
			onUpdateResources: (resources: { id: number, skus: number[] }[]) => {
				this.#setResources(resources);
				this.#updateSettings();
			},
		});

		return this.#managerField.render();
	}

	#renderResourceField(): HTMLElement
	{
		this.#managerField = new ResourcesField({
			getResourceIds: this.#getResourceIds.bind(this),
			getBodyContainer: this.#getBodyContainer.bind(this),
			onUpdateResourceIds: (resourceIds: number[]) => {
				this.#setResourceIds(resourceIds);
				this.#updateSettings();
			},
		});

		return this.#managerField.render();
	}

	#getResourceIds(): number[]
	{
		return this.#bookingSettingsDataModel.form.resourceIds;
	}

	#getResources(): { id: number, skus: number[] }[]
	{
		return this.#bookingSettingsDataModel.form.resources;
	}

	#setResourceIds(resourceIds: number[] | mixin): void
	{
		this.#bookingSettingsDataModel.setSettingsData({
			resourceIds: Type.isArray(resourceIds) ? resourceIds : [],
		});
		this.#updateSettings();
	}

	#setResources(resources: { id: number, sku: number[] }[]): void
	{
		this.#bookingSettingsDataModel.setSettingsData({
			resources: Type.isArray(resources) ? resources : [],
		});
		this.#updateSettings();
	}

	#renderLabelField(): HTMLElement
	{
		return this.#layout.label.getLayout();
	}

	#renderPlaceholderField(): HTMLElement
	{
		return this.#layout.placeholder.getLayout();
	}

	#renderHintField(): HTMLElement
	{
		if (this.#isAutoSelectionOn && !this.#bookingSettingsDataModel.form.hint)
		{
			this.#layout.hint.setValue(
				Loc.getMessage('BOOKING_CRM_FORMS_SETTINGS_HINT_DEFAULT_VALUE'),
			);
		}

		return this.#layout.hint.getLayout();
	}

	#renderIsVisibleHint(): HTMLElement
	{
		return this.#layout.isVisibleHint.getLayout();
	}

	#renderHasSlotsAllAvailableResources(): HTMLElement | string
	{
		return this.#layout.hasSlotsAllAvailableResources.getLayout();
	}

	#renderSkuLabelField(): ?HTMLElement
	{
		if (!this.#templateWithSkus)
		{
			return null;
		}

		return this.#layout.sku.label.getLayout();
	}

	#renderSkuPlaceholderField(): ?HTMLElement
	{
		if (!this.#templateWithSkus)
		{
			return null;
		}

		return this.#layout.sku.placeholder.getLayout();
	}

	#renderSkuHintField(): HTMLElement
	{
		if (!this.#templateWithSkus)
		{
			return null;
		}

		if (this.#isAutoSelectionOn && !this.#bookingSettingsDataModel.form.skuHint)
		{
			this.#layout.sku.hint.setValue('');
		}

		return this.#layout.sku.hint.getLayout();
	}

	#renderIsVisibleSkuHint(): HTMLElement
	{
		return this.#layout.sku.isVisibleHint.getLayout();
	}

	#updateSettings(settings = null): void
	{
		this.#bookingSettingsDataModel.setSettingsData(settings);

		this.#options.sourceOptions.settingsData = {
			...this.#options.sourceOptions.settingsData,
			isAutoSelectionOn: this.#isAutoSelectionOn,
			...this.#bookingSettingsDataModel.settingsData,
		};

		this.emit('onChange');
		this.#options.form.emit('onChange');
	}
}
