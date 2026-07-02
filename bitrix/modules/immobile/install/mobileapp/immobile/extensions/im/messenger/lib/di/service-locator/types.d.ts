declare type MessengerLocatorServices = {
	'core': CoreApplication,
	'emitter': JNEventEmitter,
	'messenger-init-service'?: MessengerInitService,
	'tab-counters': TabCounters,
	'counters-update-system': CountersUpdateSystem
	'refresher'?: Refresher,
	'connection-service'?: ConnectionService,
	'sync-service'?: SyncService,
	'read-service'?: ReadMessageService,
	'sending-service'?: SendingService,
	'queue-service'?: QueueService,
	'messenger-header-manager'?: MessengerHeaderManager,
	'dialog-manager'?: DialogManager,
	'push-manager'?: PushManager,
	'recent-manager'?: RecentManager,
	'quick-recent'?: QuickRecentLoader,
	'dialog-creator'?: DialogCreator,
	'navigation-manager'?: NavigationManager,
	'promotion'?: Promotion,
	'subscription-manager': SubscriptionManager,
}

export interface IServiceLocator<T>
{
	add<U extends keyof T>(serviceName: U, service: T[U]): IServiceLocator<T>;
	get<U extends keyof T>(serviceName: U): T[U] | null;
	has<U extends keyof T>(serviceName: U): boolean;
	clear(): void;
	forEach(callback: (service: T[keyof T], key: keyof T) => void): void;
}

declare type MessengerLocator = IServiceLocator<MessengerLocatorServices>;
