import { defineComponent, type Component, type PropType } from 'ui.vue3';

import { DefaultControlType } from '../../const/index';
import { type SettingsRecord, type ScalarRecord, type NavigationRecord } from '../../const/record';
import { resolveControl } from '../../lib/resolve-control/resolve-control';
import { resolveDisabled, type DisabledState } from '../../lib/resolve-disabled/resolve-disabled';
import { resolveDescription } from '../../lib/resolve-description/resolve-description';
import { CrmHubToggleControl } from '../control/toggle-control';
import { CrmHubFieldControl } from '../control/field-control';
import { CrmHubTextControl } from '../control/text-control';
import { CrmHubNavigationControl } from '../control/navigation-control';

const DEFAULT_CONTROLS: Record<string, Component> = {
	[DefaultControlType.Toggle]: CrmHubToggleControl,
	[DefaultControlType.Field]: CrmHubFieldControl,
	[DefaultControlType.Text]: CrmHubTextControl,
	[DefaultControlType.Navigation]: CrmHubNavigationControl,
};

export const CrmHubControlRenderer = defineComponent({
	name: 'CrmHubControlRenderer',
	props: {
		descriptor: {
			type: Object as PropType<SettingsRecord>,
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
		controls: {
			type: Object as PropType<Record<string, Component>>,
			default: null,
		},
	},
	emits: ['update', 'action'],
	computed: {
		resolvedControl(): Component | null
		{
			return resolveControl<Component>(this.descriptor.controlType, this.controls, DEFAULT_CONTROLS);
		},
		disabledState(): DisabledState
		{
			return resolveDisabled(this.descriptor, this.snapshot, this.readOnly);
		},
		isDisabled(): boolean
		{
			return this.disabledState.isDisabled;
		},
		reason(): string
		{
			return this.disabledState.reason;
		},
		description(): string
		{
			return resolveDescription(this.descriptor);
		},
		controlTestId(): string
		{
			return `crm-settings-hub-control-${this.descriptor.id}`;
		},
	},
	methods: {
		handleUpdate(value: unknown): void
		{
			this.$emit('update', {
				id: this.descriptor.id,
				valueKey: (this.descriptor as ScalarRecord).valueKey,
				value,
			});
		},
		handleAction(): void
		{
			this.$emit('action', {
				id: this.descriptor.id,
				actionKey: (this.descriptor as NavigationRecord).actionKey,
			});
		},
	},
	template: `
		<component
			:is="resolvedControl"
			v-if="resolvedControl"
			:descriptor="descriptor"
			:snapshot="snapshot"
			:read-only="readOnly"
			:disabled="isDisabled"
			:reason="reason"
			:description="description"
			:data-testid="controlTestId"
			@update="handleUpdate"
			@action="handleAction"
		/>
	`,
});
