/* eslint-disable */
this.BX = this.BX || {};
this.BX.UI = this.BX.UI || {};
this.BX.UI.System = this.BX.UI.System || {};
(function (exports, main_core, main_core_events, ui_floatingUi) {
	'use strict';

	const PopoverPosition = Object.freeze({
		Top: 'top',
		Right: 'right',
		Bottom: 'bottom',
		Left: 'left'
	});
	const PopoverAlignment = Object.freeze({
		Start: 'start',
		Center: 'center',
		End: 'end'
	});
	const PopoverStretch = Object.freeze({
		None: 'none',
		Width: 'width',
		MinWidth: 'min-width',
		Height: 'height'
	});
	const PopoverStrategy = Object.freeze({
		Absolute: 'absolute',
		Fixed: 'fixed'
	});
	const PopoverTracking = Object.freeze({
		Observers: 'observers',
		AnimationFrame: 'animation-frame'
	});
	const PopoverDesignContext = Object.freeze({
		ContentLight: 'content-light',
		ContentDark: 'content-dark',
		EdgeLight: 'edge-light',
		EdgeDark: 'edge-dark'
	});
	const POINTER_DEPTH = 12;
	const POINTER_OVERLAP = 1;
	const POINTER_PROTRUSION = POINTER_DEPTH - POINTER_OVERLAP;
	const POINTER_WIDTH = 36;

	const LABEL = 'BX.UI.System.Popover';
	const warnOnce = () => {
		let taken = false;
		return {
			said: () => taken,
			say: () => {
				if (taken) {
					return false;
				}
				taken = true;
				return true;
			}
		};
	};
	const DEFAULT_ANCHOR_POSITION = 'bottom';
	const DEFAULT_BOUNDARY_PADDING = 0;
	const SIDES = ['top', 'right', 'bottom', 'left'];
	const ALIGNMENTS = ['start', 'center', 'end'];
	const FLIP_TACTICS = ['flip-position', 'flip-axis'];
	const STRETCHES = ['none', 'width', 'min-width', 'height'];
	const WHEN_ANCHOR_HIDDEN = ['hide', 'close'];
	const TRACKINGS = ['observers', 'animation-frame'];
	const clamp = (value, min, max) => Math.min(Math.max(value, min), max);
	const getSide = placement => placement.split('-')[0];
	const crossAxisOf = position => {
		return position === 'left' || position === 'right' ? 'y' : 'x';
	};
	const isSide = value => SIDES.includes(value);
	const ZERO_OFFSET = {
		main: 0,
		cross: 0
	};
	const normalizeOffsetValue = (raw, fallback) => {
		if (!main_core.Type.isPlainObject(raw)) {
			return {
				...fallback
			};
		}
		const source = raw;
		return {
			main: main_core.Type.isNumber(source.main) ? source.main : fallback.main,
			cross: main_core.Type.isNumber(source.cross) ? source.cross : fallback.cross
		};
	};
	const normalizeOffset = (raw, override) => {
		const base = main_core.Type.isNumber(raw) ? {
			main: raw,
			cross: 0
		} : normalizeOffsetValue(raw, ZERO_OFFSET);
		return {
			base,
			onAxisFlip: normalizeOffsetValue(override, base)
		};
	};
	const normalizePointerAlignment = value => {
		return value === 'auto' || ALIGNMENTS.includes(value) ? value : 'auto';
	};
	const AUTO_AIM = {
		alignment: 'auto',
		pointsTo: 'auto'
	};
	const normalizePointerAim = (raw, fallback) => {
		if (!main_core.Type.isPlainObject(raw)) {
			return {
				...fallback
			};
		}
		const source = raw;
		return {
			alignment: main_core.Type.isUndefined(source.alignment) ? fallback.alignment : normalizePointerAlignment(source.alignment),
			pointsTo: main_core.Type.isUndefined(source.pointsTo) ? fallback.pointsTo : normalizePointerAlignment(source.pointsTo)
		};
	};
	const normalizePointer = (raw, override) => {
		if (raw !== true && !main_core.Type.isPlainObject(raw)) {
			return null;
		}
		const base = raw === true ? {
			...AUTO_AIM
		} : normalizePointerAim(raw, AUTO_AIM);
		return {
			base,
			onAxisFlip: normalizePointerAim(override, base)
		};
	};
	const isExplicitAim = aim => {
		return aim.alignment !== 'auto' && aim.pointsTo !== 'auto';
	};
	function selectOnAxisFlip(pair, requested, side) {
		return crossAxisOf(side) === crossAxisOf(requested) ? pair.base : pair.onAxisFlip;
	}
	const normalizeFlip = raw => {
		if (raw === false) {
			return null;
		}
		const fallbacks = main_core.Type.isPlainObject(raw) ? raw.fallbacks : undefined;
		if (!main_core.Type.isArray(fallbacks)) {
			return {
				fallbacks: ['flip-position']
			};
		}
		const tactics = fallbacks.filter((tactic, index) => {
			return FLIP_TACTICS.includes(tactic) && fallbacks.indexOf(tactic) === index;
		});
		return tactics.length > 0 ? {
			fallbacks: tactics
		} : null;
	};
	const normalizeBoundary = raw => {
		if (main_core.Type.isElementNode(raw) || raw === 'clipping-ancestors') {
			return raw;
		}
		return 'viewport';
	};
	const normalizeStrategy = (raw, mode) => {
		if (raw === 'absolute' || raw === 'fixed') {
			return raw;
		}
		return mode === 'area' ? 'fixed' : 'absolute';
	};
	const normalizeTracking = (raw, isArea) => {
		return isArea || !TRACKINGS.includes(raw) ? 'observers' : raw;
	};
	const readAxisFlipOverrides = (raw, isArea) => {
		return isArea || !main_core.Type.isPlainObject(raw) ? {} : raw;
	};
	const AREA_IGNORED_KEYS = ['flip', 'slide', 'stretch', 'pointer', 'onAxisFlip', 'whenAnchorHidden', 'tracking'];
	const warnIgnoredAreaOptions = (raw, position, warn) => {
		if (warn.said()) {
			return;
		}
		const ignored = AREA_IGNORED_KEYS.filter(key => !main_core.Type.isUndefined(raw[key]));
		if (position === null && !main_core.Type.isUndefined(raw.offset)) {
			ignored.push('offset');
		}
		if (ignored.length > 0 && warn.say()) {
			console.warn(`${LABEL}: area mode ignores anchor-only options: ${ignored.join(', ')}.`);
		}
	};
	function normalizePositioning(raw, mode, warn = warnOnce()) {
		const isArea = mode === 'area';
		const source = main_core.Type.isPlainObject(raw) ? raw : {};
		const position = isSide(source.position) ? source.position : isArea ? null : DEFAULT_ANCHOR_POSITION;
		const alignment = ALIGNMENTS.includes(source.alignment) ? source.alignment : 'center';
		const overrides = readAxisFlipOverrides(source.onAxisFlip, isArea);
		const pointer = isArea ? null : normalizePointer(source.pointer, overrides.pointer);
		const offsetValue = normalizeOffset(source.offset, overrides.offset);
		const stretch = isArea || !STRETCHES.includes(source.stretch) ? 'none' : source.stretch;
		const whenAnchorHidden = isArea || !WHEN_ANCHOR_HIDDEN.includes(source.whenAnchorHidden) ? 'hide' : source.whenAnchorHidden;
		if (isArea) {
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
			boundaryPadding: main_core.Type.isNumber(source.boundaryPadding) ? source.boundaryPadding : DEFAULT_BOUNDARY_PADDING,
			whenAnchorHidden,
			strategy: normalizeStrategy(source.strategy, mode),
			tracking: normalizeTracking(source.tracking, isArea)
		};
	}
	function buildTrackingOptions(normalized) {
		return normalized.tracking === 'animation-frame' ? {
			animationFrame: true
		} : undefined;
	}
	function buildPlacement(position, alignment) {
		const side = position ?? DEFAULT_ANCHOR_POSITION;
		return alignment === 'center' ? side : `${side}-${alignment}`;
	}
	const OPPOSITE_SIDE = {
		top: 'bottom',
		bottom: 'top',
		left: 'right',
		right: 'left'
	};
	const perpendicularSides = (side, direction) => {
		if (side === 'left' || side === 'right') {
			return ['bottom', 'top'];
		}
		return direction === 'rtl' ? ['left', 'right'] : ['right', 'left'];
	};
	function buildFallbackPlacements(flipOptions, position, alignment, direction) {
		const side = position ?? DEFAULT_ANCHOR_POSITION;
		const sides = [];
		flipOptions.fallbacks.forEach(tactic => {
			const candidates = tactic === 'flip-axis' ? perpendicularSides(side, direction) : [OPPOSITE_SIDE[side]];
			candidates.forEach(candidate => {
				if (candidate !== side && !sides.includes(candidate)) {
					sides.push(candidate);
				}
			});
		});
		return sides.map(candidate => buildPlacement(candidate, alignment));
	}
	function resolveBoundaryOptions(boundary, padding) {
		if (boundary === 'clipping-ancestors') {
			return {
				padding
			};
		}
		if (boundary === 'viewport') {
			return {
				boundary: [],
				rootBoundary: 'viewport',
				padding
			};
		}
		return {
			boundary,
			padding
		};
	}
	function buildPositioningPlan(normalized, direction, hasReferenceContext) {
		const boundaryOptions = resolveBoundaryOptions(normalized.boundary, normalized.boundaryPadding);
		const pointer = normalized.pointer;
		const offsets = normalized.offset;
		const protrusion = pointer === null ? 0 : POINTER_PROTRUSION;
		const pointerNeedsDerivable = pointer !== null && (isExplicitAim(pointer.base) || isExplicitAim(pointer.onAxisFlip));
		const offsetsDiffer = offsets.base.main !== offsets.onAxisFlip.main || offsets.base.cross !== offsets.onAxisFlip.cross;
		const requested = normalized.position;
		const offsetPlan = pointerNeedsDerivable || offsetsDiffer ? {
			derivable: true,
			create: resolveGeometry => ui_floatingUi.offset(state => {
				const side = getSide(state.placement);
				const offsetValue = selectOnAxisFlip(offsets, requested, side);
				const mainAxis = offsetValue.main + protrusion;
				if (pointer === null) {
					return {
						mainAxis,
						crossAxis: offsetValue.cross
					};
				}
				const axis = crossAxisOf(side);
				return {
					mainAxis,
					crossAxis: derivableCrossAxis(state, selectOnAxisFlip(pointer, requested, side), offsetValue.cross, resolveGeometry(state.rects.floating, axis), direction)
				};
			})
		} : {
			derivable: false,
			middleware: ui_floatingUi.offset({
				mainAxis: offsets.base.main + protrusion,
				crossAxis: offsets.base.cross
			})
		};
		const flipMiddleware = normalized.flip === null ? null : ui_floatingUi.flip({
			flipAlignment: false,
			crossAxis: normalized.flip.fallbacks.includes('flip-axis') || !normalized.slide,
			fallbackPlacements: buildFallbackPlacements(normalized.flip, normalized.position, normalized.alignment, direction),
			...boundaryOptions
		});
		return {
			placement: buildPlacement(normalized.position, normalized.alignment),
			strategy: normalized.strategy,
			offset: offsetPlan,
			flip: flipMiddleware,
			shift: normalized.slide ? ui_floatingUi.shift({
				limiter: ui_floatingUi.limitShift(),
				...boundaryOptions
			}) : null,
			size: normalized.stretch !== 'none' || normalized.constrainSize ? boundaryOptions : null,
			hide: hasReferenceContext ? ui_floatingUi.hide({
				strategy: 'referenceHidden'
			}) : null
		};
	}
	function buildConfigFromPlan(plan, hooks) {
		const middleware = [plan.offset.derivable ? plan.offset.create(hooks.resolveGeometry) : plan.offset.middleware];
		if (plan.flip !== null) {
			middleware.push(plan.flip);
		}
		if (plan.shift !== null) {
			middleware.push(plan.shift);
		}
		if (plan.size !== null) {
			middleware.push(ui_floatingUi.size({
				...plan.size,
				apply: hooks.applySize
			}));
		}
		if (plan.hide !== null) {
			middleware.push(plan.hide);
		}
		return {
			placement: plan.placement,
			strategy: plan.strategy,
			middleware
		};
	}
	function isRectTarget(target) {
		return main_core.Type.isObjectLike(target) && main_core.Type.isFunction(target.getBoundingClientRect);
	}
	function isPointTarget(target) {
		const point = target;
		return main_core.Type.isObjectLike(target) && main_core.Type.isNumber(point.x) && main_core.Type.isNumber(point.y);
	}
	function toReference(target) {
		if (main_core.Type.isElementNode(target)) {
			return target;
		}
		if (isRectTarget(target)) {
			return {
				getBoundingClientRect: () => {
					const rect = target.getBoundingClientRect();
					return {
						x: rect.left,
						y: rect.top,
						top: rect.top,
						right: rect.right,
						bottom: rect.bottom,
						left: rect.left,
						width: rect.width,
						height: rect.height
					};
				},
				contextElement: target.contextElement
			};
		}
		const point = target;
		return {
			getBoundingClientRect: () => ({
				x: point.x,
				y: point.y,
				width: 0,
				height: 0,
				top: point.y,
				right: point.x,
				bottom: point.y,
				left: point.x
			})
		};
	}
	function isUnwatchedRectTarget(target) {
		return isRectTarget(target) && !referenceHasContext(target);
	}
	function referenceHasContext(target) {
		if (main_core.Type.isElementNode(target)) {
			return true;
		}
		return isRectTarget(target) && main_core.Type.isElementNode(target.contextElement);
	}
	const PX_VALUE = /^(-?\d*\.?\d+)px$/;
	const PERCENT_VALUE = /^(-?\d*\.?\d+)%$/;
	const parseRadiusComponent = component => {
		if (main_core.Type.isUndefined(component) || component === '') {
			return {
				px: 0
			};
		}
		const pxMatch = PX_VALUE.exec(component);
		if (pxMatch) {
			return {
				px: Number.parseFloat(pxMatch[1])
			};
		}
		const percentMatch = PERCENT_VALUE.exec(component);
		if (percentMatch) {
			return {
				share: Number.parseFloat(percentMatch[1]) / 100
			};
		}
		return null;
	};
	function parseArrowRadii(style) {
		const corners = [style.borderTopLeftRadius, style.borderTopRightRadius, style.borderBottomRightRadius, style.borderBottomLeftRadius];
		const radii = {
			x: [],
			y: []
		};
		corners.forEach(corner => {
			const parts = corner.trim().split(/\s+/);
			const first = parseRadiusComponent(parts[0]);
			radii.x.push(first);
			radii.y.push(main_core.Type.isUndefined(parts[1]) ? first : parseRadiusComponent(parts[1]));
		});
		return radii;
	}
	const resolveRadius = (component, side) => {
		if (component === null) {
			return null;
		}
		return 'px' in component ? component.px : component.share * side;
	};
	function arrowGeometryFromRadii(radii, width, height, axis, warn = warnOnce()) {
		const side = axis === 'x' ? width : height;
		const resolved = (axis === 'x' ? radii.x : radii.y).map(component => {
			const px = resolveRadius(component, side);
			if (px === null) {
				if (warn.say()) {
					console.warn(`${LABEL}: unsupported border-radius for the arrow offset; treated as 0.`);
				}
				return 0;
			}
			return px;
		});
		const radius = Math.max(...resolved);
		if (side < POINTER_WIDTH) {
			return {
				hidden: true
			};
		}
		const centerPadding = Math.min(radius + POINTER_WIDTH / 2, side / 2);
		return {
			hidden: false,
			centerPadding
		};
	}
	const resolvePhysicalAlignment = (value, direction, axis) => {
		if (value === 'auto' || value === 'center') {
			return 'center';
		}
		if (axis === 'y' || direction === 'ltr') {
			return value;
		}
		return value === 'start' ? 'end' : 'start';
	};
	const anchorCrossPoint = (pointsTo, anchorStart, anchorSize, direction, axis) => {
		const physical = resolvePhysicalAlignment(pointsTo, direction, axis);
		if (physical === 'center') {
			return anchorStart + anchorSize / 2;
		}
		return physical === 'start' ? anchorStart : anchorStart + anchorSize;
	};
	const staticCenter = (physical, sideSize, min, max) => {
		return physical === 'start' ? min : physical === 'end' ? max : sideSize / 2;
	};
	const physicalCross = (cross, direction, axis) => {
		return direction === 'rtl' && axis === 'x' ? -cross : cross;
	};
	function resolvePointer(input) {
		const {
			pointer,
			geometry,
			floatingSize,
			floatingStart,
			anchorStart,
			anchorSize,
			cross,
			axis,
			direction
		} = input;
		const centerPadding = geometry.hidden ? 0 : geometry.centerPadding;
		const min = centerPadding;
		const max = floatingSize - centerPadding;
		const staticAim = pointer.pointsTo === 'auto' && pointer.alignment !== 'auto';
		const autoAim = pointer.pointsTo === 'auto' && pointer.alignment === 'auto';
		const aimShift = autoAim ? physicalCross(cross, direction, axis) : 0;
		const center = staticAim ? staticCenter(resolvePhysicalAlignment(pointer.alignment, direction, axis), floatingSize, min, max) : clamp(anchorCrossPoint(pointer.pointsTo, anchorStart, anchorSize, direction, axis) - floatingStart + aimShift, min, max);
		return center - POINTER_WIDTH / 2;
	}
	function derivableCrossAxis(state, pointer, cross, geometry, direction) {
		if (geometry.hidden || !isExplicitAim(pointer)) {
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
		const rtlSign = direction === 'rtl' && (side === 'top' || side === 'bottom') ? -1 : 1;
		return cross + physicalDelta * rtlSign;
	}
	function viewportToOffsetParentPoint(vp, origin, scale) {
		return {
			x: (vp.x - origin.x) / scale.x,
			y: (vp.y - origin.y) / scale.y
		};
	}
	function windowOffsetParentOrigin(scroll, scrollBarX, htmlOffset) {
		return {
			x: -scroll.x + scrollBarX + htmlOffset.x,
			y: -scroll.y + htmlOffset.y
		};
	}
	const shrinkRect = (rect, padding) => ({
		x: rect.x + padding,
		y: rect.y + padding,
		width: rect.width - padding * 2,
		height: rect.height - padding * 2
	});
	const fromStart = inset => `${inset}px`;
	const fromEnd = inset => inset >= 0 ? `calc(100% - ${inset}px)` : `calc(100% + ${-inset}px)`;
	const fromCenter = delta => {
		if (delta === 0) {
			return '50%';
		}
		return delta > 0 ? `calc(50% + ${delta}px)` : `calc(50% - ${-delta}px)`;
	};
	const centerAxis = (start, extent, delta) => ({
		coord: start + extent / 2 + delta,
		translate: '-50%',
		css: fromCenter(delta)
	});
	const mainAxisResult = (start, extent, inward, atEnd, padding) => {
		if (atEnd) {
			return {
				coord: start + extent - inward,
				translate: '-100%',
				css: fromEnd(padding + inward)
			};
		}
		return {
			coord: start + inward,
			translate: '0',
			css: fromStart(padding + inward)
		};
	};
	const crossAxisResult = (start, extent, physical, physCross, padding) => {
		if (physical === 'center') {
			return centerAxis(start, extent, physCross);
		}
		if (physical === 'start') {
			return {
				coord: start + physCross,
				translate: '0',
				css: fromStart(padding + physCross)
			};
		}
		return {
			coord: start + extent + physCross,
			translate: '-100%',
			css: fromEnd(padding - physCross)
		};
	};
	const resolveAreaAxes = (inner, position, alignment, offsetValue, direction, padding) => {
		if (position === null) {
			return {
				x: centerAxis(inner.x, inner.width, 0),
				y: centerAxis(inner.y, inner.height, 0)
			};
		}
		if (position === 'top' || position === 'bottom') {
			const physical = resolvePhysicalAlignment(alignment, direction, 'x');
			const physCross = direction === 'rtl' ? -offsetValue.cross : offsetValue.cross;
			return {
				x: crossAxisResult(inner.x, inner.width, physical, physCross, padding),
				y: mainAxisResult(inner.y, inner.height, offsetValue.main, position === 'bottom', padding)
			};
		}
		const physical = resolvePhysicalAlignment(alignment, direction, 'y');
		return {
			x: mainAxisResult(inner.x, inner.width, offsetValue.main, position === 'right', padding),
			y: crossAxisResult(inner.y, inner.height, physical, offsetValue.cross, padding)
		};
	};
	function computeAreaCss(params) {
		const {
			area,
			padding,
			position,
			alignment,
			offset: offsetValue,
			constrainSize,
			direction,
			translation
		} = params;
		const inner = shrinkRect(area, padding);
		const {
			x,
			y
		} = resolveAreaAxes(inner, position, alignment, offsetValue, direction, padding);
		const plan = {
			left: null,
			top: null,
			right: null,
			bottom: null,
			transform: `translate(${x.translate}, ${y.translate})`,
			maxWidth: null,
			maxHeight: null
		};
		const floor = value => `${Math.max(0, value)}px`;
		if (translation.mode === 'declarative') {
			plan.left = x.css;
			plan.top = y.css;
			if (constrainSize) {
				plan.maxWidth = floor(inner.width);
				plan.maxHeight = floor(inner.height);
			}
		} else {
			const local = viewportToOffsetParentPoint({
				x: x.coord,
				y: y.coord
			}, translation.origin, translation.scale);
			plan.left = `${local.x}px`;
			plan.top = `${local.y}px`;
			if (constrainSize) {
				plan.maxWidth = floor(inner.width / translation.scale.x);
				plan.maxHeight = floor(inner.height / translation.scale.y);
			}
		}
		return plan;
	}

	const PASSIVE_LAYER_SELECTORS = '.ui-notification-balloon, .side-panel-toolbar';
	function isVisible(element) {
		if (element === null || !element.isConnected) {
			return false;
		}
		if (!hasPaintedRect(element)) {
			return false;
		}
		return getComputedStyle(element).visibility === 'visible';
	}
	function hasPaintedRect(element) {
		for (const rect of element.getClientRects()) {
			if (rect.width > 0 && rect.height > 0) {
				return true;
			}
		}
		return false;
	}
	function isPassive(comp) {
		const element = comp.getElement();
		return element !== null && element.matches(PASSIVE_LAYER_SELECTORS);
	}
	function layerChain(el) {
		const chain = [];
		let node = el;
		while (node !== null) {
			const comp = main_core.ZIndexManager.getComponent(node);
			if (comp) {
				chain.unshift({
					node: node,
					comp
				});
			}
			node = node.parentElement;
		}
		return chain;
	}
	function bodyStack() {
		return main_core.ZIndexManager.getStack(document.body) ?? null;
	}
	function stackHasVisibleLayer(stack) {
		return stack.getComponents().some(comp => !isPassive(comp) && isVisible(comp.getElement()));
	}
	function visibleAbove(comp) {
		const stack = comp.getStack();
		if (!stack) {
			return false;
		}
		const zIndex = comp.getZIndex();
		return stack.getComponents().some(other => {
			return other !== comp && other.getZIndex() > zIndex && !isPassive(other) && isVisible(other.getElement());
		});
	}
	function nodeHasVisibleLayer(node) {
		const stack = main_core.ZIndexManager.getStack(node);
		return stack ? stackHasVisibleLayer(stack) : false;
	}
	function hasVisibleSubtreeLayer(popoverEl) {
		if (nodeHasVisibleLayer(popoverEl)) {
			return true;
		}
		const walker = popoverEl.ownerDocument.createTreeWalker(popoverEl, NodeFilter.SHOW_ELEMENT);
		for (let node = walker.nextNode(); node !== null; node = walker.nextNode()) {
			if (nodeHasVisibleLayer(node)) {
				return true;
			}
		}
		return false;
	}
	function hasVisibleLayerAbove(popoverEl, popoverChain) {
		if (hasVisibleSubtreeLayer(popoverEl)) {
			return true;
		}
		const chain = popoverChain ?? layerChain(popoverEl);
		if (chain.some(({
			comp
		}) => visibleAbove(comp))) {
			return true;
		}
		const stack = bodyStack();
		const inBodyStack = stack !== null && chain.some(({
			comp
		}) => comp.getStack() === stack);
		if (!inBodyStack) {
			return stack !== null && stackHasVisibleLayer(stack);
		}
		return false;
	}
	function isInBodyLayerTree(popoverEl) {
		const stack = bodyStack();
		return stack !== null && layerChain(popoverEl).some(({
			comp
		}) => comp.getStack() === stack);
	}
	function firstDivergingPair(a, b) {
		const length = Math.min(a.length, b.length);
		for (let index = 0; index < length; index++) {
			if (a[index].node !== b[index].node) {
				return [a[index], b[index]];
			}
		}
		return null;
	}
	function isClosingClick(popoverEl, target, popoverChain) {
		const targetChain = layerChain(target);
		const layer = targetChain.length > 0 ? targetChain[targetChain.length - 1] : null;
		if (layer === null || layer.node.contains(popoverEl)) {
			return true;
		}
		const pair = firstDivergingPair(targetChain, popoverChain ?? layerChain(popoverEl));
		if (pair === null) {
			return false;
		}
		const [a, b] = pair;
		if (a.comp.getStack() !== b.comp.getStack()) {
			return false;
		}
		return a.comp.getZIndex() <= b.comp.getZIndex();
	}

	const EVENT_NAMESPACE = 'BX.UI.System.Popover';
	const STATIC_SIDE = {
		top: 'bottom',
		right: 'left',
		bottom: 'top',
		left: 'right'
	};
	const GESTURE_EVENTS = new Set(['mousedown', 'pointerdown', 'touchstart', 'mouseup', 'pointerup', 'touchend']);
	const AREA_INLINE_PROPS = ['left', 'top', 'right', 'bottom', 'transform', 'width', 'minWidth', 'height', 'maxWidth', 'maxHeight'];
	const SIZE_INLINE_PROPS = ['width', 'minWidth', 'height', 'maxWidth', 'maxHeight'];
	const BUBBLE_ATTRIBUTE = 'data-ui-system-popover-bubble';
	const CONTENT_SHAPE = 'the "content" option must resolve to exactly one element - that element becomes the ' + 'bubble of the popover and belongs to the consumer entirely';
	const parseMarkupRoots = markup => {
		const template = document.createElement('template');
		template.innerHTML = markup;
		return [...template.content.childNodes].filter(node => {
			return !main_core.Type.isTextNode(node) || (node.textContent ?? '').trim() !== '';
		});
	};
	const observeResize = (element, callback) => {
		if (!main_core.Type.isFunction(window.ResizeObserver)) {
			return null;
		}
		const observer = new ResizeObserver(() => callback());
		observer.observe(element);
		return () => observer.disconnect();
	};
	const sameRect = (a, b) => {
		return a.left === b.left && a.top === b.top && a.width === b.width && a.height === b.height;
	};
	const isTransparentColor = color => {
		if (color === '' || color === 'transparent') {
			return true;
		}
		const components = color.startsWith('rgb') ? color.match(/[\d.]+/g) : null;
		return components !== null && components.length === 4 && Number.parseFloat(components[3]) === 0;
	};
	const bubbleReader = body => {
		let style = null;
		let radii = null;
		const readStyle = () => {
			if (style === null) {
				style = getComputedStyle(body);
			}
			return style;
		};
		return {
			style: readStyle,
			radii: () => {
				if (radii === null) {
					radii = parseArrowRadii(readStyle());
				}
				return radii;
			}
		};
	};
	const declaredLanguage = element => {
		const owner = element.closest('[lang]');
		return owner === null ? null : owner.getAttribute('lang') ?? '';
	};
	const sameLanguage = (one, other) => {
		if (one === null || other === null) {
			return one === other;
		}
		return one.toLowerCase() === other.toLowerCase();
	};
	const buildState = shown => ({
		shown,
		positioned: false,
		position: null,
		alignment: 'center',
		flipped: false,
		slide: {
			x: 0,
			y: 0
		},
		anchorHidden: false,
		pointerHidden: false,
		constrained: null,
		rect: null
	});
	const cloneState = state => ({
		...state,
		slide: {
			...state.slide
		},
		constrained: state.constrained === null ? null : {
			...state.constrained
		},
		rect: state.rect === null ? null : {
			...state.rect
		}
	});
	const STATE_KEYS = ['shown', 'positioned', 'position', 'alignment', 'flipped', 'slide', 'anchorHidden', 'pointerHidden', 'constrained', 'rect'];
	const RECT_KEYS = ['top', 'right', 'bottom', 'left', 'width', 'height'];
	const sameStateField = (key, a, b) => {
		switch (key) {
			case 'slide':
				return a.slide.x === b.slide.x && a.slide.y === b.slide.y;
			case 'constrained':
				return a.constrained === null || b.constrained === null ? a.constrained === b.constrained : a.constrained.maxWidth === b.constrained.maxWidth && a.constrained.maxHeight === b.constrained.maxHeight;
			case 'rect':
				return a.rect === null || b.rect === null ? a.rect === b.rect : RECT_KEYS.every(field => a.rect[field] === b.rect[field]);
			default:
				return a[key] === b[key];
		}
	};
	const changedStateFields = (previous, next) => {
		return STATE_KEYS.filter(key => !sameStateField(key, previous, next));
	};
	const toPopoverRect = source => ({
		top: source.top,
		right: source.right,
		bottom: source.bottom,
		left: source.left,
		width: source.width,
		height: source.height
	});
	class Popover extends main_core_events.EventEmitter {
		#content;
		#target;
		#positioning;
		#className;
		#designContext;
		#mountContainer;
		#closeByClickOutside;
		#closeByEsc;
		#element = null;
		#pointer = null;
		#body = null;
		#appliedClassNames = [];
		#shown = false;
		#destroyed = false;
		#registered = false;
		#state = buildState(false);
		#cycleFailed = false;
		#gestureStartedInside = false;
		#openedByGesture = false;
		#outsideTreeWarned = false;
		#targetRect = null;
		#consumerUpdate = false;
		#movingTargetWarned = false;
		#transparentBubbleWarned = false;
		#ignoredAreaOptionsWarned = warnOnce();
		#arrowRadiusWarned = warnOnce();
		#direction = 'ltr';
		#generation = 0;
		#runId = 0;
		#cleanups = [];
		#update = null;
		#normalized = null;
		#plan = null;
		constructor(options) {
			super();
			this.setEventNamespace(EVENT_NAMESPACE);
			if (!main_core.Type.isPlainObject(options) || !this.#isValidContent(options.content)) {
				throw new TypeError(`${EVENT_NAMESPACE}: the "content" option is required (string, HTMLElement or factory).`);
			}
			this.#content = options.content;
			this.#target = this.#isValidTarget(options.target) ? options.target : null;
			this.#positioning = main_core.Type.isPlainObject(options.positioning) ? {
				...options.positioning
			} : {};
			this.#className = this.#normalizeClassName(options.className);
			this.#designContext = this.#normalizeDesignContext(options.designContext);
			this.#mountContainer = main_core.Type.isElementNode(options.container) ? options.container : null;
			this.#closeByClickOutside = options.closeByClickOutside !== false;
			this.#closeByEsc = options.closeByEsc !== false;
			if (options.events) {
				this.subscribeFromOptions(options.events);
			}
		}
		show() {
			if (this.#destroyed) {
				console.warn(`${EVENT_NAMESPACE}: show() called on a destroyed instance.`);
				return;
			}
			if (this.#shown) {
				return;
			}
			const element = this.#ensureElement();
			main_core.Dom.append(element, this.#mountContainer ?? document.body);
			if (!this.#registered) {
				main_core.ZIndexManager.register(element);
				this.#registered = true;
			}
			main_core.ZIndexManager.bringToFront(element);
			main_core.Dom.removeClass(element, '--hidden');
			this.#bindCloseHandlers();
			this.#openedByGesture = GESTURE_EVENTS.has(window.event?.type ?? '');
			this.#warnIfOutsideLayerTree(element);
			this.#shown = true;
			this.#relaunch();
			this.emit('onShow', {});
		}
		#warnIfOutsideLayerTree(element) {
			if (this.#outsideTreeWarned || !this.#closeByClickOutside && !this.#closeByEsc) {
				return;
			}
			if (!isInBodyLayerTree(element)) {
				this.#outsideTreeWarned = true;
				console.warn(`${EVENT_NAMESPACE}: mounted outside the body layer tree - cross-layer arbitration for ` + 'closeByClickOutside/closeByEsc degrades to conservative (any visible body-stack layer blocks closing).');
			}
		}
		hide() {
			if (this.#destroyed || !this.#shown) {
				return;
			}
			this.#applyHiddenState();
			this.emit('onHide', {});
		}
		destroy() {
			if (this.#destroyed) {
				return;
			}
			if (this.#shown) {
				this.#applyHiddenState();
				this.emit('onHide', {});
			}
			if (this.#element) {
				if (this.#registered) {
					main_core.ZIndexManager.unregister(this.#element);
					this.#registered = false;
				}
				main_core.Dom.remove(this.#element);
			}
			this.#element = null;
			this.#pointer = null;
			this.#body = null;
			this.#destroyed = true;
			this.#generation += 1;
			this.emit('onDestroy', {});
			this.unsubscribeAll();
		}
		isShown() {
			return this.#shown;
		}
		setTarget(target) {
			if (this.#destroyed) {
				console.warn(`${EVENT_NAMESPACE}: setTarget() called on a destroyed instance.`);
				return;
			}
			this.#target = this.#isValidTarget(target) ? target : null;
			this.#relaunch();
		}
		setPositioning(positioning) {
			if (this.#destroyed) {
				console.warn(`${EVENT_NAMESPACE}: setPositioning() called on a destroyed instance.`);
				return;
			}
			if (main_core.Type.isPlainObject(positioning)) {
				Object.assign(this.#positioning, positioning);
			}
			this.#relaunch();
		}
		setClassName(className) {
			if (this.#destroyed) {
				console.warn(`${EVENT_NAMESPACE}: setClassName() called on a destroyed instance.`);
				return;
			}
			this.#className = this.#normalizeClassName(className);
			if (this.#element === null) {
				return;
			}
			main_core.Dom.removeClass(this.#element, this.#appliedClassNames);
			this.#applyClassName(this.#element);
			this.adjustPosition();
		}
		setDesignContext(designContext) {
			if (this.#destroyed) {
				console.warn(`${EVENT_NAMESPACE}: setDesignContext() called on a destroyed instance.`);
				return;
			}
			const previous = this.#designContext;
			this.#designContext = this.#normalizeDesignContext(designContext);
			if (this.#element === null || this.#designContext === previous) {
				return;
			}
			if (previous !== null) {
				main_core.Dom.removeClass(this.#element, `--ui-context-${previous}`);
			}
			if (this.#designContext !== null) {
				main_core.Dom.addClass(this.#element, `--ui-context-${this.#designContext}`);
			}
			this.adjustPosition();
		}
		setCloseByClickOutside(value) {
			if (this.#destroyed) {
				console.warn(`${EVENT_NAMESPACE}: setCloseByClickOutside() called on a destroyed instance.`);
				return;
			}
			this.#closeByClickOutside = value !== false;
			this.#rebindCloseHandlers();
		}
		setCloseByEsc(value) {
			if (this.#destroyed) {
				console.warn(`${EVENT_NAMESPACE}: setCloseByEsc() called on a destroyed instance.`);
				return;
			}
			this.#closeByEsc = value !== false;
			this.#rebindCloseHandlers();
		}
		#rebindCloseHandlers() {
			if (!this.#shown) {
				return;
			}
			this.#unbindCloseHandlers();
			this.#bindCloseHandlers();
		}
		adjustPosition() {
			if (this.#destroyed) {
				console.warn(`${EVENT_NAMESPACE}: adjustPosition() called on a destroyed instance.`);
				return;
			}
			if (!this.#shown) {
				return;
			}
			this.#consumerUpdate = true;
			try {
				this.#update?.();
			} finally {
				this.#consumerUpdate = false;
			}
		}
		getState() {
			return cloneState(this.#state);
		}
		#relaunch() {
			this.#stopPositioning();
			this.#generation += 1;
			if (!this.#shown || !this.#element) {
				return;
			}
			const element = this.#element;
			this.#state = buildState(true);
			this.#cycleFailed = false;
			this.#targetRect = null;
			this.#clearAppliedState(element);
			this.#resetInline(element, SIZE_INLINE_PROPS);
			main_core.Dom.addClass(element, '--measuring');
			this.#applyLocaleAttributes(element);
			if (this.#target === null) {
				this.#startAreaCycle(element);
			} else {
				this.#startAnchorCycle(element, this.#target);
			}
		}
		#stopPositioning() {
			this.#cleanups.forEach(cleanup => cleanup());
			this.#cleanups = [];
			this.#update = null;
			this.#normalized = null;
			this.#plan = null;
		}
		#applyLocaleAttributes(element) {
			const source = this.#directionSource();
			this.#direction = getComputedStyle(source).direction === 'rtl' ? 'rtl' : 'ltr';
			main_core.Dom.attr(element, 'dir', this.#direction);
			this.#applyLanguage(element, source);
		}
		#applyLanguage(element, source) {
			const language = declaredLanguage(source);
			const inherited = declaredLanguage(this.#mountContainer ?? document.body);
			if (sameLanguage(language, inherited)) {
				element.removeAttribute('lang');
				return;
			}
			main_core.Dom.attr(element, 'lang', language ?? '');
		}
		#directionSource() {
			if (main_core.Type.isElementNode(this.#target)) {
				return this.#target;
			}
			if (isRectTarget(this.#target) && main_core.Type.isElementNode(this.#target.contextElement)) {
				return this.#target.contextElement;
			}
			return this.#mountContainer ?? document.body;
		}
		#watchAlongside(reference, element, update) {
			this.#cleanups.push(ui_floatingUi.autoUpdate(reference, element, update, {
				elementResize: false
			}));
			const stopResize = observeResize(reference, update);
			if (stopResize !== null) {
				this.#cleanups.push(stopResize);
			}
		}
		#startAnchorCycle(element, target) {
			const reference = toReference(target);
			const generation = this.#generation;
			const update = () => {
				void this.#anchorUpdate(element, reference, generation);
			};
			this.#update = update;
			const normalized = normalizePositioning(this.#positioning, 'anchor');
			this.#normalized = normalized;
			this.#plan = buildPositioningPlan(normalized, this.#direction, referenceHasContext(this.#target));
			this.#cleanups.push(ui_floatingUi.autoUpdate(reference, element, update, buildTrackingOptions(normalized)));
			if (main_core.Type.isElementNode(normalized.boundary)) {
				this.#watchAlongside(normalized.boundary, element, update);
			}
		}
		async #anchorUpdate(element, reference, generation) {
			const runId = ++this.#runId;
			const isCurrent = () => this.#generation === generation && this.#runId === runId;
			const normalized = this.#normalized;
			const plan = this.#plan;
			if (normalized === null || plan === null) {
				return;
			}
			const body = this.#body;
			const bubble = bubbleReader(body);
			this.#warnIfTargetDrifted(normalized, reference);
			let constrained = null;
			const hooks = {
				direction: this.#direction,
				referenceHasContext: referenceHasContext(this.#target),
				resolveGeometry: (floating, axis) => {
					return arrowGeometryFromRadii(bubble.radii(), floating.width, floating.height, axis, this.#arrowRadiusWarned);
				},
				applySize: args => {
					if (isCurrent()) {
						constrained = this.#applySizePlan(element, normalized, args);
					}
				}
			};
			try {
				const result = await ui_floatingUi.computePosition(reference, element, buildConfigFromPlan(plan, hooks));
				if (!isCurrent()) {
					return;
				}
				this.#applyAnchorResult(element, normalized, result, reference, constrained, bubble);
			} catch (error) {
				console.error(`${EVENT_NAMESPACE}: positioning failed.`, error);
				if (isCurrent()) {
					this.#commitState(element, buildState(this.#shown), true);
				}
			}
		}
		#warnIfTargetDrifted(normalized, reference) {
			if (this.#movingTargetWarned || normalized.tracking === 'animation-frame' || !isUnwatchedRectTarget(this.#target)) {
				return;
			}
			const previous = this.#targetRect;
			const source = reference.getBoundingClientRect();
			const rect = {
				left: source.left,
				top: source.top,
				width: source.width,
				height: source.height
			};
			this.#targetRect = rect;
			if (this.#consumerUpdate || previous === null || sameRect(previous, rect)) {
				return;
			}
			this.#movingTargetWarned = true;
			console.warn(`${EVENT_NAMESPACE}: the virtual target has moved on its own and nothing is watching it - this ` + 'position was recomputed by chance. Give the target a contextElement, or call adjustPosition() ' + "when the target moves, or set positioning.tracking to 'animation-frame'.");
		}
		#applyAnchorResult(element, normalized, result, reference, constrained, bubble) {
			const dpr = this.#defaultView()?.devicePixelRatio || 1;
			const snap = value => `${Math.round(value * dpr) / dpr}px`;
			this.#resetInline(element, ['right', 'bottom', 'transform']);
			this.#css(element, 'position', result.strategy);
			this.#css(element, 'left', snap(result.x));
			this.#css(element, 'top', snap(result.y));
			const rect = element.getBoundingClientRect();
			const finalSide = getSide(result.placement);
			const anchorHidden = result.middlewareData.hide?.referenceHidden === true;
			const shift = result.middlewareData.shift;
			const pointerHidden = this.#applyPointer(element, normalized, result, reference, finalSide, rect, bubble);
			const state = {
				shown: this.#shown,
				positioned: true,
				position: finalSide,
				alignment: this.#alignmentOf(result.placement),
				flipped: finalSide !== normalized.position,
				slide: {
					x: shift?.x ?? 0,
					y: shift?.y ?? 0
				},
				anchorHidden,
				pointerHidden,
				constrained,
				rect: toPopoverRect(rect)
			};
			if (anchorHidden && normalized.whenAnchorHidden === 'close') {
				this.#commitState(element, state);
				this.hide();
				return;
			}
			main_core.Dom.toggleClass(element, '--anchor-hidden', anchorHidden);
			this.#commitState(element, state);
		}
		#applyPointer(element, normalized, result, reference, finalSide, rect, bubble) {
			if (normalized.pointer === null) {
				main_core.Dom.removeClass(element, '--with-pointer');
				return true;
			}
			const pointer = this.#pointer;
			const body = this.#body;
			const bodyStyle = bubble.style();
			const axis = crossAxisOf(finalSide);
			const aim = selectOnAxisFlip(normalized.pointer, normalized.position, finalSide);
			const geometry = arrowGeometryFromRadii(bubble.radii(), body.offsetWidth, body.offsetHeight, axis, this.#arrowRadiusWarned);
			if (geometry.hidden) {
				main_core.Dom.addClass(element, '--with-pointer');
				main_core.Dom.addClass(element, '--pointer-hidden');
				return true;
			}
			const {
				backgroundColor
			} = bodyStyle;
			const scaleX = element.offsetWidth > 0 ? rect.width / element.offsetWidth : 1;
			const scaleY = element.offsetHeight > 0 ? rect.height / element.offsetHeight : 1;
			const scale = axis === 'x' ? scaleX : scaleY;
			const anchorRect = reference.getBoundingClientRect();
			const floatingSize = axis === 'x' ? element.offsetWidth : element.offsetHeight;
			const floatingStart = (axis === 'x' ? rect.left : rect.top) / scale;
			const anchorStart = (axis === 'x' ? anchorRect.left : anchorRect.top) / scale;
			const anchorSize = (axis === 'x' ? anchorRect.width : anchorRect.height) / scale;
			const cross = selectOnAxisFlip(normalized.offset, normalized.position, finalSide).cross;
			const edge = resolvePointer({
				pointer: aim,
				geometry,
				floatingSize,
				floatingStart,
				anchorStart,
				anchorSize,
				cross,
				axis,
				direction: this.#direction
			});
			main_core.Dom.addClass(element, '--with-pointer');
			main_core.Dom.removeClass(element, '--pointer-hidden');
			this.#css(pointer, '--ui-popover-pointer-color', backgroundColor);
			this.#warnIfBubbleTransparent(backgroundColor);
			this.#resetInline(pointer, ['left', 'top', 'right', 'bottom']);
			this.#css(pointer, STATIC_SIDE[finalSide], `${-POINTER_PROTRUSION}px`);
			this.#css(pointer, axis === 'x' ? 'left' : 'top', `${edge}px`);
			return false;
		}
		#warnIfBubbleTransparent(color) {
			if (this.#transparentBubbleWarned || !isTransparentColor(color)) {
				return;
			}
			this.#transparentBubbleWarned = true;
			console.warn(`${EVENT_NAMESPACE}: the pointer is on, but the computed background of the bubble is fully ` + 'transparent - the arrow takes its colour from there and stays invisible. The appearance of the ' + 'popover belongs to the place of use: the bubble is the node given as content, so give that node ' + 'a background in your CSS.');
		}
		#applySizePlan(element, normalized, args) {
			this.#resetInline(element, SIZE_INLINE_PROPS);
			const reference = args.rects.reference;
			switch (normalized.stretch) {
				case 'width':
					this.#css(element, 'width', `${reference.width}px`);
					break;
				case 'min-width':
					this.#css(element, 'minWidth', `${reference.width}px`);
					break;
				case 'height':
					this.#css(element, 'height', `${reference.height}px`);
					break;
			}
			if (!normalized.constrainSize) {
				return null;
			}
			const maxWidth = Math.max(0, args.availableWidth);
			const maxHeight = Math.max(0, args.availableHeight);
			this.#css(element, 'maxWidth', `${maxWidth}px`);
			this.#css(element, 'maxHeight', `${maxHeight}px`);
			return {
				maxWidth,
				maxHeight
			};
		}
		#startAreaCycle(element) {
			const generation = this.#generation;
			const update = () => {
				void this.#areaUpdate(element, generation);
			};
			this.#update = update;
			this.#normalized = normalizePositioning(this.#positioning, 'area', this.#ignoredAreaOptionsWarned);
			void this.#setupAreaSubscriptions(element, generation, update);
			update();
		}
		async #setupAreaSubscriptions(element, generation, update) {
			const normalized = this.#normalized;
			if (normalized === null) {
				return;
			}
			try {
				const offsetParent = await ui_floatingUi.platform.getOffsetParent(element);
				if (this.#generation !== generation) {
					return;
				}
				const isWindow = offsetParent === this.#defaultView();
				const boundaryElement = main_core.Type.isElementNode(normalized.boundary) ? normalized.boundary : null;
				const isFixed = normalized.strategy === 'fixed';
				if (boundaryElement) {
					this.#cleanups.push(ui_floatingUi.autoUpdate(boundaryElement, element, update));
				}
				if (isFixed && !isWindow) {
					const containingBlock = offsetParent;
					if (boundaryElement) {
						this.#watchAlongside(containingBlock, element, update);
					} else {
						this.#cleanups.push(ui_floatingUi.autoUpdate(containingBlock, element, update));
					}
				} else if (isFixed && normalized.constrainSize && !boundaryElement) {
					this.#cleanups.push(ui_floatingUi.autoUpdate(this.#ownerDocument().documentElement, element, update));
				}
			} catch (error) {
				console.error(`${EVENT_NAMESPACE}: area subscription setup failed.`, error);
			}
		}
		async #areaUpdate(element, generation) {
			const runId = ++this.#runId;
			const isCurrent = () => this.#generation === generation && this.#runId === runId;
			const normalized = this.#normalized;
			if (normalized === null) {
				return;
			}
			this.#css(element, 'position', normalized.strategy);
			try {
				const offsetParent = await ui_floatingUi.platform.getOffsetParent(element);
				if (!isCurrent()) {
					return;
				}
				const translation = await this.#resolveAreaTranslation(normalized, offsetParent);
				if (!isCurrent()) {
					return;
				}
				this.#resetInline(element, AREA_INLINE_PROPS);
				const plan = computeAreaCss({
					area: this.#resolveArea(normalized.boundary),
					padding: normalized.boundaryPadding,
					position: normalized.position,
					alignment: normalized.alignment,
					offset: normalized.offset.base,
					constrainSize: normalized.constrainSize,
					direction: this.#direction,
					translation
				});
				this.#css(element, 'left', plan.left);
				this.#css(element, 'top', plan.top);
				this.#css(element, 'right', plan.right);
				this.#css(element, 'bottom', plan.bottom);
				this.#css(element, 'transform', plan.transform);
				this.#css(element, 'maxWidth', plan.maxWidth);
				this.#css(element, 'maxHeight', plan.maxHeight);
				main_core.Dom.removeClass(element, '--with-pointer');
				const constrained = plan.maxWidth === null || plan.maxHeight === null ? null : {
					maxWidth: Number.parseFloat(plan.maxWidth),
					maxHeight: Number.parseFloat(plan.maxHeight)
				};
				this.#commitState(element, {
					shown: this.#shown,
					positioned: true,
					position: normalized.position,
					alignment: normalized.alignment,
					flipped: false,
					slide: {
						x: 0,
						y: 0
					},
					anchorHidden: false,
					pointerHidden: true,
					constrained,
					rect: toPopoverRect(element.getBoundingClientRect())
				});
			} catch (error) {
				console.error(`${EVENT_NAMESPACE}: area positioning failed.`, error);
				if (isCurrent()) {
					this.#commitState(element, buildState(this.#shown), true);
				}
			}
		}
		async #resolveAreaTranslation(normalized, offsetParent) {
			const boundaryIsViewport = !main_core.Type.isElementNode(normalized.boundary);
			const isWindow = offsetParent === this.#defaultView();
			if (normalized.strategy === 'fixed' && isWindow) {
				return boundaryIsViewport ? {
					mode: 'declarative'
				} : {
					mode: 'pixel',
					origin: {
						x: 0,
						y: 0
					},
					scale: {
						x: 1,
						y: 1
					}
				};
			}
			if (isWindow) {
				const root = this.#ownerDocument().documentElement;
				const scroll = {
					x: root.scrollLeft,
					y: root.scrollTop
				};
				const scrollBarX = root.getBoundingClientRect().left + root.scrollLeft;
				const htmlStyle = getComputedStyle(root);
				const htmlOffset = {
					x: Number.parseFloat(htmlStyle.marginLeft) || 0,
					y: Number.parseFloat(htmlStyle.marginTop) || 0
				};
				return {
					mode: 'pixel',
					origin: windowOffsetParentOrigin(scroll, scrollBarX, htmlOffset),
					scale: {
						x: 1,
						y: 1
					}
				};
			}
			const element = offsetParent;
			const rect = await ui_floatingUi.platform.convertOffsetParentRelativeRectToViewportRelativeRect({
				rect: {
					x: 0,
					y: 0,
					width: 0,
					height: 0
				},
				offsetParent: element,
				strategy: normalized.strategy
			});
			const scale = await ui_floatingUi.platform.getScale(element);
			return {
				mode: 'pixel',
				origin: {
					x: rect.x,
					y: rect.y
				},
				scale
			};
		}
		#resolveArea(boundary) {
			if (main_core.Type.isElementNode(boundary)) {
				const rect = boundary.getBoundingClientRect();
				return {
					x: rect.left + boundary.clientLeft,
					y: rect.top + boundary.clientTop,
					width: boundary.clientWidth,
					height: boundary.clientHeight
				};
			}
			const root = this.#ownerDocument().documentElement;
			return {
				x: 0,
				y: 0,
				width: root.clientWidth,
				height: root.clientHeight
			};
		}
		#commitState(element, state, failed = false) {
			const changed = changedStateFields(this.#state, state);
			const reportFailure = failed && !this.#cycleFailed;
			this.#cycleFailed = failed;
			this.#state = state;
			if (state.positioned) {
				this.#writeAppliedAttributes(element, state);
				main_core.Dom.removeClass(element, '--measuring');
			} else {
				this.#clearAppliedState(element);
			}
			if (changed.length > 0 || reportFailure) {
				const payload = {
					state: cloneState(state),
					changed
				};
				this.emit('onStateChange', payload);
			}
		}
		#writeAppliedAttributes(element, state) {
			if (state.position === null) {
				element.removeAttribute('data-position');
			} else {
				main_core.Dom.attr(element, 'data-position', state.position);
			}
			main_core.Dom.attr(element, 'data-alignment', state.alignment);
			main_core.Dom.attr(element, 'data-flipped', state.flipped ? 'true' : 'false');
			if (state.anchorHidden) {
				main_core.Dom.attr(element, 'data-anchor-hidden', 'true');
			} else {
				element.removeAttribute('data-anchor-hidden');
			}
		}
		#clearAppliedState(element) {
			['data-position', 'data-alignment', 'data-flipped', 'data-anchor-hidden'].forEach(name => {
				element.removeAttribute(name);
			});
			main_core.Dom.removeClass(element, '--with-pointer');
			main_core.Dom.removeClass(element, '--pointer-hidden');
			main_core.Dom.removeClass(element, '--anchor-hidden');
		}
		#alignmentOf(placement) {
			const alignment = placement.split('-')[1];
			return alignment === 'start' || alignment === 'end' ? alignment : 'center';
		}
		#css(element, property, value) {
			main_core.Dom.style(element, property, value);
		}
		#resetInline(element, properties) {
			properties.forEach(property => main_core.Dom.style(element, property, null));
		}
		#ensureElement() {
			if (this.#element) {
				return this.#element;
			}
			const body = this.#resolveBody();
			const pointer = main_core.Tag.render`<div class="ui-system-popover__pointer"></div>`;
			const element = main_core.Tag.render`
			<div class="ui-system-popover">
				${pointer}
			</div>
		`;
			main_core.Dom.append(body, element);
			this.#prepareBody(body);
			this.#element = element;
			this.#pointer = pointer;
			this.#body = body;
			this.#applyAppearance(element);
			return element;
		}
		#resolveBody() {
			const value = this.#content;
			if (main_core.Type.isString(value)) {
				const roots = parseMarkupRoots(value);
				const root = roots.length === 1 ? roots[0] : null;
				if (!main_core.Type.isElementNode(root)) {
					throw new TypeError(`${EVENT_NAMESPACE}: ${CONTENT_SHAPE}. The markup carries ${roots.length} root node(s) ` + 'instead of a single root tag.');
				}
				return root;
			}
			const node = main_core.Type.isFunction(value) ? value() : value;
			if (!main_core.Type.isElementNode(node)) {
				const source = main_core.Type.isFunction(value) ? 'The factory returned' : 'The option holds';
				throw new TypeError(`${EVENT_NAMESPACE}: ${CONTENT_SHAPE}. ${source} no element.`);
			}
			return node;
		}
		#prepareBody(body) {
			main_core.Dom.attr(body, BUBBLE_ATTRIBUTE, '');
			this.#css(body, 'margin', '0');
		}
		#applyAppearance(element) {
			this.#applyClassName(element);
			if (this.#designContext !== null) {
				main_core.Dom.addClass(element, `--ui-context-${this.#designContext}`);
			}
		}
		#applyClassName(element) {
			const before = new Set(element.classList);
			main_core.Dom.addClass(element, this.#className);
			this.#appliedClassNames = [...element.classList].filter(name => !before.has(name));
		}
		#applyHiddenState() {
			this.#unbindCloseHandlers();
			this.#stopPositioning();
			this.#shown = false;
			this.#openedByGesture = false;
			this.#state = buildState(false);
			this.#cycleFailed = false;
			this.#generation += 1;
			if (this.#element) {
				main_core.Dom.addClass(this.#element, '--hidden');
				main_core.Dom.removeClass(this.#element, '--measuring');
				main_core.Dom.removeClass(this.#element, '--anchor-hidden');
			}
		}
		#bindCloseHandlers() {
			const view = this.#defaultView();
			if (view === null) {
				return;
			}
			const captureView = {
				capture: true
			};
			const capturePassive = {
				capture: true,
				passive: true
			};
			if (this.#closeByEsc) {
				main_core.Event.bind(view, 'keyup', this.#handleWindowKeyUp, captureView);
			}
			if (this.#closeByClickOutside) {
				main_core.Event.bind(view, 'click', this.#handleWindowClick, captureView);
				main_core.Event.bind(view.document, 'mousedown', this.#handleGestureStart, capturePassive);
				main_core.Event.bind(view.document, 'mouseup', this.#handleGestureEnd, capturePassive);
				main_core.Event.bind(view.document, 'pointercancel', this.#handleGestureEnd, capturePassive);
			}
		}
		#unbindCloseHandlers() {
			const view = this.#defaultView();
			if (view === null) {
				return;
			}
			const captureView = {
				capture: true
			};
			const capturePassive = {
				capture: true,
				passive: true
			};
			main_core.Event.unbind(view, 'keyup', this.#handleWindowKeyUp, captureView);
			main_core.Event.unbind(view, 'click', this.#handleWindowClick, captureView);
			main_core.Event.unbind(view.document, 'mousedown', this.#handleGestureStart, capturePassive);
			main_core.Event.unbind(view.document, 'mouseup', this.#handleGestureEnd, capturePassive);
			main_core.Event.unbind(view.document, 'pointercancel', this.#handleGestureEnd, capturePassive);
			this.#gestureStartedInside = false;
		}
		#ownerDocument() {
			return this.#mountContainer === null ? document : this.#mountContainer.ownerDocument;
		}
		#defaultView() {
			return this.#ownerDocument().defaultView;
		}
		#handleWindowKeyUp = event => {
			if (event.key !== 'Escape' || this.#element === null) {
				return;
			}
			if (!isVisible(this.#element)) {
				return;
			}
			if (hasVisibleLayerAbove(this.#element)) {
				return;
			}
			event.stopImmediatePropagation();
			this.hide();
		};
		#handleWindowClick = event => {
			const startedInside = this.#gestureStartedInside;
			const openedByGesture = this.#openedByGesture;
			this.#gestureStartedInside = false;
			this.#openedByGesture = false;
			const target = event.target;
			if (this.#element === null || !main_core.Type.isElementNode(target)) {
				return;
			}
			if (!isVisible(this.#element) || this.#element.contains(target)) {
				return;
			}
			if (startedInside) {
				return;
			}
			if (openedByGesture && event.detail !== 0) {
				return;
			}
			const chain = layerChain(this.#element);
			if (hasVisibleLayerAbove(this.#element, chain)) {
				return;
			}
			if (isClosingClick(this.#element, target, chain)) {
				if (event.detail !== 0) {
					event.stopImmediatePropagation();
					event.preventDefault();
				}
				this.hide();
			}
		};
		#handleGestureStart = event => {
			this.#gestureStartedInside = this.#element !== null && main_core.Type.isElementNode(event.target) && this.#element.contains(event.target);
		};
		#handleGestureEnd = () => {
			setTimeout(() => {
				this.#gestureStartedInside = false;
				this.#openedByGesture = false;
			}, 0);
		};
		#isValidContent(content) {
			return main_core.Type.isString(content) || main_core.Type.isDomNode(content) || main_core.Type.isFunction(content);
		}
		#isValidTarget(target) {
			return main_core.Type.isElementNode(target) || isRectTarget(target) || isPointTarget(target);
		}
		#normalizeClassName(className) {
			if (main_core.Type.isPlainObject(className)) {
				return Object.keys(className).filter(name => Boolean(className[name]));
			}
			return main_core.Type.isString(className) || main_core.Type.isArray(className) ? className : [];
		}
		#normalizeDesignContext(designContext) {
			return Object.values(PopoverDesignContext).includes(designContext) ? designContext : null;
		}
	}

	exports.POINTER_DEPTH = POINTER_DEPTH;
	exports.POINTER_PROTRUSION = POINTER_PROTRUSION;
	exports.POINTER_WIDTH = POINTER_WIDTH;
	exports.Popover = Popover;
	exports.PopoverAlignment = PopoverAlignment;
	exports.PopoverDesignContext = PopoverDesignContext;
	exports.PopoverPosition = PopoverPosition;
	exports.PopoverStrategy = PopoverStrategy;
	exports.PopoverStretch = PopoverStretch;
	exports.PopoverTracking = PopoverTracking;

})(this.BX.UI.System.Popover = this.BX.UI.System.Popover || {}, BX, BX.Event, BX.UI.FloatingUi);
//# sourceMappingURL=popover.bundle.js.map
