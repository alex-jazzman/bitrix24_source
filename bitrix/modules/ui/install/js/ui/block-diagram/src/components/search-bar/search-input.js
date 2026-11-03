import { Browser, Text } from 'main.core';
import { BIcon, Outline } from 'ui.icon-set.api.vue';
import {
	useTemplateRef,
	toValue,
	computed,
	ref,
	nextTick,
} from 'ui.vue3';
import { useBlockDiagram, useCanvasFocus, useLoc } from '../../composables';
import { CANVAS_ACTION_ID, normalizeCombo } from '../../utils';
import { OpenSearchBtn } from './open-search-btn';
import './search-input.css';

type SearchInputSetup = {
	iconSet: {...};
	placeholderOrDefaultValue: string;
	showSearchBtn: boolean;
	showSearchBar: boolean;
	searchPanelId: string;
	searchInputClassNames: { [string]: boolean };
	onInput: (event: InputEvent) => void;
	onKeyDownSearchInput: (event: KeyboardEvent) => void;
	onClear: () => void;
};

// Directions the results are walked in, so the spelling lives in one place on both sides.
export const SEARCH_NAV_DIRECTION = Object.freeze({
	NEXT: 'next',
	PREV: 'prev',
});

export type SearchNavDirection = 'next' | 'prev';

// Where the focus goes once the panel has finished closing, so the spelling lives in one place on
// both sides. Which target it is, the caller says: only the caller knows what kind of close it was.
export const SEARCH_FOCUS_TARGET = Object.freeze({
	OPEN_BUTTON: 'openButton',
	CANVAS: 'canvas',
});

export type SearchFocusTarget = 'openButton' | 'canvas';

const NAV_ACTION_DIRECTION = new Map([
	[CANVAS_ACTION_ID.NEXT_SEARCH_RESULT, SEARCH_NAV_DIRECTION.NEXT],
	[CANVAS_ACTION_ID.PREV_SEARCH_RESULT, SEARCH_NAV_DIRECTION.PREV],
]);

const SEARCH_INPUT_CLASS_NAMES = {
	base: 'ui-block-diagram-search-input',
	open: '--open',
	focus: '--focus',
};

function isFocusInside(element: HTMLElement | null): boolean
{
	return element instanceof HTMLElement && element.contains(document.activeElement);
}

// The canvas skips its global action channel for a press inside an editable field (InputState:
// `isInputEventTarget`), so a shortcut meant to fire while this very field holds focus can never go
// through it - it is read here instead, straight off the registry the field belongs to, the same
// source `useKeyboardShortcuts` reads for every shortcut that is not field-scoped. Reading the
// registry rather than a fixed key keeps the combo reassignable through the settings panel like any
// other action of the canvas.
function comboFromEvent(event: KeyboardEvent, isMac: boolean): string
{
	const modifiers = [
		event.ctrlKey && 'ctrl',
		event.altKey && 'alt',
		event.shiftKey && 'shift',
		event.metaKey && 'meta',
	].filter(Boolean);

	return normalizeCombo([...modifiers, event.code || event.key], isMac);
}

// The lower bound of what the field may be taken away for: a press none of these modifiers is held
// on is plain typing, whatever the registry says about it. Shift is not one of them - it types a
// character of its own, an uppercase letter or the symbol above the digit. The settings panel draws
// the bound at the same three modifiers, so what may be assigned is what works here.
function isCombinationPress(event: KeyboardEvent): boolean
{
	return event.ctrlKey || event.metaKey || event.altKey;
}

function searchNavDirection(event: KeyboardEvent, actionRegistry, isMac: boolean): SearchNavDirection | null
{
	if (!isCombinationPress(event))
	{
		return null;
	}

	const actionId = actionRegistry.getAction(comboFromEvent(event, isMac));

	return NAV_ACTION_DIRECTION.get(actionId) ?? null;
}

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
		hasResults: {
			type: Boolean,
			default: false,
		},
	},
	emits: ['update:value', 'clear', 'update:open', 'navigate', 'close-request'],
	setup(props, { emit }): SearchInputSetup
	{
		const loc = useLoc();
		const { actionRegistry } = useBlockDiagram();
		const { focusCanvas } = useCanvasFocus();
		const isMac = Browser.isMac();
		const searchInput = useTemplateRef('searchInput');
		const searchBar = useTemplateRef('searchBar');
		const openSearchBtn = useTemplateRef('openSearchBtn');
		const showSearchBtn = ref(true);
		const showSearchBar = ref(false);
		const isFocus = ref(false);
		const searchPanelId = `ui-block-diagram-search-panel-${Text.getRandom()}`;

		// The field is hidden the moment the panel starts closing, and the button it opened from is
		// rendered again only once the closing animation has played out. Between the two the focus
		// belongs to nobody, so the answer is decided while the field still holds it.
		let pendingFocusTarget: SearchFocusTarget | null = null;

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

		// With nothing found the press stays the field's: taking it away would cost the user the
		// native picking out of text and give nothing back.
		function onKeyDownSearchInput(event: KeyboardEvent): void
		{
			if (props.disabled || !props.hasResults)
			{
				return;
			}

			const direction = searchNavDirection(event, actionRegistry, isMac);

			if (direction === null)
			{
				return;
			}

			event.preventDefault();
			emit('navigate', direction);
		}

		function onClear(event: MouseEvent): void
		{
			event.stopPropagation();

			if (props.disabled)
			{
				return;
			}

			pendingFocusTarget = isFocusInside(toValue(searchBar)) ? SEARCH_FOCUS_TARGET.OPEN_BUTTON : null;
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

			const target = pendingFocusTarget;
			pendingFocusTarget = null;

			if (target === null)
			{
				return;
			}

			nextTick(() => {
				if (target === SEARCH_FOCUS_TARGET.CANVAS)
				{
					focusCanvas();

					return;
				}

				toValue(openSearchBtn)?.focus();
			});
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

		// The canvas input state hands a focused field nothing but Escape, so the combo that opened
		// the panel would reach neither the canvas nor a preventDefault, and the browser would answer
		// it with its own find bar. What closing means is left to the parent, the same way `clear` is.
		// The combo is the one the registry holds for the action, the way the navigation beside it is
		// read: the press that opens the panel is the press that closes it, reassignment or not.
		function onSearchInputKeyDown(event: KeyboardEvent): void
		{
			if (props.disabled || !isCombinationPress(event))
			{
				return;
			}

			if (actionRegistry.getAction(comboFromEvent(event, isMac)) !== CANVAS_ACTION_ID.TOGGLE_SEARCH)
			{
				return;
			}

			event.preventDefault();
			emit('close-request');
		}

		function onBlurSearchInput(): void
		{
			isFocus.value = false;
		}

		// A close the user asked for from inside the panel names where the focus goes next; a click
		// past the panel names nothing and leaves the focus where the click put it. The target is
		// the caller's to answer: the panel reaches past this field - the buttons that walk the
		// results are its own - and only the panel knows its whole extent.
		function collapseSearchBar(
			{ focusTarget = null }: { focusTarget?: SearchFocusTarget | null } = {},
		): void
		{
			pendingFocusTarget = focusTarget;
			showSearchBar.value = false;
		}

		return {
			iconSet: Outline,
			showSearchBar,
			showSearchBtn,
			searchPanelId,
			placeholderOrDefaultValue,
			searchInputClassNames,
			onInput,
			onKeyDownSearchInput,
			onClear,
			onAfterEnterTransition,
			onLeaveTransition,
			onOpenSearchBar,
			onClickSearchInput,
			onBlurSearchInput,
			onSearchInputKeyDown,
			collapseSearchBar,
		};
	},
	template: `
		<OpenSearchBtn
			v-show="showSearchBtn"
			:aria-expanded="open"
			:aria-controls="searchPanelId"
			:data-test-id="$blockDiagramTestId('searchOpenBtn')"
			ref="openSearchBtn"
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
				:id="searchPanelId"
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
					@keydown="[onKeyDownSearchInput, onSearchInputKeyDown]"
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
