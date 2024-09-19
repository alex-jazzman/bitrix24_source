<?php

declare(strict_types=1);

namespace Sotbit\RestAPI\Repository\Catalog;

use Fig\Http\Message\StatusCodeInterface as StatusCode;
use Sotbit\RestAPI\Exception\CatalogException,
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

class Catalog extends CatalogRepository
{
    public function get(int $id)
    {
        if($this->getUserId() === null) {
            throw new CatalogException(l::get('EMPTY_USER_ID'), StatusCode::STATUS_UNAUTHORIZED);
        }

        if(!$id) {
            throw new CatalogException(l::get('ERROR_CATALOG_ID_EMPTY'), StatusCode::STATUS_BAD_REQUEST);
        }

        $result = \CCatalog::GetByID($id);
       //$result = \Bitrix\Catalog\CatalogIblockTable::getById($id)->fetch();

        if(!$result) {
            throw new CatalogException(l::get('ERROR_CATALOG_NOT_FOUND'), StatusCode::STATUS_NOT_FOUND);
        }

        return ['data' => $result];
    }

    public function list(array $params)
    {
        $result = [];

        if($this->getUserId() === null) {
            throw new CatalogException(l::get('EMPTY_USER_ID'), StatusCode::STATUS_UNAUTHORIZED);
        }

        $navParams = ['nPageSize' => $params['limit'], 'iNumPage' => $params['page']];
        $catalog = new \CCatalog();

        $r = $catalog::GetList($params['order'], $params['filter'], false, $navParams, $params['select']);
        while ($l = $r->fetch())
        {
            $result['data'][$l['ID']] = $this->prepareReturn($l);
        }

        // count all
        $countAll = $catalog::GetList($params['order'], $params['filter_default'], false, $navParams, $params['select']);

        // info
        $result['info']['count_select'] = count($result);
        $result['info']['count_all'] = (int)$countAll->SelectedRowsCount();


        return $result;
    }

    /**
     * Check offers iblock.
     *
     * @param int $iblockId		Iblock Id.
     * @return bool
     */
    public function offerIblockExist($catalogType)
    {
        return $catalogType === \CCatalogSku::TYPE_FULL || $catalogType === \CCatalogSku::TYPE_PRODUCT;
    }

}
