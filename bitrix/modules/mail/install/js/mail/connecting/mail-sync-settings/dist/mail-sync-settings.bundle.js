/* eslint-disable */
this.BX = this.BX || {};
this.BX.Mail = this.BX.Mail || {};
this.BX.Mail.Connecting = this.BX.Mail.Connecting || {};
(function (exports, ui_vue3, main_core, mail_settingSelector) {
	'use strict';

	function loc(phraseCode, replacements = {}) {
		return main_core.Loc.getMessage(phraseCode, replacements) ?? '';
	}

	function preparedIndirectPhrase(phraseCode, indirectCode) {
		const phrase = main_core.Loc.getMessage(phraseCode) ?? '';
		const parts = phrase.split(indirectCode);
		return {
			beforeText: parts[0] || null,
			afterText: parts[1] || null
		};
	}

	const BitrixSettingSelector = ui_vue3.defineComponent({
		name: 'bitrix-setting-selector',
		props: {
			modelValue: {
				type: [String, Number],
				required: true
			},
			options: {
				type: Array,
				required: true
			},
			dialogOptions: {
				type: Object,
				required: false,
				default: null
			},
			dataTestId: {
				type: String,
				default: ''
			}
		},
		emits: ['update:modelValue'],
		data() {
			return {
				selectorInstance: null,
				itemOnSelectHandler: null
			};
		},
		watch: {
			modelValue(newValue) {
				if (this.selectorInstance && newValue !== this.selectorInstance.getSelected()) {
					this.selectorInstance.select(newValue);
				}
			}
		},
		mounted() {
			const settingsMap = new Map();
			this.options.forEach(option => {
				settingsMap.set(String(option.value), option.label);
			});
			const settingSelectorOptions = {
				settingsMap: Object.fromEntries(settingsMap),
				selectedOptionKey: this.modelValue
			};
			if (this.dialogOptions) {
				settingSelectorOptions.dialogOptions = this.dialogOptions;
			}
			this.selectorInstance = ui_vue3.markRaw(new mail_settingSelector.SettingSelector(settingSelectorOptions));
			this.itemOnSelectHandler = event => {
				const {
					item: selectedItem
				} = event.getData();
				this.$emit('update:modelValue', selectedItem.getId());
			};
			if (this.selectorInstance.settingDialog && this.itemOnSelectHandler) {
				this.selectorInstance.settingDialog.subscribe('Item:onSelect', this.itemOnSelectHandler);
			}
			this.selectorInstance.renderTo(this.$el);
		},
		beforeUnmount() {
			if (this.selectorInstance?.settingDialog && this.itemOnSelectHandler) {
				this.selectorInstance.settingDialog.unsubscribe('Item:onSelect', this.itemOnSelectHandler);
			}
			if (this.selectorInstance?.settingDialog) {
				this.selectorInstance.settingDialog.destroy();
			}
		},
		template: '<div :data-test-id="dataTestId"></div>'
	});

	const MailIntegration = ui_vue3.defineComponent({
		name: 'mail-integration',
		components: {
			BitrixSettingSelector
		},
		setup() {
			return {
				loc
			};
		},
		props: {
			modelValue: {
				type: Object,
				required: true
			},
			compact: {
				type: Boolean,
				default: false
			},
			backgroundColor: {
				type: String,
				default: ''
			},
			syncPeriodOptions: {
				type: Array,
				required: true
			}
		},
		emits: ['update:modelValue'],
		computed: {
			syncLabel() {
				return preparedIndirectPhrase('MAIL_MASSCONNECT_FORM_SELECT_MAILBOX_SETTINGS_MAIL_SYNC_LABEL', '#PERIOD#');
			},
			normalizedSyncPeriodOptions() {
				return this.syncPeriodOptions;
			}
		},
		methods: {
			handleSyncEnabledChange(event) {
				const target = event.target;
				this.updateSyncModel(Boolean(target?.checked), this.modelValue.sync.periodValue);
			},
			handleSyncPeriodChange(periodValue) {
				this.updateSyncModel(this.modelValue.sync.enabled, String(periodValue));
			},
			updateSyncModel(enabled, periodValue) {
				this.$emit('update:modelValue', {
					sync: {
						...this.modelValue.sync,
						enabled,
						periodValue
					}
				});
			}
		},
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
	`
	});

	exports.BitrixSettingSelector = BitrixSettingSelector;
	exports.MailIntegration = MailIntegration;

})(this.BX.Mail.Connecting.MailSyncSettings = this.BX.Mail.Connecting.MailSyncSettings || {}, BX.Vue3, BX, BX.Mail);
//# sourceMappingURL=mail-sync-settings.bundle.js.map
