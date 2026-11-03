<?php
if(!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

use Bitrix\Main\Localization\Loc;
use Bitrix\Main\Web\Json;

\Bitrix\Main\UI\Extension::load([
	'ui.alerts',
	'ui.notification',
	'ui.dialogs.messagebox',
]);

$hasErrors = (!empty($arResult['errors']) && is_array($arResult['errors']));

?>
<div class="main-user-field-list-container">
	<div class="user-field-list-errors-container ui-alert ui-alert-danger"<?= (!$hasErrors ? ' style="display: none;"' : '') ;?>>
		<?php if($hasErrors): ?>
			<?php foreach($arResult['errors'] as $error): ?>
				<div class="main-user-field-error ui-alert-message"><?= htmlspecialcharsbx($error); ?></div>
			<?php endforeach;?>
		<?php return;
		endif;?>
		<span class="ui-alert-close-btn" onclick="this.parentNode.style.display = 'none';"></span>
	</div>
	<div class="main-user-field-list-grid">
		<?php
		global $APPLICATION;
		$APPLICATION->IncludeComponent(
			"bitrix:main.ui.grid",
			"",
			$arResult['grid']
		);
		?>
	</div>
<script>
	BX.ready(function()
	{
		BX.message({
			MAIN_FIELD_CONFIG_LIST_DELETE_CONFIRM: <?= Json::encode(Loc::getMessage('MAIN_FIELD_CONFIG_LIST_DELETE_CONFIRM') ?? '') ?>,
			MAIN_FIELD_CONFIG_LIST_DELETE_SUCCESS: <?= Json::encode(Loc::getMessage('MAIN_FIELD_CONFIG_LIST_DELETE_SUCCESS') ?? '') ?>,
		});

		var gridId = '<?= CUtil::JSEscape($arResult['grid']['GRID_ID']); ?>';
		if(gridId.length > 0 && BX.Main.gridManager)
		{
			var hideDisabledCheckboxes = function()
			{
				var grid = BX.Main.gridManager.getInstanceById(gridId);
				var container = grid?.getContainer?.() || document;
				container.querySelectorAll('input[name="ID[]"][data-disabled="1"]').forEach(function(input) {
					var cell = input.closest('.main-grid-cell-checkbox');
					if(cell)
					{
						cell.innerHTML = '';
					}
				});
			};

			hideDisabledCheckboxes();
			BX.addCustomEvent('Grid::updated', function(grid) {
				if(grid?.getId?.() === gridId)
				{
					hideDisabledCheckboxes();
					var list = BX.Main.UserFieldConfigList && BX.Main.UserFieldConfigList.Instance;
					if(list)
					{
						list.syncTotalRowsCount(grid);
						list.syncPageSize(grid);
					}
				}
			});
			BX.addCustomEvent('SidePanel.Slider:onMessage', function(message)
			{
				if(message.getEventId() === 'userfield-list-update')
				{
					BX.Main.gridManager.reload(gridId);
				}
			});
		}

		BX.namespace('Main');
		BX.Main.UserFieldConfigList = function(options)
		{
			this.gridId = options.gridId;
			this.moduleId = options.moduleId;
			this.navigationParamName = options.navigationParamName;
			this.totalRowsCount = options.totalRowsCount;
			this.pageSize = options.pageSize;
		};
		BX.Main.UserFieldConfigList.Instance = new BX.Main.UserFieldConfigList({
			gridId: gridId,
			moduleId: '<?= CUtil::JSEscape($arResult['moduleId'] ?? '') ?>',
			navigationParamName: '<?= CUtil::JSEscape($arResult['grid']['NAV_PARAM_NAME'] ?? '') ?>',
			totalRowsCount: <?= (int)($arResult['grid']['TOTAL_ROWS_COUNT'] ?? 0) ?>,
			pageSize: <?= (int)(isset($arResult['grid']['NAV_OBJECT']) && is_object($arResult['grid']['NAV_OBJECT']) ? $arResult['grid']['NAV_OBJECT']->getPageSize() : 0) ?>,
		});
		BX.Main.UserFieldConfigList.prototype.getGrid = function()
		{
			return BX.Main.gridManager.getInstanceById(this.gridId);
		};
		BX.Main.UserFieldConfigList.prototype.getSelectedIds = function()
		{
			var grid = this.getGrid();
			var rows = grid && grid.getRows ? grid.getRows() : null;

			return rows && rows.getSelectedIds ? rows.getSelectedIds() : [];
		};
		BX.Main.UserFieldConfigList.prototype.getDisplayedRowsCount = function()
		{
			var grid = this.getGrid();
			var rows = grid && grid.getRows ? grid.getRows() : null;

			return rows && rows.getCountDisplayed ? rows.getCountDisplayed() : 0;
		};
		BX.Main.UserFieldConfigList.prototype.syncTotalRowsCount = function(grid)
		{
			var container = grid && grid.getContainer ? grid.getContainer() : null;
			var counter = container ? container.querySelector('.main-grid-panel-total .main-grid-panel-content-text') : null;
			if(!counter)
			{
				return;
			}

			var totalRowsCount = parseInt(counter.textContent.replace(/\s/g, ''), 10);
			if(!isNaN(totalRowsCount))
			{
				this.totalRowsCount = totalRowsCount;
			}
		};
		BX.Main.UserFieldConfigList.prototype.syncPageSize = function(grid)
		{
			var data = grid && grid.getData ? grid.getData() : null;
			var pageSizeNode = data && data.getPageSize ? data.getPageSize() : null;
			var pageSize = pageSizeNode ? parseInt(pageSizeNode.value, 10) : 0;
			if(pageSize > 0)
			{
				this.pageSize = pageSize;
			}
		};
		BX.Main.UserFieldConfigList.prototype.getRemainingRowsCount = function(deletedCount)
		{
			return Math.max(this.totalRowsCount - deletedCount, 0);
		};
		BX.Main.UserFieldConfigList.prototype.applyDeletedRowsCount = function(deletedCount)
		{
			this.totalRowsCount = this.getRemainingRowsCount(deletedCount);
		};
		BX.Main.UserFieldConfigList.prototype.getReloadUrl = function(deletedCount)
		{
			var grid = this.getGrid();
			var currentPage = grid && grid.getCurrentPage ? grid.getCurrentPage() : 0;
			if(currentPage <= 1 || !this.navigationParamName || this.pageSize <= 0)
			{
				return null;
			}

			var remainingRowsCount = this.getRemainingRowsCount(deletedCount);
			var maxPage = Math.max(Math.ceil(remainingRowsCount / this.pageSize), 1);
			if(currentPage <= maxPage)
			{
				return null;
			}

			var url = BX.util.remove_url_param(window.location.href, this.navigationParamName);
			var params = {};
			params[this.navigationParamName] = 'page-' + maxPage;

			return BX.util.add_url_param(url, params);
		};
		BX.Main.UserFieldConfigList.prototype.lockSliderScroll = function()
		{
			if(this.scrollLock)
			{
				return;
			}

			this.scrollLock = {
				documentOverflowY: document.documentElement.style.overflowY,
				bodyOverflowY: document.body.style.overflowY,
			};
			document.documentElement.style.overflowY = 'hidden';
			document.body.style.overflowY = 'hidden';
		};
		BX.Main.UserFieldConfigList.prototype.unlockSliderScroll = function()
		{
			if(!this.scrollLock)
			{
				return;
			}

			document.documentElement.style.overflowY = this.scrollLock.documentOverflowY;
			document.body.style.overflowY = this.scrollLock.bodyOverflowY;
			this.scrollLock = null;
		};
		BX.Main.UserFieldConfigList.prototype.showDeleteConfirmation = function()
		{
			if(!this.getSelectedIds().length)
			{
				return;
			}

			var messageBox = BX.UI.Dialogs.MessageBox.create({
				message: BX.message('MAIN_FIELD_CONFIG_LIST_DELETE_CONFIRM'),
				buttons: BX.UI.Dialogs.MessageBoxButtons.OK_CANCEL,
				onOk: function() {
					return this.deleteSelectedFields();
				}.bind(this),
				onCancel: function() {
					return true;
				},
				popupOptions: {
					fixed: true,
					events: {
						onAfterClose: this.unlockSliderScroll.bind(this),
					},
				},
			});
			this.lockSliderScroll();
			messageBox.show();
		};
		BX.Main.UserFieldConfigList.prototype.deleteSelectedFields = function()
		{
			var grid = this.getGrid();
			var ids = this.getSelectedIds();
			if(!ids.length)
			{
				return Promise.resolve();
			}

			var results = [];
			var displayedRowsCount = this.getDisplayedRowsCount();
			var nextIndex = 0;
			var maxConcurrentRequests = 5;
			var deleteNext = function() {
				if(nextIndex >= ids.length)
				{
					return Promise.resolve();
				}

				var id = ids[nextIndex++];

				return new Promise(function(resolve) {
					BX.ajax.runAction('main.userfieldconfig.delete', {
						data: {
							moduleId: this.moduleId,
							id: id,
						},
					}).then(function() {
						results.push({ status: 'fulfilled' });
						resolve();
					}, function(reason) {
						results.push({
							status: 'rejected',
							reason: reason,
						});
						resolve();
					});
				}.bind(this)).then(deleteNext);
			}.bind(this);
			var queue = [];
			var workersCount = Math.min(maxConcurrentRequests, ids.length);
			for(var i = 0; i < workersCount; i++)
			{
				queue.push(deleteNext());
			}

			return Promise.all(queue).then(function() {
				var errors = [];
				var deletedCount = 0;
				results.forEach(function(result) {
					if(result.status === 'fulfilled')
					{
						deletedCount++;
						return;
					}

					(result.reason?.errors || []).forEach(function(error) {
						errors.push(BX.util.htmlspecialchars(error.message));
					});
				});

				if(deletedCount > 0)
				{
					BX.UI.Notification.Center.notify({
						content: BX.message('MAIN_FIELD_CONFIG_LIST_DELETE_SUCCESS'),
					});
					var reloadUrl = deletedCount >= displayedRowsCount ? this.getReloadUrl(deletedCount) : null;
					this.applyDeletedRowsCount(deletedCount);
					if(reloadUrl)
					{
						grid.reloadTable('GET', {}, null, reloadUrl);
					}
					else
					{
						grid.reloadTable();
					}
				}

				if(errors.length > 0)
				{
					BX.UI.Notification.Center.notify({
						content: errors.join('<br>'),
					});
				}
			}.bind(this));
		};
	});
</script>
</div>
