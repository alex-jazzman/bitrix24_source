<?php

use Bitrix\Intranet\Integration;

require($_SERVER['DOCUMENT_ROOT'] . '/bitrix/header.php');

IncludeModuleLangFile($_SERVER['DOCUMENT_ROOT'] . '/bitrix/modules/intranet/public_bitrix24/index.php');

/** @var \CMain $APPLICATION */
$APPLICATION->SetPageProperty('NOT_SHOW_NAV_CHAIN', 'Y');
$APPLICATION->SetPageProperty('title', htmlspecialcharsbx(COption::GetOptionString('main', 'site_name', 'Bitrix24')));

$bodyClass = $APPLICATION->GetPageProperty('BodyClass');
$APPLICATION->SetPageProperty(
	'BodyClass',
	($bodyClass ? $bodyClass . ' ' : '') . 'no-page-header'
);

$integration = Integration\Landing\Vibe\MainPage::getInstance();
if (
	isset($integration)
	&& $integration->getVibe()->canView()
)
{
	$integration->getVibe()->renderView();
}
else
{
	LocalRedirect('/');
}

require($_SERVER["DOCUMENT_ROOT"] . "/bitrix/footer.php");
