import { defineComponent, type Component, type PropType } from 'ui.vue3';

import { Feature, FeatureManager } from 'im.v2.lib.feature';
import { type ImModelMessage } from 'im.v2.model';

import { SourceListButton } from '../source-list-button/list-button';
import { AiAssistantSearch } from '../blocks/ai-assistant-search/ai-assistant-search';
import { AudioBlock } from '../blocks/audio/audio';
import { CardBlock } from '../blocks/card/card';
import { FileBlock } from '../blocks/file/file';
import { FormBlock } from '../blocks/form/form';
import { GalleryBlock } from '../blocks/gallery/gallery';
import { LineDivider } from '../blocks/line-divider/line-divider';
import { ListBlock } from '../blocks/list/list';
import { MapBlock } from '../blocks/map/map';
import { SpaceDivider } from '../blocks/space-divider/space-divider';
import { TableBlock } from '../blocks/table/table';
import { TextBlock } from '../blocks/text/text';
import { TitleBlock } from '../blocks/title/title';

const UNKNOWN_BLOCK_TYPE = 'unknown';

type FeatureName = (typeof Feature)[keyof typeof Feature];
type GatedBlock = { feature: FeatureName, component?: Component };

// Static block-type -> component map, built once at module load. Types gated behind a server
// feature flag are not listed here on purpose: they are resolved separately in
// getComponentNameByType.
const BLOCK_COMPONENT_MAP: { [blockType: string]: Component } = {
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

// Defensive client-side gate: the server validation is the primary one, the client only
// refuses to draw. A gated type renders when its feature flag is on and a component is
// registered for it; otherwise it falls through to the unknown-type fallback, the same path
// as any unknown block, so the rest of the message still renders.
const GATED_BLOCK_COMPONENT_MAP: { [blockType: string]: GatedBlock } = {
	form: { feature: Feature.isMessageFormBlockAvailable, component: FormBlock },
	file: { feature: Feature.isMessageFileAudioBlockAvailable, component: FileBlock },
	audio: { feature: Feature.isMessageFileAudioBlockAvailable, component: AudioBlock },
};

// @vue/component
export const BuilderContent = defineComponent({
	name: 'BuilderContent',
	components: { SourceListButton, CardBlock } as {
		SourceListButton: typeof SourceListButton,
		CardBlock: typeof CardBlock,
	},
	props: {
		item: {
			type: Object as PropType<ImModelMessage>,
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
		messageBlocks(): Array<{ id: string; type: string; text: string }>
		{
			return this.$store.getters['messages/builder/getBlocks'](this.message.id);
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
		getComponentNameByType(type: string): Component | string
		{
			const gatedBlock = GATED_BLOCK_COMPONENT_MAP[type];
			if (gatedBlock)
			{
				const { feature, component } = gatedBlock;

				return component && FeatureManager.isFeatureAvailable(feature)
					? component
					: UNKNOWN_BLOCK_TYPE;
			}

			return BLOCK_COMPONENT_MAP[type] || UNKNOWN_BLOCK_TYPE;
		},
	},
	template: `
		<div v-if="hasBlocks" :style="maxWidthStyles" data-testid="im-message-builder-content">
			<component
				v-for="block in messageBlocks"
				:is="getComponentNameByType(block.type)"
				:key="block.id"
				:message="message"
				:block="block"
				:dialogId="dialogId"
			/>
			<SourceListButton :messageBlocks="messageBlocks" :messageId="message.id" />
		</div>
	`,
});
