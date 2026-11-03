/* eslint-disable */
this.BX = this.BX || {};
this.BX.Messenger = this.BX.Messenger || {};
this.BX.Messenger.v2 = this.BX.Messenger.v2 || {};
this.BX.Messenger.v2.Component = this.BX.Messenger.v2.Component || {};
(function (exports, im_v2_lib_logger, im_v2_const, im_public, im_v2_lib_desktopApi, im_v2_lib_helpdesk, im_v2_lib_feedback, main_core, im_v2_component_dialog_chat, im_v2_lib_theme, im_v2_provider_service_settings, im_v2_component_message_elements, ui_iconSet_api_vue, ui_reaction_item, ui_reaction_item_vue, ui_reaction_picker, im_v2_application_core, im_v2_lib_demo, im_v2_lib_confirm, ui_forms, im_v2_component_elements_hint, im_v2_lib_analytics, im_v2_lib_utils, im_v2_lib_feature) {
	'use strict';

	const SectionMetaData = {
		appearance: {
			name: main_core.Loc.getMessage('IM_CONTENT_SETTINGS_SECTION_LIST_APPEARANCE_MSGVER_1'),
			icon: 'fa-solid fa-brush'
		},
		notification: {
			name: main_core.Loc.getMessage('IM_CONTENT_SETTINGS_SECTION_LIST_NOTIFICATION'),
			icon: 'fa-solid fa-bell'
		},
		hotkey: {
			name: main_core.Loc.getMessage('IM_CONTENT_SETTINGS_SECTION_LIST_HOTKEY'),
			icon: 'fa-solid fa-keyboard'
		},
		message: {
			name: main_core.Loc.getMessage('IM_CONTENT_SETTINGS_SECTION_LIST_MESSAGE'),
			icon: 'fa-solid fa-message'
		},
		recent: {
			name: main_core.Loc.getMessage('IM_CONTENT_SETTINGS_SECTION_LIST_RECENT_MSGVER_1'),
			icon: 'fa-solid fa-list-ul'
		},
		desktop: {
			name: main_core.Loc.getMessage('IM_CONTENT_SETTINGS_SECTION_LIST_DESKTOP'),
			icon: 'fa-solid fa-desktop'
		},
		help: {
			name: main_core.Loc.getMessage('IM_CONTENT_SETTINGS_SECTION_LIST_HELP'),
			icon: 'fa-solid fa-question'
		},
		feedback: {
			name: main_core.Loc.getMessage('IM_CONTENT_SETTINGS_SECTION_LIST_FEEDBACK'),
			icon: 'fa-solid fa-comment'
		}
	};

	const AdditionalSections = {
		help: 'help',
		feedback: 'feedback'
	};

	// @vue/component
	const SectionList = {
		name: 'SectionList',
		props: {
			activeSection: {
				type: String,
				required: true
			}
		},
		emits: ['sectionClick'],
		data() {
			return {};
		},
		computed: {
			AdditionalSections: () => AdditionalSections,
			disabledSections() {
				const disabledSections = new Set([im_v2_const.SettingsSection.message]);
				if (!im_v2_lib_desktopApi.DesktopApi.isDesktop()) {
					disabledSections.add(im_v2_const.SettingsSection.desktop);
				}
				return disabledSections;
			},
			sections() {
				return Object.keys(im_v2_const.SettingsSection).filter(section => {
					return !this.disabledSections.has(section);
				});
			}
		},
		methods: {
			getSectionName(section) {
				return SectionMetaData[section].name;
			},
			getSectionIconClass(section) {
				return SectionMetaData[section].icon;
			},
			onHelpClick() {
				const ARTICLE_CODE = '17373696';
				im_v2_lib_helpdesk.openHelpdeskArticle(ARTICLE_CODE);
			},
			onFeedbackClick() {
				void new im_v2_lib_feedback.FeedbackManager().openGeneralForm();
			},
			loc(phraseCode) {
				return this.$Bitrix.Loc.getMessage(phraseCode);
			}
		},
		template: `
		<div class="bx-im-settings-section-list__container">
			<div class="bx-im-settings-section-list__title">
				{{ loc('IM_CONTENT_SETTINGS_SECTION_LIST_TITLE') }}
			</div>
			<div
				v-for="section in sections"
				:key="section"
				class="bx-im-settings-section-list__item"
				:class="{'--active': section === activeSection}"
				@click="$emit('sectionClick', section)"
			>
				<div class="bx-im-settings-section-list__item_icon">
					<i :class="getSectionIconClass(section)"></i>
				</div>
				<div class="bx-im-settings-section-list__item_title">{{ getSectionName(section) }}</div>
			</div>
			<!-- Help -->
			<div
				class="bx-im-settings-section-list__item"
				@click="onHelpClick"
			>
				<div class="bx-im-settings-section-list__item_icon">
					<i :class="getSectionIconClass(AdditionalSections.help)"></i>
				</div>
				<div class="bx-im-settings-section-list__item_title">{{ getSectionName(AdditionalSections.help) }}</div>
			</div>
			<!-- Feedback -->
			<div
				class="bx-im-settings-section-list__item"
				@click="onFeedbackClick"
			>
				<div class="bx-im-settings-section-list__item_icon">
					<i :class="getSectionIconClass(AdditionalSections.feedback)"></i>
				</div>
				<div class="bx-im-settings-section-list__item_title">{{ getSectionName(AdditionalSections.feedback) }}</div>
			</div>
		</div>
	`
	};

	// @vue/component
	const ChatBackground = {
		name: 'ChatBackground',
		emits: ['close'],
		computed: {
			currentBackgroundId() {
				return this.$store.getters['application/settings/get'](im_v2_const.Settings.appearance.background).toString();
			},
			backgroundIdList() {
				return Object.keys(im_v2_lib_theme.SelectableBackground);
			}
		},
		methods: {
			getBackgroundStyleById(backgroundId) {
				return im_v2_lib_theme.ThemeManager.getBackgroundStyleById(backgroundId);
			},
			onBackgroundClick(backgroundId) {
				const settingsService = new im_v2_provider_service_settings.SettingsService();
				settingsService.changeSetting(im_v2_const.Settings.appearance.background, backgroundId);
			}
		},
		template: `
		<div class="bx-im-settings-background__container">
			<div class="bx-im-settings-background__list">
				<div
					v-for="id in backgroundIdList"
					:key="id"
					:style="getBackgroundStyleById(id)"
					class="bx-im-background-select-popup__item bx-im-settings-background__item"
					:class="{'--active': id === currentBackgroundId}"
					@click="onBackgroundClick(id)"
				></div>
			</div>
		</div>
	`
	};

	// @vue/component
	const ChatAlignment = {
		name: 'ChatAlignment',
		emits: ['close'],
		computed: {
			DialogAlignment: () => im_v2_const.DialogAlignment,
			currentOptionId() {
				return this.$store.getters['application/settings/get'](im_v2_const.Settings.appearance.alignment);
			},
			backgroundStyle() {
				return im_v2_lib_theme.ThemeManager.getCurrentBackgroundStyle();
			}
		},
		methods: {
			onOptionClick(optionId) {
				this.getSettingsService().changeSetting(im_v2_const.Settings.appearance.alignment, optionId);
			},
			getSettingsService() {
				if (!this.settingsService) {
					this.settingsService = new im_v2_provider_service_settings.SettingsService();
				}
				return this.settingsService;
			}
		},
		template: `
		<div class="bx-im-settings-alignment__container">
			<div class="bx-im-settings-alignment__list">
				<div
					class="bx-im-settings-alignment__item --left"
					:class="{'--active': currentOptionId === DialogAlignment.left}"
					:style="backgroundStyle"
					@click="onOptionClick(DialogAlignment.left)"
				>
					<div class="bx-im-settings-alignment__item_content"></div>
					<div v-if="currentOptionId === DialogAlignment.left" class="bx-im-settings-alignment__item_checkmark"></div>
				</div>
				<div
					class="bx-im-settings-alignment__item --center"
					:class="{'--active': currentOptionId === DialogAlignment.center}"
					:style="backgroundStyle"
					@click="onOptionClick(DialogAlignment.center)"
				>
					<div class="bx-im-settings-alignment__item_content"></div>
					<div v-if="currentOptionId === DialogAlignment.center" class="bx-im-settings-alignment__item_checkmark"></div>
				</div>
			</div>
		</div>
	`
	};

	const SHOW_DELAY = 200;
	const HIDE_DELAY = 200;

	// @vue/component
	const ChatQuickReaction = {
		name: 'ChatQuickReaction',
		components: {
			Reaction: ui_reaction_item_vue.Reaction,
			ChatDialog: im_v2_component_dialog_chat.ChatDialog,
			BIcon: ui_iconSet_api_vue.BIcon
		},
		props: {
			dialogId: {
				type: String,
				required: true
			}
		},
		computed: {
			chevronDown() {
				return ui_iconSet_api_vue.Outline.CHEVRON_DOWN_M;
			},
			alignment() {
				return this.$store.getters['application/settings/get'](im_v2_const.Settings.appearance.alignment);
			},
			alignmentClasses() {
				return {
					'--left-align': this.alignment === im_v2_const.DialogAlignment.left,
					'--center-align': this.alignment === im_v2_const.DialogAlignment.center
				};
			},
			backgroundStyle() {
				return im_v2_lib_theme.ThemeManager.getCurrentBackgroundStyle();
			},
			currentReactionTitle() {
				return ui_reaction_item.ReactionTitle[this.currentReaction] ?? '';
			},
			currentReaction() {
				const mainReaction = this.$store.getters['application/settings/get'](im_v2_const.Settings.message.defaultReaction);
				if (main_core.Type.isStringFilled(mainReaction)) {
					return mainReaction;
				}
				return ui_reaction_item.ReactionName.like;
			}
		},
		beforeUnmount() {
			clearTimeout(this.showTimeout);
			this.clearHideTimer();
			this.reactionPicker?.hide();
		},
		created() {
			im_v2_component_message_elements.MessageDefaultReactionManager.getInstance().init();
			this.reactionPicker = null;
			this.showTimeout = null;
			this.hideTimeout = null;
		},
		methods: {
			loc(phraseCode) {
				return this.$Bitrix.Loc.getMessage(phraseCode);
			},
			startShowTimer() {
				this.clearHideTimer();
				if (this.reactionPicker?.isShown()) {
					return;
				}
				this.showTimeout = setTimeout(() => {
					this.openReactionPicker();
				}, SHOW_DELAY);
			},
			clearShowTimer() {
				clearTimeout(this.showTimeout);
				this.startHideTimer();
			},
			openReactionPicker() {
				clearTimeout(this.showTimeout);
				this.clearHideTimer();
				if (this.reactionPicker?.isShown()) {
					return;
				}
				this.reactionPicker = new ui_reaction_picker.ReactionPicker({
					target: this.$refs.reactionPickerButton
				});
				this.subscribeToReactionPickerEvents();
				this.reactionPicker.show();
			},
			subscribeToReactionPickerEvents() {
				this.reactionPicker.subscribe('select', async selectEvent => {
					const {
						reaction
					} = selectEvent.getData();
					try {
						await im_v2_component_message_elements.MessageDefaultReactionManager.getInstance().changeDefaultReaction(reaction);
					} catch {
						return;
					}
					this.reactionPicker?.hide();
				});
				this.reactionPicker.subscribe('mouseleave', this.startHideTimer);
				this.reactionPicker.subscribe('mouseenter', () => {
					this.clearHideTimer();
				});
				this.reactionPicker.subscribe('hide', () => {
					this.clearHideTimer();
					this.reactionPicker = null;
				});
			},
			startHideTimer() {
				this.hideTimeout = setTimeout(() => {
					this.reactionPicker?.hide();
				}, HIDE_DELAY);
			},
			clearHideTimer() {
				clearTimeout(this.hideTimeout);
			}
		},
		template: `
		<div class="bx-im-settings-section-content__block-reaction">
			<div class="bx-im-settings-alignment-quick-reaction__preview">
				<div
					class="bx-im-content-chat__container bx-im-settings-quick-reaction__demo-chat_container"
					:class="alignmentClasses"
					:style="backgroundStyle"
				>
					<ChatDialog :dialogId="dialogId"/>
				</div>
				<div 
					class="bx-im-settings-quick-reaction__alignment"
					:class="alignmentClasses"
				>
					<div class="bx-im-settings-quick-reaction__selector-container">
						<div class="bx-im-settings-quick-reaction__selector">
							<Reaction
								:key="currentReaction"
								:name="currentReaction"
								class="bx-im-settings-quick-reaction__selector-icon"
							/>
						</div>
					</div>
				</div>
			</div>
			<div class="bx-im-settings-section-content__block_subtitle">
				{{ loc('IM_CONTENT_SETTINGS_OPTION_DESCRIPTION_QUICKREACTREACTION')}}
			</div>
			<div class="bx-im-settings-section-content__choice">
				<button 
					class="bx-im-settings-section-content__choice_button"
					type="button"
					ref="reactionPickerButton"
					@click="openReactionPicker"
					@mouseenter="startShowTimer"
					@mouseleave="clearShowTimer"
				>
					<Reaction
						:key="currentReaction"
						:name="currentReaction"
						class="bx-im-settings-section-content__choice_button-icon"
					/>
					<span class="bx-im-settings-section-content__choice_button-title">
						{{ currentReactionTitle }}
					</span>
					<BIcon :name="chevronDown" />
				</button>
			</div>
		</div>
	`
	};

	const initAppearanceDemoData = () => {
		const chatBuilder = new im_v2_lib_demo.DemoChatBuilder();
		chatBuilder.addChat({
			role: im_v2_const.UserRole.guest
		});
		const demoUser = chatBuilder.addUser({
			name: main_core.Loc.getMessage('IM_CONTENT_SETTINGS_DEMO_CHAT_USER_NAME')
		});
		const firstMessage = chatBuilder.addMessage({
			authorId: demoUser.id,
			text: main_core.Loc.getMessage('IM_CONTENT_SETTINGS_DEMO_CHAT_MESSAGE_1'),
			viewedByOthers: true
		});
		chatBuilder.addMessage({
			authorId: im_v2_application_core.Core.getUserId(),
			replyId: firstMessage.id,
			text: main_core.Loc.getMessage('IM_CONTENT_SETTINGS_DEMO_CHAT_MESSAGE_2'),
			viewedByOthers: true
		});
		chatBuilder.addMessage({
			authorId: demoUser.id,
			text: main_core.Loc.getMessage('IM_CONTENT_SETTINGS_DEMO_CHAT_MESSAGE_3'),
			viewedByOthers: true
		});
		chatBuilder.save();
		return chatBuilder.getChat().dialogId;
	};
	const initQuickReactionDemoData = () => {
		const chatBuilder = new im_v2_lib_demo.DemoChatBuilder();
		chatBuilder.addChat({
			role: im_v2_const.UserRole.guest
		});
		chatBuilder.addMessage({
			authorId: im_v2_application_core.Core.getUserId(),
			text: main_core.Loc.getMessage('IM_CONTENT_SETTINGS_DEMO_CHAT_MESSAGE_2'),
			viewedByOthers: true
		});
		chatBuilder.save();
		return chatBuilder.getChat().dialogId;
	};

	// @vue/component
	const AppearanceSection = {
		name: 'AppearanceSection',
		components: {
			ChatDialog: im_v2_component_dialog_chat.ChatDialog,
			ChatBackground,
			ChatAlignment,
			ChatQuickReaction
		},
		data() {
			return {
				fakeDialogId: '',
				quickReactionDialogId: ''
			};
		},
		computed: {
			containerClasses() {
				const alignment = this.$store.getters['application/settings/get'](im_v2_const.Settings.appearance.alignment);
				return [`--${alignment}-align`];
			},
			backgroundStyle() {
				return im_v2_lib_theme.ThemeManager.getCurrentBackgroundStyle();
			}
		},
		created() {
			this.fakeDialogId = initAppearanceDemoData();
			this.quickReactionDialogId = initQuickReactionDemoData();
		},
		methods: {
			loc(phraseCode) {
				return this.$Bitrix.Loc.getMessage(phraseCode);
			}
		},
		template: `
		<div class="bx-im-settings-section-content__body">
			<div class="bx-im-settings-section-content__block">
				<div class="bx-im-content-chat__container bx-im-settings-appearance__demo-chat_container" :class="containerClasses" :style="backgroundStyle">
					<ChatDialog :dialogId="fakeDialogId" />
				</div>
			</div>
			<div class="bx-im-settings-section-content__block">
				<div class="bx-im-settings-section-content__block_title">
					{{ loc('IM_CONTENT_SETTINGS_OPTION_APPEARANCE_BACKGROUND') }}
				</div>
				<ChatBackground />
			</div>
			<div class="bx-im-settings-section-content__separator"></div>
			<div class="bx-im-settings-section-content__block">
				<div class="bx-im-settings-section-content__block_title">
					{{ loc('IM_CONTENT_SETTINGS_OPTION_APPEARANCE_QUICKREACTREACTION') }}
				</div>
				<ChatQuickReaction
					:dialogId="quickReactionDialogId"
				/>
			</div>
			<div class="bx-im-settings-section-content__separator"></div>
			<div class="bx-im-settings-section-content__block">
				<div class="bx-im-settings-section-content__block_title">
					{{ loc('IM_CONTENT_SETTINGS_OPTION_APPEARANCE_ALIGNMENT') }}
				</div>
				<ChatAlignment />
			</div>
		</div>
	`
	};

	// @vue/component
	const CheckboxOption = {
		name: 'CheckboxOption',
		components: {
			ChatHint: im_v2_component_elements_hint.ChatHint
		},
		props: {
			value: {
				type: Boolean,
				required: true
			},
			text: {
				type: String,
				required: false,
				default: ''
			},
			disabled: {
				type: Boolean,
				required: false,
				default: false
			},
			hintText: {
				type: String,
				required: false,
				default: ''
			}
		},
		emits: ['change'],
		computed: {
			hasHint() {
				return this.hintText.length > 0;
			}
		},
		methods: {
			onInput(event) {
				this.$emit('change', event.target.checked);
			}
		},
		template: `
		<div class="bx-im-settings-checkbox__container bx-im-settings-section-content__block_option" :class="{ '--no-text': text === '' }">
			<label class="ui-ctl ui-ctl-checkbox">
				<input type="checkbox" :checked="value" :disabled="disabled" @input="onInput" class="ui-ctl-element">
				<span v-if="text" class="ui-ctl-label-text">{{ text }}</span>
				<ChatHint v-if="hasHint" :text="hintText" />
			</label>
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
		<div class="bx-im-settings-radio__container bx-im-settings-section-content__block_option">
			<label v-for="option in options" class="ui-ctl ui-ctl-radio">
				<input type="radio" class="ui-ctl-element" :name="groupName" :checked="option.selected" @input="onInput(option)">
				<div class="bx-im-settings-radio__label ui-ctl-label-text">
					<!-- Text -->
					<div v-if="option.html" class="bx-im-settings-radio__label_title" v-html="option.text"></div>
					<div v-else class="bx-im-settings-radio__label_title">{{ option.text }}</div>
					<!-- Subtext -->
					<template v-if="option.subtext">
						<div v-if="option.html" class="bx-im-settings-radio__label_subtitle" v-html="option.subtext"></div>
						<div v-else class="bx-im-settings-radio__label_subtitle">{{ option.subtext }}</div>
					</template>
				</div>
			</label>
		</div>
	`
	};

	// @vue/component
	const SimpleNotificationList = {
		name: 'SimpleNotificationList',
		components: {
			CheckboxOption
		},
		computed: {
			currentUser() {
				return im_v2_application_core.Core.getStore().getters['users/get'](im_v2_application_core.Core.getUserId());
			},
			enableWeb() {
				return this.$store.getters['application/settings/get'](im_v2_const.Settings.notification.enableWeb);
			},
			enableMail() {
				return this.$store.getters['application/settings/get'](im_v2_const.Settings.notification.enableMail);
			},
			enablePush() {
				return this.$store.getters['application/settings/get'](im_v2_const.Settings.notification.enablePush);
			},
			enableMailText() {
				return this.loc('IM_CONTENT_SETTINGS_OPTION_NOTIFICATION_ENABLE_MAIL', {
					'#MAIL#': this.userEmail
				});
			},
			userEmail() {
				return this.currentUser.email;
			}
		},
		methods: {
			onEnableWebChange(newValue) {
				this.getSettingsService().changeSetting(im_v2_const.Settings.notification.enableWeb, newValue);
			},
			onEnableMailChange(newValue) {
				this.getSettingsService().changeSetting(im_v2_const.Settings.notification.enableMail, newValue);
			},
			onEnablePushChange(newValue) {
				this.getSettingsService().changeSetting(im_v2_const.Settings.notification.enablePush, newValue);
			},
			getSettingsService() {
				if (!this.settingsService) {
					this.settingsService = new im_v2_provider_service_settings.SettingsService();
				}
				return this.settingsService;
			},
			loc(phraseCode, replacements = {}) {
				return this.$Bitrix.Loc.getMessage(phraseCode, replacements);
			}
		},
		template: `
		<div class="bx-im-settings-section-content__body">
			<div class="bx-im-settings-section-content__block">
				<div class="bx-im-settings-section-content__block_title">
					{{ loc('IM_CONTENT_SETTINGS_OPTION_NOTIFICATION_BLOCK_SIMPLE_MODE_TITLE_MSGVER_1') }}
				</div>
				<CheckboxOption
					:value="enableWeb"
					:text="loc('IM_CONTENT_SETTINGS_OPTION_NOTIFICATION_ENABLE_WEB_MSGVER_1')"
					@change="onEnableWebChange"
				/>
				<CheckboxOption
					:value="enableMail"
					:text="enableMailText"
					@change="onEnableMailChange"
				/>
				<CheckboxOption
					:value="enablePush"
					:text="loc('IM_CONTENT_SETTINGS_OPTION_NOTIFICATION_ENABLE_MSGVER_1')"
					@change="onEnablePushChange"
				/>
			</div>
		</div>
	`
	};

	// @vue/component
	const NotificationItem = {
		name: 'NotificationItem',
		components: {
			CheckboxOption
		},
		props: {
			item: {
				type: Object,
				required: true
			},
			blockId: {
				type: String,
				required: true
			}
		},
		data() {
			return {};
		},
		computed: {
			NotificationSettingsType: () => im_v2_const.NotificationSettingsType,
			notification() {
				return this.item;
			},
			disabledForWeb() {
				return this.notification.disabled.includes(im_v2_const.NotificationSettingsType.web);
			},
			disabledForMail() {
				return this.notification.disabled.includes(im_v2_const.NotificationSettingsType.mail);
			},
			disabledForPush() {
				return this.notification.disabled.includes(im_v2_const.NotificationSettingsType.push);
			}
		},
		methods: {
			onItemChange(newValue, type) {
				this.getSettingsService().changeExpertOption({
					moduleId: this.blockId,
					optionName: this.notification.id,
					type,
					value: newValue
				});
			},
			getSettingsService() {
				if (!this.settingsService) {
					this.settingsService = new im_v2_provider_service_settings.SettingsService();
				}
				return this.settingsService;
			}
		},
		template: `
		<div class="bx-im-settings-expert-notifications-item__container">
			<div class="bx-im-settings-expert-notifications-item__title">
				{{ notification.label }}
			</div>
			<div class="bx-im-settings-expert-notifications-item__type --web">
				<CheckboxOption :value="notification.site" :disabled="disabledForWeb" @change="onItemChange($event, NotificationSettingsType.web)" />
			</div>
			<div class="bx-im-settings-expert-notifications-item__type --mail">
				<CheckboxOption :value="notification.mail" :disabled="disabledForMail" @change="onItemChange($event, NotificationSettingsType.mail)" />
			</div>
			<div class="bx-im-settings-expert-notifications-item__type --push">
				<CheckboxOption :value="notification.push" :disabled="disabledForPush" @change="onItemChange($event, NotificationSettingsType.push)" />
			</div>
		</div>
	`
	};

	// @vue/component
	const NotificationBlock = {
		name: 'NotificationBlock',
		components: {
			NotificationItem
		},
		props: {
			item: {
				type: Object,
				required: true
			}
		},
		data() {
			return {};
		},
		computed: {
			block() {
				return this.item;
			}
		},
		methods: {
			loc(phraseCode) {
				return this.$Bitrix.Loc.getMessage(phraseCode);
			}
		},
		template: `
		<div class="bx-im-settings-section-content__body">
			<div class="bx-im-settings-section-content__block">
				<div class="bx-im-settings-section-content__block_title">
					{{ block.label }}
				</div>
				<div class="bx-im-settings-expert-notifications__header">
					<div class="bx-im-settings-expert-notifications__header_title"></div>
					<div class="bx-im-settings-expert-notifications__header_type">
						{{ loc('IM_CONTENT_SETTINGS_EXPERT_NOTIFICATIONS_TYPE_WEB_MSGVER_1') }}
					</div>
					<div class="bx-im-settings-expert-notifications__header_type">
						{{ loc('IM_CONTENT_SETTINGS_EXPERT_NOTIFICATIONS_TYPE_MAIL') }}
					</div>
					<div class="bx-im-settings-expert-notifications__header_type">
						{{ loc('IM_CONTENT_SETTINGS_EXPERT_NOTIFICATIONS_TYPE_PUSH_MSGVER_1') }}
					</div>
				</div>
				<NotificationItem v-for="item in block.items" :item="item" :blockId="block.id" :key="item.id" />
			</div>
		</div>
	`
	};

	// @vue/component
	const ExpertNotificationList = {
		name: 'ExpertNotificationList',
		components: {
			NotificationBlock
		},
		data() {
			return {};
		},
		computed: {
			notificationSettings() {
				const settings = this.$store.getters['application/settings/get']('notifications');
				return Object.values(settings);
			}
		},
		template: `
		<NotificationBlock
			v-for="block in notificationSettings"
			:item="block"
			:key="block.id"
			class="bx-im-settings-expert-notifications__container"
		/>
	`
	};

	// @vue/component
	const NotificationSection = {
		name: 'NotificationSection',
		components: {
			CheckboxOption,
			RadioOption,
			SimpleNotificationList,
			ExpertNotificationList
		},
		computed: {
			enableSound() {
				return this.$store.getters['application/settings/get'](im_v2_const.Settings.notification.enableSound);
			},
			enableAutoRead() {
				return this.$store.getters['application/settings/get'](im_v2_const.Settings.notification.enableAutoRead);
			},
			isDndEnabled() {
				return this.$store.getters['application/settings/get'](im_v2_const.Settings.user.status) === im_v2_const.UserStatus.dnd;
			},
			notificationMode() {
				return this.$store.getters['application/settings/get'](im_v2_const.Settings.notification.mode);
			},
			notificationModeOptions() {
				return [{
					value: im_v2_const.NotificationSettingsMode.simple,
					text: this.loc('IM_CONTENT_SETTINGS_OPTION_NOTIFICATION_SIMPLE_MODE'),
					selected: this.notificationMode === im_v2_const.NotificationSettingsMode.simple
				}, {
					value: im_v2_const.NotificationSettingsMode.expert,
					text: this.loc('IM_CONTENT_SETTINGS_OPTION_NOTIFICATION_EXPERT_MODE'),
					selected: this.notificationMode === im_v2_const.NotificationSettingsMode.expert
				}];
			},
			notificationListComponent() {
				return this.notificationMode === 'simple' ? SimpleNotificationList : ExpertNotificationList;
			}
		},
		methods: {
			onEnableSoundChange(newValue) {
				this.getSettingsService().changeSetting(im_v2_const.Settings.notification.enableSound, newValue);
			},
			onEnableAutoReadChange(newValue) {
				this.getSettingsService().changeSetting(im_v2_const.Settings.notification.enableAutoRead, newValue);
			},
			onEnableDnDChange(newValue) {
				const preparedValue = newValue ? im_v2_const.UserStatus.dnd : im_v2_const.UserStatus.online;
				this.getSettingsService().changeStatus(preparedValue);
			},
			async onNotificationModeChange(newValue) {
				const isChangingToSimple = newValue === im_v2_const.NotificationSettingsMode.simple;
				if (isChangingToSimple) {
					this.changeLocalNotificationMode(im_v2_const.NotificationSettingsMode.simple);
					const confirmResult = await im_v2_lib_confirm.showNotificationsModeSwitchConfirm();
					if (!confirmResult) {
						this.changeLocalNotificationMode(im_v2_const.NotificationSettingsMode.expert);
						return;
					}
				}
				void this.getSettingsService().switchScheme(newValue);
			},
			async changeLocalNotificationMode(newValue) {
				this.$store.dispatch('application/settings/set', {
					[im_v2_const.Settings.notification.mode]: newValue
				});
			},
			getSettingsService() {
				if (!this.settingsService) {
					this.settingsService = new im_v2_provider_service_settings.SettingsService();
				}
				return this.settingsService;
			},
			loc(phraseCode) {
				return this.$Bitrix.Loc.getMessage(phraseCode);
			}
		},
		template: `
		<div class="bx-im-settings-section-content__body">
			<div class="bx-im-settings-section-content__block">
				<div class="bx-im-settings-section-content__block_title">
					{{ loc('IM_CONTENT_SETTINGS_OPTION_NOTIFICATION_BLOCK_FOCUS_MSGVER_1') }}
				</div>
				<CheckboxOption
					:value="enableSound"
					:text="loc('IM_CONTENT_SETTINGS_OPTION_NOTIFICATION_ENABLE_SOUND_MSGVER_1')"
					@change="onEnableSoundChange"
				/>
				<CheckboxOption
					:value="enableAutoRead"
					:text="loc('IM_CONTENT_SETTINGS_OPTION_NOTIFICATION_AUTO_READ_MSGVER_1')"
					@change="onEnableAutoReadChange"
				/>
				<CheckboxOption
					:value="isDndEnabled"
					:text="loc('IM_CONTENT_SETTINGS_OPTION_NOTIFICATION_DND')"
					:hintText="loc('IM_CONTENT_SETTINGS_OPTION_NOTIFICATION_DND_HINT')"
					@change="onEnableDnDChange"
				/>
			</div>
		</div>
		<div class="bx-im-settings-section-content__body">
			<div class="bx-im-settings-section-content__block">
				<div class="bx-im-settings-section-content__block_title">
					{{ loc('IM_CONTENT_SETTINGS_OPTION_NOTIFICATION_BLOCK_MODE_MSGVER_1') }}
				</div>
				<RadioOption :items="notificationModeOptions" @change="onNotificationModeChange" />
			</div>
		</div>
		<component :is="notificationListComponent" />
	`
	};

	// @vue/component
	const ReferenceHeader = {
		name: 'ReferenceHeader',
		props: {
			columns: {
				type: Array,
				required: true
			}
		},
		template: `
		<div class="bx-im-settings-hotkey-reference__row" role="row">
			<span
				v-for="column in columns"
				:key="column"
				class="bx-im-settings-hotkey-reference__header"
				role="columnheader"
			>{{ column }}</span>
		</div>
	`
	};

	// @vue/component
	const ReferenceRow = {
		name: 'ReferenceRow',
		props: {
			action: {
				type: String,
				required: true
			},
			cells: {
				type: Array,
				required: true
			}
		},
		template: `
		<div class="bx-im-settings-hotkey-reference__row" role="row">
			<span class="bx-im-settings-hotkey-reference__action" role="rowheader">{{ action }}</span>
			<span
				v-for="(cell, index) in cells"
				:key="index"
				class="bx-im-settings-hotkey-reference__cell"
				role="cell"
			>{{ cell }}</span>
		</div>
	`
	};

	// @vue/component
	const ReferenceBlock = {
		name: 'ReferenceBlock',
		components: {
			ReferenceHeader,
			ReferenceRow
		},
		props: {
			block: {
				type: Object,
				required: true
			}
		},
		computed: {
			titleId() {
				return `bx-im-settings-hotkey-reference-title-${this.block.id}`;
			}
		},
		template: `
		<div class="bx-im-settings-section-content__body">
			<div class="bx-im-settings-section-content__block">
				<div :id="titleId" class="bx-im-settings-section-content__block_title">{{ block.title }}</div>
				<div class="bx-im-settings-hotkey-reference__scroll">
					<div
						class="bx-im-settings-hotkey-reference"
						:class="{ '--two-columns': block.columns.length === 2 }"
						role="table"
						:aria-labelledby="titleId"
					>
						<ReferenceHeader :columns="block.columns" />
						<ReferenceRow
							v-for="row in block.rows"
							:key="row.action"
							:action="row.action"
							:cells="row.cells"
						/>
					</div>
				</div>
			</div>
		</div>
	`
	};

	const BlockId = {
		send: 'send',
		chats: 'chats',
		text: 'text',
		formatting: 'formatting'
	};
	const Phrase = {
		columnAction: main_core.Loc.getMessage('IM_CONTENT_SETTINGS_HOTKEY_COLUMN_ACTION'),
		columnWindows: main_core.Loc.getMessage('IM_CONTENT_SETTINGS_HOTKEY_COLUMN_WINDOWS'),
		columnMacos: main_core.Loc.getMessage('IM_CONTENT_SETTINGS_HOTKEY_COLUMN_MACOS'),
		columnSyntax: main_core.Loc.getMessage('IM_CONTENT_SETTINGS_HOTKEY_COLUMN_SYNTAX'),
		blockSend: main_core.Loc.getMessage('IM_CONTENT_SETTINGS_HOTKEY_BLOCK_SEND'),
		blockChats: main_core.Loc.getMessage('IM_CONTENT_SETTINGS_HOTKEY_BLOCK_CHATS'),
		blockText: main_core.Loc.getMessage('IM_CONTENT_SETTINGS_HOTKEY_BLOCK_TEXT'),
		blockFormatting: main_core.Loc.getMessage('IM_CONTENT_SETTINGS_HOTKEY_BLOCK_FORMATTING'),
		sendMessage: main_core.Loc.getMessage('IM_CONTENT_SETTINGS_HOTKEY_ACTION_SEND_MESSAGE'),
		newLine: main_core.Loc.getMessage('IM_CONTENT_SETTINGS_HOTKEY_ACTION_NEW_LINE'),
		editLast: main_core.Loc.getMessage('IM_CONTENT_SETTINGS_HOTKEY_ACTION_EDIT_LAST'),
		insertName: main_core.Loc.getMessage('IM_CONTENT_SETTINGS_HOTKEY_ACTION_INSERT_NAME'),
		selectAll: main_core.Loc.getMessage('IM_CONTENT_SETTINGS_HOTKEY_ACTION_SELECT_ALL'),
		bold: main_core.Loc.getMessage('IM_CONTENT_SETTINGS_HOTKEY_ACTION_BOLD'),
		italic: main_core.Loc.getMessage('IM_CONTENT_SETTINGS_HOTKEY_ACTION_ITALIC'),
		underline: main_core.Loc.getMessage('IM_CONTENT_SETTINGS_HOTKEY_ACTION_UNDERLINE'),
		strikethrough: main_core.Loc.getMessage('IM_CONTENT_SETTINGS_HOTKEY_ACTION_STRIKETHROUGH'),
		quote: main_core.Loc.getMessage('IM_CONTENT_SETTINGS_HOTKEY_ACTION_QUOTE'),
		link: main_core.Loc.getMessage('IM_CONTENT_SETTINGS_HOTKEY_ACTION_LINK'),
		color: main_core.Loc.getMessage('IM_CONTENT_SETTINGS_HOTKEY_ACTION_COLOR'),
		size: main_core.Loc.getMessage('IM_CONTENT_SETTINGS_HOTKEY_ACTION_SIZE'),
		syntaxQuote: main_core.Loc.getMessage('IM_CONTENT_SETTINGS_HOTKEY_SYNTAX_QUOTE'),
		syntaxBold: main_core.Loc.getMessage('IM_CONTENT_SETTINGS_HOTKEY_SYNTAX_BOLD'),
		syntaxItalic: main_core.Loc.getMessage('IM_CONTENT_SETTINGS_HOTKEY_SYNTAX_ITALIC'),
		syntaxUnderline: main_core.Loc.getMessage('IM_CONTENT_SETTINGS_HOTKEY_SYNTAX_UNDERLINE'),
		syntaxStrikethrough: main_core.Loc.getMessage('IM_CONTENT_SETTINGS_HOTKEY_SYNTAX_STRIKETHROUGH'),
		syntaxLink: main_core.Loc.getMessage('IM_CONTENT_SETTINGS_HOTKEY_SYNTAX_LINK'),
		syntaxColor: main_core.Loc.getMessage('IM_CONTENT_SETTINGS_HOTKEY_SYNTAX_COLOR'),
		syntaxSize: main_core.Loc.getMessage('IM_CONTENT_SETTINGS_HOTKEY_SYNTAX_SIZE'),
		avatarClick: main_core.Loc.getMessage('IM_CONTENT_SETTINGS_HOTKEY_AVATAR_CLICK'),
		or: main_core.Loc.getMessage('IM_CONTENT_SETTINGS_HOTKEY_OR')
	};
	const OutsideRegistry = {
		selectAll: 'Ctrl+A',
		insertNameModifier: 'Alt'
	};
	const OsColumns = [Phrase.columnAction, Phrase.columnWindows, Phrase.columnMacos];
	const OsList = [im_v2_lib_utils.HotkeyOs.windows, im_v2_lib_utils.HotkeyOs.macos];
	const SyntaxColumns = [Phrase.columnAction, Phrase.columnSyntax];
	const getHotkeyReference = sendByEnter => {
		const {
			sendMessage,
			newLine,
			editMessage,
			textDecoration
		} = im_v2_const.HotkeyCombination;
		return [{
			id: BlockId.send,
			title: Phrase.blockSend,
			columns: OsColumns,
			rows: sendByEnter ? [osRow(Phrase.sendMessage, sendMessage.byEnter), osRow(Phrase.newLine, newLine.byShiftEnter, newLine.byCtrlEnter)] : [osRow(Phrase.sendMessage, sendMessage.byCtrlEnter), osRow(Phrase.newLine, newLine.byShiftEnter, newLine.byEnter)]
		}, {
			id: BlockId.chats,
			title: Phrase.blockChats,
			columns: OsColumns,
			rows: [osRow(Phrase.editLast, editMessage.lastOwn), pointerRow(Phrase.insertName, OutsideRegistry.insertNameModifier, Phrase.avatarClick)]
		}, {
			id: BlockId.text,
			title: Phrase.blockText,
			columns: OsColumns,
			rows: [osRow(Phrase.selectAll, OutsideRegistry.selectAll), osRow(Phrase.bold, textDecoration.bold), osRow(Phrase.italic, textDecoration.italic), osRow(Phrase.underline, textDecoration.underline), osRow(Phrase.strikethrough, textDecoration.strikethrough)]
		}, {
			id: BlockId.formatting,
			title: Phrase.blockFormatting,
			columns: SyntaxColumns,
			rows: [syntaxRow(Phrase.quote, Phrase.syntaxQuote), syntaxRow(Phrase.bold, Phrase.syntaxBold), syntaxRow(Phrase.italic, Phrase.syntaxItalic), syntaxRow(Phrase.underline, Phrase.syntaxUnderline), syntaxRow(Phrase.strikethrough, Phrase.syntaxStrikethrough), syntaxRow(Phrase.link, Phrase.syntaxLink), syntaxRow(Phrase.color, Phrase.syntaxColor), syntaxRow(Phrase.size, Phrase.syntaxSize)]
		}];
	};
	const osRow = (action, ...combinations) => {
		return {
			action,
			combinations,
			cells: OsList.map(os => combinationsText(os, combinations))
		};
	};
	const syntaxRow = (action, syntax) => {
		return {
			action,
			combinations: [],
			cells: [syntax]
		};
	};
	const pointerRow = (action, modifier, pointerAction) => {
		return {
			action,
			combinations: [],
			cells: OsList.map(os => `${im_v2_lib_utils.Utils.key.getCombinationText(modifier, os)} + ${pointerAction}`)
		};
	};
	const combinationsText = (os, combinations) => {
		return combinations.map(combination => im_v2_lib_utils.Utils.key.getCombinationText(combination, os)).join(` ${Phrase.or} `);
	};

	// @vue/component
	const HotkeySection = {
		name: 'HotkeySection',
		components: {
			RadioOption,
			ReferenceBlock
		},
		computed: {
			sendByEnter() {
				return this.$store.getters['application/settings/get'](im_v2_const.Settings.hotkey.sendByEnter);
			},
			sendCombinationItems() {
				const {
					sendMessage,
					newLine
				} = im_v2_const.HotkeyCombination;
				return [{
					value: true,
					text: im_v2_lib_utils.Utils.key.getCombinationText(sendMessage.byEnter),
					subtext: this.newLineSubtext(newLine.byShiftEnter),
					selected: this.sendByEnter === true
				}, {
					value: false,
					text: im_v2_lib_utils.Utils.key.getCombinationText(sendMessage.byCtrlEnter),
					subtext: this.newLineSubtext(newLine.byEnter),
					selected: this.sendByEnter === false
				}];
			},
			referenceBlocks() {
				return getHotkeyReference(this.sendByEnter);
			}
		},
		mounted() {
			im_v2_lib_analytics.Analytics.getInstance().settings.onOpenHotkeySection();
		},
		methods: {
			newLineSubtext(combination) {
				return this.loc('IM_CONTENT_SETTINGS_OPTION_HOTKEY_NEW_LINE_MSGVER_1', {
					'#HOTKEY#': im_v2_lib_utils.Utils.key.getCombinationText(combination)
				});
			},
			onSendByEnterChange(newValue) {
				this.getSettingsService().changeSetting(im_v2_const.Settings.hotkey.sendByEnter, newValue);
			},
			getSettingsService() {
				if (!this.settingsService) {
					this.settingsService = new im_v2_provider_service_settings.SettingsService();
				}
				return this.settingsService;
			},
			loc(phraseCode, replacements = {}) {
				return this.$Bitrix.Loc.getMessage(phraseCode, replacements);
			}
		},
		template: `
		<div class="bx-im-settings-section-content__body">
			<div class="bx-im-settings-section-content__block">
				<div class="bx-im-settings-section-content__block_title">
					{{ loc('IM_CONTENT_SETTINGS_OPTION_HOTKEY_SEND_COMBINATION') }}
				</div>
				<RadioOption
					:items="sendCombinationItems"
					@change="onSendByEnterChange"
				/>
			</div>
		</div>
		<ReferenceBlock
			v-for="block in referenceBlocks"
			:key="block.id"
			:block="block"
		/>
	`
	};

	// @vue/component
	const RecentSection = {
		name: 'RecentSection',
		components: {
			CheckboxOption
		},
		computed: {
			showBirthday() {
				return this.$store.getters['application/settings/get'](im_v2_const.Settings.recent.showBirthday);
			},
			showInvited() {
				return this.$store.getters['application/settings/get'](im_v2_const.Settings.recent.showInvited);
			},
			showLastMessage() {
				return this.$store.getters['application/settings/get'](im_v2_const.Settings.recent.showLastMessage);
			}
		},
		methods: {
			onShowBirthdayChange(newValue) {
				this.getSettingsService().changeSetting(im_v2_const.Settings.recent.showBirthday, newValue);
			},
			onShowInvitedChange(newValue) {
				this.getSettingsService().changeSetting(im_v2_const.Settings.recent.showInvited, newValue);
			},
			onShowLastMessageChange(newValue) {
				this.getSettingsService().changeSetting(im_v2_const.Settings.recent.showLastMessage, newValue);
			},
			getSettingsService() {
				if (!this.settingsService) {
					this.settingsService = new im_v2_provider_service_settings.SettingsService();
				}
				return this.settingsService;
			},
			loc(phraseCode) {
				return this.$Bitrix.Loc.getMessage(phraseCode);
			}
		},
		template: `
		<div class="bx-im-settings-section-content__body">
			<div class="bx-im-settings-section-content__block">
				<CheckboxOption
					:value="showBirthday"
					:text="loc('IM_CONTENT_SETTINGS_OPTION_RECENT_SHOW_BIRTHDAY_MSGVER_1')"
					@change="onShowBirthdayChange"
				/>
				<CheckboxOption
					:value="showInvited"
					:text="loc('IM_CONTENT_SETTINGS_OPTION_RECENT_SHOW_INVITED_MSGVER_1')"
					@change="onShowInvitedChange"
				/>
				<CheckboxOption
					:value="showLastMessage"
					:text="loc('IM_CONTENT_SETTINGS_OPTION_RECENT_SHOW_TEXT_MSGVER_1')"
					@change="onShowLastMessageChange"
				/>
			</div>
		</div>
	`
	};

	// @vue/component
	const DesktopSection = {
		name: 'DesktopSection',
		components: {
			CheckboxOption
		},
		computed: {
			twoWindowMode() {
				return im_v2_lib_desktopApi.DesktopApi.isTwoWindowMode();
			},
			autoStartDesktop() {
				return im_v2_lib_desktopApi.DesktopApi.getAutostartStatus();
			},
			openPortalLinkInDesktop() {
				return this.$store.getters['application/settings/get'](im_v2_const.Settings.desktop.enableRedirect);
			},
			openPortalLinkInDesktopPhrase() {
				if (!im_v2_lib_desktopApi.DesktopApi.isFeatureSupported(im_v2_lib_desktopApi.DesktopFeature.openPage.id)) {
					return this.loc('IM_CONTENT_SETTINGS_OPTION_DESKTOP_ALWAYS_OPEN_CHAT');
				}
				return this.loc('IM_CONTENT_SETTINGS_OPTION_DESKTOP_ALWAYS_OPEN_PORTAL_LINK_V2');
			},
			openLinksInSlider() {
				const sliderBindingStatus = im_v2_lib_desktopApi.DesktopApi.getCustomSetting(im_v2_lib_desktopApi.DesktopSettingsKey.sliderBindingsStatus, '1');
				return sliderBindingStatus === '1';
			},
			isRedirectAvailable() {
				return im_v2_lib_feature.FeatureManager.isFeatureAvailable(im_v2_lib_feature.Feature.isDesktopRedirectAvailable);
			}
		},
		methods: {
			async onTwoWindowModeChange(newValue) {
				im_v2_lib_desktopApi.DesktopApi.setTwoWindowMode(newValue);
				if (newValue) {
					im_v2_lib_analytics.Analytics.getInstance().desktopMode.onSettingsTwoWindowEnable();
				} else {
					im_v2_lib_analytics.Analytics.getInstance().desktopMode.onSettingsOneWindowEnable();
				}
				if (!im_v2_lib_desktopApi.DesktopApi.isFeatureSupported(im_v2_lib_desktopApi.DesktopFeature.restart.id)) {
					void im_v2_lib_confirm.showDesktopConfirm();
					return;
				}
				const userChoice = await im_v2_lib_confirm.showDesktopRestartConfirm();
				if (userChoice === true) {
					im_v2_lib_desktopApi.DesktopApi.restart();
				}
			},
			onAutoStartDesktopChange(newValue) {
				im_v2_lib_desktopApi.DesktopApi.setAutostartStatus(newValue);
			},
			onOpenPortalLinkInDesktopChange(newValue) {
				this.getSettingsService().changeSetting(im_v2_const.Settings.desktop.enableRedirect, newValue);
			},
			onOpenLinksInSliderChange(newValue) {
				this.setSliderBindingStatus(newValue);
				im_v2_lib_desktopApi.DesktopApi.setCustomSetting(im_v2_lib_desktopApi.DesktopSettingsKey.sliderBindingsStatus, newValue ? '1' : '0');
			},
			setSliderBindingStatus(flag) {
				if (flag === true) {
					BX.SidePanel.Instance.enableAnchorBinding();
					return;
				}
				BX.SidePanel.Instance.disableAnchorBinding();
			},
			getSettingsService() {
				if (!this.settingsService) {
					this.settingsService = new im_v2_provider_service_settings.SettingsService();
				}
				return this.settingsService;
			},
			loc(phraseCode) {
				return this.$Bitrix.Loc.getMessage(phraseCode);
			}
		},
		template: `
		<div class="bx-im-settings-section-content__body">
			<div class="bx-im-settings-section-content__block">
				<div class="bx-im-settings-section-content__block_title">
					{{ loc('IM_CONTENT_SETTINGS_OPTION_DESKTOP_BLOCK_STARTUP') }}
				</div>
<!--				<CheckboxOption-->
<!--					:value="twoWindowMode"-->
<!--					:text="loc('IM_CONTENT_SETTINGS_OPTION_DESKTOP_TWO_WINDOW_MODE_V2')"-->
<!--					@change="onTwoWindowModeChange"-->
<!--				/>-->
				<CheckboxOption
					:value="autoStartDesktop"
					:text="loc('IM_CONTENT_SETTINGS_OPTION_DESKTOP_AUTO_START')"
					@change="onAutoStartDesktopChange"
				/>
			</div>
			<div class="bx-im-settings-section-content__block">
				<div class="bx-im-settings-section-content__block_title">
					{{ loc('IM_CONTENT_SETTINGS_OPTION_DESKTOP_BLOCK_LINKS') }}
				</div>
				<CheckboxOption
					v-if="isRedirectAvailable"
					:value="openPortalLinkInDesktop"
					:text="openPortalLinkInDesktopPhrase"
					@change="onOpenPortalLinkInDesktopChange"
				/>
				<CheckboxOption
					:value="openLinksInSlider"
					:text="loc('IM_CONTENT_SETTINGS_OPTION_DESKTOP_OPEN_LINKS_IN_SLIDER_V2')"
					@change="onOpenLinksInSliderChange"
				/>
			</div>
		</div>
	`
	};

	// @vue/component
	const SectionContent = {
		name: 'SectionContent',
		components: {
			AppearanceSection,
			NotificationSection,
			HotkeySection,
			RecentSection,
			DesktopSection
		},
		props: {
			activeSection: {
				type: String,
				required: true
			}
		},
		data() {
			return {};
		},
		computed: {
			sectionComponentName() {
				const uppercaseSection = this.activeSection[0].toUpperCase() + this.activeSection.slice(1);
				const COMPONENT_POSTFIX = 'Section';
				return `${uppercaseSection}${COMPONENT_POSTFIX}`;
			},
			sectionName() {
				return SectionMetaData[this.activeSection].name;
			},
			sectionIconClass() {
				return SectionMetaData[this.activeSection].icon;
			}
		},
		methods: {
			loc(phraseCode) {
				return this.$Bitrix.Loc.getMessage(phraseCode);
			}
		},
		template: `
		<div class="bx-im-settings-section-content__container">
			<div class="bx-im-settings-section-content__header">
				<div class="bx-im-settings-section-content__header_icon">
					<i :class="sectionIconClass"></i>
				</div>
				<div class="bx-im-settings-section-content__header_title">{{ sectionName }}</div>
			</div>
			<div class="bx-im-settings-section-content__background">
				<component :is="sectionComponentName" />
			</div>
		</div>
	`
	};

	// @vue/component
	const SettingsContent = {
		name: 'SettingsContent',
		components: {
			SectionList,
			SectionContent
		},
		props: {
			entityId: {
				type: String,
				required: true
			}
		},
		watch: {
			// layout can be reopened without a section - restore it on every empty entityId
			entityId: {
				immediate: true,
				handler() {
					this.setInitialSection();
				}
			}
		},
		created() {
			im_v2_lib_logger.Logger.warn('Content: Settings created');
		},
		methods: {
			setInitialSection() {
				if (!this.entityId) {
					void im_public.Messenger.openSettings({
						onlyPanel: im_v2_const.SettingsSection.appearance
					});
				}
			},
			onSectionClick(sectionId) {
				void im_public.Messenger.openSettings({
					onlyPanel: sectionId
				});
			}
		},
		template: `
		<div v-if="entityId" class="bx-im-content-settings__container">
			<SectionList :activeSection="entityId" @sectionClick="onSectionClick" />
			<SectionContent :activeSection="entityId" />
		</div>
	`
	};

	exports.SettingsContent = SettingsContent;

})(this.BX.Messenger.v2.Component.Content = this.BX.Messenger.v2.Component.Content || {}, BX.Messenger.v2.Lib, BX.Messenger.v2.Const, BX.Messenger.v2.Lib, BX.Messenger.v2.Lib, BX.Messenger.v2.Lib, BX.Messenger.v2.Lib, BX, BX.Messenger.v2.Component.Dialog, BX.Messenger.v2.Lib, BX.Messenger.v2.Service, BX.Messenger.v2.Component.Message, BX.UI.IconSet, BX.UI.Reaction.Item, BX.UI.Reaction.Item.Vue, BX.UI.Reaction.Picker, BX.Messenger.v2.Application, BX.Messenger.v2.Lib, BX.Messenger.v2.Lib, BX, BX.Messenger.v2.Component.Elements, BX.Messenger.v2.Lib, BX.Messenger.v2.Lib, BX.Messenger.v2.Lib);
//# sourceMappingURL=settings-content.bundle.js.map
