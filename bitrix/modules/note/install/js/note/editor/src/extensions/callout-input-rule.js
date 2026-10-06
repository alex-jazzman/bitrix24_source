// Pure helpers for the callout live-input rule — no @tiptap dependency, so they stay unit-testable
// in isolation (mirrors callout-parser.js). `:::info ` / `:::success ` / `:::warning ` / `:::tip `
// (and a bare `::: ` defaulting to info) at the start of a block trigger the wrap; the trailing
// space or tab is what fires the ProseMirror input rule, matching blockquote's `> `.

export const CALLOUT_INPUT_REGEX: RegExp = /^:::(info|success|warning|tip)?[ \t]$/;

// Resolves the callout type from an input-rule match, defaulting to "info" for the bare `::: ` form.
export function resolveCalloutInputType(match: Array<string> | null): string
{
	return (match && match[1]) || 'info';
}

// Enter variant of the trigger: the whole paragraph text must be exactly `:::type` (no trailing
// space — a space would already have fired CALLOUT_INPUT_REGEX). ProseMirror input rules never fire
// on Enter, so a dedicated keyboard handler covers it, matching how the other blocks feel.
export const CALLOUT_ENTER_REGEX: RegExp = /^:::(info|success|warning|tip)?$/;

// Returns the callout type if the paragraph text is a bare `:::type` line (Enter case), else null.
export function matchCalloutEnterType(text: string): string | null
{
	const match = CALLOUT_ENTER_REGEX.exec(String(text).trim());
	if (!match)
	{
		return null;
	}

	return match[1] || 'info';
}

// True if the resolved position sits inside a callout. The live-input paths (`:::type ` input rule
// and its Enter counterpart) check this to refuse nesting — the toolbar and the Mod-Alt-b hotkey
// already avoid it via toggleCallout's isActive guard, and the schema alone doesn't forbid
// callout-in-callout.
export function hasCalloutAncestor($pos: Object): boolean
{
	if (!$pos || typeof $pos.depth !== 'number')
	{
		return false;
	}

	for (let depth = $pos.depth; depth > 0; depth--)
	{
		if ($pos.node(depth)?.type?.name === 'callout')
		{
			return true;
		}
	}

	return false;
}
