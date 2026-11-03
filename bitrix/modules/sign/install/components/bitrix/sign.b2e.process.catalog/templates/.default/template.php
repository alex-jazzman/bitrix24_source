<?php

use Bitrix\Main\Context;
use Bitrix\Main\Localization\Loc;
use Bitrix\Main\Type\DateTime;
use Bitrix\Main\UI\Filter\Theme;
use Bitrix\Main\Web\Json;
use Bitrix\Sign\Item\Process\AvailableProcess;
use Bitrix\Sign\Item\Process\AvailableProcessCollection;
use Bitrix\Sign\Item\UserCollection;
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

\Bitrix\Main\UI\Extension::load(['sign.v2.grid.b2e.processes']);

$APPLICATION->SetTitle(Loc::getMessage('SIGN_B2E_PROCESS_CATALOG_TITLE'));

Toolbar::addFilter([
	'GRID_ID' => $arParams['GRID_ID'] ?? '',
	'FILTER_ID' => $arParams['FILTER_ID'] ?? '',
	'FILTER' => $arParams['FILTER_FIELDS'] ?? [],
	'FILTER_PRESETS' => [],
	'DISABLE_SEARCH' => false,
	'ENABLE_LIVE_SEARCH' => true,
	'ENABLE_LABEL' => true,
	'THEME' => Theme::MUTED,
]);

$createProcessUrl = (string)($arResult['CREATE_PROCESS_URL'] ?? '');
if (($arResult['CAN_CREATE_PROCESS'] ?? false) && $createProcessUrl !== '')
{
	Toolbar::addButton(
		(new CreateButton([]))
			->setTag(Tag::LINK)
			->setText((string)Loc::getMessage('SIGN_B2E_PROCESS_CATALOG_CREATE_PROCESS'))
			->setLink($createProcessUrl)
			// the constructor of the processes is a page of its own section, not a screen of this slider
			->addAttribute('target', '_top')
			->addDataAttribute('testid', 'sign-b2e-process-catalog-create'),
		ButtonLocation::AFTER_TITLE,
	);
}

$renderName = static function (AvailableProcess $process): string {
	$layout = '<div class="sign-b2e-process-catalog__name">'
		. htmlspecialcharsbx($process->name)
		. '</div>'
	;

	if ($process->description !== '')
	{
		$layout .= '<div class="sign-b2e-process-catalog__description">'
			. htmlspecialcharsbx($process->description)
			. '</div>'
		;
	}

	// the constants of the template are the setup of the tuner, not of the personnel officer: the row
	// says so and stays startable
	if (!$process->isConstantsTuned)
	{
		$layout .= '<div class="sign-b2e-process-catalog__warning">'
			. htmlspecialcharsbx((string)Loc::getMessage('SIGN_B2E_PROCESS_CATALOG_CONSTANTS_NOT_TUNED'))
			. '</div>'
		;
	}

	return $layout;
};

$renderAuthor = static function (AvailableProcess $process) use ($arResult): string {
	/** @var UserCollection $authors */
	$authors = $arResult['AUTHORS'];
	$author = $authors->getByIdMap($process->authorId);
	if ($author === null)
	{
		return '';
	}

	$fullName = trim(($author->name ?? '') . ' ' . ($author->lastName ?? ''));
	$name = $fullName === ''
		? (string)Loc::getMessage('SIGN_B2E_PROCESS_CATALOG_AUTHOR_UNNAMED', ['#ID#' => $process->authorId])
		: htmlspecialcharsbx($fullName)
	;

	return sprintf(
		'<a class="sign-personal-grid-user" target="_top" href="/company/personal/user/%d/">%s</a>',
		$process->authorId,
		$name,
	);
};

$renderModified = static function (AvailableProcess $process): string {
	if ($process->modifiedTs < 1)
	{
		return '';
	}

	$culture = Context::getCurrent()?->getCulture();
	$dateFormat = $culture?->getLongDateFormat() ?? 'j F Y';
	$timeFormat = $culture?->getLongTimeFormat() ?? 'H:i';
	$timestamp = DateTime::createFromTimestamp($process->modifiedTs)->toUserTime()->getTimestamp();

	// the title of a node nobody can focus reaches no screen reader, so the whole moment is carried by a text
	// of its own - hidden by a style of its own, this template having no css file to hold a class
	$offScreen = 'position:absolute;width:1px;height:1px;padding:0;margin:-1px;'
		. 'overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0'
	;
	$moment = htmlspecialcharsbx(FormatDate($dateFormat . ' ' . $timeFormat, $timestamp));

	return sprintf(
		'<div title="%s"><span aria-hidden="true">%s</span><span style="%s">%s</span></div>',
		$moment,
		htmlspecialcharsbx(FormatDate($dateFormat, $timestamp)),
		$offScreen,
		$moment,
	);
};

// the row carries the whole process: the public point of the launch slider takes the very same row the
// submenu passes to it, so both surfaces of the choice start the same thing (AC-002b)
$renderRunButton = static function (AvailableProcess $process): string {
	return (new Button([]))
		->setColor(Color::PRIMARY)
		->setSize(Size::EXTRA_SMALL)
		->setText((string)Loc::getMessage('SIGN_B2E_PROCESS_CATALOG_RUN'))
		->addAttribute('aria-label', (string)Loc::getMessage('SIGN_B2E_PROCESS_CATALOG_RUN_LABEL', [
			'#PROCESS#' => $process->name,
		]))
		->setDataRole('sign-b2e-process-run')
		->addDataAttribute('testid', 'sign-b2e-process-catalog-run-' . $process->id)
		->addDataAttribute('process', Json::encode($process->toArray()))
		->render()
	;
};

/** @var AvailableProcessCollection $processes */
$processes = $arResult['PROCESSES'];
$gridRows = [];
foreach ($processes as $process)
{
	$gridRows[] = [
		'id' => $process->id,
		'columns' => [
			'NAME' => $renderName($process),
			'AUTHOR' => $renderAuthor($process),
			'MODIFIED' => $renderModified($process),
			'ACTION' => $renderRunButton($process),
		],
	];
}

$gridParams = [
	'GRID_ID' => $arParams['GRID_ID'] ?? '',
	'COLUMNS' => $arParams['COLUMNS'] ?? [],
	'ROWS' => $gridRows,
	'SHOW_ROW_CHECKBOXES' => false,
	'SHOW_TOTAL_COUNTER' => true,
	'TOTAL_ROWS_COUNT' => $arResult['TOTAL_COUNT'] ?? 0,
	'SHOW_ACTION_PANEL' => false,
	'ACTION_PANEL' => [],
	'SHOW_PAGINATION' => false,
	'SHOW_PAGESIZE' => false,
	'SHOW_SELECTED_COUNTER' => false,
	'SHOW_GRID_SETTINGS_MENU' => false,
	'SHOW_ROW_ACTIONS_MENU' => false,
	'ALLOW_SORT' => false,
	'ALLOW_COLUMNS_SORT' => false,
	'ALLOW_COLUMNS_RESIZE' => true,
	'AJAX_MODE' => 'Y',
	'AJAX_ID' => \CAjax::getComponentID('bitrix:sign.b2e.process.catalog', '.default', ''),
	'AJAX_OPTION_HISTORY' => 'N',
	'AJAX_OPTION_JUMP' => 'N',
];

// the same explanation the submenu gives: a portal without marked processes is the ordinary state at the
// start, not a failure (ERR-002)
if ($gridRows === [])
{
	$gridParams['STUB'] = [
		'title' => (string)Loc::getMessage('SIGN_B2E_PROCESS_CATALOG_EMPTY'),
	];
}

$APPLICATION->IncludeComponent('bitrix:main.ui.grid', '', $gridParams);
?>

<script>
	BX.ready(function() {
		BX.Sign.V2.Grid.B2e.ProcessCatalog.bind();
	});
</script>
