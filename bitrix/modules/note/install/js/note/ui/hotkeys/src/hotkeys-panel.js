import { Dom, Loc } from 'main.core';
import { BIcon, Outline } from 'ui.icon-set.api.vue';
import 'ui.icon-set.outline';
import { Hint } from 'ui.hint';
import { getHotkeyDescriptor } from './descriptor';
import { getMarkdownReference } from './markdown-reference';
import { formatShortcut } from './format-shortcut';
import './style.css';

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
	global: 'NOTE_HOTKEYS_GROUP_GLOBAL',
};

// Right-hand panel (SC-002/SC-003), non-modal so the user can read shortcuts while editing.
// Mirrors note.ui.document-history's VersionTimelineComponent: a flex sibling of `.content`
// that animates its width open/closed via the `--open` class, never an overlay.
export const HotkeysPanelComponent = {
	name: 'NoteHotkeysPanel',
	components: {
		BIcon,
	},
	props: {
		open: {
			type: Boolean,
			default: false,
		},
	},
	emits: ['close'],
	data()
	{
		return {
			Outline,
		};
	},
	computed: {
		panelTitle(): string
		{
			return Loc.getMessage('NOTE_HOTKEYS_HELP_TITLE') || '';
		},
		closeLabel(): string
		{
			return Loc.getMessage('NOTE_HOTKEYS_HELP_CLOSE') || '';
		},
		markdownTitle(): string
		{
			return Loc.getMessage('NOTE_HOTKEYS_MD_SECTION_TITLE') || '';
		},
		// Hotkey groups in presentation order; each carries its localized title and rendered rows.
		comboGroups(): Array<Object>
		{
			const descriptor = getHotkeyDescriptor();

			return GROUP_ORDER
				.map((group) => {
					const items = descriptor.filter((item) => item.group === group);
					if (items.length === 0)
					{
						return null;
					}

					return {
						key: group,
						title: Loc.getMessage(GROUP_TITLE_KEY[group]) || '',
						rows: items.map((item) => ({
							key: item.id,
							label: Loc.getMessage(item.labelKey) || item.id,
							combo: formatShortcut(item.combo),
						})),
					};
				})
				.filter(Boolean);
		},
		// Markdown reference sub-groups (blocks, inline, note entities). Syntax strings are literal;
		// `hint` (when present) is spelled out via a ui.hint "?" next to the group title in mounted().
		markdownGroups(): Array<Object>
		{
			return getMarkdownReference().map((group) => ({
				key: group.titleKey,
				title: Loc.getMessage(group.titleKey) || '',
				hint: group.hintKey ? (Loc.getMessage(group.hintKey) || '') : '',
				rows: group.rows.map((row) => ({
					key: row.labelKey,
					label: Loc.getMessage(row.labelKey) || row.labelKey,
					syntax: row.syntax,
				})),
			}));
		},
	},
	mounted()
	{
		this.installHints();
	},
	methods: {
		handleClose(): void
		{
			this.$emit('close');
		},
		// The panel content is static (rendered once), so a one-shot pass over the hint hosts is
		// enough. ui.hint's createNode returns a "?" icon that shows the text on hover — the same
		// pattern the permissions popup uses for its section titles.
		installHints(): void
		{
			const hosts = this.$el?.querySelectorAll?.('[data-hotkeys-hint]');
			if (!hosts)
			{
				return;
			}

			for (const host of hosts)
			{
				const text = host.getAttribute('data-hotkeys-hint');
				if (!text)
				{
					continue;
				}

				const node = Hint.createNode(text);
				if (node)
				{
					Dom.addClass(node, 'note-hotkeys-panel__group-hint-icon');
					Dom.append(node, host);
				}
			}
		},
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
	`,
};
