/* eslint-disable */
this.BX = this.BX || {};
(function (exports, main_core, calendar_compacteventform, calendar_entry, calendar_util, calendar_sectionmanager) {
	'use strict';

	class LightCalendarContext {
		constructor(options = {}) {
			this.isCollabUser = options.isCollabUser || false;
			this.roomsManager = options.roomsManager || null;
			this.categoryManager = null;
			const type = options.type || 'user';
			const ownerId = parseInt(options.ownerId, 10) || 0;
			const userId = parseInt(options.userId, 10) || 0;
			calendar_util.Util.setCalendarContext(this);
			this.sectionManager = new calendar_sectionmanager.SectionManager({
				sections: options.sections || []
			}, {
				hiddenSections: options.hiddenSections || [],
				type,
				ownerId,
				userId
			});
			this.util = {
				type,
				ownerId,
				userId,
				config: {
					locationAccess: options.locationAccess || false,
					isCollabFeatureEnabled: options.isCollabFeatureEnabled || false,
					projectFeatureEnabled: options.projectFeatureEnabled || false,
					isNewProjectsOn: options.isNewProjectsOn || false,
					settings: options.settings || {},
					perm: options.perm || {}
				},
				userIsOwner() {
					return this.type === 'user' && this.userId === this.ownerId;
				},
				isUserCalendar() {
					return this.type === 'user';
				}
			};
		}
		get sectionController() {
			return this.sectionManager;
		}
		getCalendarType() {
			return this.util.type;
		}
		getOwnerId() {
			return this.util.ownerId;
		}
		getUserId() {
			return this.util.userId;
		}
		getView() {
			return {
				getEntryById: () => null
			};
		}
		reload() {}
		reloadDebounce() {}
		getDisplayedViewRange() {
			return {};
		}
		isExternalMode() {
			return false;
		}
	}

	class CompactFormLauncher {
		#type;
		#ownerId;
		#userId;
		#data = null;
		#formInstance = null;
		#lightContext = null;
		async showNewEventForm(params = {}) {
			await this.#loadData();
			return this.#showForm('edit', {
				...params,
				entry: null
			});
		}
		async showEventForm(entryData, params = {}) {
			await this.#loadData();
			return this.#showForm('view', {
				...params,
				entry: entryData
			});
		}
		destroy() {
			if (this.#formInstance) {
				this.#formInstance.close();
				this.#formInstance = null;
			}
			this.#data = null;
		}
		async #loadData() {
			if (this.#formInstance) {
				return;
			}
			const response = await main_core.ajax.runAction('calendar.api.calendarajax.getStandaloneCompactFormData');
			if (!response?.data) {
				throw new Error('Failed to load compact form data');
			}
			this.#data = response.data;
			this.#userId = this.#data.userId || this.#userId;
			if (!this.#ownerId) {
				this.#ownerId = this.#userId;
			}
			this.#applyData();
		}
		#applyData() {
			// 1. Set user settings
			calendar_util.Util.setUserSettings(this.#data.userSettings);
			calendar_util.Util.setEventWithEmailGuestEnabled(this.#data.eventWithEmailGuestEnabled);

			// 2. Set user index
			calendar_entry.EntryManager.setUserIndex(this.#data.userIndex);

			// 3. Reuse the calendar context of the page, or set a light one of our own
			if (calendar_util.Util.getCalendarContext()) {
				this.#lightContext = calendar_util.Util.getCalendarContext();
				this.#refreshLightContext();
			} else {
				this.#lightContext = new LightCalendarContext({
					type: this.#type,
					ownerId: this.#ownerId,
					userId: this.#userId,
					isCollabUser: this.#data.isCollabUser || false,
					hiddenSections: this.#data.hiddenSections || [],
					sections: this.#data.sections || [],
					roomsManager: null,
					locationAccess: this.#data.locationAccess || false,
					isCollabFeatureEnabled: this.#data.isCollabFeatureEnabled || false,
					projectFeatureEnabled: this.#data.projectFeatureEnabled || false,
					isNewProjectsOn: this.#data.isNewProjectsOn || false,
					settings: this.#data.userSettings || {},
					perm: this.#data.perm || {}
				});
				calendar_util.Util.setCalendarContext(this.#lightContext);
			}
		}

		// the light context of an earlier bootstrap keeps the data it was built with; a context
		// of the calendar itself maintains its own and is left alone
		#refreshLightContext() {
			if (!(this.#lightContext instanceof LightCalendarContext)) {
				return;
			}
			this.#lightContext.isCollabUser = this.#data.isCollabUser || false;
			this.#lightContext.sectionManager.setSections(this.#data.sections || []);
			this.#lightContext.sectionManager.sortSections();
		}
		#showForm(mode, params) {
			const sections = this.#lightContext.sectionManager.getSections();
			if (sections.length === 0) {
				throw new Error('CompactFormLauncher: no calendar section is available for the current user');
			}
			this.#formInstance ??= new calendar_compacteventform.CompactEventForm({
				type: this.#type,
				ownerId: this.#ownerId,
				userId: this.#userId
			});
			const showParams = {
				type: this.#type,
				ownerId: this.#ownerId,
				userId: this.#userId,
				sections,
				trackingUserList: this.#data.trackingUsersList || [],
				userSettings: this.#data.userSettings,
				locationFeatureEnabled: this.#data.locationFeatureEnabled || false,
				locationList: this.#data.locationList || [],
				plannerFeatureEnabled: this.#data.plannerFeatureEnabled || false,
				...params
			};
			const formMode = main_core.Type.isString(mode) && mode === 'view' ? calendar_compacteventform.CompactEventForm.VIEW_MODE : calendar_compacteventform.CompactEventForm.EDIT_MODE;

			// a form that failed to open is already torn down, so the next call starts over from a fresh
			// bootstrap instead of reusing the data the failure was seen with
			return this.#formInstance.show(formMode, showParams).catch(error => {
				this.#formInstance = null;
				this.#data = null;
				throw error;
			});
		}
	}

	exports.CompactFormLauncher = CompactFormLauncher;

})(this.BX.Calendar = this.BX.Calendar || {}, BX, BX.Calendar, BX.Calendar, BX.Calendar, BX.Calendar);
//# sourceMappingURL=compacteventform-launcher.bundle.js.map
