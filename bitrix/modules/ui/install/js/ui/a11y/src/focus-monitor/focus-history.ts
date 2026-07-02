import { InteractivityChecker } from '../interactivity-checker/interactivity-checker';
import { AccessibilityLogger } from '../accessibility-logger/accessibility-logger';

export class FocusHistory
{
	readonly #limit: number;
	#stack: WeakRef<HTMLElement>[] = [];

	constructor(limit: number = 25)
	{
		this.#limit = limit;
	}

	record(el: HTMLElement)
	{
		if (!InteractivityChecker.isFocusable(el))
		{
			return;
		}

		// Check last item
		if (this.#stack[this.#stack.length - 1]?.deref() === el)
		{
			return;
		}

		for (let i = this.#stack.length - 1; i >= 0; i--)
		{
			const current = this.#stack[i].deref();
			if (!current)
			{
				this.#stack.splice(i, 1);
				continue;
			}

			if (current === el)
			{
				this.#stack.splice(i, 1);
				break;
			}
		}

		AccessibilityLogger.logNode('focus-monitor', 'recorded', el);

		this.#stack.push(new WeakRef(el));
		this.#trimByWindow(el.ownerDocument);
	}

	getLastValid(): HTMLElement | null
	{
		for (let i = this.#stack.length - 1; i >= 0; i--)
		{
			const el = this.#stack[i].deref();
			if (!el)
			{
				this.#stack.splice(i, 1);
				continue;
			}

			if (InteractivityChecker.isFocusable(el))
			{
				// remove all entries after this one
				this.#stack.length = i + 1;

				return el;
			}

			this.#stack.splice(i, 1);
		}

		return null;
	}

	#trimByWindow(doc: Document): void
	{
		const docIndexes: number[] = [];
		for (let i = this.#stack.length - 1; i >= 0; i--)
		{
			const current = this.#stack[i].deref();
			if (!current)
			{
				this.#stack.splice(i, 1);
				continue;
			}

			if (current.ownerDocument === doc)
			{
				docIndexes.push(i);
			}
		}

		const excess = docIndexes.length - this.#limit;
		if (excess <= 0)
		{
			return;
		}

		// docIndexes sorted descending (largest stack index first). The last `excess`
		// entries are the oldest items. Iterate from larger stack indexes to smaller
		// ones so each splice does not shift the remaining target indexes.
		for (let j = docIndexes.length - excess; j < docIndexes.length; j++)
		{
			this.#stack.splice(docIndexes[j], 1);
		}
	}
}
