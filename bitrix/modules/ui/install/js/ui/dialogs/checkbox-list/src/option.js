import { Loc, Text } from 'main.core';
import { EventEmitter } from 'main.core.events';

const viewMode = {
	view: 'view',
	edit: 'edit',
};

export const CheckboxListOption = {
	props: [
		'id',
		'title',
		'isChecked',
		'isLocked',
		'isEditable',
		'context',
	],

	emits: [
		'onToggleOption',
		'onEditModeChange',
	],

	setup(): Object
	{
		// Ids are generated once per component, outside the reactive state: they never change while
		// the component lives, and `option.id` cannot be used - it comes from the consumer and
		// repeats when a page holds two dialogs (a grid and a filter) at once.
		// `titleId` also names the checkbox: the wrapping label would otherwise build the name out
		// of everything inside it, the name of the rename button included.
		return {
			inputId: `ui-checkbox-list-option-${Text.getRandom().toLowerCase()}`,
			titleId: `ui-checkbox-list-option-title-${Text.getRandom().toLowerCase()}`,
			lockedStatusId: `ui-checkbox-list-option-locked-${Text.getRandom().toLowerCase()}`,
			renameHintId: `ui-checkbox-list-option-hint-${Text.getRandom().toLowerCase()}`,
		};
	},

	data()
	{
		return {
			viewMode: viewMode.view,
			titleData: this.title,
			isCheckedValue: this.isChecked,
		};
	},

	created(): void
	{
		// The value Escape restores. Non-reactive on purpose: nothing renders it.
		this.titleBeforeEdit = this.title;
	},

	methods: {
		getId(): string
		{
			return this.id;
		},
		getValue(): boolean
		{
			return this.isCheckedValue;
		},
		setValue(value: boolean): void
		{
			this.isCheckedValue = value;
		},
		getTitle(): string
		{
			return this.$refs.title?.innerText ?? this.titleData;
		},
		setTitle(title: string): void
		{
			this.titleData = title;
		},
		setStateFromProps(value: ?boolean = null): void
		{
			this.viewMode = viewMode.view;
			this.titleData = this.title;
			this.titleBeforeEdit = this.title;
			this.isCheckedValue = (value === null ? this.isChecked : value);
		},
		getOptionClassName({ isChecked, isLocked }): []
		{
			return [
				'ui-ctl',
				'ui-ctl-checkbox',
				'ui-checkbox-list__field-item_label',
				{ '--checked': isChecked },
				{ '--disabled': isLocked },
				{ '--editable': !(this.isViewMode || isLocked) },
			];
		},
		getLabelClassName(): []
		{
			return [
				'ui-ctl-label-text',
				'ui-checkbox-list__field-item_text',
				{ '--editable': (this.isEditMode && !this.isLocked) },
			];
		},
		emitHandleCheckBox(event): void
		{
			setTimeout(() => {
				const { id, title, isChecked, isLocked, isEditable, context } = this;

				EventEmitter.emit(
					'ui:checkbox-list:check-option',
					{
						id,
						title,
						isChecked,
						isLocked,
						isEditable,
						context,
						viewMode: this.viewMode,
					},
				);
			});
		},
		handleCheckBox(event): void
		{
			if (this.isLocked)
			{
				// eslint-disable-next-line no-param-reassign
				event.target.checked = !event.target.checked;
			}
			else
			{
				this.isCheckedValue = !this.isCheckedValue;
			}

			const { id, title, isLocked, isCheckedValue, isEditable, context } = this;

			this.$emit('onToggleOption', {
				id,
				title,
				isChecked: isCheckedValue,
				isLocked,
				isEditable,
				context,
				viewMode: this.viewMode,
			});
		},
		// Enter on the field is the second keyboard way into the rename mode, next to the pencil the
		// arrows reach: a shortcut on the row itself saves the step sideways. A native checkbox
		// ignores Enter - it toggles on Space - so the key is free and the two do not interfere.
		handleFieldKeydown(event): void
		{
			if (!this.canRename)
			{
				return;
			}

			event.preventDefault();
			this.onToggleViewMode(true);
		},
		onToggleViewMode(byKey: boolean = false): void
		{
			this.viewMode = this.isEditMode ? viewMode.view : viewMode.edit;

			if (this.viewMode === viewMode.view)
			{
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
		leaveEditMode(byKey: boolean = false): void
		{
			if (this.isViewMode)
			{
				return;
			}

			this.viewMode = viewMode.view;
			this.$emit('onEditModeChange', false, byKey);
		},
		confirmTitle(): void
		{
			if (!this.isEditMode)
			{
				return;
			}

			this.titleData = this.$refs.title?.innerText ?? this.titleData;
			this.leaveEditMode(true);
		},
		cancelTitle(): void
		{
			if (!this.isEditMode)
			{
				return;
			}

			this.titleData = this.titleBeforeEdit;

			if (this.$refs.title)
			{
				this.$refs.title.innerText = this.titleBeforeEdit;
			}

			this.leaveEditMode(true);
		},
		setFocusOnTitle(): void
		{
			this.$refs.title.focus();

			const range = document.createRange();
			const selection = window.getSelection();

			range.selectNodeContents(this.$refs.title);
			range.collapse(false);

			selection.removeAllRanges();
			selection.addRange(range);
		},
		onChangeTitle({ target }): void
		{
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
		onRenameMousedown(event: MouseEvent): void
		{
			if (this.isEditMode)
			{
				event.preventDefault();
			}
		},
	},

	computed: {
		isEditMode(): boolean
		{
			return this.viewMode === viewMode.edit;
		},
		isViewMode(): boolean
		{
			return this.viewMode === viewMode.view;
		},
		labelClassName(): string
		{
			return this.getLabelClassName();
		},
		// See the note in content.js: an empty phrase must not turn into an empty aria-label.
		renameLabel(): ?string
		{
			return Loc.getMessage('UI_CHECKBOX_LIST_OPTION_RENAME_LABEL', { '#TITLE#': this.titleData }) || null;
		},
		lockedStatusText(): ?string
		{
			return Loc.getMessage('UI_CHECKBOX_LIST_OPTION_LOCKED_STATUS') || null;
		},
		canRename(): boolean
		{
			return Boolean(this.isEditable) && !this.isLocked;
		},
		// A shortcut nobody is told about is half a solution, so the field itself carries the hint:
		// the reader announces it on arrival, once per field, instead of it living on every control.
		renameHintText(): ?string
		{
			return Loc.getMessage('UI_CHECKBOX_LIST_OPTION_RENAME_HINT') || null;
		},
		// The reason a field is locked and the hint about renaming never apply at once, and the
		// hint is dropped while the value is being edited - there it would describe what the user
		// is already doing. Either one points at its node only while its phrase is there: a
		// description resolving to an empty node is worse than none at all.
		fieldDescribedBy(): ?string
		{
			if (this.isLocked)
			{
				return this.lockedStatusText ? this.lockedStatusId : null;
			}

			return (this.canRename && this.isViewMode && this.renameHintText) ? this.renameHintId : null;
		},
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
	`,
};
