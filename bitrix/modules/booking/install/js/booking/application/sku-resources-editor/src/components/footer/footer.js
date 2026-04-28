import { Type } from 'main.core';
import { EventEmitter } from 'main.core.events';

import { deepToRaw } from 'booking.lib.deep-to-raw';
import { EventName, Model, SkuResourcesEditorTab } from 'booking.const';
import type { ResourceModel } from 'booking.model.resources';
import type { SkuResourcesEditorOptions } from 'booking.model.sku-resources-editor';


import { SaveButton } from './save-button';
import { CancelButton } from './cancel-button';

import './footer.css';

// @vue/component
export const SkuResourcesEditorFooter = {
	name: 'SkuResourcesEditorFooter',
	components: {
		SaveButton,
		CancelButton,
	},
	props: {
		/** @type { SkuResourcesEditorParams } */
		params: {
			type: Object,
			required: true,
		},
	},
	computed: {
		skusResourcesEditorOptions(): SkuResourcesEditorOptions
		{
			return this.$store.state[Model.SkuResourcesEditor].options;
		},
	},
	methods: {
		closeEditor(): void
		{
			EventEmitter.emit(EventName.CloseSkuResourcesEditor);
		},
		async save(): Promise<void>
		{
			if (Type.isFunction(this.params.save))
			{
				if (!this.skusResourcesEditorOptions.canBeEmpty && (await this.validate()).invalid)
				{
					return;
				}

				this.params.save({
					resources: this.getResources(),
				});
			}

			this.closeEditor();
		},
		async validate(): Promise<{ invalid: boolean }>
		{
			await this.$store.dispatch(`${Model.SkuResourcesEditor}/updateInvalid`, {
				invalidSku: false,
				invalidResource: false,
			});

			const hasInvalidResources = this.isResourcesValid();
			const hasInvalidSkus = this.isSkusValid();

			await this.$store.dispatch(`${Model.SkuResourcesEditor}/updateInvalid`, {
				invalidSku: hasInvalidSkus,
				invalidResource: hasInvalidResources,
			});
			await this.changeTab({ hasInvalidSkus, hasInvalidResources });

			return {
				invalid: hasInvalidResources || hasInvalidSkus,
			};
		},
		isResourcesValid(): boolean
		{
			const skusSets: MapIterator<Set<number>> = this.$store.state[Model.SkuResourcesEditor].resourcesSkusMap.values();

			for (const skusSet of skusSets)
			{
				if (!(skusSet instanceof Set) || skusSet.size === 0)
				{
					return true;
				}
			}

			return false;
		},
		isSkusValid(): boolean
		{
			const resourcesSets = this.$store.getters[`${Model.SkuResourcesEditor}/skusResourcesMap`].values();

			for (const resourcesSet of resourcesSets)
			{
				if (!(resourcesSet instanceof Set) || resourcesSet.size === 0)
				{
					return true;
				}
			}

			return false;
		},
		async changeTab({ hasInvalidSkus = false, hasInvalidResources = false }): Promise<void>
		{
			const activeTab = this.$store.state[Model.SkuResourcesEditor].tab;

			if (activeTab === SkuResourcesEditorTab.Skus && hasInvalidResources && !hasInvalidSkus)
			{
				await this.$store.dispatch(`${Model.SkuResourcesEditor}/updateTab`, SkuResourcesEditorTab.Resources);
			}
			else if (activeTab === SkuResourcesEditorTab.Resources && hasInvalidSkus && !hasInvalidResources)
			{
				await this.$store.dispatch(`${Model.SkuResourcesEditor}/updateTab`, SkuResourcesEditorTab.Skus);
			}
		},
		getResources(): any[]
		{
			const resourcesSkusMap = this.$store.state[Model.SkuResourcesEditor].resourcesSkusMap;
			const resourcesMap = this.$store.state[Model.SkuResourcesEditor].resources;
			const skusMap = this.$store.state[Model.SkuResourcesEditor].skus;

			const resources: ResourceModel[] = [];

			for (const [resourceId, skusSet] of resourcesSkusMap)
			{
				if (!resourcesMap.has(resourceId) || (skusSet.size === 0 && !this.skusResourcesEditorOptions.canBeEmpty))
				{
					continue;
				}

				const skus = [];

				for (const skuId of skusSet)
				{
					if (!skusMap.has(skuId))
					{
						continue;
					}

					skus.push(deepToRaw(skusMap.get(skuId)));
				}

				const resource = deepToRaw(resourcesMap.get(resourceId));
				resource.skus = skus;

				resources.push(resource);
			}

			return resources;
		},
	},
	template: `
		<div class="booking-sre-app__footer">
			<SaveButton @click="save"/>
			<CancelButton @click="closeEditor"/>
		</div>
	`,
};
