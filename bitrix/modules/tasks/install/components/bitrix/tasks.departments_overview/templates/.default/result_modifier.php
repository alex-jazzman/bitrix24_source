<?
if (!defined("B_PROLOG_INCLUDED") || B_PROLOG_INCLUDED !== true)
{
	die();
}

use Bitrix\Main\Localization\Loc;
use Bitrix\Main\Web\Uri;
use Bitrix\Tasks\UI;
use Bitrix\Tasks\Util\User;

// create template controller with js-dependency injections
$arResult['HELPER'] = $helper = require(__DIR__.'/helper.php');
$arParams =& $helper->getComponent(
)->arParams; // make $arParams the same variable as $this->__component->arParams, as it really should be

if ($helper->checkHasFatals())
{
	return;
}

//region TITLE
$sTitle = $sTitleShort = GetMessage("TASKS_MANAGE_TITLE");
$APPLICATION->SetPageProperty("title", $sTitle);
$APPLICATION->SetTitle($sTitleShort);
//endregion TITLE

$arResult['JS_DATA'] = [
	'filterId' => $arParams['FILTER_ID'],
	'taskLimitExceeded' => $arResult['TASK_LIMIT_EXCEEDED'],
	'pathToTasks' => $arParams['PATH_TO_TASKS'],
];

function prepareEffective($row, $arParams)
{
	$className = 'tasks-manage-effective';
	if ($row['EFFECTIVE'] < 50)
	{
		$className .= ' tasks-manage-effective-low';
	}

	$url = CComponentEngine::MakePathFromTemplate(
		$arParams['PATH_TO_USER_TASKS'].'effective/',
		array('user_id' => $row['ID'])
	);

	return '<a class="'.
		   $className.'" href="'.
		   htmlspecialcharsbx($url).
		   '">'.
		   (int)$row['EFFECTIVE'].
		   '%</a>';
}

function prepareCounter($counter, $role)
{
	$total = (int)$counter['ALL'];
	$expired = (int)$counter['NOTICE'];
	$accessibleText = Loc::getMessage(
		'TASKS_DEPARTMENTS_OVERVIEW_COUNTER_ARIA_LABEL',
		[
			'#ROLE#' => $role,
			'#TOTAL#' => $total,
			'#EXPIRED#' => $expired,
		]
	);
	$hasAccessibleText = is_string($accessibleText) && $accessibleText !== '';
	$accessibleText = $hasAccessibleText
		? '<span class="tasks-overview-visually-hidden">'.htmlspecialcharsbx($accessibleText).'</span>'
		: '';
	$ariaHidden = $hasAccessibleText ? ' aria-hidden="true"' : '';

	$sub = '';
	if ($expired > 0)
	{
		$sub = '<span class="tasks-manage-counter-notify-digit">'.$expired.'</span>';
	}
	return '<span class="tasks-manage-counter">
					<span class="tasks-manage-counter-total">
						<a href="'.htmlspecialcharsbx($counter['URL']).'">
							'.$accessibleText.'
							<span'.$ariaHidden.'>'.$total.'</span>
						</a>
					</span>
					<span class="tasks-manage-counter-notify"'.$ariaHidden.'>'.$sub.'</span>
				</span>';
}

function prepareDepartments($row, $result)
{
	$list = [];
	$departments = $result['DEPARTMENTS'];

	if ($row['UF_DEPARTMENT'])
	{
		foreach ($row['UF_DEPARTMENT'] as $departmentId)
		{
			$departmentId = (int)$departmentId;
			$list[] = '<button type="button" class="js-id-department tasks-manage-department-button" data-department-id="'.
					  $departmentId.
					  '" data-user-id="'.
					  (int)$row['ID'].
					  '">'.
					  htmlspecialcharsbx($departments[$departmentId]['NAME']).
					  '</button>';
		}
	}

	return join(', ', $list);
}

function prepareRow($row, $arParams, $arResult)
{
	$resultRow = array(
		'ID' => $row['ID'],
		'NAME' => prepareTaskRowUserBalloonHtml($row, $arParams),
		'DEPARTMENTS' => prepareDepartments($row, $arResult),

		'EFFECTIVE' => prepareEffective($row, $arParams),
		'RESPONSIBLE' => prepareCounter(
			$arResult['COUNTERS'][$row['ID']]['RESPONSIBLE'],
			GetMessage('TASKS_MANAGE_COLUMN_RESPONSIBLE')
		),
		'ORIGINATOR' => prepareCounter(
			$arResult['COUNTERS'][$row['ID']]['ORIGINATOR'],
			GetMessage('TASKS_MANAGE_COLUMN_ORIGINATOR')
		),
		'ACCOMPLICE' => prepareCounter(
			$arResult['COUNTERS'][$row['ID']]['ACCOMPLICE'],
			GetMessage('TASKS_MANAGE_COLUMN_ACCOMPLICE')
		),
		'AUDITOR' => prepareCounter(
			$arResult['COUNTERS'][$row['ID']]['AUDITOR'],
			GetMessage('TASKS_MANAGE_COLUMN_AUDITOR')
		),
	);

	return $resultRow;
}

/**
 * @param array $user
 * @param array $arParams
 * @return string
 */
function prepareTaskRowUserBalloonHtml(array $user, array $arParams)
{
	$user['AVATAR'] = UI::getAvatar($user['PERSONAL_PHOTO'], 100, 100);
	$user['IS_EXTERNAL'] = User::isExternalUser($user['ID']);
	$user['URL'] = CComponentEngine::MakePathFromTemplate($arParams['PATH_TO_USER_PROFILE'], ['user_id' => $user['ID']]);

	$userName = htmlspecialcharsbx(User::formatName($user));
	$userUrl = htmlspecialcharsbx($user['URL']);

	$emptyAvatar = ($user['AVATAR'] ? '' : ' tasks-grid-avatar-empty');
	$style = ($user['AVATAR'] ? ' style="background-image: url(\''. Uri::urnEncode($user['AVATAR']).'\')"' : '');

	return
		'<div class="tasks-grid-username-wrapper">'
			."<a href='{$userUrl}' class='tasks-grid-username'>"
				."<span class='ui-icon ui-icon-common-user tasks-grid-avatar{$emptyAvatar}'><i{$style}></i></span>"
				."<span class='tasks-grid-username-inner'>{$userName}</span>"
			.'</a>'
		.'</div>'
	;
}

$arResult['ROWS'] = [];

foreach ($arResult['GRID']['DATA'] as $row)
{
	$rowItem = [
		"id" => $row["ID"],
		'columns' => prepareRow($row, $arParams, $arResult),
	];

	$arResult['ROWS'][] = $rowItem;
}

function prepareSummaryCounter($counter, $role)
{
	$total = (int)$counter['ALL'];
	$expired = (int)$counter['NOTICE'];
	$accessibleText = Loc::getMessage(
		'TASKS_DEPARTMENTS_OVERVIEW_COUNTER_ARIA_LABEL',
		[
			'#ROLE#' => $role,
			'#TOTAL#' => $total,
			'#EXPIRED#' => $expired,
		]
	);
	$hasAccessibleText = is_string($accessibleText) && $accessibleText !== '';
	$accessibleText = $hasAccessibleText
		? '<span class="tasks-overview-visually-hidden">'.htmlspecialcharsbx($accessibleText).'</span>'
		: '';
	$ariaHidden = $hasAccessibleText ? ' aria-hidden="true"' : '';

	$sub = '';
	if ($expired > 0)
	{
		$sub = '<span class="tasks-manage-counter-notify-digit">'.$expired.'</span>';
	}

	return '<span class="tasks-manage-counter">
			'.$accessibleText.'
			<span class="tasks-manage-counter-total-bottom"'.$ariaHidden.'>'.$total.'</span>
			<span class="tasks-manage-counter-notify"'.$ariaHidden.'>'.$sub.'</span>
		</span>';
}

$rowItem = [
	"id" => 'summary',
	'columns' => [
		'ID' => $row['ID'] ?? null,
		'NAME' => '<strong>'.GetMessage('TASKS_ROW_SUMMARY').'</strong>',

		'EFFECTIVE' => '<strong>'.round($arResult['SUMMARY']['EFFECTIVE']).'%'.'</strong>',
		'RESPONSIBLE' => prepareSummaryCounter(
			$arResult['SUMMARY']['RESPONSIBLE'],
			GetMessage('TASKS_MANAGE_COLUMN_RESPONSIBLE')
		),
		'ORIGINATOR' => prepareSummaryCounter(
			$arResult['SUMMARY']['ORIGINATOR'],
			GetMessage('TASKS_MANAGE_COLUMN_ORIGINATOR')
		),
		'ACCOMPLICE' => prepareSummaryCounter(
			$arResult['SUMMARY']['ACCOMPLICE'],
			GetMessage('TASKS_MANAGE_COLUMN_ACCOMPLICE')
		),
		'AUDITOR' => prepareSummaryCounter(
			$arResult['SUMMARY']['AUDITOR'],
			GetMessage('TASKS_MANAGE_COLUMN_AUDITOR')
		),
	]
];

$arResult['ROWS'][] = $rowItem;
