export class ProtectedImage
{
	#loads = new Map<string, Promise<string | null>>();
	#decoded = new Map<string, string>();
	#pending = new Map<string, Promise<string | null>>();
	#controllers = new Set<AbortController>();
	#blobUrls = new Set<string>();
	#generation = 0;

	load(url: string, cacheIdentity?: string): Promise<string | null>
	{
		let address: URL | null = null;
		try
		{
			address = new URL(url, window.location.href);
		}
		catch
		{
			return Promise.resolve(null);
		}

		if (address.origin !== window.location.origin || !['http:', 'https:'].includes(address.protocol))
		{
			return Promise.resolve(null);
		}

		if (cacheIdentity && this.#decoded.has(cacheIdentity))
		{
			return Promise.resolve(this.#decoded.get(cacheIdentity) ?? null);
		}

		const existing = this.#loads.get(url);
		if (existing)
		{
			return existing;
		}

		const generation = this.#generation;
		const previous = cacheIdentity ? this.#pending.get(cacheIdentity) : undefined;
		const load = (async (): Promise<string | null> => {
			if (previous)
			{
				await previous;
			}

			if (generation !== this.#generation)
			{
				return null;
			}

			if (cacheIdentity && this.#decoded.has(cacheIdentity))
			{
				return this.#decoded.get(cacheIdentity) ?? null;
			}

			const blobUrl = await this.#loadUrl(address.href, generation);
			if (blobUrl && cacheIdentity)
			{
				this.#decoded.set(cacheIdentity, blobUrl);
			}

			return blobUrl;
		})();
		this.#loads.set(url, load);
		if (cacheIdentity)
		{
			this.#pending.set(cacheIdentity, load);
			void load.then(() => {
				if (this.#pending.get(cacheIdentity) === load)
				{
					this.#pending.delete(cacheIdentity);
				}
			});
		}

		return load;
	}

	async #loadUrl(url: string, generation: number): Promise<string | null>
	{
		const controller = new AbortController();
		this.#controllers.add(controller);

		try
		{
			const response = await fetch(url, { credentials: 'same-origin', signal: controller.signal });
			const contentType = response.headers.get('content-type')?.split(';', 1)[0].trim().toLowerCase();
			if (!response.ok || contentType !== 'image/png')
			{
				return null;
			}

			const blob = await response.blob();
			if (controller.signal.aborted || generation !== this.#generation)
			{
				return null;
			}

			const blobUrl = URL.createObjectURL(blob);
			this.#blobUrls.add(blobUrl);
			try
			{
				const image = new Image();
				image.src = blobUrl;
				await image.decode();
			}
			catch
			{
				if (this.#blobUrls.delete(blobUrl))
				{
					URL.revokeObjectURL(blobUrl);
				}

				return null;
			}

			return controller.signal.aborted || generation !== this.#generation ? null : blobUrl;
		}
		catch
		{
			return null;
		}
		finally
		{
			this.#controllers.delete(controller);
		}
	}

	retain(cacheIdentities: ReadonlySet<string>): void
	{
		this.#generation += 1;
		for (const controller of this.#controllers)
		{
			controller.abort();
		}
		this.#controllers.clear();
		const retainedUrls = new Set<string>();
		for (const [identity, blobUrl] of this.#decoded)
		{
			if (cacheIdentities.has(identity))
			{
				retainedUrls.add(blobUrl);
			}
			else
			{
				this.#decoded.delete(identity);
			}
		}

		for (const blobUrl of this.#blobUrls)
		{
			if (!retainedUrls.has(blobUrl))
			{
				URL.revokeObjectURL(blobUrl);
			}
		}
		this.#blobUrls = retainedUrls;
		this.#loads.clear();
		this.#pending.clear();
	}

	clear(): void
	{
		this.retain(new Set());
	}
}

const resources = new WeakMap<object, ProtectedImage>();

export function protectedImageFor(grid: object): ProtectedImage
{
	let resource = resources.get(grid);
	if (!resource)
	{
		resource = new ProtectedImage();
		resources.set(grid, resource);
	}

	return resource;
}
