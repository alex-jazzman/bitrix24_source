/* eslint-disable */
this.BX = this.BX || {};
this.BX.Bizproc = this.BX.Bizproc || {};
(function (exports, main_core, bizproc_document, bizproc_types, ui_icons_b24, ui_hint, ui_textcrop, main_popup, bizproc_task, main_date) {
	'use strict';

	class ErrorsView {
		#errors = [];
		constructor(props) {
			if (main_core.Type.isArrayFilled(props.errors)) {
				this.#errors = props.errors;
			}
		}
		render() {
			return main_core.Tag.render`
			<div class="bizproc-workflow-timeline_error-wrapper">
				<div class="bizproc-workflow-timeline_error-inner">
					${this.#errors.map(({
			message
		}) => main_core.Tag.render`
						<p class="bizproc-workflow-timeline_error-text">${main_core.Text.encode(message)}</p>
					`)}
					<div class="bizproc-workflow-timeline_error-img"></div>
				</div>
			</div>
		`;
		}
		renderTo(target) {
			main_core.Dom.append(this.render(), target);
		}
	}

	class TimelineTask {
		#data = {};
		constructor(data) {
			if (main_core.Type.isPlainObject(data)) {
				this.#data = data;
			}
		}
		canView() {
			return main_core.Type.isBoolean(this.#data.canView) ? this.#data.canView : false;
		}
		get status() {
			return new bizproc_task.TaskStatus(this.#data.status);
		}
		get id() {
			return main_core.Type.isInteger(this.#data.id) ? this.#data.id : 0;
		}
		get name() {
			return main_core.Type.isString(this.#data.name) ? this.#data.name : '';
		}
		get modified() {
			return main_core.Type.isInteger(this.#data.modified) ? Math.max(this.#data.modified, 0) : 0;
		}
		get users() {
			return main_core.Type.isArray(this.#data.users) ? this.#data.users : [];
		}
		get executionTime() {
			return main_core.Type.isInteger(this.#data.executionTime) ? Math.max(this.#data.executionTime, 0) : null;
		}
		get approveType() {
			return main_core.Type.isString(this.#data.approveType) ? this.#data.approveType : '';
		}
		get url() {
			return main_core.Type.isStringFilled(this.#data.url) ? this.#data.url : null;
		}
	}

	const TOO_LONG_PROCESS_DURATION = 60 * 60 * 24 * 3; // Three days

	class TimelineTaskView {
		#task;
		#userId = 0;
		#taskNumber = null;
		#dateFormat;
		#dateFormatShort;
		#users;
		constructor(props) {
			this.#task = props.task;
			this.#dateFormat = props.dateFormat;
			this.#dateFormatShort = props.dateFormatShort;
			this.#users = props.users;
			if (main_core.Type.isNumber(props.taskNumber) && props.taskNumber > 0) {
				this.#taskNumber = props.taskNumber;
			}
			if (main_core.Type.isNumber(props.userId) && props.userId > 0) {
				this.#userId = props.userId;
			}
		}
		renderTo(target) {
			main_core.Dom.append(this.render(), target);
		}
		render() {
			return this.#task.canView() ? this.#renderContent() : this.#renderAccessDenied();
		}
		#renderContent() {
			const isWaiting = this.#task.status.isWaiting();
			return main_core.Tag.render`
			<div class="bizproc-workflow-timeline-item ${isWaiting ? '--processing' : ''}">
				<div class="bizproc-workflow-timeline-item-inner">
					<div>
						<span class="bizproc-workflow-timeline-icon ${isWaiting ? '--processing' : '--success'}">
							${isWaiting ? '' : this.#taskNumber || ''}
						</span>
						<div class="bizproc-workflow-timeline-title">
							<span>${main_core.Text.encode(this.#task.name)}</span>
							${this.#renderButton()}
						</div>
					</div>
					<div class="bizproc-workflow-timeline-subject">
						${main_core.Text.encode(DurationFormatter.formatDate(this.#task.modified, this.#dateFormat, this.#dateFormatShort))}
					</div>
					<div class="bizproc-workflow-timeline-content">
						${this.#renderStatus()}
						${this.#renderUsers()}
						${this.#renderExecutionTime()}
					</div>
				</div>
			</div>
		`;
		}
		#renderButton() {
			if (this.#userId === 0 || !this.#task.url) {
				return null;
			}
			const participant = this.#task.users.find(user => user.id === this.#userId);
			if (main_core.Type.isUndefined(participant)) {
				return null;
			}
			const isWaiting = new bizproc_task.UserStatus(participant.status).isWaiting();
			return main_core.Tag.render`
			<a
				class="
					bizproc-workflow-timeline-task-link
					bizproc-workflow-timeline-task-link-${isWaiting ? 'blue' : 'gray'}
				"
				href="${main_core.Text.encode(this.#task.url || new main_core.Uri(`/company/personal/bizproc/${this.#task.id}/`).toString())}"
			>
				${main_core.Text.encode(isWaiting ? main_core.Loc.getMessage('BIZPROC_WORKFLOW_TIMELINE_SLIDER_BUTTON_PROCEED') : main_core.Loc.getMessage('BIZPROC_WORKFLOW_TIMELINE_SLIDER_BUTTON_SEE'))}
			</a>
		`;
		}
		#renderStatus() {
			let message = main_core.Text.encode(this.#getStatusName(this.#task.status, this.#task.approveType, this.#task.users.length));
			if (this.#task.status.isWaiting() && this.#task.approveType === 'vote') {
				let votedCount = 0;
				for (const user of this.#task.users) {
					if (!new bizproc_task.TaskStatus(user.status).isWaiting()) {
						votedCount++;
					}
				}
				message = main_core.Loc.getMessage('BIZPROC_WORKFLOW_TIMELINE_SLIDER_VOTED', {
					'#VOTED#': votedCount,
					'#TOTAL#': this.#task.users.length
				});
			}
			return main_core.Tag.render`<div class="bizproc-workflow-timeline-caption">${message}</div>`;
		}
		#getStatusName(taskStatus, taskApproveType, usersCount) {
			if (taskStatus.isYes() || taskStatus.isOk()) {
				return main_core.Loc.getMessage('BIZPROC_WORKFLOW_TIMELINE_SLIDER_PERFORMED');
			}
			if (taskStatus.isNo() || taskStatus.isCancel()) {
				return main_core.Loc.getMessage('BIZPROC_WORKFLOW_TIMELINE_SLIDER_DECLINED');
			}
			if (taskStatus.isWaiting()) {
				if (usersCount === 1) {
					return main_core.Loc.getMessage('BIZPROC_WORKFLOW_TIMELINE_SLIDER_PERFORMING');
				}
				let message = '';
				switch (taskApproveType) {
					case 'all':
						message = main_core.Loc.getMessage('BIZPROC_WORKFLOW_TIMELINE_SLIDER_PERFORMING_ALL');
						break;
					case 'any':
						message = main_core.Loc.getMessage('BIZPROC_WORKFLOW_TIMELINE_SLIDER_PERFORMING_ANY');
						break;
					case 'vote':
						message = main_core.Loc.getMessage('BIZPROC_WORKFLOW_TIMELINE_SLIDER_PERFORMING_ALL');
						break;
					default:
						message = main_core.Loc.getMessage('BIZPROC_WORKFLOW_TIMELINE_SLIDER_PERFORMING');
						break;
				}
				return message;
			}
			return taskStatus.name;
		}
		#renderUsers() {
			const showVoteResult = this.#task.users.length > 1;
			return main_core.Tag.render`
			<div class="bizproc-workflow-timeline-user-list">
				${Object.values(this.#task.users).map(user => this.#renderUser(user, showVoteResult))}
			</div>
		`;
		}
		#renderUser(userData, showVoteResult) {
			const user = this.#users.get(userData.id);
			if (!user) {
				return null;
			}
			const status = new bizproc_task.TaskStatus(userData.status);
			let voteClass = '';
			if (showVoteResult) {
				if (status.isYes() || status.isOk()) {
					voteClass = '--voted-up';
				}
				if (status.isNo()) {
					voteClass = '--voted-down';
				}
			}
			let avatar = '<i></i>';
			if (main_core.Type.isString(user.avatarSize100)) {
				avatar = `<i style="background-image: url('${encodeURI(main_core.Text.encode(user.avatarSize100))}')"></i>`;
			}
			return main_core.Tag.render`
			<div class="bizproc-workflow-timeline-user ${voteClass}">
				<div class="bizproc-workflow-timeline-userlogo ui-icon ui-icon-common-user">
					${avatar}
				</div>
				<div class="bizproc-workflow-timeline-user-block">
					<a class="bizproc-workflow-timeline-link" href="${user.link}">${main_core.Text.encode(user.fullName)}</a>
					<div class="bizproc-workflow-timeline-user-pos" title="${main_core.Text.encode(user.workPosition || '')}">
						${main_core.Text.encode(user.workPosition || '')}
					</div>
				</div>
			</div>
		`;
		}
		#renderExecutionTime() {
			const executionTime = this.#task.executionTime;
			if (main_core.Type.isNil(executionTime)) {
				return null;
			}
			const useHint = executionTime >= TOO_LONG_PROCESS_DURATION;
			const hint = main_core.Tag.render`
			<span
				data-hint="${main_core.Text.encode(main_core.Loc.getMessage('BIZPROC_WORKFLOW_TIMELINE_TIME_LIMIT_EXCEEDED'))}"
			></span>
		`;
			const notice = main_core.Tag.render`
			<div class="bizproc-workflow-timeline-notice">
				<div class="bizproc-workflow-timeline-subject">
					${main_core.Text.encode(main_core.Loc.getMessage('BIZPROC_WORKFLOW_TIMELINE_SLIDER_EXECUTION_TIME'))}
				</div>
				<span class="bizproc-workflow-timeline-text">
					${main_core.Text.encode(DurationFormatter.formatTimeInterval(executionTime, 2))}
				</span>
				${useHint ? hint : null}
			</div>
		`;
			if (useHint) {
				BX.UI.Hint.init(notice);
			}
			return notice;
		}
		#renderAccessDenied() {
			return main_core.Tag.render`
			<div class="bizproc-workflow-timeline-item --tech">
				<div class="bizproc-workflow-timeline-item-inner">
					<div>
						<span class="bizproc-workflow-timeline-icon"></span>
						<div class="bizproc-workflow-timeline-title">
							${main_core.Text.encode(main_core.Loc.getMessage('BIZPROC_WORKFLOW_TIMELINE_SLIDER_NO_RIGHTS_TO_VIEW'))}
						</div>
					</div>
					<div class="bizproc-workflow-timeline-subject">
						${main_core.Text.encode(main_core.Loc.getMessage('BIZPROC_WORKFLOW_TIMELINE_SLIDER_NO_RIGHTS_TO_VIEW_TIP'))}
					</div>
				</div>
			</div>
		`;
		}
	}

	// eslint-disable-next-line max-classes-per-file
	class DurationFormatter {
		static #limits = [[3600 * 24 * 365, 'Ydiff'], [3600 * 24 * 31, 'mdiff'], [3600 * 24, 'ddiff'], [3600, 'Hdiff'], [60, 'idiff']];
		static #getFormatString(seconds) {
			for (const limit of this.#limits) {
				if (seconds >= limit[0]) {
					return limit[1];
				}
			}
			return 'sdiff';
		}
		static #getMultiplierByFormat(format) {
			for (const limit of this.#limits) {
				if (format === limit[1]) {
					return limit[0];
				}
			}
			return 0;
		}
		static formatTimestamp(timestamp) {
			return main_date.DateTimeFormat.format(this.#getFormatString(Date.now() / 1000 - timestamp), timestamp);
		}
		static formatTimeInterval(interval, values = 1) {
			if (main_core.Type.isNil(interval)) {
				return main_core.Loc.getMessage('BIZPROC_WORKFLOW_TIMELINE_SLIDER_AVERAGE_PROCESS_TIME_UNKNOWN');
			}
			if (interval === 0) {
				return main_core.Loc.getMessage('BIZPROC_WORKFLOW_TIMELINE_SLIDER_ZERO_SECOND_INTERVAL');
			}
			let result = '';
			let remainder = interval;
			for (let i = 0; i < values; i++) {
				const format = this.#getFormatString(remainder);
				// ignore seconds if we already have result
				if (result.length > 0 && format === 'sdiff') {
					return result;
				}
				const multiplier = this.#getMultiplierByFormat(format);
				result += main_date.DateTimeFormat.format(format, 0, remainder);
				result += ' ';
				if (multiplier > 0) {
					remainder %= multiplier;
					if (remainder === 0) {
						return result;
					}
				}
			}
			return result;
		}
		static formatDate(timestamp, format, formatShort) {
			if (formatShort && main_date.DateTimeFormat.format('Y', timestamp) === main_date.DateTimeFormat.format('Y', Date.now() / 1000)) {
				return main_date.DateTimeFormat.format(formatShort, timestamp);
			}
			return main_date.DateTimeFormat.format(format, timestamp);
		}
	}
	class Timeline {
		#workflowId;
		// #taskId: number;
		#data;
		#isLoaded;
		#errors = [];
		#container;
		#biPopup;
		#dateFormat;
		#dateFormatShort;
		#efficiencyPopup;
		constructor(options, config) {
			this.#container = this.#renderContainer();
			setTimeout(() => {
				this.#textCrop();
			}, 500);
			if (main_core.Type.isPlainObject(options)) {
				this.#workflowId = options.workflowId;
				// this.#taskId = options.taskId;
				this.#isLoaded = false;
				this.#loadTimeline();
			}
			if (main_core.Type.isPlainObject(config)) {
				this.#dateFormat = `${config.dateFormat || 'j F Y'} ${config.timeFormat || 'H:i'}`;
				this.#dateFormatShort = `${config.dateFormatShort || 'j F'} ${config.timeFormat || 'H:i'}`;
			}
		}
		static open(options) {
			main_core.Runtime.loadExtension('sidepanel').then(() => {
				BX.SidePanel.Instance.open(main_core.Uri.addParam('/bitrix/components/bitrix/bizproc.workflow.timeline.slider/index.php', main_core.Type.isPlainObject(options) ? options : {}), {
					width: 950,
					allowChangeHistory: false,
					cacheable: false,
					loader: '/bitrix/js/bizproc/workflow/timeline/img/skeleton.svg',
					printable: true,
					events: {
						onOpenComplete: event => {
							event.getSlider()?.focus();
						}
					}
				});
			}).catch(response => console.error(response.errors));
		}
		#loadTimeline() {
			main_core.ajax.runAction('bizproc.workflow.getTimeline', {
				data: {
					workflowId: this.#workflowId
				}
			}).then(response => {
				this.#setDataFromResponse(response);
				this.#isLoaded = true;
				this.render();
			}).catch(response => {
				this.#setDataFromResponse(response);
				this.#isLoaded = true;
				this.render();
			});
		}
		#setDataFromResponse(response) {
			if (main_core.Type.isPlainObject(response)) {
				const getString = (value, defaultValue = '') => main_core.Type.isString(value) ? value : defaultValue;
				const getArray = (value, defaultValue = []) => main_core.Type.isArray(value) ? value : defaultValue;
				const getBool = (value, defaultValue = false) => main_core.Type.isBoolean(value) ? value : defaultValue;
				const getInteger = (value, defaultValue = 0) => main_core.Type.isInteger(value) ? value : defaultValue;
				if (main_core.Type.isPlainObject(response.data)) {
					this.#data = {
						document: new bizproc_document.DocumentId({
							documentId: getArray(response.data.documentType),
							entityName: getString(response.data.entityName),
							documentName: getString(response.data.documentName),
							documentUrl: getString(response.data.documentUrl),
							moduleName: getString(response.data.moduleName)
						}),
						isWorkflowRunning: getBool(response.data.isWorkflowRunning),
						timeToStart: getInteger(response.data.timeToStart, null),
						executionTime: getInteger(response.data.executionTime, null),
						started: getInteger(response.data.started, null),
						startedBy: getInteger(response.data.startedBy),
						tasks: getArray(response.data.tasks).map(taskData => new TimelineTask(taskData)),
						users: new Map(),
						stats: {
							averageDuration: getInteger(response.data.stats.averageDuration, null),
							efficiency: getString(response.data.stats.efficiency)
						},
						biMenu: getArray(response.data.biMenu, null),
						isBiBuilderDisabled: getBool(response.data.isBiBuilderDisabled, false)
					};
					for (const user of getArray(response.data.users)) {
						this.#data.users.set(main_core.Text.toInteger(user.id), user);
					}
				}
				this.#errors = getArray(response.errors);
			}
		}
		render() {
			main_core.Dom.clean(this.#container);
			if (this.#hasErrors()) {
				const errorsView = new ErrorsView({
					errors: this.#errors
				});
				errorsView.renderTo(this.#container);
				return this.#container;
			}
			if (!this.#isLoaded) {
				main_core.Dom.append(this.#renderLoadingStub(), this.#container);
			}
			if (main_core.Type.isPlainObject(this.#data)) {
				main_core.Dom.replace(this.#container, this.#renderContainer());
				this.#createEfficiencyPopup().show();
				if (this.#data.biMenu) {
					this.showBiMenus(this.#data.biMenu);
				}
			}
			return this.#container;
		}
		#renderItemTitle(title, iconClass, iconText, crop) {
			const iconClassValue = main_core.Type.isString(iconClass) ? ` ${iconClass}` : '';
			const iconTextValue = main_core.Type.isString(iconText) ? iconText : '';
			const cropValue = crop ? ' data-crop="crop"' : '';
			return main_core.Tag.render`
			<div>
				<span class="bizproc-workflow-timeline-icon${iconClassValue}">${iconTextValue}</span>
				<div class="bizproc-workflow-timeline-title"${cropValue}>${main_core.Text.encode(title)}</div>
			</div>
		`;
		}
		#renderSubject(subject) {
			return main_core.Tag.render`
			<div class="bizproc-workflow-timeline-subject">${main_core.Text.encode(subject)}</div>
		`;
		}
		#renderProceedTaskButton(task) {
			const uri = task.url || new main_core.Uri(`/company/personal/bizproc/${task.id}/`).toString();
			return main_core.Tag.render`
			<div class="task-button --hidden">
				<a class="ui-btn ui-btn-xs ui-btn-primary ui-btn-round" href="${main_core.Text.encode(uri)}">
					${main_core.Loc.getMessage('BIZPROC_WORKFLOW_TIMELINE_SLIDER_BUTTON_PROCEED')}
				</a>
			</div>
		`;
		}
		#renderUser(userId, userData = null, task = null) {
			const user = this.#data.users.get(userId || userData.id);
			let userClass = '';
			let isWaiting = false;
			if (userData) {
				const status = new bizproc_task.TaskStatus(userData.status);
				if (status.isYes() || status.isOk()) {
					userClass = ' --voted-up';
				}
				if (status.isNo()) {
					userClass = ' --voted-down';
				}
				if (status.isWaiting()) {
					isWaiting = true;
				}
			}
			const position = main_core.Type.isString(user.workPosition) ? `<div class="bizproc-workflow-timeline-user-pos">${main_core.Text.encode(user.workPosition)}</div>` : '';
			let avatar = '<i></i>';
			if (main_core.Type.isString(user.avatarSize100)) {
				avatar = `<i style="background-image: url('${encodeURI(user.avatarSize100)}')"></i>`;
			}
			const button = task?.id && isWaiting ? this.#renderProceedTaskButton(task) : '';
			return main_core.Tag.render`
			<div class="bizproc-workflow-timeline-user${userClass}">
				<div class="bizproc-workflow-timeline-userlogo ui-icon ui-icon-common-user">
					${avatar}
				</div>
				<div class="bizproc-workflow-timeline-user-block">
					<a class="bizproc-workflow-timeline-link" href="${user.link}">${main_core.Text.encode(user.fullName)}</a>
					${position}
				</div>
				${button}
			</div>
		`;
		}
		#renderDoc(name, link, type, iconClass) {
			return main_core.Tag.render`
			<div class="bizproc-workflow-timeline-doc">
				${this.#renderCaption(main_core.Loc.getMessage('BIZPROC_WORKFLOW_TIMELINE_SLIDER_START_DOC'))}
				<div class="bizproc-workflow-timeline-type">
					<span class="ui-icon-set ${iconClass}"></span>
					<span class="bizproc-workflow-timeline-type-text">${type}</span>
				</div>
				<a class="bizproc-workflow-timeline-link" href="${link}" target="_top">${main_core.Text.encode(name)}</a>
			</div>
		`;
		}
		#renderCaption(caption) {
			return main_core.Tag.render`
			<div class="bizproc-workflow-timeline-caption">${caption}</div>
		`;
		}
		#renderNotice(subject, text) {
			return main_core.Tag.render`
			<div class="bizproc-workflow-timeline-notice">
				<div class="bizproc-workflow-timeline-subject">${main_core.Text.encode(subject)}</div>
				<span class="bizproc-workflow-timeline-text">${main_core.Text.encode(text)}</span>
			</div>
		`;
		}
		#renderStatus(text, statusClass) {
			const statusClassValue = main_core.Type.isString(statusClass) ? ` ${statusClass}` : '';
			return main_core.Tag.render`
			<div class="bizproc-workflow-timeline-status${statusClassValue}">${main_core.Text.encode(text)}</div>
		`;
		}
		#renderMore() {
			return main_core.Tag.render`
			<div class="bizproc-workflow-timeline-item --more">
				<div class="bizproc-workflow-timeline-item-inner">
					<span class="bizproc-workflow-timeline-icon"></span>
					<button class="ui-btn ui-btn-light-border ui-btn-xs" type="button" onclick="expandMore(event)">
						<span class="ui-btn-text">
							${main_core.Loc.getMessage('BIZPROC_WORKFLOW_TIMELINE_SLIDER_MORE_TASKS')}
						</span>
					</button>
					<script type="text/javascript">
						function expandMore(event)
						{
							const moreItemBlock = event.target.closest('.--more');
							const hiddenBlocks = document.querySelectorAll('.bizproc-workflow-timeline-item.--hidden:not(.--efficiency)');
							BX.Dom.addClass(moreItemBlock, '--hidden');
							hiddenBlocks.forEach((hiddenBlock) => BX.Dom.removeClass(hiddenBlock, '--hidden'));
						}
					</script>
				</div>
			</div>
		`;
		}
		#renderContent(children) {
			return main_core.Tag.render`
			<div class="bizproc-workflow-timeline-content">
				${children}
			</div>
		`;
		}
		#renderItem(children, itemClass, efficiencyClass) {
			const itemClassValue = main_core.Type.isString(itemClass) ? ` ${itemClass}` : '';
			const efficiencyClassValue = main_core.Type.isString(efficiencyClass) ? ` data-efficiency-class="${efficiencyClass}"` : '';
			return main_core.Tag.render`
			<div class="bizproc-workflow-timeline-item${itemClassValue}"${efficiencyClassValue}>
				<div class="bizproc-workflow-timeline-item-inner">
					${children}
				</div>
			</div>
		`;
		}
		#renderItemsList(items) {
			return main_core.Tag.render`
			<div class="bizproc-workflow-timeline-wrapper">
				<div class="bizproc-workflow-timeline-inner">
					<div class="bizproc-workflow-timeline-list">
						${items}
					</div>
					<script type="text/javascript">
						(function() {
							const buttons = document.querySelectorAll('.task-button.--hidden');
							const showButtons = buttons.length > 1;
							buttons.forEach(function (button) {
								BX.Dom.insertBefore(
									button.closest('.bizproc-workflow-timeline-user'),
									button.closest('.bizproc-workflow-timeline-user-list').firstChild
								);
								if (showButtons)
								{
									BX.Dom.removeClass(button, '--hidden')
								}
							});
						})();
					</script>
				</div>
			</div>
		`;
		}
		#renderFirstBlock() {
			const content = [];
			if (this.#data.startedBy) {
				content.push(this.#renderCaption(main_core.Loc.getMessage('BIZPROC_WORKFLOW_TIMELINE_SLIDER_FROM')), this.#renderUser(this.#data.startedBy));
			}
			content.push(this.#renderDoc(this.#data.document.name, this.#data.document.url, this.#data.document.moduleName, '--file-2'));
			if (!main_core.Type.isNil(this.#data.timeToStart)) {
				content.push(this.#renderNotice(main_core.Loc.getMessage('BIZPROC_WORKFLOW_TIMELINE_SLIDER_EXECUTION_TIME'), DurationFormatter.formatTimeInterval(this.#data.timeToStart, 2)));
			}
			return this.#renderItem([this.#renderItemTitle(this.#data.document.entityName, '--success', '1'), this.#data.started && this.#renderSubject(DurationFormatter.formatDate(this.#data.started, this.#dateFormat, this.#dateFormatShort)), this.#renderContent(content)], '--selected');
		}
		#renderContainer() {
			const items = [];
			let efficiencyClass = '';
			let isWaiting = false;
			if (this.#data) {
				let task = null;
				items.push(this.#renderFirstBlock());
				let taskNumber = 1;
				let hasHidden = this.#data.tasks[0] ? !this.#data.tasks[0].status.isWaiting() : true;
				for (const taskIndex of Object.keys(this.#data.tasks)) {
					task = this.#data.tasks[taskIndex];
					isWaiting = task.status.isWaiting();
					if (!isWaiting) {
						++taskNumber;
					}
					const taskView = new TimelineTaskView({
						task,
						userId: main_core.Text.toInteger(main_core.Loc.getMessage('USER_ID')),
						dateFormat: this.#dateFormat,
						dateFormatShort: this.#dateFormatShort,
						taskNumber: isWaiting ? null : taskNumber,
						users: this.#data.users
					});
					const node = taskView.render();
					if (!isWaiting && hasHidden) {
						main_core.Dom.addClass(node, '--hidden');
					}
					if (isWaiting && hasHidden) {
						items.push(this.#renderMore());
						hasHidden = false;
					}
					items.push(node);
				}
				if (hasHidden && this.#data.tasks[0]) {
					items.push(this.#renderMore());
				}
				if (this.#data.isWorkflowRunning) {
					if (isWaiting) {
						items.push(this.#renderItem([this.#renderItemTitle(main_core.Loc.getMessage('BIZPROC_WORKFLOW_TIMELINE_SLIDER_IN_PROGRESS')), this.#renderSubject(main_core.Loc.getMessage('BIZPROC_WORKFLOW_TIMELINE_SLIDER_IN_PROGRESS_TIP'))], '--tech --previous-item'));
					} else {
						items.push(this.#renderItem([this.#renderItemTitle(main_core.Loc.getMessage('BIZPROC_WORKFLOW_TIMELINE_SLIDER_IN_PROGRESS_INTERMEDIATE')), this.#renderSubject(main_core.Loc.getMessage('BIZPROC_WORKFLOW_TIMELINE_SLIDER_IN_PROGRESS_INTERMEDIATE_TIP'))], '--tech --previous-item'));
					}
				} else {
					const isOk = !task || task.status.isOk() || task.status.isYes();
					const content = [this.#renderCaption(main_core.Loc.getMessage('BIZPROC_WORKFLOW_TIMELINE_SLIDER_PROCESS_FINISHED'))];
					if (this.#data.startedBy) {
						content.push(isOk ? this.#renderStatus(main_core.Loc.getMessage('BIZPROC_WORKFLOW_TIMELINE_SLIDER_APPROVED_FOR')) : this.#renderStatus(main_core.Loc.getMessage('BIZPROC_WORKFLOW_TIMELINE_SLIDER_DECLINED'), '--failure'), this.#renderUser(this.#data.startedBy));
					}
					content.push(this.#renderNotice(main_core.Loc.getMessage('BIZPROC_WORKFLOW_TIMELINE_SLIDER_PROCESS_EXECUTED'), DurationFormatter.formatTimeInterval(this.#data.executionTime)));
					efficiencyClass = isOk ? '--success' : '--declined';
					items.push(this.#renderItem([this.#renderItemTitle(this.#data.document.entityName, isOk ? '--success' : null), this.#data.started && this.#renderSubject(DurationFormatter.formatDate(this.#data.started + this.#data.executionTime, this.#dateFormat, this.#dateFormatShort)), this.#renderContent(content)], isOk ? '--success --previous' : '--declined --selected --previous', efficiencyClass), this.#renderEfficiencyInlineContent());
				}
			}
			return this.#renderItemsList(items);
		}
		#textCrop() {
			const textCropNodes = document.querySelectorAll('[data-crop="crop"]');
			for (const textCropNode of textCropNodes) {
				const text = new ui_textcrop.TextCrop({
					rows: 2,
					target: textCropNode
				});
				text.init();
			}
		}
		#createEfficiencyPopup() {
			this.#efficiencyPopup = new main_popup.Popup({
				width: 403,
				minHeight: 345,
				closeIcon: true,
				closeByEsc: true,
				content: this.#renderEfficiencyPopupContent(),
				bindElement: {
					left: 555,
					top: 130
				},
				padding: 26,
				borderRadius: '18px',
				className: '--bizproc-timeline-popup',
				events: {
					onPopupClose: () => {
						let inlineEfficiencyPrev = document.querySelector('.--previous-item');
						if (!inlineEfficiencyPrev) {
							inlineEfficiencyPrev = document.querySelector('.bizproc-workflow-timeline-item.--processing');
						}
						if (!inlineEfficiencyPrev) {
							return;
						}
						BX.Dom.addClass(inlineEfficiencyPrev, '--previous');
						let efficiencyInlineClass = inlineEfficiencyPrev.getAttribute('data-efficiency-class');
						if (!efficiencyInlineClass) {
							efficiencyInlineClass = '';
						}
						inlineEfficiencyPrev.after(this.#renderEfficiencyInlineContent(efficiencyInlineClass));
					}
				}
			});
			main_core.Dom.attr(this.#efficiencyPopup.getPopupContainer(), 'aria-label', main_core.Loc.getMessage('BIZPROC_WORKFLOW_TIMELINE_SLIDER_EFFECTIVITY_MARK'));
			return this.#efficiencyPopup;
		}
		#getEfficiencyData() {
			let logoClass = '--first';
			let notice = main_core.Loc.getMessage('BIZPROC_WORKFLOW_TIMELINE_SLIDER_NO_STATS');
			switch (this.#data.stats.efficiency) {
				case 'fast':
					logoClass = '--fast';
					notice = main_core.Loc.getMessage('BIZPROC_WORKFLOW_TIMELINE_SLIDER_PERFORMED_QUICKLY');
					break;
				case 'slow':
					logoClass = '--slow';
					notice = main_core.Loc.getMessage('BIZPROC_WORKFLOW_TIMELINE_SLIDER_PERFORMED_SLOWLY');
					break;
				case 'stopped':
					logoClass = '--stopped';
					notice = main_core.Loc.getMessage('BIZPROC_WORKFLOW_TIMELINE_SLIDER_PERFORMED_NO_PROGRESS');
					break;
			}
			return [logoClass, notice];
		}
		#renderEfficiencyInlineContent(itemClass) {
			const [logoClass, notice] = this.#getEfficiencyData();
			const efficiencyInlineContent = main_core.Tag.render`
			<div class="bizproc-workflow-timeline-item --efficiency ${itemClass}">
				<div class="bizproc-workflow-timeline-item-inner">
					<div class="bizproc-workflow-timeline-title">
						${main_core.Loc.getMessage('BIZPROC_WORKFLOW_TIMELINE_SLIDER_EFFECTIVITY_MARK')}
					</div>
					<div class="bizproc-workflow-timeline-content">
						<div class="bizproc-workflow-timeline-eff-icon ${logoClass}"></div>
						<div class="bizproc-workflow-timeline-content-inner">
							<div class="bizproc-workflow-timeline-caption">${notice}</div>
							<div class="bizproc-workflow-timeline-notice">
								<div class="bizproc-workflow-timeline-subject">
									${main_core.Loc.getMessage('BIZPROC_WORKFLOW_TIMELINE_SLIDER_CURRENT_PROCESS_TIME')}
								</div>
								<span class="bizproc-workflow-timeline-text">
									${DurationFormatter.formatTimeInterval(this.#data.executionTime)}
								</span>
								<span
									data-hint="${main_core.Loc.getMessage('BIZPROC_WORKFLOW_TIMELINE_SLIDER_TIME_DIFFERENCE_MSGVER_1')}"
								></span>
							</div>
							<div class="bizproc-workflow-timeline-notice">
								<div class="bizproc-workflow-timeline-subject">
									${main_core.Loc.getMessage('BIZPROC_WORKFLOW_TIMELINE_SLIDER_AVERAGE_PROCESS_TIME')}
								</div>
								<span class="bizproc-workflow-timeline-text">
									${this.#data.stats.averageDuration === null ? main_core.Loc.getMessage('BIZPROC_WORKFLOW_TIMELINE_SLIDER_AVERAGE_PROCESS_TIME_UNKNOWN') : DurationFormatter.formatTimeInterval(this.#data.stats.averageDuration)}
								</span>
							</div>
						</div>
					</div>
				</div>	
			</div>
		`;
			BX.UI.Hint.init(efficiencyInlineContent);
			return efficiencyInlineContent;
		}
		#renderEfficiencyPopupContent() {
			const [logoClass, notice] = this.#getEfficiencyData();
			const popup = main_core.Tag.render`
			<div class="bizproc-timeline-popup">
				<div class="bizproc-timeline-popup-title">
					${main_core.Loc.getMessage('BIZPROC_WORKFLOW_TIMELINE_SLIDER_EFFECTIVITY_MARK')}
				</div>
				<div class="bizproc-timeline-popup-main">
					<div class="bizproc-timeline-popup-status">
						<div class="bizproc-timeline-popup-logo ${logoClass}"></div>
						<div class="bizproc-timeline-popup-notice">${notice}</div>
					</div>
					<div class="bizproc-timeline-popup-content">
						<div class="bizproc-timeline-popup-block">
							<span class="bizproc-timeline-popup-val">
								${DurationFormatter.formatTimeInterval(this.#data.executionTime)}
							</span>
							<span
								data-hint="${main_core.Loc.getMessage('BIZPROC_WORKFLOW_TIMELINE_SLIDER_TIME_DIFFERENCE_MSGVER_1')}"
							></span>
							<div class="bizproc-timeline-popup-prop">
								${main_core.Loc.getMessage('BIZPROC_WORKFLOW_TIMELINE_SLIDER_CURRENT_PROCESS_TIME')}
							</div>
						</div>
						<div class="bizproc-timeline-popup-block">
							<span class="bizproc-timeline-popup-val">
								${DurationFormatter.formatTimeInterval(this.#data.stats.averageDuration)}
							</span>
							<div class="bizproc-timeline-popup-prop">
								${main_core.Loc.getMessage('BIZPROC_WORKFLOW_TIMELINE_SLIDER_AVERAGE_PROCESS_TIME')}
							</div>
						</div>
					</div>
				</div>
				<div class="bizproc-timeline-popup-footer">
					<p class="bizproc-timeline-popup-text">
						${main_core.Loc.getMessage('BIZPROC_WORKFLOW_TIMELINE_SLIDER_PERFORMANCE_TUNING_TIP')}
					</p>
					<a class="bizproc-timeline-popup-text" href="javascript:top.BX.Helper.show('redirect=detail&code=18783714')">
						${main_core.Loc.getMessage('BIZPROC_WORKFLOW_TIMELINE_SLIDER_PERFORMANCE_TUNING_LINK')}
					</a>
				</div>
			</div>
		`;
			BX.UI.Hint.init(popup);
			return popup;
		}
		showBiMenus(menu) {
			this.#createBiButton(menu);
			this.#createBiPopup(menu).show();
		}
		#createBiButton(menu) {
			const toolbarNode = document.querySelector('[data-role="page-toolbar"]');
			if (!toolbarNode) {
				return;
			}
			if (menu.length === 1) {
				const linkBtn = main_core.Tag.render`
				<a class="ui-btn ui-btn-light-border ui-btn-themes" target="_blank">
					${main_core.Text.encode(main_core.Loc.getMessage('BIZPROC_WORKFLOW_TIMELINE_SLIDER_BI_ANALYTICS_BUTTON'))}
				</a>
			`;
				main_core.Event.bind(linkBtn, 'click', () => {
					new Function(menu[0].ON_CLICK)();
				});
				main_core.Dom.prepend(linkBtn, toolbarNode);
				return;
			}
			const clickHandler = this.#showBiMenu.bind(this, menu);
			const dropBtn = main_core.Tag.render`
			<button class="ui-btn ui-btn-light-border ui-btn-themes ui-btn-dropdown" onclick="${clickHandler}">
				${main_core.Text.encode(main_core.Loc.getMessage('BIZPROC_WORKFLOW_TIMELINE_SLIDER_BI_ANALYTICS_BUTTON'))}
			</button>
		`;
			main_core.Dom.prepend(dropBtn, toolbarNode);
		}
		#createBiPopup(menu) {
			this.#biPopup = new main_popup.Popup({
				width: 403,
				minHeight: 183,
				closeIcon: true,
				closeByEsc: true,
				content: this.#renderBiPopupContent(menu),
				bindElement: {
					left: 555,
					top: this.#getBiMenuTopOffset()
				},
				padding: 17,
				borderRadius: '18px',
				className: '--bizproc-timeline-popup --bi'
			});
			main_core.Dom.attr(this.#biPopup.getPopupContainer(), 'aria-label', main_core.Loc.getMessage('BIZPROC_WORKFLOW_TIMELINE_SLIDER_BI_ANALYTICS_TITLE'));
			return this.#biPopup;
		}
		#getBiMenuTopOffset() {
			const containerHeight = this.#efficiencyPopup?.getPopupContainer()?.offsetHeight;
			const topOffset = this.#efficiencyPopup?.bindElementPos?.top;
			if (containerHeight && topOffset) {
				return containerHeight + topOffset + 20;
			}
			return 522;
		}
		#showBiMenu(menu, event) {
			new main_popup.Menu({
				bindElement: event.target,
				items: menu.map(item => {
					return {
						text: item.TEXT,
						onclick: item.ON_CLICK
					};
				})
			}).show();
		}
		#renderBiPopupContent(menu) {
			const btn = this.#getBiPopupButton(menu);
			return main_core.Tag.render`
			<div class="bizproc-timeline-popup">
				<div class="bizproc-timeline-popup-title">${main_core.Loc.getMessage('BIZPROC_WORKFLOW_TIMELINE_SLIDER_BI_ANALYTICS_TITLE')}</div>
				<p class="bizproc-timeline-popup-info">${main_core.Loc.getMessage('BIZPROC_WORKFLOW_TIMELINE_SLIDER_BI_ANALYTICS_TIP')}</p>
				${btn}
			</div>
		`;
		}
		#getBiPopupButton(menu) {
			let btn = null;
			if (this.#data.isBiBuilderDisabled) {
				const clickHandler = () => top.BX.UI.InfoHelper.show('limit_crm_BI_constructor');
				btn = main_core.Tag.render`
				<button type="button" class="ui-btn ui-btn-light-border ui-btn-round ui-btn-xs ui-btn-icon-lock ui-icon-set__scope --with-left-icon" onclick="${clickHandler}">
					<span class="ui-btn-text">${main_core.Loc.getMessage('BIZPROC_WORKFLOW_TIMELINE_SLIDER_BI_ANALYTICS_LINK')}</span>
				</button>
			`;
				return btn;
			}
			if (menu.length === 1) {
				btn = main_core.Tag.render`
				<button type="button" class="ui-btn ui-btn-light-border ui-btn-round ui-btn-xs">
					<span class="ui-btn-text">${main_core.Loc.getMessage('BIZPROC_WORKFLOW_TIMELINE_SLIDER_BI_ANALYTICS_LINK')}</span>
				</button>
			`;
				main_core.Event.bind(btn, 'click', () => {
					new Function(menu[0].ON_CLICK)();
				});
			} else {
				const clickHandler = this.#showBiMenu.bind(this, menu);
				btn = main_core.Tag.render`
				<button
					type="button"
					class="ui-btn ui-btn-light-border ui-btn-round ui-btn-xs ui-btn-dropdown"
					onclick="${clickHandler}"
				>
					<span class="ui-btn-text">${main_core.Loc.getMessage('BIZPROC_WORKFLOW_TIMELINE_SLIDER_BI_ANALYTICS_LINK')}</span>
				</button>
			`;
			}
			return btn;
		}
		#renderLoadingStub() {
			return main_core.Tag.render`
			<img src="/bitrix/js/bizproc/workflow/timeline/img/skeleton.svg"
				 style="width:100%; margin: 0; padding: 0;"/>
		`;
		}
		#hasErrors() {
			return this.#errors.length > 0;
		}
	}

	exports.DurationFormatter = DurationFormatter;
	exports.Timeline = Timeline;

})(this.BX.Bizproc.Workflow = this.BX.Bizproc.Workflow || {}, BX, BX.Bizproc, BX.Bizproc, BX, BX.UI, BX.UI, BX.Main, BX.Bizproc, BX.Main);
//# sourceMappingURL=timeline.bundle.js.map
