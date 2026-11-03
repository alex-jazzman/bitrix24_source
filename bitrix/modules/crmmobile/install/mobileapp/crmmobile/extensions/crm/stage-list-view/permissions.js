/**
 * @module crm/stage-list-view/permissions
 */
jn.define('crm/stage-list-view/permissions', (require, exports, module) => {
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
	 * Whether the funnel edit button of the stage list opens anything. `Category.canOpenSettings`
	 * of DTO-01 is the server's own union of the three rights the funnel settings screen writes
	 * with (`CrmMobile\Service\ConfigurationPermissions::canOpenSettings`), so the screen and the
	 * way into it cannot disagree.
	 *
	 * The former gate is stated in two places, hence the nested fallback: `editable` on the funnel,
	 * which an item of `getList` does not carry, and the same `isAdminForEntity($entityTypeId)` at
	 * the root of the list (`CrmMobile\Controller\Category::canUserEditCategory`).
	 *
	 * @param {Object} [category] funnel payload of DTO-01
	 * @param {Boolean|null} [category.canOpenSettings]
	 * @param {Boolean|null} [category.editable]
	 * @param {Boolean} [canUserEditCategory] the former gate stated by the list itself
	 * @return {Boolean}
	 */
	const canOpenFunnelSettings = (category, canUserEditCategory) => {
		if (!category)
		{
			// a funnel the store does not know yet has no settings screen to open
			return false;
		}

		const { canOpenSettings, editable } = category;

		return resolveCapability(canOpenSettings, resolveCapability(editable, canUserEditCategory));
	};

	module.exports = {
		canOpenFunnelSettings,
	};
});
