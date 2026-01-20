import { Event, Type } from 'main.core';
import { Outline } from 'ui.icon-set.api.core';
import { AirButtonStyle, Button as UiButton, ButtonSize } from 'ui.vue3.components.button';
import { MenuButton } from '../../../../shared/ui';
import type { MenuOptions, MenuItemOptions } from 'ui.vue3.components.menu';
import './template-name-input.css';

type TemplateNameInputData = {
	isEditing: boolean,
	editedTitle: string,
};

// @vue/component
export const TemplateNameInput = {
	name: 'TemplateNameInput',
	components:
	{
		UiButton,
		MenuButton,
	},
	props:
	{
		title:
		{
			type: String,
			default: '',
		},
		/** @type MenuOptions */
		dropdownOptions:
		{
			type: [Object],
			default: () => ({}),
		},
	},
	emits: ['update:title'],
	setup(): Object
	{
		return {
			ButtonSize,
			AirButtonStyle,
			Outline,
			Type,
		};
	},
	data(): TemplateNameInputData
	{
		return {
			isEditing: false,
			editedTitle: this.title,
		};
	},
	computed:
	{
		preparedOptions(): MenuOptions
		{
			const options = this.dropdownOptions;
			const items = Type.isArrayFilled(options.items) ? options.items : [];
			const preparedItems = Type.isArrayFilled(items)
				? this.prepareItems(items)
				: items;

			return {
				...options,
				items: [
					this.getEditingMenuItems(),
					...preparedItems,
				],
			};
		},
	},
	watch: {
		isEditing(isEditing: boolean): void
		{
			if (isEditing)
			{
				Event.bind(document, 'click', this.onClickOutside, { capture: true });
			}
			else
			{
				Event.unbind(document, 'click', this.onClickOutside, { capture: true });
			}
		},
	},
	methods:
	{
		getEditingMenuItems(): MenuItemOptions
		{
			return {
				title: this.$Bitrix.Loc.getMessage('BIZPROCDESIGNER_EDITOR_TOP_PANEL_TITLE_ACTION_CHANGE'),
				icon: Outline.EDIT_M,
				onClick: this.onStartEditing,
			};
		},
		onStartEditing(): void
		{
			this.isEditing = true;
			this.editedTitle = this.title;

			this.$nextTick(() => {
				this.$refs?.editInput?.focus();
			});
		},
		onSaveTitle(): void
		{
			this.$emit('update:title', this.editedTitle);
			this.isEditing = false;
		},
		onCancelEditing(): void
		{
			this.isEditing = false;
		},
		prepareItems(items: Array): Array<MenuItemOptions>
		{
			return items.map((item) => {
				if (Type.isString(item.onClick) && Type.isFunction(this[item.onClick]))
				{
					return {
						...item,
						onClick: this[item.onClick].bind(this),
					};
				}

				return item;
			});
		},
		onClickOutside(event: MouseEvent): void
		{
			if (!this.$el.contains(event.target))
			{
				this.onCancelEditing();
			}
		},
	},
	template: `
		<div
			v-if="!isEditing"
			class="ui-top-panel-editable-title-box"
		>
			<div class="ui-top-panel-editable-title">
				<span @click="onStartEditing">{{ title }}</span>
			</div>
			<MenuButton
				:options="preparedOptions"
				:icon="Outline.CHEVRON_DOWN_M"
				:buttonStyle="AirButtonStyle.PLAIN_NO_ACCENT"
			/>
		</div>
		<div
			v-else
			class="ui-top-panel-editable-title-edit-box"
		>
			<input
				v-model="editedTitle"
				ref="editInput"
				class="ui-top-panel-editable-title-edit-input"
			/>
			<div class="ui-top-panel-editable-title-edit-buttons">
				<UiButton
					:leftIcon="Outline.CHECK_M"
					:size="ButtonSize.EXTRA_EXTRA_SMALL"
					@click="onSaveTitle"
				/>
				<UiButton
					:leftIcon="Outline.CROSS_L"
					:size="ButtonSize.EXTRA_EXTRA_SMALL"
					:style="AirButtonStyle.OUTLINE"
					@click="onCancelEditing"
				/>
			</div>
		</div>
	`,
};
