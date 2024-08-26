<?

namespace Uplab\Tilda;

use CJSCore;
use Bitrix\Main\Localization\Loc;

Loc::loadMessages(__FILE__);

class Events
{
	public static function beforeHTMLEditorScriptRuns()
	{
		CJSCore::RegisterExt(
			'uplab_tilda_visual',
			array(
				'js'   => array(
					'/bitrix/js/uplab.tilda/visual.js',
				),
				'css'  => array(
					'/bitrix/js/fileman/comp_params_manager/component_params_manager.css',
					'/bitrix/css/uplab.tilda/visual.css'
				),
				'lang' => '/bitrix/modules/uplab.tilda/lang/' . LANGUAGE_ID . '/install/js/visual.php',
			)
		);

		CJSCore::Init(
			array(
				'jquery',
				'uplab_tilda_visual'
			)
		);
	}

	public static function onEventLogGetAuditTypes()
	{
		return array('UPLAB_TILDA_DATA' => Loc::getMessage('uplab.tilda_ERROR_DATA'));
	}
}