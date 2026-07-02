import { DialogLocator } from "../../../types/dialog";

export type OptimisticHandler = {
	onStart: () => void;
	onCancel: () => void;
	onResolve: () => Record<string, unknown>;
};

export type RestoreCallback = (chatType: string, dialogLocator: DialogLocator) => void;
