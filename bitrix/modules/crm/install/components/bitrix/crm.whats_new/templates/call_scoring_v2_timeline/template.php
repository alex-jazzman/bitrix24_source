<?php

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

use Bitrix\Main\UI\Extension;
use Bitrix\Main\Web\Json;

Extension::load('crm.call-scoring-v2.timeline-promo');

$options = [
	'closeOptionCategory' => $arParams['CLOSE_OPTION_CATEGORY'] ?? '',
	'closeOptionName' => $arParams['CLOSE_OPTION_NAME'] ?? '',
];

?>

<script>
	BX.ready(() => {
		const popup = new BX.Crm.CallScoringV2.TimelinePromo(<?= Json::encode($options) ?>);

		popup.show();
	});
</script>
