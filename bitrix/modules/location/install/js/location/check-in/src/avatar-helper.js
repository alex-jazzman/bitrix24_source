import { AvatarRound } from 'ui.avatar';
import { EMPTY_AVATAR_PALETTE } from './checkin-tokens';

// Palette indexing C - hash, no guard: id % len; NaN/negative gives undefined. Behavior kept as-is.
const getColor = (id) => EMPTY_AVATAR_PALETTE[id % EMPTY_AVATAR_PALETTE.length];

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
