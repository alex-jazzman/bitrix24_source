/* eslint-disable */
this.BX = this.BX || {};
(function (exports) {
	'use strict';

	const DocumentInitiated = Object.freeze({
		employee: 'employee',
		company: 'company'
	});
	const DocumentMode = Object.freeze({
		document: 'document',
		template: 'template'
	});
	const MemberRole = Object.freeze({
		assignee: 'assignee',
		signer: 'signer',
		editor: 'editor',
		reviewer: 'reviewer'
	});
	const MemberStatus = Object.freeze({
		done: 'done',
		wait: 'wait',
		ready: 'ready',
		refused: 'refused',
		stopped: 'stopped',
		stoppableReady: 'stoppable_ready',
		processing: 'processing'
	});
	const ProviderCode = Object.freeze({
		goskey: 'goskey',
		goskeyLite: 'goskey-lite',
		sesCom: 'ses-com',
		sesRu: 'ses-ru',
		external: 'external'
	});
	const Reminder = Object.freeze({
		none: 'none',
		oncePerDay: 'oncePerDay',
		twicePerDay: 'twicePerDay',
		threeTimesPerDay: 'threeTimesPerDay'
	});
	const TemplateEntity = Object.freeze({
		template: 'template',
		folder: 'folder',
		multiple: 'multiple'
	});
	const EntityType = Object.freeze({
		USER: 'user',
		STRUCTURE_NODE_ROLE: 'structure-node-role',
		COMPANY: 'company'
	});
	const BlankScenario = Object.freeze({
		b2b: 'b2b',
		b2e: 'b2e'
	});

	exports.BlankScenario = BlankScenario;
	exports.DocumentInitiated = DocumentInitiated;
	exports.DocumentMode = DocumentMode;
	exports.EntityType = EntityType;
	exports.MemberRole = MemberRole;
	exports.MemberStatus = MemberStatus;
	exports.ProviderCode = ProviderCode;
	exports.Reminder = Reminder;
	exports.TemplateEntity = TemplateEntity;

})(this.BX.Sign = this.BX.Sign || {});
//# sourceMappingURL=type.bundle.js.map
