import { ajax, Type, Loc, Dom, Tag } from 'main.core';
import { Popup } from 'main.popup';
import { BaseEvent, EventEmitter } from 'main.core.events';

import { createFromContent } from './v2/task-creator';

export class TaskCreator
{
	static cssClass = {
		popupContent: 'feed-create-task-popup-content',
		popupTitle: 'feed-create-task-popup-title',
		popupDescription: 'feed-create-task-popup-description',
	};

	static signedFiles = null;
	static sliderUrl = '';

	constructor()
	{
		this.initEvents();
	}

	initEvents()
	{
		if (
			Loc.getMessage('SONET_EXT_LIVEFEED_INTRANET_INSTALLED') === 'Y'
			&& Loc.getMessage('SONET_EXT_LIVEFEED_isV2Form') === 'Y'
		)
		{
			return;
		}

		EventEmitter.subscribe('tasksTaskEvent', (event: BaseEvent) => {
			const [type, data] = event.getCompatData();
			if (
				type !== 'ADD'
				|| !Type.isPlainObject(data.options)
				|| !Type.isBoolean(data.options.STAY_AT_PAGE)
				|| data.options.STAY_AT_PAGE
			)
			{
				return;
			}

			TaskCreator.signedFiles = null;
		});

		EventEmitter.subscribe('SidePanel.Slider:onCloseComplete', (event: BaseEvent) => {
			const sliderInstance = event.getTarget();
			if (!sliderInstance)
			{
				return;
			}

			const sliderUrl = sliderInstance.getUrl();
			if (
				!Type.isStringFilled(sliderUrl)
				|| sliderUrl !== TaskCreator.sliderUrl
				|| !Type.isStringFilled(TaskCreator.signedFiles)
			)
			{
				return;
			}

			ajax.runAction('intranet.controlbutton.clearNewTaskFiles', {
				data: {
					signedFiles: TaskCreator.signedFiles,
				},
			}).then(() => {
				TaskCreator.signedFiles = null;
			});
		});
	}

	static async create(params)
	{
		if (
			Loc.getMessage('SONET_EXT_LIVEFEED_INTRANET_INSTALLED') === 'Y'
			&& Loc.getMessage('SONET_EXT_LIVEFEED_isV2Form') === 'Y'
		)
		{
			void createFromContent(params);
		}
	}
}
