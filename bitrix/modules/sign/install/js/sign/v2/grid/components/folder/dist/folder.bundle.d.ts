/* eslint-disable */
type CreateFolderPopupOptions = {
	initialTitle?: string;
	placeholder?: string;
	createButtonText?: string;
	saveButtonText?: string;
	cancelButtonText?: string;
	emptyTitleNotification?: string;
};

type DeleteConfirmationPopupOptions = {
	title: string;
	message: string;
	confirmButtonText: string;
	cancelButtonText: string;
	onConfirm: () => Promise<void>;
};

type FolderSelectionPopupOptions = {
	loadFolders?: LoadFolders;
	rootItemTitle?: string;
};

type LoadFolders = (limit: number, offset: number) => Promise<FolderPage | FolderData[]>;

type FolderPage = {
	folders: FolderData[];
	total: number;
	nextOffset: number;
};

type FolderData = {
	id: number;
	title: string;
};

declare namespace BX.Sign.V2.Grid.Components {
	class CreateFolderPopup extends BX.Event.EventEmitter {
		constructor(options?: CreateFolderPopupOptions);
		show(): void;
	}

	class DeleteConfirmationPopup {
		constructor(options: DeleteConfirmationPopupOptions);
		show(): void;
	}

	class FolderSelectionPopup extends BX.Event.EventEmitter {
		constructor(options?: FolderSelectionPopupOptions);
		show(): HTMLDivElement;
	}
}
