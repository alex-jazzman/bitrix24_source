/* eslint-disable */
this.BX = this.BX || {};
this.BX.Tasks = this.BX.Tasks || {};
(function (exports, main_core, main_core_events, ui_sidepanel_layout, ui_confetti, ui_dialogs_messagebox) {
	'use strict';

	class RequestSender {
		sendRequest(controller, action, data = {}, analyticsLabel = {}) {
			return new Promise((resolve, reject) => {
				main_core.ajax.runAction('bitrix:tasks.scrum.' + controller + '.' + action, {
					data: data,
					analyticsLabel: analyticsLabel
				}).then(resolve, reject);
			});
		}
		getDataForSprintCompletionForm(data) {
			return this.sendRequest('sprint', 'getDataForSprintCompletionForm', data);
		}
		completeSprint(data) {
			return this.sendRequest('sprint', 'completeSprint', data, {
				scrum: 'Y',
				action: 'finish_sprint'
			});
		}
		showErrorAlert(response, alertTitle) {
			if (main_core.Type.isUndefined(response.errors)) {
				console.error(response);
				return;
			}
			if (response.errors.length) {
				const firstError = response.errors.shift();
				if (firstError) {
					const errorCode = firstError.code ? firstError.code : '';
					const message = firstError.message + ' ' + errorCode;
					const title = alertTitle ? alertTitle : main_core.Loc.getMessage('TASKS_SCRUM_ERROR_TITLE_POPUP');
					ui_dialogs_messagebox.MessageBox.alert(message, title);
				}
			}
		}
	}

	class Culture {
		static #instance;
		static getInstance() {
			if (!Culture.#instance) {
				Culture.#instance = new Culture();
			}
			return Culture.#instance;
		}
		setData(data) {
			this.data = data;
		}
		getDayMonthFormat() {
			return this.data.dayMonthFormat;
		}
		getLongDateFormat() {
			return this.data.longDateFormat;
		}
		getShortTimeFormat() {
			return this.data.shortTimeFormat;
		}
	}

	class SprintCompletionForm extends main_core_events.EventEmitter {
		constructor(params) {
			super(params);
			this.setEventNamespace('BX.Tasks.Scrum.SprintCompletionForm');
			this.groupId = parseInt(params.groupId, 10);

			/* eslint-disable */
			this.sidePanelManager = BX.SidePanel.Instance;
			/* eslint-enable */

			this.sidePanelId = 'tasks-scrum-sprint-completion-form-side-panel';
			this.requestSender = new RequestSender();
			this.node = null;
			this.completeButton = null;
		}
		show() {
			this.sidePanelManager.open(this.sidePanelId, {
				cacheable: false,
				width: 700,
				contentCallback: () => {
					return ui_sidepanel_layout.Layout.createContent({
						extensions: ['tasks.scrum.sprint-completion-form'],
						title: main_core.Loc.getMessage('TASKS_SCRUM_SPRINT_COMPLETION_FORM_TITLE'),
						content: this.createContent.bind(this),
						design: {
							section: false
						},
						buttons: ({
							cancelButton,
							SaveButton
						}) => {
							return [this.completeButton = new SaveButton({
								text: main_core.Loc.getMessage('TASKS_SCRUM_SPRINT_COMPLETION_FORM_BUTTON'),
								onclick: this.onComplete.bind(this)
							}), cancelButton];
						}
					});
				}
			});
		}
		onComplete() {
			let direction = 'backlog';
			let directionSelector = this.node.querySelector('.tasks-scrum__side-panel-completion--info-select');
			if (directionSelector) {
				directionSelector = directionSelector.querySelector('select');
				direction = directionSelector.value;
			}
			this.completeButton.setWaiting();
			this.requestSender.completeSprint({
				groupId: this.groupId,
				direction: direction
			}).then(response => {
				if (ui_confetti.Confetti) {
					ui_confetti.Confetti.fire({
						particleCount: 400,
						spread: 80,
						origin: {
							x: 0.7,
							y: 0.2
						},
						zIndex: this.sidePanelManager.getTopSlider().getZindex() + 1
					}).then(() => {
						this.closeSidePanel();
						this.emit('afterComplete');
					});
				} else {
					this.closeSidePanel();
					this.emit('afterComplete');
				}
			}).catch(response => {
				this.completeButton.setWaiting(false);
				this.requestSender.showErrorAlert(response, main_core.Loc.getMessage('TASKS_SCRUM_SPRINT_COMPLETION_ERROR_TITLE_POPUP'));
			});
		}
		closeSidePanel() {
			const openSliders = this.sidePanelManager.getOpenSliders();
			if (openSliders.length > 0) {
				openSliders.forEach(slider => {
					if (slider.getUrl() === this.sidePanelId) {
						slider.close(false);
					}
				});
			}
		}
		createContent() {
			return new Promise((resolve, reject) => {
				this.requestSender.getDataForSprintCompletionForm({
					groupId: this.groupId
				}).then(response => {
					Culture.getInstance().setData(response.data.culture);
					resolve(this.render(response.data));
				}).catch(response => {
					reject();
					this.sidePanelManager.close(false, () => {
						this.requestSender.showErrorAlert(response);
					});
				});
			});
		}
		render(sprintData) {
			const storyPoints = sprintData.storyPoints === '' ? 0 : sprintData.storyPoints;
			const periodDays = this.getPeriodDays(sprintData.dateStart);
			this.node = main_core.Tag.render`
			<div id="${main_core.Text.getRandom()}" class="tasks-scrum__scope--side-panel-completion">

			<div class="tasks-scrum__side-panel-completion--block">

				<div class="tasks-scrum__side-panel-completion--info-basic">
					<div class="tasks-scrum__side-panel-completion--info-basic-block">
						<div class="tasks-scrum__side-panel-completion--info-basic-title">
							${main_core.Text.encode(sprintData.name)}
						</div>
					</div>
					${this.renderGoal(sprintData.info.sprintGoal)}
				</div>

				<div class="tasks-scrum__side-panel-completion--info-additional">

					${this.renderEpics(sprintData.epics)}

					<div class="tasks-scrum__side-panel-completion--info-row">
						<div class="tasks-scrum__side-panel-completion--info-title">
							${main_core.Loc.getMessage('TASKS_SCRUM_SPRINT_COMPLETION_FORM_TIME_ROW_LABEL')}
						</div>
						<div class="tasks-scrum__side-panel-completion--info-content tasks-scrum__side-panel-completion--sprint-timing">
							<div class="tasks-scrum__side-panel-completion--date-name-block">
								<div>${main_core.Loc.getMessage('TASKS_SCRUM_SPRINT_COMPLETION_FORM_DATE_START_LABEL_MSGVER_1')}</div>
								<div>${main_core.Loc.getMessage('TASKS_SCRUM_SPRINT_COMPLETION_FORM_DATE_END_LABEL')}</div>
								${this.renderLabelPeriodDays(periodDays)}
							</div>
							<div class="tasks-scrum__side-panel-completion--date-result-block">
								<div>${this.getFormattedDateStart(sprintData.dateStart)}</div>
								<div>${this.getFormattedDateStart(sprintData.dateEnd)}</div>
								${this.renderPeriodDays(periodDays)}
							</div>
						</div>
					</div>

					<div class="tasks-scrum__side-panel-completion--info-row">

						<div class="tasks-scrum__side-panel-completion--info-title">
							${main_core.Loc.getMessage('TASKS_SCRUM_SPRINT_COMPLETION_FORM_PLAN_ROW_LABEL')}
						</div>
						<div class="tasks-scrum__side-panel-completion--info-content">
							<div class="tasks-scrum__side-panel-completion--plan-block">

								<div class="tasks-scrum__side-panel-completion--sprint-plans">
									<div class="tasks-scrum__side-panel-completion--plan-block-number --percent">
										<div 
											class="tasks-scrum__side-panel-completion--plan-block-number-date"
											title="${main_core.Text.encode(storyPoints)}"
										>
											${main_core.Text.encode(storyPoints)}
										</div>
									</div>
									<div class="tasks-scrum__side-panel-completion--plan-block-name">
										<div class="tasks-scrum__side-panel-completion--plan-block-name-text">
											${main_core.Loc.getMessage('TASKS_SCRUM_SPRINT_COMPLETION_FORM_PLAN_SP')}
										</div>
										<div class="ui-hint">
											<span
												class="ui-hint-icon"
												data-hint="${main_core.Loc.getMessage('TSS_START_STORY_POINTS_HINT')}"
												data-hint-no-icon
											></span>
										</div>
									</div>
								</div>

								<div class="tasks-scrum__side-panel-completion--sprint-plans">
									${this.renderWheelCompletedStoryPoints(sprintData)}
									<div class="tasks-scrum__side-panel-completion--plan-block-name">
										<div class="tasks-scrum__side-panel-completion--plan-block-name-text">
											${main_core.Loc.getMessage('TASKS_SCRUM_SPRINT_COMPLETION_FORM_DONE_SP')}
										</div>
										<div class="ui-hint">
											<span
												class="ui-hint-icon"
												data-hint="${main_core.Loc.getMessage('TSS_START_STORY_POINTS_HINT')}"
												data-hint-no-icon
											></span>
										</div>
									</div>
								</div>

							</div>
						</div>
					</div>
				</div>
			</div>

			${this.renderUncompletedTasks(sprintData)}

			</div>
		`;
			this.initHints(this.node);
			return this.node;
		}
		renderLabelPeriodDays(periodDays) {
			if (main_core.Type.isNull(periodDays)) {
				return '';
			}
			return main_core.Tag.render`<div>${main_core.Loc.getMessage('TASKS_SCRUM_SPRINT_COMPLETION_FORM_PERIOD_LABEL')}</div>`;
		}
		renderPeriodDays(periodDays) {
			if (main_core.Type.isNull(periodDays)) {
				return '';
			}
			return main_core.Tag.render`<div>${main_core.Text.encode(periodDays)}</div>`;
		}
		renderGoal(goal) {
			if (goal === '') {
				return '';
			}
			return main_core.Tag.render`
			<div class="tasks-scrum__side-panel-completion--info-basic-block">
				<div class="tasks-scrum__side-panel-completion--info-basic-description">
					${main_core.Text.encode(goal)}
				</div>
			</div>
		`;
		}
		renderEpics(epics) {
			if (!epics.length) {
				return '';
			}
			return main_core.Tag.render`
			<div class="tasks-scrum__side-panel-completion--info-row">
				<div class="tasks-scrum__side-panel-completion--info-title">
					${main_core.Loc.getMessage('TASKS_SCRUM_SPRINT_COMPLETION_FORM_EPICS_ROW_LABEL')}
				</div>
				<div class="tasks-scrum__side-panel-completion--info-content">
					${epics.map(epic => {
			const colorBorder = this.convertHexToRGBA(epic.color, 0.7);
			const colorBackground = this.convertHexToRGBA(epic.color, 0.3);
			return main_core.Tag.render`
								<span
									class="tasks-scrum__epic-label"
									style="background: ${colorBackground}; border-color: ${colorBorder};"
								>${main_core.Text.encode(epic.name)}</span>`;
		})}
				</div>
			</div>
		`;
		}
		renderWheelCompletedStoryPoints(sprintData) {
			let differencePercentage = 0;
			const currentPercentage = this.calculatePercentage(sprintData.storyPoints, sprintData.completedStoryPoints);
			if (sprintData.existsLastSprint) {
				const lastPercentage = this.calculatePercentage(sprintData.lastStoryPoints, sprintData.lastCompletedStoryPoints);
				differencePercentage = parseFloat(currentPercentage) - parseFloat(lastPercentage);
			} else {
				differencePercentage = currentPercentage;
			}
			let wheelClass = '';
			if (differencePercentage > 0) {
				wheelClass = `tasks-scrum__side-panel-completion--plan-block-number --arrow-up --percent --success`;
			} else {
				wheelClass = `tasks-scrum__side-panel-completion--plan-block-number --arrow-down --percent --warning`;
			}
			const absoluteValue = Math.abs(differencePercentage);
			const renderProgress = percent => {
				if (percent === 0) {
					return '';
				}
				return main_core.Tag.render`
				<div class="tasks-scrum__side-panel-completion--progress">
					<span class="tasks-scrum__side-panel-completion--progress-number">${percent}</span>
					<span class="tasks-scrum__side-panel-completion--progress-percent">%</span></div>
				</div>
			`;
			};
			return main_core.Tag.render`
			<div class="${wheelClass}">
				<div 
					class="tasks-scrum__side-panel-completion--plan-block-number-date"
					title="${main_core.Text.encode(sprintData.completedStoryPoints)}"
				>
					${main_core.Text.encode(sprintData.completedStoryPoints)}
				</div>
				${renderProgress(absoluteValue)}
			</div>
		`;
		}
		renderUncompletedTasks(sprintData) {
			if (sprintData.uncompletedTasks.length === 0) {
				return '';
			}
			return main_core.Tag.render`
			<div class="tasks-scrum__side-panel-completion--block">
				<div class="tasks-scrum__side-panel-completion--info-basic">
					<div class="tasks-scrum__side-panel-completion--info-basic-block">
						<div class="tasks-scrum__side-panel-completion--info-basic-title-icon">
							${main_core.Loc.getMessage('TASKS_SCRUM_SPRINT_COMPLETION_FORM_ACTION_ROW_LABEL')}
						</div>
					</div>
					<div class="tasks-scrum__side-panel-completion--info-basic-description">
						${main_core.Loc.getMessage('TASKS_SCRUM_SPRINT_COMPLETION_FORM_ACTION_MOVE_LABEL')}
					</div>
					${this.renderMoveSelect(sprintData.plannedSprints)}
				</div>
				<div class="tasks-scrum__side-panel-completion--info-items">
					${sprintData.uncompletedTasks.map(item => this.renderItem(item))}
				</div>
			</div>
		`;
		}
		renderMoveSelect(plannedSprints) {
			const uiClasses = 'ui-ctl ui-ctl-after-icon ui-ctl-dropdown ui-ctl-w100';
			let sprintsOptions = '';
			plannedSprints.forEach(sprint => {
				sprintsOptions += `<option value="${sprint.id}">${main_core.Text.encode(sprint.name)}</option>`;
			});
			return main_core.Tag.render`
			<div class="tasks-scrum__side-panel-completion--info-select ${uiClasses}">
				<div class="ui-ctl-after ui-ctl-icon-angle"></div>
				<select class="ui-ctl-element">
					<option value="0">
						${main_core.Loc.getMessage('TASKS_SCRUM_SPRINT_COMPLETION_FORM_SELECTOR_SPRINT')}
					</option>
					<option value="backlog">
						${main_core.Loc.getMessage('TASKS_SCRUM_SPRINT_COMPLETION_FORM_SELECTOR_BACKLOG')}
					</option>
					${sprintsOptions}
				</select>
			</div>
		`;
		}
		renderItem(item) {
			const src = item.responsible.photo ? main_core.Text.encode(item.responsible.photo.src) : null;
			const photoStyle = src ? `background-image: url('${encodeURI(src)}');` : '';
			const storyPointsClass = item.storyPoints === '' ? '--empty' : '';
			const node = main_core.Tag.render`
			<div class="tasks-scrum__item-side-panel">
				<div class="tasks-scrum__item-side-panel--info">
					<div class="tasks-scrum__item-side-panel--main-info">
						<div class="tasks-scrum__item-side-panel--title">
							${main_core.Text.encode(item.name)}
						</div>
						<div class="tasks-scrum__item-side-panel--tags">
							${this.renderEpic(item.epic)}
							${this.renderTags(item.tags)}
						</div>
					</div>
				</div>
				<div class="tasks-scrum__item-side-panel--responsible">
					<div
						class="tasks-scrum__item-side-panel--responsible-photo ui-icon ui-icon-common-user"
						title="${main_core.Text.encode(item.responsible.name)}"
					><i style="${photoStyle}"></i>
					</div>
					<span>${main_core.Text.encode(item.responsible.name)}</span>
				</div>
				<div class="tasks-scrum__item-side-panel--story-points ${storyPointsClass}">
					<div class="tasks-scrum__item-side-panel--story-points-content">
						<div class="tasks-scrum__item-side-panel--story-points-element">
							${item.storyPoints === '' ? '-' : main_core.Text.encode(item.storyPoints)}
						</div>
					</div>
				</div>
			</div>
		`;
			main_core.Event.bind(node, 'click', () => this.emit('taskClick', item.sourceId));
			return node;
		}
		renderEpic(epic) {
			if (main_core.Type.isArray(epic) || main_core.Type.isUndefined(epic)) {
				return '';
			}
			return main_core.Tag.render`
			<div class="tasks-scrum__item-side-panel--epic --visible">
				<i
					class="tasks-scrum__item-side-panel--epic-point"
					style="${`background-color: ${epic.color}`}"
				></i>
				<span>${main_core.Text.encode(epic.name)}</span>
			</div>
		`;
		}
		renderTags(tags) {
			if (tags.length === 0) {
				return '';
			}
			return main_core.Tag.render`
			${tags.map(tag => main_core.Tag.render`
				<div class="tasks-scrum__item-side-panel--hashtag --visible">#${main_core.Text.encode(tag)}</div>
			`)}
		`;
		}
		getFormattedDateStart(dateStart) {
			/* eslint-disable */
			return BX.date.format(Culture.getInstance().getLongDateFormat(), dateStart);
			/* eslint-enable */
		}
		getFormattedDateEnd(dateEnd) {
			/* eslint-disable */
			return BX.date.format(Culture.getInstance().getLongDateFormat(), dateEnd);
			/* eslint-enable */
		}
		getPeriodDays(dateStartTime) {
			const dateWithWeekendOffset = new Date();
			dateWithWeekendOffset.setSeconds(dateWithWeekendOffset.getSeconds());
			dateWithWeekendOffset.setHours(0, 0, 0, 0);
			const dateStart = new Date(dateStartTime * 1000);
			const date = new Date();
			if (dateStart >= date) {
				return null;
			}
			return BX.date.format('ddiff', dateStart, dateWithWeekendOffset);
		}
		calculatePercentage(first, second) {
			if (first === 0) {
				return 0;
			}
			const result = Math.round(second * 100 / first);
			return isNaN(result) ? 0 : result;
		}
		convertHexToRGBA(hexCode, opacity) {
			let hex = hexCode.replace('#', '');
			if (hex.length === 3) {
				hex = `${hex[0]}${hex[0]}${hex[1]}${hex[1]}${hex[2]}${hex[2]}`;
			}
			const r = parseInt(hex.substring(0, 2), 16);
			const g = parseInt(hex.substring(2, 4), 16);
			const b = parseInt(hex.substring(4, 6), 16);
			return `rgba(${r},${g},${b},${opacity})`;
		}
		initHints(node) {
			// todo wtf hint
			BX.UI.Hint.popup = null;
			BX.UI.Hint.id = 'ui-hint-popup-' + +new Date();
			BX.UI.Hint.init(node);
		}
	}

	exports.SprintCompletionForm = SprintCompletionForm;

})(this.BX.Tasks.Scrum = this.BX.Tasks.Scrum || {}, BX, BX.Event, BX.UI.SidePanel, BX.UI, BX.UI.Dialogs);
//# sourceMappingURL=sprint.completion.form.bundle.js.map
