/* eslint-disable */
this.BX = this.BX || {};
this.BX.Messenger = this.BX.Messenger || {};
this.BX.Messenger.v2 = this.BX.Messenger.v2 || {};
(function (exports,planner,ui_fontawesome4,im_integration_viewer,ui_designTokens,ui_fonts_opensans,im_v2_css_tokens,im_v2_css_icons,im_v2_css_classes,im_v2_lib_bulkActions,im_v2_lib_counter,im_v2_lib_escManager,im_v2_lib_logger,im_v2_lib_init,im_v2_lib_theme,im_v2_lib_desktop,im_v2_lib_layout,im_v2_component_content_chat,im_v2_component_content_chatForms_forms,im_v2_component_content_market,im_v2_component_content_notification,im_v2_component_content_openlines,im_v2_component_content_openlinesV2,im_v2_component_content_settings,im_v2_component_list_container_channel,im_v2_component_list_container_collab,im_v2_component_list_container_copilot,im_v2_component_list_container_openline,im_v2_component_list_container_recent,im_v2_component_list_container_task,im_v2_component_desktop_modeSelectionBanner,im_v2_const,im_v2_lib_analytics,im_v2_lib_desktopApi,im_v2_lib_promo) {
	'use strict';

	const LayoutComponentMap = {
	  [im_v2_const.Layout.chat]: {
	    list: im_v2_component_list_container_recent.RecentListContainer,
	    content: im_v2_component_content_chat.ChatContent
	  },
	  [im_v2_const.Layout.createChat]: {
	    list: im_v2_component_list_container_recent.RecentListContainer,
	    content: im_v2_component_content_chatForms_forms.CreateChatContent
	  },
	  [im_v2_const.Layout.updateChat]: {
	    list: im_v2_component_list_container_recent.RecentListContainer,
	    content: im_v2_component_content_chatForms_forms.UpdateChatContent
	  },
	  [im_v2_const.Layout.channel]: {
	    list: im_v2_component_list_container_channel.ChannelListContainer,
	    content: im_v2_component_content_chat.ChatContent
	  },
	  [im_v2_const.Layout.notification]: {
	    list: im_v2_component_list_container_recent.RecentListContainer,
	    content: im_v2_component_content_notification.NotificationContent
	  },
	  [im_v2_const.Layout.openlines]: {
	    content: im_v2_component_content_openlines.OpenlinesContent
	  },
	  [im_v2_const.Layout.openlinesV2]: {
	    list: im_v2_component_list_container_openline.OpenlineListContainer,
	    content: im_v2_component_content_openlinesV2.OpenlinesV2Content
	  },
	  [im_v2_const.Layout.conference]: {
	    list: im_v2_component_list_container_recent.RecentListContainer,
	    content: im_v2_component_content_chat.ChatContent
	  },
	  [im_v2_const.Layout.settings]: {
	    content: im_v2_component_content_settings.SettingsContent
	  },
	  [im_v2_const.Layout.copilot]: {
	    list: im_v2_component_list_container_copilot.CopilotListContainer,
	    content: im_v2_component_content_chat.ChatContent
	  },
	  [im_v2_const.Layout.collab]: {
	    list: im_v2_component_list_container_collab.CollabListContainer,
	    content: im_v2_component_content_chat.ChatContent
	  },
	  [im_v2_const.Layout.market]: {
	    content: im_v2_component_content_market.MarketContent
	  },
	  [im_v2_const.Layout.taskComments]: {
	    list: im_v2_component_list_container_task.TaskListContainer,
	    content: im_v2_component_content_chat.ChatContent
	  }
	};

	// @vue/component
	const DesktopOverlay = {
	  name: 'DesktopOverlay',
	  components: {
	    DesktopModeSelectionBanner: im_v2_component_desktop_modeSelectionBanner.DesktopModeSelectionBanner
	  },
	  data() {
	    return {
	      isBannerVisible: false
	    };
	  },
	  computed: {
	    shouldShowBanner() {
	      const promoManager = im_v2_lib_promo.PromoManager.getInstance();
	      const needToShow = promoManager.needToShow(im_v2_const.PromoId.desktopModeSelection);
	      return needToShow && im_v2_lib_desktopApi.DesktopApi.isChatWindow();
	    }
	  },
	  created() {
	    this.isBannerVisible = this.shouldShowBanner;
	    if (this.isBannerVisible) {
	      im_v2_lib_analytics.Analytics.getInstance().desktopMode.onBannerShow();
	    }
	  },
	  methods: {
	    onCloseBanner() {
	      this.isBannerVisible = false;
	    }
	  },
	  template: `
		<DesktopModeSelectionBanner v-if="isBannerVisible" @close="onCloseBanner" />
	`
	};

	// @vue/component
	const Messenger = {
	  name: 'MessengerRoot',
	  components: {
	    OpenlinesContent: im_v2_component_content_openlines.OpenlinesContent,
	    DesktopOverlay
	  },
	  data() {
	    return {
	      openlinesContentOpened: false
	    };
	  },
	  computed: {
	    layout() {
	      return this.$store.getters['application/getLayout'];
	    },
	    layoutName() {
	      return this.layout.name;
	    },
	    entityId() {
	      return this.layout.entityId;
	    },
	    hasListComponent() {
	      return Boolean(this.listComponent);
	    },
	    listComponent() {
	      return LayoutComponentMap[this.layoutName].list;
	    },
	    contentComponent() {
	      return LayoutComponentMap[this.layoutName].content;
	    },
	    isOpenline() {
	      return this.layout.name === im_v2_const.Layout.openlines;
	    },
	    containerClasses() {
	      return {
	        '--dark-theme': im_v2_lib_theme.ThemeManager.isDarkTheme(),
	        '--light-theme': im_v2_lib_theme.ThemeManager.isLightTheme(),
	        '--desktop': im_v2_lib_desktop.DesktopManager.isDesktop()
	      };
	    }
	  },
	  watch: {
	    layoutName: {
	      handler(newLayoutName) {
	        if (newLayoutName !== im_v2_const.Layout.openlines) {
	          return;
	        }
	        this.openlinesContentOpened = true;
	      },
	      immediate: true
	    }
	  },
	  created() {
	    im_v2_lib_init.InitManager.init();
	    // emit again because external code expects to receive it after the messenger is opened (not via quick-access).
	    im_v2_lib_counter.CounterManager.getInstance().emitCounters();
	    im_v2_lib_layout.LayoutManager.getInstance().bindEvents({
	      emitter: this.getEmitter()
	    });
	    im_v2_lib_bulkActions.BulkActionsManager.getInstance().bindEvents({
	      emitter: this.getEmitter()
	    });
	    im_v2_lib_logger.Logger.warn('MessengerRoot created');
	    void this.getLayoutManager().prepareInitialLayout();
	  },
	  mounted() {
	    im_v2_lib_escManager.EscManager.getInstance().register({
	      messengerContainer: this.$refs.container,
	      context: {
	        emitter: this.getEmitter()
	      }
	    });
	  },
	  beforeUnmount() {
	    this.getLayoutManager().destroy();
	    im_v2_lib_escManager.EscManager.getInstance().unregister();
	  },
	  methods: {
	    onEntitySelect({
	      layoutName,
	      entityId
	    }) {
	      void this.getLayoutManager().setLayout({
	        name: layoutName,
	        entityId
	      });
	    },
	    getLayoutManager() {
	      return im_v2_lib_layout.LayoutManager.getInstance();
	    },
	    getEmitter() {
	      return this.$Bitrix.eventEmitter;
	    }
	  },
	  template: `
		<div class="bx-im-messenger__scope bx-im-messenger__container --ui-context-content-light" :class="containerClasses" ref="container">
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
		<DesktopOverlay />
	`
	};

	exports.Messenger = Messenger;

}((this.BX.Messenger.v2.Component = this.BX.Messenger.v2.Component || {}),BX,BX,BX.Messenger.Integration.Viewer,BX,BX,BX.Messenger.v2.Css,BX.Messenger.v2.Css,BX.Messenger.v2.Css,BX.Messenger.v2.Lib,BX.Messenger.v2.Lib,BX.Messenger.v2.Lib,BX.Messenger.v2.Lib,BX.Messenger.v2.Lib,BX.Messenger.v2.Lib,BX.Messenger.v2.Lib,BX.Messenger.v2.Lib,BX.Messenger.v2.Component.Content,BX.Messenger.v2.Component.Content,BX.Messenger.v2.Component.Content,BX.Messenger.v2.Component.Content,BX.Messenger.v2.Component.Content,BX.Messenger.v2.Component.Content,BX.Messenger.v2.Component.Content,BX.Messenger.v2.Component.List,BX.Messenger.v2.Component.List,BX.Messenger.v2.Component.List,BX.Messenger.v2.Component.List,BX.Messenger.v2.Component.List,BX.Messenger.v2.Component.List,BX.Messenger.v2.Component.Desktop,BX.Messenger.v2.Const,BX.Messenger.v2.Lib,BX.Messenger.v2.Lib,BX.Messenger.v2.Lib));
//# sourceMappingURL=messenger.bundle.js.map
