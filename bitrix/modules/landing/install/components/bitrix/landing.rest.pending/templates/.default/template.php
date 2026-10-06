<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

use \Bitrix\Main\Localization\Loc;

Loc::loadMessages(__FILE__);

$APPLICATION->includeComponent(
	'bitrix:landing.blocks.message',
	'',
	[
		// the message component prints the value as markup (the phrases carry tags),
		// so the substituted values are escaped here, not the phrase as a whole
		'MESSAGE' => !$arResult['APP_INFO']
					? Loc::getMessage('LANDING_TPL_APP_NOT_FOUND', [
						'#APP_CODE#' => htmlspecialcharsbx($arResult['APP_CODE'])
					])
					: Loc::getMessage('LANDING_TPL_BLOCK_NOT_FOUND', [
						'#APP_NAME#' => htmlspecialcharsbx($arResult['APP_INFO']['APP_NAME'])
					])
	],
	false
);