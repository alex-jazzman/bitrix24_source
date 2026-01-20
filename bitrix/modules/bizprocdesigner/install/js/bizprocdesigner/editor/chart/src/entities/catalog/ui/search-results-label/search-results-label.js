import './search-results-label.css';
import { computed } from 'ui.vue3';
import { BIcon, Outline } from 'ui.icon-set.api.vue';
import { useLoc } from '../../../../shared/composables';
import type { GetMessage } from '../../../../shared/composables';

export type SearchResultsLabelSetup = {
	iconSet: { [string]: string },
	searchResultsLablelClassNames: { [string]: boolean },
	countLabel: string,
	getMessage: GetMessage,
}

const SEARCH_RESULTS_LABEL_CLASS_NAMES = {
	base: 'editor-chart-search-results-label',
	collapsed: '--collapsed',
};

// @vue/component
export const SearchResultsLabel = {
	name: 'search-results-label',
	components: {
		BIcon,
	},
	props: {
		count: {
			type: Number,
			default: 0,
		},
		collapsed: {
			type: Boolean,
			default: false,
		},
	},
	setup(props): SearchResultsLabelSetup
	{
		const { getMessage } = useLoc();

		const searchResultsLablelClassNames = computed((): { [string]: boolean } => ({
			[SEARCH_RESULTS_LABEL_CLASS_NAMES.base]: true,
			[SEARCH_RESULTS_LABEL_CLASS_NAMES.collapsed]: props.collapsed,
		}));

		const countLabel = computed((): string => {
			return props.count === 0
				? getMessage('BIZPROCDESIGNER_EDITOR_NOT_FOUND')
				: getMessage('BIZPROCDESIGNER_EDITOR_FOUND', { '#count#': props.count });
		});

		return {
			iconSet: Outline,
			searchResultsLablelClassNames,
			countLabel,
			getMessage,
		};
	},
	template: `
		<div :class="searchResultsLablelClassNames">
			<BIcon
				v-if="collapsed"
				:name="iconSet.SEARCH"
				:size="20"
				class="editor-chart-search-results-label__icon"
			/>
			<p
				v-if="!collapsed"
				class="editor-chart-search-results-label__count"
			>
				{{ countLabel }}
			</p>
			<p
				v-if="!collapsed"
				class="editor-chart-search-results-label__location"
			>
				{{ getMessage('BIZPROCDESIGNER_EDITOR_EVERYWHERE') }}
			</p>
		</div>
	`,
};
