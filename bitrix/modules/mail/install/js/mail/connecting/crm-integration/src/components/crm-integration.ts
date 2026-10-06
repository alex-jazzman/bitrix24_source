import { defineComponent, type PropType } from 'ui.vue3';
import { Switcher } from 'ui.vue3.components.switcher';
import { SwitcherSize } from 'ui.switcher';
import { hint } from 'ui.vue3.directives.hint';
import { HeadlineSm } from 'ui.system.typography.vue';

import { BitrixSettingSelector } from './tools/bitrix-setting-selector';
import { UserSelector } from './tools/user-selector';
import { loc } from '../mixins/localization-mixin';
import { preparedIndirectPhrase } from '../mixins/prepared-indirect-phrase-mixin';
import type {
	CrmIntegrationSettingsType,
	IndirectPhraseParts,
	SettingOption,
} from '../utils/crm-integration-settings-type';

import '../css/crm-integration.css';

type CrmNoAccessHintParams = {
	text: string;
	popupOptions: {
		className: string;
		darkMode: boolean;
		offsetTop: number;
		background: string;
		padding: number;
		angle: boolean;
		targetContainer: HTMLElement;
		offsetLeft: number;
	};
};

// @vue/component
export const CrmIntegration = defineComponent({
	name: 'crm-integration',

	directives: { hint },

	components: {
		Switcher,
		BitrixSettingSelector,
		UserSelector,
		HeadlineSm,
	},

	setup()
	{
		return {
			loc,
		};
	},

	props: {
		modelValue: {
			type: Object as PropType<CrmIntegrationSettingsType>,
			required: true,
		},
		canEditCrmIntegration: {
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
		entityOptions: {
			type: Array as PropType<SettingOption[]>,
			required: true,
		},
		sourceOptions: {
			type: Array as PropType<SettingOption[]>,
			required: true,
		},
		isEditMode: {
			type: Boolean,
			default: false,
		},
		showVcfOption: {
			type: Boolean,
			default: false,
		},
		showEnableSwitcher: {
			type: Boolean,
			default: true,
		},
	},

	emits: ['update:modelValue'],

	data()
	{
		return {
			showAddressTextarea: false,
			crmLeadSourceDialogOptions: {
				width: 300,
				height: 300,
				enableSearch: true,
			} as Record<string, unknown>,
		};
	},

	computed: {
		localModelValue: {
			get(): CrmIntegrationSettingsType
			{
				return this.modelValue;
			},
			set(newValue: CrmIntegrationSettingsType): void
			{
				this.$emit('update:modelValue', newValue);
			},
		},
		syncLabel(): IndirectPhraseParts
		{
			return preparedIndirectPhrase(
				'MAIL_MASSCONNECT_FORM_SELECT_MAILBOX_SETTINGS_CRM_SYNC_LABEL',
				'#PERIOD#',
			);
		},
		incomingLabel(): IndirectPhraseParts
		{
			return preparedIndirectPhrase(
				'MAIL_MASSCONNECT_FORM_SELECT_MAILBOX_SETTINGS_CRM_INCOMING_LABEL',
				'#INCOMING#',
			);
		},
		outgoingLabel(): IndirectPhraseParts
		{
			return preparedIndirectPhrase(
				'MAIL_MASSCONNECT_FORM_SELECT_MAILBOX_SETTINGS_CRM_OUTGOING_LABEL',
				'#OUTGOING#',
			);
		},
		leadSourceIncomingLabel(): IndirectPhraseParts
		{
			return preparedIndirectPhrase(
				'MAIL_MASSCONNECT_FORM_SELECT_MAILBOX_SETTINGS_CRM_SOURCE_INCOMING_CURRENT_LABEL',
				'#INCOMING_CURRENT#',
			);
		},
		switcherOptions(): { size: string; showStateTitle: boolean; useAirDesign: boolean }
		{
			return {
				size: SwitcherSize.large,
				showStateTitle: false,
				useAirDesign: true,
			};
		},
		noAccessHintParams(): CrmNoAccessHintParams
		{
			return {
				text: loc('MAIL_MASSCONNECT_FORM_MAILBOX_SETTINGS_INTEGRATION_CRM_NO_ACCESS_HINT'),
				popupOptions: {
					className: 'mail_massconnect__integration_crm_hint',
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
		normalizedSyncPeriodOptions(): SettingOption[]
		{
			return this.syncPeriodOptions;
		},
		normalizedEntityOptions(): SettingOption[]
		{
			return this.entityOptions;
		},
		normalizedSourceOptions(): SettingOption[]
		{
			return this.sourceOptions;
		},
		controlsDisabled(): boolean
		{
			return !this.canEditCrmIntegration;
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
		<div
			class="mail_massconnect__integration-block"
			:class="{ '--disabled': !localModelValue.enabled }"
			:style="backgroundColor && localModelValue.enabled ? { background: backgroundColor } : undefined"
			data-test-id="mail_massconnect__settings_crm-integration"
		>
			<div
				class="mail_massconnect__integration-block_header"
				data-test-id="mail_massconnect__settings_crmr-integration_header"
			>
				<div class="mail_massconnect__integration-block_title_group">
					<div class="mail_massconnect__integration-block_icon --crm"></div>
					<HeadlineSm>{{ loc('MAIL_MASSCONNECT_FORM_MAILBOX_SETTINGS_INTEGRATION_CRM_TITLE') }}</HeadlineSm>
				</div>
				<div
					v-if="showEnableSwitcher"
					class="mail_massconnect__integration-block_switcher-container"
					data-test-id="mail_massconnect__settings_crm-integration_switcher"
				>
					<Switcher
						:isChecked="localModelValue.enabled"
						:isDisabled="controlsDisabled"
						:options="switcherOptions"
						v-hint="controlsDisabled ? noAccessHintParams : undefined"
						@click="handleSwitcherClick"
						data-test-id="mail_massconnect__settings_crm-integration_switcher-control"
					/>
				</div>
			</div>
			<transition name="mail_massconnect__integration-block_slide-down">
				<div v-if="localModelValue.enabled" class="mail_massconnect__integration-block_content-wrapper">
					<div class="mail_massconnect__integration-block_content">
						<div v-if="!isEditMode" class="mail_massconnect__checkbox-group">
							<input
								type="checkbox"
								id="mail_massconnect__crm-sync"
								v-model="localModelValue.sync.enabled"
								:disabled="controlsDisabled"
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
									:options="normalizedSyncPeriodOptions"
									:disabled="controlsDisabled"
									data-test-id="mail_massconnect__settings_crm-integration_crm-sync-period_selector"
								/>
								<label for="mail_massconnect__crm-sync">
									<span class="mail_massconnect__label-text_after">
										{{ syncLabel.afterText }}
									</span>
								</label>
							</div>
						</div>
						<div v-if="!isEditMode" class="mail_massconnect__integration-hint">
							{{ loc('MAIL_MASSCONNECT_FORM_SELECT_MAILBOX_SETTINGS_CRM_SYNC_HINT') }}
						</div>
						<div class="mail_massconnect__checkbox-group">
							<input
								type="checkbox"
								id="mail_massconnect__assign-known"
								v-model="localModelValue.assignKnownClientEmails"
								:disabled="controlsDisabled"
								data-test-id="mail_massconnect__settings_crm-integration_assign-known_checkbox"
							/>
							<label for="mail_massconnect__assign-known">
								<span class="mail_massconnect__label-text">
									{{ loc('MAIL_MASSCONNECT_FORM_SELECT_MAILBOX_SETTINGS_CRM_ASSIGN_KNOWN_LABEL') }}
								</span>
							</label>
						</div>
						<div v-if="showVcfOption" class="mail_massconnect__checkbox-group">
							<input
								type="checkbox"
								id="mail_massconnect__crm-vcf"
								v-model="localModelValue.vcf"
								:disabled="controlsDisabled"
								data-test-id="mail_massconnect__settings_crm-integration_vcf_checkbox"
							/>
							<label for="mail_massconnect__crm-vcf">
								<span class="mail_massconnect__label-text">
									{{ loc('MAIL_MASSCONNECT_FORM_SELECT_MAILBOX_SETTINGS_CRM_VCF_LABEL') }}
								</span>
							</label>
						</div>
						<div class="mail_massconnect__checkbox-group">
							<input
								type="checkbox"
								id="mail_massconnect__incoming-new"
								v-model="localModelValue.incoming.enabled"
								:disabled="controlsDisabled"
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
									:options="normalizedEntityOptions"
									:disabled="controlsDisabled"
									data-test-id="mail_massconnect__settings_crm-integration_incoming-new-action_selector"
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
								:disabled="controlsDisabled"
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
									:options="normalizedEntityOptions"
									:disabled="controlsDisabled"
									data-test-id="mail_massconnect__settings_crm-integration_outgoing-new-action_selector"
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
								:options="normalizedSourceOptions"
								:dialog-options="crmLeadSourceDialogOptions"
								:disabled="controlsDisabled"
								data-test-id="mail_massconnect__settings_crm-integration_source_selector"
							/>
						</div>

						<span class="mail_massconnect__group-inline_label">
							<span class="mail_massconnect__label-text_before">
								{{ leadSourceIncomingLabel.beforeText }}
							</span>
							<a
								href="#"
								class="mail_massconnect__set-textarea-show"
								:style="controlsDisabled ? { pointerEvents: 'none', opacity: 0.65 } : null"
								@click.prevent="!controlsDisabled && (showAddressTextarea = !showAddressTextarea)"
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
						<transition name="mail_massconnect__integration-block_slide-down">
							<textarea
								v-if="showAddressTextarea"
								v-model="localModelValue.leadCreationAddresses"
								class="mail_massconnect__control-textarea"
								:placeholder="loc('MAIL_MASSCONNECT_FORM_SELECT_MAILBOX_SETTINGS_CRM_SOURCE_INCOMING_CURRENT_PLACEHOLDER')"
								:disabled="controlsDisabled"
								data-test-id="mail_massconnect__settings_address-textarea"
							>
							</textarea>
						</transition>
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
								:disabled="controlsDisabled"
								data-test-id="mail_massconnect__settings_crm-user-queue_selector"
							/>
						</div>
					</div>
				</div>
			</transition>
		</div>
	`,
});
