/* eslint-disable */
this.BX = this.BX || {};
this.BX.BIConnector = this.BX.BIConnector || {};
(function (exports, main_core_events, main_core, biconnector_apacheSupersetAnalytics, ui_iconSet_main, ui_designTokens, ui_forms, ui_buttons, biconnector_dashboardParametersSelector, biconnector_shareSetting) {
	'use strict';

	/* eslint-disable no-underscore-dangle */
	const SidePanel = BX.SidePanel;
	class SettingController extends BX.UI.EntityEditorController {
		constructor(id, settings) {
			super();
			this.initialize(id, settings);
			this.analytic = settings.config?.dashboardAnalyticInfo ?? {};
			main_core_events.EventEmitter.subscribeOnce('BX.UI.EntityEditor:onInit', event => {
				const [editor] = event.getData();
				editor?._toolPanel.disableSaveButton();
				this.tryFocusSection(editor);
			});
			main_core_events.EventEmitter.subscribeOnce('BX.UI.EntityEditor:onControlChange', event => {
				const [editor] = event.getData();
				editor?._toolPanel.enableSaveButton();
			});
			main_core_events.EventEmitter.subscribeOnce('BX.UI.EntityEditor:onCancel', event => {
				const [, eventArguments] = event.getData();
				eventArguments.enableCloseConfirmation = false;
			});
			main_core_events.EventEmitter.subscribeOnce('BX.UI.EntityEditor:onSave', event => {
				const [, eventArguments] = event.getData();
				eventArguments.enableCloseConfirmation = false;
			});
		}
		onAfterSave() {
			let analyticOptions;
			if (main_core.Type.isStringFilled(this.analytic.type)) {
				analyticOptions = {
					type: this.analytic.type.toLowerCase(),
					p1: biconnector_apacheSupersetAnalytics.ApacheSupersetAnalytics.buildAppIdForAnalyticRequest(this.analytic.appId),
					p2: this.analytic.id,
					c_element: 'grid_menu',
					status: 'success'
				};
			} else {
				analyticOptions = {
					c_element: 'grid_settings',
					status: 'success'
				};
			}
			biconnector_apacheSupersetAnalytics.ApacheSupersetAnalytics.sendAnalytics('edit', 'report_settings', analyticOptions);
			this?._editor?._modeSwitch.reset();
			this.#sendOnSaveEvent();
			this.innerCancel();
		}
		#sendOnSaveEvent() {
			const datasetTypingValue = this?._editor?._model?.getField?.('DATASET_TYPING_ENABLED');
			const previousSlider = BX.SidePanel.Instance.getPreviousSlider(BX.SidePanel.Instance.getSliderByWindow(window));
			const parent = previousSlider ? previousSlider.getWindow() : top;
			if (!parent.BX.Event) {
				return;
			}
			parent.BX.Event.EventEmitter.emit('BX.BIConnector.Settings:onAfterSave', {
				datasetTypingEnabled: datasetTypingValue === 'Y'
			});
		}
		innerCancel() {
			SidePanel.Instance.close();
		}
		tryFocusSection(editor) {
			const slider = BX.SidePanel.Instance.getSliderByWindow(window);
			const sliderData = slider?.getData?.();
			const focusSection = sliderData && main_core.Type.isFunction(sliderData.get) ? sliderData.get('focusSection') : null;
			if (!main_core.Type.isStringFilled(focusSection)) {
				return;
			}
			const editorContainer = editor?.getContainer();
			const sectionWrapper = editorContainer?.querySelector(`[data-cid="${focusSection}"]`);
			const highlightContainer = sectionWrapper?.querySelector('.ui-entity-editor-section-edit') ?? sectionWrapper;
			if (!main_core.Type.isDomNode(highlightContainer)) {
				return;
			}
			highlightContainer.scrollIntoView({
				block: 'start',
				behavior: 'smooth'
			});
			main_core.Dom.addClass(highlightContainer, '--founded-item');
			setTimeout(() => {
				main_core.Dom.removeClass(highlightContainer, '--founded-item');
				main_core.Dom.addClass(highlightContainer, '--after-founded-item');
				setTimeout(() => {
					main_core.Dom.removeClass(highlightContainer, '--after-founded-item');
				}, 5000);
			}, 1000);
		}
	}

	/* eslint-disable no-underscore-dangle */
	class IconController extends BX.UI.EntityEditorController {
		constructor(id, settings) {
			super();
			this.initialize(id, settings);
			this.#subscribeOnEvents();
		}
		#subscribeOnEvents() {
			main_core_events.EventEmitter.subscribeOnce('BX.UI.EntityEditor:onInit', event => {
				const [editor] = event.getData();
				const control = editor?._controls?.[0];
				if (control?._sections && control._sections.length > 0) {
					this.#fillSectionIcons(control._sections);
				}
			});
		}
		#fillSectionIcons(sectionList) {
			for (const section of sectionList) {
				if (section.getTitle() !== '') {
					this.#setSectionIcon(section);
				}
			}
		}
		#setSectionIcon(section) {
			const container = section._headerContainer;
			if (container === null) {
				return;
			}
			const data = section.getData();
			const headerTitle = container.querySelector('.ui-entity-editor-header-title');
			if (headerTitle && data.iconClass) {
				const icon = main_core.Tag.render`
					<span class="
						superset-settings-section-icon
						ui-icon-set 
						${data.iconClass}
					"></span>
			`;
				main_core.Dom.insertBefore(icon, headerTitle);
			}
		}
	}

	class ControllerFactory {
		constructor(eventName) {
			main_core_events.EventEmitter.subscribe(`${eventName}:onInitialize`, event => {
				const [, eventArgs] = event.getCompatData();
				eventArgs.methods.dashboardSettings = this.factory.bind(this);
			});
		}
		factory(type, controlId, settings) {
			switch (type) {
				case 'settingComponentController':
					return new SettingController(controlId, settings);
				case 'iconController':
					return new IconController(controlId, settings);
				default:
					return null;
			}
		}
	}

	/* eslint-disable no-underscore-dangle,@bitrix24/bitrix24-rules/no-pseudo-private */
	class DashboardGroupsField extends BX.UI.EntityEditorCustom {
		#isAllowedClearGroups = false;
		#groups;
		#scopes;
		#params;
		#paramList;
		#requiredParamList;
		static create(id, settings) {
			const self = new this(id, settings);
			self.initialize(id, settings);
			return self;
		}
		initialize(id, settings) {
			super.initialize(id, settings);
			this.#isAllowedClearGroups = this._model.getField('IS_ALLOWED_CLEAR_GROUPS', false);
			this.#scopes = new Set();
			const scopes = this._model.getField('SCOPE', []);
			scopes.forEach(scopeCode => {
				this.#scopes.add(scopeCode);
			});
			this.#params = new Set();
			const params = this._model.getField('PARAMS', []);
			params.forEach(param => {
				this.#params.add(param);
			});
			this.#groups = new Set();
			const groups = this._model.getField('GROUPS', []);
			groups.forEach(groupId => {
				this.#groups.add(main_core.Text.toNumber(groupId));
			});
			this.#paramList = this._model.getField('PARAM_LIST', {});
			this.#requiredParamList = this._model.getField('REQUIRED_PARAM_LIST', []);
			main_core_events.EventEmitter.subscribe('BIConnector.DashboardParamsSelector:onChange', this.onChange.bind(this));
		}
		layout(options) {
			this.ensureWrapperCreated({
				classNames: ['ui-entity-editor-field-text']
			});
			this.adjustWrapper();
			this._innerWrapper = main_core.Tag.render`<div class='ui-entity-editor-content-block ui-ctl-custom'></div>`;
			const messageId = this.#isAllowedClearGroups ? 'BICONNECTOR_SUPERSET_SETTINGS_GROUP_FIELD_HINT_CLEARABLE' : 'BICONNECTOR_SUPERSET_SETTINGS_GROUP_FIELD_HINT';
			const message = main_core.Loc.getMessage(messageId, {
				'#HINT_LINK#': '<link></link>'
			});
			const hint = main_core.Tag.render`
			<div class="biconnector-superset-settings-panel-range__hint">
				${message}
			</div>
		`;
			const link = main_core.Tag.render`
			<a class="biconnector-superset-settings-panel-range__hint-link">
				${main_core.Loc.getMessage('BICONNECTOR_SUPERSET_SETTINGS_DASHBOARD_HINT_LINK')}
			</a>
		`;
			main_core.Event.bind(link, 'click', () => {
				top.BX.Helper.show('redirect=detail&code=25556500');
			});
			main_core.Dom.replace(hint.querySelector('link'), link);
			main_core.Dom.insertBefore(hint, this._container);
			main_core.Dom.append(this._innerWrapper, this._wrapper);
			const selectorParams = {
				groups: this.#groups,
				scopes: this.#scopes,
				params: this.#params,
				paramList: this.#paramList,
				isAllowedClearGroups: this.#isAllowedClearGroups,
				requiredParamList: this.#requiredParamList,
				isNew: false
			};
			const selector = new biconnector_dashboardParametersSelector.DashboardParametersSelector(selectorParams);
			main_core.Dom.append(selector.getLayout(), this._innerWrapper);
			this.registerLayout(options);
			this._hasLayout = true;
		}
		save() {
			if (main_core.Type.isDomNode(this._innerWrapper)) {
				const oldSaveBlock = this._innerWrapper.querySelector('.save-block');
				if (main_core.Type.isDomNode(oldSaveBlock)) {
					main_core.Dom.remove(oldSaveBlock);
				}
				const saveBlock = main_core.Tag.render`<div class="save-block"></div>`;
				for (const group of this.#groups) {
					main_core.Dom.append(main_core.Tag.render`<input type="hidden" name="${this.getName()}[GROUPS][]" value="${group}">`, saveBlock);
				}
				for (const scope of this.#scopes) {
					main_core.Dom.append(main_core.Tag.render`<input type="hidden" name="${this.getName()}[SCOPE][]" value="${scope}">`, saveBlock);
				}
				for (const param of this.#params) {
					main_core.Dom.append(main_core.Tag.render`<input type="hidden" name="${this.getName()}[PARAMS][]" value="${param}">`, saveBlock);
				}
				main_core.Dom.append(saveBlock, this._innerWrapper);
			}
			this._model.setField(this.getName(), [...this.#groups]);
		}
		onChange(params) {
			const {
				isChanged,
				isLocked
			} = params.data;
			if (isChanged) {
				this.markAsChanged();
			} else {
				this._isChanged = false;
			}
			if (isLocked) {
				this.getEditor()?._toolPanel.disableSaveButton();
				return;
			}
			this.getEditor().enableSaveButton();
		}
	}

	/* eslint-disable no-underscore-dangle,@bitrix24/bitrix24-rules/no-pseudo-private */

	/**
	 * The block applies the setting by its own request, so the field has no value to save or to roll back.
	 */
	class DashboardShareSettingField extends BX.UI.EntityEditorCustom {
		#blockNode = null;
		static create(id, settings) {
			const self = new this(id, settings);
			self.initialize(id, settings);
			return self;
		}
		layout(options) {
			if (this._hasLayout) {
				return;
			}
			this.ensureWrapperCreated({
				classNames: ['ui-entity-editor-field-text']
			});
			this.adjustWrapper();
			this._innerWrapper = main_core.Tag.render`<div class="ui-entity-editor-content-block"></div>`;
			main_core.Dom.append(this.#getBlockNode(), this._innerWrapper);
			main_core.Dom.append(this._innerWrapper, this._wrapper);
			this.registerLayout(options);
			this._hasLayout = true;
		}
		#getBlockNode() {
			if (!this.#blockNode) {
				const data = this._schemeElement.getData();
				this.#blockNode = new biconnector_shareSetting.ShareSettingBlock({
					dashboardId: main_core.Text.toInteger(data.dashboardId),
					state: {
						isBanned: Boolean(data.state?.isBanned),
						canChange: Boolean(data.state?.canChange)
					}
				}).render();
			}
			return this.#blockNode;
		}
		hasContentToDisplay() {
			return true;
		}
		getValue() {
			return '';
		}
		save() {}
	}

	class FieldFactory {
		constructor(entityEditorControlFactory = 'BX.UI.EntityEditorControlFactory') {
			main_core_events.EventEmitter.subscribe(`${entityEditorControlFactory}:onInitialize`, event => {
				const [, eventArgs] = event.getCompatData();
				eventArgs.methods.dashboardSettings = this.factory.bind(this);
			});
		}
		factory(type, controlId, settings) {
			switch (type) {
				case 'dashboardGroupsSelector':
					return DashboardGroupsField.create(controlId, settings);
				case 'dashboardShareSetting':
					return DashboardShareSettingField.create(controlId, settings);
				default:
					return null;
			}
		}
	}

	class SettingsPanel {
		static registerFieldFactory(entityEditorControlFactory) {
			new FieldFactory(entityEditorControlFactory);
		}
		static registerControllerFactory(entityEditorControllerFactory) {
			new ControllerFactory(entityEditorControllerFactory);
		}
	}

	exports.SettingsPanel = SettingsPanel;

})(this.BX.BIConnector.ApacheSuperset = this.BX.BIConnector.ApacheSuperset || {}, BX.Event, BX, BX.BIConnector, window, window, BX, BX.UI, BX.BIConnector, BX.BIConnector.ShareSetting);
