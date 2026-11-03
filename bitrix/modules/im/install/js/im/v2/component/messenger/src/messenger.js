import { type JsonObject } from 'main.core';
import { EventEmitter } from 'main.core.events';
import 'planner';
import 'ui.design-tokens';
import 'ui.fontawesome4';
import 'ui.fonts.opensans';
import { onBeforeUnmount, type BitrixVueComponentProps } from 'ui.vue3';

import 'im.integration.viewer';
import { ListNavigator } from 'im.v2.component.list.navigator';
import { OpenlinesContent } from 'im.v2.component.content.openlines';
import { PlayerBar } from 'im.v2.component.player-bar';
import { EventType, Layout, type LayoutType } from 'im.v2.const';
import 'im.v2.css.classes';
import 'im.v2.css.icons';
import 'im.v2.css.tokens';
import { CHAT_DETAIL_FOCUS_CONTEXT, ChatDetailFocusContext } from 'im.v2.lib.a11y';
import { BulkActionsManager } from 'im.v2.lib.bulk-actions';
import { CounterManager } from 'im.v2.lib.counter';
import { DesktopManager } from 'im.v2.lib.desktop';
import { EscManager } from 'im.v2.lib.esc-manager';
import { Feature, FeatureManager } from 'im.v2.lib.feature';
import { FolderManager } from 'im.v2.lib.folder';
import { InitManager } from 'im.v2.lib.init';
import { LayoutManager } from 'im.v2.lib.layout';
import { Logger } from 'im.v2.lib.logger';
import { ChatPageContextManager } from 'im.v2.lib.page-context';
import { ThemeManager } from 'im.v2.lib.theme';
import { type ImModelLayout } from 'im.v2.model';

import { DesktopOverlay } from './components/desktop-overlay';
import { FolderPanel } from './components/folder-panel/folder-panel';
import { LayoutComponentMap, LayoutsWithRegularChatsList } from './config/component-map';

import './css/messenger.css';

// @vue/component
export const Messenger = {
	name: 'MessengerRoot',
	components: { ListNavigator, OpenlinesContent, DesktopOverlay, FolderPanel, PlayerBar },
	provide(): { chatDetailFocusContext: ChatDetailFocusContext }
	{
		return {
			[CHAT_DETAIL_FOCUS_CONTEXT]: this.focusContext,
		};
	},
	setup(): Object
	{
		// A class instance must stay out of the reactive state, and the context coordinates the detail
		// areas of this messenger instance alone - it goes down together with it.
		const focusContext = new ChatDetailFocusContext();
		onBeforeUnmount(() => focusContext.destroy());

		return { focusContext };
	},
	data(): JsonObject
	{
		return {
			openlinesContentOpened: false,
		};
	},
	computed:
	{
		layout(): ImModelLayout
		{
			return this.$store.getters['application/getLayout'];
		},
		layoutName(): LayoutType
		{
			return this.layout.name;
		},
		entityId(): string
		{
			return this.layout.entityId;
		},
		hasListComponent(): boolean
		{
			return Boolean(this.listComponent);
		},
		listComponent(): ?BitrixVueComponentProps
		{
			// A layout with no list of its own shows the list of the section where plain chats live
			// now. Its own map entry is the fallback of that rule: with no All folder the resolver
			// answers with the chats layout and the entry is taken after all.
			const listLayoutName = LayoutsWithRegularChatsList.has(this.layoutName)
				? FolderManager.getRegularChatsLayout().name
				: this.layoutName;

			return LayoutComponentMap[listLayoutName].list;
		},
		contentComponent(): BitrixVueComponentProps
		{
			return LayoutComponentMap[this.layoutName].content;
		},
		isOpenline(): boolean
		{
			return this.layout.name === Layout.openlines;
		},
		isFolderAvailable(): boolean
		{
			return FeatureManager.isFeatureAvailable(Feature.isChatFoldersWebAvailable);
		},
		isPlayerBarVisible(): boolean
		{
			return FeatureManager.isFeatureAvailable(Feature.isBackgroundAudioPlaybackAvailable) && !this.isOpenline;
		},
		containerClasses(): string[]
		{
			return {
				'--dark-theme': ThemeManager.isDarkTheme(),
				'--light-theme': ThemeManager.isLightTheme(),
				'--desktop': DesktopManager.isDesktop(),
				'--air-design': FeatureManager.isFeatureAvailable(Feature.isAirDesignEnabled),
			};
		},
	},
	watch:
	{
		layoutName:
		{
			handler(newLayoutName)
			{
				if (newLayoutName !== Layout.openlines)
				{
					return;
				}

				this.openlinesContentOpened = true;
			},
			immediate: true,
		},
	},
	created()
	{
		InitManager.init();
		// emit again because external code expects to receive it after the messenger is opened (not via quick-access).
		CounterManager.getInstance().emitCounters();

		LayoutManager.getInstance().bindEvents({ emitter: this.getEmitter() });
		BulkActionsManager.getInstance().bindEvents({ emitter: this.getEmitter() });
		ChatPageContextManager.init();

		Logger.warn('MessengerRoot created');

		void this.getLayoutManager().prepareInitialLayout();
	},
	mounted()
	{
		EscManager.getInstance().register({
			messengerContainer: this.$refs.container,
			context: { emitter: this.getEmitter() },
		});

		EventEmitter.subscribe(EventType.slider.onClose, this.handleSliderClose);
		EventEmitter.emit(EventType.messenger.onReady);
	},
	beforeUnmount()
	{
		this.getLayoutManager().destroy();
		EscManager.getInstance().unregister();

		EventEmitter.unsubscribe(EventType.slider.onClose, this.handleSliderClose);
		EventEmitter.emit(EventType.messenger.onClose);
	},
	methods:
	{
		onSelectChat({ layoutName, dialogId })
		{
			void this.getLayoutManager().setLayout({ name: layoutName, entityId: dialogId });
		},
		getLayoutManager(): LayoutManager
		{
			return LayoutManager.getInstance();
		},
		getEmitter(): EventEmitter
		{
			return this.$Bitrix.eventEmitter;
		},
		handleSliderClose(): void
		{
			EventEmitter.emit(EventType.messenger.onClose);
		},
	},
	template: `
		<div class="bx-im-messenger__scope bx-im-messenger__container --ui-context-content-light" :class="containerClasses" ref="container" data-testid="im-messenger">
			<div class="bx-im-messenger__layout_container">
				<div class="bx-im-messenger__layout_content">
					<FolderPanel v-if="isFolderAvailable" />
					<div v-if="hasListComponent" class="bx-im-messenger__list_container">
						<ListNavigator :listComponent="listComponent" @selectChat="onSelectChat" />
					</div>
					<div class="bx-im-messenger__content_container" :class="{'--with-list': hasListComponent}">
						<PlayerBar v-if="isPlayerBarVisible" />
						<div class="bx-im-messenger__content_layout">
							<div v-if="openlinesContentOpened" class="bx-im-messenger__openlines_container" :class="{'--hidden': !isOpenline}">
								<OpenlinesContent v-show="isOpenline" :entityId="entityId" />
							</div>
							<component v-if="!isOpenline" :is="contentComponent" :entityId="entityId" />
						</div>
					</div>
				</div>
			</div>
		</div>
		<DesktopOverlay />
	`,
};
