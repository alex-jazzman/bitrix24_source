<?if(!defined("B_PROLOG_INCLUDED") || B_PROLOG_INCLUDED!==true)die();?>
<?
use Bitrix\Main\Localization\Loc;
use Bitrix\Main\Page;
use Bitrix\Main\UI\Extension;

$APPLICATION->SetTitle("");
Page\Asset::getInstance()->addJs($templateFolder.'/js/form-entity.js');
Extension::load(['intranet.logout-all-confirm']);
\Bitrix\UI\Toolbar\Facade\Toolbar::deleteFavoriteStar();
\Bitrix\UI\Toolbar\Facade\Toolbar::hideTitle();
?>
<script>
	new BX.Intranet.UserProfile.Password.EntityEditor({});
</script>
<div class="js-intranet-password">
	<?
	$APPLICATION->IncludeComponent(
		"bitrix:ui.form",
		"",
		array(
			"GUID" => "INTRANET_USER_PROFILE_PASSWORD",
			"INITIAL_MODE" => "edit",
			"ENTITY_TYPE_NAME" => "USER",
			"ENTITY_ID" => $arParams["USER_ID"],
			"ENTITY_FIELDS" => $arResult["FormFields"],
			"ENTITY_CONFIG" => $arResult["FormConfig"],
			"ENABLE_PERSONAL_CONFIGURATION_UPDATE" => false,
			"ENABLE_COMMON_CONFIGURATION_UPDATE" => false,
			"ENABLE_SETTINGS_FOR_ALL" => false,
			"ENABLE_SECTION_EDIT" => false,
			"ENABLE_SECTION_CREATION" => false,
			"ENABLE_SECTION_DRAG_DROP" => false,
			"ENABLE_CONFIG_CONTROL" => false,
			"ENABLE_MODE_TOGGLE" => false,
			"ENABLE_CONFIG_SCOPE_TOGGLE" => false,
			"COMPONENT_AJAX_DATA" => array(
				"COMPONENT_NAME" => $this->getComponent()->getName(),
				"ACTION_NAME" => "save",
				"SIGNED_PARAMETERS" => $this->getComponent()->getSignedParameters()
			)
		)
	);

	if ($arResult["IsOwnProfile"]):?>
	<div style="margin-left: 20px">
		<span class="ui-btn ui-btn-light-border" data-role="intranet-pass-logout"><?=GetMessage("INTRANET_USER_PROFILE_PASSWORD_LOGOUT")?></span>
	</div>
	<?endif; ?>
</div>

<script>
	BX.ready(() => {
		new BX.Intranet.UserProfile.Password();
		const editor = BX.UI.EntityEditor.get('INTRANET_USER_PROFILE_PASSWORD') || BX.UI.EntityEditor.getDefault();
		editor.cancel = () => {
			BX.SidePanel.Instance.close();
		};
		BX.addCustomEvent(window, "BX.UI.EntityEditor:onSave", function(editor, eventArgs) {
			if (editor.getId() === "INTRANET_USER_PROFILE_PASSWORD")
			{
				eventArgs.enableCloseConfirmation = false;
			}
		});
		BX.addCustomEvent(window, "onEntityUpdate", function(eventParams) {
			if (eventParams.sender && eventParams.sender.getId() === "INTRANET_USER_PROFILE_PASSWORD")
			{
				BX.SidePanel.Instance.close();
			}
		});
	});

</script>
