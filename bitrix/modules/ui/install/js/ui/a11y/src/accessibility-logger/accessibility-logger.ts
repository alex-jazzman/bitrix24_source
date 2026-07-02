import { Type } from 'main.core';

const STORAGE_KEY = 'bx:a11y:debug';
const ALL = '*';

const CATEGORY_LABELS: { [key: string]: string } = {
	'focus-monitor': 'FocusMonitor',
	'focus-trap': 'FocusTrap',
	'focus-zone': 'FocusZone',
	'input-modality': 'InputModality',
	'live-announcer': 'LiveAnnouncer',
};

export type LogCategory = 'focus-monitor' | 'focus-trap' | 'focus-zone' | 'input-modality' | 'live-announcer';

export class AccessibilityLogger
{
	static #categories: Set<string> = new Set();
	static #all: boolean = false;
	static #initialized: boolean = false;

	static #init(): void
	{
		if (this.#initialized)
		{
			return;
		}

		this.#initialized = true;

		try
		{
			const raw = localStorage.getItem(STORAGE_KEY);
			if (raw === ALL)
			{
				this.#all = true;
			}
			else if (raw)
			{
				const parsed = JSON.parse(raw);
				if (Array.isArray(parsed))
				{
					for (const category of parsed)
					{
						this.#categories.add(category);
					}
				}
			}
		}
		catch
		{
			// localStorage unavailable or corrupted
		}
	}

	static enable(category?: LogCategory): void
	{
		this.#init();

		if (category)
		{
			this.#categories.add(category);
		}
		else
		{
			this.#all = true;
		}

		this.#save();
	}

	static disable(category?: LogCategory): void
	{
		this.#init();

		if (category)
		{
			this.#categories.delete(category);
		}
		else
		{
			this.#all = false;
			this.#categories.clear();
		}

		this.#save();
	}

	static isEnabled(category: LogCategory): boolean
	{
		this.#init();

		return this.#all || this.#categories.has(category);
	}

	static log(category: LogCategory, message: string, ...args: any[]): void
	{
		if (!this.isEnabled(category))
		{
			return;
		}

		const label = CATEGORY_LABELS[category] || category;

		// eslint-disable-next-line no-console
		console.log(
			`%c[${label}]%c ${message}`,
			'color: #0075ff; font-weight: bold;',
			'color: inherit; font-weight: normal;',
			...args,
		);
	}

	static logNode(category: LogCategory, message: string, node: HTMLElement): void
	{
		if (!this.isEnabled(category) || !Type.isElementNode(node))
		{
			return;
		}

		const tag = node.tagName.toLowerCase();
		const classes = node.className ? `.${[...node.classList].join('.')}` : '';
		const id = node.id ? `#${node.id}` : '';
		const selector = `${tag}${classes}${id}`;

		const role = node.getAttribute('role');
		const labelledBy = node.getAttribute('aria-labelledby');
		const labelledByText = labelledBy
			? labelledBy
				.split(/\s+/)
				.map((labelId) => document.getElementById(labelId)?.textContent?.trim())
				.filter(Boolean)
				.join(' ')
			: ''
		;

		const ariaLabel = (
			node.getAttribute('aria-label')
			|| labelledByText
			|| node.textContent.trim().slice(0, 30)
			|| '—'
		).replaceAll(/\s+/g, ' ');

		const attrs = [
			role && `role="${role}"`,
			node.getAttribute('aria-expanded') !== null && `aria-expanded="${node.getAttribute('aria-expanded')}"`,
			node.getAttribute('href') && `href="${node.getAttribute('href')}"`,
			node.getAttribute('tabindex') && `tabindex="${node.getAttribute('tabindex')}"`,
		].filter(Boolean).join(' ');

		const label = CATEGORY_LABELS[category] || category;
		const parts = [
			`%c[${label}]%c ${message}`,
			`%c${selector}%c`,
			`"%c${ariaLabel}%c"`,
			attrs && `%c${attrs}%c`,
		].filter(Boolean).join(' ');

		// eslint-disable-next-line no-console
		console.log(
			parts,
			'color: #0075ff; font-weight: bold;', // label
			'color: inherit; font-weight: normal;', // reset
			'color: #0075ff; font-weight: bold;', // selector
			'color: inherit; font-weight: normal;', // reset
			'color: #e36209; font-style: italic;', // aria-label
			'color: inherit; font-style: normal;', // reset
			...(attrs ? [
				'color: #9b59b6;', // attrs
				'color: inherit;', // reset
			] : []),
		);
	}

	static warn(category: LogCategory, message: string, ...args: unknown[]): void
	{
		if (!this.isEnabled(category))
		{
			return;
		}

		const label = CATEGORY_LABELS[category] || category;

		// eslint-disable-next-line no-console
		console.warn(`[${label}] ${message}`, ...args);
	}

	static #save(): void
	{
		try
		{
			if (this.#all)
			{
				localStorage.setItem(STORAGE_KEY, ALL);
			}
			else if (this.#categories.size > 0)
			{
				localStorage.setItem(STORAGE_KEY, JSON.stringify([...this.#categories]));
			}
			else
			{
				localStorage.removeItem(STORAGE_KEY);
			}
		}
		catch
		{
			// localStorage unavailable
		}
	}
}
