/* eslint-disable no-unused-vars */

type ChatInviteProps = {
	dialogId: DialogId,
	store: MessengerCoreStore,
	parentLayout?: LayoutWidget,
};

type GuestsTabControllerProps = {
	parentLayout?: LayoutWidget,
	layout: LayoutWidget,
	boxLayout: LayoutWidget,
	dialogId: DialogId,
	store: MessengerCoreStore,
};

type GuestsTabViewProps = {
	getTestId: (suffix?: string) => string,
	onInviteByLink: () => Promise<void>,
	onRegenerateLink: () => void,
	onOpenCasesMenu: (targetRef: any) => Promise<void>,
};

type EmployeesTabControllerProps = {
	dialogId: DialogId,
	store: MessengerCoreStore,
	onCloseWidget: () => void,
};

type SuccessInvitationToastParams = {
	dialogId: DialogId,
	multipleInvitation: boolean,
	isTextForInvite?: boolean,
};

type InviteCasesMenuParams = {
	getTestId: (suffix?: string) => string,
	onSelectContacts: () => void,
	onSelectEmail: () => Promise<void>,
	onSelectQR: () => Promise<void>,
};

type DismissAlertConfig = {
	title: string,
	description: string,
	destructiveButtonText: string,
	defaultButtonText: string,
};

type InviteCasesMenuItem = {
	id: string,
	testId: string,
	title: string,
	iconName: string,
	onItemSelected: () => void,
};

type ChatInviteTab = {
	id: string,
	title: string,
	active?: boolean,
};

type ChatInviteTabsData = {
	items: Array<{
		id: string,
		title: string,
		active: boolean,
		widget: object,
	}>,
};

type SmartphoneContact = {
	phone: string,
	name?: string,
};

type NameCheckerPhoneUser = {
	id: string,
	phone: string,
	firstName: string | null,
	formattedPhone: string,
};

type NameCheckerEmailUser = {
	id: string,
	email: string,
	firstName?: string | null,
};

type GroupChatIds = {
	chatId: number,
	dialogId: string,
};

type RestErrors = Array<{ code: string, message?: string }>;
