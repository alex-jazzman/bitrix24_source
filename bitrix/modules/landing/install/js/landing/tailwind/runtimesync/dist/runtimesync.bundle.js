/* eslint-disable */
this.BX = this.BX || {};
(function (exports) {
	'use strict';

	const PENDING_OPERATION_TYPES = new Set(['update_block', 'add_block']);
	const OPERATION_TYPE_ALIASES = {
		update_block: 'update_block',
		add_block: 'add_block',
		delete_block: 'delete_block',
		remove_block: 'delete_block',
		move_block: 'move_block',
		updateContent: 'update_block',
		addBlock: 'add_block',
		removeBlock: 'delete_block',
		deleteBlock: 'delete_block',
		moveBlock: 'move_block'
	};
	const DEFAULT_PENDING_STYLE_ID = 'landing-tailwind-runtime-pending-style';
	const DEFAULT_PENDING_ATTRIBUTE = 'data-landing-tailwind-runtime-pending';
	const DEFAULT_PENDING_VISIBILITY_ATTRIBUTE = 'data-landing-tailwind-runtime-previous-visibility';
	function normalizeOperation(operation) {
		if (!operation || typeof operation !== 'object') {
			return null;
		}
		const type = normalizeOperationType(operation.type || operation.action || operation.command);
		const blockId = normalizeBlockId(operation.blockId ?? operation.block_id ?? operation.id);
		if (!type || blockId === null) {
			return null;
		}
		return {
			type,
			blockId,
			raw: operation.raw || operation
		};
	}
	function normalizeOperations(operations) {
		if (!Array.isArray(operations)) {
			return [];
		}
		return operations.map(operation => normalizeOperation(operation)).filter(Boolean);
	}
	function isPendingOperation(operation) {
		const normalizedOperation = normalizeOperation(operation);
		return Boolean(normalizedOperation && PENDING_OPERATION_TYPES.has(normalizedOperation.type));
	}
	function getPendingBlockIds(operations) {
		const pendingBlockIds = new Set();
		normalizeOperations(operations).forEach(operation => {
			if (isPendingOperation(operation)) {
				pendingBlockIds.add(operation.blockId);
			}
		});
		return pendingBlockIds;
	}
	function createTailwindRuntimeBatchSync(TailwindRuntimeSync) {
		return class TailwindRuntimeBatchSync {
			constructor(options = {}) {
				this.landingId = options.landingId;
				this.targetWindow = options.targetWindow || null;
				this.targetDocument = options.targetDocument || this.targetWindow?.document || null;
				this.helpersBasePath = options.helpersBasePath || null;
				this.pendingStyleId = options.pendingStyleId || DEFAULT_PENDING_STYLE_ID;
				this.pendingAttribute = options.pendingAttribute || DEFAULT_PENDING_ATTRIBUTE;
				this.pendingVisibilityAttribute = options.pendingVisibilityAttribute || DEFAULT_PENDING_VISIBILITY_ATTRIBUTE;
				this.operations = normalizeOperations(options.operations || []);
				this.resolveBlockNode = typeof options.resolveBlockNode === 'function' ? options.resolveBlockNode : () => null;
				this.onFailure = typeof options.onFailure === 'function' ? options.onFailure : null;
				this.logger = options.logger || null;
				this.finalRebuildRequired = options.finalRebuildRequired === true;
				this.pendingBlockIds = getPendingBlockIds(this.operations);
				this.failed = false;
				this.failureError = null;
				this.prepared = false;
			}
			prepare() {
				if (this.failed) {
					return Promise.resolve(this.getPendingBlockIds());
				}
				this.prepared = true;
				this.#renderPendingStyle();
				this.pendingBlockIds.forEach(blockId => {
					this.#markPendingBlock(blockId);
				});
				return Promise.resolve(this.getPendingBlockIds());
			}
			afterOperation(operation) {
				if (this.failed) {
					return Promise.resolve();
				}
				const normalizedOperation = normalizeOperation(operation);
				if (!isPendingOperation(normalizedOperation) || !this.pendingBlockIds.has(normalizedOperation.blockId)) {
					return Promise.resolve();
				}
				this.#markPendingBlock(normalizedOperation.blockId);
				return TailwindRuntimeSync.rebuildAndSaveForWindow(this.targetWindow, this.landingId, this.#getRuntimeOptions()).then(() => {
					if (this.failed) {
						return;
					}
					this.#unmarkPendingBlock(normalizedOperation.blockId);
					this.pendingBlockIds.delete(normalizedOperation.blockId);
					this.#renderPendingStyle();
				}).catch(error => {
					this.fail(error);
				});
			}
			finalize() {
				if (this.failed) {
					return Promise.resolve();
				}
				if (this.pendingBlockIds.size <= 0 && !this.finalRebuildRequired) {
					this.#renderPendingStyle();
					return Promise.resolve();
				}
				return TailwindRuntimeSync.rebuildAndSaveForWindow(this.targetWindow, this.landingId, this.#getRuntimeOptions()).then(() => {
					if (this.failed) {
						return;
					}
					[...this.pendingBlockIds].forEach(blockId => {
						this.#unmarkPendingBlock(blockId);
						this.pendingBlockIds.delete(blockId);
					});
					this.#renderPendingStyle();
				}).catch(error => {
					this.fail(error);
				});
			}
			fail(error) {
				if (this.failed) {
					return;
				}
				this.failed = true;
				this.failureError = error;
				this.#logFailure(error);
				if (this.onFailure) {
					try {
						this.onFailure(error, this);
					} catch (callbackError) {
						this.#logFailure(callbackError);
					}
				}
			}
			isFailed() {
				return this.failed;
			}
			getPendingBlockIds() {
				return new Set(this.pendingBlockIds);
			}
			#getRuntimeOptions() {
				return {
					helpersBasePath: this.helpersBasePath
				};
			}
			#markPendingBlock(blockId) {
				TailwindRuntimeSync.markPendingNode(this.#resolveBlockNode(blockId), this.pendingAttribute, this.pendingVisibilityAttribute);
			}
			#unmarkPendingBlock(blockId) {
				TailwindRuntimeSync.unmarkPendingNode(this.#resolveBlockNode(blockId), this.pendingAttribute, this.pendingVisibilityAttribute);
			}
			#resolveBlockNode(blockId) {
				try {
					return this.resolveBlockNode(blockId);
				} catch (error) {
					this.fail(error);
					return null;
				}
			}
			#renderPendingStyle() {
				TailwindRuntimeSync.renderPendingStyle(this.pendingBlockIds, this.targetDocument, this.pendingStyleId);
			}
			#logFailure(error) {
				if (this.logger && typeof this.logger.error === 'function') {
					this.logger.error('TailwindRuntimeBatchSync failed.', error);
				}
			}
		};
	}
	function normalizeOperationType(type) {
		const normalizedType = OPERATION_TYPE_ALIASES[String(type || '')] || null;
		return normalizedType;
	}
	function normalizeBlockId(blockId) {
		const normalizedBlockId = Number(blockId);
		if (!Number.isFinite(normalizedBlockId) || normalizedBlockId <= 0) {
			return null;
		}
		return normalizedBlockId;
	}

	const TAILWIND_CSS_READY_TIMEOUT = 15000;
	const TAILWIND_RUNTIME_SCRIPT_TIMEOUT = 15000;
	const DEFAULT_TAILWIND_HELPERS_BASE_PATH = '/bitrix/templates/landing24/assets/js/helpers';
	class TailwindRuntimeSync {
		static preloadRuntimeForWindow(targetWindow, options = {}) {
			try {
				this.#assertTargetWindowAvailable(targetWindow);
			} catch (error) {
				return Promise.reject(error);
			}
			return this.ensureTailwindRuntimeScript(targetWindow, options);
		}
		static rebuildAndSaveForWindow(targetWindow, landingId, options = {}) {
			try {
				this.#assertTargetWindowAvailable(targetWindow);
			} catch (error) {
				return Promise.reject(error);
			}
			const ajax = BX?.ajax;
			if (!ajax || typeof ajax.runAction !== 'function') {
				return Promise.reject(new Error('BX.ajax.runAction is not available.'));
			}
			return this.waitForTailwindCss(targetWindow, options).then(css => {
				return ajax.runAction('landing.tailwind.saveCss', {
					data: {
						landingId,
						css,
						publish: false
					}
				}).then(() => css);
			});
		}
		static waitForTailwindCss(targetWindow, options = {}) {
			try {
				this.#assertTargetWindowAvailable(targetWindow);
			} catch (error) {
				return Promise.reject(error);
			}
			return new Promise((resolve, reject) => {
				const runtime = targetWindow.__landingTailwindRuntime || {};
				targetWindow.__landingTailwindRuntime = runtime;
				let completed = false;
				let readinessTimeout = null;
				const previousOnCssReady = runtime.onCssReady;
				const complete = (css = '') => {
					if (completed) {
						return;
					}
					const actualCss = String(css || this.getTailwindCssFromDom(targetWindow) || '').trim();
					if (actualCss === '') {
						return;
					}
					completed = true;
					clearTimeout(readinessTimeout);
					runtime.onCssReady = previousOnCssReady;
					resolve(actualCss);
				};
				const fail = error => {
					if (completed) {
						return;
					}
					completed = true;
					clearTimeout(readinessTimeout);
					runtime.onCssReady = previousOnCssReady;
					reject(error);
				};
				runtime.onCssReady = css => {
					if (typeof previousOnCssReady === 'function') {
						previousOnCssReady(css);
					}
					complete(css);
				};
				readinessTimeout = setTimeout(() => {
					fail(new Error('Tailwind CSS rebuild timed out.'));
				}, TAILWIND_CSS_READY_TIMEOUT);
				this.preloadRuntimeForWindow(targetWindow, options).then(() => {
					this.triggerTailwindRuntimeRebuild(targetWindow);
				}).catch(fail);
			});
		}
		static ensureTailwindRuntimeScript(targetWindow, options = {}) {
			if (targetWindow.tailwind && targetWindow.tailwind.config) {
				return Promise.resolve();
			}
			return this.loadIframeScript(targetWindow, `${this.getTailwindHelpersBasePath(targetWindow, options)}/tailwind.js`, 'landing-tailwind-runtime');
		}
		static loadIframeScript(targetWindow, src, marker) {
			return new Promise((resolve, reject) => {
				const {
					document
				} = targetWindow;
				if (!document?.head) {
					reject(new Error('Landing iframe document is not available.'));
					return;
				}
				const existing = document.querySelector(`script[data-${marker}="1"]`);
				if (existing) {
					if (targetWindow.tailwind && targetWindow.tailwind.config) {
						resolve();
					} else {
						existing.addEventListener('load', resolve, {
							once: true
						});
						existing.addEventListener('error', reject, {
							once: true
						});
					}
					return;
				}
				const script = document.createElement('script');
				script.src = src;
				script.async = false;
				script.setAttribute(`data-${marker}`, '1');
				const timeout = setTimeout(() => {
					reject(new Error('Tailwind runtime script loading timed out.'));
				}, TAILWIND_RUNTIME_SCRIPT_TIMEOUT);
				script.onload = () => {
					clearTimeout(timeout);
					resolve();
				};
				script.onerror = () => {
					clearTimeout(timeout);
					reject(new Error(`Failed to load Tailwind runtime script: ${src}`));
				};
				document.head.appendChild(script);
			});
		}
		static getTailwindHelpersBasePath(targetWindow, options = {}) {
			const helpersBasePath = this.#normalizeTailwindHelpersBasePath(options?.helpersBasePath);
			if (helpersBasePath !== null) {
				return helpersBasePath;
			}
			const bx = targetWindow.BX;
			if (bx && typeof bx.message === 'function') {
				const templatePath = String(bx.message('SITE_TEMPLATE_PATH') || '').trim();
				if (templatePath !== '') {
					return `${templatePath}/assets/js/helpers`;
				}
			}
			const scripts = targetWindow.document.getElementsByTagName('script');
			for (let i = 0; i < scripts.length; i++) {
				const src = String(scripts[i].src || '');
				const matches = src.match(/^(.*\/assets\/js\/helpers)\/tailwind(?:-runtime-save)?\.js(?:\?.*)?$/);
				if (matches && matches[1]) {
					return matches[1];
				}
			}
			return DEFAULT_TAILWIND_HELPERS_BASE_PATH;
		}
		static triggerTailwindRuntimeRebuild(targetWindow) {
			const {
				document
			} = targetWindow;
			let style = document.querySelector('style[data-landing-tailwind-runtime-rebuild="1"]');
			if (!style) {
				style = document.createElement('style');
				style.setAttribute('data-landing-tailwind-runtime-rebuild', '1');
				style.setAttribute('type', 'text/tailwindcss');
				document.head.appendChild(style);
			}
			style.textContent = `/* landing-tailwind-runtime-rebuild:${Date.now()} */`;
		}
		static getTailwindCssFromDom(targetWindow) {
			const style = targetWindow.document.querySelector('style[landing-tailwind-runtime]');
			return style ? String(style.textContent || '').trim() : '';
		}
		static renderPendingStyle(pendingBlockIds, targetDocument, styleId) {
			if (!targetDocument?.head) {
				return;
			}
			const style = targetDocument.getElementById(styleId);
			const selectors = [...pendingBlockIds].flatMap(blockId => [`[data-block-id="${blockId}"]`, `#block${blockId}`, `.block-wrapper[data-id="${blockId}"]`]);
			if (selectors.length <= 0) {
				style?.remove();
				return;
			}
			const targetStyle = style || targetDocument.createElement('style');
			targetStyle.id = styleId;
			targetStyle.textContent = `${selectors.join(', ')} { visibility: hidden !important; }`;
			if (!targetStyle.parentNode) {
				targetDocument.head.appendChild(targetStyle);
			}
		}
		static markPendingNode(node, pendingAttribute, pendingVisibilityAttribute) {
			if (!this.#isElement(node)) {
				return;
			}
			if (!node.hasAttribute(pendingVisibilityAttribute)) {
				node.setAttribute(pendingVisibilityAttribute, String(node.style?.getPropertyValue?.('visibility') || ''));
			}
			node.setAttribute(pendingAttribute, '1');
			node.style?.setProperty?.('visibility', 'hidden');
		}
		static unmarkPendingNode(node, pendingAttribute, pendingVisibilityAttribute) {
			if (!this.#isElement(node) || node.getAttribute(pendingAttribute) !== '1') {
				return;
			}
			const previousVisibility = node.getAttribute(pendingVisibilityAttribute);
			if (previousVisibility) {
				node.style?.setProperty?.('visibility', previousVisibility);
			} else {
				node.style?.removeProperty?.('visibility');
			}
			node.removeAttribute(pendingAttribute);
			node.removeAttribute(pendingVisibilityAttribute);
		}
		static reloadWindow(targetWindow) {
			targetWindow?.location?.reload?.();
		}
		static #assertTargetWindowAvailable(targetWindow) {
			if (!targetWindow || !targetWindow.document) {
				throw new Error('Landing iframe window is not available.');
			}
		}
		static #normalizeTailwindHelpersBasePath(helpersBasePath) {
			const normalizedPath = String(helpersBasePath || '').trim().replace(/\/+$/, '');
			return normalizedPath === '' ? null : normalizedPath;
		}
		static #isElement(node) {
			if (!node || node.nodeType !== 1) {
				return false;
			}
			const ownerWindow = node.ownerDocument?.defaultView;
			if (ownerWindow?.Element) {
				return node instanceof ownerWindow.Element;
			}
			return typeof node.setAttribute === 'function' && typeof node.getAttribute === 'function';
		}
	}
	const TailwindRuntimeBatchSync = createTailwindRuntimeBatchSync(TailwindRuntimeSync);

	exports.TailwindRuntimeBatchSync = TailwindRuntimeBatchSync;
	exports.TailwindRuntimeSync = TailwindRuntimeSync;
	exports.getPendingBlockIds = getPendingBlockIds;
	exports.isPendingOperation = isPendingOperation;
	exports.normalizeOperation = normalizeOperation;
	exports.normalizeOperations = normalizeOperations;

})(this.BX.Landing = this.BX.Landing || {});
//# sourceMappingURL=runtimesync.bundle.js.map
