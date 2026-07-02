/* eslint-disable */
(function (ui_designTokens, ui_vue, ui_vue_vuex, im_lib_logger, im_lib_utils, im_view_popup, ui_vue_portal, im_lib_animation, main_popup, main_core, ui_forms, im_view_element_attach, im_view_element_keyboard, im_const, im_lib_timer, main_core_events) {
	'use strict';

	const NotificationQuickAnswer = {
		props: ['listItem'],
		data() {
			return {
				quickAnswerText: '',
				quickAnswerResultMessage: '',
				showQuickAnswer: false,
				isSendingQuickAnswer: false,
				successSentQuickAnswer: false
			};
		},
		methods: {
			toggleQuickAnswer() {
				if (this.successSentQuickAnswer) {
					this.showQuickAnswer = true;
					this.successSentQuickAnswer = false;
					this.quickAnswerResultMessage = '';
				} else {
					this.showQuickAnswer = !this.showQuickAnswer;
				}
				if (this.showQuickAnswer) {
					this.$nextTick(() => {
						this.$refs['input'].focus();
					});
				}
			},
			sendQuickAnswer(event) {
				if (this.quickAnswerText.trim() === '') {
					return;
				}
				this.isSendingQuickAnswer = true;
				const notificationId = event.item.id;
				this.$Bitrix.RestClient.get().callMethod('im.notify.answer', {
					notify_id: notificationId,
					answer_text: this.quickAnswerText
				}).then(result => {
					this.quickAnswerResultMessage = result.data().result_message[0];
					this.successSentQuickAnswer = true;
					this.quickAnswerText = '';
					this.isSendingQuickAnswer = false;
				}).catch(error => {
					console.error(error);
					this.quickAnswerResultMessage = result.data().result_message[0];
					this.isSendingQuickAnswer = false;
				});
			}
		},
		//language=Vue
		template: `
		<div class="bx-notifier-item-text-vue">
			<div class="bx-notifier-answer-link-vue">
				<span class="bx-notifier-answer-reply bx-messenger-ajax" @click="toggleQuickAnswer()" @dblclick.stop>
					{{ $Bitrix.Loc.getMessage('IM_NOTIFICATIONS_QUICK_ANSWER_BUTTON') }}
				</span>
			</div>
			<transition name="quick-answer-slide">
				<div v-if="showQuickAnswer && !successSentQuickAnswer" class="bx-notifier-answer-box-vue">
					<span v-if="isSendingQuickAnswer" class="bx-notifier-answer-progress-vue bx-messenger-content-load-img"></span>
					<span class="bx-notifier-answer-input">
						<input
							type="text"
							ref="input"
							autofocus
							class="bx-messenger-input"
							v-model="quickAnswerText"
							:disabled="isSendingQuickAnswer"
							@keyup.enter="sendQuickAnswer({item: listItem, event: $event})"
						>
					</span>
					<div class="bx-notifier-answer-button" @click="sendQuickAnswer({item: listItem, event: $event})"></div>
				</div>
			</transition>
			<div v-if="successSentQuickAnswer" class="bx-notifier-answer-text-vue">
				{{ quickAnswerResultMessage }}
			</div>
		</div>
	`
	};

	// @vue/component
	const NotificationItemHeader = {
		props: {
			listItem: {
				type: Object,
				required: true
			},
			isExtranet: {
				type: Boolean,
				default: false
			}
		},
		computed: {
			moreUsers() {
				const phrase = this.$Bitrix.Loc.getMessage('IM_NOTIFICATIONS_MORE_USERS').split('#COUNT#');
				return {
					start: phrase[0],
					end: this.listItem.params.USERS.length + phrase[1]
				};
			},
			isMoreUsers() {
				return this.listItem.params.hasOwnProperty('USERS') && this.listItem.params.USERS.length > 0;
			},
			isAbleToDelete() {
				return this.listItem.sectionCode === im_const.NotificationTypesCodes.simple;
			}
		},
		methods: {
			onDeleteClick(event) {
				if (event.item.sectionCode === im_const.NotificationTypesCodes.simple) {
					this.$emit('deleteClick', event);
				}
			},
			onMoreUsersClick(event) {
				if (event.users) {
					this.$emit('moreUsersClick', {
						event: event.event,
						content: {
							type: 'USERS',
							value: event.users
						}
					});
				}
			},
			onUserTitleClick(event) {
				if (window.top["BXIM"] && event.userId > 0) {
					window.top["BXIM"].openMessenger(event.userId);
				}
			}
		},
		//language=Vue
		template: `
		<div class="bx-im-notifications-item-content-header">
			<div v-if="listItem.title" class="bx-im-notifications-item-header-title">
				<span
					v-if="!listItem.systemType"
					@click.prevent="onUserTitleClick({userId: listItem.authorId, event: $event})"
					class="bx-im-notifications-item-header-title-text-link"
					:class="[isExtranet ? '--extranet' : '']"
				>
					{{ listItem.title.value }}
				</span>
				<span v-else class="bx-im-notifications-item-header-title-text">{{ listItem.title.value }}</span>
				<span
					v-if="isMoreUsers && !listItem.systemType"
					class="bx-im-notifications-item-header-more-users"
				>
					{{ moreUsers.start }}
					<span class="bx-messenger-ajax" @click="onMoreUsersClick({users: listItem.params.USERS, event: $event})">
						{{ moreUsers.end }}
					</span>
				</span>
			</div>
			<div class="bx-im-notifications-item-content-header-right">
				<div class="bx-im-notifications-item-header-date">
					{{ listItem.date.value }}
				</div>
				<span
					v-if="isAbleToDelete"
					class="bx-im-notifications-item-header-delete"
					@click="onDeleteClick({item: listItem, event: $event})">
				</span>
			</div>
		</div>
	`
	};

	const NotificationPlaceholder = {
		//language=Vue
		template: `
		<div style="display: flex; width: 100%;">
			<div class="bx-im-notifications-item-image-wrap">
				<div class="bx-im-notifications-item-image bx-im-notifications-item-placeholder-image"></div>
			</div>
			<div class="bx-im-notifications-item-content bx-im-notifications-skeleton">
				<div class="bx-im-notifications-item-content-header">
					<div class="bx-im-notifications-item-placeholder-title"></div>
				</div>
				<div class="bx-im-notifications-item-content-middle">
					<div class="bx-im-notifications-item-bottom-subtitle">
						<div class="bx-im-notifications-item-placeholder-subtitle"></div>
					</div>
				</div>
				<div class="bx-im-notifications-item-content-bottom">
					<div class="bx-im-notifications-item-bottom-subtitle">
						<div class="bx-im-notifications-item-placeholder-subtitle"></div>
					</div>
				</div>
			</div>
		</div>
	`
	};

	const NotificationItem = {
		components: {
			NotificationQuickAnswer,
			NotificationItemHeader,
			NotificationPlaceholder
		},
		props: ['rawListItem', 'searchMode'],
		data() {
			return {
				menuId: 'popup-window-content-bx-messenger-popup-notify'
			};
		},
		computed: {
			NotificationTypesCodes: () => im_const.NotificationTypesCodes,
			listItem() {
				return {
					id: this.rawListItem.id,
					type: this.rawListItem.type,
					sectionCode: this.rawListItem.sectionCode,
					authorId: this.rawListItem.authorId,
					systemType: this.rawListItem.type === 4 || this.rawListItem.authorId === 0 && this.avatar === '',
					title: {
						value: this.userTitle
					},
					subtitle: {
						value: this.rawListItem.textConverted
					},
					avatar: {
						url: this.avatar,
						color: this.defaultAvatarColor
					},
					params: this.rawListItem.params || {},
					notifyButtons: this.rawListItem.notifyButtons || undefined,
					unread: this.rawListItem.unread,
					settingName: this.rawListItem.settingName,
					date: {
						value: im_lib_utils.Utils.date.format(this.rawListItem.date, null, this.$Bitrix.Loc.getMessages())
					}
				};
			},
			isRealItem() {
				return this.rawListItem.sectionCode !== im_const.NotificationTypesCodes.placeholder;
			},
			isNeedQuickAnswer() {
				return this.listItem.params.CAN_ANSWER && this.listItem.params.CAN_ANSWER === 'Y';
			},
			userTitle() {
				if (this.isRealItem && this.rawListItem.authorId > 0) {
					return this.userData.name;
				}
				const {
					title
				} = this.rawListItem;
				return title.length > 0 ? title : this.$Bitrix.Loc.getMessage('IM_NOTIFICATIONS_ITEM_SYSTEM');
			},
			avatar() {
				let avatar = '';
				if (this.isRealItem && this.rawListItem.authorId > 0) {
					avatar = this.userData.avatar;
				} else if (this.isRealItem && this.rawListItem.authorId === 0) {
					//system notification
					return '';
				}
				return avatar;
			},
			defaultAvatarColor() {
				if (this.rawListItem.authorId <= 0) {
					return '';
				}
				return this.userData.color;
			},
			userData() {
				return this.$store.getters['users/get'](this.rawListItem.authorId, true);
			},
			isExtranet() {
				return this.userData.extranet;
			},
			avatarStyles() {
				return {
					backgroundImage: 'url("' + this.listItem.avatar.url + '")'
				};
			}
		},
		methods: {
			//events
			onDoubleClick(event) {
				if (!this.searchMode) {
					this.$emit('dblclick', event);
				}
			},
			onButtonsClick(event) {
				if (event.action === 'COMMAND') {
					this.$emit('buttonsClick', event);
				}
			},
			onDeleteClick(event) {
				this.$emit('deleteClick', event);
			},
			onMoreUsersClick(event) {
				this.$emit('contentClick', event);
			},
			onContentClick(event) {
				if (ui_vue.Vue.testNode(event.target, {
					className: 'bx-im-mention'
				})) {
					this.$emit('contentClick', {
						event,
						content: {
							type: event.target.dataset.type,
							value: event.target.dataset.value
						}
					});
				}
			},
			onRightClick(event) {
				if (im_lib_utils.Utils.platform.isBitrixDesktop() && event.target.tagName === 'A' && (!event.target.href.startsWith('/desktop_app/') || event.target.href.startsWith('/desktop_app/show.file.php'))) {
					const hrefToCopy = event.target.href;
					if (!hrefToCopy) {
						return;
					}
					if (this.menuPopup) {
						this.menuPopup.destroy();
						this.menuPopup = null;
					}

					//menu for other items
					const existingMenu = main_popup.PopupManager.getPopupById(this.menuId);
					if (existingMenu) {
						existingMenu.destroy();
					}
					const menuItem = main_core.Dom.create('span', {
						attrs: {
							className: 'bx-messenger-popup-menu-item-text bx-messenger-popup-menu-item'
						},
						events: {
							click: event => {
								BX.desktop.clipboardCopy(hrefToCopy);
								this.menuPopup.destroy();
								this.menuPopup = null;
							}
						},
						text: this.$Bitrix.Loc.getMessage('IM_NOTIFICATIONS_CONTEXT_COPY_LINK')
					});
					this.menuPopup = main_popup.PopupManager.create({
						id: this.menuId,
						targetContainer: document.body,
						className: BX.MessengerTheme.isDark() ? 'bx-im-notifications-popup-window-dark' : '',
						darkMode: BX.MessengerTheme.isDark(),
						bindElement: event,
						offsetLeft: 13,
						autoHide: true,
						closeByEsc: true,
						events: {
							onPopupClose: () => this.menuPopup.destroy(),
							onPopupDestroy: () => this.menuPopup = null
						},
						content: menuItem
					});
					if (!BX.MessengerTheme.isDark()) {
						this.menuPopup.setAngle({});
					}
					this.menuPopup.show();
				}
			}
		},
		//language=Vue
		template: `
		<div 
			class="bx-im-notifications-item"
			:class="[listItem.unread && !searchMode ? 'bx-im-notifications-item-unread' : '']"
			@dblclick="onDoubleClick({item: listItem, event: $event})"
			@contextmenu="onRightClick"
		>
			<template v-if="listItem.sectionCode !== NotificationTypesCodes.placeholder">
				<div v-if="listItem.avatar" class="bx-im-notifications-item-image-wrap">
					<div 
						v-if="listItem.avatar.url" 
						class="bx-im-notifications-item-image"
						:style="avatarStyles"
					></div>
					<div v-else-if="listItem.systemType" class="bx-im-notifications-item-image bx-im-notifications-image-system"></div>
					<div 
						v-else-if="!listItem.avatar.url" 
						class="bx-im-notifications-item-image bx-im-notifications-item-image-default"
						:style="{backgroundColor: listItem.avatar.color}"
						>
					</div>
				</div>
				<div class="bx-im-notifications-item-content" @click="onContentClick">
					<NotificationItemHeader 
						:listItem="listItem"
						:isExtranet="isExtranet"
						@deleteClick="onDeleteClick"
						@moreUsersClick="onMoreUsersClick"
					/>
					<div v-if="listItem.subtitle.value.length > 0" class="bx-im-notifications-item-content-bottom">
						<div class="bx-im-notifications-item-bottom-subtitle">
							<span
								:class="[!listItem.title.value ? 'bx-im-notifications-item-bottom-subtitle-text' : 'bx-im-notifications-item-bottom-no-subtitle-text']"
								v-html="listItem.subtitle.value"
							>
							</span>
						</div>
					</div>
					<NotificationQuickAnswer v-if="isNeedQuickAnswer" :listItem="listItem"/>
					<div v-if="listItem.params['ATTACH']" class="bx-im-notifications-item-content-additional">
						<div v-for="attach in listItem.params['ATTACH']">
							<bx-im-view-element-attach :config="attach"/>
						</div>
					</div>
					<div v-if="listItem.notifyButtons">
						<bx-im-view-element-keyboard @click="onButtonsClick" :buttons="listItem.notifyButtons"/>
					</div>
				</div>
			</template>
			<NotificationPlaceholder v-else-if="listItem.sectionCode === NotificationTypesCodes.placeholder"/>
		</div>
	`
	};

	const NotificationCore = {
		data() {
			return {
				placeholderCount: 0
			};
		},
		methods: {
			isReadyToLoadNewPage(event) {
				const leftSpaceBottom = event.target.scrollHeight - event.target.scrollTop - event.target.clientHeight;
				return leftSpaceBottom < 200; //pixels offset before load new page
			},
			getLastItemId(collection) {
				return collection[collection.length - 1].id;
			},
			generatePlaceholders(amount) {
				const placeholders = [];
				for (let i = 0; i < amount; i++) {
					placeholders.push({
						id: `placeholder${this.placeholderCount}`,
						type: im_const.NotificationTypesCodes.placeholder
					});
					this.placeholderCount++;
				}
				return placeholders;
			},
			getRestClient() {
				return this.$Bitrix.RestClient.get();
			},
			onContentClick(event) {
				this.contentPopupType = event.content.type.toLowerCase();
				this.contentPopupValue = event.content.value;
				if (this.popupInstance != null) {
					this.popupInstance.destroy();
					this.popupInstance = null;
				}

				// TODO: replace it with new popups.
				if (this.contentPopupType === 'user' || this.contentPopupType === 'chat') {
					const popupAngle = !this.isDarkTheme;
					BXIM.messenger.openPopupExternalData(event.event.target, this.contentPopupType, popupAngle, {
						'ID': this.contentPopupValue
					});
				} else if (this.contentPopupType === 'openlines') {
					BX.MessengerCommon.linesGetSessionHistory(this.contentPopupValue);
				} else {
					const popup = main_popup.PopupManager.create({
						id: "bx-messenger-popup-external-data",
						targetContainer: document.body,
						className: this.isDarkTheme ? 'bx-im-notifications-popup-window-dark' : '',
						bindElement: event.event.target,
						lightShadow: true,
						offsetTop: 0,
						offsetLeft: 10,
						autoHide: true,
						closeByEsc: true,
						bindOptions: {
							position: "top"
						},
						events: {
							onPopupClose: () => this.popupInstance.destroy(),
							onPopupDestroy: () => this.popupInstance = null
						}
					});
					if (!this.isDarkTheme) {
						popup.setAngle({});
					}
					this.popupIdSelector = `#${popup.getContentContainer().id}`;

					//little hack for correct open several popups in a row.
					this.$nextTick(() => this.popupInstance = popup);
				}
			}
		},
		computed: {
			isDarkTheme() {
				if (this.darkTheme === undefined) {
					return BX.MessengerTheme.isDark();
				}
				return this.darkTheme;
			}
		}
	};

	const NotificationSearchResult = {
		components: {
			NotificationItem,
			MountingPortal: ui_vue_portal.MountingPortal,
			Popup: im_view_popup.Popup
		},
		mixins: [NotificationCore],
		props: ['searchQuery', 'searchType', 'searchDate'],
		data() {
			return {
				pageLimit: 50,
				lastId: 0,
				initialDataReceived: false,
				isLoadingNewPage: false,
				contentPopupType: '',
				contentPopupValue: '',
				popupInstance: null,
				popupIdSelector: '',
				searchResultsTotal: 0,
				searchPageLoaded: 0,
				searchPagesRequested: 0
			};
		},
		computed: {
			remainingPages() {
				return Math.ceil((this.searchResultsTotal - this.searchResults.length) / this.pageLimit);
			},
			...ui_vue_vuex.Vuex.mapState({
				notification: state => state.notifications.collection,
				searchResults: state => state.notifications.searchCollection
			})
		},
		watch: {
			searchQuery(value) {
				if (value.length >= 3 || value === '') {
					this.search();
				}
			},
			searchType() {
				this.search();
			},
			searchDate(value) {
				if (BX.parseDate(value) instanceof Date || value === '') {
					this.search();
				}
			}
		},
		created() {
			this.searchServerDelayed = im_lib_utils.Utils.debounce(this.getSearchResultsFromServer, 1500, this);
			this.search();
		},
		beforeDestroy() {
			this.$store.dispatch('notifications/deleteSearchResults');
		},
		methods: {
			search() {
				this.resetSearchState();
				const localResults = this.notification.filter(item => {
					let result = false;
					if (this.searchQuery.length >= 3) {
						result = item.textConverted.toLowerCase().includes(this.searchQuery.toLowerCase());
						if (!result) {
							return result;
						}
					}
					if (this.searchType !== '') {
						result = item.settingName === this.searchType;
						if (!result) {
							return result;
						}
					}
					if (this.searchDate !== '') {
						const date = BX.parseDate(this.searchDate);
						if (date instanceof Date) {
							// compare dates excluding time.
							const itemDateForCompare = new Date(item.date.getTime()).setHours(0, 0, 0, 0);
							const dateFromInput = date.setHours(0, 0, 0, 0);
							result = itemDateForCompare === dateFromInput;
						}
					}
					return result;
				});
				if (localResults.length > 0) {
					this.$store.dispatch('notifications/setSearchResults', {
						notification: localResults,
						type: 'local'
					});
				}
				const isNeedPlaceholders = this.pageLimit - localResults.length > 0;
				if (isNeedPlaceholders > 0) {
					this.drawPlaceholders(this.pageLimit).then(() => {
						this.searchServerDelayed();
					});
				} else {
					this.searchServerDelayed();
				}
			},
			getSearchResultsFromServer() {
				const queryParams = this.getSearchRequestParams();
				this.getRestClient().callMethod('im.notify.history.search', queryParams).then(result => {
					im_lib_logger.Logger.warn('im.notify.history.search: first page results', result.data());
					this.processHistoryData(result.data());
					this.initialDataReceived = true;
					this.isLoadingNewPage = false;
					this.searchPageLoaded++;
				}).catch(result => {
					im_lib_logger.Logger.warn('History request error', result);
				});
			},
			processHistoryData(data) {
				this.$store.dispatch('notifications/clearPlaceholders');
				if (data.notifications.length <= 0) {
					return false;
				}
				this.lastId = this.getLastItemId(data.notifications);
				this.searchResultsTotal = data.total_results;
				this.$store.dispatch('notifications/setSearchResults', {
					notification: data.notifications
				});
				this.$store.dispatch('users/set', data.users);
				this.isLoadingNewPage = false;
			},
			loadNextPage() {
				im_lib_logger.Logger.warn(`Loading more search results!`);
				const queryParams = this.getSearchRequestParams();
				this.getRestClient().callMethod('im.notify.history.search', queryParams).then(result => {
					im_lib_logger.Logger.warn('im.notify.history.search: new page results', result.data());
					const newUsers = result.data().users;
					const newItems = result.data().notifications;
					if (!newItems || newItems.length === 0) {
						this.$store.dispatch('notifications/clearPlaceholders');
						this.searchResultsTotal = this.searchResults.length;
						return false;
					}
					this.lastId = this.getLastItemId(newItems);
					this.$store.dispatch('users/set', newUsers);
					return this.$store.dispatch('notifications/updatePlaceholders', {
						searchCollection: true,
						items: newItems,
						firstItem: this.searchPageLoaded * this.pageLimit
					});
				}).then(() => {
					this.searchPageLoaded++;
					return this.onAfterLoadNextPageRequest();
				}).catch(result => {
					this.$store.dispatch('notifications/clearPlaceholders');
					im_lib_logger.Logger.warn('History request error', result);
				});
			},
			onAfterLoadNextPageRequest() {
				im_lib_logger.Logger.warn('onAfterLoadNextPageRequest');
				if (this.searchPagesRequested > 0) {
					im_lib_logger.Logger.warn('We have delayed requests -', this.searchPagesRequested);
					this.searchPagesRequested--;
					return this.loadNextPage();
				} else {
					im_lib_logger.Logger.warn('No more delayed requests, clearing placeholders');
					this.$store.dispatch('notifications/clearPlaceholders');
					this.isLoadingNewPage = false;
					return true;
				}
			},
			getSearchRequestParams() {
				const params = {
					'SEARCH_TEXT': this.searchQuery,
					'SEARCH_TYPE': this.searchType,
					'LIMIT': this.pageLimit,
					'CONVERT_TEXT': 'Y'
				};
				if (BX.parseDate(this.searchDate) instanceof Date) {
					params['SEARCH_DATE'] = BX.parseDate(this.searchDate).toISOString();
				}
				if (this.lastId > 0) {
					params['LAST_ID'] = this.lastId;
				}
				return params;
			},
			resetSearchState() {
				this.$store.dispatch('notifications/deleteSearchResults');
				this.initialDataReceived = false;
				this.lastId = 0;
				this.isLoadingNewPage = true;
				this.placeholderCount = 0;
				this.searchPageLoaded = 0;
			},
			drawPlaceholders(amount = 0) {
				const placeholders = this.generatePlaceholders(amount);
				return this.$store.dispatch('notifications/setSearchResults', {
					notification: placeholders
				});
			},
			//events
			onScroll(event) {
				if (!this.isReadyToLoadNewPage(event) || !this.initialDataReceived || this.remainingPages <= 0) {
					return;
				}
				if (this.isLoadingNewPage) {
					this.drawPlaceholders(this.pageLimit).then(() => {
						this.searchPagesRequested++;
						im_lib_logger.Logger.warn('Already loading! Draw placeholders and add request, total - ', this.pagesRequested);
					});
				} else
					//if (!this.isLoadingNewPage)
					{
						im_lib_logger.Logger.warn('Starting new request');
						this.isLoadingNewPage = true;
						this.drawPlaceholders(this.pageLimit).then(() => {
							this.loadNextPage();
						});
					}
			},
			onButtonsClick(event) {
				const params = this.getConfirmRequestParams(event);
				const itemId = +params.NOTIFY_ID;
				const notification = this.$store.getters['notifications/getById'](itemId);
				this.getRestClient().callMethod('im.notify.confirm', params).then(() => {
					this.$store.dispatch('notifications/delete', {
						id: itemId
					});
					if (notification.unread) {
						this.$store.dispatch('notifications/setCounter', {
							unreadTotal: this.unreadCounter - 1
						});
					}
				}).catch(() => {
					this.$store.dispatch('notifications/update', {
						id: itemId,
						fields: {
							display: true
						}
					});
				});
				this.$store.dispatch('notifications/update', {
					id: itemId,
					fields: {
						display: false
					}
				});
			},
			onDeleteClick(event) {
				const itemId = +event.item.id;
				const notification = this.$store.getters['notifications/getSearchItemById'](itemId);
				this.getRestClient().callMethod('im.notify.delete', {
					id: itemId
				}).then(() => {
					this.$store.dispatch('notifications/delete', {
						id: itemId,
						searchMode: true
					});
					//we need to load more, if we are on the first page and we have not enough elements (~15).
					if (!this.isLoadingNewPage && this.remainingPages > 0 && this.searchResults.length < 15) {
						this.isLoadingNewPage = true;
						this.drawPlaceholders(this.pageLimit).then(() => {
							this.loadNextPage();
						});
					}
					if (notification.unread) {
						this.$store.dispatch('notifications/setCounter', {
							unreadTotal: this.unreadCounter - 1
						});
					}
				}).catch(error => {
					console.error(error);
					this.$store.dispatch('notifications/update', {
						id: itemId,
						fields: {
							display: true
						},
						searchMode: true
					});
				});
				this.$store.dispatch('notifications/update', {
					id: itemId,
					fields: {
						display: false
					},
					searchMode: true
				});
			}
		},
		//language=Vue
		template: `
		<div class="bx-messenger-notifications-search-results-wrap" @scroll.passive="onScroll">
			<notification-item
				v-for="listItem in searchResults"
				v-if="listItem.display"
				:key="listItem.id"
				:data-id="listItem.id"
				:rawListItem="listItem"
				searchMode="true"
				@buttonsClick="onButtonsClick"
				@contentClick="onContentClick"
				@deleteClick="onDeleteClick"
			/>
			<mounting-portal :mount-to="popupIdSelector" append v-if="popupInstance">
				<popup :type="contentPopupType" :value="contentPopupValue" :popupInstance="popupInstance"/>
			</mounting-portal>
			<div 
				v-if="searchResults.length <= 0" 
				style="padding-top: 210px; margin-bottom: 20px;"
				class="bx-messenger-box-empty bx-notifier-content-empty" 
			>
				{{ $Bitrix.Loc.getMessage('IM_NOTIFICATIONS_SEARCH_RESULTS_NOT_FOUND') }}
			</div>
		</div>
	`
	};

	/**
	 * Bitrix im
	 * Notifications vue component
	 *
	 * @package bitrix
	 * @subpackage im
	 * @copyright 2001-2020 Bitrix
	 */

	const ObserverType = Object.freeze({
		read: 'read',
		none: 'none'
	});

	/**
	 * @notice Do not mutate or clone this component! It is under development.
	 */
	ui_vue.BitrixVue.component('bx-im-component-notifications', {
		components: {
			NotificationItem,
			MountingPortal: ui_vue_portal.MountingPortal,
			Popup: im_view_popup.Popup,
			NotificationSearchResult
		},
		directives: {
			'bx-im-directive-notifications-observer': {
				inserted(element, bindings, vnode) {
					if (bindings.value === ObserverType.none) {
						return false;
					}
					if (!vnode.context.observers[bindings.value]) {
						vnode.context.observers[bindings.value] = vnode.context.getObserver({
							type: bindings.value
						});
					}
					vnode.context.observers[bindings.value].observe(element);
					return true;
				},
				unbind(element, bindings, vnode) {
					if (bindings.value === ObserverType.none) {
						return true;
					}
					if (vnode.context.observers[bindings.value]) {
						vnode.context.observers[bindings.value].unobserve(element);
					}
					return true;
				}
			}
		},
		mixins: [NotificationCore],
		props: {
			darkTheme: {
				default: undefined
			}
		},
		data: function () {
			return {
				initialDataReceived: false,
				perPage: 50,
				isLoadingInitialData: false,
				isLoadingNewPage: false,
				pagesRequested: 0,
				pagesLoaded: 0,
				lastId: 0,
				lastType: im_const.NotificationTypesCodes.confirm,
				ObserverType: ObserverType,
				notificationsOnScreen: [],
				notificationsToRead: [],
				notificationsToDelete: [],
				changeReadStatusBlockTimeout: {},
				firstUnreadNotificationOnInit: null,
				contentPopupType: '',
				contentPopupValue: '',
				popupInstance: null,
				popupIdSelector: '',
				contextPopupInstance: null,
				searchQuery: '',
				searchType: '',
				searchDate: '',
				showSearch: false,
				callViewState: false
			};
		},
		computed: {
			NotificationTypesCodes: () => im_const.NotificationTypesCodes,
			remainingPages() {
				return Math.ceil((this.total - this.notification.length) / this.perPage);
			},
			localize() {
				return ui_vue.BitrixVue.getFilteredPhrases('IM_NOTIFICATIONS_', this);
			},
			visibleNotifications() {
				return this.notification.filter(notificationItem => {
					return notificationItem.display;
				});
			},
			highestNotificationId() {
				return this.notification.reduce((highestId, currentNotification) => {
					return currentNotification.id > highestId ? currentNotification.id : highestId;
				}, 0);
			},
			isNeedToReadAll() {
				return this.unreadCounter > 0;
			},
			panelStyles() {
				if (this.callViewState === BX.Call.Controller.ViewState.Folded && !this.showSearch) {
					return {
						paddingBottom: '60px' // height of .bx-messenger-videocall-panel-folded
					};
				}
				return {};
			},
			filterBoxStyles() {
				if (this.callViewState === BX.Call.Controller.ViewState.Folded && this.showSearch) {
					return {
						paddingTop: '70px' // height of .bx-messenger-videocall-panel-folded + 10px for space
					};
				}
				return {};
			},
			firstUnreadNotification() {
				let unreadNotification = null;
				const maxNotificationIndex = this.notification.length - 1;
				for (let i = 0; i <= maxNotificationIndex; i++) {
					if (this.notification[i].unread && this.notification[i].sectionCode !== im_const.NotificationTypesCodes.placeholder) {
						unreadNotification = this.notification[i];
						break;
					}
				}
				return unreadNotification;
			},
			firstUnreadNotificationBelowVisible() {
				const minIdOnScreen = Math.max(...this.notificationsOnScreen);
				let unreadId = null;
				const maxNotificationIndex = this.notification.length - 1;
				for (let i = 0; i <= maxNotificationIndex; i++) {
					if (this.notification[i].unread && minIdOnScreen > this.notification[i].id && this.notification[i].sectionCode === im_const.NotificationTypesCodes.simple) {
						unreadId = this.notification[i].id;
						break;
					}
				}
				return unreadId;
			},
			isUnreadNotificationVisible() {
				const unreadOnScreen = Array.from(this.notificationsOnScreen).filter(idOnScreen => {
					const notificationOnScreen = this.$store.getters['notifications/getById'](idOnScreen);
					return notificationOnScreen ? notificationOnScreen.unread : false;
				});
				return unreadOnScreen.length > 0;
			},
			showScrollButton() {
				if (!this.initialDataReceived) {
					return false;
				}
				if (this.unreadCounter <= 0 || !BXIM.settings.notifyAutoRead) {
					return false;
				}
				if (this.notificationsOnScreen.length === 0) {
					return false;
				}
				if (this.isUnreadNotificationVisible) {
					return false;
				}
				return true;
			},
			hasUnreadBelowVisible() {
				let unreadCounterBeforeVisible = 0;
				for (let i = 0; i <= this.notification.length - 1; i++) {
					if (this.notification[i].unread && this.notification[i].sectionCode !== im_const.NotificationTypesCodes.placeholder) {
						++unreadCounterBeforeVisible;
					}

					// In this case we decide that there is no more unread notifications below visible notifications,
					// so we show arrow up on scroll button.
					if (this.notificationsOnScreen.includes(this.notification[i].id) && this.unreadCounter === unreadCounterBeforeVisible) {
						return false;
					}
				}
				return true;
			},
			arrowButtonClass() {
				let arrowUp = !this.hasUnreadBelowVisible;
				return {
					'bx-im-notifications-scroll-button-arrow-down': !arrowUp,
					'bx-im-notifications-scroll-button-arrow-up': arrowUp,
					'bx-im-notifications-scroll-button-arrow': true
				};
			},
			filterTypes() {
				const originalSchema = Object.assign({}, this.schema);

				// get rid of some subcategories
				const modulesToReduceListItems = ['timeman', 'mail', 'disk', 'bizproc', 'voximplant', 'sender', 'blog', 'vote', 'socialnetwork', 'imopenlines', 'photogallery', 'intranet', 'forum'];
				modulesToReduceListItems.forEach(moduleId => {
					if (originalSchema.hasOwnProperty(moduleId)) {
						delete originalSchema[moduleId].LIST;
					}
				});

				// rename some groups
				if (originalSchema.hasOwnProperty('calendar')) {
					originalSchema['calendar'].NAME = this.localize['IM_NOTIFICATIONS_SEARCH_FILTER_TYPE_CALENDAR'];
				}
				if (originalSchema.hasOwnProperty('sender')) {
					originalSchema['sender'].NAME = this.localize['IM_NOTIFICATIONS_SEARCH_FILTER_TYPE_SENDER'];
				}
				if (originalSchema.hasOwnProperty('blog')) {
					originalSchema['blog'].NAME = this.localize['IM_NOTIFICATIONS_SEARCH_FILTER_TYPE_BLOG'];
				}
				if (originalSchema.hasOwnProperty('socialnetwork')) {
					originalSchema['socialnetwork'].NAME = this.localize['IM_NOTIFICATIONS_SEARCH_FILTER_TYPE_SOCIALNETWORK'];
				}
				if (originalSchema.hasOwnProperty('intranet')) {
					originalSchema['intranet'].NAME = this.localize['IM_NOTIFICATIONS_SEARCH_FILTER_TYPE_INTRANET'];
				}

				// we need only this modules in this order!
				const modulesToShowInFilter = ['tasks', 'calendar', 'crm', 'timeman', 'mail', 'disk', 'bizproc', 'voximplant', 'sender', 'blog', 'vote', 'socialnetwork', 'imopenlines', 'photogallery', 'intranet', 'forum'];
				const notificationFilterTypes = [];
				modulesToShowInFilter.forEach(moduleId => {
					if (originalSchema.hasOwnProperty(moduleId)) {
						notificationFilterTypes.push(originalSchema[moduleId]);
					}
				});
				return notificationFilterTypes;
			},
			...ui_vue_vuex.Vuex.mapState({
				notification: state => state.notifications.collection,
				total: state => state.notifications.total,
				unreadCounter: state => state.notifications.unreadCounter,
				schema: state => state.notifications.schema
			})
		},
		created() {
			this.drawPlaceholders().then(() => {
				this.getInitialData();
			});
			main_core_events.EventEmitter.subscribe(im_const.EventType.notification.updateState, this.onUpdateState);
			window.addEventListener('focus', this.onWindowFocus);
			window.addEventListener('blur', this.onWindowBlur);
			if (BXIM && BX.Call) {
				this.callViewState = BXIM.callController.callViewState;
				BXIM.callController.subscribe(BX.Call.Controller.Events.onViewStateChanged, this.onCallViewStateChange);
			}
			this.timer = new im_lib_timer.Timer();
			this.readNotificationsQueue = new Set();
			this.readNotificationsNodes = {};
			this.observers = {};
			this.readVisibleNotificationsDelayed = im_lib_utils.Utils.debounce(this.readVisibleNotifications, 50, this);
		},
		mounted() {
			this.windowFocused = document.hasFocus();
		},
		beforeDestroy() {
			this.observers = {};
			window.removeEventListener('focus', this.onWindowFocus);
			window.removeEventListener('blur', this.onWindowBlur);
			main_core_events.EventEmitter.unsubscribe(im_const.EventType.notification.updateState, this.onUpdateState);
			if (BXIM && BX.Call) {
				BXIM.callController.unsubscribe(BX.Call.Controller.Events.onViewStateChanged, this.onCallViewStateChange);
			}
		},
		methods: {
			getFirstUnreadNotificationOnInit() {
				if (this.unreadCounter <= 0) {
					return null;
				}
				let unreadId = null;
				const maxNotificationIndex = this.notification.length - 1;
				for (let i = 0; i <= maxNotificationIndex; i++) {
					if (this.notification[i].unread) {
						unreadId = this.notification[i].id;
						break;
					}
				}
				return unreadId;
			},
			onCallViewStateChange({
				data
			}) {
				this.callViewState = data.callViewState;
			},
			onUpdateState(event) {
				const lastNotificationId = event.data.lastId;
				if (!this.isLoadingInitialData && this.highestNotificationId > 0 && lastNotificationId !== this.highestNotificationId) {
					this.getInitialData();
				}
			},
			readVisibleNotifications() {
				//todo: replace legacy chat API
				if (!this.windowFocused || !BXIM.settings.notifyAutoRead) {
					im_lib_logger.Logger.warn('reading is disabled!');
					return false;
				}
				this.readNotificationsQueue.forEach(notificationId => {
					if (this.readNotificationsNodes[notificationId]) {
						delete this.readNotificationsNodes[notificationId];
					}
					this.readNotifications(parseInt(notificationId, 10));
				});
				this.readNotificationsQueue.clear();
			},
			getInitialData() {
				this.isLoadingInitialData = true;
				const queryParams = {
					[im_const.RestMethodHandler.imNotifyGet]: [im_const.RestMethod.imNotifyGet, {
						'LIMIT': this.perPage,
						'CONVERT_TEXT': 'Y'
					}],
					[im_const.RestMethodHandler.imNotifySchemaGet]: [im_const.RestMethod.imNotifySchemaGet, {}]
				};
				this.getRestClient().callBatch(queryParams, response => {
					im_lib_logger.Logger.warn('im.notify.get: initial result', response[im_const.RestMethodHandler.imNotifyGet].data());
					this.processInitialData(response[im_const.RestMethodHandler.imNotifyGet].data());
					this.processSchemaData(response[im_const.RestMethodHandler.imNotifySchemaGet].data());
					this.pagesLoaded++;
					this.isLoadingInitialData = false;
					this.firstUnreadNotificationOnInit = this.getFirstUnreadNotificationOnInit();
				}, false, false);
			},
			processInitialData(data) {
				//if we got empty data - clear all placeholders
				if (!data.notifications || data.notifications.length === 0) {
					this.$store.dispatch('notifications/clearPlaceholders');
					this.$store.dispatch('notifications/setTotal', {
						total: this.notification.length
					});
					return false;
				}
				this.lastId = this.getLastItemId(data.notifications);
				this.lastType = this.getLastItemType(data.notifications);
				this.$store.dispatch('notifications/clearPlaceholders');
				this.$store.dispatch('notifications/setCounter', {
					unreadTotal: data.total_unread_count
				});
				this.$store.dispatch('notifications/set', {
					notification: data.notifications,
					total: data.total_count
				});
				this.$store.dispatch('users/set', data.users);
				this.updateRecentList(data.total_unread_count, true);
				this.initialDataReceived = true;
			},
			processSchemaData(data) {
				this.$store.dispatch('notifications/setSchema', {
					data: data
				});
			},
			drawPlaceholders() {
				const placeholders = this.generatePlaceholders(this.perPage);
				return this.$store.dispatch('notifications/set', {
					notification: placeholders
				});
			},
			loadNextPage() {
				im_lib_logger.Logger.warn(`Loading more notifications!`);
				const queryParams = {
					'LIMIT': this.perPage,
					'LAST_ID': this.lastId,
					'LAST_TYPE': this.lastType,
					'CONVERT_TEXT': 'Y'
				};
				this.getRestClient().callMethod('im.notify.get', queryParams).then(result => {
					im_lib_logger.Logger.warn('im.notify.get: new page results', result.data());
					const newUsers = result.data().users;
					const newItems = result.data().notifications;

					//if we got empty data - clear all placeholders
					if (!newItems || newItems.length === 0) {
						this.$store.dispatch('notifications/clearPlaceholders');
						this.$store.dispatch('notifications/setTotal', {
							total: this.notification.length
						});
						return false;
					}
					this.lastId = this.getLastItemId(newItems);
					this.lastType = this.getLastItemType(newItems);
					this.$store.dispatch('users/set', newUsers);

					//change temp data in models to real data, we need new items, first item to update and section
					return this.$store.dispatch('notifications/updatePlaceholders', {
						items: newItems,
						firstItem: this.pagesLoaded * this.perPage
					});
				}).then(() => {
					this.pagesLoaded++;
					im_lib_logger.Logger.warn('Page loaded. Total loaded - ', this.pagesLoaded);
					return this.onAfterLoadNextPageRequest();
				}).catch(result => {
					im_lib_logger.Logger.warn('Request history error', result);
				});
			},
			onAfterLoadNextPageRequest() {
				im_lib_logger.Logger.warn('onAfterLoadNextPageRequest');
				if (this.pagesRequested > 0) {
					im_lib_logger.Logger.warn('We have delayed requests -', this.pagesRequested);
					this.pagesRequested--;
					return this.loadNextPage();
				} else {
					im_lib_logger.Logger.warn('No more delayed requests, clearing placeholders');
					this.$store.dispatch('notifications/clearPlaceholders');
					this.isLoadingNewPage = false;
					return true;
				}
			},
			changeReadStatus(item) {
				this.$store.dispatch('notifications/read', {
					ids: [item.id],
					action: item.unread
				});
				// change the unread counter
				const originalCounterBeforeUpdate = this.unreadCounter;
				const counterValue = item.unread ? this.unreadCounter - 1 : this.unreadCounter + 1;
				this.updateRecentList(counterValue);
				this.$store.dispatch('notifications/setCounter', {
					unreadTotal: counterValue
				});
				clearTimeout(this.changeReadStatusBlockTimeout[item.id]);
				this.changeReadStatusBlockTimeout[item.id] = setTimeout(() => {
					this.getRestClient().callMethod('im.notify.read', {
						id: item.id,
						action: item.unread ? 'Y' : 'N',
						only_current: 'Y'
					}).then(() => {
						im_lib_logger.Logger.warn(`Notification ${item.id} unread status set to ${!item.unread}`);
					}).catch(error => {
						console.error(error);
						this.$store.dispatch('notifications/read', {
							ids: [item.id],
							action: !item.unread
						});
						// restore the unread counter in case of an error
						this.updateRecentList(originalCounterBeforeUpdate);
						this.$store.dispatch('notifications/setCounter', {
							unreadTotal: originalCounterBeforeUpdate
						});
					});
				}, 1500);
			},
			delete(item) {
				const itemId = +item.id;
				this.notificationsToDelete.push(itemId);
				const notification = this.$store.getters['notifications/getById'](itemId);
				this.$store.dispatch('notifications/update', {
					id: itemId,
					fields: {
						display: false
					}
				});
				// change the unread counter
				const originalCounterBeforeUpdate = this.unreadCounter;
				const counterValue = notification.unread ? this.unreadCounter - 1 : this.unreadCounter;
				this.updateRecentList(counterValue, true);
				this.$store.dispatch('notifications/setCounter', {
					unreadTotal: counterValue
				});
				this.timer.stop('deleteNotificationServer', 'notifications', true);
				this.timer.start('deleteNotificationServer', 'notifications', .5, () => {
					const idsToDelete = this.notificationsToDelete;
					this.notificationsToDelete = [];
					this.getRestClient().callMethod('im.notify.delete', {
						id: idsToDelete
					}).then(() => {
						idsToDelete.forEach(id => {
							this.$store.dispatch('notifications/delete', {
								id: id
							});
						});
					}).catch(error => {
						console.error(error);
						idsToDelete.forEach(id => {
							this.$store.dispatch('notifications/update', {
								id: id,
								fields: {
									display: true
								}
							});
						});

						// restore the unread counter in case of an error
						this.updateRecentList(originalCounterBeforeUpdate, true);
						this.$store.dispatch('notifications/setCounter', {
							unreadTotal: originalCounterBeforeUpdate
						});
					});
				});
			},
			getObserver(config) {
				if (typeof window.IntersectionObserver === 'undefined' || config.type === ObserverType.none) {
					return {
						observe: () => {},
						unobserve: () => {}
					};
				}
				const observerCallback = entries => {
					entries.forEach(entry => {
						let sendReadEvent = false;
						const entryNotificationId = parseInt(entry.target.dataset.id, 10);
						if (entry.isIntersecting) {
							//on Windows with interface scaling intersectionRatio will never be 1
							if (entry.intersectionRatio >= 0.99) {
								sendReadEvent = true;
								this.notificationsOnScreen.push(entryNotificationId);
							} else if (entry.intersectionRatio > 0 && entry.intersectionRect.height > entry.rootBounds.height / 2) {
								sendReadEvent = true;
								this.notificationsOnScreen.push(entryNotificationId);
							} else {
								this.notificationsOnScreen = this.notificationsOnScreen.filter(notificationId => notificationId !== entryNotificationId);
							}
						} else {
							this.notificationsOnScreen = this.notificationsOnScreen.filter(notificationId => notificationId !== entryNotificationId);
						}
						if (sendReadEvent) {
							this.readNotificationsQueue.add(entryNotificationId);
							this.readNotificationsNodes[entryNotificationId] = entry.target;
						} else {
							this.readNotificationsQueue.delete(entryNotificationId);
							delete this.readNotificationsNodes[entryNotificationId];
						}
						this.readVisibleNotificationsDelayed();
					});
				};
				const observerOptions = {
					root: this.$refs['listNotifications'],
					threshold: new Array(101).fill(0).map((zero, index) => index * 0.01)
				};
				return new IntersectionObserver(observerCallback, observerOptions);
			},
			//events
			onScroll(event) {
				if (!this.isReadyToLoadNewPage(event)) {
					return;
				}
				if (this.remainingPages === 0 || !this.initialDataReceived) {
					return;
				}
				if (this.isLoadingNewPage) {
					this.drawPlaceholders().then(() => {
						this.pagesRequested++;
						im_lib_logger.Logger.warn('Already loading! Draw placeholders and add request, total - ', this.pagesRequested);
					});
				} else
					//if (!this.isLoadingNewPage)
					{
						im_lib_logger.Logger.warn('Starting new request');
						this.isLoadingNewPage = true;
						this.drawPlaceholders().then(() => {
							this.loadNextPage();
						});
					}
			},
			onWindowFocus() {
				this.windowFocused = true;
				this.readVisibleNotifications();
			},
			onWindowBlur() {
				this.windowFocused = false;
			},
			onDoubleClick(event) {
				this.changeReadStatus(event.item);
			},
			onButtonsClick(event) {
				const params = this.getConfirmRequestParams(event);
				const itemId = +params.NOTIFY_ID;
				this.$store.dispatch('notifications/update', {
					id: itemId,
					fields: {
						display: false
					}
				});
				// change the unread counter
				const counterValueBeforeUpdate = this.unreadCounter;
				const counterValue = this.unreadCounter - 1;
				this.updateRecentList(counterValue, true);
				this.$store.dispatch('notifications/setCounter', {
					unreadTotal: counterValue
				});
				this.getRestClient().callMethod('im.notify.confirm', params).then(() => {
					this.$store.dispatch('notifications/delete', {
						id: itemId
					});
				}).catch(() => {
					this.$store.dispatch('notifications/update', {
						id: itemId,
						fields: {
							display: true
						}
					});
					// restore the unread counter in case of an error
					this.updateRecentList(counterValueBeforeUpdate, true);
					this.$store.dispatch('notifications/setCounter', {
						unreadTotal: counterValueBeforeUpdate
					});
				});
			},
			onDeleteClick(event) {
				this.delete(event.item);

				//we need to load more, if we are on the first page and we have more elements.
				if (!this.isLoadingNewPage && this.remainingPages > 0 && this.notification.length === this.perPage - 1) {
					this.isLoadingNewPage = true;
					this.drawPlaceholders().then(() => {
						this.loadNextPage();
					});
				}
			},
			onRightClick(event) {
				if (this.contextPopupInstance !== null) {
					this.closeContextMenuPopup();
				}
				const items = this.getContextMenu(event.item);
				this.contextPopupInstance = main_popup.MenuManager.create({
					id: 'bx-messenger-context-popup-external-data',
					bindElement: event.event,
					items: items,
					events: {
						onPopupClose: () => this.contextPopupInstance.destroy(),
						onPopupDestroy: () => this.contextPopupInstance = null
					}
				});
				this.contextPopupInstance.show();
			},
			onDateFilterClick(event) {
				if (typeof BX !== 'undefined' && BX.calendar && BX.calendar.get().popup) {
					BX.calendar.get().popup.close();
				}
				BX.calendar({
					node: event.target,
					field: event.target,
					bTime: false,
					callback_after: () => {
						this.searchDate = event.target.value;
					}
				});
				return false;
			},
			getContextMenu(notification) {
				const unreadMenuItemText = notification.unread ? this.localize['IM_NOTIFICATIONS_CONTEXT_POPUP_SET_READ'] : this.localize['IM_NOTIFICATIONS_CONTEXT_POPUP_SET_UNREAD'];
				const blockMenuItemText = main_core.Type.isUndefined(BXIM.settingsNotifyBlocked[notification.settingName]) ? this.localize['IM_NOTIFICATIONS_CONTEXT_POPUP_DONT_NOTIFY'] : this.localize['IM_NOTIFICATIONS_CONTEXT_POPUP_NOTIFY'];
				return [{
					text: unreadMenuItemText,
					onclick: (event, item) => {
						this.changeReadStatus(notification);
						this.closeContextMenuPopup();
					}
				}, {
					text: this.localize['IM_NOTIFICATIONS_CONTEXT_POPUP_DELETE_NOTIFICATION'],
					onclick: (event, item) => {
						this.delete(notification);
						this.closeContextMenuPopup();
					}
				}, {
					text: blockMenuItemText,
					onclick: (event, item) => {
						console.log(notification);
						this.closeContextMenuPopup();
					}
				}];
			},
			closeContextMenuPopup() {
				this.contextPopupInstance.destroy();
				this.contextPopupInstance = null;
			},
			getConfirmRequestParams(event) {
				if (event.params) {
					const options = event.params.params.split('|');
					return {
						'NOTIFY_ID': options[0],
						'NOTIFY_VALUE': options[1]
					};
				}
				return null;
			},
			readNotifications(notificationId) {
				const notification = this.$store.getters['notifications/getById'](notificationId);
				if (notification.unread === false) {
					return false;
				}
				this.notificationsToRead.push(notificationId);
				// read on front
				this.$store.dispatch('notifications/read', {
					ids: [notificationId],
					action: true
				});

				// change the unread counter
				const counterValueBeforeUpdate = this.unreadCounter;
				const counterValue = this.unreadCounter - 1;
				this.$store.dispatch('notifications/setCounter', {
					unreadTotal: counterValue
				});
				// update recent counter
				this.updateRecentList(counterValue);
				this.timer.stop('readNotificationServer', 'notifications', true);
				this.timer.start('readNotificationServer', 'notifications', .5, () => {
					const idsToRead = this.notificationsToRead;
					this.notificationsToRead = [];

					// we can read all notifications from some ID, only if we have not received new notifications
					// (otherwise we will read notifications at the top that we are not actually seeing)
					let canReadFromId = false;
					if (this.firstUnreadNotificationOnInit !== null) {
						canReadFromId = Math.max(...idsToRead) <= this.firstUnreadNotificationOnInit;
					}
					let restMethod = 'im.notify.read.list';
					let requestParams = {
						ids: idsToRead,
						action: 'Y'
					};
					if (canReadFromId) {
						const readFromId = Math.min(...idsToRead);
						restMethod = 'im.notify.read';
						requestParams = {
							id: readFromId,
							action: 'Y'
						};
					}
					this.getRestClient().callMethod(restMethod, requestParams).then(() => {
						im_lib_logger.Logger.warn('I have read the notifications', requestParams);
					}).catch(() => {
						this.$store.dispatch('notifications/read', {
							ids: idsToRead,
							action: false
						});
						// restore the unread counter in case of an error
						this.$store.dispatch('notifications/setCounter', {
							unreadTotal: counterValueBeforeUpdate
						});
						this.updateRecentList(counterValueBeforeUpdate);
					});
				});
			},
			getLastItemType(collection) {
				return this.getItemType(collection[collection.length - 1]);
			},
			getItemType(item) {
				if (item.notify_type === im_const.NotificationTypesCodes.confirm) {
					return im_const.NotificationTypesCodes.confirm;
				} else {
					return im_const.NotificationTypesCodes.simple;
				}
			},
			getLatest() {
				let latestNotification = {
					id: 0
				};
				for (const notification of this.notification) {
					if (notification.id > latestNotification.id) {
						latestNotification = notification;
					}
				}
				return latestNotification;
			},
			//todo: refactor this method for the new chat
			showConfirmPopupOnReadAll() {
				const readAll = this.readAll.bind(this);
				BXIM.openConfirm(this.localize['IM_NOTIFICATIONS_READ_ALL_WARNING_POPUP'], [new BX.PopupWindowButton({
					text: this.localize['IM_NOTIFICATIONS_READ_ALL_WARNING_POPUP_YES'],
					className: 'popup-window-button-accept',
					events: {
						click: function () {
							readAll();
							this.popupWindow.close();
						}
					}
				}), new BX.PopupWindowButton({
					text: this.localize['IM_NOTIFICATIONS_READ_ALL_WARNING_POPUP_CANCEL'],
					className: 'popup-window-button',
					events: {
						click: function () {
							this.popupWindow.close();
						}
					}
				})]);
			},
			readAll() {
				if (this.notification.lastId <= 0) {
					return;
				}
				if (!this.isNeedToReadAll) {
					return false;
				}
				this.$store.dispatch('notifications/readAll');
				this.getRestClient().callMethod('im.notify.read', {
					id: 0,
					action: 'Y'
				}).catch(result => {
					this.getInitialData();
					console.error(result);
				});
			},
			updateRecentList(counterValue, setPreview = false) {
				const fields = {
					counter: counterValue
				};
				if (setPreview) {
					const latestNotification = this.getLatest();
					fields.message = {
						id: latestNotification.id,
						text: latestNotification.text,
						date: latestNotification.date
					};
				}
				this.$store.dispatch('recent/update', {
					id: 'notify',
					fields: fields
				});
			},
			onScrollButtonClick(event) {
				if (this.isLoadingNewPage || !this.initialDataReceived) {
					return false;
				}
				let notificationIdToScroll = null;
				if (this.firstUnreadNotificationBelowVisible !== null) {
					notificationIdToScroll = this.firstUnreadNotificationBelowVisible;
				} else if (!this.hasUnreadBelowVisible) {
					notificationIdToScroll = this.firstUnreadNotification.id;
				}
				let firstUnreadNotificationNode = null;
				if (notificationIdToScroll !== null) {
					const selector = `.bx-im-notifications-item[data-id="${notificationIdToScroll}"]`;
					firstUnreadNotificationNode = document.querySelector(selector);
				}
				if (firstUnreadNotificationNode) {
					this.animatedScrollToPosition({
						start: this.$refs['listNotifications'].scrollTop,
						end: firstUnreadNotificationNode.offsetTop
					});
				} else {
					const latestNotification = this.notification[this.notification.length - 1];
					const selector = `.bx-im-notifications-item[data-id="${latestNotification.id}"]`;
					const latestNotificationNode = document.querySelector(selector);
					this.animatedScrollToPosition({
						start: this.$refs['listNotifications'].scrollTop,
						end: latestNotificationNode.offsetTop
					});
				}
			},
			animatedScrollToPosition(params = {}) {
				if (this.animateScrollId) {
					im_lib_animation.Animation.cancel(this.animateScrollId);
					this.scrollAnimating = false;
				}
				if (typeof params === 'function') {
					params = {
						callback: params
					};
				}
				const container = this.$refs.listNotifications;
				let {
					start = container.scrollTop,
					end = container.scrollHeight - container.clientHeight,
					increment = 20,
					callback,
					duration = 500
				} = params;
				if (container && end - start > container.offsetHeight * 3) {
					start = end - container.offsetHeight * 3;
				}
				this.scrollAnimating = true;
				this.animateScrollId = im_lib_animation.Animation.start({
					start,
					end,
					increment,
					duration,
					element: container,
					elementProperty: 'scrollTop',
					callback: () => {
						this.animateScrollId = null;
						this.scrollAnimating = false;
						if (callback && typeof callback === 'function') {
							callback();
						}
					}
				});
			}
		},
		//language=Vue
		template: `
		<div class="bx-messenger-next-notify">
			<div class="bx-messenger-panel-next-wrapper" :style="panelStyles">
				<div class="bx-messenger-panel-next">
					<div>
						<span 
							class="bx-messenger-panel-avatar bx-im-notifications-image-system bx-im-notifications-header-image"
						></span>
						<span class="bx-messenger-panel-title bx-messenger-panel-title-middle" style="flex-shrink: 0;">
							{{ $Bitrix.Loc.getMessage('IM_NOTIFICATIONS_HEADER') }}
						</span>
					</div>
					<div v-if="notification.length > 0" class="bx-im-notifications-header-buttons">
						<transition name="notifications-read-all-fade">
							<div v-if="isNeedToReadAll" class="bx-im-notifications-header-read-all">
								<span
									class='bx-messenger-panel-button bx-im-notifications-header-read-all-icon'
									@click="showConfirmPopupOnReadAll"
									:title="$Bitrix.Loc.getMessage('IM_NOTIFICATIONS_READ_ALL_BUTTON')"
								></span>
							</div>
						</transition>
						<div class="bx-im-notifications-header-filter">
							<span
								:class="['bx-messenger-panel-button bx-messenger-panel-history bx-im-notifications-header-filter-icon', (showSearch? 'bx-im-notifications-header-filter-active': '')]"
								@click="showSearch = !showSearch"
								:title="$Bitrix.Loc.getMessage('IM_NOTIFICATIONS_SEARCH_FILTER_OPEN_BUTTON')"
							></span>
						</div>
					</div>
				</div>
				<div v-if="showSearch" class="bx-im-notifications-header-filter-box" :style="filterBoxStyles">
					<div class="ui-ctl ui-ctl-after-icon ui-ctl-dropdown ui-ctl-xs ui-ctl-w25">
						<div class="ui-ctl-after ui-ctl-icon-angle"></div>
						<select class="ui-ctl-element" v-model="searchType">
							<option value="">
								{{ $Bitrix.Loc.getMessage('IM_NOTIFICATIONS_SEARCH_FILTER_TYPE_PLACEHOLDER') }}
							</option>
							<template v-for="group in filterTypes">
								<template v-if="group.LIST">
									<optgroup :label="group.NAME">
										<option v-for="option in group.LIST" :value="option.ID">
											{{ option.NAME }}
										</option>
									</optgroup>
								</template>
								<template v-else>   
									<option :value="group.MODULE_ID">
										{{ group.NAME }}
									</option>
								</template>
							</template>
							
						</select>
					</div>
					<div class="ui-ctl ui-ctl-textbox ui-ctl-after-icon ui-ctl-xs ui-ctl-w50"> 
						<button class="ui-ctl-after ui-ctl-icon-clear" @click.prevent="searchQuery=''"></button>
						<input
							autofocus
							type="text" 
							class="ui-ctl-element" 
							v-model="searchQuery" 
							:placeholder="$Bitrix.Loc.getMessage('IM_NOTIFICATIONS_SEARCH_FILTER_TEXT_PLACEHOLDER')"
						>
					</div>
					<div class="ui-ctl ui-ctl-after-icon ui-ctl-before-icon ui-ctl-xs ui-ctl-w25">
						<div class="ui-ctl-before ui-ctl-icon-calendar"></div>
						<input 
							type="text" 
							class="ui-ctl-element ui-ctl-textbox" 
							v-model="searchDate"
							@focus.prevent.stop="onDateFilterClick"
							@click.prevent.stop="onDateFilterClick"
							:placeholder="$Bitrix.Loc.getMessage('IM_NOTIFICATIONS_SEARCH_FILTER_DATE_PLACEHOLDER')"
							readonly
						>
						<button class="ui-ctl-after ui-ctl-icon-clear" @click.prevent="searchDate=''"></button>
					</div>
				</div>
			</div>
			<div 
				v-if="showSearch && (searchQuery.length >= 3 || searchType !== '' || searchDate !== '')" 
				class="bx-messenger-list-notifications-wrap"
			>
				<NotificationSearchResult :searchQuery="searchQuery" :searchType="searchType" :searchDate="searchDate"/>
			</div>
			<div v-else class="bx-messenger-list-notifications-wrap">
				<div :class="[ darkTheme ? 'bx-messenger-dark' : '', 'bx-messenger-list-notifications']" @scroll.passive="onScroll" ref="listNotifications">
					<notification-item
						v-for="listItem in visibleNotifications"
						:key="listItem.id"
						:data-id="listItem.id"
						:rawListItem="listItem"
						@dblclick="onDoubleClick"
						@buttonsClick="onButtonsClick"
						@deleteClick="onDeleteClick"
						@contentClick="onContentClick"
						v-bx-im-directive-notifications-observer="
							listItem.sectionCode !== NotificationTypesCodes.placeholder
							? ObserverType.read 
							: ObserverType.none
						"
					/>
					<div
						v-if="notification.length <= 0"
						style="padding-top: 210px; margin-bottom: 20px;"
						class="bx-messenger-box-empty bx-notifier-content-empty"
					>
						{{ $Bitrix.Loc.getMessage('IM_NOTIFICATIONS_NO_ITEMS') }}
					</div>
				</div>
				<!-- Scroll button -->
				<transition name="bx-im-notifications-scroll-button">
					<div v-show="showScrollButton" class="bx-im-notifications-scroll-button-box" @click="onScrollButtonClick">
						<div class="bx-im-notifications-scroll-button">
							<div class="bx-im-notifications-scroll-button-counter">
								<div class="bx-im-notifications-scroll-button-counter-digit">{{ unreadCounter }}</div>
							</div>
							<div :class="arrowButtonClass"></div>
						</div>
					</div>
				</transition>
				
				<mounting-portal :mount-to="popupIdSelector" append v-if="popupInstance">
					<popup :type="contentPopupType" :value="contentPopupValue" :popupInstance="popupInstance"/>
				</mounting-portal>
			</div>
		</div>
	`
	});

})(BX, BX, BX, BX.Messenger.Lib, BX.Messenger.Lib, BX.Messenger.View, BX.Vue, BX.Messenger.Lib, BX.Main, BX, BX, window, window, BX.Messenger.Const, BX.Messenger.Lib, BX.Event);
//# sourceMappingURL=notifications.bundle.js.map
