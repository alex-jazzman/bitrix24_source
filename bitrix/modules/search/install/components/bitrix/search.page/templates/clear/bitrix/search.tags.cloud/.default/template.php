<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}
/** @var array $arParams */
/** @var array $arResult */

if (is_array($arResult['SEARCH']) && !empty($arResult['SEARCH'])):
?>
<noindex>
	<div class="search-tags-cloud" <?=$arParams['WIDTH']?>><?php
		foreach ($arResult['SEARCH'] as $res)
		{
		?><a href="<?=$res['URL']?>" style="font-size: <?=$res['FONT_SIZE']?>px; color: #<?=$res['COLOR']?>;px" rel="nofollow"><?=$res['NAME']?></a> <?php
		}
	?></div>
</noindex>
<?php
endif;
