import { Loc } from 'main.core';
import { LiveAnnouncer } from 'ui.a11y';
import { Outline } from 'ui.icon-set.api.vue';
import 'ui.icon-set.outline';
import { defineComponent } from 'ui.vue3';
import { AirButtonStyle, Button, ButtonSize } from 'ui.vue3.components.button';
import { CounterStyle } from 'ui.cnt';

import { SelectionMode } from '../../const/picker';
import { submitSelection } from '../../feature/confirm-selection/confirm-selection';
import { listFocusableControls } from '../../lib/composite-navigation/composite-navigation';
import { useSelectionStore } from '../../model/selection/selection';
import { useSessionStore } from '../../model/session/session';

import './selection-footer.css';

// The footer says what is picked and what can be done with it. On the left the set is one
// control — the word, the count and the cross that empties it — so that what it says and what it
// undoes are read as one thing. It is an outlined design-system button rather than a plate built
// here: the button carries a counter and a right icon of its own, and at its large size it stands
// exactly as tall as confirm across the footer. It shows only in multiple mode and only once
// something is picked, and it turns disabled while a confirmation is in flight, when emptying the
// set no longer changes its outcome — the count stays readable instead of leaving with the cross.
// On the right the two actions: confirm, disabled while the set is empty, and cancel, which
// closes without passing files.
// For the keyboard the buttons are all native Tab stops: Tab/Shift+Tab move between them like
// between any buttons, no arrow handling here. App only intercepts Tab at the true edge of this
// group (see isInsideActionsAwayFromEdge).
export const SelectionFooter = defineComponent({
	name: 'DiskPickerSelectionFooter',
	components: {
		Button,
	},
	setup(): Object
	{
		return { AirButtonStyle, ButtonSize, CounterStyle, Outline };
	},
	watch: {
		// The button of the set has to be named by what it does, and it exists only after the
		// tick. Immediate, because a footer can be mounted with a set already picked.
		chipVisible: {
			immediate: true,
			handler(visible: boolean): void
			{
				if (visible)
				{
					void this.$nextTick(() => this.nameReset());
				}
			},
		},
		// The name carries the count, so it is rewritten whenever the set changes size.
		count(): void
		{
			void this.$nextTick(() => this.nameReset());
		},
		// Vue's component watchers flush `pre`, i.e. before this component re-renders,
		// so moving focus off Confirm here still runs ahead of the DOM patch that sets
		// its native `disabled` attribute. Without this, a disabled focused button can
		// drop `document.activeElement` to `body` and starve the root Tab trap until the
		// request settles. A failed confirmation gives focus back to the available
		// action once loading clears.
		confirming(confirming: boolean): void
		{
			const root = this.$el as HTMLElement | undefined;
			const active = document.activeElement;
			if (!root || !(active === document.body || root.contains(active)))
			{
				return;
			}

			if (confirming)
			{
				const controls = listFocusableControls(root);
				// Cancel is the one action a confirmation in flight leaves enabled: both the set
				// and confirm turn disabled at that moment, so anything else standing here loses
				// its node under the focus.
				const cancel = controls[controls.length - 1];
				if (active !== cancel)
				{
					cancel?.focus();
				}

				return;
			}

			this.$nextTick(() => this.focusEntry());
		},
	},
	computed: {
		chipVisible(): boolean
		{
			return this.multipleMode && this.canConfirm;
		},
		count(): number
		{
			return useSelectionStore().count;
		},
		canConfirm(): boolean
		{
			return useSelectionStore().canConfirm;
		},
		confirming(): boolean
		{
			return useSessionStore().confirming;
		},
		confirmText(): string
		{
			return this.loc('DISK_PICKER_CONFIRM_ATTACH');
		},
		// The set is named on the left of the footer, so the button no longer carries a counter:
		// two counts of one set, side by side, said the same thing twice. The label is the phrase
		// the button used to show for a filled set — the same word, and translated already.
		countLabel(): string
		{
			return this.loc('DISK_PICKER_CONFIRM');
		},
		// Single mode has nothing to reset: the next click replaces the one picked file.
		multipleMode(): boolean
		{
			return useSessionStore().constraints.selectionMode === SelectionMode.Multiple;
		},
	},
	methods: {
		// What the button shows — the word of the set and its count — is not what it does, and
		// what it does is empty the whole set. So the name says both, and it opens with the words
		// that are on the button: a name that replaced the visible text would leave voice control
		// without the phrase a person reads aloud. The design-system button renders itself in
		// vanilla code and passes no attribute of ours through, so the name is set on the rendered
		// node; the native title on the wrapper is the visual hint and names nothing.
		nameReset(): void
		{
			const chip = this.$refs.chip as HTMLElement | null;
			chip?.querySelector('button')?.setAttribute(
				'aria-label',
				this.loc('DISK_PICKER_RESET_SELECTION_LABEL', { '#COUNT#': String(this.count) }),
			);
		},
		loc(messageCode: string, replacements?: { [key: string]: string }): string
		{
			return Loc.getMessage(messageCode, replacements) ?? '';
		},
		handleCancel(): void
		{
			useSessionStore().callbacks.requestCancel();
		},
		handleConfirm(): void
		{
			void submitSelection(useSessionStore().callbacks);
		},
		handleReset(): void
		{
			// A confirmation in flight holds its own copy of the ids and hands them to the
			// host whatever the store says afterwards, so an emptied set would not stop the
			// files from being attached.
			if (this.confirming)
			{
				return;
			}

			// The reset takes itself off the footer together with the set it empties, and confirm
			// turns disabled at the same moment, so the focus is parked on the footer itself: it
			// stays in the window, Tab goes on from here, and a held Enter that repeats after the
			// control is gone activates nothing.
			this.focusFooter();
			useSelectionStore().clear();
			// An emptied set is a state change nothing on screen reports: the count leaves the
			// footer together with the reset that emptied it.
			LiveAnnouncer.announce(this.loc('DISK_PICKER_RESET_SELECTION_DONE'));
		},
		focusFooter(): void
		{
			(this.$refs.root as HTMLElement | null)?.focus();
		},
		focusEntry(): boolean
		{
			const root = this.$el as HTMLElement | undefined;
			if (!root)
			{
				return false;
			}

			const target = listFocusableControls(root)[0];
			target?.focus();

			return target !== undefined;
		},
	},
	template: `
		<div
			ref="root"
			class="disk-picker-selection-footer"
			data-disk-picker-group="actions"
			tabindex="-1"
		>
			<div
				v-if="chipVisible"
				ref="chip"
				class="disk-picker-selection-footer__chip"
				:title="loc('DISK_PICKER_RESET_SELECTION')"
				data-testid="universal-disk-picker-selection-chip"
			>
				<Button
					:text="countLabel"
					:rightCounterValue="count"
					:rightCounterColor="CounterStyle.FILLED"
					:rightIcon="Outline.CROSS_M"
					:style="AirButtonStyle.OUTLINE_ACCENT_2"
					:size="ButtonSize.LARGE"
					:disabled="confirming"
					:dataset="{ testid: 'universal-disk-picker-reset-selection-btn' }"
					@click="handleReset"
				/>
			</div>
			<div class="disk-picker-selection-footer__actions">
				<Button
					:text="confirmText"
					:style="AirButtonStyle.FILLED"
					:size="ButtonSize.LARGE"
					:disabled="!canConfirm"
					:loading="confirming"
					:dataset="{ testid: 'universal-disk-picker-confirm-btn' }"
					@click="handleConfirm"
				/>
				<Button
					:text="loc('DISK_PICKER_CANCEL')"
					:style="AirButtonStyle.PLAIN"
					:size="ButtonSize.LARGE"
					:dataset="{ testid: 'universal-disk-picker-cancel-btn' }"
					@click="handleCancel"
				/>
			</div>
		</div>
	`,
});
