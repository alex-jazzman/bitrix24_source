import { Dom, Event, Loc, Text } from 'main.core';
import { defineComponent, type PropType } from 'ui.vue3';
import { AirButtonStyle, Button as UiButton, ButtonSize } from 'ui.vue3.components.button';

import { saveSharing } from '../../feature/save-sharing/save-sharing';
import { notifyError, notifySuccess } from '../../lib/notify/notify';
import { type SharingStore, useSharingStore } from '../../model/sharing/sharing';

import './footer.css';

const SaveShortcutKey = 'Enter';

/**
 * The accelerator belongs to the popup, so the key is listened for on its window and not on the
 * page. The window is what the dialog gives the focus to on opening, so a press that no control
 * has taken arrives from there and not from the content below it.
 */
const PopupWindowSelector = '.popup-window';

const TestId = Object.freeze({
	save: { testid: 'disk-sharing-members-save' },
	close: { testid: 'disk-sharing-members-close' },
});

/**
 * The controls that own the key themselves: a field types into itself, a button clicks and a
 * menu item activates. Enter reaches the saving button only when none of them is focused.
 */
const InteractiveSelector = [
	'input',
	'textarea',
	'select',
	'button',
	'a[href]',
	'[contenteditable=""]',
	'[contenteditable="true"]',
	'[role="button"]',
	'[role="menuitem"]',
	'[role="menuitemcheckbox"]',
].join(',');

function claimsEnter(target: EventTarget | null): boolean
{
	return target instanceof Element && target.closest(InteractiveSelector) !== null;
}

type SetupState = {
	store: SharingStore,
	AirButtonStyle: typeof AirButtonStyle,
	ButtonSize: typeof ButtonSize,
	TestId: typeof TestId,
};

/**
 * The buttons of the popup. The dialog of the design system takes vanilla buttons only, so the
 * footer is a part of the content. The read-only mode keeps the closing button alone.
 */
export const Footer = defineComponent({
	name: 'DiskSharingFooter',
	components: {
		UiButton,
	},
	props: {
		closeDialog: {
			type: Function as PropType<() => void>,
			required: true,
		},
	},
	// the store is taken here, where the injection context of the component gives the pinia of the popup
	setup(): SetupState
	{
		return { store: useSharingStore(), AirButtonStyle, ButtonSize, TestId };
	},
	// a DOM node stays as it is in the state: Vue makes a proxy of plain objects only
	data(): { keydownTarget: HTMLElement | null, saveButtonId: string }
	{
		return {
			keydownTarget: null,
			// the design system button is rendered by its own vanilla class, so the id is the way to it
			saveButtonId: `disk-sharing-members-save-${Text.getRandom(8)}`,
		};
	},
	computed: {
		canSave(): boolean
		{
			return this.store.permission.canSave;
		},
		isSaving(): boolean
		{
			return this.store.isSaving;
		},
	},
	mounted(): void
	{
		Dom.attr(this.$el.querySelector(`#${this.saveButtonId}`), 'aria-keyshortcuts', SaveShortcutKey);

		// the dialog wraps the mounted content into its window, so the window is there a tick later
		void this.$nextTick(this.listenForShortcut);
	},
	beforeUnmount(): void
	{
		if (this.keydownTarget !== null)
		{
			Event.unbind(this.keydownTarget, 'keydown', this.handlePopupKeydown);
		}
	},
	methods: {
		loc(messageCode: string): string
		{
			return Loc.getMessage(messageCode) ?? '';
		},
		/**
		 * A popup that is gone leaves no window to look for, so an unmounted footer listens for
		 * nothing: the same check answers both the closed popup and the one that never opened.
		 */
		listenForShortcut(): void
		{
			const keydownTarget: HTMLElement | null = this.$el.closest(PopupWindowSelector);

			if (keydownTarget === null)
			{
				return;
			}

			this.keydownTarget = keydownTarget;
			Event.bind(keydownTarget, 'keydown', this.handlePopupKeydown);
		},
		/**
		 * Enter is the accelerator of the saving button, so it works wherever that button does.
		 * A running request needs no guard of its own: the saving scenario answers `ignored`
		 * to a second call. The entity selector opens on top of the popup and keeps the key.
		 */
		handlePopupKeydown(event: KeyboardEvent): void
		{
			const isPlainEnter = event.key === SaveShortcutKey
				&& !event.altKey
				&& !event.ctrlKey
				&& !event.metaKey
				&& !event.shiftKey;

			if (!isPlainEnter || event.defaultPrevented)
			{
				return;
			}

			// the focused control answers the key itself, and saving needs its button to be there
			if (claimsEnter(event.target) || this.store.isSelectorOpen || !this.canSave)
			{
				return;
			}

			void this.handleSave();
		},
		// the popup closes on a successful save only: an error leaves the draft where it is
		async handleSave(): Promise<void>
		{
			const result = await saveSharing(this.store);

			if (result.status === 'ignored')
			{
				return;
			}

			if (result.status === 'saved')
			{
				this.closeDialog();
				notifySuccess(result.successMessage);

				return;
			}

			notifyError(result.errorMessage);
		},
	},
	template: `
		<div class="disk-sharing-members-popup-footer">
			<UiButton
				v-if="canSave"
				:id="saveButtonId"
				:text="loc('JS_DISK_SHARING_MEMBERS_POPUP_BUTTON_SAVE')"
				:style="AirButtonStyle.FILLED"
				:size="ButtonSize.LARGE"
				:loading="isSaving"
				:dataset="TestId.save"
				@click="handleSave"
			/>
			<UiButton
				:text="loc('JS_DISK_SHARING_MEMBERS_POPUP_BUTTON_CLOSE')"
				:style="AirButtonStyle.PLAIN"
				:size="ButtonSize.LARGE"
				:dataset="TestId.close"
				@click="closeDialog"
			/>
		</div>
	`,
});
