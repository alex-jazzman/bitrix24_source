import { defineComponent, type PropType } from 'ui.vue3';
import { TextSm } from 'ui.system.typography.vue';
import { Type } from 'main.core';

import { type ArrayRecord } from 'crm.settings-hub';

type LinkedUserFieldMeta = {
	name: string;
	title: string;
};

// Unreachable from the designed layout: relations-layout.ts keeps LINKED_USER_FIELDS_RECORD_ID out of
// restRecords, so this record never reaches CrmHubControlRenderer and this control never mounts (see
// relations-layout.ts). Kept only as a fallback/safety net, not deleted.
//
// Form control for `linkedUserFields[]` (kind: array). Renders a checkbox per user field; its values
// live in the store as a name -> boolean map (payload shape). Master <-> children sync is
// orchestrated by the app via the pure sync lib, so this control only reads the current map and emits
// the new map. Reactive (re-renders when the store clears children on master-off).
export const CrmTypeHubLinkedUserFieldsControl = defineComponent({
	name: 'CrmTypeHubLinkedUserFieldsControl',
	components: { TextSm },
	props: {
		descriptor: {
			type: Object as PropType<ArrayRecord>,
			required: true,
		},
		snapshot: {
			type: Object as PropType<Record<string, unknown>>,
			required: true,
		},
		readOnly: {
			type: Boolean,
			default: false,
		},
		disabled: {
			type: Boolean,
			default: false,
		},
	},
	emits: ['update'],
	computed: {
		items(): LinkedUserFieldMeta[]
		{
			const meta = this.snapshot.linkedUserFieldsMeta;

			return Array.isArray(meta) ? (meta as LinkedUserFieldMeta[]) : [];
		},
		values(): Record<string, boolean>
		{
			const raw = this.snapshot[this.descriptor.itemsKey];

			return Type.isObjectLike(raw) ? (raw as Record<string, boolean>) : {};
		},
	},
	methods: {
		isChecked(name: string): boolean
		{
			return Boolean(this.values[name]);
		},
		iconClass(name: string): string
		{
			return name.includes('CALENDAR') ? 'crm-type-field-icon-type3' : 'crm-type-field-icon-type2';
		},
		handleToggle(name: string, event: Event): void
		{
			const checked = (event.target as HTMLInputElement).checked;
			this.$emit('update', { ...this.values, [name]: checked });
		},
	},
	template: `
		<div class="crm-type-hub-linked-user-fields" :class="{ '--disabled': disabled }">
			<TextSm class="crm-type-hub-linked-user-fields__title">{{ loc(descriptor.title) }}</TextSm>
			<label
				v-for="item in items"
				:key="item.name"
				class="crm-type-hub-linked-user-fields__item"
			>
				<input
					type="checkbox"
					:data-name="'linkedUserFields[' + item.name + ']'"
					:data-testid="'crm-type-detail-linked-user-field-' + item.name"
					:checked="isChecked(item.name)"
					:disabled="disabled || readOnly"
					@change="handleToggle(item.name, $event)"
				/>
				<span class="crm-type-hub-linked-user-fields__item-icon" :class="iconClass(item.name)"></span>
				<span class="crm-type-hub-linked-user-fields__item-text">{{ item.title }}</span>
			</label>
		</div>
	`,
});
