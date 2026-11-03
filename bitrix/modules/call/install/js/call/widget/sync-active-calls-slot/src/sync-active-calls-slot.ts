import { defineComponent, markRaw, type PropType } from 'ui.vue3';

import { isSyncActiveCallsEnabled } from './settings';
import { SyncActiveCallsMount, type SyncActiveCallsMode } from './sync-active-calls-mount';

/**
 * The place under the native active calls where the web SDK draws the calls of Sync. Draws nothing while the option
 * is off or the page has no embed of syncconnector; reports how many calls it shows, so the list can hide its own
 * container when there are none.
 */
// @vue/component
export const SyncActiveCallsSlot = defineComponent({
	name: 'SyncActiveCallsSlot',
	props: {
		mode: {
			type: String as PropType<SyncActiveCallsMode>,
			required: true,
			validator: (value: string): boolean => value === 'full' || value === 'compact',
		},
	},
	emits: ['countChange'],
	data()
	{
		return {
			count: 0,
			// Kept non-reactive via markRaw: the mount holds private fields a reactive proxy cannot reach.
			listMount: null as SyncActiveCallsMount | null,
		};
	},
	watch: {
		mode(): void
		{
			this.unmountList();
			this.setCount(0);
			this.mountList();
		},
	},
	mounted(): void
	{
		this.mountList();
	},
	beforeUnmount(): void
	{
		this.unmountList();
	},
	methods: {
		mountList(): void
		{
			if (!isSyncActiveCallsEnabled())
			{
				return;
			}

			const listMount = markRaw(new SyncActiveCallsMount(this.$refs.host as Element, {
				mode: this.mode,
				onCountChange: (count: number): void => this.setCount(count),
			}));
			this.listMount = listMount;
			listMount.start();
		},
		unmountList(): void
		{
			(this.listMount as SyncActiveCallsMount | null)?.destroy();
			this.listMount = null;
		},
		setCount(count: number): void
		{
			if (count === this.count)
			{
				return;
			}

			this.count = count;
			this.$emit('countChange', count);
		},
	},
	template: /* HTML */`
		<div ref="host" class="call-widget-sync-active-calls-slot"></div>
	`,
});
