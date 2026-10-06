// Canonical URLs for the shared static assets published under
// /bitrix/js/note/ui/assets/images/. JS consumers import from `note.ui.assets`
// instead of hardcoding the path, so each asset lives in exactly one place.
// CSS consumers reference the same path directly (CSS cannot import).
const IMAGES_BASE = '/bitrix/js/note/ui/assets/images';

// Foreign published assets get their own base: IMAGES_BASE means "our own images", and bending it
// to reach another module's directory would either break that meaning or push the path out of the
// registry into a hardcoded string at the call site.
const AI_ASSISTANT_IMAGES_BASE = '/bitrix/js/aiassistant/marta/image';

export const AssetUrl = Object.freeze({
	collectionIcon: `${IMAGES_BASE}/collection.svg`,
	systemUserAvatar: `${IMAGES_BASE}/system-user-avatar.png`,
	zefirDecoration: `${IMAGES_BASE}/zefir-decoration.webp`,
	// One-shot intro glow behind the BitrixGPT avatar; set as an <img> src, so it needs a URL
	// rather than a CSS rule (the avatar icon itself is addressed straight from CSS).
	aiChatGlow: `${AI_ASSISTANT_IMAGES_BASE}/bitrixgpt-glow.webp`,
});
