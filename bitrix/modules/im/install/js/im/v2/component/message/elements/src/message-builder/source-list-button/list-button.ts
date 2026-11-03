import { SidePanel } from 'main.sidepanel';
import { Chip, ChipDesign, ChipSize } from 'ui.system.chip.vue';
import { BIcon, Outline as OutlineIcons } from 'ui.icon-set.api.vue';
import { defineComponent, type PropType } from 'ui.vue3';

import { buildSliderId, SourceListSlider } from './components/list-slider/list-slider';

import './list-button.css';

// Module-level coordinator: id of the message whose source slider is currently open.
// When a new button is clicked, the slider of the previously opened message is closed first.
let openMessageId: number | string | null = null;

// @vue/component
export const SourceListButton = defineComponent({
	name: 'SourceListButton',
	components: { Chip, SourceListSlider, BIcon } as {
		Chip: typeof Chip,
		SourceListSlider: typeof SourceListSlider,
		BIcon: typeof BIcon,
	},
	props: {
		messageBlocks: {
			type: Array as PropType<Array<{ sources?: Record<string, unknown> }>>,
			required: true,
		},
		messageId: {
			type: [Number, String],
			required: true,
		},
	},
	data(): { showSlider: boolean }
	{
		return {
			showSlider: false,
		};
	},
	computed: {
		ChipSize: () => ChipSize,
		ChipDesign: () => ChipDesign,
		OutlineIcons(): typeof OutlineIcons
		{
			return OutlineIcons;
		},
		hasSources(): boolean
		{
			return this.messageBlocks.some((block) => {
				return block.sources && Object.keys(block.sources).length > 0;
			});
		},
	},
	beforeUnmount()
	{
		// Only clear the coordinator if this message owns the open slider. Its own
		// SourceListSlider.beforeUnmount → closeSlider() handles the actual close idempotently.
		if (openMessageId === this.messageId)
		{
			openMessageId = null;
		}
	},
	methods: {
		handleButtonClick()
		{
			if (this.showSlider)
			{
				SidePanel.Instance.getSlider(buildSliderId(this.messageId))?.close();

				return;
			}

			// Close the previously opened message's slider by its message-derived id.
			// This is intentionally idempotent: that slider's own beforeUnmount → closeSlider()
			// is a safe no-op afterwards (getSlider() returns null once it is already closed).
			if (openMessageId !== null && openMessageId !== this.messageId)
			{
				SidePanel.Instance.getSlider(buildSliderId(openMessageId))?.close();
			}

			openMessageId = this.messageId;
			this.showSlider = true;
		},
		handleSliderClose()
		{
			this.showSlider = false;
			if (openMessageId === this.messageId)
			{
				openMessageId = null;
			}
		},
		loc(phraseCode: string): string
		{
			return this.$Bitrix.Loc.getMessage(phraseCode);
		},
	},
	template: `
		<span
			v-if="hasSources"
			:title="loc('IM_MESSAGE_BUILDER_SOURCES_BUTTON')"
			class="bx-im-message-source-list-button__container --ui-hoverable"
			@click="handleButtonClick"
		>
			<BIcon :name="OutlineIcons.EARTH" />
			<span class="--ellipsis">{{ loc('IM_MESSAGE_BUILDER_SOURCES_BUTTON') }}</span>
		</span>
		<SourceListSlider v-if="showSlider" :messageBlocks="messageBlocks" :messageId="messageId" @close="handleSliderClose"/>
	`,
});
