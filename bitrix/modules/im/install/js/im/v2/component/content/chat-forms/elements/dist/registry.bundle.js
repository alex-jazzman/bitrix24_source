/* eslint-disable */
this.BX = this.BX || {};
this.BX.Messenger = this.BX.Messenger || {};
this.BX.Messenger.v2 = this.BX.Messenger.v2 || {};
this.BX.Messenger.v2.Component = this.BX.Messenger.v2.Component || {};
(function (exports, im_v2_component_elements_button, main_core, im_v2_component_elements_avatar, im_v2_provider_service_chat, ui_entitySelector, im_v2_application_core, im_v2_lib_feature, im_v2_const, im_v2_component_elements_hint, im_v2_component_elements_toggle, im_v2_component_elements_autoDelete, im_v2_component_animation, ui_forms, im_v2_component_elements_dropdown, im_v2_lib_access, im_v2_lib_utils) {
	'use strict';

	// @vue/component
	const ButtonPanel = {
		components: {
			ChatButton: im_v2_component_elements_button.ChatButton
		},
		props: {
			isCreating: {
				type: Boolean,
				required: true
			},
			createButtonTitle: {
				type: String,
				required: true
			},
			createButtonColorScheme: {
				type: [Object, null],
				required: false,
				default: null
			}
		},
		emits: ['create', 'cancel'],
		computed: {
			ButtonSize: () => im_v2_component_elements_button.ButtonSize,
			ButtonColor: () => im_v2_component_elements_button.ButtonColor
		},
		methods: {
			loc(phraseCode) {
				return this.$Bitrix.Loc.getMessage(phraseCode);
			}
		},
		template: `
		<div class="bx-im-chat-forms-button-panel__container">
			<ChatButton
				:size="ButtonSize.XL"
				:color="ButtonColor.Success"
				:customColorScheme="createButtonColorScheme"
				:text="createButtonTitle"
				:isLoading="isCreating"
				:isDisabled="isCreating"
				@click="$emit('create')"
				class="bx-im-chat-forms-button-panel__create-button"
			/>
			<ChatButton
				:size="ButtonSize.XL"
				:color="ButtonColor.Link"
				:text="loc('IM_CREATE_CHAT_CANCEL')"
				:isDisabled="isCreating"
				@click="$emit('cancel')"
			/>
		</div>
	`
	};

	// @vue/component
	const ChatAvatar = {
		name: 'ChatAvatar',
		components: {
			EmptyAvatar: im_v2_component_elements_avatar.EmptyAvatar
		},
		props: {
			avatarFile: {
				required: true,
				validator(value) {
					return value instanceof File || main_core.Type.isNull(value);
				}
			},
			existingAvatarUrl: {
				type: String,
				default: ''
			},
			chatTitle: {
				type: String,
				required: true
			},
			type: {
				type: String,
				default: im_v2_component_elements_avatar.EmptyAvatarType.default
			}
		},
		emits: ['avatarChange'],
		computed: {
			AvatarSize: () => im_v2_component_elements_avatar.AvatarSize,
			preparedAvatar() {
				if (!this.avatarFile) {
					return null;
				}
				return URL.createObjectURL(this.avatarFile);
			},
			avatarToShow() {
				return this.preparedAvatar || this.existingAvatarUrl;
			}
		},
		methods: {
			onAvatarChangeClick() {
				this.$refs.avatarInput.click();
			},
			async onAvatarSelect(event) {
				const input = event.target;
				const file = input.files[0];
				if (!file) {
					return;
				}
				const preparedAvatar = await this.getChatService().prepareAvatar(file);
				if (!preparedAvatar) {
					return;
				}
				this.$emit('avatarChange', preparedAvatar);
			},
			getChatService() {
				if (!this.chatService) {
					this.chatService = new im_v2_provider_service_chat.ChatService();
				}
				return this.chatService;
			}
		},
		template: `
		<EmptyAvatar 
			:size="AvatarSize.XXL"
			:url="avatarToShow"
			:title="chatTitle"
			:type="type"
			@click="onAvatarChangeClick"
			class="bx-im-chat-forms-chat-avatar__container"
		/>
		<input 
			type="file" 
			@change="onAvatarSelect" 
			accept="image/*" 
			class="bx-im-chat-forms-chat-avatar__input" 
			ref="avatarInput"
		>
	`
	};

	// @vue/component
	const ChatMembersSelector = {
		props: {
			chatMembers: {
				type: Array,
				required: true
			},
			customElements: {
				type: Array,
				default: () => []
			},
			undeselectedItems: {
				type: Array,
				default() {
					return [[im_v2_const.SelectorEntity.user, im_v2_application_core.Core.getUserId()]];
				}
			},
			allowTeamsSelect: {
				type: Boolean,
				default: false
			}
		},
		emits: ['membersChange'],
		created() {
			const addButtonCaption = this.loc('IM_CREATE_CHAT_USER_SELECTOR_ADD_MEMBERS_V2');
			this.membersSelector = new ui_entitySelector.TagSelector({
				maxHeight: 99,
				placeholder: '',
				addButtonCaption,
				addButtonCaptionMore: addButtonCaption,
				showCreateButton: false,
				items: this.customElements,
				dialogOptions: {
					enableSearch: true,
					alwaysShowLabels: true,
					context: 'IM_CHAT_CREATE',
					entities: this.getEntitiesConfig(),
					preselectedItems: this.chatMembers,
					undeselectedItems: this.undeselectedItems,
					events: {
						'Item:onSelect': this.onItemsChange,
						'Item:onDeselect': this.onItemsChange
					}
				}
			});
		},
		mounted() {
			this.membersSelector.renderTo(this.$refs.members);
		},
		methods: {
			getEntitiesConfig() {
				const entitiesConfig = [{
					id: im_v2_const.SelectorEntity.user
				}];
				const allowDepartments = im_v2_lib_feature.FeatureManager.isFeatureAvailable(im_v2_lib_feature.Feature.chatDepartments);
				entitiesConfig.push(this.getDepartmentEntityConfig(allowDepartments));
				if (this.allowTeamsSelect && im_v2_lib_feature.FeatureManager.isFeatureAvailable(im_v2_lib_feature.Feature.teamsInStructureAvailable)) {
					entitiesConfig.push(this.getEntityTeamsConfig(allowDepartments));
				}
				return entitiesConfig;
			},
			getDepartmentEntityConfig(allowDepartments) {
				if (allowDepartments) {
					return {
						id: im_v2_const.SelectorEntity.department,
						options: {
							selectMode: 'usersAndDepartments',
							allowFlatDepartments: true,
							allowSelectRootDepartment: true
						}
					};
				}
				return {
					id: im_v2_const.SelectorEntity.department
				};
			},
			getEntityTeamsConfig(allowDepartments) {
				const baseOptionsConfig = {
					includedNodeEntityTypes: ['team'],
					useMultipleTabs: true,
					visual: {
						avatarMode: 'node',
						tagStyle: 'none'
					}
				};
				const departmentOptionsConfig = {
					...baseOptionsConfig,
					selectMode: 'usersAndDepartments',
					allowFlatDepartments: true,
					allowSelectRootDepartment: true
				};
				return {
					id: 'structure-node',
					options: allowDepartments ? departmentOptionsConfig : baseOptionsConfig
				};
			},
			onItemsChange(event) {
				const dialog = event.getTarget();
				const selectedItems = dialog.getSelectedItems();
				this.$emit('membersChange', selectedItems.map(item => this.prepareTag(item)));
			},
			prepareTag(tag) {
				return [tag.getEntityId(), tag.getId()];
			},
			loc(phraseCode) {
				return this.$Bitrix.Loc.getMessage(phraseCode);
			}
		},
		template: `
		<div class="bx-im-chat-forms-chat-members__container" ref="members"></div>
	`
	};

	// @vue/component
	const CreateChatHeading = {
		name: 'CreateChatHeading',
		components: {
			ChatHint: im_v2_component_elements_hint.ChatHint
		},
		props: {
			text: {
				type: String,
				required: true
			},
			hintText: {
				type: String,
				required: false,
				default: ''
			}
		},
		computed: {
			preparedText() {
				return this.text.replace('#SUBTITLE_START#', '<span class="bx-im-content-create-chat__subheading">').replace('#SUBTITLE_END#', '</span>');
			}
		},
		template: `
		<div class="bx-im-content-create-chat__heading_container">
			<div class="bx-im-content-create-chat__heading" v-html="preparedText"></div>
			<ChatHint v-if="hintText" :text="hintText" />
		</div>
	`
	};

	// @vue/component
	const RadioOption = {
		name: 'RadioOption',
		props: {
			items: {
				type: Array,
				required: true
			}
		},
		emits: ['change'],
		data() {
			return {
				groupName: main_core.Text.getRandom()
			};
		},
		computed: {
			options() {
				return this.items;
			},
			selectedValue() {
				return this.options.find(option => {
					return option.selected === true;
				});
			}
		},
		methods: {
			onInput(option) {
				this.$emit('change', option.value);
			}
		},
		template: `
		<div class="bx-im-content-create-chat-radio__container">
			<label v-for="option in options" class="bx-im-content-create-chat-radio__item ui-ctl ui-ctl-radio">
				<input type="radio" class="ui-ctl-element" :name="groupName" :checked="option.selected" @input="onInput(option)">
				<div class="ui-ctl-label-text">
					<!-- Text -->
					<div v-if="option.html" class="bx-im-content-create-chat-radio__label_title" v-html="option.text"></div>
					<div v-else class="bx-im-content-create-chat-radio__label_title">{{ option.text }}</div>
					<!-- Subtext -->
					<template v-if="option.subtext">
						<div v-if="option.html" class="bx-im-content-create-chat-radio__label_subtitle" v-html="option.subtext"></div>
						<div v-else class="bx-im-content-create-chat-radio__label_subtitle">{{ option.subtext }}</div>
					</template>
				</div>
			</label>
		</div>
	`
	};

	// @vue/component
	const TextareaInput = {
		name: 'TextareaInput',
		props: {
			value: {
				type: String,
				default: ''
			},
			placeholder: {
				type: String,
				required: true
			},
			border: {
				type: Boolean,
				required: false,
				default: true
			},
			rounded: {
				type: Boolean,
				required: false,
				default: true
			}
		},
		emits: ['input'],
		computed: {
			containerClasses() {
				return {
					'--no-border': !this.border,
					'--rounded': this.rounded
				};
			}
		},
		methods: {
			onInput(event) {
				this.$emit('input', event.target.value);
			}
		},
		template: `
		<div class="bx-im-content-create-chat__textarea_container" :class="containerClasses">
			<div class="ui-ctl ui-ctl-textarea ui-ctl-w100 ui-ctl-no-resize">
				<textarea
					:value="value"
					:placeholder="placeholder"
					@input="onInput"
					class="bx-im-content-create-chat__textarea ui-ctl-element"
				></textarea>
			</div>
		</div>
	`
	};

	// @vue/component
	const TitleInput = {
		name: 'TitleInput',
		props: {
			modelValue: {
				type: String,
				default: ''
			},
			placeholder: {
				type: String,
				required: true
			}
		},
		emits: ['update:modelValue'],
		mounted() {
			this.$refs.titleInput.focus();
		},
		methods: {
			onInput(event) {
				this.$emit('update:modelValue', event.target.value);
			}
		},
		template: `
		<div class="bx-im-chat-forms-title-input__container">
			<input
				:value="modelValue"
				:placeholder="placeholder"
				@input="onInput"
				class="bx-im-chat-forms-title-input__input"
				ref="titleInput"
			/>
		</div>
	`
	};

	// @vue/component
	const AutoDelete = {
		name: 'AutoDelete',
		components: {
			Toggle: im_v2_component_elements_toggle.Toggle,
			ChatHint: im_v2_component_elements_hint.ChatHint,
			AutoDeleteDropdown: im_v2_component_elements_autoDelete.AutoDeleteDropdown,
			AutoDeletePopup: im_v2_component_elements_autoDelete.AutoDeletePopup
		},
		props: {
			initialDelay: {
				type: Number,
				default: 0
			}
		},
		emits: ['delayChange'],
		data() {
			return {
				delay: this.initialDelay,
				showPopup: false
			};
		},
		computed: {
			ToggleSize: () => im_v2_component_elements_toggle.ToggleSize,
			hintText() {
				return this.loc('IM_CREATE_CHAT_SETTINGS_SECTION_MESSAGES_AUTO_DELETE_HINT');
			},
			isEnabled() {
				return this.delay !== im_v2_const.AutoDeleteDelay.Off;
			},
			isFeatureEnabled() {
				return im_v2_lib_feature.FeatureManager.isFeatureAvailable(im_v2_lib_feature.Feature.messagesAutoDeleteEnabled);
			}
		},
		watch: {
			delay(newValue) {
				this.$emit('delayChange', newValue);
			}
		},
		methods: {
			onChangeAutoDeleteState() {
				if (!this.isFeatureEnabled) {
					im_v2_lib_feature.TariffManager.messagesAutoDelete.openFeatureSlider();
					return;
				}
				if (this.isEnabled) {
					this.delay = im_v2_const.AutoDeleteDelay.Off;
				} else {
					this.showPopup = true;
				}
			},
			onDelayChange(delay) {
				this.delay = delay;
			},
			loc(phraseCode) {
				return this.$Bitrix.Loc.getMessage(phraseCode);
			}
		},
		template: `
		<div class="bx-im-chat-forms-auto-delete__container">
			<Toggle
				:size="ToggleSize.M"
				:isEnabled="isEnabled"
				@click="onChangeAutoDeleteState"
				class="bx-im-chat-forms-auto-delete__toggle"
			/>
			<div class="bx-im-chat-forms-auto-delete__label">
				<div class="bx-im-chat-forms-auto-delete__title">
					{{ loc('IM_CREATE_CHAT_SETTINGS_SECTION_MESSAGES_AUTO_DELETE_TITLE') }}
					<ChatHint :text="hintText" class="bx-im-chat-forms-auto-delete__hint" />
				</div>
				<AutoDeleteDropdown 
					:currentDelay="delay" 
					@delayChange="onDelayChange" 
				/>
			</div>
			<AutoDeletePopup
				v-if="showPopup"
				:autoDeleteDelay="delay"
				@close="showPopup = false"
				@autoDeleteDelayChange="onDelayChange"
			/>
		</div>
	`
	};

	// @vue/component
	const CreateChatSection = {
		components: {
			ExpandAnimation: im_v2_component_animation.ExpandAnimation
		},
		props: {
			name: {
				type: String,
				required: true
			},
			title: {
				type: String,
				required: true
			},
			alwaysOpened: {
				type: Boolean,
				default: false
			}
		},
		data() {
			return {
				isOpened: false
			};
		},
		computed: {
			containerClasses() {
				return [`--${this.name}`, {
					'--active': this.isOpened
				}];
			}
		},
		created() {
			if (this.alwaysOpened) {
				this.isOpened = true;
			}
		},
		methods: {
			onHeaderClick() {
				if (this.alwaysOpened) {
					return;
				}
				this.isOpened = !this.isOpened;
			}
		},
		template: `
		<div :class="containerClasses" class="bx-im-content-create-chat__section bx-im-content-create-chat__section_scope">
			<div @click="onHeaderClick" class="bx-im-content-create-chat__section_header">
				<div class="bx-im-content-create-chat__section_left">
					<div class="bx-im-content-create-chat__section_icon"></div>
					<div class="bx-im-content-create-chat__section_text">{{ title }}</div>
				</div>
				<div v-if="!alwaysOpened" class="bx-im-content-create-chat__section_right"></div>	
			</div>
			<ExpandAnimation>
				<div v-if="isOpened" class="bx-im-content-create-chat__section_content_container">
					<div class="bx-im-content-create-chat__section_content">
						<slot></slot>
					</div>
				</div>
			</ExpandAnimation>
		</div>
	`
	};

	// @vue/component
	const CreateChatExternalSection = {
		props: {
			name: {
				type: String,
				required: true
			},
			title: {
				type: String,
				required: true
			}
		},
		template: `
		<div :class="'--' + name" class="bx-im-content-create-chat__section bx-im-content-create-chat__section_scope --external">
			<div class="bx-im-content-create-chat__section_header">
				<div class="bx-im-content-create-chat__section_left">
					<div class="bx-im-content-create-chat__section_icon"></div>
					<div class="bx-im-content-create-chat__section_text">{{ title }}</div>
				</div>
				<div class="bx-im-content-create-chat__section_right"></div>	
			</div>
		</div>
	`
	};

	// @vue/component
	const SettingsSection = {
		components: {
			CreateChatSection,
			CreateChatHeading,
			TextareaInput,
			RadioOption,
			AutoDelete
		},
		props: {
			description: {
				type: String,
				required: true
			},
			withSearchOption: {
				type: Boolean,
				default: true
			},
			withAutoDeleteOption: {
				type: Boolean,
				default: true
			},
			isAvailableInSearch: {
				type: Boolean,
				default: false
			},
			autoDeleteDelay: {
				type: Number,
				default: 0
			}
		},
		emits: ['chatTypeChange', 'descriptionChange', 'autoDeleteDelayChange'],
		computed: {
			privacyOptions() {
				return [{
					value: false,
					text: this.loc('IM_CREATE_CHAT_SETTINGS_SECTION_PRIVATE_TITLE'),
					subtext: this.loc('IM_CREATE_CHAT_SETTINGS_SECTION_PRIVATE_SUBTITLE'),
					selected: !this.isAvailableInSearch
				}, {
					value: true,
					text: this.loc('IM_CREATE_CHAT_SETTINGS_SECTION_OPEN_TITLE'),
					subtext: this.loc('IM_CREATE_CHAT_SETTINGS_SECTION_OPEN_SUBTITLE'),
					selected: this.isAvailableInSearch
				}];
			}
		},
		methods: {
			onTypeChange(isAvailableInSearch) {
				this.$emit('chatTypeChange', isAvailableInSearch);
			},
			onDescriptionChange(description) {
				this.$emit('descriptionChange', description);
			},
			onAutoDeleteDelayChange(delay) {
				this.$emit('autoDeleteDelayChange', delay);
			},
			loc(phraseCode, replacements = {}) {
				return this.$Bitrix.Loc.getMessage(phraseCode, replacements);
			}
		},
		template: `
		<CreateChatSection name="settings" :title="loc('IM_CREATE_CHAT_SETTINGS_SECTION')">
			<div v-if="withSearchOption" class="bx-im-content-create-chat__section_block">
				<CreateChatHeading :text="loc('IM_CREATE_CHAT_SETTINGS_SECTION_PRIVACY_MSGVER_1')" />
				<RadioOption :items="privacyOptions" @change="onTypeChange" />
			</div>
			<AutoDelete
				v-if="withAutoDeleteOption"
				:initialDelay="autoDeleteDelay"
				@delayChange="onAutoDeleteDelayChange" 
			/>
			<div class="bx-im-content-create-chat__section_block">
				<CreateChatHeading :text="loc('IM_CREATE_CHAT_SETTINGS_SECTION_DESCRIPTION')" />
				<div class="bx-im-chat-forms-settings__description_container">
					<TextareaInput
						:value="description"
						:placeholder="loc('IM_CREATE_CHAT_SETTINGS_SECTION_DESCRIPTION_PLACEHOLDER_MSGVER_1')"
						:rounded="false"
						@input="onDescriptionChange"
					/>
				</div>
			</div>
		</CreateChatSection>
	`
	};

	// @vue/component
	const RoleSelector = {
		name: 'RoleSelector',
		components: {
			Dropdown: im_v2_component_elements_dropdown.Dropdown,
			ChatHint: im_v2_component_elements_hint.ChatHint
		},
		props: {
			title: {
				type: String,
				required: true
			},
			dropdownItems: {
				type: Array,
				required: true
			},
			dropdownId: {
				type: String,
				required: true
			},
			hintText: {
				type: String,
				required: false,
				default: ''
			}
		},
		emits: ['itemChange'],
		template: `
		<div class="bx-im-content-create-chat__section_block">
			<div class="bx-im-content-create-chat__section-header">
				<div class="bx-im-content-create-chat__section-heading">
					{{ title }}
				</div>
				<ChatHint v-if="hintText" :text="hintText" />
			</div>
			<div class="bx-im-chat-forms-chat-settings__manage-select">
				<Dropdown
					:items="dropdownItems"
					:id="dropdownId" 
					@itemChange="$emit('itemChange', $event)"
				/>
			</div>
		</div>
	`
	};

	// @vue/component
	const UserSelector = {
		name: 'UserSelector',
		components: {
			ChatHint: im_v2_component_elements_hint.ChatHint
		},
		props: {
			title: {
				type: String,
				required: true
			},
			hintText: {
				type: String,
				required: false,
				default: ''
			}
		},
		template: `
		<div class="bx-im-content-create-chat__section_block">
			<div class="bx-im-content-create-chat__section-header">
				<div class="bx-im-content-create-chat__section-heading">
					{{ title }}
				</div>
				<ChatHint v-if="hintText" :text="hintText" />
			</div>
			<slot></slot>
		</div>
	`
	};

	// @vue/component
	const OwnerSelector = {
		name: 'OwnerSelector',
		props: {
			ownerId: {
				type: Number,
				required: true
			}
		},
		emits: ['ownerChange'],
		created() {
			this.membersSelector = new ui_entitySelector.TagSelector({
				multiple: false,
				maxHeight: 33,
				placeholder: '',
				addButtonCaption: this.loc('IM_CREATE_CHAT_USER_SELECTOR_CHANGE_OWNER'),
				addButtonCaptionMore: this.loc('IM_CREATE_CHAT_USER_SELECTOR_CHANGE_OWNER'),
				showCreateButton: false,
				dialogOptions: {
					enableSearch: false,
					context: 'IM_CHAT_CREATE',
					entities: [{
						id: im_v2_const.SelectorEntity.user
					}, {
						id: im_v2_const.SelectorEntity.department
					}],
					preselectedItems: [[im_v2_const.SelectorEntity.user, this.ownerId]]
				},
				events: {
					onBeforeTagAdd: event => {
						const {
							tag
						} = event.getData();
						tag.setDeselectable(false);
					},
					onAfterTagAdd: event => {
						const {
							tag
						} = event.getData();
						this.$emit('ownerChange', tag.id);
					}
				}
			});
		},
		mounted() {
			this.membersSelector.renderTo(this.$refs.owner);
		},
		methods: {
			loc(phraseCode) {
				return this.$Bitrix.Loc.getMessage(phraseCode);
			}
		},
		template: `
		<div class="bx-im-chat-forms-sections-owner__container" ref="owner"></div>
	`
	};

	// @vue/component
	const ManagersSelector = {
		props: {
			managerIds: {
				type: Array,
				required: true
			}
		},
		emits: ['managersChange'],
		computed: {
			currentUserId() {
				return im_v2_application_core.Core.getUserId();
			}
		},
		created() {
			const preselectedItems = this.managerIds.map(userId => {
				return [im_v2_const.SelectorEntity.user, userId];
			});
			this.membersSelector = new ui_entitySelector.TagSelector({
				maxHeight: 99,
				placeholder: '',
				addButtonCaption: this.loc('IM_CREATE_CHAT_RIGHTS_SECTION_ADD_MANAGERS'),
				addButtonCaptionMore: this.loc('IM_CREATE_CHAT_RIGHTS_SECTION_ADD_MANAGERS'),
				showCreateButton: false,
				dialogOptions: {
					enableSearch: false,
					context: 'IM_CHAT_CREATE',
					entities: [{
						id: im_v2_const.SelectorEntity.user
					}, {
						id: im_v2_const.SelectorEntity.department
					}],
					preselectedItems
				},
				events: {
					onAfterTagAdd: event => {
						const selector = event.getTarget();
						this.$emit('managersChange', selector.getTags().map(tag => tag.id));
					},
					onAfterTagRemove: event => {
						const selector = event.getTarget();
						this.$emit('managersChange', selector.getTags().map(tag => tag.id));
					}
				}
			});
		},
		mounted() {
			this.membersSelector.renderTo(this.$refs.managers);
		},
		methods: {
			loc(phraseCode) {
				return this.$Bitrix.Loc.getMessage(phraseCode);
			}
		},
		template: `
		<div class="bx-im-chat-forms-sections-managers__container" ref="managers"></div>
	`
	};

	const rightsDropdownItems = [{
		value: im_v2_const.UserRole.member,
		text: main_core.Loc.getMessage('IM_CREATE_CHAT_RIGHTS_SECTION_ROLE_MEMBER')
	}, {
		value: im_v2_const.UserRole.manager,
		text: main_core.Loc.getMessage('IM_CREATE_CHAT_RIGHTS_SECTION_ROLE_MANAGER_V2')
	}, {
		value: im_v2_const.UserRole.owner,
		text: main_core.Loc.getMessage('IM_CREATE_CHAT_RIGHTS_SECTION_ROLE_OWNER'),
		default: true
	}];

	const BlocksByChatType = {
		[im_v2_const.ChatType.channel]: new Set([im_v2_const.ChatActionGroup.manageUsersAdd, im_v2_const.ChatActionGroup.manageUsersDelete, im_v2_const.ChatActionGroup.manageMessages]),
		default: new Set([im_v2_const.ChatActionGroup.manageUsersAdd, im_v2_const.ChatActionGroup.manageUsersDelete, im_v2_const.ChatActionGroup.manageUi, im_v2_const.ChatActionGroup.manageMessages])
	};
	const CanAddUsersCaptionByChatType = {
		[im_v2_const.ChatType.channel]: main_core.Loc.getMessage('IM_CREATE_CHANNEL_RIGHTS_SECTION_MANAGE_USERS_ADD'),
		default: main_core.Loc.getMessage('IM_CREATE_CHAT_RIGHTS_SECTION_MANAGE_USERS_ADD')
	};
	const CanKickUsersCaptionByChatType = {
		[im_v2_const.ChatType.channel]: main_core.Loc.getMessage('IM_CREATE_CHANNEL_RIGHTS_SECTION_MANAGE_USERS_DELETE'),
		default: main_core.Loc.getMessage('IM_CREATE_CHAT_RIGHTS_SECTION_MANAGE_USERS_DELETE')
	};
	const CanSendMessageCaptionByChatType = {
		[im_v2_const.ChatType.channel]: main_core.Loc.getMessage('IM_CREATE_CHANNEL_RIGHTS_SECTION_MANAGE_SENDING'),
		default: main_core.Loc.getMessage('IM_CREATE_CHAT_RIGHTS_SECTION_MANAGE_SENDING_MSGVER_1')
	};
	const OwnerHintByChatType = {
		[im_v2_const.ChatType.channel]: main_core.Loc.getMessage('IM_CREATE_CHANNEL_OWNER_HINT'),
		default: main_core.Loc.getMessage('IM_CREATE_CHAT_OWNER_HINT')
	};
	const ManagerHintByChatType = {
		[im_v2_const.ChatType.channel]: main_core.Loc.getMessage('IM_CREATE_CHANNEL_MANAGER_HINT'),
		default: main_core.Loc.getMessage('IM_CREATE_CHAT_MANAGER_HINT')
	};
	const AddUsersHintByChatType = {
		[im_v2_const.ChatType.channel]: main_core.Loc.getMessage('IM_CREATE_CHANNEL_MANAGE_USERS_ADD_HINT'),
		default: main_core.Loc.getMessage('IM_CREATE_CHAT_MANAGE_USERS_ADD_HINT')
	};
	const DeleteUsersHintByChatType = {
		[im_v2_const.ChatType.channel]: main_core.Loc.getMessage('IM_CREATE_CHANNEL_MANAGE_USERS_DELETE_HINT'),
		default: main_core.Loc.getMessage('IM_CREATE_CHAT_MANAGE_USERS_DELETE_HINT')
	};
	const ManageUiHintByChatType = {
		[im_v2_const.ChatType.channel]: main_core.Loc.getMessage('IM_CREATE_CHANNEL_MANAGE_UI_HINT'),
		default: main_core.Loc.getMessage('IM_CREATE_CHAT_MANAGE_UI_HINT')
	};
	const SendMessagesHintByChatType = {
		[im_v2_const.ChatType.channel]: main_core.Loc.getMessage('IM_CREATE_CHANNEL_MANAGE_SENDING_HINT'),
		default: main_core.Loc.getMessage('IM_CREATE_CHAT_MANAGE_SENDING_HINT')
	};

	// @vue/component
	const RightsSection = {
		name: 'RightsSection',
		components: {
			CreateChatSection,
			RoleSelector,
			UserSelector,
			OwnerSelector,
			ManagersSelector
		},
		props: {
			ownerId: {
				type: Number,
				required: true
			},
			managerIds: {
				type: Array,
				required: true
			},
			manageUsersAdd: {
				type: String,
				required: true
			},
			manageUsersDelete: {
				type: String,
				required: true
			},
			manageUi: {
				type: String,
				required: true
			},
			manageMessages: {
				type: String,
				required: true
			},
			chatType: {
				type: String,
				default: im_v2_const.ChatType.chat
			}
		},
		emits: ['ownerChange', 'managersChange', 'manageUsersAddChange', 'manageUsersDeleteChange', 'manageUiChange', 'manageMessagesChange'],
		computed: {
			PopupType: () => im_v2_const.PopupType,
			manageUsersAddItems() {
				return this.prepareDropdownItems(this.manageUsersAdd);
			},
			manageUsersDeleteItems() {
				return this.prepareDropdownItems(this.manageUsersDelete);
			},
			manageUiItems() {
				return this.prepareDropdownItems(this.manageUi);
			},
			manageMessagesItems() {
				return this.prepareDropdownItems(this.manageMessages);
			},
			showManageUiBlock() {
				const blocksByType = BlocksByChatType[this.chatType] ?? BlocksByChatType.default;
				return blocksByType.has(im_v2_const.ChatActionGroup.manageUi);
			},
			canAddUsersCaption() {
				return CanAddUsersCaptionByChatType[this.chatType] ?? CanAddUsersCaptionByChatType.default;
			},
			canKickUsersCaption() {
				return CanKickUsersCaptionByChatType[this.chatType] ?? CanKickUsersCaptionByChatType.default;
			},
			canSendCaption() {
				return CanSendMessageCaptionByChatType[this.chatType] ?? CanSendMessageCaptionByChatType.default;
			},
			ownerHint() {
				return OwnerHintByChatType[this.chatType] ?? OwnerHintByChatType.default;
			},
			managerHint() {
				return ManagerHintByChatType[this.chatType] ?? ManagerHintByChatType.default;
			},
			addUsersHint() {
				return AddUsersHintByChatType[this.chatType] ?? AddUsersHintByChatType.default;
			},
			deleteUsersHint() {
				return DeleteUsersHintByChatType[this.chatType] ?? DeleteUsersHintByChatType.default;
			},
			manageUiHint() {
				return ManageUiHintByChatType[this.chatType] ?? ManageUiHintByChatType.default;
			},
			sendMessagesHint() {
				return SendMessagesHintByChatType[this.chatType] ?? SendMessagesHintByChatType.default;
			}
		},
		methods: {
			prepareDropdownItems(defaultValue) {
				return rightsDropdownItems.map(item => {
					return {
						...item,
						default: item.value === defaultValue
					};
				});
			},
			onOwnerChange(ownerId) {
				this.$emit('ownerChange', ownerId);
			},
			onManagersChange(managerIds) {
				this.$emit('managersChange', managerIds);
			},
			onManageUsersAddChange(newValue) {
				this.$emit('manageUsersAddChange', newValue);
			},
			onManageUsersDeleteChange(newValue) {
				this.$emit('manageUsersDeleteChange', newValue);
			},
			onManageUiChange(newValue) {
				this.$emit('manageUiChange', newValue);
			},
			onManageMessagesChange(newValue) {
				this.$emit('manageMessagesChange', newValue);
			},
			loc(phraseCode, replacements = {}) {
				return this.$Bitrix.Loc.getMessage(phraseCode, replacements);
			}
		},
		template: `
		<CreateChatSection name="rights" :title="loc('IM_CREATE_CHAT_RIGHTS_SECTION')">
			<UserSelector :title="loc('IM_CREATE_CHAT_SETTINGS_SECTION_OWNER')" :hintText="ownerHint">
				<OwnerSelector :ownerId="ownerId" @ownerChange="onOwnerChange" />
			</UserSelector>
			<UserSelector :title="loc('IM_CREATE_CHAT_RIGHTS_SECTION_MANAGERS')" :hintText="managerHint">
				<ManagersSelector :managerIds="managerIds" @managersChange="onManagersChange" />
			</UserSelector>
			<RoleSelector
				:title="canAddUsersCaption"
				:hintText="addUsersHint"
				:dropdownId="PopupType.createChatManageUsersAddMenu"
				:dropdownItems="manageUsersAddItems"
				@itemChange="onManageUsersAddChange"
			/>
			<RoleSelector
				:title="canKickUsersCaption"
				:hintText="deleteUsersHint"
				:dropdownId="PopupType.createChatManageUsersDeleteMenu"
				:dropdownItems="manageUsersDeleteItems"
				@itemChange="onManageUsersDeleteChange"
			/>
			<RoleSelector
				v-if="showManageUiBlock"
				:title="loc('IM_CREATE_CHAT_RIGHTS_SECTION_MANAGE_UI_MSGVER_2')"
				:hintText="manageUiHint"
				:dropdownId="PopupType.createChatManageUiMenu"
				:dropdownItems="manageUiItems"
				@itemChange="onManageUiChange"
			/>
			<RoleSelector
				:title="canSendCaption"
				:hintText="sendMessagesHint"
				:dropdownId="PopupType.createChatManageMessagesMenu"
				:dropdownItems="manageMessagesItems"
				@itemChange="onManageMessagesChange"
			/>
		</CreateChatSection>
	`
	};

	// @vue/component
	const PrivacySection = {
		components: {
			CreateChatSection,
			RadioOption
		},
		props: {
			withSearchOption: {
				type: Boolean,
				default: true
			},
			isAvailableInSearch: {
				type: Boolean,
				default: false
			}
		},
		emits: ['chatTypeChange'],
		computed: {
			privacyOptions() {
				return [{
					value: false,
					text: this.loc('IM_CREATE_CHAT_PRIVACY_SECTION_PRIVATE_TITLE'),
					subtext: this.loc('IM_CREATE_CHAT_PRIVACY_SECTION_PRIVATE_SUBTITLE_V2'),
					selected: !this.isAvailableInSearch
				}, {
					value: true,
					text: this.loc('IM_CREATE_CHAT_PRIVACY_SECTION_OPEN_TITLE'),
					subtext: this.loc('IM_CREATE_CHAT_PRIVACY_SECTION_OPEN_SUBTITLE_V2'),
					selected: this.isAvailableInSearch
				}];
			}
		},
		methods: {
			onTypeChange(isAvailableInSearch) {
				this.$emit('chatTypeChange', isAvailableInSearch);
			},
			loc(phraseCode, replacements = {}) {
				return this.$Bitrix.Loc.getMessage(phraseCode, replacements);
			}
		},
		template: `
		<CreateChatSection
			name="privacy"
			:title="loc('IM_CREATE_CHAT_PRIVACY_SECTION_V2')"
			:alwaysOpened="true"
		>
			<div class="bx-im-content-create-chat__section_block">
				<RadioOption :items="privacyOptions" @change="onTypeChange" />
			</div>
		</CreateChatSection>
	`
	};

	// @vue/component
	const ConferenceSection = {
		components: {
			CreateChatSection,
			CreateChatHeading,
			Dropdown: im_v2_component_elements_dropdown.Dropdown,
			Toggle: im_v2_component_elements_toggle.Toggle
		},
		props: {
			passwordNeeded: {
				type: Boolean,
				required: true
			},
			password: {
				type: String,
				required: true
			}
		},
		emits: ['passwordNeededChange', 'passwordChange'],
		computed: {
			ToggleSize: () => im_v2_component_elements_toggle.ToggleSize
		},
		methods: {
			onPasswordNeededChange(passwordNeeded) {
				this.$emit('passwordNeededChange', passwordNeeded);
			},
			onPasswordChange(event) {
				this.$emit('passwordChange', event.target.value);
			},
			onToggleLabelClick() {
				this.onPasswordNeededChange(!this.passwordNeeded);
			},
			loc(phraseCode, replacements = {}) {
				return this.$Bitrix.Loc.getMessage(phraseCode, replacements);
			}
		},
		template: `
		<CreateChatSection name="conference" :title="loc('IM_CREATE_CHAT_CONFERENCE_SECTION')">
			<div class="bx-im-content-create-chat__section_block">
				<CreateChatHeading :text="loc('IM_CREATE_CHAT_CONFERENCE_SECTION_PRIVACY')" />
				<div @click="onToggleLabelClick" class="bx-im-chat-forms-chat-settings__type-select">
					<Toggle :size="ToggleSize.M" :isEnabled="passwordNeeded" />
					<div class="bx-im-chat-forms-chat-settings__type-select_label">
						{{ loc('IM_CREATE_CHAT_CONFERENCE_SECTION_USE_PASSWORD') }}
					</div>
				</div>
				<div v-if="passwordNeeded" class="bx-im-chat-forms-chat-settings__password-container ui-ctl ui-ctl-textbox">
					<input
						type="text"
						class="bx-im-content-create-chat-conference__password-input ui-ctl-element"
						:value="password"
						:placeholder="loc('IM_CREATE_CHAT_CONFERENCE_SECTION_PASSWORD_PLACEHOLDER')"
						@input="onPasswordChange"
					/>
				</div>
			</div>
		</CreateChatSection>
	`
	};

	// @vue/component
	const AppearanceSection = {
		components: {
			CreateChatSection
		},
		data() {
			return {};
		},
		template: `
		<Section name="appearance" title="Appearance" />
	`
	};

	class ChatMemberDiffManager {
		#initialManagers = [];
		#initialMembers = [];
		setInitialManagers(initialManagers) {
			this.#initialManagers = initialManagers;
		}
		setInitialChatMembers(initialMembers) {
			this.#initialMembers = initialMembers;
		}
		getAddedMemberEntities(modifiedEntities) {
			const originalSet = new Set(this.#initialMembers.map(elem => JSON.stringify(elem)));
			return modifiedEntities.filter(elem => !originalSet.has(JSON.stringify(elem)));
		}
		getDeletedMemberEntities(modifiedEntities) {
			const modifiedSet = new Set(modifiedEntities.map(elem => JSON.stringify(elem)));
			return this.#initialMembers.filter(elem => !modifiedSet.has(JSON.stringify(elem)));
		}
		getAddedManagers(modifiedArray) {
			const originalSet = new Set(this.#initialManagers);
			return modifiedArray.filter(elem => !originalSet.has(elem));
		}
		getDeletedManagers(modifiedArray) {
			const modifiedSet = new Set(modifiedArray);
			return this.#initialManagers.filter(elem => !modifiedSet.has(elem));
		}
	}

	const checkParentAccess = params => {
		const {
			memberEntities,
			managerIds,
			ownerId,
			parentChatId
		} = params;
		if (hasSelectedDepartments(memberEntities)) {
			return im_v2_lib_access.ChatAccessManager.askForParentAccess();
		}
		const parentDialogId = im_v2_lib_utils.Utils.dialog.buildChatDialogId(parentChatId);
		const allUserIds = collectChatUserIds({
			memberEntities,
			managerIds,
			ownerId
		});
		return im_v2_lib_access.ChatAccessManager.canAddUsersToParent(parentDialogId, allUserIds);
	};
	const hasSelectedDepartments = selectorEntities => {
		return selectorEntities.some(([entityType]) => entityType === im_v2_const.SelectorEntity.department);
	};
	const collectChatUserIds = params => {
		const {
			memberEntities,
			managerIds,
			ownerId
		} = params;
		const entityUserIds = getEntityUserIds(memberEntities);
		const allIds = new Set([...entityUserIds, ...managerIds, ownerId]);
		return [...allIds].map(id => String(id));
	};
	const getEntityUserIds = memberEntities => {
		return memberEntities.filter(([entityType]) => entityType === im_v2_const.SelectorEntity.user).map(([, userId]) => Number(userId));
	};

	exports.AppearanceSection = AppearanceSection;
	exports.AutoDelete = AutoDelete;
	exports.ButtonPanel = ButtonPanel;
	exports.ChatAvatar = ChatAvatar;
	exports.ChatMemberDiffManager = ChatMemberDiffManager;
	exports.ChatMembersSelector = ChatMembersSelector;
	exports.ConferenceSection = ConferenceSection;
	exports.CreateChatExternalSection = CreateChatExternalSection;
	exports.CreateChatHeading = CreateChatHeading;
	exports.CreateChatSection = CreateChatSection;
	exports.PrivacySection = PrivacySection;
	exports.RadioOption = RadioOption;
	exports.RightsSection = RightsSection;
	exports.SettingsSection = SettingsSection;
	exports.TextareaInput = TextareaInput;
	exports.TitleInput = TitleInput;
	exports.checkParentAccess = checkParentAccess;

})(this.BX.Messenger.v2.Component.Content = this.BX.Messenger.v2.Component.Content || {}, BX.Messenger.v2.Component.Elements, BX, BX.Messenger.v2.Component.Elements, BX.Messenger.v2.Service, BX.UI.EntitySelector, BX.Messenger.v2.Application, BX.Messenger.v2.Lib, BX.Messenger.v2.Const, BX.Messenger.v2.Component.Elements, BX.Messenger.v2.Component.Elements, BX.Messenger.v2.Component.Elements, BX.Messenger.v2.Component.Animation, BX, BX.Messenger.v2.Component.Elements, BX.Messenger.v2.Lib, BX.Messenger.v2.Lib);
//# sourceMappingURL=registry.bundle.js.map
