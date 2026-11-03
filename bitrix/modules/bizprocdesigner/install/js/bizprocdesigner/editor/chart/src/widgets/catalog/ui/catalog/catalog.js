import { Event } from 'main.core';
import { storeToRefs } from 'ui.vue3.pinia';
import {
	computed,
	nextTick,
	onMounted,
	onUnmounted,
	toValue,
	useTemplateRef,
	watch,
	type Ref,
} from 'ui.vue3';
import {
	isKeyboardBusyByOverlay,
	useBlockDiagram,
	useKeyboardShortcuts,
	KEY_TOKEN,
} from 'ui.block-diagram';
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
import { useDataViewDefinitionStore } from '../../../../features/data-view-editor';
import { focusProgrammatically, isEditableElement } from '../../../../shared/utils';

// What `useTemplateRef()` holds for a component: its public instance, and the root element with it.
type ComponentTemplateRef = Ref<?{ $el: ?HTMLElement }>;

function elementOf(componentRef: ComponentTemplateRef): ?HTMLElement
{
	return toValue(componentRef)?.$el ?? null;
}

/**
 * The keyboard follows the panel the way it follows the search and the map: into the catalog it has
 * just opened, and back onto the button that opened it once the panel folds away.
 *
 * The entry point of an opened catalog is the first group of the content, and the search field
 * deliberately is not: the canvas hands a focused field nothing but Escape, so the very combo that
 * opened the panel would stop closing it.
 */
function followCatalogWithFocus(
	isExpanded: boolean,
	panelRef: ComponentTemplateRef,
	burgerRef: ComponentTemplateRef,
): void
{
	if (!isExpanded)
	{
		elementOf(burgerRef)?.focus();

		return;
	}

	const panel = elementOf(panelRef);

	focusProgrammatically(panel?.querySelector('[data-group-id]') ?? panel);
}

function focusCatalogGroup(panelRef: ComponentTemplateRef, groupId: ?string): void
{
	const panel = elementOf(panelRef);
	const group = groupId === null
		? null
		: panel?.querySelector(`[data-group-id="${CSS.escape(groupId)}"]`);

	focusProgrammatically(group ?? panel);
}

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
	props: {
		dragDisabled: {
			type: Boolean,
			default: false,
		},
	},
	// eslint-disable-next-line max-lines-per-function
	setup(): CatalogSetup
	{
		const catalogStore = useCatalogStore();
		const {
			isExpandedCatalog,
			isFixedCatalog,
			groups,
			currentGroup,
			currentItem,
			searchResultsCount,
			searchResults,
			highlightedItems,
			isShowFoundedGroupItems,
		} = storeToRefs(catalogStore);
		const { isOpen: isDataViewEditorOpen } = storeToRefs(useDataViewDefinitionStore());
		const { inputState, isDisabledBlockDiagram } = useBlockDiagram();
		const catalogPanel = useTemplateRef('catalogPanel');
		const burgerBtn = useTemplateRef('burgerBtn');

		// A group is entered two ways - by an ordinary click and from the search results - and both
		// of them are left by the same key.
		const isGroupOpened = computed((): boolean => {
			return toValue(currentGroup) !== null || toValue(isShowFoundedGroupItems) === true;
		});

		// The claim is not display data and lives exactly as long as the open group does.
		let unsubscribeEscape = null;
		let isFieldFocused = isEditableElement(document.activeElement);

		// Without the second call the press would change nothing on screen: what the panel shows is
		// `isExpandedCatalog`, and the two actions that move it answer the pointer alone and refuse
		// to touch a pinned catalog.
		function toggleFixedCatalogFromKeyboard(event: KeyboardEvent): void
		{
			if (isKeyboardBusyByOverlay() || toValue(isDisabledBlockDiagram))
			{
				return;
			}

			// A press the catalog refuses belongs to the browser, so the action goes off only once
			// the guards let the press through.
			event.preventDefault();

			catalogStore.toggleFixedCatalog();
			catalogStore.setExpandedCatalog(toValue(isFixedCatalog));

			// The press moves nothing on screen but the panel, so it says where it left the keyboard.
			void nextTick(() => followCatalogWithFocus(toValue(isFixedCatalog), catalogPanel, burgerBtn));
		}

		useKeyboardShortcuts([
			{
				keys: ['Mod', 'KeyB'],
				handler: toggleFixedCatalogFromKeyboard,
				preventDefault: false,
			},
		]);

		// Escape leaves the group the way the back button does, so both end in one state.
		function closeOpenedGroup(): void
		{
			if (isKeyboardBusyByOverlay())
			{
				return;
			}

			// Read before the reset: the group content goes away with the back button standing in it,
			// and a keyboard left there stands on <body> by the time the panel is redrawn.
			const leftGroupId = toValue(currentGroup)?.id ?? null;
			const isFocusInPanel = elementOf(catalogPanel)?.contains(document.activeElement) === true;

			catalogStore.resetFoundedGroupView();

			// The keyboard is moved only when it was already in the panel: a user working elsewhere
			// on the page keeps their place.
			if (isFocusInPanel)
			{
				void nextTick(() => focusCatalogGroup(catalogPanel, leftGroupId));
			}
		}

		// Both halves are idempotent: the widget asks for a key it may already hold and gives up one
		// it may have given up already.
		function claimEscape(): void
		{
			if (unsubscribeEscape === null)
			{
				unsubscribeEscape = inputState.onExclusive(KEY_TOKEN.ESCAPE, closeOpenedGroup);
			}
		}

		function releaseEscapeClaim(): void
		{
			unsubscribeEscape?.();
			unsubscribeEscape = null;
		}

		// The exclusive channel reaches past the layers above the canvas, so a claim held a moment
		// too long takes Escape from the whole page - the inline rename of a node first of all,
		// which cancels by the very same key, and the data view editor window, which is a modal of
		// its own and is unknown to `isKeyboardBusyByOverlay()`.
		function syncEscapeClaim(): void
		{
			if (toValue(isGroupOpened) && !isFieldFocused && !toValue(isDataViewEditorOpen))
			{
				claimEscape();

				return;
			}

			releaseEscapeClaim();
		}

		// `focusout` names where the focus goes next and `focusin` where it landed. Reading
		// `activeElement` instead would miss a focus that fell to the body: no `focusin` follows it.
		function onFocusChanged(event: FocusEvent): void
		{
			isFieldFocused = isEditableElement(
				event.type === 'focusout' ? event.relatedTarget : event.target,
			);
			syncEscapeClaim();
		}

		watch(isGroupOpened, syncEscapeClaim);
		watch(isDataViewEditorOpen, syncEscapeClaim);

		onMounted(() => {
			Event.bind(document, 'focusin', onFocusChanged);
			Event.bind(document, 'focusout', onFocusChanged);
		});

		onUnmounted(() => {
			Event.unbind(document, 'focusin', onFocusChanged);
			Event.unbind(document, 'focusout', onFocusChanged);
			releaseEscapeClaim();
		});

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
		<HoverCatalogLayout ref="catalogPanel">
			<template #header>
				<HeaderLayout :expanded="isExpandedCatalog">
					<template #switcher>
						<FixedCatalogBurgerBtn ref="burgerBtn"/>
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
										:dragDisabled="dragDisabled"
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
							<ChangeFoundedCatalogItem
								:item="item"
								:dragDisabled="dragDisabled"
							>
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
