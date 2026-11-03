import { type JsonObject, Type } from 'main.core';
import { EventEmitter, type BaseEvent } from 'main.core.events';

import { EventType } from 'im.v2.const';
import { type ImModelLayout } from 'im.v2.model';

import { ChatOpener } from './components/openers/chat/chat';
import { CommentsOpener } from './components/openers/comments/comments';

import './css/chat-content.css';

// @vue/component
export const ChatContent = {
	name: 'ChatContent',
	components: { ChatOpener, CommentsOpener },
	props:
	{
		entityId: {
			type: String,
			default: '',
		},
	},
	data(): JsonObject
	{
		return {
			commentsPostId: 0,
			commentsContextId: 0,
			commentsAnimationFlag: false,
			isLowerLayerIsolated: false,
		};
	},
	computed:
	{
		layout(): ImModelLayout
		{
			return this.$store.getters['application/getLayout'];
		},
		showComments(): boolean
		{
			return this.$store.getters['messages/comments/areOpened'];
		},
		/**
		 * `inert` already takes the covered content out of the walk and out of the accessibility tree,
		 * and the explicit attribute keeps the second half true whatever the browser has made of `inert`.
		 * Nothing focusable is left under it, so the region carries no unreachable stop either.
		 */
		lowerLayerAriaHidden(): string | null
		{
			return this.isLowerLayerIsolated ? 'true' : null;
		},
	},
	watch:
	{
		layout()
		{
			// The chat that opens owns its own focus - its text field autofocuses on its own - so the
			// layer only goes away here and asks nobody to put the focus back into the chat just left.
			this.dropCommentsLayer();
		},
	},
	created()
	{
		// Not in data(): the guard of ALG-04 belongs to one close and the template knows nothing of it.
		this.isClosingComments = false;

		EventEmitter.subscribe(EventType.dialog.closeComments, this.onCloseComments);

		this.getEmitter().subscribe(EventType.dialog.openComments, this.onOpenComments);
		this.getEmitter().subscribe(EventType.dialog.closeComments, this.onCloseComments);
	},
	beforeUnmount()
	{
		EventEmitter.unsubscribe(EventType.dialog.closeComments, this.onCloseComments);

		this.getEmitter().unsubscribe(EventType.dialog.openComments, this.onOpenComments);
		this.getEmitter().unsubscribe(EventType.dialog.closeComments, this.onCloseComments);
	},
	methods:
	{
		onOpenComments(event: BaseEvent<{ messageId: number, contextId?: number }>)
		{
			const { messageId, contextId = 0 } = event.getData();
			this.commentsPostId = messageId;
			this.commentsContextId = contextId;
			this.commentsAnimationFlag = true;
			// The layer covers the chat entirely, so the content under it stops being part of the page
			// for the keyboard and for the accessibility tree alike - a deep link opening included.
			this.isLowerLayerIsolated = true;
			this.$store.dispatch('messages/comments/setOpened', {
				channelDialogId: this.entityId,
				commentsPostId: this.commentsPostId,
			});
		},
		onCloseComments()
		{
			void this.closeComments();
		},
		/**
		 * ALG-04. The Back button of the layer and the Escape of the shared manager both arrive here, and
		 * the second of them finds the close already under way: one gesture closes the layer once.
		 */
		async closeComments(): Promise<void>
		{
			if (this.isClosingComments || !this.showComments)
			{
				return;
			}

			this.isClosingComments = true;

			try
			{
				await this.revealLowerLayer();
				await this.delegateCloseToCommentsOwner();
			}
			finally
			{
				this.dropCommentsLayer();
				this.isClosingComments = false;
			}
		},
		// The content under the layer has to be able to hold the focus again before anybody looks for a
		// target inside it, so the isolation goes first and the DOM is really rid of it before the handover.
		async revealLowerLayer(): Promise<void>
		{
			this.isLowerLayerIsolated = false;

			await this.$nextTick();
		},
		/**
		 * The layer belongs to its opener: the initiator of the opening, the hierarchy of fallback targets
		 * and the moment the focus goes back are all its own. This composition hands the close over and
		 * waits for it, and it never places the focus itself - so there is no second hierarchy to disagree.
		 */
		async delegateCloseToCommentsOwner(): Promise<void>
		{
			const owner = this.$refs.commentsOpener;
			if (!Type.isFunction(owner?.closeAndRestoreFocus))
			{
				return;
			}

			await owner.closeAndRestoreFocus();
		},
		// The state close of the layer, and nothing else: no focus is moved from here.
		dropCommentsLayer()
		{
			this.commentsPostId = 0;
			this.commentsContextId = 0;
			this.isLowerLayerIsolated = false;
			this.$store.dispatch('messages/comments/setClosed');
		},
		onCommentsAnimationEnd()
		{
			this.commentsAnimationFlag = false;
		},
		getEmitter(): EventEmitter
		{
			return this.$Bitrix.eventEmitter;
		},
	},
	template: `
		<ChatOpener
			:dialogId="entityId"
			:class="{'--comments-show-animation': commentsAnimationFlag}"
			:inert="isLowerLayerIsolated"
			:aria-hidden="lowerLayerAriaHidden"
		/>
		<Transition name="comments-content" @after-enter="onCommentsAnimationEnd">
			<CommentsOpener
				v-if="showComments"
				ref="commentsOpener"
				:postId="commentsPostId"
				:contextId="commentsContextId"
				:channelId="entityId"
			/>
		</Transition>
	`,
};
