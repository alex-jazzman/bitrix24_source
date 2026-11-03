/* eslint-disable */
this.BX = this.BX || {};
this.BX.Messenger = this.BX.Messenger || {};
this.BX.Messenger.v2 = this.BX.Messenger.v2 || {};
this.BX.Messenger.v2.Component = this.BX.Messenger.v2.Component || {};
(function (exports, main_core, im_v2_component_message_unsupported, im_v2_const, im_v2_lib_utils, im_v2_provider_service_uploading, im_v2_component_message_base, im_v2_component_message_elements, im_v2_lib_menu, im_v2_component_elements_mediaGallery, im_v2_lib_message, im_v2_lib_feature, im_v2_component_elements_player, im_v2_component_elements_progressbar) {
	'use strict';

	// @vue/component
	const AudioMessage = {
		name: 'AudioMessage',
		components: {
			BaseMessage: im_v2_component_message_base.BaseMessage,
			MessageHeader: im_v2_component_message_elements.MessageHeader,
			MessageFooter: im_v2_component_message_elements.MessageFooter,
			DefaultMessageContent: im_v2_component_message_elements.DefaultMessageContent,
			AudioItem: im_v2_component_message_elements.AudioItem,
			Reply: im_v2_component_message_elements.Reply
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
				default: false
			}
		},
		emits: ['cancelClick'],
		computed: {
			FileType: () => im_v2_const.FileType,
			message() {
				return this.item;
			},
			messageFile() {
				const firstFileId = this.message.files[0];
				return this.$store.getters['files/get'](firstFileId, true);
			},
			canSetReactions() {
				return main_core.Type.isNumber(this.message.id);
			},
			isReply() {
				return this.message.replyId !== 0;
			},
			isForward() {
				return this.$store.getters['messages/isForward'](this.message.id);
			}
		},
		methods: {
			onCancel(event) {
				this.$emit('cancelClick', event);
			}
		},
		template: `
		<BaseMessage :item="item" :dialogId="dialogId">
			<template #before-message>
				<slot name="before-message"/>
			</template>
			<div class="bx-im-message-audio__container">
				<MessageHeader :withTitle="withTitle" :item="item" class="bx-im-message-audio__header"/>
				<Reply v-if="isReply" :dialogId="dialogId" :replyId="message.replyId" :isForward="isForward" />
				<AudioItem
					:key="messageFile.id"
					:item="messageFile"
					:messageId="message.id"
					@cancelClick="onCancel"
				/>
			</div>
			<div class="bx-im-message-audio__default-message-container">
				<DefaultMessageContent :item="item" :dialogId="dialogId" :withReply="false" :withBuilder="true" />
			</div>
			<MessageFooter :item="item" :dialogId="dialogId" />
		</BaseMessage>
	`
	};

	// @vue/component
	const BaseFileMessage = {
		name: 'BaseFileMessage',
		components: {
			BaseMessage: im_v2_component_message_base.BaseMessage,
			DefaultMessageContent: im_v2_component_message_elements.DefaultMessageContent,
			BaseFileItem: im_v2_component_message_elements.BaseFileItem,
			MessageHeader: im_v2_component_message_elements.MessageHeader,
			MessageFooter: im_v2_component_message_elements.MessageFooter,
			Reply: im_v2_component_message_elements.Reply
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
		emits: ['cancelClick'],
		computed: {
			FileType: () => im_v2_const.FileType,
			message() {
				return this.item;
			},
			messageFile() {
				const firstFileId = this.message.files[0];
				return this.$store.getters['files/get'](firstFileId, true);
			},
			isReply() {
				return this.message.replyId !== 0;
			},
			isForward() {
				return this.$store.getters['messages/isForward'](this.message.id);
			}
		},
		created() {
			this.contextMenu = new im_v2_lib_menu.BaseFileContextMenu();
		},
		beforeUnmount() {
			this.contextMenu.destroy();
		},
		methods: {
			onOpenContextMenu({
				event,
				fileId
			}) {
				const context = {
					dialogId: this.dialogId,
					fileId,
					...this.message
				};
				this.contextMenu.openMenu(context, event.target);
			},
			onCancel(event) {
				this.$emit('cancelClick', event);
			}
		},
		template: `
		<BaseMessage :item="item" :dialogId="dialogId">
			<template #before-message>
				<slot name="before-message"/>
				<Reply v-if="isReply && !isForward" :dialogId="dialogId" :replyId="message.replyId" :isForward="isForward" />
			</template>
			<div class="bx-im-message-base-file__container">
				<MessageHeader :withTitle="withTitle" :item="item" class="bx-im-message-base-file__author-title" />
				<Reply v-if="isReply && isForward" :dialogId="dialogId" :replyId="message.replyId" :isForward="isForward" />
				<BaseFileItem
					:key="messageFile.id"
					:id="messageFile.id"
					:messageId="message.id"
					@openContextMenu="onOpenContextMenu"
					@cancelClick="onCancel"
				/>
				<DefaultMessageContent :item="item" :dialogId="dialogId" :withReply="false" :withBuilder="true" />
			</div>
			<MessageFooter :item="item" :dialogId="dialogId" />
		</BaseMessage>
	`
	};

	const FILES_LIMIT = 10;

	// @vue/component
	const FileCollectionMessage = {
		name: 'FileCollectionMessage',
		components: {
			BaseMessage: im_v2_component_message_base.BaseMessage,
			DefaultMessageContent: im_v2_component_message_elements.DefaultMessageContent,
			BaseFileItem: im_v2_component_message_elements.BaseFileItem,
			MessageHeader: im_v2_component_message_elements.MessageHeader,
			MessageFooter: im_v2_component_message_elements.MessageFooter,
			Reply: im_v2_component_message_elements.Reply
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
		emits: ['cancelClick'],
		computed: {
			FileType: () => im_v2_const.FileType,
			message() {
				return this.item;
			},
			messageId() {
				return this.message.id;
			},
			fileIds() {
				return this.message.files.slice(0, FILES_LIMIT);
			},
			isReply() {
				return this.message.replyId !== 0;
			},
			isForward() {
				return this.$store.getters['messages/isForward'](this.message.id);
			}
		},
		created() {
			this.contextMenu = new im_v2_lib_menu.BaseFileContextMenu();
		},
		beforeUnmount() {
			this.contextMenu.destroy();
		},
		methods: {
			onOpenContextMenu({
				event,
				fileId
			}) {
				const context = {
					dialogId: this.dialogId,
					fileId,
					...this.message
				};
				this.contextMenu.openMenu(context, event.target);
			},
			onCancel(event) {
				this.$emit('cancelClick', event);
			}
		},
		template: `
		<BaseMessage :item="item" :dialogId="dialogId">
			<template #before-message>
				<slot name="before-message"/>
				<Reply v-if="isReply && !isForward" :dialogId="dialogId" :replyId="message.replyId" :isForward="isForward" />
			</template>
			<div class="bx-im-message-file-collection__container">
				<MessageHeader :withTitle="withTitle" :item="item" class="bx-im-message-file-collection__author-title" />
				<Reply v-if="isReply && isForward" :dialogId="dialogId" :replyId="message.replyId" :isForward="isForward" />
				<div class="bx-im-message-file-collection__items">
					<BaseFileItem
						v-for="fileId in fileIds"
						:key="fileId"
						:id="fileId"
						:messageId="messageId"
						@openContextMenu="onOpenContextMenu"
						@cancelClick="onCancel"
					/>
				</div>
				<DefaultMessageContent
					:item="item"
					:dialogId="dialogId"
					:withReply="false"
					:withBuilder="true"
					class="bx-im-message-file-collection__default-content"
				/>
			</div>
			<MessageFooter :item="item" :dialogId="dialogId" />
		</BaseMessage>
	`
	};

	const SINGLE_IMAGE_CONTAINER_MAX_SIZE = {
		maxWidth: 460,
		maxHeight: 590
	};
	const SINGLE_IMAGE_CONTAINER_MIN_SIZE = {
		minWidth: 120,
		minHeight: 120
	};
	const SINGLE_IMAGE_WITH_TEXT_CONTAINER_MAX_SIZE = {
		maxWidth: 460,
		maxHeight: 590
	};
	const SINGLE_IMAGE_WITH_TEXT_CONTAINER_MIN_SIZE = {
		minWidth: 460,
		minHeight: 260
	};
	const GALLERY_MAX_WIDTH = 460;

	// @vue/component
	const MediaContent = {
		name: 'MediaContent',
		components: {
			VideoItem: im_v2_component_message_elements.VideoItem,
			MessageStatus: im_v2_component_message_elements.MessageStatus,
			MediaGallery: im_v2_component_elements_mediaGallery.MediaGallery,
			MediaGalleryItem: im_v2_component_elements_mediaGallery.MediaGalleryItem
		},
		props: {
			item: {
				type: Object,
				required: true
			},
			containerHeight: {
				type: [Number, null],
				default: null
			}
		},
		emits: ['cancelClick'],
		computed: {
			message() {
				return this.item;
			},
			files() {
				return this.$store.getters['messages/getMessageFiles'](this.message.id);
			},
			filesCount() {
				return this.files.length;
			},
			firstFile() {
				return this.files[0];
			},
			firstFileId() {
				return this.firstFile?.id;
			},
			hasText() {
				return this.message.text.length > 0;
			},
			hasAttach() {
				return this.message.attach.length > 0;
			},
			hasBuilderBlocks() {
				return this.$store.getters['messages/builder/hasBlocks'](this.message.id);
			},
			// Kept in step with MediaMessage.showBottomContainer: whatever puts content into the bubble
			// footer takes the status with it, otherwise the overlay status would be a second one.
			onlyMedia() {
				return !this.hasText && !this.hasAttach && !this.hasBuilderBlocks;
			},
			isSingleVideo() {
				return this.filesCount === 1 && this.firstFile.type === im_v2_const.FileType.video;
			},
			isSingleImage() {
				return this.filesCount === 1 && this.firstFile.type === im_v2_const.FileType.image;
			},
			singleImageMaxSize() {
				if (main_core.Type.isNumber(this.containerHeight)) {
					const {
						maxWidth,
						maxHeight
					} = SINGLE_IMAGE_CONTAINER_MAX_SIZE;
					const maxAllowedPreviewHeight = Math.min(maxHeight, this.containerHeight * 0.9);
					return {
						maxWidth,
						maxHeight: maxAllowedPreviewHeight
					};
				}
				return SINGLE_IMAGE_CONTAINER_MAX_SIZE;
			},
			imageWithTextMaxSize() {
				if (main_core.Type.isNumber(this.containerHeight)) {
					const {
						maxWidth,
						maxHeight
					} = SINGLE_IMAGE_WITH_TEXT_CONTAINER_MAX_SIZE;
					const maxAllowedPreviewHeight = Math.min(maxHeight, this.containerHeight * 0.9);
					return {
						maxWidth,
						maxHeight: maxAllowedPreviewHeight
					};
				}
				return SINGLE_IMAGE_WITH_TEXT_CONTAINER_MAX_SIZE;
			},
			singleImageSize() {
				if (this.onlyMedia) {
					return this.calcPreviewSize({
						...this.firstFile.image,
						...SINGLE_IMAGE_CONTAINER_MIN_SIZE,
						...this.singleImageMaxSize
					});
				}
				return this.calcPreviewSize({
					...this.firstFile.image,
					...SINGLE_IMAGE_WITH_TEXT_CONTAINER_MIN_SIZE,
					...this.imageWithTextMaxSize
				});
			}
		},
		methods: {
			onCancel(event) {
				this.$emit('cancelClick', event);
			},
			calcPreviewSize(options) {
				const {
					width,
					height,
					minWidth,
					minHeight,
					maxWidth,
					maxHeight
				} = options;
				const adjustedWidth = Math.min(Math.max(width, minWidth), maxWidth);
				const adjustedHeight = Math.min(Math.max(height, minHeight), maxHeight);
				if (adjustedWidth === width && adjustedHeight === height) {
					return {
						width,
						height
					};
				}
				const scale = Math.min(maxWidth / width, maxHeight / height, adjustedWidth / width, adjustedHeight / height);
				return {
					width: Math.max(Math.min(width * scale, maxWidth), minWidth),
					height: Math.max(Math.min(height * scale, maxHeight), minHeight)
				};
			},
			getGalleryMaxWidth() {
				return GALLERY_MAX_WIDTH;
			}
		},
		template: `
		<div class="bx-im-message-media-content__container">
			<div v-if="isSingleImage" class="bx-im-message-media-content__single-image">
				<MediaGalleryItem
					:file="firstFile"
					:size="singleImageSize"
					:handleLoading="true"
					@cancelClick="onCancel"
				/>
			</div>
			<div v-else-if="isSingleVideo" class="bx-im-message-media-content__single-video">
				<VideoItem
					:id="firstFileId"
					:message="message"
					@cancelClick="onCancel"
				/>
			</div>
			<div v-else class="bx-im-message-media-content__gallery">
				<MediaGallery
					:files="files"
					:width="getGalleryMaxWidth()"
					:handleLoading="true"
					@cancelClick="onCancel"
				/>
			</div>
			<div v-if="onlyMedia" class="bx-im-message-media-content__status-container">
				<MessageStatus :item="message" :isOverlay="true" />
			</div>
		</div>
	`
	};

	const MAX_GALLERY_WIDTH = 460;
	const MAX_SINGLE_MEDIA_WIDTH = 460;

	// @vue/component
	const MediaMessage = {
		name: 'MediaMessage',
		components: {
			ReactionList: im_v2_component_message_elements.ReactionList,
			BaseMessage: im_v2_component_message_base.BaseMessage,
			MessageStatus: im_v2_component_message_elements.MessageStatus,
			DefaultMessageContent: im_v2_component_message_elements.DefaultMessageContent,
			MessageHeader: im_v2_component_message_elements.MessageHeader,
			MessageFooter: im_v2_component_message_elements.MessageFooter,
			MediaContent,
			Reply: im_v2_component_message_elements.Reply
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
			},
			containerHeight: {
				type: [Number, null],
				default: 0
			}
		},
		emits: ['cancelClick'],
		computed: {
			message() {
				return this.item;
			},
			fileIds() {
				return this.message.files;
			},
			dialog() {
				return this.$store.getters['chats/get'](this.dialogId);
			},
			hasText() {
				return this.message.text.length > 0;
			},
			hasAttach() {
				return this.message.attach.length > 0;
			},
			hasBuilderBlocks() {
				return this.$store.getters['messages/builder/hasBlocks'](this.message.id);
			},
			hasReply() {
				return this.message.replyId !== 0;
			},
			hasError() {
				return im_v2_lib_message.messageHasError(this.message);
			},
			showContextMenu() {
				return this.onlyImage;
			},
			showBottomContainer() {
				// Blocks live in the same container as the caption, so a message whose whole content is
				// blocks needs it too - its own text may well be empty.
				return this.hasText || this.hasAttach || this.hasBuilderBlocks;
			},
			isForward() {
				return main_core.Type.isStringFilled(this.message.forward.id);
			},
			needBackground() {
				// A reply with media (image/gallery) renders without the common bubble — like a sticker reply:
				// the quote is a self-contained chip above the media, the media sits below with no background.
				// The bubble is still needed for a caption/attach (showBottomContainer), a channel post or a forward.
				return this.showBottomContainer || this.isChannelPost || this.isForward;
			},
			isChannelPost() {
				return [im_v2_const.ChatType.channel, im_v2_const.ChatType.openChannel].includes(this.dialog.type);
			},
			imageContainerStyles() {
				let maxWidth = MAX_SINGLE_MEDIA_WIDTH;
				if (this.fileIds.length > 1 || this.hasText) {
					maxWidth = MAX_GALLERY_WIDTH;
				}
				return {
					'max-width': `${maxWidth}px`
				};
			}
		},
		methods: {
			onCancel(event) {
				this.$emit('cancelClick', event);
			}
		},
		template: `
		<BaseMessage
			:item="item"
			:dialogId="dialogId"
			:withBackground="needBackground"
			:withMediaFrame="true"
		>
			<template #before-message>
				<slot name="before-message"/>
				<Reply
					v-if="hasReply && !isForward"
					class="bx-im-message-image__quote"
					:dialogId="dialogId"
					:replyId="message.replyId"
					:isForward="isForward"
				/>
			</template>
			<div
				class="bx-im-message-image__container"
				:class="{
					'--has-text': hasText,
				}"
				:style="imageContainerStyles"
			>
				<MessageHeader :withTitle="false" :item="item" class="bx-im-message-image__header" />
				<Reply v-if="hasReply && isForward" :dialogId="dialogId" :replyId="message.replyId" :isForward="isForward" />
				<MediaContent
					:item="message"
					:containerHeight="containerHeight"
					@cancelClick="onCancel"
				/>
				<div v-if="showBottomContainer" class="bx-im-message-image__bottom-container">
					<DefaultMessageContent
						:item="item"
						:dialogId="dialogId"
						:withText="hasText"
						:withAttach="hasAttach"
						:withReply="false"
						:withBuilder="true"
					/>
				</div>
				<MessageFooter :item="item" :dialogId="dialogId" />
			</div>
			<template #after-message>
				<div v-if="!showBottomContainer" class="bx-im-message-image__reaction-list-container">
					<ReactionList :messageId="message.id" />
				</div>
			</template>
		</BaseMessage>
	`
	};

	// @vue/component
	const VideoNoteCircle = {
		name: 'VideoNoteCircle',
		components: {
			ProgressBar: im_v2_component_elements_progressbar.ProgressBar,
			RoundVideoPlayer: im_v2_component_elements_player.RoundVideoPlayer
		},
		props: {
			item: {
				/** @type ImModelMessage */
				type: Object,
				required: true
			},
			fileId: {
				type: [String, Number],
				required: true
			},
			startWithSound: {
				type: Boolean,
				default: false
			},
			// The label came with the caption feature, so the views pass its availability down
			showTypeLabel: {
				type: Boolean,
				default: false
			}
		},
		emits: ['cancelClick', 'openTranscription'],
		computed: {
			message() {
				return this.item;
			},
			file() {
				return this.$store.getters['files/get'](this.fileId, true);
			}
		},
		methods: {
			loc(phraseCode) {
				return this.$Bitrix.Loc.getMessage(phraseCode);
			}
		},
		template: `
		<div class="bx-im-video-note__container" data-testid="im-message-video-note-circle">
			<span v-if="showTypeLabel" class="bx-im-video-note__type-label">{{ loc('IM_PARSER_ICON_TYPE_VIDEO_NOTE') }}</span>
			<ProgressBar
				:item="file"
				@cancelClick="$emit('cancelClick')"
			/>
			<RoundVideoPlayer
				:item="file"
				:message="message"
				:startWithSound="startWithSound"
				@openTranscription="$emit('openTranscription')"
			/>
		</div>
	`
	};

	// @vue/component
	const CaptionedVideoNote = {
		name: 'CaptionedVideoNote',
		components: {
			BaseMessage: im_v2_component_message_base.BaseMessage,
			DefaultMessageContent: im_v2_component_message_elements.DefaultMessageContent,
			MessageFooter: im_v2_component_message_elements.MessageFooter,
			MessageHeader: im_v2_component_message_elements.MessageHeader,
			Reply: im_v2_component_message_elements.Reply,
			VideoNoteCircle
		},
		props: {
			item: {
				/** @type ImModelMessage */
				type: Object,
				required: true
			},
			fileId: {
				type: [String, Number],
				required: true
			},
			dialogId: {
				type: String,
				required: true
			},
			startWithSound: {
				type: Boolean,
				default: false
			},
			showTypeLabel: {
				type: Boolean,
				default: false
			}
		},
		emits: ['cancelClick', 'openTranscription'],
		computed: {
			message() {
				return this.item;
			},
			hasReply() {
				return this.message.replyId !== 0;
			},
			isForward() {
				return this.$store.getters['messages/isForward'](this.message.id);
			}
		},
		template: `
		<BaseMessage :item="message" :dialogId="dialogId" data-testid="im-message-video-note-captioned-root">
			<template #before-message>
				<Reply
					v-if="hasReply"
					class="bx-im-captioned-video-note__quote"
					:dialogId="dialogId"
					:replyId="message.replyId"
					:isForward="isForward"
				/>
				<div class="bx-im-video-note__header_container">
					<MessageHeader :item="message" :isOverlay="true" />
				</div>
				<VideoNoteCircle
					:item="message"
					:fileId="fileId"
					:startWithSound="startWithSound"
					:showTypeLabel="showTypeLabel"
					@cancelClick="$emit('cancelClick')"
					@openTranscription="$emit('openTranscription')"
				/>
			</template>
			<div class="bx-im-captioned-video-note__default-message-container">
				<DefaultMessageContent :item="message" :dialogId="dialogId" :withReply="false" />
			</div>
			<MessageFooter :item="message" :dialogId="dialogId" />
		</BaseMessage>
	`
	};

	// @vue/component
	const VideoNote = {
		name: 'VideoNote',
		components: {
			BaseMessage: im_v2_component_message_base.BaseMessage,
			ReactionList: im_v2_component_message_elements.ReactionList,
			MessageStatus: im_v2_component_message_elements.MessageStatus,
			MessageHeader: im_v2_component_message_elements.MessageHeader,
			CompactCommentsPanel: im_v2_component_message_elements.CompactCommentsPanel,
			Reply: im_v2_component_message_elements.Reply,
			VideoNoteCircle
		},
		props: {
			item: {
				type: Object,
				required: true
			},
			fileId: {
				type: [String, Number],
				required: true
			},
			dialogId: {
				type: String,
				required: true
			},
			withTitle: {
				type: Boolean,
				default: true
			},
			startWithSound: {
				type: Boolean,
				default: false
			},
			showTypeLabel: {
				type: Boolean,
				default: false
			}
		},
		emits: ['cancelClick', 'openTranscription'],
		computed: {
			message() {
				return this.item;
			},
			hasReply() {
				return this.message.replyId !== 0;
			},
			isForward() {
				return this.$store.getters['messages/isForward'](this.message.id);
			}
		},
		template: `
		<BaseMessage
			:item="message"
			:dialogId="dialogId"
			:withBackground="false"
			data-testid="im-message-video-note-root"
		>
			<template #before-message>
				<div class="bx-im-video-note__header_container">
					<MessageHeader :item="message" :isOverlay="true" />
				</div>
			</template>
			<Reply
				v-if="hasReply"
				class="bx-im-video-note__reply"
				:dialogId="dialogId"
				:replyId="message.replyId"
				:isForward="isForward"
			/>
			<div class="bx-im-video-note__frame">
				<VideoNoteCircle
					:item="message"
					:fileId="fileId"
					:startWithSound="startWithSound"
					:showTypeLabel="showTypeLabel"
					@cancelClick="$emit('cancelClick')"
					@openTranscription="$emit('openTranscription')"
				/>
				<div class="bx-im-video-note__comments-panel">
					<CompactCommentsPanel :item="message" :dialogId="dialogId" />
				</div>
				<div class="bx-im-video-note__status_container">
					<MessageStatus :item="message" :isOverlay="true" />
				</div>
			</div>
			<template #after-message>
				<div class="bx-im-video-note__reaction-list-container">
					<ReactionList :messageId="message.id" :contextDialogId="dialogId" />
				</div>
			</template>
		</BaseMessage>
	`
	};

	// @vue/component
	const TranscribedVideoNote = {
		name: 'TranscribedVideoNote',
		components: {
			BaseMessage: im_v2_component_message_base.BaseMessage,
			DefaultMessageContent: im_v2_component_message_elements.DefaultMessageContent,
			MessageHeader: im_v2_component_message_elements.MessageHeader,
			MessageFooter: im_v2_component_message_elements.MessageFooter,
			TranscribedVideoPlayer: im_v2_component_elements_player.TranscribedVideoPlayer
		},
		props: {
			item: {
				type: Object,
				required: true
			},
			fileId: {
				type: [String, Number],
				required: true
			},
			dialogId: {
				type: String,
				required: true
			},
			withTitle: {
				type: Boolean,
				default: true
			},
			showCaption: {
				type: Boolean,
				default: false
			}
		},
		computed: {
			file() {
				return this.$store.getters['files/get'](this.fileId, true);
			},
			message() {
				return this.item;
			}
		},
		template: `
		<BaseMessage :item="item" :dialogId="dialogId" data-testid="im-message-video-note-transcribed-root">
			<div class="bx-im-transcribed-video-note-note__container">
				<MessageHeader 
					:withTitle="withTitle" 
					:item="message" 
					class="bx-im-transcribed-video-note__header" 
				/>
				<TranscribedVideoPlayer
					:item="file"
					:message="message"
					:withMessageText="showCaption"
					@closeTranscription="$emit('closeTranscription')"
					@clickPlay="$emit('clickPlay')"
				/>
			</div>
			<div class="bx-im-transcribed-video-note__default-message-container">
				<DefaultMessageContent :item="message" :dialogId="dialogId" :withText="showCaption" />
			</div>
			<MessageFooter :item="message" :dialogId="dialogId" />
		</BaseMessage>
	`
	};

	// @vue/component
	const VideoNoteMessage = {
		name: 'VideoNoteMessage',
		components: {
			CaptionedVideoNote,
			VideoNote,
			TranscribedVideoNote
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
		emits: ['cancelClick'],
		data() {
			return {
				isTranscriptionOpened: false,
				startWithSound: false
			};
		},
		computed: {
			message() {
				return this.item;
			},
			firstFileId() {
				return this.message.files[0];
			},
			hasText() {
				return this.message.text.trim().length > 0;
			},
			isCaptionFeatureAvailable() {
				return im_v2_lib_feature.FeatureManager.isFeatureAvailable(im_v2_lib_feature.Feature.isVideoNoteCaptionAvailable);
			},
			hasCaption() {
				return this.hasText && this.isCaptionFeatureAvailable;
			}
		},
		methods: {
			onTranscribedVideoPlayClick() {
				this.isTranscriptionOpened = false;
				this.startWithSound = true;
			},
			onOpenTranscription() {
				this.isTranscriptionOpened = true;
				this.startWithSound = false;
			}
		},
		template: `
		<transition name="fade" mode="out-in">
			<TranscribedVideoNote
				v-if="isTranscriptionOpened"
				:fileId="firstFileId"
				:dialogId="dialogId"
				:item="item"
				:withTitle="withTitle"
				:showCaption="hasCaption"
				@closeTranscription="isTranscriptionOpened = false"
				@clickPlay="onTranscribedVideoPlayClick"
				@cancelClick="$emit('cancelClick', $event)"
			/>
			<CaptionedVideoNote
				v-else-if="hasCaption"
				:startWithSound="startWithSound"
				:fileId="firstFileId"
				:dialogId="dialogId"
				:item="item"
				:showTypeLabel="isCaptionFeatureAvailable"
				@openTranscription="onOpenTranscription"
				@cancelClick="$emit('cancelClick', $event)"
			/>
			<VideoNote
				v-else
				:startWithSound="startWithSound"
				:fileId="firstFileId"
				:dialogId="dialogId"
				:item="item"
				:withTitle="withTitle"
				:showTypeLabel="isCaptionFeatureAvailable"
				@openTranscription="onOpenTranscription"
				@cancelClick="$emit('cancelClick', $event)"
			/>
		</transition>
	`
	};

	const FileMessageType = Object.freeze({
		media: 'MediaMessage',
		audio: 'AudioMessage',
		base: 'BaseFileMessage',
		collection: 'FileCollectionMessage',
		videoNote: 'VideoNoteMessage'
	});

	// @vue/component
	const FileMessage = {
		name: 'FileMessage',
		components: {
			BaseFileMessage,
			MediaMessage,
			AudioMessage,
			UnsupportedMessage: im_v2_component_message_unsupported.UnsupportedMessage,
			FileCollectionMessage,
			VideoNoteMessage
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
			},
			containerHeight: {
				type: [Number, null],
				default: null
			}
		},
		computed: {
			FileType: () => im_v2_const.FileType,
			message() {
				return this.$store.getters['messages/getById'](this.item.id);
			},
			messageFiles() {
				return this.$store.getters['messages/getMessageFiles'](this.item.id);
			},
			isGallery() {
				return im_v2_lib_utils.Utils.file.isGallery(this.messageFiles);
			},
			componentName() {
				if (this.messageFiles.length > 1) {
					return this.isGallery ? FileMessageType.media : FileMessageType.collection;
				}
				const file = this.messageFiles[0];
				// The composition of an edited message is in the model before the files it added are:
				// until they arrive there is no attachment to pick a component for
				if (!file) {
					return null;
				}
				const hasPreview = Boolean(file.image);
				if (file.isVideoNote) {
					// VideoNoteMessage does not accept the before-message slot (it uses BaseMessage's
					// before-message for its own overlay header), so forwarded slot content is dropped here.
					return FileMessageType.videoNote;
				}

				// A record reaches the chat in whatever container the browser wrote it, and the storage
				// reads the kind of a file from its extension: until the server brings the record to the
				// target format, the very same voice message is typed as video. It is routed by what it
				// is and not by the container it arrived in, or the player, the duration and the
				// transcription of a record on the server path would all be lost.
				if (file.isVoiceNote) {
					return FileMessageType.audio;
				}
				if (file.type === im_v2_const.FileType.image && hasPreview) {
					return FileMessageType.media;
				}
				if (file.type === im_v2_const.FileType.audio) {
					return FileMessageType.audio;
				}
				if (file.type === im_v2_const.FileType.video && hasPreview) {
					return FileMessageType.media;
				}
				return FileMessageType.base;
			},
			isRealMessage() {
				return this.$store.getters['messages/isRealMessage'](this.message.id);
			}
		},
		methods: {
			onCancel(event) {
				const canceledFileId = event.file.id;
				const uploadingService = im_v2_provider_service_uploading.UploadingService.getInstance();
				const uploaderId = uploadingService.getUploaderIdByFileId(canceledFileId);
				uploadingService.removeFileFromUploader({
					uploaderId,
					filesIds: [canceledFileId],
					restartUploading: true
				});
				const uploaderFiles = uploadingService.getFiles(uploaderId);
				if (main_core.Type.isArrayFilled(uploaderFiles)) {
					const actualMessageFiles = uploaderFiles.map(file => {
						return file.getId();
					});
					void this.$store.dispatch('messages/update', {
						id: this.message.id,
						fields: {
							files: actualMessageFiles
						}
					});
				} else {
					const chatId = this.message.chatId;
					void this.$store.dispatch('messages/delete', {
						id: this.message.id
					});
					const chat = this.$store.getters['chats/getByChatId'](chatId);
					const lastMessageId = this.$store.getters['messages/findLastChatMessageId'](chatId);
					if (main_core.Type.isString(lastMessageId) || main_core.Type.isNumber(lastMessageId)) {
						void this.$store.dispatch('recent/update', {
							dialogId: chat.dialogId,
							fields: {
								messageId: lastMessageId
							}
						});
					} else {
						void this.$store.dispatch('recent/hide', {
							dialogId: chat.dialogId
						});
					}
				}
			}
		},
		template: `
		<component
			v-if="componentName"
			:is="componentName"
			:item="message"
			:dialogId="dialogId"
			:withTitle="withTitle" 
			:containerHeight="containerHeight"
			:withContextMenu="isRealMessage"
			@cancelClick="onCancel"
		>
			<template v-if="$slots['before-message']" #before-message>
				<slot name="before-message"/>
			</template>
		</component>
	`
	};

	exports.FileMessage = FileMessage;
	exports.MediaContent = MediaContent;

})(this.BX.Messenger.v2.Component.Message = this.BX.Messenger.v2.Component.Message || {}, BX, BX.Messenger.v2.Component.Message, BX.Messenger.v2.Const, BX.Messenger.v2.Lib, BX.Messenger.v2.Service, BX.Messenger.v2.Component.Message, BX.Messenger.v2.Component.Message, BX.Messenger.v2.Lib, BX.Messenger.v2.Component.Elements, BX.Messenger.v2.Lib, BX.Messenger.v2.Lib, BX.Messenger.v2.Component.Elements, BX.Messenger.v2.Component.Elements);
//# sourceMappingURL=file-message.bundle.js.map
