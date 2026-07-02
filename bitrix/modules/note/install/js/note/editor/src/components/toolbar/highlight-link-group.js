import { NoteThemeContext } from 'note.ui.theme-context';
import { HighlighterIcon, TextColorIcon } from '../ui/icons';

export const ToolbarHighlightLinkGroupComponent = {
	name: 'NoteToolbarHighlightLinkGroup',
	components: {
		HighlighterIcon,
		TextColorIcon,
	},
	props: {
		editor: {
			type: Object,
			default: null,
		},
		editorTick: {
			type: Number,
			default: 0,
		},
		highlightIsActive: {
			type: Boolean,
			default: false,
		},
		textColorIsActive: {
			type: Boolean,
			default: false,
		},
		onCloseMenu: {
			type: Function,
			default: null,
		},
		onSetHighlightColor: {
			type: Function,
			default: null,
		},
		onSetTextColor: {
			type: Function,
			default: null,
		},
	},
	created()
	{
		this.activePicker = null;
		this.activePickerButton = null;
		this.handleScrollSync = () => {
			if (!this.activePicker || !this.activePickerButton)
			{
				return;
			}

			const popup = this.activePicker.getPopupWindow?.();
			if (!popup)
			{
				return;
			}

			popup.adjustPosition?.();
		};
	},
	mounted()
	{
		document.addEventListener('scroll', this.handleScrollSync, { capture: true, passive: true });
	},
	beforeUnmount()
	{
		document.removeEventListener('scroll', this.handleScrollSync, { capture: true });
		this.closeActivePicker();
	},
	computed: {
		activeTextColor(): string
		{
			const editorTick = this.editorTick;
			void editorTick;

			return this.editor?.getAttributes('textStyle')?.color ?? '';
		},
		activeHighlightColor(): string
		{
			const editorTick = this.editorTick;
			void editorTick;

			return this.editor?.getAttributes('highlight')?.color ?? '';
		},
	},
	methods: {
		closeActivePicker(): void
		{
			this.activePicker?.close?.();
			this.activePicker = null;
			this.activePickerButton = null;
		},
		openColorPicker(button: HTMLElement, selectedColor: string, onSelect: (color: string) => void): void
		{
			const sameButton = this.activePickerButton === button;
			this.closeActivePicker();

			if (sameButton)
			{
				return;
			}

			const picker = new BX.ColorPicker({
				bindElement: button,
				allowCustomColor: true,
				selectedColor: selectedColor || null,
				defaultColor: '#000000',
				onColorSelected: (color) => onSelect(color),
				popupOptions: {
					angle: false,
					offsetTop: 12,
					className: 'note-editor-color-popup',
					designSystemContext: NoteThemeContext.getDesignSystemContext(),
				},
			});
			picker.handleDefaultActionClick = () => {
				picker.close();
				onSelect('');
			};

			this.activePicker = picker;
			this.activePickerButton = button;
			picker.getPopupWindow().subscribe('onAfterClose', () => {
				if (this.activePicker === picker)
				{
					this.closeActivePicker();
				}
			});
			picker.open();
		},
		openTextColorPicker(event: MouseEvent): void
		{
			if (!this.editor?.isEditable)
			{
				return;
			}

			this.onCloseMenu?.();
			this.openColorPicker(
				event.currentTarget,
				this.activeTextColor,
				(color) => this.onSetTextColor?.(color),
			);
		},
		openHighlightColorPicker(event: MouseEvent): void
		{
			if (!this.editor?.isEditable)
			{
				return;
			}

			this.onCloseMenu?.();
			this.openColorPicker(
				event.currentTarget,
				this.activeHighlightColor,
				(color) => this.onSetHighlightColor?.(color),
			);
		},
	},
	// language=Vue
	template: `
		<div class="note-editor-toolbar-group">
			<div class="note-editor-toolbar-item">
				<button
					type="button"
					class="note-editor-toolbar-button"
					:title="$Bitrix.Loc.getMessage('NOTE_EDITOR_TOOLBAR_TEXT_COLOR')"
					:data-note-editor-active="textColorIsActive"
					:disabled="!editor?.isEditable"
					@click="openTextColorPicker"
				><TextColorIcon /></button>
			</div>

			<div class="note-editor-toolbar-item">
				<button
					type="button"
					class="note-editor-toolbar-button"
					:title="$Bitrix.Loc.getMessage('NOTE_EDITOR_TOOLBAR_HIGHLIGHT')"
					:data-note-editor-active="highlightIsActive"
					:disabled="!editor?.isEditable"
					@click="openHighlightColorPicker"
				><HighlighterIcon /></button>
			</div>
		</div>
	`,
};
