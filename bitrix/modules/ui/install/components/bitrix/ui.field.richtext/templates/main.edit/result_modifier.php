<?php

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

use Bitrix\Main\Event;
use Bitrix\Main\EventResult;
use Bitrix\Main\Text\HtmlFilter;
use Bitrix\Main\UI\Extension;
use Bitrix\UI\Format\BBCode\Whitelist;

/** @var array $arResult */

Extension::load('ui.userfield.rich-text');
CJSCore::init(['uf']);

$copilot = null;
$event = new Event('ui', 'onRichTextUserFieldGetCopilotOptions', [
	'userField' => $arResult['userField'] ?? [],
]);
$event->send();
foreach ($event->getResults() as $eventResult)
{
	if ($eventResult->getType() !== EventResult::SUCCESS)
	{
		continue;
	}

	$parameters = $eventResult->getParameters();
	if (isset($parameters['copilot']) && is_array($parameters['copilot']))
	{
		$copilot = $parameters['copilot'];
		break;
	}
}

$toolbar = Whitelist::getToolbarTools();
if ($copilot !== null)
{
	$toolbar[] = 'copilot';
}

$placeholder = $arResult['userField']['EDIT_FORM_LABEL'] ?? '';
if (is_array($placeholder))
{
	$placeholder = (string)(reset($placeholder) ?: '');
}

$arResult['editorConfig'] = [
	'toolbar' => $toolbar,
	'copilot' => $copilot,
	'placeholder' => (string)$placeholder,
	'inputName' => $arResult['fieldName'],
];

$arResult['editorValues'] = [];
foreach ($arResult['value'] as $key => $value)
{
	$arResult['editorValues'][$key] = HtmlFilter::encode((string)($value ?? ''));
}
