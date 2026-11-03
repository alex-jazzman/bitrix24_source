import { type BaseEvent } from 'main.core.events';
import { type Button } from 'ui.buttons';

import {
	type WhatsNewActionsAlign,
	type WhatsNewBackdrop,
	type WhatsNewColor,
	type WhatsNewGalleryNav,
	type WhatsNewMediaPosition,
	type WhatsNewSize,
} from './const';

// A row of the change list. The icon is a value of the Outline set of ui.icon-set, not a raw name.
export type WhatsNewItem = {
	icon: string;
	title: string;
	description?: string;
	// A title with the accent stands out of the row by its weight.
	accent?: boolean;
	testId?: string;
	// A row with a handler is a button; without one it is a descriptive block, out of the tab order.
	onClick?: () => void;
};

// A stop of a gradient of the palette: the share of the run it stands at and the colour it brings. The
// share is kept as a fraction, so that one declaration serves both a fill of the styles and a brush of a
// canvas.
export type WhatsNewGradientStop = [offset: number, color: string];

// The direction is written the way CSS writes it: an angle or a corner, as the mockup declares it.
export type WhatsNewGradient = {
	direction: string;
	stops: WhatsNewGradientStop[];
};

// A colour scheme of the backdrop: the darkest part of the card and the colour of the glow over it. A scheme
// drawn by a multicolour fill carries the gradient of it, and a scheme drawn by a ready raster the address
// of that raster.
export type WhatsNewColorScheme = {
	base: string;
	glow: string;
	gradient?: WhatsNewGradient;
	image?: string;
};

// The point a change of colour scheme grows its circle from, in shares of the card: the left and the top
// edge of it are 0, the right and the bottom one 1. Shares and not pixels of the screen - the card is of a
// different width at every size and stands wherever the window stands.
export type WhatsNewBackdropOrigin = {
	x: number;
	y: number;
};

// Where the pointer stands over the card, in shares of it. Once the pointer leaves the card the shares hold
// the place it left at, so the composition never snaps back.
export type WhatsNewBackdropPointer = {
	x: number;
	y: number;
	inside: boolean;
};

/*
 * The two ways the engine can be asked to draw. Nearly every effect paints the picture by hand and takes
 * the plain context; an effect that hands the whole frame over to the hardware asks for the other one and
 * gets the very same care of size, visibility and destruction from the engine.
 */
export type WhatsNewBackdropContextKind = '2d' | 'webgl2';
export type WhatsNewBackdropContext = CanvasRenderingContext2D | WebGL2RenderingContext;

// What an effect is handed every frame. The canvas, the size of it, the subscriptions and the loop itself
// belong to the engine; the effect only draws.
export type WhatsNewBackdropFrame<TContext = CanvasRenderingContext2D> = {
	context: TContext;
	// The drawing area, in pixels of the card.
	width: number;
	height: number;
	pointer: WhatsNewBackdropPointer;
	// How long the engine has been drawing, ms. The time it stood still is not counted in.
	time: number;
	// Time since the previous frame, ms, capped: a pause must not arrive as one huge step.
	delta: number;
};

// The changing part of the engine: one effect, one way to draw. A scheme is set through the engine, and an
// effect that holds resources of its own gives them back on destruction.
export type WhatsNewBackdropEffect<TContext = CanvasRenderingContext2D> = {
	// Which context the effect draws with. An effect that says nothing draws with the plain one.
	readonly contextKind?: WhatsNewBackdropContextKind;
	/*
	 * The context, handed over once and before the first frame. An effect that has to build something on
	 * it - the programs of the hardware pipeline - says here whether it managed to. A refusal comes back
	 * out of `start()` and lands on the one path of refusal there is: the static composition.
	 */
	prepare?(context: TContext): boolean;
	/*
	 * Everything taken from the context is given back. The pair of `prepare()`: the browser takes the
	 * drawing context back whenever it likes, and what was built on it dies with it, so the effect lets go
	 * of the handles it holds and is prepared anew once the context comes back. What the effect owns beyond
	 * the context is not touched here and goes at `destroy()`.
	 */
	release?(): void;
	draw(frame: WhatsNewBackdropFrame<TContext>): void;
	/*
	 * Whether the effect has nothing left of its own to draw. An effect at rest stands the loop of frames
	 * still until the pointer moves again: a card nobody touches is a picture, and a picture is not worth a
	 * frame sixty times a second. An effect that never rests simply does not answer.
	 */
	isResting?(): boolean;
	/*
	 * A press on the card, in shares of it. Every layer of the backdrop is decoration and lets the pointer
	 * through to the content over it, so an effect never hears a press of its own: the engine hands over the
	 * presses that landed on the card and cancels none of them.
	 */
	press?(pointer: WhatsNewBackdropPointer): void;
	setScheme?(scheme: WhatsNewColorScheme): void;
	destroy?(): void;
};

/*
 * The video of the announcement: the address the frame is embedded from, and the picture of the backing frame
 * under it. The address is the business of the consumer - the component neither asks which platform it leads
 * to nor adds parameters of playback of its own. The backing frame is drawn with or without a picture: an
 * outer address often never arrives in a corporate network, and the mark of it tells a video that is on its
 * way from an empty rectangle.
 */
export type WhatsNewVideo = {
	src: string;
	poster?: string;
};

/*
 * A layer of a scene: a sprite of the consumer, where it stands and how it lives. The geometry is written in
 * shares of the frame, in percent, and never in pixels - that is what lets the whole composition scale as
 * one. A layer that names no geometry covers the frame whole: a composition already cut into one frame
 * arrives that way and needs no coordinates.
 *
 * The sprites and the coordinates belong to the consumer; the component owns the mechanics of the motion and
 * holds every number of it inside the ranges of the mockup.
 */
export type WhatsNewSceneLayer = {
	src: string;
	left?: number;
	top?: number;
	width?: number;
	// The plane the layer stands in: what it covers, and how far it travels with the pointer.
	depth?: number;
	// The drift of the layer: how high it rises, px, and how far it tilts at the top of the rise, degrees.
	shift?: number;
	tilt?: number;
	// The period of the drift, s, and the delay before the first one, s.
	period?: number;
	delay?: number;
	// A decorative spark: on top of the drift it grows towards the middle of its cycle.
	spark?: boolean;
};

/*
 * A composition together with the proportion of the frame it was drawn for. The geometry of the layers is
 * written in shares of that frame, so a composition of another format has to be able to name its proportion:
 * the height of the zone is one and the same everywhere, while the width of it follows the size of the card,
 * and a composition that could name nothing would be stretched to whatever the zone happened to be.
 */
export type WhatsNewSceneLayers = {
	layers: WhatsNewSceneLayer[];
	aspect?: number;
};

/*
 * The graphics of the announcement: a composition of layers the component lays out and moves. A bare list of
 * layers stays a composition and means the proportion of the layered scenes of the mockup.
 */
export type WhatsNewScene = WhatsNewSceneLayer[] | WhatsNewSceneLayers;

/*
 * A slide of the gallery, in the three shapes the graphics of an announcement comes in:
 * - `{ scene }` - a composition of layers the component lays out and moves itself, exactly the way it does
 *   the single scene of the zone: the same geometry in shares of the frame, the same drift, the same follow
 *   of the pointer;
 * - `{ src }` - the address of a picture the component draws itself; it melts into the backdrop by its
 *   bottom edge, the way the art of a scene does;
 * - a ready node - a composition of the consumer, drawn as it is and never touched.
 */
export type WhatsNewGallerySlide = HTMLElement | { src: string } | { scene: WhatsNewScene };

export type WhatsNewEvents = { [eventName: string]: (event: BaseEvent) => void };

export type WhatsNewOptions = {
	size?: WhatsNewSize;
	mediaPosition?: WhatsNewMediaPosition;
	actionsAlign?: WhatsNewActionsAlign;
	// Number of wizard steps; 1 keeps the wizard mode off.
	stepCount?: number;
	// Current step, counted from zero. The mode is a controlled one: the component only reports the
	// intention to move, the step itself is set by the consumer.
	currentStep?: number;
	label?: string;
	title?: string;
	// A word of the title painted with the gradient of the brand; every occurrence of it is painted.
	titleBrand?: string;
	subtitle?: string;
	items?: WhatsNewItem[];
	// The graphics of the announcement, standing in the zone of the media: a list of layers, on its own or
	// together with the proportion of the frame they were drawn for. A scene is what the zone shows when there
	// is one.
	scene?: WhatsNewScene | null;
	// The video of the announcement, a refinement of the same place as well: the zone shows it when there is
	// no scene.
	video?: WhatsNewVideo | null;
	// The slides of the gallery, the richest refinement of the same place: a carousel takes the zone over
	// every other slot of it.
	gallery?: WhatsNewGallerySlide[];
	// Where the arrows of the gallery stand.
	galleryNav?: WhatsNewGalleryNav;
	// The slide the gallery stands on, counted from zero. A number turns the controlled mode on: the
	// component only reports the slide the user asked for, the slide itself is set by the consumer. Given no
	// number, the gallery turns by itself.
	currentSlide?: number;
	// Whether the composition of the scene follows the pointer. A moving effect of the backdrop answers the
	// pointer with a motion of its own, and the two answers now and then compete for attention.
	parallax?: boolean;
	// Effect of the backdrop. An effect whose engine is not there yet falls back to the static composition
	// of the colour scheme.
	backdrop?: WhatsNewBackdrop;
	backdropColor?: WhatsNewColor;
	// Up to three buttons; the target one carries the style of success.
	actions?: Button[];
	hasOverlay?: boolean;
	disableScrolling?: boolean;
	closeByEsc?: boolean;
	closeByClickOutside?: boolean;
	hasCloseButton?: boolean;
	// Subscriptions the emitter takes at construction time, same shape main.popup and ui.system.popover use.
	events?: WhatsNewEvents;
};
