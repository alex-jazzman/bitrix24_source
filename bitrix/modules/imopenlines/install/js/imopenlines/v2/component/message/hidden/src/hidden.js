import { BIcon, Outline as OutlineIcons } from 'ui.icon-set.api.vue';
import { hint } from 'ui.vue3.directives.hint';

import { BaseMessage } from 'im.v2.component.message.base';
import { AudioItem, BaseFileItem, MessageAttach, ReactionList } from 'im.v2.component.message.elements';
import { MediaContent } from 'im.v2.component.message.file';
import { FileType } from 'im.v2.const';
import { DateCode, DateFormatter } from 'im.v2.lib.date-formatter';
import { Parser } from 'im.v2.lib.parser';
import { type ImModelFile, type ImModelMessage, type ImModelSticker, type ImModelStickerIdentifier } from 'im.v2.model';

import './css/hidden.css';

const STICKER_MAX_SIZE = 166;

// @vue/component
export const HiddenMessage = {
	name: 'HiddenMessage',
	components: { BaseMessage, MessageAttach, ReactionList, MediaContent, AudioItem, BaseFileItem, BIcon },
	directives: {
		hint,
	},
	props:
	{
		item: {
			type: Object,
			required: true,
		},
		dialogId: {
			type: String,
			required: true,
		},
	},
	computed:
	{
		OutlineIcons: () => OutlineIcons,
		message(): ImModelMessage
		{
			return this.item;
		},
		filesByType(): { audio: Array<ImModelFile>, media: Array<ImModelFile>, other: Array<ImModelFile> }
		{
			const audio = [];
			const media = [];
			const other = [];

			const files = (this.message.files ?? [])
				.map((fileId) => this.$store.getters['files/get'](fileId, true));

			for (const file of files)
			{
				if (file.type === FileType.audio)
				{
					audio.push(file);
					continue;
				}

				const hasPreview = Boolean(file.image);
				const isMediaFile = [FileType.image, FileType.video].includes(file.type);
				if (isMediaFile && hasPreview)
				{
					media.push(file);
					continue;
				}

				other.push(file);
			}

			return { audio, media, other };
		},
		hasAudio(): boolean
		{
			return this.filesByType.audio.length > 0;
		},
		hasMedia(): boolean
		{
			return this.filesByType.media.length > 0;
		},
		hasOtherFiles(): boolean
		{
			return this.filesByType.other.length > 0;
		},
		hasAttaches(): boolean
		{
			return this.message.attach.length > 0;
		},
		mediaMessage(): ImModelMessage
		{
			return { ...this.message, files: this.filesByType.media.map((file) => file.id) };
		},
		stickerIdentifier(): ?ImModelStickerIdentifier
		{
			return this.$store.getters['stickers/messages/getStickerByMessageId'](this.message.id);
		},
		isSticker(): boolean
		{
			return Boolean(this.stickerIdentifier);
		},
		sticker(): ?ImModelSticker
		{
			if (!this.stickerIdentifier)
			{
				return null;
			}

			return this.$store.getters['stickers/get'](this.stickerIdentifier);
		},
		hasStickerUri(): boolean
		{
			return Boolean(this.sticker?.uri);
		},
		stickerImageStyles(): { height?: string }
		{
			if (!this.sticker?.width || !this.sticker?.height)
			{
				return {};
			}

			const ratio = this.sticker.width / this.sticker.height;
			const height = Math.min(Math.round(STICKER_MAX_SIZE / ratio), STICKER_MAX_SIZE);

			return { height: `${height}px` };
		},
		formattedText(): string
		{
			return Parser.decodeMessage(this.item);
		},
		formattedDate(): string
		{
			return DateFormatter.formatByCode(this.message.date, DateCode.shortTimeFormat);
		},
		hintAvailable(): { text: string, popupOptions: Object<string, any> }
		{
			return {
				text: this.loc('IMOL_MESSAGE_HIDDEN_TOOLTIP_TEXT'),
				popupOptions: {
					angle: true,
					targetContainer: document.body,
					offsetTop: -10,
					offsetLeft: 5,
					bindOptions: {
						position: 'top',
					},
				},
			};
		},
	},
	methods:
	{
		loc(phraseCode: string): string
		{
			return this.$Bitrix.Loc.getMessage(phraseCode);
		},
	},
	template: `
		<BaseMessage
			:dialogId="dialogId"
			:item="item"
			:withTitle="false"
			:withBackground="false"
			:withReactions="false"
			class="bx-imol-message-hidden__container"
		>
			<div class="bx-imol-message-hidden__content">
				<div class="bx-imol-message-hidden-content__text" v-html="formattedText"></div>
				<div v-if="isSticker" class="bx-imol-message-hidden-content__block">
					<div
						v-if="hasStickerUri"
						class="bx-imol-message-hidden-content__sticker-image"
						:style="stickerImageStyles"
					>
						<img :src="sticker.uri" alt="" loading="lazy" />
					</div>
					<div v-else class="bx-imol-message-hidden-content__sticker-fallback">
						<BIcon :name="OutlineIcons.ALERT" />
						{{ loc('IM_MESSAGE_STICKER_EMPTY') }}
					</div>
				</div>
				<div v-if="hasAudio" class="bx-imol-message-hidden-content__block">
					<AudioItem
						v-for="file in filesByType.audio"
						:key="file.id"
						:item="file"
						:messageId="message.id"
					/>
				</div>
				<div v-if="hasMedia" class="bx-imol-message-hidden-content__block">
					<MediaContent :item="mediaMessage" />
				</div>
				<div v-if="hasOtherFiles" class="bx-imol-message-hidden-content__block">
					<BaseFileItem
						v-for="file in filesByType.other"
						:key="file.id"
						:id="file.id"
						:messageId="message.id"
					/>
				</div>
				<div v-if="hasAttaches" class="bx-imol-message-hidden-content__block">
					<MessageAttach :item="message" :dialogId="dialogId" />
				</div>
				<div class="bx-imol-message-hidden-content__bottom-panel">
					<div class="bx-imol-message-hidden-content__container-date">
						<div class="bx-imol-message-hidden-content__date">
							{{ formattedDate }}
						</div>
						<div
							v-hint="hintAvailable"
							class="bx-imol-message-hidden-content__lock"
						>
							<i class="fa-solid fa-lock"></i>
						</div>
					</div>
				</div>
			</div>
		</BaseMessage>
	`,
};
