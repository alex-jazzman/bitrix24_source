<?if(!defined("B_PROLOG_INCLUDED") || B_PROLOG_INCLUDED!==true)die();?>
<?
if (
	!defined("SITE_TEMPLATE_ID")
	|| (SITE_TEMPLATE_ID != "bitrix24" && SITE_TEMPLATE_ID !== 'air')
)
{
	?><?
	$arUserProfileResult = $APPLICATION->IncludeComponent(
		"bitrix:socialnetwork.user_profile",
		"short",
		Array(
			"PATH_TO_USER" => $arResult["PATH_TO_USER"],
			"PATH_TO_USER_EDIT" => $arResult["PATH_TO_USER_PROFILE_EDIT"],
			"PATH_TO_USER_FRIENDS" => $arResult["PATH_TO_USER_FRIENDS"],
			"PATH_TO_USER_GROUPS" => $arResult["PATH_TO_USER_GROUPS"],
			"PATH_TO_USER_FRIENDS_ADD" => $arResult["PATH_TO_USER_FRIENDS_ADD"],
			"PATH_TO_USER_FRIENDS_DELETE" => $arResult["PATH_TO_USER_FRIENDS_DELETE"],
			"PATH_TO_MESSAGE_FORM" => $arResult["PATH_TO_MESSAGE_FORM"],
			"PATH_TO_MESSAGES_CHAT" => $arResult["PATH_TO_MESSAGES_CHAT"],
			"PATH_TO_MESSAGES_USERS_MESSAGES" => $arResult["PATH_TO_MESSAGES_USERS_MESSAGES"],
			"PATH_TO_USER_SETTINGS_EDIT" => $arResult["PATH_TO_USER_SETTINGS_EDIT"],
			"PATH_TO_GROUP" => $arParams["PATH_TO_GROUP"],
			"PATH_TO_GROUP_CREATE" => $arResult["PATH_TO_GROUP_CREATE"],
			"PATH_TO_USER_FEATURES" => $arResult["PATH_TO_USER_FEATURES"],
			"PATH_TO_USER_REQUESTS" => $arResult["PATH_TO_USER_REQUESTS"],
			"PAGE_VAR" => $arResult["ALIASES"]["page"],
			"USER_VAR" => $arResult["ALIASES"]["user_id"],
			"SET_NAV_CHAIN" => "N",
			"SET_TITLE" => "N",
			"USER_PROPERTY_MAIN" => $arResult["USER_PROPERTY_MAIN"],
			"USER_PROPERTY_CONTACT" => $arResult["USER_PROPERTY_CONTACT"],
			"USER_PROPERTY_PERSONAL" => $arResult["USER_PROPERTY_PERSONAL"],
			"USER_FIELDS_MAIN" => $arResult["USER_FIELDS_MAIN"],
			"USER_FIELDS_CONTACT" => $arResult["USER_FIELDS_CONTACT"],
			"USER_FIELDS_PERSONAL" => $arResult["USER_FIELDS_PERSONAL"],
			"DATE_TIME_FORMAT" => $arResult["DATE_TIME_FORMAT"],
			"SHORT_FORM" => "Y",
			"ITEMS_COUNT" => $arParams["ITEM_MAIN_COUNT"],
			"ID" => $arResult["VARIABLES"]["user_id"],
			"PATH_TO_GROUP_REQUEST_GROUP_SEARCH" => $arResult["PATH_TO_GROUP_REQUEST_GROUP_SEARCH"],
			"PATH_TO_CONPANY_DEPARTMENT" => $arParams["PATH_TO_CONPANY_DEPARTMENT"],
			"NAME_TEMPLATE" => $arParams["NAME_TEMPLATE"],
			"SHOW_LOGIN" => $arParams["SHOW_LOGIN"],
			"PATH_TO_VIDEO_CALL" => $arResult["PATH_TO_VIDEO_CALL"],
		),
		$component,
		array("HIDE_ICONS" => "Y")
	);
	?><?
}
