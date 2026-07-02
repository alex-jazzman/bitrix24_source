<?php

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

/** @var array $arResult */

use Bitrix\Main\UI\Extension;
use Bitrix\Main\Web\Json;

Extension::load(['ai.bitrixgpt-agreement-popup']);
?>
<script>
	BX.AI.showBitrixGptAgreementPopup(<?= Json::encode($arResult['POPUP_DATA']) ?>);
</script>
