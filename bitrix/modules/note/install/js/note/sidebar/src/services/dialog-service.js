import { Loc, Tag } from 'main.core';
import { AirButtonStyle, Button, ButtonSize } from 'ui.buttons';
import { MessageBox, MessageBoxButtons } from 'ui.dialogs.messagebox';
import { Dialog } from 'ui.system.dialog';
import { NoteThemeContext } from 'note.ui.theme-context';

export class DialogService
{
	confirm(message: string, title: string = '', confirmText: string = ''): Promise<boolean>
	{
		return new Promise((resolve) => {
			let isResolved = false;
			const finish = (value) => {
				if (isResolved)
				{
					return;
				}

				isResolved = true;
				resolve(value);
			};

			const content = Tag.render`
				<div class="note-sidebar-confirm-content">
					${String(message || '')}
				</div>
			`;
			const dialog = new Dialog({
				title,
				content,
				width: 420,
				hasOverlay: true,
				overlay: true,
				centerButtons: [
					new Button({
						text: String(Loc.getMessage('NOTE_SIDEBAR_CANCEL') || 'Cancel'),
						size: ButtonSize.LARGE,
						style: AirButtonStyle.FILLED,
						useAirDesign: true,
						dataset: { testid: 'note-dialog-cancel' },
						onclick: () => {
							finish(false);
							dialog.hide();
						},
					}),
					new Button({
						text: String(confirmText || title || Loc.getMessage('NOTE_SIDEBAR_DELETE') || 'OK'),
						size: ButtonSize.LARGE,
						style: AirButtonStyle.PLAIN,
						useAirDesign: true,
						dataset: { testid: 'note-dialog-confirm' },
						onclick: () => {
							finish(true);
							dialog.hide();
						},
					}),
				],
				events: {
					onHide: () => {
						finish(false);
					},
				},
			});

			NoteThemeContext.themeDialog(dialog, content);
			dialog.show();
		});
	}

	// Same layout as confirm(), plus an optional "with nested" checkbox. Resolves with
	// { confirmed, withNested }. When offerNested is false the checkbox is hidden and
	// withNested defaults to true (the backend cascades by default anyway).
	confirmDelete(
		options: {
			message?: string,
			title?: string,
			confirmText?: string,
			offerNested?: boolean,
			nestedLabel?: string,
			nestedDefault?: boolean,
		},
	): Promise<{ confirmed: boolean, withNested: boolean }>
	{
		return this.#confirmWithNested(options);
	}

	// Archive counterpart of confirmDelete — same checkbox mechanics, no destructive styling
	// (archiving isn't destructive). Resolves with { confirmed, withNested }.
	confirmArchive(
		options: {
			message?: string,
			title?: string,
			confirmText?: string,
			offerNested?: boolean,
			nestedLabel?: string,
			nestedDefault?: boolean,
		},
	): Promise<{ confirmed: boolean, withNested: boolean }>
	{
		return this.#confirmWithNested(options);
	}

	#confirmWithNested(
		{
			message = '',
			title = '',
			confirmText = '',
			offerNested = false,
			nestedLabel = '',
			nestedDefault = true,
		}: {
			message?: string,
			title?: string,
			confirmText?: string,
			offerNested?: boolean,
			nestedLabel?: string,
			nestedDefault?: boolean,
		},
	): Promise<{ confirmed: boolean, withNested: boolean }>
	{
		return new Promise((resolve) => {
			let isResolved = false;
			let checkbox = null;
			const finish = (confirmed) => {
				if (isResolved)
				{
					return;
				}

				isResolved = true;
				const withNested = offerNested ? Boolean(checkbox?.checked) : true;
				resolve({ confirmed, withNested });
			};

			const content = Tag.render`
				<div class="note-sidebar-confirm-content">
					${String(message || '')}
				</div>
			`;

			if (offerNested)
			{
				checkbox = Tag.render`<input type="checkbox" class="note-sidebar-confirm-checkbox-input" />`;
				checkbox.checked = Boolean(nestedDefault);
				const nestedRow = Tag.render`
					<label class="note-sidebar-confirm-checkbox">
						${checkbox}
						<span>${String(nestedLabel || '')}</span>
					</label>
				`;
				content.appendChild(nestedRow);
			}

			const dialog = new Dialog({
				title,
				content,
				width: 420,
				hasOverlay: true,
				overlay: true,
				centerButtons: [
					new Button({
						text: String(Loc.getMessage('NOTE_SIDEBAR_CANCEL') || 'Cancel'),
						size: ButtonSize.LARGE,
						style: AirButtonStyle.FILLED,
						useAirDesign: true,
						dataset: { testid: 'note-dialog-cancel' },
						onclick: () => {
							finish(false);
							dialog.hide();
						},
					}),
					new Button({
						text: String(confirmText || title || Loc.getMessage('NOTE_SIDEBAR_DELETE') || 'OK'),
						size: ButtonSize.LARGE,
						style: AirButtonStyle.PLAIN,
						useAirDesign: true,
						dataset: { testid: 'note-dialog-confirm' },
						onclick: () => {
							finish(true);
							dialog.hide();
						},
					}),
				],
				events: {
					onHide: () => {
						finish(false);
					},
				},
			});

			NoteThemeContext.themeDialog(dialog, content);
			dialog.show();
		});
	}

	requestText({ title = '', value = '' }: { title?: string, value?: string }): Promise<string | null>
	{
		return new Promise((resolve) => {
			const input = document.createElement('input');
			input.className = 'ui-ctl-element';
			input.value = value;

			MessageBox.show({
				title,
				message: input,
				modal: true,
				buttons: MessageBoxButtons.OK_CANCEL,
				popupOptions: {
					designSystemContext: NoteThemeContext.getDesignSystemContext(),
				},
				onOk: (messageBox) => {
					const nextValue = String(input.value || '').trim();
					messageBox.close();
					resolve(nextValue || null);
				},
				onCancel: (messageBox) => {
					messageBox.close();
					resolve(null);
				},
			});

			setTimeout(() => {
				input.focus();
			}, 0);
		});
	}
}
