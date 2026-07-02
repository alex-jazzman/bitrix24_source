import Type from '../type';

const IS_WEAK_REF_SUPPORTED = typeof WeakRef !== 'undefined';

export default class WeakRefMap<K, V extends WeakKey>
{
	#refs: Map<K, WeakRef<V> | V> = new Map();
	#registry: FinalizationRegistry<K> | null = null;

	constructor()
	{
		if (IS_WEAK_REF_SUPPORTED)
		{
			this.#registry = new FinalizationRegistry(this.#cleanupCallback.bind(this));
		}
	}

	clear(): void
	{
		if (!IS_WEAK_REF_SUPPORTED)
		{
			this.#refs.clear();

			return;
		}

		this.#refs.forEach((ref) => {
			const value = (ref as WeakRef<V>).deref();
			if (!Type.isUndefined(value))
			{
				this.#registry!.unregister(value);
			}
		});

		this.#refs.clear();
	}

	delete(key: K): boolean
	{
		if (!IS_WEAK_REF_SUPPORTED)
		{
			return this.#refs.delete(key);
		}

		const value = this.get(key);
		if (!Type.isUndefined(value))
		{
			this.#registry!.unregister(value);
		}

		return this.#refs.delete(key);
	}

	get(key: K): V | undefined
	{
		if (!IS_WEAK_REF_SUPPORTED)
		{
			return this.#refs.get(key) as V | undefined;
		}

		return (this.#refs.get(key) as WeakRef<V> | undefined)?.deref();
	}

	has(key: K): boolean
	{
		if (!IS_WEAK_REF_SUPPORTED)
		{
			return this.#refs.has(key);
		}

		return !Type.isUndefined((this.#refs.get(key) as WeakRef<V> | undefined)?.deref());
	}

	set(key: K, value: V): this
	{
		if (!IS_WEAK_REF_SUPPORTED)
		{
			this.#refs.set(key, value);

			return this;
		}

		this.#refs.set(key, new WeakRef(value));
		this.#registry!.register(value, key, value);

		return this;
	}

	#cleanupCallback(key: K): void
	{
		const ref = this.#refs.get(key) as WeakRef<V> | undefined;
		if (ref && !ref.deref())
		{
			this.#refs.delete(key);
		}
	}
}
