import './search-bar.css';
import { Event } from 'main.core';
import {
	ref,
	watch,
	toValue,
	computed,
	onMounted,
	onUnmounted,
	useTemplateRef,
} from 'ui.vue3';
import { Outline } from 'ui.icon-set.api.vue';
import {
	useBlockDiagram,
	useSearchBlocks,
	useCanvas,
	useHighlightedBlocks,
	useLoc,
} from '../../composables';
import type { DiagramBlock } from '../../types';
import { SearchResult } from './search-result';
import { SearchNavBtn } from './search-nav-btn';
import { SearchInput } from './search-input';
import { OpenSearchBtn } from './open-search-btn';

type SearchBarSetup = {
	iconSet: { ... };
	placeholderOrDefaultValue: string;
	searchResultTitleOrDefaultValue: string;
	seachText: string;
	labelResult: string;
	foundBlocks: Array<DiagramBlock>;
	onInputSearchText: (event: MouseEvent) => void;
	onClearSearch: () => void;
	goToNextBlock: () => void;
	goToPrevBlock: () => void;
}

const SEARCH_BAR_CLASS_NAMES = {
	base: 'ui-block-diagram-search-bar',
	opened: '--opened',
};

// @vue/component
export const SearchBar = {
	name: 'SearchBar',
	components: {
		SearchResult,
		SearchNavBtn,
		SearchInput,
		OpenSearchBtn,
	},
	props: {
		searchResultTitle: {
			type: String,
			default: '',
		},
		placeholder: {
			type: String,
			default: '',
		},
		searchCallback: {
			type: Function,
			required: true,
			default: (block, text) => {
				return block.node.title
					.toLowerCase()
					.includes(text.toLowerCase());
			},
		},
		searchDelay: {
			type: Number,
			default: 300,
		},
		disabled: {
			type: Boolean,
			default: false,
		},
	},
	// eslint-disable-next-line max-lines-per-function
	setup(props): SearchBarSetup
	{
		const {
			seachText,
			foundBlocks,
			onSearchBlocks,
			onClearSearch,
		} = useSearchBlocks({
			searchCallback: props.searchCallback,
			delay: props.searchDelay,
		});
		const { isDisabledBlockDiagram } = useBlockDiagram();
		const highlitedBlocks = useHighlightedBlocks();
		const loc = useLoc();
		const { goToBlockById } = useCanvas();
		const searchPanel = useTemplateRef('searchPanel');
		const searchInputRef = useTemplateRef('searchInput');
		const currentBlockIndex = ref(0);

		const isOpenedSearchBar = ref(false);

		const isDisabled = computed((): boolean => {
			return props.disabled || toValue(isDisabledBlockDiagram);
		});

		const labelResult = computed(() => {
			return `${currentBlockIndex.value + 1} / ${toValue(foundBlocks).length}`;
		});

		const placeholderOrDefaultValue = computed((): string => {
			if (props.placeholder)
			{
				return props.placeholder;
			}

			return loc.getMessage('UI_BLOCK_DIAGRAM_SEARCH_BAR_SEARCH_PLACEHOLDER');
		});

		const searchResultTitleOrDefaultValue = computed((): string => {
			if (props.searchResultTitle)
			{
				return props.searchResultTitle;
			}

			return loc.getMessage('UI_BLOCK_DIAGRAM_SEARCH_BAR_SEARCH_RESULT_TITLE');
		});

		const searchBarClassNames = computed((): { [string]: boolean } => ({
			[SEARCH_BAR_CLASS_NAMES.base]: true,
			[SEARCH_BAR_CLASS_NAMES.opened]: toValue(isOpenedSearchBar),
		}));

		watch(foundBlocks, (newBlocks) => {
			currentBlockIndex.value = 0;

			if (toValue(newBlocks).length > 0)
			{
				const id = toValue(newBlocks)[0].id;
				highlitedBlocks.clear();
				highlitedBlocks.add(id);
				goToBlockById(id);
			}
			else
			{
				highlitedBlocks.clear();
			}
		});

		onMounted(() => {
			Event.bind(document, 'mousedown', onClickOutside);
		});

		onUnmounted(() => {
			Event.unbind(document, 'mousedown', onClickOutside);
		});

		function onGoToNextBlock(): void
		{
			if (toValue(isDisabled))
			{
				return;
			}

			currentBlockIndex.value += 1;

			if (toValue(currentBlockIndex) > toValue(foundBlocks).length - 1)
			{
				currentBlockIndex.value = 0;
			}

			const id = toValue(foundBlocks)[toValue(currentBlockIndex)].id;
			highlitedBlocks.clear();
			highlitedBlocks.add(id);
			goToBlockById(id);
		}

		function onGoToPrevBlock(): void
		{
			if (toValue(isDisabled))
			{
				return;
			}

			currentBlockIndex.value -= 1;

			if (toValue(currentBlockIndex) < 0)
			{
				currentBlockIndex.value = toValue(foundBlocks).length - 1;
			}

			const id = toValue(foundBlocks)[toValue(currentBlockIndex)].id;
			highlitedBlocks.clear();
			highlitedBlocks.add(id);
			goToBlockById(toValue(foundBlocks)[toValue(currentBlockIndex)].id);
		}

		function closeAndResetSearch(): void
		{
			highlitedBlocks.clear();
			onClearSearch();
			currentBlockIndex.value = 0;
		}

		function onClickOutside(event: MouseEvent): void
		{
			if (toValue(searchPanel) && !toValue(searchPanel).contains(event.target))
			{
				closeAndResetSearch();
				toValue(searchInputRef)?.collapseSearchBar();
			}
		}

		return {
			iconSet: Outline,
			searchBarClassNames,
			isOpenedSearchBar,
			isDisabled,
			placeholderOrDefaultValue,
			searchResultTitleOrDefaultValue,
			seachText,
			labelResult,
			foundBlocks,
			onSearchBlocks,
			onClearSearch,
			closeAndResetSearch,
			onGoToNextBlock,
			onGoToPrevBlock,
		};
	},
	template: `
		<div
			:class="searchBarClassNames"
			ref="searchPanel"
		>
			<SearchInput
				v-model:open="isOpenedSearchBar"
				:value="seachText"
				:placeholder="placeholderOrDefaultValue"
				:disabled="isDisabled"
				ref="searchInput"
				@update:value="onSearchBlocks"
				@clear="closeAndResetSearch"
			/>
			<div
				v-if="foundBlocks.length > 0"
				class="ui-block-diagram-search-bar__search-result"
			>
				<SearchResult
					:title="searchResultTitleOrDefaultValue"
					:count="labelResult"
				>
					<SearchNavBtn
						:iconName="iconSet.CHEVRON_LEFT_L"
						:data-test-id="$blockDiagramTestId('searchResultPrevBtn')"
						@click="onGoToPrevBlock"
					/>
					<SearchNavBtn
						:iconName="iconSet.CHEVRON_RIGHT_L"
						:data-test-id="$blockDiagramTestId('searchResultNextBtn')"
						@click="onGoToNextBlock"
					/>
				</SearchResult>
			</div>
		</div>
	`,
};
