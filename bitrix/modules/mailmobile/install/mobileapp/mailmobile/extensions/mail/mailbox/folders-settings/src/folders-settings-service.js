/**
 * @module mail/mailbox/folders-settings/src/folders-settings-service
 */
jn.define('mail/mailbox/folders-settings/src/folders-settings-service', (require, exports, module) => {
	const { AjaxMethod } = require('mail/const');

	class FoldersSettingsService
	{
		load(mailboxId)
		{
			return BX.ajax.runAction(AjaxMethod.getMailboxFoldersSettings, {
				data: { mailboxId },
			}).then(({ data }) => this.normalizeSettingsResponse(data));
		}

		loadChildren(mailboxId, dirMd5)
		{
			return BX.ajax.runAction(AjaxMethod.loadMailboxFolderChildren, {
				data: {
					mailboxId,
					dirMd5,
				},
			}).then(({ data }) => this.normalizeChildrenResponse(data));
		}

		save(mailboxId, payload)
		{
			return BX.ajax.runAction(AjaxMethod.saveMailboxFoldersSettings, {
				data: {
					mailboxId,
					...payload,
				},
			});
		}

		normalizeSettingsResponse(data)
		{
			return {
				...data,
				items: this.normalizeFolderItems(data?.items),
			};
		}

		normalizeChildrenResponse(data)
		{
			return {
				...data,
				items: this.normalizeFolderItems(data?.items),
			};
		}

		normalizeFolderItems(items)
		{
			if (!Array.isArray(items))
			{
				return [];
			}

			return items.map((item) => this.normalizeFolderItem(item));
		}

		normalizeFolderItem(item)
		{
			const normalizedItem = {
				...item,
				children: this.normalizeFolderItems(item?.children),
			};

			if (Object.prototype.hasOwnProperty.call(item, 'isSync'))
			{
				normalizedItem.isSync = item.isSync === true || item.isSync === 1 || item.isSync === '1';
			}

			if (Object.prototype.hasOwnProperty.call(item, 'isDisabled'))
			{
				normalizedItem.isDisabled = item.isDisabled === true || item.isDisabled === 1 || item.isDisabled === '1';
			}

			if (Object.prototype.hasOwnProperty.call(item, 'isContainer'))
			{
				normalizedItem.isContainer = item.isContainer === true || item.isContainer === 1 || item.isContainer === '1';
			}

			if (Object.prototype.hasOwnProperty.call(item, 'hasChild'))
			{
				normalizedItem.hasChild = item.hasChild === true || item.hasChild === 1 || item.hasChild === '1';
			}

			return normalizedItem;
		}
	}

	module.exports = {
		FoldersSettingsService,
	};
});
