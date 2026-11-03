import { ajax, Http, Event } from 'main.core';
import { HelpMessage } from 'ui.section';
import { Analytic } from './analytic';
import { Navigation } from './navigation';
import { ToolsPage } from './pages/tools-page';
import { EmployeePage } from './pages/employee-page';
import { RequisitePage } from './pages/requisite-page';
import { CommunicationPage } from './pages/communication-page';
import { PortalPage } from './pages/portal-page';
import { ConfigurationPage } from './pages/configuration-page';
import { SchedulePage } from './pages/schedule-page';
import { GdprPage } from './pages/gdpr-page';
import { SecurityPage } from './pages/security-page';
import { ExternalTemporaryPage } from './pages/external-temporary-page';
import { Type, Dom, Loc } from 'main.core';
import { BaseEvent, EventEmitter } from 'main.core.events';
import { MessageBox, MessageBoxButtons } from 'ui.dialogs.messagebox';
import { PageManager } from './page-manager';
import { BaseSettingsElement, BaseSettingsPage } from 'ui.form-elements.field';
import { Searcher } from './search-engine/searcher';
import { Renderer } from './search-engine/renderer';
import { ServerDataSource } from './search-engine/server-data-source';
import { Permission } from './permission';

import './css/style.css';
import './css/main_search_field.css';

export class Settings extends BaseSettingsElement
{
	#basePage: string;
	isChanged: boolean = false;
	#menuNode: ?HTMLElement;
	#settingsNode: ?HTMLElement;
	#contentNode: ?HTMLElement;
	#pageManager: ?PageManager;
	#cancelMessageBox: ?MessageBox;
	#analytic: Analytic;
	#navigator: Navigation;
	#permission: Permission;
	#pagesPermission;
	#menuA11yCleanups = [];
	#onSliderDestroyHandler: ?Function = null;
	#onPageCompleteHandler: ?Function = null;
	#onContentFetchedHandler: ?Function = null;
	#pageBaselines: Map<string, string> = new Map();
	#dirtyPages: Set<string> = new Set();
	#pendingNavigationRequest: ?Object = null;
	#menuNavigationNode: ?HTMLElement = null;
	#liveStatusNode: ?HTMLElement = null;
	#liveAlertNode: ?HTMLElement = null;
	#extraSettings = {
		reloadAfterClose: false,
	};

	constructor(params)
	{
		super(params);
		this.#analytic = new Analytic({
			isAdmin: true,
			locationName: 'settings',
			isBitrix24: params.isBitrix24 === true,
			analyticContext: Type.isStringFilled(params.analyticContext) ? params.analyticContext : null
		});
		this.#analytic.addEventOpenSettings();
		this.#analytic.addEventStartPagePage(params.startPage);
		this.setEventNamespace('BX.Intranet.Settings');
		EventEmitter.subscribe(
			EventEmitter.GLOBAL_TARGET,
			'button-click',
			(event) => {
				const [clickedBtn] = event.data;
				if (clickedBtn.TYPE === 'save')
				{
					this.#onClickSaveBtn(event);
				}
			},
		);

		EventEmitter.subscribe(
			EventEmitter.GLOBAL_TARGET,
			'SidePanel.Slider:onClose',
			this.#onSliderCloseHandler.bind(this),
		);
		this.#menuNode = Type.isDomNode(params.menuNode) ? params.menuNode : null;
		this.#settingsNode = Type.isDomNode(params.settingsNode) ? params.settingsNode : null;
		this.#contentNode = Type.isDomNode(params.contentNode) ? params.contentNode : null;
		this.#liveStatusNode = Type.isDomNode(params.liveStatusNode) ? params.liveStatusNode : null;
		this.#liveAlertNode = Type.isDomNode(params.liveAlertNode) ? params.liveAlertNode : null;
		this.#basePage = Type.isString(params.basePage) ? params.basePage : '';
		this.#permission = params.permission instanceof Permission ? params.permission : new Permission();
		this.#pagesPermission = params.pagesPermission;

		if (this.#settingsNode)
		{
			this.#settingsNode.querySelector('.ui-button-panel input[name="cancel"]')
				.addEventListener('click', this.#onClickCancelBtn);
		}

		params.pages
			.concat(
				Object
					.values(params.externalPages)
					.map(({type, extensions}) => new ExternalTemporaryPage(type, extensions))
			)
			.forEach((page: BaseSettingsPage) => this.registerPage(page).expandPage(params.subPages[page.getType()]))
		;

		const toolsMenuItem = BX.UI.DropdownMenuItem.getItemByNode(this.#menuNode.querySelector('[data-type="tools"]'));
		if (toolsMenuItem.subItems && toolsMenuItem.subItems.length > 0)
		{
			toolsMenuItem.hideSubmenu();
			toolsMenuItem.setDefaultToggleButtonName();
		}

		this.#navigator = new Navigation(this);
		this.#onPageCompleteHandler = this.#onPageComplete.bind(this);
		EventEmitter.subscribe(
			EventEmitter.GLOBAL_TARGET,
			'BX.Intranet.Settings:onPageComplete',
			this.#onPageCompleteHandler,
		);
		this.#onContentFetchedHandler = this.#onContentFetched.bind(this);
		EventEmitter.subscribe(
			EventEmitter.GLOBAL_TARGET,
			'BX.Intranet.Settings:onContentFetched',
			this.#onContentFetchedHandler,
		);

		if (this.#menuNode)
		{
			this.#adaptMenuLinksClick();
			this.#adaptMenuA11y();
		}
	}

	#adaptMenuLinksClick(): void
	{
		if (!Type.isDomNode(this.#menuNode))
		{
			return;
		}

		this.#menuNode.querySelectorAll('li.ui-sidepanel-menu-item a.ui-sidepanel-menu-link')
			.forEach((linkNode) => {
				const item = linkNode;
				if (item.dataset.a11yClickAdapted === 'true')
				{
					return;
				}

				const helpPopup = new HelpMessage(
					`${item.dataset.type}_help-msg`,
					item,
					Loc.getMessage('INTRANET_SETTINGS_PERMISSION_MSG')
				);
				helpPopup.getPopup().setWidth(275);
				const page = this.getNavigator().getPageByType(item.dataset.type);
				const nativeNavigationHandler = (event) => {
					if (page?.getPermission()?.canRead() && this.#isNativeNavigationEvent(event))
					{
						event.stopImmediatePropagation();
					}
				};

				const clickHandler = (event) => {
					if (!page?.getPermission()?.canRead())
					{
						event.preventDefault();
						helpPopup.show();

						return;
					}

					if (this.#isNativeNavigationEvent(event))
					{
						return;
					}

					event.preventDefault();
					this.show(item.dataset.type, {
						userInitiated: true,
						focusTarget: {
							type: 'page',
						},
					});
				};

				Event.bind(item, 'click', nativeNavigationHandler, true);
				Event.bind(item, 'click', clickHandler);
				this.#menuA11yCleanups.push(() => {
					Event.unbind(item, 'click', nativeNavigationHandler, true);
					Event.unbind(item, 'click', clickHandler);
					delete item.dataset.a11yClickAdapted;
				});
				item.dataset.a11yClickAdapted = 'true';
			});
	}

	#adaptMenuA11y(): void
	{
		if (!Type.isDomNode(this.#menuNode) || this.#menuNode.dataset.a11yAdapted === 'true')
		{
			return;
		}

		this.#ensureMenuNavigation();
		Dom.attr(this.#menuNode, {
			'data-testid': 'intranet-settings-menu-root',
		});
		this.#menuNode.dataset.a11yAdapted = 'true';

		this.#menuNode.querySelectorAll('a.ui-sidepanel-menu-link[data-type]').forEach((link) => {
			if (!this.getNavigator().getPageByType(link.dataset.type)?.getPermission()?.canRead())
			{
				link.removeAttribute('href');
				link.setAttribute('aria-disabled', 'true');
			}
		});

		this.#syncMenuCurrentItem();
		this.#adaptMenuDisclosure('tools');

		this.#onSliderDestroyHandler = this.#destroyMenuA11y.bind(this);
		EventEmitter.subscribe(EventEmitter.GLOBAL_TARGET, 'SidePanel.Slider:onDestroy', this.#onSliderDestroyHandler);
	}

	#ensureMenuNavigation(): void
	{
		if (!Type.isDomNode(this.#menuNode))
		{
			return;
		}

		const parentNode = this.#menuNode.parentElement;
		if (Type.isDomNode(parentNode) && parentNode.matches('nav.intranet-settings__menu-navigation'))
		{
			this.#menuNavigationNode = parentNode;
		}
		else
		{
			const navigationNode = document.createElement('nav');
			navigationNode.className = 'intranet-settings__menu-navigation';
			Dom.insertBefore(navigationNode, this.#menuNode);
			Dom.append(this.#menuNode, navigationNode);
			this.#menuNavigationNode = navigationNode;
			this.#menuA11yCleanups.push(() => {
				if (Type.isDomNode(this.#menuNavigationNode) && Type.isDomNode(this.#menuNode))
				{
					Dom.insertBefore(this.#menuNode, this.#menuNavigationNode);
					Dom.remove(this.#menuNavigationNode);
					this.#menuNavigationNode = null;
				}
			});
		}

		const navigationNode = this.#menuNavigationNode;
		if (Type.isDomNode(navigationNode))
		{
			Dom.attr(navigationNode, {
				'aria-label': Loc.getMessage('INTRANET_SETTINGS_MENU_NAVIGATION_LABEL'),
				'data-testid': 'intranet-settings-menu-navigation',
			});
		}
	}

	#adaptMenuDisclosure(type: string): void
	{
		const link = this.#getMenuLinkByType(type);
		const menuItem = Type.isDomNode(link) ? BX.UI.DropdownMenuItem.getItemByNode(link) : null;

		if (!Type.isDomNode(link) || !menuItem?.subItems || menuItem.subItems.length === 0)
		{
			return;
		}

		const submenu = menuItem.submenu;
		if (!Type.isDomNode(submenu))
		{
			return;
		}

		const legacyToggle = link.querySelector('.ui-sidepanel-toggle-btn');
		if (Type.isDomNode(legacyToggle))
		{
			Dom.remove(legacyToggle);
		}

		const disclosure = this.#getMenuDisclosureButton(link, type);
		const itemText = this.#getMenuItemText(link);
		const clickHandler = (event) => {
			menuItem.showSubmenuHandler(event);
			this.#syncMenuDisclosure(menuItem, disclosure, itemText);
		};

		if (disclosure.dataset.a11yAdapted !== 'true')
		{
			Event.bind(disclosure, 'click', clickHandler);
			this.#menuA11yCleanups.push(() => Event.unbind(disclosure, 'click', clickHandler));
			disclosure.dataset.a11yAdapted = 'true';
		}

		const submenuId = `intranet-settings-menu-submenu-${type}`;
		submenu.id = submenu.id || submenuId;
		Dom.attr(disclosure, {
			'aria-controls': submenu.id,
			'data-testid': `intranet-settings-menu-disclosure-${type}`,
		});

		this.#syncMenuDisclosure(menuItem, disclosure, itemText);
	}

	#getMenuDisclosureButton(link: HTMLElement, type: string): HTMLButtonElement
	{
		const item = link.parentElement;
		let disclosure = item?.querySelector(`.intranet-settings__menu-disclosure[data-type="${type}"]`);

		if (!Type.isDomNode(disclosure))
		{
			disclosure = document.createElement('button');
			disclosure.type = 'button';
			disclosure.className = 'ui-sidepanel-toggle-btn intranet-settings__menu-disclosure';
			disclosure.dataset.type = type;
			Dom.insertAfter(disclosure, link);
			this.#menuA11yCleanups.push(() => Dom.remove(disclosure));
		}

		return disclosure;
	}

	#syncMenuDisclosure(menuItem, disclosure: HTMLElement, itemText: string = ''): void
	{
		const isOpen = menuItem.submenuOpen === true;
		const disclosureNode = disclosure;
		const labelMessage = Loc.getMessage(
			isOpen ? 'INTRANET_SETTINGS_MENU_COLLAPSE' : 'INTRANET_SETTINGS_MENU_EXPAND',
			{
				'#TITLE#': itemText,
			},
		);
		const buttonText = isOpen
			? BX.Loc.getMessage('UI_SIDEPANEL_MENU_BUTTON_CLOSE')
			: BX.Loc.getMessage('UI_SIDEPANEL_MENU_BUTTON_OPEN')
		;

		disclosureNode.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
		disclosureNode.setAttribute('aria-label', labelMessage || itemText);
		disclosureNode.textContent = Type.isString(buttonText) ? buttonText : '';

		const submenu = menuItem.submenu;
		if (Type.isDomNode(submenu))
		{
			submenu.inert = !isOpen;
			submenu.setAttribute('aria-hidden', isOpen ? 'false' : 'true');
		}
	}

	#syncMenuCurrentItem(): void
	{
		if (!Type.isDomNode(this.#menuNode))
		{
			return;
		}

		const currentPageType = this.getCurrentPage()?.getType();
		let currentFound = false;
		this.#menuNode.querySelectorAll('a.ui-sidepanel-menu-link[aria-current]').forEach((link) => {
			link.removeAttribute('aria-current');
		});

		this.#menuNode.querySelectorAll('a.ui-sidepanel-menu-link[data-type]').forEach((link) => {
			const item = link.parentElement;
			const isCurrentPage = Type.isStringFilled(currentPageType)
				? link.dataset.type === currentPageType
				: Type.isDomNode(item) && Dom.hasClass(item, 'ui-sidepanel-menu-active')
			;

			if (!currentFound && isCurrentPage)
			{
				link.setAttribute('aria-current', 'page');
				currentFound = true;
			}
		});

		this.#syncMenuDisclosureByType('tools');
	}

	#syncMenuDisclosureByType(type: string): void
	{
		const link = this.#getMenuLinkByType(type);
		const disclosure = link?.parentElement?.querySelector(`.intranet-settings__menu-disclosure[data-type="${type}"]`);
		const menuItem = Type.isDomNode(link) ? BX.UI.DropdownMenuItem.getItemByNode(link) : null;

		if (Type.isDomNode(disclosure) && menuItem)
		{
			this.#syncMenuDisclosure(menuItem, disclosure, Type.isDomNode(link) ? this.#getMenuItemText(link) : '');
		}
	}

	#destroyMenuA11y(event?: BaseEvent): void
	{
		if (!this.#isCurrentSliderEvent(event))
		{
			return;
		}

		this.#menuA11yCleanups.forEach((cleanup) => cleanup());
		this.#menuA11yCleanups = [];
		this.#pendingNavigationRequest = null;

		if (Type.isDomNode(this.#menuNode))
		{
			delete this.#menuNode.dataset.a11yAdapted;
			this.#menuNode.removeAttribute('data-testid');
		}

		if (this.#onSliderDestroyHandler)
		{
			EventEmitter.unsubscribe(
				EventEmitter.GLOBAL_TARGET,
				'SidePanel.Slider:onDestroy',
				this.#onSliderDestroyHandler,
			);
			this.#onSliderDestroyHandler = null;
		}

		if (this.#onPageCompleteHandler)
		{
			EventEmitter.unsubscribe(
				EventEmitter.GLOBAL_TARGET,
				'BX.Intranet.Settings:onPageComplete',
				this.#onPageCompleteHandler,
			);
			this.#onPageCompleteHandler = null;
		}

		if (this.#onContentFetchedHandler)
		{
			EventEmitter.unsubscribe(
				EventEmitter.GLOBAL_TARGET,
				'BX.Intranet.Settings:onContentFetched',
				this.#onContentFetchedHandler,
			);
			this.#onContentFetchedHandler = null;
		}

		this.#pageBaselines.clear();
		this.#dirtyPages.clear();
	}

	#isCurrentSliderEvent(event?: BaseEvent): boolean
	{
		if (!event)
		{
			return true;
		}

		const [panelEvent] = event.getCompatData();
		const slider = panelEvent?.slider;
		if (!slider)
		{
			return false;
		}

		const frameWindow = Type.isFunction(slider.getFrameWindow) ? slider.getFrameWindow() : null;
		if (frameWindow === window)
		{
			return true;
		}

		const frame = Type.isFunction(slider.getFrame) ? slider.getFrame() : null;

		return Type.isDomNode(frame) && frame.contentWindow === window;
	}

	#getMenuLinkByType(type: string): ?HTMLElement
	{
		if (!Type.isDomNode(this.#menuNode))
		{
			return null;
		}

		return [...this.#menuNode.querySelectorAll('a.ui-sidepanel-menu-link[data-type]')]
			.find((link) => link.dataset.type === type)
		;
	}

	#getMenuItemText(link: HTMLElement): string
	{
		return link.querySelector('.ui-sidepanel-menu-link-text')?.textContent?.trim() || link.textContent.trim();
	}

	#isNativeNavigationEvent(event: MouseEvent): boolean
	{
		return event.button !== 0 || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey;
	}

	registerPage(page: BaseSettingsPage): BaseSettingsPage
	{
		page.setParentElement(this);
		page.setPermission(new Permission(this.#pagesPermission[page.getType()] ?? null))
		page.subscribe('change', this.#onEventChangeData.bind(this))
			.subscribe('fetch', this.#onEventFetchPage.bind(this))
		;
		page.setAnalytic(this.#analytic);

		return page;
	}

	getCurrentPage(): ?BaseSettingsPage
	{
		return this.getNavigator().getCurrentPage();
	}

	getNavigator(): Navigation
	{
		return this.#navigator
	}

	show(type: string, option?: string | Object): void
	{
		if (!Type.isDomNode(this.#contentNode))
		{
			console.log('Not found settings container');
			return;
		}
		if (!this.#permission.canRead())
		{
			return;
		}
		const nextPage = this.getNavigator().getPageByType(type);
		const showOptions = this.#normalizeShowOptions(option);

		this.#requestNavigation(nextPage, showOptions);

		if (this.getCurrentPage() === nextPage)
		{
			this.#syncMenuCurrentItem();

			if (nextPage.hasContent())
			{
				this.#applyPendingNavigationRequest(nextPage);
			}

			return;
		}

		this.getNavigator().changePage(nextPage);
		Dom.hide(this.getNavigator().getPrevPage()?.getPage());
		if (Type.isNil(this.getNavigator().getCurrentPage().getPage().parentNode))
		{
			Dom.append(this.getNavigator().getCurrentPage().getPage(), this.#contentNode);
		}
		else
		{
			Dom.show(this.getNavigator().getCurrentPage().getPage());
		}
		this.activateMenuItem(type);

		this.#analytic.addEventChangePage(type);
		this.getNavigator().updateAddressBar();
		EventEmitter.emit(
			EventEmitter.GLOBAL_TARGET,
			'BX.Intranet.Settings:onAfterShowPage', {
				source: this,
				page: nextPage,
			},
		);

		if (nextPage.hasContent())
		{
			this.#applyPendingNavigationRequest(nextPage);
		}
	}

	#normalizeShowOptions(option?: string | Object): Object
	{
		if (Type.isStringFilled(option))
		{
			return {
				moveTo: option,
				userInitiated: false,
				focusTarget: null,
			};
		}

		if (Type.isPlainObject(option))
		{
			return option;
		}

		return {
			moveTo: null,
			userInitiated: false,
			focusTarget: null,
		};
	}

	#requestNavigation(page: ?BaseSettingsPage, showOptions: Object): void
	{
		const moveTo = Type.isStringFilled(showOptions.moveTo) ? showOptions.moveTo : null;
		const focusTarget = showOptions.userInitiated === true && Type.isPlainObject(showOptions.focusTarget)
			? showOptions.focusTarget
			: null
		;

		if (!(page instanceof BaseSettingsPage))
		{
			this.#pendingNavigationRequest = null;

			return;
		}
		if (!Type.isStringFilled(moveTo) && !focusTarget)
		{
			if (this.#pendingNavigationRequest?.pageType !== page.getType())
			{
				this.#pendingNavigationRequest = null;
			}

			return;
		}

		this.#pendingNavigationRequest = {
			pageType: page.getType(),
			moveTo,
			focusTarget,
		};
	}

	#onPageComplete(event: BaseEvent): void
	{
		this.#applyPendingNavigationRequest(event.data.page);
	}

	#applyPendingNavigationRequest(page: ?BaseSettingsPage): void
	{
		const pendingRequest = this.#pendingNavigationRequest;

		if (
			!(page instanceof BaseSettingsPage)
			|| !pendingRequest
			|| pendingRequest.pageType !== page.getType()
			|| this.getCurrentPage() !== page
			|| !page.getPage().isConnected
		)
		{
			return;
		}

		this.#pendingNavigationRequest = null;

		if (Type.isStringFilled(pendingRequest.moveTo))
		{
			this.getNavigator().moveTo(page, pendingRequest.moveTo);
		}

		if (!pendingRequest.focusTarget)
		{
			return;
		}

		if (pendingRequest.focusTarget.type === 'field')
		{
			if (!this.getNavigator().moveTo(page, pendingRequest.focusTarget.fieldName, true))
			{
				this.getNavigator().focusPageTitle(page);
			}

			return;
		}

		if (pendingRequest.focusTarget.type === 'error')
		{
			if (!this.getNavigator().moveTo(page, pendingRequest.focusTarget.fieldName, true))
			{
				this.#focusErrorSummary(page, pendingRequest.focusTarget.message);
			}

			return;
		}

		this.getNavigator().focusPageTitle(page);
	}

	#focusErrorSummary(page: BaseSettingsPage, message: ?string): void
	{
		const pageNode = page.getPage();
		let summaryNode = pageNode.querySelector('.intranet-settings__save-error-summary');

		if (!Type.isDomNode(summaryNode))
		{
			summaryNode = Dom.create('div', {
				props: {
					className: 'intranet-settings__save-error-summary',
					tabIndex: -1,
				},
				attrs: {
					'aria-live': 'off',
				},
			});
			Dom.prepend(summaryNode, pageNode);
		}

		summaryNode.textContent = Type.isStringFilled(message)
			? message
			: Loc.getMessage('INTRANET_SETTINGS_ERROR_FETCH_DATA')
		;
		this.getNavigator().focusNode(summaryNode);
	}

	#clearErrorSummaries(): void
	{
		if (!Type.isDomNode(this.#contentNode))
		{
			return;
		}

		this.#contentNode.querySelectorAll('.intranet-settings__save-error-summary')
			.forEach((summaryNode) => Dom.remove(summaryNode))
		;
	}

	#announceStatus(message: string): void
	{
		this.#setLiveText(this.#liveAlertNode, '');
		this.#setLiveText(this.#liveStatusNode, message);
	}

	#announceAlert(message: string): void
	{
		this.#setLiveText(this.#liveStatusNode, '');
		this.#setLiveText(this.#liveAlertNode, message);
	}

	#setLiveText(node: ?HTMLElement, message: ?string): void
	{
		if (!Type.isDomNode(node) || node.textContent === (message || ''))
		{
			return;
		}

		const liveNode = node;
		liveNode.textContent = message || '';
	}

	#clearLiveRegions(): void
	{
		this.#setLiveText(this.#liveStatusNode, '');
		this.#setLiveText(this.#liveAlertNode, '');
	}

	activateMenuItem(type: string)
	{
		const menuItem = BX.UI.DropdownMenuItem.getItemByNode(
			this.#menuNode.querySelector(`a.ui-sidepanel-menu-link[data-type="${type}"]`)
		);
		menuItem && menuItem.setActiveHandler();
		this.#syncMenuCurrentItem();
	}

	#getPageManager(): PageManager
	{
		if (!this.#pageManager)
		{
			this.#pageManager = (new PageManager(this.getChildrenElements()))
		}
		return this.#pageManager;
	}

	#onEventFetchPage(event: BaseEvent): Promise
	{
		return this.#getPageManager().fetchPage(event.getTarget());
	}

	#onSliderCloseHandler(event: BaseEvent)
	{
		const [panelEvent] = event.getCompatData();
		if (this.#cancelMessageBox instanceof MessageBox)
		{
			panelEvent.denyAction();
			return false;
		}

		if (this.isChanged && panelEvent.slider.getData()?.get('ignoreChanges') !== true)
		{
			panelEvent.denyAction();
			this.#cancelMessageBox = MessageBox.create({
				message: Loc.getMessage('INTRANET_SETTINGS_CONFIRM_ACTION_DESC'),
				modal: true,
				buttons: [
					new BX.UI.Button({
						text: Loc.getMessage('INTRANET_SETTINGS_CONFIRM_ACTION_OK'),
						color: BX.UI.Button.Color.SUCCESS,
						events: {
							click: () => {
								EventEmitter.emit(EventEmitter.GLOBAL_TARGET, 'BX.Intranet.Settings:onCancel', {});
								panelEvent.slider.getData().set('ignoreChanges', true);
								this.#dirtyPages.clear();
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
							},
						}
					}),
					new BX.UI.CancelButton({
						text: Loc.getMessage('INTRANET_SETTINGS_CONFIRM_ACTION_CANCEL'),
						events: {
							click: () => {
								this.#cancelMessageBox.close();
								this.#cancelMessageBox = null;
							},
						}
					}),
				],
			});
			return this.#cancelMessageBox.show();
		}

		if (
			this.#basePage.includes('/configs/')
			|| this.#extraSettings.reloadAfterClose === true
		)
		{
			this.#reload('/index.php');
		}
	}

	#reload(url: ?string = null)
	{
		const loader =  document.querySelector('#ui-sidepanel-wrapper-loader');
		if (loader)
		{
			loader.style.display = '';
		}
		if (Type.isString(url))
		{
			top.window.location.href = url;
		}
		else
		{
			top.window.location.href = this.#basePage;
		}
	}

	#onEventChangeData(event)
	{
		if (!this.#permission.canEdit())
		{
			return;
		}

		const page = event?.getData()?.source;
		if (!(page instanceof BaseSettingsPage))
		{
			this.isChanged = true;
			BX.UI.ButtonPanel.show();

			return;
		}

		const type = page.getType();
		if (this.#pageBaselines.get(type) === this.#getPageState(page))
		{
			this.#dirtyPages.delete(type);
		}
		else
		{
			this.#dirtyPages.add(type);
		}

		this.#syncChangedState();
	}

	#onContentFetched(event: BaseEvent)
	{
		const page = event?.getData()?.page;
		if (!(page instanceof BaseSettingsPage) || !this.#getPageManager().getPages().includes(page))
		{
			return;
		}

		this.#captureBaseline(page);
	}

	#captureBaseline(page: BaseSettingsPage): void
	{
		const state = this.#getPageState(page);
		if (state === null)
		{
			return;
		}

		this.#pageBaselines.set(page.getType(), state);
		this.#dirtyPages.delete(page.getType());
	}

	#getPageState(page: BaseSettingsPage): ?string
	{
		if (!page.hasData() || !Type.isDomNode(page.getFormNode()))
		{
			return null;
		}

		return JSON.stringify(PageManager.getFormData(page.getFormNode()) ?? null);
	}

	#syncChangedState(): void
	{
		this.isChanged = this.#dirtyPages.size > 0;
		if (this.isChanged)
		{
			BX.UI.ButtonPanel.show();
		}
		else
		{
			BX.UI.ButtonPanel.hide();
		}
	}

	#onClickSaveBtn(event)
	{
		this.#clearErrorSummaries();
		this.#clearLiveRegions();
		let data = this.#getPageManager().collectData();
		EventEmitter.emit(EventEmitter.GLOBAL_TARGET, 'BX.Intranet.Settings:onBeforeSave', {
			data: data,
		});
		this.#analytic.send();
		ajax.runComponentAction(
			'bitrix:intranet.settings',
			'set',
			{
				mode: 'class',
				data: Http.Data.convertObjectToFormData(data),
			},
		).then(this.#successSaveHandler.bind(this), this.#failSaveHandler.bind(this));
	}

	#successSaveHandler(response: Object)
	{
		this.#extraSettings.reloadAfterClose = true;

		this.#getPageManager().getPages().forEach((page: BaseSettingsPage) => this.#captureBaseline(page));
		this.#dirtyPages.clear();
		this.isChanged = false;
		this.#hideWaitIcon();
		BX.UI.ButtonPanel.hide();
		this.#clearErrorSummaries();
		this.#announceStatus(Loc.getMessage('INTRANET_SETTINGS_SAVE_SUCCESS'));

		EventEmitter.emit(
			EventEmitter.GLOBAL_TARGET,
			'BX.Intranet.Settings:onSuccessSave',
			this.#extraSettings,
		);
	}

	#failSaveHandler(response: Object)
	{
		let errorCollection = this.#prepareErrorCollection(response.errors);
		const saveErrorMessage = this.#getSaveErrorMessage(errorCollection);
		this.#hideWaitIcon();
		this.#announceAlert(saveErrorMessage);

		EventEmitter.emit('BX.UI.FormElement.Field:onFailedSave', {
			errors: errorCollection,
		});

		let pageType = this.#selectPageForError(errorCollection);
		if (!Type.isStringFilled(pageType))
		{
			const currentPage = this.getCurrentPage();
			if (currentPage instanceof BaseSettingsPage)
			{
				this.#focusErrorSummary(currentPage, saveErrorMessage);
			}

			return;
		}

		this.show(pageType, {
			userInitiated: true,
			focusTarget: {
				type: 'error',
				fieldName: this.#selectFieldForError(errorCollection[pageType]),
				message: saveErrorMessage,
			},
		});
	}

	#getSaveErrorMessage(errorCollection: Object): string
	{
		return Object.keys(errorCollection).length > 0
			? Loc.getMessage('INTRANET_SETTINGS_SAVE_ERROR')
			: Loc.getMessage('INTRANET_SETTINGS_ERROR_FETCH_DATA')
		;
	}

	#prepareErrorCollection(rawErrors): Object
	{
		let errorCollection = {};
		for (let error of rawErrors)
		{
			let type = error.customData?.page;
			let field = error.customData?.field;
			if (Type.isNil(type) || Type.isNil(field))
			{
				break;
			}
			if (Type.isNil(errorCollection[type]))
			{
				errorCollection[type] = {};
			}
			if (Type.isNil(errorCollection[type][field]))
			{
				errorCollection[type][field] = [];
			}
			errorCollection[type][field].push(error.message);
		}

		return errorCollection;
	}

	#onClickCancelBtn(event)
	{
		top.BX.SidePanel.Instance.close();
	}

	#hideWaitIcon()
	{
		let saveBtnNode = document.querySelector('#intranet-settings-page #ui-button-panel-save');
		Dom.removeClass(saveBtnNode, 'ui-btn-wait');
	}

	#selectPageForError(errors): ?string
	{
		for (let pageType in errors)
		{
			return pageType;
		}

		return null;
	}

	#selectFieldForError(pageErrors: ?Object): ?string
	{
		if (!Type.isPlainObject(pageErrors))
		{
			return null;
		}

		for (const fieldName in pageErrors)
		{
			return fieldName;
		}

		return null;
	}
}

export {
	ToolsPage,
	EmployeePage,
	PortalPage,
	CommunicationPage,
	RequisitePage,
	ConfigurationPage,
	SchedulePage,
	GdprPage,
	SecurityPage,
	Renderer,
	Searcher,
	ServerDataSource,
	Permission,
};
