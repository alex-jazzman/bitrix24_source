/* eslint-disable */
this.BX = this.BX || {};
this.BX.OpenLines = this.BX.OpenLines || {};
this.BX.OpenLines.v2 = this.BX.OpenLines.v2 || {};
this.BX.OpenLines.v2.Component = this.BX.OpenLines.v2.Component || {};
(function (exports, ui_iconSet_api_vue, ui_vue3_directives_hint, im_v2_component_message_base, im_v2_component_message_elements, im_v2_component_message_file, im_v2_const, im_v2_lib_dateFormatter, im_v2_lib_parser) {
	'use strict';

	const STICKER_MAX_SIZE = 166;

	// @vue/component
	const HiddenMessage = {
		name: 'HiddenMessage',
		components: {
			BaseMessage: im_v2_component_message_base.BaseMessage,
			MessageAttach: im_v2_component_message_elements.MessageAttach,
			ReactionList: im_v2_component_message_elements.ReactionList,
			MediaContent: im_v2_component_message_file.MediaContent,
			AudioItem: im_v2_component_message_elements.AudioItem,
			BaseFileItem: im_v2_component_message_elements.BaseFileItem,
			BIcon: ui_iconSet_api_vue.BIcon
		},
		directives: {
			hint: ui_vue3_directives_hint.hint
		},
		props: {
			item: {
				type: Object,
				required: true
			},
			dialogId: {
				type: String,
				required: true
			}
		},
		computed: {
			OutlineIcons: () => ui_iconSet_api_vue.Outline,
			message() {
				return this.item;
			},
			filesByType() {
				const audio = [];
				const media = [];
				const other = [];
				const files = (this.message.files ?? []).map(fileId => this.$store.getters['files/get'](fileId, true));
				for (const file of files) {
					if (file.type === im_v2_const.FileType.audio) {
						audio.push(file);
						continue;
					}
					const hasPreview = Boolean(file.image);
					const isMediaFile = [im_v2_const.FileType.image, im_v2_const.FileType.video].includes(file.type);
					if (isMediaFile && hasPreview) {
						media.push(file);
						continue;
					}
					other.push(file);
				}
				return {
					audio,
					media,
					other
				};
			},
			hasAudio() {
				return this.filesByType.audio.length > 0;
			},
			hasMedia() {
				return this.filesByType.media.length > 0;
			},
			hasOtherFiles() {
				return this.filesByType.other.length > 0;
			},
			hasAttaches() {
				return this.message.attach.length > 0;
			},
			mediaMessage() {
				return {
					...this.message,
					files: this.filesByType.media.map(file => file.id)
				};
			},
			stickerIdentifier() {
				return this.$store.getters['stickers/messages/getStickerByMessageId'](this.message.id);
			},
			isSticker() {
				return Boolean(this.stickerIdentifier);
			},
			sticker() {
				if (!this.stickerIdentifier) {
					return null;
				}
				return this.$store.getters['stickers/get'](this.stickerIdentifier);
			},
			hasStickerUri() {
				return Boolean(this.sticker?.uri);
			},
			stickerImageStyles() {
				if (!this.sticker?.width || !this.sticker?.height) {
					return {};
				}
				const ratio = this.sticker.width / this.sticker.height;
				const height = Math.min(Math.round(STICKER_MAX_SIZE / ratio), STICKER_MAX_SIZE);
				return {
					height: `${height}px`
				};
			},
			formattedText() {
				return im_v2_lib_parser.Parser.decodeMessage(this.item);
			},
			formattedDate() {
				return im_v2_lib_dateFormatter.DateFormatter.formatByCode(this.message.date, im_v2_lib_dateFormatter.DateCode.shortTimeFormat);
			},
			hintAvailable() {
				return {
					text: this.loc('IMOL_MESSAGE_HIDDEN_TOOLTIP_TEXT'),
					popupOptions: {
						angle: true,
						targetContainer: document.body,
						offsetTop: -10,
						offsetLeft: 5,
						bindOptions: {
							position: 'top'
						}
					}
				};
			}
		},
		methods: {
			loc(phraseCode) {
				return this.$Bitrix.Loc.getMessage(phraseCode);
			}
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
	`
	};

	exports.HiddenMessage = HiddenMessage;

})(this.BX.OpenLines.v2.Component.Message = this.BX.OpenLines.v2.Component.Message || {}, BX.UI.IconSet, BX.Vue3.Directives, BX.Messenger.v2.Component.Message, BX.Messenger.v2.Component.Message, BX.Messenger.v2.Component.Message, BX.Messenger.v2.Const, BX.Messenger.v2.Lib, BX.Messenger.v2.Lib);
//# sourceMappingURL=hidden.bundle.js.map
