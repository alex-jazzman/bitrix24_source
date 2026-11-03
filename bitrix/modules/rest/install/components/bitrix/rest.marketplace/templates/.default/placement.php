<?php
if(!defined("B_PROLOG_INCLUDED") || B_PROLOG_INCLUDED !== true)
{
	die();
}

/**
 * Bitrix vars
 *
 * @var array $arParams
 * @var array $arResult
 * @var CBitrixComponent $component
 * @var CBitrixComponentTemplate $this
 * @global CMain $APPLICATION
 * @global CUser $USER
 */
use Bitrix\Rest\AppTable;
use Bitrix\Rest\Internal\Service\Placement\LegacyAppIdPresenter;
use Bitrix\Rest\PlacementTable;

$appId = 0;
$placementId = 0;
$placementCode = '';

\Bitrix\Main\UI\Extension::load(['ui.design-tokens']);

$legacyAppIdPresenter = new LegacyAppIdPresenter();

if($arResult["VARIABLES"]["PLACEMENT_ID"] > 0)
{
	$res = PlacementTable::getById(intval($arResult["VARIABLES"]["PLACEMENT_ID"]));
	if($placement = $res->fetch())
	{
		$placementCode = $placement['PLACEMENT'];
		$appId = $legacyAppIdPresenter->encode($placement);
		$placementId = $placement['ID'];
	}
}
elseif($arResult["VARIABLES"]["APP"])
{
	$appInfo = AppTable::getByClientId($arResult["VARIABLES"]["APP"]);
	if(
		$appInfo
		&& $appInfo['ACTIVE'] === AppTable::ACTIVE
		&& $appInfo['INSTALLED'] === AppTable::INSTALLED
	)
	{
		$appId =  $appInfo['ID'];
		$placement = PlacementTable::query()
			->setSelect(['ID'])
			->where('APP_ID', $appInfo['ID'])
			->where('PLACEMENT', \CRestUtil::PLACEMENT_APP_URI)
			->setLimit(1)
			->fetch()
		;
		if($placement)
		{
			$placementCode = \CRestUtil::PLACEMENT_APP_URI;
			$placementId = $placement['ID'];
		}
	}
}

$request = \Bitrix\Main\Application::getInstance()->getContext()->getRequest();
$params = $request->getQuery("params");
?>
<?php
$APPLICATION->includeComponent(
	'bitrix:app.layout',
	'',
	array(
		'ID' => $appId,
		'PLACEMENT' => $placementCode,
		'PLACEMENT_ID' => $placementId,
		'SHOW_LOADER' => 'Y',
		'SET_TITLE' => 'Y',
		'IS_SLIDER' => 'Y',
		'PARAM' => [
		//	'FRAME_WIDTH' => '100%',
		//	'FRAME_HEIGHT' => 'calc(100vh - 80px)',
		],
		'PLACEMENT_OPTIONS' => $params ? : [],
	),
	$component,
	array('HIDE_ICONS' => 'Y')
);
?>
