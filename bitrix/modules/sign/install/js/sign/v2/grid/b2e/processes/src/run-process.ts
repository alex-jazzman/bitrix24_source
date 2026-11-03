import { Runtime } from 'main.core';

import { type ProcessEntry } from './type';

const RUN_PROCESS_EXTENSION = 'sign.v2.b2e.run-process';

/**
 * Root of the pages of the KEDO section. Every surface of the section lives under it, so the tab of the
 * processes is found from whichever of them the launch was started on.
 */
const SECTION_ROOT = 'b2e/';

/**
 * Page of the tab of the processes as the section addresses it - route `b2e_processes`.
 */
const PROCESSES_TAB = 'processes/';

/**
 * Public point of the launch slider (TPL-10). The process it opens on comes from the outside, so both
 * surfaces of the choice - the submenu of the create button and the grid of the section - reach the very
 * same screen (AC-002b).
 */
type RunProcessExports = {
	RunProcess: {
		open: (process: ProcessEntry, options: { onLaunched: () => void }) => void,
	},
};

/**
 * The row travels to the slider untouched: what a surface read out of the catalog is what the slider
 * starts on. The type names only the fields this extension itself reads - the full row is DTO-01 and
 * belongs to `sign.v2.api`.
 */
export async function openRunProcess(process: ProcessEntry): Promise<void>
{
	const { RunProcess } = await Runtime.loadExtension(RUN_PROCESS_EXTENSION) as unknown as RunProcessExports;
	RunProcess.open(process, { onLaunched: () => goToProcessesTab() });
}

/**
 * A launch that happened confirms itself on the tab of the processes and not on the kanban the officer
 * came from (AC-005). The address is taken from the page the launch was started on: the launch slider may
 * stand over a slider of the catalog, so the walk goes from the top window and not from this frame.
 */
function goToProcessesTab(): void
{
	const topWindow = top ?? window;
	const url = readProcessesTabUrl(topWindow.location.pathname);
	if (url === null)
	{
		return;
	}

	topWindow.location.href = url;
}

/**
 * The tab of the processes next to the surface the launch was started on. A page outside the section is
 * answered with nothing: guessing a root the officer is not standing in would take them somewhere else
 * entirely.
 */
function readProcessesTabUrl(pathname: string): string | null
{
	const rootEnd = pathname.indexOf(SECTION_ROOT);

	return rootEnd === -1 ? null : `${pathname.slice(0, rootEnd + SECTION_ROOT.length)}${PROCESSES_TAB}`;
}
