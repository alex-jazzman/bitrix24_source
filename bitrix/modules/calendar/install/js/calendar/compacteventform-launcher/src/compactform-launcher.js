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

		return this.#showForm('edit', {
			...params,
			entry: null,
		});
	}

	async showEventForm(entryData, params = {})
	{
		await this.#loadData();

		return this.#showForm('view', {
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

		// 3. Reuse the calendar context of the page, or set a light one of our own
		if (Util.getCalendarContext())
		{
			this.#lightContext = Util.getCalendarContext();
			this.#refreshLightContext();
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
				isNewProjectsOn: this.#data.isNewProjectsOn || false,
				settings: this.#data.userSettings || {},
				perm: this.#data.perm || {},
			});

			Util.setCalendarContext(this.#lightContext);
		}
	}

	// the light context of an earlier bootstrap keeps the data it was built with; a context
	// of the calendar itself maintains its own and is left alone
	#refreshLightContext()
	{
		if (!(this.#lightContext instanceof LightCalendarContext))
		{
			return;
		}

		this.#lightContext.isCollabUser = this.#data.isCollabUser || false;
		this.#lightContext.sectionManager.setSections(this.#data.sections || []);
		this.#lightContext.sectionManager.sortSections();
	}

	#showForm(mode, params)
	{
		const sections = this.#lightContext.sectionManager.getSections();
		if (sections.length === 0)
		{
			throw new Error('CompactFormLauncher: no calendar section is available for the current user');
		}

		this.#formInstance ??= new CompactEventForm({
			type: this.#type,
			ownerId: this.#ownerId,
			userId: this.#userId,
		});

		const showParams = {
			type: this.#type,
			ownerId: this.#ownerId,
			userId: this.#userId,
			sections,
			trackingUserList: this.#data.trackingUsersList || [],
			userSettings: this.#data.userSettings,
			locationFeatureEnabled: this.#data.locationFeatureEnabled || false,
			locationList: this.#data.locationList || [],
			plannerFeatureEnabled: this.#data.plannerFeatureEnabled || false,
			...params,
		};

		const formMode = (Type.isString(mode) && mode === 'view')
			? CompactEventForm.VIEW_MODE
			: CompactEventForm.EDIT_MODE
		;

		// a form that failed to open is already torn down, so the next call starts over from a fresh
		// bootstrap instead of reusing the data the failure was seen with
		return this.#formInstance.show(formMode, showParams).catch((error) => {
			this.#formInstance = null;
			this.#data = null;

			throw error;
		});
	}
}
