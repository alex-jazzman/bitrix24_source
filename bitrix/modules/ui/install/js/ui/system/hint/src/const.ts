// Size of the "?" glyph. The pixel scale behind every value lives in the stylesheet of the extension: the
// outline glyph and the filled one are drawn differently and are given a scale of their own each.
export const HintSize = Object.freeze({
	Md: 'md',
	Lg: 'lg',
	Xl: 'xl',
});

export type HintSize = typeof HintSize[keyof typeof HintSize];

// What raises the bubble. One mode and not a set, unlike the trigger layer of the tooltip underneath: the
// keyboard focus is no choice of the place of use and comes with either of the two, so that a bubble reached
// by the cursor is reached by the tab key as well. What each mode turns into is written in hint.ts.
export const HintTrigger = Object.freeze({
	Hover: 'hover',
	Click: 'click',
});

export type HintTrigger = typeof HintTrigger[keyof typeof HintTrigger];

// What a hint falls back to where nothing names anything. Read from here by both surfaces - the class and the
// Vue wrapper, whose props carry the very same defaults - so that the two never drift apart.
export const DEFAULT_SIZE: HintSize = HintSize.Md;

export const DEFAULT_TRIGGER: HintTrigger = HintTrigger.Hover;
