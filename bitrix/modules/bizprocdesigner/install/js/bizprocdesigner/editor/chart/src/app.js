import {
	ZoomBar,
	HistoryBar,
	useHistory,
	useAnimationQueue,
} from 'ui.block-diagram';
import 'ui.design-tokens';
import 'ui.icon-set.outline';
import { markRaw, ref } from 'ui.vue3';
import { mapWritableState } from 'ui.vue3.pinia';

import { FeatureCode } from 'bizprocdesigner.feature';

import { initAiUpdatePull } from './entities/ai-assistant/api/pull';
import { makeAnimationQueue } from './entities/ai-assistant/util/animation';
import { AppSkeleton } from './entities/app';
import {
	diagramStore,
	BLOCK_SLOT_NAMES,
	BLOCK_TOAST_TYPES,
	CONNECTION_SLOT_NAMES,
	ConnectionAux,
	ICON_BG_COLORS,
	type BlockId,
} from './entities/blocks';
import { useCatalogStore, DRAG_ITEM_SLOT_NAMES } from './entities/catalog';
import { ToastWarning } from './entities/toast';
import { useFeature } from './shared/composables';
import { SHARED_TOAST_TYPES } from './shared/constants';
import { DebugButton } from './shared/ui/debug-button';
import { SearchBar } from './shared/ui/search-bar/search-bar';
import { updateIdUrl, handleResponseError } from './shared/utils';
import { AppLayout, AppHeader } from './widgets/app';
import {
	BlockDiagram,
	BlockSimple,
	BlockTrigger,
	BlockComplex,
	BlockTool,
	BlockFrame,
	BlockOperator,
	BlockService,
	DiagramMenu,
	AutosaveStatus,
	TemplateName,
	PublishDropdownButton,
	ToastErrorBlockNavigationButton,
} from './widgets/blocks';
import { Catalog } from './widgets/catalog';
import { DebugBar } from './widgets/debug-bar';
import { CommonNodeSettings } from './widgets/common-node-settings';
import { NodeDataInspector, ToggleInspectorControl } from './widgets/node-data-inspector';
import { NodeSettings as ComplexNodeSettings } from './widgets/node-settings';
import { NodeSettingsHeader } from './widgets/node-settings-header';
import { ToastWidget } from './widgets/toast';

import './design-tokens.css';

// @vue/component
export const Chart = {
	components: {
		AppLayout,
		AppHeader,
		AppSkeleton,
		BlockDiagram,
		BlockSimple,
		BlockTrigger,
		BlockComplex,
		BlockTool,
		BlockFrame,
		BlockOperator,
		BlockService,
		DiagramMenu,
		AutosaveStatus,
		TemplateName,
		PublishDropdownButton,
		ZoomBar,
		DebugButton,
		DebugBar,
		ComplexNodeSettings,
		HistoryBar,
		SearchBar,
		Catalog,
		CommonNodeSettings,
		ConnectionAux,
		ToastWidget,
		ToastWarning,
		ToastErrorBlockNavigationButton,
		NodeDataInspector,
		ToggleInspectorControl,
		NodeSettingsHeader,
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
		initEditBlock: {
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
				connectionCurrentTimestamps: markRaw(JSON.parse(JSON.stringify(diagramStore().connectionCurrentTimestamps))),
			};
		};

		const revertHandler = (snapshot) => {
			commonRevertHandler(snapshot);
			diagramStore().setBlockCurrentTimestamps(snapshot.blockCurrentTimestamps);
			diagramStore().setConnectionCurrentTimestamps(snapshot.connectionCurrentTimestamps);
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
							editBlock: props.initEditBlock,
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
			toast: {
				blockToastTypes: BLOCK_TOAST_TYPES,
				sharedTypes: SHARED_TOAST_TYPES,
			},
			blockColors: ICON_BG_COLORS,
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
		isDebugBarAvailable(): boolean
		{
			const { isFeatureAvailable } = useFeature();

			return isFeatureAvailable('debugBar');
		},
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
			<template #skeleton>
				<AppSkeleton
					v-if="isDiagramDisabled"
				/>
			</template>

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
				<BlockDiagram :disabled="isDiagramDisabled" :enableGrouping="true">
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

					<template #[blockDiagramSlotNames.OPERATORS]="{ block }">
						<BlockOperator :block="block"/>
					</template>

					<template #[blockDiagramSlotNames.SERVICES]="{ block }">
						<BlockService :block="block"/>
					</template>

					<template #[connectionSlotNames.AUX]="{ connection }">
						<ConnectionAux :connection="connection" />
					</template>
				</BlockDiagram>
			</template>

			<template #catalog>
				<Catalog>
					<template #[dragItemSlotNames.simple]="{ item }">
						<BlockSimple :block="item"/>
					</template>

					<template #[dragItemSlotNames.trigger]="{ item }">
						<BlockTrigger :block="item"/>
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

					<template #[dragItemSlotNames.operators]="{ item }">
						<BlockOperator :block="item"/>
					</template>

					<template #[dragItemSlotNames.services]="{ item }">
						<BlockService :block="item"/>
					</template>
				</Catalog>
			</template>

			<template #top-right-toolbar>
				<HistoryBar/>
				<SearchBar/>
			</template>

			<template #bottom-right-toolbar>
				<DebugButton v-if="isDebugBarAvailable"/>
				<ZoomBar
					:stepZoom="0.2"
					:blockColors="blockColors"
				/>
			</template>

			<template #debug-bar-toolbar>
				<DebugBar v-if="isDebugBarAvailable" />
			</template>

			<template #top-middle-anchor>
				<ToastWidget>

					<template #[toast.sharedTypes.WARNING]="{ message }">
						<ToastWarning
							:message="message"
							:closeable="true"
						/>
					</template>

					<template #[toast.blockToastTypes.ACTIVITY_PUBLIC_ERROR]="{ message }">
						<ToastWarning
							:message="message"
							:closeable="true"
						>
							<template #contentEnd>
								<ToastErrorBlockNavigationButton/>
							</template>
						</ToastWarning>
					</template>

				</ToastWidget>
			</template>

			<template #settings>
				<CommonNodeSettings>
					<template #header="{ block, moreMenuItems, onDeletedBlock }">
						<NodeSettingsHeader
							:block="block"
							:moreMenuItems="moreMenuItems"
							@deletedBlock="onDeletedBlock"
						/>
					</template>
					<template #data-inspector-toggle>
						<ToggleInspectorControl />
					</template>
				</CommonNodeSettings>

				<ComplexNodeSettings>
					<template #header="{ block, moreMenuItems, onDeletedBlock }">
						<NodeSettingsHeader
							:block="block"
							:moreMenuItems="moreMenuItems"
							@deletedBlock="onDeletedBlock"
						/>
					</template>
					<template #data-inspector-toggle>
						<ToggleInspectorControl />
					</template>
				</ComplexNodeSettings>
			</template>

			<template #settings-data-inspector>
				<NodeDataInspector />
			</template>
		</AppLayout>
	`,
};
