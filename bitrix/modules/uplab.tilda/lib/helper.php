<?php

namespace Uplab\Tilda;

use Bitrix\Main\Localization\Loc;

Loc::loadMessages(__FILE__);

class Helper
{
	public static function convert2Win1251($string, $skip = false)
	{
		return (!defined("BX_UTF") && !$skip) ?
			iconv("UTF-8", "windows-1251//IGNORE", $string) :
			$string;
	}

	public static function removeCommentedCode(&$content)
	{
		$pattern = "~<!--UTilda-->([\s\S]*?)<!--EndUTilda-->~im";
		$matches = array();

		preg_match_all(
			$pattern,
			$content,
			$matches,
			PREG_SET_ORDER
		);

		foreach ($matches as $match) {
			$content = str_replace($match[0], "<!--TILDA_COMMENT_REMOVED-->", $content);
		}
	}

	/**
	 * Запускает обработчики события "onBeforeContentReplace" на выполнение, при их наличии
	 */
	public static function checkEventBeforeContentReplace(&$content)
	{
		$rsEvents = GetModuleEvents("uplab.tilda", "onBeforeContentReplace");

		while ($arEvent = $rsEvents->Fetch()) {
			ExecuteModuleEventEx($arEvent, [&$content]);
		}
	}

	public static function notifyError($message)
	{
		// Показать уведомление
		\CAdminNotify::Add([
			'NOTIFY_TYPE'  => \CAdminNotify::TYPE_ERROR,
			'MESSAGE'      => Loc::getMessage('uplab.tilda_ERROR_REQUEST', ['#MESSAGE#' => $message]),
			'TAG'          => Common::$module_id . 'error' . md5($message),
			'MODULE_ID'    => Common::$module_id,
			'ENABLE_CLOSE' => 'Y'
		]);

		// Записать в журнал
		\CEventLog::Add(array(
			'SEVERITY' => 'ERROR',
			'AUDIT_TYPE_ID' => 'UPLAB_TILDA_DATA',
			'MODULE_ID' => Common::$module_id,
			'ITEM_ID' => Common::$module_id,
			'DESCRIPTION' => $message,
		));
	}
}