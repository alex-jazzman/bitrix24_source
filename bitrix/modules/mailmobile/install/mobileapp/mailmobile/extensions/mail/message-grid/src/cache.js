/**
 * @module mail/message-grid/src/cache
 */
jn.define('mail/message-grid/src/cache', (require, exports, module) => {
	const STORAGE_ID = 'MailMessageGrid';
	const DEFAULT_CACHE_TTL = 20;

	let storage = null;
	let inMemoryTtl = null;

	class MessageGridCache
	{
		constructor(ttl = DEFAULT_CACHE_TTL)
		{
			this.ttl = ttl;
		}

		isExpired(ttl = this.ttl)
		{
			return this.#getCurrentTimeInSeconds() > this.#getTtlValue() + ttl;
		}

		updateTimestamp()
		{
			const ttl = this.#getCurrentTimeInSeconds();

			inMemoryTtl = ttl;

			return this.#getStorage().setNumber('ttl', ttl);
		}

		#getTtlValue()
		{
			if (inMemoryTtl === null)
			{
				inMemoryTtl = this.#getStorage().getNumber('ttl', 0);
			}

			return inMemoryTtl;
		}

		#getStorage()
		{
			if (!storage)
			{
				storage = Application.storageById(STORAGE_ID);
			}

			return storage;
		}

		#getCurrentTimeInSeconds()
		{
			return Math.floor(Date.now() / 1000);
		}
	}

	module.exports = { MessageGridCache };
});
