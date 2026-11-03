/* eslint-disable */
this.BX = this.BX || {};
(function (exports, checkboxList_css, main_core, main_core_events, main_popup, ui_designTokens, ui_vue3, ui_a11y) {
	'use strict';

	const viewMode = {
		view: 'view',
		edit: 'edit'
	};
	const CheckboxListOption = {
		props: ['id', 'title', 'isChecked', 'isLocked', 'isEditable', 'context'],
		emits: ['onToggleOption', 'onEditModeChange'],
		setup() {
			// Ids are generated once per component, outside the reactive state: they never change while
			// the component lives, and `option.id` cannot be used - it comes from the consumer and
			// repeats when a page holds two dialogs (a grid and a filter) at once.
			// `titleId` also names the checkbox: the wrapping label would otherwise build the name out
			// of everything inside it, the name of the rename button included.
			return {
				inputId: `ui-checkbox-list-option-${main_core.Text.getRandom().toLowerCase()}`,
				titleId: `ui-checkbox-list-option-title-${main_core.Text.getRandom().toLowerCase()}`,
				lockedStatusId: `ui-checkbox-list-option-locked-${main_core.Text.getRandom().toLowerCase()}`,
				renameHintId: `ui-checkbox-list-option-hint-${main_core.Text.getRandom().toLowerCase()}`
			};
		},
		data() {
			return {
				viewMode: viewMode.view,
				titleData: this.title,
				isCheckedValue: this.isChecked
			};
		},
		created() {
			// The value Escape restores. Non-reactive on purpose: nothing renders it.
			this.titleBeforeEdit = this.title;
		},
		methods: {
			getId() {
				return this.id;
			},
			getValue() {
				return this.isCheckedValue;
			},
			setValue(value) {
				this.isCheckedValue = value;
			},
			getTitle() {
				return this.$refs.title?.innerText ?? this.titleData;
			},
			setTitle(title) {
				this.titleData = title;
			},
			setStateFromProps(value = null) {
				this.viewMode = viewMode.view;
				this.titleData = this.title;
				this.titleBeforeEdit = this.title;
				this.isCheckedValue = value === null ? this.isChecked : value;
			},
			getOptionClassName({
				isChecked,
				isLocked
			}) {
				return ['ui-ctl', 'ui-ctl-checkbox', 'ui-checkbox-list__field-item_label', {
					'--checked': isChecked
				}, {
					'--disabled': isLocked
				}, {
					'--editable': !(this.isViewMode || isLocked)
				}];
			},
			getLabelClassName() {
				return ['ui-ctl-label-text', 'ui-checkbox-list__field-item_text', {
					'--editable': this.isEditMode && !this.isLocked
				}];
			},
			emitHandleCheckBox(event) {
				setTimeout(() => {
					const {
						id,
						title,
						isChecked,
						isLocked,
						isEditable,
						context
					} = this;
					main_core_events.EventEmitter.emit('ui:checkbox-list:check-option', {
						id,
						title,
						isChecked,
						isLocked,
						isEditable,
						context,
						viewMode: this.viewMode
					});
				});
			},
			handleCheckBox(event) {
				if (this.isLocked) {
					// eslint-disable-next-line no-param-reassign
					event.target.checked = !event.target.checked;
				} else {
					this.isCheckedValue = !this.isCheckedValue;
				}
				const {
					id,
					title,
					isLocked,
					isCheckedValue,
					isEditable,
					context
				} = this;
				this.$emit('onToggleOption', {
					id,
					title,
					isChecked: isCheckedValue,
					isLocked,
					isEditable,
					context,
					viewMode: this.viewMode
				});
			},
			// Enter on the field is the second keyboard way into the rename mode, next to the pencil the
			// arrows reach: a shortcut on the row itself saves the step sideways. A native checkbox
			// ignores Enter - it toggles on Space - so the key is free and the two do not interfere.
			handleFieldKeydown(event) {
				if (!this.canRename) {
					return;
				}
				event.preventDefault();
				this.onToggleViewMode(true);
			},
			onToggleViewMode(byKey = false) {
				this.viewMode = this.isEditMode ? viewMode.view : viewMode.edit;
				if (this.viewMode === viewMode.view) {
					this.$emit('onEditModeChange', false, byKey);
					return;
				}
				this.titleBeforeEdit = this.titleData;
				this.$emit('onEditModeChange', true, byKey);
				void this.$nextTick(() => this.setFocusOnTitle());
			},
			// byKey says whether a key ended the edit: only then is the Escape that ended it still
			// travelling towards the popup, and only then does the dialog have to wait for its keyup
			// before it hands the closing back. See handleOptionEditModeChange in content.js.
			//
			// The guard is what keeps that answer true. A key that ends the edit takes the focus out of
			// the title with it - the node stops being editable - so a blur follows and would report the
			// very same exit a second time, now as one made by mouse, and the dialog would hand the
			// closing back before the Escape still in flight reached the popup.
			leaveEditMode(byKey = false) {
				if (this.isViewMode) {
					return;
				}
				this.viewMode = viewMode.view;
				this.$emit('onEditModeChange', false, byKey);
			},
			confirmTitle() {
				if (!this.isEditMode) {
					return;
				}
				this.titleData = this.$refs.title?.innerText ?? this.titleData;
				this.leaveEditMode(true);
			},
			cancelTitle() {
				if (!this.isEditMode) {
					return;
				}
				this.titleData = this.titleBeforeEdit;
				if (this.$refs.title) {
					this.$refs.title.innerText = this.titleBeforeEdit;
				}
				this.leaveEditMode(true);
			},
			setFocusOnTitle() {
				this.$refs.title.focus();
				const range = document.createRange();
				const selection = window.getSelection();
				range.selectNodeContents(this.$refs.title);
				range.collapse(false);
				selection.removeAllRanges();
				selection.addRange(range);
			},
			onChangeTitle({
				target
			}) {
				this.titleData = target.innerText;

				// Leaving the field ends the edit mode as well, not just the hold on Escape: the value is
				// already kept above, and a row that stayed editable behind a focus that had left made
				// Enter on the field toggle the mode the wrong way while the hint about it was gone.
				this.leaveEditMode();
			},
			// A press on the pencil while the title is being edited would otherwise end the mode twice:
			// the focus leaving the title ends it on blur, and the click that follows reads the row as
			// already in view mode and opens the editing again. Keeping the focus where it is on
			// mousedown leaves the click as the single thing that ends the mode.
			onRenameMousedown(event) {
				if (this.isEditMode) {
					event.preventDefault();
				}
			}
		},
		computed: {
			isEditMode() {
				return this.viewMode === viewMode.edit;
			},
			isViewMode() {
				return this.viewMode === viewMode.view;
			},
			labelClassName() {
				return this.getLabelClassName();
			},
			// See the note in content.js: an empty phrase must not turn into an empty aria-label.
			renameLabel() {
				return main_core.Loc.getMessage('UI_CHECKBOX_LIST_OPTION_RENAME_LABEL', {
					'#TITLE#': this.titleData
				}) || null;
			},
			lockedStatusText() {
				return main_core.Loc.getMessage('UI_CHECKBOX_LIST_OPTION_LOCKED_STATUS') || null;
			},
			canRename() {
				return Boolean(this.isEditable) && !this.isLocked;
			},
			// A shortcut nobody is told about is half a solution, so the field itself carries the hint:
			// the reader announces it on arrival, once per field, instead of it living on every control.
			renameHintText() {
				return main_core.Loc.getMessage('UI_CHECKBOX_LIST_OPTION_RENAME_HINT') || null;
			},
			// The reason a field is locked and the hint about renaming never apply at once, and the
			// hint is dropped while the value is being edited - there it would describe what the user
			// is already doing. Either one points at its node only while its phrase is there: a
			// description resolving to an empty node is worse than none at all.
			fieldDescribedBy() {
				if (this.isLocked) {
					return this.lockedStatusText ? this.lockedStatusId : null;
				}
				return this.canRename && this.isViewMode && this.renameHintText ? this.renameHintId : null;
			}
		},
		template: `
		<label
			:title="titleData"
			:class="getOptionClassName({ isChecked: isCheckedValue, isLocked })"
			@click="this.emitHandleCheckBox"
		>
			<input
				type="checkbox"
				class="ui-ctl-element ui-checkbox-list__field-item_input"
				data-testid="ui-checkbox-list-option"
				:id="inputId"
				:checked="isCheckedValue"
				:aria-labelledby="titleId"
				:aria-disabled="isLocked ? 'true' : null"
				:aria-describedby="fieldDescribedBy"
				@click="this.handleCheckBox"
				@keydown.enter="handleFieldKeydown"
			>
			<div
				:id="titleId"
				:class="labelClassName"
				:contenteditable="(isViewMode || isLocked) ? 'false' : 'true'"
				@keydown.enter.prevent="confirmTitle"
				@keydown.esc="cancelTitle"
				@blur="onChangeTitle"
				ref="title"
			>
				{{ titleData }}
			</div>
	
			<template v-if="isLocked">
				<span class="ui-checkbox-list__field-item_locked" aria-hidden="true"></span>
				<span
					v-if="lockedStatusText"
					:id="lockedStatusId"
					class="ui-checkbox-list__visually-hidden"
				>
					{{ lockedStatusText }}
				</span>
			</template>
			<button
				v-else-if="isEditable"
				type="button"
				data-testid="ui-checkbox-list-option-rename"
				class="ui-checkbox-list__field-item_edit"
				:aria-label="renameLabel"
				@mousedown="onRenameMousedown"
				@click.prevent="onToggleViewMode(false)"
			></button>

			<span
				v-if="fieldDescribedBy === renameHintId"
				:id="renameHintId"
				class="ui-checkbox-list__visually-hidden"
			>
				{{ renameHintText }}
			</span>
		</label>
	`
	};

	const CheckboxListCategory = {
		props: ['columnCount', 'category', 'options', 'context', 'isActiveSearch', 'isEditableOptionsTitle', 'onChange', 'setOptionRef'],
		emits: ['onToggleOption', 'onEditModeChange'],
		components: {
			CheckboxListOption
		},
		setup() {
			return {
				titleId: `ui-checkbox-list-category-${main_core.Text.getRandom().toLowerCase()}`
			};
		},
		computed: {
			// A group role without a name is worse than no role at all, so both the role and the
			// association appear only when the category actually renders a non-empty title.
			hasTitle() {
				return main_core.Type.isStringFilled(this.category?.title);
			}
		},
		methods: {
			setRef(ref) {
				if (ref) {
					this.setOptionRef(ref.getId(), ref);
				}
			},
			onToggleOption(event) {
				this.$emit('onToggleOption', event);
			},
			// byKey travels with the event: the dialog hands the closing by Escape back at once when a
			// mouse ended the edit, and waits for a keyup when a key did. Dropping it here made every
			// exit look like one made by mouse.
			onEditModeChange(isEditing, byKey = false) {
				this.$emit('onEditModeChange', isEditing, byKey);
			}
		},
		template: `
		<div
			v-if="options.length > 0 || !isActiveSearch"
			class="ui-checkbox-list__category"
		>
			<div v-if="category" :id="titleId" class="ui-checkbox-list__categories-title">
				{{ category.title }}
			</div>
			<div
				class="ui-checkbox-list__options"
				:role="hasTitle ? 'group' : null"
				:aria-labelledby="hasTitle ? titleId : null"
				:style="{ 'column-count': columnCount }"
			>
				<div
					v-for="option in options"
					:key="option.id"
				>
					<checkbox-list-option
						:context="context"
						:id="option.id"
						:title="option.title ?? option.id"
						:isChecked="option.value"
						:isLocked="option?.locked"
						:isEditable="isEditableOptionsTitle"
						:ref="setRef"
						@onToggleOption="onToggleOption"
						@onEditModeChange="onEditModeChange"
					/>
				</div>
			</div>
		</div>
	`
	};

	const CheckboxComponent = {
		props: ['id', 'title'],
		setup() {
			// `dataId` is the consumer's id and lands in the input's `name`; the label needs an id that
			// is unique on the page, so it gets its own generated one.
			return {
				inputId: `ui-checkbox-list-footer-checkbox-${main_core.Text.getRandom().toLowerCase()}`
			};
		},
		data() {
			return {
				dataTitle: this.title,
				dataId: this.id,
				checked: false
			};
		},
		methods: {
			// The checkbox itself is the single source of the state: v-model already reflects the native
			// toggle, so inverting `checked` on top of that turned a click on the box into a no-op.
			handleChange() {
				this.$emit('onToggled', this.checked);
			}
		},
		template: `
		<div class="ui-checkbox-list__footer-custom-element --checkbox">
			<input
				type="checkbox"
				data-testid="ui-checkbox-list-footer-checkbox"
				:id="inputId"
				:name="dataId"
				v-model="checked"
				@change="handleChange"
			>
			<label :for="inputId">{{ dataTitle }}</label>
		</div>
	`
	};

	const TextToggleComponent = {
		props: ['id', 'title', 'dataItems'],
		data() {
			return {
				dataTitle: this.title,
				value: null
			};
		},
		methods: {
			handleClick(key) {
				let index = this.dataItems.findIndex(item => item.value === this.value);
				if (index >= this.dataItems.length - 1) {
					index = 0;
				} else {
					index++;
				}
				this.value = this.dataItems[index].value;
				this.$emit('onToggled', this.value);
			}
		},
		computed: {
			currentLabel() {
				if (this.value === null && main_core.Type.isArrayFilled(this.dataItems)) {
					this.value = this.dataItems[0].value;
					return this.dataItems[0].label;
				}
				return this.dataItems.find(item => item.value === this.value)?.label;
			}
		},
		// The hidden field the value used to be mirrored into is gone: an input inside a button is a
		// nested interactive element, and the dialog is not a form - the value reaches the consumer
		// through onToggled, so nothing read that field.
		template: `
		<button
			type="button"
			data-testid="ui-checkbox-list-footer-texttoggle"
			class="ui-checkbox-list__footer-custom-element --texttoggle"
			@click="handleClick"
		>
			<span class="ui-checkbox-list__texttoggle__title">{{ dataTitle }}</span>
			<span class="ui-checkbox-list__texttoggle__value">{{ currentLabel }}</span>
		</button>
	`
	};

	const CheckboxListSections = {
		props: ['sections'],
		methods: {
			handleClick(key) {
				this.$emit('sectionToggled', key);
			},
			getSectionsItemClassName(sectionValue) {
				return ['ui-checkbox-list__sections-item', {
					'--checked': sectionValue
				}];
			}
		},
		computed: {
			// See the note in content.js: an empty phrase must not turn into an empty aria-label.
			sectionsLabel() {
				return main_core.Loc.getMessage('UI_CHECKBOX_LIST_SECTIONS_LABEL') || null;
			}
		},
		template: `
		<div
			class="ui-checkbox-list__sections"
			role="group"
			:aria-label="sectionsLabel"
		>
			<button
				v-for="section in sections"
				type="button"
				data-testid="ui-checkbox-list-section"
				:key="section.key"
				:title="section.title"
				:class="getSectionsItemClassName(section.value)"
				:aria-pressed="section.value ? 'true' : 'false'"
				@click="handleClick(section.key)"
			>
				<span class="ui-checkbox-list__check-box" aria-hidden="true"></span>
				<span class="ui-checkbox-list__section_title">{{ section.title }}</span>
			</button>
		</div>
	`
	};

	// Counted from the last keystroke: long enough to let a word be typed, short enough to stay a reply
	// to that word.
	const searchAnnounceDelay = 700;
	const Content = {
		components: {
			CheckboxListSections,
			CheckboxListCategory,
			CheckboxComponent,
			TextToggleComponent
		},
		props: ['dialog', 'popup', 'columnCount', 'compactField', 'customFooterElements', 'lang', 'sections', 'categories', 'options', 'params', 'context'],
		setup() {
			// Generated once per component and kept out of the reactive state: the values never change
			// while the component lives, and two dialogs on one page must not share them.
			return {
				switcherLabelId: `ui-checkbox-list-compact-${main_core.Text.getRandom().toLowerCase()}`,
				optionsContainerId: `ui-checkbox-list-options-${main_core.Text.getRandom().toLowerCase()}`,
				selectAllId: `ui-checkbox-list-select-all-${main_core.Text.getRandom().toLowerCase()}`
			};
		},
		data() {
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
				scrollIsTop: false
			};
		},
		methods: {
			getPreparedDataOptions() {
				return new Map(this.options.map(option => [option.id, option]));
			},
			getPreparedParams() {
				const {
					params
				} = this;
				return {
					useSearch: Boolean(params.useSearch ?? true),
					useSectioning: Boolean(params.useSectioning ?? true),
					closeAfterApply: Boolean(params.closeAfterApply ?? true),
					showBackToDefaultSettings: Boolean(params.showBackToDefaultSettings ?? true),
					isEditableOptionsTitle: Boolean(params.isEditableOptionsTitle ?? false),
					destroyPopupAfterClose: Boolean(params.destroyPopupAfterClose ?? true)
				};
			},
			renderSwitcher() {
				if (this.dataCompactField) {
					new BX.UI.Switcher({
						node: this.$refs.switcher,
						checked: this.dataCompactField.value,
						size: 'small',
						// The switch owns its own role, tab stop, keyboard and aria-checked; the name
						// comes from the visible caption, so it cannot drift away from it.
						accessible: true,
						ariaLabelledBy: this.switcherLabelId,
						handlers: {
							toggled: () => this.handleSwitcherToggled()
						}
					});
				}
			},
			handleSwitcherToggled() {
				if (this.dataCompactField) {
					this.dataCompactField.value = !this.dataCompactField.value;
				}
			},
			clearSearch() {
				this.search = '';
			},
			handleClearSearchButtonClick() {
				this.setFocusToSearchInput();
				this.clearSearch();
			},
			setFocusToSearchInput() {
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
			createFocusZone() {
				const container = this.$refs.container;
				if (!container) {
					this.destroyFocusZone();
					return;
				}
				if (this.focusZoneContainer === container) {
					return;
				}
				this.destroyFocusZone();
				this.focusZone = new ui_a11y.FocusZone(container, {
					bindKeys: ui_a11y.FocusKeys.ArrowAll | ui_a11y.FocusKeys.HomeAndEnd,
					focusableElementFilter: element => this.isZoneElement(element),
					getNextFocusable: (direction, from, event) => this.getNextZoneElement(from, event)
				});
				this.focusZone.activate();
				this.focusZoneContainer = container;
				this.focusZoneNeedsFirstRefresh = true;
			},
			// deactivate() is what releases the node: it disconnects the observer of the zone, detaches
			// its listeners and restores the tabindex it had taken over.
			destroyFocusZone() {
				this.focusZone?.deactivate();
				this.focusZone = null;
				this.focusZoneContainer = null;
			},
			// The single source of truth for the set of the zone: the field of every row plus its rename
			// button. The button is a member so the pencil can be reached by the keyboard at all - it is
			// why the button is hidden by its background image rather than by opacity or visibility,
			// both of which drop it out of the set collected by checkVisibility().
			isZoneElement(element) {
				return this.isZoneField(element) || this.isZonePencil(element);
			},
			isZoneField(element) {
				return main_core.Dom.hasClass(element, 'ui-checkbox-list__field-item_input');
			},
			isZonePencil(element) {
				return main_core.Dom.hasClass(element, 'ui-checkbox-list__field-item_edit');
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
			getNextZoneElement(from, event) {
				const fields = this.zoneFields();
				if (fields.length === 0 || !this.isZoneElement(from)) {
					return null;
				}

				// Home and End belong to the list, not to the row, so where the jump started does not
				// matter beyond being inside the zone at all.
				if (event.key === 'Home') {
					return fields[0];
				}
				if (event.key === 'End') {
					return fields.at(-1) ?? null;
				}
				const row = from.closest('.ui-checkbox-list__field-item_label');
				return row ? this.stepInsideRow(row, from, event, fields) : null;
			},
			zoneFields() {
				return [...(this.$refs.container?.querySelectorAll('.ui-checkbox-list__field-item_input') ?? [])];
			},
			stepInsideRow(row, from, event, fields) {
				const field = row.querySelector('.ui-checkbox-list__field-item_input');
				const pencil = row.querySelector('.ui-checkbox-list__field-item_edit');
				if (event.key === 'ArrowRight') {
					return (this.isZoneField(from) ? pencil : null) ?? from;
				}
				if (event.key === 'ArrowLeft') {
					return this.isZonePencil(from) ? field : from;
				}

				// A vertical step always continues from the field of the row, whichever member of it the
				// focus sits on, and always lands on a field.
				if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
					return fields[fields.indexOf(field) + (event.key === 'ArrowDown' ? 1 : -1)] ?? from;
				}
				return null;
			},
			// Both callers - the filtering and the toggling of a section - can leave the list empty and
			// bring it back, so the node has to be rechecked before its set is refreshed.
			refreshFocusZone() {
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
			handleListFocusIn() {
				if (this.focusZoneNeedsFirstRefresh) {
					this.focusZoneNeedsFirstRefresh = false;
					this.focusZone?.refreshElements();
				}
			},
			cancelSearchAnnounce() {
				if (this.searchAnnounceTimeout !== null) {
					clearTimeout(this.searchAnnounceTimeout);
					this.searchAnnounceTimeout = null;
				}
			},
			// Announced once the typing stops, never per keystroke: a reply per character floods the live
			// region and is not read out at all.
			scheduleSearchAnnounce() {
				this.cancelSearchAnnounce();
				this.searchAnnounceTimeout = setTimeout(() => {
					this.searchAnnounceTimeout = null;
					this.announceSearchResult();
				}, searchAnnounceDelay);
			},
			// A blank phrase must not reach the live region: an empty reply is noise, and a phrase can be
			// missing on a stand whose translation repository points elsewhere.
			announce(message) {
				if (main_core.Type.isStringFilled(message)) {
					ui_a11y.LiveAnnouncer.announce(message, 'polite');
				}
			},
			announceSearchResult() {
				// An empty search is a return to the whole list, not a result of a search.
				if (!main_core.Type.isStringFilled(this.search)) {
					return;
				}

				// Counted over the same set that decides the empty state (isEmptyContent), so what is
				// heard matches what is on screen: a locked field is still a field the search found,
				// and its own unavailability is announced by the field itself.
				const count = this.visibleOptions.length;
				if (count === 0) {
					this.announce(main_core.Loc.getMessage('UI_CHECKBOX_LIST_SEARCH_EMPTY_ANNOUNCE'));
					return;
				}
				this.announce(main_core.Loc.getMessage('UI_CHECKBOX_LIST_SEARCH_RESULT_ANNOUNCE', {
					'#COUNT#': count
				}));
			},
			handleSectionsToggled(key) {
				const section = this.dataSections.find(item => item.key === key);
				if (!section) {
					return;
				}

				// The move happens while the field is still in the DOM: waiting for the rerender to
				// remove it would drop the focus to the body.
				this.moveFocusOutOfList(this.getSectionToggle(key));
				section.value = !section.value;
			},
			getSectionToggle(key) {
				const toggles = this.$el?.querySelectorAll('.ui-checkbox-list__sections-item') ?? [];
				const index = this.dataSections.findIndex(item => item.key === key);
				return toggles[index] ?? null;
			},
			// Nothing to do unless the focus is really inside the list: the search field keeps it while
			// typing, and a click on a section toggle already holds it itself.
			moveFocusOutOfList(target = null) {
				const container = this.$refs.container;
				const activeElement = ui_a11y.FocusNavigator.getActiveElement();
				if (!container || !activeElement || !container.contains(activeElement)) {
					return;
				}
				const focusTarget = target ?? container;
				if (ui_a11y.InteractivityChecker.isFocusable(focusTarget)) {
					ui_a11y.FocusNavigator.focusTarget(focusTarget, {
						preventScroll: true
					});
				} else {
					// the list container is the last resort: it has tabindex="-1" to accept the focus
					ui_a11y.FocusNavigator.focusContainer(focusTarget, {
						preventScroll: true
					});
				}
			},
			getOptionsByCategory(category = null) {
				return this.getOptions().filter(item => item.categoryKey === category);
			},
			getOptions() {
				return this.optionsByTitle;
			},
			getCheckedOptionsId() {
				return this.getCheckedOptions().map(option => option.getId());
			},
			getCheckedOptions() {
				return this.getOptionRefs().filter(option => option.getValue());
			},
			checkLongContent() {
				if (this.$refs.container) {
					this.longContent = this.$refs.container.clientHeight < this.$refs.container.scrollHeight;
				} else {
					this.longContent = false;
				}
			},
			getBottomIndent() {
				const {
					scrollTop,
					clientHeight,
					scrollHeight
				} = this.$refs.container;
				this.scrollIsBottom = scrollTop + clientHeight < scrollHeight - 10;
			},
			getTopIndent() {
				this.scrollIsTop = this.$refs.container.scrollTop;
			},
			handleScroll() {
				this.getBottomIndent();
				this.getTopIndent();
			},
			defaultSettings() {
				const event = new main_core_events.BaseEvent({
					data: {
						switcher: this.dataCompactField,
						fields: this.getCheckedOptionsId()
					}
				});
				main_core_events.EventEmitter.emit(this.dialog, 'onDefault', event);
				if (event.isDefaultPrevented()) {
					return;
				}
				this.clearSearch();
				const {
					dataCompactField,
					sections,
					categories,
					$refs
				} = this;
				if (dataCompactField && dataCompactField.value !== dataCompactField.defaultValue) {
					$refs.switcher.click();
				}
				this.dataSections = sections;
				this.dataOptions = this.getPreparedDataOptions();
				this.dataCategories = categories;
				this.setDefaultValuesForOptions();
			},
			setDefaultValuesForOptions() {
				void this.$nextTick(() => {
					this.getOptionRefs().forEach(option => option.setValue(this.dataOptions.get(option.getId()).defaultValue));
				});
			},
			toggleOption(id) {
				const option = this.optionsRef.get(id);
				if (!option) {
					return;
				}
				option.setValue(!option.getValue());
			},
			onSelectAllClick() {
				// pointer-events: none keeps a mouse click off the native input (see style.css), so the
				// browser never focuses the checkbox by itself; focus it here, otherwise focus stays where
				// it was (the search field on open) and a Space right after the click types there instead
				// of toggling. Keyboard activation already has the focus, so this is a no-op for it.
				this.$refs.selectAllCheckbox?.focus();
				if (this.isAllSelected) {
					this.deselectAll();
					this.announce(main_core.Loc.getMessage('UI_CHECKBOX_LIST_DESELECT_ALL_ANNOUNCE'));
				} else {
					this.selectAll();
					this.announce(main_core.Loc.getMessage('UI_CHECKBOX_LIST_SELECT_ALL_ANNOUNCE', {
						'#COUNT#': this.getSelectableVisibleOptionRefs().length
					}));
				}

				// A click/Space on the <input> itself triggers the native checkbox activation; because of
				// @click.prevent the browser rolls checked/indeterminate back to the pre-click state after Vue
				// has updated. Re-sync the DOM on the next macrotask, i.e. after that rollback.
				setTimeout(() => this.syncSelectAllCheckbox(), 0);
			},
			select(id, value = true) {
				const option = this.getOptionRefs().find(item => item.id === id);
				option?.setValue(value);
			},
			selectAll() {
				this.setValueForAllVisibleOptions(true);
			},
			deselectAll() {
				this.setValueForAllVisibleOptions(false);
			},
			setValueForAllVisibleOptions(value) {
				this.getSelectableVisibleOptionRefs().forEach(option => {
					this.dataOptions.get(option.getId()).value = value;
					option.setValue(value);
				});
			},
			getOptionRefs() {
				return [...this.optionsRef.values()];
			},
			getSelectableVisibleOptionRefs() {
				// Sectioning hides the options of a disabled section, but their refs stay in optionsRef
				// (CheckboxListCategory.setRef ignores the null ref an unmount passes), so the set has to
				// follow what the template actually renders: visibleOptions with sectioning on, the plain
				// search-filtered getOptions() without it.
				const shownOptions = this.dataParams.useSectioning ? this.visibleOptions : this.getOptions();
				const shownOptionIds = new Set(shownOptions.map(option => option.id));
				return this.getOptionRefs().filter(option => !option.isLocked && shownOptionIds.has(option.getId()));
			},
			// Invariant: the checkbox's checked/indeterminate state is synced to the DOM imperatively here
			// (from mounted()/updated(), plus a deferred setTimeout in onSelectAllClick), not by a reactive
			// template binding alone. `indeterminate` has no plain attribute binding, and a trusted click on
			// the @click.prevent input makes the browser roll checked/indeterminate back to its pre-click
			// value after Vue has rendered. Reasserting the DOM property here (and once more on the next
			// macrotask) keeps it aligned with the derived tri-state. Do not "simplify" to a binding only —
			// that reintroduces the checked/indeterminate rollback bug on a trusted click.
			syncSelectAllCheckbox() {
				const input = this.$refs.selectAllCheckbox;
				if (input) {
					input.checked = this.isAllSelected;
					input.indeterminate = this.isSelectAllIndeterminate;
				}
			},
			cancel() {
				main_core_events.EventEmitter.emit(this.dialog, 'onCancel');
				this.restoreOptionValues();
				this.destroyOrClosePopup();
			},
			restoreOptionValues() {
				this.getOptionRefs().forEach(option => option.setStateFromProps());
			},
			apply() {
				// The button carries aria-disabled rather than the native one, so that the count of the
				// Tab stops does not depend on the selection - which makes this guard the only thing
				// stopping an apply with nothing selected. It has to stay.
				if (this.isCheckedCheckboxes) {
					return;
				}
				const fields = this.getCheckedOptionsId();
				const eventParams = {
					switcher: this.dataCompactField,
					fields,
					data: {
						titles: this.getOptionTitles()
					}
				};
				main_core_events.EventEmitter.emit(this.dialog, 'onApply', eventParams);
				this.adjustOptions(fields);
				if (this.dataParams.closeAfterApply) {
					this.destroyOrClosePopup();
					return;
				}

				// Announced only while the dialog stays open: on close the reply competes with the focus
				// returning to the initiator and gets cut off.
				this.announce(main_core.Loc.getMessage('UI_CHECKBOX_LIST_APPLIED_ANNOUNCE'));
			},
			getOptionTitles() {
				const titles = {};
				this.getOptionRefs().forEach(option => {
					titles[option.getId()] = option.getTitle();
				});
				return titles;
			},
			adjustOptions(checkedFieldIds = []) {
				for (const option of this.optionsRef.values()) {
					const id = option.getId();
					const value = checkedFieldIds.includes(id);
					this.dataOptions.set(id, {
						...this.dataOptions.get(id),
						title: option.getTitle(),
						value
					});
					void this.$nextTick(() => option.setStateFromProps(value));
				}
			},
			destroyOrClosePopup() {
				if (this.dataParams.destroyPopupAfterClose) {
					this.destroyPopup();
				} else {
					this.closePopup();
				}
			},
			destroyPopup() {
				this.popup.destroy();
			},
			closePopup() {
				this.popup.close();
			},
			setOptionRef(id, ref) {
				this.optionsRef.set(id, ref);
			},
			isAllSectionsDisabled() {
				return main_core.Type.isArrayFilled(this.dataSections) && this.dataSections.every(section => section.value === false);
			},
			// Escape inside the rename mode has to undo the rename, not close the dialog. The popup
			// listens for keyup on the document in the capture phase, so it always wins over any
			// handler on the field: stopping the propagation there is impossible. Taking `closeByEsc`
			// away for the duration of the edit is the only way to leave Escape to the field.
			handleOptionEditModeChange(isEditing, byKey = false) {
				this.cancelEscRestore();
				if (isEditing) {
					this.popup?.setClosingByEsc?.(false);
					return;
				}

				// Only a key that ended the edit leaves an Escape still travelling towards the popup,
				// whose own keyup is what the popup closes on - and the delay between keydown and keyup
				// is a human one, so any timer loses that race. A mouse leaves nothing in flight, and
				// waiting for a keyup there would spend the first Escape the user presses afterwards on
				// the restore instead of on closing the dialog.
				if (!byKey) {
					this.popup?.setClosingByEsc?.(true);
					return;
				}
				this.escRestoreHandler = () => {
					this.cancelEscRestore();
					this.popup?.setClosingByEsc?.(true);
				};
				main_core.Event.bind(document, 'keyup', this.escRestoreHandler, true);
			},
			cancelEscRestore() {
				if (this.escRestoreHandler) {
					main_core.Event.unbind(document, 'keyup', this.escRestoreHandler, true);
					this.escRestoreHandler = null;
				}
			},
			onToggleOption(event) {
				if (this.dataOptions.has(event.id)) {
					const option = this.dataOptions.get(event.id);
					option.value = event.isChecked;
					this.dataOptions.set(event.id, option);
				}
			}
		},
		watch: {
			search() {
				// The focus stays in the search field while typing, so only the set of the zone follows
				// the filtering here.
				this.refreshFocusZone();
				this.scheduleSearchAnnounce();
				void this.$nextTick(() => this.checkLongContent());
			},
			categoryBySection() {
				this.refreshFocusZone();
				void this.$nextTick(() => this.checkLongContent());
			}
		},
		computed: {
			visibleOptions() {
				const {
					dataSections,
					optionsByTitle,
					dataCategories
				} = this;
				if (!main_core.Type.isArrayFilled(dataSections)) {
					return optionsByTitle;
				}
				return optionsByTitle.filter(option => {
					const category = dataCategories.find(item => item.key === option.categoryKey);
					const section = dataSections.find(item => item.key === category.sectionKey);
					return section?.value;
				});
			},
			isEmptyContent() {
				return main_core.Type.isArrayFilled(this.visibleOptions);
			},
			// @temporary temp, waiting for a new ui for this case
			isNarrowWidth() {
				return window.innerWidth * 0.9 < 500;
			},
			isSearchDisabled() {
				if (main_core.Type.isArrayFilled(this.dataSections)) {
					return !this.dataSections.some(section => section.value);
				}
				return false;
			},
			isCheckedCheckboxes() {
				for (const option of this.optionsRef.values()) {
					if (option.getValue() === true && option.locked !== true) {
						return false;
					}
				}
				return true;
			},
			optionsByTitle() {
				const options = [...this.dataOptions.values()];
				const searchString = this.search.toLowerCase();
				return options.filter(item => (item.title ?? item.id).toLowerCase().includes(searchString));
			},
			categoryBySection() {
				if (!main_core.Type.isArrayFilled(this.dataSections)) {
					return this.dataCategories;
				}
				return this.dataCategories.filter(category => {
					const section = this.dataSections.find(item => category.sectionKey === item.key);
					return section?.value;
				});
			},
			wrapperClassName() {
				return ['ui-checkbox-list__wrapper', {
					'--long': this.longContent
				}, {
					'--bottom': this.scrollIsBottom
				}, {
					'--top': this.scrollIsTop
				}];
			},
			searchClassName() {
				return ['ui-checkbox-list__search', {
					'--disabled': this.isSearchDisabled
				}];
			},
			applyClassName() {
				return ['ui-btn ui-btn-primary', {
					'ui-btn-disabled': this.isCheckedCheckboxes
				}];
			},
			selectAllClassName() {
				// Reading isSelectAllIndeterminate here makes it a dependency of the render: without a plain
				// :indeterminate binding, this class binding is what wakes the rerender (and updated() ->
				// syncSelectAllCheckbox()) on any tri-state transition, not only the ones that also flip
				// isAllSelected or isCheckedCheckboxes.
				return ['ui-checkbox-list__footer-link --select-all', {
					'--narrow': this.isNarrowWidth
				}, {
					'--indeterminate': this.isSelectAllIndeterminate
				}];
			},
			switcherText() {
				return main_core.Type.isStringFilled(this.lang.switcher) ? this.lang.switcher : main_core.Loc.getMessage('UI_CHECKBOX_LIST_DEFAULT_SETTINGS_SWITCHER');
			},
			placeholderText() {
				return main_core.Type.isStringFilled(this.lang.placeholder) ? this.lang.placeholder : main_core.Loc.getMessage('UI_CHECKBOX_LIST_DEFAULT_SETTINGS_PLACEHOLDER');
			},
			defaultSettingsBtnText() {
				return main_core.Type.isStringFilled(this.lang.defaultBtn) ? this.lang.defaultBtn : main_core.Loc.getMessage('UI_CHECKBOX_LIST_DEFAULT_SETTINGS_MSGVER_1');
			},
			applyBtnText() {
				return main_core.Type.isStringFilled(this.lang.acceptBtn) ? this.lang.acceptBtn : main_core.Loc.getMessage('UI_CHECKBOX_LIST_DEFAULT_ACCEPT_BUTTON');
			},
			cancelBtnText() {
				return main_core.Type.isStringFilled(this.lang.cancelBtn) ? this.lang.cancelBtn : main_core.Loc.getMessage('UI_CHECKBOX_LIST_DEFAULT_CANCEL_BUTTON');
			},
			// An empty phrase must never reach aria-label: `aria-label=""` strips the name instead of
			// leaving the fallback in place, and a phrase can be missing on a stand whose translation
			// repository points elsewhere.
			searchClearLabel() {
				return main_core.Loc.getMessage('UI_CHECKBOX_LIST_SEARCH_CLEAR_LABEL') || null;
			},
			optionsLabel() {
				return main_core.Loc.getMessage('UI_CHECKBOX_LIST_OPTIONS_LABEL') || null;
			},
			selectAllBtnText() {
				return main_core.Type.isStringFilled(this.lang.selectAllBtn) ? this.lang.selectAllBtn : main_core.Loc.getMessage('UI_CHECKBOX_LIST_DEFAULT_SELECT_ALL_MSGVER_1');
			},
			emptyStateTitleText() {
				if (this.isAllSectionsDisabled()) {
					return main_core.Type.isStringFilled(this.lang.allSectionsDisabledTitle) ? this.lang.allSectionsDisabledTitle : main_core.Loc.getMessage('UI_CHECKBOX_LIST_DEFAULT_SETTINGS_EMPTY_STATE_TITLE_MSGVER_1');
				}
				return main_core.Type.isStringFilled(this.lang.emptyStateTitle) ? this.lang.emptyStateTitle : main_core.Loc.getMessage('UI_CHECKBOX_LIST_DEFAULT_SETTINGS_EMPTY_STATE_TITLE_MSGVER_1');
			},
			emptyStateDescriptionText() {
				if (this.isAllSectionsDisabled()) {
					return '';
				}
				return main_core.Type.isStringFilled(this.lang.emptyStateDescription) ? this.lang.emptyStateDescription : main_core.Loc.getMessage('UI_CHECKBOX_LIST_DEFAULT_SETTINGS_EMPTY_STATE_DESCRIPTION_MSGVER_1');
			},
			// Single source of truth for the select-all tri-state: one pass over the selectable visible
			// options yields both counts, and isAllSelected/isSelectAllIndeterminate are derived from it.
			// The footer checkbox stays in sync because the render reads both derived values reactively:
			// isAllSelected via :checked and isSelectAllIndeterminate via selectAllClassName. A change in
			// either reruns render() and thus updated()/syncSelectAllCheckbox(); this does not rely on any
			// side effect of dataOptions.set() (a repeat set of an already-toggled option does not retrigger).
			selectAllState() {
				const options = this.getSelectableVisibleOptionRefs();
				let selectedCount = 0;
				for (const option of options) {
					if (option.getValue() === true) {
						selectedCount += 1;
					}
				}
				return {
					selectedCount,
					selectableCount: options.length
				};
			},
			isAllSelected() {
				const {
					selectedCount,
					selectableCount
				} = this.selectAllState;
				return selectableCount > 0 && selectedCount === selectableCount;
			},
			isSelectAllIndeterminate() {
				const {
					selectedCount,
					selectableCount
				} = this.selectAllState;
				return selectedCount > 0 && selectedCount < selectableCount;
			}
		},
		created() {
			// non-reactive on purpose: a FocusZone instance behind a Vue proxy breaks its private fields
			this.focusZone = null;
			this.focusZoneContainer = null;
			this.focusZoneNeedsFirstRefresh = true;
			this.searchAnnounceTimeout = null;
			this.escRestoreHandler = null;
		},
		mounted() {
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
		updated() {
			this.syncSelectAllCheckbox();
		},
		beforeUnmount() {
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
	`
	};

	class CheckboxList extends main_core_events.EventEmitter {
		layoutApp = null;
		layoutComponent = null;
		constructor(options) {
			super();
			this.setEventNamespace('BX.UI.Dialogs.CheckboxList');
			this.subscribeFromOptions(options.events);
			this.context = main_core.Type.isPlainObject(options.context) ? options.context : null;
			this.compactField = main_core.Type.isPlainObject(options.compactField) ? options.compactField : null;
			this.sections = main_core.Type.isArray(options.sections) ? options.sections : null;
			this.lang = main_core.Type.isPlainObject(options.lang) ? options.lang : {};
			this.popup = null;
			this.columnCount = main_core.Type.isNumber(options.columnCount) ? options.columnCount : 4;
			this.popupOptions = main_core.Type.isPlainObject(options.popupOptions) ? options.popupOptions : {};
			this.params = main_core.Type.isPlainObject(options.params) ? options.params : {};
			const useSectioning = this.params.useSectioning ?? true;
			if (useSectioning && !main_core.Type.isArray(options.categories)) {
				throw new Error('CheckboxList: "categories" parameter is required.');
			}
			this.categories = options.categories;
			if (useSectioning && !main_core.Type.isArray(options.options)) {
				throw new Error('CheckboxList: "options" parameter is required.');
			}
			this.options = options.options;
			this.customFooterElements = main_core.Type.isArrayFilled(options.customFooterElements) ? options.customFooterElements : [];
			this.closeAfterApply = main_core.Type.isBoolean(options.closeAfterApply) ? options.closeAfterApply : true;
		}
		getPopup() {
			const container = main_core.Dom.create('div');
			main_core.Dom.addClass(container, 'ui-checkbox-list__app-container');
			if (!this.popup) {
				const {
					lang,
					layoutComponent,
					popupOptions
				} = this;
				const {
					innerWidth,
					innerHeight
				} = window;
				this.popup = new main_popup.Popup({
					className: 'ui-checkbox-list-popup',
					width: 997,
					maxWidth: Math.round(innerWidth * 0.9),
					overlay: true,
					autoHide: true,
					minHeight: 200,
					maxHeight: Math.round(innerHeight * 0.9),
					borderRadius: 20,
					contentPadding: 0,
					contentBackground: 'transparent',
					animation: 'fading-slide',
					titleBar: lang.title,
					content: container,
					closeIcon: true,
					closeByEsc: true,
					// The name of the dialog has to be an explicit contract: setTitleBar() only derives
					// `aria-label` from a *string* titleBar, so a consumer passing a node leaves the modal
					// dialog nameless.
					ariaLabel: this.#getAriaLabel(),
					// An explicit trap, so the dialog keeps the focus inside even on portals where the
					// global setting for dialogs is off. Its defaults are the wanted ones: initial focus
					// goes to `[data-autofocus]` and falls back to the container, and the focus returns to
					// whatever was active on activation.
					focusTrap: true,
					...popupOptions,
					events: {
						onPopupClose: () => layoutComponent?.restoreOptionValues()
					}
				});
				const {
					compactField,
					customFooterElements,
					sections,
					categories,
					options,
					popup,
					params,
					context
				} = this;
				this.layoutApp = ui_vue3.BitrixVue.createApp(Content, {
					compactField,
					customFooterElements,
					lang,
					sections,
					categories,
					options,
					popup,
					columnCount: this.#getColumnCount(),
					params,
					context,
					dialog: this
				});

				// eslint-disable-next-line unicorn/consistent-destructuring
				this.layoutComponent = this.layoutApp.mount(container);
			}
			return this.popup;
		}
		#getAriaLabel() {
			return main_core.Type.isStringFilled(this.lang.title) ? this.lang.title : main_core.Loc.getMessage('UI_CHECKBOX_LIST_DIALOG_LABEL');
		}
		#getColumnCount() {
			let {
				columnCount
			} = this;
			const {
				innerWidth
			} = window;
			if (innerWidth <= 480) {
				columnCount = 1;
			} else if (innerWidth <= 768 && columnCount > 2) {
				columnCount = 2;
			}
			return columnCount;
		}
		show() {
			this.getPopup().show();
		}
		hide() {
			this.layoutComponent?.destroyOrClosePopup();
		}
		destroy() {
			if (!this.layoutApp) {
				return;
			}
			this.hide();
			this.layoutApp.unmount();
			this.layoutComponent = null;
			this.popup = null;
		}
		isShown() {
			return this.popup && this.popup.isShown();
		}
		getOptions() {
			return this.#getLayoutComponent().getOptions();
		}
		getSelectedOptions() {
			return this.#getLayoutComponent().getCheckedOptionsId();
		}
		handleSwitcherToggled(id) {
			return this.#getLayoutComponent().handleSwitcherToggled(id);
		}
		handleOptionToggled(id) {
			return this.#getLayoutComponent().toggleOption(id);
		}
		saveColumns(columnIds, callback) {
			if (!main_core.Type.isArrayFilled(columnIds)) {
				return;
			}
			columnIds.forEach(id => this.selectOption(id));
			this.apply();
		}
		selectOption(id, value) {
			// to maintain backward compatibility without creating dependencies on main within the ticket #187991
			// @todo remove later and set default value = true in the function signature
			if (value !== false) {
				// eslint-disable-next-line no-param-reassign
				value = true;
			}
			this.#getLayoutComponent().select(id, value);
		}
		apply() {
			this.#getLayoutComponent().apply();
		}
		#getLayoutComponent() {
			if (!this.layoutComponent) {
				void this.getPopup();
			}
			return this.layoutComponent;
		}
	}

	exports.CheckboxList = CheckboxList;

})(this.BX.UI = this.BX.UI || {}, BX, BX, BX.Event, BX.Main, window, BX.Vue3, BX.UI.Accessibility);
//# sourceMappingURL=bundle.js.map
