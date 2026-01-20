import { FeatureCode } from 'bizprocdesigner.feature';
import { computed, toValue, inject } from 'ui.vue3';
import { storeToRefs } from 'ui.vue3.pinia';
import { Runtime } from 'main.core';
import { UI } from 'ui.notification';
import { useAnimationQueue, useHighlightedBlocks } from 'ui.block-diagram';
import { setUserSelectedBlock } from '../../../../entities/ai-assistant/api/api';
import { useFeature, useLoc } from '../../../../shared/composables';
import type { Block, Connection } from '../../../../shared/composables';
import {
	BlockDiagram as BlockDiagramEntity,
	diagramStore as useDiagramStore,
	BLOCK_SLOT_NAMES,
	CONNECTION_SLOT_NAMES,
} from '../../../../entities/blocks';

// @vue/component
export const BlockDiagram = {
	name: 'BlockDiagramWidget',
	components: {
		BlockDiagramEntity,
	},
	props: {
		disabled: {
			type: Boolean,
			default: false,
		},
	},
	setup(): {...}
	{
		const showBlockSettings = inject('showBlockSettings');
		const animationQueue = useAnimationQueue();
		const diagramStore = useDiagramStore();
		const { blocks: blocksInStore, connections: connectionsInStore } = storeToRefs(diagramStore);
		const { getMessage } = useLoc();
		const highlightedBlocks = useHighlightedBlocks();
		const highlitedBlockIds = highlightedBlocks.highlitedBlockIds;
		const { isFeatureAvailable } = useFeature();

		const blocks = computed({
			get(): Block[]
			{
				return toValue(blocksInStore);
			},
			set(newBlocks: Block[])
			{
				diagramStore.setBlocks(newBlocks);
				fetchUpdateDiagram();
			},
		});
		const connections = computed({
			get(): Connection[]
			{
				return toValue(connectionsInStore);
			},
			set(newConnections: Connection[]): void
			{
				diagramStore.setConnections(newConnections);
				fetchUpdateDiagram();
			},
		});

		const fetchUpdateDiagram = Runtime.debounce(updateDiagramData, 700);

		async function updateDiagramData(): Promise<void>
		{
			const maxAttempts = 3;
			let attempt = 0;

			while (attempt < maxAttempts)
			{
				try
				{
					// eslint-disable-next-line no-await-in-loop
					await diagramStore.publicDraft();
					diagramStore.updateStatus(true);

					return;
				}
				catch
				{
					attempt++;
					if (attempt >= maxAttempts)
					{
						diagramStore.updateStatus(false);

						UI.Notification.Center.notify({
							content: getMessage('BIZPROCDESIGNER_EDITOR_TOP_PANEL_AUTOSAVE_STATUS_NOT_SAVED_HINT'),
							autoHideDelay: 4000,
						});
					}
				}
			}
		}

		function onDropNewBlock(block: Block): void
		{
			try
			{
				diagramStore.setBlockCurrentTimestamp(block);
				diagramStore.publicDraft();
				diagramStore.updateStatus(true);
			}
			catch
			{
				diagramStore.updateStatus(false);
			}
		}

		async function onBlockTransitionEnd(block: Block): Promise<void>
		{
			if (!block || !block.position)
			{
				console.warn('Incorrect object for block transition end event', block);

				return;
			}

			animationQueue.pause();
			try
			{
				// TODO: replace the method showBlockSettings with honey from slices app and settings
				await showBlockSettings(block, true);
			}
			finally
			{
				animationQueue.play();
			}
		}

		return {
			blocks,
			connections,
			blockSlotNames: BLOCK_SLOT_NAMES,
			connectionSlotNames: CONNECTION_SLOT_NAMES,
			onBlockTransitionEnd,
			onDropNewBlock,
			highlitedBlockIds,
			isFeatureAvailable,
		};
	},
	// @todo to widget
	watch: {
		highlitedBlockIds: {
			deep: true,
			handler(newIds: string[], oldIds: string[]): void
			{
				if (!this.isFeatureAvailable(FeatureCode.aiAssistant))
				{
					return;
				}

				if (oldIds.length > 0 && newIds.length === 0)
				{
					setUserSelectedBlock();
				}

				if (newIds.length === 1)
				{
					const id = newIds[0];
					const existedBlock = this.blocks.find((block) => block.id === id);
					if (existedBlock)
					{
						setUserSelectedBlock(id);
					}
				}
			},
		},
	},
	template: `
		<BlockDiagramEntity
			v-model:blocks="blocks"
			v-model:connections="connections"
			:disabled="disabled"
			@blockTransitionEnd="onBlockTransitionEnd"
			@dropNewBlock="onDropNewBlock"
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
		</BlockDiagramEntity>
	`,
};
