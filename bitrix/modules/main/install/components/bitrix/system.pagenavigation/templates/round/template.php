<?php if(!defined("B_PROLOG_INCLUDED") || B_PROLOG_INCLUDED!==true)die();

/** @var array $arParams */
/** @var array $arResult */
/** @var CBitrixComponentTemplate $this */

$this->setFrameMode(true);

if(!$arResult["NavShowAlways"])
{
	if ($arResult["NavRecordCount"] == 0 || ($arResult["NavPageCount"] == 1 && $arResult["NavShowAll"] == false))
		return;
}

$strNavQueryString = ($arResult["NavQueryString"] != "" ? $arResult["NavQueryString"]."&amp;" : "");
$strNavQueryStringFull = ($arResult["NavQueryString"] != "" ? "?".$arResult["NavQueryString"] : "");

$colorSchemes = array(
	"green" => "bx-green",
	"yellow" => "bx-yellow",
	"red" => "bx-red",
	"blue" => "bx-blue",
);
$colorScheme = $colorSchemes[$arParams["TEMPLATE_THEME"] ?? ''] ?? '';
?>

<div class="bx-pagination <?=$colorScheme?>">
	<div class="bx-pagination-container">
		<ul>
<?php if($arResult["bDescPageNumbering"] === true):?>

	<?php if ($arResult["NavPageNomer"] < $arResult["NavPageCount"]):?>
		<?php if($arResult["bSavePage"]):?>
			<li class="bx-pag-prev"><a href="<?=$arResult["sUrlPath"]?>?<?=$strNavQueryString?>PAGEN_<?=$arResult["NavNum"]?>=<?=($arResult["NavPageNomer"]+1)?>"><span><?= GetMessage("round_nav_back")?></span></a></li>
			<li class=""><a href="<?=$arResult["sUrlPath"]?>?<?=$strNavQueryString?>PAGEN_<?=$arResult["NavNum"]?>=<?=($arResult["NavPageNomer"]+1)?>"><span>1</span></a></li>
		<?php else:?>
			<?php if (($arResult["NavPageNomer"]+1) == $arResult["NavPageCount"]):?>
				<li class="bx-pag-prev"><a href="<?=$arResult["sUrlPath"]?><?=$strNavQueryStringFull?>"><span><?= GetMessage("round_nav_back")?></span></a></li>
			<?php else:?>
				<li class="bx-pag-prev"><a href="<?=$arResult["sUrlPath"]?>?<?=$strNavQueryString?>PAGEN_<?=$arResult["NavNum"]?>=<?=($arResult["NavPageNomer"]+1)?>"><span><?= GetMessage("round_nav_back")?></span></a></li>
			<?php endif?>
			<li class=""><a href="<?=$arResult["sUrlPath"]?><?=$strNavQueryStringFull?>"><span>1</span></a></li>
		<?php endif?>
	<?php else:?>
			<li class="bx-pag-prev"><span><?= GetMessage("round_nav_back")?></span></li>
			<li class="bx-active"><span>1</span></li>
	<?php endif?>

	<?php
	$arResult["nStartPage"]--;
	while($arResult["nStartPage"] >= $arResult["nEndPage"]+1):
	?>
		<?php $NavRecordGroupPrint = $arResult["NavPageCount"] - $arResult["nStartPage"] + 1;?>

		<?php if ($arResult["nStartPage"] == $arResult["NavPageNomer"]):?>
			<li class="bx-active"><span><?=$NavRecordGroupPrint?></span></li>
		<?php else:?>
			<li class=""><a href="<?=$arResult["sUrlPath"]?>?<?=$strNavQueryString?>PAGEN_<?=$arResult["NavNum"]?>=<?=$arResult["nStartPage"]?>"><span><?=$NavRecordGroupPrint?></span></a></li>
		<?php endif?>

		<?php $arResult["nStartPage"]--?>
	<?php endwhile?>

	<?php if ($arResult["NavPageNomer"] > 1):?>
		<?php if($arResult["NavPageCount"] > 1):?>
			<li class=""><a href="<?=$arResult["sUrlPath"]?>?<?=$strNavQueryString?>PAGEN_<?=$arResult["NavNum"]?>=1"><span><?=$arResult["NavPageCount"]?></span></a></li>
		<?php endif?>
			<li class="bx-pag-next"><a href="<?=$arResult["sUrlPath"]?>?<?=$strNavQueryString?>PAGEN_<?=$arResult["NavNum"]?>=<?=($arResult["NavPageNomer"]-1)?>"><span><?= GetMessage("round_nav_forward")?></span></a></li>
	<?php else:?>
		<?php if($arResult["NavPageCount"] > 1):?>
			<li class="bx-active"><span><?=$arResult["NavPageCount"]?></span></li>
		<?php endif?>
			<li class="bx-pag-next"><span><?= GetMessage("round_nav_forward")?></span></li>
	<?php endif?>

<?php else:?>

	<?php if ($arResult["NavPageNomer"] > 1):?>
		<?php if($arResult["bSavePage"]):?>
			<li class="bx-pag-prev"><a href="<?=$arResult["sUrlPath"]?>?<?=$strNavQueryString?>PAGEN_<?=$arResult["NavNum"]?>=<?=($arResult["NavPageNomer"]-1)?>"><span><?= GetMessage("round_nav_back")?></span></a></li>
			<li class=""><a href="<?=$arResult["sUrlPath"]?>?<?=$strNavQueryString?>PAGEN_<?=$arResult["NavNum"]?>=1"><span>1</span></a></li>
		<?php else:?>
			<?php if ($arResult["NavPageNomer"] > 2):?>
				<li class="bx-pag-prev"><a href="<?=$arResult["sUrlPath"]?>?<?=$strNavQueryString?>PAGEN_<?=$arResult["NavNum"]?>=<?=($arResult["NavPageNomer"]-1)?>"><span><?= GetMessage("round_nav_back")?></span></a></li>
			<?php else:?>
				<li class="bx-pag-prev"><a href="<?=$arResult["sUrlPath"]?><?=$strNavQueryStringFull?>"><span><?= GetMessage("round_nav_back")?></span></a></li>
			<?php endif?>
			<li class=""><a href="<?=$arResult["sUrlPath"]?><?=$strNavQueryStringFull?>"><span>1</span></a></li>
		<?php endif?>
	<?php else:?>
			<li class="bx-pag-prev"><span><?= GetMessage("round_nav_back")?></span></li>
			<li class="bx-active"><span>1</span></li>
	<?php endif?>

	<?php
	$arResult["nStartPage"]++;
	while($arResult["nStartPage"] <= $arResult["nEndPage"]-1):
	?>
		<?php if ($arResult["nStartPage"] == $arResult["NavPageNomer"]):?>
			<li class="bx-active"><span><?=$arResult["nStartPage"]?></span></li>
		<?php else:?>
			<li class=""><a href="<?=$arResult["sUrlPath"]?>?<?=$strNavQueryString?>PAGEN_<?=$arResult["NavNum"]?>=<?=$arResult["nStartPage"]?>"><span><?=$arResult["nStartPage"]?></span></a></li>
		<?php endif?>
		<?php $arResult["nStartPage"]++?>
	<?php endwhile?>

	<?php if($arResult["NavPageNomer"] < $arResult["NavPageCount"]):?>
		<?php if($arResult["NavPageCount"] > 1):?>
			<li class=""><a href="<?=$arResult["sUrlPath"]?>?<?=$strNavQueryString?>PAGEN_<?=$arResult["NavNum"]?>=<?=$arResult["NavPageCount"]?>"><span><?=$arResult["NavPageCount"]?></span></a></li>
		<?php endif?>
			<li class="bx-pag-next"><a href="<?=$arResult["sUrlPath"]?>?<?=$strNavQueryString?>PAGEN_<?=$arResult["NavNum"]?>=<?=($arResult["NavPageNomer"]+1)?>"><span><?= GetMessage("round_nav_forward")?></span></a></li>
	<?php else:?>
		<?php if($arResult["NavPageCount"] > 1):?>
			<li class="bx-active"><span><?=$arResult["NavPageCount"]?></span></li>
		<?php endif?>
			<li class="bx-pag-next"><span><?= GetMessage("round_nav_forward")?></span></li>
	<?php endif?>
<?php endif?>

<?php if ($arResult["bShowAll"]):?>
	<?php if ($arResult["NavShowAll"]):?>
			<li class="bx-pag-all"><a href="<?=$arResult["sUrlPath"]?>?<?=$strNavQueryString?>SHOWALL_<?=$arResult["NavNum"]?>=0" rel="nofollow"><span><?= GetMessage("round_nav_pages")?></span></a></li>
	<?php else:?>
			<li class="bx-pag-all"><a href="<?=$arResult["sUrlPath"]?>?<?=$strNavQueryString?>SHOWALL_<?=$arResult["NavNum"]?>=1" rel="nofollow"><span><?= GetMessage("round_nav_all")?></span></a></li>
	<?php endif?>
<?php endif?>
		</ul>
		<div style="clear:both"></div>
	</div>
</div>
