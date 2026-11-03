/* eslint-disable */
this.BX = this.BX || {};
(function (exports, main_core_events, main_core, ui_analytics) {
	'use strict';

	class Result {
		constructor(taskId) {
			this.taskId = taskId;
		}
		setClosed(value) {
			this.isClosed = value;
		}
		setComments(comments) {
			this.comments = comments;
		}
		setContext(context) {
			this.context = context;
		}
		isResult(commentId) {
			if (this.comments && this.comments[commentId]) {
				return true;
			}
			return false;
		}
		pushComment(result) {
			this.comments[result.commentId] = result;
		}
		deleteComment(commentId) {
			this.comments[commentId] && delete this.comments[commentId];
		}
		canSetAsResult(commentId) {
			if (this.comments[commentId]) {
				return false;
			}
			return true;
		}
		canUnsetAsResult(commentId) {
			if (!this.comments[commentId]) {
				return false;
			}
			return true;
		}
	}

	class ResultManager {
		static resultRegistry = {};
		static instance = null;
		static getInstance() {
			if (!ResultManager.instance) {
				ResultManager.instance = new ResultManager();
			}
			return ResultManager.instance;
		}
		static showField() {
			const node = document.getElementById('IS_TASK_RESULT');
			if (!node || !node.closest('label')) {
				return;
			}
			node.closest('label').classList.remove('--hidden');
		}
		static hideField() {
			const node = document.getElementById('IS_TASK_RESULT');
			if (!node || !node.closest('label')) {
				return;
			}
			node.closest('label').classList.add('--hidden');
		}
		constructor() {
			this.init();
		}
		init() {
			const compatMode = {
				compatMode: true
			};
			main_core_events.EventEmitter.subscribe('OnUCFormBeforeShow', event => {
				this.onEditComment(event);
			}, compatMode);
			main_core_events.EventEmitter.subscribe('onPullEvent-tasks', (command, params) => {
				this.onPushResult(command, params);
			}, compatMode);
			main_core_events.EventEmitter.subscribe('onPull-tasks', event => {
				this.onPushResult(event.command, event.params);
			}, compatMode);
		}
		initResult(params) {
			const result = this.getResult(params.taskId);
			result.setComments(params.comments);
			if (params.context) {
				result.setContext(params.context);
			}
			if (params.isClosed) {
				result.setClosed(true);
			}
			return result;
		}
		getResult(taskId) {
			if (!ResultManager.resultRegistry[taskId]) {
				ResultManager.resultRegistry[taskId] = new Result(taskId);
			}
			return ResultManager.resultRegistry[taskId];
		}
		onEditComment(event) {
			if (!event || !event['id'] || event['id'][0].indexOf('TASK_') !== 0) {
				return;
			}
			const node = document.getElementById('IS_TASK_RESULT');
			if (!node) {
				return;
			}
			const taskId = +/\d+/.exec(event['id'][0]);
			const result = this.getResult(taskId);
			node.checked = result.isResult(event['id'][1]);
		}
		onPushResult(command, params) {
			if (command === 'task_update') {
				const taskId = parseInt(params.TASK_ID);
				const result = this.getResult(taskId);
				if (params.AFTER.STATUS && (params.AFTER.STATUS == 4 || params.AFTER.STATUS == 5)) {
					result.setClosed(true);
				} else if (params.AFTER.STATUS) {
					result.setClosed(false);
				}
				return;
			}
			if (command !== 'task_result_create' && command !== 'task_result_delete') {
				return;
			}
			if (!params.result || !params.result.taskId || !params.result.commentId) {
				return;
			}
			const taskId = params.result.taskId;
			const result = this.getResult(taskId);
			if (command === 'task_result_create') {
				result.pushComment(params.result);
			} else if (command === 'task_result_delete') {
				result.deleteComment(params.result.commentId);
			}
		}
	}

	class ResultAction {
		static instance = null;
		static getInstance() {
			if (!ResultAction.instance) {
				ResultAction.instance = new ResultAction();
			}
			return ResultAction.instance;
		}
		canCreateResult(taskId) {
			return true;
		}
		deleteFromComment(commentId) {
			main_core.ajax.runComponentAction('bitrix:tasks.widget.result', 'deleteFromComment', {
				mode: 'class',
				data: {
					commentId
				}
			}).catch(console.error);
		}
		createFromComment(commentId, shouldSendAnalytics = false) {
			const analyticsLabel = {
				tool: 'tasks',
				category: 'task_operations',
				event: 'status_summary_add',
				type: 'task',
				c_section: 'task',
				c_sub_section: 'task_card',
				c_element: 'comment_context_menu'
			};
			main_core.ajax.runComponentAction('bitrix:tasks.widget.result', 'createFromComment', {
				mode: 'class',
				data: {
					commentId
				}
			}).then(() => {
				if (shouldSendAnalytics) {
					ui_analytics.sendData({
						...analyticsLabel,
						status: 'success'
					});
				}
			}).catch(() => {
				if (shouldSendAnalytics) {
					ui_analytics.sendData({
						...analyticsLabel,
						status: 'error'
					});
				}
			});
		}
	}

	exports.ResultAction = ResultAction;
	exports.ResultManager = ResultManager;

})(this.BX.Tasks = this.BX.Tasks || {}, BX.Event, BX, BX.UI.Analytics);
//# sourceMappingURL=result.bundle.js.map
