import { Dom, Event, Text, Type } from 'main.core';
import { PageContext } from 'ui.page-context';
import { Env } from 'landing.env';
import { PageObject } from 'landing.pageobject';
import { GenerationObserver } from 'landing.copilot.generation-observer';

import { buildFingerprint } from './target/fingerprint';
import { resolvePublishedTarget } from './target/selector-builder';
import {
	collectTargets,
	contentElementChildren,
	findAiIconClass,
	isServiceElement,
} from './target/target-model';
import type { BlockTargets } from './target/types';

// tracked base-feature nodes that own their clicks (node panels, AI buttons);
// intentionally narrower than the domain auto-class set: icons are selection
// targets of this picker, not tracked nodes
const NODE_SELECTOR = '[class*="ai-node-"]';
const NODE_CLASS_PATTERN = /^ai-node-(?:text|link|img)-\d+$/;
const SEARCH_BORDER_COLOR = '#1F86FF';
const SEARCH_BORDER_WIDTH = 1;
const SELECTED_BORDER_COLOR = '#58B1FF';
const SELECTED_BORDER_WIDTH = 2;

const PAGE_CONTEXT_MODULE_ID = 'landing';
const PAGE_CONTEXT_SELECTED_ELEMENT_KEY = 'selected_element';

const COMMAND_CHANGE_AI_SITE_START = 'LandingCopilotGeneration:onChangeAiSiteStart';
const COMMAND_CHANGE_AI_SITE_FINISH = 'LandingCopilotGeneration:onChangeAiSiteFinish';
const COMMAND_GENERATION_ERROR = 'LandingCopilotGeneration:onGenerationError';
const COMMAND_GENERATION_FINISH = 'LandingCopilotGeneration:onGenerationFinish';

// structural shape of BX.Landing.Node.Base as far as the picker needs it
export type LandingNodeBase = {
	node: HTMLElement;
	selector: string;
	getBlock: () => { id: number } | null;
};

type SelectedTarget = {
	blockId: number;
	selector: string;
	element: Element;
};

type SelectedElementPayload = {
	blockId: number;
	selector: string;
	fingerprint: string;
};

type LandingBlockLike = {
	id: number;
	node: HTMLElement;
};

type BlockCollectionLike = {
	getByChildNode: (node: Element) => LandingBlockLike | null;
};

type PageContextLike = {
	set: (moduleId: string, key: string, value: unknown) => void;
	delete: (moduleId: string, key: string) => void;
	getCustom: (moduleId: string, key: string) => unknown;
};

type PullEvent = {
	command?: string;
	params?: {
		generationId?: number | string;
		landingId?: number | string;
	};
};

type BxGlobal = {
	addCustomEvent: (eventName: string, handler: (...args: unknown[]) => void) => void;
	PULL?: {
		subscribe: (config: { type: string; moduleId: string; callback: (event: PullEvent) => void }) => void;
	};
	PullClient?: {
		SubscriptionType: { Server: string };
	};
	UI?: {
		PageContext?: {
			PageContext?: PageContextLike;
		};
	};
};

declare const BX: BxGlobal;

/**
 * Selection of AI-site targets in the editor: base-feature nodes
 * (text/link/img), icons, LCA element groups and the whole block.
 * Tracks hover with a search highlight frame, toggles the selected
 * frame on click and publishes the selection (block id, selector,
 * fingerprint) to the CoPilot PageContext.
 * @memberOf BX.Landing.Copilot
 */
export class ElementPicker
{
	static instance: ElementPicker | null = null;

	static getInstance(): ElementPicker
	{
		if (!ElementPicker.instance)
		{
			ElementPicker.instance = new ElementPicker();
		}

		return ElementPicker.instance;
	}

	static isEnabled(): boolean
	{
		return Env.getInstance().getOptions().aiSiteSelectedElementEditEnabled === true;
	}

	#editorDocument: Document | null = null;
	#searchFrame: HTMLElement | null = null;
	#selectedFrame: HTMLElement | null = null;
	#hoveredTarget: Element | null = null;
	// raw element under the cursor, resolved to a target on the next frame
	#hoverCandidate: Element | null = null;
	#hoverSyncHandle: number | null = null;
	#isSubscribed: boolean = false;
	#isFrameLoadBound: boolean = false;
	#isResizeBound: boolean = false;
	#selected: SelectedTarget | null = null;
	// non-null while own generation is in flight: doubles as the mode lock
	#generationObserver: GenerationObserver | null = null;
	// per-block target model (ALG-01), filled lazily on first hover;
	// invalidated by the same events that reset the selection
	#blockTargets: Map<number, BlockTargets> = new Map();

	activate(): void
	{
		// the editor iframe may navigate after the initial bootstrap,
		// replacing its document: re-resolve and rebind on every call
		const editorDocument = this.#resolveEditorDocument();
		if (!editorDocument || editorDocument === this.#editorDocument)
		{
			return;
		}

		if (this.#editorDocument)
		{
			this.#editorDocument.removeEventListener('mousemove', this.#onMouseMove, true);
			this.#editorDocument.documentElement.removeEventListener('mouseleave', this.#onMouseLeave);
			Event.unbind(this.#editorDocument, 'click', this.#onClick);
			// nodes of the replaced document are gone along with the old frames
			this.clearSelection();
		}

		this.#editorDocument = editorDocument;
		this.#hoveredTarget = null;
		this.#hoverCandidate = null;
		this.#hoverSyncHandle = null;
		// cached targets reference elements of the replaced document
		this.#blockTargets.clear();
		// overlay frames live in the editor body, never inside content nodes:
		// anything inserted into a node would be persisted by block content save
		this.#searchFrame = this.#createFrame(editorDocument, SEARCH_BORDER_COLOR, SEARCH_BORDER_WIDTH);
		this.#selectedFrame = this.#createFrame(editorDocument, SELECTED_BORDER_COLOR, SELECTED_BORDER_WIDTH);

		// capture-phase mousemove: editor code stops propagation of bubbling
		// mouse events inside blocks, but the document is the first node of
		// the capture phase — nothing below can withhold the event from it
		editorDocument.addEventListener('mousemove', this.#onMouseMove, { capture: true, passive: true });
		editorDocument.documentElement.addEventListener('mouseleave', this.#onMouseLeave);
		Event.bind(editorDocument, 'click', this.#onClick);

		// the frame may reload without any Block:init afterwards — rebind on its load as well
		const frameElement = editorDocument.defaultView?.frameElement;
		if (frameElement && !this.#isFrameLoadBound)
		{
			this.#isFrameLoadBound = true;
			Event.bind(frameElement, 'load', () => this.activate());
		}

		if (!this.#isResizeBound && editorDocument.defaultView)
		{
			this.#isResizeBound = true;
			Event.bind(editorDocument.defaultView, 'resize', this.#onEditorResize);
		}

		if (!this.#isSubscribed)
		{
			this.#isSubscribed = true;
			this.#subscribeToBlockEvents();
			this.#subscribeToPull();
		}
	}

	/**
	 * Toggles single-element selection for the node (BX.Landing.Node.*):
	 * a repeated toggle of the same element clears the selection,
	 * a different element replaces the previous one. Node panels keep
	 * calling this public entry; internally the node becomes a target.
	 */
	toggleSelection(node: LandingNodeBase): void
	{
		const block = node.getBlock();
		if (!block)
		{
			return;
		}

		this.#toggleTarget({
			blockId: block.id,
			selector: node.selector.split('@')[0],
			element: node.node,
		});
	}

	#toggleTarget(target: SelectedTarget): void
	{
		this.activate();
		if (!this.#selectedFrame || this.#isLocked())
		{
			return;
		}

		if (
			this.#selected
			&& this.#selected.selector === target.selector
			&& this.#selected.blockId === target.blockId
		)
		{
			this.clearSelection();

			return;
		}

		if (this.#selected)
		{
			this.clearSelection();
		}

		this.#selected = target;
		this.#placeFrame(this.#selectedFrame, target.element);
		this.#refreshHoverFrame();
		this.#syncPageContext();
	}

	clearSelection(): void
	{
		this.#hideFrame(this.#selectedFrame);
		this.#selected = null;
		this.#refreshHoverFrame();
		this.#syncPageContext();
	}

	/**
	 * Publishes the current selection to the CoPilot PageContext on every
	 * selection change. The key exists only while a valid selected node
	 * is attached to the DOM; otherwise it is removed.
	 */
	#syncPageContext(): void
	{
		const pageContext = this.#resolvePageContext();
		if (!pageContext)
		{
			return;
		}

		const payload = this.#buildSelectedElementPayload();
		if (payload)
		{
			pageContext.set(PAGE_CONTEXT_MODULE_ID, PAGE_CONTEXT_SELECTED_ELEMENT_KEY, payload);
		}
		else
		{
			pageContext.delete(PAGE_CONTEXT_MODULE_ID, PAGE_CONTEXT_SELECTED_ELEMENT_KEY);
		}
	}

	#buildSelectedElementPayload(): SelectedElementPayload | null
	{
		if (!this.#selected)
		{
			return null;
		}

		const blockId = Text.toInteger(this.#selected.blockId);
		const selector = Type.isStringFilled(this.#selected.selector) ? this.#selected.selector : '';
		const element = this.#selected.element;
		if (blockId <= 0 || selector === '' || !element || !element.isConnected)
		{
			return null;
		}

		// the fingerprint (DTO-02) reflects the target state at publication time
		return { blockId, selector, fingerprint: buildFingerprint(element) };
	}

	#resolvePageContext(): PageContextLike | null
	{
		// the chat panel and its message sender live in the root editor window;
		// inside the edit-mode frame the local PageContext is a different
		// instance, so the selection is published through the root one
		let rootPageContext: PageContextLike | null = null;
		try
		{
			rootPageContext = (PageObject.getRootWindow() as { BX?: BxGlobal } | null)
				?.BX?.UI?.PageContext?.PageContext ?? null;
		}
		catch
		{
			rootPageContext = null;
		}

		const pageContext = rootPageContext || (PageContext as PageContextLike);
		if (!pageContext || !Type.isFunction(pageContext.set) || !Type.isFunction(pageContext.delete))
		{
			return null;
		}

		return pageContext;
	}

	#subscribeToBlockEvents(): void
	{
		BX.addCustomEvent('BX.Landing.Block:onContentSave', this.#onBlockContentSave);
		BX.addCustomEvent('BX.Landing.Block:remove', this.#onBlockRemove);
		BX.addCustomEvent('BX.Landing.Block:afterRemove', this.#onBlockRemove);
	}

	#onBlockContentSave = (blockId: unknown): void => {
		this.#clearSelectionForBlock(Text.toInteger(blockId));
	};

	#onBlockRemove = (event: unknown): void => {
		this.#clearSelectionForBlock(Text.toInteger((event as { blockId?: number } | null)?.blockId));
	};

	#clearSelectionForBlock(blockId: number): void
	{
		if (blockId > 0)
		{
			this.#blockTargets.delete(blockId);
		}

		if (blockId > 0 && this.#selected && this.#selected.blockId === blockId)
		{
			this.clearSelection();
		}
	}

	/**
	 * Own PULL subscription (same shape as GenerationObserver#observe):
	 * a dedicated subscription receives every landing event regardless
	 * of "claiming" handlers in the shared pull handler registry.
	 */
	#subscribeToPull(): void
	{
		// the pull client runs in the root editor window; the edit-mode frame
		// may not have its own instance, so subscribe through the root one
		let rootBX: BxGlobal | null = null;
		try
		{
			rootBX = (PageObject.getRootWindow() as { BX?: BxGlobal } | null)?.BX ?? null;
		}
		catch
		{
			rootBX = null;
		}

		const pullBX = rootBX?.PULL?.subscribe ? rootBX : BX;
		if (!pullBX?.PULL?.subscribe || !pullBX?.PullClient?.SubscriptionType)
		{
			return;
		}

		pullBX.PULL.subscribe({
			type: pullBX.PullClient.SubscriptionType.Server,
			moduleId: 'landing',
			callback: this.#onPullEvent,
		});
	}

	#onPullEvent = (event: PullEvent): void => {
		const command = String(event?.command || '');

		if (command === COMMAND_CHANGE_AI_SITE_START)
		{
			this.#onGenerationStart(event);
		}
		else if (command === COMMAND_CHANGE_AI_SITE_FINISH)
		{
			this.#onChangeAiSiteFinish(event);
		}
		else if (
			command === COMMAND_GENERATION_ERROR
			|| command === COMMAND_GENERATION_FINISH
		)
		{
			this.#unlockByGeneration(Text.toInteger(event?.params?.generationId));
		}
	};

	#onGenerationStart(event: PullEvent): void
	{
		const landingId = Text.toInteger(event?.params?.landingId);
		if (this.#isForeignLanding(landingId))
		{
			return;
		}

		// blocks are about to change, a published selector must not outlive them
		this.clearSelection();
		this.#blockTargets.clear();

		const generationId = Text.toInteger(event?.params?.generationId);
		if (generationId > 0 && landingId > 0 && landingId === this.#resolveCurrentLandingId())
		{
			this.#lock(generationId, landingId);
		}
	}

	#onChangeAiSiteFinish(event: PullEvent): void
	{
		const landingId = Text.toInteger(event?.params?.landingId);
		if (!this.#isForeignLanding(landingId))
		{
			// blocks are rewritten, the stored selector is invalid
			this.clearSelection();
			this.#blockTargets.clear();
		}

		this.#unlockByGeneration(Text.toInteger(event?.params?.generationId));
	}

	#isForeignLanding(landingId: number): boolean
	{
		const currentLandingId = this.#resolveCurrentLandingId();

		return landingId > 0 && currentLandingId > 0 && landingId !== currentLandingId;
	}

	#resolveCurrentLandingId(): number
	{
		return Text.toInteger(GenerationObserver.resolveLandingId());
	}

	#lock(generationId: number, landingId: number): void
	{
		this.#generationObserver = new GenerationObserver(generationId, { landingId });
		this.#hoveredTarget = null;
		this.#hoverCandidate = null;
		this.#hideFrame(this.#searchFrame);
	}

	#unlockByGeneration(generationId: number): void
	{
		if (
			!this.#generationObserver
			|| generationId <= 0
			|| this.#generationObserver.getGenerationId() !== generationId
		)
		{
			return;
		}

		this.#generationObserver.stopObserve();
		this.#generationObserver = null;
		this.clearSelection();
		this.#blockTargets.clear();
	}

	#isLocked(): boolean
	{
		return this.#generationObserver !== null;
	}

	#resolveEditorDocument(): Document | null
	{
		// the picker binds only its own document: content nodes, node panels
		// and AI buttons live in the edit-mode frame where this copy is loaded.
		// The root window loads a copy too — it has no ai-nodes and stays passive.
		if (document.body && Dom.hasClass(document.body, 'landing-editor'))
		{
			return document;
		}

		return null;
	}

	#onMouseMove = (event: MouseEvent): void => {
		if (!Type.isElementNode(event.target))
		{
			return;
		}

		const candidate = event.target as Element;
		if (candidate === this.#hoverCandidate)
		{
			return;
		}

		this.#hoverCandidate = candidate;
		this.#scheduleHoverSync();
	};

	#onMouseLeave = (): void => {
		this.#hoverCandidate = null;
		this.#hoveredTarget = null;
		this.#hideFrame(this.#searchFrame);
	};

	// target resolve runs at most once per animation frame, not on every event
	#scheduleHoverSync(): void
	{
		if (this.#hoverSyncHandle !== null)
		{
			return;
		}

		const editorWindow = this.#editorDocument?.defaultView;
		if (!editorWindow)
		{
			return;
		}

		this.#hoverSyncHandle = editorWindow.requestAnimationFrame(() => {
			this.#hoverSyncHandle = null;
			this.#syncHoverFrame();
		});
	}

	#syncHoverFrame(): void
	{
		if (this.#isLocked())
		{
			return;
		}

		const node = this.#resolveHoverTarget(this.#hoverCandidate);
		if (node === this.#hoveredTarget)
		{
			return;
		}

		this.#hoveredTarget = node;
		// the selected element already carries the bold frame — the thin
		// search frame on top of it would only add visual noise
		if (node && node !== this.#selected?.element)
		{
			this.#placeFrame(this.#searchFrame, node);
		}
		else
		{
			this.#hideFrame(this.#searchFrame);
		}
	}

	// re-evaluates the search frame after the selection changes: the hover
	// target itself is unchanged, so the #hoveredTarget cache must be dropped
	#refreshHoverFrame(): void
	{
		this.#hoveredTarget = null;
		this.#syncHoverFrame();
	}

	/**
	 * Own click handler for group/block/icon selection. Clicks inside
	 * text/link/img nodes are dropped in any editor state: nodes own their
	 * clicks (AI buttons in panels), and stopPropagation of node handlers
	 * is not guaranteed to fire before this listener. Unhandled clicks are
	 * not prevented or stopped — "click into emptiness" side effects of the
	 * editor (closing compact panels) must survive.
	 */
	#onClick = (event: MouseEvent): void => {
		if (this.#isLocked())
		{
			return;
		}

		// an icon under the cursor wins over its host node: Icon instances stop
		// their own clicks before this listener, so this branch serves icons
		// without a Node instance (grouped ones) — inside nodes included
		const trackedNode = this.#resolveTrackedNode(event.target);
		const context = this.#resolveBlockContext(event.target);
		const hoveredIcon = context
			? this.#resolveIconAncestor(event.target, trackedNode, context.targets)
			: null;
		if (!hoveredIcon && trackedNode)
		{
			return;
		}

		if (!context)
		{
			return;
		}

		const targetElement = hoveredIcon ?? this.#resolveTargetElement(context);
		if (!targetElement)
		{
			return;
		}

		const iconClass = this.#resolveIconClass(targetElement, context.targets);
		if (iconClass !== null)
		{
			// icons are addressed by the auto-class, same as base feature nodes
			this.#toggleTarget({
				blockId: context.blockId,
				selector: `.${iconClass}`,
				element: targetElement,
			});

			return;
		}

		// group or whole block: publish the actual addressable target
		// (the resolver may lift it to an unambiguous ancestor)
		const published = resolvePublishedTarget(targetElement, context.contentRoot);
		if (!published)
		{
			return;
		}

		this.#toggleTarget({
			blockId: context.blockId,
			selector: published.selector,
			element: published.element,
		});
	};

	/**
	 * Resolves the single hover target under the cursor (У1): an icon first
	 * (even inside a node — the click on it selects the icon), then a
	 * text/link/img node by the base feature rules, then the closest LCA group
	 * along the ancestor chain, then the whole block. One frame at a time.
	 */
	#resolveHoverTarget(eventTarget: EventTarget | null): Element | null
	{
		const node = this.#resolveTrackedNode(eventTarget);
		const context = this.#resolveBlockContext(eventTarget);
		const icon = context
			? this.#resolveIconAncestor(eventTarget, node, context.targets)
			: null;
		if (icon)
		{
			return icon;
		}
		if (node)
		{
			return node;
		}
		if (!context)
		{
			return null;
		}

		return this.#resolveTargetElement(context);
	}

	/**
	 * The closest icon ancestor of the event target, but only when the block
	 * model lists it as an icon target (not inside quarantine or a service
	 * subtree) and it is deeper than the tracked node (an icon inside a node
	 * is the more specific target).
	 */
	#resolveIconAncestor(
		eventTarget: EventTarget | null,
		trackedNode: Element | null,
		targets: BlockTargets,
	): Element | null
	{
		if (!Type.isElementNode(eventTarget))
		{
			return null;
		}

		let candidate = (eventTarget as Element).closest(NODE_SELECTOR);
		while (candidate)
		{
			if (findAiIconClass(candidate) !== null)
			{
				const isTargetIcon = targets.icons.includes(candidate);
				const isDeeperThanNode = !trackedNode || trackedNode.contains(candidate);

				return isTargetIcon && isDeeperThanNode ? candidate : null;
			}

			candidate = candidate.parentElement ? candidate.parentElement.closest(NODE_SELECTOR) : null;
		}

		return null;
	}

	/**
	 * Maps the event target to its block: the block id and the block content
	 * root (the first content element child of the #block{id} wrapper — the
	 * `content` property of the legacy Block may point at an action panel
	 * moved ahead of the content for focus order). Returns null outside of
	 * blocks and for targets in the wrapper but outside the content root.
	 */
	#resolveBlockContext(eventTarget: EventTarget | null): {
		blockId: number;
		contentRoot: Element;
		element: Element;
		targets: BlockTargets;
	} | null
	{
		if (!Type.isElementNode(eventTarget))
		{
			return null;
		}

		const element = eventTarget as Element;

		let block: LandingBlockLike | null = null;
		try
		{
			const blocks = PageObject.getBlocks() as BlockCollectionLike | null;
			block = blocks?.getByChildNode ? (blocks.getByChildNode(element) ?? null) : null;
		}
		catch
		{
			block = null;
		}

		const blockId = Text.toInteger(block?.id);
		if (!block || blockId <= 0)
		{
			return null;
		}

		const contentRoot = contentElementChildren(block.node)[0] ?? null;
		if (!contentRoot || !contentRoot.contains(element))
		{
			return null;
		}

		let targets = this.#blockTargets.get(blockId);
		if (!targets || targets.blockTarget !== contentRoot)
		{
			targets = collectTargets(contentRoot);
			this.#blockTargets.set(blockId, targets);
		}

		return { blockId, contentRoot, element, targets };
	}

	/**
	 * Walks the ancestor chain from the event target to the content root and
	 * returns the deepest icon or group target; the content root (the whole
	 * block) is the fallback. Editor service subtrees (card action panels
	 * etc.) are not targets: the walk aborts on them.
	 */
	#resolveTargetElement(
		context: { contentRoot: Element; element: Element; targets: BlockTargets },
	): Element | null
	{
		let current: Element | null = context.element;
		while (current && current !== context.contentRoot)
		{
			if (isServiceElement(current))
			{
				return null;
			}

			if (context.targets.icons.includes(current) || context.targets.groups.includes(current))
			{
				return current;
			}

			current = current.parentElement;
		}

		return context.contentRoot;
	}

	#resolveIconClass(element: Element, targets: BlockTargets): string | null
	{
		if (!targets.icons.includes(element))
		{
			return null;
		}

		return findAiIconClass(element);
	}

	#createFrame(editorDocument: Document, color: string, width: number): HTMLElement
	{
		const frame = editorDocument.createElement('div');
		frame.className = 'landing-copilot-element-picker-frame';
		Dom.style(frame, {
			position: 'absolute',
			display: 'none',
			'z-index': 9999,
			'pointer-events': 'none',
			border: `${width}px dashed ${color}`,
		});
		Dom.append(frame, editorDocument.body);

		return frame;
	}

	#placeFrame(frame: HTMLElement | null, node: Element): void
	{
		const editorWindow = node.ownerDocument.defaultView;
		if (!frame || !editorWindow)
		{
			return;
		}

		const rect = node.getBoundingClientRect();
		Dom.style(frame, {
			top: `${rect.top + editorWindow.scrollY}px`,
			left: `${rect.left + editorWindow.scrollX}px`,
			width: `${rect.width}px`,
			height: `${rect.height}px`,
			display: 'block',
		});
	}

	#hideFrame(frame: HTMLElement | null): void
	{
		if (frame)
		{
			Dom.style(frame, { display: 'none' });
		}
	}

	#onEditorResize = (): void => {
		const element = this.#selected?.element;
		if (element && element.isConnected)
		{
			this.#placeFrame(this.#selectedFrame, element);
		}
	};

	#resolveTrackedNode(target: EventTarget | null): Element | null
	{
		if (!Type.isElementNode(target))
		{
			return null;
		}

		let candidate = (target as Element).closest(NODE_SELECTOR);
		while (candidate)
		{
			if ([...candidate.classList].some((className) => NODE_CLASS_PATTERN.test(className)))
			{
				return candidate;
			}

			candidate = candidate.parentElement ? candidate.parentElement.closest(NODE_SELECTOR) : null;
		}

		return null;
	}
}

const bootstrap = (): void => {
	if (ElementPicker.isEnabled())
	{
		ElementPicker.getInstance().activate();
	}
};

// Env options arrive via BX.ready on the editor page, so defer the check until full load
if (document.readyState === 'complete')
{
	bootstrap();
}
else
{
	Event.bindOnce(window, 'load', bootstrap);
}

// blocks init after the editor frame (re)loads its document — rebind hover tracking there
BX.addCustomEvent('BX.Landing.Block:init', bootstrap);
