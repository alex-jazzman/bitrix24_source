/* eslint-disable */
this.BX = this.BX || {};
this.BX.Messenger = this.BX.Messenger || {};
this.BX.Messenger.v2 = this.BX.Messenger.v2 || {};
this.BX.Messenger.v2.Component = this.BX.Messenger.v2.Component || {};
(function (exports, im_v2_lib_feature, main_core, im_v2_component_message_base, im_v2_component_message_elements, im_v2_lib_copilot, im_v2_lib_helpdesk, im_v2_lib_notifier, im_v2_lib_parser, im_v2_lib_utils, ui_iconSet_api_vue, im_v2_const, im_v2_application_core, im_v2_lib_feedback, im_v2_lib_logger, im_v2_lib_rest) {
	'use strict';

	// @vue/component
	const CopilotMessageLegacy = {
		name: 'CopilotMessageLegacy',
		components: {
			AuthorTitle: im_v2_component_message_elements.AuthorTitle,
			BaseMessage: im_v2_component_message_base.BaseMessage,
			ReactionList: im_v2_component_message_elements.ReactionList,
			MessageStatus: im_v2_component_message_elements.MessageStatus,
			TextContent: im_v2_component_message_elements.TextContent
		},
		props: {
			item: {
				type: Object,
				required: true
			},
			dialogId: {
				type: String,
				required: true
			},
			withTitle: {
				type: Boolean,
				default: true
			}
		},
		computed: {
			message() {
				return this.item;
			},
			formattedText() {
				return im_v2_lib_parser.Parser.decodeMessage(this.item);
			},
			canSetReactions() {
				return main_core.Type.isNumber(this.message.id);
			},
			isError() {
				return this.message.componentParams?.copilotError === true;
			},
			warningText() {
				return this.loc('IM_MESSAGE_COPILOT_ANSWER_WARNING_MSGVER_1', {
					'#LINK_START#': '<a class="bx-im-message-copilot-answer__warning_more">',
					'#LINK_END#': '</a>',
					'#COPILOT_NAME#': this.copilotManager.getName()
				});
			}
		},
		created() {
			this.copilotManager = new im_v2_lib_copilot.CopilotManager();
		},
		methods: {
			async onCopyClick() {
				await im_v2_lib_utils.Utils.text.copyToClipboard(this.message.text);
				im_v2_lib_notifier.Notifier.onCopyTextComplete();
			},
			onWarningDetailsClick(event) {
				if (!main_core.Dom.hasClass(event.target, 'bx-im-message-copilot-answer__warning_more')) {
					return;
				}
				const ARTICLE_CODE = '20412666';
				im_v2_lib_helpdesk.openHelpdeskArticle(ARTICLE_CODE);
			},
			loc(phraseCode, replacements = {}) {
				return this.$Bitrix.Loc.getMessage(phraseCode, replacements);
			}
		},
		template: `
		<BaseMessage :item="item" :dialogId="dialogId" class="bx-im-message-copilot-base-message__container">
			<div class="bx-im-message-default__container bx-im-message-copilot-answer__container" :class="{'--error': isError}">
				<AuthorTitle v-if="withTitle" :item="item" />
				<div class="bx-im-message-default-content__container bx-im-message-default-content__scope">
					<TextContent :text="formattedText" />
					<ReactionList
						v-if="canSetReactions"
						:messageId="message.id"
						class="bx-im-message-default-content__reaction-list"
					/>
					<div v-if="isError" class="bx-im-message-default-content__bottom-panel">
						<div class="bx-im-message-default-content__status-container">
							<MessageStatus :item="message" />
						</div>
					</div>
				</div>
			</div>
			<div v-if="!isError" class="bx-im-message-copilot-answer__bottom-panel">
				<div class="bx-im-message-copilot-answer__panel-content">
					<button
						:title="loc('IM_MESSAGE_COPILOT_ANSWER_ACTION_COPY')"
						@click="onCopyClick"
						class="bx-im-message-copilot-answer__copy_icon"
					></button>
					<span
						v-html="warningText"
						@click="onWarningDetailsClick"
						class="bx-im-message-copilot-answer__warning"
					></span>
				</div>
				<div class="bx-im-message-default-content__status-container">
					<MessageStatus :item="message" />
				</div>
			</div>
		</BaseMessage>
	`
	};

	const VoteValue = {
		like: 'like',
		dislike: 'dislike'
	};

	class VoteService {
		async send(messageId, value) {
			im_v2_lib_logger.Logger.log('VoteService: send', messageId, value);
			await im_v2_lib_rest.runAction(im_v2_const.RestMethod.imV2ChatMessageVoteSend, {
				data: {
					messageId,
					value
				}
			});
		}
	}

	class VoteManager {
		#store;
		#service;
		#feedbackManager;
		constructor() {
			this.#store = im_v2_application_core.Core.getStore();
			this.#service = new VoteService();
			this.#feedbackManager = new im_v2_lib_feedback.FeedbackManager();
		}
		getValue(messageId) {
			return this.#store.getters['copilot/votes/getValue'](messageId);
		}
		async vote(messageId, value, context) {
			if (!VoteValue[value]) {
				return;
			}
			const previousValue = this.getValue(messageId);
			if (previousValue === value) {
				return;
			}
			this.#setVote(messageId, value);
			if (value === VoteValue.dislike && context) {
				this.#openFeedbackForm(messageId, context);
			}
			try {
				await this.#service.send(messageId, value);
			} catch (errors) {
				if (main_core.Type.isNil(previousValue)) {
					this.#deleteVote(messageId);
				} else {
					this.#setVote(messageId, previousValue);
				}
				im_v2_lib_notifier.Notifier.onDefaultError();
				console.error('VoteManager: vote failed', errors);
			}
		}
		#setVote(messageId, value) {
			void this.#store.dispatch('copilot/votes/set', {
				messageId,
				value
			});
		}
		#deleteVote(messageId) {
			void this.#store.dispatch('copilot/votes/delete', messageId);
		}
		#openFeedbackForm(messageId, context) {
			const chat = this.#store.getters['chats/get'](context.dialogId);
			const message = this.#store.getters['messages/getById'](messageId);
			const userCounter = chat?.userCounter ?? 0;
			void this.#feedbackManager.openCopilotForm({
				userCounter,
				message
			});
		}
	}

	// @vue/component
	const PanelButton = {
		name: 'PanelButton',
		components: {
			BIcon: ui_iconSet_api_vue.BIcon
		},
		props: {
			name: {
				type: String,
				required: true
			},
			title: {
				type: String,
				default: ''
			},
			active: {
				type: Boolean,
				default: false
			},
			disabled: {
				type: Boolean,
				default: false
			}
		},
		emits: ['click'],
		methods: {
			onClick() {
				if (this.disabled) {
					return;
				}
				this.$emit('click');
			}
		},
		template: `
		<BIcon
			class="bx-im-message-ai-assistant-v2-answer__action-icon"
			:class="{ '--active': active }"
			:name="name"
			:hoverable="!disabled"
			:title="title"
			@click="onClick"
		/>
	`
	};

	// @vue/component
	const BottomPanel = {
		name: 'BottomPanel',
		components: {
			PanelButton,
			MessageStatus: im_v2_component_message_elements.MessageStatus
		},
		props: {
			message: {
				type: Object,
				required: true
			},
			dialogId: {
				type: String,
				required: true
			}
		},
		emits: ['regenerate'],
		data() {
			return {
				isVoteSending: false
			};
		},
		computed: {
			isFeedbackAvailable() {
				return im_v2_lib_feature.FeatureManager.isFeatureAvailable(im_v2_lib_feature.Feature.isAiAssistantFeedbackAvailable);
			},
			isRegenerateAvailable() {
				return im_v2_lib_feature.FeatureManager.isFeatureAvailable(im_v2_lib_feature.Feature.isAiAssistantRegenerateAvailable);
			},
			currentVote() {
				return this.voteManager.getValue(this.message.id);
			},
			buttons() {
				const allButtons = [{
					name: ui_iconSet_api_vue.Outline.COPY,
					title: this.loc('IM_MESSAGE_AI_ASSISTANT_ANSWER_ACTION_COPY'),
					onClick: () => this.onCopyClick(),
					available: true
				}, {
					name: ui_iconSet_api_vue.Outline.REFRESH,
					title: this.loc('IM_MESSAGE_AI_ASSISTANT_ANSWER_ACTION_REGENERATE'),
					onClick: () => this.onRegenerateClick(),
					available: this.isRegenerateAvailable
				}, {
					name: ui_iconSet_api_vue.Outline.LIKE,
					title: this.loc('IM_MESSAGE_AI_ASSISTANT_ANSWER_ACTION_LIKE'),
					onClick: () => this.onLikeClick(),
					available: this.isFeedbackAvailable,
					active: this.currentVote === VoteValue.like,
					disabled: this.isVoteSending
				}, {
					name: ui_iconSet_api_vue.Outline.DISLIKE,
					title: this.loc('IM_MESSAGE_AI_ASSISTANT_ANSWER_ACTION_DISLIKE'),
					onClick: () => this.onDislikeClick(),
					available: this.isFeedbackAvailable,
					active: this.currentVote === VoteValue.dislike,
					disabled: this.isVoteSending
				}, {
					name: ui_iconSet_api_vue.Outline.FORWARD,
					title: this.loc('IM_MESSAGE_AI_ASSISTANT_ANSWER_ACTION_FORWARD'),
					onClick: () => this.onForwardClick(),
					available: true
				}];
				return allButtons.filter(button => button.available);
			}
		},
		created() {
			this.voteManager = new VoteManager();
		},
		methods: {
			async onCopyClick() {
				await im_v2_lib_utils.Utils.text.copyToClipboard(this.message.text);
				im_v2_lib_notifier.Notifier.onCopyTextComplete();
			},
			onRegenerateClick() {
				this.$emit('regenerate');
			},
			async onLikeClick() {
				await this.vote(VoteValue.like);
			},
			async onDislikeClick() {
				await this.vote(VoteValue.dislike);
			},
			async vote(value) {
				if (this.isVoteSending) {
					return;
				}
				this.isVoteSending = true;
				try {
					await this.voteManager.vote(this.message.id, value, {
						dialogId: this.dialogId,
						text: this.message.text
					});
				} finally {
					this.isVoteSending = false;
				}
			},
			onForwardClick() {
				this.$Bitrix.eventEmitter.emit(im_v2_const.EventType.dialog.showForwardPopup, {
					messagesIds: [this.message.id]
				});
			},
			loc(phraseCode, replacements = {}) {
				return this.$Bitrix.Loc.getMessage(phraseCode, replacements);
			}
		},
		template: `
		<div class="bx-im-message-ai-assistant-v2-answer__actions-panel">
			<div class="bx-im-message-ai-assistant-v2-answer__actions">
				<PanelButton
					v-for="button in buttons"
					:key="button.name"
					:name="button.name"
					:title="button.title"
					:active="button.active"
					:disabled="button.disabled"
					@click="button.onClick"
				/>
			</div>
			<div class="bx-im-message-ai-assistant-v2-answer__status">
				<MessageStatus :item="message" />
			</div>
		</div>
	`
	};

	// @vue/component
	const AiAssistantMessageV2 = {
		name: 'AiAssistantMessageV2',
		components: {
			AuthorTitle: im_v2_component_message_elements.AuthorTitle,
			BaseMessage: im_v2_component_message_base.BaseMessage,
			BottomPanel,
			MessageKeyboard: im_v2_component_message_elements.MessageKeyboard,
			MessageStatus: im_v2_component_message_elements.MessageStatus,
			DefaultMessageContent: im_v2_component_message_elements.DefaultMessageContent
		},
		props: {
			item: {
				type: Object,
				required: true
			},
			dialogId: {
				type: String,
				required: true
			},
			withTitle: {
				type: Boolean,
				default: true
			}
		},
		computed: {
			message() {
				return this.item;
			},
			isError() {
				return this.message.componentParams?.copilotError === true;
			},
			hasKeyboard() {
				return this.message.keyboard.length > 0;
			}
		},
		methods: {
			loc(phraseCode, replacements = {}) {
				return this.$Bitrix.Loc.getMessage(phraseCode, replacements);
			}
		},
		template: `
		<BaseMessage :item="item" :dialogId="dialogId" :withError="isError" class="bx-im-message-ai-assistant-v2-base-message__container">
			<div class="bx-im-message-default__container bx-im-message-ai-assistant-v2-answer__container" :class="{'--error': isError}">
				<AuthorTitle :item="item" />
				<div class="bx-im-message-default-content__container bx-im-message-default-content__scope">
					<DefaultMessageContent 
						:item="item" 
						:dialogId="dialogId" 
						:withAttach="false" 
						:withMessageStatus="false"
						:withBuilder="true"
					/>
					<div v-if="isError" class="bx-im-message-default-content__bottom-panel">
						<div class="bx-im-message-default-content__status-container">
							<MessageStatus :item="message" />
						</div>
					</div>
				</div>
			</div>
			<BottomPanel v-if="!isError" :message="message" :dialogId="dialogId" />
			<template #after-message v-if="hasKeyboard">
				<MessageKeyboard :item="message" :dialogId="dialogId" />
			</template>
		</BaseMessage>
	`
	};

	// @vue/component
	const CopilotMessage = {
		name: 'CopilotMessage',
		components: {
			CopilotMessageLegacy,
			AiAssistantMessageV2
		},
		props: {
			item: {
				type: Object,
				required: true
			},
			dialogId: {
				type: String,
				required: true
			},
			withTitle: {
				type: Boolean,
				default: true
			}
		},
		computed: {
			isCopilot2026Enabled() {
				return im_v2_lib_feature.FeatureManager.isFeatureAvailable(im_v2_lib_feature.Feature.isBitrixGptV2Available);
			}
		},
		template: `
		<AiAssistantMessageV2
			v-if="isCopilot2026Enabled"
			:item="item"
			:dialogId="dialogId"
			:withTitle="withTitle"
		/>
		<CopilotMessageLegacy
			v-else
			:item="item"
			:dialogId="dialogId"
			:withTitle="withTitle"
		/>
	`
	};

	exports.CopilotMessage = CopilotMessage;

})(this.BX.Messenger.v2.Component.Message = this.BX.Messenger.v2.Component.Message || {}, BX.Messenger.v2.Lib, BX, BX.Messenger.v2.Component.Message, BX.Messenger.v2.Component.Message, BX.Messenger.v2.Lib, BX.Messenger.v2.Lib, BX.Messenger.v2.Lib, BX.Messenger.v2.Lib, BX.Messenger.v2.Lib, BX.UI.IconSet, BX.Messenger.v2.Const, BX.Messenger.v2.Application, BX.Messenger.v2.Lib, BX.Messenger.v2.Lib, BX.Messenger.v2.Lib);
//# sourceMappingURL=copilot-answer.bundle.js.map
