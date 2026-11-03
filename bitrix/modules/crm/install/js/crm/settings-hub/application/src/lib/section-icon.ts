const DEFAULT_SECTION_ICON = 'o-settings';
const UNSAFE_SECTION_ICON_PATTERN = /[^\da-z-]/g;

export function resolveSectionIcon(icon?: string | null): string
{
	const normalizedIcon = icon?.replaceAll(UNSAFE_SECTION_ICON_PATTERN, '') ?? '';

	return normalizedIcon === '' ? DEFAULT_SECTION_ICON : normalizedIcon;
}
