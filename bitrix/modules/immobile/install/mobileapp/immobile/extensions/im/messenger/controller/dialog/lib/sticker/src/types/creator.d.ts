import {DeviceFile} from "../../../../../../provider/services/sending/types/sending";
import {DialogLocator} from "../../../../types/dialog";
import {UploadingStickerData} from "./service";

declare type StickerPackCreatorProps = {
	title: string,
	files: Array<DeviceFile>,
	dialogLocator: DialogLocator,
	onClose: () => void,
};

declare type StickerPackCreatorState = {
	title: string,
	stickers: Array<UploadingStickerData>,
	rows: Array<object>,
	isEnabledCreationButton: boolean,
};