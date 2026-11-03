/**
 * Elements the header may consist of. Declaration order is the left-to-right render order,
 * the same order the server keeps in the `elements` list of the composition.
 */
export const HeaderElement = Object.freeze({
	Logo: 'logo',
	Name: 'name',
	ContentWarning: 'contentWarning',
	Rename: 'rename',
	SaveStatus: 'saveStatus',
	Boost: 'boost',
	Edit: 'edit',
	Presence: 'presence',
	Access: 'access',
	CopyLink: 'copyLink',
	Download: 'download',
	Presentation: 'presentation',
} as const);

export type HeaderElementValue = typeof HeaderElement[keyof typeof HeaderElement];
