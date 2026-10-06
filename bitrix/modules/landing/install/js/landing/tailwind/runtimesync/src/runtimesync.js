import {
	createTailwindRuntimeBatchSync,
	getPendingBlockIds,
	isPendingOperation,
	normalizeOperation,
	normalizeOperations,
} from './batch-sync';

const TAILWIND_CSS_READY_TIMEOUT = 15000;
const TAILWIND_RUNTIME_SCRIPT_TIMEOUT = 15000;
const DEFAULT_TAILWIND_HELPERS_BASE_PATH = '/bitrix/templates/landing24/assets/js/helpers';

export class TailwindRuntimeSync {
	static preloadRuntimeForWindow(targetWindow: Window, options: Object = {}): Promise {
		try {
			this.#assertTargetWindowAvailable(targetWindow);
		} catch (error) {
			return Promise.reject(error);
		}

		return this.ensureTailwindRuntimeScript(targetWindow, options);
	}

	static rebuildAndSaveForWindow(targetWindow: Window, landingId: number, options: Object = {}): Promise < string > {
		try {
			this.#assertTargetWindowAvailable(targetWindow);
		} catch (error) {
			return Promise.reject(error);
		}

		const ajax = BX?.ajax;
		if (!ajax || typeof ajax.runAction !== 'function') {
			return Promise.reject(new Error('BX.ajax.runAction is not available.'));
		}

		return this.waitForTailwindCss(targetWindow, options)
			.then((css) => {
				return ajax.runAction('landing.tailwind.saveCss', {
						data: {
							landingId,
							css,
							publish: false,
						},
					})
					.then(() => css);
			});
	}

	static waitForTailwindCss(targetWindow: Window, options: Object = {}): Promise < string > {
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
			const complete = (css: string = '') => {
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
			const fail = (error) => {
				if (completed) {
					return;
				}

				completed = true;
				clearTimeout(readinessTimeout);
				runtime.onCssReady = previousOnCssReady;
				reject(error);
			};

			runtime.onCssReady = (css) => {
				if (typeof previousOnCssReady === 'function') {
					previousOnCssReady(css);
				}

				complete(css);
			};

			readinessTimeout = setTimeout(() => {
				fail(new Error('Tailwind CSS rebuild timed out.'));
			}, TAILWIND_CSS_READY_TIMEOUT);

			this.preloadRuntimeForWindow(targetWindow, options)
				.then(() => {
					this.triggerTailwindRuntimeRebuild(targetWindow);
				})
				.catch(fail);
		});
	}

	static ensureTailwindRuntimeScript(targetWindow: Window, options: Object = {}): Promise {
		if (targetWindow.tailwind && targetWindow.tailwind.config) {
			return Promise.resolve();
		}

		return this.loadIframeScript(
			targetWindow,
			`${this.getTailwindHelpersBasePath(targetWindow, options)}/tailwind.js`,
			'landing-tailwind-runtime',
		);
	}

	static loadIframeScript(targetWindow: Window, src: string, marker: string): Promise {
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

	static getTailwindHelpersBasePath(targetWindow: Window, options: Object = {}): string {
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

	static triggerTailwindRuntimeRebuild(targetWindow: Window): void {
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

	static getTailwindCssFromDom(targetWindow: Window): string {
		const style = targetWindow.document.querySelector('style[landing-tailwind-runtime]');

		return style ? String(style.textContent || '').trim() : '';
	}

	static renderPendingStyle(pendingBlockIds: Set < number > , targetDocument: ? Document, styleId : string): void {
		if (!targetDocument?.head) {
			return;
		}

		const style = targetDocument.getElementById(styleId);
		const selectors = [...pendingBlockIds]
			.flatMap((blockId) => [
				`[data-block-id="${blockId}"]`,
				`#block${blockId}`,
				`.block-wrapper[data-id="${blockId}"]`,
			]);
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

	static markPendingNode(
		node: ? Element,
		pendingAttribute : string,
		pendingVisibilityAttribute: string,
	): void {
		if (!this.#isElement(node)) {
			return;
		}

		if (!node.hasAttribute(pendingVisibilityAttribute)) {
			node.setAttribute(
				pendingVisibilityAttribute,
				String(node.style?.getPropertyValue?.('visibility') || ''),
			);
		}

		node.setAttribute(pendingAttribute, '1');
		node.style?.setProperty?.('visibility', 'hidden');
	}

	static unmarkPendingNode(
		node: ? Element,
		pendingAttribute : string,
		pendingVisibilityAttribute: string,
	): void {
		if (
			!this.#isElement(node) ||
			node.getAttribute(pendingAttribute) !== '1'
		) {
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

	static reloadWindow(targetWindow: ? Window): void {
		targetWindow?.location?.reload?.();
	}

	static #assertTargetWindowAvailable(targetWindow: Window): void {
		if (!targetWindow || !targetWindow.document) {
			throw new Error('Landing iframe window is not available.');
		}
	}

	static #normalizeTailwindHelpersBasePath(helpersBasePath: ? string): ? string {
		const normalizedPath = String(helpersBasePath || '').trim().replace(/\/+$/, '');

		return normalizedPath === '' ? null : normalizedPath;
	}

	static #isElement(node: ? Element): boolean {
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

export {
	TailwindRuntimeBatchSync,
	getPendingBlockIds,
	isPendingOperation,
	normalizeOperation,
	normalizeOperations,
};
