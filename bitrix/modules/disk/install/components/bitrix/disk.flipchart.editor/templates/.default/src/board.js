import { Runtime } from 'main.core';
import { ButtonManager } from 'ui.buttons';
import type { Button } from 'ui.buttons';
import type { BoardData } from './types';

export default class Board
{
	setupSharingButton: Button = null;
	data: BoardData = null;

	constructor(options)
	{
		this.setupSharingButton = ButtonManager.createByUniqId(options.panelButtonUniqIds.setupSharing);
		this.data = options.boardData;

		this.bindEvents();
	}

	bindEvents(): void
	{
		if (this.setupSharingButton)
		{
			this.setupSharingButton.bindEvent(
				'click',
				this.handleClickSharingAccessPopup.bind(this),
			);
		}
	}

	handleClickSharingAccessPopup(): void
	{
		const buttonContainer = this.setupSharingButton?.getContainer();
		const shouldBlockExternalLinkFeature = buttonContainer?.dataset?.shouldBlockExternalLinkFeature === 'true';
		const blockerExternalLinkFeature = buttonContainer?.dataset?.blockerExternalLinkFeature;

		if (shouldBlockExternalLinkFeature && blockerExternalLinkFeature)
		{
			eval(blockerExternalLinkFeature);

			return;
		}

		const popupParams = {
			objectId: this.data.id,
			...(this.data.uniqueCode ? { uniqueCode: this.data.uniqueCode } : {}),
		};

		Runtime.loadExtension('disk.sharing-access-popup').then(({ SharingPopupDialog }) => {
			const popup = new SharingPopupDialog();
			popup.open(popupParams);
		});
	}
}
