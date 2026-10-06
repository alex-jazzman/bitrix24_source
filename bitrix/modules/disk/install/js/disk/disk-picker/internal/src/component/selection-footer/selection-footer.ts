import { Loc } from 'main.core';
import { defineComponent } from 'ui.vue3';
import { AirButtonStyle, Button, ButtonSize } from 'ui.vue3.components.button';

import { submitSelection } from '../../feature/confirm-selection/confirm-selection';
import { useSelectionStore } from '../../model/selection/selection';
import { useSessionStore } from '../../model/session/session';

import './selection-footer.css';

// Footer actions: Cancel closes without passing files; Confirm is disabled while
// the selection is empty and active with a counter once something is chosen. The
// design-system button carries the air styling and the counter itself; no custom
// buttons are built here.
export const SelectionFooter = defineComponent({
	name: 'DiskPickerSelectionFooter',
	components: {
		Button,
	},
	setup(): Object
	{
		return { AirButtonStyle, ButtonSize };
	},
	computed: {
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
			return this.canConfirm ? this.loc('DISK_PICKER_CONFIRM') : this.loc('DISK_PICKER_CONFIRM_EMPTY');
		},
	},
	methods: {
		loc(messageCode: string): string
		{
			return Loc.getMessage(messageCode) ?? '';
		},
		handleCancel(): void
		{
			useSessionStore().callbacks.requestCancel();
		},
		handleConfirm(): void
		{
			void submitSelection(useSessionStore().callbacks);
		},
	},
	template: `
		<div class="disk-picker-selection-footer">
			<Button
				:text="loc('DISK_PICKER_CANCEL')"
				:style="AirButtonStyle.PLAIN"
				:size="ButtonSize.LARGE"
				:dataset="{ testid: 'universal-disk-picker-cancel-btn' }"
				@click="handleCancel"
			/>
			<Button
				:text="confirmText"
				:style="AirButtonStyle.FILLED"
				:size="ButtonSize.LARGE"
				:disabled="!canConfirm"
				:loading="confirming"
				:right-counter-value="count"
				:dataset="{ testid: 'universal-disk-picker-confirm-btn' }"
				@click="handleConfirm"
			/>
		</div>
	`,
});
