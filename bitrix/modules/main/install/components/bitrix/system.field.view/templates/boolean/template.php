<?php
if(!defined("B_PROLOG_INCLUDED") || B_PROLOG_INCLUDED!==true)die();

/**
 * @var array $arResult
 */

$first = true;
foreach ($arResult["VALUE"] as $res):
	if (!$first):
		?><span class="fields separator"></span><?php
	else:
		$first = false;	
	endif;

?><span class="fields boolean"><?=($res? GetMessage("MAIN_YES"):GetMessage("MAIN_NO"))?></span><?php
endforeach;?>
