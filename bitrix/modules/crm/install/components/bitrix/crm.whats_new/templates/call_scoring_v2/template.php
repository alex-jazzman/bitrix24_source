<?php

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

use Bitrix\Main\UI\Extension;

Extension::load('crm.call-scoring-v2.script-created-popup');

$options = $arParams['OPTIONS'] ?? [];

?>

<script>
	BX.ready(() => {
		const popup = new BX.Crm.CallScoringV2.ScriptCreatedPopup({
			closeOptionCategory: '<?= CUtil::JSEscape($arParams['CLOSE_OPTION_CATEGORY'] ?? '') ?>',
			closeOptionName: '<?= CUtil::JSEscape($arParams['CLOSE_OPTION_NAME'] ?? '') ?>',
			scriptId: <?= (int)($options['scriptId'] ?? 0) ?>,
			kind: '<?= CUtil::JSEscape($options['kind'] ?? '') ?>',
		});

		popup.show();
	});
</script>