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
use Bitrix\Main\Loader;
use Bitrix\Ui\Public\Services\Copilot\CopilotNameService;
use Bitrix\Main\Web\Json;

\Bitrix\Main\UI\Extension::load(['ui.icon-set, ui.icon-set.main', 'ui.hint', 'ui.forms', 'ui.analytics']);

$APPLICATION->setTitle(Loc::getMessage('PROMPT_LIBRARY_TITLE'));
?>

<div>
<?php
$userId = Bitrix\AI\Facade\User::getCurrentUserId();

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

$copilotName = 'CoPilot';
if (Loader::includeModule('ai'))
{
	$copilotName = (new CopilotNameService())->getCopilotName();
}

$messages = Loc::loadLanguageFile(__FILE__);
foreach ([
	'PROMPT_LIBRARY_GRID_NOTIFICATION_SHOW_MSGVER_1',
	'PROMPT_LIBRARY_GRID_NOTIFICATION_HIDE_MSGVER_1',
	'PROMPT_LIBRARY_GRID_NOTIFICATION_MASS_SHOW_MSGVER_1',
	'PROMPT_LIBRARY_GRID_NOTIFICATION_MASS_HIDE_MSGVER_1',
] as $messageCode)
{
	$messages[$messageCode] = Loc::getMessage($messageCode, [
		'#COPILOT_NAME#' => $copilotName,
	]);
}
$messages['COPILOT_NAME'] = $copilotName;
?>
</div>

<script>
	BX.ready(() => {
		BX.UI.Hint.init(BX('main-grid-table'));
		BX.message(<?=Json::encode($messages)?>);
		BX.AI.SharePrompt.Library.Controller.init('<?= $grid['GRID_ID'] ?>', <?=Json::encode($showSimpleTour)?>);
	});
</script>
