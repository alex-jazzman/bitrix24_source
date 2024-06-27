<?php

use Bitrix\Main\Web\Json;

if (!defined("B_PROLOG_INCLUDED") || B_PROLOG_INCLUDED !== true)
{
	die();
}

/**
 * @var array $arResult
 */


$frame = $this->createFrame()->begin("");
?>
<div id="intranet-settings-widget-open-button_<?=$arResult['NUMBER']?>" class="intranet-settings-widget__logo-btn" data-role="holding_widget_pointer">
	<i class="ui-icon-set --settings"></i>
</div>

<script>
	BX.ready(() => {
		const button = BX('intranet-settings-widget-open-button_<?=$arResult['NUMBER']?>');
		const bindCallbackInitial = () => {
			BX.unbindAll(button);
			BX.Intranet.SettingsWidgetLoader.init({
				isRequisite: <?= Json::encode($arResult['IS_REQUISITE']) ?>,
				isBitrix24: <?= Json::encode($arResult['IS_BITRIX24']) ?>,
				isAdmin: <?= Json::encode($arResult['IS_ADMIN']) ?>,
			}).showOnce(button);
		}
		BX.bind(button, 'click', bindCallbackInitial);
	});
</script>
<?php
$frame->end();
