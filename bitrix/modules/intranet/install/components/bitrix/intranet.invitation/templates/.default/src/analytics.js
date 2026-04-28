import { sendData } from 'ui.analytics';
import DepartmentControl from 'intranet.department-control';
import InviteType from './type/invite-type';

export class Analytics
{
	static TOOLS = 'Invitation';
	static TOOLS_HEADER = 'headerPopup';
	static EVENT_OPEN_SLIDER_INVITATION = 'drawer_open';
	static CATEGORY_INVITATION = 'invitation';
	static CATEGORY_SETTINGS = 'settings';
	static EVENT_COPY = 'copy_invitation_link';
	static ADMIN_ALLOW_MODE_Y = 'askAdminToAllow_Y';
	static ADMIN_ALLOW_MODE_N = 'askAdminToAllow_N';
	static IS_ADMIN_Y = 'isAdmin_Y';
	static IS_ADMIN_N = 'isAdmin_N';

	static EVENT_TAB_VIEW = 'tab_view';
	static EVENT_LOCAL_MAIL = 'invitation_local_mail';
	static EVENT_REFRESH_LINK = 'refresh_link';
	static TAB_EMAIL = 'tab_by_email';
	static TAB_MASS = 'tab_mass';
	static TAB_MASS_EMAIL = 'tab_mass_by_email';
	static TAB_MASS_EMAIL_PHONE = 'tab_mass_by_email_phone';
	static TAB_MASS_PHONE = 'tab_mass_by_phone';
	static TAB_DEPARTMENT = 'tab_department';
	static TAB_INTEGRATOR = 'tab_integrator';
	static TAB_LINK = 'by_link';
	static TAB_REGISTRATION = 'registration';
	static TAB_EXTRANET = 'extranet';
	static TAB_AD = 'AD';
	static TAB_LOCAL_EMAIL = 'tab_by_local_email';
	static TAB_PHONE = 'tab_by_phone';

	#cSection: Object;
	#isAdmin: boolean;

	constructor(cSection: Object, isAdmin: boolean)
	{
		this.#cSection = cSection;
		this.#isAdmin = isAdmin;
	}

	getDataForAction(type: ?string = null): Object
	{
		return {
			section: this.#getCSection(),
			type,
		};
	}

	#getIsAdmin(): string
	{
		return this.#isAdmin ? Analytics.IS_ADMIN_Y : Analytics.IS_ADMIN_N;
	}

	#getCSection(): string
	{
		return this.#cSection.source;
	}

	sendCopyLink(departmentControl: DepartmentControl, needConfirmRegistration: boolean): void
	{
		sendData({
			tool: Analytics.TOOLS,
			category: Analytics.CATEGORY_INVITATION,
			event: Analytics.EVENT_COPY,
			c_section: this.#getCSection(),
			c_sub_section: Analytics.TAB_LINK,
			p1: this.#getIsAdmin(),
			p2: needConfirmRegistration ? Analytics.ADMIN_ALLOW_MODE_Y : Analytics.ADMIN_ALLOW_MODE_N,
			...this.#getDepartmentControlAnalytics(departmentControl),
		});
	}

	sendTabData(section, subSection): void
	{
		if (!section)
		{
			return;
		}

		sendData({
			tool: Analytics.TOOLS,
			category: Analytics.CATEGORY_INVITATION,
			event: Analytics.EVENT_TAB_VIEW,
			c_section: section,
			c_sub_section: subSection,
		});
	}

	sendOpenSliderData(section): void
	{
		sendData({
			tool: Analytics.TOOLS,
			category: Analytics.CATEGORY_INVITATION,
			event: Analytics.EVENT_OPEN_SLIDER_INVITATION,
			c_section: section,
		});
	}

	sendOpenMassInvitePopup(inviteType: InviteType): void
	{
		sendData({
			tool: Analytics.TOOLS,
			category: Analytics.CATEGORY_INVITATION,
			event: Analytics.EVENT_TAB_VIEW,
			c_section: this.#getCSection(),
			c_sub_section: inviteType === InviteType.EMAIL
				? Analytics.TAB_MASS_EMAIL
				: (inviteType === InviteType.PHONE ? Analytics.TAB_MASS_PHONE : Analytics.TAB_MASS_EMAIL_PHONE),
		});
	}

	sendLocalEmailProgram(departmentControl: DepartmentControl, needConfirmRegistration: boolean): void
	{
		sendData({
			tool: Analytics.TOOLS,
			category: Analytics.CATEGORY_INVITATION,
			event: Analytics.EVENT_LOCAL_MAIL,
			c_section: this.#getCSection(),
			c_sub_section: Analytics.TAB_LOCAL_EMAIL,
			p1: this.#getIsAdmin(),
			p2: needConfirmRegistration ? Analytics.ADMIN_ALLOW_MODE_Y : Analytics.ADMIN_ALLOW_MODE_N,
			...this.#getDepartmentControlAnalytics(departmentControl),
		});
	}

	sendRegenerateLink(): void
	{
		sendData({
			tool: Analytics.TOOLS,
			category: Analytics.CATEGORY_SETTINGS,
			event: Analytics.EVENT_REFRESH_LINK,
			c_section: this.#getCSection(),
		});
	}

	#getDepartmentControlAnalytics(departmentControl: DepartmentControl): Object
	{
		return {
			p3: departmentControl.getValues().length > 0 ? 'department_Y' : 'department_N',
			p4: departmentControl.getGroupValues().length > 0 ? 'group_Y' : 'group_N',
		};
	}
}
