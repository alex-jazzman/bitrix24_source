import {
	AutoLauncher,
	type LaunchItemCallback,
	type LaunchItemOptions,
} from 'ui.auto-launch';
import { Runtime, Type } from 'main.core';

const UI_BANNER_DISPATCHER_EXTENSION = 'ui.banner-dispatcher';

let bannerDispatcherPromise = null;
let loadedBannerDispatcher = null;
let pendingItems = [];

export const Priority = {
	LOW: 'low',
	NORMAL: 'normal',
	HIGH: 'high',
	CRITICAL: 'critical',
};

const isCorrectQueue = (queue): boolean => {
	return Type.isPlainObject(queue)
		&& Object.prototype.hasOwnProperty.call(queue, 'toQueue')
		&& Type.isFunction(queue.toQueue)
	;
};

const extractBannerDispatcher = (extensionExports) => {
	const bannerDispatcher = extensionExports?.BannerDispatcher;
	const hasAllQueues = Type.isPlainObject(bannerDispatcher)
		&& Object.values(Priority).every((priority) => isCorrectQueue(bannerDispatcher[priority]))
	;

	if (!hasAllQueues)
	{
		throw new TypeError('ui.banner-dispatcher has an invalid BannerDispatcher export');
	}

	return bannerDispatcher;
};

const loadBannerDispatcher = () => {
	if (bannerDispatcherPromise)
	{
		return bannerDispatcherPromise;
	}

	const currentPromise = Runtime.loadExtension(UI_BANNER_DISPATCHER_EXTENSION)
		.then(extractBannerDispatcher)
	;
	bannerDispatcherPromise = currentPromise;

	currentPromise.then(
		(bannerDispatcher) => {
			if (bannerDispatcherPromise === currentPromise)
			{
				loadedBannerDispatcher = bannerDispatcher;
				bannerDispatcherPromise = null;
				flushPendingItems(bannerDispatcher);
			}
		},
		() => {
			if (bannerDispatcherPromise === currentPromise)
			{
				bannerDispatcherPromise = null;
				runFallbackQueue(takePendingItems());
			}
		},
	);

	return currentPromise;
};

const enableAutoLauncher = (): void => {
	if (!AutoLauncher.isEnabled())
	{
		AutoLauncher.enable();
	}
};

const runFallback = (callback: LaunchItemCallback, onDone: Function = () => {}): void => {
	callback(onDone);
};

const takePendingItems = (): Array => {
	const items = pendingItems;
	pendingItems = [];

	return items;
};

const runFallbackQueue = (items: Array): void => {
	const runNext = () => {
		const item = items.shift();
		if (item)
		{
			runFallback(item.callback, runNext);
		}
	};

	runNext();
};

const queueBanner = (
	bannerDispatcher,
	callback: LaunchItemCallback,
	priority: $Values<typeof Priority>,
	options: LaunchItemOptions,
): void => {
	bannerDispatcher[priority].toQueue(callback, options);
};

const flushPendingItems = (bannerDispatcher): void => {
	const items = takePendingItems();
	items.forEach(({ callback, priority, options }) => {
		queueBanner(bannerDispatcher, callback, priority, options);
	});

	enableAutoLauncher();
};

export class BannerDispatcher
{
	isAvailable(): boolean
	{
		return Type.isFunction(Runtime.loadExtension);
	}

	toQueue(
		callback: LaunchItemCallback,
		priority: $Values<typeof Priority> = Priority.NORMAL,
		options: LaunchItemOptions = {},
	): boolean
	{
		if (!Object.values(Priority).includes(priority))
		{
			throw new RangeError('Priority property is invalid');
		}

		if (!this.isAvailable())
		{
			runFallback(callback);

			return false;
		}

		if (loadedBannerDispatcher)
		{
			queueBanner(loadedBannerDispatcher, callback, priority, options);
			enableAutoLauncher();

			return true;
		}

		pendingItems.push({ callback, priority, options });
		try
		{
			loadBannerDispatcher();
		}
		catch
		{
			runFallbackQueue(takePendingItems());

			return false;
		}

		return true;
	}
}
