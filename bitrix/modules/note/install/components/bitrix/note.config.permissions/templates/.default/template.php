<?php

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

use Bitrix\Main\Localization\Loc;
use Bitrix\Main\Web\Json;
use Bitrix\UI\Buttons;

/**
 * @var array $arResult
 * @var array $arParams
 * @var CMain $APPLICATION
 */

\Bitrix\Main\UI\Extension::load([
	'ui.accessrights.v2',
	'ui.buttons',
	'ui.icon-set.api.vue',
	'ui.icon-set.actions',
]);

$bodyClass = $APPLICATION->GetPageProperty('BodyClass');
$APPLICATION->SetPageProperty('BodyClass', ($bodyClass ? $bodyClass . ' ' : '') . 'no-all-paddings no-background');

\Bitrix\UI\Toolbar\Facade\Toolbar::deleteFavoriteStar();
?>

<div id="bx-note-role-main"></div>

<?php
$APPLICATION->IncludeComponent('bitrix:ui.button.panel', '', [
	'HIDE' => true,
	'BUTTONS' => [
		[
			'TYPE' => 'save',
			'ONCLICK' => 'noteAccessRightsApp.sendActionRequest().catch(() => {})',
		],
		[
			'TYPE' => 'custom',
			'LAYOUT' => (new Buttons\Button())
				->setColor(Buttons\Color::LINK)
				->setText(Loc::getMessage('NOTE_ACCESS_RIGHTS_BUTTON_CANCEL'))
				->bindEvent('click', new Buttons\JsCode('noteAccessRightsApp.fireEventReset()'))
				->render(),
		],
	],
]);
?>

<script>
	const noteAccessRightsApp = new BX.UI.AccessRights.V2.App({
		renderTo: document.getElementById('bx-note-role-main'),
		userGroups: <?= Json::encode($arResult['USER_GROUPS']) ?>,
		accessRights: <?= Json::encode($arResult['ACCESS_RIGHTS']) ?>,
		component: 'bitrix:note.config.permissions',
		actionSave: 'savePermissions',
		moduleId: 'note',
		analytics: {
			onCancelChanges: () => {},
			onSaveError: () => {},
			onSaveSuccess: () => {},
		},
		searchContainerSelector: '#uiToolbarContainer',
		isSaveAccessRightsList: true,
	});

	noteAccessRightsApp.draw();
</script>
<?php
$tariffSliderCode = (string)($arResult['TARIFF_SLIDER_CODE'] ?? '');
if ($tariffSliderCode !== '')
{
	// Tariff/tool blocks access: the permissions interface stays mounted underneath
	// while the tariff slider opens on top; closing the slider redirects the user away.
	// Unlike note.editor, no mobile guard on the redirect is needed here: the permissions
	// config is a desktop-only admin surface and is never opened in the mobile webview.
	\Bitrix\Main\UI\Extension::load(['main.sidepanel', 'ui.info-helper']);
	?>
	<script>
		BX.ready(() => {
			BX.addCustomEvent('SidePanel.Slider:onCloseComplete', () => {
				window.location.replace('/');
			});
			BX.UI.InfoHelper.show('<?= CUtil::JSEscape($tariffSliderCode) ?>', {
				isLimit: true,
				limitAnalyticsLabels: { module: 'note' },
			});
		});
	</script>
	<?php
}
?>
