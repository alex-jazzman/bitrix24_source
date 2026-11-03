/* eslint-disable */
this.BX = this.BX || {};
this.BX.Crm = this.BX.Crm || {};
this.BX.Crm.Integration = this.BX.Crm.Integration || {};
(function (exports, ui_autoLaunch, main_core) {
	'use strict';

	const UI_BANNER_DISPATCHER_EXTENSION = 'ui.banner-dispatcher';
	let bannerDispatcherPromise = null;
	let loadedBannerDispatcher = null;
	let pendingItems = [];
	const Priority = {
		LOW: 'low',
		NORMAL: 'normal',
		HIGH: 'high',
		CRITICAL: 'critical'
	};
	const isCorrectQueue = queue => {
		return main_core.Type.isPlainObject(queue) && Object.prototype.hasOwnProperty.call(queue, 'toQueue') && main_core.Type.isFunction(queue.toQueue);
	};
	const extractBannerDispatcher = extensionExports => {
		const bannerDispatcher = extensionExports?.BannerDispatcher;
		const hasAllQueues = main_core.Type.isPlainObject(bannerDispatcher) && Object.values(Priority).every(priority => isCorrectQueue(bannerDispatcher[priority]));
		if (!hasAllQueues) {
			throw new TypeError('ui.banner-dispatcher has an invalid BannerDispatcher export');
		}
		return bannerDispatcher;
	};
	const loadBannerDispatcher = () => {
		if (bannerDispatcherPromise) {
			return bannerDispatcherPromise;
		}
		const currentPromise = main_core.Runtime.loadExtension(UI_BANNER_DISPATCHER_EXTENSION).then(extractBannerDispatcher);
		bannerDispatcherPromise = currentPromise;
		currentPromise.then(bannerDispatcher => {
			if (bannerDispatcherPromise === currentPromise) {
				loadedBannerDispatcher = bannerDispatcher;
				bannerDispatcherPromise = null;
				flushPendingItems(bannerDispatcher);
			}
		}, () => {
			if (bannerDispatcherPromise === currentPromise) {
				bannerDispatcherPromise = null;
				runFallbackQueue(takePendingItems());
			}
		});
		return currentPromise;
	};
	const enableAutoLauncher = () => {
		if (!ui_autoLaunch.AutoLauncher.isEnabled()) {
			ui_autoLaunch.AutoLauncher.enable();
		}
	};
	const runFallback = (callback, onDone = () => {}) => {
		callback(onDone);
	};
	const takePendingItems = () => {
		const items = pendingItems;
		pendingItems = [];
		return items;
	};
	const runFallbackQueue = items => {
		const runNext = () => {
			const item = items.shift();
			if (item) {
				runFallback(item.callback, runNext);
			}
		};
		runNext();
	};
	const queueBanner = (bannerDispatcher, callback, priority, options) => {
		bannerDispatcher[priority].toQueue(callback, options);
	};
	const flushPendingItems = bannerDispatcher => {
		const items = takePendingItems();
		items.forEach(({
			callback,
			priority,
			options
		}) => {
			queueBanner(bannerDispatcher, callback, priority, options);
		});
		enableAutoLauncher();
	};
	class BannerDispatcher {
		isAvailable() {
			return main_core.Type.isFunction(main_core.Runtime.loadExtension);
		}
		toQueue(callback, priority = Priority.NORMAL, options = {}) {
			if (!Object.values(Priority).includes(priority)) {
				throw new RangeError('Priority property is invalid');
			}
			if (!this.isAvailable()) {
				runFallback(callback);
				return false;
			}
			if (loadedBannerDispatcher) {
				queueBanner(loadedBannerDispatcher, callback, priority, options);
				enableAutoLauncher();
				return true;
			}
			pendingItems.push({
				callback,
				priority,
				options
			});
			try {
				loadBannerDispatcher();
			} catch {
				runFallbackQueue(takePendingItems());
				return false;
			}
			return true;
		}
	}

	exports.BannerDispatcher = BannerDispatcher;
	exports.Priority = Priority;

})(this.BX.Crm.Integration.UI = this.BX.Crm.Integration.UI || {}, BX.UI.AutoLaunch, BX);
//# sourceMappingURL=banner-dispatcher.bundle.js.map
