/**
 * @module mail/message-grid/navigation/src/filter
 */
jn.define('mail/message-grid/navigation/src/filter', (require, exports, module) => {
	const { BaseListFilter } = require('layout/ui/list/base-filter');
	const { MESSAGE_GRID_TAB_IDS } = require('mail/message-grid/navigation/src/tabs');
	const { LABEL } = require('mail/folder/virtual/src/keys');

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
			labelId = null,
		} = {})
		{
			super(presetId, searchString, false);

			this.setTabId(tabId);
			this.setMailboxId(mailboxId);
			this.setFolderPath(folderPath);
			this.setVirtualFolderKey(virtualFolderKey);
			this.setLabelId(labelId);
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

		setLabelId(labelId = null)
		{
			this.labelId = labelId ? Number(labelId) : null;
		}

		getLabelId()
		{
			return this.labelId;
		}

		isLabelMode()
		{
			return this.getVirtualFolderKey() === LABEL && this.getLabelId() !== null;
		}

		isSentTabAvailable()
		{
			// A label gathers messages of the whole mailbox, so the sent-folder tab is off in this mode.
			return !this.isLabelMode();
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

			if (Object.prototype.hasOwnProperty.call(updates, 'labelId'))
			{
				this.setLabelId(updates.labelId);
			}
		}

		getActionParams()
		{
			const isLabelMode = this.isLabelMode();
			const loadItems = {
				mailboxId: this.getMailboxId(),
				presetId: this.getPresetId() || null,
				tabId: this.getTabId() || null,
				virtualFolderKey: this.getVirtualFolderKey() ?? null,
				labelId: isLabelMode ? this.getLabelId() : null,
				filterParams: {},
			};

			// A label filter replaces the folder filter, so DIR is not sent in the label mode.
			if (!isLabelMode && this.getFolderPath())
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
