/* eslint-disable */
this.BX = this.BX || {};
(function (exports, main_core, main_core_events, ui_cnt) {
	'use strict';

	function getCounterAccessibleName(value, messageCode = 'INTRANET_INVITATION_WIDGET_COUNTER') {
		return main_core.Loc.getMessagePlural(messageCode, value, {
			'#COUNT#': value
		});
	}
	function updateCounterAccessibleName(counter, value, messageCode = 'INTRANET_INVITATION_WIDGET_COUNTER') {
		main_core.Dom.attr(counter.getContainer(), 'aria-label', getCounterAccessibleName(value, messageCode));
	}
	function destroyAccessibleCounter(counter) {
		main_core.Dom.attr(counter.getContainer(), 'aria-label', null);
		counter.destroy();
	}
	class InvitationWidgetCounter {
		#cache = new main_core.Cache.MemoryCache();
		static #instance;
		constructor() {
			main_core_events.EventEmitter.subscribeOnce('HR.company-structure:first-popup-showed', this.#onFirstWatchNewStructure.bind(this));
		}
		static getInstance() {
			if (!this.#instance) {
				this.#instance = new this();
			}
			return this.#instance;
		}
		setOptions(options) {
			this.#cache.set('options', options);
			return this;
		}
		getOptions() {
			return this.#cache.get('options', {});
		}
		show() {
			this.#getCounter().renderTo(this.#getCounterWrapper());
		}
		onReceiveCounterValue(value) {
			const invitationCounter = value;
			if (this.getOptions().shouldShowStructureCounter) {
				value++;
			}
			const counter = this.#getCounter();
			counter.update(value);
			this.#updateCounterAccessibleName(counter, invitationCounter);
			this.getOptions().invitationCounter = value;
			if (value > 0) {
				this.#getCounter().renderTo(this.#getCounterWrapper());
			} else {
				destroyAccessibleCounter(counter);
				this.#cache.delete('counter');
			}
		}
		#getCounterWrapper() {
			return this.#cache.remember('counter-wrapper', () => {
				return this.getOptions().button.querySelector('.invitation-widget-counter');
			});
		}
		#getCounter() {
			return this.#cache.remember('counter', () => {
				const value = this.#getCounterValue();
				const counter = new ui_cnt.Counter({
					value,
					color: ui_cnt.Counter.Color.DANGER,
					useAirDesign: this.getOptions().useAirDesign,
					style: this.getOptions().useAirDesign ? ui_cnt.CounterStyle.FILLED_ALERT : ui_cnt.CounterStyle.FILLED
				});
				this.#updateCounterAccessibleName(counter, Number(this.getOptions().invitationCounter));
				return counter;
			});
		}
		#updateCounterAccessibleName(counter, invitationCounter) {
			if (!this.getOptions().shouldShowStructureCounter) {
				updateCounterAccessibleName(counter, invitationCounter);
				return;
			}
			const accessibleName = [invitationCounter > 0 ? getCounterAccessibleName(invitationCounter) : null, getCounterAccessibleName(1, 'INTRANET_INVITATION_WIDGET_STRUCTURE_COUNTER')].filter(main_core.Type.isStringFilled).join('. ');
			main_core.Dom.attr(counter.getContainer(), 'aria-label', accessibleName);
		}
		#getCounterValue() {
			let counterValue = Number(this.getOptions().invitationCounter);
			if (this.getOptions().shouldShowStructureCounter ?? false) {
				counterValue++;
			}
			return counterValue;
		}
		#onFirstWatchNewStructure() {
			let value = this.#getCounter().value;
			if (!main_core.Type.isNumber(value)) {
				return;
			}
			if (!this.getOptions().shouldShowStructureCounter) {
				return;
			}
			value--;
			this.getOptions().shouldShowStructureCounter = false;
			const counter = this.#getCounter();
			counter.update(value);
			this.#updateCounterAccessibleName(counter, value);
			this.getOptions().invitationCounter = value;
			if (value > 0) {
				this.#getCounter().renderTo(this.#getCounterWrapper());
			} else {
				destroyAccessibleCounter(counter);
				this.#cache.delete('counter');
			}
		}
	}

	exports.InvitationWidgetCounter = InvitationWidgetCounter;
	exports.destroyAccessibleCounter = destroyAccessibleCounter;
	exports.updateCounterAccessibleName = updateCounterAccessibleName;

})(this.BX.Intranet = this.BX.Intranet || {}, BX, BX.Event, BX.UI);
//# sourceMappingURL=invitation-widget-counter.bundle.js.map
