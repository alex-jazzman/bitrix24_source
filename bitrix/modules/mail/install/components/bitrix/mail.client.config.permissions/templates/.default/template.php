<?php

global $APPLICATION;
if (!defined("B_PROLOG_INCLUDED") || B_PROLOG_INCLUDED !== true)
{
	die;
}

/** @var array $arResult */

use Bitrix\Main\Web\Json;

\Bitrix\Main\Loader::includeModule('ui');

\Bitrix\Main\UI\Extension::load([
	'ui.accessrights.v2',
	'ui.buttons',
	'ui.buttons.icons',
]);

?>

<?php
$APPLICATION->SetTitle($arResult['CONFIG_PERMISSION_TITLE']);

\Bitrix\UI\Toolbar\Facade\Toolbar::deleteFavoriteStar();

$componentId = 'mail-config-permissions-container';
$openPopupEvent = 'mail:onComponentOpen';
$initPopupEvent = 'mail:onComponentLoad';
?>

<div id="<?= $componentId ?>"></div>

<?php
$APPLICATION->SetPageProperty('BodyClass', 'ui-page-slider-wrapper-mail --premissions');

$messages = \Bitrix\Main\Localization\Loc::loadLanguageFile(__FILE__);
?>
	<script>
		BX.message(<?= Json::encode($messages) ?>);

		const slider = BX.SidePanel.Instance.getTopSlider();
		let source = null;
		if (slider)
		{
			source = slider.getData().get('source') || null;
		}

		if (source)
		{
			BX.UI.Analytics.sendData({
				tool: 'mail',
				event: 'mail_rights_open',
				category: 'mail_general_ops',
				c_section: source,
			});
		}

		const accessRightsOptions = {
			component: 'bitrix:mail.client.config.permissions',
			actionSave: 'savePermissions',
			renderTo: document.getElementById('<?= $componentId ?>'),
			userGroups: <?= Json::encode($arResult['USER_GROUPS'] ?? []) ?>,
			accessRights: <?= Json::encode($arResult['ACCESS_RIGHTS'] ?? []) ?>,
			popupContainer: '<?= $componentId ?>',
			openPopupEvent: '<?= $openPopupEvent ?>',
			analytics: <?= Json::encode($arResult['ANALYTICS_CONTEXT'] ?? []) ?>,
		};

		const accessRights = new BX.UI.AccessRights.V2.App(accessRightsOptions);

		window.ConfigPerms = new BX.Mail.ConfigPerms.ConfigPermsComponent({
			accessRightsOptions,
			accessRights
		});

		window.ConfigPerms.init();

		BX.ready(function() {
			setTimeout(function() {
				BX.onCustomEvent('<?= $initPopupEvent ?>', [{openDialogWhenInit: false, multiple: true }]);
			});
		});
	</script>

<?php
$APPLICATION->IncludeComponent('bitrix:ui.button.panel', '', [
	'HIDE' => true,
	'BUTTONS' => [
		[
			'TYPE' => 'save',
			'ONCLICK' => 'window.ConfigPerms.accessRights.sendActionRequest()',
		],
		[
			'TYPE' => 'custom',
			'LAYOUT' => (new \Bitrix\UI\Buttons\Button())
				->setColor(\Bitrix\UI\Buttons\Color::LINK)
				->setText(\Bitrix\Main\Localization\Loc::getMessage('MAIL_CONFIG_PERMISSIONS_CANCEL_BUTTON_TEXT'))
				->bindEvent('click', new \Bitrix\UI\Buttons\JsCode('window.ConfigPerms.accessRights.fireEventReset();'))
				->render(),
		],
	],
]);
