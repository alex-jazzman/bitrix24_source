import { BIcon, Outline } from 'ui.icon-set.api.vue';
import {
	useTemplateRef,
	toValue,
	computed,
	ref,
	nextTick,
} from 'ui.vue3';
import { useLoc } from '../../composables';
import { OpenSearchBtn } from './open-search-btn';
import './search-input.css';

type SearchInputSetup = {
	iconSet: {...};
	placeholderOrDefaultValue: string;
	showSearchBtn: boolean;
	showSearchBar: boolean;
	searchInputClassNames: { [string]: boolean };
	onInput: (event: InputEvent) => void;
	onClear: () => void;
};

const SEARCH_INPUT_CLASS_NAMES = {
	base: 'ui-block-diagram-search-input',
	open: '--open',
	focus: '--focus',
};

// @vue/component
export const SearchInput = {
	name: 'SearchInput',
	components: {
		BIcon,
		OpenSearchBtn,
	},
	props: {
		value: {
			type: String,
			default: '',
		},
		open: {
			type: Boolean,
			default: false,
		},
		placeholder: {
			type: String,
			default: '',
		},
		disabled: {
			type: Boolean,
			default: false,
		},
	},
	emits: ['update:value', 'clear', 'update:open'],
	setup(props, { emit }): SearchInputSetup
	{
		const loc = useLoc();
		const searchInput = useTemplateRef('searchInput');
		const showSearchBtn = ref(true);
		const showSearchBar = ref(false);
		const isFocus = ref(false);

		const placeholderOrDefaultValue = computed((): string => {
			if (props.placeholder)
			{
				return props.placeholder;
			}

			return loc.getMessage('UI_BLOCK_DIAGRAM_SEARCH_BAR_SEARCH_PLACEHOLDER');
		});

		const searchInputClassNames = computed((): { [string]: boolean } => ({
			[SEARCH_INPUT_CLASS_NAMES.base]: true,
			[SEARCH_INPUT_CLASS_NAMES.open]: toValue(showSearchBar),
			[SEARCH_INPUT_CLASS_NAMES.focus]: toValue(isFocus),
		}));

		function onInput(event: InputEvent): void
		{
			if (props.disabled)
			{
				return;
			}

			emit('update:value', event.target.value);
		}

		function onClear(event: MouseEvent): void
		{
			event.stopPropagation();

			if (props.disabled)
			{
				return;
			}

			showSearchBar.value = false;
			emit('clear');
		}

		function onAfterEnterTransition(): void
		{
			nextTick(() => {
				isFocus.value = true;
				toValue(searchInput)?.focus();
			});
		}

		function onLeaveTransition(): void
		{
			showSearchBtn.value = true;
			emit('update:open', false);
		}

		function onOpenSearchBar(): void
		{
			showSearchBar.value = true;
			showSearchBtn.value = false;

			emit('update:open', true);
		}

		function onClickSearchInput(): void
		{
			isFocus.value = true;
			toValue(searchInput)?.focus();
		}

		function onBlurSearchInput(): void
		{
			isFocus.value = false;
		}

		function collapseSearchBar(): void
		{
			showSearchBar.value = false;
		}

		return {
			iconSet: Outline,
			showSearchBar,
			showSearchBtn,
			placeholderOrDefaultValue,
			searchInputClassNames,
			onInput,
			onClear,
			onAfterEnterTransition,
			onLeaveTransition,
			onOpenSearchBar,
			onClickSearchInput,
			onBlurSearchInput,
			collapseSearchBar,
		};
	},
	template: `
		<OpenSearchBtn
			v-show="showSearchBtn"
			:data-test-id="$blockDiagramTestId('searchOpenBtn')"
			@click="onOpenSearchBar"
		/>
		<transition
			name="ui-block-diagram-search-bar-fade"
			enter-active-class="ui-block-diagram-open-search-bar"
			leave-active-class="ui-block-diagram-close-search-bar"
			@after-enter="onAfterEnterTransition"
			@after-leave="onLeaveTransition"
		>
			<div
				v-show="showSearchBar"
				:class="searchInputClassNames"
				ref="searchBar"
				@click="onClickSearchInput"
			>
				<BIcon
					:name="iconSet.SEARCH"
					:size="20"
					class="ui-block-diagram-search-input__icon"
				/>
				<input
					:value="value"
					:placeholder="placeholderOrDefaultValue"
					:data-test-id="$blockDiagramTestId('searchInput')"
					ref="searchInput"
					type="text"
					class="ui-block-diagram-search-input__input"
					@input="onInput"
					@blur="onBlurSearchInput"
				/>
				<button
					class="ui-block-diagram-search-input__clear-btn"
					:data-test-id="$blockDiagramTestId('searchClearInputBtn')"
					@click="onClear"
				>
					<BIcon
						:name="iconSet.CROSS_L"
						:size="20"
						class="ui-block-diagram-search-input__clear-btn-icon"
					/>
				</button>
			</div>
		</transition>
	`,
};
