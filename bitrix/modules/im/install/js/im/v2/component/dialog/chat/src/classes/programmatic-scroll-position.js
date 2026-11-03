// a position further than this from the one we wrote ourselves was set by someone else
const EXTERNAL_SCROLL_TOLERANCE = 1;

// handed to Animation in place of the element, so every animated write goes through here
export class ProgrammaticScrollPosition
{
	#container: HTMLElement;
	#lastWritten: number | null = null;

	constructor(container: HTMLElement)
	{
		this.#container = container;
	}

	// the browser clamps the write, so the value is read back rather than remembered as asked for
	set scrollTop(value: number)
	{
		this.#container.scrollTop = value;
		this.#lastWritten = this.#container.scrollTop;
	}

	get scrollTop(): number
	{
		return this.#container.scrollTop;
	}

	forget(): void
	{
		this.#lastWritten = null;
	}

	wasMovedByOthers(): boolean
	{
		if (this.#lastWritten === null)
		{
			return false;
		}

		return Math.abs(this.#container.scrollTop - this.#lastWritten) > EXTERNAL_SCROLL_TOLERANCE;
	}
}
