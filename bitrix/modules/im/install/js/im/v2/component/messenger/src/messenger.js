import { type JsonObject } from 'main.core';
import { type EventEmitter } from 'main.core.events';
import 'planner';
import 'ui.design-tokens';
import 'ui.fontawesome4';
import 'ui.fonts.opensans';
import { type BitrixVueComponentProps } from 'ui.vue3';

import 'im.integration.viewer';
import { ListNavigator } from 'im.v2.component.list.navigator';
import { OpenlinesContent } from 'im.v2.component.content.openlines';
import { Layout, type LayoutType } from 'im.v2.const';
import 'im.v2.css.classes';
import 'im.v2.css.icons';
import 'im.v2.css.tokens';
import { BulkActionsManager } from 'im.v2.lib.bulk-actions';
import { CounterManager } from 'im.v2.lib.counter';
import { DesktopManager } from 'im.v2.lib.desktop';
import { EscManager } from 'im.v2.lib.esc-manager';
import { InitManager } from 'im.v2.lib.init';
import { LayoutManager } from 'im.v2.lib.layout';
import { Logger } from 'im.v2.lib.logger';
import { ThemeManager } from 'im.v2.lib.theme';
import { type ImModelLayout } from 'im.v2.model';

import { DesktopOverlay } from './components/desktop-overlay';
import { LayoutComponentMap } from './config/component-map';

import './css/messenger.css';

// @vue/component
export const Messenger = {
	name: 'MessengerRoot',
	components: { ListNavigator, OpenlinesContent, DesktopOverlay },
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
			return LayoutComponentMap[this.layoutName].list;
		},
		contentComponent(): BitrixVueComponentProps
		{
			return LayoutComponentMap[this.layoutName].content;
		},
		isOpenline(): boolean
		{
			return this.layout.name === Layout.openlines;
		},
		containerClasses(): string[]
		{
			return {
				'--dark-theme': ThemeManager.isDarkTheme(),
				'--light-theme': ThemeManager.isLightTheme(),
				'--desktop': DesktopManager.isDesktop(),
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

		Logger.warn('MessengerRoot created');

		void this.getLayoutManager().prepareInitialLayout();
	},
	mounted()
	{
		EscManager.getInstance().register({
			messengerContainer: this.$refs.container,
			context: { emitter: this.getEmitter() },
		});
	},
	beforeUnmount()
	{
		this.getLayoutManager().destroy();
		EscManager.getInstance().unregister();
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
	},
	template: `
		<div class="bx-im-messenger__scope bx-im-messenger__container --ui-context-content-light" :class="containerClasses" ref="container">
			<div class="bx-im-messenger__layout_container">
				<div class="bx-im-messenger__layout_content">
					<div v-if="hasListComponent" class="bx-im-messenger__list_container">
						<ListNavigator :listComponent="listComponent" @selectChat="onSelectChat" />
					</div>
					<div class="bx-im-messenger__content_container" :class="{'--with-list': hasListComponent}">
						<div v-if="openlinesContentOpened" class="bx-im-messenger__openlines_container" :class="{'--hidden': !isOpenline}">
							<OpenlinesContent v-show="isOpenline" :entityId="entityId" />
						</div>
						<component v-if="!isOpenline" :is="contentComponent" :entityId="entityId" />
					</div>
				</div>
			</div>
		</div>
		<DesktopOverlay />
	`,
};
