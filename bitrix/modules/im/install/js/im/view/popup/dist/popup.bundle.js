/* eslint-disable */
this.BX = this.BX || {};
this.BX.Messenger = this.BX.Messenger || {};
(function (exports, ui_vue, im_const) {
	'use strict';

	const Chat = {
		props: ['value', 'popupInstance'],
		data() {
			return {
				chat: {},
				hasError: false,
				requestFinished: false
			};
		},
		created() {
			const chatData = this.getChat(this.value);
			if (chatData) {
				this.chat = chatData;
				this.requestFinished = true;
			} else {
				this.requestChatData(this.value);
			}
		},
		mounted() {
			this.popupInstance.show();
		},
		beforeDestroy() {
			this.popupInstance.destroy();
		},
		methods: {
			getChat(dialogId) {
				return this.$store.getters['dialogues/get'](dialogId);
			},
			requestChatData(dialogId) {
				this.$Bitrix.RestClient.get().callMethod(im_const.RestMethod.imChatGet, {
					dialog_id: dialogId
				}).then(response => {
					this.$Bitrix.Data.get('controller').executeRestAnswer(im_const.RestMethodHandler.imChatGet, response);
					this.chat = this.getChat(this.value);
					this.requestFinished = true;
				}).catch(error => {
					this.hasError = true;
					console.error(error);
					this.requestFinished = true;
				});
			},
			//events
			onOpenChat(event) {
				this.popupInstance.destroy();
				BXIM.openMessenger(this.value);
			},
			onOpenHistory(event) {
				this.popupInstance.destroy();
				BXIM.openHistory(this.value);
			}
		},
		computed: {
			avatarStyles() {
				const styles = {};
				if (this.emptyAvatar) {
					styles.backgroundColor = this.chat.color;
				}
				return styles;
			},
			chatAvatar() {
				if (this.emptyAvatar) {
					return '/bitrix/js/im/images/blank.gif';
				} else {
					return this.chat.avatar;
				}
			},
			emptyAvatar() {
				return this.chat.avatar === '' || this.chat.avatar.indexOf('/bitrix/js/im/images/blank.gif') >= 0;
			}
		},
		//language=Vue
		template: `
		<div class="bx-messenger-external-data" style="width: 272px; max-width: 272px; height: 100px;">
			<div v-if="requestFinished && !hasError">
				<div class="bx-messenger-external-avatar">
					<div class="bx-messenger-panel-avatar bx-messenger-panel-avatar-chat">
						<img
							:src="chatAvatar"
							:alt="chat.name"
							:style="avatarStyles"
							:class="[emptyAvatar ? 'bx-messenger-panel-avatar-img-default' : '', 'bx-messenger-panel-avatar-img']"
						>
					</div>
					<span v-if="chat.extranet" class="bx-messenger-panel-title"><div class="bx-messenger-user-extranet">{{ chat.name }}</div></span>
					<span v-else class="bx-messenger-panel-title">{{ chat.name }}</span>
					<span class="bx-messenger-panel-desc">{{ $Bitrix.Loc.getMessage('IM_VIEW_POPUP_CONTENT_GROUP_CHAT') }}</span>
				</div>
				<div class="bx-messenger-external-data-buttons">
				<span class="bx-notifier-item-button bx-notifier-item-button-white" @click="onOpenChat">
					{{ $Bitrix.Loc.getMessage('IM_VIEW_POPUP_CONTENT_OPEN_CHAT') }}
				</span>
					<span class="bx-notifier-item-button bx-notifier-item-button-white" @click="onOpenHistory">
					{{ $Bitrix.Loc.getMessage('IM_VIEW_POPUP_CONTENT_OPEN_HISTORY') }}
				</span>
				</div>
			</div>
			<span v-else-if="!requestFinished && !hasError" class="bx-messenger-content-load-img"></span>
			<div v-else-if="requestFinished && hasError">
				{{ $Bitrix.Loc.getMessage('IM_VIEW_POPUP_CONTENT_NO_ACCESS') }}
			</div>
		</div>
	`
	};

	const User = {
		props: ['value', 'popupInstance'],
		data() {
			return {
				user: {},
				hasError: false,
				requestFinished: false
			};
		},
		created() {
			const userData = this.getUser(this.value);
			if (userData) {
				this.user = userData;
				this.requestFinished = true;
			} else {
				this.requestUserData(this.value);
			}
		},
		mounted() {
			this.popupInstance.show();
		},
		beforeDestroy() {
			this.popupInstance.destroy();
		},
		methods: {
			getUser(userId) {
				return this.$store.getters['users/get'](userId);
			},
			requestUserData(userId) {
				this.$Bitrix.RestClient.get().callMethod(im_const.RestMethod.imUserGet, {
					ID: userId
				}).then(response => {
					this.$Bitrix.Data.get('controller').executeRestAnswer(im_const.RestMethodHandler.imUserGet, response);
					this.user = this.getUser(this.value);
					this.requestFinished = true;
				}).catch(error => {
					this.hasError = true;
					console.error(error);
					this.requestFinished = true;
				});
			},
			//events
			onOpenChat(event) {
				this.popupInstance.destroy();
				BXIM.openMessenger(this.value);
			},
			onOpenHistory(event) {
				this.popupInstance.destroy();
				BXIM.openHistory(this.value);
			}
		},
		computed: {
			avatarStyles() {
				const styles = {};
				if (this.emptyAvatar) {
					styles.backgroundColor = this.chat.color;
				}
				return styles;
			},
			userAvatar() {
				if (this.emptyAvatar) {
					return '/bitrix/js/im/images/blank.gif';
				} else {
					return this.user.avatar;
				}
			},
			emptyAvatar() {
				return this.user.avatar === '' || this.user.avatar.indexOf('/bitrix/js/im/images/blank.gif') >= 0;
			},
			botStyles() {
				//todo handle all the bot types im/install/js/im/im.js:5887
				return 'bx-messenger-user-bot';
			},
			userStatusText() {
				//todo remove old code
				return BX.MessengerCommon.getUserStatus(this.user.id, false).statusText;
			},
			userStatusClass() {
				//todo remove old code
				return 'bx-messenger-panel-avatar-status-' + BX.MessengerCommon.getUserStatus(this.user.id, true);
			},
			userPosition() {
				//todo remove old code
				return BX.MessengerCommon.getUserPosition(this.user.id);
			}
		},
		//language=Vue
		template: `
		<div class="bx-messenger-external-data" style="width: 272px; max-width: 272px; height: 100px;">
			<div v-if="requestFinished && !hasError">
				<div class="bx-messenger-external-avatar">
					<div :class="[userStatusClass, 'bx-messenger-panel-avatar']">
						<img
							:src="userAvatar"
							:style="avatarStyles"
							:class="[emptyAvatar ? 'bx-messenger-panel-avatar-img-default' : '', 'bx-messenger-panel-avatar-img']"
							:alt="user.name"
						/>
						<span :title="userStatusText" class="bx-messenger-panel-avatar-status"></span>
					</div>
	
					<span v-if="user.extranet" class="bx-messenger-panel-title"><div class="bx-messenger-user-extranet">{{ user.name }}</div></span>
					<span v-else-if="user.bot" class="bx-messenger-panel-title"><div :class="botStyles">{{ user.name }}</div></span>
					<span v-else class="bx-messenger-panel-title">{{ user.name }}</span>
	
					<span class="bx-messenger-panel-desc">{{ userPosition }}</span>
				</div>
				<div class="bx-messenger-external-data-buttons">
					<span class="bx-notifier-item-button bx-notifier-item-button-white" @click="onOpenChat">
						{{ $Bitrix.Loc.getMessage('IM_VIEW_POPUP_USER_OPEN_CHAT') }}
					</span>
					<span class="bx-notifier-item-button bx-notifier-item-button-white" @click="onOpenHistory">
						{{ $Bitrix.Loc.getMessage('IM_VIEW_POPUP_CONTENT_OPEN_HISTORY') }}
					</span>
				</div>
			</div>
			<span v-else-if="!requestFinished && !hasError" class="bx-messenger-content-load-img"></span>
			<div v-else-if="requestFinished && hasError">
				{{ $Bitrix.Loc.getMessage('IM_VIEW_POPUP_CONTENT_NO_ACCESS') }}
			</div>
		</div>
	`
	};

	const Users = {
		props: ['value', 'popupInstance'],
		data() {
			return {
				users: {},
				hasError: false,
				requestFinished: false
			};
		},
		created() {
			const needRequest = this.isNeedUserRequest(this.value);
			if (needRequest) {
				this.requestUserData(this.value);
			} else
				//!needRequest
				{
					this.users = this.getUsersForPopup();
					this.requestFinished = true;
				}
		},
		mounted() {
			this.popupInstance.show();
		},
		beforeDestroy() {
			this.popupInstance.destroy();
		},
		computed: {
			popupHeight() {
				let height = this.value.length * 30;
				if (height > 150) {
					height = 150;
				}
				return height + 'px';
			}
		},
		methods: {
			getUser(userId) {
				return this.$store.getters['users/get'](userId);
			},
			getUsersForPopup() {
				return this.value.map(userId => {
					return this.getUser(userId);
				});
			},
			getUserAvatar(user) {
				if (this.isEmptyAvatar(user)) {
					return '/bitrix/js/im/images/blank.gif';
				} else {
					return user.avatar;
				}
			},
			isEmptyAvatar(user) {
				return user.avatar === '' || user.avatar.indexOf('/bitrix/js/im/images/blank.gif') >= 0;
			},
			getAvatarStyles(user) {
				const styles = {};
				if (this.isEmptyAvatar(user)) {
					styles.backgroundColor = user.color;
				}
				return styles;
			},
			getUserStatusClass(user) {
				return `bx-notifier-popup-avatar-status-${user.status}`;
			},
			isNeedUserRequest(users) {
				for (let i = 0; i < users.length; i++) {
					if (!this.getUser(users[i])) {
						return true;
					}
				}
				return false;
			},
			requestUserData(userIds) {
				this.$Bitrix.RestClient.get().callMethod(im_const.RestMethod.imUserListGet, {
					ID: userIds
				}).then(response => {
					this.$Bitrix.Data.get('controller').executeRestAnswer(im_const.RestMethodHandler.imUserListGet, response);
					this.users = this.getUsersForPopup();
					this.requestFinished = true;
				}).catch(error => {
					this.hasError = true;
					console.error(error);
					this.requestFinished = true;
				});
			},
			onUserClick(userId) {
				this.popupInstance.destroy();
				BXIM.openMessenger(userId);
			}
		},
		//language=Vue
		template: `
		<div
			class="bx-im-vue-popup-container" 
			:style="{height: popupHeight, width: '180px', display: 'flex', alignItems: 'center', justifyContent: 'center'}"
		>
			<span v-if="requestFinished && !hasError" class="bx-notifier-item-help-popup">
				<a 
					v-for="user in users"
					class="bx-notifier-item-help-popup-img"
					@click.prevent="onUserClick(user.id)"
				>
					<span :class="[getUserStatusClass(user), 'bx-notifier-popup-avatar']">
						<img 
							:src="getUserAvatar(user)"
							:class="['bx-notifier-popup-avatar-img', isEmptyAvatar(user) ? 'bx-notifier-popup-avatar-img-default' : '']"
							:style="getAvatarStyles(user)"
							:alt="user.name"
						/>
					</span>
					<span 
						:class="['bx-notifier-item-help-popup-name', user.extranet ? 'bx-notifier-popup-avatar-extranet' : '']"
					>
						{{ user.name }}
					</span>
				</a>
			</span>
			<span v-else-if="!requestFinished && !hasError" class="bx-messenger-content-load-img"></span>
			<div v-else-if="requestFinished && hasError">
				{{ $Bitrix.Loc.getMessage('IM_VIEW_POPUP_CONTENT_NO_ACCESS') }}
			</div>
		</div>
	`
	};

	const Popup = {
		props: ['type', 'value', 'popupInstance'],
		components: {
			Chat,
			User,
			Users
		},
		//language=Vue
		template: `
		<component :is="type" :value="value" :popupInstance="popupInstance"/>
	`
	};

	exports.Popup = Popup;

})(this.BX.Messenger.View = this.BX.Messenger.View || {}, BX, BX.Messenger.Const);
//# sourceMappingURL=popup.bundle.js.map
