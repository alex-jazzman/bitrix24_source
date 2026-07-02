<?php
if(!defined("B_PROLOG_INCLUDED") || B_PROLOG_INCLUDED!==true)die();
/**
 * @var array $arResult
 * @var array $arParams
 */

$first = true;
foreach ($arResult["VALUE"] as $res):
	if (!$first):
		?><span class="fields separator"></span><?php
	else:
		$first = false;	
	endif;

	if ($arParams['arUserField']['PROPERTY_VALUE_LINK'] <> '')
		$res = '<a href="'.str_replace('#VALUE#', urlencode($res), $arParams['arUserField']['PROPERTY_VALUE_LINK']).'">'.$res.'</a>';
?><span class="fields integer"><?=$res?></span><?php
endforeach;
