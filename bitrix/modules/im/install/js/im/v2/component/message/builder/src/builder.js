import { BaseMessage } from 'im.v2.component.message.base';
import {
	DefaultMessageContent,
	MessageHeader,
	ReactionSelector,
	MessageKeyboard,
	MessageFooter,
	SourceListButton,
} from 'im.v2.component.message.elements';
import { Feature, FeatureManager } from 'im.v2.lib.feature';
import { type ImModelMessage } from 'im.v2.model';

import { MapBlock } from './components/map/map';
import { TextBlock } from './components/text/text';
import { ListBlock } from './components/list/list';
import { TitleBlock } from './components/title/title';
import { LineDivider } from './components/line-divider/line-divider';
import { SpaceDivider } from './components/space-divider/space-divider';
import { TableBlock } from './components/table/table';
import { AiAssistantSearch } from './components/ai-assistant-search/ai-assistant-search';

const UNKNOWN_BLOCK_TYPE = 'unknown';

// @vue/component
export const BuilderMessage = {
	name: 'BuilderMessage',
	components: {
		MessageHeader,
		MessageFooter,
		BaseMessage,
		DefaultMessageContent,
		ReactionSelector,
		MessageKeyboard,
		SourceListButton,
	},
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
	computed: {
		message(): ImModelMessage
		{
			return this.item;
		},
		messageBlocks(): Array<{ type: string; text: string }>
		{
			return this.$store.getters['messages/builder/getBlocks'](this.message.id);
		},
		isAvailable(): boolean
		{
			return FeatureManager.isFeatureAvailable(Feature.isMessageBuilderAvailable);
		},
		hasKeyboard(): boolean
		{
			return this.message.keyboard.length > 0;
		},
	},
	methods: {
		getComponentNameByType(type: string): string
		{
			const componentMap = {
				title: TitleBlock,
				text: TextBlock,
				unorderedList: ListBlock,
				orderedList: ListBlock,
				map: MapBlock,
				table: TableBlock,
				lineDivider: LineDivider,
				spaceDivider: SpaceDivider,
				aiAssistantSearch: AiAssistantSearch,
			};

			return componentMap[type] || UNKNOWN_BLOCK_TYPE;
		},
	},
	template: `
		<BaseMessage :item="item" :dialogId="dialogId" :afterMessageWidthLimit="false">
			<template #before-message v-if="$slots['before-message']">
				<slot name="before-message"></slot>
			</template>
			<div class="bx-im-message-default__container">
				<MessageHeader :withTitle="withTitle" :item="item" />
				<DefaultMessageContent
					:item="item"
					:dialogId="dialogId"
					:withAttach="false"
					:withText="false"
				>
					<template v-if="isAvailable">
						<component
							v-for="(block, index) in messageBlocks"
							:is="getComponentNameByType(block.type)"
							:key="index"
							:message="message"
							:block="block"
							:dialogId="dialogId"
						/>
						<SourceListButton :messageBlocks="messageBlocks" />
					</template>
				</DefaultMessageContent>
			</div>
			<MessageFooter :item="item" :dialogId="dialogId" />
			<template #after-message v-if="hasKeyboard">
				<MessageKeyboard :item="item" :dialogId="dialogId" />
			</template>
		</BaseMessage>
	`,
};
