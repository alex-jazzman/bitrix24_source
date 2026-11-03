/**
 * @module im/messenger/db/repository/file
 */
jn.define('im/messenger/db/repository/file', (require, exports, module) => {
	const { Type } = require('type');

	const {
		FileTable,
	} = require('im/messenger/db/table/file');
	const { MessageTable } = require('im/messenger/db/table/message');
	const { TranscriptTable } = require('im/messenger/db/table/transcript');
	const { DateHelper } = require('im/messenger/lib/helper');
	const { Feature } = require('im/messenger/lib/feature');
	const { getLogger } = require('im/messenger/lib/logger');
	const {
		FileStatus,
	} = require('im/messenger/const');

	const logger = getLogger('repository--file');

	/**
	 * @class FileRepository
	 */
	class FileRepository
	{
		constructor()
		{
			this.fileTable = new FileTable();
			this.messageTable = new MessageTable();
			this.transcriptTable = new TranscriptTable();
		}

		/**
		 * @param {number} chatId
		 */
		async deleteByChatId(chatId)
		{
			return this.fileTable.delete({
				chatId,
			});
		}

		/**
		 * Deletes the files no message of the local database references any more, together with their
		 * transcripts. The model does not propagate deletion to the database - the delete router of
		 * FileWriter is empty - so a file dropped from a message composition is cleaned up here.
		 *
		 * @param {Array<number|string>} idList files to check, e.g. dropped from a message composition
		 * @param {number} messageId the message they were dropped from: its own row is not a reference
		 * @return {Promise<Array<number>>} the files actually deleted: no other message references them
		 * any more and their rows are gone from the database
		 */
		async deleteUnusedByIdList(idList, messageId)
		{
			const candidateIdList = this.#prepareIdList(idList);
			// the read-only mode makes Table drop the deletion silently, so there is nothing to report
			if (
				!Feature.isLocalStorageEnabled
				|| Feature.isLocalStorageReadOnlyModeEnable
				|| !Type.isArrayFilled(candidateIdList)
			)
			{
				return [];
			}

			// without the reference list there is no way to tell a dropped file from a shared one
			const usedIdSet = await this.#getUsedIdSet(candidateIdList, messageId)
				.catch((error) => {
					logger.error(`${this.constructor.name}: messageTable.executeSql error: `, error);

					return null;
				})
			;
			if (!usedIdSet)
			{
				return [];
			}

			const idListToDelete = candidateIdList.filter((fileId) => !usedIdSet.has(fileId));
			if (!Type.isArrayFilled(idListToDelete))
			{
				return [];
			}

			let isFileListDeleted = true;
			try
			{
				await this.fileTable.deleteByIdList(idListToDelete);
			}
			catch (error)
			{
				isFileListDeleted = false;
				logger.error(`${this.constructor.name}: fileTable.deleteByIdList error: `, error);
			}

			try
			{
				await this.transcriptTable.deleteByIdList(idListToDelete);
			}
			catch (error)
			{
				logger.error(`${this.constructor.name}: transcriptTable.deleteByIdList error: `, error);
			}

			// the caller cleans the model by this list: a file still stored must not appear in it
			return isFileListDeleted ? idListToDelete : [];
		}

		async saveFromModel(fileList)
		{
			const fileListToAdd = [];
			fileList.forEach((file) => {
				const fileToAdd = this.fileTable.validate(file);

				fileListToAdd.push(fileToAdd);
			});

			return this.fileTable.add(fileListToAdd, true);
		}

		async saveFromRest(fileList)
		{
			const fileListToAdd = [];
			fileList.forEach((file) => {
				const fileToAdd = this.fileTable.validate(this.validateRestFile(file));

				fileListToAdd.push(fileToAdd);
			});

			return this.fileTable.add(fileListToAdd, true);
		}

		async saveFromPush(fileList)
		{
			const fileListMergePromiseList = [];
			fileList.forEach((file) => {
				const fileToAdd = this.fileTable.validate(this.validatePushFile(file));
				const mergePromise = this.fileTable.merge(fileToAdd.id, (existingFile) => {
					return {
						...existingFile,
						...fileToAdd,
					};
				});

				fileListMergePromiseList.push(mergePromise);
			});

			return Promise.all(fileListMergePromiseList);
		}

		validateRestFile(file)
		{
			const result = {};

			if (Type.isNumber(file.id) || Type.isStringFilled(file.id))
			{
				result.id = file.id;
			}

			if (Type.isNumber(file.chatId) || Type.isString(file.chatId))
			{
				result.chatId = Number(file.chatId);
			}

			if (Type.isStringFilled(file.dialogId))
			{
				result.dialogId = file.dialogId;
			}

			if (!Type.isNil(file.date))
			{
				result.date = file.date;
			}

			if (Type.isString(file.type))
			{
				result.type = file.type;
			}

			if (Type.isString(file.extension))
			{
				result.extension = file.extension.toString();
			}

			if (Type.isString(file.name) || Type.isNumber(file.name))
			{
				result.name = file.name.toString();
			}

			if (Type.isNumber(file.size) || Type.isString(file.size))
			{
				result.size = Number(file.size);
			}

			if (Type.isBoolean(file.image))
			{
				result.image = false;
			}
			else if (Type.isObject(file.image))
			{
				result.image = {
					width: 0,
					height: 0,
				};

				if (Type.isString(file.image.width) || Type.isNumber(file.image.width))
				{
					result.image.width = parseInt(file.image.width, 10);
				}

				if (Type.isString(file.image.height) || Type.isNumber(file.image.height))
				{
					result.image.height = parseInt(file.image.height, 10);
				}

				if (result.image.width <= 0 || result.image.height <= 0)
				{
					result.image = false;
				}
			}

			if (Type.isString(file.status) && !Type.isUndefined(FileStatus[file.status]))
			{
				result.status = file.status;
			}

			if (Type.isNumber(file.progress) || Type.isString(file.progress))
			{
				result.progress = Number(file.progress);
			}

			if (Type.isNumber(file.authorId) || Type.isString(file.authorId))
			{
				result.authorId = Number(file.authorId);
			}

			if (Type.isString(file.authorName) || Type.isNumber(file.authorName))
			{
				result.authorName = file.authorName.toString();
			}

			if (Type.isString(file.urlPreview))
			{
				result.urlPreview = file.urlPreview;
			}

			if (Type.isString(file.urlDownload))
			{
				result.urlDownload = file.urlDownload;
			}

			if (Type.isString(file.urlShow))
			{
				result.urlShow = file.urlShow;
			}

			if (Type.isObject(file.mediaUrl))
			{
				result.mediaUrl = file.mediaUrl;
			}

			if (Type.isBoolean(file.isTranscribable))
			{
				result.isTranscribable = file.isTranscribable;
			}

			if (Type.isBoolean(file.isVoiceNote))
			{
				result.isVoiceNote = file.isVoiceNote;
			}

			if (Type.isBoolean(file.isVideoNote))
			{
				result.isVideoNote = file.isVideoNote;
			}

			return result;
		}

		validatePushFile(file)
		{
			return this.validateRestFile(file);
		}

		/**
		 * @param {Array<number>} candidateIdList
		 * @param {number} messageId
		 * @return {Promise<Set<number>>}
		 */
		async #getUsedIdSet(candidateIdList, messageId)
		{
			const usedIdSet = new Set();

			const selectResult = await this.messageTable.executeSql({
				query: `
					SELECT files
					FROM ${this.messageTable.getName()}
					WHERE id != ? AND (${this.#createFileIdMatchCondition(candidateIdList)})
				`,
				values: [
					messageId,
					...candidateIdList.map((fileId) => `%,${fileId},%`),
				],
			});

			if (!Type.isArrayFilled(selectResult?.rows))
			{
				return usedIdSet;
			}

			this.messageTable.prepareListResult(selectResult).items.forEach((message) => {
				this.#prepareIdList(message.files).forEach((fileId) => usedIdSet.add(fileId));
			});

			return usedIdSet;
		}

		/**
		 * The files column keeps a JSON array whose ids come either as numbers or as strings, so the
		 * array text is flattened to `,id,id,` and a single id is looked up inside it.
		 *
		 * @param {Array<number>} idList
		 * @return {string}
		 */
		#createFileIdMatchCondition(idList)
		{
			return idList
				.map(() => `
					REPLACE(REPLACE(REPLACE(files, '"', ''), '[', ','), ']', ',') LIKE ?
				`)
				.join(' OR ')
			;
		}

		/**
		 * @param {Array<number|string>} idList
		 * @return {Array<number>}
		 */
		#prepareIdList(idList)
		{
			if (!Type.isArrayFilled(idList))
			{
				return [];
			}

			const preparedIdList = [];
			idList.forEach((fileId) => {
				const preparedId = Number.parseInt(fileId, 10);
				if (!Number.isNaN(preparedId))
				{
					preparedIdList.push(preparedId);
				}
			});

			return preparedIdList;
		}
	}

	module.exports = {
		FileRepository,
	};
});
