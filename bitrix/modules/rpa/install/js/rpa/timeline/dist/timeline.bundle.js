/* eslint-disable */
this.BX = this.BX || {};
(function (exports, main_core, main_core_events, ui_timeline, rpa_manager, main_popup) {
	'use strict';

	/**
	 * @memberOf BX.Rpa.Timeline
	 * @mixes EventEmitter
	 */
	class Task extends ui_timeline.Timeline.Item {
		statusWait = 0;
		statusYes = 1;
		statusNo = 2;
		statusOk = 3;
		statusCancel = 4;
		constructor(props) {
			super(props);
			this.setEventNamespace('BX.Rpa.Timeline.Task');
		}
		getId() {
			return 'task-' + this.id;
		}
		getTaskUsers() {
			return this.data.users;
		}
		render() {
			this.layout.container = this.renderContainer();
			this.layout.container.appendChild(this.renderIcon());
			this.layout.container.appendChild(this.renderContent());
			return this.layout.container;
		}
		renderContainer() {
			return main_core.Tag.render`<div class="ui-item-detail-stream-section ui-item-detail-stream-section-task ${this.isLast ? 'ui-item-detail-stream-section-last' : ''}"></div>`;
		}
		renderHeader() {
			return main_core.Tag.render`
			<div class="ui-item-detail-stream-content-header">
				<div class="ui-item-detail-stream-content-title">
					<span class="ui-item-detail-stream-content-title-text">${main_core.Loc.getMessage('RPA_TIMELINE_TASKS_TITLE')}</span>
				</div>
			</div>`;
		}
		renderMain() {
			return main_core.Tag.render`
			<div class="ui-item-detail-stream-content-detail">
				<div class="ui-item-detail-stream-content-detail-subject">
					${this.renderParticipants()}
					<div class="ui-item-detail-stream-content-detail-subject-inner">
						<a class="ui-item-detail-stream-content-detail-subject-text" href="${main_core.Text.encode(this.data.url)}">${main_core.Text.encode(this.getTitle())}</a>
						${this.renderParticipantsLine()}
					</div>
				</div>
				<div class="ui-item-detail-stream-content-detail-main">
					<span class="ui-item-detail-stream-content-detail-main-text">${main_core.Text.encode(this.description)}</span>
				</div>
				${this.renderTaskFields()}
				${this.renderTaskButtons()}
			</div>`;
		}
		renderParticipants() {
			let photos = this.getTaskUsers().map(({
				id,
				status
			}) => {
				return this.renderParticipantPhoto(id);
			});
			if (photos.length > 4) {
				let counter = photos.length - 4;
				photos = photos.slice(0, 4);
				photos.push(main_core.Tag.render`<span class="ui-item-detail-stream-content-other">
						<span class="ui-item-detail-stream-content-other-text">+${counter}</span>
					</span>`);
			}
			return main_core.Tag.render`<div class="ui-item-detail-stream-content-employee-wrap" onclick="${this.showParticipants.bind(this)}">
				${photos}
			</div>
		`;
		}
		renderParticipantsLine() {
			let elements = [];
			let taskUsers = this.getTaskUsers();
			taskUsers.forEach(({
				id,
				status
			}, i) => {
				let node = main_core.Tag.render`<span class="ui-item-detail-stream-content-detail-subject-resp">${main_core.Text.encode(this.getTaskUserName(id))}</span>`;
				if (status > this.statusWait) {
					node.classList.add('ui-item-detail-stream-content-detail-subject-resp-past');
				} else if (id === this.getUserId()) {
					node.classList.add('ui-item-detail-stream-content-detail-subject-resp-current');
				}
				elements.push(node);
				if (this.data.participantJoint !== 'queue' && taskUsers.length - 1 !== i) {
					let msg = this.data.participantJoint === 'and' ? 'RPA_TIMELINE_TASKS_SEPARATOR_AND' : 'RPA_TIMELINE_TASKS_SEPARATOR_OR';
					elements.push(main_core.Tag.render`<span class="ui-item-detail-stream-content-detail-subject-separator">${main_core.Loc.getMessage(msg)}</span>`);
				}
			});
			let queueCls = this.data.participantJoint === 'queue' ? 'ui-item-detail-stream-content-detail-subject-resp-wrap-queue' : '';
			return main_core.Tag.render`
			<div class="ui-item-detail-stream-content-detail-subject-resp-wrap ${queueCls}">
				${elements}
			</div>
		`;
		}
		showParticipants(event) {
			let taskUsers = this.getTaskUsers();
			let users = taskUsers.map(({
				id,
				status
			}, i) => {
				let user = this.users.get(id);
				let sep = taskUsers.length - 1 !== i ? main_core.Tag.render`<span class="ui-item-detail-popup-item-separator">
					${main_core.Loc.getMessage(this.data.participantJoint === 'and' ? 'RPA_TIMELINE_TASKS_SEPARATOR_AND' : 'RPA_TIMELINE_TASKS_SEPARATOR_OR')}
					</span>` : '';
				let node = main_core.Tag.render`<div class="ui-item-detail-popup-item">
					<a class="ui-item-detail-stream-content-employee"
						 ${user.link ? `href="${user.link}"` : ''}
						 target="_blank"
						 title="${main_core.Text.encode(user.fullName)}"
						 ${user.photo ? `style="background-image: url('${user.photo}'); background-size: 100%;"` : ''}></a>
					<div class="ui-item-detail-popup-item-inner">
						<span class="ui-item-detail-popup-item-name">${main_core.Text.encode(user.fullName)}</span>
						<span class="ui-item-detail-popup-item-position">${user.workPosition}</span>
					</div>
					${sep}
				</div>`;
				if (status > this.statusWait) {
					node.classList.add('ui-item-detail-popup-item-' + (status === this.statusOk || status === this.statusYes ? 'success' : 'fail'));
				} else {
					node.classList.add('ui-item-detail-popup-item-' + (id === this.getUserId() ? 'current' : 'wait'));
				}
				return node;
			});
			let content = main_core.Tag.render`
					<div class="ui-item-detail-popup">
						${users}
					</div>`;
			if (this.data.participantJoint !== 'queue') {
				content.classList.add('ui-item-detail-popup-option');
			}
			let popup = new main_popup.Popup('rpa-detail-task-participant-' + this.getId(), event.target, {
				autoHide: true,
				draggable: false,
				bindOptions: {
					forceBindPosition: true
				},
				noAllPaddings: true,
				closeByEsc: true,
				cacheable: false,
				width: 280,
				angle: {
					position: 'top'
				},
				overlay: {
					backgroundColor: 'transparent'
				},
				content: content
			});
			popup.show();
		}
		renderTaskButtons() {
			const controls = this.data.controls;
			if (!controls) {
				return '';
			}
			const elements = this.data.type === 'RpaRequestActivity' ? this.getLinkButtonElements(controls.BUTTONS) : this.getActionButtonElements(controls.BUTTONS);
			return main_core.Tag.render`
			<div class="ui-item-detail-stream-content-detail-status-block">
				${elements}
			</div>
		`;
		}
		getActionButtonElements(buttons) {
			return buttons.map(button => {
				let bgColor = button.COLOR;
				let fgColor = rpa_manager.Manager.calculateTextColor(button.COLOR);
				return main_core.Tag.render`<button class="ui-btn ui-btn-sm ui-btn-default" 
					name="${button.NAME}"
					value="${button.VALUE}"
					style="background-color: #${bgColor};border-color: #${bgColor};color:${fgColor}"
					onclick="${this.doTaskHandler.bind(this, button)}"
					>${main_core.Text.encode(button.TEXT)}</button>
				`;
			});
		}
		getLinkButtonElements(buttons) {
			return [main_core.Tag.render`<a class="ui-btn ui-btn-sm ui-btn-default ui-btn-primary" 
					href="${main_core.Text.encode(this.data.url)}"
					>${main_core.Loc.getMessage('RPA_TIMELINE_TASKS_OPEN_TASK')}</a>
			`];
		}
		renderTaskFields() {
			if (!this.data.fieldsToSet) {
				return '';
			}
			const elements = this.data.fieldsToSet.map(field => {
				return main_core.Tag.render`
					<div class="ui-item-detail-stream-content-detail-main-field-value">&ndash; ${main_core.Text.encode(field)}</div>
				`;
			});
			return main_core.Tag.render`
			<div class="ui-item-detail-stream-content-detail-main-field">
				<div class="ui-item-detail-stream-content-detail-main-field-title">${main_core.Loc.getMessage('RPA_TIMELINE_TASKS_FIELDS_TO_SET')}</div>
				<div class="ui-item-detail-stream-content-detail-main-field-value-block">
					${elements}
				</div>
			</div>		
		`;
		}
		getTaskUserName(id) {
			if (!id) {
				id = this.getUserId();
			}
			let userData = this.users.get(main_core.Text.toInteger(id));
			return userData ? userData.fullName : '-?-';
		}
		renderParticipantPhoto(userId) {
			userId = main_core.Text.toInteger(userId);
			let userData = {
				fullName: '',
				photo: null
			};
			if (userId > 0) {
				userData = this.users.get(userId);
			}
			if (!userData) {
				return main_core.Tag.render`<span></span>`;
			}
			const safeFullName = main_core.Text.encode(userData.fullName);
			return main_core.Tag.render`<span class="ui-item-detail-stream-content-employee" title="${safeFullName}" ${userData.photo ? `style="background-image: url('${userData.photo}'); background-size: 100%;"` : ''}></span>`;
		}
		doTaskHandler(button) {
			const ajaxData = {};
			ajaxData[button.NAME] = button.VALUE;
			ajaxData['taskId'] = this.id;
			this.emit('onBeforeCompleteTask', {
				taskId: this.id
			});
			main_core.ajax.runAction('rpa.Task.do', {
				analyticsLabel: 'rpaTaskDo',
				data: ajaxData
			}).then(response => {
				if (response.data.completed) {
					if (response.data.timeline) {
						this.completedData = response.data.timeline;
					}
					this.onDelete();
					this.emit('onCompleteTask', {
						taskId: this.id
					});
				}
			});
		}
	}

	class TaskComplete extends ui_timeline.Timeline.History {
		renderContainer() {
			const container = super.renderContainer();
			container.classList.add('ui-item-detail-stream-section-history');
			return container;
		}
		renderTaskInfo() {
			let taskName = this.renderTaskName();
			if (!taskName) {
				taskName = '';
			}
			let taskResponsible = this.renderTaskResponsible();
			if (!taskResponsible) {
				taskResponsible = '';
			}
			return main_core.Tag.render`<div class="ui-item-detail-stream-content-detail-subject">
			${this.renderHeaderUser(this.getUserId(), 30)}
			<div class="ui-item-detail-stream-content-detail-subject-inner">
				${taskName}
				${taskResponsible}
			</div>
		</div>`;
		}
		renderTaskName() {
			const task = this.getTask();
			if (task) {
				return main_core.Tag.render`<a class="ui-item-detail-stream-content-detail-subject-text">${main_core.Text.encode(task.NAME)}</a>`;
			}
			return null;
		}
		renderTaskResponsible() {
			let user = this.users.get(main_core.Text.toInteger(this.getUserId()));
			if (user) {
				return main_core.Tag.render`<span class="ui-item-detail-stream-content-detail-subject-resp">${main_core.Text.encode(user.fullName)}</span>`;
			}
			return null;
		}
		renderMain() {
			let taskInfo = this.renderTaskInfo();
			let detailMain = this.renderDetailMain();
			if (!detailMain) {
				taskInfo.classList.add('rpa-item-detail-stream-content-detail-no-main');
			}
			return main_core.Tag.render`<div class="ui-item-detail-stream-content-detail">
			${taskInfo}
			${detailMain || ''}
		</div>`;
		}
		getTask() {
			if (main_core.Type.isPlainObject(this.data.task)) {
				return this.data.task;
			}
			return null;
		}
		renderDetailMain() {
			const task = this.getTask();
			let taskDescription = '';
			if (task && task.DESCRIPTION) {
				taskDescription = main_core.Tag.render`<span class="ui-item-detail-stream-content-detail-main-text">${main_core.Text.encode(task.DESCRIPTION)}</span>`;
			}
			let stageChange = this.renderStageChange();
			let fieldsChange = this.renderFieldsChange();
			if (taskDescription || stageChange || fieldsChange) {
				return main_core.Tag.render`<div class="ui-item-detail-stream-content-detail-main">
				${taskDescription}
				${fieldsChange ? [this.renderFieldsChangeTitle(), fieldsChange] : ''}
				${stageChange ? [this.renderStageChangeTitle(), stageChange] : ''}
			</div>`;
			}
			return null;
		}
	}

	/**
	 * @memberOf BX.Rpa
	 */
	const Timeline = {
		Task,
		TaskComplete
	};

	exports.Timeline = Timeline;

})(this.BX.Rpa = this.BX.Rpa || {}, BX, BX.Event, BX.UI, BX.Rpa, BX.Main);
//# sourceMappingURL=timeline.bundle.js.map
