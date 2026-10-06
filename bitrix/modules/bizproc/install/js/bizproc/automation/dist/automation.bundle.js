/* eslint-disable */
this.BX = this.BX || {};
this.BX.Bizproc = this.BX.Bizproc || {};
(function (exports, main_core, main_core_events, bizproc_automation, ui_alerts, main_popup, ui_buttons, ui_hint, ui_notification, bizproc_condition, ui_entitySelector, bizproc_globals, ui_designTokens, ui_fonts_opensans, ui_tour) {
	'use strict';

	class TemplateScope {
		#documentType;
		#category;
		#status;
		constructor(rawTemplateScope) {
			this.#documentType = rawTemplateScope.DocumentType;
			this.#category = !main_core.Type.isNil(rawTemplateScope.Category.Id) ? rawTemplateScope.Category : null;
			this.#status = rawTemplateScope.Status;
		}
		getId() {
			if (this.hasCategory()) {
				return `${this.#documentType.Type}_${this.#category.Id}_${this.#status.Id}`;
			}
			return `${this.#documentType.Type}_${this.#status.Id}`;
		}
		getDocumentType() {
			return this.#documentType;
		}
		getDocumentCategory() {
			return this.#category;
		}
		getDocumentStatus() {
			return this.#status;
		}
		hasCategory() {
			return !main_core.Type.isNull(this.#category);
		}
	}

	class TemplatesScheme {
		#scheme;
		constructor(scheme) {
			this.#scheme = [];
			if (main_core.Type.isArray(scheme)) {
				scheme.forEach(rawScope => {
					const scope = new TemplateScope(rawScope);
					this.#scheme.push(scope);
				});
			}
		}
		getDocumentTypes() {
			const documentTypes = new Map();
			for (const scope of this.#scheme) {
				documentTypes.set(scope.getDocumentType().Type, scope.getDocumentType());
			}
			return Array.from(documentTypes.values());
		}
		getTypeCategories(documentType) {
			const documentCategories = new Map();
			for (const scope of this.#scheme) {
				if (scope.hasCategory() && scope.getDocumentType().Type === documentType.Type) {
					const category = scope.getDocumentCategory();
					documentCategories.set(category.Id, category);
				}
			}
			return Array.from(documentCategories.values());
		}
		getTypeStatuses(documentType, documentCategory) {
			const takenStatuses = new Set();
			if (main_core.Type.isNil(documentCategory)) {
				documentCategory = {
					Id: null
				};
			}
			const predicate = scope => {
				const shouldBeTaken = scope.getDocumentType().Type === documentType.Type && (scope.hasCategory() ? scope.getDocumentCategory().Id === documentCategory.Id : true) && !takenStatuses.has(scope.getDocumentStatus().Id);
				if (shouldBeTaken) {
					takenStatuses.add(scope.getDocumentStatus().Id);
				}
				return shouldBeTaken;
			};
			return Array.from(this.#filterBy(predicate)).map(scope => scope.getDocumentStatus());
		}
		#filterBy(predicate) {
			const generator = function* (scheme) {
				for (const scope of scheme) {
					if (predicate(scope)) {
						yield scope;
					}
				}
			};
			return generator(this.#scheme);
		}
	}

	class BaseContext extends main_core_events.EventEmitter {
		#values;
		constructor(defaultValue) {
			super();
			this.setEventNamespace('BX.Bizproc.Automation.Context');
			if (main_core.Type.isPlainObject(defaultValue)) {
				this.#values = defaultValue;
			}
		}
		clone() {
			return new BaseContext(main_core.clone(this.#values));
		}
		getValues() {
			return this.#values;
		}
		set(name, value) {
			const isValueChanged = this.has(name);
			this.#values[name] = value;
			this.emit(isValueChanged ? 'valueChanged' : 'valueAdded', {
				name,
				value
			});
			return this;
		}
		get(name) {
			return this.#values[name];
		}
		has(name) {
			return this.#values.hasOwnProperty(name);
		}
		subsribeValueChanges(name, listener) {
			this.subscribe('valueChanged', event => {
				if (event.data.name === name) {
					listener(event);
				}
			});
			return this;
		}
	}

	class Context extends BaseContext {
		constructor(props) {
			super(props);
		}
		clone() {
			// TODO - clone Tracker object when the corresponding method appears
			return new Context(main_core.Runtime.clone(this.getValues())).set('document', this.document.clone()).set('userOptions', this.userOptions?.clone());
		}
		get document() {
			return this.get('document');
		}
		get signedDocument() {
			return this.get('signedDocument') ?? '';
		}
		get ajaxUrl() {
			return this.get('ajaxUrl') ?? '';
		}
		get availableRobots() {
			const availableRobots = this.get('availableRobots');
			if (main_core.Type.isArray(availableRobots)) {
				return availableRobots;
			}
			return [];
		}
		get availableTriggers() {
			const availableTriggers = this.get('availableTriggers');
			if (main_core.Type.isArray(availableTriggers)) {
				return availableTriggers;
			}
			return [];
		}
		get canManage() {
			const canManage = this.get('canManage');
			return main_core.Type.isBoolean(canManage) && canManage;
		}
		get canEdit() {
			const canEdit = this.get('canEdit');
			return main_core.Type.isBoolean(canEdit) && canEdit;
		}
		get userOptions() {
			return this.get('userOptions');
		}
		get tracker() {
			return this.get('tracker');
		}
		set tracker(tracker) {
			this.set('tracker', tracker);
		}
		get bizprocEditorUrl() {
			return this.get('bizprocEditorUrl');
		}
		get constantsEditorUrl() {
			return this.get('constantsEditorUrl');
		}
		get parametersEditorUrl() {
			return this.get('parametersEditorUrl');
		}
		getAvailableTrigger(code) {
			return this.availableTriggers.find(trigger => trigger['CODE'] === code);
		}
		get automationGlobals() {
			return this.get('automationGlobals');
		}
	}

	class ViewMode {
		#mode;
		#properties;
		static #none = 0;
		static #view = 1;
		static #edit = 2;
		static #manage = 3;
		constructor(mode) {
			this.#mode = mode;
			this.#properties = {};
		}
		static none() {
			return new ViewMode(ViewMode.#none);
		}
		isNone() {
			return this.#mode === ViewMode.#none;
		}
		static view() {
			return new ViewMode(ViewMode.#view);
		}
		isView() {
			return this.#mode === ViewMode.#view;
		}
		static edit() {
			return new ViewMode(ViewMode.#edit);
		}
		isEdit() {
			return this.#mode === ViewMode.#edit;
		}
		static manage() {
			return new ViewMode(ViewMode.#manage);
		}
		isManage() {
			return this.#mode === ViewMode.#manage;
		}
		setProperty(name, value) {
			this.#properties[name] = value;
			return this;
		}
		getProperty(name, defaultValue = null) {
			if (this.#properties.hasOwnProperty(name)) {
				return this.#properties[name];
			}
			return defaultValue;
		}
		static fromRaw(mode) {
			if (ViewMode.getAll().includes(mode)) {
				return new ViewMode(mode);
			}
			return ViewMode.none();
		}
		intoRaw() {
			return this.#mode;
		}
		static getAll() {
			return [this.#none, this.#view, this.#edit, this.#manage];
		}
	}

	class Trigger extends main_core_events.EventEmitter {
		#data;
		#deleted;
		#viewMode;
		#condition;
		#node;
		#draggableItem;
		#droppableItem;
		#droppableColumn;
		#stub;
		constructor() {
			super();
			this.setEventNamespace('BX.Bizproc.Automation');
			this.draft = false;
			this.#data = {};
			this.#deleted = false;
			this.#viewMode = ViewMode.none();
			this.#condition = new bizproc_automation.ConditionGroup();
		}
		get node() {
			return this.#node;
		}
		get deleted() {
			return this.#deleted;
		}
		get documentStatus() {
			return this.#data['DOCUMENT_STATUS'] ?? '';
		}
		init(data, viewMode) {
			this.#data = main_core.clone(data);
			if (main_core.Type.isString(this.#data['ID'])) {
				const id = parseInt(this.#data['ID']);
				this.#data['ID'] = main_core.Type.isNumber(id) ? id : 0;
			}
			if (!main_core.Type.isPlainObject(this.#data['APPLY_RULES'])) {
				this.#data['APPLY_RULES'] = {};
			}
			if (this.#data['APPLY_RULES'].Condition) {
				this.#condition = new bizproc_automation.ConditionGroup(this.#data['APPLY_RULES'].Condition);
			} else {
				this.#condition = new bizproc_automation.ConditionGroup();
			}
			this.#viewMode = main_core.Type.isNil(viewMode) ? ViewMode.edit() : viewMode;
			this.#node = this.createNode();
		}
		reInit(data, viewMode) {
			const node = this.#node;
			this.#node = this.createNode();
			if (node.parentNode) {
				node.parentNode.replaceChild(this.#node, node);
			}
		}
		canEdit() {
			return bizproc_automation.getGlobalContext().canEdit;
		}
		getId() {
			return this.#data['ID'] || 0;
		}
		getStatusId() {
			return String(this.#data['DOCUMENT_STATUS'] || '');
		}
		getStatus() {
			return bizproc_automation.getGlobalContext().document.statusList.find(status => String(status.STATUS_ID) === this.getStatusId());
		}
		getCode() {
			return this.#data['CODE'] ?? '';
		}
		getName() {
			let triggerName = this.#data['NAME'];
			if (!triggerName) {
				const code = this.getCode();
				const trigger = bizproc_automation.getGlobalContext().availableTriggers.find(trigger => code === trigger['CODE']);
				triggerName = trigger?.NAME ?? code;
			}
			return triggerName;
		}
		setName(name) {
			if (main_core.Type.isString(name)) {
				this.#data['NAME'] = name;
			}
			return this;
		}
		getApplyRules() {
			return this.#data['APPLY_RULES'];
		}
		setApplyRules(rules) {
			this.#data['APPLY_RULES'] = rules;
			return this;
		}
		getLogStatus() {
			const log = bizproc_automation.getGlobalContext().tracker.getTriggerLog(this.getId());
			return log ? log.status : null;
		}
		getCondition() {
			return this.#condition;
		}
		setCondition(condition) {
			this.#condition = condition;
			return this;
		}
		isBackwardsAllowed() {
			return this.#data['APPLY_RULES']['ALLOW_BACKWARDS'] === 'Y';
		}
		setAllowBackwards(flag) {
			this.#data['APPLY_RULES']['ALLOW_BACKWARDS'] = flag ? 'Y' : 'N';
			return this;
		}
		getExecuteBy() {
			return this.#data['APPLY_RULES']['ExecuteBy'] || '';
		}
		setExecuteBy(userId) {
			this.#data['APPLY_RULES']['ExecuteBy'] = userId;
			return this;
		}
		enableManageMode(isActive) {
			this.#viewMode = ViewMode.manage().setProperty('isActive', isActive);

			// const checkboxNode = Tag.render`<div class="bizproc-automation-trigger-checkbox"></div>`
			const checkboxNode = main_core.Tag.render`<div class="ui-ctl ui-ctl-inline bizproc-automation-trigger-checkbox">
			<input class="ui-ctl-checkbox" type="checkbox" name="name">
		</div>`;
			const deleteButton = this.#node.querySelector('[data-role="btn-delete-trigger"]');
			main_core.Dom.hide(deleteButton);
			if (isActive && deleteButton) {
				main_core.Dom.append(checkboxNode, this.#node);
			} else {
				main_core.Dom.addClass(this.#node, '--locked-node');
			}
		}
		disableManageMode() {
			this.#viewMode = ViewMode.edit();
			const checkboxNode = this.#node.querySelector('.bizproc-automation-trigger-checkbox');
			const deleteButton = this.#node.querySelector('[data-role="btn-delete-trigger"]');
			this.#node.onclick = undefined;
			this.#viewMode = ViewMode.edit();
			this.unselectNode();
			main_core.Dom.removeClass(this.#node, '--locked-node');
			main_core.Dom.remove(checkboxNode);
			main_core.Dom.show(deleteButton);
		}
		selectNode() {
			if (this.#node) {
				main_core.Dom.addClass(this.#node, '--selected');
				const checkboxNode = this.#node.querySelector('input');
				if (checkboxNode) {
					checkboxNode.checked = true;
				}
				this.emit('Trigger:selected');
			}
		}
		unselectNode() {
			if (this.#node) {
				main_core.Dom.removeClass(this.#node, '--selected');
				const checkboxNode = this.#node.querySelector('input');
				if (checkboxNode) {
					checkboxNode.checked = false;
				}
				this.emit('Trigger:unselected');
			}
		}
		isSelected() {
			return this.#viewMode.isManage() && main_core.Dom.hasClass(this.node, '--selected');
		}
		createNode() {
			let wrapperClass = 'bizproc-automation-trigger-item-wrapper';
			if (this.#viewMode.isEdit() && this.canEdit()) {
				wrapperClass += ' bizproc-automation-trigger-item-wrapper-draggable';
			}
			let settingsBtn = null;
			let copyBtn = null;
			if (this.#viewMode.isEdit()) {
				settingsBtn = main_core.Dom.create("div", {
					attrs: {
						className: "bizproc-automation-trigger-item-wrapper-edit"
					},
					text: main_core.Loc.getMessage('BIZPROC_AUTOMATION_CMP_EDIT')
				});
				copyBtn = main_core.Dom.create('div', {
					attrs: {
						className: 'bizproc-automation-trigger-btn-copy'
					},
					text: main_core.Loc.getMessage('BIZPROC_AUTOMATION_CMP_COPY') || 'copy'
				});
				main_core.Event.bind(copyBtn, 'click', this.onCopyButtonClick.bind(this, copyBtn));
			}
			if (this.getLogStatus() === bizproc_automation.TrackingStatus.COMPLETED) {
				wrapperClass += ' bizproc-automation-trigger-item-wrapper-complete';
			} else if (bizproc_automation.getGlobalContext().document.getPreviousStatusIdList().includes(this.getStatusId())) {
				wrapperClass += ' bizproc-automation-trigger-item-wrapper-complete-light';
			}
			const triggerName = this.getName();
			let containerClass = 'bizproc-automation-trigger-item';
			if (this.getLogStatus() === bizproc_automation.TrackingStatus.COMPLETED) {
				containerClass += ' --complete';
			} else if (this.draft) {
				containerClass += ' --draft';
			}
			const div = main_core.Dom.create('DIV', {
				attrs: {
					'data-role': 'trigger-container',
					'className': containerClass,
					'data-type': 'item-trigger'
				},
				children: [main_core.Dom.create("div", {
					attrs: {
						className: wrapperClass
					},
					children: [main_core.Dom.create("div", {
						attrs: {
							className: "bizproc-automation-trigger-item-wrapper-text",
							title: triggerName
						},
						text: triggerName
					})]
				}), copyBtn, settingsBtn]
			});
			if (!this.#viewMode.isEdit()) {
				return div;
			}
			if (this.canEdit()) {
				this.registerItem(div);
			}
			const deleteBtn = main_core.Dom.create('SPAN', {
				attrs: {
					'data-role': 'btn-delete-trigger',
					'className': 'bizproc-automation-trigger-btn-delete'
				}
			});
			main_core.Event.bind(deleteBtn, 'click', this.onDeleteButtonClick.bind(this, deleteBtn));
			div.appendChild(deleteBtn);
			if (this.#viewMode.isEdit()) {
				main_core.Event.bind(div, 'click', this.onSettingsButtonClick.bind(this, div));
			}
			main_core.Event.bind(div, 'click', () => {
				if (this.#viewMode.isManage() && this.#viewMode.getProperty('isActive', false)) {
					if (!this.isSelected()) {
						this.selectNode();
					} else {
						this.unselectNode();
					}
				}
			});
			return div;
		}
		onSettingsButtonClick(button) {
			if (!this.canEdit()) {
				bizproc_automation.HelpHint.showNoPermissionsHint(button);
			} else if (!this.#viewMode.isManage()) {
				this.emit('Trigger:onSettingsOpen', {
					trigger: this
				});
			}
		}
		onCopyButtonClick(button, event) {
			event.stopPropagation();
			if (!this.canEdit()) {
				bizproc_automation.HelpHint.showNoPermissionsHint(button);
			} else if (!this.#viewMode.isManage()) {
				const trigger = new Trigger();
				const initData = this.serialize();
				delete initData['ID'];
				const clearRules = this.getSettingProperties().filter(property => property.Copyable === false).map(property => property.Id);
				clearRules.forEach(key => delete initData['APPLY_RULES'][key]);
				trigger.init(initData, this.#viewMode);
				this.emit('Trigger:copied', {
					trigger
				});
			}
		}
		onSearch(event) {
			if (!this.#node) {
				return;
			}
			const query = event.getData().queryString;
			const match = !query || this.getName().toLowerCase().indexOf(query) >= 0;
			main_core.Dom[match ? 'removeClass' : 'addClass'](this.#node, '--search-mismatch');
		}
		registerItem(object) {
			if (main_core.Type.isNil(object["__bxddid"])) {
				object.onbxdragstart = BX.proxy(this.dragStart, this);
				object.onbxdrag = BX.proxy(this.dragMove, this);
				object.onbxdragstop = BX.proxy(this.dragStop, this);
				object.onbxdraghover = BX.proxy(this.dragOver, this);
				jsDD.registerObject(object);
				jsDD.registerDest(object, 1);
			}
		}
		unregisterItem(object) {
			object.onbxdragstart = undefined;
			object.onbxdrag = undefined;
			object.onbxdragstop = undefined;
			object.onbxdraghover = undefined;
			jsDD.unregisterObject(object);
			jsDD.unregisterDest(object);
		}
		dragStart() {
			this.#draggableItem = BX.proxy_context;
			if (!this.#draggableItem) {
				jsDD.stopCurrentDrag();
				return;
			}
			if (!this.#stub) {
				const itemWidth = this.#draggableItem.offsetWidth;
				this.#stub = this.#draggableItem.cloneNode(true);
				this.#stub.style.position = "absolute";
				this.#stub.classList.add("bizproc-automation-trigger-item-drag");
				this.#stub.style.width = itemWidth + "px";
				document.body.appendChild(this.#stub);
			}
		}
		dragMove(x, y) {
			this.#stub.style.left = x + "px";
			this.#stub.style.top = y + "px";
		}
		dragOver(destination, x, y) {
			if (this.#droppableItem) {
				this.#droppableItem.classList.remove("bizproc-automation-trigger-item-pre");
			}
			if (this.#droppableColumn) {
				this.#droppableColumn.classList.remove("bizproc-automation-trigger-list-pre");
			}
			const type = destination.getAttribute("data-type");
			if (type === "item-trigger") {
				this.#droppableItem = destination;
				this.#droppableColumn = null;
			}
			if (type === "column-trigger") {
				this.#droppableColumn = destination.querySelector('[data-role="trigger-list"]');
				this.#droppableItem = null;
			}
			if (this.#droppableItem) {
				this.#droppableItem.classList.add("bizproc-automation-trigger-item-pre");
			}
			if (this.#droppableColumn) {
				this.#droppableColumn.classList.add("bizproc-automation-trigger-list-pre");
			}
		}
		dragStop(x, y, event) {
			event = event || window.event;
			let trigger = null;
			const isCopy = event && (event.ctrlKey || event.metaKey);
			const copyTrigger = (parent, statusId) => {
				const trigger = new Trigger();
				const initData = parent.serialize();
				delete initData['ID'];
				const clearRules = this.getSettingProperties().filter(property => property.Copyable === false).map(property => property.Id);
				clearRules.forEach(key => delete initData['APPLY_RULES'][key]);
				initData['DOCUMENT_STATUS'] = statusId;
				trigger.init(initData, parent.#viewMode);
				return trigger;
			};
			if (this.#draggableItem) {
				if (this.#droppableItem) {
					this.#droppableItem.classList.remove("bizproc-automation-trigger-item-pre");
					const thisColumn = this.#droppableItem.parentNode;
					if (!isCopy) {
						thisColumn.insertBefore(this.#draggableItem, this.#droppableItem);
						this.moveTo(thisColumn.getAttribute('data-status-id'));
					} else {
						trigger = copyTrigger(this, thisColumn.getAttribute('data-status-id'));
						thisColumn.insertBefore(trigger.#node, this.#droppableItem);
					}
				} else if (this.#droppableColumn) {
					this.#droppableColumn.classList.remove("bizproc-automation-trigger-list-pre");
					if (!isCopy) {
						this.#droppableColumn.appendChild(this.#draggableItem);
						this.moveTo(this.#droppableColumn.getAttribute('data-status-id'));
					} else {
						trigger = copyTrigger(this, this.#droppableColumn.getAttribute('data-status-id'));
						this.#droppableColumn.appendChild(trigger.#node);
					}
				}
				if (trigger) {
					this.emit('Trigger:copied', {
						trigger,
						skipInsert: true
					});
				}
			}
			this.#stub.parentNode.removeChild(this.#stub);
			this.#stub = null;
			this.#draggableItem = null;
			this.#droppableItem = null;
		}
		onDeleteButtonClick(button, event) {
			event.stopPropagation();
			if (!this.canEdit()) {
				bizproc_automation.HelpHint.showNoPermissionsHint(button);
			} else if (!this.#viewMode.isManage()) {
				main_core.Dom.remove(button.parentNode);
				this.emit('Trigger:deleted', {
					trigger: this
				});
			}
		}
		updateData(data) {
			if (main_core.Type.isPlainObject(data)) {
				this.#data = data;
			} else {
				throw 'Invalid data';
			}
		}
		markDeleted() {
			this.#deleted = true;
			return this;
		}
		serialize() {
			const data = main_core.clone(this.#data);
			if (this.#deleted) {
				data['DELETED'] = 'Y';
			}
			if (!main_core.Type.isPlainObject(data.APPLY_RULES)) {
				data.APPLY_RULES = {};
			}
			if (!this.#condition.items.length) {
				delete data.APPLY_RULES.Condition;
			} else {
				data.APPLY_RULES.Condition = this.#condition.serialize();
			}
			return data;
		}
		moveTo(statusId) {
			this.#data['DOCUMENT_STATUS'] = statusId;
			this.emit('Trigger:modified', {
				trigger: this
			});
		}
		getReturnProperties() {
			const triggerData = bizproc_automation.getGlobalContext().availableTriggers.find(trigger => trigger['CODE'] === this.getCode());
			return triggerData && main_core.Type.isArray(triggerData.RETURN) ? triggerData.RETURN : [];
		}
		getSettingProperties() {
			const triggerData = bizproc_automation.getGlobalContext().availableTriggers.find(trigger => trigger['CODE'] === this.getCode());
			if (triggerData.SETTINGS && triggerData.SETTINGS.Properties) {
				return triggerData.SETTINGS.Properties;
			}
			return [];
		}
	}

	class Helper {
		static #idIncrement = 0;
		static generateUniqueId() {
			++Helper.#idIncrement;
			return 'bizproc-automation-cmp-' + Helper.#idIncrement;
		}
		static toJsonString(data) {
			return JSON.stringify(data, function (i, v) {
				if (typeof v == 'boolean') {
					return v ? '1' : '0';
				}
				return v;
			});
		}
		static toJsonPayload(data) {
			return JSON.parse(Helper.toJsonString(data));
		}
		static getResponsibleUserExpression(fields) {
			if (main_core.Type.isArray(fields)) {
				for (const field of fields) {
					if (field['Id'] === 'ASSIGNED_BY_ID' || field['Id'] === 'RESPONSIBLE_ID') {
						return '{{' + field['Name'] + '}}';
					}
				}
			}
			return null;
		}
	}

	class Designer {
		static #instance;
		static getInstance() {
			if (!Designer.#instance) {
				Designer.#instance = new Designer();
			}
			return Designer.#instance;
		}
		setRobotSettingsDialog(dialog) {
			this.robotSettingsDialog = dialog;
			this.robot = dialog ? dialog.robot : null;
		}
		getRobotSettingsDialog() {
			return this.robotSettingsDialog;
		}
		setTriggerSettingsDialog(dialog) {
			this.triggerSettingsDialog = dialog;
		}
		getTriggerSettingsDialog() {
			return this.triggerSettingsDialog;
		}
	}

	class TriggerManager extends main_core_events.EventEmitter {
		#triggersContainerNode;
		#userOptions;
		#viewMode;
		#triggers;
		#triggersData;
		#columnNodes;
		#listNodes;
		#modified;
		#triggerEventsListeners = {};
		constructor(triggersContainerNode, params = {}) {
			super();
			this.setEventNamespace('BX.Bizproc.Automation');
			this.#triggersContainerNode = triggersContainerNode;
			this.#userOptions = params.userOptions;
		}
		async fetchTriggers() {
			const self = this;
			return new Promise((resolve, reject) => main_core.ajax({
				method: 'POST',
				dataType: 'json',
				url: bizproc_automation.getGlobalContext().ajaxUrl,
				data: {
					ajax_action: 'get_triggers',
					document_signed: bizproc_automation.getGlobalContext().signedDocument
				},
				onsuccess(response) {
					if (response.SUCCESS) {
						self.reInit({
							TRIGGERS: response.DATA.triggers
						}, self.#viewMode);
						resolve();
					} else {
						reject();
					}
				},
				onerror() {
					reject();
				}
			}));
		}
		init(data, viewMode) {
			if (!main_core.Type.isPlainObject(data)) {
				data = {};
			}
			this.#viewMode = viewMode.isNone() ? ViewMode.edit() : viewMode;
			this.#triggersData = main_core.Type.isArray(data.TRIGGERS) ? data.TRIGGERS : [];
			this.#columnNodes = document.querySelectorAll('[data-type="column-trigger"]');
			this.#listNodes = this.#triggersContainerNode.querySelectorAll('[data-role="trigger-list"]');
			this.#modified = false;
			this.initTriggers();
			this.markModified(false);

			// register DD
			this.#columnNodes.forEach(columnNode => jsDD.registerDest(columnNode, 10));
			top.BX.addCustomEvent(top, 'Rest:AppLayout:ApplicationInstall', this.onRestAppInstall.bind(this));
		}
		reInit(data, viewMode) {
			if (!main_core.Type.isPlainObject(data)) {
				data = {};
			}
			this.#viewMode = viewMode || ViewMode.none();
			this.#listNodes.forEach(node => main_core.Dom.clean(node));
			this.#triggersData = main_core.Type.isArray(data.TRIGGERS) ? data.TRIGGERS : [];
			this.initTriggers();
			this.markModified(false);
		}
		initTriggers() {
			this.#triggers = [];
			this.#triggersData.forEach(triggerData => {
				const trigger = new Trigger();
				trigger.init(triggerData, this.#viewMode);
				this.subscribeTriggerEvents(trigger);
				this.insertTriggerNode(trigger.getStatusId(), trigger.node);
				this.#triggers.push(trigger);
			});
		}
		subscribeTriggerEvents(trigger) {
			trigger.subscribe('Trigger:copied', event => {
				const trigger = event.data.trigger;
				this.#triggers.push(trigger);
				if (!event.data.skipInsert) {
					this.insertTriggerNode(trigger.getStatusId(), trigger.node);
				}
				this.subscribeTriggerEvents(trigger);
				this.markModified();
			});
			trigger.subscribe('Trigger:modified', () => this.markModified());
			trigger.subscribe('Trigger:onSettingsOpen', event => {
				this.openTriggerSettingsDialog(event.data.trigger);
			});
			trigger.subscribe('Trigger:deleted', event => this.deleteTrigger(event.data.trigger));
			Object.entries(this.#triggerEventsListeners).forEach(([eventName, listener]) => trigger.subscribe(eventName, listener));
		}
		onTriggerEvent(eventName, listener) {
			this.#triggerEventsListeners[eventName] = listener;
			this.#triggers.forEach(trigger => {
				trigger.subscribe(eventName, event => listener(event, trigger));
			});
		}
		getSelectedTriggers() {
			return this.#triggers.filter(trigger => trigger.isSelected());
		}
		onSearch(event) {
			this.#triggers.forEach(trigger => trigger.onSearch(event));
		}
		enableManageMode(status) {
			this.#viewMode = ViewMode.manage();
			document.querySelectorAll('[data-role="trigger-list"]').forEach(listNode => {
				if (listNode.dataset.statusId === status) {
					main_core.Dom.addClass(listNode, '--multiselect-mode');
				}
			});
			this.#triggers.forEach(trigger => {
				trigger.enableManageMode(trigger.documentStatus === status);
			});
		}
		disableManageMode() {
			this.#viewMode = ViewMode.edit();
			document.querySelectorAll('[data-role="trigger-list"]').forEach(listNode => {
				main_core.Dom.removeClass(listNode, '--multiselect-mode');
			});
			this.#triggers.forEach(trigger => trigger.disableManageMode());
		}
		addTrigger(triggerData, callback) {
			const trigger = new Trigger();
			trigger.draft = true;
			trigger.init(triggerData, this.#viewMode);
			this.subscribeTriggerEvents(trigger);
			if (callback) {
				callback.call(this, trigger);
			}
			this.emit('TriggerManager:trigger:add', {
				trigger
			});
		}
		deleteTrigger(trigger, callback) {
			if (trigger.getId() > 0) {
				trigger.markDeleted();
			} else {
				for (let i = 0; i < this.#triggers.length; ++i) {
					if (this.#triggers[i] === trigger) {
						this.#triggers.splice(i, 1);
					}
				}
			}
			if (callback) {
				callback(trigger);
			}
			this.emit('TriggerManager:trigger:delete', {
				trigger
			});
			this.markModified();
		}
		enableDragAndDrop() {
			this.#triggers.forEach(trigger => trigger.registerItem(trigger.node));
			this.#triggersContainerNode.querySelectorAll('.bizproc-automation-trigger-item-wrapper').forEach(node => {
				main_core.Dom.addClass(node, 'bizproc-automation-trigger-item-wrapper-draggable');
			});
		}
		disableDragAndDrop() {
			this.#triggers.forEach(trigger => trigger.unregisterItem(trigger.node));
			this.#triggersContainerNode.querySelectorAll('.bizproc-automation-trigger-item-wrapper').forEach(node => {
				main_core.Dom.removeClass(node, 'bizproc-automation-trigger-item-wrapper-draggable');
			});
		}
		insertTrigger(trigger) {
			this.#triggers.push(trigger);
			this.markModified(true);
		}
		insertTriggerNode(documentStatus, triggerNode) {
			const listNode = this.#triggersContainerNode.querySelector(`[data-role="trigger-list"][data-status-id="${documentStatus}"]`);
			if (listNode) {
				main_core.Dom.append(triggerNode, listNode);
			}
		}
		serialize() {
			return this.#triggers.map(trigger => trigger.serialize());
		}
		countAllTriggers() {
			return this.#triggers.filter(trigger => !trigger.deleted).length;
		}
		findTriggerById(id) {
			return this.#triggers.find(trigger => trigger.getId() === id);
		}
		findTriggersByDocumentStatus(statusId) {
			return this.#triggers.filter(trigger => trigger.getStatusId() === statusId);
		}
		getTriggerName(code) {
			return bizproc_automation.getGlobalContext().availableTriggers.find(trigger => code === trigger.CODE)?.NAME ?? code;
		}
		getAvailableTrigger(code) {
			const availableTriggers = bizproc_automation.getGlobalContext().availableTriggers;
			for (const availableTrigger of availableTriggers) {
				if (code === availableTrigger.CODE) {
					return availableTrigger;
				}
			}
			return null;
		}
		canEdit() {
			return bizproc_automation.getGlobalContext().canEdit;
		}
		canSetExecuteBy() {
			return bizproc_automation.getGlobalContext().get('TRIGGER_CAN_SET_EXECUTE_BY') ?? false;
		}
		needSave() {
			return this.#modified;
		}
		markModified(modified) {
			this.#modified = modified !== false;
			if (this.#modified) {
				this.emit('TriggerManager:dataModified');
			}
		}
		openTriggerSettingsDialog(trigger, context) {
			if (Designer.getInstance().getTriggerSettingsDialog()) {
				if (context && context.changeTrigger) {
					Designer.getInstance().getTriggerSettingsDialog().popup.close();
				} else {
					return;
				}
			}
			const formName = 'bizproc_automation_trigger_dialog';
			const title = this.getTriggerName(trigger.getCode());
			const form = main_core.Tag.render`
			<form name="${formName}" style="min-width: 540px;">
				${this.renderConditionSettings(trigger)}
				<span class="bizproc-automation-popup-settings-title bizproc-automation-popup-settings-title-autocomplete">
					${main_core.Loc.getMessage('BIZPROC_AUTOMATION_CMP_TRIGGER_NAME')}:
				</span>
				<div class="bizproc-automation-popup-settings">
					<input
						class="bizproc-automation-popup-input"
						type="text"
						name="name"
						value="${main_core.Text.encode(trigger.getName() || title)}"
					/>
				</div>
			</form>
		`;
			const triggerData = this.getAvailableTrigger(trigger.getCode());
			if (triggerData && triggerData.SETTINGS) {
				this.#renderTriggerProperties(trigger, triggerData.SETTINGS.Properties, form);
			}
			main_core.onCustomEvent(`BX.Bizproc.Automation.TriggerManager:onOpenSettingsDialog-${trigger.getCode()}`, [trigger, form]);
			if (this.canSetExecuteBy()) {
				this.renderExecuteByControl(trigger, form);
			}
			this.renderAllowBackwardsControl(trigger, form);
			main_core.Dom.addClass(this.#triggersContainerNode, 'automation-base-blocked');
			Designer.getInstance().setTriggerSettingsDialog({
				triggerManager: this,
				trigger,
				form
			});
			const popup = new main_popup.Popup({
				id: Helper.generateUniqueId(),
				bindElement: null,
				content: form,
				closeByEsc: true,
				buttons: [new ui_buttons.SaveButton({
					onclick: () => {
						const formData = main_core.ajax.prepareForm(form);
						trigger.setName(formData.data.name);
						if (triggerData.SETTINGS) {
							this.#setTriggerProperties(trigger, triggerData.SETTINGS.Properties, form);
						}
						main_core.onCustomEvent(`BX.Bizproc.Automation.TriggerManager:onSaveSettings-${trigger.getCode()}`, [trigger, formData]);
						this.setConditionSettingsFromForm(formData.data, trigger);
						trigger.setAllowBackwards(formData.data.allow_backwards === 'Y');
						if (this.canSetExecuteBy()) {
							trigger.setExecuteBy(formData.data.execute_by);
						}

						// analytics
						main_core.ajax.runAction('bizproc.analytics.push', {
							analyticsLabel: `automation_trigger${trigger.draft ? '_draft' : ''}_save_${trigger.getCode().toLowerCase()}`
						});
						delete trigger.draft;
						trigger.reInit();
						this.markModified();
						popup.close();
					}
				}), new ui_buttons.CancelButton({
					onclick: () => {
						popup.close();
					}
				})],
				width: 590,
				contentPadding: 12,
				closeIcon: true,
				events: {
					onPopupClose: () => {
						Designer.getInstance().setTriggerSettingsDialog(null);
						this.destroySettingsDialogControls();
						popup.destroy();
						main_core.Dom.removeClass(this.#triggersContainerNode, 'automation-base-blocked');
						this.emit('TriggerManager:onCloseTriggerSettingsDialog');
					}
				},
				titleBar: title,
				overlay: false,
				draggable: {
					restrict: false
				}
			});
			Designer.getInstance().getTriggerSettingsDialog().popup = popup;
			popup.show();

			// analytics
			main_core.ajax.runAction('bizproc.analytics.push', {
				analyticsLabel: `automation_trigger${trigger.draft ? '_draft' : ''}_settings_${trigger.getCode().toLowerCase()}`
			});
		}
		#renderTriggerProperties(trigger, properties, form) {
			properties.forEach(property => {
				const value = trigger.getApplyRules()[property.Id];
				if (property.Type === '@condition-group-selector') {
					this.#renderConditionGroupSelector(property, value, form);
					return;
				}
				if (property.Type === '@webhook-code') {
					this.#renderWebhookCodeProperty(property, value, form);
					return;
				}
				if (property.Type === '@field-selector') {
					this.#renderFieldSelectorProperty(property, value, form);
					return;
				}
				const toRenderProperty = {
					AllowSelection: false,
					...property
				};
				if (toRenderProperty.Type === '@robot-select') {
					this.#prepareRobotSelectProperty(toRenderProperty);
				}
				main_core.Dom.append(main_core.Tag.render`
					<span 
						class="bizproc-automation-popup-settings-title bizproc-automation-popup-settings-title-top bizproc-automation-popup-settings-title-autocomplete"
					>${main_core.Text.encode(property.Name)}:</span>
				`, form);
				main_core.Dom.append(main_core.Tag.render`
					<div class="bizproc-automation-popup-settings">
						${BX.Bizproc.FieldType.renderControl([...bizproc_automation.getGlobalContext().document.getRawType(), bizproc_automation.getGlobalContext().document.getCategoryId()], toRenderProperty, property.Id, value || '')}
					</div>
				`, form);
			});
		}
		#prepareRobotSelectProperty(property) {
			const cmp = Designer.getInstance().component;
			property.Options = [];
			const filter = property.Settings.Filter;
			const check = robot => {
				for (const field in filter) {
					if (robot.data[field] !== filter[field]) {
						return false;
					}
				}
				return true;
			};
			cmp.templateManager.templates.forEach(template => {
				template.robots.forEach(robot => {
					if (check(robot)) {
						property.Options.push({
							value: robot.getId(),
							name: robot.getProperty(property.Settings.OptionNameProperty)
						});
					}
				});
			});
			delete property.Settings;
			property.Type = 'select';
		}
		#setTriggerProperties(trigger, properties, form) {
			const values = {};
			properties.forEach(property => {
				if (property.Type === '@condition-group-selector') {
					values[property.Id] = this.#setConditionGroupValue(property, form);
					return;
				}
				const formData = BX.ajax.prepareForm(form);
				values[property.Id] = formData.data[property.Id];
			});
			trigger.setApplyRules(values);
		}
		renderConditionSettings(trigger) {
			const conditionGroup = trigger.getCondition().clone();
			this.conditionSelector = new bizproc_automation.ConditionGroupSelector(conditionGroup, {
				fields: bizproc_automation.getGlobalContext().document.getFields(),
				showValuesSelector: false,
				caption: {
					head: main_core.Loc.getMessage('BIZPROC_JS_AUTOMATION_ROBOT_CONDITION_TITLE')
				},
				isExpanded: this.#userOptions && this.#userOptions.get('defaults', 'isConditionGroupExpanded', 'N') === 'Y'
			});
			if (this.#userOptions) {
				this.conditionSelector.subscribe('onToggleGroupViewClick', event => {
					const data = event.getData();
					this.#userOptions.set('defaults', 'isConditionGroupExpanded', data.isExpanded ? 'Y' : 'N');
				});
			}
			return this.conditionSelector.createNode();
		}
		#renderConditionGroupSelector(property, value, form) {
			const selector = new bizproc_automation.ConditionGroupSelector(new bizproc_automation.ConditionGroup(value), {
				fields: property.Settings.Fields,
				fieldPrefix: property.Id,
				showValuesSelector: false,
				caption: {
					head: property.Name
				}
			});
			main_core.Dom.append(selector.createNode(), form);
		}
		#setConditionGroupValue(property, form) {
			const formData = BX.ajax.prepareForm(form);
			const conditionGroup = bizproc_automation.ConditionGroup.createFromForm(formData.data, property.Id);
			return conditionGroup.serialize();
		}
		#renderWebhookCodeProperty(property, value, form) {
			if (!value) {
				value = main_core.Text.getRandom(5);
			}
			main_core.Dom.append(main_core.Tag.render`
				<span class="bizproc-automation-popup-settings-title bizproc-automation-popup-settings-title-autocomplete">
					${main_core.Text.encode(property.Name)}:
				</span>
			`, form);
			main_core.Dom.append(main_core.Tag.render`<input type="hidden" value="${main_core.Text.encode(value)}" name="code"/>`, form);
			const hookLinkTextarea = main_core.Tag.render`
			<textarea class="bizproc-automation-popup-textarea" placeholder="..." readonly="readonly" name="webhook_handler">
			</textarea>
		`;
			main_core.Event.bind(hookLinkTextarea, 'click', () => {
				this.select();
			});
			main_core.Dom.append(main_core.Tag.render`<div class="bizproc-automation-popup-settings">${hookLinkTextarea}</div>`, form);
			main_core.Dom.append(main_core.Tag.render`
				<span class="bizproc-automation-popup-settings-title bizproc-automation-popup-settings-title-autocomplete">
					${main_core.Loc.getMessage('BIZPROC_AUTOMATION_CMP_WEBHOOK_ID')}
				</span>
			`, form);
			if (property.Settings.Handler) {
				let url = window.location.protocol + '//' + window.location.host + property.Settings.Handler;
				url = main_core.Uri.addParam(url, {
					code: value
				});
				url = url.replace('{{DOCUMENT_TYPE}}', bizproc_automation.getGlobalContext().document.getRawType()[2]);
				url = url.replace('{{USER_ID}}', main_core.Loc.getMessage('USER_ID'));
				if (property.Settings.Password) {
					url = url.replace('{{PASSWORD}}', property.Settings.Password);
				}
				hookLinkTextarea.value = url;
			}
			if (!property.Settings.Password && property.Settings.PasswordLoader) {
				const myAlertText = main_core.Loc.getMessage('BIZPROC_AUTOMATION_WEBHOOK_PASSWORD_ALERT').replace('#A1#', '<a class="bizproc-automation-popup-settings-link ' + 'bizproc-automation-popup-settings-link-light" data-role="token-gen">').replace('#A2#', '</a>');
				const passwordAlert = new ui_alerts.Alert({
					color: ui_alerts.AlertColor.WARNING,
					icon: ui_alerts.AlertIcon.WARNING,
					text: myAlertText
				});
				main_core.Event.bind(passwordAlert.getTextContainer().querySelector('[data-role="token-gen"]'), 'click', () => {
					const loaderConfig = property.Settings.PasswordLoader;
					main_core.ajax.runComponentAction(loaderConfig.component, loaderConfig.action, {
						mode: loaderConfig.mode || undefined,
						data: {
							documentType: [...bizproc_automation.getGlobalContext().document.getRawType(), bizproc_automation.getGlobalContext().document.getCategoryId()]
						}
					}).then(response => {
						if (response.data.error) {
							window.alert(response.data.error);
						} else if (response.data.password) {
							property.Settings.Password = response.data.password;
							hookLinkTextarea.value = hookLinkTextarea.value.replace('{{PASSWORD}}', property.Settings.Password);
							passwordAlert.handleCloseBtnClick();
						}
					});
				});
				main_core.Dom.append(passwordAlert.getContainer(), form);
			}
		}
		#renderFieldSelectorProperty(property, value, form) {
			const menuId = `@field-selector${Math.random()}`;
			const fieldName = `${property.Id}[]`;
			const fieldsList = property.Settings.Fields;
			const renderFieldCheckbox = function (field, listNode) {
				const exists = listNode.querySelector(`[data-field="${field.Id}"]`);
				if (exists) {
					return;
				}
				main_core.Dom.append(main_core.Tag.render`
					<div class="bizproc-automation-popup-checkbox-item" data-field="${main_core.Text.encode(field.Id)}">
						<label class="bizproc-automation-popup-chk-label">
							<input
								class="bizproc-automation-popup-chk"
								type="checkbox"
								name="${main_core.Text.encode(fieldName)}"
								value="${main_core.Text.encode(field.Id)}"
								checked
							/>
							${main_core.Text.encode(field.Name)}
						</label>
					</div>
				`, listNode);
			};
			const fieldSelectorHandler = function (targetNode, listNode) {
				if (BX.Main.MenuManager.getMenuById(menuId)) {
					return BX.Main.MenuManager.getMenuById(menuId).show();
				}
				const menuItems = [];
				fieldsList.forEach(field => {
					menuItems.push({
						text: main_core.Text.encode(field.Name),
						field,
						onclick(event, item) {
							renderFieldCheckbox(item.field, listNode);
							this.popupWindow.close();
						}
					});
				});
				main_popup.MenuManager.show(menuId, targetNode, menuItems, {
					autoHide: true,
					offsetLeft: main_core.Dom.getPosition(this).width / 2,
					angle: {
						position: 'top',
						offset: 0
					},
					zIndex: 200,
					className: 'bizproc-automation-inline-selector-menu',
					events: {
						onPopupClose: popup => {
							popup.destroy();
						}
					}
				});
			};
			main_core.Dom.append(main_core.Tag.render`
				<span class="bizproc-automation-popup-settings-title bizproc-automation-popup-settings-title-autocomplete">
					${main_core.Text.encode(property.Name)}:
				</span>
			`, form);
			const fieldListNode = main_core.Tag.render`<div class="bizproc-automation-popup-checkbox"></div>`;
			main_core.Dom.append(fieldListNode, form);
			const fieldSelectorNode = main_core.Tag.render`
			<span class="bizproc-automation-popup-settings-link">${main_core.Text.encode(property.Settings.ChooseFieldLabel)}</span>
		`;
			main_core.Event.bind(fieldSelectorNode, 'click', function () {
				fieldSelectorHandler(this, fieldListNode);
			});
			main_core.Dom.append(main_core.Tag.render`
				<div class="bizproc-automation-popup-settings bizproc-automation-popup-settings-text">
					${fieldSelectorNode}
				</div>
			`, form);
			if (main_core.Type.isArray(value)) {
				value.forEach(field => {
					const foundField = fieldsList.find(fld => fld.Id === field);
					if (foundField) {
						renderFieldCheckbox(foundField, fieldListNode);
					}
				});
			}
		}
		renderExecuteByControl(trigger, form) {
			main_core.Dom.append(main_core.Tag.render`
				<span class="bizproc-automation-popup-settings-title bizproc-automation-popup-settings-title-top bizproc-automation-popup-settings-title-autocomplete">
					${main_core.Loc.getMessage('BIZPROC_AUTOMATION_CMP_TRIGGER_EXECUTE_BY')}:
				</span>
			`, form);
			const documentType = [...bizproc_automation.getGlobalContext().document.getRawType(), bizproc_automation.getGlobalContext().document.getCategoryId()];
			const property = {
				Type: 'user'
			};
			const value = trigger.draft ? Helper.getResponsibleUserExpression(bizproc_automation.getGlobalContext().document.getFields()) : trigger.getExecuteBy();
			main_core.Dom.append(main_core.Tag.render`
				<div class="bizproc-automation-popup-settings">
					${BX.Bizproc.FieldType.renderControl(documentType, property, 'execute_by', value)}
				</div>
			`, form);
		}
		renderAllowBackwardsControl(trigger, form) {
			main_core.Dom.append(main_core.Tag.render`
				<div class="bizproc-automation-popup-checkbox">
					<div class="bizproc-automation-popup-checkbox-item">
						<label class="bizproc-automation-popup-chk-label">
							<input
								class="bizproc-automation-popup-chk"
								type="checkbox"
								name="allow_backwards"
								value="Y"
								${trigger.isBackwardsAllowed() ? 'checked' : ''}
							/>
							${main_core.Loc.getMessage('BIZPROC_AUTOMATION_CMP_TRIGGER_ALLOW_REVERSE_1')}
						</label>
					</div>
				</div>
			`, form);
		}
		setConditionSettingsFromForm(formFields, trigger) {
			trigger.setCondition(bizproc_automation.ConditionGroup.createFromForm(formFields));
			return this;
		}
		onRestAppInstall(installed, eventResult) {
			eventResult.redirect = false;
			setTimeout(() => {
				main_core.ajax({
					method: 'POST',
					dataType: 'json',
					url: bizproc_automation.getGlobalContext().ajaxUrl,
					data: {
						ajax_action: 'get_available_triggers',
						document_signed: bizproc_automation.getGlobalContext().signedDocument
					},
					onsuccess(response) {
						if (main_core.Type.isArray(response.DATA)) {
							bizproc_automation.getGlobalContext().set('availableTriggers', response.DATA);
						}
					}
				});
			}, 1500);
		}
		initSettingsDialogControls(node) {
			if (!main_core.Type.isArray(this.settingsDialogControls)) {
				this.settingsDialogControls = [];
			}
			const controlNodes = node.querySelectorAll('[data-role]');
			for (const controlNode of controlNodes) {
				let control = null;
				const role = controlNode.getAttribute('data-role');
				if (role === 'user-selector') {
					control = BX.Bizproc.UserSelector.decorateNode(controlNode);
				} else if (role === bizproc_automation.SelectorManager.SELECTOR_ROLE_ENTITY) {
					control = bizproc_automation.SelectorManager.createSelectorByRole(role, {
						context: new bizproc_automation.SelectorContext({
							fields: bizproc_automation.getGlobalContext().document.getFields(),
							rootGroupTitle: bizproc_automation.getGlobalContext().document.title
						})
					});
					control.renderTo(controlNode);
				}
				BX.UI.Hint.init(controlNode);
				if (control) {
					this.settingsDialogControls.push(control);
				}
			}
		}
		destroySettingsDialogControls() {
			if (this.conditionSelector) {
				this.conditionSelector.destroy();
				this.conditionSelector = null;
			}
			if (main_core.Type.isArray(this.settingsDialogControls)) {
				for (let i = 0; i < this.settingsDialogControls.length; ++i) {
					if (main_core.Type.isFunction(this.settingsDialogControls[i].destroy)) {
						this.settingsDialogControls[i].destroy();
					}
				}
			}
			this.settingsDialogControls = null;
		}
		getListByDocumentStatus(statusId) {
			const result = [];
			this.#triggers.forEach(trigger => {
				if (trigger.getStatusId() === statusId) {
					result.push(trigger);
				}
			});
			return result;
		}
		getReturnProperties(statusId) {
			const result = [];
			const exists = {};
			const triggers = this.getListByDocumentStatus(statusId);
			triggers.forEach(trigger => {
				const props = trigger.deleted ? [] : trigger.getReturnProperties();
				if (props.length > 0) {
					props.forEach(property => {
						if (!exists[property.Id]) {
							result.push({
								Id: property.Id,
								ObjectId: 'Template',
								Name: property.Name,
								ObjectName: trigger.getName(),
								Type: property.Type,
								Expression: `{{~*:${property.Id}}}`,
								SystemExpression: `{=Template:${property.Id}}`,
								ObjectRealId: trigger.getId()
							});
							exists[property.Id] = true;
						}
					});
				}
			});
			return result;
		}
		getReturnProperty(statusId, propertyId) {
			const properties = this.getReturnProperties(statusId);
			for (const property of properties) {
				if (property.Id === propertyId) {
					return property;
				}
			}
			return null;
		}
	}

	class HelpHint {
		static bindAll(node) {
			node.querySelectorAll('[data-text]').forEach(element => HelpHint.bindToNode(element));
		}
		static bindToNode(node) {
			main_core.Event.bind(node, 'mouseover', this.showHint.bind(this, node));
			main_core.Event.bind(node, 'mouseout', this.hideHint.bind(this));
		}
		static isBindedToNode(node) {
			return !!this.popupHint?.bindElement?.isSameNode(node);
		}
		static showHint(node) {
			const rawText = node.getAttribute('data-text');
			if (!rawText) {
				return;
			}
			let text = main_core.Text.encode(rawText);
			text = BX.util.nl2br(text);
			if (!main_core.Type.isStringFilled(text)) {
				return;
			}
			this.hideHint();
			this.popupHint = new BX.PopupWindow('bizproc-automation-help-tip', node, {
				lightShadow: true,
				autoHide: false,
				darkMode: true,
				offsetLeft: 0,
				offsetTop: 2,
				bindOptions: {
					position: "top"
				},
				events: {
					onPopupClose() {
						this.destroy();
					}
				},
				content: main_core.Dom.create('div', {
					attrs: {
						style: 'padding-right: 5px; width: 250px;'
					},
					html: text
				})
			});
			this.popupHint.setAngle({
				offset: 32,
				position: 'bottom'
			});
			this.popupHint.show();
			return true;
		}
		static showNoPermissionsHint(node) {
			this.showAngleHint(node, main_core.Loc.getMessage('BIZPROC_AUTOMATION_RIGHTS_ERROR_1'));
		}
		static showAngleHint(node, text) {
			if (this.timeout) {
				clearTimeout(this.timeout);
			}
			this.popupHint = BX.UI.Hint.createInstance({
				popupParameters: {
					width: 334,
					height: 104,
					closeByEsc: true,
					autoHide: true,
					angle: {
						offset: main_core.Dom.getPosition(node).width / 2
					},
					bindOptions: {
						position: 'top'
					}
				}
			});
			this.popupHint.close = function () {
				this.hide();
			};
			this.popupHint.show(node, text);
			this.timeout = setTimeout(this.hideHint.bind(this), 5000);
		}
		static hideHint() {
			if (this.popupHint) {
				this.popupHint.close();
			}
			this.popupHint = null;
		}
	}

	class WorkflowStatus {
		static CREATED = 0;
		static RUNNING = 1;
		static COMPLETED = 2;
		static SUSPENDED = 3;
		static TERMINATED = 4;
	}

	class TrackingEntry {
		static UNKNOWN_ACTIVITY_TYPE = 0;
		static EXECUTE_ACTIVITY_TYPE = 1;
		static CLOSE_ACTIVITY_TYPE = 2;
		static CANCEL_ACTIVITY_TYPE = 3;
		static FAULT_ACTIVITY_TYPE = 4;
		static CUSTOM_ACTIVITY_TYPE = 5;
		static REPORT_ACTIVITY_TYPE = 6;
		static ATTACHED_ENTITY_TYPE = 7;
		static TRIGGER_ACTIVITY_TYPE = 8;
		static ERROR_ACTIVITY_TYPE = 9;
		static DEBUG_ACTIVITY_TYPE = 10;
		static DEBUG_AUTOMATION_TYPE = 11;
		static DEBUG_DESIGNER_TYPE = 12;
		static DEBUG_LINK_TYPE = 13;
		// A node the engine reached but did not run: switched off, or its condition was not met. The reason comes
		// in the note of the entry.
		static SKIP_ACTIVITY_TYPE = 14;
		#type;

		// TODO - convert string to Date

		#workflowStatus;
		get type() {
			return this.#type;
		}
		get workflowStatus() {
			return this.#workflowStatus;
		}
		set type(entryType) {
			if (TrackingEntry.getAllActivityTypes().includes(entryType)) {
				this.#type = entryType;
			}
		}
		set workflowStatus(entryWorkflowStatus) {
			if (TrackingEntry.getAllWorkflowStatuses().includes(entryWorkflowStatus)) {
				this.#workflowStatus = entryWorkflowStatus;
			}
		}
		isTriggerEntry() {
			return this.type === TrackingEntry.TRIGGER_ACTIVITY_TYPE;
		}
		isSkipEntry() {
			return this.type === TrackingEntry.SKIP_ACTIVITY_TYPE;
		}
		static getAllActivityTypes() {
			return [TrackingEntry.UNKNOWN_ACTIVITY_TYPE, TrackingEntry.EXECUTE_ACTIVITY_TYPE, TrackingEntry.CLOSE_ACTIVITY_TYPE, TrackingEntry.CANCEL_ACTIVITY_TYPE, TrackingEntry.FAULT_ACTIVITY_TYPE, TrackingEntry.CUSTOM_ACTIVITY_TYPE, TrackingEntry.REPORT_ACTIVITY_TYPE, TrackingEntry.ATTACHED_ENTITY_TYPE, TrackingEntry.TRIGGER_ACTIVITY_TYPE, TrackingEntry.ERROR_ACTIVITY_TYPE, TrackingEntry.DEBUG_ACTIVITY_TYPE, TrackingEntry.DEBUG_AUTOMATION_TYPE, TrackingEntry.DEBUG_DESIGNER_TYPE, TrackingEntry.DEBUG_LINK_TYPE, TrackingEntry.SKIP_ACTIVITY_TYPE];
		}
		static isKnownActivityType(typeId) {
			return TrackingEntry.getAllActivityTypes().includes(typeId);
		}
		static getAllWorkflowStatuses() {
			return [WorkflowStatus.CREATED, WorkflowStatus.RUNNING, WorkflowStatus.COMPLETED, WorkflowStatus.SUSPENDED, WorkflowStatus.TERMINATED];
		}
		static isKnownWorkflowStatus(statusId) {
			return TrackingEntry.getAllWorkflowStatuses().includes(statusId);
		}
	}

	class TrackingStatus {
		static WAITING = 0;
		static RUNNING = 1;
		static COMPLETED = 2;
		static AUTOCOMPLETED = 3;
		static SKIPPED = 4;
	}

	class RobotEntry {
		id = '';
		status = TrackingStatus.WAITING;
		// TODO - change string to Date when Date appear in TrackingEntry
		modified = undefined;
		notes = [];
		errors = [];
		skipReasons = [];
		#entryId = -1;
		workflowStatus = WorkflowStatus.CREATED;
		constructor(entries) {
			if (main_core.Type.isArray(entries)) {
				for (const entry of entries) {
					this.addEntry(entry);
				}
			}
		}
		addEntry(entry) {
			this.id = entry.name;
			if (this.#entryId < entry.id) {
				this.#entryId = entry.id;
				this.modified = entry.datetime;
				this.workflowStatus = entry.workflowStatus;
				if (entry.type === bizproc_automation.TrackingEntry.CLOSE_ACTIVITY_TYPE) {
					this.status = TrackingStatus.COMPLETED;
				} else if (entry.isSkipEntry()) {
					// The node was not run at all, so it is neither running nor completed.
					this.status = TrackingStatus.SKIPPED;
				} else {
					this.status = TrackingStatus.RUNNING;
				}
			}
			if (entry.type === bizproc_automation.TrackingEntry.ERROR_ACTIVITY_TYPE) {
				this.errors.push(entry.note);
			} else if (entry.type === bizproc_automation.TrackingEntry.CUSTOM_ACTIVITY_TYPE) {
				this.notes.push(entry.note);
			} else if (entry.isSkipEntry() && main_core.Type.isStringFilled(entry.note)) {
				this.skipReasons.push(entry.note);
			}
		}
	}

	class TriggerEntry {
		id = '';
		status = TrackingStatus.COMPLETED;
		// TODO - change string to Date when Date appear in TrackingEntry
		modified = undefined;
		constructor(entry) {
			if (entry.isTriggerEntry()) {
				this.id = entry.note;
				this.modified = entry.datetime;
			}
		}
	}

	class TrackingEntryBuilder {
		#defaultSettings = {
			id: TrackingEntry.UNKNOWN_ACTIVITY_TYPE,
			workflowId: '',
			type: TrackingEntry.EXECUTE_ACTIVITY_TYPE,
			name: '',
			title: '',
			datetime: '',
			note: '',
			workflowStatus: WorkflowStatus.CREATED
		};
		#entrySettings;
		constructor() {
			this.#entrySettings = this.#defaultSettings;
		}
		setLogEntry(logEntry) {
			this.#entrySettings = Object.assign({}, this.#defaultSettings);
			logEntry = Object.assign({}, logEntry);
			if (main_core.Type.isStringFilled(logEntry['ID'])) {
				logEntry['ID'] = parseInt(logEntry['ID']);
			}
			if (main_core.Type.isStringFilled(logEntry['TYPE'])) {
				logEntry['TYPE'] = parseInt(logEntry['TYPE']);
			}
			if (main_core.Type.isNumber(logEntry['ID'])) {
				this.#entrySettings.id = logEntry['ID'];
			}
			if (main_core.Type.isStringFilled(logEntry['WORKFLOW_ID'])) {
				this.#entrySettings.workflowId = logEntry['WORKFLOW_ID'];
			}
			if (main_core.Type.isNumber(logEntry['TYPE']) && TrackingEntry.isKnownActivityType(logEntry['TYPE'])) {
				this.#entrySettings.type = logEntry['TYPE'];
			}
			if (main_core.Type.isStringFilled(logEntry['MODIFIED'])) {
				this.#entrySettings.datetime = logEntry['MODIFIED'];
			}
			if (main_core.Type.isNumber(logEntry['WORKFLOW_STATUS']) && TrackingEntry.isKnownWorkflowStatus(logEntry['WORKFLOW_STATUS'])) {
				this.#entrySettings.workflowStatus = logEntry['WORKFLOW_STATUS'];
			}
			this.#entrySettings.name = String(logEntry['ACTION_NAME']);
			this.#entrySettings.title = String(logEntry['ACTION_TITLE']);
			this.#entrySettings.note = String(logEntry['ACTION_NOTE']);
			return this;
		}
		setStatus(status) {
			this.#entrySettings.status = status;
			return this;
		}
		build() {
			const entry = new TrackingEntry();
			entry.id = this.#entrySettings.id;
			entry.workflowId = this.#entrySettings.workflowId;
			entry.type = this.#entrySettings.type;
			entry.name = this.#entrySettings.name;
			entry.title = this.#entrySettings.title;
			entry.note = this.#entrySettings.note;
			entry.datetime = this.#entrySettings.datetime;
			entry.workflowStatus = this.#entrySettings.workflowStatus;
			return entry;
		}
	}

	class Tracker {
		#ajaxUrl;
		#document;
		#triggerLogs;
		#robotLogs;
		constructor(document, ajaxUrl) {
			this.#ajaxUrl = ajaxUrl;
			this.#document = document;
		}
		init(log) {
			this.#triggerLogs = {};
			this.#robotLogs = {};
			this.addLogs(log);
		}
		reInit(log) {
			this.init(log);
		}
		addLogs(log) {
			if (!main_core.Type.isPlainObject(log)) {
				log = {};
			}
			const logEntryBuilder = new TrackingEntryBuilder();
			for (const [statusId, entries] of Object.entries(log)) {
				if (!main_core.Type.isArray(entries)) {
					continue;
				}
				for (const rawEntry of entries) {
					const entry = logEntryBuilder.setLogEntry(rawEntry).build();
					if (entry.isTriggerEntry()) {
						this.addTriggerEntry(entry);
					} else {
						this.addRobotEntry(entry);
						const robotEntry = this.#robotLogs[entry.name];
						if (!main_core.Type.isNil(this.#document)) {
							const isRobotRunning = robotEntry.status === TrackingStatus.RUNNING;
							const isWorkflowCompleted = robotEntry.workflowStatus === WorkflowStatus.COMPLETED;
							const isCurrentStatus = this.#document.getCurrentStatusId() === statusId;
							const isRobotRunningAtAnotherStatus = isRobotRunning && !isCurrentStatus;
							const isRobotRunningAndCurrentWorkflowCompleted = isRobotRunning && isWorkflowCompleted && isCurrentStatus;
							if (isRobotRunningAtAnotherStatus || isRobotRunningAndCurrentWorkflowCompleted) {
								robotEntry.status = TrackingStatus.COMPLETED;
							}
						}
					}
				}
			}
		}
		addTriggerEntry(entry) {
			if (entry.isTriggerEntry()) {
				this.#triggerLogs[entry.note] = new TriggerEntry(entry);
			}
		}
		addRobotEntry(entry) {
			if (entry.isTriggerEntry()) {
				return;
			}
			if (!this.#robotLogs[entry.name]) {
				this.#robotLogs[entry.name] = new RobotEntry([entry]);
			} else {
				this.#robotLogs[entry.name].addEntry(entry);
			}
		}
		getRobotLog(id) {
			return this.#robotLogs[id] || null;
		}
		getTriggerLog(id) {
			return this.#triggerLogs[id] || null;
		}
		update(documentSigned) {
			return BX.ajax({
				method: 'POST',
				dataType: 'json',
				url: this.#ajaxUrl,
				data: {
					ajax_action: 'get_log',
					document_signed: documentSigned
				},
				onsuccess: response => {
					if (response.DATA && response.DATA.LOG) {
						this.reInit(response.DATA.LOG);
					}
				}
			});
		}
	}

	class Robot extends main_core_events.EventEmitter {
		SYSTEM_EXPRESSION_PATTERN = '\\{=\\s*(?<object>[a-z0-9_]+)\\s*\\:\\s*(?<field>[a-z0-9_\\.]+)(\\s*>\\s*(?<mod1>[a-z0-9_\\:]+)(\\s*,\\s*(?<mod2>[a-z0-9_]+))?)?\\s*\\}';
		#data;
		#document;
		#template;
		#tracker;
		#delay;
		#node;
		#condition;
		#isDraft;
		#isFrameMode;
		#viewMode;
		#customOnBeforeSaveRobotSettings = () => {};
		constructor(params) {
			super();
			this.setEventNamespace('BX.Bizproc.Automation');
			this.#document = params.document;
			if (!main_core.Type.isNil(params.template)) {
				this.#template = params.template;
			}
			this.#isFrameMode = params.isFrameMode;
			this.#viewMode = ViewMode.none();
			this.#tracker = params.tracker;
			this.#isDraft = false;
			this.#delay = new bizproc_condition.DelayInterval();
		}
		get node() {
			return this.#node;
		}
		get data() {
			return {
				...this.#data,
				Condition: this.#condition.serialize(),
				Delay: this.#delay.serialize()
			};
		}
		get draft() {
			return this.#isDraft;
		}
		set draft(draft) {
			this.#isDraft = draft;
		}
		get template() {
			return this.#template;
		}
		hasTemplate() {
			return !main_core.Type.isNil(this.#template);
		}
		getTemplate() {
			return this.#template;
		}
		getDocument() {
			return this.#document;
		}
		static generateName() {
			return `A${parseInt(Math.random() * 100_000, 10)}_${parseInt(Math.random() * 100_000, 10)}_${parseInt(Math.random() * 100_000, 10)}_${parseInt(Math.random() * 100_000, 10)}`;
		}
		clone() {
			const clonedRobot = new Robot({
				document: this.#document,
				template: this.#template,
				isFrameMode: this.#isFrameMode,
				tracker: this.#tracker
			});
			const robotData = {
				...main_core.Runtime.clone(this.#data),
				Name: Robot.generateName(),
				Delay: this.getDelayInterval().serialize(),
				Condition: this.getCondition().serialize()
			};
			clonedRobot.init(robotData, this.#viewMode);
			return clonedRobot;
		}
		isEqual(other) {
			return this.#data.Name === other.#data.Name;
		}
		init(data, viewMode) {
			if (main_core.Type.isPlainObject(data)) {
				this.#data = {
					...data
				};
			}
			if (!this.#data.Name) {
				this.#data.Name = Robot.generateName();
			}
			this.#data.Activated = main_core.Type.isNil(this.#data.Activated) ? true : main_core.Text.toBoolean(this.#data.Activated);
			this.#delay = new bizproc_condition.DelayInterval(this.#data.Delay);
			this.#condition = new bizproc_automation.ConditionGroup(this.#data.Condition);
			if (!this.#data.Condition) {
				this.#condition.type = bizproc_automation.ConditionGroup.CONDITION_TYPE.Mixed;
			}
			delete this.#data.Condition;
			delete this.#data.Delay;
			this.#viewMode = main_core.Type.isNil(viewMode) ? ViewMode.edit() : viewMode;
			if (!this.#viewMode.isNone()) {
				this.#node = this.createNode();
			}
		}
		reInit(data, viewMode) {
			if (main_core.Type.isNil(viewMode) && this.#viewMode.isNone()) {
				return;
			}
			const node = this.#node;
			this.#node = this.createNode();
			if (node.parentNode) {
				main_core.Dom.replace(node, this.#node);
			}
		}
		destroy() {
			main_core.Dom.remove(this.#node);
			this.emit('Robot:destroyed');
		}
		canEdit() {
			return this.#template.canEdit();
		}
		getProperties() {
			if (this.#data && main_core.Type.isPlainObject(this.#data.Properties)) {
				return this.#data.Properties;
			}
			return {};
		}
		getProperty(name) {
			return this.getProperties()[name] || null;
		}
		hasProperty(name) {
			return Object.hasOwn(this.getProperties(), name);
		}
		setProperty(name, value) {
			this.#data.Properties[name] = value;
			return this;
		}
		getId() {
			return this.#data.Name || null;
		}
		getLogStatus() {
			let status = TrackingStatus.WAITING;
			let log = this.#tracker.getRobotLog(this.getId());
			if (log) {
				status = log.status;
			} else if (this.#data.DelayName) {
				log = this.#tracker.getRobotLog(this.#data.DelayName);
				if (log && log.status === TrackingStatus.RUNNING) {
					status = TrackingStatus.RUNNING;
				}
			}
			return status;
		}
		getLogErrors() {
			let errors = [];
			const log = this.#tracker.getRobotLog(this.getId());
			if (log && log.errors) {
				errors = log.errors;
			}
			return errors;
		}
		getLogSkipReasons() {
			return this.#tracker.getRobotLog(this.getId())?.skipReasons ?? [];
		}
		getDelayNotes() {
			if (this.#data.DelayName) {
				const log = this.#tracker.getRobotLog(this.#data.DelayName);
				if (log && log.status === TrackingStatus.RUNNING) {
					return log.notes;
				}
			}
			return [];
		}
		selectNode() {
			if (this.#node) {
				main_core.Dom.addClass(this.#node, '--selected');
				const checkboxNode = this.#node.querySelector('input');
				if (checkboxNode) {
					checkboxNode.checked = true;
				}
				this.emit('Robot:selected');
			}
		}
		unselectNode() {
			if (this.#node) {
				main_core.Dom.removeClass(this.#node, '--selected');
				const checkboxNode = this.#node.querySelector('input');
				if (checkboxNode) {
					checkboxNode.checked = false;
				}
				this.emit('Robot:unselected');
			}
		}
		isSelected() {
			return this.#node && main_core.Dom.hasClass(this.#node, '--selected');
		}
		isActivated() {
			return main_core.Text.toBoolean(this.#data.Activated);
		}
		isInvalid() {
			return this.#data.viewData?.isInvalid === true;
		}
		setActivated(activated) {
			this.#data.Activated = main_core.Text.toBoolean(activated);
			this.emit(this.#data.Activated === true ? 'Robot:onAfterActivated' : 'Robot:onAfterDeactivated');
			return this;
		}
		enableManageMode(isActive) {
			this.#viewMode = ViewMode.manage().setProperty('isActive', isActive);
			if (!isActive) {
				main_core.Dom.addClass(this.#node, '--locked-node');
			}
			const deleteButton = this.#node.querySelector('.bizproc-automation-robot-btn-delete');
			main_core.Dom.hide(deleteButton);
			this.#node.onclick = () => {
				if (!this.#viewMode.isManage() || !this.#viewMode.getProperty('isActive', false)) {
					return;
				}
				if (!this.isSelected()) {
					this.selectNode();
				} else {
					this.unselectNode();
				}
			};
		}
		disableManageMode() {
			this.#viewMode = ViewMode.edit();
			this.unselectNode();
			main_core.Dom.removeClass(this.#node, '--locked-node');
			const deleteButton = this.#node.querySelector('.bizproc-automation-robot-btn-delete');
			main_core.Dom.show(deleteButton);
			this.#node.onclick = undefined;
		}
		createNode() {
			let wrapperClass = 'bizproc-automation-robot-container-wrapper';
			let containerClass = 'bizproc-automation-robot-container';
			if (this.#viewMode.isEdit() && this.canEdit() && this.#canEditRobot()) {
				wrapperClass += ' bizproc-automation-robot-container-wrapper-draggable';
			}
			if (this.isActivated() === false) {
				containerClass += ' --deactivated';
				wrapperClass += ' --deactivated';
			}
			if (this.isInvalid()) {
				containerClass += ' --invalid';
				wrapperClass += ' --invalid';
			}
			if (this.draft) {
				containerClass += ' --draft';
			}
			const targetLabel = main_core.Loc.getMessage('BIZPROC_AUTOMATION_CMP_TO');
			const targetNode = main_core.Tag.render`
			<a
				class="bizproc-automation-robot-settings-name ${this.#viewMode.isView() ? '--mode-view' : ''}"
				title="${main_core.Loc.getMessage('BIZPROC_AUTOMATION_CMP_AUTOMATICALLY')}"
			>${main_core.Loc.getMessage('BIZPROC_AUTOMATION_CMP_AUTOMATICALLY')}</a>
		`;
			if (main_core.Type.isPlainObject(this.#data.viewData) && this.#data.viewData.responsibleLabel) {
				let labelText = this.#data.viewData.responsibleLabel.replace('{=Document:ASSIGNED_BY_ID}', main_core.Loc.getMessage('BIZPROC_AUTOMATION_CMP_RESPONSIBLE')).replace('author', main_core.Loc.getMessage('BIZPROC_AUTOMATION_CMP_RESPONSIBLE')).replace(/\{=Constant\:Constant[0-9]+\}/, main_core.Loc.getMessage('BIZPROC_AUTOMATION_ASK_CONSTANT')).replace(/\{\{~&\:Constant[0-9]+\}\}/, main_core.Loc.getMessage('BIZPROC_AUTOMATION_ASK_CONSTANT')).replace(/\{=Template\:Parameter[0-9]+\}/, main_core.Loc.getMessage('BIZPROC_AUTOMATION_ASK_PARAMETER')).replace(/\{\{~&:\:Parameter[0-9]+\}\}/, main_core.Loc.getMessage('BIZPROC_AUTOMATION_ASK_PARAMETER'));
				if (labelText.includes('{=Document')) {
					this.#document.getFields().forEach(field => {
						labelText = labelText.replace(field.SystemExpression, field.Name);
					});
				}
				if (labelText.includes('{=A')) {
					this.#template.robots.forEach(robot => {
						robot.getReturnFieldsDescription().forEach(field => {
							if (field.Type === 'user') {
								labelText = labelText.replace(field.SystemExpression, `${robot.getTitle()}: ${field.Name}`);
							}
						});
					});
				}
				if (labelText.includes('{=GlobalVar:') && main_core.Type.isArrayFilled(this.#template.globalVariables)) {
					this.#template.globalVariables.forEach(variable => {
						labelText = labelText.replace(variable.SystemExpression, variable.Name);
					});
				}
				if (labelText.includes('{=GlobalConst:') && main_core.Type.isArrayFilled(this.#template.globalConstants)) {
					this.#template.globalConstants.forEach(constant => {
						labelText = labelText.replace(constant.SystemExpression, constant.Name);
					});
				}
				targetNode.textContent = labelText;
				targetNode.setAttribute('title', labelText);
				if (this.#data.viewData.responsibleUrl) {
					targetNode.href = this.#data.viewData.responsibleUrl;
					if (this.#isFrameMode) {
						targetNode.setAttribute('target', '_blank');
					}
				}
				if (this.#viewMode.isEdit() && parseInt(this.#data.viewData.responsibleId, 10) > 0) {
					targetNode.setAttribute('bx-tooltip-user-id', this.#data.viewData.responsibleId);
				}
			}
			let delayLabel = this.getDelayInterval().format(main_core.Loc.getMessage('BIZPROC_AUTOMATION_CMP_AT_ONCE'), this.#document.getFields());
			if (this.isExecuteAfterPrevious()) {
				delayLabel = delayLabel === main_core.Loc.getMessage('BIZPROC_AUTOMATION_CMP_AT_ONCE') ? '' : `${delayLabel}, `;
				delayLabel += main_core.Loc.getMessage('BIZPROC_AUTOMATION_CMP_AFTER_PREVIOUS');
			}
			if (this.getCondition().items.length > 0) {
				delayLabel += `, ${main_core.Loc.getMessage('BIZPROC_AUTOMATION_CMP_BY_CONDITION')}`;
			}
			const delayNode = main_core.Dom.create(this.#canEditRobot() ? 'a' : 'span', {
				attrs: {
					className: this.#canEditRobot() ? 'bizproc-automation-robot-link' : 'bizproc-automation-robot-text',
					title: delayLabel
				},
				text: delayLabel
			});
			const statusNode = main_core.Tag.render`<div class="bizproc-automation-robot-information"></div>`;
			this.subscribeOnce('Robot:destroyed', () => {
				if (HelpHint.isBindedToNode(statusNode)) {
					HelpHint.hideHint();
				}
			});
			switch (this.getLogStatus()) {
				case TrackingStatus.RUNNING:
					if (this.#document.getCurrentStatusId() === this.#template.getStatusId()) {
						statusNode.classList.add('--loader');
						const delayNotes = this.getDelayNotes();
						if (delayNotes.length) {
							statusNode.setAttribute('data-text', delayNotes.join('\n'));
							HelpHint.bindToNode(statusNode);
						}
					}
					break;
				case TrackingStatus.COMPLETED:
				case TrackingStatus.AUTOCOMPLETED:
					containerClass += ' --complete';
					statusNode.classList.add('--complete');
					break;
				case TrackingStatus.SKIPPED:
					{
						main_core.Dom.addClass(statusNode, '--skipped');
						const skipReasons = this.getLogSkipReasons();
						if (skipReasons.length > 0) {
							statusNode.setAttribute('data-text', skipReasons.join('\n'));
							HelpHint.bindToNode(statusNode);
						}
						break;
					}
			}
			const errors = this.getLogErrors();
			if (errors.length > 0) {
				main_core.Dom.addClass(statusNode, '--errors');
				statusNode.setAttribute('data-text', errors.join('\n'));
				HelpHint.bindToNode(statusNode);
			}
			let titleClassName = 'bizproc-automation-robot-title-text';
			if (this.#canEditRobot() && this.canEdit()) {
				titleClassName += ' bizproc-automation-robot-title-text-editable';
			}
			const {
				root: div,
				titleNode
			} = main_core.Tag.render`
			<div
				class="${containerClass}"
				data-role="robot-container"
				data-type="item-robot"
				data-id="${main_core.Text.encode(this.getId())}"
			>
				${this.#renderCheckbox()}
				${this.#renderDeactivatedInfoBlock()}
				${this.#renderInvalidInfoBlock()}
				<div class="${wrapperClass}">
					<div class="bizproc-automation-robot-deadline">${delayNode}</div>
					<div class="bizproc-automation-robot-title">
						<div ref="titleNode" class="${titleClassName}" title="${main_core.Text.encode(this.getTitle())}">
							${this.clipTitle(this.getTitle())}
						</div>
					</div>
					<div class="bizproc-automation-robot-settings">
						<div class="bizproc-automation-robot-settings-title">${targetLabel}:</div>
						${targetNode}
					</div>
					${statusNode}
				</div>
			</div>
		`;
			main_core.Event.bind(titleNode, 'click', event => {
				if (this.#canEditRobot() && this.canEdit() && !this.#viewMode.isManage()) {
					this.onTitleEditClick(event);
				}
			});
			if (this.canEdit() && this.#canEditRobot()) {
				this.registerItem(div);
			}
			if (this.#viewMode.isEdit()) {
				const deleteBtn = main_core.Tag.render`<span class="bizproc-automation-robot-btn-delete"></span>`;
				main_core.Event.bind(deleteBtn, 'click', this.onDeleteButtonClick.bind(this, deleteBtn));
				main_core.Dom.append(deleteBtn, div.lastChild);
				if (this.isInvalid()) {
					const deleteBottomButton = main_core.Tag.render`
					<div class="bizproc-automation-robot-btn-settings">
						${main_core.Loc.getMessage('BIZPROC_AUTOMATION_DELETE_BUTTON_TITLE')}
					</div>
				`;
					main_core.Event.bind(deleteBottomButton, 'click', this.onDeleteButtonClick.bind(this, deleteBottomButton));
					main_core.Dom.append(deleteBottomButton, div);
				} else {
					const actionsButton = main_core.Tag.render`
					<div class="bizproc-automation-robot-btn-copy">
						${main_core.Loc.getMessage('BIZPROC_AUTOMATION_ACTIONS_BUTTON_TEXT')}
					</div>
				`;
					main_core.Event.bind(actionsButton, 'click', this.#onActionsButtonClick.bind(this, actionsButton));
					main_core.Dom.append(actionsButton, div);
					const settingsBtn = main_core.Tag.render`
					<div class="bizproc-automation-robot-btn-settings">
						${main_core.Loc.getMessage('BIZPROC_AUTOMATION_CMP_EDIT')}
					</div>
				`;
					main_core.Event.bind(div, 'click', this.onSettingsButtonClick.bind(this, div));
					main_core.Dom.append(settingsBtn, div);
				}
			}
			return div;
		}
		#renderCheckbox() {
			if (this.isInvalid()) {
				return '';
			}
			return main_core.Tag.render`
			<div class="ui-ctl ui-ctl-inline bizproc-automation-robot-container-checkbox">
				<input class="ui-ctl-checkbox" type="checkbox" name="name"/>
			</div>
		`;
		}
		#canEditRobot() {
			return this.#viewMode.isEdit() && !this.isInvalid();
		}
		#renderDeactivatedInfoBlock() {
			if (this.#data.Activated === true) {
				return '';
			}
			return main_core.Tag.render`
			<div class="bizproc-automation-robot-deactivated">
				${main_core.Loc.getMessage('BIZPROC_AUTOMATION_DEACTIVATED_ROBOT_BLOCK_TITLE')}
			</div>
		`;
		}
		#renderInvalidInfoBlock() {
			if (!this.isInvalid()) {
				return '';
			}
			return main_core.Tag.render`
			<div class="bizproc-automation-robot-invalid">
				${main_core.Loc.getMessage('BIZPROC_AUTOMATION_INVALID_REST_ROBOT_BLOCK_TITLE')}
			</div>
		`;
		}
		onDeleteButtonClick(button, event) {
			event.stopPropagation();
			if (!this.canEdit()) {
				HelpHint.showNoPermissionsHint(button);
			} else if (!this.#viewMode.isManage()) {
				main_core.Dom.remove(this.#node);
				this.#template.deleteRobot(this);
			}
		}
		onSettingsButtonClick(button) {
			if (!this.canEdit()) {
				HelpHint.showNoPermissionsHint(button);
			} else if (!this.#viewMode.isManage()) {
				this.#template.openRobotSettingsDialog(this, this.#data.DialogContext ?? null);
			}
		}
		#onActionsButtonClick(button, event) {
			if (!this.canEdit()) {
				event.stopPropagation();
				HelpHint.showNoPermissionsHint(button);
				return;
			}
			if (!this.#viewMode.isManage()) {
				event.stopPropagation();
				const buttonText = this.#data.Activated ? main_core.Loc.getMessage('BIZPROC_AUTOMATION_ACTIONS_DEACTIVATE_BUTTON_TEXT') : main_core.Loc.getMessage('BIZPROC_AUTOMATION_ACTIONS_ACTIVATE_BUTTON_TEXT');
				const menu = new main_popup.Menu({
					bindElement: button,
					autoHide: true,
					angle: {
						offset: main_core.Dom.getPosition(button).width / 2 + 23
					},
					items: [{
						text: main_core.Loc.getMessage('BIZPROC_AUTOMATION_ACTIONS_COPY_BUTTON_TEXT'),
						title: main_core.Loc.getMessage('BIZPROC_AUTOMATION_ACTIONS_COPY_BUTTON_TEXT'),
						onclick: (e, menuItem) => {
							this.onCopyButtonClick(menuItem, e);
							menu.destroy();
						}
					}, {
						text: buttonText,
						title: buttonText,
						onclick: () => {
							this.#onDeactivateButtonClick();
							menu.destroy();
						}
					}]
				});
				menu.show();
			}
		}
		onCopyButtonClick(button, event) {
			event.stopPropagation();
			if (!this.canEdit()) {
				HelpHint.showNoPermissionsHint(button);
			} else if (!this.#viewMode.isManage()) {
				const copiedRobot = this.clone();
				const robotTitle = copiedRobot.getProperty('Title');
				if (!main_core.Type.isNil(robotTitle)) {
					const newTitle = robotTitle + ' ' + ' ' + main_core.Loc.getMessage('BIZPROC_AUTOMATION_CMP_COPY_CAPTION');
					copiedRobot.setProperty('Title', newTitle);
					copiedRobot.reInit();
				}
				Template.copyRobotTo(this.#template, copiedRobot, this.#template.getNextRobot(this));
			}
		}
		#onDeactivateButtonClick() {
			this.setActivated(!this.isActivated());
			this.reInit();
		}
		onTitleEditClick(e) {
			e.preventDefault();
			e.stopPropagation();
			const formName = 'bizproc_automation_robot_title_dialog';
			const form = main_core.Dom.create('form', {
				props: {
					name: formName
				},
				style: {
					"min-width": '540px'
				}
			});
			form.appendChild(main_core.Dom.create("span", {
				attrs: {
					className: "bizproc-automation-popup-settings-title bizproc-automation-popup-settings-title-autocomplete"
				},
				text: main_core.Loc.getMessage('BIZPROC_AUTOMATION_CMP_ROBOT_NAME') + ':'
			}));
			form.appendChild(main_core.Dom.create("div", {
				attrs: {
					className: "bizproc-automation-popup-settings"
				},
				children: [BX.create("input", {
					attrs: {
						className: 'bizproc-automation-popup-input',
						type: "text",
						name: "name",
						value: this.getTitle()
					}
				})]
			}));
			this.emit('Robot:title:editStart');
			const self = this;
			const popup = new BX.PopupWindow(bizproc_automation.Helper.generateUniqueId(), null, {
				titleBar: main_core.Loc.getMessage('BIZPROC_AUTOMATION_CMP_ROBOT_NAME'),
				content: form,
				closeIcon: true,
				offsetLeft: 0,
				offsetTop: 0,
				closeByEsc: true,
				draggable: {
					restrict: false
				},
				overlay: false,
				events: {
					onPopupClose(popup) {
						popup.destroy();
						self.emit('Robot:title:editCompleted');
					}
				},
				buttons: [new BX.PopupWindowButton({
					text: main_core.Loc.getMessage('JS_CORE_WINDOW_SAVE'),
					className: "popup-window-button-accept",
					events: {
						click() {
							const nameNode = form.elements.name;
							self.setProperty('Title', nameNode.value);
							self.reInit();
							self.#template.markModified();
							this.popupWindow.close();
						}
					}
				}), new BX.PopupWindowButtonLink({
					text: main_core.Loc.getMessage('JS_CORE_WINDOW_CANCEL'),
					className: "popup-window-button-link-cancel",
					events: {
						click() {
							this.popupWindow.close();
						}
					}
				})]
			});
			popup.show();
		}
		onSearch(event) {
			if (!this.#node) {
				return;
			}
			const query = event.getData().queryString;
			const match = !query || this.getTitle().toLowerCase().indexOf(query) >= 0;
			if (match) {
				main_core.Dom.removeClass(this.#node, '--search-mismatch');
			} else {
				main_core.Dom.addClass(this.#node, '--search-mismatch');
			}
		}
		clipTitle(fullTitle) {
			let title = main_core.Text.encode(fullTitle);
			const arrTitle = title.split(" ");
			const lastWord = "<span>" + arrTitle[arrTitle.length - 1] + "</span>";
			arrTitle.splice(arrTitle.length - 1);
			title = arrTitle.join(" ") + " " + lastWord;
			return title;
		}
		updateData(data) {
			if (main_core.Type.isPlainObject(data)) {
				this.#data = data;
				this.#data.Activated = !main_core.Type.isNil(this.#data.Activated) ? main_core.Text.toBoolean(this.#data.Activated) : true;
			} else {
				throw 'Invalid data';
			}
		}
		serialize() {
			const result = BX.clone(this.#data);
			delete result['viewData'];
			delete result['DialogContext'];
			result.Delay = this.#delay.serialize();
			result.Condition = this.#condition.serialize();
			result.Activated = result.Activated ? 'Y' : 'N';
			return result;
		}
		getDelayInterval() {
			return this.#delay;
		}
		setDelayInterval(delay) {
			this.#delay = delay;
			return this;
		}
		getCondition() {
			return this.#condition;
		}
		setCondition(condition) {
			this.#condition = condition;
			return this;
		}
		setExecuteAfterPrevious(flag) {
			this.#data.ExecuteAfterPrevious = flag ? 1 : 0;
			return this;
		}
		isExecuteAfterPrevious() {
			return this.#data.ExecuteAfterPrevious === 1 || this.#data.ExecuteAfterPrevious === '1';
		}
		registerItem(object) {
			if (main_core.Type.isNil(object["__bxddid"])) {
				object.onbxdragstart = BX.proxy(this.dragStart, this);
				object.onbxdrag = BX.proxy(this.dragMove, this);
				object.onbxdragstop = BX.proxy(this.dragStop, this);
				object.onbxdraghover = BX.proxy(this.dragOver, this);
				jsDD.registerObject(object);
				jsDD.registerDest(object, 1);
			}
		}
		unregisterItem(object) {
			object.onbxdragstart = undefined;
			object.onbxdrag = undefined;
			object.onbxdragstop = undefined;
			object.onbxdraghover = undefined;
			jsDD.unregisterObject(object);
			jsDD.unregisterDest(object);
		}
		dragStart() {
			this.draggableItem = BX.proxy_context;
			if (!this.draggableItem) {
				jsDD.stopCurrentDrag();
				return;
			}
			if (!this.stub) {
				const itemWidth = this.draggableItem.offsetWidth;
				this.stub = this.draggableItem.cloneNode(true);
				this.stub.style.position = "absolute";
				this.stub.classList.add("bizproc-automation-robot-container-drag");
				this.stub.style.width = itemWidth + "px";
				document.body.appendChild(this.stub);
			}
		}
		dragMove(x, y) {
			this.stub.style.left = x + "px";
			this.stub.style.top = y + "px";
		}
		dragOver(destination, x, y) {
			if (this.droppableItem) {
				this.droppableItem.classList.remove("bizproc-automation-robot-container-pre");
			}
			if (this.droppableColumn) {
				this.droppableColumn.classList.remove("bizproc-automation-robot-list-pre");
			}
			const type = destination.getAttribute("data-type");
			if (type === "item-robot") {
				this.droppableItem = destination;
				this.droppableColumn = null;
			}
			if (type === "column-robot") {
				this.droppableColumn = destination.querySelector('[data-role="robot-list"]');
				this.droppableItem = null;
			}
			if (this.droppableItem) {
				this.droppableItem.classList.add("bizproc-automation-robot-container-pre");
			}
			if (this.droppableColumn) {
				this.droppableColumn.classList.add("bizproc-automation-robot-list-pre");
			}
		}
		dragStop(x, y, event) {
			event = event || window.event;
			const isCopy = event && (event.ctrlKey || event.metaKey);
			if (this.draggableItem) {
				if (this.droppableItem) {
					this.droppableItem.classList.remove("bizproc-automation-robot-container-pre");
					this.emit('Robot:manage', {
						templateNode: this.droppableItem.parentNode,
						isCopy,
						droppableItem: this.droppableItem,
						robot: this
					});
				} else if (this.droppableColumn) {
					this.droppableColumn.classList.remove("bizproc-automation-robot-list-pre");
					this.emit('Robot:manage', {
						templateNode: this.droppableColumn,
						isCopy,
						robot: this
					});
				}
			}
			this.stub.parentNode.removeChild(this.stub);
			this.stub = null;
			this.draggableItem = null;
			this.droppableItem = null;
		}
		moveTo(template, beforeRobot) {
			main_core.Dom.remove(this.#node);
			this.#template.deleteRobot(this);
			this.#template = template;
			this.#template.insertRobot(this, beforeRobot);
			this.#node = this.createNode();
			this.#template.insertRobotNode(this.#node, beforeRobot ? beforeRobot.node : null);
		}
		copyTo(template, beforeRobot) {
			const robot = new Robot({
				document: this.#document,
				template,
				isFrameMode: this.#isFrameMode,
				tracker: this.#tracker
			});
			const robotData = this.serialize();
			delete robotData['Name'];
			delete robotData['DelayName'];
			robot.init(robotData, this.#viewMode);
			template.insertRobot(robot, beforeRobot);
			template.insertRobotNode(robot.node, beforeRobot ? beforeRobot.node : null);
			return robot;
		}
		getTitle() {
			return this.getProperty('Title') || this.getDescriptionTitle();
		}
		getDescriptionTitle() {
			let name = 'untitled';
			const description = this.template?.getRobotDescription(this.#data['Type']) ?? {};
			if (description['NAME']) {
				name = description['NAME'];
			}
			if (description['ROBOT_SETTINGS'] && description['ROBOT_SETTINGS']['TITLE']) {
				name = description['ROBOT_SETTINGS']['TITLE'];
			}
			return name;
		}
		hasTitle() {
			return this.getTitle() !== 'untitled';
		}
		hasReturnFields() {
			const description = this.template.getRobotDescription(this.#data['Type']);
			const props = this.#data['Properties'];
			if (!main_core.Type.isObject(description)) {
				return false;
			}
			const hasReturnProperties = () => main_core.Type.isObject(description['RETURN']) && main_core.Type.isArrayFilled(Object.values(description['RETURN']));
			const hasAdditionalResultProperties = () => main_core.Type.isArray(description['ADDITIONAL_RESULT']) && description['ADDITIONAL_RESULT'].some(addProperty => Object.values(props[addProperty] ?? []).length > 0);
			return hasReturnProperties() || hasAdditionalResultProperties();
		}
		getReturnFieldsDescription() {
			const fields = [];
			const description = this.template.getRobotDescription(this.#data['Type']);
			if (description && description['RETURN']) {
				for (const fieldId in description['RETURN']) {
					if (description['RETURN'].hasOwnProperty(fieldId)) {
						const field = description['RETURN'][fieldId];
						fields.push({
							Id: fieldId,
							ObjectId: this.getId(),
							ObjectName: this.getTitle(),
							Name: field['NAME'],
							Type: field['TYPE'],
							Options: field['OPTIONS'] || null,
							Expression: '{{~' + this.getId() + ':' + fieldId + ' # ' + this.getTitle() + ': ' + field['NAME'] + '}}',
							SystemExpression: '{=' + this.getId() + ':' + fieldId + '}'
						});
						if (!this.appendPropertyMods) {
							continue;
						}

						//generate printable version
						if (field['TYPE'] === 'user' || field['TYPE'] === 'bool' || field['TYPE'] === 'file') {
							const printableTag = field['TYPE'] === 'user' ? 'friendly' : 'printable';
							fields.push({
								Id: fieldId + '_printable',
								ObjectId: this.getId(),
								ObjectName: this.getTitle(),
								Name: field['NAME'] + ' ' + main_core.Loc.getMessage('BIZPROC_AUTOMATION_CMP_MOD_PRINTABLE_PREFIX'),
								Type: 'string',
								Expression: `{{~${this.getId()}:${fieldId} > ${printableTag} # ${this.getTitle()}: ${field['NAME']}}}`,
								SystemExpression: `{=${this.getId()}:${fieldId}>${printableTag}}`
							});
						}
					}
				}
			}
			if (description && main_core.Type.isArray(description['ADDITIONAL_RESULT'])) {
				const props = this.#data['Properties'];
				description['ADDITIONAL_RESULT'].forEach(addProperty => {
					if (props[addProperty]) {
						for (const fieldId in props[addProperty]) {
							if (props[addProperty].hasOwnProperty(fieldId)) {
								const field = props[addProperty][fieldId];
								fields.push({
									Id: fieldId,
									ObjectId: this.getId(),
									ObjectName: this.getTitle(),
									Name: field['Name'],
									Type: field['Type'],
									Options: field['Options'] || null,
									Expression: `{{~${this.getId()}:${fieldId} # ${this.getTitle()}: ${field['Name']}}}`,
									SystemExpression: '{=' + this.getId() + ':' + fieldId + '}'
								});

								//generate printable version
								if (field['Type'] === 'user' || field['Type'] === 'bool' || field['Type'] === 'file') {
									const printableTag = field['Type'] === 'user' ? 'friendly' : 'printable';
									const expression = `{{~${this.getId()}:${fieldId} > ${printableTag} # ${this.getTitle()}: ${field['Name']}}}`;
									fields.push({
										Id: fieldId + '_printable',
										ObjectId: this.getId(),
										ObjectName: this.getTitle(),
										Name: field['Name'] + ' ' + main_core.Loc.getMessage('BIZPROC_AUTOMATION_CMP_MOD_PRINTABLE_PREFIX'),
										Type: 'string',
										Expression: expression,
										SystemExpression: '{=' + this.getId() + ':' + fieldId + '>' + printableTag + '}'
									});
								}
							}
						}
					}
				});
			}
			return fields;
		}
		getReturnProperty(id) {
			const fields = this.getReturnFieldsDescription();
			for (let i = 0; i < fields.length; ++i) {
				if (fields[i]['Id'] === id) {
					return fields[i];
				}
			}
			return null;
		}
		collectUsages() {
			const properties = this.getProperties();
			const usages = {
				Document: new Set(),
				Constant: new Set(),
				Variable: new Set(),
				Parameter: new Set(),
				GlobalConstant: new Set(),
				GlobalVariable: new Set(),
				Activity: new Set()
			};
			Object.values(properties).forEach(property => this.collectExpressions(property, usages));
			const conditions = this.getCondition().serialize();
			conditions.items.forEach(item => this.collectParsedExpressions(item[0], usages));
			return usages;
		}
		collectExpressions(value, usages) {
			if (main_core.Type.isArray(value)) {
				value.forEach(v => this.collectExpressions(v, usages));
			} else if (main_core.Type.isPlainObject(value)) {
				Object.values(value).forEach(value => this.collectExpressions(value, usages));
			} else if (main_core.Type.isStringFilled(value)) {
				let found;
				const systemExpressionRegExp = new RegExp(this.SYSTEM_EXPRESSION_PATTERN, 'ig');
				while ((found = systemExpressionRegExp.exec(value)) !== null) {
					this.collectParsedExpressions(found.groups, usages);
				}
			}
		}
		collectParsedExpressions(parsedUsage, usages) {
			if (main_core.Type.isPlainObject(parsedUsage) && parsedUsage['object'] && parsedUsage['field']) {
				switch (parsedUsage['object']) {
					case 'Document':
						usages.Document.add(parsedUsage['field']);
						return;
					case 'Constant':
						usages.Constant.add(parsedUsage['field']);
						return;
					case 'Variable':
						usages.Variable.add(parsedUsage['field']);
						return;
					case 'Template':
						usages.Parameter.add(parsedUsage['field']);
						return;
					case 'GlobalConst':
						usages.GlobalConstant.add(parsedUsage['field']);
						return;
					case 'GlobalVar':
						usages.GlobalVariable.add(parsedUsage['field']);
						return;
				}
				const activityRegExp = new RegExp(/^A[_0-9]+$/, 'ig');
				if (activityRegExp.exec(parsedUsage['object'])) {
					usages.Activity.add([parsedUsage['object'], parsedUsage['field']]);
				}
			}
		}
		hasBrokenLink() {
			return this.getBrokenLinks().length > 0;
		}
		getBrokenLinks() {
			const usages = main_core.Runtime.clone(this.collectUsages());
			if (!this.template) {
				return [];
			}
			const objectsData = {
				Document: this.#document.getFields(),
				Constant: this.#template.getConstants(),
				Variable: this.#template.getVariables(),
				GlobalConstant: this.#template.globalConstants,
				GlobalVariable: this.#template.globalVariables,
				Parameter: this.#template.getParameters(),
				Activity: this.#template.getSerializedRobots()
			};
			const brokenLinks = [];
			for (const object in usages) {
				if (usages[object].size > 0) {
					const source = new Set();
					for (const key in objectsData[object]) {
						if (objectsData[object][key]['Id']) {
							source.add(objectsData[object][key]['Id']);
						} else if (objectsData[object][key]['Name']) {
							source.add(objectsData[object][key]['Name']);
						}
					}
					for (const value of usages[object].values()) {
						let searchInSource = value;
						let id = value;
						if (main_core.Type.isArray(searchInSource)) {
							searchInSource = value[0];
							id = value[1];
						}
						if (!source.has(searchInSource)) {
							if (object === 'Activity') {
								brokenLinks.push('{=' + searchInSource + ':' + id + '}');
							} else {
								let brokenLinkObject = object;
								if (brokenLinkObject === 'GlobalVariable') {
									brokenLinkObject = 'GlobalVar';
								}
								if (brokenLinkObject === 'GlobalConstant') {
									brokenLinkObject = 'GlobalConst';
								}
								if (brokenLinkObject === 'Parameter') {
									brokenLinkObject = 'Template';
								}
								brokenLinks.push('{=' + brokenLinkObject + ':' + searchInSource + '}');
							}
							continue;
						}
						if (object === 'Activity') {
							const robot = this.#template.getRobotById(searchInSource);
							if (!robot.getReturnProperty(id)) {
								brokenLinks.push('{=' + searchInSource + ':' + id + '}');
							}
						}
					}
				}
			}
			return brokenLinks;
		}
		onBeforeSaveRobotSettings() {
			const data = this.#customOnBeforeSaveRobotSettings();
			return main_core.Type.isPlainObject(data) ? data : {};
		}
		setOnBeforeSaveRobotSettings(callback) {
			if (main_core.Type.isFunction(callback)) {
				this.#customOnBeforeSaveRobotSettings = callback;
			}
		}
	}

	class UserOptions {
		#options;
		constructor(options) {
			this.#options = options;
		}
		clone() {
			return new UserOptions(main_core.Runtime.clone(this.#options));
		}
		set(category, key, value) {
			if (!main_core.Type.isPlainObject(this.#options[category])) {
				this.#options[category] = {};
			}
			const storedValue = this.#options[category][key];
			if (storedValue !== value) {
				BX.userOptions.save('bizproc.automation', category, key, value, false);
				this.#options[category][key] = value;
			}
			return this;
		}
		get(category, key, defaultValue) {
			let result = defaultValue;
			if (this.has(category, key)) {
				result = this.#options[category][key];
			}
			return result;
		}
		has(category, key) {
			return main_core.Type.isPlainObject(this.#options[category]) && Object.keys(this.#options[category]).includes(key);
		}
	}

	const renderAfterPreviousImageBlock = () => {
		return main_core.Tag.render`
		<svg 
			class="bizproc-automation_execution-queue_in-turn"
			width="97"
			height="121"
			viewBox="0 0 97 121"
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
			xmlns:xlink="http://www.w3.org/1999/xlink"
		>
			<rect width="97" height="121" fill="url(#pattern0)"/>
			<path
				fill-rule="evenodd"
				clip-rule="evenodd"
				d="M12.25 27C11.5596 27 11 26.4404 11 25.75V18.25C11 17.5596 11.5596 17 12.25 17H15.6875H16H79.75H81.3125H82.7275C83.2009 17 83.6338 17.2675 83.8455 17.691L86 22L83.8455 26.309C83.6338 26.7325 83.2009 27 82.7275 27H81.3125H79.75H16H15.6875H12.25Z"
				fill="#DFE0E3"
			/>
			<path
				fill-rule="evenodd"
				clip-rule="evenodd"
				d="M12.25 27C11.5596 27 11 26.4404 11 25.75V18.25C11 17.5596 11.5596 17 12.25 17H15.6875H16H79.75H81.3125H82.7275C83.2009 17 83.6338 17.2675 83.8455 17.691L86 22L83.8455 26.309C83.6338 26.7325 83.2009 27 82.7275 27H81.3125H79.75H16H15.6875H12.25Z"
				fill="#55D0E0"
			/>
			<g filter="url(#filter0_d_272_90944)" class="bizproc-automation_execution-queue_transform-element --one">
				<rect
					x="11"
					y="32"
					width="75"
					height="34"
					rx="4"
					fill="white"
					fill-opacity="0.9"
					shape-rendering="crispEdges"
				/>
				<path
					d="M11 56H86V62C86 64.2091 84.2091 66 82 66H15C12.7909 66 11 64.2091 11 62V56Z"
					fill="#C5F8FF"
				/>
				<rect x="22" y="37" width="21" height="4" rx="2" fill="#999999" fill-opacity="0.33"/>
				<rect x="15" y="45" width="54" height="4" rx="2" fill="#999999" fill-opacity="0.33"/>
				<rect x="72" y="45" width="8" height="4" rx="2" fill="#999999" fill-opacity="0.33"/>
				<rect x="55" y="59" width="28" height="4" rx="2" fill="#999999" fill-opacity="0.33"/>
				<g class="bizproc-automation_execution-queue_checked --one">
					<circle cx="15" cy="38" r="8" fill="#739F00"/>
					<path
						d="M11.7084 37.089L15.4796 40.8602L13.9711 42.3687L10.1999 38.5975L11.7084 37.089Z"
						fill="white"
					/>
					<path
						d="M20.0051 36.3347L13.9711 42.3687L12.4627 40.8602L18.4966 34.8262L20.0051 36.3347Z"
						fill="white"
					/>
				</g>
			</g>
			<g filter="url(#filter1_d_272_90944)" class="bizproc-automation_execution-queue_transform-element --two">
				<rect
					x="11"
					y="71"
					width="75"
					height="34"
					rx="4"
					fill="white"
					fill-opacity="0.9"
					shape-rendering="crispEdges"
				/>
				<path
					d="M11 95H86V101C86 103.209 84.2091 105 82 105H15C12.7909 105 11 103.209 11 101V95Z"
					fill="#C5F8FF"
				/>
				<rect x="15" y="84" width="54" height="4" rx="2" fill="#999999" fill-opacity="0.33"/>
				<rect x="72" y="84" width="8" height="4" rx="2" fill="#999999" fill-opacity="0.33"/>
				<rect x="55" y="98" width="28" height="4" rx="2" fill="#999999" fill-opacity="0.33"/>
				<rect x="22" y="76" width="21" height="4" rx="2" fill="#999999" fill-opacity="0.33"/>
				<g class="bizproc-automation_execution-queue_checked --two">
					<circle cx="15" cy="77" r="8" fill="#739F00"/>
					<path
						d="M11.7084 76.089L15.4796 79.8602L13.9711 81.3687L10.1999 77.5975L11.7084 76.089Z"
						fill="white"
					/>
					<path
						d="M20.0051 75.3347L13.9711 81.3687L12.4627 79.8602L18.4966 73.8262L20.0051 75.3347Z"
						fill="white"
					/>
				</g>
			</g>
		</svg>
	`;
	};
	const renderParallelImageBlock = () => {
		return main_core.Tag.render`
		<svg
			class="bizproc-automation_execution-queue_simultaneously"
			width="97"
			height="121"
			viewBox="0 0 97 121"
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
			xmlns:xlink="http://www.w3.org/1999/xlink"
		>
			<rect width="97" height="121" fill="url(#pattern0)"/>
			<path
				fill-rule="evenodd"
				clip-rule="evenodd"
				d="M12.25 27C11.5596 27 11 26.4404 11 25.75V18.25C11 17.5596 11.5596 17 12.25 17H15.6875H16H79.75H81.3125H82.7275C83.2009 17 83.6338 17.2675 83.8455 17.691L86 22L83.8455 26.309C83.6338 26.7325 83.2009 27 82.7275 27H81.3125H79.75H16H15.6875H12.25Z"
				fill="#DFE0E3"
			/>
			<path
				fill-rule="evenodd"
				clip-rule="evenodd"
				d="M12.25 27C11.5596 27 11 26.4404 11 25.75V18.25C11 17.5596 11.5596 17 12.25 17H15.6875H16H79.75H81.3125H82.7275C83.2009 17 83.6338 17.2675 83.8455 17.691L86 22L83.8455 26.309C83.6338 26.7325 83.2009 27 82.7275 27H81.3125H79.75H16H15.6875H12.25Z"
				fill="#55D0E0"
			/>
			<g
				filter="url(#filter0_d_272_90944)"
				class="bizproc-automation_execution-queue_transform-element"
			>
				<rect
					x="11"
					y="32"
					width="75"
					height="34"
					rx="4"
					fill="white"
					fill-opacity="0.9"
					shape-rendering="crispEdges"
				/>
				<path
					d="M11 56H86V62C86 64.2091 84.2091 66 82 66H15C12.7909 66 11 64.2091 11 62V56Z"
					fill="#C5F8FF"
				/>
				<rect x="22" y="37" width="21" height="4" rx="2" fill="#999999" fill-opacity="0.33"/>
				<rect x="15" y="45" width="54" height="4" rx="2" fill="#999999" fill-opacity="0.33"/>
				<rect x="72" y="45" width="8" height="4" rx="2" fill="#999999" fill-opacity="0.33"/>
				<rect x="55" y="59" width="28" height="4" rx="2" fill="#999999" fill-opacity="0.33"/>
				<g class="bizproc-automation_execution-queue_checked">
					<circle cx="15" cy="38" r="8" fill="#739F00"/>
					<path
						d="M11.7084 37.089L15.4796 40.8602L13.9711 42.3687L10.1999 38.5975L11.7084 37.089Z"
						fill="white"
					/>
					<path
						d="M20.0051 36.3347L13.9711 42.3687L12.4627 40.8602L18.4966 34.8262L20.0051 36.3347Z"
						fill="white"
					/>
				</g>
			</g>
			<g
				filter="url(#filter1_d_272_90944)"
				class="bizproc-automation_execution-queue_transform-element"
			>
				<rect
					x="11"
					y="71"
					width="75"
					height="34"
					rx="4"
					fill="white"
					fill-opacity="0.9"
					shape-rendering="crispEdges"
				/>
				<path
					d="M11 95H86V101C86 103.209 84.2091 105 82 105H15C12.7909 105 11 103.209 11 101V95Z"
					fill="#C5F8FF"
				/>
				<rect x="15" y="84" width="54" height="4" rx="2" fill="#999999" fill-opacity="0.33"/>
				<rect x="72" y="84" width="8" height="4" rx="2" fill="#999999" fill-opacity="0.33"/>
				<rect x="55" y="98" width="28" height="4" rx="2" fill="#999999" fill-opacity="0.33"/>
				<rect x="22" y="76" width="21" height="4" rx="2" fill="#999999" fill-opacity="0.33"/>
				<g class="bizproc-automation_execution-queue_checked">
					<circle cx="15" cy="77" r="8" fill="#739F00"/>
					<path
						d="M11.7084 76.089L15.4796 79.8602L13.9711 81.3687L10.1999 77.5975L11.7084 76.089Z"
						fill="white"
					/>
					<path
						d="M20.0051 75.3347L13.9711 81.3687L12.4627 79.8602L18.4966 73.8262L20.0051 75.3347Z"
						fill="white"
					/>
				</g>
			</g>
		</svg>
	`;
	};
	const renderRow = (isActive, uid, content) => {
		const {
			root,
			radio
		} = main_core.Tag.render`
		<label
			class="bizproc-automation-popup-select__wrapper-flex ${isActive ? '--active' : ''} ui-ctl ui-ctl-radio ui-ctl-w100"
			for="${uid}"
			data-role="execution-queue-row"
		>
			<div class="bizproc-automation-popup-select__wrapper-info-block">
				<div class="bizproc-automation-popup-select__header-input">
					<input
						ref="radio"
						class="ui-ctl-element"
						id="${uid}"
						type="radio"
						value="${main_core.Text.encode(content.value)}"
						name="execution"
					/>
					<span class="bizproc-automation-popup-settings__input-title">${main_core.Text.encode(content.title)}</span>
				</div>
				<div class="bizproc-automation-popup-settings__description">${main_core.Text.encode(content.description)}</div>
			</div>
			<div class="bizproc-automation-popup-settings__image-block">
				${content.imageRenderFunction()}
			</div>
		</label>
	`;
		main_core.Event.bind(radio, 'change', () => {
			document.querySelectorAll('[data-role="execution-queue-row"]').forEach(node => {
				main_core.Dom.removeClass(node, '--active');
			});
			main_core.Dom.addClass(root, '--active');
		});
		if (isActive) {
			main_core.Dom.attr(radio, 'checked', 'checked');
		}
		return root;
	};
	const showExecutionQueuePopup = settings => {
		const afterPreviousContent = {
			title: main_core.Loc.getMessage('BIZPROC_JS_AUTOMATION_EXECUTION_QUEUE_AFTER_PREVIOUS_TITLE'),
			description: main_core.Loc.getMessage('BIZPROC_JS_AUTOMATION_EXECUTION_QUEUE_AFTER_PREVIOUS_DESCRIPTION'),
			imageRenderFunction: renderAfterPreviousImageBlock,
			value: 'afterPrevious'
		};
		const parallelContent = {
			title: main_core.Loc.getMessage('BIZPROC_JS_AUTOMATION_EXECUTION_QUEUE_PARALLEL_TITLE'),
			description: main_core.Loc.getMessage('BIZPROC_JS_AUTOMATION_EXECUTION_QUEUE_PARALLEL_DESCRIPTION'),
			imageRenderFunction: renderParallelImageBlock,
			value: 'parallel'
		};
		const content = main_core.Tag.render`
		<form class="bizproc-automation-popup-select-block">
			<div class="bizproc-automation-popup-select-item">
				${renderRow(settings.currentValue === '1', 'bizproc-automation-cmp1', afterPreviousContent)}
			</div>
			<div class="bizproc-automation-popup-select-item">
				${renderRow(settings.currentValue !== '1', 'bizproc-automation-cmp2', parallelContent)}
			</div>
		</form>
	`;
		const popup = new main_popup.Popup({
			id: bizproc_automation.Helper.generateUniqueId(),
			bindElement: settings.bindElement,
			content,
			closeByEsc: true,
			buttons: [new ui_buttons.Button({
				color: ui_buttons.Button.Color.PRIMARY,
				text: main_core.Loc.getMessage('BIZPROC_JS_AUTOMATION_CHOOSE_BUTTON_CAPS'),
				onclick: () => {
					if (main_core.Type.isFunction(settings.onSubmitButtonClick)) {
						settings.onSubmitButtonClick(new FormData(content));
					}
					popup.close();
				}
			}), new ui_buttons.Button({
				color: ui_buttons.Button.Color.LINK,
				text: main_core.Loc.getMessage('BIZPROC_JS_AUTOMATION_CANCEL_BUTTON_CAPS'),
				onclick: () => {
					popup.close();
				}
			})],
			width: 482,
			padding: 20,
			closeIcon: false,
			autoHide: true,
			titleBar: false,
			angle: {
				offset: (settings.bindElement.clientWidth + 33) / 2
			},
			overlay: {
				backgroundColor: 'transparent'
			},
			events: {
				onClose: () => {
					popup.destroy();
				}
			}
		});
		popup.show();
	};

	class Template extends main_core_events.EventEmitter {
		#context;
		#delayMinLimitM;
		#delayMaxLimitD;
		#userOptions;
		#tracker;
		#viewMode;
		#templateContainerNode;
		#templateNode;
		#listNode;
		#buttonsNode;
		#robots;
		#data;
		constructor(params) {
			super();
			this.setEventNamespace('BX.Bizproc.Automation');
			this.#context = params.context ?? bizproc_automation.getGlobalContext();
			this.constants = params.constants;
			this.variables = params.variables;
			this.#templateContainerNode = params.templateContainerNode;
			this.#delayMinLimitM = params.delayMinLimitM;
			this.#delayMaxLimitD = params.delayMaxLimitD;
			this.#userOptions = params.userOptions;
			this.#tracker = this.#context.tracker;
			this.#data = {};
			this.#robots = [];
			this.#viewMode = ViewMode.none();
		}
		init(data, viewMode) {
			if (main_core.Type.isPlainObject(data)) {
				this.#data = data;
				if (!main_core.Type.isPlainObject(this.#data.CONSTANTS)) {
					this.#data.CONSTANTS = {};
				}
				if (!main_core.Type.isPlainObject(this.#data.PARAMETERS)) {
					this.#data.PARAMETERS = {};
				}
				if (!main_core.Type.isPlainObject(this.#data.VARIABLES)) {
					this.#data.VARIABLES = {};
				}
				if (!main_core.Type.isNil(this.#data.DOCUMENT_STATUS)) {
					this.#data.DOCUMENT_STATUS = String(this.#data.DOCUMENT_STATUS);
				}
				this.markExternalModified(this.#data.IS_EXTERNAL_MODIFIED);
				this.markModified(false);
			}
			this.#viewMode = ViewMode.fromRaw(viewMode);
			if (!this.#viewMode.isNone()) {
				this.#templateNode = this.#templateContainerNode.querySelector(`[data-role="automation-template"][data-status-id="${this.#data.DOCUMENT_STATUS}"]`);
				this.#listNode = this.#templateNode.querySelector('[data-role="robot-list"]');
				this.#buttonsNode = this.#templateNode.querySelector('[data-role="buttons"]');
				this.initRobots();
				this.initButtons();
				if (!this.isExternalModified() && this.canEdit()) {
					// register DD
					jsDD.registerDest(this.#templateNode, 10);
				} else {
					jsDD.unregisterDest(this.#templateNode);
				}
			}
		}
		reInit(data, viewMode) {
			main_core.Dom.clean(this.#listNode);
			main_core.Dom.clean(this.#buttonsNode);
			this.destroy();
			this.init(data, viewMode);
		}
		destroy() {
			this.#robots.forEach(robot => robot.destroy());
		}
		static copyRobotTo(dstTemplate, robot, beforeRobot) {
			const copiedRobot = robot.copyTo(dstTemplate, beforeRobot);
			dstTemplate.emit('Template:robot:add', {
				robot: copiedRobot
			});
		}
		canEdit() {
			return this.#context.canEdit;
		}
		initRobots() {
			this.#robots = [];
			if (main_core.Type.isArray(this.#data.ROBOTS)) {
				for (let i = 0; i < this.#data.ROBOTS.length; ++i) {
					const robot = new Robot({
						document: this.#context.document,
						template: this,
						isFrameMode: this.#context.get('isFrameMode'),
						tracker: this.#tracker
					});
					robot.init(this.#data.ROBOTS[i], this.#viewMode);
					this.insertRobotNode(robot.node);
					this.#robots.push(robot);
				}
			}
		}
		get robots() {
			return this.#robots;
		}
		get userOptions() {
			return this.#userOptions;
		}
		getSelectedRobotNames() {
			const selectedRobots = [];
			this.#robots.forEach(robot => {
				if (robot.isSelected()) {
					selectedRobots.push(robot.data.Name);
				}
			});
			return selectedRobots;
		}
		getActivatedRobotNames() {
			const activatedRobots = [];
			this.#robots.forEach(robot => {
				if (robot.isActivated()) {
					activatedRobots.push(robot.data.Name);
				}
			});
			return activatedRobots;
		}
		getDeactivatedRobotNames() {
			const deactivatedRobots = [];
			this.#robots.forEach(robot => {
				if (!robot.isActivated()) {
					deactivatedRobots.push(robot.data.Name);
				}
			});
			return deactivatedRobots;
		}
		getSerializedRobots() {
			const serialized = [];
			this.#robots.forEach(robot => serialized.push(robot.serialize()));
			return serialized;
		}
		getId() {
			return this.#data.ID;
		}
		getStatusId() {
			return this.#data.DOCUMENT_STATUS;
		}
		getStatus() {
			return this.#context.document.statusList.find(status => String(status.STATUS_ID) === this.getStatusId());
		}
		getTemplateId() {
			const id = parseInt(this.#data.ID, 10);
			return Number.isNaN(id) ? 0 : id;
		}
		getDocumentType() {
			return this.#data.DOCUMENT_TYPE;
		}
		initButtons() {
			if (this.isExternalModified()) {
				this.createExternalLocker();
				this.createManageModeButton();
				this.createTerminateRobotsButton();
			} else if (this.#viewMode.isEdit() && this.getTemplateId() > 0) {
				this.createConstantsEditButton();
				this.createParametersEditButton();
				this.createExternalEditTemplateButton();
				this.createManageModeButton();
				this.createTerminateRobotsButton();
			}
		}
		enableManageMode(isActive) {
			if (this.#listNode) {
				this.#viewMode = ViewMode.manage().setProperty('isActive', isActive);
				if (isActive) {
					main_core.Dom.addClass(this.#listNode, '--multiselect-mode');
				}
				if (this.isExternalModified()) {
					main_core.Dom.addClass(this.#listNode, '--locked-node');
				} else {
					this.#robots.forEach(robot => {
						if (robot.isInvalid()) {
							robot.enableManageMode(false);
						} else {
							robot.enableManageMode(isActive);
						}
					});
				}
			}
		}
		disableManageMode() {
			if (this.#listNode) {
				this.#viewMode = ViewMode.edit();
				main_core.Dom.removeClass(this.#listNode, '--multiselect-mode');
				if (this.isExternalModified()) {
					main_core.Dom.removeClass(this.#listNode, '--locked-node');
				} else {
					this.#robots.forEach(robot => {
						robot.disableManageMode();
						if (!robot.isInvalid()) {
							const draggableNode = robot.node.querySelector('.bizproc-automation-robot-container-wrapper');
							if (draggableNode) {
								main_core.Dom.addClass(draggableNode, 'bizproc-automation-robot-container-wrapper-draggable');
							}
						}
					});
				}
			}
		}
		enableDragAndDrop() {
			this.#robots.forEach(robot => {
				if (!robot.isInvalid()) {
					robot.registerItem(robot.node);
					const draggableNode = robot.node.querySelector('.bizproc-automation-robot-container-wrapper');
					if (draggableNode) {
						main_core.Dom.addClass(draggableNode, 'bizproc-automation-robot-container-wrapper-draggable');
					}
				}
			});
		}
		disableDragAndDrop() {
			this.#robots.forEach(robot => robot.unregisterItem(robot.node));
			this.#templateNode.querySelectorAll('.bizproc-automation-robot-container-wrapper').forEach(node => {
				main_core.Dom.removeClass(node, 'bizproc-automation-robot-container-wrapper-draggable');
			});
		}
		createExternalEditTemplateButton() {
			if (main_core.Type.isNil(this.#context.bizprocEditorUrl)) {
				return false;
			}
			const anchor = main_core.Tag.render`
			<a class="bizproc-automation-robot-btn-set" href="#" target="_top">
				${main_core.Loc.getMessage('BIZPROC_AUTOMATION_CMP_EXTERNAL_EDIT')}
			</a>
		`;
			main_core.Event.bind(anchor, 'click', event => {
				event.preventDefault();
				if (!this.#viewMode.isManage()) {
					this.onExternalEditTemplateButtonClick(anchor);
				}
			});
			if (this.#context.bizprocEditorUrl.length === 0) {
				main_core.Dom.addClass(anchor, 'bizproc-automation-robot-btn-set-locked');
			}
			main_core.Dom.append(anchor, this.#buttonsNode);
		}
		createManageModeButton() {
			if (!this.#context.canManage) {
				return;
			}
			const manageButton = main_core.Tag.render`
			<a class="bizproc-automation-robot-btn-set" target="_top" style="cursor: pointer">
				${main_core.Loc.getMessage('BIZPROC_AUTOMATION_CMP_MANAGE_ROBOTS_1')}
			</a>
		`;
			main_core.Event.bind(manageButton, 'click', event => {
				event.preventDefault();
				this.onManageModeButtonClick(manageButton);
			});
			main_core.Dom.append(manageButton, this.#buttonsNode);
		}
		onManageModeButtonClick(manageButtonNode) {
			if (this.canEdit()) {
				this.emit('Template:enableManageMode', {
					documentStatus: this.#data.DOCUMENT_STATUS
				});
			} else {
				HelpHint.showNoPermissionsHint(manageButtonNode);
			}
		}
		createTerminateRobotsButton() {
			if (!this.hasRunningRobots() && this.getRunningCustomRobots().length === 0) {
				return;
			}
			const terminateButton = main_core.Tag.render`
			<a class="bizproc-automation-robot-btn-set btn-pointer" target="_top">
				${main_core.Loc.getMessage('BIZPROC_JS_AUTOMATION_ROBOTS_TERMINATE')}
			</a>
		`;
			main_core.Event.bind(terminateButton, 'click', event => {
				event.preventDefault();
				this.onTerminateRobotsButtonClick(terminateButton);
			});
			main_core.Dom.append(terminateButton, this.#buttonsNode);
		}
		onTerminateRobotsButtonClick(terminateButton) {
			const templateId = this.getTemplateId();
			const signedDocument = this.#context.signedDocument;
			if (templateId > 0 && signedDocument) {
				main_core.Dom.addClass(terminateButton, '--disabled');
				main_core.ajax.runAction('bizproc.workflow.terminateByTemplate', {
					data: {
						templateId,
						signedDocument
					}
				}).then(response => {
					this.notifyMessage(main_core.Loc.getMessage('BIZPROC_JS_AUTOMATION_ROBOTS_STOPPED'));
					this.stopTemplate();
				}).catch(response => {
					response.errors.forEach(error => {
						this.notifyMessage(error.message);
					});
				});
			}
		}
		stopTemplate() {
			const loaders = this.#templateNode.querySelectorAll('.bizproc-automation-robot-information.--loader');
			loaders.forEach(loader => {
				main_core.Dom.removeClass(loader, '--loader');
			});
		}
		notifyMessage(message) {
			ui_notification.UI.Notification.Center.notify({
				content: message,
				autoHideDelay: 5000
			});
		}
		hasRunningRobots() {
			return Boolean(this.#robots.some(robot => robot.getLogStatus() === TrackingStatus.RUNNING));
		}
		getRunningCustomRobots() {
			return this.#data.CUSTOM_ROBOTS ?? [];
		}
		createConstantsEditButton() {
			if (main_core.Type.isNil(this.#context.constantsEditorUrl)) {
				return false;
			}
			const url = this.#viewMode.isManage() ? '#' : this.#context.constantsEditorUrl.replace('#ID#', this.getTemplateId());
			if (url.length === 0) {
				return false;
			}
			const anchor = main_core.Tag.render`
			<a class="bizproc-automation-robot-btn-set" href="${main_core.Text.encode(url)}">
				${main_core.Loc.getMessage('BIZPROC_AUTOMATION_CMP_CONSTANTS_EDIT')}
			</a>
		`;
			main_core.Dom.append(anchor, this.#buttonsNode);
		}
		createParametersEditButton() {
			if (main_core.Type.isNil(this.#context.parametersEditorUrl)) {
				return false;
			}
			const url = this.#context.parametersEditorUrl.replace('#ID#', this.getTemplateId());
			if (url.length === 0 || this.#viewMode.isManage()) {
				return false;
			}
			const anchor = main_core.Tag.render`
			<a class="bizproc-automation-robot-btn-set" href="${main_core.Text.encode(url)}">
				${main_core.Loc.getMessage('BIZPROC_AUTOMATION_CMP_PARAMETERS_EDIT')}
			</a>
		`;
			main_core.Dom.append(anchor, this.#buttonsNode);
		}
		createExternalLocker() {
			const {
				root,
				iconBlock
			} = main_core.Tag.render`
			<div class="bizproc-automation-robot-container">
				<div class="bizproc-automation-robot-container-wrapper bizproc-automation-robot-container-wrapper-lock">
					<div class="bizproc-automation-robot-deadline"></div>
					<div class="bizproc-automation-robot-title">
						${main_core.Loc.getMessage('BIZPROC_AUTOMATION_CMP_EXTERNAL_EDIT_TEXT')}
					</div>
					<div class="bizproc-automation-robot-information" ref="iconBlock"></div>
				</div>
			</div>
		`;
			if (this.getRunningCustomRobots().length > 0) {
				main_core.Dom.addClass(iconBlock, '--loader');
			}
			if (this.#viewMode.isEdit()) {
				const settingsBtn = main_core.Tag.render`
				<div class="bizproc-automation-robot-btn-settings">
					${main_core.Loc.getMessage('BIZPROC_AUTOMATION_CMP_EDIT')}
				</div>
			`;
				main_core.Event.bind(root, 'click', event => {
					event.stopPropagation();
					if (!this.#viewMode.isManage()) {
						this.onExternalEditTemplateButtonClick(root);
					}
				});
				main_core.Dom.append(settingsBtn, root);
				const deleteBtn = main_core.Tag.render`<span class="bizproc-automation-robot-btn-delete"></span>`;
				main_core.Event.bind(deleteBtn, 'click', event => {
					event.stopPropagation();
					if (!this.#viewMode.isManage()) {
						this.onUnsetExternalModifiedClick(deleteBtn);
					}
				});
				main_core.Dom.append(deleteBtn, root.lastChild);
			}
			main_core.Dom.append(root, this.#listNode);
			this.#templateNode = root;
		}
		onSearch(event) {
			if (this.isExternalModified()) {
				this.onExternalModifiedSearch(event);
			} else {
				this.#robots.forEach(robot => robot.onSearch(event));
			}
		}
		onExternalModifiedSearch(event) {
			if (this.#templateNode) {
				const query = event.getData().queryString;
				main_core.Dom[query ? 'addClass' : 'removeClass'](this.#templateNode, '--search-mismatch');
			}
		}
		onExternalEditTemplateButtonClick(button) {
			if (!this.canEdit()) {
				HelpHint.showNoPermissionsHint(button);
				return;
			}
			if (this.#context.bizprocEditorUrl.length === 0) {
				if (top.BX.UI && top.BX.UI.InfoHelper) {
					top.BX.UI.InfoHelper.show('limit_office_bp_designer');
				}
				return;
			}
			const templateId = this.getTemplateId();
			if (templateId > 0) {
				this.openBizprocEditor(templateId);
			}
		}
		onUnsetExternalModifiedClick(button) {
			if (!this.canEdit()) {
				HelpHint.showNoPermissionsHint(button);
				return;
			}
			this.#templateNode = null;
			this.markExternalModified(false);
			this.markModified();
			this.reInit(null, this.#viewMode.intoRaw());
		}
		openBizprocEditor(templateId) {
			top.window.location.href = this.#context.bizprocEditorUrl.replace('#ID#', templateId);
		}
		addRobot(robotData, callback) {
			const robot = new Robot({
				document: this.#context.document,
				template: this,
				isFrameMode: this.#context.get('isFrameMode'),
				tracker: this.#tracker
			});
			const initData = {
				Type: robotData.CLASS,
				Properties: {
					Title: robotData.NAME
				},
				DialogContext: robotData.DIALOG_CONTEXT
			};
			if (this.#robots.length > 0) {
				const parentRobot = this.#robots[this.#robots.length - 1];
				if (!parentRobot.getDelayInterval().isNow() || parentRobot.isExecuteAfterPrevious()) {
					initData.Delay = parentRobot.getDelayInterval().serialize();
					initData.ExecuteAfterPrevious = 1;
				}
			}
			robot.draft = true;
			robot.init(initData, this.#viewMode);
			this.insertRobot(robot);
			this.insertRobotNode(robot.node);
			this.emit('Template:robot:add', {
				robot
			});
			if (callback) {
				callback.call(this, robot);
			}
		}
		insertRobot(robot, beforeRobot) {
			if (beforeRobot) {
				for (let i = 0; i < this.#robots.length; ++i) {
					if (this.#robots[i] !== beforeRobot) {
						continue;
					}
					this.#robots.splice(i, 0, robot);
					break;
				}
			} else {
				this.#robots.push(robot);
			}
			this.markModified();
		}
		getNextRobot(robot) {
			for (let i = 0; i < this.#robots.length; ++i) {
				if (this.#robots[i] === robot) {
					return this.#robots[i + 1] || null;
				}
			}
			return null;
		}
		deleteRobot(robot, callback) {
			for (let i = 0; i < this.#robots.length; ++i) {
				if (this.#robots[i].isEqual(robot)) {
					this.#robots.splice(i, 1);
					if (callback) {
						callback(robot);
					}
					this.markModified();
					this.emit('Template:robot:delete', {
						robot
					});
					break;
				}
			}
		}
		insertRobotNode(robotNode, beforeNode) {
			if (beforeNode) {
				this.#listNode.insertBefore(robotNode, beforeNode);
			} else {
				main_core.Dom.append(robotNode, this.#listNode);
			}
		}
		openRobotSettingsDialog(robot, context, saveCallback) {
			if (!main_core.Type.isPlainObject(context)) {
				context = {};
			}
			if (bizproc_automation.Designer.getInstance().getRobotSettingsDialog()) {
				return;
			}
			const robotBrokenLinks = robot.getBrokenLinks();
			const formName = 'bizproc_automation_robot_dialog';
			const form = main_core.Tag.render`
			<form name="${formName}">
				${this.#renderExecutionQueue(robot)}
				${this.renderDelaySettings(robot)}
				${this.renderConditionSettings(robot)}
				${robotBrokenLinks.length > 0 ? this.renderBrokenLinkAlert(robotBrokenLinks) : ''}
			</form>
		`;
			bizproc_automation.Designer.getInstance().setRobotSettingsDialog({
				template: this,
				context,
				robot,
				form
			});
			window.console.info('Opened robot ID: %s', robot.getId());
			if (main_core.Type.isNumber(this.#context.document.getCategoryId())) {
				context.DOCUMENT_CATEGORY_ID = this.#context.document.getCategoryId();
			}
			if (main_core.Type.isPlainObject(robot.data.DialogContext) && !main_core.Type.isNil(robot.data.DialogContext.addMenuGroup)) {
				context.addMenuGroup = robot.data.DialogContext.addMenuGroup;
			}
			main_core.ajax({
				method: 'POST',
				dataType: 'html',
				url: main_core.Uri.addParam(this.#context.ajaxUrl, {
					analyticsLabel: `automation_robot${robot.draft ? '_draft' : ''}_settings_${robot.data.Type.toLowerCase()}`,
					ajax_action: 'get_robot_dialog',
					document_signed: this.#context.signedDocument,
					document_status: this.#context.document.getCurrentStatusId(),
					context,
					form_name: formName
				}),
				data: {
					robot: Helper.toJsonPayload(robot.serialize()),
					context_robots: Helper.toJsonPayload(this.#robots.filter(r => r !== robot).map(r => r.serialize()))
				},
				headers: [{
					name: 'Content-Type',
					value: 'application/json'
				}],
				preparePost: false,
				onsuccess: html => {
					if (html) {
						const dialogRows = main_core.Dom.create('div', {
							html
						});
						main_core.Dom.append(dialogRows, form);
					}
					this.showRobotSettingsPopup(robot, form, saveCallback);
				}
			});
		}
		showRobotSettingsPopup(robot, form, saveCallback) {
			let popupMinWidth = 580;
			let popupWidth = popupMinWidth;
			if (this.#userOptions) {
				// TODO move from if?
				this.emit('Template:robot:showSettings');
				popupWidth = parseInt(this.#userOptions.get('defaults', 'robot_settings_popup_width', 580), 10);
			}
			this.initRobotSettingsControls(robot, form);
			if (robot.data.Type === 'CrmSendEmailActivity' || robot.data.Type === 'MailActivity' || robot.data.Type === 'RpaApproveActivity') {
				popupMinWidth += 170;
				if (popupWidth < popupMinWidth) {
					popupWidth = popupMinWidth;
				}
			}
			let robotTitle = main_core.Loc.getMessage('BIZPROC_AUTOMATION_ROBOT_SETTINGS_TITLE');
			let descriptionTitle = main_core.Loc.getMessage('BIZPROC_AUTOMATION_ROBOT_SETTINGS_TITLE');
			if (robot.hasTitle()) {
				robotTitle = robot.getTitle();
				descriptionTitle = robot.getDescriptionTitle();
				if (descriptionTitle === 'untitled') {
					descriptionTitle = robotTitle;
				}
			}
			const titleBarContent = main_core.Tag.render`
			<div class="popup-window-titlebar-text bizproc-automation-robot-settings-popup-titlebar">
				<span class="bizproc-automation-robot-settings-popup-titlebar-text">${main_core.Text.encode(robotTitle)}</span>
				<div class="ui-hint">
					<span class="ui-hint-icon" data-text="${main_core.Text.encode(descriptionTitle)}"></span>
				</div>
			</div>
		`;
			HelpHint.bindAll(titleBarContent);
			const popup = new main_popup.Popup({
				id: Helper.generateUniqueId(),
				bindElement: null,
				content: form,
				closeByEsc: true,
				buttons: [new ui_buttons.SaveButton({
					onclick: button => {
						const isNewRobot = robot.draft;
						const callback = () => {
							popup.close();
							if (isNewRobot) {
								this.emit('Template:robot:add', {
									robot
								});
							}
							if (saveCallback) {
								saveCallback(robot);
							}
						};
						this.saveRobotSettings(form, robot, callback, button.getContainer());
					}
				}), new ui_buttons.CancelButton({
					text: main_core.Loc.getMessage('BIZPROC_JS_AUTOMATION_CANCEL_BUTTON_CAPS'),
					onclick: () => {
						popup.close();
					}
				})],
				width: popupWidth,
				minWidth: popupMinWidth,
				minHeight: 100,
				contentPadding: 12,
				resizable: true,
				closeIcon: true,
				events: {
					onPopupClose: () => {
						bizproc_automation.Designer.getInstance().setRobotSettingsDialog(null);
						this.destroyRobotSettingsControls();
						popup.destroy();
						this.emit('Template:robot:closeSettings');
					},
					onPopupResize: () => {
						this.onResizeRobotSettings();
					},
					onPopupResizeEnd: () => {
						if (this.#userOptions) {
							this.#userOptions.set('defaults', 'robot_settings_popup_width', popup.getWidth());
						}
					}
				},
				titleBar: {
					content: titleBarContent
				},
				draggable: {
					restrict: false
				}
			});
			bizproc_automation.Designer.getInstance().getRobotSettingsDialog().popup = popup;
			popup.show();
		}
		initRobotSettingsControls(robot, node) {
			if (!main_core.Type.isArray(this.robotSettingsControls)) {
				this.robotSettingsControls = [];
			}
			const controlNodes = node.querySelectorAll('[data-role]');
			for (const controlNode of controlNodes) {
				this.initRobotSettingsControl(robot, controlNode);
			}
		}
		initRobotSettingsControl(robot, controlNode) {
			if (!main_core.Type.isArray(this.robotSettingsControls)) {
				this.robotSettingsControls = [];
			}
			const role = controlNode.getAttribute('data-role');
			const controlProps = {
				context: new bizproc_automation.SelectorContext({
					fields: main_core.Runtime.clone(this.#context.document.getFields()),
					useSwitcherMenu: this.#context.get('showTemplatePropertiesMenuOnSelecting'),
					rootGroupTitle: this.#context.document.title,
					userOptions: this.#context.userOptions
				}),
				needSync: robot.draft,
				checkbox: controlNode
			};
			if (role === bizproc_automation.SelectorManager.SELECTOR_ROLE_USER) {
				const fieldProperty = JSON.parse(controlNode.getAttribute('data-property'));
				controlProps.context.set('additionalUserFields', [...this.#getUserSelectorAdditionalFields(fieldProperty), ...this.globalConstants.filter(constant => constant.Type === 'user').map(constant => ({
					id: constant.Expression,
					title: constant.Name
				})), ...this.globalVariables.filter(variable => variable.Type === 'user').map(variable => ({
					id: variable.Expression,
					title: variable.Name
				}))]);
			} else if (role === bizproc_automation.SelectorManager.SELECTOR_ROLE_FILE) {
				this.robots.forEach(robot => {
					controlProps.context.fields.push(...robot.getReturnFieldsDescription().filter(field => field.Type === 'file').map(field => ({
						Id: `{{~${robot.getId()}:${field.Id}}}`,
						Name: `${robot.getTitle()}: ${field.Name}`,
						Type: 'file',
						Expression: `{{~${robot.getId()}:${field.Id}}}`
					})));
				});
			}
			const control = bizproc_automation.SelectorManager.createSelectorByRole(role, controlProps);
			if (control && role !== bizproc_automation.SelectorManager.SELECTOR_ROLE_SAVE_STATE) {
				control.renderTo(controlNode);
				control.subscribe('onAskConstant', event => {
					const {
						fieldProperty
					} = event.getData();
					control.onFieldSelect(this.addConstant(fieldProperty));
				});
				control.subscribe('onAskParameter', event => {
					const {
						fieldProperty
					} = event.getData();
					control.onFieldSelect(this.addParameter(fieldProperty));
				});
				control.subscribe('onOpenFieldMenu', event => this.onOpenMenu(event, robot));
				control.subscribe('onOpenMenu', event => this.onOpenMenu(event, robot));
			}
			BX.UI.Hint.init(controlNode);
			if (control) {
				this.robotSettingsControls.push(control);
			}
		}
		#getUserSelectorAdditionalFields(fieldProperty) {
			const additionalFields = this.getRobotsWithReturnFields().flatMap(robot => robot.getReturnFieldsDescription().filter(field => field.Type === 'user').map(field => ({
				id: `{{~${robot.getId()}:${field.Id}}}`,
				title: `${robot.getTitle()}: ${field.Name}`
			})));
			if (this.#context.get('showTemplatePropertiesMenuOnSelecting') && fieldProperty) {
				const ask = this.addConstant(main_core.Runtime.clone(fieldProperty));
				additionalFields.push({
					id: ask.Expression,
					title: main_core.Loc.getMessage('BIZPROC_AUTOMATION_ASK_CONSTANT'),
					tabs: ['recents', 'bpuserroles'],
					sort: 1
				});
				const param = this.addParameter(main_core.Runtime.clone(fieldProperty));
				additionalFields.push({
					id: param.Expression,
					title: main_core.Loc.getMessage('BIZPROC_AUTOMATION_ASK_PARAMETER'),
					tabs: ['recents', 'bpuserroles'],
					sort: 2
				});
			}
			return additionalFields;
		}
		getRobotsWithReturnFields(skipRobot) {
			const skipId = skipRobot?.getId() || '';
			return this.robots.filter(templateRobot => templateRobot.getId() !== skipId && templateRobot.hasReturnFields());
		}
		destroyRobotSettingsControls() {
			if (this.conditionSelector) {
				this.conditionSelector.destroy();
				this.conditionSelector = null;
			}
			if (main_core.Type.isArray(this.robotSettingsControls)) {
				for (let i = 0; i < this.robotSettingsControls.length; ++i) {
					if (main_core.Type.isFunction(this.robotSettingsControls[i].destroy)) {
						this.robotSettingsControls[i].destroy();
					}
				}
			}
			this.robotSettingsControls = null;
		}
		onBeforeSaveRobotSettings() {
			if (main_core.Type.isArray(this.robotSettingsControls)) {
				for (let i = 0; i < this.robotSettingsControls.length; ++i) {
					if (main_core.Type.isFunction(this.robotSettingsControls[i].onBeforeSave)) {
						this.robotSettingsControls[i].onBeforeSave();
					}
				}
			}
		}
		onResizeRobotSettings() {
			if (main_core.Type.isArray(this.robotSettingsControls)) {
				for (let i = 0; i < this.robotSettingsControls.length; ++i) {
					if (main_core.Type.isFunction(this.robotSettingsControls[i].onPopupResize)) {
						this.robotSettingsControls[i].onPopupResize();
					}
				}
			}
		}
		renderDelaySettings(robot) {
			const delay = robot.getDelayInterval().clone();
			const {
				root,
				delayTypeNode,
				delayValueNode,
				delayValueTypeNode,
				delayBasisNode,
				delayWorkTimeNode,
				delayWaitWorkDayNode,
				delayInTimeNode,
				delayIntervalLabelNode
			} = main_core.Tag.render`
			<div class="bizproc-automation-popup-settings">
				<div class="bizproc-automation-popup-settings-block">
					<span class="bizproc-automation-popup-settings-title-wrapper">
						<input
							ref="delayTypeNode"
							type="hidden"
							name="delay_type"
							value="${main_core.Text.encode(delay.type)}"
						/>
						<input
							ref="delayValueNode"
							type="hidden"
							name="delay_value"
							value="${main_core.Text.encode(delay.value)}"
						/>
						<input
							ref="delayValueTypeNode"
							type="hidden"
							name="delay_value_type"
							value="${main_core.Text.encode(delay.valueType)}"
						/>
						<input
							ref="delayBasisNode"
							type="hidden"
							name="delay_basis"
							value="${main_core.Text.encode(delay.basis)}"
						/>
						<input 
							ref="delayWorkTimeNode"
							type="hidden"
							name="delay_worktime"
							value="${delay.workTime ? 1 : 0}"
						/>
						<input
							ref="delayWaitWorkDayNode"
							type="hidden"
							name="delay_wait_workday"
							value="${delay.waitWorkDay ? 1 : 0}"
						/>
						<input
							ref="delayInTimeNode"
							type="hidden"
							name="delay_in_time"
							value="${main_core.Text.encode(delay.inTimeString)}"
						/>
						<span
							class="bizproc-automation-popup-settings-title bizproc-automation-popup-settings-title-left"
						>
							${main_core.Loc.getMessage('BIZPROC_JS_AUTOMATION_TO_EXECUTE_TITLE')}
						</span>
						<span
							ref="delayIntervalLabelNode"
							class="bizproc-automation-popup-settings-link bizproc-automation-delay-interval-basis"
						></span>
					</span>
				</div>
			</div>
		`;
			const basisFields = [];
			const docFields = this.#context.document.getFields();
			const minLimitM = this.#delayMinLimitM;
			const maxLimitD = this.#delayMaxLimitD;
			if (main_core.Type.isArray(docFields)) {
				for (const field of docFields) {
					if (field.Type === 'date' || field.Type === 'datetime') {
						basisFields.push(field);
					}
				}
			}
			const delayIntervalSelector = new bizproc_automation.DelayIntervalSelector({
				labelNode: delayIntervalLabelNode,
				onchange(delay) {
					delayTypeNode.value = delay.type;
					delayValueNode.value = delay.value;
					delayValueTypeNode.value = delay.valueType;
					delayBasisNode.value = delay.basis;
					delayWorkTimeNode.value = delay.workTime ? 1 : 0;
					delayWaitWorkDayNode.value = delay.waitWorkDay ? 1 : 0;
					delayInTimeNode.value = delay.inTimeString;
				},
				basisFields,
				minLimitM,
				maxLimitD,
				useAfterBasis: true,
				showWaitWorkDay: true
			});
			delayIntervalSelector.init(delay);
			return root;
		}
		setDelaySettingsFromForm(formFields, robot) {
			const delay = new bizproc_condition.DelayInterval();
			delay.setType(formFields.delay_type);
			delay.setValue(formFields.delay_value);
			delay.setValueType(formFields.delay_value_type);
			delay.setBasis(formFields.delay_basis);
			delay.setWorkTime(formFields.delay_worktime === '1');
			delay.setWaitWorkDay(formFields.delay_wait_workday === '1');
			delay.setInTime(formFields.delay_in_time ? formFields.delay_in_time.split(':') : null);
			robot.setDelayInterval(delay);
			if (robot.hasTemplate()) {
				robot.setExecuteAfterPrevious(formFields.execute_after_previous && formFields.execute_after_previous === '1');
			}
			return this;
		}
		renderConditionSettings(robot) {
			const conditionGroup = robot.getCondition();
			this.conditionSelector = new bizproc_automation.ConditionGroupSelector(conditionGroup, {
				fields: this.#context.document.getFields(),
				onOpenFieldMenu: event => this.onOpenMenu(event, robot),
				onOpenMenu: event => this.onOpenMenu(event, robot),
				caption: {
					head: main_core.Loc.getMessage('BIZPROC_JS_AUTOMATION_ROBOT_CONDITION_TITLE')
				},
				isExpanded: this.#userOptions?.get('defaults', 'isConditionGroupExpanded', 'N') === 'Y'
			});
			this.conditionSelector.subscribe('onToggleGroupViewClick', event => {
				const data = event.getData();
				this.#userOptions.set('defaults', 'isConditionGroupExpanded', data.isExpanded ? 'Y' : 'N');
			});
			return this.conditionSelector.createNode();
		}
		#renderExecutionQueue(robot) {
			const title = robot.isExecuteAfterPrevious() ? main_core.Loc.getMessage('BIZPROC_JS_AUTOMATION_EXECUTION_QUEUE_AFTER_PREVIOUS_TITLE') : main_core.Loc.getMessage('BIZPROC_JS_AUTOMATION_EXECUTION_QUEUE_PARALLEL_TITLE');
			const value = robot.isExecuteAfterPrevious() ? '1' : '0';
			const {
				root,
				executionQueueLink,
				input
			} = main_core.Tag.render`
			<div class="bizproc-automation-popup-settings">
				<div class="bizproc-automation-popup-settings-block">
					<span class="bizproc-automation-popup-settings-title">
						${main_core.Loc.getMessage('BIZPROC_JS_AUTOMATION_EXECUTION_QUEUE_TITLE')}
					</span>
					<span class="bizproc-automation-popup-settings-link-wrapper">
						<a ref="executionQueueLink" class="bizproc-automation-popup-settings-link">${title}</a>
					</span>
					<input ref="input" type="hidden" value="${value}" name="execute_after_previous"/>
				</div>
			</div>
		`;
			main_core.Event.bind(executionQueueLink, 'click', () => {
				showExecutionQueuePopup({
					bindElement: executionQueueLink,
					currentValue: input.value,
					onSubmitButtonClick: formData => {
						const afterPrevious = formData.get('execution') === 'afterPrevious';
						main_core.Dom.adjust(input, {
							attrs: {
								value: afterPrevious ? '1' : '0'
							}
						});
						main_core.Dom.adjust(executionQueueLink, {
							text: afterPrevious ? main_core.Loc.getMessage('BIZPROC_JS_AUTOMATION_EXECUTION_QUEUE_AFTER_PREVIOUS_TITLE') : main_core.Loc.getMessage('BIZPROC_JS_AUTOMATION_EXECUTION_QUEUE_PARALLEL_TITLE')
						});
					}
				});
			});
			return root;
		}
		onOpenMenu(event, robot) {
			const selector = event.getData().selector;
			const isMixedCondition = event.getData().isMixedCondition;
			const needAddGroups = !(main_core.Type.isBoolean(isMixedCondition) && !isMixedCondition);
			if (needAddGroups) {
				const selectorManager = new bizproc_automation.SelectorItemsManager({
					activityResultFields: this.#getRobotResultFieldForSelector(robot),
					constants: this.getConstants(),
					// variables: this.getVariables(),
					globalConstants: this.globalConstants,
					globalVariables: this.globalVariables
				});
				selectorManager.groupsWithChildren.forEach(group => {
					selector.addGroup(group.id, group);
				});
			}
			this.emit('Template:onSelectorMenuOpen', {
				template: this,
				robot,
				...event.getData()
			});
		}
		#getRobotResultFieldForSelector(skipRobot) {
			return this.getRobotsWithReturnFields(skipRobot).map(robotWithReturnFields => {
				return {
					id: robotWithReturnFields.getId(),
					title: robotWithReturnFields.getTitle(),
					fields: bizproc_automation.enrichFieldsWithModifiers(robotWithReturnFields.getReturnFieldsDescription(), robotWithReturnFields.getId(), {
						friendly: false,
						printable: false,
						server: false,
						responsible: false,
						shortLink: true
					})
				};
			});
		}
		setConditionSettingsFromForm(formFields, robot) {
			robot.setCondition(bizproc_automation.ConditionGroup.createFromForm(formFields));
			return this;
		}
		renderBrokenLinkAlert(brokenLinks = []) {
			const moreInfoNode = main_core.Tag.render`
			<div class="bizproc-automation-robot-broken-link-full-info">
				${brokenLinks.map(value => main_core.Text.encode(value)).join('<br>')}
			</div>
		`;
			const showMoreLabel = main_core.Tag.render`
			<span class="bizproc-automation-robot-broken-link-show-more">
				${main_core.Loc.getMessage('JS_BIZPROC_AUTOMATION_BROKEN_LINK_MESSAGE_ERROR_MORE_INFO')}
			</span>
		`;
			main_core.Event.bindOnce(showMoreLabel, 'click', () => {
				main_core.Dom.style(moreInfoNode, 'height', `${moreInfoNode.scrollHeight}px`);
				main_core.Dom.remove(showMoreLabel);
			});
			const closeBtn = main_core.Tag.render`<span class="ui-alert-close-btn"></span>`;
			const alert = main_core.Tag.render`
			<div class="ui-alert ui-alert-warning ui-alert-icon-info">
				<div class="ui-alert-message">
					<div>
						<span>${main_core.Loc.getMessage('BIZPROC_AUTOMATION_BROKEN_LINK_MESSAGE_ERROR')}</span>
						${showMoreLabel}
					</div>
					${moreInfoNode}
				</div>
				${closeBtn}
			</div>
		`;
			main_core.Event.bindOnce(closeBtn, 'click', () => {
				main_core.Dom.remove(alert);
			});
			return alert;
		}
		saveRobotSettings(form, robot, callback, btnNode) {
			if (btnNode) {
				main_core.Dom.addClass(btnNode, 'ui-btn-wait');
			}
			this.onBeforeSaveRobotSettings();
			const formData = BX.ajax.prepareForm(form);
			const robotData = robot.onBeforeSaveRobotSettings(formData);
			const ajaxUrl = this.#context.ajaxUrl;
			const documentSigned = this.#context.signedDocument;
			main_core.ajax({
				method: 'POST',
				dataType: 'json',
				url: main_core.Uri.addParam(ajaxUrl, {
					analyticsLabel: `automation_robot${robot.draft ? '_draft' : ''}_save_${robot.data.Type.toLowerCase()}`,
					ajax_action: 'save_robot_settings',
					document_signed: documentSigned
				}),
				data: Helper.toJsonPayload({
					robot: robot.serialize(),
					form_data: {
						...formData.data,
						...robotData
					}
				}),
				headers: [{
					name: 'Content-Type',
					value: 'application/json'
				}],
				preparePost: false,
				onsuccess: response => {
					if (btnNode) {
						main_core.Dom.removeClass(btnNode, 'ui-btn-wait');
					}
					if (response.SUCCESS) {
						robot.updateData(response.DATA.robot);
						this.setDelaySettingsFromForm(formData.data, robot);
						this.setConditionSettingsFromForm(formData.data, robot);
						robot.draft = false;
						robot.reInit();
						this.markModified();
						if (callback) {
							callback(response.DATA);
						}
					} else {
						alert(response.ERRORS[0]);
					}
				}
			});
		}
		serialize() {
			const data = main_core.Runtime.clone(this.#data);
			data.IS_EXTERNAL_MODIFIED = this.isExternalModified() ? 1 : 0;
			data.ROBOTS = [];
			for (let i = 0; i < this.#robots.length; ++i) {
				data.ROBOTS.push(this.#robots[i].serialize());
			}
			return data;
		}
		isExternalModified() {
			return this.externalModified === true;
		}
		markExternalModified(modified) {
			this.externalModified = modified !== false;
		}
		getRobotById(id) {
			return this.#robots.find(robot => robot.getId() === id);
		}
		isModified() {
			return this.modified;
		}
		markModified(modified) {
			this.modified = modified !== false;
			if (this.modified) {
				this.emit('Template:modified');
			}
		}
		getConstants() {
			const constants = [];
			Object.keys(this.#data.CONSTANTS).forEach(id => {
				const constant = main_core.Runtime.clone(this.#data.CONSTANTS[id]);
				constant.Id = id;
				constant.ObjectId = 'Constant';
				constant.SystemExpression = `{=Constant:${id}}`;
				constant.Expression = `{{~&:${id}}}`;
				constant.SuperTitle = main_core.Loc.getMessage('BIZPROC_AUTOMATION_CMP_TEMPLATE_CONSTANTS_LIST');
				constants.push(constant);
			});
			return constants;
		}
		getConstant(id) {
			const constants = this.getConstants();
			for (const constant of constants) {
				if (constant.Id === id) {
					return constant;
				}
			}
			return null;
		}
		addConstant(property) {
			const id = property.Id || this.generatePropertyId('Constant', this.#data.CONSTANTS);
			if (this.#data.CONSTANTS[id]) {
				throw `Constant with id "${id}" is already exists`;
			}
			this.#data.CONSTANTS[id] = property;
			this.emit('Template:constant:add');
			// if (this.component)
			// {
			// 	BX.onCustomEvent(this.component, 'onTemplateConstantAdd', [this, this.getConstant(id)]);
			// }

			return this.getConstant(id);
		}
		updateConstant(id, property) {
			if (!this.#data.CONSTANTS[id]) {
				throw `Constant with id "${id}" does not exists`;
			}

			//TODO: only Description yet.
			this.#data.CONSTANTS[id].Description = property.Description;
			this.emit('Template:constant:update', {
				constant: this.getConstant(id)
			});
			// if (this.component)
			// {
			// 	BX.onCustomEvent(this.component, 'onTemplateConstantUpdate', [this, this.getConstant(id)]);
			// }

			return this.getConstant(id);
		}
		deleteConstant(id) {
			delete this.#data.CONSTANTS[id];
			return true;
		}
		setConstantValue(id, value) {
			if (this.#data.CONSTANTS[id]) {
				this.#data.CONSTANTS[id].Default = value;
				return true;
			}
			return false;
		}
		getParameters() {
			const params = [];
			Object.keys(this.#data.PARAMETERS).forEach(id => {
				const param = main_core.Runtime.clone(this.#data.PARAMETERS[id]);
				param.Id = id;
				param.ObjectId = 'Template';
				param.SystemExpression = `{=Template:${id}}`;
				param.Expression = `{{~*:${id}}}`;
				params.push(param);
			});
			return params;
		}
		getParameter(id) {
			const params = this.getParameters();
			for (const param of params) {
				if (param.Id === id) {
					return param;
				}
			}
			return null;
		}
		addParameter(property) {
			const id = property.Id || this.generatePropertyId('Parameter', this.#data.PARAMETERS);
			if (this.#data.PARAMETERS[id]) {
				throw `Parameter with id "${id}" is already exists`;
			}
			this.#data.PARAMETERS[id] = property;
			this.emit('Template:parameter:add', {
				parameter: this.getParameter(id)
			});
			// if (this.component)
			// {
			// 	BX.onCustomEvent(this.component, 'onTemplateParameterAdd', [this, this.getParameter(id)]);
			// }

			return this.getParameter(id);
		}
		updateParameter(id, property) {
			if (!this.#data.PARAMETERS[id]) {
				throw `Parameter with id "${id}" does not exists`;
			}

			// TODO: only Description yet.
			this.#data.PARAMETERS[id].Description = property.Description;
			this.emit('Template:parameter:update', {
				parameter: this.getParameter(id)
			});
			// if (this.component)
			// {
			// 	BX.onCustomEvent(this.component, 'onTemplateParameterUpdate', [this, this.getParameter(id)]);
			// }

			return this.getParameter(id);
		}
		deleteParameter(id) {
			delete this.#data.PARAMETERS[id];
			return true;
		}
		setParameterValue(id, value) {
			if (this.#data.PARAMETERS[id]) {
				this.#data.PARAMETERS[id].Default = value;
				return true;
			}
			return false;
		}
		getVariables() {
			const variables = [];
			Object.keys(this.#data.VARIABLES).forEach(id => {
				const variable = main_core.Runtime.clone(this.#data.VARIABLES[id]);
				variable.Id = id;
				variable.ObjectId = 'Variable';
				variable.SystemExpression = `{=Variable:${id}}`;
				variable.Expression = `{=Variable:${id}}`;
				variables.push(variable);
			});
			return variables;
		}
		generatePropertyId(prefix, existsList) {
			let index;
			for (index = 1; index <= 1000; ++index) {
				if (!existsList[prefix + index]) {
					break; // found
				}
			}
			return prefix + index;
		}
		collectUsages() {
			const usages = {
				Document: new Set(),
				Constant: new Set(),
				Variable: new Set(),
				Parameter: new Set(),
				GlobalConstant: new Set(),
				GlobalVariable: new Set(),
				Activity: new Set()
			};
			this.#robots.forEach(robot => {
				const robotUsages = robot.collectUsages();
				Object.keys(usages).forEach(key => {
					robotUsages[key].forEach(usage => {
						if (!usages[key].has(usage)) {
							usages[key].add(usage);
						}
					});
				});
			});
			return usages;
		}
		subscribeRobotEvents(eventName, listener) {
			this.#robots.forEach(robot => robot.subscribe(eventName, listener));
			return this;
		}
		unsubscribeRobotEvents(eventName, listener) {
			this.#robots.forEach(robot => robot.unsubscribe(eventName, listener));
			return this;
		}
		getRobotDescription(type) {
			return this.#context.availableRobots.find(item => item.CLASS === type);
		}
		get globalConstants() {
			return this.#context.automationGlobals ? this.#context.automationGlobals.globalConstants : [];
		}
		get globalVariables() {
			return this.#context.automationGlobals ? this.#context.automationGlobals.globalVariables : [];
		}
	}

	class Document {
		#rawType;
		#id;
		#title;
		#categoryId;
		#statusList;
		#currentStatusIndex;
		#fields;
		constructor(options) {
			this.#rawType = options.rawDocumentType;
			this.#id = options.documentId;
			this.#title = options.title;
			this.#categoryId = options.categoryId;
			this.#statusList = [];
			this.#currentStatusIndex = 0;
			if (main_core.Type.isArray(options.statusList)) {
				this.#statusList = options.statusList.map(status => {
					status.STATUS_ID = String(status.STATUS_ID);
					return status;
				});
				this.#currentStatusIndex = this.#statusList.findIndex(status => status.STATUS_ID === options.statusId);
			} else if (main_core.Type.isStringFilled(options.statusId)) {
				this.#statusList.push(options.statusId);
			}
			if (this.#currentStatusIndex < 0) {
				this.#currentStatusIndex = 0;
			}
			this.#fields = main_core.Type.isArray(options.documentFields) ? options.documentFields : [];
		}
		clone() {
			return new Document({
				rawDocumentType: main_core.Runtime.clone(this.#rawType),
				documentId: this.#id,
				categoryId: this.#categoryId,
				statusId: this.getCurrentStatusId(),
				statusList: main_core.Runtime.clone(this.#statusList),
				documentFields: main_core.Runtime.clone(this.#fields),
				title: this.#title
			});
		}
		get title() {
			return this.#title;
		}
		getId() {
			return this.#id;
		}
		getRawType() {
			return this.#rawType;
		}
		getCategoryId() {
			return this.#categoryId;
		}
		getCurrentStatusId() {
			const documentStatus = this.#statusList[this.#currentStatusIndex]?.STATUS_ID;
			return !main_core.Type.isNil(documentStatus) ? String(documentStatus) : documentStatus;
		}
		getSortedStatusId(index) {
			if (index >= 0 && index < this.#statusList.length) {
				return this.#statusList[index].STATUS_ID;
			}
			return null;
		}
		getNextStatusIdList() {
			return this.#statusList.slice(this.#currentStatusIndex + 1).map(status => status.STATUS_ID);
		}
		getPreviousStatusIdList() {
			return this.#statusList.slice(0, this.#currentStatusIndex).map(status => status.STATUS_ID);
		}
		setStatus(statusId) {
			const newStatusId = this.#statusList.findIndex(status => status.STATUS_ID === statusId);
			if (newStatusId >= 0) {
				this.#currentStatusIndex = newStatusId;
			}
			return this;
		}
		getFields() {
			return this.#fields;
		}
		setFields(documentFields) {
			this.#fields = documentFields;
			return this;
		}
		setStatusList(statusList) {
			if (main_core.Type.isArrayFilled(statusList)) {
				this.#statusList = statusList;
			}
			return this;
		}
		get statusList() {
			return this.#statusList;
		}
	}

	/**
	 * Robot-flavoured ConditionContext. Fields/documentType/title come from
	 * the robots designer environment (`getGlobalContext` / `Designer`); the
	 * value-selector and field-menu are built from the robots infrastructure
	 * (`SelectorManager` / `SelectorContext` / `InlineSelectorCondition`). This is the
	 * only place the condition control reaches into `bizproc.automation` internals.
	 */
	class AutomationConditionContext extends bizproc_condition.ConditionContext {
		#fields;
		constructor(options) {
			super();
			this.#fields = [];
			if (main_core.Type.isPlainObject(options) && main_core.Type.isArray(options.fields)) {
				this.#fields = options.fields;
			}
		}
		getFields() {
			return this.#fields;
		}
		setFields(fields) {
			this.#fields = main_core.Type.isArray(fields) ? fields : [];
		}
		resolveField(object, id) {
			let field;
			const robot = bizproc_automation.Designer.getInstance().robot;
			const component = bizproc_automation.Designer.getInstance().component;
			const tpl = robot ? robot.getTemplate() : null;
			switch (object) {
				case 'Document':
					for (let i = 0; i < this.#fields.length; ++i) {
						if (id === this.#fields[i].Id) {
							field = this.#fields[i];
						}
					}
					break;
				case 'Template':
					if (tpl && component && component.triggerManager) {
						field = component.triggerManager.getReturnProperty(tpl.getStatusId(), id);
					}
					break;
				case 'Constant':
					if (tpl) {
						field = tpl.getConstant(id);
					}
					break;
				case 'GlobalConst':
					if (component) {
						field = component.getConstant(id);
					}
					break;
				case 'GlobalVar':
					if (component) {
						field = component.getGVariable(id);
					}
					break;
				default:
					var foundRobot = tpl ? tpl.getRobotById(object) : null;
					if (foundRobot) {
						field = foundRobot.getReturnProperty(id);
					}
					break;
			}
			return field || this.createSyntheticField(object, id);
		}
		getDocumentType() {
			const currentDocument = bizproc_automation.Designer.getInstance().component ? bizproc_automation.Designer.getInstance().component.document : bizproc_automation.getGlobalContext().document;
			return [...currentDocument.getRawType(), currentDocument.getCategoryId()];
		}
		getTitle() {
			return bizproc_automation.getGlobalContext().document.title;
		}
		createValueSelector(node, ctx) {
			return bizproc_automation.SelectorManager.createSelectorByRole(node.dataset.role, {
				context: new bizproc_automation.SelectorContext({
					fields: bizproc_automation.getGlobalContext().document.getFields(),
					useSwitcherMenu: false,
					rootGroupTitle: ctx?.rootGroupTitle ?? bizproc_automation.getGlobalContext().document.title
				}),
				customSelectorFn: ctx?.customSelectorFn
			});
		}
		createFieldMenu(condition, ctx) {
			const globalContext = bizproc_automation.getGlobalContext();
			const fields = main_core.Runtime.clone(main_core.Type.isArrayFilled(ctx?.fields) ? ctx.fields : globalContext.document.getFields());
			const dialog = new bizproc_automation.InlineSelectorCondition({
				context: new bizproc_automation.SelectorContext({
					fields,
					rootGroupTitle: globalContext.document.title
				}),
				condition
			});
			if (main_core.Type.isFunction(ctx?.onOpenFieldMenu)) {
				dialog.subscribe('onOpenMenu', ctx.onOpenFieldMenu);
			}
			dialog.subscribe('change', event => {
				if (main_core.Type.isFunction(ctx?.onFieldChange)) {
					ctx.onFieldChange(event.getData().field);
				}
			});
			dialog.renderTo(ctx?.target);
			return dialog;
		}
	}

	/**
	 * BC wrapper. Existing consumers import `ConditionGroupSelector` from
	 * `bizproc.automation` and never pass a context; keep them working by injecting
	 * an `AutomationConditionContext` when none is supplied. The public options
	 * (`fields` / `customSelector` / `showValuesSelector`) are preserved and coexist
	 * with the context.
	 */
	class AutomationConditionGroupSelector extends bizproc_condition.ConditionGroupSelector {
		constructor(conditionGroup, options) {
			const preparedOptions = main_core.Type.isPlainObject(options) ? {
				...options
			} : {};
			if (!(preparedOptions.context instanceof bizproc_condition.ConditionContext)) {
				preparedOptions.context = new AutomationConditionContext({
					fields: main_core.Type.isArray(preparedOptions.fields) ? preparedOptions.fields : []
				});
			}

			// BC: legacy consumers pass the option as `customSelector`; the base control now
			// reads `customSelectorFn`. Map the old key so the host value selector (BPAShowSelector)
			// keeps working for read/write data storage and the filter-expression editor.
			if (preparedOptions.customSelectorFn === undefined) {
				preparedOptions.customSelectorFn = preparedOptions.customSelector;
			}
			super(conditionGroup, preparedOptions);
		}
	}

	const createNewField = (oldField, newField, objectId, modifier) => {
		const systemExpression = `{=${objectId}:${oldField.Id} ${modifier}}`;
		let expression = oldField.Expression;
		if (expression.startsWith('{{') && expression.endsWith('}}')) {
			expression = expression.replace(/^{{/, '').replace(/}}$/, '');
			if (expression.includes('#')) {
				expression = expression.slice(0, expression.indexOf('#')); // cut comment
			}
			expression = `{{${expression} ${modifier}}}`;
		} else {
			expression = systemExpression;
		}
		return {
			...main_core.Runtime.clone(oldField),
			...newField,
			ObjectId: objectId,
			Type: 'string',
			SystemExpression: systemExpression,
			Expression: expression
		};
	};
	const modifiersMap = {
		friendly: '> friendly',
		printable: '> printable',
		server: '> server',
		responsible: '> responsible',
		shortLink: '> shortlink'
	};
	function enrichFieldsWithModifiers(fields, objectId, useModifiers) {
		const canUseModifier = value => main_core.Type.isNil(value) || value === true;
		const printablePrefix = main_core.Loc.getMessage('BIZPROC_AUTOMATION_CMP_MOD_PRINTABLE_PREFIX');
		const names = fields.map(field => field.Name).join('\n');
		const result = [];
		fields.forEach(field => {
			const printableName = `${field.Name} ${printablePrefix}`;
			const isCustomField = field.BaseType === 'string' && field.Type !== 'string';
			if (!isCustomField) {
				result.push({
					...main_core.Runtime.clone(field),
					ObjectId: objectId
				});
			}
			if (field.Type === 'user' && canUseModifier(useModifiers?.friendly) && !names.includes(printableName)) {
				result.push(createNewField(field, {
					Name: printableName
				}, objectId, modifiersMap.friendly));
			}
			if ((['bool', 'file'].includes(field.Type) || isCustomField) && canUseModifier(useModifiers?.printable) && !names.includes(printableName)) {
				result.push(createNewField(field, {
					Name: printableName
				}, objectId, modifiersMap.printable));
			}
			if (['date', 'datetime', 'time'].includes(field.BaseType)) {
				if (canUseModifier(useModifiers?.server)) {
					const name = `${field.Name} ${main_core.Loc.getMessage('BIZPROC_AUTOMATION_CMP_MOD_DATE_BY_SERVER')}`;
					result.push(createNewField(field, {
						Name: name
					}, objectId, modifiersMap.server));
				}
				if (canUseModifier(useModifiers?.responsible)) {
					const name = `${field.Name} ${main_core.Loc.getMessage('BIZPROC_AUTOMATION_CMP_MOD_DATE_BY_RESPONSIBLE')}`;
					result.push(createNewField(field, {
						Name: name
					}, objectId, modifiersMap.responsible));
				}
			}
			if (field.Type === 'file' && canUseModifier(useModifiers?.shortLink)) {
				result.push(createNewField(field, {
					Id: `${field.Id}_shortlink`
				}, objectId, modifiersMap.shortLink));
			}
		});
		return result;
	}

	class Group {
		#items = [];
		#groups = {};
		#setSuperTitle;
		constructor(data) {
			if (this.constructor === Group) {
				throw new Error('Object of Abstract Class cannot be created');
			}
			if (!main_core.Type.isArray(data.fields)) {
				throw new TypeError('fields must be an array');
			}
			this.#setSuperTitle = main_core.Type.isBoolean(data.setSuperTitle) ? data.setSuperTitle : true;
		}
		get items() {
			return this.#items;
		}
		get groups() {
			return Object.values(this.#groups);
		}
		get groupsWithChildren() {
			return this.groups.filter(group => group.children.length > 0);
		}
		addGroup(groupId, group) {
			this.#groups[groupId] = this.#normalizeGroup(group);
		}
		hasGroup(groupId) {
			return Object.hasOwn(this.#groups, groupId);
		}
		addGroupItem(groupId, item) {
			if (this.hasGroup(groupId)) {
				const normalizedItem = this.#normalizeGroup(item, this.#groups[groupId].title);
				this.#groups[groupId].children.push(normalizedItem);
			}
		}
		#normalizeGroup(group, superGroupTitle = null) {
			const normalizedGroup = main_core.Runtime.clone(group);
			if (!main_core.Type.isBoolean(normalizedGroup.searchable)) {
				normalizedGroup.searchable = true;
			}
			if (!main_core.Type.isArray(normalizedGroup.children)) {
				normalizedGroup.children = [];
			}
			normalizedGroup.children = normalizedGroup.children.map(childGroup => this.#normalizeGroup(childGroup, normalizedGroup.title));
			if (this.#setSuperTitle && main_core.Type.isStringFilled(superGroupTitle) && !main_core.Type.isStringFilled(normalizedGroup.supertitle)) {
				normalizedGroup.supertitle = superGroupTitle;
			}
			if (!main_core.Type.isArrayFilled(normalizedGroup.children) && normalizedGroup.searchable === true) {
				this.#items.push(normalizedGroup);
			}
			return {
				entityId: 'bp',
				tabs: 'recents',
				...normalizedGroup
			};
		}
	}

	class GroupId {
		static DOCUMENT = 'ROOT';
		static FILES = '__FILES';
		static VARIABLES = '__GLOB_VARIABLES';
		static CONSTANTS = '__CONSTANTS';
		static ACTIVITY_RESULT = '__RESULT';
		static TRIGGER_RESULT = '__TRESULT';
	}

	class DocumentGroup extends Group {
		constructor(data) {
			super(data);
			if (!main_core.Type.isStringFilled(data.title)) {
				throw new TypeError('title must be filled string');
			}
			this.#fillGroups(data.fields, data.title);
		}
		#fillGroups(fields, title) {
			const rootGroupId = GroupId.DOCUMENT;
			this.addGroup(rootGroupId, {
				id: rootGroupId,
				title,
				searchable: false
			});
			fields.forEach(field => {
				let groupKey = field.Id.includes('.') ? field.Id.split('.')[0] : rootGroupId;
				let groupName = '';
				let fieldName = field.Name;
				if (field.Name && groupKey !== rootGroupId && field.Name.includes(': ')) {
					const names = field.Name.split(': ');
					groupName = names.shift();
					fieldName = names.join(': ');
				}
				if (field.Id.startsWith('ASSIGNED_BY_') && field.Id !== 'ASSIGNED_BY_ID' && field.Id !== 'ASSIGNED_BY_PRINTABLE') {
					groupKey = 'ASSIGNED_BY';
					const names = field.Name.split(' ');
					groupName = names.shift();
					fieldName = names.join(' ').replace('(', '').replace(')', '');
				}
				if (!this.hasGroup(groupKey)) {
					this.addGroup(groupKey, {
						id: groupKey,
						title: groupName,
						searchable: false
					});
				}
				this.addGroupItem(groupKey, {
					id: field.SystemExpression,
					title: fieldName || field.Id,
					customData: {
						field
					}
				});
			});
		}
	}

	class FileGroup extends Group {
		constructor(data) {
			super(data);
			this.#fillGroups(data.fields);
		}
		#fillGroups(fields) {
			const groupId = GroupId.FILES;
			this.addGroup(groupId, {
				id: groupId,
				title: main_core.Loc.getMessage('BIZPROC_AUTOMATION_CMP_FILES_LINKS'),
				searchable: false
			});
			fields.forEach(field => {
				let title = field.Name || field.Id;
				if (main_core.Type.isStringFilled(field.ObjectName)) {
					title = `${field.ObjectName}: ${title}`;
				}
				this.addGroupItem(groupId, {
					id: field.SystemExpression,
					// Expression,
					title,
					customData: {
						field
					}
				});
			});
		}
	}

	class InlineSelector extends main_core_events.EventEmitter {
		fieldProperty = null;
		replaceOnWrite = false;
		menuButton = null;
		targetInput = null;
		#menuGroups = {};
		basisFields = [];
		#dialog = null;
		#switcherDialog = null;
		#customSelectorFn = null;
		static #counter = 1;
		constructor(props) {
			super();
			this.setEventNamespace('BX.Bizproc.Automation.Selector');
			this.context = props.context;
			this.basisFields = this.context.fields;
			this.#customSelectorFn = props.customSelectorFn;
		}
		hasGroup(groupId) {
			return this.#menuGroups.hasOwnProperty(groupId);
		}
		addGroup(groupId, group) {
			const normalizedGroup = this.#normalizeGroup(group);
			if (this.hasGroup(groupId)) {
				this.#menuGroups[groupId] = this.#normalizeGroup(this.#mergeGroups(this.#menuGroups[groupId], normalizedGroup));
				return;
			}
			this.#menuGroups[groupId] = normalizedGroup;
		}
		#mergeGroups(originalGroup, newGroup) {
			return {
				...originalGroup,
				...newGroup,
				children: [...originalGroup.children, ...newGroup.children]
			};
		}
		addGroupItem(groupId, item) {
			if (this.hasGroup(groupId)) {
				this.#menuGroups[groupId].children.push(this.#normalizeGroup(item));
			}
		}
		#normalizeGroup(group) {
			if (!main_core.Type.isArray(group.children)) {
				group.children = [];
			}
			group.children = group.children.filter(item => item.customData?.field ? this.#shouldShowField(item.customData.field) : true).map(childGroup => this.#normalizeGroup(childGroup));
			return {
				entityId: 'bp',
				tabs: 'recents',
				...group
			};
		}
		renderWith(targetInput) {
			this.targetInput = main_core.Runtime.clone(targetInput);
			this.targetInput.setAttribute('autocomplete', 'off');
			if (this.#customSelectorFn) {
				this.targetInput.setAttribute('id', this.targetInput.getAttribute('name') + InlineSelector.#counter++);
			}
			this.menuButton = main_core.Tag.render`
			<span 
				onclick="${this.#customSelectorFn ? this.#customSelectorFn.bind(this, this.targetInput.id) : this.openMenu.bind(this)}"
				class="bizproc-automation-popup-select-dotted"
			></span>
		`;
			this.parseTargetProperties();
			this.replaceOnWrite |= this.targetInput.getAttribute('data-select-mode') === 'replace';
			return main_core.Tag.render`
			<div class="bizproc-automation-popup-select">
				${this.targetInput}
				${this.menuButton}
			</div>
		`;
		}
		renderTo(targetInput) {
			targetInput.parentNode.replaceChild(this.renderWith(targetInput), targetInput);
		}
		bindTargetEvents() {
			main_core.Event.bind(this.targetInput, 'keydown', this.#onKeyDown.bind(this));
		}
		parseTargetProperties() {
			this.fieldProperty = JSON.parse(this.targetInput.getAttribute('data-property'));
			const propertyType = this.targetInput.getAttribute('data-selector-type');
			if (!this.fieldProperty && propertyType) {
				this.fieldProperty = {
					Type: propertyType
				};
			}
			if (this.fieldProperty) {
				this.fieldProperty.Type = this.fieldProperty.Type || propertyType;
				this.#prepareSelectorUsingFieldType();
			} else {
				this.context.useSwitcherMenu = false;
			}
			this.replaceOnWrite |= this.targetInput.getAttribute('data-select-mode') === 'replace';
		}
		#prepareSelectorUsingFieldType() {
			this.basisFields = this.basisFields.filter(field => this.#shouldShowField(field));
			const type = this.fieldProperty?.Type;
			if (type === 'file') {
				this.replaceOnWrite = true;
			} else if (type === 'date' || type === 'datetime') {
				this.replaceOnWrite = true;
				const delayIntervalSelector = new bizproc_automation.DelayIntervalSelector({
					labelNode: this.targetInput,
					basisFields: this.basisFields,
					useAfterBasis: true,
					onchange: function (delay) {
						this.targetInput.value = delay.toExpression(this.basisFields, bizproc_automation.Helper.getResponsibleUserExpression(this.context.fields));
					}.bind(this)
				});
				delayIntervalSelector.init(bizproc_automation.DelayInterval.fromString(this.targetInput.value, this.basisFields));
			}
		}
		#shouldShowField(field) {
			const fieldType = this.fieldProperty?.Type;
			if (fieldType === 'file') {
				return field.Type === 'file';
			} else if (fieldType === 'date' || fieldType === 'datetime') {
				return field.Type === 'date' || field.Type === 'datetime' || field.Type === 'UF:date';
			} else if (fieldType === 'time') {
				return field.Type === 'date' || field.Type === 'datetime' || field.Type === 'time';
			}
			return true;
		}
		#onKeyDown(event) {
			if (event.keyCode === 45 && event.altKey === false && event.ctrlKey === false && event.shiftKey === false) {
				this.openMenu(event);
				event.preventDefault();
			}
		}
		openMenu(event, skipPropertiesSwitcher = false) {
			if (!skipPropertiesSwitcher && this.context.useSwitcherMenu && !this.targetInput.value) {
				return this.openPropertiesSwitcherMenu();
			}
			if (this.#dialog) {
				this.#dialog.show();
				return;
			}
			this.fillGroups();
			this.onMenuOpen();
			let menuItems = [];
			for (const group of Object.values(this.#menuGroups)) {
				if (group.children.length > 0) {
					menuItems.push(group);
				}
			}
			if (menuItems.length === 1) {
				menuItems = menuItems[0].children;
			}
			let menuId = this.menuButton.getAttribute('data-selector-id');
			if (!menuId) {
				menuId = bizproc_automation.Helper.generateUniqueId();
				this.menuButton.setAttribute('data-selector-id', menuId);
			}
			this.#dialog = new ui_entitySelector.Dialog({
				targetNode: this.menuButton,
				width: 500,
				height: 300,
				multiple: false,
				dropdownMode: true,
				enableSearch: true,
				items: this.injectDialogMenuTitles(menuItems),
				showAvatars: false,
				events: {
					'Item:onBeforeSelect': event => {
						event.preventDefault();
						const item = event.getData().item;
						this.onFieldSelect(item.getCustomData().get('field'));
					}
				},
				compactView: true
			});
			this.#dialog.show();
		}
		fillGroups() {
			this.fillFieldsGroups();
			this.fillFileGroup();
		}
		fillFieldsGroups() {
			const documentGroup = new DocumentGroup({
				fields: this.getFields(),
				title: this.context.rootGroupTitle,
				setSuperTitle: false
			});
			documentGroup.groupsWithChildren.forEach(group => {
				this.addGroup(group.id, group);
			});
		}
		fillFileGroup() {
			const fileFields = this.getFields().filter(field => field.Type === 'file');
			const fileGroup = new FileGroup({
				fields: enrichFieldsWithModifiers(fileFields, 'Document', {
					friendly: false,
					printable: false,
					server: false,
					responsible: false,
					shortLink: true
				}).filter(field => field.Type === 'string'),
				setSuperTitle: false
			});
			fileGroup.groupsWithChildren.forEach(group => {
				this.addGroup(group.id, group);
			});
		}
		onMenuOpen() {
			this.emit('onOpenMenu', {
				selector: this
			});
		}
		openPropertiesSwitcherMenu() {
			const self = this;
			main_popup.MenuManager.show(bizproc_automation.Helper.generateUniqueId(), this.menuButton, [{
				text: main_core.Loc.getMessage('BIZPROC_AUTOMATION_ASK_CONSTANT'),
				disabled: self.fieldProperty?.Type === 'file',
				onclick(event) {
					this.popupWindow.close();
					self.emit('onAskConstant', {
						fieldProperty: self.fieldProperty
					});
				}
			}, {
				text: main_core.Loc.getMessage('BIZPROC_AUTOMATION_ASK_PARAMETER'),
				onclick(event) {
					this.popupWindow.close();
					self.emit('onAskParameter', {
						fieldProperty: self.fieldProperty
					});
				}
			}, {
				text: main_core.Loc.getMessage('BIZPROC_AUTOMATION_ASK_MANUAL'),
				onclick(event) {
					this.popupWindow.close();
					self.openMenu(event, true);
				}
			}], {
				autoHide: true,
				offsetLeft: 20,
				angle: {
					position: 'top'
				},
				events: {
					onPopupClose() {
						this.destroy();
					}
				}
			});
			this.#switcherDialog = main_popup.MenuManager.currentItem;
			return true;
		}
		injectDialogMenuTitles(items) {
			items.forEach(parent => {
				if (main_core.Type.isArray(parent.children)) {
					this.injectDialogMenuSupertitles(parent.title, parent.children);
				}
			});
			return items;
		}
		injectDialogMenuSupertitles(title, children) {
			children.forEach(child => {
				if (!child.supertitle) {
					child.supertitle = title;
				}
				if (main_core.Type.isArrayFilled(child.children)) {
					this.injectDialogMenuSupertitles(child.title, child.children);
				}
			});
		}
		onFieldSelect(field) {
			if (!field) {
				return;
			}
			const inputType = this.targetInput.tagName.toLowerCase();
			if (inputType === 'select') {
				let expressionOption = this.targetInput.querySelector('[data-role="expression"]');
				if (!expressionOption) {
					expressionOption = this.targetInput.appendChild(main_core.Dom.create('option', {
						attrs: {
							'data-role': 'expression'
						}
					}));
				}
				expressionOption.setAttribute('value', field.Expression);
				expressionOption.textContent = field['Expression'];
				expressionOption.selected = true;
			} else if (inputType === 'label') {
				this.targetInput.textContent = field.Expression;
				const hiddenInput = document.getElementById(this.targetInput.getAttribute('for'));
				if (hiddenInput) {
					hiddenInput.value = field.Expression;
				}
			} else {
				if (this.replaceOnWrite) {
					this.targetInput.value = field.Expression;
					this.targetInput.selectionEnd = this.targetInput.value.length;
				} else {
					let beforePart = '';
					const middlePart = field.Expression;
					let afterPart = '';
					if (main_core.Type.isStringFilled(this.targetInput.value)) {
						beforePart = this.targetInput.value.substr(0, this.targetInput.selectionEnd);
						afterPart = this.targetInput.value.substr(this.targetInput.selectionEnd);
					}
					this.targetInput.value = beforePart + middlePart + afterPart;
					this.targetInput.selectionEnd = beforePart.length + middlePart.length;
				}
			}
			BX.fireEvent(this.targetInput, 'change');
			this.emit('Field:Selected', {
				field
			});
		}
		destroy() {
			if (this.#dialog) {
				this.#dialog.destroy();
			}
			if (this.#switcherDialog) {
				this.#switcherDialog.destroy();
			}
		}
		getFields() {
			return enrichFieldsWithModifiers(this.basisFields, 'Document', {
				shortLink: false
			});
		}
	}

	class InlineTimeSelector extends InlineSelector {
		#showDottedSelector;
		constructor(props) {
			super(props);
			this.#showDottedSelector = main_core.Type.isNil(props.showValuesSelector) ? true : main_core.Text.toBoolean(props.showValuesSelector);
		}
		renderWith(targetInput) {
			const picker = new bizproc_condition.InlineTimeSelector();
			const labelNode = picker.renderWith(targetInput);
			this.targetInput = picker.targetInput;
			this.targetInput.setAttribute('autocomplete', 'off');
			this.parseTargetProperties();
			this.replaceOnWrite = true;
			if (this.#showDottedSelector === false) {
				return labelNode;
			}
			this.menuButton = main_core.Tag.render`
			<span
				onclick="${this.openMenu.bind(this)}"
				class="bizproc-automation-popup-select-dotted"
			></span>
		`;
			return main_core.Tag.render`
			<div class="bizproc-automation-popup-select">
				${labelNode}
				${this.menuButton}
			</div>
		`;
		}
	}

	class Manager {
		static SELECTOR_ROLE_USER = 'user-selector';
		static SELECTOR_ROLE_FILE = 'file-selector';
		static SELECTOR_ROLE_INLINE = 'inline-selector-target';
		static SELECTOR_ROLE_INLINE_HTML = 'inline-selector-html';
		static SELECTOR_ROLE_TIME = 'time-selector';
		static SELECTOR_ROLE_SAVE_STATE = 'save-state-checkbox';
		static SELECTOR_ROLE_INLINE_TIME = 'inline-selector-time';
		static SELECTOR_ROLE_MENU = 'menu-selector';
		static SELECTOR_ROLE_ENTITY = 'bp-entity-selector';
		static getSelectorByTarget(targetInput) {
			// TODO - save created selectors with Manager
			const template = bizproc_automation.Designer.getInstance().getRobotSettingsDialog()?.template;
			if (template && main_core.Type.isArray(template.robotSettingsControls)) {
				return template.robotSettingsControls.find(selector => selector.targetInput === targetInput);
			}
			return undefined;
		}
		static createSelectorByRole(role, selectorProps) {
			if (role === this.SELECTOR_ROLE_USER) {
				return new bizproc_automation.UserSelector(selectorProps);
			} else if (role === this.SELECTOR_ROLE_FILE) {
				return new bizproc_automation.FileSelector(selectorProps);
			} else if (role === this.SELECTOR_ROLE_INLINE) {
				return new bizproc_automation.InlineSelector(selectorProps);
			} else if (role === this.SELECTOR_ROLE_INLINE_HTML) {
				return new bizproc_automation.InlineSelectorHtml(selectorProps);
			} else if (role === this.SELECTOR_ROLE_INLINE_TIME) {
				return new InlineTimeSelector(selectorProps);
			} else if (role === this.SELECTOR_ROLE_TIME) {
				return new bizproc_automation.TimeSelector(selectorProps);
			} else if (role === this.SELECTOR_ROLE_SAVE_STATE) {
				return new bizproc_automation.SaveStateCheckbox(selectorProps);
			} else if (role === this.SELECTOR_ROLE_MENU) {
				return new bizproc_automation.MenuSelector(selectorProps);
			} else if (role === this.SELECTOR_ROLE_ENTITY) {
				return new bizproc_automation.EntitySelector(selectorProps);
			} else {
				return undefined;
			}
		}
	}

	class InlineSelectorCondition extends InlineSelector {
		#condition;
		constructor(props) {
			super(props);
			this.#condition = props.condition;
		}
		renderTo(target) {
			this.targetInput = target;
			this.menuButton = target;
			this.parseTargetProperties();
			this.bindTargetEvents();
		}
		fillGroups() {
			this.fillFieldsGroups();
		}
		onMenuOpen() {
			this.emit('onOpenMenu', {
				selector: this,
				// TODO - rename
				isMixedCondition: this.#isMixedConditionGroup()
			});
		}
		onFieldSelect(field) {
			this.emit('change', {
				field
			});
		}
		#isMixedConditionGroup() {
			return this.#condition && this.#condition.parentGroup && this.#condition.parentGroup.type === bizproc_automation.ConditionGroup.CONDITION_TYPE.Mixed;
		}
		getFields() {
			return this.context.fields.map(field => ({
				...field,
				ObjectId: 'Document'
			}));
		}
	}

	class InlineSelectorHtml extends InlineSelector {
		#editorNode;
		#eventHandlers = {
			'OnEditorInitedAfter': this.#bindEditorHooks.bind(this)
		};
		destroy() {
			this.#unbindEvents();
		}
		renderTo(targetInput) {
			this.targetInput = targetInput;
			this.#editorNode = targetInput.querySelector('.bx-html-editor');
			this.menuButton = main_core.Tag.render`
			<span
				onclick="${this.openMenu.bind(this)}"
				class="bizproc-automation-popup-select-dotted"
			></span>
		`;
			this.parseTargetProperties();
			this.bindTargetEvents();
			targetInput.firstElementChild.appendChild(this.menuButton);
			this.#bindEvents();
		}
		#bindEvents() {
			for (const [name, handler] of Object.entries(this.#eventHandlers)) {
				BX.addCustomEvent(name, handler);
			}
		}
		#unbindEvents() {
			for (const [name, handler] of Object.entries(this.#eventHandlers)) {
				BX.removeCustomEvent(name, handler);
			}
		}
		#bindEditorHooks(editor) {
			if (editor.dom.cont !== this.#editorNode) {
				return false;
			}
			let header = '';
			let footer = '';
			const cutHeader = (content, shouldSaveHeader = false) => {
				return content.replace(/(^[\s\S]*?)(<body.*?>)/i, str => {
					if (shouldSaveHeader) {
						header = str;
					}
					return '';
				});
			};
			const cutFooter = (content, shouldSaveFooter = false) => {
				return content.replace(/(<\/body>[\s\S]*?$)/i, str => {
					if (shouldSaveFooter) {
						footer = str;
					}
					return '';
				});
			};
			BX.addCustomEvent(editor, 'OnParse', function (mode) {
				if (!mode) {
					this.content = cutFooter(cutHeader(this.content, true), true);
				}
			});
			BX.addCustomEvent(editor, 'OnAfterParse', function (mode) {
				if (mode) {
					let content = cutFooter(cutHeader(this.content));
					if (header !== '' && footer !== '') {
						content = header + content + footer;
					}
					this.content = content;
				}
			});
		}
		onFieldSelect(field) {
			const insertText = field.Expression;
			const editor = this.#getEditor();
			if (editor && editor.InsertHtml) {
				if (editor.synchro.IsFocusedOnTextarea()) {
					editor.textareaView.Focus();
					editor.textareaView.WrapWith('', '', insertText);
				} else {
					editor.InsertHtml(insertText);
				}
				editor.synchro.Sync();
			}
		}
		onBeforeSave() {
			const editor = this.#getEditor();
			if (editor && editor.SaveContent) {
				editor.SaveContent();
			}
		}
		onPopupResize() {
			const editor = this.#getEditor();
			if (editor && editor.ResizeSceleton) {
				editor.ResizeSceleton();
			}
		}
		#getEditor() {
			if (this.#editorNode) {
				const editorId = this.#editorNode.id.split('-');
				return BXHtmlEditor.Get(editorId[editorId.length - 1]);
			}
			return null;
		}
	}

	class SaveStateCheckbox {
		#context;
		#checkbox;
		#needSync;
		constructor(props) {
			this.#context = props.context;
			this.#checkbox = props.checkbox;
			this.#needSync = props.needSync;
			if (props.needSync) {
				const category = 'save_state_checkbox';
				const savedState = this.#context.get('userOptions').get(category, this.#getKey(), 'N');
				if (savedState === 'Y') {
					this.#checkbox.checked = true;
				}
			}
		}
		destroy() {
			if (this.#needSync) {
				this.#context.get('userOptions').set('save_state_checkboxes', this.#getKey(), this.#getValue());
			}
		}
		#getKey() {
			return this.#checkbox.getAttribute('data-save-state-key');
		}
		#getValue() {
			return this.#checkbox.checked ? 'Y' : 'N';
		}
	}

	const MENU_ITEM_CLASS_ACTIVE = 'menu-popup-item-accept';
	const MENU_ITEM_CLASS_INACTIVE = 'menu-popup-item-none';
	class MenuSelector extends main_core_events.EventEmitter {
		#selectedValues = new Set();
		#items;
		#menuPopup = null;
		#openMenuButton;
		#targetInput;
		#name;
		#multiple;
		#fieldName;
		#hiddenSelect;
		constructor(props) {
			super();
			this.setEventNamespace('BX.Bizproc.Automation.Selector');
			this.context = props.context;
		}
		#parseTargetProperties() {
			const config = JSON.parse(this.#targetInput.getAttribute('data-config'));
			this.#name = config.name ?? 'Notification';
			this.#fieldName = config.fieldName ?? '';
			this.#items = config.options ? this.prepareItems(config.options) : [];
			this.#multiple = config.multiple ?? false;
			if (!main_core.Type.isNil(config.selected)) {
				this.#setValues(config.selected);
			}
		}
		renderTo(targetInput) {
			this.#targetInput = targetInput;
			this.#parseTargetProperties();
			this.#openMenuButton = main_core.Tag.render`<a class="bizproc-automation-popup-settings-button">${main_core.Text.encode(this.#name)}</a>`;
			main_core.Event.bind(this.#openMenuButton, 'click', this.#onShowPopup.bind(this));
			main_core.Dom.append(this.#openMenuButton, this.#targetInput);
		}
		prepareItems(options) {
			return Object.entries(options).map(([key, value]) => ({
				title: value,
				value: key
			}));
		}
		#getPreparedMenuItems() {
			return this.#items.map(item => this.#getPreparedMenuItem(item));
		}
		#getPreparedMenuItem(item) {
			return {
				id: `menu-selector-menu-id-${item.value}`,
				className: this.#isValueSelected(item.value) ? MENU_ITEM_CLASS_ACTIVE : MENU_ITEM_CLASS_INACTIVE,
				onclick: this.#onMenuItemClick.bind(this, item.value),
				html: main_core.Text.encode(item.title)
			};
		}
		#isValueSelected(value) {
			return this.#selectedValues.has(value);
		}
		#onMenuItemClick(value, event, item) {
			if (this.#isValueSelected(value)) {
				this.#removeValue(value);
				main_core.Dom.removeClass(item.getContainer(), MENU_ITEM_CLASS_ACTIVE);
				main_core.Dom.addClass(item.getContainer(), MENU_ITEM_CLASS_INACTIVE);
			} else {
				if (this.#multiple) {
					this.#addValue(value);
				} else {
					for (const menuItem of this.#menuPopup.menuItems) {
						main_core.Dom.removeClass(menuItem.getContainer(), MENU_ITEM_CLASS_ACTIVE);
					}
					this.#setValues([value]);
				}
				main_core.Dom.removeClass(item.getContainer(), MENU_ITEM_CLASS_INACTIVE);
				main_core.Dom.addClass(item.getContainer(), MENU_ITEM_CLASS_ACTIVE);
			}
		}
		#removeValue(value) {
			this.#selectedValues.delete(value);
		}
		#addValue(value) {
			this.#selectedValues.add(value);
		}
		#onShowPopup() {
			if (!this.#menuPopup) {
				const menuItems = this.#getPreparedMenuItems();
				const menuParams = {
					closeByEsc: true,
					autoHide: true,
					cacheable: true
				};
				this.#menuPopup = main_popup.MenuManager.create(main_core.Text.getRandom(), this.#openMenuButton, menuItems, menuParams);
			}
			this.#menuPopup.show();
		}
		onBeforeSave() {
			const hiddenSelect = main_core.Tag.render`
			<select
				name="${this.#fieldName + (this.#multiple ? '[]' : '')}"
				${this.#multiple ? 'multiple' : ''}
				hidden
			>
			</select>
		`;
			for (const value of this.#selectedValues.values()) {
				if (main_core.Type.isNil(value)) {
					continue;
				}
				const hiddenOption = main_core.Tag.render`
				<option value="${value}"></option>
			`;
				hiddenOption.selected = true;
				main_core.Dom.append(hiddenOption, hiddenSelect);
			}
			if (this.#hiddenSelect) {
				main_core.Dom.replace(this.#hiddenSelect, hiddenSelect);
			} else {
				main_core.Dom.append(hiddenSelect, this.#targetInput);
			}
			this.#hiddenSelect = hiddenSelect;
		}
		#setValues(values) {
			this.#clearAll();
			values.forEach(value => {
				this.#addValue(value);
			});
		}
		#clearAll() {
			if (this.#selectedValues.size === 0) {
				return;
			}
			this.#selectedValues = new Set();
		}
		destroy() {
			this.#menuPopup?.close();
		}
	}

	class UserSelector extends InlineSelector {
		renderTo(targetInput) {
			this.targetInput = targetInput;
			this.menuButton = targetInput;
			this.fieldProperty = JSON.parse(targetInput.getAttribute('data-property'));
			if (!this.fieldProperty) {
				this.context.useSwitcherMenu = false;
			}
			const additionalUserFields = this.context.get('additionalUserFields');
			this.userSelector = BX.Bizproc.UserSelector.decorateNode(targetInput, {
				additionalFields: main_core.Type.isArray(additionalUserFields) ? additionalUserFields : []
			});
		}
		destroy() {
			super.destroy();
			if (this.userSelector) {
				this.userSelector.destroy();
				this.userSelector = null;
			}
		}
	}

	class FileSelector extends InlineSelector {
		static TYPE = {
			None: '',
			Disk: 'disk',
			File: 'file'
		};
		#type = FileSelector.TYPE.None;
		#multiple = false;
		#required = false;
		#valueInputName = '';
		#typeInputName = '';
		#useDisk = false;
		#label = '';
		#labelFile = '';
		#labelDisk = '';
		#diskUploader = null;
		#diskControllerNode = null;
		#fileItemsNode = null;
		#fileControllerNode = null;
		#inputWrapper;
		#menu;
		constructor(props) {
			super(props);
			this.context.set('fileFields', this.context.fields.filter(field => field.Type === 'file'));
		}
		destroy() {
			if (this.#menu) {
				this.#menu.close();
			}
		}
		renderTo(targetInput) {
			this.targetInput = targetInput;
			const selected = this.parseTargetProperties();
			this.targetInput.appendChild(this.#createBaseNode());
			this.#showTypeControlLayout(selected);
		}
		parseTargetProperties() {
			let config = JSON.parse(this.targetInput.getAttribute('data-config'));
			if (!main_core.Type.isPlainObject(config)) {
				config = {};
			}
			if (config.type) {
				this.#type = config.type;
			} else {
				this.#type = this.context.get('fileFields').length > 0 ? FileSelector.TYPE.File : FileSelector.TYPE.Disk;
			}
			this.#multiple = config.multiple || false;
			this.#required = config.required || false;
			this.#valueInputName = config.valueInputName || '';
			this.#typeInputName = config.typeInputName || '';
			this.#useDisk = config.useDisk || false;
			this.#label = config.label || 'Attachment';
			this.#labelFile = config.labelFile || 'File';
			this.#labelDisk = config.labelDisk || 'Disk';
			if (config.selected && config.selected.length > 0) {
				return main_core.Runtime.clone(config.selected);
			}
		}
		#createBaseNode() {
			const idSalt = bizproc_automation.Helper.generateUniqueId();
			let fileRadio = null;
			const fileTypeOptions = [];
			if (this.context.get('fileFields').length > 0) {
				fileRadio = main_core.Tag.render`
				<input
					id="type-1${idSalt}"
					class="bizproc-automation-popup-select-input"
					type="radio"
					name="${this.#typeInputName}"
					value="${FileSelector.TYPE.File}"
					${this.#type === FileSelector.TYPE.File ? 'checked' : ''}
				/>
			`;
			}
			const diskFileRadio = main_core.Tag.render`
			<input
				id="type-2${idSalt}"
				class="bizproc-automation-popup-select-input"
				type="radio"
				name="${this.#typeInputName}"
				value="${FileSelector.TYPE.Disk}"
				${this.#type === FileSelector.TYPE.Disk ? 'checked' : ''}
			/>
		`;

			// fileTypeOptions.push(Tag.render`
			// 	<span class="bizproc-automation-popup-settings-title">${this.#label}:</span>
			// `);

			if (fileRadio) {
				fileTypeOptions.push(fileRadio, main_core.Tag.render`
				<label
					class="bizproc-automation-popup-settings-link"
					for="type-1${idSalt}"
					onclick="${this.#onTypeChange.bind(this, FileSelector.TYPE.File)}"
				>
				${this.#labelFile}
				</label>
			`);
			}
			fileTypeOptions.push(diskFileRadio, main_core.Tag.render`
			<label
				class="bizproc-automation-popup-settings-link"
				for="type-2${idSalt}"
				onclick="${this.#onTypeChange.bind(this, FileSelector.TYPE.Disk)}"
			>
			${this.#labelDisk}
			</label>
		`);
			return main_core.Tag.render`
			<div class="bizproc-automation-popup-settings-block">
				<span class="bizproc-automation-popup-settings-title">${this.#label}:</span>
				<div class="bizproc-automation-popup-settings-tab-head">
					${fileTypeOptions}
				</div>							
			</div>
		`;
		}
		#showTypeControlLayout(selected) {
			if (this.#type === FileSelector.TYPE.Disk) {
				this.#hideFileControllerLayout();
				this.#showDiskControllerLayout(selected);
			} else if (this.#type === FileSelector.TYPE.File) {
				this.#hideDiskControllerLayout();
				this.#showFileControllerLayout(selected);
			} else {
				this.#hideFileControllerLayout();
				this.#hideDiskControllerLayout();
			}
		}
		#showDiskControllerLayout(selected) {
			if (this.#diskControllerNode) {
				main_core.Dom.show(this.#diskControllerNode);
			} else {
				this.#diskControllerNode = main_core.Dom.create('div');
				this.targetInput.appendChild(this.#diskControllerNode);
				const diskUploader = this.#getDiskUploader();
				diskUploader.layout(this.#diskControllerNode);
				diskUploader.show(true);
				if (selected) {
					this.addItems(selected);
				}
			}
		}
		#hideDiskControllerLayout() {
			if (this.#diskControllerNode) {
				main_core.Dom.hide(this.#diskControllerNode);
			}
		}
		#showFileControllerLayout(selected) {
			if (this.#fileControllerNode) {
				main_core.Dom.show(this.#fileControllerNode);
			} else {
				this.#fileItemsNode = main_core.Dom.create('span', {
					attrs: {
						className: 'bizproc-automation-popup-settings-tab-item-box'
					}
				});
				this.#fileControllerNode = main_core.Dom.create('div', {
					attrs: {
						className: 'bizproc-automation-popup-settings-tab-inner'
					},
					children: [this.#fileItemsNode]
				});
				this.targetInput.appendChild(this.#fileControllerNode);
				const addButtonNode = main_core.Dom.create('a', {
					attrs: {
						className: 'bizproc-automation-popup-settings-link bizproc-automation-popup-settings-link-thin'
					},
					text: main_core.Loc.getMessage('BIZPROC_AUTOMATION_CMP_ADD_FILE')
				});
				const addButtonDesc = main_core.Dom.create('div', {
					attrs: {
						className: 'bizproc-automation-popup-settings-desc'
					},
					text: main_core.Loc.getMessage('BIZPROC_AUTOMATION_CMP_ADD_FILE_LEGEND')
				});
				main_core.Dom.append(addButtonDesc, addButtonNode);
				this.#fileControllerNode.appendChild(addButtonNode);
				main_core.Event.bind(addButtonNode, 'click', this.#onFileFieldAddClick.bind(this, addButtonNode));
				if (selected) {
					this.addItems(selected);
				}
			}
		}
		#hideFileControllerLayout() {
			if (this.#fileControllerNode) {
				main_core.Dom.hide(this.#fileControllerNode);
			}
		}
		#getDiskUploader() {
			if (!this.#diskUploader) {
				this.#diskUploader = BX.Bizproc.Automation.DiskUploader.create('', {
					msg: {
						diskAttachFiles: main_core.Loc.getMessage('BIZPROC_AUTOMATION_CMP_DISK_ATTACH_FILE'),
						diskAttachedFiles: main_core.Loc.getMessage('BIZPROC_AUTOMATION_CMP_DISK_ATTACHED_FILES'),
						diskSelectFile: main_core.Loc.getMessage('BIZPROC_AUTOMATION_CMP_DISK_SELECT_FILE'),
						diskSelectFileLegend: main_core.Loc.getMessage('BIZPROC_AUTOMATION_CMP_DISK_SELECT_FILE_LEGEND_MSGVER_1'),
						diskUploadFile: main_core.Loc.getMessage('BIZPROC_AUTOMATION_CMP_DISK_UPLOAD_FILE'),
						diskUploadFileLegend: main_core.Loc.getMessage('BIZPROC_AUTOMATION_CMP_DISK_UPLOAD_FILE_LEGEND')
					}
				});
				this.#diskUploader.setMode(1);
			}
			return this.#diskUploader;
		}
		#onTypeChange(newType) {
			if (this.#type !== newType) {
				this.#type = newType;
				this.#showTypeControlLayout();
			}
		}
		#addFileItem(item) {
			if (this.#isFileItemSelected(item)) {
				return false;
			}
			const node = this.#createFileItemNode(item);
			if (!this.#multiple) {
				main_core.Dom.clean(this.#fileItemsNode);
			}
			this.#fileItemsNode.appendChild(node);
		}
		#isFileItemSelected(item) {
			return Boolean(this.#fileItemsNode.querySelector(`[data-file-id="${item.id}"]`));
		}
		addItems(items) {
			if (this.#type === FileSelector.TYPE.File) {
				for (const fileItem of items) {
					this.#addFileItem(fileItem);
				}
			} else {
				this.#getDiskUploader().setValues(FileSelector.#convertToDiskItems(items));
			}
		}
		static #convertToDiskItems(items) {
			return items.map(item => ({
				ID: item.id,
				NAME: item.name,
				SIZE: item.size,
				VIEW_URL: ''
			}));
		}
		#removeFileItem(item) {
			const itemNode = this.#fileItemsNode.querySelector(`[data-file-id="${item.id}"]`);
			if (itemNode) {
				this.#fileItemsNode.removeChild(itemNode);
			}
		}
		#onFileFieldAddClick(addButtonNode, event) {
			const self = this;
			if (!this.#menu) {
				this.#menu = main_popup.MenuManager.create(bizproc_automation.Helper.generateUniqueId(), addButtonNode, this.context.get('fileFields').map(field => ({
					text: main_core.Text.encode(field.Name),
					field,
					onclick() {
						this.popupWindow.close();
						self.onFieldSelect(field);
					}
				})), {
					autoHide: true,
					offsetLeft: main_core.Dom.getPosition(addButtonNode).width / 2,
					angle: {
						position: 'top',
						offset: 0
					}
				});
			}
			this.#menu.show();
			event.preventDefault();
		}
		onFieldSelect(field) {
			this.#addFileItem({
				id: field.Id,
				expression: field.Expression,
				name: field.Name,
				type: FileSelector.TYPE.File
			});
		}
		#createFileItemNode(item) {
			const itemField = this.context.get('fileFields').find(field => field.Expression === item.expression);
			const label = itemField?.Name || '';
			return main_core.Tag.render`
			<span
				class="bizproc-automation-popup-autocomplete-item"
				data-file-id="${item.id}"
				data-file-expression="${item.expression}"
			>
				<span class="bizproc-automation-popup-autocomplete-name">${label}</span>
				<span
					class="bizproc-automation-popup-autocomplete-delete"
					onclick="${this.#removeFileItem.bind(this, item)}"
				></span>
			</span>
		`;
		}
		onBeforeSave() {
			let ids = [];
			if (this.#type === FileSelector.TYPE.Disk) {
				ids = this.#getDiskUploader().getValues();
			} else if (this.#type === FileSelector.TYPE.File) {
				ids = [...this.#fileItemsNode.childNodes].map(node => node.getAttribute('data-file-expression')).filter(id => id !== '');
			}
			const wrapper = main_core.Tag.render`<div></div>`;
			for (const id of ids) {
				main_core.Dom.append(main_core.Tag.render`
					<input
						type="hidden"
						name="${this.#valueInputName + (this.#multiple ? '[]' : '')}"
						value="${id}"
					/>
				`, wrapper);
			}
			if (this.#inputWrapper) {
				main_core.Dom.replace(this.#inputWrapper, wrapper);
			} else {
				main_core.Dom.append(wrapper, this.targetInput);
			}
			this.#inputWrapper = wrapper;
		}
	}

	class TimeSelector extends InlineSelector {
		#clockInstance;
		destroy() {
			if (this.#clockInstance) {
				this.#clockInstance.closeWnd();
			}
		}
		renderTo(targetInput) {
			this.targetInput = targetInput; //this.targetInput = Runtime.clone(targetInput);

			const datetime = new Date();
			datetime.setHours(0, 0, 0, 0);
			datetime.setTime(datetime.getTime() + this.#getCurrentTime() * 1000);
			this.targetInput.value = this.constructor.#formatTime(datetime);
			main_core.Event.bind(targetInput, 'click', this.showClock.bind(this));
		}
		showClock() {
			if (!this.#clockInstance) {
				this.#clockInstance = new BX.CClockSelector({
					start_time: this.#getCurrentTime(),
					node: this.targetInput,
					callback: this.#onTimeSelect.bind(this)
				});
			}
			this.#clockInstance.Show();
		}
		#onTimeSelect(time) {
			this.targetInput.value = time;
			BX.fireEvent(this.targetInput, 'change');
			this.#clockInstance.closeWnd();
		}
		#getCurrentTime() {
			return this.#convertTimeToSeconds(this.targetInput.value);
		}
		#convertTimeToSeconds(time) {
			const timeParts = time.split(/[\s:]+/).map(part => parseInt(part));
			let [hours, minutes] = timeParts;
			if (timeParts.length === 3) {
				const period = timeParts[2];
				if (period === 'pm' && hours < 12) {
					hours += 12;
				} else if (period === 'am' && hours === 12) {
					hours = 0;
				}
			}
			return hours * 3600 + minutes * 60;
		}
		static #formatTime(datetime) {
			const getFormat = formatId => BX.date.convertBitrixFormat(main_core.Loc.getMessage(formatId)).replace(/:?\s*s/, '');
			const dateFormat = getFormat('FORMAT_DATE');
			const timeFormat = getFormat('FORMAT_DATETIME').replace(dateFormat, '').trim();
			return BX.date.format(timeFormat, datetime);
		}
	}

	class DelayIntervalSelector extends bizproc_condition.DelayIntervalSelector {
		constructor(options) {
			super(options);
			this.showWaitWorkDay = options?.showWaitWorkDay;
		}
		renderAdditionalSettings(uid) {
			const nodes = [this.#createSubtitle(), this.#createWorkTimeNode(uid)];
			if (this.showWaitWorkDay) {
				nodes.push(this.#createWaitWorkDayNode());
			}
			return nodes;
		}
		saveAdditionalSettings(formData) {
			this.delay.setWorkTime(formData.get('worktime'));
			this.delay.setWaitWorkDay(formData.get('wait_workday'));
		}
		#createSubtitle() {
			return main_core.Tag.render`
			<div class="bizproc-automation-popup-settings__subtitle ui-typography-heading-h6">
				${main_core.Loc.getMessage('BIZPROC_JS_AUTOMATION_DELAY_INTERVAL_ADDITIONAL_SETTINGS')}
			</div>
		`;
		}
		#createWorkTimeNode(uid) {
			const {
				root,
				workTimeCheckBox
			} = main_core.Tag.render`
			<div class="bizproc-automation-popup-settings__checkbox-label">
				<input
					ref="workTimeCheckBox"
					class="bizproc-automation-popup-settings__checkbox"
					type="checkbox"
					id="${uid}worktime"
					name="worktime"
					value="1"
					style="vertical-align: middle"
				/>
				<label for="${uid}worktime" class="bizproc-automation-popup-settings-lbl">
					${main_core.Loc.getMessage('BIZPROC_AUTOMATION_DELAY_WORK_TIME_MSGVER_1')}
				</label>
				<span
					class="bizproc-automation-status-help bizproc-automation-status-help-right"
					data-hint="${main_core.Loc.getMessage('BIZPROC_AUTOMATION_DELAY_WORK_TIME_HELP')}"
				></span>
			</div>
		`;
			if (this.delay.workTime) {
				main_core.Dom.attr(workTimeCheckBox, 'checked', 'checked');
			}
			return root;
		}
		#createWaitWorkDayNode() {
			const delay = this.delay;
			const uid = main_core.Text.getRandom();
			const isAvailable = this.#isWorkTimeAvailable();
			const {
				root,
				workDayCheckbox
			} = main_core.Tag.render`
			<div class="bizproc-automation-popup-select-item">
				<div class="bizproc-automation-popup-settings__checkbox-label">
					<input
						ref="workDayCheckbox"
						class="bizproc-automation-popup-settings__checkbox"
						type="checkbox"
						id="${`${uid}wait_workday`}"
						name="wait_workday"
						value="1"
						style="vertical-align: middle"
					/>
					<label
						class="bizproc-automation-popup-settings-lbl ${isAvailable ? '' : 'bizproc-automation-robot-btn-set-locked'}"
						for="${`${uid}wait_workday`}"
					>${main_core.Loc.getMessage('BIZPROC_AUTOMATION_DELAY_WAIT_WORK_DAY_MSGVER_1')}</label>
					<span
						class="bizproc-automation-status-help bizproc-automation-status-help-right"
						data-hint="${main_core.Loc.getMessage('BIZPROC_AUTOMATION_DELAY_WAIT_WORK_DAY_HELP')}"
					></span>
				</div>
			</div>
		`;
			if (delay.waitWorkDay && isAvailable) {
				main_core.Dom.attr(workDayCheckbox, 'checked', 'checked');
			}
			if (!isAvailable) {
				main_core.Event.bind(root, 'click', () => {
					if (top.BX.UI && top.BX.UI.InfoHelper) {
						top.BX.UI.InfoHelper.show('limit_office_worktime_responsible');
					}
				});
				workDayCheckbox.disabled = true;
			}
			return root;
		}
		#isWorkTimeAvailable() {
			return tryGetGlobalContext()?.get('IS_WORKTIME_AVAILABLE') ?? false;
		}
	}

	class SelectorContext extends BaseContext {
		constructor(props) {
			super(props);
		}
		get fields() {
			const fields = this.get('fields');
			return main_core.Type.isArray(fields) ? fields : [];
		}
		get useSwitcherMenu() {
			return main_core.Type.isBoolean(this.get('useSwitcherMenu')) ? this.get('useSwitcherMenu') : false;
		}
		set useSwitcherMenu(value) {
			this.set('useSwitcherMenu', value);
		}
		get rootGroupTitle() {
			return this.get('rootGroupTitle') ?? '';
		}
	}

	class AutomationGlobals {
		#globalVariables = [];
		#globalConstants = [];
		constructor(parameters) {
			if (main_core.Type.isArrayFilled(parameters.variables)) {
				const variables = [];
				parameters.variables.forEach(property => {
					variables.push(this.#getAutomationGlobalsProperty(property.Id, property, bizproc_globals.Globals.Manager.Instance.mode.variable));
				});
				this.#globalVariables = variables;
			}
			if (main_core.Type.isArrayFilled(parameters.constants)) {
				const constants = [];
				parameters.constants.forEach(property => {
					constants.push(this.#getAutomationGlobalsProperty(property.Id, property, bizproc_globals.Globals.Manager.Instance.mode.constant));
				});
				this.#globalConstants = constants;
			}
		}
		get globalVariables() {
			return this.#globalVariables;
		}
		set globalVariables(variables) {
			if (!main_core.Type.isArray(variables)) {
				return;
			}
			this.#globalVariables = variables;
		}
		get globalConstants() {
			return this.#globalConstants;
		}
		set globalConstants(constants) {
			if (!main_core.Type.isArray(constants)) {
				return;
			}
			this.#globalConstants = constants;
		}
		#isCorrectMode(mode) {
			return main_core.Type.isStringFilled(mode) && Object.values(bizproc_globals.Globals.Manager.Instance.mode).includes(mode);
		}
		#getAutomationGlobalsProperty(id, property, mode) {
			return {
				ObjectId: this.#getObjectId(mode),
				SuperTitle: String(property.VisibilityName),
				Id: String(id),
				Name: String(property.Name),
				Type: String(property.Type),
				BaseType: String(property.BaseType || property.Type),
				Expression: main_core.Type.isStringFilled(property.Expression) ? property.Expression : this.#getExpression(property.Name, property.VisibilityName),
				SystemExpression: main_core.Type.isStringFilled(property.SystemExpression) ? property.SystemExpression : this.#getSystemExpression(mode, id),
				Options: property.Options,
				Multiple: main_core.Type.isBoolean(property.Multiple) ? property.Multiple : property.Multiple === 'Y',
				Visibility: String(property.Visibility)
			};
		}
		#getExpression(name, visibilityName) {
			return '{{' + String(visibilityName) + ': ' + String(name) + '}}';
		}
		#getSystemExpression(mode, id) {
			return '{=' + this.#getObjectId(mode) + ':' + String(id) + '}';
		}
		#getObjectId(mode) {
			return mode === bizproc_globals.Globals.Manager.Instance.mode.variable ? 'GlobalVar' : 'GlobalConst';
		}
		updateGlobals(mode, updatedGlobals) {
			if (!this.#isCorrectMode(mode) || Object.keys(updatedGlobals).length < 1) {
				return;
			}
			let globals = this.#getGlobals(mode);
			const newGlobals = [];
			for (const id in updatedGlobals) {
				const property = updatedGlobals[id];
				const index = globals.findIndex(prop => prop.Id === id);
				if (index > -1) {
					if (globals[index].Name !== property.Name) {
						globals[index].Name = property.Name;
						globals[index].Expression = this.#getExpression(property.Name, property.VisibilityName);
					}
					continue;
				}
				newGlobals.push(this.#getAutomationGlobalsProperty(id, property, mode));
			}
			if (main_core.Type.isArrayFilled(newGlobals)) {
				globals = globals.concat(newGlobals);
			}
			this.#setGlobals(mode, globals);
		}
		deleteGlobals(mode, deletedGlobals) {
			if (!this.#isCorrectMode(mode) || !main_core.Type.isArrayFilled(deletedGlobals)) {
				return;
			}
			const globals = this.#getGlobals(mode);
			deletedGlobals.forEach(id => {
				const index = globals.findIndex(prop => prop.Id === id);
				if (index > -1) {
					globals.splice(index, 1);
				}
			});
			this.#setGlobals(mode, globals);
		}
		#getGlobals(mode) {
			if (mode === bizproc_globals.Globals.Manager.Instance.mode.variable) {
				return this.globalVariables;
			}
			if (mode === bizproc_globals.Globals.Manager.Instance.mode.constant) {
				return this.globalConstants;
			}
		}
		#setGlobals(mode, globals) {
			if (mode === bizproc_globals.Globals.Manager.Instance.mode.variable) {
				this.#globalVariables = globals;
			}
			if (mode === bizproc_globals.Globals.Manager.Instance.mode.constant) {
				this.#globalConstants = globals;
			}
		}
	}

	class Statuses {
		#nodes = [];
		#lastColorStatusIndex = -1;
		#defaultStatusColor = '#d4d6da';
		constructor(stagesContainerNode) {
			const stagesContainer = stagesContainerNode.querySelector('.bizproc-automation-status-list');
			if (stagesContainer) {
				this.#nodes = stagesContainer.querySelectorAll('[data-role="automation-status-title"]');
			}
		}
		init(templates) {
			const context = bizproc_automation.getGlobalContext();
			if (context.document.getId() <= 0) {
				this.#lastColorStatusIndex = this.#nodes.length - 1;
			} else {
				this.#lastColorStatusIndex = templates.findIndex(template => template.getStatusId() === context.document.getCurrentStatusId());
			}
		}
		fixColors() {
			this.#fixBackgroundColors();
			this.#fixTitleColors();
		}
		#fixBackgroundColors() {
			this.#nodes.forEach((statusNode, index) => {
				const backgroundNode = statusNode.querySelector('.bizproc-automation__status--bg');
				if (backgroundNode) {
					const color = this.#isColorStatus(index) && statusNode.dataset.bgcolor ? statusNode.dataset.bgcolor : this.#defaultStatusColor;
					main_core.Dom.style(backgroundNode, {
						backgroundColor: color,
						borderColor: color
					});
				}
			});
		}
		#fixTitleColors() {
			this.#nodes.forEach((statusNode, index) => {
				if (!this.#isColorStatus(index)) {
					return;
				}
				const backgroundColor = statusNode.dataset.bgcolor;
				if (backgroundColor) {
					const bigint = parseInt(backgroundColor, 16);
					const red = bigint >> 16 & 255;
					const green = bigint >> 8 & 255;
					const blue = bigint & 255;
					const isDarkColor = 0.21 * red + 0.72 * green + 0.07 * blue < 145;
					if (isDarkColor) {
						main_core.Dom.style(statusNode, 'color', 'white');
					}
				}
			});
		}
		#isColorStatus(index) {
			return index <= this.#lastColorStatusIndex;
		}
	}

	class ConstantGroup extends Group {
		constructor(data) {
			super(data);
			this.#fillGroups(data.fields);
		}
		#fillGroups(fields) {
			const groupId = GroupId.CONSTANTS;
			this.addGroup(groupId, {
				id: groupId,
				title: main_core.Loc.getMessage('BIZPROC_AUTOMATION_CMP_CONSTANTS_LIST'),
				searchable: false
			});
			fields.forEach(field => {
				this.addGroupItem(groupId, {
					id: field.SystemExpression,
					title: field.Name || field.Id,
					supertitle: field.SuperTitle || '',
					customData: {
						field
					}
				});
			});
		}
	}

	class ActivityResultGroup extends Group {
		constructor(data) {
			super(data);
			if (!main_core.Type.isStringFilled(data.title)) {
				throw new TypeError('title must be filled string');
			}
			this.#fillGroups(data.fields, data.title);
		}
		#fillGroups(activities, title) {
			const groupId = GroupId.ACTIVITY_RESULT;
			this.addGroup(groupId, {
				id: groupId,
				title,
				searchable: false
			});
			activities.forEach(activity => {
				this.addGroupItem(groupId, {
					id: activity.id,
					title: activity.title,
					searchable: false,
					children: activity.fields.map(field => ({
						id: field.SystemExpression,
						// Expression
						title: field.Name,
						customData: {
							field
						}
					}))
				});
			});
		}
	}

	class TriggerResultGroup extends Group {
		constructor(data) {
			super(data);
			this.#fillGroups(data.fields);
		}
		#fillGroups(groups) {
			const groupId = GroupId.TRIGGER_RESULT;
			this.addGroup(groupId, {
				id: groupId,
				title: main_core.Loc.getMessage('BIZPROC_JS_AUTOMATION_SELECTOR_GROUP_MANAGER_TRIGGER_LIST'),
				searchable: false
			});
			groups.forEach(group => {
				this.addGroupItem(groupId, {
					id: group.id,
					title: group.title,
					searchable: false,
					children: group.fields.map(field => ({
						id: field.SystemExpression,
						title: field.Name,
						customData: {
							field
						}
					}))
				});
			});
		}
	}

	class VariableGroup extends Group {
		constructor(data) {
			super(data);
			this.#fillGroups(data.fields);
		}
		#fillGroups(fields) {
			const groupId = GroupId.VARIABLES;
			this.addGroup(groupId, {
				id: groupId,
				title: main_core.Loc.getMessage('BIZPROC_AUTOMATION_CMP_GLOB_VARIABLES_LIST_1'),
				searchable: false
			});
			fields.forEach(field => {
				this.addGroupItem(groupId, {
					id: field.SystemExpression,
					title: field.Name || field.Id,
					supertitle: field.SuperTitle || '',
					customData: {
						field
					}
				});
			});
		}
	}

	class SelectorItemsManager {
		#documentFields = [];
		#documentTitle = main_core.Loc.getMessage('BIZPROC_JS_AUTOMATION_SELECTOR_GROUP_MANAGER_DOCUMENT_GROUP_TITLE');
		#linkFiles = [];
		#variables = [];
		#constants = [];
		#activityResultFields = [];
		#activityResultFieldsTitle = main_core.Loc.getMessage('BIZPROC_AUTOMATION_CMP_ROBOT_LIST');
		#triggerResultFields = [];
		constructor(data) {
			if (main_core.Type.isArray(data.documentFields)) {
				this.#setDocumentFields(data.documentFields);
			}
			if (main_core.Type.isStringFilled(data.documentTitle)) {
				this.#documentTitle = data.documentTitle;
			}
			if (main_core.Type.isArray(data.variables)) {
				this.#setVariables(data.variables);
			}
			if (main_core.Type.isArray(data.globalVariables)) {
				this.#setVariables(data.globalVariables);
			}
			if (main_core.Type.isArray(data.constants)) {
				this.#setConstants(data.constants);
			}
			if (main_core.Type.isArray(data.globalConstants)) {
				this.#setConstants(data.globalConstants);
			}

			// todo: activity
			if (main_core.Type.isArray(data.activityResultFields)) {
				this.#setActivityResultFields(data.activityResultFields);
			}
			if (main_core.Type.isStringFilled(data.activityResultFieldsTitle)) {
				this.#activityResultFieldsTitle = data.activityResultFieldsTitle;
			}
			if (main_core.Type.isArray(data.triggerResultFields)) {
				this.#setTriggerResultFields(data.triggerResultFields);
			}
		}
		#setDocumentFields(documentFields) {
			documentFields.forEach(field => {
				if (this.#isFileShortLinkField(field)) {
					this.#linkFiles.push(main_core.Runtime.clone(field));
					return;
				}
				this.#documentFields.push(main_core.Runtime.clone(field));
			});
		}
		#setVariables(variables) {
			variables.forEach(variable => {
				this.#variables.push({
					...main_core.Runtime.clone(variable)
				});
			});
		}
		#setConstants(constants) {
			constants.forEach(constant => {
				this.#constants.push({
					...main_core.Runtime.clone(constant)
				});
			});
		}
		#setActivityResultFields(activities) {
			activities.forEach(activity => {
				const fields = [];
				activity.fields.forEach(field => {
					if (this.#isFileShortLinkField(field)) {
						this.#linkFiles.push(main_core.Runtime.clone(field));
						return;
					}
					fields.push(main_core.Runtime.clone(field));
				});
				this.#activityResultFields.push({
					id: activity.id,
					title: activity.title,
					fields
				});
			});
		}
		#setTriggerResultFields(fields) {
			const groups = {};
			fields.forEach(field => {
				const groupId = field.ObjectRealId;
				if (!groupId) {
					return;
				}
				if (!Object.hasOwn(groups, groupId)) {
					groups[groupId] = {
						id: groupId,
						title: field.ObjectName,
						fields: []
					};
				}
				groups[groupId].fields.push({
					...main_core.Runtime.clone(field)
				});
			});
			this.#triggerResultFields.push(...Object.values(groups));
		}
		#isFileShortLinkField(field) {
			return field.Id.endsWith('_shortlink') && field.Type === 'string';
		}
		get groupsWithChildren() {
			const documentGroup = new DocumentGroup({
				fields: this.#documentFields,
				title: this.#documentTitle
			});
			const fileGroup = new FileGroup({
				fields: this.#linkFiles
			});
			const variablesGroup = new VariableGroup({
				fields: this.#variables
			});
			const constantsGroup = new ConstantGroup({
				fields: this.#constants
			});
			const robotResultGroup = new ActivityResultGroup({
				fields: this.#activityResultFields,
				title: this.#activityResultFieldsTitle
			});
			const triggerResultGroup = new TriggerResultGroup({
				fields: this.#triggerResultFields
			});
			return [...documentGroup.groupsWithChildren, ...fileGroup.groupsWithChildren, ...robotResultGroup.groupsWithChildren, ...constantsGroup.groupsWithChildren, ...variablesGroup.groupsWithChildren, ...triggerResultGroup.groupsWithChildren];
		}
		get items() {
			const documentGroup = new DocumentGroup({
				fields: this.#documentFields,
				title: this.#documentTitle
			});
			const fileGroup = new FileGroup({
				fields: this.#linkFiles
			});
			const variablesGroup = new VariableGroup({
				fields: this.#variables
			});
			const constantsGroup = new ConstantGroup({
				fields: this.#constants
			});
			const robotResultGroup = new ActivityResultGroup({
				fields: this.#activityResultFields,
				title: this.#activityResultFieldsTitle
			});
			const triggerResultGroup = new TriggerResultGroup({
				fields: this.#triggerResultFields
			});
			return [...documentGroup.items, ...fileGroup.items, ...variablesGroup.items, ...constantsGroup.items, ...robotResultGroup.items, ...triggerResultGroup.items];
		}
	}

	class EntitySelector extends InlineSelector {
		renderTo(targetInput) {
			this.targetInput = targetInput;
			this.menuButton = targetInput;
			this.fieldProperty = JSON.parse(targetInput.getAttribute('data-property'));
			if (!this.fieldProperty) {
				this.context.useSwitcherMenu = false;
			}
			this.entitySelector = BX.Bizproc.EntitySelector.decorateNode(targetInput, {
				tagMaxWidth: 149
			});
		}
		destroy() {
			super.destroy();
			if (this.entitySelector) {
				this.entitySelector.destroy();
				this.entitySelector = null;
			}
		}
	}

	class BeginningGuide {
		#guide;
		constructor(options) {
			if (!main_core.Type.isElementNode(options.target)) {
				throw 'options.target must be Node Element';
			}
			const text = main_core.Type.isStringFilled(options.text) ? options.text : main_core.Loc.getMessage('BIZPROC_AUTOMATION_TOUR_GUIDE_BEGINNING_SUBTITLE_1');
			const article = main_core.Type.isStringFilled(options.article) ? main_core.Text.toInteger(options.article) : '';
			this.#guide = new ui_tour.Guide({
				steps: [{
					target: options.target,
					title: main_core.Loc.getMessage('BIZPROC_AUTOMATION_TOUR_GUIDE_BEGINNING_TITLE'),
					text,
					article,
					condition: {
						top: true,
						bottom: false,
						color: 'primary'
					},
					position: 'bottom'
				}],
				onEvents: true
			});
			this.#guide.getPopup().setAutoHide(true);
		}
		start() {
			this.#guide.showNextStep();
		}
	}

	class AutomationGuide {
		#isShownRobotGuide = true;
		#isShownTriggerGuide = true;
		#isShownSupportingRobotGuide = false;
		#showRobotGuide = false;
		#showTriggerGuide = false;
		#showSupportingRobotGuide = false;
		#guideTargets = {};
		constructor(options) {
			if (main_core.Type.isBoolean(options.isShownRobotGuide)) {
				this.#isShownRobotGuide = options.isShownRobotGuide;
			}
			if (main_core.Type.isBoolean(options.isShownTriggerGuide)) {
				this.#isShownTriggerGuide = options.isShownTriggerGuide;
			}
		}
		get isShownRobotGuide() {
			return this.#isShownRobotGuide;
		}
		get isShownTriggerGuide() {
			return this.#isShownTriggerGuide;
		}
		setShowRobotGuide(show, target) {
			this.#showRobotGuide = show;
			if (show) {
				this.#guideTargets['robot'] = target ?? null;
			}
		}
		setShowTriggerGuide(show, target) {
			this.#showTriggerGuide = show;
			if (show) {
				this.#guideTargets['trigger'] = target ?? null;
			}
		}
		setShowSupportingRobotGuide(show, target) {
			this.#showSupportingRobotGuide = show;
			if (show) {
				this.#guideTargets['supportingRobot'] = target ?? null;
			}
		}
		#resolveShowGuides() {
			// settings
			if (this.#isShownTriggerGuide) {
				this.#showTriggerGuide = false;
			}
			if (this.#isShownSupportingRobotGuide) {
				this.#showSupportingRobotGuide = false;
				this.#isShownRobotGuide = true;
			}
			if (this.#isShownRobotGuide) {
				this.#showRobotGuide = false;
			}

			// logic
			if (this.#showSupportingRobotGuide) {
				this.#isShownRobotGuide = true;
			}
		}
		#getGuide() {
			let guide = null;
			if (this.#showSupportingRobotGuide) {
				if (main_core.Type.isDomNode(this.#guideTargets['supportingRobot'])) {
					guide = this.#getSupportingRobotGuide();
					guide.getPopup().setAutoHide(true);
				}
				return guide;
			}
			if (this.#showTriggerGuide) {
				if (main_core.Type.isDomNode(this.#guideTargets['trigger'])) {
					guide = this.#getTriggerGuide();
					guide.getPopup().setAutoHide(true);
				}
				return guide;
			}
			if (this.#showRobotGuide) {
				if (main_core.Type.isDomNode(this.#guideTargets['robot'])) {
					guide = this.#getRobotGuide();
					guide.getPopup().setAutoHide(true);
				}
				return guide;
			}
			return guide;
		}
		start() {
			this.#resolveShowGuides();
			const guide = this.#getGuide();
			if (guide) {
				const bindElement = guide.getCurrentStep().target;
				if (main_core.Type.isDomNode(bindElement) && document.body.contains(bindElement)) {
					guide.showNextStep();
				}
			}
		}
		#getRobotGuide() {
			return new ui_tour.Guide({
				steps: [{
					target: this.#guideTargets['robot'],
					title: main_core.Loc.getMessage('BIZPROC_AUTOMATION_TOUR_GUIDE_ROBOT_TITLE_1'),
					text: this.constructor.#getText([main_core.Loc.getMessage('BIZPROC_AUTOMATION_TOUR_GUIDE_ROBOT_SUBTITLE_1'), main_core.Loc.getMessage('BIZPROC_AUTOMATION_TOUR_GUIDE_ROBOT_SUBTITLE_2')]),
					article: '16547618',
					condition: {
						top: false,
						bottom: true,
						color: 'primary'
					},
					position: 'top',
					events: {
						'onShow': () => {
							this.#isShownRobotGuide = true;
						}
					}
				}],
				onEvents: true
			});
		}
		#getTriggerGuide() {
			return new ui_tour.Guide({
				steps: [{
					target: this.#guideTargets['trigger'],
					title: main_core.Loc.getMessage('BIZPROC_AUTOMATION_TOUR_GUIDE_TRIGGER_TITLE_1'),
					text: this.constructor.#getText([main_core.Loc.getMessage('BIZPROC_AUTOMATION_TOUR_GUIDE_TRIGGER_SUBTITLE_1'), main_core.Loc.getMessage('BIZPROC_AUTOMATION_TOUR_GUIDE_TRIGGER_SUBTITLE_2')]),
					article: '16547632',
					condition: {
						top: false,
						bottom: true,
						color: 'primary'
					},
					position: 'top',
					events: {
						'onShow': () => {
							this.#isShownTriggerGuide = true;
						}
					}
				}],
				onEvents: true
			});
		}
		#getSupportingRobotGuide() {
			return new ui_tour.Guide({
				steps: [{
					target: this.#guideTargets['supportingRobot'],
					title: main_core.Loc.getMessage('BIZPROC_AUTOMATION_TOUR_GUIDE_SUPPORTING_ROBOT_TITLE'),
					text: this.constructor.#getText([main_core.Loc.getMessage('BIZPROC_AUTOMATION_TOUR_GUIDE_SUPPORTING_ROBOT_SUBTITLE_1'), main_core.Loc.getMessage('BIZPROC_AUTOMATION_TOUR_GUIDE_SUPPORTING_ROBOT_SUBTITLE_2')]),
					article: '16547644',
					condition: {
						top: false,
						bottom: true,
						color: 'primary'
					},
					position: 'top',
					events: {
						'onShow': () => {
							this.#isShownSupportingRobotGuide = true;
						}
					}
				}],
				onEvents: true
			});
		}
		static #getText(subtitles) {
			let text = `<ul class="bizproc-automation-tour-guide-list">`;
			for (const subtitle of subtitles) {
				text += `<li class="bizproc-automation-tour-guide-list-item"> ${main_core.Text.encode(subtitle)} </li>`;
			}
			text += `</ul>`;
			return text;
		}
	}

	let contextInstance;
	function getGlobalContext() {
		if (contextInstance instanceof Context) {
			return contextInstance;
		}
		throw new Error('Context is not initialized yet');
	}
	function tryGetGlobalContext() {
		try {
			return getGlobalContext();
		} catch (error) {
			return null;
		}
	}
	function setGlobalContext(context) {
		if (context instanceof Context) {
			contextInstance = context;
		} else {
			throw new Error('Unsupported Context');
		}
		return context;
	}

	exports.Condition = bizproc_condition.Condition;
	exports.ConditionGroup = bizproc_condition.ConditionGroup;
	exports.DelayInterval = bizproc_condition.DelayInterval;
	exports.AutomationConditionContext = AutomationConditionContext;
	exports.AutomationGlobals = AutomationGlobals;
	exports.AutomationGuide = AutomationGuide;
	exports.BeginningGuide = BeginningGuide;
	exports.ConditionGroupSelector = AutomationConditionGroupSelector;
	exports.Context = Context;
	exports.DelayIntervalSelector = DelayIntervalSelector;
	exports.Designer = Designer;
	exports.Document = Document;
	exports.EntitySelector = EntitySelector;
	exports.FileSelector = FileSelector;
	exports.HelpHint = HelpHint;
	exports.Helper = Helper;
	exports.InlineSelector = InlineSelector;
	exports.InlineSelectorCondition = InlineSelectorCondition;
	exports.InlineSelectorHtml = InlineSelectorHtml;
	exports.MenuSelector = MenuSelector;
	exports.Robot = Robot;
	exports.RobotEntry = RobotEntry;
	exports.SaveStateCheckbox = SaveStateCheckbox;
	exports.SelectorContext = SelectorContext;
	exports.SelectorItemsManager = SelectorItemsManager;
	exports.SelectorManager = Manager;
	exports.Statuses = Statuses;
	exports.Template = Template;
	exports.TemplateScope = TemplateScope;
	exports.TemplatesScheme = TemplatesScheme;
	exports.TimeSelector = TimeSelector;
	exports.Tracker = Tracker;
	exports.TrackingEntry = TrackingEntry;
	exports.TrackingEntryBuilder = TrackingEntryBuilder;
	exports.TrackingStatus = TrackingStatus;
	exports.Trigger = Trigger;
	exports.TriggerEntry = TriggerEntry;
	exports.TriggerManager = TriggerManager;
	exports.UserOptions = UserOptions;
	exports.UserSelector = UserSelector;
	exports.ViewMode = ViewMode;
	exports.WorkflowStatus = WorkflowStatus;
	exports.enrichFieldsWithModifiers = enrichFieldsWithModifiers;
	exports.getGlobalContext = getGlobalContext;
	exports.setGlobalContext = setGlobalContext;
	exports.tryGetGlobalContext = tryGetGlobalContext;

})(this.BX.Bizproc.Automation = this.BX.Bizproc.Automation || {}, BX, BX.Event, BX.Bizproc.Automation, BX.UI, BX.Main, BX.UI, BX.UI, BX.UI.Notification, BX.Bizproc, BX.UI.EntitySelector, BX.Bizproc, window, BX, BX.UI.Tour);
//# sourceMappingURL=automation.bundle.js.map
