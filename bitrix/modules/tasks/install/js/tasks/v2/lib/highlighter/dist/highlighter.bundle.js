/* eslint-disable */
this.BX = this.BX || {};
this.BX.Tasks = this.BX.Tasks || {};
this.BX.Tasks.V2 = this.BX.Tasks.V2 || {};
(function (exports, main_core) {
	'use strict';

	class Highlighter {
		static HIGHLIGHT_CLASS = 'element-highlight';
		static ANIMATE_CLASS = '--animate';
		static ANIMATION_DURATION = 1000;
		#activeHighlights = new WeakMap();
		async highlight(element, duration = Highlighter.ANIMATION_DURATION) {
			if (!main_core.Type.isElementNode(element)) {
				return;
			}
			await this.#nextTick();
			this.#cleanup(element);
			this.#activeHighlights.set(element, {
				animationStart: null,
				timeoutId: null,
				handler: null
			});
			this.#startAnimation(element);
			const handler = () => this.#cleanup(element);
			main_core.Event.bind(window, 'click', handler);
			main_core.Event.bind(window, 'keydown', handler);
			const state = this.#activeHighlights.get(element);
			state.handler = handler;
			state.timeoutId = setTimeout(() => this.#cleanup(element), Highlighter.ANIMATION_DURATION);
		}
		#startAnimation(element) {
			main_core.Dom.addClass(element, [Highlighter.HIGHLIGHT_CLASS, Highlighter.ANIMATE_CLASS]);
			const state = this.#activeHighlights.get(element);
			if (state) {
				state.animationStart = Date.now();
			}
		}
		#cleanup(element) {
			const state = this.#activeHighlights.get(element);
			if (!state) {
				return;
			}
			main_core.Dom.removeClass(element, [Highlighter.HIGHLIGHT_CLASS, Highlighter.ANIMATE_CLASS]);
			if (state.timeoutId) {
				clearTimeout(state.timeoutId);
			}
			if (state.handler) {
				main_core.Event.unbind(window, 'click', state.handler);
				main_core.Event.unbind(window, 'keydown', state.handler);
			}
			this.#activeHighlights.delete(element);
		}
		#nextTick() {
			return new Promise(resolve => {
				// eslint-disable-next-line no-promise-executor-return
				return setTimeout(resolve, 0);
			});
		}
	}
	const highlighter = new Highlighter();

	exports.Highlighter = Highlighter;
	exports.highlighter = highlighter;

})(this.BX.Tasks.V2.Lib = this.BX.Tasks.V2.Lib || {}, BX);
//# sourceMappingURL=highlighter.bundle.js.map
