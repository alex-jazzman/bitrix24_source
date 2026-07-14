/* eslint-disable */
this.BX = this.BX || {};
this.BX.Messenger = this.BX.Messenger || {};
this.BX.Messenger.v2 = this.BX.Messenger.v2 || {};
this.BX.Messenger.v2.Component = this.BX.Messenger.v2.Component || {};
(function (exports, im_v2_const, im_public, im_v2_provider_service_sending, im_v2_lib_phone, im_v2_lib_notifier, im_v2_application_core, main_core, im_v2_lib_logger) {
	'use strict';

	class ActionManager {
		#dialogId;
		#emitter;
		#actionHandlers = {
			[im_v2_const.KeyboardButtonAction.send]: this.#sendMessage.bind(this),
			[im_v2_const.KeyboardButtonAction.put]: this.#insertText.bind(this),
			[im_v2_const.KeyboardButtonAction.call]: this.#startCall.bind(this),
			[im_v2_const.KeyboardButtonAction.copy]: this.#copyText.bind(this),
			[im_v2_const.KeyboardButtonAction.dialog]: this.#openChat.bind(this)
		};
		constructor(payload) {
			const {
				dialogId,
				context: {
					emitter
				}
			} = payload;
			this.#dialogId = dialogId;
			this.#emitter = emitter;
		}
		handleAction(event) {
			const {
				action,
				payload
			} = event;
			if (!this.#actionHandlers[action]) {
				// eslint-disable-next-line no-console
				console.error('Keyboard: action not found');
			}
			this.#actionHandlers[action](payload);
		}
		#sendMessage(payload) {
			im_v2_provider_service_sending.SendingService.getInstance().sendMessage({
				text: payload,
				dialogId: this.#dialogId
			});
		}
		#insertText(payload) {
			this.#emitter.emit(im_v2_const.EventType.textarea.insertText, {
				text: payload,
				dialogId: this.#dialogId
			});
		}
		#startCall(payload) {
			void im_v2_lib_phone.PhoneManager.getInstance().startCall(payload);
		}
		#copyText(payload) {
			if (BX.clipboard?.copy(payload)) {
				im_v2_lib_notifier.Notifier.onCopyTextComplete();
			}
		}
		#openChat(payload) {
			void im_public.Messenger.openChat(payload);
		}
	}

	class BotService {
		#messageId;
		#dialogId;
		constructor(params) {
			const {
				messageId,
				dialogId
			} = params;
			this.#messageId = messageId;
			this.#dialogId = dialogId;
		}
		sendCommand(event) {
			const {
				botId,
				command,
				payload
			} = event;
			const queryParams = {
				MESSAGE_ID: this.#messageId,
				DIALOG_ID: this.#dialogId,
				BOT_ID: botId,
				COMMAND: command,
				COMMAND_PARAMS: payload
			};
			im_v2_application_core.Core.getRestClient().callMethod(im_v2_const.RestMethod.imMessageCommand, queryParams).catch(result => {
				console.error('BotService: error sending command:', result.error());
			});
		}
	}

	// @vue/component
	const KeyboardButton = {
		name: 'KeyboardButton',
		props: {
			config: {
				type: Object,
				required: true
			},
			keyboardBlocked: {
				type: Boolean,
				required: true
			}
		},
		emits: ['action', 'customCommand', 'blockKeyboard'],
		data() {
			return {};
		},
		computed: {
			button() {
				return this.config;
			},
			isAiAssistant() {
				return this.button.bgColorToken === im_v2_const.ColorToken.aiAssistant;
			},
			commonAttributes() {
				const attrs = {
					class: ['bx-im-keyboard-button__container', this.buttonClasses],
					style: this.buttonStyles
				};
				if (this.isAiAssistant) {
					attrs['data-text'] = this.button.text;
					attrs.title = this.button.text;
				}
				return attrs;
			},
			buttonClasses() {
				const {
					bgColorToken = im_v2_const.ColorToken.base,
					display,
					disabled,
					wait
				} = this.button;
				const displayClass = display === im_v2_const.KeyboardButtonDisplay.block ? '--block' : '--line';
				const classes = [displayClass, bgColorToken];
				if (this.keyboardBlocked || disabled) {
					classes.push('--disabled');
				}
				if (wait) {
					classes.push('--loading');
				}
				return classes;
			},
			buttonStyles() {
				const styles = {};
				const {
					width
				} = this.button;
				if (width) {
					styles.width = `${width}px`;
				}
				return styles;
			},
			preparedLink() {
				if (!this.button.link) {
					return '';
				}
				return main_core.Text.decode(this.button.link);
			}
		},
		methods: {
			onClick(event) {
				if (this.keyboardBlocked || this.button.disabled || this.button.wait) {
					event.preventDefault();
					return;
				}

				// proceed with native link handling
				if (this.button.link) {
					return;
				}
				if (this.button.action && this.button.actionValue) {
					this.handleAction();
				} else if (this.button.appId) {
					im_v2_lib_logger.Logger.warn('Messenger keyboard: open app is not implemented.');
				} else if (this.button.command) {
					this.handleCustomCommand();
				}
			},
			handleAction() {
				this.$emit('action', {
					action: this.button.action,
					payload: this.button.actionValue
				});
			},
			handleCustomCommand() {
				if (this.button.block) {
					this.$emit('blockKeyboard');
				}
				this.button.wait = true;
				this.$emit('customCommand', {
					botId: this.button.botId,
					command: this.button.command,
					payload: this.button.commandParams
				});
			}
		},
		template: `
		<a
			v-if="button.link"
			:href="preparedLink"
			target="_blank"
			v-bind="commonAttributes"
			@click="onClick"
		>
			{{ button.text }}
		</a>
		<div
			v-else
			v-bind="commonAttributes"
			@click="onClick"
		>
			{{ button.text }}
		</div>
	`
	};

	// @vue/component
	const KeyboardSeparator = {
		name: 'KeyboardSeparator',
		data() {
			return {};
		},
		template: `
		<div class="bx-im-keyboard-button__separator"></div>
	`
	};

	const Keyboard = {
		props: {
			buttons: {
				type: Array,
				required: true
			},
			dialogId: {
				type: String,
				required: true
			},
			messageId: {
				type: [Number, String],
				required: true
			}
		},
		components: {
			KeyboardButton,
			KeyboardSeparator
		},
		data() {
			return {
				keyboardBlocked: false
			};
		},
		emits: ['click'],
		watch: {
			buttons() {
				this.keyboardBlocked = false;
			}
		},
		computed: {
			ButtonType: () => im_v2_const.KeyboardButtonType,
			preparedButtons() {
				return this.buttons.filter(button => {
					return button.context !== im_v2_const.KeyboardButtonContext.mobile;
				});
			}
		},
		methods: {
			onButtonActionClick(event) {
				this.getActionManager().handleAction(event);
			},
			onButtonCustomCommandClick(event) {
				this.getBotService().sendCommand(event);
			},
			getActionManager() {
				if (!this.actionManager) {
					this.actionManager = new ActionManager({
						dialogId: this.dialogId,
						context: {
							emitter: this.getEmitter()
						}
					});
				}
				return this.actionManager;
			},
			getBotService() {
				if (!this.botService) {
					this.botService = new BotService({
						messageId: this.messageId,
						dialogId: this.dialogId
					});
				}
				return this.botService;
			},
			getEmitter() {
				return this.$Bitrix.eventEmitter;
			}
		},
		template: `
		<div class="bx-im-keyboard__container">
			<template v-for="button in preparedButtons">
				<KeyboardButton
					v-if="button.type === ButtonType.button"
					:config="button"
					:keyboardBlocked="keyboardBlocked"
					@blockKeyboard="keyboardBlocked = true"
					@action="onButtonActionClick"
					@customCommand="onButtonCustomCommandClick"
				/>
				<KeyboardSeparator v-else-if="button.type === ButtonType.newLine" />
			</template>
		</div>
	`
	};

	exports.Keyboard = Keyboard;

})(this.BX.Messenger.v2.Component.Elements = this.BX.Messenger.v2.Component.Elements || {}, BX.Messenger.v2.Const, BX.Messenger.v2.Lib, BX.Messenger.v2.Service, BX.Messenger.v2.Lib, BX.Messenger.v2.Lib, BX.Messenger.v2.Application, BX, BX.Messenger.v2.Lib);
//# sourceMappingURL=keyboard.bundle.js.map
