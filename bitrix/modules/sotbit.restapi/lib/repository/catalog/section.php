<?php

declare(strict_types=1);

namespace Sotbit\RestAPI\Repository\Catalog;

use Slim\Http\StatusCode;
use Sotbit\RestAPI\Exception\CatalogException;
use Sotbit\RestAPI\Exception\OrderException,
    Sotbit\RestAPI\Core,
    Sotbit\RestAPI\Localisation as l,
    Sotbit\RestAPI\Repository\CatalogRepository;

use Bitrix\Sale,
    Bitrix\Main\Entity,
    Bitrix\Main\Loader,
    Bitrix\Main\Type\DateTime,
    Bitrix\Main\UserTable,
    Bitrix\Sale\Cashbox\CheckManager,
    Bitrix\Main\Config\Option;

class Section extends CatalogRepository
{
    public function get(int $id): array
    {
        $result = [];

        if(!$id) {
            throw new CatalogException(l::get('ERROR_CATALOG_SECTION_ID_EMPTY'), StatusCode::HTTP_BAD_REQUEST);
        }
        if($this->getUserId() === null) {
            throw new CatalogException(l::get('EMPTY_USER_ID'), StatusCode::HTTP_UNAUTHORIZED);
        }

        $result = \CIBlockSection::GetByID($id)->Fetch();

        // check isset
        if(!$result) {
            throw new CatalogException(l::get('ERROR_CATALOG_SECTION_NOT_FOUND'), StatusCode::HTTP_NOT_FOUND);
        }

        $result = $this->prepareReturn($result, self::TYPE_LIST);

        return $result;
    }

    public function list(array $params): array
    {
        $result = [];
        $navParams = ['nPageSize' => $params['limit'], 'iNumPage' => $params['page']];
        $r = \CIBlockSection::GetList($params['order'], $params['filter'], false, $params['select'], $navParams);

        while ($l = $r->fetch()) {
            $result['data'][$l['ID']] = $this->prepareReturn($l, self::TYPE_LIST);
        }

        // count all
        $countAll = \CIBlockSection::GetList([], $params['filter_default'], false, ['ID']);

        // info
        $result['info']['count_select'] = count($result);
        $result['info']['count_all'] = (int)$countAll->SelectedRowsCount();

        return $result;

    }



}
