import 'planner';
import 'im.integration.viewer';
import 'ui.design-tokens';
import 'ui.fonts.opensans';
import 'im.v2.css.tokens';
import 'im.v2.css.icons';
import 'im.v2.css.classes';

import { MessengerNavigation } from 'im.v2.component.navigation';
import { OpenlinesContent } from 'im.v2.component.content.openlines';
import { CounterManager } from 'im.v2.lib.counter';
import { Logger } from 'im.v2.lib.logger';
import { InitManager } from 'im.v2.lib.init';
import { Layout, type LayoutType } from 'im.v2.const';
import { CallManager } from 'im.v2.lib.call';
import { ThemeManager } from 'im.v2.lib.theme';
import { DesktopManager } from 'im.v2.lib.desktop';
import { LayoutManager } from 'im.v2.lib.layout';
import { NavigationManager, type NavigationMenuItemParams } from 'im.v2.lib.navigation';

import { LayoutComponentMap } from './config/component-map';

import './css/messenger.css';

import type { JsonObject } from 'main.core';
import type { BitrixVueComponentProps } from 'ui.vue3';
import type { ImModelLayout } from 'im.v2.model';

// @vue/component
export const Messenger = {
	name: 'MessengerRoot',
	components: { MessengerNavigation, OpenlinesContent },
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
				'--air': LayoutManager.getInstance().isAirDesignEnabled(),
			};
		},
		callContainerClass(): string[]
		{
			return [CallManager.viewContainerClass];
		},
		hasNavigation(): boolean
		{
			const hasNavigation = !LayoutManager.getInstance().isAirDesignEnabled();

			return hasNavigation ?? true;
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
		InitManager.start();
		// emit again because external code expects to receive it after the messenger is opened (not via quick-access).
		CounterManager.getInstance().emitCounters();
		LayoutManager.init();
		Logger.warn('MessengerRoot created');

		void this.getLayoutManager().prepareInitialLayout();
	},
	beforeUnmount()
	{
		this.getLayoutManager().destroy();
	},
	methods:
	{
		onNavigationClick(payload: NavigationMenuItemParams)
		{
			NavigationManager.open(payload);
		},
		onEntitySelect({ layoutName, entityId })
		{
			void this.getLayoutManager().setLayout({ name: layoutName, entityId });
		},
		getLayoutManager(): LayoutManager
		{
			return LayoutManager.getInstance();
		},
	},
	template: `
		<div class="bx-im-messenger__scope bx-im-messenger__container" :class="containerClasses">
			<MessengerNavigation
				v-if="hasNavigation"
				:currentLayoutName="layoutName" 
				@navigationClick="onNavigationClick"
			/>
			<div class="bx-im-messenger__layout_container">
				<div class="bx-im-messenger__layout_content">
					<div v-if="hasListComponent" class="bx-im-messenger__list_container">
						<KeepAlive>
							<component :is="listComponent" @selectEntity="onEntitySelect" />
						</KeepAlive>
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
		<div :class="callContainerClass"></div>
	`,
};
