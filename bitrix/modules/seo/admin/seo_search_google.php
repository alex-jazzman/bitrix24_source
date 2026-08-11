<?

require_once($_SERVER['DOCUMENT_ROOT']."/bitrix/modules/main/include/prolog_admin_before.php");

define('ADMIN_MODULE_NAME', 'seo');

if (!$USER->CanDoOperation('seo_tools'))
{
	$APPLICATION->AuthForm(GetMessage("ACCESS_DENIED"));
}

// Google webmaster tools admin page used to live here; removed because the integration
// is no longer supported. See repository history for the original implementation.

LocalRedirect('seo_robots.php?lang='.LANGUAGE_ID);
