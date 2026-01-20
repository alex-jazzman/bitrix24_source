/* eslint-disable */
this.BX = this.BX || {};
this.BX.Tasks = this.BX.Tasks || {};
this.BX.Tasks.V2 = this.BX.Tasks.V2 || {};
this.BX.Tasks.V2.Provider = this.BX.Tasks.V2.Provider || {};
(function (exports,tasks_v2_core,tasks_v2_const,tasks_v2_lib_apiClient,tasks_v2_lib_idUtils) {
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
	  var _prefixSortMap$prefix, _prefixSortMap$prefix2;
	  const [prefixA, entityIdA] = idA.split('_');
	  const [prefixB, entityIdB] = idB.split('_');
	  const sortA = (_prefixSortMap$prefix = prefixSortMap[prefixA]) != null ? _prefixSortMap$prefix : getEntityTypeId(idA);
	  const sortB = (_prefixSortMap$prefix2 = prefixSortMap[prefixB]) != null ? _prefixSortMap$prefix2 : getEntityTypeId(idB);
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

	var _listTask, _listTemplate;
	const crmService = new (_listTask = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("listTask"), _listTemplate = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("listTemplate"), class {
	  constructor() {
	    Object.defineProperty(this, _listTemplate, {
	      value: _listTemplate2
	    });
	    Object.defineProperty(this, _listTask, {
	      value: _listTask2
	    });
	  }
	  async list(id, ids) {
	    const data = await (tasks_v2_lib_idUtils.idUtils.isTemplate(id) ? babelHelpers.classPrivateFieldLooseBase(this, _listTemplate)[_listTemplate](id, ids) : babelHelpers.classPrivateFieldLooseBase(this, _listTask)[_listTask](id, ids));
	    const crmItems = data.map(dto => mapDtoToModel(dto));
	    await tasks_v2_core.Core.getStore().dispatch(`${tasks_v2_const.Model.CrmItems}/upsertMany`, crmItems);
	  }
	})();
	function _listTask2(id, crmItemIds) {
	  return tasks_v2_lib_apiClient.apiClient.post(tasks_v2_const.Endpoint.TaskCrmItemList, {
	    task: {
	      id,
	      crmItemIds
	    }
	  });
	}
	function _listTemplate2(id, crmItemIds) {
	  return tasks_v2_lib_apiClient.apiClient.post('Template.CRM.Item.list', {
	    template: {
	      id: tasks_v2_lib_idUtils.idUtils.unbox(id),
	      crmItemIds
	    }
	  });
	}

	const CrmMappers = {
	  mapId,
	  splitId,
	  compareIds,
	  getEntityTypeId
	};

	exports.CrmMappers = CrmMappers;
	exports.crmService = crmService;

}((this.BX.Tasks.V2.Provider.Service = this.BX.Tasks.V2.Provider.Service || {}),BX.Tasks.V2,BX.Tasks.V2.Const,BX.Tasks.V2.Lib,BX.Tasks.V2.Lib));
//# sourceMappingURL=crm-service.bundle.js.map
