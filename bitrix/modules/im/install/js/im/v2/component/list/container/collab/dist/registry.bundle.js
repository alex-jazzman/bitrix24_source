/* eslint-disable */
this.BX = this.BX || {};
this.BX.Messenger = this.BX.Messenger || {};
this.BX.Messenger.v2 = this.BX.Messenger.v2 || {};
this.BX.Messenger.v2.Component = this.BX.Messenger.v2.Component || {};
(function (exports, im_v2_component_list_container_elements_createChatPromo, im_v2_component_list_container_elements_createChatButton, im_v2_component_list_items_collab, im_v2_const, im_v2_lib_analytics, im_v2_lib_createChat, im_v2_lib_feature, im_v2_lib_logger, im_v2_lib_permission, main_core, im_v2_component_list_container_elements_listSlider, im_v2_lib_layout, im_v2_component_elements_scrollWithGradient, im_v2_component_list_container_elements_navigationSection, im_v2_component_search, ui_iconSet_api_core, im_v2_lib_menu, ui_iconSet_api_vue) {
	'use strict';

	// @vue/component
	const CollabListContainer = {
		name: 'CollabListContainer',
		components: {
			CollabList: im_v2_component_list_items_collab.CollabList,
			CreateChatPromo: im_v2_component_list_container_elements_createChatPromo.CreateChatPromo,
			CreateChatButton: im_v2_component_list_container_elements_createChatButton.CreateChatButton
		},
		emits: ['selectChat'],
		computed: {
			ChatType: () => im_v2_const.ChatType,
			canCreate() {
				const creationAvailable = im_v2_lib_feature.FeatureManager.isFeatureAvailable(im_v2_lib_feature.Feature.collabCreationAvailable);
				const hasAccess = im_v2_lib_permission.PermissionManager.getInstance().canPerformActionByUserType(im_v2_const.ActionByUserType.createCollab);
				return creationAvailable && hasAccess;
			}
		},
		created() {
			im_v2_lib_logger.Logger.warn('List: Collab container created');
		},
		methods: {
			onSelectChat(dialogId) {
				this.$emit('selectChat', {
					layoutName: im_v2_const.Layout.collab,
					dialogId
				});
			},
			onCreateClick() {
				im_v2_lib_analytics.Analytics.getInstance().chatCreate.onStartClick(im_v2_const.ChatType.collab);
				this.startCollabCreation();
			},
			startCollabCreation() {
				void im_v2_lib_createChat.CreateChatManager.getInstance().startChatCreation(im_v2_const.ChatType.collab);
			},
			loc(phraseCode) {
				return this.$Bitrix.Loc.getMessage(phraseCode);
			}
		},
		template: `
		<div class="bx-im-list-container-collab__container">
			<div class="bx-im-list-container-collab__header_container">
				<div class="bx-im-list-container-collab__header_title">
					{{ loc('IM_LIST_CONTAINER_COLLAB_HEADER_TITLE') }}
				</div>
				<CreateChatButton
					v-if="canCreate"
					@click="onCreateClick"
					class="bx-im-list-container-collab__header_create-collab"
				/>
			</div>
			<div class="bx-im-list-container-collab__elements_container">
				<div class="bx-im-list-container-collab__elements">
					<CollabList @selectChat="onSelectChat" />
				</div>
			</div>
		</div>
	`
	};

	// @vue/component
	const NestedListNavigation = {
		name: 'NestedListNavigation',
		components: {
			ScrollWithGradient: im_v2_component_elements_scrollWithGradient.ScrollWithGradient,
			NavigationSection: im_v2_component_list_container_elements_navigationSection.NavigationSection
		},
		props: {
			parentChatId: {
				type: Number,
				required: true
			},
			sections: {
				type: Array,
				required: true
			},
			currentSection: {
				type: String,
				required: true
			}
		},
		computed: {
			ScrollDirection: () => im_v2_component_elements_scrollWithGradient.ScrollDirection,
			items() {
				return this.sections;
			}
		},
		methods: {
			getSectionCounter(type) {
				return this.$store.getters['counters/getChildrenTotalCounter'](this.parentChatId, type);
			}
		},
		template: `
		<ScrollWithGradient :direction="ScrollDirection.horizontal">
			<div class="bx-im-nested-list-collab__section_container">
				<div v-for="{ type, title } in items" :key="type" class="bx-im-nested-list-collab__section">
					<NavigationSection
						:text="title"
						:isSelected="currentSection === type"
						:counter="getSectionCounter(type)"
						@click="$emit('selectSection', type)"
					/>
				</div>
			</div>
		</ScrollWithGradient>
	`
	};

	class CreateMenu extends im_v2_lib_menu.BaseMenu {
		getMenuOptions() {
			return {
				...super.getMenuOptions(),
				angle: false
			};
		}
		getMenuItems() {
			return [this.getTaskItem(), this.getMeetingItem(), this.getChatItem(), this.getFlowItem()];
		}
		getTaskItem() {
			return {
				title: main_core.Loc.getMessage('IM_LIST_CONTAINER_COLLAB_CREATE_TASK'),
				subtitle: main_core.Loc.getMessage('IM_LIST_CONTAINER_COLLAB_CREATE_TASK_SUBTITLE'),
				icon: ui_iconSet_api_core.Outline.TASK,
				onClick: () => {
					//
				}
			};
		}
		getMeetingItem() {
			return {
				title: main_core.Loc.getMessage('IM_LIST_CONTAINER_COLLAB_CREATE_MEETING'),
				subtitle: main_core.Loc.getMessage('IM_LIST_CONTAINER_COLLAB_CREATE_MEETING_SUBTITLE'),
				icon: ui_iconSet_api_core.Outline.CALENDAR_WITH_SLOTS,
				onClick: () => {
					//
				}
			};
		}
		getChatItem() {
			return {
				title: main_core.Loc.getMessage('IM_LIST_CONTAINER_COLLAB_CREATE_CHAT'),
				subtitle: main_core.Loc.getMessage('IM_LIST_CONTAINER_COLLAB_CREATE_CHAT_SUBTITLE'),
				icon: ui_iconSet_api_core.Outline.CHATS,
				onClick: () => {
					if (im_v2_lib_createChat.CreateChatManager.getInstance().isCreationLayoutActive(im_v2_lib_createChat.CreatableChatType.collabChat)) {
						return;
					}
					void im_v2_lib_createChat.CreateChatManager.getInstance().startChatCreation(im_v2_lib_createChat.CreatableChatType.collabChat, {
						parentChatId: this.context.parentChatId
					});
				}
			};
		}
		getFlowItem() {
			return {
				title: main_core.Loc.getMessage('IM_LIST_CONTAINER_COLLAB_CREATE_FLOW'),
				subtitle: main_core.Loc.getMessage('IM_LIST_CONTAINER_COLLAB_CREATE_FLOW_SUBTITLE'),
				icon: ui_iconSet_api_core.Outline.BOTTLENECK,
				onClick: () => {
					//
				}
			};
		}
	}

	// @vue/component
	const NestedListToolbar = {
		name: 'NestedListToolbar',
		components: {
			CreateChatButton: im_v2_component_list_container_elements_createChatButton.CreateChatButton,
			ChatSearchInput: im_v2_component_search.ChatSearchInput
		},
		props: {
			parentChatId: {
				type: Number,
				required: true
			}
		},
		emits: ['createClick'],
		mounted() {
			this.contextMenuManager = new CreateMenu();
		},
		beforeUnmount() {
			this.contextMenuManager.destroy();
		},
		methods: {
			onCreateClick(event) {
				const context = {
					parentChatId: this.parentChatId
				};
				this.contextMenuManager.openMenu(context, event.currentTarget);
			}
		},
		template: `
		<div class="bx-im-nested-list-collab__subheader">
			<div class="bx-im-nested-list-collab__search">
				<ChatSearchInput :searchMode="false" />
			</div>
			<CreateChatButton @click="onCreateClick" class="bx-im-nested-list-collab__subheader_create-button" ref="create-button" />
		</div>
	`
	};

	// @vue/component
	const NestedListHeader = {
		name: 'NestedListHeader',
		components: {
			BIcon: ui_iconSet_api_vue.BIcon
		},
		props: {
			title: {
				type: String,
				required: true
			}
		},
		computed: {
			OutlineIcons: () => ui_iconSet_api_vue.Outline
		},
		template: `
		<div class="bx-im-nested-list-collab__header">
			<div class="bx-im-nested-list-collab__title --ellipsis" :title="title">{{ title }}</div>
			<BIcon :name="OutlineIcons.APPS" :hoverable="true" class="bx-im-nested-list-collab__menu-icon" />
		</div>
	`
	};

	const CollabSections = {
		[im_v2_const.RecentType.collabDefault]: {
			type: im_v2_const.RecentType.collabDefault,
			title: main_core.Loc.getMessage('IM_LIST_CONTAINER_COLLAB_SECTION_DEFAULT'),
			component: im_v2_component_list_items_collab.CollabNestedDefaultList
		},
		[im_v2_const.RecentType.taskComments]: {
			type: im_v2_const.RecentType.taskComments,
			title: main_core.Loc.getMessage('IM_LIST_CONTAINER_COLLAB_SECTION_TASK_COMMENTS'),
			component: im_v2_component_list_items_collab.CollabNestedTaskList
		},
		[im_v2_const.RecentType.collabChat]: {
			type: im_v2_const.RecentType.collabChat,
			title: main_core.Loc.getMessage('IM_LIST_CONTAINER_COLLAB_SECTION_CHATS_MSGVER_2'),
			component: im_v2_component_list_items_collab.CollabNestedChatList
		},
		[im_v2_const.RecentType.calendar]: {
			type: im_v2_const.RecentType.calendar,
			title: main_core.Loc.getMessage('IM_LIST_CONTAINER_COLLAB_SECTION_CALENDAR'),
			component: im_v2_component_list_items_collab.CollabNestedCalendarList
		}
	};

	// @vue/component
	const CollabNestedListContainer = {
		name: 'CollabNestedListContainer',
		components: {
			RecentListSlider: im_v2_component_list_container_elements_listSlider.RecentListSlider,
			NestedListNavigation,
			NestedListHeader,
			NestedListToolbar
		},
		props: {
			parentChatId: {
				type: Number,
				required: true
			}
		},
		emits: ['selectChat', 'close'],
		data() {
			return {
				currentSection: im_v2_const.RecentType.collabDefault
			};
		},
		computed: {
			layout() {
				return this.$store.getters['application/getLayout'];
			},
			parentChat() {
				return this.$store.getters['chats/getByChatId'](this.parentChatId, true);
			},
			listComponent() {
				const matchingItem = CollabSections[this.currentSection];
				if (!matchingItem) {
					return null;
				}
				return matchingItem.component;
			},
			navigationSections() {
				return Object.values(CollabSections);
			}
		},
		methods: {
			onBeforeClose() {
				if (im_v2_lib_layout.LayoutManager.getInstance().isChatLayout(this.layout.name)) {
					im_v2_lib_layout.LayoutManager.getInstance().clearCurrentLayoutEntityId();
				}
			},
			onAfterClose() {
				this.$emit('close');
			},
			onSelectSection(selectedSection) {
				this.currentSection = selectedSection;
			}
		},
		template: `
		<RecentListSlider @beforeClose="onBeforeClose" @afterClose="onAfterClose">
			<template #header>
				<NestedListHeader :title="parentChat.name" />
			</template>
			<template #subheader>
				<NestedListToolbar :parentChatId="parentChatId" />
				<NestedListNavigation
					:parentChatId="parentChatId"
					:sections="navigationSections"
					:currentSection="currentSection"
					@selectSection="onSelectSection"
				/>
			</template>
			<template #content>
				<KeepAlive>
					<component
						:is="listComponent"
						:parentChatId="parentChatId"
						@selectChat="$emit('selectChat', $event)"
						@loadError="$emit('close')"
					/>
				</KeepAlive>
			</template>
		</RecentListSlider>
	`
	};

	exports.CollabListContainer = CollabListContainer;
	exports.CollabNestedListContainer = CollabNestedListContainer;

})(this.BX.Messenger.v2.Component.List = this.BX.Messenger.v2.Component.List || {}, BX.Messenger.v2.Component.List, BX.Messenger.v2.Component.List, BX.Messenger.v2.Component.List, BX.Messenger.v2.Const, BX.Messenger.v2.Lib, BX.Messenger.v2.Lib, BX.Messenger.v2.Lib, BX.Messenger.v2.Lib, BX.Messenger.v2.Lib, BX, BX.Messenger.v2.Component.List, BX.Messenger.v2.Lib, BX.Messenger.v2.Component.Elements, BX.Messenger.v2.Component.List, BX.Messenger.v2.Component, BX.UI.IconSet, BX.Messenger.v2.Lib, BX.UI.IconSet);
//# sourceMappingURL=registry.bundle.js.map
