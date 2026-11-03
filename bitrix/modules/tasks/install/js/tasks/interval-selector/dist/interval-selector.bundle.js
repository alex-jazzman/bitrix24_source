/* eslint-disable */
this.BX = this.BX || {};
(function (exports, main_core, main_popup, main_core_events) {
	'use strict';

	const DEFAULT_INTERVAL = 'days';
	const DEFAULT_INTERVALS = ['hours', 'days', 'months'];
	class IntervalSelector extends main_core_events.EventEmitter {
		#params;
		#layout;
		#intervals;
		#currentInterval;
		#showDropdownIcon = false;
		constructor(params = {}) {
			super(params);
			this.setEventNamespace('BX.Tasks.IntervalSelector');
			this.#params = params;
			this.#layout = {};
			this.#intervals = params.intervals || DEFAULT_INTERVALS;
			this.#currentInterval = params.defaultInterval || DEFAULT_INTERVAL;
			if (this.#params.value) {
				this.setSuitableInterval(this.#params.value);
			}
			if (params.showDropdownIcon) {
				this.#showDropdownIcon = true;
			}
		}
		render() {
			this.#layout.intervalSelector = main_core.Tag.render`
			<div class="tasks-interval-selector${this.#showDropdownIcon ? ' tasks-interval-selector-dropdown' : ''}">
				${this.#getIntervalPhrase(this.#currentInterval)}
			</div>
		`;
			main_core.Event.bind(this.#layout.intervalSelector, 'click', this.#showIntervalMenu.bind(this));
			return this.#layout.intervalSelector;
		}
		getInterval() {
			return this.#currentInterval;
		}
		getDuration() {
			return this.#getIntervalDuration(this.#currentInterval);
		}
		setSuitableInterval(value) {
			const durations = this.#intervals.map(interval => ({
				interval,
				value: value / this.#getIntervalDuration(interval)
			}));
			const mostSuitable = durations.reduce((acc, duration) => {
				if (duration.value % 1 === 0 && duration.value <= acc.value) {
					return {
						interval: duration.interval,
						value: duration.value
					};
				}
				return acc;
			}, {
				value: Math.max(...durations.map(duration => duration.value))
			});
			this.setInterval(mostSuitable.interval);
		}
		setInterval(interval) {
			this.#currentInterval = interval;
			if (this.#layout.intervalSelector) {
				this.#layout.intervalSelector.innerText = this.#getIntervalPhrase(interval);
			}
		}
		#showIntervalMenu() {
			let menu;
			const handleScroll = () => {
				const popup = menu.getPopupWindow();
				popup.adjustPosition();
				const popupRect = popup.bindElement.getBoundingClientRect();
				if (popupRect.top > window.innerHeight || popupRect.bottom < 0) {
					menu.close();
				}
			};
			menu = main_popup.MenuManager.create({
				id: 'tasks-flow-create-planned-completion-time-interval-menu' + Date.now(),
				bindElement: this.#layout.intervalSelector,
				items: this.#intervals.map(interval => ({
					id: interval,
					text: this.#getIntervalPhrase(interval),
					onclick: (e, item) => {
						this.setInterval(item.id);
						this.emit('intervalChanged', {
							'interval': item.id
						});
						menu.close();
					}
				})),
				events: {
					onShow: () => {
						const popup = menu.getPopupWindow();
						const popupWidth = popup.getPopupContainer().offsetWidth;
						const elementWidth = popup.bindElement.offsetWidth;
						popup.setOffset({
							offsetLeft: elementWidth / 2 - popupWidth / 2 + 4,
							offsetTop: 5
						});
						popup.adjustPosition();
						main_core.Event.bind(window, 'scroll', handleScroll, true);
					},
					onClose: () => {
						menu.destroy();
						main_core.Event.unbind(window, 'scroll', handleScroll, true);
					}
				}
			});
			menu.show();
		}
		#getIntervalPhrase(interval) {
			return main_core.Loc.getMessage(`TASKS_INTERVAL_SELECTOR_${interval.toUpperCase()}`);
		}
		#getIntervalDuration(interval) {
			const intervalDurations = {
				'minutes': 60,
				'hours': 60 * 60,
				'days': 60 * 60 * 24,
				'months': 60 * 60 * 24 * 30
			};
			return intervalDurations[interval];
		}
	}

	exports.IntervalSelector = IntervalSelector;

})(this.BX.Tasks = this.BX.Tasks || {}, BX, BX.Main, BX.Event);
//# sourceMappingURL=interval-selector.bundle.js.map
