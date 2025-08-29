import { Dom } from 'main.core';
import './bottom-sheet.css';

// @vue/component
export const BottomSheet = {
	props: {
		isShown: {
			type: Boolean,
			required: true,
		},
		isExpanded: {
			type: Boolean,
			default: false,
		},
	},
	watch: {
		async isShown(): Promise<void>
		{
			await this.$nextTick();
			this.adjustPosition();
		},
	},
	mounted(): void
	{
		this.adjustPosition();
	},
	methods: {
		adjustPosition(): void
		{
			const container = this.$refs.container;
			if (!container)
			{
				return;
			}

			const previousElement = container.previousElementSibling;
			Dom.style(container, '--bottom-sheet-top', `${previousElement.offsetTop + previousElement.offsetHeight}px`);
		},
		freeze(): void {},
		unfreeze(): void {},
	},
	template: `
		<Transition name="b24-bottom-sheet">
			<div v-if="isShown" class="b24-bottom-sheet" :class="{ '--expanded': isExpanded }" ref="container">
				<slot></slot>
			</div>
		</Transition>
	`,
};
