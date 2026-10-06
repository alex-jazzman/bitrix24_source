/* eslint-disable */
this.BX = this.BX || {};
this.BX.Landing = this.BX.Landing || {};
(function (exports, main_core, ui_pageContext, landing_env, landing_pageobject, landing_copilot_generationObserver) {
	'use strict';

	const AI_NODE_CLASS_PATTERN = /^ai-node-(?:text|link|img|icon)-\d+$/;
	const AI_ICON_CLASS_PATTERN = /^ai-node-icon-\d+$/;
	const SERVICE_CLASS_PREFIX = 'landing-ui-';
	const SERVICE_CLASSES = new Set(['landing-highlight-border', 'landing-designer-block-pseudo-last', 'main-ui-loader', 'landing__copilot-skeleton_animated-text', 'landing-block-user-action']);
	const QUARANTINE_CLASSES = new Set(['bitrix24forms']);
	function isServiceElement(element) {
		if (element.tagName === 'SCRIPT') {
			return true;
		}
		const classList = [...element.classList];
		if (classList.length === 0) {
			return element.hasAttribute('hidden');
		}
		return classList.some(className => className.startsWith(SERVICE_CLASS_PREFIX) || SERVICE_CLASSES.has(className));
	}
	function isQuarantineContainer(element) {
		return [...element.classList].some(className => QUARANTINE_CLASSES.has(className));
	}
	function contentElementChildren(node) {
		return [...node.children].filter(child => !isServiceElement(child));
	}
	function isAiNodeElement(element) {
		return [...element.classList].some(className => AI_NODE_CLASS_PATTERN.test(className));
	}
	function findAiIconClass(element) {
		return [...element.classList].find(className => AI_ICON_CLASS_PATTERN.test(className)) ?? null;
	}
	function collectTargets(contentRoot) {
		const nodes = [];
		const icons = [];
		const groups = [];
		const walk = (element, insideNode) => {
			const isNode = isAiNodeElement(element);
			if (findAiIconClass(element) !== null) {
				icons.push(element);
			}
			if (isNode) {
				nodes.push(element);
			}
			if (isQuarantineContainer(element)) {
				return isNode ? 1 : 0;
			}
			let subtreeCount = isNode ? 1 : 0;
			let childMax = 0;
			for (const child of contentElementChildren(element)) {
				const childCount = walk(child, insideNode || isNode);
				subtreeCount += childCount;
				childMax = Math.max(childMax, childCount);
			}
			const isGroup = element !== contentRoot && !isNode && !insideNode && subtreeCount >= 2
			&& childMax < subtreeCount;
			if (isGroup) {
				groups.push(element);
			}
			return subtreeCount;
		};
		walk(contentRoot, false);
		return {
			nodes,
			icons,
			groups,
			blockTarget: contentRoot
		};
	}

	const TEXT_LENGTH_LIMIT = 64;
	const WHITESPACE_RUN_REGEX = new RegExp('[\\t-\\r \\u0085\\u00A0\\u1680\\u180E\\u2000-\\u200A\\u2028\\u2029\\u202F\\u205F\\u3000]+', 'g');
	const ENTITY_REGEX = /&(?:[a-zA-Z][a-zA-Z0-9]*|#(?:[0-9]+|[xX][0-9a-fA-F]+));/g;
	function buildFingerprint(target) {
		const tag = target.tagName.toLowerCase();
		const childCount = contentElementChildren(target).length;
		const text = normalizeFingerprintText(collectContentText(target));
		return `${tag}|${childCount}|${hashFnv1a32(text)}`;
	}
	function collectContentText(target) {
		let text = '';
		for (const child of target.childNodes) {
			if (child.nodeType === Node.TEXT_NODE) {
				text += child.nodeValue ?? '';
			} else if (child.nodeType === Node.ELEMENT_NODE) {
				const element = child;
				if (!isServiceElement(element) && !isQuarantineContainer(element)) {
					text += collectContentText(element);
				}
			}
		}
		return text;
	}
	function normalizeFingerprintText(text) {
		const decoded = decodeHtmlEntities(text);
		const collapsed = decoded.replace(WHITESPACE_RUN_REGEX, ' ');
		const trimmed = collapsed.replace(/^ +/, '').replace(/ +$/, '');
		return [...trimmed].slice(0, TEXT_LENGTH_LIMIT).join('');
	}
	function isDecodableCodePoint(code) {
		if (code === 0x09 || code === 0x0A || code === 0x0C) {
			return true;
		}
		if (code >= 0x20 && code <= 0x7E) {
			return true;
		}
		if (code < 0xA0 || code > 0x10FFFF) {
			return false;
		}
		if (code >= 0xD800 && code <= 0xDFFF) {
			return false;
		}
		if (code >= 0xFDD0 && code <= 0xFDEF) {
			return false;
		}
		return (code & 0xFFFE) !== 0xFFFE;
	}
	function decodeHtmlEntities(text) {
		if (!text.includes('&')) {
			return text;
		}
		let decoder = null;
		return text.replace(ENTITY_REGEX, entity => {
			if (entity[1] === '#') {
				const code = entity[2] === 'x' || entity[2] === 'X' ? Number.parseInt(entity.slice(3, -1), 16) : Number.parseInt(entity.slice(2, -1), 10);
				return isDecodableCodePoint(code) ? String.fromCodePoint(code) : entity;
			}
			decoder = decoder ?? document.createElement('textarea');
			decoder.innerHTML = entity;
			const decoded = decoder.value;
			if (decoded === entity) {
				return entity;
			}
			if (decoded.endsWith(';') && decoded !== ';') {
				return entity;
			}
			return decoded;
		});
	}
	function hashFnv1a32(text) {
		const bytes = new TextEncoder().encode(text);
		let hash = 0x811C9DC5;
		for (const byte of bytes) {
			hash ^= byte;
			hash = Math.imul(hash, 0x01000193) >>> 0;
		}
		return hash.toString(16).padStart(8, '0');
	}

	const SEGMENT_REGEX = /^([a-z][a-z0-9-]*)(?::nth-child\((\d+)\))?$/i;
	function buildSelector(element, contentRoot) {
		const path = [];
		let current = element;
		while (current !== contentRoot) {
			const parent = current.parentElement;
			if (!parent) {
				return null;
			}
			const siblings = contentElementChildren(parent);
			const index = siblings.indexOf(current);
			if (index === -1) {
				return null;
			}
			const tag = current.tagName.toLowerCase();
			const hasSameTagSibling = siblings.some(sibling => sibling !== current && sibling.tagName.toLowerCase() === tag);
			path.unshift(hasSameTagSibling ? `${tag}:nth-child(${index + 1})` : tag);
			current = parent;
		}
		path.unshift(contentRoot.tagName.toLowerCase());
		return path.join(' > ');
	}
	function walkResolve(contentRoot, selector) {
		const segments = selector.split('>').map(segment => segment.trim());
		const parsedRoot = parseSegment(segments[0]);
		if (!parsedRoot || parsedRoot.position !== null || contentRoot.tagName.toLowerCase() !== parsedRoot.tag) {
			return null;
		}
		let node = contentRoot;
		for (const segment of segments.slice(1)) {
			const parsed = parseSegment(segment);
			if (!parsed) {
				return null;
			}
			const children = contentElementChildren(node);
			if (parsed.position !== null) {
				const candidate = children[parsed.position - 1];
				if (!candidate || candidate.tagName.toLowerCase() !== parsed.tag) {
					return null;
				}
				node = candidate;
			} else {
				const matched = children.filter(child => child.tagName.toLowerCase() === parsed.tag);
				if (matched.length !== 1) {
					return null;
				}
				node = matched[0];
			}
		}
		return node;
	}
	function resolvePublishedTarget(element, contentRoot) {
		let current = element;
		while (current) {
			if (isServiceElement(current) || isQuarantineContainer(current) || hasQuarantineAncestor(current, contentRoot)) {
				current = current === contentRoot ? null : current.parentElement;
				continue;
			}
			const selector = buildSelector(current, contentRoot);
			if (selector !== null && walkResolve(contentRoot, selector) === current) {
				return {
					element: current,
					selector,
					fingerprint: buildFingerprint(current)
				};
			}
			current = current === contentRoot ? null : current.parentElement;
		}
		return null;
	}
	function hasQuarantineAncestor(element, contentRoot) {
		let current = element.parentElement;
		while (current && current !== contentRoot.parentElement) {
			if (isQuarantineContainer(current)) {
				return true;
			}
			if (current === contentRoot) {
				return false;
			}
			current = current.parentElement;
		}
		return false;
	}
	function parseSegment(segment) {
		const match = SEGMENT_REGEX.exec(segment);
		if (!match) {
			return null;
		}
		return {
			tag: match[1].toLowerCase(),
			position: match[2] === undefined ? null : Number.parseInt(match[2], 10)
		};
	}

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
	class ElementPicker {
		static instance = null;
		static getInstance() {
			if (!ElementPicker.instance) {
				ElementPicker.instance = new ElementPicker();
			}
			return ElementPicker.instance;
		}
		static isEnabled() {
			return landing_env.Env.getInstance().getOptions().aiSiteSelectedElementEditEnabled === true;
		}
		#editorDocument = null;
		#searchFrame = null;
		#selectedFrame = null;
		#hoveredTarget = null;
		#hoverCandidate = null;
		#hoverSyncHandle = null;
		#isSubscribed = false;
		#isFrameLoadBound = false;
		#isResizeBound = false;
		#selected = null;
		#generationObserver = null;
		#blockTargets = new Map();
		activate() {
			const editorDocument = this.#resolveEditorDocument();
			if (!editorDocument || editorDocument === this.#editorDocument) {
				return;
			}
			if (this.#editorDocument) {
				this.#editorDocument.removeEventListener('mousemove', this.#onMouseMove, true);
				this.#editorDocument.documentElement.removeEventListener('mouseleave', this.#onMouseLeave);
				main_core.Event.unbind(this.#editorDocument, 'click', this.#onClick);
				this.clearSelection();
			}
			this.#editorDocument = editorDocument;
			this.#hoveredTarget = null;
			this.#hoverCandidate = null;
			this.#hoverSyncHandle = null;
			this.#blockTargets.clear();
			this.#searchFrame = this.#createFrame(editorDocument, SEARCH_BORDER_COLOR, SEARCH_BORDER_WIDTH);
			this.#selectedFrame = this.#createFrame(editorDocument, SELECTED_BORDER_COLOR, SELECTED_BORDER_WIDTH);
			editorDocument.addEventListener('mousemove', this.#onMouseMove, {
				capture: true,
				passive: true
			});
			editorDocument.documentElement.addEventListener('mouseleave', this.#onMouseLeave);
			main_core.Event.bind(editorDocument, 'click', this.#onClick);
			const frameElement = editorDocument.defaultView?.frameElement;
			if (frameElement && !this.#isFrameLoadBound) {
				this.#isFrameLoadBound = true;
				main_core.Event.bind(frameElement, 'load', () => this.activate());
			}
			if (!this.#isResizeBound && editorDocument.defaultView) {
				this.#isResizeBound = true;
				main_core.Event.bind(editorDocument.defaultView, 'resize', this.#onEditorResize);
			}
			if (!this.#isSubscribed) {
				this.#isSubscribed = true;
				this.#subscribeToBlockEvents();
				this.#subscribeToPull();
			}
		}
		toggleSelection(node) {
			const block = node.getBlock();
			if (!block) {
				return;
			}
			this.#toggleTarget({
				blockId: block.id,
				selector: node.selector.split('@')[0],
				element: node.node
			});
		}
		#toggleTarget(target) {
			this.activate();
			if (!this.#selectedFrame || this.#isLocked()) {
				return;
			}
			if (this.#selected && this.#selected.selector === target.selector && this.#selected.blockId === target.blockId) {
				this.clearSelection();
				return;
			}
			if (this.#selected) {
				this.clearSelection();
			}
			this.#selected = target;
			this.#placeFrame(this.#selectedFrame, target.element);
			this.#refreshHoverFrame();
			this.#syncPageContext();
		}
		clearSelection() {
			this.#hideFrame(this.#selectedFrame);
			this.#selected = null;
			this.#refreshHoverFrame();
			this.#syncPageContext();
		}
		#syncPageContext() {
			const pageContext = this.#resolvePageContext();
			if (!pageContext) {
				return;
			}
			const payload = this.#buildSelectedElementPayload();
			if (payload) {
				pageContext.set(PAGE_CONTEXT_MODULE_ID, PAGE_CONTEXT_SELECTED_ELEMENT_KEY, payload);
			} else {
				pageContext.delete(PAGE_CONTEXT_MODULE_ID, PAGE_CONTEXT_SELECTED_ELEMENT_KEY);
			}
		}
		#buildSelectedElementPayload() {
			if (!this.#selected) {
				return null;
			}
			const blockId = main_core.Text.toInteger(this.#selected.blockId);
			const selector = main_core.Type.isStringFilled(this.#selected.selector) ? this.#selected.selector : '';
			const element = this.#selected.element;
			if (blockId <= 0 || selector === '' || !element || !element.isConnected) {
				return null;
			}
			return {
				blockId,
				selector,
				fingerprint: buildFingerprint(element)
			};
		}
		#resolvePageContext() {
			let rootPageContext = null;
			try {
				rootPageContext = landing_pageobject.PageObject.getRootWindow()?.BX?.UI?.PageContext?.PageContext ?? null;
			} catch {
				rootPageContext = null;
			}
			const pageContext = rootPageContext || ui_pageContext.PageContext;
			if (!pageContext || !main_core.Type.isFunction(pageContext.set) || !main_core.Type.isFunction(pageContext.delete)) {
				return null;
			}
			return pageContext;
		}
		#subscribeToBlockEvents() {
			BX.addCustomEvent('BX.Landing.Block:onContentSave', this.#onBlockContentSave);
			BX.addCustomEvent('BX.Landing.Block:remove', this.#onBlockRemove);
			BX.addCustomEvent('BX.Landing.Block:afterRemove', this.#onBlockRemove);
		}
		#onBlockContentSave = blockId => {
			this.#clearSelectionForBlock(main_core.Text.toInteger(blockId));
		};
		#onBlockRemove = event => {
			this.#clearSelectionForBlock(main_core.Text.toInteger(event?.blockId));
		};
		#clearSelectionForBlock(blockId) {
			if (blockId > 0) {
				this.#blockTargets.delete(blockId);
			}
			if (blockId > 0 && this.#selected && this.#selected.blockId === blockId) {
				this.clearSelection();
			}
		}
		#subscribeToPull() {
			let rootBX = null;
			try {
				rootBX = landing_pageobject.PageObject.getRootWindow()?.BX ?? null;
			} catch {
				rootBX = null;
			}
			const pullBX = rootBX?.PULL?.subscribe ? rootBX : BX;
			if (!pullBX?.PULL?.subscribe || !pullBX?.PullClient?.SubscriptionType) {
				return;
			}
			pullBX.PULL.subscribe({
				type: pullBX.PullClient.SubscriptionType.Server,
				moduleId: 'landing',
				callback: this.#onPullEvent
			});
		}
		#onPullEvent = event => {
			const command = String(event?.command || '');
			if (command === COMMAND_CHANGE_AI_SITE_START) {
				this.#onGenerationStart(event);
			} else if (command === COMMAND_CHANGE_AI_SITE_FINISH) {
				this.#onChangeAiSiteFinish(event);
			} else if (command === COMMAND_GENERATION_ERROR || command === COMMAND_GENERATION_FINISH) {
				this.#unlockByGeneration(main_core.Text.toInteger(event?.params?.generationId));
			}
		};
		#onGenerationStart(event) {
			const landingId = main_core.Text.toInteger(event?.params?.landingId);
			if (this.#isForeignLanding(landingId)) {
				return;
			}
			this.clearSelection();
			this.#blockTargets.clear();
			const generationId = main_core.Text.toInteger(event?.params?.generationId);
			if (generationId > 0 && landingId > 0 && landingId === this.#resolveCurrentLandingId()) {
				this.#lock(generationId, landingId);
			}
		}
		#onChangeAiSiteFinish(event) {
			const landingId = main_core.Text.toInteger(event?.params?.landingId);
			if (!this.#isForeignLanding(landingId)) {
				this.clearSelection();
				this.#blockTargets.clear();
			}
			this.#unlockByGeneration(main_core.Text.toInteger(event?.params?.generationId));
		}
		#isForeignLanding(landingId) {
			const currentLandingId = this.#resolveCurrentLandingId();
			return landingId > 0 && currentLandingId > 0 && landingId !== currentLandingId;
		}
		#resolveCurrentLandingId() {
			return main_core.Text.toInteger(landing_copilot_generationObserver.GenerationObserver.resolveLandingId());
		}
		#lock(generationId, landingId) {
			this.#generationObserver = new landing_copilot_generationObserver.GenerationObserver(generationId, {
				landingId
			});
			this.#hoveredTarget = null;
			this.#hoverCandidate = null;
			this.#hideFrame(this.#searchFrame);
		}
		#unlockByGeneration(generationId) {
			if (!this.#generationObserver || generationId <= 0 || this.#generationObserver.getGenerationId() !== generationId) {
				return;
			}
			this.#generationObserver.stopObserve();
			this.#generationObserver = null;
			this.clearSelection();
			this.#blockTargets.clear();
		}
		#isLocked() {
			return this.#generationObserver !== null;
		}
		#resolveEditorDocument() {
			if (document.body && main_core.Dom.hasClass(document.body, 'landing-editor')) {
				return document;
			}
			return null;
		}
		#onMouseMove = event => {
			if (!main_core.Type.isElementNode(event.target)) {
				return;
			}
			const candidate = event.target;
			if (candidate === this.#hoverCandidate) {
				return;
			}
			this.#hoverCandidate = candidate;
			this.#scheduleHoverSync();
		};
		#onMouseLeave = () => {
			this.#hoverCandidate = null;
			this.#hoveredTarget = null;
			this.#hideFrame(this.#searchFrame);
		};
		#scheduleHoverSync() {
			if (this.#hoverSyncHandle !== null) {
				return;
			}
			const editorWindow = this.#editorDocument?.defaultView;
			if (!editorWindow) {
				return;
			}
			this.#hoverSyncHandle = editorWindow.requestAnimationFrame(() => {
				this.#hoverSyncHandle = null;
				this.#syncHoverFrame();
			});
		}
		#syncHoverFrame() {
			if (this.#isLocked()) {
				return;
			}
			const node = this.#resolveHoverTarget(this.#hoverCandidate);
			if (node === this.#hoveredTarget) {
				return;
			}
			this.#hoveredTarget = node;
			if (node && node !== this.#selected?.element) {
				this.#placeFrame(this.#searchFrame, node);
			} else {
				this.#hideFrame(this.#searchFrame);
			}
		}
		#refreshHoverFrame() {
			this.#hoveredTarget = null;
			this.#syncHoverFrame();
		}
		#onClick = event => {
			if (this.#isLocked()) {
				return;
			}
			const trackedNode = this.#resolveTrackedNode(event.target);
			const context = this.#resolveBlockContext(event.target);
			const hoveredIcon = context ? this.#resolveIconAncestor(event.target, trackedNode, context.targets) : null;
			if (!hoveredIcon && trackedNode) {
				return;
			}
			if (!context) {
				return;
			}
			const targetElement = hoveredIcon ?? this.#resolveTargetElement(context);
			if (!targetElement) {
				return;
			}
			const iconClass = this.#resolveIconClass(targetElement, context.targets);
			if (iconClass !== null) {
				this.#toggleTarget({
					blockId: context.blockId,
					selector: `.${iconClass}`,
					element: targetElement
				});
				return;
			}
			const published = resolvePublishedTarget(targetElement, context.contentRoot);
			if (!published) {
				return;
			}
			this.#toggleTarget({
				blockId: context.blockId,
				selector: published.selector,
				element: published.element
			});
		};
		#resolveHoverTarget(eventTarget) {
			const node = this.#resolveTrackedNode(eventTarget);
			const context = this.#resolveBlockContext(eventTarget);
			const icon = context ? this.#resolveIconAncestor(eventTarget, node, context.targets) : null;
			if (icon) {
				return icon;
			}
			if (node) {
				return node;
			}
			if (!context) {
				return null;
			}
			return this.#resolveTargetElement(context);
		}
		#resolveIconAncestor(eventTarget, trackedNode, targets) {
			if (!main_core.Type.isElementNode(eventTarget)) {
				return null;
			}
			let candidate = eventTarget.closest(NODE_SELECTOR);
			while (candidate) {
				if (findAiIconClass(candidate) !== null) {
					const isTargetIcon = targets.icons.includes(candidate);
					const isDeeperThanNode = !trackedNode || trackedNode.contains(candidate);
					return isTargetIcon && isDeeperThanNode ? candidate : null;
				}
				candidate = candidate.parentElement ? candidate.parentElement.closest(NODE_SELECTOR) : null;
			}
			return null;
		}
		#resolveBlockContext(eventTarget) {
			if (!main_core.Type.isElementNode(eventTarget)) {
				return null;
			}
			const element = eventTarget;
			let block = null;
			try {
				const blocks = landing_pageobject.PageObject.getBlocks();
				block = blocks?.getByChildNode ? blocks.getByChildNode(element) ?? null : null;
			} catch {
				block = null;
			}
			const blockId = main_core.Text.toInteger(block?.id);
			if (!block || blockId <= 0) {
				return null;
			}
			const contentRoot = contentElementChildren(block.node)[0] ?? null;
			if (!contentRoot || !contentRoot.contains(element)) {
				return null;
			}
			let targets = this.#blockTargets.get(blockId);
			if (!targets || targets.blockTarget !== contentRoot) {
				targets = collectTargets(contentRoot);
				this.#blockTargets.set(blockId, targets);
			}
			return {
				blockId,
				contentRoot,
				element,
				targets
			};
		}
		#resolveTargetElement(context) {
			let current = context.element;
			while (current && current !== context.contentRoot) {
				if (isServiceElement(current)) {
					return null;
				}
				if (context.targets.icons.includes(current) || context.targets.groups.includes(current)) {
					return current;
				}
				current = current.parentElement;
			}
			return context.contentRoot;
		}
		#resolveIconClass(element, targets) {
			if (!targets.icons.includes(element)) {
				return null;
			}
			return findAiIconClass(element);
		}
		#createFrame(editorDocument, color, width) {
			const frame = editorDocument.createElement('div');
			frame.className = 'landing-copilot-element-picker-frame';
			main_core.Dom.style(frame, {
				position: 'absolute',
				display: 'none',
				'z-index': 9999,
				'pointer-events': 'none',
				border: `${width}px dashed ${color}`
			});
			main_core.Dom.append(frame, editorDocument.body);
			return frame;
		}
		#placeFrame(frame, node) {
			const editorWindow = node.ownerDocument.defaultView;
			if (!frame || !editorWindow) {
				return;
			}
			const rect = node.getBoundingClientRect();
			main_core.Dom.style(frame, {
				top: `${rect.top + editorWindow.scrollY}px`,
				left: `${rect.left + editorWindow.scrollX}px`,
				width: `${rect.width}px`,
				height: `${rect.height}px`,
				display: 'block'
			});
		}
		#hideFrame(frame) {
			if (frame) {
				main_core.Dom.style(frame, {
					display: 'none'
				});
			}
		}
		#onEditorResize = () => {
			const element = this.#selected?.element;
			if (element && element.isConnected) {
				this.#placeFrame(this.#selectedFrame, element);
			}
		};
		#resolveTrackedNode(target) {
			if (!main_core.Type.isElementNode(target)) {
				return null;
			}
			let candidate = target.closest(NODE_SELECTOR);
			while (candidate) {
				if ([...candidate.classList].some(className => NODE_CLASS_PATTERN.test(className))) {
					return candidate;
				}
				candidate = candidate.parentElement ? candidate.parentElement.closest(NODE_SELECTOR) : null;
			}
			return null;
		}
	}
	const bootstrap = () => {
		if (ElementPicker.isEnabled()) {
			ElementPicker.getInstance().activate();
		}
	};
	if (document.readyState === 'complete') {
		bootstrap();
	} else {
		main_core.Event.bindOnce(window, 'load', bootstrap);
	}
	BX.addCustomEvent('BX.Landing.Block:init', bootstrap);

	exports.ElementPicker = ElementPicker;

})(this.BX.Landing.Copilot = this.BX.Landing.Copilot || {}, BX, BX.UI.PageContext, BX.Landing, BX.Landing, BX.Landing.Copilot);
//# sourceMappingURL=element-picker.bundle.js.map
