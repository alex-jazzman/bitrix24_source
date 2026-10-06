import { Mark, mergeAttributes } from '@tiptap/core';

// [version-diff] Inline mark that tags a text run as added/removed in the version diff. The diff lives
// IN the document model (a mark), not as a positional decoration overlay — so it rides along with the
// text through every later transaction (image/mention resolve via setNodeMarkup, etc.) without any
// recompute. It is applied only inside the read-only version-preview instance and carries no
// renderMarkdown handler, so it never serializes into markdown and never affects the live editor.
export const DiffChangeMark = Mark.create({
	name: 'diffChange',

	// Excluded from nothing and never merged away: added and removed runs must keep their own spans.
	excludes: '',

	addAttributes()
	{
		return {
			state: {
				default: null,
				parseHTML: (element) => element.getAttribute('data-diff'),
				renderHTML: (attributes) => (attributes.state ? { 'data-diff': attributes.state } : {}),
			},
		};
	},

	parseHTML()
	{
		return [{ tag: 'span[data-diff]' }];
	},

	renderHTML({ HTMLAttributes })
	{
		return ['span', mergeAttributes(HTMLAttributes, { class: 'note-version-diff-mark' }), 0];
	},
});
