import { defineComponent, type PropType } from 'ui.vue3';

import { loc } from '../mixins/localization-mixin';
import { preparedIndirectPhrase } from '../mixins/prepared-indirect-phrase-mixin';
import { BitrixSettingSelector } from './tools/bitrix-setting-selector';
import type {
	IndirectPhraseParts,
	MailIntegrationSettingsType,
	SettingOption,
} from '../utils/mail-integration-settings-type';
import '../css/mail-sync-settings.css';

// @vue/component
export const MailIntegration = defineComponent({
	name: 'mail-integration',

	components: {
		BitrixSettingSelector,
	},

	setup()
	{
		return {
			loc,
		};
	},

	props: {
		modelValue: {
			type: Object as PropType<MailIntegrationSettingsType>,
			required: true,
		},
		compact: {
			type: Boolean,
			default: false,
		},
		backgroundColor: {
			type: String,
			default: '',
		},
		syncPeriodOptions: {
			type: Array as PropType<SettingOption[]>,
			required: true,
		},
	},

	emits: ['update:modelValue'],

	computed: {
		syncLabel(): IndirectPhraseParts
		{
			return preparedIndirectPhrase('MAIL_MASSCONNECT_FORM_SELECT_MAILBOX_SETTINGS_MAIL_SYNC_LABEL', '#PERIOD#');
		},
		normalizedSyncPeriodOptions(): SettingOption[]
		{
			return this.syncPeriodOptions;
		},
	},

	methods: {
		handleSyncEnabledChange(event: Event): void
		{
			const target = event.target as HTMLInputElement | null;
			this.updateSyncModel(Boolean(target?.checked), this.modelValue.sync.periodValue);
		},
		handleSyncPeriodChange(periodValue: string | number): void
		{
			this.updateSyncModel(this.modelValue.sync.enabled, String(periodValue));
		},
		updateSyncModel(enabled: boolean, periodValue: string): void
		{
			this.$emit('update:modelValue', {
				sync: {
					...this.modelValue.sync,
					enabled,
					periodValue,
				},
			});
		},
	},

	// language=Vue
	template: `
		<div v-if="compact" class="mail_massconnect__checkbox-group">
			<input
				type="checkbox"
				id="mail_massconnect__mail-sync"
				:checked="modelValue.sync.enabled"
				@change="handleSyncEnabledChange"
				data-test-id="mail_massconnect__mail-sync_checkbox"
			/>
			<div
				class="mail_massconnect__indirect-label"
				data-test-id="mail_massconnect__mail-sync_label"
			>
				<label for="mail_massconnect__mail-sync">
					<span class="mail_massconnect__label-text_before">
						{{ syncLabel.beforeText }}
					</span>
				</label>
				<BitrixSettingSelector
					:model-value="modelValue.sync.periodValue"
					@update:model-value="handleSyncPeriodChange"
					:options="normalizedSyncPeriodOptions"
					data-test-id="mail_massconnect__mail-sync-period_selector"
				/>
				<label for="mail_massconnect__mail-sync">
					<span class="mail_massconnect__label-text_after">
						{{ syncLabel.afterText }}
					</span>
				</label>
			</div>
		</div>
		<div
			v-else
			class="mail_massconnect__integration-block"
			:style="backgroundColor ? { background: backgroundColor } : undefined"
		>
			<div class="mail_massconnect__integration-block_header">
				<div class="mail_massconnect__integration-block_title_group">
					<div class="mail_massconnect__integration-block_icon --mail"></div>
					<span class="mail_massconnect__integration-block_title">
						{{ loc('MAIL_MASSCONNECT_FORM_MAILBOX_SETTINGS_INTEGRATION_MAIL_TITLE') }}
					</span>
				</div>
			</div>
			<div class="mail_massconnect__integration-block_content-wrapper">
				<div class="mail_massconnect__integration-block_content">
					<div class="mail_massconnect__checkbox-group">
						<input
							type="checkbox"
							id="mail_massconnect__mail-sync"
							:checked="modelValue.sync.enabled"
							@change="handleSyncEnabledChange"
							data-test-id="mail_massconnect__mail-sync_checkbox"
						/>
						<div
							class="mail_massconnect__indirect-label"
							data-test-id="mail_massconnect__mail-sync_label"
						>
							<label for="mail_massconnect__mail-sync">
								<span class="mail_massconnect__label-text_before">
									{{ syncLabel.beforeText }}
								</span>
							</label>
							<BitrixSettingSelector
								:model-value="modelValue.sync.periodValue"
								@update:model-value="handleSyncPeriodChange"
								:options="normalizedSyncPeriodOptions"
								data-test-id="mail_massconnect__mail-sync-period_selector"
							/>
							<label for="mail_massconnect__mail-sync">
								<span class="mail_massconnect__label-text_after">
									{{ syncLabel.afterText }}
								</span>
							</label>
						</div>
					</div>
				</div>
			</div>
		</div>
	`,
});
