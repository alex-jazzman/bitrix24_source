import { defineComponent, type PropType } from 'ui.vue3';

import { GridTable } from '../component/grid-table/grid-table';
import { SyncLoader } from '../component/sync-loader/sync-loader';
import { GridMode, type GridModeValue, TestId } from '../const';
import { isListImprovementsEnabled } from '../lib/screen-flags/screen-flags';
import { useGridStore } from '../model/grid/grid';

import '../css/message-grid.css';

// @vue/component
export const App = defineComponent({
	name: 'MailMessageGridApp',

	components: {
		GridTable,
		SyncLoader,
	},

	props: {
		mode: {
			type: String as PropType<GridModeValue>,
			required: true,
		},
	},

	setup()
	{
		return {
			// a fact of the screen rather than of a row, and it does not change while the screen stands
			listImprovementsEnabled: isListImprovementsEnabled(),
			grid: useGridStore(),
		};
	},

	computed: {
		modifierClass(): string
		{
			return `--${this.mode}`;
		},
		rootTestId(): string
		{
			return this.mode === GridMode.Draft ? TestId.DraftRoot : TestId.Root;
		},
	},

	beforeUnmount(): void
	{
		this.grid.clearProtectedImages();
	},

	template: `
		<div class="mail-message-grid" :class="modifierClass" :data-testid="rootTestId">
			<SyncLoader v-if="grid.syncing"/>
			<GridTable v-else :mode="mode" :listImprovementsEnabled="listImprovementsEnabled"/>
		</div>
	`,
});
