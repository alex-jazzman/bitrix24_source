import './search-bar.css';
import { Event } from 'main.core';
import {
	ref,
	watch,
	toValue,
	computed,
	nextTick,
	onMounted,
	onUnmounted,
	useTemplateRef,
} from 'ui.vue3';
import { Outline } from 'ui.icon-set.api.vue';
import {
	useBlockDiagram,
	useSearchBlocks,
	useCanvas,
	useCanvasFocus,
	useHighlightedBlocks,
	useKeyboardShortcuts,
	useLoc,
	pruneSelection,
} from '../../composables';
import { CANVAS_ACTION_ID, isKeyboardBusyByOverlay, KEY_TOKEN } from '../../utils';
import type { DiagramBlock, DiagramBlockId } from '../../types';
import { SearchResult } from './search-result';
import { SearchNavBtn } from './search-nav-btn';
import {
	SearchInput,
	SEARCH_FOCUS_TARGET,
	SEARCH_NAV_DIRECTION,
	type SearchFocusTarget,
	type SearchNavDirection,
} from './search-input';
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
	onNavigateResults: (direction: SearchNavDirection) => void;
}

// The diagram as it stood when the panel opened. Only the camera position is kept: a zoom the user
// changed by hand while searching is theirs, and the search never touched it.
type SearchSnapshot = {
	highlighted: Array<DiagramBlockId>;
	camera: { x: number, y: number };
};

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
		const { isDisabledBlockDiagram, inputState, transform, blockIdsInModel } = useBlockDiagram();
		const highlitedBlocks = useHighlightedBlocks();
		const loc = useLoc();
		const { goToBlockById, setCamera } = useCanvas();
		const { returnFocusToCanvas } = useCanvasFocus();
		const searchPanel = useTemplateRef('searchPanel');
		const searchInputRef = useTemplateRef('searchInput');
		const currentBlockIndex = ref(0);

		const isOpenedSearchBar = ref(false);

		// The snapshot is not display data, so it stays out of the reactive state; it lives exactly
		// as long as the claim on Escape does.
		let snapshot: SearchSnapshot | null = null;
		let unsubscribeEscape: (() => void) | null = null;

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

		// Opening claims Escape and remembers what to come back to. Every close gives the claim up as
		// it starts, so releasing it here is the backstop for a flag that fell some other way.
		watch(isOpenedSearchBar, (isOpened) => {
			if (!isOpened)
			{
				releaseSearchClaim();

				return;
			}

			const { x, y } = toValue(transform);

			snapshot = {
				highlighted: [...toValue(highlitedBlocks.highlitedBlockIds)],
				camera: { x, y },
			};
			claimEscape();
		});

		onMounted(() => {
			Event.bind(document, 'mousedown', onClickOutside);
		});

		onUnmounted(() => {
			Event.unbind(document, 'mousedown', onClickOutside);
			releaseSearchClaim();
		});

		useKeyboardShortcuts([
			{
				actionId: CANVAS_ACTION_ID.TOGGLE_SEARCH,
				handler: toggleSearchBarFromKeyboard,
				preventDefault: false,
			},
		]);

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

		// The keyboard reaches the results while the buttons that walk them are not even rendered:
		// they come with the results, and the field is the one place the search is done from.
		function onNavigateResults(direction: SearchNavDirection): void
		{
			if (toValue(foundBlocks).length === 0)
			{
				return;
			}

			if (direction === SEARCH_NAV_DIRECTION.NEXT)
			{
				onGoToNextBlock();
			}
			else if (direction === SEARCH_NAV_DIRECTION.PREV)
			{
				onGoToPrevBlock();
			}
		}

		// Closing here is the user leaving the panel, not taking the search back, so it goes through
		// `closeSearchPanel()` and not through `cancelSearch()`: the highlight and the camera stay
		// where the search left them, and rolling them back stays the answer to Escape alone.
		// The browser action goes off only once the press is taken: a press the panel refuses belongs
		// to the browser and to the layers above the canvas.
		function toggleSearchBarFromKeyboard(event: KeyboardEvent): void
		{
			if (isKeyboardBusyByOverlay() || toValue(isDisabled))
			{
				return;
			}

			event.preventDefault();

			if (toValue(isOpenedSearchBar))
			{
				closeSearchPanel({ focusTarget: keyboardFocusTarget(), keepHighlight: true });

				return;
			}

			toValue(searchInputRef)?.onOpenSearchBar();
		}

		// Every way the panel closes ends the search itself, the clear button included, and the key
		// goes back at the start of the closing rather than when its animation ends a third of a
		// second later: the next press belongs to the layers above the canvas by then. The highlight
		// is kept only where the closing leaves the diagram as the search found it.
		function closeAndResetSearch(keepHighlight: boolean = false): void
		{
			releaseSearchClaim();

			// Emptying the results wipes the highlight through the watcher on them, after this
			// synchronous block, so what is kept goes back once every watcher has had its say -
			// the way `cancelSearch()` puts its snapshot back.
			const kept = keepHighlight ? [...toValue(highlitedBlocks.highlitedBlockIds)] : null;

			if (kept === null)
			{
				highlitedBlocks.clear();
			}

			onClearSearch();
			currentBlockIndex.value = 0;

			if (kept !== null)
			{
				void nextTick(() => highlitedBlocks.replace(kept));
			}
		}

		// Both halves always go together: the panel and the input keep their own open flag, and
		// closing one without the other leaves them disagreeing about it.
		function closeSearchPanel({
			focusTarget = null,
			keepHighlight = false,
		}: { focusTarget?: SearchFocusTarget | null, keepHighlight?: boolean } = {}): void
		{
			closeAndResetSearch(keepHighlight);
			toValue(searchInputRef)?.collapseSearchBar({ focusTarget });
		}

		// A close the user asked for from the keyboard leaves the focus nowhere: the panel takes its
		// field away, and with the results the buttons that walk them go too. The canvas takes the
		// focus back - the arrows and the shortcuts of the diagram all start from its root - but only
		// while nothing else holds Escape: a claim still on the stack means a layer above the canvas
		// is open, and the canvas is not the keyboard's owner then. The focus still has to land
		// somewhere, so it goes to the button the panel opened from. A close made from outside the
		// panel moves no focus at all: the user stands where they meant to.
		function keyboardFocusTarget(): SearchFocusTarget | null
		{
			const closedFromInsidePanel = isFocusInsidePanel();

			// The key goes back before the stack is asked about the rest, or the panel would find its
			// own claim on it and leave the focus to itself.
			releaseSearchClaim();

			if (!closedFromInsidePanel)
			{
				return null;
			}

			return returnFocusToCanvas() ? SEARCH_FOCUS_TARGET.CANVAS : SEARCH_FOCUS_TARGET.OPEN_BUTTON;
		}

		// The combo of the panel pressed while the cursor stands in the field never reaches the
		// canvas, so the field asks for the close itself. It is the same keyboard close as the
		// shortcut going through the canvas.
		function onCloseRequest(): void
		{
			closeSearchPanel({ focusTarget: keyboardFocusTarget() });
		}

		// The claim comes and goes with the focus, so both halves are idempotent: the panel asks for
		// a key it may already hold and gives up one it may have given up already.
		function claimEscape(): void
		{
			if (unsubscribeEscape === null)
			{
				unsubscribeEscape = inputState.onExclusive(KEY_TOKEN.ESCAPE, cancelSearch);
			}
		}

		function releaseEscapeClaim(): void
		{
			unsubscribeEscape?.();
			unsubscribeEscape = null;
		}

		// Called from every path that ends the search itself: the key goes back and the diagram has
		// nothing left to come back to.
		function releaseSearchClaim(): void
		{
			releaseEscapeClaim();
			snapshot = null;
		}

		// The key is the panel's only while the work is in the panel. An open panel the keyboard
		// user has tabbed away from holds Escape over the whole page otherwise, and the layers above
		// the canvas - a slider around the diagram first of all - stop closing by it. A focus that
		// goes nowhere is not a departure: that is the panel hiding its own field as it closes.
		function onPanelFocusOut(event: FocusEvent): void
		{
			const nextTarget = event.relatedTarget;
			const staysInPanel = !(nextTarget instanceof Node)
				|| toValue(searchPanel)?.contains(nextTarget) === true;

			if (staysInPanel)
			{
				return;
			}

			releaseEscapeClaim();
		}

		function onPanelFocusIn(): void
		{
			if (toValue(isOpenedSearchBar))
			{
				claimEscape();
			}
		}

		function isFocusInsidePanel(): boolean
		{
			return toValue(searchPanel)?.contains(document.activeElement) === true;
		}

		// Escape gives up the search: the panel closes the way it closes on a click past it, and the
		// diagram goes back to where the search found it.
		function cancelSearch(): void
		{
			// Read before the close: it gives up the snapshot along with the key, and the deferred
			// restoration below works off this copy.
			const taken = snapshot;

			closeSearchPanel({ focusTarget: keyboardFocusTarget() });

			if (taken === null)
			{
				return;
			}

			// The watcher on the found blocks wipes the highlight after this synchronous block, so
			// the snapshot goes back only once every watcher has had its say.
			void nextTick(() => {
				highlitedBlocks.replace(taken.highlighted);
				// A block deleted while the panel was open is gone from the model, and the selection
				// was trimmed of it by the very same rule: the snapshot must not bring it back.
				pruneSelection(highlitedBlocks.highlitedBlockIds, blockIdsInModel);
				setCamera(taken.camera);
			});
		}

		function onClickOutside(event: MouseEvent): void
		{
			if (toValue(searchPanel) && !toValue(searchPanel).contains(event.target) && toValue(isOpenedSearchBar))
			{
				closeSearchPanel();
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
			closeSearchPanel,
			onGoToNextBlock,
			onGoToPrevBlock,
			onNavigateResults,
			onPanelFocusIn,
			onPanelFocusOut,
			onCloseRequest,
		};
	},
	template: `
		<div
			:class="searchBarClassNames"
			ref="searchPanel"
			@focusin="onPanelFocusIn"
			@focusout="onPanelFocusOut"
		>
			<SearchInput
				v-model:open="isOpenedSearchBar"
				:value="seachText"
				:placeholder="placeholderOrDefaultValue"
				:disabled="isDisabled"
				:hasResults="foundBlocks.length > 0"
				ref="searchInput"
				@update:value="onSearchBlocks"
				@navigate="onNavigateResults"
				@clear="closeAndResetSearch()"
				@close-request="onCloseRequest"
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
