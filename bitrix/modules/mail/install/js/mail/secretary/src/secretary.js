import { Text, Type } from 'main.core';
import { Center } from 'ui.notification';

const ENTITY_TYPE = 'mail';

const instances = {};

/**
 * Mail Secretary
 * @see control-button.js
 */
export class Secretary
{
	#messageId: number;

	constructor(messageId: number)
	{
		this.#messageId = messageId;
		this.sliderId = `MailSecretary:${ENTITY_TYPE + this.#messageId}${Math.floor(Math.random() * 1000)}`;
		this.contextBx = (window.top.BX || window.BX);
		this.subscribe();
	}

	static getInstance(messageId: number)
	{
		if (Type.isUndefined(instances[messageId]))
		{
			instances[messageId] = new Secretary(messageId);
		}

		return instances[messageId];
	}

	openChat()
	{
		return BX.ajax.runAction(
			'mail.secretary.createChatFromMessage',
			{ data: { messageId: this.#messageId } },
		).then(
			(response) => {
				if (top.window.BXIM && response.data)
				{
					top.BXIM.openMessenger(`chat${parseInt(response.data, 10)}`);
				}
			},
			(response) => {
				this.#displayErrors(response.errors);
			},
		);
	}

	openCalendarEvent()
	{
		return BX.ajax.runAction(
			'mail.secretary.getCalendarEventDataFromMessage',
			{ data: { messageId: this.#messageId } },
		).then(
			(response) => {
				// let users = [];
				// if (Type.isArrayLike(response.data.userIds))
				// {
				// 	users = response.data.userIds.map((userId) => {
				// 		return {id: parseInt(userId), entityId: 'user'};
				// 	});
				// }

				if (response.data && response.data.isNewEvent)
				{
					new (window.top.BX || window.BX).Calendar.SliderLoader(
						0,
						{
							sliderId: this.sliderId,
							entryName: response.data.name,
							entryDescription: response.data.desc,
							// participantsEntityList: users,
						},
					).show();
				}
				else if (response.data && response.data.isIcal)
				{
					return BX.ajax.runComponentAction('bitrix:mail.client', 'ical', {
						mode: 'ajax',
						data: {
							messageId: this.#messageId,
							action: 'question',
						},
					});
				}

				return null;
			},
			(response) => {
				this.#displayErrors(response.errors);
			},
		).then(
			(response) => {
				if (response?.data?.eventId)
				{
					const sliderLoader = new (window.top.BX || window.BX).Calendar.SliderLoader(
						response.data.eventId,
					);
					sliderLoader.show();

					// the screen publishes its grid under this name; inside the message slider it is the top window
					const grid = this.contextBx.Mail?.Home?.Grid ?? BX.Mail?.Home?.Grid;
					grid?.reloadTable();
				}
			},
		);
	}

	onCalendarSave(event)
	{
		if (event instanceof this.contextBx.Event.BaseEvent)
		{
			const data = event.getData();

			if (data.sliderId === this.sliderId)
			{
				BX.ajax.runAction('mail.secretary.onCalendarSave', {
					data: {
						messageId: this.#messageId,
						calendarEventId: data.responseData.entryId,
					},
				});
			}
		}
	}

	subscribe()
	{
		this.contextBx.Event.EventEmitter.subscribe('BX.Calendar:onEntrySave', this.onCalendarSave.bind(this));
	}

	destroy()
	{
		this.contextBx.Event.EventEmitter.unsubscribe('BX.Calendar:onEntrySave', this.onCalendarSave);
	}

	#displayErrors(errors: Array)
	{
		let errorMessages = [];
		if (Type.isArray(errors))
		{
			errors.forEach((error) => {
				if (Type.isStringFilled(error?.message))
				{
					errorMessages.push(error.message);
				}
			});
		}

		if (errorMessages.length === 0)
		{
			errorMessages = ["action can't be performed"];
		}

		const notificationCenter = this.contextBx.UI?.Notification?.Center ?? Center;
		notificationCenter.notify({
			autoHideDelay: 5000,
			content: errorMessages.map((message) => Text.encode(message)).join('<br>'),
		});
	}
}
