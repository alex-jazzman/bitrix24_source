<?php

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

/** @var array $arResult */

use Bitrix\Main\Localization\Loc;
use Bitrix\Main\UI\Extension;
use Bitrix\Main\Web\Json;
use Bitrix\UI\AccessRights\V2\Options;
use Bitrix\UI\Buttons\Button;
use Bitrix\UI\Buttons\Color;
use Bitrix\UI\Buttons\JsCode;

global $APPLICATION;

$bodyClass = $APPLICATION->GetPageProperty('BodyClass');
$APPLICATION->SetPageProperty('BodyClass', ($bodyClass ? $bodyClass . ' ' : '') . 'no-all-paddings no-background');

Extension::load('ui.accessrights.v2');

/** @var Options $options */
$options = $arResult['accessRightsOptions'];
?>

<div class="documentgenerator__access-rights-container" id="<?= $options->getContainerId() ?>"></div>
<script>
	const accessRights = new BX.UI.AccessRights.V2.App(<?= Json::encode($options) ?>);
	accessRights.draw();
</script>

<?php
$APPLICATION->IncludeComponent('bitrix:ui.button.panel', '', [
	'HIDE' => true,
	'BUTTONS' => [
		[
			'TYPE' => 'save',
			'ONCLICK' => 'accessRights.sendActionRequest()',
		],
		[
			'TYPE' => 'custom',
			'LAYOUT' => (new Button())
				->setColor(Color::LINK)
				->setText(Loc::getMessage('DOCGEN_SETTINGS_PERMS_ROLE_CANCEL'))
				->bindEvent('click', new JsCode('accessRights.fireEventReset()'))
				->render()
			,
		],
	],
]);
