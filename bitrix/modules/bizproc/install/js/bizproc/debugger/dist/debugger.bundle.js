/* eslint-disable */
this.BX = this.BX || {};
this.BX.Bizproc = this.BX.Bizproc || {};
(function (exports, main_core, main_popup, bizproc_automation, main_core_events, ui_buttons, ui_buttons_icons, ui_iconSet_outline, ui_entitySelector, bp_field_type, ui_layoutForm, ui_hint, ui_dialogs_messagebox, bizproc_debugger, main_date, bizproc_condition, main_loader, ui_fonts_robotomono, bizproc_localSettings, pull_client, ui_tour) {
	'use strict';

	class DebuggerState {
		static Run = 0;
		static NextStep = 1;
		static Stop = 2;
		static Pause = 3;
		static Undefined = -1;
	}

	class Helper {
		/** Finds whether a variable is a number or a numeric string */
		static isNumeric(num) {
			if (main_core.Type.isNumber(num)) {
				return true;
			}
			if (!main_core.Type.isStringFilled(num)) {
				return false;
			}
			return Number(num).toString() === num.trim();
		}

		/** Checks whether the variable is a date or a timestamp */
		static isDate(date) {
			if (main_core.Type.isDate(date)) {
				return true;
			}
			if (!Helper.isNumeric(date)) {
				return false;
			}
			return new Date(Number(date)).getTime() === Number(date);
		}

		/** Convert date from DataBase to date in JS */
		static convertDateFromDB(date) {
			if (!Helper.isNumeric(date)) {
				return null;
			}
			return new Date(date * 1000);
		}

		/** if the variable is a date or a timestamp return Date, else null  */
		static toDate(date) {
			if (main_date.DateTimeFormat.parse(date)) {
				return main_date.DateTimeFormat.parse(date, false);
			}
			if (Date.parse(date)) {
				return new Date(date);
			}
			if (!Helper.isDate(date)) {
				return null;
			}
			if (main_core.Type.isDate(date)) {
				return date;
			}
			return Helper.convertDateFromDB(date);
		}

		/** formats the date */
		static formatDate(format, date) {
			if (!main_core.Type.isStringFilled(format)) {
				format = 'j F Y H:i:s';
			}
			return main_date.DateTimeFormat.format(format, date);
		}

		/** return condition operators label */
		static getOperatorsLabel() {
			return bizproc_condition.Operator.getAllLabels();
		}

		/** return condition operator label */
		static getOperatorLabel(operator) {
			return bizproc_condition.Operator.getOperatorLabel([operator]);
		}

		/** return joiner label */
		static getJoinerLabel(joiner) {
			const joiners = {
				'AND': main_core.Loc.getMessage('BIZPROC_JS_DEBUGGER_LOG_CONDITION_AND'),
				'OR': main_core.Loc.getMessage('BIZPROC_JS_DEBUGGER_LOG_CONDITION_OR')
			};
			return joiners[joiner];
		}
		static getColorBrightness(bgColor) {
			if (bgColor[0] === '#') {
				bgColor = bgColor.replace('#', '');
			}
			const bigint = parseInt(bgColor, 16);
			const r = bigint >> 16 & 255;
			const g = bigint >> 8 & 255;
			const b = bigint & 255;
			return 0.21 * r + 0.72 * g + 0.07 * b;
		}
		static getBgColorAdditionalClass(bgColor) {
			const brightness = Helper.getColorBrightness(bgColor);
			if (brightness > 224) {
				return '--with-border --light-color';
			}
			if (brightness > 145) {
				return '--light-color';
			}
			return '';
		}
		static toHtml(text) {
			return main_core.Text.encode(text || '').replace(/\[(\/)?b\]/ig, '<$1b>');
		}
	}

	class AutomationMainView extends main_core_events.EventEmitter {
		#debuggerInstance;
		#popupInstance;
		#loaded = false;
		#node;
		#triggerManager;
		#template;
		#tracker;
		#tabs = ['doc', 'log'];
		#expandedMinWidth = 781;
		#expandedMinHeight = 612;
		#collapsedMinWidth = 465;
		#collapsedMinHeight = 187;
		#changingViewTimeout;
		#buttonPlay;
		constructor(debuggerInstance) {
			super();
			this.setEventNamespace('BX.Bizproc.Debugger.AutomationMainView');
			this.#debuggerInstance = debuggerInstance;
			debuggerInstance.subscribe('onDocumentStatusChanged', this.#onDocumentStatusChanged.bind(this));
			debuggerInstance.subscribe('onWorkflowEventsChanged', this.#onWorkflowEventsChanged.bind(this));
			debuggerInstance.subscribe('onWorkflowTrackAdded', this.#onWorkflowTrackAdded.bind(this));
			debuggerInstance.subscribe('onDocumentValuesUpdated', this.#onDocumentValuesUpdated.bind(this));
			debuggerInstance.subscribe('onWorkflowStatusChanged', this.#onWorkflowStatusChange.bind(this));
			debuggerInstance.subscribe('onAfterDocumentFixed', this.#onAfterDocumentFixed.bind(this));
		}
		get debugger() {
			return this.#debuggerInstance;
		}
		show() {
			if (this.#loaded) {
				this.#getPopup().show();
				return;
			}
			this.debugger.loadMainViewInfo().then(() => {
				this.#loaded = true;
				this.#getPopup().setContent(this.#getNode());
				this.#setDebuggerState(this.debugger.getState());
				this.#getPopup().show();
			});
		}
		showExpanded() {
			if (!this.#getPopup().isShown()) {
				this.debugger.settings.set('popup-collapsed', false);
				this.show();
				return;
			}
			this.#handleCollapse();
		}
		showCollapsed() {
			this.debugger.settings.set('popup-collapsed', true);
			this.show();
		}
		close() {
			this.#getPopup().close();
		}
		destroy() {
			this.close();
			//TODO - cleanup
		}
		#getPopup() {
			if (!this.#popupInstance) {
				const collapsed = this.debugger.settings.get('popup-collapsed');
				const className = 'bizproc-debugger-automation__main-popup bizproc-debugger-automation__scope';
				this.#popupInstance = new main_popup.Popup({
					className: className + (collapsed ? ' --collapse' : ''),
					titleBar: this.#getPopupTitleBar(),
					noAllPaddings: true,
					contentBackground: 'white',
					draggable: true,
					zIndexOptions: {
						alwaysOnTop: collapsed
					},
					width: this.#getPopupWidth(collapsed),
					height: this.#getPopupHeight(collapsed),
					events: {
						onResizeStart: () => {
							this.#popupInstance.setMinWidth(this.#expandedMinWidth);
							this.#popupInstance.setMinHeight(this.#expandedMinHeight);
						},
						onResizeEnd: () => {
							this.#popupInstance.setMinWidth(null);
							this.#popupInstance.setMinHeight(null);
							this.debugger.settings.set('popup-width', this.#popupInstance.getWidth());
							this.debugger.settings.set('popup-height', this.#popupInstance.getHeight());
						}
					}
				});
				this.#popupInstance.setResizeMode(!collapsed);
			}
			return this.#popupInstance;
		}
		#getPopupWidth(collapsed) {
			if (collapsed) {
				return this.#collapsedMinWidth;
			}
			return Math.max(this.#expandedMinWidth, this.debugger.settings.get('popup-width') || 0);
		}
		#getPopupHeight(collapsed) {
			if (collapsed) {
				return this.#collapsedMinHeight;
			}
			return Math.max(this.#expandedMinHeight, this.debugger.settings.get('popup-height') || 0);
		}
		#getPopupTitleBar() {
			return {
				content: main_core.Tag.render`
				<div class="popup-window-titlebar-text bizproc-debugger-automation__titlebar">
					<div class="bizproc-debugger-automation__titlebar--move-icon"></div>
					${document.createTextNode(main_core.Loc.getMessage('BIZPROC_DEBUGGER_AUTOMATION_POPUP_TITLE'))}
					<div 
						class="bizproc-debugger-automation__titlebar--button-collapse" 
						onclick="${this.#handleCollapse.bind(this)}"
					></div>
					<button
						type="button"
						aria-label="${main_core.Loc.getMessage('JS_CORE_WINDOW_CLOSE') ?? ''}"
						class="popup-window-close-icon
								popup-window-titlebar-close-icon
								bizproc-debugger-automation__titlebar--button-close"
						data-testid="bizproc-debugger-titlebar-close-btn"
						onclick="${this.#handleClose.bind(this)}"
					>
						<span class="ui-icon-set --cross-l --hoverable-default"></span>
					</button>
				</div>
			`
			};
		}
		#handleCollapse() {
			const node = this.#getPopup().getPopupContainer();
			const collapsed = main_core.Dom.hasClass(node, '--collapse');
			this.debugger.settings.set('popup-collapsed', !collapsed);
			this.#getPopup().getZIndexComponent().setAlwaysOnTop(!collapsed);
			this.#getPopup().setResizeMode(collapsed);
			main_core.Dom.toggleClass(node, '--collapse');
			clearTimeout(this.#changingViewTimeout);
			main_core.Dom.addClass(node, '--changing-view');
			this.#getPopup().setWidth(this.#getPopupWidth(!collapsed));
			this.#getPopup().setHeight(this.#getPopupHeight(!collapsed));
			this.#changingViewTimeout = setTimeout(() => main_core.Dom.removeClass(node, '--changing-view'), 500);
		}
		#handleClose() {
			bizproc_debugger.Manager.Instance.askFinishSession(this.debugger.session).catch(() => {/*do nth*/});
		}
		#getNode() {
			if (!this.#node) {
				this.#node = main_core.Tag.render`
				<div class="bizproc-debugger-automation__content">
					<div class="bizproc-debugger-automation-content-collapsed">
						${this.#renderCollapsedMode()}
					</div>
					<div class="bizproc-debugger-automation__content-expanded">
						${this.#renderExpandedMode()}
					</div>
				</div>
			`;
				bizproc_automation.HelpHint.bindAll(this.#node);
			}
			return this.#node;
		}
		#renderExpandedMode() {
			const hasRobots = !this.debugger.isTemplateEmpty();
			const activeTab = this.debugger.settings.get('tab') === 'log' ? 'log' : 'doc';
			const tabDocClass = activeTab === 'doc' ? '--active' : '';
			const tabLogClass = activeTab === 'log' ? '--active' : '';
			const hasActiveDocument = this.debugger.session.isFixed();
			const tabNoDocumentClass = hasActiveDocument ? '' : '--empty --active';
			const fieldListNode = this.#getFieldListNode();
			const hasFields = fieldListNode.querySelector('[data-field-id]') !== null;
			return main_core.Tag.render`
				<div class="bizproc-debugger-automation__main">
					<div class="bizproc-debugger-automation__main-robots">
						<div class="bizproc-debugger-automation__main-robots--head">
							${this.#createStageNode()}
						</div>
						<div data-role="automation-content" class="bizproc-debugger-automation__main-robots--main-content">
							${this.#createTriggersHeaderNode() ?? ''}
							${this.#createTriggersNode() ?? ''}
							<div class="bizproc-debugger-automation__head">
								<div class="bizproc-debugger-automation__main--title">
									<div class="bizproc-debugger-automation__main--name">${main_core.Loc.getMessage('BIZPROC_DEBUGGER_AUTOMATION_ROBOTS_TITLE')} </div>
									<div class="ui-hint">
										<span class="ui-hint-icon" data-text="${main_core.Text.encode(main_core.Loc.getMessage('BIZPROC_JS_DEBUGGER_HELPTIP_ROBOT'))}"></span>
									</div>
								</div>
								<div data-role="no-template" class="bizproc-debugger-automation__main-hint ${hasRobots ? '' : '--active'}">
									<div class="bizproc-debugger-automation__main-hint--title">
										${main_core.Text.encode(main_core.Loc.getMessage('BIZPROC_JS_DEBUGGER_NO_ROBOTS_TITLE'))}
									</div>
									<div class="bizproc-debugger-automation__main-hint--text">
										${main_core.Text.encode(main_core.Loc.getMessage('BIZPROC_JS_DEBUGGER_NO_ROBOTS_SUBTITLE'))}
									</div>
									<a href="${this.debugger.getSettingsUrl()}" class="bizproc-debugger-automation__link">${main_core.Text.encode(main_core.Loc.getMessage('BIZPROC_JS_DEBUGGER_AUTOMATION_SETTINGS'))}</a>
								</div>
							</div>
							${this.#createTemplateNode()}
						</div>
						${this.#createTemplateToolbar()}
					</div>
					<div class="bizproc-debugger-automation__main-fields ${hasActiveDocument ? '' : '--disabled'}">
						<div data-role="tabs-container" class="bizproc-debugger-automation__main-navigation --active-${activeTab}">
							<div class="bizproc-debugger-automation__tab-block">
								<span class="bizproc-debugger-automation__tab ${tabDocClass}" data-tab-item="doc" onclick="${this.#handleChangeTab.bind(this)}">
									${main_core.Loc.getMessage('BIZPROC_DEBUGGER_AUTOMATION_DOCUMENT_TITLE')}
								</span>
								<div class="ui-hint">
									<span class="ui-hint-icon" data-text="${main_core.Text.encode(main_core.Loc.getMessage('BIZPROC_JS_DEBUGGER_HELPTIP_FIELD'))}"></span>
								</div>
							</div>
							<div class="bizproc-debugger-automation__tab-block">
								<span class="bizproc-debugger-automation__tab ${tabLogClass}" data-tab-item="log" onclick="${this.#handleChangeTab.bind(this)}">
									${main_core.Loc.getMessage('BIZPROC_DEBUGGER_AUTOMATION_LOG_TITLE')}
								</span>
								<div class="ui-hint">
									<span class="ui-hint-icon" data-text="${main_core.Text.encode(main_core.Loc.getMessage('BIZPROC_JS_DEBUGGER_HELPTIP_LOG'))}"></span>
								</div>
							</div>
							
							<div data-tab-item="doc" class="bizproc-debugger-automation__tab-action ${tabDocClass}">
								${this.#getAddFieldNode()}
							</div>
							
							<div data-tab-item="log" class="bizproc-debugger-automation__tab-action ${tabLogClass}">
								<div class="bizproc-debugger-automation__action-btn --icon-search" style="display: none"></div>
								<div class="bizproc-debugger-automation__action-btn --icon-log" onclick="${() => {
			bizproc_debugger.Manager.Instance.openSessionLog(this.debugger.sessionId);
		}}"></div>
								<div class="bizproc-debugger-automation__action-btn --icon-note" style="display: none"></div>
							</div>
						</div>
						
						<div data-tab-item="doc" data-role="tab-content-doc" class="bizproc-debugger-tab__content ${hasActiveDocument ? tabDocClass : ''} ${hasFields ? '' : '--empty'}">
							<div class="bizproc-debugger-tab__content--empty">
								${main_core.Text.encode(main_core.Loc.getMessage('BIZPROC_JS_DEBUGGER_NO_FIELD_TITLE'))}
							</div>
							<div class="bizproc-debugger-tab__content--not-empty">
								<div class="bizproc-debugger-tab__content-title">${main_core.Loc.getMessage('BIZPROC_DEBUGGER_AUTOMATION_DOCUMENT_TITLE')}</div>							
								${fieldListNode}
							</div>
						</div>
						<div data-tab-item="log" class="bizproc-debugger-tab__content ${hasActiveDocument ? tabLogClass : ''} bizproc-debugger-automation-main-section-log">
							${this.debugger.getLogView().shouldScrollToBottom(true).shouldLoadPreviousLog(true).render()}
						</div>
						<div data-tab-item="no-document" class="bizproc-debugger-tab__content ${tabNoDocumentClass} bizproc-debugger-automation-main-section-disabled">
							<div class="bizproc-debugger-tab__content--empty">
								${main_core.Text.encode(main_core.Loc.getMessage('BIZPROC_JS_DEBUGGER_NO_FIXED_DOCUMENT'))}
							</div>
						</div>
					</div>
				</div>
			`;
		}
		#renderCollapsedMode() {
			return main_core.Tag.render`
			<div class="bizproc-debugger-automation-menu__content-body">
				<div class="bizproc-debugger-automation-menu__content-body--logo"></div>
				<div class="bizproc-debugger-automation-menu__content-body--text">${main_core.Loc.getMessage('BIZPROC_JS_DEBUGGER_VIEWS_MENU_SUBTITLE')}</div>
			</div>
		`;
		}
		#getAddFieldNode() {
			return new ui_buttons.Button({
				size: ui_buttons.ButtonSize.EXTRA_SMALL,
				color: ui_buttons.ButtonColor.PRIMARY,
				round: true,
				noCaps: true,
				text: main_core.Loc.getMessage('BIZPROC_JS_DEBUGGER_VIEWS_ADD_FIELD'),
				onclick: this.#handleAddDocFieldMenu.bind(this)
			}).render();
		}
		#getFieldListNode() {
			const form = main_core.Tag.render`<div class="ui-form" data-role="doc-field-list">
			</div>`;
			const fields = this.debugger.settings.getSet('watch-fields');
			fields.forEach(value => {
				const node = this.#getFieldNode(value);
				if (node) {
					main_core.Dom.append(node, form);
				}
			});
			return form;
		}
		#handleChangeTab(event) {
			const activeTabName = event.target.dataset.tabItem;
			const hiddenTabName = this.#tabs.filter(tabName => tabName !== activeTabName)[0];
			const node = this.#getNode();
			const navigationNode = node.querySelector('[data-role="tabs-container"]');
			node.querySelectorAll([`[data-tab-item="${activeTabName}"]`]).forEach(tab => main_core.Dom.addClass(tab, '--active'));
			node.querySelectorAll([`[data-tab-item="${hiddenTabName}"]`]).forEach(tab => main_core.Dom.removeClass(tab, '--active'));
			main_core.Dom.addClass(navigationNode, `--active-${activeTabName}`);
			main_core.Dom.removeClass(navigationNode, `--active-${hiddenTabName}`);
			this.debugger.settings.set('tab', activeTabName);
			this.emit('onChangeTab', {
				tab: activeTabName
			});
		}
		#handleAddDocFieldMenu(button, event) {
			const documentFields = this.debugger.getDocumentFields();
			const selectedFields = this.debugger.settings.getSet('watch-fields');
			const fieldsDialog = new ui_entitySelector.EntitySelector.Dialog({
				targetNode: event.target,
				width: 500,
				height: 300,
				multiple: true,
				dropdownMode: true,
				enableSearch: true,
				cacheable: false,
				items: documentFields.filter(field => field.Watchable === true).map(field => {
					return {
						title: field.Name,
						id: field.Id,
						customData: {
							field
						},
						entityId: 'bp',
						tabs: 'recents',
						selected: selectedFields.has(field.Id)
					};
				}),
				showAvatars: false,
				events: {
					'Item:onSelect': event => this.#handleAddField(event.getData().item),
					'Item:onDeselect': event => this.#handleRemoveField(event.getData().item.getId())
				},
				compactView: true
			});
			fieldsDialog.show();
		}
		#handleAddField(item) {
			const fields = this.debugger.settings.getSet('watch-fields');
			const field = item.getCustomData().get('field');
			if (fields.has(field.Id)) {
				return;
			}
			const fieldNode = this.#getFieldNode(field);
			main_core.Dom.append(fieldNode, this.#getNode().querySelector('[data-role="doc-field-list"]'));
			fields.add(field.Id);
			this.debugger.settings.set('watch-fields', fields);
			this.#handleFieldListChange(fields);
		}
		#handleRemoveField(fieldId) {
			const fields = this.debugger.settings.getSet('watch-fields');
			if (!fields.has(fieldId)) {
				return;
			}
			fields.delete(fieldId);
			this.debugger.settings.set('watch-fields', fields);
			main_core.Dom.remove(this.#getNode().querySelector(`[data-field-id="${fieldId}"]`));
			this.#handleFieldListChange(fields);
		}
		#handleFieldListChange(fields) {
			const contentNode = this.#getNode().querySelector('[data-role="tab-content-doc"]');
			const hasFields = contentNode.querySelector('[data-field-id]') !== null;
			main_core.Dom[hasFields ? 'removeClass' : 'addClass'](contentNode, '--empty');
		}
		#getFieldNode(field) {
			if (main_core.Type.isString(field)) {
				field = this.debugger.getDocumentField(field);
			}
			if (!field || !field.Id) {
				return null;
			}
			const value = this.debugger.getDocumentValue(field.Id) || '';
			return main_core.Tag.render`
			<div class="ui-form-row" data-role="field-row" data-field-id="${main_core.Text.encode(field.Id)}">
				<div class="ui-form-label">
					<div class="ui-ctl-label-text">${main_core.Text.encode(field.Name)}</div>
				</div>
				<div class="ui-form-content">
					<div class="ui-ctl ui-ctl-textbox ui-ctl-w100 ui-ctl-ext-after-icon">
						<input type="text" readonly class="ui-ctl-element"
						 placeholder="${main_core.Loc.getMessage('BIZPROC_JS_DEBUGGER_VIEWS_EMPTY_VALUE')}"
						 data-role="field-value-${main_core.Text.encode(field.Id)}"
						 value="${main_core.Text.encode(value)}"
						 >
						 <a class="ui-ctl-after ui-ctl-icon-clear" onclick="${this.#handleRemoveField.bind(this, field.Id)}"></a>
					</div>
				</div>
			</div>
		`;
		}
		#createTriggersHeaderNode() {
			const hasTriggers = this.debugger.templateTriggers.length > 0;
			const hasRobots = !this.debugger.isTemplateEmpty();
			if (!hasTriggers && hasRobots) {
				return null;
			}
			return main_core.Tag.render`
			<div data-role="triggers-header" class="bizproc-debugger-automation__head">
				<div class="bizproc-debugger-automation__main--title">
					<div class="bizproc-debugger-automation__main--name">${main_core.Loc.getMessage('BIZPROC_DEBUGGER_AUTOMATION_TRIGGERS_TITLE')} </div>
					<div class="ui-hint">
						<span class="ui-hint-icon" data-text="${main_core.Text.encode(main_core.Loc.getMessage('BIZPROC_JS_DEBUGGER_HELPTIP_TRIGGER'))}"></span>
					</div>
				</div>
				<div data-role="no-triggers" class="bizproc-debugger-automation__main-hint ${hasTriggers || hasRobots ? '' : '--active'}">
					<div class="bizproc-debugger-automation__main-hint--title">
						${main_core.Text.encode(main_core.Loc.getMessage('BIZPROC_JS_DEBUGGER_NO_TRIGGERS_TITLE'))}
					</div>
					<div class="bizproc-debugger-automation__main-hint--text">
						${main_core.Text.encode(main_core.Loc.getMessage('BIZPROC_JS_DEBUGGER_NO_TRIGGERS_SUBTITLE'))}
					</div>
					<a href="${this.debugger.getSettingsUrl()}" class="bizproc-debugger-automation__link">${main_core.Text.encode(main_core.Loc.getMessage('BIZPROC_JS_DEBUGGER_AUTOMATION_SETTINGS'))}</a>
				</div>
			</div>
		`;
		}
		#createTriggersNode() {
			const documentStatus = this.debugger.getTemplate().DOCUMENT_STATUS;
			this.#tracker = new bizproc_automation.Tracker(bizproc_automation.getGlobalContext().document);
			const logs = {};
			logs[documentStatus] = this.debugger.track;
			this.#tracker.init(logs);
			bizproc_automation.getGlobalContext().tracker = this.#tracker;
			const triggers = this.debugger.templateTriggers;
			if (triggers.length === 0) {
				return null;
			}
			const node = main_core.Tag.render`
			<div data-role="triggers" class="bizproc-debugger__template">
				<div class="bizproc-automation-status-list-item" data-type="column-trigger">
					<div data-role="trigger-list" class="bizproc-automation-trigger-list" data-status-id="${documentStatus}"></div>
				</div>
			</div>
		`;
			this.#triggerManager = new bizproc_automation.TriggerManager(node);
			this.#triggerManager.init({
				TRIGGERS: triggers
			}, bizproc_automation.ViewMode.view());
			return node;
		}
		#createTemplateNode() {
			const templateData = this.debugger.getTemplate();
			this.#tracker = new bizproc_automation.Tracker(bizproc_automation.getGlobalContext().document);
			const logs = {};
			logs[templateData.DOCUMENT_STATUS] = this.debugger.track;
			this.#tracker.init(logs);
			bizproc_automation.getGlobalContext().tracker = this.#tracker;
			const node = main_core.Tag.render`
			<div data-role="template" class="bizproc-debugger__template">
				<div data-role="automation-template" data-status-id="${templateData.DOCUMENT_STATUS}">
					<div data-role="robot-list" class="bizproc-automation-robot-list"></div>
				</div>
			</div>
		`;
			const template = new bizproc_automation.Template({
				constants: {},
				variables: {},
				templateContainerNode: node,
				delayMinLimitM: 0
				// userOptions: this.userOptions,
			});
			template.init(templateData, bizproc_automation.ViewMode.view().intoRaw());
			this.#updateTemplate(template);
			this.#renderPausedRobots();
			return node;
		}
		#updateTemplate(newTemplate) {
			if (!main_core.Type.isNil(this.#template)) {
				this.#template.destroy();
			}
			this.#template = newTemplate;
			return this.#template;
		}
		#createTemplateToolbar() {
			this.#buttonPlay = new ui_buttons.Button({
				size: ui_buttons.ButtonSize.EXTRA_SMALL,
				color: ui_buttons.ButtonColor.PRIMARY,
				round: true,
				icon: ui_buttons.ButtonIcon.START,
				onclick: this.#handleStartTemplate.bind(this)
			});
			const hasEvents = this.debugger.hasWorkflowEvents();
			const hasActiveDocument = this.debugger.session.isFixed();
			return main_core.Tag.render`
			<div class="bizproc-debugger-automation__toolbar ${hasActiveDocument ? '' : '--disabled'}">
			<div data-role="external-event-info" class="bizproc-debugger-automation__toolbar--info-waiting ${hasEvents ? '--active' : ''}">
				<div>
					${main_core.Text.encode(main_core.Loc.getMessage('BIZPROC_JS_DEBUGGER_SKIP_WAITING_SUBTITLE'))}
				</div>
				<a onclick="${this.#handleEmulateExternalEvent.bind(this)}" class="bizproc-debugger-automation__link">
					${main_core.Text.encode(main_core.Loc.getMessage('BIZPROC_JS_DEBUGGER_SKIP_WAITING_TITLE'))}
				</a>
			</div>
			<div class="bizproc-debugger-automation__toolbar--btn-block">
				${this.#buttonPlay.render()}
				<div class="bizproc-debugger-automation__toolbar--btn-text">
					${main_core.Loc.getMessage('BIZPROC_DEBUGGER_AUTOMATION_ACTION_START')}
				</div>
			</div>
			</div>
		`;
		}
		#handleStartTemplate(button) {
			button.setWaiting(true);
			this.debugger.startDebugTemplate().then(() => {
				button.setWaiting(false);
				this.#setDebuggerState(this.debugger.getState());
			});
		}
		#handleEmulateExternalEvent(event) {
			const infoNode = this.#getNode().querySelector('[data-role="external-event-info"]');
			main_core.Dom.removeClass(infoNode, '--active');
			this.debugger.emulateExternalEvent(event.target.dataset.sourceId);
		}
		#updateTracker(data) {
			if (this.#tracker) {
				const logs = {};
				logs[this.debugger.getDocumentStatus()] = this.debugger.track;
				this.#tracker.reInit(logs);
				this.#template.reInit(null, bizproc_automation.ViewMode.view().intoRaw());
				this.#renderPausedRobots();
			}
		}
		#renderPausedRobots() {
			const pausedRobots = this.#template.robots.filter(robot => robot.getLogStatus() === bizproc_automation.TrackingStatus.RUNNING);
			pausedRobots.forEach(robot => {
				const loader = robot.node.lastChild.lastChild;
				const clonedLoader = main_core.Runtime.clone(loader);
				bizproc_automation.HelpHint.bindToNode(clonedLoader);
				main_core.Dom.replace(loader, main_core.Tag.render`
					<div class="bizproc-debugger-automation-robot-info-container">
						${clonedLoader}
						<a 
							onclick="${this.#handleEmulateExternalEvent.bind(this)}"
							data-source-id="${robot.getId()}"
							class="bizproc-debugger-automation__link --inside-robot"
						>
							${main_core.Text.encode(main_core.Loc.getMessage('BIZPROC_JS_DEBUGGER_SKIP_WAITING_TITLE'))}
						</a>
					</div>
				`);
			});
		}
		#createStageNode() {
			const color = this.#getDocumentStatusColor();
			const title = main_core.Text.encode(this.#getDocumentStatusTitle());
			return main_core.Tag.render`
			<div 
				class="bizproc-debugger-automation__status --robot-change ${Helper.getBgColorAdditionalClass(color)}"
				data-role="document-status"
				title="${title}"
				onclick="${this.#handleShowStages.bind(this)}"
			>
				<div class="bizproc-debugger-automation__status--title" data-role="document-status-title">
					${title}
				</div>
				<div class="bizproc-debugger-automation__status--bg" data-role="document-status-bg" style="background-color: ${color}; border-color: ${color};">
					<span class="bizproc-debugger-automation__status--bg-arrow"></span>
				</div>
			</div>
		`;
		}
		#handleShowStages(event) {
			event.preventDefault();
			const statusList = this.debugger.getStatusList();
			const menu = new main_popup.Menu({
				bindElement: event.target,
				items: statusList.map(stage => {
					return {
						text: stage.NAME,
						statusId: stage['STATUS_ID'],
						onclick: this.#handleChangeStatus.bind(this)
					};
				})
			});
			menu.show();
		}
		#handleChangeStatus(event, item) {
			item.getMenuWindow().destroy();
			this.debugger.setDocumentStatus(item.statusId);
		}
		#getDocumentStatusTitle() {
			const statusId = this.debugger.getDocumentStatus();
			const statusList = this.debugger.getStatusList();
			const status = statusList.find(stage => stage['STATUS_ID'] === statusId);
			return status ? status.NAME || status.TITLE : '?';
		}
		#getDocumentStatusColor() {
			const statusId = this.debugger.getDocumentStatus();
			const statusList = this.debugger.getStatusList();
			const status = statusList.find(stage => stage['STATUS_ID'] === statusId);
			return status ? status.COLOR : '#9DCF00';
		}
		#onDocumentStatusChanged() {
			if (!this.#getPopup().isShown()) {
				return;
			}
			const automationContentNode = this.#getNode().querySelector('[data-role="automation-content"]');
			const loader = new main_loader.Loader({
				target: automationContentNode
			});
			main_core.Dom.addClass(automationContentNode, '--loading');
			loader.show();
			this.debugger.loadMainViewInfo().then(() => {
				const statusTitleNode = this.#getNode().querySelector('[data-role="document-status-title"]');
				const statusTitle = this.#getDocumentStatusTitle();
				statusTitleNode.textContent = statusTitle;
				statusTitleNode.parentNode.setAttribute('title', statusTitle);
				const statusBgNode = this.#getNode().querySelector('[data-role="document-status-bg"]');
				const color = this.#getDocumentStatusColor();
				main_core.Dom.style(statusBgNode, {
					backgroundColor: color,
					borderColor: color
				});
				const documentStatusNode = this.#getNode().querySelector('[data-role="document-status"]');
				main_core.Dom.removeClass(documentStatusNode, ['--with-border', '--light-color']);
				main_core.Dom.addClass(documentStatusNode, Helper.getBgColorAdditionalClass(color));
				main_core.Dom.remove(this.#getNode().querySelector('[data-role="triggers-header"]'));
				main_core.Dom.remove(this.#getNode().querySelector('[data-role="triggers"]'));
				main_core.Dom.prepend(this.#createTriggersNode(), automationContentNode);
				const triggersHeaderNode = this.#createTriggersHeaderNode();
				if (triggersHeaderNode) {
					bizproc_automation.HelpHint.bindAll(triggersHeaderNode);
					main_core.Dom.prepend(triggersHeaderNode, automationContentNode);
				}
				const tplNode = this.#createTemplateNode();
				main_core.Dom.replace(this.#node.querySelector('[data-role="template"]'), tplNode);
				const hasTriggers = this.debugger.templateTriggers.length > 0;
				const hasRobots = !this.debugger.isTemplateEmpty();
				main_core.Dom[hasTriggers || hasRobots ? 'removeClass' : 'addClass'](this.#node.querySelector('[data-role="no-triggers"]'), '--active');
				main_core.Dom[hasRobots ? 'removeClass' : 'addClass'](this.#node.querySelector('[data-role="no-template"]'), '--active');
				main_core.Dom.removeClass(automationContentNode, '--loading');
				loader.destroy();
			});
		}
		#onWorkflowEventsChanged(event) {
			if (!this.#buttonPlay) {
				return;
			}
			const events = event.getData().events;
			const infoNode = this.#getNode().querySelector('[data-role="external-event-info"]');
			main_core.Dom[events.length ? 'addClass' : 'removeClass'](infoNode, '--active');
		}
		#onWorkflowTrackAdded(event) {
			this.#updateTracker(this.debugger.track);
		}
		#onDocumentValuesUpdated(event) {
			if (!this.#getPopup().isShown()) {
				return;
			}
			const values = event.getData().values;
			const node = this.#getNode();
			Object.keys(values).forEach(key => {
				const valueNode = node.querySelector(`[data-role="field-value-${key}"]`);
				if (valueNode) {
					valueNode.value = values[key] || '';
				}
			});
		}
		#onWorkflowStatusChange(event) {
			const status = event.getData().status;
			const workflowId = event.getData().workflowId;
			if ([bizproc_automation.WorkflowStatus.COMPLETED, bizproc_automation.WorkflowStatus.TERMINATED].includes(status)) {
				this.debugger.track.forEach(track => {
					if (track['WORKFLOW_ID'] === workflowId) {
						track['WORKFLOW_STATUS'] = bizproc_automation.WorkflowStatus.COMPLETED;
					}
				});
				this.#updateTracker(this.debugger.track);
			}
		}
		#onAfterDocumentFixed() {
			const popupContainer = this.#getPopup().getPopupContainer();
			main_core.Dom.removeClass(popupContainer.getElementsByClassName('bizproc-debugger-automation__main-fields')[0], '--disabled');
			main_core.Dom.removeClass(popupContainer.getElementsByClassName('bizproc-debugger-automation__toolbar')[0], '--disabled');
			const activeTab = this.debugger.settings.get('tab') === 'log' ? 'log' : 'doc';
			popupContainer.querySelectorAll([`[data-tab-item="no-document"]`]).forEach(tab => main_core.Dom.removeClass(tab, ['--empty', '--active']));
			popupContainer.querySelectorAll([`[data-tab-item="${activeTab}"]`]).forEach(tab => main_core.Dom.addClass(tab, '--active'));
			this.#onDocumentStatusChanged();
		}
		#setDebuggerState(state) {
			if (!this.#buttonPlay) {
				return;
			}
			switch (state) {
				case DebuggerState.Run:
					this.#buttonPlay.setIcon(ui_buttons.ButtonIcon.PAUSE);
					this.#buttonPlay.getContainer().nextElementSibling.textContent = main_core.Loc.getMessage('BIZPROC_DEBUGGER_AUTOMATION_ACTION_PAUSE');
					break;
				default:
					this.#buttonPlay.setIcon(ui_buttons.ButtonIcon.START);
					this.#buttonPlay.getContainer().nextElementSibling.textContent = main_core.Loc.getMessage('BIZPROC_DEBUGGER_AUTOMATION_ACTION_START');
			}
		}
	}

	class Mode {
		static experimental = {
			id: 0,
			code: 'experimental'
		};
		static interception = {
			id: 1,
			code: 'interception'
		};
		static isMode(modeId) {
			return [0, 1].includes(modeId);
		}
		static getMode(modeId) {
			if (modeId === 0) {
				return Mode.experimental;
			} else if (modeId === 1) {
				return Mode.interception;
			}
			return null;
		}
		static getAllModes() {
			return {
				0: Mode.experimental,
				1: Mode.interception
			};
		}
	}

	class Document {
		#id;
		#sessionId;
		#documentId;
		#categoryId;
		#dateExpire;
		#documentSigned = '';
		constructor(options) {
			this.#id = parseInt(options.Id) >= 0 ? parseInt(options.Id) : 0;
			this.#sessionId = main_core.Type.isStringFilled(options.SessionId) ? options.SessionId : '';
			this.#documentId = main_core.Type.isStringFilled(options.DocumentId) ? options.DocumentId : '';
			this.#categoryId = main_core.Text.toInteger(options.DocumentCategoryId);
			this.#dateExpire = Helper.toDate(options.DateExpire);
			if (options.DocumentSigned) {
				this.documentSigned = options.DocumentSigned;
			}
		}
		get documentId() {
			return this.#documentId;
		}
		get categoryId() {
			return this.#categoryId;
		}
		set categoryId(categoryId) {
			this.#categoryId = main_core.Type.isNumber(categoryId) ? categoryId : 0;
		}
		get documentSigned() {
			return this.#documentSigned;
		}
		set documentSigned(documentSigned) {
			this.#documentSigned = main_core.Type.isStringFilled(documentSigned) ? documentSigned : '';
		}
	}

	class Session extends main_core_events.EventEmitter {
		#id = '';
		#mode = {};
		#startedBy = 0;
		#active;
		#fixed;
		#documents = [];
		#shortDescription = '';
		#categoryId = 0;
		#documentSigned = '';
		#finished = false;
		#pullFinishHandler;
		#pullDocumentValuesHandler;
		constructor(options) {
			super();
			this.setEventNamespace('BX.Bizproc.Debugger.Session');
			options = main_core.Type.isPlainObject(options) ? options : {};
			this.#id = options.Id;
			this.#setMode(options.Mode);
			this.#startedBy = parseInt(options.StartedBy) >= 0 ? parseInt(options.StartedBy) : 0;
			this.#shortDescription = String(options.ShortDescription);
			this.#active = Boolean(options.Active);
			this.#fixed = Boolean(options.Fixed);
			this.#categoryId = main_core.Text.toInteger(options.CategoryId);
			this.#setDocuments(options.Documents);
			if (this.isActive()) {
				this.#pullFinishHandler = this.#handleExternalFinished.bind(this);
				bizproc_debugger.Manager.Instance.pullHandler.subscribe('sessionFinish', this.#pullFinishHandler);
				this.#pullDocumentValuesHandler = this.#handleExternalDocumentValues.bind(this);
				bizproc_debugger.Manager.Instance.pullHandler.subscribe('documentValues', this.#pullDocumentValuesHandler);
			}
		}
		set documentSigned(documentSigned) {
			if (this.isFixed() && this.activeDocument) {
				this.activeDocument.documentSigned = documentSigned;
			}
			this.#documentSigned = documentSigned;
		}
		get documentSigned() {
			if (this.activeDocument) {
				const documentSigned = this.activeDocument.documentSigned;
				if (main_core.Type.isStringFilled(documentSigned)) {
					return documentSigned;
				}
			}
			return this.#documentSigned;
		}
		#setMode(modeId) {
			modeId = Helper.isNumeric(modeId) ? Number(modeId) : null;
			if (Mode.isMode(modeId)) {
				this.#mode = Mode.getMode(modeId);
			}
		}
		#setDocuments(documents) {
			if (main_core.Type.isArrayFilled(documents)) {
				documents.forEach(document => {
					this.#documents.push(new Document(document));
				});
			}
			return this;
		}
		get id() {
			return this.#id;
		}
		get startedBy() {
			return this.#startedBy;
		}
		get activeDocument() {
			if (this.#documents.length === 1) {
				return this.#documents[0];
			}
			return null;
		}
		get modeId() {
			return this.#mode.id;
		}
		get shortDescription() {
			return this.#shortDescription;
		}
		get initialCategoryId() {
			return this.#categoryId;
		}
		isActive() {
			return this.#active;
		}
		isFixed() {
			return this.#fixed;
		}
		isSessionStartedByUser(userId) {
			return this.startedBy === userId;
		}
		isAutomation() {
			return true;
		}
		isInterceptionMode() {
			return this.modeId === Mode.interception.id;
		}
		isExperimentalMode() {
			return this.modeId === Mode.experimental.id;
		}
		static start(documentSigned, modeId) {
			return new Promise((resolve, reject) => {
				main_core.ajax.runAction('bizproc.debugger.startSession', {
					data: {
						documentSigned,
						mode: modeId
					},
					analyticsLabel: {
						automation_select_debug_mode: 'Y',
						mode_type: Mode.getMode(modeId).code
					}
				}).then(response => {
					const session = new Session(response.data.session);
					session.documentSigned = response.data.documentSigned;
					resolve(session);
				}, reject);
			});
		}
		finish(options = {}) {
			return this.#innerFinish(options).then(response => {
				this.#handleFinish();
				return response;
			});
		}
		#innerFinish(options = {}) {
			return main_core.ajax.runAction('bizproc.debugger.finishDebugSession', {
				json: {
					sessionId: this.id,
					...options
				}
			});
		}
		fixateDocument(id) {
			return main_core.ajax.runAction('bizproc.debugger.fixateSessionDocument', {
				data: {
					documentId: id
				}
			}).then(response => {
				this.documentSigned = response.data.documentSigned;
				this.#updateSession(response.data.session);
				this.emit('onAfterDocumentFixed');
				return response;
			});
		}
		removeDocuments(ids = []) {
			return main_core.ajax.runAction('bizproc.debugger.removeSessionDocument', {
				data: {
					documentIds: ids
				}
			}).then(response => {
				this.#updateSession(response.data.session);
				return response;
			});
		}
		#handleExternalFinished(event) {
			const sessionId = event.getData().sessionId;
			if (sessionId === this.id) {
				this.#handleFinish();
			}
		}
		#handleExternalDocumentValues(event) {
			if (!this.activeDocument) {
				return;
			}
			const values = event.getData().rawValues;
			const categoryId = values['CATEGORY_ID'];
			if (categoryId) {
				this.activeDocument.categoryId = main_core.Text.toInteger(categoryId);

				//TODO: refactoring candidate
				bizproc_debugger.Manager.Instance.requireSetFilter(this);
			}
		}
		#handleFinish() {
			if (!this.#finished) {
				this.#finished = true;
				this.emit('onFinished');
				this.unsubscribeAll();
				if (this.#pullFinishHandler) {
					bizproc_debugger.Manager.Instance.pullHandler.unsubscribe('sessionFinish', this.#pullFinishHandler);
					this.#pullFinishHandler = null;
				}
				if (this.#pullDocumentValuesHandler) {
					bizproc_debugger.Manager.Instance.pullHandler.unsubscribe('documentValues', this.#pullDocumentValuesHandler);
					this.#pullDocumentValuesHandler = null;
				}
			}
		}
		#updateSession(options = {}) {
			if (Object.keys(options).length <= 0) {
				return;
			}
			this.#active = Boolean(options.Active);
			this.#fixed = Boolean(options.Fixed);
			this.#categoryId = main_core.Text.toInteger(options.CategoryId);
			this.#setDocuments(options.Documents);
		}
	}

	class RobotLog {
		#robot;
		#view;
		#currentNode = null;
		#currentIndex = null;
		#isAfterPreviousRendered = false;
		#isPauseRendered = false;
		#isActivityBodyRendered = false;
		#prevRobotTitle = null;
		constructor(view, robotInfo) {
			this.#view = view;
			this.#robot = robotInfo;
		}
		get name() {
			return this.#robot.name;
		}
		get title() {
			return this.#robot.title;
		}
		get delayName() {
			return this.#robot.delayName;
		}
		get conditionNames() {
			return this.#robot.conditionNames;
		}
		getActivitiesName() {
			let names = [];
			if (this.name) {
				names.push(this.name);
			}
			if (this.delayName) {
				names.push(this.delayName);
			}
			names = names.concat(this.conditionNames);
			return names;
		}
		set previousRobotTitle(title) {
			this.#prevRobotTitle = title;
		}
		renderTrack(track) {
			const excludedTypes = [bizproc_automation.TrackingEntry.EXECUTE_ACTIVITY_TYPE, bizproc_automation.TrackingEntry.ATTACHED_ENTITY_TYPE];
			if (excludedTypes.includes(track.type)) {
				return;
			}
			if (track.name === this.delayName) {
				return this.#renderPause(track);
			}
			if (this.conditionNames.includes(track.name)) {
				if (this.#isPauseRendered === false) {
					const node = this.#getCurrentRobotNode(track);
					main_core.Dom.append(this.#renderDelayInterval(new bizproc_automation.DelayInterval()), node);
					this.#isPauseRendered = true;
				}
				return this.#renderCondition(track);
			}
			if (track.name === this.name) {
				if (this.#isPauseRendered === false) {
					const node = this.#getCurrentRobotNode(track);
					main_core.Dom.append(this.#renderDelayInterval(new bizproc_automation.DelayInterval()), node);
					this.#isPauseRendered = true;
				}
				return this.#renderActivity(track);
			}
		}
		#getCurrentRobotNode(track) {
			if (this.#view.index !== this.#currentIndex) {
				const node = main_core.Tag.render`
				<div class="bizproc-debugger-automation__log-section">
					${this.#renderRobotTitle(track.datetime)}
				</div>
			`;
				if (main_core.Type.isStringFilled(this.#prevRobotTitle) && this.#isAfterPreviousRendered === false) {
					main_core.Dom.append(this.#renderAfterPrevious(), node);
				}
				main_core.Dom.append(node, this.#view.logNode);
				this.#currentNode = node;
			}
			return this.#currentNode;
		}
		#renderRobotTitle(time) {
			const message = main_core.Loc.getMessage('BIZPROC_JS_DEBUGGER_LOG_TITLE', {
				'#TITLE#': this.title
			});
			const node = main_core.Tag.render`
			<div class="bizproc-debugger-automation__log-section--row">
				${this.#view.renderIndex()}
				${AutomationLogView.renderTime(time)}
				<div class="bizproc-debugger-automation__log-section--title">${main_core.Text.encode(message)}</div>
			</div>
		`;
			this.#currentIndex = this.#view.index;
			return node;
		}
		#renderAfterPrevious() {
			this.#isAfterPreviousRendered = true;
			const node = main_core.Tag.render`
			<div class="bizproc-debugger-automation__log-section--row">
				${this.#view.renderIndex()}
				<div class="bizproc-debugger-automation__log-info">
					<div class="bizproc-debugger-automation__log-info--name">
						<span class="bizproc-debugger-automation__log-info--name-text">
							${main_core.Loc.getMessage('BIZPROC_JS_DEBUGGER_LOG_AFTER_PREVIOUS_MSGVER_1')}
						</span>
					</div>
					<div class="bizproc-debugger-automation__log-info--value">
						<span class="bizproc-debugger-automation__log-color-box --blue">
							"${main_core.Text.encode(this.#prevRobotTitle)}"
						</span>
					</div>
				</div>
			</div>
		`;
			this.#currentIndex = this.#view.index;
			return node;
		}

		// region Pause
		#renderPause(track) {
			this.#isPauseRendered = true;
			const excludedTypes = [bizproc_automation.TrackingEntry.CLOSE_ACTIVITY_TYPE];

			// ignore
			if (excludedTypes.includes(track.type)) {
				return;
			}

			// delay Interval
			if (track.type === bizproc_automation.TrackingEntry.DEBUG_AUTOMATION_TYPE) {
				const node = this.#getCurrentRobotNode(track);
				const note = JSON.parse(track.note);
				return main_core.Dom.append(this.#renderDelayInterval(note), node);
			}
			const node = this.#getCurrentRobotNode(track);
			return main_core.Dom.append(this.#renderNote(track), node);
		}
		#renderDelayInterval(note = {}) {
			const delayInterval = new bizproc_automation.DelayInterval(note);
			let name = note.fieldName ?? new bizproc_automation.DelayIntervalSelector().getBasisField(delayInterval.basis, true).Name;
			name = name + ' [' + note.fieldValue + ']';
			const delay = delayInterval.format(main_core.Loc.getMessage('BIZPROC_JS_DEBUGGER_LOG_DELAY_INTERVAL_AT_ONCE'), [{
				SystemExpression: delayInterval.basis,
				Name: name
			}]);
			const node = main_core.Tag.render`
			<div class="bizproc-debugger-automation__log-section--row">
				${this.#view.renderIndex()}
				<div class="bizproc-debugger-automation__log-info">
					<div class="bizproc-debugger-automation__log-info--name">
						<span class="bizproc-debugger-automation__log-info--name-text">
							${main_core.Loc.getMessage('BIZPROC_JS_DEBUGGER_LOG_DELAY_INTERVAL_RUN')}
						</span>
						<span>:</span>
					</div>
					<div class="bizproc-debugger-automation__log-info--value">
						<span class="bizproc-debugger-automation__log-color-box --dark-blue">
							${main_core.Text.encode(delay)}
						</span>
					</div>
				</div>
			</div>
		`;
			this.#currentIndex = this.#view.index;
			return node;
		}
		// endregion

		// region Condition
		#renderCondition(track) {
			const excludedTypes = [bizproc_automation.TrackingEntry.CLOSE_ACTIVITY_TYPE];

			// ignore
			if (excludedTypes.includes(track.type)) {
				return;
			}
			if (track.type === bizproc_automation.TrackingEntry.DEBUG_AUTOMATION_TYPE) {
				const node = this.#getCurrentRobotNode(track);
				return main_core.Dom.append(this.#renderConditions(track), node);
			}
			const node = this.#getCurrentRobotNode(track);
			return main_core.Dom.append(this.#renderNote(track), node);
		}
		#renderConditions(track) {
			const note = JSON.parse(track.note);
			const conditionNode = main_core.Tag.render`
			<div class="bizproc-debugger-automation__log-info">
				<div class="bizproc-debugger-automation__log-info--name">
					<span class="bizproc-debugger-automation__log-info--name-text">
						${note.result === 'Y' ? main_core.Loc.getMessage('BIZPROC_JS_DEBUGGER_LOG_CONDITION') : main_core.Loc.getMessage('BIZPROC_JS_DEBUGGER_LOG_CONDITION_FALSE')}
					</span>
					<span>:</span> 
				</div> 
			</div>
		`;
			Object.keys(note).forEach(key => {
				if (key === 'result') {
					return;
				}
				let colorCondition = '';
				if (note.result === note[key]['result']) {
					colorCondition = note.result === 'Y' ? 'bizproc-debugger-automation__log-color-box --green' : 'bizproc-debugger-automation__log-color-box --orange';
				}
				const condition = note[key]['condition'];
				const field = condition['field'];
				const fieldValue = note[key]['fieldValue'] ? String(note[key]['fieldValue']) : '';
				const operator = bizproc_condition.Operator.getOperatorLabel(condition['operator']);
				const value = condition['value'];
				const joiner = Helper.getJoinerLabel(note[key]['joiner']);
				main_core.Dom.append(main_core.Tag.render`
					<div class="bizproc-debugger-automation__log-info--value">
						<span class="${colorCondition}" >
							${key === '0' ? '' : main_core.Text.encode(joiner) + ' '}
							${main_core.Text.encode(field) + ' '}
							${'[' + main_core.Text.encode(fieldValue) + '] '} 
							${main_core.Text.encode(operator) + ' '} 
							${main_core.Text.encode(value)}
						</span>
					</div>
				`, conditionNode);
			});
			const node = main_core.Tag.render`
			<div class="bizproc-debugger-automation__log-section--row">
				${this.#view.renderIndex()}
				${conditionNode}
			</div>
		`;
			this.#currentIndex = this.#view.index;
			return node;
		}
		// endregion

		// region Activity
		#renderActivity(track) {
			if (track.type === bizproc_automation.TrackingEntry.CLOSE_ACTIVITY_TYPE) {
				if (this.#isActivityBodyRendered === false) {
					const node = this.#getCurrentRobotNode(track);
					return main_core.Dom.append(this.#renderActivityFinish(), node);
				}
				return;
			}

			// fields
			this.#isActivityBodyRendered = true;
			const node = this.#getCurrentRobotNode(track);
			const renderedNote = this.#renderNote(track);
			main_core.Dom.append(renderedNote, node);
			this.#view.collapseInfoResults(renderedNote);
		}
		#renderActivityFinish() {
			// tracking-track-2
			return main_core.Tag.render`
			<div class="bizproc-debugger-automation__log-section--row">
				${this.#view.renderIndex()}
				<div class="bizproc-debugger-automation-log-section-robot-activity">
					${main_core.Loc.getMessage('BIZPROC_JS_DEBUGGER_LOG_FINISH_WITHOUT_SETTINGS')}
				</div>
			</div>
		`;
		}
		// endregion

		#renderNote(track) {
			if ([bizproc_automation.TrackingEntry.DEBUG_AUTOMATION_TYPE, bizproc_automation.TrackingEntry.DEBUG_ACTIVITY_TYPE].includes(track.type)) {
				return this.#renderDebugNote(track);
			}
			if ([bizproc_automation.TrackingEntry.DEBUG_LINK_TYPE].includes(track.type)) {
				return this.#renderDebugLink(track);
			}
			const colorBox = [bizproc_automation.TrackingEntry.CANCEL_ACTIVITY_TYPE, bizproc_automation.TrackingEntry.FAULT_ACTIVITY_TYPE, bizproc_automation.TrackingEntry.ERROR_ACTIVITY_TYPE].includes(track.type) ? 'bizproc-debugger-automation__log-color-box --red' : '';
			const node = main_core.Tag.render`
			<div class="bizproc-debugger-automation__log-section--row">
				${this.#view.renderIndex()}
				<div class="bizproc-debugger-automation__log-info--value --first">
					<span class="${colorBox}">
						${main_core.Text.encode(track.note).replace(/([^>])\n/g, '$1<br>')}
					</span>
				</div>
			</div>
		`;
			this.#currentIndex = this.#view.index;
			return node;
		}
		#renderDebugNote(track) {
			const note = JSON.parse(track.note);
			const infoNode = main_core.Tag.render`<div class="bizproc-debugger-automation__log-info"></div>`;
			if (note['propertyName']) {
				main_core.Dom.append(main_core.Tag.render`
					<div class="bizproc-debugger-automation__log-info--name">
						<span class="bizproc-debugger-automation__log-info--name-text" title="${main_core.Text.encode(note['propertyName'])}">
							${main_core.Text.encode(note['propertyName'])}
						</span>
						<span>:</span>
					</div>
				`, infoNode);
			}
			main_core.Dom.append(main_core.Tag.render`
				<div class="bizproc-debugger-automation__log-info--value ${note['propertyName'] ? '' : '--first'}">
					<div class="bizproc-debugger-automation__log--variable-height" data-role="info-result">
						<div>
							${note['propertyValue'] ? main_core.Text.encode(note['propertyValue']).replace(/([^>])\n/g, '$1<br>') : ''}
						</div>
					</div>
					<div data-role="more-info-result" style="display:none;">
						<span class="bizproc-debugger-automation__log-info--more">
							${main_core.Text.encode(main_core.Loc.getMessage('BIZPROC_JS_DEBUGGER_MORE_INFORMATION'))}
						</span>
					</div>
				</div>
			`, infoNode);
			const node = main_core.Tag.render`
			<div class="bizproc-debugger-automation__log-section--row">
				${this.#view.renderIndex()}
				${infoNode}
			</div>
		`;
			this.#currentIndex = this.#view.index;
			return node;
		}
		#renderDebugLink(track) {
			const note = JSON.parse(track.note);
			const infoNode = main_core.Tag.render`<div class="bizproc-debugger-automation__log-info"></div>`;
			const label = note['propertyLinkName'] || note['propertyValue'];
			const link = note['propertyValue'];
			if (note['propertyName']) {
				main_core.Dom.append(main_core.Tag.render`
					<div class="bizproc-debugger-automation__log-info--name">
						<span class="bizproc-debugger-automation__log-info--name-text" title="${main_core.Text.encode(note['propertyName'])}">
							${main_core.Text.encode(note['propertyName'])}
						</span>
						<span>:</span>
					</div>
				`, infoNode);
			}
			main_core.Dom.append(main_core.Tag.render`
				<div class="bizproc-debugger-automation__log-info--value ${note['propertyName'] ? '' : '--first'}">
					<div class="bizproc-debugger-automation__log--variable-height" data-role="info-result">
						<a href="${main_core.Text.encode(link)}" target="_blank">
							${label}
						</a>
					</div>
				</div>
			`, infoNode);
			const node = main_core.Tag.render`
			<div class="bizproc-debugger-automation__log-section--row">
				${this.#view.renderIndex()}
				${infoNode}
			</div>
		`;
			this.#currentIndex = this.#view.index;
			return node;
		}
	}

	class TriggerLog {
		#view;
		#condition = {};
		#title = '';
		#track = null;
		constructor(view) {
			this.#view = view;
		}
		addTrack(track) {
			if (track.type === bizproc_automation.TrackingEntry.DEBUG_AUTOMATION_TYPE && track.name === 'TRIGGER_LOG') {
				this.#condition = JSON.parse(track.note);
				this.#title = track.title;
				this.#track = track;
			}
			return this;
		}
		render() {
			const node = main_core.Tag.render`
			<div class="bizproc-debugger-automation__log-section">
				${this.#renderTitle()}
				${this.#renderCondition()}
				<div class="bizproc-debugger-automation__log-section--row">
					${this.#view.renderIndex()}
					<div class="bizproc-debugger-automation__log-info--value --first">
						<span>
							${main_core.Text.encode(main_core.Loc.getMessage('BIZPROC_JS_DEBUGGER_LOG_TRIGGER_FINISH'))}
						</span>
					</div>
				</div>
			</div>
		`;
			main_core.Dom.append(node, this.#view.logNode);
		}
		#renderTitle() {
			const message = main_core.Loc.getMessage('BIZPROC_JS_DEBUGGER_LOG_TRIGGER_TITLE', {
				'#TITLE#': this.#title
			});
			return main_core.Tag.render`
			<div class="bizproc-debugger-automation__log-section--row">
				${this.#view.renderIndex()}
				${AutomationLogView.renderTime(this.#track.datetime)}
				<div class="bizproc-debugger-automation__log-section--title">${main_core.Text.encode(message)}</div>
			</div>
		`;
		}
		#renderCondition() {
			if (!this.#condition || Object.keys(this.#condition).length <= 0) {
				return '';
			}
			const note = this.#condition;
			const conditionNode = main_core.Tag.render`
			<div class="bizproc-debugger-automation__log-info">
				<div class="bizproc-debugger-automation__log-info--name">
					<span class="bizproc-debugger-automation__log-info--name-text">
						${main_core.Loc.getMessage('BIZPROC_JS_DEBUGGER_LOG_CONDITION')}
					</span>
					<span>:</span> 
				</div> 
			</div>
		`;
			Object.keys(note).forEach(key => {
				const colorCondition = note[key]['result'] === 'Y' ? 'bizproc-debugger-automation__log-color-box --green' : '';
				const condition = note[key]['condition'];
				//const object = Helper.getFieldObjectLabel(condition['object']);
				const field = condition['field'];
				const fieldValue = note[key]['fieldValue'] ? String(note[key]['fieldValue']) : '';
				const operator = bizproc_condition.Operator.getOperatorLabel(condition['operator']);
				const value = condition['value'];
				const joiner = Helper.getJoinerLabel(note[key]['joiner']);
				main_core.Dom.append(main_core.Tag.render`
					<div class="bizproc-debugger-automation__log-info--value">
						<span class="${colorCondition}" >
							${key === '0' ? '' : main_core.Text.encode(joiner) + ' '}
							${main_core.Text.encode(field) + ' '}
							${'[' + main_core.Text.encode(fieldValue) + '] '}
							${main_core.Text.encode(operator) + ' '}
							${main_core.Text.encode(value)}
						</span>
					</div>
				`, conditionNode);
			});
			return main_core.Tag.render`
			<div class="bizproc-debugger-automation__log-section--row">
				${this.#view.renderIndex()}
				${conditionNode}
			</div>
		`;
		}
	}

	class AutomationLogView {
		#debuggerInstance = null;
		#workflowId;
		#activityRenderer = {};
		#documentStatus = '';
		#categoryName = '';
		#statusSettings;
		#node = null;
		#index = 0;
		#trackId = 0;
		#poolTrack = [];
		#poolWorkflowRobots = {};
		#isRendering = true;
		static #NUMBER_OF_LINES_TO_SHOW_IN_PIXELS = 50; // 3 lines
		#shouldScrollToBottom = false;
		#shouldLoadPreviousLog = false;
		#onTrackAddedHandler;
		#onChangeTabHandler;
		#onSessionFinishedHandler;
		#autoScrollHandler;
		#scrollAnimationId;
		constructor(debuggerInstance) {
			this.#debuggerInstance = debuggerInstance;
			this.#workflowId = this.debugger.workflowId;
			const template = this.debugger.getTemplate();
			this.initializeWorkflowRobotsRenderer(template ? template['ROBOTS'] : []);
			if (this.debugger.session.isActive()) {
				this.#onTrackAddedHandler = this.onTrackAdded.bind(this);
				this.debugger.subscribe('onWorkflowTrackAdded', this.#onTrackAddedHandler);
				this.#onChangeTabHandler = this.#onChangeTab.bind(this);
				this.debugger.getMainView().subscribe('onChangeTab', this.#onChangeTabHandler);
				this.#onSessionFinishedHandler = this.#onSessionFinished.bind(this);
				this.debugger.session.subscribeOnce('onFinished', this.#onSessionFinishedHandler);
			}
		}
		get debugger() {
			return this.#debuggerInstance;
		}
		get index() {
			return this.#index;
		}
		get logNode() {
			if (!this.#node) {
				this.#node = main_core.Tag.render`<div data-role="log" class="bizproc-debugger-tab__log"></div>`;
			}
			return this.#node;
		}
		initializeWorkflowRobotsRenderer(workflowRobots = [], workflowId = null) {
			if (!workflowId && !this.#workflowId) {
				return;
			}
			if (main_core.Type.isUndefined(this.#activityRenderer[workflowId ?? this.#workflowId])) {
				this.#activityRenderer[workflowId ?? this.#workflowId] = {};
			}
			if (main_core.Type.isArrayFilled(workflowRobots)) {
				let prevRobotTitle = null;
				for (let i = 0; i < workflowRobots.length; ++i) {
					const robot = new bizproc_automation.Robot({});
					robot.init(workflowRobots[i], bizproc_automation.ViewMode.none());
					const robotLogger = new RobotLog(this, {
						name: robot.getId(),
						title: robot.getTitle(),
						delayName: robot.data.DelayName ?? null,
						conditionNames: robot.getCondition().conditionNamesList
					});
					if (robot.isExecuteAfterPrevious() && prevRobotTitle) {
						robotLogger.previousRobotTitle = prevRobotTitle;
					}
					prevRobotTitle = robot.getTitle();
					robotLogger.getActivitiesName().forEach(activityName => {
						this.#activityRenderer[workflowId ?? this.#workflowId][activityName] = robotLogger;
					});
				}
			}
		}

		// region LOAD LOG

		shouldLoadPreviousLog(should) {
			this.#shouldLoadPreviousLog = should;
			return this;
		}
		#loadPreviousLog() {
			return new Promise(resolve => {
				this.debugger.loadAllLog().then(data => {
					this.#onAfterGetLog(data);
					resolve(this);
				}, () => {
					resolve(this);
				});
			});
		}
		#loadWorkflowRobotsByWorkflowId(track) {
			this.debugger.loadRobotsByWorkflowId(track.workflowId).then(data => {
				this.#poolWorkflowRobots[track.workflowId] = data.workflowRobots;
				this.initializeWorkflowRobotsRenderer(this.#poolWorkflowRobots[track.workflowId], track.workflowId);
				this.startRendering();
			}, () => {
				this.#poolWorkflowRobots[track.workflowId] = [];
				console.info('session has no workflowId from track:', track);
				this.startRendering();
			});
		}
		setPreviousLog(data = {
			logs: [],
			workflowRobots: {}
		}) {
			this.#onAfterGetLog(data);
			return this;
		}
		#onAfterGetLog(data) {
			const logFromDB = [];
			const builder = new bizproc_automation.TrackingEntryBuilder();
			if (main_core.Type.isArrayFilled(data['logs'])) {
				data['logs'].forEach(item => {
					logFromDB.push(builder.setLogEntry(item).build());
				});
			}
			this.#poolTrack = logFromDB.concat(this.#poolTrack);
			this.#poolWorkflowRobots = Object.assign(data['workflowRobots'], this.#poolWorkflowRobots);
		}

		// endregion

		// region RENDER LOG

		render() {
			if (this.logNode.children.length <= 0) {
				this.#isRendering = true;
				if (this.#shouldLoadPreviousLog) {
					this.#loadPreviousLog().then(() => {
						this.startRendering();
					});
				} else {
					this.startRendering();
				}
			}
			return this.logNode;
		}
		renderTo(element) {
			main_core.Dom.append(this.logNode, element);
			this.#isRendering = true;
			this.startRendering();
			return this;
		}
		startRendering() {
			const track = this.#poolTrack.shift();
			if (main_core.Type.isUndefined(track)) {
				this.#isRendering = false;
				this.#askScrollToBottom();
				this.#bindAutoScroll(this.#shouldScrollToBottom);
				return;
			}
			if (this.#workflowId !== track.workflowId) {
				if (main_core.Type.isUndefined(this.#activityRenderer[track.workflowId])) {
					if (main_core.Type.isUndefined(this.#poolWorkflowRobots[track.workflowId])) {
						this.#loadWorkflowRobotsByWorkflowId(track);
						this.renderTrack(track);
						this.#workflowId = track.workflowId;
						return;
					}
					this.initializeWorkflowRobotsRenderer(this.#poolWorkflowRobots[track.workflowId], track.workflowId);
				}
			}
			this.renderTrack(track);
			this.startRendering();
		}
		#renderStartDebugLog(track) {
			this.#renderStartedDate(track);
			this.#renderLegend(track);
		}
		#renderStartedDate(track) {
			const startedDate = Helper.toDate(track.datetime);
			const dateNode = main_core.Tag.render`
			<div class="bizproc-debugger-automation__log--date">
				<div class="bizproc-debugger-automation__log--date-text">${main_core.Text.encode(Helper.formatDate('j F Y', startedDate))}</div>
			</div>
		`;
			main_core.Dom.append(dateNode, this.logNode);
		}
		#renderLegend(track) {
			const description = JSON.parse(track.note)['propertyValue'];

			// separator <div class="bizproc-debugger-automation__log-separator"></div>

			const descriptionNode = main_core.Tag.render`
			<div class="bizproc-debugger-automation__log-section">
				<div class="bizproc-debugger-automation__log-section--row">
					${this.renderIndex()}
					${AutomationLogView.renderTime(track.datetime)}
					<div>${main_core.Text.encode(description)}</div>
				</div>
			</div>
		`;
			main_core.Dom.append(descriptionNode, this.logNode);
		}
		renderIndex() {
			this.#index++;
			return main_core.Tag.render`
			<div class="bizproc-debugger-automation__log--index" data-role="index">${String(this.#index).padStart(3, '0')}</div>
		`;
		}
		static renderTime(datetime) {
			datetime = Helper.toDate(datetime);
			return main_core.Tag.render`
			<div class="bizproc-debugger-automation__log--time">
				[${main_core.Text.encode(Helper.formatDate('H:i:s', datetime))}]
			</div>
		`;
		}

		// endregion

		// region status log

		renderStatusChange(track) {
			const parsedTrackNote = JSON.parse(track.note);
			if (!main_core.Type.isStringFilled(this.#documentStatus)) {
				this.#documentStatus = parsedTrackNote['STATUS_ID'];
				this.#statusSettings = parsedTrackNote;
				return;
			}
			const sourceStage = this.getStatusSettings(this.#documentStatus);
			const destinationStage = parsedTrackNote;
			const node = main_core.Tag.render`
			<div class="bizproc-debugger-automation__log-section">
				<div class="bizproc-debugger-automation__log-section--row">
					${this.renderIndex()}
					${AutomationLogView.renderTime(track.datetime)}
					<div class="bizproc-debugger-automation__status--change-info">
						<div class="bizproc-debugger-automation__status --log-status ${Helper.getBgColorAdditionalClass(sourceStage['COLOR'])}" title="${main_core.Text.encode(sourceStage['NAME'])}"> 
							<div class="bizproc-debugger-automation__status--title">${main_core.Text.encode(sourceStage['NAME'])}</div>
							<div class="bizproc-debugger-automation__status--bg" style="background-color: ${sourceStage['COLOR']}; border-color: ${sourceStage['COLOR']};">
								<span class="bizproc-debugger-automation__status--bg-arrow"></span>
							</div>
						</div>
						<div class="bizproc-debugger-automation__status--robot-change-arrow"></div>
						<div class="bizproc-debugger-automation__status --log-status ${Helper.getBgColorAdditionalClass(destinationStage['COLOR'])}" title="${main_core.Text.encode(destinationStage['NAME'])}"> 
							<div class="bizproc-debugger-automation__status--title">${main_core.Text.encode(destinationStage['NAME'])}</div>
							<div class="bizproc-debugger-automation__status--bg" style="background-color: ${destinationStage.COLOR}; border-color: ${destinationStage.COLOR};">
								<span class="bizproc-debugger-automation__status--bg-arrow"></span>
							</div>
						</div>
					</div>
				</div>
			</div>
		`;
			main_core.Dom.append(node, this.logNode);
			this.#documentStatus = parsedTrackNote['STATUS_ID'];
			this.#statusSettings = parsedTrackNote;
		}
		getStatusSettings() {
			if (main_core.Type.isUndefined(this.#statusSettings)) {
				return {
					NAME: '',
					COLOR: 'AEF2F9'
				};
			}
			return this.#statusSettings;
		}
		#renderCategoryChange(track) {
			const categoryName = JSON.parse(track.note)['propertyValue'];
			if (!main_core.Type.isStringFilled(this.#categoryName)) {
				this.#categoryName = categoryName;
				return;
			}
			const descriptionNode = main_core.Tag.render`
			<div>
				<div class="bizproc-debugger-automation__log-separator"></div>
				<div class="bizproc-debugger-automation__log-section">
					<div class="bizproc-debugger-automation__log-section--row">
						${this.renderIndex()}
						${AutomationLogView.renderTime(track.datetime)}
						<div>
							${main_core.Text.encode(main_core.Loc.getMessage('BIZPROC_JS_DEBUGGER_CATEGORY_CHANGE_MSGVER_1', {
			'#SOURCE_CATEGORY#': this.#categoryName,
			'#DESTINATION_CATEGORY#': categoryName
		}))}
						</div>
					</div>
				</div>
			</div>
		`;
			main_core.Dom.append(descriptionNode, this.logNode);
			this.#categoryName = categoryName;
		}

		// endregion

		// region TRACK
		onTrackAdded(event) {
			const entryBuilder = new bizproc_automation.TrackingEntryBuilder();
			entryBuilder.setLogEntry(event.getData().row);
			this.addTrack(entryBuilder.build());
		}
		addTrack(track) {
			if (!this.#isRendering) {
				this.renderTrack(track);
				this.#askScrollToBottom();
				return;
			}
			this.#poolTrack.push(track);
		}
		renderTrack(track) {
			if (track.id <= this.#trackId) {
				return;
			}
			if (!Object.keys(this.#activityRenderer[track.workflowId] ?? {}).includes(track.name)) {
				if (track.name === 'SESSION_LEGEND') {
					this.#renderStartDebugLog(track);
					this.#trackId = track.id;
				} else if (track.name === 'STATUS_CHANGED') {
					this.renderStatusChange(track);
					this.#trackId = track.id;
				} else if (track.name === 'CATEGORY_CHANGED') {
					this.#renderCategoryChange(track);
					this.#trackId = track.id;
				} else if (track.name === 'TRIGGER_LOG') {
					new TriggerLog(this).addTrack(track).render();
					this.#trackId = track.id;
				} else if (track.name === 'Template' && track.type === bizproc_automation.TrackingEntry.EXECUTE_ACTIVITY_TYPE) {
					if (main_core.Type.isUndefined(this.#poolWorkflowRobots[track.workflowId]) && this.#isRendering === false) {
						this.#isRendering = true;
						this.#loadWorkflowRobotsByWorkflowId(track);
					}
				} else if (track.name === 'Template' && track.type === bizproc_automation.TrackingEntry.CLOSE_ACTIVITY_TYPE) {
					this.#clearWorkflowRobots(track.workflowId);
				}
				return;
			}
			this.#activityRenderer[track.workflowId][track.name].renderTrack(track);
			this.#trackId = track.id;
		}
		//endregion

		// region ON CHANGE TAB: scrollToBottom, collapseInfoResults

		#onChangeTab(event) {
			if (event.getData().tab === 'log') {
				this.collapseInfoResults();
				this.#askScrollToBottom();
			}
		}
		collapseInfoResults(node) {
			if (!node) {
				node = this.logNode;
			}
			const infoResults = node.querySelectorAll('[data-role="info-result"]');
			infoResults.forEach(infoNode => {
				if (infoNode.firstElementChild.clientHeight > this.constructor.#NUMBER_OF_LINES_TO_SHOW_IN_PIXELS) {
					const moreInfoNode = infoNode.parentNode.querySelector('[data-role="more-info-result"]');
					main_core.Event.bind(moreInfoNode, 'click', () => {
						main_core.Dom.style(infoNode, 'height', infoNode.firstElementChild.clientHeight + 'px');
						main_core.Dom.style(moreInfoNode, 'display', 'none');
					});
					main_core.Event.bind(infoNode, 'transitionend', () => {
						main_core.Dom.style(infoNode, 'height', null);
					});
					main_core.Dom.style(infoNode, 'height', this.constructor.#NUMBER_OF_LINES_TO_SHOW_IN_PIXELS + 'px');
					main_core.Dom.style(moreInfoNode, 'display', 'block');
				}
			});
			return this;
		}
		shouldScrollToBottom(should) {
			this.#shouldScrollToBottom = should;
			return this;
		}
		#bindAutoScroll(state) {
			if (!this.logNode.parentNode) {
				return;
			}
			const scrollNode = this.logNode.parentNode;
			if (state) {
				this.#autoScrollHandler = () => {
					if (this.#scrollAnimationId) {
						return;
					}
					const scrollMax = scrollNode.scrollHeight - scrollNode.clientHeight;
					this.#shouldScrollToBottom = scrollNode.scrollTop >= scrollMax - this.constructor.#NUMBER_OF_LINES_TO_SHOW_IN_PIXELS;
				};
				main_core.Event.bind(scrollNode, 'scroll', this.#autoScrollHandler);
			} else if (this.#autoScrollHandler) {
				main_core.Event.unbind(scrollNode, 'scroll', this.#autoScrollHandler);
			}
		}
		#scrollToBottom() {
			if (!this.logNode.parentNode) {
				return;
			}
			const scrollNode = this.logNode.parentNode;
			const from = scrollNode.scrollTop;
			const to = scrollNode.scrollHeight - scrollNode.clientHeight;
			this.#animateScroll(scrollNode, from, to);
		}
		#animateScroll(element, start, end) {
			this.#cancelAnimateScroll();
			const increment = 20;
			const duration = 500;
			const diff = end - start;
			let currentPosition = 0;
			const requestFrame = window.requestAnimationFrame || window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame || function (callback) {
				return window.setTimeout(callback, 1000 / 60);
			};
			const animateScroll = () => {
				currentPosition += increment;
				element.scrollTop = easeInOutQuad(currentPosition, start, diff, duration);
				if (currentPosition < duration) {
					this.#scrollAnimationId = requestFrame(animateScroll);
				} else {
					this.#scrollAnimationId = null;
				}
			};
			return animateScroll();
		}
		#cancelAnimateScroll() {
			if (this.#scrollAnimationId) {
				const cancelFrame = window.cancelAnimationFrame || window.webkitCancelAnimationFrame || window.mozCancelAnimationFrame || function (id) {
					clearTimeout(id);
				};
				cancelFrame(this.#scrollAnimationId);
				this.#scrollAnimationId = null;
			}
		}
		#askScrollToBottom() {
			if (this.#shouldScrollToBottom) {
				this.#scrollToBottom();
			}
		}

		// endregion

		#clearWorkflowRobots(workflowId) {
			delete this.#poolWorkflowRobots[workflowId];
			delete this.#activityRenderer[workflowId];
		}
		#onSessionFinished() {
			this.debugger.unsubscribe('onWorkflowTrackAdded', this.#onTrackAddedHandler);
			this.debugger.getMainView().unsubscribe('onChangeTab', this.#onChangeTabHandler);
		}
	}
	const easeInOutQuad = function (current, start, diff, duration) {
		current /= duration / 2;
		if (current < 1) {
			return diff / 2 * current * current + start;
		}
		current--;
		return -diff / 2 * (current * (current - 2) - 1) + start;
	};

	class ActionPanelGuide {
		#guide;
		constructor(options) {
			this.#guide = new ui_tour.Guide({
				steps: [{
					target: options.target,
					title: ActionPanelGuide.#getHtmlTitle(options.title) || '',
					text: options.text || '',
					//article: options.article,
					condition: {
						top: true,
						bottom: false,
						color: 'warning'
					}
				}],
				onEvents: true
			});
		}
		start() {
			this.#guide.getPopup().setWidth(370); //some magic ^_^
			this.#guide.showNextStep();
		}
		finish() {
			this.#guide.close();
		}
		static #getHtmlTitle(title) {
			if (title) {
				return `
				<div class="bizproc__action-panel-guide">
					<div class="bizproc__action-panel-guide--title --warning-icon">${main_core.Text.encode(title)}</div>
				</div>
			`;
			}
			return null;
		}
	}

	class CustomCrmActionPanel {
		#actionPanel = null;
		#grid = null;
		#guides = [];
		#debuggerInstance;
		constructor(grid, debuggerInstance) {
			this.#grid = grid;
			this.#debuggerInstance = debuggerInstance;
			this.#actionPanel = new BX.UI.ActionPanel({
				removeLeftPosition: true,
				maxHeight: 58,
				parentPosition: 'bottom',
				autoHide: false
			});
			this.#appendItems();
			const onHideActionPanelHandler = this.#onHideActionPanel.bind(this);
			main_core_events.EventEmitter.subscribe(this.#actionPanel, 'BX.UI.ActionPanel:hidePanel', onHideActionPanelHandler);
		}
		#appendItems() {
			this.#actionPanel.appendItem({
				id: 'fix_entity',
				text: main_core.Loc.getMessage('BIZPROC_JS_DEBUGGER_ACTION_PANEL_CRM_FIX_DEAL_ACTION_1'),
				onclick: this.fixEntityAction.bind(this)
			});
			this.#actionPanel.appendItem({
				id: 'remove_entity',
				text: this.#getRemoveEntityActionText(),
				onclick: this.removeEntityAction.bind(this)
			});
			this.#actionPanel.appendItem({
				id: 'finish_debug',
				text: main_core.Loc.getMessage('BIZPROC_JS_DEBUGGER_ACTION_PANEL_CRM_FINISH_DEBUG_ACTION'),
				onclick: function () {
					bizproc_debugger.Manager.Instance.askFinishSession(this.#debuggerInstance.session).then(() => {
						this.stopActionPanel();
					}, response => {
						this.#handleRejectResponse(response, 'finish_debug');
					});
				}.bind(this)
			});
		}
		get actionPanel() {
			return this.#actionPanel;
		}
		#onHideActionPanel() {
			this.#guides.forEach(guide => {
				guide.finish();
			});
		}
		fixEntityAction() {
			const checkedIds = this.#getCheckedIdsInBpStyle();
			if (checkedIds.length !== 1) {
				const guide = new ActionPanelGuide({
					target: this.actionPanel.getItemById('fix_entity').layout.container,
					title: main_core.Loc.getMessage('BIZPROC_JS_DEBUGGER_ACTION_PANEL_CRM_FIX_DEAL_COUNT_ERROR_TITLE'),
					article: 'limit_office_bp_designer' // todo: replace,
				});
				this.#guides.push(guide);
				guide.start();
				return;
			}
			this.#debuggerInstance.session.fixateDocument(checkedIds[0]).then(() => {
				this.stopActionPanel();
				bizproc_debugger.Manager.Instance.requireSetFilter(this.#debuggerInstance.session, true);
				if (this.#debuggerInstance.settings.get('popup-collapsed')) {
					this.#debuggerInstance.getMainView().showExpanded();
				}
			}, response => {
				this.#handleRejectResponse(response, 'fix_entity');
			});
		}
		#getRemoveEntityActionText() {
			return `
			<span>${main_core.Text.encode(main_core.Loc.getMessage('BIZPROC_JS_DEBUGGER_ACTION_PANEL_CRM_REMOVE_DEAL_ACTION_1'))}</span>
		`;
		}
		removeEntityAction() {
			const checkedIds = this.#getCheckedIdsInBpStyle();
			this.#debuggerInstance.session.removeDocuments(checkedIds).then(() => {
				this.actionPanel.hidePanel();
				this.#grid.reload();
			}, response => {
				this.#handleRejectResponse(response, 'remove_entity');
			});
		}
		#getCheckedIdsInBpStyle() {
			const checkedIds = this.#grid.getCheckedId();

			// todo: get EntityType from another place
			return checkedIds.map(id => 'DEAL_' + id);
		}
		stopActionPanel() {
			this.actionPanel.hidePanel();
			this.#grid.resetActionPanel();
			this.#grid.stopActionPanel();
		}
		#handleRejectResponse(response, actionId) {
			if (!response.errors) {
				return;
			}
			let message = '';
			response.errors.forEach(error => {
				message = message + '\n' + error.message;
			});
			const guide = new ActionPanelGuide({
				target: this.actionPanel.getItemById(actionId).layout.container,
				title: message,
				article: 'limit_office_bp_designer' // todo: replace,
			});
			this.#guides.push(guide);
			guide.start();
		}
	}

	class Automation extends main_core_events.EventEmitter {
		session = null;
		#pullHandlers = null;
		#settings;
		#mainView;
		#triggers;
		#template;
		#documentStatus;
		#statusList;
		#documentCategoryId = 0;
		#documentFields;
		#documentValues = {};
		#workflowId;
		#workflowStatus;
		#workflowEvents = [];
		#workflowTrack = [];
		#debuggerState;
		#customActionPanel = null;
		constructor(parameters = {}) {
			super();
			this.setEventNamespace('BX.Bizproc.Debugger.Automation');
			this.session = parameters.session;
			if (this.session.isActive()) {
				this.session.subscribeOnce('onAfterDocumentFixed', this.#onAfterDocumentFixed.bind(this));
				this.session.subscribe('onFinished', this.destroy.bind(this));
				this.#subscribePull();
			}
			this.#settings = new bizproc_localSettings.Settings('atm-dbg');
			this.#initAutomationContext();
			this.#resumeShowActionPanel();
		}
		#resumeShowActionPanel() {
			if (this.session.isInterceptionMode() && !this.session.isFixed()) {
				if (main_core.Reflection.getClass('BX.CRM.Kanban.Grid')) {
					const gridInstance = BX.CRM.Kanban.Grid.getInstance();
					if (this.#shouldSetCustomActionPanel(gridInstance)) {
						this.#customActionPanel = new CustomCrmActionPanel(gridInstance, this);
						gridInstance.stopActionPanel(true);
						gridInstance.resetActionPanel();
						gridInstance.setCustomActionPanel(this.#customActionPanel.actionPanel);
					}
				}
			}
		}
		#shouldSetCustomActionPanel(gridInstance) {
			const gridData = gridInstance.getData();
			const entityType = gridData.entityType;

			//todo: modify
			if (entityType !== 'DEAL') {
				return false;
			}
			const categoryId = gridData.params.hasOwnProperty('CATEGORY_ID') ? main_core.Text.toInteger(gridData.params.CATEGORY_ID) : 0;
			return this.session.initialCategoryId === categoryId;
		}
		#initAutomationContext() {
			const context = new bizproc_automation.Context({
				document: new bizproc_automation.Document({
					rawDocumentType: [],
					documentId: null,
					categoryId: 0,
					statusList: this.getStatusList(),
					statusId: this.getDocumentStatus(),
					documentFields: this.getDocumentFields()
				}),
				documentSigned: this.documentSigned,
				canEdit: false,
				canManage: false,
				automationGlobals: new bizproc_automation.AutomationGlobals({
					variables: [],
					constants: []
				})
			});
			bizproc_automation.setGlobalContext(context);
		}
		destroy() {
			this.unsubscribeAll();
			this.#unsubscribePull();
			this.#mainView?.destroy();
			this.session = null;
			this.#settings = null;
			this.#mainView = null;
			this.#template = [];
			this.#documentStatus = null;
			this.#statusList = [];
			this.#documentFields = [];
			this.#documentValues = {};
			this.#workflowId = null;
			this.#workflowStatus = 0;
			this.#workflowEvents = [];
			this.#workflowTrack = [];
			this.#customActionPanel?.stopActionPanel();
		}
		get track() {
			return this.#workflowTrack;
		}
		get settings() {
			return this.#settings;
		}
		get documentSigned() {
			return this.session.documentSigned;
		}
		get sessionId() {
			return this.session.id;
		}
		get workflowId() {
			return this.#workflowId;
		}
		get pullHandlers() {
			if (this.#pullHandlers === null) {
				this.#pullHandlers = [{
					name: 'documentStatus',
					func: this.handleExternalDocumentStatus.bind(this)
				}, {
					name: 'documentValues',
					func: this.handleExternalDocumentValues.bind(this)
				}, {
					name: 'documentDelete',
					func: this.handleExternalDocumentDelete.bind(this)
				}, {
					name: 'workflowStatus',
					func: this.handleExternalWorkflowStatus.bind(this)
				}, {
					name: 'workflowEventAdd',
					func: this.handleExternalWorkflowEventAdd.bind(this)
				}, {
					name: 'workflowEventRemove',
					func: this.handleExternalWorkflowEventRemove.bind(this)
				}, {
					name: 'trackRow',
					func: this.handleExternalTrackRow.bind(this)
				}];
			}
			return this.#pullHandlers;
		}
		#subscribePull() {
			const pull = Manager.Instance.pullHandler;
			this.pullHandlers.forEach(({
				name,
				func
			}) => {
				pull.subscribe(name, func);
			});
		}
		#unsubscribePull() {
			if (this.#pullHandlers === null) {
				return;
			}
			const pull = Manager.Instance.pullHandler;
			this.pullHandlers.forEach(({
				name,
				func
			}) => {
				pull.unsubscribe(name, func);
			});
			this.#pullHandlers = null;
		}
		getMainView() {
			if (!this.#mainView) {
				this.#mainView = new AutomationMainView(this);
			}
			return this.#mainView;
		}
		getLogView() {
			return new AutomationLogView(this);
		}
		getStatusList() {
			return this.#statusList;
		}
		getDocumentFields() {
			return this.#documentFields;
		}
		getDocumentField(fieldId) {
			return this.#documentFields.find(field => field.Id === fieldId);
		}
		getDocumentValue(fieldId) {
			return this.#documentValues[fieldId] || null;
		}
		getDocumentStatus() {
			return this.#documentStatus; //getActiveDocument().getStatus();
		}
		getWorkflowStatus() {
			return this.#workflowStatus;
		}
		getState() {
			return this.#debuggerState;
		}
		hasWorkflowEvents() {
			return this.#workflowEvents.length > 0;
		}
		setDocumentStatus(statusId) {
			return new Promise(resolve => {
				main_core.ajax.runAction('bizproc.debugger.setDocumentStatus', {
					data: {
						statusId: statusId
					}
				}).then(response => {
					if (response.data && response.data.newStatus) {
						this.#documentStatus = response.data.newStatus;
						this.#template = response.data.template;
						this.#workflowTrack = [];
						this.emit('onDocumentStatusChanged');
					}
					resolve(response);
				}, this.#handleRejectResponse.bind(this));
			});
		}
		get templateTriggers() {
			return this.#triggers.filter(trigger => trigger['DOCUMENT_STATUS'] === this.#template['DOCUMENT_STATUS']);
		}
		getTemplate() {
			return this.#template;
		}
		isTemplateEmpty() {
			return this.#template.IS_EXTERNAL_MODIFIED === false && !main_core.Type.isArrayFilled(this.#template.ROBOTS);
		}
		startDebugTemplate() {
			return new Promise(resolve => {
				main_core.ajax.runAction('bizproc.debugger.resumeAutomationTemplate', {
					data: {
						sessionId: this.sessionId
					},
					analyticsLabel: 'automation_start_debug'
				}).then(response => {
					this.#workflowId = response.data.workflowId;
					this.#debuggerState = response.data.debuggerState;
					resolve(response.data);
				}, this.#handleRejectResponse.bind(this));
			});
		}
		emulateExternalEvent(robotId) {
			return new Promise(resolve => {
				let eventId = this.#workflowEvents[0]?.name;
				if (main_core.Type.isStringFilled(robotId)) {
					eventId = this.#workflowEvents.find(({
						sourceId: eventRobotId
					}) => eventRobotId === robotId)?.name;
				}
				if (!eventId) {
					return;
				}
				main_core.ajax.runAction('bizproc.debugger.emulateExternalEvent', {
					data: {
						workflowId: this.#workflowId,
						eventId
					}
				}).then(response => {
					resolve(response.data);
				}, this.#handleRejectResponse.bind(this));
			});
		}
		loadMainViewInfo() {
			return new Promise(resolve => {
				main_core.ajax.runAction('bizproc.debugger.fillAutomationView', {
					data: {
						sessionId: this.sessionId
					}
				}).then(response => {
					this.#triggers = response.data.triggers;
					this.#template = response.data.template;
					this.#documentStatus = response.data.documentStatus;
					this.#statusList = response.data.statusList;
					this.#documentCategoryId = response.data.documentCategoryId;
					this.#documentFields = response.data.documentFields;
					this.#documentValues = response.data.documentValues;
					this.#workflowId = response.data.workflowId;
					this.#workflowStatus = response.data.workflowStatus;
					this.#workflowEvents = response.data.workflowEvents;
					this.#workflowTrack = response.data.track;
					this.#debuggerState = response.data.debuggerState;
					bizproc_automation.getGlobalContext().document.setFields(this.getDocumentFields()).setStatusList(this.getStatusList()).setStatus(this.getDocumentStatus());
					bizproc_automation.getGlobalContext().automationGlobals.globalConstants = main_core.Type.isArrayFilled(response.data.globalConstants) ? response.data.globalConstants : [];
					bizproc_automation.getGlobalContext().automationGlobals.globalVariables = main_core.Type.isArrayFilled(response.data.globalVariables) ? response.data.globalVariables : [];
					resolve();
				}, this.#handleRejectResponse.bind(this));
			});
		}
		get globalConstants() {
			const context = bizproc_automation.getGlobalContext();
			return context && context.automationGlobals ? context.automationGlobals.globalConstants : [];
		}
		get globalVariables() {
			const context = bizproc_automation.getGlobalContext();
			return context && context.automationGlobals ? context.automationGlobals.globalVariables : [];
		}
		loadAllLog() {
			return new Promise(resolve => {
				main_core.ajax.runAction('bizproc.debugger.loadAllLog', {
					data: {
						sessionId: this.session.id
					}
				}).then(response => {
					resolve(response.data);
				}, this.#handleRejectResponse.bind(this));
			});
		}
		loadRobotsByWorkflowId(workflowId) {
			return new Promise((resolve, reject) => {
				main_core.ajax.runAction('bizproc.debugger.loadRobotsByWorkflowId', {
					data: {
						sessionId: this.sessionId,
						workflowId
					}
				}).then(response => {
					resolve(response.data);
				}, response => {
					reject(response.data);
					//this.#handleRejectResponse.bind(this);
				});
			});
		}
		handleExternalDocumentStatus(event) {
			const status = event.getData().status;
			if (this.getDocumentStatus() === status) {
				return;
			}
			console.info('document status: ' + status);
			this.#documentStatus = status;
			this.emit('onDocumentStatusChanged');
		}
		handleExternalDocumentValues(event) {
			const values = event.getData().values;
			Object.keys(values).forEach(key => this.#documentValues[key] = values[key]);
			console.info('document values: ' + Object.keys(values));
			this.emit('onDocumentValuesUpdated', {
				values
			});
		}
		handleExternalDocumentDelete() {
			ui_dialogs_messagebox.MessageBox.show({
				message: main_core.Loc.getMessage('BIZPROC_JS_DEBUGGER_CONFIRM_ON_DOCUMENT_DELETE'),
				okCaption: main_core.Loc.getMessage('BIZPROC_JS_DEBUGGER_VIEWS_MENU_FINISH_SESSION'),
				onOk: () => {
					return Manager.Instance.finishSession(this.session).then(null, this.#handleRejectResponse.bind(this));
				},
				buttons: ui_dialogs_messagebox.MessageBoxButtons.OK_CANCEL
			});
		}
		#handleRejectResponse(response) {
			if (main_core.Type.isArrayFilled(response.errors)) {
				const noDocumentError = response.errors.find(error => error.code === 404);
				if (noDocumentError) {
					this.handleExternalDocumentDelete();
				} else {
					const message = response.errors.map(error => error.message).join('\n');
					ui_dialogs_messagebox.MessageBox.alert(message);
				}
			}
		}
		handleExternalTrackRow(event) {
			const row = event.getData().row;
			row['WORKFLOW_STATUS'] = this.#workflowStatus;
			this.#workflowTrack.push(row);
			this.emit('onWorkflowTrackAdded', {
				row
			});
		}
		handleExternalWorkflowStatus(event) {
			const status = event.getData().status;
			const workflowId = event.getData().workflowId;
			this.#workflowStatus = status;
			if (status === bizproc_automation.WorkflowStatus.RUNNING) {
				this.#workflowId = workflowId;
			}
			if (this.#workflowId !== workflowId) {
				return;
			}
			console.info('workflow status: ' + status);
			this.emit('onWorkflowStatusChanged', {
				status,
				workflowId
			});
		}
		handleExternalWorkflowEventAdd(event) {
			const eventName = event.getData().eventName;
			const robotId = event.getData().sourceId;
			console.info('workflow event added: ' + eventName);
			this.#workflowEvents.push({
				name: eventName,
				sourceId: robotId
			});
			console.info('workflow events: ' + this.#workflowEvents.map(event => event.name).join(', '));
			this.emit('onWorkflowEventsChanged', {
				events: this.#workflowEvents
			});
		}
		handleExternalWorkflowEventRemove(event) {
			const eventName = event.getData().eventName;
			console.info('workflow event removed: ' + eventName);
			this.#workflowEvents = this.#workflowEvents.filter(({
				name: value
			}) => value !== eventName);
			console.info('workflow events: ' + this.#workflowEvents.map(({
				name
			}) => name).join(', '));
			this.emit('onWorkflowEventsChanged', {
				events: this.#workflowEvents
			});
		}
		#onAfterDocumentFixed() {
			this.loadMainViewInfo().then(() => {
				this.emit('onAfterDocumentFixed');
			});
		}
		getField(object, id) {
			let field;
			switch (object) {
				case 'Document':
					field = this.#documentFields.find(field => field.Id === id);
					break;
			}
			return field || {
				Id: id,
				ObjectId: object,
				Name: id,
				Type: 'string',
				Expression: id,
				SystemExpression: '{=' + object + ':' + id + '}'
			};
		}
		getSettingsUrl() {
			//TODO: get actual url
			return `/crm/deal/automation/${this.#documentCategoryId}/`;
		}
	}

	class CommandHandler extends main_core_events.EventEmitter {
		#unsubscribe;
		#commands = ['documentStatus', 'documentValues', 'documentDelete',
		//workflow
		'workflowStatus', 'workflowEventAdd', 'workflowEventRemove',
		//track
		'trackRow',
		//session
		'sessionFinish'];
		constructor() {
			super();
			this.setEventNamespace('BX.Bizproc.Debugger.Pull');
			this.#unsubscribe = pull_client.PULL.subscribe(this);
		}
		destroy() {
			if (main_core.Type.isFunction(this.#unsubscribe)) {
				this.#unsubscribe();
			}
			this.#unsubscribe = null;
		}
		getModuleId() {
			return 'bizproc';
		}
		getSubscriptionType() {
			return BX.PullClient.SubscriptionType.Server;
		}
		getMap() {
			const map = {};
			this.#commands.forEach(command => {
				map[command] = this.#handleCommand.bind(this);
			});
			return map;
		}
		#handleCommand(params, extra, command) {
			this.emit(command, params);
		}
	}

	class FilterGuide {
		constructor(options) {
			this.guide = new ui_tour.Guide({
				steps: [{
					target: options.target,
					title: main_core.Loc.getMessage('BIZPROC_JS_DEBUGGER_FILTER_TOUR_TITLE'),
					text: FilterGuide.#getText(),
					article: '16087180',
					events: options.events ?? {},
					condition: {
						top: true,
						bottom: false,
						color: 'primary'
					}
				}],
				onEvents: true
			});
			this.bindEvents();
		}
		bindEvents() {
			// EventEmitter.subscribe('UI.Tour.Guide:onFinish'....
		}
		start() {
			this.guide.getPopup().setWidth(365);
			this.guide.showNextStep();
		}
		static #getText() {
			return `
			<ul class="bizproc-debugger-filter-guide-list">
				<li class="bizproc-debugger-filter-guide-list-item">
					${Helper.toHtml(main_core.Loc.getMessage('BIZPROC_JS_DEBUGGER_FILTER_TOUR_TEXT_LINE_1_MSGVER_1'))}
				</li>
				<li class="bizproc-debugger-filter-guide-list-item">
					${Helper.toHtml(main_core.Loc.getMessage('BIZPROC_JS_DEBUGGER_FILTER_TOUR_TEXT_LINE_2'))}
				</li>
			</ul>
		`;
		}
	}

	class StageGuide {
		constructor(options) {
			this.guide = new ui_tour.Guide({
				steps: [{
					target: options.target,
					title: main_core.Loc.getMessage('BIZPROC_JS_DEBUGGER_STAGE_TOUR_TITLE'),
					text: StageGuide.#getText(),
					article: '16483018',
					events: options.events ?? {},
					condition: {
						top: true,
						bottom: false,
						color: 'primary'
					}
				}],
				onEvents: true
			});
		}
		start() {
			this.guide.getPopup().setWidth(330);
			this.guide.showNextStep();
		}
		static #getText() {
			return `
			<ul class="bizproc-debugger-filter-guide-list">
				<li class="bizproc-debugger-filter-guide-list-item">
					${main_core.Loc.getMessage('BIZPROC_JS_DEBUGGER_STAGE_TOUR_TEXT_LINE_1')}
				</li>
				<li class="bizproc-debugger-filter-guide-list-item">
					${main_core.Loc.getMessage('BIZPROC_JS_DEBUGGER_STAGE_TOUR_TEXT_LINE_2')}
				</li>
			</ul>
		`;
		}
	}

	class CrmDebuggerGuide extends main_core_events.EventEmitter {
		#grid = null;
		#guides = [];
		#reserveFilterIds = [];
		constructor(options) {
			super();
			this.setEventNamespace('BX.Bizproc.Debugger.CrmDebuggerGuide');
			this.#grid = options.grid;
			this.#reserveFilterIds = options.reserveFilterIds;

			// reverse order
			if (options.showStageStep) {
				const stageStep = this.#getStageGuide();
				if (stageStep) {
					this.#guides.push(stageStep);
				}
			}
			if (options.showFilterStep) {
				const filterGuide = this.#getFilterGuide();
				if (filterGuide) {
					this.#guides.push(filterGuide);
				}
			}
		}
		#getStageGuide() {
			if (!this.#grid) {
				return;
			}
			const firstColumn = this.#grid.getColumns()[0];
			if (!firstColumn) {
				return null;
			}
			const guideTarget = firstColumn.getTitleContainer();
			if (!guideTarget) {
				return null;
			}
			const nextGuide = this.#guides[this.#guides.length - 1];
			return new StageGuide({
				target: '.' + guideTarget.classList[0],
				events: {
					'onShow': function () {
						this.emit('onStageGuideStepShow');
					}.bind(this),
					'onClose': function () {
						if (nextGuide) {
							nextGuide.start();
						}
						this.emit('onStageGuideStepClose');
					}.bind(this)
				}
			});
		}
		#getFilterGuide() {
			const filterId = this.#grid ? [this.#grid.getData().gridId] : this.#reserveFilterIds;
			if (filterId.length <= 0) {
				return null;
			}
			let filter;
			for (const key in filterId) {
				filter = BX.Main.filterManager.getById(filterId[key]);
				if (filter) {
					break;
				}
			}
			if (!filter) {
				return null;
			}
			const filterApi = filter.getApi();
			const guideTarget = filterApi?.parent?.getPopupBindElement()?.firstElementChild;
			if (!guideTarget) {
				return null;
			}
			const nextGuide = this.#guides[this.#guides.length - 1];
			return new FilterGuide({
				target: guideTarget,
				events: {
					'onShow': function () {
						this.emit('onFilterGuideStepShow');
					}.bind(this),
					'onClose': function () {
						if (nextGuide) {
							nextGuide.start();
						}
						this.emit('onFilterGuideStepClose');
					}.bind(this)
				}
			});
		}
		start() {
			if (this.#guides.length <= 0) {
				return;
			}
			this.#guides[this.#guides.length - 1].start();
		}
	}

	let instance = null;
	class Manager {
		#settings;
		static get Instance() {
			if (instance === null) {
				instance = new Manager();
			}
			return instance;
		}
		constructor() {
			this.pullHandler = new CommandHandler();
			this.#settings = new bizproc_localSettings.Settings('manager');
		}
		initializeDebugger(parameters = {
			session: {},
			documentSigned: ''
		}) {
			const session = main_core.Type.isPlainObject(parameters.session) ? new Session(parameters.session) : null;
			if (!session) {
				return;
			}
			session.documentSigned = parameters.documentSigned;
			this.requireSetFilter(session);
			this.#showDebugger(session);
		}
		startSession(documentSigned, modeId) {
			return new Promise((resolve, reject) => {
				Session.start(documentSigned, modeId).then(session => {
					this.#lastFilterId = null;
					this.#setDebugFilter(session);
					const debuggerInstance = this.#showDebugger(session, true);
					this.#showGuide(debuggerInstance);
					resolve();
				}, reject);
			});
		}
		finishSession(session, deleteDocument = false) {
			return new Promise((resolve, reject) => {
				session.finish({
					deleteDocument
				}).then(response => {
					this.#removeDebugFilter(session);
					resolve(response);
				}, reject);
			});
		}
		askFinishSession(session) {
			const checkboxElement = main_core.Tag.render`<input type="checkbox" class="ui-ctl-element">`;
			const boxOptions = {
				message: main_core.Loc.getMessage('BIZPROC_JS_DEBUGGER_CONFIRM_FINISH_SESSION'),
				okCaption: main_core.Loc.getMessage('BIZPROC_JS_DEBUGGER_VIEWS_MENU_FINISH_SESSION'),
				buttons: ui_dialogs_messagebox.MessageBoxButtons.OK_CANCEL,
				popupOptions: {
					zIndexOptions: {
						alwaysOnTop: true
					}
				}
			};
			if (session.isExperimentalMode()) {
				boxOptions.title = main_core.Loc.getMessage('BIZPROC_JS_DEBUGGER_CONFIRM_FINISH_SESSION');
				boxOptions.message = main_core.Tag.render`
				<label class="ui-ctl ui-ctl-checkbox">
					${checkboxElement}
					<div class="ui-ctl-label-text">${main_core.Loc.getMessage('BIZPROC_JS_DEBUGGER_DELETE_SESSION_DOCUMENT')}</div>
				</label>
			`;
			}
			return new Promise((resolve, reject) => {
				boxOptions.onOk = () => Manager.Instance.finishSession(session, checkboxElement?.checked).then(resolve, reject);
				boxOptions.onCancel = () => {
					reject({
						cancel: true
					});
					return true;
				};
				ui_dialogs_messagebox.MessageBox.show(boxOptions);
			});
		}
		#showDebugger(session, isFirstShow = false) {
			let debuggerInstance = null;
			if (session.isAutomation()) {
				debuggerInstance = this.createAutomationDebugger({
					session: session
				});
			}
			if (debuggerInstance) {
				let initialShowState = debuggerInstance.session.isExperimentalMode() ? 'showExpanded' : 'showCollapsed';
				if (!this.#isFilterGuideShown()) {
					initialShowState = 'showCollapsed';
				}
				debuggerInstance.getMainView()[isFirstShow ? initialShowState : 'show']();
				return debuggerInstance;
			}
			return debuggerInstance;
		}
		#showGuide(debuggerInstance) {
			const guide = new CrmDebuggerGuide({
				grid: main_core.Reflection.getClass('BX.CRM.Kanban.Grid') ? BX.CRM.Kanban.Grid.getInstance() : null,
				showFilterStep: !this.#isFilterGuideShown(),
				showStageStep: !this.#isStageGuideShown() && debuggerInstance.session.isInterceptionMode(),
				reserveFilterIds: this.#getFilterIds(debuggerInstance.session)
			});
			guide.subscribe('onFilterGuideStepShow', this.#setFilterGuideShown.bind(this, true));
			guide.subscribe('onStageGuideStepShow', this.#setStageGuideShown.bind(this, true));
			guide.subscribe('onFilterGuideStepClose', () => {
				if (debuggerInstance.session && debuggerInstance.session.isExperimentalMode() && debuggerInstance.settings.get('popup-collapsed') === true) {
					debuggerInstance.getMainView().showExpanded();
				}
			});
			guide.start();
		}
		requireSetFilter(session, force = false) {
			const lastId = this.#getFilterIds(session).pop();
			if (lastId !== this.#lastFilterId || force) {
				this.#setDebugFilter(session);
			}
		}
		#setDebugFilter(session) {
			const ids = this.#getFilterIds(session);
			this.#getFilterApis(ids).forEach(({
				id,
				api
			}) => {
				api.setFilter({
					preset_id: 'filter_robot_debugger'
				});
				this.#lastFilterId = id;
			});
		}
		#removeDebugFilter(session) {
			const ids = this.#getFilterIds(session);
			this.#getFilterApis(ids).forEach(({
				api
			}) => {
				api.setFilter({
					preset_id: 'default_filter'
				});
				this.#lastFilterId = null;
			});
		}
		get #lastFilterId() {
			return this.#settings.get('last-filter-id');
		}
		set #lastFilterId(value) {
			return this.#settings.set('last-filter-id', value);
		}

		/**
		 * @return BX.Filter.Api | null
		 */
		#getFilterApis(ids) {
			const apis = [];
			ids.forEach(id => {
				const filter = BX.Main.filterManager?.getById(id);
				if (filter) {
					apis.push({
						id,
						api: filter.getApi()
					});
				}
			});
			return apis;
		}
		#getFilterIds(session) {
			let categoryId;
			if (session && session.modeId === Mode.interception.id && !session.isFixed()) {
				categoryId = session.initialCategoryId;
			} else {
				categoryId = session?.activeDocument?.categoryId;
			}
			const filterId = 'CRM_DEAL_LIST_V12';
			if (!categoryId) {
				return [filterId, `${filterId}_C_0`];
			}
			return [`${filterId}_C_${categoryId}`];
		}
		#isFilterGuideShown() {
			return this.#settings.get('filter-guide-shown') === true;
		}
		#isStageGuideShown() {
			return this.#settings.get('stage-guide-shown') === true;
		}
		#setFilterGuideShown(shown = true) {
			this.#settings.set('filter-guide-shown', shown);
		}
		#setStageGuideShown(shown = true) {
			this.#settings.set('stage-guide-shown', shown);
		}
		createAutomationDebugger(parameters = {}) {
			return new Automation(parameters);
		}
		openDebuggerStartPage(documentSigned, parameters = {}) {
			const url = BX.Uri.addParam('/bitrix/components/bitrix/bizproc.debugger.start/', {
				documentSigned: documentSigned,
				analyticsLabel: {
					automation_enter_debug: 'Y',
					start_type: parameters.analyticsStartType || 'default'
				}
			});
			const options = {
				width: 745,
				cacheable: false,
				allowChangeHistory: true,
				events: {}
			};
			return Manager.openSlider(url, options);
		}
		openSessionLog(sessionId) {
			const url = BX.Uri.addParam('/bitrix/components/bitrix/bizproc.debugger.log/', {
				'setTitle': 'Y',
				'sessionId': sessionId
			});
			const options = {
				width: 720,
				cacheable: false,
				allowChangeHistory: true,
				events: {},
				newWindowLabel: true
			};
			return Manager.openSlider(url, options);
		}
		static openSlider(url, options) {
			if (!main_core.Type.isPlainObject(options)) {
				options = {};
			}
			options = {
				...{
					cacheable: false,
					allowChangeHistory: true,
					events: {}
				},
				...options
			};
			return new Promise((resolve, reject) => {
				if (main_core.Type.isStringFilled(url)) {
					if (BX.SidePanel.Instance.open(url, options)) {
						return resolve();
					}
					return reject();
				}
				return reject();
			});
		}
	}

	const Debugger = {
		Manager,
		Session,
		Mode
	};

	exports.Debugger = Debugger;
	exports.Manager = Manager;
	exports.Mode = Mode;
	exports.Session = Session;

})(this.BX.Bizproc.Debugger = this.BX.Bizproc.Debugger || {}, BX, BX.Main, BX.Bizproc.Automation, BX.Event, BX.UI, BX, window, BX.UI.EntitySelector, BX, BX.UI, BX.UI, BX.UI.Dialogs, BX.Bizproc.Debugger, BX.Main, BX.Bizproc, BX, BX, BX.Bizproc.LocalSettings, BX, BX.UI.Tour);
//# sourceMappingURL=debugger.bundle.js.map
