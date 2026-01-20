/* eslint-disable */
this.BX = this.BX || {};
(function (exports,ui_vue3,timeman,CJSTask,planner,tasks_planner_handler,calendar_planner_handler,ajax,timer,popup,ls,main_core_events,ui_vue3_components_button,ui_system_skeleton_vue,main_core,main_popup,ui_buttons,ui_iconSet_api_vue,ui_system_menu_vue) {
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
	  mounted() {},
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
	  props: {},
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
	      timerWorkingDayValue: 0,
	      timerPauseValue: 0,
	      lastProcessedHour: -1
	    };
	  },
	  computed: {
	    titleText() {
	      if (this.workStatus === 'PAUSED') {
	        return main_core.Loc.getMessage('TIMEMAN_WORK_STATUS_CONTROL_PANEL_STATUS_PAUSED');
	      }
	      if (this.workStatus === 'CLOSED') {
	        return this.canOpen === 'OPEN' ? main_core.Loc.getMessage('TIMEMAN_WORK_STATUS_CONTROL_PANEL_STATUS_NOT_STARTED') : main_core.Loc.getMessage('TIMEMAN_WORK_STATUS_CONTROL_PANEL_STATUS_CLOSED');
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
	    // control buttons

	    buttonStartProps() {
	      const buttonId = 'buttonStartDropdownAnchor';
	      const buttonText = main_core.Loc.getMessage('TIMEMAN_WORK_STATUS_CONTROL_PANEL_ACTION_START');
	      const buttonIcon = ui_iconSet_api_vue.Outline.PLAY_L;
	      const buttonStartPropsSingle = {
	        id: buttonId,
	        text: buttonText,
	        icon: buttonIcon,
	        onClick: async () => {
	          this.openDay(event);
	        }
	      };
	      const buttonStartPropsMulti = {
	        id: buttonId,
	        text: buttonText,
	        icon: buttonIcon,
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
	              var _window$BXTIMEMAN, _window$BXTIMEMAN$WND;
	              const buttonElement = document.getElementById(buttonId);
	              if ((_window$BXTIMEMAN = window.BXTIMEMAN) != null && (_window$BXTIMEMAN$WND = _window$BXTIMEMAN.WND) != null && _window$BXTIMEMAN$WND.CLOCKWND) {
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
	        onClick: async () => {
	          window.BXTIMEMAN.WND.ACTIONS.PAUSE(event);
	        }
	      };
	    },
	    buttonContinueProps() {
	      return {
	        text: main_core.Loc.getMessage('TIMEMAN_WORK_STATUS_CONTROL_PANEL_ACTION_CONTINUE'),
	        icon: ui_iconSet_api_vue.Outline.PLAY_L,
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
	        onClick: async () => {
	          this.closeDay(event);
	        }
	      };
	      const buttonStopPropsMulti = {
	        id: buttonId,
	        text: buttonText,
	        iconLeft: buttonIcon,
	        style: buttonStopStyle,
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
	              var _window$BXTIMEMAN2, _window$BXTIMEMAN2$WN;
	              if ((_window$BXTIMEMAN2 = window.BXTIMEMAN) != null && (_window$BXTIMEMAN2$WN = _window$BXTIMEMAN2.WND) != null && _window$BXTIMEMAN2$WN.CLOCKWND) {
	                window.BXTIMEMAN.WND.CLOCKWND.Clear();
	                window.BXTIMEMAN.WND.CLOCKWND = null;
	              }
	              const buttonElement = window.document.getElementById(buttonId);
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
	        onClick: async () => {
	          window.BXTIMEMAN.WND.ACTIONS.REOPEN(event);
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
	          var _window$BXTIMEMAN3, _window$BXTIMEMAN3$WN;
	          if ((_window$BXTIMEMAN3 = window.BXTIMEMAN) != null && (_window$BXTIMEMAN3$WN = _window$BXTIMEMAN3.WND) != null && _window$BXTIMEMAN3$WN.CLOCKWND) {
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
	      if (this.workStatus === 'OPENED') {
	        actionItems.push(this.buttonPauseProps);
	        actionItems.push(this.buttonStopProps);
	      }
	      if (this.workStatus === 'PAUSED') {
	        actionItems.push(this.buttonContinueProps);
	        actionItems.push(this.buttonStopProps);
	      }
	      if (this.workStatus === 'CLOSED') {
	        if (this.canOpen === 'OPEN') {
	          actionItems.push(this.buttonStartProps);
	        } else {
	          actionItems.push(this.buttonRestartProps);
	        }
	      }
	      if (this.workStatus === 'EXPIRED') {
	        actionItems.push(this.buttonFinishExpiredProps);
	      }
	      return actionItems;
	    }
	  },
	  watch: {},
	  mounted() {
	    this.updateDayState();
	    this.updateWorkingDayTimer();
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
	      const timerInfo = {
	        ...window.BXTIMEMAN.DATA.INFO
	      };
	      const dateStart = parseInt(timerInfo.DATE_START) * 1000;
	      const dateWorkingDayStopped = parseInt(timerInfo.DATE_FINISH) * 1000;
	      const timeTimeLeaks = parseInt(timerInfo.TIME_LEAKS) * 1000;
	      const delta = dateNow - dateStart;
	      const deltaPast = dateWorkingDayStopped - dateStart;
	      const deltaPause = dateNow - dateWorkingDayStopped;
	      this.updateDayStateIfNewHour();
	      if (this.workStatus === 'CLOSED') {
	        if (this.canOpen === 'OPEN') {
	          this.timerWorkingDayValue = 0;
	          this.timerPauseValue = 0;
	        } else if (this.canOpen === 'REOPEN') {
	          this.timerWorkingDayValue = deltaPast - timeTimeLeaks;
	          this.timerPauseValue = timeTimeLeaks;
	        }
	      } else if (this.workStatus === 'OPENED') {
	        this.timerWorkingDayValue = delta - timeTimeLeaks;
	        this.timerPauseValue = timeTimeLeaks;
	      } else if (this.workStatus === 'PAUSED') {
	        this.timerWorkingDayValue = deltaPast - timeTimeLeaks;
	        this.timerPauseValue = deltaPause + timeTimeLeaks;
	      } else if (this.workStatus === 'EXPIRED') {
	        this.timerWorkingDayValue = delta - timeTimeLeaks;
	        this.timerPauseValue = timeTimeLeaks;
	      }
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
	      var _window$BXTIMEMAN$WND2;
	      if (this.reportOpening) {
	        return;
	      }
	      if ((_window$BXTIMEMAN$WND2 = window.BXTIMEMAN.WND) != null && _window$BXTIMEMAN$WND2.isShown()) {
	        window.BXTIMEMAN.WND.Hide();
	        return;
	      } else {
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
	              forceLeft: false
	            },
	            events: {
	              onShow: () => {
	                this.reportOpening = false;
	              },
	              onClose: () => {},
	              onDestroy: () => {}
	            },
	            fixed: true
	          }
	        });
	        window.BXTIMEMAN.Open();
	      }
	    },
	    // handlers end

	    getControlButtonComponent(action) {
	      const isButtonSplit = Boolean(action.menuOptions);
	      const ControlButtonComponent = isButtonSplit ? ButtonTextDropdown : ui_vue3_components_button.Button;
	      return ControlButtonComponent;
	    }
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
	`
	};

	let _ = t => t,
	  _t,
	  _t2;
	var _data = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("data");
	var _timemanInstantContainerNode = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("timemanInstantContainerNode");
	var _mountApplication = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("mountApplication");
	var _init = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("init");
	var _updateState = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("updateState");
	class WorkStatusControlPanel {
	  constructor() {
	    Object.defineProperty(this, _updateState, {
	      value: _updateState2
	    });
	    Object.defineProperty(this, _init, {
	      value: _init2
	    });
	    Object.defineProperty(this, _mountApplication, {
	      value: _mountApplication2
	    });
	    Object.defineProperty(this, _data, {
	      writable: true,
	      value: {}
	    });
	    Object.defineProperty(this, _timemanInstantContainerNode, {
	      writable: true,
	      value: void 0
	    });
	    const settings = main_core.Extension.getSettings('timeman.work-status-control-panel');
	    babelHelpers.classPrivateFieldLooseBase(this, _data)[_data].workReport = settings.get('workReport');
	    babelHelpers.classPrivateFieldLooseBase(this, _data)[_data].info = settings.get('info');
	    babelHelpers.classPrivateFieldLooseBase(this, _data)[_data].siteId = settings.get('siteId');
	    babelHelpers.classPrivateFieldLooseBase(this, _timemanInstantContainerNode)[_timemanInstantContainerNode] = main_core.Tag.render(_t || (_t = _`
			<div class="timeman-instant-container"></div>
		`));
	    main_core_events.EventEmitter.subscribe('onTimemanInit', babelHelpers.classPrivateFieldLooseBase(this, _init)[_init].bind(this));
	    main_core_events.EventEmitter.subscribe('onTimeManDataRecieved', babelHelpers.classPrivateFieldLooseBase(this, _updateState)[_updateState].bind(this));
	    window.BX.timeman('bx_tm', babelHelpers.classPrivateFieldLooseBase(this, _data)[_data].info, babelHelpers.classPrivateFieldLooseBase(this, _data)[_data].siteId);
	  }
	  renderWorkStatusControlPanel() {
	    event.stopPropagation();
	    babelHelpers.classPrivateFieldLooseBase(this, _mountApplication)[_mountApplication](babelHelpers.classPrivateFieldLooseBase(this, _timemanInstantContainerNode)[_timemanInstantContainerNode]);
	    return main_core.Tag.render(_t2 || (_t2 = _`
			${0}
		`), babelHelpers.classPrivateFieldLooseBase(this, _timemanInstantContainerNode)[_timemanInstantContainerNode]);
	  }
	}
	function _mountApplication2(container) {
	  const application = ui_vue3.BitrixVue.createApp(App, {});
	  application.mount(container);
	}
	function _init2() {
	  window.BXTIMEMAN.initFormWeekly(babelHelpers.classPrivateFieldLooseBase(this, _data)[_data].workReport);
	}
	function _updateState2(baseEvent) {
	  const [data] = baseEvent.getCompatData();
	  babelHelpers.classPrivateFieldLooseBase(this, _data)[_data].info = data;
	}

	exports.WorkStatusControlPanel = WorkStatusControlPanel;

}((this.BX.Timeman = this.BX.Timeman || {}),BX.Vue3,BX,BX,BX,BX,BX,BX,BX,BX,BX,BX.Event,BX.Vue3.Components,BX.UI.System.Skeleton.Vue,BX,BX.Main,BX.UI,BX.UI.IconSet,BX.UI.System.Menu));
//# sourceMappingURL=work-status-control-panel.bundle.js.map
