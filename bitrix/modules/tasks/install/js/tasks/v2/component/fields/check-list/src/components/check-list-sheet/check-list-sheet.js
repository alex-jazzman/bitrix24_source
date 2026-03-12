import { BottomSheet } from 'tasks.v2.component.elements.bottom-sheet';

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

			this.$emit('isShown', value);
		},
	},
	methods: {
		handleClose(): void
		{
			this.$emit('close');
		},
	},
	template: `
		<BottomSheet
			v-if="isShown"
			:sheetBindProps
			:padding="0"
			:popupPadding="0"
			@close="handleClose"
		>
			<slot :handleShow="$emit('show')" :handleClose="handleClose"/>
		</BottomSheet>
	`,
};
