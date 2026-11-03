import { PopupManager } from 'main.popup';
import { FocusNavigator } from 'ui.a11y';
import { Outline as OutlineIcons } from 'ui.icon-set.api.vue';

import { IconButton } from 'im.v2.component.elements.icon-button';
import { Color, PopupType } from 'im.v2.const';
import { Analytics } from 'im.v2.lib.analytics';

import { EmotePopup } from './components/emote-popup';
import { runWhenVisible } from './helpers/deferred-activation';

import type { JsonObject } from 'main.core';

const ICON_SIZE = 24;

// The roving entry (`tabindex="0"`) of the active grid - the cell Tab would land on. Focusing the
// first focusable element of the popup instead would land on the create-pack button or a pack tab of
// the sticker header, which come before the grid.
const GRID_ENTRY_SELECTOR = '[role="grid"] [tabindex="0"]';

function getGridEntry(container: HTMLElement): HTMLElement | null
{
	const gridEntry = container.querySelector(GRID_ENTRY_SELECTOR);

	return gridEntry instanceof HTMLElement ? gridEntry : null;
}

// @vue/component
export const EmoteSelector = {
	name: 'EmoteSelector',
	components: { IconButton, EmotePopup },
	props: {
		dialogId: {
			type: String,
			required: true,
		},
	},
	data(): JsonObject
	{
		return {
			showPopup: false,
		};
	},
	computed: {
		OutlineIcons: () => OutlineIcons,
		ICON_SIZE: () => ICON_SIZE,
		iconColor(): string
		{
			return Color.gray40;
		},
	},
	created(): void
	{
		// Cancels a pending wait for the grid entry of the popup; must stay out of reactive state.
		this.cancelPopupFocus = null;
	},
	beforeUnmount(): void
	{
		this.cancelPopupFocus?.();
	},
	methods: {
		openSelector(event: MouseEvent): void
		{
			this.showPopup = true;
			Analytics.getInstance().stickers.onOpenEmoteSelector(this.dialogId);

			// A click without pointer data means the button was activated from the keyboard. Opening with
			// the mouse leaves focus in the input field, where the click handler put it.
			if (event.detail === 0)
			{
				void this.$nextTick(() => {
					this.focusPopupContent();
				});
			}
		},
		focusPopupContent(): void
		{
			// The popup content is rendered at the end of the document, so Tab does not lead into it:
			// without this move the grid is unreachable from the keyboard.
			const popup = PopupManager.getPopupById(PopupType.emoteSelector) ?? null;
			if (popup === null)
			{
				return;
			}

			const container = popup.getPopupContainer();

			this.cancelPopupFocus?.();
			// The wait is for the cell, not only for the popup around it: the sticker grid holds a
			// skeleton until its first page arrives.
			this.cancelPopupFocus = runWhenVisible(
				container,
				() => {
					// A focus trap parks focus on the dialog shell when it has nothing better to offer, and
					// that is the state this move exists to replace - so the container itself does not count
					// as "already inside". Order does not matter: the trap applies its initial focus only
					// while nothing inside the dialog holds it.
					const activeElement = document.activeElement;
					if (activeElement !== container && container.contains(activeElement))
					{
						return;
					}

					this.focusGridEntry(container);
				},
				() => getGridEntry(container) !== null,
			);
		},
		focusGridEntry(container: HTMLElement): void
		{
			const gridEntry = getGridEntry(container);
			if (gridEntry !== null)
			{
				gridEntry.focus({ preventScroll: true });

				return;
			}

			// The wait ran out of frames: no grid at all, or packs that never arrived. Keep the popup
			// reachable from the keyboard.
			FocusNavigator.focusFirst(container, { tabbableOnly: false, preventScroll: true });
		},
		onPopupClose(): void
		{
			// Closing while the popup is still fading leaves the wait for the grid entry alive, and out of
			// frames it moves focus anyway - into a container that is already gone, off the trigger.
			this.cancelPopupFocus?.();
			this.returnFocusToTrigger();
			this.showPopup = false;
		},
		returnFocusToTrigger(): void
		{
			// Focus has to leave the popup while it is still alive: main.popup removes the whole subtree
			// on close, and focus caught inside falls to the body, from where the platform picks a place
			// of its own - after an emoji insert that is the input field, not the trigger. The restore of
			// a focus trap does not always land before the subtree goes, and does not double this move
			// either - on deactivation a trap keeps focus that already stands outside it.
			const popup = PopupManager.getPopupById(PopupType.emoteSelector) ?? null;
			if (popup === null)
			{
				return;
			}

			// Only restore when focus still lives inside the popup and would be lost on close. A mouse
			// user keeps focus in the input field, and moving it to the trigger would be a new jump.
			if (popup.getPopupContainer().contains(document.activeElement))
			{
				this.$refs.trigger?.$el?.focus({ preventScroll: true });
			}
		},
		loc(phraseCode: string): string
		{
			return this.$Bitrix.Loc.getMessage(phraseCode);
		},
	},
	template: `
		<div ref="stickerSelectorIcon" class="bx-im-textarea__icon-container">
			<IconButton
				ref="trigger"
				:iconName="OutlineIcons.SMILE"
				:label="loc('IM_TEXTAREA_ICON_EMOTE')"
				:iconSize="ICON_SIZE"
				:iconColor="iconColor"
				aria-haspopup="dialog"
				class="bx-im-textarea__icon"
				data-testid="im-textarea-emote-btn"
				@click="openSelector"
			/>
		</div>
		<EmotePopup
			v-if="showPopup"
			:bindElement="$refs.stickerSelectorIcon"
			:dialogId="dialogId"
			@close="onPopupClose"
		/>
	`,
};
