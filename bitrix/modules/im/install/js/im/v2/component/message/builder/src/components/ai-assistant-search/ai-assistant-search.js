import { Lottie } from 'ui.lottie';

import { type AiAssistantSearchBlockType } from 'im.v2.const';

import AiAssistantAnimation from './animation/animation.json';

import { BaseBlock } from '../base/base';

import './ai-assistant-search.css';

// @vue/component
export const AiAssistantSearch = {
	name: 'AiAssistantSearch',
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
		aiAssistantSearchBlock(): AiAssistantSearchBlockType
		{
			return this.block;
		},
	},
	mounted()
	{
		this.currentAnimation = Lottie.loadAnimation({
			animationData: AiAssistantAnimation,
			container: this.$refs.animationContainer,
			renderer: 'svg',
			loop: true,
			autoplay: true,
		});
	},
	beforeUnmount()
	{
		if (!this.currentAnimation)
		{
			return;
		}

		this.currentAnimation.destroy();
	},
	template: `
		<BaseBlock
			:message="message"
			:block="aiAssistantSearchBlock"
			:dialogId="dialogId"
		>
			<div class="bx-im-message-block-ai-assistant-search__container">
				<div class="bx-im-message-block-ai-assistant-search__title-container">
					<div class="bx-im-message-block-ai-assistant-search__icon" ref="animationContainer"></div>
					<div 
						:title="aiAssistantSearchBlock.title" 
						class="bx-im-message-block-ai-assistant-search__title --ellipsis"
					>
						{{ aiAssistantSearchBlock.title }}
					</div>
				</div>
				<div 
					:title="aiAssistantSearchBlock.text" 
					class="bx-im-message-block-ai-assistant-search__text --ellipsis"
				>
					{{ aiAssistantSearchBlock.text }}
				</div>
			</div>
		</BaseBlock>
	`,
};
