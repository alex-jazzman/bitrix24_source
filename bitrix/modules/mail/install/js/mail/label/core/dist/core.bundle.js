/* eslint-disable */
this.BX = this.BX || {};
this.BX.Mail = this.BX.Mail || {};
this.BX.Mail.Label = this.BX.Mail.Label || {};
(function (exports, main_core) {
	'use strict';

	class ApiClient {
		#controller = 'mail.label';
		async list(mailboxId = null) {
			const config = {
				method: 'GET'
			};
			if (mailboxId !== null) {
				config.getParameters = {
					mailboxId
				};
			}
			const response = await main_core.ajax.runAction(`${this.#controller}.list`, config);
			return response.data.labels;
		}
		async messageLabels(id) {
			const response = await main_core.ajax.runAction(`${this.#controller}.messageLabels`, {
				method: 'GET',
				getParameters: {
					id
				}
			});
			return response.data.labelIds;
		}
		async commonMessageLabels(ids) {
			const response = await main_core.ajax.runAction(`${this.#controller}.commonMessageLabels`, {
				data: {
					ids
				}
			});
			return response.data.labelIds;
		}
		async add(name, mailboxId = 0) {
			const response = await main_core.ajax.runAction(`${this.#controller}.add`, {
				data: {
					name,
					mailboxId
				}
			});
			return response.data.label;
		}
		async update(id, name) {
			const response = await main_core.ajax.runAction(`${this.#controller}.update`, {
				data: {
					id,
					name
				}
			});
			return response.data.label;
		}
		async delete(id) {
			await main_core.ajax.runAction(`${this.#controller}.delete`, {
				data: {
					id
				}
			});
		}
		async assign(labelIds, ids) {
			const response = await main_core.ajax.runAction(`${this.#controller}.assign`, {
				data: {
					labelIds,
					ids
				}
			});
			return response.data.processedIds;
		}
		async unassign(labelIds, ids) {
			const response = await main_core.ajax.runAction(`${this.#controller}.unassign`, {
				data: {
					labelIds,
					ids
				}
			});
			return response.data.processedIds;
		}
	}
	const apiClient = new ApiClient();

	class LabelCollection {
		#labels = new Map();
		constructor(labels = []) {
			this.setAll(labels);
		}
		setAll(labels) {
			this.#labels = new Map(labels.map(label => [label.id, {
				...label
			}]));
		}
		getAll() {
			return [...this.#labels.values()].sort((first, second) => {
				if (first.sort !== second.sort) {
					return first.sort - second.sort;
				}
				return first.id - second.id;
			});
		}
		getById(id) {
			const label = this.#labels.get(id);
			return label ? {
				...label
			} : null;
		}
		upsert(label) {
			this.#labels.set(label.id, {
				...label
			});
		}
		remove(id) {
			this.#labels.delete(id);
		}
		updateCounters(counters) {
			for (const [id, unread] of Object.entries(counters)) {
				const label = this.#labels.get(Number(id));
				if (label) {
					label.unread = unread;
				}
			}
		}
		isEmpty() {
			return this.#labels.size === 0;
		}
	}

	exports.LabelCollection = LabelCollection;
	exports.apiClient = apiClient;

})(this.BX.Mail.Label.Core = this.BX.Mail.Label.Core || {}, BX);
//# sourceMappingURL=core.bundle.js.map
