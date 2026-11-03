import { Dom, Event, Tag, Type } from 'main.core';

import {
	type WhatsNewScene,
	type WhatsNewSceneLayer,
	type WhatsNewSceneLayers,
} from '../types';

import './scene.css';

const BLOCK_CLASS = 'ui-system-whats-new-scene';

/**
 * Where the scene is placed. The card and the layer the graphics flies out into show the same scene, so the
 * three placements are three variants of one unit and not three units:
 * - `Card` - the whole scene inside the card: the zone and the composition standing in it;
 * - `Reserve` - the zone without the composition, for when the graphics was taken out onto a layer of its own
 *   and the zone has to keep the room it took;
 * - `Art` - the bare graphics, with no zone under it, for that very layer.
 */
export const SceneVariant = Object.freeze({
	Card: 'card',
	Reserve: 'reserve',
	Art: 'art',
});

export type SceneVariant = typeof SceneVariant[keyof typeof SceneVariant];

// The variables the layout of the scene is written through: the geometry of a layer arrives as plain styles,
// while the numbers of the motion arrive as these, because the keyframes are what reads them.
const SceneVariable = Object.freeze({
	Aspect: '--ui-system-whats-new-scene-aspect',
	Shift: '--ui-system-whats-new-scene-shift',
	Tilt: '--ui-system-whats-new-scene-tilt',
	Growth: '--ui-system-whats-new-scene-growth',
	Period: '--ui-system-whats-new-scene-period',
	Delay: '--ui-system-whats-new-scene-delay',
	PointerX: '--ui-system-whats-new-scene-pointer-x',
	PointerY: '--ui-system-whats-new-scene-pointer-y',
	Travel: '--ui-system-whats-new-scene-travel',
	Clearance: '--ui-system-whats-new-scene-clearance',
});

/*
 * The frame the layers are laid out in keeps a proportion of its own. The zone is of one height and of the
 * width of the card, the card comes in three widths, and the geometry of the layers is written in shares of
 * the frame - so without a proportion of its own the composition would spread out with the card instead of
 * scaling with it. The proportion of the layered scenes of the mockup is the one taken by default.
 */
const DEFAULT_FRAME_ASPECT = 1.4707;

// The plane a layer stands in when it names none: the whole scene in one plane reads as a flat picture, which
// is what a scene of a single layer is.
const DEFAULT_DEPTH = 1;

/*
 * The mechanics of the drift, in the numbers of the layered scenes of the mockup: how high a layer rises, how
 * far it tilts at the top of the rise, how long a cycle lasts and how long the layer waits before the first
 * one. What arrives from the consumer is held inside these bounds - the sprites and the coordinates are the
 * business of the consumer, the motion is the business of the component.
 */
const SHIFT_MIN = 3;
const SHIFT_MAX = 9;
const SHIFT_DEFAULT = 6;
const TILT_MAX = 3;
const PERIOD_MIN = 4;
const PERIOD_MAX = 17;
const DELAY_MAX = 2.8;

/*
 * The step between the periods of two layers. The periods have to differ: a shift of the phase is no help
 * here, because layers of one period part once and travel side by side ever after. The step walks the range
 * of the periods and shares no whole multiple with it, so every layer of a list of any sane length gets a
 * beat of its own.
 */
const PERIOD_STEP = 0.7;

// How far a decorative spark grows towards the middle of its cycle.
const SPARK_GROWTH = 1.35;

/*
 * How far a layer travels after the pointer, by the plane it stands in: the farthest plane barely stirs, the
 * nearest one travels the most, and that difference is the whole of the depth the flat picture gains. The
 * table is the one of the layered scenes of the mockup.
 */
const TRAVEL_BY_PLANE = [4, 9, 14, 24, 26];

/*
 * How far from the middle of the scene the pointer has to stand for a layer to travel its whole way, in sizes
 * of the scene. The reach is wider than the scene itself, and wider still downwards, so the composition
 * answers a pointer that walks the card around it and never slams into the end of its travel.
 */
const REACH_X = 1.4;
const REACH_Y = 2.2;

/*
 * The room the clip of the frame leaves the composition beyond it. A clip along the very edge of the frame
 * eats the edge of a layer that travelled with the pointer - the layer standing at the top edge most of all -
 * so the clip gets the longest travel there is and a little over it.
 */
const CLEARANCE_OVER_TRAVEL = 8;
const CLEARANCE = Math.max(...TRAVEL_BY_PLANE) + CLEARANCE_OVER_TRAVEL;

// The place of the pointer is a share and is written to four decimals: a card is no wider than a couple of
// thousand pixels, so a finer share moves no layer by even a tenth of one.
const POINTER_PRECISION = 4;

const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';

// The numbers of the motion are kept to tenths: they are read by a human out of the styles, and a period of
// 6.500000000000001 seconds tells no more than one of 6.5.
const TENTH = 10;

const round = (value: number): number => Math.round(value * TENTH) / TENTH;

const clamp = (value: number, min: number, max: number): number => Math.min(Math.max(value, min), max);

const toNumber = (value: unknown, fallback: number): number => (Type.isNumber(value) ? value : fallback);

const prefersReducedMotion = (): boolean => window.matchMedia(REDUCED_MOTION_QUERY).matches;

/**
 * The layers of a composition, whichever of its two forms it arrived in - a bare list, or a list together
 * with the proportion of the frame it was cut to. Anything that carries no list of layers is no scene and has
 * none of them.
 */
export const getSceneLayers = (content: WhatsNewScene): WhatsNewSceneLayer[] => {
	if (Array.isArray(content))
	{
		return content;
	}

	const layers: unknown = (content as WhatsNewSceneLayers).layers;

	return Array.isArray(layers) ? layers as WhatsNewSceneLayer[] : [];
};

// A bare list of layers names no proportion of its own and takes the one of the layered scenes of the mockup.
// A proportion that is no proportion - nought or less - is taken for none at all: it would collapse the frame.
const getSceneAspect = (content: WhatsNewScene): number => {
	const aspect: number = toNumber((content as WhatsNewSceneLayers).aspect, DEFAULT_FRAME_ASPECT);

	return aspect > 0 ? aspect : DEFAULT_FRAME_ASPECT;
};

// A layer that names no geometry covers the frame whole: that is how a composition already cut into one frame
// arrives, and it needs no coordinates of its own.
const toGeometry = (layer: WhatsNewSceneLayer): Record<string, string> | null => {
	if (!Type.isNumber(layer.left) && !Type.isNumber(layer.top) && !Type.isNumber(layer.width))
	{
		return null;
	}

	return {
		left: `${toNumber(layer.left, 0)}%`,
		top: `${toNumber(layer.top, 0)}%`,
		width: `${toNumber(layer.width, 100)}%`,
	};
};

// The travel of a plane. A plane beyond the table travels as much as the outermost plane the table knows: the
// planes are the order the layers cover one another in, and a consumer is free to count them from any number.
const travelOfPlane = (plane: number): number => {
	return TRAVEL_BY_PLANE[clamp(plane, 1, TRAVEL_BY_PLANE.length) - 1];
};

// Hands the wrapper of a layer the travel of the plane it stands in.
const applyTravel = (node: HTMLElement, plane: number): void => {
	Dom.style(node, SceneVariable.Travel, `${travelOfPlane(plane)}px`);
};

// Walks the range of the periods by the step, so that a scene naming no periods of its own still moves layer
// by layer to its own beat.
const periodOfIndex = (index: number): number => {
	const range: number = (PERIOD_MAX - PERIOD_MIN) * TENTH;

	return PERIOD_MIN + ((index * PERIOD_STEP * TENTH) % range) / TENTH;
};

// The delays are spread the same way and stay inside the wait the mockup allows.
const delayOfIndex = (index: number): number => {
	const range: number = (DELAY_MAX + PERIOD_STEP) * TENTH;

	return ((index * PERIOD_STEP * TENTH) % range) / TENTH;
};

// The next beat of the ladder, wrapped back to the start of the range once it walks past the end of it.
const nextPeriod = (period: number): number => {
	const next: number = round(period + PERIOD_STEP);

	return next > PERIOD_MAX ? round(PERIOD_MIN + next - PERIOD_MAX) : next;
};

// The beat a layer ends up on: the one it asked for, held inside the bounds and moved on by a step for as
// long as another layer of the scene already stands on it.
const takePeriod = (requested: number, taken: Set<number>): number => {
	let period: number = round(clamp(requested, PERIOD_MIN, PERIOD_MAX));

	for (let attempt = 0; taken.has(period) && attempt <= taken.size; attempt++)
	{
		period = nextPeriod(period);
	}

	taken.add(period);

	return period;
};

/*
 * A layer is two nodes and not one, and it stays that way: the wrapper is where the layer travels after the
 * pointer and the sprite inside it is where the drift of the layer lives. An element has a single transform,
 * so on one node the two would wipe each other out.
 */
const renderLayer = (layer: WhatsNewSceneLayer, index: number, taken: Set<number>): HTMLElement => {
	const sprite: HTMLElement = Tag.render`
		<img
			class="${BLOCK_CLASS}__sprite"
			src="${layer.src}"
			alt=""
			data-testid="announce-dialog-scene-sprite-${index}"
		>
	`;

	Dom.style(sprite, SceneVariable.Shift, `${clamp(toNumber(layer.shift, SHIFT_DEFAULT), SHIFT_MIN, SHIFT_MAX)}px`);
	Dom.style(sprite, SceneVariable.Tilt, `${clamp(toNumber(layer.tilt, 0), -TILT_MAX, TILT_MAX)}deg`);
	Dom.style(sprite, SceneVariable.Period, `${takePeriod(toNumber(layer.period, periodOfIndex(index)), taken)}s`);
	Dom.style(sprite, SceneVariable.Delay, `${clamp(toNumber(layer.delay, delayOfIndex(index)), 0, DELAY_MAX)}s`);

	if (layer.spark === true)
	{
		Dom.style(sprite, SceneVariable.Growth, String(SPARK_GROWTH));
	}

	const geometry: Record<string, string> | null = toGeometry(layer);
	const className: string = geometry === null ? `${BLOCK_CLASS}__layer --cover` : `${BLOCK_CLASS}__layer`;

	const wrapper: HTMLElement = Tag.render`
		<div class="${className}" data-testid="announce-dialog-scene-layer-${index}">${sprite}</div>
	`;

	// The plane of the layer is what it covers here, and how far it travels after the pointer right below.
	const plane: number = Math.trunc(toNumber(layer.depth, DEFAULT_DEPTH));

	Dom.style(wrapper, 'zIndex', String(plane));
	applyTravel(wrapper, plane);

	if (geometry !== null)
	{
		Dom.style(wrapper, geometry);
	}

	return wrapper;
};

type PointerPlace = {
	x: number;
	y: number;
};

type SceneOptions = {
	content: WhatsNewScene;
	variant?: SceneVariant;
	// Whether the composition follows the pointer. A moving effect of the backdrop answers the pointer with a
	// motion of its own, and the two answers now and then compete for attention, so the follow is an axis of
	// the consumer.
	parallax?: boolean;
};

/**
 * The graphics of the announcement, standing in the media zone of the card: a list of layers the component
 * lays out itself and gives a life of its own to.
 *
 * The unit owns its node and nothing besides it: where the node hangs is the business of the card. Nothing of
 * the graphics itself is brought in - not a sprite, not a library: the mechanics belong to the component and
 * the content to the consumer.
 */
export class Scene
{
	#content: WhatsNewScene;
	#variant: SceneVariant;
	#parallax: boolean;

	#node: HTMLElement | null = null;

	/*
	 * The node the place of the pointer is measured against: the frame the composition is laid out in. Until
	 * there is one, nothing of the scene follows the pointer - that is how a zone reserving the room of a flown
	 * composition stands still.
	 */
	#followed: HTMLElement | null = null;

	// Where the last move of the pointer landed on the page. The place of it over the scene is counted once a
	// frame: asking the page for the box of the frame on every move is a layout the walk would pay for.
	#pointerPlace: PointerPlace | null = null;
	#request: number | null = null;
	#tracking: boolean = false;

	constructor(options: SceneOptions)
	{
		this.#content = options.content;
		this.#variant = options.variant ?? SceneVariant.Card;
		this.#parallax = options.parallax !== false;
	}

	// The node is built once and handed out as it is: a rebuild of the card moves the very same scene into the
	// new content instead of fetching and decoding every sprite of it a second time.
	render(): HTMLElement
	{
		if (!this.#node)
		{
			this.#node = this.#renderScene();
			this.#track();
		}

		return this.#node;
	}

	/*
	 * The follow of the pointer is taken up only while the scene is the one on the screen. A card keeps its
	 * scene through a close so that the next show does not fetch every sprite again, and a ring keeps the
	 * slides beside the shown one laid out ahead of the turn - neither needs an ear on the pointer meanwhile.
	 */
	setTracking(active: boolean): void
	{
		if (active)
		{
			this.#track();

			return;
		}

		this.#stopTracking();
	}

	// The scene holds its node and lets go of it here, so that a card nobody shows any more holds no tree of
	// pictures behind it and no ear on the pointer of the page.
	destroy(): void
	{
		this.#stopTracking();
		this.#node = null;
		this.#followed = null;
	}

	/*
	 * The scene follows the pointer while there is a composition in it to move and while the user has not asked
	 * to be spared the motion; in that mode the follow is not taken up at all. The move is listened for on the
	 * window: every node of the scene lets the pointer through to the card, so a move over the scene itself
	 * would never be heard of.
	 */
	#track(): void
	{
		if (this.#tracking || !this.#parallax || !this.#followed || prefersReducedMotion())
		{
			return;
		}

		this.#tracking = true;
		Event.bind(window, 'pointermove', this.#handlePointerMove, { passive: true });
	}

	#stopTracking(): void
	{
		this.#tracking = false;
		Event.unbind(window, 'pointermove', this.#handlePointerMove);

		if (this.#request !== null)
		{
			cancelAnimationFrame(this.#request);
			this.#request = null;
		}
	}

	#handlePointerMove = (event: PointerEvent): void => {
		this.#pointerPlace = { x: event.clientX, y: event.clientY };

		if (this.#request === null)
		{
			this.#request = requestAnimationFrame(this.#handleFrame);
		}
	};

	/*
	 * The place of the pointer goes into two variables of the root of the scene and never into the markup: a
	 * composition is a dozen and a half of layers, and building that tree anew on every move of a walk is a
	 * price the card would pay for nothing. What reads the variables is what travels in the scene: the wrapper
	 * of every layer.
	 */
	#handleFrame = (): void => {
		this.#request = null;

		const place: PointerPlace | null = this.#pointerPlace;
		const followed: HTMLElement | null = this.#followed;

		if (!place || !followed || !this.#node)
		{
			return;
		}

		const box: DOMRect = followed.getBoundingClientRect();
		if (box.width === 0 || box.height === 0)
		{
			return;
		}

		const x: number = (place.x - (box.left + box.width / 2)) / (box.width * REACH_X);
		const y: number = (place.y - (box.top + box.height / 2)) / (box.height * REACH_Y);

		Dom.style(this.#node, SceneVariable.PointerX, clamp(x * 2, -1, 1).toFixed(POINTER_PRECISION));
		Dom.style(this.#node, SceneVariable.PointerY, clamp(y * 2, -1, 1).toFixed(POINTER_PRECISION));
	};

	#renderScene(): HTMLElement
	{
		// The whole scene is decoration: it takes no pointer and is hidden from assistive technology - what the
		// announcement says is said by the text of the card.
		return Tag.render`
			<div class="${this.#getClassName()}" aria-hidden="true" data-testid="announce-dialog-scene">
				${this.#renderBody()}
			</div>
		`;
	}

	// The zone keeps the room of the graphics it does not draw: the composition went out onto a layer of its
	// own, and a zone that let it go and shrank would pull the card up from under it. Nothing else stands in
	// the zone, so a reserving one draws nothing at all.
	#renderBody(): HTMLElement | string
	{
		if (this.#variant === SceneVariant.Reserve)
		{
			return '';
		}

		return this.#renderFrame(getSceneLayers(this.#content));
	}

	#renderFrame(layers: WhatsNewSceneLayer[]): HTMLElement
	{
		// The beats are handed out for the list and not layer by layer: they have to differ from one another,
		// and that is a property of the whole composition.
		const taken: Set<number> = new Set();

		const frame: HTMLElement = Tag.render`
			<div class="${BLOCK_CLASS}__frame" data-testid="announce-dialog-scene-frame">
				${layers.map((layer, index) => renderLayer(layer, index, taken))}
			</div>
		`;

		Dom.style(frame, SceneVariable.Aspect, String(getSceneAspect(this.#content)));
		Dom.style(frame, SceneVariable.Clearance, `${CLEARANCE}px`);

		this.#followed = frame;

		return frame;
	}

	#getClassName(): string
	{
		return `${BLOCK_CLASS} --${this.#variant}`;
	}
}
