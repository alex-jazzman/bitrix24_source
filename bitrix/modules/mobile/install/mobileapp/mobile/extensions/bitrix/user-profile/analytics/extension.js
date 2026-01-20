/**
 * @module user-profile/analytics
 */
jn.define('user-profile/analytics', (require, exports, module) => {
	const { AnalyticsEvent } = require('analytics');
	const { isModuleInstalled } = require('module');
	const { TabType } = require('user-profile/const');

	class UserProfileAnalytics extends AnalyticsEvent
	{
		static get Event()
		{
			return {
				PROFILE_VIEW: 'profile_view',
				EDIT_PHOTO: 'edit_photo',
				EDIT_CONTACT_INFO: 'edit_contact_info',
				EDIT_ABOUT_ME: 'edit_about_me',
			};
		}

		static get Type()
		{
			return {
				PERSONAL: 'personal',
				OTHER: 'other',
				PENDING: 'pending',
			};
		}

		getDefaults()
		{
			return {
				tool: 'intranet',
				category: 'user_profile',
				event: null,
				type: null,
				c_section: null,
				c_sub_section: null,
				c_element: null,
				status: null,
				p1: null,
				p2: null,
				p3: null,
				p4: null,
				p5: null,
			};
		}

		/**
		 * @param {int} ownerId
		 * @param {string} inviteStatus
		 * @param {string} section
		 * @returns {void}
		 */
		static sendProfileView(ownerId, inviteStatus, section)
		{
			new this({
				type: UserProfileAnalytics.#getTypeFromInviteStatusAndOwnerId(ownerId, inviteStatus),
				c_section: section,
				event: UserProfileAnalytics.Event.PROFILE_VIEW,
			}).send();
		}

		/**
		 * @param {int} ownerId
		 * @param {string} inviteStatus
		 */
		static #getTypeFromInviteStatusAndOwnerId(ownerId, inviteStatus)
		{
			if (Number(ownerId) === Number(env.userId))
			{
				return UserProfileAnalytics.Type.PERSONAL;
			}

			if (UserProfileAnalytics.#isProfileOwnerHasInvitedStatus(inviteStatus))
			{
				return UserProfileAnalytics.Type.PENDING;
			}

			return UserProfileAnalytics.Type.OTHER;
		}

		static #isProfileOwnerHasInvitedStatus(inviteStatus)
		{
			if (isModuleInstalled('intranet'))
			{
				const { EmployeeStatus } = require('intranet/enum');

				return inviteStatus === EmployeeStatus.INVITED.getName();
			}

			return false;
		}

		static sendEditPhoto()
		{
			new this({
				event: UserProfileAnalytics.Event.EDIT_PHOTO,
			}).send();
		}

		static sendEditContactInfo(changedFieldIds)
		{
			if (!Array.isArray(changedFieldIds))
			{
				return;
			}

			changedFieldIds.forEach((id) => {
				const isCustomField = id.startsWith('UF_USR_');
				new this({
					event: UserProfileAnalytics.Event.EDIT_CONTACT_INFO,
					type: isCustomField ? 'OTHER' : id,
				}).send();
			});
		}

		static sendEditAboutMe()
		{
			new this({
				event: UserProfileAnalytics.Event.EDIT_ABOUT_ME,
			}).send();
		}
	}

	const getInviteStatusFromTabsData = (tabsData) => {
		if (!Array.isArray(tabsData))
		{
			return null;
		}

		const commonTab = tabsData.find((tab) => tab.id === TabType.COMMON);

		return commonTab.params?.data?.statusData?.inviteStatus;
	};

	module.exports = {
		UserProfileAnalytics,
		getInviteStatusFromTabsData,
	};
});
