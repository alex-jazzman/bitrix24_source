import { getCurrentScope, onScopeDispose, watch } from 'ui.vue3';
import { useBlockDiagram } from 'ui.block-diagram';
import { LiveAnnouncer } from 'ui.a11y';

import { useAppStore } from '../../app/stores/app';
import { useCommonNodeSettingsStore } from '../../common-node-settings/stores/common-node-settings';
import { useNodeSettingsStore } from '../../node-settings/stores/node-settings-store';
import { areNodeSettingsDirty } from '../../node-settings/utils/node-settings-dirty';
import { type NodeSettings } from '../../node-settings/types';
import { BLOCK_TYPES, BLOCK_TYPES_WITHOUT_SETTINGS } from '../../../shared/constants';
// The module, not the utils barrel: the barrel pulls the transport in, and the tour is covered by
// unit tests that need neither.
import { FocusAnchor, rescueFocus } from '../../../shared/utils/focus-rescue';
import { useLoc } from '../../../shared/composables/loc';
import { type Block, type BlockId, type Port } from '../../../shared/types';

/**
 * Leads the right panel over the nodes an external AI agent has just added: a node shows up on
 * the canvas, the panel shows its settings. The series is catching-up, not queueing: the next
 * node to show is the last one that appeared, the ones in between are skipped on purpose, so the
 * panel never lags behind the canvas.
 *
 * The series steps on the large nodes only — the ones the user has to fill in by hand. The panel
 * lags a step behind the camera by the way the queue of ui.block-diagram is built (it moves the
 * camera to the next node right after the transition the tour listens to), and a step on every node
 * of the graph makes that lag the main thing the user sees. The ordinary nodes are left to the
 * canvas alone; the node the series ends on is shown whatever its type is, because the user is owed
 * the result of the build.
 *
 * The series ends on the graph animation being over (onAnimationFinished), not on a count of shown
 * nodes: while catching up the skipped nodes never enter `shown`, so a count would never match.
 * The last added node is shown explicitly at that point instead of being waited for: the end of the
 * animation and the hook of the last node arrive within the same moment, and the user needs the
 * result of the build in the panel, not whichever of the two happened to win.
 *
 * The steps of the series are instant, and only the node the series ends on fades in. A step lives
 * about a second, and fading the content in takes 0.7 s of it: the user spends most of a step
 * looking at half-transparent settings that never settle, and the pace reads as ragged because an
 * ordinary node opens at once while a complex one waits for the server. The node the panel is left
 * on is the result of the build, it is worth the transition, and it is the only show that has the
 * time for it.
 */

// Upper bound of a single queue step: the fallback timer of ui.block-diagram
// (utils/animation-step/animation-step.js), not exported by that extension.
const ANIMATION_STEP_FALLBACK_MS = 1200;

// Slack over the queue estimate: the start delay of the queue plus the settings request of the
// last node, which is still in flight when the animation is already over.
const WATCHDOG_SLACK_MS = 10000;

const SHOW_INSTANTLY = Object.freeze({ withTransition: false });
const SHOW_WITH_TRANSITION = Object.freeze({ withTransition: true });

// The node types the series steps on: the ones that carry settings of their own to fill in. The
// nodes of the other types are drawn on the canvas and nothing more.
const TOUR_STEP_BLOCK_TYPES = new Set([BLOCK_TYPES.COMPLEX, BLOCK_TYPES.TOOL]);

function isTourStep(block: Block): boolean
{
	return TOUR_STEP_BLOCK_TYPES.has(block.type);
}

// The node the series is bound to end on: the last added one the panel has something to show for.
// The very last node may well be a frame — the REST surface of the agent carries them — and then the
// series ends on the node before it.
function findFinalBlock(blocks: Array<Block>): ?Block
{
	for (let index = blocks.length - 1; index >= 0; index--)
	{
		if (!BLOCK_TYPES_WITHOUT_SETTINGS.includes(blocks[index].type))
		{
			return blocks[index];
		}
	}

	return null;
}

// The signal that the graph is fully drawn may never arrive: a collapsed tab suspends CSS
// transitions, and the engine hook is triggered from the transition of a node. Then the series is
// closed by time, computed from the queue length known at the start.
//
// The estimate goes over the whole queue, not over the added nodes: removals of the nodes that go
// away and connections are steps of the same queue, and on a rebuilt graph they outnumber the
// additions. Sized by the added nodes alone the timer fired mid-series, 8 s before the graph was
// drawn, and the last node never reached the panel.
function watchdogMs(queueSteps: number): number
{
	return (queueSteps * ANIMATION_STEP_FALLBACK_MS) + WATCHDOG_SLACK_MS;
}

type SettingsMediator = {
	showNodeSettings: (block: Block, options: { withTransition: boolean }) => Promise<boolean>,
	// The show the mediator has in flight, null when it has none: while one is in flight the mediator
	// refuses every other show.
	getShowInFlight: () => ?Promise<void>,
};

type BlockTransitionHook = {
	on: (handler: (block: ?Block) => void) => void,
	off: (handler: (block: ?Block) => void) => void,
};

// The flags of the right panel the tour reads: the data block it hides for the length of the series,
// and whether the panel itself is still open: a panel closed by hideRightPanel() has just dropped
// the data block flag on purpose.
type AppPanelState = {
	isDataInspectorPanelShown: boolean,
	isShownRightPanel: boolean,
};

type NodeSettingsFormState = {
	block: ?Block,
	ports: ?Array<Port>,
	nodeSettings: ?NodeSettings,
	prevSavedNodeSettings: ?NodeSettings,
};

// What the settings panels show. An open panel with no node yet is a show still in flight, not a
// closed panel: the two are told apart by `isOpen`.
type PanelState = {
	isOpen: boolean,
	blockId: ?BlockId,
};

type PanelStateWatch = (handler: (state: PanelState) => void) => () => void;

// Reports the data-block flag itself: the user changes it by the toggle button of the panel
// (toggleDataInspectorPanel), and such a change is no doing of the tour.
type InspectorFlagWatch = (handler: (isShown: boolean) => void) => () => void;

type SettingsTourDeps = {
	mediator: SettingsMediator,
	blockTransitionEnd: BlockTransitionHook,
	appStore: AppPanelState,
	nodeSettingsStore: NodeSettingsFormState,
	panelStateWatch: PanelStateWatch,
	inspectorFlagWatch: InspectorFlagWatch,
	announceResult: (block: Block) => void,
};

export class SettingsTour
{
	#mediator = null;
	#blockTransitionEnd = null;
	#appStore = null;
	#nodeSettingsStore = null;
	#panelStateWatch = null;
	#inspectorFlagWatch = null;
	#announceResult = null;

	#active = false;
	#addedBlocks = new Map();
	#finalBlock = null;
	#lastShownBlock = null;
	#shown = new Set();
	#pending = null;
	#busy = false;
	// A show of this series started and not settled yet. Told apart from `#busy`, which is up for the
	// whole pass of the drain — the wait for a show of the previous series included, and such a series
	// has nothing of its own in flight.
	#ownShowInFlight = false;
	#animationFinished = false;
	#savedInspector = null;
	// The value the tour itself has last put into the data-block flag: a change to anything else is
	// somebody else writing the flag (see #onInspectorFlagChanged).
	#writtenInspector = null;
	#watchdog = null;
	#seriesBlockIds = new Set();
	#unwatchPanelState = null;
	#unwatchInspectorFlag = null;
	// Generation of the series. A show of an ended series may still be in flight when the next one
	// starts, and the number tells the drain of which series such a show comes back to.
	#epoch = 0;

	constructor({
		mediator,
		blockTransitionEnd,
		appStore,
		nodeSettingsStore,
		panelStateWatch,
		inspectorFlagWatch,
		announceResult,
	}: SettingsTourDeps)
	{
		this.#mediator = mediator;
		this.#blockTransitionEnd = blockTransitionEnd;
		this.#appStore = appStore;
		this.#nodeSettingsStore = nodeSettingsStore;
		this.#panelStateWatch = panelStateWatch;
		this.#inspectorFlagWatch = inspectorFlagWatch;
		this.#announceResult = announceResult;
	}

	/**
	 * Starts a series over the given nodes, in the order the canvas draws them. `queueLength` is the
	 * length of the whole animation queue the series has to outlive (the nodes are only a part of
	 * it), and nothing but the watchdog depends on it. A new series cancels the previous one
	 * entirely. Unsaved edits of the user are never overridden: the series does not even start over
	 * them.
	 */
	start(blocks: Array<Block>, queueLength: number): void
	{
		if (this.#active)
		{
			this.stop();
		}

		const added = new Map(blocks.map((block: Block): [BlockId, Block] => [block.id, block]));
		// No node the panel has anything to show for means nothing to lead the user over: a series
		// would only take the data block and the focus away for the whole length of the drawing and
		// give nothing back.
		const finalBlock = findFinalBlock(blocks);
		if (added.size === 0 || finalBlock === null || this.#isDirty())
		{
			return;
		}

		this.#active = true;
		this.#addedBlocks = added;
		this.#finalBlock = finalBlock;
		this.#animationFinished = false;
		// A restore still deferred from the previous series happens right before the flag is saved
		// again: while a restore is pending the flag holds the value this tour has put there, and
		// saving it would lose the value of the user. A push that starts no series returns nothing:
		// there was no action of the user, and the flag stays where the previous series left it.
		this.#restoreInspector();
		this.#savedInspector = this.#appStore.isDataInspectorPanelShown;
		// The data block section goes away right here, for the whole length of the series.
		rescueFocus(FocusAnchor.dataInspectorPanel);
		this.#writeInspector(false);
		this.#blockTransitionEnd.on(this.#onBlockShown);

		// A queue is never shorter than the nodes it draws, so a caller saying otherwise must not
		// shrink the budget below the shows it has just asked for.
		const queueSteps = Number.isFinite(queueLength) ? Math.max(queueLength, added.size) : added.size;
		this.#watchdog = setTimeout(this.#onWatchdog, watchdogMs(queueSteps));
	}

	/**
	 * Ends the series: on the regular path, on an interruption and on the watchdog alike. The
	 * panel stays on the last node shown; the data-block flag is not returned here but on the first
	 * action of the user (see #armRestoreOnUserAction).
	 */
	stop(): void
	{
		if (!this.#active)
		{
			return;
		}

		clearTimeout(this.#watchdog);
		this.#watchdog = null;
		this.#blockTransitionEnd.off(this.#onBlockShown);

		// From here nothing this series has left in flight touches the tour: the drain of the next
		// series owns the state, and a show of this one resolving into it would drive it off.
		this.#epoch += 1;
		// A show of this series that is still in flight lands in the panel after this stop, and that
		// landing is not an action of the user: the nodes of the series are remembered until it lands
		// (see #onPanelStateChanged). Only an interrupted series with a show of its own leaves anything
		// to settle — the watchdog and a cancel by the next series; on the regular path the queue has
		// drained, and a series cut short while waiting for a show of the previous one has started none
		// of its own. Then there is nothing to settle and the first node the user opens returns the flag.
		this.#seriesBlockIds = this.#ownShowInFlight ? new Set(this.#addedBlocks.keys()) : new Set();
		this.#active = false;
		this.#pending = null;
		this.#busy = false;
		this.#ownShowInFlight = false;
		this.#animationFinished = false;
		this.#finalBlock = null;
		this.#lastShownBlock = null;
		this.#shown.clear();
		this.#addedBlocks.clear();

		this.#armRestoreOnUserAction();
	}

	/**
	 * Releases everything the tour holds: a running series and a deferred restore alike. Called
	 * when the editor unmounts: neither the hook subscription nor the watches of the deferred restore
	 * may outlive it.
	 */
	destroy(): void
	{
		this.stop();
		this.#restoreInspector();
	}

	/**
	 * The graph is fully drawn: no more nodes will come. A show that is still in flight is not
	 * cut short: the series closes once the queue has drained.
	 */
	onAnimationFinished(): void
	{
		this.#animationFinished = true;
		this.#finishIfDone();
	}

	// A node has appeared on the canvas. The hook fires more often than there are nodes (it is
	// triggered before the type and element filters of the transition), hence the deduplication.
	#onBlockShown = (block: ?Block): void => {
		if (!this.#active || !block)
		{
			return;
		}

		if (!this.#addedBlocks.has(block.id) || this.#shown.has(block.id))
		{
			return;
		}

		// The series is over once the result of the build has reached the panel, and the node it ends
		// on enters `shown` before its show even starts. A step accepted after that — a node whose
		// transition lagged behind its queue step, so its hook comes late — belongs to the middle of
		// the graph, and taking it would leave the panel there instead of on the result.
		if (this.#shown.has(this.#finalBlock.id))
		{
			return;
		}

		// A node the series does not step on leaves `pending` alone instead of taking it: a large node
		// waiting for its turn would otherwise be caught up with by the ordinary nodes that came after
		// it, and never reach the panel at all. It stays out of `shown` too, so the tail of the series
		// still reaches the panel through #finishIfDone() whatever type it is. The backdrops the agent
		// draws are dropped by this very filter: their type is no step of the series either.
		if (!isTourStep(block))
		{
			return;
		}

		this.#pending = block;
		this.#drain();
	};

	#onWatchdog = (): void => {
		this.#announceOutcome();
		this.stop();
	};

	async #drain(): Promise<void>
	{
		if (this.#busy || this.#pending === null)
		{
			return;
		}

		const epoch = this.#epoch;
		this.#busy = true;

		// The mediator lives as long as the editor and is shared by every series, so a show of the
		// previous one may still be waiting for the server while this series already runs — and while
		// it is, the mediator refuses everything. A refused step is lost for good, and the last of them
		// is the result of the build the user is owed, so the series waits its turn instead. Waiting
		// costs it nothing: the busy flag holds the series open meanwhile, and the node taken after the
		// wait is the freshest one, not the one this drain started with. Once waited out the mediator
		// stays this series' own: a drain of a cancelled one shows nothing after its own await (the
		// loop below checks the epoch), and the series is the only caller of this instance.
		//
		// A free mediator is not waited for at all, and a series that never collides keeps its timing.
		const showInFlight = this.#mediator.getShowInFlight();
		if (showInFlight)
		{
			// The wait is long enough for the next push to arrive and cancel this series: the loop is
			// then not entered at all, and a node of a graph the user has left behind is never drawn.
			await showInFlight;
		}

		while (this.#pending !== null && this.#active && this.#epoch === epoch)
		{
			const target = this.#pending;
			this.#pending = null;
			this.#shown.add(target.id);

			try
			{
				// The transition belongs to the node the series ends on, and it reaches the panel by
				// either path: its own hook, or the explicit catch-up of the tail (see #finishIfDone).
				const options = target.id === this.#finalBlock?.id ? SHOW_WITH_TRANSITION : SHOW_INSTANTLY;

				this.#ownShowInFlight = true;

				// A show refused by the mediator (a node with nothing to show, a switch it declined)
				// is a step that did not happen, not a reason to end the series: the next node still
				// gets its turn, the same way a failed show does.
				// eslint-disable-next-line no-await-in-loop
				const isShown = await this.#mediator.showNodeSettings(target, options);
				if (isShown === true && this.#epoch === epoch)
				{
					this.#lastShownBlock = target;
				}
			}
			catch
			{
				// A failed show must not strand the series: the next node still gets its turn.
			}
			finally
			{
				// A show of a cancelled series settling here belongs to nobody: the flag is already
				// the one of the series running now, and dropping it would disarm its window.
				if (this.#epoch === epoch)
				{
					this.#ownShowInFlight = false;
				}
			}
		}

		// The series this drain belongs to is over: the busy flag and the completion check belong to
		// the one running now, and its own drain is the only one allowed to touch them.
		if (this.#epoch !== epoch)
		{
			return;
		}

		this.#busy = false;
		this.#finishIfDone();
	}

	#finishIfDone(): void
	{
		if (!this.#active || this.#busy || this.#pending !== null || !this.#animationFinished)
		{
			return;
		}

		// The series owes the user the result of the build, so the node it is bound to end on is
		// shown even when its hook has not arrived — and with the filter of the steps (ALG-01d) that
		// is the usual way an ordinary final node reaches the panel at all. After the show it is in
		// `shown`, and the next pass (the one `drain` makes when it empties) ends the series here
		// instead of looping.
		const final = this.#finalBlock;
		if (!this.#shown.has(final.id))
		{
			this.#pending = final;
			this.#drain();

			return;
		}

		this.#announceOutcome();
		this.stop();
	}

	/**
	 * Tells the screen reader what the panel ended up showing. Once, at the end of the series: a
	 * step takes about a second, and announcing every one of them would leave the polite queue
	 * lagging behind the screen for the whole length of the series. A series that showed nothing has
	 * nothing to announce.
	 */
	#announceOutcome(): void
	{
		if (this.#lastShownBlock === null)
		{
			return;
		}

		this.#announceResult?.(this.#lastShownBlock);
	}

	/**
	 * Arms the deferred return of the data-block flag. Returning it right at the end of the series
	 * expands the data block over the process the agent has just built, hiding the very result the
	 * user is waiting for, so the flag comes back on the first action of the user instead: a node
	 * shown in the panel by anything but a show the series left in flight, or the panel closed (on a
	 * close the tour only lets the saved value go, see #onPanelStateChanged).
	 *
	 * The flag itself is watched alongside: the user may reach it directly by the toggle button of the
	 * panel, and that choice is the freshest one there is (see #onInspectorFlagChanged).
	 */
	#armRestoreOnUserAction(): void
	{
		if (this.#savedInspector === null || this.#unwatchPanelState !== null)
		{
			return;
		}

		this.#unwatchPanelState = this.#panelStateWatch(this.#onPanelStateChanged);
		this.#unwatchInspectorFlag = this.#inspectorFlagWatch(this.#onInspectorFlagChanged);
	}

	#onPanelStateChanged = ({ isOpen, blockId }: PanelState): void => {
		// Still the series settling down: an open panel with no node yet is a show in flight, and
		// #seriesBlockIds holds the nodes whose show the interrupted series left in flight.
		if (isOpen && (blockId === null || this.#seriesBlockIds.has(blockId)))
		{
			// The window lasts until that show lands, not until the flag is back: a show in flight
			// lands once, and every node of the series shown after it is the user clicking through
			// what the agent has just built.
			if (blockId !== null)
			{
				this.#seriesBlockIds.clear();
			}

			return;
		}

		// A closed panel is the doing of hideRightPanel(), which drops the data block flag itself.
		// Putting the saved value back over that would leave the panel of the next node opened with
		// the data block, unlike the same close outside a series. The panel is closed either way, so
		// the tour just lets the flag go.
		if (!isOpen && !this.#appStore.isShownRightPanel)
		{
			this.#forgetSavedInspector();

			return;
		}

		this.#restoreInspector();
	};

	// The data block flag was written by somebody else — the toggle button of the panel is the user's
	// own way to it — and that value is a choice of the user, made later than the one the tour saved.
	// The writes of the tour itself are told apart by the value it has put there last.
	#onInspectorFlagChanged = (isShown: boolean): void => {
		if (isShown !== this.#writtenInspector)
		{
			this.#forgetSavedInspector();
		}
	};

	// The only place the tour writes the flag: the value written is remembered, so a change to
	// anything else reads as a write of somebody else.
	#writeInspector(value: boolean): void
	{
		this.#writtenInspector = value;
		this.#appStore.isDataInspectorPanelShown = value;
	}

	// Idempotent by the saved value: once the flag is back there is nothing left to return.
	#restoreInspector(): void
	{
		if (this.#savedInspector === null)
		{
			return;
		}

		this.#writeInspector(this.#savedInspector);
		this.#forgetSavedInspector();
	}

	// Ends the deferred restore without writing the flag: whatever holds it now is more recent than
	// the value the tour saved.
	#forgetSavedInspector(): void
	{
		this.#savedInspector = null;
		this.#writtenInspector = null;
		this.#seriesBlockIds.clear();
		this.#unwatchPanelState?.();
		this.#unwatchPanelState = null;
		this.#unwatchInspectorFlag?.();
		this.#unwatchInspectorFlag = null;
	}

	/**
	 * Unsaved edits exist for complex nodes only: an ordinary form has no such notion in the
	 * editor, and its content changes the same way a click on another node changes it.
	 *
	 * Asked on start of a series only. Mid-series the question has no answer worth acting on: the
	 * panel is overwritten by the next step about once a second anyway, the diagram engine is
	 * disabled while the graph animates so the user cannot reach a node to edit it, and the state
	 * a show of an empty complex node leaves behind reads as dirty on its own, which used to stop
	 * the series on an artifact of its own showing.
	 */
	#isDirty(): boolean
	{
		const { block, ports, nodeSettings, prevSavedNodeSettings } = this.#nodeSettingsStore;

		return areNodeSettingsDirty({
			nodeSettings,
			prevSavedNodeSettings,
			ports,
			blockPorts: block?.ports,
		});
	}
}

/**
 * Binds a watch to the scope that owns the editor. The tour asks for its watches after a series has
 * ended, that is well past setup(), so they have to belong to that scope and die with it even if
 * nobody stops them by hand.
 */
function watchInScope(startWatch: () => (() => void), scope): () => void
{
	const stopWatch = scope ? scope.run(startWatch) : startWatch();

	// A scope already disposed runs nothing and there is then nothing to stop either.
	return stopWatch ?? ((): void => {});
}

/**
 * Reports what the settings panels show, to whoever asks to be told about it.
 */
function createPanelStateWatch(
	commonNodeSettingsStore,
	complexNodeSettingsStore,
	scope,
): PanelStateWatch
{
	const readPanelState = (): PanelState => {
		const isComplexShown = complexNodeSettingsStore.isShown;
		const block = isComplexShown ? complexNodeSettingsStore.block : commonNodeSettingsStore.block;

		return {
			isOpen: isComplexShown || commonNodeSettingsStore.block !== null,
			blockId: block?.id ?? null,
		};
	};

	return (handler: (state: PanelState) => void): (() => void) => watchInScope(
		(): (() => void) => watch(readPanelState, handler),
		scope,
	);
}

/**
 * Reports the data-block flag of the application store: the tour has to tell its own writes of that
 * flag from the ones the user makes by the toggle button of the panel.
 */
function createInspectorFlagWatch(appStore, scope): InspectorFlagWatch
{
	return (handler: (isShown: boolean) => void): (() => void) => watchInScope(
		(): (() => void) => watch((): boolean => appStore.isDataInspectorPanelShown, handler),
		scope,
	);
}

/**
 * Announces the node whose settings the series has left in the panel. Built here and not inside the
 * tour: the phrase needs the localization of the running application, and the tour stays free of
 * both Vue and the DOM.
 */
function createResultAnnouncer(): (block: Block) => void
{
	const { getMessage } = useLoc();

	return (block: Block): void => {
		const title = block.node?.title || block.node?.defaultTitle;
		if (!title)
		{
			return;
		}

		LiveAnnouncer.announce(
			getMessage('BIZPROCDESIGNER_EDITOR_AI_AGENT_SETTINGS_SHOWN_ANNOUNCE', { '#NODE#': title }),
			'polite',
		);
	};
}

/**
 * Wires a tour to the running editor. Must be called from setup(): the engine hooks and the stores
 * are only reachable from a component context. The tour is disposed together with the owning scope
 * so neither the hook subscription, nor the watchdog, nor the watches over the panels and the
 * data-block flag outlive an unmounted editor.
 *
 * The mediator comes from the caller: it is the only dependency above this layer, and it has to be
 * an instance of its own: a single one for the whole series, shared with nobody, so the show of
 * one step never runs into the guard of a show started by a click.
 */
export function createSettingsTour(mediator: SettingsMediator): SettingsTour
{
	const scope = getCurrentScope();
	const nodeSettingsStore = useNodeSettingsStore();
	const appStore = useAppStore();
	const tour = new SettingsTour({
		mediator,
		blockTransitionEnd: useBlockDiagram().hooks.blockTransitionEnd,
		appStore,
		nodeSettingsStore,
		panelStateWatch: createPanelStateWatch(useCommonNodeSettingsStore(), nodeSettingsStore, scope),
		inspectorFlagWatch: createInspectorFlagWatch(appStore, scope),
		announceResult: createResultAnnouncer(),
	});

	if (scope)
	{
		onScopeDispose((): void => {
			tour.destroy();
		});
	}

	return tour;
}
