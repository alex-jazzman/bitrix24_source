/* eslint-disable */
this.BX = this.BX || {};
(function (exports, main_core, socialnetwork_common, main_core_events, main_popup) {
	'use strict';

	class Scrum {
		constructor(params) {
			this.scrumMeetings = null;
			this.scrumMethodology = null;
			this.init(params);
		}
		init(params) {
			this.groupId = !main_core.Type.isUndefined(params.groupId) ? Number(params.groupId) : 0;
			this.urls = main_core.Type.isPlainObject(params.urls) ? params.urls : {};
			const scrumMeetingsButton = document.getElementById('tasks-scrum-meetings-button');
			if (scrumMeetingsButton) {
				scrumMeetingsButton.addEventListener('click', this.showScrumMeetings.bind(this));
			}
			const scrumMethodologyButton = document.getElementById('tasks-scrum-methodology-button');
			if (scrumMethodologyButton) {
				scrumMethodologyButton.addEventListener('click', this.showScrumMethodology.bind(this));
			}
		}
		showScrumMeetings(event) {
			event.target.classList.add('ui-btn-wait');
			main_core.Runtime.loadExtension('tasks.scrum.meetings').then(exports => {
				const {
					Meetings
				} = exports;
				if (this.scrumMeetings === null) {
					this.scrumMeetings = new Meetings({
						groupId: this.groupId
					});
				}
				this.scrumMeetings.showMenu(event.target);
				event.target.classList.remove('ui-btn-wait');
			});
			event.preventDefault();
		}
		showScrumMethodology(event) {
			event.target.classList.add('ui-btn-wait');
			main_core.Runtime.loadExtension('tasks.scrum.methodology').then(exports => {
				const {
					Methodology
				} = exports;
				if (this.scrumMethodology === null) {
					this.scrumMethodology = new Methodology({
						groupId: this.groupId,
						teamSpeedPath: this.urls.ScrumTeamSpeed,
						burnDownPath: this.urls.ScrumBurnDown,
						pathToTask: this.urls.TasksTask
					});
				}
				this.scrumMethodology.showMenu(event.target);
				event.target.classList.remove('ui-btn-wait');
			});
			event.preventDefault();
		}
	}

	class Widget {
		constructor(params) {
			this.projectWidgetInstance = null;
			this.init(params);
		}
		init(params) {
			this.groupId = !main_core.Type.isUndefined(params.groupId) ? Number(params.groupId) : 0;
			this.avatarPath = main_core.Type.isStringFilled(params.avatarPath) ? params.avatarPath : '';
			this.avatarType = main_core.Type.isStringFilled(params.avatarType) ? params.avatarType : '';
			this.projectTypeCode = main_core.Type.isStringFilled(params.projectTypeCode) ? params.projectTypeCode : '';
			this.canModify = main_core.Type.isBoolean(params.canModify) ? params.canModify : false;
			this.editFeaturesAllowed = main_core.Type.isBoolean(params.editFeaturesAllowed) ? params.editFeaturesAllowed : true;
			this.urls = main_core.Type.isPlainObject(params.urls) ? params.urls : {};
			const projectWidgetButton = document.getElementById('project-widget-button');
			if (projectWidgetButton) {
				projectWidgetButton.addEventListener('click', this.showProjectWidget.bind(this));
			}
		}
		showProjectWidget(event) {
			if (this.projectWidgetInstance === null) {
				this.projectWidgetInstance = new socialnetwork_common.WorkgroupWidget({
					groupId: this.groupId,
					avatarPath: this.avatarPath,
					avatarType: this.avatarType,
					projectTypeCode: this.projectTypeCode,
					perms: {
						canModify: this.canModify
					},
					urls: {
						card: this.urls.Card,
						members: this.urls.GroupUsers,
						features: this.urls.Features
					},
					editRolesAllowed: this.editFeaturesAllowed
				});
			}
			this.projectWidgetInstance.show(event.currentTarget);
			if (this.projectWidgetInstance.widget && this.projectWidgetInstance.widget.getPopup()) {
				BX.UI.Hint.init(this.projectWidgetInstance.widget.getPopup().getContentContainer());
			}
			event.preventDefault();
		}
	}

	class ControlButton {
		constructor(params) {
			this.init(params);
		}
		init(params) {
			this.groupId = !main_core.Type.isUndefined(params.groupId) ? Number(params.groupId) : 0;
			this.inIframe = !main_core.Type.isUndefined(params.inIframe) ? !!params.inIframe : false;
			const controlButtonContainer = document.getElementById('group-menu-control-button-cont');
			if (controlButtonContainer) {
				main_core.Runtime.loadExtension('intranet.control-button').then(exports => {
					const {
						ControlButton
					} = exports;
					new ControlButton({
						container: controlButtonContainer,
						entityType: 'workgroup',
						entityId: this.groupId,
						airDesign: true
					});
				});
			}
		}
	}

	class SonetGroupEvent {
		constructor(params, additionalData) {
			this.moreButtonInstance = !main_core.Type.isUndefined(additionalData.moreButtonInstance) ? additionalData.moreButtonInstance : null;
			this.init(params);
		}
		init(params) {
			this.groupId = !main_core.Type.isUndefined(params.groupId) ? Number(params.groupId) : 0;
			this.urls = main_core.Type.isPlainObject(params.urls) ? params.urls : {};
			main_core_events.EventEmitter.subscribe('SidePanel.Slider:onMessage', event => {
				const [sliderEvent] = event.getCompatData();
				if (sliderEvent.getEventId() === 'sonetGroupEvent') {
					this.sonetGroupEventHandler(sliderEvent.getData());
				}
			});
			main_core_events.EventEmitter.subscribe('sonetGroupEvent', event => {
				const [eventData] = event.getCompatData();
				this.sonetGroupEventHandler(eventData);
			});
		}
		sonetGroupEventHandler(eventData) {
			if (!main_core.Type.isStringFilled(eventData.code)) {
				return;
			}
			if (['afterJoinRequestSend', 'afterEdit'].includes(eventData.code)) {
				const joinContainerNode = document.getElementById('bx-group-menu-join-cont');
				if (joinContainerNode) {
					joinContainerNode.style.display = 'none';
				}
				socialnetwork_common.Common.reload();
			} else if (['afterSetFavorites'].includes(eventData.code)) {
				const sonetGroupMenu = socialnetwork_common.GroupMenu?.getInstance();
				if (sonetGroupMenu) {
					const favoritesValue = sonetGroupMenu.favoritesValue;
					sonetGroupMenu.setItemTitle(!favoritesValue);
					sonetGroupMenu.favoritesValue = !favoritesValue;
				}
			} else if (['afterDelete', 'afterLeave'].includes(eventData.code) && main_core.Type.isPlainObject(eventData.data) && !main_core.Type.isUndefined(eventData.data.groupId) && Number(eventData.data.groupId) === this.groupId) {
				top.location.href = this.urls.GroupsList;
			} else if (['afterSetSubscribe'].includes(eventData.code) && main_core.Type.isPlainObject(eventData.data) && !main_core.Type.isUndefined(eventData.data.groupId) && Number(eventData.data.groupId) === this.groupId && this.moreButtonInstance) {
				this.moreButtonInstance.redrawMenu(eventData.data.value);
			}
		}
	}

	class JoinButton {
		constructor(params) {
			this.init(params);
		}
		init(params) {
			this.groupId = !main_core.Type.isUndefined(params.groupId) ? Number(params.groupId) : 0;
			this.urls = main_core.Type.isPlainObject(params.urls) ? params.urls : {};
			const joinButtonNode = document.getElementById('bx-group-menu-join');
			if (joinButtonNode) {
				joinButtonNode.addEventListener('click', this.sendJoinRequest.bind(this));
			}
		}
		sendJoinRequest(event) {
			const button = event.currentTarget;
			socialnetwork_common.Common.showButtonWait(button);
			main_core.ajax.runAction('socialnetwork.api.usertogroup.join', {
				data: {
					params: {
						groupId: this.groupId
					}
				}
			}).then(response => {
				socialnetwork_common.Common.hideButtonWait(button);
				if (response.data.success && main_core.Type.isStringFilled(this.urls.view)) {
					const sonetGroupEventData = {
						code: 'afterJoinRequestSend',
						data: {
							groupId: this.groupId
						}
					};
					main_core_events.EventEmitter.emit(window.top, 'sonetGroupEvent', new main_core_events.BaseEvent({
						compatData: [sonetGroupEventData],
						data: [sonetGroupEventData]
					}));
					window.location.href = this.urls.view;
				}
			}, () => {
				socialnetwork_common.Common.hideButtonWait(button);
			});
		}
	}

	class TaskEvent {
		constructor(params) {
			this.init(params);
		}
		init(params) {
			this.pageId = main_core.Type.isStringFilled(params.pageId) ? params.pageId : '';
			this.currentUserId = !main_core.Type.isUndefined(params.currentUserId) ? Number(params.currentUserId) : 0;
			this.groupId = !main_core.Type.isUndefined(params.groupId) ? Number(params.groupId) : 0;
			this.isRoleControlDisabled = !main_core.Type.isUndefined(params.isRoleControlDisabled) ? Boolean(params.isRoleControlDisabled) : false;
			const compatMode = {
				compatMode: true
			};
			main_core_events.EventEmitter.subscribe('onPullEvent-tasks', (command, params) => {
				if (command === 'user_counter') {
					this.onUserCounter(params);
				}
			}, compatMode);
			if (this.pageId !== 'group_tasks') {
				return;
			}
			document.querySelectorAll('.tasks_role_link').forEach(element => {
				element.addEventListener('click', this.onTaskMenuItemClick.bind(this));
			});
			main_core_events.EventEmitter.subscribe('BX.Main.Filter:apply', event => {
				const [filterId, data, ctx] = event.getCompatData();
				this.onFilterApply(filterId, data, ctx);
			});
		}
		onTaskMenuItemClick(event) {
			const element = event.currentTarget;
			event.preventDefault();
			const roleId = element.dataset.id === 'view_all' ? '' : element.dataset.id;
			const url = element.dataset.url;
			main_core_events.EventEmitter.emit('Tasks.TopMenu:onItem', new main_core_events.BaseEvent({
				compatData: [roleId, url],
				data: [roleId, url]
			}));
			document.querySelectorAll('.tasks_role_link').forEach(element => {
				element.classList.remove('main-buttons-item-active');
			});
			element.classList.add('main-buttons-item-active');
		}
		onUserCounter(data) {
			if (this.currentUserId !== Number(data.userId) || !Object.prototype.hasOwnProperty.call(data, this.groupId)) {
				return;
			}
			Object.keys(data[this.groupId]).forEach(role => {
				const roleButton = document.getElementById(`group_panel_menu_${this.groupId ? this.groupId + '_' : ''}${role}`);
				if (roleButton) {
					roleButton.querySelector('.main-buttons-item-counter').innerText = this.getCounterValue(data[this.groupId][role].total);
				}
			});
		}
		getCounterValue(value) {
			if (!value) {
				return '';
			}
			const maxValue = 99;
			return value > maxValue ? `${maxValue}+` : value;
		}
		onFilterApply(filterId, data, ctx) {
			if (this.isRoleControlDisabled) {
				return;
			}
			let roleId = ctx.getFilterFieldsValues().ROLEID;
			document.querySelectorAll('.tasks_role_link').forEach(element => {
				element.classList.remove('main-buttons-item-active');
			});
			if (main_core.Type.isUndefined(roleId) || !roleId) {
				roleId = 'view_all';
			}
			const panelMenuNode = document.getElementById(`group_panel_menu_${this.groupId}_${roleId}`);
			if (panelMenuNode) {
				panelMenuNode.classList.add('main-buttons-item-active');
			}
		}
	}

	class MoreButton {
		constructor(params) {
			this.menu = null;
			this.class = {
				activeItem: 'menu-popup-item-sgm-accept-sm',
				inactiveItem: 'menu-popup-item-sgm-empty-sm'
			};
			this.init(params);
			return this;
		}
		init(params) {
			this.groupId = !main_core.Type.isUndefined(params.groupId) ? Number(params.groupId) : 0;
			this.bindingMenuItems = main_core.Type.isObject(params.bindingMenuItems) ? Object.values(params.bindingMenuItems) : [];
			this.userIsMember = main_core.Type.isBoolean(params.userIsMember) ? params.userIsMember : false;
			this.subscribedValue = main_core.Type.isBoolean(params.subscribedValue) ? params.subscribedValue : false;
			const moreButton = document.getElementById('group-menu-more-button');
			if (!moreButton) {
				return;
			}
			moreButton.addEventListener('click', this.showMoreMenu.bind(this));
		}
		showMoreMenu(event) {
			event.preventDefault();
			const bindingMenu = [];
			this.bindingMenuItems.forEach(item => {
				bindingMenu.push(item);
			});
			const menu = [];
			if (this.userIsMember) {
				menu.push({
					id: 'subscribe',
					text: main_core.Loc.getMessage('SONET_SGM_T_MORE_MENU_SUBSCRIBE'),
					className: this.subscribedValue ? this.class.activeItem : this.class.inactiveItem,
					onclick: () => {
						this.setSubscription(true);
					}
				});
				menu.push({
					id: 'unsubscribe',
					text: main_core.Loc.getMessage('SONET_SGM_T_MORE_MENU_UNSUBSCRIBE'),
					className: !this.subscribedValue ? this.class.activeItem : this.class.inactiveItem,
					onclick: () => {
						this.setSubscription(false);
					}
				});
			}
			if (bindingMenu.length > 0) {
				if (menu.length > 0) {
					menu.push({
						delimiter: true
					});
				}
				menu.push({
					text: main_core.Loc.getMessage('SONET_SGM_T_MORE_MENU_BINDING'),
					items: bindingMenu
				});
			}
			if (menu.length <= 0) {
				return;
			}
			const bindElement = event.target;
			this.menu = main_popup.MenuManager.create({
				id: 'group-more-menu',
				offsetTop: 5,
				offsetLeft: bindElement.offsetWidth - 18,
				angle: true,
				items: menu,
				events: {
					onPopupClose: () => {
						if (bindElement.tagName === 'BUTTON') {
							bindElement.classList.remove('ui-btn-active');
						}
					}
				},
				subMenuOptions: {}
			});
			this.menu.popupWindow.setBindElement(bindElement);
			this.menu.popupWindow.show();
		}
		setSubscription(value) {
			this.redrawMenu(value);
			main_core.ajax.runAction('socialnetwork.api.workgroup.setSubscription', {
				data: {
					params: {
						groupId: this.groupId,
						value: value ? 'Y' : 'N'
					}
				}
			}).then(data => {
				const eventData = {
					code: 'afterSetSubscribe',
					data: {
						groupId: this.groupId,
						value: data.RESULT === 'Y'
					}
				};
				window.top.BX.SidePanel.Instance.postMessageAll(window, 'sonetGroupEvent', eventData);
			}).catch(() => {
				this.redrawMenu(!value);
			});
		}
		redrawMenu(value) {
			if (!this.menu) {
				return;
			}
			const activeItem = this.menu.getMenuItem(value ? 'subscribe' : 'unsubscribe');
			const inactiveItem = this.menu.getMenuItem(value ? 'unsubscribe' : 'subscribe');
			if (activeItem) {
				activeItem.layout.item.classList.remove(this.class.inactiveItem);
				activeItem.layout.item.classList.add(this.class.activeItem);
			}
			if (inactiveItem) {
				inactiveItem.layout.item.classList.remove(this.class.activeItem);
				inactiveItem.layout.item.classList.add(this.class.inactiveItem);
			}
		}
	}

	class GroupMenu {
		constructor(params) {
			this.initialized = false;
			this.moreButtonInstance = null;
			this.init(params);
		}
		init(params) {
			if (this.initialized === true) {
				return;
			}
			this.initialized = true;
			this.pageId = main_core.Type.isStringFilled(params.pageId) ? params.pageId : '';
			this.currentUserId = !main_core.Type.isUndefined(params.currentUserId) ? Number(params.currentUserId) : 0;
			this.groupId = !main_core.Type.isUndefined(params.groupId) ? Number(params.groupId) : 0;
			this.groupType = main_core.Type.isStringFilled(params.groupType) ? params.groupType : '';
			this.projectTypeCode = main_core.Type.isStringFilled(params.projectTypeCode) ? params.projectTypeCode : '';
			this.userRole = main_core.Type.isStringFilled(params.userRole) ? params.userRole : '';
			this.userIsMember = main_core.Type.isBoolean(params.userIsMember) ? params.userIsMember : false;
			this.userIsAutoMember = main_core.Type.isBoolean(params.userIsAutoMember) ? params.userIsAutoMember : false;
			this.userIsScrumMaster = main_core.Type.isBoolean(params.userIsScrumMaster) ? params.userIsScrumMaster : false;
			this.isProject = main_core.Type.isBoolean(params.isProject) ? params.isProject : false;
			this.isScrumProject = main_core.Type.isBoolean(params.isScrumProject) ? params.isScrumProject : false;
			this.isOpened = main_core.Type.isBoolean(params.isOpened) ? params.isOpened : false;
			this.favoritesValue = main_core.Type.isBoolean(params.favoritesValue) ? params.favoritesValue : false;
			this.canInitiate = main_core.Type.isBoolean(params.canInitiate) ? params.canInitiate : false;
			this.canModify = main_core.Type.isBoolean(params.canModify) ? params.canModify : false;
			this.canProcessRequestsIn = main_core.Type.isBoolean(params.canProcessRequestsIn) ? params.canProcessRequestsIn : false;
			this.canPickTheme = main_core.Type.isBoolean(params.canPickTheme) ? params.canPickTheme : false;
			this.avatarPath = main_core.Type.isStringFilled(params.avatarPath) ? params.avatarPath : '';
			this.avatarType = main_core.Type.isStringFilled(params.avatarType) ? params.avatarType : '';
			this.urls = main_core.Type.isPlainObject(params.urls) ? params.urls : {};
			this.editFeaturesAllowed = main_core.Type.isBoolean(params.editFeaturesAllowed) ? params.editFeaturesAllowed : true;
			this.copyFeatureAllowed = main_core.Type.isBoolean(params.copyFeatureAllowed) ? params.copyFeatureAllowed : true;
			new JoinButton(params);
			new ControlButton(params);
			new Scrum(params);
			new Widget(params);
			new TaskEvent(params);
			this.moreButtonInstance = new MoreButton(params);
			new SonetGroupEvent(params, {
				moreButtonInstance: this.moreButtonInstance
			});
			const settingsButtonNode = document.getElementById('bx-group-menu-settings');
			if (settingsButtonNode) {
				const sonetGroupMenu = socialnetwork_common.GroupMenu.getInstance();
				sonetGroupMenu.favoritesValue = this.favoritesValue;
				settingsButtonNode.addEventListener('click', this.showMenu.bind(this));
			}
		}
		showMenu(event) {
			socialnetwork_common.Common.showGroupMenuPopup({
				bindElement: event.currentTarget,
				groupId: this.groupId,
				groupType: this.groupType,
				userRole: this.userRole,
				userIsMember: this.userIsMember,
				userIsAutoMember: this.userIsAutoMember,
				userIsScrumMaster: this.userIsScrumMaster,
				isProject: this.isProject,
				isScrumProject: this.isScrumProject,
				isOpened: this.isOpened,
				editFeaturesAllowed: this.editFeaturesAllowed,
				copyFeatureAllowed: this.copyFeatureAllowed,
				canPickTheme: this.canPickTheme,
				perms: {
					canInitiate: this.canInitiate,
					canProcessRequestsIn: this.canProcessRequestsIn,
					canModify: this.canModify
				},
				urls: {
					requestUser: main_core.Type.isStringFilled(this.urls.Invite) ? this.urls.Invite : `${this.urls.Edit}${this.urls.Edit.indexOf('?') >= 0 ? '&' : '?'}tab=invite`,
					edit: `${this.urls.Edit}${this.urls.Edit.indexOf('?') >= 0 ? '&' : '?'}tab=edit`,
					delete: this.urls.Delete,
					features: this.urls.Features,
					members: this.urls.GroupUsers,
					requests: this.urls.GroupRequests,
					requestsOut: this.urls.GroupRequestsOut,
					userRequestGroup: this.urls.UserRequestGroup,
					userLeaveGroup: this.urls.UserLeaveGroup,
					copy: this.urls.Copy
				}
			});
			event.preventDefault();
		}
	}

	exports.GroupMenu = GroupMenu;

})(this.BX.Intranet = this.BX.Intranet || {}, BX, BX.Socialnetwork.UI, BX.Event, BX.Main);
//# sourceMappingURL=script.js.map
