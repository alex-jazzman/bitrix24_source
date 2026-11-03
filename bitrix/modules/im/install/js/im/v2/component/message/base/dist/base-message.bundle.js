/* eslint-disable */
this.BX = this.BX || {};
this.BX.Messenger = this.BX.Messenger || {};
this.BX.Messenger.v2 = this.BX.Messenger.v2 || {};
this.BX.Messenger.v2.Component = this.BX.Messenger.v2.Component || {};
(function (exports, main_core, ui_vue3, im_v2_application_core, im_v2_component_message_elements, im_v2_const, im_v2_lib_channel, im_v2_lib_menu, im_v2_lib_message, im_v2_lib_parser, im_v2_lib_permission, im_v2_lib_utils) {
	'use strict';

	// @vue/component
	const BaseMessage = {
		name: 'BaseMessage',
		components: {
			AiTaskIndication: im_v2_component_message_elements.AiTaskIndication,
			ContextMenu: im_v2_component_message_elements.ContextMenu,
			RetryButton: im_v2_component_message_elements.RetryButton,
			MessageKeyboard: im_v2_component_message_elements.MessageKeyboard,
			ReactionSelector: im_v2_component_message_elements.ReactionSelector
		},
		/*
		 * The layout of a running indication, for the content slotted into this body. The bubble layout
		 * hands its caption to the time row of the message, and that row belongs to the content, not to
		 * this component - so the placement is answered here, where the layout is already known, and
		 * read there. Lazy on purpose: the computed is only evaluated by a content that asks for it, and
		 * it then reuses the very gate the `v-if` below already paid for.
		 */
		provide() {
			return {
				[im_v2_component_message_elements.AiTaskIndicationLayoutKey]: ui_vue3.computed(() => {
					return this.hasAiTaskIndication ? this.aiTaskIndicationLayout : null;
				})
			};
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
			withBackground: {
				type: Boolean,
				default: true
			},
			withContextMenu: {
				type: Boolean,
				default: true
			},
			withReactions: {
				type: Boolean,
				default: true
			},
			withRetryButton: {
				type: Boolean,
				default: true
			},
			afterMessageWidthLimit: {
				type: Boolean,
				default: true
			},
			withError: {
				type: Boolean,
				default: false
			},
			/**
			 * The body renders a media frame (a photo, a video, a gallery) rather than plain content.
			 * Only the host knows it, and the AI-task indication needs it: a frame with a caption keeps
			 * a bubble around itself, but its light belongs over the graphics, not under them.
			 */
			withMediaFrame: {
				type: Boolean,
				default: false
			}
		},
		computed: {
			dialog() {
				return this.$store.getters['chats/get'](this.dialogId, true);
			},
			message() {
				return this.item;
			},
			isSystemMessage() {
				return this.message.authorId === 0;
			},
			isSelfMessage() {
				return this.message.authorId === im_v2_application_core.Core.getUserId();
			},
			isOpponentMessage() {
				return !this.isSystemMessage && !this.isSelfMessage;
			},
			isChannelPost() {
				return im_v2_lib_channel.ChannelManager.isChannel(this.dialogId);
			},
			isBulkActionsMode() {
				return this.$store.getters['messages/select/isBulkActionsModeActive'](this.dialogId);
			},
			isMessageSelected() {
				return this.$store.getters['messages/select/isMessageSelected'](this.message.id, this.dialogId);
			},
			showMessageAngle() {
				const hasAfterContent = Boolean(this.$slots['after-message']);
				return !this.isTransparentBackground && !this.isChannelPost && !hasAfterContent;
			},
			containerClasses() {
				return {
					'--self': this.isSelfMessage,
					'--opponent': this.isOpponentMessage,
					'--system': this.isSystemMessage && !this.shouldForceBackground,
					'--has-error': this.hasError,
					'--has-after-content': Boolean(this.$slots['after-message']),
					'--selected': this.isMessageSelected,
					'--is-bulk-actions-mode': this.isBulkActionsMode
				};
			},
			shouldForceBackground() {
				return this.$store.getters['messages/builder/forceBackground'](this.message.id);
			},
			bodyClasses() {
				return {
					'--transparent': this.isTransparentBackground,
					'--no-angle': !this.showMessageAngle,
					'--ai-task-underlay': this.hasAiTaskUnderlay
				};
			},
			/**
			 * The bubble carries the AI-task layer under its own content; media and the round player
			 * carry it over the graphics, which is what a positioned layer does by default.
			 */
			hasAiTaskUnderlay() {
				return this.hasAiTaskIndication && this.aiTaskIndicationLayout === im_v2_component_message_elements.AiTaskIndicationLayout.bubble;
			},
			isTransparentBackground() {
				if (!this.withBackground) {
					return true;
				}
				if (this.shouldForceBackground) {
					return false;
				}
				return this.isSystemMessage;
			},
			hasAiTaskIndication() {
				return im_v2_component_message_elements.hasAiTaskIndication(this.$store, this.message);
			},
			aiTaskIndicationLayout() {
				if (!this.isTransparentBackground) {
					// A frame with a caption: a bubble on the outside, opaque graphics on the inside.
					return this.withMediaFrame ? im_v2_component_message_elements.AiTaskIndicationLayout.mediaCaption : im_v2_component_message_elements.AiTaskIndicationLayout.bubble;
				}

				// Only reached behind the gate above (`v-if` compiles to a ternary), so the round-player
				// check is not paid for by every message of the list.
				const isVideoNote = this.$store.getters['messages/isVideoNote'](this.message.id);
				return isVideoNote ? im_v2_component_message_elements.AiTaskIndicationLayout.round : im_v2_component_message_elements.AiTaskIndicationLayout.media;
			},
			showRetryButton() {
				return this.withRetryButton && this.isSelfMessage && this.hasError && !this.message.notDelivered;
			},
			// Deliberately checks the send error alone, not the combined error signal: a message that
			// failed to send has no server-side id, so its menu is meaningless, while a message
			// undelivered by timeout does exist on the server and keeps its actions (as it did in v1).
			showContextMenu() {
				return this.withContextMenu && !this.hasSendError && this.canOpenContextMenu;
			},
			canOpenContextMenu() {
				return im_v2_lib_permission.PermissionManager.getInstance().canPerformActionByRole(im_v2_const.ActionByRole.openMessageMenu, this.dialogId);
			},
			hasError() {
				return this.withError || im_v2_lib_message.messageHasError(this.message);
			},
			hasSendError() {
				return this.withError || Boolean(this.message.error);
			}
		},
		methods: {
			onContainerClick(event) {
				im_v2_lib_parser.Parser.executeClickEvent(event, {
					emitter: this.getEmitter()
				});
			},
			openContextMenu(event) {
				const isContextMenuClick = Boolean(event.target.closest('.bx-im-message-context-menu__container'));
				if (!this.withContextMenu || isContextMenuClick || this.hasSelectedText()) {
					return;
				}
				const messageMenuManager = im_v2_lib_menu.MessageMenuManager.getInstance();
				const shouldUseNativeContextMenu = messageMenuManager.shouldUseNativeContextMenu(event.target);
				if (shouldUseNativeContextMenu) {
					messageMenuManager.destroyMenuInstance();
					return;
				}
				event.preventDefault();
				this.getEmitter().emit(im_v2_const.EventType.dialog.onClickMessageContextMenu, {
					message: this.message,
					dialogId: this.dialogId,
					event
				});
			},
			async onMessageMouseUp(message, event) {
				await im_v2_lib_utils.Utils.browser.waitForSelectionToUpdate();
				if (!this.hasSelectedText()) {
					return;
				}
				this.getEmitter().emit(im_v2_const.EventType.dialog.showQuoteButton, {
					message,
					event
				});
			},
			hasSelectedText() {
				const selection = window.getSelection().toString().trim();
				return main_core.Type.isStringFilled(selection);
			},
			getEmitter() {
				return this.$Bitrix.eventEmitter;
			}
		},
		template: `
		<div class="bx-im-message-base__wrap bx-im-message-base__scope" :class="containerClasses" :data-id="message.id" data-testid="im-message-base-root">
			<div
				class="bx-im-message-base__container" 
				@click="onContainerClick"
				@contextmenu="openContextMenu"
				@mouseup="onMessageMouseUp(message, $event)"
			>
				<!-- Content + retry + context menu -->
				<div class="bx-im-message-base__content">
					<div class="bx-im-message-base__content-main">
						<!-- Before content: outside the bubble, but inside the content column so the "..." menu spans it -->
						<slot name="before-message"></slot>
						<div class="bx-im-message-base__body" :class="bodyClasses">
							<slot></slot>
							<!-- Both nodes of the indication belong to the body: the decor layer takes its geometry and radius -->
							<AiTaskIndication
								v-if="hasAiTaskIndication"
								:message="message"
								:layout="aiTaskIndicationLayout"
							/>
							<ReactionSelector v-if="withReactions" :messageId="message.id" />
						</div>
					</div>
					<RetryButton v-if="showRetryButton" :message="message" :dialogId="dialogId" data-testid="im-message-retry-button"/>
					<ContextMenu
						v-else
						:showContextMenu="showContextMenu"
						:dialogId="dialogId"
						:message="message" 
					/>
				</div>
				<!-- After content -->
				<div
					v-if="$slots['after-message']"
					class="bx-im-message-base__bottom"
					:class="{'--width-limit': afterMessageWidthLimit}"
				>
					<div class="bx-im-message-base__bottom-content">
						<slot name="after-message"></slot>
					</div>
				</div>
			</div>
		</div>
	`
	};

	exports.BaseMessage = BaseMessage;

})(this.BX.Messenger.v2.Component.Message = this.BX.Messenger.v2.Component.Message || {}, BX, BX.Vue3, BX.Messenger.v2.Application, BX.Messenger.v2.Component.Message, BX.Messenger.v2.Const, BX.Messenger.v2.Lib, BX.Messenger.v2.Lib, BX.Messenger.v2.Lib, BX.Messenger.v2.Lib, BX.Messenger.v2.Lib, BX.Messenger.v2.Lib);
//# sourceMappingURL=base-message.bundle.js.map
