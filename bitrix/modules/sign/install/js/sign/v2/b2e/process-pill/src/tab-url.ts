/**
 * Root of the pages of the KEDO section. Every surface of the section lives under it, so the tab of the
 * processes is found from whichever of them the pill was mounted on.
 */
const SECTION_ROOT = 'b2e/';

/**
 * Page of the tab of the processes as the section addresses it - route `b2e_processes` of `sign.start`.
 */
const PROCESSES_TAB = 'processes/';

/**
 * The tab of the processes next to the page the pill stands on. A page outside the section is answered
 * with nothing: a root the officer is not standing in would take them somewhere else entirely.
 */
export function resolveProcessesTabUrl(pathname: string): string | null
{
	const rootAt = pathname.indexOf(SECTION_ROOT);

	return rootAt === -1 ? null : `${pathname.slice(0, rootAt + SECTION_ROOT.length)}${PROCESSES_TAB}`;
}
