import { ajax, Type } from 'main.core';

import { CompactEventForm } from 'calendar.compacteventform';
import { EntryManager } from 'calendar.entry';
import { Util } from 'calendar.util';

import { LightCalendarContext } from './light-calendar-context';

export class CompactFormLauncher
{
	#type;
	#ownerId;
	#userId;
	#data = null;
	#formInstance = null;
	#lightContext = null;

	async showNewEventForm(params = {})
	{
		await this.#loadData();

		this.#showForm('edit', {
			...params,
			entry: null,
		});
	}

	async showEventForm(entryData, params = {})
	{
		await this.#loadData();

		this.#showForm('view', {
			...params,
			entry: entryData,
		});
	}

	destroy()
	{
		if (this.#formInstance)
		{
			this.#formInstance.close();
			this.#formInstance = null;
		}

		this.#data = null;
	}

	async #loadData()
	{
		if (this.#formInstance)
		{
			return;
		}

		const response = await ajax.runAction('calendar.api.calendarajax.getStandaloneCompactFormData');

		if (!response?.data)
		{
			throw new Error('Failed to load compact form data');
		}

		this.#data = response.data;
		this.#userId = this.#data.userId || this.#userId;

		if (!this.#ownerId)
		{
			this.#ownerId = this.#userId;
		}

		this.#applyData();
	}

	#applyData()
	{
		// 1. Set user settings
		Util.setUserSettings(this.#data.userSettings);
		Util.setEventWithEmailGuestEnabled(this.#data.eventWithEmailGuestEnabled);

		// 2. Set user index
		EntryManager.setUserIndex(this.#data.userIndex);

		// 3. Create and set light context (only if no context exists)
		if (Util.getCalendarContext())
		{
			this.#lightContext = Util.getCalendarContext();
		}
		else
		{
			this.#lightContext = new LightCalendarContext({
				type: this.#type,
				ownerId: this.#ownerId,
				userId: this.#userId,
				isCollabUser: this.#data.isCollabUser || false,
				hiddenSections: this.#data.hiddenSections || [],
				sections: this.#data.sections || [],
				roomsManager: null,
				locationAccess: this.#data.locationAccess || false,
				isCollabFeatureEnabled: this.#data.isCollabFeatureEnabled || false,
				projectFeatureEnabled: this.#data.projectFeatureEnabled || false,
				settings: this.#data.userSettings || {},
				perm: this.#data.perm || {},
			});

			Util.setCalendarContext(this.#lightContext);
		}
	}

	#showForm(mode, params)
	{
		this.#formInstance ??= new CompactEventForm({
			type: this.#type,
			ownerId: this.#ownerId,
			userId: this.#userId,
		});

		const showParams = {
			type: this.#type,
			ownerId: this.#ownerId,
			userId: this.#userId,
			sections: this.#lightContext.sectionManager.getSections(),
			trackingUserList: this.#data.trackingUsersList || [],
			userSettings: this.#data.userSettings,
			locationFeatureEnabled: this.#data.locationFeatureEnabled || false,
			locationList: this.#data.locationList || [],
			plannerFeatureEnabled: this.#data.plannerFeatureEnabled || false,
			...params,
		};

		if (Type.isString(mode) && mode === 'view')
		{
			this.#formInstance.show(CompactEventForm.VIEW_MODE, showParams);
		}
		else
		{
			this.#formInstance.show(CompactEventForm.EDIT_MODE, showParams);
		}
	}
}
