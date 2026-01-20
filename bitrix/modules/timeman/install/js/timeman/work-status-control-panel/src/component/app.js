import { Loc } from 'main.core';
import { EventEmitter } from 'main.core.events';
import { BIcon, Outline } from 'ui.icon-set.api.vue';
import {
	Button as UiButton,
	AirButtonStyle,
	ButtonSize,
} from 'ui.vue3.components.button';
import { BLine } from 'ui.system.skeleton.vue';

import { ButtonTextDropdown as UIButtonTextDropdown } from './button-split/button-split';
import { Clock } from './clock/clock';
import './app.css';


// @vue/component
export const App = {
	name: 'WorkStatusControlPanel',
	components: {
		UiButton,
		UIButtonTextDropdown,
		BIcon,
		Clock,
		BLine,
	},
	provide(): Object
	{
		return {};
	},
	props: {},
	setup(): Object
	{
		return {
			ButtonSize,
			Outline,
			Loc,
		};
	},
	data(): Object
	{
		return {
			dataId: '',
			workStatus: '',
			reportReq: '',
			canOpen: '',
			canOpenAndRelaunch: '',
			canEdit: '',
			reportOpening: false,
			timerWorkingDayValue: 0,
			timerPauseValue: 0,
			lastProcessedHour: -1,
		};
	},
	computed: {

		titleText(): string
		{
			if (this.workStatus === 'PAUSED')
			{
				return Loc.getMessage('TIMEMAN_WORK_STATUS_CONTROL_PANEL_STATUS_PAUSED');
			}

			if (this.workStatus === 'CLOSED')
			{
				return this.canOpen === 'OPEN'
					? Loc.getMessage('TIMEMAN_WORK_STATUS_CONTROL_PANEL_STATUS_NOT_STARTED')
					: Loc.getMessage('TIMEMAN_WORK_STATUS_CONTROL_PANEL_STATUS_CLOSED');
			}

			if (this.workStatus === 'EXPIRED')
			{
				return Loc.getMessage('TIMEMAN_WORK_STATUS_CONTROL_PANEL_STATUS_NOT_CLOSED');
			}

			return Loc.getMessage('TIMEMAN_WORK_STATUS_CONTROL_PANEL_STATUS_STARTED');
		},

		isEditingAvailable(): boolean
		{
			return (this.dataId && this.canEdit === 'Y' && !(this.workStatus === 'EXPIRED' && this.reportReq !== 'A'));
		},

		isCustomTimeAvailable(): boolean
		{
			return this.canEdit && this.workStatus !== 'PAUSED';
		},

		styleForTimerProps(): string
		{
			if (this.workStatus === 'PAUSED')
			{
				return {
					icon: null,
					status: 'paused',
				};
			}

			if (this.workStatus === 'EXPIRED')
			{
				return {
					icon: Outline.ALERT,
					status: 'expired',
				};
			}

			return null;
		},


		// control buttons

		buttonStartProps(): any
		{
			const buttonId = 'buttonStartDropdownAnchor';
			const buttonText = Loc.getMessage('TIMEMAN_WORK_STATUS_CONTROL_PANEL_ACTION_START');
			const buttonIcon = Outline.PLAY_L;

			const buttonStartPropsSingle = {
				id: buttonId,
				text: buttonText,
				icon: buttonIcon,
				onClick: async (): void => {
					this.openDay(event);
				},
			};

			const buttonStartPropsMulti = {
				id: buttonId,
				text: buttonText,
				icon: buttonIcon,
				menuOptions: {
					id: 'timeman-start-button-context-menu',
					items: [
						{
							title: Loc.getMessage('TIMEMAN_WORK_STATUS_CONTROL_PANEL_ACTION_START_SAME'),
							icon: Outline.PLAY_L,
							onClick: () => {
								this.openDay(event);
							},
						},
						{
							title: Loc.getMessage('TIMEMAN_WORK_STATUS_CONTROL_PANEL_ACTION_START_DIFFERENT'),
							icon: Outline.EDIT_L,
							onClick: () => {
								const buttonElement = document.getElementById(buttonId);

								if (window.BXTIMEMAN?.WND?.CLOCKWND)
								{
									window.BXTIMEMAN.WND.CLOCKWND.Clear();
									window.BXTIMEMAN.WND.CLOCKWND = null;
								}

								window.BXTIMEMAN.WND.DATA.STATE = 'CLOSED';

								// one for button text, another for popup positioning
								window.BXTIMEMAN.WND.PARENT.MAIN_BUTTON = buttonElement;
								window.BXTIMEMAN.WND.MAIN_BUTTON = buttonElement;

								window.BXTIMEMAN.WND.ShowClock();
							},
						},
					],
				},
				onClick: async (): void => {
					this.openDay(event);
				},
			};

			return this.isCustomTimeAvailable ? buttonStartPropsMulti : buttonStartPropsSingle;
		},

		buttonPauseProps(): any
		{
			return {
				text: Loc.getMessage('TIMEMAN_WORK_STATUS_CONTROL_PANEL_ACTION_PAUSE'),
				icon: Outline.PAUSE_L,
				style: AirButtonStyle.OUTLINE_ACCENT_2,
				onClick: async (): void => {
					window.BXTIMEMAN.WND.ACTIONS.PAUSE(event);
				},
			};
		},

		buttonContinueProps(): any
		{
			return {
				text: Loc.getMessage('TIMEMAN_WORK_STATUS_CONTROL_PANEL_ACTION_CONTINUE'),
				icon: Outline.PLAY_L,
				onClick: async (): void => {
					window.BXTIMEMAN.WND.ACTIONS.REOPEN(event);
				},
			};
		},

		buttonStopProps(): any
		{
			const buttonId = 'buttonStop';
			const buttonStopStyle = (this.workStatus === 'OPENED')
				? AirButtonStyle.FILLED
				: AirButtonStyle.OUTLINE_ACCENT_2;
			const buttonText = Loc.getMessage('TIMEMAN_WORK_STATUS_CONTROL_PANEL_ACTION_STOP');
			const buttonIcon = Outline.POWER;

			const buttonStopPropsSingle = {
				id: buttonId,
				style: buttonStopStyle,
				text: buttonText,
				icon: buttonIcon,
				onClick: async (): void => {
					this.closeDay(event);
				},
			};

			const buttonStopPropsMulti = {
				id: buttonId,
				text: buttonText,
				iconLeft: buttonIcon,
				style: buttonStopStyle,
				menuOptions: {
					id: 'timeman-stop-button-context-menu',
					items: [
						{
							title: Loc.getMessage('TIMEMAN_WORK_STATUS_CONTROL_PANEL_ACTION_STOP_SAME'),
							icon: Outline.POWER,
							onClick: () => {
								this.closeDay(event);
							},
						},
						{
							title: Loc.getMessage('TIMEMAN_WORK_STATUS_CONTROL_PANEL_ACTION_STOP_DIFFERENT'),
							icon: Outline.EDIT_L,
							onClick: () => {
								if (window.BXTIMEMAN?.WND?.CLOCKWND)
								{
									window.BXTIMEMAN.WND.CLOCKWND.Clear();
									window.BXTIMEMAN.WND.CLOCKWND = null;
								}

								const buttonElement = window.document.getElementById(buttonId);
								// one for button text, another for popup positioning
								window.BXTIMEMAN.WND.PARENT.MAIN_BUTTON = buttonElement;
								window.BXTIMEMAN.WND.MAIN_BUTTON = buttonElement;

								window.BXTIMEMAN.WND.ShowClock();
							},
						},
					],
				},
				onClick: async (): void => {
					this.closeDay(event);
				},
			};

			return this.isCustomTimeAvailable ? buttonStopPropsMulti : buttonStopPropsSingle;
		},

		buttonRestartProps(): any
		{
			return {
				text: Loc.getMessage('TIMEMAN_WORK_STATUS_CONTROL_PANEL_ACTION_RESTART'),
				icon: Outline.REFRESH,
				style: AirButtonStyle.OUTLINE_ACCENT_2,
				onClick: async (): void => {
					window.BXTIMEMAN.WND.ACTIONS.REOPEN(event);
				},
			};
		},

		buttonFinishExpiredProps(): any
		{
			const buttonId = 'buttonFinishExpired';

			return {
				id: buttonId,
				text: Loc.getMessage('TIMEMAN_WORK_STATUS_CONTROL_PANEL_ACTION_FINISH_EXPIRED'),
				icon: Outline.ALERT_ACCENT,
				style: AirButtonStyle.TINTED_ALERT,
				onClick: async (): void => {
					if (window.BXTIMEMAN?.WND?.CLOCKWND)
					{
						window.BXTIMEMAN.WND.CLOCKWND.Clear();
						window.BXTIMEMAN.WND.CLOCKWND = null;
					}

					const buttonElement = window.document.getElementById(buttonId);
					// one for button text, another for popup positioning
					window.BXTIMEMAN.WND.PARENT.MAIN_BUTTON = buttonElement;
					window.BXTIMEMAN.WND.MAIN_BUTTON = buttonElement;

					window.BXTIMEMAN.WND.ACTIONS.CLOSE(event);
				},
			};
		},

		// control buttons end

		actions(): any[]
		{
			const actionItems = [];

			if (this.workStatus === 'OPENED')
			{
				actionItems.push(this.buttonPauseProps);
				actionItems.push(this.buttonStopProps);
			}

			if (this.workStatus === 'PAUSED')
			{
				actionItems.push(this.buttonContinueProps);
				actionItems.push(this.buttonStopProps);
			}

			if (this.workStatus === 'CLOSED')
			{
				if (this.canOpen === 'OPEN')
				{
					actionItems.push(this.buttonStartProps);
				}
				else
				{
					actionItems.push(this.buttonRestartProps);
				}
			}

			if (this.workStatus === 'EXPIRED')
			{
				actionItems.push(this.buttonFinishExpiredProps);
			}

			return actionItems;
		},
	},
	watch: {},
	mounted(): void
	{
		this.updateDayState();
		this.updateWorkingDayTimer();
		setInterval(() => {
			this.updateWorkingDayTimer();
		}, 1000);

		EventEmitter.subscribe('onTimeManDataRecieved', this.handleTimemanDataRecieved);
		EventEmitter.subscribe('onPlannerDataRecieved', this.handleTimemanDataRecieved);
		EventEmitter.subscribe('onTimeManNeedRebuild', this.handleTimemanDataRecieved);
		EventEmitter.subscribe('onTopPanelCollapse', this.handleTimemanDataRecieved);
		EventEmitter.subscribe('onTimeManWindowBuild', this.handleTimemanDataRecieved);
		EventEmitter.subscribe('onTimemanInit', this.handleTimemanDataRecieved);
	},
	beforeUnmount(): void
	{},
	unmounted(): void
	{},
	methods: {
		convertMillisecondsToHrMinSec(time: number): any
		{
			const timeFullSeconds = Math.ceil(time / 1000);
			const hours = Math.floor(timeFullSeconds / 3600);
			const minutes = Math.floor(timeFullSeconds / 60) - (hours * 60);
			const seconds = timeFullSeconds - (minutes * 60) - (hours * 3600);

			return {
				hours,
				minutes,
				seconds,
			};
		},

		timeNumToDoubleDigitString(num): string
		{
			return num > 9 ? String(num) : ('00' + num).slice(-2);
		},

		getDataId(): any
		{
			return window.BXTIMEMAN.DATA.ID || '';
		},

		getWorkStatus(): any
		{
			return window.BXTIMEMAN.DATA.STATE || '';
		},

		getReportReq(): any
		{
			return window.BXTIMEMAN.DATA.REPORT_REQ || '';
		},

		getCanOpen(): any
		{
			return window.BXTIMEMAN.DATA.CAN_OPEN || '';
		},

		getCanOpenAndRelaunch(): any
		{
			return window.BXTIMEMAN.DATA.CAN_OPEN_AND_RELAUNCH || '';
		},

		getCanEdit(): any
		{
			return window.BXTIMEMAN.DATA.CAN_EDIT || '';
		},

		updateDayState(): any
		{
			this.dataId = this.getDataId();
			this.workStatus = this.getWorkStatus();
			this.reportReq = this.getReportReq();
			this.canOpen = this.getCanOpen();
			this.canOpenAndRelaunch = this.getCanOpenAndRelaunch();
			this.canEdit = this.getCanEdit();
		},

		updateDayStateIfNewHour(): void
		{
			const currentHour = new Date().getHours();

			if (currentHour !== this.lastProcessedHour)
			{
				window.BXTIMEMAN.Update();

				this.lastProcessedHour = currentHour;
			}
		},

		updateWorkingDayTimer()
		{
			const dateNow = Date.now();
			const timerInfo = { ...window.BXTIMEMAN.DATA.INFO };
			const dateStart = parseInt(timerInfo.DATE_START) * 1000;
			const dateWorkingDayStopped = parseInt(timerInfo.DATE_FINISH) * 1000;
			const timeTimeLeaks = parseInt(timerInfo.TIME_LEAKS) * 1000;
			const delta = dateNow - dateStart;
			const deltaPast = dateWorkingDayStopped - dateStart;
			const deltaPause = dateNow - dateWorkingDayStopped;

			this.updateDayStateIfNewHour();

			if (this.workStatus === 'CLOSED')
			{
				if (this.canOpen === 'OPEN')
				{
					this.timerWorkingDayValue = 0;
					this.timerPauseValue = 0;
				}
				else if (this.canOpen === 'REOPEN')
				{
					this.timerWorkingDayValue = deltaPast - timeTimeLeaks;
					this.timerPauseValue = timeTimeLeaks;
				}
			}
			else if (this.workStatus === 'OPENED')
			{
				this.timerWorkingDayValue = delta - timeTimeLeaks;
				this.timerPauseValue = timeTimeLeaks;
			}
			else if (this.workStatus === 'PAUSED')
			{
				this.timerWorkingDayValue = deltaPast - timeTimeLeaks;
				this.timerPauseValue = deltaPause + timeTimeLeaks;
			}
			else if (this.workStatus === 'EXPIRED')
			{
				this.timerWorkingDayValue = delta - timeTimeLeaks;
				this.timerPauseValue = timeTimeLeaks;
			}
		},

		openDay(event): any
		{
			window.BXTIMEMAN.WND.ACTIONS.OPEN(event);
		},

		closeDay(event): any
		{
			window.BXTIMEMAN.WND.ACTIONS.CLOSE(event);
		},

		// handlers

		handleTimemanDataRecieved(): any
		{
			this.updateDayState();
			this.updateWorkingDayTimer();
		},

		handleClickTimerEditorOpener(): any
		{
			window.BXTIMEMAN.WND.ShowEditVue(event.target);
		},

		handleClickTimemanOpener(): void
		{
			if (this.reportOpening)
			{
				return;
			}

			if (window.BXTIMEMAN.WND?.isShown())
			{
				window.BXTIMEMAN.WND.Hide();

				return;
			}
			else
			{
				this.reportOpening = true;

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
							forceLeft: false,
						},
						events: {
							onShow: () => {
								this.reportOpening = false;
							},
							onClose: () => {},
							onDestroy: () => {},
						},
						fixed: true,
					},
				});

				window.BXTIMEMAN.Open();
			}
		},

		// handlers end

		getControlButtonComponent(action): Object
		{
			const isButtonSplit = Boolean(action.menuOptions);
			const ControlButtonComponent = isButtonSplit ? UIButtonTextDropdown : UiButton;

			return ControlButtonComponent;
		},

	},
	template: `
		<div class="tm-control-panel">
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
						v-if="isEditingAvailable"
						class="tm-timer__editor-opener"
						@click="handleClickTimerEditorOpener"
					>
						<BIcon
							class="tm-timer__editor-opener-img"
							:size="16"
							:name="Outline.EDIT_L"
						/>
					</button>
				</div>
				<div class="tm-control-panel__widget-opener-container">
					<span
						ref="reportOpener"
						class="tm-control-panel__widget-opener"
						:class="{'tm-control-panel__widget-opener_loading': reportOpening}"
						@click="this.handleClickTimemanOpener"
					>
<!--						{{ Loc.getMessage('TIMEMAN_WORK_STATUS_CONTROL_PANEL_ACTION_OPEN_PLAN') }}-->
						<BIcon
							class="tm-control-panel__widget-opener-img"
							:size="22"
							:name="Outline.CHEVRON_RIGHT_L"
						/>
					</span>
				</div>
			</div>
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
	`,
};
