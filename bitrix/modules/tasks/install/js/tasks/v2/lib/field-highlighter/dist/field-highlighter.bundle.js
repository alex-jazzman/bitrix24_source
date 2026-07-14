/* eslint-disable */
this.BX = this.BX || {};
this.BX.Tasks = this.BX.Tasks || {};
this.BX.Tasks.V2 = this.BX.Tasks.V2 || {};
(function (exports, main_core) {
	'use strict';

	const fieldAttribute = 'data-task-field-id';
	const chipAttribute = 'data-task-chip-id';
	const fieldSelector = '[data-field-container]';
	class FieldHighlighter {
		#container = document.body;
		#highlightTimeouts = {};
		setContainer(container) {
			this.#container = container;
			return this;
		}
		addHighlight(fieldId) {
			this.highlightContainer(this.getFieldContainer(fieldId));
			return this;
		}
		addChipHighlight(fieldId) {
			this.highlightContainer(this.getChipContainer(fieldId));
			return this;
		}
		highlightContainer(container) {
			if (!container) {
				return;
			}
			main_core.Dom.addClass(container, 'tasks-field-highlight');
			const removeHighlight = () => {
				main_core.Dom.removeClass(container, 'tasks-field-highlight');
				main_core.Event.unbind(window, 'click', removeHighlight);
				main_core.Event.unbind(window, 'keydown', removeHighlight);
			};
			main_core.Event.bind(window, 'click', removeHighlight);
			main_core.Event.bind(window, 'keydown', removeHighlight);
		}
		async highlight(fieldId) {
			await this.#nextTick();
			const fieldContainer = this.getFieldContainer(fieldId);
			if (!fieldContainer) {
				return;
			}
			this.#stopAnimation(fieldContainer);
			setTimeout(() => this.#startAnimation(fieldContainer));
			clearTimeout(this.#highlightTimeouts[fieldId]);
			this.#highlightTimeouts[fieldId] = setTimeout(() => this.#stopAnimation(fieldContainer), 1500);
			this.scrollToField(fieldId);
		}
		#startAnimation(fieldContainer) {
			main_core.Dom.addClass(fieldContainer, ['tasks-field-highlight', '--animate']);
		}
		#stopAnimation(fieldContainer) {
			main_core.Dom.removeClass(fieldContainer, ['tasks-field-highlight', '--animate']);
		}
		scrollToField(fieldId) {
			const fieldContainer = this.getFieldContainer(fieldId);
			if (!fieldContainer) {
				return this;
			}
			main_core.Dom.style(fieldContainer, 'scrollMarginTop', '100px');
			fieldContainer.scrollIntoView({
				block: 'start',
				behavior: 'smooth'
			});
			setTimeout(() => {
				main_core.Dom.style(fieldContainer, 'scrollMarginTop', null);
			}, 1000);
			return this;
		}
		getFieldContainer(fieldId) {
			return this.#container.querySelector(`[${fieldAttribute}="${fieldId}"]`)?.closest(fieldSelector);
		}
		getChipContainer(fieldId) {
			return this.#container.querySelector(`[${chipAttribute}="${fieldId}"]`);
		}
		#nextTick() {
			return new Promise(resolve => {
				setTimeout(resolve, 0);
			});
		}
	}
	const fieldHighlighter = new FieldHighlighter();

	exports.fieldHighlighter = fieldHighlighter;

})(this.BX.Tasks.V2.Lib = this.BX.Tasks.V2.Lib || {}, BX);
//# sourceMappingURL=field-highlighter.bundle.js.map
