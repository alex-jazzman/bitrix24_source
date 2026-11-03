/* eslint-disable */
type BottomSheetComponent = {
	$refs?: {
		popup?: {
			getPopupInstance?: () => SheetPopup | null;
		};
	};
};

type SheetPopup = {
	getPopupContainer?: () => HTMLElement | null;
	getFocusTrap?: () => Object | null;
};

declare namespace BX.Tasks.V2.Lib {
	function syncBottomSheetModality(bottomSheet: BottomSheetComponent | null | void): void;
}
