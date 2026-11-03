import { Loc, Type } from 'main.core';
import { type BaseEvent, type EventEmitter } from 'main.core.events';

import { EventType } from 'im.v2.const';
import { SearchInput } from 'im.v2.component.elements.search-input';
import { Utils } from 'im.v2.lib.utils';

import { isOwnSearchArea } from '../helpers/is-own-search-area';
import { getSearchListboxId } from '../helpers/search-navigation-aria';

// The numeric keypad carries its own code for Enter, and the helper compares event.code.
const ENTER_KEYS = ['Enter', 'NumpadEnter'];

// @vue/component
export const ChatSearchInput = {
	name: 'ChatSearchInput',
	components: { SearchInput },
	props: {
		searchMode: {
			type: Boolean,
			required: true,
		},
		isLoading: {
			type: Boolean,
			required: false,
		},
		delayForFocusOnStart: {
			type: [Number, null],
			default: null,
		},
		autofocusOnTrapActivation: {
			type: Boolean,
			default: false,
		},
		withIcon: {
			type: Boolean,
			default: true,
		},
		placeholder: {
			type: String,
			default: Loc.getMessage('IM_SEARCH_INPUT_PLACEHOLDER_V2'),
		},
		activateOnEnter: {
			type: Boolean,
			default: false,
		},
		// Identifies the search area this input belongs to, so that of the several search outputs that can be
		// mounted at once only the one from the same area reacts to a keystroke. Set it from the parent that
		// owns both this input and its output; left empty, this input puts nothing on the bus at all and no
		// navigation subscriber can be driven by it.
		// It only buys the navigation, though: handing the focus back to the search additionally needs
		// `activateOnEnter`, so a parent that sets this prop alone gets a working walk and a dead return.
		searchAreaId: {
			type: String,
			default: null,
		},
		withGlobalEscapeHandling: {
			type: Boolean,
			default: true,
		},
		clearButtonLabel: {
			type: String,
			default: null,
		},
		inputRole: {
			type: String,
			default: null,
		},
		inputControlsId: {
			type: String,
			default: null,
		},
		inputDescribedById: {
			type: String,
			default: null,
		},
		// Addresses the shared key channel to one window instance. Left empty, the keystroke is
		// published unaddressed and only the context-free subscribers act on it.
		searchContext: {
			type: String,
			default: null,
		},
	},
	emits: ['closeSearch', 'openSearch', 'updateSearch'],
	data(): Object
	{
		return {
			activeDescendantId: null,
		};
	},
	computed: {
		listboxId(): ?string
		{
			if (!Type.isStringFilled(this.searchAreaId))
			{
				return null;
			}

			return getSearchListboxId(this.searchAreaId);
		},
		// Each attribute may be written once, and two consumers describe the field: a window passes the values
		// outright, a search area gets them from its own listbox. The explicit prop wins where both are given.
		resolvedInputRole(): ?string
		{
			return this.inputRole ?? (this.listboxId ? 'combobox' : null);
		},
		resolvedInputControlsId(): ?string
		{
			return this.inputControlsId ?? this.listboxId;
		},
	},
	watch: {
		searchMode(isOpen: boolean)
		{
			if (!isOpen)
			{
				this.activeDescendantId = null;
			}
		},
	},
	created()
	{
		this.getEmitter().subscribe(EventType.search.returnFocusToSearch, this.onReturnFocusToSearch);

		if (this.listboxId)
		{
			this.getEmitter().subscribe(
				EventType.search.activeDescendantChanged,
				this.onActiveDescendantChanged,
			);
		}
	},
	beforeUnmount()
	{
		this.getEmitter().unsubscribe(EventType.search.returnFocusToSearch, this.onReturnFocusToSearch);

		if (this.listboxId)
		{
			this.getEmitter().unsubscribe(
				EventType.search.activeDescendantChanged,
				this.onActiveDescendantChanged,
			);
		}
	},
	methods: {
		onActiveDescendantChanged(event: BaseEvent)
		{
			const { searchAreaId, activeDescendantId } = event.getData();

			if (!this.searchMode || !isOwnSearchArea(searchAreaId, this.searchAreaId))
			{
				return;
			}

			this.activeDescendantId = Type.isStringFilled(activeDescendantId) ? activeDescendantId : null;
		},
		// The results know when the focus is the search's again; the input owns the element that takes it.
		onReturnFocusToSearch(event: BaseEvent)
		{
			const { searchAreaId } = event.getData();

			if (!isOwnSearchArea(searchAreaId, this.searchAreaId))
			{
				return;
			}

			this.$refs.searchInput?.returnFocusToPill();
		},
		onInputFocus()
		{
			this.$emit('openSearch');
		},
		// Addressed like keyDown and for the same reason: the keys of the navigation travel from this very
		// field, so only the results of this area may act on the loss of its focus. An input with no area of
		// its own says nothing on either channel: they are public constants, and an unaddressed event is one
		// more thing every subscriber, ours or not, would have to fail closed on.
		onInputBlur()
		{
			if (!Type.isStringFilled(this.searchAreaId))
			{
				return;
			}

			this.getEmitter().emit(EventType.search.inputBlur, { searchAreaId: this.searchAreaId });
		},
		onClose()
		{
			this.activeDescendantId = null;
			this.$emit('closeSearch');
		},
		onInputUpdate(query: string)
		{
			this.$emit('updateSearch', query);
		},
		onKeyPressed(event: KeyboardEvent)
		{
			// Enter is the only key the shared channel has an action for, and every subscriber tests it
			// with the same helper. Arrows stay out: entering the results is a local handler of the
			// window. The component event of SearchInput is deliberately left wide.
			if (!Utils.key.isCombination(event, ENTER_KEYS))
			{
				return;
			}

			this.getEmitter().emit(EventType.search.keyPressed, {
				keyboardEvent: event,
				context: this.searchContext,
			});
		},
		onRawKeyDown(event: KeyboardEvent)
		{
			if (!Type.isStringFilled(this.searchAreaId))
			{
				return;
			}

			// Synchronous emit on purpose: the subscriber's preventDefault() only has an effect while this
			// very keydown is being dispatched, so emitAsync would silently turn interception into a no-op.
			this.getEmitter().emit(EventType.search.keyDown, {
				keyboardEvent: event,
				searchAreaId: this.searchAreaId,
			});
		},
		getEmitter(): EventEmitter
		{
			return this.$Bitrix.eventEmitter;
		},
	},
	template: `
		<SearchInput
			ref="searchInput"
			:placeholder="placeholder"
			:searchMode="searchMode"
			:isLoading="isLoading"
			:withLoader="true"
			:delayForFocusOnStart="delayForFocusOnStart"
			:autofocusOnTrapActivation="autofocusOnTrapActivation"
			:withIcon="withIcon"
			:activateOnEnter="activateOnEnter"
			:withResultsNavigation="Boolean(listboxId)"
			:ariaActiveDescendantId="activeDescendantId"
			:withGlobalEscapeHandling="withGlobalEscapeHandling"
			:clearButtonLabel="clearButtonLabel"
			:inputRole="resolvedInputRole"
			:inputControlsId="resolvedInputControlsId"
			:inputDescribedById="inputDescribedById"
			@inputFocus="onInputFocus"
			@inputBlur="onInputBlur"
			@queryChange="onInputUpdate"
			@keyPressed="onKeyPressed"
			@rawKeyDown="onRawKeyDown"
			@close="onClose"
			@closeByEsc="onClose"
		/>
	`,
};
