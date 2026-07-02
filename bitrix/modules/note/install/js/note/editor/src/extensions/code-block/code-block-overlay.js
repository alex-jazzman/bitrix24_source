import { Loc } from 'main.core';
import { markRaw } from 'ui.vue3';
import { BIcon } from 'ui.icon-set.api.vue';
import { Dialog } from 'ui.entity-selector';
import { NoteThemeContext } from 'note.ui.theme-context';
import { SUPPORTED_LANGUAGES, getLanguageLabel } from '../lowlight-languages';

const ENTITY_ID = 'note-code-block-language';
const TAB_ID = 'note-code-block-language';
const POPUP_CLASS = 'note-editor-code-block-popup';

let dialogCounter = 0;

export const NoteCodeBlockOverlay = {
	name: 'NoteCodeBlockOverlay',
	components: {
		BIcon,
	},
	props: {
		language: {
			type: String,
			default: 'plaintext',
		},
		isEditable: {
			type: Boolean,
			default: true,
		},
	},
	emits: ['language-select', 'copy'],
	data(): Object
	{
		return {
			copied: false,
		};
	},
	computed: {
		languageLabel(): string
		{
			return getLanguageLabel(this.language);
		},
		copyTitle(): string
		{
			return Loc.getMessage('NOTE_EDITOR_DOCUMENT_MENU_COPY_MARKDOWN');
		},
	},
	created(): void
	{
		this.copyResetTimer = null;
		this.dialog = null;
		this.dialogId = `note-code-block-language-${++dialogCounter}`;
		this.unsubscribeTheme = null;
		this.handleScrollSync = (event: Event) => {
			const popupEl = this.dialog?.getPopup?.()?.getPopupContainer?.();
			if (popupEl && event.target instanceof Node && popupEl.contains(event.target))
			{
				return;
			}
			this.dialog?.hide?.();
		};
	},
	beforeUnmount(): void
	{
		clearTimeout(this.copyResetTimer);
		this.unsubscribeTheme?.();
		document.removeEventListener('scroll', this.handleScrollSync, true);
		this.dialog?.destroy?.();
		this.dialog = null;
	},
	watch: {
		language(next: string): void
		{
			this.syncDialogSelection(next);
		},
		isEditable(next: boolean): void
		{
			if (!next && this.dialog && typeof this.dialog.isOpen === 'function' && this.dialog.isOpen())
			{
				this.dialog.hide();
			}
		},
	},
	methods: {
		ensureDialog(): ?Object
		{
			if (this.dialog)
			{
				return this.dialog;
			}

			const anchor = this.$refs.languageButton;
			if (!anchor)
			{
				return null;
			}

			const isMobile = document.documentElement.classList.contains('note-mobile');
			const instance = new Dialog({
				id: this.dialogId,
				targetNode: anchor,
				width: 160,
				height: isMobile ? 240 : 320,
				dropdownMode: true,
				compactView: true,
				multiple: false,
				hideOnSelect: true,
				enableSearch: false,
				showAvatars: false,
				offsetTop: 6,
				popupOptions: {
					className: `${POPUP_CLASS} ${NoteThemeContext.getDesignSystemContext()}`,
				},
				tabs: [
					{ id: TAB_ID, showAvatars: false },
				],
				items: SUPPORTED_LANGUAGES.map((lang: Object) => ({
					id: lang.id,
					entityId: ENTITY_ID,
					title: lang.label,
					tabs: TAB_ID,
					selected: lang.id === this.language,
				})),
				events: {
					'Item:onSelect': (event: Object) => {
						const item = event.getData().item;
						const id = item.getId();
						if (id !== this.language)
						{
							this.$emit('language-select', id);
						}
					},
					'onShow': () => {
						document.addEventListener('scroll', this.handleScrollSync, { capture: true, passive: true });
					},
					'onHide': () => {
						document.removeEventListener('scroll', this.handleScrollSync, true);
					},
				},
			});

			this.dialog = markRaw(instance);
			this.unsubscribeTheme = NoteThemeContext.subscribe((event: Object) => {
				this.applyThemeToPopup(event?.data?.theme);
			});

			return this.dialog;
		},
		applyThemeToPopup(theme: ?string): void
		{
			if (!this.dialog || typeof this.dialog.getPopup !== 'function')
			{
				return;
			}

			const popup = this.dialog.getPopup();
			const popupEl = popup?.getPopupContainer?.();
			if (!popupEl)
			{
				return;
			}

			popupEl.classList.remove('--ui-context-content-light', '--ui-context-content-dark');
			popupEl.classList.add(NoteThemeContext.resolveDesignSystemContext(theme));
		},
		syncDialogSelection(language: string): void
		{
			if (!this.dialog || typeof this.dialog.getItem !== 'function')
			{
				return;
			}

			const target = this.dialog.getItem({ entityId: ENTITY_ID, id: language });
			if (target && !target.isSelected())
			{
				target.select(true);
			}
		},
		toggleMenu(): void
		{
			if (!this.isEditable)
			{
				return;
			}

			const dialog = this.ensureDialog();
			if (!dialog)
			{
				return;
			}

			if (typeof dialog.isOpen === 'function' && dialog.isOpen())
			{
				dialog.hide();

				return;
			}

			dialog.show();
			this.applyThemeToPopup(NoteThemeContext.get());
		},
		onCopyClick(): void
		{
			this.$emit('copy', (success: boolean) => {
				if (!success)
				{
					return;
				}

				this.copied = true;

				if (this.copyResetTimer)
				{
					clearTimeout(this.copyResetTimer);
				}

				this.copyResetTimer = setTimeout(() => {
					this.copied = false;
					this.copyResetTimer = null;
				}, 1500);
			});
		},
		onMousedown(event: MouseEvent): void
		{
			event.preventDefault();
		},
	},
	// language=Vue
	template: `
		<div
			class="note-editor-code-block-overlay"
			contenteditable="false"
			@mousedown="onMousedown"
		>
			<button
				v-if="isEditable"
				ref="languageButton"
				type="button"
				class="note-editor-code-block-language"
				@click="toggleMenu"
			>
				<span class="note-editor-code-block-language-text">{{ languageLabel }}</span>
			</button>
			<span
				v-else
				class="note-editor-code-block-language note-editor-code-block-language--readonly"
			>
				<span class="note-editor-code-block-language-text">{{ languageLabel }}</span>
			</span>
			<button
				type="button"
				class="note-editor-code-block-copy"
				:class="{ 'note-editor-code-block-copy--copied': copied }"
				:title="copyTitle"
				:aria-label="copyTitle"
				@click="onCopyClick"
			>
				<BIcon
					class="note-editor-code-block-copy-icon note-editor-code-block-copy-icon--default"
					name="o-copy"
					:size="16"
				/>
				<BIcon
					class="note-editor-code-block-copy-icon note-editor-code-block-copy-icon--success"
					name="check-s"
					:size="16"
				/>
			</button>
		</div>
	`,
};
