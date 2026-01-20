/* eslint-disable */
this.BX = this.BX || {};
this.BX.Tasks = this.BX.Tasks || {};
this.BX.Tasks.V2 = this.BX.Tasks.V2 || {};
(function (exports,ui_vue3_vuex,tasks_v2_const,tasks_v2_provider_service_userService) {
	'use strict';

	class Users extends ui_vue3_vuex.BuilderEntityModel {
	  static createWithCurrentUser(userDto) {
	    return Users.create().setVariables({
	      currentUser: tasks_v2_provider_service_userService.UserMappers.mapDtoToModel(userDto)
	    });
	  }
	  getName() {
	    return tasks_v2_const.Model.Users;
	  }
	  getState() {
	    const currentUser = this.getVariable('currentUser', null);
	    return {
	      collection: {
	        [currentUser.id]: currentUser
	      }
	    };
	  }
	  getElementState() {
	    return {
	      id: 0,
	      name: '',
	      image: '',
	      type: ''
	    };
	  }
	}

	const UserTypes = Object.freeze({
	  Employee: 'employee',
	  Collaber: 'collaber',
	  Extranet: 'extranet'
	});

	exports.Users = Users;
	exports.UserTypes = UserTypes;

}((this.BX.Tasks.V2.Model = this.BX.Tasks.V2.Model || {}),BX.Vue3.Vuex,BX.Tasks.V2.Const,BX.Tasks.V2.Provider.Service));
//# sourceMappingURL=users.bundle.js.map
