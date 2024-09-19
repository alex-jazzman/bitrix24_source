<?php

declare(strict_types=1);

namespace Sotbit\RestAPI\Repository\Catalog;

use Fig\Http\Message\StatusCodeInterface as StatusCode;
use Sotbit\RestAPI\Exception\CatalogException,
    Sotbit\RestAPI\Localisation as l,
    Sotbit\RestAPI\Repository\CatalogRepository;

use Bitrix\Catalog\VatTable;
use Bitrix\Catalog;


class Price extends CatalogRepository
{
    public $pricesType = [];
    public $pricesSelect = [];
    public $priceAccess = [];
    public $priceRounding = [];


    public function get(int $id)
    {
        if($this->getUserId() === null) {
            throw new CatalogException(l::get('EMPTY_USER_ID'), StatusCode::STATUS_UNAUTHORIZED);
        }

        $result = PriceTable::getById($id)->fetch();

        if(!$result) {
            throw new CatalogException(l::get('ERROR_CATALOG_PRICE_GET'), StatusCode::STATUS_NOT_FOUND);
        }

        return $result;
    }

    public function list(array $params): array
    {
        $result = [];
        $data = [];

        if($this->getUserId() === null) {
            throw new CatalogException(l::get('EMPTY_USER_ID'), StatusCode::STATUS_UNAUTHORIZED);
        }

        $params = $this->prepareNavigationBase($params);

        $groupAccess = $this->getGroupAccess();

        $priceTypes = $this->getPricesType();

        $iterator = Catalog\Model\Price::getList(
            [
                'select' => array_merge($params['select'] ?: ['CATALOG_GROUP_ID', 'PRODUCT_ID', 'PRICE', 'CURRENCY', 'QUANTITY_FROM', 'QUANTITY_TO'], ['ID', 'PRODUCT_ID', 'CATALOG_GROUP_ID']),
                'filter' => $params['filter'],
                'order'  => $params['order'],
                'limit'  => $params['limit'],
                'offset' => ($params['limit'] * ($params['page'] - 1)),
            ]
        );

        while($r = $iterator->fetch()) {
            $access = $groupAccess[$r['CATALOG_GROUP_ID']];
            if(
                !isset($access)
                || (isset($access['CAN_ACCESS'], $access['CAN_BUY'])
                    && $access['CAN_ACCESS'] !== 'Y' && $access['CAN_BUY'] !== 'Y')
            ) {
                continue;
            }

            $r['CAN_BUY'] = $access['CAN_BUY'];

            // price name
            if($priceType = $priceTypes[$r['CATALOG_GROUP_ID']]) {
                $r['NAME'] = $priceType['NAME_LANG'] ? : $priceType['NAME'];
            }

            //$data[$r['PRODUCT_ID']][$r['CATALOG_GROUP_ID']][] = $r;
            $data[$r['PRODUCT_ID']][$r['CATALOG_GROUP_ID']] = $r;
        }


        // get discount price
        /*foreach($data as $productId => $priceIds) {
            foreach($priceIds as $priceId => $priceIdData) {


                if (\CIBlockPriceTools::isEnabledCalculationDiscounts()) {
                    \CCatalogDiscountSave::Disable();
                    $arDiscounts = \CCatalogDiscount::GetDiscountByPrice(
                        $priceIdData['ID'],
                        $this->getUserGroups()
                    );
                    \CCatalogDiscountSave::Enable();
                }

                $discountPrice = \CCatalogProduct::CountPriceWithDiscount(
                    $priceIdData['PRICE'],
                    $priceIdData['CURRENCY'],
                    $arDiscounts
                );

                $data[$productId][$priceId]['DISCOUNT_PRICE'] = $discountPrice ?: 0;
            }
        }*/

        // data
        $result['data'] = $data ?: [];

        // info
        $result['info']['count_select'] = count($result) ?: 0;
        //$result['info']['count_all'] = $result->count();


        return $result;
    }

    public function getMinPrice(int $productId, float $quantity = 1, $currency = false, $pricesType = [])
    {
        if($currency) {
            \CCatalogProduct::setUsedCurrency($currency);
        }

        $arPrice = \CCatalogProduct::GetOptimalPrice($productId, $quantity, $this->getUserGroups(), "N", $pricesType);

        if (!$arPrice || count($arPrice) <= 0)
        {
            if ($nearestQuantity = \CCatalogProduct::GetNearestQuantityPrice($productId, $quantity, $this->getUserGroups()))
            {
                $arPrice = \CCatalogProduct::GetOptimalPrice($productId, $nearestQuantity, $this->getUserGroups(), "N", $pricesType);
            }
        }

        if(!empty($arPrice['RESULT_PRICE'])) {
            if(!empty($arPrice['RESULT_PRICE']['BASE_PRICE'])) {
                $arPrice['RESULT_PRICE']['BASE_PRICE_PRINT'] = \CCurrencyLang::CurrencyFormat(
                    $arPrice['RESULT_PRICE']['BASE_PRICE'],
                    $arPrice['RESULT_PRICE']['CURRENCY'],
                    true
                );
            }

            if(!empty($arPrice['RESULT_PRICE']['DISCOUNT_PRICE'])) {
                $arPrice['RESULT_PRICE']['DISCOUNT_PRICE_PRINT'] = \CCurrencyLang::CurrencyFormat(
                    $arPrice['RESULT_PRICE']['DISCOUNT_PRICE'],
                    $arPrice['RESULT_PRICE']['CURRENCY'],
                    true
                );
            }
        }

        return $arPrice['RESULT_PRICE'] ?? [];
    }

    public function getPricesType(): array
    {
        if(!$this->pricesType) {
            $groupAccess = $this->getGroupAccess();

            $priceTypeIterator = Catalog\GroupTable::getList(
                [
                    'select' => ['ID', 'BASE', 'NAME', 'NAME_LANG' => 'CURRENT_LANG.NAME'],
                    'order'  => ['SORT' => 'ASC', 'ID' => 'ASC'],
                ]
            );
            while($priceType = $priceTypeIterator->fetch()) {
                if(
                    !isset($groupAccess[$priceType['ID']])
                    || (isset($groupAccess[$priceType['ID']]['CAN_ACCESS'])
                        && $groupAccess[$priceType['ID']]['CAN_ACCESS'] !== 'Y')
                ) {
                    continue;
                }
                $priceType['ID'] = (int)$priceType['ID'];
                $priceType['NAME_LANG'] = (string)$priceType['NAME_LANG'];
                if(count($this->getPricesSelect()) && !in_array($priceType['NAME'], $this->getPricesSelect(), true)) {
                    continue;
                }

                $this->pricesType[$priceType['ID']] = $priceType;

            }
            unset($priceType, $priceTypeIterator);
        }

        return $this->pricesType;
    }

    public function getRoundingRule(array $params)
    {
        if(!$this->priceRounding) {
            $iterator = Catalog\RoundingTable::getList($params);
            while($roundingRule = $iterator->fetch()) {
                $this->priceRounding[$roundingRule['ID']] = $roundingRule;
            }
        }

        return $this->priceRounding;
    }

    public function getGroupAccess()
    {
        if(!$this->priceAccess) {
            $iterator = Catalog\GroupAccessTable::getList(
                [
                    'select' => ['CATALOG_GROUP_ID', 'ACCESS'],
                    'filter' => [
                        //'=CATALOG_GROUP_ID' => ['CATALOG_GROUP_ID'],
                        '@GROUP_ID' => $this->getUserGroups(),
                    ],
                ]
            );

            $groups = [];
            while($row = $iterator->fetch()) {
                if(!isset($groups[$row['CATALOG_GROUP_ID']])) {
                    $groups[$row['CATALOG_GROUP_ID']]['CAN_ACCESS'] = 'N';
                    $groups[$row['CATALOG_GROUP_ID']]['CAN_BUY'] = 'N';
                }
                if($row['ACCESS'] == Catalog\GroupAccessTable::ACCESS_VIEW) {
                    $groups[$row['CATALOG_GROUP_ID']]['CAN_ACCESS'] = 'Y';
                } elseif($row['ACCESS'] == Catalog\GroupAccessTable::ACCESS_BUY) {
                    $groups[$row['CATALOG_GROUP_ID']]['CAN_BUY'] = 'Y';
                }
            }
            unset($row, $iterator);
            $this->priceAccess = $groups;
        }

        return $this->priceAccess;
    }

    /**
     * @return array
     */
    public function getPricesSelect(): array
    {
        return $this->pricesSelect;
    }

    /**
     * @param  array  $pricesSelect
     */
    public function setPricesSelect(array $pricesSelect): void
    {
        $this->pricesSelect = $pricesSelect;
    }

}
