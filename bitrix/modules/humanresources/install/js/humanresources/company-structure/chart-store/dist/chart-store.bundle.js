/* eslint-disable */
this.BX = this.BX || {};
this.BX.Humanresources = this.BX.Humanresources || {};
(function (exports,main_core,ui_vue3_pinia,humanresources_companyStructure_api,humanresources_companyStructure_utils) {
	'use strict';

	const useChartStore = ui_vue3_pinia.defineStore('hr-org-chart', {
	  state: () => ({
	    departments: new Map(),
	    // list of all entities of structures visible to the user with detailed information
	    currentDepartments: [],
	    focusedNode: 0,
	    searchedUserId: 0,
	    userId: 0,
	    /** @var Map<number, { id: number, parentId: number, entityType: string }> */
	    structureMap: new Map() // map of the entire structure (all entities) with minimal information
	  }),

	  actions: {
	    async refreshDepartments(nodeIds) {
	      if (nodeIds.length === 0) {
	        return;
	      }
	      const [departments, currentDepartments] = await Promise.all([humanresources_companyStructure_api.getData('humanresources.api.Structure.Node.getByIds', {
	        nodeIds
	      }), humanresources_companyStructure_api.getData('humanresources.api.Structure.Node.current')]);
	      this.currentDepartments = currentDepartments;
	      Object.keys(departments).forEach(id => {
	        const department = departments[id];
	        const existingDepartment = this.departments.get(Number(id)) || {};
	        this.departments.set(Number(id), {
	          ...existingDepartment,
	          ...department,
	          heads: department.heads,
	          userCount: department.userCount,
	          employees: [],
	          employeeListOptions: {
	            page: 0,
	            shouldUpdateList: true,
	            isListUpdated: false
	          }
	        });
	      });
	    },
	    changeCurrentDepartment(oldDepartmentId, newDepartmentId) {
	      const currentDepartments = this.currentDepartments.filter(departmentId => {
	        return departmentId !== oldDepartmentId && departmentId !== newDepartmentId;
	      });
	      if (!newDepartmentId) {
	        this.currentDepartments = currentDepartments;
	        return;
	      }
	      this.currentDepartments = [...currentDepartments, newDepartmentId];
	    },
	    async loadHeads(nodeIds) {
	      if (nodeIds.length === 0) {
	        return;
	      }
	      const heads = await humanresources_companyStructure_api.getData('humanresources.api.Structure.Node.getHeadsByIds', {
	        nodeIds
	      });
	      nodeIds.forEach(departmentId => {
	        const department = this.departments.get(departmentId);
	        if (heads[departmentId]) {
	          this.departments.set(departmentId, {
	            ...department,
	            heads: heads[departmentId]
	          });
	        }
	      });
	    },
	    updateDepartment(departmentData, position) {
	      const {
	        id,
	        parentId
	      } = departmentData;
	      const oldData = this.departments.get(id);
	      const entityType = oldData.entityType;
	      const prevParent = this.departments.get(oldData.parentId);
	      this.departments.set(id, {
	        ...oldData,
	        ...departmentData
	      });
	      this.structureMap.set(id, {
	        id,
	        parentId: parentId != null ? parentId : oldData.parentId,
	        entityType
	      });
	      if (parentId !== 0 && prevParent.id !== parentId) {
	        var _newParent$children;
	        prevParent.children = prevParent.children.filter(childId => childId !== id);
	        const newParent = this.departments.get(parentId);
	        newParent.children = (_newParent$children = newParent.children) != null ? _newParent$children : [];
	        if (main_core.Type.isNumber(position)) {
	          newParent.children.splice(position, 0, id);
	        } else {
	          newParent.children.push(id);
	        }
	        this.departments.set(id, {
	          ...this.departments.get(id),
	          prevParentId: prevParent.id
	        });
	      }
	    }
	  }
	});

	exports.useChartStore = useChartStore;

}((this.BX.Humanresources.CompanyStructure = this.BX.Humanresources.CompanyStructure || {}),BX,BX.Vue3.Pinia,BX.Humanresources.CompanyStructure,BX.Humanresources.CompanyStructure));
//# sourceMappingURL=chart-store.bundle.js.map
