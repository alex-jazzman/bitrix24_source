const STORAGE_KEY_PREFIX = 'note:document-mention-labels:v2';
const LEGACY_STORAGE_KEY_PREFIX = 'note:document-mention-labels:v1';
const CACHE_TTL_MS = 14 * 24 * 60 * 60 * 1000;

export const DOCUMENT_MENTION_LABEL_CACHE_LIMIT = 200;

function getLocalStorage(): ?Object
{
	try
	{
		return typeof window === 'undefined' ? null : window.localStorage;
	}
	catch
	{
		return null;
	}
}

export class DocumentMentionLabelCache
{
	#storage: ?Object;
	#storageKey: ?string;
	#limit: number;
	#entries: Map<number, Object>;
	#now: Function;

	constructor({
		userId,
		storage = getLocalStorage(),
		limit = DOCUMENT_MENTION_LABEL_CACHE_LIMIT,
		now = () => Date.now(),
	}: {
		userId: mixed,
		storage?: ?Object,
		limit?: number,
		now?: Function,
	})
	{
		const normalizedUserId = Number(userId);
		this.#storage = storage;
		this.#storageKey = Number.isInteger(normalizedUserId) && normalizedUserId > 0
			? `${STORAGE_KEY_PREFIX}:${normalizedUserId}`
			: null
		;
		this.#limit = Number.isInteger(limit) && limit > 0 ? limit : DOCUMENT_MENTION_LABEL_CACHE_LIMIT;
		this.#now = now;
		this.#removeForeignUserEntries();
		this.#entries = this.#readEntries();
	}

	get(documentId: mixed): ?Object
	{
		const id = Number(documentId);
		if (!Number.isInteger(id) || id <= 0)
		{
			return null;
		}

		const entry = this.#entries.get(id);
		if (!entry)
		{
			return null;
		}

		this.#entries.delete(id);
		this.#entries.set(id, entry);

		return Object.freeze({ label: entry.label, available: entry.available });
	}

	set(documentId: mixed, snapshot: mixed): void
	{
		this.setMany([[documentId, snapshot]]);
	}

	setMany(snapshots: Iterable<[mixed, mixed]>): void
	{
		if (!this.#storageKey || !snapshots?.[Symbol.iterator])
		{
			return;
		}

		let changed = false;
		for (const [documentId, snapshot] of snapshots)
		{
			const id = Number(documentId);
			const entry = this.#normalizeEntry(snapshot, this.#now());
			if (!Number.isInteger(id) || id <= 0 || entry === null)
			{
				continue;
			}

			this.#entries.delete(id);
			this.#entries.set(id, entry);
			changed = true;
		}
		if (!changed)
		{
			return;
		}

		while (this.#entries.size > this.#limit)
		{
			this.#entries.delete(this.#entries.keys().next().value);
		}

		if (!this.#storage)
		{
			return;
		}

		try
		{
			const entries = [...this.#entries].map(([entryId, entry]) => ({ id: entryId, ...entry }));
			this.#storage.setItem(this.#storageKey, JSON.stringify({ entries }));
		}
		catch
		{
		}
	}

	#readEntries(): Map<number, Object>
	{
		if (!this.#storage || !this.#storageKey)
		{
			return new Map();
		}

		try
		{
			const parsed = JSON.parse(this.#storage.getItem(this.#storageKey) ?? 'null');
			if (!Array.isArray(parsed?.entries))
			{
				return new Map();
			}

			const entries = new Map();
			for (const entry of parsed.entries)
			{
				const id = Number(entry?.id);
				const normalizedEntry = this.#normalizeEntry(entry, Number(entry?.savedAt));
				if (Number.isInteger(id) && id > 0 && normalizedEntry !== null)
				{
					entries.delete(id);
					entries.set(id, normalizedEntry);
				}
			}
			while (entries.size > this.#limit)
			{
				entries.delete(entries.keys().next().value);
			}

			return entries;
		}
		catch
		{
			return new Map();
		}
	}

	#normalizeEntry(entry: mixed, savedAt: number): ?Object
	{
		const rawLabel = typeof entry === 'string' ? entry : entry?.label;
		const label = typeof rawLabel === 'string' && rawLabel.trim() !== '' ? rawLabel : null;
		const available = typeof entry === 'object' && entry?.available === true;
		const age = this.#now() - savedAt;
		if (
			(!label && available)
			|| !Number.isFinite(savedAt)
			|| age < 0
			|| age > CACHE_TTL_MS
		)
		{
			return null;
		}

		return Object.freeze({
			label,
			available,
			savedAt,
		});
	}

	#removeForeignUserEntries(): void
	{
		if (!this.#storage || !this.#storageKey)
		{
			return;
		}

		try
		{
			const keys = [];
			for (let index = 0; index < this.#storage.length; index += 1)
			{
				const key = this.#storage.key(index);
				if (
					typeof key === 'string'
					&& (
						key.startsWith(`${STORAGE_KEY_PREFIX}:`)
						|| key.startsWith(`${LEGACY_STORAGE_KEY_PREFIX}:`)
					)
					&& key !== this.#storageKey
				)
				{
					keys.push(key);
				}
			}

			for (const key of keys)
			{
				this.#storage.removeItem(key);
			}
		}
		catch
		{
		}
	}
}
