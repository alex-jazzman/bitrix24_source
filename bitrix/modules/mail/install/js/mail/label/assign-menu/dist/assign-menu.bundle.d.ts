/* eslint-disable */
type AssignMenuChange = {
	labelId: number;
	assigned: boolean;
};

type AssignMenuOptions = {
	bindElement: HTMLElement;
	messageIds: string[];
	currentLabelIds: number[] | Promise<number[]>;
	mailboxId?: number | null;
	onChange?: (change: AssignMenuChange) => void;
	onShow?: () => void;
	onClose?: () => void;
};

declare namespace BX.Mail.Label.AssignMenu {
	function invalidateSharedLabels(): void;

	class AssignMenu {
		constructor(options: AssignMenuOptions);
		static show(options: AssignMenuOptions): Promise<void>;
	}
}
