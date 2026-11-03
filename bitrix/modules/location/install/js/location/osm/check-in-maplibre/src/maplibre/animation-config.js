// Single "motion language" for all camera moves. Tune here, not in logic.
//
// All camera commands in the MapLibre engine are animated for parity with the
// product NFR ("all camera moves are animated"). Durations/easing live here so
// the whole engine speaks one consistent motion language.
export const ANIMATION_CONFIG = {
	easeTo: { duration: 600, easing: (t) => t * (2 - t) }, // ease-out
	flyTo: { duration: 900, curve: 1.42, speed: 1.2 },
	fitBounds: { duration: 700, padding: { top: 36, left: 96, bottom: 36, right: 150 } },
	// Grow-segment: a line layer "drawing on" a freshly appended leg (setLayerPath animated). Shares
	// the ease-out feel and timing of easeTo, but is its own entry so the two can be tuned apart.
	growSegment: { duration: 600 },
	selfZoom: 15,
};

export default ANIMATION_CONFIG;
