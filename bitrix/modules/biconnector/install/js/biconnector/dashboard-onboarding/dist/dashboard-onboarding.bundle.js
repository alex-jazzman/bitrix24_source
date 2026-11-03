/* eslint-disable */
this.BX = this.BX || {};
(function (exports, main_core, ui_a11y, main_popup) {
	'use strict';

	const OnboardingMode = Object.freeze({
		Tour: 'tour',
		EmptyDashboardCta: 'emptyDashboard',
		None: 'none'
	});
	const AUTO_START_DELAY_MS = 4500;
	const StepId = Object.freeze({
		Filters: 'filters',
		Presets: 'presets',
		Info: 'info',
		Share: 'share',
		BitrixGpt: 'bitrixgpt',
		Edit: 'edit'
	});
	const StepTargetSelector = Object.freeze({
		[StepId.Info]: '#info-btn',
		[StepId.Share]: '#share-btn',
		[StepId.BitrixGpt]: '[data-bitrixgpt-trigger]',
		[StepId.Edit]: '#more-btn'
	});
	const EmbedTargetBand = Object.freeze({
		[StepId.Filters]: {
			top: 0,
			left: 0,
			width: 300,
			height: null,
			heightRatio: 1 / 3
		},
		[StepId.Presets]: {
			top: 0,
			left: 0,
			width: 300,
			height: null
		}
	});
	const FlagAction = Object.freeze({
		CompleteTour: 'biconnector.dashboardonboarding.completeTour',
		DismissEmptyDashboardCta: 'biconnector.dashboardonboarding.dismissEmptyDashboardCta'
	});
	const CardSide = Object.freeze({
		Top: 'top',
		Left: 'left',
		Right: 'right'
	});
	const StepSide = Object.freeze({
		[StepId.Filters]: CardSide.Left,
		[StepId.Presets]: CardSide.Left,
		[StepId.Info]: CardSide.Top,
		[StepId.Share]: CardSide.Top,
		[StepId.BitrixGpt]: CardSide.Top,
		[StepId.Edit]: CardSide.Top
	});
	const StepImage = Object.freeze({
		[StepId.Filters]: 'stand-filters.webp',
		[StepId.Presets]: 'stand-presets.webp',
		[StepId.Info]: 'stand-report-info.webp',
		[StepId.Share]: 'stand-share-access.webp',
		[StepId.BitrixGpt]: 'stand-ai.webp',
		[StepId.Edit]: 'stand-analytics-positive.webp'
	});
	const StepImageFit = Object.freeze({
		[StepImage[StepId.Edit]]: {
			scale: 1.15,
			shiftX: -16,
			shiftY: 20
		}
	});
	const IMAGE_PATH = '/bitrix/js/biconnector/dashboard-onboarding/images/';
	const PointerShape = Object.freeze({
		up: {
			width: 36,
			height: 12,
			apex: 16.994,
			path: (x, y) => `M${x + 0.571} ${y + 12}` + `C${x + 6.687} ${y + 12} ${x + 12.393} ${y} ${x + 16.994} ${y}` + `C${x + 21.595} ${y} ${x + 27.233} ${y + 12} ${x + 33.417} ${y + 12}Z`
		},
		left: {
			width: 12,
			height: 36,
			apex: 17.006,
			path: (x, y) => `M${x + 12} ${y + 33.429}` + `C${x + 12} ${y + 27.313} ${x} ${y + 21.607} ${x} ${y + 17.006}` + `C${x} ${y + 12.405} ${x + 12} ${y + 6.767} ${x + 12} ${y + 0.583}Z`
		},
		right: {
			width: 12,
			height: 36,
			apex: 16.994,
			path: (x, y) => `M${x} ${y + 0.571}` + `C${x} ${y + 6.687} ${x + 12} ${y + 12.393} ${x + 12} ${y + 16.994}` + `C${x + 12} ${y + 21.595} ${x} ${y + 27.233} ${x} ${y + 33.417}Z`
		}
	});
	const POINTER_EDGE_MARGIN = 8;
	const POINTER_SEAM = 1;
	const WATER_SCHEME = Object.freeze({
		base: '#00078C',
		glow: '#2A76F0'
	});
	const CardIllustration = Object.freeze({
		Help: 'help',
		CreateNew: 'create-new'
	});

	const SCALE = 2;
	const TENSION = 0.065;
	const VISCOSITY = 0.99;
	const RECOVER = 0.99;
	const REFRACTION = 12;
	const SHADING = 26;
	const MAX_SHADE = 45;
	const TOUCH_RADIUS = 34;
	const TOUCH_PLATEAU = 0.55;
	const IDLE_SOURCES = 2;
	const IDLE_IMPULSE = 0.012;
	const IDLE_EVERY = 2;
	const IDLE_RADIUS = 124;
	const IDLE_SPREAD = 0.46;
	const IDLE_SPEED = 0.00009;
	const IMPULSE_PER_PX = 0.0018;
	const MAX_IMPULSE = 0.036;
	const ABSORB_MARGIN = 44;
	const EDGE_ABSORB = 0.6;
	const PAD = ABSORB_MARGIN;
	const CENTER_FOLLOW = 0.05;
	const SOURCE_EVERY = 5;
	const STEP_INTERVAL_MS = 1000 / 60;
	const STEP_TOLERANCE = 0.9;
	const GLOW_RADIUS = 0.52;
	const GLOW_BLUR = Math.round(26 / SCALE);
	const EDGE_BAND = 13;
	function touchForce(normalizedDistance) {
		if (normalizedDistance <= TOUCH_PLATEAU) {
			return 1;
		}
		const tail = (normalizedDistance - TOUCH_PLATEAU) / (1 - TOUCH_PLATEAU);
		const cosine = Math.cos(tail * Math.PI * 0.5);
		return cosine * cosine;
	}
	const falloffTables = new Map();
	function getFalloffTable(radius) {
		let table = falloffTables.get(radius);
		if (!table) {
			table = new Float32Array(radius * radius + 1);
			for (let squared = 0; squared < table.length; squared++) {
				table[squared] = touchForce(Math.sqrt(squared) / radius);
			}
			falloffTables.set(radius, table);
		}
		return table;
	}
	function hexToRgb(hex) {
		const value = hex.replace('#', '');
		const full = value.length === 3 ? [...value].map(char => char + char).join('') : value;
		return {
			r: Number.parseInt(full.slice(0, 2), 16),
			g: Number.parseInt(full.slice(2, 4), 16),
			b: Number.parseInt(full.slice(4, 6), 16)
		};
	}
	function rgba(hex, alpha) {
		const {
			r,
			g,
			b
		} = hexToRgb(hex);
		return `rgba(${r}, ${g}, ${b}, ${alpha})`;
	}
	class WaterBackdrop {
		#options;
		#host = null;
		#canvas = null;
		#context = null;
		#sourceCanvas = null;
		#sourceContext = null;
		#glowSprite = null;
		#resizeObserver = null;
		#frameRequest = 0;
		#lastStepTime = 0;
		#width = 0;
		#height = 0;
		#visibleWidth = 0;
		#visibleHeight = 0;
		#surface = new Float32Array(0);
		#velocity = new Float32Array(0);
		#absorb = new Float32Array(0);
		#output = null;
		#sourcePixels = null;
		#sourceFramesLeft = 0;
		#motionQuery = null;
		#isReducedMotion = false;
		#idleTick = 0;
		#centerX = 0.5;
		#centerY = 0.5;
		#hostRect = null;
		#pointerX = -1;
		#pointerY = -1;
		#pointerClientX = 0;
		#pointerClientY = 0;
		#pointerMoves = 0;
		#onPointerMove;
		#onViewportChange;
		#onMotionPreferenceChange;
		#onFrame;
		constructor(options) {
			this.#options = options;
			this.#onPointerMove = this.#handlePointerMove.bind(this);
			this.#onViewportChange = this.#invalidateHostRect.bind(this);
			this.#onMotionPreferenceChange = this.#handleMotionPreferenceChange.bind(this);
			this.#onFrame = this.#renderFrame.bind(this);
		}
		render() {
			this.#canvas = main_core.Tag.render`<canvas class="biconnector-dashboard-onboarding__water-canvas"></canvas>`;
			this.#host = main_core.Tag.render`
			<div class="biconnector-dashboard-onboarding__water" aria-hidden="true">
				${this.#canvas}
			</div>
		`;
			return this.#host;
		}
		start() {
			if (this.#setUp()) {
				this.#startLoop();
			}
		}
		stop() {
			this.#stopLoop();
		}
		destroy() {
			this.#stopLoop();
			if (this.#motionQuery) {
				main_core.Event.unbind(this.#motionQuery, 'change', this.#onMotionPreferenceChange);
				this.#motionQuery = null;
			}
			this.#resizeObserver?.disconnect();
			this.#resizeObserver = null;
			this.#context = null;
			this.#sourceContext = null;
			this.#sourcePixels = null;
			this.#glowSprite = null;
		}
		#setUp() {
			if (this.#context && this.#sourceContext) {
				return true;
			}
			if (!this.#host || !this.#canvas) {
				return false;
			}
			const context = this.#canvas.getContext('2d', {
				alpha: false
			});
			this.#sourceCanvas = document.createElement('canvas');
			const sourceContext = this.#sourceCanvas.getContext('2d', {
				alpha: false,
				willReadFrequently: true
			});
			if (!context || !sourceContext) {
				return false;
			}
			this.#context = context;
			this.#sourceContext = sourceContext;
			this.#motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
			main_core.Event.bind(this.#motionQuery, 'change', this.#onMotionPreferenceChange);
			this.#isReducedMotion = this.#motionQuery.matches;
			this.#resize();
			this.#resizeObserver = new ResizeObserver(() => this.#resize());
			this.#resizeObserver.observe(this.#host);
			return true;
		}
		#startLoop() {
			if (this.#frameRequest || this.#isReducedMotion || !this.#context) {
				return;
			}
			main_core.Event.bind(window, 'pointermove', this.#onPointerMove, {
				passive: true
			});
			main_core.Event.bind(window, 'scroll', this.#onViewportChange, {
				passive: true,
				capture: true
			});
			main_core.Event.bind(window, 'resize', this.#onViewportChange, {
				passive: true
			});
			this.#frameRequest = requestAnimationFrame(this.#onFrame);
		}
		#stopLoop() {
			if (!this.#frameRequest) {
				return;
			}
			cancelAnimationFrame(this.#frameRequest);
			this.#frameRequest = 0;
			this.#lastStepTime = 0;
			this.#pointerMoves = 0;
			this.#pointerX = -1;
			this.#pointerY = -1;
			main_core.Event.unbind(window, 'pointermove', this.#onPointerMove);
			main_core.Event.unbind(window, 'scroll', this.#onViewportChange, {
				capture: true
			});
			main_core.Event.unbind(window, 'resize', this.#onViewportChange);
		}
		#handleMotionPreferenceChange() {
			const isReducedMotion = this.#motionQuery?.matches === true;
			if (isReducedMotion === this.#isReducedMotion) {
				return;
			}
			this.#isReducedMotion = isReducedMotion;
			if (!this.#isReducedMotion) {
				this.#startLoop();
				return;
			}
			this.#stopLoop();
			this.#surface.fill(0);
			this.#velocity.fill(0);
			this.#invalidateSource();
			this.#drawSource(0);
			this.#paintSource();
		}
		#resize() {
			if (!this.#host || !this.#canvas || !this.#context || !this.#sourceCanvas) {
				return;
			}
			const rect = this.#host.getBoundingClientRect();
			this.#hostRect = rect;
			const visibleWidth = Math.max(2, Math.round(rect.width / SCALE));
			const visibleHeight = Math.max(2, Math.round(rect.height / SCALE));
			if (visibleWidth === this.#visibleWidth && visibleHeight === this.#visibleHeight && this.#output) {
				return;
			}
			this.#visibleWidth = visibleWidth;
			this.#visibleHeight = visibleHeight;
			this.#width = this.#visibleWidth + PAD * 2;
			this.#height = this.#visibleHeight + PAD * 2;
			this.#canvas.width = this.#width;
			this.#canvas.height = this.#height;
			main_core.Dom.style(this.#canvas, 'width', `${this.#width * SCALE}px`);
			main_core.Dom.style(this.#canvas, 'height', `${this.#height * SCALE}px`);
			main_core.Dom.style(this.#canvas, 'left', `${-PAD * SCALE}px`);
			main_core.Dom.style(this.#canvas, 'top', `${-PAD * SCALE}px`);
			this.#sourceCanvas.width = this.#width;
			this.#sourceCanvas.height = this.#height;
			this.#surface = new Float32Array(this.#width * this.#height);
			this.#velocity = new Float32Array(this.#width * this.#height);
			this.#output = this.#context.createImageData(this.#width, this.#height);
			this.#absorb = this.#buildAbsorbMap();
			this.#glowSprite = this.#buildGlowSprite();
			this.#invalidateSource();
			if (this.#isReducedMotion) {
				this.#drawSource(0);
				this.#paintSource();
			}
		}
		#buildAbsorbMap() {
			const absorb = new Float32Array(this.#width * this.#height);
			for (let y = 0; y < this.#height; y++) {
				for (let x = 0; x < this.#width; x++) {
					const distance = Math.min(x, y, this.#width - 1 - x, this.#height - 1 - y);
					const normalized = Math.min(1, distance / ABSORB_MARGIN);
					const smooth = normalized * normalized * (3 - 2 * normalized);
					absorb[y * this.#width + x] = EDGE_ABSORB + (1 - EDGE_ABSORB) * smooth;
				}
			}
			return absorb;
		}
		#drawSource(time) {
			const context = this.#sourceContext;
			if (!context) {
				return;
			}
			context.fillStyle = this.#options.base;
			context.fillRect(0, 0, this.#width, this.#height);
			const shiftX = (this.#centerX - 0.5) * 0.08;
			const shiftY = (this.#centerY - 0.5) * 0.07;
			this.#drawGlowBlob(0.3 + shiftX + Math.sin(time / 9000) * 0.06, 0.32 + shiftY + Math.cos(time / 7000) * 0.05, 0.5);
			this.#drawGlowBlob(0.74 - shiftX + Math.cos(time / 11000) * 0.05, 0.72 - shiftY + Math.sin(time / 13000) * 0.06, GLOW_RADIUS);
			const vignette = context.createRadialGradient(PAD + this.#visibleWidth / 2, PAD + this.#visibleHeight * 0.32, 0, PAD + this.#visibleWidth / 2, PAD + this.#visibleHeight * 0.32, Math.max(this.#visibleWidth, this.#visibleHeight) * 0.95);
			vignette.addColorStop(0.62, rgba(this.#options.base, 0));
			vignette.addColorStop(1, this.#options.base);
			context.fillStyle = vignette;
			context.fillRect(0, 0, this.#width, this.#height);
		}
		#refreshSource(time) {
			if (this.#sourcePixels && this.#sourceFramesLeft > 0) {
				this.#sourceFramesLeft--;
				return true;
			}
			this.#drawSource(time);
			this.#sourceFramesLeft = SOURCE_EVERY - 1;
			return this.#readSourcePixels();
		}
		#readSourcePixels() {
			if (!this.#sourceContext) {
				return false;
			}
			this.#sourcePixels = this.#sourceContext.getImageData(0, 0, this.#width, this.#height).data;
			return true;
		}
		#invalidateSource() {
			this.#sourcePixels = null;
			this.#sourceFramesLeft = 0;
		}
		#paintSource() {
			if (this.#context && this.#sourceCanvas) {
				this.#context.drawImage(this.#sourceCanvas, 0, 0);
			}
		}
		#drawGlowBlob(fractionX, fractionY, fractionRadius) {
			const context = this.#sourceContext;
			const sprite = this.#glowSprite;
			if (!context || !sprite) {
				return;
			}
			const x = PAD + fractionX * this.#visibleWidth;
			const y = PAD + fractionY * this.#visibleHeight;
			const size = sprite.width * (fractionRadius / GLOW_RADIUS);
			context.drawImage(sprite, x - size / 2, y - size / 2, size, size);
		}
		#buildGlowSprite() {
			const radius = GLOW_RADIUS * Math.max(this.#visibleWidth, this.#visibleHeight);
			const size = Math.ceil((radius + GLOW_BLUR * 3) * 2);
			const sprite = this.#glowSprite ?? document.createElement('canvas');
			sprite.width = size;
			sprite.height = size;
			const context = sprite.getContext('2d', {
				willReadFrequently: true
			});
			if (!context) {
				return null;
			}
			const center = size / 2;
			const gradient = context.createRadialGradient(center, center, 0, center, center, radius);
			gradient.addColorStop(0, this.#options.glow);
			gradient.addColorStop(1, rgba(this.#options.glow, 0));
			context.filter = `blur(${GLOW_BLUR}px)`;
			context.fillStyle = gradient;
			context.fillRect(0, 0, size, size);
			context.filter = 'none';
			return sprite;
		}
		#touch(gridX, gridY, power, radius = TOUCH_RADIUS) {
			const centerX = Math.round(gridX);
			const centerY = Math.round(gridY);
			const table = getFalloffTable(radius);
			const radiusSquared = radius * radius;
			const fromY = Math.max(1, centerY - radius);
			const toY = Math.min(this.#height - 2, centerY + radius);
			const fromX = Math.max(1, centerX - radius);
			const toX = Math.min(this.#width - 2, centerX + radius);
			for (let y = fromY; y <= toY; y++) {
				const dy = y - centerY;
				const row = y * this.#width;
				for (let x = fromX; x <= toX; x++) {
					const dx = x - centerX;
					const squared = dx * dx + dy * dy;
					if (squared <= radiusSquared) {
						this.#velocity[row + x] -= power * table[squared];
					}
				}
			}
		}
		#handlePointerMove(event) {
			this.#pointerClientX = event.clientX;
			this.#pointerClientY = event.clientY;
			this.#pointerMoves++;
		}
		#applyPointerMove() {
			if (this.#pointerMoves === 0) {
				return;
			}
			const moves = this.#pointerMoves;
			this.#pointerMoves = 0;
			const rect = this.#getHostRect();
			if (!rect || !rect.width || !rect.height) {
				return;
			}
			const offsetX = this.#pointerClientX - rect.left;
			const offsetY = this.#pointerClientY - rect.top;
			const follow = 1 - (1 - CENTER_FOLLOW) ** moves;
			this.#centerX += (offsetX / rect.width - this.#centerX) * follow;
			this.#centerY += (offsetY / rect.height - this.#centerY) * follow;
			const isOutside = offsetX < 0 || offsetY < 0 || offsetX >= rect.width || offsetY >= rect.height;
			if (isOutside) {
				this.#pointerX = -1;
				this.#pointerY = -1;
				return;
			}
			const gridX = offsetX / SCALE + PAD;
			const gridY = offsetY / SCALE + PAD;
			if (this.#pointerX >= 0) {
				this.#trailWaves(gridX, gridY);
			}
			this.#pointerX = gridX;
			this.#pointerY = gridY;
		}
		#getHostRect() {
			if (!this.#hostRect && this.#host) {
				this.#hostRect = this.#host.getBoundingClientRect();
			}
			return this.#hostRect;
		}
		#invalidateHostRect() {
			this.#hostRect = null;
		}
		#trailWaves(gridX, gridY) {
			const deltaX = gridX - this.#pointerX;
			const deltaY = gridY - this.#pointerY;
			const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
			const power = Math.min(distance * IMPULSE_PER_PX, MAX_IMPULSE);
			if (power <= 0.0008) {
				return;
			}
			const steps = Math.min(Math.ceil(distance / 8), 5);
			for (let step = 1; step <= steps; step++) {
				const part = step / steps;
				this.#touch(this.#pointerX + (gridX - this.#pointerX) * part, this.#pointerY + (gridY - this.#pointerY) * part, power);
			}
		}
		#emitIdleWaves(time) {
			this.#idleTick++;
			if (this.#idleTick % IDLE_EVERY !== 0) {
				return;
			}
			for (let index = 0; index < IDLE_SOURCES; index++) {
				const phase = index * 2.1;
				const fractionX = 0.5 + Math.sin(time * IDLE_SPEED + phase) * IDLE_SPREAD;
				const fractionY = 0.5 + Math.cos(time * IDLE_SPEED * 0.73 + phase * 1.7) * IDLE_SPREAD;
				this.#touch(PAD + fractionX * this.#visibleWidth, PAD + fractionY * this.#visibleHeight, IDLE_IMPULSE, IDLE_RADIUS);
			}
		}
		#renderFrame(time) {
			const context = this.#context;
			if (!context) {
				return;
			}
			if (!this.#isStepDue(time)) {
				this.#frameRequest = requestAnimationFrame(this.#onFrame);
				return;
			}
			this.#applyPointerMove();
			this.#emitIdleWaves(time);
			if (this.#refreshSource(time) && this.#output) {
				this.#relaxSurface();
				this.#paintRefraction(context);
			} else {
				this.#paintSource();
			}
			this.#frameRequest = requestAnimationFrame(this.#onFrame);
		}
		#isStepDue(time) {
			const elapsed = time - this.#lastStepTime;
			if (elapsed < STEP_INTERVAL_MS * STEP_TOLERANCE) {
				return false;
			}
			this.#lastStepTime = elapsed > STEP_INTERVAL_MS * 2 ? time : Math.min(this.#lastStepTime + STEP_INTERVAL_MS, time);
			return true;
		}
		#relaxSurface() {
			const width = this.#width;
			for (let y = 1; y < this.#height - 1; y++) {
				const row = y * width;
				for (let x = 1; x < width - 1; x++) {
					const index = row + x;
					const average = (this.#surface[index - 1] + this.#surface[index + 1] + this.#surface[index - width] + this.#surface[index + width]) * 0.25;
					const relaxed = this.#velocity[index] + (average - this.#surface[index]) * TENSION;
					this.#velocity[index] = relaxed * VISCOSITY * this.#absorb[index];
				}
			}
			for (let y = 1; y < this.#height - 1; y++) {
				const row = y * width;
				for (let x = 1; x < width - 1; x++) {
					const index = row + x;
					const relaxed = (this.#surface[index] + this.#velocity[index]) * RECOVER;
					this.#surface[index] = relaxed * this.#absorb[index];
				}
			}
		}
		#paintRefraction(context) {
			const output = this.#output;
			const source = this.#sourcePixels;
			if (!output || !source) {
				return;
			}
			const width = this.#width;
			const pixels = output.data;
			const fromY = Math.max(1, PAD - EDGE_BAND);
			const toY = Math.min(this.#height - 1, PAD + this.#visibleHeight + EDGE_BAND);
			const fromX = Math.max(1, PAD - EDGE_BAND);
			const toX = Math.min(width - 1, PAD + this.#visibleWidth + EDGE_BAND);
			for (let y = fromY; y < toY; y++) {
				const row = y * width;
				for (let x = fromX; x < toX; x++) {
					const index = row + x;
					const target = index * 4;
					const slopeX = this.#surface[index - 1] - this.#surface[index + 1];
					const slopeY = this.#surface[index - width] - this.#surface[index + width];
					let sampleX = x + Math.trunc(slopeX * REFRACTION);
					let sampleY = y + Math.trunc(slopeY * REFRACTION);
					sampleX = Math.min(Math.max(sampleX, 0), width - 1);
					sampleY = Math.min(Math.max(sampleY, 0), this.#height - 1);
					const sample = (sampleY * width + sampleX) * 4;
					let shade = (slopeX + slopeY) * SHADING;
					shade = Math.min(Math.max(shade, -MAX_SHADE), MAX_SHADE);
					pixels[target] = source[sample] + shade;
					pixels[target + 1] = source[sample + 1] + shade;
					pixels[target + 2] = source[sample + 2] + shade;
					pixels[target + 3] = 255;
				}
			}
			context.putImageData(output, 0, 0, fromX, fromY, toX - fromX, toY - fromY);
		}
	}

	const CARD_RADIUS = 16;
	const TARGET_GAP = 12;
	const POINTER_MODIFIERS = ['--up', '--left', '--right'];
	function cardOutline(x, y, width, height, radius) {
		const right = x + width;
		const bottom = y + height;
		return `M${x + radius} ${y}H${right - radius}` + `A${radius} ${radius} 0 0 1 ${right} ${y + radius}V${bottom - radius}` + `A${radius} ${radius} 0 0 1 ${right - radius} ${bottom}H${x + radius}` + `A${radius} ${radius} 0 0 1 ${x} ${bottom - radius}V${y + radius}` + `A${radius} ${radius} 0 0 1 ${x + radius} ${y}Z`;
	}
	function prefersReducedMotion() {
		return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
	}
	class Coachmark {
		#options;
		#popup = null;
		#water = null;
		#clipId;
		#titleId;
		#descriptionId;
		#popupId;
		#wrapper = null;
		#card = null;
		#visual = null;
		#title = null;
		#description = null;
		#counter = null;
		#previousArrow = null;
		#actions = null;
		#clipShape = null;
		#opener = null;
		#isClosing = false;
		constructor(options) {
			const uid = options.id ?? main_core.Text.getRandom();
			this.#options = options;
			this.#popupId = `biconnector-dashboard-onboarding-${uid}`;
			this.#clipId = `biconnector-dashboard-onboarding-clip-${uid}`;
			this.#titleId = `biconnector-dashboard-onboarding-title-${uid}`;
			this.#descriptionId = `biconnector-dashboard-onboarding-description-${uid}`;
		}
		show() {
			if (this.#popup) {
				return;
			}
			this.#opener = ui_a11y.FocusNavigator.getActiveElement();
			this.#popup = new main_popup.Popup({
				id: this.#popupId,
				className: 'biconnector-dashboard-onboarding-popup',
				designSystemContext: '--ui-context-content-dark',
				bindElement: this.#options.target,
				content: this.#render(),
				padding: 0,
				contentPadding: 0,
				autoHide: false,
				closeByEsc: true,
				closeIcon: false,
				cacheable: false,
				animation: prefersReducedMotion() ? false : 'fading-slide',
				angle: false,
				focusTrap: false,
				ariaLabelledBy: this.#titleId,
				ariaDescribedBy: this.#descriptionId,
				bindOptions: {
					forceBindPosition: true
				},
				events: {
					onShow: () => {
						this.#applyPosition();
						this.#water?.start();
						this.#focusCard();
					},
					onPopupClose: () => {
						this.#water?.stop();
						this.#restoreFocus();
						this.#handleClose();
					},
					onPopupDestroy: () => {
						this.#water?.destroy();
						this.#water = null;
						this.#popup = null;
						this.#releaseNodes();
					}
				}
			});
			this.#popup.show();
		}
		update(options) {
			this.#options = options;
			if (!this.#popup || !this.#card) {
				return;
			}
			main_core.Dom.attr(this.#card, 'data-card-id', options.id ?? '');
			this.#setText(this.#title, options.title);
			this.#setText(this.#description, options.text);
			this.#updateVisual();
			this.#updatePagination();
			this.#updateActions();
			this.#applyPointerMode();
			this.#popup.setBindElement(options.target);
			this.#applyPosition();
		}
		close() {
			this.#isClosing = true;
			this.#popup?.close();
			this.#isClosing = false;
		}
		#handleClose() {
			if (this.#isClosing) {
				return;
			}
			this.#options.onClose();
		}
		#focusCard() {
			const container = this.#popup?.getPopupContainer();
			if (container) {
				ui_a11y.FocusNavigator.focusContainer(container, {
					preventScroll: true
				});
			}
		}
		#restoreFocus() {
			const opener = this.#opener;
			const container = this.#popup?.getPopupContainer();
			const active = ui_a11y.FocusNavigator.getActiveElement();
			this.#opener = null;
			if (!container || !active || !container.contains(active)) {
				return;
			}
			if (opener && ui_a11y.InteractivityChecker.isFocusable(opener)) {
				ui_a11y.FocusNavigator.restoreFocus(opener, {
					preventScroll: true
				});
			}
		}
		#getPointerMode() {
			if (this.#options.side === CardSide.Left) {
				return 'left';
			}
			return this.#options.side === CardSide.Right ? 'right' : 'up';
		}
		#getPointerReserve() {
			const shape = PointerShape[this.#getPointerMode()];
			const depth = this.#options.side === CardSide.Top ? shape.height : shape.width;
			return depth - POINTER_SEAM;
		}
		#getCardOrigin() {
			const reserve = this.#getPointerReserve();
			if (this.#options.side === CardSide.Top) {
				return {
					x: 0,
					y: reserve
				};
			}
			return {
				x: this.#options.side === CardSide.Left ? reserve : 0,
				y: 0
			};
		}
		#getCardBox(box) {
			const origin = this.#getCardOrigin();
			const reserve = this.#getPointerReserve();
			const isSidePointer = this.#options.side !== CardSide.Top;
			return {
				x: origin.x,
				y: origin.y,
				width: Math.round(box.width - (isSidePointer ? reserve : 0)),
				height: Math.round(box.height - (isSidePointer ? 0 : reserve))
			};
		}
		#applyPointerMode() {
			if (!this.#wrapper) {
				return;
			}
			const mode = this.#getPointerMode();
			const reserve = `${this.#getPointerReserve()}px`;
			main_core.Dom.removeClass(this.#wrapper, POINTER_MODIFIERS);
			main_core.Dom.addClass(this.#wrapper, `--${mode}`);
			main_core.Dom.style(this.#wrapper, {
				'padding-top': mode === 'up' ? reserve : '0',
				'padding-left': mode === 'left' ? reserve : '0',
				'padding-right': mode === 'right' ? reserve : '0'
			});
		}
		#applyPosition() {
			if (!this.#popup) {
				return;
			}
			const target = this.#options.target.getBoundingClientRect();
			const origin = this.#getCardOrigin();
			const cardWidth = this.#popup.getPopupContainer().offsetWidth;
			if (this.#options.side === CardSide.Top) {
				this.#popup.setOffset({
					offsetLeft: Math.round(target.width / 2 - cardWidth / 2),
					offsetTop: TARGET_GAP - origin.y
				});
			} else {
				const cardHeight = this.#popup.getPopupContainer().offsetHeight;
				const offsetLeft = this.#options.side === CardSide.Left ? Math.round(target.width) + TARGET_GAP - origin.x : -(cardWidth + TARGET_GAP);
				this.#popup.setOffset({
					offsetLeft,
					offsetTop: -Math.round(target.height / 2 + cardHeight / 2)
				});
			}
			this.#popup.adjustPosition();
			this.#aimPointer();
		}
		#aimPointer() {
			if (!this.#popup || !this.#clipShape) {
				return;
			}
			const target = this.#options.target.getBoundingClientRect();
			const box = this.#popup.getPopupContainer().getBoundingClientRect();
			const card = this.#getCardBox(box);
			const shape = PointerShape[this.#getPointerMode()];
			const {
				x,
				y
			} = this.#getPointerOffset(target, box, card);
			this.#clipShape.setAttribute('d', `${cardOutline(card.x, card.y, card.width, card.height, CARD_RADIUS)} ${shape.path(x, y)}`);
		}
		#getPointerOffset(target, box, card) {
			const shape = PointerShape[this.#getPointerMode()];
			if (this.#options.side === CardSide.Top) {
				const left = target.left + target.width / 2 - box.left - shape.apex;
				const maxLeft = card.width - shape.width - POINTER_EDGE_MARGIN;
				return {
					x: Math.round(Math.min(Math.max(left, POINTER_EDGE_MARGIN), maxLeft)),
					y: 0
				};
			}
			const top = target.top + target.height / 2 - box.top - shape.apex;
			const maxTop = card.height - shape.height - POINTER_EDGE_MARGIN;
			return {
				x: this.#options.side === CardSide.Left ? 0 : card.x + card.width - POINTER_SEAM,
				y: Math.round(Math.min(Math.max(top, POINTER_EDGE_MARGIN), maxTop))
			};
		}
		#render() {
			this.#water = new WaterBackdrop(WATER_SCHEME);
			this.#wrapper = main_core.Tag.render`
			<div class="biconnector-dashboard-onboarding-wrapper">
				${this.#renderClipShape()}
				${this.#water.render()}
				${this.#renderCard()}
			</div>
		`;
			main_core.Dom.style(this.#wrapper, 'clip-path', `url(#${this.#clipId})`);
			this.#applyPointerMode();
			return this.#wrapper;
		}
		#renderClipShape() {
			const clip = main_core.Tag.render`
			<svg class="biconnector-dashboard-onboarding__clip" width="0" height="0" aria-hidden="true">
				<clipPath id="${this.#clipId}" clipPathUnits="userSpaceOnUse">
					<path d=""></path>
				</clipPath>
			</svg>
		`;
			this.#clipShape = clip.querySelector('path');
			return clip;
		}
		#renderCard() {
			this.#title = main_core.Tag.render`
			<span
				class="biconnector-dashboard-onboarding__title"
				id="${this.#titleId}"
				role="heading"
				aria-level="2"
				data-testid="biconnector-dashboard-onboarding-title"
			>${main_core.Text.encode(this.#options.title)}</span>
		`;
			this.#description = main_core.Tag.render`
			<p
				class="biconnector-dashboard-onboarding__description"
				id="${this.#descriptionId}"
				data-testid="biconnector-dashboard-onboarding-text"
			>${main_core.Text.encode(this.#options.text)}</p>
		`;
			this.#card = main_core.Tag.render`
			<div
				class="biconnector-dashboard-onboarding"
				data-testid="biconnector-dashboard-onboarding-card"
				data-card-id="${main_core.Text.encode(this.#options.id ?? '')}"
			>
				${this.#renderCloseButton()}
				${this.#renderVisual()}
				<div class="biconnector-dashboard-onboarding__content">
					<div class="biconnector-dashboard-onboarding__text">
						${this.#title}
						${this.#description}
					</div>
					<div class="biconnector-dashboard-onboarding__footer">
						${this.#renderPagination()}
						${this.#renderActions()}
					</div>
				</div>
			</div>
		`;
			return this.#card;
		}
		#renderVisual() {
			if (main_core.Type.isDomNode(this.#options.illustrationNode)) {
				this.#visual = main_core.Tag.render`
				<div class="biconnector-dashboard-onboarding__visual --icon">
					${this.#options.illustrationNode}
				</div>
			`;
				return this.#visual;
			}
			const image = main_core.Tag.render`
			<img
				class="biconnector-dashboard-onboarding__image"
				src="${main_core.Text.encode(IMAGE_PATH + this.#options.image)}"
				alt=""
				draggable="false"
			>
		`;
			this.#applyImageFit(image);
			this.#visual = main_core.Tag.render`
			<div class="biconnector-dashboard-onboarding__visual">
				<div class="biconnector-dashboard-onboarding__visual-inner">
					${image}
				</div>
			</div>
		`;
			return this.#visual;
		}
		#applyImageFit(image) {
			const fit = StepImageFit[this.#options.image ?? ''];
			if (!fit) {
				return;
			}
			main_core.Dom.style(image, {
				'--biconnector-onboarding-mascot-scale': String(fit.scale),
				'--biconnector-onboarding-mascot-shift-x': `${fit.shiftX}px`,
				'--biconnector-onboarding-mascot-shift-y': `${fit.shiftY}px`
			});
		}
		#updateVisual() {
			const previous = this.#visual;
			if (previous) {
				main_core.Dom.replace(previous, this.#renderVisual());
			}
		}
		#renderPagination() {
			if (!this.#options.pagination) {
				return '';
			}
			this.#counter = main_core.Tag.render`
			<span
				class="biconnector-dashboard-onboarding__counter"
				data-testid="biconnector-dashboard-onboarding-counter"
			></span>
		`;
			this.#previousArrow = this.#renderArrow('prev');
			const nextArrow = this.#renderArrow('next');
			main_core.Event.bind(this.#previousArrow, 'click', () => {
				if (this.#previousArrow?.getAttribute('aria-disabled') === 'true') {
					return;
				}
				this.#options.pagination?.onPrev();
			});
			main_core.Event.bind(nextArrow, 'click', () => this.#options.pagination?.onNext());
			const pagination = main_core.Tag.render`
			<div class="biconnector-dashboard-onboarding__pagination">
				${this.#previousArrow}
				${this.#counter}
				${nextArrow}
			</div>
		`;
			this.#updatePagination();
			return pagination;
		}
		#updatePagination() {
			const pagination = this.#options.pagination;
			if (!pagination) {
				return;
			}
			this.#setText(this.#counter, `${pagination.current} / ${pagination.total}`);
			if (this.#previousArrow) {
				this.#previousArrow.setAttribute('aria-disabled', String(pagination.current <= 1));
			}
		}
		#renderArrow(direction) {
			const path = direction === 'prev' ? 'M12.08 14.59a.58.58 0 010 .82.58.58 0 01-.83 0l-5-5a.58.58 0 010-.82l5-5a.58.58 0 01.83.82L7.49 10l4.59 4.59z' : 'M7.92 5.41a.58.58 0 01.83-.82l5 5a.58.58 0 010 .82l-5 5a.58.58 0 01-.83-.82L12.51 10 7.92 5.41z';
			return main_core.Tag.render`
			<button
				type="button"
				class="biconnector-dashboard-onboarding__arrow"
				data-testid="biconnector-dashboard-onboarding-${direction}-btn"
				aria-label="${direction === 'prev' ? main_core.Text.encode(this.#options.previousLabel) : main_core.Text.encode(this.#options.nextLabel)}"
			>
				<svg viewBox="0 0 20 20" width="20" height="20" fill="none" aria-hidden="true">
					<path d="${path}" fill="currentColor"></path>
				</svg>
			</button>
		`;
		}
		#renderActions() {
			const container = main_core.Tag.render`<div class="biconnector-dashboard-onboarding__actions"></div>`;
			this.#actions = container;
			this.#fillActions(container);
			return container;
		}
		#fillActions(container) {
			this.#options.actions.forEach((action, index) => {
				main_core.Dom.append(this.#renderAction(index), container);
			});
		}
		#updateActions() {
			const container = this.#actions;
			if (!container) {
				return;
			}
			const buttons = [...container.children];
			if (buttons.length === this.#options.actions.length) {
				buttons.forEach((button, index) => this.#applyActionDesign(button, index));
				return;
			}
			main_core.Dom.clean(container);
			this.#fillActions(container);
		}
		#renderAction(index) {
			const button = main_core.Tag.render`
			<button type="button" class="biconnector-dashboard-onboarding__button"></button>
		`;
			this.#applyActionDesign(button, index);
			main_core.Event.bind(button, 'click', () => this.#options.actions[index]?.onClick());
			return button;
		}
		#applyActionDesign(button, index) {
			const action = this.#options.actions[index];
			if (!action) {
				return;
			}
			const isPrimary = action.primary === true;
			main_core.Dom.removeClass(button, ['--filled', '--plain']);
			main_core.Dom.addClass(button, isPrimary ? '--filled' : '--plain');
			main_core.Dom.attr(button, 'data-testid', `biconnector-dashboard-onboarding-${isPrimary ? 'primary' : 'secondary'}-btn`);
			main_core.Dom.adjust(button, {
				text: action.text
			});
		}
		#renderCloseButton() {
			const button = main_core.Tag.render`
			<button
				type="button"
				class="biconnector-dashboard-onboarding__close"
				data-testid="biconnector-dashboard-onboarding-close-btn"
				aria-label="${main_core.Text.encode(this.#options.closeLabel)}"
			>
				<svg viewBox="0 0 20 20" width="20" height="20" fill="none" aria-hidden="true">
					<path
						d="M5.7 5.7a.6.6 0 01.84 0L10 9.16l3.46-3.47a.6.6 0 01.84.85L10.84 10l3.46 3.46a.6.6 0 01-.84.84L10 10.84 6.54 14.3a.6.6 0 01-.84-.84L9.16 10 5.7 6.54a.6.6 0 010-.84z"
						fill="currentColor"
					></path>
				</svg>
			</button>
		`;
			main_core.Event.bind(button, 'click', () => this.#popup?.close());
			return main_core.Tag.render`
			<div class="biconnector-dashboard-onboarding__close-column">
				${button}
			</div>
		`;
		}
		#setText(node, text) {
			if (node) {
				main_core.Dom.adjust(node, {
					text
				});
			}
		}
		#releaseNodes() {
			this.#wrapper = null;
			this.#card = null;
			this.#visual = null;
			this.#title = null;
			this.#description = null;
			this.#counter = null;
			this.#previousArrow = null;
			this.#actions = null;
			this.#clipShape = null;
		}
	}

	class OnboardingFlagService {
		completeTour() {
			return this.#send(FlagAction.CompleteTour);
		}
		dismissEmptyDashboardCta() {
			return this.#send(FlagAction.DismissEmptyDashboardCta);
		}
		#send(action) {
			return main_core.ajax.runAction(action, {
				data: {}
			}).catch(() => {});
		}
	}
	const onboardingFlagService = new OnboardingFlagService();

	function buildStepQueue(stepIds, resolveTarget) {
		const steps = [];
		stepIds.forEach(stepId => {
			const target = resolveTarget(stepId);
			if (!main_core.Type.isDomNode(target) || !isVisible(target)) {
				return;
			}
			const phrasePrefix = `BICONNECTOR_DASHBOARD_ONBOARDING_STEP_${stepId.toUpperCase()}`;
			steps.push({
				id: stepId,
				target,
				title: main_core.Loc.getMessage(`${phrasePrefix}_TITLE`) ?? '',
				text: main_core.Loc.getMessage(`${phrasePrefix}_TEXT`) ?? '',
				side: StepSide[stepId],
				image: StepImage[stepId]
			});
		});
		return steps;
	}
	function isVisible(node) {
		return node.offsetParent !== null || window.getComputedStyle(node).position === 'fixed';
	}

	class EmbedTarget {
		#frameNode;
		#proxies = new Map();
		constructor(frameNode) {
			this.#frameNode = frameNode;
		}
		resolve(stepIds) {
			this.destroy();
			const frameRect = this.#frameNode ? main_core.Dom.getPosition(this.#frameNode) : null;
			if (!frameRect || frameRect.width <= 0 || frameRect.height <= 0) {
				return this.#proxies;
			}
			stepIds.forEach(stepId => {
				const band = EmbedTargetBand[stepId];
				if (!band) {
					return;
				}
				this.#proxies.set(stepId, this.#createProxy(band, frameRect));
			});
			return this.#proxies;
		}
		destroy() {
			this.#proxies.forEach(proxy => main_core.Dom.remove(proxy));
			this.#proxies.clear();
		}
		#createProxy(band, frameRect) {
			const width = Math.min(band.width, frameRect.width);
			const height = this.#getBandHeight(band, frameRect.height);
			const proxy = main_core.Dom.create('div', {
				props: {
					className: 'biconnector-dashboard-onboarding__frame-target'
				},
				style: {
					top: `${frameRect.top + band.top}px`,
					left: `${frameRect.left + band.left}px`,
					width: `${width}px`,
					height: `${height}px`
				}
			});
			main_core.Dom.append(proxy, document.body);
			return proxy;
		}
		#getBandHeight(band, frameHeight) {
			if (band.heightRatio !== undefined) {
				return Math.round(frameHeight * band.heightRatio);
			}
			return band.height === null ? frameHeight : Math.min(band.height, frameHeight);
		}
	}

	class DashboardOnboarding {
		#config;
		#embedTarget;
		#isEmbedReady;
		#onEditRequested;
		#coachmark = null;
		#steps = [];
		#currentIndex = 0;
		#isManualRun = false;
		#hasStarted = false;
		#isTourRunning = false;
		#autoStartTimer = null;
		constructor(options) {
			this.#config = options.config;
			this.#onEditRequested = options.onEditRequested;
			this.#embedTarget = new EmbedTarget(options.frameNode);
			this.#isEmbedReady = options.isEmbedReady;
		}
		canRestart() {
			return this.#config.canRestart === true;
		}
		async start() {
			if (this.#hasStarted) {
				return;
			}
			if (this.#config.mode === OnboardingMode.EmptyDashboardCta) {
				this.#hasStarted = true;
				void this.#showEmptyDashboardCta();
				return;
			}
			if (this.#config.mode === OnboardingMode.Tour && this.#isEmbedReady()) {
				this.#hasStarted = true;
				this.#autoStartTimer = setTimeout(() => {
					this.#autoStartTimer = null;
					if (this.#isEmbedReady()) {
						void this.#runTour(false);
						return;
					}
					this.#hasStarted = false;
				}, AUTO_START_DELAY_MS);
			}
		}
		async restart() {
			if (this.#autoStartTimer !== null) {
				this.#cancelAutoStart();
				void onboardingFlagService.completeTour();
			} else if (this.#isTourRunning && !this.#isManualRun) {
				this.#finishTour(false);
			}
			await this.#runTour(true);
		}
		destroy() {
			this.#cancelAutoStart();
			this.#isTourRunning = false;
			this.#closeCoachmark();
			this.#embedTarget.destroy();
		}
		#cancelAutoStart() {
			if (this.#autoStartTimer !== null) {
				clearTimeout(this.#autoStartTimer);
				this.#autoStartTimer = null;
			}
		}
		async #runTour(isManual) {
			this.#closeCoachmark();
			this.#isManualRun = isManual;
			const stepIds = this.#config.steps;
			const embedTargets = this.#isEmbedReady() ? this.#embedTarget.resolve(stepIds) : new Map();
			this.#steps = buildStepQueue(stepIds, stepId => this.#resolveTarget(stepId, embedTargets));
			if (this.#steps.length === 0) {
				this.#embedTarget.destroy();
				if (!isManual) {
					void onboardingFlagService.completeTour();
				}
				return;
			}
			this.#isTourRunning = true;
			this.#showStep(0);
		}
		#showStep(index) {
			const step = this.#steps[index];
			if (!step) {
				return;
			}
			this.#currentIndex = index;
			const options = this.#getStepOptions(step, index);
			if (this.#coachmark) {
				this.#coachmark.update(options);
				this.#announceStep(step, index);
				return;
			}
			this.#coachmark = new Coachmark(options);
			this.#coachmark.show();
		}
		#getStepOptions(step, index) {
			const isLastStep = index === this.#steps.length - 1;
			return {
				...this.#getCommonLabels(),
				id: `tour-${step.id}`,
				target: step.target,
				side: step.side,
				title: step.title,
				text: step.text,
				image: step.image,
				pagination: {
					current: index + 1,
					total: this.#steps.length,
					onPrev: () => this.#showStep(Math.max(0, index - 1)),
					onNext: () => this.#goForward(isLastStep)
				},
				actions: [{
					text: isLastStep ? main_core.Loc.getMessage('BICONNECTOR_DASHBOARD_ONBOARDING_DONE_BUTTON') ?? '' : main_core.Loc.getMessage('BICONNECTOR_DASHBOARD_ONBOARDING_NEXT_BUTTON') ?? '',
					primary: true,
					onClick: () => this.#goForward(isLastStep)
				}],
				onClose: () => {
					this.#coachmark = null;
					this.#finishTour(true);
				}
			};
		}
		#announceStep(step, index) {
			const message = main_core.Loc.getMessage('BICONNECTOR_DASHBOARD_ONBOARDING_STEP_ANNOUNCEMENT', {
				'#CURRENT#': String(index + 1),
				'#TOTAL#': String(this.#steps.length),
				'#TITLE#': step.title
			});
			if (main_core.Type.isStringFilled(message)) {
				ui_a11y.LiveAnnouncer.announce(message);
			}
		}
		#goForward(isLastStep) {
			if (isLastStep) {
				this.#closeCoachmark();
				this.#finishTour(false);
				return;
			}
			this.#showStep(this.#currentIndex + 1);
		}
		#finishTour(isSkipped) {
			this.#isTourRunning = false;
			this.#embedTarget.destroy();
			if (this.#isManualRun) {
				return;
			}
			void onboardingFlagService.completeTour();
			if (isSkipped) {
				void this.#showRestartHint();
			}
		}
		async #loadIllustration(name) {
			try {
				const {
					Illustration
				} = await main_core.Runtime.loadExtension('ui.system.illustration');
				return new Illustration({
					name,
					size: 98
				}).render();
			} catch {
				return null;
			}
		}
		async #showEmptyDashboardCta() {
			const target = document.querySelector(StepTargetSelector[StepId.Edit]);
			if (!main_core.Type.isDomNode(target)) {
				return;
			}
			const illustrationNode = await this.#loadIllustration(CardIllustration.CreateNew);
			if (!target.isConnected) {
				return;
			}
			this.#coachmark = new Coachmark({
				...this.#getCommonLabels(),
				id: 'empty-dashboard-cta',
				target,
				side: CardSide.Top,
				title: main_core.Loc.getMessage('BICONNECTOR_DASHBOARD_ONBOARDING_EMPTY_DASHBOARD_CTA_TITLE') ?? '',
				text: main_core.Loc.getMessage('BICONNECTOR_DASHBOARD_ONBOARDING_EMPTY_DASHBOARD_CTA_TEXT') ?? '',
				illustrationNode,
				actions: [{
					text: main_core.Loc.getMessage('BICONNECTOR_DASHBOARD_ONBOARDING_CLOSE_BUTTON') ?? '',
					onClick: () => {
						this.#closeCoachmark();
						void onboardingFlagService.dismissEmptyDashboardCta();
					}
				}, {
					text: main_core.Loc.getMessage('BICONNECTOR_DASHBOARD_ONBOARDING_EMPTY_DASHBOARD_CTA_EDIT_BUTTON') ?? '',
					primary: true,
					onClick: () => {
						this.#closeCoachmark();
						void onboardingFlagService.dismissEmptyDashboardCta();
						this.#onEditRequested();
					}
				}],
				onClose: () => {
					this.#coachmark = null;
					void onboardingFlagService.dismissEmptyDashboardCta();
				}
			});
			this.#coachmark.show();
		}
		async #showRestartHint() {
			const target = document.querySelector(StepTargetSelector[StepId.Edit]);
			if (!main_core.Type.isDomNode(target)) {
				return;
			}
			const illustrationNode = await this.#loadIllustration(CardIllustration.Help);
			if (!target.isConnected) {
				return;
			}
			this.#coachmark = new Coachmark({
				...this.#getCommonLabels(),
				id: 'restart-hint',
				target,
				side: CardSide.Top,
				title: main_core.Loc.getMessage('BICONNECTOR_DASHBOARD_ONBOARDING_RESTART_HINT_TITLE') ?? '',
				text: main_core.Loc.getMessage('BICONNECTOR_DASHBOARD_ONBOARDING_RESTART_HINT_TEXT') ?? '',
				illustrationNode,
				actions: [{
					text: main_core.Loc.getMessage('BICONNECTOR_DASHBOARD_ONBOARDING_GOT_IT_BUTTON') ?? '',
					primary: true,
					onClick: () => this.#closeCoachmark()
				}],
				onClose: () => {
					this.#coachmark = null;
				}
			});
			this.#coachmark.show();
		}
		#getCommonLabels() {
			return {
				closeLabel: main_core.Loc.getMessage('BICONNECTOR_DASHBOARD_ONBOARDING_CLOSE_HINT') ?? '',
				previousLabel: main_core.Loc.getMessage('BICONNECTOR_DASHBOARD_ONBOARDING_PREVIOUS_STEP') ?? '',
				nextLabel: main_core.Loc.getMessage('BICONNECTOR_DASHBOARD_ONBOARDING_NEXT_STEP') ?? ''
			};
		}
		#closeCoachmark() {
			this.#coachmark?.close();
			this.#coachmark = null;
		}
		#resolveTarget(stepId, embedTargets) {
			if (EmbedTargetBand[stepId]) {
				return embedTargets.get(stepId) ?? null;
			}
			const selector = StepTargetSelector[stepId];
			return main_core.Type.isStringFilled(selector) ? document.querySelector(selector) : null;
		}
	}

	exports.DashboardOnboarding = DashboardOnboarding;
	exports.OnboardingMode = OnboardingMode;
	exports.StepId = StepId;

})(this.BX.BIConnector = this.BX.BIConnector || {}, BX, BX.UI.Accessibility, BX.Main);
//# sourceMappingURL=dashboard-onboarding.bundle.js.map
