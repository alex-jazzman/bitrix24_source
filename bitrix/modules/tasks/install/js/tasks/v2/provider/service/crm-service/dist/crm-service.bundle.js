/* eslint-disable */
this.BX = this.BX || {};
this.BX.Tasks = this.BX.Tasks || {};
this.BX.Tasks.V2 = this.BX.Tasks.V2 || {};
this.BX.Tasks.V2.Provider = this.BX.Tasks.V2.Provider || {};
(function (exports, tasks_v2_const, tasks_v2_core, tasks_v2_lib_apiClient, tasks_v2_lib_idUtils, tasks_v2_provider_service_taskService) {
	'use strict';

	const entityPrefixMap = {
		[tasks_v2_const.EntitySelectorEntity.Deal]: 'D',
		[tasks_v2_const.EntitySelectorEntity.Contact]: 'C',
		[tasks_v2_const.EntitySelectorEntity.Company]: 'CO',
		[tasks_v2_const.EntitySelectorEntity.Lead]: 'L',
		[tasks_v2_const.EntitySelectorEntity.SmartInvoice]: 'SI'
	};
	const prefixSortMap = Object.fromEntries(Object.values(entityPrefixMap).map((it, index) => [it, index]));
	const prefixEntityMap = Object.fromEntries(Object.entries(entityPrefixMap).map(it => it.reverse()));
	const entityTypeIdMap = {
		[tasks_v2_const.EntitySelectorEntity.Deal]: 2,
		[tasks_v2_const.EntitySelectorEntity.Contact]: 3,
		[tasks_v2_const.EntitySelectorEntity.Company]: 4,
		[tasks_v2_const.EntitySelectorEntity.Lead]: 1,
		[tasks_v2_const.EntitySelectorEntity.SmartInvoice]: 31
	};
	function mapDtoToModel(crmItemDto) {
		return {
			id: crmItemDto.id,
			entityId: crmItemDto.entityId,
			type: crmItemDto.type,
			typeName: crmItemDto.typeName,
			title: crmItemDto.title,
			link: crmItemDto.link
		};
	}
	function mapId(entityId, id) {
		if (!entityPrefixMap[entityId]) {
			const [typeId, itemId] = id.split(':');
			return `T${Number(typeId).toString(16)}_${itemId}`;
		}
		return `${entityPrefixMap[entityId]}_${id}`;
	}
	function splitId(id) {
		const [prefix, entityId] = id.split('_');
		if (!prefixEntityMap[prefix]) {
			return [tasks_v2_const.EntitySelectorEntity.DynamicMultiple, `${getEntityTypeId(id)}:${entityId}`];
		}
		return [prefixEntityMap[prefix], Number(entityId)];
	}
	function compareIds(idA, idB) {
		const [prefixA, entityIdA] = idA.split('_');
		const [prefixB, entityIdB] = idB.split('_');
		const sortA = prefixSortMap[prefixA] ?? getEntityTypeId(idA);
		const sortB = prefixSortMap[prefixB] ?? getEntityTypeId(idB);
		if (sortA === sortB) {
			return entityIdA - entityIdB;
		}
		return sortA - sortB;
	}
	function getEntityTypeId(id) {
		const [prefix] = id.split('_');
		if (!prefixEntityMap[prefix]) {
			return parseInt(prefix.slice(1), 16);
		}
		return entityTypeIdMap[prefixEntityMap[prefix]];
	}

	const crmService = new class {
		async list(id, crmItemIds) {
			const ids = crmItemIds.filter(it => !tasks_v2_core.Core.getStore().getters[`${tasks_v2_const.Model.CrmItems}/getById`](it));
			if (ids.length === 0) {
				return;
			}
			const data = await (tasks_v2_lib_idUtils.idUtils.isTemplate(id) ? this.#listTemplate(id, ids) : this.#listTask(id, ids));
			const crmItems = data.map(dto => mapDtoToModel(dto));
			const actualIds = data.map(dto => dto.id);
			tasks_v2_provider_service_taskService.taskService.updateStoreTask(id, {
				crmItemIds: actualIds
			});
			await tasks_v2_core.Core.getStore().dispatch(`${tasks_v2_const.Model.CrmItems}/upsertMany`, crmItems);
		}
		#listTask(id, crmItemIds) {
			return tasks_v2_lib_apiClient.apiClient.post(tasks_v2_const.Endpoint.TaskCrmItemList, {
				task: {
					id,
					crmItemIds
				}
			});
		}
		#listTemplate(id, crmItemIds) {
			return tasks_v2_lib_apiClient.apiClient.post('Template.CRM.Item.list', {
				template: {
					id: tasks_v2_lib_idUtils.idUtils.unbox(id),
					crmItemIds
				}
			});
		}
	}();

	const CrmMappers = {
		mapId,
		splitId,
		compareIds,
		getEntityTypeId
	};

	exports.CrmMappers = CrmMappers;
	exports.crmService = crmService;

})(this.BX.Tasks.V2.Provider.Service = this.BX.Tasks.V2.Provider.Service || {}, BX.Tasks.V2.Const, BX.Tasks.V2, BX.Tasks.V2.Lib, BX.Tasks.V2.Lib, BX.Tasks.V2.Provider.Service);
//# sourceMappingURL=crm-service.bundle.js.map
