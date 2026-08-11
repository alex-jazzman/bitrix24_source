import { SectionManager } from 'calendar.sectionmanager';
import { Util } from 'calendar.util';

export class LightCalendarContext
{
	constructor(options = {})
	{
		this.isCollabUser = options.isCollabUser || false;
		this.roomsManager = options.roomsManager || null;
		this.categoryManager = null;

		const type = options.type || 'user';
		const ownerId = parseInt(options.ownerId, 10) || 0;
		const userId = parseInt(options.userId, 10) || 0;

		Util.setCalendarContext(this);

		this.sectionManager = new SectionManager(
			{ sections: options.sections || [] },
			{
				hiddenSections: options.hiddenSections || [],
				type,
				ownerId,
				userId,
			},
		);

		this.util = {
			type,
			ownerId,
			userId,
			config: {
				locationAccess: options.locationAccess || false,
				isCollabFeatureEnabled: options.isCollabFeatureEnabled || false,
				projectFeatureEnabled: options.projectFeatureEnabled || false,
				settings: options.settings || {},
				perm: options.perm || {},
			},
			userIsOwner()
			{
				return this.type === 'user' && this.userId === this.ownerId;
			},
			isUserCalendar()
			{
				return this.type === 'user';
			},
		};
	}

	get sectionController()
	{
		return this.sectionManager;
	}

	getCalendarType()
	{
		return this.util.type;
	}

	getOwnerId()
	{
		return this.util.ownerId;
	}

	getUserId()
	{
		return this.util.userId;
	}

	getView()
	{
		return { getEntryById: () => null };
	}

	reload()
	{
	}

	reloadDebounce()
	{
	}

	getDisplayedViewRange()
	{
		return {};
	}

	isExternalMode()
	{
		return false;
	}
}
