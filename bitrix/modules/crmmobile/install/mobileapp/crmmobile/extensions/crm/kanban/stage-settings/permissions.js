/**
 * @module crm/kanban/stage-settings/permissions
 */
jn.define('crm/kanban/stage-settings/permissions', (require, exports, module) => {
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
	 * The former gate of this card. The three other permission modules fall back to the `editable`
	 * of the funnel; this card had no conditions of its own before the granular model, so an
	 * unstated capability keeps that unconditional access. It opens nothing the funnel settings
	 * screen closed: the way into the card is the `canOpenStageCard` of
	 * `crm/kanban/settings/permissions`, and a stage the screen refuses has no card to reach.
	 */
	const FORMER_CARD_GATE = true;

	/**
	 * What the stage card may change in the stage it was opened for. `canManageStages` of DTO-01
	 * answers for the name, the color and the removal, `canManageTunnels` for the tunnels leaving
	 * the stage - the same split the write actions of the stage controller ask by
	 * (`CrmMobile\Controller\Stage::mayWriteEveryPart`), so managing the tunnels alone opens the
	 * card without granting the stage itself.
	 *
	 * @param {Object} [stage] stage payload of DTO-01
	 * @param {Boolean|null} [stage.canManageStages]
	 * @param {Boolean|null} [stage.canManageTunnels]
	 * @return {{ canManageStage: Boolean, canManageTunnels: Boolean }}
	 */
	const getStageCardPermissions = (stage) => {
		const { canManageStages, canManageTunnels } = stage || {};

		return {
			canManageStage: resolveCapability(canManageStages, FORMER_CARD_GATE),
			canManageTunnels: resolveCapability(canManageTunnels, FORMER_CARD_GATE),
		};
	};

	module.exports = {
		getStageCardPermissions,
	};
});
