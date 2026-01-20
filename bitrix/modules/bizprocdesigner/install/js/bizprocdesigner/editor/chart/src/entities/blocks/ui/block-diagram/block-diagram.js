import { BlockDiagram as UiBlockDiagram } from 'ui.block-diagram';
import { BLOCK_SLOT_NAMES, CONNECTION_SLOT_NAMES } from '../../constants';

type BlockDiagramSetup = {
	blockSlotNames: { [string]: string };
};

// @vue/component
export const BlockDiagram = {
	name: 'block-diagram',
	components: {
		UiBlockDiagram,
	},
	props: {
		blocks: {
			type: Array,
			default: () => ([]),
		},
		connections: {
			type: Array,
			default: () => ([]),
		},
		disabled: {
			type: Boolean,
			default: false,
		},
	},
	emits: [
		'update:blocks',
		'update:connections',
		'blockTransitionEnd',
	],
	setup(props): BlockDiagramSetup
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
		</UiBlockDiagram>
	`,
};
