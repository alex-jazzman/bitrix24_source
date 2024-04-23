<?php

declare(strict_types=1);

namespace Sotbit\RestAPI\Repository\Catalog;

use Slim\Http\StatusCode;
use Sotbit\RestAPI\Exception\CatalogException,
    Sotbit\RestAPI\Localisation as l,
    Sotbit\RestAPI\Repository\CatalogRepository;

use Bitrix\Catalog\VatTable;

class Vat extends CatalogRepository
{
    public function __construct()
    {}

    public function get(int $id)
    {
        if($this->getUserId() === null) {
            throw new CatalogException(l::get('EMPTY_USER_ID'), StatusCode::HTTP_UNAUTHORIZED);
        }

        $result = VatTable::getById($id)->fetch();

        if(!$result) {
            throw new CatalogException(l::get('ERROR_CATALOG_VAT_GET'), StatusCode::HTTP_NOT_FOUND);
        }

        return $result;
    }

    public function list(array $params)
    {
        $result = [];
        $data = [];

        //if($this->getUserId() === null) {
        //    throw new CatalogException(l::get('EMPTY_USER_ID'), StatusCode::HTTP_UNAUTHORIZED);
        //}

        $params = $this->prepareNavigationBase($params);

        $iterator = VatTable::getList(
            [
                'select' => $params['select'],
                'filter' => $params['filter'],
                'order'  => $params['order'],
                'limit'  => $params['limit'],
                'offset' => ($params['limit'] * ($params['page'] - 1)),
            ]
        );

        while($r = $iterator->fetch()) {
            $data[$r['ID']] = $r;
        }
        // data
        $result['data'] = $data;

        // info
        $result['info']['count_select'] = count($result);
        //$result['info']['count_all'] = $result->count();


        return $result;
    }

}
