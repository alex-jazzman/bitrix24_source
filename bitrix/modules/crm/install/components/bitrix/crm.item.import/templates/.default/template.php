<?php

use Bitrix\Main\UI\Extension;
use Bitrix\Main\Web\Json;

if (!defined("B_PROLOG_INCLUDED") || B_PROLOG_INCLUDED !== true)
{
	die();
}

/** @var array $arResult */

Extension::load('crm.item.import');
?>

<div id="crm-item-import-container"></div>
<script>
	BX.ready(() => {
		const importApp = new BX.Crm.Item.Import(<?= Json::encode($arResult['importOptions']) ?>);
		importApp.mount(document.getElementById('crm-item-import-container'));
	});
</script>
