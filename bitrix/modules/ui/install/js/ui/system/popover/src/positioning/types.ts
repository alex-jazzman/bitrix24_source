import { type autoUpdate, type computePosition, type flip, type offset } from 'ui.floating-ui';

import {
	type PopoverAlignment,
	type PopoverPosition,
	type PopoverStrategy,
	type PopoverStretch,
	type PopoverTracking,
} from '../const';
import {
	type PopoverBoundary,
	type PopoverFlipTactic,
	type PopoverPointerAlignment,
	type PopoverWhenAnchorHidden,
} from '../types';

// Bridge to the vendor types. The ui.floating-ui runtime entry is .js, so under allowJs TS takes types from
// it and not from the neighbouring floating-ui.d.ts: named type exports are invisible there, while the
// values keep their @floating-ui/dom types. Hence everything below is derived through typeof.
type OffsetDerivable = Extract<Parameters<typeof offset>[0], (state: never) => unknown>;
type FlipOptions = Exclude<Parameters<typeof flip>[0], ((state: never) => unknown) | undefined>;
type ComputePositionReturn = Awaited<ReturnType<typeof computePosition>>;

export type Middleware = ReturnType<typeof offset>;
export type MiddlewareState = Parameters<OffsetDerivable>[0];
export type MiddlewareData = ComputePositionReturn['middlewareData'];
export type Placement = ComputePositionReturn['placement'];
export type Strategy = ComputePositionReturn['strategy'];
export type Rect = MiddlewareState['rects']['floating'];
export type Coords = { x: number; y: number };
export type Reference = Parameters<typeof computePosition>[0];
export type VirtualElement = Exclude<Reference, Element>;
export type DetectOverflowOptions = Pick<FlipOptions, 'boundary' | 'rootBoundary' | 'padding'>;
// The optional options argument of autoUpdate: undefined belongs to the type, and it is the value the
// default tracking mode passes, leaving the vendor watch set untouched.
export type TrackingOptions = Parameters<typeof autoUpdate>[3];
export type { ComputePositionReturn };

export type Direction = 'ltr' | 'rtl';

// Anchor mode goes through computePosition, area mode writes CSS directly.
export type PositioningMode = 'anchor' | 'area';

// 'x' for the top/bottom positions, 'y' for left/right.
export type CrossAxis = 'x' | 'y';

// Both sets are resolved upfront; which one applies is decided per cycle by the final side.
export type AxisFlipPair<T> = { base: T; onAxisFlip: T };

export type NormalizedOffsetValue = { main: number; cross: number };

export type NormalizedOffset = AxisFlipPair<NormalizedOffsetValue>;

export type NormalizedPointerAim = {
	alignment: PopoverPointerAlignment;
	pointsTo: PopoverPointerAlignment;
};

export type NormalizedPointer = AxisFlipPair<NormalizedPointerAim>;

export type NormalizedFlip = { fallbacks: PopoverFlipTactic[] };

// Positioning options with the defaults applied; position: null means the area centre.
export type NormalizedPositioning = {
	mode: PositioningMode;
	position: PopoverPosition | null;
	alignment: PopoverAlignment;
	offset: NormalizedOffset;
	flip: NormalizedFlip | null;
	slide: boolean;
	stretch: PopoverStretch;
	constrainSize: boolean;
	pointer: NormalizedPointer | null;
	boundary: PopoverBoundary;
	boundaryPadding: number;
	whenAnchorHidden: PopoverWhenAnchorHidden;
	strategy: PopoverStrategy;
	tracking: PopoverTracking;
};

export type ArrowGeometry = { hidden: true } | { hidden: false; centerPadding: number };

// A CSSStyleDeclaration satisfies this shape; tests pass a plain object, since the mapper never reads DOM.
export type ArrowStyle = {
	borderTopLeftRadius: string;
	borderTopRightRadius: string;
	borderBottomRightRadius: string;
	borderBottomLeftRadius: string;
};

// One corner radius component after parsing: a length in pixels, a share of the side it is measured against,
// or nothing at all - calc() and its kin stay unresolved in a computed style and are out of contract.
export type ArrowRadiusComponent = { px: number } | { share: number } | null;

// The four corners of the bubble, parsed out of its computed style. Both axes of every corner are kept: a
// flip may put the arrow onto the other axis in the middle of a cycle. A share stays a share and is resolved
// against the side that comes with the ask - the same corners answer differently for the floating rect and
// for the bubble inside it, so the parse cannot resolve them upfront.
export type ArrowRadii = { x: ArrowRadiusComponent[]; y: ArrowRadiusComponent[] };

export type SizeApplyArgs = MiddlewareState & {
	availableWidth: number;
	availableHeight: number;
};

// The mark of a message already given. The warnings of the mapper belong to the contract and stay, but the
// mapper is re-entered on every tick of a cycle, and the same message per scroll frame is noise rather than
// a contract. The mark is owned by the caller: a popover hands one of its own in and hears the warning once
// for its whole life, the way the flags of the controller do it; a call made without one - a single
// normalisation outside any cycle - warns exactly as before.
export type WarnOnce = {
	// Whether the message has been given already: a caller with work to do before it can stop right here.
	said: () => boolean;
	// Takes the message: true for the first asker only, and the mark stays taken afterwards.
	say: () => boolean;
};

// DOM-bound closures supplied by the controller: the mapper itself neither reads nor mutates the DOM.
export type MappingHooks = {
	direction: Direction;
	referenceHasContext: boolean;
	// The axis comes from the placement of the current cycle, not from the requested position: a flip-axis
	// fallback moves the arrow onto the perpendicular axis.
	resolveGeometry: (floating: Rect, axis: CrossAxis) => ArrowGeometry;
	applySize: (args: SizeApplyArgs) => void;
};

export type MappedConfig = {
	placement: Placement | undefined;
	strategy: Strategy;
	middleware: Middleware[];
};

// The offset middleware of a cycle. Fixed outright while the options decide its result on their own, and
// derivable while the geometry of the arrow has a say in the cross axis: that geometry is read off the DOM,
// so the derivable form is put together by the tick that can read it.
export type OffsetPlan =
	| { derivable: false; middleware: Middleware }
	| { derivable: true; create: (resolveGeometry: MappingHooks['resolveGeometry']) => Middleware };

// Everything about a computation that the options alone decide. Built once for a cycle - within one the
// options cannot change, a change of them relaunches - and read by every tick of it. Left out are the two
// middleware bound to the tick itself: size() carries the apply callback of the tick, and a derivable
// offset() its geometry reader.
export type PositioningPlan = {
	placement: Placement | undefined;
	strategy: Strategy;
	offset: OffsetPlan;
	flip: Middleware | null;
	shift: Middleware | null;
	// The overflow options size() is to be built with, or null when the options ask for no size middleware.
	size: DetectOverflowOptions | null;
	hide: Middleware | null;
};

// Inline style plan of the area mode; null resets the property.
export type AreaCssPlan = {
	left: string | null;
	top: string | null;
	right: string | null;
	bottom: string | null;
	transform: string | null;
	maxWidth: string | null;
	maxHeight: string | null;
};

// How the area coordinates are written: 'declarative' - viewport percentages plus calc (fixed against the
// viewport, scale 1); 'pixel' - converted into the offset parent system through origin/scale.
export type AreaTranslation =
	| { mode: 'declarative' }
	| { mode: 'pixel'; origin: Coords; scale: Coords };

export type AreaParams = {
	// Viewport rect of the area BEFORE the boundaryPadding shrink, which happens inside.
	area: Rect;
	padding: number;
	position: PopoverPosition | null;
	alignment: PopoverAlignment;
	// The base set: the area mode never changes the axis, so there is nothing to override there.
	offset: NormalizedOffsetValue;
	constrainSize: boolean;
	direction: Direction;
	translation: AreaTranslation;
};
