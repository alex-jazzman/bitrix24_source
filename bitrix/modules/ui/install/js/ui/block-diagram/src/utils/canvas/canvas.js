import { Type } from 'main.core';
import { mat3, vec2 } from '../../lib/gl-matrix';
import { Camera } from './camera';
import { CameraTransition } from './camera-transition';
import { getFitCameraPosition, getFitToViewTarget, type FitToViewRequest } from './fit-to-view';
import { clampZoom } from '../zoom-bounds';
import type { CameraLandmark, DiagramCanvasContext, State } from '../../types';

const ZOOM_FRACTION_DIGITS = 1;

export class Canvas
{
	#camera: typeof Camera | null = null;
	// The bounds of the scale live in the state of the diagram and the consumer changes them on the
	// fly; the canvas only reads them, and only where a destination has to be known in advance.
	#state: State | null = null;
	#cameraTransition: CameraTransition | null = null;
	#dpr: number = window.devicePixelRatio || 1;

	#element: HTMLCanvasElement | null = null;
	// The very same context object the canvas style works on: getContext answers one context
	// per pair of element and type. The canvas holds it for the drawing area alone - the style
	// sets that area once when it is built, and only the canvas hears about a resize - and puts
	// it out at detach, after the style has released what it built on it.
	#context: WebGLRenderingContext | null = null;

	#width: number = 0;
	#height: number = 0;

	#canvasStyleInstance = null;

	#startInvertViewProjectionMatrix: Float32Array = mat3.create();
	#startCameraX: number = 0;
	#startCameraY: number = 0;

	#startPos: Float32Array = vec2.create();

	#resizeObserver: ResizeObserver | null = null;

	constructor(ctx: DiagramCanvasContext)
	{
		this.#camera = ctx.camera;
		this.#state = ctx.state;
		this.#cameraTransition = new CameraTransition(ctx.camera);
	}

	get viewMatrix(): Float32Array
	{
		return this.#camera.viewMatrix;
	}

	get camera(): typeof Camera
	{
		return this.#camera;
	}

	get isAttached(): boolean
	{
		return this.#element !== null;
	}

	// A repeated attach is a race of the lifecycle, not a programming error: the same element
	// changes nothing, another one rebinds the canvas. Only an argument that cannot carry a
	// drawing context throws.
	attach(element: HTMLCanvasElement, canvasStyle = null): void
	{
		if (!Type.isFunction(element?.getContext))
		{
			throw new TypeError('ui.block-diagram: canvas needs a canvas element to attach to');
		}

		if (this.#element === element)
		{
			return;
		}

		this.detach();

		this.#element = element;
		this.#context = element.getContext('webgl');

		const { width, height } = element.getBoundingClientRect();
		this.#resize(width, height);

		this.#initCanvasStyle(canvasStyle);
		this.#initResizeObserver();
	}

	// The other half of that contract: a caller that names the element it attached to leaves a
	// binding made by someone else alone. Without an element the current binding is dropped.
	detach(element: HTMLCanvasElement | null = null): void
	{
		if (!this.isAttached || (element !== null && this.#element !== element))
		{
			return;
		}

		// An unfinished move must not outlive the binding: its frames would go on writing into the
		// state of a diagram that is no longer on the page.
		this.#cameraTransition.cancel();

		this.#resizeObserver?.disconnect();
		this.#resizeObserver = null;

		this.#canvasStyleInstance?.destroy();
		this.#canvasStyleInstance = null;

		// The drawing context must not outlive the element it was created on.
		this.#context?.getExtension('WEBGL_lose_context')?.loseContext();
		this.#context = null;

		this.#element = null;
		this.#width = 0;
		this.#height = 0;
	}

	// The element is measured in logical pixels, the drawing buffer is sized in physical ones,
	// and the camera keeps working in logical pixels: the ratio between them is pixel density.
	//
	// Sizing recreates the buffer cleared, and the frame comes from the caller: render() draws
	// right after #syncSize(), and after attach() the frame arrives from the resize observer.
	#resize(width: number, height: number): void
	{
		this.#width = Math.round(width * this.#dpr);
		this.#height = Math.round(height * this.#dpr);

		this.#element.width = this.#width;
		this.#element.height = this.#height;
		this.#context?.viewport(0, 0, this.#width, this.#height);

		this.#camera.resize(width, height);
	}

	// The resize observer speaks after the frame callbacks of the frame it belongs to, while the
	// element is laid out at its new size before them. A window being dragged by its edge changes
	// the size on every frame, so a frame that waits for the observer draws into a buffer already
	// smaller than the element, and the strip the buffer does not reach shows the element itself.
	// Measuring at the start of the frame closes that gap: by the time the observer speaks the
	// size is set and there is nothing left to change.
	//
	// The buffer is recreated only when it would come out a different size - a buffer recreated at
	// its own size is still a buffer cleared, and that would cost a cleared frame on every frame.
	#syncSize(): void
	{
		const { width, height } = this.#element.getBoundingClientRect();

		if (
			Math.round(width * this.#dpr) === this.#width
			&& Math.round(height * this.#dpr) === this.#height
		)
		{
			return;
		}

		this.#resize(width, height);
	}

	// The style compiles shaders of its own and throws if they do not build. The canvas is more
	// than its background - the camera, the coordinates of a gesture and the drawing area all
	// hang on the binding - so a background that did not build costs the background alone: the
	// canvas stays bound, and render() already tolerates having no style.
	#initCanvasStyle(canvasStyle): void
	{
		if (!canvasStyle)
		{
			return;
		}

		const StyleInstance = canvasStyle.instance;

		try
		{
			this.#canvasStyleInstance = new StyleInstance(this.#element, canvasStyle.options);
		}
		catch (error)
		{
			this.#canvasStyleInstance = null;
			console.error('ui.block-diagram: the canvas style did not build, the background is not drawn', error);
		}
	}

	// The observer calls render() from its own callback rather than sizing the buffer itself: the
	// draw is synchronous and lands inside the frame that changed the size, sizing stays in one
	// place, and going through render() keeps a canvas drawn on demand in step with its element.
	#initResizeObserver(): void
	{
		this.#resizeObserver = new ResizeObserver(() => {
			this.render();
		});

		this.#resizeObserver.observe(this.#element);
	}

	clientToViewport({ x, y }: { x: number, y: number }): { x: number, y: number }
	{
		const { left, top } = this.#element.getBoundingClientRect();

		return { x: x - left, y: y - top };
	}

	viewportToClient({ x, y }: { x: number, y: number }): { x: number, y: number }
	{
		const { left, top } = this.#element.getBoundingClientRect();

		return { x: x + left, y: y + top };
	}

	/**
	 * One frame of the canvas. A running move of the overview is advanced first, so the background is
	 * drawn by the same camera state the layer above it is given. The timestamp comes from the frame
	 * loop that calls this - the canvas keeps no clock of its own.
	 */
	render(now: number = performance.now()): void
	{
		// Stepped first and unconditionally: a transition is pure camera math, not a draw, so it
		// advances the same way whether or not there is a DOM element to paint into right now.
		this.#cameraTransition.step(now);

		if (!this.isAttached)
		{
			return;
		}

		this.#syncSize();

		this.#canvasStyleInstance?.render({
			projectionMatrix: this.#camera.projectionMatrix,
			viewMatrix: this.#camera.viewMatrix,
			viewProjectionMatrixInv: this.#camera.viewProjectionMatrixInv,
			zoomScale: this.#camera.zoom,
		});
	}

	/**
	 * Drops a move of the overview that is still running. Every operation below that changes the
	 * overview starts with it: the input of a person always wins over a move, and the rule lives here
	 * rather than in every handler of the consumer. The frames of the move write to the camera
	 * directly and never come this way, so a move cannot cancel itself.
	 */
	cancelCameraTransition(): void
	{
		this.#cameraTransition.cancel();
	}

	setCamera(params: Partial<CameraLandmark>): void
	{
		this.cancelCameraTransition();

		this.#camera.applyLandmark(
			this.#camera.createLandmark({
				...params,
			}),
		);
	}

	panBy(dxScreen: number, dyScreen: number): void
	{
		this.cancelCameraTransition();

		this.#camera.panBy(dxScreen, dyScreen);
	}

	// A step by the button is a discrete path and snaps to tenths, so that a chain of steps
	// stays on round values instead of drifting into 1.2000000000000002.
	#setCameraZoom(zoomStep: number): void
	{
		this.setZoom(Number((this.#camera.zoom + zoomStep).toFixed(ZOOM_FRACTION_DIGITS)));
	}

	zoomIn(zoomStep: number): void
	{
		this.#setCameraZoom(zoomStep);
	}

	zoomOut(zoomStep: number): void
	{
		this.#setCameraZoom(zoomStep * -1);
	}

	// The value arrives as it was asked for: rounding lives on the discrete path alone. The
	// bounds of the zoom are the camera's business and hold on every path.
	setZoom(zoom: number): void
	{
		this.cancelCameraTransition();

		this.#camera.applyLandmark(
			this.#camera.createLandmark({
				anchorToViewport: true,
				viewportX: this.#camera.width / 2,
				viewportY: this.#camera.height / 2,
				zoom,
			}),
		);
	}

	/**
	 * Brings the whole scheme into the free part of the viewport. The overview does not jump there:
	 * the canvas moves it over the frames that follow, so a person sees where they were taken. The
	 * size of the viewport is read off the camera rather than off the markup.
	 *
	 * The scale of the destination is trimmed by the same rule the camera applies to every write:
	 * the position of the destination is derived from the scale, so a scheme too wide for the lower
	 * bound has to be placed by the scale it will really get - otherwise it arrives off centre while
	 * the camera holds it at the bound. The bounds still belong to the camera and hold on every frame
	 * of the move; this is where the destination is read, not where the rule lives.
	 */
	fitToView(request: FitToViewRequest): void
	{
		const target = getFitToViewTarget({
			...request,
			viewportWidth: this.#camera.width,
			viewportHeight: this.#camera.height,
		});

		if (target === null)
		{
			return;
		}

		const zoom = clampZoom(
			target.zoom,
			this.#state.minZoom,
			this.#state.maxZoom,
			this.#camera.zoom,
		);

		this.#cameraTransition.start({
			zoom,
			...getFitCameraPosition(target, zoom),
		});
	}

	setCameraZoomByWheel(event: MouseEvent, zoomChange: number = 0): void
	{
		this.cancelCameraTransition();

		const viewport = this.clientToViewport({
			x: event.clientX,
			y: event.clientY,
		});

		this.#camera.applyLandmark(
			this.#camera.createLandmark({
				anchorToViewport: true,
				viewportX: viewport.x,
				viewportY: viewport.y,
				zoom: this.#camera.zoom + zoomChange,
			}),
		);
	}

	setCameraPositionByWheel(event: MouseEvent): void
	{
		const lineStep = 40;
		const pixelStep = event.deltaMode === 1 ? lineStep : 1;
		let dx = event.deltaX * pixelStep;
		let dy = event.deltaY * pixelStep;

		if (event.shiftKey && Math.abs(dy) > Math.abs(dx))
		{
			dx = dy;
			dy = 0;
		}

		this.panBy(dx, dy);
	}

	// Zero is a valid pointer position, so the fallback belongs to a zero-sized element only:
	// substituting it for a pointer on the left or top edge jumps the camera.
	#getClipSpaceMousePosition(event: MouseEvent): Array<number, number>
	{
		const { left, top } = this.#element.getBoundingClientRect();
		const { clientWidth, clientHeight } = this.#element;

		const cssX: number = event.clientX - left;
		const cssY: number = event.clientY - top;

		const normalizedX: number = clientWidth > 0 ? cssX / clientWidth : this.#width / this.#dpr;
		const normalizedY: number = clientHeight > 0 ? cssY / clientHeight : this.#height / this.#dpr;

		const clipX: number = normalizedX * 2 - 1;
		const clipY: number = normalizedY * -2 + 1;

		return [clipX, clipY];
	}

	// The press itself moves nothing, but it is where a drag of the canvas begins: a move that went on
	// running under a held pointer would fight the hand that holds it.
	setCameraPositionByMouseDown(event: MouseEvent): void
	{
		this.cancelCameraTransition();

		mat3.copy(
			this.#startInvertViewProjectionMatrix,
			this.#camera.viewProjectionMatrixInv,
		);
		this.#startCameraX = this.#camera.x;
		this.#startCameraY = this.#camera.y;
		vec2.transformMat3(
			this.#startPos,
			this.#getClipSpaceMousePosition(event),
			this.#startInvertViewProjectionMatrix,
		);
	}

	setCameraPositionByMouseMove(event: MouseEvent): void
	{
		this.cancelCameraTransition();

		const pos = vec2.transformMat3(
			vec2.create(),
			this.#getClipSpaceMousePosition(event),
			this.#startInvertViewProjectionMatrix,
		);

		this.#camera.setPosition(
			this.#startCameraX + this.#startPos[0] - pos[0],
			this.#startCameraY + this.#startPos[1] - pos[1],
		);
	}
}
