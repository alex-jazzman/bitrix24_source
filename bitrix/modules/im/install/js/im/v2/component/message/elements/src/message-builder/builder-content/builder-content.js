import { Feature, FeatureManager } from 'im.v2.lib.feature';
import { type ImModelMessage } from 'im.v2.model';

import { SourceListButton } from '../source-list-button/list-button.js';
import { AiAssistantSearch } from '../blocks/ai-assistant-search/ai-assistant-search';
import { CardBlock } from '../blocks/card/card';
import { GalleryBlock } from '../blocks/gallery/gallery.js';
import { LineDivider } from '../blocks/line-divider/line-divider';
import { ListBlock } from '../blocks/list/list';
import { MapBlock } from '../blocks/map/map';
import { SpaceDivider } from '../blocks/space-divider/space-divider';
import { TableBlock } from '../blocks/table/table';
import { TextBlock } from '../blocks/text/text';
import { TitleBlock } from '../blocks/title/title';

const UNKNOWN_BLOCK_TYPE = 'unknown';

// @vue/component
export const BuilderContent = {
	name: 'BuilderContent',
	components: { SourceListButton, CardBlock },
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
		hasBlocks(): boolean
		{
			return this.messageBlocks.length > 0;
		},
		maxWidthStyles(): { maxWidth?: string }
		{
			const REDUCED_WIDTH = 460;

			const blocksWithConstraints = new Set(['gallery', 'map']);
			const needMaxWidth = this.messageBlocks.some((block) => blocksWithConstraints.has(block.type));

			return needMaxWidth ? { maxWidth: `${REDUCED_WIDTH}px` } : {};
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
				card: CardBlock,
				gallery: GalleryBlock,
			};

			return componentMap[type] || UNKNOWN_BLOCK_TYPE;
		},
	},
	template: `
		<div v-if="isAvailable && hasBlocks" :style="maxWidthStyles">
			<component
				v-for="(block, index) in messageBlocks"
				:is="getComponentNameByType(block.type)"
				:key="index"
				:message="message"
				:block="block"
				:dialogId="dialogId"
			/>
			<SourceListButton :messageBlocks="messageBlocks" />
		</div>
	`,
};
