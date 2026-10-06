<?php

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

/**
 * @var array $arResult
 * @var CMain $APPLICATION
 */

use Bitrix\Main\Localization\Loc;
use Bitrix\Main\UI\Extension;
use Bitrix\Main\Web\Json;
use Bitrix\UI\AccessRights\V2\Options;
use Bitrix\UI\Buttons\Button;
use Bitrix\UI\Buttons\Color;
use Bitrix\UI\Buttons\JsCode;

/** @var Options|null $options */
$options = $arResult['OPTIONS'] ?? null;
if ($options === null)
{
	return;
}

Extension::load([
	'bizproc.config-permissions',
	'ui.buttons',
	'ui.icon-set.api.vue',
	'ui.icon-set.actions',
]);

$bodyClass = $APPLICATION->GetPageProperty('BodyClass');
$APPLICATION->SetPageProperty('BodyClass', ($bodyClass ? $bodyClass . ' ' : '') . 'no-all-paddings no-background');
?>

<div
	id="<?= htmlspecialcharsbx($options->getContainerId()) ?>"
	data-testid="bizproc-config-permissions-root"
></div>

<script>
	const bizprocAccessRightsApp = new BX.Bizproc.ConfigPermissions(<?= Json::encode($options) ?>).draw();
</script>

<?php
$APPLICATION->IncludeComponent('bitrix:ui.button.panel', '', [
	'HIDE' => true,
	'BUTTONS' => [
		[
			'TYPE' => 'save',
			'ONCLICK' => 'bizprocAccessRightsApp.sendActionRequest().catch(() => {})',
		],
		[
			'TYPE' => 'custom',
			'LAYOUT' => (new Button())
				->setColor(Color::LINK)
				->setText(Loc::getMessage('BIZPROC_CONFIG_PERMISSIONS_BTN_CANCEL'))
				->bindEvent('click', new JsCode('bizprocAccessRightsApp.fireEventReset()'))
				->render()
			,
		],
	],
]);
