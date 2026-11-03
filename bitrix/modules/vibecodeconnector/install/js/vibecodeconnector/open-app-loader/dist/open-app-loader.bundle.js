/* eslint-disable */
(function () {
	'use strict';

	const DEFAULT_SAFETY_TIMEOUT_MS = 30000;
	const BLANK_FRAME_URL = 'about:blank';
	const OVERLAY_SELECTOR = '.vibecodeconnector-open-app-loader';
	const SPACER_SELECTOR = '.vibecodeconnector-open-app-loader-spacer';
	const FRAME_SELECTOR = '.vibecodeconnector-open-app-layout iframe';
	const HIDDEN_MODIFIER = '--hidden';
	const LOADED_MODIFIER = '--loaded';
	class LoadingScreen {
		#elements;
		#safetyTimer = null;
		static attach(root, canvas, options = {}) {
			const overlay = root.querySelector(OVERLAY_SELECTOR);
			if (overlay === null) {
				return null;
			}
			return new LoadingScreen({
				overlay,
				canvas,
				spacer: root.querySelector(SPACER_SELECTOR),
				frame: root.querySelector(FRAME_SELECTOR)
			}, options);
		}
		constructor(elements, options = {}) {
			this.#elements = elements;
			this.#elements.frame?.addEventListener('load', this.#onFrameLoad);
			this.#safetyTimer = window.setTimeout(() => this.hide(), options.safetyTimeoutMs ?? DEFAULT_SAFETY_TIMEOUT_MS);
		}
		isHidden() {
			return this.#elements.overlay.classList.contains(HIDDEN_MODIFIER);
		}
		hide() {
			if (this.#safetyTimer !== null) {
				window.clearTimeout(this.#safetyTimer);
				this.#safetyTimer = null;
			}
			this.#elements.frame?.removeEventListener('load', this.#onFrameLoad);
			this.#elements.overlay.classList.add(HIDDEN_MODIFIER);
			this.#elements.canvas.classList.add(LOADED_MODIFIER);
			this.#elements.spacer?.remove();
			this.#elements.spacer = null;
			window.scrollTo(0, 0);
		}
		#onFrameLoad = () => {
			if (this.#isBlankFrame()) {
				return;
			}
			this.hide();
		};
		#isBlankFrame() {
			const frame = this.#elements.frame;
			if (frame === null) {
				return false;
			}
			try {
				return frame.contentDocument !== null && frame.contentWindow?.location.href === BLANK_FRAME_URL;
			} catch {
				return false;
			}
		}
	}

	LoadingScreen.attach(document, document.documentElement);

})();
//# sourceMappingURL=open-app-loader.bundle.js.map
