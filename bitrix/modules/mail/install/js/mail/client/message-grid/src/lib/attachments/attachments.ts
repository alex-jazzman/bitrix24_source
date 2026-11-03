import { Text, Type } from 'main.core';

import { AttachmentsView, type AttachmentsViewValue } from '../../const';

/**
 * What the cell of the subject knows about the files of one message. `count` is `null` while the
 * summary has not arrived - a different thing from a summary that came back with nothing live in
 * it, which is `0`.
 */
export type AttachmentsFacts = {
	count: number | null,
	/** How many files the summary named; two at most, the rest are counted by the "+N" chip. */
	iconCount: number,
	hasAttachments: boolean,
	listImprovementsEnabled: boolean,
};

export type AttachmentsDecision = {
	kind: AttachmentsViewValue,
	/** What the "+N" chip counts; zero when the row shows every file it has. */
	restCount: number,
};

const Nothing: AttachmentsDecision = { kind: AttachmentsView.None, restCount: 0 };
const Paperclip: AttachmentsDecision = { kind: AttachmentsView.Paperclip, restCount: 0 };
const Loading: AttachmentsDecision = { kind: AttachmentsView.Loading, restCount: 0 };

/**
 * Which of the four the cell of the subject shows. A summary that names a count but no file lands
 * on the paperclip: there is nothing to build a chip from, and the message still says it carries
 * files.
 */
export function resolveAttachments(facts: AttachmentsFacts): AttachmentsDecision
{
	if (!facts.listImprovementsEnabled)
	{
		return facts.hasAttachments ? Paperclip : Nothing;
	}

	if (facts.count !== null && facts.count > 0 && facts.iconCount > 0)
	{
		return {
			kind: AttachmentsView.Chips,
			restCount: Math.max(facts.count - facts.iconCount, 0),
		};
	}

	if (!facts.hasAttachments)
	{
		return Nothing;
	}

	return facts.count === null ? Loading : Paperclip;
}

/** The viewer names nothing but data attributes, and only those are allowed onto a node. */
const ViewerAttributePrefix = 'data-';

/**
 * The attributes the viewer built on the server, made ready to be hung on a node.
 *
 * Names are kept to the ones the viewer owns rather than merely refused a few: `v-bind` writes a DOM
 * property instead of an attribute for a handful of names. A value that is neither a string nor a
 * number nor a boolean has no attribute form at all.
 *
 * Values are decoded once: the server encodes the title of a file for HTML, and a value set through
 * the DOM keeps the entities where markup would have had the browser read them back.
 */
export function prepareViewerAttributes(attrs: Record<string, unknown> | null): Record<string, string>
{
	const prepared: Record<string, string> = {};
	if (!attrs)
	{
		return prepared;
	}

	Object.entries(attrs).forEach(([name, value]: [string, unknown]): void => {
		if (!name.startsWith(ViewerAttributePrefix))
		{
			return;
		}

		if (Type.isNil(value))
		{
			prepared[name] = '';

			return;
		}

		if (Type.isString(value) || Type.isNumber(value) || Type.isBoolean(value))
		{
			prepared[name] = Text.decode(String(value));
		}
	});

	return prepared;
}
