import { defineComponent, type PropType } from 'ui.vue3';
import { locMixin } from 'ui.vue3.mixins.loc-mixin';

import { CrmSettingsHubSettingField } from '../setting-field/setting-field';
import { CrmSettingsHubSettingRow } from '../setting-row/setting-row';
import {
	type RuntimeSettingState,
	type RuntimeSettingsStateContext,
	useSettingsStateContext,
} from '../../context/settings-state';
import { type SettingId } from '../../model/types';

type TextSettingViewSetup = {
	settingsStateContext: RuntimeSettingsStateContext,
};

export const CrmSettingsHubTextSettingView = defineComponent({
	name: 'CrmSettingsHubTextSettingView',
	components: {
		CrmSettingsHubSettingField,
		CrmSettingsHubSettingRow,
	},
	mixins: [locMixin],
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
	setup(): TextSettingViewSetup
	{
		return { settingsStateContext: useSettingsStateContext() };
	},
	data(): { draft: string, draftActive: boolean, validationError: boolean }
	{
		return { draft: '', draftActive: false, validationError: false };
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
		displayValue(): string
		{
			return this.draftActive ? this.draft : (this.state.label ?? '');
		},
		placeholder(): string
		{
			return this.loc('CRM_SETTINGS_HUB_VALUE_EMPTY');
		},
		titleId(): string
		{
			return `crm-settings-hub-application-setting-${this.settingId}-title`;
		},
		errorId(): string
		{
			return `crm-settings-hub-application-setting-${this.settingId}-error`;
		},
		isDisabled(): boolean
		{
			return this.state.canEdit !== true || this.settingsStateContext.isPending(this.settingId);
		},
		inputType(): string
		{
			return this.state.schema?.type === 'integer' ? 'number' : 'text';
		},
		integerMin(): number | undefined
		{
			return this.state.schema?.type === 'integer' ? this.state.schema.min ?? undefined : undefined;
		},
		integerMax(): number | undefined
		{
			return this.state.schema?.type === 'integer' ? this.state.schema.max ?? undefined : undefined;
		},
		integerStep(): number | undefined
		{
			return this.state.schema?.type === 'integer' ? this.state.schema.step : undefined;
		},
	},
	methods: {
		updateDraft(value: string): void
		{
			if (this.isDisabled)
			{
				return;
			}

			this.draft = value;
			this.draftActive = true;
			this.validationError = false;
		},
		commitDraft(): void
		{
			if (this.isDisabled || !this.draftActive)
			{
				return;
			}

			const { schema } = this.state;
			if (schema?.type === 'string')
			{
				this.saveValue(this.draft);

				return;
			}

			if (schema?.type !== 'integer')
			{
				return;
			}

			const normalizedDraft = this.draft.trim();
			if (!/^-?\d+$/.test(normalizedDraft))
			{
				this.validationError = true;

				return;
			}

			const value = Number(normalizedDraft);
			const min = schema.min ?? Number.MIN_SAFE_INTEGER;
			const max = schema.max ?? Number.MAX_SAFE_INTEGER;
			const stepBase = schema.min ?? 0;
			if (
				Number.isSafeInteger(value)
				&& value >= min
				&& value <= max
				&& (value - stepBase) % schema.step === 0
			)
			{
				this.saveValue(value);

				return;
			}

			this.validationError = true;
		},
		saveValue(value: string | number): void
		{
			this.draftActive = false;
			this.validationError = false;
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
				<template #value>
					<div
						class="crm-settings-hub-application__setting-field-value"
						:data-testid="'crm-settings-hub-application-setting-' + settingId + '-input'"
					>
						<div
							class="ui-system-input --l --stretched"
							:class="{ '--disabled': isDisabled, '--error': validationError }"
						>
							<div class="ui-system-input-container">
								<input
									class="ui-system-input-value"
									:value="displayValue"
									:placeholder="placeholder"
									:aria-label="displayTitle"
									:aria-invalid="validationError ? 'true' : null"
									:aria-describedby="validationError ? errorId : null"
									:disabled="isDisabled"
									:type="inputType"
									:min="integerMin"
									:max="integerMax"
									:step="integerStep"
									@click.stop
									@keydown.enter.stop.prevent="commitDraft"
									@input="updateDraft($event.target.value)"
									@blur="commitDraft"
								>
							</div>
							<div
								v-if="validationError"
								:id="errorId"
								class="ui-system-input-label --error"
								role="alert"
							>
								{{ loc('CRM_SETTINGS_HUB_INVALID_INTEGER') }}
							</div>
						</div>
					</div>
				</template>
			</CrmSettingsHubSettingField>
		</CrmSettingsHubSettingRow>
	`,
});
