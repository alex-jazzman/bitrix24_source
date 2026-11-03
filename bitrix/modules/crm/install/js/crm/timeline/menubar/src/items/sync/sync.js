import { ajax, Loc, Runtime, Tag, Text, Type } from 'main.core';
import { Button } from 'ui.buttons';
import { UI } from 'ui.notification';

import Item from '../../item';
import './sync.css';

const CREATE_ACTION = 'crm.activity.sync.create';
const MESSENGER_EXTENSION = 'im.public.iframe';
const NOTIFY_AUTO_HIDE_DELAY = 5000;

type CreateResponse = {
	data: {
		chatId: number,
		dialogId: string,
		activityId: number,
	},
};

type ErrorResponse = {
	errors?: Array<{ message: string }>,
};

/** @memberof BX.Crm.Timeline.MenuBar */
export default class Sync extends Item
{
	#button: ?Button = null;
	#isCreating: boolean = false;

	createLayout(): HTMLElement
	{
		this.#button = new Button({
			text: Loc.getMessage('CRM_TIMELINE_SYNC_CREATE_BUTTON'),
			size: Button.Size.LARGE,
			useAirDesign: true,
			style: Button.AirStyle.FILLED_SUCCESS,
			round: true,
			dataset: { testid: 'crm-timeline-menubar-sync-create' },
			onclick: () => this.create(),
		});

		return Tag.render`
			<div class="crm-entity-stream-content-new-detail crm-timeline-menubar-sync --hidden">
				<div class="crm-timeline-menubar-sync__card">
					<div class="crm-timeline-menubar-sync__illustration"></div>
					<div class="crm-timeline-menubar-sync__content">
						<div class="crm-timeline-menubar-sync__title">
							${Loc.getMessage('CRM_TIMELINE_SYNC_PANEL_TITLE')}
						</div>
						<div
							class="crm-timeline-menubar-sync__description"
							data-testid="crm-timeline-menubar-sync-description"
						>
							${Loc.getMessage('CRM_TIMELINE_SYNC_PANEL_DESCRIPTION')}
						</div>
						${this.#button.render()}
					</div>
				</div>
			</div>
		`;
	}

	async create(): Promise<void>
	{
		if (this.#isCreating)
		{
			return;
		}

		this.#setCreating(true);

		let dialogId = null;
		try
		{
			const response: CreateResponse = await ajax.runAction(CREATE_ACTION, {
				data: {
					ownerTypeId: this.getEntityTypeId(),
					ownerId: this.getEntityId(),
				},
			});
			dialogId = response.data.dialogId;
		}
		catch (response)
		{
			this.#setCreating(false);
			this.#notify(this.#getErrorMessage(response));

			return;
		}

		this.#setCreating(false);
		this.emitFinishEditEvent();
		this.deactivate();

		await this.#openChat(dialogId);
	}

	#getErrorMessage(response: ErrorResponse): string
	{
		const message = response?.errors?.[0]?.message;

		return Type.isStringFilled(message) ? message : Loc.getMessage('CRM_TIMELINE_SYNC_CREATE_ERROR');
	}

	#setCreating(isCreating: boolean): void
	{
		this.#isCreating = isCreating;
		this.setLocked(isCreating);
		this.#button?.setWaiting(isCreating);
	}

	async #openChat(dialogId: string): Promise<void>
	{
		if (!Type.isStringFilled(dialogId))
		{
			return;
		}

		try
		{
			const { Messenger } = await Runtime.loadExtension(MESSENGER_EXTENSION);
			await Messenger.openChat(dialogId);
		}
		catch (error)
		{
			console.error('crm.timeline.menubar: failed to open the sync chat', error);
			this.#notify(Loc.getMessage('CRM_TIMELINE_SYNC_CHAT_OPEN_ERROR'), [
				{
					title: Loc.getMessage('CRM_TIMELINE_SYNC_OPEN_CHAT_BUTTON'),
					events: {
						click: (event, balloon) => {
							balloon.close();
							this.#openChat(dialogId);
						},
					},
				},
			]);
		}
	}

	#notify(content: string, actions: ?Array = null): void
	{
		UI.Notification.Center.notify({
			content: Text.encode(content),
			autoHideDelay: NOTIFY_AUTO_HIDE_DELAY,
			actions,
		});
	}
}
