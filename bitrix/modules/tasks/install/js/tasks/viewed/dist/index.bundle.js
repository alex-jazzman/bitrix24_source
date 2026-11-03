/* eslint-disable */
this.BX = this.BX || {};
this.BX.Tasks = this.BX.Tasks || {};
(function (exports, main_core) {
	'use strict';

	class Controller {
		userComments(data = {}) {
			return main_core.ajax.runAction('tasks.viewedGroup.user.markAsRead', {
				data: {
					fields: data
				}
			});
		}
		projectComments(data = {}) {
			return main_core.ajax.runAction('tasks.viewedGroup.project.markAsRead', {
				data: {
					fields: data
				}
			});
		}
		scrumComments(data = {}) {
			return main_core.ajax.runAction('tasks.viewedGroup.scrum.markAsRead', {
				data: {
					fields: data
				}
			});
		}
	}

	exports.Controller = Controller;

})(this.BX.Tasks.Viewed = this.BX.Tasks.Viewed || {}, BX);
//# sourceMappingURL=index.bundle.js.map
