<?php if (!defined("B_PROLOG_INCLUDED") || B_PROLOG_INCLUDED!==true)die();?>

<?php if (!empty($arResult)):?>

<div class="menu-sitemap-tree">
<ul>
	<?php
$previousLevel = 0;
foreach($arResult as $arItem):
?>
	<?php if ($previousLevel && $arItem["DEPTH_LEVEL"] < $previousLevel):?>
		<?=str_repeat("</ul></li>", ($previousLevel - $arItem["DEPTH_LEVEL"]));?>
	<?php endif?>

	<?php if ($arItem["IS_PARENT"]):?>
			<li<?php if(!isset($arItem["CHILD_SELECTED"]) || $arItem["CHILD_SELECTED"] !== true):?> class="menu-close"<?php endif?>>
				<div class="folder" onClick="OpenMenuNode(this)"></div>
				<div class="item-text"><a href="<?=$arItem["LINK"]?>"><?=$arItem["TEXT"]?></a></div>
				<ul>

	<?php else:?>

		<?php if ($arItem["PERMISSION"] > "D"):?>
				<li>
					<div class="page"></div>
					<div class="item-text"><a href="<?=$arItem["LINK"]?>"><?=$arItem["TEXT"]?></a></div>
				</li>
		<?php endif?>

	<?php endif?>

	<?php $previousLevel = $arItem["DEPTH_LEVEL"];?>

<?php endforeach?>

<?php if ($previousLevel > 1)://close last item tags?>
	<?=str_repeat("</ul></li>", ($previousLevel-1) );?>
<?php endif?>

</ul>
</div>
<?php endif?>
