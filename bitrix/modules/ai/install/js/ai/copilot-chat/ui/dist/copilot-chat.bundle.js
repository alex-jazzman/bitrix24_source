/* eslint-disable */
this.BX = this.BX || {};
this.BX.AI = this.BX.AI || {};
this.BX.AI.CopilotChat = this.BX.AI.CopilotChat || {};
(function (exports, main_core, main_core_events, main_popup, ui_vue3, ui_iconSet_api_vue, ui_iconSet_actions, ai_speechConverter, ui_iconSet_api_core, ui_iconSet_main, main_date, ui_bbcode_formatter_htmlFormatter, helper, main_loader) {
	'use strict';

	const Status = Object.freeze({
		COPILOT_WRITING: 'copilot-writing',
		NONE: 'none'
	});
	const CopilotChatStatus = {
		components: {
			BIcon: ui_iconSet_api_vue.BIcon
		},
		props: {
			status: {
				type: String,
				required: false,
				default: Status.NONE
			}
		},
		computed: {
			Status() {
				return Status;
			},
			writingStatusIcon() {
				return {
					name: ui_iconSet_api_vue.Set.PENCIL_60,
					size: 14,
					color: '#fff'
				};
			},
			containerClassname() {
				return ['ai__copilot-chat_status', `--${this.status}`];
			},
			copilotName() {
				return main_core.Extension.getSettings('landing.copilot.chat').copilotName;
			}
		},
		template: `
		<div class="ai__copilot-chat_status-wrapper">
			<div class="ai__copilot-chat_status">
				<template v-if="status === Status.COPILOT_WRITING">
					<span class="ai__copilot-chat_status-icon --typing">
						<BIcon
							v-bind="writingStatusIcon"
						/>
					</span>
					<span>
						{{
							$Bitrix.Loc.getMessage(
								'AI_COPILOT_CHAT_STATUS_COPILOT_WRITING_MSGVER_1',
								{ '#COPILOT_NAME#': copilotName }
							)
						}}
					</span>
				</template>
			</div>
		</div>
	`
	};

	const NewMessagesVisibilityObserverEvents = Object.freeze({
		VIEW_NEW_MESSAGE: 'viewNewMessage'
	});
	class NewMessagesVisibilityObserver extends main_core_events.EventEmitter {
		#observer = null;
		#root = null;
		#observableElements = [];
		constructor(options) {
			super(options);
			this.setEventNamespace('AI.CopilotChat.InterSectionManager');
		}
		init() {
			// eslint-disable-next-line @bitrix24/bitrix24-rules/no-io-without-polyfill
			this.#observer = new IntersectionObserver(entries => {
				entries.forEach(entry => {
					const isMessageVisible = entry.isIntersecting && entry.intersectionRatio > 0.5;
					if (isMessageVisible) {
						const messageElement = entry.target;
						this.emit(NewMessagesVisibilityObserverEvents.VIEW_NEW_MESSAGE, new main_core_events.BaseEvent({
							data: {
								id: main_core.Dom.attr(messageElement, 'data-id')
							}
						}));
						this.#observer.unobserve(messageElement);
					}
				});
			}, {
				root: this.#root,
				threshold: this.#getThreshold()
			});
			this.#observableElements.forEach(element => {
				this.#observer.observe(element);
			});
		}
		#getThreshold() {
			const arrayWithZeros = Array.from({
				length: 101
			}).fill(0);
			return arrayWithZeros.map((zero, index) => index * 0.01);
		}
		observe(element) {
			if (!this.#root || !this.#observer) {
				this.#observableElements.push(element);
			} else {
				this.#observer.observe(element);
			}
		}
		unobserve(element) {
			this.#observer.unobserve(element);
		}
		setRoot(root) {
			this.#root = root;
		}
	}

	const CopilotChatAvatar = {
		props: {
			src: String,
			alt: String
		},
		template: `
		<img
			class="ai__copilot-chat-avatar"
			:alt="alt"
			:src="src"
		/>
	`
	};

	const CopilotChatHeaderMenu = {
		components: {
			BIcon: ui_iconSet_api_vue.BIcon
		},
		props: {
			menuItems: {
				type: Array,
				required: true,
				default: () => []
			}
		},
		computed: {
			items() {
				return this.menuItems;
			},
			menuIconProps() {
				return {
					name: ui_iconSet_api_vue.Set.MORE,
					size: 24
				};
			}
		},
		beforeMount() {
			this.menu = new main_popup.Menu({
				items: this.items
			});
		},
		mounted() {
			this.menu.getPopupWindow().setBindElement(this.$refs.menuButton);
		},
		beforeUnmount() {
			this.menu.destroy();
		},
		methods: {
			toggleMenu() {
				if (this.isMenuOpen()) {
					this.hideMenu();
				} else {
					this.showMenu();
				}
			},
			showMenu() {
				this.menu.show();
			},
			hideMenu() {
				this.menu.close();
			},
			isMenuOpen() {
				return this.menu.getPopupWindow().isShown();
			}
		},
		template: `
		<button
			ref="menuButton"
			@click="toggleMenu"
			class="ai__copilot-chat-header-menu"
		>
			<span class="ai__copilot-chat-header-menu_icon">
				<b-icon
					v-bind="menuIconProps"
				></b-icon>
			</span>
		</button>
	`
	};

	const CopilotChatHeader = {
		components: {
			CopilotChatAvatar,
			CopilotChatHeaderMenu,
			BIcon: ui_iconSet_api_vue.BIcon
		},
		emits: ['clickOnCloseIcon'],
		props: {
			title: String,
			subtitle: String,
			avatar: String,
			useCloseIcon: {
				type: Boolean,
				required: false,
				default: false
			},
			menu: Object
		},
		computed: {
			closeIconProps() {
				return {
					name: ui_iconSet_api_vue.Set.CROSS_40,
					size: 24
				};
			},
			isMenuExists() {
				return this.menu && this.menu.items && this.menu.items.length > 0;
			},
			menuItems() {
				return this.menu?.items ?? [];
			}
		},
		methods: {
			handleClickOnCloseIcon() {
				this.$emit('clickOnCloseIcon');
			}
		},
		template: `
		<div class="ai__copilot-chat-header">
			<button
				v-if="useCloseIcon"
				@click="handleClickOnCloseIcon"
				class="ai__copilot-chat-header_close-icon"
			>
				<b-icon
					v-bind="closeIconProps"
				 />
			</button>
			<div class="ai__copilot-chat-header_avatar">
				<CopilotChatAvatar
					:src="avatar"
					:alt="title"
				/>
			</div>
			<div class="ai__copilot-chat-header_info">
				<h4 class="ai__copilot-chat-header_title">
					{{ title }}
				</h4>
				<div class="ai__copilot-chat-header_subtitle">
					{{ subtitle }}
				</div>
			</div>
			<div
				v-if="isMenuExists"
				class="ai__copilot-chat-header_menu"
			>
				<copilot-chat-header-menu :menu-items="menuItems"></copilot-chat-header-menu>
			</div>
		</div>
	`
	};

	const CopilotChatVoiceInputBtn = {
		components: {
			BIcon: ui_iconSet_api_vue.BIcon
		},
		emits: ['input', 'start', 'stop'],
		data() {
			return {
				converter: null,
				isVoiceRecording: false
			};
		},
		computed: {
			IconSet() {
				return ui_iconSet_api_core.Set;
			},
			isVoiceInputDisabled() {
				return ai_speechConverter.SpeechConverter.isBrowserSupport() === false;
			}
		},
		methods: {
			handleClickOnStartVoiceInputBtn() {
				if (this.isVoiceRecording) {
					this.stopVoiceInput();
				} else {
					this.startVoiceInput();
				}
			},
			startVoiceInput() {
				const converter = ui_vue3.toRaw(this.converter);
				converter.start();
			},
			stopVoiceInput() {
				const converter = ui_vue3.toRaw(this.converter);
				converter.stop();
			},
			handleSpeechConverterStartEvent() {
				this.$emit('start');
				this.isVoiceRecording = true;
			},
			handleSpeechConverterStopEvent() {
				this.isVoiceRecording = false;
				this.$emit('stop');
			},
			handleSpeechConverterResultEvent(e) {
				this.$emit('input', e.getData().text);
			},
			handleSpeechConverterErrorEvent(e) {
				console.error(e);
				this.isVoiceRecording = false;
			}
		},
		mounted() {
			if (this.isVoiceInputDisabled === false) {
				this.converter = new ai_speechConverter.SpeechConverter({});
				const converter = ui_vue3.toRaw(this.converter);
				converter.subscribe(ai_speechConverter.speechConverterEvents.start, this.handleSpeechConverterStartEvent);
				converter.subscribe(ai_speechConverter.speechConverterEvents.stop, this.handleSpeechConverterStopEvent);
				converter.subscribe(ai_speechConverter.speechConverterEvents.result, this.handleSpeechConverterResultEvent.bind(this));
				converter.subscribe(ai_speechConverter.speechConverterEvents.error, this.handleSpeechConverterErrorEvent);
			}
		},
		unmounted() {
			if (this.isVoiceInputDisabled === false) {
				const converter = ui_vue3.toRaw(this.converter);
				converter.unsubscribe(ai_speechConverter.speechConverterEvents.start, this.handleSpeechConverterStartEvent);
				converter.unsubscribe(ai_speechConverter.speechConverterEvents.stop, this.handleSpeechConverterStopEvent);
				converter.unsubscribe(ai_speechConverter.speechConverterEvents.result, this.handleSpeechConverterResultEvent.bind(this));
				converter.unsubscribe(ai_speechConverter.speechConverterEvents.error, this.handleSpeechConverterErrorEvent);
			}
		},
		template: `
		<button
			:disabled="isVoiceInputDisabled"
			@click="handleClickOnStartVoiceInputBtn"
			class="ai__copilot-chat-input_voice-input"
		>
			<span
				v-if="isVoiceRecording === false"
				class="ai__copilot-chat-input_voice-input-no-record-icon-wrapper"
			>
				<BIcon
					:size="24"
					:name="IconSet.MICROPHONE_ON"
				/>
			</span>
			<span
				v-else
				class="ai__copilot-chat-input_voice-input-record-icon-wrapper"
			>
				<span class="ai__copilot-chat-input_voice-input-record-icon"></span>
			</span>
		</button>
	`
	};

	const CopilotChatInput = {
		components: {
			CopilotChatVoiceInputBtn
		},
		emits: ['submit'],
		props: {
			disabled: {
				type: Boolean,
				required: false,
				default: false
			},
			placeholder: {
				type: String,
				required: false,
				default: main_core.Loc.getMessage('AI_COPILOT_CHAT_INPUT_PLACEHOLDER')
			}
		},
		data() {
			return {
				userMessage: '',
				userMessageBeforeVoiceInput: this.userMessage,
				isRecording: false
			};
		},
		computed: {
			isSubmitButtonDisabled() {
				return !this.userMessage || this.userMessage.trim().length === 0 || this.isRecording;
			},
			containerClassname() {
				return {
					'ai__copilot-chat-input': true,
					'--disabled': this.disabled
				};
			}
		},
		mounted() {
			setTimeout(() => {
				this.$refs.textarea.focus();
			}, 500);
		},
		methods: {
			handleSubmitButton(e) {
				e.target.blur();
				this.submitMessage();
			},
			handleEnterKeyDown(e) {
				if (e.shiftKey || e.ctrlKey) {
					return true;
				}
				e.preventDefault();
				if (this.userMessage?.trim()) {
					this.submitMessage();
				}
				return false;
			},
			submitMessage() {
				this.$emit('submit', this.userMessage.trim());
				this.userMessage = '';
			},
			handleInput(e) {
				this.userMessage = e.target.value;
			},
			handleVoiceInputText(text) {
				this.userMessage = this.userMessageBeforeVoiceInput + text;
				this.updateTextareaHeight();
			},
			handleStartVoiceInput() {
				this.isRecording = true;
				if (this.userMessage && this.userMessage.at(-1) !== ' ') {
					this.userMessage += ' ';
				}
				this.userMessageBeforeVoiceInput = this.userMessage;
			},
			handleStopVoiceInput() {
				this.isRecording = false;
				this.$refs.textarea.focus();
			},
			updateTextareaHeight() {
				const textarea = this.$refs.textarea;
				main_core.Dom.style(textarea, 'height', 'auto');
				main_core.Dom.style(textarea, 'height', `${textarea.scrollHeight}px`);
			}
		},
		watch: {
			userMessage() {
				requestAnimationFrame(() => {
					this.updateTextareaHeight();
				});
			},
			disabled(isDisabled) {
				if (isDisabled === false) {
					this.$refs.textarea.focus();
				} else {
					this.$refs.textarea.blur();
				}
			}
		},
		template: `
		<div :class="containerClassname">
			<div class="ai__copilot-chat-input_textarea-wrapper">
				<textarea
					type="text" class="ai__copilot-chat-input_textarea"
					ref="textarea"
					:placeholder="placeholder"
					rows="1"
					@input="handleInput"
					@keydown.enter="handleEnterKeyDown"
					:value="userMessage"
				/>
			</div>
			<div class="ai__copilot-chat-input_actions">
				<CopilotChatVoiceInputBtn
					@start="handleStartVoiceInput"
					@input="handleVoiceInputText"
					@stop="handleStopVoiceInput"
				/>
				<button @click="handleSubmitButton" :disabled="isSubmitButtonDisabled" class="ai__copilot-chat-input_submit"></button>
			</div>
		</div>
	`
	};

	const isMessageFromCopilot = authorId => {
		return authorId === 0;
	};

	const CopilotChatMessage = {
		props: {
			avatar: String,
			avatarAlt: String,
			messageTitle: String,
			messageText: String,
			time: String,
			buttons: {
				type: Array,
				required: false,
				default: () => []
			},
			colorScheme: String,
			status: {
				type: String,
				required: false
			}
		},
		computed: {
			messageButtons() {
				return this.buttons;
			},
			formattedTime() {
				const date = new Date(this.time);
				return `${date.getHours()}:${date.getMinutes()}`;
			},
			isUserMessage() {
				return true; // replace with the actual code
			}
		},
		template: `
		<div
			class="ai__copilot-chat-message"
			:class="'--color-schema-' + colorScheme"
		>
			<div class="ai__copilot-chat-message_avatar-wrapper">
				<img
					class="ai__copilot-chat-message_avatar"
					:src="avatar"
					:alt="avatarAlt"
					:title="avatarAlt"
				>
			</div>
			<div class="ai__copilot-chat-message-content-wrapper">
				<div class="ai__copilot-chat-message-content">
					<div class="ai__copilot-chat-message-content-main">
						<div
							v-if="messageTitle"
							class="ai__copilot-chat-message-title"
						>
							{{ messageTitle }}
						</div>
						<div class="ai__copilot-chat-message-text">
							{{ messageText }}
						</div>
					</div>
					<div class="ai__copilot-chat-message_time">
						{{ formattedTime }}
					</div>
					<div
						v-if="status"
						class="ai__copilot-chat-message_status"
						:class="'--' + status"
					></div>
				</div>
			</div>
			<div v-if="messageButtons.length > 0" class="ai__copilot-chat-message_action-buttons">
				<button
					v-for="button in messageButtons"
					class="ai__copilot-chat-message_action-button"
					:class="{'--selected': button.isSelected}"
				>
					{{ button.text }}
				</button>
			</div>
		</div>
	`
	};

	const CopilotChatWelcomeMessage = {
		props: {
			avatar: String,
			title: String,
			content: String
		},
		template: `
		<div class="landing__copilot-landing-chat-welcome-message">
			<div class="landing__copilot-landing-chat-welcome-message_avatar-wrapper">
				<img
					class="landing__copilot-landing-chat-welcome-message_avatar"
					src="/dev/ai/copilot-chat/images/avatar-example-4x.png"
					alt="Copilot Designer"
				>
			</div>
			<div class="landing__copilot-landing-chat-welcome-message_content">
				<h6 class="landing__copilot-landing-chat-welcome-message_title">{{ title }}</h6>
				<div v-html="content"></div>
			</div>
		</div>
	`
	};

	const CopilotChatMessagesDateGroup = {
		props: {
			date: {
				type: String,
				required: false,
				default: ''
			}
		},
		computed: {
			formattedDate() {
				const format = [['today', 'today'], ['yesterday', 'yesterday'], ['m', 'l, d F'], ['', 'l, d F Y']];
				return main_date.DateTimeFormat.format(format, new Date(this.date), new Date());
			}
		},
		template: `
		<div class="ai__copilot-chat-messages-date-group">
			<div class="ai__copilot-chat-messages-date-group__date">
				<div class="ai__copilot-chat-messages-date-group__date-label">
					{{ formattedDate }}
				</div>
			</div>
			<div class="ai__copilot-chat-messages-date-group__content">
				<slot></slot>
			</div>
		</div>
	`
	};

	const containerClassname = 'ai__copilot-chat_new-messages-label';
	const CopilotChatNewMessagesLabel = {
		template: `
		<div class="${containerClassname}">
			{{ $Bitrix.Loc.getMessage('AI_COPILOT_CHAT_NEW_MESSAGES_LABEL') }}
		</div>
	`
	};

	const CopilotChatMessagesAuthorGroup = {
		components: {
			CopilotChatNewMessagesLabel
		},
		props: {
			avatar: {
				type: String,
				required: false
			},
			showNewMessagesLabel: {
				type: Boolean,
				required: false,
				default: false
			}
		},
		template: `
		<CopilotChatNewMessagesLabel v-if="showNewMessagesLabel" />
		<div class="ai__copilot-chat_messages-author-group">
			<div class="ai__copilot-chat_messages-author-group__avatar">
				<img v-if="avatar" :src="avatar" alt="#">
			</div>
			<div class="ai__copilot-chat_messages-author-group__messages">
				<slot></slot>
			</div>
		</div>
	`
	};

	const CopilotChatMessageType = Object.freeze({
		DEFAULT: 'Default',
		BUTTON_CLICK_MESSAGE: 'ButtonClicked',
		WELCOME_FLOWS: 'WelcomeFlows',
		WELCOME_SITE_WITH_AI: 'GreetingSiteWithAi',
		SYSTEM: 'System'
	});

	const CopilotChatNewMessageVisibilityObserver = {
		mounted(element, binding) {
			const isMessageViewed = binding.value;
			if (isMessageViewed === false) {
				binding.instance.observer.observe(element);
			}
		},
		beforeUnmount(element, binding) {
			binding.instance.observer.unobserve(element);
		}
	};

	const CopilotChatMessageButton = {
		components: {
			BIcon: ui_iconSet_api_vue.BIcon
		},
		props: {
			icon: {
				type: String,
				required: true
			},
			class: Array | Object | String
		},
		computed: {
			menuIconProps() {
				return {
					name: this.icon,
					size: 22
				};
			},
			className() {
				return this.class;
			}
		},
		template: `
		<button
			class="ai__copilot-chat-message-menu"
			:class="className"
		>
			<BIcon v-bind="menuIconProps"></BIcon>
		</button>
	`
	};

	const CopilotChatMessageMenu = {
		components: {
			BIcon: ui_iconSet_api_vue.BIcon,
			CopilotChatMessageButton
		},
		props: {
			menuItems: {
				type: Array,
				required: true,
				default: () => []
			},
			message: {
				type: Object,
				required: true,
				default: () => ({})
			},
			icon: {
				type: String,
				required: false,
				default: ui_iconSet_api_vue.Set.MORE
			}
		},
		data() {
			return {
				isMenuOpen: false
			};
		},
		computed: {
			items() {
				return this.menuItems.map(item => {
					return {
						...item,
						onclick: (event, menuItem) => {
							const myCustomData = {
								message: {
									id: this.message.id,
									content: this.message.content,
									dateCreate: this.message.dateCreate
								}
							};
							this.hideMenu();
							return item.onclick(event, menuItem, myCustomData);
						}
					};
				});
			},
			menuIconProps() {
				return {
					name: this.icon,
					size: 22
				};
			},
			menuButtonClassname() {
				return {
					'ai__copilot-chat-message-menu': true,
					'--open': this.isMenuOpen
				};
			}
		},
		methods: {
			toggleMenu() {
				if (this.isMenuOpen) {
					this.hideMenu();
				} else {
					this.showMenu();
				}
			},
			showMenu() {
				if (!this.menu) {
					this.initMenu();
				}
				this.menu?.show();
			},
			hideMenu() {
				this.menu?.close();
			},
			initMenu() {
				this.menu = new main_popup.Menu({
					items: this.items,
					angle: {
						offset: main_core.Dom.getPosition(this.$refs.menuButton.$el).width / 2 + 23
					},
					events: {
						onPopupShow: () => {
							this.isMenuOpen = true;
						},
						onPopupClose: () => {
							this.isMenuOpen = false;
						}
					},
					bindElement: this.$refs.menuButton.$el
				});
				main_core.bind(document.body.querySelector('.ai__copilot-chat_main'), 'scroll', () => {
					this.hideMenu();
				});
				return this.menu;
			}
		},
		beforeUnmount() {
			this.menu?.destroy();
		},
		template: `
		<CopilotChatMessageButton
			ref="menuButton"
			@click="toggleMenu"
			:icon="menuIconProps.name"
			:class="menuButtonClassname"
		/>
	`
	};

	const CopilotChatMessageDefault = {
		components: {
			CopilotChatMessageMenu
		},
		emits: ['buttonClick', 'remove', 'retry'],
		props: {
			message: {
				type: Object,
				required: true
			},
			avatar: {
				type: String,
				required: true
			},
			title: {
				type: String,
				required: false
			},
			useAvatarTail: {
				type: Boolean,
				required: false,
				default: false
			},
			menuItems: {
				type: Array,
				required: false,
				default: () => []
			},
			color: {
				type: String,
				required: false,
				default: ''
			},
			disableAllActions: {
				type: Boolean,
				required: false,
				default: false
			}
		},
		computed: {
			messageData() {
				return this.message;
			},
			messageContent() {
				return this.messageData.content;
			},
			isMessageFromCopilot() {
				return isMessageFromCopilot(this.messageData.authorId);
			},
			formattedMessageContent() {
				const htmlFormatter = new ui_bbcode_formatter_htmlFormatter.HtmlFormatter({
					containerMode: 'collapsed'
				});
				return htmlFormatter.format({
					source: this.messageContent
				});
			},
			formattedDeliveryTime() {
				return this.formatTime(this.messageData.dateCreate);
			},
			messageButtons() {
				return this.messageData.params?.buttons ?? [];
			},
			isSomeButtonSelected() {
				return this.messageButtons.some(button => button.selected);
			},
			showMenuButton() {
				return this.menuItems?.length > 0;
			},
			isErrorMessage() {
				return this.messageData.status === CopilotChatMessageStatus.ERROR;
			},
			errorMessageMenuItems() {
				return [{
					id: 'retry',
					text: this.$Bitrix.Loc.getMessage('AI_COPILOT_CHAT_RETRY_MESSAGE'),
					onclick: () => {
						this.$emit('retry', this.messageData.id);
					}
				}, {
					id: 'remove',
					text: this.$Bitrix.Loc.getMessage('AI_COPILOT_CHAT_REMOVE_MESSAGE'),
					onclick: () => {
						this.$emit('remove', this.messageData.id);
					}
				}];
			},
			Icons() {
				return ui_iconSet_api_core.Set;
			}
		},
		methods: {
			formatTime(dateTime) {
				if (!dateTime) {
					return '';
				}
				const date = new Date(dateTime);
				const hours = date.getHours().toString().padStart(2, '0');
				const minutes = date.getMinutes().toString().padStart(2, '0');
				return `${hours}:${minutes}`;
			}
		},
		mounted() {
			if (this.isMessageFromCopilot) {
				main_core.Dom.append(this.formattedMessageContent, this.$refs.content);
			} else {
				this.$refs.content.innerText = this.messageContent;
			}
		},
		template: `
		<div
			:data-id="messageData.id"
			class="ai__copilot-chat-message"
			:class="'--color-schema-' + color"
		>
			<div
				class="ai__copilot-chat-message-content-wrapper"
				:class="{ '--with-tail': useAvatarTail }"
			>
				<div class="ai__copilot-chat-message-content">
					<div class="ai__copilot-chat-message-content-main">
						<div
							v-if="title"
							class="ai__copilot-chat-message-title"
						>
							{{ title }}
						</div>
						<div class="ai__copilot-chat-message-text" ref="content"></div>
					</div>
					<div class="ai__copilot-chat-message_status-info">
						<div
							v-if="messageData.dateCreate"
							class="ai__copilot-chat-message_time"
						>
							{{ formattedDeliveryTime }}
						</div>
						<div
							v-if="messageData.status && isMessageFromCopilot === false"
							class="ai__copilot-chat-message_status"
							:class="'--' + messageData.status"
						></div>
					</div>
				</div>
				<div v-if="messageButtons.length > 0" class="ai__copilot-chat-message_action-buttons">
					<button
						v-for="button in messageButtons"
						class="ai__copilot-chat-message_action-button"
						:class="{'--selected': button.selected}"
						:disabled="isSomeButtonSelected || disableAllActions"
						@click="$emit('buttonClick', button.id)"
					>
						{{ button.title }}
					</button>
				</div>
			</div>
			<div
				v-if="showMenuButton"
				class="ai__copilot-chat-message_menu"
			>
				<CopilotChatMessageMenu
					:menu-items="menuItems"
					:message="message"
				/>
			</div>
			<div
				v-else-if="isErrorMessage"
				class="ai__copilot-chat-message_retry-button"
			>
				<CopilotChatMessageMenu
					:menu-items="errorMessageMenuItems"
					:message="message"
					:icon="Icons.REDO_1"
				/>
			</div>
		</div>
	`
	};

	const CopilotChatMessageWelcome = {
		props: {
			message: {
				type: Object,
				required: false
			},
			avatar: {
				type: String,
				required: false
			}
		},
		computed: {
			messageInfo() {
				return this.message;
			},
			title() {
				return this.messageInfo.params?.title ?? '';
			},
			subtitle() {
				return this.messageInfo.params?.subtitle ?? '';
			},
			content() {
				return this.messageInfo.params?.content ?? '';
			}
		},
		template: `
		<div class="ai__copilot-chat-message-welcome">
			<header class="ai__copilot-chat-message-welcome_header">
				<div class="ai__copilot-chat-message-welcome_header-left">
					<img
						:src="avatar"
						alt="#"
						class="ai__copilot-chat-message-welcome_avatar"
					>
				</div>
				<div class="ai__copilot-chat-message-welcome_header-right">
					<h5 class="ai__copilot-chat-message-welcome_title">{{ title }}</h5>
					<p v-if="subtitle" class="ai__copilot-chat-message-welcome_subtitle">{{ subtitle }}</p>
				</div>
			</header>
			<main class="ai__copilot-chat-message-welcome_main">
				<div class="ai__copilot-chat-message-welcome_content">
					<slot name="content">
						{{ content }}
					</slot>
				</div>
			</main>
		</div>
	`
	};

	const CopilotChatMessageSiteWithAi = {
		components: {
			CopilotChatMessageWelcome
		},
		props: {
			message: {
				type: Object,
				required: false
			},
			avatar: {
				type: String,
				required: false
			},
			disableAllActions: {
				type: Boolean,
				required: false,
				default: false
			}
		},
		inject: ['instance'],
		computed: {
			chatInstance() {
				return this.instance;
			},
			messageInfo() {
				return {
					...this.message,
					params: {
						...this.message.params,
						title: this.$Bitrix.Loc.getMessage('AI_COPILOT_CHAT_WELCOME_MESSAGE_SITE_WITH_AI_TITLE'),
						subtitle: '',
						content: ''
					}
				};
			}
		},
		methods: {
			renderContent() {
				const buttons = this.messageInfo.params?.buttons ?? [];
				const isMessageHaveCreateSiteButton = buttons.length > 0;
				const paragraph2 = isMessageHaveCreateSiteButton ? this.$Bitrix.Loc.getMessage('AI_COPILOT_CHAT_WELCOME_MESSAGE_SITE_WITH_AI_2', {
					'#LINK#': `<a href="#" class="${this.disableAllActions ? 'disabled' : ''}" ref="createSiteLink">`,
					'#/LINK#': '</a>'
				}) : '';
				const content = main_core.Tag.render`
				<div ref="root">
					<p>${this.$Bitrix.Loc.getMessage('AI_COPILOT_CHAT_WELCOME_MESSAGE_SITE_WITH_AI_1')}</p>
					<p>${paragraph2}</p>
					<a href="#" ref="infoLink">${this.$Bitrix.Loc.getMessage('AI_COPILOT_CHAT_WELCOME_LINK_SITE_WITH_AI')}</a>
				</div>
			`;
				main_core.bind(content.infoLink, 'click', () => {
					const Helper = main_core.Reflection.getClass('top.BX.Helper');
					if (Helper) {
						Helper.show('redirect=detail&code=24409174');
					}
				});
				if (isMessageHaveCreateSiteButton) {
					main_core.bind(content.createSiteLink, 'click', () => {
						if (!this.messageInfo.params?.buttons || this.messageInfo.params.buttons.length === 0) {
							return;
						}
						this.chatInstance.addUserMessage({
							type: 'ButtonClicked',
							content: this.messageInfo.params?.buttons[0]?.text,
							params: {
								messageId: this.messageInfo.id,
								buttonId: this.messageInfo.params?.buttons[0]?.id
							}
						});
					});
				}
				this.$refs.content.innerHTML = '';
				main_core.Dom.append(content.root, this.$refs.content);
			}
		},
		watch: {
			disableAllActions() {
				this.renderContent();
			}
		},
		mounted() {
			this.renderContent();
		},
		template: `
		<CopilotChatMessageWelcome
			:avatar="avatar"
			:message="messageInfo"
		>
			<template #content>
				<div ref="content"></div>
			</template>
		</CopilotChatMessageWelcome>
	`
	};

	const CopilotChatMessageWelcomeFlows = {
		components: {
			CopilotChatMessageWelcome
		},
		props: {
			message: {
				type: Object,
				required: false
			},
			avatar: {
				type: String,
				required: false
			}
		},
		computed: {
			messageInfo() {
				return this.message;
			}
		},
		template: `
		<CopilotChatMessageWelcome
			:avatar="avatar"
			:message="messageInfo"
		/>
	`
	};

	const CopilotChatMessageColor = Object.freeze({
		USER: 'user',
		COPILOT: 'copilot',
		ERROR: 'error',
		USER_WITH_HIGHLIGHT_TEXT: 'userWithHighlightText'
	});

	const CopilotChatMessages = {
		components: {
			CopilotChatMessage,
			CopilotChatWelcomeMessage,
			CopilotChatMessageDefault,
			CopilotChatMessageWelcome,
			CopilotChatMessageSiteWithAi,
			CopilotChatMessageWelcomeFlows,
			CopilotChatMessagesDateGroup,
			CopilotChatMessagesAuthorGroup
		},
		emits: ['clickMessageButton', 'retry', 'remove'],
		props: {
			messages: {
				type: Array,
				required: false,
				default: () => []
			},
			copilotAvatar: String,
			userAvatar: String,
			copilotMessageTitle: {
				type: String,
				required: false,
				default: ''
			},
			userMessageMenuItems: {
				type: Array,
				required: false,
				default: () => []
			},
			copilotMessageMenuItems: {
				type: Array,
				required: false,
				default: () => []
			},
			welcomeMessageHtmlElement: HTMLElement
		},
		inject: ['observer'],
		directives: {
			CopilotChatNewMessageVisibilityObserver
		},
		computed: {
			messagesList() {
				return this.messages;
			},
			messagesGroupedByDayAndAuthor() {
				const groupsOfMessages = this.groupMessagesByDay(this.messagesList);
				const result = {};
				Object.entries(groupsOfMessages).forEach(([date, {
					messages,
					isNewMessagesStartHere
				}]) => {
					result[date] = this.groupMessagesByAuthor(messages, isNewMessagesStartHere);
				});
				return result;
			},
			sortedByDateMessagesGroups() {
				return Object.keys(this.messagesGroupedByDayAndAuthor).sort();
			}
		},
		methods: {
			groupMessagesByDay(messages) {
				let isMessagesContainsUnread = false;
				return messages.reduce((groupedMessages, message) => {
					const messageDeliveryDate = new Date(message.dateCreate);
					const messageIsoDate = this.formatISODate(messageDeliveryDate);
					if (groupedMessages[messageIsoDate] === undefined) {
						// eslint-disable-next-line no-param-reassign
						groupedMessages[messageIsoDate] = {
							messages: [],
							isNewMessagesStartHere: false
						};
					}
					if (message.viewed === false && isMessagesContainsUnread === false) {
						// eslint-disable-next-line no-param-reassign
						groupedMessages[messageIsoDate].isNewMessagesStartHere = true;
						isMessagesContainsUnread = true;
					}
					groupedMessages[messageIsoDate].messages.push(message);
					return groupedMessages;
				}, {});
			},
			groupMessagesByAuthor(messages, isNewMessagesStartHere) {
				let currentAuthor = -Infinity;
				let isNewMessagesLabelWasAdded = false;
				return messages.reduce((messagesGroupedByAuthor, message) => {
					if (message.viewed === false && isNewMessagesLabelWasAdded === false && isNewMessagesStartHere === true) {
						messagesGroupedByAuthor.push([message.authorId, [], true]);
						isNewMessagesLabelWasAdded = true;
					} else if (message.authorId !== currentAuthor) {
						messagesGroupedByAuthor.push([message.authorId, []]);
						currentAuthor = message.authorId;
					}
					messagesGroupedByAuthor.at(-1)[1].push(message);
					return messagesGroupedByAuthor;
				}, []);
			},
			getMessageMenuItems(message) {
				if (message.authorId === null || message.authorId === undefined) {
					return [];
				}
				return isMessageFromCopilot(message.authorId) ? this.copilotMessageMenuItems : this.userMessageMenuItems;
			},
			formatISODate(date) {
				const year = date.getFullYear();
				const month = (date.getMonth() + 1).toString().padStart(2, '0');
				const day = date.getDate().toString().padStart(2, '0');
				return `${year}-${month}-${day}`;
			},
			getMessageColor(message) {
				if (message.status === CopilotChatMessageStatus.ERROR) {
					return CopilotChatMessageColor.ERROR;
				}
				if (message.type === CopilotChatMessageType.SYSTEM) {
					return CopilotChatMessageColor.ERROR;
				}
				if (message.type === CopilotChatMessageType.BUTTON_CLICK_MESSAGE) {
					return CopilotChatMessageColor.USER_WITH_HIGHLIGHT_TEXT;
				}
				if (isMessageFromCopilot(message.authorId)) {
					return CopilotChatMessageColor.COPILOT;
				}
				return CopilotChatMessageColor.USER;
			},
			getMessageComponent(message) {
				switch (message.type) {
					case CopilotChatMessageType.DEFAULT:
						return CopilotChatMessageDefault;
					case CopilotChatMessageType.SYSTEM:
						return CopilotChatMessageDefault;
					case CopilotChatMessageType.WELCOME_FLOWS:
						return CopilotChatMessageWelcomeFlows;
					case CopilotChatMessageType.WELCOME_SITE_WITH_AI:
						return CopilotChatMessageSiteWithAi;
					default:
						return CopilotChatMessageDefault;
				}
			},
			getMessageTitle(authorId) {
				return this.isMessageFromCopilot(authorId) ? this.copilotMessageTitle : '';
			},
			getMessageAvatarByAuthorId(authorId) {
				return this.isMessageFromCopilot(authorId) ? this.copilotAvatar : this.userAvatar;
			},
			getAuthorMessagesGroupAvatar(authorId, messages) {
				const lastMessage = messages.at(-1);
				const isLastMessageIsWelcome = lastMessage.type !== 'Default' && lastMessage.type !== 'ButtonClicked' && lastMessage.type !== 'System';
				if (authorId === null || authorId === undefined || isLastMessageIsWelcome) {
					return null;
				}
				return this.getMessageAvatarByAuthorId(authorId);
			},
			isMessageFromCopilot(authorId) {
				return authorId < 1;
			},
			isMessageHaveButtons(message) {
				return message?.params?.buttons?.length > 0;
			},
			handleMessageButtonClick(messageId, buttonId) {
				this.$emit('clickMessageButton', {
					messageId,
					buttonId
				});
			},
			isLastMessage(message) {
				return message.id === this.messages.at(-1).id;
			},
			handleMessageRetry(messageId) {
				this.$emit('retry', messageId);
			},
			handleMessageRemove(messageId) {
				this.$emit('remove', messageId);
			}
		},
		mounted() {
			main_core.Dom.append(this.welcomeMessageHtmlElement, this.$refs.welcomeMessage);
		},
		template: `
		<div class="ai__copilot-chat-messages-wrapper">
			<CopilotChatMessagesDateGroup
			v-for="(date, dateGroupIndex) of sortedByDateMessagesGroups"
			:date="date"
			>
				<CopilotChatMessagesAuthorGroup
					v-for="([authorId, messagesFromCurrentAuthor, showNewMessagesLabel], authorGroupIndex) in messagesGroupedByDayAndAuthor[date]"
					:avatar="getAuthorMessagesGroupAvatar(authorId, messagesFromCurrentAuthor)"
					:show-new-messages-label="showNewMessagesLabel"
				>
					<ul class="ai__copilot-chat-messages">
						<li
							v-for="(message, index) of messagesFromCurrentAuthor"
							:key="message.id"
							class="ai__copilot-chat-messages_message-wrapper"
						>
							<component :is="getMessageComponent(message)" 
									v-copilot-chat-new-message-visibility-observer="message.viewed"
									@buttonClick="handleMessageButtonClick(message.id, $event)"
									@retry="handleMessageRetry" 
									@remove="handleMessageRemove"
									:message="message"
									:title="getMessageTitle(message.authorId)"
									:color="getMessageColor(message)"
									:avatar="getMessageAvatarByAuthorId(message.authorId)"
									:useAvatarTail="index === messagesFromCurrentAuthor.length - 1 && isMessageHaveButtons(message) === false"
									:disable-all-actions="isLastMessage(message) === false"
									:menu-items="getMessageMenuItems(message)"
							></component>
						</li>
					</ul>
				</CopilotChatMessagesAuthorGroup>
			</CopilotChatMessagesDateGroup>
		</div>
	`
	};

	const CopilotChatHistoryLoader = {
		props: {
			text: {
				type: String,
				required: false,
				default: main_core.Loc.getMessage('AI_COPILOT_CHAT_MESSAGES_HISTORY_LOADER_TEXT')
			}
		},
		beforeMount() {
			const color = getComputedStyle(document.body).getPropertyValue('--ui-color-base-02');
			this.loader = new main_loader.Loader({
				color,
				size: 60
			});
		},
		mounted() {
			this.loader.show(this.$refs.loaderContainer);
		},
		unmounted() {
			this.loader.hide();
			this.loader = null;
		},
		template: `
		<div class="ai__copilot-chat-history-loader">
			<div ref="loaderContainer" class="ai__copilot-chat-history-loader_animation-container"></div>
			<div class="ai__copilot-chat_history-loader_text">
				{{ text }}
			</div>
		</div>
	`
	};

	const CopilotChatWarningMessage = {
		name: 'CopilotWarningMessage',
		props: {
			articleCode: {
				type: String,
				required: true
			}
		},
		methods: {
			showArticle() {
				const Helper = main_core.Reflection.getClass('top.BX.Helper');
				const articleCode = this.articleCode;
				Helper?.show(`redirect=detail&code=${articleCode}`);
			},
			getCopilotName() {
				return main_core.Extension.getSettings('landing.copilot.chat').copilotName;
			}
		},
		mounted() {
			const warningMessage = main_core.Tag.render`<span>${this.$Bitrix.Loc.getMessage('AI_COPILOT_CHAT_ANSWER_WARNING_MSGVER_1', {
			'#LINK_START#': '<a ref="link" href="#">',
			'#LINK_END#': '</a>',
			'#COPILOT_NAME#': this.getCopilotName()
		})}</span>`;
			main_core.Event.bind(warningMessage.link, 'click', this.showArticle);
			main_core.Dom.append(warningMessage.root, this.$refs.container);
		},
		template: `
		<div
			ref="container"
			class="ai__copilot-chat-warning-message"
		></div>
	`
	};

	const CopilotChatLoadingBar = {
		name: 'LoadingBar',
		data() {
			return {};
		},
		template: `
		<div class="ai__copilot-chat-loading-bar"></div>
	`
	};

	const CopilotChatLoadHistoryError = {
		events: ['retryButtonClick'],
		methods: {
			loc(phraseCode) {
				return this.$Bitrix.Loc.getMessage(phraseCode);
			},
			handleClickOnRetryButton(event) {
				const target = event.target;
				target.blur();
				this.$emit('retryButtonClick');
			}
		},
		template: `
		<div class="ai__copilot-chat-load-history-error">
			<div class="ai__copilot-chat-load-history-error_icon-wrapper">
				<div class="ai__copilot-chat-load-history-error_icon"></div>
			</div>
			<div class="ai__copilot-chat-load-history-error_title">
				{{ loc('AI_COPILOT_CHAT_LOAD_HISTORY_ERROR_TITLE') }}
			</div>
			<div class="ai__copilot-chat-load-history-error_text">
				{{ loc('AI_COPILOT_CHAT_LOAD_HISTORY_ERROR_TEXT') }}
			</div>
			<button
				class="ai__copilot-chat-load-history-error_button"
				@click="handleClickOnRetryButton"
			>
				{{ loc('AI_COPILOT_CHAT_LOAD_HISTORY_ERROR_RETRY') }}
			</button>
		</div>
	`
	};

	const CopilotChat$1 = {
		name: 'CopilotChat',
		components: {
			CopilotChatHeader,
			CopilotChatMessages,
			CopilotChatInput,
			CopilotChatHistoryLoader,
			CopilotChatStatus,
			CopilotChatWarningMessage,
			CopilotChatLoadingBar,
			CopilotChatLoadHistoryError
		},
		props: {
			header: Object,
			welcomeMessageHtml: HTMLElement,
			botOptions: Object,
			scrollToTheEndAfterFirstShow: Object,
			slots: Object,
			isShowWarningMessage: {
				type: Object,
				required: false,
				default: () => ({
					value: false
				})
			},
			articleCode: {
				type: String,
				required: false,
				default: '20412666'
			},
			messages: Array,
			copilotChatInstance: Object,
			useInput: {
				type: Boolean,
				required: false,
				default: true
			},
			disableInput: Object,
			showLoader: Object,
			isOldMessagesLoading: Object,
			showCopilotWritingStatus: Object,
			status: Object,
			useStatus: Object,
			copilotMessageMenuItems: {
				type: Array,
				required: false,
				default: () => []
			},
			userAvatar: {
				type: Object,
				required: false
			},
			userMessageMenuItems: {
				type: Array,
				required: false,
				default: () => []
			},
			inputPlaceholder: {
				type: String,
				required: false,
				default: ''
			},
			loaderText: {
				type: String,
				required: false
			},
			isShowLoadHistoryError: {
				type: Object
			}
		},
		data() {
			return {
				isCopilotWriting: false,
				scrollPosition: 0,
				scrollHeight: 0
			};
		},
		provide() {
			return {
				instance: this.copilotChatInstance,
				observer: this.observer
			};
		},
		computed: {
			userPhoto() {
				return this.userAvatar?.value || '/bitrix/js/ui/icons/b24/images/ui-user.svg?v2';
			},
			isInputDisabled() {
				return this.disableInput.value === true;
			},
			isLoaderShown() {
				return this.showLoader.value === true;
			},
			isLoadingOldMessages() {
				return this.isOldMessagesLoading?.value === true;
			},
			isWarningMessageShown() {
				return this.isShowWarningMessage?.value === true;
			},
			instance() {
				return this.copilotChatInstance;
			},
			Slot() {
				return {
					...this.slots
				};
			},
			headerProps() {
				return {
					title: this.header?.title,
					subtitle: this.header?.subtitle,
					avatar: this.header?.avatar,
					useCloseIcon: this.header?.useCloseIcon,
					menu: this.header?.menu
				};
			},
			botData() {
				return {
					messageTitle: this.botOptions.messageTitle,
					avatar: this.botOptions.avatar,
					messageMenuItems: this.botOptions?.messageMenuItems ?? []
				};
			},
			messagesList() {
				return this.messages;
			},
			haveNewMessages() {
				return this.messagesList.some(message => message.viewed === false);
			},
			copilotChatStatus() {
				return this.status.value;
			},
			isChatStatusUsed() {
				return this.useStatus.value;
			},
			isScrollToTheEndAfterMounted() {
				return this.scrollToTheEndAfterFirstShow.value;
			}
		},
		methods: {
			hideChat() {
				this.copilotChatInstance.hide();
			},
			async handleSubmitMessage(userMessage) {
				const newMessage = {
					content: userMessage
				};
				this.instance.addUserMessage(newMessage);
			},
			scrollMessagesListAfterOpen() {
				if (this.haveNewMessages) {
					const newMessagesLabel = this.$refs.main.querySelector(`.${containerClassname}`);
					newMessagesLabel?.scrollIntoView();
				} else {
					this.scrollMessagesListToTheEnd();
				}
			},
			scrollMessagesListToTheEnd(isSmooth = false) {
				this.$refs.main.scrollTo({
					left: 0,
					top: 9999,
					behavior: isSmooth ? 'smooth' : 'auto'
				});
			},
			handleClickOnMessageButton(eventData) {
				this.instance.emitClickOnMessageButton({
					messageId: eventData.messageId,
					buttonId: eventData.buttonId
				});
			},
			handleAddNewUserMessage() {
				requestAnimationFrame(() => {
					this.scrollMessagesListToTheEnd(true);
				});
			},
			restoreScrollPosition() {
				this.scrollPosition = this.$refs.main.scrollTop;
				this.scrollHeight = this.$refs.main.scrollHeight;
				requestAnimationFrame(() => {
					this.$refs.main.scrollTop = this.$refs.main.scrollHeight - this.scrollHeight + this.scrollPosition;
				});
			},
			handleRetryMessage(messageId) {
				this.instance.emit(CopilotChatEvents.RETRY_SEND_MESSAGE, {
					messageId
				});
			},
			handleRemoveMessage(messageId) {
				this.instance.emit(CopilotChatEvents.REMOVE_MESSAGE, {
					messageId
				});
			},
			handleRetryLoadHistoryButtonClick() {
				this.instance.emitRetryLoadHistory();
			}
		},
		beforeCreate() {
			this.observer = new NewMessagesVisibilityObserver();
			this.observer.subscribe(NewMessagesVisibilityObserverEvents.VIEW_NEW_MESSAGE, event => {
				this.instance.setNewMessageIsViewed(event.getData().id);
			});
		},
		mounted() {
			this.observer.setRoot(this.$refs.main);
			this.observer.init();
			this.instance.subscribe(CopilotChatEvents.ADD_USER_MESSAGE, this.handleAddNewUserMessage);
			requestAnimationFrame(() => {
				if (this.isScrollToTheEndAfterMounted) {
					this.scrollMessagesListAfterOpen();
				}
			});
			main_core.bind(this.$refs.main, 'scroll', event => {
				const scrollElement = event.target;
				if (scrollElement.scrollTop / scrollElement.scrollHeight < 0.05) {
					this.instance.emit(CopilotChatEvents.MESSAGES_SCROLL_TOP);
				}
			});
		},
		beforeUnmount() {
			this.instance.unsubscribe(CopilotChatEvents.ADD_USER_MESSAGE, this.handleAddNewUserMessage);
		},
		watch: {
			isLoaderShown(newValue, oldValue) {
				if (newValue === false && oldValue === true) {
					requestAnimationFrame(() => {
						this.scrollMessagesListToTheEnd();
					});
				}
			},
			'messagesList.length': function (newMessagesCount, oldMessagesCount) {
				if (newMessagesCount - oldMessagesCount === 1) {
					requestAnimationFrame(() => {
						this.scrollMessagesListToTheEnd(true);
					});
				}
				if (oldMessagesCount > 1 && newMessagesCount > 1) {
					this.restoreScrollPosition();
				}
				requestAnimationFrame(() => {
					if (oldMessagesCount === 0 && newMessagesCount > 1 && this.isScrollToTheEndAfterMounted) {
						this.scrollMessagesListToTheEnd();
					}
				});
			}
		},
		template: `
		<div class="ai__copilot-chat">
			<header class="ai__copilot-chat_header">
				<CopilotChatHeader
					:title="headerProps.title"
					:subtitle="headerProps.subtitle"
					:avatar="headerProps.avatar"
					:use-close-icon="headerProps.useCloseIcon"
					:menu="headerProps.menu"
					@clickOnCloseIcon="hideChat"
				/>
				<div class="ai__copilot-chat_loading-bar" v-if="isLoadingOldMessages">
					<CopilotChatLoadingBar />
				</div>
			</header>
			<main ref="main" class="ai__copilot-chat_main">
				<TransitionGroup name="main">
				<div
					v-if="isLoaderShown"
					class="ai__copilot-chat_main-loader-container"
				>
					<slot name="loader">
						<CopilotChatHistoryLoader :text="loaderText" />
					</slot>
				</div>
				<div
					v-else-if="isShowLoadHistoryError.value"
					class="ai__copilot-chat_load-history-error"
				>
					<slot name="loaderError">
						<CopilotChatLoadHistoryError @retryButtonClick="handleRetryLoadHistoryButtonClick" />
					</slot>
				</div>
					<CopilotChatMessages
						v-else
						@clickMessageButton="handleClickOnMessageButton"
						@retry="handleRetryMessage"
						@remove="handleRemoveMessage"
						:user-avatar="userPhoto"
						:copilot-avatar="botData.avatar"
						:messages="messagesList"
						:welcome-message-html-element="welcomeMessageHtml"
						:copilot-message-title="botData.messageTitle"
						:copilot-message-menu-items="botData.messageMenuItems"
						:user-message-menu-items="userMessageMenuItems"
					></CopilotChatMessages>
				</TransitionGroup>
				<CopilotChatStatus
					v-if="isLoaderShown === false && isChatStatusUsed"
					:status="copilotChatStatus"
				/>
				<div id="anchor"></div>
			</main>
			<footer class="ai__copilot-chat_footer">
				<CopilotChatInput
					v-if="useInput"
					:disabled="isInputDisabled"
					:placeholder="inputPlaceholder"
					@submit="handleSubmitMessage"
				/>
				<div
					v-if="isWarningMessageShown"
					class="ai__copilot-chat_warning-message"
				>
					<CopilotChatWarningMessage :article-code="articleCode" />
				</div>
			</footer>
		</div>
	`
	};

	const CopilotChatEvents = Object.freeze({
		ADD_USER_MESSAGE: 'addUserMessage',
		ADD_BOT_MESSAGE: 'addBotMessage',
		ADD_OLD_MESSAGES: 'addBotMessage',
		ADD_NEW_MESSAGES: 'addMessages',
		CLICK_ON_MESSAGE_BUTTON: 'clickOnMessageButton',
		VIEW_NEW_MESSAGE: 'viewMessage',
		SHOW_LOADER: 'showLoader',
		HIDE_LOADER: 'hideLoader',
		SHOW_COPILOT_WRITING_LOADER: 'showCopilotWritingLoader',
		HIDE_COPILOT_WRITING_LOADER: 'hideCopilotWritingLoader',
		DISABLE_INPUT_FIELD: 'disableInputField',
		ENABLE_INPUT_FIELD: 'enableInputField',
		SET_MESSAGE_STATUS: 'setMessageStatus',
		SHOW_ERROR_SCREEN: 'showErrorScreen',
		HIDE_ERROR_SCREEN: 'hideErrorScreen',
		MESSAGES_SCROLL_TOP: 'messagesListScrollTop',
		RETRY_SEND_MESSAGE: 'retrySendMessage',
		REMOVE_MESSAGE: 'removeMessage',
		RETRY_LOAD_HISTORY: 'retryLoadHistory'
	});
	const CopilotChatMessageStatus = {
		DEPART: 'depart',
		SENT: 'sent',
		DELIVERED: 'delivered',
		ERROR: 'error'
	};
	class CopilotChat extends main_core_events.EventEmitter {
		#copilotChatOptions;
		#popupOptions;
		#popup;
		#app;
		#messages;
		#isShowLoader;
		#isOldMessagesLoading;
		#isInputDisabled;
		#chatStatus;
		#useChatStatus;
		#copilotMessageMenuItems;
		#userMessageMenuItems;
		#scrollToTheEndAfterFirstShow;
		#showCopilotWarningMessage;
		#copilotChatBotOptions;
		#userAvatar;
		#inputPlaceholder;
		#loaderText;
		#isShowLoadHistoryError;
		constructor(options = {}) {
			super(options);
			this.setEventNamespace('AI.CopilotChat');
			this.#copilotChatOptions = options || {};
			this.#copilotChatBotOptions = ui_vue3.ref(options?.botOptions ?? {});
			this.#popupOptions = options?.popupOptions || {};
			this.#messages = ui_vue3.ref([]);
			this.#copilotMessageMenuItems = ui_vue3.ref(main_core.Type.isArray(options.botOptions.messageMenuItems) ? options.botOptions.messageMenuItems : []);
			this.#userMessageMenuItems = ui_vue3.ref(main_core.Type.isArray(options.userMessageMenuItems) ? options.userMessageMenuItems : []);
			this.#isShowLoader = ui_vue3.ref(false);
			this.#isInputDisabled = ui_vue3.ref(false);
			this.#chatStatus = ui_vue3.ref(Status.NONE);
			this.#useChatStatus = ui_vue3.ref(main_core.Type.isBoolean(options.useChatStatus) ? options.useChatStatus : true);
			this.#scrollToTheEndAfterFirstShow = ui_vue3.ref(main_core.Type.isBoolean(options.scrollToTheEndAfterFirstShow) ? options.scrollToTheEndAfterFirstShow : true);
			this.#isOldMessagesLoading = ui_vue3.ref(false);
			this.#showCopilotWarningMessage = ui_vue3.ref(options.showCopilotWarningMessage === true);
			this.#isShowLoadHistoryError = ui_vue3.ref(false);
			this.#userAvatar = ui_vue3.ref(options.userAvatar ?? '');
			this.#inputPlaceholder = options.inputPlaceholder ?? main_core.Loc.getMessage('AI_COPILOT_CHAT_INPUT_PLACEHOLDER');
			this.#loaderText = options.loaderText;
		}
		static getDefaultMinWidth() {
			return 375;
		}
		static getDefaultHeight() {
			return 669;
		}
		startLoadingOldMessages() {
			this.#isOldMessagesLoading.value = true;
		}
		finishLoadingOldMessages() {
			this.#isOldMessagesLoading.value = false;
		}
		isOldMessagesLoading() {
			return this.#isOldMessagesLoading.value;
		}
		isMessageInList(messageId) {
			return this.#messages.value.findLast(message => {
				return message.id === messageId;
			});
		}
		getFirstMessageId() {
			return this.#messages.value[0]?.id;
		}
		getMessageById(messageId) {
			return this.#messages.value.find(message => message.id === messageId);
		}
		removeMessage(messageId) {
			const removedMessageIndex = this.#messages.value.findIndex(message => message.id === messageId);
			this.#messages.value.splice(removedMessageIndex, 1);
		}
		unshiftMessages(messages) {
			const messagesWithStatus = messages.map(message => {
				return {
					...message,
					status: CopilotChatMessageStatus.DELIVERED
				};
			});
			this.#messages.value.unshift(...messagesWithStatus);
		}
		addUserMessage(message, emitEvent = true) {
			const newUserMessage = {
				type: 'Default',
				...message,
				authorId: 1,
				status: message.status ?? CopilotChatMessageStatus.DEPART
			};
			this.#addNewMessage(newUserMessage, emitEvent);
		}
		addBotMessage(message, emitEvent = true) {
			const newUserMessage = {
				type: 'Default',
				...message,
				authorId: 0,
				status: null
			};
			this.#addNewMessage(newUserMessage, emitEvent);
		}
		addSystemMessage(message, emitEvent = true) {
			const newSystemMessage = {
				...message,
				authorId: null,
				status: null
			};
			this.#addNewMessage(newSystemMessage, emitEvent);
		}
		enableInput() {
			this.#isInputDisabled.value = false;
			this.emit(CopilotChatEvents.ENABLE_INPUT_FIELD);
		}
		disableInput() {
			this.#isInputDisabled.value = true;
			this.emit(CopilotChatEvents.DISABLE_INPUT_FIELD);
		}
		showLoader() {
			this.#isShowLoader.value = true;
			this.emit(CopilotChatEvents.SHOW_LOADER);
		}
		hideLoader() {
			this.#isShowLoader.value = false;
			this.emit(CopilotChatEvents.HIDE_LOADER);
		}
		setMessageStatusDepart(messageId) {
			this.#setMessageStatus(messageId, CopilotChatMessageStatus.DEPART);
		}
		setMessageStatusDelivered(messageId) {
			this.#setMessageStatus(messageId, CopilotChatMessageStatus.DELIVERED);
		}
		setMessageStatusSent(messageId) {
			this.#setMessageStatus(messageId, CopilotChatMessageStatus.SENT);
		}
		setMessageStatusError(messageId) {
			this.#setMessageStatus(messageId, CopilotChatMessageStatus.ERROR);
		}
		setCopilotWritingStatus(value) {
			if (value === true) {
				this.#chatStatus.value = Status.COPILOT_WRITING;
			} else {
				this.#chatStatus.value = Status.NONE;
			}
		}
		setNewMessageIsViewed(messageId) {
			this.emit(CopilotChatEvents.VIEW_NEW_MESSAGE, new main_core_events.BaseEvent({
				data: {
					id: messageId
				}
			}));
		}
		setMessageId(messageId, newMessageId) {
			const message = this.#messages.value.find(currentMessage => currentMessage.id === messageId);
			if (!message) {
				return;
			}
			message.id = newMessageId;
		}
		setMessageDate(messageId, date) {
			const message = this.#messages.value.find(currentMessage => currentMessage.id === messageId);
			if (!message) {
				return;
			}
			message.dateCreate = date;
		}
		emitClickOnMessageButton(data) {
			const {
				buttonId,
				messageId
			} = data;
			const clickedMessageButton = this.#findMessageButton(messageId, buttonId);
			clickedMessageButton.isSelected = true;
			this.emit(CopilotChatEvents.CLICK_ON_MESSAGE_BUTTON, {
				messageId,
				button: {
					...clickedMessageButton
				}
			});
		}
		emitRetryLoadHistory() {
			this.emit(CopilotChatEvents.RETRY_LOAD_HISTORY);
		}
		#findMessageButton(messageId, buttonId) {
			const searchedMessage = this.#messages.value.find(message => message.id === messageId);
			if (main_core.Type.isArray(searchedMessage.params?.buttons) === false) {
				return null;
			}
			return searchedMessage.params.buttons.find(button => button.id === buttonId) ?? null;
		}
		#setMessageStatus(messageId, status) {
			const message = this.#messages.value.find(currentMessage => currentMessage.id === messageId);
			if (!message) {
				return;
			}
			message.status = status;
			this.emit(CopilotChatEvents.SET_MESSAGE_STATUS, {
				messageId,
				status
			});
		}
		#addNewMessage(message, emitEvent = true) {
			const newMessageId = Math.round(-Math.random() * 1000);
			const isCopilotChatShown = this.isShown();
			const newMessage = {
				id: newMessageId,
				dateCreate: new Date().toISOString(),
				status: CopilotChatMessageStatus.DEPART,
				authorId: 0,
				...message,
				viewed: message?.viewed ?? isCopilotChatShown
			};
			this.#messages.value.push(newMessage);
			if (emitEvent === false) {
				return;
			}
			if (newMessage.authorId === 0) {
				this.emit(CopilotChatEvents.ADD_BOT_MESSAGE, {
					message: newMessage
				});
			} else {
				this.emit(CopilotChatEvents.ADD_USER_MESSAGE, {
					message: newMessage
				});
			}
		}
		show() {
			if (!this.#popup) {
				this.#initPopup();
			}
			this.#popup.show();
		}
		hide() {
			this.#popup?.close();
		}
		isShown() {
			return Boolean(this.#popup?.isShown());
		}
		adjustPosition() {
			this.#popup?.adjustPosition({
				forceBindPosition: true
			});
		}
		setUserAvatar(avatar) {
			this.#userAvatar.value = avatar;
		}
		showLoadHistoryError() {
			this.#isShowLoadHistoryError.value = true;
		}
		hideLoadHistoryError() {
			this.#isShowLoadHistoryError.value = false;
		}
		#initPopup() {
			const adjustPopupPosition = this.adjustPosition.bind(this);
			main_core.bind(window, 'resize', adjustPopupPosition);
			this.#popup = new main_popup.Popup({
				...this.#popupOptions,
				content: this.#renderPopupContent(),
				minWidth: this.#popupOptions?.minWidth ?? CopilotChat.getDefaultMinWidth(),
				height: this.#popupOptions?.height ?? CopilotChat.getDefaultHeight(),
				contentNoPaddings: true,
				padding: 0,
				borderRadius: '16px',
				className: `ai__copilot-chat-popup ${this.#popupOptions.className ?? ''}`,
				cacheable: this.#popupOptions?.cacheable ?? false,
				events: {
					onPopupAfterClose: () => {
						this.#popup = null;
						this.#app.unmount();
						if (main_core.Type.isFunction(this.#popupOptions?.events?.onPopupAfterClose)) {
							this.#popupOptions?.events?.onPopupAfterClose();
						}
						main_core.unbind(window, 'resize', adjustPopupPosition);
					},
					...this.#popupOptions.events
				}
			});
			return this.#popup;
		}
		#renderPopupContent() {
			const appContainer = main_core.Tag.render`<div class="ai__copilot-chat-popup-content"></div>`;
			this.#app = ui_vue3.BitrixVue.createApp({
				name: 'CopilotChatPopup',
				components: {
					CopilotChat: CopilotChat$1,
					...this.#copilotChatOptions?.vueComponents
				},
				template: `
				<CopilotChat>
					<template v-slot:loader>
						${this.#copilotChatOptions.slots?.LOADER ?? ''}
					</template>
					<template v-slot:loaderError>
						${this.#copilotChatOptions.slots?.LOADER_ERROR ?? ''}
					</template>
				</CopilotChat>
			`
			}, {
				...this.#copilotChatOptions,
				messages: this.#messages.value,
				copilotChatInstance: this,
				showLoader: this.#isShowLoader,
				disableInput: this.#isInputDisabled,
				status: this.#chatStatus,
				useStatus: this.#useChatStatus,
				scrollToTheEndAfterFirstShow: this.#scrollToTheEndAfterFirstShow,
				copilotMessageMenuItems: this.#copilotMessageMenuItems.value,
				userMessageMenuItems: this.#userMessageMenuItems.value,
				isShowWarningMessage: this.#showCopilotWarningMessage,
				botOptions: this.#copilotChatBotOptions.value,
				userAvatar: this.#userAvatar,
				inputPlaceholder: this.#inputPlaceholder,
				loaderText: this.#loaderText,
				isOldMessagesLoading: this.#isOldMessagesLoading,
				isShowLoadHistoryError: this.#isShowLoadHistoryError
			});
			this.#app.mount(appContainer);
			return appContainer;
		}
	}

	exports.CopilotChat = CopilotChat;
	exports.CopilotChatEvents = CopilotChatEvents;
	exports.CopilotChatMessageStatus = CopilotChatMessageStatus;
	exports.CopilotChatMessageType = CopilotChatMessageType;

})(this.BX.AI.CopilotChat.UI = this.BX.AI.CopilotChat.UI || {}, BX, BX.Event, BX.Main, BX.Vue3, BX.UI.IconSet, window, BX.AI, BX.UI.IconSet, window, BX.Main, BX.UI.BBCode.Formatter, BX, BX);
//# sourceMappingURL=copilot-chat.bundle.js.map
