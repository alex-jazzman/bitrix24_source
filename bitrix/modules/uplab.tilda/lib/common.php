<?php

namespace Uplab\Tilda;

use Bitrix\Main\Localization\Loc;

Loc::loadMessages(__FILE__);

class Common
{
    public static $publickey;
    public static $secretkey;
    public static $module_id = 'uplab.tilda';
    public static $inc = false;
    public static $nojq;

    static function getOptions()
    {
        if (self::$inc) {
            return;
        }
        self::$inc = true;
        self::$publickey = \COption::GetOptionString(self::$module_id, "UPT_PUBLIC_KEY");
        self::$secretkey = \COption::GetOptionString(self::$module_id, "UPT_SECRET_KEY");
        self::$nojq = \COption::GetOptionString(self::$module_id, "UPT_BASE_NOJQ");
    }

    public static function getProjects($unicode = true)
    {
        static $projectsList = false;

        if ($projectsList !== false) {
            return $projectsList;
        }

        self::getOptions();

        $projectsList = Request::getData('getprojectslist');

        if ($projectsList) {
            foreach ($projectsList as &$value) {
                $value['title'] = Helper::convert2Win1251($value['title'], !$unicode);
                $value['descr'] = Helper::convert2Win1251($value['descr'], !$unicode);
                $value['title'] = str_replace(['"', "'"], '', $value['title']);
            }
        }

        return $projectsList;
    }

    public static function getPages($projectId = false, $unicode = true)
    {
        if (empty($projectId)) {
            return [];
        }

        $pagesList = Request::getData('getpageslist', ['projectid' => $projectId]);

        if ($pagesList) {
            foreach ($pagesList as &$value) {
                $value['title'] = Helper::convert2Win1251($value['title'], !$unicode);
                $value['descr'] = Helper::convert2Win1251($value['descr'], !$unicode);
                $value['title'] = str_replace(['"', "'"], '', $value['title']);
            }
        }

        return $pagesList;
    }

    public static function getAssocPagesList($projectId = false, $unicode = true)
    {
        if (empty($projectId)) {
            return [
                0 => Loc::getMessage('uplab.tilda_CHECK_PAGE'),
            ];
        }

        $arPages = [];
        $pagesList = self::getPages($projectId, $unicode);

        if ($pagesList) {
            foreach ($pagesList as $page) {
                $arPages[$page['id']] = $page['title'];
            }
        }

        return $arPages;
    }

    public static function getAssocProjectsList()
    {
        $arProjects = [];
        $projectsList = self::getProjects();

        if ($projectsList) {
            foreach ($projectsList as $project) {
                $arProjects[$project['id']] = $project['title'];
            }
        }

        return $arProjects;
    }

    static function getPageContent($page, $params = [])
    {
        $data = Request::getData('getpagefullexport', ['pageid' => $page]);

        $content = '';

        // Include CSS files
        if ($data['css']) {
            foreach ($data['css'] as $value) {
                $url = str_replace("http://tilda.ws/", "//tilda.ws/", $value["from"]);

                $content .= '<link rel="stylesheet" type="text/css" href="' . $url . '">';
            }
        }

        // Include JS files
        if ($data['js']) {
            foreach ($data['js'] as $value) {
                if ((self::$nojq === 'Y' || $params["NOJQ"] === "Y") && strripos($value["to"], "jquery") !== false) {
                    continue;
                }

                $url = str_replace("http://tilda.ws/", "//tilda.ws/", $value["from"]);

                $content .= '<script type="text/javascript" src="' . $url . '"></script>';
            }
        }

        // HTML
        $matches = [];
        preg_match_all('/<!--allrecords-->(.*)<!--\/allrecords-->/s', $data['html'], $matches, PREG_SET_ORDER);
        $html = Helper::convert2Win1251($matches[0][1]);

        // Images + CSS + JS
        $assetsTypes = ['images', 'css', 'js'];

        $assets = [];
        $i = 0;

        // Replace resources with tags
        foreach ($assetsTypes as $type) {
            foreach ($data[$type] as $asset) {
                $i++;
                $tag = "*T_{$type}_$i*";

                $resourceAbsolutePath = str_replace("http://tilda.ws/", "//tilda.ws/", $asset["from"]);

                $assets[$tag] = $resourceAbsolutePath;

                $html = str_replace($asset['to'], $tag, $html);
            }
        }

        // Replace tags with resources absolute path
        foreach ($assets as $tag => $value) {
            $html = str_replace($tag, $value, $html);
        }

        $content .= $html;

        // Include page content
        $module_version = "";
        if ($info = \CModule::CreateModuleObject(self::$module_id)) {
            $module_version = $info->MODULE_VERSION;
        }

        $content = "<!--<TILDA ver=\"{$module_version}\">-->" . $content . "<!--</TILDA>-->";

        Helper::checkEventBeforeContentReplace($content);

        return $content;
    }

    static function getPageFullContent($page)
    {
        $data = Request::getData('getpagefullexport', ['pageid' => $page]);

        $content = '';

        // HTML
        $content .= Helper::convert2Win1251($data['html']);

        // Images + CSS + JS
        $assetsTypes = ['images', 'css', 'js'];

        $assets = [];
        $i = 0;

        // Replace resources with tags
        foreach ($assetsTypes as $type) {
            foreach ($data[$type] as $asset) {
                $i++;
                $tag = "*T_{$type}_$i*";

                $resourceAbsolutePath = str_replace("http://tilda.ws/", "//tilda.ws/", $asset["from"]);

                $assets[$tag] = $resourceAbsolutePath;

                $content = str_replace($asset['to'], $tag, $content);
            }
        }

        // Replace tags with resources absolute path
        foreach ($assets as $tag => $value) {
            $content = str_replace($tag, $value, $content);
        }

        Helper::checkEventBeforeContentReplace($content);

        return $content;
    }
}
