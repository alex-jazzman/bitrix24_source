import { Loc } from 'main.core';
import { LiveAnnouncer } from 'ui.a11y';

import { BLOCK_TOAST_TYPES, diagramStore as useDiagramStore } from '../../../entities/blocks';
import { type PreparedFragment } from '../../../entities/fragment-library';
import { useToastStore } from '../../../shared/stores';

const ADDED_MESSAGE_ID = 'BIZPROCDESIGNER_EDITOR_FRAGMENT_LIBRARY_INSERT_ADDED';
const REVIEW_MESSAGE_ID = 'BIZPROCDESIGNER_EDITOR_FRAGMENT_LIBRARY_INSERT_REVIEW';

/**
 * A line of the summary per reason of DTO-03. The tariff has a line of its own, as the statement of
 * the task requires (AC-008); the reasons are listed in this order regardless of the order the server
 * answered in, so two insertions of the same fragment read the same way.
 *
 * A reason this client does not know is counted as an unsupported node: that is what an unrecognised
 * verdict of a newer server means here, and dropping it would hide a node that never arrived.
 */
const SKIP_REASON_MESSAGE_IDS = Object.freeze({
	unsupported: 'BIZPROCDESIGNER_EDITOR_FRAGMENT_LIBRARY_INSERT_SKIPPED_UNSUPPORTED',
	document_type: 'BIZPROCDESIGNER_EDITOR_FRAGMENT_LIBRARY_INSERT_SKIPPED_DOCUMENT_TYPE',
	locked: 'BIZPROCDESIGNER_EDITOR_FRAGMENT_LIBRARY_INSERT_SKIPPED_LOCKED',
	hidden_group: 'BIZPROCDESIGNER_EDITOR_FRAGMENT_LIBRARY_INSERT_SKIPPED_HIDDEN_GROUP',
	restricted_settings: 'BIZPROCDESIGNER_EDITOR_FRAGMENT_LIBRARY_INSERT_SKIPPED_RESTRICTED_SETTINGS',
});

const FALLBACK_SKIP_REASON = 'unsupported';

function countByReason(skipped: Array<{ reason: string }>): Map<string, number>
{
	const counts = new Map();

	for (const node of skipped)
	{
		// Own property only: a lookup by a computed key sees the prototype too, and a reason named
		// `toString` would pass as a known one and then fall out of the summary altogether.
		const reason = Object.hasOwn(SKIP_REASON_MESSAGE_IDS, node?.reason)
			? node.reason
			: FALLBACK_SKIP_REASON
		;

		counts.set(reason, (counts.get(reason) ?? 0) + 1);
	}

	return counts;
}

function countLine(messageId: string, count: number): string
{
	return Loc.getMessagePlural(messageId, count, { '#COUNT#': count }) ?? '';
}

/**
 * The outcome of one insertion, a line per group. The queue of toasts shows only the item at its head,
 * so the toast joins them into one message: that is what lets the three groups be seen at once instead
 * of the last of three warnings replacing the two before it.
 */
function buildLines(prepared: PreparedFragment): Array<string>
{
	const lines = [];

	if (prepared.blocks.length > 0)
	{
		lines.push(countLine(ADDED_MESSAGE_ID, prepared.blocks.length));
	}

	const counts = countByReason(prepared.skipped);
	for (const [reason, messageId] of Object.entries(SKIP_REASON_MESSAGE_IDS))
	{
		const count = counts.get(reason) ?? 0;
		if (count > 0)
		{
			lines.push(countLine(messageId, count));
		}
	}

	if (prepared.needsReview.length > 0)
	{
		lines.push(countLine(REVIEW_MESSAGE_ID, prepared.needsReview.length));
	}

	return lines;
}

/**
 * What the user is told about an insertion from the library (AC-008). An insertion that lost nothing
 * and left nothing to tune is reported by the fragment on the canvas itself, so it raises no warning
 * at all - but it still takes the previous one down: the nodes it named belong to an insertion the
 * user has moved on from.
 */
export function reportInsertOutcome(prepared: PreparedFragment): void
{
	const diagram = useDiagramStore();
	diagram.clearFragmentInsertOutcome();

	if (prepared.skipped.length === 0 && prepared.needsReview.length === 0)
	{
		return;
	}

	const lines = buildLines(prepared);

	diagram.markFragmentNodesForReview(prepared.needsReview);
	useToastStore().addCustom(lines.join('\n'), BLOCK_TOAST_TYPES.FRAGMENT_INSERT_OUTCOME);

	// The toast appears beside the canvas and takes no focus, so the summary of the insertion reaches a
	// screen reader only as an announcement. Announced line by line: the announcer cuts a message over
	// its own ceiling, and the line it cuts off is the last one - the one that says how many nodes are
	// left to tune. Its queue speaks the lines in the order they were handed over.
	for (const line of lines)
	{
		LiveAnnouncer.announce(line);
	}
}
