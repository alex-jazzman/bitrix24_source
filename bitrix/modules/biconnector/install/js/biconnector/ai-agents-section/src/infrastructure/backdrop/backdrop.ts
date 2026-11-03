import { Dom, Event, Type } from 'main.core';
import 'main.polyfill.intersectionobserver';

const BACKDROP_PLAYING_CLASS = '--backdrop-playing';
const BACKDROP_STILL_CLASS = '--backdrop-still';
const MOTION_STOPPED_CLASS = '--motion-stopped';
const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';

const BACKDROP_WAIT = 8000;

const Selector = Object.freeze({
	MotionToggle: '[data-role="motion-toggle"]',
	BackdropVideo: '[data-role="backdrop-video"]',
	BackdropSource: '[data-role="backdrop-source"]',
});

const FOCUS_STOP = 'a[href], button, [tabindex]';

export class Backdrop
{
	#container: HTMLElement;

	#video: HTMLVideoElement | null = null;
	#observer: IntersectionObserver | null = null;
	#waitId: number = 0;
	#isOnScreen: boolean = true;

	#motionQuery: MediaQueryList | null = null;
	#isReducedMotion: boolean = false;

	#motionToggle: HTMLElement | null = null;
	// User choice persists across automatic pauses.
	#isMotionStopped: boolean = false;

	constructor(container: HTMLElement)
	{
		this.#container = container;
	}

	start(): void
	{
		this.#watchReducedMotion();
		this.#startVideo();
		this.#startMotionToggle();
	}

	destroy(): void
	{
		Event.unbind(window, 'load', this.#attach);
		Event.unbind(document, 'visibilitychange', this.#sync);

		if (this.#motionQuery !== null)
		{
			Event.unbind(this.#motionQuery, 'change', this.#handleReducedMotion);
			this.#motionQuery = null;
		}

		if (this.#motionToggle !== null)
		{
			Event.unbind(this.#motionToggle, 'click', this.#toggleMotion);
			this.#motionToggle = null;
		}

		clearTimeout(this.#waitId);

		this.#observer?.disconnect();
		this.#observer = null;

		this.#video?.pause();
		this.#video = null;
	}

	/** CSS hides reduced-motion video but does not stop decoding. */
	#watchReducedMotion(): void
	{
		const query = window.matchMedia?.(REDUCED_MOTION_QUERY) ?? null;
		if (query === null)
		{
			return;
		}

		this.#isReducedMotion = query.matches;
		this.#motionQuery = query;

		Event.bind(query, 'change', this.#handleReducedMotion);
	}

	#handleReducedMotion = (): void => {
		this.#isReducedMotion = this.#motionQuery?.matches === true;
		if (this.#isReducedMotion)
		{
			Dom.removeClass(this.#container, BACKDROP_PLAYING_CLASS);
		}

		this.#sync();
	};

	/** Defer video loading until the page has loaded. */
	#startVideo(): void
	{
		if (this.#isReducedMotion)
		{
			return;
		}

		const video = this.#container.querySelector<HTMLVideoElement>(Selector.BackdropVideo);
		if (!Type.isElementNode(video) || Backdrop.#sources(video).length === 0)
		{
			return;
		}

		this.#video = video;

		Event.bindOnce(video, 'playing', (): void => {
			clearTimeout(this.#waitId);

			Dom.removeClass(this.#container, BACKDROP_STILL_CLASS);
			Dom.addClass(this.#container, BACKDROP_PLAYING_CLASS);
		});

		if (document.readyState === 'complete')
		{
			this.#attach();

			return;
		}

		Event.bindOnce(window, 'load', this.#attach);
	}

	#attach = (): void => {
		const video = this.#video;
		if (video === null)
		{
			return;
		}

		Backdrop.#sources(video).forEach((source: HTMLSourceElement): void => {
			Dom.attr(source, 'src', source.dataset.src ?? '');
		});

		// Reevaluate sources after assigning their URLs.
		video.load();

		Event.bindOnce(video, 'error', this.#stopWaiting);

		this.#waitId = setTimeout(this.#stopWaiting, BACKDROP_WAIT);

		if (this.#isMotionStopped)
		{
			video.pause();
		}
		else
		{
			// play() exposes autoplay rejection.
			void video.play().catch(this.#stopWaiting);
		}

		this.#watch(video);
	};

	static #sources(video: HTMLVideoElement): HTMLSourceElement[]
	{
		const sources = [...video.querySelectorAll<HTMLSourceElement>(Selector.BackdropSource)];

		return sources.filter((source: HTMLSourceElement): boolean => Type.isStringFilled(source.dataset.src));
	}

	#stopWaiting = (): void => {
		clearTimeout(this.#waitId);

		if (Dom.hasClass(this.#container, BACKDROP_PLAYING_CLASS))
		{
			return;
		}

		this.#keepFocusOut();
		Dom.addClass(this.#container, BACKDROP_STILL_CLASS);
	};

	/** Move focus before the motion control is hidden. */
	#keepFocusOut(): void
	{
		const toggle = this.#motionToggle;
		if (toggle === null || this.#isMotionStopped || !toggle.contains(document.activeElement))
		{
			return;
		}

		const stops = [...this.#container.querySelectorAll<HTMLElement>(FOCUS_STOP)];

		stops[stops.indexOf(toggle) + 1]?.focus({ preventScroll: true });
	}

	#watch(video: HTMLVideoElement): void
	{
		Event.bind(document, 'visibilitychange', this.#sync);

		const backdrop = video.parentElement;
		if (!Type.isElementNode(backdrop) || !Type.isFunction(window.IntersectionObserver))
		{
			return;
		}

		this.#observer = new IntersectionObserver((entries: IntersectionObserverEntry[]): void => {
			this.#isOnScreen = entries[entries.length - 1]?.isIntersecting === true;
			this.#sync();
		});

		this.#observer.observe(backdrop);
	}

	#sync = (): void => {
		const video = this.#video;
		if (video === null)
		{
			return;
		}

		if (this.#isOnScreen && !document.hidden && !this.#isMotionStopped && !this.#isReducedMotion)
		{
			void video.play().catch((): void => {});

			return;
		}

		video.pause();
	};

	#startMotionToggle(): void
	{
		const toggle = this.#container.querySelector<HTMLElement>(Selector.MotionToggle);
		if (!Type.isElementNode(toggle))
		{
			return;
		}

		this.#motionToggle = toggle;
		Event.bind(toggle, 'click', this.#toggleMotion);
	}

	#toggleMotion = (): void => {
		this.#isMotionStopped = !this.#isMotionStopped;

		if (this.#isMotionStopped)
		{
			Dom.addClass(this.#container, MOTION_STOPPED_CLASS);
		}
		else
		{
			Dom.removeClass(this.#container, MOTION_STOPPED_CLASS);
		}

		Dom.attr(this.#motionToggle, 'aria-pressed', this.#isMotionStopped ? 'true' : 'false');

		this.#sync();
	};
}
