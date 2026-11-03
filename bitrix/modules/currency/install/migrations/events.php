<?php
$event = \Bitrix\Main\UpdateSystem\Migration::getInstance()->event();

$event
	->registerCompatible('iblock', 'OnIBlockPropertyBuildList', '\Bitrix\Currency\Integration\IblockMoneyProperty', 'getUserTypeDescription')
	->registerCompatible('main', 'OnUserTypeBuildList', '\Bitrix\Currency\UserField\Money', 'getUserTypeDescription')
	->register('main', 'OnAfterLanguageAdd', '\Bitrix\Currency\CurrencyLangTable', 'onLanguageAddHandler')
	->register('main', '\Bitrix\Main\Localization\Language::OnAfterAdd', '\Bitrix\Currency\CurrencyLangTable', 'onLanguageAddHandler')
;
