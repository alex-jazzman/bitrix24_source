<?php

declare(strict_types=1);

namespace Sotbit\RestAPI\Repository\Catalog;

use \Slim\Http\StatusCode;
use Sotbit\RestAPI\Exception\CatalogException,
    \Sotbit\RestAPI\Localisation as l,
    \Sotbit\RestAPI\Repository\CatalogRepository;
use \Bitrix\Main\Loader;

class Search extends CatalogRepository
{
    private $searchSettings = [];

    public function __construct()
    {
        parent::__construct();

        if(!Loader::includeModule("search")) {
            throw new CatalogException(l::get('ERROR_MODULE_SEARCH'), StatusCode::STATUS_BAD_REQUEST);
        }
    }

    public function setSettings($params): Search
    {
        $this->searchSettings = $params;
        return $this;
    }

    public function execute(): array
    {
        $searchIds = [];

        if($this->searchSettings['query']) {
            $searchObj = new \CSearch;
            $search = $this->searchSettings['query'];
            $searchConvert = '';

            if($this->searchSettings['guessLanguage']) {
                $arLang = \CSearchLanguage::GuessLanguage($search);
                if(is_array($arLang) && $arLang["from"] != $arLang["to"]) {
                    $searchConvert = \CSearchLanguage::ConvertKeyboardLayout($search, $arLang["from"], $arLang["to"]);
                }
            }

            $query = $searchConvert ? : $search;
            $phrase = \stemming_split($query, LANGUAGE_ID);

            $params = [
                'QUERY'       => $query,
                'SITE_ID'     => SITE_ID,
                'MODULE_ID'   => 'iblock',
                'PARAM2'      => $this->searchSettings['iblockId'],
                'CHECK_DATES' => 'Y',
            ];
            $paramsEx = [];
            $paramsEx['STEMMING'] = $this->searchSettings['withoutMorphology'] ? false : true;

            $searchObj->SetOptions(
                [
                    //"ERROR_ON_EMPTY_STEM" => $this->searchSettings[''],
                    "ERROR_ON_EMPTY_STEM" => false,
                    "NO_WORD_LOGIC"       => $this->searchSettings['noWordLogic'],
                ]
            );

            $searchObj->Search($params, [], $paramsEx);

            while($ar = $searchObj->Fetch()) {
                $searchIds[] = $ar['ITEM_ID'];
            }
        }

        return $searchIds;
    }
}