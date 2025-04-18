<?if(!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED!==true)die();

\Bitrix\Main\Localization\Loc::loadMessages(__FILE__);

if (!CModule::IncludeModule('crm'))
{
	$APPLICATION->ThrowException(GetMessage('CRM_MODULE_NOT_INSTALLED'));
	return;
}

if (!\Bitrix\Crm\Service\Container::getInstance()->getUserPermissions()->isCrmAdmin())
{
	$APPLICATION->ThrowException(GetMessage('CRM_PERMISSION_DENIED'));
	return;
}

$strWarning = '';

if (!checkAccountNumberValue(
				$_POST["account_number_template"] ?? null,
				$_POST["account_number_number"] ?? null,
				$_POST["account_number_prefix"] ?? null))
{
	if ($_POST["account_number_template"] == "PREFIX")
		$strWarning .= GetMessage("CRM_ACCOUNT_NUMBER_PREFIX_WARNING", array("#PREFIX#" => $_POST["account_number_prefix"])).'<br>';
	elseif ($_POST["account_number_template"] == "NUMBER")
		$strWarning .= GetMessage("CRM_ACCOUNT_NUMBER_NUMBER_WARNING", array("#NUMBER#" => $_POST["account_number_number"])).'<br>';
}

if($strWarning <> '')
{
	$APPLICATION->ThrowException($strWarning);
	return;
}

// account number generation algorithm
if (isset($_POST["account_number_template"]))
{
	switch ($_POST["account_number_template"])
	{
		case 'NUMBER':
			COption::SetOptionString("sale", "account_number_template", "NUMBER");
			COption::SetOptionString("sale", "account_number_data", intval($_POST["account_number_number"]));
			break;

		case 'PREFIX':
			COption::SetOptionString("sale", "account_number_template", "PREFIX");
			COption::SetOptionString("sale", "account_number_data", $_POST["account_number_prefix"]);
			break;

		case 'RANDOM':
			COption::SetOptionString("sale", "account_number_template", "RANDOM");
			COption::SetOptionString("sale", "account_number_data", intval($_POST["account_number_random_length"]));
			break;

		case 'USER':
			COption::SetOptionString("sale", "account_number_template", "USER");
			COption::SetOptionString("sale", "account_number_data", "");
			break;

		case 'DATE':
			COption::SetOptionString("sale", "account_number_template", "DATE");
			COption::SetOptionString("sale", "account_number_data", $_POST["account_number_date_period"]);
			break;

		default:
			COption::SetOptionString("sale", "account_number_template", "");
			COption::SetOptionString("sale", "account_number_data", "");
			break;
	}
}


function checkAccountNumberValue($templateType, $number_data, $number_prefix)
{
	$res = true;

	switch ($templateType)
	{
		case 'NUMBER':

			if ($number_data == ''
				|| mb_strlen($number_data) > 7
				|| intval($number_data) != $number_data
				|| intval($number_data) < intval(COption::GetOptionString("sale", "account_number_data", ""))
				)
				$res = false;

			break;

		case 'PREFIX':

			if ($number_prefix == ''
				|| mb_strlen($number_prefix) > 7
				|| preg_match('/[^a-zA-Z0-9_-]/', $number_prefix)
				)
				$res = false;

			break;
	}

	return $res;
}
?>