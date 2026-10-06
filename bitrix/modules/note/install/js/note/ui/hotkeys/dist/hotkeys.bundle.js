/* eslint-disable */
this.BX = this.BX || {};
this.BX.Note = this.BX.Note || {};
(function (exports, main_core, ui_iconSet_api_vue, ui_iconSet_outline, ui_hint) {
	'use strict';

	// Single source of truth for the editor hotkey map. Consumed by the keymap
	// extension (phase 2), the app-level listener (phase 3), the help popup and tests.
	// Combos are stored in TipTap mod-notation (Mod = Cmd on macOS, Ctrl elsewhere),
	// never pre-rendered — rendering per OS is the job of format-shortcut.js.

	// Fills DTO-01 defaults so records below can omit the boilerplate fields.
	function entry(record) {
		return Object.freeze({
			aliases: [],
			command: null,
			editorScoped: true,
			...record
		});
	}
	const HOTKEYS = Object.freeze([
	// Group: format — all provided by official TipTap packages (binding: builtin).
	entry({
		id: 'bold',
		group: 'format',
		combo: 'Mod-b',
		binding: 'builtin',
		labelKey: 'NOTE_HOTKEYS_ACTION_BOLD'
	}), entry({
		id: 'italic',
		group: 'format',
		combo: 'Mod-i',
		binding: 'builtin',
		labelKey: 'NOTE_HOTKEYS_ACTION_ITALIC'
	}), entry({
		id: 'underline',
		group: 'format',
		combo: 'Mod-u',
		binding: 'builtin',
		labelKey: 'NOTE_HOTKEYS_ACTION_UNDERLINE'
	}), entry({
		id: 'strike',
		group: 'format',
		combo: 'Mod-Shift-s',
		aliases: ['Ctrl-Shift-x'],
		binding: 'builtin',
		labelKey: 'NOTE_HOTKEYS_ACTION_STRIKE'
	}), entry({
		id: 'inlineCode',
		group: 'format',
		combo: 'Mod-e',
		binding: 'builtin',
		labelKey: 'NOTE_HOTKEYS_ACTION_INLINE_CODE'
	}), entry({
		id: 'highlight',
		group: 'format',
		combo: 'Mod-Shift-h',
		binding: 'builtin',
		labelKey: 'NOTE_HOTKEYS_ACTION_HIGHLIGHT'
	}), entry({
		id: 'superscript',
		group: 'format',
		combo: 'Mod-.',
		binding: 'builtin',
		labelKey: 'NOTE_HOTKEYS_ACTION_SUPERSCRIPT'
	}), entry({
		id: 'subscript',
		group: 'format',
		combo: 'Mod-,',
		binding: 'builtin',
		labelKey: 'NOTE_HOTKEYS_ACTION_SUBSCRIPT'
	}),
	// Group: headings — paragraph reset is note-added, H1..H4 come from the heading package.
	entry({
		id: 'paragraph',
		group: 'headings',
		combo: 'Mod-Alt-0',
		binding: 'new',
		command: 'setParagraph',
		labelKey: 'NOTE_HOTKEYS_ACTION_PARAGRAPH'
	}), entry({
		id: 'heading1',
		group: 'headings',
		combo: 'Mod-Alt-1',
		binding: 'builtin',
		labelKey: 'NOTE_HOTKEYS_ACTION_HEADING_1'
	}), entry({
		id: 'heading2',
		group: 'headings',
		combo: 'Mod-Alt-2',
		binding: 'builtin',
		labelKey: 'NOTE_HOTKEYS_ACTION_HEADING_2'
	}), entry({
		id: 'heading3',
		group: 'headings',
		combo: 'Mod-Alt-3',
		binding: 'builtin',
		labelKey: 'NOTE_HOTKEYS_ACTION_HEADING_3'
	}), entry({
		id: 'heading4',
		group: 'headings',
		combo: 'Mod-Alt-4',
		binding: 'builtin',
		labelKey: 'NOTE_HOTKEYS_ACTION_HEADING_4'
	}),
	// Group: lists — all from TipTap list packages.
	entry({
		id: 'bulletList',
		group: 'lists',
		combo: 'Mod-Shift-8',
		binding: 'builtin',
		labelKey: 'NOTE_HOTKEYS_ACTION_BULLET_LIST'
	}), entry({
		id: 'orderedList',
		group: 'lists',
		combo: 'Mod-Shift-7',
		binding: 'builtin',
		labelKey: 'NOTE_HOTKEYS_ACTION_ORDERED_LIST'
	}), entry({
		id: 'taskList',
		group: 'lists',
		combo: 'Mod-Shift-9',
		binding: 'builtin',
		labelKey: 'NOTE_HOTKEYS_ACTION_TASK_LIST'
	}),
	// Group: blocks — callout is note-specific (default type "info"), the rest are builtin.
	entry({
		id: 'blockquote',
		group: 'blocks',
		combo: 'Mod-Shift-b',
		binding: 'builtin',
		labelKey: 'NOTE_HOTKEYS_ACTION_BLOCKQUOTE'
	}), entry({
		id: 'codeBlock',
		group: 'blocks',
		combo: 'Mod-Alt-c',
		binding: 'builtin',
		labelKey: 'NOTE_HOTKEYS_ACTION_CODE_BLOCK'
	}), entry({
		id: 'callout',
		group: 'blocks',
		combo: 'Mod-Alt-b',
		binding: 'new',
		command: 'toggleCallout:info',
		labelKey: 'NOTE_HOTKEYS_ACTION_CALLOUT'
	}),
	// Group: align — all note-added.
	entry({
		id: 'alignLeft',
		group: 'align',
		combo: 'Mod-Shift-l',
		binding: 'new',
		command: 'setTextAlign:left',
		labelKey: 'NOTE_HOTKEYS_ACTION_ALIGN_LEFT'
	}), entry({
		id: 'alignCenter',
		group: 'align',
		combo: 'Mod-Shift-e',
		binding: 'new',
		command: 'setTextAlign:center',
		labelKey: 'NOTE_HOTKEYS_ACTION_ALIGN_CENTER'
	}), entry({
		id: 'alignRight',
		group: 'align',
		combo: 'Mod-Shift-r',
		binding: 'new',
		command: 'setTextAlign:right',
		labelKey: 'NOTE_HOTKEYS_ACTION_ALIGN_RIGHT'
	}), entry({
		id: 'alignJustify',
		group: 'align',
		combo: 'Mod-Shift-j',
		binding: 'new',
		command: 'setTextAlign:justify',
		labelKey: 'NOTE_HOTKEYS_ACTION_ALIGN_JUSTIFY'
	}),
	// Group: insert — named actions resolved by the keymap extension in phase 2.
	entry({
		id: 'link',
		group: 'insert',
		combo: 'Mod-k',
		binding: 'new',
		command: 'openLinkPopup',
		labelKey: 'NOTE_HOTKEYS_ACTION_LINK'
	}), entry({
		id: 'attachments',
		group: 'insert',
		combo: 'Mod-Shift-u',
		binding: 'new',
		command: 'insertFileNode',
		labelKey: 'NOTE_HOTKEYS_ACTION_ATTACHMENTS'
	}),
	// Group: history — from the TipTap history package.
	entry({
		id: 'undo',
		group: 'history',
		combo: 'Mod-z',
		binding: 'builtin',
		labelKey: 'NOTE_HOTKEYS_ACTION_UNDO'
	}), entry({
		id: 'redo',
		group: 'history',
		combo: 'Mod-Shift-z',
		aliases: ['Ctrl-y'],
		binding: 'builtin',
		labelKey: 'NOTE_HOTKEYS_ACTION_REDO'
	}),
	// Group: global — the help popup itself; bound outside the editor by an app listener (phase 3).
	entry({
		id: 'helpOpen',
		group: 'global',
		combo: '?',
		aliases: ['Mod-/'],
		binding: 'app',
		command: 'helpOpen',
		labelKey: 'NOTE_HOTKEYS_ACTION_HELP_OPEN',
		editorScoped: false
	})]);
	function getHotkeyDescriptor() {
		return HOTKEYS;
	}
	function getEditorHotkeys() {
		return HOTKEYS.filter(item => item.binding === 'new' && item.editorScoped === true);
	}

	// Symbol per modifier for macOS vs. everything else. `Mod` is TipTap's
	// platform-agnostic token that resolves to Cmd on macOS, Ctrl otherwise.
	const MODIFIERS = {
		Mod: {
			mac: '⌘',
			other: 'Ctrl'
		},
		Ctrl: {
			mac: '⌃',
			other: 'Ctrl'
		},
		Alt: {
			mac: '⌥',
			other: 'Alt'
		},
		Shift: {
			mac: '⇧',
			other: 'Shift'
		}
	};

	/**
	 * Render a TipTap mod-notation combo for the current OS.
	 * macOS packs symbols with no separator (⌘⇧L); other platforms join with "+" (Ctrl+Shift+L).
	 * Bare keys without modifiers (e.g. "?", "/") render as-is.
	 */
	function formatShortcut(combo) {
		if (!combo) {
			return '';
		}
		const isMac = main_core.Browser.isMac();
		const parts = String(combo).split('-').map(token => {
			const modifier = MODIFIERS[token];
			if (modifier) {
				return isMac ? modifier.mac : modifier.other;
			}

			// Single-letter keys are shown uppercase; symbols and digits are left untouched.
			return token.length === 1 ? token.toUpperCase() : token;
		});
		return isMac ? parts.join('') : parts.join('+');
	}

	// Markdown reference shown as a dedicated section in the help panel. Unlike the hotkey
	// descriptor (which maps keyboard combos to editor actions), this documents the plain-text
	// markdown you can type to produce a block AND how note's own entities (callouts, attachments,
	// mentions) are serialised in the document markdown. Syntax strings are literal — never
	// localised — only the human labels come from lang.

	// Two kinds of markdown live here, and the panel keeps them visually apart:
	//   - "typed" rows (blocks, inline) convert live as you type — standard TipTap input rules plus
	//     note's own callout rule (`:::info `, see callout-input-rule.js).
	//   - "entities" rows are serialisation-only: they carry ids the user can't type, so they only
	//     round-trip through the markdown parser (paste / import / REST), never live input. That group
	//     carries `hintKey` — the panel renders a ui.hint "?" spelling this out.
	// Token shapes mirror the editor tokenizers: note-asset-tokenizer.js → [[image|video|file fileId=N]],
	// mention-type-registry.js → @{user|document|collection|task:id}.
	const MARKDOWN_GROUPS = Object.freeze([Object.freeze({
		titleKey: 'NOTE_HOTKEYS_MD_GROUP_BLOCKS',
		rows: Object.freeze([Object.freeze({
			labelKey: 'NOTE_HOTKEYS_MD_HEADINGS',
			syntax: '#, ##, ###, ####'
		}), Object.freeze({
			labelKey: 'NOTE_HOTKEYS_ACTION_BULLET_LIST',
			syntax: '- '
		}), Object.freeze({
			labelKey: 'NOTE_HOTKEYS_ACTION_ORDERED_LIST',
			syntax: '1. '
		}), Object.freeze({
			labelKey: 'NOTE_HOTKEYS_ACTION_TASK_LIST',
			syntax: '- [ ] '
		}), Object.freeze({
			labelKey: 'NOTE_HOTKEYS_ACTION_BLOCKQUOTE',
			syntax: '> '
		}), Object.freeze({
			labelKey: 'NOTE_HOTKEYS_ACTION_CODE_BLOCK',
			syntax: '```'
		}), Object.freeze({
			labelKey: 'NOTE_HOTKEYS_MD_DIVIDER',
			syntax: '---'
		}), Object.freeze({
			labelKey: 'NOTE_HOTKEYS_ACTION_CALLOUT',
			syntax: ':::info '
		})])
	}), Object.freeze({
		titleKey: 'NOTE_HOTKEYS_MD_GROUP_INLINE',
		rows: Object.freeze([Object.freeze({
			labelKey: 'NOTE_HOTKEYS_ACTION_BOLD',
			syntax: '**текст**'
		}), Object.freeze({
			labelKey: 'NOTE_HOTKEYS_ACTION_ITALIC',
			syntax: '*текст*'
		}), Object.freeze({
			labelKey: 'NOTE_HOTKEYS_ACTION_STRIKE',
			syntax: '~~текст~~'
		}), Object.freeze({
			labelKey: 'NOTE_HOTKEYS_ACTION_INLINE_CODE',
			syntax: '`код`'
		}), Object.freeze({
			labelKey: 'NOTE_HOTKEYS_ACTION_LINK',
			syntax: '[текст](url)'
		})])
	}), Object.freeze({
		titleKey: 'NOTE_HOTKEYS_MD_GROUP_ENTITIES',
		hintKey: 'NOTE_HOTKEYS_MD_ENTITIES_HINT',
		rows: Object.freeze([Object.freeze({
			labelKey: 'NOTE_HOTKEYS_MD_IMAGE',
			syntax: '[[image fileId=N]]'
		}), Object.freeze({
			labelKey: 'NOTE_HOTKEYS_MD_VIDEO',
			syntax: '[[video fileId=N]]'
		}), Object.freeze({
			labelKey: 'NOTE_HOTKEYS_MD_FILE',
			syntax: '[[file fileId=N]]'
		}), Object.freeze({
			labelKey: 'NOTE_HOTKEYS_MD_MENTION_USER',
			syntax: '@{user:id}'
		}), Object.freeze({
			labelKey: 'NOTE_HOTKEYS_MD_MENTION_DOCUMENT',
			syntax: '@{document:id}'
		}), Object.freeze({
			labelKey: 'NOTE_HOTKEYS_MD_MENTION_COLLECTION',
			syntax: '@{collection:id}'
		}), Object.freeze({
			labelKey: 'NOTE_HOTKEYS_MD_MENTION_TASK',
			syntax: '@{task:id}'
		})])
	})]);
	function getMarkdownReference() {
		return MARKDOWN_GROUPS;
	}

	// Presentation order of hotkey groups (AC-010). A group present in the descriptor but missing
	// here simply isn't rendered — keep in sync with the descriptor's `group` values.
	const GROUP_ORDER = ['format', 'headings', 'lists', 'blocks', 'align', 'insert', 'history', 'global'];
	const GROUP_TITLE_KEY = {
		format: 'NOTE_HOTKEYS_GROUP_FORMAT',
		headings: 'NOTE_HOTKEYS_GROUP_HEADINGS',
		lists: 'NOTE_HOTKEYS_GROUP_LISTS',
		blocks: 'NOTE_HOTKEYS_GROUP_BLOCKS',
		align: 'NOTE_HOTKEYS_GROUP_ALIGN',
		insert: 'NOTE_HOTKEYS_GROUP_INSERT',
		history: 'NOTE_HOTKEYS_GROUP_HISTORY',
		global: 'NOTE_HOTKEYS_GROUP_GLOBAL'
	};

	// Right-hand panel (SC-002/SC-003), non-modal so the user can read shortcuts while editing.
	// Mirrors note.ui.document-history's VersionTimelineComponent: a flex sibling of `.content`
	// that animates its width open/closed via the `--open` class, never an overlay.
	const HotkeysPanelComponent = {
		name: 'NoteHotkeysPanel',
		components: {
			BIcon: ui_iconSet_api_vue.BIcon
		},
		props: {
			open: {
				type: Boolean,
				default: false
			}
		},
		emits: ['close'],
		data() {
			return {
				Outline: ui_iconSet_api_vue.Outline
			};
		},
		computed: {
			panelTitle() {
				return main_core.Loc.getMessage('NOTE_HOTKEYS_HELP_TITLE') || '';
			},
			closeLabel() {
				return main_core.Loc.getMessage('NOTE_HOTKEYS_HELP_CLOSE') || '';
			},
			markdownTitle() {
				return main_core.Loc.getMessage('NOTE_HOTKEYS_MD_SECTION_TITLE') || '';
			},
			// Hotkey groups in presentation order; each carries its localized title and rendered rows.
			comboGroups() {
				const descriptor = getHotkeyDescriptor();
				return GROUP_ORDER.map(group => {
					const items = descriptor.filter(item => item.group === group);
					if (items.length === 0) {
						return null;
					}
					return {
						key: group,
						title: main_core.Loc.getMessage(GROUP_TITLE_KEY[group]) || '',
						rows: items.map(item => ({
							key: item.id,
							label: main_core.Loc.getMessage(item.labelKey) || item.id,
							combo: formatShortcut(item.combo)
						}))
					};
				}).filter(Boolean);
			},
			// Markdown reference sub-groups (blocks, inline, note entities). Syntax strings are literal;
			// `hint` (when present) is spelled out via a ui.hint "?" next to the group title in mounted().
			markdownGroups() {
				return getMarkdownReference().map(group => ({
					key: group.titleKey,
					title: main_core.Loc.getMessage(group.titleKey) || '',
					hint: group.hintKey ? main_core.Loc.getMessage(group.hintKey) || '' : '',
					rows: group.rows.map(row => ({
						key: row.labelKey,
						label: main_core.Loc.getMessage(row.labelKey) || row.labelKey,
						syntax: row.syntax
					}))
				}));
			}
		},
		mounted() {
			this.installHints();
		},
		methods: {
			handleClose() {
				this.$emit('close');
			},
			// The panel content is static (rendered once), so a one-shot pass over the hint hosts is
			// enough. ui.hint's createNode returns a "?" icon that shows the text on hover — the same
			// pattern the permissions popup uses for its section titles.
			installHints() {
				const hosts = this.$el?.querySelectorAll?.('[data-hotkeys-hint]');
				if (!hosts) {
					return;
				}
				for (const host of hosts) {
					const text = host.getAttribute('data-hotkeys-hint');
					if (!text) {
						continue;
					}
					const node = ui_hint.Hint.createNode(text);
					if (node) {
						main_core.Dom.addClass(node, 'note-hotkeys-panel__group-hint-icon');
						main_core.Dom.append(node, host);
					}
				}
			}
		},
		// language=Vue
		template: `
		<aside class="note-hotkeys-panel" :class="{ '--open': open }" :inert="!open">
			<div class="note-hotkeys-panel__inner">
				<div class="note-hotkeys-panel__head">
					<h3 class="note-hotkeys-panel__title">{{ panelTitle }}</h3>
					<button
						type="button"
						class="note-hotkeys-panel__close"
						:title="closeLabel"
						:aria-label="closeLabel"
						@click="handleClose"
					>
						<BIcon :name="Outline.CROSS_L" class="note-hotkeys-panel__icon" aria-hidden="true" />
					</button>
				</div>
				<div class="note-hotkeys-panel__body">
					<section
						v-for="group in comboGroups"
						:key="group.key"
						class="note-hotkeys-panel__group"
					>
						<h4 class="note-hotkeys-panel__group-title">{{ group.title }}</h4>
						<div class="note-hotkeys-panel__rows">
							<div
								v-for="row in group.rows"
								:key="row.key"
								class="note-hotkeys-panel__row"
							>
								<span class="note-hotkeys-panel__label">{{ row.label }}</span>
								<kbd class="note-hotkeys-panel__combo">{{ row.combo }}</kbd>
							</div>
						</div>
					</section>
					<section class="note-hotkeys-panel__md">
						<h4 class="note-hotkeys-panel__section-title">{{ markdownTitle }}</h4>
						<div
							v-for="group in markdownGroups"
							:key="group.key"
							class="note-hotkeys-panel__group"
						>
							<h5 class="note-hotkeys-panel__group-title">
								<span>{{ group.title }}</span>
								<span
									v-if="group.hint"
									class="note-hotkeys-panel__group-hint"
									:data-hotkeys-hint="group.hint"
								></span>
							</h5>
							<div class="note-hotkeys-panel__rows">
								<div
									v-for="row in group.rows"
									:key="row.key"
									class="note-hotkeys-panel__row"
								>
									<span class="note-hotkeys-panel__label">{{ row.label }}</span>
									<code class="note-hotkeys-panel__syntax">{{ row.syntax }}</code>
								</div>
							</div>
						</div>
					</section>
				</div>
			</div>
		</aside>
	`
	};

	exports.HotkeysPanelComponent = HotkeysPanelComponent;
	exports.formatShortcut = formatShortcut;
	exports.getEditorHotkeys = getEditorHotkeys;
	exports.getHotkeyDescriptor = getHotkeyDescriptor;
	exports.getMarkdownReference = getMarkdownReference;

})(this.BX.Note.Ui = this.BX.Note.Ui || {}, BX, BX.UI.IconSet, window, BX.UI);
//# sourceMappingURL=hotkeys.bundle.js.map
