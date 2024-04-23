<?php

declare(strict_types=1);

namespace Sotbit\RestAPI\Config;

use Bitrix\Main\Context;
use Bitrix\Main\Loader;
use Sotbit\RestAPI\Core\Helper;
use Bitrix\Main\SiteTable;
use Bitrix\Main\Config\Option;
use Bitrix\Catalog\Product\PropertyCatalogFeature;
use Sotbit\RestAPI\Localisation as l;

class Config extends BaseConfig
{
    protected static $settings = null;

    public const TOKEN_EXPIRE = 7 * 24 * 60 * 60;

    public const DEFAULT_LIMIT_PAGE = 50;

    public function getAll(): array
    {
        if(static::$settings) {
            return static::$settings;
        }

        return static::$settings = $this->getModuleSettings();
    }

    public function get($key)
    {
        return static::$settings[$key] ?? $this->getAll()[$key] ?? null;
    }

    public function getModuleSettings()
    {
        $return = Option::getForModule(\SotbitRestAPI::MODULE_ID, /*, (!empty($site) ? $site : SITE_ID)*/);

        if($return['SECRET_KEY'] !== null) {
            unset($return['SECRET_KEY']);
        }

        if(is_array($return)) {
            foreach($return as $k => $v) {
                $return[$k] = ($v && Helper::isJson($v)) ? json_decode($v) : $v;
            }
        }

        if(is_numeric($return['CATALOG_ID']) && Loader::includeModule('catalog')) {
            $return['CATALOG_IS_FEATURE'] = \Bitrix\Iblock\Model\PropertyFeature::isEnabledFeatures();

            // get offer iblock if isset
            $iblockData = \CCatalogSku::GetInfoByIBlock($return['CATALOG_ID']);
            if(!empty($iblockData['IBLOCK_ID'])) {
                $return['CATALOG_OFFER_ID'] = $iblockData['IBLOCK_ID'];
            }


            if($return['IS_FEATURE']) {
                $return['CATALOG_PRODUCT_PROPERTIES'] = PropertyCatalogFeature::getBasketPropertyCodes($return['CATALOG_ID'], ['CODE' => 'Y']);
                $return['CATALOG_DETAIL_PROPERTY_CODE'] = PropertyCatalogFeature::getOfferTreePropertyCodes($return['CATALOG_ID'], ['CODE' => 'Y']);

                if(!empty($return['CATALOG_OFFER_ID'])) {
                    $return['CATALOG_OFFERS_CART_PROPERTIES'] = PropertyCatalogFeature::getBasketPropertyCodes($return['CATALOG_OFFER_ID'], ['CODE' => 'Y']);
                    $return['CATALOG_DETAIL_OFFERS_PROPERTY_CODE'] = PropertyCatalogFeature::getOfferTreePropertyCodes($return['CATALOG_OFFER_ID'], ['CODE' => 'Y']);
                }
            }
        }

        return $return;
    }



    public function set($name, $value /*, $site = ''*/)
    {
        return Option::set(\SotbitRestAPI::MODULE_ID, $name, $value /*, (!empty($site) ? $site : SITE_ID)*/);
    }


    public function isUserAccess(int $userId): bool
    {
        $userGroups = Helper::getUserGroups($userId);
        $assessGroups = $this->get('USER_PERMISSION_GROUP');
        if(!$assessGroups) {
            return true;
        }

        if (is_array($assessGroups) && count(array_intersect($userGroups, $assessGroups))>0) {
            return true;
        }

        return false;
    }
    /**
     * @return string
     */
    public function getRouteMainPath(): string
    {
        $url = $this->get('URL');
        if(empty($url)) {
            $url = \SotbitRestAPI::DEFAULT_PATH;
        }

        return '/'.trim($url, '/');
    }

    /**
     * @return bool
     */
    public function isModuleActive(): bool
    {
        return $this->get('ACTIVE') === 'Y' && PHP_VERSION_ID > 70200;
    }

    /**
     * @return string
     */
    public function getSecretKey(): string
    {
        $secretKey = Option::get(\SotbitRestAPI::MODULE_ID, 'SECRET_KEY');
        if(empty($secretKey)) {
            $secretKey = Helper::generateSecretKey();
            $this->set('SECRET_KEY', $secretKey);
        }

        return $secretKey;
    }

    /**
     * @return string
     */
    public function getTokenExpire(): int
    {
        $tokenExpire = (int)$this->get('TOKEN_EXPIRE');
        if(empty($tokenExpire)) {
            $tokenExpire = self::TOKEN_EXPIRE;
            $this->set('TOKEN_EXPIRE', $tokenExpire);
        }

        return $tokenExpire;
    }

    public function isDebug(): bool
    {
        return $this->get('DEBUG') === 'Y';
    }

    public function isLog(): bool
    {
        return $this->get('LOG') === 'Y';
    }

    public function isCatalogActive(): bool
    {
        return $this->get(static::CATALOG_ACTIVE) && $this->get(static::CATALOG_ACTIVE) === 'Y';
    }

    public function getCatalogId()
    {
        return !empty($this->get(static::CATALOG_ID)) ? (int)$this->get(static::CATALOG_ID) : null;
    }

    public function getCatalogType()
    {
        return $this->get(static::CATALOG_TYPE) !== null ? (string)$this->get(static::CATALOG_TYPE) : null;
    }

    public function getCatalogLimit()
    {
        return $this->get(static::CATALOG_PAGE_ELEMENT_COUNT) !== null ? (int)$this->get(static::CATALOG_PAGE_ELEMENT_COUNT) : null;
    }

    public function getCatalogSort()
    {
        $sortField = $this->get(static::CATALOG_ELEMENT_SORT_FIELD) ?? 'sort';
        $sortField2 = $this->get(static::CATALOG_ELEMENT_SORT_FIELD2) ?? 'id';
        $sortOrder = $this->get(static::CATALOG_ELEMENT_SORT_ORDER) ?? 'asc';
        $sortOrder2 = $this->get(static::CATALOG_ELEMENT_SORT_ORDER2) ?? 'desc';

        return [
            $sortField => $sortOrder,
            $sortField2 => $sortOrder2,
        ];
    }

    public function isVatIncluded()
    {
        return !empty($this->get(static::CATALOG_PRICE_VAT_INCLUDE))
            && $this->get(static::CATALOG_PRICE_VAT_INCLUDE) === 'Y';
    }

    public function getCatalogPrices()
    {
        return !empty($this->get(static::CATALOG_PRICE_CODE)) ? $this->get(
            static::CATALOG_PRICE_CODE) : [];
    }

    public function getSectionProperties()
    {
        return !empty($this->get(static::CATALOG_LIST_PROPERTY_CODE)) ? $this->get(
            static::CATALOG_LIST_PROPERTY_CODE) : [];
    }

    public function getSectionOfferProperties()
    {
        return !empty($this->get(static::CATALOG_LIST_OFFERS_PROPERTY_CODE)) ? $this->get(
            static::CATALOG_LIST_OFFERS_PROPERTY_CODE) : [];
    }

    public function getDetailProperties()
    {
        $detail = !empty($this->get(static::CATALOG_DETAIL_PROPERTY_CODE)) ? $this->get(
            static::CATALOG_DETAIL_PROPERTY_CODE) : [];
        $morePhoto = !empty($this->get(static::CATALOG_ADD_PICT_PROP))
        && $this->get(static::CATALOG_ADD_PICT_PROP) != '-' ? $this->get(
            static::CATALOG_ADD_PICT_PROP) : null;

        return $detail && $morePhoto ? array_merge($detail, [$morePhoto]) : $detail;
    }

    public function getDetailOfferProperties()
    {
        $detailOffer = !empty($this->get(static::CATALOG_DETAIL_OFFERS_PROPERTY_CODE))
            ? $this->get(static::CATALOG_DETAIL_OFFERS_PROPERTY_CODE) : [];
        $morePhoto = !empty($this->get(static::CATALOG_ADD_PICT_PROP))
        && $this->get(static::CATALOG_ADD_PICT_PROP) != '-' ? $this->get(
            static::CATALOG_ADD_PICT_PROP) : null;

        return $morePhoto ? array_merge($detailOffer, [$morePhoto]) : $detailOffer;
    }

    public function getOfferTreeProps()
    {
        return !empty($this->get(static::CATALOG_OFFER_TREE_PROPS)) ? $this->get(
            static::CATALOG_OFFER_TREE_PROPS) : [];
    }


    public function getSearchWithoutMorphology()
    {
        return !empty($this->get(static::CATALOG_SEARCH_RESTART))
            && $this->get(static::CATALOG_SEARCH_RESTART) === 'Y';
    }

    public function getSearchNoWordLogic()
    {
        return !empty($this->get(static::CATALOG_NO_WORD_LOGIC))
            && $this->get(static::CATALOG_NO_WORD_LOGIC) === 'Y';
    }

    public function getSearchLanguageGuess()
    {
        return !empty($this->get(static::CATALOG_USE_LANGUAGE_GUESS))
            && $this->get(static::CATALOG_USE_LANGUAGE_GUESS) === 'Y';
    }

    public function getHideNotAvailable()
    {
        return $this->get(static::CATALOG_HIDE_NOT_AVAILABLE) ?? 'N';
    }

    public function getHideNotAvailableOffers()
    {
        return $this->get(static::CATALOG_HIDE_NOT_AVAILABLE_OFFERS) ?? 'N';
    }


    public function getCurrencyConvert()
    {
        if(
            $this->get(static::CATALOG_CONVERT_CURRENCY) !== null
            && $this->get(
                static::CATALOG_CONVERT_CURRENCY_ID
            ) !== null
            && $this->get(static::CATALOG_CONVERT_CURRENCY) === 'Y'
            && !empty($this->get(static::CATALOG_CONVERT_CURRENCY_ID))
        ) {
            return $this->get(static::CATALOG_CONVERT_CURRENCY_ID);
        }

        return null;
    }


    public function getMorePhotoCode()
    {
        return !empty($this->get(static::CATALOG_ADD_PICT_PROP))
        && $this->get(static::CATALOG_ADD_PICT_PROP) != '-' ? $this->get(
            static::CATALOG_ADD_PICT_PROP) : null;
    }

    public function getOfferMorePhotoCode()
    {
        return
            !empty($this->get(static::CATALOG_OFFER_ADD_PICT_PROP))
            && $this->get(static::CATALOG_OFFER_ADD_PICT_PROP) != '-'
                ? $this->get(static::CATALOG_OFFER_ADD_PICT_PROP) : null;
    }

    public function isBasketAddProperty()
    {
        return $this->get(static::CATALOG_ADD_PROPERTIES_TO_BASKET) === null
            || $this->get(static::CATALOG_ADD_PROPERTIES_TO_BASKET) === 'Y';
    }

    public function getBasketProperty()
    {
        return !empty($this->get(static::CATALOG_PRODUCT_CART_PROPERTIES)) ? $this->get(
            static::CATALOG_PRODUCT_CART_PROPERTIES) : [];
    }

    public function getBasketOfferProperty()
    {
        return !empty($this->get(static::CATALOG_OFFERS_CART_PROPERTIES)) ? $this->get(
            static::CATALOG_OFFERS_CART_PROPERTIES) : [];
    }

    public function getShowQuantity()
    {
        if($this->get(static::CATALOG_SHOW_MAX_QUANTITY) === null
            || $this->get(static::CATALOG_SHOW_MAX_QUANTITY) === 'Y') {
            return 'Y';
        }

        if($this->get(static::CATALOG_SHOW_MAX_QUANTITY) === 'M') {
            return 'M';
        }

        return 'N';
    }

/*    public function getShowQuantityText(): string
    {
        return ($this->get(static::CATALOG_SHOW_MAX_QUANTITY_TEXT) ?? l::get('QUANTITY_TEXT')).' ';
    }*/
    public function getShowQuantityInt(): int
    {
        return (int) ($this->get(static::CATALOG_SHOW_MAX_QUANTITY_INT) ?? l::get('QUANTITY_VALUE'));
    }
    public function getShowQuantityTextMin(): string
    {
        return $this->get(static::CATALOG_SHOW_MAX_QUANTITY_TEXT_MIN) ?? l::get('QUANTITY_MIN');
    }
    public function getShowQuantityTextMax(): string
    {
        return $this->get(static::CATALOG_SHOW_MAX_QUANTITY_TEXT_MAX) ?? l::get('QUANTITY_MAX');
    }

    public function isShowDeactivated()
    {
        return !empty($this->get(static::CATALOG_SHOW_DEACTIVATED))
            && $this->get(static::CATALOG_SHOW_DEACTIVATED) === 'Y';
    }

    public function getPersonalUserProperties()
    {
        return [];
    }
}