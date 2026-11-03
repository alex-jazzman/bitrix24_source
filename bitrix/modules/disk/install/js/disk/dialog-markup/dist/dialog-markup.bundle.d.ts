/* eslint-disable */
type ServiceCard = {
	service: string;
	id: string;
	testId: string;
	modifierClass: string;
	titleId: string;
	descriptionId: string;
	titleMessageId: string;
	descriptionMessageId: string;
	hidden?: boolean;
};

type LockedDocumentWarning = {
	link: string;
	titleMessageId: string;
	textMessageId: string;
	actionMessageId: string;
};

type SaveAsField = {
	nameWithoutExtension: string;
	extension: string;
};

declare namespace BX.Disk.DialogMarkup {
	function safeLink(link: string): string;

	function renderServiceCard(card: ServiceCard, isSelected: boolean): HTMLElement;

	const SERVICE_CARD_HIDDEN_ATTRIBUTE = "data-hidden";

	function renderLockedDocumentWarning(params: LockedDocumentWarning): HTMLElement;

	const LOCKED_DOCUMENT_WARNING_TITLE_ID = "disk-locked-document-warning-title";

	function renderSaveAsField(params: SaveAsField): HTMLElement;

	const SAVE_AS_FIELD_ID = "wd-new-create-filename";
}
