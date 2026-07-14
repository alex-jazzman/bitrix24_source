import { Type } from 'main.core';

import { type AnyButtonBlock, type CardBlockType } from 'im.v2.const';
import { Parser } from 'im.v2.lib.parser';
import { Utils } from 'im.v2.lib.utils';

import { TextContent } from '../../../text-content/text-content.js';
import { BaseBlock } from '../base/base';
import { ButtonBlock } from '../button/button';

import './card.css';

// @vue/component
export const CardBlock = {
	name: 'CardBlock',
	components: { BaseBlock, TextContent, ButtonBlock },
	props: {
		message: {
			type: Object,
			required: true,
		},
		block: {
			type: Object,
			required: true,
		},
		dialogId: {
			type: String,
			required: true,
		},
	},
	computed: {
		cardBlock(): CardBlockType
		{
			return this.block;
		},
		imageSource(): string
		{
			const isImage = Utils.text.isUrlImageLike(this.cardBlock.imageUrl);
			if (!isImage)
			{
				return '';
			}

			return this.cardBlock.imageUrl;
		},
		hasTitle(): boolean
		{
			return Type.isStringFilled(this.cardBlock.title);
		},
		hasText(): boolean
		{
			return Type.isStringFilled(this.formattedText);
		},
		hasButtons(): boolean
		{
			return Type.isArrayFilled(this.cardBlock.buttons);
		},
		formattedText(): string
		{
			return Parser.decodeText(this.cardBlock.text);
		},
		purifiedText(): string
		{
			return Parser.purifyText(this.cardBlock.text);
		},
		buttons(): AnyButtonBlock[][]
		{
			return this.cardBlock.buttons ?? [];
		},
	},
	methods: {
		getButtonUniqueKey(button: AnyButtonBlock): string
		{
			return [
				button.type,
				button.title ?? '',
				button.actionId ?? '',
				button.url ?? '',
			].join('|');
		},
	},
	template: `
		<BaseBlock
			:message="message"
			:block="cardBlock"
			:dialogId="dialogId"
		>
			<div class="bx-im-message-block-card__container">
				<img
					v-if="imageSource" 
					:src="imageSource"
					alt=""
					class="bx-im-message-block-card__image"
				> 
				<div class="bx-im-message-block-card__content">
					<div class="bx-im-message-block-card__text">
						<div
							v-if="hasTitle"
							:title="cardBlock.title"
							class="bx-im-message-block-card__title --line-clamp-2"
						>
							{{ cardBlock.title }}
						</div>
						<div 
							v-if="hasText" 
							:title="purifiedText"
							class="bx-im-message-block-card__description" 
						>
							<TextContent :text="formattedText" />
						</div>
					</div>
					<div v-if="hasButtons" class="bx-im-message-block-card__buttons">
						<div 
							v-for="(buttonsRow, rowIndex) in buttons" 
							:key="rowIndex" 
							class="bx-im-message-block-card__buttons-row"
						>
							<ButtonBlock
								v-for="button in buttonsRow"
								:key="getButtonUniqueKey(button)"
								:block="button"
								:dialogId="dialogId"
								:message="message"
							/>
						</div>
					</div>
				</div>
			</div>
		</BaseBlock>
	`,
};
