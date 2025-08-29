import { Event } from 'main.core';

import { mapGetters } from 'ui.vue3.vuex';

import { BottomSheet } from 'tasks.v2.component.elements.bottom-sheet';
import { Model } from 'tasks.v2.const';

// @vue/component
export const CheckListSheet = {
	name: 'TaskCheckListSheet',
	components: {
		BottomSheet,
	},
	props: {
		isShown: {
			type: Boolean,
			required: true,
		},
	},
	emits: ['show', 'close', 'isShown'],
	data(): Object
	{
		return {
			isExpanded: false,
		};
	},
	computed: {
		...mapGetters({
			titleFieldOffsetHeight: `${Model.Interface}/titleFieldOffsetHeight`,
		}),
	},
	watch: {
		titleFieldOffsetHeight(): void
		{
			this.$refs.childComponent?.adjustPosition();
		},
		async isShown(value): void
		{
			await this.$nextTick();

			this.$emit('isShown', value);
		},
	},
	methods: {
		handleShow(): void
		{
			this.$emit('show');
		},
		handleClose(): void
		{
			this.$emit('close');
		},
	},
	template: `
		<BottomSheet
			:isShown="isShown"
			:isExpanded="isExpanded"
			:class="'--check-list'"
			ref="childComponent"
		>
			<slot
				:handleShow="handleShow"
				:handleClose="handleClose"
			></slot>
		</BottomSheet>
	`,
};
