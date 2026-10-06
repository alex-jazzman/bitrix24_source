import { ErrorCode } from '../../const/picker';
import {
	resolveSelection as requestResolveSelection,
	pickerErrorCode,
} from '../../infrastructure/service/file-picker/file-picker';
import { type ResolvedPickerItem } from '../../infrastructure/service/file-picker/types';
import { useSelectionStore } from '../../model/selection/selection';
import { useSessionStore } from '../../model/session/session';
import { type PickerSelectionItem, type SessionCallbacks } from '../../model/session/types';

const PARTIAL_MESSAGE = 'DISK_PICKER_NOTIFY_PARTIAL';
const CONFIRM_FAILED_MESSAGE = 'DISK_PICKER_NOTIFY_CONFIRM_FAILED';
const SELECT_LIMIT_MESSAGE = 'DISK_PICKER_NOTIFY_SELECT_LIMIT';
const BACKEND_MAX_ITEMS = 100;

export type ConfirmSelectionDeps = Pick<SessionCallbacks, 'notify' | 'onContextInvalid' | 'emitSelection'>;

type SessionStore = ReturnType<typeof useSessionStore>;

// DTO-05 -> DTO-04. Only files leave the picker; folders never do. Extension is
// normalized to lower-case without a dot (null when absent); fileType is always a
// string for a file.
function toResultItem(item: ResolvedPickerItem): PickerSelectionItem
{
	return {
		objectId: item.objectId,
		name: item.name,
		size: item.size ?? 0,
		extension: item.extension === null ? null : item.extension.toLowerCase(),
		fileType: item.fileType ?? 'other',
		previewUrl: item.previewUrl,
		sourceTitle: item.sourceTitle,
		parentFolderName: item.parentFolderName,
		editorFileType: item.editorFileType,
	};
}

function buildResultItems(items: ResolvedPickerItem[]): PickerSelectionItem[]
{
	return items.filter((item) => !item.isFolder).map((item) => toResultItem(item));
}

function handleConfirmError(session: SessionStore, deps: ConfirmSelectionDeps, error: unknown, token: number): void
{
	const code = pickerErrorCode(error);
	if (code === ErrorCode.InvalidContext)
	{
		// Terminal: the facade closes with onError({code: 'context_invalid'}), no
		// onSelect and no retry.
		session.invalidateRequests();
		deps.onContextInvalid();

		return;
	}

	if (!session.isCurrentConfirmation(token))
	{
		return;
	}

	// Non-terminal: window and selection stay, loading clears, the button becomes
	// available again. A retry sends a fresh request.
	session.setConfirming(false);
	if (code === ErrorCode.TooManyItems)
	{
		deps.notify(SELECT_LIMIT_MESSAGE, { '#COUNT#': String(BACKEND_MAX_ITEMS) });

		return;
	}

	// Unknown codes, transport and contract violations all fall back to a safe
	// generic message.
	deps.notify(CONFIRM_FAILED_MESSAGE);
}

// The single point where the selection leaves the picker. It sends the selected
// ids with the current constraint snapshot to resolveSelection (API-03), then
// hands only the valid items to the facade through a narrow lifecycle callback.
export async function submitSelection(deps: ConfirmSelectionDeps): Promise<void>
{
	const session = useSessionStore();
	const selection = useSelectionStore();

	if (session.confirming || selection.count === 0)
	{
		return;
	}

	const objectIds = [...selection.selectedIds];
	session.setConfirming(true);
	const token = session.nextConfirmationToken();

	try
	{
		const result = await requestResolveSelection({
			objectIds,
			selectionMode: session.constraints.selectionMode,
			allowedFileTypes: session.constraints.allowedFileTypes,
			signedConfig: session.constraints.signedConfig,
		});

		if (!session.isCurrentConfirmation(token))
		{
			return;
		}

		session.setConfirming(false);

		const items = buildResultItems(result.items);
		if (items.length === 0)
		{
			// Zero valid: notify, keep the window open, do not call onSelect.
			deps.notify(PARTIAL_MESSAGE);

			return;
		}

		if (result.partial)
		{
			deps.notify(PARTIAL_MESSAGE);
		}

		deps.emitSelection({ items });
	}
	catch (error)
	{
		handleConfirmError(session, deps, error, token);
	}
}
