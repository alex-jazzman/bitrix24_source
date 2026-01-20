<?if(!defined("B_PROLOG_INCLUDED") || B_PROLOG_INCLUDED!==true)die();?>
<?
$pageId = "user";

$path = CComponentEngine::MakePathFromTemplate($arResult["PATH_TO_USER"], array("user_id" => $arResult["VARIABLES"]["user_id"]));
$path = CHTTP::urlAddParams($path, array("otp" => "Y"));

if (
	\Bitrix\Main\Context::getCurrent()->getRequest()->get('IFRAME') === 'Y'
	|| \Bitrix\Main\Context::getCurrent()->getRequest()->get('mode') === 'dev'
)
{
	$APPLICATION->IncludeComponent(
		"bitrix:ui.sidepanel.wrapper",
		"",
		array(
			'POPUP_COMPONENT_NAME' => "bitrix:intranet.user.profile.security",
			"POPUP_COMPONENT_TEMPLATE_NAME" => "",
			"POPUP_COMPONENT_PARAMS" =>array(
				"OTP_SUCCESS_URL" => $path,
				"USER_ID" => $arResult["VARIABLES"]["user_id"],
				"PATH_TO_USER_CODES" => $arResult["PATH_TO_USER_CODES"],
				"PATH_TO_USER_PASSWORDS" => $arResult["PATH_TO_USER_PASSWORDS"],
				"PATH_TO_USER_SECURITY" => $arResult["PATH_TO_USER_SECURITY"],
				"PATH_TO_USER_SYNCHRONIZE" => $arResult["PATH_TO_USER_SYNCHRONIZE"],
				"PATH_TO_USER_SOCIAL_SERVICES" => $arResult["PATH_TO_USER_SOCIAL_SERVICES"]
			),
			"POPUP_COMPONENT_PARENT" => $this->getComponent(),
			"USE_UI_TOOLBAR" => "Y",
		)
	);
}
else
{
	$intranetUserListComponentParams = [
		"PATH_TO_DEPARTMENT" => $arParams["PATH_TO_CONPANY_DEPARTMENT"],
		"LIST_URL" => SITE_DIR.'company/',
	];

	if (
		\Bitrix\Main\Loader::includeModule('extranet')
		&& CExtranet::isExtranetSite()
	)
	{
		$intranetSearchComponentParams["LIST_URL"] = SITE_DIR.'contacts/';
	}

	$APPLICATION->includeComponent("bitrix:intranet.user.list", "", $intranetUserListComponentParams);
	?>
	<script>
		BX.ready(() => {
			BX.SidePanel.Instance.open("<?= CUtil::JSEscape($APPLICATION->GetCurUri()) ?>", {
				allowChangeHistory: false,
				cacheable: false,
				width: 1100,
			});
		});
	</script>
	<?php
}
?>