import { PrepareOptionsPhrasesMixin } from '../../mixins/prepare-options-phrases-mixin';
import { LocalizationMixin } from '../../mixins/localization-mixin';
import { PreparedIndirectPhraseMixin } from '../../mixins/prepared-indirect-phrase-mixin';
import { MailIntegrationSettingsType } from '../../utils/mail-integration-settings-type';
import { BitrixSettingSelector } from '../tools/bitrix-setting-selector';
import { MailIntegrationOptions } from '../../utils/options/mail-integration-options/component-options';
import './integrations.css';

// @vue/component
export const MailIntegration = {
	name: 'mail-integration',

	components: {
		BitrixSettingSelector,
	},

	mixins: [LocalizationMixin, PrepareOptionsPhrasesMixin, PreparedIndirectPhraseMixin],

	props: {
		/** @type MailIntegrationSettingsType */
		modelValue: {
			type: Object,
			required: true,
		},
	},

	emits: [
		'update:modelValue',
	],

	computed: {
		localModelValue: {
			get(): MailIntegrationSettingsType
			{
				return this.modelValue;
			},
			set(newValue): void
			{
				this.$emit('update:modelValue', newValue);
			},
		},
		syncLabel(): { beforeText: ?string, afterText: ?string }
		{
			return this.preparedIndirectPhrase('MAIL_MASSCONNECT_FORM_SELECT_MAILBOX_SETTINGS_MAIL_SYNC_LABEL', '#PERIOD#');
		},
		syncPeriodOptions(): Object
		{
			return this.prepareOptionPhrases(MailIntegrationOptions.syncPeriodOptions);
		},
	},

	// language=Vue
	template: `
		<div class="mail_massconnect__integration-block">
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
							v-model="localModelValue.sync.enabled"
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
								v-model="localModelValue.sync.periodValue"
								:options="syncPeriodOptions"
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
};
