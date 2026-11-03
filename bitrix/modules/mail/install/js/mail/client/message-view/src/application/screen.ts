import { messageViewFacade, ScreenFacade } from './screen-facade';

export { messageViewFacade, ScreenFacade };

export type CleanupAction = () => void;

export type AsyncCompletionGuard = (
	capturedGeneration: number,
	completion: () => void,
) => boolean;

export type ScreenApplication = {
	start(): void,
	destroy(): void,
};

export type ScreenOptions = {
	messageId: number,
	mailboxId: number,
	application: ScreenApplication,
	facade?: ScreenFacade,
};

type CleanupEntry = {
	run: CleanupAction,
};

let lastGeneration = 0;

function nextGeneration(): number
{
	lastGeneration += 1;

	return lastGeneration;
}

function createCleanupEntry(action: CleanupAction): CleanupEntry
{
	let cleanup: CleanupAction | null = action;

	return {
		run: () => {
			if (!cleanup)
			{
				return;
			}

			const currentCleanup = cleanup;
			cleanup = null;
			currentCleanup();
		},
	};
}

export class Screen
{
	readonly id: number;
	readonly mailboxId: number;

	#application: ScreenApplication;
	#facade: ScreenFacade;
	#cleanupStack: CleanupEntry[] = [];
	#generation = 0;
	#alive = false;
	#started = false;
	#destroyed = false;
	#pageSwapper: object | null = null;
	#slider: object | null = null;

	constructor(options: ScreenOptions)
	{
		this.id = options.messageId;
		this.mailboxId = options.mailboxId;
		this.#application = options.application;
		this.#facade = options.facade ?? messageViewFacade;
	}

	get pageSwapper(): object | null
	{
		return this.#pageSwapper;
	}

	get slider(): object | null
	{
		return this.#slider;
	}

	start(): void
	{
		if (this.#started || this.#destroyed)
		{
			return;
		}

		this.#started = true;
		this.#generation = nextGeneration();
		this.#alive = true;

		try
		{
			this.#facade.attach(this, this.#generation);
			this.#application.start();
		}
		catch (error)
		{
			this.destroy();
			throw error;
		}
	}

	destroy(): void
	{
		if (this.#destroyed)
		{
			return;
		}

		this.#destroyed = true;
		this.#alive = false;
		this.#generation = nextGeneration();
		this.#facade.detachIfCurrent(this);

		const cleanupStack = this.#cleanupStack.splice(0).reverse();
		let cleanupError: unknown = null;
		cleanupStack.forEach((entry) => {
			try
			{
				entry.run();
			}
			catch (error)
			{
				cleanupError ??= error;
			}
		});

		try
		{
			this.#application.destroy();
		}
		catch (error)
		{
			cleanupError ??= error;
		}

		this.#pageSwapper = null;
		this.#slider = null;

		if (cleanupError)
		{
			throw cleanupError;
		}
	}

	isAlive(): boolean
	{
		return this.#alive;
	}

	getGeneration(): number
	{
		return this.#generation;
	}

	captureGeneration(): number
	{
		return this.#generation;
	}

	registerCleanup(action: CleanupAction): CleanupAction
	{
		const entry = createCleanupEntry(action);
		if (this.#destroyed)
		{
			entry.run();

			return () => {};
		}

		this.#cleanupStack.push(entry);

		return () => {
			const index = this.#cleanupStack.indexOf(entry);
			if (index >= 0)
			{
				this.#cleanupStack.splice(index, 1);
			}

			entry.run();
		};
	}

	guardCompletion: AsyncCompletionGuard = (capturedGeneration, completion) => {
		if (
			!this.#alive
			|| capturedGeneration !== this.#generation
			|| this.#facade.current() !== this
		)
		{
			return false;
		}

		completion();

		return true;
	};

	setPageSwapper(pageSwapper: object | null): void
	{
		this.#pageSwapper = pageSwapper;
	}

	setSlider(slider: object | null): void
	{
		this.#slider = slider;
	}
}
