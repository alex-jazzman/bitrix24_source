/* eslint-disable */
type SharingMembersPopupParams = {
	objectId: number;
	objectName: string;
	mode: SharingReadMode;
	onAfterHide?: () => void;
};

/**
 * Modes the reading actions are defined for: `blocked-by-feature` never reaches the server.
 */
type SharingReadMode = Exclude<SharingControlTypeValue, typeof BX.Disk.SharingControlType.BlockedByFeature>;

type SharingControlTypeValue = (typeof BX.Disk.SharingControlType)[keyof typeof BX.Disk.SharingControlType];

declare namespace BX.Disk {
	/**
	 * The single entry point of the sharing popup: the mode is a parameter, there is no method
	 * per mode. The dialog appears only after the data is read, so an unsuccessful response
	 * leaves nothing on screen but the error notification.
	 */
	class SharingMembersPopup {
		open(params: SharingMembersPopupParams): Promise<void>;
		close(): void;
	}

	const SharingControlType: Readonly<{
		WithoutEdit: "without-edit";
		WithChangeRights: "with-change-rights";
		WithSharing: "with-sharing";
		BlockedByFeature: "blocked-by-feature";
	}>;
}
