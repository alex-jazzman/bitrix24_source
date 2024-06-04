import { Loc, Browser } from 'main.core';

import { ButtonColor } from 'im.v2.component.elements';
import { Await, Failure, Success } from './sign';

export const metaData = {
	[Await.inviteCompany]: {
		title: Loc.getMessage('IM_MESSAGE_SIGN_INVITE_COMPANY_TITLE'),
		description: Loc.getMessage('IM_MESSAGE_SIGN_INVITE_COMPANY_DESCRIPTION'),
		button: {
			text: Loc.getMessage('IM_MESSAGE_SIGN_INVITE_COMPANY_BUTTON_TEXT'),
			callback: ({ user, document }) => {
				goToPrimaryLink(document, true);
			},
			color: ButtonColor.Primary,
		},
	},
	[Await.inviteEmployeeSes]: {
		title: Loc.getMessage('IM_MESSAGE_SIGN_INVITE_EMPLOYEE_SES_TITLE'),
		description: Loc.getMessage('IM_MESSAGE_SIGN_INVITE_EMPLOYEE_SES_DESCRIPTION'),
		button: {
			text: Loc.getMessage('IM_MESSAGE_SIGN_INVITE_EMPLOYEE_SES_BUTTON_TEXT'),
			callback: ({ user, document }) => {
				goToPrimaryLink(document, true);
			},
			color: ButtonColor.Primary,
		},
	},
	[Await.inviteEmployeeTaxcom]: {
		title: Loc.getMessage('IM_MESSAGE_SIGN_INVITE_EMPLOYEE_TAXCOM_TITLE'),
		description: Loc.getMessage('IM_MESSAGE_SIGN_INVITE_EMPLOYEE_TAXCOM_DESCRIPTION'),
		button: {
			text: Loc.getMessage('IM_MESSAGE_SIGN_INVITE_EMPLOYEE_TAXCOM_BUTTON_TEXT'),
			callback: ({ user, document }) => {
				goToPrimaryLink(document, true);
			},
			color: ButtonColor.Primary,
		},
	},
	[Await.inviteEmployeeGosKey]: {
		title: Loc.getMessage('IM_MESSAGE_SIGN_INVITE_EMPLOYEE_GOS_KEY_TITLE'),
		description: Loc.getMessage('IM_MESSAGE_SIGN_INVITE_EMPLOYEE_GOS_KEY_DESCRIPTION'),
		button: null,
	},
	[Await.inviteReviewer]: {
		title: Loc.getMessage('IM_MESSAGE_SIGN_INVITE_REVIEWER_TITLE'),
		description: Loc.getMessage('IM_MESSAGE_SIGN_INVITE_REVIEWER_DESCRIPTION_MSGVER_1'),
		button: {
			text: Loc.getMessage('IM_MESSAGE_SIGN_INVITE_REVIEWER_BUTTON_TEXT'),
			callback: ({ user, document }) => {
				goToPrimaryLink(document, true);
			},
			color: ButtonColor.Primary,
		},
	},
	[Await.inviteEditor]: {
		title: Loc.getMessage('IM_MESSAGE_SIGN_INVITE_EDITOR_TITLE'),
		description: Loc.getMessage('IM_MESSAGE_SIGN_INVITE_EDITOR_DESCRIPTION'),
		button: {
			text: Loc.getMessage('IM_MESSAGE_SIGN_INVITE_EDITOR_BUTTON_TEXT'),
			callback: ({ user, document }) => {
				goToPrimaryLink(document, true);
			},
			color: ButtonColor.Primary,
		},
	},
	[Success.doneCompany]: {
		title: Loc.getMessage('IM_MESSAGE_SIGN_DONE_COMPANY_TITLE'),
		description: Loc.getMessage('IM_MESSAGE_SIGN_DONE_COMPANY_DESCRIPTION'),
		button: {
			text: Loc.getMessage('IM_MESSAGE_SIGN_DONE_COMPANY_BUTTON_TEXT'),
			callback: ({ user, document }) => {
				goToPrimaryLink(document, false);
			},
			color: ButtonColor.PrimaryBorder,
		},
	},
	[Success.doneEmployee]: {
		title: Loc.getMessage('IM_MESSAGE_SIGN_DONE_EMPLOYEE_TITLE'),
		description: Loc.getMessage('IM_MESSAGE_SIGN_DONE_EMPLOYEE_DESCRIPTION'),
		button: {
			text: Loc.getMessage('IM_MESSAGE_SIGN_DONE_EMPLOYEE_BUTTON_TEXT'),
			callback: ({ user, document }) => {
				goToPrimaryLink(document, true);
			},
			color: ButtonColor.PrimaryBorder,
		},
	},
	[Success.doneEmployeeGosKey]: {
		title: Loc.getMessage('IM_MESSAGE_SIGN_DONE_EMPLOYEE_GOS_KEY_TITLE'),
		description: Loc.getMessage('IM_MESSAGE_SIGN_DONE_EMPLOYEE_GOS_KEY_DESCRIPTION'),
		button: {
			text: Loc.getMessage('IM_MESSAGE_SIGN_DONE_EMPLOYEE_GOS_KEY_BUTTON_TEXT'),
			callback: ({ user, document }) => {
				goToPrimaryLink(document, true);
			},
			color: ButtonColor.PrimaryBorder,
		},
	},
	[Success.doneFromAssignee]: {
		title: Loc.getMessage('IM_MESSAGE_SIGN_DONE_FROM_ASSIGNEE_TITLE'),
		description: Loc.getMessage('IM_MESSAGE_SIGN_DONE_FROM_ASSIGNEE_DESCRIPTION'),
		button: null,
	},
	[Success.doneFromEditor]: {
		title: Loc.getMessage('IM_MESSAGE_SIGN_DONE_FROM_EDITOR_TITLE'),
		description: Loc.getMessage('IM_MESSAGE_SIGN_DONE_FROM_EDITOR_DESCRIPTION'),
		button: null,
	},
	[Success.doneFromReviewer]: {
		title: Loc.getMessage('IM_MESSAGE_SIGN_DONE_FROM_REVIEWER_TITLE'),
		description: Loc.getMessage('IM_MESSAGE_SIGN_DONE_FROM_REVIEWER_DESCRIPTION_MSGVER_1'),
		button: null,
	},
	[Failure.refusedCompany]: {
		title: Loc.getMessage('IM_MESSAGE_SIGN_REFUSED_COMPANY_TITLE'),
		description: Loc.getMessage('IM_MESSAGE_SIGN_REFUSED_COMPANY_DESCRIPTION'),
		button: null,
	},
	[Failure.employeeStoppedToCompany]: {
		title: Loc.getMessage('IM_MESSAGE_SIGN_EMPLOYEE_STOPPED_TO_COMPANY_TITLE'),
		description: Loc.getMessage('IM_MESSAGE_SIGN_EMPLOYEE_STOPPED_TO_COMPANY_DESCRIPTION'),
		button: null,
	},
	[Failure.documentStopped]: {
		title: Loc.getMessage('IM_MESSAGE_SIGN_DOCUMENT_STOPPED_TITLE'),
		description: Loc.getMessage('IM_MESSAGE_SIGN_DOCUMENT_STOPPED_DESCRIPTION'),
		button: null,
	},
};

function goToPrimaryLink(document: { link: string }, openInSlider: boolean = false)
{
	if (document.link !== undefined)
	{
		if (!Browser.isMobile() && openInSlider)
		{
			openLinkInSlider(document.link);
		}
		else
		{
			window.open(document.link);
		}
	}
}

function openLinkInSlider(link: string)
{
	if (!isValidSigningLink(link))
	{
		return;
	}

	BX.SidePanel.Instance.open('sign:stub:sign-link', {
		width: 900,
		cacheable: false,
		allowCrossOrigin: true,
		allowCrossDomain: true,
		allowChangeHistory: false,
		newWindowUrl: link,
		copyLinkLabel: true,
		newWindowLabel: true,
		loader: '/bitrix/js/intranet/sidepanel/bindings/images/sign_mask.svg',
		label: {
			text: Loc.getMessage('IM_MESSAGE_SIGN_SIDEPANEL_BTN_SIGN'),
			bgColor: '#C48300',
		},
		contentCallback(slider): Promise {
			return BX.Runtime.loadExtension('sign.v2.b2e.sign-link').then((exports) => {
				const memberIdFromLinkToSigning = /\/sign\/link\/member\/(\d+)\//i.exec(link);

				return (new exports.SignLink({ memberId: memberIdFromLinkToSigning[1], slider }))
					.render()
				;
			});
		},
	});
}

function isValidSigningLink(link: string): boolean
{
	return /^\/sign\/link\/member\/\d+\/$/.test(link);
}
