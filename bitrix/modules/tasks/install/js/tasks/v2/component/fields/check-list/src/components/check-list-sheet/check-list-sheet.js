import { BottomSheet } from 'tasks.v2.component.elements.bottom-sheet';
import { syncBottomSheetModality } from 'tasks.v2.lib.bottom-sheet-aria';

// @vue/component
export const CheckListSheet = {
	name: 'TaskCheckListSheet',
	components: {
		BottomSheet,
	},
	props: {
		isEmpty: {
			type: Boolean,
			default: false,
		},
		isShown: {
			type: Boolean,
			required: true,
		},
		sheetBindProps: {
			type: Object,
			required: true,
		},
	},
	emits: ['show', 'close', 'isShown', 'addFastCheckList', 'resize'],
	watch: {
		async isShown(value): void
		{
			await this.$nextTick();

			if (value)
			{
				this.syncSheetModality();
			}

			this.$emit('isShown', value);
		},
	},
	methods: {
		setClosingByEsc(enabled: boolean): void
		{
			this.$refs.bottomSheet?.$refs.popup?.getPopupInstance()?.setClosingByEsc(enabled);
		},
		handleClose(): void
		{
			this.$emit('close');
		},
		syncSheetModality(): void
		{
			syncBottomSheetModality(this.$refs.bottomSheet);
		},
	},
	template: `
		<BottomSheet
			v-if="isShown"
			ref="bottomSheet"
			:sheetBindProps
			:padding="0"
			:popupPadding="0"
			:ariaLabel="loc('TASKS_V2_CHECK_LIST_SHEET_LABEL')"
			@close="handleClose"
		>
			<slot :handleShow="$emit('show')" :handleClose="handleClose"/>
		</BottomSheet>
	`,
};
