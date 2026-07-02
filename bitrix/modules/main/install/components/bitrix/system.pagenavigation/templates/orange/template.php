<?php
if(!defined("B_PROLOG_INCLUDED") || B_PROLOG_INCLUDED!==true)die();

/**
 * @var array $arResult
 */

$this->setFrameMode(true);

if(!$arResult["NavShowAlways"])
{
	if ($arResult["NavRecordCount"] == 0 || ($arResult["NavPageCount"] == 1 && $arResult["NavShowAll"] == false))
		return;
}

$strNavQueryString = ($arResult["NavQueryString"] != "" ? $arResult["NavQueryString"]."&amp;" : "");
$strNavQueryStringFull = ($arResult["NavQueryString"] != "" ? "?".$arResult["NavQueryString"] : "");
?>

<div class="system-nav-orange">

<?php if($arResult["bDescPageNumbering"] === true):?>

	<div class="nav-title"><?=$arResult["NavTitle"]?> <?=$arResult["NavFirstRecordShow"]?> - <?=$arResult["NavLastRecordShow"]?> <?=GetMessage("nav_of")?> <?=$arResult["NavRecordCount"]?></div>

	<div class="nav-pages">

	<?php if ($arResult["NavPageNomer"] < $arResult["NavPageCount"]):?>
		<?php if($arResult["bSavePage"]):?>
			<a href="<?=$arResult["sUrlPath"]?>?<?=$strNavQueryString?>PAGEN_<?=$arResult["NavNum"]?>=<?=$arResult["NavPageCount"]?>"><?=GetMessage("nav_begin")?></a>&nbsp;|&nbsp;
			<a href="<?=$arResult["sUrlPath"]?>?<?=$strNavQueryString?>PAGEN_<?=$arResult["NavNum"]?>=<?=($arResult["NavPageNomer"]+1)?>">&laquo;</a>&nbsp;|&nbsp;
		<?php else:?>
			<a href="<?=$arResult["sUrlPath"]?><?=$strNavQueryStringFull?>"><?=GetMessage("nav_begin")?></a>&nbsp;|&nbsp;
			<?php if ($arResult["NavPageCount"] == ($arResult["NavPageNomer"]+1) ):?>
				<a href="<?=$arResult["sUrlPath"]?><?=$strNavQueryStringFull?>">&laquo;</a>&nbsp;|&nbsp;
			<?php else:?>
				<a href="<?=$arResult["sUrlPath"]?>?<?=$strNavQueryString?>PAGEN_<?=$arResult["NavNum"]?>=<?=($arResult["NavPageNomer"]+1)?>">&laquo;</a>&nbsp;|&nbsp;
			<?php endif?>
		<?php endif?>
	<?php endif?>

	<?php while($arResult["nStartPage"] >= $arResult["nEndPage"]):?>
		<?php $NavRecordGroupPrint = $arResult["NavPageCount"] - $arResult["nStartPage"] + 1;?>

		<?php if ($arResult["nStartPage"] == $arResult["NavPageNomer"]):?>
			<span class="nav-current-page">&nbsp;<?=$NavRecordGroupPrint?>&nbsp;</span>&nbsp;
		<?php elseif($arResult["nStartPage"] == $arResult["NavPageCount"] && $arResult["bSavePage"] == false):?>
			<a href="<?=$arResult["sUrlPath"]?><?=$strNavQueryStringFull?>"><?=$NavRecordGroupPrint?></a>&nbsp;
		<?php else:?>
			<a href="<?=$arResult["sUrlPath"]?>?<?=$strNavQueryString?>PAGEN_<?=$arResult["NavNum"]?>=<?=$arResult["nStartPage"]?>"><?=$NavRecordGroupPrint?></a>&nbsp;
		<?php endif?>

		<?php $arResult["nStartPage"]--?>
	<?php endwhile?>

	<?php if ($arResult["NavPageNomer"] > 1):?>
		|&nbsp;<a href="<?=$arResult["sUrlPath"]?>?<?=$strNavQueryString?>PAGEN_<?=$arResult["NavNum"]?>=<?=($arResult["NavPageNomer"]-1)?>">&raquo;</a>&nbsp;|&nbsp;
		<a href="<?=$arResult["sUrlPath"]?>?<?=$strNavQueryString?>PAGEN_<?=$arResult["NavNum"]?>=1"><?=GetMessage("nav_end")?></a>&nbsp;
	<?php endif?>

<?php else:?>

	<div class="nav-title"><?=$arResult["NavTitle"]?> <?=$arResult["NavFirstRecordShow"]?> - <?=$arResult["NavLastRecordShow"]?> <?=GetMessage("nav_of")?> <?=$arResult["NavRecordCount"]?></div>

	<div class="nav-pages">

	<?php if ($arResult["NavPageNomer"] > 1):?>

		<?php if($arResult["bSavePage"]):?>
			<a href="<?=$arResult["sUrlPath"]?>?<?=$strNavQueryString?>PAGEN_<?=$arResult["NavNum"]?>=1"><?=GetMessage("nav_begin")?></a>&nbsp;|&nbsp;
			<a href="<?=$arResult["sUrlPath"]?>?<?=$strNavQueryString?>PAGEN_<?=$arResult["NavNum"]?>=<?=($arResult["NavPageNomer"]-1)?>">&laquo;</a>
			&nbsp;|&nbsp;
		<?php else:?>
			<a href="<?=$arResult["sUrlPath"]?><?=$strNavQueryStringFull?>"><?=GetMessage("nav_begin")?></a>&nbsp;|&nbsp;
			<?php if ($arResult["NavPageNomer"] > 2):?>
				<a href="<?=$arResult["sUrlPath"]?>?<?=$strNavQueryString?>PAGEN_<?=$arResult["NavNum"]?>=<?=($arResult["NavPageNomer"]-1)?>">&laquo;</a>
			<?php else:?>
				<a href="<?=$arResult["sUrlPath"]?><?=$strNavQueryStringFull?>">&laquo;</a>
			<?php endif?>
			&nbsp;|&nbsp;
		<?php endif?>
	<?php endif?>

	<?php while($arResult["nStartPage"] <= $arResult["nEndPage"]):?>

		<?php if ($arResult["nStartPage"] == $arResult["NavPageNomer"]):?>
			<span class="nav-current-page">&nbsp;<?=$arResult["nStartPage"]?>&nbsp;</span>&nbsp;
		<?php elseif($arResult["nStartPage"] == 1 && $arResult["bSavePage"] == false):?>
			<a href="<?=$arResult["sUrlPath"]?><?=$strNavQueryStringFull?>"><?=$arResult["nStartPage"]?></a>&nbsp;
		<?php else:?>
			<a href="<?=$arResult["sUrlPath"]?>?<?=$strNavQueryString?>PAGEN_<?=$arResult["NavNum"]?>=<?=$arResult["nStartPage"]?>"><?=$arResult["nStartPage"]?></a>&nbsp;
		<?php endif?>
		<?php $arResult["nStartPage"]++?>
	<?php endwhile?>


	<?php if($arResult["NavPageNomer"] < $arResult["NavPageCount"]):?>
		|&nbsp;<a href="<?=$arResult["sUrlPath"]?>?<?=$strNavQueryString?>PAGEN_<?=$arResult["NavNum"]?>=<?=($arResult["NavPageNomer"]+1)?>">&raquo;</a>&nbsp;|&nbsp;
		<a href="<?=$arResult["sUrlPath"]?>?<?=$strNavQueryString?>PAGEN_<?=$arResult["NavNum"]?>=<?=$arResult["NavPageCount"]?>"><?=GetMessage("nav_end")?></a>&nbsp;
	<?php endif?>

<?php endif?>


<?php if ($arResult["bShowAll"]):?>
	<noindex>
	<?php if ($arResult["NavShowAll"]):?>
		|&nbsp;<a href="<?=$arResult["sUrlPath"]?>?<?=$strNavQueryString?>SHOWALL_<?=$arResult["NavNum"]?>=0" rel="nofollow"><?=GetMessage("nav_paged")?></a>&nbsp;
	<?php else:?>
		|&nbsp;<a href="<?=$arResult["sUrlPath"]?>?<?=$strNavQueryString?>SHOWALL_<?=$arResult["NavNum"]?>=1" rel="nofollow"><?=GetMessage("nav_all")?></a>&nbsp;
	<?php endif?>
	</noindex>
<?php endif?>

	</div>

</div>