/* eslint-disable */
this.BX = this.BX || {};
(function (exports, main_core_events, main_core, ui_analytics, ui_popupcomponentsmaker, main_popup, ui_cnt, main_loader) {
	'use strict';

	class Analytics {
		static TOOLS = 'headerPopup';
		static TOOLS_LEGACY = 'Invitation';
		static CATEGORY_INVITATION = 'invitation';
		static CATEGORY_INVITATION_LEGACY = 'invitation';
		static EVENT_NAME_LEGACY = 'drawer_open';
		static SECTION_POPUP = 'headerPopup';
		static EVENT_SHOW = 'show';
		static EVENT_OPEN_SLIDER_INVITATION = 'drawer_open';
		static EVENT_OPEN_STRUCTURE = 'vis_structure_open';
		static EVENT_OPEN_USER_LIST = 'company_open';
		static EVENT_OPEN_SLIDER_EXTRANET_INVITATION = 'extranetinvitation_open';
		static isAdmin = false;
		static send(event) {
			ui_analytics.sendData({
				tool: Analytics.TOOLS,
				category: Analytics.CATEGORY_INVITATION,
				event: event,
				p1: Analytics.isAdmin ? 'isAdmin_Y' : 'isAdmin_N'
			});
		}
		static sendCreateCollab() {
			ui_analytics.sendData({
				tool: 'im',
				category: 'collab',
				event: 'click_create_new',
				c_section: Analytics.SECTION_POPUP,
				p2: 'user_intranet' // widget is available only for intranet users
			});
		}
	}

	class Content extends main_core_events.EventEmitter {
		cache = new main_core.Cache.MemoryCache();
		constructor(options) {
			super();
			this.setEventNamespace('BX.Intranet.InvitationWidget.Content');
			this.setOptions(options);
			this.analytics = new Analytics();
		}
		setOptions(options) {
			this.cache.set('options', {
				...options
			});
		}
		getOptions() {
			return this.cache.get('options', {});
		}
		getLayout() {
			throw new Error('Must be implemented in a child class');
		}
		showInfoHelper(articleCode) {
			BX.UI.InfoHelper.show(articleCode);
			this.sendAnalytics(articleCode);
		}
		sendAnalytics(code) {
			main_core.ajax.runAction('intranet.invitationwidget.analyticsLabel', {
				data: {},
				analyticsLabel: {
					helperCode: code,
					headerPopup: 'Y'
				}
			});
		}
		getHintPopup(text, element, type) {
			return this.cache.remember(type, () => {
				return new main_popup.Popup(`bx-hint-${main_core.Text.getRandom()}`, element, {
					content: text,
					className: 'bx-invitation-warning',
					zIndex: 15000,
					angle: true,
					offsetTop: 0,
					offsetLeft: 40,
					closeIcon: false,
					autoHide: true,
					darkMode: true,
					overlay: false,
					maxWidth: 300,
					events: {
						onShow: event => {
							main_core_events.EventEmitter.emit(main_core_events.EventEmitter.GLOBAL_TARGET, 'BX.Intranet.InvitationWidget.HintPopup:show', new main_core_events.BaseEvent({
								data: {
									popup: event.target
								}
							}));
							const timeout = setTimeout(() => {
								event.target.close();
							}, 4000);
							main_core_events.EventEmitter.subscribeOnce(main_core_events.EventEmitter.GLOBAL_TARGET, 'BX.Intranet.InvitationWidget.HintPopup:close', () => {
								clearTimeout(timeout);
							});
						},
						onClose: () => {
							main_core_events.EventEmitter.emit(main_core_events.EventEmitter.GLOBAL_TARGET, 'BX.Intranet.InvitationWidget.HintPopup:close');
						}
					}
				});
			});
		}
		showHintPopup(text, element, type) {
			this.getHintPopup(text, element, type).toggle();
		}
		showInvitationPlace(text, element, type) {
			if (this.getOptions().isInvitationAvailable) {
				this.showInvitationSlider(type);
			} else {
				this.showHintPopup(text, element, 'hint-' + type);
			}
		}
		showInvitationSlider(type) {
			let link = this.getOptions().invitationLink;
			if (type === 'extranet') {
				link = `${link}&firstInvitationBlock=extranet`;
			}
			BX.SidePanel.Instance.open(link, {
				cacheable: false,
				allowChangeHistory: false,
				width: 1100
			});
		}
		getConfig() {
			return {
				html: this.getLayout()
			};
		}
	}

	class InvitationContent extends Content {
		constructor(options) {
			super(options);
			this.setEventNamespace('BX.Intranet.InvitationWidget.InvitationContent');
			this.setOptions(options);
		}
		getConfig() {
			return {
				html: this.getLayout(),
				backgroundColor: '#14bfd5'
			};
		}
		getLayout() {
			return this.cache.remember('layout', () => {
				const showInvitationSlider = e => {
					e.stopPropagation();
					this.showInvitationPlace(main_core.Loc.getMessage('INTRANET_INVITATION_WIDGET_DISABLED_TEXT_MSGVER_1'), e.target, 'default-invitation');
				};
				const showInvitationHelper = () => {
					this.showInfoHelper('limit_why_team_invites');
				};
				return main_core.Tag.render`
				<div data-id="bx-invitation-widget-content-invitation" class="intranet-invitation-widget-invite">
					<div class="intranet-invitation-widget-invite-main">
						<div class="intranet-invitation-widget-inner">
							<div class="intranet-invitation-widget-content">
								<div class="intranet-invitation-widget-item-icon intranet-invitation-widget-item-icon--invite"></div>
								<div class="intranet-invitation-widget-item-content">
									<div class="intranet-invitation-widget-item-name">
										<span>
											${main_core.Loc.getMessage('INTRANET_INVITATION_WIDGET_INVITE_EMPLOYEE')}
										</span>
									</div>
									<div class="intranet-invitation-widget-item-link">
										<span onclick="${showInvitationHelper}" class="intranet-invitation-widget-item-link-text">
											${main_core.Loc.getMessage('INTRANET_INVITATION_WIDGET_DESC')}
										</span>
									</div>
								</div>
							</div>
							<a onclick="${showInvitationSlider}" class="intranet-invitation-widget-item-btn intranet-invitation-widget-item-btn--invite"> 
								${main_core.Loc.getMessage('INTRANET_INVITATION_WIDGET_INVITE')}
							</a>
						</div>
					</div>
				</div>
			`;
			});
		}
	}

	class StructureContent extends Content {
		constructor(options) {
			super(options);
			this.setEventNamespace('BX.Intranet.InvitationWidget.StructureContent');
		}
		getConfig() {
			this.#showCounter();
			if (this.getOptions().shouldShowStructureCounter) {
				main_core_events.EventEmitter.subscribeOnce('HR.company-structure:first-popup-showed', this.#onFirstWatchNewStructure.bind(this));
			}
			return {
				html: this.getLayout(),
				flex: 3
			};
		}
		getLayout() {
			return this.cache.remember('layout', () => {
				const onclick = () => {
					Analytics.send(Analytics.EVENT_OPEN_STRUCTURE);
				};
				return main_core.Tag.render`
				<div data-id="bx-invitation-widget-content-structure" class="intranet-invitation-widget-item intranet-invitation-widget-item--company intranet-invitation-widget-item--active">
					<div class="intranet-invitation-widget-item-logo"></div>
					<div class="intranet-invitation-widget-item-content">
						<div class="intranet-invitation-widget-item-name">
							<span>
								${main_core.Loc.getMessage('INTRANET_INVITATION_WIDGET_STRUCTURE')}
							</span>
						</div>
						<a onclick="${onclick}" href="${this.getOptions().structureLink}" class="intranet-invitation-widget-item-btn"> 
							${main_core.Loc.getMessage('INTRANET_INVITATION_WIDGET_EDIT')}
						</a>
					</div>
				</div>
			`;
			});
		}
		#getCounterWrapper() {
			return this.cache.remember('counter-wrapper', () => {
				return this.getLayout().querySelector('.intranet-invitation-widget-item-name');
			});
		}
		#showCounter() {
			if (this.#getCounterValue() > 0) {
				main_core.Dom.addClass(this.#getCounter().getContainer(), 'invitation-structure-counter');
				this.#getCounter().renderTo(this.#getCounterWrapper());
			}
		}
		#getCounter() {
			return this.cache.remember('counter', () => {
				return new ui_cnt.Counter({
					value: this.#getCounterValue(),
					color: ui_cnt.Counter.Color.DANGER
				});
			});
		}
		#getCounterValue() {
			return this.getOptions().shouldShowStructureCounter ? 1 : 0;
		}
		#onFirstWatchNewStructure() {
			const value = this.#getCounter().value;
			if (!main_core.Type.isNumber(value)) {
				return;
			}
			if (!this.getOptions().shouldShowStructureCounter) {
				return;
			}
			this.getOptions().shouldShowStructureCounter = false;
			this.#getCounter().destroy();
			this.cache.delete('counter');
		}
	}

	class EmployeesContent extends Content {
		#rightType;
		constructor(options) {
			super(options);
			this.setEventNamespace('BX.Intranet.InvitationWidget.EmployeesContent');
			this.#showCounter();
		}
		getConfig() {
			return {
				html: this.getLayout(),
				flex: 5,
				sizeLoader: 55
			};
		}
		getLayout() {
			return this.cache.remember('layout', () => {
				return main_core.Tag.render`
				<div data-id="bx-invitation-widget-content-employees" class="intranet-invitation-widget-item intranet-invitation-widget-item--emp ${this.getOptions().isLimit ? 'intranet-invitation-widget-item--emp-alert' : null}">
					<div class="intranet-invitation-widget-inner">
						<div class="intranet-invitation-widget-content">
							<div class="intranet-invitation-widget-item-content">
								<div onclick="${this.showUserList()}" class="intranet-invitation-widget-item-progress ${this.getOptions().isLimit ? 'intranet-invitation-widget-item-progress--crit' : 'intranet-invitation-widget-item-progress--full'}"/>
								<div class="intranet-invitation-widget-employees">
									<div onclick="${this.showUserList()}" class="intranet-invitation-widget-item-name">
										<span style="margin-right: 2px;">
											${main_core.Loc.getMessage('INTRANET_INVITATION_WIDGET_EMPLOYEES')}
										</span>
									</div>
									<div onclick="${this.showUserList()}" class="intranet-invitation-widget-item-num">
										${this.getOptions().users.currentUserCountMessage}
									</div>
								</div>
							</div>
							${this.getDetail()}
							${this.getOptions().isAdmin ? this.getSelectorRights() : null}
						</div>
					</div>
				</div>
			`;
			});
		}
		#showCounter() {
			if (this.getOptions().invitationCounter > 0) {
				this.#getCounter().renderTo(this.#getCounterWrapper());
			}
			BX.addCustomEvent('onPullEvent-main', this.#onReceiveCounterValue.bind(this));
		}
		#onReceiveCounterValue(command, params) {
			if (command === 'user_counter' && params[BX.message('SITE_ID')]) {
				const counters = BX.clone(params[BX.message('SITE_ID')]);
				const value = counters[this.getOptions().counterId];
				if (!main_core.Type.isNumber(value)) {
					return;
				}
				this.#getCounter().update(value);
				this.getOptions().invitationCounter = value;
				if (value > 0) {
					this.#getCounter().renderTo(this.#getCounterWrapper());
				} else {
					this.#getCounter().destroy();
					this.cache.delete('counter');
				}
			}
		}
		#getCounter() {
			return this.cache.remember('counter', () => {
				return new ui_cnt.Counter({
					value: Number(this.getOptions().invitationCounter),
					color: ui_cnt.Counter.Color.DANGER
				});
			});
		}
		#getCounterWrapper() {
			return this.cache.remember('counter-wrapper', () => {
				return this.getLayout().querySelector('.intranet-invitation-widget-item-name');
			});
		}
		getDetail() {
			return this.cache.remember('detail', () => {
				let content = '';
				if (Number(this.getOptions().users.maxUserCount) === 0) {
					content = main_core.Loc.getMessage('INTRANET_INVITATION_WIDGET_EMPLOYEES_NO_LIMIT');
				} else if (this.getOptions().isLimit) {
					content = main_core.Loc.getMessage('INTRANET_INVITATION_WIDGET_EMPLOYEES_LIMIT');
				} else {
					content = this.getOptions().users.leftCountMessage;
				}
				return main_core.Tag.render`
				<div onclick="${this.showUserList()}" class="intranet-invitation-widget-item-detail">
					<span class="intranet-invitation-widget-item-link-text">
						${content}
					</span>
				</div>
			`;
			});
		}
		showUserList() {
			return this.cache.remember('showUserList', () => {
				return () => {
					Analytics.send(Analytics.EVENT_OPEN_USER_LIST);
					document.location.href = '/company/';
				};
			});
		}
		getSelectorRights() {
			return this.cache.remember('selector-rights', () => {
				const showMenu = e => {
					e.stopPropagation();
					this.getRightsMenu(e.target).toggle();
				};
				const button = main_core.Tag.render`
				<div onclick="${showMenu}" class="intranet-invitation-widget-item-menu"></div>
			`;
				this.subscribe('right-selected', event => {
					const menu = this.getRightsMenu(button);
					menu.close();
					menu.destroy();
					if (event.data.type) {
						this.cache.delete('menu-rights');
						this.#rightType = event.data.type;
					}
				});
				return button;
			});
		}
		getRightsMenu(element) {
			return this.cache.remember('menu-rights', () => {
				return new main_popup.Menu(`menu-rights-${main_core.Text.getRandom()}`, element, this.getMenuRightsItems(), {
					autoHide: true,
					offsetLeft: 10,
					offsetTop: 0,
					angle: true,
					className: 'license-right-popup-men',
					events: {
						onPopupShow: popup => {
							main_core_events.EventEmitter.emit(main_core_events.EventEmitter.GLOBAL_TARGET, this.getEventNamespace() + ':showRightMenu', new main_core_events.BaseEvent({
								data: {
									popup: popup
								}
							}));
						},
						onPopupClose: popup => {
							main_core_events.EventEmitter.emit(main_core_events.EventEmitter.GLOBAL_TARGET, this.getEventNamespace() + ':closeRightMenu', new main_core_events.BaseEvent({
								data: {
									popup: popup
								}
							}));
						},
						onPopupFirstShow: popup => {
							main_core_events.EventEmitter.subscribe(main_core_events.EventEmitter.GLOBAL_TARGET, 'SidePanel.Slider:onOpenStart', () => {
								popup.close();
							});
						}
					}
				});
			});
		}
		getMenuRightsItems() {
			if (!this.#rightType) {
				this.#rightType = this.getOptions().users.rightType;
			}
			return [{
				text: main_core.Loc.getMessage('INTRANET_INVITATION_WIDGET_SETTING_ALL_INVITE'),
				className: this.#rightType === 'all' ? 'menu-popup-item-accept' : '',
				onclick: () => {
					this.saveInvitationRightSetting('all').then(() => {
						this.emit('right-selected', new main_core_events.BaseEvent({
							data: {
								type: 'all'
							}
						}));
					});
				}
			}, {
				text: main_core.Loc.getMessage('INTRANET_INVITATION_WIDGET_SETTING_ADMIN_INVITE'),
				className: this.#rightType === 'admin' ? 'menu-popup-item-accept' : '',
				onclick: () => {
					this.saveInvitationRightSetting('admin').then(() => {
						this.emit('right-selected', new main_core_events.BaseEvent({
							data: {
								type: 'admin'
							}
						}));
					});
				}
			}];
		}
		saveInvitationRightSetting(type) {
			return main_core.ajax.runAction("intranet.invitationwidget.saveInvitationRight", {
				data: {
					type: type
				}
			});
		}
	}

	class ExtranetContent extends Content {
		articleCode = "6770709";
		constructor(options) {
			super(options);
			this.setEventNamespace('BX.Intranet.InvitationWidget.ExtranetContent');
		}
		getConfig() {
			return {
				html: this.getLayout(),
				minHeight: '55px',
				sizeLoader: 37,
				marginBottom: 24,
				secondary: true
			};
		}
		getLayout() {
			return this.cache.remember('layout', () => {
				const showInvitationSlider = e => {
					e.stopPropagation();
					this.showInvitationPlace(main_core.Loc.getMessage('INTRANET_INVITATION_WIDGET_DISABLED_TEXT_MSGVER_1'), e.target, 'extranet');
				};
				const showExtranetHelper = () => {
					BX.Helper.show(`redirect=detail&code=${this.articleCode}`);
					this.sendAnalytics(this.articleCode);
				};
				return main_core.Tag.render`
				<div data-id="bx-invitation-widget-content-extranet" class="${this.getWrapperClass()}">
					<div class="intranet-invitation-widget-content">
						<div class="intranet-invitation-widget-item-icon intranet-invitation-widget-item-icon--ext"></div>
						<div class="intranet-invitation-widget-item-content">
							<div class="intranet-invitation-widget-item-name">
								<span>
									${main_core.Loc.getMessage('INTRANET_INVITATION_WIDGET_EXTRANET')}
								</span>
							</div>
							<div class="intranet-invitation-widget-item-link">
								<span onclick="${showExtranetHelper}" class="intranet-invitation-widget-item-link-text">
									${main_core.Loc.getMessage('INTRANET_INVITATION_WIDGET_EXTRANET_DESC')}
								</span>
							</div>
							${this.getCountUserMessage()}
						</div>
					</div>
					<button onclick="${showInvitationSlider}" class="intranet-invitation-widget-item-btn">
						${main_core.Loc.getMessage('INTRANET_INVITATION_WIDGET_INVITE')}
					</button>
				</div>
			`;
			});
		}
		getWrapperClass() {
			return this.cache.remember('wrapper-class', () => {
				const baseClass = 'intranet-invitation-widget-item intranet-invitation-widget-item--wide';
				if (this.getOptions().currentExtranetUserCount > 0) {
					return baseClass + ' intranet-invitation-widget-item--active';
				}
				return baseClass;
			});
		}
		getCountUserMessage() {
			return this.cache.remember('count-user-message', () => {
				if (this.getOptions().currentExtranetUserCount > 0) {
					return main_core.Tag.render`
					<div class="intranet-invitation-widget-item-ext-users">
						${this.getOptions().currentExtranetUserCountMessage}
					</div>
				`;
				}
				return null;
			});
		}
	}

	class CollabContent extends Content {
		#openChat;
		constructor(options) {
			super(options);
			this.setEventNamespace('BX.Intranet.InvitationWidget.CollabContent');
			const settings = main_core.Extension.getSettings('intranet.invitation-widget');
			this.isNewProjectsAvailable = settings?.isNewProjectsAvailable;
			this.canCreateProjects = settings?.canCreateProjects;
			this.articleCode = this.isNewProjectsAvailable ? '28397818' : '22706764';
		}
		getConfig() {
			const defaultHtml = this.getOptions().awaitData.then(response => {
				const {
					Messenger
				} = response;
				this.#openChat = () => {
					Messenger.openChatCreation('collab');
					Analytics.sendCreateCollab();
				};
				return this.getLayout();
			});
			const html = this.canCreateProjects ? defaultHtml : this.isNewProjectsAvailable ? '' : defaultHtml;
			return {
				html,
				minHeight: '55px',
				sizeLoader: 37,
				marginBottom: 24,
				secondary: true
			};
		}
		getLayout() {
			return this.cache.remember('layout', () => {
				const showInvitationSlider = e => {
					this.#openChat();
					e.stopPropagation();
				};
				const showCollabHelper = () => {
					BX.Helper.show(`redirect=detail&code=${this.articleCode}`);
					this.sendAnalytics(this.articleCode);
				};
				const itemNameMessage = this.isNewProjectsAvailable ? main_core.Loc.getMessage('INTRANET_INVITATION_WIDGET_PROJECT') : main_core.Loc.getMessage('INTRANET_INVITATION_WIDGET_COLLAB');
				return main_core.Tag.render`
				<div data-id="bx-invitation-widget-content-collab" class="${this.getWrapperClass()} ${this.isNewProjectsAvailable ? '--project' : ''}">
					<div class="intranet-invitation-widget-content">
						<div class="intranet-invitation-widget-item-icon intranet-invitation-widget-item-icon--collab">
							<div class="ui-icon-set --collab"></div>
						</div>
						<div class="intranet-invitation-widget-item-content">
							<div class="intranet-invitation-widget-item-name">
								<span>
									${itemNameMessage}
								</span>
							</div>
							<div class="intranet-invitation-widget-item-link">
								<span onclick="${showCollabHelper}" class="intranet-invitation-widget-item-link-text">
									${this.isNewProjectsAvailable ? main_core.Loc.getMessage('INTRANET_INVITATION_WIDGET_PROJECT_DESC') : main_core.Loc.getMessage('INTRANET_INVITATION_WIDGET_COLLAB_DESC')}
								</span>
							</div>
						</div>
					</div>
					<button onclick="${showInvitationSlider}" class="intranet-invitation-widget-item-btn intranet-invitation-widget-item-btn--collab">
						${main_core.Loc.getMessage('INTRANET_INVITATION_WIDGET_COLLAB_CREATE')}
					</button>
				</div>
			`;
			});
		}
		getWrapperClass() {
			return this.cache.remember('wrapper-class', () => {
				return 'intranet-invitation-widget-item intranet-invitation-widget-item--wide intranet-invitation-widget-item--collab';
			});
		}
	}

	class UserOnlineContent extends Content {
		getLoader() {
			return this.cache.remember('loader', () => {
				return new main_loader.Loader({
					size: 45
				});
			});
		}
		getComponentContent() {
			return this.cache.remember('component-content', () => {
				const contentContainer = main_core.Tag.render`
				<div data-role="invitation-widget-ustat-online" class="invitation-widget-ustat-online"/>
			`;
				this.getLoader().show(contentContainer);
				main_core.ajax.runAction("intranet.invitationwidget.getUserOnlineComponent").then(response => {
					this.getLoader().hide();
					const assets = response.data.assets;
					BX.load([...assets['css'], ...assets['js']], () => {
						main_core.Runtime.html(null, [...assets['string']].join('\n'), {
							useAdjacentHTML: true
						}).then(() => {
							main_core.Runtime.html(contentContainer, response.data.html).then(() => {
								this.getLoader().destroy();
							});
						});
					});
				});
				return contentContainer;
			});
		}
		getLayout() {
			return this.cache.remember('layout', () => {
				return main_core.Tag.render`
				<div class="intranet-invitation-widget-item intranet-invitation-widget-item--wide intranet-invitation-widget-item--no-padding">
					${this.getComponentContent()}
				</div>
			`;
			});
		}
	}

	class InvitationPopup extends main_core_events.EventEmitter {
		#cache = new main_core.Cache.MemoryCache();
		constructor(options) {
			super();
			this.setEventNamespace('BX.Intranet.InvitationWidget.Popup');
			this.setOptions(options);
			this.#setEventHandler();
		}
		setOptions(options) {
			this.#cache.set('options', options);
		}
		getOptions() {
			return this.#cache.get('options', {});
		}
		show() {
			this.getPopup().show();
		}
		close() {
			this.getPopup().close();
		}
		#getAwaitData() {
			return this.#cache.remember('await-data', () => {
				return new Promise((resolve, reject) => {
					main_core.ajax.runAction("intranet.invitationwidget.getData", {
						data: {},
						analyticsLabel: {
							headerPopup: "Y"
						}
					}).then(resolve).catch(reject);
				});
			});
		}
		getPopup() {
			return this.#cache.remember('popup', () => {
				return new ui_popupcomponentsmaker.PopupComponentsMaker({
					id: 'invitation-popup',
					target: this.getOptions().target,
					width: 350,
					content: this.#getContent(),
					popupLoader: this.getOptions().loader
				});
			});
		}

		//This is the method for popup content configuration
		#getContent() {
			return this.#cache.remember('content', () => {
				return [this.#getInvitationContent().getConfig(), {
					html: [this.#getStructureContent().getConfig(), this.#getEmployeesContent().getConfig()],
					marginBottom: 24
				}, this.getOptions().isExtranetAvailable ? this.#getExtranetContent().getConfig() : null, this.getOptions().isCollabAvailable ? this.#getCollabContent().getConfig() : null, this.#getUserOnlineContent().getConfig()];
			});
		}

		//region Get Content
		#getInvitationContent() {
			return this.#cache.remember('invitation-content', () => {
				return new InvitationContent({
					...this.getOptions()
				});
			});
		}
		#getStructureContent() {
			return this.#cache.remember('structure-content', () => {
				return new StructureContent({
					...this.getOptions()
				});
			});
		}
		#getEmployeesContent() {
			return this.#cache.remember('employees-content', () => {
				return new EmployeesContent({
					...this.getOptions()
				});
			});
		}
		#getExtranetContent() {
			return this.#cache.remember('extranet-content', () => {
				return new ExtranetContent({
					...this.getOptions()
				});
			});
		}
		#getCollabContent() {
			return this.#cache.remember('collab-content', () => {
				return new CollabContent({
					...this.getOptions(),
					awaitData: main_core.Runtime.loadExtension('im.public', 'im.v2.component.content.chat-forms.forms')
				});
			});
		}
		#getUserOnlineContent() {
			return this.#cache.remember('user-online-content', () => {
				return new UserOnlineContent();
			});
		}
		//endregion

		#getPopupContainer() {
			return this.#cache.remember('popup-container', () => {
				return this.getPopup().getPopup().getPopupContainer();
			});
		}
		#setEventHandler() {
			const autoHideHandler = event => {
				if (event.data.popup) {
					setTimeout(() => {
						main_core.Event.bind(this.#getPopupContainer(), 'click', () => {
							event.data.popup.close();
						});
					}, 100);
				}
			};
			const close = () => {
				this.close();
			};
			main_core_events.EventEmitter.subscribe(main_core_events.EventEmitter.GLOBAL_TARGET, 'BX.Intranet.InvitationWidget.EmployeesContent:showRightMenu', autoHideHandler);
			main_core_events.EventEmitter.subscribe(main_core_events.EventEmitter.GLOBAL_TARGET, 'BX.Intranet.InvitationWidget.HintPopup:show', autoHideHandler);
			main_core_events.EventEmitter.subscribe(main_core_events.EventEmitter.GLOBAL_TARGET, 'BX.Intranet.UstatOnline:showPopup', autoHideHandler);
			main_core_events.EventEmitter.subscribe(main_core_events.EventEmitter.GLOBAL_TARGET, 'SidePanel.Slider:onOpenStart', close);
		}
	}

	class InvitationWidget extends main_core_events.EventEmitter {
		#cache = new main_core.Cache.MemoryCache();
		static #instance;
		constructor() {
			super();
			this.setEventNamespace('BX.Intranet.InvitationWidget');
		}
		static getInstance() {
			if (!this.#instance) {
				this.#instance = new this();
			}
			return this.#instance;
		}
		show() {
			if (this.#getPopup().getPopup().isShown()) {
				return;
			}
			this.#getPopup().show();
		}
		setOptions(options) {
			this.#cache.set('options', options);
			Analytics.isAdmin = this.getOptions().isCurrentUserAdmin;
			main_core.Event.bind(this.getOptions().button, 'click', () => {
				Analytics.send(Analytics.EVENT_SHOW);
				this.#getPopup().show();
			});
			main_core_events.EventEmitter.subscribe(main_core_events.EventEmitter.GLOBAL_TARGET, 'BX.Bitrix24.NotifyPanel:showInvitationWidget', () => {
				this.#getPopup().show();
			});
			return this;
		}
		getOptions() {
			return this.#cache.get('options', {});
		}
		#getPopup() {
			return this.#cache.remember('popup', () => {
				return new InvitationPopup({
					...this.getOptions()
				});
			});
		}
	}

	exports.InvitationWidget = InvitationWidget;

})(this.BX.Intranet = this.BX.Intranet || {}, BX.Event, BX, BX.UI.Analytics, BX.UI, BX.Main, BX.UI, BX);
//# sourceMappingURL=invitation-widget.bundle.js.map
