<?php

namespace Uplab\Tilda;

use Bitrix\Main\Localization\Loc;
use Bitrix\Main\Config\Option;

class Request
{
    public static function makeRequest($url)
    {
        $connectTimeout = (int)Option::get("uplab.tilda", "UPT_CURLOPT_CONNECTTIMEOUT");
        $timeout = (int)Option::get("uplab.tilda", "UPT_CURLOPT_TIMEOUT");

        if (function_exists('curl_init')) {
            $options = [
                CURLOPT_CUSTOMREQUEST  => 'GET',
                CURLOPT_POST           => false,
                CURLOPT_USERAGENT      => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/73.0.3683.103 Safari/537.36',
                CURLOPT_COOKIEFILE     => $_SERVER['DOCUMENT_ROOT'] . '/upload/tilda_cookie.txt',
                CURLOPT_COOKIEJAR      => $_SERVER['DOCUMENT_ROOT'] . '/upload/tilda_cookie.txt',
                CURLOPT_RETURNTRANSFER => true,
                CURLOPT_HEADER         => false,
                CURLOPT_FOLLOWLOCATION => true,
                CURLOPT_ENCODING       => '',
                CURLOPT_AUTOREFERER    => true,
                CURLOPT_CONNECTTIMEOUT => ($connectTimeout >= 0) ? $connectTimeout : 15,
                CURLOPT_TIMEOUT        => $timeout > 1 ? $timeout : 15,
                CURLOPT_MAXREDIRS      => 10,
            ];

            $curl = curl_init($url);
            curl_setopt_array($curl, $options);

            $content = curl_exec($curl);

            if ($errorNumber = curl_errno($curl)) {
                $errorMsg = curl_error($curl);
                $errorMsg2 = curl_strerror($errorNumber);

                Helper::notifyError(Loc::getMessage('uplab.tilda_ERROR_CURL') . $errorMsg . ' (' . $errorMsg2 . ') (' . $errorNumber . ')');

                $content = false;
            }

            curl_close($curl);
        } else {
            $content = file_get_contents($url);

            if ($content === false) {
                Helper::notifyError(Loc::getMessage('uplab.tilda_ERROR_FGC'));
            }
        }

        return $content;
    }

    public static function getData($method = null, $params = [])
    {
        if ($method === null) {
            return false;
        }

        Common::getOptions();

        $paramsStr = '';

        if (!empty($params)) {
            foreach ($params as $key => $value) {
                $paramsStr .= '&' . $key . '=' . $value;
            }
        }

        $url = 'https://api.tildacdn.info/v1/' . $method . '/?publickey=' . Common::$publickey . '&secretkey=' . Common::$secretkey . $paramsStr;

        $cacheId = md5($url);
        $cacheDir = "/$method/";
        $noteInBase = false;

        // ��� ������� � ��������� ���������� + ������� � ����
        if ($method === 'getpageexport' ||
            $method === 'getpagefullexport') {
            $cacheDir = "/$cacheId/";
            $noteInBase = true;
        }

        return Cache::cache($url, $cacheId, $cacheDir, $noteInBase);
    }

}
