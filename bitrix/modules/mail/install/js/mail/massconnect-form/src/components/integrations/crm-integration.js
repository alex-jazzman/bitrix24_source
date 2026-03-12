import { Switcher } from 'ui.vue3.components.switcher';
import { SwitcherSize } from 'ui.switcher';
import { hint, type HintParams } from 'ui.vue3.directives.hint';
import { CrmIntegrationSettingsType } from '../../utils/crm-integration-settings-type';
import { BitrixSettingSelector } from '../tools/bitrix-setting-selector';
import { UserSelector } from '../tools/user-selector';
import { CrmIntegrationOptions } from '../../utils/options/crm-integration-options/component-options';
import { LocalizationMixin } from '../../mixins/localization-mixin';
import { PreparedIndirectPhraseMixin } from '../../mixins/prepared-indirect-phrase-mixin';
import { PrepareOptionsPhrasesMixin } from '../../mixins/prepare-options-phrases-mixin';
import './integrations.css';

// @vue/component
export const CrmIntegration = {
	name: 'crm-integration',

	directives: { hint },

	components: {
		Switcher,
		BitrixSettingSelector,
		UserSelector,
	},

	mixins: [LocalizationMixin, PrepareOptionsPhrasesMixin, PreparedIndirectPhraseMixin],

	props: {
		/** @type CrmIntegrationSettingsType */
		modelValue: {
			type: Object,
			required: true,
		},
		canEditCrmIntegration: {
			type: Boolean,
			default: false,
		},
	},

	emits: [
		'update:modelValue',
	],

	data(): Object
	{
		return {
			showAddressTextarea: false,
			crmLeadSourceDialogOptions: CrmIntegrationOptions.crmLeadSourceDialogOptions,
		};
	},

	computed: {
		localModelValue: {
			get(): CrmIntegrationSettingsType
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
			return this.preparedIndirectPhrase('MAIL_MASSCONNECT_FORM_SELECT_MAILBOX_SETTINGS_CRM_SYNC_LABEL', '#PERIOD#');
		},
		incomingLabel(): { beforeText: ?string, afterText: ?string }
		{
			return this.preparedIndirectPhrase('MAIL_MASSCONNECT_FORM_SELECT_MAILBOX_SETTINGS_CRM_INCOMING_LABEL', '#INCOMING#');
		},
		outgoingLabel(): { beforeText: ?string, afterText: ?string }
		{
			return this.preparedIndirectPhrase('MAIL_MASSCONNECT_FORM_SELECT_MAILBOX_SETTINGS_CRM_OUTGOING_LABEL', '#OUTGOING#');
		},
		leadSourceIncomingLabel(): { beforeText: ?string, afterText: ?string }
		{
			return this.preparedIndirectPhrase('MAIL_MASSCONNECT_FORM_SELECT_MAILBOX_SETTINGS_CRM_SOURCE_INCOMING_CURRENT_LABEL', '#INCOMING_CURRENT#');
		},
		syncPeriodOptions(): Object
		{
			return this.prepareOptionPhrases(CrmIntegrationOptions.syncPeriodOptions);
		},
		createActionOptions(): Object
		{
			return this.prepareOptionPhrases(CrmIntegrationOptions.createActionOptions);
		},
		sourceOptions(): Object
		{
			return this.prepareOptionPhrases(CrmIntegrationOptions.sourceOptions);
		},
		switcherOptions(): Object
		{
			return {
				size: SwitcherSize.large,
				showStateTitle: false,
				useAirDesign: true,
			};
		},
		noAccessHintParams(): HintParams
		{
			return {
				text: this.loc('MAIL_MASSCONNECT_FORM_MAILBOX_SETTINGS_INTEGRATION_CRM_NO_ACCESS_HINT'),
				popupOptions: {
					className: 'mail_massconnect-hint',
					darkMode: false,
					offsetTop: 2,
					background: 'var(--ui-color-bg-content-inapp)',
					padding: 6,
					angle: true,
					targetContainer: document.body,
					offsetLeft: 20,
				},
			};
		},
	},

	methods: {
		handleSwitcherClick(): void
		{
			if (this.canEditCrmIntegration)
			{
				this.localModelValue.enabled = !this.localModelValue.enabled;
			}
		},
	},

	// language=Vue
	template: `
		<div class="mail_massconnect__integration-block" :class="{ '--disabled': !localModelValue.enabled }">
			<div 
				class="mail_massconnect__integration-block_header"
				data-test-id="mail_massconnect__settings_crmr-integration_header"
			>
				<div class="mail_massconnect__integration-block_title_group">
					<div class="mail_massconnect__integration-block_icon --crm"></div>
					<span class="mail_massconnect__integration-block_title">
						{{ loc('MAIL_MASSCONNECT_FORM_MAILBOX_SETTINGS_INTEGRATION_CRM_TITLE') }}
					</span>
				</div>
				<div class="mail_massconnect__integration-block_switcher-container" >
					<Switcher
						:isChecked="localModelValue.enabled"
						:isDisabled="!canEditCrmIntegration"
						:options="switcherOptions"
						v-hint="!canEditCrmIntegration ? noAccessHintParams : undefined"
						@click="handleSwitcherClick"
					/>
				</div>
			</div>
			<transition name="mail_massconnect__integration-block_slide-down">
				<div v-if="localModelValue.enabled" class="mail_massconnect__integration-block_content-wrapper">
					<div class="mail_massconnect__integration-block_content">
						<div class="mail_massconnect__checkbox-group">
							<input
								type="checkbox"
								id="mail_massconnect__crm-sync"
								v-model="localModelValue.sync.enabled"
								data-test-id="mail_massconnect__settings_crm-integration_crm-sync_checkbox"
							/>
							<div 
								class="mail_massconnect__indirect-label"
								data-test-id="mail_massconnect__settings_crm-integration_crm-sync_label"
							>
								<label for="mail_massconnect__crm-sync">
									<span class="mail_massconnect__label-text_before">
										{{ syncLabel.beforeText }}
									</span>
								</label>
								<BitrixSettingSelector
									v-model="localModelValue.sync.periodValue"
									:options="syncPeriodOptions"
								/>
								<label for="mail_massconnect__crm-sync">
									<span class="mail_massconnect__label-text_after">
										{{ syncLabel.afterText }}
									</span>
								</label>
							</div>
						</div>
						<div class="mail_massconnect__integration-hint">
							{{ loc('MAIL_MASSCONNECT_FORM_SELECT_MAILBOX_SETTINGS_CRM_SYNC_HINT') }}
						</div>
						<div class="mail_massconnect__checkbox-group">
							<input
								type="checkbox"
								id="mail_massconnect__assign-known"
								v-model="localModelValue.assignKnownClientEmails"
								data-test-id="mail_massconnect__settings_crm-integration_assign-known_checkbox"
							/>
							<label for="mail_massconnect__assign-known">
								<span class="mail_massconnect__label-text">
									{{ loc('MAIL_MASSCONNECT_FORM_SELECT_MAILBOX_SETTINGS_CRM_ASSIGN_KNOWN_LABEL') }}
								</span>
							</label>
						</div>
						<div class="mail_massconnect__checkbox-group">
							<input
								type="checkbox"
								id="mail_massconnect__incoming-new"
								v-model="localModelValue.incoming.enabled"
								data-test-id="mail_massconnect__settings_crm-integration_incoming-new_checkbox"
							/>
							<div 
								class="mail_massconnect__indirect-label"
								data-test-id="mail_massconnect__settings_crm-integration_incoming-new_label"
							>
								<label for="mail_massconnect__incoming-new">
									<span class="mail_massconnect__label-text_before">
										{{ incomingLabel.beforeText }}
									</span>
								</label>
								<BitrixSettingSelector
									v-model="localModelValue.incoming.createAction"
									:options="createActionOptions"
								/>
								<label for="mail_massconnect__incoming-new">
									<span class="mail_massconnect__label-text_after">
										{{ incomingLabel.afterText }}
									</span>
								</label>
							</div>
						</div>
						<div class="mail_massconnect__integration-hint">
							{{ loc('MAIL_MASSCONNECT_FORM_SELECT_MAILBOX_SETTINGS_CRM_INCOMING_HINT') }}
						</div>
						<div class="mail_massconnect__checkbox-group">
							<input
								type="checkbox"
								id="mail_massconnect__outgoing-new"
								v-model="localModelValue.outgoing.enabled"
								data-test-id="mail_massconnect__settings_crm-integration_outgoing-new_checkbox"
							/>
							<div 
								class="mail_massconnect__indirect-label"
								data-test-id="mail_massconnect__settings_crm-integration_outgoing-new_label"
							>
								<label for="mail_massconnect__outgoing-new">
									<span class="mail_massconnect__label-text_before">
										{{ outgoingLabel.beforeText }}
									</span>
								</label>
								<BitrixSettingSelector
									v-model="localModelValue.outgoing.createAction"
									:options="createActionOptions"
								/>
								<label for="mail_massconnect__outgoing-new">
									<span class="mail_massconnect__label-text_after">
										{{ outgoingLabel.afterText }}
									</span>
								</label>
							</div>
						</div>
						<div class="mail_massconnect__integration-hint">
							{{ loc('MAIL_MASSCONNECT_FORM_SELECT_MAILBOX_SETTINGS_CRM_OUTGOING_HINT') }}
						</div>

						<div 
							class="mail_massconnect__group-inline"
							data-test-id="mail_massconnect__settings_source_group"
						>
							<span class="mail_massconnect__group-inline_label">
								<span class="mail_massconnect__label-text">
									{{ loc('MAIL_MASSCONNECT_FORM_SELECT_MAILBOX_SETTINGS_CRM_SOURCE_LABEL') }}
								</span>
							</span>
							<BitrixSettingSelector
								v-model="localModelValue.source"
								:options="sourceOptions"
								:dialog-options="crmLeadSourceDialogOptions"
							/>
						</div>

						<span class="mail_massconnect__group-inline_label">
							<span class="mail_massconnect__label-text_before">
								{{ leadSourceIncomingLabel.beforeText }}
							</span>
							<a
								href="#"
								class="mail_massconnect__set-textarea-show"
								@click.prevent="showAddressTextarea = !showAddressTextarea"
								data-test-id="mail_massconnect__settings_show-address-textarea_link"
							>
								<span class="mail_massconnect__set-textarea-show_text">
									{{ loc('MAIL_MASSCONNECT_FORM_SELECT_MAILBOX_SETTINGS_CRM_SOURCE_INCOMING_CURRENT_BUTTON_LABEL') }}
								</span>
								<div
									class="ui-icon-set --chevron-down"
									style="--ui-icon-set__icon-size: 16px; --ui-icon-set__icon-color: #6a737f;"
								>
								</div>
							</a>
							<span class="mail_massconnect__label-text_after">
								{{ leadSourceIncomingLabel.afterText }}
							</span>
						</span>
						<textarea
							v-if="showAddressTextarea"
							v-model="localModelValue.leadCreationAddresses"
							class="mail_massconnect__control-textarea"
							:placeholder="loc('MAIL_MASSCONNECT_FORM_SELECT_MAILBOX_SETTINGS_CRM_SOURCE_INCOMING_CURRENT_PLACEHOLDER')"
							data-test-id="mail_massconnect__settings_address-textarea"
						>
						</textarea>
					</div>
					<div class="mail_massconnect__integration-block_content">
						<div 
							class="mail_massconnect__user-selector-group"
							data-test-id="mail_massconnect__settings_crm-user-queue_group"
						>
							<span class="mail_massconnect__group-inline_label">
								<span class="mail_massconnect__label_user-selector_text">
									{{ loc('MAIL_MASSCONNECT_FORM_SELECT_MAILBOX_SETTINGS_CRM_QUEUE_LABEL') }}
								</span>
							</span>
							<UserSelector
								v-model="localModelValue.responsibleQueue"
								class="mail_massconnect__control-user-selector"
							/>
						</div>
					</div>
				</div>
			</transition>
		</div>
	`,
};
