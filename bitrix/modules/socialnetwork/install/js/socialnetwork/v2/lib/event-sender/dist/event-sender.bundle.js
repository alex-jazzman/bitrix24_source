/* eslint-disable */
this.BX = this.BX || {};
this.BX.Socialnetwork = this.BX.Socialnetwork || {};
this.BX.Socialnetwork.V2 = this.BX.Socialnetwork.V2 || {};
(function (exports, main_core, ui_analytics) {
	'use strict';

	const VIEW_DEDUP_WINDOW_MS = 1000;
	class ProjectAnalytics {
		#isDemo;
		#userType;
		#lastViewEntityId = null;
		#lastViewAt = 0;
		constructor() {
			const settings = main_core.Extension.getSettings('socialnetwork.v2.lib.event-sender');
			this.#isDemo = main_core.Type.isStringFilled(settings.isDemo) ? settings.isDemo : 'N';
			this.#userType = main_core.Type.isStringFilled(settings.userType) ? settings.userType : '';
		}
		trackArchive(entityId, status) {
			this.#sendContextMenuAction('project_archive', entityId, status);
		}
		trackUnarchive(entityId, status) {
			this.#sendContextMenuAction('project_unarchive', entityId, status);
		}
		trackDelete(entityId, status) {
			this.#sendContextMenuAction('project_delete', entityId, status);
		}
		trackView(entityId) {
			if (this.#isViewDuplicate(entityId)) {
				return;
			}
			this.#send({
				event: 'project_view',
				entityId,
				status: 'success'
			});
		}
		trackCreateStart(context) {
			this.#send({
				event: 'project_create_start',
				entityId: 0,
				status: 'success',
				element: context?.element,
				kind: context?.kind
			});
		}
		trackCreateFinish(entityId, status, properties) {
			this.#send({
				event: 'project_create_finish',
				entityId,
				status,
				p5: buildProjectProperties(properties)
			});
		}
		#sendContextMenuAction(event, entityId, status) {
			this.#send({
				event,
				entityId,
				status,
				element: 'context_menu'
			});
		}
		#isViewDuplicate(entityId) {
			const key = String(entityId);
			const now = Date.now();
			if (key === this.#lastViewEntityId && now - this.#lastViewAt < VIEW_DEDUP_WINDOW_MS) {
				return true;
			}
			this.#lastViewEntityId = key;
			this.#lastViewAt = now;
			return false;
		}
		#send({
			event,
			entityId,
			status,
			element,
			p5,
			kind
		}) {
			const payload = {
				tool: 'projects',
				category: 'project',
				event,
				c_section: 'project',
				status: status,
				p1: `isDemo_${this.#isDemo}`,
				p2: this.#userType,
				p4: `projectId_${entityId}`
			};
			if (main_core.Type.isStringFilled(element)) {
				payload.c_element = element;
			}
			if (main_core.Type.isStringFilled(p5)) {
				payload.p5 = p5;
			}
			if (main_core.Type.isStringFilled(kind)) {
				payload.type = kind;
			}
			ui_analytics.sendData(payload);
		}
	}
	function buildProjectProperties(properties) {
		const payload = {
			owner_change: properties.ownerChange,
			moderators: properties.moderators,
			participants: properties.participants,
			departments: properties.departments,
			project_type: properties.projectType,
			main_tool: properties.mainTool,
			access_rights_state: properties.accessRightsState,
			additional_settings_calendar: properties.additionalSettingsCalendar,
			additional_settings_auto_delete: properties.additionalSettingsAutoDelete
		};
		return JSON.stringify(payload).replace(/_/g, '-');
	}
	class SectionAnalytics {
		#isDemo;
		#userType;
		constructor() {
			const settings = main_core.Extension.getSettings('socialnetwork.v2.lib.event-sender');
			this.#isDemo = main_core.Type.isStringFilled(settings.isDemo) ? settings.isDemo : 'N';
			this.#userType = main_core.Type.isStringFilled(settings.userType) ? settings.userType : '';
		}
		trackOpen(config, projectId) {
			const payload = {
				tool: config.tool,
				category: config.category ?? '',
				event: config.event,
				c_section: 'project',
				c_element: config.cElement,
				status: 'success',
				p1: `isDemo_${this.#isDemo}`,
				p2: this.#userType,
				p4: `projectId_${projectId}`
			};
			ui_analytics.sendData(payload);
		}
	}
	function trackProjectCreateStart(context) {
		new ProjectAnalytics().trackCreateStart(context);
	}
	function trackOpenSection(config) {
		const settings = main_core.Extension.getSettings('socialnetwork.v2.lib.event-sender');
		const isDemo = main_core.Type.isStringFilled(settings.isDemo) ? settings.isDemo : 'N';
		const userType = main_core.Type.isStringFilled(settings.userType) ? settings.userType : '';
		const payload = {
			tool: config.tool,
			category: config.category ?? '',
			event: config.event,
			c_section: config.cSection,
			c_element: config.cElement,
			status: 'success',
			p1: `isDemo_${isDemo}`,
			p2: userType
		};
		ui_analytics.sendData(payload);
	}

	exports.ProjectAnalytics = ProjectAnalytics;
	exports.SectionAnalytics = SectionAnalytics;
	exports.trackOpenSection = trackOpenSection;
	exports.trackProjectCreateStart = trackProjectCreateStart;

})(this.BX.Socialnetwork.V2.Lib = this.BX.Socialnetwork.V2.Lib || {}, BX, BX.UI.Analytics);
//# sourceMappingURL=event-sender.bundle.js.map
