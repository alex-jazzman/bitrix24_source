/* eslint-disable */
this.BX = this.BX || {};
this.BX.Call = this.BX.Call || {};
(function (exports, ui_vue3, main_core, main_core_events) {
	'use strict';

	const EXTENSION_NAME = 'call.widget.sync-active-calls-slot';
	function isSyncActiveCallsEnabled() {
		return main_core.Extension.getSettings(EXTENSION_NAME).get('syncActiveCallsEnabled', false) === true;
	}

	const MOUNT_ACTIVE_CALLS = 'BX.SyncConnector.mountActiveCalls';
	const EMBED_CONNECTED = 'BX.SyncConnector.Embed:connected';
	class SyncActiveCallsMount {
		#host;
		#options;
		#slot = null;
		#isWaiting = false;
		#isDestroyed = false;
		constructor(host, options) {
			this.#host = host;
			this.#options = options;
		}
		start() {
			if (this.#isDestroyed || this.#isWaiting || this.#slot !== null) {
				return;
			}
			if (!this.#mount()) {
				this.#isWaiting = true;
				main_core_events.EventEmitter.subscribe(EMBED_CONNECTED, this.#handleConnected);
			}
		}
		destroy() {
			if (this.#isDestroyed) {
				return;
			}
			this.#isDestroyed = true;
			this.#stopWaiting();
			this.#slot?.unmount();
			this.#slot = null;
		}
		#mount() {
			const mountActiveCalls = main_core.Reflection.getClass(MOUNT_ACTIVE_CALLS);
			if (!main_core.Type.isFunction(mountActiveCalls)) {
				return false;
			}
			this.#slot = mountActiveCalls(this.#host, this.#options);
			return true;
		}
		#stopWaiting() {
			if (!this.#isWaiting) {
				return;
			}
			this.#isWaiting = false;
			main_core_events.EventEmitter.unsubscribe(EMBED_CONNECTED, this.#handleConnected);
		}
		#handleConnected = () => {
			if (!this.#isDestroyed && this.#mount()) {
				this.#stopWaiting();
			}
		};
	}

	const SyncActiveCallsSlot = ui_vue3.defineComponent({
		name: 'SyncActiveCallsSlot',
		props: {
			mode: {
				type: String,
				required: true,
				validator: value => value === 'full' || value === 'compact'
			}
		},
		emits: ['countChange'],
		data() {
			return {
				count: 0,
				listMount: null
			};
		},
		watch: {
			mode() {
				this.unmountList();
				this.setCount(0);
				this.mountList();
			}
		},
		mounted() {
			this.mountList();
		},
		beforeUnmount() {
			this.unmountList();
		},
		methods: {
			mountList() {
				if (!isSyncActiveCallsEnabled()) {
					return;
				}
				const listMount = ui_vue3.markRaw(new SyncActiveCallsMount(this.$refs.host, {
					mode: this.mode,
					onCountChange: count => this.setCount(count)
				}));
				this.listMount = listMount;
				listMount.start();
			},
			unmountList() {
				this.listMount?.destroy();
				this.listMount = null;
			},
			setCount(count) {
				if (count === this.count) {
					return;
				}
				this.count = count;
				this.$emit('countChange', count);
			}
		},
		template: `
		<div ref="host" class="call-widget-sync-active-calls-slot"></div>
	`
	});

	exports.SyncActiveCallsSlot = SyncActiveCallsSlot;
	exports.isSyncActiveCallsEnabled = isSyncActiveCallsEnabled;

})(this.BX.Call.Widget = this.BX.Call.Widget || {}, BX.Vue3, BX, BX.Event);
//# sourceMappingURL=sync-active-calls-slot.bundle.js.map
