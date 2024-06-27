/* eslint-disable */
this.BX = this.BX || {};
this.BX.Bizproc = this.BX.Bizproc || {};
(function (exports,ui_vue3,main_core_events,main_date,ui_tooltip,bizproc_workflow_faces_summary,main_core) {
	'use strict';

	const Column = {
	  name: 'bp-workflow-faces-column',
	  props: {
	    title: String,
	    avatars: Array,
	    status: {
	      type: String,
	      validator: value => {
	        return ['accept', 'decline', 'progress'].includes(value);
	      }
	    },
	    hasMoreTasks: {
	      type: Boolean,
	      default: false
	    },
	    tasksCount: Number,
	    time: Number
	  },
	  computed: {
	    hasTitle() {
	      return main_core.Type.isStringFilled(this.title);
	    },
	    hasFaces() {
	      return main_core.Type.isArrayFilled(this.avatars);
	    },
	    hasStatus() {
	      return main_core.Type.isStringFilled(this.status);
	    },
	    hasTime() {
	      return main_core.Type.isNumber(this.time);
	    },
	    isProgressStatus() {
	      return this.status === 'progress';
	    },
	    isAcceptStatus() {
	      return this.status === 'accept';
	    },
	    isDeclineStatus() {
	      return this.status === 'decline';
	    },
	    duration() {
	      if (main_core.Type.isNil(this.time) || this.time === 0) {
	        return this.$Bitrix.Loc.getMessage('BIZPROC_JS_WORKFLOW_FACES_EMPTY_TIME');
	      }
	      return main_date.DateTimeFormat.format([['s', 'sdiff'], ['i', 'idiff'], ['H', 'Hdiff'], ['d', 'ddiff'], ['m', 'mdiff'], ['Y', 'Ydiff']], 0, this.time);
	    },
	    completedTasksCountMessage() {
	      return this.$Bitrix.Loc.getMessage('BIZPROC_JS_WORKFLOW_COMPLETED_TASK_COUNT', {
	        '#COUNT#': this.tasksCount
	      });
	    }
	  },
	  methods: {
	    getSafeUrl(url) {
	      return `url('${encodeURI(main_core.Text.encode(url))}')`;
	    }
	  },
	  template: `
		<div
			:class="{
				'bp-workflow-faces__steps-item': true,
				'--in-progress': hasFaces,
				'--loading': !hasFaces && hasStatus,
			}">
			<div
				v-if="hasMoreTasks"
				:title="completedTasksCountMessage"
				class="bp-workflow-faces__icon-progress-box"
			>
				<div class="ui-icon-set --more bp-workflow-faces__icon-progress"></div>
				<div class="bp-workflow-faces__icon-progress-overlay"></div>
			</div>
			<div class="bp-workflow-faces__steps-name">
				<div v-if="hasTitle" class="bp-workflow-faces__text-area">
					{{ title }}
				</div>
				<div v-else class="bp-workflow-faces__fake-area">
					<div class="bp-workflow-faces__fake-area-stub"></div>
				</div>
			</div>
			<div class="bp-workflow-faces__steps-users">
				<div v-if="!hasFaces && !hasStatus" class="ui-icon-set --person bp-workflow-faces__steps-user"></div>
				<template v-else-if="hasFaces">
					<template v-if="hasStatus">
						<div v-if="isProgressStatus" class="bp-workflow-faces__icon-waiting-box">
							<div class="ui-icon-set --black-clock bp-workflow-faces__icon-waiting"></div>
							<div class="bp-workflow-faces__icon-overlay"></div>
						</div>
						<div v-if="isAcceptStatus" class="bp-workflow-faces__icon-done-box">
							<div class="ui-icon-set --circle-check bp-workflow-faces__icon-done"></div>
							<div class="bp-workflow-faces__icon-overlay"></div>
						</div>
						<div v-if="isDeclineStatus" class="bp-workflow-faces__icon-decline-box">
							<div class="ui-icon-set --cross-circle-60 bp-workflow-faces__icon-decline"></div>
							<div class="bp-workflow-faces__icon-overlay"></div>
						</div>
					</template>
					<template v-for="avatar in avatars" :key="avatar.id">
						<div 
							v-if="avatar.avatarUrl"
							class="bp-workflow-faces__steps-user-item"
							:style="{ backgroundImage: getSafeUrl(avatar.avatarUrl)}"
							:bx-tooltip-user-id="avatar.id"
						></div>
						<div
							v-else-if="avatar.id > 0"
							class="bp-workflow-faces__steps-user-item"
							:bx-tooltip-user-id="avatar.id"
						></div>
						<div v-else class="bp-workflow-faces__steps-user-item --tech"></div>
					</template>
				</template>
				<template v-else>
					<div v-if="isProgressStatus" class="bp-workflow-faces__icon-waiting-box --center">
						<div class="ui-icon-set --black-clock bp-workflow-faces__icon-waiting"></div>
						<div class="bp-workflow-faces__icon-overlay"></div>
					</div>
					<div v-if="isAcceptStatus" class="bp-workflow-faces__icon-done-box --center">
						<div class="ui-icon-set --circle-check bp-workflow-faces__icon-done"></div>
						<div class="bp-workflow-faces__icon-overlay"></div>
					</div>
				</template>
			</div>
			<div class="bp-workflow-faces__steps-duration">
				<div v-if="hasTime" class="bp-workflow-faces__text-area">
					{{ duration }}
				</div>
				<div v-else class="bp-workflow-faces__fake-area">
					<div class="bp-workflow-faces__fake-area-stub"></div>
				</div>
			</div>
		</div>
	`
	};

	const ColumnAuthor = {
	  name: 'bp-workflow-faces-column-author',
	  components: {
	    Column
	  },
	  props: {
	    avatars: Array,
	    time: Number,
	    hasMoreTasks: {
	      type: Boolean,
	      default: false
	    },
	    tasksCount: Number
	  },
	  computed: {
	    hasAvatars() {
	      return main_core.Type.isArrayFilled(this.avatars);
	    }
	  },
	  methods: {
	    loc(phraseCode) {
	      return this.$Bitrix.Loc.getMessage(phraseCode);
	    }
	  },
	  template: `
		<Column
			:title="loc('BIZPROC_JS_WORKFLOW_FACES_COLUMN_AUTHOR')"
			:avatars="hasAvatars ? avatars : null"
			:has-more-tasks="hasMoreTasks"
			:tasks-count="tasksCount"
			:time="time"
		/>
	`
	};

	const ColumnDone = {
	  name: 'bp-workflow-faces-column-done',
	  components: {
	    Column
	  },
	  props: {
	    avatars: Array,
	    time: Number,
	    successStatus: Boolean
	  },
	  computed: {
	    hasAvatars() {
	      return main_core.Type.isArrayFilled(this.avatars);
	    },
	    status() {
	      return this.hasAvatars ? this.successStatus ? 'accept' : 'decline' : 'accept';
	    }
	  },
	  methods: {
	    loc(phraseCode) {
	      return this.$Bitrix.Loc.getMessage(phraseCode);
	    }
	  },
	  template: `
		<Column
			:title="loc('BIZPROC_JS_WORKFLOW_FACES_COLUMN_DONE')"
			:avatars="hasAvatars ? avatars : null"
			:status="status"
			:time="time"
		/>
	`
	};

	const TIMER_UP_BOUNDARY = 60 * 60; // 1 hour

	const ColumnRunning = {
	  name: 'bp-workflow-faces-column-running',
	  components: {
	    Column
	  },
	  props: {
	    avatars: Array,
	    time: Number
	  },
	  data() {
	    return {
	      timer: null,
	      computedTime: 0,
	      startTime: Math.floor(Date.now() / 1000)
	    };
	  },
	  computed: {
	    hasAvatars() {
	      return main_core.Type.isArrayFilled(this.avatars);
	    }
	  },
	  mounted() {
	    this.startTimer();
	  },
	  unmounted() {
	    this.stopTimer();
	  },
	  methods: {
	    loc(phraseCode) {
	      return this.$Bitrix.Loc.getMessage(phraseCode);
	    },
	    startTimer() {
	      this.timer = setInterval(() => {
	        if (this.time + this.computedTime < TIMER_UP_BOUNDARY) {
	          this.computedTime = Math.floor(Date.now() / 1000) - this.startTime;
	          return;
	        }
	        this.stopTimer();
	      }, 1000);
	    },
	    stopTimer() {
	      if (this.timer) {
	        clearInterval(this.timer);
	        this.timer = null;
	      }
	    }
	  },
	  template: `
		<Column
			:title="loc('BIZPROC_JS_WORKFLOW_FACES_COLUMN_RUNNING')"
			:avatars="hasAvatars ? avatars : null"
			:status="'progress'"
			:time="time + computedTime"
		/>
	`
	};

	const ColumnCompleted = {
	  name: 'bp-workflow-faces-column-completed',
	  components: {
	    Column
	  },
	  props: {
	    avatars: Array,
	    time: Number,
	    successStatus: Boolean
	  },
	  computed: {
	    hasAvatars() {
	      return main_core.Type.isArrayFilled(this.avatars);
	    },
	    status() {
	      return this.successStatus ? 'accept' : 'decline';
	    }
	  },
	  methods: {
	    loc(phraseCode) {
	      return this.$Bitrix.Loc.getMessage(phraseCode);
	    }
	  },
	  template: `
		<Column
			:title="loc('BIZPROC_JS_WORKFLOW_FACES_COLUMN_COMPLETED')"
			:avatars="hasAvatars ? avatars : null"
			:status="status"
			:time="time"
		/>
	`
	};

	const Summary = {
	  name: 'bp-workflow-faces-column-timeline',
	  props: {
	    workflowId: {
	      type: String,
	      required: true
	    },
	    isFinalState: {
	      type: Boolean,
	      default: false
	    },
	    time: Number,
	    showArrow: {
	      type: Boolean,
	      default: true
	    },
	    showContent: {
	      type: Boolean,
	      default: true
	    }
	  },
	  mounted() {
	    this.renderSummary();
	  },
	  updated() {
	    this.renderSummary();
	  },
	  unmounted() {
	    if (this.$refs.content) {
	      main_core.Dom.clean(this.$refs.content);
	    }
	  },
	  methods: {
	    renderSummary() {
	      if (this.$refs.content) {
	        main_core.Dom.clean(this.$refs.content);
	        main_core.Dom.append(new bizproc_workflow_faces_summary.Summary({
	          workflowId: this.workflowId,
	          time: this.time,
	          workflowIsCompleted: this.isFinalState,
	          showArrow: this.showArrow,
	          showContent: this.showContent
	        }).render(), this.$refs.content);
	      }
	    }
	  },
	  template: `
		<div class="bp-workflow-faces__steps-summary-item" ref="content"></div>
	`
	};

	const timeValidator = time => {
	  return main_core.Type.isNull(time) || time === 0 || main_core.Text.toInteger(time) > 0;
	};
	const Application = {
	  name: 'bp-workflow-faces-application',
	  components: {
	    Column,
	    ColumnAuthor,
	    ColumnDone,
	    ColumnRunning,
	    ColumnCompleted,
	    Summary
	  },
	  props: {
	    avatars: {
	      type: Object,
	      required: true,
	      validator: value => {
	        return main_core.Type.isArrayFilled(value.author) && main_core.Type.isArray(value.running) && main_core.Type.isArray(value.completed) && main_core.Type.isArray(value.done);
	      }
	    },
	    statuses: {
	      type: Object,
	      validator: value => {
	        return main_core.Type.isBoolean(value.completedSuccess) && main_core.Type.isBoolean(value.doneSuccess);
	      }
	    },
	    time: {
	      type: Object,
	      validator: value => {
	        return timeValidator(value.author) && timeValidator(value.running) && timeValidator(value.completed) && timeValidator(value.done) && timeValidator(value.total);
	      }
	    },
	    initialCompletedTaskCount: {
	      type: Number,
	      default: 0
	    },
	    workflowIsCompleted: {
	      type: Boolean,
	      default: false
	    },
	    workflowId: {
	      type: String,
	      required: true
	    },
	    userId: {
	      type: Number,
	      required: true,
	      validator: value => {
	        return main_core.Type.isInteger(value) && value > 0;
	      }
	    },
	    taskId: {
	      type: Number,
	      default: 0
	    },
	    summaryProps: {
	      type: Object,
	      default: {
	        showArrow: true,
	        showContent: true
	      }
	    }
	  },
	  data() {
	    return {
	      author: {
	        avatars: this.avatars.author,
	        time: this.time.author
	      },
	      running: {
	        avatars: this.avatars.running,
	        time: this.time.running
	      },
	      completed: {
	        avatars: this.avatars.completed,
	        successStatus: this.statuses.completedSuccess,
	        time: this.time.completed
	      },
	      done: {
	        avatars: this.avatars.done,
	        successStatus: this.statuses.doneSuccess,
	        time: this.time.done
	      },
	      runningTaskId: this.taskId,
	      isFinalState: this.workflowIsCompleted,
	      completedTaskCount: this.initialCompletedTaskCount,
	      handleUpdateData: event => {
	        this.updateData(event.getData());
	      },
	      unsubscribePushCallback: null,
	      summary: {
	        workflowId: this.workflowId,
	        time: this.time.total,
	        isFinalState: this.workflowIsCompleted,
	        showArrow: main_core.Type.isBoolean(this.summaryProps.showArrow) ? this.summaryProps.showArrow : true,
	        showContent: main_core.Type.isBoolean(this.summaryProps.showContent) ? this.summaryProps.showContent : true
	      },
	      errorMessage: null
	    };
	  },
	  computed: {
	    showCompletedColumn() {
	      return main_core.Type.isArrayFilled(this.completed.avatars);
	    },
	    hasMoreTaskIcon() {
	      return this.hiddenTasksCount > 0;
	    },
	    hiddenTasksCount() {
	      if (this.isFinalState) {
	        return this.completedTaskCount > 2 ? this.completedTaskCount - 2 : 0;
	      }
	      return this.completedTaskCount > 1 ? this.completedTaskCount - 1 : 0;
	    },
	    hasErrors() {
	      return main_core.Type.isStringFilled(this.errorMessage);
	    }
	  },
	  mounted() {
	    this.subscribeOnEvents();
	  },
	  unmounted() {
	    this.unsubscribeOnEvents();
	  },
	  methods: {
	    subscribeOnEvents() {
	      if (!this.isFinalState) {
	        if (BX.PULL) {
	          this.unsubscribePushCallback = BX.PULL.subscribe({
	            moduleId: 'bizproc',
	            command: 'workflow',
	            callback: this.onPush.bind(this)
	          });
	        }
	        if (this.$root.$app) {
	          main_core_events.EventEmitter.subscribe(this.$root.$app, 'Bizproc.WorkflowFaces.OnUpdateData', this.handleUpdateData);
	        }
	      }
	    },
	    unsubscribeOnEvents() {
	      if (main_core.Type.isFunction(this.unsubscribePushCallback)) {
	        this.unsubscribePushCallback();
	        this.unsubscribePushCallback = null;
	      }
	      if (this.$root.$app) {
	        main_core_events.EventEmitter.unsubscribe(this.$root.$app, 'Bizproc.WorkflowFaces.OnUpdateData', this.handleUpdateData);
	      }
	    },
	    onPush(params) {
	      if (params && params.eventName === 'UPDATED' && main_core.Type.isArrayFilled(params.items)) {
	        for (const item of params.items) {
	          if (String(item.id) === this.workflowId) {
	            this.load();
	            return;
	          }
	        }
	      }
	    },
	    load() {
	      if (this.$refs.container) {
	        main_core.ajax.runAction('bizproc.workflow.faces.load', {
	          data: {
	            workflowId: this.workflowId,
	            runningTaskId: this.runningTaskId,
	            userId: this.userId
	          }
	        }).then(({
	          data
	        }) => {
	          this.updateData(data);
	        }).catch(({
	          errors
	        }) => {
	          if (main_core.Type.isArrayFilled(errors)) {
	            const firstError = errors.pop();
	            if (firstError.code === 'ACCESS_DENIED') {
	              this.errorMessage = firstError.message;
	            }
	          }
	        });
	      }
	    },
	    updateData(data) {
	      if (!main_core.Type.isPlainObject(data)) {
	        return;
	      }
	      const {
	        avatars,
	        time,
	        statuses,
	        completedTaskCount,
	        workflowIsCompleted,
	        runningTaskId
	      } = data;
	      if (!main_core.Type.isPlainObject(avatars) && !main_core.Type.isPlainObject(time) && !main_core.Type.isPlainObject(statuses)) {
	        return;
	      }
	      this.running = {
	        avatars: main_core.Type.isArray(avatars.running) ? avatars.running : null,
	        time: timeValidator(time.running) ? time.running : null
	      };
	      this.completed = {
	        avatars: main_core.Type.isArray(avatars.completed) ? avatars.completed : null,
	        successStatus: main_core.Text.toBoolean(statuses.completedSuccess),
	        time: timeValidator(time.completed) ? time.completed : null
	      };
	      this.done = {
	        avatars: main_core.Type.isArray(avatars.done) ? avatars.done : null,
	        successStatus: main_core.Text.toBoolean(statuses.doneSuccess),
	        time: timeValidator(time.done) ? time.done : null
	      };
	      this.updateSummary(data);
	      this.runningTaskId = main_core.Text.toInteger(runningTaskId);
	      this.completedTaskCount = main_core.Text.toInteger(completedTaskCount);
	      this.isFinalState = main_core.Text.toBoolean(workflowIsCompleted);
	      if (this.isFinalState) {
	        this.unsubscribeOnEvents();
	      }
	    },
	    updateSummary(data) {
	      const {
	        time,
	        workflowIsCompleted
	      } = data;
	      this.summary.time = timeValidator(time.total) ? time.total : null;
	      this.summary.isFinalState = main_core.Text.toBoolean(workflowIsCompleted);
	    }
	  },
	  template: `
		<div ref="container">
			<div class="bp-workflow-faces">
				<div v-if="hasErrors" class="bp-workflow-faces__steps">
					<span class="bp-workflow-faces__steps-error">{{ errorMessage }}</span>
				</div>
				<div v-else class="bp-workflow-faces__steps">
					<ColumnAuthor
						:avatars="author.avatars"
						:has-more-tasks="hasMoreTaskIcon"
						:tasks-count="hiddenTasksCount"
						:time="author.time"
					/>
					<ColumnCompleted
						v-if="showCompletedColumn"
						:avatars="completed.avatars"
						:time="completed.time"
						:success-status="completed.successStatus"
					/>
					<ColumnDone
						v-else-if="isFinalState"
						:avatars="done.avatars"
						:time="done.time"
						:success-status="done.successStatus"
					/>
					<ColumnRunning
						v-else
						:avatars="running.avatars"
						:time="running.time"
					/>
					<Column v-if="!showCompletedColumn"/>
					<ColumnDone
						v-else-if="isFinalState"
						:avatars="done.avatars"
						:time="done.time"
						:success-status="done.successStatus"
					/>
					<ColumnRunning
						v-else
						:avatars="running.avatars"
						:time="running.time"
					/>
					<Summary v-bind="summary"/>
				</div>
			</div>
		</div>
	`
	};

	var _target = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("target");
	var _data = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("data");
	var _workflowId = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("workflowId");
	var _targetUserId = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("targetUserId");
	var _application = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("application");
	var _initApplication = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("initApplication");
	class WorkflowFaces {
	  /**
	   * @param props
	   * @param {HTMLElement} props.target
	   * @param {?FacesData} props.data
	   * @param {string} props.workflowId
	   * @param {number} props.targetUserId
	   */
	  constructor(props = {}) {
	    Object.defineProperty(this, _initApplication, {
	      value: _initApplication2
	    });
	    Object.defineProperty(this, _target, {
	      writable: true,
	      value: void 0
	    });
	    Object.defineProperty(this, _data, {
	      writable: true,
	      value: {}
	    });
	    Object.defineProperty(this, _workflowId, {
	      writable: true,
	      value: void 0
	    });
	    Object.defineProperty(this, _targetUserId, {
	      writable: true,
	      value: void 0
	    });
	    Object.defineProperty(this, _application, {
	      writable: true,
	      value: void 0
	    });
	    if (!main_core.Type.isStringFilled(props.workflowId)) {
	      throw new TypeError('workflowId must be filled string');
	    }
	    babelHelpers.classPrivateFieldLooseBase(this, _workflowId)[_workflowId] = props.workflowId;
	    if (!main_core.Type.isDomNode(props.target)) {
	      throw new TypeError('target must be dom node');
	    }
	    babelHelpers.classPrivateFieldLooseBase(this, _target)[_target] = props.target;
	    if (!main_core.Type.isInteger(props.targetUserId) || props.targetUserId <= 0) {
	      throw new TypeError('targetUserId must be positive integer');
	    }
	    babelHelpers.classPrivateFieldLooseBase(this, _targetUserId)[_targetUserId] = props.targetUserId;
	    if (main_core.Type.isPlainObject(props.data)) {
	      babelHelpers.classPrivateFieldLooseBase(this, _data)[_data] = props.data;
	    }
	    babelHelpers.classPrivateFieldLooseBase(this, _initApplication)[_initApplication]();
	  }
	  render() {
	    babelHelpers.classPrivateFieldLooseBase(this, _application)[_application].mount(babelHelpers.classPrivateFieldLooseBase(this, _target)[_target]);
	  }
	  updateData(data) {
	    main_core_events.EventEmitter.emit(this, 'Bizproc.WorkflowFaces.OnUpdateData', new main_core_events.BaseEvent({
	      data
	    }));
	  }
	  destroy() {
	    babelHelpers.classPrivateFieldLooseBase(this, _application)[_application].unmount();
	    babelHelpers.classPrivateFieldLooseBase(this, _application)[_application] = null;
	    babelHelpers.classPrivateFieldLooseBase(this, _target)[_target] = null;
	    babelHelpers.classPrivateFieldLooseBase(this, _data)[_data] = null;
	    babelHelpers.classPrivateFieldLooseBase(this, _workflowId)[_workflowId] = null;
	  }
	}
	function _initApplication2() {
	  // eslint-disable-next-line unicorn/no-this-assignment
	  const context = this;
	  babelHelpers.classPrivateFieldLooseBase(this, _application)[_application] = ui_vue3.BitrixVue.createApp({
	    name: 'bp-workflow-faces',
	    components: {
	      Application
	    },
	    props: {
	      workflowId: String,
	      userId: Number,
	      avatars: Object,
	      statuses: Object,
	      time: Object,
	      completedTaskCount: Number,
	      workflowIsCompleted: Boolean,
	      runningTaskId: Number,
	      summaryProps: Object
	    },
	    created() {
	      this.$app = context;
	    },
	    template: `
					<Application
						:workflowId="workflowId"
						:userId="userId"
						:avatars="avatars"
						:statuses="statuses"
						:time="time"
						:workflow-is-completed="workflowIsCompleted"
						:initial-completed-task-count="completedTaskCount"
						:task-id="runningTaskId"
						:summary-props="summaryProps"
					></Application>
				`
	  }, {
	    workflowId: babelHelpers.classPrivateFieldLooseBase(this, _workflowId)[_workflowId],
	    userId: babelHelpers.classPrivateFieldLooseBase(this, _targetUserId)[_targetUserId],
	    avatars: babelHelpers.classPrivateFieldLooseBase(this, _data)[_data].avatars,
	    statuses: babelHelpers.classPrivateFieldLooseBase(this, _data)[_data].statuses,
	    time: babelHelpers.classPrivateFieldLooseBase(this, _data)[_data].time,
	    completedTaskCount: babelHelpers.classPrivateFieldLooseBase(this, _data)[_data].completedTaskCount,
	    workflowIsCompleted: babelHelpers.classPrivateFieldLooseBase(this, _data)[_data].workflowIsCompleted,
	    runningTaskId: babelHelpers.classPrivateFieldLooseBase(this, _data)[_data].runningTaskId,
	    summaryProps: babelHelpers.classPrivateFieldLooseBase(this, _data)[_data].summaryProps
	  });
	}

	exports.WorkflowFaces = WorkflowFaces;

}((this.BX.Bizproc.Workflow = this.BX.Bizproc.Workflow || {}),BX.Vue3,BX.Event,BX.Main,BX.UI,BX.Bizproc.Workflow.Faces,BX));
//# sourceMappingURL=faces.bundle.js.map
