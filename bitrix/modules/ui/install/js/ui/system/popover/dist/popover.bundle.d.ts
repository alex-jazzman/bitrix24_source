/* eslint-disable */
type PopoverOptions = {
	content: PopoverContent;
	target?: PopoverTarget;
	positioning?: PopoverPositioning;
	className?: PopoverClassName;
	designContext?: BX.UI.System.Popover.PopoverDesignContext;
	container?: HTMLElement;
	closeByClickOutside?: boolean;
	closeByEsc?: boolean;
	events?: {
		[eventName: string]: (event: BX.Event.BaseEvent) => void;
	};
};

type PopoverContent = string | HTMLElement | (() => HTMLElement);

type PopoverTarget = Element | PopoverPointTarget | PopoverRectTarget | null;

type PopoverPointTarget = {
	x: number;
	y: number;
};

type PopoverRectTarget = {
	getBoundingClientRect: () => PopoverRect;
	contextElement?: Element;
};

type PopoverRect = {
	top: number;
	right: number;
	bottom: number;
	left: number;
	width: number;
	height: number;
};

type PopoverPositioning = {
	position?: BX.UI.System.Popover.PopoverPosition | null;
	alignment?: BX.UI.System.Popover.PopoverAlignment;
	offset?: PopoverOffset;
	flip?: boolean | PopoverFlipOptions;
	slide?: boolean;
	stretch?: BX.UI.System.Popover.PopoverStretch;
	constrainSize?: boolean;
	pointer?: boolean | PopoverPointerOptions;
	onAxisFlip?: PopoverAxisFlipOverrides;
	boundary?: PopoverBoundary;
	boundaryPadding?: number;
	whenAnchorHidden?: PopoverWhenAnchorHidden;
	strategy?: BX.UI.System.Popover.PopoverStrategy;
	tracking?: BX.UI.System.Popover.PopoverTracking;
};

type PopoverPosition = typeof BX.UI.System.Popover.PopoverPosition[keyof typeof BX.UI.System.Popover.PopoverPosition];

type PopoverAlignment = typeof BX.UI.System.Popover.PopoverAlignment[keyof typeof BX.UI.System.Popover.PopoverAlignment];

type PopoverOffset = number | PopoverOffsetValue;

type PopoverOffsetValue = {
	main?: number;
	cross?: number;
};

type PopoverFlipOptions = {
	fallbacks?: PopoverFlipTactic[];
};

type PopoverFlipTactic = 'flip-position' | 'flip-axis';

type PopoverStretch = typeof BX.UI.System.Popover.PopoverStretch[keyof typeof BX.UI.System.Popover.PopoverStretch];

type PopoverPointerOptions = {
	alignment?: PopoverPointerAlignment;
	pointsTo?: PopoverPointerAlignment;
};

type PopoverPointerAlignment = 'auto' | BX.UI.System.Popover.PopoverAlignment;

type PopoverAxisFlipOverrides = {
	offset?: PopoverOffsetValue;
	pointer?: PopoverPointerOptions;
};

type PopoverBoundary = HTMLElement | 'viewport' | 'clipping-ancestors';

type PopoverWhenAnchorHidden = 'hide' | 'close';

type PopoverStrategy = typeof BX.UI.System.Popover.PopoverStrategy[keyof typeof BX.UI.System.Popover.PopoverStrategy];

type PopoverTracking = typeof BX.UI.System.Popover.PopoverTracking[keyof typeof BX.UI.System.Popover.PopoverTracking];

type PopoverClassName = string | string[] | {
	[cls: string]: boolean;
};

type PopoverDesignContext = typeof BX.UI.System.Popover.PopoverDesignContext[keyof typeof BX.UI.System.Popover.PopoverDesignContext];

type PopoverState = {
	shown: boolean;
	positioned: boolean;
	position: BX.UI.System.Popover.PopoverPosition | null;
	alignment: BX.UI.System.Popover.PopoverAlignment;
	flipped: boolean;
	slide: {
		x: number;
		y: number;
	};
	anchorHidden: boolean;
	pointerHidden: boolean;
	constrained: {
		maxWidth: number;
		maxHeight: number;
	} | null;
	rect: PopoverRect | null;
};

type PopoverStateChangePayload = {
	state: PopoverState;
	changed: Array<keyof PopoverState>;
};

declare namespace BX.UI.System.Popover {
	class Popover extends BX.Event.EventEmitter {
		constructor(options: PopoverOptions);
		show(): void;
		hide(): void;
		destroy(): void;
		isShown(): boolean;
		setTarget(target: PopoverTarget): void;
		setPositioning(positioning: PopoverPositioning): void;
		setClassName(className: PopoverClassName): void;
		setDesignContext(designContext: PopoverDesignContext | null): void;
		setCloseByClickOutside(value: boolean): void;
		setCloseByEsc(value: boolean): void;
		adjustPosition(): void;
		getState(): PopoverState;
	}

	const PopoverPosition: Readonly<{
		Top: "top";
		Right: "right";
		Bottom: "bottom";
		Left: "left";
	}>;

	const PopoverAlignment: Readonly<{
		Start: "start";
		Center: "center";
		End: "end";
	}>;

	const PopoverStretch: Readonly<{
		None: "none";
		Width: "width";
		MinWidth: "min-width";
		Height: "height";
	}>;

	const PopoverStrategy: Readonly<{
		Absolute: "absolute";
		Fixed: "fixed";
	}>;

	const PopoverTracking: Readonly<{
		Observers: "observers";
		AnimationFrame: "animation-frame";
	}>;

	const PopoverDesignContext: Readonly<{
		ContentLight: "content-light";
		ContentDark: "content-dark";
		EdgeLight: "edge-light";
		EdgeDark: "edge-dark";
	}>;

	const POINTER_DEPTH: number;

	const POINTER_PROTRUSION: number;

	const POINTER_WIDTH: number;
}
