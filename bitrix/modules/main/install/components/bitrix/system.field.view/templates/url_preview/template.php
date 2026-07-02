<?php
if(!defined("B_PROLOG_INCLUDED") || B_PROLOG_INCLUDED!==true)die();

/**
 * @var array $arResult
 * @var array $arParams
 */

echo \Bitrix\Main\UrlPreview\UrlPreview::showView($arResult, $arParams, $cacheTag);