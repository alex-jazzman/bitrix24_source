/* eslint-disable */
this.BX = this.BX || {};
this.BX.Tasks = this.BX.Tasks || {};
this.BX.Tasks.V2 = this.BX.Tasks.V2 || {};
this.BX.Tasks.V2.Component = this.BX.Tasks.V2.Component || {};
(function (exports,tasks_v2_component_elements_hoverPill,tasks_v2_component_elements_settingsLabel,ui_switcher,ui_vue3_components_switcher,tasks_v2_provider_service_stateService,tasks_v2_provider_service_statusService,tasks_v2_provider_service_taskService,tasks_v2_component_elements_bottomSheet,tasks_v2_component_elements_userAvatarList,ui_dialogs_messagebox,tasks_v2_lib_analytics,tasks_v2_lib_highlighter,tasks_v2_provider_service_timeTrackingService,ui_system_input_vue,ui_vue3_components_button,ui_datePicker,tasks_v2_lib_calendar,main_date,ui_system_typography_vue,ui_vue3_directives_hint,tasks_v2_component_elements_userLabel,tasks_v2_component_elements_hint,tasks_v2_lib_timezone,ui_system_skeleton_vue,ui_vue3_components_popup,ui_tooltip,tasks_v2_component_elements_userAvatar,main_core,ui_vue3_vuex,ui_system_chip_vue,ui_iconSet_api_vue,ui_iconSet_outline,tasks_v2_core,tasks_v2_const,tasks_v2_lib_fieldHighlighter,tasks_v2_lib_showLimit) {
	'use strict';

	// @vue/component
	const TaskTrackingPopup = {
	  name: 'TasksTaskTrackingPopup',
	  components: {
	    BIcon: ui_iconSet_api_vue.BIcon,
	    BInput: ui_system_input_vue.BInput,
	    Popup: ui_vue3_components_popup.Popup,
	    Switcher: ui_vue3_components_switcher.Switcher,
	    TextMd: ui_system_typography_vue.TextMd,
	    TextSm: ui_system_typography_vue.TextSm,
	    TextXs: ui_system_typography_vue.TextXs,
	    Text2Xl: ui_system_typography_vue.Text2Xl
	  },
	  inject: {
	    task: {},
	    taskId: {},
	    isEdit: {}
	  },
	  props: {
	    bindElement: {
	      type: HTMLElement,
	      default: null
	    },
	    timeSpent: {
	      type: Number,
	      required: true
	    }
	  },
	  emits: ['close'],
	  setup() {
	    return {
	      InputDesign: ui_system_input_vue.InputDesign,
	      Outline: ui_iconSet_api_vue.Outline
	    };
	  },
	  data() {
	    return {
	      localAllowsTimeTracking: true,
	      localEstimatedTime: 0
	    };
	  },
	  computed: {
	    ...ui_vue3_vuex.mapGetters({
	      currentUserId: `${tasks_v2_const.Model.Interface}/currentUserId`,
	      stateFlags: `${tasks_v2_const.Model.Interface}/stateFlags`
	    }),
	    options() {
	      return {
	        id: `tasks-time-tracking-popup-${this.taskId}`,
	        className: 'tasks-time-tracking-popup',
	        bindElement: this.bindElement,
	        width: 540,
	        targetContainer: document.body
	      };
	    },
	    switcherOptions() {
	      return {
	        size: ui_switcher.SwitcherSize.small,
	        useAirDesign: true
	      };
	    },
	    timer() {
	      var _this$task$timers;
	      return (_this$task$timers = this.task.timers) == null ? void 0 : _this$task$timers.find(timer => timer.userId === this.currentUserId);
	    },
	    hours: {
	      get() {
	        const hour = Math.floor(this.localEstimatedTime / 3600);
	        if (hour === 0) {
	          return '';
	        }
	        return String(hour) || '';
	      },
	      set(value) {
	        let hours = value === '' ? 0 : parseInt(value, 10);
	        if (!main_core.Type.isNumber(hours)) {
	          return;
	        }
	        hours = Math.abs(hours);
	        const minutes = this.minutes;
	        this.localEstimatedTime = hours * 3600 + minutes * 60;
	        this.save();
	      }
	    },
	    minutes: {
	      get() {
	        const minutes = Math.floor(this.localEstimatedTime % 3600 / 60);
	        if (minutes === 0) {
	          return '';
	        }
	        return String(minutes) || '';
	      },
	      set(value) {
	        let minutes = value === '' ? 0 : parseInt(value, 10);
	        if (!main_core.Type.isNumber(minutes)) {
	          return;
	        }
	        minutes = Math.abs(minutes);
	        const hours = this.hours;
	        this.localEstimatedTime = hours * 3600 + minutes * 60;
	        this.save();
	      }
	    }
	  },
	  created() {
	    var _this$task$allowsTime, _this$task$estimatedT;
	    this.localAllowsTimeTracking = (_this$task$allowsTime = this.task.allowsTimeTracking) != null ? _this$task$allowsTime : true;
	    this.localEstimatedTime = (_this$task$estimatedT = this.task.estimatedTime) != null ? _this$task$estimatedT : 0;
	    this.save();
	  },
	  methods: {
	    handleClose() {
	      this.save();
	      this.$emit('close');
	    },
	    toggleAllows() {
	      if (!this.task.rights.edit) {
	        return;
	      }
	      const localAllowsTimeTracking = !this.localAllowsTimeTracking;
	      if (this.task.allowsTimeTracking === true && this.timeSpent && localAllowsTimeTracking === false) {
	        this.freeze();
	        const messageBox = ui_dialogs_messagebox.MessageBox.create({
	          message: this.loc('TASKS_V2_TIME_TRACKING_CONFIRM_POPUP_TEXT'),
	          title: this.loc('TASKS_V2_TIME_TRACKING_CONFIRM_POPUP_TITLE'),
	          okCaption: this.loc('TASKS_V2_TIME_TRACKING_CONFIRM_POPUP_OK'),
	          cancelCaption: this.loc('TASKS_V2_TIME_TRACKING_CONFIRM_POPUP_CANCEL'),
	          useAirDesign: true,
	          popupOptions: {
	            height: 186,
	            closeIcon: false
	          },
	          onOk: () => {
	            this.localAllowsTimeTracking = localAllowsTimeTracking;
	            messageBox.close();
	            this.unfreeze();
	            this.handleClose();
	          },
	          onCancel: () => {
	            messageBox.close();
	            this.unfreeze();
	            this.handleClose();
	          },
	          buttons: ui_dialogs_messagebox.MessageBoxButtons.OK_CANCEL
	        });
	        messageBox.show();
	        return;
	      }
	      this.localAllowsTimeTracking = localAllowsTimeTracking;
	    },
	    async save() {
	      if (this.task.allowsTimeTracking !== this.localAllowsTimeTracking) {
	        this.$bitrix.eventEmitter.emit(tasks_v2_const.EventName.TimeTrackingChange);
	      }
	      if (!this.isEdit) {
	        await this.$store.dispatch(`${tasks_v2_const.Model.Interface}/updateStateFlags`, {
	          allowsTimeTracking: this.localAllowsTimeTracking
	        });
	        void tasks_v2_provider_service_stateService.stateService.set(this.stateFlags);
	      }
	      void tasks_v2_provider_service_taskService.taskService.update(this.taskId, {
	        allowsTimeTracking: this.localAllowsTimeTracking,
	        estimatedTime: this.localEstimatedTime
	      });
	      if (!this.localAllowsTimeTracking && this.timer) {
	        void tasks_v2_provider_service_statusService.statusService.pauseTimer(this.taskId);
	      }
	    },
	    openHelpDesk() {
	      top.BX.Helper.show('redirect=detail&code=27145920');
	    },
	    freeze() {
	      var _this$$refs$popup;
	      (_this$$refs$popup = this.$refs.popup) == null ? void 0 : _this$$refs$popup.freeze();
	    },
	    unfreeze() {
	      var _this$$refs$popup2;
	      (_this$$refs$popup2 = this.$refs.popup) == null ? void 0 : _this$$refs$popup2.unfreeze();
	    }
	  },
	  template: `
		<Popup ref="popup" :options @close="handleClose">
			<div
				class="tasks-time-tracking-popup-header"
				:class="{'--disable': !localAllowsTimeTracking}"
			>
				<div class="tasks-time-tracking-popup-content">
					<div class="tasks-time-tracking-popup-content-info">
						<div class="tasks-time-tracking-popup-content-switcher">
							<Switcher
								:isChecked="localAllowsTimeTracking"
								:options="switcherOptions"
								@click="toggleAllows"
							/>
							<Text2Xl
								class="tasks-task-setting-switcher-label"
								@click="toggleAllows"
							>{{ loc('TASKS_V2_TIME_TRACKING_POPUP_LABEL') }}</Text2Xl>
						</div>
						<TextMd class="tasks-time-tracking-popup-content-text">
							{{ loc('TASKS_V2_TIME_TRACKING_POPUP_TEXT') }}
						</TextMd>
						<div class="tasks-time-tracking-popup-content-more" @click="openHelpDesk">
							<BIcon
								:name="Outline.KNOWLEDGE_BASE"
								class="tasks-time-tracking-popup-content-more-icon"
							/>
							<TextSm class="tasks-time-tracking-popup-content-more-text">
								{{ loc('TASKS_V2_TIME_TRACKING_POPUP_MORE') }}
							</TextSm>
						</div>
					</div>
					<div class="tasks-time-tracking-popup-content-icon"/>
				</div>
			</div>
			<div v-if="localAllowsTimeTracking" class="tasks-time-tracking-popup-form">
				<TextMd class="tasks-time-tracking-popup-form-title">
					{{ loc('TASKS_V2_TIME_TRACKING_POPUP_FORM_TITLE') }}
				</TextMd>
				<TextXs class="tasks-time-tracking-popup-form-label">
					{{ loc('TASKS_V2_TIME_TRACKING_POPUP_FORM_LABEL') }}
				</TextXs>
				<div class="tasks-time-tracking-popup-form-fields">
					<BInput
						v-model="hours"
						class="tasks-time-tracking-popup-form-field"
						:design="InputDesign.LightGrey"
						:label="loc('TASKS_V2_TIME_TRACKING_POPUP_FORM_HOUR')"
						labelInline
					/>
					<BInput
						v-model="minutes"
						class="tasks-time-tracking-popup-form-field"
						:design="InputDesign.LightGrey"
						:label="loc('TASKS_V2_TIME_TRACKING_POPUP_FORM_MINUTES')"
						labelInline
					/>
				</div>
			</div>
		</Popup>
	`
	};

	// @vue/component
	const TimeTrackingInvoiceHint = {
	  name: 'TasksTimeTrackingInvoiceHint',
	  components: {
	    Hint: tasks_v2_component_elements_hint.Hint
	  },
	  props: {
	    bindElement: {
	      type: HTMLElement,
	      default: null
	    }
	  },
	  template: `
		<Hint
			:bindElement
			:options="{
				maxWidth: 430,
				closeIcon: true,
				offsetLeft: bindElement ? bindElement.offsetWidth / 2 : 0,
			}"
			@close="$emit('close')"
		>
			<div class="tasks-time-tracking-hint">
				<div class="tasks-time-tracking-hint-image">
					<div class="tasks-time-tracking-invoice-hint-icon"/>
				</div>
				<div class="tasks-time-tracking-hint-content">
					<div class="tasks-time-tracking-hint-title">
						{{ loc('TASKS_V2_TIME_TRACKING_HINT_TITLE_INVOICE') }}
					</div>
					<div class="tasks-time-tracking-hint-text">
						{{ loc('TASKS_V2_TIME_TRACKING_HINT_TEXT_INVOICE') }}
					</div>
				</div>
			</div>
		</Hint>
	`
	};

	// @vue/component
	const TimeTrackingListEmpty = {
	  name: 'TasksTimeTrackingListEmpty',
	  components: {
	    HeadlineXs: ui_system_typography_vue.HeadlineXs,
	    UiButton: ui_vue3_components_button.Button
	  },
	  emits: ['add'],
	  setup() {
	    return {
	      AirButtonStyle: ui_vue3_components_button.AirButtonStyle,
	      ButtonSize: ui_vue3_components_button.ButtonSize,
	      Outline: ui_iconSet_api_vue.Outline
	    };
	  },
	  template: `
		<div class="tasks-time-tracking-list-empty">
			<div class="tasks-time-tracking-list-empty-icon"/>
			<div class="tasks-time-tracking-list-empty-text">
				<HeadlineXs>{{ loc('TASKS_V2_TIME_TRACKING_SHEET_LIST_EMPTY_INFO') }}</HeadlineXs>
				<HeadlineXs>{{ loc('TASKS_V2_TIME_TRACKING_SHEET_LIST_EMPTY_ADD') }}</HeadlineXs>
			</div>
			<div class="tasks-time-tracking-list-empty-button" @click="$emit('add')">
				<UiButton
					:leftIcon="Outline.PLUS_L"
					:text="loc('TASKS_V2_TIME_TRACKING_SHEET_LIST_EMPTY_ADD_BTN')"
					:style="AirButtonStyle.FILLED"
					:size="ButtonSize.MEDIUM"
				/>
			</div>
		</div>
	`
	};

	// @vue/component
	const TimeTrackingListHeader = {
	  name: 'TasksTimeTrackingListHeader',
	  components: {
	    UiButton: ui_vue3_components_button.Button,
	    Text2Xs: ui_system_typography_vue.Text2Xs
	  },
	  props: {
	    empty: {
	      type: Boolean,
	      default: false
	    },
	    addBtnDisabled: {
	      type: Boolean,
	      default: false
	    }
	  },
	  emits: ['add'],
	  setup() {
	    return {
	      AirButtonStyle: ui_vue3_components_button.AirButtonStyle,
	      ButtonSize: ui_vue3_components_button.ButtonSize,
	      Outline: ui_iconSet_api_vue.Outline
	    };
	  },
	  template: `
		<div class="tasks-time-tracking-list-row --header">
			<div class="tasks-time-tracking-list-column --header --date">
				<Text2Xs>{{ loc('TASKS_V2_TIME_TRACKING_SHEET_LIST_COLUMN_DATE') }}</Text2Xs>
			</div>
			<div class="tasks-time-tracking-list-column --header --time">
				<Text2Xs>{{ loc('TASKS_V2_TIME_TRACKING_SHEET_LIST_COLUMN_TIME') }}</Text2Xs>
			</div>
			<div class="tasks-time-tracking-list-column --header --author">
				<Text2Xs>{{ loc('TASKS_V2_TIME_TRACKING_SHEET_LIST_COLUMN_AUTHOR') }}</Text2Xs>
				<UiButton
					v-if="!empty"
					:leftIcon="Outline.PLUS_L"
					:text="loc('TASKS_V2_TIME_TRACKING_SHEET_LIST_COLUMN_BTN')"
					:style="AirButtonStyle.OUTLINE_ACCENT_2"
					:size="ButtonSize.SMALL"
					:disabled="addBtnDisabled"
					@click="$emit('add')"
				/>
			</div>
		</div>
	`
	};

	// @vue/component
	const TimeTrackingListItemEdit = {
	  name: 'TasksTimeTrackingListItemEdit',
	  components: {
	    BIcon: ui_iconSet_api_vue.BIcon,
	    BInput: ui_system_input_vue.BInput,
	    UiButton: ui_vue3_components_button.Button
	  },
	  inject: {
	    taskId: {}
	  },
	  props: {
	    elapsedTimeCreatedAtTs: {
	      type: Number,
	      default: 0
	    },
	    elapsedTimeSeconds: {
	      type: Number,
	      default: 0
	    },
	    elapsedTimeText: {
	      type: String,
	      default: ''
	    }
	  },
	  emits: ['save', 'cancel'],
	  setup() {
	    return {
	      AirButtonStyle: ui_vue3_components_button.AirButtonStyle,
	      ButtonSize: ui_vue3_components_button.ButtonSize,
	      ButtonIcon: ui_vue3_components_button.ButtonIcon,
	      ButtonColor: ui_vue3_components_button.ButtonColor,
	      InputDesign: ui_system_input_vue.InputDesign,
	      Outline: ui_iconSet_api_vue.Outline
	    };
	  },
	  data() {
	    return {
	      isCalendarShown: false,
	      localCreatedAt: null,
	      localSeconds: 0,
	      localText: ''
	    };
	  },
	  computed: {
	    ...ui_vue3_vuex.mapGetters({
	      currentUserId: `${tasks_v2_const.Model.Interface}/currentUserId`
	    }),
	    hours: {
	      get() {
	        const hour = Math.floor(this.localSeconds / 3600);
	        if (hour === 0) {
	          return '';
	        }
	        return String(hour) || '';
	      },
	      set(value) {
	        let hours = value === '' ? 0 : parseInt(value, 10);
	        if (!main_core.Type.isNumber(hours)) {
	          return;
	        }
	        hours = Math.abs(hours);
	        const minutes = this.minutes;
	        this.localSeconds = hours * 3600 + minutes * 60;
	      }
	    },
	    minutes: {
	      get() {
	        const minutes = Math.floor(this.localSeconds % 3600 / 60);
	        if (minutes === 0) {
	          return '';
	        }
	        return String(minutes) || '';
	      },
	      set(value) {
	        let minutes = value === '' ? 0 : parseInt(value, 10);
	        if (!main_core.Type.isNumber(minutes)) {
	          return;
	        }
	        minutes = Math.abs(minutes);
	        const hours = this.hours;
	        this.localSeconds = hours * 3600 + minutes * 60;
	      }
	    },
	    text: {
	      get() {
	        return this.localText;
	      },
	      set(value) {
	        this.localText = value;
	      }
	    }
	  },
	  watch: {
	    isCalendarShown(value) {
	      if (value) {
	        this.datePicker.show();
	      } else {
	        this.datePicker.hide();
	      }
	    }
	  },
	  created() {
	    const createdDate = this.getCreatedDate();
	    this.localCreatedAt = new Date(createdDate.getTime() + tasks_v2_lib_timezone.timezone.getOffset(createdDate.getTime()));
	    this.localSeconds = this.elapsedTimeSeconds;
	    this.localText = this.elapsedTimeText;
	  },
	  mounted() {
	    this.datePicker = this.createDatePicker();
	  },
	  unmounted() {
	    var _this$datePicker;
	    (_this$datePicker = this.datePicker) == null ? void 0 : _this$datePicker.destroy();
	  },
	  methods: {
	    createDatePicker() {
	      const selectedDateTs = this.localCreatedAt ? this.localCreatedAt.getTime() : null;
	      return new ui_datePicker.DatePicker({
	        popupOptions: {
	          id: `tasks-time-tracking-list-popup-${main_core.Text.getRandom()}`,
	          bindElement: this.$refs.calendarInput.$el,
	          bindOptions: {
	            forceBindPosition: true
	          },
	          events: {
	            onClose: () => {
	              this.isCalendarShown = false;
	            }
	          }
	        },
	        selectedDates: [selectedDateTs],
	        enableTime: true,
	        events: {
	          [ui_datePicker.DatePickerEvent.SELECT]: event => {
	            const {
	              date
	            } = event.getData();
	            this.localCreatedAt = tasks_v2_lib_calendar.calendar.createDateFromUtc(date);
	          }
	        }
	      });
	    },
	    getCreatedDate() {
	      if (!this.elapsedTimeCreatedAtTs) {
	        return new Date();
	      }
	      return new Date(this.elapsedTimeCreatedAtTs * 1000);
	    },
	    formatDate(date) {
	      if (!date) {
	        return null;
	      }
	      const format = this.loc('TASKS_V2_DATE_TIME_FORMAT', {
	        '#DATE#': main_date.DateTimeFormat.getFormat('FORMAT_DATE'),
	        '#TIME#': main_date.DateTimeFormat.getFormat('SHORT_TIME_FORMAT')
	      });
	      return main_date.DateTimeFormat.format(format, date);
	    },
	    save() {
	      const offset = tasks_v2_lib_timezone.timezone.getOffset(this.localCreatedAt.getTime());
	      const localCreatedAt = new Date(this.localCreatedAt.getTime() - offset);
	      this.$emit('save', {
	        taskId: this.taskId,
	        createdAtTs: Math.floor(localCreatedAt.getTime() / 1000),
	        seconds: this.localSeconds,
	        text: this.localText,
	        source: 'manual',
	        rights: {
	          edit: true,
	          remove: true
	        }
	      });
	    }
	  },
	  template: `
		<div class="tasks-time-tracking-list-row">
			<div class="tasks-time-tracking-list-item-edit">
				<div class="tasks-time-tracking-list-item-edit-time">
					<BInput
						ref="calendarInput"
						class="tasks-time-tracking-list-item-edit-time-calendar"
						:modelValue="formatDate(localCreatedAt)"
						:design="InputDesign.LightGrey"
						clickable
						:label="loc('TASKS_V2_TIME_TRACKING_SHEET_LIST_COLUMN_DATE')"
						@click="isCalendarShown = !isCalendarShown"
					/>
					<BInput
						v-model="hours"
						class="tasks-time-tracking-list-item-edit-time-field"
						:design="InputDesign.LightGrey"
						:label="loc('TASKS_V2_TIME_TRACKING_POPUP_FORM_HOUR')"
						:placeholder="loc('TASKS_V2_TIME_TRACKING_SHEET_LIST_ITEM_EDIT_INPUT_H')"
					/>
					<BInput
						v-model="minutes"
						class="tasks-time-tracking-list-item-edit-time-field"
						:design="InputDesign.LightGrey"
						:label="loc('TASKS_V2_TIME_TRACKING_POPUP_FORM_MINUTES')"
						:placeholder="loc('TASKS_V2_TIME_TRACKING_SHEET_LIST_ITEM_EDIT_INPUT_M')"
					/>
					<UiButton
						:leftIcon="Outline.CHECK_L"
						:style="AirButtonStyle.FILLED"
						:size="ButtonSize.SMALL"
						@click="save"
					/>
					<BIcon
						:name="Outline.CROSS_L"
						hoverable
						class="tasks-time-tracking-list-item-edit-close-icon"
						@click="$emit('cancel')"
					/>
				</div>
				<div class="tasks-time-tracking-list-item-edit-text">
					<BInput
						v-model="text"
						:placeholder="loc('TASKS_V2_TIME_TRACKING_SHEET_LIST_ITEM_EDIT_TEXT')"
						:rowsQuantity="3"
						active
						resize="none"
					/>
				</div>
			</div>
		</div>
	`
	};

	const formatTime = seconds => {
	  if (!seconds && seconds !== 0) {
	    return '00:00:00';
	  }
	  const hours = Math.floor(seconds / 3600);
	  const minutes = Math.floor(seconds % 3600 / 60);
	  const secs = seconds % 60;
	  return [hours.toString().padStart(2, '0'), minutes.toString().padStart(2, '0'), secs.toString().padStart(2, '0')].join(':');
	};

	// @vue/component
	const TimeTrackingListItemView = {
	  name: 'TasksTimeTrackingListItemView',
	  components: {
	    BIcon: ui_iconSet_api_vue.BIcon,
	    TextSm: ui_system_typography_vue.TextSm,
	    UserLabel: tasks_v2_component_elements_userLabel.UserLabel
	  },
	  directives: {
	    hint: ui_vue3_directives_hint.hint
	  },
	  inject: {
	    task: {}
	  },
	  props: {
	    elapsedId: {
	      type: [Number, String],
	      required: true
	    }
	  },
	  emits: ['edit', 'remove'],
	  setup() {
	    return {
	      Outline: ui_iconSet_api_vue.Outline
	    };
	  },
	  data() {
	    return {
	      isItemHovered: false
	    };
	  },
	  computed: {
	    elapsedTime() {
	      return this.$store.getters[`${tasks_v2_const.Model.ElapsedTimes}/getById`](this.elapsedId);
	    },
	    isEdit() {
	      var _this$elapsedTime;
	      return main_core.Type.isNumber((_this$elapsedTime = this.elapsedTime) == null ? void 0 : _this$elapsedTime.id);
	    },
	    elapsedTimeDate() {
	      const format = this.loc('TASKS_V2_DATE_TIME_FORMAT', {
	        '#DATE#': main_date.DateTimeFormat.getFormat('FORMAT_DATE'),
	        '#TIME#': main_date.DateTimeFormat.getFormat('SHORT_TIME_FORMAT')
	      });
	      const createdAtMs = this.elapsedTime.createdAtTs * 1000;
	      const createdAt = new Date(createdAtMs + tasks_v2_lib_timezone.timezone.getOffset(createdAtMs));
	      return main_date.DateTimeFormat.format(format, createdAt);
	    },
	    elapsedTimeTime() {
	      return formatTime(this.elapsedTime.seconds);
	    },
	    author() {
	      return this.$store.getters[`${tasks_v2_const.Model.Users}/getById`](this.elapsedTime.userId);
	    },
	    editTooltip() {
	      return () => tasks_v2_component_elements_hint.tooltip({
	        text: this.loc('TASKS_V2_TIME_TRACKING_SHEET_LIST_ACTION_EDIT'),
	        popupOptions: {
	          offsetLeft: this.$refs.edit.offsetWidth / 2
	        }
	      });
	    },
	    removeTooltip() {
	      return () => tasks_v2_component_elements_hint.tooltip({
	        text: this.loc('TASKS_V2_TIME_TRACKING_SHEET_LIST_ACTION_REMOVE'),
	        popupOptions: {
	          offsetLeft: this.$refs.remove.offsetWidth / 2
	        }
	      });
	    }
	  },
	  template: `
		<div
			class="tasks-time-tracking-list-row --item"
			@mouseover="isItemHovered = true"
			@mouseleave="isItemHovered = false"
		>
			<div class="tasks-time-tracking-list-item-view">
				<div class="tasks-time-tracking-list-item-view-time">
					<div class="tasks-time-tracking-list-column --date">
						<TextSm>{{ elapsedTimeDate }}</TextSm>
					</div>
					<div class="tasks-time-tracking-list-column --time">
						<TextSm>{{ elapsedTimeTime }}</TextSm>
					</div>
					<div class="tasks-time-tracking-list-column --author">
						<UserLabel :user="author"/>
					</div>
					<div
						class="tasks-time-tracking-list-column --action"
					>
						<div
							v-if="isItemHovered && elapsedTime.rights.edit && isEdit"
							ref="edit" @click="$emit('edit')"
						>
							<BIcon v-hint="editTooltip" :name="Outline.EDIT_L" hoverable/>
						</div>
						<div
							v-if="isItemHovered && elapsedTime.rights.remove && isEdit"
							ref="remove" @click="$emit('remove')"
						>
							<BIcon v-hint="removeTooltip" :name="Outline.TRASHCAN" hoverable/>
						</div>
					</div>
				</div>
				<div v-if="this.elapsedTime.text" class="tasks-time-tracking-list-item-view-text">
					<TextSm>{{ this.elapsedTime.text }}</TextSm>
				</div>
			</div>
		</div>
	`
	};

	// @vue/component
	const TimeTrackingListItem = {
	  name: 'TasksTimeTrackingListItem',
	  components: {
	    TimeTrackingListItemEdit,
	    TimeTrackingListItemView
	  },
	  inject: {
	    task: {},
	    taskId: {},
	    analytics: {}
	  },
	  props: {
	    elapsedId: {
	      type: [Number, String],
	      required: true
	    },
	    editMode: {
	      type: Boolean,
	      default: false
	    }
	  },
	  emits: ['save', 'edit', 'cancel'],
	  setup() {},
	  data() {
	    return {
	      localElapsedId: this.elapsedId,
	      localEditMode: this.editMode
	    };
	  },
	  computed: {
	    elapsedTime() {
	      return this.$store.getters[`${tasks_v2_const.Model.ElapsedTimes}/getById`](this.localElapsedId);
	    },
	    isEdit() {
	      var _this$elapsedTime;
	      return main_core.Type.isNumber((_this$elapsedTime = this.elapsedTime) == null ? void 0 : _this$elapsedTime.id);
	    },
	    isTimeTrackingLocked() {
	      return !tasks_v2_core.Core.getParams().restrictions.timeTracking.available;
	    }
	  },
	  watch: {
	    elapsedId(elapsedId) {
	      this.localElapsedId = elapsedId;
	    },
	    editMode(value) {
	      this.localEditMode = value;
	    }
	  },
	  methods: {
	    async handleSave(localElapsedTime) {
	      this.localEditMode = false;
	      this.$emit('save');
	      if (this.isEdit) {
	        void tasks_v2_lib_highlighter.highlighter.highlight(this.$refs.item);
	        await tasks_v2_provider_service_timeTrackingService.timeTrackingService.update(this.taskId, {
	          ...this.elapsedTime,
	          ...localElapsedTime
	        });
	      } else {
	        this.localElapsedId = await tasks_v2_provider_service_timeTrackingService.timeTrackingService.add(this.taskId, {
	          id: this.elapsedId,
	          ...localElapsedTime
	        });
	        tasks_v2_lib_analytics.analytics.sendManualTimeTracking(this.analytics, {
	          taskId: this.taskId
	        });
	      }
	    },
	    handleEdit() {
	      this.$emit('edit', this.localElapsedId);
	      this.localEditMode = true;
	    },
	    handleCancel() {
	      this.localEditMode = false;
	      this.$emit('cancel');
	    },
	    removeItem() {
	      const messageBox = ui_dialogs_messagebox.MessageBox.create({
	        message: this.loc('TASKS_V2_TIME_TRACKING_SHEET_LIST_ACTION_REMOVE_CONFIRM'),
	        okCaption: this.loc('TASKS_V2_TIME_TRACKING_SHEET_LIST_ACTION_REMOVE_CONFIRM_OK'),
	        useAirDesign: true,
	        popupOptions: {
	          closeIcon: false
	        },
	        onOk: () => {
	          void tasks_v2_provider_service_timeTrackingService.timeTrackingService.delete(this.taskId, this.elapsedTime);
	          messageBox.close();
	        },
	        onCancel: () => {
	          messageBox.close();
	        },
	        buttons: ui_dialogs_messagebox.MessageBoxButtons.OK_CANCEL
	      });
	      messageBox.show();
	    }
	  },
	  template: `
		<div ref="item" class="tasks-time-tracking-list-item">
			<template v-if="localEditMode">
				<TimeTrackingListItemEdit
					:elapsedTimeCreatedAtTs="elapsedTime?.createdAtTs"
					:elapsedTimeSeconds="elapsedTime?.seconds"
					:elapsedTimeText="elapsedTime?.text"
					@save="handleSave"
					@cancel="handleCancel"
				/>
			</template>
			<template v-else>
				<TimeTrackingListItemView
					:elapsedId="localElapsedId"
					@edit="handleEdit"
					@remove="removeItem"
				/>
			</template>
		</div>
	`
	};

	// @vue/component
	const TimeTrackingListItemSkeleton = {
	  components: {
	    BLine: ui_system_skeleton_vue.BLine
	  },
	  template: `
		<div class="tasks-time-tracking-list-row --item tasks-time-tracking-list-item">
			<div class="tasks-time-tracking-list-column --date">
				<BLine :width="120" :height="20"/>
			</div>
			<div class="tasks-time-tracking-list-column --time">
				<BLine :width="60" :height="20"/>
			</div>
			<div class="tasks-time-tracking-list-column --author">
				<BLine :width="200" :height="20"/>
			</div>
		</div>
	`
	};

	// @vue/component
	const TimeTrackingList = {
	  name: 'TasksTimeTrackingList',
	  components: {
	    TimeTrackingListEmpty,
	    TimeTrackingListHeader,
	    TimeTrackingListItem,
	    TimeTrackingListItemSkeleton
	  },
	  inject: {
	    task: {},
	    taskId: {}
	  },
	  props: {
	    numbers: {
	      type: Number,
	      required: true
	    },
	    loading: {
	      type: Boolean,
	      required: true
	    },
	    sheetBindProps: {
	      type: Object,
	      required: true
	    }
	  },
	  setup() {},
	  data() {
	    return {
	      io: null,
	      pageLoading: false,
	      adding: false,
	      editingElapsedId: null
	    };
	  },
	  computed: {
	    elapsedIds() {
	      return this.$store.getters[`${tasks_v2_const.Model.ElapsedTimes}/getIds`](this.taskId);
	    },
	    addBtnDisabled() {
	      return this.loading || this.adding || Boolean(this.editingElapsedId) || !this.task.rights.elapsedTime;
	    }
	  },
	  mounted() {
	    // eslint-disable-next-line @bitrix24/bitrix24-rules/no-io-without-polyfill
	    this.io = new IntersectionObserver(entries => {
	      entries.forEach(entry => {
	        if (entry.isIntersecting && this.numbers > 19) {
	          void tasks_v2_provider_service_timeTrackingService.timeTrackingService.list(this.taskId);
	          this.pageLoading = tasks_v2_provider_service_timeTrackingService.timeTrackingService.isLoading(this.taskId);
	        }
	      });
	    }, {
	      root: null,
	      rootMargin: '0px',
	      threshold: 0.1
	    });
	    if (this.$refs && this.$refs.sentinel) {
	      this.io.observe(this.$refs.sentinel);
	    }
	  },
	  beforeUnmount() {
	    if (this.io) {
	      this.io.disconnect();
	      this.io = null;
	    }
	  },
	  methods: {
	    handleAdd() {
	      this.adding = true;
	      this.cancelEditing();
	    },
	    handleEdit(elapsedId) {
	      this.adding = false;
	      this.editingElapsedId = elapsedId;
	    },
	    generateNewId() {
	      return main_core.Text.getRandom();
	    },
	    cancelAdding() {
	      this.adding = false;
	      this.cancelEditing();
	    },
	    cancelEditing() {
	      this.editingElapsedId = null;
	    }
	  },
	  template: `
		<div class="tasks-time-tracking-list">
			<div class="tasks-time-tracking-list-header">
				<TimeTrackingListHeader :empty="numbers === 0" :addBtnDisabled @add="handleAdd"/>
			</div>
			<div class="tasks-time-tracking-list-content">
				<template v-if="numbers === 0 && !adding">
					<TimeTrackingListEmpty @add="handleAdd"/>
				</template>
				<template v-if="loading">
					<TimeTrackingListItemSkeleton v-for="index in numbers" :key="index"/>
				</template>
				<template v-if="adding">
					<TimeTrackingListItem
						:elapsedId="generateNewId()"
						editMode
						@save="cancelAdding"
						@edit="handleEdit"
						@cancel="cancelAdding"
					/>
				</template>
				<template v-if="!loading" v-for="elapsedId in elapsedIds" :key="elapsedId">
					<TimeTrackingListItem
						:elapsedId
						:editMode="editingElapsedId === elapsedId"
						@edit="handleEdit"
						@cancel="cancelEditing"
						@save="cancelEditing"
					/>
				</template>
				<TimeTrackingListItemSkeleton v-if="pageLoading"/>
				<div v-show="!loading && numbers > 19" ref="sentinel" style="height: 1px; width: 100%"/>
			</div>
		</div>
	`
	};

	// @vue/component
	const TimeTrackingParticipantsPopup = {
	  name: 'TasksTimeTrackingParticipantsPopup',
	  components: {
	    BIcon: ui_iconSet_api_vue.BIcon,
	    UserAvatar: tasks_v2_component_elements_userAvatar.UserAvatar,
	    Popup: ui_vue3_components_popup.Popup
	  },
	  props: {
	    isShown: {
	      type: Boolean,
	      required: true
	    },
	    bindElement: {
	      type: HTMLElement,
	      default: () => null
	    },
	    users: {
	      type: Array,
	      required: true
	    },
	    contribution: {
	      type: Object,
	      required: true
	    }
	  },
	  emits: ['close'],
	  setup() {
	    return {
	      Outline: ui_iconSet_api_vue.Outline,
	      formatTime
	    };
	  },
	  computed: {
	    options() {
	      return {
	        id: 'ui-user-avatar-list-more-popup',
	        bindElement: this.bindElement,
	        padding: 18,
	        maxWidth: 320,
	        maxHeight: 240,
	        offsetTop: 8,
	        offsetLeft: -18,
	        targetContainer: document.body
	      };
	    }
	  },
	  methods: {
	    close() {
	      this.$emit('close');
	    }
	  },
	  template: `
		<Popup v-if="isShown" :options @close="close">
			<div class="tasks-time-tracking-list-users --popup">
				<template v-for="user of users" :key="user.id">
					<div class="tasks-time-tracking-list-user-container">
						<div class="tasks-time-tracking-list-user-inner">
							<div :bx-tooltip-user-id="user.id" bx-tooltip-context="b24">
								<span class="tasks-time-tracking-list-user-image">
									<UserAvatar :src="user.image" :type="user.type"/>
								</span>
								<span class="tasks-time-tracking-list-user-title">{{ user.name }}</span>
							</div>
							<div>
								<span class="tasks-time-tracking-list-user-time">
									{{ formatTime(contribution[user.id]) }}
								</span>
								<BIcon class="tasks-time-tracking-list-user-icon" :name="Outline.TIMER"/>
							</div>
						</div>
					</div>
				</template>
			</div>
		</Popup>
	`
	};

	// @vue/component
	const TimeTrackingTimer = {
	  name: 'TasksTimeTrackingTimer',
	  props: {
	    timeSpent: {
	      type: Number,
	      default: 0,
	      validator: value => value >= 0
	    },
	    totalTime: {
	      type: Number,
	      default: null
	    },
	    isRunning: {
	      type: Boolean,
	      default: false
	    }
	  },
	  emits: ['update'],
	  data() {
	    return {
	      internalCurrentTime: 0,
	      timer: null,
	      internalIsRunning: false
	    };
	  },
	  computed: {
	    hasTotalTime() {
	      return !main_core.Type.isNil(this.totalTime) && this.totalTime > 0;
	    },
	    isTotalTimeExceeded() {
	      return this.hasTotalTime && this.internalCurrentTime > this.totalTime;
	    },
	    formattedCurrentTime() {
	      return formatTime(this.internalCurrentTime);
	    },
	    formattedTotalTime() {
	      return formatTime(this.totalTime);
	    },
	    currentTimeClass() {
	      if (!this.internalIsRunning) {
	        return '';
	      }
	      return '--running';
	    },
	    totalTimeClass() {
	      if (this.isTotalTimeExceeded) {
	        return '--exceeded';
	      }
	      return '';
	    }
	  },
	  watch: {
	    timeSpent: {
	      immediate: true,
	      handler(newVal) {
	        this.internalCurrentTime = newVal;
	      }
	    },
	    isRunning: {
	      immediate: true,
	      handler(newVal) {
	        if (newVal) {
	          this.startTimer();
	        } else {
	          this.stopTimer();
	        }
	      }
	    }
	  },
	  beforeUnmount() {
	    this.stopTimer();
	  },
	  methods: {
	    startTimer() {
	      this.stopTimer();
	      this.internalIsRunning = true;
	      this.timer = setInterval(() => {
	        this.internalCurrentTime++;
	        this.$emit('update', this.internalCurrentTime);
	      }, 1000);
	    },
	    stopTimer() {
	      this.internalIsRunning = false;
	      if (this.timer) {
	        clearInterval(this.timer);
	        this.timer = null;
	      }
	    },
	    setTime(seconds) {
	      this.internalCurrentTime = Math.max(0, Math.min(seconds, this.totalTime));
	      this.$emit('update', this.internalCurrentTime);
	    }
	  },
	  template: `
		<div class="tasks-task-time-tracking-timer">
			<div class="tasks-task-time-tracking-timer-current print-font-color-base-1" :class="currentTimeClass">
				{{ formattedCurrentTime }}
			</div>
			<div v-if="hasTotalTime" class="tasks-task-time-tracking-timer-separator print-font-color-base-1"> / </div>
			<div v-if="hasTotalTime" class="tasks-task-time-tracking-timer-total print-font-color-base-1" :class="totalTimeClass">
				{{ formattedTotalTime }}
			</div>
		</div>
	`
	};

	// @vue/component
	const TimeTrackingSheet = {
	  name: 'TasksTimeTrackingSheet',
	  components: {
	    BIcon: ui_iconSet_api_vue.BIcon,
	    BLine: ui_system_skeleton_vue.BLine,
	    BottomSheet: tasks_v2_component_elements_bottomSheet.BottomSheet,
	    HeadlineSm: ui_system_typography_vue.HeadlineSm,
	    UiButton: ui_vue3_components_button.Button,
	    UserAvatarList: tasks_v2_component_elements_userAvatarList.UserAvatarList,
	    TimeTrackingInvoiceHint,
	    TimeTrackingList,
	    TimeTrackingParticipantsPopup,
	    TaskTrackingPopup,
	    TimeTrackingTimer
	  },
	  inject: {
	    task: {},
	    taskId: {}
	  },
	  props: {
	    sheetBindProps: {
	      type: Object,
	      required: true
	    },
	    timeSpent: {
	      type: Number,
	      required: true
	    },
	    isTimerRunning: {
	      type: Boolean,
	      required: false
	    }
	  },
	  emits: ['close'],
	  setup() {
	    return {
	      AirButtonStyle: ui_vue3_components_button.AirButtonStyle,
	      ButtonSize: ui_vue3_components_button.ButtonSize,
	      ButtonIcon: ui_vue3_components_button.ButtonIcon,
	      ButtonColor: ui_vue3_components_button.ButtonColor,
	      Outline: ui_iconSet_api_vue.Outline
	    };
	  },
	  data() {
	    return {
	      loading: true,
	      isParticipantsLoading: true,
	      isSettingsPopupShown: false,
	      isParticipantsPopupShown: false,
	      isSheetShown: false,
	      isInvoiceHintShown: false,
	      participants: [],
	      contribution: []
	    };
	  },
	  computed: {
	    isTimeTrackingLocked() {
	      return !tasks_v2_core.Core.getParams().restrictions.timeTracking.available;
	    }
	  },
	  async mounted() {
	    if (this.task.numberOfElapsedTimes > 0) {
	      void this.loadParticipants();
	      await tasks_v2_provider_service_timeTrackingService.timeTrackingService.list(this.taskId, {
	        reset: true
	      });
	    } else {
	      this.isParticipantsLoading = false;
	    }
	    this.loading = false;
	  },
	  methods: {
	    handleClosePopup() {
	      this.isSettingsPopupShown = false;
	      if (!this.task.allowsTimeTracking) {
	        this.$emit('close');
	      }
	    },
	    handleAvatarListClick() {
	      if (this.participants.length > 1) {
	        this.isParticipantsPopupShown = true;
	      }
	    },
	    async loadParticipants() {
	      const [participants, contribution] = await tasks_v2_provider_service_timeTrackingService.timeTrackingService.listParticipants(this.taskId);
	      this.participants = participants;
	      this.contribution = contribution;
	      this.isParticipantsLoading = false;
	    }
	  },
	  template: `
		<BottomSheet
			customClass="tasks-task-time-tracking-sheet"
			:sheetBindProps
			@close="$emit('close')"
		>
			<div class="tasks-task-time-tracking-sheet-container">
				<div class="tasks-task-time-tracking-sheet-header">
					<HeadlineSm>{{ loc('TASKS_V2_TIME_TRACKING_TITLE_SHEET') }}</HeadlineSm>
					<div class="tasks-task-time-tracking-sheet-header-icons">
						<BIcon
							ref="filterIcon"
							v-if="task.rights.edit && !isTimeTrackingLocked"
							class="tasks-task-time-tracking-sheet-filter"
							:name="Outline.FILTER_2_LINES"
							hoverable
							@click="isSettingsPopupShown = true"
						/>
						<BIcon
							class="tasks-task-time-tracking-sheet-close"
							:name="Outline.CROSS_L"
							hoverable
							@click="$emit('close')"
						/>
					</div>
				</div>
				<div class="tasks-task-time-tracking-sheet-content">
					<TimeTrackingList
						:numbers="Math.min(20, task.numberOfElapsedTimes)"
						:loading
						:sheetBindProps
					/>
				</div>
				<div class="tasks-task-time-tracking-sheet-footer">
					<div class="tasks-task-time-tracking-sheet-timer">
						<div class="tasks-task-time-tracking-sheet-timer-label">
							{{ loc('TASKS_V2_TIME_TRACKING_SHEET_TIMER_LABEL') }}
						</div>
						<TimeTrackingTimer
							:timeSpent
							:totalTime="task.estimatedTime"
							:isRunning="isTimerRunning"
						/>
					</div>
					<div v-if="isParticipantsLoading">
						<BLine :width="120" :height="20"/>
					</div>
					<div
						v-else-if="task.numberOfElapsedTimes > 0"
						ref="participants"
						class="tasks-task-time-tracking-sheet-users"
					>
						<UserAvatarList
							:users="participants"
							:visibleAmount="5"
							:withPopup="false"
							@click="handleAvatarListClick"
						/>
						<TimeTrackingParticipantsPopup
							:isShown="isParticipantsPopupShown"
							:bindElement="$refs.participants"
							:users="participants"
							:contribution
							@close="isParticipantsPopupShown = false"
						/>
					</div>
					<div
						ref="invoiceBtn"
						class="tasks-task-time-tracking-sheet-invoice"
						@mouseover="isInvoiceHintShown = true"
					>
						<UiButton
							:text="loc('TASKS_V2_TIME_TRACKING_SHEET_TIMER_BTN_INVOICE')"
							:style="AirButtonStyle.OUTLINE_ACCENT_2"
							:size="ButtonSize.SMALL"
						/>
					</div>
				</div>
			</div>
			<TaskTrackingPopup
				v-if="isSettingsPopupShown"
				:bindElement="$refs.filterIcon.$el"
				:timeSpent
				@close="handleClosePopup"
			/>
			<TimeTrackingInvoiceHint
				v-if="isInvoiceHintShown"
				:bindElement="$refs.invoiceBtn"
				@close="isInvoiceHintShown = false"
			/>
		</BottomSheet>
	`
	};

	const timeTrackingMeta = Object.freeze({
	  id: tasks_v2_const.TaskField.TimeTracking,
	  title: main_core.Loc.getMessage('TASKS_V2_TIME_TRACKING_TITLE')
	});

	// @vue/component
	const TimeTracking = {
	  name: 'TasksTimeTracking',
	  components: {
	    BIcon: ui_iconSet_api_vue.BIcon,
	    HoverPill: tasks_v2_component_elements_hoverPill.HoverPill,
	    SettingsLabel: tasks_v2_component_elements_settingsLabel.SettingsLabel,
	    TextMd: ui_system_typography_vue.TextMd,
	    TaskTrackingPopup,
	    TimeTrackingSheet,
	    TimeTrackingTimer
	  },
	  inject: {
	    task: {},
	    isEdit: {},
	    isTemplate: {}
	  },
	  props: {
	    isSheetShown: {
	      type: Boolean,
	      required: true
	    },
	    sheetBindProps: {
	      type: Object,
	      required: true
	    }
	  },
	  emits: ['update:isSheetShown'],
	  setup() {
	    return {
	      Outline: ui_iconSet_api_vue.Outline,
	      timeTrackingMeta
	    };
	  },
	  data() {
	    return {
	      isPopupShown: false,
	      isFieldHovered: false,
	      localTimeSpent: 0
	    };
	  },
	  computed: {
	    ...ui_vue3_vuex.mapGetters({
	      currentUserId: `${tasks_v2_const.Model.Interface}/currentUserId`
	    }),
	    timer() {
	      var _this$task$timers;
	      return (_this$task$timers = this.task.timers) == null ? void 0 : _this$task$timers.find(timer => timer.userId === this.currentUserId);
	    },
	    readonly() {
	      return this.isTemplate || !this.isEdit;
	    },
	    timeSpent() {
	      var _this$timer$startedAt, _this$timer;
	      const currentTs = Math.floor(Date.now() / 1000);
	      const timerStartedTs = (_this$timer$startedAt = (_this$timer = this.timer) == null ? void 0 : _this$timer.startedAtTs) != null ? _this$timer$startedAt : 0;
	      const timeSpent = timerStartedTs === 0 ? this.task.timeSpent : this.task.timeSpent + currentTs - timerStartedTs;
	      return main_core.Type.isNumber(timeSpent) ? timeSpent : 0;
	    },
	    isLocked() {
	      return !tasks_v2_core.Core.getParams().restrictions.timeElapsed.available;
	    },
	    isTimeTrackingLocked() {
	      return !tasks_v2_core.Core.getParams().restrictions.timeTracking.available;
	    }
	  },
	  methods: {
	    handleClick() {
	      if (this.isLocked) {
	        void tasks_v2_lib_showLimit.showLimit({
	          featureId: tasks_v2_core.Core.getParams().restrictions.timeElapsed.featureId
	        });
	        return;
	      }
	      if (!this.readonly) {
	        this.setSheetShown(true);
	      }
	    },
	    handleClosePopup() {
	      this.isPopupShown = false;
	      this.highlightField();
	    },
	    handleTimerUpdate(currentTime) {
	      this.localTimeSpent = currentTime;
	    },
	    setSheetShown(isShown) {
	      this.$emit('update:isSheetShown', isShown);
	    },
	    highlightField() {
	      void tasks_v2_lib_fieldHighlighter.fieldHighlighter.setContainer(this.$root.$el).highlight(timeTrackingMeta.id);
	    },
	    handleSettingsClick() {
	      if (this.isTimeTrackingLocked) {
	        void tasks_v2_lib_showLimit.showLimit({
	          featureId: tasks_v2_core.Core.getParams().restrictions.timeTracking.featureId
	        });
	        return;
	      }
	      this.isPopupShown = true;
	    }
	  },
	  template: `
		<div 
			class="tasks-task-time-tracking" 
			:data-task-field-id="timeTrackingMeta.id"
			@mouseover="isFieldHovered = true"
			@mouseleave="isFieldHovered = false"
		>
			<HoverPill
				:readonly
				@click="handleClick"
				ref="timer"
			>
				<BIcon class="tasks-task-time-tracking-icon" :name="Outline.TIMER"/>
				<TimeTrackingTimer
					:timeSpent
					:totalTime="task.estimatedTime"
					:isRunning="Boolean(timer)"
					@update="handleTimerUpdate"
				/>
			</HoverPill>
			<div 
				v-if="task.rights.edit && !isTimeTrackingLocked" 
				class="tasks-task-time-tracking-settings"
				ref="settings"
			>
				<SettingsLabel
					v-if="isFieldHovered || isPopupShown"
					data-time-tracking-settings
					@click="handleSettingsClick"
				/>
			</div>
		</div>
		<TaskTrackingPopup
			v-if="isPopupShown"
			:bindElement="$refs.settings"
			:timeSpent
			@close="handleClosePopup"
		/>
		<TimeTrackingSheet
			v-if="isSheetShown"
			:sheetBindProps
			:timeSpent
			:isTimerRunning="Boolean(timer)"
			@close="setSheetShown(false)"
		/>
	`
	};

	// @vue/component
	const TimeTrackingChip = {
	  components: {
	    Chip: ui_system_chip_vue.Chip,
	    TaskTrackingPopup,
	    TimeTrackingSheet
	  },
	  inject: {
	    task: {},
	    taskId: {},
	    isEdit: {},
	    isTemplate: {}
	  },
	  props: {
	    isSheetShown: {
	      type: Boolean,
	      required: true
	    },
	    sheetBindProps: {
	      type: Object,
	      required: true
	    }
	  },
	  emits: ['update:isSheetShown'],
	  setup() {
	    return {
	      Outline: ui_iconSet_api_vue.Outline,
	      timeTrackingMeta
	    };
	  },
	  data() {
	    return {
	      isPopupShown: false,
	      localTimeSpent: 0
	    };
	  },
	  computed: {
	    ...ui_vue3_vuex.mapGetters({
	      currentUserId: `${tasks_v2_const.Model.Interface}/currentUserId`
	    }),
	    timer() {
	      var _this$task$timers;
	      return (_this$task$timers = this.task.timers) == null ? void 0 : _this$task$timers.find(timer => timer.userId === this.currentUserId);
	    },
	    design() {
	      return this.isSelected ? ui_system_chip_vue.ChipDesign.ShadowAccent : ui_system_chip_vue.ChipDesign.ShadowNoAccent;
	    },
	    isSelected() {
	      return this.task.allowsTimeTracking || this.task.numberOfElapsedTimes;
	    },
	    readonly() {
	      return this.isTemplate || !this.isEdit;
	    },
	    isLocked() {
	      return !tasks_v2_core.Core.getParams().restrictions.timeElapsed.available;
	    },
	    isTimeTrackingLocked() {
	      return !tasks_v2_core.Core.getParams().restrictions.timeTracking.available;
	    }
	  },
	  created() {
	    var _this$timer$startedAt, _this$timer;
	    const currentTs = Math.floor(Date.now() / 1000);
	    const timerStartedTs = (_this$timer$startedAt = (_this$timer = this.timer) == null ? void 0 : _this$timer.startedAtTs) != null ? _this$timer$startedAt : 0;
	    const localTimeSpent = timerStartedTs === 0 ? this.task.timeSpent : this.task.timeSpent + currentTs - timerStartedTs;
	    this.localTimeSpent = main_core.Type.isNumber(localTimeSpent) ? localTimeSpent : 0;
	  },
	  methods: {
	    handleClick() {
	      if (this.isLocked) {
	        void tasks_v2_lib_showLimit.showLimit({
	          featureId: tasks_v2_core.Core.getParams().restrictions.timeElapsed.featureId
	        });
	        return;
	      }
	      if (this.canOnlyAddFirstElapsedTime()) {
	        this.setSheetShown(true);
	        return;
	      }
	      if (this.isSelected) {
	        this.highlightField();
	        return;
	      }
	      if (this.isTimeTrackingLocked) {
	        void tasks_v2_lib_showLimit.showLimit({
	          featureId: tasks_v2_core.Core.getParams().restrictions.timeTracking.featureId
	        });
	        return;
	      }
	      this.isPopupShown = true;
	    },
	    handleClosePopup() {
	      this.isPopupShown = false;
	      this.highlightField();
	    },
	    setSheetShown(isShown) {
	      this.$emit('update:isSheetShown', isShown);
	    },
	    highlightField() {
	      void tasks_v2_lib_fieldHighlighter.fieldHighlighter.setContainer(this.$root.$el).highlight(timeTrackingMeta.id);
	    },
	    canOnlyAddFirstElapsedTime() {
	      return (!this.task.rights.edit || this.isTimeTrackingLocked) && this.task.rights.elapsedTime && !this.task.numberOfElapsedTimes && !this.readonly;
	    }
	  },
	  template: `
		<Chip
			v-if="isSelected || task.rights.elapsedTime"
			ref="chip"
			:design
			:icon="Outline.TIMER"
			:text="loc('TASKS_V2_TIME_TRACKING_CHIP_TITLE')"
			:lock="isLocked"
			:data-task-id="taskId"
			:data-task-chip-id="timeTrackingMeta.id"
			@click="handleClick"
		/>
		<TaskTrackingPopup
			v-if="isPopupShown"
			:bindElement="$refs.chip.$el"
			:timeSpent="localTimeSpent"
			@close="handleClosePopup"
		/>
		<TimeTrackingSheet
			v-if="isSheetShown"
			:sheetBindProps
			:timeSpent="localTimeSpent"
			:isTimerRunning="Boolean(timer)"
			@close="setSheetShown(false)"
		/>
	`
	};

	exports.TimeTracking = TimeTracking;
	exports.TimeTrackingChip = TimeTrackingChip;
	exports.timeTrackingMeta = timeTrackingMeta;
	exports.TimeTrackingTimer = TimeTrackingTimer;

}((this.BX.Tasks.V2.Component.Fields = this.BX.Tasks.V2.Component.Fields || {}),BX.Tasks.V2.Component.Elements,BX.Tasks.V2.Component.Elements,BX.UI,BX.UI.Vue3.Components,BX.Tasks.V2.Provider.Service,BX.Tasks.V2.Provider.Service,BX.Tasks.V2.Provider.Service,BX.Tasks.V2.Component.Elements,BX.Tasks.V2.Component.Elements,BX.UI.Dialogs,BX.Tasks.V2.Lib,BX.Tasks.V2.Lib,BX.Tasks.V2.Provider.Service,BX.UI.System.Input.Vue,BX.Vue3.Components,BX.UI.DatePicker,BX.Tasks.V2.Lib,BX.Main,BX.UI.System.Typography.Vue,BX.Vue3.Directives,BX.Tasks.V2.Component.Elements,BX.Tasks.V2.Component.Elements,BX.Tasks.V2.Lib,BX.UI.System.Skeleton.Vue,BX.UI.Vue3.Components,BX.UI,BX.Tasks.V2.Component.Elements,BX,BX.Vue3.Vuex,BX.UI.System.Chip.Vue,BX.UI.IconSet,BX,BX.Tasks.V2,BX.Tasks.V2.Const,BX.Tasks.V2.Lib,BX.Tasks.V2.Lib));
//# sourceMappingURL=time-tracking.bundle.js.map
