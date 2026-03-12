import 'main.polyfill.intersectionobserver';
import { Dom, Event, Runtime, Type } from 'main.core';
import { BaseEvent, EventEmitter } from 'main.core.events';
import { mapState } from 'ui.vue3.vuex';

import { Logger } from 'im.v2.lib.logger';
import { NotificationTypesCodes, Settings } from 'im.v2.const';
import { NotificationService } from 'im.v2.provider.service.notification';
import { UserListPopup } from 'im.v2.component.elements.user-list-popup';
import { Loader } from 'im.v2.component.elements.loader';
import { Utils } from 'im.v2.lib.utils';
import { SpecialBackground, ThemeManager, type BackgroundStyle } from 'im.v2.lib.theme';
import { NotificationHeaderMenu } from './classes/notification-header-menu';
import { NotificationMenu } from './classes/notification-menu';

import { NotificationComponents } from './components';
import { ItemPlaceholder } from './components/elements/placeholder';
import { ScrollButton } from './components/elements/scroll-button';
import { NotificationFilter } from './filter/notification-filter';
import { NotificationSearchService } from './classes/notification-search-service';
import { NotificationReadService } from './classes/notification-read-service';

import './css/notification-content.css';

import type { JsonObject } from 'main.core';
import type { ImModelNotification } from 'im.v2.model';
import type { BitrixVueComponentProps } from 'ui.vue3';

// @vue/component
export const NotificationContent = {
	name: 'NotificationContent',
	components:
	{
		ItemPlaceholder,
		ScrollButton,
		NotificationFilter,
		UserListPopup,
		Loader,
	},
	directives:
	{
		'notifications-item-observer':
		{
			mounted(element, binding)
			{
				binding.instance.observer.observe(element);
			},
			beforeUnmount(element, binding)
			{
				binding.instance.observer.unobserve(element);
			},
		},
	},
	data(): JsonObject
	{
		return {
			isInitialLoading: false,
			initialLoadComplete: false,
			readQueue: new Set(),
			isNextPageLoading: false,
			notificationsOnScreen: new Set(),
			markedAsUnreadIds: new Set(),

			windowFocused: false,
			showSearchResult: false,

			popupBindElement: null,
			showUserListPopup: false,
			userListIds: null,

			schema: {},
		};
	},
	computed:
	{
		NotificationTypesCodes: () => NotificationTypesCodes,
		notificationCollection(): ImModelNotification[]
		{
			return this.$store.getters['notifications/getSortedCollection'];
		},
		confirmNotifications(): ImModelNotification[]
		{
			return this.notifications.filter((notification) => {
				return notification.sectionCode === NotificationTypesCodes.confirm;
			});
		},
		hasNotifications(): boolean
		{
			return this.notificationCollection.length > 0
		},
		hasConfirmNotifications(): boolean
		{
			return this.confirmNotifications.length > 0;
		},
		simpleNotifications(): ImModelNotification[]
		{
			return this.notifications.filter((notification) => {
				return notification.sectionCode !== NotificationTypesCodes.confirm;
			});
		},
		confirmNotificationsCounter(): number
		{
			return this.confirmNotifications.length;
		},
		formattedCounter(): string
		{
			return this.confirmNotificationsCounter > 99 ? '99+' : String(this.confirmNotificationsCounter);
		},
		searchResultCollection(): ImModelNotification[]
		{
			return this.$store.getters['notifications/getSearchResultCollection'];
		},
		notifications(): ImModelNotification[]
		{
			if (this.showSearchResult)
			{
				return this.searchResultCollection;
			}

			return this.notificationCollection;
		},
		isReadAllAvailable(): boolean
		{
			if (this.showSearchResult)
			{
				return false;
			}

			return this.unreadCounter > 0;
		},
		isEmptyState(): boolean
		{
			return this.notifications.length === 0 && !this.isInitialLoading && !this.isNextPageLoading;
		},
		emptyStateIcon(): string
		{
			return this.showSearchResult
				? 'bx-im-content-notification__not-found-icon'
				: 'bx-im-content-notification__empty-state-icon'
			;
		},
		emptyStateTitle(): string
		{
			return this.showSearchResult
				? this.$Bitrix.Loc.getMessage('IM_NOTIFICATIONS_SEARCH_RESULTS_NOT_FOUND')
				: this.$Bitrix.Loc.getMessage('IM_NOTIFICATIONS_NO_NEW_ITEMS')
			;
		},
		enableAutoRead(): boolean
		{
			return this.$store.getters['application/settings/get'](Settings.notification.enableAutoRead);
		},
		...mapState({
			unreadCounter: (state) => state.notifications.unreadCounter,
		}),
	},
	created()
	{
		this.notificationService = new NotificationService();
		this.notificationSearchService = new NotificationSearchService();
		this.notificationReadService = new NotificationReadService();
		this.headerMenu = new NotificationHeaderMenu();
		this.searchOnServerDelayed = Runtime.debounce(this.searchOnServer, 1500, this);

		Event.bind(window, 'focus', this.onWindowFocus);
		Event.bind(window, 'blur', this.onWindowBlur);

		this.initObserver();

		EventEmitter.subscribe(
			NotificationMenu.events.markAsUnreadClick,
			this.onMarkAsUnreadClick,
		);
	},
	async mounted()
	{
		this.isInitialLoading = true;
		this.windowFocused = document.hasFocus();

		this.schema = await this.notificationService.loadFirstPage();
		this.isInitialLoading = false;
		this.initialLoadComplete = true;
		this.processReadQueue();
	},
	beforeUnmount()
	{
		if (this.initialLoadComplete && this.enableAutoRead)
		{
			this.notificationReadService.readAll([...this.markedAsUnreadIds]);
		}

		this.notificationService.destroy();
		this.notificationSearchService.destroy();
		this.notificationReadService.destroy();

		if (this.headerMenu)
		{
			this.headerMenu.destroy();
		}

		Event.unbind(window, 'focus', this.onWindowFocus);
		Event.unbind(window, 'blur', this.onWindowBlur);

		EventEmitter.unsubscribe(
			NotificationMenu.events.markAsUnreadClick,
			this.onMarkAsUnreadClick,
		);
	},
	methods:
	{
		initObserver()
		{
			this.observer = new IntersectionObserver((entries) => {
				entries.forEach((entry) => {
					const notificationId = Number.parseInt(entry.target.dataset.id, 10);
					if (!entry.isIntersecting)
					{
						this.notificationsOnScreen.delete(notificationId);

						return;
					}

					if (
						entry.intersectionRatio >= 0.7
						|| (entry.intersectionRatio > 0 && entry.intersectionRect.height > entry.rootBounds.height / 2)
					)
					{
						this.read(notificationId);
						this.notificationsOnScreen.add(notificationId);
					}
					else
					{
						this.notificationsOnScreen.delete(notificationId);
					}
				});
			}, {
				root: this.$refs.listNotifications,
				threshold: Array.from({ length: 101 }).fill(0).map((zero, index) => index * 0.01),
			});
		},
		read(notificationIds: number | number[])
		{
			if (!this.enableAutoRead)
			{
				Logger.warn('Notifications: Auto read is disabled!');

				return;
			}

			if (!this.windowFocused)
			{
				return;
			}

			if (Type.isNumber(notificationIds))
			{
				notificationIds = [notificationIds];
			}

			if (!this.initialLoadComplete)
			{
				notificationIds.forEach((id: number) => this.readQueue.add(id));

				return;
			}

			const simpleNotificationIds = notificationIds.filter((notificationId) => {
				const notification = this.$store.getters['notifications/getById'](notificationId);

				return notification.sectionCode !== NotificationTypesCodes.confirm;
			});

			if (simpleNotificationIds.length > 0)
			{
				this.notificationReadService.addToReadQueue(simpleNotificationIds);
				this.notificationReadService.read();
			}
		},
		processReadQueue()
		{
			if (this.readQueue.size === 0)
			{
				return;
			}

			Logger.warn(`Processing initial read queue with ${this.readQueue.size} items.`);
			const idsToRead = [...this.readQueue];
			this.readQueue.clear();

			this.read(idsToRead);
		},
		async searchOnServer(event)
		{
			const result = await this.notificationSearchService.loadFirstPage(event);
			this.isNextPageLoading = false;
			this.setSearchResult(result);
		},
		setSearchResult(items: Array)
		{
			this.$store.dispatch('notifications/setSearchResult', {
				notifications: items,
			});
		},
		getComponentForItem(notification: ImModelNotification): BitrixVueComponentProps
		{
			const componentId = notification.params?.componentId;
			if (componentId && NotificationComponents[componentId])
			{
				return NotificationComponents[componentId];
			}

			return NotificationComponents.CompatibilityEntity;
		},
		onScrollButtonClick(offset)
		{
			this.$refs.listNotifications.scroll({
				top: offset,
				behavior: 'smooth',
			});
		},
		onScroll(event)
		{
			NotificationMenu.closeMenuOnScroll();

			this.showUserListPopup = false;

			if (this.showSearchResult)
			{
				this.onScrollSearchResult(event);
			}
			else
			{
				this.onScrollNotifications(event);
			}
		},
		onClickHeaderMenu(event: BaseEvent): void
		{
			this.headerMenu.openMenu(this.isReadAllAvailable, event.currentTarget);
		},
		onScrollNotifications(event)
		{
			if (
				!Utils.dom.isOneScreenRemaining(event.target)
				|| !this.notificationService.hasMoreItemsToLoad
				|| this.isInitialLoading
				|| this.isNextPageLoading
			)
			{
				return;
			}

			this.isNextPageLoading = true;
			this.notificationService.loadNextPage().then(() => {
				this.isNextPageLoading = false;
			});
		},
		async onScrollSearchResult(event)
		{
			if (
				!Utils.dom.isOneScreenRemaining(event.target)
				|| !this.notificationSearchService.hasMoreItemsToLoad
				|| this.isInitialLoading
				|| this.isNextPageLoading
			)
			{
				return;
			}

			this.isNextPageLoading = true;
			const result = await this.notificationSearchService.loadNextPage();
			this.isNextPageLoading = false;
			this.setSearchResult(result);
		},
		onConfirmButtonsClick(button: { id: string, value: string})
		{
			const { id, value } = button;
			const notificationId = Number.parseInt(id, 10);

			this.notificationsOnScreen.delete(notificationId);
			this.notificationService.sendConfirmAction(notificationId, value);
		},
		onDeleteClick(notificationId: number)
		{
			this.notificationsOnScreen.delete(notificationId);
			this.notificationService.delete(notificationId);
		},
		onMoreUsersClick(event)
		{
			Logger.warn('onMoreUsersClick', event);
			this.popupBindElement = event.event.target;
			this.userListIds = event.users;
			this.showUserListPopup = true;
		},
		onSearch(event)
		{
			if (
				event.searchQuery?.length < 3
				&& event.searchTypes?.length === 0
				&& event.searchDate === ''
				&& (event.searchDateFrom === '' || event.searchDateTo === '')
				&& event.searchAuthors?.length === 0
			)
			{
				this.showSearchResult = false;

				return;
			}

			this.showSearchResult = true;
			const localResult = this.notificationSearchService.searchInModel(event);
			this.$store.dispatch('notifications/clearSearchResult');
			this.$store.dispatch('notifications/setSearchResult', { notifications: localResult, skipValidation: true });

			this.isNextPageLoading = true;
			this.searchOnServerDelayed(event);
		},
		onSendQuickAnswer(event)
		{
			this.notificationService.sendQuickAnswer(event);
		},
		onWindowFocus()
		{
			this.windowFocused = true;
			this.read([...this.notificationsOnScreen]);
		},
		onWindowBlur()
		{
			this.windowFocused = false;
		},
		onLeave(element, done)
		{
			const ANIMATION_DURATION_MS = 250;

			const { height } = element.getBoundingClientRect();
			Dom.style(element, 'height', `${height}px`);

			requestAnimationFrame(() => {
				Dom.addClass(element, '--leave');
				Dom.style(element, 'height', '0px');
			});

			setTimeout(done, ANIMATION_DURATION_MS);
		},
		onDoubleClick(notificationId: number)
		{
			const notification = this.$store.getters['notifications/getById'](notificationId) || this.$store.getters['notifications/getSearchItemById'](notificationId);

			if (!notification)
			{
				return;
			}

			Event.EventEmitter.emit(NotificationMenu.events.markAsUnreadClick, notification);
		},
		onMarkAsUnreadClick(event: BaseEvent): void
		{
			const notification = event.getData();

			if (!notification)
			{
				return;
			}

			const notificationId = notification.id;

			if (notification.read)
			{
				this.markedAsUnreadIds.add(notificationId);
			}
			else
			{
				this.markedAsUnreadIds.delete(notificationId);
			}
		},
		getNotificationsBackgroundStyle(): BackgroundStyle
		{
			return ThemeManager.getBackgroundStyleById(SpecialBackground.notifications);
		},
	},
	template: `
		<div class="bx-im-content-notification__container --ui-context-content-light">
			<div class="bx-im-content-notification__header-container">
				<div class="bx-im-content-notification__header">
					<div class="bx-im-content-notification__header-left-container">
						<div class="bx-im-content-notification__header-panel-container">
							<div class="bx-im-content-notification__panel-title_icon"></div>
							<div class="bx-im-content-notification__panel_text">
								{{ $Bitrix.Loc.getMessage('IM_NOTIFICATIONS_HEADER') }}
							</div>
						</div>
						<NotificationFilter
							v-if="hasNotifications"
							:schema="schema"
							@search="onSearch"
						/>
					</div>
					<div v-if="hasNotifications" class="bx-im-content-notification__header-buttons-container">
						<div
							class="bx-im-content-notification__header-menu"
							@click="onClickHeaderMenu"
						></div>
					</div>
				</div>
			</div>
			<div class="bx-im-content-notification__elements-container">
				<div
					class="bx-im-content-notification__elements"
					@scroll.passive="onScroll"
					ref="listNotifications"
					:style="getNotificationsBackgroundStyle()"
				>
					<div v-if="hasConfirmNotifications" class="bx-im-content-notification__elements-group">
						 <div class="bx-im-content-notification__elements-title">
							 {{ $Bitrix.Loc.getMessage('IM_NOTIFICATIONS_GROUP_TITLE') }}
							 <div
								 class="bx-im-content-notification__elements-group-counter"
							 >
								 {{ formattedCounter }}
							 </div>
						 </div>
						<TransitionGroup 
							name="notification-confirm-item"
							tag="div" 
							@leave="onLeave"
						>
							<component
								v-for="notification in confirmNotifications"
								:is="getComponentForItem(notification)"
								:key="notification.id"
								:data-id="notification.id"
								:notification="notification"
								@confirmButtonsClick="onConfirmButtonsClick"
								@deleteClick="onDeleteClick"
								@moreUsersClick="onMoreUsersClick"
								@sendQuickAnswer="onSendQuickAnswer"
								v-notifications-item-observer
							/>
						</TransitionGroup>
					</div>
					<TransitionGroup 
						name="notification-simple-item"
						tag="div"
						@leave="onLeave"
					>
						<component
							v-for="notification in simpleNotifications"
							:is="getComponentForItem(notification)"
							:key="notification.id"
							:data-id="notification.id"
							:notification="notification"
							@confirmButtonsClick="onConfirmButtonsClick"
							@deleteClick="onDeleteClick"
							@moreUsersClick="onMoreUsersClick"
							@sendQuickAnswer="onSendQuickAnswer"
							@dblclick="onDoubleClick(notification.id)"
							v-notifications-item-observer
						/>
					</TransitionGroup>
					<div v-if="isEmptyState" class="bx-im-content-notification__empty-state-container">
						<div :class="emptyStateIcon"></div>
						<span class="bx-im-content-notification__empty-state-title">
							{{ emptyStateTitle }}
						</span>
					</div>
					<ItemPlaceholder v-if="isInitialLoading" />
					<div v-if="isNextPageLoading" class="bx-im-content-notification__loader-container">
						<Loader />
					</div>
				</div>
				<ScrollButton
					v-if="!isInitialLoading || !isNextPageLoading"
					:unreadCounter="unreadCounter"
					:notificationsOnScreen="notificationsOnScreen"
					@scrollButtonClick="onScrollButtonClick"
				/>
				<UserListPopup
					v-if="showUserListPopup"
					:userIds="userListIds"
					:bindElement="popupBindElement"
					:showPopup="showUserListPopup"
					@close="showUserListPopup = false"
				/>
			</div>
		</div>
	`,
};
