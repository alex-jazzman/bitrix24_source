import { ChatHint } from 'im.v2.component.elements.hint';
import { Dropdown, type DropdownItem } from 'im.v2.component.elements.dropdown';
import { Feature, FeatureManager } from 'im.v2.lib.feature';

import { FieldRow } from '../../../elements/field-row/field-row';
import { SelectInput, type SelectInputItem } from '../../../elements/select-input/select-input';

import '../css/role-selector.css';

// @vue/component
export const RoleSelector = {
	name: 'RoleSelector',
	components: { Dropdown, ChatHint, FieldRow, SelectInput },
	props:
	{
		name: {
			type: String,
			required: true,
		},
		title: {
			type: String,
			required: true,
		},
		dropdownItems: {
			type: Array,
			required: true,
		},
		dropdownId: {
			type: String,
			required: true,
		},
		hintText: {
			type: String,
			required: false,
			default: '',
		},
	},
	emits: ['itemChange'],
	computed:
	{
		isAirDesignEnabled(): boolean
		{
			return FeatureManager.isFeatureAvailable(Feature.isAirDesignEnabled);
		},
		selectItems(): SelectInputItem[]
		{
			return this.dropdownItems.map((item: DropdownItem) => {
				return { value: String(item.value), text: item.text };
			});
		},
		selectedValue(): string
		{
			const currentItem = this.dropdownItems.find((item: DropdownItem) => item.default === true);

			return currentItem ? String(currentItem.value) : '';
		},
	},
	methods:
	{
		// SelectInput works with string values, so the role goes out the way it came in.
		onItemSelect(value: string): void
		{
			const selectedItem = this.dropdownItems.find((item: DropdownItem) => String(item.value) === value);

			this.$emit('itemChange', selectedItem.value);
		},
	},
	template: `
		<FieldRow v-if="isAirDesignEnabled" :name="name" :label="title" :hint="hintText">
			<SelectInput
				:items="selectItems"
				:value="selectedValue"
				:ariaLabel="title"
				@itemChange="onItemSelect"
			/>
		</FieldRow>
		<div v-else class="bx-im-content-create-chat__section_block" :data-testid="'field-' + name">
			<div class="bx-im-content-create-chat__section-header">
				<div class="bx-im-content-create-chat__section-heading">
					{{ title }}
				</div>
				<ChatHint v-if="hintText" :text="hintText" />
			</div>
			<div class="bx-im-chat-forms-chat-settings__manage-select">
				<Dropdown
					:items="dropdownItems"
					:id="dropdownId"
					@itemChange="$emit('itemChange', $event)"
				/>
			</div>
		</div>
	`,
};
