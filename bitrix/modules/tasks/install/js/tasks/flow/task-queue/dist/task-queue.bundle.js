/* eslint-disable */
this.BX = this.BX || {};
this.BX.Tasks = this.BX.Tasks || {};
(function (exports, main_core, main_loader, main_popup, tasks_sidePanelIntegration) {
	'use strict';

	class Member {
		#id;
		#name;
		#avatar;
		#workPosition;
		#pathToProfile;
		constructor(data) {
			this.#id = parseInt(data.id, 10);
			this.#name = data.name;
			this.#avatar = data.avatar;
			this.#workPosition = data.workPosition;
			this.#pathToProfile = data.pathToProfile;
		}
		render() {
			return main_core.Tag.render`
			<div class="tasks-flow__task-queue-member" data-id="tasks-flow-task-queue-member-${this.getId()}">
				${this.#renderAvatar()}
			</div>
		`;
		}
		#renderAvatar() {
			let photoIcon = '<i></i>';
			if (this.getAvatar()) {
				photoIcon = `<i style="background-image: url('${encodeURI(this.getAvatar())}')"></i>`;
			}
			return main_core.Tag.render`
			<a 
				href="${main_core.Text.encode(this.getPathToProfile())}"
				class="tasks-flow__task-queue-member_avatar ui-icon ui-icon-common-user"
			>
				${photoIcon}
			</a>
		`;
		}
		getId() {
			return this.#id;
		}
		getName() {
			return this.#name;
		}
		getAvatar() {
			return this.#avatar;
		}
		getPathToProfile() {
			return this.#pathToProfile;
		}
	}

	class Line {
		#serial;
		#title;
		#url;
		#createdBy;
		#creator;
		#responsibleId;
		#responsible;
		#timeInStatus;
		#canRead;
		constructor(lineData) {
			this.#serial = parseInt(lineData.serial, 10);
			this.#createdBy = parseInt(lineData.createdBy, 10);
			this.#creator = new Member(lineData.creator);
			this.#responsibleId = parseInt(lineData.responsibleId, 10);
			this.#responsible = new Member(lineData.responsible);
			this.#timeInStatus = lineData.timeInStatus.formatted;
			this.#title = lineData.title;
			this.#url = lineData.url;
			this.#canRead = Boolean(lineData.canRead);
		}
		render() {
			return main_core.Tag.render`
			<div class="tasks-flow__task-queue-line-container">
				<div class="tasks-flow__task-queue-line">
					${this.#getSerialElement()}
					${this.#getTitleElement()}
					<div class="tasks-flow__task-queue-line_time" title="${this.#timeInStatus}">${this.#timeInStatus}</div>
				</div>
				
				<div class="tasks-flow__task-queue-line-avatars">
					<div class="tasks-flow__task-queue-line_avatar">${this.#creator.render()}</div>
					<div class="ui-icon-set --chevron-right" style="--ui-icon-set__icon-size: 14px; color: #A8ADB4"></div>
					<div class="tasks-flow__task-queue-line_avatar">${this.#responsible.render()}</div>
				</div>
			</div>
		`;
		}
		#getTitleElement() {
			if (this.#canRead) {
				return main_core.Tag.render`
				<a class="tasks-flow__task-queue-line_title-access" href="${this.#url}">${main_core.Text.encode(this.#title)}</a>
			`;
			}
			return main_core.Tag.render`
			<div class="tasks-flow__task-queue-line_title">${main_core.Text.encode(this.#title)}</div>
		`;
		}
		#getSerialElement() {
			return main_core.Tag.render`
			<div class="tasks-flow__task-queue-line_number">${this.#getSerial()}</div>
		`;
		}
		#getSerial() {
			if (this.#serial < 10) {
				return `0${this.#serial}`;
			}
			return this.#serial;
		}
	}

	class TaskQueue {
		static TYPES = {
			PENDING: 'PENDING',
			AT_WORK: 'AT_WORK',
			COMPLETED: 'COMPLETED'
		};
		#params;
		#flowId;
		#type;
		#pageSize = 10;
		#pageNum = 1;
		#pending = false;
		#pages;
		#totalTaskCount;
		#popup;
		#loader;
		#layout;
		constructor(params) {
			this.#params = params;
			this.#flowId = parseInt(params.flowId, 10);
			if (!(params.type in TaskQueue.TYPES)) {
				throw new Error('The specified queue type is incorrect');
			}
			this.#type = params.type;
			this.#pages = {};
			this.#layout = {};
		}
		static showInstance(params) {
			new this(params).show(params.bindElement);
		}
		show(bindElement) {
			this.#popup = this.getPopup();
			this.#popup.setContent(this.#renderContent());
			this.#popup.setBindElement(bindElement);
			this.#popup.show();
		}
		getPopup() {
			const queueId = this.#params.flowId + this.#params.type;
			const id = `tasks-flow-task-queue-popup-${queueId}`;
			if (main_popup.PopupManager.getPopupById(id)) {
				return main_popup.PopupManager.getPopupById(id);
			}
			const popup = new main_popup.Popup({
				id,
				className: 'tasks-flow__task-queue-popup',
				padding: 2,
				autoHide: true,
				closeByEsc: true,
				events: {
					onFirstShow: () => {
						this.#showLines();
					},
					onClose: () => {
						popup.destroy();
					}
				}
			});
			new tasks_sidePanelIntegration.SidePanelIntegration(popup);
			return popup;
		}
		#getList(pageNum) {
			this.#pending = true;
			const map = {
				PENDING: 'Pending',
				AT_WORK: 'Progress',
				COMPLETED: 'Completed'
			};
			return new Promise(resolve => {
				main_core.ajax.runAction(`tasks.flow.Task.${map[this.#type]}.list`, {
					data: {
						flowData: {
							id: this.#flowId
						},
						ago: {
							days: 30
						}
					},
					navigation: {
						page: pageNum,
						size: this.#pageSize
					}
				}).then(response => {
					this.#pending = false;
					if (response.data.tasks.length >= this.#pageSize) {
						this.#pageNum++;
					}
					resolve({
						lines: response.data.tasks,
						totalTaskCount: response.data.totalCount
					});
				}).catch(error => {
					this.#consoleError('getList', error);
				});
			});
		}
		#renderContent() {
			const {
				popupContainer,
				popupContent
			} = main_core.Tag.render`
			<div ref="popupContainer" class="tasks-flow__task-queue-popup_container">
				<div ref="listContainer" class="tasks-flow__task-queue-popup_content">
					<div class="tasks-flow__task-queue-popup_content-box">
						<span class="tasks-flow__task-queue-popup_label">
							<span class="tasks-flow__task-queue-popup_label-text" title="${main_core.Loc.getMessage(`TASKS_FLOW_TASK_QUEUE_POPUP_LABEL_${this.#type}`)}">
								${main_core.Loc.getMessage(`TASKS_FLOW_TASK_QUEUE_POPUP_LABEL_${this.#type}`)}
							</span>
						</span>
						<div class="tasks-flow__task-queue-popup_status-counter-box">
							<span class="tasks-flow__task-queue-popup_status" title="${main_core.Loc.getMessage(`TASKS_FLOW_TASK_QUEUE_POPUP_STATUS_${this.#type}`)}">
								${main_core.Loc.getMessage(`TASKS_FLOW_TASK_QUEUE_POPUP_STATUS_${this.#type}`)}
							</span>
							${this.#renderCounterContainer()}
						</div>
							<div class="tasks-flow__task-queue-popup_delimiter"></div>
						${this.#renderLines()}
					</div>
				</div>
			</div>
		`;
			this.#layout.popupContainer = popupContainer;
			this.#layout.popupContent = popupContent;
			return this.#layout.popupContainer;
		}
		#renderCounterContainer() {
			this.#layout.counterContainer = main_core.Tag.render`
			<div class="tasks-flow__total-task-counter-container ui-counter">
					${this.#renderTotalTaskCounter()}
			</div>
		`;
			main_core.Dom.style(this.#layout.counterContainer, 'display', 'none');
			return this.#layout.counterContainer;
		}
		#renderTotalTaskCounter() {
			this.#layout.totalTaskCounter = main_core.Tag.render`
			<div class="tasks-flow__total-task-counter ui-counter-inner"></div>
		`;
			return this.#layout.totalTaskCounter;
		}
		#renderLines() {
			this.#layout.popupInner = main_core.Tag.render`
			<div class="tasks-flow__task-queue-popup_inner">
				${Object.values(this.#pages).flat().map(line => line.render())}
			</div>
		`;
			main_core.Event.bind(this.#layout.popupInner, 'scroll', () => {
				const scrollTop = this.#layout.popupInner.scrollTop;
				const maxScroll = this.#layout.popupInner.scrollHeight - this.#layout.popupInner.offsetHeight;
				if (Math.abs(scrollTop - maxScroll) < 1 && this.#pending === false) {
					this.#showLines();
				}
			});
			return this.#layout.popupInner;
		}
		#showLines() {
			this.#showLoader();

			// eslint-disable-next-line promise/catch-or-return
			this.#appendLines(this.#pageNum).then(() => {
				this.#destroyLoader();
				this.#setTotalTaskCount();
			});
		}
		#appendLines(pageNum) {
			if (this.#pages[pageNum]) {
				return Promise.resolve();
			}
			const list = this.#layout.popupInner;

			// eslint-disable-next-line promise/catch-or-return
			return this.#getList(pageNum).then(({
				lines,
				totalTaskCount
			}) => {
				this.#totalTaskCount = totalTaskCount;
				main_core.Dom.style(this.#layout.counterContainer, 'display', 'inline-flex');
				this.#pages[pageNum] = lines.map(data => new Line(data));
				this.#pages[pageNum].forEach(line => main_core.Dom.append(line.render(), list));
			});
		}
		#setTotalTaskCount() {
			if (!main_core.Type.isNil(this.#totalTaskCount)) {
				this.#layout.totalTaskCounter.innerText = this.#totalTaskCount > 99 ? '99+' : this.#totalTaskCount;
			}
		}
		#showLoader() {
			const targetPosition = main_core.Dom.getPosition(this.#layout.popupInner);
			const size = 40;
			this.#loader = new main_loader.Loader({
				target: this.#layout.popupInner,
				size,
				mode: 'inline',
				offset: {
					left: `${targetPosition.width / 2 - size / 2}px`
				}
			});
			this.#loader.show();
		}
		#destroyLoader() {
			this.#loader.destroy();
		}
		#consoleError(action, error) {
			// eslint-disable-next-line no-console
			console.error(`TaskQueue: ${action} error`, error);
		}
	}

	exports.TaskQueue = TaskQueue;

})(this.BX.Tasks.Flow = this.BX.Tasks.Flow || {}, BX, BX, BX.Main, BX.Tasks);
//# sourceMappingURL=task-queue.bundle.js.map
