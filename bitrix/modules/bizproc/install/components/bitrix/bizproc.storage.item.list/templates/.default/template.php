<?php

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

use Bitrix\Bizproc\Internal\Service\Storage\StorageLimitsService;

\Bitrix\Main\UI\Extension::load([
	'ui.dialogs.messagebox',
	'ui.alerts',
	'ui.notification',
]);

$hasErrors = (!empty($arResult['errors']) && is_array($arResult['errors']));
$diskBannerState = $arResult['diskBannerState'] ?? null;

?>
<div class="bizproc-storage-item-list-container">
	<div class="bizproc-storage-item-list-errors-container ui-alert ui-alert-danger"<?= (!$hasErrors ? ' style="display: none;"' : '') ?>>
		<?php if ($hasErrors): ?>
			<?php foreach ($arResult['errors'] as $error): ?>
				<div class="bizproc-storage-item-error ui-alert-message"><?= htmlspecialcharsbx($error) ?></div>
			<?php endforeach;?>
		<?php return;
		endif;?>
		<span class="ui-alert-close-btn" onclick="this.parentNode.style.display = 'none';"></span>
	</div>
	<?php if ($diskBannerState === StorageLimitsService::BANNER_STATE_BLOCKED): ?>
		<div class="bizproc-storage-item-list-quota-alert ui-alert ui-alert-danger">
			<span class="ui-alert-message"><?= htmlspecialcharsbx(GetMessage('BIZPROC_STORAGE_ITEM_LIST_DISK_BLOCKED') ?? '') ?></span>
		</div>
	<?php elseif ($diskBannerState === StorageLimitsService::BANNER_STATE_WARNING): ?>
		<div class="bizproc-storage-item-list-quota-alert ui-alert ui-alert-warning">
			<span class="ui-alert-message"><?= htmlspecialcharsbx(GetMessage('BIZPROC_STORAGE_ITEM_LIST_DISK_WARNING') ?? '') ?></span>
		</div>
	<?php endif; ?>
	<div class="bizproc-storage-item-list-grid">
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
		BX.message(<?= \Bitrix\Main\Web\Json::encode(\Bitrix\Main\Localization\Loc::loadLanguageFile(__FILE__)) ?>);

		BX.Bizproc.Component.StorageItemList.Instance = new BX.Bizproc.Component.StorageItemList({
			gridId: '<?= CUtil::JSEscape($arResult['grid']['GRID_ID']) ?>',
		});
	});
</script>
</div>
