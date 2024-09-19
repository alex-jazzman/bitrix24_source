<?php

declare(strict_types=1);

namespace Sotbit\RestAPI\Repository;

use Bitrix\Iblock\Model\PropertyFeature;
use Bitrix\Main\Context;
use Bitrix\Currency;
use Sotbit\RestAPI\Config\Config;
use Sotbit\RestAPI\Core\Helper;
use Sotbit\RestAPI\Core;
use Sotbit\RestAPI\Localisation as l;

abstract class BaseRepository
{
    public Config $config;
    public $siteId;
    protected $userId;

    /**
     * Default limit of messages per page
     */
    public const DEFAULT_LIMIT_PAGE = 50;

    public const IMAGE_PREVIEW = 200;
    public const TYPE_LIST = 'list';
    public const TYPE_DETAIL = 'detail';

    //public const IMAGE_NOT_FOUND = '/bitrix/components/bitrix/catalog.section/templates/.default/images/no_photo.png';
    public const IMAGE_NOT_FOUND = null;


    public function __construct()
    {
        $this
            ->setConfig(Config::getInstance())
            ->setSiteId();
    }

    public function getConfig()
    {
        return $this->config;
    }

    public function setConfig($config)
    {
        $this->config = Config::getInstance();
        return $this;
    }


    /**
     * @return mixed
     */
    public function setSiteId()
    {
        $this->siteId = Context::getCurrent()->getSite();
    }

    /**
     * @return mixed
     */
    public function getSiteId()
    {
        return $this->siteId;
    }

    /**
     * @return mixed
     */
    public function getUserId()
    {
        return $this->userId ? (int)$this->userId : null;
    }

    /**
     * @param  mixed  $userId
     */
    public function setUserId($userId)
    {
        $this->userId = $userId;

        return $this;
    }

    public function isPropertyFeature()
    {
        if(class_exists(PropertyFeature::class)) {
            return PropertyFeature::isEnabledFeatures();
        }

        return false;
    }

    protected function prepareNavigationBase(array $params): array
    {
        $result = [];
        $filter = [];
        if(is_array($params['filter'])) {
            $filter = array_map(
                function($v) {
                    return $this->prepareVariable($v);
                },
                $params['filter']
            );
        }

        $result['select'] = (array)($params['select'] ? $this->prepareVariable($params['select']) : ['*']);
        $result['page'] = (int)(is_numeric($params['page']) && $params['page'] > 0 ? $params['page']
            : 1);
        $result['limit'] = (int)(is_numeric($params['limit']) && $params['limit'] > 0 && $params['limit'] < self::DEFAULT_LIMIT_PAGE ? $params['limit']
            : self::DEFAULT_LIMIT_PAGE);
        $result['order'] = (array)($params['order'] ?? ['ID' => 'DESC']);
        $result['filter'] = (array)$filter;

        return $result;
    }


    protected function prepareNavigation(array $params): array
    {
        $filter = [];
        if(is_array($params['filter'])) {
            $filter = array_map(
                function($v) {
                    return $this->prepareVariable($v);
                },
                $params['filter']
            );


            $filter = array_merge(
                $filter,
                ['USER_ID' => $params['user_id']]
            );
        } else {
            $filter['USER_ID'] = $params['user_id'];
        }

        $params['select'] = (array)($params['select'] ? $this->prepareVariable($params['select']) : ['*']);
        $params['page'] = (int)(is_numeric($params['page']) && $params['page'] > 0 ? $params['page']
            : 1);
        $params['limit'] = (int)(is_numeric($params['limit']) && $params['limit'] > 0 && $params['limit'] < self::DEFAULT_LIMIT_PAGE ? $params['limit']
            : self::DEFAULT_LIMIT_PAGE);
        $params['order'] = (array)($params['order'] ?? ['ID' => 'DESC']);
        $params['filter'] = (array)$filter;

        return $params;
    }

    protected function prepareNavigationSupport(array $params): array
    {
        $filter = [];
        if(is_array($params['filter'])) {
            $filter = array_map(
                function($v) {
                    return Helper::convertEncodingToSite(str_replace(',', '|', $v));
                },
                $params['filter']
            );


            $filter = array_merge(
                $filter,
                ['USER_ID' => $params['user_id']]
            );
        } else {
            $params['filter']['USER_ID'] = $params['user_id'];
        }

        $params['select'] = (array)($params['select'] ? $this->prepareVariable($params['select']) : ['*']);
        $params['page'] = (int)(is_numeric($params['page']) && $params['page'] > 0 ? $params['page']
            : 1);
        $params['limit'] = (int)(is_numeric($params['limit']) && $params['limit'] > 0 ? $params['limit']
            : self::DEFAULT_LIMIT_PAGE);
        $params['order'] = (array)($params['order'] ?? ['ID' => 'DESC']);
        $params['filter'] = (array)$filter;

        return $params;
    }

    protected function prepareNavigationCatalog(array $params): array
    {

        $return = [];
        $filter = [];
        $filterDefault = ['ACTIVE' => 'Y', 'GLOBAL_ACTIVE' => 'Y', 'ACTIVE_DATE' => 'Y'];

        if($params['user_id']) {
            $filterDefault['CHECK_PERMISSIONS'] = 'Y';
            $filterDefault['MIN_PERMISSION'] = 'R';
            $filterDefault['PERMISSIONS_BY'] = (int)$params['user_id'];
        }

        if(isset($params['filter']['IBLOCK_ID'])) {
            $filterDefault['IBLOCK_ID'] = $params['filter']['IBLOCK_ID'];
        }

        if(is_array($params['filter'])) {
            $filter = array_map(
                function($v) {
                    return $this->prepareVariable($v);
                },
                $params['filter']
            );
        }
        $filter = array_merge($filterDefault, $filter);


        $return['select'] = (array)($params['select'] ? $this->prepareVariable($params['select']) : ['*']);
        $return['page'] = (int)(is_numeric($params['page']) && $params['page'] > 0 ? $params['page']
            : 1);
        $return['limit'] = (int)(is_numeric($params['limit']) && $params['limit'] > 0 ? $params['limit']
            : self::DEFAULT_LIMIT_PAGE);
        $return['order'] = (array)($params['order'] ?? ['ID' => 'DESC']);
        $return['filter'] = (array)$filter;
        $return['filter_default'] = $filterDefault;

        return $return;
    }
    protected function prepareNavigationCatalogProducts(array $params): array
    {
        $return = [];
        $filter = [];
        $filterDefault = ['ACTIVE' => 'Y', 'GLOBAL_ACTIVE' => 'Y', 'ACTIVE_DATE' => 'Y'];
        if(isset($params['filter']['IBLOCK_ID'])) {
            $filterDefault['IBLOCK_ID'] = $params['filter']['IBLOCK_ID'];
        }

        if($params['user_id']) {
            $filterDefault['CHECK_PERMISSIONS'] = 'Y';
            $filterDefault['MIN_PERMISSION'] = 'R';
            $filterDefault['PERMISSIONS_BY'] = (int)$params['user_id'];
        }

        // config
        $params['limit'] =
            (int)(
                is_numeric($params['limit']) && $params['limit'] > 0 ?
                $params['limit']
                : $this->getConfig()->getCatalogLimit() ?? self::DEFAULT_LIMIT_PAGE
            );

        if(empty($params['order'])) {
            $params['order'] = $this->getConfig()->getCatalogSort();
        }


        if(is_array($params['filter'])) {
            $filter = array_map(
                function($v) {
                    return Helper::convertEncodingToSite($v);
                },
                $params['filter']
            );
        }
        $filter = array_merge($filterDefault, $filter);


        $return['select'] = (array)($params['select'] ? $this->prepareVariable($params['select']) : ['*']);
        $return['page'] = (int)(is_numeric($params['page']) && $params['page'] > 0 ? $params['page']
            : 1);
        $return['limit'] = (int)(is_numeric($params['limit']) && $params['limit'] > 0 ? $params['limit']
            : self::DEFAULT_LIMIT_PAGE);
        $return['order'] = (array)($params['order'] ?? ['ID' => 'DESC']);
        $return['filter'] = (array)$filter;
        $return['filter_default'] = $filterDefault;
        $return['search'] = (string)$params['search'];

        return $return;
    }

    protected function prepareNavigationSaleBasket(array $params): array
    {
        $filter = [];
        if(is_array($params['filter'])) {
            $filter = array_map(
                function($v) {
                    return $this->prepareVariable($v);
                },
                $params['filter']
            );


            /*$filter = array_merge(
                $filter,
                ['FUSER_ID' => $params['fuser_id']]
            );*/
        } else {
            //$filter['FUSER_ID'] = $params['fuser_id'];
        }

        $params['select'] = (array)($params['select'] ? $this->prepareVariable($params['select']) : ['*']);
        $params['page'] = (int)(is_numeric($params['page']) && $params['page'] > 0 ? $params['page']
            : 1);
        $params['limit'] = (int)(is_numeric($params['limit']) && $params['limit'] > 0 ? $params['limit']
            : self::DEFAULT_LIMIT_PAGE);
        $params['order'] = (array)($params['order'] ?? ['ID' => 'DESC']);
        $params['filter'] = (array)$filter;

        return $params;
    }

    protected function prepareVariable($value)
    {
        return Helper::convertEncodingToSite(stripos((string)$value, ',') !== false ? explode(',', $value) : $value);
        //return Helper::convertEncodingToSite($value);
    }

    public function getCurrencyFormat(array $currencies): array
    {
        $return = [];

        $separators = \CCurrencyLang::GetSeparators();
        //$defaultFormat = \CCurrencyLang::GetDefaultValues();
        //$defaultFormat['SEPARATOR'] = $separators[$defaultFormat['THOUSANDS_VARIANT']];

        $iterator = Currency\CurrencyLangTable::getList([
            'select' => [
                'CURRENCY',
                'FULL_NAME',
                'FORMAT_STRING',
                'DEC_POINT',
                'THOUSANDS_VARIANT',
                'DECIMALS',
                'THOUSANDS_SEP',
                'HIDE_ZERO',
            ],
            'filter' => [
                '@CURRENCY' => $currencies,
                '=LID' => LANGUAGE_ID,
            ],
        ]);
        while ($row = $iterator->fetch())
        {
            $currencyId = $row['CURRENCY'];
            $row['FULL_NAME'] = (string)$row['FULL_NAME'];
            if ($row['FULL_NAME'] !== '')
            {
                $return[$currencyId]['NAME'] = $row['FULL_NAME'];
            }

            unset($row['FULL_NAME'], $row['CURRENCY']);
            $return[$currencyId] = array_merge(
                $return[$currencyId],
                $row
            );

            if ($row['THOUSANDS_VARIANT'] !== null && isset($separators[$row['THOUSANDS_VARIANT']]))
            {
                $return[$currencyId]['SEPARATOR'] = $separators[$row['THOUSANDS_VARIANT']];
                // if ($row['THOUSANDS_VARIANT'] == Currency\CurrencyClassifier::SEPARATOR_NBSPACE)
                if ($row['THOUSANDS_VARIANT'] === 'B')
                {
                    $return[$currencyId]['SEPARATOR'] = ' ';
                }
            }
            else
            {
                $return[$currencyId]['SEPARATOR'] = $row['THOUSANDS_SEP'];
            }

            //$return[$currencyId] = array_intersect_key($return[$currencyId], array_flip($select));
        }

        return $return;
    }

    public static function getSizeImage(string $type = self::TYPE_LIST)
    {
        if($type === self::TYPE_DETAIL) {
            return \Bitrix\Main\Config\Option::get('iblock', 'detail_image_size', self::IMAGE_PREVIEW);
        }
        return \Bitrix\Main\Config\Option::get('iblock', 'list_image_size', self::IMAGE_PREVIEW);
    }

    public static function getPictureSrc(int $id, $sizePreview = null)
    {
        $image = [];
        if(!$sizePreview) {
            $sizePreview = self::getSizeImage();
        }

        if($id) {
            $imageOriginal = \CFile::GetFileArray($id);

            $imageResize = \CFile::ResizeImageGet(
                $id,
                ["width" => $sizePreview, "height" => $sizePreview]
            );
        }
        if(is_array($imageOriginal)) {
            $image['ORIGINAL'] = $imageOriginal['SRC'];
        }
        if(is_array($imageResize)) {
            $image['RESIZE'] = $imageResize['src'];
        }

        return $image;
    }

    public function showQuantity($quantity, $measureRatio = 1)
    {
        if($this->getConfig()) {
            if($this->getConfig()->getShowQuantity() === 'Y') {
                return $quantity;
            }

            if($this->getConfig()->getShowQuantity() === 'M') {
                if($quantity == 0) {
                    return l::get('QUANTITY_NO');
                }

                if((float)$quantity / $measureRatio >= $this->getConfig()->getShowQuantityInt()) {
                    return $this->getConfig()->getShowQuantityTextMax();
                }

                return $this->getConfig()->getShowQuantityTextMin();
            }
        }

        return null;
    }
}