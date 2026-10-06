import { Type, Loc } from 'main.core';

import { Parser } from 'im.v2.lib.parser';
import { Utils } from 'im.v2.lib.utils';
import { FileType, EventType } from 'im.v2.const';

import './css/reply-preview.css';

import type { ImModelChat, ImModelMessage, ImModelUser, ImModelFile } from 'im.v2.model';

const NO_CONTEXT_TAG = 'none';
const NAME_MAX_LENGTH = 40;
const GALLERY_STACK_MAX = 3;

// @vue/component
export const Reply = {
	name: 'ReplyComponent',
	props:
	{
		dialogId: {
			type: String,
			required: true,
		},
		replyId: {
			type: Number,
			required: true,
		},
		isForward: {
			type: Boolean,
			default: false,
		},
	},
	data(): Object
	{
		return {
			isExpanded: false,
			isExpandable: false,
		};
	},
	computed:
	{
		dialog(): ImModelChat
		{
			return this.$store.getters['chats/get'](this.dialogId, true);
		},
		replyMessage(): ?ImModelMessage
		{
			return this.$store.getters['messages/getById'](this.replyId);
		},
		replyMessageChat(): ?ImModelChat
		{
			return this.$store.getters['chats/getByChatId'](this.replyMessage?.chatId);
		},
		replyAuthor(): ?ImModelUser
		{
			return this.$store.getters['users/get'](this.replyMessage?.authorId);
		},
		replyTitle(): string
		{
			return this.replyAuthor ? this.replyAuthor.name : this.loc('IM_DIALOG_CHAT_QUOTE_DEFAULT_TITLE');
		},

		// --- Media / file computed for the original-message preview ---
		/** Files attached to the original message — read once, reused by the file/gallery computed below */
		messageFiles(): ImModelFile[]
		{
			if (!this.replyMessage)
			{
				return [];
			}

			return this.$store.getters['messages/getMessageFiles'](this.replyMessage.id);
		},
		messageFile(): ?ImModelFile
		{
			return this.messageFiles[0] ?? null;
		},
		isImage(): boolean
		{
			return Boolean(this.messageFile && this.messageFile.type === FileType.image);
		},
		isVideo(): boolean
		{
			return Boolean(this.messageFile && this.messageFile.type === FileType.video);
		},
		/**
		 * Video note (round video message). Keeps FileType.video — there is no separate file type;
		 * the round-message flag lives on the file. Rendered as a compact round thumbnail (its
		 * urlPreview poster) instead of the rectangular video thumbnail — like a single media
		 * thumbnail, with no textual type caption (the round shape conveys the type). The
		 * IM_PARSER_ICON_TYPE_VIDEO_NOTE phrase is still used as the image alt (a11y).
		 */
		isVideoNote(): boolean
		{
			return Boolean(this.messageFile && this.messageFile.isVideoNote);
		},
		isFile(): boolean
		{
			return Boolean(this.messageFile && this.messageFile.type === FileType.file);
		},
		isAudio(): boolean
		{
			return Boolean(this.messageFile && this.messageFile.type === FileType.audio);
		},
		isSticker(): boolean
		{
			if (!this.replyMessage)
			{
				return false;
			}

			return this.$store.getters['stickers/messages/isSticker'](this.replyMessage.id);
		},
		/** Sticker image URI of the original message (null if not a sticker or sticker data is not in store) */
		stickerImageUri(): ?string
		{
			if (!this.replyMessage || !this.isSticker)
			{
				return null;
			}

			const stickerId = this.$store.getters['stickers/messages/getStickerByMessageId'](this.replyMessage.id);
			const sticker = this.$store.getters['stickers/get'](stickerId);

			return sticker?.uri ?? null;
		},
		/** Number of files attached to the original message */
		galleryCount(): number
		{
			return this.messageFiles.length;
		},
		/** First files of the original message shown as an overlapped stack (max GALLERY_STACK_MAX) */
		galleryThumbnails(): ImModelFile[]
		{
			return this.messageFiles.slice(0, GALLERY_STACK_MAX);
		},
		/** Files beyond the ones shown in the stack — rendered as a "+N" badge */
		galleryRemainingCount(): number
		{
			return Math.max(this.galleryCount - this.galleryThumbnails.length, 0);
		},
		/**
		 * Count modifier for the gallery stack. The stack items are absolutely positioned, so the
		 * container cannot size itself to its content (fit-content would collapse it). The fixed base
		 * width fits the 3-thumbnail layout; for 1/2 shown thumbnails the container must shrink to the
		 * actual right edge of the last (rotated) thumbnail — otherwise the flex gap to the caption
		 * grows and the stack↔text spacing looks inconsistent between 2- and 3-media quotes.
		 */
		galleryStackModifier(): string
		{
			return `--count-${this.galleryThumbnails.length}`;
		},
		/** True when the original bundles several media (image/video) — show the stack instead of a single thumbnail */
		isGallery(): boolean
		{
			return (this.isImage || this.isVideo) && this.galleryCount > 1 && !this.isDeleted;
		},
		/**
		 * The gallery stack is rendered only when there are several media AND the first file has a
		 * preview (otherwise the type icon is shown instead). Used both to gate the stack template
		 * and the preview media-offset so the extra top margin is not added when the icon is shown.
		 */
		showGalleryStack(): boolean
		{
			return this.isGallery && !this.showIcon;
		},
		/** Pluralized "N media" caption for the gallery preview */
		mediaCountText(): string
		{
			return Loc.getMessagePlural('IM_MESSAGE_REPLY_MEDIA_COUNT', this.galleryCount, {
				'#COUNT#': this.galleryCount,
			});
		},
		showIcon(): boolean
		{
			if (!this.messageFile)
			{
				return false;
			}

			return !this.messageFile.urlPreview;
		},
		truncatedFileName(): string
		{
			if (!this.messageFile?.name)
			{
				return '';
			}

			return Utils.file.getShortFileName(this.messageFile.name, NAME_MAX_LENGTH);
		},
		iconClass(): string
		{
			if (!this.messageFile?.name)
			{
				return 'ui-icon-file-file';
			}

			const iconType = Utils.file.getIconTypeByFilename(this.messageFile.name);

			return `ui-icon-file-${iconType}`;
		},
		/** Human-readable size of the file reply (empty when the file has no known size) */
		fileSize(): string
		{
			if (!this.messageFile?.size)
			{
				return '';
			}

			return Utils.file.formatFileSize(this.messageFile.size);
		},
		// --- End media computed ---

		isMessageDeleted(): boolean
		{
			return Boolean(this.replyMessage?.isDeleted);
		},
		replyText(): string
		{
			if (!this.replyMessage)
			{
				return '';
			}

			let text = Parser.prepareQuote(this.replyMessage);
			text = Parser.decodeText(text);

			return text;
		},
		isQuoteFromTheSameChat(): boolean
		{
			return this.replyMessage?.chatId === this.dialog.chatId;
		},
		replyContext(): string
		{
			if (!this.isQuoteFromTheSameChat)
			{
				return NO_CONTEXT_TAG;
			}

			if (!this.isForward)
			{
				return `${this.dialogId}/${this.replyId}`;
			}

			return `${this.replyMessageChat?.dialogId}/${this.replyId}`;
		},
		canShowReply(): boolean
		{
			return this.replyId !== 0;
		},
		isActiveQuote(): boolean
		{
			return this.replyContext !== NO_CONTEXT_TAG;
		},
		quoteClasses(): Record<string, boolean>
		{
			return {
				'--expanded': this.isExpanded,
				'--collapsed': !this.isExpanded,
				'--clickable': this.isActiveQuote || this.isExpandable,
			};
		},
		toggleLabel(): string
		{
			return this.isExpanded
				? this.loc('IM_PARSER_QUOTE_COLLAPSE')
				: this.loc('IM_PARSER_QUOTE_EXPAND');
		},
		/**
		 * The original always travels with the reply (server bundles it as additionalMessages/additionalEntities).
		 * So an absent original means it is inaccessible to the current user — show the "unavailable" fallback.
		 */
		isUnavailable(): boolean
		{
			return Type.isNil(this.replyMessage);
		},
		/** True when the original is present and not deleted */
		hasOriginal(): boolean
		{
			return !Type.isNil(this.replyMessage) && !this.isMessageDeleted;
		},
		/** True when the original is present but deleted */
		isDeleted(): boolean
		{
			return !Type.isNil(this.replyMessage) && this.isMessageDeleted;
		},
		/** Show media preview only when the original is present and not deleted */
		showMediaPreview(): boolean
		{
			return this.hasOriginal && Boolean(this.messageFile || this.isSticker);
		},
		/**
		 * Caption shown next to the media preview. For image/video and stickers with a thumbnail the type
		 * is already conveyed by the thumbnail, so the textual type prefix (image/video/sticker) would
		 * duplicate it — suppress it. Other types keep the full quote text.
		 */
		previewText(): string
		{
			if ((this.isImage || this.isVideo) && !this.showIcon)
			{
				const caption = Parser.purify({ text: this.replyMessage?.text ?? '' });

				return Parser.decodeText(caption);
			}

			if (this.isSticker && this.stickerImageUri)
			{
				return '';
			}

			// For a file reply the file chip (icon + name + size) conveys the file; below it show only the caption text.
			if (this.isFile)
			{
				const caption = Parser.purify({ text: this.replyMessage?.text ?? '' });

				return Parser.decodeText(caption);
			}

			return this.replyText;
		},
	},
	watch:
	{
		replyText()
		{
			void this.updateToggleAvailability();
		},
	},
	mounted()
	{
		void this.updateToggleAvailability();
	},
	methods:
	{
		toggleExpanded()
		{
			if (!this.isExpandable)
			{
				return;
			}

			this.isExpanded = !this.isExpanded;
		},
		async updateToggleAvailability()
		{
			await this.$nextTick();

			const textNode = this.$refs.text;
			if (!textNode)
			{
				return;
			}

			const isOverflowing = textNode.scrollHeight > textNode.clientHeight + 1;
			this.isExpandable = isOverflowing;

			if (!isOverflowing)
			{
				this.isExpanded = false;
			}
		},
		hasSelectedText(): boolean
		{
			const selection = window.getSelection().toString().trim();

			return Type.isStringFilled(selection);
		},
		hasPreview(file): boolean
		{
			return Type.isStringFilled(file.urlPreview);
		},
		onQuoteClick(event: MouseEvent)
		{
			const isInteractiveClick = (
				event.target instanceof HTMLElement
				&& event.target.closest('a')
			);
			if (isInteractiveClick)
			{
				event.stopPropagation();

				return;
			}

			if (this.hasSelectedText())
			{
				event.stopPropagation();

				return;
			}

			if (this.isActiveQuote || !this.isExpandable)
			{
				return;
			}

			this.toggleExpanded();
		},
		onNavigateToOriginal()
		{
			if (!this.isActiveQuote)
			{
				return;
			}

			const [dialogId, messageId] = this.replyContext.split('/');
			this.$Bitrix.eventEmitter.emit(EventType.dialog.goToMessageContext, {
				messageId: Number.parseInt(messageId, 10),
				dialogId: dialogId.toString(),
			});
		},
		onQuoteKeydown(event: KeyboardEvent)
		{
			if (event.key === 'Enter' || event.key === ' ')
			{
				event.preventDefault();
				this.onNavigateToOriginal();
			}
		},
		loc(phraseCode: string): string
		{
			return this.$Bitrix.Loc.getMessage(phraseCode);
		},
	},
	template: `
		<div
			v-if="canShowReply"
			class="bx-im-message-quote --reply"
			:class="quoteClasses"
			:data-context="replyContext"
			data-testid="im-message-reply-root"
			@click="onQuoteClick"
		>
			<div class="bx-im-message-quote__wrap">
				<div
					class="bx-im-message-quote__name"
					:tabindex="isActiveQuote ? 0 : -1"
					:role="isActiveQuote ? 'button' : undefined"
					:aria-label="isActiveQuote ? loc('IM_MESSAGE_REPLY_GO_TO_ORIGINAL') : undefined"
					data-testid="im-message-reply-navigate-btn"
					@keydown="isActiveQuote ? onQuoteKeydown($event) : undefined"
				>
					<div class="bx-im-message-quote__name-text">{{ replyTitle }}</div>
				</div>

				<!-- Original is inaccessible to the current user (server did not bundle it) -->
				<div v-if="isUnavailable" class="bx-im-message-quote__text" data-testid="im-message-reply-state-unavailable">{{ loc('IM_MESSAGE_REPLY_UNAVAILABLE') }}</div>

				<!-- Original is deleted -->
				<div v-else-if="isDeleted" ref="text" class="bx-im-message-quote__text" data-testid="im-message-reply-state-deleted" v-html="replyText"></div>

				<!-- Original with media preview -->
				<template v-else-if="showMediaPreview">
					<!-- Visual preview (file chip / thumbnail / icon / sticker) -->
					<div
							class="bx-im-message-quote__preview"
							:class="{ 'bx-im-message-quote__preview--media-offset': isFile || showGalleryStack }"
							data-testid="im-message-reply-preview"
						>
						<!-- File: file-type icon + name + size chip -->
						<template v-if="isFile">
							<div class="bx-im-message-quote__file-icon" data-testid="im-message-reply-file-icon">
								<div :class="iconClass" class="ui-icon" aria-hidden="true"><i></i></div>
							</div>
							<div class="bx-im-message-quote__file-caption">
								<span class="bx-im-message-quote__file-name" data-testid="im-message-reply-file-name">{{ truncatedFileName }}</span>
								<span
									v-if="fileSize"
									class="bx-im-message-quote__file-size"
									data-testid="im-message-reply-file-size"
								>{{ fileSize }}</span>
							</div>
						</template>

						<!-- Gallery: overlapped stack of first thumbnails + "+N" badge + "Gallery / N media" caption -->
						<template v-else-if="showGalleryStack">
							<div class="bx-im-message-quote__gallery-stack" :class="galleryStackModifier" data-testid="im-message-reply-gallery-stack">
								<div
									v-for="file in galleryThumbnails"
									:key="file.id"
									class="bx-im-message-quote__gallery-stack-item"
								>
									<img
										v-if="hasPreview(file)"
										class="bx-im-message-quote__gallery-stack-img"
										:src="file.urlPreview"
										:alt="file.name"
										loading="lazy"
									>
								</div>
								<span
									v-if="galleryRemainingCount > 0"
									class="bx-im-message-quote__gallery-badge"
									data-testid="im-message-reply-gallery-badge"
								>+{{ galleryRemainingCount }}</span>
							</div>
							<div class="bx-im-message-quote__gallery-caption" data-testid="im-message-reply-gallery-caption">
								<span class="bx-im-message-quote__gallery-caption-title">{{ loc('IM_PARSER_ICON_TYPE_GALLERY') }}</span>
								<span class="bx-im-message-quote__gallery-caption-count">{{ mediaCountText }}</span>
							</div>
						</template>

						<!-- Video note (round video message): round thumbnail (poster) only, no type caption (round shape conveys the type; alt keeps the IM_PARSER_ICON_TYPE_VIDEO_NOTE a11y label) -->
						<template v-else-if="isVideoNote && !showIcon">
							<div class="bx-im-message-quote__preview-video-note" data-testid="im-message-reply-preview-video-note">
								<img
									class="bx-im-message-quote__preview-video-note_img"
									:src="messageFile.urlPreview"
									:alt="loc('IM_PARSER_ICON_TYPE_VIDEO_NOTE')"
									loading="lazy"
								>
							</div>
						</template>

						<!-- Image / Video: single thumbnail (urlPreview only) -->
						<template v-else-if="(isImage || isVideo) && !showIcon">
							<div class="bx-im-message-quote__preview-image" data-testid="im-message-reply-preview-image">
								<img
									class="bx-im-message-quote__preview-image_img"
									:src="messageFile.urlPreview"
									:alt="messageFile.name"
									loading="lazy"
								>
							</div>
						</template>

						<!-- Image / Video without preview: type icon -->
						<template v-else-if="isImage || isVideo">
							<div class="bx-im-message-quote__preview-file-icon" data-testid="im-message-reply-preview-icon">
								<div :class="iconClass" class="ui-icon" aria-hidden="true"><i></i></div>
							</div>
						</template>

						<!-- Audio: no icon; text label shown below -->
						<template v-else-if="isAudio"></template>

						<!-- Sticker: mini-thumbnail (falls back to text label when uri is absent) -->
						<template v-else-if="isSticker && stickerImageUri">
							<div class="bx-im-message-quote__preview-sticker" data-testid="im-message-reply-preview-sticker">
								<img
									class="bx-im-message-quote__preview-sticker_img"
									:src="stickerImageUri"
									:alt="replyText"
									loading="lazy"
								>
							</div>
						</template>
					</div>
					<div v-if="previewText" ref="text" class="bx-im-message-quote__text" v-html="previewText"></div>
					<button
						v-if="isExpandable"
						type="button"
						class="bx-im-message-quote__toggle"
						data-testid="im-message-reply-toggle-btn"
						@click.stop="toggleExpanded"
					>
						{{ toggleLabel }}
					</button>
				</template>

				<!-- Original, text only -->
				<template v-else>
					<div ref="text" class="bx-im-message-quote__text" v-html="replyText"></div>
					<button
						v-if="isExpandable"
						type="button"
						class="bx-im-message-quote__toggle"
						data-testid="im-message-reply-toggle-btn"
						@click.stop="toggleExpanded"
					>
						{{ toggleLabel }}
					</button>
				</template>
			</div>
		</div>
	`,
};
