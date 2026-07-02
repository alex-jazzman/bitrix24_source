/**
 * @module mail/message-grid/navigation/src/filter
 */
jn.define('mail/message-grid/navigation/src/filter', (require, exports, module) => {
	const { BaseListFilter } = require('layout/ui/list/base-filter');
	const { MESSAGE_GRID_TAB_IDS } = require('mail/message-grid/navigation/src/tabs');

	class MessageGridFilter extends BaseListFilter
	{
		static get tabType()
		{
			return MESSAGE_GRID_TAB_IDS;
		}

		constructor({
			tabId = MessageGridFilter.tabType.allIncome,
			mailboxId = null,
			presetId = '',
			searchString = '',
			folderPath = null,
			virtualFolderKey = null,
		} = {})
		{
			super(presetId, searchString, false);

			this.setTabId(tabId);
			this.setMailboxId(mailboxId);
			this.setFolderPath(folderPath);
			this.setVirtualFolderKey(virtualFolderKey);
		}

		getDefaultPreset()
		{
			return '';
		}

		getFillPresetParams()
		{
			return null;
		}

		setPresetId(presetId = '')
		{
			super.setPresetId(presetId || '');
		}

		clearPreset()
		{
			this.setPresetId('');
		}

		setTabId(tabId = MessageGridFilter.tabType.allIncome)
		{
			this.tabId = tabId || MessageGridFilter.tabType.allIncome;
		}

		getTabId()
		{
			return this.tabId;
		}

		setMailboxId(mailboxId = null)
		{
			this.mailboxId = mailboxId ? Number(mailboxId) : null;
		}

		getMailboxId()
		{
			return this.mailboxId;
		}

		setFolderPath(folderPath = null)
		{
			this.folderPath = folderPath || null;
		}

		getFolderPath()
		{
			return this.folderPath;
		}

		setVirtualFolderKey(virtualFolderKey = null)
		{
			this.virtualFolderKey = virtualFolderKey ?? null;
		}

		getVirtualFolderKey()
		{
			return this.virtualFolderKey;
		}

		applyUpdates(updates = {})
		{
			if (Object.prototype.hasOwnProperty.call(updates, 'mailboxId'))
			{
				this.setMailboxId(updates.mailboxId);
			}

			if (Object.prototype.hasOwnProperty.call(updates, 'presetId'))
			{
				this.setPresetId(updates.presetId);
			}

			if (Object.prototype.hasOwnProperty.call(updates, 'searchString'))
			{
				this.setSearchString(updates.searchString ?? '');
			}

			if (Object.prototype.hasOwnProperty.call(updates, 'tabId'))
			{
				this.setTabId(updates.tabId);
			}

			if (Object.prototype.hasOwnProperty.call(updates, 'folderPath'))
			{
				this.setFolderPath(updates.folderPath);
			}

			if (Object.prototype.hasOwnProperty.call(updates, 'virtualFolderKey'))
			{
				this.setVirtualFolderKey(updates.virtualFolderKey);
			}
		}

		getActionParams()
		{
			const loadItems = {
				mailboxId: this.getMailboxId(),
				presetId: this.getPresetId() || null,
				tabId: this.getTabId() || null,
				virtualFolderKey: this.getVirtualFolderKey() ?? null,
				filterParams: {},
			};

			if (this.getFolderPath())
			{
				loadItems.filterParams.DIR = this.getFolderPath();
			}

			if (this.getTabId() === MessageGridFilter.tabType.unread)
			{
				loadItems.filterParams.IS_SEEN = 'N';
			}

			const searchString = this.getSearchString().trim();
			if (searchString !== '')
			{
				loadItems.filterParams.FIND = searchString;
			}

			return { loadItems };
		}
	}

	module.exports = { MessageGridFilter };
});
