import { defineComponent } from 'ui.vue3';

export const TrailingSpacerBlock = defineComponent({
	name: 'TrailingSpacerBlock',

	data(): { spacerHeight: number }
	{
		return {
			spacerHeight: 0,
		};
	},

	mounted(): void
	{
		(this as any).resizeObserver = new ResizeObserver(() => {
			this.updateHeight();
		});

		this.syncObservedElements();
		this.updateHeight();
	},

	updated(): void
	{
		this.syncObservedElements();
		this.updateHeight();
	},

	beforeUnmount(): void
	{
		(this as any).resizeObserver?.disconnect?.();
	},

	methods: {
		getContentContainer(): null | HTMLElement
		{
			const container = (this.$el as HTMLElement)?.parentElement;

			return container instanceof HTMLElement ? container : null;
		},

		getLastBlock(): null | HTMLElement
		{
			const lastBlock = (this.$el as HTMLElement)?.previousElementSibling;

			return lastBlock instanceof HTMLElement ? lastBlock : null;
		},

		getContentGap(container: HTMLElement): number
		{
			const computedStyle = window.getComputedStyle(container);
			const gap = computedStyle.rowGap || computedStyle.gap || '0';

			return Number.parseFloat(gap) || 0;
		},

		syncObservedElements(): void
		{
			const resizeObserver = (this as any).resizeObserver as ResizeObserver | undefined;
			if (!resizeObserver)
			{
				return;
			}

			const container = this.getContentContainer();
			const lastBlock = this.getLastBlock();

			if (
				(this as any).observedContainer === container
				&& (this as any).observedLastBlock === lastBlock
			)
			{
				return;
			}

			resizeObserver.disconnect();

			if (container)
			{
				resizeObserver.observe(container);
			}

			if (lastBlock)
			{
				resizeObserver.observe(lastBlock);
			}

			(this as any).observedContainer = container;
			(this as any).observedLastBlock = lastBlock;
		},

		updateHeight(): void
		{
			const container = this.getContentContainer();
			const lastBlock = this.getLastBlock();

			if (!container || !lastBlock)
			{
				this.spacerHeight = 0;

				return;
			}

			this.spacerHeight = Math.max(
				container.clientHeight - lastBlock.offsetHeight - this.getContentGap(container),
				0,
			);
		},
	},

	template: `
		<div
			aria-hidden="true"
			class="crm-ai-report-drawer__trailing-spacer"
			:style="{ height: \`\${spacerHeight}px\` }"
		/>
	`,
});
