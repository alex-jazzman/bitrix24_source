<?php

use Bitrix\Crm\Tour\PermissionsOnboardingPopup;
use Bitrix\Main\Localization\Loc;
use Bitrix\Main\Web\Json;

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

/** @var array $arResult */
/** @var \CMain $APPLICATION */
/** @var \CBitrixComponentTemplate $this */

$bodyClass = $APPLICATION->GetPageProperty('BodyClass');
$APPLICATION->SetPageProperty('BodyClass', ($bodyClass ? "{$bodyClass} " : '') . 'no-all-paddings no-background');


\Bitrix\Main\Loader::includeModule('ui');
\Bitrix\Main\UI\Extension::load([
	'ui.accessrights.v2',
]);

$bodyClass = $APPLICATION->GetPageProperty('BodyClass');
$APPLICATION->SetPageProperty('BodyClass', ($bodyClass ? $bodyClass . ' ' : '') . 'no-all-paddings no-background');

/** @var \Bitrix\UI\AccessRights\V2\Options $options */
$options = $arResult['options'];

$searchContainerId = str_replace('#', '', $options->getSearchContainerSelector());
echo (\Bitrix\Crm\Tour\ConfigPermsUserSelector::getInstance())->build();

?>
<div class="crm-config-perms-v2-header">
	<?php if (!$arResult['shouldDisplayLeftMenu']):?>
		<div class="crm-config-perms-v2-header-title"><?=Loc::getMessage('CRM_COMMON_PERMISSIONS_SETTINGS_ITEM')?></div>
	<?php endif;?>
	<div id="<?= htmlspecialcharsbx($searchContainerId) ?>"></div>
</div>
<?php

if ($arResult['isSharedCrmPermissionsSlider'])
{
	echo PermissionsOnboardingPopup::getInstance()->build();
}

if ($arResult['shouldDisplayLeftMenu'])
{
	$APPLICATION->IncludeComponent(
		'bitrix:ui.sidepanel.wrappermenu',
		'',
		[
			'TITLE' => Loc::getMessage('CRM_COMMON_PERMISSIONS_SETTINGS_ITEM'),
			'ITEMS' => $arResult['leftMenu'],
			'AUTO_HIDE_SUBMENU' => true,
		],
	);
}

$messages = Loc::loadLanguageFile(__FILE__);
?>

<div id="<?= htmlspecialcharsbx($options->getContainerId()) ?>"></div>

<script>
	BX.message(<?=Json::encode($messages)?>);
	const AccessRightsOption = <?= Json::encode($options) ?>;
	const AccessRights = new BX.UI.AccessRights.V2.App(AccessRightsOption);
	const ConfigPerms = new BX.Crm.ConfigPermsComponent({
		menuId: '<?=$arResult['menuId']?>',
		AccessRightsOption,
		AccessRights,
		hasLeftMenu: <?=$arResult['shouldDisplayLeftMenu'] ? 'true' : 'false' ?>,
		useAirDesign: <?= defined('AIR_SITE_TEMPLATE') ? 'true' : 'false' ?>,
	});

	ConfigPerms.init();
</script>

<?php
\Bitrix\Crm\Service\Container::getInstance()->getLocalization()->loadMessages();

$APPLICATION->IncludeComponent('bitrix:ui.button.panel', '', [
	'HIDE' => true,
	'BUTTONS' => [
		[
			'TYPE' => 'save',
			'ONCLICK' => 'ConfigPerms.AccessRights.sendActionRequest()',
		],
		[
			'TYPE' => 'custom',
			'LAYOUT' => (new \Bitrix\UI\Buttons\Button())
				->setColor(\Bitrix\UI\Buttons\Color::LINK)
				->setText(Loc::getMessage('CRM_COMMON_CANCEL'))
				->bindEvent('click', new \Bitrix\UI\Buttons\JsCode('ConfigPerms.AccessRights.fireEventReset()'))
				->render()
			,
		],
	],
]);
