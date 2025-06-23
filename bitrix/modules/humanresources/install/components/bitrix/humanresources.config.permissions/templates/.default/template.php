<?php

/**
 * @var array $arResult
 * @var array $arParams
 * @var CMain $APPLICATION
 */
if (!defined("B_PROLOG_INCLUDED") || B_PROLOG_INCLUDED !== true)
{
	die();
}

\Bitrix\Main\Loader::includeModule('ui');

Bitrix\Main\UI\Extension::load(
	[
		'ui.accessrights.v2',
		'ui.info-helper',
		'ui.analytics',
	]
);
$componentId = 'bx-access-group';
$initPopupEvent = 'humanresources:onComponentLoad';
$openPopupEvent = 'humanresources:onComponentOpen';
$cantUse = isset($arResult['CANT_USE']);
$analyticContext = is_array($arResult['ANALYTIC_CONTEXT'] ?? null) ? $arResult['ANALYTIC_CONTEXT'] : [];

\Bitrix\UI\Toolbar\Facade\Toolbar::deleteFavoriteStar();

?>

<div id="bx-humanresources-role-main">
</div>

<?php
$APPLICATION->SetPageProperty('BodyClass', 'ui-page-slider-wrapper-hr --premissions');

$APPLICATION->IncludeComponent('bitrix:ui.button.panel', '', [
	'HIDE' => true,
	'BUTTONS' => [
		[
			'TYPE' => 'save',
			'ONCLICK' => $cantUse
				? "(function (button) { BX.UI.InfoHelper.show('limit_office_company_structure'); setTimeout(()=>{button.classList.remove('ui-btn-wait')}, 0)})(this)"
				: "window.AccessRights.sendActionRequest();",
		],
		[
			'TYPE' => 'cancel',
			'ONCLICK' => "window.AccessRights.fireEventReset();",
		],
	],
]);

if($cantUse)
{
	?>
	<script>
		BX.ready(function (){
			BX.UI.InfoHelper.show('limit_office_company_structure');
		});
	</script>
<?php
}
?>


<script>
	BX.ready(function() {
		window.AccessRights = new BX.UI.AccessRights.V2.App({
			renderTo: document.getElementById('bx-humanresources-role-main'),
			userGroups: <?= CUtil::PhpToJSObject($arResult['USER_GROUPS'] ?? []) ?>,
			accessRights: <?= CUtil::PhpToJSObject($arResult['ACCESS_RIGHTS'] ?? []); ?>,
			component: 'bitrix:humanresources.config.permissions',
			actionSave: 'savePermissions',
			popupContainer: '<?= $componentId ?>',
			openPopupEvent: '<?= $openPopupEvent ?>',
			analytics: <?= \Bitrix\Main\Web\Json::encode($analyticContext) ?>,
			additionalMembersParams: {
				addUserGroupsProviderTab: true,
				addProjectsProviderTab: false,
				addStructureTeamsProviderTab: true,
			},
			additionalSaveParams: {
				category: '<?= \CUtil::JSEscape($arResult['CATEGORY']) ?>'
			},
			loadParams: {
				category: '<?= \CUtil::JSEscape($arResult['CATEGORY']) ?>'
			},
		});

		window.AccessRights.draw();

		BX.ready(function() {
			setTimeout(function() {
				BX.onCustomEvent('<?= $initPopupEvent ?>', [{openDialogWhenInit: false, multiple: true }]);
			});
		});
	});
</script>