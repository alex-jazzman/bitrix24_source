import { BlockDiagram as UiBlockDiagram } from 'ui.block-diagram';
import type { MenuItemOptions } from 'ui.vue3.components.menu';
import type { Block, Connection } from '../../../../shared/types';
import { BLOCK_SLOT_NAMES, CONNECTION_SLOT_NAMES } from '../../constants';

type BlockDiagramSetup = {
	blockSlotNames: { [string]: string };
	connectionSlotNames: { [string]: string };
};

type Props = {
	blocks: Array<Block>,
	connections: Array<Connection>,
	disabled: boolean,
	contextMenuItems: Array<MenuItemOptions>,
};

// @vue/component
export const BlockDiagram = {
	name: 'BlockDiagram',
	components: {
		UiBlockDiagram,
	},
	props: {
		/** @type Array<Block> */
		blocks: {
			type: Array,
			default: () => ([]),
		},
		/** @type Array<Connection> */
		connections: {
			type: Array,
			default: () => ([]),
		},
		disabled: {
			type: Boolean,
			default: false,
		},
		enableGrouping: {
			type: Boolean,
			default: false,
		},
		/** @type Array<MenuItemOptions> */
		contextMenuItems: {
			type: Array,
			default: () => ([]),
		},
	},
	emits: [
		'update:blocks',
		'update:connections',
		'blockTransitionEnd',
	],
	setup(props: Props): BlockDiagramSetup
	{
		return {
			blockSlotNamesMap: BLOCK_SLOT_NAMES,
			connectionSlotNamesMap: CONNECTION_SLOT_NAMES,
		};
	},
	computed: {
		blockSlotNames(): string[]
		{
			return Object.values(this.blockSlotNamesMap);
		},
		connectionSlotNames(): string[]
		{
			return Object.values(this.connectionSlotNamesMap);
		},
	},
	template: `
		<UiBlockDiagram
			:blocks="blocks"
			:connections="connections"
			:disabled="disabled"
			:enableGrouping="enableGrouping"
			:contextMenuItems="contextMenuItems"
			@update:blocks="$emit('update:blocks', $event)"
			@update:connections="$emit('update:connections', $event)"
			@blockTransitionEnd="$emit('blockTransitionEnd', $event)"
		>
			<template
				v-for="slotName in blockSlotNames"
				#[slotName]="{ block }"
			>
				<slot
					:name="slotName"
					:block="block"
				/>
			</template>

			<template
				v-for="slotName in connectionSlotNames"
				#[slotName]="{ connection }"
			>
				<slot
					:name="slotName"
					:connection="connection"
				/>
			</template>

			<template #group-selection-box>
				<slot name="group-selection-box"/>
			</template>
		</UiBlockDiagram>
	`,
};
