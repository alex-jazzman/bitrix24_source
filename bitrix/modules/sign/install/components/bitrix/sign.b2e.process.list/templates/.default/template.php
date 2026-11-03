<?php

use Bitrix\Main\Context;
use Bitrix\Main\Localization\Loc;
use Bitrix\Main\Type\DateTime;
use Bitrix\Main\UI\Filter\Theme;
use Bitrix\Sign\Item\Process\LaunchGroup;
use Bitrix\Sign\Item\Process\ProcessDocument;
use Bitrix\Sign\Item\Process\ProcessParticipant;
use Bitrix\Sign\Item\Process\RunningProcess;
use Bitrix\Sign\Item\UserCollection;
use Bitrix\Sign\Type\Process\DocumentsState;
use Bitrix\Sign\Type\Process\RunningProcessStatus;
use Bitrix\UI\Buttons\Button;
use Bitrix\UI\Buttons\Color;
use Bitrix\UI\Buttons\CreateButton;
use Bitrix\UI\Buttons\Size;
use Bitrix\UI\Buttons\Tag;
use Bitrix\UI\Toolbar\ButtonLocation;
use Bitrix\UI\Toolbar\Facade\Toolbar;

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

/** @var array $arParams */
/** @var array $arResult */
/** @var CMain $APPLICATION */

// the illustration of the empty states is drawn by its css class alone, so the page needs the library and
// not a script of it
\Bitrix\Main\UI\Extension::load(['sign.v2.grid.b2e.process-list', 'ui.system.illustration']);

$APPLICATION->SetTitle(Loc::getMessage('SIGN_B2E_PROCESS_LIST_TITLE'));

Toolbar::addFilter([
	'GRID_ID' => $arParams['GRID_ID'] ?? '',
	'FILTER_ID' => $arParams['FILTER_ID'] ?? '',
	'FILTER' => $arParams['FILTER_FIELDS'] ?? [],
	'FILTER_PRESETS' => $arParams['FILTER_PRESETS'] ?? [],
	'DISABLE_SEARCH' => false,
	'ENABLE_LIVE_SEARCH' => true,
	'ENABLE_LABEL' => true,
	'THEME' => Theme::MUTED,
]);

// the button stands on the right to create processes and on nothing else: an empty list is not a reason to
// take it away, and a full one is not a reason to give it (AC-013)
$createProcessUrl = (string)($arResult['CREATE_PROCESS_URL'] ?? '');
if (($arResult['CAN_CREATE_PROCESS'] ?? false) && $createProcessUrl !== '')
{
	Toolbar::addButton(
		(new CreateButton([]))
			->setTag(Tag::LINK)
			->setText((string)Loc::getMessage('SIGN_B2E_PROCESS_LIST_CREATE_PROCESS'))
			->setLink($createProcessUrl)
			// the constructor of the processes is a page of its own section, not a screen of this one
			->addAttribute('target', '_top')
			->addDataAttribute('testid', 'sign-b2e-process-list-create'),
		ButtonLocation::AFTER_TITLE,
	);
}

/** @var UserCollection $users */
$users = $arResult['USERS'];
$processUrls = $arResult['PROCESS_URLS'] ?? [];

$formatDateTime = static function (?int $timestamp): string {
	if ($timestamp === null || $timestamp < 1)
	{
		return '';
	}

	$culture = Context::getCurrent()?->getCulture();
	$dateFormat = $culture?->getLongDateFormat() ?? 'j F Y';
	$timeFormat = $culture?->getLongTimeFormat() ?? 'H:i';
	$userTimestamp = DateTime::createFromTimestamp($timestamp)->toUserTime()->getTimestamp();

	return htmlspecialcharsbx(FormatDate($dateFormat . ' ' . $timeFormat, $userTimestamp));
};

/**
 * How long the step has been held. The difference is counted against the clock of the server, so the moment
 * goes into it as it came - a moment shifted into the time of the user would add the offset to the answer.
 */
$formatDuration = static function (?int $timestamp): string {
	if ($timestamp === null || $timestamp < 1)
	{
		return '';
	}

	return htmlspecialcharsbx((string)FormatDate([
		's' => 'sdiff',
		'i' => 'idiff',
		'H' => 'Hdiff',
		'd' => 'ddiff',
		'm' => 'mdiff',
		'' => 'Ydiff',
	], $timestamp));
};

$getStatusLabel = static fn(RunningProcessStatus $status): string => match ($status)
{
	RunningProcessStatus::Launching => (string)Loc::getMessage('SIGN_B2E_PROCESS_LIST_STATE_LAUNCHING'),
	RunningProcessStatus::InWork => (string)Loc::getMessage('SIGN_B2E_PROCESS_LIST_STATE_IN_WORK'),
	RunningProcessStatus::Completed => (string)Loc::getMessage('SIGN_B2E_PROCESS_LIST_STATE_COMPLETED'),
	RunningProcessStatus::Error => (string)Loc::getMessage('SIGN_B2E_PROCESS_LIST_STATE_ERROR'),
};

$getUserName = static function (int $userId) use ($users): string {
	$user = $users->getByIdMap($userId);

	return $user === null ? '' : trim(($user->name ?? '') . ' ' . ($user->lastName ?? ''));
};

$renderAvatar = static function (int $userId, string $fullName) use ($users): string {
	$user = $users->getByIdMap($userId);
	$photoPath = ($user?->personalPhotoId ?? 0) > 0 ? (string)CFile::GetPath($user->personalPhotoId) : '';
	if ($photoPath !== '')
	{
		return sprintf(
			'<img class="sign-b2e-process-list__avatar" src="%s" alt="">',
			htmlspecialcharsbx($photoPath),
		);
	}

	return sprintf(
		'<span class="sign-b2e-process-list__avatar --empty" aria-hidden="true">%s</span>',
		htmlspecialcharsbx(mb_strtoupper(mb_substr(trim($fullName), 0, 1))),
	);
};

// the chain of the people the process is waiting for, each with the time their step has been held
$renderParticipants = static function (RunningProcess $process) use (
	$getUserName,
	$renderAvatar,
	$formatDuration,
): string {
	$items = '';
	foreach ($process->participants as $participant)
	{
		/** @var ProcessParticipant $participant */
		$fullName = $getUserName($participant->userId);
		$duration = $formatDuration($participant->holdingSinceTs);

		// the letter of the avatar and the duration are all the link says by itself, and neither names a person
		$name = $fullName === ''
			? (string)Loc::getMessage('SIGN_B2E_PROCESS_LIST_USER_UNNAMED', ['#ID#' => $participant->userId])
			: htmlspecialcharsbx($fullName)
		;
		$accessibleName = $duration === ''
			? $name
			: (string)Loc::getMessage('SIGN_B2E_PROCESS_LIST_PARTICIPANT_LABEL', [
				'#NAME#' => $name,
				'#DURATION#' => $duration,
			])
		;

		$items .= sprintf(
			'<a class="sign-b2e-process-list__participant" target="_top" aria-label="%s"'
			. ' href="/company/personal/user/%d/">'
			. '%s<span class="sign-b2e-process-list__holding">%s</span></a>',
			$accessibleName,
			$participant->userId,
			$renderAvatar($participant->userId, $fullName),
			$duration,
		);
	}

	return $items === '' ? '' : '<div class="sign-b2e-process-list__participants">' . $items . '</div>';
};

/**
 * The name of a launch group, worded as section 8 of the brief words it. The number of employees is counted
 * by the access of the person looking, so the row of the group says what they may see and no more (AC-015b).
 */
$renderGroupName = static function (LaunchGroup $group): string {
	return sprintf(
		'<span class="sign-b2e-process-list__title" data-testid="sign-b2e-process-list-group">%s</span>',
		(string)Loc::getMessage('SIGN_B2E_PROCESS_LIST_GROUP_NAME', [
			'#PROCESS#' => htmlspecialcharsbx($group->processName),
			'#COUNT#' => $group->memberCount,
		]),
	);
};

/**
 * The name of a row of a process. The type of the process is written under the name only where the row
 * stands on its own: inside an opened group the row above already names it.
 */
$renderProcessName = static function (RunningProcess $process, ?string $processName) use (
	$getUserName,
	$processUrls,
): string {
	$title = $process->title !== '' ? $process->title : $getUserName($process->employeeId);
	if ($title === '')
	{
		$title = (string)Loc::getMessage('SIGN_B2E_PROCESS_LIST_USER_UNNAMED', ['#ID#' => $process->employeeId]);
	}

	$url = $processUrls[$process->entityId ?? 0] ?? null;
	$layout = $url === null
		? sprintf(
			'<span class="sign-b2e-process-list__title" data-testid="sign-b2e-process-list-row">%s</span>',
			htmlspecialcharsbx($title),
		)
		: sprintf(
			'<a class="sign-b2e-process-list__title" target="_top" href="%s"'
			. ' data-testid="sign-b2e-process-list-row">%s</a>',
			htmlspecialcharsbx($url),
			htmlspecialcharsbx($title),
		)
	;

	if ($processName !== null && $processName !== '')
	{
		$layout .= sprintf(
			'<span class="sign-b2e-process-list__subtitle">%s</span>',
			htmlspecialcharsbx($processName),
		);
	}

	return $layout;
};

/**
 * An address the page may lead the officer to. Everything the section links to lives on the portal, and an
 * address beginning with two slashes is a protocol-relative one - it would take them off it.
 */
$isInternalUrl = static fn(string $url): bool => str_starts_with($url, '/') && !str_starts_with($url, '//');

/**
 * One document of the cell. A document the person may not see arrives without a name and without an address:
 * that the process reached signing belongs to the process, the contents of the document do not (section 8 of
 * the brief).
 */
$renderDocument = static function (ProcessDocument $document) use ($isInternalUrl): string {
	$url = (string)($document->url ?? '');
	if ($document->title === '' || !$isInternalUrl($url))
	{
		return sprintf(
			'<span class="sign-b2e-process-list__document" data-testid="sign-b2e-process-list-document">%s</span>',
			htmlspecialcharsbx((string)Loc::getMessage('SIGN_B2E_PROCESS_LIST_DOCUMENT_CREATED')),
		);
	}

	$status = $document->statusName === ''
		? ''
		: sprintf(
			'<span class="sign-b2e-process-list__document-status">%s</span>',
			htmlspecialcharsbx($document->statusName),
		)
	;

	// the dot the css draws between the name and the status reaches no name of a link: without one written out
	// the two run into a single word
	$accessibleName = $document->statusName === ''
		? ''
		: sprintf(
			' aria-label="%s"',
			(string)Loc::getMessage('SIGN_B2E_PROCESS_LIST_DOCUMENT_LABEL', [
				'#DOCUMENT#' => htmlspecialcharsbx($document->title),
				'#STATUS#' => htmlspecialcharsbx($document->statusName),
			]),
		)
	;

	return sprintf(
		'<a class="sign-b2e-process-list__document" target="_top" href="%s"%s'
		. ' data-testid="sign-b2e-process-list-document">%s%s</a>',
		htmlspecialcharsbx($url),
		$accessibleName,
		htmlspecialcharsbx($document->title),
		$status,
	);
};

/**
 * Cell "Documents" of a row of a process. The state is the answer of the server and never a guess of the
 * page: an empty list of documents means "not yet" while the process runs and "never" once it is over.
 */
$renderDocuments = static function (RunningProcess $process) use ($renderDocument): string {
	if ($process->documentsState === DocumentsState::None)
	{
		return '<span class="sign-b2e-process-list__documents-none"'
			. ' data-testid="sign-b2e-process-list-document-pending">'
			. '<span aria-hidden="true">&mdash;</span>'
			. '<span class="sign-b2e-process-list__visually-hidden">'
			. htmlspecialcharsbx((string)Loc::getMessage('SIGN_B2E_PROCESS_LIST_DOCUMENTS_NONE'))
			. '</span></span>'
		;
	}

	if ($process->documentsState === DocumentsState::Created)
	{
		// every document the process created and never only the first one (AC-012)
		return '<div class="sign-b2e-process-list__documents">'
			. implode('', array_map($renderDocument, $process->documents))
			. '</div>'
		;
	}

	// the cell stays neutral: a document may be missing for reasons that read nothing alike, so the one the
	// engine did record is told by the hint and only where there is one (AC-019). The carrier of the hint takes
	// a stop of its own - the hint of a node outside the tab order never opens under :focus-visible
	$reason = (string)($process->noDocumentReason ?? '');
	$hint = $reason === ''
		? ''
		: sprintf(
			' tabindex="0" data-ui-tooltip="%s" data-ui-tooltip-trigger="hover,focus"',
			htmlspecialcharsbx($reason),
		)
	;

	return sprintf(
		'<span class="sign-b2e-process-list__documents-missing"'
		. ' data-testid="sign-b2e-process-list-document-missing"%s>%s</span>',
		$hint,
		htmlspecialcharsbx((string)Loc::getMessage('SIGN_B2E_PROCESS_LIST_DOCUMENT_NOT_CREATED')),
	);
};

$renderState = static function (RunningProcessStatus $status) use ($getStatusLabel): string {
	return sprintf(
		'<span class="sign-b2e-process-list__state --%s">%s</span>',
		htmlspecialcharsbx($status->value),
		htmlspecialcharsbx($getStatusLabel($status)),
	);
};

/**
 * The state of a row and what it lets the officer do about it: the protocol of a process that has one
 * (ERR-006) and the retry of a launch the backend itself marked as retriable (AC-015c). The retry is offered
 * by `canRetry` alone - it answers both "this row failed" and "this person started it", and neither is
 * derivable from the state of the row.
 */
$renderProcessTime = static function (RunningProcess $process) use ($renderState): string {
	$layout = $renderState($process->status);

	$protocolUrl = (string)($process->protocolUrl ?? '');
	if ($protocolUrl !== '')
	{
		$layout .= sprintf(
			'<a class="sign-b2e-process-list__action" href="%s" data-role="sign-b2e-process-protocol"'
			. ' data-testid="sign-b2e-process-list-protocol">%s</a>',
			htmlspecialcharsbx($protocolUrl),
			htmlspecialcharsbx((string)Loc::getMessage('SIGN_B2E_PROCESS_LIST_PROTOCOL')),
		);
	}

	if ($process->canRetry)
	{
		$layout .= (new Button([]))
			->setColor(Color::LINK)
			->setSize(Size::EXTRA_SMALL)
			->setText((string)Loc::getMessage('SIGN_B2E_PROCESS_LIST_RETRY'))
			->setDataRole('sign-b2e-process-retry')
			->addDataAttribute('launch-id', $process->launchId)
			->addDataAttribute('item-id', $process->launchItemId)
			->addDataAttribute('testid', 'sign-b2e-process-list-retry')
			->render()
		;
	}

	return $layout;
};

$groupRowPrefix = (string)($arResult['GROUP_ROW_PREFIX'] ?? 'group-');
$processRowPrefix = (string)($arResult['PROCESS_ROW_PREFIX'] ?? 'process-');
$parentRowId = $arResult['PARENT_ROW_ID'] ?? 0;

$buildProcessRow = static function (RunningProcess $process, string|int $parentId, ?string $processName) use (
	$processRowPrefix,
	$renderProcessName,
	$formatDateTime,
	$renderParticipants,
	$renderDocuments,
	$renderProcessTime,
): array {
	return [
		'id' => $processRowPrefix . $process->launchItemId,
		'parent_id' => $parentId,
		'has_child' => false,
		'columns' => [
			'NAME' => $renderProcessName($process, $processName),
			'ACTIVITY' => $formatDateTime($process->lastActivityTs),
			'PARTICIPANTS' => $renderParticipants($process),
			'STATUS' => sprintf(
				'<span class="sign-b2e-process-list__stage">%s</span>',
				htmlspecialcharsbx($process->stageName),
			),
			'DOCUMENTS' => $renderDocuments($process),
			'TIME' => $renderProcessTime($process),
		],
	];
};

$gridRows = [];
foreach ($arResult['GROUPS'] ?? [] as $group)
{
	/** @var LaunchGroup $group */
	// a launch on one employee is an ordinary row of a process and does not open (AC-015a)
	if ($group->process !== null)
	{
		$gridRows[] = $buildProcessRow($group->process, 0, $group->processName);

		continue;
	}

	$gridRows[] = [
		'id' => $groupRowPrefix . $group->launchId,
		'parent_id' => 0,
		'has_child' => true,
		'columns' => [
			'NAME' => $renderGroupName($group),
			'ACTIVITY' => $formatDateTime($group->startedTs),
			'PARTICIPANTS' => '',
			'STATUS' => '',
			'DOCUMENTS' => '',
			'TIME' => $renderState($group->status),
		],
	];
}

foreach ($arResult['PROCESSES'] ?? [] as $process)
{
	/** @var RunningProcess $process */
	$gridRows[] = $buildProcessRow($process, $parentRowId, null);
}

// a group is opened in one answer, so a launch larger than that answer says so instead of losing its tail
if ($arResult['HAS_TRIMMED_CONTENT'] ?? false)
{
	$gridRows[] = [
		'id' => $processRowPrefix . 'trimmed-' . $parentRowId,
		'parent_id' => $parentRowId,
		'has_child' => false,
		'columns' => [
			'NAME' => sprintf(
				'<span class="sign-b2e-process-list__note">%s</span>',
				htmlspecialcharsbx((string)Loc::getMessage(
					'SIGN_B2E_PROCESS_LIST_CONTENT_TRIMMED',
					['#COUNT#' => (int)($arResult['GROUP_CONTENT_LIMIT'] ?? 0)],
				)),
			),
			'ACTIVITY' => '',
			'PARTICIPANTS' => '',
			'STATUS' => '',
			'DOCUMENTS' => '',
			'TIME' => '',
		],
	];
}

/**
 * Empty state of the tab. All of it goes into the description of the stub: the grid draws its own title
 * above whatever the description carries, and the illustration belongs on top of the block.
 */
$renderStub = static function (string $illustration, string $title, string $text, string $actions): array {
	$layout = sprintf(
		'<div class="sign-b2e-process-list__stub" data-testid="sign-b2e-process-list-stub">'
		. '<div class="ui-illustration --%s" style="--ui-illustration-size: 128px" aria-hidden="true"></div>'
		. '<div class="sign-b2e-process-list__stub-title" role="heading" aria-level="2">%s</div>'
		. '<div class="sign-b2e-process-list__stub-text">%s</div>',
		htmlspecialcharsbx($illustration),
		htmlspecialcharsbx($title),
		htmlspecialcharsbx($text),
	);

	if ($actions !== '')
	{
		$layout .= '<div class="sign-b2e-process-list__stub-actions">' . $actions . '</div>';
	}

	return ['description' => $layout . '</div>'];
};

$renderEmptyStub = static function () use ($renderStub, $arResult, $createProcessUrl): array {
	$actions = '';

	$catalogUrl = (string)($arResult['PROCESS_CATALOG_URL'] ?? '');
	if ($catalogUrl !== '')
	{
		// the catalog opens as a slider over the tab, and the address stays on the button so a page that
		// failed to load the extension still leads the officer there
		$actions .= (new Button([]))
			->setTag(Tag::LINK)
			->setColor(Color::PRIMARY)
			->setSize(Size::LARGE)
			->setText((string)Loc::getMessage('SIGN_B2E_PROCESS_LIST_RUN_PROCESS'))
			->setLink($catalogUrl)
			->setDataRole('sign-b2e-process-catalog')
			->addDataAttribute('testid', 'sign-b2e-process-list-stub-run')
			->render()
		;
	}

	// without the right to create processes the empty tab keeps its explanation and offers nothing (ERR-002)
	if (($arResult['CAN_CREATE_PROCESS'] ?? false) && $createProcessUrl !== '')
	{
		$actions .= (new Button([]))
			->setTag(Tag::LINK)
			->setColor(Color::LIGHT_BORDER)
			->setSize(Size::LARGE)
			->setText((string)Loc::getMessage('SIGN_B2E_PROCESS_LIST_CREATE_PROCESS'))
			->setLink($createProcessUrl)
			->addAttribute('target', '_top')
			->addDataAttribute('testid', 'sign-b2e-process-list-stub-create')
			->render()
		;
	}

	return $renderStub(
		'timeline',
		(string)Loc::getMessage('SIGN_B2E_PROCESS_LIST_EMPTY_TITLE'),
		(string)Loc::getMessage('SIGN_B2E_PROCESS_LIST_EMPTY_TEXT'),
		$actions,
	);
};

$gridParams = [
	'GRID_ID' => $arParams['GRID_ID'] ?? '',
	'COLUMNS' => $arParams['COLUMNS'] ?? [],
	'ROWS' => $gridRows,
	'ENABLE_COLLAPSIBLE_ROWS' => true,
	'SHOW_ROW_CHECKBOXES' => false,
	'SHOW_SELECTED_COUNTER' => false,
	'SHOW_TOTAL_COUNTER' => false,
	// group actions over processes are out of the first version (section 9 of the brief)
	'SHOW_ACTION_PANEL' => false,
	'ACTION_PANEL' => [],
	'SHOW_ROW_ACTIONS_MENU' => false,
	'SHOW_GRID_SETTINGS_MENU' => false,
	'SHOW_PAGINATION' => false,
	'SHOW_PAGESIZE' => false,
	'ALLOW_SORT' => false,
	'ALLOW_COLUMNS_SORT' => false,
	'ALLOW_COLUMNS_RESIZE' => true,
	// the list is counted per row by the access of the person, so it knows of a next page but not of a
	// total: the grid asks for the next one by the button and never by a number of pages
	'NAV_PARAM_NAME' => $arParams['NAV_PARAM_NAME'] ?? '',
	'CURRENT_PAGE' => $arResult['CURRENT_PAGE'] ?? 1,
	'ENABLE_NEXT_PAGE' => $arResult['HAS_NEXT_PAGE'] ?? false,
	'AJAX_MODE' => 'Y',
	'AJAX_ID' => \CAjax::getComponentID('bitrix:sign.b2e.process.list', '.default', ''),
	'AJAX_OPTION_HISTORY' => 'N',
	'AJAX_OPTION_JUMP' => 'N',
];

// the tab has two empty states and they say different things. Without the smart process of the personnel
// processes there is nothing to list and nothing to start, so the tab explains that instead of offering
// actions that would refuse (ERR-009); everything else is the ordinary empty tab of section 8 of the brief.
if ($gridRows === [])
{
	$gridParams['STUB'] = ($arResult['IS_ENTITY_AVAILABLE'] ?? false)
		? $renderEmptyStub()
		: $renderStub(
			'warning-generic',
			(string)Loc::getMessage('SIGN_B2E_PROCESS_LIST_UNAVAILABLE_TITLE'),
			(string)Loc::getMessage('SIGN_B2E_PROCESS_LIST_UNAVAILABLE_TEXT'),
			'',
		)
	;
}

$APPLICATION->IncludeComponent('bitrix:main.ui.grid', '', $gridParams);
?>

<script>
	BX.ready(function() {
		BX.Sign.V2.Grid.B2e.ProcessList.bind('<?= CUtil::JSEscape($arParams['GRID_ID'] ?? '') ?>');
	});
</script>
