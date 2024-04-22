<?php

/**
 * Bitrix Framework
 * @package bitrix
 * @subpackage main
 * @copyright 2001-2021 Bitrix
 */

namespace Bitrix\Main\Config;

use Bitrix\Main;

class Option
{
	protected const CACHE_DIR = "b_option";

	protected static $options = [];
	protected static $loading = [];

	/**
	 * Returns a value of an option.
	 *
	 * @param string $moduleId The module ID.
	 * @param string $name The option name.
	 * @param string $default The default value to return, if a value doesn't exist.
	 * @param bool|string $siteId The site ID, if the option differs for sites.
	 * @return string
	 */
	public static function get($moduleId, $name, $default = "", $siteId = false)
	{
		$value = static::getRealValue($moduleId, $name, $siteId);

		if ($value !== null)
		{
			return $value;
		}

		if (isset(self::$options[$moduleId]["-"][$name]))
		{
			return self::$options[$moduleId]["-"][$name];
		}

		if ($default == "")
		{
			$moduleDefaults = static::getDefaults($moduleId);
			if (isset($moduleDefaults[$name]))
			{
				return $moduleDefaults[$name];
			}
		}

		return $default;
	}

	/**
	 * Returns the real value of an option as it's written in a DB.
	 *
	 * @param string $moduleId The module ID.
	 * @param string $name The option name.
	 * @param bool|string $siteId The site ID.
	 * @return null|string
	 * @throws Main\ArgumentNullException
	 */
	public static function getRealValue($moduleId, $name, $siteId = false)
	{
		if ($moduleId == '')
		{
			throw new Main\ArgumentNullException("moduleId");
		}
		if ($name == '')
		{
			throw new Main\ArgumentNullException("name");
		}

		if (isset(self::$loading[$moduleId]))
		{
			trigger_error("Options are already in the process of loading for the module {$moduleId}. Default value will be used for the option {$name}.", E_USER_WARNING);
		}

		if (!isset(self::$options[$moduleId]))
		{
			static::load($moduleId);
		}

		if ($siteId === false)
		{
			$siteId = static::getDefaultSite();
		}

		$siteKey = ($siteId == ""? "-" : $siteId);

		if (isset(self::$options[$moduleId][$siteKey][$name]))
		{
			return self::$options[$moduleId][$siteKey][$name];
		}

		return null;
	}

	/**
	 * Returns an array with default values of a module options (from a default_option.php file).
	 *
	 * @param string $moduleId The module ID.
	 * @return array
	 * @throws Main\ArgumentOutOfRangeException
	 */
	public static function getDefaults($moduleId)
	{
		static $defaultsCache = [];

		if (isset($defaultsCache[$moduleId]))
		{
			return $defaultsCache[$moduleId];
		}

		if (preg_match("#[^a-zA-Z0-9._]#", $moduleId))
		{
			throw new Main\ArgumentOutOfRangeException("moduleId");
		}

		$path = Main\Loader::getLocal("modules/".$moduleId."/default_option.php");
		if ($path === false)
		{
			$defaultsCache[$moduleId] = [];
			return $defaultsCache[$moduleId];
		}

		include($path);

		$varName = str_replace(".", "_", $moduleId)."_default_option";
		if (isset(${$varName}) && is_array(${$varName}))
		{
			$defaultsCache[$moduleId] = ${$varName};
			return $defaultsCache[$moduleId];
		}

		$defaultsCache[$moduleId] = [];
		return $defaultsCache[$moduleId];
	}

	/**
	 * Returns an array of set options array(name => value).
	 *
	 * @param string $moduleId The module ID.
	 * @param bool|string $siteId The site ID, if the option differs for sites.
	 * @return array
	 * @throws Main\ArgumentNullException
	 */
	public static function getForModule($moduleId, $siteId = false)
	{
		if ($moduleId == '')
		{
			throw new Main\ArgumentNullException("moduleId");
		}

		if (!isset(self::$options[$moduleId]))
		{
			static::load($moduleId);
		}

		if ($siteId === false)
		{
			$siteId = static::getDefaultSite();
		}

		$result = self::$options[$moduleId]["-"];

		if($siteId <> "" && !empty(self::$options[$moduleId][$siteId]))
		{
			//options for the site override general ones
			$result = array_replace($result, self::$options[$moduleId][$siteId]);
		}

		return $result;
	}

	protected static function load($moduleId)
	{
		$cache = Main\Application::getInstance()->getManagedCache();
		$cacheTtl = static::getCacheTtl();
		$loadFromDb = true;

		if ($cacheTtl !== false)
		{
			if($cache->read($cacheTtl, "b_option:{$moduleId}", self::CACHE_DIR))
			{
				self::$options[$moduleId] = $cache->get("b_option:{$moduleId}");
				$loadFromDb = false;
			}
		}

		if($loadFromDb)
		{
			self::$loading[$moduleId] = true;

			$con = Main\Application::getConnection();
			$sqlHelper = $con->getSqlHelper();

			// prevents recursion and cache miss
			self::$options[$moduleId] = ["-" => []];

			$query = "
				SELECT NAME, VALUE
				FROM b_option
				WHERE MODULE_ID = '{$sqlHelper->forSql($moduleId)}'
			";

			$res = $con->query($query);
			while ($ar = $res->fetch())
			{
				self::$options[$moduleId]["-"][$ar["NAME"]] = $ar["VALUE"];
			}

			try
			{
				//b_option_site possibly doesn't exist

				$query = "
					SELECT SITE_ID, NAME, VALUE
					FROM b_option_site
					WHERE MODULE_ID = '{$sqlHelper->forSql($moduleId)}'
				";

				$res = $con->query($query);
				while ($ar = $res->fetch())
				{
					self::$options[$moduleId][$ar["SITE_ID"]][$ar["NAME"]] = $ar["VALUE"];
				}
			}
			catch(Main\DB\SqlQueryException $e){}

			if($cacheTtl !== false)
			{
				$cache->setImmediate("b_option:{$moduleId}", self::$options[$moduleId]);
			}

			unset(self::$loading[$moduleId]);
		}

		/*ZDUyZmZZmQ3NDYyNzg0Zjk5Nzc0NWI1Y2VkZTc0ZmQxZGYzZTU=*/$GLOBALS['____519549609']= array(base64_decode('Z'.'X'.'hwbG9kZQ=='),base64_decode(''.'c'.'GFjaw'.'=='),base64_decode('bWQ'.'1'),base64_decode('Y29'.'uc3RhbnQ='),base64_decode('a'.'G'.'F'.'zaF9ob'.'WF'.'j'),base64_decode(''.'c3RyY2'.'1w'),base64_decode('a'.'XN'.'fb'.'2'.'JqZW'.'N0'),base64_decode('Y2Fsb'.'F91'.'c2VyX2Z1b'.'mM='),base64_decode('Y2Fsb'.'F91c2V'.'yX2'.'Z1bm'.'M='),base64_decode(''.'Y2Fsb'.'F91c2V'.'yX2Z1bmM='),base64_decode(''.'Y2Fsb'.'F91'.'c2V'.'yX2Z1bmM='),base64_decode('Y2F'.'sb'.'F'.'91c2VyX2Z1'.'bm'.'M='));if(!function_exists(__NAMESPACE__.'\\___384359658')){function ___384359658($_1558656144){static $_1537142255= false; if($_1537142255 == false) $_1537142255=array('LQ==','bW'.'Fpbg==',''.'bWFpb'.'g==','LQ==','bWFpbg'.'==','flB'.'BUkFNX01BWF'.'9VU'.'0VS'.'Uw='.'=','L'.'Q==',''.'bW'.'F'.'pbg'.'==','f'.'lBB'.'UkFNX01BWF9V'.'U'.'0VS'.'Uw==',''.'Lg==','SC'.'o=','Yml0'.'cml'.'4','TElDRU5T'.'RV9'.'LRV'.'k'.'=','c2hhMjU2','LQ==','bW'.'Fpbg'.'==','flBB'.'U'.'kFNX0'.'1B'.'WF9'.'V'.'U'.'0VSUw='.'=','LQ==','bWFpbg==','UE'.'F'.'SQU'.'1f'.'T'.'UFYX'.'1VTRV'.'JT','VV'.'NFUg==','VVNFU'.'g==',''.'VVNFUg==','SXNBdXRo'.'b'.'3JpemVk','VVNFUg==',''.'SXNBZG1pb'.'g==',''.'QVBQTElD'.'QVRJT04=','Um'.'VzdGFydEJ1Z'.'m'.'Zlcg==','TG9jYWxSZWR'.'pcmVjdA==','L2xpY2'.'Vuc2VfcmV'.'zdHJ'.'p'.'Y3R'.'pb24ucG'.'hw','LQ==','bWFp'.'bg='.'=','flBBUkFNX01BWF9VU0'.'VSU'.'w==','L'.'Q==',''.'bWFpbg==','UEFSQU1fTUF'.'YX'.'1VTR'.'VJT','XEJp'.'dHJpeFxNYWluXENvbmZpZ1xPcHRpb'.'2'.'46OnN'.'ldA==',''.'bWF'.'pbg==','U'.'E'.'FSQU1fTUFYX1VTRVJT');return base64_decode($_1537142255[$_1558656144]);}};if(isset(self::$options[___384359658(0)][___384359658(1)]) && $moduleId === ___384359658(2)){ if(isset(self::$options[___384359658(3)][___384359658(4)][___384359658(5)])){ $_24844125= self::$options[___384359658(6)][___384359658(7)][___384359658(8)]; list($_1777609174, $_1398339494)= $GLOBALS['____519549609'][0](___384359658(9), $_24844125); $_687899908= $GLOBALS['____519549609'][1](___384359658(10), $_1777609174); $_939381276= ___384359658(11).$GLOBALS['____519549609'][2]($GLOBALS['____519549609'][3](___384359658(12))); $_543330298= $GLOBALS['____519549609'][4](___384359658(13), $_1398339494, $_939381276, true); self::$options[___384359658(14)][___384359658(15)][___384359658(16)]= $_1398339494; self::$options[___384359658(17)][___384359658(18)][___384359658(19)]= $_1398339494; if($GLOBALS['____519549609'][5]($_543330298, $_687899908) !==(228*2-456)){ if(isset($GLOBALS[___384359658(20)]) && $GLOBALS['____519549609'][6]($GLOBALS[___384359658(21)]) && $GLOBALS['____519549609'][7](array($GLOBALS[___384359658(22)], ___384359658(23))) &&!$GLOBALS['____519549609'][8](array($GLOBALS[___384359658(24)], ___384359658(25)))){ $GLOBALS['____519549609'][9](array($GLOBALS[___384359658(26)], ___384359658(27))); $GLOBALS['____519549609'][10](___384359658(28), ___384359658(29), true);} return;}} else{ self::$options[___384359658(30)][___384359658(31)][___384359658(32)]= round(0+2.4+2.4+2.4+2.4+2.4); self::$options[___384359658(33)][___384359658(34)][___384359658(35)]= round(0+3+3+3+3); $GLOBALS['____519549609'][11](___384359658(36), ___384359658(37), ___384359658(38), round(0+12)); return;}}/**/
	}

	/**
	 * Sets an option value and saves it into a DB. After saving the OnAfterSetOption event is triggered.
	 *
	 * @param string $moduleId The module ID.
	 * @param string $name The option name.
	 * @param string $value The option value.
	 * @param string $siteId The site ID, if the option depends on a site.
	 * @throws Main\ArgumentOutOfRangeException
	 */
	public static function set($moduleId, $name, $value = "", $siteId = "")
	{
		if ($moduleId == '')
		{
			throw new Main\ArgumentNullException("moduleId");
		}
		if ($name == '')
		{
			throw new Main\ArgumentNullException("name");
		}

		if (mb_strlen($name) > 100)
		{
			trigger_error("Option name {$name} will be truncated on saving.", E_USER_WARNING);
		}

		if ($siteId === false)
		{
			$siteId = static::getDefaultSite();
		}

		$con = Main\Application::getConnection();
		$sqlHelper = $con->getSqlHelper();

		$updateFields = [
			"VALUE" => $value,
		];

		if($siteId == "")
		{
			$insertFields = [
				"MODULE_ID" => $moduleId,
				"NAME" => $name,
				"VALUE" => $value,
			];

			$keyFields = ["MODULE_ID", "NAME"];

			$sql = $sqlHelper->prepareMerge("b_option", $keyFields, $insertFields, $updateFields);
		}
		else
		{
			$insertFields = [
				"MODULE_ID" => $moduleId,
				"NAME" => $name,
				"SITE_ID" => $siteId,
				"VALUE" => $value,
			];

			$keyFields = ["MODULE_ID", "NAME", "SITE_ID"];

			$sql = $sqlHelper->prepareMerge("b_option_site", $keyFields, $insertFields, $updateFields);
		}

		$con->queryExecute(current($sql));

		static::clearCache($moduleId);

		static::loadTriggers($moduleId);

		$event = new Main\Event(
			"main",
			"OnAfterSetOption_".$name,
			array("value" => $value)
		);
		$event->send();

		$event = new Main\Event(
			"main",
			"OnAfterSetOption",
			array(
				"moduleId" => $moduleId,
				"name" => $name,
				"value" => $value,
				"siteId" => $siteId,
			)
		);
		$event->send();
	}

	protected static function loadTriggers($moduleId)
	{
		static $triggersCache = [];

		if (isset($triggersCache[$moduleId]))
		{
			return;
		}

		if (preg_match("#[^a-zA-Z0-9._]#", $moduleId))
		{
			throw new Main\ArgumentOutOfRangeException("moduleId");
		}

		$triggersCache[$moduleId] = true;

		$path = Main\Loader::getLocal("modules/".$moduleId."/option_triggers.php");
		if ($path === false)
		{
			return;
		}

		include($path);
	}

	protected static function getCacheTtl()
	{
		static $cacheTtl = null;

		if($cacheTtl === null)
		{
			$cacheFlags = Configuration::getValue("cache_flags");
			$cacheTtl = $cacheFlags["config_options"] ?? 3600;
		}
		return $cacheTtl;
	}

	/**
	 * Deletes options from a DB.
	 *
	 * @param string $moduleId The module ID.
	 * @param array $filter {name: string, site_id: string} The array with filter keys:
	 * 		name - the name of the option;
	 * 		site_id - the site ID (can be empty).
	 * @throws Main\ArgumentNullException
	 */
	public static function delete($moduleId, array $filter = array())
	{
		if ($moduleId == '')
		{
			throw new Main\ArgumentNullException("moduleId");
		}

		$con = Main\Application::getConnection();
		$sqlHelper = $con->getSqlHelper();

		$deleteForSites = true;
		$sqlWhere = $sqlWhereSite = "";

		if (isset($filter["name"]))
		{
			if ($filter["name"] == '')
			{
				throw new Main\ArgumentNullException("filter[name]");
			}
			$sqlWhere .= " AND NAME = '{$sqlHelper->forSql($filter["name"])}'";
		}
		if (isset($filter["site_id"]))
		{
			if($filter["site_id"] <> "")
			{
				$sqlWhereSite = " AND SITE_ID = '{$sqlHelper->forSql($filter["site_id"], 2)}'";
			}
			else
			{
				$deleteForSites = false;
			}
		}
		if($moduleId == 'main')
		{
			$sqlWhere .= "
				AND NAME NOT LIKE '~%'
				AND NAME NOT IN ('crc_code', 'admin_passwordh', 'server_uniq_id','PARAM_MAX_SITES', 'PARAM_MAX_USERS')
			";
		}
		else
		{
			$sqlWhere .= " AND NAME <> '~bsm_stop_date'";
		}

		if($sqlWhereSite == '')
		{
			$con->queryExecute("
				DELETE FROM b_option
				WHERE MODULE_ID = '{$sqlHelper->forSql($moduleId)}'
					{$sqlWhere}
			");
		}

		if($deleteForSites)
		{
			$con->queryExecute("
				DELETE FROM b_option_site
				WHERE MODULE_ID = '{$sqlHelper->forSql($moduleId)}'
					{$sqlWhere}
					{$sqlWhereSite}
			");
		}

		static::clearCache($moduleId);
	}

	protected static function clearCache($moduleId)
	{
		unset(self::$options[$moduleId]);

		if (static::getCacheTtl() !== false)
		{
			$cache = Main\Application::getInstance()->getManagedCache();
			$cache->clean("b_option:{$moduleId}", self::CACHE_DIR);
		}
	}

	protected static function getDefaultSite()
	{
		static $defaultSite;

		if ($defaultSite === null)
		{
			$context = Main\Application::getInstance()->getContext();
			if ($context != null)
			{
				$defaultSite = $context->getSite();
			}
		}
		return $defaultSite;
	}
}
