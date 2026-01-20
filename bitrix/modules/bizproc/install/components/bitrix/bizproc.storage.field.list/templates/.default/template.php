<?php

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

\Bitrix\Main\UI\Extension::load("ui.alerts");

$hasErrors = (!empty($arResult['errors']) && is_array($arResult['errors']));

?>
<div class="bizproc-storage-field-list-container">
	<div class="bizproc-storage-field-list-errors-container ui-alert ui-alert-danger"<?= (!$hasErrors ? ' style="display: none;"' : '') ?>>
		<?php if ($hasErrors): ?>
			<?php foreach ($arResult['errors'] as $error): ?>
				<div class="bizproc-storage-field-error ui-alert-message"><?= htmlspecialcharsbx($error) ?></div>
			<?php endforeach;?>
		<?php return;
		endif;?>
		<span class="ui-alert-close-btn" onclick="this.parentNode.style.display = 'none';"></span>
	</div>
	<div class="bizproc-storage-field-list-grid">
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
	BX.ready(() => {
		const gridId = '<?= CUtil::JSEscape($arResult['grid']['GRID_ID']) ?>';
		if (gridId && BX.Main.gridManager)
		{
			BX.addCustomEvent('SidePanel.Slider:onMessage', (message) => {
				if (message?.getEventId?.() === 'storage-field-list-update')
				{
					BX.Main.gridManager.reload(gridId);
				}
			});
		}
	});

	BX.StorageFieldList = function(storageId, fieldId = null)
	{
		BX.Runtime
			.loadExtension('bizproc.router')
			.then(({ Router }) => {
				if (Router?.openStorageFieldEdit)
				{
					Router.openStorageFieldEdit({
						requestMethod: 'get',
						requestParams: { storageId, fieldId },
					});
				}
				else
				{
					console.warn('Router or openStorageFieldEdit method not available');
				}
			})
			.catch((e) => console.error(e));
	};
</script>
</div>
