<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

global $APPLICATION;

$APPLICATION->IncludeComponent(
	"bitrix:system.auth.registration",
	\COption::GetOptionString("main", "auth_components_template", ""),
	[
		"AUTH_RESULT" => $arResult['AUTH_RESULT'],
		"NOT_SHOW_LINKS" => 'N',
	]
);