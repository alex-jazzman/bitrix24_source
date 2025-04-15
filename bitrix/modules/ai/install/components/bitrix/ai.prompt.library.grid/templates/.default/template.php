<?php

if (!defined("B_PROLOG_INCLUDED") || B_PROLOG_INCLUDED!==true)
{
	die();
}

/** @var CMain $APPLICATION*/
/** @var array $arResult*/
/** @var array $arParams*/

global $APPLICATION;

use Bitrix\Main\Localization\Loc;
use Bitrix\Main\Web\Json;
use Bitrix\AI\Services\CopilotAccessCheckerService;
use Bitrix\AI\Container;
use Bitrix\Main\Application;

\Bitrix\Main\UI\Extension::load(['ui.icon-set, ui.icon-set.main', 'ui.hint', 'ui.forms', 'ui.analytics']);

$APPLICATION->setTitle(Loc::getMessage('PROMPT_LIBRARY_TITLE'));
?>

<div>
<?php
/** @var CopilotAccessCheckerService $copilotAccessCheckerService */
$copilotAccessCheckerService = Container::init()->getItem(CopilotAccessCheckerService::class);
$userId = Bitrix\AI\Facade\User::getCurrentUserId();
$hasAccess = $copilotAccessCheckerService->canShowInFrontend($userId);

if (!$hasAccess)
{
	Application::getInstance()->end();
}

$grid = $arResult['GRID'];

$APPLICATION->IncludeComponent(
	'bitrix:main.ui.grid',
	'',
	$grid,
);

$optionName = 'prompt_share_grid_add_offer';
$userListInOption = CUserOptions::GetOption('ai', $optionName);
if (empty($userListInOption))
{
	$userListInOption = [];
}

$showSimpleTour = false;
if (!in_array($userId, $userListInOption))
{
	$userListInOption[] = $userId;
	CUserOptions::SetOption("ai", $optionName, $userListInOption);
	$showSimpleTour = true;
}
?>
</div>

<script>
	BX.ready(() => {
		BX.UI.Hint.init(BX('main-grid-table'));
		BX.message(<?=Json::encode(Loc::loadLanguageFile(__FILE__))?>);
		BX.AI.SharePrompt.Library.Controller.init('<?= $grid['GRID_ID'] ?>', <?=Json::encode($showSimpleTour)?>);
	});
</script>
