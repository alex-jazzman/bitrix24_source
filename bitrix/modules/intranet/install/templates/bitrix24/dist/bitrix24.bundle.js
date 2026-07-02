/* eslint-disable */
this.BX = this.BX || {};
this.BX.Intranet = this.BX.Intranet || {};
(function (exports, main_core, main_popup, ui_buttons, main_core_events, main_core_cache, pull_client, ui_cnt, ui_iconSet_api_core, main_loader, main_sidepanel, intranet_skipToContent, intranet_widgetLoader, intranet_avatarWidget, timeman_workTimeStateIcon, ui_infoHelper, bitrix24_licenseWidget, intranet_licenseWidget, intranet_invitationWidget) {
	'use strict';

	async function showPartnerConnectForm(params) {
		main_core.Loc.setMessage(params.messages);
		await showPartnerFormPopup({
			...params,
			titleBar: main_core.Loc.getMessage('INTRANET_PARTNER_POPUP_TITLE'),
			sendButtonText: main_core.Loc.getMessage('INTRANET_PARTNER_POPUP_SEND_BUTTON')
		});
	}
	async function showPartnerFormPopup(options) {
		const partnerLogo = options.partnerLogo === '' || main_core.Type.isNil(options.partnerLogo) ? '/bitrix/modules/intranet/install/templates/bitrix24/dist/dist/images/b24-partner__icon.svg' : options.partnerLogo;
		const clipboardButton = initCopyBtn();
		const email = initEmail(clipboardButton, options);
		const phone = initPhone(clipboardButton, options);
		const partnerAbout = initAboutPartner(options.partnerCardUrl);
		const popupOptions = {
			className: 'bitrix24-partner__popup',
			autoHide: true,
			cacheable: false,
			zIndex: 0,
			offsetLeft: 0,
			offsetTop: 0,
			width: 316,
			overlay: true,
			draggable: {
				restrict: true
			},
			closeByEsc: true,
			titleBar: main_core.Loc.getMessage('INTRANET_PARTNER_TITLE_FOR_NAME_MSGVER_2'),
			closeIcon: true,
			content: `
			<div class="bitrix24-partner__popup-content" id="b24-partner-popup-main">
				<div class="bitrix24-partner__popup-content_main">
					<div class="">
						<div class="bitrix24-partner__popup-content_partner-preview">
							<img class="bitrix24-partner__popup-content-logo" src="${main_core.Tag.safe`${encodeURI(partnerLogo)}`}" alt="">
							<div class="bitrix24-partner__popup-content_name-wrapper">
								<div class="bitrix24-partner__popup-content_name">${main_core.Tag.safe`${options.partnerName}`}</div>
								<div class="bitrix24-partner__popup-content_description">${main_core.Tag.safe`${options.partnerCompany}`}</div>
							</div>
						</div>
		
						<div>
							${email}
							${phone} 
							${partnerAbout}
						</div>
					</div>
				</div>
				<div class="bitrix24-partner__popup-content_desc">${main_core.Loc.getMessage('INTRANET_PARTNER_POPUP_DESCRIPTION_BOTTOM_MSGVER_1')}</div>
			</div>
		`,
			buttons: [new ui_buttons.Button({
				style: ui_buttons.AirButtonStyle.FILLED,
				text: options.sendButtonText,
				useAirDesign: true,
				onclick: () => {
					showIntegratorApplicationForm();
				}
			}).setWide(true)]
		};
		const popup = new main_popup.Popup(popupOptions);
		popup.show();
		initCopyHandler();
	}
	function initCopyBtn() {
		if (isNavigatorClipboardSupported()) {
			return dataCopy => {
				return `
				<div class="copy-icon" type="button" data-copy="${main_core.Tag.safe`${dataCopy}`}">
					<div class="ui-icon-set --o-copy"></div>
				</div>
			`;
			};
		}
		return '';
	}
	function initEmail(clipboardButton, options) {
		if (!main_core.Type.isNil(options.partnerEmail) && options.partnerEmail !== '') {
			return `
			<div class="bitrix24-partner__popup-content_info-block">
				<div class="bitrix24-partner__popup-content_info-block-icon-wrapper">
					<div class="ui-icon-set --mail"></div>
				</div>
				<a
					class="bitrix24-partner__popup-content_info-block-info-value"
					href="mailto:${main_core.Tag.safe`${options.partnerEmail}`}"
				>
					${main_core.Tag.safe`${options.partnerEmail}`}
				</a>
				${main_core.Type.isFunction(clipboardButton) ? clipboardButton(options.partnerEmail) : ''}
			</div>
		`;
		}
		return '';
	}
	function initPhone(clipboardButton, options) {
		if (!main_core.Type.isNil(options.partnerPhone) && options.partnerPhone !== '') {
			return `
			<div class="bitrix24-partner__popup-content_info-block">
				<div class="bitrix24-partner__popup-content_info-block-icon-wrapper">
					<div class="ui-icon-set --telephony-handset-5"></div>
				</div>
				<a
					class="bitrix24-partner__popup-content_info-block-info-value"
					href="tel:${main_core.Tag.safe`${options.partnerPhone}`}"
				>
					${main_core.Tag.safe`${options.partnerPhone}`}
				</a>
				${main_core.Type.isFunction(clipboardButton) ? clipboardButton(options.partnerPhone) : ''}
			</div>
		`;
		}
		return '';
	}
	function initAboutPartner(partnerCardUrl) {
		return `
		<div class="bitrix24-partner__popup-content_info-block">
			<div class="bitrix24-partner__popup-content_info-block-icon-wrapper">
				<div class="ui-icon-set --earth-language"></div>
			</div>
			<a 
				class="bitrix24-partner__popup-content_info-block-info-value" 
				href="${encodeURI(partnerCardUrl)}" target="_blank"
			>
				${main_core.Loc.getMessage('INTRANET_PARTNER_LINK_NAME_MORE')}
			</a>
		</div>
	`;
	}
	function initCopyHandler() {
		setTimeout(() => {
			if (isNavigatorClipboardSupported()) {
				const popupContent = document.getElementById('b24-partner-popup-main');
				if (popupContent) {
					main_core.Event.bind(popupContent, 'click', async e => {
						const btn = e.target.closest('.copy-icon');
						if (btn && btn.dataset.copy) {
							try {
								await navigator.clipboard.writeText(btn.dataset.copy);
								main_core.Dom.addClass(btn, 'copied');
								BX.UI.Notification.Center.notify({
									content: main_core.Loc.getMessage('INTRANET_PARTNER_POPUP_COPIED'),
									autoHideDelay: 2500,
									useAirDesign: true
								});
								setTimeout(() => {
									main_core.Dom.removeClass(btn, 'copied');
								}, 1000);
							} catch (err) {
								top.console.error(err);
							}
						}
					});
				}
			}
		}, 200);
	}
	function isNavigatorClipboardSupported() {
		return window.isSecureContext && navigator.clipboard;
	}
	async function showIntegratorApplicationForm() {
		const {
			PartnerForm
		} = await main_core.Runtime.loadExtension('ui.feedback.partnerform');
		const formParams = {
			id: `intranet-license-partner-form-${parseInt(Math.random() * 1000, 10)}`,
			source: 'intranet.bitrix24.partner-connect-form'
		};
		PartnerForm.show(formParams);
	}

	async function showPartnerOrderForm(params) {
		if (main_core.Type.isObject(params) === false) {
			return;
		}
		const resultParams = {
			...params,
			id: `intranet-license-partner-form-${main_core.Text.getRandom()}`
		};
		const {
			PartnerForm
		} = await main_core.Runtime.loadExtension('ui.feedback.partnerform');
		PartnerForm.show(resultParams);
	}

	const showHelper = async () => {
		await main_core.Runtime.loadExtension('helper');
		const Helper = main_core.Reflection.getClass('BX.Helper');
		Helper.show('redirect=detail&code=20267044');
	};

	class PartnerForm {
		static async showConnectForm(params) {
			return showPartnerConnectForm(params);
		}
		static showIntegrationOrderForm(params) {
			return showPartnerOrderForm(params);
		}
		static async showHelper() {
			return showHelper();
		}
	}

	class ChatMenu {
		constructor() {
			main_core_events.EventEmitter.subscribe('IM.Layout:onLayoutChange', this.#handleImLayoutChange.bind(this));
			main_core_events.EventEmitter.subscribe('IM.Counters:onUpdate', this.#handleCounterUpdate.bind(this));
			main_core_events.EventEmitter.subscribe('BX.Intranet.Bitrix24.ChatMenu:onSelect', this.#handleChatMenuSelect.bind(this));
		}
		getChatMenu() {
			/**
			 *
			 * @type {BX.Main.interfaceButtonsManager}
			 */
			const menuManager = main_core.Reflection.getClass('BX.Main.interfaceButtonsManager');
			if (menuManager) {
				return menuManager.getById('chat-menu') || null;
			}
			return null;
		}
		getCollaborationMenu() {
			/**
			 *
			 * @type {BX.Main.interfaceButtonsManager}
			 */
			const menuManager = main_core.Reflection.getClass('BX.Main.interfaceButtonsManager');
			if (menuManager) {
				return menuManager.getById('top_menu_id_collaboration') || null;
			}
			return null;
		}
		#handleChatMenuSelect(event) {
			const data = event.getData();
			const {
				id,
				entityId
			} = data;
			let target = data.event?.target;
			if (target) {
				target = target.closest('.main-buttons-item-link, .menu-popup-item');
			}
			const Public = main_core.Reflection.getClass('BX.Messenger.Public');
			Public?.openNavigationItem({
				id,
				entityId,
				target
			});
		}
		#handleImLayoutChange(event) {
			const data = event.getData();
			let fromItemId = data.from.name.toLowerCase();
			if (fromItemId === 'market' && data.from.entityId) {
				fromItemId = `${fromItemId}_${data.from.entityId}`;
			}
			let toItemId = data.to.name.toLowerCase();
			if (toItemId === 'market' && data.to.entityId) {
				toItemId = `${toItemId}_${data.to.entityId}`;
			}
			const chatMenu = this.getChatMenu();
			if (chatMenu !== null) {
				chatMenu.unsetActive(fromItemId);
				chatMenu.setActive(toItemId);
				chatMenu.reset();
			}
			const collaborationMenu = this.getCollaborationMenu();
			const siteDir = main_core.Loc.getMessage('SITE_DIR') || '/';
			const isMessengerEmbedded = window.location.pathname.toString().startsWith(`${siteDir}online/`);
			if (collaborationMenu !== null) {
				if (isMessengerEmbedded) {
					collaborationMenu.unsetActive(fromItemId);
					collaborationMenu.setActive(toItemId);
				}
				collaborationMenu.reset();
			}
		}
		#handleCounterUpdate(event) {
			const counters = event.getData();
			const menus = [this.getChatMenu(), this.getCollaborationMenu()];
			for (const menu of menus) {
				if (menu === null) {
					continue;
				}
				for (const [counterId, counterValue] of Object.entries(counters)) {
					menu.updateCounter(counterId, counterValue);
				}
			}
		}
	}

	function getBackUrl() {
		const backUrl = window.location.pathname;
		const query = getQueryString(['logout', 'login', 'back_url_pub', 'user_lang']);
		return backUrl + (query.length > 0 ? `?${query}` : '');
	}
	function getQueryString(ignoredParams) {
		const query = window.location.search.slice(1);
		if (!main_core.Type.isStringFilled(query)) {
			return '';
		}
		const vars = query.split('&');
		const checkedIgnoredParams = main_core.Type.isArray(ignoredParams) ? ignoredParams : [];
		let result = '';
		for (const variable of vars) {
			const pair = variable.split('=');
			const equal = variable.indexOf('=');
			const key = pair[0];
			const value = main_core.Type.isStringFilled(pair[1]) ? pair[1] : false;
			if (!checkedIgnoredParams.includes(key)) {
				if (result !== '') {
					result += '&';
				}
				result += key + (equal === -1 ? '' : '=') + (value === false ? '' : value);
			}
		}
		return result;
	}

	const createToolbarSkeleton = (options = {}) => {
		const {
			showIconButton = false
		} = options;
		return main_core.Tag.render`
		<div class="toolbar-skeleton">
			<span class="toolbar-skeleton__page-title"></span>
			${showIconButton ? createIconButton() : null}
		</div>
	`;
	};
	function createIconButton() {
		return main_core.Tag.render`
		<span class="toolbar-skeleton__icon-buttons">
			<span class="toolbar-skeleton__icon-button">
				<span class="toolbar-skeleton__icon-button-text"></span>
			</span>
		</span>
	`;
	}

	const createActionsBarSkeleton = (options = {}) => {
		const {
			showNavigationPanel = true,
			showCounterPanel = false,
			rightButtonsCount = 0
		} = options;
		return main_core.Tag.render`
		<div class="actions-bar-skeleton">
			${showNavigationPanel ? createNavigationPanelSkeleton() : null}
			${showCounterPanel ? createCounterPanelSkeleton() : null}
			${rightButtonsCount > 0 ? createRightButtons(rightButtonsCount) : null}
		</div>
	`;
	};
	function createNavigationPanelSkeleton() {
		return main_core.Tag.render`
		<div class="navigation-skeleton">
				<div class="navigation-skeleton__item">
					<div class="navigation-skeleton__item-text"></div>
				</div>
			</div>
	`;
	}
	function createCounterPanelSkeleton() {
		return main_core.Tag.render`
		<div class="counters-skeleton">
			<div class="counters-skeleton__item">
				<div class="counters-skeleton__item-text"></div>
			</div>
		</div>
	`;
	}
	function createRightButtons(count) {
		const wrapper = main_core.Tag.render`<div class="actions-bar-skeleton__right-buttons"></div>`;
		for (let i = 0; i < count; i++) {
			const button = main_core.Tag.render`
			<div class="actions-bar-skeleton__right-button">
				<div class="actions-bar-skeleton__right-button-text"></div>
			</div>
		`;
			main_core.Dom.append(button, wrapper);
		}
		return wrapper;
	}

	const createGridSkeleton = () => {
		return main_core.Tag.render`
		<div class="grid-skeleton-container --ui-context-content-light">
			<table class="grid-skeleton">
				<thead>
					<tr class="grid-skeleton__header-row">
						<th class="grid-skeleton__header-cell">
							<div class="grid-skeleton__checkbox"></div>
						</th>
						<th class="grid-skeleton__header-cell">
							<div class="grid-skeleton__avatar"></div>
						</th>
						<th class="grid-skeleton__header-cell">
							<div class="grid-skeleton__cell-title --short"></div>
						</th>
						<th class="grid-skeleton__header-cell">
							<div class="grid-skeleton__cell-title"></div>
						</th>
						<th class="grid-skeleton__header-cell">
							<div class="grid-skeleton__cell-title"></div>
						</th>
						<th class="grid-skeleton__header-cell">
							<div class="grid-skeleton__cell-title"></div>
						</th>
						<th class="grid-skeleton__header-cell">
							<div class="grid-skeleton__cell-title"></div>
						</th>
					</tr>
				</thead>
				${getGridSkeletonRows()}
			</table>
		</div>
	`;
	};
	function getGridSkeletonRows() {
		return main_core.Tag.render`
		<tbody>
			${createGridSkeletonRow()}
			${createGridSkeletonRow()}
			${createGridSkeletonRow()}
			${createGridSkeletonRow()}
			${createGridSkeletonRow()}
			${createGridSkeletonRow()}
			${createGridSkeletonRow()}
		</tbody>
	`;
	}
	function createGridSkeletonRow() {
		return main_core.Tag.render`
		<tr class="grid-skeleton__row">
			<td class="grid-skeleton__cell">
				<div class="grid-skeleton__checkbox"></div>
			</td>
			<td class="grid-skeleton__cell">
				<div class="grid-skeleton__avatar"></div>
			</td>
			<td class="grid-skeleton__cell">
				<div class="grid-skeleton__cell-two-text">
					<div class="grid-skeleton__cell-title --long"></div>
					<div class="grid-skeleton__cell-title --short"></div>
				</div>
			</td>
			<td class="grid-skeleton__cell">
				<div class="grid-skeleton__cell-button"></div>
			</td>
			<td class="grid-skeleton__cell">
				<div class="grid-skeleton__avatar-title">
					<div class="grid-skeleton__avatar"></div>
					<div class="grid-skeleton__cell-title"></div>
				</div>
			</td>
			<td class="grid-skeleton__cell">
				<div class="grid-skeleton__avatar-title">
					<div class="grid-skeleton__avatar"></div>
					<div class="grid-skeleton__cell-title"></div>
				</div>
			</td>
			<td class="grid-skeleton__cell">
				<div class="grid-skeleton__avatar-title">
					<div class="grid-skeleton__avatar"></div>
					<div class="grid-skeleton__cell-title"></div>
				</div>
			</td>
		</tr>
	`;
	}

	const createKanbanSkeleton = () => {
		return main_core.Tag.render`
		<div class="kanban-skeleton --stage-right">
			<div class="kanban-skeleton__col">
				<div class="kanban-skeleton__col-stage"></div>
				<div class="kanban-skeleton__col-tiles">
					<div class="kanban-skeleton__col-tile --lg"></div>
					<div class="kanban-skeleton__col-tile"></div>
				</div>
			</div>
			<div class="kanban-skeleton__col">
				<div class="kanban-skeleton__col-stage"></div>
				<div class="kanban-skeleton__col-tiles">
					<div class="kanban-skeleton__col-tile"></div>
					<div class="kanban-skeleton__col-tile --lg"></div>
				</div>
			</div>
			<div class="kanban-skeleton__col">
				<div class="kanban-skeleton__col-stage"></div>
				<div class="kanban-skeleton__col-tiles">
					<div class="kanban-skeleton__col-tile --lg"></div>
					<div class="kanban-skeleton__col-tile --lg"></div>
				</div>
			</div>
			<div class="kanban-skeleton__col">
				<div class="kanban-skeleton__col-stage"></div>
				<div class="kanban-skeleton__col-tiles">
					<div class="kanban-skeleton__col-tile --lg"></div>
					<div class="kanban-skeleton__col-tile"></div>
				</div>
			</div>
			<div class="kanban-skeleton__col">
				<div class="kanban-skeleton__col-stage"></div>
				<div class="kanban-skeleton__col-tiles">
					<div class="kanban-skeleton__col-tile --lg"></div>
					<div class="kanban-skeleton__col-tile --lg"></div>
				</div>
			</div>
			<div class="kanban-skeleton__col">
				<div class="kanban-skeleton__col-stage"></div>
				<div class="kanban-skeleton__col-tiles">
					<div class="kanban-skeleton__col-tile"></div>
					<div class="kanban-skeleton__col-tile --lg"></div>
				</div>
			</div>
		</div>
	`;
	};

	const createRightSidebarSkeleton = () => {
		return main_core.Tag.render`
		<div class="right-sidebar-skeleton">
			<div class="right-sidebar-skeleton__header"></div>
			<div class="right-sidebar-skeleton__chat"></div>
		</div>
	`;
	};

	class Composite {
		#refs = new main_core_cache.MemoryCache();
		constructor() {
			if (Composite.isEnabled()) {
				this.#bindEvents();
			}
		}
		static isEnabled() {
			return !main_core.Type.isUndefined(window.frameRequestStart);
		}
		static isReady() {
			return window.BX?.frameCache?.frameDataInserted === true || !main_core.Type.isUndefined(window.frameRequestFail);
		}
		static ready(callback) {
			if (!main_core.Type.isFunction(callback)) {
				return;
			}
			if (this.isEnabled()) {
				if (this.isReady()) {
					callback();
				} else {
					main_core_events.EventEmitter.subscribe('onFrameDataProcessed', callback);
					main_core_events.EventEmitter.subscribe('onFrameDataRequestFail', callback);
				}
			} else if (document.readyState === 'loading') {
				main_core.Event.ready(() => {
					callback();
				});
			} else {
				callback();
			}
		}
		static clearCache() {
			void main_core.ajax.runAction('intranet.composite.clearCache');
		}
		showLoader() {
			if (Composite.isReady()) {
				return;
			}
			const page = window.location.pathname;
			if (page === '/stream/' || page === '/stream/index.php' || page === '/index.php') {
				this.#showLoader(this.getLiveFeedSkeleton());
				return;
			}
			const kanbanOptions = this.#getKanbanSkeletonOptions(page);
			if (kanbanOptions !== null) {
				this.#showLoader(this.#createKanbanSkeleton(kanbanOptions));
				return;
			}
			const gridOptions = this.#getGridSkeletonOptions(page);
			if (gridOptions !== null) {
				this.#showLoader(this.#createGridSkeleton(gridOptions));
				return;
			}
			this.#showLoader();
		}
		showRightSidebarLoader() {
			const container = document.getElementById('app__right-panel');
			if (container) {
				main_core.Dom.append(createRightSidebarSkeleton(), container);
			}
		}
		#showLoader(skeleton = null) {
			const container = this.getStubContainer();
			const stub = skeleton ?? this.getLoaderContainer();
			if (!container || stub.parentNode) {
				return;
			}
			main_core.Dom.append(stub, container);
		}
		#getGridSkeletonOptions(page) {
			const patterns = [[/^\/workgroups\/$/, {}], [/^\/crm\/(lead|deal|quote)\/(list|category)\/.*?$/, {
				toolbarOptions: {
					showIconButton: true
				},
				actionsBarOptions: {
					showCounterPanel: true,
					rightButtonsCount: 2
				}
			}], [/^\/crm\/(contact|company)\/list\/.*?$/, {
				toolbarOptions: {
					showIconButton: true
				},
				actionsBarOptions: {
					rightButtonsCount: 1
				}
			}], [/^\/crm\/type\/\d+\/list\/.*?$/, {
				toolbarOptions: {
					showIconButton: true
				},
				actionsBarOptions: {
					rightButtonsCount: 1
				}
			}], [/^\/crm\/configs\/mycompany\/.*?$/, {
				toolbarOptions: {
					showIconButton: true
				}
			}], [/^\/crm\/(events|activity|webform|copilot-call-assessment|catalog)\/.*?$/, {}], [/^\/crm\/type\/$/, {}], [/^\/company\/$/, {
				toolbarOptions: {
					showIconButton: true
				},
				actionsBarOptions: {
					rightButtonsCount: 1
				}
			}], [/^\/company\/personal\/user\/\d+\/tasks\/(projects|flow|scrum)\/.*?$/, {
				actionsBarOptions: {
					rightButtonsCount: 2
				}
			}], [/^\/company\/personal\/user\/\d+\/tasks\/(departments|templates)\/.*?$/, {}], [/^\/sign\/(list|contact)\/.*?$/, {
				toolbarOptions: {
					showIconButton: true
				},
				actionsBarOptions: {
					rightButtonsCount: 1
				}
			}], [/^\/sign\/mysafe\/.*?$/, {}], [/^\/sign\/b2e\/list\/.*?$/, {
				toolbarOptions: {
					showIconButton: true
				},
				actionsBarOptions: {
					rightButtonsCount: 1
				}
			}], [/^\/sign\/b2e\/my-documents\/.*?$/, {
				actionsBarOptions: true
			}], [/^\/sign\/b2e\/(settings|member_dynamic_settings|signers)\/.*?$/, {}], [/^\/shop\/documents\/(contractors|contractors_contacts)\/.*?$/, {
				toolbarOptions: {
					showIconButton: true
				},
				actionsBarOptions: {
					rightButtonsCount: 1
				}
			}], [/^\/shop\/documents\/.*?$/, {
				toolbarOptions: {
					showIconButton: true
				}
			}], [/^\/shop\/catalog\/\d+\/.*?$/, {}], [/^\/shop\/documents-catalog\/.*?$/, {}], [/^\/shop\/orders\/.*?$/, {
				toolbarOptions: {
					showIconButton: true
				},
				actionsBarOptions: {
					rightButtonsCount: 1
				}
			}], [/^\/shop\/settings\/(sale_location_type_list|sale_location_node_list|sale_person_type|sale_transact_admin|sale_basket)\/.*?$/, {}], [/^\/company\/lists\/\d+\/view\/\d+\/.*?$/, {
				toolbarOptions: {
					showIconButton: true
				}
			}], [/^\/company\/lists\/\d+\/fields\/.*?$/, {
				toolbarOptions: {
					showIconButton: true
				}
			}], [/^\/automation\/type\/.*?$/, {}], [/^\/bizproc\/userprocesses\/.*?$/, {
				actionsBarOptions: true
			}], [/^\/bizproc\/(start|bizproc)\/.*?$/, {}], [/^\/marketing\/(letter|ads|segment|template|blacklist|contact|rc|toloka)\/.*?$/, {}], [/^\/conference\/.*?$/, {}], [/^\/bi\/dashboard\/.*?$/, {}], [/^\/rpa\/tasks\/.*?$/, {}]];
			for (const pattern of patterns) {
				if (pattern[0].test(page)) {
					return pattern[1];
				}
			}
			return null;
		}
		#createKanbanSkeleton(options) {
			const actionsBarOptions = options?.actionsBarOptions ?? {};
			const showActionsBar = main_core.Type.isObject(options?.actionsBarOptions) || options?.actionsBarOptions === true;
			return main_core.Tag.render`
			<div class="grid-skeleton-wrapper">
				${createToolbarSkeleton(options.toolbarOptions)}
				${showActionsBar ? createActionsBarSkeleton(actionsBarOptions) : null}
				${createKanbanSkeleton()}
			</div>
		`;
		}
		#getKanbanSkeletonOptions(page) {
			const patterns = [[/^\/crm\/(lead|deal)\/(kanban|activity)\/.*?$/, {
				toolbarOptions: {
					showIconButton: true
				},
				actionsBarOptions: {
					rightButtonsCount: 2
				}
			}], [/^\/crm\/type\/\d+\/kanban\/.*?$/, {}], [/^\/sign\/$/, {
				toolbarOptions: {
					showIconButton: true
				},
				actionsBarOptions: {
					rightButtonsCount: 1
				}
			}], [/^\/sign\/b2e\/$/, {
				toolbarOptions: {
					showIconButton: true
				},
				actionsBarOptions: {
					rightButtonsCount: 1
				}
			}]];
			for (const pattern of patterns) {
				if (pattern[0].test(page)) {
					return pattern[1];
				}
			}
			return null;
		}
		#createGridSkeleton(options) {
			const actionsBarOptions = options?.actionsBarOptions ?? {};
			const showActionsBar = main_core.Type.isObject(options?.actionsBarOptions) || options?.actionsBarOptions === true;
			return main_core.Tag.render`
			<div class="grid-skeleton-wrapper">
				${createToolbarSkeleton(options.toolbarOptions)}
				${showActionsBar ? createActionsBarSkeleton(actionsBarOptions) : null}
				${createGridSkeleton()}
			</div>
		`;
		}
		getStubContainer() {
			return document.querySelector('#page-area');
		}
		getLoaderContainer() {
			return this.#refs.remember('loader', () => {
				return main_core.Tag.render`
				<div class="composite-skeleton-container">
					<div class="composite-loader-container">
						<svg class="composite-loader-circular" viewBox="25 25 50 50">
							<circle class="composite-loader-path" cx="50" cy="50" r="20" fill="none" stroke-miterlimit="10" />
						</svg>
					</div>
				</div>
			`;
			});
		}
		#bindEvents() {
			main_core_events.EventEmitter.subscribe('onFrameDataRequestFail', () => {
				console.error('Composite ajax request failed');
				top.location = `/auth/?backurl=${encodeURIComponent(getBackUrl())}`;
			});
			main_core_events.EventEmitter.subscribe('onAjaxFailure', event => {
				const [reason, status] = event.getCompatData();
				const redirectUrl = `/auth/?backurl=${getBackUrl()}`;
				if (Composite.isEnabled() && (reason === 'auth' || reason === 'status' && status === 401)) {
					console.error('Auth ajax request failed', reason, status);
					top.location = redirectUrl;
				}
			});
			if (pull_client.PULL) {
				pull_client.PULL.subscribe({
					moduleId: 'main',
					command: 'composite-cache-up',
					callback: () => {
						setTimeout(() => {
							const value = BX.localStorage.get('ajax-composite-cache-up-lock');
							if (!value) {
								BX.localStorage.set('ajax-composite-cache-up-lock', 'EXECUTE', 2);
								main_core.ajax({
									url: '/blank.php',
									method: 'GET',
									processData: false,
									skipBxHeader: true,
									emulateOnload: false
								});
							}
						}, Math.floor(Math.random() * 500));
					}
				});
			}
		}
		getLiveFeedSkeleton() {
			return this.#refs.remember('feed-skeleton', () => {
				return main_core.Tag.render`
				<div class="page top-menu-mode start-page no-background no-all-paddings no-page-header">
					<div class="page__workarea">
						<div class="page__sidebar">${this.getLiveFeedSidebar()}</div>
						<main class="page__workarea-content">${this.getLiveFeedWorkArea()}</main>
					</div>
				</div>
			`;
			});
		}
		getLiveFeedSidebar() {
			return this.#refs.remember('feed-sidebar', () => {
				return main_core.Tag.render`
				<div class="skeleton__white-bg-element skeleton__sidebar skeleton__intranet-ustat">
					<div class="skeleton__graph-circle"></div>
					<div class="skeleton__graph-right">
						<div class="skeleton__graph-right_top">
							<div class="skeleton__graph-right_top-circle --first"></div>
							<div class="skeleton__graph-right_top-circle"></div>
							<div class="skeleton__graph-right_top-circle"></div>
							<div class="skeleton__graph-right_top-circle"></div>
							<div class="skeleton__graph-right_top-circle"></div>
							<div class="skeleton__graph-right_top-circle"></div>
							<div class="skeleton__graph-right_top-circle"></div>
						</div>
						<div class="skeleton__graph-right_bottom">
							<div class="skeleton__graph-right_bottom-line"></div>
							<div class="skeleton__graph-right_bottom-line"></div>
						</div>
					</div>
				</div>

				<div class="skeleton__white-bg-element skeleton__sidebar">
					<div class="skeleton__sidebar-header">
						<div class="skeleton__sidebar-header_line"></div>
						<div class="skeleton__sidebar-header_circle"></div>
					</div>
					<div class="skeleton__tasks-row">
						<div class="skeleton__tasks-row_line"></div>
						<div class="skeleton__tasks-row_short-line"></div>
						<div class="skeleton__tasks-row_circle"></div>
					</div>
					<div class="skeleton__tasks-row">
						<div class="skeleton__tasks-row_line"></div>
						<div class="skeleton__tasks-row_short-line"></div>
						<div class="skeleton__tasks-row_circle"></div>
					</div>
					<div class="skeleton__tasks-row">
						<div class="skeleton__tasks-row_line"></div>
						<div class="skeleton__tasks-row_short-line"></div>
						<div class="skeleton__tasks-row_circle"></div>
					</div>
					<div class="skeleton__tasks-row">
						<div class="skeleton__tasks-row_line"></div>
						<div class="skeleton__tasks-row_short-line"></div>
						<div class="skeleton__tasks-row_circle"></div>
					</div>
				</div>
				<div class="skeleton__white-bg-element skeleton__sidebar">
					<div class="skeleton__sidebar-header">
						<div class="skeleton__sidebar-header_line"></div>
					</div>
					<div class="skeleton__birthdays-row">
						<div class="skeleton__birthdays-circle"></div>
						<div class="skeleton__birthdays-info">
							<div class="skeleton__birthdays-name"></div>
							<div class="skeleton__birthdays-date"></div>
						</div>
					</div>
					<div class="skeleton__birthdays-row">
						<div class="skeleton__birthdays-circle"></div>
						<div class="skeleton__birthdays-info">
							<div class="skeleton__birthdays-name"></div>
							<div class="skeleton__birthdays-date"></div>
						</div>
					</div>
					<div class="skeleton__birthdays-row">
						<div class="skeleton__birthdays-circle"></div>
						<div class="skeleton__birthdays-info">
							<div class="skeleton__birthdays-name"></div>
							<div class="skeleton__birthdays-date"></div>
						</div>
					</div>
					<div class="skeleton__birthdays-row">
						<div class="skeleton__birthdays-circle"></div>
						<div class="skeleton__birthdays-info">
							<div class="skeleton__birthdays-name"></div>
							<div class="skeleton__birthdays-date"></div>
						</div>
					</div>
				</div>
				<div class="skeleton__white-bg-element skeleton__sidebar">
					<div class="skeleton__sidebar-header">
						<div class="skeleton__sidebar-header_line"></div>
					</div>
					<div class="skeleton__birthdays-row">
						<div class="skeleton__birthdays-circle"></div>
						<div class="skeleton__birthdays-info">
							<div class="skeleton__birthdays-name"></div>
							<div class="skeleton__birthdays-date"></div>
						</div>
					</div>
					<div class="skeleton__birthdays-row">
						<div class="skeleton__birthdays-circle"></div>
						<div class="skeleton__birthdays-info">
							<div class="skeleton__birthdays-name"></div>
							<div class="skeleton__birthdays-date"></div>
						</div>
					</div>
					<div class="skeleton__birthdays-row">
						<div class="skeleton__birthdays-circle"></div>
						<div class="skeleton__birthdays-info">
							<div class="skeleton__birthdays-name"></div>
							<div class="skeleton__birthdays-date"></div>
						</div>
					</div>
					<div class="skeleton__birthdays-row">
						<div class="skeleton__birthdays-circle"></div>
						<div class="skeleton__birthdays-info">
							<div class="skeleton__birthdays-name"></div>
							<div class="skeleton__birthdays-date"></div>
						</div>
					</div>
				</div>
			`;
			});
		}
		getLiveFeedWorkArea() {
			return this.#refs.remember('feed-work-area', () => {
				return main_core.Tag.render`
				<div class="skeleton__white-bg-element skeleton__feed-wrap">
					<div class="skeleton__feed-wrap_header">
						<div class="skeleton__feed-wrap_header-link --long"></div>
						<div class="skeleton__feed-wrap_header-link --one"></div>
						<div class="skeleton__feed-wrap_header-link --two"></div>
						<div class="skeleton__feed-wrap_header-link --one"></div>
						<div class="skeleton__feed-wrap_header-link --two"></div>
					</div>
					<div class="skeleton__feed-wrap_header-content">
						<div class="skeleton__feed-wrap_header-text"></div>
					</div>
				</div>
				<div class="skeleton__title-block">
					<div class="skeleton__title-block_text"></div>
				</div>
				<div class="skeleton__white-bg-element skeleton__feed-item">
					<div class="skeleton__feed-item_user-icon"></div>
					<div class="skeleton__feed-item_content">
						<div class="skeleton__feed-item_main">
							<div class="skeleton__feed-item_text --name"></div>
							<div class="skeleton__feed-item_date"></div>
							<div class="skeleton__feed-item_text"></div>
							<div class="skeleton__feed-item_text"></div>
							<div class="skeleton__feed-item_text"></div>
							<div class="skeleton__feed-item_text"></div>
							<div class="skeleton__feed-item_text --short"></div>
						</div>
						<div class="skeleton__feed-item_nav">
							<div class="skeleton__feed-item_nav-line --one"></div>
							<div class="skeleton__feed-item_nav-line --two"></div>
							<div class="skeleton__feed-item_nav-line --three"></div>
							<div class="skeleton__feed-item_nav-line --four"></div>
						</div>
						<div class="skeleton__feed-item_like">
							<div class="skeleton__feed-item_like-icon"></div>
							<div class="skeleton__feed-item_like-name"></div>
						</div>
						<div class="skeleton__feed-item_comment">
							<div class="skeleton__feed-item_comment-icon"></div>
							<div class="skeleton__feed-item_comment-block">
								<div class="skeleton__feed-item_comment-text"></div>
							</div>
						</div>
					</div>
				</div>
				<div class="skeleton__white-bg-element skeleton__feed-item">
					<div class="skeleton__feed-item_user-icon"></div>
					<div class="skeleton__feed-item_content">
						<div class="skeleton__feed-item_main">
							<div class="skeleton__feed-item_text --name"></div>
							<div class="skeleton__feed-item_date"></div>
							<div class="skeleton__feed-item_text"></div>
							<div class="skeleton__feed-item_text"></div>
							<div class="skeleton__feed-item_text"></div>
							<div class="skeleton__feed-item_text"></div>
							<div class="skeleton__feed-item_text --short"></div>
						</div>
						<div class="skeleton__feed-item_nav">
							<div class="skeleton__feed-item_nav-line --one"></div>
							<div class="skeleton__feed-item_nav-line --two"></div>
							<div class="skeleton__feed-item_nav-line --three"></div>
							<div class="skeleton__feed-item_nav-line --four"></div>
						</div>
						<div class="skeleton__feed-item_like">
							<div class="skeleton__feed-item_like-icon"></div>
							<div class="skeleton__feed-item_like-name"></div>
						</div>
						<div class="skeleton__feed-item_comment">
							<div class="skeleton__feed-item_comment-icon"></div>
							<div class="skeleton__feed-item_comment-block">
								<div class="skeleton__feed-item_comment-text"></div>
							</div>
						</div>
					</div>
				</div>
				<div class="skeleton__white-bg-element skeleton__feed-item">
					<div class="skeleton__feed-item_user-icon"></div>
					<div class="skeleton__feed-item_content">
						<div class="skeleton__feed-item_main">
							<div class="skeleton__feed-item_text --name"></div>
							<div class="skeleton__feed-item_date"></div>
							<div class="skeleton__feed-item_text"></div>
							<div class="skeleton__feed-item_text"></div>
							<div class="skeleton__feed-item_text"></div>
							<div class="skeleton__feed-item_text"></div>
							<div class="skeleton__feed-item_text --short"></div>
						</div>
						<div class="skeleton__feed-item_nav">
							<div class="skeleton__feed-item_nav-line --one"></div>
							<div class="skeleton__feed-item_nav-line --two"></div>
							<div class="skeleton__feed-item_nav-line --three"></div>
							<div class="skeleton__feed-item_nav-line --four"></div>
						</div>
						<div class="skeleton__feed-item_like">
							<div class="skeleton__feed-item_like-icon"></div>
							<div class="skeleton__feed-item_like-name"></div>
						</div>
						<div class="skeleton__feed-item_comment">
							<div class="skeleton__feed-item_comment-icon"></div>
							<div class="skeleton__feed-item_comment-block">
								<div class="skeleton__feed-item_comment-text"></div>
							</div>
						</div>
					</div>
				</div>
			`;
			});
		}
	}

	class LeftMenu {
		getContainer() {
			return document.querySelector('.js-app__left-menu');
		}
		show() {
			main_core.Dom.removeClass(this.getContainer(), '--hidden');
		}
		hide() {
			main_core.Dom.addClass(this.getContainer(), '--hidden');
		}
		isVisible() {
			return !main_core.Dom.hasClass(this.getContainer(), '--hidden');
		}
	}

	class RightBar {
		#isScrollMode = false;
		#scrollModeThreshold = window.innerHeight;
		#goTopButton;
		constructor(options) {
			const redraw = this.redraw.bind(this);
			main_core.Event.bind(window, 'scroll', redraw, {
				passive: true
			});
			main_core.Event.bind(window, 'resize', redraw);
			this.#scrollModeThreshold = window.innerHeight;
			this.#goTopButton = options.goTopButton;
			this.#goTopButton.subscribe('show', () => {
				main_core.Dom.addClass(this.getContainer(), '--show-scroll-btn');
			});
			this.#goTopButton.subscribe('hide', () => {
				main_core.Dom.removeClass(this.getContainer(), '--show-scroll-btn');
			});
			main_core.Event.ready(() => {
				this.redraw();
			});
		}
		redraw() {
			const rightBar = this.getContainer();
			this.#scrollModeThreshold = window.innerHeight;
			if (window.pageYOffset > this.#scrollModeThreshold) {
				if (!this.#isScrollMode) {
					main_core.Dom.addClass(rightBar, '--scroll-mode');
					this.#isScrollMode = true;
				}
			} else if (this.#isScrollMode) {
				main_core.Dom.removeClass(rightBar, '--scroll-mode');
				this.#isScrollMode = false;
			}
		}
		getContainer() {
			return document.getElementById('right-bar');
		}
		show() {
			main_core.Dom.removeClass(this.getContainer(), '--hidden');
		}
		hide() {
			main_core.Dom.addClass(this.getContainer(), '--hidden');
		}
		isVisible() {
			return !main_core.Dom.hasClass(this.getContainer(), '--hidden');
		}
		setBackground(background) {
			main_core.Dom.style(this.getContainer(), {
				backgroundImage: background?.backgroundImage ?? null,
				backgroundColor: background?.backgroundColor ?? null,
				backgroundPosition: background?.backgroundPosition ?? null,
				backgroundRepeat: background?.backgroundRepeat ?? null,
				backgroundSize: background?.backgroundSize ?? null
			});
		}
		resetBackground() {
			main_core.Dom.style(this.getContainer(), {
				backgroundImage: null,
				backgroundColor: null,
				backgroundRepeat: null,
				backgroundSize: null,
				backgroundPosition: null
			});
		}
	}

	class Header {
		#burgerCounter = null;
		constructor() {
			this.#initMobileBurger();
		}
		getContainer() {
			return document.getElementById('app-header');
		}
		show() {
			main_core.Dom.removeClass(this.getContainer(), '--hidden');
		}
		hide() {
			main_core.Dom.addClass(this.getContainer(), '--hidden');
		}
		isVisible() {
			return !main_core.Dom.hasClass(this.getContainer(), '--hidden');
		}
		#initMobileBurger() {
			main_core.ready(() => {
				const burger = document.getElementById('air-header-burger');
				if (!burger) {
					return;
				}
				main_core.Event.bind(burger, 'click', () => {
					const menu = main_core.Reflection.getClass('BX.Intranet.LeftMenu');
					if (!menu) {
						return;
					}
					const root = document.querySelector('.js-app');
					if (!root) {
						return;
					}
					const isSliding = main_core.Dom.hasClass(root, 'menu-sliding-mode');
					menu.switchToSlidingMode(!isSliding);
				});
				this.#initBurgerCounter(burger);
			});
		}
		#initBurgerCounter(burger) {
			const counterWrapper = burger.querySelector('.air-header__burger-counter');
			if (!counterWrapper) {
				return;
			}
			this.#burgerCounter = new ui_cnt.Counter({
				value: 0,
				size: ui_cnt.Counter.Size.SMALL,
				color: ui_cnt.Counter.Color.DANGER,
				useAirDesign: true,
				style: ui_cnt.CounterStyle.FILLED_ALERT,
				hideIfZero: true
			});
			this.#burgerCounter.renderTo(counterWrapper);
			main_core.addCustomEvent('BX.Intranet.LeftMenu:onTotalCounterUpdate', total => {
				this.#burgerCounter.update(total);
			});
		}
	}

	class Footer {
		constructor() {
			main_core_events.EventEmitter.subscribe('Kanban.Grid:onFixedModeStart', () => {
				this.hide();
			});
		}
		show() {
			main_core.Dom.removeClass(this.getContainer(), '--hidden');
		}
		hide() {
			main_core.Dom.addClass(this.getContainer(), '--hidden');
		}
		getContainer() {
			return document.getElementById('air-footer');
		}
	}

	class GoTopButton extends main_core_events.EventEmitter {
		#lastScrollOffset = 0;
		#isReversed = false;
		#button;
		constructor() {
			super();
			this.setEventNamespace('GoTopButton');
			this.#bindEvents();
		}
		isShown() {
			return main_core.Dom.hasClass(this.#getButtonWrapper(), '--show');
		}
		#show() {
			this.emit('show');
			main_core.Dom.addClass(this.#getButtonWrapper(), '--show');
		}
		#hide() {
			this.emit('hide');
			main_core.Dom.removeClass(this.#getButtonWrapper(), '--show');
		}
		#getButtonWrapper() {
			return document.getElementById('goTopButtonWrapper');
		}
		#bindEvents() {
			main_core.Event.ready(() => {
				this.#handleScroll();
				main_core.Event.bind(window, 'scroll', () => {
					this.#handleScroll();
				});
				main_core.Event.bind(this.#getButtonWrapper(), 'click', () => {
					this.#handleButtonClick();
				});
			});
		}
		#handleScroll() {
			if (window.pageYOffset > document.documentElement.clientHeight) {
				this.#show();
				if (this.#isReversed) {
					this.#setReversed(false);
					this.#lastScrollOffset = 0;
				}
			} else if (this.#isReversed === false) {
				this.#hide();
			}
		}
		#handleButtonClick() {
			if (this.#isReversed) {
				this.#setReversed(false);
				window.scrollTo({
					top: this.#lastScrollOffset,
					behavior: 'instant'
				});
				this.#lastScrollOffset = 0;
			} else {
				this.#setReversed(true);
				this.#lastScrollOffset = window.pageYOffset;
				window.scrollTo({
					top: 0,
					behavior: 'instant'
				});
			}
		}
		#setReversed(flag = true) {
			this.#isReversed = flag;
			if (this.#isReversed) {
				this.#getButton().setIcon(ui_buttons.ButtonIcon.ANGLE_DOWN);
			} else {
				this.#getButton().setIcon(ui_buttons.ButtonIcon.ANGLE_UP);
			}
		}
		#getButton() {
			return this.#button || ui_buttons.ButtonManager.createFromNode(document.getElementById('goTopButton'));
		}
	}

	class CollaborationMenu {
		constructor() {
			main_core_events.EventEmitter.subscribe('onImUpdateCounterMessage', this.#handleCounterUpdate.bind(this));
			main_core_events.EventEmitter.subscribe('onCounterDecrement', this.#handleLiveFeedCounterDecrement.bind(this));
		}
		getMenu() {
			/**
			 *
			 * @type {BX.Main.interfaceButtonsManager}
			 */
			const menuManager = main_core.Reflection.getClass('BX.Main.interfaceButtonsManager');
			if (menuManager) {
				return menuManager.getById('top_menu_id_collaboration');
			}
			return null;
		}
		#handleCounterUpdate(event) {
			const menu = this.getMenu();
			const [counter] = event.getCompatData();
			menu?.updateCounter('im-message', counter);
		}
		#handleLiveFeedCounterDecrement(event) {
			const [decrement] = event.getCompatData();
			const menu = this.getMenu();
			if (menu) {
				const item = menu.getItemById('menu_live_feed');
				if (item) {
					const itemData = menu.getItemData(item);
					const {
						COUNTER,
						COUNTER_ID
					} = itemData;
					menu?.updateCounter(COUNTER_ID, Math.max(0, COUNTER - decrement));
				}
			}
		}
	}

	class RightPanel extends main_core_events.EventEmitter {
		static #EXPANDED_CLASS = '--right-panel-expanded';
		static #RESIZING_CLASS = '--resizing';
		static #DEFAULT_WIDTH = 380;
		static #SS_WIDTH_KEY = 'b24_right_panel_width';
		static #SS_EXPANDED_KEY = 'b24_right_panel_expanded';
		#resizeObserver = null;
		#resizeHandleEl = null;
		#dragOverlayEl = null;
		#isDragging = false;
		#pendingTransitionEvent = null;
		#dragStartX = 0;
		#dragStartWidth = 0;
		#savedWidth = null;
		#boundOnPointerDown;
		#boundOnPointerMove;
		#boundOnPointerUp;
		#boundOnTransitionEnd;
		constructor() {
			super();
			this.setEventNamespace('BX.Intranet.Bitrix24.Template.RightPanel');
			this.#boundOnPointerDown = this.#onPointerDown.bind(this);
			this.#boundOnPointerMove = this.#onPointerMove.bind(this);
			this.#boundOnPointerUp = this.#onPointerUp.bind(this);
			this.#boundOnTransitionEnd = this.#onTransitionEnd.bind(this);
			this.#subscribeToEvents();
		}
		getContainer() {
			const panel = document.getElementById('app__right-panel');
			if (panel !== null && this.#resizeObserver === null) {
				this.#resizeObserver = new ResizeObserver(this.#handleResizeObserver.bind(this));
				this.#resizeObserver.observe(panel);
			}
			return panel;
		}
		#getSavedWidth() {
			if (this.#savedWidth === null) {
				const parsed = parseInt(getComputedStyle(document.body).getPropertyValue('--air-right-panel-width'), 10);
				this.#savedWidth = parsed > 0 ? parsed : RightPanel.#DEFAULT_WIDTH;
			}
			return this.#savedWidth;
		}
		isExpanded() {
			return main_core.Dom.hasClass(document.body, RightPanel.#EXPANDED_CLASS);
		}
		expand() {
			if (this.isExpanded()) {
				return;
			}
			this.#cancelTransition();
			main_core.Dom.addClass(document.body, RightPanel.#EXPANDED_CLASS);
			this.#applySavedWidth();
			this.#initResizeHandle();
			this.#saveExpandedToSessionStorage(true);
			this.#saveWidthToSessionStorage();
			this.emit('onExpand');
			this.#startTransition('onExpandComplete');
		}
		collapse() {
			if (!this.isExpanded()) {
				return;
			}
			this.#cancelTransition();
			main_core.Dom.removeClass(document.body, [RightPanel.#EXPANDED_CLASS, '--right-panel-no-transition', RightPanel.#RESIZING_CLASS]);
			this.#saveExpandedToSessionStorage(false);
			this.emit('onCollapse');
			this.#startTransition('onCollapseComplete');
		}
		#startTransition(eventName) {
			this.#pendingTransitionEvent = eventName;
			const container = this.getContainer();
			if (container) {
				main_core.Event.bind(container, 'transitionend', this.#boundOnTransitionEnd);
			}
		}
		#cancelTransition() {
			this.#pendingTransitionEvent = null;
			const container = this.getContainer();
			if (container) {
				main_core.Event.unbind(container, 'transitionend', this.#boundOnTransitionEnd);
			}
		}
		#onTransitionEnd(event) {
			if (event.target !== this.getContainer() || event.propertyName !== 'width') {
				return;
			}
			const eventName = this.#pendingTransitionEvent;
			this.#cancelTransition();
			if (eventName) {
				this.emit(eventName);
			}
			window.dispatchEvent(new window.Event('resize'));
		}
		#applySavedWidth() {
			main_core.Dom.style(document.body, '--air-right-panel-width', `${this.#getSavedWidth()}px`);
		}
		#initResizeHandle() {
			const container = this.getContainer();
			if (!container || this.#resizeHandleEl) {
				return;
			}
			const grabberIcon = new ui_iconSet_api_core.Icon({
				icon: ui_iconSet_api_core.Outline.DRAG_L,
				size: 18
			});
			this.#resizeHandleEl = main_core.Tag.render`
			<div class="right-panel-resize-handle --ui-context-content-dark">
				<div class="right-panel-resize-handle__grabber">
					<div class="right-panel-resize-handle__grabber-icon">
						${grabberIcon.render()}
					</div>
				</div>
			</div>
		`;
			main_core.Dom.append(this.#resizeHandleEl, container);
			main_core.Event.bind(this.#resizeHandleEl, 'pointerdown', this.#boundOnPointerDown);
		}
		#onPointerDown(event) {
			event.preventDefault();
			const container = this.getContainer();
			if (!container) {
				return;
			}
			this.#isDragging = true;
			this.#dragStartX = event.clientX;
			this.#dragStartWidth = container.getBoundingClientRect().width;
			main_core.Dom.addClass(document.body, RightPanel.#RESIZING_CLASS);
			this.#showDragOverlay();
			main_core.Event.bind(document, 'pointermove', this.#boundOnPointerMove);
			main_core.Event.bind(document, 'pointerup', this.#boundOnPointerUp);
		}
		#onPointerMove(event) {
			if (!this.#isDragging) {
				return;
			}
			const delta = this.#dragStartX - event.clientX;
			const newWidth = this.#dragStartWidth + delta;
			main_core.Dom.style(document.body, '--air-right-panel-width', `${newWidth}px`);
			const container = this.getContainer();
			if (container) {
				const actualWidth = container.getBoundingClientRect().width;
				if (actualWidth !== newWidth) {
					main_core.Dom.style(document.body, '--air-right-panel-width', `${actualWidth}px`);
				}
			}
		}
		#onPointerUp(event) {
			if (!this.#isDragging) {
				return;
			}
			this.#isDragging = false;
			main_core.Dom.removeClass(document.body, RightPanel.#RESIZING_CLASS);
			this.#hideDragOverlay();
			main_core.Event.unbind(document, 'pointermove', this.#boundOnPointerMove);
			main_core.Event.unbind(document, 'pointerup', this.#boundOnPointerUp);
			const container = this.getContainer();
			if (container && this.#getSavedWidth() !== container.getBoundingClientRect().width) {
				this.#savedWidth = container.getBoundingClientRect().width;
				this.#saveWidth();
				window.dispatchEvent(new window.Event('resize'));
			}
		}
		#showDragOverlay() {
			if (!this.#dragOverlayEl) {
				this.#dragOverlayEl = main_core.Tag.render`
				<div class="right-panel-drag-overlay"></div>
			`;
			}
			main_core.Dom.append(this.#dragOverlayEl, document.body);
		}
		#hideDragOverlay() {
			if (this.#dragOverlayEl) {
				main_core.Dom.remove(this.#dragOverlayEl);
			}
		}
		#saveWidth() {
			BX.userOptions.save('intranet', 'right_panel_width', null, String(this.#getSavedWidth()));
			this.#saveWidthToSessionStorage();
			Composite.clearCache();
		}
		#handleResizeObserver() {
			this.emit('onResize');
		}
		#saveExpandedToSessionStorage(expanded) {
			try {
				sessionStorage.setItem(RightPanel.#SS_EXPANDED_KEY, expanded ? 'Y' : 'N');
			} catch {/* sessionStorage may be unavailable */}
		}
		#saveWidthToSessionStorage() {
			try {
				sessionStorage.setItem(RightPanel.#SS_WIDTH_KEY, String(this.#getSavedWidth()));
			} catch {/* sessionStorage may be unavailable */}
		}
		#subscribeToEvents() {
			const clearComposite = () => Composite.clearCache();
			this.subscribe('onExpandComplete', clearComposite);
			this.subscribe('onCollapseComplete', clearComposite);
			Composite.ready(() => {
				this.#initResizeHandle();
			});
		}
	}

	class RightPanelAiChat extends main_core_events.EventEmitter {
		#rightPanel;
		#rightBar;
		#siteTemplate;
		#container = null;
		#contentContainer = null;
		#vueApp = null;
		#isExpanded = false;
		#chatExtensionPromise = null;
		constructor(rightPanel, rightBar, siteTemplate) {
			super();
			this.setEventNamespace('BX.Intranet.Bitrix24.Template.RightPanelAiChat');
			this.#rightPanel = rightPanel;
			this.#rightBar = rightBar;
			this.#siteTemplate = siteTemplate;
		}
		isExpanded() {
			return this.#isExpanded;
		}
		expand(params) {
			if (this.#isExpanded) {
				return;
			}
			this.#isExpanded = true;
			this.#loadTheme().then(({
				ThemeManager,
				SpecialBackground
			}) => {
				if (!this.#isExpanded) {
					return;
				}
				const chatBackground = ThemeManager.getBackgroundStyleById(SpecialBackground.aiAssistantWidget || SpecialBackground.aiAssistant);
				if (!this.#container) {
					this.#initContainer(chatBackground);
				}
				this.#showSidebar();
				const avatarBg = SpecialBackground.aiAssistantWidget ? '#4c40a8' : '#ffffff';
				this.#mountVueApp(params.chatId, avatarBg);
				this.emit('onExpand');
				main_core_events.EventEmitter.subscribeOnce('IM.AiAssistantWidget:minimize', () => {
					this.collapse();
				});
			}).catch(error => {
				console.error('RightPanelAiChat: Failed to load theme:', error);
				this.#isExpanded = false;
			});
		}
		collapse() {
			if (!this.#isExpanded) {
				return;
			}
			this.#isExpanded = false;
			this.emit('onCollapse');
			this.#rightPanel.subscribeOnce('onCollapseComplete', () => {
				this.#rightBar.resetBackground();
				this.#siteTemplate.resetAvatarBlockBackground();
				this.#destroy();
			});
			this.#rightPanel.collapse();
		}
		preload() {
			return this.#loadChatExtension();
		}
		#showSidebar() {
			const sidebarContainer = this.#rightPanel.getContainer();
			if (!sidebarContainer) {
				console.error('RightPanelAiChat: Sidebar container #app__right-panel not found');
				return;
			}
			this.#rightPanel.expand();
			main_core.Dom.append(this.#container, sidebarContainer);
		}
		#initContainer(chatBackground) {
			this.#contentContainer = main_core.Tag.render`
			<div class="right-panel-ai-chat__content"></div>
		`;
			const loader = new main_loader.Loader({
				size: 144,
				color: 'rgba(255, 255, 255, 0.6)',
				target: this.#contentContainer,
				offset: {
					top: '-50px'
				}
			});
			loader.show();
			this.#container = main_core.Tag.render`
			<div class="right-panel-ai-chat --ui-context-content-light">
				${this.#contentContainer}
				<div class="right-panel-ai-chat__background"
					style="
						background-color: ${chatBackground.backgroundColor};
						background-image: ${chatBackground.backgroundImage};
						background-position: ${chatBackground.backgroundPosition};
						background-repeat: ${chatBackground.backgroundRepeat};
						background-size: ${chatBackground.backgroundSize};
					"
				></div>
			</div>
		`;
		}
		async #mountVueApp(chatId, avatarBg) {
			try {
				const application = await this.#loadChatExtension();
				if (!this.#isExpanded) {
					return;
				}
				this.#vueApp = application;
				application.mount({
					aiAssistantBotId: chatId,
					rootContainer: this.#contentContainer
				});
				this.#siteTemplate.setAvatarBlockBackground({
					backgroundColor: avatarBg
				});
			} catch (error) {
				console.error('RightPanelAiChat: Failed to mount chat widget:', error);
			}
		}
		#loadChatExtension() {
			if (!this.#chatExtensionPromise) {
				this.#chatExtensionPromise = main_core.Runtime.loadExtension('im.v2.application.integration.ai-assistant-widget').then(() => {
					const LaunchApplication = BX.Messenger.v2.Application.Launch;
					const ChatEmbeddedApplication = BX.Messenger.v2.Application.ChatEmbeddedApplication;
					return LaunchApplication(ChatEmbeddedApplication.aiAssistantWidget);
				}).catch(error => {
					console.error('RightPanelAiChat: Failed to preload chat extension:', error);
					this.#chatExtensionPromise = null;
					throw error;
				});
			}
			return this.#chatExtensionPromise;
		}
		#loadTheme() {
			return main_core.Runtime.loadExtension('im.v2.lib.theme').then(exports => {
				return {
					ThemeManager: exports.ThemeManager,
					SpecialBackground: exports.SpecialBackground
				};
			});
		}
		#destroy() {
			if (this.#vueApp) {
				this.#vueApp.bitrixVue.unmount();
				this.#vueApp = null;
			}
			main_core.Dom.remove(this.#container);
			this.#container = null;
			this.#contentContainer = null;
		}
	}

	class RightSidebar {
		#rightPanel;
		#rightBar;
		#overlay = null;
		constructor(panel, bar) {
			this.#rightPanel = panel;
			this.#rightBar = bar;
			panel.subscribe('onResize', () => {
				main_sidepanel.SidePanel.Instance.adjustLayout();
				this.adjustOverlay();
			});
			panel.subscribe('onExpand', () => {
				this.toggleContext();
			});
			panel.subscribe('onCollapse', () => {
				this.toggleContext();
			});
			panel.subscribe('onExpandComplete', () => {
				this.adjustOverlay();
			});
			panel.subscribe('onCollapseComplete', () => {
				this.adjustOverlay();
			});
			main_core_events.EventEmitter.subscribe('SidePanel.Slider:onOpening', () => {
				this.adjustOverlay();
				this.toggleContext();
			});
			const onClose = () => {
				if (main_sidepanel.SidePanel.Instance.getOpenSlidersCount() === 0) {
					this.adjustOverlay();
				}
				this.toggleContext();
			};
			main_core_events.EventEmitter.subscribe('SidePanel.Slider:onCloseComplete', onClose);
			main_core_events.EventEmitter.subscribe('SidePanel.Slider:onDestroy', onClose);
		}
		getOverlay() {
			if (this.#overlay === null) {
				this.#overlay = main_core.Tag.render`<div class="right-bar-overlay"></div>`;
				main_core.Dom.append(this.#overlay, document.body);
			}
			return this.#overlay;
		}
		setOverlayBackground(background) {
			main_core.Dom.style(this.getOverlay(), 'background', background);
		}
		adjustOverlay() {
			const rightPanel = this.#rightPanel.getContainer() || this.#rightBar.getContainer();
			if (rightPanel === null) {
				return;
			}
			const windowWidth = main_core.Browser.isMobile() ? window.innerWidth : document.documentElement.clientWidth;
			const width = windowWidth - rightPanel.getBoundingClientRect().left;
			main_core.Dom.style(this.getOverlay(), 'width', `${width}px`);
		}
		toggleContext() {
			if (this.#rightBar.getContainer() === null) {
				return;
			}
			if (this.#rightPanel.isExpanded()) {
				main_core.Dom.removeClass(this.#rightBar.getContainer(), '--ui-context-edge-light');
				main_core.Dom.addClass(this.#rightBar.getContainer(), '--ui-context-edge-dark');
			} else if (main_sidepanel.SidePanel.Instance.getOpenSlidersCount() > 0) {
				main_core.Dom.addClass(this.#rightBar.getContainer(), '--ui-context-edge-dark');
				main_core.Dom.removeClass(this.#rightBar.getContainer(), '--ui-context-edge-light');
			} else {
				main_core.Dom.removeClass(this.#rightBar.getContainer(), ['--ui-context-edge-light', '--ui-context-edge-dark']);
			}
		}
	}

	class SiteTemplate {
		#leftMenu = null;
		#rightBar = null;
		#header = null;
		#footer = null;
		#composite = null;
		#chatMenu = null;
		#goTopButton = null;
		#collaborationMenu = null;
		#rightPanel = null;
		#rightPanelAiChat = null;
		#rightSidebar = null;
		#skipToContent = null;
		constructor() {
			this.#preventFromIframe();
			this.#patchPopupMenu();
			this.#patchRestAPI();
			this.#patchJSClock();
			this.#skipToContent = new intranet_skipToContent.SkipToContent();
			this.#goTopButton = new GoTopButton();
			this.#leftMenu = new LeftMenu();
			this.#rightBar = new RightBar({
				goTopButton: this.#goTopButton
			});
			this.#header = new Header();
			this.#footer = new Footer();
			this.#composite = new Composite();
			this.#chatMenu = new ChatMenu();
			this.#collaborationMenu = new CollaborationMenu();
			this.#rightPanel = new RightPanel();
			this.#rightPanelAiChat = new RightPanelAiChat(this.#rightPanel, this.#rightBar, this);
			this.#rightSidebar = new RightSidebar(this.#rightPanel, this.#rightBar);
			main_core.ready(() => this.#skipToContent.render());
			this.#applyUserAgentRules();
		}
		getLeftMenu() {
			return this.#leftMenu;
		}
		getRightBar() {
			return this.#rightBar;
		}
		getHeader() {
			return this.#header;
		}
		getFooter() {
			return this.#footer;
		}
		getComposite() {
			return this.#composite;
		}
		getChatMenu() {
			return this.#chatMenu;
		}
		getCollaborationMenu() {
			return this.#collaborationMenu;
		}
		getRightPanel() {
			return this.#rightPanel;
		}
		getRightPanelAiChat() {
			return this.#rightPanelAiChat;
		}
		getRightSidebar() {
			return this.#rightSidebar;
		}
		enterFullscreen() {
			if (this.isFullscreen()) {
				return;
			}
			if (!this.#supportViewTransition()) {
				this.#enterFullscreen();
				this.#dispatchResizeEvent();
				return;
			}
			const transition = document.startViewTransition(() => {
				this.#enterFullscreen();
			});
			transition.finished.then(() => {
				this.#dispatchResizeEvent();
			}).catch(() => {
				// fail silently
			});
		}
		exitFullscreen() {
			if (!this.isFullscreen()) {
				return;
			}
			if (!this.#supportViewTransition()) {
				this.#exitFullscreen();
				this.#dispatchResizeEvent();
				return;
			}
			const transition = document.startViewTransition(() => {
				this.#exitFullscreen();
			});
			transition.finished.then(() => {
				this.#dispatchResizeEvent();
			}).catch(() => {
				// fail silently
			});
		}
		toggleFullscreen() {
			if (this.isFullscreen()) {
				this.exitFullscreen();
			} else {
				this.enterFullscreen();
			}
		}
		isFullscreen() {
			return main_core.Dom.hasClass(document.body, 'air-fullscreen-mode');
		}
		setAvatarBlockBackground(background) {
			// hack for chat.js #showSidebar()
			this.getRightSidebar().toggleContext();
			main_core.Dom.style(document.getElementById('avatar-area'), {
				backgroundImage: background?.backgroundImage ?? null,
				backgroundColor: background?.backgroundColor ?? null,
				backgroundPosition: background?.backgroundPosition ?? null,
				backgroundRepeat: background?.backgroundRepeat ?? null,
				backgroundSize: background?.backgroundSize ?? null
			});
		}
		resetAvatarBlockBackground() {
			main_core.Dom.style(document.getElementById('avatar-area'), {
				backgroundImage: null,
				backgroundColor: null,
				backgroundPosition: null,
				backgroundRepeat: null,
				backgroundSize: null
			});
		}
		#supportViewTransition() {
			return main_core.Type.isFunction(document.startViewTransition) && !main_core.Browser.isSafari();
		}
		#enterFullscreen() {
			main_core.Dom.addClass(document.body, 'air-fullscreen-mode');
			this.getLeftMenu().hide();
			this.getHeader().hide();
			this.getFooter().hide();
			this.getRightBar().hide();
		}
		#exitFullscreen() {
			main_core.Dom.removeClass(document.body, 'air-fullscreen-mode');
			this.getLeftMenu().show();
			this.getHeader().show();
			this.getFooter().show();
			this.getRightBar().show();
		}
		#dispatchResizeEvent() {
			window.dispatchEvent(new Event('resize'));
		}
		#patchPopupMenu() {
			main_core_events.EventEmitter.subscribe('BX.Main.Menu:onInit', event => {
				const {
					params
				} = event.getData();
				if (params && main_core.Type.isNumber(params.maxWidth)) {
					// We increased menu-item's font-size that's why we increase max-width
					params.maxWidth += 10;
				}
			});
		}
		#patchJSClock() {
			main_core_events.EventEmitter.subscribe('onJCClockInit', config => {
				window.JCClock.setOptions({
					centerXInline: 83,
					centerX: 83,
					centerYInline: 67,
					centerY: 79,
					minuteLength: 31,
					hourLength: 26,
					popupHeight: 229,
					inaccuracy: 15,
					cancelCheckClick: true
				});
			});
		}
		#preventFromIframe() {
			const iframeMode = window !== window.top;
			if (iframeMode) {
				window.top.location = window.location.href;
			}
		}
		#applyUserAgentRules() {
			if (!main_core.Browser.isMobile() && document.referrer !== '' && document.referrer.startsWith(location.origin) === false) {
				main_core.Runtime.loadExtension('intranet.recognize-links');
			}
		}
		#patchRestAPI() {
			const AppLayout = main_core.Reflection.getClass('BX.rest.AppLayout');
			if (!AppLayout) {
				return;
			}
			const placementInterface = AppLayout.initializePlacement('DEFAULT');
			placementInterface.prototype.showHelper = async function (params, cb) {
				let query = '';
				if (main_core.Type.isNumber(params)) {
					query = `redirect=detail&code=${params}`;
				} else if (main_core.Type.isStringFilled(params)) {
					query = params;
				} else if (main_core.Type.isPlainObject(params)) {
					for (const param of Object.keys(params)) {
						if (query.length > 0) {
							query += '&';
						}
						query += `${param}=${params[param]}`;
					}
				}
				if (query.length > 0) {
					await main_core.Runtime.loadExtension('helper');
					const Helper = main_core.Reflection.getClass('BX.Helper');
					Helper.show(query);
				}
			};
		}
	}

	class SearchTitle {
		#searchOptions = {};
		#extensionLoaded = false;
		#container = null;
		#button = null;
		#input = null;
		#searchTitleInstance = null;
		#searchButtonLabel = '';
		#closeButtonLabel = '';
		#boundHandleKeyDown = null;
		constructor(options) {
			this.#container = document.getElementById(options.containerId);
			this.#button = document.getElementById(options.buttonId);
			this.#input = document.getElementById(options.inputId);
			this.#searchOptions = options.searchOptions;
			this.#searchButtonLabel = options.searchButtonLabel || '';
			this.#closeButtonLabel = options.closeButtonLabel || '';
			this.#boundHandleKeyDown = this.#handleKeyDown.bind(this);
			main_core.Event.bind(this.#button, 'click', this.#handleButtonClick.bind(this));
			main_core.Event.bind(this.#input, 'focusout', this.#handleInputFocusOut.bind(this));
		}
		open() {
			main_core.Dom.addClass(this.#container, '--active');
			this.#input.disabled = false;
			main_core.Dom.attr(this.#input, 'aria-hidden', null);
			main_core.Dom.attr(this.#input, 'tabindex', null);
			main_core.Dom.attr(this.#button, 'aria-label', this.#closeButtonLabel);
			main_core.Dom.attr(this.#button, 'aria-expanded', true);
			main_core.Event.bind(document, 'keydown', this.#boundHandleKeyDown);
			setTimeout(() => {
				this.#input.focus();
			}, 200);
		}
		close() {
			main_core.Event.unbind(document, 'keydown', this.#boundHandleKeyDown);
			main_core.Dom.removeClass(this.#container, '--active');
			this.#input.disabled = true;
			main_core.Dom.attr(this.#input, 'aria-hidden', true);
			main_core.Dom.attr(this.#input, 'tabindex', -1);
			main_core.Dom.attr(this.#button, 'aria-label', this.#searchButtonLabel);
			main_core.Dom.attr(this.#button, 'aria-expanded', false);
			if (this.#searchTitleInstance !== null) {
				this.#searchTitleInstance.clearSearch();
				this.#searchTitleInstance.closeResult();
			}
		}
		#handleButtonClick() {
			if (main_core.Dom.hasClass(this.#container, '--active')) {
				this.close();
			} else {
				this.open();
			}
			if (this.#extensionLoaded) {
				return;
			}
			this.#extensionLoaded = true;
			main_core.Runtime.loadExtension('intranet.search_title').then(() => {
				const SearchTitleClass = main_core.Reflection.getClass('BX.Intranet.SearchTitle');
				this.#searchTitleInstance = new SearchTitleClass(this.#searchOptions);
			}).catch(error => {
				console.error(error);
			});
		}
		#handleInputFocusOut(event) {
			if (!main_core.Type.isStringFilled(this.#input.value) && event.relatedTarget !== this.#button) {
				this.close();
			}
		}
		#handleKeyDown(event) {
			if (event.key !== 'Escape') {
				return;
			}
			this.close();
			this.#button.focus();
		}
	}

	class AvatarButton {
		static #avatarWrapper;
		static #cache = new main_core_cache.MemoryCache();
		static #options;
		static init(options) {
			this.#options = options;
			this.#avatarWrapper = document.querySelector('[data-id="bx-avatar-widget"]');
			this.#setEventHandlerForChangeAvatar();
			if (this.#options.signDocumentsCounter > 0 || this.#options.verifyPhoneCounter) {
				this.#showCounter();
				this.#setEventHandlersForUpdateCounter();
			}
			if (this.#options.workTimeAvailable) {
				this.#showWorkTimeState();
			}
			main_core.Event.bind(this.#avatarWrapper, 'click', () => {
				main_core.Event.unbindAll(this.#avatarWrapper);
				this.#getWidgetLoader().getPopup().setFixed(true);
				this.#getWidgetLoader().createSkeletonFromConfig(options.skeleton).show();
				this.#setHiddenAvatar();
				this.#getWidgetLoader().getPopup().subscribe('onClose', () => {
					this.#setVisibleAvatar();
				});
				this.#getWidgetLoader().getPopup().subscribe('onShow', () => {
					this.#setHiddenAvatar();
				});
				main_core.Runtime.loadExtension(['intranet.avatar-widget']).then(() => {
					this.#showWidget();
				}).catch(() => {});
			});
		}
		static #showWidget() {
			this.#getContent().then(response => {
				this.#getWidgetLoader().clearBeforeInsertContent();
				intranet_avatarWidget.AvatarWidget.getInstance().setOptions({
					buttonWrapper: this.#avatarWrapper,
					loader: this.#getWidgetLoader().getPopup(),
					data: response.data
				}).show();
				main_core.Event.bind(this.#avatarWrapper, 'click', () => {
					intranet_avatarWidget.AvatarWidget.getInstance().show();
				});
			}).catch(error => {
				console.error(error);
			});
		}
		static #getWidgetLoader() {
			return this.#cache.remember('widgetLoader', () => {
				return new intranet_widgetLoader.WidgetLoader({
					id: 'bx-avatar-header-popup',
					bindElement: this.#avatarWrapper,
					className: 'intranet-avatar-widget-base-popup',
					width: 390,
					useAngle: false,
					fixed: true,
					offsetTop: -50,
					offsetLeft: 0
				});
			});
		}
		static #getContent() {
			return this.#cache.remember('content', () => {
				return new Promise((resolve, reject) => {
					main_core.ajax.runAction('intranet.user.widget.getContent').then(response => resolve(response)).catch(response => reject(response));
				});
			});
		}
		static #showCounter() {
			this.#getCounter().renderTo(this.#getCounterWrapper());
		}
		static #setHiddenAvatar() {
			main_core.Dom.style(this.#avatarWrapper, 'opacity', '0');
			main_core.Dom.attr(this.#avatarWrapper, 'aria-hidden', 'true');
		}
		static #setVisibleAvatar() {
			main_core.Dom.style(this.#avatarWrapper, 'opacity', '1');
			main_core.Dom.attr(this.#avatarWrapper, 'aria-hidden', 'false');
		}
		static #showWorkTimeState() {
			this.#getWorkTimeState().renderTo(this.#getShortWorkTimeStateWrapper());
			this.#getWorkTimeState().subscribe('onUpdateState', event => {
				this.#updateStateButton(event.data);
			});
		}
		static #updateStateButton(config) {
			let className = '';
			const stateClasses = ['--worktime-not-started', '--worktime-finished', '--worktime-not-finished', '--worktime-paused'];
			stateClasses.forEach(stateClass => {
				main_core.Dom.removeClass(this.#avatarWrapper, stateClass);
			});
			switch (config.state) {
				case 'CLOSED':
					className = config.action === 'OPEN' ? '--worktime-not-started' : '--worktime-finished';
					break;
				case 'EXPIRED':
					className = '--worktime-not-finished';
					break;
				case 'PAUSED':
					className = '--worktime-paused';
					break;
				default:
					className = '';
					break;
			}
			if (className) {
				main_core.Dom.addClass(this.#avatarWrapper, className);
			}
		}
		static #getCounterWrapper() {
			return this.#cache.remember('counterWrapper', () => {
				return this.#avatarWrapper.querySelector('.air-user-profile-avatar__counter');
			});
		}
		static #getShortWorkTimeStateWrapper() {
			return this.#cache.remember('workTimeStateWrapper', () => {
				return this.#avatarWrapper.querySelector('.air-user-profile-avatar__work-time-state-short');
			});
		}
		static #getCounter() {
			return this.#cache.remember('counter', () => {
				return new ui_cnt.Counter({
					color: ui_cnt.Counter.Color.DANGER,
					size: ui_cnt.Counter.Size.MEDIUM,
					value: this.#calculateCounterValue(),
					useAirDesign: true,
					style: ui_cnt.CounterStyle.FILLED_ALERT
				});
			});
		}
		static #calculateCounterValue() {
			return this.#options.signDocumentsCounter + (this.#options.verifyPhoneCounter ? 1 : 0);
		}
		static #getWorkTimeState() {
			return this.#cache.remember('workTimeState', () => {
				return new timeman_workTimeStateIcon.WorkTimeStateIcon({
					state: this.#options.workTimeState,
					action: this.#options.workTimeAction
				});
			});
		}
		static #setEventHandlersForUpdateCounter() {
			if (this.#options.signDocumentsCounter > 0) {
				pull_client.PULL.subscribe({
					moduleId: 'sign',
					command: this.#options.signDocumentsPullEventName,
					callback: params => {
						if (!main_core.Type.isNumber(params?.needActionCount)) {
							return;
						}
						if (params?.needActionCount > 0) {
							this.#options.signDocumentsCounter = params.needActionCount;
							this.#getCounter().update(this.#calculateCounterValue());
						} else if (!this.#options.verifyPhoneCounter) {
							this.#options.signDocumentsCounter = 0;
							this.#getCounter().destroy();
						}
					}
				});
			}
			if (this.#options.verifyPhoneCounter) {
				pull_client.PULL.subscribe({
					moduleId: 'intranet',
					command: this.#options.verifyPhonePullEventName,
					callback: () => {
						this.#options.verifyPhoneCounter = false;
						if (this.#options.signDocumentsCounter <= 0) {
							this.#getCounter().destroy();
						} else {
							this.#getCounter().update(this.#calculateCounterValue());
						}
					}
				});
			}
		}
		static #setEventHandlerForChangeAvatar() {
			const avatar = this.#avatarWrapper.querySelector('.air-user-profile__avatar i');
			main_core_events.EventEmitter.subscribe('BX.Intranet.UserProfile:Avatar:changed', event => {
				const data = event.getData()[0];
				const url = data && data.url ? data.url : '';
				const eventUserId = data && data.userId ? data.userId : 0;
				if (this.#options.userId === eventUserId && avatar) {
					avatar.style = main_core.Type.isStringFilled(url) ? `background-size: cover; background-image: url('${encodeURI(url)}')` : '';
				}
			});
		}
	}

	class LicenseButton {
		static #options;
		static #buttonWrapper;
		static #button;
		static #cache = new main_core_cache.MemoryCache();
		static init(options) {
			this.#options = options;
			this.#buttonWrapper = document.querySelector('[data-id="licenseWidgetWrapper"]');
			this.#button = this.#buttonWrapper.querySelector('button');
			this.#setEventHandlers();
			if (this.#options.isCloud) {
				this.#setCounterValue(this.#options.personalTotalCount, this.#options.commonTotalCount, this.#options.counters.highlightIntegrator);
			}
			main_core.Event.bind(this.#buttonWrapper, 'click', () => {
				if (this.#options.isCloud) {
					LicenseButton.#sendAnalytics({
						tool: 'intranet',
						category: 'header_popup',
						event: 'show',
						c_section: 'top_menu'
					});
				}
				this.#openWidget();
			});
		}
		static #getExtensionWidgetName() {
			if (this.#options.isCloud) {
				return 'bitrix24.license-widget';
			}
			return 'intranet.license-widget';
		}
		static #openWidget() {
			main_core.Event.unbindAll(this.#button);
			this.#setAriaExpanded(true);
			this.#getWidgetLoader().createSkeletonFromConfig(this.#options.skeleton).show();
			main_core.Runtime.loadExtension([this.#getExtensionWidgetName()]).then(() => {
				this.#showWidget();
			}).catch(() => {});
		}
		static #showWidget() {
			this.#getContent().then(response => {
				this.#getWidgetLoader().clearBeforeInsertContent();
				let licenseData = null;
				if (this.#options.isCloud) {
					licenseData = {
						...response.data
					};
					licenseData.loader = this.#getWidgetLoader().getPopup();
					licenseData.wrapper = this.#buttonWrapper;
				} else {
					licenseData = {
						loader: this.#getWidgetLoader().getPopup(),
						buttonWrapper: this.#buttonWrapper,
						data: response.data
					};
				}
				this.#getWidget().setOptions(licenseData).show();
				this.#getWidgetLoader().getPopup().adjustPosition();
				main_core.Event.bind(this.#button, 'click', () => {
					this.#getWidget().show();
					if (this.#options.isCloud) {
						LicenseButton.#sendAnalytics({
							tool: 'intranet',
							category: 'header_popup',
							event: 'show',
							c_section: 'top_menu'
						});
					}
				});
				main_core_events.EventEmitter.emit(main_core_events.EventEmitter.GLOBAL_TARGET, 'BX.Bitrix24.LicenseWidget:firstShow');
			}).catch(() => {});
		}
		static #getWidget() {
			return this.#cache.remember('widget', () => {
				if (this.#options.isCloud) {
					return bitrix24_licenseWidget.LicenseWidget.getInstance();
				}
				return intranet_licenseWidget.LicenseWidget.getInstance();
			});
		}
		static #getWidgetLoader() {
			return this.#cache.remember('widgetLoader', () => {
				const loader = new intranet_widgetLoader.WidgetLoader({
					bindElement: this.#buttonWrapper,
					width: 385,
					id: 'bx-license-header-popup'
				});
				const popup = loader.getPopup();
				popup.subscribe('onShow', () => {
					this.#setAriaExpanded(true);
				});
				popup.subscribe('onClose', () => {
					this.#setAriaExpanded(false);
				});
				return loader;
			});
		}
		static #setAriaExpanded(expanded) {
			this.#button.setAttribute('aria-expanded', String(expanded));
		}
		static #getContent() {
			return this.#cache.remember('content', () => {
				return new Promise((resolve, reject) => {
					if (this.#options.isCloud) {
						main_core.ajax.runComponentAction('bitrix:bitrix24.license.widget', 'getData', {
							mode: 'class'
						}).then(response => resolve(response)).catch(response => reject(response));
					} else {
						main_core.ajax.runAction('intranet.license.widget.getContent').then(response => resolve(response)).catch(response => reject(response));
					}
				});
			});
		}
		static #getCounter() {
			return this.#cache.remember('counter', () => {
				return new ui_cnt.Counter({
					color: ui_cnt.CounterColor.DANGER,
					useAirDesign: true,
					style: ui_cnt.CounterStyle.FILLED_ALERT
				});
			});
		}
		static #getCounterWrapper() {
			return this.#cache.remember('counter-wrapper', () => {
				return this.#buttonWrapper.querySelector('.air-header-button__counter');
			});
		}
		static #setCounterValue(personalTotalCount, commonTotalCount, highlightIntegrator = 0) {
			const value = personalTotalCount + commonTotalCount + highlightIntegrator;
			if (value < 1) {
				this.#getCounter().destroy();
				this.#cache.delete('counter');
			}
			if (value > 0 && this.#getCounterWrapper()) {
				this.#getCounter().update(value);
				this.#getCounter().renderTo(this.#getCounterWrapper());
			}
		}
		static #setEventHandlers() {
			if (this.#options.isCloud && this.#options.isSidePanelDemoLicense) {
				BX.SidePanel.Instance.bindAnchors({
					rules: [{
						condition: [/\/settings\/license_demo.php/],
						handler(event) {
							ui_infoHelper.FeaturePromotersRegistry.getPromoter({
								code: 'limit_demo'
							}).show();
							event.stopPropagation();
							event.preventDefault();
						}
					}]
				});
			}
			if (this.#options.isCloud) {
				main_core_events.EventEmitter.subscribe(main_core_events.EventEmitter.GLOBAL_TARGET, 'BX.Intranet.LicenseButton:showWidget', event => {
					LicenseButton.#sendAnalytics({
						tool: 'intranet',
						category: 'header_popup',
						event: 'show',
						c_section: event.getData()?.c_section ?? 'search'
					});
					this.#openWidget();
				});
			}
			if (this.#options.isCloud) {
				pull_client.PULL.subscribe({
					moduleId: 'bitrix24',
					command: 'updateCountOrdersAwaitingPayment',
					callback: params => {
						this.#updateOptionsFromPull(params);
					}
				});
				main_core_events.EventEmitter.subscribe(main_core_events.EventEmitter.GLOBAL_TARGET, 'Bitrix24InfrastructureSlider:show', this.#showInfrastructureSlider.bind(this));
				main_core_events.EventEmitter.subscribe(main_core_events.EventEmitter.GLOBAL_TARGET, 'BX.Bitrix24.LicenseWidget.InviteHintPopup:show', this.#resetHighlightIntegrator.bind(this));
			}
		}
		static #resetHighlightIntegrator() {
			this.#options.counters.highlightIntegrator = 0;
			this.#setCounterValue(this.#options.personalTotalCount, this.#options.commonTotalCount, this.#options.counters.highlightIntegrator);
			BX.userOptions.save('bitrix24', 'isIntegratorHighlighted', null, 'Y');
		}
		static #updateOptionsFromPull(params) {
			if (!this.#options.isCloud) {
				return;
			}
			if (params.scope === 'common') {
				this.#options.commonTotalCount = params.commonTotalCount;
				if (params.commonTotalCount !== 0 && !main_core.Type.isNil(params.commonTotalCount)) {
					this.#options.ordersInfo = params.orders.ordersInfo;
					this.#options.counters.awaitingInvoice = params.orders.awaitingInvoice;
					this.#options.counters.awaitingPayment = params.orders.awaitingPayment;
					this.#options.counters.failedPayment = params.orders.failedPayment;
				}
				this.#setCounterValue(this.#options.personalTotalCount, params.commonTotalCount);
			} else if (params.scope === 'personal') {
				this.#options.personalTotalCount = params.personalTotalCount;
				if (params.personalTotalCount !== 0 && !main_core.Type.isNil(params.personalTotalCount)) {
					this.#options.ordersInfo.checkoutPath = params.orders.checkoutPath;
					this.#options.counters.inCheckout = params.orders.inCheckout;
				}
				this.#setCounterValue(params.personalTotalCount, this.#options.commonTotalCount);
			}
			this.#emitOrdersUpdate();
		}
		static #emitOrdersUpdate() {
			main_core_events.EventEmitter.emit('BX.Bitrix24.Orders:updateOrdersAwaitingPayment', new main_core_events.BaseEvent({
				data: {
					orders: {
						counters: this.#options.counters,
						ordersInfo: this.#options.ordersInfo
					},
					commonTotalCount: this.#options.commonTotalCount,
					personalTotalCount: this.#options.personalTotalCount
				}
			}));
		}
		static #showInfrastructureSlider() {
			const params = this.#options.infrastructureForm;
			BX.SidePanel.Instance.open('bx-infrastructure-slider', {
				contentCallback: () => {
					return `<script data-b24-form="inline/${params.id}/${params.secCode}" data-skip-moving="true"></script>`;
				},
				width: 664,
				loader: 'default-loader',
				cacheable: false,
				closeByEsc: false,
				data: {
					rightBoundary: 0
				},
				events: {
					onOpen: () => {
						(function (w, d, u) {
							const s = d.createElement('script');
							s.async = true;
							s.src = `${u}?${Date.now() / 180_000 | 0}`;
							const h = d.getElementsByTagName('script')[0];
							h.parentNode.insertBefore(s, h);
						})(window, document, `https://bitrix24.team/upload/crm/form/loader_${params.id}_${params.secCode}.js`);
					},
					onOpenComplete: () => {
						top.addEventListener('b24:form:send:success', event => {
							if (event.detail.object.identification.id === params.id) {
								main_core.ajax.runComponentAction('bitrix:bitrix24.license.widget', 'setOptionWaitingInfrastructure', {
									mode: 'class',
									data: {}
								});
							}
						});
					}
				}
			});
		}
		static #sendAnalytics(params) {
			// eslint-disable-next-line promise/catch-or-return
			main_core.Runtime.loadExtension('ui.analytics').then(({
				sendData
			}) => {
				sendData(params);
			});
		}
	}

	class InvitationButton {
		static #buttonWrapper;
		static #button;
		static #cache = new main_core_cache.MemoryCache();
		static #options;
		static init(options) {
			this.#options = options;
			this.#buttonWrapper = document.querySelector('[data-id="invitationButton"]');
			this.#button = this.#buttonWrapper.querySelector('button');
			main_core.Event.bind(this.#button, 'click', () => {
				main_core.Event.unbindAll(this.#button);
				this.#setAriaExpanded(true);
				this.#getWidgetLoader().createSkeletonFromConfig(options.skeleton).show();
				main_core.Runtime.loadExtension(['intranet.invitation-widget']).then(() => {
					this.#showWidget();
				}).catch(() => {});
			});
			if (this.#options.invitationCounter > 0) {
				this.#getCounter().renderTo(this.#getCounterWrapper());
			}
			this.#setEventHandlers();
		}
		static #showWidget() {
			this.#getContent().then(response => {
				this.#getWidgetLoader().clearBeforeInsertContent();
				intranet_invitationWidget.InvitationWidget.getInstance().setOptions({
					buttonWrapper: this.#buttonWrapper,
					loader: this.#getWidgetLoader().getPopup(),
					...response.data
				}).show();
				main_core.Event.bind(this.#button, 'click', () => {
					intranet_invitationWidget.InvitationWidget.getInstance().show();
				});
			}).catch(() => {});
		}
		static #getWidgetLoader() {
			return this.#cache.remember('widgetLoader', () => {
				const loader = new intranet_widgetLoader.WidgetLoader({
					bindElement: this.#buttonWrapper,
					width: 350,
					id: 'bx-invitation-header-popup'
				});
				const popup = loader.getPopup();
				popup.subscribe('onShow', () => {
					this.#setAriaExpanded(true);
				});
				popup.subscribe('onClose', () => {
					this.#setAriaExpanded(false);
				});
				return loader;
			});
		}
		static #setAriaExpanded(expanded) {
			main_core.Dom.attr(this.#button, 'aria-expanded', expanded);
		}
		static #getContent() {
			return this.#cache.remember('content', () => {
				return new Promise((resolve, reject) => {
					main_core.ajax.runAction('intranet.invitationwidget.getData', {
						data: {},
						analyticsLabel: {
							headerPopup: 'Y'
						}
					}).then(response => resolve(response)).catch(response => reject(response));
				});
			});
		}
		static #setEventHandlers() {
			main_core_events.EventEmitter.subscribeOnce('HR.company-structure:first-popup-showed', this.#onFirstWatchNewStructure.bind(this));
			main_core_events.EventEmitter.subscribe('onPullEvent-main', event => {
				const [command, params] = event.getCompatData();
				if (command === 'user_counter' && params[main_core.Loc.getMessage('SITE_ID')]) {
					const value = params[main_core.Loc.getMessage('SITE_ID')][this.#options.counterId];
					if (value > 0) {
						this.#onReceiveCounterValue(value);
					}
				}
			});
		}
		static #onReceiveCounterValue(value) {
			if (this.#options.shouldShowStructureCounter) {
				value++;
			}
			this.#getCounter().update(value);
			this.#options.invitationCounter = value;
			if (value > 0) {
				this.#getCounter().renderTo(this.#getCounterWrapper());
			} else {
				this.#getCounter().destroy();
				this.#cache.delete('counter');
			}
		}
		static #getCounterWrapper() {
			return this.#cache.remember('counter-wrapper', () => {
				return this.#buttonWrapper.querySelector('.invitation-widget-counter');
			});
		}
		static #getCounter() {
			return this.#cache.remember('counter', () => {
				return new ui_cnt.Counter({
					value: this.#getCounterValue(),
					color: ui_cnt.Counter.Color.DANGER,
					useAirDesign: true,
					style: ui_cnt.CounterStyle.FILLED_ALERT
				});
			});
		}
		static #getCounterValue() {
			let counterValue = Number(this.#options.invitationCounter);
			if (this.#options.shouldShowStructureCounter ?? false) {
				counterValue++;
			}
			return counterValue;
		}
		static #onFirstWatchNewStructure() {
			let value = this.#getCounter().value;
			if (!main_core.Type.isNumber(value)) {
				return;
			}
			if (!this.#options.shouldShowStructureCounter) {
				return;
			}
			value--;
			this.#options.shouldShowStructureCounter = false;
			this.#getCounter().update(value);
			this.#options.invitationCounter = value;
			if (value > 0) {
				this.#getCounter().renderTo(this.#getCounterWrapper());
			} else {
				this.#getCounter().destroy();
				this.#cache.delete('counter');
			}
		}
	}

	class LanguageSwitcher {
		#popup;
		async showLanguageListPopup(bindElement, languages) {
			if (!this.#popup) {
				await this.#initPopup(bindElement, languages);
			}
			if (this.#popup.isShown()) {
				return;
			}
			this.#popup.show();
		}
		async #initPopup(bindElement, languages) {
			const windowScrollHandler = () => {
				this.hideLanguageListPopup();
			};
			const {
				Popup
			} = await main_core.Runtime.loadExtension('main.popup');
			const popupOptions = {
				bindElement,
				autoHide: true,
				closeByEcs: true,
				cachable: false,
				content: this.#renderPopupContent(languages),
				events: {
					onPopupClose: () => {
						main_core.Event.unbind(window, 'scroll', windowScrollHandler);
						this.#popup.destroy();
						this.#popup = null;
					}
				}
			};
			this.#popup = new Popup(popupOptions);
			main_core.Event.bind(window, 'scroll', windowScrollHandler);
		}
		hideLanguageListPopup() {
			this.#popup?.close();
		}
		switchPortalLanguage(languageCode) {
			window.location.href = `/auth/?user_lang=${languageCode}&backurl=${getBackUrl()}`;
		}
		#renderPopupContent(languages) {
			const container = main_core.Tag.render`<div class="intranet__language-popup_list"></div>`;
			Object.entries(languages).forEach(([languageCode, languageItem]) => {
				const languageItemElement = main_core.Tag.render`
				<div class="intranet__language-popup_language-item">
					<span class="intranet__language-popup_language-item-name">${languageItem.NAME}</span>
					<span class="intranet__language-popup_language-beta">${languageItem.IS_BETA ? ', beta' : ''}</span>
				</div>
			`;
				main_core.Event.bind(languageItemElement, 'click', () => {
					this.switchPortalLanguage(languageCode);
				});
				main_core.Dom.append(languageItemElement, container);
			});
			return container;
		}
	}
	const languageSwitcher = new LanguageSwitcher();

	const Template = new SiteTemplate();

	// Compatibility
	/**
	 * @deprecated
	 */
	window.showPartnerForm = showPartnerConnectForm;

	/**
	 * @deprecated
	 */
	window.B24 = {
		/**
		 * @deprecated
		 */
		licenseInfoPopup: {
			show(popupId, title, content, showDemoButton) {
				const LicenseInfoPopup = main_core.Reflection.getClass('BX.Bitrix24.LicenseInfoPopup');
				if (LicenseInfoPopup) {
					LicenseInfoPopup.show(popupId, title, content, showDemoButton);
				}
			}
		},
		/**
		 * @deprecated
		 */
		updateCounters(counters, send) {
			const LeftMenu = main_core.Reflection.getClass('BX.Intranet.LeftMenu');
			if (LeftMenu) {
				LeftMenu.updateCounters(counters, send);
			}
		}
	};

	exports.AvatarButton = AvatarButton;
	exports.InvitationButton = InvitationButton;
	exports.LicenseButton = LicenseButton;
	exports.PartnerForm = PartnerForm;
	exports.SearchTitle = SearchTitle;
	exports.Template = Template;
	exports.languageSwitcher = languageSwitcher;

})(this.BX.Intranet.Bitrix24 = this.BX.Intranet.Bitrix24 || {}, BX, BX.Main, BX.UI, BX.Event, BX.Cache, BX, BX.UI, BX.UI.IconSet, BX, BX.SidePanel, BX.Intranet, BX.Intranet, BX.Intranet, BX.Timeman, BX.UI, BX.Bitrix24, BX.Intranet, BX.Intranet);
//# sourceMappingURL=bitrix24.bundle.js.map
