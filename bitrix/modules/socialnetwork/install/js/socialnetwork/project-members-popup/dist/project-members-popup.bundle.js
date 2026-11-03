/* eslint-disable */
this.BX = this.BX || {};
(function (exports, main_core, main_popup, main_loader, ui_a11y) {
	'use strict';

	const POPUP_ID = 'workgroup-grid-members-popup-menu';
	class ProjectMembersPopup {
		#popup = null;
		#loader = null;
		#groupId = 0;
		#currentType = 'all';
		#popupData = {};
		#actionPrefix = 'socialnetwork.v2.Project';
		#paramName = 'projectId';
		#routeConfig = null;
		#isScrumPopup = false;
		#componentName = '';
		#signedParameters = '';
		#tabsFocusZone = null;
		#popupGeneration = 0;
		constructor(options) {
			this.#isScrumPopup = options?.popupType === 'scrum';
			this.#componentName = options?.componentName || '';
			this.#signedParameters = options?.signedParameters || '';
			this.#actionPrefix = options?.actionPrefix || 'socialnetwork.v2.Project';
			this.#paramName = options?.paramName || (this.#actionPrefix.includes('Scrum') ? 'scrumId' : this.#actionPrefix.includes('LegacyGroup') ? 'legacyGroupId' : 'projectId');
		}
		showPopup(groupId, routeConfig, bindNode, type = 'all') {
			const shouldFocusCurrentType = main_core.Type.isElementNode(bindNode) && bindNode.ownerDocument.activeElement === bindNode && bindNode.matches(':focus-visible');
			const existingPopup = main_popup.PopupWindowManager.getPopupById(POPUP_ID);
			if (existingPopup) {
				existingPopup.getFocusTrap()?.setRestoreFocus(false);
				existingPopup.destroy();
			}
			this.#groupId = groupId;
			this.#popupGeneration++;
			this.#routeConfig = main_core.Type.isPlainObject(routeConfig) ? routeConfig : null;
			this.#resetPopupData();
			this.#changeType(type, false);
			const content = this.#renderContainer();
			let popup = null;
			popup = main_popup.PopupWindowManager.create({
				id: POPUP_ID,
				className: 'sonet-ui-members-popup',
				bindElement: bindNode,
				content,
				ariaLabel: main_core.Loc.getMessage('SONET_PROJECT_MEMBERS_POPUP_TAB_MEMBERS') || '',
				autoHide: true,
				closeByEsc: true,
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
						if (this.#popup === popup) {
							this.#popupGeneration++;
							this.#tabsFocusZone?.deactivate();
							this.#tabsFocusZone = null;
							this.#loader = null;
							this.#popup = null;
							this.#popupData = {};
						}
						bindNode.setAttribute('aria-expanded', 'false');
					},
					onPopupClose: () => {
						this.#configureFocusRestore(popup, bindNode);
						popup.destroy();
					},
					onAfterPopupShow: () => {
						if (this.#popup !== popup) {
							return;
						}
						this.#initTabsFocusZone(content);
						this.#showLoader();
						this.#loadUsers(groupId, type);
						bindNode.setAttribute('aria-expanded', 'true');
						if (shouldFocusCurrentType) {
							this.#getCurrentPopupData().tab.focus();
						}
					}
				}
			});
			this.#popup = popup;
			this.#popup.show();
		}
		#configureFocusRestore(popup, bindNode) {
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
		#loadUsers(groupId, type) {
			const popupData = this.#getCurrentPopupData();
			if (popupData.isLoading) {
				return;
			}
			const popupGeneration = this.#popupGeneration;
			popupData.isLoading = true;
			popupData.innerContainer.setAttribute('aria-busy', 'true');
			const route = this.#getRouteConfig();
			// Legacy scrum popup is the only source that already returns owner / scrum master / team roles.
			const request = this.#isScrumPopup ? main_core.ajax.runAction('socialnetwork.api.workgroup.getGridPopupMembers', {
				data: {
					groupId,
					type,
					page: popupData.currentPage,
					componentName: this.#componentName,
					signedParameters: this.#signedParameters
				}
			}) : main_core.ajax.runAction(`${route.actionPrefix}.getMembers`, {
				json: {
					[route.paramName]: groupId,
					type,
					page: popupData.currentPage
				}
			});
			request.then(response => {
				if (this.#popupGeneration !== popupGeneration || this.#groupId !== groupId || this.#currentType !== type) {
					this.#finishLoading(popupData, groupId, type, popupGeneration);
					return;
				}
				const data = response.data || [];
				if (data.length > 0) {
					this.#renderUsers(data);
					this.#bindScroll(groupId, this.#currentType);
				} else if (!popupData.innerContainer.hasChildNodes()) {
					popupData.innerContainer.innerText = main_core.Loc.getMessage('SONET_PROJECT_MEMBERS_POPUP_EMPTY') || '';
				}
				popupData.currentPage++;
				this.#finishLoading(popupData, groupId, type, popupGeneration);
			}, () => this.#finishLoading(popupData, groupId, type, popupGeneration));
		}
		#finishLoading(popupData, groupId, type, popupGeneration) {
			popupData.isLoading = false;
			popupData.innerContainer.setAttribute('aria-busy', 'false');
			if (this.#popupGeneration === popupGeneration && this.#groupId === groupId && this.#currentType === type) {
				this.#hideLoader();
			}
		}
		#renderUsers(users) {
			if (this.#isScrumPopup && this.#currentType === 'scrumTeam') {
				this.#renderScrumUsers(users);
				return;
			}
			const popupData = this.#getCurrentPopupData();
			users.forEach(user => {
				if (popupData.renderedUsers.indexOf(user.ID) >= 0) {
					return;
				}
				popupData.renderedUsers.push(user.ID);
				popupData.innerContainer.appendChild(main_core.Tag.render`
					<a
						class="sonet-ui-members-popup-item"
						href="${user.HREF}"
						target="_blank"
						data-testid="socialnetwork-project-members-user-${user.ID}"
					>
						${this.#renderAvatar(user)}
						<span class="sonet-ui-members-popup-name">${user.FORMATTED_NAME}</span>
					</a>
				`);
			});
		}
		#renderScrumUsers(users) {
			const popupData = this.#getCurrentPopupData();
			const containersMap = {
				A: 'sonet-ui-scrum-members-popup-owner-container',
				M: 'sonet-ui-scrum-members-popup-master-container',
				E: 'sonet-ui-scrum-members-popup-team-container'
			};
			this.#renderScrumLabels(users);
			users.forEach(user => {
				if (popupData.renderedUsers.indexOf(user.ID) >= 0 && user.ROLE !== 'M') {
					return;
				}
				popupData.renderedUsers.push(user.ID);
				const containerClass = containersMap[user.ROLE];
				if (!main_core.Type.isStringFilled(containerClass)) {
					return;
				}
				const container = popupData.innerContainer.querySelector(`.${containerClass}`);
				if (!container) {
					return;
				}
				container.appendChild(main_core.Tag.render`
					<a
						class="sonet-ui-members-popup-item"
						href="${user.HREF}"
						target="_blank"
						data-testid="socialnetwork-project-members-user-${user.ID}-${user.ROLE}"
					>
						${this.#renderAvatar(user)}
						<span class="sonet-ui-scrum-members-popup-name">${user.FORMATTED_NAME}</span>
					</a>
				`);
			});
		}
		#renderScrumLabels(users) {
			const popupData = this.#getCurrentPopupData();
			const labels = [{
				role: 'A',
				containerClass: 'sonet-ui-scrum-members-popup-owner-container',
				messageCode: 'SONET_PROJECT_MEMBERS_POPUP_LABEL_SCRUM_OWNER'
			}, {
				role: 'M',
				containerClass: 'sonet-ui-scrum-members-popup-master-container',
				messageCode: 'SONET_PROJECT_MEMBERS_POPUP_LABEL_SCRUM_MASTER'
			}, {
				role: 'E',
				containerClass: 'sonet-ui-scrum-members-popup-team-container',
				messageCode: 'SONET_PROJECT_MEMBERS_POPUP_LABEL_SCRUM_TEAM'
			}];
			labels.forEach(({
				role,
				containerClass,
				messageCode
			}) => {
				if (!users.find(user => user.ROLE === role)) {
					return;
				}
				if (popupData.innerContainer.querySelector(`.${containerClass}`) !== null) {
					return;
				}
				popupData.innerContainer.appendChild(main_core.Tag.render`
					<div class="${containerClass}">
						<span class="sonet-ui-scrum-members-popup-label">
							<span class="sonet-ui-scrum-members-popup-label-text">
								${main_core.Loc.getMessage(messageCode) || ''}
							</span>
						</span>
					</div>
				`);
			});
		}
		#renderAvatar(user) {
			const avatarStyle = main_core.Type.isStringFilled(user.PHOTO) ? `style="background-image: url('${encodeURI(user.PHOTO)}')"` : '';
			return main_core.Tag.render`
			<span class="sonet-ui-members-popup-avatar-new" aria-hidden="true">
				<span class="ui-icon ui-icon-common-user sonet-ui-members-popup-avatar-img">
					<i ${avatarStyle}></i>
				</span>
				<span class="sonet-ui-members-popup-avatar-status-icon"></span>
			</span>
		`;
		}
		#renderContainer() {
			const panels = Object.values(this.#popupData).map(({
				innerContainer
			}) => innerContainer);
			if (this.#isScrumPopup) {
				return main_core.Tag.render`
				<div class="sonet-ui-members-popup-container" data-testid="socialnetwork-project-members-popup">
					<div class="sonet-ui-members-popup-head" role="tablist" aria-orientation="horizontal" aria-label="${main_core.Loc.getMessage('SONET_PROJECT_MEMBERS_POPUP_TAB_MEMBERS') || ''}">
						${this.#popupData.all.tab}
						${this.#popupData.scrumTeam.tab}
						${this.#popupData.members.tab}
					</div>
					<div class="sonet-ui-members-popup-body">
						<div class="sonet-ui-members-popup-content">
							<div class="sonet-ui-members-popup-content-box">
								${panels}
							</div>
						</div>
					</div>
				</div>
			`;
			}
			return main_core.Tag.render`
			<div class="sonet-ui-members-popup-container" data-testid="socialnetwork-project-members-popup">
				<div class="sonet-ui-members-popup-head" role="tablist" aria-orientation="horizontal" aria-label="${main_core.Loc.getMessage('SONET_PROJECT_MEMBERS_POPUP_TAB_MEMBERS') || ''}">
					${this.#popupData.all.tab}
					${this.#popupData.heads.tab}
					${this.#popupData.members.tab}
				</div>
				<div class="sonet-ui-members-popup-body">
					<div class="sonet-ui-members-popup-content">
						<div class="sonet-ui-members-popup-content-box">
							${panels}
						</div>
					</div>
				</div>
			</div>
		`;
		}
		#bindScroll(groupId, type) {
			const container = this.#getCurrentPopupData().innerContainer;
			if (!main_core.Type.isDomNode(container)) {
				return;
			}
			main_core.Event.bind(container, 'scroll', event => {
				const area = event.target;
				if (area.scrollTop > (area.scrollHeight - area.offsetHeight) / 1.5) {
					this.#loadUsers(groupId, type);
					main_core.Event.unbindAll(container);
				}
			});
		}
		#changeType(newType, loadUsers = true) {
			if (!this.#popupData[newType]) {
				return;
			}
			this.#currentType = newType;
			const currentPopupData = this.#getCurrentPopupData();
			Object.values(this.#popupData).forEach(item => {
				const isSelected = item === currentPopupData;
				main_core.Dom.toggleClass(item.tab, 'sonet-ui-members-popup-head-item-current', isSelected);
				item.tab.setAttribute('aria-selected', isSelected ? 'true' : 'false');
				item.tab.tabIndex = isSelected ? 0 : -1;
				item.innerContainer.hidden = !isSelected;
			});
			this.#tabsFocusZone?.refreshElements();
			if (!loadUsers) {
				return;
			}
			if (currentPopupData.currentPage === 1) {
				this.#showLoader();
				this.#loadUsers(this.#groupId, newType);
				return;
			}
			this.#hideLoader();
		}
		#resetPopupData() {
			if (this.#isScrumPopup) {
				this.#popupData = {
					all: this.#createTabData(main_core.Loc.getMessage('SONET_PROJECT_MEMBERS_POPUP_TAB_ALL') || '', 'all'),
					scrumTeam: this.#createTabData(main_core.Loc.getMessage('SONET_PROJECT_MEMBERS_POPUP_TAB_SCRUM_TEAM') || '', 'scrumTeam'),
					members: this.#createTabData(main_core.Loc.getMessage('SONET_PROJECT_MEMBERS_POPUP_TAB_MEMBERS_SCRUM') || '', 'members')
				};
				return;
			}
			this.#popupData = {
				all: this.#createTabData(main_core.Loc.getMessage('SONET_PROJECT_MEMBERS_POPUP_TAB_ALL') || '', 'all'),
				heads: this.#createTabData(main_core.Loc.getMessage('SONET_PROJECT_MEMBERS_POPUP_TAB_HEADS') || '', 'heads'),
				members: this.#createTabData(main_core.Loc.getMessage('SONET_PROJECT_MEMBERS_POPUP_TAB_MEMBERS') || '', 'members')
			};
		}
		#createTabData(title, type) {
			const tabId = `workgroup-grid-members-popup-${this.#groupId}-${type}-tab`;
			const panelId = `workgroup-grid-members-popup-${this.#groupId}-${type}-panel`;
			return {
				currentPage: 1,
				isLoading: false,
				renderedUsers: [],
				tab: main_core.Tag.render`
				<button
					type="button"
					class="sonet-ui-members-popup-head-item"
					id="${tabId}"
					role="tab"
					aria-selected="false"
					aria-controls="${panelId}"
					tabindex="-1"
					data-testid="socialnetwork-project-members-tab-${type}"
					onclick="${this.#changeType.bind(this, type)}"
				>
					<span class="sonet-ui-members-popup-head-text">${title}</span>
				</button>
			`,
				innerContainer: main_core.Tag.render`
				<div
					class="sonet-ui-members-popup-inner"
					id="${panelId}"
					role="tabpanel"
					aria-labelledby="${tabId}"
					aria-busy="false"
					data-testid="socialnetwork-project-members-panel-${type}"
				></div>
			`
			};
		}
		#initTabsFocusZone(container) {
			const tabs = container.querySelector('.sonet-ui-members-popup-head');
			if (!tabs) {
				return;
			}
			this.#tabsFocusZone?.deactivate();
			this.#tabsFocusZone = new ui_a11y.FocusZone(tabs, {
				bindKeys: ui_a11y.FocusKeys.ArrowHorizontal | ui_a11y.FocusKeys.HomeAndEnd,
				focusOutBehavior: 'wrap',
				focusableElementFilter: element => element.matches('[role="tab"]'),
				tabbableOnly: false
			});
			this.#tabsFocusZone.activate();
		}
		#getCurrentPopupData() {
			return this.#popupData[this.#currentType];
		}
		#getRouteConfig() {
			return {
				actionPrefix: this.#routeConfig?.actionPrefix || this.#actionPrefix,
				paramName: this.#routeConfig?.entityParam || this.#routeConfig?.paramName || this.#paramName
			};
		}
		#showLoader() {
			if (!this.#loader && this.#popup) {
				this.#loader = new main_loader.Loader({
					target: this.#popup.getPopupContainer().querySelector('.sonet-ui-members-popup-content'),
					size: 40
				});
			}
			if (this.#loader) {
				void this.#loader.show();
			}
		}
		#hideLoader() {
			if (this.#loader) {
				void this.#loader.hide();
				this.#loader = null;
			}
		}
	}

	exports.ProjectMembersPopup = ProjectMembersPopup;

})(this.BX.Socialnetwork = this.BX.Socialnetwork || {}, BX, BX.Main, BX, BX.UI.Accessibility);
//# sourceMappingURL=project-members-popup.bundle.js.map
