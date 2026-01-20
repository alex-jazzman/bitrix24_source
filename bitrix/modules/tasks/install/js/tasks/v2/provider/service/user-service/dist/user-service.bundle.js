/* eslint-disable */
this.BX = this.BX || {};
this.BX.Tasks = this.BX.Tasks || {};
this.BX.Tasks.V2 = this.BX.Tasks.V2 || {};
this.BX.Tasks.V2.Provider = this.BX.Tasks.V2.Provider || {};
(function (exports,main_core,tasks_v2_const,tasks_v2_core,tasks_v2_lib_apiClient) {
	'use strict';

	function mapDtoToModel(userDto) {
	  var _userDto$image;
	  return {
	    id: userDto.id,
	    name: userDto.name,
	    image: (_userDto$image = userDto.image) == null ? void 0 : _userDto$image.src,
	    type: userDto.type
	  };
	}
	function mapModelToDto(user) {
	  return {
	    id: user.id,
	    name: user.name,
	    image: {
	      src: user.image
	    },
	    type: user.type
	  };
	}

	var _getUnloadedIds = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("getUnloadedIds");
	class UserService {
	  constructor() {
	    Object.defineProperty(this, _getUnloadedIds, {
	      value: _getUnloadedIds2
	    });
	  }
	  getUrl(id) {
	    const settings = main_core.Extension.getSettings('tasks.v2.application.task-card');
	    const urlTemplate = settings.userDetailUrlTemplate;
	    if (!urlTemplate) {
	      return `/company/personal/user/${id}/`;
	    }
	    return urlTemplate.replace('#USER_ID#', String(id));
	  }
	  async list(ids) {
	    const unloadedIds = babelHelpers.classPrivateFieldLooseBase(this, _getUnloadedIds)[_getUnloadedIds](ids);
	    if (unloadedIds.length === 0) {
	      return;
	    }
	    try {
	      const data = await tasks_v2_lib_apiClient.apiClient.post(tasks_v2_const.Endpoint.UserList, {
	        ids: unloadedIds
	      });
	      const users = data.map(user => mapDtoToModel(user));
	      await this.$store.dispatch(`${tasks_v2_const.Model.Users}/upsertMany`, users);
	    } catch (error) {
	      console.error('UserService: list error', error);
	    }
	  }
	  hasUsers(ids) {
	    return babelHelpers.classPrivateFieldLooseBase(this, _getUnloadedIds)[_getUnloadedIds](ids).length === 0;
	  }
	  get $store() {
	    return tasks_v2_core.Core.getStore();
	  }
	}
	function _getUnloadedIds2(ids) {
	  const loadedUsers = this.$store.getters[`${tasks_v2_const.Model.Users}/getByIds`](ids);
	  const loadedIds = new Set(loadedUsers.map(({
	    id
	  }) => id));
	  return ids.filter(id => !loadedIds.has(id));
	}
	const userService = new UserService();

	const UserMappers = {
	  mapDtoToModel,
	  mapModelToDto
	};

	exports.UserMappers = UserMappers;
	exports.userService = userService;

}((this.BX.Tasks.V2.Provider.Service = this.BX.Tasks.V2.Provider.Service || {}),BX,BX.Tasks.V2.Const,BX.Tasks.V2,BX.Tasks.V2.Lib));
//# sourceMappingURL=user-service.bundle.js.map
