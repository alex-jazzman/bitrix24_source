/* eslint-disable */
this.BX = this.BX || {};
this.BX.Messenger = this.BX.Messenger || {};
this.BX.Messenger.v2 = this.BX.Messenger.v2 || {};
this.BX.Messenger.v2.Component = this.BX.Messenger.v2.Component || {};
(function (exports, main_core, ui_system_typography_vue, im_v2_component_content_chatForms_elements, im_v2_component_elements_loader, im_v2_const, im_v2_lib_layout, im_v2_lib_notifier, im_v2_provider_service_folder, ui_iconSet_api_vue, ui_vue3_components_switcher, ui_designTokens_air, ui_iconSet_solid, im_v2_lib_folder, ui_entitySelector, im_v2_lib_analytics) {
	'use strict';

	// `showStateTitle: false` keeps ui.switcher from printing both state captions at once: the air design
	// hides them with `font-size: 0`, which leaves them in the accessibility tree and makes every source
	// read as "on off". The state the row is really in comes from `aria-checked` below.
	const SWITCHER_OPTIONS = {
		size: 'small',
		useAirDesign: true,
		showStateTitle: false
	};

	// @vue/component
	const SourceItem = {
		name: 'SourceItem',
		components: {
			BIcon: ui_iconSet_api_vue.BIcon,
			Switcher: ui_vue3_components_switcher.Switcher,
			Text2Xs: ui_system_typography_vue.Text2Xs,
			TextMd: ui_system_typography_vue.TextMd
		},
		props: {
			item: {
				type: Object,
				required: true
			}
		},
		emits: ['toggle'],
		setup() {
			return {
				SWITCHER_OPTIONS
			};
		},
		computed: {
			folder() {
				return this.$store.getters['recent/folders/getById'](this.item.folderId);
			},
			icon() {
				return im_v2_lib_folder.FolderManager.getFolderIcon(this.item.code);
			},
			// Every source is explained by its own folder, a locked one included.
			description() {
				return main_core.Type.isStringFilled(this.folder.description) ? this.folder.description : '';
			},
			// A source that cannot be switched says so under its own description: a tooltip would be out
			// of reach of the keyboard and of touch, and the reason why the switch is dead has to be
			// readable straight from the row.
			lockedNote() {
				return this.item.togglable ? '' : this.loc('IM_FOLDER_ALL_SETTINGS_SOURCE_LOCKED_NOTE');
			},
			containerClasses() {
				return {
					'--locked': !this.item.togglable
				};
			},
			testId() {
				return `all-folder-settings-source-${this.item.code}`;
			},
			// Deliberately not suffixes of `testId`: a label built on top of the row one would make the row
			// prefix match the nodes inside it too, and every count of the rows would come out doubled.
			switcherTestId() {
				return `all-folder-settings-switcher-${this.item.code}`;
			},
			titleTestId() {
				return `all-folder-settings-title-${this.item.code}`;
			},
			subtitleTestId() {
				return `all-folder-settings-subtitle-${this.item.code}`;
			},
			noteTestId() {
				return `all-folder-settings-note-${this.item.code}`;
			}
		},
		methods: {
			// The whole row switches the source. The switcher reports the change on its own, and its click
			// is kept from reaching the row in the template - caught here as well, it would switch the
			// source twice and land it back where it started.
			onRowClick() {
				this.onToggle(!this.item.enabled);
			},
			// The single gate of both ways to switch the source: a locked one stays as the server sent it.
			onToggle(enabled) {
				if (!this.item.togglable) {
					return;
				}
				this.$emit('toggle', this.item.folderId, enabled);
			},
			loc(phraseCode) {
				return this.$Bitrix.Loc.getMessage(phraseCode);
			}
		},
		// The row itself is the switch: a native button carries the role, the state and the lock, gets the
		// keyboard and the focus for free, and takes its accessible name from the captions inside it. The
		// switcher stays as the visual of the state alone and is hidden from screen readers, so the pair is
		// announced as one control.
		template: `
		<button
			type="button"
			role="switch"
			class="bx-im-content-folder-source-item"
			:class="containerClasses"
			:aria-checked="item.enabled ? 'true' : 'false'"
			:disabled="!item.togglable"
			:data-testid="testId"
			@click="onRowClick"
		>
			<BIcon :name="icon" class="bx-im-content-folder-source-item__icon" />
			<div class="bx-im-content-folder-source-item__text">
				<TextMd
					tag="div"
					wrap="truncate"
					:title="folder.title"
					className="bx-im-content-folder-source-item__title"
					:data-testid="titleTestId"
				>
					{{ folder.title }}
				</TextMd>
				<Text2Xs
					v-if="description"
					tag="div"
					wrap="truncate"
					:title="description"
					className="bx-im-content-folder-source-item__subtitle"
					:data-testid="subtitleTestId"
				>
					{{ description }}
				</Text2Xs>
				<Text2Xs
					v-if="lockedNote"
					tag="div"
					wrap="break-words"
					className="bx-im-content-folder-source-item__note"
					:data-testid="noteTestId"
				>
					{{ lockedNote }}
				</Text2Xs>
			</div>
			<Switcher
				class="bx-im-content-folder-source-item__switcher"
				aria-hidden="true"
				:data-testid="switcherTestId"
				:isChecked="item.enabled"
				:isDisabled="!item.togglable"
				:options="SWITCHER_OPTIONS"
				@click.stop
				@check="onToggle(true)"
				@uncheck="onToggle(false)"
			/>
		</button>
	`
	};

	// @vue/component
	const AllFolderSettings = {
		name: 'AllFolderSettings',
		components: {
			ButtonPanel: im_v2_component_content_chatForms_elements.ButtonPanel,
			HeadlineLg: ui_system_typography_vue.HeadlineLg,
			Loader: im_v2_component_elements_loader.Loader,
			SourceItem,
			TextSm: ui_system_typography_vue.TextSm
		},
		props: {
			// Every content component of a layout is handed `entityId`. This screen serves exactly one
			// folder, so it takes the id from the folder registry and leaves the layout parameter alone.
			entityId: {
				type: String,
				default: ''
			}
		},
		data() {
			return {
				isLoading: true,
				isSaving: false,
				items: [],
				initialCodes: []
			};
		},
		computed: {
			// The one folder the screen serves. Everything it shows of it - the id the sources are asked for
			// and the title of the header - is taken from the registry and from nowhere else. A registry
			// without that folder answers with null, and then there is no screen: see `created()`.
			folder() {
				return this.$store.getters['recent/folders/getByCode'](im_v2_const.SystemFolderCode.all);
			},
			folderId() {
				return this.folder.id;
			},
			// A source whose folder is missing from the registry gets no row. Both are filled the same way at
			// the start of the application, so this is a tab that outlived a change of the availability and
			// not a normal state - a row without a title of its own would break on the folder it cannot find.
			// The set below keeps such a source all the same: dropping it would switch off what was never
			// shown.
			sourceRows() {
				return this.items.filter(item => {
					return Boolean(this.$store.getters['recent/folders/getById'](item.folderId));
				});
			},
			// The whole set that goes to the server. A locked item never travels, neither on nor off:
			// the mandatory base of the folder is the business of the server alone.
			codesToSave() {
				const codes = [];
				this.items.forEach(item => {
					if (!item.togglable) {
						return;
					}
					if (item.enabled) {
						codes.push(item.code);
					}
				});
				return codes;
			},
			hasChanges() {
				if (this.codesToSave.length !== this.initialCodes.length) {
					return true;
				}
				const initialCodes = new Set(this.initialCodes);
				return this.codesToSave.some(code => !initialCodes.has(code));
			}
		},
		created() {
			// The composition of the All folder belongs to the server, so a session left without that folder
			// has nothing to show here - not even the title of the header. The screen then leaves the way both
			// of its buttons leave it and asks for no sources at all. It is reachable past the menu that opens
			// the screen: the reload of the desktop restores the saved layout by its name alone.
			if (!this.folder) {
				void im_v2_lib_layout.LayoutManager.getInstance().restoreOriginLayout();
				return;
			}
			void this.fillSnapshot();
		},
		methods: {
			// The snapshot is taken once, when the screen opens: a folder update arriving from another
			// device leaves the choice the user is making here untouched.
			async fillSnapshot() {
				try {
					const {
						sources
					} = await new im_v2_provider_service_folder.FolderService().getSources(this.folderId);
					if (!main_core.Type.isArray(sources)) {
						// An empty set is a legitimate answer - a portal where nothing of the composition is
						// switchable. A missing one is no answer at all, and the service reports the refusals
						// of the rest alone, so this one is told to the user here.
						im_v2_lib_notifier.Notifier.folder.onSourcesLoadError();
						return;
					}

					// the items keep the order of the answer, the screen never sorts them
					this.items = sources.map(source => ({
						...source
					}));
					this.initialCodes = [...this.codesToSave];
				} catch {
					// the service reports the refusal on its own; the screen stays put with an empty card
					return;
				} finally {
					this.isLoading = false;
				}
			},
			onSourceToggle(folderId, enabled) {
				const item = this.items.find(source => source.folderId === folderId);
				if (!item) {
					return;
				}
				item.enabled = enabled;
			},
			async onSave() {
				this.isSaving = true;
				try {
					await new im_v2_provider_service_folder.FolderService().updateSources(this.folderId, this.codesToSave);
				} catch {
					// the service reports the refusal on its own; the screen keeps the choice and stays put
					return;
				} finally {
					this.isSaving = false;
				}

				// The screen leaves the way the cancel leaves it - on the layout it was entered from, chat and
				// all. Opening the folder by its name alone would take that chat away, and the cache that
				// could give one back holds nothing for a collab or a nested chat.
				void im_v2_lib_layout.LayoutManager.getInstance().restoreOriginLayout();
			},
			onCancel() {
				void im_v2_lib_layout.LayoutManager.getInstance().restoreOriginLayout();
			},
			loc(phraseCode) {
				return this.$Bitrix.Loc.getMessage(phraseCode);
			}
		},
		template: `
		<template v-if="folder">
			<div
				class="bx-im-content-folder-forms__container --all-folder-settings"
				data-testid="all-folder-settings-container"
			>
				<div class="bx-im-content-folder-all-settings__header" data-testid="all-folder-settings-header">
					<div class="bx-im-content-folder-all-settings__icon"></div>
					<HeadlineLg
						className="bx-im-content-folder-all-settings__title"
						data-testid="all-folder-settings-title"
					>
						{{ folder.title }}
					</HeadlineLg>
				</div>
				<div class="bx-im-content-folder-forms__heading" data-testid="all-folder-settings-base-note">
					{{ loc('IM_FOLDER_ALL_SETTINGS_HEADING_TITLE') }}
				</div>
				<TextSm
					tag="div"
					className="bx-im-content-folder-all-settings__section-title"
					data-testid="all-folder-settings-section-title"
				>
					{{ loc('IM_FOLDER_ALL_SETTINGS_SECTION_TITLE') }}
				</TextSm>
				<div class="bx-im-content-folder-all-settings__card" data-testid="all-folder-settings-card">
					<div
						v-if="isLoading"
						class="bx-im-content-folder-all-settings__loader"
						data-testid="all-folder-settings-loader"
					>
						<Loader />
					</div>
					<SourceItem
						v-for="item in sourceRows"
						:key="item.folderId"
						:item="item"
						@toggle="onSourceToggle"
					/>
				</div>
			</div>
			<ButtonPanel
				:isCreating="isSaving"
				:createButtonDisabled="!hasChanges"
				:createButtonTitle="loc('IM_UPDATE_FOLDER_CONFIRM')"
				forceAirDesign
				@create="onSave"
				@cancel="onCancel"
			/>
		</template>
	`
	};

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
								fillDialogByRecent: true,
								searchFolderEligible: true
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
					im_v2_lib_analytics.Analytics.getInstance().folder.onChatLimitException();
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
			forceAirDesign
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
				dialogIds: [],
				savedDialogIds: []
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
				this.savedDialogIds = [...this.dialogIds];
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
				this.sendRemovedChatsAnalytics();
				void im_v2_lib_layout.LayoutManager.getInstance().setLayout({
					name: im_v2_const.Layout.folder,
					params: {
						folderId: updatedFolder.id
					}
				});
			},
			sendRemovedChatsAnalytics() {
				const currentIds = new Set(this.dialogIds);
				const analytics = im_v2_lib_analytics.Analytics.getInstance().folder;
				this.savedDialogIds.filter(dialogId => !currentIds.has(dialogId)).forEach(dialogId => analytics.onDeleteFromFolder({
					dialogId
				}));
				this.savedDialogIds = [...this.dialogIds];
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

	exports.AllFolderSettings = AllFolderSettings;
	exports.FolderCreation = FolderCreation;
	exports.FolderUpdateContent = FolderUpdateContent;
})(this.BX.Messenger.v2.Component.Content = this.BX.Messenger.v2.Component.Content || {}, BX??{}, BX?.UI?.System?.Typography?.Vue??{}, BX?.Messenger?.v2?.Component?.Content??{}, BX?.Messenger?.v2?.Component?.Elements??{}, BX?.Messenger?.v2?.Const??{}, BX?.Messenger?.v2?.Lib??{}, BX?.Messenger?.v2?.Lib??{}, BX?.Messenger?.v2?.Service??{}, BX?.UI?.IconSet??{}, BX?.UI?.Vue3?.Components??{}, window??{}, window??{}, BX?.Messenger?.v2?.Lib??{}, BX?.UI?.EntitySelector??{}, BX?.Messenger?.v2?.Lib??{});;
//# sourceMappingURL=registry.bundle.js.map
