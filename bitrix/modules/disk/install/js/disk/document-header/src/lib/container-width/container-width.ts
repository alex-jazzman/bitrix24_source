import { Type } from 'main.core';

/**
 * Adaptation of the header to the width it actually got. The header lives on a full page and inside
 * a slider alike, so the only honest measure is its own container - never the window.
 *
 * Captions of the buttons go first and everything else only after them: the header gives up
 * information in that order and never lets a horizontal scrollbar appear instead.
 *
 * What it never gives up is a control. Down to 320px the words next to the icons go - the caption of
 * the transition to editing and the name of the portal mark - while every button stays where it is and
 * keeps the name it is addressed by.
 */

export const HeaderWidthLevel = Object.freeze({
	Full: 'full',
	IconsOnly: 'iconsOnly',
	Essential: 'essential',
} as const);

export type HeaderWidthLevelValue = typeof HeaderWidthLevel[keyof typeof HeaderWidthLevel];

export type WidthAdaptation = {
	level: HeaderWidthLevelValue,
	showButtonCaptions: boolean,
	/** The caption of the primary action; its icon and its accessible name stay at every width. */
	showEditCaption: boolean,
	/** The word of the portal mark; the mark itself and its accessible name stay at every width. */
	showLogoName: boolean,
};

/** Captions fit while the container is wider than this; 960 is the narrow layout of the mockups. */
export const CaptionsFitWidth = 960;

/** Below this width the words standing next to the icons have to go as well. */
export const IconWordsFitWidth = 640;

export function resolveAdaptation(containerWidth: number): WidthAdaptation
{
	const width = Type.isNumber(containerWidth) && containerWidth > 0
		// a container which is not measured yet hides nothing: the real width arrives right after
		? containerWidth
		: Number.POSITIVE_INFINITY
	;

	const showButtonCaptions = width > CaptionsFitWidth;
	// the tightest container is the one where the words next to the icons stop fitting
	const showIconWords = width > IconWordsFitWidth;

	return {
		level: resolveLevel(showButtonCaptions, showIconWords),
		showButtonCaptions,
		showEditCaption: showIconWords,
		showLogoName: showIconWords,
	};
}

/**
 * Reports the adaptation of the container at once and then on every change of the level. Returns the
 * function which stops the observation.
 */
export function observeContainerWidth(
	container: HTMLElement,
	listener: (adaptation: WidthAdaptation) => void,
): () => void
{
	let currentLevel: HeaderWidthLevelValue | null = null;

	const publish = (width: number): void => {
		const adaptation = resolveAdaptation(width);
		if (adaptation.level === currentLevel)
		{
			return;
		}

		currentLevel = adaptation.level;
		listener(adaptation);
	};

	const observer = new ResizeObserver((entries: ResizeObserverEntry[]) => {
		entries.forEach((entry: ResizeObserverEntry) => publish(entry.contentRect.width));
	});

	observer.observe(container);
	publish(container.getBoundingClientRect().width);

	return () => observer.disconnect();
}

function resolveLevel(showButtonCaptions: boolean, showIconWords: boolean): HeaderWidthLevelValue
{
	if (showButtonCaptions)
	{
		return HeaderWidthLevel.Full;
	}

	return showIconWords ? HeaderWidthLevel.IconsOnly : HeaderWidthLevel.Essential;
}
