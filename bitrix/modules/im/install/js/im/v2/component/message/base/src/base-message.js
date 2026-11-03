import { Type } from 'main.core';
import { type EventEmitter } from 'main.core.events';
import { computed } from 'ui.vue3';

import { Core } from 'im.v2.application.core';
import {
	AiTaskIndication,
	AiTaskIndicationLayout,
	AiTaskIndicationLayoutKey,
	ContextMenu,
	hasAiTaskIndication,
	MessageKeyboard,
	ReactionSelector,
	RetryButton,
} from 'im.v2.component.message.elements';
import { ActionByRole, EventType } from 'im.v2.const';
import { ChannelManager } from 'im.v2.lib.channel';
import { MessageMenuManager } from 'im.v2.lib.menu';
import { messageHasError } from 'im.v2.lib.message';
import { Parser } from 'im.v2.lib.parser';
import { PermissionManager } from 'im.v2.lib.permission';
import { Utils } from 'im.v2.lib.utils';
import { type ImModelChat, type ImModelMessage } from 'im.v2.model';

import './css/base-message.css';

// @vue/component
export const BaseMessage = {
	name: 'BaseMessage',
	components: { AiTaskIndication, ContextMenu, RetryButton, MessageKeyboard, ReactionSelector },
	/*
	 * The layout of a running indication, for the content slotted into this body. The bubble layout
	 * hands its caption to the time row of the message, and that row belongs to the content, not to
	 * this component - so the placement is answered here, where the layout is already known, and
	 * read there. Lazy on purpose: the computed is only evaluated by a content that asks for it, and
	 * it then reuses the very gate the `v-if` below already paid for.
	 */
	provide(): { [key: string]: string | null }
	{
		return {
			[AiTaskIndicationLayoutKey]: computed(() => {
				return this.hasAiTaskIndication ? this.aiTaskIndicationLayout : null;
			}),
		};
	},
	props: {
		item: {
			type: Object,
			required: true,
		},
		dialogId: {
			type: String,
			required: true,
		},
		withBackground: {
			type: Boolean,
			default: true,
		},
		withContextMenu: {
			type: Boolean,
			default: true,
		},
		withReactions: {
			type: Boolean,
			default: true,
		},
		withRetryButton: {
			type: Boolean,
			default: true,
		},
		afterMessageWidthLimit: {
			type: Boolean,
			default: true,
		},
		withError: {
			type: Boolean,
			default: false,
		},
		/**
		 * The body renders a media frame (a photo, a video, a gallery) rather than plain content.
		 * Only the host knows it, and the AI-task indication needs it: a frame with a caption keeps
		 * a bubble around itself, but its light belongs over the graphics, not under them.
		 */
		withMediaFrame: {
			type: Boolean,
			default: false,
		},
	},
	computed: {
		dialog(): ImModelChat
		{
			return this.$store.getters['chats/get'](this.dialogId, true);
		},
		message(): ImModelMessage
		{
			return this.item;
		},
		isSystemMessage(): boolean
		{
			return this.message.authorId === 0;
		},
		isSelfMessage(): boolean
		{
			return this.message.authorId === Core.getUserId();
		},
		isOpponentMessage(): boolean
		{
			return !this.isSystemMessage && !this.isSelfMessage;
		},
		isChannelPost(): boolean
		{
			return ChannelManager.isChannel(this.dialogId);
		},
		isBulkActionsMode(): boolean
		{
			return this.$store.getters['messages/select/isBulkActionsModeActive'](this.dialogId);
		},
		isMessageSelected(): boolean
		{
			return this.$store.getters['messages/select/isMessageSelected'](this.message.id, this.dialogId);
		},
		showMessageAngle(): boolean
		{
			const hasAfterContent = Boolean(this.$slots['after-message']);

			return !this.isTransparentBackground && !this.isChannelPost && !hasAfterContent;
		},
		containerClasses(): {[className: string]: boolean}
		{
			return {
				'--self': this.isSelfMessage,
				'--opponent': this.isOpponentMessage,
				'--system': this.isSystemMessage && !this.shouldForceBackground,
				'--has-error': this.hasError,
				'--has-after-content': Boolean(this.$slots['after-message']),
				'--selected': this.isMessageSelected,
				'--is-bulk-actions-mode': this.isBulkActionsMode,
			};
		},
		shouldForceBackground(): boolean
		{
			return this.$store.getters['messages/builder/forceBackground'](this.message.id);
		},
		bodyClasses(): {[className: string]: boolean}
		{
			return {
				'--transparent': this.isTransparentBackground,
				'--no-angle': !this.showMessageAngle,
				'--ai-task-underlay': this.hasAiTaskUnderlay,
			};
		},
		/**
		 * The bubble carries the AI-task layer under its own content; media and the round player
		 * carry it over the graphics, which is what a positioned layer does by default.
		 */
		hasAiTaskUnderlay(): boolean
		{
			return this.hasAiTaskIndication && this.aiTaskIndicationLayout === AiTaskIndicationLayout.bubble;
		},
		isTransparentBackground(): boolean
		{
			if (!this.withBackground)
			{
				return true;
			}

			if (this.shouldForceBackground)
			{
				return false;
			}

			return this.isSystemMessage;
		},
		hasAiTaskIndication(): boolean
		{
			return hasAiTaskIndication(this.$store, this.message);
		},
		aiTaskIndicationLayout(): string
		{
			if (!this.isTransparentBackground)
			{
				// A frame with a caption: a bubble on the outside, opaque graphics on the inside.
				return this.withMediaFrame
					? AiTaskIndicationLayout.mediaCaption
					: AiTaskIndicationLayout.bubble;
			}

			// Only reached behind the gate above (`v-if` compiles to a ternary), so the round-player
			// check is not paid for by every message of the list.
			const isVideoNote = this.$store.getters['messages/isVideoNote'](this.message.id);

			return isVideoNote ? AiTaskIndicationLayout.round : AiTaskIndicationLayout.media;
		},
		showRetryButton(): boolean
		{
			return this.withRetryButton && this.isSelfMessage && this.hasError && !this.message.notDelivered;
		},
		// Deliberately checks the send error alone, not the combined error signal: a message that
		// failed to send has no server-side id, so its menu is meaningless, while a message
		// undelivered by timeout does exist on the server and keeps its actions (as it did in v1).
		showContextMenu(): boolean
		{
			return this.withContextMenu && !this.hasSendError && this.canOpenContextMenu;
		},
		canOpenContextMenu(): boolean
		{
			return PermissionManager.getInstance().canPerformActionByRole(ActionByRole.openMessageMenu, this.dialogId);
		},
		hasError(): boolean
		{
			return this.withError || messageHasError(this.message);
		},
		hasSendError(): boolean
		{
			return this.withError || Boolean(this.message.error);
		},
	},
	methods: {
		onContainerClick(event: PointerEvent)
		{
			Parser.executeClickEvent(event, { emitter: this.getEmitter() });
		},
		openContextMenu(event: PointerEvent & { target: HTMLElement })
		{
			const isContextMenuClick = Boolean(event.target.closest('.bx-im-message-context-menu__container'));
			if (!this.withContextMenu || isContextMenuClick || this.hasSelectedText())
			{
				return;
			}

			const messageMenuManager = MessageMenuManager.getInstance();
			const shouldUseNativeContextMenu = messageMenuManager.shouldUseNativeContextMenu(event.target);

			if (shouldUseNativeContextMenu)
			{
				messageMenuManager.destroyMenuInstance();

				return;
			}

			event.preventDefault();

			this.getEmitter().emit(EventType.dialog.onClickMessageContextMenu, {
				message: this.message,
				dialogId: this.dialogId,
				event,
			});
		},
		async onMessageMouseUp(message: ImModelMessage, event: MouseEvent)
		{
			await Utils.browser.waitForSelectionToUpdate();
			if (!this.hasSelectedText())
			{
				return;
			}

			this.getEmitter().emit(EventType.dialog.showQuoteButton, {
				message,
				event,
			});
		},
		hasSelectedText(): boolean
		{
			const selection = window.getSelection().toString().trim();

			return Type.isStringFilled(selection);
		},
		getEmitter(): EventEmitter
		{
			return this.$Bitrix.eventEmitter;
		},
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
	`,
};
