/**
 * @module crm/timeline/controllers/call
 */
jn.define('crm/timeline/controllers/call', (require, exports, module) => {

	const { TimelineBaseController } = require('crm/controllers/base');
	const { TimelineScheduler } = require('crm/timeline/scheduler');
	const { Type: CrmType } = require('crm/type');
	const { Type } = require('type');

	const SupportedActions = {
		MAKE_CALL: 'Call:MakeCall',
		SCHEDULE_CALL: 'Call:Schedule',
		OPEN_TOOLBAR: 'Call::OpenToolBar',
	};

	class TimelineCallController extends TimelineBaseController
	{
		static getSupportedActions()
		{
			return Object.values(SupportedActions);
		}

		onItemAction({ action, actionParams = {} })
		{
			switch (action)
			{
				case SupportedActions.MAKE_CALL:
					return this.makeCall(actionParams);
				case SupportedActions.SCHEDULE_CALL:
					return this.scheduleCall(actionParams);
				case SupportedActions.OPEN_TOOLBAR:
					return this.openToolBar(actionParams);
				default:
					return;
			}
		}

		makeCall(actionData)
		{
			if (!Type.isStringFilled(actionData.phone))
			{
				return;
			}

			const params = {
				ENTITY_TYPE_NAME: CrmType.resolveNameById(actionData.entityTypeId),
				ENTITY_ID: actionData.entityId,
				AUTO_FOLD: true
			}

			if (actionData.ownerTypeId !== actionData.entityTypeId || actionData.ownerId !== actionData.entityId)
			{
				params.BINDINGS = {
					OWNER_TYPE_NAME: CrmType.resolveNameById(actionData.ownerTypeId),
					OWNER_ID: actionData.ownerId
				}
			}

			if (actionData.activityId > 0)
			{
				params.SRC_ACTIVITY_ID = actionData.activityId;
			}

			BX.postComponentEvent('onPhoneTo', [{
				number: actionData.phone,
				params
			}], 'calls');
		}

		scheduleCall(actionData)
		{
			const scheduler = new TimelineScheduler({
				entity: this.entity
			});
			scheduler.openActivityEditor(actionData);
		}

		openToolBar(actionData)
		{
			this.pinInTopToolbar({...actionData});
		}
	}

	module.exports = { TimelineCallController };
});