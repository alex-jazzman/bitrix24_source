import { Loc, Type } from 'main.core';

import { SkuResourcesEditor } from 'booking.application.sku-resources-editor';
import type { ResourceModel } from 'booking.model.resources';
import type { CatalogSkuEntityOptions } from 'booking.model.sku';
import { crmFormService } from 'booking.provider.service.crm-form-service';

export class SkusResourcesManager
{
	#editor: ?SkuResourcesEditor;
	#catalogSkuEntityOptions: ?CatalogSkuEntityOptions = null;
	#onUpdateResources = Function;

	constructor(catalogSkuEntityOptions: ?CatalogSkuEntityOptions, onUpdateResources: Function)
	{
		this.#catalogSkuEntityOptions = catalogSkuEntityOptions;
		this.#onUpdateResources = onUpdateResources;
	}

	open(resources: { id: number, skus: number[] }[]): void
	{
		this.#editor = new SkuResourcesEditor({
			title: Loc.getMessage('BOOKING_CRM_FORMS_SETTINGS_SKUS_RESOURCES_EDITOR_TITLE'),
			description: Loc.getMessage('BOOKING_CRM_FORMS_SETTINGS_SKUS_RESOURCES_EDITOR_DESCRIPTION'),
			options: {
				editMode: true,
				catalogSkuEntityOptions: this.#catalogSkuEntityOptions,
			},
			loadData: () => this.loadResources(resources),
			save: (data) => this.saveResources(data),
		});

		this.#editor.open();
	}

	async loadResources(resources: { id: number, skus: number[] }[]): Promise<ResourceModel[]>
	{
		await this.#loadResourcesTypes();

		return crmFormService.getResourceSkuRelations(resources);
	}

	async #loadResourcesTypes(): Promise<void>
	{
		await crmFormService.getResourceTypeList();
	}

	async saveResources(data = []): void
	{
		if (Type.isNil(data) || !Type.isArray(data.resources))
		{
			return;
		}

		const resources = data.resources.map(({ id, skus }) => {
			return {
				id,
				skus: skus.map((sku) => sku.id),
			};
		});

		this.#onUpdateResources(resources);
	}
}
