<?php

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die;
}

use Bitrix\Crm\Service\Container;
use Bitrix\Main\Grid\Component\ComponentParams;
use Bitrix\Main\UI\Extension;
use Bitrix\Main\Web\Json;

$this->getComponent()->addTopPanel($this);
$this->getComponent()->addToolbar($this);

Extension::load([
	'crm.repeat-sale.sandbox',
]);

Container::getInstance()->getLocalization()->loadMessages();

/** @var array $arResult */
global $APPLICATION;
$GLOBALS['APPLICATION']->SetTitle($arResult['title']);

$gridId = $arResult['grid']->getId();
?>

<script>
	BX.ready(() => {
		new BX.Crm.RepeatSale.Sandbox(
			'repeat-sale-sandbox',
			{
				data: <?= Json::encode($arResult['data'] ?? []) ?>,
				events: {
					onItemSentToAi: (data) => {
						const grid = BX.Main.gridManager.getInstanceById('<?= CUtil::JSEscape($gridId) ?>');
						grid?.reload();
					},
				},
			},
		);
	});
</script>
<div id="repeat-sale-sandbox" class="crm-repeat-sale-sandbox"></div>
<?php

$APPLICATION->IncludeComponent(
	'bitrix:main.ui.grid',
	'',
	ComponentParams::get($arResult['grid']),
);
