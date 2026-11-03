/* eslint-disable */
this.BX = this.BX || {};
this.BX.Tasks = this.BX.Tasks || {};
(function (exports, main_core, main_core_events, ui_dialogs_messagebox, ui_navigationpanel, main_loader, main_popup, ui_analytics, ui_shortView, disk_diskPicker, main_polyfill_intersectionobserver, ui_entitySelector, ui_hint, ui_draganddrop_draggable, pull_client, ui_buttons) {
	'use strict';

	class SidePanel extends main_core_events.EventEmitter {
		constructor() {
			super();
			this.setEventNamespace('BX.Tasks.Scrum.SidePanel');

			/* eslint-disable */
			this.sidePanelManager = BX.SidePanel.Instance;
			/* eslint-enable */

			this.bindEvents();
		}
		bindEvents() {
			main_core_events.EventEmitter.subscribe('SidePanel.Slider:onLoad', event => {
				const [sliderEvent] = event.getCompatData();
				const sidePanel = sliderEvent.getSlider();
				sidePanel.setCacheable(false);
				this.emit('onLoadSidePanel', sidePanel);
			});
			main_core_events.EventEmitter.subscribe('SidePanel.Slider:onClose', event => {
				const [sliderEvent] = event.getCompatData();
				const sidePanel = sliderEvent.getSlider();
				this.emit('onCloseSidePanel', sidePanel);
			});
		}
		isPreviousSidePanelExist(currentSidePanel) {
			return Boolean(this.sidePanelManager.getPreviousSlider(currentSidePanel));
		}
		getTopSidePanel() {
			const topSidePanel = this.sidePanelManager.getTopSlider();
			return topSidePanel ? topSidePanel : null;
		}
		reloadTopSidePanel() {
			if (this.sidePanelManager.getTopSlider()) {
				this.sidePanelManager.getTopSlider().reload();
			}
		}
		closeTopSidePanel() {
			if (this.sidePanelManager.getTopSlider()) {
				this.sidePanelManager.getTopSlider().close();
			}
		}
		reloadPreviousSidePanel(currentSidePanel) {
			const previousSidePanel = this.sidePanelManager.getPreviousSlider(currentSidePanel);
			previousSidePanel.reload();
		}
		openSidePanelByUrl(url) {
			this.sidePanelManager.open(url);
		}
		openSidePanel(id, options) {
			this.sidePanelManager.open(id, options);
		}
		showByExtension(name, params) {
			const extensionName = 'tasks.scrum.' + name.toLowerCase();
			return top.BX.Runtime.loadExtension(extensionName).then(exports => {
				name = name.replaceAll('-', '');
				if (exports && exports[name]) {
					const extension = new exports[name](params);
					extension.show();
					return extension;
				} else {
					return null;
				}
			});
		}
	}

	class RequestSender {
		constructor(options = {}) {
			this.signedParameters = options.signedParameters ? options.signedParameters : '';
			this.debugMode = options.debugMode;
		}
		getSignedParameters() {
			return this.signedParameters;
		}
		sendRequest(action, data = {}) {
			return new Promise((resolve, reject) => {
				main_core.ajax.runAction(action, {
					signedParameters: this.signedParameters,
					data: data
				}).then(resolve, reject);
			});
		}
		sendRequestToComponent(data = {}, action, analytics = {}) {
			data.debugMode = this.debugMode;
			const config = {
				mode: 'class',
				signedParameters: this.signedParameters,
				data: data
			};
			if (analytics && analytics.event) {
				config.analytics = analytics;
			}
			return new Promise((resolve, reject) => {
				main_core.ajax.runComponentAction('bitrix:tasks.scrum', action, config).then(resolve, reject);
			});
		}
		removeItems(data) {
			return this.sendRequestToComponent(data, 'removeItems');
		}
		updateItemSort(data) {
			return this.sendRequestToComponent(data, 'updateItemSort').then(response => {
				if (this.isPartialPlacementResponse(response)) {
					throw response;
				}
				return response;
			});
		}
		isPartialPlacementResponse(response) {
			return response?.data?.refreshRequired === true || main_core.Type.isArray(response?.errors) && response.errors.some(error => error.code === 'PARTIAL_PLACEMENT');
		}
		addTag(data) {
			return new Promise((resolve, reject) => {
				main_core.ajax.runComponentAction('bitrix:tasks.tag.list', 'addTag', {
					mode: 'class',
					data: data
				}).then(resolve, reject);
			});
		}
		updateSprintSort(data) {
			return this.sendRequestToComponent(data, 'updateSprintSort');
		}
		createSprint(data) {
			return this.sendRequestToComponent(data, 'createSprint');
		}
		startSprint(data) {
			return this.sendRequestToComponent(data, 'startSprint');
		}
		completeSprint(data) {
			return this.sendRequestToComponent(data, 'completeSprint');
		}
		createTask(data) {
			return this.sendRequestToComponent(data, 'createTask', {
				tool: 'tasks',
				category: 'task_operations',
				event: 'task_create',
				type: 'quick_task',
				c_section: 'scrum',
				c_element: 'quick_button'
			});
		}
		updateItem(data) {
			return this.sendRequestToComponent(data, 'updateItem');
		}
		changeTaskResponsible(data) {
			return this.sendRequestToComponent(data, 'changeTaskResponsible');
		}
		getCurrentState(data) {
			return this.sendRequestToComponent(data, 'getCurrentState');
		}
		hasTaskInFilter(data) {
			return this.sendRequestToComponent(data, 'hasTaskInFilter');
		}
		removeSprint(data) {
			return this.sendRequestToComponent(data, 'removeSprint');
		}
		changeSprintName(data) {
			return this.sendRequestToComponent(data, 'changeSprintName');
		}
		changeSprintDeadline(data) {
			return this.sendRequestToComponent(data, 'changeSprintDeadline');
		}
		getSprintCompletedItems(data) {
			return this.sendRequestToComponent(data, 'getSprintCompletedItems');
		}
		getCompletedSprints(data) {
			return this.sendRequestToComponent(data, 'getCompletedSprints');
		}
		getCompletedSprintsStats(data) {
			return this.sendRequestToComponent(data, 'getCompletedSprintsStats');
		}
		getItems(data) {
			return this.sendRequestToComponent(data, 'getItems');
		}
		saveShortView(data) {
			return this.sendRequestToComponent(data, 'saveShortView');
		}
		saveDisplayPriority(data) {
			return this.sendRequestToComponent(data, 'saveDisplayPriority');
		}
		getEntityCounters(data) {
			return this.sendRequestToComponent(data, 'getEntityCounters');
		}
		attachFilesToTask(data) {
			return this.sendRequestToComponent(data, 'attachFilesToTask');
		}
		updateTaskTags(data) {
			return this.sendRequestToComponent(data, 'updateTaskTags');
		}
		removeTaskTags(data) {
			return this.sendRequestToComponent(data, 'removeTaskTags');
		}
		updateItemEpics(data) {
			return this.sendRequestToComponent(data, 'updateItemEpics');
		}
		updateBorderColorToLinkedItems(data) {
			return this.sendRequestToComponent(data, 'updateBorderColorToLinkedItems');
		}
		applyFilter(data) {
			return this.sendRequestToComponent(data, 'applyFilter');
		}
		showLinkedTasks(data) {
			return this.sendRequestToComponent(data, 'showLinkedTasks');
		}
		getAllUsedItemBorderColors(data) {
			return this.sendRequestToComponent(data, 'getAllUsedItemBorderColors');
		}
		getSubTaskItems(data) {
			return this.sendRequestToComponent(data, 'getSubTaskItems');
		}
		createEpic(data) {
			return this.sendRequest('bitrix:tasks.scrum.epic.createEpic', data);
		}
		getEpic(data) {
			return this.sendRequest('bitrix:tasks.scrum.epic.getEpic', data);
		}
		getItemData(data) {
			return this.sendRequestToComponent(data, 'getItemData');
		}
		getSprintData(data) {
			return this.sendRequestToComponent(data, 'getSprintData');
		}
		saveSprintVisibility(data) {
			return this.sendRequestToComponent(data, 'saveSprintVisibility');
		}
		showErrorAlert(response, alertTitle) {
			if (main_core.Type.isUndefined(response.errors)) {
				return null;
			}
			if (response.errors.length) {
				const firstError = response.errors.shift();
				if (firstError) {
					const errorCode = firstError.code ? firstError.code : '';
					const message = firstError.message + ' ' + errorCode;
					const title = alertTitle ? alertTitle : main_core.Loc.getMessage('TASKS_SCRUM_ERROR_TITLE_POPUP');
					return ui_dialogs_messagebox.MessageBox.alert(message, title);
				}
			}
			return null;
		}
	}

	class Filter extends main_core_events.EventEmitter {
		constructor(params) {
			super(params);
			this.setEventNamespace('BX.Tasks.Scrum.Filter');
			this.filterId = params.filterId;
			this.requestSender = params.requestSender;
			this.searchFieldApplied = false;
			this.initUiFilterManager();
			this.bindHandlers();
		}
		initUiFilterManager() {
			/* eslint-disable */
			this.filterManager = BX.Main.filterManager.getById(this.filterId);
			/* eslint-enable */
		}
		bindHandlers() {
			main_core_events.EventEmitter.subscribe('BX.Main.Filter:apply', this.onApplyFilter.bind(this));
		}
		isSearchFieldApplied() {
			return this.searchFieldApplied;
		}
		getSearchContainer() {
			return this.filterManager.getSearch().getContainer();
		}
		getFilterManager() {
			return this.filterManager;
		}
		scrollToSearchContainer() {
			const filterSearchContainer = this.getSearchContainer();
			if (!this.isNodeInViewport(filterSearchContainer)) {
				filterSearchContainer.scrollIntoView(true);
			}
		}
		onApplyFilter(event) {
			const [filterId, values, filterInstance, promise, params] = event.getCompatData();
			if (filterInstance.getSearch().getSearchString()) {
				this.searchFieldApplied = true;
			} else {
				this.searchFieldApplied = false;
			}
			if (this.filterId !== filterId) {
				return;
			}
			params.autoResolve = true;
			this.emit('applyFilter', {
				promise: promise
			});
		}
		addItemToListTypeField(name, item) {
			//todo set item to list after epic crud actions

			const fieldInstances = this.filterManager.getField(name);
			const fieldOptions = this.filterManager.getFieldByName(name);
			if (!fieldInstances || !fieldOptions) {
				return;
			}
			const found = fieldInstances.options.ITEMS.find(listItem => listItem.NAME === item.NAME);
			if (!main_core.Type.isUndefined(found)) {
				return;
			}
			fieldInstances.options.ITEMS.push(item);
			fieldOptions.ITEMS.push(item);
			const itemsNode = fieldInstances.node.querySelector('[data-name=' + name + ']');
			const items = main_core.Dom.attr(itemsNode, 'data-items');
			items.push(item);
			main_core.Dom.attr(itemsNode, 'data-items', items);
		}
		setValueToField(value) {
			this.filterManager.getApi().extendFilter({
				[value.name]: value.value
			});
		}
		setValuesToField(values) {
			this.filterManager.getApi().extendFilter(values.reduce((res, value) => ({
				...res,
				[value.name]: value.value
			}), {}));
		}
		getValueFromField(value) {
			const filterFieldsValues = this.filterManager.getFilterFieldsValues();
			return filterFieldsValues[value.name];
		}
		resetFilter() {
			this.filterManager.resetFilter();
		}
		applyFilter() {
			this.filterManager.applyFilter();
		}
		isNodeInViewport(element) {
			const rect = element.getBoundingClientRect();
			return rect.top >= 0 && rect.left >= 0 && rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) && rect.right <= (window.innerWidth || document.documentElement.clientWidth);
		}
	}

	class Tabs extends ui_navigationpanel.NavigationPanel {
		constructor(params) {
			params.views.forEach(view => {
				if (main_core.Type.isStringFilled(view.url)) {
					view.events = {
						click: () => this.openUrl()
					};
				}
			});
			super({
				target: params.target,
				items: params.views
			});
			this.sidePanel = params.sidePanel;
		}
		openUrl() {
			const topSidePanel = this.sidePanel.getTopSidePanel();
			if (topSidePanel !== null) {
				topSidePanel.showLoader();
			}
		}
	}

	class View extends main_core_events.EventEmitter {
		constructor(params) {
			super(params);
			this.setEventNamespace('BX.Tasks.Scrum.View');
			this.isOwnerCurrentUser = params.isOwnerCurrentUser === 'Y';
			this.target = params.target;
			this.loadItemsRepeatCounter = new Map();
			this.sidePanel = new SidePanel();
			this.requestSender = new RequestSender({
				signedParameters: params.signedParameters,
				debugMode: params.debugMode
			});
			this.filter = new Filter({
				filterId: params.filterId,
				scrumManager: this,
				requestSender: this.requestSender
			});
			this.filter.subscribe('applyFilter', this.onApplyFilter.bind(this));
			this.userId = parseInt(params.userId, 10);
			this.groupId = parseInt(params.groupId, 10);
			this.pathToTask = main_core.Type.isString(params.pathToTask) ? params.pathToTask : '';
		}
		onApplyFilter(baseEvent) {
			this.loadItemsRepeatCounter.clear();
		}
		renderTo(container) {
			if (!main_core.Type.isDomNode(container)) {
				throw new Error('Scrum: HTMLElement for scrum not found');
			}
		}
		renderTabsTo(container) {
			if (!main_core.Type.isDomNode(container)) {
				throw new Error('Scrum: HTMLElement for tabs not found');
			}
			new Tabs({
				sidePanel: this.sidePanel,
				views: this.views,
				target: this.target
			}).init();
		}
		renderSprintStatsTo(container) {
			if (!main_core.Type.isDomNode(container)) {
				throw new Error('Scrum: HTMLElement for Sprint stats not found');
			}
		}
		renderRightElementsTo(container) {
			if (!main_core.Type.isDomNode(container)) {
				throw new Error('Scrum: HTMLElement for buttons not found');
			}
		}
		setDisplayPriority(value) {
			const availableValues = new Set(['backlog', 'sprint']);
			if (!availableValues.has(value)) {
				throw new Error('Invalid parameter to set display priority');
			}
		}
		changeShortView(isShortView) {
			const availableValues = new Set(['Y', 'N']);
			if (!availableValues.has(isShortView)) {
				throw new Error('Invalid parameter to set short view');
			}
		}
		getCurrentUserId() {
			return this.userId;
		}
		getCurrentGroupId() {
			return this.groupId;
		}
		getPathToTask() {
			return this.pathToTask;
		}
	}

	class DiskManager extends main_core_events.EventEmitter {
		constructor(params) {
			super(params);
			this.setEventNamespace('BX.Tasks.Scrum.DiskManager');
			this.targetElement = params.targetElement;
			this.diskUrls = {
				urlSelect: '/bitrix/tools/disk/uf.php?action=selectFile&SITE_ID=' + main_core.Loc.getMessage('SITE_ID'),
				urlRenameFile: '/bitrix/tools/disk/uf.php?action=renameFile',
				urlDeleteFile: '/bitrix/tools/disk/uf.php?action=deleteFile',
				urlUpload: '/bitrix/tools/disk/uf.php?action=uploadFile&ncc=1'
			};
			this.onFinishDebounce = main_core.Runtime.debounce(attachedIds => {
				this.attachedIds = [];
				this.emit('onFinish', attachedIds);
			}, 500);
			this.attachedIds = [];
			this.diskPickerContainer = null;
			this.diskPicker = null;
		}
		showAttachmentMenu(node) {
			const controlId = main_core.Text.getRandom();
			this.popup = new main_popup.Popup(`disk-manager-attachment-menu-${main_core.Text.getRandom()}`, node, {
				content: this.getAttachmentsLoaderContent(controlId),
				autoHide: false,
				closeByEsc: true,
				angle: false,
				offsetTop: 12,
				offsetLeft: -32
			});
			this.popup.subscribe('onShow', () => {
				const uploadMenu = BX.Disk.UF.add({
					UID: controlId,
					controlName: `[${controlId}][]`,
					hideSelectDialog: false,
					urlSelect: this.diskUrls.urlSelect,
					urlRenameFile: this.diskUrls.urlRenameFile,
					urlDeleteFile: this.diskUrls.urlDeleteFile,
					urlUpload: this.diskUrls.urlUpload
				});
				const filesChooser = this.popup.contentContainer.querySelector('#files_chooser');

				/* eslint-disable */
				BX.onCustomEvent(filesChooser, 'DiskLoadFormController', ['show']);
				/* eslint-enable */

				if (disk_diskPicker.DiskPicker.isEnabled()) {
					const diskSelector = filesChooser.querySelector('.diskuf-selector-link');
					if (diskSelector && uploadMenu) {
						this.bindDiskPicker(diskSelector, uploadMenu.getUploader());
					}
				} else if (BX.DiskFileDialog) {
					main_core_events.EventEmitter.subscribe(BX.DiskFileDialog, 'loadItemsDone', this.openDiskFileDialog.bind(this));
				}
			});
			main_core_events.EventEmitter.subscribe('onFinish', () => this.popup.close());
			this.popup.show();
		}
		closeAttachmentMenu() {
			if (this.popup) {
				this.popup.close();
			}
		}
		isClickInside(event) {
			if (this.diskPicker && this.diskPicker.containsEvent(event)) {
				return true;
			}
			const node = event.target;
			if (!main_core.Type.isDomNode(node)) {
				return false;
			}
			let isClickInside = false;
			if (this.targetElement.contains(node)) {
				isClickInside = true;
			}
			if (this.popup && this.popup.getPopupContainer().contains(node)) {
				isClickInside = true;
			}
			if (this.diskPickerContainer && this.diskPickerContainer.contains(node)) {
				isClickInside = true;
			}
			if (BX.DiskFileDialog && BX.DiskFileDialog.popupWindow !== null && BX.DiskFileDialog.popupWindow.getPopupContainer().contains(node)) {
				isClickInside = true;
			}
			return isClickInside;
		}
		openDiskFileDialog() {
			if (BX.DiskFileDialog.popupWindow !== null) {
				BX.DiskFileDialog.popupWindow.subscribe('onClose', () => this.popup.close());
			}
		}
		bindDiskPicker(diskSelector, uploader) {
			main_core.Event.bind(diskSelector, 'click', event => {
				event.stopPropagation();
				this.openDiskPicker(uploader);
			});
		}
		openDiskPicker(uploader) {
			const picker = this.createDiskPicker();
			this.diskPicker = picker;
			picker.open({
				selectionMode: 'multiple',
				onOpen: ({
					container
				}) => {
					this.diskPickerContainer = container;
				},
				onSelect: ({
					items
				}) => {
					items.forEach(({
						objectId,
						name
					}) => {
						uploader.addFile(`n${objectId}`, {
							name,
							preload: true
						});
					});
				},
				onClose: () => {
					this.diskPicker = null;
					this.diskPickerContainer = null;
					this.popup.close();
				}
			});
		}
		createDiskPicker() {
			return new disk_diskPicker.DiskPicker();
		}
		getAttachmentsLoaderContent(controlId) {
			const filesChooser = main_core.Tag.render`
			<div id="files_chooser">
			<div id="diskuf-selectdialog-${controlId}" class="diskuf-files-entity diskuf-selectdialog bx-disk">
				<div class="diskuf-files-block">
					<div class="diskuf-placeholder">
						<table class="files-list">
							<tbody class="diskuf-placeholder-tbody"></tbody>
						</table>
					</div>
				</div>
				<div class="diskuf-extended" style="display: block">
					<input type="hidden" name="[${controlId}][]" value=""/>
					<div class="diskuf-extended-item">
						<label for="file_loader_${controlId}">
							${main_core.Loc.getMessage('TASKS_SCRUM_FILES_LOADER_POPUP_FROM_COMPUTER')}
						</label>
						<input
							class="diskuf-fileUploader"
							id="file_loader_${controlId}"
							type="file"
							multiple="multiple"
							size="1"
							style="display: none"
						>
					</div>
					<div class="diskuf-extended-item">
						<button type="button" class="diskuf-selector-link" data-testid="tasks-scrum-disk-picker-open-btn">
							${main_core.Loc.getMessage('TASKS_SCRUM_FILES_LOADER_POPUP_FROM_B24')}
						</button>
					</div>
					<div class="diskuf-extended-item">
						<span class="diskuf-selector-link-cloud" data-bx-doc-handler="gdrive">
							<span>${main_core.Loc.getMessage('TASKS_SCRUM_FILES_LOADER_POPUP_FROM_CLOUD')}</span>
						</span>
					</div>
				</div>
			</div>
			</div>
		`;

			/* eslint-disable */
			BX.addCustomEvent(filesChooser, 'OnFileUploadSuccess', this.onFileUploadSuccess.bind(this));
			/* eslint-enable */

			return filesChooser;
		}
		onFileUploadSuccess(fileResult, uf, file, uploaderFile) {
			if (main_core.Type.isUndefined(file) || main_core.Type.isUndefined(uploaderFile)) {
				return;
			}
			this.attachedIds.push(fileResult.element_id.toString());
			this.onFinishDebounce(this.attachedIds);
		}
	}

	class Toggle extends main_core_events.EventEmitter {
		constructor(params) {
			super(params);
			this.setEventNamespace('BX.Tasks.Scrum.Item.Toggle');
			this.visible = params.visible;
			this.shown = false;
			this.disabled = false;
		}
		render() {
			this.node = main_core.Tag.render`
			<div class="tasks-scrum__item--btn-toggle-tasks ${this.visible ? '--visible' : ''}"></div>
		`;
			main_core.Event.bind(this.node, 'click', this.onClick.bind(this));
			return this.node;
		}
		getNode() {
			return this.node;
		}
		onClick() {
			if (this.isDisabled()) {
				return;
			}
			this.disable();
			if (this.isShown()) {
				this.emit('hide');
			} else {
				this.emit('show');
			}
		}
		show() {
			this.shown = true;
			this.unDisable();
		}
		hide() {
			this.shown = false;
			this.unDisable();
		}
		isShown() {
			return this.shown;
		}
		isDisabled() {
			return this.disabled;
		}
		disable() {
			this.disabled = true;
		}
		unDisable() {
			this.disabled = false;
		}
	}

	class Tool {
		static escapeRegex(string) {
			return string.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
		}
	}

	let Name$1 = class Name extends main_core_events.EventEmitter {
		constructor(params) {
			super(params);
			this.setEventNamespace('BX.Tasks.Scrum.Item.Name');
			this.value = main_core.Type.isString(params.name) && params.name ? params.name.trim() : '';
			this.important = params.isImportant;
			this.completed = params.isCompleted;
			this.sourceId = params.sourceId;
			this.pathToTask = this.sourceId ? params.pathToTask.replace('#task_id#', this.sourceId) : null;
			if (!this.value) {
				throw new Error(main_core.Loc.getMessage('TASKS_SCRUM_TASK_ADD_NAME_ERROR'));
			}
			this.node = null;
		}
		render() {
			let visualClasses = this.completed ? '--completed' : '';
			visualClasses += this.important ? ' --important' : '';
			let value = main_core.Text.encode(this.value);
			if (this.important) {
				const words = this.value.split(' ');
				const lastWord = words[words.length - 1];
				value = value.replace(new RegExp(Tool.escapeRegex(lastWord) + '$'), `<span>${lastWord}</span>`);
			}
			if (this.pathToTask) {
				const uri = BX.Uri.addParam(this.pathToTask, {
					ta_sec: 'scrum',
					ta_sub: 'list',
					ta_el: 'title_click'
				});
				this.node = main_core.Tag.render`
				<a
					href="${main_core.Text.encode(uri)}"
					class="tasks-scrum__item--title ${visualClasses}"
				>
					${value}
				</a>
			`;
				main_core.Event.bind(this.node, 'click', () => {
					this.emit('urlClick');
				});
			} else {
				this.node = main_core.Tag.render`
				<div class="tasks-scrum__item--title ${visualClasses}">
					${value}
				</div>
			`;
				main_core.Event.bind(this.node, 'click', this.onClick.bind(this));
			}
			return this.node;
		}
		getNode() {
			return this.node;
		}
		getValue() {
			return this.value;
		}
		setCompleted(value) {
			this.completed = value;
		}
		strikeOut() {
			main_core.Dom.addClass(this.node, '--completed');
		}
		unStrikeOut() {
			main_core.Dom.removeClass(this.node, '--completed');
		}
		onClick() {
			this.emit('click');
		}
	};

	class Checklist extends main_core_events.EventEmitter {
		constructor(params) {
			super(params);
			this.setEventNamespace('BX.Tasks.Scrum.Item.Checklist');
			this.complete = main_core.Type.isInteger(params.complete) ? parseInt(params.complete, 10) : 0;
			this.all = main_core.Type.isInteger(params.all) ? parseInt(params.all, 10) : 0;
			this.value = `${this.complete}/${this.all}`;
			this.node = null;
		}
		render() {
			const uiClasses = 'ui-label ui-label-sm ui-label-light';
			this.node = main_core.Tag.render`
			<div class="tasks-scrum__item--entity-tasks ${this.all ? '--visible' : ''} ${uiClasses}">
				${this.value}
			</div>
		`;
			main_core.Event.bind(this.node, 'click', this.onClick.bind(this));
			return this.node;
		}
		getNode() {
			return this.node;
		}
		getValue() {
			return this.value;
		}
		getComplete() {
			return this.complete;
		}
		getAll() {
			return this.all;
		}
		onClick() {
			this.emit('click');
		}
	}

	class Files extends main_core_events.EventEmitter {
		constructor(count) {
			super(count);
			this.setEventNamespace('BX.Tasks.Scrum.Item.Files');
			this.value = main_core.Type.isInteger(count) ? parseInt(count, 10) : 0;
			this.node = null;
		}
		render() {
			const uiClasses = 'ui-label ui-label-sm ui-label-light';
			this.node = main_core.Tag.render`
			<div class="tasks-scrum__item--attachment-counter ${this.value ? '--visible' : ''} ${uiClasses}">
				${this.value}
			</div>
		`;
			main_core.Event.bind(this.node, 'click', this.onClick.bind(this));
			return this.node;
		}
		getNode() {
			return this.node;
		}
		getValue() {
			return this.value;
		}
		onClick() {
			this.emit('click');
		}
	}

	class Comments extends main_core_events.EventEmitter {
		constructor(taskCounter) {
			super(taskCounter);
			this.setEventNamespace('BX.Tasks.Scrum.Item.Comments');
			if (main_core.Type.isUndefined(taskCounter) || main_core.Type.isNull(taskCounter)) {
				taskCounter = {
					color: '',
					value: 0
				};
			}
			this.taskCounter = taskCounter;
			this.node = null;
		}
		render() {
			this.node = main_core.Tag.render`
			<div class="tasks-scrum__item--comment-counter ${this.taskCounter.value ? '--visible' : ''}">
				<div class='ui-counter ${this.taskCounter.color}'>
					<div class='ui-counter-inner'>${parseInt(this.taskCounter.value, 10)}</div>
				</div>
			</div>
		`;
			main_core.Event.bind(this.node, 'click', this.onClick.bind(this));
			return this.node;
		}
		getNode() {
			return this.node;
		}
		getValue() {
			return this.taskCounter;
		}
		onClick() {
			this.emit('click');
		}
	}

	let Epic$1 = class Epic extends main_core_events.EventEmitter {
		constructor(epic) {
			super(epic);
			this.setEventNamespace('BX.Tasks.Scrum.Item.Epic');
			if (main_core.Type.isUndefined(epic) || main_core.Type.isArray(epic) || main_core.Type.isNull(epic)) {
				epic = {
					id: 0,
					groupId: 0,
					name: '',
					description: '',
					createdBy: 0,
					modifiedBy: 0,
					color: ''
				};
			}
			this.epic = epic;
		}
		render() {
			this.node = main_core.Tag.render`
			<div class="tasks-scrum__item--epic ${this.epic.id ? '--visible' : ''}">
				<i
					class="tasks-scrum__item--epic-point"
					style="${`background-color: ${this.epic.color}`}"
				></i>
				<span>${main_core.Text.encode(this.epic.name)}</span>
			</div>
		`;
			main_core.Event.bind(this.node, 'click', this.onClick.bind(this));
			return this.node;
		}
		renderFullView() {
			const colorBorder = this.convertHexToRGBA(this.epic.color, 0.7);
			const colorBackground = this.convertHexToRGBA(this.epic.color, 0.3);
			const visibility = this.epic.id > 0 ? '--visible' : '';
			this.node = main_core.Tag.render`
			<div
				class="tasks-scrum__item--epic-full-view ${visibility}"
				style="background: ${colorBackground}; border-color: ${colorBorder};"
			>${main_core.Text.encode(this.epic.name)}</div>
		`;
			main_core.Event.bind(this.node, 'click', this.onClick.bind(this));
			return this.node;
		}
		getNode() {
			return this.node;
		}
		getValue() {
			return this.epic;
		}
		getId() {
			return this.epic.id;
		}
		onClick() {
			this.emit('click');
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
	};

	class Tags extends main_core_events.EventEmitter {
		constructor(tags) {
			super(tags);
			this.setEventNamespace('BX.Tasks.Scrum.Item.Tags');
			this.tags = main_core.Type.isArray(tags) ? tags : [];
			this.node = null;
		}
		render() {
			if (this.tags.length) {
				this.node = main_core.Tag.render`
				${this.tags.map(tag => {
				return main_core.Tag.render`<div class="tasks-scrum__item--hashtag --visible">#${main_core.Text.encode(tag)}</div>`;
			})}
			`;
			} else {
				this.node = main_core.Tag.render`<div class="tasks-scrum__item--hashtag"></div>`;
			}
			if (main_core.Type.isArray(this.node)) {
				this.node.forEach(node => {
					main_core.Event.bind(node, 'click', this.onClick.bind(this));
				});
			} else {
				main_core.Event.bind(this.node, 'click', this.onClick.bind(this));
			}
			return this.node;
		}
		getNode() {
			return this.node;
		}
		getValue() {
			return this.tags;
		}
		onClick(event) {
			this.emit('click', event.target.textContent.substring(1));
		}
		isEqualTags(tags) {
			return JSON.stringify(this.getValue()) === JSON.stringify(tags.getValue());
		}
	}

	class Responsible extends main_core_events.EventEmitter {
		constructor(responsible) {
			super();
			this.setEventNamespace('BX.Tasks.Scrum.Item.Responsible');
			this.responsible = main_core.Type.isPlainObject(responsible) ? responsible : null;
		}
		render() {
			if (this.responsible === null) {
				return '';
			}
			const uiClasses = 'ui-icon ui-icon-common-user';
			const name = main_core.Text.encode(this.responsible.name);
			const src = this.responsible.photo ? main_core.Text.encode(this.responsible.photo.src) : null;
			const photoStyle = src ? `background-image: url('${encodeURI(src)}');` : '';
			this.node = main_core.Tag.render`
			<div class="tasks-scrum__item--responsible">
				<div class="tasks-scrum__item--responsible-photo ${uiClasses}" title="${name}">
					<i style="${photoStyle}"></i>
				</div>
				<span>${name}</span>
			</div>
		`;
			main_core.Event.bind(this.node.querySelector('div'), 'click', this.onClick.bind(this));
			main_core.Event.bind(this.node.querySelector('span'), 'click', this.onClick.bind(this));
			return this.node;
		}
		getNode() {
			return this.node;
		}
		getValue() {
			return this.responsible;
		}
		onClick() {
			this.emit('click');
		}
	}

	class StoryPointsStorage {
		constructor() {
			this.storyPoints = '';
		}
		setPoints(storyPoints) {
			if (storyPoints === '') {
				this.storyPoints = '';
				return;
			}
			if (main_core.Type.isUndefined(storyPoints) || main_core.Type.isFloat(storyPoints) && isNaN(parseFloat(storyPoints))) {
				return;
			}
			if (main_core.Type.isFloat(storyPoints)) {
				storyPoints = parseFloat(storyPoints).toFixed(1);
			}
			this.storyPoints = String(storyPoints);
		}
		getPoints() {
			return this.storyPoints;
		}
		clearPoints() {
			this.storyPoints = '';
		}
		isEmpty() {
			return this.storyPoints === '';
		}
	}

	class StoryPoints extends main_core_events.EventEmitter {
		constructor(storyPoints) {
			super();
			this.setEventNamespace('BX.Tasks.Scrum.Item.StoryPoints');
			this.storyPointsStorage = new StoryPointsStorage();
			this.storyPointsStorage.setPoints(storyPoints);
			this.disableStatus = false;
		}
		render() {
			const value = main_core.Text.encode(this.storyPointsStorage.getPoints());
			this.node = main_core.Tag.render`
			<div
				class="tasks-scrum__item--story-points ${this.storyPointsStorage.isEmpty() ? '--empty' : ''}"
				title="${main_core.Loc.getMessage('TASKS_SCRUM_SPRINT_HEADER_STORY_POINTS')}"
			>
				<div class="tasks-scrum__item--story-points-content">
					<div 
						class="tasks-scrum__item--story-points-element" 
						title="${this.storyPointsStorage.isEmpty() ? '' : value}"
					>
						<span class="tasks-scrum__item--story-points-element-text">
							${this.storyPointsStorage.isEmpty() ? '-' : value}
						</span>
					</div>
					<div class="tasks-scrum__item--story-points-input-container">
						<input
							type="text"
							class="tasks-scrum__item--story-points-input"
							value="${value}"
						>
					</div>
				</div>
			</div>
		`;
			main_core.Event.bind(this.node.querySelector('.tasks-scrum__item--story-points-element'), 'click', this.onClick.bind(this));
			const input = this.node.querySelector('.tasks-scrum__item--story-points-input');
			main_core.Event.bind(input, 'blur', this.onBlur.bind(this));
			main_core.Event.bind(input, 'keydown', this.onKeyDown.bind(input));
			return this.node;
		}
		getNode() {
			return this.node;
		}
		getValue() {
			return this.storyPointsStorage;
		}
		isDisable() {
			return this.disableStatus;
		}
		disable() {
			this.disableStatus = true;
		}
		unDisable() {
			this.disableStatus = false;
		}
		onClick() {
			if (this.isDisable()) {
				return;
			}
			const inputContainer = this.node.querySelector('.tasks-scrum__item--story-points-input-container');
			const input = inputContainer.firstElementChild;
			const value = this.storyPointsStorage.getPoints();
			main_core.Dom.addClass(inputContainer, '--active');
			input.focus();
			input.setSelectionRange(value.length, value.length);
		}
		onBlur() {
			const inputContainer = this.node.querySelector('.tasks-scrum__item--story-points-input-container');
			const input = inputContainer.firstElementChild;
			const value = input.value.trim();
			const currentValue = this.storyPointsStorage.getPoints();
			if (currentValue !== value) {
				this.emit('setStoryPoints', value);
			}
			main_core.Dom.removeClass(inputContainer, '--active');
		}
		onKeyDown(event) {
			if (event.isComposing || event.key === 'Escape' || event.key === 'Enter') {
				this.blur();
			}
		}
	}

	class SubTasks extends main_core_events.EventEmitter {
		constructor(parentItem) {
			super();
			this.setEventNamespace('BX.Tasks.Scrum.SubTasks');
			this.parentItem = parentItem;
			this.list = new Map();
			this.node = null;
		}
		render() {
			this.removeYourself();
			this.node = main_core.Tag.render`<div class="tasks-scrum__item-sub-tasks"></div>`;
			main_core.Event.bind(this.node, 'transitionend', this.onTransitionEnd.bind(this, this.node));
			return this.node;
		}
		getNode() {
			return this.node;
		}
		removeYourself() {
			if (main_core.Type.isNull(this.getNode())) {
				return;
			}
			main_core.Dom.remove(this.node);
			this.node = null;
		}
		isEmpty() {
			return this.list.size === 0;
		}
		getParentItem() {
			return this.parentItem;
		}
		addTask(item) {
			this.list.set(item.getId(), item);
		}
		getList() {
			return this.list;
		}
		cleanTasks() {
			this.list.forEach(item => {
				main_core.Dom.remove(item.getNode());
			});
			this.list.clear();
		}
		show() {
			return new Promise(resolve => {
				this.resolve = resolve;
				if (main_core.Type.isNull(this.getNode())) {
					return;
				}
				if (this.list.size) {
					this.hideLoader();
					this.renderSubTasks();
				} else {
					this.showLoader();
				}
				main_core.Dom.style(this.getNode(), 'height', `${this.getNode().scrollHeight}px`);
			});
		}
		hide() {
			return new Promise(resolve => {
				this.resolve = resolve;
				if (main_core.Type.isNull(this.getNode())) {
					this.resolve();
					return null;
				}
				this.hideLoader();

				/* eslint-disable */
				this.getNode().style.height = `${this.getNode().scrollHeight}px`;
				this.getNode().clientHeight;
				this.getNode().style.height = '0';
				/* eslint-enable */
			});
		}
		isShown() {
			return !main_core.Type.isNull(this.node);
		}
		renderSubTasks() {
			this.node.innerHTML = '';
			this.list.forEach(item => {
				main_core.Dom.append(item.render(), this.getNode());
			});
		}
		showLoader() {
			if (this.loader) {
				this.loader.show();
				return;
			}
			const listPosition = main_core.Dom.getPosition(this.getNode());
			this.loader = new main_loader.Loader({
				target: this.getNode(),
				size: 60,
				mode: 'inline',
				color: 'rgba(82, 92, 105, 0.9)',
				offset: {
					top: `12px`,
					left: `${listPosition.width / 2 - 30}px`
				}
			});
			this.loader.show();
		}
		hideLoader() {
			if (this.loader) {
				this.loader.hide();
			}
		}
		onTransitionEnd(node) {
			const isHide = main_core.Dom.style(node, 'height') === '0px';
			if (isHide) {
				this.removeYourself();
			} else {
				main_core.Dom.style(node, 'height', 'auto');
			}
			this.resolve();
		}
	}

	class Item extends main_core_events.EventEmitter {
		constructor(params) {
			super(params);
			this.setEventNamespace('BX.Tasks.Scrum.Item');
			this.groupMode = false;
			this.decompositionMode = false;
			this.node = null;
			this.toggle = null;
			this.name = null;
			this.checklist = null;
			this.files = null;
			this.comments = null;
			this.epic = null;
			this.tags = null;
			this.responsible = null;
			this.storyPoints = null;
			this.subTasks = null;
			this.setItemParams(params);
			this.shortView = 'Y';
		}
		setItemParams(params) {
			this.setId(params.id);
			this.setGroupId(params.groupId);
			this.setTmpId(params.tmpId);
			this.setSort(params.sort);
			this.setEntityId(params.entityId);
			this.setEntityType(params.entityType);
			this.setSourceId(params.sourceId);
			this.setInfo(params.info);
			this.setSubTasksInfo(params.subTasksInfo);
			this.setParentTask(params.isParentTask);
			this.setLinkedTask(params.isLinkedTask);
			this.setParentTaskId(params.parentTaskId);
			this.setSubTask(params.isSubTask);
			this.setCompleted(params.completed);
			this.setDisableStatus(false);
			this.setAllowedActions(params.allowedActions);
			this.setImportant(params.isImportant);
			this.pathToTask = params.pathToTask;
		}
		static buildItem(params) {
			const item = new Item(params);
			item.setToggle(item.isParentTask());
			item.setName(params.name);
			item.setChecklist(params.checkListComplete, params.checkListAll);
			item.setFiles(params.attachedFilesCount);
			item.setComments(params.taskCounter);
			item.setEpic(params.epic);
			item.setTags(params.tags);
			item.setResponsible(params.responsible);
			if (!item.isSubTask()) {
				item.setStoryPoints(params.storyPoints);
			}
			item.setSubTasks();
			return item;
		}
		setToggle(visible) {
			const toggle = new Toggle({
				visible
			});
			if (this.toggle) {
				main_core.Dom.replace(this.toggle.getNode(), toggle.render());
			}
			this.toggle = toggle;
			this.toggle.subscribe('show', this.onShowToggle.bind(this));
			this.toggle.subscribe('hide', this.onHideToggle.bind(this));
		}
		getToggle() {
			return this.toggle;
		}
		setName(inputName) {
			const name = new Name$1({
				name: inputName,
				isCompleted: this.isCompleted(),
				isImportant: this.isImportant(),
				pathToTask: this.pathToTask,
				sourceId: this.getSourceId()
			});
			if (this.name) {
				main_core.Dom.replace(this.name.getNode(), name.render());
			}
			this.name = name;
			this.name.subscribe('click', () => {
				this.emit('showTask');
			});
			this.name.subscribe('urlClick', () => {
				this.emit('destroyActionPanel');
			});
		}
		getName() {
			return this.name;
		}
		setChecklist(complete, all) {
			const checklist = new Checklist({
				complete,
				all
			});
			if (this.checklist) {
				main_core.Dom.replace(this.checklist.getNode(), checklist.render());
			}
			this.checklist = checklist;
			this.checklist.subscribe('click', () => this.emit('showTask'));
		}
		getChecklist() {
			return this.checklist;
		}
		setFiles(count) {
			const files = new Files(count);
			if (this.files) {
				main_core.Dom.replace(this.files.getNode(), files.render());
			}
			this.files = files;
			this.files.subscribe('click', () => this.emit('showTask'));
		}
		getFiles() {
			return this.files;
		}
		setComments(taskCounter) {
			const comments = new Comments(taskCounter);
			if (this.comments) {
				main_core.Dom.replace(this.comments.getNode(), comments.render());
			}
			this.comments = comments;
			this.comments.subscribe('click', () => this.emit('showTask'));
		}
		getComments() {
			return this.comments;
		}
		setEpic(inputEpic) {
			const epic = new Epic$1(inputEpic);
			if (this.epic) {
				main_core.Dom.replace(this.epic.getNode(), this.isShortView() ? epic.render() : epic.renderFullView());
			}
			this.epic = epic;
			this.updateTagsVisibility();
			this.epic.subscribe('click', () => this.emit('filterByEpic', this.epic.getId()));
		}
		getEpic() {
			return this.epic;
		}
		setTags(inputTags) {
			const tags = new Tags(inputTags);
			if (this.tags) {
				if (this.getNode())
					//todo
					{
						this.replaceTags(tags);
					}
			}
			this.tags = tags;
			this.updateTagsVisibility();
			this.tags.subscribe('click', baseEvent => this.emit('filterByTag', baseEvent.getData()));
		}
		getTags() {
			return this.tags;
		}
		setShortView(value) {
			this.shortView = value === 'Y' ? 'Y' : 'N';
			if (this.getNode()) {
				main_core.Dom.replace(this.getNode(), this.render());
			}
		}
		getShortView() {
			return this.shortView;
		}
		isShortView() {
			return this.shortView === 'Y';
		}
		setResponsible(inputResponsible) {
			const responsible = new Responsible(inputResponsible);
			if (this.responsible) {
				main_core.Dom.replace(this.responsible.getNode(), responsible.render());
			}
			this.responsible = responsible;
			this.responsible.subscribe('click', this.onResponsibleClick.bind(this));
		}
		getResponsible() {
			return this.responsible;
		}
		setStoryPoints(inputStoryPoints) {
			const storyPoints = new StoryPoints(inputStoryPoints);
			if (this.storyPoints) {
				main_core.Dom.replace(this.storyPoints.getNode(), storyPoints.render());
			}
			if (this.isDisabled()) {
				storyPoints.disable();
			}
			this.storyPoints = storyPoints;
			this.storyPoints.subscribe('setStoryPoints', this.onSetStoryPoints.bind(this));
		}
		getStoryPoints() {
			return this.storyPoints;
		}
		setSubTasks() {
			this.subTasks = new SubTasks(this);
			this.subTasks.subscribe('click', () => this.emit('showTask'));
		}
		getSubTasks() {
			return this.subTasks;
		}
		setId(id) {
			this.id = main_core.Type.isInteger(id) ? parseInt(id, 10) : main_core.Type.isString(id) && id ? id : main_core.Text.getRandom();
			if (this.getNode()) {
				this.getNode().dataset.id = this.id;
			}
		}
		getId() {
			return this.id;
		}
		setGroupId(id) {
			this.groupId = main_core.Type.isInteger(id) ? parseInt(id, 10) : 0;
		}
		getGroupId() {
			return this.groupId;
		}
		setTmpId(tmpId) {
			this.tmpId = main_core.Type.isString(tmpId) ? tmpId : '';
		}
		getTmpId() {
			return this.tmpId;
		}
		setSort(sort) {
			this.sort = parseFloat(sort);
			if (this.getNode()) {
				main_core.Dom.attr(this.getNode(), 'data-sort', this.sort);
			}
		}
		getSort() {
			return this.sort;
		}
		setEntityId(entityId) {
			this.entityId = main_core.Type.isInteger(entityId) ? parseInt(entityId, 10) : 0;
		}
		getEntityId() {
			return this.entityId;
		}
		setEntityType(entityType) {
			this.entityType = new Set(['backlog', 'sprint']).has(entityType) ? entityType : 'backlog';
			this.updateBorderColor();
		}
		getEntityType() {
			return this.entityType;
		}
		setSourceId(sourceId) {
			this.sourceId = main_core.Type.isInteger(sourceId) ? parseInt(sourceId, 10) : 0;
		}
		getSourceId() {
			return this.sourceId;
		}
		setCompleted(value) {
			const completed = value === 'Y';
			if (this.name) {
				this.name.setCompleted(completed);
				if (completed) {
					this.name.strikeOut();
				} else {
					this.name.unStrikeOut();
				}
			}
			this.completed = completed;
		}
		setAllowedActions(allowedActions) {
			this.allowedActions = main_core.Type.isPlainObject(allowedActions) ? allowedActions : {};
		}
		setImportant(isImportant) {
			this.important = isImportant === 'Y';
		}
		isImportant() {
			return this.important;
		}
		setSubTasksInfo(subTasksInfo) {
			this.subTasksInfo = subTasksInfo;
		}
		getSubTasksInfo() {
			return this.subTasksInfo;
		}
		getSubTasksCount() {
			if (!this.getSubTasksInfo()) {
				return 0;
			}
			return Object.keys(this.getSubTasksInfo()).length;
		}
		setParentTask(value) {
			this.parentTask = value === 'Y';
			if (this.getNode()) {
				this.setToggle(this.isParentTask());
				if (this.isParentTask()) {
					main_core.Dom.addClass(this.getNode(), '--parent-tasks');
					if (this.getSubTasksCount() > 1) {
						main_core.Dom.addClass(this.getNode(), '--many');
					} else {
						main_core.Dom.removeClass(this.getNode(), '--many');
					}
				} else {
					main_core.Dom.removeClass(this.getNode(), '--parent-tasks');
				}
			}
		}
		isParentTask() {
			return this.parentTask;
		}
		setLinkedTask(value) {
			this.linkedTask = value === 'Y';
			if (this.getNode()) {
				if (this.isLinkedTask() && !this.isSubTask()) {
					main_core.Dom.addClass(this.getNode(), '--linked');
				} else {
					main_core.Dom.removeClass(this.getNode(), '--linked');
				}
			}
		}
		isLinkedTask() {
			return this.linkedTask;
		}
		setParentTaskId(id) {
			this.parentTaskId = main_core.Type.isInteger(id) ? parseInt(id, 10) : 0;
		}
		getParentTaskId() {
			return this.parentTaskId;
		}
		setSubTask(value) {
			this.subTask = value === 'Y';
			if (this.getNode()) {
				if (this.isSubTask()) {
					main_core.Dom.addClass(this.getNode(), '--subtasks');
				} else {
					main_core.Dom.removeClass(this.getNode(), '--subtasks');
				}
			}
		}
		isSubTask() {
			return this.subTask;
		}
		setInfo(info) {
			if (main_core.Type.isUndefined(info)) {
				this.info = {
					color: '',
					borderColor: ''
				};
				return;
			}
			this.info = info;
		}
		getInfo() {
			return this.info;
		}
		setBorderColor(color) {
			this.info.borderColor = main_core.Type.isString(color) ? color : '';
			this.updateBorderColor();
		}
		getBorderColor() {
			return main_core.Type.isString(this.info.borderColor) ? this.info.borderColor : '';
		}
		updateBorderColor() {
			if (this.isLinkedTask() && !this.isSubTask() && this.getNode() && this.getBorderColor() !== '') {
				const colorNode = this.getNode().querySelector('.tasks-scrum__item--link');
				main_core.Dom.style(colorNode, 'backgroundColor', this.getBorderColor());
				switch (this.getEntityType()) {
					case 'backlog':
						main_core.Dom.style(this.getNode().querySelector('.tasks-scrum__item--bg'), 'backgroundColor', this.getBorderColor());
						break;
					case 'sprint':
						main_core.Dom.style(this.getNode(), 'borderLeft', null);
						break;
				}
			}
		}
		isCompleted() {
			return this.completed;
		}
		isDisabled() {
			return this.disableStatus;
		}
		setMoveActivity(value) {
			this.moveActivity = Boolean(value);
		}
		isMovable() {
			return this.moveActivity;
		}
		setDisableStatus(status) {
			this.disableStatus = Boolean(status);
			if (this.storyPoints) {
				if (this.isDisabled()) {
					this.storyPoints.disable();
				} else {
					this.storyPoints.unDisable();
				}
			}
		}
		activateGroupMode() {
			main_core.Dom.addClass(this.getNode(), '--checked');
		}
		deactivateGroupMode() {
			main_core.Dom.removeClass(this.getNode(), '--checked');
		}
		activateLinkedMode() {
			main_core.Dom.addClass(this.getNode(), '--linked-mode');
		}
		deactivateLinkedMode() {
			main_core.Dom.removeClass(this.getNode(), '--linked-mode');
			main_core.Dom.removeClass(this.getNode(), '--linked-mode-current');
		}
		activateCurrentLinkedMode() {
			main_core.Dom.addClass(this.getNode(), '--linked-mode-current');
		}
		deactivateCurrentLinkedMode() {
			main_core.Dom.removeClass(this.getNode(), '--linked-mode-current');
		}
		addItemToGroupMode() {
			this.groupMode = true;
			main_core.Dom.addClass(this.getNode(), ['--group-mode']);
			this.getNode().querySelector('.tasks-scrum__item--group-mode-input').checked = true;
		}
		removeItemFromGroupMode() {
			this.groupMode = false;
			main_core.Dom.removeClass(this.getNode(), ['--group-mode']);
			this.getNode().querySelector('.tasks-scrum__item--group-mode-input').checked = false;
		}
		isGroupMode() {
			return this.groupMode;
		}
		getNode() {
			return this.node;
		}
		showSubTasks() {
			main_core.Dom.addClass(this.getNode(), '--open');
			this.getSubTasks().show().then(() => {
				this.toggle.show();
			});
		}
		hideSubTasks() {
			main_core.Dom.removeClass(this.getNode(), '--open');
			this.getSubTasks().hide().then(() => {
				this.toggle.hide();
			});
		}
		cleanSubTasks() {
			this.getSubTasks().cleanTasks();
		}
		isShownSubTasks() {
			return this.getSubTasks().isShown();
		}
		activateDecompositionMode() {
			this.decompositionMode = true;
		}
		deactivateDecompositionMode() {
			this.decompositionMode = false;
		}
		isDecompositionMode() {
			return this.decompositionMode;
		}
		setParentEntity(entityId, entityType) {
			this.setEntityId(entityId);
			this.setEntityType(entityType);
		}
		isEditAllowed() {
			return Boolean(this.allowedActions['task_edit']);
		}
		isRemoveAllowed() {
			return Boolean(this.allowedActions['task_remove']);
		}
		updateYourself(tmpItem) {
			this.setToggle(tmpItem.isParentTask());
			if (this.getName().getValue() !== tmpItem.getName().getValue()) {
				this.setName(tmpItem.getName().getValue());
			}
			if (this.getChecklist().getValue() !== tmpItem.getChecklist().getValue()) {
				this.setChecklist(tmpItem.getChecklist().getComplete(), tmpItem.getChecklist().getAll());
			}
			if (this.getFiles().getValue() !== tmpItem.getFiles().getValue()) {
				this.setFiles(tmpItem.getFiles().getValue());
			}
			if (this.getComments().getValue() !== tmpItem.getComments().getValue()) {
				this.setComments(tmpItem.getComments().getValue());
			}
			if (this.getEpic().getValue() !== tmpItem.getEpic().getValue()) {
				this.setEpic(tmpItem.getEpic().getValue());
			}
			if (!this.getTags().isEqualTags(tmpItem.getTags())) {
				this.setTags(tmpItem.getTags().getValue());
			}
			if (this.getResponsible().getValue() !== tmpItem.getResponsible().getValue()) {
				this.setResponsible(tmpItem.getResponsible().getValue());
			}
			if (!this.isSubTask() && this.getStoryPoints().getValue().getPoints() !== tmpItem.getStoryPoints().getValue().getPoints()) {
				this.setStoryPoints(tmpItem.getStoryPoints().getValue().getPoints());
			}
			this.setEntityId(tmpItem.getEntityId());
			if (this.isCompleted() !== tmpItem.isCompleted()) {
				this.setCompleted(tmpItem.isCompleted() ? 'Y' : 'N');
			}
			if (this.isImportant() !== tmpItem.isImportant()) {
				this.setImportant(tmpItem.isImportant() ? 'Y' : 'N');
				this.setName(tmpItem.getName().getValue());
			}
			this.setParentTask(tmpItem.isParentTask() ? 'Y' : 'N');
			this.setLinkedTask(tmpItem.isLinkedTask() ? 'Y' : 'N');
			this.setParentTaskId(tmpItem.getParentTaskId());
			this.setSubTask(tmpItem.isSubTask() ? 'Y' : 'N');
		}
		removeYourself() {
			if (this.subTasks) {
				this.subTasks.removeYourself();
			}
			main_core.Dom.remove(this.node);
			this.node = null;
		}
		render() {
			if (this.isShortView()) {
				return this.renderShortView();
			} else {
				return this.renderFullView();
			}
		}
		renderShortView() {
			const typeClass = (this.isParentTask() ? ' --parent-tasks ' : ' ') + (this.isSubTask() ? ' --subtasks ' : '');
			const subClass = this.getSubTasksCount() > 1 ? ' --many ' : '';
			const linkedClass = this.isLinkedTask() && !this.isSubTask() ? ' --linked ' : '';
			const entityClass = '--item-' + this.getEntityType();
			this.node = main_core.Tag.render`
			<div
				class="tasks-scrum__item${typeClass}${subClass}${linkedClass}tasks-scrum__item--drag --short-view ${entityClass}"
				data-id="${main_core.Text.encode(this.getId())}"
				data-sort="${main_core.Text.encode(this.getSort())}"
			>
			<div class="tasks-scrum__item--bg"></div>
				<div class="tasks-scrum__item--link"></div>
				<div class="tasks-scrum__item--info">
					${this.toggle ? this.toggle.render() : ''}
					<div class="tasks-scrum__item--main-info">
						${this.name ? this.name.render() : ''}
						<div class="tasks-scrum__item--tags">
							${this.epic ? this.epic.render() : ''}
							${this.tags ? this.tags.render() : ''}
						</div>
					</div>
					<div class="tasks-scrum__item--entity-content">
						${this.comments ? this.comments.render() : ''}
						<div class="tasks-scrum__item--counter-container">
							${this.files ? this.files.render() : ''}
							${this.checklist ? this.checklist.render() : ''}
						</div>
					</div>
				</div>
				${this.responsible ? this.responsible.render() : ''}
				${!this.isSubTask() && this.storyPoints ? this.storyPoints.render() : ''}
				<div class="tasks-scrum__item--group-mode">
					<input type="checkbox" class="tasks-scrum__item--group-mode-input">
				</div>
				<div class="tasks-scrum__item--substrate"></div>
				<div class="tasks-scrum__item--dragstrate"></div>
			</div>
		`;
			main_core.Event.bind(this.node, 'click', this.onItemClick.bind(this));
			this.updateBorderColor();
			return this.node;
		}
		renderFullView() {
			const typeClass = (this.isParentTask() ? ' --parent-tasks ' : ' ') + (this.isSubTask() ? ' --subtasks ' : '');
			const subClass = this.getSubTasksCount() > 1 ? ' --many ' : '';
			const linkedClass = this.isLinkedTask() && !this.isSubTask() ? ' --linked ' : '';
			const entityClass = '--item-' + this.getEntityType();
			this.node = main_core.Tag.render`
			<div
				class="tasks-scrum__item${typeClass}${subClass}${linkedClass}tasks-scrum__item--drag --full-view ${entityClass}"
				data-id="${main_core.Text.encode(this.getId())}"
				data-sort="${main_core.Text.encode(this.getSort())}"
			>
			<div class="tasks-scrum__item--bg"></div>
			<div class="tasks-scrum__item--info-task--basic">
				<div class="tasks-scrum__item--link"></div>
				<div class="tasks-scrum__item--info">
					${this.toggle ? this.toggle.render() : ''}
					<div class="tasks-scrum__item--main-info">
						${this.name ? this.name.render() : ''}
						<div class="tasks-scrum__item--tags">
							${this.epic ? this.epic.renderFullView() : ''}
							${this.tags ? this.tags.render() : ''}
						</div>
					</div>
					${this.comments ? this.comments.render() : ''}
				</div>
			</div>
			<div class="tasks-scrum__item--info-task--details">
				${this.responsible ? this.responsible.render() : ''}

					<div class="tasks-scrum__item--counter-container">
						${this.files ? this.files.render() : ''}
						${this.checklist ? this.checklist.render() : ''}
					</div>

				${!this.isSubTask() && this.storyPoints ? this.storyPoints.render() : ''}
			</div>

				<div class="tasks-scrum__item--group-mode">
					<input type="checkbox" class="tasks-scrum__item--group-mode-input">
				</div>
				<div class="tasks-scrum__item--substrate"></div>
				<div class="tasks-scrum__item--dragstrate"></div>
			</div>
		`;
			this.updateTagsVisibility();
			main_core.Event.bind(this.node, 'click', this.onItemClick.bind(this));
			this.updateBorderColor();
			return this.node;
		}
		updateTagsVisibility() {
			if (!this.getNode()) {
				return;
			}
			if (this.epic.getValue().id > 0 || this.tags.getValue().length > 0) {
				main_core.Dom.addClass(this.getNode().querySelector('.tasks-scrum__item--tags'), '--visible');
			} else {
				main_core.Dom.removeClass(this.getNode().querySelector('.tasks-scrum__item--tags'), '--visible');
			}
		}
		replaceTags(tags) {
			const tagsContainer = this.getNode().querySelector('.tasks-scrum__item--tags');
			const tagsNode = tagsContainer.querySelectorAll('.tasks-scrum__item--hashtag');
			tagsNode.forEach(tagNode => main_core.Dom.remove(tagNode));
			const tagList = tags.render();
			if (main_core.Type.isArray(tagList)) {
				tagList.forEach(tagNode => main_core.Dom.append(tagNode, tagsContainer));
			} else {
				main_core.Dom.append(tagList, tagsContainer);
			}
		}
		onItemClick(event) {
			const target = event.target;
			if (main_core.Dom.hasClass(target, 'tasks-scrum__item--link')) {
				this.emit('showLinked');
				return;
			}
			if (this.isDisabled()) {
				return;
			}
			if (this.toggle && this.hasNode(this.toggle.getNode(), target)) {
				return;
			}
			if (this.name && this.hasNode(this.name.getNode(), target)) {
				return;
			}
			if (this.checklist && this.hasNode(this.checklist.getNode(), target)) {
				return;
			}
			if (this.files && this.hasNode(this.files.getNode(), target)) {
				return;
			}
			if (this.comments && this.hasNode(this.comments.getNode(), target)) {
				return;
			}
			if (this.epic && this.hasNode(this.epic.getNode(), target)) {
				return;
			}
			if (this.tags && this.hasNode(this.tags.getNode(), target)) {
				return;
			}
			if (this.responsible && this.hasNode(this.responsible.getNode(), target, true)) {
				return;
			}
			if (this.isSubTask()) {
				return;
			}
			if (this.storyPoints && this.hasNode(this.storyPoints.getNode(), target)) {
				return;
			}
			this.emit('toggleActionPanel');
		}
		onResponsibleClick() {
			if (this.isGroupMode()) {
				return;
			}
			if (this.isDisabled()) {
				return;
			}
			if (this.responsibleDialog && this.responsibleDialog.isOpen()) {
				this.responsibleDialog.hide();
				this.responsibleDialog = null;
				return;
			}
			const responsible = this.getResponsible().getValue();
			const preselectedItems = responsible ? [['user', responsible.id]] : [];
			this.responsibleDialog = new ui_entitySelector.Dialog({
				targetNode: this.responsible.getNode(),
				enableSearch: true,
				context: 'TASKS',
				dropdownMode: true,
				preselectedItems: preselectedItems,
				events: {
					'Item:onSelect': event => {
						this.responsibleDialog.hide();
						const selectedItem = event.getData().item;
						this.setResponsible({
							id: selectedItem.getId(),
							name: selectedItem.getTitle(),
							photo: {
								src: selectedItem.getAvatar()
							}
						});
						this.emit('changeTaskResponsible');
					}
				},
				entities: [{
					id: 'scrum-user',
					options: {
						groupId: this.getGroupId()
					},
					dynamicLoad: true
				}, {
					id: 'department'
				}]
			});
			this.emit('onShowResponsibleDialog', this.responsibleDialog);
			this.responsibleDialog.show();
		}
		onSetStoryPoints(baseEvent) {
			if (this.isDisabled()) {
				return;
			}
			this.emit('updateItem', {
				itemId: this.getId(),
				entityId: this.getEntityId(),
				storyPoints: baseEvent.getData()
			});
			this.setStoryPoints(baseEvent.getData());
		}
		onShowToggle() {
			this.emit('showSubTasks', this.getSubTasks());
		}
		onHideToggle() {
			this.hideSubTasks();
		}
		hasNode(parentNode, searchNode, skipParent = false) {
			if (main_core.Type.isArray(parentNode)) {
				const result = parentNode.map(node => this.hasNode(node, searchNode, skipParent)).find(result => result === true);
				return !main_core.Type.isUndefined(result);
			}
			if (!skipParent && searchNode.isEqualNode(parentNode)) {
				return true;
			}
			const nodes = parentNode.getElementsByTagName('*');
			for (let k = 0; k < nodes.length; k++) {
				if (searchNode.isEqualNode(nodes[k])) {
					return true;
				}
			}
			return false;
		}
		activateBlinking() {
			if (!this.getNode()) {
				return;
			}
			if (main_core.Type.isUndefined(IntersectionObserver)) {
				return;
			}
			const observer = new IntersectionObserver(entries => {
				if (entries[0].isIntersecting === true) {
					this.blink();
					observer.disconnect();
				}
			}, {
				threshold: [0]
			});
			observer.observe(this.getNode());
		}
		blink() {
			if (!this.getNode()) {
				return;
			}
			main_core.Dom.addClass(this.getNode(), '--blink');
			setTimeout(() => {
				main_core.Dom.removeClass(this.getNode(), '--blink');
			}, 300);
		}
	}

	class ListItems {
		constructor(entity) {
			this.entity = entity;
			this.node = null;
		}
		render() {
			this.node = main_core.Tag.render`
			<div class="tasks-scrum__content-items" data-entity-id="${this.entity.getId()}">
				${[...this.entity.getItems().values()].map(item => {
			item.setEntityType(this.entity.getEntityType());
			return item.render();
		})}
				${this.renderLoader()}
			</div>
		`;
			return this.node;
		}
		renderLoader() {
			return main_core.Tag.render`<div class="tasks-scrum-entity-items-loader"></div>`;
		}
		getNode() {
			return this.node;
		}
		getListNode() {
			return this.node;
		}
		setEntityId(entityId) {
			this.node.dataset.entityId = parseInt(entityId, 10);
		}
		addScrollbar() {
			main_core.Dom.addClass(this.getNode(), '--scrollbar');
		}
		removeScrollbar() {
			main_core.Dom.removeClass(this.getNode(), '--scrollbar');
		}
	}

	class TagSearcher extends main_core_events.EventEmitter {
		static tagRegExp = '#([^\\s,\\[\\]<>]+)';
		static epicRegExp = '@[^#@](?:[^#@]*[^\s#@])?';
		constructor(params) {
			super(params);
			this.setEventNamespace('BX.Tasks.Scrum.TagSearcher');
			this.requestSender = params.requestSender;
			this.filterService = params.filter;
			this.groupId = parseInt(params.groupId, 10);
			this.tagsAreConverting = params.tagsAreConverting;
			this.messageViewed = false;
		}
		addEpicToSearcher(epic, selected = false) {
			const epicDialogItem = this.getEpicDialogItem(epic);
			if (selected) {
				epicDialogItem.selected = true;
				epicDialogItem.sort = 1;
			}
			if (this.epicDialog) {
				this.epicDialog.addItem(epicDialogItem);
			}
			if (this.epicSearchDialog) {
				this.epicSearchDialog.addItem(epicDialogItem);
			}
		}
		removeEpicFromSearcher(epic) {
			if (this.epicDialog) {
				this.epicDialog.removeItem(this.getEpicDialogItem(epic));
			}
			if (this.epicSearchDialog) {
				this.epicSearchDialog.removeItem(this.getEpicDialogItem(epic));
			}
		}
		getEpicDialogItem(epic) {
			return {
				id: epic.id,
				entityId: 'epic-selector',
				title: epic.name,
				tabs: 'recents',
				avatarOptions: {
					bgColor: epic.color,
					bgImage: 'none'
				}
			};
		}

		// widget on scrum (ex task)
		showTagsDialog(item, targetNode) {
			if (this.tagsAreConverting) {
				this.showConvertingMessage();
				return;
			}
			let choiceWasMade = false;
			const groupId = this.groupId;
			const statusSuccess = {
				status: false
			};
			this.tagDialog = new ui_entitySelector.Dialog({
				id: item.getId().toString(),
				targetNode: targetNode,
				width: 400,
				height: 300,
				multiple: true,
				dropdownMode: true,
				enableSearch: true,
				compactView: true,
				searchOptions: {
					allowCreateItem: false
				},
				footer: BX.Tasks.EntitySelector.Footer,
				footerOptions: {
					userId: this.userId,
					groupId: groupId,
					onCreateTag: () => this.createTaskTag(this.tagDialog, statusSuccess, item)
				},
				offsetTop: 12,
				entities: [{
					id: 'task-tag',
					options: {
						groupId: this.groupId,
						taskId: item.getSourceId()
					}
				}],
				clearUnavailableItems: true,
				events: {
					'onLoad': baseEvent => {
						main_core.Dom.style(baseEvent.getTarget().getFooterContainer(), 'zIndex', 1);
						this.hideDialogLabel(baseEvent.getTarget());
					},
					'Item:onSelect': event => {
						choiceWasMade = true;
						const selectedItem = event.getData().item;
						const dialog = event.getTarget();
						selectedItem.setSort(1);
						dialog.getTab('all').getRootNode().addItem(selectedItem);
						const tag = selectedItem.getTitle();
						this.emit('attachTagToTask', tag);
					},
					'Item:onDeselect': event => {
						choiceWasMade = true;
						const deselectedItem = event.getData().item;
						const tag = deselectedItem.getTitle();
						this.emit('deAttachTagToTask', tag);
					},
					'onSearch': event => {
						this.onSearchCallback(event);
					}
				}
			});
			this.tagDialog.subscribe('onHide', () => {
				if (choiceWasMade) {
					this.emit('hideTagDialog');
				}
				this.tagDialog = null;
			});
			this.tagDialog.show();
		}
		showEpicDialog(item, targetNode) {
			const currentEpic = item.getEpic().getValue();
			const preselectedItems = [];
			if (currentEpic) {
				preselectedItems.push(['epic-selector', currentEpic.id]);
			}
			let choiceWasMade = false;
			this.epicDialog = new ui_entitySelector.Dialog({
				id: item.getId(),
				targetNode: targetNode,
				width: 400,
				height: 300,
				multiple: false,
				dropdownMode: true,
				enableSearch: true,
				offsetTop: 12,
				context: 'epic-selector-' + this.groupId,
				preselectedItems: preselectedItems,
				entities: [{
					id: 'epic-selector',
					options: {
						groupId: this.groupId
					},
					dynamicLoad: true,
					dynamicSearch: true
				}],
				searchOptions: {
					allowCreateItem: true,
					footerOptions: {
						label: main_core.Loc.getMessage('TASKS_SCRUM_SEARCHER_ACTIONS_EPIC_ADD')
					}
				},
				hideOnSelect: false,
				hideOnDeselect: false,
				events: {
					'Search:onItemCreateAsync': event => {
						return new Promise(resolve => {
							const {
								searchQuery
							} = event.getData();
							const epicName = searchQuery.getQuery();
							this.createEpic(epicName).then(epic => {
								this.addEpicToSearcher(epic, true);
								this.filterService.addItemToListTypeField('EPIC', {
									NAME: epic.name.trim(),
									VALUE: String(epic.id)
								});
								this.emit('updateItemEpic', epic);
								choiceWasMade = true;
								this.epicDialog.hide();
								resolve();
							});
						});
					},
					'Item:onSelect': event => {
						choiceWasMade = true;
						const selectedItem = event.getData().item;
						this.getEpic(selectedItem.getId()).then(epic => {
							this.emit('updateItemEpic', epic);
							this.epicDialog.hide();
						});
					},
					'Item:onDeselect': () => {
						setTimeout(() => {
							choiceWasMade = true;
							if (this.epicDialog.getSelectedItems().length === 0) {
								this.emit('updateItemEpic', null);
								this.epicDialog.hide();
							}
						}, 50);
					}
				},
				tagSelectorOptions: {
					textBoxWidth: 340,
					placeholder: main_core.Loc.getMessage('TASKS_SCRUM_ITEM_EPIC_SEARCHER_PLACEHOLDER')
				}
			});
			this.epicDialog.subscribe('onHide', () => {
				if (choiceWasMade) {
					this.emit('hideEpicDialog');
				}
				this.epicDialog = null;
			});
			this.epicDialog.show();
		}
		isEpicDialogShown() {
			return this.epicDialog && this.epicDialog.isOpen();
		}
		hasActionPanelDialog() {
			return this.epicDialog || this.tagDialog;
		}
		closeActionPanelDialogs() {
			if (this.epicDialog) {
				this.epicDialog.hide();
			}
			if (this.tagDialog) {
				this.tagDialog.hide();
			}
		}

		//widget on scrum (new task)
		showTagsSearchDialog(inputObject, enteredQuery) {
			if (this.tagsAreConverting) {
				inputObject.setTagsSearchMode(false);
				return;
			}
			const input = inputObject.getInputNode();
			const groupId = this.groupId;
			if (this.tagSearchDialog && this.tagSearchDialog.getId() !== inputObject.getNodeId()) {
				this.tagSearchDialog = null;
			}
			if (!this.tagSearchDialog) {
				this.tagSearchDialog = new ui_entitySelector.Dialog({
					id: inputObject.getNodeId(),
					targetNode: inputObject.getNode(),
					width: inputObject.getNode().offsetWidth,
					height: 210,
					multiple: false,
					dropdownMode: true,
					compactView: true,
					entities: [{
						id: 'task-tag',
						options: {
							groupId: this.groupId
						}
					}],
					tabOptions: {
						visible: false
					},
					searchOptions: {
						allowCreateItem: false
					},
					footer: BX.Tasks.EntitySelector.Footer,
					footerOptions: {
						userId: this.userId,
						groupId: groupId,
						onCreateTag: () => this.createQuickCreateTag(this.tagSearchDialog, inputObject)
					},
					clearUnavailableItems: true,
					events: {
						'onLoad': event => {
							main_core.Dom.style(event.getTarget().getFooterContainer(), 'zIndex', 1);
							this.hideDialogLabel(event.getTarget());
						},
						'onSearch': event => {
							this.onSearchCallback(event);
						},
						'Item:onSelect': event => {
							let newValue = '';
							const regex = new RegExp('\\s|#$', 'm');
							const currentPiece = input.value.split(regex).pop();
							input.value.split(regex).forEach(pieceOfValue => {
								if (currentPiece !== pieceOfValue) {
									newValue = newValue + ' ' + pieceOfValue;
								}
							});
							const selectedItem = event.getData().item;
							const dialog = event.getTarget();
							selectedItem.setSort(1);
							dialog.getTab('all').getRootNode().addItem(selectedItem);
							newValue = newValue + ' #' + selectedItem.getTitle();
							input.value = newValue.trim();
							input.focus();
							selectedItem.deselect();
						}
					}
				});
				this.tagSearchDialog.subscribe('onHide', () => {
					inputObject.setTagsSearchMode(false);
					this.tagSearchDialog = null;
				});
				inputObject.subscribe('onEnter', event => {
					if (main_core.Type.isNil(this.tagSearchDialog)) {
						return;
					}
					const searchTab = this.tagSearchDialog.getSearchTab();
					if (main_core.Type.isNil(searchTab)) {
						return;
					}
					if (searchTab.isEmptyResult()) {
						this.tagSearchDialog.hide();
						input.focus();
					}
				});
			}
			inputObject.setTagsSearchMode(true);
			this.tagSearchDialog.show();
			this.tagSearchDialog.search(enteredQuery);
		}
		closeTagsSearchDialog() {
			if (this.tagSearchDialog) {
				this.tagSearchDialog.hide();
			}
		}
		showEpicSearchDialog(inputObject, enteredQuery) {
			const input = inputObject.getInputNode();
			this.epicEnteredQuery = enteredQuery;
			if (this.epicSearchDialog && this.epicSearchDialog.getId() !== inputObject.getNodeId()) {
				this.epicSearchDialog = null;
			}
			if (!this.epicSearchDialog) {
				this.epicSearchDialog = new ui_entitySelector.Dialog({
					id: inputObject.getNodeId(),
					targetNode: inputObject.getNode(),
					width: inputObject.getNode().offsetWidth,
					height: 210,
					multiple: false,
					dropdownMode: true,
					searchOptions: {
						allowCreateItem: true,
						footerOptions: {
							label: main_core.Loc.getMessage('TASKS_SCRUM_SEARCHER_ACTIONS_EPIC_ADD')
						}
					},
					context: 'epic-selector-' + this.groupId,
					entities: [{
						id: 'epic-selector',
						options: {
							groupId: this.groupId
						},
						dynamicLoad: true,
						dynamicSearch: true
					}],
					events: {
						'Search:onItemCreateAsync': event => {
							return new Promise(resolve => {
								const {
									searchQuery
								} = event.getData();
								const epicName = searchQuery.getQuery();
								inputObject.disable();
								inputObject.setSelectedEpicLength([...epicName].length);
								input.focus();
								this.createEpic(epicName).then(epic => {
									this.addEpicToSearcher(epic);
									this.filterService.addItemToListTypeField('EPIC', {
										NAME: epic.name.trim(),
										VALUE: String(epic.id)
									});
									inputObject.unDisable();
									input.focus();
									inputObject.setEpic(epic);
									resolve();
								});
								this.epicSearchDialog.hide();
							});
						},
						'Item:onSelect': event => {
							const selectedItem = event.getData().item;
							this.getEpic(selectedItem.getId()).then(epic => {
								inputObject.setEpic(epic);
							});
							const epicName = selectedItem.getTitle();
							input.value = input.value.replace('@' + this.epicEnteredQuery, '').replace('@', '');
							input.value = input.value + '@' + epicName;
							inputObject.setSelectedEpicLength([...epicName].length);
							input.focus();
							selectedItem.deselect();
						}
					}
				});
				this.epicSearchDialog.subscribe('onHide', () => {
					inputObject.setEpicSearchMode(false);
					this.epicSearchDialog = null;
				});
				inputObject.subscribe('onMetaEnter', () => {
					if (main_core.Type.isNil(this.epicSearchDialog)) {
						return;
					}
					const searchTab = this.epicSearchDialog.getSearchTab();
					if (main_core.Type.isNil(searchTab)) {
						return;
					}
					const lastSearchQuery = searchTab.getLastSearchQuery();
					if (main_core.Type.isNil(lastSearchQuery)) {
						return;
					}
					const epicName = lastSearchQuery.getQuery();
					inputObject.disable();
					inputObject.setSelectedEpicLength([...epicName].length);
					input.focus();
					this.createEpic(epicName).then(epic => {
						this.addEpicToSearcher(epic);
						this.filterService.addItemToListTypeField('EPIC', {
							NAME: epic.name.trim(),
							VALUE: String(epic.id)
						});
						inputObject.unDisable();
						input.focus();
						inputObject.setEpic(epic);
					});
					this.epicSearchDialog.hide();
					this.epicSearchDialog = null;
				});
			}
			inputObject.setEpicSearchMode(true);
			this.epicSearchDialog.show();
			this.epicSearchDialog.search(this.epicEnteredQuery);
		}
		closeEpicSearchDialog() {
			if (this.epicSearchDialog) {
				this.epicSearchDialog.hide();
			}
		}
		createEpic(epicName) {
			return this.requestSender.createEpic({
				groupId: this.groupId,
				name: epicName
			}).then(response => {
				return response.data;
			});
		}
		getEpic(epicId) {
			return this.requestSender.getEpic({
				groupId: this.groupId,
				epicId: epicId
			}).then(response => {
				return response.data;
			});
		}
		static getHashTagNamesFromText(inputText) {
			const regex = new RegExp(TagSearcher.tagRegExp, 'g');
			const matches = [];
			let match;
			while (match = regex.exec(inputText)) {
				matches.push(match[0].substring(1));
			}
			return matches;
		}
		static getHashEpicNamesFromText(inputText) {
			const regex = new RegExp(TagSearcher.epicRegExp, 'g');
			const matches = [];
			let match;
			while (match = regex.exec(inputText)) {
				matches.push(match[0].substring(1));
			}
			return matches;
		}
		hideDialogLabel(dialog) {
			//todo tmp, remove after update selector
			dialog.getContainer().querySelectorAll('.ui-selector-tab-label').forEach(label => {
				main_core.Dom.addClass(label, 'ui-selector-tab-label-hidden');
			});
		}
		onSearchCallback(event) {
			const dialog = event.getTarget();
			dialog.getFooter().setSearchQuery(event.getData().query);
		}
		createQuickCreateTag(dialog, inputObject) {
			if (!dialog) {
				return;
			}
			const input = inputObject.getInputNode();
			const regex = new RegExp('\\s|#$', 'm');
			const currentPiece = input.value.split(regex).pop();
			const tagName = currentPiece.replace('#', '').trim();
			if (tagName === '') {
				return;
			}
			this.requestSender.addTag({
				newTag: tagName,
				groupId: this.groupId,
				taskId: 0,
				action: 'add'
			}).then(response => {
				if (!response.data.success) {
					const alertClass = 'tasks-scrum-tag-already-exists-alert';
					this.showAlert(dialog.getId(), alertClass, response.data.error);
					setTimeout(() => {
						this.removeAlert(dialog, alertClass);
					}, 2000);
					return;
				}
				dialog.search(tagName);
			});
		}
		createTaskTag(dialog, statusSuccess, item) {
			if (!dialog) {
				return;
			}
			const tag = dialog.getTagSelectorQuery();
			if (tag.trim() === '') {
				return;
			}
			this.requestSender.updateTaskTags({
				tag,
				itemIds: [item.getId()],
				groupId: this.groupId,
				action: 'add'
			}).then(response => {
				if (response.data.success) {
					statusSuccess.status = true;
					const createdItem = dialog.addItem({
						id: tag,
						entityId: 'task-tag',
						title: tag,
						sort: 1,
						badges: [{
							title: response.data.group
						}]
					});
					dialog.getTab('all').getRootNode().addItem(createdItem);
					createdItem.select();
					dialog.getTagSelector().clearTextBox();
					dialog.getFooter().setSearchQuery(dialog.getTagSelectorQuery());
					dialog.focusSearch();
					dialog.selectFirstTab();
					return;
				}
				const alertClass = 'tasks-scrum-tag-already-exists-alert';
				this.showAlert(dialog.getId(), alertClass, response.data.error);
				setTimeout(() => {
					this.removeAlert(dialog, alertClass);
				}, 3000);
			});
		}
		showAlert(dialogId, className, error, messageType = 'ui-alert ui-alert-xs ui-alert-danger') {
			const dialog = BX.UI.EntitySelector.Dialog.getById(dialogId);
			if (dialog.getContainer().querySelector(`div.${className}`)) {
				return;
			}
			const alert = document.createElement('div');
			alert.className = className;
			alert.innerHTML = `
						<div class='${messageType}'  
							<span class='ui-alert-message'>
								${error}
							</span> 
						</div>
					`;
			dialog.getFooterContainer().before(alert);
		}
		removeAlert(dialog, className) {
			const notification = dialog.getContainer().querySelector(`div.${className}`);
			if (notification) {
				notification.remove();
			}
		}
		showConvertingMessage() {
			const message = new ui_dialogs_messagebox.MessageBox({
				title: main_core.Loc.getMessage('TASKS_SCRUM_TAG_SELECTOR_TAGS_ARE_CONVERTING_TITLE'),
				message: main_core.Loc.getMessage('TASKS_SCRUM_TAG_SELECTOR_TAGS_ARE_CONVERTING_TEXT'),
				buttons: ui_dialogs_messagebox.MessageBoxButtons.OK,
				okCaption: main_core.Loc.getMessage('TASKS_SCRUM_TAG_SELECTOR_TAGS_ARE_CONVERTING_COME_BACK_LATER'),
				onOk: function () {
					message.close();
				}
			});
			message.show();
		}
	}

	class Input extends main_core_events.EventEmitter {
		constructor() {
			super();
			this.setEventNamespace('BX.Tasks.Scrum.Input');
			this.entity = null;
			this.bindNode = null;
			this.node = null;
			this.value = '';
			this.epic = null;
			this.taskCreated = false;
			this.selectedEpicLength = 0;
		}
		setEntity(entity) {
			this.entity = entity;
		}
		getEntity() {
			return this.entity;
		}
		hasEntity(entity) {
			return this.entity && this.entity.getId() === entity.getId();
		}
		setBindNode(node) {
			this.bindNode = node;
		}
		getBindNode() {
			return this.bindNode;
		}
		cleanBindNode() {
			this.bindNode = null;
		}
		render() {
			this.nodeId = main_core.Text.getRandom();
			this.node = main_core.Tag.render`
			<div id="${main_core.Text.encode(this.nodeId)}" class="tasks-scrum__input --add-block">
				<textarea
					placeholder="${main_core.Loc.getMessage('TASKS_SCRUM_TASK_ADD_INPUT_TASK_PLACEHOLDER')}"
					class="tasks-scrum__input--textarea"
				>${main_core.Text.encode(this.value)}</textarea>
				<div class="tasks-scrum__input--textarea-help">
					${main_core.Loc.getMessage('TASKS_SCRUM_TASK_ADD_INPUT_TASK_PLACEHOLDER_HELPER')}
				</div>
			</div>
		`;
			main_core.Event.bind(this.getInputNode(), 'input', event => {
				this.onTagSearch(event);
				this.onEpicSearch(event);
			});
			main_core.Event.bind(this.getInputNode(), 'keydown', this.onKeydown.bind(this));
			main_core.Event.bind(this.getInputNode(), 'blur', this.onBlur.bind(this));
			this.emit('render');
			this.taskCreated = false;
			return this.node;
		}
		onKeydown(event) {
			if (event.key === 'Escape' || event.key === 'Enter') {
				if (!this.isTagsSearchMode() && !this.isEpicSearchMode()) {
					this.submit();
					event.stopImmediatePropagation();
				}
				if (event.key === 'Enter' && !(main_core.Browser.isMac() && event.metaKey || event.ctrlKey)) {
					this.emit('onEnter', {
						event
					});
				}
				if (event.key === 'Enter' && (main_core.Browser.isMac() && event.metaKey || event.ctrlKey)) {
					this.emit('onMetaEnter', {
						event
					});
				}
			}
		}
		onBlur() {
			const input = this.getInputNode();
			if (input.value === '') {
				this.removeYourself();
			}
		}
		onTagSearch(event) {
			const currentPieceOfName = event.target.value.split(' ').pop();
			const enteredHashTags = TagSearcher.getHashTagNamesFromText(currentPieceOfName);
			const query = enteredHashTags.length ? enteredHashTags.pop() : '';
			if (query || event.data === '#') {
				this.setEpicSearchMode(false);
				this.setTagsSearchMode(true);
				this.emit('tagsSearchOpen', query);
			} else {
				this.emit('tagsSearchClose');
			}
		}
		submit() {
			this.disable();
			if (this.isEmpty()) {
				this.removeYourself();
			} else {
				this.createTaskItem();
			}
		}
		onEpicSearch(event) {
			const inputNode = event.target;
			const enteredHashEpics = TagSearcher.getHashEpicNamesFromText(inputNode.value);
			const query = enteredHashEpics.length ? enteredHashEpics.pop() : '';
			if (this.selectedEpicLength > 0 && this.selectedEpicLength <= [...query].length) {
				return;
			}
			this.selectedEpicLength = 0;
			if (query || event.data === '@') {
				this.setTagsSearchMode(false);
				this.setEpicSearchMode(true);
				this.emit('epicSearchOpen', query);
			} else {
				this.emit('epicSearchClose');
			}
		}
		focus() {
			const input = this.getInputNode();
			const length = input.value.length;
			input.focus();
			input.setSelectionRange(length, length);
		}
		disable() {
			main_core.Dom.addClass(this.node, '--disabled');
			this.getInputNode().disabled = true;
		}
		unDisable() {
			main_core.Dom.removeClass(this.node, '--disabled');
			this.getInputNode().disabled = false;
			this.emit('unDisable');
		}
		isExists() {
			return !main_core.Type.isNull(this.node);
		}
		isEmpty() {
			if (!this.isExists()) {
				return true;
			}
			const input = this.getInputNode();
			return input.value === '';
		}
		isTaskCreated() {
			return this.taskCreated;
		}
		setEpic(epic) {
			this.epic = epic;
		}
		getNode() {
			return this.node;
		}
		getNodeId() {
			return this.nodeId;
		}
		getInputNode() {
			return this.node.querySelector('textarea');
		}
		getEpic() {
			return this.epic;
		}
		removeYourself() {
			main_core.Dom.remove(this.node);
			this.node = null;
			this.emit('remove');
		}
		setTagsSearchMode(value) {
			main_core.Dom.attr(this.getInputNode(), 'data-tag-disabled', value);
		}
		isTagsSearchMode() {
			return main_core.Dom.attr(this.getInputNode(), 'data-tag-disabled');
		}
		setEpicSearchMode(value) {
			main_core.Dom.attr(this.getInputNode(), 'data-epic-disabled', value);
		}
		isEpicSearchMode() {
			return main_core.Dom.attr(this.getInputNode(), 'data-epic-disabled');
		}
		setSelectedEpicLength(length) {
			this.selectedEpicLength = parseInt(length, 10);
		}
		createTaskItem() {
			const input = this.getInputNode();
			if (input.value) {
				this.emit('createTaskItem', input.value);
				this.taskCreated = true;
				input.value = '';
			}
		}
	}

	class Entity extends main_core_events.EventEmitter {
		constructor(params) {
			super(params);
			this.setEventNamespace('BX.Tasks.Scrum.Entity');
			this.storyPoints = new StoryPointsStorage();
			this.items = new Map();
			this.groupMode = false;
			this.groupModeItems = new Map();
			this.setEntityParams(params);
			this.observerLoadItems = null;
			this.node = null;
			this.listItems = null;
			this.listLoader = null;
			this.itemLoader = null;
			this.itemsLoaderNode = null;
			this.blank = null;
			this.dropzone = null;
			this.emptySearchStub = null;
			this.hideCont = false;
		}
		setEntityParams(params) {
			this.setId(params.id);
			this.setViews(params.views);
			this.setNumberTasks(params.numberTasks);
			this.setStoryPoints(params.storyPoints);
			this.setShortView(params.isShortView);
			this.setMandatory(params.mandatoryExists);
			this.setExactSearchApplied(params.isExactSearchApplied);
			this.pageSize = parseInt(params.pageSize, 10);
			this.setPageNumberItems(params.pageNumberItems);
		}
		setListItems(entity) {
			this.listItems = new ListItems(entity);
		}
		getListItems() {
			return this.listItems;
		}
		setShortView(value) {
			this.shortView = value === 'Y' ? 'Y' : 'N';
			this.getItems().forEach(item => {
				if (item.isParentTask() && item.isShownSubTasks()) {
					item.hideSubTasks();
				}
				item.setShortView(this.shortView);
			});
		}
		getShortView() {
			return this.shortView;
		}
		isShortView() {
			return this.shortView === 'Y';
		}
		setMandatory(value) {
			this.mandatoryExists = value === 'Y';
		}
		getNode() {
			return this.node;
		}
		setId(id) {
			this.id = main_core.Type.isInteger(id) ? parseInt(id, 10) : 0;
			if (this.listItems) {
				this.listItems.setEntityId(this.id);
			}
		}
		getId() {
			return this.id;
		}
		setViews(views) {
			this.views = main_core.Type.isPlainObject(views) ? views : {};
		}
		getViews() {
			return this.views;
		}
		getEntityType() {
			return 'entity';
		}
		isBacklog() {
			return this.getEntityType() === 'backlog';
		}
		isHideContent() {
			return this.hideCont;
		}
		isActive() {
			return false;
		}
		isCompleted() {
			return false;
		}
		getListItemsNode() {
			return this.listItems ? this.listItems.getListNode() : null;
		}
		isEmpty() {
			return this.items.size === 0;
		}
		getNumberItems() {
			return this.items.size;
		}
		getItems() {
			return this.items;
		}
		hasItem(item) {
			return this.items.has(item.getId());
		}
		getPageSize() {
			return this.pageSize;
		}
		getPageNumberItems() {
			return this.pageNumberItems;
		}
		setPageNumberItems(pageNumberItems) {
			if (main_core.Type.isInteger(pageNumberItems)) {
				pageNumberItems = parseInt(pageNumberItems, 10);
			}
			this.pageNumberItems = pageNumberItems ? pageNumberItems : 1;
		}
		incrementPageNumberItems() {
			this.pageNumberItems++;
		}
		decrementPageNumberItems() {
			this.pageNumberItems--;
		}
		setItem(newItem) {
			this.items.set(newItem.getId(), newItem);
			this.subscribeToItem(newItem);
			[...this.items.values()].map(item => {
				this.setItemMoveActivity(item);
			});
			newItem.setEntityType(this.getEntityType());
			newItem.setShortView(this.getShortView());
			this.hideBlank();
			this.hideDropzone();
			this.hideEmptySearchStub();
			this.adjustListItemsWidth();
		}
		setItemMoveActivity(item) {
			item.setMoveActivity(this.items.size > 2);
		}
		removeItem(item) {
			this.removeItems([item]);
		}
		removeItems(items, removeNodes = false) {
			const itemsToRemove = new Map();
			const rootsToRemove = [];
			const collect = item => {
				if (!this.items.has(item.getId()) || itemsToRemove.has(item.getId())) {
					return;
				}
				itemsToRemove.set(item.getId(), item);
				if (item.isParentTask()) {
					item.getSubTasks().getList().forEach(collect);
				}
			};
			items.forEach(item => {
				if (this.items.has(item.getId()) && !itemsToRemove.has(item.getId())) {
					rootsToRemove.push(item);
					collect(item);
				}
			});
			if (itemsToRemove.size === 0) {
				return 0;
			}
			itemsToRemove.forEach(item => {
				this.items.delete(item.getId());
				item.unsubscribeAll();
			});
			this.items.forEach(item => this.setItemMoveActivity(item));
			if (removeNodes) {
				this.setNumberTasks(Math.max(0, this.numberTasks - itemsToRemove.size));
				rootsToRemove.forEach(item => item.removeYourself());
			}
			this.pageNumberItems = 1;
			this.adjustListItemsWidth();
			return itemsToRemove.size;
		}
		appendItemToList(item) {
			main_core.Dom.insertBefore(item.render(), this.getListItemsNode().lastElementChild);
			this.adjustListItemsWidth();
		}
		isNodeCreated() {
			return !main_core.Type.isNull(this.node);
		}
		setNumberTasks(numberTasks) {
			this.numberTasks = main_core.Type.isInteger(numberTasks) ? parseInt(numberTasks, 10) : 0;
		}
		getNumberTasks() {
			return this.numberTasks ? this.numberTasks : this.getItems().size;
		}
		setExactSearchApplied(value) {
			this.exactSearchApplied = value === 'Y';
		}
		isExactSearchApplied() {
			return this.exactSearchApplied;
		}
		onAfterAppend() {
			[...this.items.values()].map(item => {
				this.subscribeToItem(item);
				this.setItemMoveActivity(item);
			});
			this.setStats();
			if (!this.isCompleted()) {
				this.itemsLoaderNode = this.getNode().querySelector('.tasks-scrum-entity-items-loader');
				if (this.getNumberItems() >= this.pageSize) {
					this.bindItemsLoader();
				}
			}
			this.adjustListItemsWidth();
		}
		subscribeToItem(item) {
			if (!this.getListItemsNode()) {
				return;
			}
			item.setEntityType(this.getEntityType());
			item.subscribe('updateItem', baseEvent => {
				this.emit('updateItem', baseEvent.getData());
			});
			item.subscribe('showTask', baseEvent => {
				this.emit('showTask', baseEvent.getTarget());
			});
			item.subscribe('destroyActionPanel', baseEvent => {
				this.emit('destroyActionPanel', baseEvent.getTarget());
			});
			item.subscribe('changeTaskResponsible', baseEvent => {
				this.emit('changeTaskResponsible', baseEvent.getTarget());
			});
			item.subscribe('onShowResponsibleDialog', baseEvent => {
				this.emit('onShowResponsibleDialog', baseEvent.getData());
			});
			item.subscribe('filterByEpic', baseEvent => {
				this.emit('filterByEpic', baseEvent.getData());
			});
			item.subscribe('filterByTag', baseEvent => {
				this.emit('filterByTag', baseEvent.getData());
			});
			item.subscribe('toggleActionPanel', baseEvent => {
				this.emit('toggleActionPanel', baseEvent.getTarget());
			});
			item.subscribe('showLinked', baseEvent => {
				this.emit('showLinked', baseEvent.getTarget());
			});
		}
		getItemByItemId(itemId) {
			return this.items.get(main_core.Type.isInteger(itemId) ? parseInt(itemId, 10) : itemId);
		}
		getItemBySourceId(sourceId) {
			return [...this.items.values()].find(item => item.getSourceId() === sourceId);
		}
		getItemsByParentTaskId(parentTaskId) {
			const items = new Map();
			[...this.items.values()].map(item => {
				if (item.getParentTaskId() === parentTaskId) {
					items.set(item.getId(), item);
				}
			});
			return items;
		}
		setStoryPoints(storyPoints) {
			this.storyPoints.setPoints(storyPoints);
			this.setStats();
		}
		getStoryPoints() {
			return this.storyPoints;
		}
		isFirstItem(item) {
			const listItemsNode = this.getListItemsNode();
			const itemNode = item.getNode();
			const firstElementChild = listItemsNode.firstElementChild;
			return firstElementChild.isEqualNode(itemNode);
		}
		isLastItem(item) {
			const listItemsNode = this.getListItemsNode();
			const itemNode = item.getNode();
			const loaderNode = this.getLoaderNode();
			if (listItemsNode.lastElementChild.isEqualNode(loaderNode)) {
				return loaderNode.previousElementSibling.isEqualNode(itemNode);
			} else {
				return listItemsNode.lastElementChild.isEqualNode(itemNode);
			}
		}
		getFirstItemNode(input) {
			const listItemsNode = this.getListItemsNode();
			const fistNode = listItemsNode.firstElementChild;
			if (input && fistNode.isEqualNode(input.getNode())) {
				return fistNode.nextElementSibling;
			} else {
				return fistNode;
			}
		}
		getLoaderNode() {
			return this.itemsLoaderNode ? this.itemsLoaderNode : null;
		}
		fadeOut() {
			main_core.Dom.addClass(this.getListItemsNode(), 'tasks-scrum__entity-items-faded');
		}
		fadeIn() {
			main_core.Dom.removeClass(this.getListItemsNode(), 'tasks-scrum__entity-items-faded');
		}
		activateGroupMode() {
			this.groupMode = true;
			this.getItems().forEach(item => {
				item.activateGroupMode();
			});
		}
		deactivateGroupMode() {
			this.groupMode = false;
			this.getItems().forEach(item => {
				item.deactivateGroupMode();
			});
			this.groupModeItems.forEach(item => {
				item.removeItemFromGroupMode();
			});
			this.groupModeItems.clear();
			this.emit('deactivateGroupMode');
		}
		isGroupMode() {
			return this.groupMode;
		}
		addItemToGroupMode(item) {
			this.groupModeItems.set(item.getId(), item);
			item.addItemToGroupMode();
		}
		removeItemFromGroupMode(item) {
			this.groupModeItems.delete(item.getId());
			item.removeItemFromGroupMode();
		}
		hasItemInGroupMode(item) {
			return this.groupModeItems.has(item.getId());
		}
		getGroupModeItems() {
			return this.groupModeItems;
		}
		bindItemsLoader() {
			if (!this.itemsLoaderNode) {
				return;
			}
			this.waitingLoadItems = true;
			main_core.Dom.addClass(this.itemsLoaderNode, '--waiting');
			this.showItemsLoader();
			if (main_core.Type.isUndefined(IntersectionObserver)) {
				return;
			}
			if (this.observerLoadItems) {
				this.observerLoadItems.disconnect();
			}
			this.observerLoadItems = new IntersectionObserver(entries => {
				if (entries[0].isIntersecting === true) {
					if (!this.isActiveLoadItems()) {
						this.emit('loadItems');
					}
				}
			}, {
				threshold: [0]
			});
			this.observerLoadItems.observe(this.itemsLoaderNode);
		}
		unbindItemsLoader() {
			this.waitingLoadItems = false;
			if (this.observerLoadItems) {
				this.observerLoadItems.disconnect();
			}
			if (this.itemsLoaderNode) {
				this.hideItemsLoader();
				main_core.Dom.removeClass(this.itemsLoaderNode, '--waiting');
			}
		}
		isWaitingLoadItems() {
			return this.waitingLoadItems;
		}
		setActiveLoadItems(value) {
			this.activeLoadItems = Boolean(value);
		}
		isActiveLoadItems() {
			return this.activeLoadItems === true;
		}
		showListLoader() {
			if (this.listLoader) {
				this.listLoader.destroy();
			}
			const targetNode = this.getNode();
			const position = main_core.Dom.getPosition(targetNode);
			const offset = this.isBacklog() ? {
				top: `${position.top + (position.height / 2 - 55)}px`,
				left: `${position.left + (position.width / 2 - 55)}px`
			} : {
				top: `${position.top}px`,
				left: `${position.width / 2 - 55}px`
			};
			this.listLoader = new main_loader.Loader({
				target: targetNode,
				mode: 'custom',
				offset: offset
			});
			this.listLoader.show();
			return this.listLoader;
		}
		hideListLoader() {
			if (this.listLoader) {
				this.listLoader.hide();
			}
		}
		showItemsLoader() {
			const listPosition = main_core.Dom.getPosition(this.itemsLoaderNode);
			if (this.itemLoader) {
				this.itemLoader.destroy();
			}
			this.itemLoader = new main_loader.Loader({
				target: this.itemsLoaderNode,
				size: 60,
				mode: 'inline',
				offset: {
					top: '7px',
					left: `${listPosition.width / 2 - 45}px`
				}
			});
			if (this.getNumberItems() >= this.pageSize) {
				this.itemLoader.show();
			}
			return this.itemLoader;
		}
		hideItemsLoader() {
			if (this.itemLoader) {
				this.itemLoader.hide();
			}
		}
		setStats() {}
		showBlank() {
			if (this.blank) {
				main_core.Dom.addClass(this.blank.getNode(), '--open');
			}
		}
		hideBlank() {
			if (this.blank) {
				main_core.Dom.removeClass(this.blank.getNode(), '--open');
			}
		}
		showDropzone() {
			if (this.dropzone) {
				main_core.Dom.addClass(this.dropzone.getNode(), '--open');
			}
		}
		hideDropzone() {
			if (this.dropzone) {
				main_core.Dom.removeClass(this.dropzone.getNode(), '--open');
			}
		}
		showEmptySearchStub() {
			if (this.emptySearchStub) {
				main_core.Dom.addClass(this.emptySearchStub.getNode(), '--open');
			}
		}
		hideEmptySearchStub() {
			if (this.emptySearchStub) {
				main_core.Dom.removeClass(this.emptySearchStub.getNode(), '--open');
			}
		}
		getDropzone() {
			return this.dropzone ? this.dropzone.getNode() : null;
		}
		appendNodeAfterItem(newItemNode, bindItemNode) {
			if (bindItemNode.nextElementSibling) {
				main_core.Dom.insertBefore(newItemNode, bindItemNode.nextElementSibling);
			} else {
				if (this.getLoaderNode()) {
					main_core.Dom.append(newItemNode, this.getLoaderNode());
				} else {
					main_core.Dom.append(newItemNode, this.getListItemsNode());
				}
			}
		}
		adjustListItemsWidth() {
			if (main_core.Type.isNull(this.getListItemsNode())) {
				return;
			}
			const hasListItemsScroll = this.getListItemsNode().scrollHeight > this.getListItemsNode().clientHeight;
			if (hasListItemsScroll) {
				this.getListItems().addScrollbar();
			} else {
				this.getListItems().removeScrollbar();
			}
		}
	}

	let Header$1 = class Header extends main_core_events.EventEmitter {
		constructor(backlog) {
			super(backlog);
			this.setEventNamespace('BX.Tasks.Scrum.BacklogHeader');
			this.backlog = backlog;
			this.epicButtonLocked = false;
			this.taskButtonLocked = false;
			this.node = null;
			this.epicButton = null;
			this.taskButton = null;
		}
		render() {
			const uiEpicClasses = 'ui-btn ui-btn-sm ui-btn-light-border ui-btn-themes ui-btn-round ui-btn-no-caps';
			const uiTaskClasses = 'ui-btn ui-btn-sm ui-btn-success ui-btn-round ui-btn-no-caps ';
			this.node = main_core.Tag.render`
			<div class="tasks-scrum__content-header">

				<div class="tasks-scrum__name-container">
					<div class="tasks-scrum__title">
						${main_core.Loc.getMessage('TASKS_SCRUM_BACKLOG_TITLE')}
					</div>
					${this.renderTaskCounterLabel(this.backlog.getNumberTasks())}
				</div>

				<button class="tasks-scrum__backlog-btn ${uiEpicClasses} ui-btn-icon-add">
					${main_core.Loc.getMessage('TASKS_SCRUM_BACKLOG_HEADER_EPIC')}
				</button>
				<button class="tasks-scrum__backlog-btn ${uiTaskClasses} ui-btn-icon-add">
					${main_core.Loc.getMessage('TASKS_SCRUM_BACKLOG_HEADER_TASK')}
				</button>

			</div>
		`;
			const buttons = this.node.querySelectorAll('button');
			this.epicButton = buttons.item(0);
			this.taskButton = buttons.item(1);
			main_core.Event.bind(buttons.item(0), 'click', this.onEpicClick.bind(this));
			main_core.Event.bind(buttons.item(1), 'click', this.onTaskClick.bind(this));
			return this.node;
		}
		updateTaskCounter(value) {
			main_core.Dom.replace(this.node.querySelector('.tasks-scrum__backlog-tasks'), this.renderTaskCounterLabel(value));
		}
		renderTaskCounterLabel(value) {
			return main_core.Tag.render`
			<div class="tasks-scrum__backlog-tasks">
				${main_core.Loc.getMessage('TASKS_SCRUM_BACKLOG_HEADER_TASK_COUNTER').replace('#value#', value)}
			</div>
		`;
		}
		unLockEpicButton() {
			this.epicButtonLocked = false;
			main_core.Dom.removeClass(this.epicButton, 'ui-btn-wait');
		}
		lockEpicButton() {
			this.epicButtonLocked = true;
			main_core.Dom.addClass(this.epicButton, 'ui-btn-wait');
		}
		unLockTaskButton() {
			this.taskButtonLocked = false;
			main_core.Dom.removeClass(this.taskButton, 'ui-btn-wait');
		}
		lockTaskButton() {
			this.taskButtonLocked = true;
			main_core.Dom.addClass(this.taskButton, 'ui-btn-wait');
		}
		onEpicClick() {
			if (this.epicButtonLocked) {
				return;
			}
			this.lockEpicButton();
			this.emit('epicClick');
		}
		onTaskClick() {
			if (this.taskButtonLocked) {
				return;
			}
			this.lockTaskButton();
			this.emit('taskClick');
		}
	};

	class Blank {
		constructor(entity) {
			this.entity = entity;
			this.node = null;
		}
		render() {
			if (this.entity.isBacklog()) {
				return this.renderBacklog();
			} else if (this.entity.isCompleted()) {
				return this.renderCompletedSprint();
			}
		}
		renderBacklog() {
			this.node = main_core.Tag.render`
			<div class="tasks-scrum__backlog-empty">
				<div class="tasks-scrum__backlog-empty--icon"></div>
				<div class="tasks-scrum__backlog-empty--title">
					${main_core.Loc.getMessage('TASKS_SCRUM_BACKLOG_BLANK_1')}
				</div>
				<div class="tasks-scrum__backlog-empty--subtitle">
					${main_core.Loc.getMessage('TASKS_SCRUM_BACKLOG_BLANK_2')}
				</div>
				<div class="tasks-scrum__backlog-empty--text">
					${main_core.Loc.getMessage('TASKS_SCRUM_BACKLOG_BLANK_3')}
				</div>
				<div class="tasks-scrum__backlog-empty--text">
					${main_core.Loc.getMessage('TASKS_SCRUM_BACKLOG_BLANK_4')}
				</div>
			</div>
		`;
			return this.node;
		}
		renderCompletedSprint() {
			this.node = main_core.Tag.render`
			<div class="tasks-scrum__sprints--completed-empty">
				${main_core.Loc.getMessage('TASKS_SCRUM_COMPLETED_SPRINT_EMPTY')}
			</div>
		`;
			return this.node;
		}
		getNode() {
			return this.node;
		}
		removeNode() {
			main_core.Dom.remove(this.node);
			this.node = null;
		}
	}

	class Dropzone extends main_core_events.EventEmitter {
		constructor(entity) {
			super(entity);
			this.setEventNamespace('BX.Tasks.Scrum.Dropzone');
			this.entity = entity;
			this.mandatoryExists = false;
			this.node = null;
		}
		render() {
			if (this.entity.isBacklog()) {
				return this.renderBacklog();
			} else {
				return this.renderSprint();
			}
		}
		getNode() {
			return this.node;
		}
		removeNode() {
			main_core.Dom.remove(this.node);
			this.node = null;
		}
		renderBacklog() {
			this.node = main_core.Tag.render`
			<div class="tasks-scrum__content-empty --empty-backlog" data-entity-id="${this.entity.getId()}">
				${main_core.Loc.getMessage('TASKS_SCRUM_BACKLOG_DROPZONE_1')}
			</div>
		`;
			main_core.Event.bind(this.node, 'click', () => this.emit('createTask'));
			return this.node;
		}
		renderSprint() {
			this.node = main_core.Tag.render`
			<div class="tasks-scrum__content-empty" data-entity-id="${this.entity.getId()}">
				<div class="tasks-scrum__content-empty--title">
					${main_core.Loc.getMessage('TASKS_SCRUM_SPRINT_BLANK_1')}
				</div>
				${this.renderSprintEmptyText()}
			</div>
		`;
			if (!this.mandatoryExists) {
				main_core.Event.bind(this.node.querySelector('.tasks-scrum__content-empty--btn-create'), 'click', () => this.emit('createTask'));
			}
			return this.node;
		}
		renderSprintEmptyText() {
			if (this.mandatoryExists) {
				return main_core.Tag.render`
				<div class="tasks-scrum__content-empty--text">
					${main_core.Loc.getMessage('TASKS_SCRUM_SPRINT_BLANK_4')}
				</div>
			`;
			} else {
				return main_core.Tag.render`
				<div class="tasks-scrum__content-empty--text">
					<span class="tasks-scrum__content-empty--btn-create">
						${main_core.Loc.getMessage('TASKS_SCRUM_SPRINT_BLANK_2')}
					</span> ${main_core.Loc.getMessage('TASKS_SCRUM_SPRINT_BLANK_3')}
				</div>
			`;
			}
		}
		setMandatory() {
			this.mandatoryExists = true;
		}
	}

	class EmptySearchStub {
		constructor(entity) {
			this.entity = entity;
			this.node = null;
		}
		render() {
			this.node = main_core.Tag.render`
			<div class="tasks-scrum__content-empty --no-results">
				${this.getStubText()}
			</div>
		`;
			return this.node;
		}
		getNode() {
			return this.node;
		}
		getStubText() {
			if (this.entity.isBacklog()) {
				return main_core.Loc.getMessage('TASKS_SCRUM_EMPTY_SEARCH_STUB_BACKLOG');
			} else {
				return main_core.Loc.getMessage('TASKS_SCRUM_EMPTY_SEARCH_STUB_SPRINT');
			}
		}
	}

	class Backlog extends Entity {
		constructor(params) {
			super(params);
			this.setEventNamespace('BX.Tasks.Scrum.Backlog');
			this.setBacklogParams(params);
			this.header = null;
		}
		setBacklogParams(params) {
			params.items.forEach(itemData => {
				const item = Item.buildItem(itemData);
				item.setShortView(this.getShortView());
				this.items.set(item.getId(), item);
			});
		}
		static buildBacklog(backlogData) {
			const backlog = new Backlog(backlogData);
			backlog.setHeader(backlog);
			backlog.setBlank(backlog);
			backlog.setDropzone(backlog);
			backlog.setEmptySearchStub(backlog);
			backlog.setListItems(backlog);
			return backlog;
		}
		setHeader(backlog) {
			this.header = new Header$1(backlog);
			this.header.subscribe('epicClick', baseEvent => {
				this.emit('openAddEpicForm', baseEvent.getTarget());
			});
			this.header.subscribe('taskClick', baseEvent => {
				if (this.mandatoryExists) {
					this.emit('openAddTaskForm', baseEvent.getTarget());
				} else {
					this.emit('showInput', baseEvent.getTarget());
				}
			});
		}
		setBlank(backlog) {
			this.blank = new Blank(backlog);
		}
		setDropzone(backlog) {
			this.dropzone = new Dropzone(backlog);
			this.dropzone.subscribe('createTask', () => {
				if (this.mandatoryExists) {
					this.emit('openAddTaskForm');
				} else {
					this.emit('showInput');
				}
			});
		}
		setEmptySearchStub(backlog) {
			this.emptySearchStub = new EmptySearchStub(backlog);
		}
		setNumberTasks(numberTasks) {
			super.setNumberTasks(numberTasks);
			if (this.header) {
				this.header.updateTaskCounter(this.getNumberTasks());
			}
		}
		getEntityType() {
			return 'backlog';
		}
		isDisabled() {
			return false;
		}
		render() {
			this.node = main_core.Tag.render`
			<div class="tasks-scrum__backlog">
				<div class="tasks-scrum__content --with-header --open">
					${this.header ? this.header.render() : ''}
					${this.blank ? this.blank.render() : ''}
					${this.dropzone ? this.dropzone.render() : ''}
					${this.emptySearchStub ? this.emptySearchStub.render() : ''}
					${this.listItems ? this.listItems.render() : ''}
				</div>
			</div>
		`;
			main_core.Event.bind(this.node.querySelector('.tasks-scrum__content-items'), 'scroll', this.onItemsScroll.bind(this));
			return this.node;
		}
		setItem(newItem) {
			super.setItem(newItem);
			if (newItem.getNode()) {
				main_core.Dom.addClass(newItem.getNode(), '--item-backlog');
			}
		}
		removeItems(items, removeNodes = false) {
			const removedCount = super.removeItems(items, removeNodes);
			if (this.isEmpty()) {
				this.emit('showBlank');
			}
			return removedCount;
		}
		onAfterAppend() {
			super.onAfterAppend();
			if (this.isEmpty()) {
				this.emit('showBlank');
			}
		}
		onItemsScroll() {
			this.emit('itemsScroll');
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

	let Date$1 = class Date extends main_core_events.EventEmitter {
		constructor(sprint) {
			super(sprint);
			this.setEventNamespace('BX.Tasks.Scrum.Sprint.Header.Date');
			this.sprint = sprint;
			this.node = null;
		}
		render() {
			if (this.sprint.isActive() || this.sprint.isCompleted()) {
				return '';
			}
			this.node = main_core.Tag.render`
			<div class="tasks-scrum__sprint--date-container">
				<div class="tasks-scrum__sprint--date --start">${Date.getFormattedDateStart(this.sprint)}</div>
				<div class="tasks-scrum__sprint--date-separator"> - </div>
				<div class="tasks-scrum__sprint--date --end">${Date.getFormattedDateEnd(this.sprint)}</div>
				<input type="hidden" name="dateStart" value="${main_core.Text.encode(this.sprint.getDateStartFormatted())})">
				<input type="hidden" name="dateEnd" value="${main_core.Text.encode(this.sprint.getDateEndFormatted())}">
			</div>
		`;
			this.bindEvents();
			return this.node;
		}
		getNode() {
			return this.node;
		}
		bindEvents() {
			if (this.sprint.isActive() || this.sprint.isCompleted()) {
				return;
			}
			const parentPopup = this.node.closest('.popup-window');
			const customBlur = () => {
				BX.calendar.get().popup.close();
			};
			const showCalendar = (node, field) => {
				/* eslint-disable */
				BX.calendar({
					node: node,
					field: field,
					bTime: false,
					bSetFocus: false,
					bHideTime: false
				});
				/* eslint-enable */
				if (parentPopup) {
					main_core.Event.bindOnce(parentPopup, 'click', customBlur);
				}
			};
			const updateDateNode = (node, value) => {
				/* eslint-disable */
				node.textContent = BX.date.format(Culture.getInstance().getDayMonthFormat(), Math.floor(BX.parseDate(value).getTime() / 1000));
				/* eslint-enable */
			};
			const sendRequest = data => {
				this.emit('changeSprintDeadline', data);
			};
			const dateStartNode = this.node.querySelector('.--start');
			const dateEndNode = this.node.querySelector('.--end');
			const dateStartInput = this.node.querySelector('input[name="dateStart"]');
			const dateEndInput = this.node.querySelector('input[name="dateEnd"]');
			main_core.Event.bind(this.node, 'click', event => {
				const target = event.target;
				if (target.classList.contains('--start')) {
					showCalendar(target, dateStartInput);
				} else if (target.classList.contains('--end')) {
					showCalendar(target, dateEndInput);
				}
				event.stopPropagation();
			});
			main_core.Event.bind(dateStartInput, 'change', event => {
				const value = event.target.value;
				updateDateNode(dateStartNode, value);
				sendRequest({
					sprintId: this.sprint.getId(),
					dateStart: Math.floor(BX.parseDate(value).getTime() / 1000)
				});
				if (parentPopup) {
					main_core.Event.unbind(parentPopup, 'click', customBlur);
				}
			});
			main_core.Event.bind(dateEndInput, 'change', event => {
				const value = event.target.value;
				updateDateNode(dateEndNode, value);
				sendRequest({
					sprintId: this.sprint.getId(),
					dateEnd: Math.floor(BX.parseDate(value).getTime() / 1000)
				});
				if (parentPopup) {
					main_core.Event.unbind(parentPopup, 'click', customBlur);
				}
			});
		}
		getWeeks() {
			const weekCount = parseInt(this.sprint.getDefaultSprintDuration(), 10) / 604800;
			if (weekCount > 5) {
				return weekCount + ' ' + main_core.Loc.getMessage('TASKS_SCRUM_DATE_WEEK_NAME_3');
			} else if (weekCount === 1) {
				return weekCount + ' ' + main_core.Loc.getMessage('TASKS_SCRUM_DATE_WEEK_NAME_1');
			} else {
				return weekCount + ' ' + main_core.Loc.getMessage('TASKS_SCRUM_DATE_WEEK_NAME_2');
			}
		}
		static getFormattedTitleDatePeriod(sprint) {
			return Date.getFormattedDateStart(sprint) + ' - ' + Date.getFormattedDateEnd(sprint);
		}
		static getFormattedDateStart(sprint) {
			/* eslint-disable */
			return BX.date.format(Culture.getInstance().getDayMonthFormat(), sprint.getDateStart(), null, true);
			/* eslint-enable */
		}
		static getFormattedDateEnd(sprint) {
			/* eslint-disable */
			return BX.date.format(Culture.getInstance().getDayMonthFormat(), sprint.getDateEnd(), null, true);
			/* eslint-enable */
		}
	};

	class StatsCalculator {
		calculatePercentage(first, second) {
			if (first === 0) {
				return 0;
			}
			if (first === '') {
				return 100;
			}
			const result = Math.round(second * 100 / first);
			return isNaN(result) ? 0 : result;
		}
	}

	let Stats$1 = class Stats extends main_core_events.EventEmitter {
		constructor(sprint) {
			super(sprint);
			this.setEventNamespace('BX.Tasks.Scrum.Sprint.Stats');
			this.setSprintData(sprint);
			this.statsCalculator = new StatsCalculator();
			this.node = null;
			this.kanbanMode = false;
		}
		setKanbanStyle() {
			this.kanbanMode = true;
		}
		isKanbanMode() {
			return this.kanbanMode;
		}
		render() {
			this.node = main_core.Tag.render`<div></div>`;
			return this.node;
		}
		setSprintData(sprint) {
			this.sprint = sprint;
			this.setStoryPoints(sprint.getStoryPoints().getPoints());
			this.setCompletedStoryPoints(sprint.getCompletedStoryPoints().getPoints());
			this.setUncompletedStoryPoints(sprint.getUncompletedStoryPoints().getPoints());
			this.setEndDate(sprint.getDateEnd());
			this.weekendDaysTime = sprint.getWeekendDaysTime();
			if (this.node) {
				main_core.Dom.replace(this.node, this.render());
			}
		}
		setStoryPoints(storyPoints) {
			if (main_core.Type.isUndefined(storyPoints) || isNaN(parseFloat(storyPoints))) {
				this.storyPoints = 0;
			} else {
				this.storyPoints = parseFloat(storyPoints);
			}
		}
		getStoryPoints() {
			return this.storyPoints;
		}
		setCompletedStoryPoints(storyPoints) {
			if (main_core.Type.isUndefined(storyPoints) || isNaN(parseFloat(storyPoints))) {
				this.completedStoryPoints = 0;
			} else {
				this.completedStoryPoints = parseFloat(storyPoints);
			}
		}
		getCompletedStoryPoints() {
			return this.completedStoryPoints;
		}
		setUncompletedStoryPoints(storyPoints) {
			if (main_core.Type.isUndefined(storyPoints) || isNaN(parseFloat(storyPoints))) {
				this.uncompletedStoryPoints = 0;
			} else {
				this.uncompletedStoryPoints = parseFloat(storyPoints);
			}
		}
		getUncompletedStoryPoints() {
			return this.completedStoryPoints;
		}
		setEndDate(endDate) {
			if (main_core.Type.isUndefined(endDate) || isNaN(parseInt(endDate, 10))) {
				this.endDate = Date.now() / 1000;
			} else {
				this.endDate = parseInt(endDate, 10);
			}
		}
		getEndDate() {
			return this.endDate;
		}
	};

	class CompletedStats extends Stats$1 {
		render() {
			const percentage = this.statsCalculator.calculatePercentage(this.getStoryPoints(), this.getCompletedStoryPoints());
			const completedDate = this.getCompletedDate(this.getEndDate());
			const label = main_core.Loc.getMessage('TASKS_SCRUM_SPRINT_STATS_COMPLETED_LABEL').replace('#percent#', percentage).replace('#date#', completedDate);
			const title = Date$1.getFormattedTitleDatePeriod(this.sprint);
			this.node = main_core.Tag.render`
			<div title="${title}">
				${label}
			</div>
		`;
			return this.node;
		}
		getCompletedDate(endDate) {
			return BX.date.format(Culture.getInstance().getLongDateFormat(), endDate);
		}
	}

	class ExpiredStats extends Stats$1 {
		render() {
			const percentage = this.statsCalculator.calculatePercentage(this.getStoryPoints(), this.getCompletedStoryPoints());
			const expiredDay = this.getExpiredDay(this.getEndDate());
			const label = main_core.Loc.getMessage('TASKS_SCRUM_SPRINT_STATS_EXPIRED_LABEL').replace('#percent#', percentage).replace('#date#', expiredDay);
			const title = Date$1.getFormattedTitleDatePeriod(this.sprint);
			this.node = main_core.Tag.render`
			<div title="${title}">
				${label}
			</div>
		`;
			return this.node;
		}
		getExpiredDay(endDate) {
			return BX.date.format(Culture.getInstance().getLongDateFormat(), endDate);
		}
	}

	class ActiveStats extends Stats$1 {
		render() {
			const remainingDays = this.getRemainingDays(this.getEndDate());
			const percentage = this.statsCalculator.calculatePercentage(this.getStoryPoints(), this.getCompletedStoryPoints());
			let label = '';
			if (main_core.Type.isInteger(remainingDays) && remainingDays <= 1) {
				label = main_core.Loc.getMessage('TASKS_SCRUM_SPRINT_STATS_ACTIVE_LAST_LABEL').replace('#percent#', percentage);
			} else {
				label = main_core.Loc.getMessage('TASKS_SCRUM_SPRINT_STATS_ACTIVE_LABEL').replace('#days#', remainingDays).replace('#percent#', percentage);
			}
			const title = Date$1.getFormattedTitleDatePeriod(this.sprint);
			this.node = main_core.Tag.render`
			<div title="${title}">
				${label}
			</div>
		`;
			return this.node;
		}
		getRemainingDays(endDate) {
			const dateWithWeekendOffset = new Date();
			dateWithWeekendOffset.setSeconds(dateWithWeekendOffset.getSeconds() + this.weekendDaysTime);
			dateWithWeekendOffset.setHours(0, 0, 0, 0);
			const dateEnd = new Date(endDate * 1000);
			const msPerMinute = 60 * 1000;
			const msPerHour = msPerMinute * 60;
			const msPerDay = msPerHour * 24;
			const daysRemaining = Math.round((dateEnd - dateWithWeekendOffset) / msPerDay);
			if (daysRemaining <= 1) {
				return daysRemaining;
			} else {
				return BX.date.format('ddiff', dateWithWeekendOffset, dateEnd);
			}
		}
	}

	class StatsBuilder {
		static build(sprint) {
			if (sprint.isCompleted()) {
				return new CompletedStats(sprint);
			} else if (sprint.isExpired()) {
				return new ExpiredStats(sprint);
			} else if (sprint.isActive()) {
				return new ActiveStats(sprint);
			} else {
				return new Stats$1(sprint);
			}
		}
	}

	class Stats extends main_core_events.EventEmitter {
		constructor(sprint) {
			super(sprint);
			this.setEventNamespace('BX.Tasks.Scrum.Sprint.Header.Stats');
			this.sprint = sprint;
			this.node = null;
		}
		render() {
			const stats = StatsBuilder.build(this.sprint);
			this.node = main_core.Tag.render`
			<div class="tasks-scrum__content--event-params">
				${stats.render()}
			</div>
		`;
			return this.node;
		}
		getNode() {
			return this.node;
		}
	}

	class Name extends main_core_events.EventEmitter {
		constructor(sprint) {
			super(sprint);
			this.setEventNamespace('BX.Tasks.Scrum.Sprint.Header.Name');
			this.sprint = sprint;
			this.date = null;
			this.stats = null;
			this.node = null;
		}
		setDate(sprint) {
			const date = new Date$1(sprint);
			if (this.date) {
				main_core.Dom.replace(this.date.getNode(), date.render());
			}
			this.date = date;
			this.date.subscribe('changeSprintDeadline', baseEvent => {
				this.emit('changeSprintDeadline', baseEvent.getData());
			});
		}
		getDate() {
			return this.date;
		}
		setStats(sprint) {
			const stats = new Stats(sprint);
			if (this.stats) {
				main_core.Dom.replace(this.stats.getNode(), stats.render());
			}
			this.stats = stats;
		}
		render() {
			this.node = main_core.Tag.render`
			<div class="tasks-scrum__name-container">
				${this.renderEditInput()}
				<div class="tasks-scrum__title">
					${main_core.Text.encode(this.sprint.getName())}
				</div>
				${this.renderEdit()}
				${this.renderRemove()}
				${this.date ? this.date.render() : ''}
				${this.stats ? this.stats.render() : ''}
		`;
			const titleNode = this.node.querySelector('.tasks-scrum__title');
			const editNode = this.node.querySelector('.tasks-scrum__sprint--edit');
			main_core.Event.bind(titleNode, 'click', () => {
				this.emit('editClick', this.node.querySelector('.tasks-scrum__title-editing-input'));
			});
			main_core.Event.bind(editNode, 'click', () => {
				this.emit('editClick', this.node.querySelector('.tasks-scrum__title-editing-input'));
			});
			if (this.sprint.isPlanned()) {
				const removeNode = this.node.querySelector('.tasks-scrum__sprint--remove');
				main_core.Event.bind(removeNode, 'click', () => {
					if (this.sprint.isEmpty()) {
						this.emit('removeSprint');
					} else {
						ui_dialogs_messagebox.MessageBox.confirm(main_core.Loc.getMessage('TASKS_SCRUM_CONFIRM_TEXT_REMOVE_SPRINT'), messageBox => {
							this.emit('removeSprint');
							messageBox.close();
						}, main_core.Loc.getMessage('TASKS_SCRUM_BUTTON_TEXT_REMOVE'));
					}
				});
			}
			return this.node;
		}
		getNode() {
			return this.node;
		}
		renderEditInput() {
			const uiClasses = 'ui-ctl ui-ctl-sm ui-ctl-textbox ui-ctl-underline ui-ctl-no-padding';
			return main_core.Tag.render`
			<div class="tasks-scrum__title-editing ${uiClasses}">
				<input
					type="text"
					class="tasks-scrum__title-editing-input ui-ctl-element"
					value="${main_core.Text.encode(this.sprint.getName())}"
				>
			</div>
		`;
		}
		renderEdit() {
			if (!this.sprint.isCompleted()) {
				return main_core.Tag.render`<div class="tasks-scrum__sprint--edit"></div>`;
			} else {
				return '';
			}
		}
		renderRemove() {
			if (this.sprint.isPlanned()) {
				return main_core.Tag.render`<div class="tasks-scrum__sprint--remove"></div>`;
			} else {
				return '';
			}
		}
	}

	class ChartIcon extends main_core_events.EventEmitter {
		constructor(sprint) {
			super(sprint);
			this.setEventNamespace('BX.Tasks.Scrum.Sprint.Header.Info.ChartIcon');
			this.sprint = sprint;
			this.node = null;
		}
		render() {
			const uiChartStyles = 'ui-btn ui-btn-xs ui-btn-light ui-btn-round';
			this.node = main_core.Tag.render`
			<div class="tasks-scrum__sprint--btn-burn-down-chart">
				<div class="tasks-scrum__sprint--icon-burn-down-chart ${uiChartStyles}"></div>
			</div>
		`;
			main_core.Event.bind(this.node, 'click', this.onClick.bind(this));
			return this.node;
		}
		onClick() {
			this.emit('click');
		}
	}

	class Counters extends main_core_events.EventEmitter {
		constructor(sprint) {
			super(sprint);
			this.setEventNamespace('BX.Tasks.Scrum.Sprint.Header.Info.Counters');
			this.sprint = sprint;
			this.node = null;
		}
		render() {
			this.node = main_core.Tag.render`
			<div class="tasks-scrum__sprint--event-content">
				<div class="tasks-scrum__sprint--event-container">
					<div class="tasks-scrum__sprint--subtitle">
						${main_core.Loc.getMessage('TASKS_SCRUM_TASK_LABEL')}
					</div>
					<div
						class="tasks-scrum__sprint--point"
						data-hint="${main_core.Loc.getMessage('TASKS_SCRUM_TASK_LABEL')}" data-hint-no-icon
					>
						${parseInt(this.sprint.getNumberTasks(), 10)}
					</div>
				</div>
				<div class="tasks-scrum__sprint--event-container">
					<div class="tasks-scrum__sprint--subtitle">
						${main_core.Loc.getMessage('TASKS_SCRUM_SPRINT_HEADER_STORY_POINTS')}
					</div>
					<div
						class="tasks-scrum__sprint--point"
						data-hint="${main_core.Loc.getMessage('TASKS_SCRUM_SPRINT_HEADER_STORY_POINTS')}" data-hint-no-icon
					>
						${this.sprint.getStoryPoints().isEmpty() ? '-' : this.sprint.getStoryPoints().getPoints()}
					</div>
					${this.renderAverageNumberStoryPoints()}
				</div>
			</div>
		`;
			BX.UI.Hint.createInstance({
				popupParameters: {
					closeByEsc: true,
					autoHide: true,
					animation: null
				}
			}).init(this.node);
			return this.node;
		}
		renderAverageNumberStoryPoints() {
			if (!this.sprint.isPlanned() || !this.sprint.getAverageNumberStoryPoints()) {
				return '';
			}
			return main_core.Tag.render`
			<div 
				class="tasks-scrum__sprint--point --completed"
				data-hint="${main_core.Loc.getMessage('TASKS_SCRUM_AVERAGE_NUMBER_STORY_POINTS')}" data-hint-no-icon
			>
				${this.sprint.getAverageNumberStoryPoints()}
			</div>
		`;
		}
	}

	let Button$1 = class Button extends main_core_events.EventEmitter {
		constructor(sprint) {
			super(sprint);
			this.setEventNamespace('BX.Tasks.Scrum.Sprint.Header.Info.Button');
			this.sprint = sprint;
			this.node = null;
		}
		render() {
			const uiBtnStyles = 'ui-btn ui-btn-xs ui-btn-light ui-btn-round ui-btn-icon-add';
			this.node = main_core.Tag.render`
			<button class="tasks-scrum__sprint--btn-add ${uiBtnStyles}"></button>
		`;
			main_core.Event.bind(this.node, 'click', this.onClick.bind(this));
			return this.node;
		}
		getNode() {
			return this.node;
		}
		onClick() {
			this.emit('click');
		}
	};

	class Info extends main_core_events.EventEmitter {
		constructor(sprint) {
			super(sprint);
			this.setEventNamespace('BX.Tasks.Scrum.Sprint.Header.Info');
			this.sprint = sprint;
			this.node = null;
			this.chartIcon = new ChartIcon(sprint);
			this.counters = new Counters(sprint);
			this.button = new Button$1(sprint);
		}
		render() {
			this.node = main_core.Tag.render`
			<div class="tasks-scrum__sprint--info">
				${this.chartIcon.render()}
				${this.counters.render()}
				${this.button.render()}
			</div>
		`;
			this.chartIcon.subscribe('click', () => this.emit('showBurnDownChart'));
			this.button.subscribe('click', baseEvent => this.emit('showCreateMenu', baseEvent.getTarget()));
			return this.node;
		}
		getNode() {
			return this.node;
		}
		onClick() {
			this.emit('click');
		}
	}

	class Button extends main_core_events.EventEmitter {
		constructor(sprint) {
			super(sprint);
			this.setEventNamespace('BX.Tasks.Scrum.Sprint.Header.Button');
			this.sprint = sprint;
			this.disabled = false;
			this.node = null;
		}
		render() {
			if (this.sprint.isCompleted()) {
				return this.node;
			}
			const disableUiClass = this.isAccessDenied() ? 'ui-btn-disabled' : '';
			this.node = main_core.Tag.render`
			<div
				class="tasks-scrum__sprint--btn-run ${this.getUiClasses()} ${disableUiClass}"
				title="${this.getButtonText()}"
			>
				<span class="tasks-scrum__sprint--btn-run-text">${this.getButtonText()}</span>
			</div>
		`;
			main_core.Event.bind(this.node, 'click', this.onClick.bind(this));
			return this.node;
		}
		getNode() {
			return this.node;
		}
		onClick() {
			if (this.disabled || this.isAccessDenied()) {
				return;
			}
			this.emit('click');
		}
		getUiClasses() {
			return 'ui-btn ui-btn-sm ui-btn-primary ui-btn-round ui-btn-no-caps';
		}
		getButtonText() {
			return main_core.Loc.getMessage('TASKS_SCRUM_SPRINT_HEADER_BUTTON_' + this.sprint.getStatus().toUpperCase());
		}
		disable() {
			this.disabled = true;
			if (this.node) {
				main_core.Dom.addClass(this.node, 'ui-btn-disabled');
			}
		}
		unDisable() {
			this.disabled = false;
			if (this.node && !this.isAccessDenied()) {
				main_core.Dom.removeClass(this.node, 'ui-btn-disabled');
			}
		}
		isAccessDenied() {
			return this.sprint.isActive() && !this.sprint.canComplete() || this.sprint.isPlanned() && !this.sprint.canStart();
		}
	}

	class Tick extends main_core_events.EventEmitter {
		constructor(sprint) {
			super(sprint);
			this.setEventNamespace('BX.Tasks.Scrum.Sprint.Header.Tick');
			this.sprint = sprint;
			this.node = null;
		}
		render() {
			this.node = main_core.Tag.render`
			<div class="tasks-scrum__sprint--btn-dropdown ui-btn ui-btn-sm ui-btn-icon-angle-down --up"></div>
		`;
			main_core.Event.bind(this.node, 'click', this.onClick.bind(this));
			if (this.sprint.isHideContent()) {
				main_core.Dom.removeClass(this.node, '--up');
			}
			return this.node;
		}
		onClick() {
			this.emit('click');
		}
		upTick() {
			if (!this.node) {
				return;
			}
			main_core.Dom.addClass(this.node, '--up');
		}
		downTick() {
			if (!this.node) {
				return;
			}
			main_core.Dom.removeClass(this.node, '--up');
		}
	}

	class Header extends main_core_events.EventEmitter {
		constructor(sprint) {
			super(sprint);
			this.setEventNamespace('BX.Tasks.Scrum.Sprint.Header');
			this.sprint = sprint;
			this.node = null;
			this.name = null;
			this.stats = null;
			this.info = null;
			this.button = null;
			this.tick = null;
		}
		static buildHeader(sprint) {
			const header = new Header(sprint);
			header.setName(sprint);
			if (sprint.isCompleted()) {
				header.setStats(sprint);
			} else {
				header.setInfo(sprint);
				header.setButton(sprint);
			}
			header.setTick(sprint);
			return header;
		}
		setName(sprint) {
			const name = new Name(sprint);
			if (sprint.isPlanned()) {
				name.setDate(sprint);
			}
			if (sprint.isActive()) {
				name.setStats(sprint);
			}
			if (this.name) {
				main_core.Dom.replace(this.name.getNode(), name.render());
			}
			this.name = name;
			this.name.subscribe('editClick', baseEvent => {
				this.emit('changeName', baseEvent.getData());
			});
			this.name.subscribe('removeSprint', () => this.emit('removeSprint'));
			this.name.subscribe('changeSprintDeadline', baseEvent => {
				this.emit('changeSprintDeadline', baseEvent.getData());
			});
		}
		getName() {
			return this.name;
		}
		setStats(sprint) {
			if (!sprint.isCompleted()) {
				return;
			}
			const stats = new Stats(sprint);
			if (this.stats) {
				main_core.Dom.replace(this.stats.getNode(), stats.render());
			}
			this.stats = stats;
		}
		setInfo(sprint) {
			const info = new Info(sprint);
			if (this.info) {
				main_core.Dom.replace(this.info.getNode(), info.render());
			}
			this.info = info;
			this.info.subscribe('showBurnDownChart', () => this.emit('showBurnDownChart'));
			this.info.subscribe('showCreateMenu', baseEvent => this.emit('showCreateMenu', baseEvent.getData()));
		}
		setButton(sprint) {
			const button = new Button(sprint);
			if (this.button) {
				main_core.Dom.replace(this.button.getNode(), button.render());
			}
			this.button = button;
			this.button.subscribe('click', () => {
				if (this.sprint.isActive()) {
					this.emit('completeSprint');
				} else if (this.sprint.isPlanned()) {
					this.emit('startSprint');
				}
			});
		}
		setTick(sprint) {
			this.tick = new Tick(sprint);
			this.tick.subscribe('click', () => {
				this.emit('toggleVisibilityContent');
			});
		}
		render() {
			this.node = main_core.Tag.render`
			<div class="tasks-scrum__content-header ${this.getHeaderClass()}">
				${this.name ? this.name.render() : ''}
				${this.stats ? this.stats.render() : ''}
				${this.info ? this.info.render() : ''}
				${this.button ? this.button.render() : ''}
				${this.tick ? this.tick.render() : ''}
			</div>
		`;
			return this.node;
		}
		getNode() {
			return this.node;
		}
		getHeaderClass() {
			return 'tasks-scrum__content-header --' + this.sprint.getStatus();
		}
		activateEditMode() {
			main_core.Dom.addClass(this.getNode(), '--editing');
		}
		deactivateEditMode() {
			main_core.Dom.removeClass(this.getNode(), '--editing');
		}
		upTick() {
			if (!this.tick) {
				return;
			}
			this.tick.upTick();
		}
		downTick() {
			if (!this.tick) {
				return;
			}
			this.tick.downTick();
		}
		disableButton() {
			if (this.button) {
				this.button.disable();
			}
		}
		unDisableButton() {
			if (this.button) {
				this.button.unDisable();
			}
		}
	}

	class Sprint extends Entity {
		constructor(params) {
			super(params);
			this.setEventNamespace('BX.Tasks.Scrum.Sprint');
			this.completedStoryPoints = new StoryPointsStorage();
			this.uncompletedStoryPoints = new StoryPointsStorage();
			this.setSprintParams(params);
			this.toggling = false;
		}
		setSprintParams(params) {
			this.setTmpId(params.tmpId);
			this.setName(params.name);
			this.setSort(params.sort);
			this.setDateStart(params.dateStart);
			this.setDateEnd(params.dateEnd);
			this.setDateStartFormatted(params.dateStartFormatted);
			this.setDateEndFormatted(params.dateEndFormatted);
			this.setWeekendDaysTime(params.weekendDaysTime);
			this.setDefaultSprintDuration(params.defaultSprintDuration);
			this.setAverageNumberStoryPoints(params.averageNumberStoryPoints);
			this.setStatus(params.status);
			this.setCompletedStoryPoints(params.completedStoryPoints);
			this.setUncompletedStoryPoints(params.uncompletedStoryPoints);
			this.setCompletedTasks(params.completedTasks);
			this.setUncompletedTasks(params.uncompletedTasks);
			this.setItems(params.items);
			this.setInfo(params.info);
			this.setAllowedActions(params.allowedActions);
			this.setContentVisibility(params.isShownContent);
		}
		static buildSprint(params) {
			const sprint = new Sprint(params);
			sprint.setHeader(sprint);
			if (sprint.isCompleted()) {
				sprint.setBlank(sprint);
			}
			sprint.setDropzone(sprint);
			sprint.setEmptySearchStub(sprint);
			sprint.setListItems(sprint);
			return sprint;
		}
		setHeader(sprint) {
			const header = Header.buildHeader(sprint);
			if (this.header) {
				main_core.Dom.replace(this.header.getNode(), header.render());
			}
			this.header = header;
			this.header.subscribe('changeName', this.onChangeName.bind(this));
			this.header.subscribe('removeSprint', () => this.emit('removeSprint'));
			this.header.subscribe('completeSprint', () => this.emit('completeSprint'));
			this.header.subscribe('startSprint', () => this.emit('startSprint'));
			this.header.subscribe('changeSprintDeadline', this.onChangeSprintDeadline.bind(this));
			this.header.subscribe('toggleVisibilityContent', () => {
				this.toggleVisibilityContent(this.getContentContainer());
			});
			this.header.subscribe('showBurnDownChart', () => this.emit('showSprintBurnDownChart'));
			this.header.subscribe('showCreateMenu', baseEvent => {
				if (this.mandatoryExists) {
					this.emit('createSprint');
				} else {
					this.emit('showSprintCreateMenu', baseEvent.getData());
				}
			});
		}
		setBlank(sprint) {
			this.blank = new Blank(sprint);
		}
		setDropzone(sprint) {
			this.dropzone = new Dropzone(sprint);
			if (this.mandatoryExists) {
				this.dropzone.setMandatory();
			}
			this.dropzone.subscribe('createTask', () => this.emit('showInput'));
		}
		setEmptySearchStub(sprint) {
			if (!this.isCompleted()) {
				this.emptySearchStub = new EmptySearchStub(sprint);
			}
		}
		isActive() {
			return this.getStatus() === 'active';
		}
		isPlanned() {
			return this.getStatus() === 'planned';
		}
		isCompleted() {
			return this.getStatus() === 'completed';
		}
		isDisabled() {
			return this.isCompleted();
		}
		isExpired() {
			const sprintEnd = new Date(this.dateEnd * 1000);
			return this.isActive() && sprintEnd.getTime() < new Date().getTime();
		}
		getEntityType() {
			return 'sprint';
		}
		setItem(newItem) {
			super.setItem(newItem);
			newItem.setDisableStatus(this.isDisabled());
			if (newItem.getNode()) {
				main_core.Dom.addClass(newItem.getNode(), '--item-sprint');
			}
		}
		removeItems(items, removeNodes = false) {
			const removedCount = super.removeItems(items, removeNodes);
			if (this.isEmpty()) {
				this.emit('showDropzone');
			}
			return removedCount;
		}
		setName(name) {
			this.name = main_core.Type.isString(name) ? name : '';
			if (this.isNodeCreated()) {
				this.header.setName(this);
			}
		}
		getName() {
			return this.name;
		}
		setTmpId(tmpId) {
			this.tmpId = main_core.Type.isString(tmpId) ? tmpId : '';
		}
		getTmpId() {
			return this.tmpId;
		}
		setSort(sort) {
			this.sort = main_core.Type.isInteger(sort) ? parseInt(sort, 10) : 1;
			if (this.getNode()) {
				this.getNode().dataset.sprintSort = this.sort;
			}
		}
		getSort() {
			return this.sort;
		}
		setDateStart(dateStart) {
			this.dateStart = main_core.Type.isInteger(dateStart) ? parseInt(dateStart, 10) : 0;
			if (this.isNodeCreated()) {
				this.header.setName(this);
			}
		}
		getDateStart() {
			return parseInt(this.dateStart, 10);
		}
		setDateEnd(dateEnd) {
			this.dateEnd = main_core.Type.isInteger(dateEnd) ? parseInt(dateEnd, 10) : 0;
			if (this.isNodeCreated()) {
				this.header.setName(this);
			}
		}
		getDateEnd() {
			return parseInt(this.dateEnd, 10);
		}
		setDateStartFormatted(dateStart) {
			this.dateStartFormatted = main_core.Type.isString(dateStart) ? dateStart : '';
		}
		getDateStartFormatted() {
			return this.dateStartFormatted;
		}
		setDateEndFormatted(dateEnd) {
			this.dateEndFormatted = main_core.Type.isString(dateEnd) ? dateEnd : '';
		}
		getDateEndFormatted() {
			return this.dateEndFormatted;
		}
		setWeekendDaysTime(weekendDaysTime) {
			this.weekendDaysTime = main_core.Type.isInteger(weekendDaysTime) ? parseInt(weekendDaysTime, 10) : 0;
		}
		getWeekendDaysTime() {
			return this.weekendDaysTime;
		}
		setCompletedStoryPoints(completedStoryPoints) {
			this.completedStoryPoints.setPoints(completedStoryPoints);
			this.setStats();
		}
		getCompletedStoryPoints() {
			return this.completedStoryPoints;
		}
		setUncompletedStoryPoints(uncompletedStoryPoints) {
			this.uncompletedStoryPoints.setPoints(uncompletedStoryPoints);
			this.setStats();
		}
		getUncompletedStoryPoints() {
			return this.uncompletedStoryPoints;
		}
		setStats() {
			if (this.header) {
				this.header.setStats(this);
				this.header.setName(this);
				this.header.setInfo(this);
			}
		}
		setItems(items) {
			if (!main_core.Type.isArray(items)) {
				return;
			}
			items.forEach(itemParams => {
				const item = Item.buildItem(itemParams);
				item.setDisableStatus(this.isDisabled());
				item.setShortView(this.getShortView());
				this.items.set(item.getId(), item);
			});
		}
		setInfo(info) {
			this.info = main_core.Type.isPlainObject(info) ? info : {
				sprintGoal: ''
			};
		}
		setAllowedActions(allowedActions) {
			this.allowedActions = {
				start: false,
				complete: false
			};
			if (main_core.Type.isPlainObject(allowedActions)) {
				this.allowedActions.start = allowedActions.start === true;
				this.allowedActions.complete = allowedActions.complete === true;
			}
		}
		setContentVisibility(isShown) {
			this.hideCont = isShown !== 'Y';
		}
		canStart() {
			return this.allowedActions.start === true;
		}
		canComplete() {
			return this.allowedActions.complete === true;
		}
		setNumberTasks(numberTasks) {
			super.setNumberTasks(numberTasks);
			if (this.header) {
				this.header.setInfo(this);
			}
		}
		setCompletedTasks(completedTasks) {
			this.completedTasks = main_core.Type.isInteger(completedTasks) ? parseInt(completedTasks, 10) : 0;
		}
		getCompletedTasks() {
			return this.completedTasks;
		}
		setUncompletedTasks(uncompletedTasks) {
			this.uncompletedTasks = main_core.Type.isInteger(uncompletedTasks) ? parseInt(uncompletedTasks, 10) : 0;
		}
		getUncompletedTasks() {
			return this.uncompletedTasks;
		}
		setDefaultSprintDuration(defaultSprintDuration) {
			this.defaultSprintDuration = main_core.Type.isInteger(defaultSprintDuration) ? parseInt(defaultSprintDuration, 10) : 0;
		}
		getDefaultSprintDuration() {
			return this.defaultSprintDuration;
		}
		setAverageNumberStoryPoints(averageNumberStoryPoints) {
			this.averageNumberStoryPoints = main_core.Type.isNumber(averageNumberStoryPoints) ? parseFloat(averageNumberStoryPoints) : 0;
		}
		getAverageNumberStoryPoints() {
			return this.averageNumberStoryPoints;
		}
		getInfo() {
			return this.info;
		}
		getUncompletedItems() {
			const items = new Map();
			this.items.forEach(item => {
				if (!item.isCompleted()) {
					items.set(item.getId(), item);
				}
			});
			return items;
		}
		setStatus(status) {
			const availableStatus = new Set(['planned', 'active', 'completed']);
			this.status = availableStatus.has(status) ? status : 'planned';
			this.setHeader(this);
			this.items.forEach(item => {
				item.setDisableStatus(this.isDisabled());
			});
			if (this.isDisabled()) {
				if (this.input) {
					this.input.removeYourself();
				}
			}
		}
		getStatus() {
			return this.status;
		}
		disableHeaderButton() {
			if (this.header) {
				this.header.disableButton();
			}
		}
		unDisableHeaderButton() {
			if (this.header) {
				this.header.unDisableButton();
			}
		}
		updateYourself(tmpSprint) {
			if (tmpSprint.getName() !== this.getName()) {
				this.setName(tmpSprint.getName());
			}
			if (tmpSprint.getDateStart() !== this.getDateStart()) {
				this.setDateStart(tmpSprint.getDateStart());
			}
			if (tmpSprint.getDateEnd() !== this.getDateEnd()) {
				this.setDateEnd(tmpSprint.getDateEnd());
			}
			this.setStoryPoints(tmpSprint.getStoryPoints().getPoints());
			this.setCompletedStoryPoints(tmpSprint.getCompletedStoryPoints().getPoints());
			this.setUncompletedStoryPoints(tmpSprint.getUncompletedStoryPoints().getPoints());
			if (tmpSprint.getStatus() !== this.getStatus()) {
				this.setStatus(tmpSprint.getStatus());
			}
			if (this.node && this.header) {
				this.setHeader(this);
			}
		}
		removeYourself() {
			main_core.Event.bind(this.node, 'transitionend', this.removeNode.bind(this));

			/* eslint-disable */
			this.node.style.height = `${this.node.scrollHeight}px`;
			this.node.clientHeight;
			this.node.style.height = '0';
			/* eslint-enable */
		}
		removeNode() {
			main_core.Dom.remove(this.node);
			this.node = null;
		}
		render() {
			const openClass = this.isHideContent() ? '' : '--open';
			const defaultContentStyle = this.isHideContent() ? 'height: 0;' : '';
			this.node = main_core.Tag.render`
			<div
				class="tasks-scrum__content --with-header ${openClass}"
				data-sprint-sort="${this.sort}"
				data-sprint-id="${this.getId()}"
			>
				${this.header ? this.header.render() : ''}
				<div class="tasks-scrum__content-container" style="${defaultContentStyle}">
					${this.blank ? this.blank.render() : ''}
					${this.dropzone ? this.dropzone.render() : ''}
					${this.emptySearchStub ? this.emptySearchStub.render() : ''}
					${this.listItems ? this.listItems.render() : ''}
				</div>
			</div>
		`;
			main_core.Event.bind(this.getContentContainer(), 'transitionend', this.onTransitionEnd.bind(this, this.getContentContainer()));
			return this.node;
		}
		onAfterAppend() {
			super.onAfterAppend();
			if (this.isEmpty() && !this.isCompleted()) {
				if (this.getNumberTasks() > 0 && this.isExactSearchApplied()) {
					this.showEmptySearchStub();
				} else {
					this.showDropzone();
				}
			}
		}
		subscribeToItem(item) {
			super.subscribeToItem(item);
			item.subscribe('showSubTasks', baseEvent => {
				const parentItem = baseEvent.getTarget();
				const subTasks = baseEvent.getData();
				if (this.isSubTaskLoadingActive()) {
					return;
				}
				if (subTasks.isEmpty()) {
					this.subTaskLoadingActive = true;
					this.emit('getSubTasks', subTasks);
				} else {
					this.appendNodeAfterItem(subTasks.render(), parentItem.getNode());
					parentItem.showSubTasks();
				}
			});
			item.subscribe('updateCompletedStatus', baseEvent => {
				[...this.getItems().values()].map(item => {
					if (item.isCompleted()) {
						this.setCompletedTasks(this.getCompletedTasks() + 1);
					} else {
						this.setUncompletedTasks(this.getUncompletedTasks() - 1);
					}
				});
			});
			item.subscribe('toggleSubTasks', baseEvent => {
				this.emit('toggleSubTasks', baseEvent.getTarget());
			});
		}
		onChangeName(baseEvent) {
			const header = baseEvent.getTarget();
			const input = baseEvent.getData();
			header.activateEditMode();
			const length = input.value.length;
			input.focus();
			input.setSelectionRange(length, length);
			main_core.Event.bind(input, 'keydown', event => {
				if (event.isComposing || event.key === 'Escape' || event.key === 'Enter') {
					input.blur();
					event.stopImmediatePropagation();
				}
			});
			main_core.Event.bindOnce(input, 'blur', () => {
				if (this.getName() !== input.value) {
					this.setName(input.value);
					this.emit('changeSprintName', {
						sprintId: this.getId(),
						name: this.getName()
					});
				}
				header.deactivateEditMode();
			});
		}
		onChangeSprintDeadline(baseEvent) {
			const requestData = baseEvent.getData();
			this.emit('changeSprintDeadline', requestData);
			if (requestData.hasOwnProperty('dateStart')) {
				this.dateStart = parseInt(requestData.dateStart, 10);
			} else if (requestData.hasOwnProperty('dateEnd')) {
				this.dateEnd = parseInt(requestData.dateEnd, 10);
			}
		}
		onTransitionEnd(node) {
			if (main_core.Dom.style(node, 'height') !== '0px') {
				main_core.Dom.style(node, 'height', 'auto');
			}
			if (this.toggling) {
				this.bindItemsLoader();
				this.toggling = false;
				this.emit('toggleVisibilityContent');
			}
			this.emit('transitionEnd');
		}
		toggleVisibilityContent(node) {
			this.toggling = true;
			this.unbindItemsLoader();
			if (this.isHideContent()) {
				this.showContent(node);
				if (this.isCompleted()) {
					if (this.getItems().size === 0) {
						this.emit('getSprintCompletedItems');
					}
				}
			} else {
				this.hideContent(node);
			}
		}
		showContent(node) {
			this.hideCont = false;
			if (node) {
				main_core.Dom.style(node, 'height', `${node.scrollHeight}px`);
			}
			if (this.header) {
				this.header.upTick();
			}
			main_core.Dom.addClass(this.node, '--open');
			return new Promise(resolve => {
				main_core.Event.bindOnce(this.getContentContainer(), 'transitionend', () => resolve());
			});
		}
		hideContent(node) {
			this.hideCont = true;
			if (node) {
				/* eslint-disable */
				node.style.height = `${node.scrollHeight}px`;
				node.clientHeight;
				node.style.height = '0';
				/* eslint-enable */
			}
			if (this.header) {
				this.header.downTick();
			}
			main_core.Dom.removeClass(this.node, '--open');
			return new Promise(resolve => {
				main_core.Event.bindOnce(this.getContentContainer(), 'transitionend', () => resolve());
			});
		}
		showSprint() {
			if (this.node) {
				main_core.Dom.style(this.node, 'display', 'block');
			}
		}
		hideSprint() {
			if (this.node) {
				main_core.Dom.style(this.node, 'display', 'none');
			}
		}
		getContentContainer() {
			return this.node.querySelector('.tasks-scrum__content-container');
		}
		fadeOut() {
			if (!this.isCompleted()) {
				super.fadeOut();
			}
		}
		fadeIn() {
			if (!this.isCompleted()) {
				super.fadeIn();
			}
		}
		deactivateSubTaskLoading(item) {
			this.subTaskLoadingActive = false;
			item.unDisableToggle();
		}
		isSubTaskLoadingActive() {
			return this.subTaskLoadingActive === true;
		}
	}

	class EntityStorage {
		constructor() {
			this.backlog = null;
			this.sprints = new Map();
			this.filteredCompletedSprints = new Map();
		}
		addBacklog(backlog) {
			if (!(backlog instanceof Backlog)) {
				throw new Error('EntityStorage: Backlog is in wrong format');
			}
			this.backlog = backlog;
		}
		addSprint(sprint) {
			this.sprints.set(sprint.getId(), sprint);
		}
		addFilteredCompletedSprint(sprint) {
			this.filteredCompletedSprints.set(sprint.getId(), sprint);
		}
		clearFilteredCompletedSprints() {
			this.filteredCompletedSprints.clear();
		}
		removeSprint(sprintId) {
			this.sprints.delete(sprintId);
		}
		getBacklog() {
			if (this.backlog === null) {
				throw new Error('EntityStorage: Backlog not found');
			}
			return this.backlog;
		}
		getSprints() {
			return this.sprints;
		}
		getActiveSprint() {
			return [...this.sprints.values()].find(sprint => sprint.isActive());
		}
		getPlannedSprints() {
			const sprints = new Set();
			this.sprints.forEach(sprint => {
				if (sprint.isPlanned()) {
					sprints.add(sprint);
				}
			});
			return sprints;
		}
		getFilteredCompletedSprints() {
			const sprints = new Set();
			this.sprints.forEach(sprint => {
				if (sprint.isCompleted() && !sprint.isEmpty()) {
					sprints.add(sprint);
				}
			});
			return sprints;
		}
		getSprintsAvailableForFilling(entityFrom) {
			const sprints = new Set();
			this.sprints.forEach(sprint => {
				if (!sprint.isCompleted() && entityFrom.getId() !== sprint.getId()) {
					sprints.add(sprint);
				}
			});
			return sprints;
		}
		existCompletedSprint() {
			return !main_core.Type.isUndefined([...this.sprints.values()].find(sprint => sprint.isCompleted()));
		}
		getAllEntities() {
			const entities = new Map();
			entities.set(this.backlog.getId(), this.backlog);
			[...this.sprints.values()].map(sprint => entities.set(sprint.getId(), sprint));
			return entities;
		}
		getAllItems() {
			let items = new Map(this.backlog.getItems());
			const activeSprint = this.getActiveSprint();
			if (activeSprint) {
				items = new Map([...items, ...activeSprint.getItems()]);
			}
			[...this.getPlannedSprints().values()].map(sprint => items = new Map([...items, ...sprint.getItems()]));
			return items;
		}
		existsAtLeastOneItem() {
			if (this.backlog.getNumberTasks() > 0) {
				return true;
			}
			const filledSprint = [...this.sprints.values()].find(sprint => sprint.getNumberTasks() > 0);
			return !main_core.Type.isUndefined(filledSprint);
		}
		findEntityByEntityId(entityId) {
			entityId = parseInt(entityId, 10);
			if (this.backlog.getId() === entityId) {
				return this.backlog;
			}
			return [...this.sprints.values()].find(sprint => sprint.getId() === entityId);
		}
		findItemByItemId(itemId) {
			itemId = parseInt(itemId, 10);
			const backlogItems = this.backlog.getItems();
			if (backlogItems.has(itemId)) {
				return backlogItems.get(itemId);
			}
			const sprint = [...this.sprints.values()].find(sprint => sprint.getItems().has(itemId));
			if (sprint) {
				return sprint.getItems().get(itemId);
			}
			return null;
		}
		findItemBySourceId(sourceId) {
			sourceId = parseInt(sourceId, 10);
			let items = new Map(this.backlog.getItems());
			[...this.sprints.values()].map(sprint => items = new Map([...items, ...sprint.getItems()]));
			return [...items.values()].find(item => item.getSourceId() === sourceId);
		}
		findRootItemIdsBySourceIds(sourceIds) {
			if (sourceIds.size === 0) {
				return [];
			}
			const itemIds = new Set();
			const collect = entity => {
				entity.getItems().forEach(item => {
					if (!item.isSubTask() && sourceIds.has(String(item.getSourceId()))) {
						itemIds.add(item.getId());
					}
				});
			};
			collect(this.backlog);
			this.sprints.forEach(sprint => {
				if (!sprint.isCompleted()) {
					collect(sprint);
				}
			});
			return [...itemIds];
		}
		findItemBySourceInFilteredCompletedSprints(sourceId) {
			let items = new Map();
			[...this.filteredCompletedSprints.values()].map(sprint => items = new Map([...items, ...sprint.getItems()]));
			return [...items.values()].find(item => item.getSourceId() === sourceId);
		}
		findEntityByItemId(itemId) {
			itemId = parseInt(itemId, 10);
			const backlogItems = this.backlog.getItems();
			if (backlogItems.has(itemId)) {
				return this.backlog;
			}
			return [...this.sprints.values()].find(sprint => sprint.getItems().has(itemId));
		}
	}

	class Scroller {
		constructor(params) {
			this.planBuilder = params.planBuilder;
			this.entityStorage = params.entityStorage;
		}
		scrollToItem(item) {
			if (this.isItemInViewport(item)) {
				return;
			}
			const offset = 112;
			if (this.isBacklogItem(item)) {
				const scrollContainer = this.entityStorage.getBacklog().getListItemsNode();
				const itemTopPosition = main_core.Dom.getRelativePosition(item.getNode(), scrollContainer).top;
				scrollContainer.scrollTo({
					top: scrollContainer.scrollTop + itemTopPosition - offset,
					behavior: 'smooth'
				});
			} else {
				const sprintsContainer = this.planBuilder.getSprintsContainer();
				const itemTopPosition = main_core.Dom.getRelativePosition(item.getNode(), sprintsContainer).top;
				sprintsContainer.scrollTo({
					top: sprintsContainer.scrollTop + itemTopPosition - offset,
					behavior: 'smooth'
				});
			}
		}
		scrollToSprint(sprint) {
			window.scrollTo({
				top: 240,
				behavior: 'smooth'
			});

			// todo dynamic focus to sprint node (loadItems)

			const offset = 80;
			const sprintsContainer = this.planBuilder.getSprintsContainer();
			const position = main_core.Dom.getRelativePosition(sprint.getNode(), sprintsContainer).top;
			sprintsContainer.scrollTo({
				top: sprintsContainer.scrollTop + position - offset,
				behavior: 'smooth'
			});
		}
		isItemInViewport(item) {
			const rect = item.getNode().getBoundingClientRect();
			return rect.top >= 0 && rect.left >= 0 && rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) && rect.right <= (window.innerWidth || document.documentElement.clientWidth);
		}
		isBacklogItem(item) {
			return this.entityStorage.getBacklog().hasItem(item);
		}
	}

	class CompletedSprints extends main_core_events.EventEmitter {
		constructor(params) {
			super(params);
			this.setEventNamespace('BX.Tasks.Scrum.CompletedSprints');
			this.requestSender = params.requestSender;
			this.entityStorage = params.entityStorage;
			this.pageNumber = parseInt(params.pageNumber, 10);
			this.isShortView = params.isShortView;
			this.statsUploaded = false;
			this.sprintsUploaded = false;
			this.loader = null;
			this.isActiveLoad = false;
			this.node = null;
			this.header = null;
			this.filteredSprintsNode = null;
			this.listNode = null;
			this.emptySearchStub = null;
		}
		render() {
			this.node = main_core.Tag.render`
			<div class="tasks-scrum__content">
				<div class="tasks-scrum__sprints--completed">
					<div class="tasks-scrum__sprints--completed-title">
						<span class="tasks-scrum__sprints--completed-title-text">
							${main_core.Loc.getMessage('TASKS_SCRUM_COMPLETED_SPRINTS_TITLE')}
						</span>
					</div>
					<div class="tasks-scrum__content-empty --no-results">
						${main_core.Loc.getMessage('TASKS_SCRUM_EMPTY_SEARCH_STUB_COMPLETED')}
					</div>
					<div class="tasks-scrum__sprints--filtered-sprints"></div>
					${this.renderHeader()}
					${this.renderList()}
				</div>
			</div>
		`;
			this.filteredSprintsNode = this.node.querySelector('.tasks-scrum__sprints--filtered-sprints');
			this.listNode = this.node.querySelector('.tasks-scrum__sprints--completed-list');
			this.emptySearchStub = this.node.querySelector('.tasks-scrum__content-empty');
			main_core.Event.bind(this.listNode, 'transitionend', this.onTransitionEnd.bind(this));
			const observerTargetNode = this.listNode.querySelector('.tasks-scrum-completed-sprints-observer-target');
			this.bindLoad(observerTargetNode);
			return this.node;
		}
		showEmptySearchStub() {
			main_core.Dom.addClass(this.emptySearchStub, '--open');
			this.hideFilteredHeader();
		}
		hideEmptySearchStub() {
			main_core.Dom.removeClass(this.emptySearchStub, '--open');
			this.showHeader();
		}
		renderHeader() {
			const btnStyles = 'tasks-scrum__sprint--btn-dropdown ui-btn ui-btn-sm ui-btn-icon-angle-down';
			this.header = main_core.Tag.render`
			<div class="tasks-scrum__sprints--completed-header">
				<div class="tasks-scrum__sprints--completed-name">
					${main_core.Loc.getMessage('TASKS_SCRUM_COMPLETED_SPRINTS_NAME')}
				</div>
				<div class="tasks-scrum__sprints--completed-stats"></div>
				<div class="tasks-scrum__sprints--completed-btn ${btnStyles}"></div>
			</div>
		`;
			const btnNode = this.header.querySelector('.tasks-scrum__sprints--completed-btn');
			main_core.Event.bind(btnNode, 'click', this.onBtnClick.bind(this));
			return this.header;
		}
		onBtnClick(event) {
			const node = event.currentTarget;
			const isShown = main_core.Dom.hasClass(node, '--up');
			if (isShown) {
				main_core.Dom.removeClass(node, '--up');
				this.hideList();
			} else {
				main_core.Dom.addClass(node, '--up');
				main_core.Dom.addClass(this.listNode, '--visible');
				this.showList();
				if (!this.isSprintsUploaded() && main_core.Type.isNull(this.loader)) {
					this.loader = this.showLoader();
				}
			}
			this.onLoadStats();
		}
		renderList() {
			return main_core.Tag.render`
			<div class="tasks-scrum__sprints--completed-list">
				${this.renderObserverTarget()}
			</div>
		`;
		}
		renderObserverTarget() {
			return main_core.Tag.render`<div class="tasks-scrum-completed-sprints-observer-target"></div>`;
		}
		renderStats(stats) {
			return main_core.Tag.render`
			<div>
				${main_core.Loc.getMessage('TASKS_SCRUM_COMPLETED_SPRINTS_STATS').replace('#tasks#', parseInt(stats.averageNumberTasks, 10)).replace('#storypoints#', parseInt(stats.averageNumberStoryPoints, 10)).replace('#percent#', parseInt(stats.averagePercentageCompletion, 10))}
			</div>
		`;
		}
		isSprintsUploaded() {
			return this.sprintsUploaded;
		}
		bindLoad(loader) {
			if (main_core.Type.isUndefined(IntersectionObserver)) {
				return;
			}
			const observer = new IntersectionObserver(entries => {
				if (entries[0].isIntersecting === true) {
					if (!this.isActiveLoad) {
						this.onLoadCompletedSprints();
					}
				}
			}, {
				threshold: [0]
			});
			observer.observe(loader);
		}
		onLoadStats() {
			if (this.statsUploaded) {
				return;
			}
			this.statsUploaded = true;
			this.requestSender.getCompletedSprintsStats().then(response => {
				this.updateStats(response.data);
			}).catch(response => {
				this.statsUploaded = false;
				this.requestSender.showErrorAlert(response);
			});
		}
		onLoadCompletedSprints() {
			this.isActiveLoad = true;
			if (this.isSprintsUploaded() && main_core.Type.isNull(this.loader)) {
				this.loader = this.showLoader();
			}
			const requestData = {
				pageNumber: this.pageNumber
			};
			this.requestSender.getCompletedSprints(requestData).then(response => {
				const data = response.data;
				if (main_core.Type.isArray(data) && data.length) {
					this.pageNumber++;
					this.createSprints(data);
					this.isActiveLoad = false;
					this.showList();
				}
				this.sprintsUploaded = true;
				if (this.loader) {
					this.loader.hide();
				}
			}).catch(response => {
				if (this.loader) {
					this.loader.hide();
				}
				this.isActiveLoad = false;
				this.requestSender.showErrorAlert(response);
			});
		}
		showLoader() {
			const listPosition = main_core.Dom.getPosition(this.listNode);
			const loader = new main_loader.Loader({
				target: this.listNode,
				size: 60,
				mode: 'inline',
				offset: {
					left: `${listPosition.width / 2 - 30}px`
				}
			});
			loader.show();
			return loader;
		}
		updateStats(stats) {
			const nameNode = this.node.querySelector('.tasks-scrum__sprints--completed-name');
			const statsHeaderNode = this.node.querySelector('.tasks-scrum__sprints--completed-stats');
			nameNode.textContent = nameNode.textContent + '- ' + parseInt(stats.numberSprints, 10);
			main_core.Dom.append(this.renderStats(stats), statsHeaderNode);
		}
		createSprints(sprints) {
			sprints.forEach(sprintData => {
				sprintData.isShortView = 'Y';
				const sprint = Sprint.buildSprint(sprintData);
				this.entityStorage.addSprint(sprint);
				main_core.Dom.insertBefore(sprint.render(), this.listNode.querySelector('.tasks-scrum-completed-sprints-observer-target'));
				sprint.onAfterAppend();
				this.emit('createSprint', sprint);
			});
		}
		addSprint(sprint) {
			this.entityStorage.addSprint(sprint);
			main_core.Dom.insertBefore(sprint.render(), this.listNode.firstElementChild);
			sprint.onAfterAppend();
			this.emit('createSprint', sprint);
		}
		showFilteredSprints(completedSprints) {
			if (main_core.Type.isNull(this.filteredSprintsNode)) {
				return;
			}
			main_core.Dom.clean(this.filteredSprintsNode);
			completedSprints.forEach(sprint => {
				main_core.Dom.append(sprint.render(), this.filteredSprintsNode);
				sprint.onAfterAppend();
				this.emit('createSprint', sprint);
				this.entityStorage.addFilteredCompletedSprint(sprint);
				setTimeout(() => sprint.toggleVisibilityContent(sprint.getContentContainer()), 100);
			});
			this.hideFilteredHeader();
		}
		hideFilteredSprints() {
			main_core.Dom.clean(this.filteredSprintsNode);
			this.entityStorage.clearFilteredCompletedSprints();
			this.showHeader();
		}
		hideFilteredHeader() {
			this.hideHeader();
			this.hideList();
			main_core.Dom.removeClass(this.header.querySelector('.tasks-scrum__sprints--completed-btn'), '--up');
		}
		showHeader() {
			if (main_core.Type.isNull(this.header)) {
				return;
			}
			main_core.Dom.removeClass(this.header, '--hide');
		}
		hideHeader() {
			if (main_core.Type.isNull(this.header)) {
				return;
			}
			main_core.Dom.addClass(this.header, '--hide');
		}
		showList() {
			const parentNode = this.node.querySelector('.tasks-scrum__sprints--completed');
			main_core.Dom.addClass(parentNode, '--open');
			main_core.Dom.style(this.listNode, 'height', `${this.listNode.scrollHeight}px`);
			this.emit('adjustWidth');
		}
		hideList() {
			const parentNode = this.node.querySelector('.tasks-scrum__sprints--completed');
			main_core.Dom.removeClass(parentNode, '--open');

			/* eslint-disable */
			this.listNode.style.height = `${this.listNode.scrollHeight}px`;
			this.listNode.clientHeight;
			this.listNode.style.height = '0';
			/* eslint-enable */
		}
		onTransitionEnd() {
			const isHide = main_core.Dom.style(this.listNode, 'height') === '0px';
			if (isHide) {
				main_core.Dom.removeClass(this.listNode, '--visible');
			} else {
				main_core.Dom.style(this.listNode, 'height', 'auto');
			}
			this.emit('adjustWidth');
		}
	}

	class PlanBuilder extends main_core_events.EventEmitter {
		constructor(params) {
			super(params);
			this.setEventNamespace('BX.Tasks.Scrum.DomBuilder');
			this.requestSender = params.requestSender;
			this.entityStorage = params.entityStorage;
			this.defaultSprintDuration = params.defaultSprintDuration;
			this.pageNumberToCompletedSprints = params.pageNumberToCompletedSprints;
			this.displayPriority = params.displayPriority;
			this.isShortView = params.isShortView;
			this.mandatoryExists = params.mandatoryExists;
			this.isExactSearchApplied = params.isExactSearchApplied === 'Y';
			this.pageSize = parseInt(params.pageSize, 10);
			this.scroller = new Scroller({
				planBuilder: this,
				entityStorage: this.entityStorage
			});
			this.loadItemsRepeatCounter = new Map();
		}
		renderTo(container) {
			this.scrumContainer = container;
			this.setWidthPriority(this.displayPriority);
			main_core.Dom.append(this.entityStorage.getBacklog().render(), this.scrumContainer);
			this.entityStorage.getBacklog().onAfterAppend();
			main_core.Dom.append(this.renderSprintsContainer(), this.scrumContainer);
			this.entityStorage.getSprints().forEach(sprint => {
				if (!sprint.isCompleted()) {
					sprint.onAfterAppend();
				}
			});
			this.emit('setDraggable');
			this.adjustSprintListWidth();
		}
		renderSprintsContainer() {
			this.completedSprints = new CompletedSprints({
				requestSender: this.requestSender,
				entityStorage: this.entityStorage,
				pageNumber: this.pageNumberToCompletedSprints,
				isShortView: this.isShortView
			});
			this.completedSprints.subscribe('createSprint', baseEvent => {
				this.emit('createSprint', baseEvent.getData());
			});
			this.completedSprints.subscribe('adjustWidth', () => this.adjustSprintListWidth());
			const activeSprint = this.entityStorage.getActiveSprint();
			const plannedSprints = this.entityStorage.getPlannedSprints();
			this.sprintsNode = main_core.Tag.render`
			<div class="tasks-scrum__sprints --scrollbar">
				<div class="tasks-scrum__sprints--active ${activeSprint ? '' : '--empty'}">
					${activeSprint ? activeSprint.render() : ''}
				</div>
				<div class="tasks-scrum__sprints--planned ${plannedSprints.size ? '' : '--empty'}">
					${[...plannedSprints.values()].map(sprint => sprint.render())}
				</div>
				${this.renderSprintDropzone()}
				${this.entityStorage.existCompletedSprint() ? this.completedSprints.render() : ''}
			</div>
		`;
			this.updatePlannedSprints(plannedSprints, !main_core.Type.isUndefined(activeSprint));
			if (this.isExactSearchApplied) {
				const filteredCompletedSprints = this.entityStorage.getFilteredCompletedSprints();
				if (filteredCompletedSprints.size) {
					this.showFilteredCompletedSprints(filteredCompletedSprints);
				} else {
					this.showEmptySearchStub();
				}
			}
			main_core.Event.bind(this.sprintsNode, 'scroll', this.onSprintsScroll.bind(this));
			return this.sprintsNode;
		}
		renderSprintDropzone() {
			this.sprintDropzone = main_core.Tag.render`
			<div class="tasks-scrum__content">
				<div class="tasks-scrum__sprints--new-sprint">
					${main_core.Loc.getMessage('TASKS_SCRUM_PLAN_SPRINT_DROPZONE')}
				</div>
			</div>
		`;
			main_core.Event.bind(this.sprintDropzone, 'click', this.createSprint.bind(this));
			return this.sprintDropzone;
		}
		setWidthPriority(value) {
			if (value === 'backlog') {
				main_core.Dom.addClass(this.scrumContainer, '--width-priority-backlog');
			} else {
				main_core.Dom.removeClass(this.scrumContainer, '--width-priority-backlog');
			}
		}
		setShortView(value) {
			this.isShortView = value;
		}
		getSprintsContainer() {
			return this.sprintsNode;
		}
		getSprintDropzone() {
			return this.sprintDropzone;
		}
		isSprintDropzone(container) {
			if (container.firstElementChild) {
				return main_core.Dom.hasClass(container.firstElementChild, 'tasks-scrum__sprints--new-sprint');
			} else {
				return false;
			}
		}
		createSprint() {
			const dateStart = Math.floor(Date.now() / 1000);
			const dateEnd = Math.floor(Date.now() / 1000) + parseInt(this.defaultSprintDuration, 10);
			const sort = this.entityStorage.getPlannedSprints().size + 1;
			const requestData = {
				tmpId: main_core.Text.getRandom(),
				sort: sort + 1,
				dateStart: dateStart,
				dateEnd: dateEnd
			};
			this.emit('beforeCreateSprint', requestData);
			return this.requestSender.createSprint(requestData).then(response => {
				const sprintParams = response.data;
				sprintParams.isShortView = this.isShortView;
				sprintParams.mandatoryExists = this.mandatoryExists;
				sprintParams.isExactSearchApplied = this.isExactSearchApplied ? 'Y' : 'N';
				const sprint = Sprint.buildSprint(sprintParams);
				this.entityStorage.addSprint(sprint);
				this.appendToPlannedContainer(sprint);
				this.updateVisibilitySprints(sprint).then(() => {
					this.scroller.scrollToSprint(sprint);
					this.emit('createSprint', sprint);
				});
				return sprint;
			}).catch(response => {
				this.requestSender.showErrorAlert(response);
			});
		}
		createSprintNode(sprint) {
			sprint.setShortView(this.isShortView);
			sprint.setMandatory(this.mandatoryExists);
			this.entityStorage.addSprint(sprint);
			this.appendToPlannedContainer(sprint);
			this.emit('createSprintNode', sprint);
		}
		appendToPlannedContainer(sprint) {
			const container = this.getSprintsContainer().querySelector('.tasks-scrum__sprints--planned');
			main_core.Dom.append(sprint.render(), container);
			main_core.Dom.removeClass(container, '--empty');
			sprint.onAfterAppend();
			this.adjustSprintListWidth();
			this.updatePlannedSprints(this.entityStorage.getPlannedSprints(), !main_core.Type.isUndefined(this.entityStorage.getActiveSprint()));
		}
		moveSprintToActiveListNode(sprint) {
			const container = this.getSprintsContainer().querySelector('.tasks-scrum__sprints--active');
			main_core.Dom.append(sprint.getNode(), container);
			main_core.Dom.removeClass(container, '--empty');
		}
		moveSprintToCompletedListNode(sprint) {
			sprint.removeNode();
			this.entityStorage.removeSprint(sprint.getId());
			if (this.completedSprints.isSprintsUploaded()) {
				this.completedSprints.addSprint(sprint);
			}
			this.adjustSprintListWidth();
		}
		appendItemAfterItem(newItemNode, bindItemNode) {
			if (bindItemNode.nextElementSibling) {
				main_core.Dom.insertBefore(newItemNode, bindItemNode.nextElementSibling);
			} else {
				main_core.Dom.append(newItemNode, bindItemNode.parentElement);
			}
		}
		onSprintsScroll() {
			this.emit('sprintsScroll');
		}
		adjustSprintListWidth() {
			this.updateSprintContainers();
			const hasScroll = this.getSprintsContainer().scrollHeight > this.getSprintsContainer().clientHeight;
			if (hasScroll) {
				main_core.Dom.addClass(this.getSprintsContainer(), '--scrollbar');
			} else {
				main_core.Dom.removeClass(this.getSprintsContainer(), '--scrollbar');
			}
		}
		updateSprintContainers() {
			const activeSprint = this.entityStorage.getActiveSprint();
			const activeContainer = this.getSprintsContainer().querySelector('.tasks-scrum__sprints--active');
			if (activeSprint) {
				main_core.Dom.removeClass(activeContainer, '--empty');
			} else {
				main_core.Dom.addClass(activeContainer, '--empty');
			}
			const plannedSprints = this.entityStorage.getPlannedSprints();
			const plannedContainer = this.getSprintsContainer().querySelector('.tasks-scrum__sprints--planned');
			if (plannedSprints.size) {
				main_core.Dom.removeClass(plannedContainer, '--empty');
			} else {
				main_core.Dom.addClass(plannedContainer, '--empty');
			}
		}
		updatePlannedSprints(plannedSprints, existActiveSprint) {
			if (existActiveSprint) {
				plannedSprints.forEach(plannedSprint => {
					plannedSprint.disableHeaderButton();
				});
			} else {
				plannedSprints.forEach(plannedSprint => {
					plannedSprint.unDisableHeaderButton();
				});
			}
		}
		getScrumContainer() {
			return this.scrumContainer;
		}
		blockScrumContainerSelect() {
			main_core.Dom.addClass(this.scrumContainer, '--select-none');
		}
		unblockScrumContainerSelect() {
			setTimeout(() => {
				main_core.Dom.removeClass(this.scrumContainer, '--select-none');
			}, 500);
		}
		showEmptySearchStub() {
			if (this.entityStorage.existCompletedSprint()) {
				this.completedSprints.showEmptySearchStub();
			}
		}
		hideEmptySearchStub() {
			if (this.entityStorage.existCompletedSprint()) {
				this.completedSprints.hideEmptySearchStub();
			}
		}
		showFilteredCompletedSprints(completedSprints) {
			if (this.entityStorage.existCompletedSprint()) {
				this.completedSprints.showFilteredSprints(completedSprints);
			}
		}
		hideFilteredCompletedSprints() {
			if (this.entityStorage.existCompletedSprint()) {
				this.completedSprints.hideFilteredSprints();
			}
		}
		loadItems(entity) {
			if (!this.loadItemsRepeatCounter.has(entity.getId())) {
				this.loadItemsRepeatCounter.set(entity.getId(), 0);
			}
			if (this.loadItemsRepeatCounter.get(entity.getId()) > 1) {
				entity.unbindItemsLoader();
				return;
			}
			entity.setActiveLoadItems(true);
			if (entity.getNumberItems() >= this.pageSize) {
				entity.getListItems().addScrollbar();
			}
			const requestData = {
				entityId: entity.getId(),
				pageNumber: entity.getPageNumberItems() + 1,
				pageSize: this.pageSize
			};
			return this.requestSender.getItems(requestData).then(response => {
				const items = response.data;
				entity.setActiveLoadItems(false);
				if (entity.isHideContent()) {
					return;
				}
				if (main_core.Type.isArray(items) && items.length) {
					entity.incrementPageNumberItems();
					this.createItemsInEntity(entity, items);
					if (entity.isGroupMode()) {
						entity.activateGroupMode();
					}
					entity.bindItemsLoader();
				} else {
					if (entity.getNumberTasks() !== entity.getNumberItems()) {
						this.loadItemsRepeatCounter.set(entity.getId(), this.loadItemsRepeatCounter.get(entity.getId()) + 1);
						entity.decrementPageNumberItems();
						return this.loadItems(entity);
					} else {
						entity.unbindItemsLoader();
					}
				}
				return true;
			}).catch(response => {
				entity.setActiveLoadItems(false);
				this.requestSender.showErrorAlert(response);
			});
		}
		clearLoadItemsRepeatCounter() {
			this.loadItemsRepeatCounter.clear();
		}
		loadAllItems(entity) {
			const requestData = {
				entityId: entity.getId(),
				withoutNav: 'Y'
			};
			return this.requestSender.getItems(requestData).then(response => {
				const items = response.data;
				if (main_core.Type.isArray(items) && items.length) {
					this.createItemsInEntity(entity, items);
				}
				entity.unbindItemsLoader();
				return true;
			}).catch(response => {
				entity.setActiveLoadItems(false);
				this.requestSender.showErrorAlert(response);
			});
		}
		createItemsInEntity(entity, items) {
			items.forEach(itemData => {
				const item = Item.buildItem(itemData);
				item.setEntityType(entity.getEntityType());
				if (!this.entityStorage.findItemByItemId(item.getId())) {
					item.setShortView(entity.getShortView());
					entity.appendItemToList(item);
					entity.setItem(item);
				}
			});
		}
		updateVisibilitySprints(sprint) {
			const results = [];
			this.entityStorage.getSprintsAvailableForFilling(sprint).forEach(anotherSprint => {
				if (!anotherSprint.isHideContent() && anotherSprint.isWaitingLoadItems()) {
					results.push(anotherSprint.hideContent(anotherSprint.getContentContainer()));
				}
			});
			if (sprint.isHideContent()) {
				results.push(sprint.showContent(sprint.getContentContainer()));
			}
			return Promise.all(results);
		}
	}

	class ActionPanel extends main_core_events.EventEmitter {
		constructor(params) {
			super(params);
			this.setEventNamespace('BX.Tasks.Scrum.ActionPanel');
			this.entity = params.entity;
			this.item = params.item;
			this.bindElement = this.item.getNode();
			this.itemList = {
				...{
					task: {
						activity: false
					},
					attachment: {
						activity: false
					},
					dod: {
						activity: false
					},
					move: {
						activity: false
					},
					sprint: {
						activity: false
					},
					backlog: {
						activity: false
					},
					tags: {
						activity: false
					},
					epic: {
						activity: false
					},
					decomposition: {
						activity: false
					},
					remove: {
						activity: false
					}
				},
				...params.itemList
			};
			this.node = null;
			this.isBlockBlur = false;
			this.hintManager = null;
			this.observeBindElement();
		}
		show() {
			this.node = this.calculatePanelPosition(this.createActionPanel());
			this.bindItems();
			this.hintManager = BX.UI.Hint.createInstance({
				popupParameters: {
					closeByEsc: true,
					autoHide: true,
					animation: null
				}
			});
			this.hintManager.init(this.node);
			main_core.Dom.append(this.node, document.body);
		}
		destroy() {
			main_core.Dom.remove(this.node);
			this.node = null;
			if (this.observer) {
				this.observer.disconnect();
			}
			this.hideHint();
			this.emit('onDestroy');
		}
		hideHint() {
			if (this.hintManager) {
				this.hintManager.hide();
			}
		}
		getNode() {
			return this.node;
		}
		getItem() {
			return this.item;
		}
		createActionPanel() {
			let task = '';
			let attachment = '';
			let dod = '';
			let move = '';
			let sprint = '';
			let backlog = '';
			let tags = '';
			let epic = '';
			let decomposition = '';
			let remove = '';
			const baseBtnClass = 'tasks-scrum__action-panel--btn';
			const arrowClass = 'tasks-scrum__action-panel--btn-with-arrow';
			const selected = main_core.Tag.render`
			<div class="tasks-scrum__action-panel--selected-btn tasks-scrum__action-panel--btn-selected">
				<span class="tasks-scrum__action-panel--text">
					${this.getSelectedText(this.entity.getGroupModeItems().size)}
				</span>
				<span class="tasks-scrum__action-panel--icon"></span>
			</div>
			<div class="tasks-scrum__action-panel--separator"></div>
		`;
			if (this.itemList.task.activity) {
				const disableClass = this.itemList.task.disable === true ? '--disabled' : '';
				task = main_core.Tag.render`
				<div
					class="${baseBtnClass} tasks-scrum__action-panel--btn-task ${disableClass}"
					data-hint="${main_core.Loc.getMessage('TASKS_SCRUM_ITEM_ACTIONS_TASK_HINT')}" data-hint-no-icon
				>
					<span class="tasks-scrum__action-panel--icon"></span>
					<span class="tasks-scrum__action-panel--text">
						${main_core.Loc.getMessage('TASKS_SCRUM_ITEM_ACTIONS_TASK')}
					</span>
				</div>
				<div class="tasks-scrum__action-panel--separator"></div>
			`;
			}
			if (this.itemList.attachment.activity) {
				const disableClass = this.itemList.attachment.disable === true ? '--disabled' : '';
				attachment = main_core.Tag.render`
				<div
					class="${baseBtnClass} tasks-scrum__action-panel--btn-attachment ${disableClass}"
					data-hint="${main_core.Loc.getMessage('TASKS_SCRUM_ITEM_ACTIONS_FILE_HINT')}" data-hint-no-icon
				>
					<span class="tasks-scrum__action-panel--icon"></span>
				</div>
				<div class="tasks-scrum__action-panel--separator"></div>
			`;
			}
			if (this.itemList.dod.activity) {
				const disableClass = this.itemList.dod.disable === true ? '--disabled' : '';
				dod = main_core.Tag.render`
				<div
					class="${baseBtnClass} tasks-scrum__action-panel--btn-dod ${disableClass}"
					data-hint="${main_core.Loc.getMessage('TASKS_SCRUM_ITEM_ACTIONS_DOD_HINT_NEW')}" data-hint-no-icon
				>
					<span class="tasks-scrum__action-panel--text">
						${main_core.Loc.getMessage('TASKS_SCRUM_ITEM_ACTIONS_DOD')}
					</span>
				</div>
				<div class="tasks-scrum__action-panel--separator"></div>
			`;
			}
			if (this.itemList.move.activity) {
				const disableClass = this.itemList.move.disable === true ? '--disabled' : '';
				move = main_core.Tag.render`
				<div
					class="${baseBtnClass} tasks-scrum__action-panel--btn-move ${arrowClass} ${disableClass}"
					data-hint="${main_core.Loc.getMessage('TASKS_SCRUM_ITEM_ACTIONS_MOVE_HINT')}" data-hint-no-icon
				>
					<span class="tasks-scrum__action-panel--text">
						${main_core.Loc.getMessage('TASKS_SCRUM_ITEM_ACTIONS_MOVE')}
					</span>
				</div>
				<div class="tasks-scrum__action-panel--separator"></div>
			`;
			}
			if (this.itemList.sprint.activity) {
				const disableClass = this.itemList.sprint.disable === true ? '--disabled' : '';
				const sprintArrowClass = this.itemList.sprint.multiple === true ? arrowClass : '';
				sprint = main_core.Tag.render`
				<div
					class="${baseBtnClass} tasks-scrum__action-panel--btn-sprint ${sprintArrowClass} ${disableClass}"
					data-hint="${main_core.Loc.getMessage('TASKS_SCRUM_ITEM_ACTIONS_SPRINT_HINT')}" data-hint-no-icon
				>
					<span class="tasks-scrum__action-panel--text">
						${main_core.Loc.getMessage('TASKS_SCRUM_ITEM_ACTIONS_SPRINT')}
					</span>
				</div>
				<div class="tasks-scrum__action-panel--separator"></div>
			`;
			}
			if (this.itemList.backlog.activity) {
				const disableClass = this.itemList.backlog.disable === true ? '--disabled' : '';
				backlog = main_core.Tag.render`
				<div
					class="${baseBtnClass} tasks-scrum__action-panel--btn-backlog ${disableClass}"
					data-hint="${main_core.Loc.getMessage('TASKS_SCRUM_ITEM_ACTIONS_BACKLOG_HINT')}" data-hint-no-icon
				>
					<span class="tasks-scrum__action-panel--text">
						${main_core.Loc.getMessage('TASKS_SCRUM_ITEM_ACTIONS_BACKLOG')}
					</span>
				</div>
				<div class="tasks-scrum__action-panel--separator"></div>
			`;
			}
			if (this.itemList.tags.activity) {
				const disableClass = this.itemList.tags.disable === true ? '--disabled' : '';
				tags = main_core.Tag.render`
				<div
					class="${baseBtnClass} tasks-scrum__action-panel--btn-tags ${arrowClass} ${disableClass}"
					data-hint="${main_core.Loc.getMessage('TASKS_SCRUM_ITEM_ACTIONS_TAG_HINT')}" data-hint-no-icon
				>
					<span class="tasks-scrum__action-panel--text">
						${main_core.Loc.getMessage('TASKS_SCRUM_ITEM_ACTIONS_TAGS')}
					</span>
				</div>
				<div class="tasks-scrum__action-panel--separator"></div>
			`;
			}
			if (this.itemList.epic.activity) {
				const disableClass = this.itemList.epic.disable === true ? '--disabled' : '';
				epic = main_core.Tag.render`
				<div
					class="${baseBtnClass} tasks-scrum__action-panel--btn-epics ${arrowClass} ${disableClass}"
					data-hint="${main_core.Loc.getMessage('TASKS_SCRUM_ITEM_ACTIONS_EPIC_HINT')}" data-hint-no-icon
				>
					<span class="tasks-scrum__action-panel--text">
						${main_core.Loc.getMessage('TASKS_SCRUM_ITEM_ACTIONS_EPIC')}
					</span>
				</div>
				<div class="tasks-scrum__action-panel--separator"></div>
			`;
			}
			if (this.itemList.decomposition.activity) {
				const disableClass = this.itemList.decomposition.disable === true ? '--disabled' : '';
				const decClass = this.entity.isBacklog() ? 'tasks-scrum__action-panel--btn-decomposition-backlog' : 'tasks-scrum__action-panel--btn-decomposition-sprint';
				const hintText = this.entity.isBacklog() ? main_core.Loc.getMessage('TASKS_SCRUM_ITEM_ACTIONS_DEC_BACKLOG_HINT') : main_core.Loc.getMessage('TASKS_SCRUM_ITEM_ACTIONS_DEC_SPRINT_HINT');
				decomposition = main_core.Tag.render`
				<div
					class="${baseBtnClass} ${decClass} ${disableClass}"
					data-hint="${hintText}" data-hint-no-icon
				>
					<span class="tasks-scrum__action-panel--icon"></span>
				</div>
				<div class="tasks-scrum__action-panel--separator"></div>
			`;
			}
			if (this.itemList.remove.activity) {
				const disableClass = this.itemList.remove.disable === true ? '--disabled' : '';
				remove = main_core.Tag.render`
				<div
					class="${baseBtnClass} tasks-scrum__action-panel--btn-remove ${disableClass}"
					data-hint="${main_core.Loc.getMessage('TASKS_SCRUM_ITEM_ACTIONS_REMOVE_HINT')}" data-hint-no-icon
				>
					<span class="tasks-scrum__action-panel--icon"></span>
				</div>
			`;
			}
			return main_core.Tag.render`
			<div class="tasks-scrum__action-panel--container tasks-scrum__action-panel--scope" tabindex="1">
				<div class="tasks-scrum__action-panel">
					${selected}
					${task}
					${attachment}
					${dod}
					${move}
					${sprint}
					${backlog}
					${tags}
					${epic}
					${decomposition}
					${remove}
				</div>
			</div>
		`;
		}
		bindItems() {
			const selectedBtn = this.node.querySelector('.tasks-scrum__action-panel--btn-selected');
			main_core.Event.bind(selectedBtn.querySelector('.tasks-scrum__action-panel--icon'), 'click', () => this.emit('unSelect'));
			if (this.itemList.task.activity && this.itemList.task.disable !== true) {
				main_core.Event.bind(this.node.querySelector('.tasks-scrum__action-panel--btn-task'), 'click', this.itemList.task.callback);
			}
			if (this.itemList.attachment.activity && this.itemList.attachment.disable !== true) {
				main_core.Event.bind(this.node.querySelector('.tasks-scrum__action-panel--btn-attachment'), 'click', this.itemList.attachment.callback);
			}
			if (this.itemList.dod.activity && this.itemList.dod.disable !== true) {
				main_core.Event.bind(this.node.querySelector('.tasks-scrum__action-panel--btn-dod'), 'click', this.itemList.dod.callback);
			}
			if (this.itemList.move.activity && this.itemList.move.disable !== true) {
				main_core.Event.bind(this.node.querySelector('.tasks-scrum__action-panel--btn-move'), 'click', this.itemList.move.callback);
			}
			if (this.itemList.sprint.activity && this.itemList.sprint.disable !== true) {
				main_core.Event.bind(this.node.querySelector('.tasks-scrum__action-panel--btn-sprint'), 'click', this.itemList.sprint.callback);
			}
			if (this.itemList.backlog.activity && this.itemList.backlog.disable !== true) {
				main_core.Event.bind(this.node.querySelector('.tasks-scrum__action-panel--btn-backlog'), 'click', this.itemList.backlog.callback);
			}
			if (this.itemList.tags.activity && this.itemList.tags.disable !== true) {
				main_core.Event.bind(this.node.querySelector('.tasks-scrum__action-panel--btn-tags'), 'click', this.itemList.tags.callback);
			}
			if (this.itemList.epic.activity && this.itemList.epic.disable !== true) {
				main_core.Event.bind(this.node.querySelector('.tasks-scrum__action-panel--btn-epics'), 'click', this.itemList.epic.callback);
			}
			if (this.itemList.decomposition.activity && this.itemList.decomposition.disable !== true) {
				const decClass = this.entity.isBacklog() ? 'tasks-scrum__action-panel--btn-decomposition-backlog' : 'tasks-scrum__action-panel--btn-decomposition-sprint';
				main_core.Event.bind(this.node.querySelector('.' + decClass), 'click', this.itemList.decomposition.callback);
			}
			if (this.itemList.remove.activity && this.itemList.remove.disable !== true) {
				main_core.Event.bind(this.node.querySelector('.tasks-scrum__action-panel--btn-remove'), 'click', this.itemList.remove.callback);
			}
		}
		getSelectedText(number) {
			return main_core.Loc.getMessage('TASKS_SCRUM_ITEM_ACTIONS_SELECTED') + parseInt(number, 10);
		}
		observeBindElement() {
			if (main_core.Type.isUndefined(IntersectionObserver)) {
				return;
			}
			this.observer = new IntersectionObserver(entries => {
				if (entries[0].isIntersecting === true) {
					this.displayPanel();
				} else {
					this.hidePanel();
				}
			}, {
				threshold: [0]
			});
			this.observer.observe(this.bindElement);
		}
		displayPanel() {
			if (!main_core.Dom.isShown(this.getNode())) {
				main_core.Dom.style(this.getNode(), 'display', 'block');
			}
		}
		hidePanel() {
			if (main_core.Dom.isShown(this.getNode())) {
				main_core.Dom.style(this.getNode(), 'display', 'none');
			}
		}
		calculatePanelPosition(panel) {
			const position = main_core.Dom.getPosition(this.bindElement);
			const top = `${position.top}px`;
			let left = `${position.left}px`;
			const fakePanel = panel.cloneNode(true);
			main_core.Dom.style(fakePanel, 'visibility', 'hidden');
			main_core.Dom.style(fakePanel, 'top', `${position.top}px`);
			main_core.Dom.style(fakePanel, 'left', `${position.left}px`);
			main_core.Dom.append(fakePanel, document.body);
			if (this.isPanelWiderThanViewport(fakePanel)) {
				const fakePanelRect = fakePanel.getBoundingClientRect();
				const windowWidth = window.innerWidth || document.documentElement.clientWidth;
				left = `${fakePanelRect.left - (fakePanelRect.right - windowWidth + 40)}px`;
			}
			main_core.Dom.remove(fakePanel);
			main_core.Dom.style(panel, 'top', top);
			main_core.Dom.style(panel, 'left', left);
			main_core.Dom.style(panel, 'zIndex', 1100);
			this.removeLastSeparator(panel);
			return panel;
		}
		isPanelWiderThanViewport(element) {
			const rect = element.getBoundingClientRect();
			const windowWidth = window.innerWidth || document.documentElement.clientWidth;
			return rect.right > windowWidth;
		}
		calculatePanelTopPosition() {
			if (!this.getNode()) {
				return;
			}
			const position = main_core.Dom.getPosition(this.bindElement);
			main_core.Dom.style(this.getNode(), 'top', `${position.top}px`);
		}
		removeLastSeparator(panel) {
			const actionPanel = panel.querySelector('.tasks-scrum__action-panel');
			if (main_core.Dom.hasClass(actionPanel.lastElementChild, 'tasks-scrum__action-panel--separator')) {
				main_core.Dom.remove(actionPanel.lastElementChild);
			}
		}
	}

	class SearchArrows extends main_core_events.EventEmitter {
		constructor(params) {
			super(params);
			this.setEventNamespace('BX.Tasks.Scrum.SearchArrows');
			this.list = params.list;
			this.currentPosition = parseInt(params.currentPosition, 10);
			this.node = null;
		}
		render() {
			this.node = main_core.Tag.render`
			<div class="tasks-scrum__item--nav-linked tasks-scrum__scope">
				<div class="tasks-scrum__item--nav-linked-close"></div>
				<div class="tasks-scrum__item--nav-linked-block">
					<div class="tasks-scrum__item--nav-linked-prev"></div>
					<div class="tasks-scrum__item--nav-linked-num-container --visible">
					<div class="tasks-scrum__item--nav-linked-num">${this.currentPosition}/${this.list.size}</div>
					</div>
					<div class="tasks-scrum__item--nav-linked-next"></div>
				</div>
			</div>
		`;
			const closeBtn = this.node.querySelector('.tasks-scrum__item--nav-linked-close');
			const prevBtn = this.node.querySelector('.tasks-scrum__item--nav-linked-prev');
			const nextBtn = this.node.querySelector('.tasks-scrum__item--nav-linked-next');
			main_core.Event.bind(closeBtn, 'click', this.onClose.bind(this));
			main_core.Event.bind(prevBtn, 'click', this.onPrev.bind(this));
			main_core.Event.bind(nextBtn, 'click', this.onNext.bind(this));
			return this.node;
		}
		getNode() {
			return this.node;
		}
		updateCurrentPosition(value) {
			this.currentPosition = parseInt(value, 10);
			if (this.node) {
				this.node.querySelector('.tasks-scrum__item--nav-linked-num').textContent = `${this.currentPosition}/${this.list.size}`;
			}
		}
		remove() {
			main_core.Dom.remove(this.node);
			this.node = null;
		}
		onClose() {
			this.emit('close');
		}
		onPrev() {
			this.emit('prev');
		}
		onNext() {
			this.emit('next');
		}
	}

	class SearchItems extends main_core_events.EventEmitter {
		constructor(params) {
			super(params);
			this.setEventNamespace('BX.Tasks.Scrum.SearchItems');
			this.planBuilder = params.planBuilder;
			this.entityStorage = params.entityStorage;
			this.scroller = new Scroller({
				planBuilder: this.planBuilder,
				entityStorage: this.entityStorage
			});
			this.active = false;
			this.list = new Set();
			this.currentIndex = 0;
			this.arrows = null;
		}
		start(startItem, linkedItemIds) {
			this.active = true;
			this.setList(linkedItemIds);
			this.fadeOutAll();
			if (!this.isBacklogItem(startItem)) {
				this.scroller.scrollToItem(this.getCurrent());
			}
			if (!startItem.isDisabled()) {
				this.updateCurrentIndexByItem(startItem);
				this.activateCurrent(startItem);
			}
			this.list.forEach(item => {
				item.activateLinkedMode();
			});
			this.showArrows();
		}
		stop() {
			this.active = false;
			this.currentIndex = 0;
			this.fadeInAll();
			this.cleanList();
			this.removeArrows();
		}
		setList(linkedItemIds) {
			this.list = new Set();
			const items = this.entityStorage.getAllItems();
			linkedItemIds.forEach(itemId => {
				if (items.has(itemId)) {
					this.list.add(items.get(itemId));
				}
			});
		}
		isActive() {
			return this.active;
		}
		isBacklogItem(item) {
			return this.entityStorage.getBacklog().hasItem(item);
		}
		getCurrent() {
			return [...this.list.values()][this.currentIndex];
		}
		updateCurrentIndexByItem(inputItem) {
			this.deactivateCurrent(this.getCurrent());
			[...this.list.values()].forEach((item, index) => {
				if (inputItem.getId() === item.getId()) {
					this.currentIndex = index;
				}
			});
			this.updateArrows();
		}
		moveToPrev() {
			this.deactivateCurrent(this.getCurrent());
			this.currentIndex--;
			if (this.currentIndex < 0) {
				this.currentIndex = this.list.size - 1;
			}
			this.updateArrows();
			const currentItem = this.getCurrent();
			this.scroller.scrollToItem(currentItem);
			this.activateCurrent(currentItem);
		}
		moveToNext() {
			this.deactivateCurrent(this.getCurrent());
			this.currentIndex++;
			if (this.currentIndex === this.list.size) {
				this.currentIndex = 0;
			}
			this.updateArrows();
			const currentItem = this.getCurrent();
			this.scroller.scrollToItem(currentItem);
			this.activateCurrent(currentItem);
		}
		activateCurrent(item) {
			item.activateCurrentLinkedMode(item);
		}
		deactivateCurrent() {
			this.list.forEach(item => {
				item.deactivateCurrentLinkedMode();
			});
		}
		fadeOutAll() {
			this.entityStorage.getBacklog().fadeOut();
			const activeSprint = this.entityStorage.getActiveSprint();
			if (activeSprint) {
				activeSprint.fadeOut();
				if (activeSprint.isHideContent()) {
					activeSprint.toggleVisibilityContent(activeSprint.getContentContainer());
				}
			}
			this.entityStorage.getPlannedSprints().forEach(sprint => {
				sprint.fadeOut();
				if (sprint.isHideContent()) {
					sprint.toggleVisibilityContent(sprint.getContentContainer());
				}
			});
		}
		fadeInAll() {
			this.entityStorage.getBacklog().fadeIn();
			const activeSprint = this.entityStorage.getActiveSprint();
			if (activeSprint) {
				activeSprint.fadeIn();
			}
			this.entityStorage.getPlannedSprints().forEach(sprint => {
				sprint.fadeIn();
			});
		}
		deactivateGroupMode() {
			this.entityStorage.getBacklog().deactivateGroupMode();
			const activeSprint = this.entityStorage.getActiveSprint();
			if (activeSprint) {
				activeSprint.deactivateGroupMode();
			}
			this.entityStorage.getPlannedSprints().forEach(sprint => {
				sprint.deactivateGroupMode();
			});
		}
		showArrows() {
			this.arrows = new SearchArrows({
				currentPosition: this.currentIndex + 1,
				list: this.list
			});
			this.arrows.subscribe('close', this.stop.bind(this));
			this.arrows.subscribe('prev', this.moveToPrev.bind(this));
			this.arrows.subscribe('next', this.moveToNext.bind(this));
			main_core.Dom.append(this.arrows.render(), document.body);
			this.adjustArrowsPosition();
		}
		updateArrows() {
			if (this.arrows) {
				this.arrows.updateCurrentPosition(this.currentIndex + 1);
			}
		}
		adjustArrowsPosition() {
			const arrowsRect = main_core.Dom.getPosition(this.arrows.getNode());
			const backlogRect = main_core.Dom.getPosition(this.entityStorage.getBacklog().getNode());
			this.arrows.getNode().style.top = `${backlogRect.height / 2 + (backlogRect.top - arrowsRect.height)}px`;
			this.arrows.getNode().style.left = `${backlogRect.left - (arrowsRect.width / 2 + 16)}px`;
		}
		cleanList() {
			this.list.forEach(item => item.deactivateLinkedMode());
			this.list = new Set();
		}
		removeArrows() {
			this.arrows.remove();
		}
		isClickInside(node) {
			let isClickInside = false;
			const backlog = this.entityStorage.getBacklog();
			if (backlog.getNode().contains(node)) {
				isClickInside = true;
			}
			const activeSprint = this.entityStorage.getActiveSprint();
			if (activeSprint && activeSprint.getNode().contains(node)) {
				isClickInside = true;
			}
			if (this.arrows && this.arrows.getNode().contains(node)) {
				isClickInside = true;
			}
			this.entityStorage.getPlannedSprints().forEach(sprint => {
				if (sprint.getNode().contains(node)) {
					isClickInside = true;
				}
			});
			return isClickInside;
		}
	}

	class SprintMover {
		constructor(params) {
			this.requestSender = params.requestSender;
			this.planBuilder = params.planBuilder;
			this.entityStorage = params.entityStorage;
			this.bindHandlers();
		}
		bindHandlers() {
			this.planBuilder.subscribe('setDraggable', this.onSetDraggable.bind(this));

			//this.planBuilder.subscribe('sprintMove', this.onSprintMove.bind(this))
		}
		onSetDraggable(baseEvent) {
			// this.draggableSprints = new Draggable({
			// 	container: this.sprintsNode.querySelector('.tasks-scrum__sprints--planned'),
			// 	draggable: '.tasks-scrum-sprint',
			// 	dragElement: '.tasks-scrum-sprint-dragndrop',
			// 	type: Draggable.DROP_PREVIEW,
			// });
			// this.draggableSprints.subscribe('end', (baseEvent) => {
			// 	const dragEndEvent = baseEvent.getData();
			// 	this.emit('sprintMove', dragEndEvent);
			// });
		}
		onSprintMove(baseEvent) {
			const dragEndEvent = baseEvent.getData();
			if (!dragEndEvent.endContainer) {
				return;
			}
			this.requestSender.updateSprintSort({
				sortInfo: this.calculateSprintSort()
			}).catch(response => {
				this.requestSender.showErrorAlert(response);
			});
		}
		calculateSprintSort(increment = 0) {
			const listSortInfo = {};
			const sprints = this.entityStorage.getPlannedSprints();
			let sort = 1 + increment;
			sprints.forEach(sprint => {
				sprint.setSort(sort);
				listSortInfo[sprint.getId()] = {
					sort: sort
				};
				sort++;
			});
			return listSortInfo;
		}
	}

	class SprintSidePanel extends main_core_events.EventEmitter {
		constructor(params) {
			super(params);
			this.setEventNamespace('BX.Tasks.Scrum.SprintSidePanel');
			this.sidePanel = params.sidePanel;
			this.groupId = parseInt(params.groupId, 10);
			this.views = params.views;
			this.pathToBurnDown = params.pathToBurnDown ?? '';
		}
		showStartForm(sprint) {
			this.sidePanel.showByExtension('Sprint-Start-Form', {
				groupId: this.groupId,
				sprintId: sprint.getId()
			}).then(extension => {
				if (extension) {
					extension.subscribe('afterStart', baseEvent => {
						location.href = this.views.find(view => view.id === 'activeSprint')?.url;
					});
				}
			});
		}
		showCompletionForm() {
			this.sidePanel.showByExtension('Sprint-Completion-Form', {
				groupId: this.groupId
			}).then(extension => {
				if (extension) {
					extension.subscribe('afterComplete', baseEvent => {
						location.href = this.views.find(view => view.id === 'plan')?.url;
					});
					extension.subscribe('taskClick', baseEvent => {
						this.emit('showTask', baseEvent.getData());
					});
				}
			});
		}
		showBurnDownChart(sprint) {
			if (this.pathToBurnDown) {
				this.sidePanel.openSidePanel(this.pathToBurnDown.replace('#sprint_id#', sprint.getId()));
			} else {
				throw new Error('Could not find a page to display the chart.');
			}
		}
	}

	class EntityCounters {
		constructor(params) {
			this.requestSender = params.requestSender;
			this.entityStorage = params.entityStorage;
			this.latestCounterRequestByEntity = new Map();
		}
		updateCounters(entities) {
			const requestData = {
				entityIds: [...entities.keys()]
			};
			const request = this.requestSender.getEntityCounters(requestData);
			entities.forEach((entity, entityId) => {
				this.latestCounterRequestByEntity.set(entityId, request);
			});
			request.then(response => {
				Object.keys(response.data).forEach(entityId => {
					entityId = parseInt(entityId, 10);
					if (this.latestCounterRequestByEntity.get(entityId) !== request) {
						return;
					}
					const entity = entities.get(entityId);
					const counters = response.data[entityId];
					entity.setStoryPoints(counters.storyPoints);
					entity.setNumberTasks(counters.numberTasks);
					if (entity.isActive()) {
						entity.setCompletedStoryPoints(counters.completedStoryPoints);
						entity.setUncompletedStoryPoints(counters.uncompletedStoryPoints);
					}
				});
			}).catch(response => {
				this.requestSender.showErrorAlert(response);
			});
		}
	}

	class ItemMover extends main_core_events.EventEmitter {
		constructor(params) {
			super(params);
			this.setEventNamespace('BX.Tasks.Scrum.ItemMover');
			this.requestSender = params.requestSender;
			this.planBuilder = params.planBuilder;
			this.entityStorage = params.entityStorage;
			this.entityCounters = params.entityCounters;
			this.scroller = new Scroller({
				planBuilder: this.planBuilder,
				entityStorage: this.entityStorage
			});
			this.dragItems = new Set();
			this.lastOutContainer = null;
			this.bindHandlers();
		}
		bindHandlers() {
			this.planBuilder.subscribe('setDraggable', this.onSetDraggable.bind(this));
			this.planBuilder.subscribe('createSprintNode', baseEvent => {
				const sprint = baseEvent.getData();
				this.draggableItems.addContainer(sprint.getListItemsNode());
				this.draggableItems.addDropzone(sprint.getDropzone());
			});
		}
		onSetDraggable(baseEvent) {
			const backlog = this.entityStorage.getBacklog();
			const containers = [backlog.getListItemsNode()];
			const dropZones = [backlog.getDropzone(), this.planBuilder.getSprintDropzone()];
			this.entityStorage.getSprints().forEach(sprint => {
				if (!sprint.isDisabled()) {
					containers.push(sprint.getListItemsNode());
					if (sprint.getDropzone()) {
						dropZones.push(sprint.getDropzone());
					}
				}
			});
			this.draggableItems = new ui_draganddrop_draggable.Draggable({
				container: containers,
				dropzone: dropZones,
				draggable: '.tasks-scrum__item--drag',
				dragElement: '.tasks-scrum__item',
				type: ui_draganddrop_draggable.Draggable.CLONE,
				delay: 200
			});
			this.draggableItems.subscribe('beforeStart', this.onBeforeDragStart.bind(this));
			this.draggableItems.subscribe('start', this.onDragStart.bind(this));
			this.draggableItems.subscribe('end', this.onDragEnd.bind(this));
			this.draggableItems.subscribe('drop', this.onDropEnd.bind(this));
			this.draggableItems.subscribe('dropzone:enter', this.onDropZoneEnter.bind(this));
			this.draggableItems.subscribe('dropzone:out', this.onDropZoneOut.bind(this));
		}
		onBeforeDragStart(baseEvent) {
			const dragBeforeStartEvent = baseEvent.getData();
			if (!dragBeforeStartEvent.source) {
				return;
			}
			const itemId = parseInt(dragBeforeStartEvent.source.dataset.id, 10);
			const item = this.entityStorage.findItemByItemId(itemId);
			if (!item || item.isSubTask() || item.isDisabled()) {
				baseEvent.preventDefault();
			} else {
				if (item.isShownSubTasks()) {
					item.hideSubTasks();
				}
				const sourceContainer = dragBeforeStartEvent.sourceContainer;
				if (main_core.Type.isUndefined(sourceContainer)) {
					baseEvent.preventDefault();
					return;
				}
				const sourceEntityId = parseInt(sourceContainer.dataset.entityId, 10);
				const sourceEntity = this.entityStorage.findEntityByEntityId(sourceEntityId);
				if (!sourceEntity) {
					baseEvent.preventDefault();
					return;
				}
				this.dragItems.clear();
				sourceEntity.getGroupModeItems().forEach(selectedItem => {
					if (selectedItem.getId() !== item.getId()) {
						this.dragItems.add(selectedItem);
					}
				});
				const isMultipleDrag = this.dragItems.size > 0;
				if (isMultipleDrag) {
					this.addMultipleMode(item, this.dragItems);
				}
				this.entityStorage.getAllEntities().forEach(entity => {
					entity.deactivateGroupMode();
					entity.getItems().forEach(entityItem => {
						if (entityItem.isShownSubTasks()) {
							entityItem.hideSubTasks();
						}
					});
				});
				this.emit('dragStart');
			}
		}
		onDragStart(baseEvent) {
			this.planBuilder.blockScrumContainerSelect();
			const dragStartEvent = baseEvent.getData();
			const sourceContainer = dragStartEvent.sourceContainer;
			const sourceEntityId = parseInt(sourceContainer.dataset.entityId, 10);
			const sourceEntity = this.entityStorage.findEntityByEntityId(sourceEntityId);
			this.entityStorage.getAllEntities().forEach(entity => {
				if (!entity.isCompleted() && sourceEntity.getId() !== entity.getId()) {
					if (entity.isEmpty()) {
						entity.showDropzone();
						entity.hideEmptySearchStub();
						entity.hideBlank();
					}
				}
			});
		}
		onDragEnd(baseEvent) {
			const dragEndEvent = baseEvent.getData();
			const itemNode = dragEndEvent.source;
			const itemId = parseInt(itemNode.dataset.id, 10);
			const item = this.entityStorage.findItemByItemId(itemId);
			if (!item) {
				return;
			}
			const dragItems = new Set(this.dragItems);
			const isMultipleDrag = dragItems.size > 0;
			if (isMultipleDrag) {
				this.removeMultipleMode(item, dragItems);
			}
			this.planBuilder.unblockScrumContainerSelect();
			const sourceContainer = dragEndEvent.sourceContainer;
			let endContainer = dragEndEvent.endContainer;
			if (!endContainer) {
				if (this.isDropToZone) {
					this.isDropToZone = false;
				} else {
					endContainer = this.lastOutContainer;
				}
			}
			this.lastOutContainer = null;
			if (!endContainer) {
				baseEvent.preventDefault();
				return;
			}
			const sourceEntityId = parseInt(sourceContainer.dataset.entityId, 10);
			const endEntityId = parseInt(endContainer.dataset.entityId, 10);
			const sourceEntity = this.entityStorage.findEntityByEntityId(sourceEntityId);
			const endEntity = this.entityStorage.findEntityByEntityId(endEntityId);
			if (sourceEntity && endEntity) {
				this.onItemMove(item, sourceEntity, endEntity).then(moveSucceeded => {
					if (moveSucceeded && isMultipleDrag) {
						return this.dragGroupItems(item, dragItems, sourceEntity, endEntity);
					}
				});
				sourceEntity.adjustListItemsWidth();
				endEntity.adjustListItemsWidth();
			}
			if (sourceEntity) {
				this.entityStorage.getAllEntities().forEach(entity => {
					if (!entity.isCompleted() && sourceEntity.getId() !== entity.getId()) {
						if (entity.isEmpty()) {
							if (entity.getNumberTasks() > 0 && entity.isExactSearchApplied()) {
								entity.showEmptySearchStub();
								entity.hideDropzone();
							} else {
								entity.showDropzone();
								entity.hideEmptySearchStub();
							}
						}
					}
				});
			}
			this.planBuilder.adjustSprintListWidth();
		}
		onDropEnd(baseEvent) {
			const dragDropEvent = baseEvent.getData();
			const dropzone = dragDropEvent.dropzone;
			const sourceContainer = dragDropEvent.sourceContainer;
			const sourceEntityId = parseInt(sourceContainer.dataset.entityId, 10);
			const endEntityId = parseInt(dropzone.dataset.entityId, 10);
			const sourceEntity = this.entityStorage.findEntityByEntityId(sourceEntityId);
			const endEntity = this.entityStorage.findEntityByEntityId(endEntityId);
			const itemNode = dragDropEvent.source;
			const itemId = parseInt(itemNode.dataset.id, 10);
			const item = this.entityStorage.findItemByItemId(itemId);
			const dragItems = new Set(this.dragItems);
			if (this.planBuilder.isSprintDropzone(dropzone)) {
				this.planBuilder.createSprint().then(sprint => {
					this.addSprintContainers(sprint);
					this.moveTo(sourceEntity, sprint, item, true, false);
					return this.moveInAnotherContainer(new Set([item.getId()]), sourceEntity, sprint).then(moveSucceeded => {
						if (moveSucceeded && dragItems.size > 0) {
							return this.dragGroupItems(item, dragItems, sourceEntity, sprint);
						}
					});
				});
			} else {
				if (sourceEntity && endEntity) {
					const itemNode = dragDropEvent.source;
					const itemId = parseInt(itemNode.dataset.id, 10);
					const item = this.entityStorage.findItemByItemId(itemId);
					if (item) {
						this.onItemMove(item, sourceEntity, endEntity, true).then(moveSucceeded => {
							let groupMovePromise = null;
							if (moveSucceeded && dragItems.size > 0) {
								groupMovePromise = this.dragGroupItems(item, dragItems, sourceEntity, endEntity);
							}
							sourceEntity.adjustListItemsWidth();
							endEntity.adjustListItemsWidth();
							this.planBuilder.adjustSprintListWidth();
							return groupMovePromise;
						});
					}
				}
			}
			this.entityStorage.getAllEntities().forEach(entity => {
				if (!entity.isCompleted() && sourceEntity.getId() !== entity.getId()) {
					if (entity.isEmpty()) {
						if (entity.getNumberTasks() > 0 && entity.isExactSearchApplied()) {
							entity.showEmptySearchStub();
							entity.hideDropzone();
						} else {
							entity.showDropzone();
							entity.hideEmptySearchStub();
						}
					}
				}
			});
		}
		onDropZoneEnter() {
			this.isDropToZone = true;
		}
		onDropZoneOut() {
			this.isDropToZone = false;
		}
		onItemMove(item, sourceEntity, endEntity, insertDom) {
			if (sourceEntity.getId() === endEntity.getId()) {
				return this.moveInCurrentContainer(new Set([item.getId()]), sourceEntity);
			} else {
				const message = main_core.Loc.getMessage('TASKS_SCRUM_CONFIRM_TEXT_MOVE_TASK_FROM_ACTIVE');
				return this.onMoveConfirm(sourceEntity, message).then(() => {
					if (insertDom) {
						main_core.Dom.insertBefore(item.getNode(), endEntity.getLoaderNode());
					}
					this.moveItemFromEntityToEntity(item, sourceEntity, endEntity);
					return this.moveInAnotherContainer(new Set([item.getId()]), sourceEntity, endEntity);
				}, () => {
					main_core.Dom.insertBefore(item.getNode(), sourceEntity.getListItemsNode().children[item.getSort() - 1]);
					return false;
				});
			}
		}
		onMoveItemUpdate(entityFrom, entityTo, item) {
			this.requestSender.updateItemSort({
				entityId: entityTo.getId(),
				itemIds: [item.getId()],
				sortInfo: this.calculateSort(entityTo.getListItemsNode(), new Set([item.getId()]), true)
			}).then(() => {
				this.updateEntityCounters(entityFrom, entityTo);
			}).catch(response => {
				this.handleUpdateItemSortError(response);
			});
		}
		handleUpdateItemSortError(response) {
			const alert = response?.errors ? this.requestSender.showErrorAlert(response) : null;
			const title = main_core.Loc.getMessage('TASKS_SCRUM_ERROR_TITLE_POPUP');
			const messageBox = alert || ui_dialogs_messagebox.MessageBox.alert(title, title);
			messageBox.getPopupWindow().subscribe('onClose', () => {
				window.location.reload();
			});
		}
		onMoveConfirm(entity, message) {
			return new Promise((resolve, reject) => {
				if (entity.isActive()) {
					ui_dialogs_messagebox.MessageBox.confirm(message, messageBox => {
						messageBox.close();
						resolve();
					}, main_core.Loc.getMessage('TASKS_SCRUM_BUTTON_TEXT_MOVE'), messageBox => {
						messageBox.close();
						reject();
					});
				} else {
					resolve();
				}
			});
		}
		dragGroupItems(dragItem, dragItems, entityFrom, entityTo) {
			const isMoveInCurrentContainer = entityFrom.getId() === entityTo.getId();
			const sortedDragItems = [...dragItems.values()].sort((first, second) => {
				if (first.getSort() < second.getSort()) return 1;
				if (first.getSort() > second.getSort()) return -1;
			});
			const dragItemIds = new Set();
			sortedDragItems.forEach(groupedItem => {
				dragItemIds.add(groupedItem.getId());
				entityTo.appendNodeAfterItem(groupedItem.getNode(), dragItem.getNode());
				if (!isMoveInCurrentContainer) {
					this.moveItemFromEntityToEntity(groupedItem, entityFrom, entityTo);
				}
			});
			if (isMoveInCurrentContainer) {
				return this.moveInCurrentContainer(dragItemIds, entityFrom);
			} else {
				return this.moveInAnotherContainer(dragItemIds, entityFrom, entityTo);
			}
		}
		addMultipleMode(item, dragItems) {
			main_core.Dom.addClass(item.getNode(), dragItems.size > 1 ? '--multiple-drag-many' : '--multiple-drag');
			dragItems.forEach(dragItem => {
				main_core.Dom.addClass(dragItem.getNode(), '--multiple-drag-shadow');
			});
		}
		removeMultipleMode(item, dragItems) {
			main_core.Dom.removeClass(item.getNode(), '--multiple-drag');
			main_core.Dom.removeClass(item.getNode(), '--multiple-drag-many');
			dragItems.forEach(dragItem => {
				main_core.Dom.removeClass(dragItem.getNode(), '--multiple-drag-shadow');
			});
		}
		addSprintContainers(sprint) {
			if (!sprint.isDisabled()) {
				this.draggableItems.addContainer(sprint.getListItemsNode());
				this.draggableItems.addDropzone(sprint.getDropzone());
			}
		}
		moveItem(item, button) {
			const entity = this.entityStorage.findEntityByItemId(item.getId());
			const listToMove = [];
			if (!entity.isFirstItem(item)) {
				listToMove.push({
					text: main_core.Loc.getMessage('TASKS_SCRUM_ITEM_ACTIONS_MOVE_UP'),
					onclick: (event, menuItem) => {
						const groupModeItems = entity.getGroupModeItems();
						const sortedItems = [...groupModeItems.values()].sort((first, second) => {
							if (first.getSort() < second.getSort()) return 1;
							if (first.getSort() > second.getSort()) return -1;
						});
						const sortedItemsIds = new Set();
						sortedItems.forEach(groupModeItem => {
							sortedItemsIds.add(groupModeItem.getId());
							if (groupModeItem.isParentTask() && groupModeItem.isShownSubTasks()) {
								groupModeItem.hideSubTasks();
							}
							this.moveItemToUp(groupModeItem, entity.getListItemsNode(), false);
							groupModeItem.activateBlinking();
						});
						this.scroller.scrollToItem(sortedItems.values().next().value);
						this.requestSender.updateItemSort({
							sortInfo: this.calculateSort(entity.getListItemsNode(), sortedItemsIds)
						}).catch(response => {
							this.handleUpdateItemSortError(response);
						});
						entity.deactivateGroupMode();
						menuItem.getMenuWindow().close();
					}
				});
			}
			if (!entity.isLastItem(item)) {
				listToMove.push({
					text: main_core.Loc.getMessage('TASKS_SCRUM_ITEM_ACTIONS_MOVE_DOWN'),
					onclick: (event, menuItem) => {
						const groupModeItems = entity.getGroupModeItems();
						const sortedItems = [...groupModeItems.values()].sort((first, second) => {
							if (first.getSort() > second.getSort()) return 1;
							if (first.getSort() < second.getSort()) return -1;
						});
						this.fadeOutEntity(entity);
						menuItem.getMenuWindow().close();
						this.loadEntityList(entity, !entity.isWaitingLoadItems()).then(() => {
							this.fadeInEntity(entity);
							const sortedItemsIds = new Set();
							sortedItems.forEach(groupModeItem => {
								sortedItemsIds.add(groupModeItem.getId());
								if (groupModeItem.isParentTask() && groupModeItem.isShownSubTasks()) {
									groupModeItem.hideSubTasks();
								}
								this.moveItemToDown(groupModeItem, entity.getListItemsNode(), false);
								groupModeItem.activateBlinking();
							});
							this.scroller.scrollToItem(sortedItems.values().next().value);
							const containerPosition = main_core.Dom.getPosition(this.planBuilder.getScrumContainer());
							window.scrollTo({
								top: containerPosition.top,
								behavior: 'smooth'
							});
							this.requestSender.updateItemSort({
								sortInfo: this.calculateSort(entity.getListItemsNode(), sortedItemsIds)
							}).catch(response => {
								this.handleUpdateItemSortError(response);
							});
							entity.deactivateGroupMode();
						});
					}
				});
			}
			this.showMoveItemMenu(item, button, listToMove);
		}
		moveItemToUp(item, listItemsNode, updateSort = true) {
			main_core.Dom.insertBefore(item.getNode(), listItemsNode.firstElementChild);
			if (updateSort) {
				this.updateItemsSort(item, listItemsNode);
			}
		}
		moveItemToDown(item, listItemsNode, updateSort = true) {
			main_core.Dom.insertBefore(item.getNode(), listItemsNode.lastElementChild);
			if (updateSort) {
				this.updateItemsSort(item, listItemsNode);
			}
		}
		updateItemsSort(item, listItemsNode) {
			this.requestSender.updateItemSort({
				itemIds: [item.getId()],
				sortInfo: this.calculateSort(listItemsNode, new Set([item.getId()]))
			}).catch(response => {
				this.handleUpdateItemSortError(response);
			});
		}
		moveInCurrentContainer(itemIds, entity) {
			return this.requestSender.updateItemSort({
				sortInfo: this.calculateSort(entity.getListItemsNode(), itemIds)
			}).then(() => true).catch(response => {
				this.handleUpdateItemSortError(response);
				return false;
			});
		}
		moveInAnotherContainer(itemIds, sourceEntity, endEntity) {
			return this.requestSender.updateItemSort({
				entityId: endEntity.getId(),
				itemIds: [...itemIds],
				sortInfo: this.calculateSort(endEntity.getListItemsNode(), itemIds, true)
			}).then(() => {
				this.updateEntityCounters(sourceEntity, endEntity);
				return true;
			}).catch(response => {
				this.handleUpdateItemSortError(response);
				return false;
			});
		}
		updateEntityCounters(sourceEntity, endEntity) {
			const entities = new Map();
			entities.set(sourceEntity.getId(), sourceEntity);
			if (endEntity) {
				entities.set(endEntity.getId(), endEntity);
			}
			this.entityCounters.updateCounters(entities);
		}
		calculateSort(container, updatedItemsIds, moveToAnotherEntity = false) {
			const listSortInfo = {};
			const items = [...container.querySelectorAll('[data-sort]')];
			const currentValues = new Map();
			items.forEach(itemNode => {
				const itemId = parseInt(itemNode.dataset.id, 10);
				const sortValue = parseFloat(itemNode.dataset.sort) || 0;
				currentValues.set(itemId, sortValue);
			});
			if (updatedItemsIds && updatedItemsIds.size > 0) {
				const itemIdToIndexMap = new Map();
				items.forEach((itemNode, index) => {
					const itemId = parseInt(itemNode.dataset.id, 10);
					itemIdToIndexMap.set(itemId, index);
				});
				const newSortValues = new Map();
				updatedItemsIds.forEach(itemId => {
					const currentIndex = itemIdToIndexMap.get(itemId);
					if (main_core.Type.isUndefined(currentIndex)) {
						return;
					}
					let previousItemId = null;
					let nextItemId = null;
					let newSort = 1024;
					if (currentIndex > 0) {
						previousItemId = parseInt(items[currentIndex - 1].dataset.id, 10);
					}
					if (currentIndex < items.length - 1) {
						nextItemId = parseInt(items[currentIndex + 1].dataset.id, 10);
					}
					if (previousItemId === null && nextItemId !== null) {
						const nextSort = currentValues.get(nextItemId) || 0;
						newSort = nextSort / 2;
					} else if (previousItemId !== null && nextItemId === null) {
						const previousSort = currentValues.get(previousItemId) || 0;
						newSort = previousSort + 1024;
					} else if (previousItemId !== null && nextItemId !== null) {
						const previousSort = currentValues.get(previousItemId) || 0;
						const nextSort = currentValues.get(nextItemId) || 0;
						newSort = (previousSort + nextSort) / 2;
					}
					newSortValues.set(itemId, newSort);
					const tmpId = main_core.Text.getRandom();
					listSortInfo[itemId] = {
						previousItemId,
						nextItemId
					};
					if (moveToAnotherEntity) {
						listSortInfo[itemId].entityId = parseInt(container.dataset.entityId, 10);
					}
					listSortInfo[itemId].tmpId = tmpId;
					listSortInfo[itemId].updatedItemId = itemId;
				});
				updatedItemsIds.forEach(itemId => {
					const newSort = newSortValues.get(itemId);
					if (newSort) {
						const item = this.entityStorage.findItemByItemId(itemId);
						if (item) {
							item.setSort(newSort);
						}
					}
				});
			}
			this.emit('calculateSort', listSortInfo);
			return listSortInfo;
		}
		moveToAnotherEntity(entityFrom, item, targetEntity, bindButton) {
			const isMoveToSprint = main_core.Type.isNull(targetEntity);
			const sprints = isMoveToSprint ? this.entityStorage.getSprintsAvailableForFilling(entityFrom) : null;
			if (isMoveToSprint) {
				if (sprints.size > 1) {
					this.showListSprintsToMove(entityFrom, item, bindButton);
				} else {
					if (sprints.size === 0) {
						this.planBuilder.createSprint().then(sprint => {
							this.moveToWithGroupMode(entityFrom, sprint, item, true, false);
						});
					} else {
						sprints.forEach(sprint => {
							this.moveToWithGroupMode(entityFrom, sprint, item, true, false);
						});
					}
				}
			} else {
				const message = main_core.Loc.getMessage('TASKS_SCRUM_CONFIRM_TEXT_MOVE_TASKS_FROM_ACTIVE');
				this.onMoveConfirm(entityFrom, message).then(() => {
					this.moveToWithGroupMode(entityFrom, targetEntity, item, false, false);
				}).catch(() => {});
			}
		}
		moveToWithGroupMode(entityFrom, entityTo, item, moveToEnd = true, update = true) {
			const groupModeItems = entityFrom.getGroupModeItems();
			if (item && !groupModeItems.has(item.getId())) {
				groupModeItems.set(item.getId(), item);
			}
			const sortedItems = [...groupModeItems.values()].sort((first, second) => {
				if (moveToEnd) {
					if (first.getSort() > second.getSort()) return 1;
					if (first.getSort() < second.getSort()) return -1;
				} else {
					if (first.getSort() < second.getSort()) return 1;
					if (first.getSort() > second.getSort()) return -1;
				}
			});
			const updateVisibilitySprints = entityTo.isBacklog() ? Promise.resolve() : this.planBuilder.updateVisibilitySprints(entityTo);
			updateVisibilitySprints.then(() => {
				this.fadeOutEntity(entityTo);
				const immediately = !moveToEnd || !entityTo.isWaitingLoadItems();
				this.loadEntityList(entityTo, immediately).then(() => {
					this.fadeInEntity(entityTo);
					const sortedItemsIds = new Set();
					sortedItems.forEach(groupModeItem => {
						this.moveTo(entityFrom, entityTo, groupModeItem, moveToEnd, update);
						sortedItemsIds.add(groupModeItem.getId());
						groupModeItem.activateBlinking();
					});
					this.scroller.scrollToItem(sortedItems.values().next().value);
					this.requestSender.updateItemSort({
						entityId: entityTo.getId(),
						itemIds: [...sortedItemsIds],
						sortInfo: this.calculateSort(entityTo.getListItemsNode(), sortedItemsIds, true)
					}).then(() => {
						this.updateEntityCounters(entityFrom, entityTo);
					}).catch(response => {
						this.handleUpdateItemSortError(response);
					});
					entityFrom.deactivateGroupMode();
					entityTo.deactivateGroupMode();
				});
			});
		}
		moveTo(entityFrom, entityTo, item, moveToEnd = true, update = true) {
			const itemNode = item.getNode();
			const entityListNode = entityTo.getListItemsNode();
			if (item.isParentTask() && item.isShownSubTasks()) {
				item.hideSubTasks();
			}
			if (moveToEnd) {
				main_core.Dom.insertBefore(itemNode, entityListNode.lastElementChild);
			} else {
				main_core.Dom.insertBefore(itemNode, entityListNode.firstElementChild);
			}
			this.moveItemFromEntityToEntity(item, entityFrom, entityTo);
			if (update) {
				this.onMoveItemUpdate(entityFrom, entityTo, item);
			}
		}
		moveToPosition(entityFrom, entityTo, item) {
			const itemNode = item.getNode() ?? item.render();
			const itemSort = item.getSort();
			const entityListNode = entityTo.getListItemsNode();
			const bindItemNode = this.#findInsertionPosition(entityListNode, itemSort);
			if (main_core.Dom.hasClass(bindItemNode, 'tasks-scrum__item')) {
				const bindItem = this.entityStorage.findItemByItemId(parseInt(bindItemNode.dataset.id, 10));
				if (bindItem.isParentTask() && bindItem.isShownSubTasks()) {
					bindItem.hideSubTasks();
				}
				main_core.Dom.insertBefore(itemNode, bindItemNode);
			} else {
				main_core.Dom.append(itemNode, entityListNode);
			}
			this.moveItemFromEntityToEntity(item, entityFrom, entityTo);
			this.updateEntityCounters(entityFrom, entityTo);
		}
		#findInsertionPosition(container, targetSort) {
			const items = [...container.querySelectorAll('.tasks-scrum__item[data-sort]')];
			if (items.length === 0) {
				return null;
			}
			let left = 0;
			let right = items.length - 1;
			let result = null;
			while (left <= right) {
				const mid = Math.floor((left + right) / 2);
				const midSort = parseFloat(items[mid].dataset.sort) || 0;
				if (midSort >= targetSort) {
					result = items[mid];
					right = mid - 1;
				} else {
					left = mid + 1;
				}
			}
			return result;
		}
		moveItemFromEntityToEntity(item, entityFrom, entityTo) {
			entityFrom.removeItem(item);
			item.setParentEntity(entityTo.getId(), entityTo.getEntityType());
			entityTo.setItem(item);
		}
		showListSprintsToMove(entityFrom, item, button) {
			const id = `item-sprint-action-${entityFrom.getEntityType() + entityFrom.getId() + item.getId()}`;
			if (this.moveToSprintMenu) {
				this.moveToSprintMenu.getPopupWindow().close();
				return;
			}
			this.moveToSprintMenu = new main_popup.Menu({
				id: id,
				bindElement: button,
				offsetTop: 12,
				offsetLeft: -32
			});
			this.entityStorage.getSprints().forEach(sprint => {
				if (!sprint.isCompleted() && !this.isSameSprint(entityFrom, sprint)) {
					this.moveToSprintMenu.addMenuItem({
						text: sprint.getName(),
						onclick: (event, menuItem) => {
							let message = main_core.Loc.getMessage('TASKS_SCRUM_CONFIRM_TEXT_MOVE_TASK_FROM_ACTIVE');
							if (entityFrom.isGroupMode()) {
								message = main_core.Loc.getMessage('TASKS_SCRUM_CONFIRM_TEXT_MOVE_TASKS_FROM_ACTIVE');
							}
							this.onMoveConfirm(entityFrom, message).then(() => {
								this.moveToWithGroupMode(entityFrom, sprint, item, true, false);
							}).catch(() => {});
							menuItem.getMenuWindow().close();
						}
					});
				}
			});
			this.moveToSprintMenu.getPopupWindow().subscribe('onClose', () => {
				this.moveToSprintMenu.destroy();
				this.moveToSprintMenu = null;
				this.emit('moveToSprintMenuClose');
			});
			this.moveToSprintMenu.show();
		}
		isSameSprint(first, second) {
			return first.getEntityType() === 'sprint' && first.getId() === second.getId();
		}
		showMoveItemMenu(item, button, listToMove) {
			const id = `item-move-${item.getId()}`;
			if (this.moveItemMenu) {
				this.moveItemMenu.getPopupWindow().close();
				return;
			}
			this.moveItemMenu = new main_popup.Menu({
				id: id,
				bindElement: button,
				offsetTop: 12,
				offsetLeft: -28
			});
			listToMove.forEach(item => {
				this.moveItemMenu.addMenuItem(item);
			});
			this.moveItemMenu.getPopupWindow().subscribe('onClose', () => {
				this.moveItemMenu.destroy();
				this.moveItemMenu = null;
				this.emit('moveMenuClose');
			});
			this.moveItemMenu.show();
		}
		hasActionPanelDialog() {
			return this.moveItemMenu || this.moveToSprintMenu;
		}
		closeActionPanelDialogs() {
			if (this.moveItemMenu) {
				this.moveItemMenu.getPopupWindow().close();
			}
			if (this.moveToSprintMenu) {
				this.moveToSprintMenu.getPopupWindow().close();
			}
		}
		loadEntityList(entity, immediately = false) {
			return new Promise(resolve => {
				if (immediately) {
					resolve();
				} else {
					this.planBuilder.loadAllItems(entity).then(() => resolve());
				}
			});
		}
		fadeOutEntity(entity) {
			entity.fadeOut();
			entity.showListLoader();
		}
		fadeInEntity(entity) {
			entity.hideListLoader();
			entity.fadeIn();
		}
	}

	class ItemDesigner {
		constructor(params) {
			this.requestSender = params.requestSender;
			this.entityStorage = params.entityStorage;
			this.listAllUsedColors = new Set();
			this.randomColorCount = 0;
			this.defaultColor = '#2ECEFF';
		}
		getRandomColorForItemBorder() {
			this.randomColorCount = 0;
			return this.getAllUsedColors().then(() => {
				return this.getRandomColor(this.getAllColors());
			});
		}
		getAllColors() {
			return ['#2ECEFF', '#10E5FC', '#A5DE00', '#EEC202', '#AD8F47', '#FF5B55', '#EF3001', '#F968B6', '#6B52CC', '#07BAB1', '#5CD1DF', '#A1A6AC', '#949DA9', '#01A64C', '#B02FB0', '#EF008B', '#0202FF', '#555555', '#C4C4C4', '#AAAAAA', '#F89675', '#C5E099', '#7ECB9C', '#78CDCA', '#887FC0', '#BD8AC0', '#F6989C', '#F26A47', '#ABD46B', '#00BBB4', '#3FB2CD', '#5471B9', '#3E8BCD', '#A861AB', '#F26A7B', '#9E0402', '#A46200', '#578520', '#01736A', '#0175A6', '#033172', '#460763', '#630260', '#9F0137', '#B7EB81', '#FFA900', '#F7A700', '#333333', '#EDEEF0', '#E1F3F9'];
		}
		getRandomColor(allColors) {
			this.randomColorCount++;
			if (this.randomColorCount >= allColors.length) {
				return this.defaultColor;
			}
			const randomColor = allColors[Math.floor(Math.random() * allColors.length)];
			if (this.isThisBorderColorAlreadyUse(randomColor)) {
				return this.getRandomColor(allColors);
			} else {
				return randomColor;
			}
		}
		isThisBorderColorAlreadyUse(color) {
			let isAlreadyUse = false;
			this.listAllUsedColors.forEach(usedColor => {
				if (usedColor === color) {
					isAlreadyUse = true;
				}
			});
			return isAlreadyUse;
		}
		getAllUsedColors() {
			const entityIds = new Set();
			this.entityStorage.getAllEntities().forEach(entity => {
				if (!entity.isCompleted()) {
					entityIds.add(entity.getId());
				}
			});
			return this.requestSender.getAllUsedItemBorderColors({
				entityIds: [...entityIds.values()]
			}).then(response => {
				this.listAllUsedColors = new Set(response.data);
			}).catch(response => {
				this.requestSender.showErrorAlert(response);
			});
		}
		updateBorderColor(items) {
			const itemIdsToUpdateColor = new Set();
			items.forEach(item => {
				if (item.isLinkedTask() && !item.getBorderColor()) {
					itemIdsToUpdateColor.add(item.getId());
				}
			});
			if (itemIdsToUpdateColor.size) {
				this.getAllUsedColors().then(() => {
					const items = new Map();
					itemIdsToUpdateColor.forEach(itemId => {
						items.set(itemId, this.getRandomColor(this.getAllColors()));
					});
					this.requestSender.updateBorderColorToLinkedItems({
						items: Object.fromEntries(items)
					}).then(response => {
						const updatedItems = response.data;
						Object.keys(updatedItems).forEach(itemId => {
							const borderColor = updatedItems[itemId];
							const item = this.entityStorage.findItemByItemId(itemId);
							item.setBorderColor(borderColor);
						});
					}).catch(response => {
						this.requestSender.showErrorAlert(response);
					});
				});
			}
		}
	}

	class Epic extends main_core_events.EventEmitter {
		constructor(params) {
			super(params);
			this.setEventNamespace('BX.Tasks.Scrum.Epic.Helper');
			this.groupId = parseInt(params.groupId, 10);
			this.entityStorage = params.entityStorage;
			this.sidePanel = params.sidePanel;
			this.filter = params.filter;
			this.tagSearcher = params.tagSearcher;
			this.subscribeToExtension();
		}
		subscribeToExtension() {
			main_core_events.EventEmitter.subscribe('BX.Tasks.Scrum.Epic:afterAdd', baseEvent => {
				this.onAfterAdd(baseEvent);
			});
			main_core_events.EventEmitter.subscribe('BX.Tasks.Scrum.Epic:afterEdit', baseEvent => {
				this.onAfterEdit(baseEvent);
			});
			main_core_events.EventEmitter.subscribe('BX.Tasks.Scrum.Epic:filterByTag', baseEvent => {
				this.emit('filterByTag', baseEvent.getData());
			});
			main_core_events.EventEmitter.subscribe('BX.Tasks.Scrum.Epic:afterRemove', baseEvent => {
				this.onAfterRemove(baseEvent);
			});
		}
		openAddForm() {
			return this.sidePanel.showByExtension('Epic', {
				view: 'add',
				groupId: this.groupId
			});
		}
		onAfterAdd(baseEvent) {
			const epic = baseEvent.getData();
			this.tagSearcher.addEpicToSearcher(epic);
			this.filter.addItemToListTypeField('EPIC', {
				NAME: epic.name.trim(),
				VALUE: String(epic.id)
			});
		}
		onAfterEdit(baseEvent) {
			const epic = baseEvent.getData();
			this.entityStorage.getAllItems().forEach(item => {
				const itemEpic = item.getEpic().getValue();
				if (itemEpic && itemEpic.id === epic.id) {
					item.setEpic(epic);
				}
			});
			this.tagSearcher.removeEpicFromSearcher(epic);
			this.tagSearcher.addEpicToSearcher(epic);
		}
		onAfterRemove(baseEvent) {
			const epic = baseEvent.getData();
			this.entityStorage.getAllItems().forEach(item => {
				const itemEpic = item.getEpic().getValue();
				if (itemEpic && itemEpic.id === epic.id) {
					item.setEpic();
				}
			});
			this.tagSearcher.removeEpicFromSearcher(epic);
		}
	}

	class PullSprint {
		constructor(params) {
			this.requestSender = params.requestSender;
			this.planBuilder = params.planBuilder;
			this.entityStorage = params.entityStorage;
			this.groupId = params.groupId;
			this.listIdsToSkipAdding = new Set();
			this.listIdsToSkipUpdating = new Set();
			this.listIdsToSkipRemoving = new Set();
		}
		getModuleId() {
			return 'tasks';
		}
		getMap() {
			return {
				sprintAdded: this.onSprintAdded.bind(this),
				sprintUpdated: this.onSprintUpdated.bind(this),
				sprintRemoved: this.onSprintRemoved.bind(this)
			};
		}
		onSprintAdded(params) {
			if (this.groupId !== params.groupId) {
				return;
			}
			if (this.needSkipAdd(params.tmpId)) {
				this.cleanSkipAdd(params.tmpId);
				return;
			}
			this.requestSender.getSprintData({
				sprintId: params.id
			}).then(response => {
				response.data.items = [];
				const sprint = Sprint.buildSprint(response.data);
				this.planBuilder.createSprintNode(sprint);
			}).catch(response => {});
		}
		onSprintUpdated(params) {
			if (this.groupId !== params.groupId) {
				return;
			}
			if (this.needSkipUpdate(params.id)) {
				this.cleanSkipUpdate(params.id);
				return;
			}
			this.requestSender.getSprintData({
				sprintId: params.id
			}).then(response => {
				response.data.items = [];
				const tmpSprint = Sprint.buildSprint(response.data);
				const sprint = this.entityStorage.findEntityByEntityId(tmpSprint.getId());
				if (sprint) {
					const currentStatus = sprint.getStatus();
					sprint.updateYourself(tmpSprint);
					if (tmpSprint.getStatus() !== currentStatus) {
						if (tmpSprint.getStatus() === 'active') {
							this.planBuilder.moveSprintToActiveListNode(sprint);
						}
						if (tmpSprint.getStatus() === 'completed') {
							sprint.getItems().forEach(item => {
								if (item.isShownSubTasks()) {
									item.hideSubTasks();
								}
								sprint.removeItem(item);
								item.removeYourself();
							});
							sprint.setBlank(sprint);
							sprint.hideContent();
							this.planBuilder.moveSprintToCompletedListNode(sprint);
						}
					}
					this.planBuilder.updatePlannedSprints(this.entityStorage.getPlannedSprints(), !main_core.Type.isUndefined(this.entityStorage.getActiveSprint()));
					this.planBuilder.updateSprintContainers();
				}
			}).catch(response => {});
		}
		onSprintRemoved(params) {
			if (this.groupId !== params.groupId) {
				return;
			}
			if (this.needSkipRemove(params.id)) {
				this.cleanSkipRemove(params.id);
				return;
			}
			const sprint = this.entityStorage.findEntityByEntityId(params.id);
			if (sprint) {
				sprint.removeYourself();
				this.entityStorage.removeSprint(sprint.getId());
			}
		}
		addTmpIdToSkipAdding(tmpId) {
			this.listIdsToSkipAdding.add(tmpId);
		}
		addIdToSkipUpdating(sprintId) {
			this.listIdsToSkipUpdating.add(sprintId);
		}
		addIdToSkipRemoving(sprintId) {
			this.listIdsToSkipRemoving.add(sprintId);
		}
		needSkipAdd(tmpId) {
			return this.listIdsToSkipAdding.has(tmpId);
		}
		cleanSkipAdd(tmpId) {
			this.listIdsToSkipAdding.delete(tmpId);
		}
		needSkipUpdate(sprintId) {
			return this.listIdsToSkipUpdating.has(sprintId);
		}
		cleanSkipUpdate(sprintId) {
			this.listIdsToSkipUpdating.delete(sprintId);
		}
		needSkipRemove(sprintId) {
			return this.listIdsToSkipRemoving.has(sprintId);
		}
		cleanSkipRemove(sprintId) {
			this.listIdsToSkipRemoving.delete(sprintId);
		}
	}

	class PullItem {
		constructor(params) {
			this.requestSender = params.requestSender;
			this.entityStorage = params.entityStorage;
			this.entityCounters = params.entityCounters;
			this.tagSearcher = params.tagSearcher;
			this.itemMover = params.itemMover;
			this.currentUserId = params.currentUserId;
			this.groupId = params.groupId;
			this.requestPlacementResync = params.requestPlacementResync;
			this.listToAddAfterUpdate = new Set();
			this.listIdsToSkipAdding = new Set();
			this.listIdsToSkipUpdating = new Set();
			this.listIdsToSkipRemoving = new Set();
			this.listIdsToSkipSorting = new Set();
			this.pendingHierarchyRequests = new Map();
			this.pendingParentDataRequests = new Map();
			this.itemMover.subscribe('calculateSort', this.onCalculateSort.bind(this));
		}
		getModuleId() {
			return 'tasks';
		}
		getMap() {
			return {
				itemAdded: this.onItemAdded.bind(this),
				itemUpdated: this.onItemUpdated.bind(this),
				itemRemoved: this.onItemRemoved.bind(this),
				itemPlacementChanged: this.onPlacementChanged.bind(this),
				itemSortUpdated: this.onItemSortUpdated.bind(this),
				comment_add: this.onCommentAdd.bind(this)
			};
		}
		onPlacementChanged(params) {
			if (this.groupId === params.groupId) {
				this.requestPlacementResync();
			}
		}
		onItemAdded(params) {
			if (this.groupId !== params.groupId) {
				return;
			}
			this.invalidatePendingHierarchyRequest(params.id);
			const parentRequest = this.beginParentDataRequest(params.id);
			this.setDelayedAdd(params.id);
			this.externalAdd(params.id).finally(() => this.cleanDelayedAdd(params.id)).then(() => {
				if (!this.isCurrentParentDataRequest(params.id, parentRequest)) {
					return;
				}
				return this.requestSender.getItemData({
					itemIds: [params.id]
				}).then(response => {
					if (!this.isCurrentParentDataRequest(params.id, parentRequest)) {
						return;
					}
					const itemData = response.data.find(itemData => itemData.id === params.id);
					const item = Item.buildItem(itemData);
					this.addItemToEntity(item);
				}).catch(response => {});
			}).catch(() => {}).finally(() => this.finishParentDataRequest(params.id, parentRequest));
		}
		onItemUpdated(params) {
			if (this.groupId !== params.groupId) {
				return;
			}
			this.invalidatePendingHierarchyRequest(params.id);
			const parentRequest = this.beginParentDataRequest(params.id);
			this.requestSender.getItemData({
				itemIds: [params.id]
			}).then(response => {
				if (!this.isCurrentParentDataRequest(params.id, parentRequest)) {
					return;
				}
				const itemData = response.data.find(itemData => itemData.id === params.id);
				const item = Item.buildItem(itemData);
				if (this.isDelayedAdd(item.getId())) {
					this.cleanDelayedAdd(item.getId());
					if (this.needSkipAdd(params.tmpId)) {
						this.cleanSkipAdd(params.tmpId);
						return;
					}
					this.addItemToEntity(item);
					return;
				}
				if (this.needSkipUpdate(item)) {
					this.cleanSkipUpdate(item);
					this.reconcileVisibleSubTasks(item);
					return;
				}
				this.updateItem(item);
			}).catch(response => {}).finally(() => this.finishParentDataRequest(params.id, parentRequest));
		}
		onItemRemoved(params) {
			if (this.groupId !== params.groupId) {
				return;
			}
			this.invalidatePendingHierarchyRequest(params.id);
			if (this.needSkipRemove(params.id)) {
				this.cleanSkipRemove(params.id);
				return;
			}
			const item = this.entityStorage.findItemByItemId(params.id);
			const wasParentTask = item?.isParentTask() ?? false;
			if (item) {
				const entity = this.entityStorage.findEntityByItemId(item.getId());
				entity.removeItem(item);
				item.removeYourself();
				this.updateEntityCounters(entity);
			}
			this.requestPlacementResync(wasParentTask);
		}
		onItemSortUpdated(itemsSortInfo) {
			const itemsInfoToSort = new Map();
			Object.entries(itemsSortInfo).forEach(([itemId, info]) => {
				if (!this.needSkipSort(info.tmpId)) {
					itemsInfoToSort.set(parseInt(itemId, 10), info);
				}
				this.cleanSkipRemove(info.tmpId);
			});
			if (itemsInfoToSort.size === 0) {
				return;
			}
			this.pendingSortHierarchyBatches = this.pendingSortHierarchyBatches || new Set();
			const parentRequests = new Map();
			itemsInfoToSort.forEach((info, itemId) => {
				this.invalidatePendingHierarchyRequest(itemId);
				parentRequests.set(itemId, this.beginParentDataRequest(itemId));
			});
			const batch = {
				invalidatedItemIds: new Set()
			};
			this.pendingSortHierarchyBatches.add(batch);
			this.requestSender.getItemData({
				itemIds: [...itemsInfoToSort.keys()]
			}).then(response => {
				const itemsToSort = new Map();
				const freshItems = new Map();
				const newItems = new Set();
				response.data.forEach(itemData => {
					if (batch.invalidatedItemIds.has(String(itemData.id)) || !this.isCurrentParentDataRequest(itemData.id, parentRequests.get(itemData.id))) {
						return;
					}
					const freshItem = Item.buildItem(itemData);
					let item = this.entityStorage.findItemByItemId(itemData.id);
					if (!item) {
						item = freshItem;
						newItems.add(item.getId());
					}
					itemsToSort.set(item.getId(), item);
					freshItems.set(item.getId(), freshItem);
				});
				itemsToSort.forEach(item => {
					const itemInfoToSort = itemsInfoToSort.get(item.getId());
					if (item.isParentTask() && item.isShownSubTasks()) {
						item.hideSubTasks();
					}
					item.setSort(itemInfoToSort.sort);
					const sourceEntity = this.entityStorage.findEntityByEntityId(item.getEntityId());
					if (sourceEntity) {
						const targetEntityId = main_core.Type.isUndefined(itemInfoToSort.entityId) ? item.getEntityId() : itemInfoToSort.entityId;
						let targetEntity = this.entityStorage.findEntityByEntityId(targetEntityId);
						if (!targetEntity || sourceEntity.getId() === targetEntity.getId()) {
							targetEntity = sourceEntity;
						}
						this.itemMover.moveToPosition(sourceEntity, targetEntity, item);
					}
					const freshItem = freshItems.get(item.getId());
					if (item !== freshItem && freshItem.getSubTasksInfo()) {
						item.setSubTasksInfo(freshItem.getSubTasksInfo());
						item.setParentTask(freshItem.isParentTask() ? 'Y' : 'N');
					}
				});
				return this.reconcileVisibleSubTasksBatch([...freshItems.values()], batch);
			}).catch(response => {}).finally(() => {
				this.pendingSortHierarchyBatches.delete(batch);
				parentRequests.forEach((request, itemId) => this.finishParentDataRequest(itemId, request));
			});
		}
		onCommentAdd(params) {
			const participants = main_core.Type.isArray(params.participants) ? params.participants : [];
			if (participants.includes(this.currentUserId.toString())) {
				const xmlId = params.entityXmlId.split('_');
				if (xmlId) {
					const entityType = xmlId[0];
					const taskId = xmlId[1];
					const item = this.entityStorage.findItemBySourceId(taskId);
					if (entityType === 'TASK' && item) {
						this.requestSender.getCurrentState({
							taskId: item.getSourceId()
						}).then(response => {
							const tmpItem = Item.buildItem(response.data.itemData);
							this.updateItem(tmpItem, item);
						}).catch(response => {
							this.requestSender.showErrorAlert(response);
						});
					}
				}
			}
		}
		addItemToEntity(item) {
			if (item.isSubTask()) {
				const parentItem = this.entityStorage.findItemBySourceId(item.getParentTaskId());
				if (parentItem && !parentItem.isDecompositionMode()) {
					parentItem.hideSubTasks();
					parentItem.cleanSubTasks();
				}
				return;
			}
			this.requestSender.hasTaskInFilter({
				taskId: item.getSourceId()
			}).then(response => {
				if (!response.data.has) {
					return;
				}
				const entity = this.entityStorage.findEntityByEntityId(item.getEntityId());
				if (!entity) {
					return;
				}
				const existingItem = this.entityStorage.findItemBySourceId(item.getSourceId());
				if (existingItem) {
					this.updateItem(item, existingItem);
					return;
				}
				this.itemMover.moveToPosition(entity, entity, item);
				this.reconcileVisibleSubTasks(item);
			}).catch(response => {
				this.requestSender.showErrorAlert(response);
			});
		}
		updateItem(tmpItem, item) {
			if (!item) {
				item = this.entityStorage.findItemByItemId(tmpItem.getId());
			}
			if (item) {
				const isParentChangeAction = tmpItem.isSubTask() !== item.isSubTask();
				if (isParentChangeAction) {
					if (tmpItem.isSubTask()) {
						const entity = this.entityStorage.findEntityByItemId(item.getId());
						entity.removeItem(item);
						item.removeYourself();
					}
					return;
				}
				const targetEntityId = tmpItem.getEntityId();
				const sourceEntityId = item.getEntityId();
				const targetEntity = this.entityStorage.findEntityByEntityId(targetEntityId);
				const sourceEntity = this.entityStorage.findEntityByEntityId(sourceEntityId);
				if (tmpItem.getEntityId() !== item.getEntityId()) {
					if (targetEntity && sourceEntity) {
						this.itemMover.moveToPosition(sourceEntity, targetEntity, item);
					}
				} else {
					this.updateEntityCounters(targetEntity);
				}
				item.updateYourself(tmpItem);
				if (tmpItem.getSubTasksInfo()) {
					item.setSubTasksInfo(tmpItem.getSubTasksInfo());
				}
				this.reconcileVisibleSubTasks(tmpItem);
			} else {
				if (tmpItem.isSubTask()) {
					const targetEntityId = tmpItem.getEntityId();
					const targetEntity = this.entityStorage.findEntityByEntityId(targetEntityId);
					this.updateEntityCounters(targetEntity);
				} else {
					this.addItemToEntity(tmpItem);
				}
			}
		}
		beginParentDataRequest(itemId) {
			const request = {};
			this.pendingParentDataRequests.set(String(itemId), request);
			return request;
		}
		isCurrentParentDataRequest(itemId, request) {
			return this.pendingParentDataRequests.get(String(itemId)) === request;
		}
		finishParentDataRequest(itemId, request) {
			if (this.isCurrentParentDataRequest(itemId, request)) {
				this.pendingParentDataRequests.delete(String(itemId));
			}
		}
		invalidatePendingHierarchyRequest(itemId) {
			this.pendingParentDataRequests.delete(String(itemId));
			if (this.pendingSortHierarchyBatches) {
				this.pendingSortHierarchyBatches.forEach(batch => {
					batch.invalidatedItemIds.add(String(itemId));
				});
			}
			this.pendingHierarchyRequests.forEach((request, parentItemId) => {
				if (String(parentItemId) === String(itemId)) {
					request.invalidated = true;
					request.nextParentItem = null;
				} else if (request.itemIds.some(id => String(id) === String(itemId))) {
					request.invalidated = true;
				}
			});
		}
		reconcileVisibleSubTasks(parentItem) {
			const parentItemId = parentItem.getId();
			const pendingRequest = this.pendingHierarchyRequests.get(parentItemId);
			if (pendingRequest) {
				pendingRequest.invalidated = true;
				pendingRequest.nextParentItem = parentItem;
				return;
			}
			const visibleParent = this.entityStorage.findItemByItemId(parentItemId);
			if (!visibleParent || visibleParent.getSourceId() !== parentItem.getSourceId()) {
				return;
			}
			const parentEntity = this.entityStorage.findEntityByItemId(parentItemId);
			if (!parentEntity || parentEntity.isCompleted()) {
				return;
			}
			const subTasksInfo = parentItem.getSubTasksInfo();
			if (!subTasksInfo) {
				return;
			}
			const childSourceIds = Object.keys(subTasksInfo);
			if (childSourceIds.length === 0) {
				return;
			}
			const itemIds = this.entityStorage.findRootItemIdsBySourceIds(new Set(childSourceIds));
			if (itemIds.length === 0) {
				return;
			}
			const request = {
				itemIds,
				invalidated: false,
				nextParentItem: parentItem
			};
			this.pendingHierarchyRequests.set(parentItemId, request);
			this.requestSender.getItemData({
				itemIds
			}).then(response => {
				if (request.invalidated) {
					return;
				}
				const currentParent = this.entityStorage.findItemByItemId(parentItemId);
				if (!currentParent || currentParent.getSourceId() !== parentItem.getSourceId()) {
					return;
				}
				const currentParentEntity = this.entityStorage.findEntityByItemId(parentItemId);
				if (!currentParentEntity || currentParentEntity.isCompleted()) {
					return;
				}
				const currentSubTasksInfo = currentParent.getSubTasksInfo() || {};
				const removals = new Map();
				response.data.forEach(itemData => {
					this.collectReconciledChild(removals, parentItem, currentSubTasksInfo, itemData);
				});
				this.removeReconciledChildren(removals);
			}).catch(response => {}).finally(() => {
				if (this.pendingHierarchyRequests.get(parentItemId) !== request) {
					return;
				}
				this.pendingHierarchyRequests.delete(parentItemId);
				if (request.invalidated && request.nextParentItem) {
					this.reconcileVisibleSubTasks(request.nextParentItem);
				}
			});
		}
		reconcileVisibleSubTasksBatch(parentItems, batch) {
			const parentsById = new Map();
			const parentIdsByChildSourceId = new Map();
			parentItems.forEach(parentItem => {
				if (batch.invalidatedItemIds.has(String(parentItem.getId()))) {
					return;
				}
				const subTasksInfo = parentItem.getSubTasksInfo();
				if (!subTasksInfo) {
					return;
				}
				Object.keys(subTasksInfo).forEach(childSourceId => {
					if (!parentIdsByChildSourceId.has(childSourceId)) {
						parentIdsByChildSourceId.set(childSourceId, new Set());
					}
					parentIdsByChildSourceId.get(childSourceId).add(parentItem.getId());
				});
				parentsById.set(parentItem.getId(), parentItem);
			});
			if (parentIdsByChildSourceId.size === 0) {
				return Promise.resolve();
			}
			const visibleParents = new Map();
			const visibleRoots = new Map();
			const visit = (item, entity) => {
				const parentItem = parentsById.get(item.getId());
				if (parentItem && item.getSourceId() === parentItem.getSourceId()) {
					visibleParents.set(parentItem.getId(), {
						parentItem,
						item,
						entity
					});
				}
				const parentIds = parentIdsByChildSourceId.get(String(item.getSourceId()));
				if (parentIds && !item.isSubTask()) {
					visibleRoots.set(String(item.getId()), {
						item,
						entity,
						parentIds
					});
				}
			};
			const backlog = this.entityStorage.backlog;
			backlog.getItems().forEach(item => visit(item, backlog));
			this.entityStorage.sprints.forEach(sprint => {
				if (!sprint.isCompleted()) {
					sprint.getItems().forEach(item => visit(item, sprint));
				}
			});
			const rootsToRefresh = new Map();
			visibleRoots.forEach((root, id) => {
				if ([...root.parentIds].some(parentId => visibleParents.has(parentId))) {
					rootsToRefresh.set(id, root);
				}
			});
			if (rootsToRefresh.size === 0) {
				return Promise.resolve();
			}
			const itemIds = [...rootsToRefresh.values()].map(({
				item
			}) => item.getId());
			return this.requestSender.getItemData({
				itemIds
			}).then(response => {
				const currentParentsByTaskId = new Map();
				visibleParents.forEach((parent, parentId) => {
					if (batch.invalidatedItemIds.has(String(parentId)) || parent.entity.isCompleted() || !this.isEntityRegistered(parent.entity) || parent.entity.getItems().get(parentId) !== parent.item) {
						return;
					}
					currentParentsByTaskId.set(String(parent.parentItem.getSourceId()), {
						...parent,
						subTasksInfo: parent.item.getSubTasksInfo() || {}
					});
				});
				const removals = new Map();
				response.data.forEach(itemData => {
					const root = rootsToRefresh.get(String(itemData.id));
					if (!root || batch.invalidatedItemIds.has(String(itemData.id)) || root.entity.isCompleted() || !this.isEntityRegistered(root.entity) || root.entity.getItems().get(root.item.getId()) !== root.item) {
						return;
					}
					const parent = currentParentsByTaskId.get(String(itemData.parentTaskId));
					if (parent && root.parentIds.has(parent.parentItem.getId())) {
						this.collectReconciledChild(removals, parent.parentItem, parent.subTasksInfo, itemData, root.item, root.entity);
					}
				});
				this.removeReconciledChildren(removals);
			});
		}
		isEntityRegistered(entity) {
			return entity === this.entityStorage.backlog || this.entityStorage.sprints.get(entity.getId()) === entity;
		}
		collectReconciledChild(removals, parentItem, subTasksInfo, itemData, rootItem, rootEntity) {
			if (itemData.isSubTask !== 'Y' || itemData.parentTaskId !== parentItem.getSourceId()) {
				return;
			}
			const item = rootItem || this.entityStorage.findItemByItemId(itemData.id);
			if (!item || item.isSubTask() || !Object.prototype.hasOwnProperty.call(subTasksInfo, item.getSourceId())) {
				return;
			}
			const entity = rootEntity || this.entityStorage.findEntityByItemId(item.getId());
			if (!entity || entity.isCompleted()) {
				return;
			}
			if (!removals.has(entity)) {
				removals.set(entity, new Set());
			}
			removals.get(entity).add(item);
		}
		removeReconciledChildren(removals) {
			removals.forEach((items, entity) => {
				const itemsToRemove = [...items];
				const activeElement = document.activeElement;
				const focusedItem = itemsToRemove.find(item => {
					const node = item.getNode ? item.getNode() : null;
					return node && node.contains(activeElement);
				});
				let focusTarget = null;
				if (focusedItem) {
					const focusedNode = focusedItem.getNode();
					const remainingNodes = [...entity.getItems().values()].filter(item => !items.has(item) && !item.isSubTask()).map(item => item.getNode ? item.getNode() : null).filter(node => node && node.isConnected);
					focusTarget = remainingNodes.find(node => focusedNode.compareDocumentPosition(node) & Node.DOCUMENT_POSITION_FOLLOWING) ?? remainingNodes.at(-1) ?? entity.getListItemsNode();
				}
				if (entity.removeItems(itemsToRemove, true) > 0) {
					if (focusTarget && !activeElement.isConnected && document.activeElement === document.body) {
						if (!focusTarget.hasAttribute('tabindex')) {
							focusTarget.setAttribute('tabindex', '-1');
							focusTarget.addEventListener('blur', () => focusTarget.removeAttribute('tabindex'), {
								once: true
							});
						}
						focusTarget.focus({
							preventScroll: true
						});
					}
					this.updateEntityCounters(entity);
				}
			});
		}
		updateEntityCounters(sourceEntity, endEntity) {
			const entities = new Map();
			entities.set(sourceEntity.getId(), sourceEntity);
			if (endEntity) {
				entities.set(endEntity.getId(), endEntity);
			}
			this.entityCounters.updateCounters(entities);
		}
		onCalculateSort(baseEvent) {
			const listSortInfo = baseEvent.getData();
			Object.entries(listSortInfo).forEach(([itemId, info]) => {
				if (Object.prototype.hasOwnProperty.call(info, 'tmpId')) {
					this.addTmpIdToSkipSorting(info.tmpId);
				}
			});
		}
		addTmpIdToSkipAdding(tmpId) {
			this.listIdsToSkipAdding.add(tmpId);
		}
		addIdToSkipUpdating(itemId) {
			this.listIdsToSkipUpdating.add(itemId);
		}
		addIdToSkipRemoving(itemId) {
			this.listIdsToSkipRemoving.add(itemId);
		}
		addTmpIdToSkipSorting(tmpId) {
			this.listIdsToSkipSorting.add(tmpId);
		}
		externalAdd(itemId) {
			return new Promise((resolve, reject) => {
				setTimeout(() => this.isDelayedAdd(itemId) ? resolve() : reject(), 3000);
			});
		}
		isDelayedAdd(itemId) {
			return this.listToAddAfterUpdate.has(itemId);
		}
		setDelayedAdd(itemId) {
			this.listToAddAfterUpdate.add(itemId);
		}
		cleanDelayedAdd(itemId) {
			this.listToAddAfterUpdate.delete(itemId);
		}
		needSkipAdd(tmpId) {
			return this.listIdsToSkipAdding.has(tmpId);
		}
		cleanSkipAdd(tmpId) {
			this.listIdsToSkipAdding.delete(tmpId);
		}
		needSkipUpdate(item) {
			return this.listIdsToSkipUpdating.has(item.getId());
		}
		cleanSkipUpdate(item) {
			this.listIdsToSkipUpdating.delete(item.getId());
		}
		needSkipRemove(itemId) {
			return this.listIdsToSkipRemoving.has(itemId);
		}
		cleanSkipRemove(itemId) {
			this.listIdsToSkipRemoving.delete(itemId);
		}
		needSkipSort(tmpId) {
			return this.listIdsToSkipSorting.has(tmpId);
		}
		cleanSkipSort(tmpId) {
			this.listIdsToSkipSorting.delete(tmpId);
		}
	}

	class PullEpic {
		constructor(params) {
			this.requestSender = params.requestSender;
			this.entityStorage = params.entityStorage;
			this.epic = params.epic;
			this.listIdsToSkipAdding = new Set();
			this.listIdsToSkipUpdating = new Set();
			this.listIdsToSkipRemoving = new Set();
		}
		getModuleId() {
			return 'tasks';
		}
		getMap() {
			return {
				epicAdded: this.onEpicAdded.bind(this),
				epicUpdated: this.onEpicUpdated.bind(this),
				epicRemoved: this.onEpicRemoved.bind(this)
			};
		}
		onEpicAdded(epicData) {
			this.epic.onAfterAdd(new main_core_events.BaseEvent().setData(epicData));
		}
		onEpicUpdated(epicData) {
			this.epic.onAfterEdit(new main_core_events.BaseEvent().setData(epicData));
		}
		onEpicRemoved(epicData) {
			this.epic.onAfterRemove(new main_core_events.BaseEvent().setData(epicData));
		}
	}

	class PullCounters {
		constructor(params) {
			this.requestSender = params.requestSender;
			this.entityStorage = params.entityStorage;
			this.filterService = params.filterService;
			this.userId = params.userId;
			this.groupId = params.groupId;
		}
		getModuleId() {
			return 'tasks';
		}
		getMap() {
			return {
				comment_add: this.onCommentAdd.bind(this),
				task_view: this.onTaskView.bind(this),
				scrum_read_all: this.onCommentsReadAll.bind(this)
			};
		}
		onCommentAdd(data) {
			const inputTaskId = parseInt(data.taskId, 10);
			const ownerUserId = parseInt(data.ownerId, 10);
			if (ownerUserId === this.userId) {
				return;
			}
			this.#updateCurrentState(this.#getItem(inputTaskId));
		}
		onTaskView(data) {
			const inputTaskId = parseInt(data.TASK_ID, 10);
			const inputUserId = parseInt(data.USER_ID, 10);
			if (inputUserId !== this.userId) {
				return;
			}
			this.#updateCurrentState(this.#getItem(inputTaskId));
		}
		onCommentsReadAll(data) {
			const groupId = data.GROUP_ID;
			if (groupId && groupId === this.groupId) {
				this.filterService.applyFilter();
			}
		}
		#getItem(inputTaskId) {
			let item = this.entityStorage.findItemBySourceId(inputTaskId);
			if (!item) {
				item = this.entityStorage.findItemBySourceInFilteredCompletedSprints(inputTaskId);
			}
			return item;
		}
		#updateCurrentState(item) {
			if (!item) {
				return;
			}
			this.requestSender.getCurrentState({
				taskId: item.getSourceId()
			}).then(response => {
				item.updateYourself(Item.buildItem(response.data.itemData));
			}).catch(response => {
				this.requestSender.showErrorAlert(response);
			});
		}
	}

	class TaskCounters {
		constructor(params) {
			this.requestSender = params.requestSender;
			this.entityStorage = params.entityStorage;
			this.filterService = params.filter;
			this.isOwnerCurrentUser = params.isOwnerCurrentUser;
			this.userId = parseInt(params.userId, 10);
			this.groupId = parseInt(params.groupId, 10);
			this.filter = this.filterService.getFilterManager();
			this.updateFields();
			this.bindEvents();
			this.subscribeToPull();
		}
		bindEvents() {
			main_core_events.EventEmitter.subscribe('BX.Main.Filter:apply', this.onFilterApply.bind(this));
			main_core_events.EventEmitter.subscribe('Tasks.Toolbar:onItem', this.onCounterClick.bind(this));
		}
		subscribeToPull() {
			pull_client.PULL.subscribe(new PullCounters({
				requestSender: this.requestSender,
				entityStorage: this.entityStorage,
				filterService: this.filterService,
				userId: this.userId,
				groupId: this.groupId
			}));
		}
		onFilterApply() {
			this.updateFields();
		}
		updateFields() {
			this.fields = this.filter.getFilterFieldsValues();
		}
		onCounterClick(baseEvent) {
			const data = baseEvent.getData();
			if (data.counter && data.counter.filter) {
				this.toggleByField({
					[data.counter.filterField]: data.counter.filterValue
				});
			}
		}
		isFilteredByField(field) {
			if (!Object.keys(this.fields).includes(field)) {
				return false;
			}
			if (main_core.Type.isArray(this.fields[field])) {
				return this.fields[field].length > 0;
			}
			return this.fields[field] !== '';
		}
		isFilteredByFieldValue(field, value) {
			return this.isFilteredByField(field) && this.fields[field] === value;
		}
		toggleByField(field) {
			const name = Object.keys(field)[0];
			const value = field[name];
			if (!this.isFilteredByFieldValue(name, value)) {
				this.filter.getApi().extendFilter({
					[name]: value
				});
				return;
			}
			this.filter.getFilterFields().forEach(field => {
				if (field.getAttribute('data-name') === name) {
					this.filter.getFields().deleteField(field);
				}
			});
			this.filter.getSearch().apply();
		}
	}

	const PLACEMENT_RESYNC_DELAY = 150;
	class FilterHandler {
		constructor(params) {
			this.filter = params.filter;
			this.requestSender = params.requestSender;
			this.entityStorage = params.entityStorage;
			this.entityCounters = params.entityCounters ?? new EntityCounters({
				requestSender: this.requestSender,
				entityStorage: this.entityStorage
			});
			this.planBuilder = params.planBuilder;
			this.pageSize = params.pageSize;
			this.requestGeneration = 0;
			this.pendingRequestGeneration = null;
			this.resyncTimer = null;
			this.refreshCountersPending = false;
			this.filter.subscribe('applyFilter', this.onApplyFilter.bind(this));
		}
		requestResync(force = true) {
			if (!force && this.pendingRequestGeneration !== this.requestGeneration) {
				return;
			}
			this.refreshCountersPending = true;
			this.requestGeneration += 1;
			if (this.resyncTimer !== null) {
				return;
			}
			this.resyncTimer = setTimeout(() => {
				this.resyncTimer = null;
				this.onApplyFilter(null, true);
			}, PLACEMENT_RESYNC_DELAY);
		}
		onApplyFilter(baseEvent, refreshCounters = false) {
			if (refreshCounters) {
				this.refreshCountersPending = true;
			}
			if (this.resyncTimer !== null) {
				clearTimeout(this.resyncTimer);
				this.resyncTimer = null;
			}
			const requestGeneration = ++this.requestGeneration;
			this.pendingRequestGeneration = requestGeneration;
			this.fadeOutAll();
			const containerPosition = main_core.Dom.getPosition(this.planBuilder.getScrumContainer());
			const loader = new main_loader.Loader({
				target: this.planBuilder.getScrumContainer(),
				offset: {
					top: `${containerPosition.top / 2}px`
				}
			});
			loader.show();
			this.requestSender.applyFilter({
				pageSize: this.pageSize
			}).then(response => {
				if (this.pendingRequestGeneration === requestGeneration) {
					this.pendingRequestGeneration = null;
				}
				if (requestGeneration !== this.requestGeneration) {
					loader.hide();
					return;
				}
				const filteredItemsData = response.data.items;
				this.entityStorage.getAllItems().forEach(item => {
					const entity = this.entityStorage.findEntityByItemId(item.getId());
					entity.removeItem(item);
					if (item.isShownSubTasks()) {
						item.hideSubTasks();
					}
					item.removeYourself();
				});
				const completedSprints = new Map();
				filteredItemsData.forEach(itemParams => {
					const item = Item.buildItem(itemParams);
					const entity = this.entityStorage.findEntityByEntityId(item.getEntityId());
					if (response.data.completedSprints.length) {
						response.data.completedSprints.forEach(sprintParams => {
							if (item.getEntityId() === sprintParams.id) {
								if (completedSprints.has(item.getEntityId())) {
									completedSprints.get(item.getEntityId()).setItem(item);
								} else {
									const completedSprint = Sprint.buildSprint(sprintParams);
									completedSprint.setItem(item);
									completedSprint.setShortView('Y');
									completedSprints.set(completedSprint.getId(), completedSprint);
								}
							}
						});
					}
					if (entity && !entity.isCompleted()) {
						item.setShortView(entity.getShortView());
						entity.appendItemToList(item);
						entity.setItem(item);
						this.planBuilder.clearLoadItemsRepeatCounter();
						entity.setActiveLoadItems(false);
						entity.bindItemsLoader();
					}
				});
				const isExactSearchApplied = response.data.isExactSearchApplied === 'Y';
				this.entityStorage.getAllEntities().forEach(entity => {
					entity.setExactSearchApplied(response.data.isExactSearchApplied);
					if (!entity.isCompleted() && entity.isEmpty()) {
						if (entity.getNumberTasks() > 0 && entity.isExactSearchApplied()) {
							entity.showEmptySearchStub();
							entity.hideDropzone();
						} else {
							if (this.entityStorage.existsAtLeastOneItem()) {
								entity.showDropzone();
							}
							entity.hideEmptySearchStub();
						}
					}
					if (!entity.isBacklog() && !entity.isCompleted()) {
						entity.setPageNumberItems(Math.ceil(entity.getNumberItems() / entity.getPageSize()));
					}
				});
				this.planBuilder.hideEmptySearchStub();
				if (completedSprints.size) {
					this.planBuilder.showFilteredCompletedSprints(completedSprints);
				} else {
					this.planBuilder.hideFilteredCompletedSprints();
					if (isExactSearchApplied) {
						this.planBuilder.showEmptySearchStub();
					}
				}
				if (this.refreshCountersPending) {
					this.refreshCountersPending = false;
					const entities = new Map([...this.entityStorage.getAllEntities()].filter(([, entity]) => !entity.isCompleted()));
					this.entityCounters.updateCounters(entities);
				}
				this.fadeInAll();
				loader.hide();
			}).catch(response => {
				if (this.pendingRequestGeneration === requestGeneration) {
					this.pendingRequestGeneration = null;
				}
				if (requestGeneration !== this.requestGeneration) {
					loader.hide();
					return;
				}
				this.fadeInAll();
				loader.hide();
				this.requestSender.showErrorAlert(response);
			});
		}
		fadeOutAll() {
			this.entityStorage.getBacklog().fadeOut();
			this.entityStorage.getSprints().forEach(sprint => {
				if (!sprint.isCompleted()) {
					sprint.fadeOut();
				}
			});
		}
		fadeInAll() {
			this.entityStorage.getBacklog().fadeIn();
			this.entityStorage.getSprints().forEach(sprint => {
				if (!sprint.isCompleted()) {
					sprint.fadeIn();
				}
			});
		}
	}

	class Decomposition {
		constructor(params) {
			this.parentItem = params.parentItem;
			this.count = 1;
		}
		getParentItem() {
			return this.parentItem;
		}
		addNumberDecompositionsPerformed() {
			this.count++;
		}
		getNumberDecompositionsPerformed() {
			return this.count;
		}
	}

	class PullTag {
		constructor(params) {
			this.requestSender = params.requestSender;
			this.entityStorage = params.entityStorage;
			this.groupId = params.groupId;
		}
		getModuleId() {
			return 'tasks';
		}
		getMap() {
			return {
				tag_changed: this.onTagChanged.bind(this)
			};
		}
		onTagChanged(params) {
			let tagDialogs = BX.UI.EntitySelector.Dialog.getInstances();
			tagDialogs.forEach(dialog => {
				dialog.hide();
			});
			if (parseInt(this.groupId, 10) !== params.groupId) {
				return;
			}
			this.entityStorage.getBacklog().fadeOut();
			const updatedTags = params.oldTagsNames;
			let updatedTag = params.oldTagName;
			const newTag = params.newTagName;
			const items = this.entityStorage.getAllItems();
			const itemsToUpdate = new Set();
			items.forEach(item => {
				const tags = item.getTags().getValue();
				if (tags.find(tag => tag === updatedTag)) {
					itemsToUpdate.add(item);
				}
				if (updatedTags) {
					updatedTags.forEach(tag => {
						let updatedTagFromArray = tag;
						if (tags.find(tag => tag === updatedTagFromArray)) {
							itemsToUpdate.add(item);
						}
					});
				}
			});
			itemsToUpdate.forEach(item => {
				const currentTags = item.getTags().getValue();
				currentTags.forEach((tag, index, array) => {
					if (updatedTags && updatedTags.length !== 0 && updatedTags.find(tagInArr => tag === tagInArr)) {
						array[index] = newTag;
					} else if (tag === updatedTag) {
						array[index] = newTag;
					}
				});
				const newTags = [];
				currentTags.forEach(tag => {
					if (tag !== '') {
						newTags.push(tag);
					}
				});
				item.setTags(newTags);
			});
			setTimeout(() => {
				this.entityStorage.getBacklog().fadeIn();
			}, 1000);
		}
	}

	class Plan extends View {
		constructor(params) {
			super(params);
			this.setEventNamespace('BX.Tasks.Scrum.Plan');
			this.pathToTask = params.pathToTask;
			this.pathToTaskCreate = params.pathToTaskCreate;
			this.pathToBurnDown = params.pathToBurnDown;
			this.mandatoryExists = params.mandatoryExists === 'Y';
			this.defaultResponsible = params.defaultResponsible;
			this.pageSize = parseInt(params.pageSize, 10);
			this.activeSprintId = parseInt(params.activeSprintId, 10);
			this.views = params.views;
			this.isShortView = params.isShortView;
			this.displayPriority = params.displayPriority;
			this.isExactSearchApplied = params.isExactSearchApplied;
			this.entityStorage = new EntityStorage();
			this.entityStorage.addBacklog(Backlog.buildBacklog(params.backlog));
			params.sprints.forEach(sprintData => {
				sprintData.defaultSprintDuration = params.defaultSprintDuration;
				sprintData.isShortView = params.isShortView;
				const sprint = Sprint.buildSprint(sprintData);
				this.entityStorage.addSprint(sprint);
			});
			this.entityCounters = new EntityCounters({
				requestSender: this.requestSender,
				entityStorage: this.entityStorage
			});
			this.taskCounters = new TaskCounters({
				requestSender: this.requestSender,
				entityStorage: this.entityStorage,
				filter: this.filter,
				userId: params.userId,
				groupId: params.groupId,
				isOwnerCurrentUser: params.isOwnerCurrentUser
			});
			this.tagSearcher = new TagSearcher({
				requestSender: this.requestSender,
				filter: this.filter,
				groupId: params.groupId,
				tagsAreConverting: params.tagsAreConverting
			});
			this.planBuilder = new PlanBuilder({
				requestSender: this.requestSender,
				entityStorage: this.entityStorage,
				defaultSprintDuration: params.defaultSprintDuration,
				pageNumberToCompletedSprints: params.pageNumberToCompletedSprints,
				displayPriority: params.displayPriority,
				isShortView: params.isShortView,
				mandatoryExists: params.mandatoryExists,
				isExactSearchApplied: params.isExactSearchApplied,
				pageSize: this.pageSize
			});
			this.planBuilder.subscribe('beforeCreateSprint', baseEvent => {
				const requestData = baseEvent.getData();
				this.pullSprint.addTmpIdToSkipAdding(requestData.tmpId);
			});
			this.planBuilder.subscribe('createSprint', baseEvent => {
				const sprint = baseEvent.getData();
				this.subscribeToSprint(sprint);
				this.itemMover.addSprintContainers(sprint);
			});
			this.planBuilder.subscribe('createSprintNode', baseEvent => {
				const sprint = baseEvent.getData();
				this.subscribeToSprint(sprint);
				this.itemMover.addSprintContainers(sprint);
			});
			this.planBuilder.subscribe('sprintsScroll', this.onActionPanelScroll.bind(this));
			this.searchItems = new SearchItems({
				planBuilder: this.planBuilder,
				entityStorage: this.entityStorage
			});
			this.sprintMover = new SprintMover({
				requestSender: this.requestSender,
				planBuilder: this.planBuilder,
				entityStorage: this.entityStorage
			});
			this.itemMover = new ItemMover({
				requestSender: this.requestSender,
				planBuilder: this.planBuilder,
				entityStorage: this.entityStorage,
				entityCounters: this.entityCounters
			});
			this.itemDesigner = new ItemDesigner({
				requestSender: this.requestSender,
				entityStorage: this.entityStorage
			});
			this.filterHandler = new FilterHandler({
				filter: this.filter,
				requestSender: this.requestSender,
				entityStorage: this.entityStorage,
				entityCounters: this.entityCounters,
				planBuilder: this.planBuilder,
				pageSize: this.pageSize
			});
			this.epic = new Epic({
				groupId: this.groupId,
				sidePanel: this.sidePanel,
				entityStorage: this.entityStorage,
				filter: this.filter,
				tagSearcher: this.tagSearcher
			});
			this.pullTag = new PullTag({
				requestSender: this.requestSender,
				entityStorage: this.entityStorage,
				groupId: this.groupId
			});
			this.pullSprint = new PullSprint({
				requestSender: this.requestSender,
				planBuilder: this.planBuilder,
				entityStorage: this.entityStorage,
				groupId: this.getCurrentGroupId()
			});
			this.pullItem = new PullItem({
				requestSender: this.requestSender,
				entityStorage: this.entityStorage,
				entityCounters: this.entityCounters,
				tagSearcher: this.tagSearcher,
				itemMover: this.itemMover,
				currentUserId: this.getCurrentUserId(),
				groupId: this.getCurrentGroupId(),
				requestPlacementResync: force => this.requestPlacementResync(force)
			});
			this.pullEpic = new PullEpic({
				requestSender: this.requestSender,
				entityStorage: this.entityStorage,
				epic: this.epic
			});
			this.input = new Input();
			this.input.subscribe('createTaskItem', this.onCreateTaskItem.bind(this));
			this.input.subscribe('tagsSearchOpen', this.onTagsSearchOpen.bind(this));
			this.input.subscribe('tagsSearchClose', this.onTagsSearchClose.bind(this));
			this.input.subscribe('epicSearchOpen', this.onEpicSearchOpen.bind(this));
			this.input.subscribe('epicSearchClose', this.onEpicSearchClose.bind(this));
			this.input.subscribe('render', this.onRenderInput.bind(this));
			this.input.subscribe('remove', this.onRemoveInput.bind(this));
			this.actionPanel = null;
			this.responsibleDialog = null;
			this.bindHandlers();
			this.subscribeToPull();
		}
		renderTo(container) {
			super.renderTo(container);
			this.planBuilder.renderTo(container);
		}
		renderRightElementsTo(container) {
			super.renderRightElementsTo(container);
			const shortView = new ui_shortView.ShortView({
				isShortView: this.isShortView
			});
			shortView.renderTo(container);
			shortView.subscribe('change', this.onChangeShortView.bind(this));
		}
		setDisplayPriority(value) {
			super.setDisplayPriority(value);
			this.planBuilder.setWidthPriority(value);
			this.requestSender.saveDisplayPriority({
				value: value
			}).then(response => {}).catch(response => {
				this.requestSender.showErrorAlert(response);
			});
		}
		changeShortView(isShortView) {
			super.changeShortView(isShortView);
			this.planBuilder.setShortView(isShortView);
			this.destroyActionPanel();
			const entities = this.entityStorage.getAllEntities();
			entities.forEach(entity => {
				if (!entity.isCompleted()) {
					entity.deactivateGroupMode();
					entity.fadeOut();
				}
			});
			this.requestSender.saveShortView({
				isShortView: isShortView
			}).then(response => {
				entities.forEach(entity => {
					if (!entity.isCompleted()) {
						entity.setShortView(isShortView);
						entity.adjustListItemsWidth();
						entity.fadeIn();
					}
				});
			}).catch(response => {
				entities.forEach(entity => {
					if (!entity.isCompleted()) {
						entity.fadeIn();
					}
				});
				this.requestSender.showErrorAlert(response);
			});
		}
		requestPlacementResync(force = true) {
			this.filterHandler.requestResync(force);
		}
		subscribeToPull() {
			pull_client.PULL.subscribe(this.pullSprint);
			pull_client.PULL.subscribe(this.pullItem);
			pull_client.PULL.subscribe(this.pullEpic);
			pull_client.PULL.subscribe(this.pullTag);
		}
		bindHandlers() {
			this.entityStorage.getBacklog().subscribe('showInput', this.onShowBacklogInput.bind(this));
			this.entityStorage.getBacklog().subscribe('openAddTaskForm', this.onOpenAddTaskForm.bind(this));
			this.entityStorage.getBacklog().subscribe('updateItem', this.onUpdateItem.bind(this));
			this.entityStorage.getBacklog().subscribe('showTask', this.onShowTask.bind(this));
			this.entityStorage.getBacklog().subscribe('destroyActionPanel', this.onDestroyActionPanel.bind(this));
			this.entityStorage.getBacklog().subscribe('changeTaskResponsible', this.onChangeTaskResponsible.bind(this));
			this.entityStorage.getBacklog().subscribe('onShowResponsibleDialog', this.onShowResponsibleDialog.bind(this));
			this.entityStorage.getBacklog().subscribe('openAddEpicForm', this.onOpenEpicForm.bind(this));
			this.entityStorage.getBacklog().subscribe('tagsSearchOpen', this.onTagsSearchOpen.bind(this));
			this.entityStorage.getBacklog().subscribe('tagsSearchClose', this.onTagsSearchClose.bind(this));
			this.entityStorage.getBacklog().subscribe('epicSearchOpen', this.onEpicSearchOpen.bind(this));
			this.entityStorage.getBacklog().subscribe('epicSearchClose', this.onEpicSearchClose.bind(this));
			this.entityStorage.getBacklog().subscribe('filterByEpic', this.onFilterByEpic.bind(this));
			this.entityStorage.getBacklog().subscribe('filterByTag', this.onFilterByTag.bind(this));
			this.entityStorage.getBacklog().subscribe('loadItems', baseEvent => {
				const entity = baseEvent.getTarget();
				this.planBuilder.loadItems(entity);
			});
			this.entityStorage.getBacklog().subscribe('toggleActionPanel', this.onToggleActionPanel.bind(this));
			this.entityStorage.getBacklog().subscribe('showLinked', this.onShowLinked.bind(this));
			this.entityStorage.getBacklog().subscribe('itemsScroll', this.onActionPanelScroll.bind(this));
			this.entityStorage.getBacklog().subscribe('showBlank', this.onShowBlank.bind(this));
			this.entityStorage.getBacklog().subscribe('deactivateGroupMode', this.onDeactivateGroupMode.bind(this));
			this.entityStorage.getSprints().forEach(sprint => this.subscribeToSprint(sprint));
			this.epic.subscribe('filterByTag', this.onFilterByTag.bind(this));
			this.itemMover.subscribe('dragStart', () => {
				this.destroyActionPanel();
				if (this.searchItems.isActive()) {
					this.searchItems.stop();
				}
			});
			document.onkeydown = this.onDocumentKeyDown.bind(this);
			document.onclick = this.onDocumentClick.bind(this);
		}
		subscribeToSprint(sprint) {
			sprint.subscribe('showInput', this.onShowSprintInput.bind(this));
			sprint.subscribe('createSprint', this.onCreateSprint.bind(this));
			sprint.subscribe('updateItem', this.onUpdateItem.bind(this));
			sprint.subscribe('getSubTasks', this.onGetSubTasks.bind(this));
			sprint.subscribe('showTask', this.onShowTask.bind(this));
			sprint.subscribe('destroyActionPanel', this.onDestroyActionPanel.bind(this));
			sprint.subscribe('startSprint', this.onStartSprint.bind(this));
			sprint.subscribe('completeSprint', this.onCompleteSprint.bind(this));
			sprint.subscribe('changeTaskResponsible', this.onChangeTaskResponsible.bind(this));
			sprint.subscribe('onShowResponsibleDialog', this.onShowResponsibleDialog.bind(this));
			sprint.subscribe('removeSprint', this.onRemoveSprint.bind(this));
			sprint.subscribe('changeSprintName', this.onChangeSprintName.bind(this));
			sprint.subscribe('changeSprintDeadline', this.onChangeSprintDeadline.bind(this));
			sprint.subscribe('tagsSearchOpen', this.onTagsSearchOpen.bind(this));
			sprint.subscribe('tagsSearchClose', this.onTagsSearchClose.bind(this));
			sprint.subscribe('epicSearchOpen', this.onEpicSearchOpen.bind(this));
			sprint.subscribe('epicSearchClose', this.onEpicSearchClose.bind(this));
			sprint.subscribe('filterByEpic', this.onFilterByEpic.bind(this));
			sprint.subscribe('filterByTag', this.onFilterByTag.bind(this));
			sprint.subscribe('getSprintCompletedItems', this.onGetSprintCompletedItems.bind(this));
			sprint.subscribe('showSprintBurnDownChart', this.onShowSprintBurnDownChart.bind(this));
			sprint.subscribe('showSprintCreateMenu', this.onOpenSprintAddMenu.bind(this));
			sprint.subscribe('loadItems', baseEvent => {
				const entity = baseEvent.getTarget();
				this.planBuilder.loadItems(entity);
			});
			sprint.subscribe('toggleActionPanel', this.onToggleActionPanel.bind(this));
			sprint.subscribe('showLinked', this.onShowLinked.bind(this));
			sprint.subscribe('showDropzone', this.onShowDropZone.bind(this));
			sprint.subscribe('toggleVisibilityContent', this.onToggleVisibilityContent.bind(this));
			sprint.subscribe('deactivateGroupMode', this.onDeactivateGroupMode.bind(this));
		}
		showErrorAlert(message) {
			ui_dialogs_messagebox.MessageBox.alert(message, main_core.Loc.getMessage('TASKS_SCRUM_ERROR_TITLE_POPUP'));
		}
		onDocumentKeyDown(event) {
			event = event || window.event;
			if (this.searchItems.isActive()) {
				if (event.key === 'ArrowUp' || event.key === 'ArrowLeft') {
					event.preventDefault();
					this.searchItems.moveToPrev();
				}
				if (event.key === 'ArrowDown' || event.key === 'ArrowRight') {
					event.preventDefault();
					this.searchItems.moveToNext();
				}
			}
			if (event.key === 'Escape') {
				let prevented = false;
				if (this.searchItems.isActive()) {
					prevented = true;
					this.searchItems.stop();
				}
				if (this.actionPanel) {
					prevented = true;
					this.destroyActionPanel();
					this.entityStorage.getAllEntities().forEach(entity => {
						entity.deactivateGroupMode();
					});
				}
				if (prevented) {
					event.stopImmediatePropagation();
				}
			}
		}
		onDocumentClick(event) {
			event = event || window.event;
			if (this.searchItems.isActive() && !this.searchItems.isClickInside(event.target)) {
				this.searchItems.stop();
			}
			if (this.diskManager && !this.diskManager.isClickInside(event)) {
				this.diskManager.closeAttachmentMenu();
				this.diskManager = null;
			}
		}
		onShowBacklogInput(baseEvent) {
			const backlog = baseEvent.getTarget();
			const header = baseEvent.getData();
			this.showInput(backlog).then(() => {
				if (!main_core.Type.isPlainObject(header)) {
					header.unLockTaskButton();
				}
			});
		}
		onShowSprintInput(baseEvent) {
			const sprint = baseEvent.getTarget();
			if (sprint.isHideContent()) {
				sprint.subscribeOnce('toggleVisibilityContent', this.showInput.bind(this, sprint));
				sprint.toggleVisibilityContent(sprint.getContentContainer());
			} else {
				this.showInput(sprint);
			}
		}
		onOpenAddTaskForm(baseEvent) {
			const header = baseEvent.getData();
			this.sidePanel.subscribeOnce('onLoadSidePanel', () => {
				if (!main_core.Type.isPlainObject(header)) {
					header.unLockTaskButton();
				}
			});
			const path = BX.Uri.addParam(this.pathToTaskCreate.replace('#task_id#', 0), {
				ta_sec: 'scrum',
				ta_sub: 'list',
				ta_el: 'create_button'
			});
			this.sidePanel.openSidePanelByUrl(path);
		}
		onCreateSprint() {
			this.planBuilder.createSprint();
		}
		onRenderInput(baseEvent) {
			this.deactivateDraggable();
			const input = baseEvent.getTarget();
			const entity = input.getEntity();
			entity.hideBlank();
			entity.hideDropzone();
			entity.hideEmptySearchStub();
		}
		onRemoveInput(baseEvent) {
			this.activateDraggable();
			const input = baseEvent.getTarget();
			const entity = input.getEntity();
			if (!input.isTaskCreated() && entity.isEmpty()) {
				if (entity.isBacklog()) {
					if (this.entityStorage.existsAtLeastOneItem()) {
						if (entity.isExactSearchApplied()) {
							entity.showEmptySearchStub();
						} else {
							entity.showDropzone();
						}
					} else {
						entity.showBlank();
					}
				} else {
					if (entity.getNumberTasks() > 0 && entity.isExactSearchApplied()) {
						entity.showEmptySearchStub();
					} else {
						entity.showDropzone();
					}
				}
			}
			if (this.decomposition) {
				this.decomposition.getParentItem().deactivateDecompositionMode();
				this.decomposition = null;
			}
			entity.adjustListItemsWidth();
		}
		onCreateTaskItem(baseEvent) {
			const input = baseEvent.getTarget();
			const entity = input.getEntity();
			let newItem = null;
			try {
				newItem = this.createItem(input);
			} catch (error) {
				this.showErrorAlert(error.message);
				input.removeYourself();
				return;
			}
			if (this.decomposition) {
				const parentItem = this.decomposition.getParentItem();
				this.pullItem.addIdToSkipUpdating(parentItem.getId());
				newItem.setParentEntity(entity.getId(), entity.getEntityType());
				newItem.setParentTaskId(parentItem.getSourceId());
				newItem.setEpic(parentItem.getEpic().getValue());
				newItem.setTags(parentItem.getTags().getValue());
				newItem.setResponsible(parentItem.getResponsible().getValue());
				if (entity.isBacklog()) {
					parentItem.setLinkedTask('Y');
					parentItem.updateBorderColor();
					newItem.setLinkedTask('Y');
					newItem.setBorderColor(parentItem.getBorderColor());
					const increment = this.decomposition.getNumberDecompositionsPerformed() * 10;
					newItem.setSort(parentItem.getSort() + increment);
					main_core.Dom.insertBefore(newItem.render(), input.getNode());
				} else {
					newItem.setSubTask('Y');
					const subtaskIncrement = (parentItem.getSubTasksCount() + 1) * 10;
					newItem.setSort(parentItem.getSort() + subtaskIncrement);
					newItem.setParentTaskId(parentItem.getSourceId());
					newItem.setParentTask('N');
				}
				this.decomposition.addNumberDecompositionsPerformed();
			} else {
				newItem.setEpic(input.getEpic());
				input.setEpic(null);
				newItem.setParentEntity(entity.getId(), entity.getEntityType());
				const firstItemNode = entity.getFirstItemNode(this.input);
				const sortForNewItem = parseFloat(firstItemNode.dataset.sort) / 2;
				newItem.setSort(sortForNewItem);
				newItem.setResponsible(this.defaultResponsible);
				if (entity.isEmpty()) {
					main_core.Dom.insertBefore(newItem.render(), entity.getLoaderNode());
				} else {
					main_core.Dom.insertBefore(newItem.render(), firstItemNode);
				}
			}
			this.pullItem.addTmpIdToSkipAdding(newItem.getId());
			this.pullItem.addTmpIdToSkipSorting(newItem.getId());
			this.sendRequestToCreateTask(entity, newItem).then(response => {
				this.fillItemAfterCreation(newItem, response.data);
				entity.setItem(newItem);
				this.updateEntityCounters(entity);
				if (this.decomposition) {
					const parentItem = this.decomposition.getParentItem();
					if (!entity.isBacklog()) {
						const subTasks = parentItem.getSubTasks();
						subTasks.addTask(newItem);
						if (!subTasks.isShown()) {
							entity.appendNodeAfterItem(subTasks.render(), parentItem.getNode());
						}
						const subTaskInfo = {};
						subTaskInfo[newItem.getSourceId()] = {
							sourceId: newItem.getSourceId(),
							completed: 'N',
							storyPoints: ''
						};
						parentItem.setSubTasksInfo({
							...parentItem.getSubTasksInfo(),
							...subTaskInfo
						});
						parentItem.setParentTask('Y');
						parentItem.showSubTasks();
					}
				}
				input.unDisable();
				input.focus();
				entity.adjustListItemsWidth();
				this.planBuilder.adjustSprintListWidth();
			}).catch(response => {
				this.requestSender.showErrorAlert(response);
			});
		}
		onUpdateItem(baseEvent) {
			const entity = baseEvent.getTarget();
			const updateData = baseEvent.getData();
			this.pullItem.addIdToSkipUpdating(updateData.itemId);
			this.requestSender.updateItem(baseEvent.getData()).then(() => {
				const isStoryPointsUpdated = !main_core.Type.isUndefined(updateData.storyPoints);
				if (isStoryPointsUpdated) {
					this.updateEntityCounters(entity);
				}
			}).catch(response => {
				this.requestSender.showErrorAlert(response);
			});
		}
		onGetSubTasks(baseEvent) {
			const sprint = baseEvent.getTarget();
			const subTasks = baseEvent.getData();
			sprint.appendNodeAfterItem(subTasks.render(), subTasks.getParentItem().getNode());
			this.requestSender.getSubTaskItems({
				entityId: sprint.getId(),
				taskId: subTasks.getParentItem().getSourceId()
			}).then(response => {
				response.data.forEach(itemParams => {
					const subTaskItem = Item.buildItem(itemParams);
					sprint.setItem(subTaskItem);
					subTasks.addTask(subTaskItem);
				});
				subTasks.getParentItem().showSubTasks();
				sprint.deactivateSubTaskLoading(subTasks.getParentItem());
				this.planBuilder.adjustSprintListWidth();
			}).catch(response => {
				this.requestSender.showErrorAlert(response);
			});
		}
		onChangeTaskResponsible(baseEvent) {
			const item = baseEvent.getData();
			this.pullItem.addIdToSkipUpdating(item.getId());
			this.requestSender.changeTaskResponsible({
				itemId: item.getId(),
				sourceId: item.getSourceId(),
				responsible: item.getResponsible().getValue()
			}).catch(response => {
				this.requestSender.showErrorAlert(response);
			});
		}
		onShowResponsibleDialog(baseEvent) {
			this.responsibleDialog = baseEvent.getData();
		}
		onOpenEpicForm(baseEvent) {
			const header = baseEvent.getData();
			this.epic.openAddForm().then(() => {
				header.unLockEpicButton();
			});
		}
		onStartSprint(baseEvent) {
			const sprint = baseEvent.getTarget();
			const sprintSidePanel = new SprintSidePanel({
				sidePanel: this.sidePanel,
				groupId: this.groupId,
				views: this.views
			});
			sprintSidePanel.showStartForm(sprint);
		}
		onCompleteSprint() {
			const sprintSidePanel = new SprintSidePanel({
				sidePanel: this.sidePanel,
				groupId: this.groupId,
				views: this.views
			});
			sprintSidePanel.showCompletionForm();
			sprintSidePanel.subscribe('showTask', innerBaseEvent => {
				const path = BX.Uri.addParam(this.getPathToTask().replace('#task_id#', innerBaseEvent.getData()), {
					ta_sec: 'scrum',
					ta_sub: 'list',
					ta_el: 'title_click'
				});
				this.sidePanel.openSidePanelByUrl(path);
			});
		}
		onRemoveSprint(baseEvent) {
			const sprint = baseEvent.getTarget();
			this.pullSprint.addIdToSkipRemoving(sprint.getId());
			this.requestSender.removeSprint({
				sprintId: sprint.getId(),
				sortInfo: this.sprintMover.calculateSprintSort()
			}).then(() => {
				if (!sprint.isEmpty()) {
					[...sprint.getItems().values()].map(item => {
						sprint.addItemToGroupMode(item);
					});
					this.itemMover.moveToWithGroupMode(sprint, this.entityStorage.getBacklog(), null, false, false);
				}
				this.destroyActionPanel();
				sprint.removeYourself();
				this.entityStorage.removeSprint(sprint.getId());
				this.planBuilder.adjustSprintListWidth();
			}).catch(response => {
				this.requestSender.showErrorAlert(response);
			});
		}
		onChangeSprintName(baseEvent) {
			const requestData = baseEvent.getData();
			this.pullSprint.addIdToSkipUpdating(requestData.sprintId);
			this.requestSender.changeSprintName(requestData).catch(response => {
				this.requestSender.showErrorAlert(response);
			});
		}
		onChangeSprintDeadline(baseEvent) {
			const sprint = baseEvent.getTarget();
			const requestData = baseEvent.getData();
			this.pullSprint.addIdToSkipUpdating(requestData.sprintId);
			this.requestSender.changeSprintDeadline(requestData).then(response => {
				const sprintData = response.data;
				sprint.setDateStartFormatted(sprintData.dateStartFormatted);
				sprint.setDateEndFormatted(sprintData.dateEndFormatted);
				sprint.setDateStart(sprintData.dateStart);
				sprint.setDateEnd(sprintData.dateEnd);
			}).catch(response => {
				this.requestSender.showErrorAlert(response);
			});
		}
		onGetSprintCompletedItems(baseEvent) {
			const sprint = baseEvent.getTarget();
			const listItemsNode = sprint.getListItemsNode();
			const listPosition = main_core.Dom.getPosition(listItemsNode);
			main_core.Dom.style(sprint.getContentContainer(), 'height', 'auto');
			const loader = new main_loader.Loader({
				size: 60,
				mode: 'inline',
				color: '#eaeaea',
				offset: {
					left: `${listPosition.width / 2 - 30}px`
				}
			});
			loader.show(); // todo promise wtf

			this.requestSender.getSprintCompletedItems({
				sprintId: sprint.getId()
			}).then(response => {
				loader.hide();
				if (response.data.length > 0) {
					response.data.forEach(itemParams => {
						const item = Item.buildItem(itemParams);
						if (!sprint.getItems().has(item.getId())) {
							item.setDisableStatus(sprint.isDisabled());
							if (item.isParentTask()) {
								item.setToggle(false);
								item.setParentTask(false);
							}
							sprint.appendItemToList(item);
							sprint.setItem(item);
						}
					});
				} else {
					sprint.showBlank();
				}
				sprint.showContent(sprint.getContentContainer());
			}).catch(response => {
				loader.hide();
				this.requestSender.showErrorAlert(response);
			});
		}
		onShowSprintBurnDownChart(baseEvent) {
			const sprint = baseEvent.getTarget();
			const sprintSidePanel = new SprintSidePanel({
				sidePanel: this.sidePanel,
				groupId: this.groupId,
				views: this.views,
				pathToBurnDown: this.pathToBurnDown
			});
			sprintSidePanel.showBurnDownChart(sprint);
		}
		onOpenSprintAddMenu(baseEvent) {
			const entity = baseEvent.getTarget();
			const button = baseEvent.getData().getNode();
			if (this.sprintAddMenu) {
				this.sprintAddMenu.getPopupWindow().destroy();
				this.sprintAddMenu = null;
				return;
			}
			const buttonRect = button.getBoundingClientRect();
			this.sprintAddMenu = new main_popup.Menu({
				id: 'tasks-scrum-sprint-add-menu',
				bindElement: button,
				closeByEsc: true,
				angle: {
					position: 'top',
					offset: 78
				},
				offsetLeft: buttonRect.width - 67
			});
			this.sprintAddMenu.addMenuItem({
				text: main_core.Loc.getMessage('TASKS_SCRUM_BACKLOG_SPRINT_FIRST_ADD'),
				onclick: (event, menuItem) => {
					this.onShowSprintInput(new main_core_events.BaseEvent().setTarget(entity));
					menuItem.getMenuWindow().close();
				}
			});
			this.sprintAddMenu.addMenuItem({
				text: main_core.Loc.getMessage('TASKS_SCRUM_BACKLOG_SPRINT_SECOND_ADD'),
				onclick: (event, menuItem) => {
					this.planBuilder.createSprint();
					menuItem.getMenuWindow().close();
				}
			});
			this.sprintAddMenu.getPopupWindow().subscribe('onClose', () => {
				this.sprintAddMenu.getPopupWindow().destroy();
				this.sprintAddMenu = null;
			});
			this.sprintAddMenu.getPopupWindow().subscribe('onShow', () => {
				const angle = this.sprintAddMenu.getMenuContainer().querySelector('.popup-window-angly');
				main_core.Dom.style(angle, 'pointerEvents', 'none');
			});
			this.sprintAddMenu.show();
		}
		onShowTask(baseEvent, element = 'title_click') {
			const item = baseEvent.getData();
			const path = BX.Uri.addParam(this.getPathToTask().replace('#task_id#', item.getSourceId()), {
				ta_sec: 'scrum',
				ta_sub: 'list',
				ta_el: element
			});
			this.sidePanel.openSidePanelByUrl(path);
		}
		onDestroyActionPanel(baseEvent) {
			const item = baseEvent.getData();
			this.destroyActionPanel();
			this.entityStorage.findEntityByItemId(item.getId()).deactivateGroupMode();
		}
		onTagsSearchOpen(baseEvent) {
			this.tagSearcher.showTagsSearchDialog(this.input, baseEvent.getData());
		}
		onTagsSearchClose() {
			this.tagSearcher.closeTagsSearchDialog();
		}
		onFilterByTag(baseEvent) {
			const tag = baseEvent.getData();
			const currentValue = this.filter.getValueFromField({
				name: 'TAG',
				value: ''
			});
			const newValue = String(tag) === String(currentValue) ? [] : [String(tag)];
			this.filter.setValuesToField([{
				name: 'TAG',
				value: newValue
			}, {
				name: 'TAG_label',
				value: newValue
			}]);
			this.filter.scrollToSearchContainer();
		}
		onEpicSearchOpen(baseEvent) {
			this.tagSearcher.showEpicSearchDialog(this.input, baseEvent.getData());
		}
		onEpicSearchClose() {
			this.tagSearcher.closeEpicSearchDialog();
		}
		onFilterByEpic(baseEvent) {
			const epicId = baseEvent.getData();
			const currentValue = this.filter.getValueFromField({
				name: 'EPIC',
				value: ''
			});
			if (String(epicId) === String(currentValue)) {
				this.filter.setValueToField({
					name: 'EPIC',
					value: ''
				});
			} else {
				this.filter.setValueToField({
					name: 'EPIC',
					value: String(epicId)
				});
			}
			this.filter.scrollToSearchContainer();
		}
		onChangeShortView(baseEvent) {
			const isShortView = baseEvent.getData();
			this.changeShortView(isShortView);
		}
		onToggleActionPanel(baseEvent) {
			const item = baseEvent.getData();
			const entity = baseEvent.getTarget();
			if (this.actionPanel) {
				const repeatedClick = this.actionPanel.getItem().getId() === item.getId();
				this.destroyActionPanel();
				if (repeatedClick || entity.hasItemInGroupMode(item)) {
					this.deactivateGroupMode(entity, item);
					return;
				}
			}
			this.activateGroupMode(entity, item);
			this.showActionPanel(entity, item);
			if (this.searchItems.isActive()) {
				this.searchItems.updateCurrentIndexByItem(item);
			}
		}
		onShowLinked(baseEvent) {
			const baseItem = baseEvent.getData();
			if (this.searchItems.isActive()) {
				this.searchItems.stop();
				return;
			}
			this.destroyActionPanel();
			const containerPosition = main_core.Dom.getPosition(this.planBuilder.getScrumContainer());
			window.scrollTo({
				top: containerPosition.top,
				behavior: 'smooth'
			});
			const loader = new main_loader.Loader({
				target: this.planBuilder.getScrumContainer(),
				offset: {
					top: `${containerPosition.top / 2}px`
				}
			});
			loader.show();
			this.searchItems.deactivateGroupMode();
			this.searchItems.fadeOutAll();
			this.requestSender.showLinkedTasks({
				taskId: baseItem.getSourceId()
			}).then(response => {
				const itemsData = response.data;
				const items = new Set();
				const itemIds = [];
				itemsData.forEach(itemParams => {
					const item = Item.buildItem(itemParams);
					const entity = this.entityStorage.findEntityByEntityId(item.getEntityId());
					if (entity) {
						if (!entity.isCompleted() && !entity.hasItem(item)) {
							item.setShortView(entity.getShortView());
							entity.appendItemToList(item);
							entity.setItem(item);
						}
						items.add(item);
						itemIds.push(item.getId());
					}
				});
				this.itemDesigner.updateBorderColor(items);
				if (items.size > 0) {
					this.searchItems.start(baseItem, itemIds);
				} else {
					this.searchItems.fadeInAll();
				}
				loader.hide();
			}).catch(response => {
				this.requestSender.showErrorAlert(response);
				loader.hide();
			});
		}
		onActionPanelScroll() {
			if (this.actionPanel) {
				this.actionPanel.calculatePanelTopPosition();
			}
			if (this.diskManager) {
				this.diskManager.closeAttachmentMenu();
				this.diskManager = null;
			}
			if (this.itemMover.hasActionPanelDialog()) {
				this.itemMover.closeActionPanelDialogs();
			}
			if (this.tagSearcher.hasActionPanelDialog()) {
				this.tagSearcher.closeActionPanelDialogs();
			}
			if (this.responsibleDialog && this.responsibleDialog.isOpen()) {
				this.responsibleDialog.hide();
			}
		}
		onShowBlank(baseEvent) {
			const backlog = baseEvent.getTarget();
			setTimeout(() => {
				if (!backlog.isEmpty()) {
					return;
				}
				if (this.entityStorage.existsAtLeastOneItem()) {
					if (backlog.isExactSearchApplied()) {
						backlog.showEmptySearchStub();
					} else {
						backlog.showDropzone();
					}
				} else {
					backlog.showBlank();
				}
			}, 200);
		}
		onDeactivateGroupMode(baseEvent) {
			this.destroyActionPanel();
		}
		onShowDropZone(baseEvent) {
			const sprint = baseEvent.getTarget();
			setTimeout(() => {
				if (!sprint.isEmpty()) {
					return;
				}
				if (sprint.getNumberTasks() > 0 && sprint.isExactSearchApplied()) {
					sprint.showEmptySearchStub();
				} else {
					sprint.showDropzone();
				}
			}, 200);
		}
		onToggleVisibilityContent(baseEvent) {
			const sprint = baseEvent.getTarget();
			this.planBuilder.adjustSprintListWidth();
			if (!sprint.isCompleted()) {
				this.requestSender.saveSprintVisibility({
					sprintId: sprint.getId(),
					isHidden: sprint.isHideContent() ? 'Y' : 'N'
				});
			}
		}
		showInput(entity, bindNode) {
			return new Promise(resolve => {
				if (this.input.isExists()) {
					this.input.submit();
					if (this.input.hasEntity(entity)) {
						resolve();
					} else {
						this.input.subscribeOnce('unDisable', () => {
							this.input.removeYourself();
							this.renderInput(entity, bindNode);
							resolve();
						});
					}
				} else {
					this.renderInput(entity, bindNode);
					resolve();
				}
			});
		}
		renderInput(entity, bindNode) {
			this.input.setEntity(entity);
			if (main_core.Type.isElementNode(bindNode)) {
				this.input.setBindNode(bindNode);
				main_core.Dom.insertAfter(this.input.render(), bindNode);
			} else {
				this.input.cleanBindNode();
				if (entity.isEmpty()) {
					main_core.Dom.insertBefore(this.input.render(), entity.getLoaderNode());
				} else {
					main_core.Dom.insertBefore(this.input.render(), entity.getFirstItemNode(this.input));
				}
			}
			entity.adjustListItemsWidth();
			this.input.focus();
			this.scrollToInput();
			ui_analytics.sendData({
				tool: 'tasks',
				category: 'task_operations',
				type: 'quick_task',
				event: 'click_create',
				c_section: 'scrum',
				c_element: 'quick_button'
			});
		}
		scrollToInput() {
			const entity = this.input.getEntity();
			if (entity.isBacklog()) {
				const scrollContainer = entity.getListItemsNode();
				const topPosition = main_core.Dom.getRelativePosition(this.input.getInputNode(), scrollContainer).top;
				scrollContainer.scrollTo({
					top: scrollContainer.scrollTop + topPosition - 100,
					behavior: 'smooth'
				});
			} else {
				const sprintsContainer = this.planBuilder.getSprintsContainer();
				const topPosition = main_core.Dom.getRelativePosition(this.input.getInputNode(), sprintsContainer).top;
				sprintsContainer.scrollTo({
					top: sprintsContainer.scrollTop + topPosition - 100,
					behavior: 'smooth'
				});
			}
		}
		showActionPanel(entity, item) {
			const stopSearch = () => {
				if (this.searchItems.isActive()) {
					this.searchItems.stop();
				}
			};
			const isMultipleAction = entity.getGroupModeItems().size > 1;

			//todo maybe will cool move list actions to item scope
			this.actionPanel = new ActionPanel({
				entity,
				item,
				itemList: {
					task: {
						activity: true,
						disable: isMultipleAction,
						callback: () => {
							this.onShowTask(new main_core_events.BaseEvent({
								data: item
							}), 'context_menu');
							this.destroyActionPanel();
							entity.deactivateGroupMode();
						}
					},
					attachment: {
						activity: true,
						disable: !item.isEditAllowed(),
						callback: event => {
							if (this.diskManager) {
								this.diskManager.closeAttachmentMenu();
								this.diskManager = null;
								return;
							}
							const groupItems = entity.getGroupModeItems();
							this.diskManager = new DiskManager({
								targetElement: event.currentTarget
							});
							this.diskManager.subscribe('onFinish', baseEvent => {
								this.attachFilesToTask(entity, groupItems, baseEvent.getData());
							});
							this.diskManager.showAttachmentMenu(event.currentTarget);
							this.actionPanel.subscribe('onDestroy', () => {
								if (this.diskManager) {
									this.diskManager.closeAttachmentMenu();
									this.diskManager = null;
								}
							});
						}
					},
					dod: {
						activity: true,
						disable: isMultipleAction,
						callback: () => {
							this.showDod(item);
							this.destroyActionPanel();
							entity.deactivateGroupMode();
						}
					},
					move: {
						activity: true,
						disable: !item.isMovable(),
						callback: event => {
							this.moveItem(item, event.currentTarget);
							stopSearch();
						}
					},
					sprint: {
						activity: true,
						disable: false,
						multiple: this.entityStorage.getSprintsAvailableForFilling(entity).size > 1,
						callback: event => {
							this.moveToSprint(entity, item, event.currentTarget);
							stopSearch();
						}
					},
					backlog: {
						activity: true,
						disable: item.getEntityType() !== 'sprint',
						callback: () => {
							this.moveToBacklog(entity, item);
							this.destroyActionPanel();
							stopSearch();
						}
					},
					tags: {
						activity: true,
						disable: !item.isEditAllowed(),
						callback: event => {
							if (this.tagSearcher.hasActionPanelDialog()) {
								this.tagSearcher.closeActionPanelDialogs();
								return;
							}
							this.showTagSearcher(entity, item, event.currentTarget);
						}
					},
					epic: {
						activity: true,
						disable: !item.isEditAllowed(),
						callback: event => {
							if (this.tagSearcher.hasActionPanelDialog()) {
								this.tagSearcher.closeActionPanelDialogs();
								return;
							}
							this.showEpicSearcher(entity, item, event.currentTarget);
						}
					},
					decomposition: {
						activity: true,
						disable: isMultipleAction,
						callback: () => {
							if (entity.isBacklog()) {
								this.startBacklogDecomposition(entity, item);
							} else {
								this.startSprintDecomposition(entity, item);
							}
							this.destroyActionPanel();
							entity.deactivateGroupMode();
							stopSearch();
						}
					},
					remove: {
						activity: true,
						disable: !item.isRemoveAllowed(),
						callback: () => {
							ui_dialogs_messagebox.MessageBox.confirm(main_core.Loc.getMessage('TASKS_SCRUM_CONFIRM_TEXT_REMOVE_TASKS'), messageBox => {
								messageBox.close();
								this.removeGroupItems(entity).then(removed => {
									if (!removed) {
										return;
									}
									entity.getGroupModeItems().forEach(groupModeItem => {
										entity.removeItem(groupModeItem);
										this.deactivateGroupMode(entity, groupModeItem);
										groupModeItem.removeYourself();
										ui_analytics.sendData({
											tool: 'tasks',
											category: 'task_operations',
											type: 'task',
											event: 'task_delete',
											c_section: 'scrum',
											c_element: 'context_menu',
											p1: `taskId_${groupModeItem.getSourceId()}`
										});
									});
									this.updateEntityCounters(entity);
								});
							}, main_core.Loc.getMessage('TASKS_SCRUM_BUTTON_TEXT_REMOVE'));
							this.destroyActionPanel();
							stopSearch();
						}
					}
				}
			});
			this.actionPanel.subscribe('unSelect', () => {
				this.destroyActionPanel();
				entity.deactivateGroupMode();
			});
			this.actionPanel.show();
		}
		activateDraggable() {
			this.entityStorage.getAllItems().forEach(item => item.setDisableStatus(false));
		}
		deactivateDraggable() {
			this.entityStorage.getAllItems().forEach(item => item.setDisableStatus(true));
		}
		activateGroupMode(entity, item) {
			if (item) {
				entity.addItemToGroupMode(item);
			}
			if (entity.isGroupMode()) {
				return;
			}
			entity.activateGroupMode();
			if (entity.getId() !== this.entityStorage.getBacklog().getId()) {
				this.entityStorage.getBacklog().deactivateGroupMode();
			}
			this.entityStorage.getSprints().forEach(sprint => {
				if (entity.getId() !== sprint.getId()) {
					sprint.deactivateGroupMode();
				}
			});
		}
		deactivateGroupMode(entity, item) {
			if (item) {
				entity.removeItemFromGroupMode(item);
			}
			if (!entity.isGroupMode()) {
				return;
			}
			const groupModeItems = entity.getGroupModeItems();
			if (groupModeItems.size === 0) {
				entity.deactivateGroupMode();
			} else {
				this.showActionPanel(entity, Array.from(groupModeItems.values()).pop());
			}
		}
		createItem(input) {
			const epic = input.getEpic();
			const value = input.getInputNode().value.trim();
			const valueWithoutEpic = epic ? value.replace(new RegExp('@' + Tool.escapeRegex(epic.name) + '$', 'g'), '') : value;
			const item = Item.buildItem({
				id: '',
				name: valueWithoutEpic,
				groupId: this.getCurrentGroupId(),
				pathToTask: this.pathToTask
			});
			item.setShortView(this.isShortView);
			return item;
		}
		sendRequestToCreateTask(entity, item) {
			const requestData = {
				'tmpId': item.getId(),
				'name': item.getName().getValue(),
				'entityId': item.getEntityId(),
				'entityType': entity.getEntityType(),
				'epicId': item.getEpic().getValue().id,
				'sort': item.getSort(),
				'storyPoints': item.getStoryPoints().getValue().getPoints(),
				'parentTaskId': item.getParentTaskId(),
				'responsible': item.getResponsible().getValue(),
				'info': item.getInfo()
			};
			return this.requestSender.createTask(requestData);
		}
		fillItemAfterCreation(item, responseData) {
			item.setId(responseData.id);
			item.setEpic(responseData.epic);
			item.setTags(responseData.tags);
			item.setResponsible(responseData.responsible);
			item.setSourceId(responseData.sourceId);
			item.setAllowedActions(responseData.allowedActions);
			item.setName(item.getName().getValue());
		}
		updateEntityCounters(sourceEntity, endEntity) {
			const entities = new Map();
			entities.set(sourceEntity.getId(), sourceEntity);
			if (endEntity) {
				entities.set(endEntity.getId(), endEntity);
			}
			this.entityCounters.updateCounters(entities);
		}
		destroyActionPanel() {
			if (this.actionPanel) {
				this.actionPanel.destroy();
			}
			this.actionPanel = null;
		}
		getActionPanel() {
			return this.actionPanel;
		}
		attachFilesToTask(entity, groupItems, attachedIds) {
			if (attachedIds.length === 0) {
				return;
			}
			const itemIds = [];
			groupItems.forEach(item => {
				this.pullItem.addIdToSkipUpdating(item.getId());
				itemIds.push(item.getId());
			});
			this.requestSender.attachFilesToTask({
				itemIds: itemIds,
				attachedIds: attachedIds
			}).then(response => {
				groupItems.forEach(item => {
					item.setFiles(response.data.attachedFilesCount[item.getId()]);
				});
				this.destroyActionPanel();
				entity.deactivateGroupMode();
			}).catch(response => {
				this.requestSender.showErrorAlert(response);
			});
		}
		showDod(item) {
			this.sidePanel.showByExtension('Dod', {
				view: 'list',
				groupId: this.groupId,
				taskId: item.getSourceId(),
				skipNotifications: true
			});
		}
		moveItem(item, bindButton) {
			this.itemMover.moveItem(item, bindButton);
		}
		moveToSprint(entityFrom, item, bindButton) {
			this.itemMover.moveToAnotherEntity(entityFrom, item, null, bindButton);
			if (this.entityStorage.getSprintsAvailableForFilling(entityFrom).size <= 1) {
				this.destroyActionPanel();
			}
		}
		moveToBacklog(sprint, item) {
			this.itemMover.moveToAnotherEntity(sprint, item, this.entityStorage.getBacklog());
		}
		showTagSearcher(entity, item, bindButton) {
			this.tagSearcher.showTagsDialog(item, bindButton);
			this.tagSearcher.unsubscribeAll('attachTagToTask');
			this.tagSearcher.subscribe('attachTagToTask', innerBaseEvent => {
				const tag = innerBaseEvent.getData();
				const itemIds = [];
				entity.getGroupModeItems().forEach(groupModeItem => {
					this.pullItem.addIdToSkipUpdating(groupModeItem.getId());
					itemIds.push(groupModeItem.getId());
				});
				this.requestSender.updateTaskTags({
					itemIds: itemIds,
					tag: tag
				}).then(response => {
					entity.getGroupModeItems().forEach(groupModeItem => {
						const currentTags = groupModeItem.getTags().getValue();
						if (!currentTags.includes(tag)) {
							currentTags.push(tag);
						}
						groupModeItem.setTags(currentTags);
					});
				}).catch(response => {
					this.requestSender.showErrorAlert(response);
				});
			});
			this.tagSearcher.unsubscribeAll('deAttachTagToTask');
			this.tagSearcher.subscribe('deAttachTagToTask', innerBaseEvent => {
				const tag = innerBaseEvent.getData();
				const itemIds = [];
				entity.getGroupModeItems().forEach(groupModeItem => {
					this.pullItem.addIdToSkipUpdating(groupModeItem.getId());
					itemIds.push(groupModeItem.getId());
				});
				this.requestSender.removeTaskTags({
					itemIds: itemIds,
					tag: tag
				}).then(response => {
					entity.getGroupModeItems().forEach(groupModeItem => {
						const currentTags = groupModeItem.getTags().getValue();
						currentTags.splice(currentTags.indexOf(tag), 1);
						groupModeItem.setTags(currentTags);
					});
				}).catch(response => {
					this.requestSender.showErrorAlert(response);
				});
			});
			this.tagSearcher.unsubscribeAll('hideTagDialog');
			this.tagSearcher.subscribe('hideTagDialog', () => {
				if (!this.tagSearcher.isEpicDialogShown()) {
					this.destroyActionPanel();
					entity.deactivateGroupMode();
				}
			});
		}
		showEpicSearcher(entity, item, bindButton) {
			this.tagSearcher.showEpicDialog(item, bindButton);
			this.tagSearcher.unsubscribeAll('updateItemEpic');
			this.tagSearcher.subscribe('updateItemEpic', innerBaseEvent => {
				const itemIds = [];
				const epic = innerBaseEvent.getData();
				entity.getGroupModeItems().forEach(groupModeItem => {
					groupModeItem.setEpic(epic);
					itemIds.push(groupModeItem.getId());
					this.pullItem.addIdToSkipUpdating(groupModeItem.getId());
				});
				this.requestSender.updateItemEpics({
					itemIds: itemIds,
					epicId: epic ? epic.id : 0
				}).then(response => {}).catch(response => {
					this.requestSender.showErrorAlert(response);
				});
			});
			this.tagSearcher.unsubscribeAll('hideEpicDialog');
			this.tagSearcher.subscribe('hideEpicDialog', () => {
				this.destroyActionPanel();
				entity.deactivateGroupMode();
			});
		}
		removeGroupItems(entity) {
			const itemIds = [];
			let hasParentTask = false;
			entity.getGroupModeItems().forEach(groupModeItem => {
				itemIds.push(groupModeItem.getId());
				if (groupModeItem.isParentTask()) {
					hasParentTask = true;
				}
				this.pullItem.addIdToSkipRemoving(groupModeItem.getId());
			});
			return this.requestSender.removeItems({
				itemIds
			}).then(() => {
				this.requestPlacementResync(hasParentTask);
				return true;
			}, response => {
				this.requestPlacementResync();
				this.requestSender.showErrorAlert(response);
				return false;
			}).finally(() => {
				itemIds.forEach(itemId => this.pullItem.cleanSkipRemove(itemId));
			});
		}
		startBacklogDecomposition(entity, parentItem) {
			this.decomposition = new Decomposition({
				parentItem: parentItem
			});
			if (!parentItem.isLinkedTask()) {
				this.itemDesigner.getRandomColorForItemBorder().then(randomColor => {
					parentItem.setBorderColor(randomColor);
				});
			}
			this.showInput(entity, parentItem.getNode());
		}
		startSprintDecomposition(entity, parentItem) {
			this.decomposition = new Decomposition({
				parentItem: parentItem
			});
			parentItem.activateDecompositionMode();
			const renderInputAfterSubTasks = subTasks => {
				if (!subTasks.isShown()) {
					entity.appendNodeAfterItem(subTasks.render(), parentItem.getNode());
				}
				parentItem.showSubTasks();
				this.showInput(entity, subTasks.getNode());
			};
			if (parentItem.isParentTask()) {
				const subTasks = parentItem.getSubTasks();
				if (subTasks.isEmpty()) {
					this.requestSender.getSubTaskItems({
						entityId: entity.getId(),
						taskId: parentItem.getSourceId()
					}).then(response => {
						response.data.forEach(itemParams => {
							const subTaskItem = Item.buildItem(itemParams);
							entity.setItem(subTaskItem);
							subTasks.addTask(subTaskItem);
						});
						renderInputAfterSubTasks(subTasks);
					}).catch(response => {
						this.requestSender.showErrorAlert(response);
					});
				} else {
					renderInputAfterSubTasks(subTasks);
				}
			} else {
				this.showInput(entity, parentItem.getNode());
			}
		}
	}

	class CompleteSprintButton extends main_core_events.EventEmitter {
		constructor(params) {
			super();
			this.canCompleteSprint = params.canCompleteSprint;
			this.setEventNamespace('BX.Tasks.Scrum.ActiveSprintButton');
		}
		render() {
			const completeBtn = new ui_buttons.Button({
				text: main_core.Loc.getMessage('TASKS_SCRUM_ACTIONS_COMPLETE_SPRINT'),
				color: ui_buttons.ButtonColor.PRIMARY,
				size: ui_buttons.ButtonSize.EXTRA_SMALL,
				round: true,
				noCaps: true,
				onclick: () => {
					this.onCompleteSprintClick();
				}
			});
			if (!this.canCompleteSprint) {
				completeBtn.setStyle(ui_buttons.ButtonState.DISABLED);
			}
			return completeBtn.render();
		}
		onCompleteSprintClick() {
			if (this.canCompleteSprint) {
				this.emit('completeSprint');
			}
		}
	}

	class RobotButton extends main_core_events.EventEmitter {
		constructor(params) {
			super(params);
			this.sidePanel = params.sidePanel;
			this.isTaskLimitsExceeded = params.isTaskLimitsExceeded;
			this.canUseAutomation = params.canUseAutomation;
			this.isAutomationEnabled = params.isAutomationEnabled;
			this.groupId = params.groupId;
			this.setEventNamespace('BX.Tasks.Scrum.RobotButton');
		}
		render() {
			const robotBtn = new ui_buttons.Button({
				text: main_core.Loc.getMessage('TASKS_SCRUM_ROBOTS_BUTTON'),
				color: ui_buttons.ButtonColor.LIGHT_BORDER,
				size: ui_buttons.ButtonSize.EXTRA_SMALL,
				noCaps: true,
				round: true,
				dependOnTheme: true,
				onclick: () => {
					this.onClick();
				}
			});
			if (this.isShowLimitSidePanel()) {
				robotBtn.setIcon(ui_buttons.ButtonIcon.LOCK);
			} else {
				robotBtn.setIcon(ui_buttons.ButtonIcon.ROBOTS);
			}
			return robotBtn.render();
		}
		onClick() {
			if (this.isShowLimitSidePanel()) {
				const sliderCode = this.isAutomationEnabled ? 'limit_tasks_robots' : 'limit_crm_rules_off';
				BX.Runtime.loadExtension('ui.info-helper').then(({
					FeaturePromotersRegistry
				}) => {
					if (FeaturePromotersRegistry) {
						FeaturePromotersRegistry.getPromoter({
							code: sliderCode,
							bindElement: this.node
						}).show();
					} else {
						BX.UI.InfoHelper.show(sliderCode, {
							isLimit: true,
							limitAnalyticsLabels: {
								module: 'tasks',
								source: 'scrumActiveSprint'
							}
						});
					}
				});
			} else {
				const url = '/bitrix/components/bitrix/tasks.automation/slider.php?site_id=' + main_core.Loc.getMessage('SITE_ID') + '&project_id=' + this.groupId;
				this.sidePanel.openSidePanel(url, {
					customLeftBoundary: 0,
					cacheable: false,
					loader: 'bizproc:automation-loader'
				});
			}
		}
		isShowLimitSidePanel() {
			return !this.isAutomationEnabled || this.isTaskLimitsExceeded || !this.canUseAutomation;
		}
	}

	class ActiveSprint extends View {
		constructor(params) {
			super(params);
			this.setEventNamespace('BX.Tasks.Scrum.ActiveSprint');
			this.setParams(params);
			if (this.existActiveSprint()) {
				this.bindHandlers();
			}
			this.sidePanel = new SidePanel();
		}
		renderSprintStatsTo(container) {
			super.renderSprintStatsTo(container);

			// todo ger data for sprint from server
			if (this.sprint) {
				this.stats = StatsBuilder.build(this.sprint);
				this.stats.setKanbanStyle();
				main_core.Dom.append(this.stats.render(), container);
			}
		}
		renderRightElementsTo(container) {
			super.renderRightElementsTo(container);
			if (!this.existActiveSprint()) {
				return;
			}
			if (this.canCompleteSprint)
				// todo change to can robot access
				{
					const robotButton = new RobotButton({
						sidePanel: this.sidePanel,
						groupId: this.getCurrentGroupId(),
						isTaskLimitsExceeded: this.isTaskLimitsExceeded(),
						canUseAutomation: this.isCanUseAutomation(),
						isAutomationEnabled: this.checkIsAutomationEnabled()
					});
					main_core.Dom.append(robotButton.render(), container);
				}
			const completeSprintButton = new CompleteSprintButton({
				canCompleteSprint: this.canCompleteSprint
			});
			completeSprintButton.subscribe('completeSprint', this.onCompleteSprint.bind(this));
			main_core.Dom.append(completeSprintButton.render(), container);
		}
		setParams(params) {
			this.activeSprintId = parseInt(params.activeSprintId, 10);
			this.setTaskLimitsExceeded(params.taskLimitExceeded);
			this.setCanUseAutomation(params.canUseAutomation);
			this.setIsAutomationEnabled(params.isAutomationEnabled);
			this.views = params.views;
			this.canCompleteSprint = params.canCompleteSprint === 'Y';
		}
		setTaskLimitsExceeded(limitExceeded) {
			this.limitExceeded = limitExceeded === 'Y';
		}
		isTaskLimitsExceeded() {
			return this.limitExceeded;
		}
		setCanUseAutomation(canUseAutomation) {
			this.canUseAutomation = canUseAutomation === 'Y';
		}
		isCanUseAutomation() {
			return this.canUseAutomation;
		}
		setIsAutomationEnabled(isAutomationEnabled) {
			this.isAutomationEnabled = isAutomationEnabled === 'Y';
		}
		checkIsAutomationEnabled() {
			return this.isAutomationEnabled;
		}
		existActiveSprint() {
			return this.activeSprintId > 0;
		}
		bindHandlers() {
			// eslint-disable-next-line
			const kanbanManager = BX.Tasks.Scrum.Kanban;
			if (kanbanManager) {
				this.bindKanbanHandlers(kanbanManager.getKanban());
				kanbanManager.getKanbansGroupedByParentTasks().forEach(kanban => {
					this.bindKanbanHandlers(kanban);
				});
			}
		}
		bindKanbanHandlers(kanban) {
			main_core_events.EventEmitter.subscribe(kanban, 'Kanban.Grid:onItemMoved', event => {
				const [kanbanItem, targetColumn, beforeItem] = event.getCompatData();
				this.onItemMoved(kanbanItem, targetColumn, beforeItem);
			});
		}
		onCompleteSprint(baseEvent) {
			const sprintSidePanel = new SprintSidePanel({
				groupId: this.groupId,
				sidePanel: this.sidePanel,
				views: this.views
			});
			sprintSidePanel.showCompletionForm();
			sprintSidePanel.subscribe('showTask', innerBaseEvent => {
				const path = BX.Uri.addParam(this.getPathToTask().replace('#task_id#', innerBaseEvent.getData()), {
					ta_sec: 'scrum',
					ta_sub: 'kanban',
					ta_el: 'title_click'
				});
				this.sidePanel.openSidePanelByUrl(path);
			});
		}

		/**
		 * Hook on item moved.
		 * @param {BX.Tasks.Kanban.Item} kanbanItem
		 * @param {BX.Tasks.Kanban.Column} targetColumn
		 * @param {BX.Tasks.Kanban.Item} [beforeItem]
		 * @returns {void}
		 */
		onItemMoved(kanbanItem, targetColumn, beforeItem) {
			// todo update stats
			//this.stats.setSprintData(this.sprint);
		}
	}

	class BurnDownButton extends main_core_events.EventEmitter {
		constructor() {
			super();
			this.setEventNamespace('BX.Tasks.Scrum.BurnDownButton');
		}
		render() {
			const burnDownButton = new ui_buttons.Button({
				text: main_core.Loc.getMessage('TASKS_SCRUM_ACTIVE_SPRINT_BUTTON'),
				color: ui_buttons.ButtonColor.PRIMARY,
				size: ui_buttons.ButtonSize.EXTRA_SMALL,
				round: true,
				noCaps: true,
				onclick: () => {
					this.onClick();
				}
			});
			return burnDownButton.render();
		}
		onClick() {
			this.emit('click');
		}
	}

	class CompletedSprint extends View {
		constructor(params) {
			super(params);
			this.setEventNamespace('BX.Tasks.Scrum.CompletedSprint');
			this.setParams(params);
			this.bindHandlers();
		}
		renderRightElementsTo(container) {
			super.renderRightElementsTo(container);
			if (this.completedSprint === null) {
				return;
			}
			const burnDownButton = new BurnDownButton();
			burnDownButton.subscribe('click', this.onShowSprintBurnDownChart.bind(this));
			main_core.Dom.append(burnDownButton.render(), container);
		}
		setParams(params) {
			if (main_core.Type.isArray(params.completedSprint)) {
				this.completedSprint = null;
			} else {
				this.completedSprint = new Sprint(params.completedSprint);
			}
			this.sidePanel = new SidePanel();
			this.sprints = new Map();
			params.sprints.forEach(sprintData => {
				const sprint = Sprint.buildSprint(sprintData);
				this.sprints.set(sprint.getId(), sprint);
			});
			this.views = params.views;
			this.pathToBurnDown = params.pathToBurnDown;
		}
		bindHandlers() {
			main_core_events.EventEmitter.subscribe('onTasksGroupSelectorChange', this.onSprintSelectorChange.bind(this));
		}
		onSprintSelectorChange(event) {
			const [currentSprint] = event.getCompatData();
			this.completedSprint = this.findSprintBySprintId(currentSprint.sprintId);
		}
		onShowSprintBurnDownChart(baseEvent) {
			const sprintSidePanel = new SprintSidePanel({
				groupId: this.groupId,
				sidePanel: this.sidePanel,
				views: this.views,
				pathToBurnDown: this.pathToBurnDown
			});
			sprintSidePanel.showBurnDownChart(this.completedSprint);
		}
		findSprintBySprintId(sprintId) {
			return [...this.sprints.values()].find(sprint => sprint.getId() === parseInt(sprintId, 10));
		}
	}

	class Entry {
		constructor(params) {
			this.setParams(params);
			this.buildView(params);
			main_core_events.EventEmitter.emit('Tasks.Scrum.Entry:onInit', {
				id: params.groupId
			});
		}
		setParams(params) {
			this.setViewName(params.viewName);
			Culture.getInstance().setData(params.culture);
		}
		setViewName(viewName) {
			const availableViews = new Set(['plan', 'activeSprint', 'completedSprint']);
			if (!availableViews.has(viewName)) {
				throw Error('Invalid value to activeView parameter');
			}
			this.viewName = viewName;
		}
		getViewName() {
			return this.viewName;
		}
		setView(view) {
			if (view instanceof View) {
				this.view = view;
			} else {
				this.view = null;
			}
		}
		getView() {
			return this.view;
		}
		buildView(params) {
			const viewName = this.getViewName();
			if (viewName === 'plan') {
				this.setView(new Plan(params));
			} else if (viewName === 'activeSprint') {
				this.setView(new ActiveSprint(params));
			} else if (viewName === 'completedSprint') {
				this.setView(new CompletedSprint(params));
			}
		}
		renderTo(container) {
			const view = this.getView();
			if (view instanceof View) {
				this.getView().renderTo(container);
			}
		}
		renderTabsTo(container) {
			const view = this.getView();
			if (view instanceof View) {
				this.getView().renderTabsTo(container);
			}
		}
		renderSprintStatsTo(container) {
			const view = this.getView();
			if (view instanceof View) {
				this.getView().renderSprintStatsTo(container);
			}
		}
		renderRightElementsTo(container) {
			const view = this.getView();
			if (view instanceof View) {
				this.getView().renderRightElementsTo(container);
			}
		}
		setDisplayPriority(menuItem, value) {
			if (!main_core.Dom.hasClass(menuItem, 'menu-popup-item-accept')) {
				this.refreshIcons(menuItem);
				const view = this.getView();
				if (view instanceof View) {
					this.getView().setDisplayPriority(value);
				}
			}
		}
		refreshIcons(item) {
			item.parentElement.childNodes.forEach(element => {
				main_core.Dom.removeClass(element, 'menu-popup-item-accept');
			});
			main_core.Dom.addClass(item, 'menu-popup-item-accept');
		}
		changeShortView(isShortView) {
			const view = this.getView();
			if (view instanceof View) {
				this.getView().changeShortView(isShortView);
			}
		}
	}

	exports.Entry = Entry;

})(this.BX.Tasks.Scrum = this.BX.Tasks.Scrum || {}, BX, BX.Event, BX.UI.Dialogs, BX.UI, BX, BX.Main, BX.UI.Analytics, BX.UI.ShortView, BX.Disk, BX, BX.UI.EntitySelector, BX.UI, BX.UI.DragAndDrop, BX, BX.UI);
//# sourceMappingURL=script.js.map
