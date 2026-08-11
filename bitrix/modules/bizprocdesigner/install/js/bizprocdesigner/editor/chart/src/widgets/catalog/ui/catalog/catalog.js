import { storeToRefs } from 'ui.vue3.pinia';
import {
	HeaderLayout,
	HeaderLogo,
	CatalogGroupList,
	CatalogGroup,
	CatalogGroupEmptyLabel,
	CatalogGroupIcon,
	CatalogItem,
	SearchResultsLayout,
	SearchResultsLabel,
	SearchResultsEmptyLabel,
	useCatalogStore,
	getDragItemSlotName,
	CatalogItemTooltip,
} from '../../../../entities/catalog';
import type {
	CatalogMenuGroup,
	CatalogMenuItem,
	CatalogMenuItemId,
	GetDragItemSlotName,
	SearchResults,
} from '../../../../entities/catalog';
import {
	HoverCatalogLayout,
	FixedCatalogBurgerBtn,
	SearchCatalogItemsInput,
	ChangeCatalogGroup,
	ChangeFoundedCatalogGroup,
	ChangeFoundedCatalogItem,
	BackToGroupsBtn,
} from '../../../../features/catalog';

type CatalogSetup = {
	isExpandedCatalog: boolean,
	searchResultsCount: number,
	searchResults: SearchResults,
	currentGroup: CatalogMenuGroup | null,
	currentItem: CatalogMenuItem | null,
	groups: Array<CatalogMenuGroup>,
	highlightedItems: Set<CatalogMenuItemId>,
	getDragItemSlotName: GetDragItemSlotName,
};

// @vue/component
export const Catalog = {
	name: 'CatalogWidget',
	components: {
		HoverCatalogLayout,
		HeaderLogo,
		HeaderLayout,
		CatalogGroupList,
		CatalogGroup,
		CatalogGroupEmptyLabel,
		CatalogGroupIcon,
		CatalogItem,
		SearchResultsLayout,
		SearchResultsLabel,
		SearchResultsEmptyLabel,
		FixedCatalogBurgerBtn,
		SearchCatalogItemsInput,
		ChangeCatalogGroup,
		ChangeFoundedCatalogGroup,
		ChangeFoundedCatalogItem,
		BackToGroupsBtn,
		CatalogItemTooltip,
	},
	setup(): CatalogSetup
	{
		const catalogStore = useCatalogStore();
		const {
			isExpandedCatalog,
			groups,
			currentGroup,
			currentItem,
			searchResultsCount,
			searchResults,
			highlightedItems,
		} = storeToRefs(catalogStore);

		return {
			isExpandedCatalog,
			searchResultsCount,
			searchResults,
			currentGroup,
			currentItem,
			groups,
			highlightedItems,
			getDragItemSlotName,
		};
	},
	template: `
		<HoverCatalogLayout>
			<template #header>
				<HeaderLayout :expanded="isExpandedCatalog">
					<template #switcher>
						<FixedCatalogBurgerBtn/>
					</template>
					<template #logo>
						<HeaderLogo/>
					</template>
				</HeaderLayout>
			</template>

			<template #search>
				<SearchCatalogItemsInput :focusable="isExpandedCatalog"/>
			</template>

			<template #content>
				<CatalogGroupList
					:groups="groups"
					:currentGroup="currentGroup"
				>
					<template #group="{ group }">
						<ChangeCatalogGroup :group="group">
							<template #icon>
								<CatalogGroupIcon :iconName="group.icon"/>
							</template>

							<template #back>
								<BackToGroupsBtn
									:groupTitle="group.title"
									:collapsed="!isExpandedCatalog"
								>
									<template #icon>
										<CatalogGroupIcon :iconName="group.icon"/>
									</template>
								</BackToGroupsBtn>
							</template>

							<template #items>
								<CatalogItemTooltip
									v-for="item in group.items"
									:key="item.id"
									:title="item.title"
									:subtitle="item.subtitle"
								>
									<CatalogItem
										:item="item"
										:active="highlightedItems.has(item.id) && isExpandedCatalog"
									>
										<template #[getDragItemSlotName(item.type)]="{ item }">
											<slot
												:name="getDragItemSlotName(item.type)"
												:item="item"
											/>
										</template>
									</CatalogItem>
								</CatalogItemTooltip>
							</template>

							<template #empty-label>
								<CatalogGroupEmptyLabel/>
							</template>
						</ChangeCatalogGroup>
					</template>
				</CatalogGroupList>
			</template>

			<template #search-results>
				<SearchResultsLayout
					:groups="searchResults.groups"
					:items="searchResults.items"
					:collapsed="!isExpandedCatalog"
				>

					<template #group="{ group }">
						<ChangeFoundedCatalogGroup :group="group">
							<template #icon>
								<CatalogGroupIcon :iconName="group.icon"/>
							</template>
						</ChangeFoundedCatalogGroup>
					</template>

					<template #item="{ item }">
						<CatalogItemTooltip
							:title="item.title"
							:subtitle="item.subtitle"
						>
							<ChangeFoundedCatalogItem :item="item">
								<template #[getDragItemSlotName(item.type)]="{ item }">
									<slot
										:name="getDragItemSlotName(item.type)"
										:item="item"
									/>
								</template>
							</ChangeFoundedCatalogItem>
						</CatalogItemTooltip>
					</template>

					<template #empty-label>
						<SearchResultsEmptyLabel/>
					</template>
				</SearchResultsLayout>
			</template>

			<template #footer>
				<slot name="footer"/>
			</template>
		</HoverCatalogLayout>
	`,
};
