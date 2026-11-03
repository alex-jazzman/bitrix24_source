import { type Screen } from './screen';

type FacadeEntry = {
	screen: Screen,
	generation: number,
};

export class ScreenFacade
{
	#entry: FacadeEntry | null = null;

	attach(screen: Screen, generation: number): void
	{
		const previousScreen = this.current();
		this.#entry = { screen, generation };

		if (previousScreen && previousScreen !== screen)
		{
			previousScreen.destroy();
		}
	}

	detachIfCurrent(screen: Screen): void
	{
		if (this.#entry?.screen === screen)
		{
			this.#entry = null;
		}
	}

	current(): Screen | null
	{
		const entry = this.#entry;
		if (
			!entry
			|| !entry.screen.isAlive()
			|| entry.screen.getGeneration() !== entry.generation
		)
		{
			this.#entry = null;

			return null;
		}

		return entry.screen;
	}

	getView(messageId?: number | string): Screen | undefined
	{
		const screen = this.current();
		if (!screen || (messageId !== undefined && String(screen.id) !== String(messageId)))
		{
			return undefined;
		}

		return screen;
	}
}

export const messageViewFacade = new ScreenFacade();
