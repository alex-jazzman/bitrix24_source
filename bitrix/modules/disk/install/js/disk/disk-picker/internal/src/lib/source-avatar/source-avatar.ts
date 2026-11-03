// A storage without an avatar of its own gets a lettered gradient circle, matching the
// personal disk and Recent instead of the flat grey the design-system avatar falls back
// to. The gradient cannot come from that component: its base is an SVG fill driven by a
// single rgb value, so the circle is drawn here and the gradients live in
// source-sidebar.css as --tint-N.

// Keep in step with the --tint-N rules in source-sidebar.css.
const TINT_COUNT = 4;

// The storage id, not the title: the tint has to survive a rename.
export function resolveAvatarTint(storageId: number): number
{
	return (Math.abs(storageId) % TINT_COUNT) + 1;
}

// Mirrors AvatarBase in ui.avatar: up to two leading letters, so a storage shows the
// same initials here as it does in the avatars the product draws elsewhere.
const INITIAL_SYMBOL_PATTERN = /[\p{L}\p{N} ]/u;

export function resolveAvatarInitials(title: string): string
{
	const words = title
		.split(/[\s,]/)
		.filter((word) => INITIAL_SYMBOL_PATTERN.test(word.charAt(0)));

	if (words.length === 0)
	{
		return '';
	}

	const initials = words.length > 1
		? words[0].charAt(0) + words[1].charAt(0)
		: words[0].charAt(0);

	return initials.toUpperCase();
}
