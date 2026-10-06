import { Dom, type JsonObject } from 'main.core';
import { Lottie } from 'ui.lottie';
import { BIcon, Outline as OutlineIcons } from 'ui.icon-set.api.vue';

import { type AiAssistantSearchBlockType } from 'im.v2.const';

import AiAssistantAnimation from './animation/animation.json';

import { BaseBlock } from '../base/base';

import './ai-assistant-search.css';

// @vue/component
export const AiAssistantSearch = {
	name: 'AiAssistantSearch',
	components: { BaseBlock, BIcon },
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
	data(): JsonObject
	{
		return {
			isExpanded: false,
			isExpandable: false,
		};
	},
	computed: {
		OutlineIcons: () => OutlineIcons,
		aiAssistantSearchBlock(): AiAssistantSearchBlockType
		{
			return this.block;
		},
		chevronIcon(): string
		{
			return this.isExpanded ? OutlineIcons.CHEVRON_TOP_L : OutlineIcons.CHEVRON_DOWN_L;
		},
		chevronLabel(): string
		{
			return this.isExpanded
				? this.loc('IM_MESSAGE_BUILDER_AI_ASSISTANT_SEARCH_COLLAPSE')
				: this.loc('IM_MESSAGE_BUILDER_AI_ASSISTANT_SEARCH_EXPAND');
		},
		textClasses(): Object
		{
			return {
				'bx-im-message-block-ai-assistant-search__text': true,
				'--ellipsis': !this.isExpanded,
				'--expanded': this.isExpanded,
				'--has-chevron': this.isExpandable && !this.isExpanded,
			};
		},
	},
	watch: {
		'aiAssistantSearchBlock.text': function()
		{
			void this.updateToggleAvailability();
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
		void this.updateToggleAvailability();
	},
	beforeUnmount()
	{
		if (!this.currentAnimation)
		{
			return;
		}

		this.currentAnimation.destroy();
	},
	methods: {
		toggleExpanded()
		{
			if (!this.isExpandable)
			{
				return;
			}

			this.isExpanded = !this.isExpanded;
		},
		loc(phraseCode: string): string
		{
			return this.$Bitrix.Loc.getMessage(phraseCode);
		},
		async updateToggleAvailability()
		{
			await this.$nextTick();

			const textNode = this.$refs.text;
			if (!textNode)
			{
				return;
			}

			Dom.style(textNode, 'white-space', 'nowrap');
			const containerWidth = textNode.parentElement?.clientWidth ?? textNode.clientWidth;
			const isOverflowing = textNode.scrollWidth > containerWidth;
			Dom.style(textNode, 'white-space', '');

			this.isExpandable = isOverflowing;

			if (!isOverflowing)
			{
				this.isExpanded = false;
			}
		},
	},
	template: `
		<BaseBlock
			:message="message"
			:block="aiAssistantSearchBlock"
			:dialogId="dialogId"
		>
			<div class="bx-im-message-block-ai-assistant-search__container">
				<div class="bx-im-message-block-ai-assistant-search__width-anchor" aria-hidden="true"></div>
				<div class="bx-im-message-block-ai-assistant-search__title-container">
					<div class="bx-im-message-block-ai-assistant-search__icon" ref="animationContainer"></div>
					<div
						:title="aiAssistantSearchBlock.title"
						class="bx-im-message-block-ai-assistant-search__title --ellipsis"
					>
						{{ aiAssistantSearchBlock.title }}
					</div>
				</div>
				<div class="bx-im-message-block-ai-assistant-search__text-container">
					<div
						ref="text"
						:title="aiAssistantSearchBlock.text"
						:class="textClasses"
					>
						{{ aiAssistantSearchBlock.text }}
					</div>
					<button
						v-if="isExpandable"
						type="button"
						class="bx-im-message-block-ai-assistant-search__chevron"
						:aria-label="chevronLabel"
						:aria-expanded="isExpanded"
						data-testid="ai-assistant-search-expand-btn"
						@click.stop="toggleExpanded"
					>
						<BIcon
							:name="chevronIcon"
							aria-hidden="true"
						/>
					</button>
				</div>
			</div>
		</BaseBlock>
	`,
};
