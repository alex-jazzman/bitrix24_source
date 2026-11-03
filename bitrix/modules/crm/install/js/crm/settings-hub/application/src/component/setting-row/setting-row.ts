import { defineComponent, type PropType } from 'ui.vue3';
import { Type } from 'main.core';

import { isConfigTargetFollowable, type ConfigTarget } from '../../lib/config-target';
import { type SettingId } from '../../model/types';

export type MatrixSettingAction = Readonly<{
	type: 'matrix',
	settingId: SettingId,
}>;

export type SettingRowAction = ConfigTarget | MatrixSettingAction;

type ActionListeners = Readonly<{
	click: (event: MouseEvent) => void,
	keydown: (event: KeyboardEvent) => void,
}> | Record<string, never>;

export const CrmSettingsHubSettingRow = defineComponent({
	name: 'CrmSettingsHubSettingRow',
	inheritAttrs: false,
	props: {
		action: {
			type: Object as PropType<SettingRowAction | null>,
			default: null,
		},
		disabled: {
			type: Boolean,
			default: false,
		},
	},
	emits: ['activate'],
	computed: {
		actionTestId(): string | null
		{
			const rootTestId = this.$attrs['data-testid'];

			return Type.isString(rootTestId) ? `${rootTestId}-action` : null;
		},
		isFollowable(): boolean
		{
			if (this.disabled || this.action === null)
			{
				return false;
			}

			return this.action.type === 'matrix' || isConfigTargetFollowable(this.action);
		},
		actionAttributes(): Record<string, string | number>
		{
			if (this.isFollowable)
			{
				return { role: 'button', tabindex: 0 };
			}

			return this.action !== null || this.disabled ? { 'aria-disabled': 'true' } : {};
		},
		actionListeners(): ActionListeners
		{
			return this.isFollowable
				? { click: this.handleClick, keydown: this.handleKeydown }
				: {};
		},
	},
	methods: {
		handleClick(event: MouseEvent): void
		{
			if (this.isNestedControl(event))
			{
				return;
			}

			event.preventDefault();
			this.emitAction();
		},
		handleKeydown(event: KeyboardEvent): void
		{
			if (this.isNestedControl(event) || !['Enter', ' '].includes(event.key))
			{
				return;
			}

			event.preventDefault();
			this.emitAction();
		},
		isNestedControl(event: Event): boolean
		{
			const target = event.target;
			const currentTarget = event.currentTarget;
			if (!(target instanceof Element) || !(currentTarget instanceof Element) || target === currentTarget)
			{
				return false;
			}

			const control = target.closest('input, button, select, textarea, [role="switch"], .ui-system-input, .ui-switcher');

			return control !== null && currentTarget.contains(control);
		},
		emitAction(): void
		{
			if (this.action !== null)
			{
				this.$emit('activate', this.action);
			}
		},
	},
	template: `
		<div class="crm-settings-hub-application__settings-row" v-bind="$attrs">
			<div
				class="crm-settings-hub-application__settings-row-action"
				:class="{ '--followable': isFollowable }"
				:data-testid="actionTestId"
				v-bind="actionAttributes"
				v-on="actionListeners"
			>
				<slot/>
			</div>
		</div>
	`,
});
