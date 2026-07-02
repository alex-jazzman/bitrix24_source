import { AvatarRound } from 'ui.avatar';

// Color palette and selection logic from layout/ui/user/empty-avatar
const COLORS = [
	'#df532d',
	'#64a513',
	'#4ba984',
	'#4ba5c3',
	'#3e99ce',
	'#8474c8',
	'#1eb4aa',
	'#f76187',
	'#58cc47',
	'#ab7761',
	'#29619b',
	'#728f7a',
	'#ba9c7b',
	'#e8a441',
	'#556574',
	'#909090',
	'#5e5f5e',
];

const getColor = (id) => COLORS[id % COLORS.length];

/**
 * Returns the outerHTML of an AvatarRound component.
 * Shows the avatar image when avatarUrl is provided; otherwise shows initials
 * extracted from `name` on a background color derived from the numeric user `id`.
 *
 * @param {string|null} avatarUrl
 * @param {string} name - used to extract initials (first letters of first two words)
 * @param {number} id - numeric user id, determines the background color
 * @param {number} size - desired pixel size of the avatar element
 * @returns {string}
 */
export function getAvatar(avatarUrl, name, id, size)
{
	const avatar = new AvatarRound({
		picPath: avatarUrl || '',
		title: name || '',
		size,
		baseColor: getColor(id),
	});

	return avatar.getContainer().outerHTML;
}
