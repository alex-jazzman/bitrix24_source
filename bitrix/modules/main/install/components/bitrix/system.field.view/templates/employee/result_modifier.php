<?if(!defined("B_PROLOG_INCLUDED") || B_PROLOG_INCLUDED!==true)die();

$arValue = array();

if(empty($arParams['arUserField']['SETTINGS']))
	$arParams['arUserField']['SETTINGS'] = array();
if (!$arParams['arUserField']['SETTINGS']['USER_URL'])
	$arParams['arUserField']['SETTINGS']['USER_URL'] = COption::GetOptionString('intranet', 'path_user', '/company/personal/user/#USER_ID#/');

$arResult['VALUE'] = array_filter($arResult['VALUE'], "intval");

if (is_array($arResult['VALUE']) && !empty($arResult['VALUE']))
{

	$dbRes = CUser::GetList(
		"LAST_NAME", "ASC",
		array(
			'ACTIVE' => 'Y', 
			'ID' => implode('|', $arResult['VALUE'])
		)
	);
	while ($arRes = $dbRes->Fetch())
	{
		$arValue[$arRes['ID']] = $arRes;
	}
}
$arResult['VALUE'] = $arValue;
?>
