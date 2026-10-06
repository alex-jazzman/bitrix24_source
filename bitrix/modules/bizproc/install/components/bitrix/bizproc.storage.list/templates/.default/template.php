<?php

declare(strict_types=1);

use Bitrix\Main\Localization\Loc;
use Bitrix\Main\Web\Json;

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

\Bitrix\Main\UI\Extension::load([
	'ui.alerts',
	'ui.dialogs.messagebox',
	'bizproc.router',
	'ui.notification',
]);

/** @var array $arResult */

$hasErrors = (!empty($arResult['errors']) && is_array($arResult['errors']));

?>
<div class="bizproc-storage-list-container" data-testid="bizproc-storage-list-container">
	<?php if ($hasErrors): ?>
		<div class="ui-alert ui-alert-danger" data-testid="bizproc-storage-list-errors">
			<?php foreach ($arResult['errors'] as $error): ?>
				<div class="ui-alert-message"><?= htmlspecialcharsbx($error) ?></div>
			<?php endforeach; ?>
		</div>
		<?php return; ?>
	<?php endif; ?>

	<?php
	global $APPLICATION;
	$APPLICATION->IncludeComponent(
		'bitrix:main.ui.grid',
		'',
		$arResult['GRID_PARAMS'],
	);
	?>
</div>
<script>
	BX.ready(() => {
		BX.message(<?= Json::encode(Loc::loadLanguageFile(__FILE__)) ?>);

		new BX.Bizproc.Component.StorageList({
			gridId: '<?= CUtil::JSEscape($arResult['GRID_PARAMS']['GRID_ID']) ?>',
		});
	});
</script>
