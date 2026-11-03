import Type from '../../type';

export type EventStoreRecord = {
	eventsMap: Map<any, any>,
	onceMap: Map<any, any>,
	maxListeners: number,
	eventsMaxListeners: Map<any, any>,
};

export default class EventStore
{
	defaultMaxListeners: number;
	eventStore: WeakMap<object, any> = new WeakMap();

	constructor(options: { defaultMaxListeners?: number } = {})
	{
		this.defaultMaxListeners = Type.isNumber(options.defaultMaxListeners) ? options.defaultMaxListeners : 10;
	}

	add(target: Object, options: { maxListeners?: number } = {}): EventStoreRecord
	{
		const record = this.getRecordScheme();
		if (Type.isNumber(options.maxListeners))
		{
			record.maxListeners = options.maxListeners;
		}

		this.eventStore.set(target, record);

		return record;
	}

	get(target: Object): EventStoreRecord | undefined
	{
		return this.eventStore.get(target);
	}

	getOrAdd(target: Object, options: { maxListeners?: number } = {}): EventStoreRecord
	{
		return this.get(target) || this.add(target, options);
	}

	delete(context: any): void
	{
		this.eventStore.delete(context);
	}

	getRecordScheme(): EventStoreRecord
	{
		return {
			eventsMap: new Map(),
			onceMap: new Map(),
			maxListeners: this.getDefaultMaxListeners(),
			eventsMaxListeners: new Map(),
		};
	}

	getDefaultMaxListeners(): number
	{
		return this.defaultMaxListeners;
	}
}
