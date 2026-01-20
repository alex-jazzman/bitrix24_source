import './search-results-layout.css';
import { computed } from 'ui.vue3';
import { useLoc } from '../../../../shared/composables';
import type { GetMessage } from '../../../../shared/composables';
import type { CatalogMenuGroup, CatalogMenuItem } from '../../types';

export type SearchResultsLayoutSetup = {
	titleClassNames: { [string]: boolean },
	getMessage: GetMessage,
}

const TITLE_CLASS_NAMES = {
	base: 'editor-chart-search-results-layout__title',
	collapsed: '--collapsed',
};

// @vue/component
export const SearchResultsLayout = {
	name: 'search-results-layout',
	props: {
		/** @type Array<CatalogMenuGroup> */
		groups: {
			type: Array,
			default: () => ([]),
		},
		/** @type Array<CatalogMenuItem> */
		items: {
			type: Array,
			default: () => ([]),
		},
		collapsed: {
			type: Boolean,
			default: false,
		},
	},
	setup(props): SearchResultsLayoutSetup
	{
		const { getMessage } = useLoc();

		const titleClassNames = computed((): { [string]: boolean } => ({
			[TITLE_CLASS_NAMES.base]: true,
			[TITLE_CLASS_NAMES.collapsed]: props.collapsed,
		}));

		return {
			getMessage,
			titleClassNames,
		};
	},
	template: `
		<div class="editor-chart-search-results-layout">

			<div
				v-if="groups.length > 0 || items.length > 0"
				class="editor-chart-search-results-layout__content"
			>
				<div
					v-if="groups.length > 0"
					class="editor-chart-search-results-layout__groups">
					<h2 :class="titleClassNames">
						{{ getMessage('BIZPROCDESIGNER_EDITOR_SEARCH_GROUPS') }}
					</h2>
					<slot
						v-for="group in groups"
						:key="group.id"
						:group="group"
						name="group"
					/>
				</div>

				<div
					v-if="items.length > 0"
					class="editor-chart-search-results-layout__items"
				>
					<h2 :class="titleClassNames">
						{{ getMessage('BIZPROCDESIGNER_EDITOR_SEARCH_NODES') }}
					</h2>
					<slot
						v-for="item in items"
						:key="item.id"
						:item="item"
						name="item"
					/>
				</div>
			</div>

			<div
				v-else-if="!collapsed"
				class="editor-chart-search-results-layout__empty"
			>
				<slot name="empty-label"/>
			</div>
		</div>
	`,
};
