<?php

use Bitrix\Main\Localization\Loc;
use Bitrix\Main\UI\Extension;

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED!==true)
{
	die();
}

Loc::loadMessages(__FILE__);

Extension::load([
	'crm.copilot.call-assessment-v2',
]);

/** @var $arResult array */
$data = $arResult['data'] ?? [];
$assessmentId = (int)($data['id'] ?? 0);
$isNewScript = $assessmentId <= 0;

$config = [
	'readOnly' => $arResult['readOnly'] ?? true,
	'isEnabled' => $arResult['isEnabled'] ?? true,
	'isCopy' => $arResult['isCopy'] ?? false,
	'isNewScript' => $isNewScript,
	'isPendingGeneration' => $arResult['isPendingGeneration'] ?? false,
];
?>
<script>
	BX.ready(() => {
		new BX.Crm.Copilot.CallAssessmentV2(
			'callAssessmentDetailsV2',
			{
				data: <?= \Bitrix\Main\Web\Json::encode($data) ?>,
				config: <?= \Bitrix\Main\Web\Json::encode($config) ?>,
				events: {
					onSave: () => {
						const grid = top.BX?.Main?.gridManager?.getInstanceById('crm_copilot_call_assessment_grid');
						grid?.reload();
					},
				},
			},
		);
	});
</script>
<div id="callAssessmentDetailsV2" class="crm-call-assessment-v2-root"></div>
