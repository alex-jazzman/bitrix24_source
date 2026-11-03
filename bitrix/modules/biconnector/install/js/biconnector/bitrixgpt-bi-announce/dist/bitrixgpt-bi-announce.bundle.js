/* eslint-disable */
this.BX = this.BX || {};
(function (exports, main_core, main_core_events, ui_autoLaunch, ui_buttons, ui_designTokens_air, ui_iconSet_api_core, ui_iconSet_outline, ui_system_dialog, ui_system_label, ui_system_typography, biconnector_apacheSupersetAnalytics) {
	'use strict';

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
	const GLOW_BLUR = 26;
	const GLOW_POINTER_X = 0.08;
	const GLOW_POINTER_Y = 0.07;
	const GLOW_FOLLOW = 0.05;
	class WaterBackdrop {
		#host;
		#base;
		#canvas;
		#context;
		#source;
		#sourceContext;
		#sourceData = null;
		#image = null;
		#width = 0;
		#height = 0;
		#visibleWidth = 0;
		#visibleHeight = 0;
		#field = new Float32Array(0);
		#velocity = new Float32Array(0);
		#absorb = new Float32Array(0);
		#output = null;
		#glow;
		#glowX = 0.5;
		#glowY = 0.5;
		#observer = null;
		#frameId = 0;
		#idleTick = 0;
		#isResting = true;
		#previous = null;
		static mount(options) {
			if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
				return null;
			}
			const canvas = document.createElement('canvas');
			const source = document.createElement('canvas');
			const context = canvas.getContext('2d', {
				alpha: false
			});
			const sourceContext = source.getContext('2d', {
				alpha: false
			});
			if (context === null || sourceContext === null) {
				return null;
			}
			return new WaterBackdrop(options, canvas, context, source, sourceContext);
		}
		constructor(options, canvas, context, source, sourceContext) {
			this.#host = options.host;
			this.#base = options.base;
			this.#glow = options.glow ?? null;
			this.#canvas = canvas;
			this.#context = context;
			this.#source = source;
			this.#sourceContext = sourceContext;
			main_core.Dom.style(this.#canvas, {
				position: 'absolute',
				display: 'block',
				pointerEvents: 'none'
			});
			this.#host.append(this.#canvas);
			if (options.imageUrl !== undefined) {
				this.#loadImage(options.imageUrl);
			}
			this.#resize();
			this.#observer = new ResizeObserver(() => this.#resize());
			this.#observer.observe(this.#host);
			main_core.Event.bind(window, 'pointermove', this.#handlePointerMove, {
				passive: true
			});
			this.#frameId = requestAnimationFrame(this.#renderFrame);
		}
		destroy() {
			main_core.Event.unbind(window, 'pointermove', this.#handlePointerMove);
			cancelAnimationFrame(this.#frameId);
			this.#observer?.disconnect();
			this.#observer = null;
			this.#canvas.remove();
		}
		#loadImage(url) {
			const image = new Image();
			main_core.Event.bind(image, 'load', () => {
				this.#image = image;
			});
			image.src = url;
		}
		#resize() {
			this.#visibleWidth = Math.max(2, Math.round(this.#host.clientWidth / SCALE));
			this.#visibleHeight = Math.max(2, Math.round(this.#host.clientHeight / SCALE));
			this.#width = this.#visibleWidth + PAD * 2;
			this.#height = this.#visibleHeight + PAD * 2;
			this.#canvas.width = this.#width;
			this.#canvas.height = this.#height;
			main_core.Dom.style(this.#canvas, {
				width: `${this.#width * SCALE}px`,
				height: `${this.#height * SCALE}px`,
				left: `${-PAD * SCALE}px`,
				top: `${-PAD * SCALE}px`
			});
			this.#source.width = this.#width;
			this.#source.height = this.#height;
			const cells = this.#width * this.#height;
			this.#field = new Float32Array(cells);
			this.#velocity = new Float32Array(cells);
			this.#output = this.#context.createImageData(this.#width, this.#height);
			this.#buildAbsorbMask();
		}
		#buildAbsorbMask() {
			const width = this.#width;
			const height = this.#height;
			const mask = new Float32Array(width * height);
			for (let y = 0; y < height; y++) {
				for (let x = 0; x < width; x++) {
					const distance = Math.min(x, y, width - 1 - x, height - 1 - y);
					const ratio = Math.min(1, distance / ABSORB_MARGIN);
					const eased = ratio * ratio * (3 - 2 * ratio);
					mask[y * width + x] = EDGE_ABSORB + (1 - EDGE_ABSORB) * eased;
				}
			}
			this.#absorb = mask;
		}
		#drawSource(time) {
			this.#sourceContext.filter = 'none';
			if (this.#image === null) {
				this.#drawPaintedSource(time);
			} else {
				this.#drawImageSource(this.#image);
			}
			this.#sourceData = this.#sourceContext.getImageData(0, 0, this.#width, this.#height).data;
		}
		#drawImageSource(image) {
			const scale = Math.max(this.#width / image.width, this.#height / image.height);
			const drawWidth = image.width * scale;
			const drawHeight = image.height * scale;
			this.#sourceContext.drawImage(image, (this.#width - drawWidth) / 2, (this.#height - drawHeight) / 2, drawWidth, drawHeight);
		}
		#drawPaintedSource(time) {
			const context = this.#sourceContext;
			context.fillStyle = this.#base;
			context.fillRect(0, 0, this.#width, this.#height);
			const glow = this.#glow;
			if (glow === null) {
				return;
			}
			const pointerX = (this.#glowX - 0.5) * GLOW_POINTER_X;
			const pointerY = (this.#glowY - 0.5) * GLOW_POINTER_Y;
			context.filter = `blur(${Math.round(GLOW_BLUR / SCALE)}px)`;
			this.#drawGlow(glow, 0.3 + pointerX + Math.sin(time / 9000) * 0.06, 0.32 + pointerY + Math.cos(time / 7000) * 0.05, 0.5);
			this.#drawGlow(glow, 0.74 - pointerX + Math.cos(time / 11000) * 0.05, 0.72 - pointerY + Math.sin(time / 13000) * 0.06, 0.52);
			context.filter = 'none';
			this.#drawVignette();
		}
		#drawGlow(glow, ratioX, ratioY, ratioRadius) {
			const x = PAD + ratioX * this.#visibleWidth;
			const y = PAD + ratioY * this.#visibleHeight;
			const radius = ratioRadius * Math.max(this.#visibleWidth, this.#visibleHeight);
			const gradient = this.#sourceContext.createRadialGradient(x, y, 0, x, y, radius);
			gradient.addColorStop(0, glow);
			gradient.addColorStop(1, WaterBackdrop.#transparent(glow));
			this.#sourceContext.fillStyle = gradient;
			this.#sourceContext.fillRect(0, 0, this.#width, this.#height);
		}
		#drawVignette() {
			const centerX = PAD + this.#visibleWidth / 2;
			const centerY = PAD + this.#visibleHeight * 0.32;
			const radius = Math.max(this.#visibleWidth, this.#visibleHeight) * 0.95;
			const gradient = this.#sourceContext.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius);
			gradient.addColorStop(0.62, WaterBackdrop.#transparent(this.#base));
			gradient.addColorStop(1, this.#base);
			this.#sourceContext.fillStyle = gradient;
			this.#sourceContext.fillRect(0, 0, this.#width, this.#height);
		}
		static #transparent(color) {
			const parsed = /^rgba?\(([^)]+)\)$/.exec(color.trim());
			if (parsed !== null) {
				const [red, green, blue] = parsed[1].split(',');
				return `rgba(${red}, ${green}, ${blue}, 0)`;
			}
			const hex = /^#([\da-f]{3}|[\da-f]{6})$/i.exec(color.trim());
			if (hex === null) {
				return 'rgba(0, 0, 0, 0)';
			}
			const digits = hex[1].length === 3 ? [...hex[1]].map(digit => digit + digit).join('') : hex[1];
			const value = Number.parseInt(digits, 16);
			return `rgba(${value >> 16 & 255}, ${value >> 8 & 255}, ${value & 255}, 0)`;
		}
		#touch(gridX, gridY, power, radius = TOUCH_RADIUS) {
			const width = this.#width;
			const height = this.#height;
			const centerX = Math.round(gridX);
			const centerY = Math.round(gridY);
			for (let dy = -radius; dy <= radius; dy++) {
				const y = centerY + dy;
				if (y < 1 || y >= height - 1) {
					continue;
				}
				for (let dx = -radius; dx <= radius; dx++) {
					const x = centerX + dx;
					if (x < 1 || x >= width - 1) {
						continue;
					}
					const distance = Math.hypot(dx, dy);
					if (distance > radius) {
						continue;
					}
					this.#velocity[y * width + x] -= power * WaterBackdrop.#plateau(distance / radius);
				}
			}
			this.#isResting = false;
		}
		static #plateau(ratio) {
			if (ratio <= TOUCH_PLATEAU) {
				return 1;
			}
			const falloff = (ratio - TOUCH_PLATEAU) / (1 - TOUCH_PLATEAU);
			const cosine = Math.cos(falloff * Math.PI * 0.5);
			return cosine * cosine;
		}
		#handlePointerMove = event => {
			const box = this.#host.getBoundingClientRect();
			if (box.width <= 0 || box.height <= 0) {
				return;
			}
			if (event.clientX < box.left || event.clientY < box.top || event.clientX >= box.right || event.clientY >= box.bottom) {
				this.#previous = null;
				return;
			}
			this.#glowX += ((event.clientX - box.left) / box.width - this.#glowX) * GLOW_FOLLOW;
			this.#glowY += ((event.clientY - box.top) / box.height - this.#glowY) * GLOW_FOLLOW;
			const current = {
				x: (event.clientX - box.left) / SCALE + PAD,
				y: (event.clientY - box.top) / SCALE + PAD
			};
			const previous = this.#previous;
			if (previous !== null) {
				const distance = Math.hypot(current.x - previous.x, current.y - previous.y);
				const power = Math.min(distance * IMPULSE_PER_PX, MAX_IMPULSE);
				if (power > 0.0008) {
					const steps = Math.min(Math.ceil(distance / 8), 5);
					for (let step = 1; step <= steps; step++) {
						const ratio = step / steps;
						this.#touch(previous.x + (current.x - previous.x) * ratio, previous.y + (current.y - previous.y) * ratio, power);
					}
				}
			}
			this.#previous = current;
		};
		#idle(time) {
			this.#idleTick++;
			if (this.#idleTick % IDLE_EVERY !== 0) {
				return;
			}
			for (let index = 0; index < IDLE_SOURCES; index++) {
				const phase = index * 2.1;
				const ratioX = 0.5 + Math.sin(time * IDLE_SPEED + phase) * IDLE_SPREAD;
				const ratioY = 0.5 + Math.cos(time * IDLE_SPEED * 0.73 + phase * 1.7) * IDLE_SPREAD;
				this.#touch(PAD + ratioX * this.#visibleWidth, PAD + ratioY * this.#visibleHeight, IDLE_IMPULSE, IDLE_RADIUS);
			}
		}
		#renderFrame = time => {
			this.#drawSource(time);
			this.#idle(time);
			if (this.#isResting || this.#output === null || this.#sourceData === null) {
				this.#context.drawImage(this.#source, 0, 0);
				this.#frameId = requestAnimationFrame(this.#renderFrame);
				return;
			}
			this.#step();
			this.#paint();
			this.#frameId = requestAnimationFrame(this.#renderFrame);
		};
		#step() {
			const width = this.#width;
			const height = this.#height;
			const field = this.#field;
			const velocity = this.#velocity;
			const absorb = this.#absorb;
			for (let y = 1; y < height - 1; y++) {
				const row = y * width;
				for (let x = 1; x < width - 1; x++) {
					const index = row + x;
					const average = (field[index - 1] + field[index + 1] + field[index - width] + field[index + width]) * 0.25;
					velocity[index] = (velocity[index] + (average - field[index]) * TENSION) * VISCOSITY * absorb[index];
				}
			}
			for (let y = 1; y < height - 1; y++) {
				const row = y * width;
				for (let x = 1; x < width - 1; x++) {
					const index = row + x;
					field[index] = (field[index] + velocity[index]) * RECOVER * absorb[index];
				}
			}
		}
		#paint() {
			const output = this.#output;
			const source = this.#sourceData;
			if (output === null || source === null) {
				return;
			}
			const width = this.#width;
			const height = this.#height;
			const field = this.#field;
			const target = output.data;
			const fromY = Math.max(1, PAD - 1);
			const toY = Math.min(height - 1, PAD + this.#visibleHeight + 1);
			const fromX = Math.max(1, PAD - 1);
			const toX = Math.min(width - 1, PAD + this.#visibleWidth + 1);
			for (let y = fromY; y < toY; y++) {
				const row = y * width;
				for (let x = fromX; x < toX; x++) {
					const index = row + x;
					const targetIndex = index * 4;
					const tiltX = field[index - 1] - field[index + 1];
					const tiltY = field[index - width] - field[index + width];
					let sourceX = x + Math.trunc(tiltX * REFRACTION);
					let sourceY = y + Math.trunc(tiltY * REFRACTION);
					sourceX = Math.min(width - 1, Math.max(0, sourceX));
					sourceY = Math.min(height - 1, Math.max(0, sourceY));
					const sourceIndex = (sourceY * width + sourceX) * 4;
					let shade = (tiltX + tiltY) * SHADING;
					shade = Math.min(MAX_SHADE, Math.max(-MAX_SHADE, shade));
					target[targetIndex] = source[sourceIndex] + shade;
					target[targetIndex + 1] = source[sourceIndex + 1] + shade;
					target[targetIndex + 2] = source[sourceIndex + 2] + shade;
					target[targetIndex + 3] = 255;
				}
			}
			this.#context.putImageData(output, 0, 0, fromX, fromY, toX - fromX, toY - fromY);
		}
	}

	const AnnounceSurface = Object.freeze({
		Detail: 'detail',
		List: 'list'
	});
	const CLAIM_ACTION = 'biconnector.dashboard.claimBitrixGptBiAnnouncement';
	const LAUNCH_ITEM_ID = 'biconnector-bitrixgpt-bi-announce';
	const LAUNCHER_CLASS_NAME = 'BX.BIConnector.BitrixGptLauncher';
	const BLOCK_CLASS = 'biconnector-bitrixgpt-bi-announce';
	const TITLE_ID = 'biconnector-bitrixgpt-bi-announce-title';
	const ART_LAYERS = ['back', 'icon-0', 'icon-1', 'icon-2', 'icon-3', 'logo', 'mascot'];
	const BRAND_WORD = 'BitrixGPT';
	const BACKGROUND_URL_PATTERN = /url\(["']?(.+?)["']?\)/;
	const PARALLAX_SHIFT_X = 12;
	const PARALLAX_SHIFT_Y = 8;
	const EMBED_READY_TIMEOUT = 10000;
	const EmbedEvent = Object.freeze({
		Ready: 'biconnector:dashboard-embed-ready',
		Error: 'biconnector:dashboard-embed-error'
	});
	const EmbedOutcome = Object.freeze({
		Ready: 'ready',
		Error: 'error'
	});
	const ANALYTICS_CATEGORY = 'bitrixgpt_bi_announce';
	const AnalyticsEvent = Object.freeze({
		Shown: 'popup_shown',
		Try: 'popup_cta_try',
		Later: 'popup_later',
		Close: 'popup_close'
	});
	const getMessage = key => {
		const versioned = `${key}_MSGVER_1`;
		return main_core.Loc.getMessage(main_core.Loc.hasMessage(versioned) ? versioned : key) ?? '';
	};
	class BitrixGptBiAnnounce {
		static #instance = null;
		#surface;
		#isEmbedReady;
		#isHintShown;
		#dialog = null;
		#contentNode = null;
		#done = null;
		#closeEvent = null;
		#isCloseEventSent = false;
		#water = null;
		#artNode = null;
		#pointer = null;
		#parallaxFrameId = null;
		#embedOutcome = null;
		#embedWaiter = null;
		#embedTimeoutId = null;
		#isSubscribedToEmbed = false;
		constructor(options) {
			this.#surface = options.surface;
			this.#isEmbedReady = main_core.Type.isFunction(options.isEmbedReady) ? options.isEmbedReady : null;
			this.#isHintShown = main_core.Type.isFunction(options.isHintShown) ? options.isHintShown : null;
		}
		static init(options) {
			if (BitrixGptBiAnnounce.#instance !== null) {
				return BitrixGptBiAnnounce.#instance;
			}
			const knownSurfaces = Object.values(AnnounceSurface);
			const isKnownSurface = knownSurfaces.includes(options?.surface);
			if (!isKnownSurface || options.canShow !== true) {
				return null;
			}
			const announce = new BitrixGptBiAnnounce(options);
			BitrixGptBiAnnounce.#instance = announce;
			announce.#register();
			return announce;
		}
		destroy() {
			ui_autoLaunch.AutoLauncher.unregister(LAUNCH_ITEM_ID);
			this.#unbindParallax();
			this.#unmountWater();
			this.#release();
			this.#dialog = null;
			if (BitrixGptBiAnnounce.#instance === this) {
				BitrixGptBiAnnounce.#instance = null;
			}
		}
		#register() {
			if (this.#surface === AnnounceSurface.Detail) {
				this.#subscribeToEmbed();
			}
			const launchOptions = {
				id: LAUNCH_ITEM_ID,
				priority: ui_autoLaunch.LaunchPriority.NORMAL,
				allowLaunchAfterOthers: false
			};
			ui_autoLaunch.AutoLauncher.register(done => {
				void this.#handleSlot(done);
				return {};
			}, launchOptions);
		}
		async #handleSlot(done) {
			this.#done = done;
			if (this.#surface === AnnounceSurface.Detail) {
				const isEmbedReady = await this.#waitForEmbedReady();
				if (!isEmbedReady) {
					this.#release();
					return;
				}
			}
			if (this.#isLauncherOpen() || this.#isHintShown?.() === true) {
				this.#release();
				return;
			}
			if (!(await this.#claim())) {
				this.#release();
				return;
			}
			this.#showDialog();
		}
		#subscribeToEmbed() {
			if (this.#isSubscribedToEmbed) {
				return;
			}
			this.#isSubscribedToEmbed = true;
			main_core_events.EventEmitter.subscribe(EmbedEvent.Ready, this.#handleEmbedReady);
			main_core_events.EventEmitter.subscribe(EmbedEvent.Error, this.#handleEmbedError);
		}
		#unsubscribeFromEmbed() {
			if (!this.#isSubscribedToEmbed) {
				return;
			}
			this.#isSubscribedToEmbed = false;
			main_core_events.EventEmitter.unsubscribe(EmbedEvent.Ready, this.#handleEmbedReady);
			main_core_events.EventEmitter.unsubscribe(EmbedEvent.Error, this.#handleEmbedError);
		}
		#handleEmbedReady = () => {
			this.#latchEmbedOutcome(EmbedOutcome.Ready);
		};
		#handleEmbedError = () => {
			this.#latchEmbedOutcome(EmbedOutcome.Error);
		};
		#latchEmbedOutcome(outcome) {
			if (this.#embedOutcome !== null) {
				return;
			}
			this.#embedOutcome = outcome;
			this.#finishEmbedWait(outcome === EmbedOutcome.Ready);
		}
		#waitForEmbedReady() {
			if (this.#embedOutcome !== null) {
				return this.#embedOutcome === EmbedOutcome.Ready;
			}
			if (this.#isEmbedReady?.() === true) {
				return true;
			}
			return new Promise(resolve => {
				this.#embedWaiter = resolve;
				this.#embedTimeoutId = setTimeout(() => {
					this.#finishEmbedWait(false);
				}, EMBED_READY_TIMEOUT);
			});
		}
		#finishEmbedWait(isReady) {
			if (this.#embedTimeoutId !== null) {
				clearTimeout(this.#embedTimeoutId);
				this.#embedTimeoutId = null;
			}
			this.#unsubscribeFromEmbed();
			const waiter = this.#embedWaiter;
			this.#embedWaiter = null;
			waiter?.(isReady);
		}
		#getLauncher() {
			return main_core.Reflection.getClass(LAUNCHER_CLASS_NAME);
		}
		#isLauncherOpen() {
			return this.#getLauncher()?.getInstance()?.isOpen() === true;
		}
		async #claim() {
			try {
				const response = await main_core.ajax.runAction(CLAIM_ACTION, {
					data: {}
				});
				return response?.data?.claimed === true;
			} catch {
				return false;
			}
		}
		#release() {
			this.#finishEmbedWait(false);
			const done = this.#done;
			this.#done = null;
			done?.();
		}
		#showDialog() {
			this.#dialog = new ui_system_dialog.Dialog({
				content: this.#renderContent(),
				hasOverlay: true,
				hasVerticalPadding: false,
				hasHorizontalPadding: false,
				hasCloseButton: false
			});
			this.#dialog.subscribe('onShow', this.#handleDialogShow);
			this.#dialog.subscribe('onHide', this.#handleDialogHide);
			this.#dialog.show();
			this.#sendAnalytics(AnalyticsEvent.Shown);
		}
		#handleDialogShow = () => {
			const dialogContainer = this.#contentNode?.closest('[role="dialog"]');
			if (dialogContainer !== null && dialogContainer !== undefined) {
				main_core.Dom.attr(dialogContainer, 'aria-labelledby', TITLE_ID);
			}
			this.#bindParallax();
			this.#mountWater();
		};
		#handleDialogHide = () => {
			if (!this.#isCloseEventSent) {
				this.#isCloseEventSent = true;
				this.#sendAnalytics(this.#closeEvent ?? AnalyticsEvent.Close);
			}
			if (this.#closeEvent === AnalyticsEvent.Try) {
				this.#openLauncher();
			}
			this.#unbindParallax();
			this.#unmountWater();
			this.#dialog = null;
			this.#release();
		};
		#mountWater() {
			const content = this.#contentNode;
			const host = content?.querySelector(`.${BLOCK_CLASS}__backdrop`);
			if (content === null || content === undefined || !(host instanceof HTMLElement)) {
				return;
			}
			const style = getComputedStyle(content);
			this.#water = WaterBackdrop.mount({
				host,
				base: style.backgroundColor,
				imageUrl: BACKGROUND_URL_PATTERN.exec(style.backgroundImage)?.[1]
			});
		}
		#unmountWater() {
			this.#water?.destroy();
			this.#water = null;
		}
		#bindParallax() {
			const content = this.#contentNode;
			const art = content?.querySelector(`.${BLOCK_CLASS}__art`);
			if (content === null || !(art instanceof HTMLElement) || BitrixGptBiAnnounce.#isMotionReduced()) {
				return;
			}
			this.#artNode = art;
			main_core.Event.bind(content, 'mousemove', this.#handlePointerMove);
			main_core.Event.bind(content, 'mouseleave', this.#handlePointerLeave);
		}
		#unbindParallax() {
			if (this.#parallaxFrameId !== null) {
				cancelAnimationFrame(this.#parallaxFrameId);
				this.#parallaxFrameId = null;
			}
			if (this.#contentNode !== null) {
				main_core.Event.unbind(this.#contentNode, 'mousemove', this.#handlePointerMove);
				main_core.Event.unbind(this.#contentNode, 'mouseleave', this.#handlePointerLeave);
			}
			this.#artNode = null;
			this.#pointer = null;
		}
		#handlePointerMove = event => {
			this.#pointer = {
				x: event.clientX,
				y: event.clientY
			};
			if (this.#parallaxFrameId === null) {
				this.#parallaxFrameId = requestAnimationFrame(this.#applyParallax);
			}
		};
		#handlePointerLeave = () => {
			this.#pointer = null;
			this.#writeParallax(0, 0);
		};
		#applyParallax = () => {
			this.#parallaxFrameId = null;
			const art = this.#artNode;
			const pointer = this.#pointer;
			if (art === null || pointer === null) {
				return;
			}
			const box = art.getBoundingClientRect();
			if (box.width <= 0 || box.height <= 0) {
				return;
			}
			const ratioX = (pointer.x - (box.left + box.width / 2)) / (box.width / 2);
			const ratioY = (pointer.y - (box.top + box.height / 2)) / (box.height / 2);
			this.#writeParallax(BitrixGptBiAnnounce.#clampRatio(ratioX) * PARALLAX_SHIFT_X, BitrixGptBiAnnounce.#clampRatio(ratioY) * PARALLAX_SHIFT_Y);
		};
		#writeParallax(x, y) {
			main_core.Dom.style(this.#artNode, {
				'--announce-pointer-x': `${x.toFixed(2)}px`,
				'--announce-pointer-y': `${y.toFixed(2)}px`
			});
		}
		static #clampRatio(value) {
			return Math.min(1, Math.max(-1, value));
		}
		static #isMotionReduced() {
			return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
		}
		#openLauncher() {
			this.#getLauncher()?.getInstance()?.open();
		}
		#createButtons() {
			if (this.#surface === AnnounceSurface.List) {
				return [this.#createButton(getMessage('BICONNECTOR_BITRIXGPT_BI_ANNOUNCE_BUTTON_GOT_IT'), ui_buttons.AirButtonStyle.FILLED_SUCCESS, AnalyticsEvent.Later)];
			}
			return [this.#createButton(getMessage('BICONNECTOR_BITRIXGPT_BI_ANNOUNCE_BUTTON_TRY'), ui_buttons.AirButtonStyle.FILLED_SUCCESS, AnalyticsEvent.Try), this.#createButton(getMessage('BICONNECTOR_BITRIXGPT_BI_ANNOUNCE_BUTTON_LATER'), ui_buttons.AirButtonStyle.PLAIN, AnalyticsEvent.Later)];
		}
		#createButton(text, style, closeEvent) {
			const options = {
				text,
				style,
				size: ui_buttons.ButtonSize.LARGE,
				useAirDesign: true,
				onclick: () => {
					this.#closeEvent = closeEvent;
					this.#dialog?.hide();
					return {};
				}
			};
			return new ui_buttons.Button(options);
		}
		#renderContent() {
			const title = this.#renderTitle();
			main_core.Dom.attr(title, 'id', TITLE_ID);
			const content = main_core.Tag.render`
			<div class="${BLOCK_CLASS}">
				<div class="${BLOCK_CLASS}__backdrop" aria-hidden="true"></div>
				<div class="${BLOCK_CLASS}__media" aria-hidden="true">
					<div class="${BLOCK_CLASS}__art">
						${ART_LAYERS.map(layer => main_core.Tag.render`
							<div class="${BLOCK_CLASS}__art-layer --${layer}"></div>
						`)}
					</div>
				</div>
				${this.#renderCloseButton()}
				<div class="${BLOCK_CLASS}__header">
					<div class="${BLOCK_CLASS}__title-row">
						${title}
						${this.#renderBadge()}
					</div>
					${ui_system_typography.Text.render(getMessage('BICONNECTOR_BITRIXGPT_BI_ANNOUNCE_SUBTITLE'), {
			size: 'lg',
			className: `${BLOCK_CLASS}__subtitle`
		})}
				</div>
				<div class="${BLOCK_CLASS}__features">
					${this.#renderFeature(ui_iconSet_api_core.Outline.AI_STARS_QUESTION, 'BICONNECTOR_BITRIXGPT_BI_ANNOUNCE_FEATURE_ASK_TITLE', 'BICONNECTOR_BITRIXGPT_BI_ANNOUNCE_FEATURE_ASK_TEXT')}
					${this.#renderFeature(ui_iconSet_api_core.Outline.IDEA_LAMP, 'BICONNECTOR_BITRIXGPT_BI_ANNOUNCE_FEATURE_INSIGHT_TITLE', 'BICONNECTOR_BITRIXGPT_BI_ANNOUNCE_FEATURE_INSIGHT_TEXT')}
				</div>
				<div class="${BLOCK_CLASS}__footer">
					${this.#createButtons().map(button => button.render())}
				</div>
			</div>
		`;
			this.#contentNode = content;
			return content;
		}
		#renderTitle() {
			const text = getMessage('BICONNECTOR_BITRIXGPT_BI_ANNOUNCE_TITLE');
			const title = ui_system_typography.Headline.render(text, {
				size: 'lg',
				accent: true,
				tag: 'h3',
				className: `${BLOCK_CLASS}__title`
			});
			const brandAt = text.indexOf(BRAND_WORD);
			if (brandAt < 0) {
				return title;
			}
			const brand = main_core.Tag.render`<span class="${BLOCK_CLASS}__brand">${BRAND_WORD}</span>`;
			main_core.Dom.clean(title);
			title.append(text.slice(0, brandAt), brand, text.slice(brandAt + BRAND_WORD.length));
			return title;
		}
		#renderCloseButton() {
			const icon = new ui_iconSet_api_core.Icon({
				icon: ui_iconSet_api_core.Outline.CROSS_L,
				size: 24,
				color: 'var(--ui-color-base-white-fixed)',
				hoverMode: ui_iconSet_api_core.IconHoverMode.DEFAULT
			}).render();
			const button = main_core.Tag.render`
			<button
				class="${BLOCK_CLASS}__close"
				type="button"
				aria-label="${getMessage('BICONNECTOR_BITRIXGPT_BI_ANNOUNCE_CLOSE')}"
			>${icon}</button>
		`;
			main_core.Event.bind(button, 'click', () => {
				this.#dialog?.hide();
			});
			return button;
		}
		#renderBadge() {
			const badge = new ui_system_label.Label({
				value: getMessage('BICONNECTOR_BITRIXGPT_BI_ANNOUNCE_BADGE'),
				size: ui_system_label.LabelSize.MD,
				style: ui_system_label.LabelStyle.FILLED_SUCCESS,
				border: false
			});
			return main_core.Tag.render`
			<div class="${BLOCK_CLASS}__badge">${badge.render()}</div>
		`;
		}
		#renderFeature(icon, titleKey, textKey) {
			const iconNode = new ui_iconSet_api_core.Icon({
				icon,
				size: 24,
				color: 'var(--ui-color-design-filled-content-icon)'
			}).render();
			return main_core.Tag.render`
			<div class="${BLOCK_CLASS}__feature">
				<div class="${BLOCK_CLASS}__feature-icon">${iconNode}</div>
				<div class="${BLOCK_CLASS}__feature-body">
					${ /* Headline, not Text: only .ui-headline.--accent gives the semi-bold of the mockup, .ui-text.--accent stops at medium. */ui_system_typography.Headline.render(getMessage(titleKey), {
			size: 'sm',
			accent: true,
			tag: 'div',
			className: `${BLOCK_CLASS}__feature-title`
		})}
					${ui_system_typography.Text.render(getMessage(textKey), {
			size: 'sm',
			className: `${BLOCK_CLASS}__feature-text`
		})}
				</div>
			</div>
		`;
		}
		#sendAnalytics(event) {
			const data = {
				c_sub_section: this.#surface
			};
			biconnector_apacheSupersetAnalytics.ApacheSupersetAnalytics.sendAnalytics(ANALYTICS_CATEGORY, event, data);
		}
	}

	exports.AnnounceSurface = AnnounceSurface;
	exports.BitrixGptBiAnnounce = BitrixGptBiAnnounce;

})(this.BX.BIConnector = this.BX.BIConnector || {}, BX, BX.Event, BX.UI.AutoLaunch, BX.UI, window, BX.UI.IconSet, window, BX.UI.System, BX.UI.System.Label, BX.UI.System.Typography, BX.BIConnector);
//# sourceMappingURL=bitrixgpt-bi-announce.bundle.js.map
