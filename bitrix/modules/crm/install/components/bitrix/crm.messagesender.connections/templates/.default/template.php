<?php

use Bitrix\Main\Localization\Loc;
use Bitrix\Main\Web\Json;

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

/**
 * @var array $arParams
 * @var array $arResult
 * @var CMain $APPLICATION
 * @var CBitrixComponent $component
 * @var CBitrixComponentTemplate $this
 */

\Bitrix\Main\UI\Extension::load([
	'ui.icon-set.api.core',
	'ui.icon-set.api.vue',
	'ui.icon-set.actions',
	'ui.icon-set.main',
	'ui.icon-set.social',
	'ui.icon-set.contact-center',
	'ui.icon-set.crm',
	'ui.icon-set.editor',
	'ui.buttons',
	'main.sidepanel',
	'crm.integration.analytics',
	'ui.analytics',
]);

$APPLICATION->SetTitle(Loc::getMessage('CRM_MESSAGESENDER_CONNECTIONS_TITLE'));

$slider = $arResult['SLIDER'] ?? null;
if (!($slider instanceof \Bitrix\Crm\MessageSender\UI\ConnectionsSlider))
{
	throw new \Bitrix\Main\ObjectNotFoundException('No slider in result');
}

$containerId = 'crm-message-sender-connections-container';

$messages = Loc::loadLanguageFile(__FILE__);

?>
<div id="<?=$containerId?>"></div>

<script>
	BX.ready(() => {
		BX.message(<?=Json::encode($messages)?>);

		(new BX.Crm.MessageSenderConnectionsComponent({
			slider: <?=Json::encode($slider)?>,
			currentPage: '<?= $arResult['CURRENT_PAGE_ID'] ?>',
			targetNodeId: '<?=$containerId?>',
			contactCenterUrl: '<?=$arResult['CONTACT_CENTER_URL']?>',
			analytics: <?=Json::encode($arResult['ANALYTICS'])?>,
		})).init();
	});
</script>
