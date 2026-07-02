<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die;
}

use Bitrix\Main\UI\Extension;
use Bitrix\UI\Toolbar\Facade\Toolbar;

/** @var array $arParams */
/** @var array $arResult */
/** @var $APPLICATION */

$component = $this->getComponent();

$bodyClass = $APPLICATION->GetPageProperty('BodyClass');
$APPLICATION->SetPageProperty('BodyClass', ($bodyClass ? $bodyClass . ' ' : '') . 'mail-passwordless-requests-list-page');

Extension::load([
	'main.grid',
	'mail.grid.passwordless-requests-grid',
]);

$APPLICATION->SetTitle($arResult['TITLE']);

Toolbar::deleteFavoriteStar();

Toolbar::addFilter(\Bitrix\Main\Filter\Component\ComponentParams::get($arResult['GRID_FILTER'],
	[
		'GRID_ID' => $arResult['GRID_ID'],
		'FILTER_PRESETS' => $arResult['FILTER_PRESETS'],
		'ENABLE_LIVE_SEARCH' => true,
		'ENABLE_LABEL' => true,
		'CONFIG' => [
			'AUTOFOCUS' => false,
		],
	],
));

$gridContainerId = 'bx-mpl-' . $arResult['GRID_ID'] . '-container';

?><span class="mail-passwordless-requests-grid-container --ui-context-content-light" id="<?= htmlspecialcharsbx($gridContainerId)?>"><?php
	$APPLICATION->IncludeComponent(
		'bitrix:main.ui.grid',
		'',
		$arResult['GRID_PARAMS'],
		$component,
	);
?></span>
<script>
	BX.ready(function()
	{
		const gridId = '<?= CUtil::JSEscape($arResult['GRID_ID']) ?>';

		new BX.Mail.PasswordlessRequestsGrid.GridManager(gridId);
	});
</script>
