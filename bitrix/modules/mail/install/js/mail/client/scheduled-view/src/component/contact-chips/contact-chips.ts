import { Chip, ChipDesign, ChipSize, type ChipImage } from 'ui.system.chip.vue';
import { defineComponent, type PropType } from 'ui.vue3';

import './contact-chips.css';

export type ContactChip = {
	testId: string,
	text: string,
	avatar: string | null,
};

/**
 * Read-only list of contacts. `ui.system.chip` writes `tabindex="0"` into its root, which on this screen
 * gives a Tab stop with neither a role nor an action; the attribute is overwritten to keep the chip out of
 * the keyboard path and leave the name as plain text for the reader.
 */
// @vue/component
export const ContactChips = defineComponent({
	name: 'MailScheduledViewContactChips',
	components: { Chip } as { Chip: typeof Chip },
	props: {
		items: {
			type: Array as PropType<ContactChip[]>,
			default: (): ContactChip[] => [],
		},
	},
	setup()
	{
		return {
			chipDesign: ChipDesign.Tinted,
			chipSize: ChipSize.Md,
		};
	},
	methods: {
		/** The name stands right beside the avatar, so the picture is decorative and takes an empty alt. */
		imageOf(chip: ContactChip): ChipImage | null
		{
			return chip.avatar ? { src: chip.avatar, alt: '' } : null;
		},
	},
	template: `
		<div class="mail-scheduled-view-chips">
			<Chip
				v-for="item in items"
				:key="item.testId"
				:design="chipDesign"
				:size="chipSize"
				:text="item.text"
				:image="imageOf(item)"
				rounded
				tabindex="-1"
				:data-testid="item.testId"
			/>
		</div>
	`,
});
