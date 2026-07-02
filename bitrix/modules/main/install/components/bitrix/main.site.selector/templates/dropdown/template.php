<?php
if(!defined("B_PROLOG_INCLUDED") || B_PROLOG_INCLUDED!==true)die();

/**
 * @var array $arResult
 */
?>
<select name="site" onChange="location.href=this.value">
	<?php
foreach ($arResult["SITES"] as $key => $arSite):
?>
	<option value="<?php if(is_array($arSite['DOMAINS']) && $arSite['DOMAINS'][0] <> '' || $arSite['DOMAINS'] <> ''):?>http://<?php endif?><?=(is_array($arSite["DOMAINS"]) ? $arSite["DOMAINS"][0] : $arSite["DOMAINS"])?><?=$arSite["DIR"]?>" <?php if ($arSite["CURRENT"] == "Y"):?>SELECTED="1"<?php endif;?>><?=$arSite["NAME"]?></option>
<?php
endforeach;
?>
</select>