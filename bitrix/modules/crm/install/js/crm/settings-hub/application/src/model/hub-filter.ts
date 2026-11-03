import { type Capability, type SettingId } from './types';

export type HubFilterSetting = Readonly<{
	id: SettingId,
	searchText: readonly string[],
	parentId?: SettingId,
}>;

export type HubFilterState = Readonly<{
	query: string,
	capability: Capability | null,
}>;

type HubFilterChangeHandler = (state: HubFilterState) => void;

const emptyChangeHandler: HubFilterChangeHandler = () => {};

export class HubFilter
{
	#query: string = '';
	#capability: Capability | null = null;
	#onChange: HubFilterChangeHandler;

	constructor(onChange: HubFilterChangeHandler = emptyChangeHandler)
	{
		this.#onChange = onChange;
	}

	get query(): string
	{
		return this.#query;
	}

	get capability(): Capability | null
	{
		return this.#capability;
	}

	setQuery(value: string): void
	{
		const query = value.trim();
		if (query === this.#query)
		{
			return;
		}

		this.#query = query;
		this.#notify();
	}

	setCapability(capability: Capability): void
	{
		if (capability.id.trim() === '')
		{
			return;
		}

		if (this.#capability === capability && this.#query === '')
		{
			return;
		}

		this.#capability = capability;
		this.#query = '';
		this.#notify();
	}

	reset(): void
	{
		if (this.#query === '')
		{
			return;
		}

		this.#query = '';
		this.#notify();
	}

	clearCapability(): void
	{
		if (this.#capability === null)
		{
			return;
		}

		this.#capability = null;
		this.#notify();
	}

	matchesCapability(capability: Capability): boolean
	{
		return this.#matchesText([capability.title, capability.task]);
	}

	matchesSetting(setting: HubFilterSetting): boolean
	{
		return this.#matchesText(setting.searchText);
	}

	filterBlock(title: string, settings: readonly HubFilterSetting[]): readonly HubFilterSetting[]
	{
		const blockMatchesQuery = this.#query !== '' && this.#matchesText([title]);
		const matchingIds = new Set<SettingId>();
		settings.forEach((setting) => {
			const matches = blockMatchesQuery || this.matchesSetting(setting);
			if (!matches)
			{
				return;
			}

			matchingIds.add(setting.id);
			if (setting.parentId !== undefined)
			{
				matchingIds.add(setting.parentId);
			}
		});

		return settings.filter((setting) => matchingIds.has(setting.id));
	}

	#matchesText(values: readonly string[]): boolean
	{
		const query = this.#query.toLowerCase();

		return values.some((value) => value.toLowerCase().includes(query));
	}

	#notify(): void
	{
		this.#onChange({ query: this.#query, capability: this.#capability });
	}
}
