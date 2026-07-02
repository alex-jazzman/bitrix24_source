<?php

/**
 * @global CMain $APPLICATION
 * @var float $main_exec_time Defined in epilog_admin_after.php
**/

use Bitrix\Main\Localization\Loc;

if (!defined("B_PROLOG_INCLUDED") || B_PROLOG_INCLUDED!==true)
{
	die();
}

IncludeModuleLangFile(__FILE__);

// ************************************************************************
// $main_exec_time, $bShowTime, $bShowStat MUST be defined before include
// ************************************************************************

/**
 * @global $bShowTime
 * @global $bShowStat
 * @global $bShowCacheStat
 */

global $APPLICATION;
$application = \Bitrix\Main\Application::getInstance();
$sqlTracker  = $application->getConnection()->getTracker();

echo CJSCore::Init('admin_interface', true);

?><style>
div.bx-debug-content-table tr.heading td {background-color:#E1EEDA;}
div.bx-debug-content-table tr.heading-sort td {white-space:nowrap; border-bottom:solid 1px #dce7ed; cursor:pointer;}
div.bx-debug-content-table tr.cache-row {vertical-align:top;}
div.bx-debug-content-table tr.cache-row td {white-space:nowrap;}
div.bx-debug-content-table tr.heading-bottom td {padding:3px 3px 9px 3px !important;}
div.bx-debug-content-table td {padding-right:4px !important; padding-bottom:4px !important;}
div.bx-debug-content-table td.number {padding-right:4px !important; padding-bottom:4px !important; text-align:right !important; white-space:nowrap !important}
div.bx-debug-content-top {padding:12px; position:relative; top:0; left:0; height:120px; overflow:auto; border-bottom:1px solid #D0D0D0;}
</style><?php

if ($bShowTime || $bShowStat || $bShowCacheStat)
{
	?><div class="bx-component-debug bx-debug-summary"><?php
}

$bShowExtTime = $bShowTime && !defined("ADMIN_SECTION") && $bShowStat;
$DOCUMENT_ROOT_LEN = mb_strlen($_SERVER["DOCUMENT_ROOT"]);

if ($bShowExtTime)
{
	$CURRENT_TIME = microtime(true);

	$PROLOG_BEFORE_1 = START_EXEC_PROLOG_BEFORE_1;
	$PROLOG_BEFORE_2 = defined('START_EXEC_PROLOG_BEFORE_2') ? START_EXEC_PROLOG_BEFORE_2 : START_EXEC_PROLOG_BEFORE_1;
	$PROLOG_BEFORE = $PROLOG_BEFORE_2 - $PROLOG_BEFORE_1;

	$PROLOG_AFTER = 0;
	$PROLOG_AFTER_2 = $PROLOG_BEFORE_2;
	if (defined('START_EXEC_PROLOG_AFTER_2') && defined('START_EXEC_PROLOG_AFTER_1'))
	{
		$PROLOG_AFTER_2 = START_EXEC_PROLOG_AFTER_2;
		$PROLOG_AFTER_1 = START_EXEC_PROLOG_AFTER_1;
		$PROLOG_AFTER = $PROLOG_AFTER_2 - $PROLOG_AFTER_1;
	}

	$PROLOG = $PROLOG_BEFORE + $PROLOG_AFTER;

	$EPILOG_BEFORE = 0;
	$EPILOG_AFTER = 0;
	$EPILOG = 0;
	if (defined("START_EXEC_EPILOG_BEFORE_1"))
	{
		$EPILOG_BEFORE_1 = START_EXEC_EPILOG_BEFORE_1;
		$WORK_AREA = $EPILOG_BEFORE_1 - $PROLOG_AFTER_2;

		if (defined("START_EXEC_EPILOG_AFTER_1"))
		{
			$EPILOG_AFTER_1 = START_EXEC_EPILOG_AFTER_1;
			$EPILOG_BEFORE = $EPILOG_AFTER_1 - $EPILOG_BEFORE_1;
			$EPILOG_AFTER = $CURRENT_TIME - $EPILOG_AFTER_1;
		}

		$EPILOG = $CURRENT_TIME - $EPILOG_BEFORE_1;
	}
	else
	{
		$WORK_AREA = $CURRENT_TIME - $PROLOG_AFTER_2;
	}

	$PAGE = $CURRENT_TIME - $PROLOG_BEFORE_1;

	$arAreas = [
		"PAGE" => ["FLT" => ["PB", "PA", "WA", "EB", "EV", "EA"], "TIME" => $PAGE],
		"PROLOG" => ["FLT" => ["PB", "PA"], "TIME" => $PROLOG],
		"PROLOG_BEFORE" => ["FLT" => ["PB"], "TIME" => $PROLOG_BEFORE],
		"PROLOG_AFTER" => ["FLT" => ["PA"], "TIME" => $PROLOG_AFTER],
		"WORK_AREA" => ["FLT" => ["WA"], "TIME" => $WORK_AREA],
		"EPILOG" => ["FLT" => ["EB", "EV", "EA"], "TIME" => $EPILOG],
		"EPILOG_BEFORE" => ["FLT" => ["EB"], "TIME" => $EPILOG_BEFORE],
		"EPILOG_AFTER" => ["FLT" => ["EV", "EA"], "TIME" => $EPILOG_AFTER],
	];

	$j = 1;
	foreach ($arAreas as $i => $arArea)
	{
		$arAreas[$i]["NUM"] = $j;
		$j++;

		$arAreas[$i]["TRACE"] = array(
			"PATH" => $APPLICATION->GetCurPage(),
			"QUERY_COUNT" => 0,
			"QUERY_TIME" => 0.0,
			"QUERIES" => array(),
			"TIME" => $arArea["TIME"],
			"COMPONENT_COUNT" => 0,
			"COMPONENT_TIME" => 0.0,
			"COMP_QUERY_COUNT" => 0,
			"COMP_QUERY_TIME" => 0.0,
			"CACHE_SIZE" => 0,
		);
	}

	$state = "PB";
	foreach ($sqlTracker->getQueries() as $arQueryDebug)
	{
		if ($arQueryDebug["BX_STATE"] <> '')
		{
			$state = $arQueryDebug["BX_STATE"];
		}

		foreach ($arAreas as $i => $arArea)
		{
			if (in_array($state, $arArea["FLT"]))
			{
				$arAreas[$i]["TRACE"]["QUERY_COUNT"]++;
				$arAreas[$i]["TRACE"]["QUERY_TIME"]+=$arQueryDebug["TIME"];
				//$arAreas[$i]["TRACE"]["QUERIES"][] = $arQueryDebug;
			}
		}
	}

	$state = "PA";
	foreach ($APPLICATION->arIncludeDebug as $arIncludeDebug)
	{
		if ($arIncludeDebug["BX_STATE"] <> '')
		{
			$state = $arIncludeDebug["BX_STATE"];
		}

		foreach ($arAreas as $i => $arArea)
		{
			if (in_array($state, $arArea["FLT"]))
			{
				$arAreas[$i]["TRACE"]["TIME"] -= $arIncludeDebug["TIME"];
				$arAreas[$i]["TRACE"]["COMPONENT_COUNT"]++;
				$arAreas[$i]["TRACE"]["COMPONENT_TIME"] += $arIncludeDebug["TIME"];
				$arAreas[$i]["TRACE"]["COMP_QUERY_COUNT"] += $arIncludeDebug["QUERY_COUNT"];
				$arAreas[$i]["TRACE"]["COMP_QUERY_TIME"] += $arIncludeDebug["QUERY_TIME"];
				$arAreas[$i]["TRACE"]["CACHE_SIZE"] += $arIncludeDebug["CACHE_SIZE"];
			}
		}
	}

	$bShowComps = !empty($APPLICATION->arIncludeDebug);

	foreach ($arAreas as $i => $arArea)
	{
		$arAreas[$i]["IND"] = count($APPLICATION->arIncludeDebug);
		$APPLICATION->arIncludeDebug[]=$arArea["TRACE"];
	}

	echo '<a href="javascript:jsDebugTimeWindow.Show(); jsDebugTimeWindow.ShowDetails(\'BX_DEBUG_TIME_1_1\')">'
		. Loc::getMessage("debug_info_cr_time")
		. '</a> <span id="bx_main_exec_time">' . round($PAGE, 4) . '</span> '
		. Loc::getMessage("debug_info_sec") . '<br>';
}
elseif ($bShowTime)
{
	echo Loc::getMessage("debug_info_cr_time") . ' <span id="bx_main_exec_time">'
		. round($main_exec_time, 4) . '</span> ' . Loc::getMessage("debug_info_sec") . '<br />';
}

$totalQueryCount = 0;
$totalQueryTime = 0.0;

if ($bShowStat || $bShowCacheStat)
{
	if ($bShowStat && $sqlTracker)
	{
		$totalQueryCount = $sqlTracker->getCounter();
		$totalQueryTime = $sqlTracker->getTime();
		foreach ($APPLICATION->arIncludeDebug as $i=>$arIncludeDebug)
		{
			if (array_key_exists("REL_PATH", $arIncludeDebug))
			{
				$totalQueryCount += $arIncludeDebug["QUERY_COUNT"];
				$totalQueryTime += $arIncludeDebug["QUERY_TIME"];
			}
		}
		echo '<a title="' . Loc::getMessage("debug_info_query_title") . '" href="javascript:BX_DEBUG_INFO_'
			. count($APPLICATION->arIncludeDebug) . '.Show(); BX_DEBUG_INFO_' . count($APPLICATION->arIncludeDebug)
			. '.ShowDetails(\'BX_DEBUG_INFO_' . count($APPLICATION->arIncludeDebug) . '_1\');">'
			. Loc::getMessage("debug_info_total_queries") . "</a> " . intval($totalQueryCount) . "<br>";

		echo Loc::getMessage("debug_info_total_time") . " " . round($totalQueryTime, 4)
			. " " . Loc::getMessage("debug_info_sec") . "<br>";
	}

	if ($GLOBALS["CACHE_STAT_BYTES"] || $bShowCacheStat)
	{
		$arCacheDebug = \Bitrix\Main\Diag\CacheTracker::getCacheTracking();
		if (!empty($arCacheDebug))
		{
			echo '<a title="' . Loc::getMessage("debug_info_query_title")
				. '" href="javascript:BX_DEBUG_INFO_CACHE.Show(); BX_DEBUG_INFO_CACHE.ShowDetails(\'BX_DEBUG_INFO_CACHE_m_0\');">'
				. Loc::getMessage("debug_info_cache_size") . "</a> " . " ", CFile::FormatSize(\Bitrix\Main\Diag\CacheTracker::getCacheStatBytes(), 0)
				. " (" . count($arCacheDebug) . ")<br>";
		}
		else
		{
			echo Loc::getMessage("debug_info_cache_size") . " ", CFile::FormatSize(\Bitrix\Main\Diag\CacheTracker::getCacheStatBytes(), 0) . "<br>";
		}
	}
}

if ($bShowTime || $bShowStat)
{
	echo '</div><div class="empty"></div>';
}

if ($bShowStat || $bShowCacheStat) //2
{
	$APPLICATION->arIncludeDebug[] = array(
		"PATH" => $APPLICATION->GetCurPage(),
		"QUERY_COUNT" => $totalQueryCount,
		"QUERY_TIME" => round($totalQueryTime, 4),
		"QUERIES" => $sqlTracker,
		"TIME" => $main_exec_time,
	);

	//CJSPopup
	require_once($_SERVER["DOCUMENT_ROOT"].BX_ROOT."/modules/main/interface/admin_lib.php");

	$arCacheDebug = \Bitrix\Main\Diag\CacheTracker::getCacheTracking();
	if (!empty($arCacheDebug))
	{
		?><script>
			function sortTable(table_id, column_num, reverse)
			{
				var table = BX(table_id);
				var title = table.rows[0].cells[column_num].innerHTML;
				if (title.charCodeAt(0) == 8595)
					reverse = true;
				if (title.charCodeAt(0) == 8593)
					reverse = false;

				for (var i = 1; i < table.rows.length; i++)
				{
					for (var j = 1; j < table.rows.length; j++)
					{
						var a = table.rows[i].cells[column_num].getAttribute('sort')? table.rows[i].cells[column_num].getAttribute('sort'): table.rows[i].cells[column_num].innerHTML;
						var ai = parseInt(a);
						if (ai > 0) a = ai;
						var b = table.rows[j].cells[column_num].getAttribute('sort')? table.rows[j].cells[column_num].getAttribute('sort'): table.rows[j].cells[column_num].innerHTML;
						var bi = parseInt(b);
						if (bi > 0) b = bi;

						if ((!reverse && a < b) || (reverse && a > b))
						{
							table.tBodies[0].insertBefore(table.rows[i], table.rows[j]);
						}
					}
				}

				for (var i = 0; i < table.rows[0].cells.length; i++)
				{

					var title = table.rows[0].cells[i].innerHTML;
					if (
						title.charCodeAt(0) == 8595
						|| title.charCodeAt(0) == 8593
					)
						table.rows[0].cells[i].innerHTML = title.substr(1);

					if (i == column_num)
						table.rows[0].cells[i].innerHTML = (reverse? '&uarr;': '&darr;') + table.rows[0].cells[i].innerHTML;
				}
			}
			BX_DEBUG_INFO_CACHE = new BX.CDebugDialog();
		</script><?php

		$obJSPopup = new CJSPopupOnPage('', array());
		$obJSPopup->jsPopup = 'BX_DEBUG_INFO_CACHE';
		$obJSPopup->StartDescription('bx-debug-window');
		?><p><?= Loc::getMessage("debug_info_cache_size")?> <?=CFile::FormatSize(\Bitrix\Main\Diag\CacheTracker::getCacheStatBytes(), 0)?></p><?php
		$obJSPopup->StartContent(array('buffer' => true));

		?><div class="bx-debug-content bx-debug-content-table">
			<table id="cacheDebug" cellpadding="2" cellspacing="0" border="0">
				<tr class="heading-sort">
					<td onclick="sortTable('cacheDebug', 0)">&darr;&nbsp;</td>
					<td onclick="sortTable('cacheDebug', 1)"><?= Loc::getMessage("debug_info_cache_table_func");?></td>
					<td onclick="sortTable('cacheDebug', 2, true)"><?= Loc::getMessage("debug_info_cache_table_size");?></td>
					<td onclick="sortTable('cacheDebug', 3)"><?= Loc::getMessage("debug_info_cache_file_path");?></td>
				</tr><?php

				foreach ($arCacheDebug as $j => $cacheDebug)
				{
					if (mb_substr($cacheDebug["path"],0,$DOCUMENT_ROOT_LEN) === $_SERVER["DOCUMENT_ROOT"])
					{
						$path = '<a target="blank" href="/bitrix/admin/fileman_file_view.php?path='.urlencode(mb_substr($cacheDebug["path"],$DOCUMENT_ROOT_LEN)).'&lang='.LANGUAGE_ID.'">'.htmlspecialcharsEx(mb_substr($cacheDebug["path"],$DOCUMENT_ROOT_LEN)).'</a>';
					}
					else
					{
						$path = '&nbsp;';
					}
					?><tr class="cache-row">
						<td class="number"><?= $j+1?></td>
						<td><a href="javascript:BX_DEBUG_INFO_CACHE.ShowDetails('BX_DEBUG_INFO_CACHE_m_<?=$j?>')"><?= $cacheDebug["callee_func"]?></a></td>
						<td class="number" sort="<?= $cacheDebug["cache_size"]?>"><?=CFile::FormatSize($cacheDebug["cache_size"], 0)?></td>
						<td><?=$path?></td>
					</tr><?php
				}
			?></table>
		</div>#DIVIDER#<div class="bx-debug-content bx-debug-content-details"><?php

				foreach($arCacheDebug as $j => $cacheDebug)
				{
					?><div id="BX_DEBUG_INFO_CACHE_m_<?=$j?>" style="display:none">
					<b><?= Loc::getMessage("debug_info_query_from")?></b><?php

					$k = 1;
					foreach ($cacheDebug["TRACE"] as $n => $tr)
					{
						?><br /><br />
						<b>(<?= ($n + 1)?>)</b><?php

						echo $tr["file"].":".$tr["line"]."<br /><nobr>".htmlspecialcharsbx($tr["func"]);
						if ($n == 0)
						{
							echo "(...)</nobr>";
						}
						else
						{
							echo "</nobr>(".htmlspecialcharsbx(print_r($tr["args"], true)).")";
						}
					} //$back_trace
					?></div><?php
				}; // $arQueries
			?></div><?php

		$obJSPopup->StartButtons();
		$obJSPopup->ShowStandardButtons(array('close'));
	}
?>
<script>
	var tableRows;
	function filterTable(input, table_id, column_num)
	{
		var table = BX(table_id);
		for (var i = 0; i < table.rows.length; i++)
		{
			var sql = table.rows[i].cells[column_num].innerHTML;
			if (input.value.length > 0 && sql.indexOf(input.value) == -1)
				table.rows[i].style.display = 'none';
			else
				table.rows[i].style.display = 'block';
		}
	}
	BX_DEBUG_INFO_CACHE = new BX.CDebugDialog();
</script><?php

	foreach ($APPLICATION->arIncludeDebug as $i => $arIncludeDebug)
	{
		?><script>BX_DEBUG_INFO_<?=$i?> = new BX.CDebugDialog();</script><?php

		$obJSPopup = new CJSPopupOnPage('', []);
		$obJSPopup->jsPopup = 'BX_DEBUG_INFO_'.$i;
		$obJSPopup->StartDescription('bx-core-debug-info');
		?>
		<p><?=Loc::getMessage("debug_info_path")?> <?=($arIncludeDebug["PATH"] ?? '')?></p>
		<p><?=Loc::getMessage("debug_info_time")?> <?=($arIncludeDebug["TIME"] ?? '')?> <?= Loc::getMessage("debug_info_sec")?></p>
		<p><?=Loc::getMessage("debug_info_queries")?> <?=($arIncludeDebug["QUERY_COUNT"] ?? '')?>, <?= Loc::getMessage("debug_info_time1")?> <?=($arIncludeDebug["QUERY_TIME"] ?? '')?> <?= Loc::getMessage("debug_info_sec")?><?php if(isset($arIncludeDebug["TIME"]) && $arIncludeDebug["TIME"] > 0):?> (<?=round($arIncludeDebug["QUERY_TIME"]/$arIncludeDebug["TIME"]*100, 2)?>%)<?php endif?></p>
		<p><?=Loc::getMessage("debug_info_search")?>: <input type="text" style="height:16px" onkeydown="filterTable(this, 'queryDebug<?= $i?>', 1)" onpaste="filterTable(this, 'queryDebug<?= $i?>', 1)" oninput="filterTable(this, 'queryDebug<?= $i?>', 1)"></p><?php

		$obJSPopup->StartContent(['buffer' => true]);
		if (!empty($arIncludeDebug["QUERIES"]))
		{
			?><div class="bx-debug-content bx-debug-content-table"><?php
				$arQueries = [];
				foreach ($arIncludeDebug["QUERIES"] as $j => $arQueryDebug)
				{
					$strSql = $arQueryDebug["QUERY"];

					if (!isset($arQueries[$strSql]["COUNT"]))
					{
						$arQueries[$strSql]["COUNT"] = 0;
					}
					$arQueries[$strSql]["COUNT"]++;
					$arQueries[$strSql]["CALLS"][] = [
						"TIME"=>$arQueryDebug["TIME"],
						"TRACE"=>$arQueryDebug["TRACE"]
					];
				}
				?><table id="queryDebug<?= $i?>" cellpadding="0" cellspacing="0" border="0"><?php
					$j = 1;
					foreach ($arQueries as $strSql => $query)
					{
						?><tr>
							<td class="number" valign="top"><?= $j?></td>
							<td><a href="javascript:BX_DEBUG_INFO_<?=$i?>.ShowDetails('BX_DEBUG_INFO_<?=$i."_".$j?>')"><?= htmlspecialcharsbx(mb_substr($strSql,0,100))."..."?></a>&nbsp;(<?= $query["COUNT"]?>) </td>
							<td class="number" valign="top"><?php
								$t = 0.0;
								foreach ($query["CALLS"] as $call)
								{
									$t += $call["TIME"];
								}
								echo number_format($t/$query["COUNT"], 5);
							?></td>
						</tr><?php
						$j++;
					} //$arQueries
				?></table>
			</div>#DIVIDER#<div class="bx-debug-content bx-debug-content-details"><?php
				$j = 1;
				foreach ($arQueries as $strSql => $query)
				{
					?><div id="BX_DEBUG_INFO_<?=$i."_".$j?>" style="display:none">
					<b><?= Loc::getMessage("debug_info_query")?> <?= $j?>:</b>
					<br /><br /><?php

					$strSql = preg_replace("/[\\n\\r\\t\\s ]+/", " ", $strSql);
					$strSql = preg_replace("/^ +/", "", $strSql);
					$strSql = preg_replace("/ (INNER JOIN|OUTER JOIN|LEFT JOIN|SET|LIMIT) /i", "\n\\1 ", $strSql);
					$strSql = preg_replace("/(INSERT INTO [A-Z_0-1]+?)\\s/i", "\\1\n", $strSql);
					$strSql = preg_replace("/(INSERT INTO [A-Z_0-1]+?)([(])/i", "\\1\n\\2", $strSql);
					$strSql = preg_replace("/([\\s)])(VALUES)([\\s(])/i", "\\1\n\\2\n\\3", $strSql);
					$strSql = preg_replace("/ (FROM|WHERE|ORDER BY|GROUP BY|HAVING) /i", "\n\\1\n", $strSql);
					echo str_replace(array("\n"), array("<br />"), htmlspecialcharsbx($strSql));

					?><br /><br /><b><?= Loc::getMessage("debug_info_query_from")?></b><?php

					$k = 1;
					foreach ($query["CALLS"] as $call)
					{
						$back_trace = $call["TRACE"];

						if (is_array($back_trace))
						{
							foreach ($back_trace as $n => $tr)
							{
								?><br /><br /><b>(<?= $k.".".($n+1)?>)</b><?php
								echo $tr["file"] . ":" . $tr["line"] . "<br /><nobr>" . htmlspecialcharsbx($tr["class"] . $tr["type"] . $tr["function"]);
								if ($n == 0)
								{
									echo "(...)</nobr>";
								}
								else
								{
									echo "</nobr>(".htmlspecialcharsbx(print_r($tr["args"], true)).")";
								}
							} //$back_trace
						}
						else //is_array($back_trace)
						{
							?>
							<br /><br />
							<b>(<?= $k?>)</b> <?= Loc::getMessage("debug_info_query_from_unknown")?>
							<?php
						} //is_array($back_trace)

						?><br /><br /><?php
						echo Loc::getMessage("debug_info_query_time")?> <?= round($call["TIME"], 5)?> <?= Loc::getMessage("debug_info_sec");
						$k++;

					} //$query["CALLS"]
					?></div><?php

					$j++;
				}; // $arQueries
			?></div><?php
		} //if(count($arIncludeDebug["QUERIES"])>0)
		$obJSPopup->StartButtons();
		$obJSPopup->ShowStandardButtons(array('close'));

		/*************************************CACHE*********************************************/
		?><script>BX_DEBUG_INFO_CACHE_<?=$i?> = new BX.CDebugDialog();</script><?php
		$obJSPopup = new CJSPopupOnPage('', array());
		$obJSPopup->jsPopup = 'BX_DEBUG_INFO_CACHE_'.$i;
		$obJSPopup->StartDescription('bx-core-debug-info');
		?><p><?= Loc::getMessage("debug_info_cache_size")?> <?=CFile::FormatSize($arIncludeDebug["CACHE_SIZE"] ?? 0, 0)?></p><?php
		$obJSPopup->StartContent(array('buffer' => true));
		if (isset($arIncludeDebug["CACHE"]) && !empty($arIncludeDebug["CACHE"]))
		{
			?>
			<div class="bx-debug-content bx-debug-content-table">
				<table id="cacheDebug<?=$i?>" cellpadding="2" cellspacing="0" border="0">
					<tr class="heading-sort">
						<td onclick="sortTable('cacheDebug<?=$i?>', 0)">&darr;&nbsp;</td>
						<td onclick="sortTable('cacheDebug<?=$i?>', 1)"><?=Loc::getMessage("debug_info_cache_table_func");?></td>
						<td onclick="sortTable('cacheDebug<?=$i?>', 2, true)"><?=Loc::getMessage("debug_info_cache_table_size");?></td>
						<td onclick="sortTable('cacheDebug', 3)"><?=Loc::getMessage("debug_info_cache_file_path");?></td>
					</tr><?php

					foreach ($arIncludeDebug["CACHE"] as $j => $cacheDebug)
					{
						if (mb_substr($cacheDebug["path"],0,$DOCUMENT_ROOT_LEN) === $_SERVER["DOCUMENT_ROOT"])
						{
							$path = '<a target="blank" href="/bitrix/admin/fileman_file_view.php?path='.urlencode(mb_substr($cacheDebug["path"],$DOCUMENT_ROOT_LEN)).'&lang='.LANGUAGE_ID.'">'.htmlspecialcharsEx(mb_substr($cacheDebug["path"],$DOCUMENT_ROOT_LEN)).'</a>';
						}
						else
						{
							$path = '&nbsp;';
						}
					?>
					<tr class="cache-row">
						<td class="number"><?= $j+1?></td>
						<td><a href="javascript:BX_DEBUG_INFO_CACHE_<?=$i?>.ShowDetails('BX_DEBUG_INFO_CACHE_<?=$i."_".$j?>')"><?= $cacheDebug["callee_func"]?></a></td>
						<td class="number" sort="<?= $cacheDebug["cache_size"]?>"><?=CFile::FormatSize($cacheDebug["cache_size"], 0)?></td>
						<td><?=$path?></td>
					</tr><?php
					}
				?></table>
			</div>#DIVIDER#<div class="bx-debug-content bx-debug-content-details"><?php

				foreach ($arIncludeDebug["CACHE"] as $j => $cacheDebug)
				{
					?><div id="BX_DEBUG_INFO_CACHE_<?=$i?>_<?=$j?>" style="display:none">
					<b><?=Loc::getMessage("debug_info_query_from")?></b><?php

					$k = 1;
					foreach ($cacheDebug["TRACE"] as $n => $tr)
					{
						?><br /><br />
						<b>(<?= ($n + 1)?>)</b><?php

						echo $tr["file"].":".$tr["line"]."<br /><nobr>".htmlspecialcharsbx($tr["func"]);
						if ($n == 0)
						{
							echo "(...)</nobr>";
						}
						else
						{
							echo "</nobr>(".htmlspecialcharsbx(print_r($tr["args"], true)).")";
						}
					} //$back_trace
					?></div><?php
				}; // $arQueries
			?></div><?php
		} //if($arIncludeDebug["CACHE"])
		$obJSPopup->StartButtons();
		$obJSPopup->ShowStandardButtons(array('close'));
	} //$APPLICATION->arIncludeDebug
} //$bShowStat 2

if($bShowExtTime)
{
	$obJSPopup = new CJSPopupOnPage();
	$obJSPopup->jsPopup = 'jsDebugTimeWindow';

?><script>var jsDebugTimeWindow = new BX.CDebugDialog();</script>
<div id="BX_DEBUG_TIME" class="bx-debug-window" style="z-index:99; width:660px !important;"><?php
	$obJSPopup->StartDescription('bx-core-debug-info');
	?><p><?=Loc::getMessage("debug_info_page")?> <?=$APPLICATION->GetCurPage()?></p>
	<p><?=Loc::getMessage("debug_info_comps_cache")?> <?php if(COption::GetOptionString("main", "component_cache_on", "Y")=="Y") echo Loc::getMessage("debug_info_comps_cache_on"); else echo "<a href=\"/bitrix/admin/cache.php\"><font class=\"errortext\">".Loc::getMessage("debug_info_comps_cache_off")."</font></a>";?>.</p>
	<p><?php
	if (\Bitrix\Main\Data\Cache::getShowCacheStat())
	{
		echo Loc::getMessage("debug_info_cache_size")." ",CFile::FormatSize(\Bitrix\Main\Diag\CacheTracker::getCacheStatBytes(), 0);
	}
	else
	{
		echo "&nbsp;";
	}
	?></p><?php

	$obJSPopup->StartContent(array('buffer' => true));

	?><div id="BX_DEBUG_TIME_1">
		<div class="bx-debug-content bx-debug-content-table">

<table cellpadding="0" cellspacing="0" border="0" width="100%">
	<tr class="heading">
		<td>&nbsp;</td>
		<td>&nbsp;</td>
		<td class="number" nowrap><span><?=Loc::getMessage("debug_info_page_exec")?></span></td>
		<td class="number" nowrap><span><?=Loc::getMessage("debug_info_sec")?></span></td>
		<?php if($bShowComps):?>
			<td class="number" nowrap><span><?=Loc::getMessage("debug_info_comps_exec")?></span></td>
			<td class="number" nowrap><span><?=Loc::getMessage("debug_info_sec")?></span></td>
		<?php endif;
		if($bShowStat):?>
			<td class="number" nowrap><span><?=Loc::getMessage("debug_info_queries_exec")?></span></td>
			<td class="number" nowrap><span><?=Loc::getMessage("debug_info_sec")?></span></td>
		<?php endif;?>
		<td class="heading">&nbsp;</td>
	</tr>
	<tr class="heading heading-bottom">
		<td>&nbsp;</td>
		<td>
			<?php if($bShowComps):
				?><a style="font-weight:bold !important" href="javascript:jsDebugTimeWindow.ShowDetails('BX_DEBUG_TIME_1_1')"><?= GetMessage("debug_info_whole_page")?></a><?php
			else:
				?><b><?=Loc::getMessage("debug_info_whole_page")?></b><?php
			endif?>
		</td>
		<td class="number" nowrap><b>100%</b></td>
		<td class="number" nowrap><b><?= number_format($PAGE, 4)?></b></td>
		<?php if($bShowComps):?>
			<td class="number" nowrap><b><?= intval($arAreas["PAGE"]["TRACE"]["COMPONENT_COUNT"])?></b></td>
			<td class="number" nowrap><b><?= number_format($arAreas["PAGE"]["TRACE"]["COMPONENT_TIME"], 4)?></b></td>
		<?php endif;

		if($bShowStat):?>
			<td class="number" nowrap><b><?= $arAreas["PAGE"]["TRACE"]["QUERY_COUNT"]+$arAreas["PAGE"]["TRACE"]["COMP_QUERY_COUNT"]?></b></td>
			<td class="number" nowrap><b><?= number_format($arAreas["PAGE"]["TRACE"]["QUERY_TIME"]+$arAreas["PAGE"]["TRACE"]["COMP_QUERY_TIME"], 4)?></b></td>
		<?php endif;?>
		<td class="heading">&nbsp;</td>
	</tr>
	<tr valign="top">
		<td>&nbsp;</td>
		<td>
			<?php if($bShowComps):?>
				<p><a style="font-weight:bold !important" href="javascript:jsDebugTimeWindow.ShowDetails('BX_DEBUG_TIME_1_2')"><?=Loc::getMessage("debug_info_prolog")?></a></p>
				<p>
					&nbsp;&nbsp;<a href="javascript:jsDebugTimeWindow.ShowDetails('BX_DEBUG_TIME_1_3')"><?=Loc::getMessage("debug_info_prolog_before")?></a><br>
					&nbsp;&nbsp;<a href="javascript:jsDebugTimeWindow.ShowDetails('BX_DEBUG_TIME_1_5')"><?=Loc::getMessage("debug_info_prolog_after")?></a><br>
				</p>
			<?php else:?>
				<p><b><?=Loc::getMessage("debug_info_prolog")?></b></p>
				<p>
					&nbsp;&nbsp;<?=Loc::getMessage("debug_info_prolog_before")?><br>
					&nbsp;&nbsp;<?=Loc::getMessage("debug_info_prolog_after")?><br>
				</p>
			<?php endif?>
		</td>
		<td class="number" nowrap>
			<p><b><?= number_format($PROLOG/$PAGE*100, 2),"%"?></b></p>
			<p>
				<?= number_format($PROLOG_BEFORE/$PAGE*100, 2),"%"?><br>
				<?= number_format($PROLOG_AFTER/$PAGE*100, 2),"%"?><br>
			</p>
		</td>
		<td class="number" nowrap>
			<p><b><?= number_format($PROLOG, 4)?></b></p>
			<p>
				<?= number_format($PROLOG_BEFORE, 4)?><br>
				<?= number_format($PROLOG_AFTER, 4)?><br>
			</p>
		</td>
		<?php if($bShowComps):?>
			<td class="number" nowrap>
				<p><b><?= intval($arAreas["PROLOG"]["TRACE"]["COMPONENT_COUNT"])?></b></p>
				<p>
					<?= intval($arAreas["PROLOG_BEFORE"]["TRACE"]["COMPONENT_COUNT"])?><br>
					<?= intval($arAreas["PROLOG_AFTER"]["TRACE"]["COMPONENT_COUNT"])?><br>
				</p>
			</td>
			<td class="number" nowrap>
				<p><b><?= number_format($arAreas["PROLOG"]["TRACE"]["COMPONENT_TIME"], 4)?></b></p>
				<p>
					<?= number_format($arAreas["PROLOG_BEFORE"]["TRACE"]["COMPONENT_TIME"], 4)?><br>
					<?= number_format($arAreas["PROLOG_AFTER"]["TRACE"]["COMPONENT_TIME"], 4)?><br>
				</p>
			</td>
		<?php endif;?>
		<?php if($bShowStat):?>
			<td class="number" nowrap>
				<p><b><?= $arAreas["PROLOG"]["TRACE"]["QUERY_COUNT"]+$arAreas["PROLOG"]["TRACE"]["COMP_QUERY_COUNT"]?></b></p>
				<p>
					<?= $arAreas["PROLOG_BEFORE"]["TRACE"]["QUERY_COUNT"]+$arAreas["PROLOG_BEFORE"]["TRACE"]["COMP_QUERY_COUNT"]?><br>
					<?= $arAreas["PROLOG_AFTER"]["TRACE"]["QUERY_COUNT"]+$arAreas["PROLOG_AFTER"]["TRACE"]["COMP_QUERY_COUNT"]?><br>
				</p>
			</td>
			<td class="number" nowrap>
				<p><b><?= number_format($arAreas["PROLOG"]["TRACE"]["QUERY_TIME"]+$arAreas["PROLOG"]["TRACE"]["COMP_QUERY_TIME"], 4)?></b></p>
				<p>
					<?= number_format($arAreas["PROLOG_BEFORE"]["TRACE"]["QUERY_TIME"]+$arAreas["PROLOG_BEFORE"]["TRACE"]["COMP_QUERY_TIME"], 4)?><br>
					<?= number_format($arAreas["PROLOG_AFTER"]["TRACE"]["QUERY_TIME"]+$arAreas["PROLOG_AFTER"]["TRACE"]["COMP_QUERY_TIME"], 4)?><br>
				</p>
			</td>
		<?php endif;?>
		<td>&nbsp;</td>
	</tr>
	<tr valign="top">
		<td>&nbsp;</td>
		<td>
			<?php if($bShowComps):?>
				<p><a style="font-weight:bold !important" href="javascript:jsDebugTimeWindow.ShowDetails('BX_DEBUG_TIME_1_6')"><?=Loc::getMessage("debug_info_work_area")?></a></p>
			<?php else:?>
				<p><b><?=Loc::getMessage("debug_info_work_area")?></b></p>
			<?php endif?>
		</td>
		<td class="number" nowrap><p><b><?= number_format($WORK_AREA/$PAGE*100, 2),"%"?></b></p></td>
		<td class="number" nowrap><p><b><?= number_format($WORK_AREA, 4)?></b></p></td>
		<?php if($bShowComps):?>
			<td class="number" nowrap><b><?= intval($arAreas["WORK_AREA"]["TRACE"]["COMPONENT_COUNT"])?></b></td>
			<td class="number" nowrap><b><?= number_format($arAreas["WORK_AREA"]["TRACE"]["COMPONENT_TIME"], 4)?></b></td>
		<?php endif;
		if($bShowStat):?>
			<td class="number" nowrap><p><b><?= $arAreas["WORK_AREA"]["TRACE"]["QUERY_COUNT"]+$arAreas["WORK_AREA"]["TRACE"]["COMP_QUERY_COUNT"]?></b></p></td>
			<td class="number" nowrap><p><b><?= number_format($arAreas["WORK_AREA"]["TRACE"]["QUERY_TIME"]+$arAreas["WORK_AREA"]["TRACE"]["COMP_QUERY_TIME"], 4)?></b></p></td>
		<?php endif;?>
		<td>&nbsp;</td>
	</tr>
	<tr valign="top">
		<td>&nbsp;</td>
		<td>
			<?php if($bShowComps):?>
				<p><a style="font-weight:bold !important" href="javascript:jsDebugTimeWindow.ShowDetails('BX_DEBUG_TIME_1_7')"><?=Loc::getMessage("debug_info_epilog")?></a></p>
				<p>
					&nbsp;&nbsp;<a href="javascript:jsDebugTimeWindow.ShowDetails('BX_DEBUG_TIME_1_8')"><?=Loc::getMessage("debug_info_epilog_before")?></a><br>
					&nbsp;&nbsp;<a href="javascript:jsDebugTimeWindow.ShowDetails('BX_DEBUG_TIME_1_9')"><?=Loc::getMessage("debug_info_epilog_after")?></a><br>
				</p>
			<?php else:?>
				<p><b><?=Loc::getMessage("debug_info_epilog")?></b></p>
				<p>
					&nbsp;&nbsp;<?=Loc::getMessage("debug_info_epilog_before")?><br>
					&nbsp;&nbsp;<?=Loc::getMessage("debug_info_epilog_after")?><br>
				</p>
			<?php endif?>
		</td>
		<td class="number" nowrap>
			<p><b><?= number_format($EPILOG/$PAGE*100, 2),"%"?></b></p>
			<p>
				<?= number_format($EPILOG_BEFORE/$PAGE*100, 2),"%"?><br>
				<?= number_format($EPILOG_AFTER/$PAGE*100, 2),"%"?><br>
			</p>
		</td>
		<td class="number" nowrap>
			<p><b><?= number_format($EPILOG, 4)?></b></p>
			<p>
				<?= number_format($EPILOG_BEFORE, 4)?><br>
				<?= number_format($EPILOG_AFTER, 4)?><br>
			</p>
		</td>
		<?php if ($bShowComps):?>
			<td class="number" nowrap>
				<p><b><?= intval($arAreas["EPILOG"]["TRACE"]["COMPONENT_COUNT"])?></b></p>
				<p>
					<?= intval($arAreas["EPILOG_BEFORE"]["TRACE"]["COMPONENT_COUNT"])?><br>
					<?= intval($arAreas["EPILOG_AFTER"]["TRACE"]["COMPONENT_COUNT"])?><br>
				</p>
			</td>
			<td class="number" nowrap>
				<p><b><?= number_format($arAreas["EPILOG"]["TRACE"]["COMPONENT_TIME"], 4)?></b></p>
				<p>
					<?= number_format($arAreas["EPILOG_BEFORE"]["TRACE"]["COMPONENT_TIME"], 4)?><br>
					<?= number_format($arAreas["EPILOG_AFTER"]["TRACE"]["COMPONENT_TIME"], 4)?><br>
				</p>
			</td>
		<?php endif;
		if ($bShowStat):?>
			<td class="number" nowrap>
				<p><b><?= $arAreas["EPILOG"]["TRACE"]["QUERY_COUNT"]+$arAreas["EPILOG"]["TRACE"]["COMP_QUERY_COUNT"]?></b></p>
				<p>
					<?= $arAreas["EPILOG_BEFORE"]["TRACE"]["QUERY_COUNT"]+$arAreas["EPILOG_BEFORE"]["TRACE"]["COMP_QUERY_COUNT"]?><br>
					<?= $arAreas["EPILOG_AFTER"]["TRACE"]["QUERY_COUNT"]+$arAreas["EPILOG_AFTER"]["TRACE"]["COMP_QUERY_COUNT"]?><br>
				</p>
			</td>
			<td class="number" nowrap>
				<p><b><?= number_format($arAreas["EPILOG"]["TRACE"]["QUERY_TIME"]+$arAreas["EPILOG"]["TRACE"]["COMP_QUERY_TIME"], 4)?></b></p>
				<p>
					<?= number_format($arAreas["EPILOG_BEFORE"]["TRACE"]["QUERY_TIME"]+$arAreas["EPILOG_BEFORE"]["TRACE"]["COMP_QUERY_TIME"], 4)?><br>
					<?= number_format($arAreas["EPILOG_AFTER"]["TRACE"]["QUERY_TIME"]+$arAreas["EPILOG_AFTER"]["TRACE"]["COMP_QUERY_TIME"], 4)?><br>
				</p>
			</td>
		<?php endif;?>
		<td>&nbsp;</td>
	</tr>
</table>

		</div>
	</div>#DIVIDER#<?php if($bShowComps):?><div class="bx-debug-content bx-debug-content-table"><?php
			foreach ($arAreas as $id => $arArea):
			?><div id="BX_DEBUG_TIME_1_<?= $arArea["NUM"]?>" style="display:none">
				<table cellpadding="0" cellspacing="0" border="0" width="100%"><?php

				$tim = 0;
				foreach ($APPLICATION->arIncludeDebug as $i => $arIncludeDebug)
				{
					if (isset($arIncludeDebug["REL_PATH"]) && in_array($arIncludeDebug["BX_STATE"], $arArea["FLT"]))
					{
						$tim += $arIncludeDebug["TIME"];
					}
				}
				if ($tim > $arArea["TIME"]) $tim = $arArea["TIME"];
				?>
					<tr>
						<td class="number" valign="top">0</td>
						<td><?php
						if($bShowStat):
							?><a title="<?= Loc::getMessage("debug_info_query_title")?>" href="javascript:BX_DEBUG_INFO_<?= $arArea["IND"]?>.Show(); BX_DEBUG_INFO_<?= $arArea['IND']?>.ShowDetails('BX_DEBUG_INFO_<?= $arArea['IND']?>_1');"><?= GetMessage("debug_info_raw_code")?></a><?php
						else:
							echo Loc::getMessage("debug_info_raw_code");
						endif;
						?></td>
						<td>&nbsp;</td>
						<td class="number">&nbsp;<?php
							if($arArea["TRACE"]["CACHE_SIZE"])
								echo CFile::FormatSize($arArea["TRACE"]["CACHE_SIZE"],0);
						?></td>
						<td class="number"><?php if($arArea["TIME"] > 0):?><?= number_format((1-$tim/$arArea["TIME"])*100, 2)?>%<?php endif?></td>
						<td class="number"><?= number_format($arArea["TIME"] - $tim, 4)?> <?= Loc::getMessage("debug_info_sec")?></td>
						<td class="number"><?= intval($arArea["TRACE"]["QUERY_COUNT"])?> <?= Loc::getMessage("debug_info_query_short")?></td>
						<td class="number"><?= number_format($arArea["TRACE"]["QUERY_TIME"], 4)?> <?= Loc::getMessage("debug_info_sec")?></td>
					</tr><?php
					$j = 1;
					$k = 1;
					foreach ($APPLICATION->arIncludeDebug as $i=>$arIncludeDebug):
						if (isset($arIncludeDebug["REL_PATH"]) && in_array($arIncludeDebug["BX_STATE"], $arArea["FLT"])):
						?><tr>
							<td class="number" valign="top"><?= $k?></td>
							<td><?php
							if ($arIncludeDebug["LEVEL"] > 0)
							{
								echo str_repeat("&nbsp;&nbsp;", $arIncludeDebug["LEVEL"]);
							}
						if ($bShowStat):
							?><a title="<?= Loc::getMessage("debug_info_query_title")?>" href="javascript:BX_DEBUG_INFO_<?= $i?>.Show(); BX_DEBUG_INFO_<?= $i?>.ShowDetails('BX_DEBUG_INFO_<?= $i?>_1');"><?= htmlspecialcharsbx($arIncludeDebug["REL_PATH"])?></a><?php
						else:
							echo htmlspecialcharsbx($arIncludeDebug["REL_PATH"]);
						endif;
						?></td>
						<td>&nbsp;<?php
							switch ($arIncludeDebug["CACHE_TYPE"])
							{
								case "N": echo Loc::getMessage("debug_info_cache_off"); break;
								case "Y": echo Loc::getMessage("debug_info_cache_on"); break;
								default: echo Loc::getMessage("debug_info_cache_auto"); break;
							}
						?></td>
						<td class="number" nowrap>&nbsp;<?php
							if ($arIncludeDebug["CACHE_SIZE"])
							{
								echo CFile::FormatSize($arIncludeDebug["CACHE_SIZE"],0);
							}
						?></td>
						<td class="number" nowrap><?php if ($arArea["TIME"] > 0):?><?= number_format($arIncludeDebug["TIME"]/$arArea["TIME"]*100, 2)?>%<?php endif?></td>
						<td class="number" nowrap><?= number_format($arIncludeDebug["TIME"], 4)?> <?= Loc::getMessage("debug_info_sec")?></td>
						<td class="number" nowrap><?= intval($arIncludeDebug["QUERY_COUNT"])?> <?= Loc::getMessage("debug_info_query_short")?></td>
						<td class="number" nowrap><?= number_format($arIncludeDebug["QUERY_TIME"], 4)?> <?= Loc::getMessage("debug_info_sec")?></td>
					</tr><?php
					$k++;
				endif;
				$j++;
				endforeach;
				?></table>
			</div><?php
			endforeach;
		?></div><?php
		endif;

	$obJSPopup->StartButtons();
	$obJSPopup->ShowStandardButtons(['close']);

?></div><?php
	if (
		isset($_GET["show_sql_stat"])
		&& $_GET["show_sql_stat"] === "Y"
		&& isset($_GET["show_page_exec_time"])
		&& $_GET["show_page_exec_time"] === "Y"
		&& isset($_GET["show_sql_stat_immediate"])
		&& $_GET["show_sql_stat_immediate"] === "Y"
		&& preg_match("#/admin/perfmon_hit_list.php#", $_SERVER["HTTP_REFERER"])
	)
	{
		echo "<script>BX.ready(function() {jsDebugTimeWindow.Show(); jsDebugTimeWindow.ShowDetails('BX_DEBUG_TIME_1_1');});</script>";
	}
}
