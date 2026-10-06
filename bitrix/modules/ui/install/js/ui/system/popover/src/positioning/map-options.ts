import { Type } from 'main.core';

import { flip, hide, limitShift, offset, shift, size } from 'ui.floating-ui';

import {
	POINTER_PROTRUSION,
	POINTER_WIDTH,
	type PopoverAlignment,
	type PopoverPosition,
	type PopoverStrategy,
	type PopoverStretch,
	type PopoverTracking,
} from '../const';
import {
	type PopoverAxisFlipOverrides,
	type PopoverBoundary,
	type PopoverFlipTactic,
	type PopoverOffset,
	type PopoverPointerAlignment,
	type PopoverPointTarget,
	type PopoverPositioning,
	type PopoverRectTarget,
	type PopoverTarget,
	type PopoverWhenAnchorHidden,
} from '../types';
import {
	type AreaCssPlan,
	type AreaParams,
	type ArrowGeometry,
	type ArrowRadii,
	type ArrowRadiusComponent,
	type ArrowStyle,
	type AxisFlipPair,
	type Coords,
	type CrossAxis,
	type DetectOverflowOptions,
	type Direction,
	type MappedConfig,
	type MappingHooks,
	type MiddlewareState,
	type NormalizedFlip,
	type NormalizedOffset,
	type NormalizedOffsetValue,
	type NormalizedPointer,
	type NormalizedPointerAim,
	type NormalizedPositioning,
	type OffsetPlan,
	type Placement,
	type PositioningMode,
	type PositioningPlan,
	type Rect,
	type Reference,
	type TrackingOptions,
	type WarnOnce,
} from './types';

const LABEL = 'BX.UI.System.Popover';

// A mark of its own for every caller that wants one; a mapper call made without one gets a fresh mark and
// warns as it always did.
export const warnOnce = (): WarnOnce => {
	let taken = false;

	return {
		said: (): boolean => taken,
		say: (): boolean => {
			if (taken)
			{
				return false;
			}

			taken = true;

			return true;
		},
	};
};

const DEFAULT_ANCHOR_POSITION: PopoverPosition = 'bottom';
// The gap to the boundary is a decision of the place of use, so the extension imposes none of its own.
const DEFAULT_BOUNDARY_PADDING = 0;

const SIDES: PopoverPosition[] = ['top', 'right', 'bottom', 'left'];
const ALIGNMENTS: PopoverAlignment[] = ['start', 'center', 'end'];
const FLIP_TACTICS: PopoverFlipTactic[] = ['flip-position', 'flip-axis'];
const STRETCHES: PopoverStretch[] = ['none', 'width', 'min-width', 'height'];
const WHEN_ANCHOR_HIDDEN: PopoverWhenAnchorHidden[] = ['hide', 'close'];
const TRACKINGS: PopoverTracking[] = ['observers', 'animation-frame'];

const clamp = (value: number, min: number, max: number): number => Math.min(Math.max(value, min), max);

// The vendor does not expose getSide from its runtime entry, hence the local parsing.
const getSide = (placement: Placement): PopoverPosition => placement.split('-')[0] as PopoverPosition;

const crossAxisOf = (position: PopoverPosition | null): CrossAxis => {
	return position === 'left' || position === 'right' ? 'y' : 'x';
};

const isSide = (value: unknown): value is PopoverPosition => (SIDES as unknown[]).includes(value);

const ZERO_OFFSET: NormalizedOffsetValue = { main: 0, cross: 0 };

// An unset or non-numeric field is inherited from the fallback set.
const normalizeOffsetValue = (raw: unknown, fallback: NormalizedOffsetValue): NormalizedOffsetValue => {
	if (!Type.isPlainObject(raw))
	{
		return { ...fallback };
	}

	const source = raw as { main?: unknown; cross?: unknown };

	return {
		main: Type.isNumber(source.main) ? source.main : fallback.main,
		cross: Type.isNumber(source.cross) ? source.cross : fallback.cross,
	};
};

// main is passed on as given, negative included: running the popover onto the anchor is the choice of the
// consumer, whether the pointer is on or off.
const normalizeOffset = (raw: PopoverOffset | undefined, override: unknown): NormalizedOffset => {
	// The scalar shorthand belongs to the base set alone: it always carries cross: 0 and inherits nothing.
	const base = Type.isNumber(raw) ? { main: raw, cross: 0 } : normalizeOffsetValue(raw, ZERO_OFFSET);

	return { base, onAxisFlip: normalizeOffsetValue(override, base) };
};

const normalizePointerAlignment = (value: unknown): PopoverPointerAlignment => {
	return value === 'auto' || (ALIGNMENTS as unknown[]).includes(value)
		? (value as PopoverPointerAlignment)
		: 'auto';
};

type RawPointerAim = { alignment?: unknown; pointsTo?: unknown } | undefined;

type RawPointer = boolean | RawPointerAim;

const AUTO_AIM: NormalizedPointerAim = { alignment: 'auto', pointsTo: 'auto' };

// An unset field is inherited from the fallback set; a set but invalid one becomes 'auto' as everywhere.
const normalizePointerAim = (raw: unknown, fallback: NormalizedPointerAim): NormalizedPointerAim => {
	if (!Type.isPlainObject(raw))
	{
		return { ...fallback };
	}

	const source = raw as Exclude<RawPointerAim, undefined>;

	return {
		alignment: Type.isUndefined(source.alignment)
			? fallback.alignment
			: normalizePointerAlignment(source.alignment),
		pointsTo: Type.isUndefined(source.pointsTo) ? fallback.pointsTo : normalizePointerAlignment(source.pointsTo),
	};
};

const normalizePointer = (raw: RawPointer, override: unknown): NormalizedPointer | null => {
	if (raw !== true && !Type.isPlainObject(raw))
	{
		return null;
	}

	const base = raw === true ? { ...AUTO_AIM } : normalizePointerAim(raw, AUTO_AIM);

	return { base, onAxisFlip: normalizePointerAim(override, base) };
};

const isExplicitAim = (aim: NormalizedPointerAim): boolean => {
	return aim.alignment !== 'auto' && aim.pointsTo !== 'auto';
};

// The single rule behind the whole onAxisFlip block: the override follows the fact of an axis change, not
// the name of the tactic that produced it.
export function selectOnAxisFlip<T>(
	pair: AxisFlipPair<T>,
	requested: PopoverPosition | null,
	side: PopoverPosition,
): T
{
	return crossAxisOf(side) === crossAxisOf(requested) ? pair.base : pair.onAxisFlip;
}

// An explicitly emptied fallback list is equivalent to flip: false - there is nowhere left to move.
const normalizeFlip = (raw: unknown): NormalizedFlip | null => {
	if (raw === false)
	{
		return null;
	}

	const fallbacks = Type.isPlainObject(raw) ? raw.fallbacks : undefined;
	if (!Type.isArray(fallbacks))
	{
		return { fallbacks: ['flip-position'] };
	}

	const tactics = fallbacks.filter((tactic, index): tactic is PopoverFlipTactic => {
		return (FLIP_TACTICS as unknown[]).includes(tactic) && fallbacks.indexOf(tactic) === index;
	});

	return tactics.length > 0 ? { fallbacks: tactics } : null;
};

const normalizeBoundary = (raw: unknown): PopoverBoundary => {
	if (Type.isElementNode(raw) || raw === 'clipping-ancestors')
	{
		return raw as PopoverBoundary;
	}

	return 'viewport';
};

const normalizeStrategy = (raw: unknown, mode: PositioningMode): PopoverStrategy => {
	if (raw === 'absolute' || raw === 'fixed')
	{
		return raw;
	}

	return mode === 'area' ? 'fixed' : 'absolute';
};

// The tracking mode belongs to the anchor cycle: in the area mode there is no target to follow.
const normalizeTracking = (raw: unknown, isArea: boolean): PopoverTracking => {
	return isArea || !(TRACKINGS as unknown[]).includes(raw) ? 'observers' : (raw as PopoverTracking);
};

// The area mode never changes the axis, so the whole override block stays unread there.
const readAxisFlipOverrides = (raw: unknown, isArea: boolean): PopoverAxisFlipOverrides => {
	return isArea || !Type.isPlainObject(raw) ? {} : (raw as PopoverAxisFlipOverrides);
};

const AREA_IGNORED_KEYS: Array<keyof PopoverPositioning> = [
	'flip',
	'slide',
	'stretch',
	'pointer',
	'onAxisFlip',
	'whenAnchorHidden',
	'tracking',
];

const warnIgnoredAreaOptions = (
	raw: PopoverPositioning,
	position: PopoverPosition | null,
	warn: WarnOnce,
): void => {
	if (warn.said())
	{
		return;
	}

	const ignored = AREA_IGNORED_KEYS.filter((key) => !Type.isUndefined(raw[key])) as string[];
	if (position === null && !Type.isUndefined(raw.offset))
	{
		ignored.push('offset');
	}

	if (ignored.length > 0 && warn.say())
	{
		console.warn(`${LABEL}: area mode ignores anchor-only options: ${ignored.join(', ')}.`);
	}
};

export function normalizePositioning(
	raw: PopoverPositioning,
	mode: PositioningMode,
	warn: WarnOnce = warnOnce(),
): NormalizedPositioning
{
	const isArea = mode === 'area';
	const source = Type.isPlainObject(raw) ? raw : {};

	const position = isSide(source.position)
		? source.position
		: (isArea ? null : DEFAULT_ANCHOR_POSITION);

	const alignment = (ALIGNMENTS as unknown[]).includes(source.alignment)
		? (source.alignment as PopoverAlignment)
		: 'center';

	const overrides = readAxisFlipOverrides(source.onAxisFlip, isArea);

	const pointer = isArea ? null : normalizePointer(source.pointer, overrides.pointer);
	const offsetValue = normalizeOffset(source.offset, overrides.offset);

	const stretch = isArea || !(STRETCHES as unknown[]).includes(source.stretch)
		? 'none'
		: (source.stretch as PopoverStretch);

	const whenAnchorHidden = isArea || !(WHEN_ANCHOR_HIDDEN as unknown[]).includes(source.whenAnchorHidden)
		? 'hide'
		: (source.whenAnchorHidden as PopoverWhenAnchorHidden);

	if (isArea)
	{
		warnIgnoredAreaOptions(source, position, warn);
	}

	return {
		mode,
		position,
		alignment,
		offset: offsetValue,
		flip: isArea ? null : normalizeFlip(source.flip),
		slide: isArea ? false : source.slide === true,
		stretch,
		constrainSize: source.constrainSize === true,
		pointer,
		boundary: normalizeBoundary(source.boundary),
		boundaryPadding: Type.isNumber(source.boundaryPadding) ? source.boundaryPadding : DEFAULT_BOUNDARY_PADDING,
		whenAnchorHidden,
		strategy: normalizeStrategy(source.strategy, mode),
		tracking: normalizeTracking(source.tracking, isArea),
	};
}

// What the anchor cycle passes to autoUpdate on top of the vendor defaults. The default mode passes
// nothing at all: the observer set stays exactly the one the vendor picks on its own.
export function buildTrackingOptions(normalized: NormalizedPositioning): TrackingOptions
{
	return normalized.tracking === 'animation-frame' ? { animationFrame: true } : undefined;
}

// Logical start/end are passed to floating-ui as is - it mirrors them under rtl itself.
export function buildPlacement(position: PopoverPosition | null, alignment: PopoverAlignment): Placement
{
	const side = position ?? DEFAULT_ANCHOR_POSITION;

	return alignment === 'center' ? side : `${side}-${alignment}`;
}

const OPPOSITE_SIDE: Record<PopoverPosition, PopoverPosition> = {
	top: 'bottom',
	bottom: 'top',
	left: 'right',
	right: 'left',
};

// Reproduces the vendor getSideList(side, isStart: false, rtl): the logical end of the perpendicular axis
// goes first. The block axis of horizontal-tb does not depend on the direction.
const perpendicularSides = (side: PopoverPosition, direction: Direction): PopoverPosition[] => {
	if (side === 'left' || side === 'right')
	{
		return ['bottom', 'top'];
	}

	return direction === 'rtl' ? ['left', 'right'] : ['right', 'left'];
};

// The alignment is kept on every candidate, which is what flipAlignment: false means for the vendor.
export function buildFallbackPlacements(
	flipOptions: NormalizedFlip,
	position: PopoverPosition | null,
	alignment: PopoverAlignment,
	direction: Direction,
): Placement[]
{
	const side = position ?? DEFAULT_ANCHOR_POSITION;
	const sides: PopoverPosition[] = [];

	flipOptions.fallbacks.forEach((tactic) => {
		const candidates = tactic === 'flip-axis' ? perpendicularSides(side, direction) : [OPPOSITE_SIDE[side]];
		candidates.forEach((candidate) => {
			if (candidate !== side && !sides.includes(candidate))
			{
				sides.push(candidate);
			}
		});
	});

	return sides.map((candidate) => buildPlacement(candidate, alignment));
}

// 'viewport' is a RootBoundary value: an empty element list leaves it as the only clipping source.
export function resolveBoundaryOptions(boundary: PopoverBoundary, padding: number): DetectOverflowOptions
{
	if (boundary === 'clipping-ancestors')
	{
		return { padding };
	}

	if (boundary === 'viewport')
	{
		return { boundary: [], rootBoundary: 'viewport', padding };
	}

	return { boundary, padding };
}

// Everything the options decide on their own, put together once for a whole cycle. The direction and the
// context of the anchor join them: both are settled at the relaunch that starts the cycle and stand still
// for as long as it runs.
export function buildPositioningPlan(
	normalized: NormalizedPositioning,
	direction: Direction,
	hasReferenceContext: boolean,
): PositioningPlan
{
	const boundaryOptions = resolveBoundaryOptions(normalized.boundary, normalized.boundaryPadding);
	const pointer = normalized.pointer;
	const offsets = normalized.offset;

	// Where offset.main counts from. Without the pointer that is the popover side itself; with it the tip of
	// the figure, which stands POINTER_PROTRUSION ahead of that side.
	const protrusion = pointer === null ? 0 : POINTER_PROTRUSION;

	const pointerNeedsDerivable = pointer !== null && (isExplicitAim(pointer.base) || isExplicitAim(pointer.onAxisFlip));
	const offsetsDiffer = offsets.base.main !== offsets.onAxisFlip.main
		|| offsets.base.cross !== offsets.onAxisFlip.cross;

	const requested = normalized.position;
	const offsetPlan: OffsetPlan = pointerNeedsDerivable || offsetsDiffer
		? {
			derivable: true,
			create: (resolveGeometry) => offset((state: MiddlewareState) => {
				// Which sets apply is known only here: the placement of this very cycle decides it.
				const side = getSide(state.placement);
				const offsetValue = selectOnAxisFlip(offsets, requested, side);
				const mainAxis = offsetValue.main + protrusion;
				if (pointer === null)
				{
					return { mainAxis, crossAxis: offsetValue.cross };
				}

				const axis = crossAxisOf(side);

				return {
					mainAxis,
					crossAxis: derivableCrossAxis(
						state,
						selectOnAxisFlip(pointer, requested, side),
						offsetValue.cross,
						resolveGeometry(state.rects.floating, axis),
						direction,
					),
				};
			}),
		}
		: {
			derivable: false,
			middleware: offset({ mainAxis: offsets.base.main + protrusion, crossAxis: offsets.base.cross }),
		};

	// flipAlignment: false is mandatory, otherwise the fallback changes the alignment without changing the
	// side. With slide on, the cross axis belongs to shift, so flip gives it up - unless a flip-axis tactic is
	// asked for: without the cross axis an overflow along it would never reach the perpendicular sides.
	const flipMiddleware = normalized.flip === null ? null : flip({
		flipAlignment: false,
		crossAxis: normalized.flip.fallbacks.includes('flip-axis') || !normalized.slide,
		fallbackPlacements: buildFallbackPlacements(
			normalized.flip,
			normalized.position,
			normalized.alignment,
			direction,
		),
		...boundaryOptions,
	});

	return {
		placement: buildPlacement(normalized.position, normalized.alignment),
		strategy: normalized.strategy,
		offset: offsetPlan,
		flip: flipMiddleware,
		shift: normalized.slide ? shift({ limiter: limitShift(), ...boundaryOptions }) : null,
		size: normalized.stretch !== 'none' || normalized.constrainSize ? boundaryOptions : null,
		// anchorHidden is a fact about the DOM anchor, so the user boundary/padding are deliberately not passed.
		hide: hasReferenceContext ? hide({ strategy: 'referenceHidden' }) : null,
	};
}

// The order offset -> flip -> shift -> size -> hide is normative. arrow() is never added: on an aligned
// placement it would shift the popover itself, so the controller aims the arrow instead. All the plan leaves
// to this call is the pair of middleware that read the DOM through the hooks of the tick.
export function buildConfigFromPlan(plan: PositioningPlan, hooks: MappingHooks): MappedConfig
{
	const middleware: MappedConfig['middleware'] = [
		plan.offset.derivable ? plan.offset.create(hooks.resolveGeometry) : plan.offset.middleware,
	];

	if (plan.flip !== null)
	{
		middleware.push(plan.flip);
	}

	if (plan.shift !== null)
	{
		middleware.push(plan.shift);
	}

	if (plan.size !== null)
	{
		middleware.push(size({ ...plan.size, apply: hooks.applySize }));
	}

	if (plan.hide !== null)
	{
		middleware.push(plan.hide);
	}

	return { placement: plan.placement, strategy: plan.strategy, middleware };
}

// A virtual anchor of the consumer: anything that answers getBoundingClientRect(). The type of the option
// names that method and nothing else, so nothing else is asked for here either - an instance of a class of
// the consumer (a cursor anchor with a method of its own) is a target as good as an object literal, and the
// single question below is the one every classification of a target goes through. An Element answers the
// same method and is never one of these: it is asked about first, everywhere, because it is watched as
// itself.
export function isRectTarget(target: unknown): target is PopoverRectTarget
{
	return Type.isObjectLike(target)
		&& Type.isFunction((target as { getBoundingClientRect?: unknown }).getBoundingClientRect);
}

// A point target, read the same duck-typed way and only once the rect shape has been turned down: a pair of
// coordinates the consumer writes, whatever object carries them.
export function isPointTarget(target: unknown): target is PopoverPointTarget
{
	const point = target as { x?: unknown; y?: unknown };

	return Type.isObjectLike(target) && Type.isNumber(point.x) && Type.isNumber(point.y);
}

// Both virtual anchor shapes go through an adapter: VirtualElement expects x/y, PopoverRect has none.
export function toReference(target: Exclude<PopoverTarget, null>): Reference
{
	if (Type.isElementNode(target))
	{
		return target;
	}

	if (isRectTarget(target))
	{
		return {
			getBoundingClientRect: () => {
				const rect = target.getBoundingClientRect();

				// Every field is read by name: the most natural implementation returns the DOMRect of a real
				// element, and its geometry lives on the prototype - a spread would copy nothing at all.
				return {
					x: rect.left,
					y: rect.top,
					top: rect.top,
					right: rect.right,
					bottom: rect.bottom,
					left: rect.left,
					width: rect.width,
					height: rect.height,
				};
			},
			contextElement: target.contextElement,
		};
	}

	const point = target as PopoverPointTarget;

	return {
		getBoundingClientRect: () => ({
			x: point.x,
			y: point.y,
			width: 0,
			height: 0,
			top: point.y,
			right: point.x,
			bottom: point.y,
			left: point.x,
		}),
	};
}

// A rect-returning virtual anchor nobody can watch: the vendor observes contextElement, and there is none.
// A point target is not one of these - its coordinates are written by the consumer, so it never moves on
// its own; an Element is watched as itself and answers the question below with a context of its own.
export function isUnwatchedRectTarget(target: PopoverTarget): boolean
{
	return isRectTarget(target) && !referenceHasContext(target);
}

export function referenceHasContext(target: PopoverTarget): boolean
{
	if (Type.isElementNode(target))
	{
		return true;
	}

	return isRectTarget(target) && Type.isElementNode(target.contextElement);
}

const PX_VALUE = /^(-?\d*\.?\d+)px$/;
const PERCENT_VALUE = /^(-?\d*\.?\d+)%$/;

const parseRadiusComponent = (component: string | undefined): ArrowRadiusComponent => {
	if (Type.isUndefined(component) || component === '')
	{
		return { px: 0 };
	}

	const pxMatch = PX_VALUE.exec(component);
	if (pxMatch)
	{
		return { px: Number.parseFloat(pxMatch[1]) };
	}

	const percentMatch = PERCENT_VALUE.exec(component);
	if (percentMatch)
	{
		return { share: Number.parseFloat(percentMatch[1]) / 100 };
	}

	// calc() and other expressions stay unresolved in the computed style - out of contract.
	return null;
};

// Splits the four corners of a computed style into components, once. A corner carries one component per axis,
// and a single written value stands for both.
export function parseArrowRadii(style: ArrowStyle): ArrowRadii
{
	const corners = [
		style.borderTopLeftRadius,
		style.borderTopRightRadius,
		style.borderBottomRightRadius,
		style.borderBottomLeftRadius,
	];

	const radii: ArrowRadii = { x: [], y: [] };

	corners.forEach((corner) => {
		const parts = corner.trim().split(/\s+/);
		const first = parseRadiusComponent(parts[0]);

		radii.x.push(first);
		// A corner written as a single value is round, and one parse of it answers for both of its axes.
		radii.y.push(Type.isUndefined(parts[1]) ? first : parseRadiusComponent(parts[1]));
	});

	return radii;
}

const resolveRadius = (component: ArrowRadiusComponent, side: number): number | null => {
	if (component === null)
	{
		return null;
	}

	return 'px' in component ? component.px : component.share * side;
};

// How far the arrow centre must stay from the popover corners, from corners already parsed. The parsing is a
// step of its own, parseArrowRadii, so that one cycle reads the style once and asks this as often as the
// middleware chain needs.
export function arrowGeometryFromRadii(
	radii: ArrowRadii,
	width: number,
	height: number,
	axis: CrossAxis,
	warn: WarnOnce = warnOnce(),
): ArrowGeometry
{
	const side = axis === 'x' ? width : height;

	const resolved = (axis === 'x' ? radii.x : radii.y).map((component) => {
		const px = resolveRadius(component, side);
		if (px === null)
		{
			if (warn.say())
			{
				console.warn(`${LABEL}: unsupported border-radius for the arrow offset; treated as 0.`);
			}

			return 0;
		}

		return px;
	});

	const radius = Math.max(...resolved);

	// The side is shorter than the arrow: there is no honest position even in the centre.
	if (side < POINTER_WIDTH)
	{
		return { hidden: true };
	}

	// Radius plus half the arrow base. The cap covers degenerate radii such as border-radius: 50%.
	const centerPadding = Math.min(radius + POINTER_WIDTH / 2, side / 2);

	return { hidden: false, centerPadding };
}

type PhysicalAlignment = 'start' | 'center' | 'end';

// Logical to physical: the horizontal axis mirrors under rtl, the vertical one does not.
const resolvePhysicalAlignment = (
	value: PopoverPointerAlignment,
	direction: Direction,
	axis: CrossAxis,
): PhysicalAlignment => {
	if (value === 'auto' || value === 'center')
	{
		return 'center';
	}

	if (axis === 'y' || direction === 'ltr')
	{
		return value;
	}

	return value === 'start' ? 'end' : 'start';
};

const anchorCrossPoint = (
	pointsTo: PopoverPointerAlignment,
	anchorStart: number,
	anchorSize: number,
	direction: Direction,
	axis: CrossAxis,
): number => {
	const physical = resolvePhysicalAlignment(pointsTo, direction, axis);
	if (physical === 'center')
	{
		return anchorStart + anchorSize / 2;
	}

	return physical === 'start' ? anchorStart : anchorStart + anchorSize;
};

const staticCenter = (physical: PhysicalAlignment, sideSize: number, min: number, max: number): number => {
	return physical === 'start' ? min : (physical === 'end' ? max : sideSize / 2);
};

type PointerResolveInput = {
	pointer: NormalizedPointerAim;
	geometry: ArrowGeometry;
	floatingSize: number;
	floatingStart: number;
	anchorStart: number;
	anchorSize: number;
	cross: number;
	axis: CrossAxis;
	direction: Direction;
};

// cross is a logical value: floating-ui negates it itself under rtl on the top/bottom sides
// (convertValueToCoords), which is the rule derivableCrossAxis already lives by. The arithmetic here is
// physical, so the same mirror is applied on the spot.
const physicalCross = (cross: number, direction: Direction, axis: CrossAxis): number => {
	return direction === 'rtl' && axis === 'x' ? -cross : cross;
};

// Returns the coordinate of the arrow EDGE along the side, not its centre. An explicit pointsTo
// wins over an explicit alignment.
export function resolvePointer(input: PointerResolveInput): number
{
	const { pointer, geometry, floatingSize, floatingStart, anchorStart, anchorSize, cross, axis, direction } = input;
	const centerPadding = geometry.hidden ? 0 : geometry.centerPadding;
	const min = centerPadding;
	const max = floatingSize - centerPadding;

	const staticAim = pointer.pointsTo === 'auto' && pointer.alignment !== 'auto';
	const autoAim = pointer.pointsTo === 'auto' && pointer.alignment === 'auto';

	// offset.cross is a deliberate shift of the whole construct, so under the auto aim the arrow travels
	// with the popover and keeps its place on the side instead of staying nailed to the anchor. An explicit
	// pointsTo aims at a point of the anchor and is never compensated; the static branch is measured from
	// the popover side and needs no compensation either. Only the consumer cross of the applied set comes
	// in here: the slide of shift() is the engine fitting the popover into the boundary, not a command, and
	// there the arrow must stay on the anchor.
	const aimShift = autoAim ? physicalCross(cross, direction, axis) : 0;
	const center = staticAim
		? staticCenter(resolvePhysicalAlignment(pointer.alignment, direction, axis), floatingSize, min, max)
		: clamp(
			anchorCrossPoint(pointer.pointsTo, anchorStart, anchorSize, direction, axis) - floatingStart + aimShift,
			min,
			max,
		);

	return center - POINTER_WIDTH / 2;
}

// Pre-shifts the popover inside offset(), before shift, so that a statically aligned arrow still reaches
// its pointsTo aim. An aim set with an 'auto' in it never pre-shifts the popover.
export function derivableCrossAxis(
	state: MiddlewareState,
	pointer: NormalizedPointerAim,
	cross: number,
	geometry: ArrowGeometry,
	direction: Direction,
): number
{
	if (geometry.hidden || !isExplicitAim(pointer))
	{
		return cross;
	}

	const side = getSide(state.placement);
	const axis = crossAxisOf(side);
	const floating = state.rects.floating;
	const reference = state.rects.reference;

	const sideSize = axis === 'x' ? floating.width : floating.height;
	const min = geometry.centerPadding;
	const max = sideSize - geometry.centerPadding;
	const desiredCenter = staticCenter(resolvePhysicalAlignment(pointer.alignment, direction, axis), sideSize, min, max);

	const baseFloatingStart = axis === 'x' ? state.x : state.y;
	const anchorStart = axis === 'x' ? reference.x : reference.y;
	const anchorSize = axis === 'x' ? reference.width : reference.height;
	const anchorPoint = anchorCrossPoint(pointer.pointsTo, anchorStart, anchorSize, direction, axis);
	const physicalDelta = anchorPoint - (baseFloatingStart + desiredCenter);

	// floating-ui negates crossAxis itself under rtl on the top/bottom sides (convertValueToCoords), so the
	// returned value is logical, just like the user cross it is added to.
	const rtlSign = direction === 'rtl' && (side === 'top' || side === 'bottom') ? -1 : 1;

	return cross + physicalDelta * rtlSign;
}

// Inverse of the vendor convertOffsetParentRelativeRectToViewportRelativeRect: only the direct converter
// is exported.
export function viewportToOffsetParentPoint(vp: Coords, origin: Coords, scale: Coords): Coords
{
	return {
		x: (vp.x - origin.x) / scale.x,
		y: (vp.y - origin.y) / scale.y,
	};
}

// Mirrors the Window branch of the vendor getRectRelativeToOffsetParent:
// local = vp + scroll - scrollBarX - htmlOffset <=> origin = -scroll + scrollBarX + htmlOffset, scale 1.
export function windowOffsetParentOrigin(scroll: Coords, scrollBarX: number, htmlOffset: Coords): Coords
{
	return {
		x: -scroll.x + scrollBarX + htmlOffset.x,
		y: -scroll.y + htmlOffset.y,
	};
}

const shrinkRect = (rect: Rect, padding: number): Rect => ({
	x: rect.x + padding,
	y: rect.y + padding,
	width: rect.width - padding * 2,
	height: rect.height - padding * 2,
});

const fromStart = (inset: number): string => `${inset}px`;

const fromEnd = (inset: number): string => (inset >= 0 ? `calc(100% - ${inset}px)` : `calc(100% + ${-inset}px)`);

const fromCenter = (delta: number): string => {
	if (delta === 0)
	{
		return '50%';
	}

	return delta > 0 ? `calc(50% + ${delta}px)` : `calc(50% - ${-delta}px)`;
};

type AxisResult = { coord: number; translate: string; css: string };

const centerAxis = (start: number, extent: number, delta: number): AxisResult => ({
	coord: start + extent / 2 + delta,
	translate: '-50%',
	css: fromCenter(delta),
});

const mainAxisResult = (start: number, extent: number, inward: number, atEnd: boolean, padding: number): AxisResult => {
	if (atEnd)
	{
		return { coord: start + extent - inward, translate: '-100%', css: fromEnd(padding + inward) };
	}

	return { coord: start + inward, translate: '0', css: fromStart(padding + inward) };
};

const crossAxisResult = (
	start: number,
	extent: number,
	physical: PhysicalAlignment,
	physCross: number,
	padding: number,
): AxisResult => {
	if (physical === 'center')
	{
		return centerAxis(start, extent, physCross);
	}

	if (physical === 'start')
	{
		return { coord: start + physCross, translate: '0', css: fromStart(padding + physCross) };
	}

	return { coord: start + extent + physCross, translate: '-100%', css: fromEnd(padding - physCross) };
};

const resolveAreaAxes = (
	inner: Rect,
	position: PopoverPosition | null,
	alignment: PopoverAlignment,
	offsetValue: NormalizedOffsetValue,
	direction: Direction,
	padding: number,
): { x: AxisResult; y: AxisResult } => {
	if (position === null)
	{
		return {
			x: centerAxis(inner.x, inner.width, 0),
			y: centerAxis(inner.y, inner.height, 0),
		};
	}

	if (position === 'top' || position === 'bottom')
	{
		const physical = resolvePhysicalAlignment(alignment, direction, 'x');
		const physCross = direction === 'rtl' ? -offsetValue.cross : offsetValue.cross;

		return {
			x: crossAxisResult(inner.x, inner.width, physical, physCross, padding),
			y: mainAxisResult(inner.y, inner.height, offsetValue.main, position === 'bottom', padding),
		};
	}

	const physical = resolvePhysicalAlignment(alignment, direction, 'y');

	return {
		x: mainAxisResult(inner.x, inner.width, offsetValue.main, position === 'right', padding),
		y: crossAxisResult(inner.y, inner.height, physical, offsetValue.cross, padding),
	};
};

// Direct CSS positioning. The popover's own size never enters it - centring is done by translate.
export function computeAreaCss(params: AreaParams): AreaCssPlan
{
	const { area, padding, position, alignment, offset: offsetValue, constrainSize, direction, translation } = params;
	const inner = shrinkRect(area, padding);
	const { x, y } = resolveAreaAxes(inner, position, alignment, offsetValue, direction, padding);

	const plan: AreaCssPlan = {
		left: null,
		top: null,
		right: null,
		bottom: null,
		transform: `translate(${x.translate}, ${y.translate})`,
		maxWidth: null,
		maxHeight: null,
	};

	// The inner area is the area with the padding taken off both of its sides, so it goes negative once the
	// padding is wider than the area itself. A negative max-width is no declaration at all - the browser drops
	// it - and constrainSize would stop constraining in the very case it is needed most. Only the limits are
	// floored; the position keeps counting from the area as it came out, so nothing but the cap moves.
	const floor = (value: number): string => `${Math.max(0, value)}px`;

	if (translation.mode === 'declarative')
	{
		plan.left = x.css;
		plan.top = y.css;
		if (constrainSize)
		{
			plan.maxWidth = floor(inner.width);
			plan.maxHeight = floor(inner.height);
		}
	}
	else
	{
		const local = viewportToOffsetParentPoint({ x: x.coord, y: y.coord }, translation.origin, translation.scale);
		plan.left = `${local.x}px`;
		plan.top = `${local.y}px`;
		if (constrainSize)
		{
			plan.maxWidth = floor(inner.width / translation.scale.x);
			plan.maxHeight = floor(inner.height / translation.scale.y);
		}
	}

	return plan;
}

export { crossAxisOf, getSide };
