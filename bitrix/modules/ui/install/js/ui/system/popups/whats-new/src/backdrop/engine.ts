import { Dom, Event, Tag } from 'main.core';
import 'main.polyfill.intersectionobserver';

import {
	type WhatsNewBackdropContext,
	type WhatsNewBackdropContextKind,
	type WhatsNewBackdropEffect,
	type WhatsNewBackdropPointer,
	type WhatsNewColorScheme,
} from '../types';

/*
 * The density of the canvas is held at one pixel per pixel of the card. An effect of the mockup pays for
 * every pixel of every frame - the heaviest of them walks the whole picture by hand - and a card of 680x580
 * on a screen of double density would cost four times that for a decoration nobody looks at closely.
 */
const MAX_PIXEL_RATIO = 1;

// The step of a frame is capped: a loop that stood still comes back with the whole pause in its hands, and
// an effect must not be told to move a second and a half at once.
const MAX_FRAME_STEP = 48;
const FIRST_FRAME_STEP = 16;

const CENTRE = Object.freeze({ x: 0.5, y: 0.5 });

/*
 * The effect paints the whole card every frame, so neither context needs transparency of its own and the
 * browser is told as much. The smoothing of the hardware one is asked for the way the mockup asks for it.
 */
const PLAIN_ATTRIBUTES: CanvasRenderingContext2DSettings = { alpha: false };
const HARDWARE_ATTRIBUTES: WebGLContextAttributes = { alpha: false, antialias: true };

// What a listener of the browser is handed. The name of the global event is taken in this file by the unit
// of the core, so the type of it is named through the listener.
type BrowserEvent = Parameters<EventListener>[0];

// The two events of a context taken back and given again: the plain canvas and the hardware one name them
// each in their own way.
type ContextEvents = {
	lost: string;
	restored: string;
};

const CONTEXT_EVENTS: Readonly<Record<WhatsNewBackdropContextKind, ContextEvents>> = Object.freeze({
	'2d': { lost: 'contextlost', restored: 'contextrestored' },
	webgl2: { lost: 'webglcontextlost', restored: 'webglcontextrestored' },
});

/**
 * The hardware context is given back to the browser by hand. A browser holds only so many live contexts -
 * about sixteen of them - and one of a canvas nobody uses any more is not freed at any hurry, so a window
 * opened and closed a dozen times starts silently killing the contexts opened before it. The plain context
 * holds nothing of the kind and needs no giving back.
 */
const releaseContext = (context: WhatsNewBackdropContext | null): void => {
	if (!context || context instanceof CanvasRenderingContext2D)
	{
		return;
	}

	context.getExtension('WEBGL_lose_context')?.loseContext();
};

type BackdropEngineOptions = {
	// The node the canvas goes into. Its box is the card the effect draws on.
	host: HTMLElement;
	/*
	 * What the canvas is called. The canvas is a layer of the backdrop and lies the way every other layer of
	 * it does - over the whole card, under the content, deaf to the pointer - and the name of that layer is
	 * declared by the backdrop, which owns the markup. The engine draws and does not name.
	 */
	canvasClass: string;
	effect?: WhatsNewBackdropEffect<WhatsNewBackdropContext> | null;
	/*
	 * Told when the engine has given up drawing for good: a context the browser took back and did not give
	 * again, or gave again and the effect could not build itself on. A loss the engine comes back from is
	 * not reported - it takes the canvas off the card by itself and puts it back on the restored context.
	 * The engine only reports; what to show instead is decided by the one that owns the backdrop.
	 */
	onContextLost?: () => void;
};

type PointerPlace = {
	x: number;
	y: number;
};

/**
 * The common frame of every moving effect of the backdrop: the canvas, the size of it, the pointer, the loop
 * of frames and the giving back of everything taken. In the sources of the mockup all four effects carry a
 * copy of this, and the copies differ; here it is one unit, and an effect is the changing part of it.
 *
 * The loop is not the one of the mockup, where it never stops. It runs only while there is something to look
 * at: the card is on the screen, the tab is the one in front, the window is neither hidden nor thrown away,
 * and the effect has something of its own left to draw. Every one of those going back turns the loop on
 * again, and an effect at rest is woken by the pointer, by a change of scheme and by a change of size.
 */
export class BackdropEngine
{
	#host: HTMLElement;
	#canvasClass: string;
	#effect: WhatsNewBackdropEffect<WhatsNewBackdropContext> | null;
	#onContextLost: (() => void) | null;

	#canvas: HTMLCanvasElement | null = null;
	#context: WhatsNewBackdropContext | null = null;
	// Which context the canvas is drawn with. The effect names it once, and the engine asks for the context
	// and listens to the events of that very kind.
	#kind: WhatsNewBackdropContextKind = '2d';

	#resizeObserver: ResizeObserver | null = null;
	#screenObserver: IntersectionObserver | null = null;

	// The card, in pixels. The context is scaled to it, so an effect draws in the pixels of the card and
	// never knows the density of the screen.
	#width: number = 0;
	#height: number = 0;

	#pointer: WhatsNewBackdropPointer = { ...CENTRE, inside: false };

	// Where the last pointer event landed on the page. The shares of the card are counted from it once a
	// frame: asking the page for the box of the card on every move is a layout the loop would pay for.
	#pointerPlace: PointerPlace | null = null;

	#request: number | null = null;
	#timestamp: number = 0;
	#time: number = 0;
	#frames: number = 0;

	#mounted: boolean = false;
	#running: boolean = false;
	#onScreen: boolean = true;
	#awake: boolean = true;

	// The effect has said it has nothing left to draw. The loop stands still until something the effect
	// cannot know about happens - the pointer moves, the scheme changes, the card is given another size.
	#resting: boolean = false;

	constructor(options: BackdropEngineOptions)
	{
		this.#host = options.host;
		this.#canvasClass = options.canvasClass;
		this.#effect = options.effect ?? null;
		this.#onContextLost = options.onContextLost ?? null;
	}

	/**
	 * Puts the canvas into the backdrop and starts the loop. Answers whether the engine runs: a canvas the
	 * browser gives no drawing context for, and an effect that could not build itself on the context it
	 * asked for, are the failures it cannot work around, and the caller is the one to fall back to the
	 * static composition.
	 */
	start(): boolean
	{
		if (!this.#mounted && !this.#mount())
		{
			return false;
		}

		this.#running = true;
		this.#awake = !document.hidden;
		this.#resting = false;
		this.#sync();

		return true;
	}

	// Holds the loop without giving the canvas back: a window is hidden far more often than it is thrown
	// away, and a shown window has to come back to life at once.
	stop(): void
	{
		this.#running = false;
		this.#sync();
	}

	// The canvas of an effect at rest holds the scheme it went to rest with, so a change of colour is one of
	// the things that wake the loop.
	setScheme(scheme: WhatsNewColorScheme): void
	{
		this.#effect?.setScheme?.(scheme);
		this.#wake();
	}

	// How many frames the loop has drawn. The count is the only way from the outside to tell a loop that runs
	// from one that stands still.
	getFrameCount(): number
	{
		return this.#frames;
	}

	destroy(): void
	{
		this.#running = false;
		this.#mounted = false;
		this.#cancel();

		this.#resizeObserver?.disconnect();
		this.#resizeObserver = null;
		this.#screenObserver?.disconnect();
		this.#screenObserver = null;

		Event.unbind(window, 'pointermove', this.#handlePointerMove);
		Event.unbind(window, 'pointerdown', this.#handlePointerDown);
		Event.unbind(document, 'visibilitychange', this.#handleVisibilityChange);

		// The canvas stops being listened to before anything is given back: giving a hardware context back
		// raises the very event of loss the engine listens for, and a loss of a context nobody is going to
		// draw on again is not one to answer.
		if (this.#canvas)
		{
			Event.unbind(this.#canvas, CONTEXT_EVENTS[this.#kind].lost, this.#handleContextLost);
			Event.unbind(this.#canvas, CONTEXT_EVENTS[this.#kind].restored, this.#handleContextRestored);
			Dom.remove(this.#canvas);
		}

		// What the effect took from the context goes back while the context is still alive, and the context
		// itself right after it.
		this.#effect?.destroy?.();
		this.#effect = null;
		this.#onContextLost = null;

		releaseContext(this.#context);

		this.#canvas = null;
		this.#context = null;
	}

	#mount(): boolean
	{
		this.#kind = this.#effect?.contextKind === 'webgl2' ? 'webgl2' : '2d';

		const canvas: HTMLCanvasElement = Tag.render`<canvas class="${this.#canvasClass}"></canvas>`;
		const context: WhatsNewBackdropContext | null = this.#acquire(canvas);

		// Nothing is put on the card until the effect has said it can draw: a canvas over the composition
		// that never gets a picture is the empty backdrop the fallback exists to prevent. The context of a
		// refused effect is given back at once - a refusal happens on every opening of the window, and a
		// context nobody drew on counts against the few the browser holds just the same.
		if (!context || this.#effect?.prepare?.(context) === false)
		{
			releaseContext(context);

			return false;
		}

		this.#canvas = canvas;
		this.#attach(canvas, context);

		this.#resizeObserver = new ResizeObserver(this.#handleResize);
		this.#resizeObserver.observe(this.#host);

		this.#screenObserver = new IntersectionObserver(this.#handleScreen);
		this.#screenObserver.observe(this.#host);

		Event.bind(window, 'pointermove', this.#handlePointerMove, { passive: true });
		Event.bind(window, 'pointerdown', this.#handlePointerDown, { passive: true });
		Event.bind(document, 'visibilitychange', this.#handleVisibilityChange);
		Event.bind(canvas, CONTEXT_EVENTS[this.#kind].lost, this.#handleContextLost);
		Event.bind(canvas, CONTEXT_EVENTS[this.#kind].restored, this.#handleContextRestored);

		this.#mounted = true;

		return true;
	}

	#acquire(canvas: HTMLCanvasElement): WhatsNewBackdropContext | null
	{
		return this.#kind === 'webgl2'
			? canvas.getContext('webgl2', HARDWARE_ATTRIBUTES)
			: canvas.getContext('2d', PLAIN_ATTRIBUTES);
	}

	// The canvas goes on the card with a context it can draw on: the first mount and a context given back
	// after a loss put it there the same way.
	#attach(canvas: HTMLCanvasElement, context: WhatsNewBackdropContext): void
	{
		this.#context = context;
		Dom.append(canvas, this.#host);
		this.#measure();
	}

	#sync(): void
	{
		if (this.#canRun())
		{
			this.#schedule();

			return;
		}

		this.#cancel();
	}

	#canRun(): boolean
	{
		return this.#running && this.#onScreen && this.#awake && !this.#resting && this.#context !== null;
	}

	#wake(): void
	{
		if (!this.#resting)
		{
			return;
		}

		this.#resting = false;
		this.#sync();
	}

	#schedule(): void
	{
		if (this.#request === null)
		{
			this.#request = requestAnimationFrame(this.#handleFrame);
		}
	}

	#cancel(): void
	{
		if (this.#request !== null)
		{
			cancelAnimationFrame(this.#request);
			this.#request = null;
		}

		// The clock of the loop starts afresh after a pause: the time nobody watched is not a step the effect
		// has to catch up with.
		this.#timestamp = 0;
	}

	#handleFrame = (timestamp: number): void => {
		this.#request = null;

		const step: number = this.#timestamp > 0
			? Math.min(timestamp - this.#timestamp, MAX_FRAME_STEP)
			: FIRST_FRAME_STEP;

		this.#timestamp = timestamp;
		this.#time += step;
		this.#frames += 1;

		this.#draw(step);

		// The effect is asked after the frame and not before it: what it has to draw is decided by the very
		// frame that has just been drawn.
		this.#resting = this.#effect?.isResting?.() === true;

		this.#sync();
	};

	#draw(step: number): void
	{
		const context: WhatsNewBackdropContext | null = this.#context;
		if (!context || this.#width === 0 || this.#height === 0)
		{
			return;
		}

		this.#syncPointer();

		this.#effect?.draw({
			context,
			width: this.#width,
			height: this.#height,
			pointer: this.#pointer,
			time: this.#time,
			delta: step,
		});
	}

	#measure(): void
	{
		const canvas: HTMLCanvasElement | null = this.#canvas;
		const context: WhatsNewBackdropContext | null = this.#context;
		if (!canvas || !context)
		{
			return;
		}

		const box: DOMRect = this.#host.getBoundingClientRect();
		if (box.width === 0 || box.height === 0)
		{
			return;
		}

		const ratio: number = Math.min(window.devicePixelRatio || 1, MAX_PIXEL_RATIO);

		this.#width = box.width;
		this.#height = box.height;

		canvas.width = Math.round(box.width * ratio);
		canvas.height = Math.round(box.height * ratio);
		Dom.style(canvas, 'width', `${box.width}px`);
		Dom.style(canvas, 'height', `${box.height}px`);

		// A canvas given a size loses everything the context held, the transform included, so the scale is
		// set here and nowhere else. The hardware context knows no transform: there the drawing area is
		// named instead, and the effect counts in the pixels of the card by itself.
		if (context instanceof CanvasRenderingContext2D)
		{
			context.setTransform(ratio, 0, 0, ratio, 0, 0);
		}
		else
		{
			context.viewport(0, 0, canvas.width, canvas.height);
		}
	}

	// The box of the card is asked for once a frame, and only while the pointer has moved since the last one.
	#syncPointer(): void
	{
		const place: PointerPlace | null = this.#pointerPlace;
		if (!place)
		{
			return;
		}

		this.#pointerPlace = null;

		const shares: WhatsNewBackdropPointer | null = this.#toShares(place);
		if (!shares)
		{
			return;
		}

		this.#pointer.inside = shares.inside;

		if (shares.inside)
		{
			this.#pointer.x = shares.x;
			this.#pointer.y = shares.y;
		}
	}

	// Where a place of the page stands over the card, in shares of it.
	#toShares(place: PointerPlace): WhatsNewBackdropPointer | null
	{
		const box: DOMRect = this.#host.getBoundingClientRect();
		if (box.width === 0 || box.height === 0)
		{
			return null;
		}

		const x: number = (place.x - box.left) / box.width;
		const y: number = (place.y - box.top) / box.height;

		return { x, y, inside: x >= 0 && x < 1 && y >= 0 && y < 1 };
	}

	#handlePointerMove = (event: PointerEvent): void => {
		this.#pointerPlace = { x: event.clientX, y: event.clientY };
		this.#wake();
	};

	/*
	 * A press on the card. Every layer of the backdrop is decoration and lets the pointer through to the
	 * content over it, so a press never lands on the canvas and an effect could never hear of one by itself.
	 * The engine listens for it on the window and does nothing but tell the effect where it landed: nothing
	 * is cancelled and nothing is stopped, so the window goes on closing by a press outside it and the
	 * content over the backdrop goes on taking its own presses. A press outside the card is not the business
	 * of the effect.
	 *
	 * The box of the card is asked for here and not at the next frame, the way a move is: a press happens
	 * once in a while, while a move fills every frame of a walk.
	 */
	#handlePointerDown = (event: PointerEvent): void => {
		const shares: WhatsNewBackdropPointer | null = this.#toShares({ x: event.clientX, y: event.clientY });
		if (!shares?.inside)
		{
			return;
		}

		this.#effect?.press?.(shares);
		this.#wake();
	};

	// A canvas given a size loses the picture that was on it, so the loop draws it anew even if the effect
	// had gone to rest.
	#handleResize = (): void => {
		this.#measure();
		this.#wake();
	};

	#handleScreen = (entries: IntersectionObserverEntry[]): void => {
		const last: IntersectionObserverEntry | undefined = entries[entries.length - 1];
		if (!last)
		{
			return;
		}

		this.#onScreen = last.isIntersecting;
		this.#sync();
	};

	#handleVisibilityChange = (): void => {
		this.#awake = !document.hidden;
		this.#sync();
	};

	/*
	 * The browser can take the drawing context back at any moment - a machine short of video memory, a
	 * driver that restarted. The canvas goes blank with it, so the loop stops, everything the effect built
	 * on the dead context is let go of, and the canvas comes off the card: what is seen is the static
	 * composition the canvas lay on, and that is the one fallback the backdrop has.
	 *
	 * The browser is asked to give the context back. The asking is inverted between the two kinds: a
	 * hardware context is given again only to the one who cancelled the loss, while a plain one is given
	 * again unless the loss is cancelled.
	 */
	#handleContextLost = (event: BrowserEvent): void => {
		if (this.#kind === 'webgl2')
		{
			event.preventDefault();
		}

		this.#context = null;
		this.#cancel();
		this.#effect?.release?.();
		Dom.remove(this.#canvas);
	};

	/*
	 * The context is given back. Everything built on it died with the loss, so the effect is built anew and
	 * the canvas goes back on the card - a canvas given a size anew loses the picture and the transform, and
	 * `#attach()` is where both are set. An effect that cannot build itself on the context it has just been
	 * given is the end of the drawing, and that is the only loss reported upwards.
	 */
	#handleContextRestored = (): void => {
		const canvas: HTMLCanvasElement | null = this.#canvas;
		if (!canvas || this.#context)
		{
			return;
		}

		const context: WhatsNewBackdropContext | null = this.#acquire(canvas);

		if (!context || this.#effect?.prepare?.(context) === false)
		{
			releaseContext(context);
			this.#onContextLost?.();

			return;
		}

		this.#attach(canvas, context);
		this.#resting = false;
		this.#sync();
	};
}
