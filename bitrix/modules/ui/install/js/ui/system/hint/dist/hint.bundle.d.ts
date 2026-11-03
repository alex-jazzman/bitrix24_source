/* eslint-disable */
type HintOptions = {
	size?: BX.UI.System.Hint.HintSize;
	filled?: boolean;
	tooltipOptions?: HintTooltipOptions | null;
	onClick?: () => void;
	ariaLabel?: string;
	events?: {
		[eventName: string]: (event: BX.Event.BaseEvent) => void;
	};
};

type HintSize = typeof BX.UI.System.Hint.HintSize[keyof typeof BX.UI.System.Hint.HintSize];

type HintTooltipOptions = {
	content: string | HTMLElement;
	html?: boolean;
	maxWidth?: number;
	position?: BX.UI.System.Tooltip.TooltipPosition;
	trigger?: BX.UI.System.Hint.HintTrigger;
	showDelay?: number;
	hideDelay?: number;
};

type HintTrigger = typeof BX.UI.System.Hint.HintTrigger[keyof typeof BX.UI.System.Hint.HintTrigger];

declare namespace BX.UI.System.Hint {
	class Hint extends BX.Event.EventEmitter {
		constructor(options?: HintOptions);
		render(): HTMLElement;
		getContainer(): HTMLElement;
		destroy(): void;
	}

	const HintSize: Readonly<{
		Md: "md";
		Lg: "lg";
		Xl: "xl";
	}>;

	const HintTrigger: Readonly<{
		Hover: "hover";
		Click: "click";
	}>;

	const DEFAULT_SIZE: HintSize;
}
