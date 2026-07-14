import { Loc, Tag, Type } from 'main.core';
import { CloseIconSize } from 'main.popup';
import { MessageBox, MessageBoxButtons } from 'ui.dialogs.messagebox';
import { AirButtonStyle, Button, ButtonSize, CancelButton } from 'ui.buttons';
import { Outline } from 'ui.icon-set.api.core';

import { DeleteProject } from '../feature/delete-project';
import { DeleteProjectErrorCode } from '../const';

import './delete-project-popup.css';

export class DeleteProjectPopup
{
	#messageBox: MessageBox | null = null;

	deleteProject(projectId: number): Promise<boolean>
	{
		return this.#delete({ projectId });
	}

	deleteScrum(scrumId: number): Promise<boolean>
	{
		return this.#delete({ scrumId });
	}

	#delete({ projectId, scrumId }: { projectId?: number, scrumId?: number }): Promise<boolean>
	{
		return new Promise((resolve) => {
			if (!projectId && !scrumId)
			{
				resolve(false);

				return;
			}

			const cancelButton = new CancelButton({
				size: ButtonSize.LARGE,
				style: AirButtonStyle.FILLED,
				className: 'socialnetwork-delete-project-popup-button',
				text: Loc.getMessage('SONET_DELETE_PROJECT_POPUP_CANCEL_BUTTON') || '',
				// @ts-ignore
				onclick: () => {
					this.#messageBox?.close();
					this.#messageBox = null;
					resolve(false);
				},
				useAirDesign: true,
			});

			// @ts-ignore
			const yesButton = new Button({
				size: ButtonSize.LARGE,
				style: AirButtonStyle.OUTLINE,
				className: 'socialnetwork-delete-project-popup-button',
				text: Loc.getMessage('SONET_DELETE_PROJECT_POPUP_CONFIRM_BUTTON') || '',
				// @ts-ignore
				onclick: async (button: Button): Promise<void> => {
					button.setDisabled(true);
					button.setWaiting(true);

					const [error] = await DeleteProject.delete({ projectId, scrumId });

					button.setDisabled(false);
					button.setWaiting(false);

					if (error)
					{
						await this.#showBlockedState(
							this.#messageBox as MessageBox,
							this.#getContentByError((error as Error)?.name),
						);
					}

					this.#messageBox?.close();
					this.#messageBox = null;
					resolve(!error);
				},
				useAirDesign: true,
			});

			this.#messageBox = MessageBox.create({
				title: Loc.getMessage('SONET_DELETE_PROJECT_POPUP_CONFIRM_TITLE'),
				modal: true,
				buttons: [cancelButton, yesButton],
				popupOptions: {
					id: `socialnetwork-delete-project-popup-${projectId ?? scrumId}`,
					closeByEsc: true,
					closeIcon: true,
					closeIconSize: CloseIconSize.LARGE,
				},
				useAirDesign: true,
			});

			this.#messageBox.show();
		});
	}

	#showBlockedState(messageBox: MessageBox, content: string | null = null): Promise<void>
	{
		return new Promise((resolve) => {
			if (Type.isNil(content))
			{
				resolve();

				return;
			}

			const popup = messageBox.getPopupWindow();
			popup.setTitleBar({
				content: Tag.render`
					<span class="popup-window-titlebar-text">
						<div class="socialnetwork-delete-project-popup-title">
							<div class="ui-icon-set --${Outline.ALERT_ACCENT} socialnetwork-delete-project-popup-title-icon"></div>
							${Loc.getMessage('SONET_DELETE_PROJECT_POPUP_BLOCKED_TITLE') ?? ''}
						</div>
					</span>
				`,
			});
			popup.setBackground('linear-gradient(147deg, var(--accent-soft-accent-soft-red-1, #FFCDCC) -7.94%, var(--base-base-white-fixed, #FFF) 31.8%)');
			popup.setContent(
				Tag.render`
					<span class="socialnetwork-delete-project-popup-content">
						${content}
					</span>
				`,
			);

			messageBox.setButtons(MessageBoxButtons.CANCEL);
			messageBox.setCancelCaption(Loc.getMessage('SONET_DELETE_PROJECT_POPUP_BLOCKED_BUTTON') ?? '');
			messageBox.setCancelCallback(() => resolve());
		});
	}

	#getContentByError(errorName: string = ''): string | null
	{
		const errorNames: string[] = [
			DeleteProjectErrorCode.GroupWithFlow,
			DeleteProjectErrorCode.TasksNotEmpty,
			DeleteProjectErrorCode.DiskNotEmpty,
		];

		if (errorNames.includes(errorName))
		{
			return Loc.getMessage('SONET_DELETE_PROJECT_POPUP_BLOCKED_DESCRIPTION') ?? null;
		}

		return null;
	}
}
