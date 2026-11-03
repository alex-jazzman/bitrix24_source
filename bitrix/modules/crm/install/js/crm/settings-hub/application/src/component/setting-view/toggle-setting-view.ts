import { defineComponent, type PropType } from 'ui.vue3';
import { Switcher } from 'ui.vue3.components.switcher';
import { AirSwitcherStyle, SwitcherSize } from 'ui.switcher';

import { CrmSettingsHubSettingField } from '../setting-field/setting-field';
import { CrmSettingsHubSettingRow } from '../setting-row/setting-row';
import {
	type RuntimeSettingState,
	type RuntimeSettingsStateContext,
	useSettingsStateContext,
} from '../../context/settings-state';
import { type SettingId } from '../../model/types';

type ToggleSettingViewSetup = {
	AirSwitcherStyle: typeof AirSwitcherStyle,
	SwitcherSize: typeof SwitcherSize,
	settingsStateContext: RuntimeSettingsStateContext,
};

export const CrmSettingsHubToggleSettingView = defineComponent({
	name: 'CrmSettingsHubToggleSettingView',
	components: {
		CrmSettingsHubSettingField,
		CrmSettingsHubSettingRow,
		Switcher,
	},
	props: {
		settingId: {
			type: String as PropType<SettingId>,
			required: true,
		},
		title: {
			type: String,
			required: true,
		},
		description: {
			type: String,
			default: '',
		},
	},
	setup(): ToggleSettingViewSetup
	{
		return {
			AirSwitcherStyle,
			SwitcherSize,
			settingsStateContext: useSettingsStateContext(),
		};
	},
	computed: {
		state(): RuntimeSettingState
		{
			return this.settingsStateContext.get(this.settingId);
		},
		displayTitle(): string
		{
			return this.title === '' ? (this.state.title ?? '') : this.title;
		},
		displayDescription(): string
		{
			return this.description === '' ? (this.state.hint ?? '') : this.description;
		},
		isDisabled(): boolean
		{
			return this.state.canEdit !== true || this.settingsStateContext.isPending(this.settingId);
		},
		titleId(): string
		{
			return `crm-settings-hub-application-setting-${this.settingId}-title`;
		},
	},
	methods: {
		updateValue(value: boolean): void
		{
			if (this.isDisabled)
			{
				return;
			}

			void this.settingsStateContext.update(this.settingId, value);
		},
	},
	template: `
		<CrmSettingsHubSettingRow :action="null">
			<CrmSettingsHubSettingField
				:title="displayTitle"
				:title-id="titleId"
				:description="displayDescription"
				:unavailable="state.canEdit === false"
			>
				<template #control>
					<Switcher
						class="crm-settings-hub-application__setting-field-switch"
						:data-testid="'crm-settings-hub-application-setting-' + settingId + '-switcher'"
						:is-checked="state.raw === true"
						:is-disabled="isDisabled"
						:options="{
							accessible: true,
							ariaLabelledBy: titleId,
							size: SwitcherSize.medium,
							useAirDesign: true,
							style: AirSwitcherStyle.SOLID,
						}"
						@click.stop
						@keydown.stop
						@check="updateValue(true)"
						@uncheck="updateValue(false)"
					/>
				</template>
				<template #dependents><slot name="dependents"/></template>
			</CrmSettingsHubSettingField>
		</CrmSettingsHubSettingRow>
	`,
});
