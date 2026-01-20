/* eslint-disable */
this.BX = this.BX || {};
this.BX.Tasks = this.BX.Tasks || {};
this.BX.Tasks.V2 = this.BX.Tasks.V2 || {};
this.BX.Tasks.V2.Component = this.BX.Tasks.V2.Component || {};
(function (exports,ui_vue3_directives_hint,tasks_v2_component_elements_hoverPill,tasks_v2_component_elements_hint,main_core,tasks_v2_const,tasks_v2_lib_calendar,ui_system_chip_vue,ui_iconSet_api_vue,ui_iconSet_outline,tasks_v2_lib_fieldHighlighter) {
	'use strict';

	const emailMeta = Object.freeze({
	  id: tasks_v2_const.TaskField.Email,
	  title: main_core.Loc.getMessage('TASKS_V2_EMAIL_TITLE'),
	  fromTitle: main_core.Loc.getMessage('TASKS_V2_EMAIL_FROM_TITLE'),
	  dateTitle: main_core.Loc.getMessage('TASKS_V2_EMAIL_DATE_TITLE')
	});

	// @vue/component
	const Email = {
	  name: 'TaskEmail',
	  directives: {
	    hint: ui_vue3_directives_hint.hint
	  },
	  components: {
	    BIcon: ui_iconSet_api_vue.BIcon,
	    HoverPill: tasks_v2_component_elements_hoverPill.HoverPill
	  },
	  inject: {
	    task: {},
	    taskId: {}
	  },
	  setup() {
	    return {
	      emailMeta,
	      Outline: ui_iconSet_api_vue.Outline
	    };
	  },
	  computed: {
	    email() {
	      return this.task.email;
	    },
	    emailTitle() {
	      return main_core.Type.isStringFilled(this.email.title) && this.email.title.trim() ? this.email.title : this.loc('TASKS_V2_EMAIL_NO_SUBJECT');
	    },
	    emailBody() {
	      return main_core.Type.isStringFilled(this.email.body) ? this.email.body : null;
	    },
	    tooltip() {
	      return () => tasks_v2_component_elements_hint.tooltip({
	        text: this.loc('TASKS_V2_EMAIL_TITLE_HINT'),
	        popupOptions: {
	          offsetLeft: this.$refs.email.$el.offsetWidth / 2
	        }
	      });
	    }
	  },
	  methods: {
	    handleClick() {
	      BX.SidePanel.Instance.emulateAnchorClick(this.email.link);
	    }
	  },
	  template: `
		<div
			class="tasks-field-email"
			:data-task-id="taskId"
			:data-task-field-id="emailMeta.id"
			:data-task-field-value="email.id"
		>
			<HoverPill v-hint="tooltip" ref="email" @click="handleClick">
				<div class="tasks-field-email-content">
					<BIcon :name="Outline.MAIL"/>
					<div class="tasks-field-email-title">{{ emailTitle }}</div>
				</div>
			</HoverPill>
			<div v-if="emailBody" class="tasks-field-email-subcontent">
				<div class="tasks-field-email-subtitle">{{ emailBody }}</div>
			</div>
		</div>
	`
	};

	// @vue/component
	const EmailFrom = {
	  name: 'TaskEmailFrom',
	  components: {
	    BIcon: ui_iconSet_api_vue.BIcon
	  },
	  inject: {
	    task: {},
	    taskId: {}
	  },
	  setup() {
	    return {
	      emailMeta,
	      Outline: ui_iconSet_api_vue.Outline
	    };
	  },
	  computed: {
	    email() {
	      return this.task.email;
	    }
	  },
	  template: `
		<div
			v-if="email.from"
			:data-task-id="taskId"
			:data-task-field-id="emailMeta.id + '_from'"
			:data-task-field-value="email.id"
		>
			<div class="tasks-field-email-content">
				<BIcon :name="Outline.PERSON"/>
				<div class="tasks-field-email-title">{{ email.from }}</div>
			</div>
		</div>
	`
	};

	// @vue/component
	const EmailDate = {
	  name: 'TaskEmailDate',
	  components: {
	    BIcon: ui_iconSet_api_vue.BIcon
	  },
	  inject: {
	    task: {},
	    taskId: {}
	  },
	  setup() {
	    return {
	      emailMeta,
	      Outline: ui_iconSet_api_vue.Outline
	    };
	  },
	  computed: {
	    email() {
	      return this.task.email;
	    },
	    emailDate() {
	      return tasks_v2_lib_calendar.calendar.formatDate(this.email.dateTs);
	    }
	  },
	  template: `
		<div
			v-if="emailDate"
			:data-task-id="taskId"
			:data-task-field-id="emailMeta.id + '_date'"
			:data-task-field-value="email.id"
		>
			<div class="tasks-field-email-content">
				<BIcon :name="Outline.CALENDAR"/>
				<div class="tasks-field-email-title">{{ emailDate }}</div>
			</div>
		</div>
	`
	};

	// @vue/component
	const EmailChip = {
	  components: {
	    Chip: ui_system_chip_vue.Chip
	  },
	  inject: {
	    taskId: {}
	  },
	  setup() {
	    return {
	      Outline: ui_iconSet_api_vue.Outline,
	      ChipDesign: ui_system_chip_vue.ChipDesign,
	      emailMeta
	    };
	  },
	  methods: {
	    highlightField() {
	      void tasks_v2_lib_fieldHighlighter.fieldHighlighter.setContainer(this.$root.$el).highlight(emailMeta.id);
	    }
	  },
	  template: `
		<Chip
			:design="ChipDesign.ShadowAccent"
			:icon="Outline.MAIL"
			:text="emailMeta.title"
			:data-task-id="taskId"
			:data-task-chip-id="emailMeta.id"
			@click="highlightField"
		/>
	`
	};

	exports.Email = Email;
	exports.EmailFrom = EmailFrom;
	exports.EmailDate = EmailDate;
	exports.EmailChip = EmailChip;
	exports.emailMeta = emailMeta;

}((this.BX.Tasks.V2.Component.Fields = this.BX.Tasks.V2.Component.Fields || {}),BX.Vue3.Directives,BX.Tasks.V2.Component.Elements,BX.Tasks.V2.Component.Elements,BX,BX.Tasks.V2.Const,BX.Tasks.V2.Lib,BX.UI.System.Chip.Vue,BX.UI.IconSet,BX,BX.Tasks.V2.Lib));
//# sourceMappingURL=email.bundle.js.map
