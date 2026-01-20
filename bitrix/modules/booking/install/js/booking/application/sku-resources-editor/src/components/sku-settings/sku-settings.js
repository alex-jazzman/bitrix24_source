import { UiTabs } from 'booking.component.ui-tabs';
import type { tabsOptions } from 'booking.component.ui-tabs';

import { Button as UiButton } from 'booking.component.button';
import { Model, SkuResourcesEditorTab } from 'booking.const';
import type { ResourceModel } from 'booking.model.resources';

import { SkusView } from '../skus-view/skus-view';
import { ResourcesView } from '../resources-view/resources-view';

import './sku-settings.css';

// @vue/component
export const SkuResourcesEditorSku = {
	name: 'SkuResourcesEditorSku',
	components: {
		UiTabs,
		UiButton,
		SkusView,
		ResourcesView,
	},
	props: {
		description: {
			type: String,
			default: null,
		},
		loading: {
			type: Boolean,
			default: false,
		},
	},
	computed: {
		resourcesSkusMap(): Map<number, Set<number>>
		{
			return this.$store.state[Model.SkuResourcesEditor].resourcesSkusMap;
		},
		activeComponent: {
			get(): $Values<typeof SkuResourcesEditorTab>
			{
				return this.$store.state[Model.SkuResourcesEditor].tab;
			},
			set(tab: string): void
			{
				this.$store.commit(`${Model.SkuResourcesEditor}/updateTab`, tab);
			},
		},
		tabs(): tabsOptions[]
		{
			return [
				{
					title: this.loc('BOOKING_SRE_TAB_SKUS_LABEL'),
					componentName: SkuResourcesEditorTab.Skus,
				},
				{
					title: this.loc('BOOKING_SRE_TAB_RESOURCES_LABEL'),
					componentName: SkuResourcesEditorTab.Resources,
				},
			];
		},
		resources(): ResourceModel[]
		{
			return this.$store.state[Model.SkuResourcesEditor].resources;
		},
	},
	watch: {
		resourcesSkusMap: {
			handler(): void
			{
				this.$store.dispatch(`${Model.SkuResourcesEditor}/updateInvalid`, {
					invalidSku: false,
					invalidResource: false,
				});
			},
			deep: true,
		},
	},
	template: `
		<div class="booking-sre-app__sku-settings">
			<div
				v-if="description"
				class="booking-sre-app__sku-settings_description"
			>
				{{ description }}
			</div>
			<div class="booking-sre-app__sku-settings-content">
				<UiTabs
					v-model:activeComponent="activeComponent"
					:tabsOptions="tabs"
				>
					<template #SkusView>
						<SkusView :loading/>
					</template>
					<template #ResourcesView>
						<ResourcesView/>
					</template>
				</UiTabs>
			</div>
		</div>
	`,
};
