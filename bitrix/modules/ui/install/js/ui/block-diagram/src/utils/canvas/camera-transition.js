import { Camera } from './camera';

// How long the overview takes to reach a new destination. A quarter of a second is long enough to be
// read as a move rather than a jump - the point of the move is that a person sees where they were
// taken - and short enough not to stand between them and the next thing they do. The value belongs
// here and not to the caller: the length of the move is a property of the canvas, not of a command.
export const CAMERA_TRANSITION_DURATION_MS = 250;

// Where the overview stands: the position of the camera and its scale. The anchored form of a
// landmark has no meaning here - a move interpolates absolute states.
export type CameraTransitionState = {
	x: number,
	y: number,
	zoom: number,
};

function clampProgress(progress: number): number
{
	return Math.min(Math.max(progress, 0), 1);
}

// Ease-out cubic: the move leaves at full speed and settles into the destination, so the eye follows
// where it lands instead of where it left.
function easeOut(progress: number): number
{
	return 1 - ((1 - progress) ** 3);
}

function interpolate(from: number, to: number, progress: number): number
{
	return from + ((to - from) * progress);
}

function isPositiveScale(value: number): boolean
{
	return Number.isFinite(value) && value > 0;
}

/**
 * The scale steps by a constant ratio rather than by a constant amount: to the eye a move from 0.25
 * to 1 is the same size of change as one from 1 to 4, and a linear step would crawl through the
 * first half of such a move and rush the second. A scale that is not positive has no ratio to step
 * by - the camera repairs such a value itself - so the move falls back to the even step.
 */
function interpolateZoom(from: number, to: number, progress: number): number
{
	if (!isPositiveScale(from) || !isPositiveScale(to))
	{
		return interpolate(from, to, progress);
	}

	return from * ((to / from) ** progress);
}

/**
 * A move of the overview to a destination over time. It keeps where the camera started, where it has
 * to arrive and how far along it is; every frame it computes the state in between and hands it to
 * the camera the same way every other operation of the canvas does - through a landmark.
 *
 * The move keeps no clock and no frame loop of its own: the timestamp comes from the caller, which
 * is the loop the canvas already draws in. That is what makes the whole object testable without
 * fake timers, and what keeps one loop in the extension instead of two.
 *
 * The bounds of the scale are not checked here at all: the camera owns them and applies them to
 * every frame, exactly as it does to a jump.
 */
export class CameraTransition
{
	#camera: typeof Camera;
	#from: CameraTransitionState | null = null;
	#to: CameraTransitionState | null = null;
	#startedAt: number | null = null;

	constructor(camera: typeof Camera)
	{
		this.#camera = camera;
	}

	get isRunning(): boolean
	{
		return this.#to !== null;
	}

	/**
	 * Aims the camera at a new destination from wherever it stands now. At most one move is alive:
	 * a second destination replaces the first instead of racing it for the camera.
	 */
	start(target: CameraTransitionState): void
	{
		this.cancel();

		this.#from = { x: this.#camera.x, y: this.#camera.y, zoom: this.#camera.zoom };
		this.#to = { x: target.x, y: target.y, zoom: target.zoom };
		// The first frame sets the origin of the clock, so a move started long before it gets its full
		// length rather than arriving already finished.
		this.#startedAt = null;
	}

	// Stops where the camera stands and writes nothing more: the input of a person wins over a move
	// that is still running, and a stopped move must not drag the camera on afterwards.
	cancel(): void
	{
		this.#from = null;
		this.#to = null;
		this.#startedAt = null;
	}

	// One frame of the move. Answers whether the camera was written to, so a caller can tell an idle
	// frame from a moving one.
	step(now: number): boolean
	{
		if (this.#to === null)
		{
			return false;
		}

		if (this.#startedAt === null)
		{
			this.#startedAt = now;
		}

		const progress = clampProgress((now - this.#startedAt) / CAMERA_TRANSITION_DURATION_MS);

		if (progress >= 1)
		{
			const target = this.#to;
			// Closed before the last write: the move ends exactly on the destination, never on the
			// frame before it, and leaves nothing running behind it.
			this.cancel();
			this.#apply(target);

			return true;
		}

		const eased = easeOut(progress);

		this.#apply({
			x: interpolate(this.#from.x, this.#to.x, eased),
			y: interpolate(this.#from.y, this.#to.y, eased),
			zoom: interpolateZoom(this.#from.zoom, this.#to.zoom, eased),
		});

		return true;
	}

	#apply(state: CameraTransitionState): void
	{
		this.#camera.applyLandmark(this.#camera.createLandmark(state));
	}
}
