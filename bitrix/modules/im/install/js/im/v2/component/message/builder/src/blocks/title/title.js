import { type ImModelMessageTitleBlockType } from 'im.v2.model';

import { BaseBlock } from '../base/base';

import './title.css';

// @vue/component
export const TitleBlock = {
	name: 'TitleBlock',
	components: { BaseBlock },
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
		titleBlock(): ImModelMessageTitleBlockType
		{
			return this.block;
		},
		containerClasses(): string[]
		{
			const classes = [];
			if (this.titleBlock.color)
			{
				classes.push(`--color-${this.titleBlock.color}`);
			}

			// eslint-disable-next-line unicorn/explicit-length-check
			if (this.titleBlock.size)
			{
				classes.push(`--size-${this.titleBlock.size}`);
			}

			return classes;
		},
	},
	template: `
		<BaseBlock
			:message="message"
			:block="titleBlock"
			:dialogId="dialogId"
		>
			<div class="bx-im-message-block-header__container" :class="containerClasses">
				<span
					:title="titleBlock.text"
					class="bx-im-message-block-header__text --line-clamp-3"
				>
					{{ titleBlock.text }}
				</span>
			</div>
		</BaseBlock>
	`,
};
