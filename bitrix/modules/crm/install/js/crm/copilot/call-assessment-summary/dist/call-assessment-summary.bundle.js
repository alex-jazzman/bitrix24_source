/* eslint-disable */
this.BX = this.BX || {};
this.BX.Crm = this.BX.Crm || {};
(function (exports, main_core, ui_vue3, ui_designTokens_air, ui_entitySelector, ui_vue3_components_switcher, ui_system_typography_vue, ui_system_input_vue, ui_system_chip_vue, ui_vue3_components_button) {
	'use strict';

	const SAVE_AJAX_ACTION = 'crm.copilot.callassessmentsummary.saveSettings';
	const ENTITY_SELECTOR_CONTEXT = 'CRM_CALL_ASSESSMENT_SUMMARY_RECIPIENTS';
	const SITUATIONS_WITH_THRESHOLD_IN_UI = Object.freeze(['badStreak', 'goodStreak']);
	const SITUATION_DEFAULT_THRESHOLDS = Object.freeze({
		badStreak: 3,
		goodStreak: 5,
		ratingDropped: 30,
		ratingRaised: 70
	});
	const SITUATION_THRESHOLD_BOUNDS = Object.freeze({
		badStreak: {
			min: 1,
			max: 20
		},
		goodStreak: {
			min: 1,
			max: 20
		},
		ratingDropped: {
			min: 0,
			max: 100
		},
		ratingRaised: {
			min: 0,
			max: 100
		}
	});
	const SITUATIONS_CONFIG = Object.freeze([{
		code: 'badStreak',
		titleCode: 'CRM_COPILOT_SUMMARY_SITUATION_BADSTREAK_TITLE',
		descriptionCode: 'CRM_COPILOT_SUMMARY_SITUATION_BADSTREAK_DESCRIPTION',
		thresholdCode: 'CRM_COPILOT_SUMMARY_SITUATION_BADSTREAK_THRESHOLD'
	}, {
		code: 'goodStreak',
		titleCode: 'CRM_COPILOT_SUMMARY_SITUATION_GOODSTREAK_TITLE',
		descriptionCode: 'CRM_COPILOT_SUMMARY_SITUATION_GOODSTREAK_DESCRIPTION',
		thresholdCode: 'CRM_COPILOT_SUMMARY_SITUATION_GOODSTREAK_THRESHOLD'
	}, {
		code: 'ratingDropped',
		titleCode: 'CRM_COPILOT_SUMMARY_SITUATION_RATINGDROPPED_TITLE',
		descriptionCode: 'CRM_COPILOT_SUMMARY_SITUATION_RATINGDROPPED_DESCRIPTION'
	}, {
		code: 'ratingRaised',
		titleCode: 'CRM_COPILOT_SUMMARY_SITUATION_RATINGRAISED_TITLE',
		descriptionCode: 'CRM_COPILOT_SUMMARY_SITUATION_RATINGRAISED_DESCRIPTION'
	}]);
	const WEEKDAYS = Object.freeze([{
		value: 1,
		labelCode: 'CRM_COPILOT_SUMMARY_WEEKDAY_MON'
	}, {
		value: 2,
		labelCode: 'CRM_COPILOT_SUMMARY_WEEKDAY_TUE'
	}, {
		value: 3,
		labelCode: 'CRM_COPILOT_SUMMARY_WEEKDAY_WED'
	}, {
		value: 4,
		labelCode: 'CRM_COPILOT_SUMMARY_WEEKDAY_THU'
	}, {
		value: 5,
		labelCode: 'CRM_COPILOT_SUMMARY_WEEKDAY_FRI'
	}, {
		value: 6,
		labelCode: 'CRM_COPILOT_SUMMARY_WEEKDAY_SAT'
	}, {
		value: 7,
		labelCode: 'CRM_COPILOT_SUMMARY_WEEKDAY_SUN'
	}]);

	class ApiClient {
		async saveSettings(settings) {
			return main_core.ajax.runAction(SAVE_AJAX_ACTION, {
				data: {
					settings
				}
			});
		}
	}
	const apiClient = new ApiClient();

	const SITUATION_CODES = ['badStreak', 'goodStreak', 'ratingDropped', 'ratingRaised'];
	function normalizeSituations(input) {
		const result = {};
		const source = input && main_core.Type.isPlainObject(input) ? input : {};
		for (const code of SITUATION_CODES) {
			const raw = main_core.Type.isPlainObject(source[code]) ? source[code] : {};
			const fallback = SITUATION_DEFAULT_THRESHOLDS[code];
			const bounds = SITUATION_THRESHOLD_BOUNDS[code];
			const threshold = Number.parseInt(String(raw.threshold ?? fallback), 10);
			result[code] = {
				enabled: Boolean(raw.enabled ?? false),
				threshold: Number.isFinite(threshold) ? Math.min(bounds.max, Math.max(bounds.min, threshold)) : fallback
			};
		}
		return result;
	}
	const Master = ui_vue3.defineComponent({
		name: 'CrmCopilotCallAssessmentSummaryMaster',
		components: {
			Switcher: ui_vue3_components_switcher.Switcher,
			HeadlineXl: ui_system_typography_vue.HeadlineXl,
			HeadlineSm: ui_system_typography_vue.HeadlineSm,
			HeadlineXs: ui_system_typography_vue.HeadlineXs,
			TextMd: ui_system_typography_vue.TextMd,
			TextXs: ui_system_typography_vue.TextXs,
			BInput: ui_system_input_vue.BInput,
			Chip: ui_system_chip_vue.Chip,
			UiButton: ui_vue3_components_button.Button
		},
		props: {
			initialSettings: {
				type: Object,
				required: true
			},
			initialRecipients: {
				type: Array,
				default: () => []
			}
		},
		setup() {
			return {
				weekdays: WEEKDAYS,
				situationsConfig: SITUATIONS_CONFIG,
				InputSize: ui_system_input_vue.InputSize,
				ChipDesign: ui_system_chip_vue.ChipDesign,
				ChipSize: ui_system_chip_vue.ChipSize,
				AirButtonStyle: ui_vue3_components_button.AirButtonStyle,
				ButtonSize: ui_vue3_components_button.ButtonSize
			};
		},
		data() {
			const settings = this.initialSettings;
			return {
				isSaving: false,
				isEnabled: Boolean(settings.isEnabled ?? false),
				recipientUserIds: Array.isArray(settings.recipientUserIds) ? [...settings.recipientUserIds] : [],
				scheduleWeekdays: Array.isArray(settings.scheduleWeekdays) ? [...settings.scheduleWeekdays] : [],
				situations: normalizeSituations(settings.situations),
				sendSelfDigest: Boolean(settings.sendSelfDigest ?? false),
				tagSelector: null
			};
		},
		mounted() {
			this.initTagSelector();
		},
		beforeUnmount() {
			this.tagSelector = null;
		},
		methods: {
			loc(code) {
				return main_core.Loc.getMessage(code) ?? '';
			},
			hasThresholdInUi(code) {
				return SITUATIONS_WITH_THRESHOLD_IN_UI.includes(code);
			},
			thresholdBounds(code) {
				return SITUATION_THRESHOLD_BOUNDS[code];
			},
			handleThresholdInput(code, value) {
				const bounds = this.thresholdBounds(code);
				const parsed = Number.parseInt(value, 10);
				if (!Number.isFinite(parsed)) {
					return;
				}
				this.situations[code].threshold = Math.min(bounds.max, Math.max(bounds.min, parsed));
			},
			thresholdParts(messageCode) {
				const [before = '', after = ''] = this.loc(messageCode).split('#INPUT#');
				return {
					before: before.trim(),
					after: after.trim()
				};
			},
			isWeekdayOn(value) {
				return this.scheduleWeekdays.includes(value);
			},
			handleToggleWeekday(value) {
				const index = this.scheduleWeekdays.indexOf(value);
				if (index === -1) {
					this.scheduleWeekdays = [...this.scheduleWeekdays, value].sort((a, b) => a - b);
				} else {
					const next = [...this.scheduleWeekdays];
					next.splice(index, 1);
					this.scheduleWeekdays = next;
				}
			},
			initTagSelector() {
				const target = this.$refs.recipientsTarget;
				if (!target) {
					return;
				}
				this.tagSelector = ui_vue3.markRaw(new ui_entitySelector.TagSelector({
					multiple: true,
					placeholder: this.loc('CRM_COPILOT_SUMMARY_RECIPIENTS_PLACEHOLDER'),
					addButtonCaption: this.loc('CRM_COPILOT_SUMMARY_RECIPIENTS_ADD'),
					items: this.initialRecipients.map(user => ({
						entityId: 'user',
						id: String(user.id),
						title: user.name,
						...(user.avatar ? {
							avatar: user.avatar
						} : {})
					})),
					dialogOptions: {
						height: 360,
						context: ENTITY_SELECTOR_CONTEXT,
						entities: [{
							id: 'user'
						}],
						preselectedItems: this.recipientUserIds.map(id => ['user', String(id)])
					},
					events: {
						onAfterTagAdd: () => this.syncRecipientsFromSelector(),
						onAfterTagRemove: () => this.syncRecipientsFromSelector()
					}
				}));
				this.tagSelector.renderTo(target);
			},
			syncRecipientsFromSelector() {
				if (!this.tagSelector) {
					return;
				}
				this.recipientUserIds = this.tagSelector.getTags().filter(tag => tag.entityId === 'user').map(tag => Number(tag.id)).filter(id => Number.isInteger(id) && id > 0);
			},
			handleSave() {
				if (this.isSaving) {
					return;
				}
				this.isSaving = true;
				const payload = {
					isEnabled: this.isEnabled,
					recipientUserIds: [...this.recipientUserIds],
					scheduleWeekdays: [...this.scheduleWeekdays],
					situations: this.situations,
					sendSelfDigest: this.sendSelfDigest
				};
				apiClient.saveSettings(payload).then(() => {
					this.getRootWindow().BX.SidePanel.Instance.getTopSlider()?.close();
				}).catch(() => {
					this.getRootWindow().BX.UI?.Notification?.Center?.notify({
						content: this.loc('CRM_COPILOT_SUMMARY_SAVE_FAILED')
					});
				}).finally(() => {
					this.isSaving = false;
				});
			},
			handleClose() {
				this.getRootWindow().BX.SidePanel.Instance.getTopSlider()?.close();
			},
			getRootWindow() {
				return window.top ?? window;
			}
		},
		template: `
		<div class="crm-summary__card-list">

			<div class="crm-summary__header">
				<HeadlineXl class="crm-summary__header-title">{{ loc('CRM_COPILOT_CALL_ASSESSMENT_SUMMARY_TITLE') }}</HeadlineXl>
				<div class="crm-summary__header-toggle">
					<TextXs class="crm-summary__header-toggle-label">{{ loc('CRM_COPILOT_SUMMARY_ENABLED') }}</TextXs>
					<Switcher
						:is-checked="isEnabled"
						:options="{ size: 'extra-small' }"
						@check="isEnabled = true"
						@uncheck="isEnabled = false"
					/>
				</div>
			</div>

			<div class="crm-summary__card">
				<HeadlineSm class="crm-summary__card-title">{{ loc('CRM_COPILOT_SUMMARY_RECIPIENTS_TITLE') }}</HeadlineSm>
				<div class="crm-summary__card-body">
					<div ref="recipientsTarget"></div>
				</div>
			</div>

			<div class="crm-summary__card">
				<HeadlineSm class="crm-summary__card-title">{{ loc('CRM_COPILOT_SUMMARY_SCHEDULE_TITLE') }}</HeadlineSm>
				<TextXs class="crm-summary__card-description">{{ loc('CRM_COPILOT_SUMMARY_SCHEDULE_DESCRIPTION') }}</TextXs>
				<div class="crm-summary__card-body">
					<TextMd class="crm-summary__weekday-label">{{ loc('CRM_COPILOT_SUMMARY_WEEKDAY_LABEL') }}</TextMd>
					<div class="crm-summary__weekday-chips" role="group" :aria-label="loc('CRM_COPILOT_SUMMARY_WEEKDAY_LABEL')">
						<Chip
							v-for="day in weekdays"
							:key="day.value"
							:text="loc(day.labelCode)"
							:size="ChipSize.Lg"
							:design="isWeekdayOn(day.value) ? ChipDesign.Filled : ChipDesign.Outline"
							@click="handleToggleWeekday(day.value)"
						/>
					</div>
				</div>
			</div>

			<div class="crm-summary__card">
				<HeadlineSm class="crm-summary__card-title">{{ loc('CRM_COPILOT_SUMMARY_SITUATIONS_TITLE') }}</HeadlineSm>
				<div class="crm-summary__card-body">
					<div
						v-for="item in situationsConfig"
						:key="item.code"
						class="crm-summary__situation"
					>
						<div class="crm-summary__situation-toggle">
							<Switcher
								:is-checked="situations[item.code].enabled"
								:options="{ size: 'extra-small' }"
								@check="situations[item.code].enabled = true"
								@uncheck="situations[item.code].enabled = false"
							/>
						</div>
						<div class="crm-summary__situation-body">
							<HeadlineXs accent class="crm-summary__situation-title">{{ loc(item.titleCode) }}</HeadlineXs>
							<TextXs class="crm-summary__situation-description">{{ loc(item.descriptionCode) }}</TextXs>
							<div v-if="hasThresholdInUi(item.code) && item.thresholdCode" class="crm-summary__threshold-row">
								<TextXs class="crm-summary__threshold-text">{{ thresholdParts(item.thresholdCode).before }}</TextXs>
								<BInput
									:size="InputSize.Sm"
									center
									class="crm-summary__threshold-input"
									:model-value="String(situations[item.code].threshold)"
									@update:modelValue="(value) => handleThresholdInput(item.code, value)"
								/>
								<TextXs class="crm-summary__threshold-text">{{ thresholdParts(item.thresholdCode).after }}</TextXs>
							</div>
						</div>
					</div>
				</div>
			</div>

			<div class="crm-summary__card">
				<HeadlineSm class="crm-summary__card-title">{{ loc('CRM_COPILOT_SUMMARY_SELF_DIGEST_TITLE') }}</HeadlineSm>
				<div class="crm-summary__card-body crm-summary__inline-row">
					<Switcher
						:is-checked="sendSelfDigest"
						:options="{ size: 'extra-small' }"
						@check="sendSelfDigest = true"
						@uncheck="sendSelfDigest = false"
					/>
					<TextMd>{{ loc('CRM_COPILOT_SUMMARY_SELF_DIGEST_LABEL') }}</TextMd>
				</div>
			</div>

		</div>

		<div class="crm-summary-footer">
			<UiButton
				:text="loc('CRM_COPILOT_SUMMARY_ACTION_SAVE')"
				:style="AirButtonStyle.FILLED"
				:size="ButtonSize.MEDIUM"
				:loading="isSaving"
				@click="handleSave"
			/>
			<UiButton
				:text="loc('CRM_COPILOT_SUMMARY_ACTION_CANCEL')"
				:style="AirButtonStyle.PLAIN_ACCENT"
				:size="ButtonSize.MEDIUM"
				:disabled="isSaving"
				@click="handleClose"
			/>
		</div>
	`
	});

	class CallAssessmentSummary {
		#container;
		#app = null;
		constructor(containerId, params) {
			const container = document.getElementById(containerId);
			if (!main_core.Type.isDomNode(container)) {
				throw new Error(`CallAssessmentSummary: container "${containerId}" not found`);
			}
			this.#container = container;
			this.#app = ui_vue3.BitrixVue.createApp(Master, {
				initialSettings: params.settings,
				initialRecipients: Array.isArray(params.recipients) ? params.recipients : []
			});
			this.#app.mount(this.#container);
		}
	}

	exports.CallAssessmentSummary = CallAssessmentSummary;

})(this.BX.Crm.Copilot = this.BX.Crm.Copilot || {}, BX, BX.Vue3, window, BX.UI.EntitySelector, BX.UI.Vue3.Components, BX.UI.System.Typography.Vue, BX.UI.System.Input.Vue, BX.UI.System.Chip.Vue, BX.Vue3.Components);
//# sourceMappingURL=call-assessment-summary.bundle.js.map
