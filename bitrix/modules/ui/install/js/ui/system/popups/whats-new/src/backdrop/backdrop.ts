import { Dom, Event, Tag, Type } from 'main.core';

import { type WhatsNewColor, WhatsNewBackdrop } from '../const';
import {
	type WhatsNewBackdropContext,
	type WhatsNewBackdropEffect,
	type WhatsNewBackdropOrigin,
	type WhatsNewColorScheme,
	type WhatsNewGradient,
} from '../types';
import { BalloonsEffect } from './effects/balloons';
import { BubbleEffect } from './effects/bubble';
import { SparkleEffect } from './effects/sparkle';
import { WaterEffect } from './effects/water';
import { BackdropEngine } from './engine';
import { type BackdropGlowSpot, BackdropGeometry } from './geometry';
import { BackdropVariable, getColorScheme } from './palette';

import './backdrop.css';

// The block of the backdrop, and a layer of it: the base, a spot of glow, the vignette - and the canvas of
// a moving effect, which is a layer of the very same kind and is handed this name by the backdrop. Every
// layer lies over the whole card, under the content, and is deaf to the pointer.
const BLOCK_CLASS = 'ui-system-whats-new-backdrop';
const LAYER_CLASS = `${BLOCK_CLASS}__layer`;
// The one part of the composition the stylesheet has a rule for: the spots of the glow are blended into the
// base, and the base and the vignette are painted by their fill alone.
const GLOW_CLASS = '--glow';

/**
 * The reveal of a scheme laid over the one already on the card, in the numbers of the mockup. A colour
 * swapped in place reads as a blink, while a circle growing from under the row of buttons ties the change
 * to what caused it.
 */
const REVEAL_DURATION = 620;
const REVEAL_EASING = 'cubic-bezier(0.22, 0.61, 0.36, 1)';
// A circle of one and a half of the card covers it whole, corners included.
const REVEAL_RADIUS = 1.5;
// The row of buttons stands at the bottom centre of the card, and a change of scheme starts from there.
const DEFAULT_ORIGIN: WhatsNewBackdropOrigin = Object.freeze({ x: 0.5, y: 1 });

// A window nobody looks at holds the timeline of its animations, and the reveal never reports itself back
// then. The stack is settled by a timer as well, so that the lock of the reveal never stays shut.
const SETTLE_DELAY = 150;

type BackdropEffectFactory = (scheme: WhatsNewColorScheme) => WhatsNewBackdropEffect<WhatsNewBackdropContext>;

/*
 * The moving effects, by the value of the option that names them. The dictionary of values is declared full
 * from the start while the engines arrive one at a time, so a value whose engine is not written yet is
 * simply absent here - and an absent engine is the same outcome as `None`: the static composition of the
 * scheme. An engine arrives as one line in this table and nothing else.
 */
const EFFECTS: Partial<Record<WhatsNewBackdrop, BackdropEffectFactory>> = {
	[WhatsNewBackdrop.Sparkle]: (scheme: WhatsNewColorScheme) => new SparkleEffect(scheme),
	[WhatsNewBackdrop.Water]: (scheme: WhatsNewColorScheme) => new WaterEffect(scheme),
	[WhatsNewBackdrop.Bubble]: (scheme: WhatsNewColorScheme) => new BubbleEffect(scheme),
	[WhatsNewBackdrop.Balloons]: (scheme: WhatsNewColorScheme) => new BalloonsEffect(scheme),
};

type BackdropOptions = {
	color: WhatsNewColor;
	effect?: WhatsNewBackdrop;
};

const toPercent = (share: number): string => `${Math.round(share * 1000) / 10}%`;

const cssVariable = (name: string): string => `var(${name})`;

const toLinearGradient = ({ direction, stops }: WhatsNewGradient): string => {
	const run: string = stops.map(([offset, color]) => `${color} ${toPercent(offset)}`).join(', ');

	return `linear-gradient(${direction}, ${run})`;
};

// The raster of a scheme that names one is asked for only here, while the layer of that very scheme is being
// built, so it never travels with the bundle and never loads for a scheme nobody chose. Until it arrives the
// fill under it is what is seen.
const toBaseFill = (scheme: WhatsNewColorScheme): string => {
	const fill: string = scheme.gradient
		? toLinearGradient(scheme.gradient)
		: cssVariable(BackdropVariable.Base);

	return scheme.image ? `url("${scheme.image}") center / cover no-repeat, ${fill}` : fill;
};

const toGlowFill = ({ x, y, radius }: BackdropGlowSpot): string => {
	const size: string = `${toPercent(radius)} ${toPercent(radius)}`;

	// The softness of a spot is the gradient itself, and the blur token of the styles only strengthens it:
	// the composition has to hold up on a machine where the portal zeroes every blur token.
	return `radial-gradient(${size} at ${toPercent(x)} ${toPercent(y)}, ${cssVariable(BackdropVariable.Glow)} 0%, transparent 100%)`;
};

// The point of a reveal comes in shares of the card, so a scheme changed on a window of any width and at
// any place of the screen grows from the same spot of the card. A point that is not a pair of numbers is
// the default one - a broken clip would show the whole new scheme at once.
const toOrigin = (origin: WhatsNewBackdropOrigin): WhatsNewBackdropOrigin => {
	return Type.isNumber(origin?.x) && Type.isNumber(origin?.y) ? origin : DEFAULT_ORIGIN;
};

const toCircle = (radius: number, { x, y }: WhatsNewBackdropOrigin): string => {
	return `circle(${toPercent(radius)} at ${toPercent(x)} ${toPercent(y)})`;
};

const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';

/*
 * The setting is asked of the browser through one query object and not through a fresh one per reading: the
 * backdrop both reads the setting and listens to it, and a query nobody holds cannot be listened to. In the
 * sources of the mockup the setting is read once at the start of an effect, so a user who turns it on with
 * the window already open goes on watching the motion they asked to be spared.
 */
let reducedMotionQuery: MediaQueryList | null = null;

const getReducedMotionQuery = (): MediaQueryList => {
	reducedMotionQuery ??= window.matchMedia(REDUCED_MOTION_QUERY);

	return reducedMotionQuery;
};

// Motion is decoration: a user who asked for less of it gets the new scheme at once and the backdrop stands
// still.
const prefersReducedMotion = (): boolean => getReducedMotionQuery().matches;

const toVignetteFill = (): string => {
	const { x, y, radius, clearUntil } = BackdropGeometry.vignette;
	const size: string = `${toPercent(radius)} ${toPercent(radius)}`;
	const base: string = cssVariable(BackdropVariable.Base);

	return `radial-gradient(${size} at ${toPercent(x)} ${toPercent(y)}, transparent ${toPercent(clearUntil)}, ${base} 100%)`;
};

/**
 * The backdrop of the card: the colour scheme drawn as four layers lying under all of the content. The unit
 * owns its node and nothing besides it - where the node hangs is the business of the window.
 *
 * The layers of a scheme live in a stack of their own, one node per scheme: a change of scheme lays the new
 * scheme over the one already there and reveals it by a growing circle, and a stack is what such a reveal
 * needs to happen in.
 *
 * A moving effect is drawn over that stack by an engine of its own, and whether there is one at all is
 * decided here and in one method only - see `#syncEffect()`. The static composition is not the fallback of
 * the effect but the ground it lies on, so every refusal comes down to taking the canvas away.
 */
export class Backdrop
{
	#color: WhatsNewColor;
	#container: HTMLElement | null = null;

	// The effect the consumer asked for, and the engine drawing it - or nothing at all, which is what every
	// refusal comes down to.
	#effect: WhatsNewBackdrop;
	#engine: BackdropEngine | null = null;

	// The scheme the card is showing, the top of the stack. The one underneath it is only there while a
	// reveal runs, and the reveal itself is the lock of it: while there is an animation the scheme does not
	// change, so a hail of calls never lays a third layer over the two the reveal works with.
	#scheme: HTMLElement | null = null;
	#reveal: Animation | null = null;
	#settleTimer: ReturnType<typeof setTimeout> | null = null;

	constructor(options: BackdropOptions)
	{
		this.#color = options.color;
		this.#effect = options.effect ?? WhatsNewBackdrop.None;

		Event.bind(getReducedMotionQuery(), 'change', this.#handleMotionChange);
	}

	// The node is built once and handed out as it is: a rebuild of the content moves the very same backdrop
	// under the new content instead of drawing a fresh one and losing the state of the stack.
	render(): HTMLElement
	{
		if (!this.#container)
		{
			this.#container = this.#renderContainer();
			this.#syncEffect();
		}

		return this.#container;
	}

	/**
	 * Puts the card on another colour scheme. Answers whether the change is taken: the scheme the card is
	 * already showing and a call made while a reveal runs are both turned down.
	 */
	setColor(color: WhatsNewColor, origin: WhatsNewBackdropOrigin = DEFAULT_ORIGIN): boolean
	{
		if (color === this.#color || this.#reveal)
		{
			return false;
		}

		this.#color = color;
		this.#engine?.setScheme(getColorScheme(color));

		// A window that has not been shown yet has no stack to reveal anything in: the scheme is remembered
		// and the first render draws it.
		if (this.#container)
		{
			this.#changeScheme(this.#container, color, toOrigin(origin));
		}

		return true;
	}

	destroy(): void
	{
		Event.unbind(getReducedMotionQuery(), 'change', this.#handleMotionChange);

		this.#dropEffect();
		this.#stopReveal();

		if (this.#container)
		{
			Dom.remove(this.#container);
			this.#container = null;
			this.#scheme = null;
		}
	}

	/**
	 * The one place that decides whether the backdrop moves or stands still. Every way an effect can fail
	 * comes here: an effect no engine has arrived for, the reduced-motion setting, a drawing context the
	 * browser refused to give and one it took back. The outcome is one and the same - the static composition
	 * of that very colour scheme, already lying under the canvas - and nothing is said about it to the user
	 * or to the console.
	 *
	 * A machine the portal zeroed the blur tokens on is not one of those ways: the softness of a spot is the
	 * gradient itself and the token only strengthens it, so there the effect goes on without the blur.
	 */
	#syncEffect(): void
	{
		const factory: BackdropEffectFactory | undefined = EFFECTS[this.#effect];

		if (!this.#container || !factory || prefersReducedMotion())
		{
			this.#dropEffect();

			return;
		}

		if (this.#engine)
		{
			return;
		}

		const engine: BackdropEngine = new BackdropEngine({
			host: this.#container,
			canvasClass: LAYER_CLASS,
			effect: factory(getColorScheme(this.#color)),
			onContextLost: this.#handleContextLost,
		});

		this.#engine = engine;

		if (!engine.start())
		{
			this.#dropEffect();
		}
	}

	// The engine goes away whole and not just idle: a canvas left over the card would hide the composition
	// it has stopped drawing.
	#dropEffect(): void
	{
		this.#engine?.destroy();
		this.#engine = null;
	}

	#changeScheme(container: HTMLElement, color: WhatsNewColor, origin: WhatsNewBackdropOrigin): void
	{
		const previous: HTMLElement | null = this.#scheme;
		const node: HTMLElement = this.#renderScheme(color);

		this.#scheme = node;

		/*
		 * There is a stack to reveal only while the composition of the card is the one drawn by the styles.
		 * In the reduced-motion mode there is no stack at all, and under a running effect the composition is
		 * the canvas: the effect took the new scheme the moment it was named, the layers below it are not
		 * seen, and a circle growing under the canvas would be a reveal of nothing.
		 */
		if (prefersReducedMotion() || this.#engine)
		{
			this.#stackScheme(container, node);
			Dom.remove(previous);

			return;
		}

		this.#revealScheme(container, node, previous, origin);
	}

	/*
	 * Puts a scheme into the stack of the backdrop, under the canvas of the effect. The layers carry no floor
	 * of their own, so the order they stand in is the order they are painted in, and a scheme appended last
	 * would cover a running effect for good - the canvas keeps drawing frames nobody sees any more.
	 */
	#stackScheme(container: HTMLElement, node: HTMLElement): void
	{
		const canvas: HTMLElement | null = container.querySelector(':scope > canvas');

		if (canvas)
		{
			Dom.insertBefore(node, canvas);

			return;
		}

		Dom.append(node, container);
	}

	// The new scheme is laid over the one on the card and let out by a growing circle. It goes into the stack
	// clipped to nothing already: appended as it is, the whole of it would flash before the first frame of
	// the reveal.
	#revealScheme(
		container: HTMLElement,
		node: HTMLElement,
		previous: HTMLElement | null,
		origin: WhatsNewBackdropOrigin,
	): void
	{
		const from: string = toCircle(0, origin);
		const to: string = toCircle(REVEAL_RADIUS, origin);

		Dom.style(node, 'clipPath', from);
		this.#stackScheme(container, node);

		const reveal: Animation = node.animate(
			[{ clipPath: from }, { clipPath: to }],
			{ duration: REVEAL_DURATION, easing: REVEAL_EASING, fill: 'forwards' },
		);

		const settle = (): void => this.#settle(node, previous);

		this.#reveal = reveal;
		reveal.onfinish = settle;
		this.#settleTimer = setTimeout(settle, REVEAL_DURATION + SETTLE_DELAY);
	}

	// The scheme underneath is taken away only once the new one covers the card whole: taken away earlier,
	// the empty first frame of the fresh one is seen as a blink. The clip goes with it, and the lock opens.
	#settle(node: HTMLElement, previous: HTMLElement | null): void
	{
		if (!this.#reveal)
		{
			return;
		}

		this.#stopReveal();

		Dom.style(node, 'clipPath', null);
		Dom.remove(previous);
	}

	#stopReveal(): void
	{
		if (this.#settleTimer !== null)
		{
			clearTimeout(this.#settleTimer);
			this.#settleTimer = null;
		}

		this.#reveal?.cancel();
		this.#reveal = null;
	}

	#renderContainer(): HTMLElement
	{
		// Decorative through and through: the whole subtree is hidden from assistive technology here, and the
		// styles let every pointer through to the content above.
		const container: HTMLElement = Tag.render`
			<div class="${BLOCK_CLASS}" aria-hidden="true" data-testid="announce-dialog-backdrop"></div>
		`;

		this.#scheme = this.#renderScheme(this.#color);
		Dom.append(this.#scheme, container);

		return container;
	}

	#renderScheme(color: WhatsNewColor): HTMLElement
	{
		const scheme: WhatsNewColorScheme = getColorScheme(color);

		const node: HTMLElement = Tag.render`
			<div class="${BLOCK_CLASS}__scheme" data-color="${color}"></div>
		`;

		// The two colours of the scheme reach the layers as local variables, so that a layer says which part
		// of the composition it paints and never which colour it paints with.
		Dom.style(node, BackdropVariable.Base, scheme.base);
		Dom.style(node, BackdropVariable.Glow, scheme.glow);

		Dom.append(this.#renderLayer('base', toBaseFill(scheme)), node);
		BackdropGeometry.glow.forEach((spot: BackdropGlowSpot) => {
			Dom.append(this.#renderLayer('glow', toGlowFill(spot), GLOW_CLASS), node);
		});
		Dom.append(this.#renderLayer('vignette', toVignetteFill()), node);

		return node;
	}

	/*
	 * The fill of a layer is composed from the geometry of the composition and not written in the stylesheet:
	 * the numbers belong to one declaration the canvas brush reads as well. Which part of the composition a
	 * layer paints is said by its test id; a class is added only where the stylesheet has a rule under it,
	 * and of the three parts that is the glow alone.
	 */
	#renderLayer(part: string, fill: string, modifier: string = ''): HTMLElement
	{
		const classes: string = [LAYER_CLASS, modifier].filter(Boolean).join(' ');
		const layer: HTMLElement = Tag.render`
			<div class="${classes}" data-testid="announce-dialog-backdrop-${part}"></div>
		`;

		Dom.style(layer, 'background', fill);

		return layer;
	}

	// The setting is taken both ways with the window open: turned on it stops the effect, turned off it
	// starts the effect anew, and neither needs the window to be opened again.
	#handleMotionChange = (): void => {
		this.#syncEffect();
	};

	#handleContextLost = (): void => {
		this.#dropEffect();
	};
}
