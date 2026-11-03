import { type CleanupAction, type Screen } from '../../../application/screen';

export class LegacyViewRegistry
{
	#screen: Screen;
	#entries = new Map<string, CleanupAction>();

	constructor(screen: Screen)
	{
		this.#screen = screen;
	}

	register(id: number | string, cleanupActions: readonly CleanupAction[]): void
	{
		this.release(id);
		if (!this.#screen.isAlive())
		{
			this.#runCleanupActions(cleanupActions);

			return;
		}

		const key = String(id);
		let release: CleanupAction = () => {};
		release = this.#screen.registerCleanup(() => {
			if (this.#entries.get(key) === release)
			{
				this.#entries.delete(key);
			}
			this.#runCleanupActions(cleanupActions);
		});
		this.#entries.set(key, release);
	}

	release(id: number | string): void
	{
		this.#entries.get(String(id))?.();
	}

	destroy(): void
	{
		this.#runCleanupActions([...this.#entries.values()].reverse());
	}

	#runCleanupActions(cleanupActions: readonly CleanupAction[]): void
	{
		let cleanupError: unknown = null;
		cleanupActions.forEach((cleanup) => {
			try
			{
				cleanup();
			}
			catch (error)
			{
				cleanupError ??= error;
			}
		});

		if (cleanupError)
		{
			throw cleanupError;
		}
	}
}
