<?php

use Bitrix\Main\UI\Extension;

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

Extension::load('crm.integration.imopenlines.ai-agent.onboarding-popup');
?>

<script>
	BX.ready(() => {
		const onboardingPopup = new BX.Crm.Integration.Imopenlines.AiAgent.OnboardingPopup({
			closeOptionCategory: '<?= $arParams['CLOSE_OPTION_CATEGORY'] ?? '' ?>',
			closeOptionName: '<?= $arParams['CLOSE_OPTION_NAME'] ?? '' ?>',
			templateId: '<?= $arParams['OPTIONS']['AI_AGENT_TEMPLATE_ID'] ?? 0 ?>',
		});

		onboardingPopup.show();
	});
</script>
