<?php

namespace Uplab\Tilda;

use Bitrix\Main\Application;

class Replace
{
	static function tagReplace(&$content) {
		$request = Application::getInstance()->getContext()->getRequest();
		if ($request->isAdminSection()) return false;

		// �������� ��� [UPLABTILDA ... ] �� ������� ������
		if (preg_match_all("/\[(UPLABTILDA [^\]]+)\]/", $content, $matches)) {

            if(is_array($matches[1])) {
                foreach($matches[1] as $k => $match) {
                    $content = self::replaceContent($content, $match, $matches[0][$k]);
                }
            } else {
                $content = self::replaceContent($content, $matches[1], $matches[0]);
            }

			// ������ ���� ������
			// jquery 3 .load deprecated
			$content = str_replace("$(window).load(function()", "$(window).on('load', function ()", $content);

			// ������� ��� ����� ������ <!--UTilda--> � <!--EndUTilda-->
			Helper::removeCommentedCode($content);
		}

		return true;
	}

	static function replaceContent($content, $match, $str) {
        // ������ �������� � ����. ��������� ��������� PROJECT, PAGE � HIDEPAGETEMPLATE
        $params = array();
        $explodedParams = preg_split("~(\s|&nbsp;)+~u", $match);
        foreach ($explodedParams as $value) {
            $keyValue = explode('=', $value);
            $keyValue[0] = str_replace("amp;", "", $keyValue[0]);
            $params[$keyValue[0]] = $keyValue[1];
        }

        // ��������
        if (!empty($params['HIDEPAGETEMPLATE']) && $params['HIDEPAGETEMPLATE'] === "Y") {
            $content = Common::getPageFullContent(intval($params['PAGE']));
        } else {
            $html = Common::getPageContent(intval($params['PAGE']), $params);

            $content = str_replace($str, $html, $content);
        }

        return $content;
    }

	static function removeFromIndex($arFields) {
		if ($arFields["MODULE_ID"] === "iblock" ) {

			$arFields["TITLE"] = preg_replace(
				"/\[(UPLABTILDA [^\]]+)\]/",
				"",
				$arFields["TITLE"]
			);

			$arFields["BODY"] = preg_replace(
				"/\[(UPLABTILDA [^\]]+)\]/",
				"",
				$arFields["BODY"]
			);
		}

		return $arFields;
	}
}