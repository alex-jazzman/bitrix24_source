/* eslint-disable */
this.BX = this.BX || {};
this.BX.Messenger = this.BX.Messenger || {};
this.BX.Messenger.v2 = this.BX.Messenger.v2 || {};
this.BX.Messenger.v2.Component = this.BX.Messenger.v2.Component || {};
(function (exports, ui_vue3_components_button, ui_designTokens_air, im_v2_lib_feature, im_v2_component_elements_button, main_core, im_v2_component_elements_avatar, im_v2_provider_service_chat, ui_entitySelector, im_v2_application_core, im_v2_lib_entitySelectorConfig, im_v2_const, ui_system_typography_vue, im_v2_component_elements_hint, ui_system_radiobutton, ui_system_input_vue, ui_vue3_components_switcher, ui_switcher, ui_iconSet_api_vue, ui_system_menu_vue, ui_iconSet_outline, im_v2_lib_autoDelete, im_v2_component_elements_toggle, im_v2_component_elements_autoDelete, im_v2_component_animation, ui_forms, im_v2_component_elements_dropdown, im_v2_lib_access, im_v2_lib_utils) {
	'use strict';

	const PANEL_TEST_ID = 'im-chat-form-button-panel';
	const CREATE_BUTTON_TEST_ID = 'im-chat-form-button-panel-create';
	const CANCEL_BUTTON_TEST_ID = 'im-chat-form-button-panel-cancel';

	// @vue/component
	const ButtonPanel = {
		name: 'ButtonPanel',
		components: {
			ChatButton: im_v2_component_elements_button.ChatButton,
			UiButton: ui_vue3_components_button.Button
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
			createButtonDisabled: {
				type: Boolean,
				default: false
			},
			createButtonColorScheme: {
				type: [Object, null],
				required: false,
				default: null
			},
			// A screen drawn after the switch to the current design system has no legacy look to fall back
			// to: it asks for the buttons of the design system whatever the portal option says.
			forceAirDesign: {
				type: Boolean,
				default: false
			}
		},
		emits: ['create', 'cancel'],
		setup() {
			return {
				PANEL_TEST_ID,
				CREATE_BUTTON_TEST_ID,
				CANCEL_BUTTON_TEST_ID
			};
		},
		computed: {
			ButtonSize: () => im_v2_component_elements_button.ButtonSize,
			ButtonColor: () => im_v2_component_elements_button.ButtonColor,
			UiButtonSize: () => ui_vue3_components_button.ButtonSize,
			AirButtonStyle: () => ui_vue3_components_button.AirButtonStyle,
			isAirDesignEnabled() {
				return this.forceAirDesign || im_v2_lib_feature.FeatureManager.isFeatureAvailable(im_v2_lib_feature.Feature.isAirDesignEnabled);
			},
			cancelButtonTitle() {
				return this.loc('IM_CREATE_CHAT_CANCEL');
			}
		},
		methods: {
			loc(phraseCode) {
				return this.$Bitrix.Loc.getMessage(phraseCode);
			}
		},
		// The container stays the only root node: a consumer testid on the panel replaces the one below.
		// UiButton builds its node with ui.buttons and drops the placeholder it renders first, so the
		// identifier goes through the dataset option instead of a fallthrough attribute.
		// Both buttons keep the default size of the design system, the one the footer of the project
		// wizard stands on: it is the 38px of the layout, while the size above it draws 46px.
		template: `
		<div
			class="bx-im-chat-forms-button-panel__container"
			:class="{ '--air-design': isAirDesignEnabled }"
			:data-testid="PANEL_TEST_ID"
		>
			<template v-if="isAirDesignEnabled">
				<UiButton
					:size="UiButtonSize.LARGE"
					:style="AirButtonStyle.FILLED"
					:text="createButtonTitle"
					:loading="isCreating"
					:disabled="isCreating || createButtonDisabled"
					:dataset="{ testid: CREATE_BUTTON_TEST_ID }"
					class="bx-im-chat-forms-button-panel__create-button"
					@click="$emit('create')"
				/>
				<UiButton
					:size="UiButtonSize.LARGE"
					:style="AirButtonStyle.PLAIN"
					:text="cancelButtonTitle"
					:disabled="isCreating"
					:dataset="{ testid: CANCEL_BUTTON_TEST_ID }"
					@click="$emit('cancel')"
				/>
			</template>
			<template v-else>
				<ChatButton
					:size="ButtonSize.XL"
					:color="ButtonColor.Success"
					:customColorScheme="createButtonColorScheme"
					:text="createButtonTitle"
					:isLoading="isCreating"
					:isDisabled="isCreating || createButtonDisabled"
					:data-testid="CREATE_BUTTON_TEST_ID"
					@click="$emit('create')"
					class="bx-im-chat-forms-button-panel__create-button"
				/>
				<ChatButton
					:size="ButtonSize.XL"
					:color="ButtonColor.Link"
					:text="cancelButtonTitle"
					:isDisabled="isCreating"
					:data-testid="CANCEL_BUTTON_TEST_ID"
					@click="$emit('cancel')"
				/>
			</template>
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
			isAirDesignEnabled() {
				return im_v2_lib_feature.FeatureManager.isFeatureAvailable(im_v2_lib_feature.Feature.isAirDesignEnabled);
			},
			// The focus ring repeats the shape of the avatar, and only the default one is a circle.
			buttonClasses() {
				return [`--${this.type}`];
			},
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
			},
			loc(phraseCode) {
				return this.$Bitrix.Loc.getMessage(phraseCode);
			}
		},
		// The avatar opens a file dialog, so in air design it is a real button: a clickable image
		// alone has no name for a screen reader and cannot be reached from the keyboard.
		template: `
		<button
			v-if="isAirDesignEnabled"
			type="button"
			class="bx-im-chat-forms-chat-avatar__button"
			:class="buttonClasses"
			:aria-label="loc('IM_CREATE_CHAT_AVATAR_SELECT_ARIA')"
			data-testid="im-chat-form-avatar"
			@click="onAvatarChangeClick"
		>
			<EmptyAvatar
				:size="AvatarSize.XXL"
				:url="avatarToShow"
				:title="chatTitle"
				:type="type"
			/>
		</button>
		<EmptyAvatar
			v-else
			:size="AvatarSize.XXL"
			:url="avatarToShow"
			:title="chatTitle"
			:type="type"
			data-testid="im-chat-form-avatar"
			@click="onAvatarChangeClick"
			class="bx-im-chat-forms-chat-avatar__container"
		/>
		<input
			type="file"
			@change="onAvatarSelect"
			accept="image/*"
			class="bx-im-chat-forms-chat-avatar__input"
			data-testid="im-chat-form-avatar-input"
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
			},
			chatType: {
				type: String,
				default: undefined
			},
			// An update form knows the chat and its role in it; a creation form has neither yet.
			dialogId: {
				type: String,
				default: undefined
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
					entities: this.entitiesConfig(),
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
			entitiesConfig() {
				return im_v2_lib_entitySelectorConfig.getEntitiesConfig({
					dialogId: this.dialogId,
					chatType: this.chatType,
					withTeams: this.allowTeamsSelect
				});
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
		<div
			class="bx-im-chat-forms-chat-members__container"
			data-testid="im-chat-form-members"
			ref="members"
		></div>
	`
	};

	const SUBTITLE_START = '#SUBTITLE_START#';
	const SUBTITLE_END = '#SUBTITLE_END#';

	// @vue/component
	const CreateChatHeading = {
		name: 'CreateChatHeading',
		components: {
			ChatHint: im_v2_component_elements_hint.ChatHint,
			HeadlineXs: ui_system_typography_vue.HeadlineXs
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
			isAirDesignEnabled() {
				return im_v2_lib_feature.FeatureManager.isFeatureAvailable(im_v2_lib_feature.Feature.isAirDesignEnabled);
			},
			preparedText() {
				return this.text.replace(SUBTITLE_START, '<span class="bx-im-content-create-chat__subheading">').replace(SUBTITLE_END, '</span>');
			},
			// The air branch renders the parts as separate typography nodes, so the markers are
			// split out instead of being turned into markup.
			textParts() {
				const [heading, subheading = ''] = this.text.split(SUBTITLE_START);
				return {
					heading,
					subheading: subheading.replace(SUBTITLE_END, '')
				};
			}
		},
		template: `
		<div class="bx-im-content-create-chat__heading_container">
			<HeadlineXs v-if="isAirDesignEnabled">
				{{ textParts.heading }}<HeadlineXs
					v-if="textParts.subheading"
					tag="span"
					className="bx-im-chat-forms-heading__subheading"
				>{{ textParts.subheading }}</HeadlineXs>
			</HeadlineXs>
			<div v-else class="bx-im-content-create-chat__heading" v-html="preparedText"></div>
			<ChatHint v-if="hintText" :text="hintText" />
		</div>
	`
	};

	// @vue/component
	const RadioOption = {
		name: 'RadioOption',
		components: {
			RadioButton: ui_system_radiobutton.Vue.RadioButton,
			TextMd: ui_system_typography_vue.TextMd,
			TextXs: ui_system_typography_vue.TextXs
		},
		props: {
			items: {
				type: Array,
				required: true
			},
			name: {
				type: String,
				default: ''
			}
		},
		emits: ['change'],
		setup() {
			return {
				RadioButtonSize: ui_system_radiobutton.RadioButtonSize
			};
		},
		data() {
			return {
				groupName: main_core.Text.getRandom()
			};
		},
		computed: {
			isAirDesignEnabled() {
				return im_v2_lib_feature.FeatureManager.isFeatureAvailable(im_v2_lib_feature.Feature.isAirDesignEnabled);
			},
			options() {
				return this.items.map(item => {
					const controlId = `im-chat-forms-radio-${this.groupName}-${String(item.value)}`;
					return {
						...item,
						controlId,
						subtextId: `${controlId}-subtext`,
						testId: this.name === '' ? null : `field-${this.name}-option-${String(item.value)}`
					};
				});
			}
		},
		methods: {
			onInput(option) {
				this.$emit('change', option.value);
			},
			// The control and the caption are labels, so a click on either of them switches the option
			// on its own; the rest of the row comes here. The chosen option reports nothing, the way
			// a checked radio fires no change of its own.
			onRowClick(option, event) {
				const isLabelClick = event.target instanceof HTMLElement && event.target.closest('label') !== null;
				if (option.selected || isLabelClick) {
					return;
				}
				this.onInput(option);
			}
		},
		// RadioButton has no caption slot and renders a label of its own, so the caption goes
		// next to it and gets tied to the control by for/id.
		template: `
		<div v-if="isAirDesignEnabled" class="bx-im-chat-forms-radio" role="radiogroup">
			<div
				v-for="option in options"
				:key="option.controlId"
				:class="['bx-im-chat-forms-radio__option', { '--selected': option.selected }]"
				:data-testid="option.testId"
				@click="onRowClick(option, $event)"
			>
				<span class="bx-im-chat-forms-radio__control">
					<RadioButton
						:id="option.controlId"
						:group="groupName"
						:size="RadioButtonSize.Sm"
						:modelValue="option.selected"
						:aria-describedby="option.subtext ? option.subtextId : null"
						@update:modelValue="onInput(option)"
					/>
				</span>
				<div class="bx-im-chat-forms-radio__text">
					<TextMd tag="label" :for="option.controlId" className="bx-im-chat-forms-radio__title">
						<span v-if="option.html" v-html="option.text"></span>
						<template v-else>{{ option.text }}</template>
					</TextMd>
					<TextXs
						v-if="option.subtext"
						tag="div"
						:id="option.subtextId"
						className="bx-im-chat-forms-radio__subtitle"
					>
						<span v-if="option.html" v-html="option.subtext"></span>
						<template v-else>{{ option.subtext }}</template>
					</TextXs>
				</div>
			</div>
		</div>
		<div v-else class="bx-im-content-create-chat-radio__container" role="radiogroup">
			<label
				v-for="option in options"
				:key="option.controlId"
				class="bx-im-content-create-chat-radio__item ui-ctl ui-ctl-radio"
				:data-testid="option.testId"
			>
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

	// BInput renders a textarea instead of an input as soon as more than one row is asked for.
	const AIR_ROWS_QUANTITY = 3;

	// @vue/component
	const TextareaInput = {
		name: 'TextareaInput',
		components: {
			BInput: ui_system_input_vue.BInput
		},
		props: {
			value: {
				type: String,
				default: ''
			},
			placeholder: {
				type: String,
				required: true
			},
			ariaLabel: {
				type: String,
				default: ''
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
		setup() {
			return {
				AIR_ROWS_QUANTITY
			};
		},
		computed: {
			isAirDesignEnabled() {
				return im_v2_lib_feature.FeatureManager.isFeatureAvailable(im_v2_lib_feature.Feature.isAirDesignEnabled);
			},
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
		// The design system owns the border and the corner radius of a field, so the border and
		// rounded flags shape the legacy markup only. ariaLabel is declared instead of being left
		// to fall through: an undeclared camelCase attribute reaches the DOM as "arialabel".
		// In air the field keeps the plain design of the design system, the way the selects of the
		// form do, so BInput draws its border itself and names no design of its own here. The class
		// on the same node carries the surface the field stands on.
		template: `
		<BInput
			v-if="isAirDesignEnabled"
			class="bx-im-chat-forms-textarea__field"
			:modelValue="value"
			:placeholder="placeholder"
			:ariaLabel="ariaLabel"
			:rowsQuantity="AIR_ROWS_QUANTITY"
			resize="none"
			data-testid="im-chat-form-textarea"
			@input="onInput"
		/>
		<div
			v-else
			class="bx-im-content-create-chat__textarea_container"
			:class="containerClasses"
			data-testid="im-chat-form-textarea"
		>
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
		components: {
			BInput: ui_system_input_vue.BInput
		},
		props: {
			modelValue: {
				type: String,
				default: ''
			},
			placeholder: {
				type: String,
				required: true
			},
			maxLength: {
				type: [Number, null],
				default: null
			}
		},
		emits: ['update:modelValue'],
		setup() {
			return {
				InputDesign: ui_system_input_vue.InputDesign
			};
		},
		computed: {
			isAirDesignEnabled() {
				return im_v2_lib_feature.FeatureManager.isFeatureAvailable(im_v2_lib_feature.Feature.isAirDesignEnabled);
			}
		},
		mounted() {
			this.$refs.titleInput.focus();
		},
		methods: {
			onInput(event) {
				const control = event.target;

				// BInput has no maxlength prop and forwards no attributes to its control, so the
				// limit is applied to the control the event came from.
				if (this.maxLength !== null && control.value.length > this.maxLength) {
					control.value = control.value.slice(0, this.maxLength);
				}
				this.$emit('update:modelValue', control.value);
			}
		},
		// The testid sits on the only root node, so a consumer that hangs its own one on the
		// component replaces it instead of adding a second identifier. The class lands on the same
		// node: it carries the metrics of the field and the line under it.
		template: `
		<BInput
			v-if="isAirDesignEnabled"
			ref="titleInput"
			class="bx-im-chat-forms-title-input__field"
			:modelValue="modelValue"
			:placeholder="placeholder"
			:design="InputDesign.Naked"
			stretched
			data-testid="im-chat-form-title-input"
			@input="onInput"
		/>
		<div v-else class="bx-im-chat-forms-title-input__container" data-testid="im-chat-form-title-input">
			<input
				:value="modelValue"
				:placeholder="placeholder"
				@input="onInput"
				:maxlength="maxLength"
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
			Switcher: ui_vue3_components_switcher.Switcher,
			TextMd: ui_system_typography_vue.TextMd,
			TextXs: ui_system_typography_vue.TextXs,
			BIcon: ui_iconSet_api_vue.BIcon,
			BMenu: ui_system_menu_vue.BMenu,
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
		setup() {
			return {
				Outline: ui_iconSet_api_vue.Outline
			};
		},
		data() {
			return {
				delay: this.initialDelay,
				showPopup: false,
				isDelayMenuShown: false,
				titleId: `bx-im-chat-forms-auto-delete-title-${main_core.Text.getRandom()}`
			};
		},
		computed: {
			ToggleSize: () => im_v2_component_elements_toggle.ToggleSize,
			title() {
				return this.loc('IM_CREATE_CHAT_SETTINGS_SECTION_MESSAGES_AUTO_DELETE_TITLE');
			},
			hintText() {
				return this.loc('IM_CREATE_CHAT_SETTINGS_SECTION_MESSAGES_AUTO_DELETE_HINT');
			},
			isAirDesignEnabled() {
				return im_v2_lib_feature.FeatureManager.isFeatureAvailable(im_v2_lib_feature.Feature.isAirDesignEnabled);
			},
			isEnabled() {
				return this.delay !== im_v2_const.AutoDeleteDelay.Off;
			},
			isFeatureEnabled() {
				return im_v2_lib_feature.FeatureManager.isFeatureAvailable(im_v2_lib_feature.Feature.messagesAutoDeleteEnabled);
			},
			switcherOptions() {
				return {
					size: ui_switcher.SwitcherSize.extraSmall,
					style: ui_switcher.AirSwitcherStyle.SOLID,
					showStateTitle: false,
					useAirDesign: true
				};
			},
			delayText() {
				return im_v2_lib_autoDelete.AutoDeleteManager.getStatusText(this.delay);
			},
			delayMenuOptions() {
				return {
					bindElement: this.$refs.delayTrigger.$el,
					closeOnItemClick: false,
					items: Object.values(im_v2_const.AutoDeleteDelay).map(delay => {
						return {
							title: im_v2_lib_autoDelete.AutoDeleteManager.getStatusText(delay),
							isSelected: delay === this.delay,
							onClick: () => this.selectDelay(delay)
						};
					})
				};
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
			openDelayMenu() {
				this.isDelayMenuShown = true;
			},
			selectDelay(delay) {
				this.isDelayMenuShown = false;
				this.onDelayChange(delay);
			},
			loc(phraseCode) {
				return this.$Bitrix.Loc.getMessage(phraseCode);
			}
		},
		// Switcher gives the raw control without switch semantics, so role, state and keyboard
		// toggling live on the wrapper; check/uncheck both go through the same handler because
		// turning auto-delete on has to pass the tariff gate and ask for a delay first.
		// The period lives under the caption: a plain status while auto-delete is off and a text
		// dropdown once it is on, both lined up with the caption by an empty switcher column.
		template: `
		<div class="bx-im-chat-forms-auto-delete__container" data-testid="im-chat-form-auto-delete">
			<template v-if="isAirDesignEnabled">
				<div class="bx-im-chat-forms-auto-delete__row --caption">
					<div
						class="bx-im-chat-forms-auto-delete__switcher"
						role="switch"
						tabindex="0"
						data-testid="im-chat-form-auto-delete-switcher"
						:aria-checked="isEnabled ? 'true' : 'false'"
						:aria-labelledby="titleId"
						@keydown.space.prevent="onChangeAutoDeleteState"
						@keydown.enter.prevent="onChangeAutoDeleteState"
					>
						<Switcher
							:isChecked="isEnabled"
							:options="switcherOptions"
							@check="onChangeAutoDeleteState"
							@uncheck="onChangeAutoDeleteState"
						/>
					</div>
					<div class="bx-im-chat-forms-auto-delete__caption">
						<TextMd tag="span" :id="titleId">{{ title }}</TextMd>
						<ChatHint :text="hintText" />
					</div>
				</div>
				<div class="bx-im-chat-forms-auto-delete__row">
					<div class="bx-im-chat-forms-auto-delete__spacer"></div>
					<TextXs
						v-if="isEnabled"
						ref="delayTrigger"
						tag="button"
						type="button"
						className="bx-im-chat-forms-auto-delete__delay"
						data-testid="im-chat-form-auto-delete-delay"
						@click="openDelayMenu"
					>
						{{ delayText }}
						<BIcon
							:class="['bx-im-chat-forms-auto-delete__chevron', { '--open': isDelayMenuShown }]"
							:name="Outline.CHEVRON_DOWN_S"
							color="var(--ui-color-base-3)"
						/>
					</TextXs>
					<TextXs
						v-else
						tag="span"
						className="bx-im-chat-forms-auto-delete__status"
						data-testid="im-chat-form-auto-delete-delay"
					>{{ delayText }}</TextXs>
				</div>
				<BMenu
					v-if="isDelayMenuShown"
					:options="delayMenuOptions"
					@close="isDelayMenuShown = false"
				/>
			</template>
			<template v-else>
				<Toggle
					:size="ToggleSize.M"
					:isEnabled="isEnabled"
					data-testid="im-chat-form-auto-delete-switcher"
					@click="onChangeAutoDeleteState"
					class="bx-im-chat-forms-auto-delete__toggle"
				/>
				<div class="bx-im-chat-forms-auto-delete__label">
					<div class="bx-im-chat-forms-auto-delete__title">
						{{ title }}
						<ChatHint :text="hintText" class="bx-im-chat-forms-auto-delete__hint" />
					</div>
					<AutoDeleteDropdown
						:currentDelay="delay"
						data-testid="im-chat-form-auto-delete-delay"
						@delayChange="onDelayChange"
					/>
				</div>
			</template>
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
	const FieldRow = {
		name: 'FieldRow',
		components: {
			ChatHint: im_v2_component_elements_hint.ChatHint,
			TextLg: ui_system_typography_vue.TextLg
		},
		props: {
			name: {
				type: String,
				required: true
			},
			label: {
				type: String,
				default: ''
			},
			hint: {
				type: String,
				default: ''
			}
		},
		computed: {
			// The slotted control gets the ids through the slot scope: the row cannot put
			// attributes on markup it does not own.
			controlId() {
				return `im-chat-form-field-${this.name}`;
			},
			labelId() {
				return `${this.controlId}-label`;
			}
		},
		template: `
		<div class="bx-im-chat-forms-field-row" :data-testid="'field-' + name">
			<div v-if="label" class="bx-im-chat-forms-field-row__header">
				<TextLg
					tag="label"
					:id="labelId"
					:for="controlId"
					className="bx-im-chat-forms-field-row__label"
				>{{ label }}</TextLg>
				<ChatHint v-if="hint" :text="hint"/>
			</div>
			<slot :controlId="controlId" :labelId="labelId"/>
		</div>
	`
	};

	const openingKeys = new Set(['Enter', ' ', 'ArrowDown', 'ArrowUp']);

	// @vue/component
	const SelectInput = {
		name: 'SelectInput',
		components: {
			BInput: ui_system_input_vue.BInput,
			BMenu: ui_system_menu_vue.BMenu
		},
		props: {
			/** @type SelectInputItem[] */
			items: {
				type: Array,
				required: true
			},
			value: {
				type: String,
				required: true
			},
			// BInput keeps its control private and forwards no id to it, so the caption of the row
			// cannot reach the control through for/id and names it by text instead.
			ariaLabel: {
				type: String,
				default: ''
			}
		},
		emits: ['itemChange'],
		setup() {
			return {
				InputSize: ui_system_input_vue.InputSize
			};
		},
		data() {
			return {
				isMenuShown: false
			};
		},
		computed: {
			selectedText() {
				return this.items.find(item => item.value === this.value)?.text ?? '';
			},
			menuOptions() {
				return {
					// The field as a whole is the trigger: BInput exposes no node for the control
					// inside, so the menu stamps aria-haspopup / aria-expanded here and gives the
					// focus back to the control it wrapped.
					bindElement: this.$refs.field.$el,
					closeOnItemClick: false,
					items: this.items.map(item => {
						return {
							title: item.text,
							isSelected: item.value === this.value,
							onClick: () => this.selectItem(item)
						};
					})
				};
			}
		},
		methods: {
			openMenu() {
				this.isMenuShown = true;
			},
			handleKeydown(event) {
				if (this.isMenuShown || !openingKeys.has(event.key)) {
					return;
				}
				event.preventDefault();
				this.openMenu();
			},
			selectItem(item) {
				this.isMenuShown = false;
				this.$emit('itemChange', item.value);
			}
		},
		// The field is readonly and not clickable on purpose: with clickable BInput blurs the
		// control on focus, which drops the field out of the tab order and leaves no way to open
		// the menu from the keyboard. No design is named either: the reference field is the plain
		// one of the design system, which is what BInput draws on its own default.
		template: `
		<div class="bx-im-chat-forms-select-input" data-testid="im-chat-form-select-input">
			<BInput
				ref="field"
				:modelValue="selectedText"
				:ariaLabel="ariaLabel"
				:size="InputSize.Md"
				:active="isMenuShown"
				dropdown
				readonly
				stretched
				@click="openMenu"
				@keydown="handleKeydown"
			/>
			<BMenu
				v-if="isMenuShown"
				:options="menuOptions"
				@close="isMenuShown = false"
			/>
		</div>
	`
	};

	const ICON_SIZE = 24;
	const CHEVRON_SIZE$1 = 26;

	// Glyph of every section the forms use, so the sections themselves pass nothing but their name.
	// The settings glyph comes from the project wizard, the rights one keeps the lock of the legacy
	// section, and conference keeps the camera of its menu item.
	const IconBySectionName = {
		settings: ui_iconSet_api_vue.Outline.FILTER_2_LINES,
		rights: ui_iconSet_api_vue.Outline.LOCK_L,
		conference: ui_iconSet_api_vue.Outline.RECORD_VIDEO
	};

	// @vue/component
	const CreateChatSection = {
		name: 'CreateChatSection',
		components: {
			ExpandAnimation: im_v2_component_animation.ExpandAnimation,
			BIcon: ui_iconSet_api_vue.BIcon,
			TextMd: ui_system_typography_vue.TextMd
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
		setup() {
			return {
				Outline: ui_iconSet_api_vue.Outline,
				ICON_SIZE,
				CHEVRON_SIZE: CHEVRON_SIZE$1
			};
		},
		data() {
			return {
				isOpened: false
			};
		},
		computed: {
			isAirDesignEnabled() {
				return im_v2_lib_feature.FeatureManager.isFeatureAvailable(im_v2_lib_feature.Feature.isAirDesignEnabled);
			},
			containerClasses() {
				return [`--${this.name}`, {
					'--active': this.isOpened
				}];
			},
			// The line above the content separates it from the head that revealed it, so a section
			// without a head button has nothing to be separated from.
			contentClasses() {
				return {
					'--divided': this.isAirDesignEnabled && !this.alwaysOpened
				};
			},
			sectionIcon() {
				return IconBySectionName[this.name] ?? null;
			},
			testId() {
				return `im-chat-form-section-${this.name}`;
			},
			headerTestId() {
				return `${this.testId}-header`;
			},
			contentId() {
				return `${this.testId}-content`;
			},
			// A section that never folds has nothing to operate, so its header stays a plain
			// container instead of a button stuck in the expanded state.
			headerTag() {
				return this.alwaysOpened ? 'div' : 'button';
			},
			headerAttributes() {
				if (this.alwaysOpened) {
					return {};
				}
				return {
					type: 'button',
					'aria-expanded': this.isOpened ? 'true' : 'false',
					'aria-controls': this.contentId
				};
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
		<div
			:class="containerClasses"
			class="bx-im-content-create-chat__section bx-im-content-create-chat__section_scope"
			:data-testid="testId"
		>
			<component
				v-if="isAirDesignEnabled"
				:is="headerTag"
				v-bind="headerAttributes"
				class="bx-im-chat-forms-section__header"
				:data-testid="headerTestId"
				@click="onHeaderClick"
			>
				<span class="bx-im-chat-forms-section__title">
					<BIcon
						v-if="sectionIcon"
						class="bx-im-chat-forms-section__icon"
						:name="sectionIcon"
						:size="ICON_SIZE"
						color="var(--ui-color-base-4)"
					/>
					<TextMd tag="span">{{ title }}</TextMd>
				</span>
				<BIcon
					v-if="!alwaysOpened"
					class="bx-im-chat-forms-section__chevron"
					:name="Outline.CHEVRON_DOWN_L"
					:size="CHEVRON_SIZE"
					color="var(--ui-color-base-4)"
				/>
			</component>
			<div
				v-else
				class="bx-im-content-create-chat__section_header"
				:data-testid="headerTestId"
				@click="onHeaderClick"
			>
				<div class="bx-im-content-create-chat__section_left">
					<div class="bx-im-content-create-chat__section_icon"></div>
					<div class="bx-im-content-create-chat__section_text">{{ title }}</div>
				</div>
				<div v-if="!alwaysOpened" class="bx-im-content-create-chat__section_right"></div>
			</div>
			<ExpandAnimation>
				<div v-if="isOpened" :id="contentId" class="bx-im-content-create-chat__section_content_container">
					<div class="bx-im-content-create-chat__section_content" :class="contentClasses">
						<slot></slot>
					</div>
				</div>
			</ExpandAnimation>
		</div>
	`
	};

	const CHEVRON_SIZE = 24;

	// @vue/component
	const CreateChatExternalSection = {
		name: 'CreateChatExternalSection',
		components: {
			BIcon: ui_iconSet_api_vue.BIcon,
			HeadlineXs: ui_system_typography_vue.HeadlineXs
		},
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
		setup() {
			return {
				Outline: ui_iconSet_api_vue.Outline,
				CHEVRON_SIZE
			};
		},
		computed: {
			isAirDesignEnabled() {
				return im_v2_lib_feature.FeatureManager.isFeatureAvailable(im_v2_lib_feature.Feature.isAirDesignEnabled);
			},
			testId() {
				return `im-chat-form-section-${this.name}`;
			}
		},
		// The row keeps no state: the consumer listens for a click on the section itself, and the
		// header button lets the keyboard reach that listener through the click it raises.
		template: `
		<div
			:class="'--' + name"
			class="bx-im-content-create-chat__section bx-im-content-create-chat__section_scope --external"
			:data-testid="testId"
		>
			<button v-if="isAirDesignEnabled" type="button" class="bx-im-chat-forms-section__header">
				<span class="bx-im-chat-forms-section__title">
					<span class="bx-im-content-create-chat__section_icon"></span>
					<HeadlineXs tag="span">{{ title }}</HeadlineXs>
				</span>
				<BIcon
					class="bx-im-chat-forms-section__chevron"
					:name="Outline.CHEVRON_RIGHT_L"
					:size="CHEVRON_SIZE"
					color="var(--ui-color-base-4)"
				/>
			</button>
			<div v-else class="bx-im-content-create-chat__section_header">
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
			AutoDelete,
			FieldRow
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
			isAirDesignEnabled() {
				return im_v2_lib_feature.FeatureManager.isFeatureAvailable(im_v2_lib_feature.Feature.isAirDesignEnabled);
			},
			chatTypeLabel() {
				return this.loc('IM_CREATE_CHAT_SETTINGS_SECTION_PRIVACY_MSGVER_1');
			},
			descriptionLabel() {
				return this.loc('IM_CREATE_CHAT_SETTINGS_SECTION_DESCRIPTION');
			},
			descriptionPlaceholder() {
				return this.loc('IM_CREATE_CHAT_SETTINGS_SECTION_DESCRIPTION_PLACEHOLDER_MSGVER_1');
			},
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
		// In the air branch the field label belongs to FieldRow, so the block headings are gone.
		// The radio group carries the row ids itself; BInput inside TextareaInput keeps its control
		// private, so the description field is named by the same text through ariaLabel.
		template: `
		<CreateChatSection name="settings" :title="loc('IM_CREATE_CHAT_SETTINGS_SECTION')">
			<template v-if="isAirDesignEnabled">
				<FieldRow v-if="withSearchOption" name="chat-type" :label="chatTypeLabel" v-slot="{ controlId, labelId }">
					<RadioOption
						:id="controlId"
						:aria-labelledby="labelId"
						:items="privacyOptions"
						name="chat-type"
						@change="onTypeChange"
					/>
				</FieldRow>
				<FieldRow v-if="withAutoDeleteOption" name="auto-delete">
					<AutoDelete :initialDelay="autoDeleteDelay" @delayChange="onAutoDeleteDelayChange" />
				</FieldRow>
				<FieldRow name="description" :label="descriptionLabel">
					<TextareaInput
						:ariaLabel="descriptionLabel"
						:value="description"
						:placeholder="descriptionPlaceholder"
						@input="onDescriptionChange"
					/>
				</FieldRow>
			</template>
			<template v-else>
				<div
					v-if="withSearchOption"
					class="bx-im-content-create-chat__section_block"
					data-testid="field-chat-type"
				>
					<CreateChatHeading :text="chatTypeLabel" />
					<RadioOption :items="privacyOptions" name="chat-type" @change="onTypeChange" />
				</div>
				<AutoDelete
					v-if="withAutoDeleteOption"
					:initialDelay="autoDeleteDelay"
					@delayChange="onAutoDeleteDelayChange"
				/>
				<div class="bx-im-content-create-chat__section_block" data-testid="field-description">
					<CreateChatHeading :text="descriptionLabel" />
					<div class="bx-im-chat-forms-settings__description_container">
						<TextareaInput
							:value="description"
							:placeholder="descriptionPlaceholder"
							:rounded="false"
							@input="onDescriptionChange"
						/>
					</div>
				</div>
			</template>
		</CreateChatSection>
	`
	};

	// @vue/component
	const RoleSelector = {
		name: 'RoleSelector',
		components: {
			Dropdown: im_v2_component_elements_dropdown.Dropdown,
			ChatHint: im_v2_component_elements_hint.ChatHint,
			FieldRow,
			SelectInput
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
		computed: {
			isAirDesignEnabled() {
				return im_v2_lib_feature.FeatureManager.isFeatureAvailable(im_v2_lib_feature.Feature.isAirDesignEnabled);
			},
			selectItems() {
				return this.dropdownItems.map(item => {
					return {
						value: String(item.value),
						text: item.text
					};
				});
			},
			selectedValue() {
				const currentItem = this.dropdownItems.find(item => item.default === true);
				return currentItem ? String(currentItem.value) : '';
			}
		},
		methods: {
			// SelectInput works with string values, so the role goes out the way it came in.
			onItemSelect(value) {
				const selectedItem = this.dropdownItems.find(item => String(item.value) === value);
				this.$emit('itemChange', selectedItem.value);
			}
		},
		template: `
		<FieldRow v-if="isAirDesignEnabled" :name="name" :label="title" :hint="hintText">
			<SelectInput
				:items="selectItems"
				:value="selectedValue"
				:ariaLabel="title"
				@itemChange="onItemSelect"
			/>
		</FieldRow>
		<div v-else class="bx-im-content-create-chat__section_block" :data-testid="'field-' + name">
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
				addButtonCaption: this.loc('IM_CREATE_CHAT_RIGHTS_SECTION_ADD_MANAGERS_MSGVER_1'),
				addButtonCaptionMore: this.loc('IM_CREATE_CHAT_RIGHTS_SECTION_ADD_MANAGERS_MSGVER_1'),
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
	const UserSelector = {
		name: 'UserSelector',
		components: {
			ChatHint: im_v2_component_elements_hint.ChatHint,
			FieldRow
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
			hintText: {
				type: String,
				required: false,
				default: ''
			}
		},
		computed: {
			isAirDesignEnabled() {
				return im_v2_lib_feature.FeatureManager.isFeatureAvailable(im_v2_lib_feature.Feature.isAirDesignEnabled);
			},
			// The ids of the legacy branch: there the heading is drawn here and not by the row, so the
			// pair the slot gets has to be built here as well. In air they come from the row itself.
			controlId() {
				return `im-chat-form-field-${this.name}`;
			},
			labelId() {
				return `${this.controlId}-label`;
			}
		},
		// FieldRow marks the air row itself, so the legacy wrapper repeats the same row identifier:
		// a test reaches the control the same way in both branches. The slotted selector is named by the
		// caption of the field, so both branches hand the ids of the row over to it.
		template: `
		<FieldRow
			v-if="isAirDesignEnabled"
			:name="name"
			:label="title"
			:hint="hintText"
			v-slot="{ controlId, labelId }"
		>
			<slot :controlId="controlId" :labelId="labelId"/>
		</FieldRow>
		<div v-else class="bx-im-content-create-chat__section_block" :data-testid="'field-' + name">
			<div class="bx-im-content-create-chat__section-header">
				<div :id="labelId" class="bx-im-content-create-chat__section-heading">
					{{ title }}
				</div>
				<ChatHint v-if="hintText" :text="hintText" />
			</div>
			<slot :controlId="controlId" :labelId="labelId"/>
		</div>
	`
	};

	const BlocksByChatType = {
		[im_v2_const.ChatType.channel]: new Set([im_v2_const.ChatActionGroup.manageUsersAdd, im_v2_const.ChatActionGroup.manageUsersDelete, im_v2_const.ChatActionGroup.manageMessages]),
		[im_v2_const.ChatType.videoconf]: new Set([im_v2_const.ChatActionGroup.manageUsersAdd, im_v2_const.ChatActionGroup.manageUsersDelete, im_v2_const.ChatActionGroup.manageUi, im_v2_const.ChatActionGroup.manageMessages]),
		default: new Set([im_v2_const.ChatActionGroup.manageUsersAdd, im_v2_const.ChatActionGroup.manageUsersDelete, im_v2_const.ChatActionGroup.manageUi, im_v2_const.ChatActionGroup.manageMessages, im_v2_const.ChatActionGroup.manageGuestInvites])
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
		[im_v2_const.ChatType.channel]: main_core.Loc.getMessage('IM_CREATE_CHANNEL_MANAGER_HINT_MSGVER_1'),
		default: main_core.Loc.getMessage('IM_CREATE_CHAT_MANAGER_HINT_MSGVER_1')
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

	const rightsDropdownItems = [{
		value: im_v2_const.UserRole.member,
		text: main_core.Loc.getMessage('IM_CREATE_CHAT_RIGHTS_SECTION_ROLE_MEMBER')
	}, {
		value: im_v2_const.UserRole.manager,
		text: main_core.Loc.getMessage('IM_CREATE_CHAT_RIGHTS_SECTION_ROLE_MANAGER_V2_MSGVER_1')
	}, {
		value: im_v2_const.UserRole.owner,
		text: main_core.Loc.getMessage('IM_CREATE_CHAT_RIGHTS_SECTION_ROLE_OWNER'),
		default: true
	}];

	const getDropdownItemsWithDefault = defaultValue => {
		return rightsDropdownItems.map(item => {
			return {
				...item,
				default: item.value === defaultValue
			};
		});
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
			manageGuestInvites: {
				type: String,
				default: ''
			},
			chatType: {
				type: String,
				default: im_v2_const.ChatType.chat
			}
		},
		emits: ['ownerChange', 'managersChange', 'rightChange'],
		computed: {
			PopupType: () => im_v2_const.PopupType,
			manageUsersAddItems() {
				return getDropdownItemsWithDefault(this.manageUsersAdd);
			},
			manageUsersDeleteItems() {
				return getDropdownItemsWithDefault(this.manageUsersDelete);
			},
			manageUiItems() {
				return getDropdownItemsWithDefault(this.manageUi);
			},
			manageMessagesItems() {
				return getDropdownItemsWithDefault(this.manageMessages);
			},
			manageGuestInvitesItems() {
				return getDropdownItemsWithDefault(this.manageGuestInvites);
			},
			showManageGuestInvitesBlock() {
				if (!im_v2_lib_feature.FeatureManager.isFeatureAvailable(im_v2_lib_feature.Feature.isChatWithGuestsAvailable)) {
					return false;
				}
				if (!this.manageGuestInvites) {
					return false;
				}
				const blocksByType = BlocksByChatType[this.chatType] ?? BlocksByChatType.default;
				return blocksByType.has(im_v2_const.ChatActionGroup.manageGuestInvites);
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
			onOwnerChange(ownerId) {
				this.$emit('ownerChange', ownerId);
			},
			onManagersChange(managerIds) {
				this.$emit('managersChange', managerIds);
			},
			emitRight(name, value) {
				this.$emit('rightChange', {
					name,
					value
				});
			},
			loc(phraseCode, replacements = {}) {
				return this.$Bitrix.Loc.getMessage(phraseCode, replacements);
			}
		},
		template: `
		<CreateChatSection name="rights" :title="loc('IM_CREATE_CHAT_RIGHTS_SECTION')">
			<UserSelector
				name="owner"
				:title="loc('IM_CREATE_CHAT_SETTINGS_SECTION_OWNER')"
				:hintText="ownerHint"
				v-slot="{ controlId, labelId }"
			>
				<OwnerSelector
					:id="controlId"
					:aria-labelledby="labelId"
					role="group"
					:ownerId="ownerId"
					@ownerChange="onOwnerChange"
				/>
			</UserSelector>
			<UserSelector
				name="managers"
				:title="loc('IM_CREATE_CHAT_RIGHTS_SECTION_MANAGERS_MSGVER_1')"
				:hintText="managerHint"
				v-slot="{ controlId, labelId }"
			>
				<ManagersSelector
					:id="controlId"
					:aria-labelledby="labelId"
					role="group"
					:managerIds="managerIds"
					@managersChange="onManagersChange"
				/>
			</UserSelector>
			<RoleSelector
				name="manage-users-add"
				:title="canAddUsersCaption"
				:hintText="addUsersHint"
				:dropdownId="PopupType.createChatManageUsersAddMenu"
				:dropdownItems="manageUsersAddItems"
				@itemChange="emitRight('manageUsersAdd', $event)"
			/>
			<RoleSelector
				v-if="showManageGuestInvitesBlock"
				name="manage-guest-invites"
				:title="loc('IM_CREATE_CHAT_RIGHTS_SECTION_MANAGE_GUEST_INVITES')"
				:hintText="loc('IM_CREATE_CHAT_MANAGE_GUEST_INVITES_HINT')"
				:dropdownId="PopupType.createChatManageGuestInvitesMenu"
				:dropdownItems="manageGuestInvitesItems"
				@itemChange="emitRight('manageGuestInvites', $event)"
			/>
			<RoleSelector
				name="manage-users-delete"
				:title="canKickUsersCaption"
				:hintText="deleteUsersHint"
				:dropdownId="PopupType.createChatManageUsersDeleteMenu"
				:dropdownItems="manageUsersDeleteItems"
				@itemChange="emitRight('manageUsersDelete', $event)"
			/>
			<RoleSelector
				v-if="showManageUiBlock"
				name="manage-ui"
				:title="loc('IM_CREATE_CHAT_RIGHTS_SECTION_MANAGE_UI_MSGVER_2')"
				:hintText="manageUiHint"
				:dropdownId="PopupType.createChatManageUiMenu"
				:dropdownItems="manageUiItems"
				@itemChange="emitRight('manageUi', $event)"
			/>
			<RoleSelector
				name="manage-messages"
				:title="canSendCaption"
				:hintText="sendMessagesHint"
				:dropdownId="PopupType.createChatManageMessagesMenu"
				:dropdownItems="manageMessagesItems"
				@itemChange="emitRight('manageMessages', $event)"
			/>
		</CreateChatSection>
	`
	};

	// @vue/component
	const PrivacySection = {
		components: {
			CreateChatSection,
			RadioOption,
			FieldRow
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
			isAirDesignEnabled() {
				return im_v2_lib_feature.FeatureManager.isFeatureAvailable(im_v2_lib_feature.Feature.isAirDesignEnabled);
			},
			sectionTitle() {
				return this.loc('IM_CREATE_CHAT_PRIVACY_SECTION_V2');
			},
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
		// The section holds a single field, so in air it is a field and not an accordion: the caption
		// stays on the background of the form and the options get a card of their own. The group carries
		// the row ids itself, the way the chat type field of the settings section does.
		template: `
		<FieldRow
			v-if="isAirDesignEnabled"
			name="privacy-type"
			:label="sectionTitle"
			class="bx-im-chat-forms-privacy"
			v-slot="{ controlId, labelId }"
		>
			<RadioOption
				:id="controlId"
				:aria-labelledby="labelId"
				:items="privacyOptions"
				class="bx-im-chat-forms-privacy__options"
				name="privacy-type"
				@change="onTypeChange"
			/>
		</FieldRow>
		<CreateChatSection v-else name="privacy" :title="sectionTitle" alwaysOpened>
			<div class="bx-im-content-create-chat__section_block" data-testid="field-privacy-type">
				<RadioOption :items="privacyOptions" name="privacy-type" @change="onTypeChange" />
			</div>
		</CreateChatSection>
	`
	};

	// @vue/component
	const ConferenceSection = {
		components: {
			CreateChatSection,
			CreateChatHeading,
			FieldRow,
			Toggle: im_v2_component_elements_toggle.Toggle,
			Switcher: ui_vue3_components_switcher.Switcher,
			BInput: ui_system_input_vue.BInput,
			TextMd: ui_system_typography_vue.TextMd
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
		data() {
			return {
				captionId: `bx-im-chat-forms-conference-password-${main_core.Text.getRandom()}`
			};
		},
		computed: {
			ToggleSize: () => im_v2_component_elements_toggle.ToggleSize,
			isAirDesignEnabled() {
				return im_v2_lib_feature.FeatureManager.isFeatureAvailable(im_v2_lib_feature.Feature.isAirDesignEnabled);
			},
			switcherOptions() {
				return {
					size: ui_switcher.SwitcherSize.medium,
					style: ui_switcher.AirSwitcherStyle.SOLID,
					showStateTitle: false,
					useAirDesign: true
				};
			},
			privacyLabel() {
				return this.loc('IM_CREATE_CHAT_CONFERENCE_SECTION_PRIVACY');
			},
			usePasswordLabel() {
				return this.loc('IM_CREATE_CHAT_CONFERENCE_SECTION_USE_PASSWORD');
			},
			passwordPlaceholder() {
				return this.loc('IM_CREATE_CHAT_CONFERENCE_SECTION_PASSWORD_PLACEHOLDER');
			},
			passwordAriaLabel() {
				return this.loc('IM_CREATE_CHAT_CONFERENCE_SECTION_PASSWORD_ARIA');
			}
		},
		methods: {
			onPasswordNeededChange(passwordNeeded) {
				this.$emit('passwordNeededChange', passwordNeeded);
			},
			onPasswordChange(event) {
				this.$emit('passwordChange', event.target.value);
			},
			onPasswordNeededToggle() {
				this.onPasswordNeededChange(!this.passwordNeeded);
			},
			loc(phraseCode, replacements = {}) {
				return this.$Bitrix.Loc.getMessage(phraseCode, replacements);
			}
		},
		// Both switcher events lead to the same handler because ui.switcher reports the state it left,
		// not the one it entered; role, state and keyboard toggling live on the wrapper around it.
		// The row label names the pair of controls, so the password field carries a name of its own.
		template: `
		<CreateChatSection name="conference" :title="loc('IM_CREATE_CHAT_CONFERENCE_SECTION')">
			<FieldRow
				v-if="isAirDesignEnabled"
				name="conference-privacy"
				:label="privacyLabel"
				v-slot="{ controlId }"
			>
				<div class="bx-im-chat-forms-conference__password-toggle">
					<div
						:id="controlId"
						class="bx-im-chat-forms-conference__switcher"
						role="switch"
						tabindex="0"
						data-testid="im-chat-form-conference-password-switcher"
						:aria-checked="passwordNeeded ? 'true' : 'false'"
						:aria-labelledby="captionId"
						@keydown.space.prevent="onPasswordNeededToggle"
						@keydown.enter.prevent="onPasswordNeededToggle"
					>
						<Switcher
							:isChecked="passwordNeeded"
							:options="switcherOptions"
							@check="onPasswordNeededToggle"
							@uncheck="onPasswordNeededToggle"
						/>
					</div>
					<TextMd
						tag="span"
						:id="captionId"
						className="bx-im-chat-forms-conference__caption"
						@click="onPasswordNeededToggle"
					>{{ usePasswordLabel }}</TextMd>
				</div>
				<BInput
					v-if="passwordNeeded"
					class="bx-im-chat-forms-conference__password-field"
					type="password"
					:modelValue="password"
					:placeholder="passwordPlaceholder"
					:ariaLabel="passwordAriaLabel"
					stretched
					data-testid="im-chat-form-conference-password"
					@input="onPasswordChange"
				/>
			</FieldRow>
			<div v-else class="bx-im-content-create-chat__section_block">
				<CreateChatHeading :text="privacyLabel" />
				<div @click="onPasswordNeededToggle" class="bx-im-chat-forms-chat-settings__type-select">
					<Toggle
						:size="ToggleSize.M"
						:isEnabled="passwordNeeded"
						data-testid="im-chat-form-conference-password-switcher"
					/>
					<div class="bx-im-chat-forms-chat-settings__type-select_label">
						{{ usePasswordLabel }}
					</div>
				</div>
				<div
					v-if="passwordNeeded"
					class="bx-im-chat-forms-chat-settings__password-container ui-ctl ui-ctl-textbox"
					data-testid="im-chat-form-conference-password"
				>
					<input
						type="text"
						class="bx-im-content-create-chat-conference__password-input ui-ctl-element"
						:value="password"
						:placeholder="passwordPlaceholder"
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
	exports.FieldRow = FieldRow;
	exports.PrivacySection = PrivacySection;
	exports.RadioOption = RadioOption;
	exports.RightsSection = RightsSection;
	exports.SelectInput = SelectInput;
	exports.SettingsSection = SettingsSection;
	exports.TextareaInput = TextareaInput;
	exports.TitleInput = TitleInput;
	exports.checkParentAccess = checkParentAccess;

})(this.BX.Messenger.v2.Component.Content = this.BX.Messenger.v2.Component.Content || {}, BX.Vue3.Components, window, BX.Messenger.v2.Lib, BX.Messenger.v2.Component.Elements, BX, BX.Messenger.v2.Component.Elements, BX.Messenger.v2.Service, BX.UI.EntitySelector, BX.Messenger.v2.Application, BX.Messenger.v2.Lib, BX.Messenger.v2.Const, BX.UI.System.Typography.Vue, BX.Messenger.v2.Component.Elements, BX.UI.System.RadioButton, BX.UI.System.Input.Vue, BX.UI.Vue3.Components, BX.UI, BX.UI.IconSet, BX.UI.System.Menu, window, BX.Messenger.v2.Lib, BX.Messenger.v2.Component.Elements, BX.Messenger.v2.Component.Elements, BX.Messenger.v2.Component.Animation, BX, BX.Messenger.v2.Component.Elements, BX.Messenger.v2.Lib, BX.Messenger.v2.Lib);
//# sourceMappingURL=registry.bundle.js.map
