// Canonical URLs for the shared static assets published under
// /bitrix/js/note/ui/assets/images/. JS consumers import from `note.ui.assets`
// instead of hardcoding the path, so each asset lives in exactly one place.
// CSS consumers reference the same path directly (CSS cannot import).
const IMAGES_BASE = '/bitrix/js/note/ui/assets/images';

export const AssetUrl = Object.freeze({
	collectionIcon: `${IMAGES_BASE}/collection.svg`,
	systemUserAvatar: `${IMAGES_BASE}/system-user-avatar.png`,
	zefirDecoration: `${IMAGES_BASE}/zefir-decoration.png`,
});
