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
