/* eslint-disable */
this.BX = this.BX || {};
this.BX.Messenger = this.BX.Messenger || {};
this.BX.Messenger.v2 = this.BX.Messenger.v2 || {};
this.BX.Messenger.v2.Component = this.BX.Messenger.v2.Component || {};
(function (exports, ui_vue3, ui_vue3_directives_lazyload, im_v2_component_message_base, im_v2_component_message_elements, im_v2_const, im_v2_component_elements_avatar, im_v2_lib_parser) {
	'use strict';

	const ContactMessage = {
		name: 'ContactMessage',
		components: {
			BaseMessage: im_v2_component_message_base.BaseMessage,
			BaseUiAvatar: im_v2_component_elements_avatar.BaseUiAvatar,
			DefaultMessageContent: im_v2_component_message_elements.DefaultMessageContent,
			MessageFooter: im_v2_component_message_elements.MessageFooter,
			MessageHeader: im_v2_component_message_elements.MessageHeader,
			Reply: im_v2_component_message_elements.Reply,
			TextContent: im_v2_component_message_elements.TextContent
		},
		directives: {
			lazyload: ui_vue3_directives_lazyload.lazyload
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
		data() {
			return {
				displayedAvatarUrl: ''
			};
		},
		computed: {
			AvatarSize: () => im_v2_component_elements_avatar.AvatarSize,
			contactParams() {
				return this.item.componentParams;
			},
			contactName() {
				return [this.contactParams.lastName, this.contactParams.firstName].filter(Boolean).join(' ').trim();
			},
			contactPhone() {
				return this.contactParams.phones?.[0] ?? '';
			},
			contactCardLine() {
				return this.contactName === '' ? this.contactPhone : `${this.contactName}, ${this.contactPhone}`;
			},
			caption() {
				if (this.item.text === this.contactCardLine) {
					return '';
				}
				const cardLineSuffix = `\n${this.contactCardLine}`;
				if (!this.item.text.endsWith(cardLineSuffix)) {
					return '';
				}
				return this.item.text.slice(0, -cardLineSuffix.length);
			},
			formattedCaption() {
				return im_v2_lib_parser.Parser.decodeMessage({
					...this.item,
					text: this.caption
				});
			},
			isReply() {
				return this.item.replyId !== 0;
			},
			isForward() {
				return this.$store.getters['messages/isForward'](this.item.id);
			},
			avatarTitle() {
				return this.contactName || this.contactPhone;
			},
			avatarUrl() {
				for (const fileId of this.item.files) {
					const file = this.$store.getters['files/get'](fileId, true);
					if (file?.type === im_v2_const.FileType.image) {
						return file.mediaUrl?.preview?.[250] || file.urlPreview || file.urlShow;
					}
				}
				return '';
			},
			cardAriaLabel() {
				return this.loc('IM_MESSAGE_CONTACT_CARD_ACCESSIBILITY_LABEL');
			},
			nameAccessibilityLabel() {
				return this.loc('IM_MESSAGE_CONTACT_NAME_ACCESSIBILITY_LABEL');
			},
			phoneAccessibilityLabel() {
				return this.loc('IM_MESSAGE_CONTACT_PHONE_ACCESSIBILITY_LABEL');
			}
		},
		methods: {
			handleAvatarLazyLoad(event) {
				if (event.state === 'success') {
					this.displayedAvatarUrl = event.element.dataset.lazyloadSrc ?? '';
				}
			},
			loc(phraseCode) {
				return this.$Bitrix.Loc.getMessage(phraseCode, {});
			}
		},
		template: `
		<BaseMessage :item="item" :dialogId="dialogId" :afterMessageWidthLimit="false">
			<div class="bx-im-message-contact__message-container">
				<MessageHeader :withTitle="withTitle" :item="item" />
				<Reply
					v-if="isReply"
					:dialogId="dialogId"
					:replyId="item.replyId"
					:isForward="isForward"
				/>
				<TextContent
					v-if="caption"
					class="bx-im-message-contact__caption"
					:text="formattedCaption"
				/>
				<div
					class="bx-im-message-contact__container"
					role="group"
					:aria-label="cardAriaLabel"
					data-testid="im-contact-message-card"
				>
					<div class="bx-im-message-contact__avatar" aria-hidden="true">
						<BaseUiAvatar
							type="default"
							:size="AvatarSize.L"
							:url="displayedAvatarUrl"
							:title="avatarTitle"
							:withDefaultUserpic="false"
						/>
						<img
							v-if="avatarUrl && avatarUrl !== displayedAvatarUrl"
							:key="avatarUrl"
							v-lazyload="{ callback: handleAvatarLazyLoad }"
							:data-lazyload-src="avatarUrl"
							class="bx-im-message-contact__avatar-preloader"
							alt=""
						/>
					</div>
					<dl class="bx-im-message-contact__content">
						<dt v-if="contactName" class="bx-im-message-contact__accessibility-label">
							{{ nameAccessibilityLabel }}
						</dt>
						<dd
							v-if="contactName"
							class="bx-im-message-contact__name"
							data-testid="im-contact-message-name"
						>
							{{ contactName }}
						</dd>
						<dt class="bx-im-message-contact__accessibility-label">
							{{ phoneAccessibilityLabel }}
						</dt>
						<dd
							class="bx-im-message-contact__phone"
							:class="{ '--title': !contactName }"
							dir="ltr"
							data-testid="im-contact-message-phone"
						>
							{{ contactPhone }}
						</dd>
					</dl>
				</div>
				<DefaultMessageContent
					:item="item"
					:dialogId="dialogId"
					:withText="false"
					:withAttach="false"
					:withReply="false"
				/>
			</div>
			<MessageFooter :item="item" :dialogId="dialogId" />
		</BaseMessage>
	`
	};

	exports.ContactMessage = ContactMessage;

})(this.BX.Messenger.v2.Component.Message = this.BX.Messenger.v2.Component.Message || {}, BX.Vue3, BX.Vue3.Directives, BX.Messenger.v2.Component.Message, BX.Messenger.v2.Component.Message, BX.Messenger.v2.Const, BX.Messenger.v2.Component.Elements, BX.Messenger.v2.Lib);
//# sourceMappingURL=contact-message.bundle.js.map
