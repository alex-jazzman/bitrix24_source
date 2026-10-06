import { Chip, ChipDesign, ChipSize, type ChipImage } from 'ui.system.chip.vue';
import {
	BMenu,
	type MenuItemOptions,
	type MenuOptions,
	type MenuSectionOptions,
} from 'ui.system.menu.vue';
import { TextSm } from 'ui.system.typography.vue';
import { defineComponent, nextTick } from 'ui.vue3';

import { Phrase } from '../../const';
import { loc } from '../../lib/loc/loc';
import { getSelectedSender, useComposeState } from '../../model/compose/compose';
import { type SenderDto } from '../../model/compose/types';

import './sender-chip.css';

const MenuWidth = 300;
const SenderSectionCode = 'sender';

/**
 * `ui.system.menu` forwards no `dataset` to its popup and would otherwise give the container a random id, so
 * the menu is located by this one — the native anchor of a `main.popup` container.
 */
const MenuId = 'mail-compose-sender-menu';

/** `MenuItemOptions` requires every option, so only the ones filled here are picked. */
type SenderMenuItem = Pick<MenuItemOptions, 'title' | 'subtitle' | 'isSelected' | 'onClick' | 'sectionCode'>;

type SenderMenuOptions = Partial<Omit<MenuOptions, 'items' | 'sections'>> & {
	items: SenderMenuItem[],
	sections: Array<Pick<MenuSectionOptions, 'code' | 'title'>>,
};

/** The server normalizes the name; a record that came without one falls back to its address. */
function senderTitle(sender: SenderDto): string
{
	return sender.name === '' ? sender.email : sender.name;
}

/**
 * The sender list arrives ready from the server: the order of the payload is the order of the menu, and
 * nothing is filtered or sorted here. Only a mailbox of that list can be chosen, there is no hand-typed
 * sender.
 */
// @vue/component
export const SenderChip = defineComponent({
	name: 'MailComposeSenderChip',

	components: {
		BMenu,
		Chip,
		TextSm,
	},

	setup()
	{
		return {
			state: useComposeState(),
			chipDesign: ChipDesign.Tinted,
			chipSize: ChipSize.Md,
			menuWidth: MenuWidth,
			menuId: MenuId,
		};
	},

	data()
	{
		return {
			isMenuShown: false,
		};
	},

	computed: {
		sender(): SenderDto | null
		{
			return getSelectedSender(this.state);
		},

		chipText(): string
		{
			const { sender } = this;
			if (!sender)
			{
				return '';
			}

			return sender.name === '' ? sender.email : `${sender.name} (${sender.email})`;
		},

		label(): string
		{
			return loc(Phrase.SenderLabel);
		},

		/** The sender name stands right next to the avatar, so the image is decorative and gets an empty alt. */
		chipImage(): ChipImage | null
		{
			const avatar = this.sender?.avatar;

			return avatar ? { src: avatar, alt: '' } : null;
		},

		menuItems(): SenderMenuItem[]
		{
			return this.state.senders.map((sender: SenderDto): SenderMenuItem => {
				return {
					sectionCode: SenderSectionCode,
					title: senderTitle(sender),
					subtitle: sender.email,
					isSelected: sender.formated === this.state.selectedSender,
					onClick: (): void => {
						this.handleSelect(sender);
					},
				};
			});
		},

		menuOptions(): SenderMenuOptions
		{
			return {
				bindElement: (this.$refs.chip as { $el: HTMLElement }).$el,
				width: this.menuWidth,
				// Opened from the handlers of the chip, the menu leaves the focus on the chip, so the trap
				// is asked to take it. Only this key of the trap is taken over: returning the focus on
				// close stays with the menu (`ui/.../system/menu/src/menu.js:152-167, 169-185`).
				focusTrap: { initialFocus: true },
				sections: [{ code: SenderSectionCode, title: loc(Phrase.SenderMenuTitle) }],
				items: this.menuItems,
			};
		},
	},

	methods: {
		handleChipClick(): void
		{
			this.isMenuShown = true;
		},

		/**
		 * The chip answers Enter on its own; Space belongs to the button role just as much and would scroll
		 * the page instead of opening the picker.
		 */
		handleChipKeydown(event: KeyboardEvent): void
		{
			if (event.key === ' ')
			{
				event.preventDefault();
				this.isMenuShown = true;
			}
		},

		/** Only a sender of the list reaches this: the menu is built from that list. */
		handleSelect(sender: SenderDto): void
		{
			this.state.selectedSender = sender.formated;
			this.isMenuShown = false;
			void nextTick((): void => {
				(this.$el as HTMLElement | undefined)?.dispatchEvent(new window.Event('input', { bubbles: true }));
			});
		},
	},

	/**
	 * The design system renders the chip as a `div`, so the role it plays is spelled out here. The state of
	 * the menu is not: `ui.system.menu` stamps `aria-haspopup` and `aria-expanded` on its trigger itself and
	 * puts back whatever it found there on destroy, so a value written here would be the one restored — and
	 * the chip would report an open menu for good.
	 */
	template: `
		<div v-if="sender" class="mail-compose-sender-chip">
			<TextSm class-name="mail-compose-sender-chip__label">{{ label }}:</TextSm>
			<Chip
				ref="chip"
				class="mail-compose-sender-chip__control"
				role="button"
				:design="chipDesign"
				:size="chipSize"
				:text="chipText"
				:image="chipImage"
				rounded
				dropdown
				data-testid="mail-compose-sender-chip"
				@click="handleChipClick"
				@keydown="handleChipKeydown"
			/>
			<BMenu
				v-if="isMenuShown"
				:id="menuId"
				:options="menuOptions"
				@close="isMenuShown = false"
			/>
		</div>
	`,
});
