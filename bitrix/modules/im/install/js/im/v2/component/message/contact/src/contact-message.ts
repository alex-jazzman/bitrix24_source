import 'ui.vue3';
import { lazyload } from 'ui.vue3.directives.lazyload';

import { BaseMessage } from 'im.v2.component.message.base';
import {
	DefaultMessageContent,
	MessageFooter,
	MessageHeader,
	Reply,
	TextContent,
} from 'im.v2.component.message.elements';
import { FileType } from 'im.v2.const';
import { AvatarSize, BaseUiAvatar } from 'im.v2.component.elements.avatar';
import { Parser } from 'im.v2.lib.parser';
import { type ImModelFile, type ImModelMessage } from 'im.v2.model';

import './css/contact-message.css';

type ContactParams = {
	firstName?: string,
	lastName?: string,
	phones?: string[],
};

type ContactMessageContext = {
	item: ImModelMessage,
	displayedAvatarUrl: string,
	contactParams: ContactParams,
	contactName: string,
	contactPhone: string,
	contactCardLine: string,
	caption: string,
	formattedCaption: string,
	avatarTitle: string,
	avatarUrl: string,
	loc: (phraseCode: string) => string,
	$store: {
		getters: {
			'files/get': (fileId: number, withDefault?: boolean) => ImModelFile,
			'messages/isForward': (messageId: number | string) => boolean,
		},
	},
	$Bitrix: {
		Loc: {
			getMessage: (phraseCode: string, replacements: { [key: string]: string }) => string,
		},
	},
};

// @vue/component
export const ContactMessage = {
	name: 'ContactMessage',
	components: {
		BaseMessage,
		BaseUiAvatar,
		DefaultMessageContent,
		MessageFooter,
		MessageHeader,
		Reply,
		TextContent,
	},
	directives: { lazyload },
	props: {
		item: {
			type: Object,
			required: true,
		},
		dialogId: {
			type: String,
			required: true,
		},
		withTitle: {
			type: Boolean,
			default: true,
		},
	},
	data(): Object
	{
		return {
			displayedAvatarUrl: '',
		};
	},
	computed: {
		AvatarSize: () => AvatarSize,
		contactParams(this: ContactMessageContext): ContactParams
		{
			return this.item.componentParams as ContactParams;
		},
		contactName(this: ContactMessageContext): string
		{
			return [this.contactParams.lastName, this.contactParams.firstName].filter(Boolean).join(' ').trim();
		},
		contactPhone(this: ContactMessageContext): string
		{
			return this.contactParams.phones?.[0] ?? '';
		},
		contactCardLine(this: ContactMessageContext): string
		{
			return this.contactName === '' ? this.contactPhone : `${this.contactName}, ${this.contactPhone}`;
		},
		caption(this: ContactMessageContext): string
		{
			if (this.item.text === this.contactCardLine)
			{
				return '';
			}

			const cardLineSuffix = `\n${this.contactCardLine}`;
			if (!this.item.text.endsWith(cardLineSuffix))
			{
				return '';
			}

			return this.item.text.slice(0, -cardLineSuffix.length);
		},
		formattedCaption(this: ContactMessageContext): string
		{
			return Parser.decodeMessage({ ...this.item, text: this.caption });
		},
		isReply(this: ContactMessageContext): boolean
		{
			return this.item.replyId !== 0;
		},
		isForward(this: ContactMessageContext): boolean
		{
			return this.$store.getters['messages/isForward'](this.item.id);
		},
		avatarTitle(this: ContactMessageContext): string
		{
			return this.contactName || this.contactPhone;
		},
		avatarUrl(this: ContactMessageContext): string
		{
			for (const fileId of this.item.files)
			{
				const file: ImModelFile = this.$store.getters['files/get'](fileId, true);
				if (file?.type === FileType.image)
				{
					return file.mediaUrl?.preview?.[250] || file.urlPreview || file.urlShow;
				}
			}

			return '';
		},
		cardAriaLabel(this: ContactMessageContext): string
		{
			return this.loc('IM_MESSAGE_CONTACT_CARD_ACCESSIBILITY_LABEL');
		},
		nameAccessibilityLabel(this: ContactMessageContext): string
		{
			return this.loc('IM_MESSAGE_CONTACT_NAME_ACCESSIBILITY_LABEL');
		},
		phoneAccessibilityLabel(this: ContactMessageContext): string
		{
			return this.loc('IM_MESSAGE_CONTACT_PHONE_ACCESSIBILITY_LABEL');
		},
	},
	methods: {
		handleAvatarLazyLoad(
			this: ContactMessageContext,
			event: { element: HTMLImageElement, state: 'success' | 'error' },
		): void
		{
			if (event.state === 'success')
			{
				this.displayedAvatarUrl = event.element.dataset.lazyloadSrc ?? '';
			}
		},
		loc(this: ContactMessageContext, phraseCode: string): string
		{
			return this.$Bitrix.Loc.getMessage(phraseCode, {});
		},
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
	`,
};
