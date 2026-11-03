/**
 * @module crm/category-list/permissions
 */
jn.define('crm/category-list/permissions', (require, exports, module) => {
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
	 * Whether the list may offer creating a funnel. Both fields belong to the list itself rather
	 * than to any funnel of it.
	 *
	 * @param {Object} [categoryList] list payload of DTO-01
	 * @param {Boolean|null} [categoryList.canCreateCategory]
	 * @param {Boolean} [categoryList.canUserEditCategory]
	 * @return {Boolean}
	 */
	const canCreateFunnel = (categoryList) => {
		const { canCreateCategory, canUserEditCategory } = categoryList || {};

		return resolveCapability(canCreateCategory, canUserEditCategory);
	};

	/**
	 * Whether the settings screen of this funnel opens at all. `Category.canOpenSettings` of DTO-01
	 * is the server's own union of the three rights that screen writes with
	 * (`CrmMobile\Service\ConfigurationPermissions::canOpenSettings`, `crm.sales.tunnels`), so the
	 * screen and the way into it cannot disagree. The former gate here is the `canUserEditCategory`
	 * of the list, not the `editable` of the funnel: an item of `getList` states no `editable`.
	 *
	 * @param {Object} [category] funnel payload of DTO-01
	 * @param {Boolean|null} [category.canOpenSettings]
	 * @param {Boolean} [formerGate] the former `canUserEditCategory` of the list
	 * @return {Boolean}
	 */
	const canOpenFunnelSettings = (category, formerGate) => {
		const { canOpenSettings } = category || {};

		return resolveCapability(canOpenSettings, formerGate);
	};

	module.exports = {
		canCreateFunnel,
		canOpenFunnelSettings,
	};
});
