<?php

use Bitrix\Main\Localization\Loc;
use Bitrix\UI\Buttons;
use Bitrix\UI\Toolbar\ButtonLocation;
use Bitrix\UI\Toolbar\Facade\Toolbar;

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

/** @var array $arResult */

if (($arResult['relationType'] ?? 'subTasks') === 'gantt')
{
	\Bitrix\Main\UI\Extension::load('tasks.v2.application.gantt-popup');
}

$button = (new Buttons\Button())
	->setText(Loc::getMessage('TASKS_BTN_ADD_RELATION'))
	->setIcon(Buttons\Icon::ADD_M)
	->setStyle(Buttons\AirButtonStyle::FILLED)
	->setDisabled(!($arResult['canEditRelation'] ?? false))
	->addAttribute('id', 'tasks-buttonRelationAdd')
;
$button->setAirDesign();

Toolbar::addButton($button, ButtonLocation::AFTER_TITLE);
