import {
	ZoomBar,
	HistoryBar,
	useHistory,
	useAnimationQueue,
	useBlockDiagram,
	ANIMATED_TYPES,
} from 'ui.block-diagram';
import 'ui.design-tokens';
import 'ui.icon-set.outline';
import { markRaw, ref, watch, getCurrentScope } from 'ui.vue3';
import { mapState, mapWritableState } from 'ui.vue3.pinia';

import { FeatureCode } from 'bizprocdesigner.feature';

import { AI_AGENT_TOAST_TYPES, AI_AGENT_MESSAGE_KEYS } from './entities/ai-assistant';
import { initAiUpdatePull } from './entities/ai-assistant/api/pull';
import { makeAnimationQueue } from './entities/ai-assistant/util/animation';
import { resolveAgentDraftApply } from './entities/ai-assistant/util/resolve-draft-apply';
import { createSettingsTour } from './entities/ai-assistant/util/settings-tour';
import * as TabHighlight from './entities/ai-assistant/util/tab-highlight';
import { AppSkeleton } from './entities/app';
import {
	diagramStore,
	BLOCK_SLOT_NAMES,
	BLOCK_TOAST_TYPES,
	CONNECTION_SLOT_NAMES,
	ConnectionAux,
	ICON_BG_COLORS,
	usePublishMenuStore,
	type BlockId,
} from './entities/blocks';
import { useCatalogStore, DRAG_ITEM_SLOT_NAMES } from './entities/catalog';
import { ToastWarning, ToastAgentNotice, ToastColorScheme } from './entities/toast';
import { highlightAgentChanges, initAgentHighlight } from './features/ai-assistant';
import { initDataViewEditorConnector } from './features/data-view-editor/connector';
import { DataViewEditorWindow } from './features/data-view-editor/ui/editor-window';
import { ChangePilotAudience, PilotBadge, StopPilot } from './features/pilot';
import { DiagramLayoutButton } from './features/diagram-layout';
import { useFeature, useLoc } from './shared/composables';
import { SHARED_TOAST_TYPES } from './shared/constants';
import { useToastStore } from './shared/stores';
import { ConnectAgentButton } from './shared/ui/connect-agent-button/connect-agent-button';
import { ConnectAgentOnboarding, PilotPublicationOnboarding } from './entities/onboarding';
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
import { BlockMediator } from './widgets/blocks/lib';
import { RestoreUndoBar } from './widgets/blocks/ui/restore-undo-bar/restore-undo-bar';
import { VersionViewBar } from './widgets/blocks/ui/version-view-bar/version-view-bar';
import { Catalog } from './widgets/catalog';
import { DebugBar } from './widgets/debug-bar';
import { CommonNodeSettings } from './widgets/common-node-settings';
import { NodeDataInspector, ToggleInspectorControl } from './widgets/node-data-inspector';
import { NodeSettings as ComplexNodeSettings } from './widgets/node-settings';
import { NodeSettingsHeader } from './widgets/node-settings-header';
import { TemplateNotFoundState } from './widgets/template-not-found-state/template-not-found-state';
import { ToastWidget } from './widgets/toast';

import './design-tokens.css';

function isExternalAiAgentAllowed(): boolean
{
	const { isFeatureAvailable, isFeatureLocked } = useFeature();

	return isFeatureAvailable(FeatureCode.externalAiAgent) && !isFeatureLocked(FeatureCode.externalAiAgent);
}

// @vue/component
export const Chart = {
	components: {
		AppLayout,
		AppHeader,
		AppSkeleton,
		ConnectAgentButton,
		PilotBadge,
		ChangePilotAudience,
		StopPilot,
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
		DiagramLayoutButton,
		DebugBar,
		ComplexNodeSettings,
		HistoryBar,
		SearchBar,
		Catalog,
		CommonNodeSettings,
		ConnectionAux,
		ToastWidget,
		ToastWarning,
		ToastAgentNotice,
		ToastErrorBlockNavigationButton,
		NodeDataInspector,
		ToggleInspectorControl,
		NodeSettingsHeader,
		DataViewEditorWindow,
		TemplateNotFoundState,
		VersionViewBar,
		RestoreUndoBar,
	},
	provide(): {onBlockClick: (event: Event) => void}
	{
		return {
			onBlockClick: this.handleBlockClick,
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
		initCanPublish: {
			type: Boolean,
			default: false,
		},
	},
	// eslint-disable-next-line max-lines-per-function
	setup(props): {...}
	{
		const catalogStore = useCatalogStore();
		diagramStore().initEventListeners();
		diagramStore().canPublish = props.initCanPublish;
		diagramStore().isPilotFeatureAvailable = useFeature().isFeatureAvailable(FeatureCode.pilotPublication);
		initDataViewEditorConnector();
		const { makeSnapshot, setHandlers, commonSnapshotHandler, commonRevertHandler } = useHistory();
		const isDiagramDisabled = ref(true);
		const snapshotHandler = (newState) => {
			return {
				...commonSnapshotHandler(newState),
				templateConstants: markRaw(
					JSON.parse(JSON.stringify(diagramStore().template.CONSTANTS ?? {})),
				),
				blockCurrentTimestamps: markRaw(JSON.parse(JSON.stringify(diagramStore().blockCurrentTimestamps))),
				connectionCurrentTimestamps: markRaw(JSON.parse(JSON.stringify(diagramStore().connectionCurrentTimestamps))),
			};
		};

		const revertHandler = (snapshot) => {
			commonRevertHandler(snapshot);
			diagramStore().setTemplateConstants(snapshot.templateConstants ?? {});
			diagramStore().setBlockCurrentTimestamps(snapshot.blockCurrentTimestamps);
			diagramStore().setConnectionCurrentTimestamps(snapshot.connectionCurrentTimestamps);
		};
		setHandlers({ snapshotHandler, revertHandler });

		const animationQueue = useAnimationQueue();
		const { isStopAnimation } = useBlockDiagram();
		const toastStore = useToastStore();
		const { getMessage } = useLoc();

		// One-shot watcher for completion of the current graph-apply animation.
		// Keep a reference to its stop() so the next apply can cancel an
		// unfinished watcher and prevent it from leaking.
		const setupScope = getCurrentScope();
		let stopAnimationCompletionWatch = null;

		// Leads the right panel over the nodes the agent adds. Its own mediator instance: the
		// series must not run into the guard of a show started by a click of the user.
		const settingsTour = createSettingsTour(new BlockMediator());

		TabHighlight.init();

		// Without the feature neither the visible-set bridge nor the visibilitychange listener is
		// created, so nothing ever fills the highlight store the cards read. The call must remain
		// synchronous in setup() so that onScopeDispose() inside it belongs to this scope.
		if (isExternalAiAgentAllowed())
		{
			initAgentHighlight();
		}

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
					// No available/unlocked external AI-agent feature — the update is
					// ignored entirely: no graph apply, no animation, no notification.
					// Without the feature the agent cannot even connect (the connect button
					// is closed), so legitimate updates are unaffected, and on the client it is an extra safety margin.
					if (!isExternalAiAgentAllowed())
					{
						return;
					}
					const currentDiagramStore = diagramStore();
					if (currentDiagramStore.isWriteLocked)
					{
						return;
					}

					const { shouldApply, draftIdToAdopt } = resolveAgentDraftApply({
						storeDraftId: currentDiagramStore.draftId,
						storeTemplateId: currentDiagramStore.templateId,
						incomingDraftId: draftId,
						incomingTemplateId: templateId,
					});

					if (!shouldApply)
					{
						return;
					}

					if (draftIdToAdopt !== null)
					{
						currentDiagramStore.setDraftId(draftIdToAdopt);
					}

					// The agent has already saved the draft on the server. The time is written
					// before the animation queue on purpose: a graph whose blocks and connections
					// did not change leaves the queue empty and returns below, and that save would
					// otherwise stay invisible in the header until the next local one.
					currentDiagramStore.markExternalDraftSave();

					// The applying itself reports which blocks changed by properties: it mutates
					// the stored blocks in place, so afterwards no diff of its own is possible.
					const changedBlockIds = currentDiagramStore.updateExistedBlockProperties(blocks);

					const animatedItems = makeAnimationQueue(
						currentDiagramStore.blocks,
						currentDiagramStore.connections,
						blocks,
						connections,
					);

					highlightAgentChanges({ changedBlockIds, animatedItems, newBlocks: blocks });

					// Graph is unchanged — nothing to animate: show no toasts and
					// set no highlight (there will be no isStopAnimation false→true transition).
					if (animatedItems.length === 0)
					{
						return;
					}

					// Cancel the previous apply's unfinished watcher before showing the
					// new processing toast so it doesn't leak onto a different animation.
					stopAnimationCompletionWatch?.();
					stopAnimationCompletionWatch = null;

					// Start with the blue "processing" toast.
					toastStore.clearAllOfType(AI_AGENT_TOAST_TYPES.NOTICE);
					toastStore.addCustom(
						getMessage(AI_AGENT_MESSAGE_KEYS.PROCESS_PROCESSING),
						AI_AGENT_TOAST_TYPES.NOTICE,
						{ colorScheme: ToastColorScheme.Processing },
					);

					// start() synchronously sets isStopAnimation to false, so a watcher
					// registered after the start reacts exactly to the false→true transition
					// when this animation completes (we don't use immediate).
					animationQueue.start({ items: animatedItems });

					TabHighlight.onAgentAnimationStart();

					// Right after the start, before the first node appears: the tour subscribes to
					// the engine hook and must not miss it. Added nodes come in the order the queue
					// draws them; the queue length goes along with them because the series has to
					// outlive the whole queue: removals and connections included, and on a rebuilt
					// graph those outnumber the additions.
					settingsTour.start(
						animatedItems
							.filter((animatedItem) => animatedItem.type === ANIMATED_TYPES.BLOCK)
							.map((animatedItem) => animatedItem.item),
						animatedItems.length,
					);

					const registerCompletionWatch = () => watch(isStopAnimation, (isStopped: boolean): void => {
						if (!isStopped)
						{
							return;
						}

						// One-shot: stop ourselves, then replace the toast with the green
						// "completed" one.
						stopAnimationCompletionWatch?.();
						stopAnimationCompletionWatch = null;

						toastStore.clearAllOfType(AI_AGENT_TOAST_TYPES.NOTICE);
						toastStore.addCustom(
							getMessage(AI_AGENT_MESSAGE_KEYS.PROCESS_COMPLETED),
							AI_AGENT_TOAST_TYPES.NOTICE,
							{ colorScheme: ToastColorScheme.Completed },
						);

						// No more nodes will come: the only reliable end of the series.
						settingsTour.onAnimationFinished();
					});

					// Register the watcher in the setup() scope so it is guaranteed to be
					// disposed when the editor unmounts, even if the animation never finished.
					// Without a scope we don't register: a bare watch would leak outside the
					// effect scope. In setup() the scope always exists, so the real path
					// is unchanged.
					stopAnimationCompletionWatch = setupScope
						? setupScope.run(registerCompletionWatch)
						: null;
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
				aiAgentTypes: AI_AGENT_TOAST_TYPES,
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
		...mapState(
			diagramStore,
			[
				'isTemplateNotFound',
				'isEditorReadonly',
				'isVersionViewMode',
				'isWriteLocked',
				'canUndoRestore',
				'canPublish',
				'canPublishToPilotAudience',
			],
		),
		isDebugBarAvailable(): boolean
		{
			const { isFeatureAvailable } = useFeature();

			return isFeatureAvailable('debugBar');
		},
		isExternalAiAgentAvailable(): boolean
		{
			const { isFeatureAvailable } = useFeature();

			return isFeatureAvailable(FeatureCode.externalAiAgent);
		},
		isExternalAiAgentLocked(): boolean
		{
			const { isFeatureLocked } = useFeature();

			return isFeatureLocked(FeatureCode.externalAiAgent);
		},
		// The first step of the tour points at the item of the publish menu, so the tour waits for the
		// very thing that item waits for. Without the right of publication there is nothing to tell -
		// neither the item nor the operations over the pilot are available - and a template that is gone
		// has no toolbar to point at.
		isPilotOnboardingAvailable(): boolean
		{
			return this.canPublishToPilotAudience && this.canPublish && !this.isTemplateNotFound;
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
		// The tour points at the loaded toolbar: until the data of the diagram arrive the state of the
		// pilot is unknown, and the step about the pilot cannot be chosen.
		isDiagramDisabled(isDisabled: boolean): void
		{
			if (isDisabled || !this.isPilotOnboardingAvailable)
			{
				return;
			}

			const publishMenu = usePublishMenuStore();
			this.$nextTick(() => {
				PilotPublicationOnboarding.show(publishMenu);
			});
		},
	},
	mounted(): void
	{
		if (this.isExternalAiAgentAvailable && !this.isExternalAiAgentLocked)
		{
			ConnectAgentOnboarding.show();
		}
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
				<TemplateNotFoundState
					v-else-if="isTemplateNotFound"
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
					<PublishDropdownButton :readonly="isTemplateNotFound || isWriteLocked"/>
					</template>
				</AppHeader>
			</template>

			<template #diagram>
				<BlockDiagram :disabled="isDiagramDisabled || isEditorReadonly" :enableGrouping="true">
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
				<Catalog v-if="!isWriteLocked">
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
				<PilotBadge>
					<template #actions>
						<ChangePilotAudience/>
						<StopPilot/>
					</template>
				</PilotBadge>
				<ConnectAgentButton
					v-if="isExternalAiAgentAvailable"
					:templateId="templateId"
					:locked="isExternalAiAgentLocked"
				/>
				<HistoryBar/>
				<SearchBar/>
			</template>

			<template #bottom-right-toolbar>
				<DebugButton v-if="isDebugBarAvailable"/>
				<div
					class="editor-chart-app-layout__diagram-controls"
					:data-test-id="$testId('diagramControls')"
				>
					<DiagramLayoutButton/>
					<div class="editor-chart-app-layout__diagram-controls-separator"/>
					<ZoomBar
						:stepZoom="0.2"
						:blockColors="blockColors"
						flat
					/>
				</div>
			</template>

			<template #debug-bar-toolbar>
				<DebugBar v-if="isDebugBarAvailable" />
			</template>

			<template #top-middle-anchor>
				<VersionViewBar v-if="isVersionViewMode"/>
				<RestoreUndoBar v-else-if="canUndoRestore"/>
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

					<template #[toast.aiAgentTypes.NOTICE]="{ message, colorScheme }">
						<ToastAgentNotice
							:message="message"
							:color-scheme="colorScheme"
							:closeable="true"
						/>
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

			<template #settings-table-settings>
				<DataViewEditorWindow/>
			</template>
		</AppLayout>
	`,
};
