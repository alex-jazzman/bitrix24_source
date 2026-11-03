<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

if (\Bitrix\Main\Loader::includeModule('ui'))
{
	\Bitrix\Main\UI\Extension::load(['ui.a11y', 'ui.design-tokens.air']);
}
