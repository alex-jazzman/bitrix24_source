import {
	CatalogGroupBackBtn,
	useCatalogStore,
} from '../../../../entities/catalog';

type BackToGroupsBtnSetup = {
	onResetCurrentGroup: () => void,
};

// @vue/component
export const BackToGroupsBtn = {
	name: 'back-to-groups-btn',
	components: {
		CatalogGroupBackBtn,
	},
	props: {
		groupTitle: {
			type: String,
			default: '',
		},
		collapsed: {
			type: Boolean,
			default: false,
		},
	},
	setup(): BackToGroupsBtnSetup
	{
		const catalogStore = useCatalogStore();

		function onResetCurrentGroup(): void
		{
			catalogStore.resetCurrentGroup();
			catalogStore.resetHighlightedItem();
			catalogStore.hideFoundedGroupItems();
		}

		return {
			onResetCurrentGroup,
		};
	},
	template: `
		<CatalogGroupBackBtn
			:groupTitle="groupTitle"
			:collapsed="collapsed"
			@click="onResetCurrentGroup"
		>
			<template #icon>
				<slot name="icon"/>
			</template>
		</CatalogGroupBackBtn>
	`,
};
