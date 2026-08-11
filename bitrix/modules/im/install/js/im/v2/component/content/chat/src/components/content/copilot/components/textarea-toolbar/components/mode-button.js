import { Outline as OutlineIcons } from 'ui.icon-set.api.core';
import { ChipDesign, ChipSize, Chip } from 'ui.system.chip.vue';

import { ModeMenu } from '../classes/mode-menu';
import { ToolbarHint } from './toolbar-hint';

type ChipDesignItem = $Values<typeof ChipDesign>;
type OutlineIconItem = $Values<typeof OutlineIcons>;

// @vue/component
export const ModeButton = {
	name: 'ModeButton',
	components: { Chip, ToolbarHint },
	props: {
		dialogId: {
			type: String,
			required: true,
		},
		isActive: {
			type: Boolean,
			required: true,
		},
		isExpanded: {
			type: Boolean,
			default: true,
		},
	},
	emits: ['clearMode'],

	data()
	{
		return {
			isMenuOpen: false,
		};
	},
	computed: {
		OutlineIcons: () => OutlineIcons,
		isTempChat(): boolean
		{
			return this.$store.getters['copilot/chats/isTempChat'](this.dialogId);
		},
		ChipDesign: () => ChipDesign,
		ChipSize: () => ChipSize,
		chipText(): string
		{
			if (this.isActive)
			{
				return this.loc('IM_CONTENT_COPILOT_MODE_MENU_REASONING');
			}

			return this.loc('IM_CONTENT_COPILOT_MODE_BUTTON_HINT');
		},
		chipIcon(): OutlineIconItem
		{
			return OutlineIcons.AI_STARS;
		},
		chipDesign(): ChipDesignItem
		{
			if (this.isTempChat)
			{
				return ChipDesign.Disabled;
			}

			if (this.isActive)
			{
				return ChipDesign.OutlineBitrixGpt;
			}

			return ChipDesign.Outline;
		},
	},
	created()
	{
		this.menu = new ModeMenu();
		this.menu.subscribe(ModeMenu.events.close, () => {
			this.isMenuOpen = false;
		});
	},
	beforeUnmount()
	{
		this.menu.close();
	},
	methods: {
		toggleMenu()
		{
			if (this.isTempChat)
			{
				return;
			}

			const menuChipElement = this.$refs.button?.$el;

			this.menu.openMenu(
				{ dialogId: this.dialogId },
				menuChipElement,
			);
			this.isMenuOpen = true;
		},
		clearMode()
		{
			if (this.isTempChat)
			{
				return;
			}

			this.$emit('clearMode');
		},
		loc(phraseCode: string): string
		{
			return this.$Bitrix.Loc.getMessage(phraseCode);
		},
	},
	template: `
		<ToolbarHint 
			:text="loc('IM_CONTENT_COPILOT_MODE_BUTTON_HINT')" 
			:hintEnabled="!isExpanded && !isMenuOpen"
		>
			<Chip
				ref="button"
				:icon="chipIcon"
				:text="chipText"
				:rounded="true"
				:size="ChipSize.Sm"
				:design="chipDesign"
				:dropdown="!isActive && isExpanded"
				:withClear="isActive"
				:collapsed="!isExpanded"
				@click="toggleMenu"
				@clear="clearMode"
			/>
		</ToolbarHint>
	`,
};
