/* eslint-disable */
this.BX = this.BX || {};
this.BX.Messenger = this.BX.Messenger || {};
this.BX.Messenger.v2 = this.BX.Messenger.v2 || {};
(function (exports, im_v2_application_core, im_v2_const, im_v2_lib_folder, im_v2_lib_logger, im_v2_lib_notifier, im_v2_lib_rest) {
	'use strict';

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
				throw error;
			});
			await im_v2_application_core.Core.getStore().dispatch('recent/folders/addChats', {
				folderId,
				chats
			});
			im_v2_lib_notifier.Notifier.folder.onAddChatComplete();
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
