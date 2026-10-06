/**
 * @module project/tabs-manager
 */
jn.define('project/tabs-manager', (require, exports, module) => {
	const { WorkgroupUtil } = require('project/utils');

	class ProjectTabsManager
	{
		constructor(params = {})
		{
			this.groupId = parseInt(params.groupId || '0', 10);
			this.calendarWebPathTemplate = (params.calendarWebPathTemplate || '');
			this.currentUserId = parseInt(params.currentUserId || '0', 10);
			this.isCalendarTabExternal = Boolean(params.isCalendarTabExternal);
			this.tabs = (params.tabs || null);
			this.subtitle = (params.subtitle || '');
			this.item = (params.item || {});
			this.guid = (params.guid || WorkgroupUtil.createGuid());

			if (this.groupId <= 0 || !this.tabs)
			{
				return;
			}

			this.bindEvents();
			this.fillEmptyData();
		}

		fillEmptyData()
		{
			if (
				!this.subtitle
				|| !this.item.params.avatar
			)
			{
				WorkgroupUtil.getGroupData(this.groupId).then(
					(data) => {
						this.tabs.setTitle(
							WorkgroupUtil.getProjectTitleParams(
								{
									title: data.NAME,
									params: {
										...this.item.params,
										avatar: WorkgroupUtil.getTitleAvatarUrl(data),
									},
								},
								WorkgroupUtil.getSubtitle(data.NUMBER_OF_MEMBERS),
							),
						);
					},
					console.error,
				);
			}
		}

		bindEvents()
		{
			this.tabs.on('titleClick', () => {
				const { isCollab, dialogId } = this.item.params;

				ProjectViewManager.open(this.currentUserId, this.groupId, PageManager, isCollab, dialogId);
			});
			this.tabs.on('onTabSelected', (tab) => {
				this.onTabSelected({
					tab,
					groupId: this.groupId,
				});
			});

			BX.addCustomEvent('tasks.list:setVisualCounter', (data) => this.onTasksCounterSet(data));
			BX.addCustomEvent('tasks.list:updateTitle', (data) => this.onTasksTitleUpdated(data));
			BX.addCustomEvent('background:updateTasksCounter', (data) => this.updateTasksCounter(data));
		}

		onTasksCounterSet(data)
		{
			if (data.guid === this.guid)
			{
				WorkgroupUtil.updateTasksCounter(data.value);
			}
		}

		onTasksTitleUpdated({ guid, useProgress })
		{
			if (guid === this.guid)
			{
				this.tabs.setTitle({ useProgress }, true);
			}
		}

		updateTasksCounter(data)
		{
			this.tabs.updateItem(WorkgroupUtil.tabNames.tasks, data);
		}

		onTabSelected(params)
		{
			const tab = params.tab || null;
			const groupId = parseInt(params.groupId || '0', 10);

			if (tab === null || groupId <= 0)
			{
				return;
			}

			if (tab.id === WorkgroupUtil.tabNames.calendar && this.isCalendarTabExternal)
			{
				void WorkgroupUtil.onTabSelectedCalendar(
					groupId,
					this.calendarWebPathTemplate.replace('#group_id#', groupId),
				);
			}
		}
	}

	module.exports = {
		ProjectTabsManager,
	};
});
