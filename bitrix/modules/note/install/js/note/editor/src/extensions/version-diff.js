import { Transform } from '@tiptap/pm/transform';
import { Slice } from '@tiptap/pm/model';
import { ChangeSet, simplifyChanges } from '@tiptap/pm/changeset';

// [version-diff] Unified inline diff of "version vs previous version" (N vs N-1), Google-Docs style.
// The diff is baked straight INTO the document model: we build ONE merged document (version N with the
// removed N-1 slices spliced back in) and tag every changed span — text via the `diffChange` mark,
// attachment/mention atoms via their `diffState` attribute. Because the tags are part of the model
// (not a positional decoration overlay), they ride along through every later transaction — most
// importantly the async attachment/mention resolve (setNodeMarkup) that used to wipe decorations —
// with zero recompute. The merged doc is built once per version; toggling the highlight is then a pure
// CSS class flip on the preview wrapper (no transaction, no content reload, no re-resolve).

// Plans the N-vs-N-1 diff. Returns the removed base slices to splice into version N (each with the
// version-N position it sits at) and the version-N ranges that were added. On any failure returns an
// empty plan — the preview must never break because the diff failed.
export function planVersionDiff(baseDoc: Object, versionDoc: Object): Object
{
	try
	{
		const transform = new Transform(baseDoc);
		transform.replace(0, baseDoc.content.size, new Slice(versionDoc.content, 0, 0));

		const changes = simplifyChanges(
			ChangeSet.create(baseDoc).addSteps(transform.doc, transform.mapping.maps, null).changes,
			transform.doc,
		);

		const inserts = [];
		const addedVersionRanges = [];
		changes.forEach((change) => {
			if (change.toA > change.fromA)
			{
				inserts.push({ pos: change.fromB, slice: baseDoc.slice(change.fromA, change.toA) });
			}
			if (change.toB > change.fromB)
			{
				addedVersionRanges.push({ from: change.fromB, to: change.toB });
			}
		});

		return { inserts, addedVersionRanges };
	}
	catch
	{
		return { inserts: [], addedVersionRanges: [] };
	}
}

// Tags every changed span in one range: text runs get the `diffChange` mark, atoms that carry a
// `diffState` attr (attachments, mentions) get the attr set. Positions are collected first, then
// applied — marks and setNodeMarkup preserve node sizes, so pre-collected positions stay valid.
function tagRange(transform: Object, markType: Object | null, from: number, to: number, state: string): void
{
	const textRuns = [];
	const atoms = [];
	transform.doc.nodesBetween(from, to, (node, pos) => {
		if (node.isText)
		{
			const start = Math.max(from, pos);
			const end = Math.min(to, pos + node.nodeSize);
			if (end > start)
			{
				textRuns.push([start, end]);
			}
		}
		else if (node.attrs && Object.prototype.hasOwnProperty.call(node.attrs, 'diffState'))
		{
			atoms.push(pos);
		}
	});

	if (markType)
	{
		textRuns.forEach(([start, end]) => transform.addMark(start, end, markType.create({ state })));
	}
	atoms.forEach((pos) => {
		const node = transform.doc.nodeAt(pos);
		if (node)
		{
			transform.setNodeMarkup(pos, undefined, { ...node.attrs, diffState: state });
		}
	});
}

// Builds the merged diff document (version N + spliced-in removed N-1 slices, everything tagged) and
// returns it as JSON for editor.commands.setContent(). On any failure returns the plain version-N doc
// JSON — the preview must always render, even without the diff.
export function buildVersionDiffDoc(schema: Object, versionDocJson: Object, baseDocJson: Object): Object
{
	const versionDoc = schema.nodeFromJSON(versionDocJson);

	try
	{
		const baseDoc = schema.nodeFromJSON(baseDocJson);
		const plan = planVersionDiff(baseDoc, versionDoc);
		const markType = schema.marks.diffChange || null;

		const transform = new Transform(versionDoc);

		// Splice removed slices highest-position-first so lower positions stay valid without remapping.
		// Record each one with the step index after which it was inserted, to map it forward afterwards.
		const removedRaw = [];
		plan.inserts
			.slice()
			.sort((left, right) => right.pos - left.pos)
			.forEach((insert) => {
				try
				{
					transform.replace(insert.pos, insert.pos, insert.slice);
					removedRaw.push({ from: insert.pos, to: insert.pos + insert.slice.size, afterStep: transform.steps.length });
				}
				catch
				{
					// A slice that will not fit this boundary is skipped rather than breaking the diff.
				}
			});

		// Map every recorded range to its final coordinates in the now-spliced merged doc.
		const removedRanges = removedRaw
			.map((raw) => {
				const mapping = transform.mapping.slice(raw.afterStep);

				return { from: mapping.map(raw.from, 1), to: mapping.map(raw.to, -1) };
			})
			.filter((range) => range.to > range.from);

		const addedRanges = plan.addedVersionRanges
			.map((range) => ({ from: transform.mapping.map(range.from, 1), to: transform.mapping.map(range.to, -1) }))
			.filter((range) => range.to > range.from);

		addedRanges.forEach((range) => tagRange(transform, markType, range.from, range.to, 'added'));
		removedRanges.forEach((range) => tagRange(transform, markType, range.from, range.to, 'removed'));

		return transform.doc.toJSON();
	}
	catch
	{
		return versionDoc.toJSON();
	}
}
