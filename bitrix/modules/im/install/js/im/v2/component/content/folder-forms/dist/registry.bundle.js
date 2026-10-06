/* eslint-disable */
this.BX = this.BX || {};
this.BX.Messenger = this.BX.Messenger || {};
this.BX.Messenger.v2 = this.BX.Messenger.v2 || {};
this.BX.Messenger.v2.Component = this.BX.Messenger.v2.Component || {};
(function (exports, im_v2_provider_service_folder, im_v2_lib_folder, im_v2_lib_layout, main_core, im_v2_component_content_chatForms_elements, ui_entitySelector, im_v2_lib_notifier, im_v2_const) {
	'use strict';

	// @vue/component
	const ChatSelector = {
		name: 'ChatSelector',
		props: {
			selectedDialogIds: {
				type: Array,
				required: true
			},
			chatLimit: {
				type: [Number, null],
				default: null
			}
		},
		emits: ['selectionChange'],
		created() {
			this.membersSelector = new ui_entitySelector.TagSelector(this.getSelectorOptions());
		},
		mounted() {
			this.membersSelector.renderTo(this.$refs['chat-selector']);
		},
		methods: {
			getSelectorOptions() {
				const addButtonCaption = this.loc('IM_CREATE_CHAT_USER_SELECTOR_ADD_MEMBERS_V2');
				const itemOrderConfig = {
					sort: 'desc'
				};
				const preselectedItems = this.selectedDialogIds.map(dialogId => {
					return [im_v2_const.SelectorEntity.recent, dialogId];
				});
				return {
					maxHeight: 99,
					placeholder: '',
					addButtonCaption,
					addButtonCaptionMore: addButtonCaption,
					showCreateButton: false,
					dialogOptions: {
						enableSearch: true,
						alwaysShowLabels: true,
						context: 'IM_FOLDER_CREATE',
						recentTabOptions: {
							itemOrder: itemOrderConfig
						},
						searchTabOptions: {
							itemOrder: itemOrderConfig
						},
						entities: [{
							id: im_v2_const.SelectorEntity.recent,
							dynamicLoad: true,
							dynamicSearch: true,
							options: {
								fillDialogByRecent: true
							}
						}],
						preselectedItems,
						events: {
							'Item:onSelect': this.onItemsChange,
							'Item:onDeselect': this.onItemsChange
						}
					}
				};
			},
			onItemsChange(event) {
				const dialog = event.getTarget();
				const selectedItems = dialog.getSelectedItems();
				if (this.chatLimit && selectedItems.length > this.chatLimit) {
					const {
						item
					} = event.getData();
					im_v2_lib_notifier.Notifier.folder.onChatLimitError(this.chatLimit);
					item.deselect();
					return;
				}
				this.$emit('selectionChange', selectedItems.map(item => item.getId()));
			},
			loc(phraseCode) {
				return this.$Bitrix.Loc.getMessage(phraseCode);
			}
		},
		template: `
		<div class="bx-im-content-folder-forms__chat-selector_container" ref="chat-selector" data-testid="folder-form-chat-selector"></div>
	`
	};

	// @vue/component
	const FolderForm = {
		name: 'FolderForm',
		components: {
			TitleInput: im_v2_component_content_chatForms_elements.TitleInput,
			ChatSelector,
			ButtonPanel: im_v2_component_content_chatForms_elements.ButtonPanel
		},
		props: {
			submitButtonTitle: {
				type: String,
				required: true
			},
			title: {
				type: String,
				default: ''
			},
			dialogIds: {
				type: Array,
				default: () => []
			},
			isSubmitting: {
				type: Boolean,
				default: false
			}
		},
		emits: ['update:title', 'update:dialogIds', 'submit', 'cancel'],
		computed: {
			FOLDER_TITLE_MAX_LENGTH: () => im_v2_lib_folder.FolderManager.getMaxTitleLength(),
			FOLDER_MAX_CHATS: () => im_v2_lib_folder.FolderManager.getMaxChatsPerFolder(),
			isTitleFilled() {
				return main_core.Type.isStringFilled(this.title.trim());
			}
		},
		methods: {
			onTitleChange(title) {
				this.$emit('update:title', title);
			},
			onSelectionChange(dialogIds) {
				this.$emit('update:dialogIds', dialogIds);
			},
			loc(phraseCode) {
				return this.$Bitrix.Loc.getMessage(phraseCode);
			}
		},
		template: `
		<div class="bx-im-content-folder-forms__container" data-testid="folder-form-container">
			<div class="bx-im-content-folder-forms__header">
				<div class="bx-im-content-folder-forms__icon"></div>
				<TitleInput
					:modelValue="title"
					:maxLength="FOLDER_TITLE_MAX_LENGTH"
					:placeholder="loc('IM_CREATE_FOLDER_TITLE_PLACEHOLDER')"
					data-testid="folder-form-title-input"
					@update:modelValue="onTitleChange"
				/>
			</div>
			<div class="bx-im-content-folder-forms__heading">
				{{ loc('IM_CREATE_FOLDER_HEADING_TITLE') }}
			</div>
			<div class="bx-im-content-folder-forms__members_container">
				<div class="bx-im-content-folder-forms__members_subtitle">
					{{ loc('IM_CREATE_FOLDER_MEMBERS_SUBTITLE') }}
				</div>
				<ChatSelector
					:chatLimit="FOLDER_MAX_CHATS"
					:selectedDialogIds="dialogIds"
					@selectionChange="onSelectionChange"
				/>
			</div>
		</div>
		<ButtonPanel
			:isCreating="isSubmitting"
			:createButtonDisabled="!isTitleFilled"
			:createButtonTitle="submitButtonTitle"
			data-testid="folder-form-button-panel"
			@create="$emit('submit')"
			@cancel="$emit('cancel')"
		/>
	`
	};

	// @vue/component
	const FolderCreation = {
		name: 'FolderCreation',
		components: {
			FolderForm
		},
		inheritAttrs: false,
		data() {
			return {
				isCreating: false,
				title: '',
				dialogIds: []
			};
		},
		methods: {
			async onSubmit() {
				let newFolder = null;
				this.isCreating = true;
				try {
					const fields = {
						title: this.title.trim(),
						dialogIds: this.dialogIds
					};
					newFolder = await new im_v2_provider_service_folder.FolderService().add(fields);
				} finally {
					this.isCreating = false;
				}
				if (!newFolder) {
					return;
				}
				im_v2_lib_folder.FolderManager.openPersonalFolder(newFolder.id);
			},
			onCancel() {
				void im_v2_lib_layout.LayoutManager.getInstance().restoreOriginLayout();
			},
			loc(phraseCode) {
				return this.$Bitrix.Loc.getMessage(phraseCode);
			}
		},
		template: `
		<FolderForm
			v-model:title="title"
			v-model:dialogIds="dialogIds"
			:isSubmitting="isCreating"
			:submitButtonTitle="loc('IM_CREATE_FOLDER_CONFIRM')"
			@submit="onSubmit"
			@cancel="onCancel"
		/>
	`
	};

	// @vue/component
	const FolderUpdate = {
		name: 'FolderUpdate',
		components: {
			FolderForm
		},
		props: {
			folderId: {
				type: Number,
				required: true
			}
		},
		data() {
			return {
				isUpdating: false,
				title: '',
				dialogIds: []
			};
		},
		computed: {
			folder() {
				return this.$store.getters['recent/folders/getById'](this.folderId);
			}
		},
		created() {
			this.fillForm();
		},
		methods: {
			fillForm() {
				this.title = this.folder.title;
				this.dialogIds = this.folder.definition.chats.map(chat => chat.dialogId);
			},
			async onSubmit() {
				let updatedFolder = null;
				this.isUpdating = true;
				try {
					const fields = {
						title: this.title.trim(),
						dialogIds: this.dialogIds
					};
					updatedFolder = await new im_v2_provider_service_folder.FolderService().update(this.folderId, fields);
				} finally {
					this.isUpdating = false;
				}
				if (!updatedFolder) {
					return;
				}
				void im_v2_lib_layout.LayoutManager.getInstance().setLayout({
					name: im_v2_const.Layout.folder,
					params: {
						folderId: updatedFolder.id
					}
				});
			},
			onCancel() {
				void im_v2_lib_layout.LayoutManager.getInstance().restoreOriginLayout();
			},
			loc(phraseCode) {
				return this.$Bitrix.Loc.getMessage(phraseCode);
			}
		},
		template: `
		<FolderForm
			v-model:title="title"
			v-model:dialogIds="dialogIds"
			:isSubmitting="isUpdating"
			:submitButtonTitle="loc('IM_UPDATE_FOLDER_CONFIRM')"
			@submit="onSubmit"
			@cancel="onCancel"
		/>
	`
	};

	// @vue/component
	const FolderUpdateContent = {
		name: 'FolderUpdateContent',
		components: {
			FolderUpdate
		},
		props: {
			entityId: {
				type: String,
				required: true
			}
		},
		template: `
		<FolderUpdate :key="entityId" :folderId="Number(entityId)" />
	`
	};

	exports.FolderCreation = FolderCreation;
	exports.FolderUpdateContent = FolderUpdateContent;
})(this.BX.Messenger.v2.Component.Content = this.BX.Messenger.v2.Component.Content || {}, BX?.Messenger?.v2?.Service??{}, BX?.Messenger?.v2?.Lib??{}, BX?.Messenger?.v2?.Lib??{}, BX??{}, BX?.Messenger?.v2?.Component?.Content??{}, BX?.UI?.EntitySelector??{}, BX?.Messenger?.v2?.Lib??{}, BX?.Messenger?.v2?.Const??{});;
//# sourceMappingURL=registry.bundle.js.map
