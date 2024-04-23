<?php

declare(strict_types=1);

namespace Sotbit\RestAPI\Repository\Catalog\ClassExtends;

use \Slim\Http\StatusCode;
use Sotbit\RestAPI\Exception\CatalogException,
    \Sotbit\RestAPI\Localisation as l,
    \Sotbit\RestAPI\Repository\CatalogRepository,
    \Sotbit\RestAPI\Core;
use \Bitrix\Main\Loader;


class BitrixCatalogSmartFilterCustom extends \CBitrixCatalogSmartFilter
{
    public $userId;

    public function setFacet($iblockId)
    {
        $this->facet = new \Bitrix\Iblock\PropertyIndex\Facet($iblockId);
    }

    public function getFacet()
    {
        return $this->facet;
    }

    public function predictIBSectionFetch($id = [])
    {
        if(!is_array($id) || empty($id)) {
            return;
        }

        $arLinkFilter = [
            "ID"                => $id,
            "GLOBAL_ACTIVE"     => "Y",
            "CHECK_PERMISSIONS" => "Y",
            'MIN_PERMISSION'    => 'R',
            'PERMISSIONS_BY'    => $this->userId,
        ];

        $link = \CIBlockSection::GetList(
            [],
            $arLinkFilter,
            false,
            ["ID", "IBLOCK_ID", "NAME", "LEFT_MARGIN", "DEPTH_LEVEL", "CODE"]
        );
        while($sec = $link->Fetch()) {
            $this->cache['G'][$sec['ID']] = $sec;
            $this->cache['G'][$sec['ID']]['DEPTH_NAME'] = str_repeat(".", $sec["DEPTH_LEVEL"]).$sec["NAME"];
        }
        unset($sec);
        unset($link);
    }

    public function predictIBElementFetch($id = [])
    {
        if(!is_array($id) || empty($id)) {
            return;
        }

        $linkFilter = [
            "ID"                => $id,
            "ACTIVE"            => "Y",
            "ACTIVE_DATE"       => "Y",
            "CHECK_PERMISSIONS" => "Y",
            'MIN_PERMISSION'    => 'R',
            'PERMISSIONS_BY'    => $this->userId,
        ];


        $link = \CIBlockElement::GetList([], $linkFilter, false, false, ["ID", "IBLOCK_ID", "NAME", "SORT", "CODE"]);
        while($el = $link->Fetch()) {
            $this->cache['E'][$el['ID']] = $el;
        }
        unset($el);
        unset($link);
    }
}