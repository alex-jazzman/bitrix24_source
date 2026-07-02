/* eslint-disable */
this.BX = this.BX || {};
(function (exports, main_core, ui_section, ui_analytics, main_core_events, ui_formElements_field, ui_formElements_view, ui_draganddrop_draggable, ui_switcher, ui_switcherNested, ui_dialogs_messagebox, ui_iconSet_main, ui_iconSet_actions, ui_forms, ui_buttons, ui_iconSet_crm, ui_alerts, ui_uploader_stackWidget, ui_ears, intranet_themePicker_dialog, main_loader, ui_iconSet_social, ui_form, main_popup, intranet_notifyBanner_pushOtp) {
	'use strict';

	class Analytic {
		#eventList = [];
		#tool = 'settings';
		#context = null;
		constructor(context = null) {
			this.#context = context;
		}
		getContext() {
			return this.#context;
		}
		addEvent(eventType, eventData) {
			if (this.#context.isBitrix24) {
				this.#eventList[eventType] = eventData;
			}
		}
		send() {
			if (!this.#context.isBitrix24) {
				return;
			}
			if (Object.keys(this.#eventList).length > 0) {
				main_core.ajax.runComponentAction('bitrix:intranet.settings', 'analytic', {
					mode: 'class',
					data: {
						data: this.#eventList
					}
				}).then(() => {});
			}
			this.#eventList = [];
		}
		addEventOpenSettings() {
			const options = {
				event: AnalyticSettingsEvent.OPEN,
				tool: this.#tool,
				category: 'slider',
				p1: this.#context?.isAdmin !== false ? AnalyticSettingsUserRole.ADMIN : AnalyticSettingsUserRole.NOT_ADMIN,
				c_section: this.#context?.analyticContext ?? '',
				c_element: this.#context?.locationName
			};
			ui_analytics.sendData(options);
			//this.addEvent(AnalyticSettingsEvent.OPEN, options);
		}
		addEventOpenTariffSelector(fieldName) {
			const options = {
				event: 'open_tariff',
				tool: this.#tool,
				category: fieldName,
				p1: this.#context?.isAdmin !== false ? AnalyticSettingsUserRole.ADMIN : AnalyticSettingsUserRole.NOT_ADMIN
			};
			this.addEvent(fieldName + '_open_tariff', options);
		}
		addEventOpenHint(fieldName) {
			const options = {
				event: 'open_hint',
				tool: this.#tool,
				category: fieldName,
				p1: this.#context?.isAdmin !== false ? AnalyticSettingsUserRole.ADMIN : AnalyticSettingsUserRole.NOT_ADMIN
			};
			this.addEvent(fieldName + '_open_hint', options);
		}
		addEventStartPagePage(page) {
			const options = {
				event: AnalyticSettingsEvent.START_PAGE,
				tool: this.#tool,
				category: page,
				p1: this.#context?.isAdmin !== false ? AnalyticSettingsUserRole.ADMIN : AnalyticSettingsUserRole.NOT_ADMIN
			};
			ui_analytics.sendData(options);
		}
		addEventChangePage(page) {
			const options = {
				event: AnalyticSettingsEvent.VIEW,
				tool: this.#tool,
				category: page,
				p1: this.#context?.isAdmin !== false ? AnalyticSettingsUserRole.ADMIN : AnalyticSettingsUserRole.NOT_ADMIN
			};
			ui_analytics.sendData(options);
		}
		addEventToggleTools(toolName, state) {
			const event = 'onoff_tools';
			const options = {
				event: event,
				tool: this.#tool,
				category: 'tools',
				type: toolName,
				c_element: this.#context?.locationName,
				p1: this.#context?.isAdmin !== false ? AnalyticSettingsUserRole.ADMIN : AnalyticSettingsUserRole.NOT_ADMIN,
				p2: state ? AnalyticSettingsTurnState.ON : AnalyticSettingsTurnState.OFF
			};
			this.addEvent('tools' + toolName + '_' + event, options);
		}
		addEventToggle2fa(state) {
			const event = '2fa_onoff';
			const options = {
				event: event,
				tool: this.#tool,
				category: 'security',
				p1: this.#context?.isAdmin !== false ? AnalyticSettingsUserRole.ADMIN : AnalyticSettingsUserRole.NOT_ADMIN,
				p2: state ? AnalyticSettingsTurnState.ON : AnalyticSettingsTurnState.OFF
			};
			this.addEvent('security_' + event, options);
		}
		addEventEnablePushOtp() {
			const options = {
				event: 'click_setting_portal',
				tool: this.#tool,
				category: 'security',
				c_element: 'banner_on'
			};
			ui_analytics.sendData(options);
		}
		addEventConfigPortal(event) {
			const options = {
				event: event,
				tool: this.#tool,
				category: AnalyticSettingsCategory.PORTAL
			};
			this.addEvent('portal_' + event, options);
		}
		addEventChangeTheme(themeId) {
			const regex = /custom_\d+/;
			const preparedThemeId = regex.test(themeId) ? 'themeName_custom' : 'themeName_' + themeId;
			const options = {
				event: AnalyticSettingsEvent.CHANGE_PORTAL_THEME,
				tool: this.#tool,
				category: AnalyticSettingsCategory.PORTAL,
				type: AnalyticSettingsType.COMMON,
				c_section: AnalyticSettingsSection.SETTINGS,
				p1: preparedThemeId
			};
			this.addEvent('portal_' + AnalyticSettingsEvent.CHANGE_PORTAL_THEME, options);
		}
		addEventConfigEmployee(event, state) {
			const options = {
				event: event,
				tool: this.#tool,
				category: 'employee',
				p1: this.#context?.isAdmin !== false ? AnalyticSettingsUserRole.ADMIN : AnalyticSettingsUserRole.NOT_ADMIN,
				p2: state ? AnalyticSettingsTurnState.ON : AnalyticSettingsTurnState.OFF
			};
			this.addEvent('employee_' + event, options);
		}
		addEventConfigConfiguration(event, state) {
			const options = {
				event: event,
				tool: this.#tool,
				category: 'configuration',
				p1: this.#context?.isAdmin !== false ? AnalyticSettingsUserRole.ADMIN : AnalyticSettingsUserRole.NOT_ADMIN,
				p2: state ? AnalyticSettingsTurnState.ON : AnalyticSettingsTurnState.OFF
			};
			this.addEvent('configuration_' + event, options);
		}
		addEventConfigRequisite(event) {
			const options = {
				event: event,
				tool: this.#tool,
				category: 'requisite',
				c_element: this.#context?.locationName,
				p1: this.#context?.isAdmin !== false ? AnalyticSettingsUserRole.ADMIN : AnalyticSettingsUserRole.NOT_ADMIN
			};
			ui_analytics.sendData(options);
		}
	}
	class AnalyticSettingsCategory {
		static TOOLS = 'tools';
		static SECURITY = 'security';
		static AI = 'ai';
		static PORTAL = 'portal';
		static EMPLOYEE = 'employee';
		static COMMUNICATION = 'communication';
		static REQUISITE = 'requisite';
		static SCHEDULE = 'schedule';
		static CONFIGURATION = 'configuration';
	}
	class AnalyticSettingsEvent {
		static OPEN = 'open_setting';
		static START_PAGE = 'start_page';
		static VIEW = 'view';
		static TFA = '2fa_onoff';
		static CHANGE_PORTAL_NAME = 'change_portal_name';
		static CHANGE_PORTAL_LOGO = 'change_portal_logo';
		static CHANGE_PORTAL_SITE = 'change_portal_site';
		static CHANGE_PORTAL_THEME = 'change_portal_theme';
		static CHANGE_MARKET = 'change_market';
		static CHANGE_PAY_TARIFF = 'change_pay_tariff';
		static CREATE_CARD = 'create_vizitka';
		static EDIT_CARD = 'edit_vizitka';
		static COPY_LINK_CARD = 'copylink_vizitka';
		static OPEN_ADD_COMPANY = 'open_add_company';
		static CHANGE_QUICK_REG = 'change_quick_reg';
		static CHANGE_REG_ALL = 'change_reg_all';
		static CHANGE_COLLABERS_INVITATION = 'change_collabers_invitation';
		static CHANGE_EXTRANET_INVITE = 'change_extranet_invite';
	}
	class AnalyticSettingsSection {
		static SETTINGS = 'settings';
	}
	class AnalyticSettingsType {
		static COMMON = 'common';
	}
	class AnalyticSettingsUserRole {
		static ADMIN = 'isAdmin_Y';
		static NOT_ADMIN = 'isAdmin_N';
	}
	class AnalyticSettingsTurnState {
		static ON = 'turn_on';
		static OFF = 'turn_off';
	}

	class SiteTitle24Field extends ui_formElements_field.BaseSettingsElement {
		#checker;
		#content;
		constructor(params) {
			super();
			this.setEventNamespace('BX.Intranet.Settings');
			this.#checker = new ui_formElements_view.Checker({
				id: 'siteLogo24',
				inputName: 'logo24',
				title: params.title ?? main_core.Loc.getMessage('INTRANET_SETTINGS_SECTION_TITLE_SITE_LOGO24'),
				size: 'extra-small',
				// hintOn: '',
				// hintOff: '',
				isEnable: params.isEnable,
				checked: params.checked !== '',
				value: 'Y',
				bannerCode: 'limit_admin_logo24',
				hideSeparator: true
			});
		}
		getFieldView() {
			return this.#checker;
		}
		render() {
			if (this.#content) {
				return this.#content;
			}
			this.#content = main_core.Tag.render`
			<div class="ui-section__field-selector --align-center">
				<div class="ui-section__hint">
					${this.#checker.render()}
				</div>
			</div>
		`;
			return this.#content;
		}
	}

	class SiteTitleField extends ui_formElements_field.BaseSettingsElement {
		#content;
		#contentLogo24;
		#title;
		#logo24;
		#inputMonitoringIntervalId;
		#inputMonitoringCountdown = 10;
		#inputMonitoringPrevState;
		constructor(params) {
			super(params);
			this.setParentElement(params.parent);
			this.setEventNamespace('BX.Intranet.Settings');
			const options = params.siteTitleOptions;
			this.options = {
				title: options.title,
				canUserEditTitle: options.canUserEditTitle,
				logo24: options.logo24,
				canUserEditLogo24: options.canUserEditLogo24
			};
			const labels = params.siteTitleLabels;
			this.labels = {
				title: labels.title,
				logo24: labels.logo24
			};
			this.#initTitle(options, labels);
			this.#initLogo24(options, labels);
		}
		#initTitle(options, labels) {
			this.#title = new ui_formElements_view.TextInput({
				value: options.title,
				placeholder: options.title,
				label: labels.title ?? main_core.Loc.getMessage('INTRANET_SETTINGS_SECTION_TITLE_SITE_TITLE_INPUT_LABEL'),
				id: 'siteTitle',
				inputName: 'title',
				isEnable: true
				// bannerCode: '123',
				// helpDeskCode: '234',
				// helpMessageProvider: () => {}
			});
			this.#title.setEventNamespace(this.getEventNamespace());
		}
		#initLogo24(options, labels) {
			this.#logo24 = new SiteTitle24Field({
				title: labels.logo24,
				isEnable: options.canUserEditLogo24,
				checked: options.logo24
			});
		}
		getFieldView() {
			return this.#title;
		}
		cancel() {}
		startInputMonitoring() {
			if (this.#inputMonitoringIntervalId > 0) {
				return;
			}
			this.#inputMonitoringIntervalId = setInterval(this.monitorInput.bind(this), 500);
		}
		stopInputMonitoring() {
			if (this.#inputMonitoringIntervalId > 0) {
				clearInterval(this.#inputMonitoringIntervalId);
				this.#inputMonitoringIntervalId = null;
			}
		}
		monitorInput() {
			const value = this.#title.getInputNode().value;
			if (this.#inputMonitoringPrevState !== value) {
				this.#inputMonitoringCountdown = 10;
				this.#inputMonitoringPrevState = value;
				main_core_events.EventEmitter.emit(main_core_events.EventEmitter.GLOBAL_TARGET, this.getEventNamespace() + ':Portal:Change', new main_core_events.BaseEvent({
					data: {
						title: value
					}
				}));
			} else if (--this.#inputMonitoringCountdown <= 0) {
				this.stopInputMonitoring();
			}
		}
		render() {
			if (this.#content) {
				return this.#content;
			}
			main_core.Event.bind(this.#title.getInputNode(), 'focus', this.startInputMonitoring.bind(this));
			main_core.Event.bind(this.#title.getInputNode(), 'keydown', this.startInputMonitoring.bind(this));
			main_core.Event.bind(this.#title.getInputNode(), 'click', this.startInputMonitoring.bind(this));
			main_core.Event.bind(this.#title.getInputNode(), 'blur', this.stopInputMonitoring.bind(this));
			main_core.Event.bind(this.#title.getInputNode(), 'blur', this.stopInputMonitoring.bind(this));
			this.#logo24.getFieldView().subscribe('change', event => {
				main_core_events.EventEmitter.emit(main_core_events.EventEmitter.GLOBAL_TARGET, this.getEventNamespace() + ':Portal:Change', new main_core_events.BaseEvent({
					data: {
						logo24: event.getData() === true ? '24' : ''
					}
				}));
			});
			this.#content = main_core.Tag.render`
		<div id="${this.#title.getId()}" class="ui-section__field-selector --no-border --no-margin --align-center">
			<div class="ui-section__field-container">
				<div class="ui-section__field-label_box">
					<label class="ui-section__field-label" for="${this.#title.getName()}">
						${this.#title.getLabel()}
					</label> 
				</div>
				<div class="ui-section__field-inner">
					<div class="ui-ctl ui-ctl-textbox ui-ctl-block">
						${this.#title.getInputNode()}
					</div>
				</div>
			</div>
		</div>
		`;
			return this.#content;
		}
		getLogo24Field() {
			return this.#logo24;
		}
	}

	class Navigation {
		#settings;
		#currentPage;
		#prevPage;
		constructor(settings) {
			this.#settings = settings;
			main_core_events.EventEmitter.subscribe('BX.Intranet.SettingsNavigation:onMove', event => {
				const {
					page,
					fieldName
				} = event.data;
				if (this.getCurrentPage()?.getType() === page) {
					this.moveTo(this.getCurrentPage(), fieldName);
					return;
				}
				const pageObj = this.getPageByType(page);
				if (!pageObj?.hasData()) {
					main_core_events.EventEmitter.subscribeOnce('BX.Intranet.Settings:onPageComplete', event => {
						if (event.data.page.hasContent()) {
							this.moveTo(event.data.page, fieldName);
						}
					});
				}
				main_core_events.EventEmitter.subscribeOnce('BX.Intranet.Settings:onAfterShowPage', event => {
					if (event.data.page.hasContent()) {
						this.moveTo(event.data.page, fieldName);
					}
				});
				this.#settings.show(page);
			});
		}
		getPageByType(type) {
			return this.getPages().find(page => {
				return page.getType() === type;
			});
		}
		getCurrentPage() {
			return this.#currentPage;
		}
		getPrevPage() {
			return this.#prevPage;
		}
		changePage(page) {
			if (!(page instanceof ui_formElements_field.BaseSettingsPage)) {
				console.log('Not found "' + type + '" page');
				return;
			}
			if (page === this.#currentPage) {
				return;
			}
			this.#prevPage = this.#currentPage;
			this.#currentPage = page;
		}
		getPages() {
			return this.#settings.getChildrenElements();
		}
		updateAddressBar() {
			let url = new URL(window.location.href);
			url.searchParams.set('page', this.getCurrentPage()?.getType());
			url.searchParams.delete('IFRAME');
			url.searchParams.delete('IFRAME_TYPE');
			top.window.history.replaceState(null, '', url.toString());
		}
		findByFieldName(rootNode, fieldName) {
			const node = ui_formElements_field.RecursiveFilteringVisitor.startFrom(rootNode, node => {
				if (node instanceof ui_formElements_field.SettingsSection && node.getSectionView().getId() === fieldName) {
					return true;
				}
				if (node instanceof ui_formElements_field.TabField && node.getFieldView().getId() === fieldName) {
					return true;
				}
				return (node instanceof ui_formElements_field.SettingsField || node instanceof SiteTitleField || node instanceof SiteTitle24Field) && (node.getFieldView().getName() === fieldName || node.getFieldView().getId() === fieldName);
			});
			return node.shift() ?? null;
		}
		scrollToNode(node) {
			const element = node.render();
			const headerOffset = 45;
			const elementPosition = element.getBoundingClientRect().top;
			const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
			scrollTo({
				top: offsetPosition,
				behavior: "smooth"
			});
		}
		moveTo(element, fieldName) {
			const fieldNode = this.findByFieldName(element, fieldName);
			if (main_core.Type.isNil(fieldNode)) {
				return;
			}
			let isColored = false;
			ui_formElements_field.AscendingOpeningVisitor.startFrom(fieldNode, element => {
				if (element instanceof ui_formElements_field.SettingsRow) {
					element.getRowView().show();
				} else if (element instanceof ui_formElements_field.SettingsSection) {
					element.getSectionView().toggle(true, false);
				} else if (element instanceof ui_formElements_field.TabField) {
					const tabs = element.getParentElement();
					if (tabs instanceof ui_formElements_field.TabsField) {
						tabs.activateTab(element, false);
					}
				}
				if (!isColored) {
					isColored = element.highlight();
				}
			});
			this.scrollToNode(fieldNode);
		}
	}

	class ToolsPage extends ui_formElements_field.BaseSettingsPage {
		#inputForSaveSortTools;
		#toolsWrapperRow;
		#draggable;
		#mainSection;
		#settingsSection;
		constructor() {
			super();
			this.titlePage = main_core.Loc.getMessage('INTRANET_SETTINGS_TITLE_PAGE_TOOLS');
			this.descriptionPage = main_core.Loc.getMessage('INTRANET_SETTINGS_DESCRIPTION_PAGE_TOOLS');
		}
		getType() {
			return 'tools';
		}
		appendSections(contentNode) {
			const description = new ui_section.Row({
				content: this.getDescription().getContainer()
			});
			new ui_formElements_field.SettingsRow({
				row: description,
				parent: this.#getSettingsSection()
			});
			if (this.hasValue('tools')) {
				this.#renderToolsSelectors();
			}
			this.#getSettingsSection().renderTo(contentNode);
		}
		#renderToolsSelectors() {
			const tools = this.getValue('tools');
			const startSort = [];
			Object.keys(tools).forEach(item => {
				startSort.push(tools[item].menuId);
				const tool = tools[item];
				const subgroups = tool.subgroups;
				let toolSelectorItems = [];
				if (Object.keys(subgroups).length > 0) {
					toolSelectorItems = this.#getToolsSelectorsItems(subgroups, tool);
				}
				const toolSelector = new ui_switcherNested.SwitcherNested({
					id: tool.code,
					title: tool.name,
					link: this.getPermission().canEdit() ? tool['settings-path'] : null,
					infoHelperCode: this.getPermission().canEdit() ? tool['infohelper-slider'] : null,
					linkTitle: tool['settings-title'] ?? main_core.Loc.getMessage('INTRANET_SETTINGS_SECTION_TOOLS_LINK_SETTINGS'),
					isChecked: tool.enabled,
					mainInputName: tool.code,
					isOpen: false,
					items: toolSelectorItems,
					isDisabled: !this.getPermission().canEdit(),
					isDefault: tool.default,
					helpMessage: !this.getPermission().canEdit() ? main_core.Loc.getMessage('INTRANET_SETTINGS_ELEMENT_PERMISSION_MSG') : main_core.Loc.getMessage('INTRANET_SETTINGS_FIELD_HELP_MESSAGE_DISABLED', {
						'#TOOL#': tool.name
					})
				});
				const switcher = ui_switcher.Switcher.getById(tool.code);
				if (switcher) {
					if (tool.disableConfirmation.isNeeded) {
						main_core_events.EventEmitter.subscribe(switcher, 'toggled', () => {
							if (!switcher.isChecked()) {
								this.#showDisableConfirmation(tool, switcher);
							}
						});
					}
					if (tool.enableConfirmation?.isNeeded) {
						main_core_events.EventEmitter.subscribe(switcher, 'toggled', () => {
							if (switcher.isChecked()) {
								this.#showEnableConfirmation(tool, switcher);
							}
						});
					}
				}
				const toolSelectorSection = new ui_formElements_field.SettingsSection({
					section: toolSelector
				});
				main_core.Dom.style(toolSelectorSection.getSectionView().render(), 'margin-bottom', '8px');
				main_core.Dom.attr(toolSelectorSection.getSectionView().render(), 'data-menu-id', tool.menuId);
				this.#getToolsWrapperRow().append(toolSelectorSection.getSectionView().render());
				new ui_formElements_field.SettingsRow({
					row: this.#getToolsWrapperRow(),
					parent: this.#getSettingsSection(),
					child: toolSelectorSection
				});
			});
		}
		#getSubToolHelpMessage(tool, parentToolName) {
			if (!this.getPermission().canEdit()) {
				return main_core.Loc.getMessage('INTRANET_SETTINGS_ELEMENT_PERMISSION_MSG');
			}
			if (tool.disabled) {
				return main_core.Loc.getMessage('INTRANET_SETTINGS_FIELD_HELP_MESSAGE_DISABLED', {
					'#TOOL#': tool.name
				});
			}
			if (tool.default) {
				return main_core.Loc.getMessage('INTRANET_SETTINGS_FIELD_HELP_MESSAGE_MAIN_TOOL', {
					'#TOOL#': parentToolName ?? ''
				});
			}
			return '';
		}
		#getToolsSelectorsItems(subgroups, tool) {
			const toolSelectorItems = [];
			Object.keys(subgroups).forEach(item => {
				const subgroupConfig = subgroups[item];
				if (main_core.Type.isNull(subgroupConfig.name) || main_core.Type.isNull(subgroupConfig.code) || main_core.Type.isNull(subgroupConfig.enabled)) {
					return;
				}
				const toolSelectorItem = new ui_switcherNested.SwitcherNestedItem({
					title: subgroupConfig.name,
					id: subgroupConfig.code,
					inputName: subgroupConfig.code,
					isChecked: subgroupConfig.enabled,
					settingsPath: this.getPermission().canEdit() ? subgroupConfig['settings_path'] : null,
					settingsTitle: subgroupConfig['settings_title'] ?? main_core.Loc.getMessage('INTRANET_SETTINGS_SECTION_TOOLS_LINK_SETTINGS'),
					infoHelperCode: this.getPermission().canEdit() ? subgroupConfig['infohelper-slider'] : null,
					isDisabled: !this.getPermission().canEdit(),
					isDefault: subgroupConfig.default ?? subgroupConfig.disabled ?? false,
					helpMessage: this.#getSubToolHelpMessage(subgroupConfig, tool.name)
				});
				if (subgroupConfig.disabled) {
					main_core.Dom.style(toolSelectorItem.getSwitcher().getNode(), {
						opacity: '0.4'
					});
				} else {
					main_core_events.EventEmitter.subscribe(toolSelectorItem.getSwitcher(), 'toggled', () => {
						this.getAnalytic()?.addEventToggleTools(subgroupConfig.code, toolSelectorItem.getSwitcher().isChecked());
					});
				}
				if (subgroupConfig.code === 'tool_subgroup_team_work_instant_messenger') {
					main_core.Event.bind(toolSelectorItem.getSwitcher().getNode(), 'click', () => {
						if (!toolSelectorItem.getSwitcher().isChecked()) {
							this.#getWarningMessage(subgroupConfig.code, toolSelectorItem.getSwitcher().getNode(), main_core.Loc.getMessage('INTRANET_SETTINGS_WARNING_TOOL_INSTANT_MESSENGER')).show();
						}
					});
				}
				toolSelectorItems.push(toolSelectorItem);
			});
			return toolSelectorItems;
		}
		#getMainSection() {
			if (this.#mainSection) {
				return this.#mainSection;
			}
			this.#mainSection = new ui_section.Section(this.getValue('sectionTools'));
			return this.#mainSection;
		}
		#getSettingsSection() {
			if (this.#settingsSection) {
				return this.#settingsSection;
			}
			this.#settingsSection = new ui_formElements_field.SettingsSection({
				section: this.#getMainSection(),
				parent: this
			});
			return this.#settingsSection;
		}
		getDescription() {
			const descriptionText = `
			${main_core.Loc.getMessage('INTRANET_SETTINGS_SECTION_TOOLS_DESCRIPTION')}
			<a class="ui-section__link" onclick="top.BX.Helper.show('redirect=detail&code=18213196')">
				${main_core.Loc.getMessage('INTRANET_SETTINGS_CANCEL_MORE')}
			</a>
		`;
			return new BX.UI.Alert({
				text: descriptionText,
				inline: true,
				size: BX.UI.Alert.Size.SMALL,
				color: BX.UI.Alert.Color.PRIMARY,
				animated: true
			});
		}
		#getInputForSaveSortTools() {
			if (this.#inputForSaveSortTools) {
				return this.#inputForSaveSortTools;
			}
			this.#inputForSaveSortTools = main_core.Tag.render`
			<input type="hidden" name="tools-sort">
		`;
			return this.#inputForSaveSortTools;
		}
		#getDraggable() {
			if (this.#draggable) {
				return this.#draggable;
			}
			this.#draggable = new ui_draganddrop_draggable.Draggable({
				container: [this.#getToolsWrapperRow().render()],
				draggable: '.--tool-selector',
				dragElement: '.ui-section__dragdrop-icon-wrapper',
				type: ui_draganddrop_draggable.Draggable.CLONE
			});
			return this.#draggable;
		}
		#getToolsWrapperRow() {
			if (this.#toolsWrapperRow) {
				return this.#toolsWrapperRow;
			}
			this.#toolsWrapperRow = new ui_section.Row({});
			return this.#toolsWrapperRow;
		}
		#getWarningMessage(toolId, bindElement, message) {
			return BX.PopupWindowManager.create(toolId, bindElement, {
				content: message,
				darkMode: true,
				autoHide: true,
				angle: true,
				offsetLeft: 14,
				bindOptions: {
					position: 'bottom'
				},
				closeByEsc: true
			});
		}
		#showEnableConfirmation(tool, switcher) {
			if (tool.enableConfirmation.jsExtension && tool.enableConfirmation.jsExportName) {
				this.#showCustomEnableConfirmation(tool, switcher);
			} else {
				this.#showSimpleEnableConfirmation(tool);
			}
		}
		#showSimpleEnableConfirmation(tool) {
			ui_dialogs_messagebox.MessageBox.show({
				title: tool.enableConfirmation.title,
				message: tool.enableConfirmation.text,
				useAirDesign: true,
				okCaption: tool.enableConfirmation.confirmCaption,
				buttons: ui_dialogs_messagebox.MessageBoxButtons.OK,
				maxWidth: 360,
				popupOptions: {
					id: 'enable-tool-confirmation-' + tool.code
				}
			});
		}
		#showCustomEnableConfirmation(tool, switcher) {
			this.#setSaveButtonDisabled(true);
			main_core.Runtime.loadExtension(tool.enableConfirmation.jsExtension).then(exports => {
				const PopupClass = exports[tool.enableConfirmation.jsExportName];
				if (!PopupClass) {
					this.#setSaveButtonDisabled(false);
					return;
				}
				const popup = new PopupClass({
					formNode: this.getFormNode(),
					toolCode: tool.code
				});
				popup.show().then(() => {
					this.#setSaveButtonDisabled(false);
				}).catch(() => {
					switcher.check(false, false);
					this.#setSaveButtonDisabled(false);
				});
			});
		}
		#setSaveButtonDisabled(disabled) {
			const saveBtn = document.querySelector('#intranet-settings-page #ui-button-panel-save');
			if (saveBtn) {
				saveBtn.disabled = disabled;
				if (disabled) {
					main_core.Dom.addClass(saveBtn, 'ui-btn-disabled');
				} else {
					main_core.Dom.removeClass(saveBtn, 'ui-btn-disabled');
				}
			}
		}
		#showDisableConfirmation(tool) {
			ui_dialogs_messagebox.MessageBox.show({
				title: tool.disableConfirmation.title,
				message: tool.disableConfirmation.text,
				useAirDesign: true,
				okCaption: tool.disableConfirmation.confirmCaption,
				buttons: ui_dialogs_messagebox.MessageBoxButtons.OK,
				maxWidth: 360,
				popupOptions: {
					id: 'disable-tool-confirmation-' + tool.code
				}
			});
		}
	}

	class EmployeePage extends ui_formElements_field.BaseSettingsPage {
		constructor() {
			super();
			this.titlePage = main_core.Loc.getMessage('INTRANET_SETTINGS_TITLE_PAGE_EMPLOYEE');
			this.descriptionPage = main_core.Loc.getMessage('INTRANET_SETTINGS_DESCRIPTION_PAGE_EMPLOYEE_BOX');
		}
		onSuccessDataFetched(response) {
			super.onSuccessDataFetched(response);
			if (this.hasValue('IS_BITRIX_24') && this.getValue('IS_BITRIX_24')) {
				this.descriptionPage = main_core.Loc.getMessage('INTRANET_SETTINGS_DESCRIPTION_PAGE_EMPLOYEE');
				this.render().querySelector('.intranet-settings__page-header_desc').innerText = this.descriptionPage;
			}
		}
		getType() {
			return 'employee';
		}
		appendSections(contentNode) {
			let profileSection = this.#buildProfileSection();
			profileSection?.renderTo(contentNode);
			let inviteSection = this.#buildInviteSection();
			inviteSection?.renderTo(contentNode);
			let additionalSection = this.#buildAdditionalSection();
			additionalSection?.renderTo(contentNode);
		}
		#buildAdditionalSection() {
			if (!this.hasValue('SECTION_ADDITIONAL')) {
				return;
			}
			let additionalSection = new ui_section.Section(this.getValue('SECTION_ADDITIONAL'));
			let sectionSettings = new ui_formElements_field.SettingsSection({
				section: additionalSection,
				parent: this
			});
			if (this.hasValue('allow_company_pulse')) {
				let companyPulseField = new ui_formElements_view.Checker(this.getValue('allow_company_pulse'));
				main_core_events.EventEmitter.subscribe(companyPulseField.switcher, 'toggled', () => {
					this.getAnalytic()?.addEventConfigEmployee(AnalyticSettingsEvent.CHANGE_QUICK_REG, companyPulseField.isChecked());
				});
				EmployeePage.addToSectionHelper(companyPulseField, sectionSettings);
			}
			return sectionSettings;
		}
		#buildProfileSection() {
			if (!this.hasValue('SECTION_PROFILE')) {
				return;
			}
			let profileSection = new ui_section.Section(this.getValue('SECTION_PROFILE'));
			let sectionSettings = new ui_formElements_field.SettingsSection({
				section: profileSection,
				parent: this
			});
			if (this.hasValue('fieldFormatName')) {
				let hasSelectValue = false;
				let currentValue = this.getValue('fieldFormatName').current;
				for (let value of this.getValue('fieldFormatName').values) {
					if (value.selected === true) {
						hasSelectValue = true;
					}
				}
				this.getValue('fieldFormatName').values.push({
					value: 'other',
					name: main_core.Loc.getMessage('INTRANET_SETTINGS_FIELD_OPTION_OTHER'),
					selected: !hasSelectValue
				});
				let nameFormatField = new ui_formElements_view.Selector({
					label: this.getValue('fieldFormatName').label ?? main_core.Loc.getMessage('INTRANET_SETTINGS_FIELD_LABEL_NAME_FORMAT'),
					name: this.getValue('fieldFormatName').name + '_selector',
					items: this.getValue('fieldFormatName').values,
					hints: this.getValue('fieldFormatName').hints,
					current: this.getValue('fieldFormatName').current
				});
				let settingsField = new ui_formElements_field.SettingsField({
					fieldView: nameFormatField
				});
				new ui_formElements_field.SettingsRow({
					child: settingsField,
					parent: sectionSettings
				});
				let customFormatNameField = new ui_formElements_view.TextInput({
					inputName: this.getValue('fieldFormatName').name,
					label: '',
					value: currentValue
				});
				settingsField = new ui_formElements_field.SettingsField({
					fieldView: customFormatNameField
				});
				let customFormatNameRow = new ui_section.Row({
					isHidden: true
				});
				new ui_formElements_field.SettingsRow({
					row: customFormatNameRow,
					parent: sectionSettings,
					child: settingsField
				});
				if (!hasSelectValue) {
					customFormatNameRow.show();
				}
				nameFormatField.getInputNode().addEventListener('change', event => {
					if (event.target.value === 'other') {
						customFormatNameRow.show();
					} else {
						customFormatNameField.getInputNode().value = nameFormatField.getInputNode().value;
						customFormatNameRow.hide();
					}
				});
			}
			if (this.hasValue('fieldFormatPhoneNumber')) {
				let formatNumberField = new ui_formElements_view.Selector(this.getValue('fieldFormatPhoneNumber'));
				EmployeePage.addToSectionHelper(formatNumberField, sectionSettings);
			}
			if (this.hasValue('fieldFormatAddress')) {
				let addressFormatField = new ui_formElements_view.Selector(this.getValue('fieldFormatAddress'));
				let addressFormatRow = new ui_section.Row({
					separator: this.hasValue('show_year_for_female') ? 'bottom' : null,
					className: '--block'
				});
				EmployeePage.addToSectionHelper(addressFormatField, sectionSettings, addressFormatRow);
			}
			if (this.hasValue('show_year_for_female')) {
				let showBirthYearField = new ui_formElements_view.InlineChecker(this.getValue('show_year_for_female'));
				EmployeePage.addToSectionHelper(showBirthYearField, sectionSettings);
			}
			return sectionSettings;
		}
		#buildInviteSection() {
			if (!this.hasValue('SECTION_INVITE')) {
				return;
			}
			let inviteSection = new ui_section.Section(this.getValue('SECTION_INVITE'));
			let sectionSettings = new ui_formElements_field.SettingsSection({
				section: inviteSection,
				parent: this
			});
			if (this.hasValue('allow_register')) {
				let fastReqField = new ui_formElements_view.Checker(this.getValue('allow_register'));
				main_core_events.EventEmitter.subscribe(fastReqField.switcher, 'toggled', () => {
					this.getAnalytic()?.addEventConfigEmployee(AnalyticSettingsEvent.CHANGE_QUICK_REG, fastReqField.isChecked());
				});
				EmployeePage.addToSectionHelper(fastReqField, sectionSettings);
			}
			if (this.hasValue('allow_invite_collabers')) {
				let inviteCollabersField = new ui_formElements_view.Checker(this.getValue('allow_invite_collabers'));
				main_core_events.EventEmitter.subscribe(inviteCollabersField.switcher, 'toggled', () => {
					this.getAnalytic()?.addEventConfigEmployee(AnalyticSettingsEvent.CHANGE_COLLABERS_INVITATION, inviteCollabersField.isChecked());
				});
				EmployeePage.addToSectionHelper(inviteCollabersField, sectionSettings);
			}
			if (this.hasValue('show_fired_employees')) {
				let showQuitField = new ui_formElements_view.Checker(this.getValue('show_fired_employees'));
				EmployeePage.addToSectionHelper(showQuitField, sectionSettings);
			}
			if (this.hasValue('general_chat_message_join')) {
				let newUserField = new ui_formElements_view.Checker(this.getValue('general_chat_message_join'));
				EmployeePage.addToSectionHelper(newUserField, sectionSettings);
			}
			if (this.hasValue('allow_new_user_lf')) {
				let newUserLfField = new ui_formElements_view.Checker(this.getValue('allow_new_user_lf'));
				EmployeePage.addToSectionHelper(newUserLfField, sectionSettings);
			}
			if (this.hasValue('feature_extranet')) {
				let extranetField = new ui_formElements_view.Checker(this.getValue('feature_extranet'));
				main_core_events.EventEmitter.subscribe(extranetField.switcher, 'toggled', () => {
					this.getAnalytic()?.addEventConfigEmployee(AnalyticSettingsEvent.CHANGE_EXTRANET_INVITE, extranetField.isChecked());
				});
				EmployeePage.addToSectionHelper(extranetField, sectionSettings);
			}
			return sectionSettings;
		}
	}

	class ButtonBar {
		#buttonBarElement;
		#buttons;
		constructor(buttons = []) {
			this.#buttons = buttons;
		}
		render() {
			if (this.#buttonBarElement) {
				return this.#buttonBarElement;
			}
			this.#buttonBarElement = main_core.Tag.render`<div class="intranet-settings__button_bar"></div>`;
			for (const button of this.#buttons) {
				main_core.Dom.append(button.getContainer(), this.#buttonBarElement);
			}
			return this.#buttonBarElement;
		}
		getButtons() {
			return this.#buttons;
		}
		addButton(button) {
			this.#buttons.push(button);
			main_core.Dom.append(button.getContainer(), this.render());
		}
	}

	class LandingButton {
		#button;
		constructor() {
			this.#button = new ui_buttons.Button({
				className: 'landing-button-trigger',
				round: true,
				noCaps: true,
				size: BX.UI.Button.Size.MEDIUM,
				color: BX.UI.Button.Color.LIGHT_BORDER
			});
		}
		setState(state) {
			state.apply(this.#button);
		}
		getButton() {
			return this.#button;
		}
	}
	class LandingButtonState {
		apply(button) {}
	}
	class EditState extends LandingButtonState {
		#landing;
		constructor(landing) {
			super();
			this.#landing = landing;
		}
		apply(button) {
			button.setText(main_core.Loc.getMessage('INTRANET_SETTINGS_BUTTON_EDIT'));
			button.setDropdown(false);
			button.bindEvent('click', () => {
				this.openNewTab(this.#landing.edit_url);
			});
		}
		openNewTab(url) {
			window.open(url, '_blank').focus();
		}
	}
	class ShowState extends LandingButtonState {
		#landing;
		#menuRenderer;
		constructor(landing, menuRenderer) {
			super();
			this.#landing = landing;
			this.#menuRenderer = menuRenderer;
		}
		apply(button) {
			button.setText(main_core.Loc.getMessage('INTRANET_SETTINGS_BUTTON_REQ_SITE'));
			button.setDropdown(true);
			button.unbindEvent('click');
			button.setColor(BX.UI.Button.Color.PRIMARY);
			button.setMenu(this.#menuRenderer(this.#landing));
		}
	}
	class CreateState extends LandingButtonState {
		#requestBuilder;
		#menuRenderer;
		constructor(request, menuRenderer) {
			super();
			this.#requestBuilder = request;
			this.#menuRenderer = menuRenderer;
		}
		apply(button) {
			button.setText(main_core.Loc.getMessage('INTRANET_SETTINGS_BUTTON_CREATE'));
			button.setDropdown(false);
			button.bindEvent('click', event => {
				if (button.getState() === ui_buttons.ButtonState.WAITING) {
					return;
				}
				button.setState(ui_buttons.ButtonState.WAITING);
				this.#requestBuilder().then(response => {
					const landing = response.data;
					button.setState(null);
					button.unbindEvent('click');
					if (landing.is_public) {
						new ShowState(landing, this.#menuRenderer).apply(button);
					} else {
						const state = new EditState(landing);
						state.apply(button);
						state.openNewTab(landing.edit_url);
					}
				}, response => {
					button.setState(null);
					ui_formElements_field.ErrorCollection.showSystemError(response.errors[0].message);
				});
			});
		}
	}

	class LandingCard {
		#landing;
		#copyBtn;
		#landingCardElement;
		constructor(landingOptions) {
			this.#landing = landingOptions;
		}
		qrRender() {
			let qrContainer = main_core.Tag.render`<div class="intranet-settings__qr_image-container"></div>`;
			new QRCode(qrContainer, {
				text: this.#landing.public_url,
				width: 106,
				height: 106
			});
			return qrContainer;
		}
		render() {
			if (this.#landingCardElement) {
				return this.#landingCardElement;
			}
			const onclickOpenEdit = () => {
				window.open(this.#landing.edit_url, '_blank').focus();
			};
			this.#landingCardElement = main_core.Tag.render`
		<div class="intranet-settings__req-info-container">
			<div class="intranet-settings__req-info-inner">
				<div class="intranet-settings__qr_container">${this.qrRender()}</div>
				<div class="intranet-settings__qr_description-block">
					<div class="intranet-settings__qr_help-text">
						<h4 class="intranet-settings__qr_title">${main_core.Loc.getMessage('INTRANET_SETTINGS_BUTTON_REQ_SITE')}</h4>
						<p class="intranet-settings__qr_text">
							${main_core.Loc.getMessage('INTRANET_SETTINGS_BUTTON_REQ_HELP_TEXT', {
			'#SITE_URL#': this.#landing.public_url
		})}
						</p>
					</div>
					<div class="intranet-settings__qr_button">
						${this.getCopyButton().getContainer()}
					</div>
				</div>
			</div>
			<div class="intranet-settings__qr_editor_box" onclick="${onclickOpenEdit}">
				<div class="intranet-settings__qr_editor_icon">
					<div class="ui-icon-set --paint-1"></div>
				</div>
				<div class="intranet-settings__qr_editor_name">${main_core.Loc.getMessage('INTRANET_SETTINGS_BUTTON_EDIT_LANDING')}</div>
				<div class="ui-icon-set --expand intranet-settings__qr_editor_btn"></div>
			</div>
		</div>`;
			return this.#landingCardElement;
		}
		getCopyButton() {
			if (this.#copyBtn) {
				return this.#copyBtn;
			}
			this.#copyBtn = new ui_buttons.Button({
				text: main_core.Loc.getMessage('INTRANET_SETTINGS_BUTTON_REQ_COPY_LINK'),
				round: true,
				noCaps: true,
				className: 'landing-copy-button',
				size: BX.UI.Button.Size.EXTRA_SMALL,
				color: BX.UI.Button.Color.SUCCESS,
				events: {
					click: () => {
						if (BX.clipboard.copy(this.#landing.public_url)) {
							top.BX.UI.Notification.Center.notify({
								content: main_core.Loc.getMessage('INTRANET_SETTINGS_BUTTON_LINK_WAS_COPIED'),
								autoHide: true
							});
						}
					}
				}
			});
			return this.#copyBtn;
		}
	}

	class LandingButtonFactory {
		#options;
		#menuRenderer;
		constructor(options, landingData) {
			this.#options = options;
			this.landingData = landingData;
			this.#menuRenderer = this.#defaultMenuRenderer;
		}
		setMenuRenderer(renderer) {
			this.#menuRenderer = renderer;
		}
		create() {
			const btn = new LandingButton();
			let state;
			if (this.#options.is_connected && !this.#options.is_public) {
				state = new EditState(this.#options);
			} else if (this.#options.is_connected && this.#options.is_public) {
				state = new ShowState(this.#options, this.#menuRenderer.bind(this));
			} else {
				state = new CreateState(() => {
					return this.#getRequestCreateLanding();
				}, this.#menuRenderer.bind(this));
			}
			btn.setState(state);
			return btn.getButton();
		}
		#defaultMenuRenderer(landingData) {
			return {
				angle: true,
				maxWidth: 396,
				closeByEsc: true,
				className: 'intranet-settings__qr_popup',
				items: [{
					html: new LandingCard(landingData).render(),
					className: 'intranet-settings__qr_popup_item'
				}]
			};
		}
		#getRequestCreateLanding() {
			return main_core.ajax.runComponentAction('bitrix:intranet.settings', 'getLanding', {
				mode: 'class',
				data: {
					companyId: this.landingData.company_id,
					requisiteId: this.landingData.requisite_id,
					bankRequisiteId: this.landingData.bank_requisite_id
				}
			});
		}
	}

	class Card {
		#options;
		#cardElement;
		#requisiteFieldsElement;
		#buttonBar;
		constructor(options) {
			this.#options = options;
		}
		render() {
			if (this.#cardElement) {
				return this.#cardElement;
			}
			this.#cardElement = main_core.Tag.render`
		<div class="intranet-settings__req_background">
			<div class="intranet-settings__req-card_wrapper">
				<div class="intranet-settings__header">
					<div class="intranet-settings__title"> <span class="ui-section__title-icon ui-icon-set --city"></span> <span>${this.#options.company.TITLE}</span></div>
					<div class="intranet-settings__contact_bar"> 
						<span class="intranet-settings__contact_bar_item">
							${this.#buildCompanyField(main_core.Type.isStringFilled(this.#options.phone) ? this.#options.phone : main_core.Loc.getMessage('INTRANET_SETTINGS_BUTTON_REQ_EMPTY_FIELD_STUB_PHONE'))}
						</span> 
						<span class="intranet-settings__contact_bar_item">
							${this.#buildCompanyField(main_core.Type.isStringFilled(this.#options.email) ? this.#options.email : main_core.Loc.getMessage('INTRANET_SETTINGS_BUTTON_REQ_EMPTY_FIELD_STUB_EMAIL'))}
						</span> 
						<span class="intranet-settings__contact_bar_item">
							${this.#buildCompanyField(main_core.Type.isStringFilled(this.#options.site) ? this.#options.site : main_core.Loc.getMessage('INTRANET_SETTINGS_BUTTON_REQ_EMPTY_FIELD_STUB_SITE'))}
						</span> 
					</div>
				</div>
				${this.requisiteFieldsRender()}
				${this.getButtonsBar().render()}
			</div>
		</div>
		`;
			return this.#cardElement;
		}
		#buildCompanyField(label) {
			return main_core.Dom.create('a', {
				text: label,
				attrs: {
					href: this.getCompanyUrl()
				}
			});
		}
		#buildField(label) {
			return main_core.Dom.create('a', {
				text: label,
				attrs: {
					href: this.getRequisiteUrl()
				}
			});
		}
		getRequisiteUrl() {
			const requisiteId = this.#options.landingData.requisite_id;
			if (requisiteId) {
				return '/crm/company/requisite/' + requisiteId + '/';
			} else {
				return '/crm/company/requisite/0/?itemId=' + this.#options.company.ID;
			}
		}
		getCompanyUrl() {
			if (this.#options.company.ID === 0) {
				return '/crm/company/details/0/?mycompany=y&TITLE=' + this.#options.company.TITLE;
			} else {
				return '/crm/company/details/' + this.#options.company.ID + '/';
			}
		}
		requisiteFieldsRender() {
			if (this.#requisiteFieldsElement) {
				return this.#requisiteFieldsElement;
			}
			const fields = this.#options.fields;
			this.#requisiteFieldsElement = main_core.Tag.render`<div class="intranet-settings__req-table_wrap"></div>`;
			for (let field of fields) {
				const renderField = main_core.Tag.render`
				<div class="intranet-settings__req-table_row">
					<div class="intranet-settings__table-cell">${field.TITLE}</div>
					<div class="intranet-settings__table-cell">
						${!this.#options.company.ID ? this.#buildCompanyField(main_core.Loc.getMessage('INTRANET_SETTINGS_BUTTON_REQ_EMPTY_FIELD_STUB')) : main_core.Type.isStringFilled(field.VALUE) ? this.#buildField(field.VALUE) : this.#buildField(main_core.Loc.getMessage('INTRANET_SETTINGS_BUTTON_REQ_EMPTY_FIELD_STUB'))}
					</div>
				</div>
			`;
				main_core.Dom.append(renderField, this.#requisiteFieldsElement);
			}
			return this.#requisiteFieldsElement;
		}
		getButtonsBar() {
			if (this.#buttonBar) {
				return this.#buttonBar;
			}
			this.#buttonBar = new ButtonBar();
			return this.#buttonBar;
		}
		setButtonBar(buttonBar) {
			this.#buttonBar = buttonBar;
		}
	}

	class RequisitePage extends ui_formElements_field.BaseSettingsPage {
		constructor() {
			super();
			this.titlePage = main_core.Loc.getMessage('INTRANET_SETTINGS_TITLE_PAGE_REQUISITE');
			this.descriptionPage = main_core.Loc.getMessage('INTRANET_SETTINGS_DESCRIPTION_PAGE_REQUISITE');
			top.BX.addCustomEvent('onLocalStorageSet', params => {
				let eventName = params?.key ?? null;
				if (eventName === 'onCrmEntityUpdate' || eventName === 'onCrmEntityCreate' || eventName === 'BX.Crm.RequisiteSliderDetails:onSave') {
					this.reload();
				}
			});
		}
		getType() {
			return 'requisite';
		}
		appendSections(contentNode) {
			if (!this.hasValue('sectionRequisite')) {
				return;
			}
			let reqSection = new ui_section.Section(this.getValue('sectionRequisite'));
			const sectionField = new ui_formElements_field.SettingsSection({
				parent: this,
				section: reqSection
			});
			const description = new BX.UI.Alert({
				text: `
				${main_core.Loc.getMessage('INTRANET_SETTINGS_SECTION_REQUISITE_DESCRIPTION')}
				<a class="ui-section__link" onclick="top.BX.Helper.show('redirect=detail&code=18213326')">
					${main_core.Loc.getMessage('INTRANET_SETTINGS_CANCEL_MORE')}
				</a>
			`,
				inline: true,
				size: BX.UI.Alert.Size.SMALL,
				color: BX.UI.Alert.Color.PRIMARY,
				animated: true
			});
			const descriptionRow = new ui_section.Row({
				content: description.getContainer()
			});
			reqSection.append(descriptionRow.render());
			if (this.hasValue('COMPANY')) {
				let companies = this.getValue('COMPANY');
				const requisites = this.getValue('REQUISITES');
				const phones = this.getValue('PHONES');
				const sites = this.getValue('SITES');
				const emails = this.getValue('EMAILS');
				const landings = this.getValue('LANDINGS');
				const landingsData = this.getValue('LANDINGS_DATA');
				if (!main_core.Type.isArray(companies) || companies.length <= 0) {
					const defaultCompanyRow = new ui_section.Row({
						content: this.cardRender({
							company: {
								ID: 0,
								TITLE: this.getValue('BITRIX_TITLE')
							},
							fields: this.getValue('EMPTY_REQUISITE'),
							phone: [],
							email: [],
							site: []
						})
					});
					reqSection.append(defaultCompanyRow.render());
				}
				for (let company of companies) {
					const fields = !main_core.Type.isNil(requisites[company.ID]) ? requisites[company.ID] : this.getValue('EMPTY_REQUISITE');
					const cardRow = new ui_section.Row({
						content: this.cardRender({
							company: company,
							fields: fields,
							phone: !main_core.Type.isNil(phones[company.ID]) ? phones[company.ID] : [],
							email: !main_core.Type.isNil(emails[company.ID]) ? emails[company.ID] : [],
							site: !main_core.Type.isNil(sites[company.ID]) ? sites[company.ID] : [],
							landing: !main_core.Type.isNil(landings[company.ID]) ? landings[company.ID] : [],
							landingData: !main_core.Type.isNil(landingsData[company.ID]) ? landingsData[company.ID] : []
						})
					});
					reqSection.append(cardRow.render());
				}
			}
			new ui_formElements_field.SettingsRow({
				row: new ui_section.Row({
					content: this.addCompanyLinkRender()
				}),
				parent: sectionField
			});
			sectionField.renderTo(contentNode);
		}
		addCompanyLinkRender() {
			const link = main_core.Tag.render`
				<a class="ui-section__link" 
					href="/crm/company/details/0/?mycompany=y" target="_blank">
				${main_core.Loc.getMessage('INTRANET_SETTINGS_BUTTON_REQ_ADD_COMPANY')}
				</a>
		`;
			main_core.Event.bind(link, 'click', event => {
				this.getAnalytic()?.addEventConfigRequisite(AnalyticSettingsEvent.OPEN_ADD_COMPANY);
			});
			return main_core.Tag.render`<div class="ui-section__link_box">${link}</div>`;
		}
		cardRender(params) {
			const card = new Card(params);
			const buttonBar = new ButtonBar();
			if (params.company.ID > 0) {
				const factory = new LandingButtonFactory(params.landing, params.landingData);
				factory.setMenuRenderer(landingData => {
					const landingCard = new LandingCard(landingData);
					main_core.Event.bind(landingCard.getCopyButton().getContainer(), 'click', event => {
						this.getAnalytic()?.addEventConfigRequisite(AnalyticSettingsEvent.COPY_LINK_CARD);
					});
					return {
						angle: true,
						maxWidth: 396,
						closeByEsc: true,
						className: 'intranet-settings__qr_popup',
						items: [{
							html: landingCard.render(),
							className: 'intranet-settings__qr_popup_item'
						}]
					};
				});
				const landingBtn = factory.create();
				if (main_core.Dom.hasClass(landingBtn.getContainer(), 'landing-button-trigger')) {
					main_core.Event.bind(landingBtn.getContainer(), 'click', event => {
						if (params.landing.is_connected && !params.landing.is_public) {
							this.getAnalytic()?.addEventConfigRequisite(AnalyticSettingsEvent.EDIT_CARD);
						} else if (!params.landing.is_connected && !params.landing.is_public) {
							this.getAnalytic()?.addEventConfigRequisite(AnalyticSettingsEvent.CREATE_CARD);
						}
					});
				}
				buttonBar.addButton(landingBtn);
			}
			card.setButtonBar(buttonBar);
			return card.render();
		}
	}

	class CommunicationPage extends ui_formElements_field.BaseSettingsPage {
		constructor() {
			super();
			this.titlePage = main_core.Loc.getMessage('INTRANET_SETTINGS_TITLE_PAGE_COMMUNICATION');
			this.descriptionPage = main_core.Loc.getMessage('INTRANET_SETTINGS_DESCRIPTION_PAGE_COMMUNICATION');
		}
		getType() {
			return 'communication';
		}
		appendSections(contentNode) {
			let profileSection = this.#buildNewsFeedSection();
			profileSection.renderTo(contentNode);
			let chatSection = this.#buildChatSection();
			chatSection.renderTo(contentNode);
			if (this.hasValue('availableGeneralChannel')) {
				let channelSection = this.#buildChannelSection();
				channelSection.renderTo(contentNode);
			}
			let diskSection = this.#buildDiskSection();
			diskSection.renderTo(contentNode);
		}
		#buildNewsFeedSection() {
			if (!this.hasValue('sectionFeed')) {
				return;
			}
			let newsFeedSection = new ui_section.Section(this.getValue('sectionFeed'));
			let settingsSection = new ui_formElements_field.SettingsSection({
				section: newsFeedSection,
				parent: this
			});
			if (this.hasValue('allow_livefeed_toall')) {
				const allowPostFeedChecker = new ui_formElements_view.Checker(this.getValue('allow_livefeed_toall'));
				const allowPostFeedSelector = ui_formElements_view.FieldFactory.createUserSelector({
					inputName: 'livefeed_toall_rights[]',
					label: main_core.Loc.getMessage('INTRANET_SETTINGS_FIELD_LABEL_SELECT_USER_PUBLIC_MESS'),
					values: Object.values(this.getValue('arToAllRights')),
					enableDepartments: true
				});
				CommunicationPage.addToSectionCheckerHelper(allowPostFeedChecker, [allowPostFeedSelector], settingsSection);
			}
			if (this.hasValue('default_livefeed_toall')) {
				let allowPostToAllField = new ui_formElements_view.Checker(this.getValue('default_livefeed_toall'));
				CommunicationPage.addToSectionHelper(allowPostToAllField, settingsSection);
			}
			if (this.hasValue('ratingTextLikeY')) {
				const likeBtnNameField = new ui_formElements_view.TextInputInline({
					inputName: this.getValue('ratingTextLikeY')?.name,
					label: this.getValue('ratingTextLikeY').label ?? main_core.Loc.getMessage('INTRANET_SETTINGS_FIELD_LABEL_LIKE_INPUT'),
					hintTitle: main_core.Loc.getMessage('INTRANET_SETTINGS_FIELD_HINT_TITLE_LIKE'),
					value: this.getValue('ratingTextLikeY')?.current,
					valueColor: this.hasValue('ratingTextLikeY'),
					hintDesc: main_core.Loc.getMessage('INTRANET_SETTINGS_FIELD_HINT_DESC_LIKE')
				});
				CommunicationPage.addToSectionHelper(likeBtnNameField, settingsSection);
			}
			return settingsSection;
		}
		#buildChatSection() {
			if (!this.hasValue('sectionChats')) {
				return;
			}
			let chatSection = new ui_section.Section(this.getValue('sectionChats'));
			let settingsSection = new ui_formElements_field.SettingsSection({
				section: chatSection,
				parent: this
			});
			if (this.hasValue('general_chat_can_post')) {
				let canPostGeneralChatField = new ui_formElements_view.Checker(this.getValue('allow_post_general_chat'));
				let settingsField = new ui_formElements_field.SettingsField({
					fieldView: canPostGeneralChatField
				});
				let settingsRow = new ui_formElements_field.SettingsRow({
					parent: settingsSection,
					child: settingsField
				});
				let canPostGeneralChatListField = new ui_formElements_view.Selector(this.getValue('general_chat_can_post'));
				settingsField = new ui_formElements_field.SettingsField({
					fieldView: canPostGeneralChatListField
				});
				let canPostGeneralChatListRow = new ui_section.Row({
					isHidden: !canPostGeneralChatField.isChecked(),
					className: 'ui-section__subrow --no-border'
				});
				CommunicationPage.addToSectionHelper(canPostGeneralChatListField, settingsRow, canPostGeneralChatListRow);
				let managerSelectorField = ui_formElements_view.FieldFactory.createUserSelector({
					inputName: 'imchat_toall_rights[]',
					label: main_core.Loc.getMessage('INTRANET_SETTINGS_FIELD_LABEL_SELECT_USER_PUBLIC_MESS'),
					enableAll: false,
					values: Object.values(this.getValue('generalChatManagersList') ?? [])
				});
				let managerSelectorRow = new ui_section.Row({
					content: managerSelectorField.render(),
					isHidden: this.getValue('general_chat_can_post').current !== 'MANAGER',
					className: 'ui-section__subrow --no-border'
				});
				CommunicationPage.addToSectionHelper(managerSelectorField, settingsRow, managerSelectorRow);
				const separatorRow = new ui_section.SeparatorRow({
					isHidden: this.getValue('general_chat_can_post').current !== 'MANAGER'
				});
				new ui_formElements_field.SettingsRow({
					row: separatorRow,
					parent: settingsRow
				});
				main_core_events.EventEmitter.subscribe(canPostGeneralChatField.switcher, 'toggled', () => {
					if (canPostGeneralChatField.isChecked()) {
						canPostGeneralChatListRow.show();
						if (canPostGeneralChatListField.getInputNode().value === 'MANAGER') {
							managerSelectorRow.show();
						}
						separatorRow.show();
					} else {
						canPostGeneralChatListRow.hide();
						managerSelectorRow.hide();
						separatorRow.hide();
					}
				});
				canPostGeneralChatListField.getInputNode().addEventListener('change', event => {
					if (event.target.value === 'MANAGER') {
						managerSelectorRow.show();
					} else {
						managerSelectorRow.hide();
					}
				});
			}
			if (this.hasValue('general_chat_message_leave')) {
				let leaveMessageField = new ui_formElements_view.Checker(this.getValue('general_chat_message_leave'));
				CommunicationPage.addToSectionHelper(leaveMessageField, settingsSection);
			}
			if (this.hasValue('general_chat_message_admin_rights')) {
				let adminMessageField = new ui_formElements_view.Checker(this.getValue('general_chat_message_admin_rights'));
				CommunicationPage.addToSectionHelper(adminMessageField, settingsSection);
			}
			if (this.hasValue('url_preview_enable')) {
				let allowUrlPreviewField = new ui_formElements_view.Checker(this.getValue('url_preview_enable'));
				CommunicationPage.addToSectionHelper(allowUrlPreviewField, settingsSection);
			}
			return settingsSection;
		}
		#buildChannelSection() {
			if (!this.hasValue('sectionChannels')) {
				return;
			}
			let chatSection = new ui_section.Section(this.getValue('sectionChannels'));
			let settingsSection = new ui_formElements_field.SettingsSection({
				section: chatSection,
				parent: this
			});
			if (this.hasValue('general_channel_can_post')) {
				let canPostGeneralChannelField = new ui_formElements_view.Checker(this.getValue('allow_post_general_channel'));
				let settingsField = new ui_formElements_field.SettingsField({
					fieldView: canPostGeneralChannelField
				});
				let settingsRow = new ui_formElements_field.SettingsRow({
					parent: settingsSection,
					child: settingsField
				});
				let canPostGeneralChannelListField = new ui_formElements_view.Selector(this.getValue('general_channel_can_post'));
				settingsField = new ui_formElements_field.SettingsField({
					fieldView: canPostGeneralChannelListField
				});
				let canPostGeneralChannelListRow = new ui_section.Row({
					isHidden: !canPostGeneralChannelField.isChecked(),
					className: 'ui-section__subrow --no-border'
				});
				CommunicationPage.addToSectionHelper(canPostGeneralChannelListField, settingsRow, canPostGeneralChannelListRow);
				let managerSelectorField = ui_formElements_view.FieldFactory.createUserSelector({
					inputName: 'imchannel_toall_rights[]',
					label: main_core.Loc.getMessage('INTRANET_SETTINGS_FIELD_LABEL_SELECT_USER_PUBLIC_MESS_CHANNEL') ?? '',
					enableAll: false,
					values: Object.values(this.getValue('generalChannelManagersList') ?? [])
				});
				let managerSelectorRow = new ui_section.Row({
					content: managerSelectorField.render(),
					isHidden: this.getValue('general_channel_can_post').current !== 'MANAGER',
					className: 'ui-section__subrow --no-border'
				});
				CommunicationPage.addToSectionHelper(managerSelectorField, settingsRow, managerSelectorRow);
				const separatorRow = new ui_section.SeparatorRow({
					isHidden: this.getValue('general_channel_can_post').current !== 'MANAGER'
				});
				new ui_formElements_field.SettingsRow({
					row: separatorRow,
					parent: settingsRow
				});
				main_core_events.EventEmitter.subscribe(canPostGeneralChannelField.switcher, 'toggled', () => {
					if (canPostGeneralChannelField.isChecked()) {
						canPostGeneralChannelListRow.show();
						if (canPostGeneralChannelListField.getInputNode().value === 'MANAGER') {
							managerSelectorRow.show();
						}
						separatorRow.show();
					} else {
						canPostGeneralChannelListRow.hide();
						managerSelectorRow.hide();
						separatorRow.hide();
					}
				});
				canPostGeneralChannelListField.getInputNode().addEventListener('change', event => {
					if (event.target.value === 'MANAGER') {
						managerSelectorRow.show();
					} else {
						managerSelectorRow.hide();
					}
				});
			}
			return settingsSection;
		}
		#buildDiskSection() {
			if (!this.hasValue('sectionDisk')) {
				return;
			}
			let diskSection = new ui_section.Section(this.getValue('sectionDisk'));
			let settingsSection = new ui_formElements_field.SettingsSection({
				section: diskSection,
				parent: this
			});
			if (this.hasValue('DISK_VIEWER_SERVICE')) {
				let fileViewerField = new ui_formElements_view.Selector(this.getValue('DISK_VIEWER_SERVICE'));
				CommunicationPage.addToSectionHelper(fileViewerField, settingsSection);
				const viewerChangeAlert = new ui_alerts.Alert({
					text: main_core.Loc.getMessage('INTRANET_SETTINGS_DISK_VIEWER_SERVICE_CHANGE_WARNING'),
					inline: true,
					size: BX.UI.Alert.Size.SMALL,
					color: BX.UI.Alert.Color.WARNING,
					animated: true
				});
				const viewerChangeAlertRow = new ui_section.Row({
					content: viewerChangeAlert.getContainer()
				});
				new ui_formElements_field.SettingsRow({
					row: viewerChangeAlertRow,
					parent: settingsSection
				});
			}
			if (this.hasValue('DISK_UNIFIED_LINK_DEFAULT_ACCESS_LEVEL')) {
				let unifiedLinkDefaultAccessLevelSelector = new ui_formElements_view.Selector(this.getValue('DISK_UNIFIED_LINK_DEFAULT_ACCESS_LEVEL'));
				CommunicationPage.addToSectionHelper(unifiedLinkDefaultAccessLevelSelector, settingsSection);
			}
			if (this.hasValue('DISK_LIMIT_PER_FILE')) {
				const messageNode = main_core.Tag.render`<span>${main_core.Loc.getMessage('INTRANET_SETTINGS_FIELD_HELP_MESSAGE')}</span>`;
				let fileLimitField = new ui_formElements_view.Selector({
					label: this.getValue('DISK_LIMIT_PER_FILE').label ?? main_core.Loc.getMessage('INTRANET_SETTINGS_FIELD_LABEL_MAX_FILE_LIMIT'),
					hintTitle: this.getValue('DISK_LIMIT_PER_FILE').hintTitle,
					name: this.getValue('DISK_LIMIT_PER_FILE').name,
					items: this.getValue('DISK_LIMIT_PER_FILE').values,
					hints: this.getValue('DISK_LIMIT_PER_FILE').hints,
					current: this.getValue('DISK_LIMIT_PER_FILE').current,
					isEnable: this.getValue('DISK_LIMIT_PER_FILE').isEnable,
					bannerCode: 'limit_max_entries_in_document_history',
					helpDesk: 'redirect=detail&code=18869612',
					helpMessageProvider: this.helpMessageProviderFactory(messageNode)
				});
				let fileLimitRow = new ui_section.Row({
					separator: 'bottom',
					className: '--block'
				});
				if (!this.getValue('DISK_LIMIT_PER_FILE').isEnable) {
					main_core.Event.bind(fileLimitField.getInputNode(), 'click', () => {
						this.getAnalytic()?.addEventOpenHint(this.getValue('DISK_LIMIT_PER_FILE').name);
					});
					main_core.Event.bind(messageNode.querySelector('a'), 'click', () => this.getAnalytic()?.addEventOpenTariffSelector(this.getValue('DISK_LIMIT_PER_FILE').name));
				}
				CommunicationPage.addToSectionHelper(fileLimitField, settingsSection, fileLimitRow);
			}
			new ui_formElements_field.SettingsRow({
				row: new ui_section.SeparatorRow(),
				parent: settingsSection
			});
			if (this.hasValue('disk_allow_edit_object_in_uf')) {
				let allowEditDocField = new ui_formElements_view.Checker(this.getValue('disk_allow_edit_object_in_uf'));
				let allowEditDocRow = new ui_section.Row({
					separator: 'top',
					className: '--block'
				});
				CommunicationPage.addToSectionHelper(allowEditDocField, settingsSection, allowEditDocRow);
			}
			if (this.hasValue('disk_allow_autoconnect_shared_objects')) {
				let connectDiskField = new ui_formElements_view.Checker(this.getValue('disk_allow_autoconnect_shared_objects'));
				CommunicationPage.addToSectionHelper(connectDiskField, settingsSection);
			}
			if (this.hasValue('disk_allow_use_external_link')) {
				const messageNode = main_core.Tag.render`<span>${main_core.Loc.getMessage('INTRANET_SETTINGS_FIELD_HELP_MESSAGE')}</span>`;
				let publicLinkField = new ui_formElements_view.Checker({
					inputName: this.getValue('disk_allow_use_external_link').inputName,
					title: this.getValue('disk_allow_use_external_link').label ?? main_core.Loc.getMessage('INTRANET_SETTINGS_FIELD_LABEL_ALLOW_PUBLIC_LINK'),
					hintOn: this.getValue('disk_allow_use_external_link').hintOn,
					checked: this.getValue('disk_allow_use_external_link').checked,
					isEnable: this.getValue('disk_allow_use_external_link').isEnable,
					bannerCode: 'limit_admin_share_link',
					helpDesk: this.getValue('disk_allow_use_external_link').helpDesk,
					helpMessageProvider: this.helpMessageProviderFactory(messageNode)
				});
				if (!this.getValue('disk_allow_use_external_link').isEnable) {
					main_core_events.EventEmitter.subscribe(publicLinkField.switcher, 'toggled', () => {
						this.getAnalytic()?.addEventOpenHint('disk_allow_use_external_link');
					});
					main_core.Event.bind(messageNode.querySelector('a'), 'click', () => this.getAnalytic()?.addEventOpenTariffSelector('enable_pub_link'));
				}
				CommunicationPage.addToSectionHelper(publicLinkField, settingsSection);
			}
			if (this.hasValue('disk_object_lock_enabled')) {
				const messageNode = main_core.Tag.render`<span>${main_core.Loc.getMessage('INTRANET_SETTINGS_FIELD_HELP_MESSAGE')}</span>`;
				let enableBlockDocField = new ui_formElements_view.Checker({
					inputName: this.getValue('disk_object_lock_enabled').inputName,
					title: this.getValue('disk_object_lock_enabled').label ?? main_core.Loc.getMessage('INTRANET_SETTINGS_FIELD_LABEL_ALLOW_BLOCK_DOC'),
					hintOn: this.getValue('disk_object_lock_enabled').hintOn,
					checked: this.getValue('disk_object_lock_enabled').checked,
					isEnable: this.getValue('disk_object_lock_enabled').isEnable,
					bannerCode: 'limit_document_lock',
					helpMessageProvider: this.helpMessageProviderFactory(messageNode),
					helpDesk: this.getValue('disk_object_lock_enabled').helpDesk
				});
				if (!this.getValue('disk_object_lock_enabled').isEnable) {
					main_core_events.EventEmitter.subscribe(enableBlockDocField.switcher, 'toggled', () => {
						this.getAnalytic()?.addEventOpenHint('disk_object_lock_enabled');
					});
					main_core.Event.bind(messageNode.querySelector('a'), 'click', () => this.getAnalytic()?.addEventOpenTariffSelector('disk_object_lock_enabled'));
				}
				CommunicationPage.addToSectionHelper(enableBlockDocField, settingsSection);
			}
			if (this.hasValue('disk_allow_use_extended_fulltext')) {
				const messageNode = main_core.Tag.render`<span>${main_core.Loc.getMessage('INTRANET_SETTINGS_FIELD_HELP_MESSAGE_ENT', {
				'#TARIFF#': 'ent250'
			})}</span>`;
				let enableFindField = new ui_formElements_view.Checker({
					inputName: this.getValue('disk_allow_use_extended_fulltext').inputName,
					title: this.getValue('disk_allow_use_extended_fulltext').label ?? main_core.Loc.getMessage('INTRANET_SETTINGS_FIELD_LABEL_ALLOW_SEARCH_DOC'),
					hintOn: this.getValue('disk_allow_use_extended_fulltext').hintOn,
					checked: this.getValue('disk_allow_use_extended_fulltext').checked,
					isEnable: this.getValue('disk_allow_use_extended_fulltext').isEnable,
					bannerCode: 'limit_in_text_search',
					helpDesk: this.getValue('disk_allow_use_extended_fulltext').helpDesk,
					helpMessageProvider: this.helpMessageProviderFactory(messageNode)
				});
				if (!this.getValue('disk_allow_use_extended_fulltext').isEnable) {
					main_core_events.EventEmitter.subscribe(enableFindField.switcher, 'toggled', () => {
						this.getAnalytic()?.addEventOpenHint('disk_allow_use_extended_fulltext');
					});
					main_core.Event.bind(messageNode.querySelector('a'), 'click', () => this.getAnalytic()?.addEventOpenTariffSelector('disk_allow_use_extended_fulltext'));
				}
				CommunicationPage.addToSectionHelper(enableFindField, settingsSection);
			}
			return settingsSection;
		}
	}

	class SiteDomainField extends ui_formElements_field.SettingsField {
		#content;
		#title;
		constructor(params) {
			const options = params.siteDomainOptions;
			params.fieldView = new ui_formElements_view.TextInput({
				value: options.subDomainName,
				placeholder: options.subDomainName,
				label: main_core.Loc.getMessage('INTRANET_SETTINGS_SECTION_DOMAIN_NAME3'),
				id: 'subDomainName',
				inputName: 'subDomainName',
				isEnable: true
			});
			super(params);
			this.setParentElement(params.parent);
			this.getFieldView().setEventNamespace(this.getEventNamespace());
			this.getFieldView().getInputNode().setAttribute('autocomplete', 'off');
			let timeout = null;
			main_core.Event.bind(this.getFieldView().getInputNode(), 'input', () => {
				clearTimeout(timeout);
				timeout = setTimeout(() => {
					this.validateInput();
				}, 1000);
			});
			this.options = {
				hostname: options.hostname,
				subDomainName: options.subDomainName,
				mainDomainName: options.mainDomainName,
				isRenameable: options.isRenameable,
				occupiedDomains: options.occupiedDomains
			};
			this.options.mainDomainName = ['.', this.options.mainDomainName].join('').replace('..', '.');
		}
		validateInput() {
			let newDomain = this.getFieldView().getInputNode().value;
			newDomain = newDomain.trim();
			if (newDomain.length < 3 || newDomain.length > 60) {
				this.getFieldView().setErrors([main_core.Loc.getMessage('INTRANET_SETTINGS_DOMAIN_RENAMING_LENGTH_ERROR')]);
			} else if (!/^([a-zA-Z0-9]([a-zA-Z0-9\\-]{0,58})[a-zA-Z0-9])$/.test(newDomain)) {
				this.getFieldView().setErrors([main_core.Loc.getMessage('INTRANET_SETTINGS_DOMAIN_RENAMING_FORMAT_ERROR')]);
			} else if (this.options.occupiedDomains.includes(newDomain)) {
				this.getFieldView().setErrors([main_core.Loc.getMessage('INTRANET_SETTINGS_DOMAIN_RENAMING_DOMAIN_EXISTS_ERROR')]);
			} else {
				this.getFieldView().cleanError();
			}
		}
		cancel() {}
		render() {
			if (this.#content) {
				return this.#content;
			}
			if (this.options.isRenameable !== true) {
				const copyButton = main_core.Tag.render`<div class="settings-tools-description-link">${main_core.Loc.getMessage('INTRANET_SETTINGS_COPY')}</div>`;
				BX.clipboard.bindCopyClick(copyButton, {
					text: () => {
						return this.options.hostname;
					}
				});
				this.#content = main_core.Tag.render`
				<div>
					<div class="ui-section__field-label_box">
						<div class="ui-section__field-label">${main_core.Loc.getMessage('INTRANET_SETTINGS_SECTION_DOMAIN_NAME4')}</div>
					</div>
					<div class="intranet-settings__domain_box">
						<div class="intranet-settings__domain_name">${main_core.Text.encode(this.options.hostname)}</div>
						${copyButton}
					</div>
				</div>`;
			} else {
				this.#content = main_core.Tag.render`<div id="${this.getFieldView().getId()}" class="ui-section__field-selector --no-border">
				<div class="ui-section__field-container">
					<div class="ui-section__field-label_box">
						<label class="ui-section__field-label" for="${this.getFieldView().getName()}">
							${this.getFieldView().getLabel()}
						</label> 
					</div>
					<div class="ui-section__field-inner">
						<div class="intarnet-settings__domain_inline-field">
							<div class="ui-ctl ui-ctl-textbox ui-ctl-block">
								${this.getFieldView().getInputNode()}
							</div>
							<div class="intarnet-settings__domain_name">${main_core.Text.encode(this.options.mainDomainName)}</div>
						</div>
						${this.getFieldView().renderErrors()}
					</div>
				</div>
			</div>`;
			}
			return this.#content;
		}
	}

	function setPortalSettings(container, portalSettings) {
		const logoNode = container.querySelector('[data-role="logo"]');
		const titleNode = container.querySelector('[data-role="title"]');
		const logo24Node = container.querySelector('[data-role="logo24"]');
		if (!logoNode.hasAttribute('data-prev-display')) {
			logoNode.dataset.prevDisplay = logoNode.style.display;
			titleNode.dataset.prevDisplay = titleNode.style.display;
			logo24Node.dataset.prevDisplay = logo24Node.style.display;
		}
		if (main_core.Type.isUndefined(portalSettings.title) !== true) {
			titleNode.innerHTML = main_core.Text.encode(main_core.Type.isStringFilled(portalSettings.title) ? portalSettings.title : 'Bitrix');
		}
		if (main_core.Type.isUndefined(portalSettings.logo24) !== true) {
			if (main_core.Type.isStringFilled(portalSettings.logo24)) {
				delete logo24Node.dataset.visibility;
				if (logoNode.style.display === 'none') {
					logo24Node.style.removeProperty('display');
				}
			} else {
				logo24Node.dataset.visibility = 'hidden';
				logo24Node.style.display = 'none';
			}
		}
		if (main_core.Type.isUndefined(portalSettings.logo) !== true) {
			if (main_core.Type.isPlainObject(portalSettings.logo)) {
				logoNode.style.backgroundImage = 'url("' + encodeURI(portalSettings.logo.src) + '")';
				logoNode.style.removeProperty('display');
				titleNode.style.display = 'none';
				logo24Node.style.display = 'none';
			} else {
				logoNode.style.display = 'none';
				titleNode.style.removeProperty('display');
				if (logo24Node.dataset.visibility !== 'hidden') {
					logo24Node.style.removeProperty('display');
				} else {
					logo24Node.style.display = 'none';
				}
			}
		}
	}
	function setPortalThemeSettings(container, themeSettings) {
		const theme = main_core.Type.isPlainObject(themeSettings) ? themeSettings : {};
		const lightning = String(theme.id).indexOf('dark:') === 0 ? 'dark' : 'light';
		main_core.Dom.removeClass(container, '--light --dark');
		main_core.Dom.addClass(container, '--' + lightning);
		if (main_core.Type.isStringFilled(theme.previewImage)) {
			container.style.backgroundImage = 'url("' + encodeURI(theme.previewImage) + '")';
			container.style.backgroundSize = 'cover';
		} else {
			container.style.removeProperty('backgroundImage');
			container.style.removeProperty('backgroundSize');
			container.style.background = 'none';
		}
		if (main_core.Type.isStringFilled(theme.previewColor)) {
			container.style.backgroundColor = theme.previewColor;
		}
	}

	class ThemePickerElement extends ui_formElements_view.BaseField {
		#themePicker;
		#themePickerDialog;
		constructor(themePickerSettings) {
			super({
				inputName: 'themeId',
				isEnable: themePickerSettings.allowSetDefaultTheme,
				bannerCode: 'limit_office_background_to_all'
			});
			this.#initThemePicker(themePickerSettings);
			this.applyTheme();
		}
		#initThemePicker(themePickerSettings) {
			this.#themePicker = new top.BX.Intranet.Bitrix24.ThemePicker(themePickerSettings);
			this.#themePicker.setThemes(themePickerSettings.themes);
			this.#themePicker.setBaseThemes(themePickerSettings.baseThemes);
			this.#themePickerDialog = new intranet_themePicker_dialog.ThemePickerDialog(this.#themePicker);
			this.#themePickerDialog.applyThemeAssets = () => {};
			this.#themePickerDialog.getContentContainer = () => {
				return this.render().querySelector('div[data-role="theme-container"]');
			};
			const closure = this.#themePickerDialog.handleRemoveBtnClick.bind(this.#themePickerDialog);
			this.#themePickerDialog.handleRemoveBtnClick = event => {
				const item = this.#themePickerDialog.getItemNode(event);
				if (!item) {
					return;
				}
				closure(event);
				this.applyPortalThemePreview(this.#themePicker.getTheme(this.#themePicker.getThemeId()));
				this.showSaveButton();
				//TODO Shift all <td>
			};
			const handleItemClick = this.#themePickerDialog.handleItemClick.bind(this.#themePickerDialog);
			this.#themePickerDialog.handleItemClick = event => {
				handleItemClick(event);
				this.applyTheme(event);
			};
			const addItem = this.#themePickerDialog.addItem.bind(this.#themePickerDialog);
			this.#themePickerDialog.addItem = theme => {
				addItem(theme);
				this.applyPortalThemePreview(theme);
				this.showSaveButton();
			};
		}
		applyTheme(event) {
			const themeNode = event ? this.#themePickerDialog.getItemNode(event) : null;
			let themeSettings = themeNode ? this.#themePicker.getTheme(themeNode.dataset.themeId) : this.#themePicker.getAppliedTheme();
			this.applyPortalThemePreview(themeSettings);
			if (event) {
				main_core_events.EventEmitter.emit(main_core_events.EventEmitter.GLOBAL_TARGET, 'BX.Intranet.Settings:ThemePicker:Change', themeSettings);
				this.showSaveButton();
			}
		}
		applyPortalThemePreview(theme) {
			const container = this.render().querySelector('[data-role="preview"]');
			setPortalThemeSettings(container, theme);
			this.getInputNode().value = main_core.Type.isPlainObject(theme) ? theme['id'] : '';
		}
		showSaveButton() {
			this.getInputNode().disabled = false;
			this.getInputNode().form.dispatchEvent(new window.Event('change'));
		}
		getValue() {
			return this.getInputNode().value;
		}
		getInputNode() {
			return this.render().querySelector('input[name="themeId"]');
		}
		applyPortalSettings() {}
		renderContentField() {
			document.querySelector('.ui-side-panel-content').style.overflow = 'hidden';
			const container = main_core.Tag.render`
		<div class="intranet-theme-settings ui-section__row">
			<div class="ui-section__row theme-dialog-preview">
				
				<section class="intranet-settings__preview --preview" data-role="preview">
					<div class="preview__header">
						<div class="preview__header-box">
							<div class="preview__header-left-box">
								<div class="preview__menu-switcher">
									<span class="preview__menu-switcher__icon"></span>
								</div>
								<div class="preview__block-item"></div>
								<div class="preview__block-item"></div>
								<div class="preview__block-item"></div>
							</div>
							<div class="preview__header-right-box">
								<div class="intranet-settings__logo-box">
									<div class="intranet-settings__main-widget_logo" data-role="logo"></div>
									<div class="intranet-settings__main-widget_name" data-role="title">Bitrix</div>
									<div class="intranet-settings__logo24" data-role="logo24">
										24
									</div>
								</div>	
								<div class="preview__circle_container">	
									<div class="preview__circle_item"></div>
								</div>				
							</div>
						</div>
					</div>
					<div class="preview__main">
						<div class="preview__main-left">
							<div class="preview__circle_container">
								<div class="preview__circle_item-outline">
									<div class="preview__circle_item --active"></div>
								</div>
							</div>	
							<div class="preview__circle_container">	
								<div class="preview__circle_item"></div>
							</div>	
							<div class="preview__circle_container">	
								<div class="preview__circle_item"></div>
							</div>	
							<div class="preview__circle_container">	
								<div class="preview__circle_item"></div>
							</div>	
							<div class="preview__circle_container">	
								<div class="preview__circle_item"></div>
							</div>	
							<div class="preview__circle_container">	
								<div class="preview__circle_item"></div>
							</div>	
						</div>
						<div class="preview__main-center">
							<div class="preview__main-row">
								<div class="preview__main-row-left">
									<div class="preview__block-item --w145"></div>
									<div class="preview__block-item --opacity80 --w47"></div>
									<div class="preview__block-item --w90"></div>
								</div>
								<div class="preview__main-row-right">
									<div class="preview__block-item --w50"></div>
								</div>
							</div>
							<div class="preview__main-row">
								<div class="preview__main-row-left">
									<div class="preview__block-item --w80"></div>
									<div class="preview__block-item --w50"></div>
								</div>
								<div class="preview__main-row-right">
									<div class="preview__block-item --w90"></div>
								</div>
							</div>
							<div class="preview__main-column">
								<div class="preview__main-header"></div>
								<div class="preview__main-table"></div>
							</div>
						</div>
						<div class="preview__main-right">
							<div class="preview__circle_container">	
								<div class="preview__circle_item --light"></div>
							</div>	
							<div class="preview__circle_container">	
								<div class="preview__circle_item --light"></div>
							</div>	
							<div class="preview__circle_container">	
								<div class="preview__circle_item --light"></div>
							</div>	
							<div class="preview__circle_container">	
								<div class="preview__circle_item --light"></div>
							</div>	
						</div>
					</div>
				</section>
				
			</div>
			<div class="ui-section__row theme-dialog-content" data-role="theme-container"></div>
			<input type="hidden" name="themeId" value="" disabled>
		</div>
		`;
			const uploadBtn = main_core.Tag.render`
			<div class="intranet-settings__theme-btn_box">
				<div class="intranet-settings__theme-btn" onclick="${this.handleNewThemeButtonClick.bind(this)}">${main_core.Loc.getMessage('INTRANET_SETTINGS_THEME_UPLOAD_BTN')}</div>
			</div>
		`;
			const themeContainer = container.querySelector('div[data-role="theme-container"]');
			Array.from(this.#themePicker.getThemes()).forEach(theme => {
				const itemNode = this.#themePickerDialog.createItem(theme);
				if (this.#themePicker.canSetDefaultTheme() !== true) {
					main_core.Event.unbindAll(itemNode, 'click');
					if (theme['default'] !== true) {
						main_core.Dom.addClass(itemNode, '--restricted');
						itemNode.appendChild(main_core.Tag.render`<div class="intranet-settings__theme_lock_box">${this.renderLockElement()}</div>`);
						main_core.Event.bind(itemNode, 'click', this.showBanner.bind(this));
					}
				}
				if (theme['default'] === true) {
					itemNode.setAttribute('data-role', 'ui-ears-active');
				}
				themeContainer.appendChild(itemNode);
			});
			new ui_ears.Ears({
				container: themeContainer,
				noScrollbar: false
			}).init();
			container.appendChild(uploadBtn);
			return container;
		}
		handleNewThemeButtonClick(event) {
			if (this.#themePicker.canSetDefaultTheme() !== true) {
				return this.showBanner();
			}
			this.#themePickerDialog.getNewThemeDialog().show();
		}
		handleLockButtonClick() {
			if (BX.getClass("BX.UI.InfoHelper")) {
				BX.UI.InfoHelper.show("limit_office_background_to_all");
			}
		}
	}
	class SiteThemePickerField extends ui_formElements_field.SettingsField {
		#fieldView;
		constructor(params) {
			params.fieldView = new ThemePickerElement(params.themePickerSettings);
			super(params);
			if (params.portalSettings) {
				this.setEventNamespace('BX.Intranet.Settings');
				setPortalSettings(this.getFieldView().render(), params.portalSettings);
				main_core_events.EventEmitter.subscribe(main_core_events.EventEmitter.GLOBAL_TARGET, this.getEventNamespace() + ':Portal:Change', baseEvent => {
					setPortalSettings(this.getFieldView().render(), baseEvent.getData());
				});
			}
		}
	}

	class HiddenInput extends ui_formElements_view.TextInput {
		constructor(params) {
			super({
				inputName: 'logo',
				isEnable: params.isEnable,
				defaultValue: 'default',
				bannerCode: 'limit_admin_logo',
				helpDeskCode: 123,
				helpMessageProvider: () => {}
			});
			this.getInputNode().type = 'hidden';
			this.getInputNode().disabled = true;
		}
		renderContentField() {
			return this.getInputNode();
		}
	}
	class SiteLogoField extends ui_formElements_field.SettingsField {
		#content;
		#uploader;
		#siteLogo;
		#hiddenContainer;
		#hiddenRemoveInput;
		#loader;
		constructor(params) {
			params.fieldView = new HiddenInput({
				isEnable: params.canUserEditLogo
			});
			super(params);
			this.#siteLogo = params.siteLogoOptions;
			this.siteLogoLabel = params.siteLogoLabel;
			this.setEventNamespace('BX.Intranet.Settings');
		}
		initUploader({
			TileWidget,
			StackWidget,
			StackWidgetSize
		}) {
			const defaultOptions = {
				maxFileCount: 1,
				acceptOnlyImages: true,
				multiple: false,
				acceptedFileTypes: ['image/png'],
				events: {
					'onError': function (event) {
						console.error('File Uploader onError', event.getData().error);
					},
					'File:onError': this.onFileError.bind(this),
					'File:onAdd': this.onLogoAdd.bind(this),
					'File:onRemove': this.onLogoRemove.bind(this),
					'onBeforeFilesAdd': this.getFieldView().isEnable() ? () => {} : event => {
						this.getFieldView().showBanner();
						event.preventDefault();
					}
				},
				allowReplaceSingle: true,
				hiddenFieldName: 'logo_file',
				hiddenFieldsContainer: this.#getFileContainer(),
				assignAsFile: true,
				// imageMaxWidth: 444,
				// imageMaxHeight: 110,

				// imageMaxFileSize?: number,
				// imageMinFileSize?: number,

				imageResizeWidth: 444,
				imageResizeHeight: 110,
				imageResizeMode: 'contain',
				imageResizeMimeType: 'image/png',
				imagePreviewWidth: 444,
				imagePreviewHeight: 110,
				imagePreviewResizeMode: 'contain',
				// serverOptions: ServerOptions,
				// filters?: Array<{ type: FilterType, filter: Filter | Function | string, options: { [key: string]: any } }>,
				files: this.#siteLogo ? [[1, {
					serverFileId: this.#siteLogo.id,
					serverId: this.#siteLogo.id,
					type: 'image/png',
					width: this.#siteLogo.width,
					height: this.#siteLogo.height,
					treatImageAsFile: true,
					downloadUrl: this.#siteLogo.src,
					serverPreviewUrl: this.#siteLogo.src,
					serverPreviewWidth: this.#siteLogo.width,
					serverPreviewHeight: this.#siteLogo.height,
					src: this.#siteLogo.src,
					preload: true
				}]] : null
			};
			this.#uploader = new StackWidget(defaultOptions, {
				size: StackWidgetSize.LARGE
			});
			return this;
		}
		onFileError(event) {
			console.error('File Error', event.getData().error);
			main_core_events.EventEmitter.subscribeOnce(main_core_events.EventEmitter.GLOBAL_TARGET, this.getEventNamespace() + ':onAfterShowPage', this.removeFailedLogo.bind(this));
			const tabField = this.getParentElement();
			if (tabField) {
				main_core_events.EventEmitter.subscribeOnce(tabField.getFieldView(), 'onActive', this.removeFailedLogo.bind(this));
			}
		}
		removeFailedLogo() {
			const logo = this.#uploader.getUploader().getFiles()[0];
			if (logo && logo.isLoadFailed()) {
				this.#uploader.getUploader().removeFiles();
			}
		}
		onLogoAdd(event) {
			main_core_events.EventEmitter.emit(main_core_events.EventEmitter.GLOBAL_TARGET, this.getEventNamespace() + ':Portal:Change', new main_core_events.BaseEvent({
				data: {
					logo: {
						src: event.getData().file.getClientPreviewUrl()
					}
				}
			}));
			this.getFieldView().getInputNode().disabled = false;
			this.getFieldView().getInputNode().value = 'add';
			this.getFieldView().getInputNode().form.dispatchEvent(new window.Event('change'));
		}
		onLogoRemove(event) {
			main_core_events.EventEmitter.emit(main_core_events.EventEmitter.GLOBAL_TARGET, this.getEventNamespace() + ':Portal:Change', new main_core_events.BaseEvent({
				data: {
					logo: null
				}
			}));
			this.getFieldView().getInputNode().disabled = false;
			this.getFieldView().getInputNode().value = 'remove';
			this.getFieldView().getInputNode().form.dispatchEvent(new window.Event('change'));
		}
		getName() {
			return 'logo';
		}
		cancel() {}
		#getFileContainer() {
			if (!this.#hiddenContainer) {
				this.#hiddenContainer = document.createElement('div');
			}
			return this.#hiddenContainer;
		}
		render() {
			if (this.#content) {
				return this.#content;
			}
			this.#content = main_core.Tag.render`<div></div>`;
			this.#showLoader();
			main_core.Runtime.loadExtension('ui.uploader.stack-widget').then(exports => {
				this.initUploader(exports);
				this.#renderAfterLoad();
				this.#removeLoader();
			});
			return this.#content;
		}
		#renderAfterLoad() {
			const uploaderContent = main_core.Tag.render`<div></div>`;
			const content = main_core.Tag.render`<div>
				<div class="ui-section__field-label">${this.siteLogoLabel ?? main_core.Loc.getMessage('INTRANET_SETTINGS_SECTION_TAB_TITLE_WIDGET_LOGO_TITLE1')}</div>
				${uploaderContent}
				<div class="ui-section__field-label">${main_core.Loc.getMessage('INTRANET_SETTINGS_SECTION_TAB_TITLE_WIDGET_LOGO_TITLE2')}</div>
				${this.getFieldView().getInputNode()}
				${this.#getFileContainer()}
				${this.getFieldView().renderErrors()}
			</div>`;
			this.#uploader.renderTo(uploaderContent);
			main_core.Dom.replace(this.#content, content);
		}
		#showLoader() {
			this.#loader = new main_loader.Loader({
				target: this.#content,
				color: 'rgba(82, 92, 105, 0.9)',
				mode: 'inline'
			});
			this.#loader.show().then(() => {
				console.log('The loader is shown');
			});
		}
		#removeLoader() {
			if (this.#loader) {
				this.#loader.destroy();
				this.#loader = null;
			}
		}
	}

	class SiteTitlePreviewWidget extends main_core_events.EventEmitter {
		#container;
		constructor(portalSettings, portalThemeSettings) {
			super();
			this.setEventNamespace('BX.Intranet.Settings');
			setPortalSettings(this.render(), portalSettings);
			main_core_events.EventEmitter.subscribe(main_core_events.EventEmitter.GLOBAL_TARGET, this.getEventNamespace() + ':Portal:Change', this.onChange.bind(this));
			if (portalThemeSettings) {
				setPortalThemeSettings(this.render(), portalThemeSettings?.theme);
				main_core_events.EventEmitter.subscribe(main_core_events.EventEmitter.GLOBAL_TARGET, this.getEventNamespace() + ':ThemePicker:Change', this.onSetTheme.bind(this));
			}
		}
		onChange(event) {
			setPortalSettings(this.render(), event.getData());
		}
		onSetTheme(baseEvent) {
			setPortalThemeSettings(this.render(), baseEvent.getData());
		}
		render() {
			if (!this.#container) {
				this.#container = main_core.Tag.render`
			<section class="intranet-settings__preview --preview" data-role="preview">
				<div class="preview__header">
					<div class="preview__header-box">
						<div class="preview__header-left-box">
							<div class="preview__menu-switcher">
								<span class="preview__menu-switcher__icon"></span>
							</div>
							<div class="preview__block-item"></div>
							<div class="preview__block-item"></div>
							<div class="preview__block-item"></div>
						</div>
						<div class="preview__header-right-box">
							<div class="intranet-settings__logo-box">
								<div class="intranet-settings__main-widget_logo" data-role="logo"></div>
								<div class="intranet-settings__main-widget_name" data-role="title">Bitrix</div>
								<div class="intranet-settings__logo24" data-role="logo24">
									24
								</div>
							</div>	
							<div class="preview__circle_container">	
								<div class="preview__circle_item"></div>
							</div>				
						</div>
					</div>
				</div>
				<div class="preview__main">
					<div class="preview__main-left">
						<div class="preview__circle_container">
							<div class="preview__circle_item-outline">
								<div class="preview__circle_item --active"></div>
							</div>
						</div>	
						<div class="preview__circle_container">	
							<div class="preview__circle_item"></div>
						</div>	
						<div class="preview__circle_container">	
							<div class="preview__circle_item"></div>
						</div>	
						<div class="preview__circle_container">	
							<div class="preview__circle_item"></div>
						</div>	
						<div class="preview__circle_container">	
							<div class="preview__circle_item"></div>
						</div>	
						<div class="preview__circle_container">	
							<div class="preview__circle_item"></div>
						</div>	
					</div>
					<div class="preview__main-center">
						<div class="preview__main-row">
							<div class="preview__main-row-left">
								<div class="preview__block-item --w145"></div>
								<div class="preview__block-item --opacity80 --w47"></div>
								<div class="preview__block-item --w90"></div>
							</div>
							<div class="preview__main-row-right">
								<div class="preview__block-item --w50"></div>
							</div>
						</div>
						<div class="preview__main-row">
							<div class="preview__main-row-left">
								<div class="preview__block-item --w80"></div>
								<div class="preview__block-item --w50"></div>
							</div>
							<div class="preview__main-row-right">
								<div class="preview__block-item --w90"></div>
							</div>
						</div>
						<div class="preview__main-column">
							<div class="preview__main-header"></div>
							<div class="preview__main-table"></div>
						</div>
					</div>
					<div class="preview__main-right">
						<div class="preview__circle_container">	
							<div class="preview__circle_item --light"></div>
						</div>	
						<div class="preview__circle_container">	
							<div class="preview__circle_item --light"></div>
						</div>	
						<div class="preview__circle_container">	
							<div class="preview__circle_item --light"></div>
						</div>	
						<div class="preview__circle_container">	
							<div class="preview__circle_item --light"></div>
						</div>	
					</div>
				</div>
			</section>
			`;
			}
			return this.#container;
		}
	}

	class PortalPage extends ui_formElements_field.BaseSettingsPage {
		constructor() {
			super();
			this.titlePage = main_core.Loc.getMessage('INTRANET_SETTINGS_TITLE_PAGE_PORTAL');
			this.descriptionPage = main_core.Loc.getMessage('INTRANET_SETTINGS_DESCRIPTION_PAGE_PORTAL');
			main_core_events.EventEmitter.subscribe(main_core_events.EventEmitter.GLOBAL_TARGET, this.getEventNamespace() + ':Portal:Change', baseEvent => {
				if (!main_core.Type.isNil(baseEvent.data.title)) {
					this.getAnalytic()?.addEventConfigPortal(AnalyticSettingsEvent.CHANGE_PORTAL_NAME);
				} else if (!main_core.Type.isNil(baseEvent.data.logo)) {
					this.getAnalytic()?.addEventConfigPortal(AnalyticSettingsEvent.CHANGE_PORTAL_LOGO);
				}
			});
			//BX.Intranet.Settings:ThemePicker:Change
			main_core_events.EventEmitter.subscribe(main_core_events.EventEmitter.GLOBAL_TARGET, this.getEventNamespace() + ':ThemePicker:Change', baseEvent => {
				this.getAnalytic()?.addEventChangeTheme(baseEvent.data?.id);
			});
			main_core_events.EventEmitter.subscribe(main_core_events.EventEmitter.GLOBAL_TARGET, 'onPullEvent-bitrix24', baseEvent => {
				if (baseEvent.data[0] === 'domain_change') {
					const {
						domain
					} = baseEvent.data[1];
					const newUri = new main_core.Uri(window.location.href);
					newUri.setHost(domain);
					const currentWindow = window.parent ?? window;
					currentWindow.location.href = newUri;
				}
			});
		}
		getType() {
			return 'portal';
		}
		headerWidgetRender() {
			return '';
			// It is used to return #headerWidgetRenderAlternative;
		}

		//TODO delete after autumn 2023
		#headerWidgetRenderAlternative() {
			if (!this.hasValue('portalSettings')) {
				return '';
			}
			const portalSettings = this.getValue('portalSettings');
			const portalThemeSettings = this.getValue('portalThemeSettings');
			const portalDomainSettings = this.getValue('portalDomainSettings');
			const container = main_core.Tag.render`
		<div class="intranet-settings__header-widget_box">
			<div class="intranet-settings__header-widget_main">
				<div class="intranet-settings__header-widget_icon" data-role="logo"></div>
				<div class="intranet-settings__header-widget_name" data-role="title">Bitrix</div>
				<div class="intranet-settings__header-widget_logo24" data-role="logo24">24</div>
			</div>
			<div class="intranet-settings__header-widget__link_box">
				<div class="intranet-settings__header-widget__link_value">${main_core.Text.encode(portalDomainSettings.hostname)}</div>
				<div data-role="copy" class="ui-icon-set --link-3 intranet-settings__header-widget__link_btn"></div>
			</div>
		</div>`;
			setPortalSettings(container, portalSettings);
			setPortalThemeSettings(container, portalThemeSettings?.theme);
			const copyButton = container.querySelector('[data-role="copy"]');
			BX.clipboard.bindCopyClick(copyButton, {
				text: () => {
					return portalDomainSettings.hostname;
				}
			});
			return container;
		}
		getSections() {
			return [this.buildSiteTitleSection(this.getValue('portalSettings'), this.getValue('portalThemeSettings'), this.getValue('portalSettingsLabels')), this.getValue('portalDomainSettings') ? this.buildDomainSection(this.getValue('portalDomainSettings')) : null, this.buildThemeSection(this.getValue('portalThemeSettings'), this.getValue('portalSettings'))].filter(section => section instanceof ui_formElements_field.SettingsSection);
		}
		buildSiteTitleSection(portalSettings, portalThemeSettings, portalSettingsLabels) {
			if (!this.hasValue('sectionCompanyTitle')) {
				return;
			}
			const sectionView = new ui_section.Section(this.getValue('sectionCompanyTitle'));
			const sectionField = new ui_formElements_field.SettingsSection({
				parent: this,
				section: sectionView
			});

			// 1. This is a description on blue box
			sectionView.append(new ui_section.Row({
				content: new ui_alerts.Alert({
					text: main_core.Loc.getMessage('INTRANET_SETTINGS_SECTION_TITLE_SITE_TITLE_DESCRIPTION'),
					inline: true,
					size: ui_alerts.AlertSize.SMALL,
					color: ui_alerts.AlertColor.PRIMARY
				}).getContainer()
			}).render());

			// 2.0 Widget
			const previewWidget = new SiteTitlePreviewWidget(portalSettings, portalThemeSettings);
			new ui_formElements_field.SettingsRow({
				row: new ui_section.Row({
					content: previewWidget.render(),
					className: 'intranet-settings__site-logo_subrow'
				}),
				parent: sectionField
			});

			//region 2.1 Tabs
			new ui_formElements_field.SettingsRow({
				row: new ui_section.Row({
					className: 'intranet-settings__grid_box'
				}),
				parent: sectionField
			});
			const tabsRow = new ui_formElements_field.SettingsRow({
				row: new ui_section.Row({
					className: 'intranet-settings__site-logo_subrow --bottom-separator --block'
				}),
				parent: sectionField
			});
			const tabsField = new ui_formElements_field.TabsField({
				parent: tabsRow
			});

			// 2.2 Tab Site name
			const siteTitleTab = new ui_formElements_field.TabField({
				parent: tabsField,
				tabsOptions: this.getValue('tabCompanyTitle')
			});
			const siteTitleRow = new ui_section.Row({});
			const siteTitleField = new SiteTitleField({
				parent: siteTitleRow,
				siteTitleOptions: portalSettings,
				siteTitleLabels: portalSettingsLabels,
				helpMessages: {
					site: this.helpMessageProviderFactory()
				}
			});
			new ui_formElements_field.SettingsRow({
				row: siteTitleRow,
				parent: siteTitleTab,
				child: siteTitleField
			});
			new ui_formElements_field.SettingsRow({
				parent: siteTitleTab,
				child: siteTitleField.getLogo24Field()
			});
			const siteLogoTab = new ui_formElements_field.TabField({
				parent: tabsField,
				tabsOptions: this.getValue('tabCompanyLogo')
			});
			const siteLogoField = new SiteLogoField({
				siteLogoLabel: this.getValue('portalSettingsLabels').logo,
				siteLogoOptions: this.getValue('portalSettings').logo,
				canUserEditLogo: this.getValue('portalSettings').canUserEditLogo
			});
			new ui_formElements_field.SettingsRow({
				parent: siteLogoTab,
				child: siteLogoField
			});
			tabsField.activateTab(siteTitleTab);

			// 2.3 site_name

			new ui_formElements_field.SettingsRow({
				row: new ui_section.SeparatorRow(),
				parent: sectionField
			});
			new ui_formElements_field.SettingsRow({
				parent: sectionField,
				child: new ui_formElements_field.SettingsField({
					fieldView: new ui_formElements_view.TextInput({
						inputName: 'name',
						label: this.getValue('portalSettingsLabels').name,
						value: this.getValue('portalSettings').name,
						placeholder: main_core.Loc.getMessage('INTRANET_SETTINGS_FIELD_LABEL_COMPANY_TITLE'),
						inputDefaultWidth: true
					})
				})
			});

			//endregion
			return sectionField;
		}
		#getOwnDomainTabBody(domainSettings) {
			const copyButton = main_core.Tag.render`<div class="ui-icon-set --copy-plates intranet-settings__domain__list_btn"></div>`;
			const exampleDns = domainSettings.exampleDns.join('<br>');
			BX.clipboard.bindCopyClick(copyButton, {
				text: () => {
					return exampleDns.replaceAll('<br>', "\n");
				}
			});
			const res = main_core.Tag.render`<div class="intranet-settings__domain__list_box">
						<ul class="intranet-settings__domain__list">
							<li class="intranet-settings__domain__list_item">
								${main_core.Loc.getMessage('INTRANET_SETTINGS_OWN_DOMAIN_HELP1')}
								<div class="intranet-settings__domain_box">
									${exampleDns}
									${copyButton}
								</div>
							</li>
							<li class="intranet-settings__domain__list_item">
								${main_core.Loc.getMessage('INTRANET_SETTINGS_OWN_DOMAIN_HELP2')}
							</li>
							<li class="intranet-settings__domain__list_item">
								${main_core.Loc.getMessage('INTRANET_SETTINGS_OWN_DOMAIN_HELP3')}
							</li>
						</ul>
						<a target="_blank" href="/settings/support.php" class="settings-tools-description-link">${main_core.Loc.getMessage('INTRANET_SETTINGS_WRITE_TO_SUPPORT')}</a>
					</div>`;
			if (domainSettings.isCustomizable !== true) {
				main_core.Event.bind(res.querySelector('a.settings-tools-description-link'), 'click', event => {
					BX.UI.InfoHelper.show('limit_office_own_domain');
					event.preventDefault();
					return false;
				});
			}
			return res;
		}
		buildDomainSection(domainSettings) {
			if (!this.hasValue('sectionSiteDomain')) {
				return;
			}
			const sectionView = new ui_section.Section(this.getValue('sectionSiteDomain'));
			const sectionField = new ui_formElements_field.SettingsSection({
				parent: this,
				section: sectionView
			});
			// 1. This is a description on blue box
			sectionView.append(new ui_section.Row({
				content: new ui_alerts.Alert({
					text: `
						${main_core.Loc.getMessage('INTRANET_SETTINGS_SECTION_TITLE_SITE_DOMAIN_DESCRIPTION')}
						<a class="ui-section__link" onclick="top.BX.Helper.show('redirect=detail&code=18213298')">
							${main_core.Loc.getMessage('INTRANET_SETTINGS_CANCEL_MORE')}
						</a>
					`,
					inline: true,
					size: ui_alerts.AlertSize.SMALL,
					color: ui_alerts.AlertColor.PRIMARY
				}).getContainer()
			}).render());
			const tabsRow = new ui_formElements_field.SettingsRow({
				parent: sectionField
			});

			//region 2. Tabs
			const tabsField = new ui_formElements_field.TabsField({
				parent: tabsRow
			});
			// 2.1 Tab Site name
			const firstTab = new ui_formElements_field.TabField({
				parent: tabsField,
				tabsOptions: this.getValue('tabDomainPrefix')
			});
			const siteDomainField = new SiteDomainField({
				siteDomainOptions: domainSettings,
				helpMessages: {
					site: this.helpMessageProviderFactory()
				}
			});
			main_core.Event.bind(siteDomainField.getFieldView().getInputNode(), 'keydown', () => {
				this.getAnalytic()?.addEventConfigPortal(AnalyticSettingsEvent.CHANGE_PORTAL_SITE);
			});
			const firstTabRow = new ui_section.Row({
				content: siteDomainField.render()
			});
			new ui_formElements_field.SettingsRow({
				row: firstTabRow,
				parent: firstTab,
				child: siteDomainField
			});
			const secondTab = new ui_formElements_field.TabField({
				parent: tabsField,
				tabsOptions: this.getValue('tabDomain')
			});
			const descriptionRow = new ui_section.Row({
				content: this.#getOwnDomainTabBody(domainSettings)
			});
			new ui_formElements_field.SettingsRow({
				row: descriptionRow,
				parent: secondTab
			});
			tabsField.activateTab(firstTab);
			//endregion

			return sectionField;
		}
		buildThemeSection(themePickerSettings, portalSettings) {
			if (!this.hasValue('sectionSiteTheme')) {
				return;
			}
			const sectionView = new ui_section.Section(this.getValue('sectionSiteTheme'));
			const sectionField = new ui_formElements_field.SettingsSection({
				section: sectionView,
				parent: this
			});

			// 1. This is a description on blue box
			new ui_formElements_field.SettingsRow({
				row: new ui_section.Row({
					content: new ui_alerts.Alert({
						text: `
						${main_core.Loc.getMessage('INTRANET_SETTINGS_SECTION_TITLE_PORTAL_THEME_DESCRIPTION')}
						<a class="ui-section__link" onclick="top.BX.Helper.show('redirect=detail&code=18325288')">
							${main_core.Loc.getMessage('INTRANET_SETTINGS_CANCEL_MORE')}
						</a>
					`,
						inline: true,
						size: ui_alerts.AlertSize.SMALL,
						color: ui_alerts.AlertColor.PRIMARY
					}).getContainer()
				}),
				parent: sectionField
			});

			// 2. This is a theme picker
			new SiteThemePickerField({
				parent: sectionField,
				portalSettings,
				themePickerSettings
			});
			return sectionField;
		}
	}

	class PortalDeleteFormType {
		static NOT_ADMIN = 'not_admin';
		static BOUND = 'bound';
		static MAIL = 'mail';
		static EMPLOYEE = 'employee';
		static NETWORK = 'network';
		static DEFAULT = 'default';
	}
	class PortalDeleteForm extends main_core_events.EventEmitter {
		#container;
		#verificationOptions;
		constructor(verificationOptions) {
			super();
			this.#verificationOptions = verificationOptions;
			this.setEventNamespace('BX.Intranet.Settings:PortalDeleteForm');
		}
		getDescription() {
			return main_core.Tag.render`
			${main_core.Loc.getMessage('INTRANET_SETTINGS_SECTION_CONFIGURATION_DESCRIPTION_DELETE_PORTAL_MSGVER_1', {
			'#MORE_DETAILS#': this.getMoreDetails()
		})}
		`;
		}
		getMoreDetails() {
			return `
			<a class="ui-section__link" onclick="top.BX.Helper.show('redirect=detail&code=19566456')">
				${main_core.Loc.getMessage('INTRANET_SETTINGS_CANCEL_MORE')}
			</a>
		`;
		}
		getBodyClass() {
			return '--warning';
		}
		getConfirmButtonText() {
			return main_core.Loc.getMessage('INTRANET_SETTINGS_CONFIRM_ACTION_DELETE_PORTAL');
		}
		getInputContainer() {}
		getContainer() {
			if (!this.#container) {
				this.#container = main_core.Tag.render`
				<div class="intranet-settings__portal-delete-form_wrapper ${this.getBodyClass()}">
					<div class="intranet-settings__portal-delete-form_body">
						<div class="intranet-settings__portal-delete-icon-wrapper">
							<div class="ui-icon-set --warning"></div>
						</div>
						<div class="intranet-settings__portal-delete-form_description-wrapper">
							<span class="intranet-settings__portal-delete-form_description">
								${this.getDescription()}
							</span>
							${this.getInputContainer()}
						</div>
					</div>
					${this.getButtonContainer()}
				</div>
			`;
			}
			return this.#container;
		}
		onConfirmEventHandler() {
			this.getConfirmButton().setWaiting(true);
			top.BX.Runtime.loadExtension('bitrix24.portal-delete').then(exports => {
				const {
					PortalDelete
				} = exports;
				const portalDelete = new PortalDelete(this.#verificationOptions);
				portalDelete.showCheckwordPopup();
				this.getConfirmButton().setWaiting(false);
			});
		}
		getButtonContainer() {
			return main_core.Tag.render`
			<span class="intranet-settings__portal-delete-form_buttons-wrapper">
				${this.getConfirmButton().getContainer()}
			</span>
		`;
		}
		getConfirmButton() {
			if (!this.confirmButton) {
				this.confirmButton = new ui_buttons.Button({
					text: this.getConfirmButtonText() ?? '',
					noCaps: true,
					round: true,
					className: '--confirm',
					events: {
						click: () => {
							this.onConfirmEventHandler();
						}
					},
					props: {
						'data-bx-role': 'delete-portal-confirm'
					}
				});
			}
			return this.confirmButton;
		}
		sendChangeFormEvent(type) {
			this.emit('updateForm', new main_core_events.BaseEvent({
				data: {
					type: type ?? null
				}
			}));
		}
	}

	class PortalDeleteFormEmployee extends PortalDeleteForm {
		#isFreeLicense;
		constructor(isFreeLicense) {
			super();
			this.#isFreeLicense = isFreeLicense;
		}
		getDescription() {
			return main_core.Tag.render`
			${main_core.Loc.getMessage('INTRANET_SETTINGS_SECTION_CONFIGURATION_DESCRIPTION_DELETE_PORTAL_EMPLOYEE', {
			'#MORE_DETAILS#': this.getMoreDetails()
		})}
		`;
		}
		getConfirmButtonText() {
			return main_core.Loc.getMessage('INTRANET_SETTINGS_CONFIRM_ACTION_DELETE_PORTAL_FIRE_EMPLOYEE');
		}
		onConfirmEventHandler() {
			this.getConfirmButton().setWaiting(true);
			BX.SidePanel.Instance.open('/company/?apply_filter=Y&FIRED=N', {
				events: {
					onCloseComplete: () => {
						main_core.ajax.runAction('bitrix24.portal.getActiveUserCount').then(response => {
							this.getConfirmButton().setWaiting(false);
							if (response.data <= 1) {
								this.sendChangeFormEvent(this.#isFreeLicense ? PortalDeleteFormType.DEFAULT : PortalDeleteFormType.MAIL);
							}
						}).catch(reject => {
							this.getConfirmButton().setWaiting(false);
							reject.errors.forEach(error => {
								console.log(error.message);
							});
						});
					}
				}
			});
		}
	}

	class PortalDeleteFormMail extends PortalDeleteForm {
		#mailForRequest;
		#portalUrl;
		#mailLink;
		constructor(mailForRequest, portalUrl) {
			super();
			this.#mailForRequest = mailForRequest;
			this.#portalUrl = portalUrl;
		}
		getConfirmButtonText() {
			return main_core.Loc.getMessage('INTRANET_SETTINGS_CONFIRM_ACTION_DELETE_PORTAL_MAIL', {
				'#MAIL#': this.#mailForRequest
			});
		}
		onConfirmEventHandler() {
			top.window.location.href = this.#getMailLink();
		}
		#getMailLink() {
			if (!this.#mailLink) {
				const mailBody = main_core.Loc.getMessage('INTRANET_SETTINGS_PORTAL_DELETE_MAIL_BODY', {
					'#PORTAL_URL#': this.#portalUrl
				});
				const mailSubject = main_core.Loc.getMessage('INTRANET_SETTINGS_PORTAL_DELETE_MAIL_SUBJECT', {
					'#PORTAL_URL#': this.#portalUrl
				});
				this.#mailLink = `mailto:${this.#mailForRequest}?body=${mailBody}&subject=${mailSubject}`;
			}
			return this.#mailLink;
		}
		getDescription() {
			return main_core.Tag.render`
			${main_core.Loc.getMessage('INTRANET_SETTINGS_SECTION_CONFIGURATION_DESCRIPTION_DELETE_PORTAL_MAIL', {
			'#MAIL#': this.#mailForRequest,
			'#MAIL_LINK#': this.#getMailLink(),
			'#MORE_DETAILS#': this.getMoreDetails()
		})}
		`;
		}
	}

	class PortalDeleteFormNotAdmin extends PortalDeleteForm {
		getButtonContainer() {}
		getDescription() {
			return main_core.Tag.render`
			${main_core.Loc.getMessage('INTRANET_SETTINGS_SECTION_CONFIGURATION_DESCRIPTION_DELETE_PORTAL_NOT_ADMIN')}
			<a class="ui-section__link" onclick="top.BX.Helper.show('redirect=detail&code=19566456')">
				${main_core.Loc.getMessage('INTRANET_SETTINGS_CANCEL_MORE')}
			</a>
		`;
		}
	}

	class PortalDeleteFormBound extends PortalDeleteForm {
		getButtonContainer() {}
		getDescription() {
			return main_core.Tag.render`
			${main_core.Loc.getMessage('INTRANET_SETTINGS_SECTION_CONFIGURATION_DESCRIPTION_DELETE_PORTAL_BOUND', {
			'#MORE_DETAILS#': this.getMoreDetails()
		})}
		`;
		}
	}

	class PortalDeleteFormNetwork extends PortalDeleteForm {
		#networkUrl;
		constructor(networkUrl) {
			super();
			this.#networkUrl = networkUrl;
		}
		getButtonContainer() {
			if (main_core.Type.isStringFilled(this.#networkUrl)) {
				return super.getButtonContainer();
			}
			return null;
		}
		getConfirmButton() {
			if (!this.confirmButton) {
				this.confirmButton = new ui_buttons.Button({
					tag: ui_buttons.Button.Tag.LINK,
					link: this.#networkUrl,
					text: main_core.Loc.getMessage('INTRANET_SETTINGS_CONFIRM_ACTION_DELETE_PORTAL_NETWORK_LINK'),
					noCaps: true,
					round: true,
					className: '--confirm',
					props: {
						'data-bx-role': 'delete-portal-confirm',
						'target': '_top'
					}
				});
			}
			return this.confirmButton;
		}
		getDescription() {
			return main_core.Tag.render`
			${main_core.Loc.getMessage('INTRANET_SETTINGS_SECTION_CONFIGURATION_DESCRIPTION_DELETE_PORTAL_NETWORK', {
			'#MORE_DETAILS#': this.getMoreDetails()
		})}
		`;
		}
	}

	class PortalDeleteSection extends ui_formElements_field.SettingsSection {
		#options;
		#settingsRow;
		#form;
		#defaultBodyClass;
		#bodyClass;
		constructor(params) {
			super(params);
			this.#defaultBodyClass = this.getSectionView().className.bodyActive;
			this.#options = params.options;
			let type;
			if (!this.#options.isAdmin) {
				type = PortalDeleteFormType.NOT_ADMIN;
			} else if (!this.#options.isFreeLicense) {
				type = PortalDeleteFormType.MAIL;
			} else if (this.#options.isBound) {
				type = PortalDeleteFormType.BOUND;
			} else if (this.#options.isEmployeesLeft) {
				type = PortalDeleteFormType.EMPLOYEE;
			} else if (!this.#options.verificationOptions) {
				type = PortalDeleteFormType.NETWORK;
			} else {
				type = PortalDeleteFormType.DEFAULT;
			}
			this.#renderFormRow(type);
		}
		#renderFormRow(type) {
			if (this.#settingsRow) {
				this.removeChild(this.#settingsRow);
				main_core.Dom.remove(this.#settingsRow.render());
			}
			switch (type) {
				case PortalDeleteFormType.MAIL:
					this.#form = new PortalDeleteFormMail(this.#options.mailForRequest, this.#options.portalUrl);
					break;
				case PortalDeleteFormType.EMPLOYEE:
					this.#form = new PortalDeleteFormEmployee(this.#options.isFreeLicense);
					break;
				case PortalDeleteFormType.NOT_ADMIN:
					this.#form = new PortalDeleteFormNotAdmin();
					break;
				case PortalDeleteFormType.BOUND:
					this.#form = new PortalDeleteFormBound();
					break;
				case PortalDeleteFormType.NETWORK:
					this.#form = new PortalDeleteFormNetwork(this.#options.networkUrl);
					break;
				default:
					this.#form = new PortalDeleteForm(this.#options.verificationOptions);
					break;
			}
			this.#updateSectionBodyClass();
			this.#bindFormEvents();
			const formRow = new ui_section.Row({
				content: this.#form.getContainer()
			});
			this.#settingsRow = new ui_formElements_field.SettingsRow({
				row: formRow
			});
			this.addChild(this.#settingsRow);
			this.render();
		}
		#bindFormEvents() {
			this.#form.subscribe('closeForm', () => {
				this.getSectionView().toggle(false);
			});
			this.#form.subscribe('updateForm', event => {
				if (event.data.type) {
					this.#renderFormRow(event.data.type);
				}
			});
		}
		#updateSectionBodyClass() {
			main_core.Dom.removeClass(this.getSectionView().getContent(), this.#bodyClass);
			this.#bodyClass = this.#form.getBodyClass();
			this.getSectionView().className.bodyActive = this.#defaultBodyClass + ' ' + this.#bodyClass;
			if (this.getSectionView().isOpen) {
				main_core.Dom.addClass(this.getSectionView().getContent(), this.#bodyClass);
			}
		}
	}

	class ConfigurationPage extends ui_formElements_field.BaseSettingsPage {
		#header;
		constructor() {
			super();
			this.titlePage = main_core.Loc.getMessage('INTRANET_SETTINGS_TITLE_PAGE_CONFIGURATION');
		}
		getType() {
			return 'configuration';
		}
		headerWidgetRender() {
			let timeFormat = '';
			if (this.getValue('isFormat24Hour')?.current === 'Y') {
				timeFormat = this.getValue('format24HourTime');
			} else {
				timeFormat = this.getValue('format12HourTime');
			}
			this.#header = main_core.Tag.render`
		<div class="intranet-settings__date-widget_box">
			<span class="ui-icon-set --earth-language"></span>
			<div class="intranet-settings__date-widget_content">
				<div class="intranet-settings__date-widget_inner">
					<span data-role="time" class="intranet-settings__date-widget_title">${timeFormat}</span>
					<span class="intranet-settings__date-widget_subtitle">${this.getValue('offsetUTC')}</span>
				</div>
				<div data-role="date" class="intranet-settings__date-widget_subtitle">${this.getValue('currentDate')}</div>
			</div>
		</div>`;
			return this.#header;
		}
		appendSections(contentNode) {
			let dateTimeSection = this.#buildDateTimeSection();
			dateTimeSection?.renderTo(contentNode);
			let mailsSection = this.#buildMailsSection();
			mailsSection?.renderTo(contentNode);
			if (this.hasValue('mapsProviderCRM') && this.getValue('mapsProviderCRM')) {
				let mapsSection = this.#buildCRMMapsSection();
				mapsSection?.renderTo(contentNode);
			}
			let cardsProductPropertiesSection = this.#buildCardsProductPropertiesSection();
			cardsProductPropertiesSection?.renderTo(contentNode);
			const biconnectorSettingsSection = this.#buildBIConnectorSettingsSection();
			biconnectorSettingsSection?.renderTo(contentNode);
			let additionalSettingsSection = this.#buildAdditionalSettingsSection();
			additionalSettingsSection?.renderTo(contentNode);
			if (this.hasValue('deletePortalOptions') && this.hasValue('sectionDeletePortal')) {
				const deletePortalSection = new ui_section.Section(this.getValue('sectionDeletePortal'));
				const settingsSection = new PortalDeleteSection({
					section: deletePortalSection,
					parent: this,
					options: this.getValue('deletePortalOptions')
				});
				settingsSection.renderTo(contentNode);
			}
			if (BX.UI.Hint) {
				BX.UI.Hint.init(contentNode);
			}
		}
		#buildDateTimeSection() {
			if (!this.hasValue('sectionDateFormat')) {
				return;
			}
			let dateTimeSection = new ui_section.Section(this.getValue('sectionDateFormat'));
			const settingsSection = new ui_formElements_field.SettingsSection({
				section: dateTimeSection,
				parent: this
			});
			if (this.hasValue('culture')) {
				let regionField = new ui_formElements_view.Selector(this.getValue('culture'));
				ConfigurationPage.addToSectionHelper(regionField, settingsSection, new ui_section.Row({
					className: '--intranet-settings__mb-20'
				}));
				main_core.Event.bind(regionField.getInputNode(), 'change', event => {
					this.#header.querySelector('[data-role="date"]').innerHTML = this.getValue('longDates')[event.target.value];
				});
			}
			if (this.hasValue('isFormat24Hour')) {
				let format24Time = new ui_formElements_view.InlineChecker(this.getValue('isFormat24Hour'));
				ConfigurationPage.addToSectionHelper(format24Time, settingsSection);
				main_core_events.EventEmitter.subscribe(format24Time, 'change', event => {
					this.#header.querySelector('[data-role="time"]').innerHTML = format24Time.isChecked() ? this.getValue('format24HourTime') : this.getValue('format12HourTime');
				});
			}
			return settingsSection;
		}
		#buildMailsSection() {
			if (!this.hasValue('sectionLetters')) {
				return;
			}
			let mailsSection = new ui_section.Section(this.getValue('sectionLetters'));
			const settingsSection = new ui_formElements_field.SettingsSection({
				section: mailsSection,
				parent: this
			});
			if (this.hasValue('trackOutMailsRead')) {
				let trackOutLettersRead = new ui_formElements_view.Checker(this.getValue('trackOutMailsRead'));
				let showQuitRow = new ui_section.Row({});
				ConfigurationPage.addToSectionHelper(trackOutLettersRead, settingsSection, showQuitRow);
			}
			if (this.hasValue('trackOutMailsClick')) {
				let trackOutMailsClick = new ui_formElements_view.Checker(this.getValue('trackOutMailsClick'));
				let showQuitRow = new ui_section.Row({});
				ConfigurationPage.addToSectionHelper(trackOutMailsClick, settingsSection, showQuitRow);
			}
			if (this.hasValue('defaultEmailFrom')) {
				let defaultEmailFrom = new ui_formElements_view.TextInput(this.getValue('defaultEmailFrom'));
				let showQuitRow = new ui_section.Row({});
				ConfigurationPage.addToSectionHelper(defaultEmailFrom, settingsSection, showQuitRow);
			}
			if (this.hasValue('selectorMailConnectionResponsibleAdmin')) {
				const responsibleAdminField = ui_formElements_view.FieldFactory.createUserSelector({
					...this.getValue('selectorMailConnectionResponsibleAdmin'),
					multiple: false,
					enableAll: false,
					enableUsers: false,
					entities: [{
						id: 'user',
						options: {
							intranetUsersOnly: true,
							userId: this.getValue('mailConnectionAdminIds') ?? []
						}
					}]
				});
				const responsibleAdminRow = new ui_section.Row({});
				ConfigurationPage.addToSectionHelper(responsibleAdminField, settingsSection, responsibleAdminRow);
			}
			return settingsSection;
		}
		#buildCRMMapsSection() {
			if (!this.hasValue('sectionMapsInCrm')) {
				return;
			}
			let mapsSection = new ui_section.Section(this.getValue('sectionMapsInCrm'));
			const settingsSection = new ui_formElements_field.SettingsSection({
				section: mapsSection,
				parent: this
			});
			let cardsProvider = new ui_formElements_view.Selector({
				label: this.getValue('mapsProviderCRM').label ?? main_core.Loc.getMessage('INTRANET_SETTINGS_FIELD_LABEL_CHOOSE_REGION_CRM_MAPS'),
				name: this.getValue('mapsProviderCRM').name,
				items: this.getValue('mapsProviderCRM').values,
				current: this.getValue('mapsProviderCRM').current
			});
			let cardsProviderRow = new ui_section.Row({
				separator: 'bottom',
				className: '--block'
			});
			ConfigurationPage.addToSectionHelper(cardsProvider, settingsSection, cardsProviderRow);
			const separatorRow = new ui_section.SeparatorRow({
				isHidden: this.getValue('mapsProviderCRM').current === 'OSM'
			});
			new ui_formElements_field.SettingsRow({
				row: separatorRow,
				parent: settingsSection
			});
			const description = new BX.UI.Alert({
				text: main_core.Loc.getMessage('INTRANET_SETTINGS_SECTION_CRM_MAPS_DESCRIPTION', {
					'#GOOGLE_API_URL#': this.getValue('googleApiUrl')
				}),
				inline: true,
				size: BX.UI.Alert.Size.SMALL,
				color: BX.UI.Alert.Color.PRIMARY,
				animated: true
			});
			const descriptionRow = new ui_section.Row({
				separator: 'top',
				content: description.getContainer(),
				isHidden: this.getValue('mapsProviderCRM').current === 'OSM'
			});
			new ui_formElements_field.SettingsRow({
				row: descriptionRow,
				parent: settingsSection
			});
			const googleKeyFrontend = new ui_formElements_view.TextInputInline({
				inputName: 'API_KEY_FRONTEND',
				label: main_core.Loc.getMessage('INTRANET_SETTINGS_FIELD_LABEL_GOOGLE_KEY_PUBLIC'),
				hintTitle: main_core.Loc.getMessage('INTRANET_SETTINGS_FIELD_LABEL_GOOGLE_KEY_PUBLIC_HINT'),
				value: this.getValue('API_KEY_FRONTEND').value,
				placeholder: main_core.Loc.getMessage('INTRANET_SETTINGS_FIELD_LABEL_TEXT_KEY_PLACEHOLDER')
			});
			const googleKeyFrontendRow = new ui_section.Row({
				isHidden: this.getValue('mapsProviderCRM').current === 'OSM'
			});
			ConfigurationPage.addToSectionHelper(googleKeyFrontend, settingsSection, googleKeyFrontendRow);
			const mapApiKeyBackend = new ui_formElements_view.TextInputInline({
				inputName: 'API_KEY_BACKEND',
				label: main_core.Loc.getMessage('INTRANET_SETTINGS_FIELD_LABEL_GOOGLE_KEY_SERVER'),
				hintTitle: main_core.Loc.getMessage('INTRANET_SETTINGS_FIELD_LABEL_GOOGLE_KEY_SERVER_HINT'),
				value: this.getValue('API_KEY_BACKEND').value,
				placeholder: main_core.Loc.getMessage('INTRANET_SETTINGS_FIELD_LABEL_TEXT_KEY_PLACEHOLDER')
			});
			const googleKeyBackendRow = new ui_section.Row({
				content: mapApiKeyBackend.render(),
				isHidden: this.getValue('mapsProviderCRM').current === 'OSM',
				separator: 'bottom',
				className: '--block'
			});
			ConfigurationPage.addToSectionHelper(mapApiKeyBackend, settingsSection, googleKeyBackendRow);
			const separatorRow1 = new ui_section.SeparatorRow({});
			new ui_formElements_field.SettingsRow({
				row: separatorRow1,
				parent: settingsSection
			});
			let showPhotoPlacesMaps = new ui_formElements_view.Checker({
				inputName: 'SHOW_PHOTOS_ON_MAP',
				title: main_core.Loc.getMessage('INTRANET_SETTINGS_FIELD_LABEL_SHOW_PHOTO_PLACES_MAPS'),
				hintOn: main_core.Loc.getMessage('INTRANET_SETTINGS_FIELD_HINT_SHOW_PHOTO_PLACES_MAPS_CLICK_ON'),
				hintOff: main_core.Loc.getMessage('INTRANET_SETTINGS_FIELD_HINT_SHOW_PHOTO_PLACES_MAPS_CLICK_ON'),
				checked: this.getValue('SHOW_PHOTOS_ON_MAP').value === '1'
			});
			let showPhotoPlacesMapsRow = new ui_section.Row({
				separator: 'top',
				className: '--block',
				content: showPhotoPlacesMaps.render(),
				isHidden: this.getValue('mapsProviderCRM').current === 'OSM'
			});
			ConfigurationPage.addToSectionHelper(showPhotoPlacesMaps, settingsSection, showPhotoPlacesMapsRow);
			let useGeocodingService = new ui_formElements_view.Checker({
				inputName: 'USE_GEOCODING_SERVICE',
				title: main_core.Loc.getMessage('INTRANET_SETTINGS_FIELD_LABEL_SHOW_GEOCODING_SERVICE'),
				hintOn: main_core.Loc.getMessage('INTRANET_SETTINGS_FIELD_HINT_SHOW_PHOTO_PLACES_MAPS_CLICK_ON'),
				hintOff: main_core.Loc.getMessage('INTRANET_SETTINGS_FIELD_HINT_SHOW_PHOTO_PLACES_MAPS_CLICK_ON'),
				checked: this.getValue('USE_GEOCODING_SERVICE').value === '1'
			});
			let useGeocodingServiceRow = new ui_section.Row({
				content: useGeocodingService.render(),
				isHidden: this.getValue('mapsProviderCRM').current === 'OSM'
			});
			ConfigurationPage.addToSectionHelper(useGeocodingService, settingsSection, useGeocodingServiceRow);
			cardsProvider.getInputNode().addEventListener('change', event => {
				if (event.target.value === 'OSM') {
					separatorRow.hide();
					descriptionRow.hide();
					googleKeyFrontendRow.hide();
					googleKeyBackendRow.hide();
					useGeocodingServiceRow.hide();
					showPhotoPlacesMapsRow.hide();
				} else {
					separatorRow.show();
					descriptionRow.show();
					googleKeyFrontendRow.show();
					googleKeyBackendRow.show();
					useGeocodingServiceRow.show();
					showPhotoPlacesMapsRow.show();
				}
			});
			return settingsSection;
		}
		#buildCardsProductPropertiesSection() {
			if (!this.hasValue('sectionMapsInProduct')) {
				return;
			}
			let productPropertiesSection = new ui_section.Section(this.getValue('sectionMapsInProduct'));
			const settingsSection = new ui_formElements_field.SettingsSection({
				section: productPropertiesSection,
				parent: this
			});
			if (this.hasValue('cardsProviderProductProperties')) {
				let cardsProviderProductProperties = new ui_formElements_view.Selector({
					label: this.getValue('cardsProviderProductProperties').label ?? main_core.Loc.getMessage('INTRANET_SETTINGS_FIELD_LABEL_CHOOSE_REGION_CRM_MAPS'),
					name: this.getValue('cardsProviderProductProperties').name,
					items: this.getValue('cardsProviderProductProperties').values,
					current: this.getValue('cardsProviderProductProperties').current
				});
				let cardsProviderProductPropertiesRow = new ui_section.Row({
					separator: 'bottom'
				});
				ConfigurationPage.addToSectionHelper(cardsProviderProductProperties, settingsSection, cardsProviderProductPropertiesRow);
				new ui_formElements_field.SettingsRow({
					row: new ui_section.SeparatorRow(),
					parent: settingsSection
				});
				const descriptionYandex = new BX.UI.Alert({
					text: main_core.Loc.getMessage('INTRANET_SETTINGS_SECTION_CRM_MAPS_YANDEX_DESCRIPTION', {
						'#YANDEX_API_URL#': this.getValue('yandexApiUrl')
					}),
					inline: true,
					size: BX.UI.Alert.Size.SMALL,
					color: BX.UI.Alert.Color.PRIMARY,
					animated: true
				});
				const descriptionYandexRow = new ui_section.Row({
					content: descriptionYandex.getContainer(),
					isHidden: this.getValue('cardsProviderProductProperties').current !== 'yandex'
				});
				new ui_formElements_field.SettingsRow({
					row: descriptionYandexRow,
					parent: settingsSection
				});
				const yandexKeyProductProperties = new ui_formElements_view.TextInput({
					inputName: 'yandexKeyProductProperties',
					label: main_core.Loc.getMessage('INTRANET_SETTINGS_FIELD_LABEL_MAP_PRODUCT_PROPERTIES_YANDEX_KEY'),
					value: this.getValue('yandexKeyProductProperties'),
					placeholder: main_core.Loc.getMessage('INTRANET_SETTINGS_FIELD_LABEL_TEXT_KEY_PLACEHOLDER')
				});
				const yandexKeyProductPropertiesRow = new ui_section.Row({
					separator: 'bottom',
					className: '--block',
					content: yandexKeyProductProperties.render(),
					isHidden: this.getValue('cardsProviderProductProperties').current !== 'yandex'
				});
				ConfigurationPage.addToSectionHelper(yandexKeyProductProperties, settingsSection, yandexKeyProductPropertiesRow);
				const descriptionGoogle = new BX.UI.Alert({
					text: main_core.Loc.getMessage('INTRANET_SETTINGS_SECTION_CRM_MAPS_DESCRIPTION', {
						'#GOOGLE_API_URL#': this.getValue('googleApiUrl')
					}),
					inline: true,
					size: BX.UI.Alert.Size.SMALL,
					color: BX.UI.Alert.Color.PRIMARY,
					animated: true
				});
				const descriptionGoogleRow = new ui_section.Row({
					content: descriptionGoogle.getContainer(),
					isHidden: this.getValue('cardsProviderProductProperties').current !== 'google'
				});
				new ui_formElements_field.SettingsRow({
					row: descriptionGoogleRow,
					parent: settingsSection
				});
				const googleKeyProductProperties = new ui_formElements_view.TextInput({
					inputName: 'googleKeyProductProperties',
					label: main_core.Loc.getMessage('INTRANET_SETTINGS_FIELD_LABEL_MAP_PRODUCT_PROPERTIES_GOOGLE_KEY'),
					value: this.getValue('googleKeyProductProperties'),
					placeholder: main_core.Loc.getMessage('INTRANET_SETTINGS_FIELD_LABEL_TEXT_KEY_PLACEHOLDER')
				});
				const googleKeyProductPropertiesRow = new ui_section.Row({
					content: googleKeyProductProperties.render(),
					isHidden: this.getValue('cardsProviderProductProperties').current !== 'google'
				});
				ConfigurationPage.addToSectionHelper(googleKeyProductProperties, settingsSection, googleKeyProductPropertiesRow);
				cardsProviderProductProperties.getInputNode().addEventListener('change', event => {
					if (event.target.value === 'yandex') {
						descriptionYandexRow.show();
						yandexKeyProductPropertiesRow.show();
						descriptionGoogleRow.hide();
						googleKeyProductPropertiesRow.hide();
					} else {
						descriptionYandexRow.hide();
						yandexKeyProductPropertiesRow.hide();
						descriptionGoogleRow.show();
						googleKeyProductPropertiesRow.show();
					}
				});
			}
			return settingsSection;
		}
		#buildBIConnectorSettingsSection() {
			if (!this.hasValue('sectionBIConnector')) {
				return;
			}
			const biconnectorSettingsSection = new ui_section.Section(this.getValue('sectionBIConnector'));
			const settingsSection = new ui_formElements_field.SettingsSection({
				section: biconnectorSettingsSection,
				parent: this
			});
			if (this.hasValue('biconnectorDashboardLanguage')) {
				const biconnectorLanguageOptions = this.getValue('biconnectorDashboardLanguage');
				const hintMessage = main_core.Loc.getMessage('INTRANET_SETTINGS_MAINPAGE_BICONNECTOR_LANGUAGE_HINT_MSGVER_1');
				if (hintMessage) {
					biconnectorLanguageOptions.label += ` <span data-hint="${hintMessage}" class="intranet-settings__ui-hint"></span>`;
				}
				const biconnectorLanguage = new ui_formElements_view.Selector(biconnectorLanguageOptions);
				const biconnectorLanguageRow = new ui_section.Row({
					className: '--block'
				});
				ConfigurationPage.addToSectionHelper(biconnectorLanguage, settingsSection, biconnectorLanguageRow);
			}
			if (this.hasValue('biconnectorDashboardTimezone')) {
				const biconnectorDashboardTimezoneOptions = this.getValue('biconnectorDashboardTimezone');
				const hintMessage = main_core.Loc.getMessage('INTRANET_SETTINGS_MAINPAGE_BICONNECTOR_TIMEZONE_HINT');
				if (hintMessage) {
					biconnectorDashboardTimezoneOptions.label += ` <span data-hint="${hintMessage}" class="intranet-settings__ui-hint"></span>`;
				}
				const biconnectorTimezone = new ui_formElements_view.Selector(biconnectorDashboardTimezoneOptions);
				const biconnectorTimezoneRow = new ui_section.Row({
					className: '--block'
				});
				ConfigurationPage.addToSectionHelper(biconnectorTimezone, settingsSection, biconnectorTimezoneRow);
			}
			return settingsSection;
		}
		#buildAdditionalSettingsSection() {
			if (!this.hasValue('sectionOther')) {
				return;
			}
			let additionalSettingsSection = new ui_section.Section(this.getValue('sectionOther'));
			const settingsSection = new ui_formElements_field.SettingsSection({
				section: additionalSettingsSection,
				parent: this
			});
			if (this.hasValue('allowUserInstallApplication')) {
				let allInstallMarketApplication = new ui_formElements_view.Checker(this.getValue('allowUserInstallApplication'));
				let allInstallMarketApplicationRow = new ui_section.Row({});
				main_core_events.EventEmitter.subscribe(allInstallMarketApplication.switcher, 'toggled', () => {
					this.getAnalytic()?.addEventConfigConfiguration(AnalyticSettingsEvent.CHANGE_MARKET, allInstallMarketApplication.isChecked());
				});
				ConfigurationPage.addToSectionHelper(allInstallMarketApplication, settingsSection, allInstallMarketApplicationRow);
			}
			if (this.hasValue('allCanBuyTariff')) {
				const messageNode = main_core.Tag.render`<span>${main_core.Loc.getMessage('INTRANET_SETTINGS_FIELD_HELP_MESSAGE')}</span>`;
				let allCanBuyTariff = new ui_formElements_view.Checker({
					inputName: this.getValue('allCanBuyTariff').inputName,
					title: this.getValue('allCanBuyTariff').title ?? main_core.Loc.getMessage('INTRANET_SETTINGS_FIELD_LABEL_ALL_CAN_BUY_TARIFF'),
					hintOn: this.getValue('allCanBuyTariff').hintOn,
					checked: this.getValue('allCanBuyTariff').checked,
					isEnable: this.getValue('allCanBuyTariff').isEnable,
					bannerCode: 'limit_why_pay_tariff_everyone',
					helpMessageProvider: this.helpMessageProviderFactory(messageNode)
				});
				let allCanBuyTariffRow = new ui_section.Row({});
				main_core_events.EventEmitter.subscribe(allCanBuyTariff.switcher, 'toggled', () => {
					this.getAnalytic()?.addEventConfigConfiguration(AnalyticSettingsEvent.CHANGE_PAY_TARIFF, allCanBuyTariff.isChecked());
				});
				ConfigurationPage.addToSectionHelper(allCanBuyTariff, settingsSection, allCanBuyTariffRow);
			}
			if (this.hasValue('collectGeoData')) {
				let collectGeoData = new ui_formElements_view.Checker(this.getValue('collectGeoData'));
				main_core_events.EventEmitter.subscribe(collectGeoData.switcher, 'toggled', () => {
					this.#geoDataSwitch(collectGeoData);
				});
				ConfigurationPage.addToSectionHelper(collectGeoData, settingsSection);
			}

			// This is hidden
			// if (this.hasValue('showSettingsAllUsers'))
			// {
			// 	let showSettingsAllUsers = new Checker({
			// 		inputName: 'showSettingsAllUsers',
			// 		title: Loc.getMessage('INTRANET_SETTINGS_FIELD_LABEL_SHOW_SETTINGS_ALL_USER'),
			// 		hintOn: Loc.getMessage('INTRANET_SETTINGS_FIELD_HINT_SHOW_SETTINGS_ALL_USER_CLICK_ON'),
			// 		checked: this.getValue('showSettingsAllUsers') === 'Y'
			// 	});
			// 	let showSettingsAllUsersRow = new Row({
			// 		content: showSettingsAllUsers.render(),
			// 		isHidden: true
			// 	});
			// 	ConfigurationPage.addToSectionHelper(showSettingsAllUsers, settingsSection, showSettingsAllUsersRow);
			// }

			return settingsSection;
		}
		#geoDataSwitch(element) {
			if (element.isChecked()) {
				BX.UI.Dialogs.MessageBox.show({
					'modal': true,
					'minWidth': 640,
					'title': main_core.Loc.getMessage('INTRANET_SETTINGS_FIELD_LABEL_COLLECT_GEO_DATA'),
					'message': main_core.Loc.getMessage('INTRANET_SETTINGS_FIELD_LABEL_COLLECT_GEO_DATA_CONFIRM'),
					'buttons': BX.UI.Dialogs.MessageBoxButtons.OK_CANCEL,
					'okCaption': main_core.Loc.getMessage('INTRANET_SETTINGS_FIELD_LABEL_COLLECT_GEO_DATA_OK'),
					'onCancel': function () {
						element.switcher.check(false);
						return true;
					},
					'onOk': function () {
						return true;
					}
				});
			}
		}
	}

	class SchedulePage extends ui_formElements_field.BaseSettingsPage {
		constructor() {
			super();
			this.titlePage = main_core.Loc.getMessage('INTRANET_SETTINGS_TITLE_PAGE_SCHEDULE');
			this.descriptionPage = main_core.Loc.getMessage('INTRANET_SETTINGS_DESCRIPTION_PAGE_SCHEDULE');
		}
		getType() {
			return 'schedule';
		}
		appendSections(contentNode) {
			const scheduleSection = this.#buildScheduleSection();
			scheduleSection.renderTo(contentNode);
			const holidaysSection = this.#buildHolidaysSection();
			holidaysSection.renderTo(contentNode);
		}
		#buildScheduleTab(parent) {
			let workTimeRow = new ui_section.Row({
				className: 'intranet-settings__work-time_container --no-padding'
			});
			let settingsRow = new ui_formElements_field.SettingsRow({
				row: workTimeRow,
				parent: parent
			});
			if (this.hasValue('WORK_TIME_START')) {
				const workTimeStartField = new ui_formElements_view.Selector(this.getValue('WORK_TIME_START'));
				new ui_formElements_field.SettingsRow({
					child: new ui_formElements_field.SettingsField({
						fieldView: workTimeStartField
					}),
					parent: settingsRow,
					row: new ui_section.Row({
						className: 'intranet-settings__work-time_row'
					})
				});
			}
			new ui_formElements_field.SettingsRow({
				row: new ui_section.Row({
					className: 'ui-section__field-inline-separator'
				}),
				parent: settingsRow
			});
			if (this.hasValue('WORK_TIME_END')) {
				const workTimeEndField = new ui_formElements_view.Selector(this.getValue('WORK_TIME_END'));
				new ui_formElements_field.SettingsRow({
					child: new ui_formElements_field.SettingsField({
						fieldView: workTimeEndField
					}),
					parent: settingsRow,
					row: new ui_section.Row({
						className: 'intranet-settings__work-time_row'
					})
				});
			}
			let containerTab = main_core.Tag.render`<div><div>`;
			main_core.Dom.append(workTimeRow.render(), containerTab);
			if (this.hasValue('WEEK_DAYS')) {
				const itemPickerField = new ui_formElements_view.ItemPicker({
					inputName: this.getValue('WEEK_DAYS').inputName,
					isMulti: true,
					label: this.getValue('WEEK_DAYS').label ?? main_core.Loc.getMessage('INTRANET_SETTINGS_FIELD_LABEL_WEEKEND'),
					items: this.getValue('WEEK_DAYS').values,
					current: this.getValue('WEEK_DAYS').multiValue
				});
				let settingsField = new ui_formElements_field.SettingsField({
					fieldView: itemPickerField
				});
				const itemPickerRow = new ui_section.Row({
					content: itemPickerField.render()
				});
				new ui_formElements_field.SettingsRow({
					row: itemPickerRow,
					child: settingsField,
					parent: parent
				});
				main_core.Dom.append(itemPickerRow.render(), containerTab);
			}
			if (this.hasValue('WEEK_START')) {
				const weekStartField = new ui_formElements_view.ItemPicker(this.getValue('WEEK_START'));
				let settingsField = new ui_formElements_field.SettingsField({
					fieldView: weekStartField
				});
				main_core.Dom.addClass(weekStartField.render(), '--row-frame_gray');
				const weekStartRow = new ui_section.Row({
					content: weekStartField.render()
				});
				new ui_formElements_field.SettingsRow({
					row: weekStartRow,
					child: settingsField,
					parent: parent
				});
				main_core.Dom.append(weekStartRow.render(), containerTab);
			}
			return containerTab;
		}
		#buildScheduleSection() {
			if (!this.hasValue('sectionSchedule')) {
				return;
			}
			let scheduleSection = new ui_section.Section(this.getValue('sectionSchedule'));
			const settingsSection = new ui_formElements_field.SettingsSection({
				parent: this,
				section: scheduleSection
			});
			const tabsRow = new ui_formElements_field.SettingsRow({
				parent: settingsSection
			});
			const tabsField = new ui_formElements_field.TabsField({
				parent: tabsRow
			});
			const forCompanyTab = new ui_formElements_field.TabField({
				parent: tabsField,
				tabsOptions: this.getValue('tabForCompany')
			});
			this.#buildScheduleTab(forCompanyTab);
			if (this.getValue('TIMEMAN').enabled) {
				const forDepartmentTab = new ui_formElements_field.TabField({
					parent: tabsField,
					tabsOptions: this.getValue('tabForDepartment')
				});
				const forDepartmentRow = new ui_section.Row({
					content: this.#forDepartmentsRender()
				});
				new ui_formElements_field.SettingsRow({
					row: forDepartmentRow,
					parent: forDepartmentTab
				});
			}
			tabsField.activateTab(forCompanyTab);
			//endregion

			return settingsSection;
		}
		#buildHolidaysSection() {
			if (!this.hasValue('sectionHoliday')) {
				return;
			}
			let holidaysSection = new ui_section.Section(this.getValue('sectionHoliday'));
			const settingsSection = new ui_formElements_field.SettingsSection({
				parent: this,
				section: holidaysSection
			});
			const countDays = this.getValue('year_holidays')?.value?.match(/\d{1,2}.\d{1,2}/gm)?.length ?? 0;
			let countDaysNode = main_core.Tag.render`<div class="ui-section__field-label">${main_core.Loc.getMessage('INTRANET_SETTINGS_FIELD_INFO', {
			'#COUNT_DAYS#': countDays
		})}</div>`;
			const holidaysRow = new ui_section.Row({
				content: countDaysNode
			});
			holidaysSection.append(holidaysRow.render());
			if (this.hasValue('year_holidays')) {
				const holidaysField = new ui_formElements_view.TextInput(this.getValue('year_holidays'));
				SchedulePage.addToSectionHelper(holidaysField, settingsSection);
				main_core.Event.bind(holidaysField.getInputNode(), 'keyup', () => {
					const count = holidaysField?.getInputNode().value?.match(/\d{1,2}.\d{1,2}/gm)?.length ?? 0;
					countDaysNode.innerHTML = main_core.Loc.getMessage('INTRANET_SETTINGS_FIELD_INFO', {
						'#COUNT_DAYS#': count
					});
				});
			}
			return settingsSection;
		}
		#forDepartmentsRender() {
			return main_core.Tag.render`
			<div class="intranet-settings__tab-info_container">
				<div class="intranet-settings__tab-info_text">${main_core.Loc.getMessage('INTRANET_SETTINGS_DESCRIPTION_FOR_DEPARTMENTS')}</div>
				<a href="/timeman/schedules/" class="ui-section__link" target="_blank">${main_core.Loc.getMessage('INTRANET_SETTINGS_DESCRIPTION_FOR_DEPARTMENTS_CONFIG')}</a>
			</div>
		`;
		}
	}

	class GdprPage extends ui_formElements_field.BaseSettingsPage {
		constructor() {
			super();
			this.titlePage = main_core.Loc.getMessage('INTRANET_SETTINGS_TITLE_PAGE_GDPR');
			this.descriptionPage = main_core.Loc.getMessage('INTRANET_SETTINGS_DESCRIPTION_PAGE_GDPR');
		}
		getType() {
			return 'gdpr';
		}
		appendSections(contentNode) {
			let gdprSection = this.#buildGdprSection();
			gdprSection?.renderTo(contentNode);
		}
		#buildGdprSection() {
			if (!this.hasValue('sectionGdpr')) {
				return;
			}
			let gdprSection = new ui_section.Section(this.getValue('sectionGdpr'));
			let sectionSettings = new ui_formElements_field.SettingsSection({
				section: gdprSection,
				parent: this
			});
			const description = new BX.UI.Alert({
				text: `
				${main_core.Loc.getMessage('INTRANET_SETTINGS_SECTION_GDPR_DESCRIPTION')}
				<a class="ui-section__link" onclick="top.BX.Helper.show('redirect=detail&code=7608199')">
					${main_core.Loc.getMessage('INTRANET_SETTINGS_CANCEL_MORE')}
				</a>
				</br>
				<a class="ui-section__link" href="${this.getValue('dpaLink')}" target="_blank">
					${main_core.Loc.getMessage('INTRANET_SETTINGS_BUTTON_GDPR_AGREEMENT')}
				</a>
			`,
				inline: true,
				size: BX.UI.Alert.Size.SMALL,
				color: BX.UI.Alert.Color.PRIMARY,
				animated: true
			});
			const descriptionRow = new ui_section.Row({
				content: description.getContainer()
			});
			new ui_formElements_field.SettingsRow({
				row: descriptionRow,
				parent: sectionSettings
			});
			if (this.hasValue('companyTitle')) {
				const titleField = new ui_formElements_view.TextInput({
					inputName: 'companyTitle',
					label: this.getValue('companyTitle').label ?? main_core.Loc.getMessage('INTRANET_SETTINGS_FIELD_LABEL_COMPANY_TITLE'),
					value: this.getValue('companyTitle').value,
					placeholder: main_core.Loc.getMessage('INTRANET_SETTINGS_FIELD_PLACEHOLDER_COMPANY_TITLE')
				});
				let settingsField = new ui_formElements_field.SettingsField({
					fieldView: titleField
				});
				new ui_formElements_field.SettingsRow({
					parent: sectionSettings,
					child: settingsField
				});
			}
			if (this.hasValue('contactName')) {
				const contactNameField = new ui_formElements_view.TextInput({
					inputName: 'contactName',
					label: this.getValue('contactName').label ?? main_core.Loc.getMessage('INTRANET_SETTINGS_FIELD_LABEL_CONTACT_NAME'),
					value: this.getValue('contactName').value,
					placeholder: main_core.Loc.getMessage('INTRANET_SETTINGS_FIELD_PLACEHOLDER_CONTACT_NAME')
				});
				let settingsField = new ui_formElements_field.SettingsField({
					fieldView: contactNameField
				});
				new ui_formElements_field.SettingsRow({
					parent: sectionSettings,
					child: settingsField
				});
			}
			if (this.hasValue('notificationEmail')) {
				const emailField = new ui_formElements_view.TextInput({
					inputName: 'notificationEmail',
					label: this.getValue('notificationEmail').label ?? main_core.Loc.getMessage('INTRANET_SETTINGS_FIELD_LABEL_NOTIFICATION_EMAIL'),
					value: this.getValue('notificationEmail').value,
					placeholder: main_core.Loc.getMessage('INTRANET_SETTINGS_FIELD_PLACEHOLDER_NOTIFICATION_EMAIL')
				});
				let settingsField = new ui_formElements_field.SettingsField({
					fieldView: emailField
				});
				new ui_formElements_field.SettingsRow({
					parent: sectionSettings,
					child: settingsField
				});
			}
			if (this.hasValue('date')) {
				const dateField = new ui_formElements_view.TextInput({
					inputName: 'date',
					label: this.getValue('date').label ?? main_core.Loc.getMessage('INTRANET_SETTINGS_FIELD_LABEL_DATE'),
					value: this.getValue('date').value
				});
				main_core.Dom.adjust(dateField.render(), {
					events: {
						click: event => {
							BX.calendar({
								node: event.target,
								field: 'date',
								form: '',
								bTime: false,
								bHideTime: true
							});
						}
					}
				});
				let settingsField = new ui_formElements_field.SettingsField({
					fieldView: dateField
				});
				new ui_formElements_field.SettingsRow({
					parent: sectionSettings,
					child: settingsField
				});
			}
			new ui_formElements_field.SettingsRow({
				row: new ui_section.Row({
					content: this.addApplicationsRender()
				}),
				parent: sectionSettings
			});
			return sectionSettings;
		}
		addApplicationsRender() {
			if (this.hasValue('marketDirectory')) {
				const marketDirectory = this.getValue('marketDirectory');
				return main_core.Tag.render`
				<div class="ui-text-right">
					<a class="ui-section__link" href="${marketDirectory}detail/integrations24.gdprstaff/">
						${main_core.Loc.getMessage('INTRANET_SETTINGS_BUTTON_GDPR_APPLICATION_EMPLOYEE')}
					</a>
					<a class="ui-section__link" style="margin-left: 12px;" href="${marketDirectory}detail/integrations24.gdpr/">
						${main_core.Loc.getMessage('INTRANET_SETTINGS_BUTTON_GDPR_APPLICATION_CRM')}
					</a>
				</div>
			`;
			}
			return null;
		}
	}

	class SecurityPage extends ui_formElements_field.BaseSettingsPage {
		#otpChecker;
		#otpSelector;
		#otpPopup;
		constructor() {
			super();
			this.titlePage = main_core.Loc.getMessage('INTRANET_SETTINGS_TITLE_PAGE_SECURITY');
			this.descriptionPage = main_core.Loc.getMessage('INTRANET_SETTINGS_DESCRIPTION_PAGE_SECURITY_MSGVER_2');
		}
		getType() {
			return 'security';
		}
		appendSections(contentNode) {
			const isBitrix24 = this.hasValue('IS_BITRIX_24') && this.getValue('IS_BITRIX_24');
			if (this.hasValue('SECURITY_OTP_ENABLED') && this.getValue('SECURITY_OTP_ENABLED')) {
				this.#buildOTPSection()?.renderTo(contentNode);
			}
			this.#buildDataLeakProtectionSection()?.renderTo(contentNode);
			this.#buildRestIntegrationSection()?.renderTo(contentNode);

			// if (isBitrix24)
			// {
			// 	this.#buildPasswordRecoverySection().renderTo(contentNode);
			// }
			this.#buildDevicesHistorySection()?.renderTo(contentNode);
			this.#buildEventLogSection()?.renderTo(contentNode);
			if (isBitrix24) {
				this.#buildAccessIPSection()?.renderTo(contentNode);
				this.#buildBlackListSection()?.renderTo(contentNode);
			}
		}
		#buildOTPSection() {
			if (!this.hasValue('sectionOtp')) {
				return;
			}
			const otpSection = new ui_section.Section(this.getValue('sectionOtp'));
			const section = new ui_formElements_field.SettingsSection({
				section: otpSection,
				parent: this
			});
			const descriptionRow = new ui_section.Row({
				content: this.#getOTPDescription().getContainer()
			});
			new ui_formElements_field.SettingsRow({
				row: descriptionRow,
				parent: section
			});
			if (this.hasValue('SECURITY_OTP')) {
				const securityOtpCheckerRow = new ui_section.Row({
					content: this.#getOTPChecker().render(),
					separator: this.#getOTPChecker().isChecked() ? '' : 'bottom',
					className: this.#getOTPChecker().isChecked() ? '' : '--block'
				});
				new ui_formElements_field.SettingsRow({
					row: securityOtpCheckerRow,
					parent: section
				});
				const securityOtpPeriodSelectorRow = new ui_section.Row({
					content: this.#getOTPPeriodSelector().render(),
					isHidden: !this.#getOTPChecker().isChecked()
				});
				new ui_formElements_field.SettingsRow({
					row: securityOtpPeriodSelectorRow,
					parent: section
				});
				let securityOtpMessageChatCheckerRow = null;
				if (this.hasValue('SEND_OTP_PUSH')) {
					const switcherWrapper = main_core.Tag.render`
					<div class="settings-switcher-wrapper">
						<div class="settings-security-message-switcher"/>
					</div>
				`;
					new ui_formElements_view.SingleChecker({
						switcher: new ui_switcher.Switcher({
							node: switcherWrapper.querySelector('.settings-security-message-switcher'),
							inputName: 'SEND_OTP_PUSH',
							checked: this.getValue('SEND_OTP_PUSH'),
							size: ui_switcher.SwitcherSize.small
						})
					});
					securityOtpMessageChatCheckerRow = new ui_section.Row({
						content: switcherWrapper,
						isHidden: this.#isPushOtpProvider() || !this.#getOTPChecker().isChecked()
					});
					switcherWrapper.append(main_core.Tag.render`<span class="settings-switcher-title">${main_core.Loc.getMessage('INTRANET_SETTINGS_FIELD_LABEL_OTP_SWITCHING_MESSAGE_CHAT')}</span>`);
					new ui_formElements_field.SettingsRow({
						row: securityOtpMessageChatCheckerRow,
						parent: section
					});
				}
				if (this.hasValue('SECURITY_OTP_NEED_PUSH_OTP_BANNER') && this.getValue('SECURITY_OTP_NEED_PUSH_OTP_BANNER')) {
					const newOtpBanner = new intranet_notifyBanner_pushOtp.PushOtp({
						title: main_core.Loc.getMessage('INTRANET_SETTINGS_SECURITY_PUSH_OTP_BANNER_TITLE'),
						text: main_core.Loc.getMessage('INTRANET_SETTINGS_SECURITY_PUSH_OTP_BANNER_TEXT'),
						clickEnableBtn: () => {
							if (!this.getValue('SECURITY_IS_USER_OTP_ACTIVE')) {
								const messageBox = ui_dialogs_messagebox.MessageBox.create({
									message: main_core.Loc.getMessage('INTRANET_SETTINGS_POPUP_OTP_ENABLE_MSGVER_1'),
									modal: true,
									useAirDesign: true,
									popupOptions: {
										closeByEsc: true,
										autoHide: true
									},
									buttons: [new ui_buttons.Button({
										text: main_core.Loc.getMessage('INTRANET_SETTINGS_POPUP_OTP_ENABLE_BUTTON_MSGVER_1'),
										style: ui_buttons.AirButtonStyle.FILLED,
										useAirDesign: true,
										events: {
											click: () => {
												messageBox.close();
												BX.SidePanel.Instance.open(this.getValue('SECURITY_OTP_PATH'));
											}
										}
									}), new ui_buttons.CloseButton({
										useAirDesign: true,
										style: ui_buttons.AirButtonStyle.PLAIN_NO_ACCENT,
										onclick: () => {
											messageBox.close();
										}
									})]
								});
								messageBox.show();
								return;
							}
							this.getAnalytic()?.addEventEnablePushOtp();
							main_core.ajax.runAction('intranet.v2.Otp.activePushOtp').then(() => {
								this.reload();
								this.#otpChecker = null;
							}, response => {
								if (response.status === 'error') {
									ui_formElements_field.ErrorCollection.showSystemError(response.errors[0].message);
								}
							});
						}
					}).render();
					const securityOtpBannerNewOtpRow = new ui_section.Row({
						content: newOtpBanner
					});
					new ui_formElements_field.SettingsRow({
						row: securityOtpBannerNewOtpRow,
						parent: section
					});
				}
				main_core_events.EventEmitter.subscribe(this.#getOTPChecker().switcher, 'toggled', () => {
					if (this.getValue('SECURITY_IS_USER_OTP_ACTIVE') !== true && this.#getOTPChecker().isChecked()) {
						this.#getOTPPopup().show();
						this.#getOTPChecker().cancel();
						this.#getOTPChecker().switcher.check(false);
						return;
					}
					if (this.hasValue('SECURITY_OTP_ENABLED') && this.getValue('SECURITY_OTP_ENABLED')) {
						this.getAnalytic()?.addEventToggle2fa(this.#getOTPChecker().isChecked());
					}
					if (this.#getOTPChecker().isChecked()) {
						main_core.Dom.removeClass(securityOtpCheckerRow.render(), '--bottom-separator --block');
						securityOtpPeriodSelectorRow.show();
						securityOtpMessageChatCheckerRow?.show();
					} else {
						main_core.Dom.addClass(securityOtpCheckerRow.render(), '--bottom-separator --block');
						securityOtpPeriodSelectorRow.hide();
						securityOtpMessageChatCheckerRow?.hide();
					}
				});
			}
			return section;
		}
		#getOTPChecker() {
			if (this.#otpChecker instanceof ui_formElements_view.Checker) {
				return this.#otpChecker;
			}
			if (this.hasValue('fieldSecurityOtp')) {
				this.#otpChecker = new ui_formElements_view.Checker({
					inputName: this.getValue('fieldSecurityOtp').inputName,
					checked: this.getValue('fieldSecurityOtp').checked,
					title: this.getValue('fieldSecurityOtp').title,
					isEnable: this.getValue('fieldSecurityOtp').isEnable,
					hideSeparator: true,
					alignCenter: true,
					noMarginBottom: true
				});
			}
			this.#otpChecker.renderLockElement = () => {
				return null;
			};
			return this.#otpChecker;
		}
		#getOTPPopup() {
			if (this.#otpPopup instanceof ui_dialogs_messagebox.MessageBox) {
				return this.#otpPopup;
			}
			this.#otpPopup = ui_dialogs_messagebox.MessageBox.create({
				popupOptions: {
					bindElement: this.#otpChecker.getInputNode(),
					closeByEsc: true,
					autoHide: true,
					overlay: false,
					angle: {
						offset: 200 - 15
					},
					offsetLeft: this.#otpChecker.getInputNode().offsetWidth - 200 + 15
				},
				message: main_core.Loc.getMessage('INTRANET_SETTINGS_POPUP_OTP_ENABLE_MSGVER_1'),
				modal: true,
				useAirDesign: true,
				buttons: [new ui_buttons.Button({
					text: main_core.Loc.getMessage('INTRANET_SETTINGS_POPUP_OTP_ENABLE_BUTTON_MSGVER_1'),
					style: ui_buttons.AirButtonStyle.FILLED,
					useAirDesign: true,
					events: {
						click: () => {
							this.#getOTPPopup().close();
							BX.SidePanel.Instance.open(this.getValue('SECURITY_OTP_PATH'));
						}
					}
				}), new ui_buttons.CloseButton({
					useAirDesign: true,
					style: ui_buttons.AirButtonStyle.PLAIN_NO_ACCENT,
					onclick: () => {
						this.#otpPopup.close();
					}
				})]
			});
			return this.#otpPopup;
		}
		#getOTPPeriodSelector() {
			if (this.#otpSelector instanceof ui_formElements_view.Selector) {
				return this.#otpSelector;
			}
			this.#otpSelector = new ui_formElements_view.Selector({
				label: main_core.Loc.getMessage('INTRANET_SETTINGS_FIELD_LABEL_OTP_SWITCHING_PERIOD_MSGVER_1'),
				name: 'SECURITY_OTP_DAYS',
				items: this.getValue('SECURITY_OTP_DAYS').ITEMS,
				current: this.getValue('SECURITY_OTP_DAYS').CURRENT
			});
			return this.#otpSelector;
		}
		#getOTPDescription() {
			return new BX.UI.Alert({
				text: this.#isPushOtpProvider() ? this.#getPushOTPDescriptionText() : this.#getOldOTPDescriptionText(),
				inline: true,
				size: BX.UI.Alert.Size.SMALL,
				color: BX.UI.Alert.Color.PRIMARY,
				animated: true
			});
		}
		#getPushOTPDescriptionText() {
			if (this.#isHighPromoteModePushOtp()) {
				return `
				${main_core.Loc.getMessage('INTRANET_SETTINGS_SECTION_SECURITY_DESCRIPTION_PUSH_OTP_HIGH_MODE', {
				'[HELP_LINK]': '<a class="ui-section__link" target="_blank" href="/settings/support.php">',
				'[/HELP_LINK]': '</a>',
				'[BR]': '</br></br>'
			})}
				</br></br>
				<span class="settings-section-description-focus-text --security-info">
					<a class="ui-section__link" onclick="top.BX.Helper.show('redirect=detail&code=17728602')">
						${main_core.Loc.getMessage('INTRANET_SETTINGS_CANCEL_MORE')}
					</a>
				</span>
			`;
			}
			return `
			${main_core.Loc.getMessage('INTRANET_SETTINGS_SECTION_SECURITY_DESCRIPTION_PUSH_OTP', {
			'[BR]': '</br></br>'
		})}
			</br></br>
			<span class="settings-section-description-focus-text --security-info">
				${main_core.Loc.getMessage('INTRANET_SETTINGS_SECTION_SECURITY_DESCRIPTION_PUSH_OTP_WARNING', {
			'[SPAN]': '<span>',
			'[/SPAN]': '</span>'
		})}
				</br></br>
				<a class="ui-section__link" onclick="top.BX.Helper.show('redirect=detail&code=17728602')">
					${main_core.Loc.getMessage('INTRANET_SETTINGS_CANCEL_MORE')}
				</a>
			</span>
		`;
		}
		#isPushOtpProvider() {
			return this.hasValue('SECURITY_PUSH_OTP_PROVIDER_DEFAULT') && this.getValue('SECURITY_PUSH_OTP_PROVIDER_DEFAULT');
		}
		#isHighPromoteModePushOtp() {
			return this.#isPushOtpProvider() && this.hasValue('SECURITY_PUSH_OTP_PROVIDE_HIGH') && this.getValue('SECURITY_PUSH_OTP_PROVIDE_HIGH');
		}
		#getOldOTPDescriptionText() {
			return `
			${main_core.Loc.getMessage('INTRANET_SETTINGS_SECTION_SECURITY_DESCRIPTION_FIRST')}
			</br></br>
			<span class="settings-section-description-focus-text --security-info">
				${main_core.Loc.getMessage('INTRANET_SETTINGS_SECTION_SECURITY_DESCRIPTION_SECOND')}
				<a class="ui-section__link" onclick="top.BX.Helper.show('redirect=detail&code=17728602')">
					${main_core.Loc.getMessage('INTRANET_SETTINGS_CANCEL_MORE')}
				</a>
			</span>
		`;
		}
		#buildRestIntegrationSection() {
			if (!this.hasValue('sectionRestIntegration')) {
				return;
			}
			const restSection = new ui_section.Section(this.getValue('sectionRestIntegration'));
			const settingsSection = new ui_formElements_field.SettingsSection({
				section: restSection,
				parent: this
			});
			if (this.hasValue('selectorIncomingWebhookCreateOwn')) {
				const webhookCreateOwnSelector = ui_formElements_view.FieldFactory.createUserSelector({
					...this.getValue('selectorIncomingWebhookCreateOwn'),
					enableDepartments: true
				});
				SecurityPage.addToSectionHelper(webhookCreateOwnSelector, settingsSection);
			}
			if (this.hasValue('selectorLocalAppCreate')) {
				const localAppCreateSelector = ui_formElements_view.FieldFactory.createUserSelector({
					...this.getValue('selectorLocalAppCreate'),
					enableDepartments: true
				});
				SecurityPage.addToSectionHelper(localAppCreateSelector, settingsSection);
			}
			if (this.hasValue('selectorPersonalAppCreate')) {
				const personalAppCreateSelector = ui_formElements_view.FieldFactory.createUserSelector({
					...this.getValue('selectorPersonalAppCreate'),
					enableDepartments: true
				});
				SecurityPage.addToSectionHelper(personalAppCreateSelector, settingsSection);
			}
			return settingsSection;
		}
		#buildAccessIPSection() {
			if (!this.hasValue('sectionAccessIp')) {
				return;
			}
			const accessIpSection = new ui_section.Section(this.getValue('sectionAccessIp'));
			const section = new ui_formElements_field.SettingsSection({
				section: accessIpSection,
				parent: this
			});
			const descriptionRow = new ui_section.Row({
				content: this.#getIpAccessDescription().getContainer()
			});
			new ui_formElements_field.SettingsRow({
				row: descriptionRow,
				parent: section
			});
			let fieldsCount = 0;
			if (this.hasValue('IP_ACCESS_RIGHTS')) {
				for (const ipUsersList of this.getValue('IP_ACCESS_RIGHTS')) {
					fieldsCount++;
					new ui_formElements_field.SettingsRow({
						parent: section,
						child: this.#getUserSelectorRow(ipUsersList)
					});
					new ui_formElements_field.SettingsRow({
						parent: section,
						child: this.#getAccessIpRow(ipUsersList)
					});
				}
			}
			if (fieldsCount === 0) {
				fieldsCount++;
				new ui_formElements_field.SettingsRow({
					parent: section,
					child: this.#getEmptyUserSelectorRow(fieldsCount)
				});
				new ui_formElements_field.SettingsRow({
					parent: section,
					child: this.#getEmptyAccessIpRow(fieldsCount)
				});
			}
			const onclickAddField = () => {
				if (this.getValue('IP_ACCESS_RIGHTS_ENABLED')) {
					fieldsCount++;
					const emptyUserSelectorRow = new ui_section.Row({
						content: this.#getEmptyUserSelectorRow(fieldsCount).render()
					});
					main_core.Dom.insertBefore(emptyUserSelectorRow.render(), additionalUsersAccessIpButton.parentElement);
					const emptyAccessIpRow = new ui_section.Row({
						content: this.#getEmptyAccessIpRow(fieldsCount).render()
					});
					main_core.Dom.insertBefore(emptyAccessIpRow.render(), additionalUsersAccessIpButton.parentElement);
				} else {
					BX.UI.InfoHelper.show('limit_admin_ip');
				}
			};
			const additionalUsersAccessIpButton = main_core.Tag.render`
			<div class="ui-text-right">
				<a class="ui-section__link" href="javascript:void(0)" onclick="${onclickAddField}">
					${main_core.Loc.getMessage('INTRANET_SETTINGS_ADDITIONAL_USER_ACCESS_IP')}
				</a>
			</div>
		`;
			new ui_formElements_field.SettingsRow({
				row: new ui_section.Row({
					content: additionalUsersAccessIpButton
				}),
				parent: section
			});
			return section;
		}
		#decodeIpAccessUserSelectorValue(value) {
			if (value === 'AU' || value === 'UA') {
				return {
					type: 'AU',
					id: ''
				};
			}
			const arr = value.match(/^(U|DR|D)(\d+)/);
			if (!main_core.Type.isArray(arr)) {
				return {
					type: null,
					id: null
				};
			}
			return {
				type: arr[1],
				id: arr[2]
			};
		}
		#createIpAccessUserSelector(params) {
			return new ui_formElements_view.UserSelector({
				enableDepartments: true,
				encodeValue: value => {
					if (!main_core.Type.isNil(value.id)) {
						return value.id === 'all-users' ? 'AU' : value.type + value.id.toString().split(':')[0];
					}
					return null;
				},
				decodeValue: this.#decodeIpAccessUserSelectorValue,
				...params
			});
		}
		#getEmptyUserSelectorRow(fieldNumber) {
			const userSelector = this.#createIpAccessUserSelector({
				inputName: `SECURITY_IP_ACCESS_${fieldNumber}_USERS[]`,
				label: main_core.Loc.getMessage('INTRANET_SETTINGS_FIELD_LABEL_SELECT_USER_ACCESS_IP'),
				isEnable: this.getValue('IP_ACCESS_RIGHTS_ENABLED'),
				helpMessageProvider: this.helpMessageProviderFactory(main_core.Loc.getMessage('INTRANET_SETTINGS_FIELD_HELP_MESSAGE_PRO'))
			});
			return new ui_formElements_field.SettingsField({
				fieldView: userSelector
			});
		}
		#getEmptyAccessIpRow(fieldNumber) {
			const inputName = `SECURITY_IP_ACCESS_${fieldNumber}_IP`;
			const accessIp = new ui_formElements_view.TextInput({
				inputName,
				label: this.getValue('IP_ACCESS_RIGHTS_ENABLED_LABEL') ?? main_core.Loc.getMessage('INTRANET_SETTINGS_FIELD_LABEL_SELECT_ACCEPTED_IP'),
				isEnable: this.getValue('IP_ACCESS_RIGHTS_ENABLED'),
				helpMessageProvider: this.helpMessageProviderFactory(main_core.Loc.getMessage('INTRANET_SETTINGS_FIELD_HELP_MESSAGE_PRO'))
			});
			return new ui_formElements_field.SettingsField({
				fieldView: accessIp
			});
		}
		#getUserSelectorRow(ipUsersList) {
			const userSelector = this.#createIpAccessUserSelector({
				inputName: `SECURITY_IP_ACCESS_${ipUsersList.fieldNumber}_USERS[]`,
				label: this.getValue('IP_ACCESS_RIGHTS_ENABLED_LABEL') ?? main_core.Loc.getMessage('INTRANET_SETTINGS_FIELD_LABEL_SELECT_USER_ACCESS_IP'),
				values: Object.values(ipUsersList.users)
			});
			return new ui_formElements_field.SettingsField({
				fieldView: userSelector
			});
		}
		#getAccessIpRow(ipUsersList) {
			const inputName = `SECURITY_IP_ACCESS_${ipUsersList.fieldNumber}_IP`;
			const accessIp = new ui_formElements_view.TextInput({
				inputName,
				label: main_core.Loc.getMessage('INTRANET_SETTINGS_FIELD_LABEL_SELECT_ACCEPTED_IP'),
				value: ipUsersList.ip
			});
			return new ui_formElements_field.SettingsField({
				fieldView: accessIp
			});
		}
		#getIpAccessDescription() {
			return new BX.UI.Alert({
				text: `
				${main_core.Loc.getMessage('INTRANET_SETTINGS_SECTION_SECURITY_DESCRIPTION_IP_ACCESS', {
				'#ARTICLE_CODE#': 'redirect=detail&code=17300230'
			})}
				<a class="ui-section__link" onclick="top.BX.Helper.show('redirect=detail&code=17300230')">
					${main_core.Loc.getMessage('INTRANET_SETTINGS_CANCEL_MORE')}
				</a>
			`,
				inline: true,
				size: BX.UI.Alert.Size.SMALL,
				color: BX.UI.Alert.Color.PRIMARY,
				animated: true
			});
		}
		#buildPasswordRecoverySection() {
			return new ui_section.Section({
				title: main_core.Loc.getMessage('INTRANET_SETTINGS_SECTION_TITLE_PASSWORD_RECOVERY'),
				titleIconClasses: 'ui-icon-set',
				isOpen: false,
				canCollapse: false
			});
		}
		#buildDevicesHistorySection() {
			if (!this.hasValue('sectionHistory')) {
				return;
			}
			const devicesHistorySection = new ui_section.Section(this.getValue('sectionHistory'));
			const settingsSection = new ui_formElements_field.SettingsSection({
				section: devicesHistorySection,
				parent: this
			});
			const devicesHistoryDescription = new BX.UI.Alert({
				text: `
				${main_core.Loc.getMessage('INTRANET_SETTINGS_SECTION_SECURITY_DESCRIPTION_DEVICE_HISTORY')}
				<a class="ui-section__link" onclick="top.BX.Helper.show('redirect=detail&code=16623484')">
					${main_core.Loc.getMessage('INTRANET_SETTINGS_CANCEL_MORE')}
				</a>
			`,
				inline: true,
				size: BX.UI.Alert.Size.SMALL,
				color: BX.UI.Alert.Color.PRIMARY,
				animated: true
			});
			const descriptionRow = new ui_section.Row({
				content: devicesHistoryDescription.getContainer()
			});
			new ui_formElements_field.SettingsRow({
				row: descriptionRow,
				parent: settingsSection
			});
			if (this.hasValue('DEVICE_HISTORY_SETTINGS')) {
				const messageNode = main_core.Tag.render`<span>${main_core.Loc.getMessage('INTRANET_SETTINGS_FIELD_HELP_MESSAGE_ENT', {
				'#TARIFF#': 'ent250'
			})}</span>`;
				const cleanupDaysField = new ui_formElements_view.Selector({
					label: this.getValue('DEVICE_HISTORY_SETTINGS').label,
					name: this.getValue('DEVICE_HISTORY_SETTINGS').name,
					items: this.getValue('DEVICE_HISTORY_SETTINGS').values,
					current: this.getValue('DEVICE_HISTORY_SETTINGS').current,
					isEnable: this.getValue('DEVICE_HISTORY_SETTINGS').isEnable,
					bannerCode: 'limit_office_login_history',
					helpMessageProvider: this.helpMessageProviderFactory(messageNode)
				});
				if (!this.getValue('DEVICE_HISTORY_SETTINGS').isEnable) {
					main_core.Event.bind(cleanupDaysField.getInputNode(), 'click', () => {
						this.getAnalytic()?.addEventOpenHint(this.getValue('DEVICE_HISTORY_SETTINGS').name);
					});
					main_core.Event.bind(messageNode.querySelector('a'), 'click', () => this.getAnalytic()?.addEventOpenTariffSelector(this.getValue('DEVICE_HISTORY_SETTINGS').name));
				}
				SecurityPage.addToSectionHelper(cleanupDaysField, settingsSection);
			}
			const goToUserListButton = main_core.Tag.render`
			<div class="ui-text-right">
				<a class="ui-section__link" href="/company/" target="_blank">
					${main_core.Loc.getMessage('INTRANET_SETTINGS_GO_TO_USER_LIST_LINK')}
				</a>
			</div>
		`;
			new ui_formElements_field.SettingsRow({
				row: new ui_section.Row({
					content: goToUserListButton
				}),
				parent: settingsSection
			});
			return settingsSection;
		}
		#buildEventLogSection() {
			if (!this.hasValue('sectionEventLog')) {
				return;
			}
			const eventLogSection = new ui_section.Section(this.getValue('sectionEventLog'));
			const settingsSection = new ui_formElements_field.SettingsSection({
				section: eventLogSection,
				parent: this
			});
			const eventLogDescription = new BX.UI.Alert({
				text: `
				${main_core.Loc.getMessage('INTRANET_SETTINGS_SECTION_SECURITY_DESCRIPTION_EVENT_LOG')}
				<a class="ui-section__link" onclick="top.BX.Helper.show('redirect=detail&code=17296266')">
					${main_core.Loc.getMessage('INTRANET_SETTINGS_CANCEL_MORE')}
				</a>
			`,
				inline: true,
				size: BX.UI.Alert.Size.SMALL,
				color: BX.UI.Alert.Color.PRIMARY,
				animated: true
			});
			const descriptionRow = new ui_section.Row({
				content: eventLogDescription.getContainer()
			});
			new ui_formElements_field.SettingsRow({
				row: descriptionRow,
				parent: settingsSection
			});
			const goToUserListButton = this.hasValue('EVENT_LOG') ? main_core.Tag.render`
				<div class="ui-text-right">
					<a class="ui-section__link" href="${this.getValue('EVENT_LOG')}" target="_blank">
						${main_core.Loc.getMessage('INTRANET_SETTINGS_GO_TO_EVENT_LOG_LINK')}
					</a>
				</div>
			` : main_core.Tag.render`
				<div class="ui-text-right">
					<a class="ui-section__link" href="javascript:void(0)" onclick="BX.UI.InfoHelper.show('limit_office_login_log')">
						${main_core.Loc.getMessage('INTRANET_SETTINGS_GO_TO_EVENT_LOG_LINK')}
					</a>
				</div>
			`;
			new ui_formElements_field.SettingsRow({
				row: new ui_section.Row({
					content: goToUserListButton
				}),
				parent: settingsSection
			});
			return settingsSection;
		}
		#buildBlackListSection() {
			if (!this.hasValue('sectionBlackList')) {
				return;
			}
			let params = this.getValue('sectionBlackList');
			params['singleLink'] = {
				href: '/settings/configs/mail_blacklist.php'
			};
			return new ui_section.Section(params);
		}
		#buildDataLeakProtectionSection() {
			if (!this.hasValue('sectionDataLeakProtection')) {
				return;
			}
			const mobileAppSection = new ui_section.Section(this.getValue('sectionDataLeakProtection'));
			const settingsSection = new ui_formElements_field.SettingsSection({
				section: mobileAppSection,
				parent: this
			});
			if (this.hasValue('switcherDisableScreenshot')) {
				const disableCopyScreenshotChecker = new ui_formElements_view.Checker(this.getValue('switcherDisableScreenshot'));
				const disableCopyScreenshotSelector = ui_formElements_view.FieldFactory.createUserSelector({
					...this.getValue('selectorDisableScreenshot'),
					enableDepartments: true
				});
				SecurityPage.addToSectionCheckerHelper(disableCopyScreenshotChecker, [disableCopyScreenshotSelector], settingsSection);
			}
			if (this.hasValue('switcherDisableCopy')) {
				const disableCopyCopyChecker = new ui_formElements_view.Checker(this.getValue('switcherDisableCopy'));
				const disableCopyCopySelector = ui_formElements_view.FieldFactory.createUserSelector({
					...this.getValue('selectorDisableCopy'),
					enableDepartments: true
				});
				SecurityPage.addToSectionCheckerHelper(disableCopyCopyChecker, [disableCopyCopySelector], settingsSection);
			}
			if (this.hasValue('isAutoDeleteMessagesEnabled')) {
				const allowAutoDeleteField = new ui_formElements_view.Checker(this.getValue('isAutoDeleteMessagesEnabled'));
				SecurityPage.addToSectionHelper(allowAutoDeleteField, settingsSection);
			}
			if (this.hasValue('isWaterMarksEnabled')) {
				const allowAutoDeleteField = new ui_formElements_view.Checker(this.getValue('isWaterMarksEnabled'));
				SecurityPage.addToSectionHelper(allowAutoDeleteField, settingsSection);
			}
			return settingsSection;
		}
	}

	class ExternalTemporaryPage extends ui_formElements_field.BaseSettingsPage {
		#type;
		#extensions = [];
		constructor(type, extensions) {
			super();
			this.#type = type;
			this.#extensions = extensions;
		}
		getType() {
			return this.#type;
		}
		onSuccessDataFetched(response) {
			main_core.Runtime.loadExtension(this.#extensions).then(exports => {
				let externalPage;
				let externalPageHasBeenFound = Object.values(exports).some(externalPageClassOrInstance => {
					if (main_core.Type.isObjectLike(externalPageClassOrInstance)) {
						let pageExemplar = null;
						if (externalPageClassOrInstance.prototype instanceof ui_formElements_field.BaseSettingsPage) {
							pageExemplar = new externalPageClassOrInstance();
						} else if (externalPageClassOrInstance instanceof ui_formElements_field.BaseSettingsPage) {
							pageExemplar = externalPageClassOrInstance;
						}
						if (pageExemplar instanceof ui_formElements_field.BaseSettingsPage) {
							externalPage = pageExemplar;
							return true;
						}
					}
					return false;
				});
				if (externalPageHasBeenFound === false) {
					const event = new main_core_events.BaseEvent();
					externalPageHasBeenFound = main_core_events.EventEmitter.emit(main_core_events.EventEmitter.GLOBAL_TARGET, 'BX.Intranet.Settings:onExternalPageLoaded:' + this.getType(), event).some(pageExemplar => {
						if (pageExemplar instanceof ui_formElements_field.BaseSettingsPage) {
							externalPage = pageExemplar;
							return true;
						}
						return false;
					});
				}
				if (externalPage instanceof ui_formElements_field.BaseSettingsPage) {
					this.getParentElement().registerPage(externalPage);
					externalPage.setData(response.data);
					this.getParentElement().removeChild(this);
					if (main_core.Dom.isShown(this.getPage())) {
						externalPage.getParentElement().show(externalPage.getType());
					}
				} else {
					this.onFailDataFetched('The external page was not found.');
				}
			}, this.onFailDataFetched.bind(this));
		}
	}

	class PageManager {
		#pages;
		constructor(pages) {
			this.#pages = pages;
		}
		fetchPage(page) {
			return new Promise((resolve, reject) => {
				const pageIsFound = this.#pages.some(savedPage => {
					if (page.getType() === savedPage.getType()) {
						main_core.ajax.runComponentAction('bitrix:intranet.settings', 'get', {
							mode: 'class',
							data: {
								type: page.getType()
							}
						}).then(resolve, reject);
						return true;
					}
					return false;
				});
				if (pageIsFound !== true) {
					return reject({
						error: 'The page was not found in pageManager'
					});
				}
			});
		}
		collectData() {
			const data = {};
			this.#pages.forEach(page => {
				if (page.hasData()) {
					data[page.getType()] = this.constructor.getFormData(page.getFormNode());
				}
			});
			return data;
		}
		static getFormData(formNode) {
			return BX.ajax.prepareForm(formNode).data;
		}
	}

	class DataSource {
		fetch(query) {
			return new Promise();
		}
	}

	class Searcher {
		static STATE_READY = 'ready';
		static STATE_WAIT = 'wait';
		static STATE_NOT_FOUND = 'not_found';
		#query;
		#minSymbol;
		#dataSource;
		#result;
		#state; // ready | wait;

		constructor(dataSource, minSymbol = 3) {
			if (!(dataSource instanceof DataSource)) {
				throw new Error('Unexpected type, expect: DataSource');
			}
			this.#dataSource = dataSource;
			this.#minSymbol = minSymbol;
			this.#result = [];
			this.#state = 'ready';
		}
		find(query) {
			if (query.length < this.#minSymbol) {
				return;
			}
			this.#query = query;
			this.changeState(Searcher.STATE_WAIT);
			this.#dataSource.fetch(this.#query).then(this.resolve.bind(this), this.reject.bind(this));
		}
		changeState(state) {
			if (this.#state === state) {
				return;
			}
			this.#state = state;
			main_core_events.EventEmitter.emit(main_core_events.EventEmitter.GLOBAL_TARGET, 'BX.Intranet.Settings:searchChangeState', {
				state: this.#state
			});
		}
		getMinSymbol() {
			return this.#minSymbol;
		}
		resolve(response) {
			this.#result = response.data;
			this.changeState(this.#result.length > 0 ? Searcher.STATE_READY : Searcher.STATE_NOT_FOUND);
		}
		reject(response) {
			this.#result = [];
			this.changeState(Searcher.STATE_READY);
		}
		getResult() {
			return this.#result;
		}
		getOthers() {
			return [{
				link: '/stream/',
				title: main_core.Loc.getMessage('INTRANET_SETTINGS_TITLE_TOOL_TEAMWORK')
			}, {
				link: '/tasks/config/permissions/',
				title: main_core.Loc.getMessage('INTRANET_SETTINGS_TITLE_TOOL_TASKS')
			}, {
				link: '/crm/configs/',
				title: main_core.Loc.getMessage('INTRANET_SETTINGS_TITLE_TOOL_CRM')
			}, {
				link: '/shop/documents/?inventoryManagementSource=inventory',
				title: main_core.Loc.getMessage('INTRANET_SETTINGS_TITLE_TOOL_WAREHOUSE')
			}, {
				link: '/sites/',
				title: main_core.Loc.getMessage('INTRANET_SETTINGS_TITLE_TOOL_SITES')
			}, {
				link: '/company/vis_structure.php',
				title: main_core.Loc.getMessage('INTRANET_SETTINGS_TITLE_TOOL_COMPANY')
			}];
		}
	}

	class Renderer {
		#searcher;
		#inputNode;
		#iconContainer;
		#popup;
		#timeoutId;
		#timeout;
		#nav;
		static EXTERNAL_LINK = 'EXTERNAL_LINKS';
		constructor(options) {
			this.#searcher = options.searcher;
			this.#inputNode = options.inputNode;
			this.#iconContainer = options.iconContainer;
			this.#timeout = options.timeout;
			this.#nav = new SearchNavigation();
			this.#popup = new main_popup.Popup('settings-search-popup', this.#inputNode, {
				closeByEsc: true,
				angle: false,
				overlay: false,
				width: 332,
				//470,//this.#inputNode.offsetWidth,
				offsetTop: 4,
				background: '#fff',
				contentBackground: '#fff',
				contentPadding: 0,
				autoHide: true,
				borderRadius: 6,
				autoHideHandler: event => {
					return event.target !== this.#inputNode;
				}
			});
			this.#popup.setContent(this.renderContent());
			main_core.Event.bind(this.#inputNode, 'focus', () => {
				if (!this.#popup.isShown()) {
					this.#popup.show();
				}
			});
			main_core_events.EventEmitter.subscribe('BX.Intranet.Settings:searchChangeState', event => {
				const {
					state
				} = event.data;
				this.#nav.clean();
				this.#popup.setContent(this.renderContent(state));
			});
			main_core.Event.bind(this.#iconContainer.querySelector('#intranet-settings-icon-delete'), 'click', () => {
				main_core.Dom.removeClass(this.#iconContainer, 'main-ui-show');
				this.#inputNode.value = '';
			});
			main_core.Event.bind(this.#inputNode, 'keyup', event => {
				if (event.keyCode === 37 || event.keyCode === 39) {
					return;
				}
				if (event.keyCode === 13)
					//enter
					{
						this.#nav.current().dispatchEvent(new MouseEvent('click'));
						this.#nav.unHighlightAll();
						return;
					}
				if (event.keyCode === 38)
					//up
					{
						this.#nav.prev().highlight();
						if (!main_core.Type.isNil(this.#nav.current())) {
							this.updateScroll(this.#nav.current());
						}
						return;
					}
				if (event.keyCode === 40)
					//down
					{
						this.#nav.next().highlight();
						if (!main_core.Type.isNil(this.#nav.current())) {
							this.updateScroll(this.#nav.current());
						}
						return;
					}
				if (this.getQuery().length > 0) {
					main_core.Dom.addClass(this.#iconContainer, 'main-ui-show');
				} else {
					main_core.Dom.removeClass(this.#iconContainer, 'main-ui-show');
				}
				if (!this.#popup.isShown() && this.getQuery().length > 0) {
					this.#popup.show();
				}
				this.find();
			});
		}
		updateScroll(element) {
			const rect = element.getBoundingClientRect();
			const container = this.#popup.getContentContainer().firstElementChild;
			const relTop = rect.top - container.getBoundingClientRect().top;
			const relBot = rect.bottom - container.getBoundingClientRect().bottom;
			const padding = 10;
			if (relTop < 0 && relBot <= 0)
				//invisible top
				{
					container.scrollTo(0, relTop + container.scrollTop - padding);
				} else if (relTop >= 0 && relBot > 0)
				//invisible bottom
				{
					container.scrollTo(0, relBot + container.scrollTop + padding);
				}
		}
		renderWait() {
			const loaderContainer = main_core.Tag.render`<span class="title-search-waiter-img"></span>`;
			const loader = new main_loader.Loader({
				target: loaderContainer,
				size: 20,
				mode: 'inline'
			});
			loader.show();
			return main_core.Tag.render`
			<div class="title-search-waiter">
				${loaderContainer}
				<span class="title-search-waiter-text">${main_core.Loc.getMessage('INTRANET_SETTINGS_TITLE_SEARCHING')}</span>
			</div>
		`;
		}
		find() {
			clearTimeout(this.#timeoutId);
			this.#timeoutId = setTimeout(() => {
				this.#searcher.find(this.getQuery());
			}, this.#timeout);
		}
		getQuery() {
			return BX.util.trim(this.#inputNode.value);
		}
		createLinkOption(option) {
			const link = main_core.Dom.create('a', {
				props: {
					className: 'search-title-top-item-link'
				},
				events: {
					mouseenter: event => {
						this.#nav.unHighlightAll();
						this.#nav.cursorTo(event.target);
						SearchNavigation.highlight(event.target);
					},
					mouseleave: event => {
						SearchNavigation.unHighlight(event.target);
					}
				},
				attrs: {
					title: option.title,
					href: main_core.Type.isStringFilled(option.url) ? option.url : '#',
					target: '_blank'
				},
				children: [main_core.Tag.render`<span class="search-title-top-item-text"><span>${option.title}</span></span>`]
			});
			this.#nav.add(link);
			return link;
		}
		createBtnOption(page, option) {
			const link = main_core.Dom.create('a', {
				props: {
					className: 'search-title-top-item-link'
				},
				events: {
					click: event => {
						main_core_events.EventEmitter.emit(main_core_events.EventEmitter.GLOBAL_TARGET, 'BX.Intranet.SettingsNavigation:onMove', {
							page: page,
							fieldName: option.code
						});
						this.#inputNode.blur();
						this.#popup.close();
						event.preventDefault();
					},
					mouseenter: event => {
						this.#nav.unHighlightAll();
						this.#nav.cursorTo(event.target);
						SearchNavigation.highlight(event.target);
					},
					mouseleave: event => {
						SearchNavigation.unHighlight(event.target);
					}
				},
				attrs: {
					title: option.title,
					href: "#"
				},
				children: [main_core.Tag.render`<span class="search-title-top-item-text"><span>${option.title}</span></span>`]
			});
			this.#nav.add(link);
			return main_core.Tag.render`<div class="search-title-top-item search-title-top-item-js">${link}</div>`;
		}
		renderOption(page, option) {
			let link;
			if (page === Renderer.EXTERNAL_LINK) {
				link = this.createLinkOption(option);
			} else {
				link = this.createBtnOption(page, option);
			}
			return main_core.Tag.render`<div class="search-title-top-item search-title-top-item-js">${link}</div>`;
		}
		renderGroup(group) {
			const optionsContainer = main_core.Tag.render`<div class="search-title-top-list search-title-top-list-js"></div>`;
			group.options.forEach(option => {
				main_core.Dom.append(this.renderOption(group.page, option), optionsContainer);
			});
			return main_core.Tag.render`
			<div class="search-title-top-block search-title-top-block-sonetgroups">
				<div class="search-title-top-subtitle">
					<div class="search-title-top-subtitle-text">${group.title}</div>
				</div>
				<div class="search-title-top-list-wrap">
					${optionsContainer}
				</div>
			</div>
		`;
		}
		renderContent(state = 'ready') {
			const optionsContainer = main_core.Tag.render`<div class="search-title-top-result"></div>`;
			switch (state) {
				case 'ready':
					main_core.Dom.append(this.renderSearchResult(this.#searcher.getResult()), optionsContainer);
					break;
				case 'wait':
					main_core.Dom.append(this.renderWait(), optionsContainer);
					break;
				case 'not_found':
					main_core.Dom.append(this.renderNotFound(), optionsContainer);
					break;
			}
			main_core.Dom.append(this.renderOthers(this.#searcher.getOthers()), optionsContainer);
			return optionsContainer;
		}
		renderNotFound() {
			return main_core.Tag.render`
			<div class="title-search-waiter">
				<span class="title-search-waiter-text">${main_core.Loc.getMessage('INTRANET_SETTINGS_SEARCH_NOT_FOUND')}</span>
			</div>
		`;
		}
		renderSearchResult(result) {
			const container = main_core.Tag.render`<div class="search-title-content-result"></div>`;
			result.forEach(item => {
				main_core.Dom.append(this.renderGroup(item), container);
			});
			return container;
		}
		renderOthers(links) {
			const wraper = main_core.Tag.render`<div class="search-title-top-list search-title-top-list-js"></div>`;
			const other = main_core.Tag.render`
		<div class="search-title-top-block search-title-top-block-tools">
			<div class="search-title-top-subtitle">
				<div class="search-title-top-subtitle-text">${main_core.Loc.getMessage('INTRANET_SETTINGS_TITLE_SEARCH_IN')}</div>
			</div>
			<div class="search-title-top-list-height-wrap">
					<div class="search-title-top-list-wrap">${wraper}</div>
				</div>
		</div>
		`;
			links.forEach(link => {
				main_core.Dom.append(this.renderOtherLink(link), wraper);
			});
			return other;
		}
		renderOtherLink(link) {
			const linkTag = main_core.Dom.create('a', {
				props: {
					className: 'search-title-top-item-link'
				},
				events: {
					mouseenter: event => {
						this.#nav.unHighlightAll();
						this.#nav.cursorTo(event.target);
						SearchNavigation.highlight(event.target);
					},
					mouseleave: event => {
						SearchNavigation.unHighlight(event.target);
					}
				},
				attrs: {
					title: link.title,
					href: link.link,
					target: 'blank_'
				},
				children: [main_core.Tag.render`<span class="search-title-top-item-text"><span>${link.title}</span></span>`]
			});
			this.#nav.add(linkTag);
			return main_core.Tag.render`
		<div class="search-title-top-item search-title-top-item-js">
			${linkTag}
		</div>`;
		}
	}
	class SearchNavigation {
		#index = null;
		#elementList;
		constructor(nodeList = []) {
			this.#elementList = nodeList;
		}
		add(element) {
			this.#elementList.push(element);
		}
		clean() {
			this.#index = null;
			this.#elementList = [];
		}
		next() {
			if (main_core.Type.isNil(this.#index)) {
				this.#index = 0;
				return this;
			}
			if (this.#elementList.length - 1 > this.#index) {
				this.#index++;
			}
			return this;
		}
		current() {
			if (main_core.Type.isNil(this.#index)) {
				return null;
			}
			return this.#elementList[this.#index];
		}
		prev() {
			if (main_core.Type.isNil(this.#index)) {
				this.#index = this.#elementList.length - 1;
				return this;
			}
			if (this.#index > 0) {
				this.#index -= 1;
			}
			return this;
		}
		highlight() {
			this.unHighlightAll();
			if (!main_core.Dom.hasClass(this.current(), 'active')) {
				main_core.Dom.addClass(this.current(), 'active');
			}
			return this;
		}
		unHighlight() {
			if (main_core.Dom.hasClass(this.current(), 'active')) {
				main_core.Dom.removeClass(this.current(), 'active');
			}
			return this;
		}
		static highlight(element) {
			element.classList.add('active');
		}
		static unHighlight(element) {
			element.classList.remove('active');
		}
		cursorTo(element) {
			this.#elementList.forEach((item, index) => {
				if (item === element) {
					this.#index = index;
					return;
				}
			});
		}
		unHighlightAll() {
			this.#elementList.forEach(item => {
				SearchNavigation.unHighlight(item);
			});
		}
	}

	class ServerDataSource extends DataSource {
		constructor() {
			super();
		}
		fetch(query) {
			return main_core.ajax.runComponentAction('bitrix:intranet.settings', 'search', {
				mode: 'class',
				data: {
					query: query
				}
			});
		}
	}

	class Permission {
		static READ = 1 << 0;
		static EDIT = 1 << 2;
		#permission;
		constructor(permission = 0) {
			this.#permission = permission;
		}
		canRead() {
			return !!(this.#permission & Permission.READ);
		}
		canEdit() {
			return !!(this.#permission & Permission.EDIT);
		}
		getPermission() {
			return this.#permission;
		}
	}

	class Settings extends ui_formElements_field.BaseSettingsElement {
		#basePage;
		isChanged = false;
		#menuNode;
		#settingsNode;
		#contentNode;
		#pageManager;
		#cancelMessageBox;
		#analytic;
		#navigator;
		#permission;
		#pagesPermission;
		#extraSettings = {
			reloadAfterClose: false
		};
		constructor(params) {
			super(params);
			this.#analytic = new Analytic({
				isAdmin: true,
				locationName: 'settings',
				isBitrix24: params.isBitrix24 === true,
				analyticContext: main_core.Type.isStringFilled(params.analyticContext) ? params.analyticContext : null
			});
			this.#analytic.addEventOpenSettings();
			this.#analytic.addEventStartPagePage(params.startPage);
			this.setEventNamespace('BX.Intranet.Settings');
			main_core_events.EventEmitter.subscribe(main_core_events.EventEmitter.GLOBAL_TARGET, 'button-click', event => {
				const [clickedBtn] = event.data;
				if (clickedBtn.TYPE === 'save') {
					this.#onClickSaveBtn(event);
				}
			});
			main_core_events.EventEmitter.subscribe(main_core_events.EventEmitter.GLOBAL_TARGET, 'SidePanel.Slider:onClose', this.#onSliderCloseHandler.bind(this));
			this.#menuNode = main_core.Type.isDomNode(params.menuNode) ? params.menuNode : null;
			this.#settingsNode = main_core.Type.isDomNode(params.settingsNode) ? params.settingsNode : null;
			this.#contentNode = main_core.Type.isDomNode(params.contentNode) ? params.contentNode : null;
			this.#basePage = main_core.Type.isString(params.basePage) ? params.basePage : '';
			this.#permission = params.permission instanceof Permission ? params.permission : new Permission();
			this.#pagesPermission = params.pagesPermission;
			if (this.#settingsNode) {
				this.#settingsNode.querySelector('.ui-button-panel input[name="cancel"]').addEventListener('click', this.#onClickCancelBtn);
			}
			params.pages.concat(Object.values(params.externalPages).map(({
				type,
				extensions
			}) => new ExternalTemporaryPage(type, extensions))).forEach(page => this.registerPage(page).expandPage(params.subPages[page.getType()]));
			const toolsMenuItem = BX.UI.DropdownMenuItem.getItemByNode(this.#menuNode.querySelector('[data-type="tools"]'));
			if (toolsMenuItem.subItems && toolsMenuItem.subItems.length > 0) {
				toolsMenuItem.hideSubmenu();
				toolsMenuItem.setDefaultToggleButtonName();
			}
			this.#navigator = new Navigation(this);
			if (this.#menuNode) {
				this.#menuNode.querySelectorAll('li.ui-sidepanel-menu-item a.ui-sidepanel-menu-link').forEach(item => {
					const helpPopup = new ui_section.HelpMessage(item.dataset.type + '_help-msg', item, main_core.Loc.getMessage('INTRANET_SETTINGS_PERMISSION_MSG'));
					helpPopup.getPopup().setWidth(275);
					const page = this.getNavigator().getPageByType(item.dataset.type);
					item.addEventListener('click', event => {
						if (page?.getPermission()?.canRead()) {
							this.show(item.dataset.type);
						} else {
							helpPopup.show();
						}
					});
				});
			}
		}
		registerPage(page) {
			page.setParentElement(this);
			page.setPermission(new Permission(this.#pagesPermission[page.getType()] ?? null));
			page.subscribe('change', this.#onEventChangeData.bind(this)).subscribe('fetch', this.#onEventFetchPage.bind(this));
			page.setAnalytic(this.#analytic);
			return page;
		}
		getCurrentPage() {
			return this.getNavigator().getCurrentPage();
		}
		getNavigator() {
			return this.#navigator;
		}
		show(type, option) {
			if (!main_core.Type.isDomNode(this.#contentNode)) {
				console.log('Not found settings container');
				return;
			}
			if (!this.#permission.canRead()) {
				return;
			}
			const nextPage = this.getNavigator().getPageByType(type);
			if (this.getCurrentPage() === nextPage) {
				return;
			}
			this.getNavigator().changePage(nextPage);
			main_core.Dom.hide(this.getNavigator().getPrevPage()?.getPage());
			if (main_core.Type.isNil(this.getNavigator().getCurrentPage().getPage().parentNode)) {
				main_core.Dom.append(this.getNavigator().getCurrentPage().getPage(), this.#contentNode);
			} else {
				main_core.Dom.show(this.getNavigator().getCurrentPage().getPage());
			}
			this.activateMenuItem(type);
			this.#analytic.addEventChangePage(type);
			this.getNavigator().updateAddressBar();
			main_core_events.EventEmitter.emit(main_core_events.EventEmitter.GLOBAL_TARGET, 'BX.Intranet.Settings:onAfterShowPage', {
				source: this,
				page: nextPage
			});
			if (main_core.Type.isString(option) && option !== '') {
				main_core_events.EventEmitter.subscribeOnce(main_core_events.EventEmitter.GLOBAL_TARGET, 'BX.Intranet.Settings:onPageComplete', () => {
					console.log(option);
					this.getNavigator().moveTo(nextPage, option);
				});
			}
		}
		activateMenuItem(type) {
			const menuItem = BX.UI.DropdownMenuItem.getItemByNode(this.#menuNode.querySelector(`a.ui-sidepanel-menu-link[data-type="${type}"]`));
			menuItem && menuItem.setActiveHandler();
		}
		#getPageManager() {
			if (!this.#pageManager) {
				this.#pageManager = new PageManager(this.getChildrenElements());
			}
			return this.#pageManager;
		}
		#onEventFetchPage(event) {
			return this.#getPageManager().fetchPage(event.getTarget());
		}
		#onSliderCloseHandler(event) {
			const [panelEvent] = event.getCompatData();
			if (this.#cancelMessageBox instanceof ui_dialogs_messagebox.MessageBox) {
				panelEvent.denyAction();
				return false;
			}
			if (this.isChanged && panelEvent.slider.getData()?.get('ignoreChanges') !== true) {
				panelEvent.denyAction();
				this.#cancelMessageBox = ui_dialogs_messagebox.MessageBox.create({
					message: main_core.Loc.getMessage('INTRANET_SETTINGS_CONFIRM_ACTION_DESC'),
					modal: true,
					buttons: [new BX.UI.Button({
						text: main_core.Loc.getMessage('INTRANET_SETTINGS_CONFIRM_ACTION_OK'),
						color: BX.UI.Button.Color.SUCCESS,
						events: {
							click: () => {
								main_core_events.EventEmitter.emit(main_core_events.EventEmitter.GLOBAL_TARGET, 'BX.Intranet.Settings:onCancel', {});
								panelEvent.slider.getData().set('ignoreChanges', true);
								this.isChanged = false;
								BX.UI.ButtonPanel.hide();
								this.#cancelMessageBox.close();
								this.#cancelMessageBox = null;
								panelEvent.slider.close(false, () => {
									panelEvent.slider.destroy();
								});
								if (this.#basePage.includes('/configs/')) {
									this.#reload('/index.php');
								}
							}
						}
					}), new BX.UI.CancelButton({
						text: main_core.Loc.getMessage('INTRANET_SETTINGS_CONFIRM_ACTION_CANCEL'),
						events: {
							click: () => {
								this.#cancelMessageBox.close();
								this.#cancelMessageBox = null;
							}
						}
					})]
				});
				return this.#cancelMessageBox.show();
			}
			if (this.#basePage.includes('/configs/') || this.#extraSettings.reloadAfterClose === true) {
				this.#reload('/index.php');
			}
		}
		#reload(url = null) {
			const loader = document.querySelector('#ui-sidepanel-wrapper-loader');
			if (loader) {
				loader.style.display = '';
			}
			if (main_core.Type.isString(url)) {
				top.window.location.href = url;
			} else {
				top.window.location.href = this.#basePage;
			}
		}
		#onEventChangeData(event) {
			if (!this.#permission.canEdit()) {
				return;
			}
			this.isChanged = true;
			BX.UI.ButtonPanel.show();
		}
		#onClickSaveBtn(event) {
			let data = this.#getPageManager().collectData();
			main_core_events.EventEmitter.emit(main_core_events.EventEmitter.GLOBAL_TARGET, 'BX.Intranet.Settings:onBeforeSave', {
				data: data
			});
			this.#analytic.send();
			main_core.ajax.runComponentAction('bitrix:intranet.settings', 'set', {
				mode: 'class',
				data: main_core.Http.Data.convertObjectToFormData(data)
			}).then(this.#successSaveHandler.bind(this), this.#failSaveHandler.bind(this));
		}
		#successSaveHandler(response) {
			this.#extraSettings.reloadAfterClose = true;
			this.isChanged = false;
			this.#hideWaitIcon();
			BX.UI.ButtonPanel.hide();
			main_core_events.EventEmitter.emit(main_core_events.EventEmitter.GLOBAL_TARGET, 'BX.Intranet.Settings:onSuccessSave', this.#extraSettings);
		}
		#failSaveHandler(response) {
			let errorCollection = this.#prepareErrorCollection(response.errors);
			this.#hideWaitIcon();
			main_core_events.EventEmitter.emit('BX.UI.FormElement.Field:onFailedSave', {
				errors: errorCollection
			});
			let pageType = this.#selectPageForError(errorCollection);
			this.show(pageType);
		}
		#prepareErrorCollection(rawErrors) {
			let errorCollection = {};
			for (let error of rawErrors) {
				let type = error.customData?.page;
				let field = error.customData?.field;
				if (main_core.Type.isNil(type) || main_core.Type.isNil(field)) {
					ui_formElements_field.ErrorCollection.showSystemError(main_core.Loc.getMessage('INTRANET_SETTINGS_ERROR_FETCH_DATA'));
					break;
				}
				if (main_core.Type.isNil(errorCollection[type])) {
					errorCollection[type] = {};
				}
				if (main_core.Type.isNil(errorCollection[type][field])) {
					errorCollection[type][field] = [];
				}
				errorCollection[type][field].push(error.message);
			}
			return errorCollection;
		}
		#onClickCancelBtn(event) {
			top.BX.SidePanel.Instance.close();
		}
		#hideWaitIcon() {
			let saveBtnNode = document.querySelector('#intranet-settings-page #ui-button-panel-save');
			main_core.Dom.removeClass(saveBtnNode, 'ui-btn-wait');
		}
		#selectPageForError(errors) {
			for (let pageType in errors) {
				return pageType;
			}
		}
	}

	exports.CommunicationPage = CommunicationPage;
	exports.ConfigurationPage = ConfigurationPage;
	exports.EmployeePage = EmployeePage;
	exports.GdprPage = GdprPage;
	exports.Permission = Permission;
	exports.PortalPage = PortalPage;
	exports.Renderer = Renderer;
	exports.RequisitePage = RequisitePage;
	exports.SchedulePage = SchedulePage;
	exports.Searcher = Searcher;
	exports.SecurityPage = SecurityPage;
	exports.ServerDataSource = ServerDataSource;
	exports.Settings = Settings;
	exports.ToolsPage = ToolsPage;

})(this.BX.Intranet = this.BX.Intranet || {}, BX, BX.UI, BX.UI.Analytics, BX.Event, BX.UI.FormElements, BX.UI.FormElements, BX.UI.DragAndDrop, BX.UI, BX.UI, BX.UI.Dialogs, window, window, BX, BX.UI, window, BX.UI, BX.UI.Uploader, BX.UI, BX.Intranet.Bitrix24.ThemePicker, BX, window, BX, BX.Main, BX.Intranet.NotifyBanner);
//# sourceMappingURL=script.js.map
