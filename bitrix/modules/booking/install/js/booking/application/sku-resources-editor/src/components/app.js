import { Model } from 'booking.const';

import { SkuResourcesEditorLayout } from './layout/layout';
import { SkuResourcesEditorFooter } from './footer/footer';
import { SkuResourcesEditorHeader } from './header/header';
import { SkuResourcesEditorSku } from './sku-settings/sku-settings';

import type { SkuResourcesEditorParams } from './types';

export type { SkuResourcesEditorParams };

// @vue/component
export const App = {
	name: 'SkuResourcesEditorApp',
	components: {
		SkuResourcesEditorLayout,
		SkuResourcesEditorHeader,
		SkuResourcesEditorFooter,
		SkuResourcesEditorSku,
	},
	props: {
		/**
		 * @type { SkuResourcesEditorParams }
		 */
		params: {
			type: Object,
			required: true,
		},
	},
	data(): { loading: boolean }
	{
		return {
			loading: false,
		};
	},
	created()
	{
		this.setOptions();
		void this.fetchResources();
	},
	methods: {
		async fetchResources(): Promise<void>
		{
			this.loading = true;
			this.$store.commit(`${Model.SkuResourcesEditor}/setFetching`, true);
			const resources = await this.params.loadData();

			await this.$store.dispatch(`${Model.SkuResourcesEditor}/setResources`, resources);

			this.loading = false;
			this.$store.commit(`${Model.SkuResourcesEditor}/setFetching`, false);
		},
		setOptions()
		{
			this.$store.commit(`${Model.SkuResourcesEditor}/setOptions`, this.params.options);
		},
	},
	template: `
		<SkuResourcesEditorLayout>
			<template #header>
				<SkuResourcesEditorHeader
					:title="params.title"
				/>
			</template>

			<SkuResourcesEditorSku
				:description="params.description"
				:loading
			/>

			<template #footer>
				<SkuResourcesEditorFooter :params/>
			</template>
		</SkuResourcesEditorLayout>
	`,
};
