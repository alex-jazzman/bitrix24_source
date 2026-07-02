/* eslint-disable */
this.BX = this.BX || {};
this.BX.Messenger = this.BX.Messenger || {};
this.BX.Messenger.v2 = this.BX.Messenger.v2 || {};
this.BX.Messenger.v2.Component = this.BX.Messenger.v2.Component || {};
(function (exports, main_core_events, im_v2_const, im_v2_lib_layout, im_v2_lib_feature, im_v2_component_list_container_collab) {
	'use strict';

	const NestedListComponentByChatType = {
		[im_v2_const.ChatType.collab]: im_v2_component_list_container_collab.CollabNestedListContainer
	};

	// @vue/component
	const ListNavigator = {
		name: 'ListNavigator',
		props: {
			listComponent: {
				type: Object,
				required: true
			}
		},
		emits: ['selectChat'],
		data() {
			return {
				nestedListContext: null
			};
		},
		computed: {
			layout() {
				return this.$store.getters['application/getLayout'];
			},
			isNestedListActive() {
				return this.nestedListContext !== null;
			},
			isNestedListAvailable() {
				return im_v2_lib_feature.FeatureManager.isFeatureAvailable(im_v2_lib_feature.Feature.isNestedListAvailable);
			},
			nestedListComponent() {
				return NestedListComponentByChatType[this.nestedListContext.chatType] ?? null;
			}
		},
		watch: {
			layout(newLayout, prevLayout) {
				if (im_v2_lib_layout.LayoutManager.getInstance().isChatLayout(newLayout.name)) {
					this.onChatChange(newLayout.entityId);
				}
				if (newLayout.name !== prevLayout.name) {
					this.onLayoutChange(prevLayout.name, newLayout.name);
				}
			}
		},
		created() {
			main_core_events.EventEmitter.subscribe(im_v2_const.EventType.recent.openNestedList, this.onOpenNestedList);
		},
		beforeUnmount() {
			main_core_events.EventEmitter.unsubscribe(im_v2_const.EventType.recent.openNestedList, this.onOpenNestedList);
		},
		methods: {
			openNestedList(params) {
				this.nestedListContext = params;
			},
			closeNestedList() {
				if (im_v2_lib_layout.LayoutManager.getInstance().isChatFormLayout(this.layout.name)) {
					this.$emit('selectChat', {
						layoutName: im_v2_const.Layout.chat,
						dialogId: ''
					});
				}
				this.nestedListContext = null;
			},
			async onSelectChat(event) {
				const {
					dialogId,
					layoutName
				} = event;
				const {
					type,
					chatId
				} = this.$store.getters['chats/get'](dialogId, true);
				if (!this.needToShowNestedListByType(type) || !this.isNestedListAvailable) {
					this.$emit('selectChat', event);
					return;
				}
				this.$emit('selectChat', {
					layoutName,
					dialogId: ''
				});
				await this.$nextTick();
				this.openNestedList({
					chatType: type,
					parentChatId: chatId
				});
			},
			onNestedListSelectChat(dialogId) {
				let layoutName = this.layout.name;
				if (im_v2_lib_layout.LayoutManager.getInstance().isChatFormLayout(this.layout.name)) {
					layoutName = im_v2_const.Layout.chat;
				}
				this.$emit('selectChat', {
					layoutName,
					dialogId
				});
			},
			onChatChange(newDialogId) {
				if (!this.isNestedListActive || newDialogId === '') {
					return;
				}
				const newChat = this.$store.getters['chats/get'](newDialogId, true);
				const nestedListParentChatId = this.nestedListContext.parentChatId;
				const hasCurrentParent = newChat.parentChatId === nestedListParentChatId;
				const isCurrentParent = newChat.chatId === nestedListParentChatId;
				if (!hasCurrentParent && !isCurrentParent) {
					this.closeNestedList();
				}
			},
			onLayoutChange(prevLayoutName, newLayoutName) {
				if (!this.isNestedListActive) {
					return;
				}
				const switchingToForm = im_v2_lib_layout.LayoutManager.getInstance().isChatFormLayout(newLayoutName);
				const switchingFromForm = im_v2_lib_layout.LayoutManager.getInstance().isChatFormLayout(prevLayoutName);
				if (switchingToForm || switchingFromForm) {
					return;
				}
				this.closeNestedList();
			},
			onOpenNestedList(event) {
				const payload = event.getData();
				this.openNestedList(payload);
			},
			needToShowNestedListByType(chatType) {
				return Boolean(NestedListComponentByChatType[chatType]);
			}
		},
		template: `
		<KeepAlive>
			<component :is="listComponent" @selectChat="onSelectChat" />
		</KeepAlive>
		<component
			v-if="isNestedListActive"
			:is="nestedListComponent"
			:parentChatId="nestedListContext.parentChatId"
			@close="closeNestedList"
			@selectChat="onNestedListSelectChat"
		/>
	`
	};

	exports.ListNavigator = ListNavigator;

})(this.BX.Messenger.v2.Component.List = this.BX.Messenger.v2.Component.List || {}, BX.Event, BX.Messenger.v2.Const, BX.Messenger.v2.Lib, BX.Messenger.v2.Lib, BX.Messenger.v2.Component.List);
//# sourceMappingURL=navigator.bundle.js.map
