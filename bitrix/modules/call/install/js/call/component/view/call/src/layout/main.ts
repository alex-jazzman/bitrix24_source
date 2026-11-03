import { defineComponent } from 'ui.vue3';

import { CallHeader } from 'call.component.block.header';
import { CallFooter } from 'call.component.block.footer';

import { useUiStore } from 'call.store';
import type { UiStoreInstance } from 'call.store';

import { CallContent } from '../elements/content/index';

export const CallMainLayout = defineComponent({
	name: 'CallMainLayout',
	components: {
		CallHeader,
		CallContent,
		CallFooter,
	},
	setup(): { uiStore: UiStoreInstance }
	{
		return {
			uiStore: useUiStore(),
		};
	},
	data(): {
		resizeObserver: ResizeObserver | null;
		resizeRafId: number | null;
		pendingEntry: ResizeObserverEntry | null;
		lastDimensions: { layoutWidth: number; layoutHeight: number; layoutContentHeight: number } | null;
	}
	{
		return {
			resizeObserver: null,
			resizeRafId: null,
			pendingEntry: null,
			lastDimensions: null,
		};
	},
	mounted(): void
	{
		this.resizeObserver = new ResizeObserver((entries: ResizeObserverEntry[]): void =>
		{
			this.pendingEntry = entries[entries.length - 1];

			if (this.resizeRafId !== null)
			{
				return;
			}

			this.resizeRafId = requestAnimationFrame((): void => this.flushResize());
		});
		this.resizeObserver.observe(this.$refs.layout as HTMLElement);
	},
	beforeUnmount(): void
	{
		if (this.resizeRafId !== null)
		{
			cancelAnimationFrame(this.resizeRafId);
			this.resizeRafId = null;
		}

		if (this.resizeObserver)
		{
			this.resizeObserver.disconnect();
			this.resizeObserver = null;
		}
	},
	computed: {
		isCopilotActive(): boolean
		{
			return this.uiStore.isCopilotActive;
		},
	},
	methods: {
		flushResize(): void
		{
			this.resizeRafId = null;

			const entry = this.pendingEntry;
			this.pendingEntry = null;

			if (!entry)
			{
				return;
			}

			const header = this.$refs.header as InstanceType<typeof CallHeader> | undefined;
			const footer = this.$refs.footer as InstanceType<typeof CallFooter> | undefined;

			if (!header || !footer)
			{
				return;
			}

			const width = entry.contentRect.width;
			const height = entry.contentRect.height;
			const contentHeight = height - header.$el.clientHeight - footer.$el.clientHeight;

			const last = this.lastDimensions;
			if (last && last.layoutWidth === width && last.layoutHeight === height && last.layoutContentHeight === contentHeight)
			{
				return;
			}

			this.lastDimensions = { layoutWidth: width, layoutHeight: height, layoutContentHeight: contentHeight };
			this.uiStore.setLayoutDimensions(this.lastDimensions);
		},
	},
	template: /* HTML */`
		<div ref="layout" class="call-layout__main-layout" :class="{ '--copilot': isCopilotActive }" data-testid="call-layout-main">
			<div class="call-layout__main">
				<CallHeader ref="header" />
				<CallContent />
				<CallFooter ref="footer" class="call-layout__footer" />
			</div>
			<div class="call-layout__side"></div>
		</div>
	`,
});
