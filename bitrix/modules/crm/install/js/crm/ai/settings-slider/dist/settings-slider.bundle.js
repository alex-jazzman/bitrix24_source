/* eslint-disable */
this.BX = this.BX || {};
this.BX.Crm = this.BX.Crm || {};
(function (exports, crm_ai_slider, main_core, ui_vue3, ui_vue3_vuex, crm_ai_nameService, crm_noticePopup, ui_system_label, ui_system_label_vue, ui_system_menu_vue, ui_notification) {
	'use strict';

	function getTopBX() {
		try {
			return window.top.BX ?? window.BX;
		} catch (error) {
			return window.BX;
		}
	}

	const DISABLED_MODE_CODE = 'disabled';
	const CALL_CHANNEL_CODE = 'call';
	const TRANSCRIPTION_SCENARIO_CODE = 'transcription';
	const TRANSCRIPTION_DEPENDENT_SCENARIO_CODES = ['summarize', 'fillFields', 'analyzeCommunication', 'callAssessment'];
	function createEmptySlider() {
		return {
			revision: '',
			scope: {
				entityTypeId: 0,
				categoryId: null,
				categoryName: null
			},
			header: {
				languageId: '',
				languageTitle: '',
				isLanguageSelectorAvailable: false
			},
			scenarios: []
		};
	}
	function normalizeSlider(slider) {
		return {
			...slider,
			scenarios: (slider.scenarios ?? []).map(scenario => ({
				...scenario,
				channels: (scenario.channels ?? []).map(channel => ({
					...channel,
					targetEnabled: channel.enabled,
					targetMode: channel.mode,
					isChanged: false
				}))
			}))
		};
	}
	function buildChannelModeOptions(channel, getMessage = main_core.Loc.getMessage) {
		return [{
			code: DISABLED_MODE_CODE,
			title: getMessage('CRM_AI_AUTOMATION_SLIDER_MODE_DISABLED') ?? DISABLED_MODE_CODE,
			enabled: false,
			mode: DISABLED_MODE_CODE
		}, ...(channel.availableModes ?? []).map(mode => ({
			code: mode,
			title: getModeTitle(channel.code, mode, getMessage),
			enabled: true,
			mode
		}))];
	}
	function formatScenarioSummary(channels, getMessage = main_core.Loc.getMessage) {
		return channels.map(channel => {
			const selectedOption = getSelectedChannelModeOption(channel, getMessage);
			return `${channel.title}: ${selectedOption.title}`;
		}).join(', ');
	}
	function getSelectedChannelModeOption(channel, getMessage = main_core.Loc.getMessage) {
		return findSelectedOption(channel, buildChannelModeOptions(channel, getMessage));
	}
	function isTranscriptionDependentCallChannel(scenarioCode, channelCode) {
		return channelCode === CALL_CHANNEL_CODE && TRANSCRIPTION_DEPENDENT_SCENARIO_CODES.includes(scenarioCode);
	}
	function collectChangedChannelSelections(scenarios) {
		return (scenarios ?? []).flatMap(scenario => (scenario.channels ?? []).filter(channel => channel.isChanged).map(channel => ({
			scenarioCode: scenario.code,
			channelCode: channel.code,
			targetEnabled: channel.targetEnabled,
			targetMode: channel.targetMode
		})));
	}
	const REASON_MESSAGE_IDS = {
		ai_not_available: 'CRM_AI_AUTOMATION_SLIDER_REASON_AI_NOT_AVAILABLE',
		global_disabled: 'CRM_AI_AUTOMATION_SLIDER_REASON_GLOBAL_DISABLED',
		engine_not_configured: 'CRM_AI_AUTOMATION_SLIDER_REASON_ENGINE_NOT_CONFIGURED',
		subscription_required: 'CRM_AI_AUTOMATION_SLIDER_REASON_SUBSCRIPTION_REQUIRED',
		invalid_scope: 'CRM_AI_AUTOMATION_SLIDER_REASON_INVALID_SCOPE',
		slider_busy: 'CRM_AI_SETTINGS_SLIDER_BUSY_ERROR'
	};
	function getAvailabilityReasonText(reasonCode, getMessage = main_core.Loc.getMessage) {
		const messageId = REASON_MESSAGE_IDS[reasonCode];
		return messageId ? getMessage(messageId, crm_ai_nameService.NameService.copilotNameReplacement()) ?? '' : '';
	}
	function normalizeSavePayload(revision, scenarios) {
		// Full snapshot: persist the override for ALL displayed channels (not only changed ones)
		// to avoid the "shown != saved != executed" drift and the legacy fallback on the backend.
		return {
			revision,
			scenarioUpdates: scenarios.map(scenario => ({
				code: scenario.code,
				channels: scenario.channels.map(channel => {
					if (typeof channel.targetEnabled !== 'boolean') {
						throw new Error('invalid_channel_state');
					}
					const mode = resolveSaveMode(channel);
					if (typeof mode !== 'string' || mode === '') {
						throw new Error('invalid_channel_mode');
					}
					return {
						code: channel.code,
						enabled: channel.isBlocked ? false : channel.targetEnabled,
						mode
					};
				})
			})).filter(update => update.channels.length > 0)
		};
	}
	function resolveSaveMode(channel) {
		if (channel.targetEnabled === false && channel.targetMode === DISABLED_MODE_CODE) {
			return resolveTargetMode({
				...channel,
				targetMode: channel.mode
			});
		}
		return channel.targetMode;
	}
	function resolveTargetMode(channel) {
		const availableModes = channel.availableModes ?? [];
		const targetMode = channel.targetMode ?? channel.mode ?? '';
		if (availableModes.includes(targetMode)) {
			return targetMode;
		}
		if (availableModes.includes(channel.mode)) {
			return channel.mode;
		}
		return availableModes[0] ?? '';
	}
	function findSelectedOption(channel, options) {
		if ((channel.targetEnabled ?? channel.enabled) === false) {
			return options[0];
		}
		const targetMode = resolveTargetMode(channel);
		return options.find(option => option.enabled && option.mode === targetMode) ?? options[0];
	}
	const MODE_MESSAGE_IDS = {
		call: {
			firstIncoming: 'CRM_AI_AUTOMATION_SLIDER_CALL_MODE_FIRST_INCOMING',
			allIncoming: 'CRM_AI_AUTOMATION_SLIDER_CALL_MODE_ALL_INCOMING',
			outgoing: 'CRM_AI_AUTOMATION_SLIDER_CALL_MODE_OUTGOING',
			both: 'CRM_AI_AUTOMATION_SLIDER_CALL_MODE_BOTH'
		},
		chat: {
			firstChat: 'CRM_AI_AUTOMATION_SLIDER_CHAT_MODE_FIRST_CHAT',
			all: 'CRM_AI_AUTOMATION_SLIDER_CHAT_MODE_ALL'
		},
		email: {
			firstIncoming: 'CRM_AI_AUTOMATION_SLIDER_EMAIL_MODE_FIRST_INCOMING',
			allIncoming: 'CRM_AI_AUTOMATION_SLIDER_EMAIL_MODE_ALL_INCOMING',
			allOutgoing: 'CRM_AI_AUTOMATION_SLIDER_EMAIL_MODE_ALL_OUTGOING',
			all: 'CRM_AI_AUTOMATION_SLIDER_EMAIL_MODE_ALL'
		}
	};
	function getModeTitle(channelCode, mode, getMessage) {
		const messageId = MODE_MESSAGE_IDS[channelCode]?.[mode];
		return messageId ? getMessage(messageId) ?? mode : mode;
	}

	const MODE_SECTION_CODE = 'modes';

	// @vue/component
	const ChannelModeSelect = {
		name: 'ChannelModeSelect',
		components: {
			BMenu: ui_system_menu_vue.BMenu,
			UiLabel: ui_system_label_vue.UiLabel
		},
		emits: ['change'],
		props: {
			channel: {
				type: Object,
				required: true
			}
		},
		data() {
			return {
				isMenuShown: false
			};
		},
		computed: {
			blockedLabelStyle() {
				return ui_system_label.LabelStyle.FILLED_WARNING_INVERTED;
			},
			options() {
				return buildChannelModeOptions(this.channel, this.getMessage.bind(this));
			},
			selectedOption() {
				return getSelectedChannelModeOption(this.channel, this.getMessage.bind(this));
			},
			iconClass() {
				if (this.channel.code === 'call') {
					return '--o-phone-up';
				}
				if (this.channel.code === 'chat') {
					return '--o-chats';
				}
				if (this.channel.code === 'email') {
					return '--o-mail';
				}
				return '';
			},
			menuOptions() {
				return {
					bindElement: this.$refs.button,
					sections: [{
						code: MODE_SECTION_CODE
					}],
					items: this.options.map(option => ({
						id: option.code,
						title: option.title,
						sectionCode: option.code === DISABLED_MODE_CODE ? undefined : MODE_SECTION_CODE,
						isSelected: option.code === this.selectedOption.code,
						onClick: () => this.selectOption(option)
					})),
					closeOnItemClick: true
				};
			}
		},
		methods: {
			getMessage(messageKey, replacements = {}) {
				return this.$Bitrix.Loc.getMessage(messageKey, replacements);
			},
			toggleMenu() {
				if (this.channel.isBlocked) {
					return;
				}
				this.isMenuShown = !this.isMenuShown;
			},
			selectOption(option) {
				this.$emit('change', {
					channelCode: this.channel.code,
					option
				});
			},
			closeMenu() {
				this.isMenuShown = false;
			}
		},
		// language=Vue
		template: `
		<div class="crm-ai-settings-slider__channel-mode">
			<div class="crm-ai-settings-slider__channel-mode-title">
				<span
					v-if="iconClass"
					:class="['ui-icon-set', iconClass, 'crm-ai-settings-slider__channel-mode-icon']"
				></span>
				<span>{{ channel.title }}</span>
			</div>
			<button
				ref="button"
				type="button"
				:class="[
					'crm-ai-settings-slider__mode-button',
					{ '--open': isMenuShown },
				]"
				:disabled="channel.isBlocked"
				@click="toggleMenu"
			>
				<span class="crm-ai-settings-slider__mode-button-label">{{ selectedOption.title }}</span>
				<span class="crm-ai-settings-slider__mode-button-right" aria-hidden="true">
					<span class="crm-ai-settings-slider__mode-button-divider"></span>
					<span class="crm-ai-settings-slider__mode-button-chevron"></span>
				</span>
			</button>
			<BMenu
				v-if="isMenuShown"
				:options="menuOptions"
				@close="closeMenu"
			/>
			<div
				v-if="channel.isBlocked"
				class="crm-ai-settings-slider__channel-blocked"
			>
				<UiLabel
					:style="blockedLabelStyle"
					size="sm"
					:value="$Bitrix.Loc.getMessage('CRM_AI_AUTOMATION_SLIDER_REASON_TRANSCRIPTION_DISABLED')"
				/>
			</div>
		</div>
	`
	};

	// @vue/component
	const ScenarioCard = {
		name: 'ScenarioCard',
		components: {
			ChannelModeSelect
		},
		emits: ['toggle-expanded', 'select-channel-mode'],
		props: {
			scenario: {
				type: Object,
				required: true
			},
			expanded: {
				type: Boolean,
				default: false
			}
		},
		computed: {
			isReady() {
				return this.scenario.availability?.ready === true;
			},
			summary() {
				return formatScenarioSummary(this.scenario.channels ?? [], this.getMessage.bind(this));
			},
			disabledReason() {
				return getAvailabilityReasonText(this.scenario.availability?.reasonCode, this.getMessage.bind(this));
			},
			action() {
				return this.scenario.availability?.action ?? {
					type: 'none'
				};
			},
			hasAction() {
				return this.action.type === 'infoHelper' || this.action.type === 'sidePanel' || this.action.type === 'accessDenied';
			},
			actionText() {
				if (this.action.type === 'infoHelper') {
					return this.getMessage('CRM_AI_AUTOMATION_SLIDER_PICK_PACKAGE_BUTTON');
				}
				if (this.scenario.availability?.reasonCode === 'global_disabled') {
					return this.getMessage('CRM_AI_AUTOMATION_SLIDER_ENABLE_BUTTON');
				}
				return this.getMessage('CRM_AI_AUTOMATION_SLIDER_CONFIGURE_BUTTON');
			},
			toggleText() {
				return this.expanded ? this.getMessage('CRM_AI_AUTOMATION_SLIDER_COLLAPSE_BUTTON') : this.getMessage('CRM_AI_AUTOMATION_SLIDER_EDIT_BUTTON');
			}
		},
		methods: {
			getMessage(messageKey, replacements = {}) {
				return this.$Bitrix.Loc.getMessage(messageKey, replacements);
			},
			toggleExpanded() {
				this.$emit('toggle-expanded', this.scenario.code);
			},
			selectChannelMode(payload) {
				this.$emit('select-channel-mode', {
					scenarioCode: this.scenario.code,
					channelCode: payload.channelCode,
					option: payload.option
				});
			},
			handleAction(event) {
				if (this.action.type === 'infoHelper') {
					getTopBX()?.UI?.InfoHelper?.show(this.action.code);
				} else if (this.action.type === 'sidePanel') {
					getTopBX()?.SidePanel?.Instance?.open(this.action.url);
				} else if (this.action.type === 'accessDenied') {
					crm_noticePopup.NoticePopup.showAccessDenied(event.currentTarget);
				}
			}
		},
		// language=Vue
		template: `
		<article class="crm-ai-settings-slider__scenario-card">
			<div
				:class="[
					'crm-ai-settings-slider__scenario-card-copy',
					{ '--muted': !isReady },
				]"
			>
				<div class="crm-ai-settings-slider__scenario-card-title">{{ scenario.title }}</div>
				<div
					v-if="scenario.description"
					class="crm-ai-settings-slider__scenario-card-description"
				>
					{{ scenario.description }}
				</div>
			</div>
			<div
				v-if="isReady"
				class="crm-ai-settings-slider__scenario-card-meta"
			>
				<span v-if="summary" class="crm-ai-settings-slider__scenario-card-summary">{{ summary }}</span>
				<a
					href="#"
					class="crm-ai-settings-slider__scenario-card-action"
					@click.prevent="toggleExpanded"
				>{{ toggleText }}</a>
			</div>
			<div
				v-else
				class="crm-ai-settings-slider__scenario-card-meta"
			>
				<span
					v-if="disabledReason"
					class="crm-ai-settings-slider__scenario-card-reason"
				>{{ disabledReason }}</span>
				<a
					v-if="hasAction"
					href="#"
					class="crm-ai-settings-slider__scenario-card-action"
					@click.prevent="handleAction($event)"
				>{{ actionText }}</a>
			</div>
			<div
				v-if="isReady && expanded"
				class="crm-ai-settings-slider__scenario-card-channels"
			>
				<ChannelModeSelect
					v-for="channel in scenario.channels"
					:key="scenario.code + ':' + channel.code"
					:channel="channel"
					@change="selectChannelMode"
				/>
			</div>
		</article>
	`
	};

	const SCENARIOS_HELP_ARTICLE_CODE = '18799442';

	// @vue/component
	const Main = {
		name: 'Main',
		components: {
			ScenarioCard
		},
		computed: {
			...ui_vue3_vuex.mapGetters(['slider', 'scenariosWithChannelState', 'expandedScenarioCodes', 'isLoading', 'isSaving', 'isDirty', 'isSaveDisabled', 'errorCode']),
			sliderTitle() {
				return this.getMessage('CRM_AI_SETTINGS_SLIDER_HEADER', crm_ai_nameService.NameService.copilotNameReplacement());
			},
			currentLanguageLabel() {
				const {
					languageTitle,
					languageId
				} = this.slider.header;
				return languageTitle || (languageId ? languageId.toUpperCase() : '');
			},
			categoryName() {
				return this.slider.scope?.categoryName ?? '';
			},
			languageButtonText() {
				if (this.currentLanguageLabel) {
					return this.getMessage('CRM_AI_SETTINGS_SLIDER_LANGUAGE_BUTTON_SELECTED', {
						'#LANGUAGE#': this.currentLanguageLabel
					});
				}
				return this.getMessage('CRM_AI_SETTINGS_SLIDER_LANGUAGE_BUTTON');
			},
			buttonsPanelClass() {
				return {
					'ui-button-panel-wrapper': true,
					'ui-pinner': true,
					'ui-pinner-bottom': true,
					'ui-pinner-full-width': true,
					'ui-button-panel-wrapper-hide': !this.isDirty
				};
			}
		},
		methods: {
			...ui_vue3_vuex.mapActions(['loadSlider', 'saveSlider', 'openLanguageSelector', 'toggleExpandedScenario', 'setScenarioChannelSelection']),
			getMessage(messageKey, replacements = {}) {
				return this.$Bitrix.Loc.getMessage(messageKey, replacements);
			},
			closeSlider() {
				getTopBX()?.SidePanel?.Instance?.close();
			},
			openHelp() {
				getTopBX()?.Helper?.show(`redirect=detail&code=${SCENARIOS_HELP_ARTICLE_CODE}`);
			},
			getErrorMessage(errorCode) {
				return getAvailabilityReasonText(errorCode, this.getMessage.bind(this)) || this.getMessage('CRM_AI_SETTINGS_SLIDER_GENERIC_ERROR');
			}
		},
		mounted() {
			this.loadSlider();
		},
		// language=Vue
		template: `
		<div class="crm-ai-settings-slider ui-sidepanel-layout-content-inner --ui-context-content-light">
			<div v-if="isLoading" class="crm-ai-settings-slider__loader">
				<div class="crm-ai-settings-slider__loader-bar"></div>
			</div>
			<header class="crm-ai-settings-slider__header">
				<div class="crm-ai-settings-slider__heading">
					<div class="crm-ai-settings-slider__title-row">
						<span class="crm-ai-settings-slider__title">
							{{ sliderTitle }}
						</span>
						<span v-if="categoryName" class="crm-ai-settings-slider__category" :title="categoryName">
							<span class="ui-icon-set --o-filter-funnel crm-ai-settings-slider__category-icon"></span>
							<span class="crm-ai-settings-slider__category-name">{{ categoryName }}</span>
						</span>
					</div>
					<div class="crm-ai-settings-slider__subtitle">
						{{ $Bitrix.Loc.getMessage('CRM_AI_SETTINGS_SLIDER_SUBTITLE') }}
					</div>
				</div>
				<div
					v-if="slider.header.isLanguageSelectorAvailable"
					class="crm-ai-settings-slider__language-control"
				>
					<button
						class="ui-btn ui-btn-sm ui-btn-no-caps --air --style-outline ui-btn-dropdown crm-ai-settings-slider__language"
						@click="openLanguageSelector"
					>
						<span class="ui-btn-text">{{ languageButtonText }}</span>
					</button>
				</div>
			</header>
			<div
				v-if="errorCode && errorCode !== 'slider_state_conflict'"
				class="crm-ai-settings-slider__error"
			>
				{{ getErrorMessage(errorCode) }}
			</div>
			<section class="crm-ai-settings-slider__scenarios">
				<div class="crm-ai-settings-slider__card">
					<div class="crm-ai-settings-slider__card-head">
						<span class="crm-ai-settings-slider__card-icon"></span>
						<span class="crm-ai-settings-slider__card-title">
							{{ $Bitrix.Loc.getMessage('CRM_AI_AUTOMATION_SLIDER_SCENARIOS_TITLE') }}
						</span>
						<button
							type="button"
							class="ui-btn ui-btn-sm ui-btn-no-caps --air --style-outline crm-ai-settings-slider__card-help"
							@click="openHelp"
						>
							<span class="ui-btn-text">{{ $Bitrix.Loc.getMessage('CRM_AI_SETTINGS_SLIDER_SCENARIOS_HELP') }}</span>
						</button>
					</div>
					<div class="crm-ai-settings-slider__card-body">
						<ScenarioCard
							v-for="scenario in scenariosWithChannelState"
							:key="scenario.code"
							:scenario="scenario"
							:expanded="expandedScenarioCodes.includes(scenario.code)"
							@toggle-expanded="toggleExpandedScenario"
							@select-channel-mode="setScenarioChannelSelection"
						/>
					</div>
				</div>
			</section>
			<div
				class="crm-ai-settings-slider__footer"
				:class="buttonsPanelClass"
			>
				<div class="ui-button-panel ui-button-panel-align-center">
					<button
						type="button"
						class="ui-btn ui-btn-no-caps ui-btn-lg --air --style-plain"
						@click="closeSlider"
					>
						<span class="ui-btn-text">
							{{ $Bitrix.Loc.getMessage('CRM_AI_SETTINGS_SLIDER_CANCEL_BUTTON') }}
						</span>
					</button>
					<button
						type="button"
						:class="[
							'ui-btn ui-btn-no-caps ui-btn-lg --air --style-filled',
							{ 'ui-btn-wait': isSaving },
						]"
						:disabled="isSaveDisabled"
						@click="saveSlider"
					>
						<span class="ui-btn-text">
							{{ $Bitrix.Loc.getMessage('CRM_AI_SETTINGS_SLIDER_SAVE_BUTTON') }}
						</span>
					</button>
				</div>
			</div>
		</div>
	`
	};

	class AutomationSliderService {
		constructor(entityTypeId, categoryId) {
			this.entityTypeId = entityTypeId;
			this.categoryId = categoryId;
		}
		getSlider() {
			return main_core.ajax.runAction('crm.settings.ai.getAutomationSlider', {
				json: {
					entityTypeId: this.entityTypeId,
					categoryId: this.categoryId
				}
			});
		}
		saveSlider(revision, scenarioUpdates) {
			return main_core.ajax.runAction('crm.settings.ai.saveAutomationSlider', {
				json: {
					entityTypeId: this.entityTypeId,
					categoryId: this.categoryId,
					revision,
					scenarioUpdates
				}
			});
		}
	}

	const POPUP_WIDTH = 300;
	async function openLanguageSelector({
		entityTypeId,
		categoryId,
		currentLanguageId,
		onSelect,
		targetNode = null
	}) {
		const {
			Dialog
		} = await main_core.Runtime.loadExtension('ui.entity-selector');
		const dialog = new Dialog({
			targetNode,
			multiple: false,
			showAvatars: false,
			dropdownMode: true,
			compactView: true,
			enableSearch: true,
			context: `COPILOT-LANGUAGE-SELECTOR-${entityTypeId}-${categoryId}`,
			width: POPUP_WIDTH,
			tagSelectorOptions: {
				textBoxWidth: '100%'
			},
			preselectedItems: currentLanguageId ? [['copilot_language', currentLanguageId]] : [],
			entities: [{
				id: 'copilot_language',
				options: {
					entityTypeId,
					categoryId
				}
			}],
			events: {
				'Item:onSelect': event => {
					const item = event.getData().item;
					onSelect(String(item.id).toLowerCase(), item.getTitle());
				},
				'onHide': () => {
					dialog.destroy();
				}
			}
		});
		dialog.show();
	}

	const BUSY_RETRY_DELAY_MS = 1000;
	const getErrorCode = error => error?.errors?.[0]?.code ?? 'save_failed';
	const getErrorMessage = errorCode => {
		return getAvailabilityReasonText(errorCode) || main_core.Loc.getMessage('CRM_AI_SETTINGS_SLIDER_GENERIC_ERROR');
	};
	const delay = ms => new Promise(resolve => {
		setTimeout(resolve, ms);
	});
	async function saveWithBusyRetry(service, payload) {
		try {
			return await service.saveSlider(payload.revision, payload.scenarioUpdates);
		} catch (error) {
			if (getErrorCode(error) !== 'slider_busy') {
				throw error;
			}
			await delay(BUSY_RETRY_DELAY_MS);
			return service.saveSlider(payload.revision, payload.scenarioUpdates);
		}
	}
	var actions = {
		async loadSlider({
			commit,
			state
		}) {
			commit('startLoading');
			try {
				const response = await state.service.getSlider();
				const slider = response?.data?.slider;
				if (slider) {
					commit('setSlider', slider);
				} else {
					commit('setErrorCode', 'invalid_response');
				}
			} catch (error) {
				commit('setErrorCode', getErrorCode(error));
			} finally {
				commit('stopLoading');
			}
		},
		async saveSlider({
			commit,
			state,
			getters,
			dispatch
		}) {
			if (getters.isSaveDisabled) {
				return;
			}
			commit('startSaving');
			try {
				const payload = normalizeSavePayload(state.slider.revision, state.slider.scenarios);
				const response = await saveWithBusyRetry(state.service, payload);
				const slider = response?.data?.slider;
				if (slider) {
					commit('setSlider', slider);
				} else {
					commit('setErrorCode', 'invalid_response');
					ui_notification.UI.Notification.Center.notify({
						content: getErrorMessage('invalid_response')
					});
				}
			} catch (error) {
				const errorCode = getErrorCode(error);
				if (errorCode === 'slider_state_conflict') {
					const pendingSelections = collectChangedChannelSelections(state.slider.scenarios);
					await dispatch('loadSlider');
					commit('reapplyChannelSelections', pendingSelections);
					ui_notification.UI.Notification.Center.notify({
						content: main_core.Loc.getMessage('CRM_AI_SETTINGS_SLIDER_CONFLICT_REAPPLIED')
					});
				} else {
					commit('setErrorCode', errorCode);
					ui_notification.UI.Notification.Center.notify({
						content: getErrorMessage(errorCode)
					});
				}
			} finally {
				commit('stopSaving');
			}
		},
		setScenarioChannelSelection({
			commit
		}, payload) {
			commit('setScenarioChannelSelection', payload);
		},
		toggleExpandedScenario({
			commit
		}, scenarioCode) {
			commit('toggleExpandedScenario', scenarioCode);
		},
		openLanguageSelector({
			state,
			commit
		}, event) {
			openLanguageSelector({
				entityTypeId: state.entityTypeId,
				categoryId: state.categoryId,
				currentLanguageId: state.slider.header.languageId,
				targetNode: event?.currentTarget ?? null,
				onSelect: (languageId, languageTitle) => {
					commit('setLanguage', {
						languageId,
						languageTitle
					});
					let optionName = `ai_config_${state.entityTypeId}`;
					if (Number.isInteger(state.categoryId)) {
						optionName += `_${state.categoryId}`;
					}
					main_core.userOptions.save('crm', optionName, 'languageId', languageId);
				}
			});
		}
	};

	var getters = {
		slider: state => state.slider,
		scenarios: state => state.slider.scenarios,
		expandedScenarioCodes: state => state.expandedScenarioCodes,
		scenariosWithChannelState: state => {
			const scenarios = state.slider.scenarios ?? [];
			const transcription = scenarios.find(scenario => scenario.code === TRANSCRIPTION_SCENARIO_CODE);
			const transcriptionCall = (transcription?.channels ?? []).find(channel => channel.code === CALL_CHANNEL_CODE);
			const transcriptionReady = transcription?.availability?.ready === true;
			const transcriptionCallEnabled = transcriptionCall ? transcriptionCall.targetEnabled ?? transcriptionCall.enabled : false;
			const isTranscriptionAvailableAndEnabled = transcriptionReady && transcriptionCallEnabled;
			return scenarios.map(scenario => ({
				...scenario,
				channels: (scenario.channels ?? []).map(channel => {
					if (!isTranscriptionAvailableAndEnabled && isTranscriptionDependentCallChannel(scenario.code, channel.code)) {
						return {
							...channel,
							isBlocked: true,
							blockedReason: 'transcription_disabled'
						};
					}
					return {
						...channel,
						isBlocked: false,
						blockedReason: null
					};
				})
			}));
		},
		isLoading: state => state.isLoading,
		isSaving: state => state.isSaving,
		errorCode: state => state.errorCode,
		isDirty: state => state.slider.scenarios.some(scenario => scenario.channels.some(channel => channel.isChanged)),
		isSaveDisabled: (state, getters) => getters.isLoading || getters.isSaving || !getters.isDirty
	};

	function updateScenarioChannel(state, scenarioCode, channelCode, updater) {
		state.slider.scenarios = state.slider.scenarios.map(scenario => {
			if (scenario.code !== scenarioCode) {
				return scenario;
			}
			return {
				...scenario,
				channels: scenario.channels.map(channel => {
					if (channel.code !== channelCode) {
						return channel;
					}
					const updated = updater(channel);
					return {
						...updated,
						isChanged: isChannelChanged(channel, updated)
					};
				})
			};
		});
	}
	function isChannelChanged(channel, updated) {
		if (updated.targetEnabled !== channel.enabled) {
			return true;
		}
		if (updated.targetEnabled === false) {
			return false;
		}
		return updated.targetMode !== channel.mode;
	}
	var mutations = {
		startLoading(state) {
			state.isLoading = true;
			state.errorCode = null;
		},
		stopLoading(state) {
			state.isLoading = false;
		},
		startSaving(state) {
			state.isSaving = true;
			state.errorCode = null;
		},
		stopSaving(state) {
			state.isSaving = false;
		},
		setSlider(state, slider) {
			state.slider = normalizeSlider(slider);
			state.errorCode = null;
		},
		setErrorCode(state, errorCode) {
			state.errorCode = errorCode;
		},
		setLanguage(state, {
			languageId,
			languageTitle
		}) {
			state.slider.header.languageId = languageId;
			state.slider.header.languageTitle = languageTitle ?? '';
		},
		toggleExpandedScenario(state, scenarioCode) {
			state.expandedScenarioCodes = state.expandedScenarioCodes.includes(scenarioCode) ? state.expandedScenarioCodes.filter(code => code !== scenarioCode) : [...state.expandedScenarioCodes, scenarioCode];
		},
		setScenarioChannelSelection(state, {
			scenarioCode,
			channelCode,
			option
		}) {
			updateScenarioChannel(state, scenarioCode, channelCode, channel => ({
				...channel,
				targetEnabled: option.enabled,
				targetMode: option.mode
			}));
		},
		reapplyChannelSelections(state, selections) {
			selections.forEach(({
				scenarioCode,
				channelCode,
				targetEnabled,
				targetMode
			}) => {
				updateScenarioChannel(state, scenarioCode, channelCode, channel => ({
					...channel,
					targetEnabled,
					targetMode
				}));
			});
		}
	};

	var store = ({
		entityTypeId,
		categoryId
	}) => ({
		state: {
			entityTypeId,
			categoryId,
			expandedScenarioCodes: [],
			slider: createEmptySlider(),
			isLoading: true,
			isSaving: false,
			errorCode: null,
			service: new AutomationSliderService(entityTypeId, categoryId)
		},
		getters,
		mutations,
		actions
	});

	class SettingsSliderApplication {
		application = null;
		store = null;
		constructor(rootNode, options = {}) {
			this.rootNode = document.querySelector(`#${rootNode}`);
			this.options = options;
		}
		start() {
			this.store = ui_vue3_vuex.createStore(store(this.options));
			this.application = ui_vue3.BitrixVue.createApp({
				name: 'SettingsSlider',
				components: {
					Main
				},
				template: '<Main/>'
			});
			this.store.install(this.application);
			this.application.mount(this.rootNode);
		}
		stop() {
			this.application?.unmount();
			this.application = null;
			this.store = null;
		}
	}

	class SettingsSliderApp {
		constructor(entityTypeId, categoryId = null) {
			this.entityTypeId = entityTypeId;
			this.categoryId = categoryId;
			this.containerId = `crm-ai-settings-slider-${entityTypeId}-${categoryId ?? 'default'}`;
			this.sliderUrl = `crm:ai-settings-slider-${entityTypeId}-${categoryId ?? 'default'}`;
			this.boundHandleLoad = this.handleLoad.bind(this);
			this.boundHandleClose = this.handleClose.bind(this);
			this.application = null;
			this.slider = null;
		}
		open() {
			this.slider = new crm_ai_slider.Slider({
				content: () => `<div id="${this.containerId}"></div>`,
				sliderTitle: '',
				sliderContentClass: 'crm-ai-settings-slider-surface',
				extensions: ['crm.ai.settings-slider'],
				url: this.sliderUrl,
				width: 795
			});
			main_core.addCustomEvent('SidePanel.Slider:onLoad', this.boundHandleLoad);
			main_core.addCustomEvent('SidePanel.Slider:onClose', this.boundHandleClose);
			this.slider.open();
		}
		handleLoad(event) {
			if (event.getSlider().getUrl() !== this.sliderUrl) {
				return;
			}
			if (this.application) {
				return;
			}
			this.application = new SettingsSliderApplication(this.containerId, {
				entityTypeId: this.entityTypeId,
				categoryId: this.categoryId
			});
			this.application.start();
			main_core.removeCustomEvent('SidePanel.Slider:onLoad', this.boundHandleLoad);
		}
		handleClose(event) {
			if (event.getSlider().getUrl() !== this.sliderUrl) {
				return;
			}
			this.application?.stop?.();
			this.application = null;
			this.slider = null;
			main_core.removeCustomEvent('SidePanel.Slider:onLoad', this.boundHandleLoad);
			main_core.removeCustomEvent('SidePanel.Slider:onClose', this.boundHandleClose);
		}
	}

	exports.SettingsSliderApp = SettingsSliderApp;

})(this.BX.Crm.AI = this.BX.Crm.AI || {}, BX.Crm.AI, BX, BX.Vue3, BX.Vue3.Vuex, BX.Crm.AI, BX.Crm, BX.UI.System.Label, BX.UI.System.Label.Vue, BX.UI.System.Menu, BX.UI.Notification);
//# sourceMappingURL=settings-slider.bundle.js.map
