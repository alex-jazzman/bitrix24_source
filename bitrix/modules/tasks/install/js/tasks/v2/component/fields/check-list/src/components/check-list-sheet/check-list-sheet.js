import { Event } from 'main.core';
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

			if (value === true)
			{
				Event.bind(document, 'keydown', this.handleKeyDown, { capture: true });
			}
			else
			{
				Event.unbind(document, 'keydown', this.handleKeyDown, { capture: true });
			}

			this.$emit('isShown', value);
		},
	},
	methods: {
		handleClose(): void
		{
			this.$emit('close');
		},
		handleKeyDown(event: KeyboardEvent): void
		{
			if (event.key === 'Escape')
			{
				this.handleClose();

				event.stopPropagation();
			}
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
