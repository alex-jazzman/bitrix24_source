import { mat3 } from '../../lib/gl-matrix';
import { clampZoom } from '../zoom-bounds';
import { viewportToCanvas } from './viewport';
import type { CameraLandmark, DiagramInstancesContext, State } from '../../types';

export class Camera
{
	#state: State | null = null;

	#x: number = 0;
	#y: number = 0;
	#zoom: number = 1;
	#width: number = 0;
	#height: number = 0;
	#matrix: Float32Array = mat3.create();
	#projectionMatrix: Float32Array = mat3.create();
	#viewMatrix: Float32Array = mat3.create();
	#viewProjectionMatrix: Float32Array = mat3.create();
	#viewProjectionMatrixInv: Float32Array = mat3.create();

	constructor(ctx: DiagramInstancesContext)
	{
		this.#state = ctx.state;
		this.#updateMatrix();
	}

	get projectionMatrix(): Float32Array
	{
		return this.#projectionMatrix;
	}

	get viewMatrix(): Float32Array
	{
		return this.#viewMatrix;
	}

	get viewProjectionMatrix(): Float32Array
	{
		return this.#viewProjectionMatrix;
	}

	get viewProjectionMatrixInv(): Float32Array
	{
		return this.#viewProjectionMatrixInv;
	}

	get zoom(): number
	{
		return this.#zoom;
	}

	set zoom(zoom: number): void
	{
		const clampedZoom = this.#clampZoom(zoom);

		if (this.#zoom !== clampedZoom)
		{
			this.#zoom = clampedZoom;
			this.#updateMatrix();
			this.#publishTransform();
		}
	}

	get x(): number
	{
		return this.#x;
	}

	set x(x: number): void
	{
		if (this.#x !== x)
		{
			this.#x = x;
			this.#updateMatrix();
			this.#publishTransform();
		}
	}

	get y(): number
	{
		return this.#y;
	}

	set y(y: number): void
	{
		if (this.#y !== y)
		{
			this.#y = y;
			this.#updateMatrix();
			this.#publishTransform();
		}
	}

	get width(): number
	{
		return this.#width;
	}

	get height(): number
	{
		return this.#height;
	}

	resize(width: number, height: number): void
	{
		this.#width = width;
		this.#height = height;
		mat3.projection(this.#projectionMatrix, width, height);
		this.#updateViewProjectionMatrix();
		this.#publishViewportSize();
	}

	createLandmark(params: Partial<CameraLandmark> = {}): CameraLandmark
	{
		return {
			zoom: this.#zoom,
			x: this.#x,
			y: this.#y,
			anchorToViewport: false,
			viewportX: 0,
			viewportY: 0,
			...params,
		};
	}

	applyLandmark(landmark: CameraLandmark): void
	{
		const { x, y, zoom, anchorToViewport, viewportX, viewportY } = landmark;
		// Anchoring needs a sized viewport: the reverse projection divides by it.
		const canAnchor = anchorToViewport && this.#width > 0 && this.#height > 0;
		const anchor = canAnchor
			? this.#viewportToCanvas({ x: viewportX, y: viewportY })
			: null;

		this.#zoom = this.#clampZoom(zoom);
		this.#x = x;
		this.#y = y;
		this.#updateMatrix();

		if (anchor)
		{
			const shifted = this.#viewportToCanvas({ x: viewportX, y: viewportY });
			this.#x += anchor.x - shifted.x;
			this.#y += anchor.y - shifted.y;
			this.#updateMatrix();
		}

		this.#publishTransform();
	}

	// Both axes at once: the pair of setters rebuilds the matrices and publishes the
	// state twice, and a drag asks for a new position on every pointer move.
	setPosition(x: number, y: number): void
	{
		if (this.#x === x && this.#y === y)
		{
			return;
		}

		this.#x = x;
		this.#y = y;
		this.#updateMatrix();
		this.#publishTransform();
	}

	// Screen pixels in: the delta becomes world units inside the camera. Callers tick
	// every frame, so an idle delta must leave the matrices and the state untouched.
	panBy(dxScreen: number, dyScreen: number): void
	{
		if (dxScreen === 0 && dyScreen === 0)
		{
			return;
		}

		this.#x += dxScreen / this.#zoom;
		this.#y += dyScreen / this.#zoom;
		this.#updateMatrix();
		this.#publishTransform();
	}

	#viewportToCanvas(point: { x: number, y: number }): { x: number, y: number }
	{
		return viewportToCanvas(
			point,
			{ width: this.#width, height: this.#height },
			this.#viewProjectionMatrixInv,
		);
	}

	// Bounds are re-read from the state on every call rather than cached: the consumer changes them
	// on the fly, and the clamp runs on every frame of a gesture.
	#clampZoom(zoom: number): number
	{
		return clampZoom(zoom, this.#state.minZoom, this.#state.maxZoom, this.#zoom);
	}

	#publishTransform(): void
	{
		this.#state.transformX = this.#x;
		this.#state.transformY = this.#y;
		this.#state.zoom = this.#zoom;
	}

	#publishViewportSize(): void
	{
		this.#state.canvasWidth = this.#width;
		this.#state.canvasHeight = this.#height;
	}

	#updateMatrix(): void
	{
		const zoomScale = 1 / this.#zoom;
		mat3.identity(this.#matrix);
		mat3.translate(this.#matrix, this.#matrix, [this.#x, this.#y]);
		mat3.scale(this.#matrix, this.#matrix, [zoomScale, zoomScale]);
		mat3.invert(this.#viewMatrix, this.#matrix);
		this.#updateViewProjectionMatrix();
	}

	#updateViewProjectionMatrix(): void
	{
		mat3.multiply(
			this.#viewProjectionMatrix,
			this.#projectionMatrix,
			this.#viewMatrix,
		);
		mat3.invert(this.#viewProjectionMatrixInv, this.#viewProjectionMatrix);
	}
}
