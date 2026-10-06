/* eslint-disable */
this.BX = this.BX || {};
this.BX.Mail = this.BX.Mail || {};
this.BX.Mail.Connecting = this.BX.Mail.Connecting || {};
(function (exports, ui_vue3, ui_vue3_components_switcher, ui_switcher, ui_vue3_directives_hint, ui_system_typography_vue, mail_settingSelector, ui_entitySelector, main_core) {
	'use strict';

	const BitrixSettingSelector = ui_vue3.defineComponent({
		name: 'crm-bitrix-setting-selector',
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
			},
			disabled: {
				type: Boolean,
				default: false
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
				if (this.disabled) {
					return;
				}
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
		template: `
		<div
			:data-test-id="dataTestId"
			:style="disabled ? { pointerEvents: 'none', opacity: 0.65 } : null"
		></div>
	`
	});

	function resolvePopupTargetContainer(element) {
		return element?.closest('.side-panel-content-container, .ui-slider-content-box') ?? document.body;
	}
	const UserSelector = ui_vue3.defineComponent({
		name: 'crm-user-selector',
		props: {
			modelValue: {
				type: Array,
				default: () => []
			},
			dataTestId: {
				type: String,
				default: ''
			},
			disabled: {
				type: Boolean,
				default: false
			}
		},
		emits: ['update:modelValue'],
		data() {
			return {
				selectorInstance: null
			};
		},
		watch: {
			modelValue(newValue) {
				if (!this.selectorInstance) {
					return;
				}
				const newItemsSet = new Set(newValue.map(item => `${item.entityId}:${item.id}`));
				const currentTags = this.selectorInstance.getTags();
				const currentTagsSet = new Set(currentTags.map(tag => `${tag.getEntityId()}:${tag.getId()}`));
				currentTags.forEach(tag => {
					const tagId = `${tag.getEntityId()}:${tag.getId()}`;
					if (!newItemsSet.has(tagId)) {
						this.selectorInstance?.removeTag(tag);
					}
				});
				newValue.forEach(item => {
					const itemId = `${item.entityId}:${item.id}`;
					if (!currentTagsSet.has(itemId)) {
						this.selectorInstance?.addTag({
							id: item.id,
							entityId: item.entityId,
							title: item.name
						});
					}
				});
			}
		},
		mounted() {
			const selectorContainer = this.$refs.selectorContainer;
			this.selectorInstance = ui_vue3.markRaw(new ui_entitySelector.TagSelector({
				multiple: true,
				dialogOptions: {
					width: 425,
					height: 320,
					targetNode: selectorContainer,
					autoHideHandler: event => {
						const outerContainer = this.selectorInstance?.getOuterContainer();
						const target = event.target;
						if (target instanceof Node && outerContainer?.contains(target)) {
							return false;
						}
						return true;
					},
					popupOptions: {
						targetContainer: resolvePopupTargetContainer(selectorContainer)
					},
					context: 'MAIL_CRM_QUEUE',
					preselectedItems: this.modelValue.map(item => [item.entityId, item.id]),
					entities: [{
						id: 'user',
						options: {
							intranetUsersOnly: true,
							emailUsers: false,
							inviteEmployeeLink: false
						}
					}, {
						id: 'department',
						options: {
							selectMode: 'departmentsOnly'
						}
					}]
				},
				events: {
					onAfterTagAdd: this.onUpdate,
					onAfterTagRemove: this.onUpdate
				}
			}));
			this.selectorInstance.renderTo(selectorContainer);
			const dialog = this.selectorInstance.getDialog();
			if (dialog) {
				this.selectorInstance.subscribe('onContainerClick', () => {
					if (!dialog.isOpen()) {
						dialog.show();
					}
				});
			}
		},
		beforeUnmount() {
			const dialog = this.selectorInstance?.getDialog();
			if (dialog) {
				dialog.destroy();
			}
		},
		methods: {
			onUpdate() {
				if (!this.selectorInstance || this.disabled) {
					return;
				}
				const selectedItems = this.selectorInstance.getTags().map(tag => ({
					id: tag.getId(),
					entityId: tag.getEntityId(),
					name: tag.getTitle()
				}));
				this.$emit('update:modelValue', selectedItems);
			}
		},
		template: `
		<div
			:data-test-id="dataTestId"
			:style="disabled ? { pointerEvents: 'none', opacity: 0.65 } : null"
		>
			<div ref="selectorContainer"></div>
		</div>
	`
	});

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

	const CrmIntegration = ui_vue3.defineComponent({
		name: 'crm-integration',
		directives: {
			hint: ui_vue3_directives_hint.hint
		},
		components: {
			Switcher: ui_vue3_components_switcher.Switcher,
			BitrixSettingSelector,
			UserSelector,
			HeadlineSm: ui_system_typography_vue.HeadlineSm
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
			canEditCrmIntegration: {
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
			},
			entityOptions: {
				type: Array,
				required: true
			},
			sourceOptions: {
				type: Array,
				required: true
			},
			isEditMode: {
				type: Boolean,
				default: false
			},
			showVcfOption: {
				type: Boolean,
				default: false
			},
			showEnableSwitcher: {
				type: Boolean,
				default: true
			}
		},
		emits: ['update:modelValue'],
		data() {
			return {
				showAddressTextarea: false,
				crmLeadSourceDialogOptions: {
					width: 300,
					height: 300,
					enableSearch: true
				}
			};
		},
		computed: {
			localModelValue: {
				get() {
					return this.modelValue;
				},
				set(newValue) {
					this.$emit('update:modelValue', newValue);
				}
			},
			syncLabel() {
				return preparedIndirectPhrase('MAIL_MASSCONNECT_FORM_SELECT_MAILBOX_SETTINGS_CRM_SYNC_LABEL', '#PERIOD#');
			},
			incomingLabel() {
				return preparedIndirectPhrase('MAIL_MASSCONNECT_FORM_SELECT_MAILBOX_SETTINGS_CRM_INCOMING_LABEL', '#INCOMING#');
			},
			outgoingLabel() {
				return preparedIndirectPhrase('MAIL_MASSCONNECT_FORM_SELECT_MAILBOX_SETTINGS_CRM_OUTGOING_LABEL', '#OUTGOING#');
			},
			leadSourceIncomingLabel() {
				return preparedIndirectPhrase('MAIL_MASSCONNECT_FORM_SELECT_MAILBOX_SETTINGS_CRM_SOURCE_INCOMING_CURRENT_LABEL', '#INCOMING_CURRENT#');
			},
			switcherOptions() {
				return {
					size: ui_switcher.SwitcherSize.large,
					showStateTitle: false,
					useAirDesign: true
				};
			},
			noAccessHintParams() {
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
						offsetLeft: 20
					}
				};
			},
			normalizedSyncPeriodOptions() {
				return this.syncPeriodOptions;
			},
			normalizedEntityOptions() {
				return this.entityOptions;
			},
			normalizedSourceOptions() {
				return this.sourceOptions;
			},
			controlsDisabled() {
				return !this.canEditCrmIntegration;
			}
		},
		methods: {
			handleSwitcherClick() {
				if (this.canEditCrmIntegration) {
					this.localModelValue.enabled = !this.localModelValue.enabled;
				}
			}
		},
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
	`
	});

	exports.BitrixSettingSelector = BitrixSettingSelector;
	exports.CrmIntegration = CrmIntegration;
	exports.UserSelector = UserSelector;

})(this.BX.Mail.Connecting.CrmIntegration = this.BX.Mail.Connecting.CrmIntegration || {}, BX.Vue3, BX.UI.Vue3.Components, BX.UI, BX.Vue3.Directives, BX.UI.System.Typography.Vue, BX.Mail, BX.UI.EntitySelector, BX);
//# sourceMappingURL=crm-integration.bundle.js.map
