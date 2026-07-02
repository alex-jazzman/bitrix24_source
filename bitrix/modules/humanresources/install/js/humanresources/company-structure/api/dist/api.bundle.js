/* eslint-disable */
this.BX = this.BX || {};
this.BX.Humanresources = this.BX.Humanresources || {};
(function (exports, main_core, humanresources_companyStructure_utils, ui_notification, ui_analytics) {
	'use strict';

	const AnalyticsSourceType = Object.freeze({
		HEADER: 'header',
		CARD: 'card',
		DETAIL: 'dept_menu',
		NODE_DETAIL: 'details',
		PLUS: 'plus'
	});

	const memberRolesKeys = Object.freeze({
		employee: 'employee',
		head: 'head',
		deputyHead: 'deputyHead'
	});
	const memberRoles = Object.freeze({
		employee: 'MEMBER_EMPLOYEE',
		head: 'MEMBER_HEAD',
		deputyHead: 'MEMBER_DEPUTY_HEAD'
	});
	const teamMemberRoles = Object.freeze({
		employee: 'MEMBER_TEAM_EMPLOYEE',
		head: 'MEMBER_TEAM_HEAD',
		deputyHead: 'MEMBER_TEAM_DEPUTY_HEAD'
	});
	function getMemberRoles(entityType) {
		return entityType === humanresources_companyStructure_utils.EntityTypes.team ? teamMemberRoles : memberRoles;
	}

	const request = async (method, endPoint, data = {}, analytics = {}) => {
		const config = {
			method
		};
		if (method === 'POST') {
			Object.assign(config, {
				data
			}, {
				headers: [{
					name: 'Content-Type',
					value: 'application/json'
				}]
			});
		}
		let response = null;
		try {
			if (method === 'POST') {
				response = await main_core.ajax.runAction(endPoint, config);
			} else {
				const getConfig = {
					data
				};
				response = await main_core.ajax.runAction(endPoint, getConfig);
			}
		} catch (ex) {
			handleResponseError(ex);
			return null;
		}
		if (analytics?.event?.length > 0) {
			ui_analytics.sendData(analytics);
		}
		return response.data;
	};
	const reportedErrorTypes = new Set(['STRUCTURE_ACCESS_DENIED', 'ERROR_TEAMS_DISABLED']);
	const handleResponseError = response => {
		if (response.errors?.length > 0) {
			const [error] = response.errors;
			if (reportedErrorTypes.has(error.code)) {
				ui_notification.UI.Notification.Center.notify({
					content: error.message,
					autoHideDelay: 4000
				});
			}
			throw error;
		}
	};
	const getData = (endPoint, data, analytics) => request('GET', endPoint, data ?? {}, analytics ?? {});
	const postData = (endPoint, data, analytics) => request('POST', endPoint, data, analytics ?? {});

	exports.AnalyticsSourceType = AnalyticsSourceType;
	exports.getData = getData;
	exports.getMemberRoles = getMemberRoles;
	exports.memberRoles = memberRoles;
	exports.memberRolesKeys = memberRolesKeys;
	exports.postData = postData;
	exports.reportedErrorTypes = reportedErrorTypes;
	exports.teamMemberRoles = teamMemberRoles;

})(this.BX.Humanresources.CompanyStructure = this.BX.Humanresources.CompanyStructure || {}, BX, BX.Humanresources.CompanyStructure, BX.UI.Notification, BX.UI.Analytics);
//# sourceMappingURL=api.bundle.js.map
