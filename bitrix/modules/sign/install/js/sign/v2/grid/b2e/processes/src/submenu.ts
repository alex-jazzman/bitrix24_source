import { Loc, Tag } from 'main.core';

import { type ProcessCatalog, type ProcessEntry, type RunProcessMenuOptions, type SubmenuItem } from './type';

/**
 * The submenu is not elastic: the rest of the processes is reached by the link to the grid of the
 * section, and the order inside it is the alphabet - neither a counter of the launches nor a setting
 * of the order is kept anywhere (Q-1).
 */
export const SUBMENU_PROCESS_LIMIT = 5;

export const SubmenuItemId = Object.freeze({
	Empty: 'sign-b2e-run-process-empty',
	Delimiter: 'sign-b2e-run-process-delimiter',
	AllProcesses: 'sign-b2e-run-process-all',
	CreateProcess: 'sign-b2e-run-process-create',
});

export function getProcessItemId(processId: number): string
{
	return `sign-b2e-run-process-${processId}`;
}

/**
 * Composition of the submenu out of one answer of the catalog: the same answer carries the right to
 * create a process, so the empty state costs no second request.
 */
export function buildSubmenuItems<Process extends ProcessEntry>(
	response: ProcessCatalog<Process>,
	options: RunProcessMenuOptions,
	onProcessSelect: (process: Process) => void,
	onAllProcessesSelect: () => void,
): SubmenuItem[]
{
	const processes = [...response.processes]
		.sort((first, second) => first.name.localeCompare(second.name))
		.slice(0, SUBMENU_PROCESS_LIMIT)
	;

	const actions: SubmenuItem[] = [];
	// the grid shows the very same set, so an empty submenu has nothing to open it for
	if (processes.length > 0 && options.allProcessesUrl !== '')
	{
		actions.push(buildAllProcessesItem(onAllProcessesSelect));
	}

	// the right to create is not the right to start, and one never follows from the other (AC-013)
	if (response.canCreateProcess && options.createProcessUrl !== '')
	{
		actions.push(buildCreateProcessItem(options.createProcessUrl));
	}

	const head = processes.length > 0
		? processes.map((process) => buildProcessItem(process, onProcessSelect))
		: [buildEmptyItem()]
	;

	return actions.length > 0 ? [...head, buildDelimiter(), ...actions] : head;
}

function buildProcessItem<Process extends ProcessEntry>(
	process: Process,
	onProcessSelect: (process: Process) => void,
): SubmenuItem
{
	// the name comes from the portal as it was typed, and "text" is encoded by the menu item itself
	return {
		id: getProcessItemId(process.id),
		text: process.name,
		onclick: () => onProcessSelect(process),
	};
}

function buildEmptyItem(): SubmenuItem
{
	// the item leads nowhere, and still it is a menu item: `main.popup` hides an unfocusable one behind
	// aria-hidden, and the explanation is then the only thing the submenu has to say
	return {
		id: SubmenuItemId.Empty,
		className: 'menu-popup-no-icon sign-b2e-run-process-menu__item --empty',
		html: Tag.render`
			<span class="sign-b2e-run-process-menu__empty">
				${Loc.getMessage('SIGN_B2E_RUN_PROCESS_MENU_EMPTY')}
			</span>
		`,
	};
}

function buildDelimiter(): SubmenuItem
{
	return {
		id: SubmenuItemId.Delimiter,
		delimiter: true,
	};
}

function buildAllProcessesItem(onAllProcessesSelect: () => void): SubmenuItem
{
	return {
		id: SubmenuItemId.AllProcesses,
		text: Loc.getMessage('SIGN_B2E_RUN_PROCESS_MENU_ALL_PROCESSES') ?? '',
		onclick: onAllProcessesSelect,
	};
}

function buildCreateProcessItem(createProcessUrl: string): SubmenuItem
{
	return {
		id: SubmenuItemId.CreateProcess,
		text: Loc.getMessage('SIGN_B2E_RUN_PROCESS_MENU_CREATE_PROCESS') ?? '',
		href: createProcessUrl,
	};
}
