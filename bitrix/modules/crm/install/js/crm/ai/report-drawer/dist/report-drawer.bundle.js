/* eslint-disable */
this.BX = this.BX || {};
this.BX.Crm = this.BX.Crm || {};
(function (exports, main_core, main_date, main_popup, main_sidepanel, crm_router, crm_timeline_tools, ui_buttons, ui_entitySelector, ui_system_typography_vue, crm_common, ui_vue3, ui_vue3_mixins_locMixin, crm_miniCard, ui_progressround, ui_vue3_components_button, ui_iconSet_api_core, crm_audioPlayer, ui_vue3_directives_hint, pull_queuemanager) {
	'use strict';

	const ManagerPopupContent = ui_vue3.defineComponent({
		name: 'CrmAiReportDrawerManagerPopupContent',
		props: {
			responsible: {
				type: Object,
				required: true
			}
		},
		computed: {
			normalizedRating() {
				if (!main_core.Type.isNumber(this.responsible.rating)) {
					return 0;
				}
				return Math.min(Math.max(Math.round(this.responsible.rating), 0), 100);
			},
			managerPopupTitle() {
				return main_core.Loc.getMessage('CRM_AI_REPORT_DRAWER_MANAGER_POPUP_TITLE') ?? '';
			},
			managerPopupDescription() {
				return main_core.Loc.getMessage('CRM_AI_REPORT_DRAWER_MANAGER_POPUP_DESCRIPTION', {
					'#RATING#': String(this.normalizedRating)
				}) ?? '';
			},
			responsibleAvatarStyle() {
				if (!main_core.Type.isStringFilled(this.responsible.responsibleAvatarUrl)) {
					return {};
				}
				return {
					backgroundImage: `url(${encodeURI(main_core.Text.encode(this.responsible.responsibleAvatarUrl))})`
				};
			},
			hasResponsibleProfileUrl() {
				return main_core.Type.isStringFilled(this.responsible.responsibleProfileUrl);
			}
		},
		mounted() {
			const chart = new ui_progressround.ProgressRound({
				value: this.normalizedRating,
				maxValue: 100,
				color: ui_progressround.ProgressRound.Color.PRIMARY,
				width: 30,
				textBefore: '',
				textAfter: '',
				colorTrack: 'var(--ui-color-base-7)',
				colorBar: '',
				statusType: ui_progressround.ProgressRound.Status.NONE,
				lineSize: 8,
				fill: true,
				finished: false,
				rotation: false,
				useAirDesign: true
			});
			chart.renderTo(this.$refs.chartContainer);
		},
		template: `
		<div class="crm-ai-report-drawer__manager-popup">
			<div class="crm-ai-report-drawer__manager-popup-main">
				<div class="crm-ai-report-drawer__manager-popup-info">
					<span class="crm-ai-report-drawer__manager-popup-avatar ui-icon ui-icon-common-user">
						<i :style="responsibleAvatarStyle"></i>
					</span>
					<div class="crm-ai-report-drawer__manager-popup-text">
						<div class="crm-ai-report-drawer__manager-popup-caption ui-typography-text-xs">
							{{ managerPopupTitle }}
						</div>
						<a
							v-if="hasResponsibleProfileUrl"
							:href="responsible.responsibleProfileUrl"
							class="crm-ai-report-drawer__manager-popup-name ui-typography-text-md"
						>
							{{ responsible.responsibleName }}
						</a>
						<span
							v-else
							class="crm-ai-report-drawer__manager-popup-name ui-typography-text-md"
						>
							{{ responsible.responsibleName }}
						</span>
					</div>
				</div>
				<div class="crm-ai-report-drawer__manager-popup-rating">
					<div ref="chartContainer" class="crm-ai-report-drawer__manager-popup-rating-chart"></div>
					<div class="crm-ai-report-drawer__manager-popup-rating-value">
						<span class="ui-typography-heading-h4">{{ normalizedRating }}</span>
						<span class="crm-ai-report-drawer__manager-popup-rating-percent ui-typography-text-xs">%</span>
					</div>
				</div>
			</div>
			<div class="crm-ai-report-drawer__manager-popup-description ui-typography-text-md">
				{{ managerPopupDescription }}
			</div>
		</div>
	`
	});

	class PopupController {
		#options;
		#popup = null;
		#application = null;
		#container = null;
		#closeTimeoutId = null;
		constructor(options) {
			this.#options = options;
			this.#bindEvents();
		}
		destroy() {
			this.#cancelClosing();
			if (this.#isClickTrigger()) {
				main_core.Event.unbind(this.#options.bindElement, 'click', this.#handleTriggerClick);
			} else {
				main_core.Event.unbind(this.#options.bindElement, 'mouseenter', this.#handleMouseEnter);
				main_core.Event.unbind(this.#options.bindElement, 'mouseleave', this.#handleMouseLeave);
				main_core.Event.unbind(this.#options.bindElement, 'click', this.#handleBindElementClick);
			}
			if (this.#popup) {
				const popupContainer = this.#popup.getPopupContainer();
				if (!this.#isClickTrigger()) {
					main_core.Event.unbind(popupContainer, 'mouseenter', this.#handleMouseEnter);
					main_core.Event.unbind(popupContainer, 'mouseleave', this.#handleMouseLeave);
				}
				this.#popup.destroy();
				this.#popup = null;
			}
			this.#application?.unmount();
			this.#application = null;
			this.#container = null;
		}
		#bindEvents() {
			if (this.#isClickTrigger()) {
				main_core.Event.bind(this.#options.bindElement, 'click', this.#handleTriggerClick);
				return;
			}
			main_core.Event.bind(this.#options.bindElement, 'mouseenter', this.#handleMouseEnter);
			main_core.Event.bind(this.#options.bindElement, 'mouseleave', this.#handleMouseLeave);
			main_core.Event.bind(this.#options.bindElement, 'click', this.#handleBindElementClick);
		}
		#isClickTrigger() {
			return this.#options.trigger === 'click';
		}
		#handleTriggerClick = () => {
			if (!document.body.contains(this.#options.bindElement)) {
				return;
			}
			const popup = this.#getPopup();
			if (popup.isShown()) {
				popup.close();
			} else {
				popup.show();
			}
		};
		#handleMouseEnter = () => {
			this.#cancelClosing();
			if (document.body.contains(this.#options.bindElement)) {
				this.#getPopup().show();
			}
		};
		#handleMouseLeave = event => {
			if (this.#shouldKeepPopupOpened(event)) {
				return;
			}
			this.#scheduleClosing();
		};
		#handleBindElementClick = () => {
			this.#cancelClosing();
			this.#popup?.close();
		};
		#shouldKeepPopupOpened(event) {
			const nextTarget = event.relatedTarget;
			if (!main_core.Type.isDomNode(nextTarget)) {
				return false;
			}
			const popupContainer = this.#popup?.getPopupContainer();
			return this.#options.bindElement.contains(nextTarget) || popupContainer?.contains(nextTarget) === true;
		}
		#cancelClosing() {
			if (!main_core.Type.isNumber(this.#closeTimeoutId)) {
				return;
			}
			clearTimeout(this.#closeTimeoutId);
			this.#closeTimeoutId = null;
		}
		#scheduleClosing() {
			this.#cancelClosing();
			const closeDelay = this.#options.popupOptions.closeDelayOnMouseLeave ?? 150;
			if (closeDelay <= 0) {
				this.#popup?.close();
				return;
			}
			this.#closeTimeoutId = window.setTimeout(() => {
				this.#popup?.close();
				this.#closeTimeoutId = null;
			}, closeDelay);
		}
		#getPopup() {
			if (this.#popup === null) {
				this.#popup = new main_popup.Popup({
					bindElement: this.#options.bindElement,
					className: `${this.#options.popupOptions.className} ui-icon-set__scope`,
					content: this.#getContainer(),
					width: this.#options.popupOptions.width,
					noAllPaddings: true,
					autoHide: this.#options.popupOptions.autoHide ?? this.#isClickTrigger(),
					closeByEsc: this.#options.popupOptions.closeByEsc ?? this.#isClickTrigger(),
					closeIcon: false,
					cacheable: false,
					angle: {
						position: 'top',
						offset: 0
					},
					animation: 'fading-slide',
					events: {
						onDestroy: () => {
							this.#cancelClosing();
							this.#application?.unmount();
							this.#application = null;
							this.#container = null;
							this.#popup = null;
						}
					}
				});
				this.#popup.setOffset({
					offsetLeft: Math.round(this.#options.bindElement.offsetWidth / 2),
					offsetTop: 0
				});
				if (!this.#isClickTrigger()) {
					const popupContainer = this.#popup.getPopupContainer();
					main_core.Event.bind(popupContainer, 'mouseenter', this.#handleMouseEnter);
					main_core.Event.bind(popupContainer, 'mouseleave', this.#handleMouseLeave);
				}
			}
			return this.#popup;
		}
		#getContainer() {
			if (!main_core.Type.isElementNode(this.#container)) {
				this.#container = main_core.Tag.render`<div class="crm-ai-report-drawer__popup-container"></div>`;
				this.#application = this.#createApplication();
				this.#application.mount(this.#container);
			}
			return this.#container;
		}
		#createApplication() {
			return ui_vue3.BitrixVue.createApp(this.#options.component, this.#options.props ?? null);
		}
	}

	const CLIENT_LINK_ID = 'crm-ai-report-drawer-client-name';
	const MANAGER_LINK_ID = 'crm-ai-report-drawer-manager-name';
	const MORE_MANAGERS_LINK_ID = 'crm-ai-report-drawer-more-managers';
	const Subtitle = ui_vue3.defineComponent({
		name: 'Subtitle',
		props: {
			subtitleData: {
				type: Object,
				required: true
			}
		},
		data() {
			return {
				runtime: ui_vue3.markRaw({
					responsiblePopup: null,
					additionalManagerPopups: [],
					moreManagersMenu: null,
					moreManagersMenuId: null,
					moreManagersMenuCloseTimeout: null
				})
			};
		},
		methods: {
			getCallSubtitleData() {
				if (this.subtitleData.type === 'open-lines') {
					return null;
				}
				return this.subtitleData.data;
			},
			getOpenLinesSubtitleData() {
				if (this.subtitleData.type !== 'open-lines') {
					return null;
				}
				return this.subtitleData.data;
			},
			getCurrentClientData() {
				if (this.subtitleData.type === 'open-lines') {
					return this.getOpenLinesSubtitleData()?.client ?? null;
				}
				return this.getCallSubtitleData()?.client ?? null;
			},
			getResponsibleData() {
				return this.getCallSubtitleData()?.responsible ?? null;
			},
			getPrimaryManagerData() {
				if (this.subtitleData.type === 'open-lines') {
					return this.getOpenLinesSubtitleData()?.managers[0] ?? null;
				}
				return this.getResponsibleData();
			},
			getAdditionalManagersData() {
				if (this.subtitleData.type !== 'open-lines') {
					return [];
				}
				return this.getOpenLinesSubtitleData()?.managers.slice(1) ?? [];
			},
			getClientLinkMarkup(client) {
				if (!main_core.Type.isStringFilled(client.clientDetailsUrl)) {
					return `
					<span
						id="${CLIENT_LINK_ID}"
						class="crm-ai-report-drawer__subtitle-highlight"
					>
						${main_core.Text.encode(client.clientName)}
					</span>
				`.trim();
				}
				return `
				<a
					href="${client.clientDetailsUrl}"
					id="${CLIENT_LINK_ID}"
					class="crm-ai-report-drawer__subtitle-highlight"
				>
					${main_core.Text.encode(client.clientName)}
				</a>
			`.trim();
			},
			getClientMarkup(client) {
				if ((client.clientEntityTypeId ?? 0) <= 0 || (client.clientId ?? 0) <= 0) {
					return main_core.Text.encode(client.clientName);
				}
				return this.getClientLinkMarkup(client);
			},
			getManagerLinkMarkup(responsible) {
				if (!main_core.Type.isStringFilled(responsible.responsibleProfileUrl)) {
					return `
					<span
						id="${MANAGER_LINK_ID}"
						class="crm-ai-report-drawer__subtitle-highlight"
					>
						${main_core.Text.encode(responsible.responsibleName)}
					</span>
				`.trim();
				}
				return `
				<a
					href="${responsible.responsibleProfileUrl}"
					id="${MANAGER_LINK_ID}"
					class="crm-ai-report-drawer__subtitle-highlight"
				>
					${main_core.Text.encode(responsible.responsibleName)}
				</a>
			`.trim();
			},
			getMoreManagersButtonOpenMarkup() {
				return `
				<button
					type="button"
					id="${MORE_MANAGERS_LINK_ID}"
					class="crm-ai-report-drawer__subtitle-more-managers"
				>
			`.trim();
			},
			renderCallSubtitle(messageCode, client, responsible) {
				const stringElement = main_core.Loc.getMessage(messageCode, {
					'#CLIENT_NAME#': main_core.Type.isNil(client) ? '' : this.getClientMarkup(client),
					'#MANAGER_NAME#': main_core.Type.isNil(responsible) ? '' : this.getManagerLinkMarkup(responsible)
				}) ?? '';
				return main_core.Tag.render`<span>${stringElement}</span>`;
			},
			getIncomingCallSubtitle() {
				const data = this.getCallSubtitleData();
				if (main_core.Type.isNil(data)) {
					return null;
				}
				return this.renderCallSubtitle('CRM_AI_REPORT_DRAWER_HEADER_INCOMING_CALL', data.client, data.responsible);
			},
			getOutgoingCallSubtitle() {
				const data = this.getCallSubtitleData();
				if (main_core.Type.isNil(data)) {
					return null;
				}
				return this.renderCallSubtitle('CRM_AI_REPORT_DRAWER_HEADER_OUTGOING_CALL', data.client, data.responsible);
			},
			getOpenLinesSubtitle() {
				const data = this.getOpenLinesSubtitleData();
				if (main_core.Type.isNil(data)) {
					return null;
				}
				const clientMarkup = this.getClientMarkup(data.client);
				const primaryManager = data.managers[0];
				const additionalManagerCount = this.getAdditionalManagersData().length;
				const hasAdditionalManagers = additionalManagerCount > 0;
				const messageCode = hasAdditionalManagers ? 'CRM_AI_REPORT_DRAWER_HEADER_OPEN_LINES_MULTIPLE_MANAGERS' : 'CRM_AI_REPORT_DRAWER_HEADER_OPEN_LINES_SINGLE_MANAGER';
				const stringElement = main_core.Loc.getMessage(messageCode, {
					'#CLIENT_NAME#': clientMarkup,
					'#MANAGER_NAME#': this.getManagerLinkMarkup(primaryManager),
					'#BUTTON_START#': this.getMoreManagersButtonOpenMarkup(),
					'#BUTTON_END#': '</button>',
					'#MANAGER_COUNT#': String(additionalManagerCount)
				}) ?? '';
				return main_core.Tag.render`<span>${stringElement}</span>`;
			},
			bindClientMiniCard() {
				const clientNameContainer = this.$refs.subtitleSection.querySelector(`#${CLIENT_LINK_ID}`);
				const client = this.getCurrentClientData();
				if (!clientNameContainer || main_core.Type.isNil(client) || (client.clientEntityTypeId ?? 0) <= 0 || (client.clientId ?? 0) <= 0) {
					return;
				}
				new crm_miniCard.EntityMiniCard({
					bindElement: clientNameContainer,
					entityTypeId: client.clientEntityTypeId ?? 0,
					entityId: client.clientId ?? 0
				});
			},
			getManagerLinkContainer() {
				return this.$refs.subtitleSection.querySelector(`#${MANAGER_LINK_ID}`);
			},
			destroyResponsiblePopup() {
				this.runtime.responsiblePopup?.destroy();
				this.runtime.responsiblePopup = null;
			},
			bindResponsiblePopup() {
				const managerLinkContainer = this.getManagerLinkContainer();
				const responsible = this.getPrimaryManagerData();
				if (!managerLinkContainer || main_core.Type.isNil(responsible)) {
					return;
				}
				this.destroyResponsiblePopup();
				this.runtime.responsiblePopup = new PopupController({
					bindElement: managerLinkContainer,
					trigger: 'hover',
					component: ManagerPopupContent,
					props: {
						responsible
					},
					popupOptions: {
						width: 360,
						className: 'crm-ai-report-drawer__popup-wrapper --manager'
					}
				});
			},
			getMoreManagersMenuId() {
				this.runtime.moreManagersMenuId ??= `crm-ai-report-drawer-more-managers-${main_core.Text.getRandom()}`;
				return this.runtime.moreManagersMenuId;
			},
			getMoreManagersLinkContainer() {
				return this.$refs.subtitleSection.querySelector(`#${MORE_MANAGERS_LINK_ID}`);
			},
			destroyAdditionalManagerPopups() {
				this.runtime.additionalManagerPopups.forEach(controller => controller.destroy());
				this.runtime.additionalManagerPopups = [];
			},
			cancelMoreManagersMenuClose() {
				const timeoutId = this.runtime.moreManagersMenuCloseTimeout;
				if (!main_core.Type.isNumber(timeoutId)) {
					return;
				}
				clearTimeout(timeoutId);
				this.runtime.moreManagersMenuCloseTimeout = null;
			},
			scheduleMoreManagersMenuClose(menu) {
				this.cancelMoreManagersMenuClose();
				this.runtime.moreManagersMenuCloseTimeout = window.setTimeout(() => {
					menu.close();
					this.runtime.moreManagersMenuCloseTimeout = null;
				}, 120);
			},
			destroyMoreManagersMenu() {
				this.cancelMoreManagersMenuClose();
				this.runtime.moreManagersMenu?.destroy();
				this.runtime.moreManagersMenu = null;
				this.runtime.moreManagersMenuId = null;
				this.destroyAdditionalManagerPopups();
			},
			renderMoreManagersMenuItem(manager) {
				const itemContainer = main_core.Tag.render`<div class="crm-ai-report-drawer__managers-menu-item"></div>`;
				const avatarContainer = main_core.Tag.render`
				<span class="ui-icon ui-icon-common-user crm-ai-report-drawer__managers-menu-item-avatar">
					<i></i>
				</span>
			`;
				const nameContainer = main_core.Type.isStringFilled(manager.responsibleProfileUrl) ? main_core.Tag.render`
					<a
						href="${manager.responsibleProfileUrl}"
						class="crm-ai-report-drawer__managers-menu-item-link"
						data-manager-id="${manager.responsibleId}"
					>
						${main_core.Text.encode(manager.responsibleName)}
					</a>
				` : main_core.Tag.render`
					<span
						class="crm-ai-report-drawer__managers-menu-item-link"
						data-manager-id="${manager.responsibleId}"
					>
						${main_core.Text.encode(manager.responsibleName)}
					</span>
				`;
				if (main_core.Type.isStringFilled(manager.responsibleAvatarUrl)) {
					main_core.Dom.style(avatarContainer.querySelector('i'), 'background-image', `url('${encodeURI(main_core.Text.encode(manager.responsibleAvatarUrl))}')`);
				}
				main_core.Dom.append(avatarContainer, itemContainer);
				main_core.Dom.append(nameContainer, itemContainer);
				return itemContainer;
			},
			bindAdditionalManagerPopups(menu, managers) {
				const popupContainer = menu.getPopupWindow().getPopupContainer();
				const managersById = new Map(managers.map(manager => [String(manager.responsibleId), manager]));
				const controllers = [];
				popupContainer.querySelectorAll('[data-manager-id]').forEach(element => {
					const managerId = element.dataset.managerId ?? '';
					const manager = managersById.get(managerId);
					if (main_core.Type.isNil(manager)) {
						return;
					}
					controllers.push(new PopupController({
						bindElement: element,
						trigger: 'hover',
						component: ManagerPopupContent,
						props: {
							responsible: manager
						},
						popupOptions: {
							width: 360,
							className: 'crm-ai-report-drawer__popup-wrapper --manager'
						}
					}));
				});
				this.runtime.additionalManagerPopups = controllers;
			},
			bindMoreManagersMenu() {
				if (this.subtitleData.type !== 'open-lines') {
					return;
				}
				const moreManagersLinkContainer = this.getMoreManagersLinkContainer();
				const managers = this.getAdditionalManagersData();
				if (!moreManagersLinkContainer || managers.length === 0) {
					return;
				}
				this.destroyMoreManagersMenu();
				const menuId = this.getMoreManagersMenuId();
				const menu = main_popup.MenuManager.create({
					id: menuId,
					bindElement: moreManagersLinkContainer,
					cacheable: true,
					className: 'crm-ai-report-drawer__managers-menu',
					closeByEsc: true,
					maxWidth: 280,
					animation: 'fading-slide',
					navigationOptions: {
						initialFocusPosition: 'first'
					},
					items: managers.map(manager => ({
						html: this.renderMoreManagersMenuItem(manager),
						attrs: {},
						onclick: () => {
							menu.close();
							return {};
						}
					}))
				});
				const popupContainer = menu.getPopupWindow().getPopupContainer();
				main_core.Event.bind(popupContainer, 'mouseenter', () => {
					this.cancelMoreManagersMenuClose();
				});
				main_core.Event.bind(popupContainer, 'mouseleave', () => {
					this.scheduleMoreManagersMenuClose(menu);
				});
				menu.subscribe('onShow', () => {
					this.cancelMoreManagersMenuClose();
					this.destroyAdditionalManagerPopups();
					this.bindAdditionalManagerPopups(menu, managers);
				});
				menu.subscribe('onClose', () => {
					this.cancelMoreManagersMenuClose();
					this.destroyAdditionalManagerPopups();
				});
				this.runtime.moreManagersMenu = menu;
				main_core.Event.bind(moreManagersLinkContainer, 'mouseenter', () => {
					this.cancelMoreManagersMenuClose();
					menu.show();
				});
				main_core.Event.bind(moreManagersLinkContainer, 'mouseleave', () => {
					this.scheduleMoreManagersMenuClose(menu);
				});
			}
		},
		mounted() {
			let subtitleElement = null;
			switch (this.subtitleData.type) {
				case 'incoming-call':
					subtitleElement = this.getIncomingCallSubtitle();
					break;
				case 'outgoing-call':
					subtitleElement = this.getOutgoingCallSubtitle();
					break;
				case 'open-lines':
					subtitleElement = this.getOpenLinesSubtitle();
					break;
				default:
					return;
			}
			if (main_core.Type.isNull(subtitleElement)) {
				return;
			}
			main_core.Dom.append(subtitleElement, this.$refs.subtitleSection);
			this.bindClientMiniCard();
			this.bindResponsiblePopup();
			this.bindMoreManagersMenu();
		},
		beforeUnmount() {
			this.destroyResponsiblePopup();
			this.destroyMoreManagersMenu();
		},
		template: `
		<span class="crm-ai-report-drawer__subtitle ui-typography-text-md" ref="subtitleSection" />
	`
	});

	const SETTING_BUTTON_ID = {
		CHOOSE_NEW_SCRIPT: 'choose-new-script',
		ANALYTICS: 'analytics',
		DELIMITER: 'delimiter',
		SHARE_SLIDER: 'share-slider',
		HOW_IT_WORKS: 'how-it-works'
	};
	const Settings = ui_vue3.defineComponent({
		name: 'Settings',
		components: {
			Button: ui_vue3_components_button.Button
		},
		props: {
			buttons: {
				type: Array,
				required: true
			},
			shareLink: {
				type: String,
				default: null
			}
		},
		emits: ['chooseNewScript'],
		setup() {
			return {
				AirButtonStyle: ui_vue3_components_button.AirButtonStyle,
				ButtonIcon: ui_vue3_components_button.ButtonIcon,
				ButtonSize: ui_vue3_components_button.ButtonSize
			};
		},
		data() {
			return {
				settingsMenuId: `crm-ai-report-drawer-settings-menu-${main_core.Text.getRandom()}`
			};
		},
		methods: {
			closeSettingsMenu() {
				main_popup.MenuManager.getMenuById(this.settingsMenuId)?.close();
			},
			openSettings() {
				const existingMenu = main_popup.MenuManager.getMenuById(this.settingsMenuId);
				if (existingMenu) {
					const popupWindow = existingMenu.getPopupWindow();
					if (popupWindow?.isShown()) {
						existingMenu.close();
					} else {
						existingMenu.show();
					}
					return {};
				}
				const menu = main_popup.MenuManager.create({
					id: this.settingsMenuId,
					bindElement: this.$refs.container,
					className: 'crm-ai-report-drawer-settings-menu ui-icon-set__scope',
					autoHide: true,
					closeByEsc: true,
					angle: false,
					cacheable: true,
					navigationOptions: {
						initialFocusPosition: 'first'
					},
					events: {
						onClose: () => {
							this.resetShareSliderText();
						}
					},
					items: this.getSettingsMenuItems()
				});
				menu.show();
				return {};
			},
			getSettingsMenuItems() {
				const items = [];
				this.buttons.forEach(button => {
					const menuItem = this.getSettingButton(button);
					if (!main_core.Type.isNull(menuItem)) {
						items.push(menuItem);
					}
				});
				return items;
			},
			executeOnClick(jsCode) {
				this.closeSettingsMenu();
				new Function(jsCode)();
				return {};
			},
			getSettingMenuItemData(id) {
				const baseClassName = 'crm-ai-report-drawer-settings-item';
				switch (id) {
					case SETTING_BUTTON_ID.CHOOSE_NEW_SCRIPT:
						return {
							messageCode: 'CRM_AI_REPORT_DRAWER_SETTINGS_ITEM_RESELECT_SCRIPT',
							className: `${baseClassName} ${baseClassName}--choose-new-script`
						};
					case SETTING_BUTTON_ID.ANALYTICS:
						return {
							messageCode: 'CRM_AI_REPORT_DRAWER_SETTINGS_ITEM_ANALYTICS',
							className: `${baseClassName} ${baseClassName}--analytics`
						};
					case SETTING_BUTTON_ID.SHARE_SLIDER:
						return {
							messageCode: 'CRM_AI_REPORT_DRAWER_SETTINGS_ITEM_SHARE_SLIDER',
							className: `${baseClassName} ${baseClassName}--share-slider`
						};
					case SETTING_BUTTON_ID.HOW_IT_WORKS:
						return {
							messageCode: 'CRM_AI_REPORT_DRAWER_SETTINGS_ITEM_HOW_IT_WORKS',
							className: `${baseClassName} ${baseClassName}--how-it-works`
						};
					default:
						return null;
				}
			},
			createSettingMenuItem(button, onclick) {
				const settingMenuItemData = this.getSettingMenuItemData(button.id);
				if (!settingMenuItemData) {
					return null;
				}
				const text = main_core.Loc.getMessage(settingMenuItemData.messageCode) ?? '';
				if (!main_core.Type.isStringFilled(text)) {
					return null;
				}
				return {
					text,
					onclick,
					id: button.id,
					delimiter: false,
					className: settingMenuItemData.className,
					attrs: {}
				};
			},
			resetShareSliderText() {
				main_popup.MenuManager.getMenuById(this.settingsMenuId)?.getMenuItem(SETTING_BUTTON_ID.SHARE_SLIDER)?.setText(main_core.Loc.getMessage('CRM_AI_REPORT_DRAWER_SETTINGS_ITEM_SHARE_SLIDER') ?? '');
			},
			markShareSliderAsCopied(menuItem) {
				const copiedText = main_core.Loc.getMessage('CRM_AI_REPORT_DRAWER_SETTINGS_ITEM_SHARE_SLIDER_COPIED');
				if (!main_core.Type.isStringFilled(copiedText)) {
					return;
				}
				menuItem?.setText(copiedText);
			},
			async copyShareLink(link) {
				if (window.isSecureContext && navigator.clipboard?.writeText) {
					try {
						await navigator.clipboard.writeText(link);
						return true;
					} catch {}
				}
				return this.copyShareLinkWithDocument(link);
			},
			copyShareLinkWithDocument(link) {
				const textarea = document.createElement('textarea');
				textarea.value = link;
				textarea.setAttribute('readonly', '');
				textarea.style.position = 'fixed';
				textarea.style.opacity = '0';
				textarea.style.pointerEvents = 'none';
				document.body.append(textarea);
				textarea.select();
				try {
					return document.execCommand('copy');
				} catch {
					return false;
				} finally {
					textarea.remove();
				}
			},
			async handleShareSliderClick(event, menuItem) {
				if (!main_core.Type.isStringFilled(this.shareLink)) {
					return {};
				}
				const isCopied = await this.copyShareLink(this.shareLink);
				if (isCopied) {
					this.markShareSliderAsCopied(menuItem);
				}
				return {};
			},
			getSettingButton(button) {
				if (button.id === SETTING_BUTTON_ID.DELIMITER) {
					return {
						delimiter: true,
						attrs: {}
					};
				}
				if (button.id === SETTING_BUTTON_ID.CHOOSE_NEW_SCRIPT) {
					return this.createSettingMenuItem(button, () => {
						this.closeSettingsMenu();
						this.$emit('chooseNewScript', this.$refs.container);
						return {};
					});
				}
				if (button.id === SETTING_BUTTON_ID.SHARE_SLIDER) {
					return this.createSettingMenuItem(button, (event, menuItem) => {
						void this.handleShareSliderClick(event, menuItem);
						return {};
					});
				}
				if (!main_core.Type.isStringFilled(button.onclick)) {
					return null;
				}
				return this.createSettingMenuItem(button, () => this.executeOnClick(button.onclick));
			}
		},
		beforeUnmount() {
			main_popup.MenuManager.destroy(this.settingsMenuId);
		},
		template: `
		<div ref="container" class="crm-ai-report-drawer__settings">
			<Button
				:style="AirButtonStyle.OUTLINE_NO_ACCENT"
				:size="ButtonSize.SMALL"
				:collapsedIcon="ButtonIcon.DOTS"
				@click="openSettings"
			/>
		</div>
	`
	});

	const Header = ui_vue3.defineComponent({
		name: 'Header',
		components: {
			Subtitle,
			Settings
		},
		emits: ['chooseNewScript'],
		props: {
			title: {
				type: String,
				required: true
			},
			subtitle: {
				type: Object
			},
			settings: {
				type: Array,
				required: true
			},
			shareLink: {
				type: String,
				default: null
			}
		},
		computed: {
			hasSubtitle() {
				return !main_core.Type.isNil(this.subtitle);
			},
			hasSettings() {
				return this.settings.length > 0;
			}
		},
		template: `
		<div class="crm-ai-report-drawer__header">
			<div class="crm-ai-report-drawer__title-section">
				<h3 class="crm-ai-report-drawer__title ui-typography-heading-h3">{{ title }}</h3>
				<Subtitle v-if="hasSubtitle" :subtitleData="subtitle" />
			</div>
			<Settings
				v-if="hasSettings"
				:buttons="settings"
				:shareLink="shareLink"
				@chooseNewScript="$emit('chooseNewScript', $event)"
			/>
		</div>
	`
	});

	const Anchor = ui_vue3.defineComponent({
		name: 'Anchor',
		components: {
			Button: ui_vue3_components_button.Button
		},
		emits: ['activated'],
		setup() {
			return {
				AirButtonStyle: ui_vue3_components_button.AirButtonStyle,
				ButtonIcon: ui_vue3_components_button.ButtonIcon,
				ButtonSize: ui_vue3_components_button.ButtonSize
			};
		},
		props: {
			text: {
				type: String,
				required: true
			},
			blockId: {
				type: String,
				required: true
			},
			isActive: {
				type: Boolean
			}
		},
		methods: {
			handleClick() {
				this.$emit('activated', this.blockId);
				return {};
			}
		},
		template: `
		<div :class="['crm-ai-report-drawer__anchor-wrapper', { active: isActive }]">
			<Button
				:text="text"
				:style="AirButtonStyle.OUTLINE"
				:size="ButtonSize.SMALL"
				:collapsedIcon="ButtonIcon.DOTS"
				class="crm-ai-report-drawer__anchor"
				@click="handleClick"
			/>
			<span class="crm-ai-report-drawer__arrow"></span>
		</div>
	`
	});

	function resolveEntityIconPath(ownerTypeId) {
		const entityTypeEnumeration = BX.CrmEntityType.enumeration;
		switch (ownerTypeId) {
			case entityTypeEnumeration.lead:
				return '--ui-icon-set__path_lead';
			case entityTypeEnumeration.contact:
				return '--ui-icon-set__path_contact';
			case entityTypeEnumeration.deal:
				return '--ui-icon-set__path_deal';
			case entityTypeEnumeration.company:
				return '--ui-icon-set__path_company';
			case entityTypeEnumeration.invoice:
			case entityTypeEnumeration.smartinvoice:
				return '--ui-icon-set__path_invoice';
			case entityTypeEnumeration.quote:
				return '--ui-icon-set__path_commercial-offer';
			default:
				return '--ui-icon-set__path_item';
		}
	}
	const CallInfoPopupContent = ui_vue3.defineComponent({
		name: 'CrmAiReportDrawerCallInfoPopupContent',
		props: {
			infoPopupData: {
				type: Object,
				required: true
			}
		},
		computed: {
			entityFieldTitle() {
				return main_core.Loc.getMessage('CRM_AI_REPORT_DRAWER_INFO_POPUP_CALL_ENTITY_TITLE') ?? '';
			},
			dateFieldTitle() {
				return main_core.Loc.getMessage('CRM_AI_REPORT_DRAWER_INFO_POPUP_DATE_AND_DURATION_TITLE') ?? '';
			},
			fromNumberFieldTitle() {
				return main_core.Loc.getMessage('CRM_AI_REPORT_DRAWER_INFO_POPUP_FROM_NUMBER_TITLE') ?? '';
			},
			toNumberFieldTitle() {
				return main_core.Loc.getMessage('CRM_AI_REPORT_DRAWER_INFO_POPUP_TO_NUMBER_TITLE') ?? '';
			},
			hiddenPhoneNumberText() {
				return main_core.Loc.getMessage('CRM_AI_REPORT_DRAWER_INFO_POPUP_HIDDEN_PHONE_NUMBER') ?? '';
			},
			hasEntityLink() {
				return main_core.Type.isStringFilled(this.infoPopupData.entity.href);
			},
			hasFromNumberAction() {
				return this.hasPhoneCallAction(this.infoPopupData.fromNumber);
			},
			hasToNumberAction() {
				return this.hasPhoneCallAction(this.infoPopupData.toNumber);
			},
			displayFromNumberText() {
				return this.getDisplayPhoneNumberText(this.infoPopupData.fromNumber, 'from');
			},
			displayToNumberText() {
				return this.getDisplayPhoneNumberText(this.infoPopupData.toNumber, 'to');
			},
			entityIconStyle() {
				return {
					'--crm-ai-report-drawer__info-popup-field-icon-path': `var(${resolveEntityIconPath(this.infoPopupData.entity.ownerTypeId)})`
				};
			}
		},
		methods: {
			getDisplayPhoneNumberText(valueData, fieldName) {
				return !this.isHiddenClientNumberField(fieldName) ? valueData.text : this.hiddenPhoneNumberText;
			},
			isHiddenClientNumberField(fieldName) {
				const isClientNumberField = this.infoPopupData.isIncomingCall ? fieldName === 'from' : fieldName === 'to';
				return !this.infoPopupData.hasClient && isClientNumberField;
			},
			hasPhoneCallAction(valueData) {
				return valueData.action?.type === 'phone-call' && main_core.Type.isStringFilled(valueData.action.phoneNumber);
			},
			getPhoneCallAction(valueData) {
				if (!this.hasPhoneCallAction(valueData)) {
					return null;
				}
				return valueData.action;
			},
			getPhoneCallHref(valueData) {
				const action = this.getPhoneCallAction(valueData);
				if (!action) {
					return '#';
				}
				return this.getPhoneCallHrefByAction(action);
			},
			getPhoneCallHrefByAction(action) {
				return `callto://${action.phoneNumber}`;
			},
			handlePhoneClick(event, valueData) {
				const action = this.getPhoneCallAction(valueData);
				if (!action) {
					return;
				}
				event.preventDefault();
				this.startPhoneCall(action);
			},
			startPhoneCall(action) {
				const crmEntityType = BX.CrmEntityType;
				const topWindow = window.top;
				const params = {
					AUTO_FOLD: true
				};
				if (main_core.Type.isInteger(action.entityTypeId) && main_core.Type.isInteger(action.entityId)) {
					params.ENTITY_TYPE_NAME = crmEntityType.resolveName(action.entityTypeId);
					params.ENTITY_ID = action.entityId;
				}
				if (main_core.Type.isInteger(action.ownerTypeId) && main_core.Type.isInteger(action.ownerId) && (action.ownerTypeId !== action.entityTypeId || action.ownerId !== action.entityId)) {
					params.BINDINGS = [{
						OWNER_TYPE_NAME: crmEntityType.resolveName(action.ownerTypeId),
						OWNER_ID: action.ownerId
					}];
				}
				if (main_core.Type.isInteger(action.activityId) && action.activityId > 0) {
					params.SRC_ACTIVITY_ID = action.activityId;
				}
				if (topWindow.BXIM?.phoneTo) {
					topWindow.BXIM.phoneTo(action.phoneNumber, params);
					return;
				}
				const fallbackHref = this.getPhoneCallHrefByAction(action);
				main_core.Runtime.loadExtension('im.public').then(exports => {
					const messengerExports = Array.isArray(exports) ? exports[0] : exports;
					const messenger = messengerExports.Messenger;
					if (!messenger?.startPhoneCall) {
						window.location.href = fallbackHref;
						return;
					}
					void messenger.startPhoneCall(action.phoneNumber, params);
				}).catch(exception => {
					console.error('Error loading "im.public":', exception);
					window.location.href = fallbackHref;
				});
			}
		},
		template: `
		<div class="crm-ai-report-drawer__info-popup">
			<div class="crm-ai-report-drawer__info-popup-field">
				<div class="crm-ai-report-drawer__info-popup-field-title ui-typography-text-xs">
					{{ entityFieldTitle }}
				</div>
				<div class="crm-ai-report-drawer__info-popup-field-value-wrapper">
					<span
						class="crm-ai-report-drawer__info-popup-field-icon --entity"
						:style="entityIconStyle"
					></span>
					<a
						v-if="hasEntityLink"
						:href="infoPopupData.entity.href"
						class="crm-ai-report-drawer__info-popup-field-value --accent ui-typography-text-md"
					>
						{{ infoPopupData.entity.title }}
					</a>
					<span
						v-else
						class="crm-ai-report-drawer__info-popup-field-value --accent ui-typography-text-md"
					>
						{{ infoPopupData.entity.title }}
					</span>
				</div>
			</div>
			<div class="crm-ai-report-drawer__info-popup-field">
				<div class="crm-ai-report-drawer__info-popup-field-title ui-typography-text-xs">
					{{ dateFieldTitle }}
				</div>
				<span class="crm-ai-report-drawer__info-popup-field-value ui-typography-text-md">
					{{ infoPopupData.dateAndDuration }}
				</span>
			</div>
			<div class="crm-ai-report-drawer__info-popup-field">
				<div class="crm-ai-report-drawer__info-popup-field-title ui-typography-text-xs">
					{{ fromNumberFieldTitle }}
				</div>
					<a
						v-if="hasFromNumberAction"
						:href="getPhoneCallHref(infoPopupData.fromNumber)"
						class="crm-ai-report-drawer__info-popup-field-value ui-typography-text-md"
						:class="{ '--accent': infoPopupData.fromNumber.isAccent === true }"
						@click.prevent.stop="handlePhoneClick($event, infoPopupData.fromNumber)"
					>
						{{ displayFromNumberText }}
					</a>
				<span
					v-else
					class="crm-ai-report-drawer__info-popup-field-value ui-typography-text-md"
					:class="{ '--accent': infoPopupData.fromNumber.isAccent === true }"
				>
					{{ displayFromNumberText }}
				</span>
			</div>
			<div class="crm-ai-report-drawer__info-popup-field">
				<div class="crm-ai-report-drawer__info-popup-field-title ui-typography-text-xs">
					{{ toNumberFieldTitle }}
				</div>
					<a
						v-if="hasToNumberAction"
						:href="getPhoneCallHref(infoPopupData.toNumber)"
						class="crm-ai-report-drawer__info-popup-field-value ui-typography-text-md"
						:class="{ '--accent': infoPopupData.toNumber.isAccent === true }"
						@click.prevent.stop="handlePhoneClick($event, infoPopupData.toNumber)"
					>
						{{ displayToNumberText }}
					</a>
				<span
					v-else
					class="crm-ai-report-drawer__info-popup-field-value ui-typography-text-md"
					:class="{ '--accent': infoPopupData.toNumber.isAccent === true }"
				>
					{{ displayToNumberText }}
				</span>
			</div>
		</div>
	`
	});

	const OpenLinesInfoPopupContent = ui_vue3.defineComponent({
		name: 'CrmAiReportDrawerOpenLinesInfoPopupContent',
		props: {
			infoPopupData: {
				type: Object,
				required: true
			}
		},
		computed: {
			chatLinkFieldTitle() {
				return main_core.Loc.getMessage('CRM_AI_REPORT_DRAWER_INFO_POPUP_CHAT_LINK_TITLE') ?? '';
			},
			chatStartTimeFieldTitle() {
				return main_core.Loc.getMessage('CRM_AI_REPORT_DRAWER_INFO_POPUP_CHAT_START_TIME_TITLE') ?? '';
			},
			chatEndTimeFieldTitle() {
				return main_core.Loc.getMessage('CRM_AI_REPORT_DRAWER_INFO_POPUP_CHAT_END_TIME_TITLE') ?? '';
			},
			channelFieldTitle() {
				return main_core.Loc.getMessage('CRM_AI_REPORT_DRAWER_INFO_POPUP_CHANNEL_TITLE') ?? '';
			},
			hasChatAction() {
				return this.infoPopupData.chat.action?.type === 'open-lines-chat' && main_core.Type.isStringFilled(this.infoPopupData.chat.action.value);
			}
		},
		methods: {
			handleChatClick(event) {
				if (!this.hasChatAction) {
					return;
				}
				const action = this.infoPopupData.chat.action;
				if (!action || action.type !== 'open-lines-chat') {
					return;
				}
				this.openOpenLineChat(action.value);
			},
			openOpenLineChat(dialogId) {
				main_core.Runtime.loadExtension('im.public.iframe').then(exports => {
					const messengerExports = Array.isArray(exports) ? exports[0] : exports;
					const messenger = messengerExports.Messenger;
					messenger?.openLines(dialogId);
				}).catch(exception => {
					console.error('Error loading "im.public.iframe":', exception);
				});
			}
		},
		template: `
		<div class="crm-ai-report-drawer__info-popup">
			<div class="crm-ai-report-drawer__info-popup-field">
				<div class="crm-ai-report-drawer__info-popup-field-title ui-typography-text-xs">
					{{ chatLinkFieldTitle }}
				</div>
				<div class="crm-ai-report-drawer__info-popup-field-value-wrapper">
					<a
						v-if="hasChatAction"
						href="#"
						class="crm-ai-report-drawer__info-popup-field-value --accent ui-typography-text-md"
						@click.prevent="handleChatClick"
					>
						{{ infoPopupData.chat.text }}
					</a>
					<span
						v-else
						class="crm-ai-report-drawer__info-popup-field-value ui-typography-text-md"
						:class="{ '--accent': infoPopupData.chat.isAccent === true }"
					>
						{{ infoPopupData.chat.text }}
					</span>
				</div>
			</div>
			<div class="crm-ai-report-drawer__info-popup-field">
				<div class="crm-ai-report-drawer__info-popup-field-title ui-typography-text-xs">
					{{ chatStartTimeFieldTitle }}
				</div>
				<span class="crm-ai-report-drawer__info-popup-field-value ui-typography-text-md">
					{{ infoPopupData.startedAt }}
				</span>
			</div>
			<div class="crm-ai-report-drawer__info-popup-field">
				<div class="crm-ai-report-drawer__info-popup-field-title ui-typography-text-xs">
					{{ chatEndTimeFieldTitle }}
				</div>
				<span class="crm-ai-report-drawer__info-popup-field-value ui-typography-text-md">
					{{ infoPopupData.endedAt }}
				</span>
			</div>
			<div class="crm-ai-report-drawer__info-popup-field">
				<div class="crm-ai-report-drawer__info-popup-field-title ui-typography-text-xs">
					{{ channelFieldTitle }}
				</div>
				<span class="crm-ai-report-drawer__info-popup-field-value ui-typography-text-md">
					{{ infoPopupData.channel }}
				</span>
			</div>
		</div>
	`
	});

	const InfoButton = ui_vue3.defineComponent({
		name: 'InfoButton',
		components: {
			Button: ui_vue3_components_button.Button
		},
		props: {
			infoPopupData: {
				type: Object,
				required: true
			}
		},
		setup(props) {
			let popup = null;
			const container = ui_vue3.ref(null);
			const initPopup = bindElement => {
				if (!(bindElement instanceof HTMLElement)) {
					return;
				}
				const popupComponent = props.infoPopupData.type === 'open-lines' ? OpenLinesInfoPopupContent : CallInfoPopupContent;
				popup = new PopupController({
					bindElement,
					trigger: 'hover',
					component: popupComponent,
					props: {
						infoPopupData: props.infoPopupData
					},
					popupOptions: {
						width: 320,
						className: 'crm-ai-report-drawer__popup-wrapper --info'
					}
				});
			};
			ui_vue3.onMounted(() => initPopup(container.value));
			ui_vue3.onBeforeUnmount(() => popup?.destroy());
			return {
				AirButtonStyle: ui_vue3_components_button.AirButtonStyle,
				ButtonIcon: ui_vue3_components_button.ButtonIcon,
				ButtonSize: ui_vue3_components_button.ButtonSize,
				Outline: ui_iconSet_api_core.Outline,
				container
			};
		},
		computed: {
			buttonText() {
				const messageCode = this.infoPopupData.type === 'open-lines' ? 'CRM_AI_REPORT_DRAWER_INFO_POPUP_BUTTON_OPEN_LINES' : 'CRM_AI_REPORT_DRAWER_INFO_POPUP_BUTTON_CALL';
				return main_core.Loc.getMessage(messageCode) ?? '';
			}
		},
		template: `
		<div class="crm-ai-report-drawer__toolbar-info-button" ref="container">
			<Button
				:text="buttonText"
				:style="AirButtonStyle.OUTLINE"
				:size="ButtonSize.SMALL"
				:leftIcon="Outline.INFO_CIRCLE"
				class="ui-btn-round"
			/>
		</div>
	`
	});

	const Player = ui_vue3.defineComponent({
		name: 'Player',
		components: {
			AudioPlayerComponent: crm_audioPlayer.AudioPlayerComponent,
			Button: ui_vue3_components_button.Button
		},
		props: {
			recordData: {
				type: Object,
				required: true
			}
		},
		setup() {
			return {
				AirButtonStyle: ui_vue3_components_button.AirButtonStyle,
				ButtonIcon: ui_vue3_components_button.ButtonIcon,
				ButtonSize: ui_vue3_components_button.ButtonSize
			};
		},
		data() {
			return {
				isPlayerVisible: false,
				isPlaying: false,
				playerButtonText: '00:00 / --:--'
			};
		},
		computed: {
			playerIcon() {
				return this.isPlaying ? ui_iconSet_api_core.Outline.PAUSE_L : ui_iconSet_api_core.Outline.PLAY_L;
			}
		},
		methods: {
			togglePlayback() {
				this.isPlayerVisible = true;
				void this.$nextTick(() => {
					const player = this.getAudioPlayer();
					if (!player) {
						return;
					}
					if (String(player.state) === 'play') {
						player.pause();
					} else {
						player.play();
					}
				});
			},
			hidePlayer() {
				this.isPlayerVisible = false;
				const player = this.getAudioPlayer();
				if (!player) {
					return;
				}
				player.pause();
			},
			getAudioPlayer() {
				return this.$refs.audioPlayer;
			},
			syncTimes() {
				const audioPlayer = this.getAudioPlayer();
				if (!audioPlayer) {
					return;
				}
				const timeCurrent = Number(audioPlayer.timeCurrent) || 0;
				const timeTotal = Number(audioPlayer.timeTotal) || 0;
				this.playerButtonText = `${this.formatTime(timeCurrent)} / ${this.formatTotalTime(timeTotal)}`;
				this.isPlaying = String(audioPlayer.state) === 'play';
			},
			formatTotalTime(seconds) {
				if (!seconds) {
					return '--:--';
				}
				return this.formatTime(seconds);
			},
			formatTime(seconds) {
				seconds = Math.floor(seconds);
				const hour = Math.floor(seconds / 60 / 60);
				if (hour > 0) {
					seconds -= hour * 60 * 60;
				}
				const minute = Math.floor(seconds / 60);
				if (minute > 0) {
					seconds -= minute * 60;
				}
				return (hour > 0 ? `${hour}:` : '') + (hour > 0 ? `${minute.toString().padStart(2, '0')}:` : `${minute}:`) + seconds.toString().padStart(2, '0');
			}
		},
		mounted() {
			void this.$nextTick(() => {
				const audioPlayer = this.getAudioPlayer();
				audioPlayer?.loadFile?.(false);
				this.syncTimes();
				this.$watch(() => {
					const player = this.getAudioPlayer();
					if (!player) {
						return '';
					}
					return `${player.state}:${player.timeCurrent}:${player.timeTotal}`;
				}, () => this.syncTimes());
			});
		},
		template: `
		<div class="crm-ai-report-drawer__toolbar-player-button">
			<Button
				:text="playerButtonText"
				:style="AirButtonStyle.OUTLINE"
				:size="ButtonSize.SMALL"
				:leftIcon="playerIcon"
				class="ui-btn-round"
				@click="togglePlayback"
			/>
		</div>
		<div class="crm-ai-report-drawer__bottom-player" v-show="isPlayerVisible">
			<AudioPlayerComponent :id="recordData.recordId" :src="recordData.recordSrc" ref="audioPlayer" />
			<span
				class="crm-ai-report-drawer__bottom-player-close"
				role="button"
				@click="hidePlayer"
			/>
		</div>
	`
	});

	const Toolbar = ui_vue3.defineComponent({
		name: 'Toolbar',
		emits: ['anchorActivated'],
		components: {
			Anchor,
			InfoButton,
			Player
		},
		props: {
			anchors: {
				type: Array,
				required: true
			},
			activeAnchorBlockId: {
				type: String,
				default: null
			},
			record: {
				type: Object
			},
			infoPopup: {
				type: Object
			}
		},
		computed: {
			hasRecord() {
				return !main_core.Type.isNil(this.record);
			},
			hasInfoPopup() {
				return !main_core.Type.isNil(this.infoPopup);
			}
		},
		methods: {
			handleAnchorActivated(blockId) {
				this.$emit('anchorActivated', blockId);
			}
		},
		template: `
		<div class="crm-ai-report-drawer__toolbar">
			<div class="crm-ai-report-drawer__toolbar-left">
				<Player v-if="hasRecord" :recordData="record" />
				<InfoButton v-if="hasInfoPopup" :infoPopupData="infoPopup" />
			</div>
			<span class="crm-ai-report-drawer__anchors">
				<Anchor
					v-for="anchor in anchors"
					:key="anchor.blockId"
					:blockId="anchor.blockId"
					:text="anchor.text"
					:isActive="anchor.blockId === activeAnchorBlockId"
					@activated="handleAnchorActivated"
				/>
			</span>
		</div>
	`
	});

	const FailedCriterion = ui_vue3.defineComponent({
		name: 'FailedCriterion',
		props: {
			title: {
				type: String,
				required: true
			},
			description: {
				type: String,
				default: ''
			},
			summary: {
				type: String,
				required: true
			}
		},
		data() {
			return {
				isContentHidden: false,
				isConditionsHidden: true
			};
		},
		methods: {
			toggleContentSpoiler() {
				this.isContentHidden = !this.isContentHidden;
			},
			toggleConditionsSpoiler() {
				this.isConditionsHidden = !this.isConditionsHidden;
			}
		},
		template: `
		<div class="crm-ai-report-drawer__content-block crm-ai-report-drawer__failed-criteria-block --ui-context-content-light">
			<div class="crm-ai-report-drawer__failed-criteria-block-header crm-ai-report-drawer__spoiler-toggle-trigger" @click="toggleContentSpoiler()">
				<div class="crm-ai-report-drawer__failed-criteria-block-cross" />
				<div class="crm-ai-report-drawer__failed-criteria-block-title ui-typography-text-lg ui-typography-text-bold">
					{{ title }}
				</div>
				<div class="crm-ai-report-drawer__spoiler-chevron" />
			</div>
			<div
				:class="[
					'crm-ai-report-drawer__failed-criteria-block-ai-analysis',
					'crm-ai-report-drawer__spoiler-content',
					isContentHidden ? '--hidden' : '',
				]"
			>
				<div class="crm-ai-report-drawer__spoiler-content-inner">
					<div class="crm-ai-report-drawer__failed-criteria-block-commentary ui-typography-text-lg">
						{{ summary }}
					</div>
					<div class="crm-ai-report-drawer__failed-criteria-block-description ui-typography-text-md" @click="toggleConditionsSpoiler">
						{{ loc('CRM_AI_REPORT_DRAWER_FAILED_CRITERIA_CONDITIONS_TITLE') }}
						<span class="crm-ai-report-drawer__spoiler-chevron" />
					</div>
					<div :class="['crm-ai-report-drawer__spoiler-content', isConditionsHidden ? '--hidden' : '']">
						<div class="crm crm-ai-report-drawer__spoiler-content-inner ui-typography-text-md">
							{{ description }}
						</div>
					</div>
				</div>
			</div>
		</div>
	`
	});

	const Criterion = ui_vue3.defineComponent({
		name: 'Criterion',
		props: {
			name: {
				type: String,
				required: true
			},
			text: {
				type: String,
				required: true
			},
			status: {
				type: String,
				required: true
			}
		},
		computed: {
			statusClass() {
				return `--${this.status}`;
			}
		},
		template: `
		<div class="crm-ai-report-drawer__criteria">
			<div class="crm-ai-report-drawer__criteria-name ui-typography-text-lg ui-typography-text-bold">
				<span :class="['crm-ai-report-drawer__criteria-name-circle', statusClass]" />
				{{ name }}
			</div>
			<div class="crm-ai-report-drawer__criteria-text ui-typography-text-lg">{{ text }}</div>
		</div>
	`
	});

	const SCRIPT_LINK_ROLE = 'report-drawer-script-link';
	const ScriptName = ui_vue3.defineComponent({
		name: 'ScriptName',
		props: {
			scriptName: {
				type: String,
				required: true
			},
			assessmentSettingId: {
				type: Number,
				required: true
			},
			legacy: {
				type: Boolean
			}
		},
		computed: {
			className() {
				return ['crm-ai-report-drawer__content-block-script-name', 'ui-typography-text-md', {
					'--legacy-assessment': this.legacy
				}];
			},
			markup() {
				return main_core.Loc.getMessage('CRM_AI_REPORT_DRAWER_ASSESSMENT_SCRIPT_NAME', {
					'#SCRIPT_NAME#': `
						<span
							data-role="${SCRIPT_LINK_ROLE}"
							class="crm-ai-report-drawer__content-block-script-name-highlight"
						>
							${main_core.Text.encode(this.scriptName)}
						</span>
					`
				}) ?? '';
			}
		},
		methods: {
			handleClick(event) {
				const target = event.target;
				if (!(target instanceof HTMLElement) || !target.closest(`[data-role="${SCRIPT_LINK_ROLE}"]`)) {
					return;
				}
				const route = main_core.Type.isInteger(this.assessmentSettingId) ? `/crm/copilot-call-assessment/details/${this.assessmentSettingId}/` : '/crm/copilot-call-assessment/';
				crm_router.Router.openSlider(route, {
					width: 900,
					cacheable: false
				});
			}
		},
		template: `
		<span :class="className" @click="handleClick" v-html="markup" />
	`
	});

	function formatCreatedAt(createdAt) {
		if (!main_core.Type.isInteger(createdAt) || createdAt <= 0) {
			return '';
		}
		return crm_timeline_tools.DatetimeConverter.createFromServerTimestamp(createdAt).toUserTime().toDatetimeString({
			withFullMonth: false,
			delimiter: ', '
		});
	}
	function formatAssessmentDate(createdAt) {
		if (!main_core.Type.isInteger(createdAt) || createdAt <= 0) {
			return '';
		}
		const date = crm_timeline_tools.DatetimeConverter.createFromServerTimestamp(createdAt).toUserTime().getValue();
		return main_date.DateTimeFormat.format(main_date.DateTimeFormat.getFormat('DAY_MONTH_FORMAT'), date).replaceAll('\\', '');
	}

	const Assessment = ui_vue3.defineComponent({
		name: 'Assessment',
		components: {
			FailedCriterion,
			Criterion,
			Button: ui_vue3_components_button.Button,
			ScriptName
		},
		directives: {
			hint: ui_vue3_directives_hint.hint
		},
		props: {
			assessmentBlockData: {
				type: Object,
				required: true
			},
			assessmentSetting: {
				type: Object,
				default: null
			}
		},
		emits: ['showReassessmentPopup'],
		setup() {
			return {
				AirButtonStyle: ui_vue3_components_button.AirButtonStyle,
				ButtonIcon: ui_vue3_components_button.ButtonIcon,
				ButtonSize: ui_vue3_components_button.ButtonSize,
				Outline: ui_iconSet_api_core.Outline
			};
		},
		computed: {
			chartColor() {
				if (this.assessmentBlockData.callScore <= this.assessmentBlockData.lowerScoreBoundary) {
					return ui_progressround.ProgressRound.Color.DANGER;
				}
				if (this.assessmentBlockData.callScore >= this.assessmentBlockData.upperScoreBoundary) {
					return ui_progressround.ProgressRound.Color.SUCCESS;
				}
				return ui_progressround.ProgressRound.Color.PRIMARY;
			},
			successCriteriaCount() {
				return this.assessmentBlockData.successCriteria.length;
			},
			unusedCriteriaCount() {
				return this.assessmentBlockData.unusedCriteria.length;
			},
			assessmentDate() {
				return formatAssessmentDate(this.assessmentBlockData.createdAt);
			},
			isHistory() {
				return this.assessmentBlockData.isHistory && main_core.Type.isStringFilled(this.assessmentDate);
			},
			headerTitle() {
				if (!this.isHistory) {
					return main_core.Loc.getMessage('CRM_AI_REPORT_DRAWER_ASSESSMENT_BLOCK_TITLE') ?? '';
				}
				return main_core.Loc.getMessage('CRM_AI_REPORT_DRAWER_ASSESSMENT_HISTORY_BLOCK_TITLE', {
					'#DATE#': this.assessmentDate,
					'#SCRIPT_NAME#': this.assessmentBlockData.scriptName
				}) ?? '';
			},
			successCriteriaNameElement() {
				const stringElement = main_core.Loc.getMessage('CRM_AI_REPORT_DRAWER_ASSESSMENT_SUCCESS_CRITERIA_TITLE', {
					'#COUNT#': `
						<span class="crm-ai-report-drawer__content-block-assessment-criteria-footer-cell-counter ui-typography-text-md">
							${this.successCriteriaCount}
						</span>
					`
				});
				return main_core.Tag.render`<span>${stringElement}</span>`;
			},
			unusedCriteriaNameElement() {
				const stringElement = main_core.Loc.getMessage('CRM_AI_REPORT_DRAWER_ASSESSMENT_UNUSED_CRITERIA_TITLE', {
					'#COUNT#': `
						<span class="crm-ai-report-drawer__content-block-assessment-criteria-footer-cell-counter ui-typography-text-md">
							${this.unusedCriteriaCount}
						</span>
					`
				});
				return main_core.Tag.render`<span>${stringElement}</span>`;
			},
			hasChevron() {
				return !this.assessmentBlockData.useInRating;
			},
			showScriptUpdatedBadge() {
				return !main_core.Type.isNull(this.assessmentSetting) && this.assessmentBlockData.shouldShowReassessmentBadge;
			},
			roundChartHintHtml() {
				const title = main_core.Text.encode(main_core.Loc.getMessage('CRM_AI_REPORT_DRAWER_ASSESSMENT_CHART_HINT_TITLE') ?? '');
				const text = main_core.Text.encode(main_core.Loc.getMessage('CRM_AI_REPORT_DRAWER_ASSESSMENT_CHART_HINT_TEXT') ?? '').replace(/\n/g, '<br>');
				return `
				<div class="ui-typography-text-lg ui-typography-text-bold">${title}</div>
				<br>
				<div class="ui-typography-text-md">${text}</div>
			`;
			},
			roundChartHintOptions() {
				if (this.hasChevron) {
					return null;
				}
				return {
					html: this.roundChartHintHtml
				};
			}
		},
		data() {
			return {
				minimized: !this.assessmentBlockData.useInRating,
				isCompletedCriteriaHidden: true,
				isUnusedCriteriaHidden: true
			};
		},
		methods: {
			handleHowItWorksClick() {
				const topWindow = window.top;
				topWindow?.BX?.Helper?.show('redirect=detail&code=23240682');
				return {};
			},
			toggleContentSpoiler() {
				this.minimized = !this.minimized;
			},
			toggleCompletedCriteriaSpoiler(canToggle) {
				if (!canToggle) {
					return;
				}
				this.isCompletedCriteriaHidden = !this.isCompletedCriteriaHidden;
			},
			toggleUnusedCriteriaSpoiler(canToggle) {
				if (!canToggle) {
					return;
				}
				this.isUnusedCriteriaHidden = !this.isUnusedCriteriaHidden;
			},
			handleShowReassessmentPopup() {
				if (main_core.Type.isNull(this.assessmentSetting)) {
					return;
				}
				this.$emit('showReassessmentPopup', this.assessmentSetting);
			},
			createRoundChart() {
				if (!this.hasChevron) {
					const chart = new ui_progressround.ProgressRound({
						value: this.assessmentBlockData.callScore,
						maxValue: 100,
						color: this.chartColor,
						width: 76,
						textBefore: '',
						textAfter: '',
						colorTrack: '',
						colorBar: '',
						statusType: ui_progressround.ProgressRound.Status.INCIRCLE,
						lineSize: 9,
						fill: true,
						finished: false,
						rotation: false,
						useAirDesign: true
					});
					chart.renderTo(this.$refs.assessmentChart);
				} else {
					const chart = new ui_progressround.ProgressRound({
						value: this.assessmentBlockData.callScore,
						maxValue: 100,
						color: ui_progressround.ProgressRound.Color.DEFAULT,
						width: 32,
						textBefore: '',
						textAfter: this.assessmentBlockData.callScore + '%',
						colorTrack: 'var(--ui-color-base-8)',
						colorBar: 'var(--ui-color-base-6)',
						statusType: ui_progressround.ProgressRound.Status.NONE,
						lineSize: 9,
						fill: true,
						finished: false,
						rotation: false,
						useAirDesign: true
					});
					const container = main_core.Tag.render`
					<span class="crm-ai-report-drawer__content-block-header-chart-disabled" />
				`;
					chart.renderTo(container);
					const chevron = main_core.Tag.render`
					<div class="crm-ai-report-drawer__spoiler-chevron"/>
				`;
					main_core.Dom.append(chevron, container);
					main_core.Dom.append(container, this.$refs.assessmentChart);
				}
			}
		},
		mounted() {
			this.createRoundChart();
			main_core.Dom.append(this.successCriteriaNameElement, this.$refs.successCriteriaNameSection);
			main_core.Dom.append(this.unusedCriteriaNameElement, this.$refs.unusedCriteriaNameSection);
		},
		template: `
		<div :class="['crm-ai-report-drawer__content-block', 'crm-ai-report-drawer__assessment-block', '--ui-context-edge-dark', minimized ? '--minimized' : '']">
			<div
				v-if="hasChevron"
				class="crm-ai-report-drawer__content-block-assessment-header crm-ai-report-drawer__content-block-assessment-header--collapsible"
			>
				<div
					class="crm-ai-report-drawer__content-block-assessment-header-main crm-ai-report-drawer__spoiler-toggle-trigger"
					@click="toggleContentSpoiler"
				>
					<h4 class="crm-ai-report-drawer__content-block-header-title ui-typography-heading-h4">
						{{ headerTitle }}
					</h4>
					<div
						class="crm-ai-report-drawer__content-block-header-chart"
						ref="assessmentChart"
					/>
				</div>
				<div v-show="!minimized" class="crm-ai-report-drawer__content-block-assessment-header-extra">
					<ScriptName
						v-if="!isHistory"
						:scriptName="assessmentBlockData.scriptName"
						:assessmentSettingId="assessmentBlockData.assessmentSettingId"
						class="crm-ai-report-drawer__content-block-assessment-header-script-name"
					/>
					<Button
						:text="loc('CRM_AI_REPORT_DRAWER_ASSESSMENT_NOT_USED_IN_RATING')"
						:style="AirButtonStyle.OUTLINE_NO_ACCENT"
						:size="ButtonSize.SMALL"
						:collapsedIcon="ButtonIcon.DOTS"
						:leftIcon="Outline.QUESTION"
						class="crm-ai-report-drawer__content-block-header-assessment-badge crm-ai-report-drawer__content-block-header-assessment-not-used-in-rating-badge"
						@click="handleHowItWorksClick"
					/>
					<div class="crm-ai-report-drawer__content-block-header-assessment-review ui-typography-text-lg">
						{{ assessmentBlockData.recommendation }}
					</div>
				</div>
			</div>
			<div
				v-else
				class="crm-ai-report-drawer__content-block-assessment-header"
			>
				<div class="crm-ai-report-drawer__content-block-assessment-header-text">
					<h4 class="crm-ai-report-drawer__content-block-header-title ui-typography-heading-h4">
						{{ headerTitle }}
					</h4>
					<ScriptName
						v-if="!isHistory"
						:scriptName="assessmentBlockData.scriptName"
						:assessmentSettingId="assessmentBlockData.assessmentSettingId"
						class="crm-ai-report-drawer__content-block-assessment-header-script-name"
					/>
					<Button
						v-if="showScriptUpdatedBadge"
						:text="loc('CRM_AI_REPORT_DRAWER_ASSESSMENT_SCRIPT_UPDATED_REASSESS')"
						:style="AirButtonStyle.OUTLINE_NO_ACCENT"
						:size="ButtonSize.SMALL"
						:collapsedIcon="ButtonIcon.DOTS"
						class="crm-ai-report-drawer__content-block-header-assessment-badge crm-ai-report-drawer__content-block-header-assessment-script-updated-badge"
						@click="handleShowReassessmentPopup"
					/>
					<div class="crm-ai-report-drawer__content-block-header-assessment-review ui-typography-text-lg">
						{{ assessmentBlockData.recommendation }}
					</div>
				</div>
				<div
					class="crm-ai-report-drawer__content-block-header-chart"
					ref="assessmentChart"
					v-hint="roundChartHintOptions"
				/>
			</div>
			<div class="crm-ai-report-drawer__content-block-assessment-criteria">
				<div
					v-show="!minimized"
					class="crm-ai-report-drawer__content-block-assessment-criteria-ai-logo"
				/>
				<div
					:class="[
						'crm-ai-report-drawer__content-block-assessment-criteria-failures-spoiler',
						'crm-ai-report-drawer__spoiler-content',
						minimized ? '--hidden' : '',
					]"
				>
					<div class="crm-ai-report-drawer__spoiler-content-inner">
						<div class="crm-ai-report-drawer__content-block-assessment-criteria-failures-list">
							<FailedCriterion
								v-for="(failedCriterion, index) in assessmentBlockData.failedCriteria"
								:key="index"
								:title="failedCriterion.title"
								:description="failedCriterion.description"
								:summary="failedCriterion.summary"
							/>
							<div class="crm-ai-report-drawer__content-block-assessment-criteria-footer --ui-context-content-light">
								<div
									:class="[
										'crm-ai-report-drawer__content-block-assessment-criteria-footer-cell',
										successCriteriaCount !== 0 ? 'crm-ai-report-drawer__spoiler-toggle-trigger' : '',
									]"
									@click="toggleCompletedCriteriaSpoiler(successCriteriaCount !== 0)"
								>
									<div class="crm-ai-report-drawer__content-block-assessment-criteria-footer-cell-title">
										<span class="crm-ai-report-drawer__content-block-assessment-criteria-footer-cell-title-check" />
										<span class="ui-typography-text-lg ui-typography-text-bold" ref="successCriteriaNameSection" />
									</div>
									<div
										v-if="successCriteriaCount !== 0"
										class="crm-ai-report-drawer__spoiler-chevron"
									/>
								</div>
								<div :class="['crm-ai-report-drawer__spoiler-content', isCompletedCriteriaHidden ? '--hidden' : '']">
									<div class="crm-ai-report-drawer__spoiler-content-inner">
										<div class="crm-ai-report-drawer__footer-criteria-container">
											<Criterion
												v-for="(criterion, index) in assessmentBlockData.successCriteria"
												:key="index"
												:status="criterion.status"
												:name="criterion.title"
												:text="criterion.summary"
											/>
										</div>
									</div>
								</div>
								<div class="crm-ai-report-drawer__content-block-assessment-criteria-footer-cell-divider" />
								<div
									:class="[
										'crm-ai-report-drawer__content-block-assessment-criteria-footer-cell',
										unusedCriteriaCount !== 0 ? 'crm-ai-report-drawer__spoiler-toggle-trigger' : '',
									]"
									@click="toggleUnusedCriteriaSpoiler(unusedCriteriaCount !== 0)"
								>
									<div class="crm-ai-report-drawer__content-block-assessment-criteria-footer-cell-title">
										<span class="crm-ai-report-drawer__content-block-assessment-criteria-footer-cell-title-circle-minus" />
										<span class="ui-typography-text-lg ui-typography-text-bold" ref="unusedCriteriaNameSection" />
									</div>
									<div
										v-if="unusedCriteriaCount !== 0"
										class="crm-ai-report-drawer__spoiler-chevron"
									/>
								</div>
								<div :class="['crm-ai-report-drawer__spoiler-content', isUnusedCriteriaHidden ? '--hidden' : '']">
									<div class="crm-ai-report-drawer__spoiler-content-inner">
										<div class="crm-ai-report-drawer__footer-criteria-container">
											<Criterion
												v-for="(criterion, index) in assessmentBlockData.unusedCriteria"
												:key="index"
												:status="criterion.status"
												:name="criterion.title"
												:text="criterion.summary"
											/>
										</div>
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	`
	});

	const Search = ui_vue3.defineComponent({
		name: 'Search',
		props: {
			searchArea: {
				type: [HTMLElement, null],
				required: true
			}
		},
		data() {
			return {
				searchText: '',
				highlightTimeoutId: null
			};
		},
		computed: {
			hasSearchText() {
				return this.searchText.length > 0;
			}
		},
		methods: {
			clearSearch() {
				this.searchText = '';
				this.cancelHighlightUpdate();
				this.removeHighlight();
				const input = this.$refs.searchInput;
				input?.focus();
			},
			cancelHighlightUpdate() {
				if (this.highlightTimeoutId === null) {
					return;
				}
				window.clearTimeout(this.highlightTimeoutId);
				this.highlightTimeoutId = null;
			},
			scheduleHighlightUpdate() {
				this.cancelHighlightUpdate();
				this.highlightTimeoutId = window.setTimeout(() => {
					this.removeHighlight();
					this.highlightSearchText();
					this.highlightTimeoutId = null;
				}, 250);
			},
			highlightSearchText() {
				const searchText = this.searchText.trim();
				const searchArea = this.$props.searchArea;
				if (searchText === '' || main_core.Type.isNull(searchArea)) {
					return;
				}
				const escapedText = searchText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
				const innerHTML = searchArea.innerHTML;
				const regex = new RegExp(`(${escapedText})`, 'gi');
				searchArea.innerHTML = innerHTML.replace(regex, '<mark>$1</mark>');
			},
			removeHighlight() {
				const searchArea = this.$props.searchArea;
				if (main_core.Type.isNull(searchArea)) {
					return;
				}
				const innerHTML = searchArea.innerHTML;
				searchArea.innerHTML = innerHTML.replaceAll(/<\/*mark>/gm, '');
			}
		},
		watch: {
			searchText() {
				if (this.searchText.trim() === '') {
					this.cancelHighlightUpdate();
					this.removeHighlight();
					return;
				}
				this.scheduleHighlightUpdate();
			}
		},
		beforeUnmount() {
			this.cancelHighlightUpdate();
		},
		template: `
		<div
			class="crm-ai-report-drawer__content-block-header-search ui-ctl ui-ctl-w100 ui-ctl-textbox ui-ctl-after-icon"
		>
			<input
				ref="searchInput"
				type="text"
				class="ui-ctl-element"
				:placeholder="loc('CRM_AI_REPORT_DRAWER_SEARCH_PLACEHOLDER')"
				v-model="searchText"
			>
			<button
				v-if="hasSearchText"
				type="button"
				class="ui-ctl-after ui-ctl-icon-clear"
				@click.stop.prevent="clearSearch"
			/>
			<span v-else class="ui-ctl-icon ui-ctl-icon-search ui-ctl-after"></span>
		</div>
	`
	});

	const BlockShell = ui_vue3.defineComponent({
		name: 'BlockShell',
		components: {
			Search
		},
		props: {
			title: {
				type: String,
				required: true
			},
			iconClass: {
				type: String,
				default: ''
			},
			searchArea: {
				type: Object,
				default: null
			},
			initiallyMinimized: {
				type: Boolean
			}
		},
		computed: {
			hasSearchArea() {
				return this.searchArea instanceof HTMLElement;
			}
		},
		data() {
			return {
				isMinimized: this.initiallyMinimized
			};
		},
		methods: {
			toggleContentSpoiler() {
				this.isMinimized = !this.isMinimized;
			},
			handleHeaderClick(event) {
				if (main_core.Type.isElementNode(event.target) && (Boolean(event.target.closest('.crm-ai-report-drawer__content-block-header-search')) || Boolean(event.target.closest('.crm-ai-report-drawer__content-block-header-control')))) {
					return;
				}
				this.toggleContentSpoiler();
			}
		},
		template: `
		<div class="crm-ai-report-drawer__content-block --ui-context-content-light">
				<div
					:class="[
						'crm-ai-report-drawer__content-block-header',
						isMinimized ? '--minimized' : '',
						'crm-ai-report-drawer__spoiler-toggle-trigger',
					]"
					@click="handleHeaderClick"
				>
				<div class="crm-ai-report-drawer__content-block-header-main">
					<div class="crm-ai-report-drawer__content-block-header-title-block">
						<span v-if="iconClass" :class="iconClass" />
						<h4 class="crm-ai-report-drawer__content-block-header-title ui-typography-heading-h4">
							{{ title }}
						</h4>
					</div>
					<div v-if="$slots.headerMeta" class="crm-ai-report-drawer__content-block-header-meta">
						<slot name="headerMeta" />
					</div>
				</div>
				<div class="crm-ai-report-drawer__content-block-header-search-block">
					<div v-if="$slots.headerControls" class="crm-ai-report-drawer__content-block-header-control">
						<slot name="headerControls" />
					</div>
					<Search v-show="!isMinimized && hasSearchArea" :searchArea="searchArea" />
					<div class="crm-ai-report-drawer__spoiler-chevron" />
				</div>
			</div>
			<div :class="['crm-ai-report-drawer__spoiler-content', isMinimized ? '--hidden' : '']">
				<div class="crm-ai-report-drawer__spoiler-content-inner">
					<div v-if="$slots.contentMeta" class="crm-ai-report-drawer__content-block-content-meta">
						<slot name="contentMeta" />
					</div>
					<div class="crm-ai-report-drawer__content-block-body ui-typography-text-lg">
						<slot />
						<div v-if="$slots.footer" class="crm-ai-report-drawer__content-block-footer">
							<slot name="footer" />
						</div>
					</div>
				</div>
			</div>
		</div>
	`
	});

	const TextBlock = ui_vue3.defineComponent({
		name: 'TextBlock',
		components: {
			BlockShell,
			ScriptName
		},
		props: {
			blockData: {
				type: Object,
				required: true
			}
		},
		computed: {
			hasAiLanguage() {
				return main_core.Type.isStringFilled(this.blockData.aiLanguage?.trim());
			},
			isLegacyAssessment() {
				return this.blockData.blockType === 'legacyAssessment';
			},
			legacyAssessmentData() {
				return this.isLegacyAssessment ? this.blockData : null;
			},
			iconClass() {
				if (this.isLegacyAssessment) {
					return 'crm-ai-report-drawer__content-block-header-legacy-assessment-icon';
				}
				if (this.blockData.blockType === 'summary') {
					return 'crm-ai-report-drawer__content-block-header-summary-icon';
				}
				return 'crm-ai-report-drawer__content-block-header-transcription-icon';
			},
			textClass() {
				return this.blockData.blockType === 'transcription' ? 'crm-ai-report-drawer__text-transcription' : '';
			},
			hasCreatedAt() {
				return main_core.Type.isInteger(this.blockData.createdAt) && this.blockData.createdAt > 0;
			},
			createdAtText() {
				return formatCreatedAt(this.blockData.createdAt);
			}
		},
		data() {
			return {
				searchArea: null
			};
		},
		mounted() {
			this.searchArea = this.$refs.textContainer;
		},
		template: `
		<BlockShell
			:title="blockData.title"
			:iconClass="iconClass"
			:searchArea="searchArea"
			:initiallyMinimized="blockData.minimized"
		>
			<template v-if="legacyAssessmentData" #contentMeta>
				<div class="crm-ai-report-drawer__content-block-legacy-assessment-script-section">
					<ScriptName
						:scriptName="legacyAssessmentData.scriptName"
						:assessmentSettingId="legacyAssessmentData.assessmentSettingId"
						legacy
					/>
				</div>
			</template>
			<p
				:class="textClass"
				ref="textContainer"
			>
				{{ blockData.text }}
			</p>
			<template v-if="hasAiLanguage || hasCreatedAt" #footer>
				<div
					v-if="hasAiLanguage"
					class="crm-ai-report-drawer__content-block-message ui-typography-text-sm"
					v-html="blockData.aiLanguage"
				/>
				<div v-if="hasCreatedAt" class="crm-ai-report-drawer__content-block-date ui-typography-text-xs">
					{{ createdAtText }}
				</div>
			</template>
		</BlockShell>
	`
	});

	const TrailingSpacerBlock = ui_vue3.defineComponent({
		name: 'TrailingSpacerBlock',
		data() {
			return {
				spacerHeight: 0
			};
		},
		mounted() {
			this.resizeObserver = new ResizeObserver(() => {
				this.updateHeight();
			});
			this.syncObservedElements();
			this.updateHeight();
		},
		updated() {
			this.syncObservedElements();
			this.updateHeight();
		},
		beforeUnmount() {
			this.resizeObserver?.disconnect?.();
		},
		methods: {
			getContentContainer() {
				const container = this.$el?.parentElement;
				return container instanceof HTMLElement ? container : null;
			},
			getLastBlock() {
				const lastBlock = this.$el?.previousElementSibling;
				return lastBlock instanceof HTMLElement ? lastBlock : null;
			},
			getContentGap(container) {
				const computedStyle = window.getComputedStyle(container);
				const gap = computedStyle.rowGap || computedStyle.gap || '0';
				return Number.parseFloat(gap) || 0;
			},
			syncObservedElements() {
				const resizeObserver = this.resizeObserver;
				if (!resizeObserver) {
					return;
				}
				const container = this.getContentContainer();
				const lastBlock = this.getLastBlock();
				if (this.observedContainer === container && this.observedLastBlock === lastBlock) {
					return;
				}
				resizeObserver.disconnect();
				if (container) {
					resizeObserver.observe(container);
				}
				if (lastBlock) {
					resizeObserver.observe(lastBlock);
				}
				this.observedContainer = container;
				this.observedLastBlock = lastBlock;
			},
			updateHeight() {
				const container = this.getContentContainer();
				const lastBlock = this.getLastBlock();
				if (!container || !lastBlock) {
					this.spacerHeight = 0;
					return;
				}
				this.spacerHeight = Math.max(container.clientHeight - lastBlock.offsetHeight - this.getContentGap(container), 0);
			}
		},
		template: `
		<div
			aria-hidden="true"
			class="crm-ai-report-drawer__trailing-spacer"
			:style="{ height: \`\${spacerHeight}px\` }"
		/>
	`
	});

	const ANCHOR_ACTIVATION_LINE_OFFSET_PX = 6;
	const PROGRAMMATIC_SCROLL_MAX_DISTANCE_TO_TARGET_PX = 2;
	const App = ui_vue3.defineComponent({
		name: 'App',
		components: {
			Header,
			Toolbar,
			Assessment,
			TextBlock,
			TrailingSpacerBlock
		},
		props: {
			viewData: {
				type: Object,
				required: true
			},
			shareLink: {
				type: String,
				default: null
			}
		},
		data() {
			const activeAnchor = this.viewData.anchors.find(anchor => anchor.isActive);
			return {
				activeAnchorBlockId: activeAnchor?.blockId ?? null,
				isProgrammaticScrollInProgress: false,
				programmaticScrollTargetTop: null
			};
		},
		setup() {
			return {
				anchoredBlockElements: {}
			};
		},
		emits: ['showReassessmentPopup', 'chooseNewScript'],
		methods: {
			handleShowReassessmentPopup(assessmentSetting) {
				this.$emit('showReassessmentPopup', assessmentSetting);
			},
			handleChooseNewScript(bindElement) {
				this.$emit('chooseNewScript', bindElement);
			},
			setAnchoredBlockElement(blockId, anchoredBlockRef) {
				if (anchoredBlockRef === null) {
					delete this.anchoredBlockElements[blockId];
					return;
				}
				const element = anchoredBlockRef instanceof Element ? anchoredBlockRef : anchoredBlockRef.$el;
				this.anchoredBlockElements[blockId] = element instanceof HTMLElement ? element : null;
			},
			getAnchoredBlockElement(blockId) {
				const anchoredBlockElement = this.anchoredBlockElements[blockId];
				return anchoredBlockElement instanceof HTMLElement && anchoredBlockElement.isConnected ? anchoredBlockElement : null;
			},
			handleAnchorActivated(blockId) {
				this.activeAnchorBlockId = blockId;
				this.scrollToBlock(blockId);
			},
			handleContentScroll() {
				if (this.isProgrammaticScrollInProgress) {
					this.finishProgrammaticScrollIfReachedTarget();
					return;
				}
				this.updateActiveAnchorFromScroll();
			},
			finishProgrammaticScrollIfReachedTarget() {
				const content = this.$refs.content;
				if (!(content instanceof HTMLElement)) {
					return;
				}
				if (this.programmaticScrollTargetTop === null) {
					this.finishProgrammaticScroll();
					return;
				}
				if (Math.abs(content.scrollTop - this.programmaticScrollTargetTop) > PROGRAMMATIC_SCROLL_MAX_DISTANCE_TO_TARGET_PX) {
					return;
				}
				this.finishProgrammaticScroll();
			},
			finishProgrammaticScroll() {
				this.programmaticScrollTargetTop = null;
				this.isProgrammaticScrollInProgress = false;
				this.updateActiveAnchorFromScroll();
			},
			resolveActiveAnchorBlockId(blockPositions) {
				if (blockPositions.length === 0) {
					return null;
				}
				const activeBlock = [...blockPositions].reverse().find(({
					top
				}) => top <= ANCHOR_ACTIVATION_LINE_OFFSET_PX);
				return activeBlock?.blockId ?? blockPositions[0].blockId;
			},
			updateActiveAnchorFromScroll() {
				const content = this.$refs.content;
				if (!(content instanceof HTMLElement)) {
					return;
				}
				const contentTop = content.getBoundingClientRect().top;
				const blockPositions = this.viewData.anchors.reduce((positions, {
					blockId
				}) => {
					const element = this.getAnchoredBlockElement(blockId);
					if (!(element instanceof HTMLElement)) {
						return positions;
					}
					positions.push({
						blockId,
						top: element.getBoundingClientRect().top - contentTop
					});
					return positions;
				}, []);
				if (blockPositions.length === 0) {
					return;
				}
				this.activeAnchorBlockId = this.resolveActiveAnchorBlockId(blockPositions) ?? this.activeAnchorBlockId;
			},
			scrollToBlock(blockId) {
				const content = this.$refs.content;
				if (!(content instanceof HTMLElement)) {
					return;
				}
				const block = this.getAnchoredBlockElement(blockId);
				if (!(block instanceof HTMLElement)) {
					return;
				}
				const maxScrollTop = Math.max(content.scrollHeight - content.clientHeight, 0);
				const targetScrollTop = Math.min(Math.max(content.scrollTop + block.getBoundingClientRect().top - content.getBoundingClientRect().top, 0), maxScrollTop);
				this.programmaticScrollTargetTop = targetScrollTop;
				this.isProgrammaticScrollInProgress = Math.abs(content.scrollTop - targetScrollTop) > PROGRAMMATIC_SCROLL_MAX_DISTANCE_TO_TARGET_PX;
				if (!this.isProgrammaticScrollInProgress) {
					this.finishProgrammaticScroll();
					return;
				}
				content.scrollTo({
					top: targetScrollTop,
					behavior: 'smooth'
				});
			}
		},
		template: `
		<div class="crm-ai-report-drawer --ui-context-edge-dark ui-icon-set__scope">
			<Header
				:title="viewData.title"
				:subtitle="viewData.subtitle"
				:settings="viewData.settings"
				:shareLink="shareLink"
				@chooseNewScript="handleChooseNewScript"
			/>
			<Toolbar
				:record="viewData.record"
				:infoPopup="viewData.infoPopup"
				:anchors="viewData.anchors"
				:activeAnchorBlockId="activeAnchorBlockId"
				@anchorActivated="handleAnchorActivated"
			/>
			<div ref="content" class="crm-ai-report-drawer__content" @scroll.passive="handleContentScroll">
				<Assessment v-for="assessmentBlock in viewData.assessmentBlocks"
					:key="assessmentBlock.blockId"
					:id="assessmentBlock.blockId"
					:ref="(element) => setAnchoredBlockElement(assessmentBlock.blockId, element)"
					:assessmentBlockData="assessmentBlock"
					:assessmentSetting="viewData.assessmentSetting"
					@showReassessmentPopup="handleShowReassessmentPopup"
				/>
				<TextBlock v-for="block in viewData.blocks"
					:key="block.blockId"
					:id="block.blockId"
					:ref="(element) => setAnchoredBlockElement(block.blockId, element)"
					:blockData="block"
				/>
				<TrailingSpacerBlock />
			</div>
			<div class="crm-ai-report-drawer__ai-alert ui-typography-text-xs" v-html="viewData.aiDisclaimer" />
		</div>
	`
	});

	const CALL_SCORING_ADD_COMMAND = 'call_scoring_add';
	class Pull {
		unsubscribeFromCallScoring = null;
		constructor(callScoringCallback) {
			const pullClient = BX.PULL;
			if (!pullClient) {
				console.error('pull is not initialized');
				return;
			}
			this.unsubscribeFromCallScoring = pullClient.subscribe({
				moduleId: 'crm',
				command: CALL_SCORING_ADD_COMMAND,
				callback: params => {
					if (main_core.Type.isStringFilled(params.eventId) && pull_queuemanager.QueueManager.eventIds.has(params.eventId)) {
						return;
					}
					callScoringCallback(params);
				}
			});
			pullClient.extendWatch(CALL_SCORING_ADD_COMMAND);
		}
		unsubscribe() {
			this.unsubscribeFromCallScoring?.();
			this.unsubscribeFromCallScoring = null;
		}
	}

	const SCENARIO = {
		CALL_ASSESSMENT: {
			ajaxAction: 'crm.timeline.aireportdrawer.loadCallAssessmentDrawer',
			code: 'call-assessment'
		},
		SUMMARY_HISTORY: {
			ajaxAction: 'crm.timeline.aireportdrawer.loadSummaryHistoryDrawer',
			code: 'summary-history'
		}
	};
	class ReportDrawer {
		params;
		app = null;
		viewData = null;
		container = null;
		pull = null;
		scriptSelectorDialog = null;
		confirmationPopup = null;
		isDestroyed = false;
		isReloading = false;
		isAssessmentInProgress = false;
		pendingAssessmentSettingsId = null;
		sliderId;
		constructor(params) {
			this.params = params;
			this.sliderId = `crm-ai-report-drawer-slider-${main_core.Text.getRandom()}`;
		}
		async open() {
			const newWindowUrl = this.getSliderLink();
			main_sidepanel.SidePanel.Instance.open(this.sliderId, {
				width: 800,
				contentCallback: () => Promise.resolve(this.createApp()),
				containerClassName: 'crm-ai-report-drawer-slider',
				cacheable: false,
				allowChangeHistory: false,
				copyLinkLabel: main_core.Type.isStringFilled(newWindowUrl),
				newWindowLabel: false,
				newWindowUrl: newWindowUrl ?? undefined,
				events: {
					onOpenComplete: () => {
						void this.reloadData();
					},
					onCloseComplete: () => {
						this.destroy();
					},
					onDestroyComplete: () => {
						this.destroy();
					}
				}
			});
		}
		async renderTo(container) {
			if (!main_core.Type.isDomNode(container)) {
				return;
			}
			main_core.Dom.addClass(container, 'crm-ai-report-drawer__slider-wrapper');
			this.container = container;
			this.syncContentVisibility();
			if (!main_core.Type.isNull(this.viewData)) {
				this.mountApp(this.viewData);
			}
			await this.reloadData();
		}
		destroy() {
			if (this.isDestroyed) {
				return;
			}
			this.isDestroyed = true;
			this.destroyScriptSelectorDialog();
			this.destroyConfirmationPopup();
			this.pull?.unsubscribe();
			this.pull = null;
			this.app?.unmount();
			this.app = null;
			this.viewData = null;
			this.container = null;
		}
		createApp() {
			const container = main_core.Tag.render`<div id="crm-ai-report-drawer" class="crm-ai-report-drawer__slider-wrapper"></div>`;
			this.container = container;
			this.syncContentVisibility();
			if (main_core.Type.isNull(this.viewData)) {
				return container;
			}
			this.mountApp(this.viewData);
			return container;
		}
		getSliderLink() {
			const scenario = this.getScenario();
			if (!main_core.Type.isStringFilled(scenario)) {
				return null;
			}
			const uri = crm_router.Router.Instance.getAiReportDrawerUrl(scenario, this.params.drawerRequest);
			if (!uri) {
				return null;
			}
			return new URL(uri.toString(), window.location.origin).toString();
		}
		getScenario() {
			switch (this.params.ajaxAction) {
				case SCENARIO.CALL_ASSESSMENT.ajaxAction:
					return SCENARIO.CALL_ASSESSMENT.code;
				case SCENARIO.SUMMARY_HISTORY.ajaxAction:
					return SCENARIO.SUMMARY_HISTORY.code;
				default:
					return null;
			}
		}
		mountApp(data) {
			if (main_core.Type.isNull(this.container)) {
				return;
			}
			this.app?.unmount();
			this.app = ui_vue3.BitrixVue.createApp(App, {
				viewData: data,
				shareLink: this.getSliderLink(),
				onShowReassessmentPopup: this.onShowReassessmentPopup.bind(this),
				onChooseNewScript: this.onChooseNewScript.bind(this)
			});
			this.app.mixin(ui_vue3_mixins_locMixin.locMixin);
			this.app.mount(this.container);
		}
		onShowReassessmentPopup(assessmentSetting) {
			if (this.isDestroyed || this.isAssessmentInProgress || this.isReloading || !main_core.Type.isInteger(assessmentSetting?.id)) {
				return;
			}
			this.destroyConfirmationPopup();
			this.destroyScriptSelectorDialog();
			this.showConfirmationPopup(assessmentSetting);
		}
		onChooseNewScript(bindElement) {
			if (this.isDestroyed || this.isAssessmentInProgress || this.isReloading || !main_core.Type.isDomNode(bindElement)) {
				return;
			}
			this.destroyConfirmationPopup();
			this.destroyScriptSelectorDialog();
			const preselectedItems = [];
			const currentAssessmentSettingsId = this.getCurrentAssessmentSettingsId();
			const scriptSelectorEntityId = 'copilot_call_script';
			if (main_core.Type.isInteger(currentAssessmentSettingsId)) {
				preselectedItems.push([scriptSelectorEntityId, currentAssessmentSettingsId]);
			}
			this.scriptSelectorDialog = new ui_entitySelector.Dialog({
				targetNode: bindElement,
				context: 'CRM_AI_REPORT_DRAWER_CALL_SCRIPT_SELECTOR',
				multiple: false,
				dropdownMode: true,
				enableSearch: true,
				showAvatars: true,
				preselectedItems,
				entities: [{
					id: scriptSelectorEntityId,
					dynamicLoad: true,
					dynamicSearch: true
				}],
				events: {
					'Item:onSelect': event => {
						void this.onScriptSelected(event);
					},
					'Item:onDeselect': event => {
						void this.onScriptSelected(event);
					},
					onHide: () => {
						this.destroyScriptSelectorDialog();
					}
				}
			});
			this.scriptSelectorDialog.show();
		}
		async onScriptSelected(event) {
			const {
				item
			} = event.getData();
			if (!main_core.Type.isFunction(item?.getId) || !main_core.Type.isFunction(item?.getTitle)) {
				return;
			}
			this.scriptSelectorDialog?.hide();
			const assessmentSettingsId = item.getId();
			if (!main_core.Type.isInteger(assessmentSettingsId)) {
				return;
			}
			const assessmentSetting = this.prepareAssessmentSettingFromItem(item);
			if (assessmentSetting === null || this.isDestroyed) {
				return;
			}
			this.showConfirmationPopup(assessmentSetting);
		}
		prepareAssessmentSettingFromItem(item) {
			const assessmentSettingsId = item.getId();
			if (!main_core.Type.isInteger(assessmentSettingsId)) {
				return null;
			}
			const customData = main_core.Type.isFunction(item.getCustomData) ? Object.fromEntries(item.getCustomData()) : {};
			const currentAssessmentSetting = this.viewData?.assessmentSetting ?? null;
			if (main_core.Type.isNull(currentAssessmentSetting)) {
				return null;
			}
			return {
				id: assessmentSettingsId,
				title: main_core.Type.isStringFilled(item.getTitle()) ? item.getTitle() : currentAssessmentSetting.title,
				promptUpdatedAt: main_core.Type.isStringFilled(customData.promptUpdatedAt) ? customData.promptUpdatedAt : currentAssessmentSetting.id === assessmentSettingsId ? currentAssessmentSetting.promptUpdatedAt : '',
				shouldShowReassessmentBadge: currentAssessmentSetting.id === assessmentSettingsId ? currentAssessmentSetting.shouldShowReassessmentBadge : false
			};
		}
		showConfirmationPopup(assessmentSetting) {
			this.destroyConfirmationPopup();
			const buttons = [new ui_buttons.Button({
				text: main_core.Loc.getMessage('CRM_AI_REPORT_DRAWER_CONFIRM_SCRIPT_BUTTON_CONFIRM') ?? '',
				size: ui_buttons.ButtonSize.MEDIUM,
				useAirDesign: true,
				style: ui_buttons.AirButtonStyle.FILLED,
				onclick: () => {
					popup.close();
					void this.doAssessment(assessmentSetting.id);
					return {};
				}
			}), new ui_buttons.Button({
				text: main_core.Loc.getMessage('CRM_AI_REPORT_DRAWER_CONFIRM_SCRIPT_BUTTON_CANCEL') ?? '',
				size: ui_buttons.ButtonSize.MEDIUM,
				useAirDesign: true,
				style: ui_buttons.AirButtonStyle.OUTLINE_NO_ACCENT,
				onclick: () => {
					popup.close();
					return {};
				}
			})];
			const popup = new main_popup.Popup({
				id: `crm-ai-report-drawer-confirm-script-popup-${main_core.Text.getRandom()}`,
				targetContainer: document.body,
				cacheable: false,
				autoHide: false,
				closeByEsc: true,
				closeIcon: true,
				fixed: true,
				width: 400,
				overlay: true,
				className: 'crm-ai-report-drawer__confirm-popup-wrapper',
				contentBackground: 'none',
				titleBar: main_core.Loc.getMessage('CRM_AI_REPORT_DRAWER_CONFIRM_SCRIPT_TITLE', {
					'#SCRIPT_NAME#': assessmentSetting.title
				}) ?? '',
				content: this.renderConfirmationPopupContent(assessmentSetting),
				events: {
					onClose: () => {
						if (this.confirmationPopup === popup) {
							this.confirmationPopup = null;
						}
					},
					onDestroy: () => {
						if (this.confirmationPopup === popup) {
							this.confirmationPopup = null;
						}
					}
				}
			});
			popup.setButtons(buttons);
			this.confirmationPopup = popup;
			popup.show();
		}
		renderConfirmationPopupContent(assessmentSetting) {
			const lastUpdatedMsg = main_core.Loc.getMessage('CRM_AI_REPORT_DRAWER_CONFIRM_SCRIPT_LAST_UPDATED', {
				'#LAST_UPDATED#': this.formatScriptUpdatedAt(assessmentSetting.promptUpdatedAt)
			});
			return main_core.Tag.render`
			<div class="crm-ai-report-drawer__confirm-popup">
				<div class="crm-ai-report-drawer__confirm-popup-description ui-typography-text-md">
					${lastUpdatedMsg}
				</div>
			</div>
		`;
		}
		formatScriptUpdatedAt(promptUpdatedAt) {
			if (!main_core.Type.isStringFilled(promptUpdatedAt)) {
				return main_core.Loc.getMessage('CRM_AI_REPORT_DRAWER_CONFIRM_SCRIPT_UPDATED_AT_EMPTY') ?? '';
			}
			const date = new Date(promptUpdatedAt);
			if (Number.isNaN(date.getTime())) {
				return main_core.Loc.getMessage('CRM_AI_REPORT_DRAWER_CONFIRM_SCRIPT_UPDATED_AT_EMPTY') ?? '';
			}
			return main_date.DateTimeFormat.format(crm_timeline_tools.DatetimeConverter.getSiteDateTimeFormat(), date);
		}
		async doAssessment(assessmentSettingsId) {
			if (this.isDestroyed || this.isAssessmentInProgress) {
				return;
			}
			const {
				activityId,
				ownerTypeId,
				ownerId
			} = this.params.drawerRequest;
			this.isAssessmentInProgress = true;
			this.pendingAssessmentSettingsId = assessmentSettingsId;
			this.params.drawerRequest.jobId = null;
			this.syncContentVisibility();
			const drawer = main_sidepanel.SidePanel.Instance.getSlider(this.sliderId);
			drawer?.showLoader();
			try {
				const response = await main_core.ajax.runAction('crm.copilot.callqualityassessment.doAssessment', {
					data: {
						activityId,
						ownerTypeId,
						ownerId,
						assessmentSettingsId
					}
				});
				if (response?.status !== 'success') {
					this.finishAssessmentWithError(response, 'ReportDrawer doAssessment failed');
					return;
				}
				this.params.drawerRequest.jobId = main_core.Type.isInteger(response?.data?.jobId) ? response.data.jobId : null;
			} catch (error) {
				this.finishAssessmentWithError(error, 'ReportDrawer doAssessment error');
			}
		}
		onCallScoringPull(params) {
			if (this.isDestroyed || this.params.drawerRequest.activityId !== params.activityId) {
				return;
			}
			if (params.status === 'error') {
				this.finishAssessmentWithError(null, 'ReportDrawer pull returned error');
				return;
			}
			const expectedAssessmentSettingsId = this.pendingAssessmentSettingsId ?? this.params.drawerRequest.assessmentSettingsId;
			if (main_core.Type.isInteger(expectedAssessmentSettingsId) && main_core.Type.isInteger(params.assessmentSettingsId) && expectedAssessmentSettingsId !== params.assessmentSettingsId) {
				return;
			}
			this.params.drawerRequest.jobId = main_core.Type.isInteger(params.jobId) ? params.jobId : null;
			if (main_core.Type.isInteger(params.assessmentSettingsId)) {
				this.params.drawerRequest.assessmentSettingsId = params.assessmentSettingsId;
			}
			this.pendingAssessmentSettingsId = null;
			void this.reloadData();
		}
		async reloadData() {
			if (this.isDestroyed || this.isReloading || main_core.Type.isNull(this.container)) {
				return;
			}
			const drawer = main_sidepanel.SidePanel.Instance.getSlider(this.sliderId);
			drawer?.showLoader();
			this.isReloading = true;
			try {
				const response = await this.loadData(this.params.drawerRequest);
				const errors = main_core.Type.isArray(response.errors) ? response.errors : [];
				if (errors.length !== 0) {
					if (this.mountNotFoundPlaceholder(response)) {
						return;
					}
					this.showRequestError(response, 'Errors while reloading data for ReportDrawer');
					this.closeSliderOnInitialLoadError();
					return;
				}
				this.viewData = this.parseData(response);
				this.initializePull();
				this.mountApp(this.viewData);
			} catch (error) {
				if (this.mountNotFoundPlaceholder(error)) {
					return;
				}
				this.showRequestError(error, 'ReportDrawer reload error');
				this.closeSliderOnInitialLoadError();
			} finally {
				this.isReloading = false;
				if (this.isAssessmentInProgress) {
					this.isAssessmentInProgress = false;
					this.syncContentVisibility();
				}
				drawer?.closeLoader();
			}
		}
		initializePull() {
			if (this.pull === null && this.params.ajaxAction === 'crm.timeline.aireportdrawer.loadCallAssessmentDrawer') {
				this.pull = new Pull(this.onCallScoringPull.bind(this));
			}
		}
		closeSliderOnInitialLoadError() {
			if (this.viewData === null) {
				main_sidepanel.SidePanel.Instance.getSlider(this.sliderId)?.close();
			}
		}
		mountNotFoundPlaceholder(response) {
			const error = this.getResponseErrors(response).find(item => item.code === 'NOT_FOUND');
			if (!error || main_core.Type.isNull(this.container)) {
				return false;
			}
			this.app?.unmount();
			this.app = ui_vue3.BitrixVue.createApp({
				components: {
					TextSm: ui_system_typography_vue.TextSm
				},
				props: {
					message: {
						type: String,
						required: true
					}
				},
				template: '<TextSm tag="div" className="crm-ai-report-drawer__not-found">{{ message }}</TextSm>'
			}, {
				message: error.message
			});
			this.app.mount(this.container);
			return true;
		}
		getResponseErrors(response) {
			if (!main_core.Type.isObjectLike(response)) {
				return [];
			}
			const errors = response.errors;
			if (!main_core.Type.isArray(errors)) {
				return [];
			}
			return errors.filter(error => main_core.Type.isObjectLike(error) && main_core.Type.isString(error.message) && (main_core.Type.isUndefined(error.code) || main_core.Type.isString(error.code)));
		}
		getCurrentAssessmentSettingsId() {
			const currentId = this.viewData?.assessmentSetting?.id ?? this.params.drawerRequest.assessmentSettingsId;
			if (main_core.Type.isInteger(currentId)) {
				return currentId;
			}
			return null;
		}
		finishAssessmentWithError(error, logMessage) {
			this.pendingAssessmentSettingsId = null;
			this.isAssessmentInProgress = false;
			this.syncContentVisibility();
			main_sidepanel.SidePanel.Instance.getSlider(this.sliderId)?.closeLoader();
			this.showRequestError(error, logMessage);
		}
		syncContentVisibility() {
			if (main_core.Type.isNull(this.container)) {
				return;
			}
			if (this.isAssessmentInProgress) {
				main_core.Dom.addClass(this.container, '--content-hidden');
				return;
			}
			main_core.Dom.removeClass(this.container, '--content-hidden');
		}
		showRequestError(error, logMessage) {
			if (error !== null) {
				console.error(logMessage, error);
			} else {
				console.error(logMessage);
			}
			const message = error?.errors?.[0]?.message ?? null;
			if (main_core.Type.isStringFilled(message)) {
				const topWindow = window.top ?? window;
				topWindow.BX?.UI?.Notification?.Center?.notify?.({
					content: message,
					autoHideDelay: 5000
				});
			}
		}
		destroyScriptSelectorDialog() {
			const dialog = this.scriptSelectorDialog;
			this.scriptSelectorDialog = null;
			dialog?.hide();
		}
		destroyConfirmationPopup() {
			const popup = this.confirmationPopup;
			this.confirmationPopup = null;
			popup?.destroy();
		}
		loadData(params) {
			const data = {
				data: params
			};
			return main_core.ajax.runAction(this.params.ajaxAction, data);
		}
		parseData(response) {
			const data = response.data;
			return {
				title: data.title ?? '',
				subtitle: data.subtitle ?? null,
				settings: data.settings ?? [],
				record: data.record ?? null,
				infoPopup: data.infoPopup ?? null,
				anchors: data.anchors ?? [],
				assessmentBlocks: data.assessmentBlocks ?? [],
				blocks: data.blocks ?? [],
				aiDisclaimer: data.aiDisclaimer ?? '',
				assessmentSetting: data.assessmentSetting ?? null
			};
		}
	}

	exports.ReportDrawer = ReportDrawer;

})(this.BX.Crm.AI = this.BX.Crm.AI || {}, BX, BX.Main, BX.Main, BX.SidePanel, BX.Crm, BX.Crm.Timeline, BX.UI, BX.UI.EntitySelector, BX.UI.System.Typography.Vue, BX, BX.Vue3, BX.Vue3.Mixins, BX.Crm, BX.UI, BX.Vue3.Components, BX.UI.IconSet, BX.Crm, BX.Vue3.Directives, BX.Pull);
//# sourceMappingURL=report-drawer.bundle.js.map
