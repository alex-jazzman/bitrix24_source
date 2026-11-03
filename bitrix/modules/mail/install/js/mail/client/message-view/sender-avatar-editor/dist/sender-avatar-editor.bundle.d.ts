/* eslint-disable */
type SenderAvatarEditorAvatar = {
	readonly confirmed: Readonly<{
		hasAvatar: boolean;
		url: string | null;
		canManage: boolean;
		uploader: Readonly<{
			controller: string;
			controllerOptions: Readonly<Record<string, unknown>>;
		}> | null;
	}> | null;
	readonly intent: Readonly<{
		operation: 'replace';
		uploadToken: string | null;
	}> | Readonly<{
		operation: 'delete';
	}> | null;
	readonly selection: Readonly<SenderAvatarEditorSelection> | null;
	readonly status: 'idle' | 'loading' | 'editing' | 'saving' | 'refreshing' | 'failed';
	readonly error: string;
};

type SenderAvatarEditorSelection = {
	id: string;
	status: 'loading' | 'complete' | 'error';
	previewUrl: string;
	uploadToken: string | null;
	error: string;
};

type SenderAvatarEditorLabels = {
	readonly open: string;
	readonly title: string;
	readonly select: string;
	readonly replace: string;
	readonly delete: string;
	readonly confirm: string;
	readonly cancel: string;
	readonly retry: string;
	readonly loading: string;
	readonly saving: string;
	readonly deletePending: string;
	readonly replacePending: string;
	readonly uploaderError: string;
};

type SenderAvatarEditorProps = {
	readonly avatar: SenderAvatarEditorAvatar;
	readonly labels: SenderAvatarEditorLabels;
	readonly disabled: boolean;
	readonly beginEditing: () => boolean;
};

declare namespace BX.Mail.Client.MessageView {
	const SenderAvatarEditor: BX.Vue3.ComponentOptions;
}
