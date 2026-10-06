<?php

use Bitrix\Main\UI\Extension;
use Bitrix\Main\Web\Json;

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

Extension::load([
	'crm.copilot.call-assessment-summary',
]);

/** @var array $arResult */
$settings = $arResult['settings'] ?? [];
$recipients = $arResult['recipients'] ?? [];
?>
<script>
	BX.ready(() => {
		new BX.Crm.Copilot.CallAssessmentSummary(
			'callAssessmentSummary',
			{
				settings: <?= Json::encode($settings) ?>,
				recipients: <?= Json::encode($recipients) ?>,
			},
		);
	});
</script>
<div id="callAssessmentSummary" class="crm-call-assessment-summary"></div>
