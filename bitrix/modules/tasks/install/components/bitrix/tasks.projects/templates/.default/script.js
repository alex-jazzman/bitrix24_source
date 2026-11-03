/* eslint-disable */
this.BX = this.BX || {};
this.BX.Tasks = this.BX.Tasks || {};
(function (exports, pull_client, main_core, main_core_events, ui_a11y, main_loader, main_popup, ui_tour) {
	'use strict';

	/**
	 * @memberOf BX.Grid
	 */
	class CellActionState {
		static SHOW_BY_HOVER = 'main-grid-cell-content-action-by-hover';
		static ACTIVE = 'main-grid-cell-content-action-active';
	}
	const namespace = main_core.Reflection.namespace('BX.Grid');
	namespace.CellActionState = CellActionState;

	class ActionsController {
		static setOptions(options) {
			ActionsController.options = options;
		}
		static setActionsPanel(actionsPanel) {
			ActionsController.actionsPanel = actionsPanel;
		}
		static announce(messageCode, politeness = 'polite', useScrumVariant = false) {
			const prefix = useScrumVariant && ActionsController.options.isScrumList === 'Y' ? 'TASKS_PROJECTS_SCRUM_A11Y_' : 'TASKS_PROJECTS_A11Y_';
			const message = main_core.Loc.getMessage(`${prefix}${messageCode}`);
			if (message) {
				ui_a11y.LiveAnnouncer.announce(message, politeness);
			}
		}
		static announceRequestResult(result, successMessageCode, errorMessageCode, useScrumVariant = false) {
			const isSuccess = result?.MESSAGE === 'SUCCESS';
			ActionsController.announce(isSuccess ? successMessageCode : errorMessageCode, isSuccess ? 'polite' : 'assertive', useScrumVariant);
		}
		static doAction(action, groupId, data = [], announceResult = true) {
			return new Promise((resolve, reject) => {
				let isSettled = false;
				const settle = isSuccess => {
					if (isSettled) {
						return;
					}
					isSettled = true;
					if (isSuccess) {
						resolve();
					} else {
						reject();
					}
					if (announceResult && (action === 'pin' || action === 'unpin')) {
						ActionsController.announce(`${action.toUpperCase()}_${isSuccess ? 'SUCCESS' : 'ERROR'}`, isSuccess ? 'polite' : 'assertive', true);
					}
				};
				BX.ajax.runComponentAction('bitrix:tasks.projects', 'processAction', {
					mode: 'class',
					data: {
						action,
						data,
						ids: ActionsController.getActionIds(groupId) || []
					},
					signedParameters: ActionsController.options.signedParameters
				}).then(() => settle(true), () => settle(false)).catch(() => settle(false));
				ActionsController.hideActionsPanel();
				ActionsController.unselectRows();
			});
		}
		static getActionIds(id) {
			if (id !== undefined) {
				return [id];
			}
			const selected = ActionsController.getSelectedRows();
			if (selected.length === 0) {
				return [];
			}
			return selected.map(row => {
				return row.getDataset().id;
			});
		}
		static getSelectedRows() {
			return ActionsController.getGridInstance().getRows().getSelected();
		}
		static sendJoinRequest(button) {
			if (main_core.Dom.hasClass(button, 'ui-btn-clock')) {
				return;
			}
			main_core.Dom.addClass(button, 'ui-btn-clock');
			BX.ajax({
				url: button.getAttribute('bx-request-url'),
				method: 'POST',
				dataType: 'json',
				data: {
					ajax_request: 'Y',
					save: 'Y',
					sessid: BX.bitrix_sessid()
				},
				onsuccess: result => {
					main_core.Dom.removeClass(button, 'ui-btn-clock');
					ActionsController.announceRequestResult(result, 'JOIN_SUCCESS', 'JOIN_ERROR', true);
				},
				onfailure: () => {
					main_core.Dom.removeClass(button, 'ui-btn-clock');
					ActionsController.announce('JOIN_ERROR', 'assertive', true);
				}
			});
			ActionsController.hideActionsPanel();
			ActionsController.unselectRows();
		}
		static sendAcceptRequest(userGroupRelationId, url) {
			BX.ajax({
				url: url,
				method: 'POST',
				dataType: 'json',
				data: {
					action: 'accept',
					max_count: 1,
					checked_0: 'Y',
					type_0: 'INVITE_GROUP',
					id_0: userGroupRelationId,
					type: 'in',
					ajax_request: 'Y',
					sessid: BX.bitrix_sessid()
				},
				onsuccess: result => {
					ActionsController.announceRequestResult(result, 'INVITATION_ACCEPT_SUCCESS', 'INVITATION_ACCEPT_ERROR');
				},
				onfailure: () => ActionsController.announce('INVITATION_ACCEPT_ERROR', 'assertive')
			});
			ActionsController.hideActionsPanel();
			ActionsController.unselectRows();
		}
		static sendDenyRequest(userGroupRelationId, url) {
			ActionsController.sendCancelRequest(userGroupRelationId, url, true);
		}
		static sendCancelRequest(userGroupRelationId, url, isInvitationDeny = false) {
			const successMessageCode = isInvitationDeny ? 'INVITATION_DENY_SUCCESS' : 'REQUEST_CANCEL_SUCCESS';
			const errorMessageCode = isInvitationDeny ? 'INVITATION_DENY_ERROR' : 'REQUEST_CANCEL_ERROR';
			BX.ajax({
				url: url,
				method: 'POST',
				dataType: 'json',
				data: {
					action: 'reject',
					max_count: 1,
					checked_0: 'Y',
					type_0: 'INVITE_GROUP',
					id_0: userGroupRelationId,
					type: 'out',
					ajax_request: 'Y',
					sessid: BX.bitrix_sessid()
				},
				onsuccess: result => {
					ActionsController.announceRequestResult(result, successMessageCode, errorMessageCode);
				},
				onfailure: () => ActionsController.announce(errorMessageCode, 'assertive')
			});
			ActionsController.hideActionsPanel();
			ActionsController.unselectRows();
		}
		static hideActionsPanel() {
			ActionsController.options.actionsPanel.hidePanel();
		}
		static unselectRows() {
			ActionsController.getGridInstance().getRows().unselectAll();
		}
		static getGridInstance() {
			return BX.Main.gridManager.getById(ActionsController.options.gridId).instance;
		}
		static onPinKeyDown(groupId, event, keyboardEvent) {
			const {
				button
			} = event.getData();
			if (keyboardEvent.target !== keyboardEvent.currentTarget || keyboardEvent.currentTarget !== button || keyboardEvent.repeat || keyboardEvent.key !== 'Enter' && keyboardEvent.key !== ' ') {
				return;
			}
			keyboardEvent.preventDefault();
			keyboardEvent.stopPropagation();
			void ActionsController.changePin(groupId, event);
		}
		static async changePin(groupId, event) {
			const {
				button
			} = event.getData();
			if (button.dataset.pinPending === 'true') {
				return;
			}
			const isPinned = main_core.Dom.hasClass(button, CellActionState.ACTIVE);
			const action = isPinned ? 'unpin' : 'pin';
			button.dataset.pinPending = 'true';
			try {
				await ActionsController.doAction(action, groupId, [], false);
				ActionsController.updatePinState(button, !isPinned);
				ActionsController.announce(`${action.toUpperCase()}_SUCCESS`, 'polite', true);
			} catch {
				ActionsController.announce(`${action.toUpperCase()}_ERROR`, 'assertive', true);
				return;
			} finally {
				delete button.dataset.pinPending;
			}
		}
		static updatePinState(button, isPinned) {
			if (isPinned) {
				main_core.Dom.addClass(button, CellActionState.ACTIVE);
				main_core.Dom.removeClass(button, CellActionState.SHOW_BY_HOVER);
			} else {
				main_core.Dom.removeClass(button, CellActionState.ACTIVE);
				main_core.Dom.addClass(button, CellActionState.SHOW_BY_HOVER);
			}
			button.setAttribute('aria-pressed', isPinned ? 'true' : 'false');
			button.setAttribute('aria-label', isPinned ? button.dataset.unpinLabel : button.dataset.pinLabel);
		}
		static onTagClick(field) {
			const {
				filter
			} = ActionsController.options;
			filter.toggleByField(field);
		}
		static onTagAddClick(groupId, event) {
			main_core.Runtime.loadExtension('ui.entity-selector').then(exports => {
				const onRowUpdate = event => {
					const {
						id
					} = event.getData();
					if (id === groupId) {
						const row = ActionsController.getGridInstance().getRows().getById(id);
						const button = row.getCellById('TAGS').querySelector('.main-grid-tag-add');
						dialog.setTargetNode(button);
					}
				};
				const onRowRemove = event => {
					const {
						id
					} = event.getData();
					if (id === groupId) {
						dialog.hide();
					}
				};
				const onTagsChange = event => {
					const dialog = event.getTarget();
					const tags = dialog.getSelectedItems().map(item => item.getId());
					void ActionsController.doAction('update', groupId, {
						KEYWORDS: tags.join(',')
					});
				};
				const {
					Dialog
				} = exports;
				const dialog = new Dialog({
					targetNode: event.getData().button,
					enableSearch: true,
					width: 350,
					height: 400,
					multiple: true,
					dropdownMode: true,
					compactView: true,
					context: 'PROJECT_TAG',
					entities: [{
						id: 'project-tag',
						options: {
							groupId
						}
					}],
					searchOptions: {
						allowCreateItem: true,
						footerOptions: {
							label: main_core.Loc.getMessage('TASKS_PROJECTS_ENTITY_SELECTOR_TAG_SEARCH_FOOTER_ADD')
						}
					},
					footer: BX.SocialNetwork.EntitySelector.Footer,
					footerOptions: {
						tagCreationLabel: true
					},
					events: {
						'onShow': () => {
							main_core_events.EventEmitter.subscribe('Tasks.Projects.Grid:RowUpdate', onRowUpdate);
							main_core_events.EventEmitter.subscribe('Tasks.Projects.Grid:RowRemove', onRowRemove);
						},
						'onHide': () => {
							main_core_events.EventEmitter.unsubscribe('Tasks.Projects.Grid:RowUpdate', onRowUpdate);
							main_core_events.EventEmitter.unsubscribe('Tasks.Projects.Grid:RowRemove', onRowRemove);
						},
						'Search:onItemCreateAsync': event => {
							return new Promise(resolve => {
								const {
									searchQuery
								} = event.getData();
								const name = searchQuery.getQuery().toLowerCase();
								const dialog = event.getTarget();
								setTimeout(() => {
									const item = dialog.addItem({
										id: name,
										entityId: 'project-tag',
										title: name,
										tabs: 'all'
									});
									if (item) {
										item.select();
									}
									resolve();
								}, 1000);
							});
						},
						'Item:onSelect': onTagsChange,
						'Item:onDeselect': onTagsChange
					}
				});
				dialog.show();
			});
		}
	}

	class Filter {
		constructor(options) {
			this.filter = BX.Main.filterManager.getById(options.filterId);
			this.init();
			this.bindEvents();
		}
		init() {
			this.updateFields();
		}
		bindEvents() {
			main_core_events.EventEmitter.subscribe('BX.Main.Filter:apply', this.onFilterApply.bind(this));
			main_core_events.EventEmitter.subscribe('Tasks.Toolbar:onItem', this.onCounterClick.bind(this));
		}
		onFilterApply() {
			this.updateFields();
		}
		updateFields() {
			this.fields = this.filter.getFilterFieldsValues();
		}
		onCounterClick(event) {
			const data = event.getData();
			if (data.counter && data.counter.filter) {
				this.toggleByField({
					[data.counter.filterField]: data.counter.filterValue
				});
			}
		}
		isFilteredByField(field) {
			if (!Object.keys(this.fields).includes(field)) {
				return false;
			}
			if (main_core.Type.isArray(this.fields[field])) {
				return this.fields[field].length > 0;
			}
			return this.fields[field] !== '';
		}
		isFilteredByFieldValue(field, value) {
			return this.isFilteredByField(field) && this.fields[field] === value;
		}
		toggleByField(field) {
			const name = Object.keys(field)[0];
			const value = field[name];
			if (!this.isFilteredByFieldValue(name, value)) {
				this.filter.getApi().extendFilter({
					[name]: value
				});
				return;
			}
			this.filter.getFilterFields().forEach(field => {
				if (field.getAttribute('data-name') === name) {
					this.filter.getFields().deleteField(field);
				}
			});
			this.filter.getSearch().apply();
		}
	}

	class MembersPopup {
		constructor(options) {
			this.signedParameters = options.signedParameters;
			this.popupVersion = 0;
			this.scrollHandlers = new WeakMap();
		}
		show(groupId, bindNode, type = 'all') {
			const shouldFocusCurrentType = main_core.Type.isElementNode(bindNode) && bindNode.ownerDocument.activeElement === bindNode && bindNode.matches(':focus-visible');
			if (this.popup && !this.popup.isDestroyed()) {
				this.popup.getFocusTrap()?.setRestoreFocus(false);
				this.popup.destroy();
			}
			this.groupId = groupId;
			this.popupVersion++;
			this.resetPopupData();
			this.changeType(type, false);
			const popupData = this.popupData;
			const popup = main_popup.PopupWindowManager.create({
				id: 'projects-members-popup-menu',
				className: 'tasks-projects-members-popup',
				bindElement: bindNode,
				autoHide: true,
				closeByEsc: true,
				ariaLabel: this.getPopupAriaLabel(),
				focusTrap: {
					initialFocus: false
				},
				lightShadow: true,
				bindOptions: {
					position: 'bottom'
				},
				animationOptions: {
					show: {
						type: 'opacity-transform'
					},
					close: {
						type: 'opacity'
					}
				},
				events: {
					onPopupDestroy: () => {
						this.unbindPopupScrolls(popupData);
						if (this.popup === popup) {
							this.popupVersion++;
							this.loader = null;
							this.isPopupShown = false;
							this.popup = null;
						}
					},
					onPopupClose: () => {
						this.configureFocusRestore(popup, bindNode);
						popup.destroy();
					},
					onAfterPopupShow: () => {
						popup.contentContainer.appendChild(this.renderContainer());
						this.showLoader();
						this.showUsers(groupId, type);
						this.isPopupShown = true;
						if (shouldFocusCurrentType) {
							this.getCurrentPopupData().tab.focus();
						}
					}
				}
			});
			this.popup = popup;
			this.popupScroll(groupId, type);
			popup.show();
		}
		configureFocusRestore(popup, bindNode) {
			const focusTrap = popup.getFocusTrap();
			if (!focusTrap) {
				return;
			}
			const popupContainer = popup.getPopupContainer();
			const ownerDocument = popupContainer.ownerDocument;
			const activeElement = ownerDocument.activeElement;
			const shouldRestoreFocus = main_core.Type.isElementNode(bindNode) && bindNode.isConnected && bindNode.ownerDocument === ownerDocument && (activeElement === ownerDocument.body || popupContainer.contains(activeElement));
			focusTrap.setRestoreFocus(shouldRestoreFocus ? bindNode : false);
		}
		getPopupAriaLabel() {
			return main_core.Loc.getMessage('TASKS_PROJECTS_MEMBERS_POPUP_ARIA_LABEL');
		}
		renderContainer() {
			return main_core.Tag.render`
			<div class="tasks-projects-members-popup-container">
				<div class="tasks-projects-members-popup-head">
					${this.popupData.all.tab}
					${this.popupData.heads.tab}
					${this.popupData.members.tab}
				</div>
				<div class="tasks-projects-members-popup-body">
					<div class="tasks-projects-members-popup-content">
						<div class="tasks-projects-members-popup-content-box">
							${this.getCurrentPopupData().innerContainer}
						</div>
					</div>
				</div>
			</div>
		`;
		}
		popupScroll(groupId, type) {
			const popupData = this.popupData[type];
			if (!main_core.Type.isDomNode(popupData?.innerContainer) || !popupData.hasMore || this.scrollHandlers.has(popupData.innerContainer)) {
				return;
			}
			const scrollHandler = event => {
				const area = event.target;
				if (area.scrollTop > (area.scrollHeight - area.offsetHeight) / 1.5) {
					this.unbindPopupScroll(popupData);
					this.showUsers(groupId, type);
				}
			};
			this.scrollHandlers.set(popupData.innerContainer, scrollHandler);
			main_core.Event.bind(popupData.innerContainer, 'scroll', scrollHandler);
		}
		unbindPopupScroll(popupData) {
			const scrollHandler = this.scrollHandlers.get(popupData?.innerContainer);
			if (!scrollHandler) {
				return;
			}
			main_core.Event.unbind(popupData.innerContainer, 'scroll', scrollHandler);
			this.scrollHandlers.delete(popupData.innerContainer);
		}
		unbindPopupScrolls(popupData) {
			Object.values(popupData).forEach(item => this.unbindPopupScroll(item));
		}
		showUsers(groupId, type) {
			const popupData = this.popupData[type];
			if (!popupData || !popupData.hasMore || popupData.isLoading || this.groupId !== groupId || this.currentType !== type) {
				return null;
			}
			popupData.isLoading = true;
			const popupVersion = this.popupVersion;
			return BX.ajax.runComponentAction('bitrix:tasks.projects', 'getPopupMembers', {
				mode: 'class',
				data: {
					groupId,
					type,
					page: popupData.currentPage
				},
				signedParameters: this.signedParameters
			}).then(response => {
				popupData.isLoading = false;
				if (this.popupVersion !== popupVersion || this.groupId !== groupId || this.currentType !== type) {
					return;
				}
				if (response.data.length > 0) {
					this.renderUsers(response.data);
					this.popupScroll(groupId, this.currentType);
				} else {
					popupData.hasMore = false;
					this.unbindPopupScroll(popupData);
					if (!this.getCurrentPopupData().innerContainer.hasChildNodes()) {
						this.getCurrentPopupData().innerContainer.innerText = main_core.Loc.getMessage('TASKS_PROJECTS_MEMBERS_POPUP_EMPTY');
					}
				}
				popupData.currentPage++;
				this.hideLoader();
			}, () => {
				popupData.isLoading = false;
				if (this.popupVersion === popupVersion && this.groupId === groupId && this.currentType === type) {
					this.hideLoader();
					this.popupScroll(groupId, type);
				}
			});
		}
		renderUsers(users) {
			Object.values(users).forEach(user => {
				if (this.getCurrentPopupData().renderedUsers.indexOf(user.ID) >= 0) {
					return;
				}
				this.getCurrentPopupData().renderedUsers.push(user.ID);
				this.getCurrentPopupData().innerContainer.appendChild(main_core.Tag.render`
					<a class="tasks-projects-members-popup-item" href="${user['HREF']}" target="_blank">
						<div class="tasks-projects-members-popup-avatar-new">
							${this.getAvatar(user)}
							<span class="tasks-projects-members-popup-avatar-status-icon"></span>
						</div>
						<span class="tasks-projects-members-popup-name">${user['FORMATTED_NAME']}</span>
					</a>
				`);
			});
		}
		getAvatar(user) {
			if (main_core.Type.isStringFilled(user['PHOTO'])) {
				return main_core.Tag.render`
				<div class="ui-icon ui-icon-common-user tasks-projects-members-popup-avatar-img">
					<i style="background-image: url('${encodeURI(user['PHOTO'])}')"></i>
				</div>
			`;
			}
			return main_core.Tag.render`
			<div class="ui-icon ui-icon-common-user tasks-projects-members-popup-avatar-img"><i></i></div>
		`;
		}
		showLoader() {
			if (!this.loader) {
				this.loader = new main_loader.Loader({
					target: this.popup.getPopupContainer().querySelector('.tasks-projects-members-popup-content'),
					size: 40
				});
			}
			void this.loader.show();
		}
		hideLoader() {
			if (this.loader) {
				void this.loader.hide();
				this.loader = null;
			}
		}
		changeType(newType, loadUsers = true) {
			const oldType = this.currentType;
			this.currentType = newType;
			Object.values(this.popupData).forEach(item => {
				main_core.Dom.removeClass(item.tab, 'tasks-projects-members-popup-head-item-current');
				main_core.Dom.attr(item.tab, 'aria-pressed', 'false');
			});
			main_core.Dom.addClass(this.getCurrentPopupData().tab, 'tasks-projects-members-popup-head-item-current');
			main_core.Dom.attr(this.getCurrentPopupData().tab, 'aria-pressed', 'true');
			if (oldType && oldType !== newType) {
				main_core.Dom.replace(this.popupData[oldType].innerContainer, this.getCurrentPopupData().innerContainer);
			}
			if (loadUsers && oldType !== newType) {
				if (this.getCurrentPopupData().currentPage === 1) {
					this.showLoader();
					this.showUsers(this.groupId, newType);
				} else {
					this.hideLoader();
					this.popupScroll(this.groupId, newType);
				}
			}
		}
		renderTypeButton(type, messageCode) {
			return main_core.Tag.render`
			<button
				type="button"
				class="tasks-projects-members-popup-head-item"
				aria-pressed="false"
				onclick="${this.changeType.bind(this, type)}"
			>
				<span class="tasks-projects-members-popup-head-text">${main_core.Loc.getMessage(messageCode)}</span>
			</button>
		`;
		}
		resetPopupData() {
			this.popupData = {
				all: {
					currentPage: 1,
					hasMore: true,
					isLoading: false,
					renderedUsers: [],
					tab: this.renderTypeButton('all', 'TASKS_PROJECTS_MEMBERS_POPUP_TITLE_ALL'),
					innerContainer: main_core.Tag.render`<div class="tasks-projects-members-popup-inner"></div>`
				},
				heads: {
					currentPage: 1,
					hasMore: true,
					isLoading: false,
					renderedUsers: [],
					tab: this.renderTypeButton('heads', 'TASKS_PROJECTS_MEMBERS_POPUP_TITLE_HEADS'),
					innerContainer: main_core.Tag.render`<div class="tasks-projects-members-popup-inner"></div>`
				},
				members: {
					currentPage: 1,
					hasMore: true,
					isLoading: false,
					renderedUsers: [],
					tab: this.renderTypeButton('members', 'TASKS_PROJECTS_MEMBERS_POPUP_TITLE_MEMBERS'),
					innerContainer: main_core.Tag.render`<div class="tasks-projects-members-popup-inner"></div>`
				}
			};
		}
		getCurrentPopupData() {
			return this.popupData[this.currentType];
		}
	}

	class ScrumMembersPopup extends MembersPopup {
		getPopupAriaLabel() {
			return main_core.Loc.getMessage('TASKS_PROJECTS_SCRUM_MEMBERS_POPUP_ARIA_LABEL');
		}
		renderContainer() {
			return main_core.Tag.render`
			<div class="tasks-projects-members-popup-container">
				<div class="tasks-projects-members-popup-head">
					${this.popupData.all.tab}
					${this.popupData.scrumTeam.tab}
					${this.popupData.members.tab}
				</div>
				<div class="tasks-projects-members-popup-body">
					<div class="tasks-projects-members-popup-content">
						<div class="tasks-projects-members-popup-content-box">
							${this.getCurrentPopupData().innerContainer}
						</div>
					</div>
				</div>
			</div>
		`;
		}
		resetPopupData() {
			this.popupData = {
				all: {
					currentPage: 1,
					hasMore: true,
					isLoading: false,
					renderedUsers: [],
					tab: this.renderTypeButton('all', 'TASKS_PROJECTS_MEMBERS_POPUP_TITLE_ALL'),
					innerContainer: main_core.Tag.render`<div class="tasks-projects-members-popup-inner"></div>`
				},
				scrumTeam: {
					currentPage: 1,
					hasMore: true,
					isLoading: false,
					renderedUsers: [],
					tab: this.renderTypeButton('scrumTeam', 'TASKS_PROJECTS_MEMBERS_POPUP_TITLE_SCRUM_TEAM'),
					innerContainer: main_core.Tag.render`<div class="tasks-projects-members-popup-inner"></div>`
				},
				members: {
					currentPage: 1,
					hasMore: true,
					isLoading: false,
					renderedUsers: [],
					tab: this.renderTypeButton('members', 'TASKS_PROJECTS_MEMBERS_POPUP_TITLE_SCRUM_MEMBERS'),
					innerContainer: main_core.Tag.render`<div class="tasks-projects-members-popup-inner"></div>`
				}
			};
		}
		renderUsers(users) {
			if (this.currentType === 'scrumTeam') {
				this.renderLabels(users);
				Object.values(users).forEach(user => {
					if (this.getCurrentPopupData().renderedUsers.indexOf(user.ID) >= 0 && user.ROLE !== 'M') {
						return;
					}
					this.getCurrentPopupData().renderedUsers.push(user.ID);
					const containersMap = new Map();
					containersMap.set('A', 'tasks-scrum-members-popup-owner-container');
					containersMap.set('M', 'tasks-scrum-members-popup-master-container');
					containersMap.set('E', 'tasks-scrum-members-popup-team-container');
					if (main_core.Type.isUndefined(containersMap.get(user.ROLE))) {
						return;
					}
					this.getCurrentPopupData().innerContainer.querySelector('.' + containersMap.get(user.ROLE)).appendChild(main_core.Tag.render`
							<a class="tasks-projects-members-popup-item" href="${user['HREF']}" target="_blank">
								<div class="tasks-projects-members-popup-avatar-new">
									${this.getAvatar(user)}
									<span class="tasks-projects-members-popup-avatar-status-icon"></span>
								</div>
								<span class="tasks-scrum-members-popup-name">${user['FORMATTED_NAME']}</span>
							</a>
						`);
				});
			} else {
				Object.values(users).forEach(user => {
					if (this.getCurrentPopupData().renderedUsers.indexOf(user.ID) >= 0) {
						return;
					}
					this.getCurrentPopupData().renderedUsers.push(user.ID);
					this.getCurrentPopupData().innerContainer.appendChild(main_core.Tag.render`
					<a class="tasks-projects-members-popup-item" href="${user['HREF']}" target="_blank">
						<div class="tasks-projects-members-popup-avatar-new">
							${this.getAvatar(user)}
							<span class="tasks-projects-members-popup-avatar-status-icon"></span>
						</div>
						<span class="tasks-scrum-members-popup-name">${user['FORMATTED_NAME']}</span>
					</a>
				`);
				});
			}
		}
		renderLabels(users) {
			const hasOwner = users.find(user => user.ROLE === 'A');
			const hasMaster = users.find(user => user.ROLE === 'M');
			const hasTeam = users.find(user => user.ROLE === 'E');
			if (hasOwner) {
				this.getCurrentPopupData().innerContainer.appendChild(main_core.Tag.render`
					<div class="tasks-scrum-members-popup-owner-container">
						<span class="tasks-scrum-members-popup-label">
							<span class="tasks-scrum-members-popup-label-text">
								${main_core.Loc.getMessage('TASKS_PROJECTS_MEMBERS_POPUP_LABEL_SCRUM_OWNER')}
							</span>
						</span>
					</div>
				`);
			}
			if (hasMaster) {
				this.getCurrentPopupData().innerContainer.appendChild(main_core.Tag.render`
					<div class="tasks-scrum-members-popup-master-container">
						<span class="tasks-scrum-members-popup-label">
							<span class="tasks-scrum-members-popup-label-text">
								${main_core.Loc.getMessage('TASKS_PROJECTS_MEMBERS_POPUP_LABEL_SCRUM_MASTER')}
							</span>
						</span>
					</div>
				`);
			}
			if (hasTeam) {
				this.getCurrentPopupData().innerContainer.appendChild(main_core.Tag.render`
					<div class="tasks-scrum-members-popup-team-container">
						<span class="tasks-scrum-members-popup-label">
							<span class="tasks-scrum-members-popup-label-text">
								${main_core.Loc.getMessage('TASKS_PROJECTS_MEMBERS_POPUP_LABEL_SCRUM_TEAM')}
							</span>
						</span>
					</div>
				`);
			}
		}
	}

	class Grid {
		static get classes() {
			return {
				highlighted: 'task-projects-item-highlighted',
				pinned: 'tasks-projects-row-pinned'
			};
		}
		constructor(options) {
			this.pageSize = 10;
			this.grid = BX.Main.gridManager.getInstanceById(options.gridId);
			this.stub = options.gridStub;
			this.sort = options.sort;
			this.actionsPanel = options.actionsPanel;
			this.items = new Map();
			this.fillItems(options.items);
			this.bindEvents();
			this.colorPinnedRows();
		}
		bindEvents() {
			main_core_events.EventEmitter.subscribe('BX.Main.grid:sort', this.onColumnSort.bind(this));
			main_core_events.EventEmitter.subscribe('BX.Main.grid:paramsUpdated', this.onParamsUpdated.bind(this));
		}
		onColumnSort(event) {
			const data = event.getData();
			const grid = data[1];
			const column = data[0];
			if (grid === this.grid) {
				this.sort = {};
				this.sort[column.sort_by] = column.sort_order;
			}
		}
		onParamsUpdated() {
			const newItems = this.getRows().map(row => row.getId()).filter(id => id !== 'template_0');
			const flipped = newItems.reduce((obj, value) => ({
				...obj,
				[value]: null
			}), {});
			this.clearItems();
			this.fillItems(flipped);
			this.colorPinnedRows();
		}
		addRow(id, data, params) {
			const options = {
				id: id,
				columns: data.content,
				actions: data.actions,
				cellActions: data.cellActions,
				counters: data.counters
			};
			const moveParams = params.moveParams || {};
			if (moveParams.rowBefore) {
				options.insertAfter = moveParams.rowBefore;
			} else if (moveParams.rowAfter) {
				options.insertBefore = moveParams.rowAfter;
			} else {
				options.append = true;
			}
			if (this.items.size > this.getCurrentPage() * this.pageSize) {
				const lastRowId = this.getLastRowId();
				this.removeItem(lastRowId);
				main_core.Dom.remove(this.getRowNodeById(lastRowId));
				this.showMoreButton();
			}
			this.hideStub();
			this.getRealtime().addRow(options);
			this.colorPinnedRows();
			main_core_events.EventEmitter.emit('Tasks.Projects.Grid:RowAdd', {
				id
			});
		}
		updateRow(id, data, params) {
			const row = this.getRowById(id);
			row.setCellsContent(data.content);
			row.setActions(data.actions);
			row.setCellActions(data.cellActions);
			row.setCounters(data.counters);
			this.resetRows();
			this.moveRow(id, params.moveParams || {});
			this.highlightRow(id, params.highlightParams || {}).then(() => this.colorPinnedRows(), () => {});
			this.grid.bindOnRowEvents();
			main_core_events.EventEmitter.emit('Tasks.Projects.Grid:RowUpdate', {
				id
			});
		}
		removeRow(id, callback) {
			if (!this.isRowExist(id)) {
				return;
			}
			this.grid.removeRow(id, '', '', callback);
			main_core_events.EventEmitter.emit('Tasks.Projects.Grid:RowRemove', {
				id
			});
		}
		moveRow(rowId, params) {
			if (params.skip) {
				return;
			}
			const rowBefore = params.rowBefore || 0;
			const rowAfter = params.rowAfter || 0;
			if (rowBefore) {
				this.grid.getRows().insertAfter(rowId, rowBefore);
			} else if (rowAfter) {
				this.grid.getRows().insertBefore(rowId, rowAfter);
			}
		}
		highlightRow(rowId, params) {
			params = params || {};
			return new Promise((resolve, reject) => {
				if (!this.isRowExist(rowId)) {
					reject();
					return;
				}
				if (params.skip) {
					resolve();
					return;
				}
				const node = this.getRowNodeById(rowId);
				const isPinned = main_core.Dom.hasClass(node, Grid.classes.pinned);
				if (isPinned) {
					main_core.Dom.removeClass(node, Grid.classes.pinned);
				}
				main_core.Dom.addClass(node, Grid.classes.highlighted);
				setTimeout(() => {
					main_core.Dom.removeClass(node, Grid.classes.highlighted);
					if (isPinned) {
						main_core.Dom.addClass(node, Grid.classes.pinned);
					}
					resolve();
				}, 900);
			});
		}
		colorPinnedRows() {
			this.getRows().forEach(row => {
				const node = row.getNode();
				this.getIsPinned(row.getId()) ? main_core.Dom.addClass(node, Grid.classes.pinned) : main_core.Dom.removeClass(node, Grid.classes.pinned);
			});
		}
		resetRows() {
			this.grid.getRows().reset();
		}
		getRows() {
			return this.grid.getRows().getBodyChild();
		}
		getContainer() {
			return this.grid.getContainer();
		}
		getHeaderSelectAllCheckbox() {
			return this.getContainer().querySelector('.main-grid-row-head .main-grid-check-all');
		}
		getFirstRowId() {
			const firstRow = this.grid.getRows().getBodyFirstChild();
			return firstRow ? this.getRowProperty(firstRow, 'id') : 0;
		}
		getLastRowId() {
			const lastRow = this.grid.getRows().getBodyLastChild();
			return lastRow ? this.getRowProperty(lastRow, 'id') : 0;
		}
		getLastPinnedRowId() {
			const pinnedRows = Object.values(this.getRows()).filter(row => this.getIsPinned(row.getId()));
			const keys = Object.keys(pinnedRows);
			if (keys.length > 0) {
				return pinnedRows[keys[keys.length - 1]].getId();
			}
			return 0;
		}
		getIsPinned(rowId) {
			return this.isRowExist(rowId) && main_core.Type.isDomNode(this.getRowNodeById(rowId).querySelector('.main-grid-cell-content-action-pin.main-grid-cell-content-action-active'));
		}
		getRowProperty(row, propertyName) {
			return BX.data(row.getNode(), propertyName);
		}
		getRowById(id) {
			return this.grid.getRows().getById(id);
		}
		getRowNodeById(id) {
			return this.getRowById(id).getNode();
		}
		isRowExist(id) {
			return this.getRowById(id) !== null;
		}
		getCurrentPage() {
			const currentPage = this.grid.getContainer().querySelector('.modern-page-current');
			return currentPage ? currentPage.innerText : 1;
		}
		isActivityRealtimeMode() {
			return this.sort.ACTIVITY_DATE && this.sort.ACTIVITY_DATE === 'desc';
		}
		getItems() {
			return Array.from(this.items.keys());
		}
		hasItem(id) {
			return this.items.has(parseInt(id, 10));
		}
		addItem(id) {
			this.items.set(parseInt(id, 10));
		}
		removeItem(id) {
			this.items.delete(parseInt(id, 10));
		}
		fillItems(items) {
			Object.keys(items).forEach(id => this.addItem(id));
		}
		clearItems() {
			this.items.clear();
		}
		getRealtime() {
			return this.grid.getRealtime();
		}
		showStub() {
			if (this.stub) {
				this.getRealtime().showStub({
					content: this.stub
				});
			}
		}
		hideStub() {
			this.grid.hideEmptyStub();
		}
		showMoreButton() {
			this.grid.getMoreButton().getNode().style.display = 'inline-block';
		}
		hideMoreButton() {
			this.grid.getMoreButton().getNode().style.display = 'none';
		}
	}

	const MAX_GROUP_IDS_PER_REQUEST = 100;
	const HOVER_HIDDEN_PIN_SELECTOR = '.main-grid-cell-content-action-pin.main-grid-cell-content-action-by-hover';
	const supportsCheckVisibility = main_core.Type.isFunction(window.Element?.prototype?.checkVisibility);
	function isHoverHiddenPinFocusable(element) {
		if (!element.matches(HOVER_HIDDEN_PIN_SELECTOR) || !element.isConnected || element.closest('[inert]') || !element.matches(ui_a11y.FocusNavigator.FOCUSABLE_SELECTOR) || ui_a11y.InteractivityChecker.hasNegativeTabIndex(element) || ui_a11y.InteractivityChecker.isDisabled(element)) {
			return false;
		}
		if (supportsCheckVisibility) {
			return element.checkVisibility({
				visibilityProperty: true,
				opacityProperty: false
			});
		}
		const hasGeometry = element.offsetWidth > 0 || element.offsetHeight > 0 || element.getClientRects().length > 0;
		return hasGeometry && getComputedStyle(element).visibility === 'visible';
	}
	class PullController {
		static get focusControlSelectors() {
			return {
				primaryLink: '.tasks-projects-text',
				pin: '.main-grid-cell-content-action-pin',
				checkbox: '.main-grid-row-checkbox',
				actions: '.main-grid-row-action-button',
				members: '.tasks-projects-user-list-container',
				join: '.tasks-projects-badge-join',
				accept: '.tasks-projects-badge-accept',
				cancel: '.tasks-projects-badge-cancel'
			};
		}
		static get events() {
			return {
				add: 'add',
				update: 'update',
				remove: 'remove',
				userAdd: 'userAdd',
				userUpdate: 'userUpdate',
				userRemove: 'userRemove',
				pinChanged: 'pinChanged'
			};
		}
		static get counterEvents() {
			return ['onAfterTaskAdd', 'onAfterTaskDelete', 'onAfterTaskRestore', 'onAfterTaskView', 'onAfterTaskMute', 'onAfterCommentAdd', 'onAfterCommentDelete', 'onProjectPermUpdate'];
		}
		static get movingProjectEvents() {
			return ['onAfterTaskAdd', 'onAfterCommentAdd'];
		}
		constructor(options) {
			this.signedParameters = options.signedParameters;
			this.isScrumList = options.isScrumList === 'Y';
			this.createProjectUrl = options.createProjectUrl;
			this.scrumLimitSidePanelId = options.scrumLimitSidePanelId;
			this.grid = new Grid(options);
			this.timer = null;
			this.counterData = new Map();
			this.userOptions = options.userOptions;
		}
		getModuleId() {
			return 'tasks';
		}
		getMap() {
			return {
				project_add: this.onProjectAdd.bind(this),
				project_update: this.onProjectUpdate.bind(this),
				project_remove: this.onProjectRemove.bind(this),
				project_user_add: this.onProjectUserAdd.bind(this),
				project_user_update: this.onProjectUserUpdate.bind(this),
				project_user_remove: this.onProjectUserRemove.bind(this),
				project_user_option_changed: this.onProjectUserOptionChanged.bind(this),
				project_counter: this.onProjectCounter.bind(this),
				project_read_all: this.onProjectCommentsReadAll.bind(this),
				comment_read_all: this.onProjectCommentsReadAll.bind(this),
				scrum_read_all: this.onProjectCommentsReadAll.bind(this)
			};
		}
		onProjectAdd(data) {
			const params = {
				event: PullController.events.add,
				moveParams: {
					rowBefore: this.grid.getLastPinnedRowId(),
					rowAfter: this.grid.getFirstRowId()
				}
			};
			this.checkExistence(data.ID).then(response => this.onCheckExistenceSuccess(response, data.ID, params), response => console.error(response));
			if (this.isScrumList) {
				this.checkScrumLimit().then(isLimitExceeded => this.onCheckScrumLimit(isLimitExceeded), response => console.error(response));
			}
		}
		onProjectUpdate(data) {
			const params = {
				event: PullController.events.update
			};
			this.checkExistence(data.ID).then(response => this.onCheckExistenceSuccess(response, data.ID, params), response => console.error(response));
		}
		onProjectRemove(data) {
			this.removeRow(data.ID);
			if (this.isScrumList) {
				this.checkScrumLimit().then(isLimitExceeded => this.onCheckScrumLimit(isLimitExceeded), response => console.error(response));
			}
		}
		onProjectUserAdd(data) {
			const params = {
				event: PullController.events.userAdd
			};
			this.checkExistence(data.GROUP_ID).then(response => this.onCheckExistenceSuccess(response, data.GROUP_ID, params), response => console.error(response));
		}
		onProjectUserUpdate(data) {
			const params = {
				event: PullController.events.userUpdate
			};
			this.checkExistence(data.GROUP_ID).then(response => this.onCheckExistenceSuccess(response, data.GROUP_ID, params), response => console.error(response));
		}
		onProjectUserRemove(data) {
			const params = {
				event: PullController.events.userRemove
			};
			this.checkExistence(data.GROUP_ID).then(response => this.onCheckExistenceSuccess(response, data.GROUP_ID, params), response => console.error(response));
		}
		onProjectUserOptionChanged(data) {
			switch (data.OPTION) {
				case this.userOptions.pinned:
					this.onProjectPinChanged(data);
					break;
			}
		}
		onProjectPinChanged(data) {
			const params = {
				event: PullController.events.pinChanged
			};
			this.moveToDirectPlace(data.PROJECT_ID, null, params);
		}
		onProjectCounter(data) {
			const groupId = data.GROUP_ID;
			const event = data.EVENT;
			if (!PullController.counterEvents.includes(event)) {
				return;
			}
			if (!this.timer) {
				this.timer = setTimeout(() => {
					this.freeCounterQueue();
				}, 1000);
			}
			if (PullController.movingProjectEvents.includes(event) || !this.counterData.has(groupId)) {
				this.counterData.set(groupId, event);
			}
		}
		freeCounterQueue() {
			this.counterData.forEach((event, groupId) => {
				const params = {
					event,
					highlightParams: {
						skip: true
					}
				};
				if (PullController.movingProjectEvents.includes(event)) {
					params.moveParams = {
						rowBefore: this.grid.getIsPinned(groupId) ? 0 : this.grid.getLastPinnedRowId(),
						rowAfter: this.grid.getFirstRowId()
					};
					params.highlightParams = {
						skip: false
					};
				}
				this.checkExistence(groupId).then(response => this.onCheckExistenceSuccess(response, groupId, params), response => console.error(response));
			});
			this.counterData.clear();
			this.timer = null;
		}
		onProjectCommentsReadAll(data) {
			const groupId = data.GROUP_ID;
			if (groupId) {
				if (this.grid.isRowExist(groupId)) {
					this.updateCounter([groupId]);
				}
			} else {
				this.updateCounter(this.grid.getItems());
			}
		}
		checkExistence(groupId) {
			return new Promise((resolve, reject) => {
				BX.ajax.runComponentAction('bitrix:tasks.projects', 'checkExistence', {
					mode: 'class',
					data: {
						groupIds: [groupId]
					},
					signedParameters: this.signedParameters
				}).then(response => resolve(response), response => reject(response));
			});
		}
		checkScrumLimit() {
			return new Promise((resolve, reject) => {
				main_core.ajax.runAction('bitrix:tasks.scrum.info.checkScrumLimit', {
					data: {},
					signedParameters: this.signedParameters
				}).then(response => resolve(response.data), response => reject(response));
			});
		}
		onCheckExistenceSuccess(response, groupId, params) {
			if (main_core.Type.isUndefined(response.data[groupId])) {
				return;
			}
			if (response.data[groupId] === false) {
				this.removeRow(groupId);
				return;
			}
			const group = response.data[groupId];
			if (this.grid.isRowExist(groupId)) {
				this.grid.isActivityRealtimeMode() ? this.updateRow(groupId, group, params) : this.moveToDirectPlace(groupId, group, params);
			} else if (this.grid.isActivityRealtimeMode() && (PullController.movingProjectEvents.includes(params.event) || params.event === PullController.events.add)) {
				this.updateItem(groupId, group, params);
			} else {
				this.moveToDirectPlace(groupId, group, params);
			}
		}
		onCheckScrumLimit(isLimitExceeded) {
			this.projectAddButton = document.getElementById('projectAddButton');
			if (!main_core.Type.isDomNode(this.projectAddButton)) {
				return;
			}
			if (isLimitExceeded) {
				this.projectAddButton.href = `javascript:BX.UI.InfoHelper.show('${this.scrumLimitSidePanelId}', {isLimit: true, limitAnalyticsLabels: {module: 'tasks', source: 'scrumList'}})`;
			} else {
				this.projectAddButton.href = this.createProjectUrl;
			}
		}
		updateItem(rowId, rowData, params) {
			if (!this.grid.hasItem(rowId)) {
				this.grid.addItem(rowId);
				this.addRow(rowId, rowData, params);
			} else {
				this.updateRow(rowId, rowData, params);
			}
		}
		addRow(rowId, rowData, params) {
			if (this.grid.isRowExist(rowId)) {
				return;
			}
			BX.ajax.runComponentAction('bitrix:tasks.projects', 'prepareGridRows', {
				mode: 'class',
				data: {
					groupIds: [rowId],
					data: rowData ? {
						[rowId]: rowData
					} : null
				},
				signedParameters: this.signedParameters
			}).then(response => {
				if (!main_core.Type.isUndefined(response.data[rowId])) {
					this.grid.addRow(rowId, response.data[rowId], params);
				}
			});
		}
		updateRow(rowId, rowData, params) {
			if (!this.grid.isRowExist(rowId)) {
				return;
			}
			BX.ajax.runComponentAction('bitrix:tasks.projects', 'prepareGridRows', {
				mode: 'class',
				data: {
					groupIds: [rowId],
					data: rowData ? {
						[rowId]: rowData
					} : null
				},
				signedParameters: this.signedParameters
			}).then(response => {
				if (!main_core.Type.isUndefined(response.data[rowId])) {
					const focusState = this.captureRowFocus(rowId);
					this.grid.updateRow(rowId, response.data[rowId], params);
					this.restoreUpdatedRowFocus(rowId, focusState);
				}
			});
		}
		removeRow(rowId) {
			if (!this.grid.isRowExist(rowId)) {
				this.grid.removeItem(rowId);
				return;
			}
			const focusSession = this.startRemovalFocusSession();
			this.grid.removeRow(rowId, () => this.finishRemoval(rowId, focusSession));
		}
		finishRemoval(rowId, focusSession) {
			const activeRowDisappeared = this.restoreRemovedRowFocus(focusSession);
			if (this.grid.isRowExist(rowId)) {
				this.grid.addItem(rowId);
			} else {
				this.grid.removeItem(rowId);
			}
			this.finishRemovalFocusSession(focusSession);
			if (activeRowDisappeared) {
				this.announceRemovedRow();
			}
		}
		captureRowFocus(rowId) {
			if (!this.grid.isRowExist(rowId)) {
				return null;
			}
			const rowNode = this.grid.getRowNodeById(rowId);
			const activeElement = ui_a11y.FocusNavigator.getActiveElement();
			if (!main_core.Type.isElementNode(activeElement) || !rowNode.contains(activeElement)) {
				return null;
			}
			const controlType = Object.keys(PullController.focusControlSelectors).find(type => {
				return activeElement.matches(PullController.focusControlSelectors[type]);
			});
			return {
				controlType,
				rowNode
			};
		}
		captureGridFocus(activeElement = ui_a11y.FocusNavigator.getActiveElement()) {
			if (!main_core.Type.isElementNode(activeElement)) {
				return null;
			}
			const focusedRow = this.grid.getRows().find(row => row.getNode().contains(activeElement));
			if (!focusedRow) {
				return null;
			}
			const rowId = focusedRow.getId();
			const rowNode = focusedRow.getNode();
			const controlType = Object.keys(PullController.focusControlSelectors).find(type => {
				return activeElement.matches(PullController.focusControlSelectors[type]);
			});
			return {
				rowId,
				rowNode,
				controlType,
				nearbyRowIds: this.getVisibleRowIdsByDistance(rowId)
			};
		}
		startRemovalFocusSession() {
			const container = this.grid.getContainer();
			if (!main_core.Type.isElementNode(container)) {
				return null;
			}
			const ownerDocument = container.ownerDocument;
			const ownerWindow = ownerDocument.defaultView;
			const captureOptions = {
				capture: true
			};
			const focusSession = {
				isActive: true,
				focusState: this.captureGridFocus(),
				stop: null
			};
			let trackingTimeout = null;
			const clearFocusState = () => {
				focusSession.focusState = null;
			};
			const onFocusOut = event => {
				const departedRowNode = focusSession.focusState?.rowNode;
				if (!departedRowNode?.contains(event.target)) {
					return;
				}
				const nextTarget = event.relatedTarget;
				if (main_core.Type.isElementNode(nextTarget)) {
					focusSession.focusState = this.captureGridFocus(nextTarget);
				} else if (nextTarget === null) {
					queueMicrotask(() => {
						if (focusSession.isActive && focusSession.focusState?.rowNode === departedRowNode && departedRowNode.isConnected && ownerDocument.activeElement === ownerDocument.body) {
							clearFocusState();
						}
					});
				}
			};
			const onFocusIn = event => {
				focusSession.focusState = this.captureGridFocus(event.target);
			};
			const onOutsideInteraction = event => {
				if (!main_core.Type.isDomNode(event.target) || !focusSession.focusState?.rowNode.contains(event.target)) {
					clearFocusState();
				}
			};
			const onWindowBlur = () => clearFocusState();
			focusSession.stop = () => {
				if (!focusSession.isActive) {
					return;
				}
				focusSession.isActive = false;
				main_core.Event.unbind(ownerDocument, 'focusout', onFocusOut, captureOptions);
				main_core.Event.unbind(ownerDocument, 'focusin', onFocusIn, captureOptions);
				main_core.Event.unbind(ownerDocument, 'pointerdown', onOutsideInteraction, captureOptions);
				if (ownerWindow) {
					main_core.Event.unbind(ownerWindow, 'blur', onWindowBlur);
				}
				clearTimeout(trackingTimeout);
			};
			main_core.Event.bind(ownerDocument, 'focusout', onFocusOut, captureOptions);
			main_core.Event.bind(ownerDocument, 'focusin', onFocusIn, captureOptions);
			main_core.Event.bind(ownerDocument, 'pointerdown', onOutsideInteraction, captureOptions);
			if (ownerWindow) {
				main_core.Event.bind(ownerWindow, 'blur', onWindowBlur);
			}
			trackingTimeout = setTimeout(() => focusSession.stop(), 60000);
			return focusSession;
		}
		finishRemovalFocusSession(focusSession) {
			if (!focusSession) {
				return;
			}
			focusSession.stop();
		}
		getVisibleRowIdsByDistance(rowId) {
			const visibleRows = this.grid.getRows().filter(row => row.isShown());
			const rowIndex = visibleRows.findIndex(row => String(row.getId()) === String(rowId));
			if (rowIndex < 0) {
				return {
					next: [],
					previous: []
				};
			}
			return {
				next: visibleRows.slice(rowIndex + 1).map(row => row.getId()),
				previous: visibleRows.slice(0, rowIndex).reverse().map(row => row.getId())
			};
		}
		restoreUpdatedRowFocus(rowId, focusState) {
			if (!focusState || !this.grid.isRowExist(rowId)) {
				return;
			}
			const rowNode = this.grid.getRowNodeById(rowId);
			const equivalentControl = focusState.controlType ? rowNode.querySelector(PullController.focusControlSelectors[focusState.controlType]) : null;
			if (this.focusFirst([equivalentControl], {
				allowHoverHiddenPin: true
			})) {
				return;
			}
			this.focusFirst([rowNode.querySelector(PullController.focusControlSelectors.primaryLink)]);
		}
		restoreRemovedRowFocus(focusSession) {
			const focusState = focusSession?.focusState;
			const ownerDocument = focusState?.rowNode.ownerDocument;
			if (!focusState || !focusSession?.isActive || ownerDocument.activeElement !== ownerDocument.body) {
				return false;
			}
			const activeRowDisappeared = !this.grid.isRowExist(focusState.rowId);
			if (!activeRowDisappeared) {
				const rowNode = this.grid.getRowNodeById(focusState.rowId);
				const equivalentControl = focusState.controlType ? rowNode.querySelector(PullController.focusControlSelectors[focusState.controlType]) : null;
				if (this.focusFirst([equivalentControl], {
					allowHoverHiddenPin: true
				}) || this.focusFirst([rowNode.querySelector(PullController.focusControlSelectors.primaryLink)])) {
					return false;
				}
			}
			const rowCandidates = [];
			const maxDistance = Math.max(focusState.nearbyRowIds.next.length, focusState.nearbyRowIds.previous.length);
			for (let distance = 0; distance < maxDistance; distance++) {
				rowCandidates.push(this.getVisibleRowPrimaryLink(focusState.nearbyRowIds.next[distance]), this.getVisibleRowPrimaryLink(focusState.nearbyRowIds.previous[distance]));
			}
			const focusRestored = this.focusFirst([...rowCandidates, this.grid.getHeaderSelectAllCheckbox(), () => {
				const container = this.grid.getContainer();
				if (!main_core.Type.isElementNode(container)) {
					return null;
				}
				container.tabIndex = -1;
				return container;
			}]);
			return activeRowDisappeared && focusRestored;
		}
		announceRemovedRow() {
			const messageCode = this.isScrumList ? 'TASKS_PROJECTS_SCRUM_A11Y_ROW_REMOVED' : 'TASKS_PROJECTS_A11Y_ROW_REMOVED';
			const message = main_core.Loc.getMessage(messageCode);
			if (message) {
				ui_a11y.LiveAnnouncer.announce(message);
			}
		}
		getVisibleRowPrimaryLink(rowId) {
			if (!rowId || !this.grid.isRowExist(rowId)) {
				return null;
			}
			const row = this.grid.getRowById(rowId);
			if (!row.isShown()) {
				return null;
			}
			return row.getNode().querySelector(PullController.focusControlSelectors.primaryLink);
		}
		focusFirst(candidates, options = {}) {
			const {
				allowHoverHiddenPin = false
			} = options;
			for (const candidate of candidates) {
				const element = main_core.Type.isFunction(candidate) ? candidate() : candidate;
				if (!main_core.Type.isElementNode(element) || !ui_a11y.InteractivityChecker.isFocusable(element) && !(allowHoverHiddenPin && isHoverHiddenPinFocusable(element))) {
					continue;
				}
				ui_a11y.FocusNavigator.restoreFocus(element, {
					preventScroll: true
				});
				if (element.ownerDocument.activeElement === element && (ui_a11y.InteractivityChecker.isFocusable(element) || allowHoverHiddenPin && isHoverHiddenPinFocusable(element))) {
					return true;
				}
			}
			return false;
		}
		moveToDirectPlace(groupId, data, params) {
			params = params || {};
			BX.ajax.runComponentAction('bitrix:tasks.projects', 'findProjectPlace', {
				mode: 'class',
				data: {
					groupId,
					currentPage: this.grid.getCurrentPage()
				},
				signedParameters: this.signedParameters
			}).then(response => {
				if (response.data === null) {
					return;
				}
				const {
					projectBefore,
					projectAfter
				} = response.data;
				if (projectBefore === false && projectAfter === false) {
					this.removeRow(groupId);
				} else {
					if (projectBefore && this.grid.isRowExist(projectBefore) || projectAfter && this.grid.isRowExist(projectAfter)) {
						params.moveParams = {
							rowBefore: projectBefore,
							rowAfter: projectAfter
						};
					} else {
						params.moveParams = {
							skip: true
						};
					}
					this.updateItem(groupId, data, params);
				}
			});
		}
		updateCounter(rowIds) {
			for (let offset = 0; offset < rowIds.length; offset += MAX_GROUP_IDS_PER_REQUEST) {
				BX.ajax.runComponentAction('bitrix:tasks.projects', 'prepareGridRows', {
					mode: 'class',
					data: {
						groupIds: rowIds.slice(offset, offset + MAX_GROUP_IDS_PER_REQUEST),
						data: null
					},
					signedParameters: this.signedParameters
				}).then(response => {
					const projects = response.data;
					if (projects) {
						Object.keys(projects).forEach(projectId => {
							if (this.grid.isRowExist(projectId)) {
								this.grid.getRowById(projectId).setCounters(projects[projectId].counters);
							}
						});
					}
				});
			}
		}
	}

	class FirstProjectCreationTourGuide {
		constructor(options) {
			this.grid = new Grid(options);
			this.signedParameters = options.signedParameters;
			this.popupData = options.tours.firstProjectCreation.popupData;
			this.projectAddButton = BX('projectAddButton');
			this.guide = new ui_tour.Guide({
				steps: [{
					target: this.projectAddButton,
					title: this.popupData[0].title,
					text: this.popupData[0].text,
					article: this.popupData[0].article
				}],
				onEvents: true
			});
			this.bindEvents();
		}
		bindEvents() {
			main_core_events.EventEmitter.subscribe('UI.Tour.Guide:onFinish', this.onGuideFinish.bind(this));
			main_core_events.EventEmitter.subscribe('SidePanel.Slider:onMessage', this.onProjectSliderMessage.bind(this));
		}
		onGuideFinish(event) {
			const {
				guide
			} = event.getData();
			if (guide === this.guide) {
				this.projectAddButton.href = main_core.Uri.removeParam(this.projectAddButton.href, ['PROJECT_OPTIONS']);
			}
		}
		onProjectSliderMessage(event) {
			const [sliderEvent] = event.getData();
			if (sliderEvent.getEventId() !== 'sonetGroupEvent') {
				return;
			}
			const sliderEventData = sliderEvent.getData();
			if (sliderEventData.code !== 'afterCreate' || sliderEventData.data.projectOptions.tourId !== this.guide.getId()) {
				return;
			}
			const projectId = sliderEventData.data.group.ID;
			if (this.grid.isRowExist(projectId)) {
				this.showFinalStep(projectId);
			} else {
				main_core_events.EventEmitter.subscribe('Tasks.Projects.Grid:RowAdd', this.onProjectRowAdded.bind(this, projectId));
			}
		}
		onProjectRowAdded(projectId, event) {
			const {
				id
			} = event.getData();
			if (Number(id) === Number(projectId)) {
				this.showFinalStep(projectId);
			}
		}
		showFinalStep(projectId) {
			const target = this.grid.getRowNodeById(projectId).querySelector('.tasks-projects-text');
			this.guide.steps.push(new ui_tour.Step({
				target,
				cursorMode: true,
				targetEvent: () => {
					BX.SidePanel.Instance.open(target.href);
					setTimeout(() => this.guide.close(), 1000);
				}
			}));
			this.finish();
			this.showNextStep();
		}
		start() {
			this.projectAddButton.href = main_core.Uri.addParam(this.projectAddButton.href, {
				PROJECT_OPTIONS: {
					tourId: this.guide.getId()
				}
			});
			this.showNextStep();
		}
		finish() {
			BX.ajax.runAction('tasks.tourguide.firstprojectcreation.finish');
		}
		showNextStep() {
			setTimeout(() => this.guide.showNextStep(), 1000);
		}
	}

	class FirstScrumCreationTourGuide {
		constructor(options) {
			this.grid = new Grid(options);
			this.signedParameters = options.signedParameters;
			this.popupData = options.tours.firstScrumCreation.popupData;
			this.projectAddButton = BX('projectAddButton');
			this.guide = new ui_tour.Guide({
				steps: [{
					target: this.projectAddButton,
					title: this.popupData[0].title,
					text: this.popupData[0].text,
					article: null
				}],
				onEvents: true
			});
			this.bindEvents();
		}
		bindEvents() {
			main_core_events.EventEmitter.subscribe('UI.Tour.Guide:onFinish', this.onGuideFinish.bind(this));
			main_core_events.EventEmitter.subscribe('SidePanel.Slider:onMessage', this.onProjectSliderMessage.bind(this));
		}
		onGuideFinish(event) {
			const {
				guide
			} = event.getData();
			if (guide === this.guide) {
				this.projectAddButton.href = main_core.Uri.removeParam(this.projectAddButton.href, ['PROJECT_OPTIONS']);
			}
		}
		onProjectSliderMessage(event) {
			const [sliderEvent] = event.getData();
			if (sliderEvent.getEventId() !== 'sonetGroupEvent') {
				return;
			}
			const sliderEventData = sliderEvent.getData();
			if (sliderEventData.code !== 'afterCreate' || sliderEventData.data.projectOptions.tourId !== this.guide.getId()) {
				return;
			}
			const projectId = sliderEventData.data.group.ID;
			if (this.grid.isRowExist(projectId)) {
				this.showFinalStep(projectId);
			} else {
				main_core_events.EventEmitter.subscribe('Tasks.Projects.Grid:RowAdd', this.onProjectRowAdded.bind(this, projectId));
			}
		}
		onProjectRowAdded(projectId, event) {
			const {
				id
			} = event.getData();
			if (Number(id) === Number(projectId)) {
				this.showFinalStep(projectId);
			}
		}
		showFinalStep(projectId) {
			const target = this.grid.getRowNodeById(projectId).querySelector('.tasks-projects-text');
			this.guide.steps.push(new ui_tour.Step({
				target,
				cursorMode: true,
				targetEvent: () => {
					BX.SidePanel.Instance.open(target.href);
					setTimeout(() => this.guide.close(), 1000);
				}
			}));
			this.finish();
			this.showNextStep();
		}
		start() {
			this.projectAddButton.href = main_core.Uri.addParam(this.projectAddButton.href, {
				PROJECT_OPTIONS: {
					tourId: this.guide.getId()
				}
			});
			this.showNextStep();
		}
		finish() {
			BX.ajax.runAction('tasks.tourguide.firstscrumcreation.finish');
		}
		showNextStep() {
			setTimeout(() => this.guide.showNextStep(), 1000);
		}
	}

	class TourGuideController {
		constructor(options) {
			this.tours = options.tours;
			this.initGuides(options);
		}
		initGuides(options) {
			if (this.tours.firstProjectCreation && this.tours.firstProjectCreation.show) {
				this.firstProjectCreationTourGuide = new FirstProjectCreationTourGuide(options);
				this.firstProjectCreationTourGuide.start();
			}
			if (this.tours.firstScrumCreation && this.tours.firstScrumCreation.show) {
				this.firstScrumCreationTourGuide = new FirstScrumCreationTourGuide(options);
				this.firstScrumCreationTourGuide.start();
			}
		}
	}

	class Controller {
		constructor(options) {
			this.membersPopup = new MembersPopup(options);
			this.scrumMembersPopup = new ScrumMembersPopup(options);
			this.filter = new Filter(options);
			this.tourGuideController = new TourGuideController(options);
			options.filter = this.filter;
			ActionsController.setOptions(options);
			this.initPull(options);
		}
		initPull(options) {
			this.pullController = new PullController(options);
			this.pullClient = pull_client.PULL;
			this.pullClient.subscribe(this.pullController);
		}
		getMembersPopup() {
			return this.membersPopup;
		}
		getScrumMembersPopup() {
			return this.scrumMembersPopup;
		}
		getFilter() {
			return this.filter;
		}
	}

	exports.ActionsController = ActionsController;
	exports.Controller = Controller;

})(this.BX.Tasks.Projects = this.BX.Tasks.Projects || {}, BX, BX, BX.Event, BX.UI.Accessibility, BX, BX.Main, BX.UI.Tour);
//# sourceMappingURL=script.js.map
