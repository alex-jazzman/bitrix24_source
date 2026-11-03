type HideableTooltip = {
	hideImmediately: () => void,
};

export type StageDescriptionTooltipSuspension = {
	release: () => void,
};

export class ActiveTooltipRegistry
{
	#activeTooltip: HideableTooltip | null = null;

	#suspensionTokens = new Set<symbol>();

	activate(tooltip: HideableTooltip): boolean
	{
		if (this.#suspensionTokens.size > 0)
		{
			return false;
		}

		if (this.#activeTooltip === tooltip)
		{
			return true;
		}

		const previousTooltip = this.#activeTooltip;
		this.#activeTooltip = tooltip;
		previousTooltip?.hideImmediately();

		return true;
	}

	deactivate(tooltip: HideableTooltip): void
	{
		if (this.#activeTooltip === tooltip)
		{
			this.#activeTooltip = null;
		}
	}

	suspend(): StageDescriptionTooltipSuspension
	{
		const token = Symbol('stage-description-tooltip-suspension');
		this.#suspensionTokens.add(token);

		const activeTooltip = this.#activeTooltip;
		this.#activeTooltip = null;
		activeTooltip?.hideImmediately();

		return {
			release: () => {
				this.#suspensionTokens.delete(token);
			},
		};
	}
}

export const activeTooltipRegistry = new ActiveTooltipRegistry();
