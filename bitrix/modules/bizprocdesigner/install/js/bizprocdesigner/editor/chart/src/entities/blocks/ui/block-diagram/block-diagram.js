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
	name: 'block-diagram',
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
			blockSlotNames: BLOCK_SLOT_NAMES,
			connectionSlotNames: CONNECTION_SLOT_NAMES,
		};
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
			<template #[blockSlotNames.SIMPLE]="{ block }">
				<slot
					:name="blockSlotNames.SIMPLE"
					:block="block"
				/>
			</template>

			<template #[blockSlotNames.TRIGGER]="{ block }">
				<slot
					:name="blockSlotNames.TRIGGER"
					:block="block"
				/>
			</template>

			<template #[blockSlotNames.COMPLEX]="{ block }">
				<slot
					:name="blockSlotNames.COMPLEX"
					:block="block"
				/>
			</template>

			<template #[blockSlotNames.TOOL]="{ block }">
				<slot
					:name="blockSlotNames.TOOL"
					:block="block"
				/>
			</template>

			<template #[blockSlotNames.FRAME]="{ block }">
				<slot
					:name="blockSlotNames.FRAME"
					:block="block"
				/>
			</template>

			<template #[connectionSlotNames.AUX]="{ connection }">
				<slot
					:name="connectionSlotNames.AUX"
					:connection="connection"
				/>
			</template>
			<template #group-selection-box>
				<slot name="group-selection-box"/>
			</template>
		</UiBlockDiagram>
	`,
};
