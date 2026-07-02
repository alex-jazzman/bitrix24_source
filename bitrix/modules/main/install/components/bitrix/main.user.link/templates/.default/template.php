<?php
if (!defined("B_PROLOG_INCLUDED") || B_PROLOG_INCLUDED!==true)die();

/** @var CBitrixComponentTemplate $this */
/** @var array $arParams */
/** @var array $arResult */

use Bitrix\Main\UI;

UI\Extension::load("ui.tooltip");

if (!empty($arResult["FatalError"]))
{
	?><span class='errortext'><?=$arResult["FatalError"]?></span><br /><br /><?php
}
else
{
	$anchor_id = $this->randString(8);

	if (!isset($arParams["INLINE"]) || $arParams["INLINE"] != "Y")
	{
		$tooltipUserId = (
			$arResult["User"]["DETAIL_URL"] <> ''
			&& $arResult["CurrentUserPerms"]["Operations"]["viewprofile"]
			&& (
				!array_key_exists("USE_TOOLTIP", $arResult)
				|| $arResult["USE_TOOLTIP"]
			)
				? $arResult["User"]["ID"]
				: ''
		);

		if ($arResult["User"]["DETAIL_URL"] <> '' && $arResult["CurrentUserPerms"]["Operations"]["viewprofile"])
		{
			?><table cellspacing="0" cellpadding="0" border="0" id="anchor_<?=$anchor_id?>" class="bx-user-info-anchor" bx-tooltip-user-id="<?=$tooltipUserId?>"><?php
		}
		else
		{
			?><table cellspacing="0" cellpadding="0" border="0" id="anchor_<?=$anchor_id?>" class="bx-user-info-anchor-nolink" bx-tooltip-user-id="<?=$tooltipUserId?>"><?php
		}
		?><tr><?php
		if ($arParams["USE_THUMBNAIL_LIST"] == "Y")
		{
			?><td class="bx-user-info-anchor-cell"><div class="bx-user-info-thumbnail" align="center" valign="middle" <?php if (intval($arParams["THUMBNAIL_LIST_SIZE"]) > 0): echo 'style="width: '.intval($arParams["THUMBNAIL_LIST_SIZE"]).'px; height: '.intval($arParams["THUMBNAIL_LIST_SIZE"]+2).'px;"'; endif;?>><?php
			if (!empty($arResult["User"]["HREF"]))
			{
				?><a href="<?=$arResult["User"]["HREF"]?>"<?=(isset($arParams["SEO_USER"]) && $arParams["SEO_USER"] == "Y" ? ' rel="nofollow"' : '')?>><?=$arResult["User"]["PersonalPhotoImgThumbnail"]["Image"]?></a><?php
			}
			elseif (
				$arResult["User"]["DETAIL_URL"] <> ''
				&& $arResult["CurrentUserPerms"]["Operations"]["viewprofile"]
			)
			{
				?><a href="<?=$arResult["User"]["DETAIL_URL"]?>"<?=(isset($arParams["SEO_USER"]) && $arParams["SEO_USER"] == "Y" ? ' rel="nofollow"' : '')?>><?=$arResult["User"]["PersonalPhotoImgThumbnail"]["Image"]?></a><?php
			}
			else
			{
				?><?=$arResult["User"]["PersonalPhotoImgThumbnail"]["Image"] ?? ''?><?php
			}
			?></div></td><?php
		}
		?><td class="bx-user-info-anchor-cell" valign="top"><?php
		if (!empty($arResult["User"]["HREF"]))
		{
			?><a class="bx-user-info-name" href="<?=$arResult["User"]["HREF"]?>"<?=(isset($arParams["SEO_USER"]) && $arParams["SEO_USER"] == "Y" ? ' rel="nofollow"' : '')?>><?=$arResult["User"]["NAME_FORMATTED"]?></a><?php
		}
		elseif (
			$arResult["User"]["DETAIL_URL"] <> ''
			&& $arResult["CurrentUserPerms"]["Operations"]["viewprofile"]
		)
		{
			?><a class="bx-user-info-name" href="<?=$arResult["User"]["DETAIL_URL"]?>"<?=(isset($arParams["SEO_USER"]) && $arParams["SEO_USER"] == "Y" ? ' rel="nofollow"' : '')?>><?=$arResult["User"]["NAME_FORMATTED"]?></a><?php
		}
		else
		{
			?><div class="bx-user-info-name"><?=$arResult["User"]["NAME_FORMATTED"]?></div><?php
		}
		?><?=(!empty($arResult["User"]["NAME_DESCRIPTION"]) ? " (".$arResult["User"]["NAME_DESCRIPTION"].")": "")?><?php
		if ($arResult["bSocialNetwork"])
		{
			if (array_key_exists("IS_ONLINE", $arParams))
			{
				$online_class_attrib = ($arParams["IS_ONLINE"] === true ? ' class="bx-user-info-online"' : ' class="bx-user-info-offline"');
			}
			else
			{
				$online_class_attrib = '';
			}

			if (!empty($arResult["User"]["HREF"]))
			{
				$link = $arResult["User"]["HREF"];
			}
			elseif (
				$arResult["User"]["DETAIL_URL"] <> ''
				&& $arResult["CurrentUserPerms"]["Operations"]["viewprofile"]
			)
			{
				$link = $arResult["User"]["DETAIL_URL"];
			}
			else
			{
				$link = false;
			}
			?>
			<div class="bx-user-info-online-cell"><?php
			if (!$link)
			{
				?><div id="<?=$arResult["User"]["HTML_ID"]?>"<?=$online_class_attrib?>></div><?php
			}
			else
			{
				?><div id="<?=$arResult["User"]["HTML_ID"]?>"<?=$online_class_attrib?>><a href="<?=$link?>"><img src="/bitrix/images/1.gif" width="11" height="11" border="0" alt=""></a></div><?php
			}
			?></div><?php
		}
		?></td>
		</tr>
		</table><?php
	}
	else
	{
		if (
			$arResult["User"]["DETAIL_URL"] <> ''
			&& $arResult["CurrentUserPerms"]["Operations"]["viewprofile"]
		)
		{
			?><a href="<?=$arResult["User"]["DETAIL_URL"]?>"<?=(isset($arParams["SEO_USER"]) && $arParams["SEO_USER"] == "Y" ? ' rel="nofollow"' : '')?> id="anchor_<?=$anchor_id?>" bx-tooltip-user-id="<?=$arResult["User"]["ID"]?>"><?=$arResult["User"]["NAME_FORMATTED"]?></a><?php
		}
		elseif ($arResult["User"]["DETAIL_URL"] <> '' && !$arResult["bSocialNetwork"])
		{
			?><a href="<?=$arResult["User"]["DETAIL_URL"]?>"<?=(isset($arParams["SEO_USER"]) && $arParams["SEO_USER"] == "Y" ? ' rel="nofollow"' : '')?> id="anchor_<?=$anchor_id?>"><?=$arResult["User"]["NAME_FORMATTED"]?></a><?php
		}
		else
		{
			?><?=$arResult["User"]["NAME_FORMATTED"]?><?php
		}
		?><?=(isset($arResult["User"]["NAME_DESCRIPTION"]) && $arResult["User"]["NAME_DESCRIPTION"] <> '' ? " (".$arResult["User"]["NAME_DESCRIPTION"].")": "")?><?php
	}
}
