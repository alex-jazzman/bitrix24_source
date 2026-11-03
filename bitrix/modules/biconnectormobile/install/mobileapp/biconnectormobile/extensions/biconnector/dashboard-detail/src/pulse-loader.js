/**
 * @module biconnector/dashboard-detail/src/pulse-loader
 */
jn.define('biconnector/dashboard-detail/src/pulse-loader', (require, exports, module) => {
	const { Color } = require('tokens');
	const { hexToRgb } = require('utils/color');

	// Frames of the composition, at FRAME_RATE per second. A circle travels from the centre of the canvas
	// to its edge over RING_LIFETIME and the next one sets off RING_INTERVAL later, so several circles are
	// on their way out at any moment. The composition lasts exactly as long as the last circle needs: at
	// the loop point every circle has faded out, and the play starts over without a jump.
	const FRAME_RATE = 60;
	const RING_LIFETIME = 90;
	const RING_INTERVAL = 18;
	const RING_COUNT = 4;

	// Percent of its own size, the units the scale of a Lottie layer is in: a circle enters as a dot in
	// the centre and leaves at the edge of the canvas.
	const RING_START_SCALE = 20;
	const RING_END_SCALE = 100;

	// The canvas the animation is described in. It is drawn into whatever size the caller asks for - Lottie
	// scales the composition - so these are the proportions of the drawing and not pixels on a screen: the
	// circle keeps half a stroke of air at the edge of the canvas at its widest.
	const CANVAS_SIZE = 64;
	const RING_DIAMETER = 60;
	const RING_STROKE_WIDTH = 4;

	const DEFAULT_SIZE = 64;

	/**
	 * The color of a Lottie shape is a quadruple of channels of its own, each from 0 to 1, so a token of
	 * the design system is converted rather than passed on.
	 * Pure.
	 *
	 * @param {Color} color
	 * @returns {number[]}
	 */
	const toLottieColor = (color) => [...hexToRgb(color.toHex()).map((channel) => channel / 255), 1];

	/**
	 * One circle of the animation: it grows from the centre and fades out as it goes, and it starts as
	 * late as its place in the queue says.
	 * Pure.
	 *
	 * @param {number} index
	 * @param {number[]} lottieColor
	 * @returns {object}
	 */
	const buildRing = (index, lottieColor) => {
		const start = index * RING_INTERVAL;
		const end = start + RING_LIFETIME;

		return {
			ddd: 0,
			ind: index + 1,
			ty: 4,
			nm: `ring-${index + 1}`,
			sr: 1,
			ks: {
				o: {
					a: 1,
					k: [
						{ i: { x: [0.4], y: [1] }, o: { x: [0.6], y: [0] }, t: start, s: [100] },
						{ t: end, s: [0] },
					],
					ix: 11,
				},
				r: { a: 0, k: 0, ix: 10 },
				p: { a: 0, k: [CANVAS_SIZE / 2, CANVAS_SIZE / 2, 0], ix: 2, l: 2 },
				a: { a: 0, k: [0, 0, 0], ix: 1, l: 2 },
				s: {
					a: 1,
					k: [
						{
							i: { x: [0.2, 0.2, 0.2], y: [1, 1, 1] },
							o: { x: [0.6, 0.6, 0.6], y: [0, 0, 0] },
							t: start,
							s: [RING_START_SCALE, RING_START_SCALE, 100],
						},
						{ t: end, s: [RING_END_SCALE, RING_END_SCALE, 100] },
					],
					ix: 6,
					l: 2,
				},
			},
			ao: 0,
			shapes: [
				{
					ty: 'gr',
					it: [
						{
							d: 1,
							ty: 'el',
							s: { a: 0, k: [RING_DIAMETER, RING_DIAMETER], ix: 2 },
							p: { a: 0, k: [0, 0], ix: 3 },
							nm: 'ellipse',
							hd: false,
						},
						{
							ty: 'st',
							c: { a: 0, k: lottieColor, ix: 3 },
							o: { a: 0, k: 100, ix: 4 },
							w: { a: 0, k: RING_STROKE_WIDTH, ix: 5 },
							lc: 1,
							lj: 1,
							ml: 4,
							bm: 0,
							nm: 'stroke',
							hd: false,
						},
						{
							ty: 'tr',
							p: { a: 0, k: [0, 0], ix: 2 },
							a: { a: 0, k: [0, 0], ix: 1 },
							s: { a: 0, k: [100, 100], ix: 3 },
							r: { a: 0, k: 0, ix: 6 },
							o: { a: 0, k: 100, ix: 7 },
							sk: { a: 0, k: 0, ix: 4 },
							sa: { a: 0, k: 0, ix: 5 },
							nm: 'transform',
						},
					],
					nm: 'ring',
					np: 2,
					cix: 2,
					bm: 0,
					ix: 1,
					hd: false,
				},
			],
			ip: start,
			op: end,
			st: start,
			bm: 0,
		};
	};

	/**
	 * The animation itself, as a Lottie composition. It is built here instead of being carried as a ready
	 * file because the color of the circles is a token of the design system: a baked animation would keep
	 * the color of the theme it was exported in.
	 * Pure.
	 *
	 * @param {Color} color
	 * @returns {object}
	 */
	const buildPulseAnimation = (color) => {
		const lottieColor = toLottieColor(color);

		return {
			nm: 'pulse',
			v: '5.9.6',
			fr: FRAME_RATE,
			ip: 0,
			op: RING_LIFETIME + (RING_INTERVAL * (RING_COUNT - 1)),
			w: CANVAS_SIZE,
			h: CANVAS_SIZE,
			ddd: 0,
			assets: [],
			markers: [],
			layers: Array.from({ length: RING_COUNT }, (_, index) => buildRing(index, lottieColor)),
		};
	};

	/**
	 * The loader of the waiting states of the section: circles leaving the centre one after another, as
	 * the mockup draws it. The design system carries a spinner and no loader of this shape, so the
	 * animation is described here and played by Lottie - the same way the spinner of the core is
	 * (layout/ui/loaders/spinner).
	 *
	 * @param {object} [props]
	 * @param {number} [props.size]
	 * @param {Color} [props.color]
	 * @param {string} [props.testId]
	 * @returns {?LottieView}
	 */
	function PulseLoader(props = {})
	{
		const {
			size = DEFAULT_SIZE,
			color = Color.accentMainPrimary,
			testId = 'pulse-loader',
		} = props;

		// A runtime of the application without Lottie draws no loader rather than an empty box, which is
		// what the spinner of the core does as well.
		if (!LottieView)
		{
			return null;
		}

		return LottieView({
			testId,
			style: {
				width: size,
				height: size,
			},
			data: {
				content: JSON.stringify(buildPulseAnimation(color)),
			},
			params: {
				loopMode: 'loop',
			},
			autoPlay: true,
		});
	}

	module.exports = { PulseLoader, buildPulseAnimation };
});
