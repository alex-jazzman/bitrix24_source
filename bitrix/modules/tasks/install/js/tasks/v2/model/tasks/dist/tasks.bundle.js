/* eslint-disable */
this.BX = this.BX || {};
this.BX.Tasks = this.BX.Tasks || {};
this.BX.Tasks.V2 = this.BX.Tasks.V2 || {};
(function (exports,ui_vue3_vuex,tasks_v2_const) {
	'use strict';

	/* eslint-disable no-param-reassign */
	class Tasks extends ui_vue3_vuex.BuilderEntityModel {
	  getName() {
	    return tasks_v2_const.Model.Tasks;
	  }
	  getElementState() {
	    return {
	      id: 0,
	      title: '',
	      isImportant: false,
	      description: '',
	      creatorId: 0,
	      createdTs: Date.now(),
	      responsibleId: 0,
	      deadlineTs: 0,
	      fileIds: [],
	      checklist: [],
	      containsChecklist: false,
	      storyPoints: '',
	      epicId: 0,
	      accomplicesIds: [],
	      auditorsIds: [],
	      status: 'pending',
	      statusChangedTs: Date.now(),
	      needsControl: false,
	      filledFields: {},
	      rights: {
	        edit: true,
	        deadline: true,
	        delegate: true
	      }
	    };
	  }
	  getGetters() {
	    return {
	      /** @function tasks/wasFieldFilled */
	      wasFieldFilled: state => (id, fieldName) => {
	        var _state$collection$id$, _state$collection$id$2;
	        return (_state$collection$id$ = (_state$collection$id$2 = state.collection[id].filledFields) == null ? void 0 : _state$collection$id$2[fieldName]) != null ? _state$collection$id$ : false;
	      }
	    };
	  }
	  getActions() {
	    return {
	      /** @function tasks/setFieldFilled */
	      setFieldFilled: (store, {
	        id,
	        fieldName
	      }) => {
	        store.commit('setFieldFilled', {
	          id,
	          fieldName
	        });
	      },
	      /** @function tasks/clearFieldsFilled */
	      clearFieldsFilled: (store, id) => {
	        store.commit('clearFieldsFilled', id);
	      }
	    };
	  }
	  getMutations() {
	    return {
	      upsert: (state, task) => {
	        ui_vue3_vuex.BuilderEntityModel.defaultModel.getMutations(this).upsert(state, task);
	        this.setFieldsFilled(state, task);
	      },
	      update: (state, {
	        id,
	        fields
	      }) => {
	        ui_vue3_vuex.BuilderEntityModel.defaultModel.getMutations(this).update(state, {
	          id,
	          fields
	        });
	        this.setFieldsFilled(state, {
	          id,
	          ...fields
	        });
	      },
	      setFieldFilled: (state, {
	        id,
	        fieldName
	      }) => {
	        var _state$collection$id, _state$collection$id$3;
	        ((_state$collection$id$3 = (_state$collection$id = state.collection[id]).filledFields) != null ? _state$collection$id$3 : _state$collection$id.filledFields = {})[fieldName] = true;
	      },
	      clearFieldsFilled: (state, id) => {
	        if (!state.collection[id]) {
	          return;
	        }
	        state.collection[id].filledFields = {};
	        this.setFieldsFilled(state, state.collection[id]);
	      }
	    };
	  }
	  setFieldsFilled(state, fields) {
	    var _task$rights, _task$filledFields;
	    const task = state.collection[fields.id];
	    const canEdit = task == null ? void 0 : (_task$rights = task.rights) == null ? void 0 : _task$rights.edit;
	    (_task$filledFields = task.filledFields) != null ? _task$filledFields : task.filledFields = {};
	    Object.entries(fields).forEach(([fieldName, value]) => {
	      const isFilled = Boolean(value) && (!Array.isArray(value) || value.length > 0);
	      if (isFilled) {
	        task.filledFields[fieldName] = true;
	      }
	      if (!isFilled && !canEdit) {
	        task.filledFields[fieldName] = false;
	      }
	    });
	  }
	}

	exports.Tasks = Tasks;

}((this.BX.Tasks.V2.Model = this.BX.Tasks.V2.Model || {}),BX.Vue3.Vuex,BX.Tasks.V2.Const));
//# sourceMappingURL=tasks.bundle.js.map
