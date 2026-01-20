import { storeToRefs } from 'ui.vue3.pinia';
import { computed } from 'ui.vue3';
import {
	CatalogGroup,
	useCatalogStore,
} from '../../../../entities/catalog';
import type { CatalogMenuGroup } from '../../../../entities/catalog';

type ChangeCatalogGroupSetup = {
	isShowItems: boolean,
	onChangeGroup: (group: CatalogMenuGroup) => void,
};

// @vue/component
export const ChangeCatalogGroup = {
	name: 'ChangeCatalogGroup',
	components: {
		CatalogGroup,
	},
	props: {
		/** @type CatalogMenuGroup */
		group: {
			type: Object,
			required: true,
		},
	},
	setup(props): ChangeCatalogGroupSetup
	{
		const catalogStore = useCatalogStore();
		const { currentGroup } = storeToRefs(catalogStore);

		const isShowItems = computed((): boolean => {
			return props.group.id === currentGroup?.value?.id;
		});

		return {
			isShowItems,
			onChangeGroup: catalogStore.changeCurrentGroup,
		};
	},
	template: `
		<CatalogGroup
			:group="group"
			:showItems="isShowItems"
			@changeGroup="onChangeGroup"
		>
			<template #icon>
				<slot name="icon"/>
			</template>

			<template #back>
				<slot name="back"/>
			</template>

			<template #items>
				<slot name="items"/>
			</template>

			<template #empty-label>
				<slot name="empty-label"/>
			</template>
		</CatalogGroup>
	`,
};
