/* eslint-disable */
this.BX = this.BX || {};
this.BX.Sign = this.BX.Sign || {};
this.BX.Sign.V2 = this.BX.Sign.V2 || {};
(function (exports, main_core, main_core_events) {
	'use strict';

	var documentCounterIcon = "/bitrix/js/sign/v2/b2e/document-counters/dist/assets/document-counter-icon.svg";

	var documentCounterWarningIcon = "/bitrix/js/sign/v2/b2e/document-counters/dist/assets/document-counter-warning-icon.svg";

	class DocumentCounters extends main_core_events.EventEmitter {
		#sizeLimit;
		#container;
		#counterNode;
		#iconNode;
		#committedCount = 0;
		constructor(options) {
			super();
			this.setEventNamespace('BX.Sign.V2.B2e.DocumentCounters');
			this.#sizeLimit = Number(options.documentCountersLimit);
			this.#counterNode = main_core.Tag.render`<span class="sign-b2e-settings__document-counter-select">0</span>`;
			this.#iconNode = main_core.Tag.render`
			<img
				class="sign-b2e-settings__document-counter-icon"
				src="${documentCounterIcon}"
				alt=""
			>
		`;
			this.#container = main_core.Tag.render`
			<div class="sign-b2e-settings__document-counter">
				${this.#iconNode}
				<div class="sign-b2e-settings__document-counter_limit-block">
					${this.#counterNode}
					${this.#getLimitContainer()}
				</div>
			</div>
		`;
		}
		getLayout() {
			return this.#container;
		}
		#getLimitContainer() {
			return main_core.Tag.render`<span class="sign-b2e-settings__document-counter-limit">/ ${this.#sizeLimit}</span>`;
		}
		getCount() {
			return this.#committedCount;
		}
		update(size) {
			this.#committedCount = size;
			this.#refresh();
		}
		#refresh() {
			const displayCount = this.getCount();
			this.#counterNode.textContent = displayCount;
			if (displayCount >= this.#sizeLimit) {
				this.emit('limitExceeded');
				main_core.Dom.addClass(this.#container, '--alert');
				this.#iconNode.src = documentCounterWarningIcon;
			} else {
				this.emit('limitNotExceeded');
				main_core.Dom.removeClass(this.#container, '--alert');
				this.#iconNode.src = documentCounterIcon;
			}
		}
	}

	exports.DocumentCounters = DocumentCounters;

})(this.BX.Sign.V2.B2e = this.BX.Sign.V2.B2e || {}, BX, BX.Event);
//# sourceMappingURL=document-counters.bundle.js.map
