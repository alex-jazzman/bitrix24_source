/* eslint-disable */
this.BX = this.BX || {};
this.BX.Tasks = this.BX.Tasks || {};
this.BX.Tasks.V2 = this.BX.Tasks.V2 || {};
(function (exports,ui_vue3_vuex,tasks_v2_const) {
	'use strict';

	/* eslint-disable no-param-reassign */
	class Interface extends ui_vue3_vuex.BuilderModel {
	  static createWithVariables(params) {
	    return Interface.create().setVariables({
	      currentUserId: params.currentUserId,
	      defaultDeadline: params.defaultDeadline
	    });
	  }
	  getName() {
	    return tasks_v2_const.Model.Interface;
	  }
	  getState() {
	    return {
	      currentUserId: this.getVariable('currentUserId', 0),
	      titleFieldOffsetHeight: this.getVariable('titleFieldOffsetHeight', null),
	      defaultDeadline: this.getVariable('defaultDeadline', {
	        defaultDeadlineInSeconds: 0,
	        defaultDeadlineDate: ''
	      })
	    };
	  }
	  getGetters() {
	    return {
	      /** @function interface/currentUserId */
	      currentUserId: state => state.currentUserId,
	      /** @function interface/titleFieldOffsetHeight */
	      titleFieldOffsetHeight: state => state.titleFieldOffsetHeight,
	      /** @function interface/defaultDeadline */
	      defaultDeadline: state => state.defaultDeadline
	    };
	  }
	  getActions() {
	    return {
	      /** @function interface/updateTitleFieldOffsetHeight */
	      updateTitleFieldOffsetHeight: (store, titleFieldOffsetHeight) => {
	        store.commit('setTitleFieldOffsetHeight', titleFieldOffsetHeight);
	      },
	      /** @function interface/updateDefaultDeadline */
	      updateDefaultDeadline: (store, defaultDeadline) => {
	        store.commit('setDefaultDeadline', defaultDeadline);
	      }
	    };
	  }
	  getMutations() {
	    return {
	      setTitleFieldOffsetHeight: (state, titleFieldOffsetHeight) => {
	        state.titleFieldOffsetHeight = titleFieldOffsetHeight;
	      },
	      setDefaultDeadline: (state, defaultDeadline) => {
	        state.defaultDeadline = defaultDeadline;
	      }
	    };
	  }
	}

	exports.Interface = Interface;

}((this.BX.Tasks.V2.Model = this.BX.Tasks.V2.Model || {}),BX.Vue3.Vuex,BX.Tasks.V2.Const));
//# sourceMappingURL=interface.bundle.js.map
