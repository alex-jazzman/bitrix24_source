<?php
if(!defined("B_PROLOG_INCLUDED") || B_PROLOG_INCLUDED!==true)die();

/**
 * @var array $arResult
 * @var array $arParams
 */

$first = true;
foreach ($arResult["VALUE"] as $key => $res):
	if (!$first):
		?><span class="fields separator"></span><?php
	else:
		$first = false;
	endif;

	if ($arParams['arUserField']['PROPERTY_VALUE_LINK'] <> '')
		$res = '<a href="'.str_replace('#VALUE#', $arResult["~VALUE"][$key], $arParams['arUserField']['PROPERTY_VALUE_LINK']).'">'.$res.'</a>';
?><span class="fields enumeration"><?=$res?></span><?php
endforeach;
