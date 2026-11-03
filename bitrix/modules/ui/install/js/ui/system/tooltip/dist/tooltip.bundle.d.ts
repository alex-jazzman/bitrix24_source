/* eslint-disable */
type TooltipOptions = {
	target: Element;
	content: string | HTMLElement;
	html?: boolean;
	maxWidth?: number;
	position?: BX.UI.System.Tooltip.TooltipPosition;
	offset?: number;
	crossOffset?: number;
	trigger?: BX.UI.System.Tooltip.TooltipTrigger | BX.UI.System.Tooltip.TooltipTrigger[];
	showDelay?: number;
	hideDelay?: number;
	events?: {
		[eventName: string]: (event: BX.Event.BaseEvent) => void;
	};
};

type TooltipPosition = typeof BX.UI.System.Tooltip.TooltipPosition[keyof typeof BX.UI.System.Tooltip.TooltipPosition];

type TooltipTrigger = typeof BX.UI.System.Tooltip.TooltipTrigger[keyof typeof BX.UI.System.Tooltip.TooltipTrigger];

type PartialOptions = Partial<Omit<TooltipOptions, 'events'>>;

type TooltipMarkupSurface = Record<never, never>;

declare namespace BX.UI.System.Tooltip {
	class Tooltip extends BX.Event.EventEmitter {
		constructor(options: TooltipOptions);
		show(): void;
		hide(): void;
		isShown(): boolean;
		destroy(): void;
		getBubble(): HTMLElement | null;
		adjustPosition(): void;
		setOptions(options: PartialOptions): void;
	}

	const TooltipPosition: Readonly<{
		Top: "top";
		Right: "right";
		Bottom: "bottom";
		Left: "left";
	}>;

	const TooltipTrigger: Readonly<{
		Hover: "hover";
		Click: "click";
		Focus: "focus";
		Manual: "manual";
	}>;

	const TooltipManager: TooltipMarkupSurface;

	const DEFAULT_MAX_WIDTH: number;
}
