/**
 * @module im/messenger/controller/sidebar-v2/tabs/participants/src/factories/item-factory
 */
jn.define(
	'im/messenger/controller/sidebar-v2/tabs/participants/src/factories/item-factory',
	(require, exports, module) => {
		const { ParticipantType } = require('im/messenger/controller/sidebar-v2/tabs/participants/src/const');
		const { resolveParticipantsType } = require(
			'im/messenger/controller/sidebar-v2/tabs/participants/src/type-resolver',
		);
		const { ParticipantUserItem } = require('im/messenger/controller/sidebar-v2/tabs/participants/src/items/user');
		const { ParticipantButtonItem } = require(
			'im/messenger/controller/sidebar-v2/tabs/participants/src/items/button',
		);
		const { ParticipantCopilotItem } = require(
			'im/messenger/controller/sidebar-v2/tabs/participants/src/items/copilot',
		);

		const ParticipantItemImplementation = {
			[ParticipantType.user]: ParticipantUserItem,
			[ParticipantType.copilot]: ParticipantCopilotItem,
			[ParticipantType.button]: ParticipantButtonItem,
		};

		function itemFactory(props)
		{
			const resolveParticipantType = resolveParticipantsType(props);

			const implementationType = ParticipantItemImplementation[resolveParticipantType]
				? resolveParticipantType
				: ParticipantType.user;

			return new ParticipantItemImplementation[implementationType](props);
		}

		module.exports = {
			itemFactory,
		};
	},
);
