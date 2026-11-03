import { Extension } from 'main.core';

export const SelfDeletePopupScenario = Object.freeze({
	NotLastAdmin: 'NotLastAdmin',
	LastAdminPayedLicense: 'LastAdminPayedLicense',
	LastAdminFreeLicense: 'LastAdminFreeLicense',
	LastAdmin: 'LastAdmin',
});

export const SelfDeletePopupElementId = Object.freeze({
	Popup: 'intranet-self-delete-popup',
	CloseButton: 'intranet-self-delete-popup-close-button',
	Participants: 'intranet-self-delete-popup-participants',
	ParticipantsInput: 'intranet-self-delete-popup-participants-input',
	ParticipantsPopup: 'intranet-self-delete-popup-participants-popup',
	CreateChatButton: 'intranet-self-delete-popup-create-chat-button',
	CancelButton: 'intranet-self-delete-popup-cancel-button',
	OpenSettingsButton: 'intranet-self-delete-popup-open-settings-button',
	TransferRightsButton: 'intranet-self-delete-popup-transfer-rights-button',
	ContinueButton: 'intranet-self-delete-popup-continue-button',
	SupportEmailLink: 'intranet-self-delete-popup-support-email-link',
});

export const DefaultSupportEmail = Extension.getSettings('intranet.user.self-delete-popup').supportEmail
	|| 'privacy@bitrix24.com';

export const PortalDeleteUrl = '/settings/configs/?page=configuration&option=settings-configuration-section-delete-portal';

export const TransferRightsHelpdeskCode = 'redirect=detail&code=26764700';
