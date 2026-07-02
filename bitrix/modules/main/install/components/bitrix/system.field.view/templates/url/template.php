<?php
if(!defined("B_PROLOG_INCLUDED") || B_PROLOG_INCLUDED !== true)
{
	die();
}

/**
 * @var array $arParams
 */

echo \CUserTypeUrl::GetPublicView($arParams['arUserField']);