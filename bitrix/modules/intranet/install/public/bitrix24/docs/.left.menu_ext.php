<?

use Bitrix\Main\IO\File;

if (!defined("B_PROLOG_INCLUDED") || B_PROLOG_INCLUDED !== true)
{
	die();
}

$collaborationMenu = $_SERVER['DOCUMENT_ROOT'] . '/collaboration/.left.menu_ext.php';
if (!defined('SUB_MENU_EXT_CONTEXT') && File::isFileExists($collaborationMenu))
{
	include($collaborationMenu);

	return;
}