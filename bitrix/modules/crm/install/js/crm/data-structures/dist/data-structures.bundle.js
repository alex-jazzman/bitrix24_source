/* eslint-disable */
this.BX = this.BX || {};
this.BX.Crm = this.BX.Crm || {};
(function (exports, main_core) {
	'use strict';

	class ItemIdentifier {
		#entityTypeId;
		#entityId;
		constructor(entityTypeId, entityId) {
			// noinspection AssignmentToFunctionParameterJS
			entityTypeId = main_core.Text.toInteger(entityTypeId);
			// noinspection AssignmentToFunctionParameterJS
			entityId = main_core.Text.toInteger(entityId);
			if (!BX.CrmEntityType.isDefined(entityTypeId)) {
				throw new Error('entityTypeId is not a valid crm entity type');
			}
			if (entityId <= 0) {
				throw new Error('entityId must be greater than 0');
			}
			this.#entityTypeId = entityTypeId;
			this.#entityId = entityId;
		}
		static fromJSON(data) {
			try {
				return new ItemIdentifier(main_core.Text.toInteger(data?.entityTypeId), main_core.Text.toInteger(data?.entityId));
			} catch (e) {
				return null;
			}
		}
		get entityTypeId() {
			return this.#entityTypeId;
		}
		get entityTypeName() {
			return BX.CrmEntityType.resolveName(this.#entityTypeId);
		}
		get entityId() {
			return this.#entityId;
		}
		get hash() {
			return `type_${this.entityTypeId}_id_${this.entityId}`;
		}
		isEqualTo(another) {
			if (!(another instanceof ItemIdentifier)) {
				return false;
			}
			return this.hash === another.hash;
		}
		toJSON() {
			return {
				entityTypeId: this.entityTypeId,
				entityId: this.entityId
			};
		}
	}

	exports.ItemIdentifier = ItemIdentifier;

})(this.BX.Crm.DataStructures = this.BX.Crm.DataStructures || {}, BX);
//# sourceMappingURL=data-structures.bundle.js.map
