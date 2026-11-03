import { Loc, Type } from 'main.core';
import { Outline as OutlineIcons } from 'ui.icon-set.api.vue';

import { IconButton } from 'im.v2.component.elements.icon-button';
import { Utils } from 'im.v2.lib.utils';
import { Parser } from 'im.v2.lib.parser';
import { Color, FileType, MessageComponent } from 'im.v2.const';
import { AvatarSize, BaseUiAvatar } from 'im.v2.component.elements.avatar';

import '../css/message-panel.css';

import type { ImModelMessage, ImModelFile, ImModelUser } from 'im.v2.model';

const NAME_MAX_LENGTH = 40;
const GALLERY_STACK_MAX = 3;

// @vue/component
export const ReplyPanel = {
	name: 'ReplyPanel',
	components: { BaseUiAvatar, IconButton },
	props:
	{
		messageId: {
			type: Number,
			required: true,
		},
	},
	emits: ['close'],
	computed:
	{
		AvatarSize: () => AvatarSize,
		OutlineIcons: () => OutlineIcons,
		closeIconColor: () => Color.gray90,
		message(): ImModelMessage
		{
			return this.$store.getters['messages/getById'](this.messageId);
		},
		replyAuthor(): ImModelUser
		{
			return this.$store.getters['users/get'](this.message.authorId);
		},
		replyTitle(): string
		{
			return this.replyAuthor ? this.replyAuthor.name : this.loc('IM_DIALOG_CHAT_QUOTE_DEFAULT_TITLE');
		},
		/** Files attached to the quoted message — read once, reused by the file/gallery computed below */
		messageFiles(): ImModelFile[]
		{
			return this.$store.getters['messages/getMessageFiles'](this.message.id);
		},
		messageFile(): ImModelFile
		{
			if (this.isContactMessage)
			{
				return this.messageFiles.find((file) => file.type === FileType.image);
			}

			return this.messageFiles[0];
		},
		contactAvatarTitle(): string
		{
			const params = this.message.componentParams ?? {};
			const name = [params.lastName, params.firstName].filter(Boolean).join(' ').trim();
			const phone = params.phones?.[0] ?? '';

			return name || phone;
		},
		contactAvatarUrl(): string
		{
			return this.messageFile?.mediaUrl?.preview?.[250]
				|| this.messageFile?.urlPreview
				|| this.messageFile?.urlShow
				|| '';
		},
		galleryCount(): number
		{
			return this.messageFiles.length;
		},
		galleryThumbnails(): ImModelFile[]
		{
			return this.messageFiles.slice(0, GALLERY_STACK_MAX);
		},
		galleryRemainingCount(): number
		{
			return Math.max(this.galleryCount - this.galleryThumbnails.length, 0);
		},
		/**
		 * Count modifier for the gallery stack. The stack items are absolutely positioned, so the
		 * container cannot size itself to its content; the width is set per shown-thumbnail count to
		 * keep the stack↔text spacing consistent between 2- and 3-media replies.
		 */
		galleryStackModifier(): string
		{
			return `--count-${this.galleryThumbnails.length}`;
		},
		isGallery(): boolean
		{
			return !this.isContactMessage
				&& !this.isMessageDeleted
				&& (this.isImage || this.isVideo)
				&& this.galleryCount > 1;
		},
		mediaCountText(): string
		{
			return Loc.getMessagePlural('IM_MESSAGE_REPLY_MEDIA_COUNT', this.galleryCount, {
				'#COUNT#': this.galleryCount,
			});
		},
		isFile(): boolean
		{
			return this.messageFile && this.messageFile.type === FileType.file;
		},
		isVideo(): boolean
		{
			return this.messageFile && this.messageFile.type === FileType.video;
		},
		/**
		 * Video note (round video message). Keeps FileType.video (no separate type); the round-message
		 * flag lives on the file. Shown as a compact round poster thumbnail (like a single media
		 * thumbnail) with no textual type label — the round shape conveys the type. The
		 * IM_PARSER_ICON_TYPE_VIDEO_NOTE phrase is still used as the image alt (a11y).
		 */
		isVideoNote(): boolean
		{
			return Boolean(this.messageFile && this.messageFile.isVideoNote);
		},
		isImage(): boolean
		{
			return this.messageFile && this.messageFile.type === FileType.image;
		},
		isContactMessage(): boolean
		{
			return this.message.componentId === MessageComponent.contactMessage;
		},
		isAudio(): boolean
		{
			return this.messageFile && this.messageFile.type === FileType.audio;
		},
		showIcon(): boolean
		{
			if (this.isContactMessage)
			{
				return false;
			}

			return this.messageFile ? !this.messageFile.urlPreview : false;
		},
		truncatedFileName(): string
		{
			return Utils.file.getShortFileName(this.messageFile.name, NAME_MAX_LENGTH);
		},
		fileSize(): string
		{
			if (!this.messageFile?.size)
			{
				return '';
			}

			return Utils.file.formatFileSize(this.messageFile.size);
		},
		isMessageDeleted(): boolean
		{
			return this.message.isDeleted;
		},
		isSticker(): boolean
		{
			return this.$store.getters['stickers/messages/isSticker'](this.message.id);
		},
		/** Sticker image URI of the quoted message (null if not a sticker or sticker data is not in store) */
		stickerImageUri(): ?string
		{
			if (!this.isSticker)
			{
				return null;
			}

			const stickerId = this.$store.getters['stickers/messages/getStickerByMessageId'](this.message.id);
			const sticker = this.$store.getters['stickers/get'](stickerId);

			return sticker?.uri ?? null;
		},
		messageText(): string
		{
			if (this.isContactMessage)
			{
				return Parser.getContactPreviewText(this.message, true) ?? Parser.purify(this.message);
			}

			if (this.isGallery)
			{
				return `${this.loc('IM_PARSER_ICON_TYPE_GALLERY')}, ${this.mediaCountText}`;
			}

			if (this.isFile)
			{
				return this.fileSize
					? `${this.truncatedFileName}, ${this.fileSize}`
					: this.truncatedFileName;
			}

			if (this.isAudio)
			{
				return this.loc('IM_TEXTAREA_REPLY_AUDIO_TITLE');
			}

			if (this.isMessageDeleted)
			{
				return this.loc('IM_TEXTAREA_REPLY_DELETED_TITLE');
			}

			if (this.isSticker)
			{
				// The mini-thumbnail already conveys the sticker type, so suppress the redundant
				// sticker label (IM_TEXTAREA_REPLY_STICKER_TITLE, mirrors the in-bubble quote).
				// Fall back to the label when the sticker image is not in the store yet.
				return this.stickerImageUri ? '' : this.loc('IM_TEXTAREA_REPLY_STICKER_TITLE');
			}

			return Parser.purify(this.message);
		},
		iconClass(): string
		{
			const iconType = Utils.file.getIconTypeByFilename(this.messageFile.name);

			return `ui-icon-file-${iconType}`;
		},
	},
	methods:
	{
		hasPreview(file): boolean
		{
			return Type.isStringFilled(file.urlPreview);
		},
		loc(phraseCode: string): string
		{
			return this.$Bitrix.Loc.getMessage(phraseCode);
		},
	},
	template: `
		<div
			class="bx-im-message-panel__container"
			:class="{'--contact-message': isContactMessage}"
			data-testid="im-textarea-reply-panel"
		>
			<div class="bx-im-message-panel__icon --quote"></div>
			<div v-if="isContactMessage" class="bx-im-message-panel__contact-avatar" data-testid="im-textarea-reply-contact-avatar">
				<BaseUiAvatar
					type="default"
					:size="AvatarSize.L"
					:url="contactAvatarUrl"
					:title="contactAvatarTitle"
					:withDefaultUserpic="false"
				/>
			</div>
			<div v-else-if="showIcon" class="bx-im-message-panel-file__icon">
				<div :class="iconClass" class="ui-icon"><i></i></div>
			</div>
			<div v-else-if="isGallery" class="bx-im-message-panel__gallery-stack" :class="galleryStackModifier" data-testid="im-textarea-reply-gallery-stack">
				<div
					v-for="file in galleryThumbnails"
					:key="file.id"
					class="bx-im-message-panel__gallery-stack-item"
				>
					<img
						v-if="hasPreview(file)"
						class="bx-im-message-panel__gallery-stack-img"
						:src="file.urlPreview"
						:alt="file.name"
					>
				</div>
				<span
					v-if="galleryRemainingCount > 0"
					class="bx-im-message-panel__gallery-badge"
					data-testid="im-textarea-reply-gallery-badge"
				>+{{ galleryRemainingCount }}</span>
			</div>
			<div v-else-if="isVideoNote && this.messageFile.urlPreview" class="bx-im-message-panel__video-note" data-testid="im-textarea-reply-video-note">
				<img
					v-if="this.messageFile.urlPreview"
					class="bx-im-message-panel__video-note_img"
					:src="this.messageFile.urlPreview"
					:alt="loc('IM_PARSER_ICON_TYPE_VIDEO_NOTE')"
				>
			</div>
			<div
				v-else-if="isImage || isVideo"
				class="bx-im-message-panel__image"
				:class="{'--contact-message': isContactMessage}"
			>
				<img
					v-if="this.messageFile.urlPreview"
					class="bx-im-message-panel__image_img"
					:src="this.messageFile.urlPreview"
		                  :alt="this.messageFile.name"
				>
			</div>
			<div v-else-if="isSticker && stickerImageUri" class="bx-im-message-panel__sticker" data-testid="im-textarea-reply-sticker">
				<img
					class="bx-im-message-panel__sticker_img"
					:src="stickerImageUri"
					:alt="loc('IM_TEXTAREA_REPLY_STICKER_TITLE')"
				>
			</div>
			<div class="bx-im-message-panel__content">
				<div class="bx-im-message-panel__title">{{ replyTitle }}</div>
				<div class="bx-im-message-panel__text" :class="{'--contact-message': isContactMessage}" data-testid="im-textarea-reply-text">{{ messageText }}</div>
			</div>
			<IconButton
				class="bx-im-message-panel__close"
				:iconName="OutlineIcons.CROSS_L"
				:iconColor="closeIconColor"
				:label="loc('IM_TEXTAREA_REPLY_PANEL_CLOSE_ARIA')"
				data-testid="im-textarea-reply-panel-close-btn"
				@click="$emit('close')"
			/>
		</div>
	`,
};
