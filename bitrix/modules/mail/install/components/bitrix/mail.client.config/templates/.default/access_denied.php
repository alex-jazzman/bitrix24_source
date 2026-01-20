<?php

use Bitrix\Main\Localization\Loc;

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die;
}
\Bitrix\Main\UI\Extension::load([
	'ui.sidepanel-content',
]);

/** @var \CMain $APPLICATION */
/** @var array $arParams */
$APPLICATION->SetTitle('');
$bodyClass = $APPLICATION->GetPageProperty('BodyClass');
$APPLICATION->SetPageProperty('BodyClass', ($bodyClass ? $bodyClass . ' ' : '') . 'no-all-paddings no-background');
\Bitrix\UI\Toolbar\Facade\Toolbar::deleteFavoriteStar();
?>

<div class="mail-client-config-connect-access-denied-slider-wrapper">
	<div class="mail-client-config-connect-access-denied-slider-icon"></div>
	<div class="mail-client-config-connect-access-denied-slider-text-container">
		<div class="mail-client-config-connect-access-denied-slider-text">
			<?= htmlspecialcharsbx(Loc::getMessage('MAIL_CLIENT_CONFIG_CONNECT_ACCESS_DENIED_TITLE')) ?>
		</div>
		<div class="mail-client-config-connect-access-denied-slider-text">
			<?= htmlspecialcharsbx(Loc::getMessage('MAIL_CLIENT_CONFIG_CONNECT_ACCESS_DENIED_SUB_TITLE')) ?>
		</div>
	</div>
</div>