import './design-tokens.css';
import { markRaw, ref } from 'ui.vue3';
import {
	ZoomBar,
	HistoryBar,
	useHistory,
	useAnimationQueue,
} from 'ui.block-diagram';
import { mapWritableState } from 'ui.vue3.pinia';
import { FeatureCode } from 'bizprocdesigner.feature';
import { initAiUpdatePull } from './entities/ai-assistant/api/pull';
import { makeAnimationQueue } from './entities/ai-assistant/util/animation';
import { NodeSettings as ComplexNodeSettings, NodeSettingsRules } from './widgets/node-settings';
import { diagramStore, BLOCK_SLOT_NAMES, CONNECTION_SLOT_NAMES, ConnectionAux } from './entities/blocks';
import { useCatalogStore, DRAG_ITEM_SLOT_NAMES } from './entities/catalog';
import { SearchBar } from './shared/ui/search-bar/search-bar';

import type { BlockId } from './entities/blocks';

import {
	BlockDiagram,
	BlockSimple,
	BlockTrigger,
	BlockComplex,
	BlockTool,
	BlockFrame,
	DiagramMenu,
	AutosaveStatus,
	TemplateName,
	PublishDropdownButton,
} from './widgets/blocks';
import {
	CommonNodeSettings,
} from './widgets/common-node-settings';
import { Catalog } from './widgets/catalog';
import { AppLayout, AppHeader } from './widgets/app';

import 'ui.icon-set.outline';
import { updateIdUrl, handleResponseError } from './shared/utils';

import 'ui.design-tokens';

// @vue/component
export const Chart = {
	components: {
		AppLayout,
		AppHeader,
		BlockDiagram,
		BlockSimple,
		BlockTrigger,
		BlockComplex,
		BlockTool,
		BlockFrame,
		DiagramMenu,
		AutosaveStatus,
		TemplateName,
		PublishDropdownButton,
		ZoomBar,
		ComplexNodeSettings,
		NodeSettingsRules,
		HistoryBar,
		SearchBar,
		Catalog,
		CommonNodeSettings,
		ConnectionAux,
	},
	provide(): {onBlockClick: (event: Event) => void}
	{
		return {
			onBlockClick: this.handleBlockClick,
			showBlockSettings: this.showBlockSettings,
			onToggleBlockActivation: this.handleToggleBlockActivation,
		};
	},
	props: {
		initTemplateId: {
			type: Number,
			default: 0,
		},
		initDocumentType: {
			type: Array, // todo: add type
			default: null,
		},
		initStartTrigger: {
			type: String,
			default: null,
		},
	},
	setup(props): {...}
	{
		const catalogStore = useCatalogStore();
		diagramStore().initEventListeners();
		const { makeSnapshot, setHandlers, commonSnapshotHandler, commonRevertHandler } = useHistory();
		const isDiagramDisabled = ref(true);
		const snapshotHandler = (newState) => {
			return {
				...commonSnapshotHandler(newState),
				blockCurrentTimestamps: markRaw(JSON.parse(JSON.stringify(diagramStore().blockCurrentTimestamps))),
			};
		};

		const revertHandler = (snapshot) => {
			commonRevertHandler(snapshot);
			diagramStore().setBlockCurrentTimestamps(snapshot.blockCurrentTimestamps);
		};
		setHandlers({ snapshotHandler, revertHandler });

		const animationQueue = useAnimationQueue();

		async function initApp()
		{
			try
			{
				await Promise.all([
					diagramStore().refreshDiagramData(
						{
							templateId: props.initTemplateId,
							documentType: props.initDocumentType,
							startTrigger: props.initStartTrigger,
						},
					),
					catalogStore.init(),
				]);

				initAiUpdatePull(({ blocks, connections, draftId, templateId }) => {
					if (diagramStore().draftId === 0 && diagramStore().templateId === 0)
					{
						return;
					}

					if (draftId !== diagramStore().draftId || templateId !== diagramStore().templateId)
					{
						return;
					}

					diagramStore().updateExistedBlockProperties(blocks);
					const animatedItems = makeAnimationQueue(
						diagramStore().blocks,
						diagramStore().connections,
						blocks,
						connections,
					);

					animationQueue.start({ items: animatedItems });
				});
			}
			catch (error)
			{
				handleResponseError(error);
			}
			finally
			{
				isDiagramDisabled.value = false;
			}

			makeSnapshot();
		}

		initApp();

		return {
			isDiagramDisabled,
			makeSnapshot,
			FeatureCode,
			blockDiagramSlotNames: BLOCK_SLOT_NAMES,
			connectionSlotNames: CONNECTION_SLOT_NAMES,
			dragItemSlotNames: DRAG_ITEM_SLOT_NAMES,
		};
	},
	computed:
	{
		...mapWritableState(
			diagramStore,
			[
				'documentTypeSigned',
				'templateId',
			],
		),
	},
	watch: {
		templateId(value)
		{
			if (value > 0)
			{
				updateIdUrl(value);
			}
		},
	},
	methods: {
		handleToggleBlockActivation(blockId: BlockId): void
		{
			diagramStore().toggleBlockActivation(blockId);
		},
	},
	template: `
		<AppLayout>
			<template #header>
				<AppHeader>
					<template #templateName>
						<TemplateName/>
					</template>

					<template #autosaveStatus>
						<AutosaveStatus/>
					</template>

					<template #diagramMenu>
						<DiagramMenu/>
					</template>

					<template #publishButton>
						<PublishDropdownButton/>
					</template>
				</AppHeader>
			</template>

			<template #diagram>
				<BlockDiagram :disabled="isDiagramDisabled">
					<template #[blockDiagramSlotNames.SIMPLE]="{ block }">
						<BlockSimple :block="block"/>
					</template>

					<template #[blockDiagramSlotNames.TRIGGER]="{ block }">
						<BlockTrigger :block="block"/>
					</template>

					<template #[blockDiagramSlotNames.COMPLEX]="{ block }">
						<BlockComplex :block="block"/>
					</template>

					<template #[blockDiagramSlotNames.TOOL]="{ block }">
						<BlockTool :block="block"/>
					</template>

					<template #[blockDiagramSlotNames.FRAME]="{ block }">
						<BlockFrame :block="block"/>
					</template>

					<template #[connectionSlotNames.AUX]="{ connection }">
						<ConnectionAux :connection="connection" />
					</template>
				</BlockDiagram>
			</template>

			<template #catalog>
				<Catalog>
					<template #[dragItemSlotNames.simple]="{ item }">
						<BlockSimple
							:block="item"
							autosize
						/>
					</template>

					<template #[dragItemSlotNames.trigger]="{ item }">
						<BlockTrigger
							:block="item"
							autosize
						/>
					</template>

					<template #[dragItemSlotNames.complex]="{ item }">
						<BlockComplex :block="item"/>
					</template>

					<template #[dragItemSlotNames.tool]="{ item }">
						<BlockTool :block="item"/>
					</template>

					<template #[dragItemSlotNames.frame]="{ item }">
						<BlockFrame :block="item"/>
					</template>
				</Catalog>
			</template>

			<template #top-right-toolbar>
				<HistoryBar/>
				<SearchBar/>
			</template>

			<template #bottom-right-toolbar>
				<ZoomBar :stepZoom="0.2"/>
			</template>

			<template #settings>
				<CommonNodeSettings/>

				<ComplexNodeSettings>
					<NodeSettingsRules />
				</ComplexNodeSettings>
			</template>
		</AppLayout>
	`,
};
