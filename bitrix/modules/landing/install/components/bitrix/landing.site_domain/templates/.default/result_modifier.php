<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

use Bitrix\Main\Localization\Loc;

if ($arResult['FATAL'] ?? false)
{
	return;
}

// accessible description is plain text: markup line breaks give no pause there
$flattenDomainRules = static fn(string $rules): string =>
	trim(strip_tags(preg_replace('#\.?\s*<br\s*/?>\s*#i', '. ', $rules)));

$arResult['DOMAIN_RULES_TEXT'] = $flattenDomainRules((string)Loc::getMessage('LANDING_TPL_DOMAIN_RULES'));
$arResult['B24_DOMAIN_RULES_TEXT'] = $flattenDomainRules((string)Loc::getMessage('LANDING_TPL_DOMAIN_RULES_B24'));

$arResult['IS_FREE_DOMAIN'] = false;

if ($arResult['B24_DOMAIN_NAME'])
{
	$arResult['DOMAIN_NAME'] = '';
	$arResult['~DOMAIN_NAME'] = '';
}
else
{
	$arResult['IS_FREE_DOMAIN'] = $arResult['REGISTER']->getCode()
							 == $arResult['DOMAIN_PROVIDER'];
}