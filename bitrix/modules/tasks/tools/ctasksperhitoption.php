<?php

class CTasksPerHitOption
{
	public static function set($moduleId, $optionName, $value)
	{
		self::managePerHitOptions('write', $moduleId, $optionName, $value);
	}


	public static function get($moduleId, $optionName)
	{
		return (self::managePerHitOptions('read', $moduleId, $optionName));
	}


	public static function getHitTimestamp()
	{
		static $t = null;

		if ($t === null)
			$t = time();

		return ($t);
	}


	private static function managePerHitOptions($operation, $moduleId, $optionName, $value = null)
	{
		static $arOptions = array();

		$oName = $moduleId . '::' . $optionName;

		if ( ! array_key_exists($oName, $arOptions) )
			$arOptions[$oName] = null;

		$rc = null;

		if ($operation === 'read')
			$rc = $arOptions[$oName];
		elseif ($operation === 'write')
			$arOptions[$oName] = $value;
		else
			CTaskAssert::assert(false);

		return ($rc);
	}
}