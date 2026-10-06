<?
define("STOP_STATISTICS", true);

require_once($_SERVER["DOCUMENT_ROOT"]."/bitrix/modules/main/include/prolog_before.php");

IncludeModuleLangFile(__FILE__);

if (!CModule::IncludeModule('crm'))
	return;

if (!\Bitrix\Crm\Service\Container::getInstance()->getUserPermissions()->isCrmAdmin())
{
	echo GetMessage('CRM_LOC_IMP_ERROR_ACCESS_DENIED');
	require_once($_SERVER["DOCUMENT_ROOT"].BX_ROOT."/modules/main/include/epilog_after.php");
	die();
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST' || !check_bitrix_sessid())
{
	echo GetMessage('CRM_LOC_IMP_ERROR_ACCESS_DENIED');
	require_once($_SERVER["DOCUMENT_ROOT"].BX_ROOT."/modules/main/include/epilog_after.php");
	die();
}

require_once($_SERVER["DOCUMENT_ROOT"]."/bitrix/modules/sale/general/location_import.php");

$tmpPath = CTempFile::GetDirectoryName(12, 'crm');

$arImportParams = array(
	'STEP' => intval($_REQUEST['STEP']),
	'CSVFILE' => $_REQUEST['CSVFILE'],
	'TMP_PATH' => $tmpPath,
	'LOADZIP' => $_REQUEST['LOADZIP'],
	'SYNC' => $_REQUEST['SYNC'],
	'STEP_LENGTH' => $_REQUEST['STEP_LENGTH'],
	'DLZIPFILE' => 'zip_ussr.csv'
);

$arImportResult = saleLocationImport($arImportParams);

echo json_encode($arImportResult);

require_once($_SERVER["DOCUMENT_ROOT"].BX_ROOT."/modules/main/include/epilog_after.php");
?>
