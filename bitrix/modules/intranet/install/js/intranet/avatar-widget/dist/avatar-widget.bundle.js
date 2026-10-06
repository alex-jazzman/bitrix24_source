/* eslint-disable */
this.BX = this.BX || {};
(function (exports, main_core, main_core_events, ui_popupcomponentsmaker, ui_analytics, ui_cnt, ui_buttons, main_popup, intranet_desktopDownload, intranet_desktopAccountList, main_sidepanel, im_v2_lib_desktopApi, ui_avatar, timeman_workStatusControlPanel, pull_client, ui_infoHelper, crm_router, humanresources_hcmlink_salaryVacationMenu, ui_shortQrAuth) {
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
				<div
						data-testid="bx-avatar-widget-tool-${this.getId()}"
						onclick="${this.onClick.bind(this)}"
						class="intranet-avatar-widget-item__wrapper intranet-avatar-widget-annual-summary-tool__wrapper"
						>
						<div class="intranet-avatar-widget-annual-summary-tool__background"></div>
						<span class="intranet-avatar-widget-annual-summary-tool__title">
							${this.getTitle()}
						</span>
				</div>
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
			main_core.Dom.addClass(this.getLayout(), 'intranet-avatar-widget-annual-summary-tool__wrapper--loading');
			Promise.all([main_core.ajax.runAction('intranet.v2.AnnualSummary.load', {}), main_core.Runtime.loadExtension('intranet.notify-banner.annual-summary')]).then(([response, {
				AnnualSummary
			}]) => {
				const {
					topFeatures,
					options
				} = response.data;
				main_core.Dom.removeClass(this.getLayout(), 'intranet-avatar-widget-annual-summary-tool__wrapper--loading');
				main_core_events.EventEmitter.emit('BX.Intranet.AvatarWidget.Popup:openChild');
				this.#annualSummaryPopup = new AnnualSummary(topFeatures, {
					...options,
					section: 'profile'
				});
				this.#annualSummaryPopup.subscribe('onShow', () => BX.userOptions.save('intranet', 'annual_summary_25_last_show', null, Math.floor(Date.now() / 1000)));
				this.#annualSummaryPopup.show();
			}).catch(error => {
				console.error(error);
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
				return main_core.Tag.render`
				<div data-testid="bx-avatar-widget-tool-${this.getId()}" onclick="${this.onClick.bind(this)}" class="intranet-avatar-widget-secondary-tool__wrapper">
					${this.getIconElement()}
					<div class="intranet-avatar-widget-item__info-wrapper">
						<span class="intranet-avatar-widget-item__title">
							${this.getTitle()}
						</span>
					</div>
					${this.#getCounterWrapper()}
					${this.getActionElement()}
				</div>
			`;
			});
		}
		getIconElement() {
			return this.cache.remember('icon', () => {
				return main_core.Tag.render`<i class="ui-icon-set ${this.getIconClass()} intranet-avatar-widget-secondary-tool__icon"/>`;
			});
		}
		getActionElement() {
			return this.cache.remember('actionElement', () => {
				return main_core.Tag.render`<i class="ui-icon-set --chevron-right-m intranet-avatar-widget-item__chevron"/>`;
			});
		}
		getCounter() {
			return null;
		}
		getId() {
			return '';
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
		onClick() {
			Analytics.send(Analytics.EVENT_CLICK_INSTALL_MOBILE_APP);
			main_core_events.EventEmitter.emit('BX.Intranet.AvatarWidget.FastMobileAuthTool:onClick');
		}
	}

	class FastMobileAuthTool extends BaseSecondaryTool {
		getIconClass() {
			return '--o-qr-code';
		}
		onClick() {
			Analytics.send(Analytics.EVENT_CLICK_FAST_MOBILE_AUTH);
			main_core_events.EventEmitter.emit('BX.Intranet.AvatarWidget.FastMobileAuthTool:onClick');
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
						<div class="intranet-avatar-widget-secondary-tool-icons__seporator"></div>
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
					const onclick = element => {
						this.#getInstallMenu(element.target).toggle();
					};
					return main_core.Tag.render`
					<i onclick="${onclick}" class="ui-icon-set --more-m intranet-avatar-widget-item__more"/>
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
				return main_core.Tag.render`
				<span class="intranet-avatar-widget-secondary-tool-application__button-wrapper">
					${button}
				</span>
			`;
			});
		}
		#getMobileIcon() {
			return this.cache.remember('mobileIcon', () => {
				let className = 'ui-icon-set --mobile-selected intranet-avatar-widget-secondary-tool-application__icon';
				if (this.options.mobile.installed) {
					className += ' --installed';
				}
				return main_core.Tag.render`
				<i class="${className}"/>
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
				<i class="${className}"/>
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
					items,
					offsetLeft: 5,
					angle: true,
					fixed: true
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
							main_core_events.EventEmitter.emit('BX.Intranet.AvatarWidget.ApplicationInstallerTool:onClick');
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
				window.open(this.options.path, '_blank');
			}
		}
		getId() {
			return 'account-changer';
		}
	}

	class AdministrationTool extends BaseSecondaryTool {
		getIconClass() {
			return '--o-filter-2-lines';
		}
		onClick() {
			window.open(this.options.path, '_blank');
		}
		getId() {
			return 'administration';
		}
	}

	class PerformanUserProfileTool extends BaseSecondaryTool {
		getIconClass() {
			return '--o-achievement';
		}
		onClick() {
			window.open(this.options.path || '/performan/', '_blank');
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
			<div data-testid="bx-avatar-widget-footer-tool-${this.getId()}" onclick="${this.onClick.bind(this)}" class="intranet-avatar-widget-footer__item">
				${this.getTitle()}
			</div>
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
				return main_core.Tag.render`
				<div data-testid="bx-avatar-widget-main-tool-${this.getId()}" onclick="${this.onClick.bind(this)}" class="intranet-avatar-widget-main-tool__wrapper">
					<div class="intranet-avatar-widget-main-tool-icon__wrapper">
						${this.getIconElement()}
						${this.#getCounterWrapper()}
					</div>
					<div class="intranet-avatar-widget-main-tool__title">
						${this.getTitle()}
					</div>
				</div>
			`;
			});
		}
		getIconElement() {
			return this.cache.remember('icon', () => {
				return main_core.Tag.render`<i class="ui-icon-set ${this.getIconClass()} intranet-avatar-widget-main-tool__icon"/>`;
			});
		}
		getCounter() {
			return null;
		}
		getId() {
			return '';
		}
		#getCounterWrapper() {
			return this.cache.remember('counterWrapper', () => {
				const counter = this.getCounter();
				return main_core.Tag.render`
				<div class="intranet-avatar-widget-main-tool__counter-wrapper">
					${counter?.render()}
				</div>
			`;
			});
		}
	}

	class ExtensionTool extends BaseMainTool {
		getIconClass() {
			return '--o-box';
		}
		onClick() {
			Analytics.send(Analytics.EVENT_CLICK_EXTENSION);
			this.#getMenu().toggle();
		}
		#getMenu() {
			return this.cache.remember('menu', () => {
				const menu = new main_popup.Menu({
					bindElement: this.getIconElement(),
					items: this.options.items,
					angle: true,
					cachable: false,
					offsetLeft: 10,
					fixed: true
				});
				main_core_events.EventEmitter.subscribe('SidePanel.Slider:onOpenStart', () => {
					menu.close();
				});
				return menu;
			});
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

	class SalaryVacationTool extends BaseMainTool {
		getIconClass() {
			return '--o-favorite';
		}
		getLayout() {
			const container = super.getLayout();
			if (this.#getMenu().isHidden()) {
				return null;
			}
			if (this.#getMenu().isDisabled()) {
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
			return super.getLayout();
		}
		onClick() {
			Analytics.send(Analytics.EVENT_CLICK_SALARY);
			if (!this.#getMenu().isHidden() && !this.#getMenu().isDisabled()) {
				this.#getMenu().show(this.getLayout());
			}
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
				return main_core.Tag.render`
				<div class="intranet-avatar-widget-item__wrapper" data-testid="bx-avatar-widget-content-main">
					<div onclick="${onclick}" class="intranet-avatar-widget-item-main__wrapper-head">
						<div class="intranet-avatar-widget-item__avatar">
							${this.#getAvatar().getContainer()}
						</div>
						<div class="intranet-avatar-widget-item__info-wrapper">
							${this.#getFullName()}
							${this.#getWorkPosition()}
						</div>
					</div>
					${this.#getStatus()}
					${this.#getWorkStatusBlock()}
					${this.#getToolsContainer()}
				</div>
			`;
			});
		}
		#getFullName() {
			return this.cache.remember('title', () => {
				return main_core.Tag.render`
				<span class="intranet-avatar-widget-item__title">
					<span>${this.getOptions().fullName}</span>
					<i class="ui-icon-set --chevron-right-s intranet-avatar-widget-item__chevron"/>
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
		show() {
			this.getBasePopup().show();
			this.emit('show');
			Analytics.send(Analytics.EVENT_OPEN_WIDGET);
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
			const openFastMobileAuthSubsection = () => {
				const subsection = this.#getFastMobileAuthSubsection();
				this.getBasePopup().getPopup().setContent(subsection);
			};
			main_core_events.EventEmitter.subscribe('BX.Intranet.AvatarWidget.FastMobileAuthTool:onClick', openFastMobileAuthSubsection);
			main_core_events.EventEmitter.subscribe('BX.Intranet.AvatarWidget.ApplicationInstallerTool:onClick', openFastMobileAuthSubsection);
			main_core_events.EventEmitter.subscribe('BX.Intranet.AvatarWidget.Subsection:back', () => {
				this.getBasePopup().getPopup().setContent(this.getBasePopup().getContentWrapper());
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
		show() {
			if (this.#getPopup().getBasePopup().isShown()) {
				return;
			}
			this.#getPopup().show();
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

})(this.BX.Intranet = this.BX.Intranet || {}, BX, BX.Event, BX.UI, BX.UI.Analytics, BX.UI, BX.UI, BX.Main, BX.Intranet, BX.Intranet, BX.SidePanel, BX.Messenger.v2.Lib, BX.UI, BX.Timeman, BX, BX.UI, BX.Crm, BX.HumanResources.HcmLink, BX.UI);
//# sourceMappingURL=avatar-widget.bundle.js.map
