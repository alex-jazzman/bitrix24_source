import { Type } from 'main.core';

type BooleanSnapshot = {[string]: boolean};

type PendingSave = {
	submitted: BooleanSnapshot,
	disabledCodes: Array<string>,
};

export class ScenarioDisableTracker
{
	#baseline: BooleanSnapshot;
	#pending: ?PendingSave = null;

	constructor(baseline: BooleanSnapshot = {})
	{
		this.#baseline = ScenarioDisableTracker.#normalizeBaseline(baseline);
	}

	prepare(aiData: ?Object = {}): void
	{
		const submitted = { ...this.#baseline };
		const data = Type.isPlainObject(aiData) ? aiData : {};

		Object.keys(this.#baseline).forEach((code) => {
			if (data[code] === 'Y' || data[code] === 'N')
			{
				submitted[code] = data[code] === 'Y';
			}
		});

		const disabledCodes = Object.keys(this.#baseline)
			.filter((code) => this.#baseline[code] && !submitted[code])
			.sort()
		;

		this.#pending = { submitted, disabledCodes };
	}

	commit(): Array<string>
	{
		if (!this.#pending)
		{
			return [];
		}

		const { submitted, disabledCodes } = this.#pending;
		this.#pending = null;
		this.#baseline = submitted;

		return disabledCodes;
	}

	rollback(): void
	{
		this.#pending = null;
	}

	static #normalizeBaseline(baseline: BooleanSnapshot): BooleanSnapshot
	{
		const normalized = {};

		Object.entries(baseline).forEach(([code, value]) => {
			if (Type.isBoolean(value))
			{
				normalized[code] = value;
			}
		});

		return normalized;
	}
}
