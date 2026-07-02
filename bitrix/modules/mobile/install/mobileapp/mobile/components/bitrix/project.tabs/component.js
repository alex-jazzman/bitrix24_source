(() => {
	const require = (extension) => jn.require(extension);
	const { ProjectTabsManager } = require('project/tabs-manager');

	new ProjectTabsManager({
		groupId: BX.componentParameters.get('id', 0),
		subtitle: BX.componentParameters.get('subtitle', ''),
		calendarWebPathTemplate: BX.componentParameters.get('calendarWebPathTemplate', '/workgroups/group/#group_id#/calendar/'),
		currentUserId: BX.componentParameters.get('currentUserId', 0),
		isCalendarTabExternal: BX.componentParameters.get('isCalendarTabExternal', false),
		item: BX.componentParameters.get('item', {}),
		guid: BX.componentParameters.get('guid', ''),
		tabs,
	});
})();
