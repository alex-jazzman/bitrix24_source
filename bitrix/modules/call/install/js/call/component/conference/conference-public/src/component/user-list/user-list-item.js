import { Vuex } from "ui.vue.vuex";
import { Utils } from "im.lib.utils";
import { Utils as UtilsV2 } from 'im.v2.lib.utils';
import { MenuManager } from "main.popup";
import { EventType } from 'im.const';
import { ConferenceUserState, ConferenceStateType } from 'call.const';
import { EventEmitter } from "main.core.events";

const UserListItem = {
	props: {
		userId: {
			type: Number,
			required: true
		}
	},
	data: function() {
		return {
			renameMode: false,
			newName: '',
			renameRequested: false,
			menuId: 'bx-messenger-context-popup-external-data',
			onlineStates: [ConferenceUserState.Ready, ConferenceUserState.Connected]
		}
	},
	computed:
	{
		user()
		{
			return this.$store.getters['users/get'](this.userId, true);
		},
		// statuses
		currentUser()
		{
			return this.application.common.userId;
		},
		chatOwner()
		{
			if (!this.dialog)
			{
				return 0;
			}

			return this.dialog.ownerId;
		},
		isCurrentUserOwner()
		{
			return this.chatOwner === this.currentUser;
		},
		isCurrentUserExternal()
		{
			return !!this.conference.user.hash;
		},
		isMobile()
		{
			return Utils.device.isMobile();
		},
		isDesktop()
		{
			return Utils.platform.isBitrixDesktop();
		},
		isGuestWithDefaultName()
		{
			const guestDefaultName = this.$Bitrix.Loc.getMessage('BX_IM_COMPONENT_CALL_DEFAULT_USER_NAME');

			return this.user.id === this.currentUser && this.user.extranet && this.user.name === guestDefaultName;
		},
		userCallStatus()
		{
			return this.$store.getters['call/getUser'](this.user.id);
		},
		isUserInCall()
		{
			return this.onlineStates.includes(this.userCallStatus.state);
		},
		userInCallCount()
		{
			const usersInCall = Object.values(this.call.users).filter(user => {
				return this.onlineStates.includes(user.state);
			});

			return usersInCall.length;
		},
		isBroadcast()
		{
			return this.conference.common.isBroadcast;
		},
		presentersList()
		{
			return this.conference.common.presenters;
		},
		isUserPresenter()
		{
			return this.presentersList.includes(this.user.id);
		},
		// end statuses
		formattedSubtitle()
		{
			let subtitle = '';
			const role = this.$Bitrix.Loc.getMessage(
				this.user.id === this.chatOwner
					? 'BX_IM_COMPONENT_CALL_USER_LIST_STATUS_OWNER'
					: 'BX_IM_COMPONENT_CALL_USER_LIST_STATUS_PARTICIPANT',
			);

			if (this.user.id === this.currentUser)
			{
				subtitle = this.$Bitrix.Loc.getMessage('BX_IM_COMPONENT_CALL_USER_LIST_STATUS_CURRENT_USER_MSGVER_1', {
					'#ROLE#': role,
				});
			}
			else
			{
				subtitle = role;
			}

			// if (!this.user.extranet && !this.user.isOnline)
			// {
			// 	subtitles.push(this.$Bitrix.Loc.getMessage('BX_IM_COMPONENT_CALL_USER_LIST_STATUS_OFFLINE'));
			// }

			return subtitle;
		},
		isMenuNeeded()
		{
			return this.getMenuItems.length > 0;
		},
		menuItems()
		{
			const items = [];
			// for self
			if (this.user.id === this.currentUser)
			{
				// self-rename
				if (this.isCurrentUserExternal)
				{
					items.push({
						text: this.$Bitrix.Loc.getMessage('BX_IM_COMPONENT_CALL_USER_LIST_MENU_RENAME_SELF'),
						onclick: () => {
							this.closeMenu();
							this.onRenameStart();
						}
					});
				}
				// change background
				if (this.isDesktop)
				{
					items.push({
						text: this.$Bitrix.Loc.getMessage('BX_IM_COMPONENT_CALL_USER_LIST_MENU_CHANGE_BACKGROUND'),
						onclick: () => {
							this.closeMenu();
							this.$emit('userChangeBackground');
						}
					});
				}
			}
			// for other users
			else
			{
				// force-rename
				if (this.isCurrentUserOwner && this.user.externalAuthId === 'call')
				{
					items.push({
						text: this.$Bitrix.Loc.getMessage('BX_IM_COMPONENT_CALL_USER_LIST_MENU_RENAME'),
						onclick: () => {
							this.closeMenu();
							this.onRenameStart();
						}
					});
				}
				// kick
				if (this.isCurrentUserOwner && !this.isUserPresenter)
				{
					items.push({
						text: this.$Bitrix.Loc.getMessage('BX_IM_COMPONENT_CALL_USER_LIST_MENU_KICK'),
						onclick: () => {
							this.closeMenu();
							this.$emit('userKick', {user: this.user});
						}
					});
				}
				if (this.isUserInCall && this.userCallStatus.cameraState && this.userInCallCount > 2)
				{
					// pin
					if (!this.userCallStatus.pinned)
					{
						items.push({
							text: this.$Bitrix.Loc.getMessage('BX_IM_COMPONENT_CALL_USER_LIST_MENU_PIN'),
							onclick: () => {
								this.closeMenu();
								this.$emit('userPin', {user: this.user});
							}
						});
					}
					// unpin
					else
					{
						items.push({
							text: this.$Bitrix.Loc.getMessage('BX_IM_COMPONENT_CALL_USER_LIST_MENU_UNPIN'),
							onclick: () => {
								this.closeMenu();
								this.$emit('userUnpin');
							}
						});
					}

				}
				// open 1-1 chat and profile
				if (this.isDesktop && !this.user.extranet)
				{
					items.push({
						text: this.$Bitrix.Loc.getMessage('BX_IM_COMPONENT_CALL_USER_LIST_MENU_OPEN_CHAT'),
						onclick: () => {
							this.closeMenu();
							this.$emit('userOpenChat', {user: this.user});
						}
					});
					items.push({
						text: this.$Bitrix.Loc.getMessage('BX_IM_COMPONENT_CALL_USER_LIST_MENU_OPEN_PROFILE'),
						onclick: () => {
							this.closeMenu();
							this.$emit('userOpenProfile', {user: this.user});
						}
					});
				}
				// insert name
				items.push({
					text: this.$Bitrix.Loc.getMessage('BX_IM_COMPONENT_CALL_USER_LIST_MENU_INSERT_NAME'),
					onclick: () => {
						this.closeMenu();
						this.$emit('userInsertName', {user: this.user});
					}
				});
			}

			return items;
		},
		avatarWrapClasses()
		{
			const classes = ['bx-im-component-call-user-list-item-avatar-wrap'];

			if (this.userCallStatus.talking)
			{
				classes.push('bx-im-component-call-user-list-item-avatar-wrap-talking');
			}

			return classes;
		},
		avatarClasses()
		{
			const classes = ['bx-im-component-call-user-list-item-avatar'];

			if (!this.user.avatar && this.user.extranet)
			{
				classes.push('bx-im-component-call-user-list-item-avatar-extranet');
			}
			else if (!this.user.avatar && !this.user.extranet)
			{
				classes.push('bx-im-component-call-user-list-item-avatar-default');
			}

			return classes;
		},
		avatarStyle()
		{
			const style = {};

			if (this.user.avatar)
			{
				style.backgroundImage = `url('${this.user.avatar}')`;
			}
			else if (!this.user.avatar && !this.user.extranet)
			{
				style.backgroundColor = this.user.color;
			}

			return style;
		},
		avatarInnerText()
		{
			if (!this.user.avatar && !this.user.extranet)
			{
				return UtilsV2.text.getFirstLetters(this.user.name).toUpperCase();
			}

			return '';
		},
		isCallStatusPanelNeeded()
		{
			if (this.isBroadcast)
			{
				return this.conference.common.state === ConferenceStateType.call && this.isUserInCall && this.isUserPresenter;
			}
			else
			{
				return this.conference.common.state === ConferenceStateType.call && this.isUserInCall;
			}
		},
		callMenuIconClasses()
		{
			return ['bx-im-component-call-user-list-item-icons-icon bx-im-component-call-user-list-item-icons-menu'];
		},
		callLeftIconClasses()
		{
			const classes = ['bx-im-component-call-user-list-item-icons-icon bx-im-component-call-user-list-item-icons-left'];

			if (this.userCallStatus.floorRequestState)
			{
				classes.push('bx-im-component-call-user-list-item-icons-floor-request visible');
			}
			else if (this.userCallStatus.screenState)
			{
				classes.push('bx-im-component-call-user-list-item-icons-screen visible');
			}

			return classes;
		},
		callCenterIconClasses()
		{
			const classes = ['bx-im-component-call-user-list-item-icons-icon bx-im-component-call-user-list-item-icons-center'];

			if (this.userCallStatus.microphoneState)
			{
				classes.push('bx-im-component-call-user-list-item-icons-mic-on');
			}
			else
			{
				classes.push('bx-im-component-call-user-list-item-icons-mic-off');
			}

			return classes;
		},
		callRightIconClasses()
		{
			const classes = ['bx-im-component-call-user-list-item-icons-icon bx-im-component-call-user-list-item-icons-right'];

			if (this.userCallStatus.cameraState)
			{
				classes.push('bx-im-component-call-user-list-item-icons-camera-on');
			}
			else
			{
				classes.push('bx-im-component-call-user-list-item-icons-camera-off');
			}

			return classes;
		},
		bodyClasses()
		{
			const classes = ['bx-im-component-call-user-list-item-body'];

			if (!this.isUserInCall)
			{
				classes.push('bx-im-component-call-user-list-item-body-offline');
			}

			return classes;
		},
		itemClasses()
		{
			const classes = ['bx-im-component-call-user-list-item'];

			if (this.user.id === this.chatOwner)
			{
				classes.push('bx-im-component-call-user-list-item-owner');
			}

			return classes;
		},
		...Vuex.mapState({
			application: state => state.application,
			conference: state => state.conference,
			call: state => state.call,
			dialog: state => state.dialogues.collection[state.application.dialog.dialogId]
		})
	},
	methods:
	{
		openMenu()
		{
			if (this.menuPopup)
			{
				this.closeMenu();
				return false;
			}

			//menu for other items
			const existingMenu = MenuManager.getMenuById(this.menuId);
			if (existingMenu)
			{
				existingMenu.destroy();
			}

			this.menuPopup = MenuManager.create({
				id: this.menuId,
				className: 'bx-conference-user-list-item-context-menu',
				background: '#00428F',
				contentBackground: '#00428F',
				darkMode: true,
				contentBorderRadius: '6px',
				borderRadius: '6px',
				bindElement: this.$refs['user-menu'],
				items: this.menuItems,
				events: {
					onPopupClose: () => this.menuPopup.destroy(),
					onPopupDestroy: () => this.menuPopup = null
				},
			});

			this.menuPopup.show();
		},
		closeMenu()
		{
			this.menuPopup.destroy();
			this.menuPopup = null;
		},
		onRenameStart()
		{
			this.newName = this.user.name;
			this.renameMode = true;
			this.$nextTick(() => {
				this.$refs['rename-input'].focus();
				this.$refs['rename-input'].select();
			});
		},
		onRenameKeyDown(event)
		{
			//enter
			if (event.keyCode === 13)
			{
				this.changeName();
			}
			//escape
			else if (event.keyCode === 27)
			{
				this.renameMode = false;
			}
		},
		changeName()
		{
			if (this.user.name === this.newName.trim() || this.newName === '')
			{
				this.renameMode = false;

				return false;
			}

			this.$emit('userChangeName', {user: this.user, newName: this.newName});
			this.$nextTick(() => {
				this.renameMode = false;
			});
		},
		onFocus(event)
		{
			EventEmitter.emit(EventType.conference.userRenameFocus, event);
		},
		onBlur(event)
		{
			EventEmitter.emit(EventType.conference.userRenameBlur, event);
		},
	},
	//language=Vue
	template: `
		<div :class="itemClasses">
			<!-- Avatar -->
			<div :class="avatarWrapClasses">
				<div :class="avatarClasses" :style="avatarStyle">
					<div class="bx-im-component-call-user-list-item-avatar-inner-text" v-if="avatarInnerText">{{ avatarInnerText }}</div>
				</div>
			</div>
			<!-- Body -->
			<div :class="bodyClasses">
				<!-- Introduce yourself blinking mode -->
				<template v-if="!renameMode && isGuestWithDefaultName">
					<div class="bx-im-component-call-user-list-item-body-left">
						<div @click="onRenameStart" class="bx-im-component-call-user-list-introduce-yourself">
							<div class="bx-im-component-call-user-list-introduce-yourself-text">{{ $Bitrix.Loc.getMessage('BX_IM_COMPONENT_CALL_USER_LIST_INTRODUCE_YOURSELF') }}</div>
						</div>
					</div>
				</template>
				<!-- Rename mode -->
				<template v-else-if="renameMode">
					<div class="bx-im-component-call-user-list-item-body-left">
						<div class="bx-im-component-call-user-list-change-name-container">
							<div @click="renameMode = false" class="bx-im-component-call-user-list-change-name-cancel"></div>
							<input @keydown="onRenameKeyDown" @focus="onFocus" @blur="onBlur" v-model="newName" :ref="'rename-input'" type="text" class="bx-im-component-call-user-list-change-name-input">
							<div v-if="!renameRequested" @click="changeName" class="bx-im-component-call-user-list-change-name-confirm"></div>
							<div v-else class="bx-im-component-call-user-list-change-name-loader">
								<div class="bx-im-component-call-user-list-change-name-loader-icon"></div>
							</div>
						</div>
					</div>
				</template>
				<template v-if="!renameMode && !isGuestWithDefaultName">
					<div class="bx-im-component-call-user-list-item-body-left">
						<div class="bx-im-component-call-user-list-item-name-wrap">
							<!-- Name -->
							<div class="bx-im-component-call-user-list-item-name">{{ user.name }}</div>
							<!-- Status subtitle -->
							<div v-if="formattedSubtitle !== ''" class="bx-im-component-call-user-list-item-name-subtitle">{{ formattedSubtitle }}</div>
						</div>
					</div>
				</template>
				<template v-if="isCallStatusPanelNeeded">
					<div class="bx-im-component-call-user-list-item-icons">
						<!-- Context menu icon -->
						<div :class="callMenuIconClasses" v-if="menuItems.length > 0 && !isMobile" @click="openMenu" ref="user-menu"></div>
						<div :class="callLeftIconClasses"></div>
						<div :class="callCenterIconClasses"></div>
						<div :class="callRightIconClasses"></div>
					</div>
				</template>
			</div>
		</div>
	`
};

export {UserListItem};