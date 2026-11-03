// A cosine is a sine a quarter of a turn ahead: the waves of the drift below are written as one kind.
const QUARTER_TURN = Math.PI / 2;

/**
 * Geometry of the composition of the backdrop, in shares of the card. It is declared here once and once
 * only: the static layers of the styles and the brush of the moving effects paint the very same spots, so
 * that switching the effect brings the composition to life without changing it. The declaration stands in a
 * module of its own and not beside the one that renders the layers - the brush reads it too, and an effect
 * reads the brush.
 *
 * A share of a radius is read the way the styles read it - as a share of its own side of the card - so the
 * spots and the vignette are ellipses, and the brush of the canvas draws them as such.
 */
export const BackdropGeometry = Object.freeze({
	glow: [
		{
			x: 0.3,
			y: 0.32,
			radius: 0.5,
			/*
			 * The wandering of the spot around its place, one wave per axis, and the only thing that ever
			 * moves it. `pace` is the milliseconds a radian of the wave takes and `phase` where the wave
			 * starts, so the four waves of the two spots never come back to the same figure. The pointer is
			 * not among the movers: a light spot of the composition stands where it stands whatever the
			 * cursor does, and the answer of the backdrop to the cursor belongs to the effect drawn over it.
			 * The static composition stands at the place itself, and a brush asked for the composition at
			 * rest gives that very picture.
			 */
			drift: {
				x: { pace: 9000, phase: 0, amplitude: 0.06 },
				y: { pace: 7000, phase: QUARTER_TURN, amplitude: 0.05 },
			},
		},
		{
			x: 0.74,
			y: 0.72,
			radius: 0.52,
			drift: {
				x: { pace: 11000, phase: QUARTER_TURN, amplitude: 0.05 },
				y: { pace: 13000, phase: 0, amplitude: 0.06 },
			},
		},
	],
	// The card is clear of the vignette up to `clearUntil` of the radius, and from there the vignette goes
	// into the base of the scheme.
	vignette: { x: 0.5, y: 0.32, radius: 0.95, clearUntil: 0.62 },
});

// One spot of the glow of the composition.
export type BackdropGlowSpot = typeof BackdropGeometry.glow[number];
