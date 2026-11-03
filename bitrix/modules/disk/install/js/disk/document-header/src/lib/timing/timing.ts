import { sendData } from 'ui.analytics';

/**
 * The time from the start of the page to the moment the actions of the header become available. It is
 * the figure the requirement about no slowdown is checked against, so the same point is measured on
 * every surface the header reaches.
 *
 * The count starts at the start of the page and not at the first line of the header: the graph of the
 * extensions the header lives in is loaded before that line runs at all, and that wait is exactly what
 * the figure is kept for. No collector of its own is introduced: the value goes where the module
 * already sends its client-side metrics.
 *
 * Every opening is measured, with no sampling and no switch of its own. A regress shows itself in the
 * tail of the distribution, which is the first thing a sample loses, and one event per opening of a
 * document stays within the order of the product events this channel already carries.
 */
export function reportTimeToActions(objectType: string): number
{
	const elapsed = Math.round(performance.now());

	sendData({
		tool: 'docs',
		category: 'docs',
		event: 'header_time_to_actions',
		type: `objectType_${objectType}`,
		p1: `ms_${elapsed}`,
	});

	return elapsed;
}
