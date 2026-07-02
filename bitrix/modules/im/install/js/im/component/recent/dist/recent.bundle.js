/* eslint-disable */
(function (ui_vue, ui_vue_vuex, im_const, ui_designTokens, im_lib_utils, main_core_events) {
	'use strict';

	const RecentItem = ui_vue.BitrixVue.localComponent('bx-im-component-recent-item', {
		props: ['itemData'],
		methods: {
			onClick(event) {
				this.$emit('click', {
					id: this.item.id,
					$event: event
				});
			},
			onRightClick(event) {
				this.$emit('rightClick', {
					id: this.item.id,
					$event: event
				});
			},
			formatDate(date) {
				let weekDays = [this.localize['IM_RECENT_WEEKDAY_0'], this.localize['IM_RECENT_WEEKDAY_1'], this.localize['IM_RECENT_WEEKDAY_2'], this.localize['IM_RECENT_WEEKDAY_3'], this.localize['IM_RECENT_WEEKDAY_4'], this.localize['IM_RECENT_WEEKDAY_5'], this.localize['IM_RECENT_WEEKDAY_6']];
				date = date ? new Date(date) : new Date();
				let currentDate = new Date();
				let dateWeekDay = date.getDay() - (date.getDay() === 0 ? -6 : 1);
				let currentDayOfWeek = currentDate.getDay() - (currentDate.getDay() === 0 ? -6 : 1);
				let weekStartDate = currentDate.getDate() - currentDayOfWeek;
				let weekStartTime = new Date(new Date(new Date().setDate(weekStartDate)).setHours(0, 0, 0)).getTime();
				if (date.getFullYear() === currentDate.getFullYear() && date.getMonth() === currentDate.getMonth() && date.getDate() === currentDate.getDate()) {
					return im_lib_utils.Utils.date.format(date, 'H:i');
				} else if (date.getTime() > weekStartTime) {
					return weekDays[dateWeekDay];
				} else if (date.getFullYear() === currentDate.getFullYear()) {
					return im_lib_utils.Utils.date.format(date, 'd.m');
				} else {
					return im_lib_utils.Utils.date.format(date, 'd.m.Y');
				}
			},
			getTypingUsers() {
				if (this.isChat && this.dialogData && this.isSomeoneTyping) {
					return this.dialogData.writingList;
				}
				if (this.isUser && this.isSomeoneTyping) {
					const userDialog = this.getUserDialog(this.rawItem.userId);
					return userDialog.writingList;
				}
				return false;
			},
			getUserDialog(userId) {
				return this.$root.$store.getters['dialogues/get'](userId);
			}
		},
		computed: {
			ItemTypes: () => im_const.TemplateTypes,
			rawItem() {
				return this.itemData;
			},
			item() {
				return {
					id: this.rawItem.id,
					template: this.rawItem.template,
					type: this.rawItem.chatType,
					sectionCode: this.rawItem.sectionCode,
					title: {
						leftIcon: this.titleLeftIcon,
						value: this.titleValue,
						rightIcon: this.titleRightIcon
					},
					subtitle: {
						leftIcon: this.subtitleLeftIcon,
						value: this.subtitleValue
					},
					avatar: {
						url: this.avatarUrl,
						bottomRightIcon: this.avatarBottomRightIcon
					},
					message: this.rawItem.message,
					date: {
						leftIcon: this.dateLeftIcon,
						value: this.formatDate(this.rawItem.message ? this.rawItem.message.date : 0)
					},
					counter: {
						value: this.rawItem.counter,
						leftIcon: this.counterLeftIcon
					},
					notification: false
				};
			},
			//background for pinned item
			listItemStyle() {
				if (this.rawItem.sectionCode === im_const.RecentSection.pinned) {
					return {
						backgroundColor: '#f7f7f7'
					};
				}
				return {};
			},
			//avatar background color if no image
			imageStyle() {
				let backgroundColor = '';
				if (!this.item.avatar.url) {
					backgroundColor = this.imageColor;
				}
				return {
					backgroundColor
				};
			},
			//color of user, chat or notify
			imageColor() {
				if (this.isUser && this.userData) {
					return this.userData.color;
				}
				if (this.isChat && this.dialogData) {
					return this.dialogData.color;
				}
				if (this.isNotificationChat) {
					return this.rawItem.color;
				}
			},
			//class for general chat icon
			imageClass() {
				let classes = 'bx-im-recent-item-image ';
				if (this.isGeneralChat) {
					classes += 'bx-im-recent-item-image-general';
				}
				return classes;
			},
			//text on avatar if no image
			avatarText() {
				const title = this.item.title.value.replace(/[\.\,\'\"]/g, ''); // TODO set special chars entity
				const words = title.split(' ');
				if (words.length > 1) {
					return words[0].charAt(0) + words[1].charAt(0);
				} else if (words.length === 1) {
					return words[0].charAt(0);
				}
			},
			//placeholder for general chat, url for users and chats
			avatarUrl() {
				if (this.isGeneralChat) {
					return '/bitrix/js/im/images/blank.gif';
				}
				if (this.isUser && this.userData) {
					return this.userData.avatar;
				}
				if (this.isChat && this.dialogData) {
					return this.dialogData.avatar;
				}
			},
			//Priority of avatar bottom right icon (only for users)
			//1.typing
			//2.mobile online
			//3.manual set away or dnd
			//4.online
			//5.offline
			avatarBottomRightIcon() {
				if (this.isUser && !this.isBot) {
					if (this.isSomeoneTyping) {
						return 'typing';
					} else if (this.userData) {
						if (this.userData.isMobileOnline) {
							return 'mobile-online';
						} else if (this.userData.isOnline) {
							return this.userData.status;
						} else {
							return 'offline';
						}
					}
				}
				return 'none';
			},
			//Title left icon
			//For users:
			//1.absent
			//2.birthday
			//For chats - type of chat
			titleLeftIcon() {
				if (this.isUser) {
					if (this.isBot) {
						return 'bot';
					} else if (this.isExtranet) {
						return 'extranet';
					} else if (this.isNetwork) {
						return 'network';
					} else if (this.userData) {
						if (this.userData.isAbsent) {
							return 'absent';
						} else if (this.userData.isBirthday) {
							return 'birthday';
						}
					}
					return '';
				}
				if (this.isChat) {
					return this.rawItem.chatType;
				}
			},
			//chat name
			titleValue() {
				if (this.isUser && this.userData) {
					return this.userData.name;
				}
				if (this.isChat && this.dialogData) {
					return this.dialogData.name;
				}
				if (this.isNotificationChat) {
					return this.rawItem.title;
				}
				return this.rawItem.title;
			},
			//muted notifications icon for chats
			titleRightIcon() {
				return this.isChatMuted ? 'muted' : '';
			},
			//icon if we wrote last message
			subtitleLeftIcon() {
				if (this.isLastMessageAuthor) {
					return 'author';
				}
				return '';
			},
			//subtitle - typing message or last message text
			subtitleValue() {
				if (this.isSomeoneTyping && this.isUser) {
					return this.localize['IM_RECENT_USER_TYPING'];
				} else if (this.isSomeoneTyping && this.isChat) {
					const typingUsers = this.getTypingUsers();
					if (typingUsers.length === 1) {
						const nameWords = typingUsers[0].userName.split(' ');
						return `${nameWords[0]} ${this.localize['IM_RECENT_USER_TYPING']}`;
					} else if (typingUsers.length > 1) {
						return `${this.localize['IM_RECENT_USERS_TYPING']}`;
					}
				}
				if (!this.rawItem.message || !this.rawItem.message.text) {
					return this.userData.workPosition;
				}
				return this.rawItem.message.text;
			},
			//message read status icon (if current user's message was read by someone in chat)
			dateLeftIcon() {
				if (!this.isLastMessageAuthor || this.isBot || this.isNotificationChat) {
					return '';
				}
				if (!this.rawItem.message) {
					return '';
				}
				if (this.rawItem.message.status === im_const.MessageStatus.error) {
					return 'error';
				}
				const wasRead = this.rawItem.message.status === im_const.MessageStatus.delivered;
				if (wasRead) {
					return 'read';
				}
				return 'unread';
			},
			//pinned icon
			counterLeftIcon() {
				return this.rawItem.pinned ? 'pinned' : '';
			},
			//grey counter style for muted chats
			counterClasses() {
				const classes = ['bx-im-recent-item-bottom-counter-value'];
				if (this.isChatMuted) {
					classes.push('bx-im-recent-item-bottom-counter-value-muted');
				}
				return classes;
			},
			formattedCounter() {
				return this.item.counter.value > 99 ? '99+' : this.item.counter.value;
			},
			userData() {
				return this.$root.$store.getters['users/get'](this.rawItem.userId, true);
			},
			dialogData() {
				return this.$root.$store.getters['dialogues/getByChatId'](this.rawItem.chatId);
			},
			currentUserId() {
				return this.$root.$store.state.application.common.userId;
			},
			isChat() {
				return [im_const.ChatTypes.chat, im_const.ChatTypes.open].includes(this.rawItem.chatType);
			},
			isUser() {
				return this.rawItem.chatType === im_const.ChatTypes.user;
			},
			isExtranet() {
				if (this.isUser && this.userData) {
					return this.userData.extranet;
				}
				return false;
			},
			isNetwork() {
				if (this.isUser && this.userData) {
					return this.userData.network;
				}
				return false;
			},
			isBot() {
				if (this.isUser && this.userData) {
					return this.userData.bot;
				}
				return false;
			},
			isNotificationChat() {
				return this.rawItem.id === 'notify';
			},
			isGeneralChat() {
				return this.rawItem.id === 'chat1';
			},
			isSomeoneTyping() {
				if (this.isUser) {
					const userDialog = this.getUserDialog(this.rawItem.userId);
					if (!userDialog) {
						return false;
					}
					return Object.keys(userDialog.writingList).length > 0;
				} else if (this.isChat && this.dialogData) {
					return Object.keys(this.dialogData.writingList).length > 0;
				}
				return false;
			},
			isLastMessageAuthor() {
				if (!this.rawItem.message) {
					return false;
				}
				return this.currentUserId === this.rawItem.message.senderId;
			},
			isChatMuted() {
				if (this.isChat && this.dialogData) {
					const isMuted = this.dialogData.muteList.find(element => {
						return element === this.currentUserId;
					});
					return !!isMuted;
				}
				return false;
			},
			localize() {
				return ui_vue.BitrixVue.getFilteredPhrases('IM_RECENT_', this);
			}
		},
		template: `
		<div class="bx-im-recent-item" :style="listItemStyle" @click="onClick" @click.right="onRightClick">
			<template v-if="item.template !== ItemTypes.placeholder">
				<div v-if="item.avatar" class="bx-im-recent-item-image-wrap">
					<img v-if="item.avatar.url" :src="item.avatar.url" :style="imageStyle" :class="imageClass" alt="">
					<div v-else-if="!item.avatar.url" :style="imageStyle" class="bx-im-recent-item-image-text">{{ avatarText }}</div>	
					<div v-if="item.avatar.topLeftIcon" :class="'bx-im-recent-icon-avatar-top-left bx-im-recent-avatar-top-left-' + item.avatar.topLeftIcon"></div>
					<div v-if="item.avatar.bottomRightIcon" :class="'bx-im-recent-icon-avatar-bottom-right bx-im-recent-avatar-bottom-right-' + item.avatar.bottomRightIcon"></div>
				</div>
				<div class="bx-im-recent-item-content">
					<div class="bx-im-recent-item-content-header">
						<div v-if="item.title" class="bx-im-recent-item-header-title">
							<div v-if="item.title.leftIcon" :class="'bx-im-recent-icon-title-left bx-im-recent-icon-title-left-' + item.title.leftIcon"></div>
							<span class="bx-im-recent-item-header-title-text">{{ item.title.value }}</span>
							<div v-if="item.title.rightIcon" :class="'bx-im-recent-icon-title-right bx-im-recent-icon-title-right-' + item.title.rightIcon"></div>
						</div>
						<div v-if="item.date" class="bx-im-recent-item-header-date">
							<div v-if="item.date.leftIcon" :class="'bx-im-recent-icon-date-left bx-im-recent-icon-date-left-' + item.date.leftIcon"></div>
							{{ item.date.value }}
						</div>
					</div>
					<div class="bx-im-recent-item-content-bottom">
						<div v-if="item.subtitle" class="bx-im-recent-item-bottom-subtitle">
							<div v-if="item.subtitle.leftIcon" :class="'bx-im-recent-icon-subtitle-left bx-im-recent-icon-subtitle-left-' + item.subtitle.leftIcon"></div>
							<span class="bx-im-recent-item-bottom-subtitle-text">{{ item.subtitle.value }}</span>
						</div>
						<div class="bx-im-recent-item-bottom-counter">
							<div v-if="item.counter.leftIcon" :class="'bx-im-recent-icon-counter-left bx-im-recent-icon-counter-left-' + item.counter.leftIcon"></div>
							<div v-if="item.counter.value > 0" :class="counterClasses">{{ formattedCounter }}</div>
							<div v-else-if="item.notification" class="bx-im-recent-item-bottom-counter-notification"></div>
						</div>
					</div>
				</div>
			</template>
			<template v-else-if="item.template === ItemTypes.placeholder">
				<div class="bx-im-recent-item-image-wrap">
					<div class="bx-im-recent-item-image bx-im-recent-item-placeholder-image"></div>
				</div>
				<div class="bx-im-recent-item-content">
					<div class="bx-im-recent-item-content-header">
						<div class="bx-im-recent-item-placeholder-title"></div>
					</div>
					<div class="bx-im-recent-item-content-bottom">
						<div class="bx-im-recent-item-bottom-subtitle">
							<div class="bx-im-recent-item-placeholder-subtitle"></div>
						</div>
					</div>
				</div>
			</template>
		</div>
	`
	});

	/**
	 * Bitrix im
	 * Recentlist vue component
	 *
	 * @package bitrix
	 * @subpackage mobile
	 * @copyright 2001-2019 Bitrix
	 */

	/**
	 * @notice Do not mutate or clone this component! It is under development.
	 */
	ui_vue.BitrixVue.component('bx-im-component-recent', {
		components: {
			RecentItem
		},
		props: {
			hasDialog: false
		},
		data: function () {
			return {
				paginationCount: 50,
				loadingMore: false,
				hasMoreToLoad: true,
				placeholderCount: 0,
				lastMessageDate: null
			};
		},
		created() {},
		mounted() {
			this.drawPlaceholders().then(this.getFirstPage);
			this.initObserver();
		},
		computed: {
			pinnedItems() {
				return this.collection.filter(item => {
					return item.pinned === true;
				});
			},
			generalItems() {
				return this.collection.filter(item => {
					return item.pinned === false;
				});
			},
			...ui_vue_vuex.Vuex.mapState({
				collection: state => state.recent.collection
			})
		},
		methods: {
			/* region 01. Handlers */
			onScroll(event) {
				if (this.oneScreenRemaining(event)) {
					this.loadNextPage();
				}
			},
			onClick(event) {
				main_core_events.EventEmitter.emit(im_const.EventType.dialog.open, event);
			},
			onRightClick(event) {
				this.openOldContextMenu(event);
			},
			/* endregion 01. Handlers */

			/* region 02. Ex-controller */
			generatePlaceholders(amount) {
				let placeholders = [];
				for (let i = 0; i < amount; i++) {
					placeholders.push({
						id: 'placeholder' + this.placeholderCount,
						templateId: 'placeholder' + this.placeholderCount,
						template: im_const.TemplateTypes.placeholder,
						sectionCode: im_const.RecentSection.general
					});
					this.placeholderCount++;
				}
				return placeholders;
			},
			drawPlaceholders() {
				let placeholders = this.generatePlaceholders(this.paginationCount);
				return this.$store.dispatch('recent/addPlaceholders', placeholders);
			},
			getFirstPage() {
				let queryParams = {
					'SKIP_OPENLINES': 'Y',
					'LIMIT': this.paginationCount
				};
				this.getRestClient().callMethod(im_const.RestMethod.imRecentList, queryParams).then(result => {
					//save last message date to load next items starting from it
					this.lastMessageDate = this.getLastMessageDate(result.data().items);

					//if we got less items than page count = no more items
					if (!result.data().hasMore) {
						this.hasMoreToLoad = false;
					}
					this.$store.dispatch('recent/clearPlaceholders');
					//set first chunk of real data in rest handler
					this.getController().executeRestAnswer(im_const.RestMethodHandler.imRecentList, result);
				});
			},
			loadNextPage() {
				if (this.loadingMore || !this.hasMoreToLoad) {
					return false;
				}
				this.loadingMore = true;
				//get first placeholder which we need to update with new data
				this.firstPlaceholderToUpdate = this.placeholderCount;

				//draw new placeholders and get next items from backend
				this.drawPlaceholders().then(() => {
					this.getNextPage();
				});
			},
			getNextPage() {
				let queryParams = {
					'SKIP_OPENLINES': 'Y',
					'LIMIT': this.paginationCount,
					'LAST_MESSAGE_DATE': this.lastMessageDate
				};
				this.getRestClient().callMethod(im_const.RestMethod.imRecentList, queryParams).then(result => {
					let items = result.data().items;
					//if we got nothing - clear placeholders
					if (!items || items.length === 0) {
						this.$store.dispatch('recent/clearPlaceholders');
						return false;
					}
					//if we got less items than page count = there are no more items
					if (!result.data().hasMore) {
						this.hasMoreToLoad = false;
					}
					//save last message date to load next items starting from it
					this.lastMessageDate = this.getLastMessageDate(items);
					this.updateModels(items).then(() => {
						this.loadingMore = false;
						//if we got less items than page count - clear remaining placeholders
						if (!this.hasMoreToLoad) {
							this.$store.dispatch('recent/clearPlaceholders');
						}
					});
				});
			},
			getLastMessageDate(collection) {
				return collection.slice(-1)[0].message.date;
			},
			updateModels(items) {
				let data = this.prepareDataForModels(items);
				const usersPromise = this.$store.dispatch('users/set', data.users);
				const dialoguesPromise = this.$store.dispatch('dialogues/set', data.dialogues);
				const recentPromise = this.$store.dispatch('recent/updatePlaceholders', {
					items: data.recent,
					firstMessage: this.firstPlaceholderToUpdate
				});
				return Promise.all([usersPromise, dialoguesPromise, recentPromise]);
			},
			prepareDataForModels(items) {
				let result = {
					users: [],
					dialogues: [],
					recent: []
				};
				items.forEach(item => {
					let userId = 0;
					let chatId = 0;
					if (item.user && item.user.id > 0) {
						userId = item.user.id;
						result.users.push(item.user);
					}
					if (item.chat) {
						chatId = item.chat.id;
						result.dialogues.push(Object.assign(item.chat, {
							dialogId: item.id
						}));
					} else {
						result.dialogues.push(Object.assign({}, {
							dialogId: item.id
						}));
					}
					result.recent.push({
						...item,
						avatar: item.avatar.url,
						color: item.avatar.color,
						userId: userId,
						chatId: chatId
					});
				});
				return result;
			},
			/* endregion 02. Ex-controller */

			/* region 03. Actions */
			openOldDialog(event) {
				if (event.id !== 'notify') {
					BXIM.openMessenger(event.id);
				} else {
					BXIM.openNotify();
				}
			},
			openOldContextMenu(event) {
				event.$event.preventDefault();
				const recentItem = this.$store.getters['recent/get'](event.id);
				if (!recentItem) {
					return false;
				}
				const params = {
					userId: event.id,
					userIsChat: event.id.toString().startsWith('chat'),
					dialogIsPinned: recentItem.element.pinned
				};
				BXIM.messenger.openPopupMenu(event.$event.target, 'contactList', undefined, params);
			},
			/* endregion 03. Actions */

			/* region 04. Helpers */
			getController() {
				return this.$Bitrix.Data.get('controller');
			},
			getRestClient() {
				return this.$Bitrix.RestClient.get();
			},
			oneScreenRemaining(event) {
				return event.target.scrollTop + event.target.clientHeight >= event.target.scrollHeight - event.target.clientHeight;
			},
			initObserver() {
				this.observer = new IntersectionObserver(function (entries) {
					entries.forEach(entry => {
						if (entry.isIntersecting && entry.intersectionRatio === 1) ;
					});
				}, {
					threshold: [0, 1]
				});
			}
			/* endregion 04. Helpers */
		},
		directives: {
			'recent-list-observer': {
				inserted(element, bindings, vnode) {
					vnode.context.observer.observe(element);
				}
			}
		},
		// language=Vue
		template: `
			<div class="bx-messenger-recent">
				<div class="bx-messenger-recent-list" @scroll="onScroll">
					<template v-for="item in pinnedItems">
						<recent-item
							:itemData="item"
							:key="item.id"
							:data-id="item.id"
							v-recent-list-observer
							@click="onClick"
							@rightClick="onRightClick"
						/>
					</template>
					<template v-for="item in generalItems">
						<recent-item
							:itemData="item"
							:key="item.id"
							:data-id="item.id"
							v-recent-list-observer
							@click="onClick"
							@rightClick="onRightClick"
						/>
					</template>
				</div>
			</div>
	`
	});

})(BX, BX, BX.Messenger.Const, BX, BX.Messenger.Lib, BX.Event);
//# sourceMappingURL=recent.bundle.js.map
