import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import { resolveFileNodes } from '../utils/resolve-file-nodes';
import { showErrorToast } from '../utils/show-error-toast';

export const FILE_NODE_RESOLVER_KEY = new PluginKey('noteFileNodeResolver');

const FILE_NODE_TYPES = new Set(['imageAttachment', 'fileAttachment', 'video']);
const RESOLVE_DEBOUNCE_MS = 200;

// Signal from the paste path: these fileIds were just inserted by the user, so if the backend
// can't resolve them they should be removed + toasted (rather than left as a placeholder, which
// is the right behaviour only for content that was already persisted in the document).
export function markPastedFileIds(view: Object, fileIds: number[]): void
{
	const ids = (Array.isArray(fileIds) ? fileIds : []).filter((id) => Number.isInteger(id) && id > 0);
	if (ids.length === 0)
	{
		return;
	}

	view.dispatch(view.state.tr.setMeta(FILE_NODE_RESOLVER_KEY, { type: 'markPasted', fileIds: ids }));
}

function applyOutcome(view: Object, deleteIds: Set<number>, placeholderIds: Set<number>): void
{
	if (deleteIds.size === 0 && placeholderIds.size === 0)
	{
		return;
	}

	const { tr, doc } = view.state;
	const deletePositions = [];
	let changed = false;

	doc.descendants((node, pos) => {
		if (!FILE_NODE_TYPES.has(node.type.name))
		{
			return;
		}

		const fileId = node.attrs.fileId;
		if (deleteIds.has(fileId))
		{
			deletePositions.push({ pos, size: node.nodeSize });
		}
		else if (placeholderIds.has(fileId) && !node.attrs.unavailable)
		{
			tr.setNodeMarkup(pos, undefined, { ...node.attrs, unavailable: true });
			changed = true;
		}
	});

	// Delete descending so earlier positions stay valid as later nodes are removed.
	for (let i = deletePositions.length - 1; i >= 0; i--)
	{
		tr.delete(deletePositions[i].pos, deletePositions[i].pos + deletePositions[i].size);
		changed = true;
	}

	if (changed)
	{
		view.dispatch(tr);
	}
}

export const FileNodeResolverExtension = Extension.create({
	name: 'fileNodeResolver',

	addOptions(): Object
	{
		return {
			getDocumentId: () => 0,
		};
	},

	addProseMirrorPlugins(): Array<Object>
	{
		const { editor } = this;
		const getDocumentId = () => Number(this.options.getDocumentId?.() ?? 0);

		return [
			new Plugin({
				key: FILE_NODE_RESOLVER_KEY,
				state: {
					init(): Object
					{
						return { failed: new Set(), deleteOnFail: new Set() };
					},
					apply(tr, value): Object
					{
						const meta = tr.getMeta(FILE_NODE_RESOLVER_KEY);
						if (meta?.type === 'markPasted')
						{
							meta.fileIds.forEach((id) => value.deleteOnFail.add(id));
						}

						return value;
					},
				},
				view(view): Object
				{
					let timer = null;
					let running = false;
					let dirty = false;

					const run = async () => {
						if (running)
						{
							dirty = true;

							return;
						}
						running = true;
						dirty = false;

						try
						{
							const documentId = getDocumentId();
							const { failed, deleteOnFail } = FILE_NODE_RESOLVER_KEY.getState(view.state);
							const result = await resolveFileNodes(editor, documentId, { skip: failed });

							if (result.failedIds.length > 0)
							{
								const deleteIds = new Set();
								const placeholderIds = new Set();
								let toastMessage = '';

								for (const id of result.failedIds)
								{
									failed.add(id); // stop retrying this fileId for the session
									if (deleteOnFail.has(id))
									{
										deleteIds.add(id);
										toastMessage = toastMessage || result.failedById.get(id) || '';
									}
									else
									{
										placeholderIds.add(id);
									}
								}

								applyOutcome(view, deleteIds, placeholderIds);
								if (toastMessage)
								{
									showErrorToast(toastMessage);
								}
							}

							// Clear handled ids regardless of outcome so a later persisted node with the
							// same id is placeheld, not silently removed.
							[...result.resolvedIds, ...result.failedIds].forEach((id) => deleteOnFail.delete(id));
						}
						finally
						{
							running = false;
							if (dirty)
							{
								schedule();
							}
						}
					};

					const schedule = () => {
						if (timer)
						{
							clearTimeout(timer);
						}
						timer = setTimeout(run, RESOLVE_DEBOUNCE_MS);
					};

					schedule();

					return {
						update(): void
						{
							schedule();
						},
						destroy(): void
						{
							if (timer)
							{
								clearTimeout(timer);
							}
						},
					};
				},
			}),
		];
	},
});
