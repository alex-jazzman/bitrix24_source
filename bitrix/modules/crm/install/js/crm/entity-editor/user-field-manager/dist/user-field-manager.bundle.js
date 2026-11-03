/* eslint-disable */
this.BX = this.BX || {};
(function (exports, main_core) {
	'use strict';

	class DateValidationUserFieldManager extends BX.UI.EntityUserFieldManager {
		static create(id, settings) {
			const manager = new DateValidationUserFieldManager();
			manager.initialize(id, settings);
			BX.UI.EntityUserFieldManager.items[id] = manager;
			return manager;
		}
		validate(result) {
			const names = Object.keys(this._activeFields);
			if (!this._validationEnabled || names.length === 0) {
				return super.validate(result);
			}
			const metadata = Object.create(null);
			for (const name of names) {
				const field = this._activeFields[name];
				metadata[name] = Object.freeze({
					type: field.getFieldType(),
					multiple: field.isMultiple()
				});
			}
			const receiver = DateValidationUserFieldManager.#createReceiver(Object.freeze(metadata));
			this._validationResult = result;
			BX.Main.UF.EditManager.validate.call(receiver, names, this.onValidationComplete.bind(this));
			this._validationPromise = new BX.Promise();
			return this._validationPromise;
		}
		static #createReceiver(metadata) {
			const original = BX.Main.UF.EditManager;
			const receiver = Object.create(original);
			receiver.query = function (mode, param, callback) {
				const values = DateValidationUserFieldManager.#snapshotValues(param.FIELDS);
				return original.query.call(this, mode, param, function (errors, ...args) {
					return callback.call(this, DateValidationUserFieldManager.#normalizeErrors(errors, metadata, values), ...args);
				});
			};
			return receiver;
		}
		static #snapshotValues(fields) {
			const values = Object.create(null);
			if (!main_core.Type.isArray(fields)) {
				return Object.freeze(values);
			}
			for (const field of fields) {
				if (!main_core.Type.isPlainObject(field) || !main_core.Type.isString(field.FIELD)) {
					continue;
				}
				const value = field.VALUE;
				values[field.FIELD] = undefined;
				if (main_core.Type.isString(value)) {
					values[field.FIELD] = value;
				} else if (main_core.Type.isArray(value)) {
					const copy = [...value];
					if (copy.every(entry => main_core.Type.isString(entry))) {
						values[field.FIELD] = Object.freeze(copy);
					}
				}
			}
			return Object.freeze(values);
		}
		static #normalizeErrors(errors, metadata, values) {
			if (!main_core.Type.isPlainObject(errors) && !main_core.Type.isArray(errors)) {
				return errors;
			}
			const normalized = main_core.Type.isArray(errors) ? [...errors] : {};
			for (const [name, message] of Object.entries(errors)) {
				Object.defineProperty(normalized, name, {
					value: message,
					enumerable: true,
					configurable: true,
					writable: true
				});
				const field = metadata[name];
				if (!main_core.Type.isString(message) || field?.type !== 'date') {
					continue;
				}
				const value = values[name];
				const isFilledSingle = field.multiple === false && main_core.Type.isStringFilled(value);
				const isFilledMultiple = field.multiple === true && main_core.Type.isArray(value) && value.some(entry => entry !== '');
				if (isFilledSingle || isFilledMultiple) {
					normalized[name] = main_core.Text.decode(message);
				}
			}
			return normalized;
		}
	}

	exports.DateValidationUserFieldManager = DateValidationUserFieldManager;

})(this.BX.Crm = this.BX.Crm || {}, BX);
//# sourceMappingURL=user-field-manager.bundle.js.map
