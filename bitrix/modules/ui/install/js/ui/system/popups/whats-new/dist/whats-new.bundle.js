/* eslint-disable */
this.BX = this.BX || {};
this.BX.UI = this.BX.UI || {};
this.BX.UI.System = this.BX.UI.System || {};
(function (exports, main_core, main_core_events, main_popup, ui_iconSet_api_core, ui_iconSet_outline, ui_buttons, ui_system_chip, ui_system_typography) {
	'use strict';

	const WhatsNewSize = Object.freeze({
		Lg: 'l',
		Md: 'm'
	});
	const WhatsNewMediaPosition = Object.freeze({
		Top: 'top',
		Left: 'left',
		Right: 'right'
	});
	const WhatsNewActionsAlign = Object.freeze({
		Right: 'right',
		Left: 'left',
		Center: 'center'
	});
	const WhatsNewGalleryNav = Object.freeze({
		Sides: 'sides',
		Bottom: 'bottom',
		OverBleed: 'over-bleed'
	});
	const WhatsNewBackdrop = Object.freeze({
		None: 'none',
		Water: 'water',
		Bubble: 'bubble',
		Balloons: 'balloons',
		Sparkle: 'sparkle'
	});
	const WhatsNewColor = Object.freeze({
		DarkBlue: 'dark-blue',
		Pink: 'pink',
		Violet: 'violet',
		Magenta: 'magenta',
		Sapphire: 'sapphire',
		BitrixGpt: 'bitrix-gpt',
		Gradient: 'gradient'
	});

	const QUARTER_TURN$1 = Math.PI / 2;
	const BackdropGeometry = Object.freeze({
		glow: [{
			x: 0.3,
			y: 0.32,
			radius: 0.5,
			drift: {
				x: {
					pace: 9000,
					phase: 0,
					amplitude: 0.06
				},
				y: {
					pace: 7000,
					phase: QUARTER_TURN$1,
					amplitude: 0.05
				}
			}
		}, {
			x: 0.74,
			y: 0.72,
			radius: 0.52,
			drift: {
				x: {
					pace: 11000,
					phase: QUARTER_TURN$1,
					amplitude: 0.05
				},
				y: {
					pace: 13000,
					phase: 0,
					amplitude: 0.06
				}
			}
		}],
		vignette: {
			x: 0.5,
			y: 0.32,
			radius: 0.95,
			clearUntil: 0.62
		}
	});

	const HALF_TURN = 180;
	const SIDE_ANGLES = Object.freeze({
		top: 0,
		right: 90,
		bottom: 180,
		left: 270
	});
	const ANGLE = /^(-?\d+(?:\.\d+)?)deg$/;
	const HEX = /^#([\da-f]{3}|[\da-f]{6})$/i;
	const SHORT_HEX_LENGTH = 3;
	const BLUR_TOKEN = '--ui-bg-blur-default';
	const BLUR = /blur\(\s*(\d+(?:\.\d+)?)px\s*\)/i;
	const SPOT_STEP = 8;
	const toRadians = degrees => degrees * Math.PI / HALF_TURN;
	const rasters = new Map();
	const getRaster = src => {
		if (!src) {
			return null;
		}
		let raster = rasters.get(src);
		if (!raster) {
			raster = new Image();
			raster.decoding = 'async';
			raster.src = src;
			rasters.set(src, raster);
		}
		return raster;
	};
	const isReady = raster => {
		return raster !== null && raster.complete && raster.naturalWidth > 0 && raster.naturalHeight > 0;
	};
	const toChannels = color => {
		const match = HEX.exec(color.trim());
		if (!match) {
			return null;
		}
		const digits = match[1].length === SHORT_HEX_LENGTH ? [...match[1]].map(digit => digit + digit).join('') : match[1];
		return [0, 2, 4].map(at => parseInt(digits.slice(at, at + 2), 16));
	};
	const toBlurRadius = node => {
		const match = BLUR.exec(getComputedStyle(node).getPropertyValue(BLUR_TOKEN));
		return match ? Number(match[1]) : 0;
	};
	const toClear = color => {
		const channels = toChannels(color);
		return channels ? `rgba(${channels[0]}, ${channels[1]}, ${channels[2]}, 0)` : null;
	};
	const toGradientAngle = (direction, card) => {
		const value = direction.trim().toLowerCase();
		const angle = ANGLE.exec(value);
		if (angle) {
			return toRadians(Number(angle[1]));
		}
		const sides = value.startsWith('to ') ? value.slice(3).split(/\s+/) : [];
		if (sides.length === 1) {
			return toRadians(SIDE_ANGLES[sides[0]] ?? SIDE_ANGLES.bottom);
		}
		if (sides.length === 2) {
			const toRight = sides.includes('left') ? -1 : 1;
			const toBottom = sides.includes('top') ? -1 : 1;
			return Math.atan2(card.height * toRight, -card.width * toBottom);
		}
		return toRadians(SIDE_ANGLES.bottom);
	};
	const toGradientLine = (direction, card) => {
		const angle = toGradientAngle(direction, card);
		const dx = Math.sin(angle);
		const dy = -Math.cos(angle);
		const reach = (Math.abs(card.width * dx) + Math.abs(card.height * dy)) / 2;
		const x = card.x + card.width / 2;
		const y = card.y + card.height / 2;
		return {
			x0: x - dx * reach,
			y0: y - dy * reach,
			x1: x + dx * reach,
			y1: y + dy * reach
		};
	};
	const fillEllipse = (context, spot, stops, area) => {
		const squeeze = spot.radiusY / spot.radiusX;
		context.save();
		context.scale(1, squeeze);
		const gradient = context.createRadialGradient(spot.x, spot.y / squeeze, 0, spot.x, spot.y / squeeze, spot.radiusX);
		stops.forEach(([offset, color]) => gradient.addColorStop(offset, color));
		context.fillStyle = gradient;
		context.fillRect(0, 0, area.width, area.height / squeeze);
		context.restore();
	};
	const drawRaster = (context, card, raster) => {
		if (!isReady(raster)) {
			return false;
		}
		const scale = Math.max(card.width / raster.naturalWidth, card.height / raster.naturalHeight);
		const width = raster.naturalWidth * scale;
		const height = raster.naturalHeight * scale;
		context.drawImage(raster, card.x + (card.width - width) / 2, card.y + (card.height - height) / 2, width, height);
		return true;
	};
	const toKey = ({
		area,
		card,
		spots,
		blur,
		raster
	}) => {
		const places = spots.map(spot => `${Math.round(spot.x / SPOT_STEP)},${Math.round(spot.y / SPOT_STEP)}`).join(';');
		return [`${area.width}x${area.height}`, `${Math.round(card.x)},${Math.round(card.y)},${Math.round(card.width)},${Math.round(card.height)}`, blur, isReady(raster) ? 'raster' : 'fill', places].join('|');
	};
	class BackdropBrush {
		#scheme;
		#buffer = null;
		#context = null;
		#key = null;
		#pixels = null;
		#bakes = 0;
		constructor(scheme) {
			this.#scheme = scheme;
		}
		setScheme(scheme) {
			this.#scheme = scheme;
			this.#key = null;
		}
		paint(target, frame) {
			const buffer = this.#bake(frame);
			if (buffer) {
				target.drawImage(buffer, 0, 0);
			}
		}
		getPixels(frame) {
			const buffer = this.#bake(frame);
			if (!buffer || !this.#context) {
				return null;
			}
			this.#pixels ??= this.#context.getImageData(0, 0, buffer.width, buffer.height);
			return this.#pixels.data;
		}
		getBuffer(frame) {
			return this.#bake(frame);
		}
		getBakeCount() {
			return this.#bakes;
		}
		destroy() {
			if (this.#buffer) {
				this.#buffer.width = 0;
				this.#buffer.height = 0;
			}
			this.#buffer = null;
			this.#context = null;
			this.#key = null;
			this.#pixels = null;
		}
		#bake(frame) {
			const area = {
				width: Math.round(frame.width),
				height: Math.round(frame.height)
			};
			if (area.width <= 0 || area.height <= 0) {
				return null;
			}
			const card = frame.card ?? {
				x: 0,
				y: 0,
				...area
			};
			const plan = {
				area,
				card,
				spots: this.#toSpots(card, frame),
				blur: frame.blur ?? 0,
				raster: getRaster(this.#scheme.image)
			};
			const key = toKey(plan);
			if (this.#key === key && this.#buffer) {
				return this.#buffer;
			}
			const context = this.#requireContext(area);
			if (!context) {
				return null;
			}
			this.#draw(context, plan);
			this.#key = key;
			this.#pixels = null;
			this.#bakes += 1;
			return this.#buffer;
		}
		#draw(context, plan) {
			const {
				area,
				card,
				spots,
				blur,
				raster
			} = plan;
			context.setTransform(1, 0, 0, 1, 0, 0);
			context.filter = 'none';
			context.fillStyle = this.#toBase(context, card);
			context.fillRect(0, 0, area.width, area.height);
			if (drawRaster(context, card, raster)) {
				return;
			}
			const clearGlow = toClear(this.#scheme.glow);
			if (clearGlow !== null) {
				const glow = [[0, this.#scheme.glow], [1, clearGlow]];
				context.filter = blur > 0 ? `blur(${blur}px)` : 'none';
				spots.forEach(spot => fillEllipse(context, spot, glow, area));
				context.filter = 'none';
			}
			const clearBase = toClear(this.#scheme.base);
			if (clearBase === null) {
				return;
			}
			const {
				x,
				y,
				radius,
				clearUntil
			} = BackdropGeometry.vignette;
			fillEllipse(context, {
				x: card.x + x * card.width,
				y: card.y + y * card.height,
				radiusX: radius * card.width,
				radiusY: radius * card.height
			}, [[clearUntil, clearBase], [1, this.#scheme.base]], area);
		}
		#toBase(context, card) {
			const run = this.#scheme.gradient;
			if (!run) {
				return this.#scheme.base;
			}
			const {
				x0,
				y0,
				x1,
				y1
			} = toGradientLine(run.direction, card);
			const gradient = context.createLinearGradient(x0, y0, x1, y1);
			run.stops.forEach(([offset, color]) => gradient.addColorStop(offset, color));
			return gradient;
		}
		#toSpots(card, frame) {
			const time = frame.time;
			return BackdropGeometry.glow.map(spot => {
				const wave = axis => {
					return time === null ? 0 : Math.sin(time / axis.pace + axis.phase) * axis.amplitude;
				};
				return {
					x: card.x + (spot.x + wave(spot.drift.x)) * card.width,
					y: card.y + (spot.y + wave(spot.drift.y)) * card.height,
					radiusX: spot.radius * card.width,
					radiusY: spot.radius * card.height
				};
			});
		}
		#requireContext(area) {
			if (!this.#buffer) {
				this.#buffer = document.createElement('canvas');
				this.#context = this.#buffer.getContext('2d', {
					alpha: false
				});
			}
			if (this.#buffer.width !== area.width || this.#buffer.height !== area.height) {
				this.#buffer.width = area.width;
				this.#buffer.height = area.height;
			}
			return this.#context;
		}
	}

	const MAX_BALLOONS = 120;
	const VERTEX_SOURCE = `#version 300 es
	out vec2 v_uv;
	void main() {
	vec2 p = vec2((gl_VertexID << 1) & 2, gl_VertexID & 2);
	v_uv = p;
	gl_Position = vec4(p * 2.0 - 1.0, 0.0, 1.0);
	}
`;
	const FRAGMENT_SOURCE = `#version 300 es
	precision highp float;

	in vec2 v_uv;
	out vec4 outColor;

	uniform vec2 u_res;
	uniform int u_count;
	/** xy - the centre in pixels, z - the radius across (and along the depth), w - the radius down. */
	uniform vec4 u_ball[${MAX_BALLOONS}];
	/**
	 * x - the shift along the depth (px), y - the tilt of the body (radians), z - the seed of the film,
	 * w - how far the pointer presses the body in.
	 *
	 * The spread along the depth is MICROSCOPIC and is there for one thing only: a steady order of drawing.
	 * It used to be large and drew the bodies apart, so that they could lie over one another on the screen
	 * without running into each other. Overlaps are forbidden by a decision of the product (2026-08-12): the
	 * balloons only TOUCH and crumple a little at the contact, so there is nothing to draw apart - and the
	 * facets (the lens on the crossing of two spheres) never show up, because there is next to no crossing.
	 */
	uniform vec4 u_extra[${MAX_BALLOONS}];
	uniform sampler2D u_bg;
	/** The direction TOWARDS the light. y is negative: the normals are in the axes of the screen, y grows down. */
	uniform vec3 u_light;
	uniform vec3 u_spark;
	uniform vec3 u_shadow;
	/** The darkening towards the bottom: the strength at the top and at the bottom. */
	uniform vec2 u_scrim;
	/** Seconds since the animation started: it slowly carries the streaks of the film away. */
	uniform float u_time;
	/** xy - the pointer in pixels, z - how far it reaches. z = 0 means there is no pointer. */
	uniform vec3 u_press;

	/* -- The material: the very one of the bubble effect ----------------------------------------------
	 A decision of the product (2026-08-13): "take the colour and the look of the balloons from the bubble
	 effect". So this is not a recipe of its own but the model of bubble-backdrop.tsx carried over:

		 - THE COLOUR OF THE FILM is real interference over the wavelengths: the brightness of a channel goes
		 as 1 - cos(2*pi*path/lambda), path = 2*n*d. At a thickness where a whole number of half-waves fits
		 the wavelength the reflection is put out and the colour goes to its complement - hence the green
		 and purple bands of soap. A cosine "rainbow palette" gives none of that: it draws an even spectrum
		 and the balloon looks like an oiled ball;
		 - THE SHARE OF THE FILM IS TINY (single per cent) - that is the physics and not caution: a soap film
		 reflects just that much, so a bubble is TRANSPARENT and the rainbow lives at the rim, where the
		 eye goes along the film;
		 - THE BODY is next to not darkened at all - the background reads through the balloon almost without
		 loss. The volume is held by the rim, the sheen and the play of colour at the edge;
		 - REFRACTION with the channels running apart (the coloured fringe at the rim) and the caustic - the
		 lens squeezing the picture adds light.
	 The numbers are taken from bubble one to one: these two effects must not drift apart. */
	const float FILM_N = 1.33;
	const float FILM_THICKNESS = 260.0;
	const float FILM_EDGE_GAIN = 0.9;
	const float FILM_FLOW_A = 0.12;
	const float FILM_FLOW_B = 0.07;
	const float LAMBDA_R = 650.0;
	const float LAMBDA_G = 550.0;
	const float LAMBDA_B = 460.0;
	/** The share of the film in the middle and at the rim. */
	const float FILM_MIX_CENTER = 0.004;
	const float FILM_MIX_EDGE = 0.085;
	/**
	 * The darkening of the body: the multiplier in the middle and the fall towards the rim.
	 *
	 * The transparency of the wall is not held by these two numbers alone. The texts of the card lie OVER the
	 * backdrop, and what troubles them is not the density of the body (there is next to none of it) but the
	 * sheen, the rim, the caustic and the play of the film: that is a bright ripple under the letters. So
	 * "make it more transparent" means quieting the light down (SPECULAR, rim, window, CAUSTIC,
	 * FILM_MIX_EDGE), and not darkening the body - darkening is exactly what kills the colour of the scheme.
	 */
	const float DIM_CENTER = 1.0;
	const float DIM_EDGE_DROP = 0.03;
	/** The strength of the refraction in shares of the radius, and how far the channels run apart at the rim. */
	const float REFRACT = 0.3;
	const float CHROMA = 0.16;
	/** The strength of the caustic. */
	const float CAUSTIC = 0.6;
	/**
	 * How many times the semi-axis of the DEPTH is bigger than the radius across.
	 *
	 * One is a ball (the depth equals the radius). Above one the body bulges TOWARDS the viewer: the surface
	 * rises higher, the normals grow steeper, and the shadows between the balloons and the sheen gain
	 * strength. A decision of the product (2026-08-13): "let them bulge forward more".
	 */
	const float DEPTH_GAIN = 1.4;
	/** The brightness of the sheen. */
	const float SPECULAR = 0.4;

	float hash21(vec2 p) {
	p = fract(p * vec2(123.34, 456.21));
	p += dot(p, p + 34.56);
	return fract(p.x * p.y);
	}
	float vnoise(vec2 p) {
	vec2 i = floor(p), f = fract(p);
	f = f * f * (3.0 - 2.0 * f);
	float a = hash21(i), b = hash21(i + vec2(1.0, 0.0));
	float c = hash21(i + vec2(0.0, 1.0)), d = hash21(i + vec2(1.0, 1.0));
	return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
	}
	/** The colour of the film by the optical path (nm). */
	vec3 filmColor(float path) {
	return vec3(
		0.5 - 0.5 * cos(6.28318 * path / LAMBDA_R),
		0.5 - 0.5 * cos(6.28318 * path / LAMBDA_G),
		0.5 - 0.5 * cos(6.28318 * path / LAMBDA_B)
	);
	}

	/**
	 * The width of the rounding at the place of the contact, in shares of the radius.
	 *
	 * The bodies are joined by a SMOOTH maximum: where two balloons meet, the surface does not cross itself
	 * with a sharp lens but flows over in a fillet - that is how a squeezed bubble looks in a foam.
	 *
	 * The balloons do cross a little: the overlap gives density without gaps, and it is not taken away.
	 *
	 * This is counted anew every time the radii change. The radii were raised twice for the sake of full
	 * cover (see RADIUS_OF_CELL_* in the effect), and at a bigger overlap the same smoothing melts the wall
	 * into one even mass - so it was narrowed twice. On the gaps it has no bearing at all: those come from
	 * the geometry of the layout and not from the smoothing. The balloons have to be STUCK TOGETHER (a
	 * decision of the product, 2026-08-13): at the contact the surfaces run into one neck, the way soap
	 * bubbles do in a foam. But 0.6 and above at such an overlap melts the wall into ONE lumpy mass - the
	 * separate bubbles stop reading; 0.28 and below, the other way round, draws them apart into "balls side
	 * by side".
	 */
	const float FILLET = 0.4;
	/* -- The pressing in under the pointer -------------------------------------------------------------
	 The surface goes in locally, and the normal TILTS with it - without the tilt the dent shows only by
	 the silhouette and is next to unreadable. The depth is led by a spring in the simulation, body by
	 body, and arrives here ready in u_extra.w.

	 There is NO wave over the dent. There used to be one (a shiver of jelly, a sine over the radius and
	 the time) and it read as a pulsing wave from the pointer, which is not what should happen: a small
	 pressing in is all that is wanted (a decision of the product, 2026-08-13). The depth is small for the
	 very same reason. */
	/**
	 * The depth of the dent from the pointer, in shares of the radius.
	 *
	 * Small on purpose: by the balance of the product (2026-08-13) the pointer presses the balloons in
	 * WEAKER, and they crumple mostly against one another - that is what CONTACT_SQUASH in the simulation is
	 * for.
	 */
	const float DENT_DEPTH = 0.34;

	/**
	 * How far the shell sags under the pointer at the point p, for a body of radius r and a press of dent.
	 * Answers in pixels.
	 */
	float dentAt(vec2 p, float r, float dent) {
	if (u_press.z <= 0.0 || dent <= 0.001) return 0.0;
	float d = length(p - u_press.xy) / u_press.z;
	if (d >= 1.0) return 0.0;
	float f = 1.0 - d * d;
	return r * DENT_DEPTH * dent * f * f;
	}

	/**
	 * The meeting of an orthographic ray (going along -z) with an ellipsoid.
	 * Answers the height of the surface over the plane of the card (px), or -1 if the ray goes past.
	 * The ray is upright, so the equation comes down to what is left of the height of a unit sphere.
	 */
	float hitZ(vec2 p, vec4 b, float tilt, out vec3 nrm) {
	float c = cos(-tilt), s = sin(-tilt);
	vec2 d = p - b.xy;
	vec2 l = vec2(d.x * c - d.y * s, d.x * s + d.y * c);
	vec2 k = l / vec2(b.z, b.w);
	float q = dot(k, k);
	if (q > 1.0) return -1.0;
	float zn = sqrt(1.0 - q);
	// The semi-axis of the depth is bigger than the radius across (DEPTH_GAIN) - the body bulges towards
	// the viewer. The same semi-axis stands under the z part of the normal, or the light would be counted
	// as if for a ball.
	float rz = b.z * DEPTH_GAIN;
	vec3 n = normalize(vec3(k.x / b.z, k.y / b.w, zn / rz));
	nrm = vec3(n.x * c + n.y * s, -n.x * s + n.y * c, n.z);
	return zn * rz;
	}

	/**
	 * Whether another body stands in the way from the point to the light - a real shadow ray.
	 * Answers 0 (in the shadow) ... 1 (lit). The softness comes from how close the ray runs to the body and
	 * not from a yes-or-no test: a hard shadow on matt latex looks cut out with scissors.
	 */
	float lightReach(vec3 pos, vec3 L) {
	float vis = 1.0;
	for (int i = 0; i < ${MAX_BALLOONS}; i++) {
		if (i >= u_count) break;
		vec4 b = u_ball[i];
		vec3 c = vec3(b.xy, u_extra[i].x);
		vec3 sc = vec3(b.z, b.w, b.z);
		// In the space where the body is a unit sphere: the offset and the direction are divided by the radii.
		vec3 o = (pos - c) / sc;
		vec3 dir = normalize(L / sc);
		float tca = dot(-o, dir);
		if (tca < 0.02) continue;               // the body is behind the point - it casts nothing
		float d2 = dot(o, o) - tca * tca;       // the square of the distance from the centre to the ray
		if (d2 > 1.0) continue;                 // the ray goes past
		// The deeper the ray goes into the body, the denser the shadow.
		vis *= smoothstep(0.0, 1.0, d2);
	}
	return clamp(vis, 0.0, 1.0);
	}

	void main() {
	vec2 p = vec2(v_uv.x, 1.0 - v_uv.y) * u_res;
	vec3 bg = texture(u_bg, vec2(v_uv.x, 1.0 - v_uv.y)).rgb;

	float bestZ = -1.0;
	float secondZ = -1.0;
	float bestR = 1.0;
	vec3 bestN = vec3(0.0);

	float bestSeed = 0.0;
	for (int i = 0; i < ${MAX_BALLOONS}; i++) {
		if (i >= u_count) break;
		vec4 b = u_ball[i];
		vec3 n;
		float z = hitZ(p, b, u_extra[i].y, n);
		if (z <= 0.0) continue;
		z += u_extra[i].x;
		// The dent: the surface sags and the normal tilts towards the pit, or the jelly reads by the
		// silhouette alone. The tilt is taken as the difference of the sag along the two axes.
		float dnt = u_extra[i].w;
		if (dnt > 0.001 && u_press.z > 0.0) {
		float dz = dentAt(p, b.z, dnt);
		if (dz > 0.0) {
			float e = max(b.z * 0.12, 1.0);
			vec2 g = vec2(
			dentAt(p + vec2(e, 0.0), b.z, dnt) - dentAt(p - vec2(e, 0.0), b.z, dnt),
			dentAt(p + vec2(0.0, e), b.z, dnt) - dentAt(p - vec2(0.0, e), b.z, dnt)
			) / (2.0 * e);
			z -= dz;
			n = normalize(vec3(n.xy + g * 1.6, n.z));
		}
		}
		if (bestZ < 0.0) {
		bestZ = z;
		bestR = b.z;
		bestN = n;
		bestSeed = u_extra[i].z;
		continue;
		}
		// The smooth maximum: at the contact the surfaces run together in a fillet, and the normals and the
		// tone are mixed by the very same weight. A hard maximum gave an edge, and that edge read as "it
		// went right through".
		float k = max(bestR, b.z) * FILLET;
		float hh = clamp(0.5 + 0.5 * (z - bestZ) / k, 0.0, 1.0);
		secondZ = max(secondZ, min(z, bestZ));
		bestZ = mix(bestZ, z, hh) + k * hh * (1.0 - hh);
		bestN = normalize(mix(bestN, n, hh));
		bestR = mix(bestR, b.z, hh);
		bestSeed = mix(bestSeed, u_extra[i].z, hh);
	}

	vec3 col;
	if (bestZ < 0.0) {
		col = bg;
	} else {
		vec3 N = bestN;
		vec3 L = normalize(u_light);
		vec3 V = vec3(0.0, 0.0, 1.0);
		vec3 pos = vec3(p, bestZ);

		// A real cast shadow from the neighbouring balloons. The point is lifted along the normal, or the
		// body catches its own surface and everything goes into the shadow (the classic self-shadow acne).
		float lit = lightReach(pos + N * bestR * 0.06, L);

		// The sheen is matt: the exponent is low and the spot is wide. With a high (glassy) one the balloons
		// read as plastic - on a matt surface the sheen has to be blurred.
		vec3 H = normalize(L + V);
		float sheen = pow(clamp(dot(N, H), 0.0, 1.0), 6.0) * 0.4;
		// A narrow "window" - a sharp bright stroke, like the source reflected in the film on the reference.
		float window = pow(clamp(dot(N, H), 0.0, 1.0), 48.0) * 0.34;

		// The rim: the light re-reflected from the neighbours in a dense wall. Thanks to it the dark side
		// does not go black.
		float rim = pow(1.0 - clamp(dot(N, V), 0.0, 1.0), 3.0) * 0.3;

		// The shell shining through: the thin edge glows, because the light passes through the film.
		float sss = pow(clamp(dot(-N, L) * 0.5 + 0.5, 0.0, 1.0), 2.0) * 0.08
					* pow(1.0 - clamp(dot(N, V), 0.0, 1.0), 1.6);

		// The occlusion of the seams: by the gap down to the SECOND surface under the pixel. The former way
		// added darkening for any overlap of the silhouettes and put the wall out evenly, eating the relief.
		// The denominator is narrow on purpose. At bestR * 0.9 the gap counted as "small" over a wide band
		// around every joint, and at the points where THREE balloons meet the darkening ran together into a
		// dark TRIANGULAR patch - it was taken for a hole in the wall (the study of 2026-08-13: the zones
		// with occ > 0.8 were lit up right in the program, and the net of joints with triangles at the
		// triple points matched what the product had seen). The wall is whole all the while: not one pixel
		// is left uncovered, checked by the same probe. A narrow denominator leaves a thin seam and not
		// patches.
		float gap = secondZ > 0.0 ? clamp((bestZ - secondZ) / (bestR * 0.9), 0.0, 1.0) : 1.0;
		float occ = 1.0 - gap;

		// The shadow quiets the sheen down but does not kill it: the fill light stays. On a transparent
		// material the shadow is weak anyway - the light passes through the film.
		float shade = mix(0.68, 1.0, lit);
		float grazing = 1.0 - clamp(dot(N, V), 0.0, 1.0);

		// A BALLOON HAS NO COLOUR OF ITS OWN (a decision of the product, 2026-08-13): it is transparent and
		// takes its colour from the backdrop seen through it. What follows is the material model of the
		// bubble effect.

		// REFRACTION with the channels running apart: at the rim the shift is bigger and the channels part -
		// a coloured fringe.
		vec2 dir = N.xy;
		float shift = bestR * REFRACT * grazing;

		vec2 uvR = clamp((p + dir * shift * (1.0 + CHROMA)) / u_res, vec2(0.0), vec2(1.0));
		vec2 uvG = clamp((p + dir * shift) / u_res, vec2(0.0), vec2(1.0));
		vec2 uvB = clamp((p + dir * shift * (1.0 - CHROMA)) / u_res, vec2(0.0), vec2(1.0));
		vec3 through = vec3(
		texture(u_bg, vec2(uvR.x, 1.0 - uvR.y)).r,
		texture(u_bg, vec2(uvG.x, 1.0 - uvG.y)).g,
		texture(u_bg, vec2(uvB.x, 1.0 - uvB.y)).b
		);

		// THE CAUSTIC: the lens squeezes the picture - where the shift changes fast, the light runs together.
		float e = max(bestR * 0.08, 1.0);
		vec2 uvC = clamp((p + dir * shift + vec2(e, 0.0)) / u_res, vec2(0.0), vec2(1.0));
		vec3 near = texture(u_bg, vec2(uvC.x, 1.0 - uvC.y)).rgb;
		float caustic = clamp(length(near - through) * CAUSTIC, 0.0, 0.35) * pow(grazing, 1.5);

		// THE BODY is next to not darkened: the background reads through the balloon. The volume is held by
		// the rim, the sheen and the play of colour.
		float dim = DIM_CENTER - DIM_EDGE_DROP * grazing;
		col = through * dim;
		col = mix(col, u_shadow, occ * 0.09);

		// THE FILM: the thickness grows towards the rim (the path of the eye goes as 1/cos(theta)) and slowly
		// flows. The coordinate is taken from the NORMAL, or the pattern sticks to the card and does not
		// travel with the balloon.
		vec2 fuv = N.xy * 2.1 + vec2(bestSeed, bestSeed * 1.7);
		float flow = FILM_FLOW_A * vnoise(fuv * 2.2 + vec2(u_time * 0.05, -u_time * 0.04))
				 + FILM_FLOW_B * vnoise(fuv * 4.7 - vec2(u_time * 0.03, u_time * 0.02));
		float thickness = FILM_THICKNESS * (1.0 + FILM_EDGE_GAIN * grazing) * (1.0 + flow);
		vec3 film = filmColor(2.0 * FILM_N * thickness);
		float filmMix = mix(FILM_MIX_CENTER, FILM_MIX_EDGE, pow(grazing, 1.6));
		col = mix(col, film, filmMix);

		// The light: the sheen, the rim, the caustic, the faint shine-through. All of it added in the tone of
		// the scheme.
		col += u_spark * (sheen * shade * SPECULAR + window * SPECULAR + rim * 0.7 + sss + caustic);
	}

	// The darkening towards the bottom: the texts of the card are white and the wall is light (see SCRIM_*
	// in the effect).
	float t = clamp(v_uv.y, 0.0, 1.0);
	col = mix(col, u_shadow, mix(u_scrim.y, u_scrim.x, t));

	outColor = vec4(col, 1.0);
	}
`;

	const FRAME$2 = 16;
	const MIN_DELTA$1 = 1;
	const SECOND = 1000;
	const TRIANGLE_VERTICES = 3;
	const BODY_VALUES = 4;
	const CELL$2 = 0.24;
	const ROW_SQUEEZE = 0.84;
	const ROW_SHIFT = 0.5;
	const RADIUS_OF_CELL_MIN = 0.5;
	const RADIUS_OF_CELL_MAX = 0.8;
	const SQUASH_Y = 1.06;
	const BLEED_CELLS = 1;
	const JITTER = 0.5;
	const TILT = 0.24;
	const DEPTH_SPREAD = 0.08;
	const DEPTH_LAYERS = 4;
	const LAYER_ACROSS = 3;
	const LAYER_DOWN = 5;
	const RADIUS_STRIDE = 37;
	const ACROSS_STRIDE = 61;
	const DOWN_STRIDE = 43;
	const SEED_STRIDE = 71;
	const STRIDE_STEPS = 100;
	const SEED_RANGE = 10;
	const HOME_SPRING = 0.008;
	const FRICTION = 0.9;
	const PUSH_REACH = 0.26;
	const PUSH_FORCE = 0.32;
	const TOUCH_FLOOR = 0.001;
	const PRESS_REACH = 0.22;
	const DENT_SPRING = 0.22;
	const DENT_DAMPING = 0.66;
	const JELLY_SPREAD = 0.05;
	const JELLY_FLATTEN = 0.04;
	const CONTACT_PASSES = 3;
	const CONTACT_SQUEEZE = 0.2;
	const CONTACT_RELAX = 0.45;
	const CONTACT_RESTITUTION = 0.22;
	const CONTACT_SQUASH = 0.42;
	const SQUASH_GAIN = 1.3;
	const SQUASH_EASE = 0.18;
	const SQUASH_STRETCH = 0.55;
	const SQUASH_FLOOR = 0.004;
	const PRESS_FLOOR = 0.0001;
	const LIGHT = [-0.42, -0.62, 0.66];
	const SCRIM = [0, 0.3];
	const SPARK_LIGHT = 0.97;
	const SPARK_SATURATION = 0.8;
	const SHADOW_SHIFT = -0.55;
	const CHANNEL_MAX$2 = 255;
	const HUE_SECTOR = 60;
	const FULL_HUE = 360;
	const HUE_SECTORS = 6;
	const HUE_SECTOR_MIX = Object.freeze([[2, 1, 0], [1, 2, 0], [0, 2, 1], [0, 1, 2], [1, 0, 2], [2, 0, 1]]);
	const share = (at, stride) => at * stride % STRIDE_STEPS / STRIDE_STEPS;
	const spread = offset => (offset - 0.5) * 2;
	const inCell = (span, offset) => span * (0.5 + spread(offset) * JITTER / 2);
	const toShares = channels => {
		return channels.map(channel => channel / CHANNEL_MAX$2);
	};
	const toTone = (channels, shift) => {
		const target = 0;
		const way = Math.abs(shift);
		return channels.map(channel => (channel + (target - channel) * way) / CHANNEL_MAX$2);
	};
	const toHue = (red, green, blue, chroma) => {
		if (chroma === 0) {
			return 0;
		}
		let hue = 0;
		if (red >= green && red >= blue) {
			hue = (green - blue) / chroma % HUE_SECTORS;
		} else if (green >= blue) {
			hue = (blue - red) / chroma + 2;
		} else {
			hue = (red - green) / chroma + 4;
		}
		hue *= HUE_SECTOR;
		return hue < 0 ? hue + FULL_HUE : hue;
	};
	const toPastel = (channels, light, saturationGain) => {
		const [red, green, blue] = toShares(channels);
		const top = Math.max(red, green, blue);
		const bottom = Math.min(red, green, blue);
		const middle = (top + bottom) / 2;
		const spanned = top - bottom;
		const hue = toHue(red, green, blue, spanned);
		const wasSaturation = spanned === 0 ? 0 : spanned / (1 - Math.abs(2 * middle - 1));
		const saturation = Math.min(1, wasSaturation * saturationGain);
		const lightness = Math.min(1, Math.max(0, light));
		const chroma = (1 - Math.abs(2 * lightness - 1)) * saturation;
		const second = chroma * (1 - Math.abs(hue / HUE_SECTOR % 2 - 1));
		const parts = [0, second, chroma];
		const lift = lightness - chroma / 2;
		const sector = Math.floor(hue / HUE_SECTOR) % HUE_SECTORS;
		return HUE_SECTOR_MIX[sector].map(part => parts[part] + lift);
	};
	const compile = (gl, kind, source) => {
		const shader = gl.createShader(kind);
		if (!shader) {
			return null;
		}
		gl.shaderSource(shader, source);
		gl.compileShader(shader);
		if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
			gl.deleteShader(shader);
			return null;
		}
		return shader;
	};
	const link = (gl, vertexShader, fragmentShader) => {
		const program = gl.createProgram();
		if (!program) {
			return null;
		}
		gl.attachShader(program, vertexShader);
		gl.attachShader(program, fragmentShader);
		gl.linkProgram(program);
		if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
			gl.deleteProgram(program);
			return null;
		}
		return program;
	};
	class BalloonsEffect {
		contextKind = 'webgl2';
		#brush;
		#balloons = [];
		#width = 0;
		#height = 0;
		#bodies = new Float32Array(MAX_BALLOONS * BODY_VALUES);
		#extras = new Float32Array(MAX_BALLOONS * BODY_VALUES);
		#gl = null;
		#resources = null;
		#spark = [];
		#shadow = [];
		#hasTones = false;
		#uploaded = 0;
		#uploads = 0;
		#blur = null;
		constructor(scheme) {
			this.#brush = new BackdropBrush(scheme);
			this.#applyScheme(scheme);
		}
		prepare(context) {
			if (!this.#hasTones) {
				return false;
			}
			const resources = this.#build(context);
			if (!resources) {
				return false;
			}
			this.#gl = context;
			this.#resources = resources;
			this.#applyTone();
			return true;
		}
		draw(frame) {
			const resources = this.#resources;
			if (!resources) {
				return;
			}
			const {
				context,
				width,
				height,
				delta
			} = frame;
			this.#layout(width, height);
			const pointer = frame.pointer.inside ? {
				x: frame.pointer.x * width,
				y: frame.pointer.y * height
			} : null;
			this.#simulate(Math.max(delta, MIN_DELTA$1) / FRAME$2, pointer);
			this.#upload(context, resources, frame);
			this.#render(context, resources, frame, pointer);
		}
		setScheme(scheme) {
			this.#brush.setScheme(scheme);
			this.#applyScheme(scheme);
		}
		getBalloonCount() {
			return this.#balloons.length;
		}
		getUploadCount() {
			return this.#uploads;
		}
		release() {
			const gl = this.#gl;
			const resources = this.#resources;
			this.#gl = null;
			this.#resources = null;
			this.#uploaded = 0;
			if (!gl || !resources) {
				return;
			}
			gl.deleteProgram(resources.program);
			gl.deleteShader(resources.vertexShader);
			gl.deleteShader(resources.fragmentShader);
			gl.deleteTexture(resources.texture);
		}
		destroy() {
			this.release();
			this.#brush.destroy();
			this.#balloons = [];
		}
		#build(gl) {
			const vertexShader = compile(gl, gl.VERTEX_SHADER, VERTEX_SOURCE);
			const fragmentShader = compile(gl, gl.FRAGMENT_SHADER, FRAGMENT_SOURCE);
			const program = vertexShader && fragmentShader ? link(gl, vertexShader, fragmentShader) : null;
			const texture = program ? gl.createTexture() : null;
			if (!vertexShader || !fragmentShader || !program || !texture) {
				gl.deleteShader(vertexShader);
				gl.deleteShader(fragmentShader);
				gl.deleteProgram(program);
				return null;
			}
			gl.useProgram(program);
			const locate = name => {
				return gl.getUniformLocation(program, name);
			};
			const uniforms = {
				u_res: locate('u_res'),
				u_count: locate('u_count'),
				u_ball: locate('u_ball'),
				u_extra: locate('u_extra'),
				u_bg: locate('u_bg'),
				u_light: locate('u_light'),
				u_spark: locate('u_spark'),
				u_shadow: locate('u_shadow'),
				u_scrim: locate('u_scrim'),
				u_time: locate('u_time'),
				u_press: locate('u_press')
			};
			gl.bindTexture(gl.TEXTURE_2D, texture);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
			gl.uniform1i(uniforms.u_bg, 0);
			gl.uniform3fv(uniforms.u_light, LIGHT);
			gl.uniform2fv(uniforms.u_scrim, SCRIM);
			return {
				vertexShader,
				fragmentShader,
				program,
				texture,
				uniforms
			};
		}
		#applyScheme(scheme) {
			const glow = toChannels(scheme.glow);
			const base = toChannels(scheme.base);
			if (!glow || !base) {
				return;
			}
			this.#spark = toPastel(glow, SPARK_LIGHT, SPARK_SATURATION);
			this.#shadow = toTone(base, SHADOW_SHIFT);
			this.#hasTones = true;
			this.#applyTone();
		}
		#applyTone() {
			const gl = this.#gl;
			const resources = this.#resources;
			if (!gl || !resources) {
				return;
			}
			gl.useProgram(resources.program);
			gl.uniform3fv(resources.uniforms.u_spark, this.#spark);
			gl.uniform3fv(resources.uniforms.u_shadow, this.#shadow);
		}
		#layout(width, height) {
			if (width === this.#width && height === this.#height) {
				return;
			}
			this.#width = width;
			this.#height = height;
			const side = Math.min(width, height);
			const cell = side * CELL$2;
			const rowStep = cell * ROW_SQUEEZE;
			const grid = {
				cell,
				rowStep,
				columns: Math.ceil(width / cell) + BLEED_CELLS * 2
			};
			const rows = Math.ceil(height / rowStep) + BLEED_CELLS * 2;
			const wall = [];
			for (let row = 0; row < rows && wall.length < MAX_BALLOONS; row++) {
				for (let column = 0; column < grid.columns && wall.length < MAX_BALLOONS; column++) {
					wall.push(this.#toBalloon(row, column, grid, this.#balloons[wall.length]));
				}
			}
			this.#balloons = wall;
		}
		#toBalloon(row, column, grid, kept) {
			const at = row * grid.columns + column;
			const span = RADIUS_OF_CELL_MAX - RADIUS_OF_CELL_MIN;
			const radius = grid.cell * (RADIUS_OF_CELL_MIN + share(at, RADIUS_STRIDE) * span);
			const offset = row % 2 === 0 ? 0 : grid.cell * ROW_SHIFT;
			const homeX = (column - BLEED_CELLS) * grid.cell + offset + inCell(grid.cell, share(at, ACROSS_STRIDE));
			const homeY = (row - BLEED_CELLS) * grid.rowStep + inCell(grid.rowStep, share(at, DOWN_STRIDE));
			const layer = (column * LAYER_ACROSS + row * LAYER_DOWN) % DEPTH_LAYERS;
			return {
				x: kept ? kept.x : homeX,
				y: kept ? kept.y : homeY,
				homeX,
				homeY,
				speedX: kept ? kept.speedX : 0,
				speedY: kept ? kept.speedY : 0,
				radius,
				tilt: spread(share(at, DOWN_STRIDE)) * TILT,
				depth: (layer / (DEPTH_LAYERS - 1) - 0.5) * DEPTH_SPREAD * radius,
				seed: share(at, SEED_STRIDE) * SEED_RANGE,
				dent: kept ? kept.dent : 0,
				dentSpeed: kept ? kept.dentSpeed : 0,
				pressX: 0,
				pressY: 0,
				squash: kept ? kept.squash : 0
			};
		}
		#simulate(step, pointer) {
			const side = Math.min(this.#width, this.#height);
			this.#lead(step, pointer, side * PUSH_REACH, side * PRESS_REACH);
			for (let pass = 0; pass < CONTACT_PASSES; pass++) {
				this.#contact();
			}
			this.#settle(step);
		}
		#lead(step, pointer, reach, pressReach) {
			const damping = DENT_DAMPING ** step;
			this.#balloons.forEach(item => {
				const balloon = item;
				balloon.pressX = 0;
				balloon.pressY = 0;
				balloon.speedX += (balloon.homeX - balloon.x) * HOME_SPRING * step;
				balloon.speedY += (balloon.homeY - balloon.y) * HOME_SPRING * step;
				const dx = pointer ? balloon.x - pointer.x : 0;
				const dy = pointer ? balloon.y - pointer.y : 0;
				const distance = pointer ? Math.hypot(dx, dy) : 0;
				const wanted = pointer && distance < pressReach ? 1 - distance / pressReach : 0;
				balloon.dentSpeed += (wanted - balloon.dent) * DENT_SPRING * step;
				balloon.dentSpeed *= damping;
				balloon.dent = Math.max(balloon.dent + balloon.dentSpeed * step, 0);
				if (pointer && distance < reach && distance > TOUCH_FLOOR) {
					const force = (1 - distance / reach) * PUSH_FORCE * step;
					balloon.speedX += dx / distance * force;
					balloon.speedY += dy / distance * force;
				}
			});
		}
		#contact() {
			const wall = this.#balloons;
			for (let one = 0; one < wall.length; one++) {
				for (let other = one + 1; other < wall.length; other++) {
					this.#touch(wall[one], wall[other]);
				}
			}
		}
		#touch(first, second) {
			const one = first;
			const other = second;
			const dx = other.x - one.x;
			const dy = other.y - one.y;
			const squared = dx * dx + dy * dy;
			if (squared === 0) {
				return;
			}
			const closest = (one.radius + other.radius) * (1 - CONTACT_SQUEEZE);
			if (squared >= closest * closest) {
				return;
			}
			const distance = Math.sqrt(squared);
			const alongX = dx / distance;
			const alongY = dy / distance;
			const overlap = closest - distance;
			one.pressX -= alongX * overlap;
			one.pressY -= alongY * overlap;
			other.pressX += alongX * overlap;
			other.pressY += alongY * overlap;
			const apart = overlap / 2 * CONTACT_RELAX;
			one.x -= alongX * apart;
			one.y -= alongY * apart;
			other.x += alongX * apart;
			other.y += alongY * apart;
			const closing = (other.speedX - one.speedX) * alongX + (other.speedY - one.speedY) * alongY;
			if (closing > 0) {
				return;
			}
			const bounce = -closing * CONTACT_RESTITUTION;
			one.speedX -= alongX * bounce;
			one.speedY -= alongY * bounce;
			other.speedX += alongX * bounce;
			other.speedY += alongY * bounce;
		}
		#settle(step) {
			const friction = FRICTION ** step;
			const ease = 1 - (1 - SQUASH_EASE) ** step;
			this.#balloons.forEach(item => {
				const balloon = item;
				balloon.x += balloon.speedX * step;
				balloon.y += balloon.speedY * step;
				balloon.speedX *= friction;
				balloon.speedY *= friction;
				const pressed = Math.hypot(balloon.pressX, balloon.pressY) / balloon.radius;
				const wanted = Math.min(CONTACT_SQUASH, pressed * SQUASH_GAIN);
				balloon.squash += (wanted - balloon.squash) * ease;
			});
		}
		#upload(gl, resources, frame) {
			const buffer = this.#brush.getBuffer({
				width: this.#width,
				height: this.#height,
				time: frame.time,
				blur: this.#requireBlur(gl.canvas)
			});
			const bakes = this.#brush.getBakeCount();
			if (!buffer || bakes === this.#uploaded) {
				return;
			}
			gl.bindTexture(gl.TEXTURE_2D, resources.texture);
			gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, buffer);
			this.#uploaded = bakes;
			this.#uploads += 1;
		}
		#render(gl, resources, frame, pointer) {
			const ratio = this.#width > 0 ? gl.drawingBufferWidth / this.#width : 1;
			const count = this.#fill(ratio);
			const reach = Math.min(this.#width, this.#height) * PRESS_REACH * ratio;
			const {
				uniforms,
				program,
				texture
			} = resources;
			gl.useProgram(program);
			gl.bindTexture(gl.TEXTURE_2D, texture);
			gl.uniform2f(uniforms.u_res, gl.drawingBufferWidth, gl.drawingBufferHeight);
			gl.uniform1i(uniforms.u_count, count);
			gl.uniform1f(uniforms.u_time, frame.time / SECOND);
			gl.uniform3f(uniforms.u_press, pointer ? pointer.x * ratio : 0, pointer ? pointer.y * ratio : 0, pointer ? reach : 0);
			gl.uniform4fv(uniforms.u_ball, this.#bodies);
			gl.uniform4fv(uniforms.u_extra, this.#extras);
			gl.drawArrays(gl.TRIANGLES, 0, TRIANGLE_VERTICES);
		}
		#fill(ratio) {
			this.#balloons.forEach((balloon, at) => {
				let radiusX = balloon.radius * (1 + JELLY_SPREAD * balloon.dent);
				let radiusY = balloon.radius * SQUASH_Y * (1 - JELLY_FLATTEN * balloon.dent);
				let tilt = balloon.tilt;
				if (balloon.squash > SQUASH_FLOOR) {
					const pressed = Math.hypot(balloon.pressX, balloon.pressY);
					if (pressed > PRESS_FLOOR) {
						tilt = Math.atan2(balloon.pressY, balloon.pressX);
					}
					radiusX *= 1 - balloon.squash;
					radiusY *= 1 + balloon.squash * SQUASH_STRETCH;
				}
				const to = at * BODY_VALUES;
				this.#bodies[to] = balloon.x * ratio;
				this.#bodies[to + 1] = balloon.y * ratio;
				this.#bodies[to + 2] = radiusX * ratio;
				this.#bodies[to + 3] = radiusY * ratio;
				this.#extras[to] = balloon.depth * ratio;
				this.#extras[to + 1] = tilt;
				this.#extras[to + 2] = balloon.seed;
				this.#extras[to + 3] = balloon.dent;
			});
			return this.#balloons.length;
		}
		#requireBlur(canvas) {
			this.#blur ??= canvas instanceof HTMLCanvasElement ? toBlurRadius(canvas) : 0;
			return this.#blur;
		}
	}

	const FULL_TURN$1 = Math.PI * 2;
	const CHANNEL_MAX$1 = 255;
	const PICTURE_CHANNELS = 4;
	const FILM_CHANNELS = 3;
	const CELL$1 = 2;
	const MIN_CELLS$1 = 2;
	const FRAME$1 = 16;
	const MIN_DELTA = 1;
	const RADIUS_SHARE = 0.42;
	const FOLLOW = 0.032;
	const HIT_SLACK = 1.12;
	const BURST = 300;
	const PAUSE = 1400;
	const BIRTH = 560;
	const BURST_EXPAND = 0.5;
	const BURST_FADE = 1.6;
	const BURST_FLASH = 1.6;
	const BIRTH_FROM = 0.15;
	const DROPS = 16;
	const DROP_SPREAD = 0.5;
	const DROP_SPEED_MIN = 1.1;
	const DROP_SPEED_MAX = 3.4;
	const DROP_DRAG = 0.945;
	const DROP_GRAVITY = 0.055;
	const DROP_FADE = 0.014;
	const DROP_RADIUS_MIN = 0.0038;
	const DROP_RADIUS_MAX = 0.0095;
	const DROP_LINE = 0.0021;
	const DROP_SHRINK = 0.55;
	const SQUASH_PER_SPEED = 0.019;
	const MAX_SQUASH = 0.17;
	const SQUASH_SPRING = 0.1;
	const SQUASH_DAMPING = 0.86;
	const SQUASH_HARMONIC = 2;
	const TAIL_SHARE = 0.34;
	const SPEED_EASE = 0.25;
	const MIN_AXIS_SPEED = 0.05;
	const IDLE_SPREAD_X = 0.16;
	const IDLE_SPREAD_Y = 0.14;
	const IDLE_PACE_X = 6200;
	const IDLE_PACE_Y = 8100;
	const FILM_INDEX = 1.33;
	const FILM_THICKNESS = 260;
	const FILM_EDGE_GAIN = 0.9;
	const FILM_FLOW_A = 0.12;
	const FILM_FLOW_A_HARMONIC = 3;
	const FILM_FLOW_A_RADIAL = 5;
	const FILM_FLOW_A_PACE = 4300;
	const FILM_FLOW_B = 0.07;
	const FILM_FLOW_B_HARMONIC = 5;
	const FILM_FLOW_B_RADIAL = -8;
	const FILM_FLOW_B_PACE = 6700;
	const FILM_MIX_CENTRE = 0.004;
	const FILM_MIX_EDGE = 0.11;
	const FILM_STEPS = 1024;
	const WAVELENGTHS = Object.freeze([650, 550, 460]);
	const FILM_PATH_MAX = 2 * FILM_INDEX * FILM_THICKNESS * (1 + FILM_EDGE_GAIN) * (1 + FILM_FLOW_A + FILM_FLOW_B);
	const REFRACTION$1 = 26;
	const CHROMA = 0.16;
	const CAUSTIC = 12;
	const MIN_STRETCH = 0.35;
	const EDGE_DIM = 0.03;
	const SPECULAR = 64;
	const SPECULAR_DIR = -2.35;
	const SPECULAR_FROM = 0.55;
	const SPECULAR_SHARPNESS = 10;
	const SPECULAR_FLASH = 0.6;
	const RIM_ONE_HARMONIC = 3;
	const RIM_ONE_AMPLITUDE = 0.03;
	const RIM_ONE_PACE = 2600;
	const RIM_TWO_HARMONIC = 5;
	const RIM_TWO_AMPLITUDE = 0.022;
	const RIM_TWO_PACE = 3700;
	const RIM_THREE_HARMONIC = 2;
	const RIM_THREE_AMPLITUDE = 0.016;
	const RIM_THREE_PACE = 5300;
	const REACH = 1.09;
	const EDGE_SOFTNESS = 1.6;
	const MIN_VISIBILITY = 0.002;
	const MIN_DISTANCE = 0.0001;
	const MIN_HEIGHT = 0.0001;
	let filmTable = null;
	let filmBuilds = 0;
	const getFilmTable = () => {
		if (filmTable) {
			return filmTable;
		}
		const table = new Float32Array(FILM_STEPS * FILM_CHANNELS);
		for (let step = 0; step < FILM_STEPS; step++) {
			const path = step / (FILM_STEPS - 1) * FILM_PATH_MAX;
			for (let channel = 0; channel < FILM_CHANNELS; channel++) {
				const turns = FULL_TURN$1 * path / WAVELENGTHS[channel];
				table[step * FILM_CHANNELS + channel] = 0.5 - 0.5 * Math.cos(turns);
			}
		}
		filmTable = table;
		filmBuilds += 1;
		return table;
	};
	const between$1 = (from, to) => from + Math.random() * (to - from);
	const clamp$1 = (value, last) => {
		if (value < 0) {
			return 0;
		}
		return value > last ? last : value;
	};
	const smooth$1 = share => share * share * (3 - 2 * share);
	class BubbleEffect {
		#brush;
		#surface = document.createElement('canvas');
		#context = null;
		#image = null;
		#width = 0;
		#height = 0;
		#radius = 0;
		#x = -1;
		#y = -1;
		#targetX = 0;
		#targetY = 0;
		#previousX = 0;
		#previousY = 0;
		#speedX = 0;
		#speedY = 0;
		#axis = 0;
		#squash = 0;
		#squashSpeed = 0;
		#seen = false;
		#phase = 'alive';
		#phaseStart = 0;
		#time = 0;
		#size = 1;
		#visibility = 1;
		#flash = 0;
		#drops = [];
		#film = getFilmTable();
		#blur = null;
		constructor(scheme) {
			this.#brush = new BackdropBrush(scheme);
		}
		draw(frame) {
			if (!this.#requireGrid(frame.width, frame.height)) {
				return;
			}
			const context = this.#context;
			const composition = this.#toComposition(frame);
			const source = this.#brush.getPixels(composition);
			if (!context || !source) {
				return;
			}
			this.#time = frame.time;
			this.#brush.paint(context, composition);
			const step = Math.max(frame.delta, MIN_DELTA) / FRAME$1;
			this.#advance(frame.time);
			this.#aim(frame.pointer, frame.time);
			this.#move(step);
			if (this.#visibility > MIN_VISIBILITY) {
				this.#refract(source);
			}
			this.#splash(context, step);
			frame.context.drawImage(this.#surface, 0, 0, frame.width, frame.height);
		}
		press(pointer) {
			if (this.#phase !== 'alive' || this.#width === 0) {
				return;
			}
			const x = pointer.x * this.#width;
			const y = pointer.y * this.#height;
			if (Math.hypot(x - this.#x, y - this.#y) > this.#radius * HIT_SLACK) {
				return;
			}
			this.#phase = 'burst';
			this.#phaseStart = this.#time;
			this.#burst();
		}
		getPhase() {
			return this.#phase;
		}
		getDropCount() {
			return this.#drops.length;
		}
		static getFilmTableBuilds() {
			return filmBuilds;
		}
		setScheme(scheme) {
			this.#brush.setScheme(scheme);
		}
		destroy() {
			this.#brush.destroy();
			this.#image = null;
			this.#drops = [];
			this.#width = 0;
			this.#height = 0;
			this.#surface.width = 0;
			this.#surface.height = 0;
		}
		#toComposition(frame) {
			return {
				width: this.#width,
				height: this.#height,
				time: frame.time,
				blur: this.#requireBlur(frame.context.canvas) / CELL$1
			};
		}
		#requireBlur(canvas) {
			this.#blur ??= toBlurRadius(canvas);
			return this.#blur;
		}
		#requireGrid(width, height) {
			const cells = Math.max(MIN_CELLS$1, Math.round(width / CELL$1));
			const lines = Math.max(MIN_CELLS$1, Math.round(height / CELL$1));
			if (cells === this.#width && lines === this.#height) {
				return this.#image !== null;
			}
			this.#width = cells;
			this.#height = lines;
			this.#radius = Math.min(cells, lines) * RADIUS_SHARE;
			this.#surface.width = cells;
			this.#surface.height = lines;
			this.#context ??= this.#surface.getContext('2d', {
				alpha: false
			});
			this.#image = this.#context?.createImageData(cells, lines) ?? null;
			if (this.#x < 0) {
				this.#place(cells / 2, lines / 2);
				this.#targetX = this.#x;
				this.#targetY = this.#y;
			}
			return this.#image !== null;
		}
		#place(x, y) {
			this.#x = x;
			this.#y = y;
			this.#previousX = x;
			this.#previousY = y;
			this.#speedX = 0;
			this.#speedY = 0;
			this.#squash = 0;
			this.#squashSpeed = 0;
		}
		#advance(time) {
			this.#size = 1;
			this.#visibility = 1;
			this.#flash = 0;
			const gone = time - this.#phaseStart;
			if (this.#phase === 'burst') {
				const share = Math.min(1, gone / BURST);
				const eased = 1 - (1 - share) ** 3;
				this.#size = 1 + BURST_EXPAND * eased;
				this.#visibility = (1 - share) ** BURST_FADE;
				this.#flash = BURST_FLASH * (1 - share);
				if (share >= 1) {
					this.#phase = 'gone';
					this.#phaseStart = time;
				}
				return;
			}
			if (this.#phase === 'gone') {
				this.#visibility = 0;
				if (gone >= PAUSE) {
					this.#phase = 'birth';
					this.#phaseStart = time;
					this.#place(this.#targetX, this.#targetY);
				}
				return;
			}
			if (this.#phase === 'birth') {
				const share = Math.min(1, gone / BIRTH);
				const eased = 1 - (1 - share) ** 3;
				this.#size = BIRTH_FROM + (1 - BIRTH_FROM) * eased;
				this.#visibility = eased;
				if (share >= 1) {
					this.#phase = 'alive';
				}
			}
		}
		#aim(pointer, time) {
			this.#seen ||= pointer.inside;
			if (this.#seen) {
				this.#targetX = pointer.x * this.#width;
				this.#targetY = pointer.y * this.#height;
				return;
			}
			this.#targetX = this.#width * (0.5 + Math.sin(time / IDLE_PACE_X) * IDLE_SPREAD_X);
			this.#targetY = this.#height * (0.5 + Math.cos(time / IDLE_PACE_Y) * IDLE_SPREAD_Y);
		}
		#move(step) {
			const follow = 1 - (1 - FOLLOW) ** step;
			this.#x += (this.#targetX - this.#x) * follow;
			this.#y += (this.#targetY - this.#y) * follow;
			const walkedX = (this.#x - this.#previousX) / step;
			const walkedY = (this.#y - this.#previousY) / step;
			this.#previousX = this.#x;
			this.#previousY = this.#y;
			const ease = 1 - (1 - SPEED_EASE) ** step;
			this.#speedX += (walkedX - this.#speedX) * ease;
			this.#speedY += (walkedY - this.#speedY) * ease;
			const speed = Math.hypot(this.#speedX, this.#speedY);
			if (speed > MIN_AXIS_SPEED) {
				this.#axis = Math.atan2(this.#speedY, this.#speedX);
			}
			const wanted = Math.min(MAX_SQUASH, speed * SQUASH_PER_SPEED);
			this.#squashSpeed += (wanted - this.#squash) * SQUASH_SPRING * step;
			this.#squashSpeed *= SQUASH_DAMPING ** step;
			this.#squash += this.#squashSpeed * step;
		}
		#refract(source) {
			const image = this.#image;
			const context = this.#context;
			if (!image || !context) {
				return;
			}
			const width = this.#width;
			const radius = this.#radius * this.#size;
			const tail = this.#squash * TAIL_SHARE;
			const reach = radius * (REACH + Math.abs(this.#squash) + Math.abs(tail));
			const fromX = Math.max(0, Math.floor(this.#x - reach));
			const toX = Math.min(width, Math.ceil(this.#x + reach));
			const fromY = Math.max(0, Math.floor(this.#y - reach));
			const toY = Math.min(this.#height, Math.ceil(this.#y + reach));
			if (toX <= fromX || toY <= fromY) {
				return;
			}
			const picture = image.data;
			for (let row = fromY; row < toY; row++) {
				const line = row * width * PICTURE_CHANNELS;
				const at = line + fromX * PICTURE_CHANNELS;
				picture.set(source.subarray(at, line + toX * PICTURE_CHANNELS), at);
			}
			this.#paint(source, picture, {
				fromX,
				toX,
				fromY,
				toY,
				radius,
				tail
			});
			context.putImageData(image, 0, 0, fromX, fromY, toX - fromX, toY - fromY);
		}
		#paint(source, image, box) {
			const picture = image;
			const {
				fromX,
				toX,
				fromY,
				toY,
				radius,
				tail
			} = box;
			const {
				width,
				film,
				visibility,
				flash,
				steps,
				squash,
				rimOne,
				rimTwo,
				rimThree,
				flowOne,
				flowTwo,
				outer
			} = this.#getPaintState(radius, tail);
			for (let row = fromY; row < toY; row++) {
				const dy = row - this.#y;
				const line = row * width;
				const span = outer * outer - dy * dy;
				if (span <= 0) {
					continue;
				}
				const half = Math.sqrt(span);
				const first = Math.max(fromX, Math.ceil(this.#x - half));
				const last = Math.min(toX, Math.floor(this.#x + half) + 1);
				for (let column = first; column < last; column++) {
					const dx = column - this.#x;
					const distance = Math.sqrt(dx * dx + dy * dy);
					if (distance < MIN_DISTANCE) {
						continue;
					}
					const angle = Math.atan2(dy, dx);
					const turn = angle - this.#axis;
					const rim = radius * (1 + RIM_ONE_AMPLITUDE * Math.sin(RIM_ONE_HARMONIC * angle + rimOne) + RIM_TWO_AMPLITUDE * Math.sin(RIM_TWO_HARMONIC * angle - rimTwo) + RIM_THREE_AMPLITUDE * Math.sin(RIM_THREE_HARMONIC * angle + rimThree) + squash * Math.cos(SQUASH_HARMONIC * turn) - tail * Math.cos(turn));
					const edge = rim - distance;
					if (edge < -EDGE_SOFTNESS) {
						continue;
					}
					const reach = edge / EDGE_SOFTNESS + 0.5;
					if (reach <= 0) {
						continue;
					}
					const cover = reach >= 1 ? 1 : smooth$1(reach);
					const share = Math.min(1, distance / rim);
					const unitX = dx / distance;
					const unitY = dy / distance;
					const height = Math.sqrt(Math.max(MIN_HEIGHT, 1 - share * share));
					const push = REFRACTION$1 * share * share * share;
					const red = this.#read(source, column, row, unitX, unitY, push * (1 + CHROMA), 0);
					const green = this.#read(source, column, row, unitX, unitY, push, 1);
					const blue = this.#read(source, column, row, unitX, unitY, push * (1 - CHROMA), 2);
					const stretch = 1 - 3 * REFRACTION$1 * share * share / rim;
					const caustic = CAUSTIC * (1 / Math.max(MIN_STRETCH, stretch) - 1);
					const thickness = FILM_THICKNESS * (1 + FILM_EDGE_GAIN * (1 - height)) * (1 + FILM_FLOW_A * Math.sin(FILM_FLOW_A_HARMONIC * angle + FILM_FLOW_A_RADIAL * share - flowOne) + FILM_FLOW_B * Math.sin(FILM_FLOW_B_HARMONIC * angle + FILM_FLOW_B_RADIAL * share + flowTwo));
					const shade = clamp$1(Math.trunc(2 * FILM_INDEX * thickness * steps), FILM_STEPS - 1) * FILM_CHANNELS;
					const squared = share * share;
					const mix = (FILM_MIX_CENTRE + (FILM_MIX_EDGE - FILM_MIX_CENTRE) * squared * squared) * visibility;
					const dim = 1 - EDGE_DIM * share * visibility;
					let light = caustic * visibility;
					const lamp = Math.cos(angle - SPECULAR_DIR);
					if (lamp > 0 && share > SPECULAR_FROM) {
						const ramp = (share - SPECULAR_FROM) / (1 - SPECULAR_FROM);
						light += SPECULAR * (visibility + flash * SPECULAR_FLASH) * ramp * ramp * lamp ** SPECULAR_SHARPNESS;
					}
					const at = (line + column) * PICTURE_CHANNELS;
					picture[at] = this.#blend(source[at], red, film[shade], mix, dim, light, cover);
					picture[at + 1] = this.#blend(source[at + 1], green, film[shade + 1], mix, dim, light, cover);
					picture[at + 2] = this.#blend(source[at + 2], blue, film[shade + 2], mix, dim, light, cover);
				}
			}
		}
		#getPaintState(radius, tail) {
			const squash = this.#squash;
			const time = this.#time;
			const outer = radius * (1 + RIM_ONE_AMPLITUDE + RIM_TWO_AMPLITUDE + RIM_THREE_AMPLITUDE + Math.abs(squash) + Math.abs(tail)) + EDGE_SOFTNESS;
			return {
				width: this.#width,
				film: this.#film,
				visibility: this.#visibility,
				flash: this.#flash,
				steps: (FILM_STEPS - 1) / FILM_PATH_MAX,
				squash,
				rimOne: time / RIM_ONE_PACE,
				rimTwo: time / RIM_TWO_PACE,
				rimThree: time / RIM_THREE_PACE,
				flowOne: time / FILM_FLOW_A_PACE,
				flowTwo: time / FILM_FLOW_B_PACE,
				outer
			};
		}
		#blend(under, bent, film, mix, dim, light, cover) {
			const value = (bent * (1 - mix) + CHANNEL_MAX$1 * film * mix) * dim + light;
			return cover >= 1 ? value : under * (1 - cover) + value * cover;
		}
		#read(source, x, y, unitX, unitY, push, channel) {
			const column = clamp$1(Math.round(x - unitX * push), this.#width - 1);
			const row = clamp$1(Math.round(y - unitY * push), this.#height - 1);
			return source[(row * this.#width + column) * PICTURE_CHANNELS + channel];
		}
		#burst() {
			const drops = [];
			const side = Math.min(this.#width, this.#height);
			for (let drop = 0; drop < DROPS; drop++) {
				const angle = drop / DROPS * FULL_TURN$1 + (Math.random() - 0.5) * DROP_SPREAD;
				const speed = between$1(DROP_SPEED_MIN, DROP_SPEED_MAX);
				drops.push({
					x: this.#x + Math.cos(angle) * this.#radius,
					y: this.#y + Math.sin(angle) * this.#radius,
					speedX: Math.cos(angle) * speed,
					speedY: Math.sin(angle) * speed,
					radius: between$1(DROP_RADIUS_MIN, DROP_RADIUS_MAX) * side,
					life: 1,
					film: Math.trunc(Math.random() * FILM_STEPS)
				});
			}
			this.#drops = drops;
		}
		#splash(context, step) {
			if (this.#drops.length === 0) {
				return;
			}
			const drag = DROP_DRAG ** step;
			for (let at = this.#drops.length - 1; at >= 0; at--) {
				const drop = this.#drops[at];
				drop.life -= DROP_FADE * step;
				if (drop.life <= 0) {
					this.#drops.splice(at, 1);
					continue;
				}
				drop.x += drop.speedX * step;
				drop.y += drop.speedY * step;
				drop.speedX *= drag;
				drop.speedY *= drag;
				drop.speedY += DROP_GRAVITY * step;
			}
			context.lineWidth = DROP_LINE * Math.min(this.#width, this.#height);
			this.#drops.forEach(drop => this.#paintDrop(context, drop));
			context.globalAlpha = 1;
		}
		#paintDrop(context, drop) {
			const at = drop.film * FILM_CHANNELS;
			const red = Math.round(CHANNEL_MAX$1 * this.#film[at]);
			const green = Math.round(CHANNEL_MAX$1 * this.#film[at + 1]);
			const blue = Math.round(CHANNEL_MAX$1 * this.#film[at + 2]);
			context.globalAlpha = drop.life;
			context.strokeStyle = `rgb(${red}, ${green}, ${blue})`;
			context.beginPath();
			context.arc(drop.x, drop.y, drop.radius * (DROP_SHRINK + (1 - DROP_SHRINK) * drop.life), 0, FULL_TURN$1);
			context.stroke();
		}
	}

	const FULL_TURN = Math.PI * 2;
	const PARTICLES_PER_PATH = 5.5;
	const PATH = 100;
	const MAX_PER_FRAME = 6;
	const MAX_PARTICLES = 130;
	const GLINT_SHARE = 0.45;
	const STAR_RADIUS_MIN = 0.012;
	const STAR_RADIUS_MAX = 0.03;
	const BIG_EVERY = 9;
	const BIG_GAIN = 1.9;
	const GLINT_RADIUS_MIN = 0.6;
	const GLINT_RADIUS_MAX = 1.3;
	const LIFE_MIN = 620;
	const LIFE_MAX = 1180;
	const SCATTER = 0.9;
	const INHERIT = 0.12;
	const DRAG = 0.94;
	const GRAVITY = 0.012;
	const FRAME = 16;
	const TWINKLE_PACE = 0.009;
	const TWINKLE_DEPTH = 0.12;
	const SPIN = 0.0009;
	const STAR_RAYS = 4;
	const STAR_WAIST = 0.44;
	const STAR_SHORT = 0.94;
	const STAR_CORE = 0.42;
	const FADE_IN = 0.15;
	const SHRINK = 0.82;
	const GLINT_ALPHA = 0.34;
	const HALO_ALPHA = 0.22;
	const STAR_ALPHA = 0.82;
	const HALO_GAIN = 2.6;
	const SPRITE_SIZE = 96;
	const SPRITE_STOPS = 8;
	const SPRITE_ALPHA = 0.7;
	const STAR_LIFT = 0.5;
	const CORE_LIFT = 0.74;
	const CHANNEL_MAX = 255;
	const between = (from, to) => from + Math.random() * (to - from);
	const lift = (channels, share) => {
		const run = channels.map(channel => {
			return Math.round(channel + (CHANNEL_MAX - channel) * share);
		});
		return `rgb(${run[0]}, ${run[1]}, ${run[2]})`;
	};
	const fillStar = (context, radius) => {
		context.beginPath();
		for (let ray = 0; ray < STAR_RAYS; ray++) {
			const angle = ray * FULL_TURN / STAR_RAYS;
			const length = ray % 2 === 0 ? radius : radius * STAR_SHORT;
			const waist = angle + FULL_TURN / (STAR_RAYS * 2);
			const tipX = Math.cos(angle) * length;
			const tipY = Math.sin(angle) * length;
			if (ray === 0) {
				context.moveTo(tipX, tipY);
			} else {
				context.lineTo(tipX, tipY);
			}
			context.lineTo(Math.cos(waist) * radius * STAR_WAIST, Math.sin(waist) * radius * STAR_WAIST);
		}
		context.closePath();
		context.fill();
	};
	class SparkleEffect {
		#brush;
		#particles = [];
		#trail = null;
		#path = 0;
		#born = 0;
		#sprite = document.createElement('canvas');
		#starColor = '';
		#coreColor = '';
		#hasColors = false;
		#blur = null;
		constructor(scheme) {
			this.#brush = new BackdropBrush(scheme);
			this.#sprite.width = SPRITE_SIZE;
			this.#sprite.height = SPRITE_SIZE;
			this.#applyScheme(scheme);
		}
		prepare() {
			return this.#hasColors;
		}
		draw(frame) {
			const {
				context,
				width,
				height,
				time,
				delta
			} = frame;
			this.#brush.paint(context, {
				width,
				height,
				time,
				blur: this.#requireBlur(context.canvas)
			});
			this.#trace(frame);
			this.#live(delta);
			this.#paint(context);
		}
		isResting() {
			return this.#particles.length === 0;
		}
		getParticleCount() {
			return this.#particles.length;
		}
		setScheme(scheme) {
			this.#brush.setScheme(scheme);
			this.#applyScheme(scheme);
		}
		destroy() {
			this.#brush.destroy();
			this.#particles = [];
			this.#trail = null;
			this.#sprite.width = 0;
			this.#sprite.height = 0;
		}
		#applyScheme(scheme) {
			const channels = toChannels(scheme.glow);
			if (!channels) {
				return;
			}
			this.#starColor = lift(channels, STAR_LIFT);
			this.#coreColor = lift(channels, CORE_LIFT);
			this.#hasColors = true;
			this.#bakeSprite(channels);
		}
		#bakeSprite(channels) {
			const context = this.#sprite.getContext('2d');
			if (!context) {
				return;
			}
			const centre = SPRITE_SIZE / 2;
			const gradient = context.createRadialGradient(centre, centre, 0, centre, centre, centre);
			for (let stop = 0; stop <= SPRITE_STOPS; stop++) {
				const share = stop / SPRITE_STOPS;
				const alpha = Math.exp(-4.2 * share * share) * SPRITE_ALPHA;
				gradient.addColorStop(share, `rgba(${channels[0]}, ${channels[1]}, ${channels[2]}, ${alpha})`);
			}
			context.clearRect(0, 0, SPRITE_SIZE, SPRITE_SIZE);
			context.fillStyle = gradient;
			context.fillRect(0, 0, SPRITE_SIZE, SPRITE_SIZE);
		}
		#requireBlur(canvas) {
			this.#blur ??= toBlurRadius(canvas);
			return this.#blur;
		}
		#trace({
			pointer,
			width,
			height,
			delta
		}) {
			if (!pointer.inside) {
				this.#trail = null;
				this.#path = 0;
				return;
			}
			const place = {
				x: pointer.x * width,
				y: pointer.y * height
			};
			const from = this.#trail;
			this.#trail = place;
			if (!from) {
				return;
			}
			const dx = place.x - from.x;
			const dy = place.y - from.y;
			const walked = Math.hypot(dx, dy);
			if (walked === 0) {
				return;
			}
			this.#path += walked / PATH * PARTICLES_PER_PATH;
			const count = Math.min(Math.floor(this.#path), MAX_PER_FRAME);
			this.#path = count === MAX_PER_FRAME ? 0 : this.#path - count;
			const side = Math.min(width, height);
			for (let born = 1; born <= count; born++) {
				const share = born / count;
				this.#spawn(from.x + dx * share, from.y + dy * share, dx / delta, dy / delta, side);
			}
		}
		#spawn(x, y, speedX, speedY, side) {
			if (this.#particles.length >= MAX_PARTICLES) {
				return;
			}
			const big = this.#born % BIG_EVERY === 0;
			const glint = Math.random() < GLINT_SHARE;
			const star = side * between(STAR_RADIUS_MIN, STAR_RADIUS_MAX) * (big ? BIG_GAIN : 1);
			const angle = Math.random() * FULL_TURN;
			const scatter = Math.random() * SCATTER;
			const life = between(LIFE_MIN, LIFE_MAX);
			this.#particles.push({
				x,
				y,
				vx: Math.cos(angle) * scatter + speedX * INHERIT,
				vy: Math.sin(angle) * scatter + speedY * INHERIT,
				radius: glint ? star * between(GLINT_RADIUS_MIN, GLINT_RADIUS_MAX) : star,
				rotation: Math.random() * Math.PI,
				spin: (Math.random() * 2 - 1) * SPIN,
				phase: Math.random() * FULL_TURN,
				life,
				fullLife: life,
				glint
			});
			this.#born += 1;
		}
		#live(delta) {
			const step = delta / FRAME;
			const drag = DRAG ** step;
			for (let at = this.#particles.length - 1; at >= 0; at--) {
				const particle = this.#particles[at];
				particle.life -= delta;
				if (particle.life <= 0) {
					this.#particles.splice(at, 1);
					continue;
				}
				particle.vy += GRAVITY * step;
				particle.x += particle.vx * step;
				particle.y += particle.vy * step;
				particle.vx *= drag;
				particle.vy *= drag;
				particle.rotation += particle.spin * delta;
				particle.phase += TWINKLE_PACE * delta;
			}
		}
		#paint(context) {
			if (this.#particles.length === 0) {
				return;
			}
			context.save();
			context.globalCompositeOperation = 'lighter';
			this.#particles.forEach(particle => this.#paintParticle(context, particle));
			context.restore();
		}
		#paintParticle(context, particle) {
			const left = particle.life / particle.fullLife;
			const fade = left > 1 - FADE_IN ? (1 - left) / FADE_IN : left / (1 - FADE_IN);
			const twinkle = particle.glint ? 1 : 1 + Math.sin(particle.phase) * TWINKLE_DEPTH;
			const radius = particle.radius * twinkle * (SHRINK + (1 - SHRINK) * fade);
			if (particle.glint) {
				context.globalAlpha = GLINT_ALPHA * fade;
				this.#drawSprite(context, particle, radius);
				return;
			}
			context.globalAlpha = HALO_ALPHA * fade;
			this.#drawSprite(context, particle, radius * HALO_GAIN);
			context.globalAlpha = STAR_ALPHA * fade;
			context.save();
			context.translate(particle.x, particle.y);
			context.rotate(particle.rotation);
			context.fillStyle = this.#starColor;
			fillStar(context, radius);
			context.fillStyle = this.#coreColor;
			fillStar(context, radius * STAR_CORE);
			context.restore();
		}
		#drawSprite(context, {
			x,
			y
		}, radius) {
			context.drawImage(this.#sprite, x - radius, y - radius, radius * 2, radius * 2);
		}
	}

	const QUARTER_TURN = Math.PI / 2;
	const OPAQUE = 255;
	const CELL = 2;
	const MIN_CELLS = 2;
	const MARGIN = 44;
	const EDGE_DAMPING = 0.6;
	const TENSION = 0.065;
	const VISCOSITY = 0.99;
	const RECOVERY = 0.99;
	const REFRACTION = 12;
	const SHADING = 26;
	const MAX_SHADE = 45;
	const TOUCH_RADIUS = 34;
	const TOUCH_PLATEAU = 0.55;
	const TOUCH_STEP = 8;
	const MAX_TOUCH_STEPS = 5;
	const IMPULSE_PER_CELL = 0.0018;
	const MAX_IMPULSE = 0.036;
	const MIN_IMPULSE = 0.0008;
	const SWELL_SOURCES = 2;
	const SWELL_EVERY = 2;
	const SWELL_IMPULSE = 0.012;
	const SWELL_RADIUS = 124;
	const SWELL_SPREAD = 0.46;
	const SWELL_PACE = 0.00009;
	const SWELL_ASPECT = 0.73;
	const SWELL_PHASE = 2.1;
	const SWELL_TWIST = 1.7;
	const smooth = share => share * share * (3 - 2 * share);
	class WaterEffect {
		#brush;
		#surface = document.createElement('canvas');
		#context = null;
		#image = null;
		#width = 0;
		#height = 0;
		#cardWidth = 0;
		#cardHeight = 0;
		#level = new Float32Array(0);
		#velocity = new Float32Array(0);
		#damping = new Float32Array(0);
		#trail = null;
		#ticks = 0;
		#blur = null;
		constructor(scheme) {
			this.#brush = new BackdropBrush(scheme);
		}
		draw(frame) {
			if (!this.#requireGrid(frame.width, frame.height)) {
				return;
			}
			const source = this.#brush.getPixels(this.#toComposition(frame));
			if (!source) {
				return;
			}
			this.#stir(frame);
			this.#settle();
			this.#refract(source);
			this.#show(frame.context, frame.width, frame.height);
		}
		getGridSize() {
			return {
				width: this.#width,
				height: this.#height
			};
		}
		setScheme(scheme) {
			this.#brush.setScheme(scheme);
		}
		destroy() {
			this.#brush.destroy();
			this.#level = new Float32Array(0);
			this.#velocity = new Float32Array(0);
			this.#damping = new Float32Array(0);
			this.#image = null;
			this.#trail = null;
			this.#cardWidth = 0;
			this.#cardHeight = 0;
			this.#surface.width = 0;
			this.#surface.height = 0;
		}
		#toComposition(frame) {
			return {
				width: this.#width,
				height: this.#height,
				card: {
					x: MARGIN,
					y: MARGIN,
					width: this.#cardWidth,
					height: this.#cardHeight
				},
				time: frame.time,
				blur: this.#requireBlur(frame.context.canvas) / CELL
			};
		}
		#requireBlur(canvas) {
			this.#blur ??= toBlurRadius(canvas);
			return this.#blur;
		}
		#requireGrid(width, height) {
			const cardWidth = Math.max(MIN_CELLS, Math.round(width / CELL));
			const cardHeight = Math.max(MIN_CELLS, Math.round(height / CELL));
			if (cardWidth === this.#cardWidth && cardHeight === this.#cardHeight) {
				return this.#image !== null;
			}
			this.#cardWidth = cardWidth;
			this.#cardHeight = cardHeight;
			this.#width = cardWidth + MARGIN * 2;
			this.#height = cardHeight + MARGIN * 2;
			const cells = this.#width * this.#height;
			this.#level = new Float32Array(cells);
			this.#velocity = new Float32Array(cells);
			this.#damping = this.#bakeDamping();
			this.#trail = null;
			this.#surface.width = cardWidth;
			this.#surface.height = cardHeight;
			this.#context ??= this.#surface.getContext('2d', {
				alpha: false
			});
			this.#image = this.#context?.createImageData(cardWidth, cardHeight) ?? null;
			if (this.#image) {
				const data = this.#image.data;
				for (let at = 3; at < data.length; at += 4) {
					data[at] = OPAQUE;
				}
			}
			return this.#image !== null;
		}
		#bakeDamping() {
			const damping = new Float32Array(this.#width * this.#height);
			const lastColumn = this.#width - 1;
			const lastRow = this.#height - 1;
			for (let row = 0; row < this.#height; row++) {
				const line = row * this.#width;
				for (let column = 0; column < this.#width; column++) {
					const toEdge = Math.min(column, row, lastColumn - column, lastRow - row);
					const share = Math.min(1, toEdge / MARGIN);
					damping[line + column] = EDGE_DAMPING + (1 - EDGE_DAMPING) * smooth(share);
				}
			}
			return damping;
		}
		#stir(frame) {
			this.#follow(frame.pointer);
			this.#swell(frame.time);
		}
		#follow(pointer) {
			if (!pointer.inside) {
				this.#trail = null;
				return;
			}
			const place = {
				x: MARGIN + pointer.x * this.#cardWidth,
				y: MARGIN + pointer.y * this.#cardHeight
			};
			const from = this.#trail;
			this.#trail = place;
			if (!from) {
				return;
			}
			const walked = Math.hypot(place.x - from.x, place.y - from.y);
			const power = Math.min(walked * IMPULSE_PER_CELL, MAX_IMPULSE);
			if (power <= MIN_IMPULSE) {
				return;
			}
			const steps = Math.min(Math.ceil(walked / TOUCH_STEP), MAX_TOUCH_STEPS);
			for (let step = 1; step <= steps; step++) {
				const share = step / steps;
				this.#touch(from.x + (place.x - from.x) * share, from.y + (place.y - from.y) * share, power, TOUCH_RADIUS);
			}
		}
		#swell(time) {
			this.#ticks += 1;
			if (this.#ticks % SWELL_EVERY !== 0) {
				return;
			}
			for (let source = 0; source < SWELL_SOURCES; source++) {
				const phase = source * SWELL_PHASE;
				const x = 0.5 + Math.sin(time * SWELL_PACE + phase) * SWELL_SPREAD;
				const y = 0.5 + Math.cos(time * SWELL_PACE * SWELL_ASPECT + phase * SWELL_TWIST) * SWELL_SPREAD;
				this.#touch(MARGIN + x * this.#cardWidth, MARGIN + y * this.#cardHeight, SWELL_IMPULSE, SWELL_RADIUS);
			}
		}
		#touch(atX, atY, power, radius) {
			const centreX = Math.round(atX);
			const centreY = Math.round(atY);
			const lastColumn = this.#width - 1;
			const lastRow = this.#height - 1;
			for (let dy = -radius; dy <= radius; dy++) {
				const row = centreY + dy;
				if (row < 1 || row >= lastRow) {
					continue;
				}
				const line = row * this.#width;
				for (let dx = -radius; dx <= radius; dx++) {
					const column = centreX + dx;
					if (column < 1 || column >= lastColumn) {
						continue;
					}
					const reach = Math.hypot(dx, dy) / radius;
					if (reach > 1) {
						continue;
					}
					let share = 1;
					if (reach > TOUCH_PLATEAU) {
						const past = (reach - TOUCH_PLATEAU) / (1 - TOUCH_PLATEAU);
						const fade = Math.cos(past * QUARTER_TURN);
						share = fade * fade;
					}
					this.#velocity[line + column] -= power * share;
				}
			}
		}
		#settle() {
			const width = this.#width;
			const lastRow = this.#height - 1;
			const lastColumn = width - 1;
			const level = this.#level;
			const velocity = this.#velocity;
			const damping = this.#damping;
			for (let row = 1; row < lastRow; row++) {
				const line = row * width;
				for (let column = 1; column < lastColumn; column++) {
					const cell = line + column;
					const around = (level[cell - 1] + level[cell + 1] + level[cell - width] + level[cell + width]) / 4;
					velocity[cell] = (velocity[cell] + (around - level[cell]) * TENSION) * VISCOSITY * damping[cell];
				}
			}
			for (let row = 1; row < lastRow; row++) {
				const line = row * width;
				for (let column = 1; column < lastColumn; column++) {
					const cell = line + column;
					level[cell] = (level[cell] + velocity[cell]) * RECOVERY * damping[cell];
				}
			}
		}
		#refract(source) {
			const image = this.#image;
			if (!image) {
				return;
			}
			const picture = image.data;
			const width = this.#width;
			const level = this.#level;
			const lastColumn = width - 1;
			const lastRow = this.#height - 1;
			let at = 0;
			for (let row = 0; row < this.#cardHeight; row++) {
				const line = (row + MARGIN) * width;
				for (let column = 0; column < this.#cardWidth; column++) {
					const cell = line + column + MARGIN;
					const slopeX = level[cell - 1] - level[cell + 1];
					const slopeY = level[cell - width] - level[cell + width];
					const fromColumn = Math.min(lastColumn, Math.max(0, column + MARGIN + Math.trunc(slopeX * REFRACTION)));
					const fromRow = Math.min(lastRow, Math.max(0, row + MARGIN + Math.trunc(slopeY * REFRACTION)));
					const from = (fromRow * width + fromColumn) * 4;
					const shade = Math.min(MAX_SHADE, Math.max(-MAX_SHADE, (slopeX + slopeY) * SHADING));
					picture[at] = source[from] + shade;
					picture[at + 1] = source[from + 1] + shade;
					picture[at + 2] = source[from + 2] + shade;
					at += 4;
				}
			}
		}
		#show(context, width, height) {
			const image = this.#image;
			if (!image || !this.#context) {
				return;
			}
			this.#context.putImageData(image, 0, 0);
			context.drawImage(this.#surface, 0, 0, width, height);
		}
	}

	const MAX_PIXEL_RATIO = 1;
	const MAX_FRAME_STEP = 48;
	const FIRST_FRAME_STEP = 16;
	const CENTRE = Object.freeze({
		x: 0.5,
		y: 0.5
	});
	const PLAIN_ATTRIBUTES = {
		alpha: false
	};
	const HARDWARE_ATTRIBUTES = {
		alpha: false,
		antialias: true
	};
	const CONTEXT_EVENTS = Object.freeze({
		'2d': {
			lost: 'contextlost',
			restored: 'contextrestored'
		},
		webgl2: {
			lost: 'webglcontextlost',
			restored: 'webglcontextrestored'
		}
	});
	const releaseContext = context => {
		if (!context || context instanceof CanvasRenderingContext2D) {
			return;
		}
		context.getExtension('WEBGL_lose_context')?.loseContext();
	};
	class BackdropEngine {
		#host;
		#canvasClass;
		#effect;
		#onContextLost;
		#canvas = null;
		#context = null;
		#kind = '2d';
		#resizeObserver = null;
		#screenObserver = null;
		#width = 0;
		#height = 0;
		#pointer = {
			...CENTRE,
			inside: false
		};
		#pointerPlace = null;
		#request = null;
		#timestamp = 0;
		#time = 0;
		#frames = 0;
		#mounted = false;
		#running = false;
		#onScreen = true;
		#awake = true;
		#resting = false;
		constructor(options) {
			this.#host = options.host;
			this.#canvasClass = options.canvasClass;
			this.#effect = options.effect ?? null;
			this.#onContextLost = options.onContextLost ?? null;
		}
		start() {
			if (!this.#mounted && !this.#mount()) {
				return false;
			}
			this.#running = true;
			this.#awake = !document.hidden;
			this.#resting = false;
			this.#sync();
			return true;
		}
		stop() {
			this.#running = false;
			this.#sync();
		}
		setScheme(scheme) {
			this.#effect?.setScheme?.(scheme);
			this.#wake();
		}
		getFrameCount() {
			return this.#frames;
		}
		destroy() {
			this.#running = false;
			this.#mounted = false;
			this.#cancel();
			this.#resizeObserver?.disconnect();
			this.#resizeObserver = null;
			this.#screenObserver?.disconnect();
			this.#screenObserver = null;
			main_core.Event.unbind(window, 'pointermove', this.#handlePointerMove);
			main_core.Event.unbind(window, 'pointerdown', this.#handlePointerDown);
			main_core.Event.unbind(document, 'visibilitychange', this.#handleVisibilityChange);
			if (this.#canvas) {
				main_core.Event.unbind(this.#canvas, CONTEXT_EVENTS[this.#kind].lost, this.#handleContextLost);
				main_core.Event.unbind(this.#canvas, CONTEXT_EVENTS[this.#kind].restored, this.#handleContextRestored);
				main_core.Dom.remove(this.#canvas);
			}
			this.#effect?.destroy?.();
			this.#effect = null;
			this.#onContextLost = null;
			releaseContext(this.#context);
			this.#canvas = null;
			this.#context = null;
		}
		#mount() {
			this.#kind = this.#effect?.contextKind === 'webgl2' ? 'webgl2' : '2d';
			const canvas = main_core.Tag.render`<canvas class="${this.#canvasClass}"></canvas>`;
			const context = this.#acquire(canvas);
			if (!context || this.#effect?.prepare?.(context) === false) {
				releaseContext(context);
				return false;
			}
			this.#canvas = canvas;
			this.#attach(canvas, context);
			this.#resizeObserver = new ResizeObserver(this.#handleResize);
			this.#resizeObserver.observe(this.#host);
			this.#screenObserver = new IntersectionObserver(this.#handleScreen);
			this.#screenObserver.observe(this.#host);
			main_core.Event.bind(window, 'pointermove', this.#handlePointerMove, {
				passive: true
			});
			main_core.Event.bind(window, 'pointerdown', this.#handlePointerDown, {
				passive: true
			});
			main_core.Event.bind(document, 'visibilitychange', this.#handleVisibilityChange);
			main_core.Event.bind(canvas, CONTEXT_EVENTS[this.#kind].lost, this.#handleContextLost);
			main_core.Event.bind(canvas, CONTEXT_EVENTS[this.#kind].restored, this.#handleContextRestored);
			this.#mounted = true;
			return true;
		}
		#acquire(canvas) {
			return this.#kind === 'webgl2' ? canvas.getContext('webgl2', HARDWARE_ATTRIBUTES) : canvas.getContext('2d', PLAIN_ATTRIBUTES);
		}
		#attach(canvas, context) {
			this.#context = context;
			main_core.Dom.append(canvas, this.#host);
			this.#measure();
		}
		#sync() {
			if (this.#canRun()) {
				this.#schedule();
				return;
			}
			this.#cancel();
		}
		#canRun() {
			return this.#running && this.#onScreen && this.#awake && !this.#resting && this.#context !== null;
		}
		#wake() {
			if (!this.#resting) {
				return;
			}
			this.#resting = false;
			this.#sync();
		}
		#schedule() {
			if (this.#request === null) {
				this.#request = requestAnimationFrame(this.#handleFrame);
			}
		}
		#cancel() {
			if (this.#request !== null) {
				cancelAnimationFrame(this.#request);
				this.#request = null;
			}
			this.#timestamp = 0;
		}
		#handleFrame = timestamp => {
			this.#request = null;
			const step = this.#timestamp > 0 ? Math.min(timestamp - this.#timestamp, MAX_FRAME_STEP) : FIRST_FRAME_STEP;
			this.#timestamp = timestamp;
			this.#time += step;
			this.#frames += 1;
			this.#draw(step);
			this.#resting = this.#effect?.isResting?.() === true;
			this.#sync();
		};
		#draw(step) {
			const context = this.#context;
			if (!context || this.#width === 0 || this.#height === 0) {
				return;
			}
			this.#syncPointer();
			this.#effect?.draw({
				context,
				width: this.#width,
				height: this.#height,
				pointer: this.#pointer,
				time: this.#time,
				delta: step
			});
		}
		#measure() {
			const canvas = this.#canvas;
			const context = this.#context;
			if (!canvas || !context) {
				return;
			}
			const box = this.#host.getBoundingClientRect();
			if (box.width === 0 || box.height === 0) {
				return;
			}
			const ratio = Math.min(window.devicePixelRatio || 1, MAX_PIXEL_RATIO);
			this.#width = box.width;
			this.#height = box.height;
			canvas.width = Math.round(box.width * ratio);
			canvas.height = Math.round(box.height * ratio);
			main_core.Dom.style(canvas, 'width', `${box.width}px`);
			main_core.Dom.style(canvas, 'height', `${box.height}px`);
			if (context instanceof CanvasRenderingContext2D) {
				context.setTransform(ratio, 0, 0, ratio, 0, 0);
			} else {
				context.viewport(0, 0, canvas.width, canvas.height);
			}
		}
		#syncPointer() {
			const place = this.#pointerPlace;
			if (!place) {
				return;
			}
			this.#pointerPlace = null;
			const shares = this.#toShares(place);
			if (!shares) {
				return;
			}
			this.#pointer.inside = shares.inside;
			if (shares.inside) {
				this.#pointer.x = shares.x;
				this.#pointer.y = shares.y;
			}
		}
		#toShares(place) {
			const box = this.#host.getBoundingClientRect();
			if (box.width === 0 || box.height === 0) {
				return null;
			}
			const x = (place.x - box.left) / box.width;
			const y = (place.y - box.top) / box.height;
			return {
				x,
				y,
				inside: x >= 0 && x < 1 && y >= 0 && y < 1
			};
		}
		#handlePointerMove = event => {
			this.#pointerPlace = {
				x: event.clientX,
				y: event.clientY
			};
			this.#wake();
		};
		#handlePointerDown = event => {
			const shares = this.#toShares({
				x: event.clientX,
				y: event.clientY
			});
			if (!shares?.inside) {
				return;
			}
			this.#effect?.press?.(shares);
			this.#wake();
		};
		#handleResize = () => {
			this.#measure();
			this.#wake();
		};
		#handleScreen = entries => {
			const last = entries[entries.length - 1];
			if (!last) {
				return;
			}
			this.#onScreen = last.isIntersecting;
			this.#sync();
		};
		#handleVisibilityChange = () => {
			this.#awake = !document.hidden;
			this.#sync();
		};
		#handleContextLost = event => {
			if (this.#kind === 'webgl2') {
				event.preventDefault();
			}
			this.#context = null;
			this.#cancel();
			this.#effect?.release?.();
			main_core.Dom.remove(this.#canvas);
		};
		#handleContextRestored = () => {
			const canvas = this.#canvas;
			if (!canvas || this.#context) {
				return;
			}
			const context = this.#acquire(canvas);
			if (!context || this.#effect?.prepare?.(context) === false) {
				releaseContext(context);
				this.#onContextLost?.();
				return;
			}
			this.#attach(canvas, context);
			this.#resting = false;
			this.#sync();
		};
	}

	const BackdropVariable = Object.freeze({
		Base: '--ui-system-whats-new-backdrop-base',
		Glow: '--ui-system-whats-new-backdrop-glow'
	});
	const DEFAULT_COLOR = WhatsNewColor.DarkBlue;
	const SCHEMES = Object.freeze({
		[WhatsNewColor.DarkBlue]: {
			base: '#00078C',
			glow: '#2A76F0'
		},
		[WhatsNewColor.Pink]: {
			base: '#7B1E21',
			glow: '#C24E50'
		},
		[WhatsNewColor.Violet]: {
			base: '#40287B',
			glow: '#6B44AF'
		},
		[WhatsNewColor.Magenta]: {
			base: '#720040',
			glow: '#A91A76'
		},
		[WhatsNewColor.Sapphire]: {
			base: '#006271',
			glow: '#01AABA'
		},
		[WhatsNewColor.BitrixGpt]: {
			base: '#161835',
			glow: '#CEA3FF',
			gradient: {
				direction: 'to bottom right',
				stops: [[0, '#161835'], [1, '#40469B']]
			}
		},
		[WhatsNewColor.Gradient]: {
			base: '#2E2A8F',
			glow: '#CB4AAB',
			gradient: {
				direction: '135deg',
				stops: [[0, '#2E2A8F'], [0.44, '#324DB8'], [0.7, '#CB4AAB'], [1, '#FF7A5C']]
			}
		}
	});
	const getColorScheme = color => {
		return SCHEMES[color] ?? SCHEMES[DEFAULT_COLOR];
	};

	const BLOCK_CLASS$6 = 'ui-system-whats-new-backdrop';
	const LAYER_CLASS = `${BLOCK_CLASS$6}__layer`;
	const GLOW_CLASS = '--glow';
	const REVEAL_DURATION = 620;
	const REVEAL_EASING = 'cubic-bezier(0.22, 0.61, 0.36, 1)';
	const REVEAL_RADIUS = 1.5;
	const DEFAULT_ORIGIN = Object.freeze({
		x: 0.5,
		y: 1
	});
	const SETTLE_DELAY = 150;
	const EFFECTS = {
		[WhatsNewBackdrop.Sparkle]: scheme => new SparkleEffect(scheme),
		[WhatsNewBackdrop.Water]: scheme => new WaterEffect(scheme),
		[WhatsNewBackdrop.Bubble]: scheme => new BubbleEffect(scheme),
		[WhatsNewBackdrop.Balloons]: scheme => new BalloonsEffect(scheme)
	};
	const toPercent = share => `${Math.round(share * 1000) / 10}%`;
	const cssVariable = name => `var(${name})`;
	const toLinearGradient = ({
		direction,
		stops
	}) => {
		const run = stops.map(([offset, color]) => `${color} ${toPercent(offset)}`).join(', ');
		return `linear-gradient(${direction}, ${run})`;
	};
	const toBaseFill = scheme => {
		const fill = scheme.gradient ? toLinearGradient(scheme.gradient) : cssVariable(BackdropVariable.Base);
		return scheme.image ? `url("${scheme.image}") center / cover no-repeat, ${fill}` : fill;
	};
	const toGlowFill = ({
		x,
		y,
		radius
	}) => {
		const size = `${toPercent(radius)} ${toPercent(radius)}`;
		return `radial-gradient(${size} at ${toPercent(x)} ${toPercent(y)}, ${cssVariable(BackdropVariable.Glow)} 0%, transparent 100%)`;
	};
	const toOrigin = origin => {
		return main_core.Type.isNumber(origin?.x) && main_core.Type.isNumber(origin?.y) ? origin : DEFAULT_ORIGIN;
	};
	const toCircle = (radius, {
		x,
		y
	}) => {
		return `circle(${toPercent(radius)} at ${toPercent(x)} ${toPercent(y)})`;
	};
	const REDUCED_MOTION_QUERY$1 = '(prefers-reduced-motion: reduce)';
	let reducedMotionQuery = null;
	const getReducedMotionQuery = () => {
		reducedMotionQuery ??= window.matchMedia(REDUCED_MOTION_QUERY$1);
		return reducedMotionQuery;
	};
	const prefersReducedMotion$1 = () => getReducedMotionQuery().matches;
	const toVignetteFill = () => {
		const {
			x,
			y,
			radius,
			clearUntil
		} = BackdropGeometry.vignette;
		const size = `${toPercent(radius)} ${toPercent(radius)}`;
		const base = cssVariable(BackdropVariable.Base);
		return `radial-gradient(${size} at ${toPercent(x)} ${toPercent(y)}, transparent ${toPercent(clearUntil)}, ${base} 100%)`;
	};
	class Backdrop {
		#color;
		#container = null;
		#effect;
		#engine = null;
		#scheme = null;
		#reveal = null;
		#settleTimer = null;
		constructor(options) {
			this.#color = options.color;
			this.#effect = options.effect ?? WhatsNewBackdrop.None;
			main_core.Event.bind(getReducedMotionQuery(), 'change', this.#handleMotionChange);
		}
		render() {
			if (!this.#container) {
				this.#container = this.#renderContainer();
				this.#syncEffect();
			}
			return this.#container;
		}
		setColor(color, origin = DEFAULT_ORIGIN) {
			if (color === this.#color || this.#reveal) {
				return false;
			}
			this.#color = color;
			this.#engine?.setScheme(getColorScheme(color));
			if (this.#container) {
				this.#changeScheme(this.#container, color, toOrigin(origin));
			}
			return true;
		}
		destroy() {
			main_core.Event.unbind(getReducedMotionQuery(), 'change', this.#handleMotionChange);
			this.#dropEffect();
			this.#stopReveal();
			if (this.#container) {
				main_core.Dom.remove(this.#container);
				this.#container = null;
				this.#scheme = null;
			}
		}
		#syncEffect() {
			const factory = EFFECTS[this.#effect];
			if (!this.#container || !factory || prefersReducedMotion$1()) {
				this.#dropEffect();
				return;
			}
			if (this.#engine) {
				return;
			}
			const engine = new BackdropEngine({
				host: this.#container,
				canvasClass: LAYER_CLASS,
				effect: factory(getColorScheme(this.#color)),
				onContextLost: this.#handleContextLost
			});
			this.#engine = engine;
			if (!engine.start()) {
				this.#dropEffect();
			}
		}
		#dropEffect() {
			this.#engine?.destroy();
			this.#engine = null;
		}
		#changeScheme(container, color, origin) {
			const previous = this.#scheme;
			const node = this.#renderScheme(color);
			this.#scheme = node;
			if (prefersReducedMotion$1() || this.#engine) {
				this.#stackScheme(container, node);
				main_core.Dom.remove(previous);
				return;
			}
			this.#revealScheme(container, node, previous, origin);
		}
		#stackScheme(container, node) {
			const canvas = container.querySelector(':scope > canvas');
			if (canvas) {
				main_core.Dom.insertBefore(node, canvas);
				return;
			}
			main_core.Dom.append(node, container);
		}
		#revealScheme(container, node, previous, origin) {
			const from = toCircle(0, origin);
			const to = toCircle(REVEAL_RADIUS, origin);
			main_core.Dom.style(node, 'clipPath', from);
			this.#stackScheme(container, node);
			const reveal = node.animate([{
				clipPath: from
			}, {
				clipPath: to
			}], {
				duration: REVEAL_DURATION,
				easing: REVEAL_EASING,
				fill: 'forwards'
			});
			const settle = () => this.#settle(node, previous);
			this.#reveal = reveal;
			reveal.onfinish = settle;
			this.#settleTimer = setTimeout(settle, REVEAL_DURATION + SETTLE_DELAY);
		}
		#settle(node, previous) {
			if (!this.#reveal) {
				return;
			}
			this.#stopReveal();
			main_core.Dom.style(node, 'clipPath', null);
			main_core.Dom.remove(previous);
		}
		#stopReveal() {
			if (this.#settleTimer !== null) {
				clearTimeout(this.#settleTimer);
				this.#settleTimer = null;
			}
			this.#reveal?.cancel();
			this.#reveal = null;
		}
		#renderContainer() {
			const container = main_core.Tag.render`
			<div class="${BLOCK_CLASS$6}" aria-hidden="true" data-testid="announce-dialog-backdrop"></div>
		`;
			this.#scheme = this.#renderScheme(this.#color);
			main_core.Dom.append(this.#scheme, container);
			return container;
		}
		#renderScheme(color) {
			const scheme = getColorScheme(color);
			const node = main_core.Tag.render`
			<div class="${BLOCK_CLASS$6}__scheme" data-color="${color}"></div>
		`;
			main_core.Dom.style(node, BackdropVariable.Base, scheme.base);
			main_core.Dom.style(node, BackdropVariable.Glow, scheme.glow);
			main_core.Dom.append(this.#renderLayer('base', toBaseFill(scheme)), node);
			BackdropGeometry.glow.forEach(spot => {
				main_core.Dom.append(this.#renderLayer('glow', toGlowFill(spot), GLOW_CLASS), node);
			});
			main_core.Dom.append(this.#renderLayer('vignette', toVignetteFill()), node);
			return node;
		}
		#renderLayer(part, fill, modifier = '') {
			const classes = [LAYER_CLASS, modifier].filter(Boolean).join(' ');
			const layer = main_core.Tag.render`
			<div class="${classes}" data-testid="announce-dialog-backdrop-${part}"></div>
		`;
			main_core.Dom.style(layer, 'background', fill);
			return layer;
		}
		#handleMotionChange = () => {
			this.#syncEffect();
		};
		#handleContextLost = () => {
			this.#dropEffect();
		};
	}

	const BLOCK_CLASS$5 = 'ui-system-whats-new-bleed';
	const renderBleed = content => {
		return main_core.Tag.render`
		<div class="${BLOCK_CLASS$5}" aria-hidden="true" data-testid="announce-dialog-bleed">${content}</div>
	`;
	};

	const BLOCK_CLASS$4 = 'ui-system-whats-new-scene';
	const SceneVariant = Object.freeze({
		Card: 'card',
		Reserve: 'reserve',
		Art: 'art'
	});
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
		Clearance: '--ui-system-whats-new-scene-clearance'
	});
	const DEFAULT_FRAME_ASPECT = 1.4707;
	const DEFAULT_DEPTH = 1;
	const SHIFT_MIN = 3;
	const SHIFT_MAX = 9;
	const SHIFT_DEFAULT = 6;
	const TILT_MAX = 3;
	const PERIOD_MIN = 4;
	const PERIOD_MAX = 17;
	const DELAY_MAX = 2.8;
	const PERIOD_STEP = 0.7;
	const SPARK_GROWTH = 1.35;
	const TRAVEL_BY_PLANE = [4, 9, 14, 24, 26];
	const REACH_X = 1.4;
	const REACH_Y = 2.2;
	const CLEARANCE_OVER_TRAVEL = 8;
	const CLEARANCE = Math.max(...TRAVEL_BY_PLANE) + CLEARANCE_OVER_TRAVEL;
	const POINTER_PRECISION = 4;
	const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';
	const TENTH = 10;
	const round = value => Math.round(value * TENTH) / TENTH;
	const clamp = (value, min, max) => Math.min(Math.max(value, min), max);
	const toNumber = (value, fallback) => main_core.Type.isNumber(value) ? value : fallback;
	const prefersReducedMotion = () => window.matchMedia(REDUCED_MOTION_QUERY).matches;
	const getSceneLayers = content => {
		if (Array.isArray(content)) {
			return content;
		}
		const layers = content.layers;
		return Array.isArray(layers) ? layers : [];
	};
	const getSceneAspect = content => {
		const aspect = toNumber(content.aspect, DEFAULT_FRAME_ASPECT);
		return aspect > 0 ? aspect : DEFAULT_FRAME_ASPECT;
	};
	const toGeometry = layer => {
		if (!main_core.Type.isNumber(layer.left) && !main_core.Type.isNumber(layer.top) && !main_core.Type.isNumber(layer.width)) {
			return null;
		}
		return {
			left: `${toNumber(layer.left, 0)}%`,
			top: `${toNumber(layer.top, 0)}%`,
			width: `${toNumber(layer.width, 100)}%`
		};
	};
	const travelOfPlane = plane => {
		return TRAVEL_BY_PLANE[clamp(plane, 1, TRAVEL_BY_PLANE.length) - 1];
	};
	const applyTravel = (node, plane) => {
		main_core.Dom.style(node, SceneVariable.Travel, `${travelOfPlane(plane)}px`);
	};
	const periodOfIndex = index => {
		const range = (PERIOD_MAX - PERIOD_MIN) * TENTH;
		return PERIOD_MIN + index * PERIOD_STEP * TENTH % range / TENTH;
	};
	const delayOfIndex = index => {
		const range = (DELAY_MAX + PERIOD_STEP) * TENTH;
		return index * PERIOD_STEP * TENTH % range / TENTH;
	};
	const nextPeriod = period => {
		const next = round(period + PERIOD_STEP);
		return next > PERIOD_MAX ? round(PERIOD_MIN + next - PERIOD_MAX) : next;
	};
	const takePeriod = (requested, taken) => {
		let period = round(clamp(requested, PERIOD_MIN, PERIOD_MAX));
		for (let attempt = 0; taken.has(period) && attempt <= taken.size; attempt++) {
			period = nextPeriod(period);
		}
		taken.add(period);
		return period;
	};
	const renderLayer = (layer, index, taken) => {
		const sprite = main_core.Tag.render`
		<img
			class="${BLOCK_CLASS$4}__sprite"
			src="${layer.src}"
			alt=""
			data-testid="announce-dialog-scene-sprite-${index}"
		>
	`;
		main_core.Dom.style(sprite, SceneVariable.Shift, `${clamp(toNumber(layer.shift, SHIFT_DEFAULT), SHIFT_MIN, SHIFT_MAX)}px`);
		main_core.Dom.style(sprite, SceneVariable.Tilt, `${clamp(toNumber(layer.tilt, 0), -TILT_MAX, TILT_MAX)}deg`);
		main_core.Dom.style(sprite, SceneVariable.Period, `${takePeriod(toNumber(layer.period, periodOfIndex(index)), taken)}s`);
		main_core.Dom.style(sprite, SceneVariable.Delay, `${clamp(toNumber(layer.delay, delayOfIndex(index)), 0, DELAY_MAX)}s`);
		if (layer.spark === true) {
			main_core.Dom.style(sprite, SceneVariable.Growth, String(SPARK_GROWTH));
		}
		const geometry = toGeometry(layer);
		const className = geometry === null ? `${BLOCK_CLASS$4}__layer --cover` : `${BLOCK_CLASS$4}__layer`;
		const wrapper = main_core.Tag.render`
		<div class="${className}" data-testid="announce-dialog-scene-layer-${index}">${sprite}</div>
	`;
		const plane = Math.trunc(toNumber(layer.depth, DEFAULT_DEPTH));
		main_core.Dom.style(wrapper, 'zIndex', String(plane));
		applyTravel(wrapper, plane);
		if (geometry !== null) {
			main_core.Dom.style(wrapper, geometry);
		}
		return wrapper;
	};
	class Scene {
		#content;
		#variant;
		#parallax;
		#node = null;
		#followed = null;
		#pointerPlace = null;
		#request = null;
		#tracking = false;
		constructor(options) {
			this.#content = options.content;
			this.#variant = options.variant ?? SceneVariant.Card;
			this.#parallax = options.parallax !== false;
		}
		render() {
			if (!this.#node) {
				this.#node = this.#renderScene();
				this.#track();
			}
			return this.#node;
		}
		setTracking(active) {
			if (active) {
				this.#track();
				return;
			}
			this.#stopTracking();
		}
		destroy() {
			this.#stopTracking();
			this.#node = null;
			this.#followed = null;
		}
		#track() {
			if (this.#tracking || !this.#parallax || !this.#followed || prefersReducedMotion()) {
				return;
			}
			this.#tracking = true;
			main_core.Event.bind(window, 'pointermove', this.#handlePointerMove, {
				passive: true
			});
		}
		#stopTracking() {
			this.#tracking = false;
			main_core.Event.unbind(window, 'pointermove', this.#handlePointerMove);
			if (this.#request !== null) {
				cancelAnimationFrame(this.#request);
				this.#request = null;
			}
		}
		#handlePointerMove = event => {
			this.#pointerPlace = {
				x: event.clientX,
				y: event.clientY
			};
			if (this.#request === null) {
				this.#request = requestAnimationFrame(this.#handleFrame);
			}
		};
		#handleFrame = () => {
			this.#request = null;
			const place = this.#pointerPlace;
			const followed = this.#followed;
			if (!place || !followed || !this.#node) {
				return;
			}
			const box = followed.getBoundingClientRect();
			if (box.width === 0 || box.height === 0) {
				return;
			}
			const x = (place.x - (box.left + box.width / 2)) / (box.width * REACH_X);
			const y = (place.y - (box.top + box.height / 2)) / (box.height * REACH_Y);
			main_core.Dom.style(this.#node, SceneVariable.PointerX, clamp(x * 2, -1, 1).toFixed(POINTER_PRECISION));
			main_core.Dom.style(this.#node, SceneVariable.PointerY, clamp(y * 2, -1, 1).toFixed(POINTER_PRECISION));
		};
		#renderScene() {
			return main_core.Tag.render`
			<div class="${this.#getClassName()}" aria-hidden="true" data-testid="announce-dialog-scene">
				${this.#renderBody()}
			</div>
		`;
		}
		#renderBody() {
			if (this.#variant === SceneVariant.Reserve) {
				return '';
			}
			return this.#renderFrame(getSceneLayers(this.#content));
		}
		#renderFrame(layers) {
			const taken = new Set();
			const frame = main_core.Tag.render`
			<div class="${BLOCK_CLASS$4}__frame" data-testid="announce-dialog-scene-frame">
				${layers.map((layer, index) => renderLayer(layer, index, taken))}
			</div>
		`;
			main_core.Dom.style(frame, SceneVariable.Aspect, String(getSceneAspect(this.#content)));
			main_core.Dom.style(frame, SceneVariable.Clearance, `${CLEARANCE}px`);
			this.#followed = frame;
			return frame;
		}
		#getClassName() {
			return `${BLOCK_CLASS$4} --${this.#variant}`;
		}
	}

	const BLOCK_CLASS$3 = 'ui-system-whats-new-gallery';
	const ACTIVE_CLASS$1 = '--active';
	const EDGE_CONTEXT$1 = '--ui-context-edge-dark';
	const PREVIOUS$1 = -1;
	const NEXT$1 = 1;
	class Gallery {
		#slides;
		#nav;
		#bleed;
		#parallax;
		#controlled;
		#currentSlide;
		#onSlideChange;
		#panel = null;
		#stage = null;
		#slideNodes = [];
		#dotNodes = [];
		#waitingImages = [];
		#waitingScenes = [];
		#scenes = [];
		#slideScenes = [];
		#shown = false;
		#arrowPresses = [];
		constructor(options) {
			this.#slides = options.slides;
			this.#nav = options.nav ?? WhatsNewGalleryNav.Sides;
			this.#bleed = options.bleed === true;
			this.#parallax = options.parallax !== false;
			this.#controlled = main_core.Type.isNumber(options.currentSlide);
			this.#currentSlide = this.#toSlide(options.currentSlide);
			this.#onSlideChange = options.onSlideChange;
		}
		render() {
			this.#panel ??= this.#renderPanel();
			return this.#panel;
		}
		renderStage() {
			this.#stage ??= this.#buildStage();
			return this.#stage;
		}
		setControlled(controlled) {
			this.#controlled = controlled;
		}
		setShown(shown) {
			this.#shown = shown;
			this.#applyTracking();
		}
		setCurrentSlide(slide) {
			this.#currentSlide = this.#toSlide(slide);
			this.#loadAround();
			this.#applyTracking();
			this.#slideNodes.forEach((node, index) => this.#mark(node, index === this.#currentSlide));
			this.#dotNodes.forEach((node, index) => {
				this.#mark(node, index === this.#currentSlide);
				node.setAttribute('aria-current', index === this.#currentSlide ? 'true' : 'false');
			});
		}
		destroy() {
			this.#arrowPresses.forEach(({
				node,
				handler
			}) => main_core.Event.unbind(node, 'click', handler));
			this.#arrowPresses = [];
			this.#panel = null;
			this.#stage = null;
			this.#slideNodes = [];
			this.#dotNodes = [];
			this.#waitingImages = [];
			this.#waitingScenes = [];
			this.#scenes.forEach(scene => scene.destroy());
			this.#scenes = [];
			this.#slideScenes = [];
		}
		#renderPanel() {
			const viewport = main_core.Tag.render`
			<div class="${BLOCK_CLASS$3}__viewport">
				${this.#bleed ? this.#renderReserve() : this.renderStage()}
				${this.#renderArrows()}
			</div>
		`;
			return main_core.Tag.render`
			<div class="${this.#getClassName()}" data-testid="announce-dialog-gallery">
				${viewport}
				${this.#renderDots()}
			</div>
		`;
		}
		#buildStage() {
			this.#waitingImages = this.#slides.map(() => null);
			this.#slideScenes = this.#slides.map(() => null);
			this.#slideNodes = this.#slides.map((slide, index) => this.#renderSlide(slide, index));
			this.#loadAround();
			return main_core.Tag.render`
			<div class="${BLOCK_CLASS$3}__stage" aria-hidden="true" data-testid="announce-dialog-gallery-stage">
				${this.#slideNodes}
			</div>
		`;
		}
		#loadAround() {
			const total = this.#slides.length;
			if (total === 0) {
				return;
			}
			const wanted = new Set([this.#currentSlide, (this.#currentSlide + total + PREVIOUS$1) % total, (this.#currentSlide + total + NEXT$1) % total]);
			wanted.forEach(index => {
				const picture = this.#waitingImages[index];
				if (picture) {
					this.#waitingImages[index] = null;
					picture.node.src = picture.src;
				}
				const composition = this.#waitingScenes[index];
				if (composition) {
					this.#waitingScenes[index] = null;
					this.#scenes.push(composition.scene);
					main_core.Dom.append(composition.scene.render(), composition.slide);
					composition.scene.setTracking(this.#shown && index === this.#currentSlide);
				}
			});
		}
		#renderReserve() {
			return main_core.Tag.render`
			<div class="${BLOCK_CLASS$3}__stage" data-testid="announce-dialog-gallery-reserve"></div>
		`;
		}
		#renderSlide(slide, index) {
			const isScene = !main_core.Type.isDomNode(slide) && 'scene' in slide;
			const content = this.#renderSlideContent(slide, index, isScene);
			const node = main_core.Tag.render`
			<div class="${BLOCK_CLASS$3}__slide" data-testid="announce-dialog-gallery-slide-${index}">
				${content}
			</div>
		`;
			if (isScene) {
				const scene = new Scene({
					content: slide.scene,
					variant: SceneVariant.Art,
					parallax: this.#parallax
				});
				this.#waitingScenes[index] = {
					scene,
					slide: node
				};
				this.#slideScenes[index] = scene;
			}
			this.#mark(node, index === this.#currentSlide);
			return node;
		}
		#renderSlideContent(slide, index, isScene) {
			if (main_core.Type.isDomNode(slide)) {
				return slide;
			}
			return isScene ? '' : this.#renderSlideImage(slide, index);
		}
		#renderSlideImage(slide, index) {
			const node = main_core.Tag.render`
			<img
				class="${BLOCK_CLASS$3}__slide-image"
				alt=""
				data-testid="announce-dialog-gallery-slide-image-${index}"
			>
		`;
			this.#waitingImages[index] = {
				node,
				src: slide.src
			};
			return node;
		}
		#hasControls() {
			return this.#slides.length > 1;
		}
		#renderArrows() {
			return this.#hasControls() ? [this.#renderArrow(PREVIOUS$1), this.#renderArrow(NEXT$1)] : '';
		}
		#renderArrow(step) {
			const isPrevious = step === PREVIOUS$1;
			const side = isPrevious ? '--prev' : '--next';
			const testId = `announce-dialog-gallery-${isPrevious ? 'prev' : 'next'}`;
			const label = main_core.Loc.getMessage(isPrevious ? 'UI_SYSTEM_WHATS_NEW_GALLERY_PREV_ARIA' : 'UI_SYSTEM_WHATS_NEW_GALLERY_NEXT_ARIA') ?? '';
			const button = new ui_buttons.Button({
				useAirDesign: true,
				style: ui_buttons.AirButtonStyle.OUTLINE,
				size: ui_buttons.ButtonSize.MEDIUM,
				collapsedIcon: isPrevious ? ui_buttons.ButtonIcon.CHEVRON_LEFT_S : ui_buttons.ButtonIcon.CHEVRON_RIGHT_S,
				props: {
					'aria-label': label
				}
			}).render();
			const handler = () => this.#move(step);
			main_core.Event.bind(button, 'click', handler);
			this.#arrowPresses.push({
				node: button,
				handler
			});
			return main_core.Tag.render`
			<span
				class="${BLOCK_CLASS$3}__arrow ${side} ${EDGE_CONTEXT$1}"
				data-testid="${testId}"
			>${button}</span>
		`;
		}
		#renderDots() {
			if (!this.#hasControls()) {
				return '';
			}
			this.#dotNodes = Array.from({
				length: this.#slides.length
			}, (unused, index) => this.#renderDot(index));
			return main_core.Tag.render`
			<div
				class="${BLOCK_CLASS$3}__dots"
				role="group"
				aria-label="${main_core.Loc.getMessage('UI_SYSTEM_WHATS_NEW_SLIDES_ARIA') ?? ''}"
				data-testid="announce-dialog-gallery-dots"
			>
				${this.#dotNodes}
			</div>
		`;
		}
		#renderDot(index) {
			const label = main_core.Loc.getMessage('UI_SYSTEM_WHATS_NEW_SLIDE_ARIA', {
				'#NUMBER#': String(index + 1),
				'#TOTAL#': String(this.#slides.length)
			}) ?? '';
			const node = main_core.Tag.render`
			<button
				type="button"
				class="${BLOCK_CLASS$3}__dot"
				aria-label="${label}"
				data-testid="announce-dialog-gallery-dot-${index}"
				onclick="${() => this.#select(index)}"
			>
				<span class="${BLOCK_CLASS$3}__dot-mark"></span>
			</button>
		`;
			this.#mark(node, index === this.#currentSlide);
			node.setAttribute('aria-current', index === this.#currentSlide ? 'true' : 'false');
			return node;
		}
		#move(step) {
			const total = this.#slides.length;
			this.#select((this.#currentSlide + step + total) % total);
		}
		#select(slide) {
			this.#onSlideChange(slide);
			if (!this.#controlled) {
				this.setCurrentSlide(slide);
			}
		}
		#applyTracking() {
			this.#slideScenes.forEach((scene, index) => {
				scene?.setTracking(this.#shown && index === this.#currentSlide);
			});
		}
		#mark(node, isCurrent) {
			if (isCurrent) {
				main_core.Dom.addClass(node, ACTIVE_CLASS$1);
			} else {
				main_core.Dom.removeClass(node, ACTIVE_CLASS$1);
			}
		}
		#toSlide(value) {
			const total = this.#slides.length;
			if (total === 0) {
				return 0;
			}
			const slide = main_core.Type.isNumber(value) ? Math.trunc(value) : 0;
			return (slide % total + total) % total;
		}
		#getClassName() {
			return [BLOCK_CLASS$3, `--nav-${this.#nav}`].join(' ');
		}
	}

	const BLOCK_CLASS$2 = 'ui-system-whats-new-video';
	const PLAY_ICON_SIZE = 48;
	const FRAME_PERMISSIONS = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
	const renderPoster = poster => {
		const icon = new ui_iconSet_api_core.Icon({
			icon: ui_iconSet_api_core.Outline.PLAY_L,
			size: PLAY_ICON_SIZE,
			color: 'var(--ui-color-base-white-fixed)'
		}).render();
		const picture = main_core.Dom.create('img', {
			props: {
				className: `${BLOCK_CLASS$2}__poster-image`,
				src: poster,
				alt: ''
			}
		});
		return main_core.Tag.render`
		<div class="${BLOCK_CLASS$2}__poster" aria-hidden="true" data-testid="announce-dialog-video-poster">
			${picture}
			<span class="${BLOCK_CLASS$2}__poster-mark">${icon}</span>
		</div>
	`;
	};
	const renderFrame = src => {
		return main_core.Dom.create('iframe', {
			props: {
				className: `${BLOCK_CLASS$2}__frame`,
				src,
				title: main_core.Loc.getMessage('UI_SYSTEM_WHATS_NEW_VIDEO_ARIA') ?? '',
				allowFullscreen: true
			},
			attrs: {
				allow: FRAME_PERMISSIONS
			},
			dataset: {
				testid: 'announce-dialog-video-frame'
			}
		});
	};
	const renderVideo = video => {
		return main_core.Tag.render`
		<div class="${BLOCK_CLASS$2}" data-testid="announce-dialog-video">
			<div class="${BLOCK_CLASS$2}__screen">
				${video.poster === undefined ? '' : renderPoster(video.poster)}
				${renderFrame(video.src)}
			</div>
		</div>
	`;
	};

	const BLOCK_CLASS$1 = 'ui-system-whats-new-step-nav';
	const ACTIVE_CLASS = '--active';
	const PREVIOUS = -1;
	const NEXT = 1;
	const STEP_DOTS_MAX = 3;
	const NUMBER_SIZE = 'xs';
	class StepNav {
		#stepCount;
		#currentStep;
		#onPrev;
		#onNext;
		#onDot;
		#container = null;
		#stepNodes = [];
		#counterNode = null;
		#prevArrow = null;
		#nextArrow = null;
		#arrowPresses = [];
		constructor(options) {
			this.#stepCount = options.stepCount;
			this.#currentStep = options.currentStep;
			this.#onPrev = options.onPrev;
			this.#onNext = options.onNext;
			this.#onDot = options.onDot;
		}
		render() {
			this.#container ??= this.#renderContainer();
			return this.#container;
		}
		setCurrentStep(currentStep) {
			this.#currentStep = currentStep;
			this.#stepNodes.forEach((node, step) => this.#markStep(node, step === currentStep));
			this.#markArrows();
			if (this.#counterNode) {
				this.#counterNode.textContent = this.#getCounterText();
			}
		}
		destroy() {
			this.#arrowPresses.forEach(({
				node,
				handler
			}) => main_core.Event.unbind(node, 'click', handler));
			this.#arrowPresses = [];
			this.#container = null;
			this.#stepNodes = [];
			this.#counterNode = null;
			this.#prevArrow = null;
			this.#nextArrow = null;
		}
		#renderContainer() {
			const container = main_core.Tag.render`
			<div
				class="${BLOCK_CLASS$1}"
				role="group"
				aria-label="${main_core.Loc.getMessage('UI_SYSTEM_WHATS_NEW_STEPS_ARIA') ?? ''}"
				data-testid="announce-dialog-steps"
			>
				${this.#renderArrow(PREVIOUS)}
				${this.#renderSteps()}
				${this.#renderArrow(NEXT)}
			</div>
		`;
			this.#markArrows();
			return container;
		}
		#renderArrow(step) {
			const isPrevious = step === PREVIOUS;
			const label = main_core.Loc.getMessage(isPrevious ? 'UI_SYSTEM_WHATS_NEW_STEP_PREV_ARIA' : 'UI_SYSTEM_WHATS_NEW_STEP_NEXT_ARIA') ?? '';
			const node = new ui_buttons.Button({
				useAirDesign: true,
				style: ui_buttons.AirButtonStyle.PLAIN_NO_ACCENT,
				size: ui_buttons.ButtonSize.SMALL,
				collapsedIcon: isPrevious ? ui_buttons.ButtonIcon.CHEVRON_LEFT_S : ui_buttons.ButtonIcon.CHEVRON_RIGHT_S,
				props: {
					type: 'button',
					'aria-label': label
				},
				dataset: {
					testid: `announce-dialog-step-${isPrevious ? 'prev' : 'next'}`
				}
			}).render();
			const handler = () => isPrevious ? this.#onPrev() : this.#onNext();
			main_core.Event.bind(node, 'click', handler);
			this.#arrowPresses.push({
				node,
				handler
			});
			if (isPrevious) {
				this.#prevArrow = node;
			} else {
				this.#nextArrow = node;
			}
			return node;
		}
		#renderSteps() {
			const content = this.#stepCount > STEP_DOTS_MAX ? this.#renderCounter() : this.#renderStepButtons();
			return main_core.Tag.render`
			<div class="${BLOCK_CLASS$1}__steps" data-testid="announce-dialog-step-row">${content}</div>
		`;
		}
		#renderStepButtons() {
			this.#stepNodes = Array.from({
				length: this.#stepCount
			}, (unused, step) => this.#renderStep(step));
			return this.#stepNodes;
		}
		#renderStep(step) {
			const label = main_core.Loc.getMessage('UI_SYSTEM_WHATS_NEW_STEP_ARIA', {
				'#NUMBER#': String(step + 1),
				'#TOTAL#': String(this.#stepCount)
			}) ?? '';
			const number = ui_system_typography.Text.render(String(step + 1), {
				size: NUMBER_SIZE,
				className: `${BLOCK_CLASS$1}__step-number`
			});
			const node = main_core.Tag.render`
			<button
				type="button"
				class="${BLOCK_CLASS$1}__step"
				aria-label="${label}"
				data-testid="announce-dialog-step-${step}"
				onclick="${() => this.#onDot(step)}"
			>
				<span class="${BLOCK_CLASS$1}__step-mark"></span>${number}
			</button>
		`;
			this.#markStep(node, step === this.#currentStep);
			return node;
		}
		#renderCounter() {
			const node = ui_system_typography.Text.render(this.#getCounterText(), {
				size: NUMBER_SIZE,
				className: `${BLOCK_CLASS$1}__counter`
			});
			node.setAttribute('aria-live', 'polite');
			node.dataset.testid = 'announce-dialog-step-counter';
			this.#counterNode = node;
			return node;
		}
		#getCounterText() {
			return main_core.Loc.getMessage('UI_SYSTEM_WHATS_NEW_STEP_COUNTER', {
				'#NUMBER#': String(this.#currentStep + 1),
				'#TOTAL#': String(this.#stepCount)
			}) ?? '';
		}
		#markArrows() {
			this.#markArrow(this.#prevArrow, this.#currentStep <= 0);
			this.#markArrow(this.#nextArrow, this.#currentStep >= this.#stepCount - 1);
		}
		#markArrow(node, isOff) {
			if (node) {
				main_core.Dom.attr(node, 'disabled', isOff ? true : null);
			}
		}
		#markStep(node, isCurrent) {
			if (isCurrent) {
				main_core.Dom.addClass(node, ACTIVE_CLASS);
			} else {
				main_core.Dom.removeClass(node, ACTIVE_CLASS);
			}
			node.setAttribute('aria-current', isCurrent ? 'step' : 'false');
		}
	}

	const EVENT_NAMESPACE = 'BX.UI.System.WhatsNew';
	const BLOCK_CLASS = 'ui-system-whats-new';
	const SCROLL_LOCK_CLASS = 'ui-system-whats-new__disable-scrolling';
	let scrollLockOwners = 0;
	let scrollLockOffset = 0;
	const SCROLL_LOCK_OFFSET_VARIABLE = '--ui-system-whats-new-scroll-offset';
	const SURFACE_CONTEXT = '--ui-context-content-light';
	const SURFACE_TONE_CLASS = '--tone-vibrant';
	const EDGE_CONTEXT = '--ui-context-edge-dark';
	const ITEM_ICON_SIZE = 24;
	const TITLE_SIZE = 'lg';
	const LARGE_TITLE_SIZE = 'xl';
	const SUBTITLE_SIZE = 'sm';
	const ITEM_TITLE_SIZE = 'md';
	const ITEM_DESCRIPTION_SIZE = 'xs';
	const OVERLAY_BACKGROUND = 'rgba(0, 32, 78, 0.46)';
	const oneOf = (dictionary, value, fallback) => {
		return Object.values(dictionary).includes(value) ? value : fallback;
	};
	const toScene = scene => {
		if (!scene) {
			return null;
		}
		return getSceneLayers(scene).length === 0 ? null : scene;
	};
	const toStepCount = value => {
		return main_core.Type.isNumber(value) && value > 1 ? Math.trunc(value) : 1;
	};
	const toStepIndex = (value, stepCount) => {
		const index = main_core.Type.isNumber(value) ? Math.trunc(value) : 0;
		return Math.min(Math.max(index, 0), stepCount - 1);
	};
	class WhatsNew extends main_core_events.EventEmitter {
		#size;
		#mediaPosition;
		#actionsAlign;
		#stepCount;
		#currentStep;
		#label;
		#title;
		#titleBrand;
		#subtitle;
		#items;
		#scene;
		#video;
		#gallery;
		#galleryNav;
		#currentSlide;
		#parallax;
		#backdropEffect;
		#backdropColor;
		#actions;
		#hasOverlay;
		#disableScrolling;
		#scrollLocked = false;
		#closeByEsc;
		#closeByClickOutside;
		#hasCloseButton;
		#closable = true;
		#popup = null;
		#closeButton = null;
		#destroyed = false;
		#bodyNode = null;
		#listNode = null;
		#actionsNode = null;
		#stepNav = null;
		#videoSlot = null;
		#sceneSlot = null;
		#bleedSlot = null;
		#gallerySlot = null;
		#backdrop = null;
		#closingByApi = false;
		constructor(options = {}) {
			super();
			this.setEventNamespace(EVENT_NAMESPACE);
			this.#size = oneOf(WhatsNewSize, options.size, WhatsNewSize.Md);
			this.#mediaPosition = oneOf(WhatsNewMediaPosition, options.mediaPosition, WhatsNewMediaPosition.Top);
			this.#actionsAlign = oneOf(WhatsNewActionsAlign, options.actionsAlign, WhatsNewActionsAlign.Right);
			this.#stepCount = toStepCount(options.stepCount);
			this.#currentStep = toStepIndex(options.currentStep, this.#stepCount);
			this.#label = options.label ?? '';
			this.#title = options.title ?? '';
			this.#titleBrand = options.titleBrand ?? '';
			this.#subtitle = options.subtitle ?? '';
			this.#items = options.items ?? [];
			this.#scene = toScene(options.scene);
			this.#video = options.video ?? null;
			this.#gallery = options.gallery ?? [];
			this.#galleryNav = oneOf(WhatsNewGalleryNav, options.galleryNav, WhatsNewGalleryNav.Sides);
			this.#currentSlide = main_core.Type.isNumber(options.currentSlide) ? Math.trunc(options.currentSlide) : null;
			this.#parallax = options.parallax !== false;
			this.#backdropEffect = oneOf(WhatsNewBackdrop, options.backdrop, WhatsNewBackdrop.None);
			this.#backdropColor = oneOf(WhatsNewColor, options.backdropColor, WhatsNewColor.DarkBlue);
			this.#actions = options.actions ?? [];
			this.#hasOverlay = options.hasOverlay !== false;
			this.#disableScrolling = options.disableScrolling !== false;
			this.#closeByEsc = options.closeByEsc !== false;
			this.#closeByClickOutside = options.closeByClickOutside !== false;
			this.#hasCloseButton = options.hasCloseButton !== false;
			if (options.events) {
				this.subscribeFromOptions(options.events);
			}
		}
		show() {
			if (this.#destroyed) {
				console.warn(`${EVENT_NAMESPACE}: show() called on a destroyed instance.`);
				return;
			}
			this.#ensurePopup().show();
		}
		hide() {
			if (!this.#popup?.isShown()) {
				return;
			}
			this.#closingByApi = true;
			this.#popup.close();
		}
		destroy() {
			if (this.#destroyed) {
				return;
			}
			this.#destroyed = true;
			this.#closingByApi = true;
			const popup = this.#popup;
			const wasShown = popup?.isShown() === true;
			if (wasShown) {
				this.#handlePopupClose();
			} else {
				this.#forgetContent();
				this.#releaseScrollLock();
				this.#setTracking(false);
			}
			popup?.destroy();
			this.#popup = null;
			this.#stepNav?.destroy();
			this.#stepNav = null;
			this.#videoSlot = null;
			this.#sceneSlot?.destroy();
			this.#sceneSlot = null;
			this.#bleedSlot?.destroy();
			this.#bleedSlot = null;
			this.#gallerySlot?.destroy();
			this.#gallerySlot = null;
			this.#backdrop?.destroy();
			this.#backdrop = null;
			if (wasShown) {
				this.emit('onAfterHide');
			}
			this.unsubscribeAll();
		}
		getPopup() {
			return this.#popup;
		}
		setCurrentStep(currentStep) {
			this.#currentStep = toStepIndex(currentStep, this.#stepCount);
			this.#stepNav?.setCurrentStep(this.#currentStep);
		}
		setCurrentSlide(currentSlide) {
			this.#currentSlide = main_core.Type.isNumber(currentSlide) ? Math.trunc(currentSlide) : null;
			this.#gallerySlot?.setControlled(this.#currentSlide !== null);
			if (this.#currentSlide !== null) {
				this.#gallerySlot?.setCurrentSlide(this.#currentSlide);
			}
		}
		setBackdropColor(color, origin) {
			const requested = oneOf(WhatsNewColor, color, this.#backdropColor);
			if (!this.#ensureBackdrop().setColor(requested, origin)) {
				return;
			}
			this.#backdropColor = requested;
			this.emit('onBackdropColorChange', {
				color: requested
			});
		}
		setItems(items) {
			this.#items = items;
			if (!this.#bodyNode) {
				return;
			}
			const previous = this.#listNode;
			this.#renderList();
			this.#placePart(previous, this.#listNode, this.#actionsNode);
		}
		setActions(actions) {
			this.#actions = actions;
			if (!this.#bodyNode) {
				return;
			}
			const previous = this.#actionsNode;
			this.#renderActions();
			this.#placePart(previous, this.#actionsNode, null);
		}
		setClosable(closable) {
			this.#closable = closable;
			this.#popup?.setClosingByEsc(closable && this.#closeByEsc);
			this.#popup?.setAutoHide(closable && this.#closeByClickOutside);
			if (this.#closeButton) {
				main_core.Dom.attr(this.#closeButton, 'aria-disabled', closable ? null : 'true');
			}
		}
		isClosable() {
			return this.#closable;
		}
		#ensurePopup() {
			this.#popup ??= this.#createPopup();
			return this.#popup;
		}
		#createPopup() {
			return new main_popup.Popup({
				className: this.#getWindowClassName(),
				content: this.#renderContent(),
				closeIcon: false,
				noAllPaddings: true,
				designSystemContext: SURFACE_CONTEXT,
				cacheable: false,
				autoHide: this.#closable && this.#closeByClickOutside,
				closeByEsc: this.#closable && this.#closeByEsc,
				overlay: this.#hasOverlay ? {
					backgroundColor: OVERLAY_BACKGROUND,
					opacity: 100
				} : undefined,
				focusTrap: true,
				ariaLabel: this.#getAriaLabel(),
				events: {
					onShow: () => {
						this.#applyScrollLock();
						this.#setTracking(true);
						this.emit('onShow');
					},
					onAfterShow: () => this.emit('onAfterShow'),
					onClose: () => this.#handlePopupClose(),
					onAfterClose: () => this.emit('onAfterHide')
				}
			});
		}
		#getAriaLabel() {
			if (this.#title !== '') {
				return this.#title;
			}
			if (this.#subtitle !== '') {
				return this.#subtitle;
			}
			return main_core.Loc.getMessage('UI_SYSTEM_WHATS_NEW_DIALOG_ARIA') ?? '';
		}
		#handlePopupClose() {
			this.#forgetContent();
			this.#popup = null;
			this.#releaseScrollLock();
			this.#setTracking(false);
			if (!this.#closingByApi) {
				this.emit('onClose');
			}
			this.#closingByApi = false;
			this.emit('onHide');
		}
		#placePart(current, next, before) {
			const focused = this.#getFocusedContentElement();
			if (current && next) {
				main_core.Dom.replace(current, next);
			} else if (current) {
				main_core.Dom.remove(current);
			} else if (next) {
				if (before) {
					main_core.Dom.insertBefore(next, before);
				} else {
					main_core.Dom.append(next, this.#bodyNode);
				}
			}
			this.#restoreFocus(focused);
		}
		#forgetContent() {
			this.#unbindCloseButton();
			this.#bodyNode = null;
			this.#listNode = null;
			this.#actionsNode = null;
		}
		#getFocusedContentElement() {
			const container = this.#popup?.getContentContainer();
			const active = document.activeElement;
			if (!container || !(active instanceof HTMLElement) || !container.contains(active)) {
				return null;
			}
			return active;
		}
		#restoreFocus(focused) {
			const container = this.#popup?.getContentContainer();
			if (!focused || !container) {
				return;
			}
			if (container.contains(focused)) {
				focused.focus();
				return;
			}
			const testId = focused.dataset.testid;
			if (!testId) {
				return;
			}
			const nodes = container.querySelectorAll('[data-testid]');
			const analogue = [...nodes].find(node => node.dataset.testid === testId);
			analogue?.focus();
		}
		#renderContent() {
			return main_core.Tag.render`
			<div class="${BLOCK_CLASS}__frame">
				<div class="${BLOCK_CLASS}__surface">
					${this.#ensureBackdrop().render()}
					${this.#renderCard()}
				</div>
				${this.#renderBleed()}
			</div>
		`;
		}
		#renderBleed() {
			if (!this.#hasBleed()) {
				return '';
			}
			if (this.#hasGallery()) {
				return renderBleed(this.#ensureGallery().renderStage());
			}
			this.#bleedSlot ??= new Scene({
				content: this.#scene,
				variant: SceneVariant.Art,
				parallax: this.#parallax
			});
			return renderBleed(this.#bleedSlot.render());
		}
		#hasBleed() {
			return this.#hasGallery() || this.#scene !== null;
		}
		#hasGallery() {
			return this.#gallery.length > 0;
		}
		#ensureBackdrop() {
			this.#backdrop ??= new Backdrop({
				color: this.#backdropColor,
				effect: this.#backdropEffect
			});
			return this.#backdrop;
		}
		#renderCard() {
			const zones = this.#mediaPosition === WhatsNewMediaPosition.Right ? [this.#renderBody(), this.#renderMedia()] : [this.#renderMedia(), this.#renderBody()];
			return main_core.Tag.render`
			<div class="${BLOCK_CLASS}__content" data-testid="announce-dialog-root">
				${this.#hasCloseButton ? this.#renderCloseButton() : ''}
				${zones}
			</div>
		`;
		}
		#renderBody() {
			const node = main_core.Tag.render`
			<div class="${BLOCK_CLASS}__body">
				${this.#renderHeader()}
				${this.#renderList()}
				${this.#renderActions()}
			</div>
		`;
			this.#bodyNode = node;
			return node;
		}
		#renderCloseButton() {
			const options = {
				useAirDesign: true,
				style: ui_buttons.Button.AirStyle.PLAIN,
				size: ui_buttons.Button.Size.SMALL,
				icon: ui_iconSet_api_core.Outline.CROSS_L,
				className: `${BLOCK_CLASS}__close ${EDGE_CONTEXT}`,
				props: {
					type: 'button',
					'aria-label': main_core.Loc.getMessage('UI_SYSTEM_WHATS_NEW_CLOSE_ARIA') ?? ''
				},
				dataset: {
					testid: 'announce-dialog-close'
				}
			};
			const button = new ui_buttons.Button(options);
			const node = button.render();
			main_core.Event.bind(node, 'click', this.#handleCloseClick);
			this.#closeButton = node;
			if (!this.#closable) {
				main_core.Dom.attr(node, 'aria-disabled', 'true');
			}
			return node;
		}
		#renderMedia() {
			const content = this.#renderMediaContent();
			if (!content) {
				return '';
			}
			return main_core.Tag.render`
			<div class="${BLOCK_CLASS}__media" data-testid="announce-dialog-media">${content}</div>
		`;
		}
		#renderMediaContent() {
			if (this.#hasGallery()) {
				return this.#ensureGallery().render();
			}
			if (this.#scene) {
				return this.#ensureScene(this.#scene).render();
			}
			return this.#video ? this.#ensureVideo(this.#video) : null;
		}
		#ensureVideo(video) {
			this.#videoSlot ??= renderVideo(video);
			return this.#videoSlot;
		}
		#ensureScene(content) {
			this.#sceneSlot ??= new Scene({
				content,
				variant: SceneVariant.Reserve,
				parallax: this.#parallax
			});
			return this.#sceneSlot;
		}
		#ensureGallery() {
			this.#gallerySlot ??= new Gallery({
				slides: this.#gallery,
				nav: this.#galleryNav,
				bleed: this.#hasBleed(),
				parallax: this.#parallax,
				currentSlide: this.#currentSlide,
				onSlideChange: slide => this.emit('onSlideChange', {
					slide
				})
			});
			return this.#gallerySlot;
		}
		#renderHeader() {
			if (this.#label === '' && this.#title === '' && this.#subtitle === '') {
				return '';
			}
			return main_core.Tag.render`
			<div class="${BLOCK_CLASS}__header" data-testid="announce-dialog-header">
				${this.#renderTitleRow()}
				${this.#renderSubtitle()}
			</div>
		`;
		}
		#renderTitleRow() {
			if (this.#title === '' && this.#label === '') {
				return '';
			}
			return main_core.Tag.render`
			<div class="${BLOCK_CLASS}__title-row">
				${this.#renderTitle()}
				${this.#renderLabel()}
			</div>
		`;
		}
		#renderLabel() {
			if (this.#label === '') {
				return '';
			}
			const chip = new ui_system_chip.Chip({
				text: main_core.Text.encode(this.#label),
				size: ui_system_chip.ChipSize.Xs,
				design: ui_system_chip.ChipDesign.Outline
			});
			const node = chip.render();
			node.removeAttribute('tabindex');
			return main_core.Tag.render`
			<div class="${BLOCK_CLASS}__label" data-testid="announce-dialog-new-label">${node}</div>
		`;
		}
		#renderTitle() {
			if (this.#title === '') {
				return '';
			}
			const node = ui_system_typography.Headline.render(this.#title, {
				size: this.#size === WhatsNewSize.Lg ? LARGE_TITLE_SIZE : TITLE_SIZE,
				accent: true,
				className: `${BLOCK_CLASS}__title`
			});
			node.dataset.testid = 'announce-dialog-title';
			this.#paintBrand(node);
			return node;
		}
		#paintBrand(node) {
			const starts = this.#findBrandStarts();
			if (starts.length === 0) {
				return;
			}
			const length = this.#titleBrand.length;
			let cursor = 0;
			main_core.Dom.clean(node);
			starts.forEach(start => {
				if (start > cursor) {
					node.append(this.#title.slice(cursor, start));
				}
				node.append(this.#renderBrandWord(this.#title.slice(start, start + length)));
				cursor = start + length;
			});
			if (cursor < this.#title.length) {
				node.append(this.#title.slice(cursor));
			}
		}
		#findBrandStarts() {
			const starts = [];
			const length = this.#titleBrand.length;
			if (length === 0) {
				return starts;
			}
			const word = this.#titleBrand.toLowerCase();
			let at = 0;
			while (at + length <= this.#title.length) {
				if (this.#title.slice(at, at + length).toLowerCase() === word) {
					starts.push(at);
					at += length;
				} else {
					at++;
				}
			}
			return starts;
		}
		#renderBrandWord(word) {
			return main_core.Dom.create('span', {
				props: {
					className: `${BLOCK_CLASS}__title-brand`
				},
				text: word
			});
		}
		#renderSubtitle() {
			if (this.#subtitle === '') {
				return '';
			}
			const node = ui_system_typography.Text.render(this.#subtitle, {
				size: SUBTITLE_SIZE,
				className: `${BLOCK_CLASS}__subtitle`
			});
			node.dataset.testid = 'announce-dialog-subtitle';
			return node;
		}
		#renderList() {
			this.#listNode = this.#items.length === 0 ? null : main_core.Tag.render`
				<div class="${BLOCK_CLASS}__list" data-testid="announce-dialog-list">
					${this.#items.map((item, index) => this.#renderItem(item, index))}
				</div>
			`;
			return this.#listNode ?? '';
		}
		#renderItem(item, index) {
			const testId = item.testId ?? `announce-dialog-list-cell-${index}`;
			const iconNode = new ui_iconSet_api_core.Icon({
				icon: item.icon,
				size: ITEM_ICON_SIZE,
				color: 'var(--ui-color-design-filled-content)'
			}).render();
			iconNode.dataset.testid = `${testId}-icon`;
			const iconBox = main_core.Tag.render`
			<span class="${BLOCK_CLASS}__item-icon">${iconNode}</span>
		`;
			const titleNode = ui_system_typography.Text.render(item.title, {
				size: ITEM_TITLE_SIZE,
				accent: item.accent === true,
				className: `${BLOCK_CLASS}__item-title`
			});
			titleNode.dataset.testid = `${testId}-title`;
			const body = main_core.Tag.render`
			<span class="${BLOCK_CLASS}__item-body" data-testid="${testId}-body">
				${titleNode}
				${this.#renderItemDescription(item, testId)}
			</span>
		`;
			if (!item.onClick) {
				return main_core.Tag.render`
				<div class="${BLOCK_CLASS}__item" data-testid="${testId}">${iconBox}${body}</div>
			`;
			}
			return main_core.Tag.render`
			<button
				type="button"
				class="${BLOCK_CLASS}__item --clickable"
				data-testid="${testId}"
				onclick="${() => this.#handleItemClick(item, index)}"
			>${iconBox}${body}</button>
		`;
		}
		#handleItemClick(item, index) {
			item.onClick?.();
			this.emit('onItemClick', {
				index,
				item
			});
		}
		#renderItemDescription(item, testId) {
			if (!item.description) {
				return '';
			}
			const node = ui_system_typography.Text.render(item.description, {
				size: ITEM_DESCRIPTION_SIZE,
				className: `${BLOCK_CLASS}__item-desc`
			});
			node.dataset.testid = `${testId}-desc`;
			return node;
		}
		#renderActions() {
			if (this.#actions.length === 0 && !this.#isWizard()) {
				this.#actionsNode = null;
				return '';
			}
			const alignedLeft = this.#actionsAlign === WhatsNewActionsAlign.Left;
			const shown = this.#isWizard() ? this.#actions.slice(-2) : this.#actions;
			const actions = alignedLeft ? [...shown].reverse() : shown;
			const buttons = main_core.Tag.render`
			<div class="${BLOCK_CLASS}__buttons">${actions.map(action => action.render())}</div>
		`;
			const groups = this.#isWizard() ? alignedLeft ? [buttons, this.#renderStepNav()] : [this.#renderStepNav(), buttons] : [buttons];
			const node = main_core.Tag.render`
			<div
				class="${BLOCK_CLASS}__actions ${EDGE_CONTEXT}"
				data-testid="announce-dialog-actions"
			>${groups}</div>
		`;
			this.#actionsNode = node;
			return node;
		}
		#renderStepNav() {
			this.#stepNav ??= new StepNav({
				stepCount: this.#stepCount,
				currentStep: this.#currentStep,
				onPrev: () => this.#requestStep(this.#currentStep - 1),
				onNext: () => this.#requestStep(this.#currentStep + 1),
				onDot: step => this.#requestStep(step)
			});
			return this.#stepNav.render();
		}
		#requestStep(step) {
			this.emit('onStepChange', {
				step: toStepIndex(step, this.#stepCount)
			});
		}
		#isWizard() {
			return this.#stepCount > 1;
		}
		#handleCloseClick = () => {
			if (!this.#closable) {
				return;
			}
			this.#popup?.close();
		};
		#unbindCloseButton() {
			if (this.#closeButton) {
				main_core.Event.unbind(this.#closeButton, 'click', this.#handleCloseClick);
				this.#closeButton = null;
			}
		}
		#getWindowClassName() {
			const classes = [BLOCK_CLASS, SURFACE_TONE_CLASS, `--size-${this.#size}`, `--media-${this.#mediaPosition}`, `--actions-${this.#actionsAlign}`];
			if (this.#scene || this.#video || this.#hasGallery()) {
				classes.push('--has-media');
			}
			if (this.#hasGallery()) {
				classes.push('--gallery');
			} else if (this.#video && !this.#scene) {
				classes.push('--video');
			}
			if (this.#isWizard()) {
				classes.push('--wizard');
			}
			return classes.join(' ');
		}
		#setTracking(active) {
			this.#sceneSlot?.setTracking(active);
			this.#bleedSlot?.setTracking(active);
			this.#gallerySlot?.setShown(active);
		}
		#applyScrollLock() {
			if (!this.#disableScrolling || this.#scrollLocked) {
				return;
			}
			this.#scrollLocked = true;
			scrollLockOwners += 1;
			if (scrollLockOwners === 1) {
				scrollLockOffset = window.scrollY;
				main_core.Dom.style(document.body, SCROLL_LOCK_OFFSET_VARIABLE, `${scrollLockOffset}px`);
			}
			main_core.Dom.addClass(document.body, SCROLL_LOCK_CLASS);
		}
		#releaseScrollLock() {
			if (!this.#scrollLocked) {
				return;
			}
			this.#scrollLocked = false;
			scrollLockOwners -= 1;
			if (scrollLockOwners > 0) {
				return;
			}
			main_core.Dom.removeClass(document.body, SCROLL_LOCK_CLASS);
			main_core.Dom.style(document.body, SCROLL_LOCK_OFFSET_VARIABLE, null);
			window.scrollTo(0, scrollLockOffset);
			scrollLockOffset = 0;
		}
	}

	exports.WhatsNew = WhatsNew;
	exports.WhatsNewActionsAlign = WhatsNewActionsAlign;
	exports.WhatsNewBackdrop = WhatsNewBackdrop;
	exports.WhatsNewColor = WhatsNewColor;
	exports.WhatsNewGalleryNav = WhatsNewGalleryNav;
	exports.WhatsNewMediaPosition = WhatsNewMediaPosition;
	exports.WhatsNewSize = WhatsNewSize;

})(this.BX.UI.System.WhatsNew = this.BX.UI.System.WhatsNew || {}, BX, BX.Event, BX.Main, BX.UI.IconSet, window, BX.UI, BX.UI.System.Chip, BX.UI.System.Typography);
//# sourceMappingURL=whats-new.bundle.js.map
