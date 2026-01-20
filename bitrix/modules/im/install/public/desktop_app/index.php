<?php
require($_SERVER["DOCUMENT_ROOT"]."/desktop_app/headers.php");
define("BX_SKIP_USER_LIMIT_CHECK", true);
define("AIR_TEMPLATE_HIDE_CHAR_BAR", true);
require_once($_SERVER["DOCUMENT_ROOT"]."/bitrix/modules/main/include/prolog_before.php");

if (!CModule::IncludeModule('im'))
{
	return;
}

global $USER;
global $APPLICATION;
?>

<!DOCTYPE html>

<?php if ((int)$USER->GetID() <= 0 || \Bitrix\Im\User::getInstance()->isConnector()): ?>
	<script>
		if (typeof(BXDesktopSystem) != 'undefined')
		{
			console.log('desktop_app: no auth, calling desktop login function')
			BXDesktopSystem.Login({});
		}
		else
		{
			location.href = '/';
		}
	</script>
	<?php return true; ?>
<?php endif ?>

<?php
$isDesktop = isset($_GET['BXD_API_VERSION']) || mb_strpos($_SERVER['HTTP_USER_AGENT'], 'BitrixDesktop') !== false;
$isIframe = isset($_GET['IFRAME']) && $_GET['IFRAME'] === 'Y';
$isLegacyChat = !$isDesktop && \Bitrix\Im\Settings::isLegacyChatActivated();

if (!$isIframe && !$isLegacyChat)
{
	define("BX_DESKTOP", true);
}

require($_SERVER["DOCUMENT_ROOT"]."/bitrix/header.php");

\Bitrix\Main\Page\Asset::getInstance()->setJsToBody(false);

if (
	\Bitrix\Main\Loader::includeModule('bitrix24')
	&& \Bitrix\Bitrix24\Limits\User::isUserRestricted($USER->GetID())
)
{
	LocalRedirect('/desktop_app/limit.php');
}

IncludeModuleLangFile($_SERVER["DOCUMENT_ROOT"]."/bitrix/modules/im/install/public/desktop_app/index.php");

if (IsModuleInstalled('ui'))
{
	$APPLICATION->IncludeComponent("bitrix:ui.info.helper", "", array());
}

if ($isIframe)
{
	$APPLICATION->IncludeComponent("bitrix:im.messenger", "iframe", Array(
		"CONTEXT" => "FULLSCREEN",
		"DESKTOP" => $isDesktop,
	), false, Array("HIDE_ICONS" => "Y"));
}
else if ($isLegacyChat)
{
	$APPLICATION->IncludeComponent("bitrix:im.messenger", "fullscreen", Array(
		"CONTEXT" => "FULLSCREEN",
		"DESIGN" => "DESKTOP",
		"DESKTOP" => false,
	), false, Array("HIDE_ICONS" => "Y"));
}
else
{
	?>
	<script>
		if (typeof(BXDesktopSystem) != 'undefined')
			BX.desktop.init();
		<?php if (!isset($_GET['BXD_MODE'])): ?>
		else
			location.href = '/';
		<?php endif ?>
	</script>
	<?php
	$APPLICATION->IncludeComponent("bitrix:im.router", "", Array(), false, Array("HIDE_ICONS" => "Y"));

	$diskEnabled = false;
	if(IsModuleInstalled('disk'))
	{
		$diskEnabled =
			\Bitrix\Main\Config\Option::get('disk', 'successfully_converted', false) &&
			CModule::includeModule('disk');
		if($diskEnabled && \Bitrix\Disk\Configuration::REVISION_API >= 5)
		{
			$APPLICATION->IncludeComponent('bitrix:disk.bitrix24disk', '', array('AJAX_PATH' => '/desktop_app/disk.ajax.new.php'), false, Array("HIDE_ICONS" => "Y"));
		}
		else
		{
			$diskEnabled = false;
		}
	}

	if(!$diskEnabled && IsModuleInstalled('webdav'))
	{
		$APPLICATION->IncludeComponent('bitrix:webdav.disk', '', array('AJAX_PATH' => '/desktop_app/disk.ajax.php'), false, Array("HIDE_ICONS" => "Y"));
	}

	if (CModule::IncludeModule('timeman'))
	{
		\Bitrix\Main\UI\Extension::load('im_timecontrol');

		if (class_exists('\Bitrix\Timeman\Monitor\Config'))
		{
			\Bitrix\Main\UI\Extension::load('timeman.monitor');
			?>
				<script>
					BX.Timeman.Monitor.init(<?= \Bitrix\Timeman\Monitor\Config::json() ?>);
				</script>
			<?php
		}
	}
}

require($_SERVER["DOCUMENT_ROOT"]."/bitrix/footer.php");
?>
