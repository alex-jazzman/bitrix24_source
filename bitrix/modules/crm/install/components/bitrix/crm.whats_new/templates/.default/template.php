<?php

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

use Bitrix\Main\UI\Extension;
use Bitrix\Main\Web\Json;

Extension::load('crm.integration.ui.banner-dispatcher');

?>

<script>
	BX.ready(function() {
		var options = <?= Json::encode([
			'slides' => $arParams['SLIDES'] ?? [],
			'steps' => $arParams['STEPS'] ?? [],
			'options' => $arParams['OPTIONS'] ?? [],
			'closeOptionCategory' => $arParams['CLOSE_OPTION_CATEGORY'] ?? '',
			'closeOptionName' => $arParams['CLOSE_OPTION_NAME'] ?? '',
		]) ?>;

		var whatsNew = new BX.Crm.WhatsNew.ActionViewMode(options);
		whatsNew.show();
	});
</script>
