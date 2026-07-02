<?php

use Bitrix\Main;
use Bitrix\UI\InfoHelper;

if(!defined("B_PROLOG_INCLUDED") || B_PROLOG_INCLUDED !== true)
{
	die();
}

/** @var CMain $APPLICATION */
\CJSCore::Init(['helper']);

$helpWidgetUrl = InfoHelper::getUrl('/widget2/', byLang: true);
$helperInitParams = [
	'frameOpenUrl' => (new Main\Web\Uri($helpWidgetUrl))
		->addParams(['action' => 'open'])
		->getUri(),
	'langId' => LANGUAGE_ID,
	'isNewHelpdesk' => Main\Config\Option::get('intranet', 'isNewHelpdesk', 'N') === 'Y' ? 'Y' : 'N',
];

$APPLICATION->showBodyScripts();
?>
<script>
	BX.ready(function() {
		if (BX.Helper && typeof BX.Helper.init === 'function')
		{
			BX.Helper.init(<?= \CUtil::PhpToJSObject($helperInitParams) ?>);
		}
	});
</script>

</body>
</html>
