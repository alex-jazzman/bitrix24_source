import { getAvatar } from './avatar-helper';
import { CI_AVATAR_STACK } from './checkin-tokens';

const MAX_REST_LABEL = 99;

/**
 * @typedef {{id: ?number, name: ?string, avatarUrl: ?string}} AvatarStackFace
 */

/**
 * @param {AvatarStackFace} face
 * @returns {string}
 */
function createFaceHtml(face)
{
	const avatar = getAvatar(face?.avatarUrl, face?.name, face?.id, CI_AVATAR_STACK.FACE_SIZE);

	return `<span class="ci-avatar-stack-face" data-testid="check-in-avatar-stack-face">${avatar}</span>`;
}

/**
 * @param {number} restCount
 * @returns {string}
 */
function createRestFaceHtml(restCount)
{
	const label = restCount > MAX_REST_LABEL ? `${MAX_REST_LABEL}+` : `+${restCount}`;

	return `<span class="ci-avatar-stack-face ci-avatar-stack-face--rest" data-testid="check-in-avatar-stack-rest">${label}</span>`;
}

/**
 * @param {Array<AvatarStackFace>} faces
 * @param {{maxFaces: ?number, totalCount: ?number}} [options]
 * @returns {string}
 */
export function createAvatarStackHtml(faces, options = {})
{
	const list = Array.isArray(faces) ? faces : [];
	const maxFaces = Number.isFinite(options?.maxFaces)
		? Math.max(0, Math.trunc(options.maxFaces))
		: list.length;
	const shown = list.slice(0, maxFaces);

	if (shown.length === 0)
	{
		return '';
	}

	const total = Number.isFinite(options?.totalCount) ? Math.trunc(options.totalCount) : list.length;
	const restCount = Math.max(0, total - shown.length);
	const restHtml = restCount > 0 ? createRestFaceHtml(restCount) : '';

	const facesHtml = shown.map((face) => createFaceHtml(face)).join('');

	return `<div class="ci-avatar-stack" data-testid="check-in-avatar-stack">${facesHtml}${restHtml}</div>`;
}
