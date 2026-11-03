/**
 * @module im/messenger/controller/sidebar-v2/controller/collab/project-info/src/props
 */
jn.define('im/messenger/controller/sidebar-v2/controller/collab/project-info/src/props', (require, exports, module) => {
	const {
		formatProjectPeriod,
	} = require('im/messenger/controller/sidebar-v2/controller/collab/project-info/src/period');

	const GET_BY_DIALOG_ID = 'sidebarModel/sidebarProjectInfoModel/getByDialogId';
	const HAS_BY_DIALOG_ID = 'sidebarModel/sidebarProjectInfoModel/hasByDialogId';

	// Every end of the loading reaches the store through this one mutation: the fields, an empty
	// project, a refused request and a lost one alike.
	const SET_MUTATION = 'sidebarModel/sidebarProjectInfoModel/set';

	/**
	 * @param {ProjectInfoPropsParams} params
	 * @return {ProjectInfoFields}
	 */
	function getProjectInfoProps({ store, dialogId, description })
	{
		const { goal, dateStart, dateFinish, tags } = store.getters[GET_BY_DIALOG_ID](dialogId);

		return {
			goal,
			period: formatProjectPeriod(dateStart, dateFinish),
			description,
			tags,
			pending: !store.getters[HAS_BY_DIALOG_ID](dialogId),
		};
	}

	/**
	 * Calls the handler every time the fields of this dialog change - a reader that is already
	 * looking at them cannot wait for the next opening to learn how the loading ended.
	 *
	 * @param {ProjectInfoStoreParams} params
	 * @param {function(): void} handler
	 * @return {function(): void} stops the calls
	 */
	function subscribeToProjectInfo({ storeManager, dialogId }, handler)
	{
		const listener = (mutation) => {
			if (mutation?.payload?.data?.dialogId === dialogId)
			{
				handler();
			}
		};

		storeManager.on(SET_MUTATION, listener);

		return () => {
			storeManager.off(SET_MUTATION, listener);
		};
	}

	module.exports = { getProjectInfoProps, subscribeToProjectInfo };
});
