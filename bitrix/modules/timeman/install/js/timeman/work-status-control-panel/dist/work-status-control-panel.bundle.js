/* eslint-disable */
this.BX = this.BX || {};
(function (exports, main_core, main_core_events, ui_vue3, timeman, CJSTask, planner, tasks_planner_handler, calendar_planner_handler, ajax, timer, popup, ls, ui_iconSet_api_vue, ui_vue3_components_button, ui_system_skeleton_vue, timeman_workTimeReport, main_popup, ui_buttons, ui_system_menu_vue) {
	'use strict';

	const BUTTON_PART_TYPE = {
		TEXT: 'TEXT',
		DROPDOWN: 'DROPDOWN',
		// in development
		TOGGLE: 'TOGGLE'
	};

	// @vue/component
	const ButtonText = {
		name: 'ButtonText',
		components: {
			BIcon: ui_iconSet_api_vue.BIcon
		},
		props: {
			id: {
				type: String,
				default: ''
			},
			text: {
				type: String,
				default: ''
			},
			iconLeft: {
				type: String,
				default: ''
			},
			iconRight: {
				type: String,
				default: ''
			},
			onclick: {
				type: Function,
				default: () => {}
			}
		},
		emits: [],
		setup() {
			return {};
		},
		data() {
			return {};
		},
		mounted() {},
		updated() {},
		methods: {
			// handlers

			handleClickButton() {
				this.onclick();
			}

			// handlers end
		},
		template: `
		<button
			:id="id"
			class="ui-btn-part ui-btn-part_text"
			@click="handleClickButton"
		>
			<BIcon
				v-if="iconLeft"
				class="ui-btn-part__img"
				:name="iconLeft"
			/>
			<span class="ui-btn-part__text">{{ text }}</span>
			<BIcon
				v-if="iconRight"
				class="ui-btn-part__img"
				:name="iconRight"
			/>
		</button>
	`
	};

	// @vue/component
	const ButtonDropdown = {
		name: 'ButtonDropdown',
		components: {
			BIcon: ui_iconSet_api_vue.BIcon,
			BMenu: ui_system_menu_vue.BMenu
		},
		props: {
			id: {
				type: String,
				default: ''
			},
			isLoading: {
				type: Boolean,
				required: false
			},
			menuOptions: {
				type: main_popup.MenuOptions,
				required: false,
				default: null
			}
		},
		emits: [],
		setup() {
			return {
				Outline: ui_iconSet_api_vue.Outline
			};
		},
		data() {
			return {
				isMenuShown: false
			};
		},
		computed: {
			menuOptionsBound() {
				return {
					...this.menuOptions,
					className: 'popup-window_for-button-split',
					bindElement: this.$refs.opener
				};
			}
		},
		watch: {
			isMenuShown(newVal) {
				const opener = this.$refs.opener;
				const hostPopupNode = opener?.closest?.('.popup-window');
				const hostPopup = hostPopupNode ? window.BX?.Main?.PopupManager?.getPopupById(hostPopupNode.id) : null;
				if (!hostPopup) {
					return;
				}
				if (newVal) {
					const count = (hostPopup._tmAutoHideSuspendCount ?? 0) + 1;
					hostPopup._tmAutoHideSuspendCount = count;
					if (count === 1) {
						hostPopup.setAutoHide(false);
					}
				} else {
					const count = Math.max(0, (hostPopup._tmAutoHideSuspendCount ?? 0) - 1);
					hostPopup._tmAutoHideSuspendCount = count;
					if (count === 0) {
						hostPopup.setAutoHide(true);
					}
				}
			}
		},
		mounted() {},
		beforeUnmount() {
			if (this.isMenuShown) {
				this.isMenuShown = false;
			}
		},
		updated() {},
		methods: {
			// handlers

			handleClickButton() {
				this.isMenuShown = !this.isMenuShown;
			}

			// handlers end
		},
		template: `
		<button
			ref="opener"
			:id="id"
			class="ui-btn-part ui-btn-part_dropdown ui-icon-set__scope"
			:class="{'ui-btn-part_loading': isLoading}"
			@click="handleClickButton"
		>
			<BMenu v-if="isMenuShown" :options="menuOptionsBound" @close="isMenuShown = false" />
		</button>
	`
	};

	// @vue/component
	const ButtonPlaceholder = {
		name: 'ButtonPlaceholder',
		components: {},
		props: {
			id: {
				type: String,
				default: ''
			},
			text: {
				type: String,
				default: ''
			}
		},
		emits: [],
		setup() {
			return {};
		},
		data() {
			return {};
		},
		mounted() {},
		updated() {},
		methods: {},
		template: `
		<div class="ui-btn-part ui-btn-part_fallback">
			<p class="ui-btn-part__info" >Type unknown. Id: {{ id }}. Text: {{ text }}.</p>
		</div>
	`
	};

	// @vue/component
	const ButtonSplit = {
		name: 'UiButtonSplit',
		components: {
			ButtonText,
			ButtonDropdown,
			ButtonPlaceholder
		},
		props: {
			id: {
				type: String,
				default: ''
			},
			size: {
				type: String,
				default: ''
			},
			styleName: {
				type: String,
				default: ''
			},
			wide: {
				type: Boolean,
				required: false
			},
			buttonParts: {
				type: Array,
				required: true,
				default: () => []
			}
		},
		emits: ['click', 'menuOpen', 'menuClose'],
		data() {
			return {};
		},
		computed: {
			classSumm() {
				const classBase = '--air';
				const classStyle = this.styleName ? ' ' + this.styleName : '';
				const classSize = this.size ? ' ' + this.size : '';
				const classWide = this.wide ? ' --wide' : '';
				const classSummNew = classBase + classStyle + classSize + classWide;
				return classSummNew;
			}
		},
		watch: {},
		created() {},
		mounted() {},
		unmounted() {},
		methods: {
			getButtonPartComponent(buttonPart) {
				if (buttonPart.type === BUTTON_PART_TYPE.TEXT) {
					return ButtonText;
				}
				if (buttonPart.type === BUTTON_PART_TYPE.DROPDOWN) {
					return ButtonDropdown;
				}
				if (buttonPart.type === BUTTON_PART_TYPE.TOGGLE) {
					return ButtonPlaceholder;
				}
				return ButtonPlaceholder;
			}
		},
		template: `
		<ul
			:id="id"
			class="ui-btn-split ui-btn-split_vue-tmp"
			:class="classSumm"
		>
			<li
				v-for="buttonPart in buttonParts"
				:key="buttonPart.id + buttonPart.type"
				class="ui-btn-split__item"
				:class="{
					'ui-btn-split__item_no-divider': buttonPart.isNoNextDivider,
				}"
			>
				<component
					:is="getButtonPartComponent(buttonPart)"
					:key="buttonPart.id + buttonPart.type"
					:id="buttonPart.id"
					:ref="buttonPart.id"
					:icon-left="buttonPart.iconLeft"
					:icon-right="buttonPart.iconRight"
					:text="buttonPart.text"
					:menuOptions="buttonPart.menuOptions"
					:onclick="buttonPart.onClick"
				/>
			</li>
		</ul>
	`
	};

	// @vue/component
	const ButtonTextDropdown = {
		name: 'UiButtonTextDropdown',
		components: {
			ButtonSplit
		},
		props: {
			id: {
				type: String,
				default: ''
			},
			isLoading: {
				type: Boolean,
				required: false
			},
			text: {
				type: String,
				default: ''
			},
			iconLeft: {
				type: String,
				default: ''
			},
			iconRight: {
				type: String,
				default: ''
			},
			size: {
				type: String,
				default: ''
			},
			styleName: {
				type: String,
				default: ''
			},
			wide: {
				type: Boolean,
				required: false
			},
			menuOptions: {
				type: main_popup.MenuOptions,
				required: false,
				default: null
			}
		},
		emits: ['click'],
		data() {
			return {};
		},
		computed: {
			buttonParts() {
				const buttonPartsNew = [{
					id: this.id + 'Text',
					type: BUTTON_PART_TYPE.TEXT,
					text: this.text,
					iconLeft: this.iconLeft,
					iconRight: this.iconRight,
					onClick: () => this.$emit('click')
				}, {
					id: this.id + 'Dropdown',
					type: BUTTON_PART_TYPE.DROPDOWN,
					menuOptions: this.menuOptions
				}];
				return buttonPartsNew;
			}
		},
		watch: {},
		created() {},
		mounted() {},
		unmounted() {},
		methods: {},
		template: `
		<ButtonSplit
			:id="id"
			:size="size"
			:style-name="styleName"
			:wide="wide"
			:buttonParts="buttonParts"
		/>
	`
	};

	// @vue/component
	const Clock = {
		components: {},
		props: {
			time: {
				type: Number,
				required: true
			},
			isHourShown: {
				type: Boolean,
				default: true
			},
			isMinuteShown: {
				type: Boolean,
				default: true
			},
			isSecondShown: {
				type: Boolean,
				default: true
			}
		},
		emits: [],
		setup() {
			return {};
		},
		data() {
			return {};
		},
		mounted() {},
		updated() {},
		methods: {
			convertMillisecondsToHrMinSec(time) {
				const timeFullSeconds = Math.floor(time / 1000);
				const hours = Math.floor(timeFullSeconds / 3600);
				const minutes = Math.floor(timeFullSeconds / 60) - hours * 60;
				const seconds = timeFullSeconds - minutes * 60 - hours * 3600;
				return {
					hours,
					minutes,
					seconds
				};
			},
			timeNumToDoubleDigitString(num) {
				return num > 9 ? String(num) : ('00' + num).slice(-2);
			}

			// handlers

			// handlers end
		},
		template: `
		<p class="bui-clock">
			<span
				v-if="isHourShown"
				class="bui-clock__value bui-clock__value_hours"
			>{{
				timeNumToDoubleDigitString(convertMillisecondsToHrMinSec(time).hours)
			}}</span>
			<span
							v-if="isMinuteShown"
				class="bui-clock__value bui-clock__value_minutes"
			>{{
				timeNumToDoubleDigitString(convertMillisecondsToHrMinSec(time).minutes)
			}}</span>
			<span
				v-if="isSecondShown"
				class="bui-clock__value bui-clock__value_seconds"
			>{{
					timeNumToDoubleDigitString(convertMillisecondsToHrMinSec(time).seconds)
				}}</span>
		</p>
	`
	};

	// ALG-01: pure decision logic for the "start state" of the work day,
	// extracted from the component so it can be unit-tested without importing
	// the heavy Vue dependency chain of app.js.

	// Duration of the start state window: one hour after the work day opens.
	const START_STATE_DURATION_MS = 3600 * 1000;

	/**
	 * Whether the work day is currently in its "start state".
	 *
	 * The start state is active only while the work day is OPENED and less than
	 * START_STATE_DURATION_MS has elapsed since it started. The boundary is strict:
	 * at exactly the duration the start state is already over. A missing/zero
	 * DATE_START means the start state cannot be determined and is false.
	 *
	 * @param {string} workStatus current work day status (e.g. 'OPENED')
	 * @param {number} dateStartTimestamp work day start time, ms epoch (0 if unknown)
	 * @param {number} currentTimestamp current time, ms epoch
	 * @param {number} durationMs start state window length, ms
	 * @returns {boolean}
	 */
	function isStartState(workStatus, dateStartTimestamp, currentTimestamp, durationMs = START_STATE_DURATION_MS) {
		if (workStatus !== 'OPENED') {
			return false;
		}
		if (!dateStartTimestamp) {
			return false;
		}
		return currentTimestamp - dateStartTimestamp < durationMs;
	}

	// Pure timer math for the work-day control panel, extracted from the
	// component so the elapsed/pause calculations can be unit-tested without the
	// heavy Vue dependency chain of app.js.
	//
	// All values are in milliseconds. The anchors dateStartMs/dateStopMs are
	// ABSOLUTE instants (INFO.DISPLAY_START_TIMESTAMP / DISPLAY_STOP_TIMESTAMP),
	// NOT the wall-coordinate INFO.DATE_START/DATE_FINISH (absolute minus the
	// employee offset). Comparing an absolute anchor against nowMs is what makes an
	// OPENED day start the working-day timer at ~0 instead of +offset.

	/**
	 * Compute the working-day and pause timer values for the control panel.
	 *
	 * @param {Object} params
	 * @param {string} params.workStatus current work day status (OPENED|PAUSED|CLOSED|EXPIRED)
	 * @param {string} params.canOpen open action for a closed day (''|'OPEN'|'REOPEN')
	 * @param {boolean} params.isCanOpen whether a brand new day can be started (canOpen === 'OPEN')
	 * @param {number} params.dateStartMs absolute start instant, ms epoch (0 if unknown)
	 * @param {number} params.dateStopMs absolute displayed-finish instant, ms epoch (0 if unknown)
	 * @param {number} params.durationMs persisted worked time (RECORDED_DURATION), ms
	 * @param {number} params.timeLeaksMs persisted accumulated break time (TIME_LEAKS), ms
	 * @param {number} params.nowMs current time, ms epoch
	 * @returns {{ workingDayMs: number, pauseMs: number }}
	 */
	function computeWorkdayTimers({
		workStatus,
		canOpen,
		isCanOpen,
		dateStartMs,
		dateStopMs,
		durationMs,
		timeLeaksMs,
		nowMs
	}) {
		if (workStatus === 'CLOSED') {
			if (isCanOpen) {
				return {
					workingDayMs: 0,
					pauseMs: 0
				};
			}
			if (canOpen === 'REOPEN') {
				// A reopened closed day shows only persisted values:
				// worked time is RECORDED_DURATION, the break is accumulated leaks.
				return {
					workingDayMs: durationMs,
					pauseMs: timeLeaksMs
				};
			}

			// Closed and not reopenable: no live timer, values stay at zero.
			return {
				workingDayMs: 0,
				pauseMs: 0
			};
		}
		if (workStatus === 'PAUSED') {
			// Worked time is frozen on persisted DURATION; the current
			// break grows from the absolute pause moment (dateStopMs) plus the
			// leaks accumulated before this pause.
			return {
				workingDayMs: durationMs,
				pauseMs: nowMs - dateStopMs + timeLeaksMs
			};
		}
		if (workStatus === 'OPENED' || workStatus === 'EXPIRED') {
			return {
				workingDayMs: nowMs - dateStartMs - timeLeaksMs,
				pauseMs: timeLeaksMs
			};
		}
		return {
			workingDayMs: 0,
			pauseMs: 0
		};
	}

	const settings = main_core.Extension.getSettings('timeman.work-status-control-panel');

	// @vue/component
	const App = {
		name: 'WorkStatusControlPanel',
		components: {
			UiButton: ui_vue3_components_button.Button,
			UIButtonTextDropdown: ButtonTextDropdown,
			BIcon: ui_iconSet_api_vue.BIcon,
			Clock,
			BLine: ui_system_skeleton_vue.BLine
		},
		provide() {
			return {};
		},
		props: {
			hideOpenPanelButton: {
				type: Boolean,
				default: false
			},
			hideOpener: {
				type: Boolean,
				default: false
			},
			isReportsEnabled: {
				type: Boolean,
				default: false
			},
			hasAiReportAccess: {
				type: Boolean,
				default: false
			}
		},
		setup() {
			return {
				ButtonSize: ui_vue3_components_button.ButtonSize,
				Outline: ui_iconSet_api_vue.Outline,
				Loc: main_core.Loc
			};
		},
		data() {
			return {
				dataId: '',
				workStatus: '',
				reportReq: '',
				canOpen: '',
				canOpenAndRelaunch: '',
				canEdit: '',
				reportOpening: false,
				planOpening: false,
				reportPopupOpen: false,
				planPopupOpen: false,
				timerWorkingDayValue: 0,
				timerPauseValue: 0,
				lastProcessedHour: -1,
				currentTimestamp: Date.now()
			};
		},
		computed: {
			isClosed() {
				return this.workStatus === 'CLOSED';
			},
			isCanOpen() {
				return this.canOpen === 'OPEN';
			},
			isStartState() {
				// ALG-01 decision lives in the pure helper; this getter only
				// wires the reactive component state into it.
				return isStartState(this.workStatus, this.getDateStart(), this.currentTimestamp, START_STATE_DURATION_MS);
			},
			isStartStateActive() {
				return this.isStartState && this.isReportsEnabled;
			},
			copilotName() {
				return settings.get('copilotName') ?? 'BitrixGPT';
			},
			statusModifierClass() {
				if (this.isStartStateActive && !this.hideOpener) {
					return '--start';
				}
				if (this.isClosed && !this.isCanOpen && this.isReportsEnabled) {
					return '--closed';
				}
				return null;
			},
			reportStyleModifierClass() {
				if (this.statusModifierClass !== '--closed' && this.statusModifierClass !== '--start') {
					return null;
				}
				return this.hasAiReportAccess ? null : '--auto';
			},
			summaryInfoClass() {
				return this.hasAiReportAccess ? '--gpt-info' : '--auto-info';
			},
			summaryInfoText() {
				const key = this.hasAiReportAccess ? 'TIMEMAN_WORK_STATUS_CONTROL_GPT_INFO' : 'TIMEMAN_WORK_STATUS_CONTROL_AUTO_INFO';
				return main_core.Loc.getMessage(key, {
					'#COPILOT_NAME#': this.copilotName
				});
			},
			startTeaserInfoClass() {
				return this.hasAiReportAccess ? '--gpt-info' : '--auto-info';
			},
			startTeaserText() {
				const key = this.hasAiReportAccess ? 'TIMEMAN_WORK_STATUS_CONTROL_PANEL_START_STATE_TEASER' : 'TIMEMAN_WORK_STATUS_CONTROL_PANEL_START_STATE_TEASER_AUTO';
				return main_core.Loc.getMessage(key, {
					'#COPILOT_NAME#': this.copilotName
				});
			},
			titleText() {
				if (this.workStatus === 'PAUSED') {
					return main_core.Loc.getMessage('TIMEMAN_WORK_STATUS_CONTROL_PANEL_STATUS_PAUSED');
				}
				if (this.isClosed) {
					return this.isCanOpen ? main_core.Loc.getMessage('TIMEMAN_WORK_STATUS_CONTROL_PANEL_STATUS_NOT_STARTED') : main_core.Loc.getMessage('TIMEMAN_WORK_STATUS_CONTROL_PANEL_STATUS_CLOSED');
				}
				if (this.workStatus === 'EXPIRED') {
					return main_core.Loc.getMessage('TIMEMAN_WORK_STATUS_CONTROL_PANEL_STATUS_NOT_CLOSED');
				}
				return main_core.Loc.getMessage('TIMEMAN_WORK_STATUS_CONTROL_PANEL_STATUS_STARTED');
			},
			isEditingAvailable() {
				return this.dataId && this.canEdit === 'Y' && !(this.workStatus === 'EXPIRED' && this.reportReq !== 'A');
			},
			isCustomTimeAvailable() {
				return this.canEdit && this.workStatus !== 'PAUSED';
			},
			styleForTimerProps() {
				if (this.workStatus === 'PAUSED') {
					return {
						icon: null,
						status: 'paused'
					};
				}
				if (this.workStatus === 'EXPIRED') {
					return {
						icon: ui_iconSet_api_vue.Outline.ALERT,
						status: 'expired'
					};
				}
				return null;
			},
			buttonStartProps() {
				const buttonId = 'buttonStartDropdownAnchor';
				const buttonText = main_core.Loc.getMessage('TIMEMAN_WORK_STATUS_CONTROL_PANEL_ACTION_START');
				const buttonIcon = ui_iconSet_api_vue.Outline.PLAY_L;
				const buttonStartPropsSingle = {
					id: buttonId,
					text: buttonText,
					icon: buttonIcon,
					dataset: {
						testid: 'timeman-work-status-panel-start-btn'
					},
					onClick: async () => {
						this.openDay(event);
					}
				};
				const buttonStartPropsMulti = {
					id: buttonId,
					text: buttonText,
					icon: buttonIcon,
					dataset: {
						testid: 'timeman-work-status-panel-start-btn'
					},
					menuOptions: {
						id: 'timeman-start-button-context-menu',
						items: [{
							title: main_core.Loc.getMessage('TIMEMAN_WORK_STATUS_CONTROL_PANEL_ACTION_START_SAME'),
							icon: ui_iconSet_api_vue.Outline.PLAY_L,
							onClick: () => {
								this.openDay(event);
							}
						}, {
							title: main_core.Loc.getMessage('TIMEMAN_WORK_STATUS_CONTROL_PANEL_ACTION_START_DIFFERENT'),
							icon: ui_iconSet_api_vue.Outline.EDIT_L,
							onClick: () => {
								const buttonElement = document.getElementById(buttonId);
								if (window.BXTIMEMAN?.WND?.CLOCKWND) {
									window.BXTIMEMAN.WND.CLOCKWND.Clear();
									window.BXTIMEMAN.WND.CLOCKWND = null;
								}
								window.BXTIMEMAN.WND.DATA.STATE = 'CLOSED';

								// one for button text, another for popup positioning
								window.BXTIMEMAN.WND.PARENT.MAIN_BUTTON = buttonElement;
								window.BXTIMEMAN.WND.MAIN_BUTTON = buttonElement;
								window.BXTIMEMAN.WND.ShowClock();
							}
						}]
					},
					onClick: async () => {
						this.openDay(event);
					}
				};
				return this.isCustomTimeAvailable ? buttonStartPropsMulti : buttonStartPropsSingle;
			},
			buttonPauseProps() {
				return {
					text: main_core.Loc.getMessage('TIMEMAN_WORK_STATUS_CONTROL_PANEL_ACTION_PAUSE'),
					icon: ui_iconSet_api_vue.Outline.PAUSE_L,
					style: ui_vue3_components_button.AirButtonStyle.OUTLINE_ACCENT_2,
					dataset: {
						testid: 'timeman-work-status-panel-pause-btn'
					},
					onClick: async () => {
						window.BXTIMEMAN.WND.ACTIONS.PAUSE(event);
					}
				};
			},
			buttonContinueProps() {
				return {
					text: main_core.Loc.getMessage('TIMEMAN_WORK_STATUS_CONTROL_PANEL_ACTION_CONTINUE'),
					icon: ui_iconSet_api_vue.Outline.PLAY_L,
					dataset: {
						testid: 'timeman-work-status-panel-continue-btn'
					},
					onClick: async () => {
						window.BXTIMEMAN.WND.ACTIONS.REOPEN(event);
					}
				};
			},
			buttonStopProps() {
				const buttonId = 'buttonStop';
				const buttonStopStyle = this.workStatus === 'OPENED' ? ui_vue3_components_button.AirButtonStyle.FILLED : ui_vue3_components_button.AirButtonStyle.OUTLINE_ACCENT_2;
				const buttonText = main_core.Loc.getMessage('TIMEMAN_WORK_STATUS_CONTROL_PANEL_ACTION_STOP');
				const buttonIcon = ui_iconSet_api_vue.Outline.POWER;
				const buttonStopPropsSingle = {
					id: buttonId,
					style: buttonStopStyle,
					text: buttonText,
					icon: buttonIcon,
					dataset: {
						testid: 'timeman-work-status-panel-stop-btn'
					},
					onClick: async () => {
						this.closeDay(event);
					}
				};
				const buttonStopPropsMulti = {
					id: buttonId,
					text: buttonText,
					iconLeft: buttonIcon,
					style: buttonStopStyle,
					dataset: {
						testid: 'timeman-work-status-panel-stop-btn'
					},
					menuOptions: {
						id: 'timeman-stop-button-context-menu',
						items: [{
							title: main_core.Loc.getMessage('TIMEMAN_WORK_STATUS_CONTROL_PANEL_ACTION_STOP_SAME'),
							icon: ui_iconSet_api_vue.Outline.POWER,
							onClick: () => {
								this.closeDay(event);
							}
						}, {
							title: main_core.Loc.getMessage('TIMEMAN_WORK_STATUS_CONTROL_PANEL_ACTION_STOP_DIFFERENT'),
							icon: ui_iconSet_api_vue.Outline.EDIT_L,
							onClick: () => {
								if (window.BXTIMEMAN?.WND?.CLOCKWND) {
									window.BXTIMEMAN.WND.CLOCKWND.Clear();
									window.BXTIMEMAN.WND.CLOCKWND = null;
								}
								const buttonElement = this.$el?.querySelector?.(`#${buttonId}`) ?? window.document.getElementById(buttonId);
								// one for button text, another for popup positioning
								window.BXTIMEMAN.WND.PARENT.MAIN_BUTTON = buttonElement;
								window.BXTIMEMAN.WND.MAIN_BUTTON = buttonElement;
								window.BXTIMEMAN.WND.ShowClock();
							}
						}]
					},
					onClick: async () => {
						this.closeDay(event);
					}
				};
				return this.isCustomTimeAvailable ? buttonStopPropsMulti : buttonStopPropsSingle;
			},
			buttonRestartProps() {
				return {
					text: main_core.Loc.getMessage('TIMEMAN_WORK_STATUS_CONTROL_PANEL_ACTION_RESTART'),
					icon: ui_iconSet_api_vue.Outline.REFRESH,
					style: ui_vue3_components_button.AirButtonStyle.OUTLINE_ACCENT_2,
					dataset: {
						testid: 'timeman-work-status-panel-restart-btn'
					},
					onClick: async () => {
						window.BXTIMEMAN.WND.ACTIONS.REOPEN(event);
					}
				};
			},
			buttonOpenPanelProps() {
				return {
					text: main_core.Loc.getMessage('TIMEMAN_WORK_STATUS_CONTROL_PANEL_VIEW_RESULTS'),
					id: 'buttonOpenPanel',
					style: this.hasAiReportAccess ? ui_vue3_components_button.AirButtonStyle.FILLED_BITRIX_GPT : ui_vue3_components_button.AirButtonStyle.FILLED,
					dataset: {
						testid: 'timeman-work-status-panel-view-results-btn'
					},
					onClick: () => {
						this.handleClickTimemanOpener();
					}
				};
			},
			buttonViewPlanProps() {
				return {
					id: 'buttonViewPlan',
					text: main_core.Loc.getMessage('TIMEMAN_WORK_STATUS_CONTROL_PANEL_ACTION_VIEW_PLAN'),
					style: this.hasAiReportAccess ? ui_vue3_components_button.AirButtonStyle.FILLED_BITRIX_GPT : ui_vue3_components_button.AirButtonStyle.FILLED,
					dataset: {
						testid: 'timeman-work-status-panel-view-plan-btn'
					},
					onClick: () => {
						this.handleClickViewPlan();
					}
				};
			},
			buttonFinishExpiredProps() {
				const buttonId = 'buttonFinishExpired';
				return {
					id: buttonId,
					text: main_core.Loc.getMessage('TIMEMAN_WORK_STATUS_CONTROL_PANEL_ACTION_FINISH_EXPIRED'),
					icon: ui_iconSet_api_vue.Outline.ALERT_ACCENT,
					style: ui_vue3_components_button.AirButtonStyle.TINTED_ALERT,
					onClick: async () => {
						if (window.BXTIMEMAN?.WND?.CLOCKWND) {
							window.BXTIMEMAN.WND.CLOCKWND.Clear();
							window.BXTIMEMAN.WND.CLOCKWND = null;
						}
						const buttonElement = window.document.getElementById(buttonId);
						// one for button text, another for popup positioning
						window.BXTIMEMAN.WND.PARENT.MAIN_BUTTON = buttonElement;
						window.BXTIMEMAN.WND.MAIN_BUTTON = buttonElement;
						window.BXTIMEMAN.WND.ACTIONS.CLOSE(event);
					}
				};
			},
			// control buttons end

			actions() {
				const actionItems = [];
				if (this.isStartStateActive && !this.hideOpener) {
					actionItems.push(this.buttonPauseProps, this.buttonViewPlanProps);
				} else if (this.workStatus === 'OPENED') {
					actionItems.push(this.buttonPauseProps);
					actionItems.push(this.buttonStopProps);
				}
				if (this.workStatus === 'PAUSED') {
					actionItems.push(this.buttonContinueProps);
					actionItems.push(this.buttonStopProps);
				}
				if (this.isClosed) {
					if (this.isCanOpen) {
						actionItems.push(this.buttonStartProps);
					} else {
						actionItems.push(this.buttonRestartProps);
						if (this.isReportsEnabled && !this.hideOpenPanelButton) {
							actionItems.push(this.buttonOpenPanelProps);
						}
					}
				}
				if (this.workStatus === 'EXPIRED') {
					actionItems.push(this.buttonFinishExpiredProps);
				}
				return actionItems;
			}
		},
		created() {
			// non-reactive references to popup initiators for focus restoration
			this.reportOpenerInitiator = null;
			this.planOpenerInitiator = null;
		},
		watch: {
			isStartStateActive() {
				// the "View plan" button is a disclosure control; expose its
				// popup semantics as soon as it is rendered
				this.$nextTick(() => {
					this.setPlanButtonExpanded(this.planPopupOpen);
				});
			}
		},
		mounted() {
			// prevent timeman init without bindOptions for new users on OpenDay event
			this.checkBindOptions();
			this.updateDayState();
			this.updateWorkingDayTimer();
			this.$nextTick(() => {
				this.setPlanButtonExpanded(this.planPopupOpen);
			});
			setInterval(() => {
				this.updateWorkingDayTimer();
			}, 1000);
			main_core_events.EventEmitter.subscribe('onTimeManDataRecieved', this.handleTimemanDataRecieved);
			main_core_events.EventEmitter.subscribe('onPlannerDataRecieved', this.handleTimemanDataRecieved);
			main_core_events.EventEmitter.subscribe('onTimeManNeedRebuild', this.handleTimemanDataRecieved);
			main_core_events.EventEmitter.subscribe('onTopPanelCollapse', this.handleTimemanDataRecieved);
			main_core_events.EventEmitter.subscribe('onTimeManWindowBuild', this.handleTimemanDataRecieved);
			main_core_events.EventEmitter.subscribe('onTimemanInit', this.handleTimemanDataRecieved);
		},
		beforeUnmount() {},
		unmounted() {},
		methods: {
			convertMillisecondsToHrMinSec(time) {
				const timeFullSeconds = Math.ceil(time / 1000);
				const hours = Math.floor(timeFullSeconds / 3600);
				const minutes = Math.floor(timeFullSeconds / 60) - hours * 60;
				const seconds = timeFullSeconds - minutes * 60 - hours * 3600;
				return {
					hours,
					minutes,
					seconds
				};
			},
			timeNumToDoubleDigitString(num) {
				return num > 9 ? String(num) : ('00' + num).slice(-2);
			},
			getDataId() {
				return window.BXTIMEMAN.DATA.ID || '';
			},
			getWorkStatus() {
				return window.BXTIMEMAN.DATA.STATE || '';
			},
			getReportReq() {
				return window.BXTIMEMAN.DATA.REPORT_REQ || '';
			},
			getCanOpen() {
				return window.BXTIMEMAN.DATA.CAN_OPEN || '';
			},
			getCanOpenAndRelaunch() {
				return window.BXTIMEMAN.DATA.CAN_OPEN_AND_RELAUNCH || '';
			},
			getCanEdit() {
				return window.BXTIMEMAN.DATA.CAN_EDIT || '';
			},
			getDateStart() {
				// Absolute start anchor (not wall-coordinate DATE_START): used both as the
				// timer origin and by isStartState's "< 1h after start" window.
				return parseInt(window.BXTIMEMAN?.DATA?.INFO?.DISPLAY_START_TIMESTAMP, 10) * 1000 || 0;
			},
			setBindOptions() {
				window.BXTIMEMAN.setBindOptions({
					node: this.$refs.reportOpener,
					mode: 'popup',
					popupOptions: {
						autoHide: true,
						angle: false,
						offsetTop: -40,
						closeByEsc: true,
						bindOptions: {
							forceBindPosition: true,
							forceTop: true,
							forceLeft: false
						},
						events: {
							onShow: () => {
								this.reportOpening = false;
								this.reportPopupOpen = true;
							},
							onClose: () => {
								this.reportPopupOpen = false;
								this.restoreFocusToReportOpener();
							},
							onDestroy: () => {}
						},
						fixed: true
					}
				});
			},
			checkBindOptions() {
				if (window.BXTIMEMAN.WND.bindOptions.mode !== 'popup') {
					this.setBindOptions();
				}
			},
			updateDayState() {
				this.dataId = this.getDataId();
				this.workStatus = this.getWorkStatus();
				this.reportReq = this.getReportReq();
				this.canOpen = this.getCanOpen();
				this.canOpenAndRelaunch = this.getCanOpenAndRelaunch();
				this.canEdit = this.getCanEdit();
			},
			updateDayStateIfNewHour() {
				const currentHour = new Date().getHours();
				if (currentHour !== this.lastProcessedHour) {
					window.BXTIMEMAN.Update();
					this.lastProcessedHour = currentHour;
				}
			},
			updateWorkingDayTimer() {
				const dateNow = Date.now();
				this.currentTimestamp = dateNow;
				const timerInfo = {
					...window.BXTIMEMAN.DATA.INFO
				};
				this.updateDayStateIfNewHour();
				const {
					workingDayMs,
					pauseMs
				} = computeWorkdayTimers({
					workStatus: this.workStatus,
					canOpen: this.canOpen,
					isCanOpen: this.isCanOpen,
					dateStartMs: this.getDateStart(),
					dateStopMs: parseInt(timerInfo.DISPLAY_STOP_TIMESTAMP, 10) * 1000 || 0,
					durationMs: parseInt(timerInfo.DURATION, 10) * 1000 || 0,
					timeLeaksMs: parseInt(timerInfo.TIME_LEAKS, 10) * 1000 || 0,
					nowMs: dateNow
				});
				this.timerWorkingDayValue = workingDayMs;
				this.timerPauseValue = pauseMs;
			},
			openDay(event) {
				window.BXTIMEMAN.WND.ACTIONS.OPEN(event);
			},
			closeDay(event) {
				window.BXTIMEMAN.WND.ACTIONS.CLOSE(event);
			},
			// handlers

			handleTimemanDataRecieved() {
				this.updateDayState();
				this.updateWorkingDayTimer();
			},
			handleClickTimerEditorOpener() {
				window.BXTIMEMAN.WND.ShowEditVue(event.target);
			},
			handleClickTimemanOpener() {
				if (this.reportOpening) {
					return;
				}
				if (window.BXTIMEMAN?.WND?.isShown()) {
					window.BXTIMEMAN.WND.Hide();
					// keep aria-expanded in sync immediately; do not rely solely on the onClose event
					this.reportPopupOpen = false;
					return;
				}

				// remember initiator to restore focus when the popup closes
				this.reportOpenerInitiator = this.$refs.reportOpener ?? null;
				this.reportOpening = true;
				this.reportPopupOpen = true;
				if (!this.isReportsEnabled) {
					const chevron = this.$refs.reportOpener;
					if (chevron && window.BXTIMEMAN?.WND) {
						window.BXTIMEMAN.WND.MAIN_BUTTON = chevron;
						if (window.BXTIMEMAN.WND.PARENT) {
							window.BXTIMEMAN.WND.PARENT.MAIN_BUTTON = chevron;
						}
					}
					window.BXTIMEMAN.Open();
					this.reportOpening = false;
					return;
				}
				new timeman_workTimeReport.WorkTimeReport().open(timeman_workTimeReport.ReportMode.DAILY, {
					recordId: Number(window.BXTIMEMAN?.DATA?.ID ?? 0),
					bindElement: document.querySelector('[data-id="bx-avatar-widget"]'),
					width: 390,
					offsetTop: -50,
					offsetLeft: 0,
					fixed: true,
					closeIcon: false,
					autoHide: true,
					inProgress: !this.isClosed,
					onClose: () => {
						this.reportOpening = false;
						this.reportPopupOpen = false;
						this.restoreFocusToReportOpener();
					}
				});
			},
			handleClickViewPlan() {
				if (this.planOpening) {
					return;
				}

				// remember initiator to restore focus when the popup closes
				this.planOpenerInitiator = document.getElementById('buttonViewPlan');
				this.planOpening = true;
				this.planPopupOpen = true;
				this.setPlanButtonExpanded(true);
				new timeman_workTimeReport.WorkTimeReport().open(timeman_workTimeReport.ReportMode.PLAN, {
					bindElement: document.querySelector('[data-id="bx-avatar-widget"]'),
					width: 390,
					offsetTop: -50,
					offsetLeft: 0,
					fixed: true,
					closeIcon: false,
					autoHide: true,
					onClose: () => {
						this.planOpening = false;
						this.planPopupOpen = false;
						this.setPlanButtonExpanded(false);
						this.restoreFocusToPlanButton();
					}
				});
			},
			restoreFocusToReportOpener() {
				const initiator = this.reportOpenerInitiator ?? this.$refs.reportOpener;
				if (initiator && typeof initiator.focus === 'function') {
					initiator.focus();
				}
				this.reportOpenerInitiator = null;
			},
			restoreFocusToPlanButton() {
				const initiator = this.planOpenerInitiator ?? document.getElementById('buttonViewPlan');
				if (initiator && typeof initiator.focus === 'function') {
					initiator.focus();
				}
				this.planOpenerInitiator = null;
			},
			// UiButton renders the native button imperatively and does not forward
			// aria-* props, so disclosure attributes are set on the DOM node directly
			setPlanButtonExpanded(isExpanded) {
				const button = document.getElementById('buttonViewPlan');
				if (!button) {
					return;
				}
				button.setAttribute('aria-haspopup', 'dialog');
				button.setAttribute('aria-expanded', isExpanded ? 'true' : 'false');
			},
			// handlers end

			getControlButtonComponent(action) {
				const isButtonSplit = Boolean(action.menuOptions);
				const ControlButtonComponent = isButtonSplit ? ButtonTextDropdown : ui_vue3_components_button.Button;
				return ControlButtonComponent;
			}
		},
		template: `
		<div :class="['tm-control-panel', this.statusModifierClass, this.reportStyleModifierClass]">
			<div class="tm-control-panel__info">
				<div
					:class="[
						'tm-control-panel__timer',
						'tm-timer',
						this.styleForTimerProps?.status ? ('tm-timer_' + this.styleForTimerProps.status) : null,
					]"
				>
					<div
						v-if="this.styleForTimerProps?.icon"
						class="tm-timer__visual"
					>
						<BIcon
							class="tm-timer__visual-img"
							:name="this.styleForTimerProps.icon"
						/>
					</div>
					<p class="tm-timer__title">{{ this.titleText }}</p>
					<Clock
						:time="timerWorkingDayValue"
					/>
					<button
						v-if="isEditingAvailable && (!this.isStartStateActive || this.hideOpener)"
						type="button"
						class="tm-timer__editor-opener"
						data-testid="timeman-work-status-panel-edit-time-btn"
						:aria-label="Loc.getMessage('TIMEMAN_WORK_STATUS_CONTROL_PANEL_ARIA_EDIT_TIME')"
						@click="handleClickTimerEditorOpener"
					>
						<BIcon
							class="tm-timer__editor-opener-img"
							:size="16"
							:name="Outline.EDIT_L"
							aria-hidden="true"
						/>
					</button>
					<button
						v-if="this.isStartStateActive && !this.hideOpener"
						ref="reportOpener"
						type="button"
						class="tm-control-panel__widget-opener tm-control-panel__more-opener"
						:class="{'tm-control-panel__widget-opener_loading': reportOpening}"
						data-testid="timeman-work-status-panel-report-opener"
						:aria-label="Loc.getMessage('TIMEMAN_WORK_STATUS_CONTROL_PANEL_ARIA_OPEN_REPORT')"
						aria-haspopup="dialog"
						:aria-expanded="this.reportPopupOpen ? 'true' : 'false'"
						@click="this.handleClickTimemanOpener"
					>
						<BIcon
							class="tm-control-panel__widget-opener-img"
							:size="22"
							:name="Outline.MORE_M"
							aria-hidden="true"
						/>
					</button>
				</div>
				<div
					v-if="(!this.isReportsEnabled || !this.isClosed) && !this.hideOpener && !this.isStartStateActive"
					class="tm-control-panel__widget-opener-container"
				>
					<button
						ref="reportOpener"
						type="button"
						class="tm-control-panel__widget-opener"
						:class="{'tm-control-panel__widget-opener_loading': reportOpening}"
						data-testid="timeman-work-status-panel-report-opener"
						:aria-label="Loc.getMessage('TIMEMAN_WORK_STATUS_CONTROL_PANEL_ARIA_OPEN_DETAILS')"
						aria-haspopup="dialog"
						:aria-expanded="this.reportPopupOpen ? 'true' : 'false'"
						@click="this.handleClickTimemanOpener"
					>
						<BIcon
							class="tm-control-panel__widget-opener-img"
							:size="22"
							:name="Outline.CHEVRON_RIGHT_L"
							aria-hidden="true"
						/>
					</button>
				</div>
			</div>
			<div
				v-if="this.isStartStateActive && !this.hideOpener"
				:class="['tm-control-panel__info', this.startTeaserInfoClass]"
				role="status"
				aria-live="polite"
				v-html="this.startTeaserText"
			></div>
			<div
				v-if="this.isClosed && !this.isCanOpen && this.isReportsEnabled"
				:class="['tm-control-panel__info', this.summaryInfoClass]"
				v-html="this.summaryInfoText"
			></div>
			<div
				v-if="Boolean(this.timerPauseValue)"
				class="tm-control-panel__info tm-control-panel__info_pause"
			>
				<div
					:class="[
						'tm-control-panel__timer',
						'tm-control-panel__timer_pause',
						'tm-timer',
						this.styleForTimerProps?.status ? ('tm-timer_' + this.styleForTimerProps.status) : null,
					]"
				>
					<p class="tm-timer__title">{{ Loc.getMessage('TIMEMAN_WORK_STATUS_CONTROL_PANEL_NOTE_PAUSE_LENGTH') }}</p>
					<Clock
						:time="timerPauseValue"
					/>
				</div>
			</div>
			<ul class="tm-control-panel__actions-list">
				<li
					v-for="action in this.actions"
					:key="action.text"
					class="tm-control-panel__actions-item"
				>
					<component
						:is="getControlButtonComponent(action)"
						:key="
							action.style
							+ action.iconLeft
							+ action.icon
							+ action.text
							+ action.id
						"
						class="tm-control-panel__action"
						:size="ButtonSize.MEDIUM"
						:wide="true"
						:id="action.id"
						:text="action.text"
						:style="action.style"
						:style-name="action.style"
						:icon-left="action.iconLeft"
						:left-icon="action.icon"
						:menuOptions="action.menuOptions"
						@click="action.onClick"
					/>
				</li>
			</ul>
		</div>
	`
	};

	window.BX?.Runtime?.loadExtension?.('stafftrack.checkin-onboarding-banner')?.catch?.(() => {});
	class WorkStatusControlPanel {
		#data = {};
		#timemanInstantContainerNode;
		constructor() {
			const settings = main_core.Extension.getSettings('timeman.work-status-control-panel');
			this.#data.workReport = settings.get('workReport');
			this.#data.info = settings.get('info');
			this.#data.siteId = settings.get('siteId');
			this.#data.isReportsEnabled = Boolean(settings.get('isReportsEnabled'));
			this.#data.hasAiReportAccess = Boolean(settings.get('hasAiReportAccess'));
			this.#timemanInstantContainerNode = main_core.Tag.render`
			<div class="timeman-instant-container"></div>
		`;
			main_core_events.EventEmitter.subscribe('onTimemanInit', this.#init.bind(this));
			main_core_events.EventEmitter.subscribe('onTimeManDataRecieved', this.#updateState.bind(this));
			if (!window.BXTIMEMAN) {
				window.BX.timeman('bx_tm', this.#data.info, this.#data.siteId);
			}
		}
		#mountApplication(container, props = {}) {
			const application = ui_vue3.BitrixVue.createApp(App, props);
			application.mount(container);
		}
		#init() {
			window.BXTIMEMAN.initFormWeekly(this.#data.workReport);
		}
		#updateState(baseEvent) {
			const [data] = baseEvent.getCompatData();
			this.#data.info = data;
		}
		renderWorkStatusControlPanel(options = {}) {
			event?.stopPropagation?.();
			this.#mountApplication(this.#timemanInstantContainerNode, {
				...options,
				isReportsEnabled: this.#data.isReportsEnabled,
				hasAiReportAccess: this.#data.hasAiReportAccess
			});
			return main_core.Tag.render`
			${this.#timemanInstantContainerNode}
		`;
		}
	}

	exports.WorkStatusControlPanel = WorkStatusControlPanel;

})(this.BX.Timeman = this.BX.Timeman || {}, BX, BX.Event, BX.Vue3, BX, BX, BX, BX, BX, BX, BX, BX, BX, BX.UI.IconSet, BX.Vue3.Components, BX.UI.System.Skeleton.Vue, BX.Timeman, BX.Main, BX.UI, BX.UI.System.Menu);
//# sourceMappingURL=work-status-control-panel.bundle.js.map
