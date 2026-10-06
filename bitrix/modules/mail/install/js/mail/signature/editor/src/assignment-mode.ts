import { type Assignment, type AssignmentMode } from './types';

export const ASSIGNMENT_MODES: AssignmentMode[] = ['all', 'mailbox', 'department', 'draft'];

/** Ways of assigning whose targets are chosen in a selector, and are therefore missing while empty. */
const MODES_WITH_TARGETS: Set<AssignmentMode> = new Set(['mailbox', 'department']);

/**
 * The draft is the way of assigning nothing is assigned by, so it is also the answer for a set of
 * targets no option of the card expresses: the editor must not read an unknown set as a wider scope
 * than the signature actually has.
 */
export const DEFAULT_ASSIGNMENT_MODE: AssignmentMode = 'draft';

/**
 * The way an existing signature was assigned, as the third card of the editor has to show it.
 * A signature given to everybody names it outright; targets of departments and employees are read
 * as "by departments and employees", and only a set made of mailboxes alone is read as the choice
 * of particular mailboxes. No targets at all is the draft — the signature applies to nobody, and
 * reading it as any other way would hand it a scope its author never chose on the next save.
 */
export function detectAssignmentMode(assignments: Assignment[]): AssignmentMode
{
	if (!assignments || assignments.length === 0)
	{
		return 'draft';
	}

	if (assignments.some((assignment: Assignment) => assignment.targetType === 'all'))
	{
		return 'all';
	}

	const byDepartment = assignments.some(
		(assignment: Assignment) => assignment.targetType === 'department' || assignment.targetType === 'user',
	);

	if (byDepartment)
	{
		return 'department';
	}

	return assignments.every((assignment: Assignment) => assignment.targetType === 'mailbox')
		? 'mailbox'
		: DEFAULT_ASSIGNMENT_MODE
	;
}

/**
 * Whether the way of assigning is one whose targets the author picks, and which is therefore
 * unfinished until at least one is picked. "All mailboxes" names its target by itself, and the
 * draft is the way of assigning the signature to nobody — neither has anything to pick.
 */
export function modeRequiresTargets(mode: AssignmentMode): boolean
{
	return MODES_WITH_TARGETS.has(mode);
}
