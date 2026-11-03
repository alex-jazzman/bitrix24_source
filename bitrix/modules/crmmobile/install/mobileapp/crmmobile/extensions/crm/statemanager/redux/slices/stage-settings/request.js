/**
 * @module crm/statemanager/redux/slices/stage-settings/request
 */
jn.define('crm/statemanager/redux/slices/stage-settings/request', (require, exports, module) => {
	/**
	 * Tunnels are a part of the request only when the caller asked for them: the server leaves the
	 * stage tunnels alone while the key is absent and drops them on an empty set, which travels as
	 * the `clearTunnels` flag ({@see buildStageUpdateFields}).
	 *
	 * @param {Object} fields
	 * @param {Array<Object>} [fields.tunnels]
	 * @return {Boolean}
	 */
	const hasRequestedTunnels = (fields) => Array.isArray(fields.tunnels);

	/**
	 * The right that answers for one field of the request. A field named nowhere here asks for no
	 * right of its own - `id` and `statusId` name the stage rather than change it.
	 */
	const fieldRights = {
		name: 'canManageStage',
		color: 'canManageStage',
		tunnels: 'canManageTunnels',
		clearTunnels: 'canManageTunnels',
	};

	/**
	 * The part of the change the caller is allowed to write, and nothing besides. A refused part must
	 * not travel at all: the server turns the whole request down over one of them
	 * ({@see \Bitrix\CrmMobile\Controller\Stage::mayWriteEveryPart}), so the name a user may write
	 * would be lost together with the tunnels they may not.
	 *
	 * Only a stated `false` refuses, so a caller that states no rights writes everything it changed.
	 *
	 * @param {Object} fields stage fields the caller changed
	 * @param {Object} [permissions] rights of the caller, {@see crm/kanban/stage-settings/permissions}
	 * @param {Boolean} [permissions.canManageStage] answers for the name and the color
	 * @param {Boolean} [permissions.canManageTunnels] answers for the tunnels
	 * @return {Object}
	 */
	const writableStageFields = (fields, permissions = {}) => Object.fromEntries(
		Object.entries(fields).filter(([field]) => permissions[fieldRights[field]] !== false),
	);

	/**
	 * @param {Object} fields stage fields to write
	 * @param {Array<Object>} [fields.tunnels]
	 * @param {Function} prepareTunnels maps the tunnels to the shape the server reads
	 * @return {Object}
	 */
	const buildStageUpdateFields = (fields, prepareTunnels) => {
		const { tunnels, ...restFields } = fields;
		const request = {
			...restFields,
			tunnelsContractVersion: 2,
		};

		if (!hasRequestedTunnels(fields))
		{
			return request;
		}

		request.tunnels = prepareTunnels(tunnels);

		// the form encoding of the transport drops an empty array along with its key, so the empty
		// set - the one taking every tunnel off the stage - travels as a flag of its own
		if (tunnels.length === 0)
		{
			request.clearTunnels = true;
		}

		return request;
	};

	module.exports = {
		hasRequestedTunnels,
		writableStageFields,
		buildStageUpdateFields,
	};
});
