/* eslint-disable */
this.BX = this.BX || {};
this.BX.Messenger = this.BX.Messenger || {};
this.BX.Messenger.v2 = this.BX.Messenger.v2 || {};
(function (exports, im_v2_application_core, im_v2_const, im_v2_lib_folder, im_v2_lib_logger, im_v2_lib_notifier, im_v2_lib_rest) {
	'use strict';

	// An item of the composite folder setup screen. It carries no texts: the title and the description
	// come from the folder object it points at, and the link between the two is `folderId` alone -
	// the stored code of the showcase source differs from the one on the wire.
	// SystemFolderCodeItem is a client mirror: it can lag behind the server and nothing checks it at runtime.
	// Declared here and nowhere else: the shape belongs to the answer of the server, and the screen that
	// draws it reads it from here.

	const CLEAR_COMPOSITION_FLAG = 'N';
	class FolderService {
		async add(fields) {
			im_v2_lib_logger.Logger.warn('FolderService: add', fields);
			const queryParams = {
				data: {
					fields
				}
			};
			const addResult = await im_v2_lib_rest.runAction(im_v2_const.RestMethod.imV2FolderAdd, queryParams).catch(([error]) => {
				console.error('FolderService: add error:', error);
				im_v2_lib_notifier.Notifier.folder.handleCompositionError(error);
				throw error;
			});
			const {
				folder
			} = addResult;
			await im_v2_application_core.Core.getStore().dispatch('recent/folders/add', folder);
			return folder;
		}
		async update(folderId, fields) {
			im_v2_lib_logger.Logger.warn('FolderService: update', folderId, fields);
			const queryParams = {
				data: prepareUpdateParams(folderId, fields)
			};
			const updateResult = await im_v2_lib_rest.runAction(im_v2_const.RestMethod.imV2FolderUpdate, queryParams).catch(([error]) => {
				console.error('FolderService: update error:', error);
				im_v2_lib_notifier.Notifier.folder.handleCompositionError(error);
				throw error;
			});
			const {
				folder
			} = updateResult;
			await im_v2_application_core.Core.getStore().dispatch('recent/folders/update', folder);
			return folder;
		}
		async delete(folderId) {
			im_v2_lib_logger.Logger.warn('FolderService: delete', folderId);
			const queryParams = {
				data: {
					folderId
				}
			};
			await im_v2_lib_rest.runAction(im_v2_const.RestMethod.imV2FolderDelete, queryParams).catch(([error]) => {
				console.error('FolderService: delete error:', error);
				throw error;
			});
			im_v2_lib_folder.FolderManager.handleOpenedFolder(folderId);
			await im_v2_application_core.Core.getStore().dispatch('recent/folders/delete', {
				id: folderId
			});
		}
		async sort(orderedIds) {
			im_v2_lib_logger.Logger.warn('FolderService: sort', orderedIds);
			const queryParams = {
				data: {
					folderIds: orderedIds
				}
			};
			await im_v2_lib_rest.runAction(im_v2_const.RestMethod.imV2FolderSort, queryParams).catch(([error]) => {
				console.error('FolderService: sort error:', error);
				throw error;
			});
			await im_v2_application_core.Core.getStore().dispatch('recent/folders/sort', orderedIds);
		}
		async addChats(folderId, chats) {
			im_v2_lib_logger.Logger.warn('FolderService: addChats', folderId, chats);
			const queryParams = {
				data: {
					folderId,
					dialogIds: chats.map(chat => chat.dialogId)
				}
			};
			await im_v2_lib_rest.runAction(im_v2_const.RestMethod.imV2FolderAddChats, queryParams).catch(([error]) => {
				console.error('FolderService: addChats error:', error);
				im_v2_lib_notifier.Notifier.folder.handleCompositionError(error);
				throw error;
			});
			await im_v2_application_core.Core.getStore().dispatch('recent/folders/addChats', {
				folderId,
				chats
			});
			im_v2_lib_notifier.Notifier.folder.onAddChatComplete();
		}

		// The answer belongs to the setup screen alone and stays in its local state: the folder registry
		// holds only the folders `Folder.list` gives out, and the codes here are not checked against the
		// client mirror of the system codes.
		async getSources(folderId) {
			im_v2_lib_logger.Logger.warn('FolderService: getSources', folderId);
			const queryParams = {
				data: {
					folderId
				}
			};
			return im_v2_lib_rest.runAction(im_v2_const.RestMethod.imV2FolderGetSources, queryParams).catch(([error]) => {
				console.error('FolderService: getSources error:', error);
				im_v2_lib_notifier.Notifier.folder.onSourcesLoadError();
				throw error;
			});
		}

		// `sourceCodes` is the whole set of the sources that stay on, not a delta.
		async updateSources(folderId, sourceCodes) {
			im_v2_lib_logger.Logger.warn('FolderService: updateSources', folderId, sourceCodes);
			const queryParams = {
				data: {
					folderId,
					sourceCodes
				}
			};
			const updateResult = await im_v2_lib_rest.runAction(im_v2_const.RestMethod.imV2FolderUpdateSources, queryParams).catch(([error]) => {
				console.error('FolderService: updateSources error:', error);
				im_v2_lib_notifier.Notifier.folder.onSourcesSaveError();
				throw error;
			});

			// the server normalizes the set silently, so the folder gets the codes of the answer and not
			// the ones sent; the `folderUpdate` push carrying the same set arrives later and repeats this
			const {
				sourceFolders: codes
			} = updateResult;

			// An empty set is a legitimate answer, a missing one is no answer at all. The write went through
			// on the server all the same, so the folder is left with the composition it has and the push
			// above brings the new one: a set of nothing here would cost the folder the mark of a composite
			// one, and with it the way back to this very screen.
			if (!Array.isArray(codes)) {
				return;
			}
			const store = im_v2_application_core.Core.getStore();
			const folder = store.getters['recent/folders/getById'](folderId);
			const definition = {
				...folder.definition,
				sourceFolders: codes
			};
			await store.dispatch('recent/folders/update', {
				id: folderId,
				definition
			});
		}
	}
	const prepareUpdateParams = (folderId, fields) => {
		const dialogIds = fields.dialogIds.length > 0 ? fields.dialogIds : CLEAR_COMPOSITION_FLAG;
		return {
			folderId,
			fields: {
				title: fields.title,
				dialogIds
			}
		};
	};

	exports.FolderService = FolderService;
})(this.BX.Messenger.v2.Service = this.BX.Messenger.v2.Service || {}, BX?.Messenger?.v2?.Application??{}, BX?.Messenger?.v2?.Const??{}, BX?.Messenger?.v2?.Lib??{}, BX?.Messenger?.v2?.Lib??{}, BX?.Messenger?.v2?.Lib??{}, BX?.Messenger?.v2?.Lib??{});;
//# sourceMappingURL=folder.bundle.js.map
