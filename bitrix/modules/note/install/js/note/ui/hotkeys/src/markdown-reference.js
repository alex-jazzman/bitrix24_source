// Markdown reference shown as a dedicated section in the help panel. Unlike the hotkey
// descriptor (which maps keyboard combos to editor actions), this documents the plain-text
// markdown you can type to produce a block AND how note's own entities (callouts, attachments,
// mentions) are serialised in the document markdown. Syntax strings are literal — never
// localised — only the human labels come from lang.

// Two kinds of markdown live here, and the panel keeps them visually apart:
//   - "typed" rows (blocks, inline) convert live as you type — standard TipTap input rules plus
//     note's own callout rule (`:::info `, see callout-input-rule.js).
//   - "entities" rows are serialisation-only: they carry ids the user can't type, so they only
//     round-trip through the markdown parser (paste / import / REST), never live input. That group
//     carries `hintKey` — the panel renders a ui.hint "?" spelling this out.
// Token shapes mirror the editor tokenizers: note-asset-tokenizer.js → [[image|video|file fileId=N]],
// mention-type-registry.js → @{user|document|collection|task:id}.
const MARKDOWN_GROUPS = Object.freeze([
	Object.freeze({
		titleKey: 'NOTE_HOTKEYS_MD_GROUP_BLOCKS',
		rows: Object.freeze([
			Object.freeze({ labelKey: 'NOTE_HOTKEYS_MD_HEADINGS', syntax: '#, ##, ###, ####' }),
			Object.freeze({ labelKey: 'NOTE_HOTKEYS_ACTION_BULLET_LIST', syntax: '- ' }),
			Object.freeze({ labelKey: 'NOTE_HOTKEYS_ACTION_ORDERED_LIST', syntax: '1. ' }),
			Object.freeze({ labelKey: 'NOTE_HOTKEYS_ACTION_TASK_LIST', syntax: '- [ ] ' }),
			Object.freeze({ labelKey: 'NOTE_HOTKEYS_ACTION_BLOCKQUOTE', syntax: '> ' }),
			Object.freeze({ labelKey: 'NOTE_HOTKEYS_ACTION_CODE_BLOCK', syntax: '```' }),
			Object.freeze({ labelKey: 'NOTE_HOTKEYS_MD_DIVIDER', syntax: '---' }),
			Object.freeze({ labelKey: 'NOTE_HOTKEYS_ACTION_CALLOUT', syntax: ':::info ' }),
		]),
	}),
	Object.freeze({
		titleKey: 'NOTE_HOTKEYS_MD_GROUP_INLINE',
		rows: Object.freeze([
			Object.freeze({ labelKey: 'NOTE_HOTKEYS_ACTION_BOLD', syntax: '**текст**' }),
			Object.freeze({ labelKey: 'NOTE_HOTKEYS_ACTION_ITALIC', syntax: '*текст*' }),
			Object.freeze({ labelKey: 'NOTE_HOTKEYS_ACTION_STRIKE', syntax: '~~текст~~' }),
			Object.freeze({ labelKey: 'NOTE_HOTKEYS_ACTION_INLINE_CODE', syntax: '`код`' }),
			Object.freeze({ labelKey: 'NOTE_HOTKEYS_ACTION_LINK', syntax: '[текст](url)' }),
		]),
	}),
	Object.freeze({
		titleKey: 'NOTE_HOTKEYS_MD_GROUP_ENTITIES',
		hintKey: 'NOTE_HOTKEYS_MD_ENTITIES_HINT',
		rows: Object.freeze([
			Object.freeze({ labelKey: 'NOTE_HOTKEYS_MD_IMAGE', syntax: '[[image fileId=N]]' }),
			Object.freeze({ labelKey: 'NOTE_HOTKEYS_MD_VIDEO', syntax: '[[video fileId=N]]' }),
			Object.freeze({ labelKey: 'NOTE_HOTKEYS_MD_FILE', syntax: '[[file fileId=N]]' }),
			Object.freeze({ labelKey: 'NOTE_HOTKEYS_MD_MENTION_USER', syntax: '@{user:id}' }),
			Object.freeze({ labelKey: 'NOTE_HOTKEYS_MD_MENTION_DOCUMENT', syntax: '@{document:id}' }),
			Object.freeze({ labelKey: 'NOTE_HOTKEYS_MD_MENTION_COLLECTION', syntax: '@{collection:id}' }),
			Object.freeze({ labelKey: 'NOTE_HOTKEYS_MD_MENTION_TASK', syntax: '@{task:id}' }),
		]),
	}),
]);

export function getMarkdownReference(): Array<Object>
{
	return MARKDOWN_GROUPS;
}
