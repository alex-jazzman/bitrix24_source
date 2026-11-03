import { Dom, Event, Loc, Text, Type } from 'main.core';
import { BaseEvent, EventEmitter } from 'main.core.events';
import { FocusKeys, FocusNavigator, FocusZone, InteractivityChecker, LiveAnnouncer } from 'ui.a11y';
import 'ui.forms';
import 'ui.switcher';
import { CheckboxListCategory } from './category';
import type { CheckboxListOption } from './checkbox-list';
import { CheckboxListParams } from './checkbox-list';
import { CheckboxComponent } from './controls/checkbox-component';
import { TextToggleComponent } from './controls/texttoggle-component';
import { CheckboxListSections } from './sections';

// Counted from the last keystroke: long enough to let a word be typed, short enough to stay a reply
// to that word.
const searchAnnounceDelay = 700;

export const Content = {
	components: {
		CheckboxListSections,
		CheckboxListCategory,
		CheckboxComponent,
		TextToggleComponent,
	},

	props: [
		'dialog',
		'popup',
		'columnCount',
		'compactField',
		'customFooterElements',
		'lang',
		'sections',
		'categories',
		'options',
		'params',
		'context',
	],

	setup(): Object
	{
		// Generated once per component and kept out of the reactive state: the values never change
		// while the component lives, and two dialogs on one page must not share them.
		return {
			switcherLabelId: `ui-checkbox-list-compact-${Text.getRandom().toLowerCase()}`,
			optionsContainerId: `ui-checkbox-list-options-${Text.getRandom().toLowerCase()}`,
			selectAllId: `ui-checkbox-list-select-all-${Text.getRandom().toLowerCase()}`,
		};
	},

	data()
	{
		return {
			dataSections: this.sections,
			dataCategories: this.categories,
			dataCompactField: this.compactField,
			dataOptions: this.getPreparedDataOptions(),
			dataParams: this.getPreparedParams(),

			optionsRef: new Map(),
			search: '',
			longContent: false,
			scrollIsBottom: true,
			scrollIsTop: false,
		};
	},

	methods: {
		getPreparedDataOptions(): Map<string, CheckboxListOption>
		{
			return new Map(this.options.map((option) => [option.id, option]));
		},
		getPreparedParams(): CheckboxListParams
		{
			const { params } = this;

			return {
				useSearch: Boolean(params.useSearch ?? true),
				useSectioning: Boolean(params.useSectioning ?? true),
				closeAfterApply: Boolean(params.closeAfterApply ?? true),
				showBackToDefaultSettings: Boolean(params.showBackToDefaultSettings ?? true),
				isEditableOptionsTitle: Boolean(params.isEditableOptionsTitle ?? false),
				destroyPopupAfterClose: Boolean(params.destroyPopupAfterClose ?? true),
			};
		},
		renderSwitcher()
		{
			if (this.dataCompactField)
			{
				new BX.UI.Switcher({
					node: this.$refs.switcher,
					checked: this.dataCompactField.value,
					size: 'small',
					// The switch owns its own role, tab stop, keyboard and aria-checked; the name
					// comes from the visible caption, so it cannot drift away from it.
					accessible: true,
					ariaLabelledBy: this.switcherLabelId,
					handlers: {
						toggled: () => this.handleSwitcherToggled(),
					},
				});
			}
		},
		handleSwitcherToggled()
		{
			if (this.dataCompactField)
			{
				this.dataCompactField.value = !this.dataCompactField.value;
			}
		},
		clearSearch()
		{
			this.search = '';
		},
		handleClearSearchButtonClick()
		{
			this.setFocusToSearchInput();
			this.clearSearch();
		},
		setFocusToSearchInput()
		{
			this.$refs?.searchInput?.focus();
		},
		// The list is a single Tab stop: the arrows and Home/End walk the fields inside it, so the
		// number of Tab stops in the dialog no longer grows with the number of fields.
		//
		// The container lives under a v-if, so an empty search or a section switched off removes it
		// from the DOM and brings back a new node. A zone is bound to the node it was built on for
		// good, hence the rebind: the zone left on the removed node would keep its own set and its
		// keys, and every field of the new node would become a Tab stop of its own again.
		//
		// Scrolling is left to the browser: the zone moves the focus with focus() and has no
		// scrolling of its own, while preventDefault on the arrows and End takes the native one
		// away. With the scroll suppressed the focus lands on a field outside the visible part of
		// the list, and the keyboard user cannot see which field Space is about to toggle.
		createFocusZone(): void
		{
			const container = this.$refs.container;
			if (!container)
			{
				this.destroyFocusZone();

				return;
			}

			if (this.focusZoneContainer === container)
			{
				return;
			}

			this.destroyFocusZone();

			this.focusZone = new FocusZone(container, {
				bindKeys: FocusKeys.ArrowAll | FocusKeys.HomeAndEnd,
				focusableElementFilter: (element: HTMLElement): boolean => this.isZoneElement(element),
				getNextFocusable: (direction, from, event) => this.getNextZoneElement(from, event),
			});
			this.focusZone.activate();
			this.focusZoneContainer = container;
			this.focusZoneNeedsFirstRefresh = true;
		},
		// deactivate() is what releases the node: it disconnects the observer of the zone, detaches
		// its listeners and restores the tabindex it had taken over.
		destroyFocusZone(): void
		{
			this.focusZone?.deactivate();
			this.focusZone = null;
			this.focusZoneContainer = null;
		},
		// The single source of truth for the set of the zone: the field of every row plus its rename
		// button. The button is a member so the pencil can be reached by the keyboard at all - it is
		// why the button is hidden by its background image rather than by opacity or visibility,
		// both of which drop it out of the set collected by checkVisibility().
		isZoneElement(element: HTMLElement): boolean
		{
			return this.isZoneField(element) || this.isZonePencil(element);
		},
		isZoneField(element: HTMLElement): boolean
		{
			return Dom.hasClass(element, 'ui-checkbox-list__field-item_input');
		},
		isZonePencil(element: HTMLElement): boolean
		{
			return Dom.hasClass(element, 'ui-checkbox-list__field-item_edit');
		},
		// The two members of a row sit on two axes instead of one linear walk: up and down step
		// between the fields, right and left step onto the pencil of the current row and back. A
		// single linear order would put the pencil between two neighbouring fields, so walking a
		// list of a hundred fields would take up to two hundred presses, and the count would depend
		// on how many of the fields happen to be renameable.
		//
		// Both axes are answered here rather than left to the default navigation of the zone: to the
		// zone the pencil is just another member of its set, so a step down from a field would land
		// on the pencil of that same row and Home and End would reach the pencil of the last one.
		//
		// A step that has nowhere to go on its own axis returns the element the focus is already on,
		// because null is not a way to say "stay": the zone reads it as "no answer" and falls back
		// to the very linear walk this callback exists to replace. Without it ArrowDown on the last
		// field would reach the pencil of its row, and ArrowLeft on a field the pencil of the row
		// above - and Space there renames instead of toggling.
		getNextZoneElement(from: Element | null, event: KeyboardEvent): HTMLElement | null
		{
			const fields = this.zoneFields();
			if (fields.length === 0 || !this.isZoneElement(from))
			{
				return null;
			}

			// Home and End belong to the list, not to the row, so where the jump started does not
			// matter beyond being inside the zone at all.
			if (event.key === 'Home')
			{
				return fields[0];
			}

			if (event.key === 'End')
			{
				return fields.at(-1) ?? null;
			}

			const row = from.closest('.ui-checkbox-list__field-item_label');

			return row ? this.stepInsideRow(row, from, event, fields) : null;
		},
		zoneFields(): HTMLElement[]
		{
			return [...this.$refs.container?.querySelectorAll('.ui-checkbox-list__field-item_input') ?? []];
		},
		stepInsideRow(
			row: Element,
			from: Element,
			event: KeyboardEvent,
			fields: HTMLElement[],
		): HTMLElement | null
		{
			const field = row.querySelector('.ui-checkbox-list__field-item_input');
			const pencil = row.querySelector('.ui-checkbox-list__field-item_edit');

			if (event.key === 'ArrowRight')
			{
				return (this.isZoneField(from) ? pencil : null) ?? from;
			}

			if (event.key === 'ArrowLeft')
			{
				return this.isZonePencil(from) ? field : from;
			}

			// A vertical step always continues from the field of the row, whichever member of it the
			// focus sits on, and always lands on a field.
			if (event.key === 'ArrowDown' || event.key === 'ArrowUp')
			{
				return fields[fields.indexOf(field) + (event.key === 'ArrowDown' ? 1 : -1)] ?? from;
			}

			return null;
		},
		// Both callers - the filtering and the toggling of a section - can leave the list empty and
		// bring it back, so the node has to be rechecked before its set is refreshed.
		refreshFocusZone(): void
		{
			void this.$nextTick(() => {
				this.createFocusZone();
				this.focusZone?.refreshElements();
			});
		},
		// The zone collects only elements it can see, and at mount the popup is not on screen yet,
		// so the set it takes on activate() is empty. The focus entering the dialog is the first
		// moment the fields are visible, hence the refresh from here rather than from a popup hook.
		// Only the first entry does it: the refresh walks the whole list and asks the browser for the
		// visibility of every field, while focusin also fires on every arrow step between the rows.
		// Afterwards the set is kept current by the zone's own MutationObserver.
		handleListFocusIn(): void
		{
			if (this.focusZoneNeedsFirstRefresh)
			{
				this.focusZoneNeedsFirstRefresh = false;
				this.focusZone?.refreshElements();
			}
		},

		cancelSearchAnnounce(): void
		{
			if (this.searchAnnounceTimeout !== null)
			{
				clearTimeout(this.searchAnnounceTimeout);
				this.searchAnnounceTimeout = null;
			}
		},
		// Announced once the typing stops, never per keystroke: a reply per character floods the live
		// region and is not read out at all.
		scheduleSearchAnnounce(): void
		{
			this.cancelSearchAnnounce();

			this.searchAnnounceTimeout = setTimeout(() => {
				this.searchAnnounceTimeout = null;
				this.announceSearchResult();
			}, searchAnnounceDelay);
		},
		// A blank phrase must not reach the live region: an empty reply is noise, and a phrase can be
		// missing on a stand whose translation repository points elsewhere.
		announce(message: ?string): void
		{
			if (Type.isStringFilled(message))
			{
				LiveAnnouncer.announce(message, 'polite');
			}
		},
		announceSearchResult(): void
		{
			// An empty search is a return to the whole list, not a result of a search.
			if (!Type.isStringFilled(this.search))
			{
				return;
			}

			// Counted over the same set that decides the empty state (isEmptyContent), so what is
			// heard matches what is on screen: a locked field is still a field the search found,
			// and its own unavailability is announced by the field itself.
			const count = this.visibleOptions.length;

			if (count === 0)
			{
				this.announce(Loc.getMessage('UI_CHECKBOX_LIST_SEARCH_EMPTY_ANNOUNCE'));

				return;
			}

			this.announce(Loc.getMessage('UI_CHECKBOX_LIST_SEARCH_RESULT_ANNOUNCE', { '#COUNT#': count }));
		},
		handleSectionsToggled(key)
		{
			const section = this.dataSections.find((item) => item.key === key);

			if (!section)
			{
				return;
			}

			// The move happens while the field is still in the DOM: waiting for the rerender to
			// remove it would drop the focus to the body.
			this.moveFocusOutOfList(this.getSectionToggle(key));

			section.value = !section.value;
		},
		getSectionToggle(key: string): ?HTMLElement
		{
			const toggles = this.$el?.querySelectorAll('.ui-checkbox-list__sections-item') ?? [];
			const index = this.dataSections.findIndex((item) => item.key === key);

			return toggles[index] ?? null;
		},
		// Nothing to do unless the focus is really inside the list: the search field keeps it while
		// typing, and a click on a section toggle already holds it itself.
		moveFocusOutOfList(target: ?HTMLElement = null): void
		{
			const container = this.$refs.container;
			const activeElement = FocusNavigator.getActiveElement();
			if (!container || !activeElement || !container.contains(activeElement))
			{
				return;
			}

			const focusTarget = target ?? container;

			if (InteractivityChecker.isFocusable(focusTarget))
			{
				FocusNavigator.focusTarget(focusTarget, { preventScroll: true });
			}
			else
			{
				// the list container is the last resort: it has tabindex="-1" to accept the focus
				FocusNavigator.focusContainer(focusTarget, { preventScroll: true });
			}
		},
		getOptionsByCategory(category = null)
		{
			return this.getOptions().filter((item) => item.categoryKey === category);
		},
		getOptions(): CheckboxListOption[]
		{
			return this.optionsByTitle;
		},
		getCheckedOptionsId(): string[]
		{
			return this.getCheckedOptions().map((option) => option.getId());
		},
		getCheckedOptions(): CheckboxListOption[]
		{
			return this.getOptionRefs().filter((option) => option.getValue());
		},
		checkLongContent()
		{
			if (this.$refs.container)
			{
				this.longContent = this.$refs.container.clientHeight < this.$refs.container.scrollHeight;
			}
			else
			{
				this.longContent = false;
			}
		},
		getBottomIndent()
		{
			const { scrollTop, clientHeight, scrollHeight } = this.$refs.container;

			this.scrollIsBottom = (scrollTop + clientHeight) < scrollHeight - 10;
		},
		getTopIndent()
		{
			this.scrollIsTop = this.$refs.container.scrollTop;
		},
		handleScroll()
		{
			this.getBottomIndent();
			this.getTopIndent();
		},
		defaultSettings()
		{
			const event = new BaseEvent({
				data: {
					switcher: this.dataCompactField,
					fields: this.getCheckedOptionsId(),
				},
			});

			EventEmitter.emit(this.dialog, 'onDefault', event);

			if (event.isDefaultPrevented())
			{
				return;
			}

			this.clearSearch();

			const { dataCompactField, sections, categories, $refs } = this;

			if (dataCompactField && dataCompactField.value !== dataCompactField.defaultValue)
			{
				$refs.switcher.click();
			}

			this.dataSections = sections;
			this.dataOptions = this.getPreparedDataOptions();
			this.dataCategories = categories;

			this.setDefaultValuesForOptions();
		},
		setDefaultValuesForOptions(): void
		{
			void this.$nextTick(() => {
				this.getOptionRefs().forEach(
					(option) => option.setValue(this.dataOptions.get(option.getId()).defaultValue),
				);
			});
		},
		toggleOption(id: string): void
		{
			const option = this.optionsRef.get(id);
			if (!option)
			{
				return;
			}

			option.setValue(!option.getValue());
		},
		onSelectAllClick(): void
		{
			// pointer-events: none keeps a mouse click off the native input (see style.css), so the
			// browser never focuses the checkbox by itself; focus it here, otherwise focus stays where
			// it was (the search field on open) and a Space right after the click types there instead
			// of toggling. Keyboard activation already has the focus, so this is a no-op for it.
			this.$refs.selectAllCheckbox?.focus();

			if (this.isAllSelected)
			{
				this.deselectAll();
				this.announce(Loc.getMessage('UI_CHECKBOX_LIST_DESELECT_ALL_ANNOUNCE'));
			}
			else
			{
				this.selectAll();
				this.announce(Loc.getMessage(
					'UI_CHECKBOX_LIST_SELECT_ALL_ANNOUNCE',
					{ '#COUNT#': this.getSelectableVisibleOptionRefs().length },
				));
			}

			// A click/Space on the <input> itself triggers the native checkbox activation; because of
			// @click.prevent the browser rolls checked/indeterminate back to the pre-click state after Vue
			// has updated. Re-sync the DOM on the next macrotask, i.e. after that rollback.
			setTimeout(() => this.syncSelectAllCheckbox(), 0);
		},
		select(id: string, value: boolean = true): void
		{
			const option = this.getOptionRefs().find((item) => item.id === id);
			option?.setValue(value);
		},
		selectAll()
		{
			this.setValueForAllVisibleOptions(true);
		},
		deselectAll()
		{
			this.setValueForAllVisibleOptions(false);
		},
		setValueForAllVisibleOptions(value: boolean): void
		{
			this.getSelectableVisibleOptionRefs().forEach((option) => {
				this.dataOptions.get(option.getId()).value = value;
				option.setValue(value);
			});
		},
		getOptionRefs(): []
		{
			return [...this.optionsRef.values()];
		},
		getSelectableVisibleOptionRefs(): Object[]
		{
			// Sectioning hides the options of a disabled section, but their refs stay in optionsRef
			// (CheckboxListCategory.setRef ignores the null ref an unmount passes), so the set has to
			// follow what the template actually renders: visibleOptions with sectioning on, the plain
			// search-filtered getOptions() without it.
			const shownOptions = this.dataParams.useSectioning ? this.visibleOptions : this.getOptions();
			const shownOptionIds: Set<string> = new Set(shownOptions.map((option) => option.id));

			return this.getOptionRefs().filter(
				(option) => !option.isLocked && shownOptionIds.has(option.getId()),
			);
		},
		// Invariant: the checkbox's checked/indeterminate state is synced to the DOM imperatively here
		// (from mounted()/updated(), plus a deferred setTimeout in onSelectAllClick), not by a reactive
		// template binding alone. `indeterminate` has no plain attribute binding, and a trusted click on
		// the @click.prevent input makes the browser roll checked/indeterminate back to its pre-click
		// value after Vue has rendered. Reasserting the DOM property here (and once more on the next
		// macrotask) keeps it aligned with the derived tri-state. Do not "simplify" to a binding only —
		// that reintroduces the checked/indeterminate rollback bug on a trusted click.
		syncSelectAllCheckbox(): void
		{
			const input = this.$refs.selectAllCheckbox;
			if (input)
			{
				input.checked = this.isAllSelected;
				input.indeterminate = this.isSelectAllIndeterminate;
			}
		},
		cancel(): void
		{
			EventEmitter.emit(this.dialog, 'onCancel');

			this.restoreOptionValues();
			this.destroyOrClosePopup();
		},
		restoreOptionValues(): void
		{
			this.getOptionRefs().forEach((option) => option.setStateFromProps());
		},
		apply(): void
		{
			// The button carries aria-disabled rather than the native one, so that the count of the
			// Tab stops does not depend on the selection - which makes this guard the only thing
			// stopping an apply with nothing selected. It has to stay.
			if (this.isCheckedCheckboxes)
			{
				return;
			}

			const fields = this.getCheckedOptionsId();

			const eventParams = {
				switcher: this.dataCompactField,
				fields,
				data: {
					titles: this.getOptionTitles(),
				},
			};
			EventEmitter.emit(this.dialog, 'onApply', eventParams);

			this.adjustOptions(fields);

			if (this.dataParams.closeAfterApply)
			{
				this.destroyOrClosePopup();

				return;
			}

			// Announced only while the dialog stays open: on close the reply competes with the focus
			// returning to the initiator and gets cut off.
			this.announce(Loc.getMessage('UI_CHECKBOX_LIST_APPLIED_ANNOUNCE'));
		},
		getOptionTitles(): {[key: string]: string}[]
		{
			const titles = {};

			this.getOptionRefs().forEach((option) => {
				titles[option.getId()] = option.getTitle();
			});

			return titles;
		},
		adjustOptions(checkedFieldIds: string[] = []): void
		{
			for (const option of this.optionsRef.values())
			{
				const id = option.getId();
				const value = checkedFieldIds.includes(id);

				this.dataOptions.set(id, {
					...this.dataOptions.get(id),
					title: option.getTitle(),
					value,
				});

				void this.$nextTick(() => option.setStateFromProps(value));
			}
		},
		destroyOrClosePopup(): void
		{
			if (this.dataParams.destroyPopupAfterClose)
			{
				this.destroyPopup();
			}
			else
			{
				this.closePopup();
			}
		},
		destroyPopup()
		{
			this.popup.destroy();
		},
		closePopup()
		{
			this.popup.close();
		},
		setOptionRef(id: string, ref): void
		{
			this.optionsRef.set(id, ref);
		},
		isAllSectionsDisabled(): boolean
		{
			return (
				Type.isArrayFilled(this.dataSections)
				&& this.dataSections.every((section) => section.value === false)
			);
		},
		// Escape inside the rename mode has to undo the rename, not close the dialog. The popup
		// listens for keyup on the document in the capture phase, so it always wins over any
		// handler on the field: stopping the propagation there is impossible. Taking `closeByEsc`
		// away for the duration of the edit is the only way to leave Escape to the field.
		handleOptionEditModeChange(isEditing: boolean, byKey: boolean = false): void
		{
			this.cancelEscRestore();

			if (isEditing)
			{
				this.popup?.setClosingByEsc?.(false);

				return;
			}

			// Only a key that ended the edit leaves an Escape still travelling towards the popup,
			// whose own keyup is what the popup closes on - and the delay between keydown and keyup
			// is a human one, so any timer loses that race. A mouse leaves nothing in flight, and
			// waiting for a keyup there would spend the first Escape the user presses afterwards on
			// the restore instead of on closing the dialog.
			if (!byKey)
			{
				this.popup?.setClosingByEsc?.(true);

				return;
			}

			this.escRestoreHandler = () => {
				this.cancelEscRestore();
				this.popup?.setClosingByEsc?.(true);
			};
			Event.bind(document, 'keyup', this.escRestoreHandler, true);
		},
		cancelEscRestore(): void
		{
			if (this.escRestoreHandler)
			{
				Event.unbind(document, 'keyup', this.escRestoreHandler, true);
				this.escRestoreHandler = null;
			}
		},
		onToggleOption(event)
		{
			if (this.dataOptions.has(event.id))
			{
				const option = this.dataOptions.get(event.id);
				option.value = event.isChecked;
				this.dataOptions.set(event.id, option);
			}
		},
	},

	watch: {
		search()
		{
			// The focus stays in the search field while typing, so only the set of the zone follows
			// the filtering here.
			this.refreshFocusZone();
			this.scheduleSearchAnnounce();

			void this.$nextTick(() => this.checkLongContent());
		},
		categoryBySection()
		{
			this.refreshFocusZone();

			void this.$nextTick(() => this.checkLongContent());
		},
	},

	computed: {
		visibleOptions()
		{
			const { dataSections, optionsByTitle, dataCategories } = this;

			if (!Type.isArrayFilled(dataSections))
			{
				return optionsByTitle;
			}

			return optionsByTitle.filter((option) => {
				const category = dataCategories.find((item) => item.key === option.categoryKey);
				const section = dataSections.find((item) => item.key === category.sectionKey);

				return section?.value;
			});
		},
		isEmptyContent()
		{
			return Type.isArrayFilled(this.visibleOptions);
		},
		// @temporary temp, waiting for a new ui for this case
		isNarrowWidth(): boolean
		{
			return (window.innerWidth * 0.9 < 500);
		},
		isSearchDisabled(): boolean
		{
			if (Type.isArrayFilled(this.dataSections))
			{
				return !this.dataSections.some((section) => section.value);
			}

			return false;
		},
		isCheckedCheckboxes(): boolean
		{
			for (const option of this.optionsRef.values())
			{
				if (option.getValue() === true && option.locked !== true)
				{
					return false;
				}
			}

			return true;
		},
		optionsByTitle(): CheckboxListOption[]
		{
			const options: CheckboxListOption[] = [...this.dataOptions.values()];
			const searchString = this.search.toLowerCase();

			return options.filter((item) => (item.title ?? item.id).toLowerCase().includes(searchString));
		},
		categoryBySection()
		{
			if (!Type.isArrayFilled(this.dataSections))
			{
				return this.dataCategories;
			}

			return this.dataCategories.filter((category) => {
				const section = this.dataSections.find((item) => category.sectionKey === item.key);

				return section?.value;
			});
		},
		wrapperClassName()
		{
			return [
				'ui-checkbox-list__wrapper',
				{ '--long': this.longContent },
				{ '--bottom': this.scrollIsBottom },
				{ '--top': this.scrollIsTop },
			];
		},
		searchClassName()
		{
			return [
				'ui-checkbox-list__search',
				{ '--disabled': this.isSearchDisabled },
			];
		},
		applyClassName()
		{
			return [
				'ui-btn ui-btn-primary',
				{ 'ui-btn-disabled': this.isCheckedCheckboxes },
			];
		},
		selectAllClassName()
		{
			// Reading isSelectAllIndeterminate here makes it a dependency of the render: without a plain
			// :indeterminate binding, this class binding is what wakes the rerender (and updated() ->
			// syncSelectAllCheckbox()) on any tri-state transition, not only the ones that also flip
			// isAllSelected or isCheckedCheckboxes.
			return [
				'ui-checkbox-list__footer-link --select-all',
				{ '--narrow': this.isNarrowWidth },
				{ '--indeterminate': this.isSelectAllIndeterminate },
			];
		},
		switcherText(): string
		{
			return (
				Type.isStringFilled(this.lang.switcher)
					? this.lang.switcher
					: Loc.getMessage('UI_CHECKBOX_LIST_DEFAULT_SETTINGS_SWITCHER')
			);
		},
		placeholderText(): string
		{
			return (
				Type.isStringFilled(this.lang.placeholder)
					? this.lang.placeholder
					: Loc.getMessage('UI_CHECKBOX_LIST_DEFAULT_SETTINGS_PLACEHOLDER')
			);
		},
		defaultSettingsBtnText(): string
		{
			return (
				Type.isStringFilled(this.lang.defaultBtn)
					? this.lang.defaultBtn
					: Loc.getMessage('UI_CHECKBOX_LIST_DEFAULT_SETTINGS_MSGVER_1')
			);
		},
		applyBtnText(): string
		{
			return (
				Type.isStringFilled(this.lang.acceptBtn)
					? this.lang.acceptBtn
					: Loc.getMessage('UI_CHECKBOX_LIST_DEFAULT_ACCEPT_BUTTON')
			);
		},
		cancelBtnText(): string
		{
			return (
				Type.isStringFilled(this.lang.cancelBtn)
					? this.lang.cancelBtn
					: Loc.getMessage('UI_CHECKBOX_LIST_DEFAULT_CANCEL_BUTTON')
			);
		},
		// An empty phrase must never reach aria-label: `aria-label=""` strips the name instead of
		// leaving the fallback in place, and a phrase can be missing on a stand whose translation
		// repository points elsewhere.
		searchClearLabel(): ?string
		{
			return Loc.getMessage('UI_CHECKBOX_LIST_SEARCH_CLEAR_LABEL') || null;
		},
		optionsLabel(): ?string
		{
			return Loc.getMessage('UI_CHECKBOX_LIST_OPTIONS_LABEL') || null;
		},
		selectAllBtnText(): string
		{
			return (
				Type.isStringFilled(this.lang.selectAllBtn)
					? this.lang.selectAllBtn
					: Loc.getMessage('UI_CHECKBOX_LIST_DEFAULT_SELECT_ALL_MSGVER_1')
			);
		},
		emptyStateTitleText(): string
		{
			if (this.isAllSectionsDisabled())
			{
				return (
					Type.isStringFilled(this.lang.allSectionsDisabledTitle)
						? this.lang.allSectionsDisabledTitle
						: Loc.getMessage('UI_CHECKBOX_LIST_DEFAULT_SETTINGS_EMPTY_STATE_TITLE_MSGVER_1')
				);
			}

			return (
				Type.isStringFilled(this.lang.emptyStateTitle)
					? this.lang.emptyStateTitle
					: Loc.getMessage('UI_CHECKBOX_LIST_DEFAULT_SETTINGS_EMPTY_STATE_TITLE_MSGVER_1')
			);
		},
		emptyStateDescriptionText(): string
		{
			if (this.isAllSectionsDisabled())
			{
				return '';
			}

			return (
				Type.isStringFilled(this.lang.emptyStateDescription)
					? this.lang.emptyStateDescription
					: Loc.getMessage('UI_CHECKBOX_LIST_DEFAULT_SETTINGS_EMPTY_STATE_DESCRIPTION_MSGVER_1')
			);
		},
		// Single source of truth for the select-all tri-state: one pass over the selectable visible
		// options yields both counts, and isAllSelected/isSelectAllIndeterminate are derived from it.
		// The footer checkbox stays in sync because the render reads both derived values reactively:
		// isAllSelected via :checked and isSelectAllIndeterminate via selectAllClassName. A change in
		// either reruns render() and thus updated()/syncSelectAllCheckbox(); this does not rely on any
		// side effect of dataOptions.set() (a repeat set of an already-toggled option does not retrigger).
		selectAllState(): { selectedCount: number, selectableCount: number }
		{
			const options = this.getSelectableVisibleOptionRefs();
			let selectedCount = 0;

			for (const option of options)
			{
				if (option.getValue() === true)
				{
					selectedCount += 1;
				}
			}

			return { selectedCount, selectableCount: options.length };
		},
		isAllSelected(): boolean
		{
			const { selectedCount, selectableCount } = this.selectAllState;

			return selectableCount > 0 && selectedCount === selectableCount;
		},
		isSelectAllIndeterminate(): boolean
		{
			const { selectedCount, selectableCount } = this.selectAllState;

			return selectedCount > 0 && selectedCount < selectableCount;
		},
	},

	created(): void
	{
		// non-reactive on purpose: a FocusZone instance behind a Vue proxy breaks its private fields
		this.focusZone = null;
		this.focusZoneContainer = null;
		this.focusZoneNeedsFirstRefresh = true;
		this.searchAnnounceTimeout = null;
		this.escRestoreHandler = null;
	},

	mounted()
	{
		this.renderSwitcher();
		this.syncSelectAllCheckbox();
		this.createFocusZone();

		void this.$nextTick(() => this.checkLongContent());
	},

	// No refresh of the focus zone from here: the set of the zone is the set of the rendered rows,
	// and the only two things that change it - the filtering and the toggling of a section - refresh
	// it from their own watchers. Every other rerender (a field toggled, select-all, a title renamed)
	// leaves the same rows in place, and refreshing walks the whole list asking the browser for the
	// visibility of every field. Anything that still slips through is caught by the zone's own
	// MutationObserver.
	updated()
	{
		this.syncSelectAllCheckbox();
	},

	beforeUnmount(): void
	{
		this.destroyFocusZone();
		this.cancelSearchAnnounce();
		this.cancelEscRestore();
	},

	template: `
		<div class="ui-checkbox-list" data-testid="ui-checkbox-list">
			<div
				class="ui-checkbox-list__header"
				v-if="dataParams.useSearch || (dataSections && dataParams.useSectioning)"
			>
				<div class="ui-checkbox-list__header_options">
					<div
						v-if="dataCompactField"
						class="ui-checkbox-list__switcher"
					>
						<div :id="switcherLabelId" class="ui-checkbox-list__switcher-text">
							{{ switcherText }}
						</div>
						<div
							class="switcher"
							data-testid="ui-checkbox-list-compact-view"
							ref="switcher"
						></div>
					</div>
					<div
						v-if="dataParams.useSearch"
						:class="searchClassName"
					>
						<div class="ui-checkbox-list__search-wrapper">
							<div class="ui-ctl ui-ctl-textbox ui-ctl-after-icon ui-ctl-w100">
								<input
									:placeholder="placeholderText"
									type="text"
									class="ui-ctl-element"
									data-testid="ui-checkbox-list-search"
									v-model="search"
									:aria-disabled="isSearchDisabled ? 'true' : null"
									:readonly="isSearchDisabled"
									data-autofocus
									ref="searchInput"
								>
								<button
									v-if="search.length > 0"
									type="button"
									data-testid="ui-checkbox-list-search-clear"
									:title="searchClearLabel"
									:aria-label="searchClearLabel"
									@click="handleClearSearchButtonClick"
									class="ui-ctl-after ui-ctl-icon-clear ui-checkbox-list__search-clear"
								></button>
								<div
									v-else
									class="ui-ctl-after ui-ctl-icon-search"
								></div>
							</div>
						</div>
					</div>
				</div>
				<checkbox-list-sections
					v-if="dataSections && dataParams.useSectioning"
					:sections="dataSections"
					@sectionToggled="handleSectionsToggled"
				/>
			</div>

			<div
				ref="wrapper"
				:class="wrapperClassName"
			>
				<div
					ref="container"
					data-testid="ui-checkbox-list-options"
					:id="optionsContainerId"
					class="ui-checkbox-list__container"
					role="group"
					:aria-label="optionsLabel"
					@focusin="handleListFocusIn"
					@scroll="handleScroll"
					tabindex="-1"
					v-if="isEmptyContent"
				>
					<checkbox-list-category
						v-if="dataParams.useSectioning"
						v-for="category in categoryBySection"
						:key="category.key"
						:context="context"
						:category="category"
						:columnCount="columnCount"
						:options="getOptionsByCategory(category.key)"
						:isActiveSearch="search.length > 0"
						:isEditableOptionsTitle="dataParams.isEditableOptionsTitle"
						:setOptionRef="setOptionRef"
						@onToggleOption="onToggleOption"
						@onEditModeChange="handleOptionEditModeChange"
					/>
	
					<checkbox-list-category
						v-else
						:context="context"
						:columnCount="columnCount"
						:options="getOptions()"
						:isActiveSearch="search.length > 0"
						:isEditableOptionsTitle="dataParams.isEditableOptionsTitle"
						:setOptionRef="setOptionRef"
						@onToggleOption="onToggleOption"
						@onEditModeChange="handleOptionEditModeChange"
					/>
				</div>
				<div
					v-else
					class="ui-checkbox-list__empty"
				>
					<img
						src="/bitrix/js/ui/dialogs/checkbox-list/images/ui-checkbox-list-empty.svg"
						alt=""
					>
					<div class="ui-checkbox-list__empty-title">
						{{ emptyStateTitleText }}
					</div>
					<div class="ui-checkbox-list__empty-description">
						{{ emptyStateDescriptionText }}
					</div>
	
					<div
						class="ui-checkbox-list__options"
						:style="{ 'column-count': columnCount, opacity: 0 }"
						aria-hidden="true"
					>
						<div>
							<label class="ui-ctl"></label>
						</div>
					</div>
				</div>
			</div>

			<!-- footer blocks follow the visual order left to right: only --center is in the flow,
			     --left and --right are absolutely positioned, so the DOM order is the Tab order -->
			<div class="ui-checkbox-list__footer">
				<div class="ui-checkbox-list__footer-block --left">
					<div
						data-testid="ui-checkbox-list-select-all"
						:class="selectAllClassName"
						@click="onSelectAllClick()"
					>
						<input
							type="checkbox"
							name="selectAllCheckbox"
							ref="selectAllCheckbox"
							:aria-labelledby="isNarrowWidth ? null : selectAllId"
							:aria-label="isNarrowWidth ? selectAllBtnText : null"
							:checked="isAllSelected"
							@click.prevent
						>
						<label
							v-if="!isNarrowWidth"
							:id="selectAllId"
						>
							{{ selectAllBtnText }}
						</label>
					</div>
	
					<div
						v-if="customFooterElements"
						v-for="customElement in customFooterElements"
					>
						<checkbox-component
							v-if="customElement.type === 'checkbox'"
							:id="customElement.id"
							:title="customElement.title"
							@onToggled="customElement.onClick"
						/>
						<text-toggle-component
							v-if="customElement.type === 'textToggle'"
							:id="customElement.id"
							:title="customElement.title"
							:dataItems="customElement.dataItems"
							@onToggled="customElement.onClick"
						/>
					</div>
				</div>
				<div class="ui-checkbox-list__footer-block --center">
					<button
						type="button"
						data-testid="ui-checkbox-list-apply"
						:class="applyClassName"
						:aria-disabled="isCheckedCheckboxes ? 'true' : null"
						@click="apply()"
					>
						{{ applyBtnText }}
					</button>
					<button
						type="button"
						data-testid="ui-checkbox-list-cancel"
						class="ui-btn ui-btn-link"
						@click="cancel()"
					>
						{{ cancelBtnText }}
					</button>
				</div>
				<div class="ui-checkbox-list__footer-block --right">
					<button
						v-if="dataParams.showBackToDefaultSettings"
						type="button"
						data-testid="ui-checkbox-list-default"
						class="ui-checkbox-list__footer-link --default"
						@click="defaultSettings()"
					>
						{{ defaultSettingsBtnText }}
					</button>
				</div>
			</div>
		</div>
	`,
};
