/* eslint-disable */
this.BX = this.BX || {};
this.BX.Note = this.BX.Note || {};
(function (exports, main_core, ui_avatar, ui_iconSet_api_vue, note_ui_assets) {
	'use strict';

	/**
	 * Visual presentation map: wire type -> { colorToken, icon, iconUrl, marker, avatarShape }.
	 *
	 * Keys match REG-01 wire values exactly (user/document/collection/task).
	 * colorToken — CSS custom property from Air design tokens.
	 * icon — icon name for BIcon (Outline set); null when iconUrl is used instead.
	 * iconUrl — URL of a custom SVG mask-image glyph (collection); null for BIcon types.
	 *   The asset lives once in note.ui.assets and its URL is imported from there.
	 * marker — short single-char label used in skeleton/chip badge.
	 * avatarShape — 'circle' for user, 'square' for entities.
	 */
	const MENTION_PRESENTATION = Object.freeze({
		// WHY: g-tint form per design artifact; single accent colour; icon is the type signal.
		user: Object.freeze({
			colorToken: '--ui-color-accent-main-primary',
			// user type never renders BIcon; avatar or placeholder is used instead.
			icon: null,
			iconUrl: null,
			marker: '@',
			avatarShape: 'circle'
		}),
		document: Object.freeze({
			// o-file: plain document sheet — closest match to ADR "o-file" leaf icon.
			colorToken: '--ui-color-accent-main-primary',
			icon: ui_iconSet_api_vue.Outline.FILE,
			iconUrl: null,
			marker: 'D',
			avatarShape: 'square'
		}),
		collection: Object.freeze({
			// Custom note SVG rendered as monochrome mask-image; color follows the shared accent token (same for all types in g-tint form).
			colorToken: '--ui-color-accent-main-primary',
			icon: null,
			iconUrl: note_ui_assets.AssetUrl.collectionIcon,
			marker: 'C',
			avatarShape: 'square'
		}),
		task: Object.freeze({
			// o-task: checkbox with checkmark — matches ADR "checkbox/task" marker.
			colorToken: '--ui-color-accent-main-primary',
			icon: ui_iconSet_api_vue.Outline.TASK,
			iconUrl: null,
			marker: 'T',
			avatarShape: 'square'
		})
	});

	/**
	 * Returns the presentation entry for a wire type, or null if unknown.
	 *
	 * @param {string} type
	 * @returns {{ colorToken: string, icon: string|null, iconUrl: string|null, marker: string, avatarShape: string } | null}
	 */
	function getPresentationByType(type) {
		return MENTION_PRESENTATION[type] ?? null;
	}

	/**
	 * Returns the URL when it is safe to render as an avatar image source, else ''.
	 *
	 * Allowlist (mirrors editor/src/utils/open-link.js): relative paths (single '/',
	 * not protocol-relative '//') and absolute http:/https: URLs only. Rejects
	 * javascript:, data:, vbscript:, file:, '//', etc.
	 *
	 * Defense-in-depth: the backend currently emits relative CFile paths, but this
	 * guard blocks a dangerous scheme from ever reaching AvatarRound's xlink:href.
	 *
	 * @param {?string} url
	 * @returns {string}
	 */
	function safeAvatarUrl(url) {
		if (!url) {
			return '';
		}

		// Relative paths (must start with a single '/', not protocol-relative '//').
		if (url.startsWith('/') && !url.startsWith('//')) {
			return url;
		}
		try {
			const parsed = new URL(url, window.location.origin);
			if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
				return url;
			}
		} catch {
			return '';
		}
		return '';
	}

	/**
	 * Pure presentational chip for an entity mention.
	 *
	 * Three states:
	 *   pending   — `available` is null (not yet resolved). Type-aware skeleton:
	 *               color/icon from presentation map, shimmer label, neutral circle for user.
	 *   resolved  — Air chip with label, icon or avatar (user).
	 *   unavailable — neutral grey chip "unavailable" (Q-2: no reason differentiation).
	 *
	 * Self-mention highlight removed (g-tint design); isCurrentUser prop kept for caller compatibility.
	 *
	 * Props-only: no ajax, no store, no routing.
	 */
	// @vue/component
	const MentionChip = {
		name: 'NoteMentionChip',
		components: {
			BIcon: ui_iconSet_api_vue.BIcon
		},
		props: {
			type: {
				type: String,
				default: ''
			},
			label: {
				type: String,
				default: null
			},
			avatar: {
				type: String,
				default: null
			},
			available: {
				type: Boolean,
				default: null
			},
			isCurrentUser: {
				type: Boolean,
				default: false
			},
			unavailable: {
				type: Boolean,
				default: false
			},
			// Pass true when the chip is inside an editable ProseMirror surface.
			// Keyboard/tabindex enhancements are applied ONLY when this is false (view mode).
			isEditable: {
				type: Boolean,
				default: false
			}
		},
		computed: {
			presentation() {
				return getPresentationByType(this.type);
			},
			// pending: available not yet set (null)
			isPending() {
				return this.available === null && !this.unavailable;
			},
			chipClass() {
				const base = 'note-mention-chip';
				if (this.unavailable) {
					return `${base} ${base}--unavailable`;
				}
				if (this.isPending) {
					return `${base} ${base}--pending ${base}--type-${this.type}`;
				}

				// WHY: --self highlight removed per g-tint design; isCurrentUser prop kept for caller compat.
				return `${base} ${base}--type-${this.type}`;
			},
			chipStyle() {
				if (this.unavailable || !this.presentation) {
					return {};
				}
				return {
					'--mention-chip-color': `var(${this.presentation.colorToken})`
				};
			},
			// AvatarRound handles both userpic and initials — always render it for resolved user.
			showAvatar() {
				return !this.isPending && !this.unavailable && this.type === 'user';
			},
			showIcon() {
				return !this.unavailable && this.presentation && this.type !== 'user' && !this.presentation.iconUrl;
			},
			// Custom SVG mask-image icon (collection type only). The glyph URL comes from
			// note.ui.assets (single source) via presentation.iconUrl.
			showCustomIcon() {
				return !this.unavailable && Boolean(this.presentation?.iconUrl) && this.type !== 'user';
			},
			iconName() {
				return this.presentation?.icon ?? '';
			},
			customIconStyle() {
				const url = this.presentation?.iconUrl;
				if (!url) {
					return {};
				}
				return {
					'-webkit-mask-image': `url("${url}")`,
					'mask-image': `url("${url}")`
				};
			},
			displayLabel() {
				if (this.unavailable) {
					return main_core.Loc.getMessage('NOTE_MENTION_UNAVAILABLE');
				}
				return this.label ?? '';
			},
			// ARIA role for the chip in view mode.
			// Navigation types open a URL (internal-link or new tab) → "link".
			// "slider" navKind also opens a page/card → "link" is accurate.
			// In edit mode the chip is a ProseMirror atom — no role override.
			chipRole() {
				if (this.isEditable || this.unavailable) {
					return undefined;
				}
				return 'link';
			},
			// tabindex is set only in view mode for available chips.
			// In edit mode ProseMirror manages atom focus via arrow keys — do NOT interfere.
			chipTabindex() {
				if (this.isEditable) {
					return undefined;
				}

				// Unavailable chips must not be in the tab order as active controls.
				if (this.unavailable) {
					return undefined;
				}
				return '0';
			}
		},
		mounted() {
			if (this.showAvatar) {
				this.renderAvatar();
			}
		},
		updated() {
			if (this.showAvatar) {
				this.renderAvatar();
			} else if (this.$refs.avatarContainer) {
				this.$refs.avatarContainer.innerHTML = '';
				// Reset the memoized key: container is now empty, so the next showAvatar must re-render.
				this.lastAvatarKey = null;
			}
		},
		methods: {
			// Keyboard activation in view mode (Enter / Space → same action as click).
			// Space preventDefault prevents the page from scrolling.
			// Not called in edit mode (tabindex is absent there).
			handleKeydown(event) {
				if (event.key === 'Enter' || event.key === ' ') {
					if (event.key === ' ') {
						event.preventDefault();
					}
					this.$emit('click', event);
				}
			},
			// AvatarRound renders a plain round avatar (initials from userName, or userpic), NO accent ring — cleaner at small chip size.
			renderAvatar() {
				const container = this.$refs.avatarContainer;
				if (!container) {
					return;
				}

				// Validate the avatar URL before it reaches AvatarRound's xlink:href.
				// Disallowed schemes fall back to initials (empty userpicPath).
				const safeUrl = safeAvatarUrl(this.avatar);
				// Mark userpic avatars so the CSS can hide the coloured base circle whose
				// anti-aliased edge would otherwise bleed a pixelated rim when scaled up.
				container.classList.toggle('note-mention-chip__avatar--userpic', Boolean(safeUrl));
				const key = `${this.label ?? ''}\x00${safeUrl}`;
				// Skip rebuilding AvatarRound when neither the label nor the avatar URL changed.
				if (this.lastAvatarKey === key) {
					return;
				}
				this.lastAvatarKey = key;
				container.innerHTML = '';
				// No `size`: the avatar is sized via CSS (--ui-avatar-size in em) so it scales
				// with the chip font-size. Passing a px size here would set an inline var and win.
				const avatarInstance = new ui_avatar.AvatarRound({
					userName: this.label ?? '',
					userpicPath: safeUrl ? encodeURI(safeUrl) : ''
				});
				avatarInstance.renderTo(container);
			}
		},
		// language=Vue
		template: `
		<span
			:class="chipClass"
			:style="chipStyle"
			:role="chipRole"
			:tabindex="chipTabindex"
			:aria-disabled="unavailable ? 'true' : undefined"
			contenteditable="false"
			@keydown="handleKeydown"
		>
			<span v-if="isPending && type === 'user'" aria-hidden="true" class="note-mention-chip__avatar-placeholder"></span>
			<span v-else-if="isPending && presentation && presentation.iconUrl" aria-hidden="true" class="note-mention-chip__icon-wrap">
				<span class="note-mention-chip__svg-icon" :style="customIconStyle"></span>
			</span>
			<span v-else-if="isPending && presentation" aria-hidden="true" class="note-mention-chip__icon-wrap">
				<BIcon :name="iconName" />
			</span>
			<span v-else-if="showAvatar" aria-hidden="true" ref="avatarContainer" class="note-mention-chip__avatar"></span>
			<span v-else-if="showCustomIcon" aria-hidden="true" class="note-mention-chip__svg-icon" :style="customIconStyle"></span>
			<BIcon v-else-if="showIcon" aria-hidden="true" class="note-mention-chip__icon" :name="iconName" />
			<span v-if="isPending" aria-hidden="true" class="note-mention-chip__label note-mention-chip__label--shimmer"></span>
			<span v-else class="note-mention-chip__label" :title="isPending ? undefined : displayLabel">{{ displayLabel }}</span>
		</span>
	`
	};

	exports.MENTION_PRESENTATION = MENTION_PRESENTATION;
	exports.MentionChip = MentionChip;
	exports.getPresentationByType = getPresentationByType;

})(this.BX.Note.Ui = this.BX.Note.Ui || {}, BX, BX.UI, BX.UI.IconSet, BX.Note.Ui);
//# sourceMappingURL=mention-chip.bundle.js.map
