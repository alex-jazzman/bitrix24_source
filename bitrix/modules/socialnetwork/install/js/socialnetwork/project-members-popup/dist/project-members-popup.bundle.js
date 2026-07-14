/* eslint-disable */
this.BX = this.BX || {};
(function (exports, main_core, main_popup, main_loader) {
	'use strict';

	class ProjectMembersPopup {
		#popup = null;
		#isPopupShown = false;
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
		constructor(options) {
			this.#isScrumPopup = options?.popupType === 'scrum';
			this.#componentName = options?.componentName || '';
			this.#signedParameters = options?.signedParameters || '';
			this.#actionPrefix = options?.actionPrefix || 'socialnetwork.v2.Project';
			this.#paramName = options?.paramName || (this.#actionPrefix.includes('Scrum') ? 'scrumId' : this.#actionPrefix.includes('LegacyGroup') ? 'legacyGroupId' : 'projectId');
		}
		showPopup(groupId, routeConfig, bindNode, type = 'all') {
			if (this.#isPopupShown) {
				this.#popup.destroy();
			}
			this.#groupId = groupId;
			this.#routeConfig = main_core.Type.isPlainObject(routeConfig) ? routeConfig : null;
			this.#resetPopupData();
			this.#changeType(type, false);
			this.#popup = main_popup.PopupWindowManager.create({
				id: 'workgroup-grid-members-popup-menu',
				className: 'sonet-ui-members-popup',
				bindElement: bindNode,
				autoHide: true,
				closeByEsc: true,
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
						this.#loader = null;
						this.#isPopupShown = false;
					},
					onPopupClose: () => {
						this.#popup.destroy();
					},
					onAfterPopupShow: () => {
						this.#popup.contentContainer.appendChild(this.#renderContainer());
						this.#showLoader();
						this.#loadUsers(groupId, type);
						this.#isPopupShown = true;
					}
				}
			});
			this.#bindScroll(groupId, type);
			this.#popup.show();
		}
		#loadUsers(groupId, type) {
			const popupData = this.#getCurrentPopupData();
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
				if (this.#groupId !== groupId || this.#currentType !== type) {
					this.#hideLoader();
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
				this.#hideLoader();
			}, () => this.#hideLoader());
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
					<a class="sonet-ui-members-popup-item" href="${user.HREF}" target="_blank">
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
					<a class="sonet-ui-members-popup-item" href="${user.HREF}" target="_blank">
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
			<span class="sonet-ui-members-popup-avatar-new">
				<div class="ui-icon ui-icon-common-user sonet-ui-members-popup-avatar-img">
					<i ${avatarStyle}></i>
				</div>
				<span class="sonet-ui-members-popup-avatar-status-icon"></span>
			</span>
		`;
		}
		#renderContainer() {
			if (this.#isScrumPopup) {
				return main_core.Tag.render`
				<span class="sonet-ui-members-popup-container">
					<span class="sonet-ui-members-popup-head">
						${this.#popupData.all.tab}
						${this.#popupData.scrumTeam.tab}
						${this.#popupData.members.tab}
					</span>
					<span class="sonet-ui-members-popup-body">
						<div class="sonet-ui-members-popup-content">
							<div class="sonet-ui-members-popup-content-box">
								${this.#getCurrentPopupData().innerContainer}
							</div>
						</div>
					</span>
				</span>
			`;
			}
			return main_core.Tag.render`
			<span class="sonet-ui-members-popup-container">
				<span class="sonet-ui-members-popup-head">
					${this.#popupData.all.tab}
					${this.#popupData.heads.tab}
					${this.#popupData.members.tab}
				</span>
				<span class="sonet-ui-members-popup-body">
					<div class="sonet-ui-members-popup-content">
						<div class="sonet-ui-members-popup-content-box">
							${this.#getCurrentPopupData().innerContainer}
						</div>
					</div>
				</span>
			</span>
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
			const oldType = this.#currentType;
			this.#currentType = newType;
			Object.values(this.#popupData).forEach(item => {
				main_core.Dom.removeClass(item.tab, 'sonet-ui-members-popup-head-item-current');
			});
			main_core.Dom.addClass(this.#getCurrentPopupData().tab, 'sonet-ui-members-popup-head-item-current');
			if (oldType && this.#popupData[oldType]) {
				main_core.Dom.replace(this.#popupData[oldType].innerContainer, this.#getCurrentPopupData().innerContainer);
			}
			if (loadUsers && this.#getCurrentPopupData().currentPage === 1) {
				this.#showLoader();
				this.#loadUsers(this.#groupId, newType);
			}
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
			return {
				currentPage: 1,
				renderedUsers: [],
				tab: main_core.Tag.render`
				<span class="sonet-ui-members-popup-head-item" onclick="${this.#changeType.bind(this, type)}">
					<span class="sonet-ui-members-popup-head-text">${title}</span>
				</span>
			`,
				innerContainer: main_core.Tag.render`<div class="sonet-ui-members-popup-inner"></div>`
			};
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

})(this.BX.Socialnetwork = this.BX.Socialnetwork || {}, BX, BX.Main, BX);
//# sourceMappingURL=project-members-popup.bundle.js.map
