/**
 * @module crm/kanban/settings/permissions
 */
jn.define('crm/kanban/settings/permissions', (require, exports, module) => {
	/**
	 * A capability of DTO-01, or the former gate where the payload states none. `Dto::toArray()`
	 * always emits every declared property, so only a boolean value is a decision of the server.
	 *
	 * @param {Boolean|null} [capability]
	 * @param {Boolean|null} [formerGate]
	 * @return {Boolean}
	 */
	const resolveCapability = (capability, formerGate) => (
		typeof capability === 'boolean' ? capability : formerGate === true
	);

	/**
	 * Whether the access of this funnel is the granular model's decision to make, repeating
	 * `CrmMobile\Controller\Category::decidesCategoryAccess`. An entity type carrying no funnels
	 * states `categoriesSupported === false`, and there the former gate stays the only check.
	 *
	 * @param {Boolean} [categoriesSupported]
	 * @return {Boolean}
	 */
	const decidesCategoryAccess = (categoriesSupported) => categoriesSupported !== false;

	/**
	 * What the funnel settings screen may do with the funnel it was opened for.
	 *
	 * @param {Object} [category] funnel payload of DTO-01
	 * @param {Boolean} [category.editable]
	 * @param {Boolean|null} [category.canManageFunnels]
	 * @param {Boolean|null} [category.canManageStages]
	 * @param {Boolean|null} [category.canManageTunnels]
	 * @param {Boolean|null} [category.canManageCategoryAccess]
	 * @param {Boolean} [category.categoriesSupported]
	 * @param {Boolean} [category.categoriesEnabled]
	 * @return {{
	 *     canManageFunnel: Boolean,
	 *     canManageStages: Boolean,
	 *     canManageCategoryAccess: Boolean,
	 *     canOpenStageCard: Boolean,
	 *     canReorderStages: Boolean,
	 * }}
	 */
	const getFunnelSettingsPermissions = (category) => {
		const {
			editable,
			canManageFunnels,
			canManageStages,
			canManageTunnels,
			canManageCategoryAccess,
			categoriesSupported,
			categoriesEnabled,
		} = category || {};

		const formerGate = editable === true;
		const managesFunnels = resolveCapability(canManageFunnels, formerGate);
		const managesStages = resolveCapability(canManageStages, formerGate);
		const managesTunnels = resolveCapability(canManageTunnels, formerGate);

		return {
			// a funnel-less entity type shows one funnel with no name of its own and none to delete
			canManageFunnel: managesFunnels && categoriesEnabled !== false,
			canManageStages: managesStages,
			canManageCategoryAccess: decidesCategoryAccess(categoriesSupported)
				? resolveCapability(canManageCategoryAccess, formerGate)
				: formerGate,
			// tunnels are edited in the stage card, so managing them alone still opens it
			canOpenStageCard: managesStages || managesTunnels,
			canReorderStages: managesStages,
		};
	};

	module.exports = {
		getFunnelSettingsPermissions,
	};
});
