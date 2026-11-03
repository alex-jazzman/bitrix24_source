/* eslint-disable */
this.BX = this.BX || {};
this.BX.Tasks = this.BX.Tasks || {};
(function (exports, main_core_events, main_core) {
	'use strict';

	class Pool {
		#items = [];
		add(index, fields) {
			this.#items.push({
				[index]: {
					fields
				}
			});
		}
		getItems() {
			return this.#items;
		}
		clean() {
			this.#items = [];
		}
		count() {
			return this.#items.length;
		}
		isEmpty() {
			return this.#items.length === 0;
		}
	}

	const Status = Object.freeze({
		RUN: 'run',
		NONE: 'none'
	});

	class DebouncedQueue extends main_core_events.EventEmitter {
		#status = Status.NONE;
		#timeout = 0;
		#pool = new Pool();
		#debounce = null;
		constructor(options = {}) {
			super();
			this.setEventNamespace('BX.Tasks.DebounceQueue');
			options = main_core.Type.isPlainObject(options) ? options : {};
			this.subscribeFromOptions(options.events);
			this.#timeout = options.timeout ?? 1000;
			this.#debounce = main_core.Runtime.debounce(() => {
				this.#status = Status.RUN;
				this.commit().then(() => this.#status = Status.NONE);
			}, this.#timeout);
		}
		push(fields, index = 'default') {
			this.#pool.add(index, fields);
			// console.log('pool', this.#pool.getItems());
			// console.log(JSON.stringify(this.#pool.items));
			this.commitWithDebounce();
		}
		commit() {
			return new Promise((resolve, reject) => {
				if (this.#pool.isEmpty() === false) {
					// console.log('count', this.#pool.count());

					const poolItems = this.#pool.getItems();
					this.#pool.clean();
					this.emitAsync('onCommitAsync', {
						poolItems
					}).then(() => this.commit().then(() => resolve())).catch();
				} else {
					resolve();
				}
			});
		}
		commitWithDebounce() {
			if (this.#status === Status.NONE) {
				this.#debounce();
			}
		}
	}

	exports.DebouncedQueue = DebouncedQueue;
	exports.Pool = Pool;
	exports.Status = Status;

})(this.BX.Tasks.Runtime = this.BX.Tasks.Runtime || {}, BX.Event, BX);
//# sourceMappingURL=index.bundle.js.map
