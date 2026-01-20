/* eslint-disable */
this.BX = this.BX || {};
this.BX.Tasks = this.BX.Tasks || {};
this.BX.Tasks.V2 = this.BX.Tasks.V2 || {};
this.BX.Tasks.V2.Component = this.BX.Tasks.V2.Component || {};
(function (exports,main_core,main_date,ui_vue3_directives_hint,tasks_v2_component_elements_hint,tasks_v2_component_elements_bottomSheet,ui_datePicker,ui_vue3_components_button,ui_system_input_vue,ui_system_menu_vue,ui_system_typography_vue,tasks_v2_core,tasks_v2_const,tasks_v2_component_elements_duration,tasks_v2_lib_entitySelectorDialog,tasks_v2_lib_calendar,tasks_v2_lib_timezone,tasks_v2_provider_service_remindersService,ui_system_skeleton_vue,ui_system_chip_vue,ui_iconSet_api_vue,ui_iconSet_outline,tasks_v2_lib_fieldHighlighter) {
	'use strict';

	const remindersMeta = Object.freeze({
	  id: tasks_v2_const.TaskField.Reminders,
	  title: main_core.Loc.getMessage('TASKS_V2_CHECK_LIST_TITLE'),
	  to: {
	    [tasks_v2_const.RemindTo.Responsible]: {
	      icon: ui_iconSet_api_vue.Outline.PERSON,
	      title: main_core.Loc.getMessage('TASKS_V2_REMINDERS_RECIPIENT_RESPONSIBLE')
	    },
	    [tasks_v2_const.RemindTo.Creator]: {
	      icon: ui_iconSet_api_vue.Outline.CROWN,
	      title: main_core.Loc.getMessage('TASKS_V2_REMINDERS_RECIPIENT_CREATOR')
	    },
	    [tasks_v2_const.RemindTo.Accomplice]: {
	      icon: ui_iconSet_api_vue.Outline.GROUP,
	      title: main_core.Loc.getMessage('TASKS_V2_REMINDERS_RECIPIENT_ACCOMPLICE')
	    },
	    [tasks_v2_const.RemindTo.Myself]: {
	      icon: ui_iconSet_api_vue.Outline.BOOKMARK,
	      title: main_core.Loc.getMessage('TASKS_V2_REMINDERS_RECIPIENT_MYSELF')
	    }
	  },
	  by: {
	    [tasks_v2_const.RemindBy.Date]: main_core.Loc.getMessage('TASKS_V2_REMINDERS_REMIND_BY_DATE'),
	    [tasks_v2_const.RemindBy.Deadline]: main_core.Loc.getMessage('TASKS_V2_REMINDERS_REMIND_BY_DEADLINE')
	  },
	  via: {
	    [tasks_v2_const.RemindVia.Notification]: {
	      icon: ui_iconSet_api_vue.Outline.EMPTY_MESSAGE,
	      title: main_core.Loc.getMessage('TASKS_V2_REMINDERS_SEND_VIA_NOTIFICATION')
	    },
	    [tasks_v2_const.RemindVia.Email]: {
	      icon: ui_iconSet_api_vue.Outline.MAIL,
	      title: main_core.Loc.getMessage('TASKS_V2_REMINDERS_SEND_VIA_EMAIL')
	    }
	  }
	});

	// @vue/component
	const ListHeader = {
	  name: 'TasksRemindersListHeader',
	  components: {
	    Text2Xs: ui_system_typography_vue.Text2Xs
	  },
	  template: `
		<div class="tasks-field-reminders-row --header">
			<div class="tasks-field-reminders-column --header --via">
				<Text2Xs>{{ loc('TASKS_V2_REMINDERS_LIST_COLUMN_VIA') }}</Text2Xs>
			</div>
			<div class="tasks-field-reminders-column --header --date">
				<Text2Xs>{{ loc('TASKS_V2_REMINDERS_LIST_COLUMN_DATE') }}</Text2Xs>
			</div>
			<div class="tasks-field-reminders-column --header --recipients">
				<Text2Xs>{{ loc('TASKS_V2_REMINDERS_LIST_COLUMN_TO') }}</Text2Xs>
			</div>
		</div>
	`
	};

	// @vue/component
	const ReminderSheetContent = {
	  components: {
	    UiButton: ui_vue3_components_button.Button,
	    BMenu: ui_system_menu_vue.BMenu,
	    BIcon: ui_iconSet_api_vue.BIcon,
	    BInput: ui_system_input_vue.BInput,
	    HeadlineMd: ui_system_typography_vue.HeadlineMd,
	    Duration: tasks_v2_component_elements_duration.Duration
	  },
	  inject: {
	    task: {},
	    taskId: {}
	  },
	  props: {
	    reminderId: {
	      type: [Number, String],
	      required: true
	    },
	    close: {
	      type: Function,
	      required: true
	    }
	  },
	  setup() {
	    return {
	      AirButtonStyle: ui_vue3_components_button.AirButtonStyle,
	      ButtonSize: ui_vue3_components_button.ButtonSize,
	      Outline: ui_iconSet_api_vue.Outline,
	      ChipDesign: ui_system_chip_vue.ChipDesign,
	      RemindBy: tasks_v2_const.RemindBy,
	      remindersMeta
	    };
	  },
	  data() {
	    return {
	      recipients: [tasks_v2_const.RemindTo.Responsible],
	      remindBy: tasks_v2_const.RemindBy.Date,
	      dateTs: null,
	      duration: 0,
	      remindVia: tasks_v2_const.RemindVia.Notification,
	      isDialogShown: false,
	      isPickerShown: false,
	      isTypeMenuShown: false,
	      isViaMenuShown: false
	    };
	  },
	  computed: {
	    reminder() {
	      return this.$store.getters[`${tasks_v2_const.Model.Reminders}/getById`](this.reminderId);
	    },
	    before() {
	      return this.remindBy === tasks_v2_const.RemindBy.Deadline ? this.duration : null;
	    },
	    nextRemindTs() {
	      return this.remindBy === tasks_v2_const.RemindBy.Date ? this.dateTs : this.task.deadlineTs - this.before;
	    },
	    typeMenuOptions() {
	      return () => ({
	        bindElement: this.$refs.type.$el,
	        closeOnItemClick: false,
	        items: Object.entries(remindersMeta.by).map(([remindBy, title]) => {
	          const isDisabled = remindBy === tasks_v2_const.RemindBy.Deadline && !(this.task.deadlineTs > 0);
	          return {
	            title,
	            isSelected: remindBy === this.remindBy,
	            design: isDisabled ? ui_system_menu_vue.MenuItemDesign.Disabled : ui_system_menu_vue.MenuItemDesign.Default,
	            onClick: () => {
	              if (!isDisabled) {
	                this.remindBy = remindBy;
	                this.isTypeMenuShown = false;
	              }
	            }
	          };
	        }),
	        targetContainer: document.body
	      });
	    },
	    viaMenuOptions() {
	      return () => ({
	        bindElement: this.$refs.via.$el,
	        items: Object.entries(remindersMeta.via).map(([remindVia, {
	          title,
	          icon
	        }]) => {
	          return {
	            title,
	            icon,
	            isSelected: remindVia === this.remindVia,
	            onClick: () => {
	              this.remindVia = remindVia;
	            }
	          };
	        }),
	        targetContainer: document.body
	      });
	    },
	    usersChips() {
	      return this.recipients.map(id => ({
	        id,
	        design: ui_system_chip_vue.ChipDesign.Tinted,
	        text: remindersMeta.to[id].title,
	        withClear: true
	      }));
	    },
	    title() {
	      if (this.reminderId) {
	        return this.loc('TASKS_V2_REMINDERS_UPDATE_SHEET');
	      }
	      return this.loc('TASKS_V2_REMINDERS_ADD_SHEET');
	    }
	  },
	  created() {
	    if (!this.reminder) {
	      return;
	    }
	    this.recipients = [this.reminder.recipient];
	    this.remindBy = this.reminder.remindBy;
	    this.dateTs = this.reminder.nextRemindTs;
	    this.remindVia = this.reminder.remindVia;
	    if (this.reminder.remindBy === tasks_v2_const.RemindBy.Deadline) {
	      var _this$reminder$before;
	      this.duration = (_this$reminder$before = this.reminder.before) != null ? _this$reminder$before : this.task.deadlineTs - this.reminder.nextRemindTs;
	    }
	  },
	  methods: {
	    save() {
	      const reminder = {
	        id: this.reminderId || `tmp${Date.now()}`,
	        taskId: this.taskId,
	        userId: tasks_v2_core.Core.getParams().currentUser.id,
	        nextRemindTs: this.nextRemindTs,
	        remindBy: this.remindBy,
	        remindVia: this.remindVia,
	        recipient: this.recipients[0],
	        before: this.before
	      };
	      if (this.reminderId) {
	        void tasks_v2_provider_service_remindersService.remindersService.update(reminder);
	      } else {
	        void tasks_v2_provider_service_remindersService.remindersService.add(reminder);
	      }
	      this.close();
	    },
	    showDialog({
	      currentTarget
	    }) {
	      var _this$dialog;
	      this.isDialogShown = true;
	      (_this$dialog = this.dialog) != null ? _this$dialog : this.dialog = this.createDialog();
	      const ids = this.recipients.map(id => [tasks_v2_const.EntitySelectorEntity.ReminderRecipient, id]);
	      this.dialog.selectItemsByIds(ids);
	      this.dialog.showTo(currentTarget);
	    },
	    createDialog() {
	      const entityId = tasks_v2_const.EntitySelectorEntity.ReminderRecipient;
	      const dialog = new tasks_v2_lib_entitySelectorDialog.EntitySelectorDialog({
	        width: 400,
	        height: 200,
	        dropdownMode: true,
	        multiple: false,
	        entities: [{
	          id: entityId
	        }],
	        items: Object.entries(remindersMeta.to).map(([id, {
	          icon,
	          title
	        }]) => ({
	          id,
	          entityId,
	          title,
	          avatarOptions: {
	            icon,
	            iconColor: 'var(--ui-color-accent-main-primary)',
	            bgColor: 'var(--ui-color-accent-soft-blue-2)'
	          },
	          tabs: ['recents']
	        }))
	      });
	      dialog.getPopup().subscribeFromOptions({
	        onClose: () => {
	          this.recipients = dialog.getSelectedItems().map(item => item.getId());
	          this.isDialogShown = false;
	        }
	      });
	      return dialog;
	    },
	    handleUserClear(chip) {
	      this.recipients = this.recipients.filter(id => id !== chip.id);
	    },
	    showPicker({
	      currentTarget
	    }) {
	      var _this$picker;
	      (_this$picker = this.picker) != null ? _this$picker : this.picker = this.createPicker();
	      this.picker.setTargetNode(currentTarget);
	      this.picker.show();
	    },
	    createPicker() {
	      const picker = new ui_datePicker.DatePicker({
	        selectedDates: this.dateTs ? [this.dateTs + tasks_v2_lib_timezone.timezone.getOffset(this.dateTs)] : null,
	        enableTime: true,
	        defaultTime: tasks_v2_lib_calendar.calendar.dayStartTime,
	        events: {
	          [ui_datePicker.DatePickerEvent.SELECT]: event => {
	            const {
	              date
	            } = event.getData();
	            const dateTs = tasks_v2_lib_calendar.calendar.createDateFromUtc(date).getTime();
	            this.dateTs = dateTs - tasks_v2_lib_timezone.timezone.getOffset(dateTs);
	          },
	          onShow: () => {
	            this.isPickerShown = true;
	          },
	          onHide: () => {
	            this.isPickerShown = false;
	          }
	        },
	        popupOptions: {
	          animation: 'fading',
	          targetContainer: document.body
	        }
	      });
	      picker.getPicker('day').subscribe('onSelect', () => picker.hide());
	      let selectedHour = null;
	      picker.getPicker('time').subscribe('onSelect', event => {
	        const {
	          hour,
	          minute
	        } = event.getData();
	        if (Number.isInteger(minute) || hour === selectedHour) {
	          picker.hide();
	        }
	        selectedHour = hour;
	      });
	      return picker;
	    },
	    handleDateClear() {
	      var _this$picker2;
	      (_this$picker2 = this.picker) == null ? void 0 : _this$picker2.deselectDate(this.dateTs + tasks_v2_lib_timezone.timezone.getOffset(this.dateTs));
	      this.dateTs = null;
	    },
	    formatDate(timestamp) {
	      return tasks_v2_lib_calendar.calendar.formatDateTime(timestamp);
	    }
	  },
	  template: `
		<div class="tasks-field-reminder-sheet">
			<div class="tasks-field-reminder-sheet-header">
				<HeadlineMd>{{ title }}</HeadlineMd>
				<BIcon :name="Outline.CROSS_L" hoverable @click="close"/>
			</div>
			<BInput
				:label="loc('TASKS_V2_REMINDERS_RECIPIENT')"
				:placeholder="loc('TASKS_V2_REMINDERS_RECIPIENT_PLACEHOLDER')"
				:chips="usersChips"
				clickable
				:active="isDialogShown"
				@click="showDialog"
				@chipClear="handleUserClear"
			/>
			<BInput
				:modelValue="remindersMeta.by[remindBy]"
				:label="loc('TASKS_V2_REMINDERS_TYPE')"
				dropdown
				clickable
				:active="isTypeMenuShown"
				ref="type"
				@click="isTypeMenuShown = true"
			/>
			<BInput
				v-if="remindBy === RemindBy.Date"
				:modelValue="formatDate(dateTs)"
				:label="loc('TASKS_V2_REMINDERS_REMIND_BY_DATE_TITLE')"
				:icon="Outline.CALENDAR_WITH_SLOTS"
				:withClear="dateTs > 0"
				clickable
				:active="isPickerShown"
				@clear="handleDateClear"
				@click="showPicker"
			/>
			<Duration
				v-else
				v-model="duration"
				:label="loc('TASKS_V2_REMINDERS_REMIND_BY_DEADLINE_TITLE')"
			/>
			<BInput
				:modelValue="remindersMeta.via[remindVia].title"
				:label="loc('TASKS_V2_REMINDERS_SEND_VIA')"
				dropdown
				clickable
				:active="isViaMenuShown"
				ref="via"
				@click="isViaMenuShown = true"
			/>
			<div class="tasks-field-reminders-sheet-footer">
				<UiButton
					:text="loc('TASKS_V2_REMINDERS_SAVE')"
					:style="AirButtonStyle.PRIMARY"
					:size="ButtonSize.LARGE"
					:disabled="!nextRemindTs || !recipients.length"
					@click="save"
				/>
				<UiButton
					:text="loc('TASKS_V2_REMINDERS_CANCEL')"
					:style="AirButtonStyle.OUTLINE"
					:size="ButtonSize.LARGE"
					@click="close"
				/>
			</div>
		</div>
		<BMenu v-if="isTypeMenuShown" :options="typeMenuOptions()" @close="isTypeMenuShown = false"/>
		<BMenu v-if="isViaMenuShown" :options="viaMenuOptions()" @close="isViaMenuShown = false"/>
	`
	};

	// @vue/component
	const ReminderSheet = {
	  name: 'TaskReminderSheet',
	  components: {
	    BottomSheet: tasks_v2_component_elements_bottomSheet.BottomSheet,
	    ReminderSheetContent
	  },
	  props: {
	    reminderId: {
	      type: [Number, String],
	      default: 0
	    },
	    sheetBindProps: {
	      type: Object,
	      required: true
	    }
	  },
	  emits: ['close'],
	  template: `
		<BottomSheet :sheetBindProps @close="$emit('close')">
			<ReminderSheetContent
				:reminderId
				:close="() => $emit('close')"
			/>
		</BottomSheet>
	`
	};

	// @vue/component
	const ListItem = {
	  name: 'TasksRemindersListItem',
	  components: {
	    BIcon: ui_iconSet_api_vue.BIcon,
	    TextXs: ui_system_typography_vue.TextXs,
	    TextMd: ui_system_typography_vue.TextMd,
	    ReminderSheet
	  },
	  directives: {
	    hint: ui_vue3_directives_hint.hint
	  },
	  inject: {
	    task: {}
	  },
	  props: {
	    reminderId: {
	      type: [Number, String],
	      required: true
	    },
	    sheetBindProps: {
	      type: Object,
	      required: true
	    }
	  },
	  emits: ['edit'],
	  setup() {
	    return {
	      Outline: ui_iconSet_api_vue.Outline,
	      remindersMeta
	    };
	  },
	  data() {
	    return {
	      isItemHovered: false,
	      isSheetShown: false
	    };
	  },
	  computed: {
	    reminder() {
	      return this.$store.getters[`${tasks_v2_const.Model.Reminders}/getById`](this.reminderId);
	    },
	    reminderDate() {
	      var _this$reminder$before;
	      const remindByDeadline = this.reminder.remindBy === tasks_v2_const.RemindBy.Deadline;
	      const before = (_this$reminder$before = this.reminder.before) != null ? _this$reminder$before : this.task.deadlineTs - this.reminder.nextRemindTs;
	      const dateTs = remindByDeadline ? this.task.deadlineTs - before : this.reminder.nextRemindTs;
	      const format = main_core.Loc.getMessage('TASKS_V2_DATE_TIME_FORMAT', {
	        '#DATE#': main_date.DateTimeFormat.getFormat('FORMAT_DATE'),
	        '#TIME#': main_date.DateTimeFormat.getFormat('SHORT_TIME_FORMAT')
	      });
	      return main_date.DateTimeFormat.format(format, (dateTs + tasks_v2_lib_timezone.timezone.getOffset(dateTs)) / 1000);
	    },
	    recipient() {
	      return remindersMeta.to[this.reminder.recipient];
	    },
	    viaTooltip() {
	      return () => tasks_v2_component_elements_hint.tooltip({
	        text: remindersMeta.via[this.reminder.remindVia].title,
	        popupOptions: {
	          offsetLeft: this.$refs.via.$el.offsetWidth / 2
	        }
	      });
	    },
	    editTooltip() {
	      return () => tasks_v2_component_elements_hint.tooltip({
	        text: this.loc('TASKS_V2_REMINDERS_LIST_ACTION_EDIT'),
	        popupOptions: {
	          offsetLeft: this.$refs.edit.offsetWidth / 2
	        }
	      });
	    },
	    removeTooltip() {
	      return () => tasks_v2_component_elements_hint.tooltip({
	        text: this.loc('TASKS_V2_REMINDERS_LIST_ACTION_REMOVE'),
	        popupOptions: {
	          offsetLeft: this.$refs.remove.offsetWidth / 2
	        }
	      });
	    }
	  },
	  methods: {
	    removeItem() {
	      void tasks_v2_provider_service_remindersService.remindersService.delete(this.reminderId);
	    }
	  },
	  template: `
		<div
			class="tasks-field-reminders-row"
			@mouseover="isItemHovered = true"
			@mouseleave="isItemHovered = false"
		>
			<div class="tasks-field-reminders-column --via">
				<BIcon v-hint="viaTooltip" :name="remindersMeta.via[reminder.remindVia].icon" ref="via"/>
			</div>
			<div class="tasks-field-reminders-column --date">
				<TextMd>{{ reminderDate }}</TextMd>
			</div>
			<div class="tasks-field-reminders-column --recipients">
				<div class="tasks-field-reminders-to">
					<BIcon :name="recipient.icon"/>
				</div>
				<TextMd>{{ recipient.title }}</TextMd>
			</div>
			<div class="tasks-field-reminders-column --action" v-if="isItemHovered">
				<div ref="edit" @click="isSheetShown = true">
					<BIcon v-hint="editTooltip" :name="Outline.EDIT_L" hoverable/>
				</div>
				<div ref="remove" @click="removeItem">
					<BIcon v-hint="removeTooltip" :name="Outline.TRASHCAN" hoverable/>
				</div>
			</div>
		</div>
		<ReminderSheet
			v-if="isSheetShown"
			:reminderId
			:sheetBindProps
			@close="isSheetShown = false"
		/>
	`
	};

	// @vue/component
	const ListItemSkeleton = {
	  components: {
	    BLine: ui_system_skeleton_vue.BLine
	  },
	  template: `
		<div class="tasks-field-reminders-row">
			<div class="tasks-field-reminders-column --via">
				<BLine :width="20" :height="20"/>
			</div>
			<div class="tasks-field-reminders-column --date">
				<BLine :width="160" :height="20"/>
			</div>
			<div class="tasks-field-reminders-column --recipients">
				<BLine :width="187" :height="20"/>
			</div>
		</div>
	`
	};

	// @vue/component
	const List = {
	  name: 'TasksRemindersList',
	  components: {
	    ListHeader,
	    ListItem,
	    ListItemSkeleton
	  },
	  inject: {
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
	  computed: {
	    remindersIds() {
	      return this.$store.getters[`${tasks_v2_const.Model.Reminders}/getIds`](this.taskId, tasks_v2_core.Core.getParams().currentUser.id);
	    }
	  },
	  template: `
		<div class="tasks-field-reminders-list">
			<div class="tasks-field-reminders-list-header">
				<ListHeader/>
			</div>
			<div class="tasks-field-reminders-list-content">
				<template v-if="loading">
					<ListItemSkeleton v-for="key in numbers" :key/>
				</template>
				<template v-else v-for="reminderId in remindersIds" :key="reminderId">
					<ListItem :reminderId :sheetBindProps/>
				</template>
			</div>
		</div>
	`
	};

	// @vue/component
	const RemindersSheet = {
	  name: 'TasksRemindersSheet',
	  components: {
	    BIcon: ui_iconSet_api_vue.BIcon,
	    BottomSheet: tasks_v2_component_elements_bottomSheet.BottomSheet,
	    HeadlineMd: ui_system_typography_vue.HeadlineMd,
	    List,
	    UiButton: ui_vue3_components_button.Button,
	    ReminderSheet
	  },
	  inject: {
	    task: {},
	    taskId: {}
	  },
	  props: {
	    sheetBindProps: {
	      type: Object,
	      required: true
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
	      isLoading: true,
	      isSheetShown: false
	    };
	  },
	  async mounted() {
	    await tasks_v2_provider_service_remindersService.remindersService.list(this.taskId);
	    this.isLoading = false;
	  },
	  template: `
		<BottomSheet :sheetBindProps @close="$emit('close')">
			<div class="tasks-field-reminders-sheet">
				<div class="tasks-field-reminders-sheet-header">
					<HeadlineMd>{{ loc('TASKS_V2_REMINDERS_TITLE_SHEET') }}</HeadlineMd>
					<BIcon
						class="tasks-field-reminders-sheet-close"
						:name="Outline.CROSS_L"
						hoverable
						@click="$emit('close')"
					/>
				</div>
				<div class="tasks-field-reminders-sheet-content">
					<List
						:numbers="task.numberOfReminders"
						:loading="isLoading"
						:sheetBindProps
					/>
				</div>
				<div class="tasks-field-reminders-sheet-footer">
					<UiButton
						:text="loc('TASKS_V2_REMINDERS_ADD')"
						:size="ButtonSize.SMALL"
						:leftIcon="ButtonIcon.ADD"
						:style="AirButtonStyle.TINTED"
						@click="isSheetShown = true"
					/>
				</div>
			</div>
		</BottomSheet>
		<ReminderSheet
			v-if="isSheetShown"
			:sheetBindProps
			@close="isSheetShown = false"
		/>
	`
	};

	// @vue/component
	const Reminders = {
	  name: 'TasksReminders',
	  components: {
	    BIcon: ui_iconSet_api_vue.BIcon,
	    TextMd: ui_system_typography_vue.TextMd,
	    RemindersSheet,
	    ReminderSheet
	  },
	  directives: {
	    hint: ui_vue3_directives_hint.hint
	  },
	  inject: {
	    task: {},
	    taskId: {}
	  },
	  props: {
	    isSheetShown: {
	      type: Boolean,
	      required: true
	    },
	    isListSheetShown: {
	      type: Boolean,
	      required: true
	    },
	    sheetBindProps: {
	      type: Object,
	      required: true
	    }
	  },
	  setup() {
	    return {
	      remindersMeta,
	      Outline: ui_iconSet_api_vue.Outline
	    };
	  },
	  computed: {
	    text() {
	      return this.loc('TASKS_V2_REMINDERS_TITLE', {
	        '#NUMBER#': this.task.numberOfReminders
	      });
	    },
	    readonly() {
	      return !this.task.rights.reminder;
	    },
	    tooltip() {
	      return () => tasks_v2_component_elements_hint.tooltip({
	        text: this.loc('TASKS_V2_REMINDERS_ADD'),
	        popupOptions: {
	          offsetLeft: this.$refs.add.$el.offsetWidth / 2
	        }
	      });
	    }
	  },
	  methods: {
	    setSheetShown(isShown) {
	      this.$emit('update:isSheetShown', isShown);
	    },
	    setListSheetShown(isShown) {
	      this.$emit('update:isListSheetShown', isShown);
	    }
	  },
	  template: `
		<div class="tasks-field-reminders" :data-task-id="taskId" :data-task-field-id="remindersMeta.id">
			<div class="tasks-field-reminders-title">
				<div
					class="tasks-field-reminders-main"
					:class="{ '--readonly': readonly }"
					ref="title"
					@click="setListSheetShown(true)"
				>
					<BIcon :name="Outline.NOTIFICATION"/>
					<TextMd accent>{{ text }}</TextMd>
				</div>
				<div
					v-if="!readonly"
					v-hint="tooltip"
					class="tasks-field-reminders-edit-container"
				>
					<BIcon
						class="tasks-field-reminders-icon"
						:name="Outline.PLUS_L"
						hoverable
						ref="add"
						@click="setSheetShown(true)"
					/>
				</div>
			</div>
		</div>
		<ReminderSheet
			v-if="isSheetShown"
			:sheetBindProps
			@close="setSheetShown(false)"
		/>
		<RemindersSheet
			v-if="isListSheetShown"
			:sheetBindProps
			@close="setListSheetShown(false)"
		/>
	`
	};

	// @vue/component
	const RemindersChip = {
	  name: 'TasksRemindersChip',
	  components: {
	    Chip: ui_system_chip_vue.Chip,
	    ReminderSheet
	  },
	  inject: {
	    task: {},
	    taskId: {}
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
	      remindersMeta,
	      Outline: ui_iconSet_api_vue.Outline
	    };
	  },
	  computed: {
	    design() {
	      return this.isSelected ? ui_system_chip_vue.ChipDesign.ShadowAccent : ui_system_chip_vue.ChipDesign.ShadowNoAccent;
	    },
	    isSelected() {
	      return this.task.filledFields[remindersMeta.id];
	    }
	  },
	  methods: {
	    handleClick() {
	      if (this.isSelected) {
	        this.highlightField();
	        return;
	      }
	      this.setSheetShown(true);
	    },
	    highlightField() {
	      void tasks_v2_lib_fieldHighlighter.fieldHighlighter.setContainer(this.$root.$el).highlight(remindersMeta.id);
	    },
	    setSheetShown(isShown) {
	      this.$emit('update:isSheetShown', isShown);
	    }
	  },
	  template: `
		<Chip
			v-if="isSelected || task.rights.reminder"
			:design
			:icon="Outline.NOTIFICATION"
			:text="loc('TASKS_V2_REMINDERS_TITLE_CHIP')"
			:data-task-id="taskId"
			:data-task-chip-id="remindersMeta.id"
			@click="handleClick"
		/>
		<ReminderSheet
			v-if="isSheetShown"
			:sheetBindProps
			@close="setSheetShown(false)"
		/>
	`
	};

	exports.Reminders = Reminders;
	exports.RemindersSheet = RemindersSheet;
	exports.RemindersChip = RemindersChip;
	exports.remindersMeta = remindersMeta;

}((this.BX.Tasks.V2.Component.Fields = this.BX.Tasks.V2.Component.Fields || {}),BX,BX.Main,BX.Vue3.Directives,BX.Tasks.V2.Component.Elements,BX.Tasks.V2.Component.Elements,BX.UI.DatePicker,BX.Vue3.Components,BX.UI.System.Input.Vue,BX.UI.System.Menu,BX.UI.System.Typography.Vue,BX.Tasks.V2,BX.Tasks.V2.Const,BX.Tasks.V2.Component.Elements,BX.Tasks.V2.Lib,BX.Tasks.V2.Lib,BX.Tasks.V2.Lib,BX.Tasks.V2.Provider.Service,BX.UI.System.Skeleton.Vue,BX.UI.System.Chip.Vue,BX.UI.IconSet,BX,BX.Tasks.V2.Lib));
//# sourceMappingURL=reminders.bundle.js.map
