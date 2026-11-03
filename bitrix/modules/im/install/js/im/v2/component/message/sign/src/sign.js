import { Loc, Text, Type } from 'main.core';

import { Core } from 'im.v2.application.core';
import { ButtonColor, ChatButton, ButtonSize } from 'im.v2.component.elements.button';
import { BaseMessage } from 'im.v2.component.message.base';
import { DefaultMessage } from 'im.v2.component.message.default';
import { MessageStatus } from 'im.v2.component.message.elements';
import { Parser } from 'im.v2.lib.parser';
import { Utils } from 'im.v2.lib.utils';
import { type ImModelMessage } from 'im.v2.model';

import { metaData } from './const/configurations';
import { Await, Failure, Success, type SignButtonParams, type SignMessageComponentParams } from './const/sign';

import './css/sign.css';

const PARAMS_KEY = {
	STAGE_ID: 'stageId',
	USER: 'user',
	INITIATOR: 'initiator',
	DOCUMENT: 'document',
	HELP_ARTICLE: 'helpArticle',
	USER_MESSAGE: 'userMessage',
	ANNULLED_COUNT: 'annulledCount',
	ACTION_COMPLETED: 'actionCompleted',
};

// @vue/component
export const SignMessage = {
	name: 'SignMessage',
	components: { ChatButton, BaseMessage, DefaultMessage, MessageStatus },
	props: {
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
		message(): ImModelMessage
		{
			return this.item;
		},
		ButtonSize: () => ButtonSize,
		componentParams(): Object
		{
			return this.message.componentParams;
		},
		stageId(): string
		{
			return this.componentParams[PARAMS_KEY.STAGE_ID] ?? '';
		},
		user(): ?Object
		{
			return this.componentParams[PARAMS_KEY.USER];
		},
		initiator(): ?Object
		{
			return this.componentParams[PARAMS_KEY.INITIATOR];
		},
		document(): ?Object
		{
			return this.componentParams[PARAMS_KEY.DOCUMENT];
		},
		helpArticle(): ?string
		{
			return this.componentParams[PARAMS_KEY.HELP_ARTICLE] ?? '';
		},
		userMessage(): string
		{
			return this.componentParams[PARAMS_KEY.USER_MESSAGE] ?? '';
		},
		// The text comes as a safe BB-code representation, the parser escapes HTML before parsing
		// markup. Image embedding is off on purpose: the author's link to an image would otherwise
		// load remote content into the card for every signer (a tracking pixel), while links,
		// line breaks and emoji keep working.
		formattedUserMessage(): string
		{
			return Parser.decode({ text: this.userMessage, showImageFromLink: false });
		},
		// Marks where the system text ends and the sender's own text begins.
		userMessageHeader(): string
		{
			return Loc.getMessage('IM_MESSAGE_SIGN_USER_MESSAGE_HEADER');
		},
		annulledCount(): ?number
		{
			const count = this.componentParams[PARAMS_KEY.ANNULLED_COUNT];

			return Type.isNumber(count) ? count : null;
		},
		// The server marks a card once this recipient is no longer expected to act. A card sent before
		// the feature, or by an older server, carries no mark and keeps asking for the action.
		isActionCompleted(): boolean
		{
			return this.componentParams[PARAMS_KEY.ACTION_COMPLETED] === true;
		},
		// A card nobody has to act on loses the accent of its button, the same way the mobile card does.
		// The muted look is a ready colour of the button, not transparency over the accent one: opacity
		// takes the contrast of the label below the WCAG AA threshold, while this colour keeps it at
		// 5.85:1 over the muted background - above the accent button of an active card at 1.99:1.
		buttonColor(): string
		{
			return this.isActionCompleted ? ButtonColor.LightBorder : this.button?.color;
		},
		signData(): SignMessageComponentParams
		{
			const data = metaData[this.stageId];
			if (!data)
			{
				console.error('SignMessage: signData is undefined.');
			}

			return data;
		},
		title(): string
		{
			return this.resolvePhrase(this.signData?.title);
		},
		description(): string
		{
			return this.resolvePhrase(this.signData?.description);
		},
		button(): ?SignButtonParams
		{
			return this.signData?.button;
		},
		isAwaitSign(): boolean
		{
			return Object.values(Await).includes(this.stageId);
		},
		isSuccessSign(): boolean
		{
			return Object.values(Success).includes(this.stageId);
		},
		isFailureSign(): boolean
		{
			return Object.values(Failure).includes(this.stageId);
		},
		isSelfMessage(): boolean
		{
			return this.message.authorId === Core.getUserId();
		},
		containerClasses(): Object
		{
			return {
				'--self': this.isSelfMessage,
				'--await': this.isAwaitSign,
				'--success': this.isSuccessSign,
				'--failure': this.isFailureSign,
				'--completed': this.isActionCompleted,
			};
		},
	},
	methods:
	{
		// A card whose text depends on the number of annulled signings declares the
		// phrase as a function of that number and picks the plural form itself; every
		// other card is a plain string. A message written before the number existed
		// carries none, and such an action affected a single signing.
		resolvePhrase(phrase: string | ((annulledCount: number) => ?string)): string
		{
			if (Type.isFunction(phrase))
			{
				return phrase(this.annulledCount ?? 1) ?? '';
			}

			return phrase ?? '';
		},
		replacePhrase(phrase: ?string): string
		{
			let text = phrase ?? '';
			const userLink = Utils.user.getProfileLink(this.user?.id);
			const initiatorLink = Utils.user.getProfileLink(this.initiator?.id);
			const articleLink = `BX.Helper?.show('redirect=detail&code=${this.helpArticle}')`;
			const LINK_CLASS = 'bx-im-message-sign__link';
			const DOCUMENT_CLASS = 'bx-im-message-sign__document';

			const phrases = {
				'#DOCUMENT_NAME#': `<span class="${DOCUMENT_CLASS}">${Text.encode(this.document?.name)}</span>`,
				'#USER_LINK#': `<a href="${userLink}" class="${LINK_CLASS}">${Text.encode(this.user?.name)}</a>`,
				'#INITIATOR_LINK#': `<a href="${initiatorLink}" class="${LINK_CLASS}">${Text.encode(this.initiator?.name)}</a>`,
				'[helpdesklink]': `<a onclick="${articleLink}" class="${LINK_CLASS}">`,
				'[/helpdesklink]': '</a>',
			};

			Object.keys(phrases).forEach((code) => {
				text = text.replaceAll(code, phrases[code]);
			});

			return text;
		},
	},
	template: `
		<DefaultMessage v-if="!signData" :item="item" :dialogId="dialogId" />
		<BaseMessage
			v-else
			:dialogId="dialogId"
			:item="item"
			:withContextMenu="false"
			:withReactions="false"
			:withBackground="false"
			class="bx-im-message-sign__scope"
		>
			<div
				:class="['bx-im-message-sign__container', containerClasses]"
				:data-stage-id="stageId"
				:data-action-completed="isActionCompleted"
				data-testid="im-message-sign-root"
			>
				<div class="bx-im-message-sign__image" />
				<div class="bx-im-message-sign__content">
					<div class="bx-im-message-sign__title" data-testid="im-message-sign-title">
						{{ title }}
					</div>
					<div
						class="bx-im-message-sign__description"
						data-testid="im-message-sign-description"
						v-html="replacePhrase(description)"
					/>
					<div class="bx-im-message-sign__buttons_container">
						<ChatButton
							v-if="button"
							:size="ButtonSize.L"
							isRounded
							:text="button.text"
							:color="buttonColor"
							data-testid="im-message-sign-action-btn"
							@click="button.callback({ user, document })"
						/>
					</div>
					<div
						v-if="formattedUserMessage"
						class="bx-im-message-sign__user_message"
						data-testid="im-message-sign-user-message"
					>
						<div v-if="userMessageHeader" class="bx-im-message-sign__user_message-header">
							{{ userMessageHeader }}
						</div>
						<div
							class="bx-im-message-sign__user_message-text"
							data-testid="im-message-sign-user-message-text"
							v-html="formattedUserMessage"
						/>
					</div>
				</div>
				<div class="bx-im-message-sign__status_container">
					<MessageStatus :item="message" />
				</div>
			</div>
		</BaseMessage>
	`,
};
