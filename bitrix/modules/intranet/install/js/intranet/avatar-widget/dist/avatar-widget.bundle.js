/* eslint-disable */
this.BX = this.BX || {};
(function (exports, main_core, main_core_events, ui_a11y, ui_popupcomponentsmaker, ui_analytics, ui_cnt, ui_buttons, main_popup, intranet_desktopDownload, intranet_desktopAccountList, main_sidepanel, im_v2_lib_desktopApi, ui_avatar, timeman_workStatusControlPanel, pull_client, ui_infoHelper, crm_router, humanresources_hcmlink_salaryVacationMenu, ui_shortQrAuth) {
	'use strict';

	class Analytics {
		static TOOLS = 'intranet';
		static CATEGORY = 'ava_menu';
		static CATEGORY_PROFILE = 'user_profile';
		static EVENT_OPEN_WIDGET = 'menu_open';
		static EVENT_PROFILE_VIEW = 'profile_view';
		static EVENT_CLICK_SALARY = 'click_salary';
		static EVENT_CLICK_INSTALL_DESKTOP_APP = 'click_install_desktop_app';
		static EVENT_CLICK_INSTALL_MOBILE_APP = 'click_install_mobile_app';
		static EVENT_CLICK_FAST_MOBILE_AUTH = 'click_fast_mobile_auth';
		static EVENT_CLICK_2FA_SETUP = 'click_2fa_setup';
		static EVENT_CLICK_EXTENSION = 'click_extension';
		static EVENT_CLICK_LOGOUT = 'click_logout';
		static EVENT_CLICK_CHANGE_PORTAL_THEME = 'click_change_portal_theme';
		static EVENT_CLICK_NETWORK = 'click_network';
		static EVENT_CLICK_ACTIVITY_PORTAL_LIST = 'click_activity_portal_list';
		static EVENT_CLICK_PULSE = 'click_open_pulse';
		static EVENT_CLICK_MY_DOCUMENTS = 'click_open_my_documents';
		static send(event) {
			ui_analytics.sendData({
				tool: Analytics.TOOLS,
				category: Analytics.CATEGORY,
				event
			});
		}
		static sendOpenProfile() {
			ui_analytics.sendData({
				tool: Analytics.TOOLS,
				category: Analytics.CATEGORY_PROFILE,
				event: Analytics.EVENT_PROFILE_VIEW,
				c_section: Analytics.CATEGORY
			});
		}
		static sendOpenCommonSecurity() {
			ui_analytics.sendData({
				tool: 'settings',
				category: 'common_security',
				event: 'start_page',
				c_section: Analytics.CATEGORY
			});
		}
	}

	class Content extends main_core_events.EventEmitter {
		cache = new main_core.Cache.MemoryCache();
		constructor(options) {
			super();
			this.setOptions(options);
			this.setEventNamespace('BX.Intranet.AvatarWidget.Content');
		}
		setOptions(options) {
			this.cache.set('options', options);
			return this;
		}
		getOptions() {
			return this.cache.get('options', {});
		}
		getLayout() {
			throw new Error('Must be implemented in a child class');
		}
		getConfig() {
			return {
				html: this.getLayout(),
				minHeight: '50px',
				margin: '0 13px'
			};
		}
	}

	class AnnualSummaryContent extends Content {
		#annualSummaryPopup = null;
		getLayout() {
			return this.cache.remember('layout', () => {
				return main_core.Tag.render`
				<button
						type="button"
						data-testid="bx-avatar-widget-tool-${this.getId()}"
						onclick="${this.onClick.bind(this)}"
						class="intranet-avatar-widget-item__wrapper intranet-avatar-widget-annual-summary-tool__wrapper"
						>
						<div class="intranet-avatar-widget-annual-summary-tool__background"></div>
						<span class="intranet-avatar-widget-annual-summary-tool__title">
							${this.getTitle()}
						</span>
				</button>
			`;
			});
		}
		getTitle() {
			return this.getOptions().title;
		}
		onClick() {
			if (this.#annualSummaryPopup) {
				this.#annualSummaryPopup.show();
				main_core_events.EventEmitter.emit('BX.Intranet.AvatarWidget.Popup:openChild');
				return;
			}
			const layout = this.getLayout();
			layout.disabled = true;
			layout.setAttribute('aria-busy', 'true');
			main_core.Dom.addClass(layout, 'intranet-avatar-widget-annual-summary-tool__wrapper--loading');
			Promise.all([main_core.ajax.runAction('intranet.v2.AnnualSummary.load', {}), main_core.Runtime.loadExtension('intranet.notify-banner.annual-summary')]).then(([response, {
				AnnualSummary
			}]) => {
				const {
					topFeatures,
					options
				} = response.data;
				main_core_events.EventEmitter.emit('BX.Intranet.AvatarWidget.Popup:openChild');
				this.#annualSummaryPopup = new AnnualSummary(topFeatures, {
					...options,
					section: 'profile'
				});
				this.#annualSummaryPopup.subscribe('onShow', () => BX.userOptions.save('intranet', 'annual_summary_25_last_show', null, Math.floor(Date.now() / 1000)));
				this.#annualSummaryPopup.show();
			}).catch(error => {
				console.error(error);
			}).finally(() => {
				layout.disabled = false;
				layout.removeAttribute('aria-busy');
				main_core.Dom.removeClass(layout, 'intranet-avatar-widget-annual-summary-tool__wrapper--loading');
			});
		}
		getId() {
			return 'annual-summary';
		}
	}

	class BaseTool {
		cache = new main_core.Cache.MemoryCache();
		constructor(options = {}) {
			this.options = options;
		}
		getLayout() {
			throw new Error('Must be implemented in a child class');
		}
		getIconClass() {
			throw new Error('Must be implemented in a child class');
		}
		onClick() {
			throw new Error('Must be implemented in a child class');
		}
		getIconElement() {
			throw new Error('Must be implemented in a child class');
		}
		getTitle() {
			return this.options.title || this.options.text || '';
		}
	}

	class BaseSecondaryTool extends BaseTool {
		getLayout() {
			return this.cache.remember('layout', () => {
				const actionElement = this.getActionElement();
				if (this.hasInteractiveAction()) {
					return main_core.Tag.render`
					<div data-testid="bx-avatar-widget-tool-${this.getId()}" class="intranet-avatar-widget-secondary-tool__wrapper">
						${this.getIconElement()}
						<div class="intranet-avatar-widget-item__info-wrapper">
							<span id="${this.getTitleId()}" class="intranet-avatar-widget-item__title">
								${this.getTitle()}
							</span>
						</div>
						${this.#getCounterWrapper()}
						${actionElement}
					</div>
				`;
				}
				if (this.getHref()) {
					const link = main_core.Tag.render`
					<a
						class="intranet-avatar-widget-secondary-tool__wrapper"
						href="${this.getHref()}"
						data-testid="bx-avatar-widget-tool-${this.getId()}"
					>
						${this.getIconElement()}
						<div class="intranet-avatar-widget-item__info-wrapper">
							<span id="${this.getTitleId()}" class="intranet-avatar-widget-item__title">
								${this.getTitle()}
							</span>
						</div>
						${this.#getCounterWrapper()}
						${actionElement}
					</a>
				`;
					if (this.getTarget()) {
						main_core.Dom.attr(link, {
							target: this.getTarget(),
							rel: 'noopener noreferrer'
						});
					}
					if (this.hasLinkClickHandler()) {
						main_core.Event.bind(link, 'click', this.onClick.bind(this));
					}
					return link;
				}
				return main_core.Tag.render`
				<button type="button" data-testid="bx-avatar-widget-tool-${this.getId()}" onclick="${this.onClick.bind(this)}" class="intranet-avatar-widget-secondary-tool__wrapper">
					${this.getIconElement()}
					<div class="intranet-avatar-widget-item__info-wrapper">
						<span id="${this.getTitleId()}" class="intranet-avatar-widget-item__title">
							${this.getTitle()}
						</span>
					</div>
					${this.#getCounterWrapper()}
					${actionElement}
				</button>
			`;
			});
		}
		getHref() {
			return '';
		}
		getTarget() {
			return '';
		}
		hasLinkClickHandler() {
			return false;
		}
		getIconElement() {
			return this.cache.remember('icon', () => {
				return main_core.Tag.render`<i aria-hidden="true" class="ui-icon-set ${this.getIconClass()} intranet-avatar-widget-secondary-tool__icon"/>`;
			});
		}
		getActionElement() {
			return this.cache.remember('actionElement', () => {
				return main_core.Tag.render`<i aria-hidden="true" class="ui-icon-set --chevron-right-m intranet-avatar-widget-item__chevron"/>`;
			});
		}
		hasInteractiveAction() {
			return false;
		}
		getCounter() {
			return null;
		}
		getId() {
			return '';
		}
		getTitleId() {
			return `intranet-avatar-widget-tool-${this.getId()}-title`;
		}
		#getCounterWrapper() {
			return this.cache.remember('counterWrapper', () => {
				const counter = this.getCounter();
				return main_core.Tag.render`
				<div class="intranet-avatar-widget-item__counter">
					${counter?.render()}
				</div>
			`;
			});
		}
	}

	class InstallMobileTool extends BaseSecondaryTool {
		getIconClass() {
			return '--o-mobile';
		}
		onClick(event) {
			Analytics.send(Analytics.EVENT_CLICK_INSTALL_MOBILE_APP);
			main_core_events.EventEmitter.emit('BX.Intranet.AvatarWidget.FastMobileAuthTool:onClick', {
				focusTarget: event.currentTarget
			});
		}
	}

	class FastMobileAuthTool extends BaseSecondaryTool {
		getIconClass() {
			return '--o-qr-code';
		}
		onClick(event) {
			Analytics.send(Analytics.EVENT_CLICK_FAST_MOBILE_AUTH);
			main_core_events.EventEmitter.emit('BX.Intranet.AvatarWidget.FastMobileAuthTool:onClick', {
				focusTarget: event.currentTarget
			});
		}
		getId() {
			return 'fast-mobile-auth';
		}
	}

	class ApplicationsInstallerTool extends BaseSecondaryTool {
		getIconElement() {
			return this.cache.remember('icon', () => {
				if (this.options.mobile.installed) {
					return main_core.Tag.render`
					<span class="intranet-avatar-widget-secondary-tool-icons__wrapper">
						${this.#getMobileIcon()}
						<div aria-hidden="true" class="intranet-avatar-widget-secondary-tool-icons__seporator"></div>
						${this.#getDesktopIcon()}
					</span>
				`;
				}
				return this.#getDesktopIcon();
			});
		}
		getActionElement() {
			return this.cache.remember('actionElement', () => {
				if (this.options.desktop.installed && this.options.menu) {
					const onclick = event => {
						this.#getInstallMenu(event.currentTarget).toggle();
					};
					return main_core.Tag.render`
					<button
						type="button"
						onclick="${onclick}"
						aria-label="${main_core.Loc.getMessage('INTRANET_AVATAR_WIDGET_ADDITIONAL_INSTALL_OPTIONS')}"
						aria-haspopup="menu"
						aria-expanded="false"
						class="ui-icon-set --more-m intranet-avatar-widget-item__more"
					></button>
				`;
				}
				const desktopDownload = new intranet_desktopDownload.DesktopDownload();
				const button = new ui_buttons.Button({
					size: ui_buttons.Button.Size.EXTRA_SMALL,
					text: this.options.desktop.buttonName,
					useAirDesign: true,
					style: ui_buttons.AirButtonStyle.FILLED,
					noCaps: true,
					onclick: () => {
						desktopDownload.handleDownloadClick(button);
					},
					wide: true
				}).render();
				button.setAttribute('aria-label', `${this.options.desktop.buttonName} ${this.getTitle()}`);
				return main_core.Tag.render`
				<span class="intranet-avatar-widget-secondary-tool-application__button-wrapper">
					${button}
				</span>
			`;
			});
		}
		hasInteractiveAction() {
			return true;
		}
		#getMobileIcon() {
			return this.cache.remember('mobileIcon', () => {
				let className = 'ui-icon-set --mobile-selected intranet-avatar-widget-secondary-tool-application__icon';
				if (this.options.mobile.installed) {
					className += ' --installed';
				}
				return main_core.Tag.render`
				<i aria-hidden="true" class="${className}"/>
			`;
			});
		}
		#getDesktopIcon() {
			return this.cache.remember('desktopIcon', () => {
				let className = 'ui-icon-set intranet-avatar-widget-secondary-tool-application__icon';
				if (this.options.desktop.installed) {
					className += ' --screen-selected --installed';
				} else {
					className += ' --o-screen';
				}
				return main_core.Tag.render`
				<i aria-hidden="true" class="${className}"/>
			`;
			});
		}
		#getInstallMenu(bindElement) {
			return this.cache.remember('installMenu', () => {
				const items = this.#getInstallMenuItems();
				if (items.length === 0) {
					return null;
				}
				return new main_popup.Menu({
					bindElement,
					ariaLabel: main_core.Loc.getMessage('INTRANET_AVATAR_WIDGET_ADDITIONAL_INSTALL_OPTIONS'),
					items,
					offsetLeft: 5,
					angle: true,
					fixed: true,
					events: {
						onShow: () => bindElement.setAttribute('aria-expanded', 'true'),
						onClose: () => bindElement.setAttribute('aria-expanded', 'false')
					}
				});
			});
		}
		#getInstallMenuItems() {
			const items = [];
			this.options.menu.forEach(item => {
				if (item.type === 'desktop') {
					items.push({
						text: item.title,
						href: item.installLink,
						onclick: () => {
							Analytics.send(Analytics.EVENT_CLICK_INSTALL_DESKTOP_APP);
							this.#getInstallMenu().close();
						}
					});
				} else if (item.type === 'mobile') {
					items.push({
						text: item.title,
						onclick: () => {
							Analytics.send(Analytics.EVENT_CLICK_INSTALL_MOBILE_APP);
							this.#getInstallMenu().close();
							main_core_events.EventEmitter.emit('BX.Intranet.AvatarWidget.ApplicationInstallerTool:onClick', {
								focusTarget: this.getActionElement()
							});
						}
					});
				}
			});
			return items;
		}
		onClick() {}
		getId() {
			return 'applications-installer';
		}
	}

	class ApplicationContent extends Content {
		getLayout() {
			return this.cache.remember('layout', () => {
				const container = main_core.Tag.render`
				<div data-testid="bx-avatar-widget-content-application" class="intranet-avatar-widget-item__wrapper"></div>
			`;
				this.#getTools().forEach(tool => {
					main_core.Dom.append(tool.getLayout(), container);
				});
				return container;
			});
		}
		#getTools() {
			return this.cache.remember('tools', () => {
				const tools = this.getOptions().tools;
				return [tools.installMobile ? new InstallMobileTool(tools.installMobile) : null, tools.fastMobileAuth ? new FastMobileAuthTool(tools.fastMobileAuth) : null, tools.applicationsInstaller ? new ApplicationsInstallerTool(tools.applicationsInstaller) : null].filter(Boolean);
			});
		}
	}

	class AccountChangerTool extends BaseSecondaryTool {
		getIconClass() {
			return '--o-structure-vertical';
		}
		onClick() {
			if (this.options.type === 'desktop') {
				Analytics.send(Analytics.EVENT_CLICK_ACTIVITY_PORTAL_LIST);
				main_core_events.EventEmitter.emit('BX.Intranet.AvatarWidget.Popup:openChild');
				new intranet_desktopAccountList.DesktopAccountList({
					bindElement: document.querySelector('[data-id="bx-avatar-widget"]')
				}).show();
			} else if (this.options.type === 'network') {
				Analytics.send(Analytics.EVENT_CLICK_NETWORK);
			}
		}
		getHref() {
			return this.options.type === 'network' ? this.options.path : '';
		}
		getTarget() {
			return this.options.type === 'network' ? '_blank' : '';
		}
		hasLinkClickHandler() {
			return this.options.type === 'network';
		}
		getId() {
			return 'account-changer';
		}
	}

	class AdministrationTool extends BaseSecondaryTool {
		getIconClass() {
			return '--o-filter-2-lines';
		}
		getHref() {
			return this.options.path;
		}
		getTarget() {
			return '_blank';
		}
		getId() {
			return 'administration';
		}
	}

	class PerformanUserProfileTool extends BaseSecondaryTool {
		getIconClass() {
			return '--o-achievement';
		}
		getHref() {
			return this.options.path || '/performan/';
		}
		getTarget() {
			return '_blank';
		}
		getId() {
			return 'performan-user-profile';
		}
	}

	class ThemeSecondaryTool extends BaseSecondaryTool {
		getIconClass() {
			return '--o-palette';
		}
		onClick() {
			Analytics.send(Analytics.EVENT_CLICK_CHANGE_PORTAL_THEME);
			main_core_events.EventEmitter.emit('BX.Intranet.AvatarWidget.Popup:openChild');
			BX.Intranet.Bitrix24.ThemePicker.Singleton.showDialog(false);
		}
		getId() {
			return 'theme';
		}
	}

	class SecondaryContent extends Content {
		getLayout() {
			return this.cache.remember('layout', () => {
				const container = main_core.Tag.render`
				<div data-testid="bx-avatar-widget-content-${this.getId()}" class="intranet-avatar-widget-item__wrapper"></div>
			`;
				this.getTools().forEach(tool => {
					main_core.Dom.append(tool.getLayout(), container);
				});
				return container;
			});
		}
		getTools() {
			return this.cache.remember('tools', () => {
				const tools = this.getOptions().tools;
				return [tools.theme ? new ThemeSecondaryTool(tools.theme) : null, tools.accountChanger ? new AccountChangerTool(tools.accountChanger) : null, tools.admin ? new AdministrationTool(tools.admin) : null, tools.performanUserProfile ? new PerformanUserProfileTool(tools.performanUserProfile) : null].filter(Boolean);
			});
		}
		getId() {
			return 'secondary';
		}
	}

	class SecuritySecondaryTool extends BaseSecondaryTool {
		getIconClass() {
			return '--o-shield-checked';
		}
		onClick() {
			Analytics.send(Analytics.EVENT_CLICK_2FA_SETUP);
			main_sidepanel.SidePanel.Instance.open(this.options.url, {
				width: 1100
			});
		}
		getId() {
			return 'security';
		}
	}

	class ExtranetSecondaryContent extends SecondaryContent {
		getTools() {
			return this.cache.remember('tools', () => {
				const tools = this.getOptions().tools;
				return [tools.security ? new SecuritySecondaryTool(tools.security) : null, tools.theme ? new ThemeSecondaryTool(tools.theme) : null].filter(Boolean);
			});
		}
		getId() {
			return 'extranet-secondary';
		}
	}

	class BaseFooterTool {
		cache = new main_core.Cache.MemoryCache();
		constructor(options = {}) {
			this.options = options;
		}
		getLayout() {
			return main_core.Tag.render`
			<button type="button" data-testid="bx-avatar-widget-footer-tool-${this.getId()}" onclick="${this.onClick.bind(this)}" class="intranet-avatar-widget-footer__item">
				${this.getTitle()}
			</button>
		`;
		}
		onClick() {
			throw new Error('Must be implemented in a child class');
		}
		getTitle() {
			return this.options.title || this.options.text || '';
		}
		getId() {
			return '';
		}
	}

	class ThemeTool extends BaseFooterTool {
		onClick() {
			Analytics.send(Analytics.EVENT_CLICK_CHANGE_PORTAL_THEME);
			main_core_events.EventEmitter.emit('BX.Intranet.AvatarWidget.Popup:openChild');
			BX.Intranet.Bitrix24.ThemePicker.Singleton.showDialog(false);
		}
		getId() {
			return 'theme';
		}
	}

	class PulseTool extends BaseFooterTool {
		onClick() {
			Analytics.send(Analytics.EVENT_CLICK_PULSE);
			main_core.ajax.runAction('intranet.user.widget.getUserStatComponent', {
				mode: 'class'
			}).then(response => {
				main_core.Runtime.html(null, response.data.html).then(() => {
					if (window.openIntranetUStat) {
						main_core_events.EventEmitter.emit('BX.Intranet.AvatarWidget.Popup:openChild');
						openIntranetUStat();
					}
				}).catch(() => {});
			}).catch(() => {});
		}
		getId() {
			return 'pulse';
		}
	}

	class LogoutTool extends BaseFooterTool {
		onClick() {
			Analytics.send(Analytics.EVENT_CLICK_LOGOUT);
			if (!main_core.Type.isNil(im_v2_lib_desktopApi.DesktopApi) && im_v2_lib_desktopApi.DesktopApi.isDesktop()) {
				im_v2_lib_desktopApi.DesktopApi.logout();
			} else {
				const backUrl = new main_core.Uri(window.location.pathname);
				backUrl.removeQueryParam(this.options.removeQueryParam);
				const newUrl = new main_core.Uri(this.options.path);
				newUrl.setQueryParam('sessid', BX.bitrix_sessid());
				newUrl.setQueryParam('backurl', encodeURIComponent(backUrl.toString()));
				document.location.href = newUrl;
			}
		}
		getId() {
			return 'logout';
		}
	}

	class FooterContent extends Content {
		getConfig() {
			return {
				html: this.getLayout(),
				withoutBackground: true,
				margin: '0 0 16px 0'
			};
		}
		getLayout() {
			return this.cache.remember('layout', () => {
				const container = main_core.Tag.render`
				<div data-testid="bx-avatar-widget-content-footer" class="intranet-avatar-widget-footer__wrapper"/>
			`;
				const tools = this.#getTools();
				tools.forEach(tool => {
					main_core.Dom.append(tool.getLayout(), container);
				});
				return container;
			});
		}
		#getTools() {
			return this.cache.remember('tools', () => {
				const tools = this.getOptions().tools;
				return [tools.theme ? new ThemeTool(tools.theme) : null, tools.pulse ? new PulseTool(tools.pulse) : null, tools.logout ? new LogoutTool(tools.logout) : null].filter(Boolean);
			});
		}
	}

	class BaseMainTool extends BaseTool {
		getLayout() {
			return this.cache.remember('layout', () => {
				const titleId = `intranet-avatar-widget-main-tool-${this.getId()}-title`;
				return main_core.Tag.render`
				<div
					data-testid="bx-avatar-widget-main-tool-${this.getId()}"
					class="intranet-avatar-widget-main-tool__wrapper"
					onclick="${this.#onWrapperClick.bind(this)}"
				>
					${this.getButton()}
					<div id="${titleId}" class="intranet-avatar-widget-main-tool__title">
						${this.getTitle()}
					</div>
				</div>
			`;
			});
		}
		#onWrapperClick(event) {
			const button = this.getButton();
			if (button.contains(event.target)) {
				return;
			}
			button.click();
		}
		getButton() {
			return this.cache.remember('button', () => {
				const titleId = `intranet-avatar-widget-main-tool-${this.getId()}-title`;
				const counterId = `intranet-avatar-widget-main-tool-${this.getId()}-counter`;
				return main_core.Tag.render`
				<button type="button" aria-labelledby="${titleId} ${counterId}" onclick="${this.onClick.bind(this)}" class="intranet-avatar-widget-main-tool-icon__wrapper">
					${this.getIconElement()}
					${this.#getCounterWrapper(counterId)}
				</button>
			`;
			});
		}
		getIconElement() {
			return this.cache.remember('icon', () => {
				return main_core.Tag.render`<i aria-hidden="true" class="ui-icon-set ${this.getIconClass()} intranet-avatar-widget-main-tool__icon"/>`;
			});
		}
		getCounter() {
			return null;
		}
		getId() {
			return '';
		}
		#getCounterWrapper(id) {
			return this.cache.remember('counterWrapper', () => {
				const counter = this.getCounter();
				return main_core.Tag.render`
				<div id="${id}" class="intranet-avatar-widget-main-tool__counter-wrapper">
					${counter?.render()}
				</div>
			`;
			});
		}
	}

	class ExtensionTool extends BaseMainTool {
		getLayout() {
			return this.cache.remember('extensionLayout', () => {
				const layout = super.getLayout();
				const trigger = this.#getTriggerElement();
				trigger.setAttribute('aria-haspopup', 'menu');
				trigger.setAttribute('aria-expanded', 'false');
				return layout;
			});
		}
		getIconClass() {
			return '--o-box';
		}
		onClick() {
			Analytics.send(Analytics.EVENT_CLICK_EXTENSION);
			this.#getMenu().toggle();
		}
		#getMenu() {
			return this.cache.remember('menu', () => {
				const trigger = this.#getTriggerElement();
				const menu = new main_popup.Menu({
					bindElement: trigger,
					ariaLabel: this.getTitle(),
					items: this.options.items,
					angle: true,
					cachable: false,
					offsetLeft: 10,
					fixed: true,
					events: {
						onShow: () => trigger.setAttribute('aria-expanded', 'true'),
						onClose: () => trigger.setAttribute('aria-expanded', 'false')
					}
				});
				main_core_events.EventEmitter.subscribe('SidePanel.Slider:onOpenStart', () => {
					menu.close();
				});
				return menu;
			});
		}
		#getTriggerElement() {
			const trigger = this.getIconElement().closest('button');
			if (!trigger) {
				throw new Error('Extension tool trigger was not found');
			}
			return trigger;
		}
		getId() {
			return 'extension';
		}
	}

	class SecurityTool extends BaseMainTool {
		getIconClass() {
			return '--o-shield-checked';
		}
		onClick() {
			Analytics.send(Analytics.EVENT_CLICK_2FA_SETUP);
			main_sidepanel.SidePanel.Instance.open(this.options.url, {
				width: 1100
			});
		}
		getCounter() {
			return this.cache.remember('counter', () => {
				if (!this.options.hasCounter) {
					return null;
				}
				pull_client.PULL.subscribe({
					moduleId: 'intranet',
					command: this.options.counterEventName,
					callback: () => {
						this.getCounter().destroy();
						const icon = this.getLayout().querySelector('.intranet-avatar-widget-item__icon');
						main_core.Dom.removeClass(icon, '--active');
						this.cache.delete('counter');
					}
				});
				return new ui_cnt.Counter({
					color: ui_cnt.Counter.Color.DANGER,
					size: ui_cnt.Counter.Size.MEDIUM,
					value: 1,
					style: ui_cnt.CounterStyle.FILLED_ALERT,
					useAirDesign: true
				});
			});
		}
		getId() {
			return 'security';
		}
	}

	class MyDocumentsTool extends BaseMainTool {
		getIconClass() {
			return '--o-file';
		}
		onClick() {
			Analytics.send(Analytics.EVENT_CLICK_MY_DOCUMENTS);
			if (this.options.isLocked) {
				ui_infoHelper.FeaturePromotersRegistry.getPromoter({
					code: 'limit_office_e_signature'
				}).show();
				return;
			}
			const userId = Number(main_core.Loc.getMessage('USER_ID'));
			if (userId > 0) {
				crm_router.Router.openSlider(`${main_core.Loc.getMessage('SITE_DIR')}company/personal/user/${userId}/sign?noRedirect=Y`, {
					width: 1000,
					cacheable: false
				});
			}
		}
		getCounter() {
			return this.cache.remember('counter', () => {
				if (Number(this.options.counter) < 1) {
					return null;
				}
				pull_client.PULL.subscribe({
					moduleId: 'sign',
					command: this.options.counterEventName,
					callback: params => {
						if (!main_core.Type.isNumber(params?.needActionCount)) {
							return;
						}
						this.options.counter = params.needActionCount;
						if (params?.needActionCount > 0) {
							this.getCounter().update(params.needActionCount);
						} else {
							this.getCounter().destroy();
							const icon = this.getLayout().querySelector('.intranet-avatar-widget-item__icon');
							main_core.Dom.removeClass(icon, '--active');
							this.cache.delete('counter');
						}
					}
				});
				return new ui_cnt.Counter({
					color: ui_cnt.Counter.Color.DANGER,
					size: ui_cnt.Counter.Size.MEDIUM,
					value: this.options.counter,
					style: ui_cnt.CounterStyle.FILLED_ALERT,
					useAirDesign: true
				});
			});
		}
		getId() {
			return 'my-documents';
		}
	}

	const SALARY_VACATION_MENU_ID = 'hcmLink-vacation-salary-menu';
	class SalaryVacationTool extends BaseMainTool {
		getIconClass() {
			return '--o-favorite';
		}
		getLayout() {
			const container = super.getLayout();
			const button = this.getButton();
			if (this.#getMenu().isHidden()) {
				return null;
			}
			main_core.Dom.attr(button, {
				'aria-haspopup': 'menu',
				'aria-expanded': 'false'
			});
			if (this.#getMenu().isDisabled()) {
				const description = this.#getDisabledDescription();
				main_core.Dom.append(description, container);
				main_core.Dom.attr(button, {
					'aria-disabled': 'true',
					'aria-describedby': description.id
				});
				main_core.Dom.attr(container, 'data-hint', '');
				main_core.Dom.attr(container, 'data-hint-interactivity', '');
				main_core.Event.bind(container, 'mouseenter', () => {
					this.#getHintInstance().show(container, this.options.disabledHint);
				});
				main_core.Event.bind(container, 'mouseleave', () => {
					setTimeout(() => {
						const hintPopup = this.#getHintInstance()?.popup?.popupContainer;
						if (!hintPopup || !hintPopup.matches(':hover')) {
							this.#getHintInstance().hide(container);
						}
					}, 100);
				});
			}
			return container;
		}
		onClick() {
			if (this.#getMenu().isHidden() || this.#getMenu().isDisabled()) {
				return;
			}
			Analytics.send(Analytics.EVENT_CLICK_SALARY);
			this.#getMenu().show(this.getButton());
			this.#syncMenuState();
		}
		#syncMenuState() {
			const popup = main_popup.PopupManager.getPopupById(SALARY_VACATION_MENU_ID);
			if (!popup) {
				return;
			}
			this.cache.remember('salaryMenuStateHandlers', () => {
				popup.subscribe('onShow', () => {
					main_core.Dom.attr(this.getButton(), 'aria-expanded', 'true');
				});
				popup.subscribe('onClose', () => {
					main_core.Dom.attr(this.getButton(), 'aria-expanded', 'false');
				});
				return true;
			});
			main_core.Dom.attr(this.getButton(), 'aria-expanded', popup.isShown() ? 'true' : 'false');
			main_core.Dom.attr(popup.getPopupContainer(), 'aria-label', this.getTitle());
		}
		#getMenu() {
			return this.cache.remember('salaryMenu', () => {
				return new humanresources_hcmlink_salaryVacationMenu.SalaryVacationMenu();
			});
		}
		#getHintInstance() {
			return this.cache.remember('hint', () => {
				return BX.UI.Hint.createInstance({
					popupParameters: {
						fixed: true
					}
				});
			});
		}
		#getDisabledDescription() {
			return this.cache.remember('disabledDescription', () => {
				const hintContainer = main_core.Tag.render`<div>${this.options.disabledHint}</div>`;
				return main_core.Tag.render`
				<visually-hidden id="intranet-avatar-widget-salary-vacation-disabled-description">
					${main_core.Text.encode(hintContainer.textContent)}
				</visually-hidden>
			`;
			});
		}
		getId() {
			return 'salary-vacation';
		}
	}

	class MainContent extends Content {
		#activeOnclick = true;
		getConfig() {
			return {
				html: this.getLayout()
			};
		}
		getOptions() {
			return super.getOptions();
		}
		#handleClickTaskStatus(event) {
			event.stopPropagation();
			event.preventDefault();
		}
		getLayout() {
			return this.cache.remember('layout', () => {
				this.#setEventHandlers();
				const onclick = () => {
					if (this.#activeOnclick) {
						BX.SidePanel.Instance.open(this.getOptions().url);
						Analytics.sendOpenProfile();
					}
				};
				const profileButton = this.#getProfileButton(onclick);
				return main_core.Tag.render`
				<div class="intranet-avatar-widget-item__wrapper" data-testid="bx-avatar-widget-content-main">
					${profileButton}
					${this.#getStatus()}
					${this.#getWorkStatusBlock()}
					${this.#getToolsContainer()}
				</div>
			`;
			});
		}
		#getProfileButton(onclick) {
			return this.cache.remember('profileButton', () => main_core.Tag.render`
			<button
				type="button"
				onclick="${onclick}"
				class="intranet-avatar-widget-item-main__wrapper-head"
				aria-label="${this.#getProfileButtonLabel()}"
			>
				<div class="intranet-avatar-widget-item__avatar">
					${this.#getAvatar().getContainer()}
				</div>
				<div class="intranet-avatar-widget-item__info-wrapper">
					${this.#getFullName()}
					${this.#getWorkPosition()}
				</div>
			</button>
		`);
		}
		#getProfileButtonLabel() {
			return main_core.Loc.getMessage('INTRANET_AVATAR_WIDGET_OPEN_USER_PROFILE', {
				'#NAME#': this.getOptions().fullName
			});
		}
		#getFullName() {
			return this.cache.remember('title', () => {
				return main_core.Tag.render`
				<span class="intranet-avatar-widget-item__title">
					<span>${this.getOptions().fullName}</span>
					<i aria-hidden="true" class="ui-icon-set --chevron-right-s intranet-avatar-widget-item__chevron"/>
				</span>
			`;
			});
		}
		#getWorkPosition() {
			return this.cache.remember('workPosition', () => {
				if (!this.getOptions().workPosition) {
					return null;
				}
				return main_core.Tag.render`
				<span class="intranet-avatar-widget-item__description">${this.getOptions().workPosition}</span>
			`;
			});
		}
		#getAvatar() {
			return this.cache.remember('avatar', () => {
				const options = {
					size: 48,
					userpicPath: encodeURI(this.getOptions().userPhotoSrc)
				};
				let avatar = null;
				if (this.getOptions().role === 'extranet') {
					avatar = new ui_avatar.AvatarRoundExtranet(options);
				} else if (this.getOptions().role === 'collaber') {
					avatar = new ui_avatar.AvatarRoundGuest(options);
				} else {
					avatar = new ui_avatar.AvatarRound(options);
				}
				return avatar;
			});
		}
		#getStatus() {
			return this.cache.remember('status', () => {
				if (!this.getOptions().status && !this.getOptions().vacation) {
					return null;
				}
				const wrapper = main_core.Tag.render`
				<div class="intranet-avatar-widget-main__status-wrapper"></div>
			`;
				if (this.getOptions().vacation) {
					main_core.Dom.append(main_core.Tag.render`
					<span class="intranet-avatar-widget-main__status --vacation">
						${this.getOptions().vacation}
					</span>
				`, wrapper);
				}
				if (this.getOptions().status) {
					const status = main_core.Tag.render`
					<span class="intranet-avatar-widget-main__status">
						${this.getOptions().status}
					</span>
				`;
					if (this.getOptions().role === 'collaber') {
						main_core.Dom.addClass(status, '--collaber');
					} else if (this.getOptions().role === 'extranet') {
						main_core.Dom.addClass(status, '--extranet');
					}
					main_core.Dom.append(status, wrapper);
				}
				return wrapper;
			});
		}
		#getWorkStatusBlock() {
			return this.cache.remember('worktime', () => {
				if (!this.getOptions().isTimemanAvailable) {
					return null;
				}
				if (!this.#getWorkStatusControlPanel()) {
					return null;
				}
				return main_core.Tag.render`
				<div
					class="intranet-avatar-widget-item__task-status task-status"
					onclick="${this.#handleClickTaskStatus}"
				>
					${this.#getWorkStatusControlPanel()}
				</div>
			`;
			});
		}
		#getWorkStatusControlPanel() {
			return this.cache.remember('taskStatusActions', () => {
				try {
					return new timeman_workStatusControlPanel.WorkStatusControlPanel().renderWorkStatusControlPanel();
				} catch (error) {
					console.error(error);
					return null;
				}
			});
		}
		#getToolsContainer() {
			return this.cache.remember('tools-container', () => {
				if (!this.getOptions().tools || Object.keys(this.getOptions().tools).length === 0) {
					return null;
				}
				const container = main_core.Tag.render`
				<div class="intranet-avatar-widget-main-tools__wrapper"></div>
			`;
				const tools = this.#getTools();
				main_core.Dom.style(container, 'grid-template-columns', `repeat(${tools.length}, 1fr)`);
				tools.forEach(tool => {
					main_core.Dom.append(tool.getLayout(), container);
				});
				return container;
			});
		}
		#getTools() {
			return this.cache.remember('tools', () => {
				const tools = this.getOptions().tools;
				return [tools.myDocuments ? new MyDocumentsTool(tools.myDocuments) : null, tools.salaryVacation ? new SalaryVacationTool(tools.salaryVacation) : null, tools.security ? new SecurityTool(tools.security) : null, tools.extension ? new ExtensionTool(tools.extension) : null].filter(Boolean);
			});
		}
		#setEventHandlers() {
			main_core_events.EventEmitter.subscribe('BX.Intranet.UserProfile:Avatar:changed', ({
				data: [{
					url,
					userId
				}]
			}) => {
				if (this.getOptions().id > 0 && userId && this.getOptions().id.toString() === userId.toString()) {
					const preparedUrl = encodeURI(url);
					this.getOptions().userPhotoSrc = preparedUrl;
					this.#getAvatar().setUserPic(preparedUrl);
				}
			});
			main_core_events.EventEmitter.subscribe('BX.Intranet.UserProfile:Name:changed', ({
				data: [{
					fullName
				}]
			}) => {
				this.getOptions().fullName = fullName;
				this.#getFullName().querySelector('span').innerHTML = fullName;
				main_core.Dom.attr(this.#getProfileButton(), 'aria-label', this.#getProfileButtonLabel());
			});
			main_core_events.EventEmitter.subscribe('BX.Intranet.AvatarWidget.Popup:enabledAutoHide', () => {
				this.#activeOnclick = true;
			});
			main_core_events.EventEmitter.subscribe('BX.Intranet.AvatarWidget.Popup:disabledAutoHide', () => {
				this.#activeOnclick = false;
			});
		}
	}

	class HeaderSubsectionContent extends Content {
		getConfig() {
			return {
				html: this.getLayout()
			};
		}
		getLayout() {
			return this.cache.remember('layout', () => {
				return main_core.Tag.render`
				<div data-testid="bx-avatar-widget-content-${this.getId()}" class="intranet-avatar-widget-item__wrapper">
					<div class="intranet-avatar-widget-item-subsection__header">
						${this.#getBackButton().render()}
						<span class="intranet-avatar-widget-item-subsection__title">
							${this.getOptions().title}
						</span>
					</div>
					${this.getContentWrapper()}
				</div>
			`;
			});
		}
		#getBackButton() {
			return this.cache.remember('backButton', () => {
				const button = new ui_buttons.Button({
					icon: 'chevron-left-l',
					size: ui_buttons.Button.Size.EXTRA_EXTRA_SMALL,
					style: ui_buttons.AirButtonStyle.OUTLINE,
					useAirDesign: true,
					onclick: () => {
						main_core_events.EventEmitter.emit('BX.Intranet.AvatarWidget.Subsection:back');
					}
				});
				button.setCollapsed(true);
				button.render().setAttribute('aria-label', main_core.Loc.getMessage('INTRANET_AVATAR_WIDGET_BACK'));
				return button;
			});
		}
		getId() {
			return '';
		}
	}

	class MobileAuthContent extends HeaderSubsectionContent {
		getContentWrapper() {
			return this.cache.remember('content', () => {
				return main_core.Tag.render`
				<div class="intranet-avatar-widget-fast-mobile-auth__wrapper">
					${this.#getQR().render()}
					${this.#getWarning()}
				</div>
			`;
			});
		}
		getId() {
			return 'mobile-auth';
		}
		#getQR() {
			return this.cache.remember('qr', () => {
				return new ui_shortQrAuth.ShortQrAuth({
					intent: 'profile',
					small: false,
					stub: false
				});
			});
		}
		#getWarning() {
			return this.cache.remember('warning', () => {
				return main_core.Tag.render`
				<div class="intranet-avatar-widget-fast-mobile-auth-tool__warning">
					${this.getOptions().warning}
				</div>
			`;
			});
		}
	}

	class Popup extends main_core_events.EventEmitter {
		#cache = new main_core.Cache.MemoryCache();
		#popupsShowAfterBasePopup = [];
		#subsectionFocusTarget = null;
		constructor(options) {
			super();
			this.setOptions(options);
			this.setEventNamespace('BX.Intranet.AvatarWidget.Popup');
			this.setEventHandlers();
		}
		setOptions(options) {
			this.#cache.set('options', options);
		}
		getOptions() {
			return this.#cache.get('options', {});
		}
		show({
			focusFirst = false
		} = {}) {
			const popup = this.getBasePopup();
			const isShown = popup.isShown();
			if (isShown) {
				if (focusFirst && !this.focusFirst()) {
					popup.getPopup().subscribeOnce('onAfterShow', () => this.focusFirst());
				}
				return;
			}
			if (focusFirst && !isShown) {
				popup.getPopup().subscribeOnce('onAfterShow', () => this.focusFirst());
			}
			popup.show();
			this.emit('show');
			Analytics.send(Analytics.EVENT_OPEN_WIDGET);
		}
		focusFirst() {
			return ui_a11y.FocusNavigator.focusContainer(this.getBasePopup().getPopup().getPopupContainer(), {
				preventScroll: true
			});
		}
		close() {
			this.getBasePopup().close();
		}
		getBasePopup() {
			return this.#cache.remember('popup', () => {
				this.emit('beforeInit');
				const popup = new ui_popupcomponentsmaker.PopupComponentsMaker({
					target: this.getOptions().target,
					width: 390,
					content: this.#getContent(),
					popupLoader: this.getOptions().loader,
					padding: 0,
					offsetTop: -50,
					offsetLeft: 0
				});
				popup.getPopup().setFixed(true);
				const setOverlay = () => {
					if (BX.SidePanel.Instance.isOpen()) {
						popup.getPopup().setOverlay({
							backgroundColor: 'transparent'
						});
						popup.getPopup().showOverlay();
					}
				};
				setOverlay();
				popup.getPopup().subscribe('onClose', () => {
					this.#popupsShowAfterBasePopup = [];
					popup.getPopup().removeOverlay();
				});
				popup.getPopup().subscribe('onAfterClose', () => {
					popup.getPopup().setContent(this.#cache.get('contentWrapper') ?? popup.getContentWrapper());
				});
				popup.getPopup().subscribe('onBeforeShow', setOverlay);
				this.#cache.set('popup', popup);
				this.#cache.set('contentWrapper', popup.getContentWrapper());
				this.emit('afterInit');
				return popup;
			});
		}
		#getContent() {
			return this.#cache.remember('content', () => {
				const content = [this.#getMainContent().getConfig()];
				if (this.getOptions().content.promo) {
					content.push(this.#getAnnualSummaryContent().getConfig());
				}
				content.push(this.#getApplicationContent().getConfig());
				if (this.getOptions().content.extranetSecondary) {
					content.push(this.#getExtranetSecondaryContent().getConfig());
				}
				if (this.getOptions().content.secondary) {
					content.push(this.#getSecondaryContent().getConfig());
				}
				content.push(this.#getFooterContent().getConfig());
				return content;
			});
		}
		#getAnnualSummaryContent() {
			return this.#cache.remember('annualSummaryContent', () => {
				return new AnnualSummaryContent({
					...this.getOptions().content.promo.tools.annualSummary
				});
			});
		}
		#getMainContent() {
			return this.#cache.remember('mainContent', () => {
				return new MainContent({
					...this.getOptions().content.main
				});
			});
		}
		#getSecondaryContent() {
			return this.#cache.remember('secondaryContent', () => {
				return new SecondaryContent({
					...this.getOptions().content.secondary
				});
			});
		}
		#getApplicationContent() {
			return this.#cache.remember('applicationContent', () => {
				return new ApplicationContent({
					...this.getOptions().content.application
				});
			});
		}
		#getFooterContent() {
			return this.#cache.remember('footerContent', () => {
				return new FooterContent({
					...this.getOptions().content.footer
				});
			});
		}
		#getMobileAuthContent() {
			return this.#cache.remember('mobileAuthContent', () => {
				return new MobileAuthContent({
					...this.getOptions().content.mobileAuth.tools.fastMobileAuth
				});
			});
		}
		#getFastMobileAuthSubsection() {
			return this.#cache.remember('fastMobileAuthSubsection', () => {
				return new ui_popupcomponentsmaker.PopupComponentsMaker({
					content: [this.#getMobileAuthContent().getConfig()]
				}).getContentWrapper();
			});
		}
		#getExtranetSecondaryContent() {
			return this.#cache.remember('extranetSecondaryContent', () => {
				return new ExtranetSecondaryContent({
					...this.getOptions().content.extranetSecondary
				});
			});
		}
		setEventHandlers() {
			this.subscribe('beforeInit', () => {
				main_core_events.EventEmitter.subscribe('BX.Intranet.AvatarWidget.Popup:makeWithHint', () => {
					this.subscribe('afterInit', () => {
						BX.UI.Hint.init(this.getBasePopup().getPopup().getPopupContainer());
					});
				});
				this.subscribe('afterInit', () => {
					this.#setAutoHideEventHandlers();
					this.#setSubsectionEventHandlers();
					const close = () => {
						this.close();
					};
					main_core_events.EventEmitter.subscribe('SidePanel.Slider:onOpenStart', close);
					main_core_events.EventEmitter.subscribe('BX.Intranet.AvatarWidget.Popup:openChild', close);
				});
			});
		}
		#setAutoHideEventHandlers() {
			main_core_events.EventEmitter.subscribe('BX.Main.Popup:onShow', event => {
				if (!this.getBasePopup().getPopup().isShown()) {
					return;
				}
				main_core.Dom.style(this.getBasePopup().getPopup().getPopupContainer(), 'overflow-y', 'hidden');
				const popup = event.getTarget();
				if (popup && popup.getId() === this.getBasePopup().getPopup().getId()) {
					this.getBasePopup().getPopup().setAutoHide(true);
					main_core_events.EventEmitter.emit('BX.Intranet.AvatarWidget.Popup:enabledAutoHide');
				} else {
					this.getBasePopup().getPopup().setAutoHide(false);
					main_core_events.EventEmitter.emit('BX.Intranet.AvatarWidget.Popup:disabledAutoHide');
					if (!this.#popupsShowAfterBasePopup.includes(popup)) {
						this.#popupsShowAfterBasePopup.push(popup);
					}
					const handler = () => {
						this.#popupsShowAfterBasePopup = this.#popupsShowAfterBasePopup.filter(item => item !== popup);
						if (this.#popupsShowAfterBasePopup.length === 0) {
							this.getBasePopup().getPopup().setAutoHide(true);
							main_core.Dom.style(this.getBasePopup().getPopup().getPopupContainer(), 'overflow-y', 'auto');
							main_core_events.EventEmitter.emit('BX.Intranet.AvatarWidget.Popup:enabledAutoHide');
						}
					};
					popup.subscribeOnce('onClose', handler);
					popup.subscribeOnce('onDestroy', handler);
				}
			});
		}
		#setSubsectionEventHandlers() {
			const openFastMobileAuthSubsection = (focusTarget = null) => {
				const popup = this.getBasePopup().getPopup();
				const subsection = this.#getFastMobileAuthSubsection();
				this.#subsectionFocusTarget = focusTarget;
				ui_a11y.FocusNavigator.focusContainer(popup.getPopupContainer());
				popup.setContent(subsection);
				ui_a11y.FocusNavigator.focusBySelector(subsection, '.intranet-avatar-widget-item-subsection__header button');
			};
			main_core_events.EventEmitter.subscribe('BX.Intranet.AvatarWidget.FastMobileAuthTool:onClick', event => {
				openFastMobileAuthSubsection(event.getData()?.focusTarget);
			});
			main_core_events.EventEmitter.subscribe('BX.Intranet.AvatarWidget.ApplicationInstallerTool:onClick', event => {
				openFastMobileAuthSubsection(event.getData()?.focusTarget);
			});
			main_core_events.EventEmitter.subscribe('BX.Intranet.AvatarWidget.Subsection:back', () => {
				const popup = this.getBasePopup().getPopup();
				const contentWrapper = this.getBasePopup().getContentWrapper();
				ui_a11y.FocusNavigator.focusContainer(popup.getPopupContainer());
				popup.setContent(contentWrapper);
				if (this.#subsectionFocusTarget?.isConnected) {
					ui_a11y.FocusNavigator.restoreFocus(this.#subsectionFocusTarget);
				} else {
					ui_a11y.FocusNavigator.focusFirst(contentWrapper);
				}
				this.#subsectionFocusTarget = null;
			});
		}
	}

	class AvatarWidget {
		#cache = new main_core.Cache.MemoryCache();
		static #instance;
		static getInstance() {
			if (!this.#instance) {
				this.#instance = new this();
			}
			return this.#instance;
		}
		show(options = {}) {
			this.#getPopup().show(options);
		}
		setOptions(options) {
			this.#cache.set('options', options);
			return this;
		}
		getOptions() {
			return this.#cache.get('options', {});
		}
		#getPopup() {
			return this.#cache.remember('popup', () => {
				return new Popup({
					target: this.getOptions().buttonWrapper,
					loader: this.getOptions().loader,
					content: {
						...this.getOptions().data
					}
				});
			});
		}
	}

	exports.AvatarWidget = AvatarWidget;

})(this.BX.Intranet = this.BX.Intranet || {}, BX, BX.Event, BX.UI.Accessibility, BX.UI, BX.UI.Analytics, BX.UI, BX.UI, BX.Main, BX.Intranet, BX.Intranet, BX.SidePanel, BX.Messenger.v2.Lib, BX.UI, BX.Timeman, BX, BX.UI, BX.Crm, BX.HumanResources.HcmLink, BX.UI);
//# sourceMappingURL=avatar-widget.bundle.js.map
