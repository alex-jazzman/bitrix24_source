/* eslint-disable */
this.BX = this.BX || {};
this.BX.Calendar = this.BX.Calendar || {};
(function (exports, main_core, ui_analytics) {
	'use strict';

	class Analytics {
		static tool = 'calendar';
		static category = 'calendar';

		/**
		 * Single public entry point for the `calendar` analytics category (TPL-02).
		 * Builds tool/category and valid p-fields, then delegates to ui.analytics sendData.
		 * Consumers (socialnetwork, tasks) call this method with their own cSubSection/cElement.
		 */
		static sendEvent(context) {
			if (!main_core.Type.isPlainObject(context) || !main_core.Type.isStringFilled(context.event)) {
				return;
			}
			const payload = {
				tool: Analytics.tool,
				category: Analytics.category,
				event: context.event
			};
			if (main_core.Type.isStringFilled(context.cSection)) {
				payload.c_section = context.cSection;
			}
			if (main_core.Type.isStringFilled(context.cSubSection)) {
				payload.c_sub_section = context.cSubSection;
			}
			if (main_core.Type.isStringFilled(context.cElement)) {
				payload.c_element = context.cElement;
			}
			if (main_core.Type.isStringFilled(context.type)) {
				payload.type = context.type;
			}
			if (main_core.Type.isStringFilled(context.status)) {
				payload.status = context.status;
			}
			const userType = Analytics.#prepareUserType(context.userType);
			if (userType !== null) {
				payload.p2 = userType;
			}
			const projectId = Analytics.#prepareProjectId(context.projectId);
			if (projectId !== null) {
				payload.p4 = projectId;
			}
			ui_analytics.sendData(payload);
		}

		/**
		 * p2 = user_intranet | user_extranet | user_collaber — exactly one underscore.
		 * @private
		 */
		static #prepareUserType(userType) {
			if (!main_core.Type.isStringFilled(userType)) {
				return null;
			}
			return userType.startsWith('user_') ? userType : `user_${userType}`;
		}

		/**
		 * p4 = projectId_<id группы> — only for project/group context, exactly one underscore.
		 * @private
		 */
		static #prepareProjectId(projectId) {
			const id = parseInt(projectId, 10);
			if (!main_core.Type.isNumber(id) || id <= 0) {
				return null;
			}
			return `projectId_${id}`;
		}
	}

	exports.Analytics = Analytics;

})(this.BX.Calendar.Analytics = this.BX.Calendar.Analytics || {}, BX, BX.UI.Analytics);
//# sourceMappingURL=analytics.bundle.js.map
