<?php if (!defined("B_PROLOG_INCLUDED") || B_PROLOG_INCLUDED!==true)die();?>

<?php if (!empty($arResult)):?>
<div class="grey-tabs-menu">
	<ul>
<?php foreach($arResult as $arItem):?>

	<?php if ($arItem["PERMISSION"] > "D"):?>
		<li><a href="<?=$arItem["LINK"]?>"><nobr><?=$arItem["TEXT"]?></nobr></a></li>
	<?php endif?>

<?php endforeach?>

	</ul>
</div>
<div class="menu-clear-left"></div>
<?php endif?>