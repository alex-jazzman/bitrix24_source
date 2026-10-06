import {
	TailwindRuntimeBatchSync,
	TailwindRuntimeSync,
	getPendingBlockIds,
} from 'landing.tailwind.runtimesync';
import {
	GenerationObserver
} from 'landing.copilot.generation-observer';
import {isTailwindRuntimeEnabled} from './tailwind-runtime-capability';

const TAILWIND_PENDING_ATTRIBUTE = 'data-change-ai-tailwind-pending';
const TAILWIND_PENDING_VISIBILITY_ATTRIBUTE = 'data-change-ai-tailwind-pending-visibility';
const TAILWIND_PENDING_STYLE_ID = 'change-ai-tailwind-pending-style';
const reloadCurrentWindow = () => {
	if (TailwindRuntimeSync && typeof TailwindRuntimeSync.reloadWindow === 'function') {
		TailwindRuntimeSync.reloadWindow(window);

		return;
	}

	window?.location?.reload?.();
};
let reloadEditorWindowHandler = reloadCurrentWindow;

export class ChangeAiSiteEditorSync {
	static COMMAND_START = 'LandingCopilotGeneration:onChangeAiSiteStart';
	static COMMAND_TARGET_BLOCKS_RESOLVED = 'LandingCopilotGeneration:onChangeAiSiteTargetBlocksResolved';
	static COMMAND_TAILWIND_PRELOAD = 'LandingCopilotGeneration:onChangeAiSiteTailwindPreload';
	static COMMAND_FINISH = 'LandingCopilotGeneration:onChangeAiSiteFinish';

	static handle(event, observer: GenerationObserver): boolean {
		const command = String(event?.command || '').trim();
		if (!this.#isSupportedCommand(command)) {
			return false;
		}

		if (!this.#isMatchingEvent(event, observer)) {
			return true;
		}

		switch (command) {
			case this.COMMAND_START:
				this.logStart(event, observer);
				break;
			case this.COMMAND_TARGET_BLOCKS_RESOLVED:
				this.logTargetBlocksResolved(event, observer);
				break;
			case this.COMMAND_TAILWIND_PRELOAD:
				this.preloadTailwindRuntime(event, observer);
				break;
			case this.COMMAND_FINISH:
				this.sync(event, observer);
				break;
			default:
				return false;
		}

		return true;
	}

	static preloadTailwindRuntime(event, observer: GenerationObserver): void {
		const landingId = this.#resolveEventLandingId(event);
		if (!isTailwindRuntimeEnabled()) {
			return;
		}

		const tailwindRuntimeSync = this.#getTailwindRuntimeSync();
		if (!tailwindRuntimeSync || typeof tailwindRuntimeSync.preloadRuntimeForWindow !== 'function') {
			this.#logWarning('ChangeAiSite Tailwind preload is not available', {
				component: 'change_ai_site.tailwind',
				landingId,
			});

			return;
		}

		tailwindRuntimeSync.preloadRuntimeForWindow(
				window, {
					helpersBasePath: this.#resolveTailwindRuntimeHelpersBasePath(),
				},
			)
			.catch((error) => {
				this.#logWarning('ChangeAiSite Tailwind preload failed', {
					component: 'change_ai_site.tailwind',
					landingId,
					error,
				});
			});
	}

	static sync(event, observer: GenerationObserver): void {
		const actions = event?.params?.params?.actions;
		const fonts = event?.params?.params?.fonts;
		const landingId = this.#resolveEventLandingId(event);
		if (landingId <= 0) {
			return;
		}

		const syncPromise = this.#syncFonts(fonts)
			.then(() => {
				return Array.isArray(actions) && actions.length > 0 ?
					this.#syncActions(actions, landingId) :
					this.#reloadHistory();
			});

		syncPromise.catch((error) => {
			this.#logError('ChangeAiSite live sync error', {
				error
			});
		});
	}

	static logStart(event, observer: GenerationObserver): void {
	}

	static logTargetBlocksResolved(event, observer: GenerationObserver): void {
	}

	static #isSupportedCommand(command: string): boolean {
		return [
			this.COMMAND_START,
			this.COMMAND_TARGET_BLOCKS_RESOLVED,
			this.COMMAND_TAILWIND_PRELOAD,
			this.COMMAND_FINISH,
		].includes(command);
	}

	static #isMatchingEvent(event, observer: GenerationObserver): boolean {
		if (!this.#isEditorContextAvailable()) {
			return false;
		}

		const landingId = this.#resolveEventLandingId(event);
		if (landingId <= 0) {
			return false;
		}

		const currentLandingId = observer.getLandingId();
		if (currentLandingId <= 0 || currentLandingId !== landingId) {
			return false;
		}

		const generationId = observer.getGenerationId();
		if (
			generationId > 0 &&
			event?.params?.generationId !== undefined &&
			event.params.generationId !== generationId
		) {
			return false;
		}

		return true;
	}

	static #resolveEventLandingId(event): number {
		return Math.max(0, parseInt(event?.params?.landingId, 10) || 0);
	}

	static #normalizeEditorEventPayload(event, observer: GenerationObserver): Object {
		const params = event?.params?.params && typeof event.params.params === 'object' ?
			event.params.params :
			{};

		return {
			command: String(event?.command || '').trim(),
			generationId: Math.max(0, parseInt(event?.params?.generationId, 10) || 0),
			siteId: Math.max(0, parseInt(event?.params?.siteId, 10) || 0),
			landingId: this.#resolveEventLandingId(event),
			scenario: String(params?.scenario || '').trim(),
			eventType: String(params?.eventType || '').trim(),
			stepCode: String(params?.stepCode || '').trim(),
			input: this.#normalizeStringList(params?.input),
			actions: this.#normalizeEditorActions(params?.actions),
			htmlBlocks: this.#normalizeEditorHtmlBlocks(params?.htmlBlocks),
			skippedIds: this.#normalizeIdList(params?.skippedIds),
			skippedReasons: this.#normalizeSkippedReasons(params?.skippedReasons),
		};
	}

	static #normalizeEditorActions(actions: mixed): Array < Object > {
		if (!Array.isArray(actions)) {
			return [];
		}

		return actions
			.filter((action) => action && typeof action === 'object')
			.map((action) => ({
				seq: Math.max(0, parseInt(action?.seq, 10) || 0),
				actionId: String(action?.actionId || '').trim(),
				type: String(action?.type || action?.actionType || '').trim(),
				status: String(action?.status || '').trim(),
				blockId: Math.max(0, parseInt(action?.blockId, 10) || 0),
				sourceBlockId: Math.max(0, parseInt(action?.sourceBlockId, 10) || 0),
				requestedPlacement: this.#normalizePlacement(action?.requestedPlacement || action?.placement),
				resolvedPlacement: this.#normalizePlacement(action?.resolvedPlacement),
				editMode: String(action?.editMode || '').trim(),
			}));
	}

	static #normalizeEditorHtmlBlocks(htmlBlocks: mixed): Array < Object > {
		if (!Array.isArray(htmlBlocks)) {
			return [];
		}

		return htmlBlocks
			.filter((htmlBlock) => htmlBlock && typeof htmlBlock === 'object')
			.map((htmlBlock) => ({
				actionId: String(htmlBlock?.actionId || '').trim(),
				actionType: String(htmlBlock?.actionType || htmlBlock?.type || '').trim(),
				blockId: Math.max(0, parseInt(htmlBlock?.blockId, 10) || 0),
				sourceBlockId: Math.max(0, parseInt(htmlBlock?.sourceBlockId, 10) || 0),
				placement: this.#normalizePlacement(htmlBlock?.placement),
				editMode: String(htmlBlock?.editMode || '').trim(),
			}));
	}

	static #normalizeStringList(items: mixed): Array < string > {
		if (!Array.isArray(items)) {
			return [];
		}

		return items
			.map((item) => String(item || '').trim())
			.filter((item) => item.length > 0);
	}

	static #normalizeIdList(items: mixed): Array < number > {
		if (!Array.isArray(items)) {
			return [];
		}

		return items
			.map((item) => Math.max(0, parseInt(item, 10) || 0))
			.filter((item) => item > 0);
	}

	static #normalizeSkippedReasons(reasons: mixed): Object {
		if (!reasons || typeof reasons !== 'object' || Array.isArray(reasons)) {
			return {};
		}

		return Object.keys(reasons).reduce((result, key) => {
			const normalizedKey = String(key).trim();
			if (normalizedKey === '') {
				return result;
			}

			result[normalizedKey] = String(reasons[key] || '').trim();

			return result;
		}, {});
	}

	static resolveCurrentLandingId(): number {
		try {
			return Math.max(0, parseInt(BX.Landing.Main.getInstance().id, 10) || 0);
		} catch (error) {
			return 0;
		}
	}

	static #isEditorContextAvailable(): boolean {
		return (
			!!BX?.Landing?.Main?.getInstance &&
			!!BX?.Landing?.PageObject?.getBlocks &&
			!!BX?.Landing?.Backend?.getInstance
		);
	}

	static #resolveTailwindRuntimeHelpersBasePath(): ? string {
		const bx = window?.BX || globalThis?.BX || null;
		if (typeof bx?.message !== 'function') {
			return null;
		}

		const templatePath = String(bx.message('SITE_TEMPLATE_PATH') || '').trim().replace(/\/+$/, '');
		if (templatePath === '') {
			return null;
		}

		return `${templatePath}/assets/js/helpers`;
	}

	static #syncActions(actions: Array < Object > , landingId: number): Promise {
		if (this.#isTailwindSyncRequired(actions) && isTailwindRuntimeEnabled()) {
			return this.#syncActionsWithTailwind(actions, landingId);
		}

		return this.#syncActionsWithoutTailwind(actions, landingId);
	}

	static #syncActionsWithoutTailwind(actions: Array < Object > , landingId: number): Promise {
		return actions.reduce((promise, action) => {
				return promise.then(() => {
					return this.#applyAction(action, landingId)
						.catch((error) => {
							this.#logError('ChangeAiSite action sync failed', {
								action,
								error,
							});
						});
				});
			}, Promise.resolve())
			.then(() => {
				return this.#reloadHistory();
			});
	}

	static #syncActionsWithTailwind(actions: Array < Object > , landingId: number): Promise {
		const operations = this.#normalizeTailwindOperations(actions);
		const pendingBlockIds = getPendingBlockIds(operations);
		if (pendingBlockIds.size <= 0) {
			return this.#syncActionsWithoutTailwind(actions, landingId);
		}

		if (typeof TailwindRuntimeBatchSync !== 'function') {
			return Promise.reject(new Error('Tailwind runtime batch sync is not available.'));
		}

		const batchSync = new TailwindRuntimeBatchSync({
			landingId,
			targetWindow: window,
			targetDocument: document,
			helpersBasePath: this.#resolveTailwindRuntimeHelpersBasePath(),
			pendingStyleId: TAILWIND_PENDING_STYLE_ID,
			pendingAttribute: TAILWIND_PENDING_ATTRIBUTE,
			pendingVisibilityAttribute: TAILWIND_PENDING_VISIBILITY_ATTRIBUTE,
			operations,
			finalRebuildRequired: false,
			resolveBlockNode: (blockId) => this.#getBlockById(blockId)?.node || null,
			onFailure: () => {
				this.#reloadEditorWindow();
			},
		});

		return batchSync.prepare()
			.then(() => {
				return actions.reduce((promise, action) => {
					return promise.then(() => {
						const operation = this.#normalizeTailwindOperation(action);

						return this.#applyAction(action, landingId)
							.then(() => {
								return batchSync.afterOperation(operation);
							})
							.catch((error) => {
								this.#logError('ChangeAiSite action sync failed', {
									action,
									error,
								});
							});
					});
				}, Promise.resolve());
			})
			.then(() => batchSync.finalize())
			.then(() => {
				if (batchSync.isFailed()) {
					return null;
				}

				return this.#reloadHistory();
			});
	}

	static #normalizeTailwindOperation(action: ? Object): ? Object {
		const normalizedAction = this.#normalizeAction(action);
		if (!normalizedAction) {
			return null;
		}

		const typeMap = {
			update_block: 'update_block',
			add_block: 'add_block',
			delete_block: 'delete_block',
			move_block: 'move_block',
		};
		const type = typeMap[normalizedAction.type] || null;
		if (!type) {
			return null;
		}

		return {
			type,
			blockId: normalizedAction.blockId,
			raw: action,
		};
	}

	static #normalizeTailwindOperations(actions: Array < Object > ): Array < Object > {
		if (!Array.isArray(actions)) {
			return [];
		}

		return actions
			.map((action) => this.#normalizeTailwindOperation(action))
			.filter(Boolean);
	}

	static #isTailwindSyncRequired(actions: Array < Object > ): boolean {
		return getPendingBlockIds(this.#normalizeTailwindOperations(actions)).size > 0;
	}

	static #getTailwindRuntimeSync(): ? {
		preloadRuntimeForWindow ? : Function,
	} {
		return TailwindRuntimeSync || null;
	}

	static #syncFonts(fonts: ? Array < Object > ): Promise {
		if (!Array.isArray(fonts) || fonts.length <= 0 || !document?.head) {
			return Promise.resolve();
		}

		return Promise.all(
			fonts.map((font) => this.#appendFont(font)),
		).then(() => {});
	}

	static #appendFont(font: Object): Promise {
		const normalized = this.#normalizeFont(font);
		if (!normalized || !document?.head) {
			return Promise.resolve();
		}

		this.#appendFontStyle(normalized);
		if (this.#hasFontLink(normalized.className)) {
			return Promise.resolve();
		}

		const link = document.createElement('link');
		link.rel = 'stylesheet';
		link.href = this.#buildFontHref(normalized.name);
		link.setAttribute('data-font', normalized.className);
		document.head.appendChild(link);

		return Promise.resolve();
	}

	static #appendFontStyle(font: {
		className: string,
		name: string,
		generic: string
	}): void {
		if (this.#hasFontStyle(font.className) || !document?.head) {
			return;
		}

		const style = document.createElement('style');
		style.setAttribute('data-id', font.className);
		style.textContent = `.${font.className} { font-family: "${this.#escapeCssString(font.name)}", ${font.generic}; }`;
		document.head.appendChild(style);
	}

	static #normalizeFont(font: Object): ? {
		className: string,
		name: string,
		generic: string
	} {
		const className = String(font?.class || '').trim().toLowerCase();
		const name = String(font?.name || '').trim();
		let generic = String(font?.generic || 'sans-serif').trim().toLowerCase();
		if (!/^g-font-[a-z0-9-]+$/.test(className) || name === '') {
			return null;
		}
		if (!['serif', 'sans-serif', 'monospace', 'cursive'].includes(generic)) {
			generic = 'sans-serif';
		}

		return {
			className,
			name,
			generic,
		};
	}

	static #hasFontLink(className: string): boolean {
		return this.#hasHeadElement('data-font', className);
	}

	static #hasFontStyle(className: string): boolean {
		return this.#hasHeadElement('data-id', className);
	}

	static #hasHeadElement(attribute: string, value: string): boolean {
		if (!document?.head?.querySelectorAll) {
			return false;
		}

		return [...document.head.querySelectorAll(`[${attribute}]`)]
			.some((element) => element.getAttribute(attribute) === value);
	}

	static #buildFontHref(name: string): string {
		const host = window.fontsProxyUrl || globalThis.fontsProxyUrl || 'fonts.googleapis.com';
		const family = encodeURIComponent(name).replace(/%20/g, '+');

		return `https://${host}/css2?family=${family}:wght@100;200;300;400;500;600;700;800;900`;
	}

	static #escapeCssString(value: string): string {
		return value.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
	}

	static #applyAction(action: Object, landingId: number): Promise {
		const normalizedAction = this.#normalizeAction(action);
		if (!normalizedAction) {
			return Promise.resolve();
		}

		if (normalizedAction.type === 'update_block') {
			return this.#reloadBlock(normalizedAction.blockId);
		}

		if (normalizedAction.type === 'add_block') {
			return this.#addBlock(normalizedAction.blockId, landingId, normalizedAction.placement);
		}

		if (normalizedAction.type === 'delete_block') {
			return this.#deleteBlock(normalizedAction.blockId);
		}

		if (normalizedAction.type === 'move_block') {
			return this.#moveBlock(normalizedAction.blockId, landingId, normalizedAction.placement);
		}

		return Promise.resolve();
	}

	static #normalizeAction(action: Object): ? {
		type: string,
		status: string,
		blockId: number,
		placement: {
			mode: string,
			blockId: number
		},
	} {
		const type = String(action?.type || '').trim();
		const status = String(action?.status || 'applied').trim().toLowerCase();
		const blockId = Math.max(0, parseInt(action?.blockId, 10) || 0);
		if (status !== '' && status !== 'applied') {
			return null;
		}
		if (blockId <= 0) {
			return null;
		}

		const hasResolvedPlacement = action && Object.prototype.hasOwnProperty.call(action, 'resolvedPlacement');
		const resolvedPlacement = this.#normalizePlacement(action?.resolvedPlacement);
		const requestedPlacement = this.#normalizePlacement(action?.requestedPlacement || action?.placement);
		const placement = hasResolvedPlacement ?
			resolvedPlacement :
			requestedPlacement;

		return {
			type,
			status,
			blockId,
			placement,
		};
	}

	static #reloadBlock(blockId: number): Promise {
		const block = this.#getBlockById(blockId);
		if (!block || typeof block.reload !== 'function') {
			return Promise.resolve();
		}

		return block.reload();
	}

	static #addBlock(blockId: number, landingId: number, placement: ? Object): Promise {
		const existingBlock = this.#getBlockById(blockId);
		if (existingBlock) {
			return this.#reloadBlock(blockId);
		}

		const backend = BX?.Landing?.Backend?.getInstance?.();
		const main = BX?.Landing?.Main?.getInstance?.();
		if (!backend || !main || typeof main.addBlock !== 'function') {
			return Promise.resolve();
		}

		return backend.action('Block::getContent', {
			block: blockId,
			lid: landingId,
			editMode: 1,
		}).then((response) => {
			return this.#insertBlock(response, landingId, placement);
		});
	}

	static #insertBlock(response: Object, landingId: number, placement: ? Object): Promise {
		const main = BX.Landing.Main.getInstance();
		const previousState = {
			currentBlock: main.currentBlock,
			currentArea: main.currentArea,
			insertBefore: main.insertBefore,
		};
		const insertContext = this.#resolveInsertContext(landingId, placement);
		main.currentBlock = insertContext.block;
		main.currentArea = insertContext.area;
		main.insertBefore = insertContext.insertBefore;

		return main.addBlock(response, true)
			.then((result) => {
				if (typeof main.adjustEmptyAreas === 'function') {
					main.adjustEmptyAreas();
				}

				BX.onCustomEvent('BX.Landing.Block:onAfterAdd', response);

				this.#restoreInsertState(main, previousState);

				return result;
			}, (error) => {
				this.#restoreInsertState(main, previousState);

				return Promise.reject(error);
			});
	}

	static #restoreInsertState(main: Object, previousState: Object): void {
		main.currentBlock = previousState.currentBlock;
		main.currentArea = previousState.currentArea;
		main.insertBefore = previousState.insertBefore;
	}

	static #resolveInsertContext(landingId: number, placement: ? Object): {
		block: ? Object,
		area: ? Element,
		insertBefore: boolean
	} {
		const normalizedPlacement = this.#normalizePlacement(placement);
		const targetBlock = normalizedPlacement.blockId > 0 ?
			this.#getBlockById(normalizedPlacement.blockId) :
			null;
		if (targetBlock) {
			return {
				block: targetBlock,
				area: targetBlock.parent || targetBlock.node?.parentElement || null,
				insertBefore: normalizedPlacement.mode === 'before',
			};
		}

		const lastBlock = this.#getLastBlock();
		if (lastBlock) {
			return {
				block: lastBlock,
				area: lastBlock.parent || lastBlock.node?.parentElement || null,
				insertBefore: false,
			};
		}

		return {
			block: null,
			area: this.#resolveLandingArea(landingId),
			insertBefore: false,
		};
	}

	static #deleteBlock(blockId: number): Promise {
		const block = this.#getBlockById(blockId);
		if (!block) {
			return Promise.resolve();
		}

		const event = typeof block.createEvent === 'function' ? block.createEvent() : null;
		if (event) {
			BX.onCustomEvent('BX.Landing.Block:remove', [event]);
		}

		const blockPanels = block.node?.querySelectorAll?.('.landing-ui-panel') || [];
		[...blockPanels].forEach((panel) => panel.remove());
		BX.Landing.PageObject.getBlocks().remove(block);
		if (block.node?.parentNode) {
			block.node.parentNode.removeChild(block.node);
		}

		BX.onCustomEvent('Landing.Block:onAfterDelete', [block]);
		if (event) {
			BX.onCustomEvent('BX.Landing.Block:afterRemove', [event]);
		}

		return Promise.resolve();
	}

	static #moveBlock(blockId: number, landingId: number, placement: ? Object): Promise {
		const normalizedPlacement = this.#normalizePlacement(placement);
		this.#logInfo('ChangeAiSite move requested', {
			blockId,
			landingId,
			placement: normalizedPlacement,
		});

		const block = this.#getBlockById(blockId);
		if (!block?.node) {
			this.#logWarning('ChangeAiSite move skipped: source block not found', {
				blockId,
				landingId,
				placement: normalizedPlacement,
				reason: 'MOVE_BLOCK_SOURCE_NOT_FOUND_IN_EDITOR',
			});

			return Promise.resolve();
		}

		const sourceNode = block.node;
		const targetBlock = normalizedPlacement.blockId > 0 ?
			this.#getBlockById(normalizedPlacement.blockId) :
			null;
		if (['before', 'after'].includes(normalizedPlacement.mode)) {
			if (!targetBlock?.node) {
				this.#logWarning('ChangeAiSite move skipped: target block not found', {
					blockId,
					landingId,
					placement: normalizedPlacement,
					reason: 'MOVE_BLOCK_TARGET_NOT_FOUND_IN_EDITOR',
				});

				return Promise.resolve();
			}

			if (targetBlock === block) {
				this.#logWarning('ChangeAiSite move skipped: source equals target', {
					blockId,
					landingId,
					placement: normalizedPlacement,
					reason: 'MOVE_BLOCK_SAME_SOURCE_AND_TARGET',
				});

				return Promise.resolve();
			}
		}

		const targetNode = targetBlock?.node || null;
		const insertionContext = this.#resolveMoveContext(landingId, sourceNode, targetNode, normalizedPlacement);
		if (!insertionContext) {
			this.#logWarning('ChangeAiSite move skipped: insertion context unavailable', {
				blockId,
				landingId,
				placement: normalizedPlacement,
				reason: 'MOVE_BLOCK_TARGET_NOT_FOUND_IN_EDITOR',
			});

			return Promise.resolve();
		}

		const {
			container
		} = insertionContext;
		if (!(container instanceof Element) || !sourceNode.parentNode) {
			this.#logWarning('ChangeAiSite move skipped: source node is detached', {
				blockId,
				landingId,
				placement: normalizedPlacement,
				reason: 'MOVE_BLOCK_SOURCE_NOT_FOUND_IN_EDITOR',
			});

			return Promise.resolve();
		}

		if (this.#isMoveNoop(sourceNode, normalizedPlacement, insertionContext.referenceNode)) {
			this.#logInfo('ChangeAiSite move skipped: no position change', {
				blockId,
				landingId,
				placement: normalizedPlacement,
				reason: 'MOVE_BLOCK_NO_POSITION_CHANGE',
			});

			return Promise.resolve();
		}

		if (typeof block.forceInit === 'function') {
			block.forceInit();
		}

		container.insertBefore(sourceNode, insertionContext.referenceNode);
		this.#syncBlocksStorageOrder();
		this.#afterMove(block);
		this.#logInfo('ChangeAiSite move applied', {
			blockId,
			landingId,
			placement: normalizedPlacement,
		});

		return Promise.resolve();
	}

	static #getBlockById(blockId: number): ? Object {
		return BX.Landing.PageObject.getBlocks()?.get?.(blockId) || null;
	}

	static #getLastBlock(): ? Object {
		let lastBlock = null;
		BX.Landing.PageObject.getBlocks()?.forEach?.((block) => {
			lastBlock = block;
		});

		return lastBlock;
	}

	static #resolveLandingArea(landingId: number): ? Element {
		const selectors = [
			`.landing-area[data-landing="${landingId}"]`,
			`[data-landing="${landingId}"]`,
			'.landing-area',
		];
		for (const selector of selectors) {
			const area = document.querySelector(selector);
			if (area instanceof Element) {
				return area;
			}
		}

		return null;
	}

	static #resolveMoveContext(
		landingId: number,
		sourceNode: Element,
		targetNode: ? Element,
		placement : {
			mode: string,
			blockId: number
		},
	): ? {
		container: Element,
		referenceNode: ? Node
	} {
		if (placement.mode === 'before' && targetNode?.parentNode instanceof Element) {
			return {
				container: targetNode.parentNode,
				referenceNode: targetNode,
			};
		}

		if (placement.mode === 'after' && targetNode?.parentNode instanceof Element) {
			return {
				container: targetNode.parentNode,
				referenceNode: targetNode.nextSibling,
			};
		}

		if (placement.mode === 'prepend') {
			const firstBlock = this.#getFirstBlock();
			const container = firstBlock?.node?.parentNode || sourceNode.parentNode || this.#resolveLandingArea(landingId);
			if (!(container instanceof Element)) {
				return null;
			}

			return {
				container,
				referenceNode: firstBlock?.node || null,
			};
		}

		if (placement.mode === 'append') {
			const lastBlock = this.#getLastBlock();
			const container = lastBlock?.node?.parentNode || sourceNode.parentNode || this.#resolveLandingArea(landingId);
			if (!(container instanceof Element)) {
				return null;
			}

			return {
				container,
				referenceNode: null,
			};
		}

		return null;
	}

	static #isMoveNoop(sourceNode: Element, placement: {
		mode: string,
		blockId: number
	}, referenceNode: ? Node): boolean {
		if (placement.mode === 'before') {
			return referenceNode === sourceNode || referenceNode === sourceNode.nextSibling;
		}

		if (placement.mode === 'after') {
			return referenceNode === sourceNode.nextSibling;
		}

		if (placement.mode === 'prepend') {
			return this.#getFirstBlock()?.node === sourceNode;
		}

		if (placement.mode === 'append') {
			return this.#getLastBlock()?.node === sourceNode;
		}

		return false;
	}

	static #getFirstBlock(): ? Object {
		const blocks = this.#getBlocksArray();

		return blocks[0] || null;
	}

	static #getBlocksArray(): Array < Object > {
		const blocksCollection = BX.Landing.PageObject.getBlocks?.();
		if (!blocksCollection) {
			return [];
		}

		if (Array.isArray(blocksCollection)) {
			return [...blocksCollection];
		}

		const blocks = [];
		blocksCollection.forEach?.((block) => {
			blocks.push(block);
		});

		return blocks;
	}

	static #syncBlocksStorageOrder(): void {
		const blocksCollection = BX.Landing.PageObject.getBlocks?.();
		if (!blocksCollection) {
			return;
		}

		const blocks = this.#getBlocksArray();
		if (blocks.length <= 1) {
			return;
		}

		const orderedBlocks = blocks
			.map((block, index) => ({
				block,
				index
			}))
			.sort((left, right) => {
				const leftNode = left.block?.node;
				const rightNode = right.block?.node;
				if (!(leftNode instanceof Node) || !(rightNode instanceof Node)) {
					return left.index - right.index;
				}

				const relation = leftNode.compareDocumentPosition(rightNode);
				if (relation & Node.DOCUMENT_POSITION_FOLLOWING) {
					return -1;
				}
				if (relation & Node.DOCUMENT_POSITION_PRECEDING) {
					return 1;
				}

				return left.index - right.index;
			})
			.map(({
				block
			}) => block);

		if (typeof blocksCollection.clear === 'function') {
			blocksCollection.clear();
		} else if (Array.isArray(blocksCollection)) {
			blocksCollection.splice(0, blocksCollection.length);
		} else {
			return;
		}

		orderedBlocks.forEach((block) => {
			if (typeof blocksCollection.add === 'function') {
				blocksCollection.add(block);
			} else if (Array.isArray(blocksCollection)) {
				blocksCollection.push(block);
			}
		});
	}

	static #afterMove(block: Object): void {
		const main = BX?.Landing?.Main?.getInstance?.();
		if (typeof main?.adjustEmptyAreas === 'function') {
			main.adjustEmptyAreas();
		}

		BX.onCustomEvent('Landing.Block:onAfterMove', [block]);
		BX.onCustomEvent('BX.Landing.Block:afterMove', [block]);
		BX.onCustomEvent('BX.Landing.Copilot:onAfterMove', [block]);
	}

	static #reloadEditorWindow(): void {
		reloadEditorWindowHandler();
	}

	static #logInfo(message: string, context: Object = {}): void {
		console.info(message, this.#normalizeLogContext(context));
	}

	static #logWarning(message: string, context: Object = {}): void {
		console.warn(message, this.#normalizeLogContext(context));
	}

	static #logError(message: string, context: Object = {}): void {
		console.error(message, this.#normalizeLogContext(context));
	}

	static #normalizeLogContext(context: Object = {}): Object {
		const placement = context?.placement && typeof context.placement === 'object' ?
			this.#normalizePlacement(context.placement) :
			undefined;

		return {
			component: String(context?.component || 'change_ai_site.move').trim() || 'change_ai_site.move',
			blockId: Math.max(0, parseInt(context?.blockId, 10) || 0),
			landingId: Math.max(0, parseInt(context?.landingId, 10) || 0),
			reason: String(context?.reason || '').trim(),
			placement,
			action: context?.action,
			error: context?.error,
		};
	}

	static #normalizePlacement(placement: ? Object): {
		mode: string,
		blockId: number
	} {
		const normalized = placement && typeof placement === 'object' ? placement : {};
		const mode = ['append', 'prepend', 'after', 'before'].includes(normalized.mode) ?
			normalized.mode :
			'append';

		return {
			mode,
			blockId: Math.max(0, parseInt(normalized.blockId, 10) || 0),
		};
	}

	static #reloadHistory(): Promise {
		if (!BX?.Landing?.History?.getInstance) {
			return Promise.resolve();
		}

		const history = BX.Landing.History.getInstance();
		if (history && typeof history.reload === 'function') {
			return history.reload();
		}

		return Promise.resolve();
	}
}

GenerationObserver.registerLandingIdResolver(() => ChangeAiSiteEditorSync.resolveCurrentLandingId());
GenerationObserver.registerPullHandler(ChangeAiSiteEditorSync);

export const __testHooks = {
	setReloadEditorWindowHandler(handler: Function): void {
		reloadEditorWindowHandler = typeof handler === 'function' ?
			handler :
			reloadCurrentWindow;
	},
	resetReloadEditorWindowHandler(): void {
		reloadEditorWindowHandler = reloadCurrentWindow;
	},
};
