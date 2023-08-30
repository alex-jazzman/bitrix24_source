<?php

declare(strict_types=1);

namespace Sotbit\RestAPI\Config\Instances;

use Bitrix\Main\SiteTable;
use Bitrix\Main\Config\Option;
use Bitrix\Main\Loader;
use Sotbit\B2bMobile\Options;
use Sotbit\RestAPI\Config;
use Sotbit\RestAPI\Localisation as l;
use Sotbit\RestAPI\Core\Helper;

class B2bmobile extends Config\Config
{
    protected static $b2bMobileSettings;
    
    public function getSettings(): array
    {
        if(static::$b2bMobileSettings) {
            return static::$b2bMobileSettings;
        }

        return static::$b2bMobileSettings = $this->getModuleSettings();
    }

    public function getSetting($key)
    {
        return static::$b2bMobileSettings[$key] ?? $this->getSettings()[$key] ?? null;
    }
    
    public function getModuleSettings()
    {
        return $this->checkModule() ? \Sotbit\B2bMobile\Options::getSettings() : [];
    }

    public function checkModule(): bool
    {
        return Loader::includeModule(\SotbitRestAPI::B2BMOBILE_MODULE_ID)
            && class_exists('\Sotbit\B2bMobile\Options')
            && method_exists(Options::class, 'isModuleActive')
            && method_exists(Options::class, 'getCatalogSettings')
            && \Sotbit\B2bMobile\Options::isModuleActive();
    }


    public function isCatalogActive(): bool
    {
        return $this->getSetting(static::CATALOG_ACTIVE) && $this->getSetting(static::CATALOG_ACTIVE) === 'Y';
    }

    public function getCatalogId()
    {
        return !empty($this->getSetting(static::CATALOG_ID)) ? (int)$this->getSetting(static::CATALOG_ID) : null;
    }

    public function getCatalogType()
    {
        return $this->getSetting(static::CATALOG_TYPE) !== null ? (string)$this->getSetting(static::CATALOG_TYPE) : null;
    }

    public function getCatalogLimit()
    {
        return $this->getSetting(static::CATALOG_PAGE_ELEMENT_COUNT) !== null ? (int)$this->getSetting(static::CATALOG_PAGE_ELEMENT_COUNT) : null;
    }

    public function getCatalogSort(): array
    {
        $sortField = $this->getSetting(static::CATALOG_ELEMENT_SORT_FIELD) ?? 'sort';
        $sortField2 = $this->getSetting(static::CATALOG_ELEMENT_SORT_FIELD2) ?? 'id';
        $sortOrder = $this->getSetting(static::CATALOG_ELEMENT_SORT_ORDER) ?? 'asc';
        $sortOrder2 = $this->getSetting(static::CATALOG_ELEMENT_SORT_ORDER2) ?? 'desc';

        return [
            $sortField => $sortOrder,
            $sortField2 => $sortOrder2,
        ];
    }

    public function isVatIncluded(): bool
    {
        return !empty($this->getSetting(static::CATALOG_PRICE_VAT_INCLUDE))
            && $this->getSetting(static::CATALOG_PRICE_VAT_INCLUDE) === 'Y';
    }

    public function getCatalogPrices()
    {
        return !empty($this->getSetting(static::CATALOG_PRICE_CODE)) ? $this->getSetting(
        static::CATALOG_PRICE_CODE) : [];
    }

    public function getSectionProperties()
    {
        return !empty($this->getSetting(static::CATALOG_LIST_PROPERTY_CODE)) ? $this->getSetting(
        static::CATALOG_LIST_PROPERTY_CODE) : [];
    }

    public function getSectionOfferProperties()
    {
        return !empty($this->getSetting(static::CATALOG_LIST_OFFERS_PROPERTY_CODE)) ? $this->getSetting(
        static::CATALOG_LIST_OFFERS_PROPERTY_CODE) : [];
    }

    public function getDetailProperties()
    {
        $detail = !empty($this->getSetting(static::CATALOG_DETAIL_PROPERTY_CODE)) ? $this->getSetting(
        static::CATALOG_DETAIL_PROPERTY_CODE) : [];
        $morePhoto = !empty($this->getSetting(static::CATALOG_ADD_PICT_PROP))
        && $this->getSetting(static::CATALOG_ADD_PICT_PROP) !== '-' ? $this->getSetting(
        static::CATALOG_ADD_PICT_PROP) : null;

        return $detail && $morePhoto ? array_merge($detail, [$morePhoto]) : $detail;
    }

    public function getDetailOfferProperties()
    {
        $detailOffer = !empty($this->getSetting(static::CATALOG_DETAIL_OFFERS_PROPERTY_CODE))
            ? $this->getSetting(static::CATALOG_DETAIL_OFFERS_PROPERTY_CODE) : [];
        $morePhoto = !empty($this->getSetting(static::CATALOG_ADD_PICT_PROP))
        && $this->getSetting(static::CATALOG_ADD_PICT_PROP) !== '-' ? $this->getSetting(
        static::CATALOG_ADD_PICT_PROP) : null;

        return $morePhoto ? array_merge($detailOffer, [$morePhoto]) : $detailOffer;
    }

    public function getOfferTreeProps()
    {
        return !empty($this->getSetting(static::CATALOG_OFFER_TREE_PROPS)) ? $this->getSetting(
        static::CATALOG_OFFER_TREE_PROPS) : [];
    }


    public function getSearchWithoutMorphology()
    {
        return !empty($this->getSetting(static::CATALOG_SEARCH_RESTART))
            && $this->getSetting(static::CATALOG_SEARCH_RESTART) === 'Y';
    }

    public function getSearchNoWordLogic()
    {
        return !empty($this->getSetting(static::CATALOG_NO_WORD_LOGIC))
            && $this->getSetting(static::CATALOG_NO_WORD_LOGIC) === 'Y';
    }

    public function getSearchLanguageGuess()
    {
        return !empty($this->getSetting(static::CATALOG_USE_LANGUAGE_GUESS))
            && $this->getSetting(static::CATALOG_USE_LANGUAGE_GUESS) === 'Y';
    }

    public function getHideNotAvailable()
    {
        return $this->getSetting(static::CATALOG_HIDE_NOT_AVAILABLE) ?? 'N';
    }

    public function getHideNotAvailableOffers()
    {
        return $this->getSetting(static::CATALOG_HIDE_NOT_AVAILABLE_OFFERS) ?? 'N';
    }


    public function getCurrencyConvert()
    {
        if(
            $this->getSetting(static::CATALOG_CONVERT_CURRENCY) !== null
            && $this->getSetting(
                static::CATALOG_CONVERT_CURRENCY_ID
            ) !== null
            && $this->getSetting(static::CATALOG_CONVERT_CURRENCY) === 'Y'
            && !empty($this->getSetting(static::CATALOG_CONVERT_CURRENCY_ID))
        ) {
            return $this->getSetting(static::CATALOG_CONVERT_CURRENCY_ID);
        }

        return null;
    }


    public function getMorePhotoCode()
    {
        return !empty($this->getSetting(static::CATALOG_ADD_PICT_PROP))
        && $this->getSetting(static::CATALOG_ADD_PICT_PROP) !== '-' ? $this->getSetting(
        static::CATALOG_ADD_PICT_PROP) : null;
    }

    public function getOfferMorePhotoCode()
    {
        return
            !empty($this->getSetting(static::CATALOG_OFFER_ADD_PICT_PROP))
            && $this->getSetting(static::CATALOG_OFFER_ADD_PICT_PROP) !== '-'
                ? $this->getSetting(static::CATALOG_OFFER_ADD_PICT_PROP) : null;
    }

    public function isBasketAddProperty()
    {
        return $this->getSetting(static::CATALOG_ADD_PROPERTIES_TO_BASKET) === null
            || $this->getSetting(static::CATALOG_ADD_PROPERTIES_TO_BASKET) === 'Y';
    }

    public function getBasketProperty()
    {
        return !empty($this->getSetting(static::CATALOG_PRODUCT_CART_PROPERTIES)) ? $this->getSetting(
            static::CATALOG_PRODUCT_CART_PROPERTIES) : [];
    }
    
    
    public function getBasketOfferProperty()
    {
        return !empty($this->getSetting(static::CATALOG_OFFERS_CART_PROPERTIES)) ? $this->getSetting(
            static::CATALOG_OFFERS_CART_PROPERTIES) : [];
    }

    public function getShowQuantity()
    {
        if($this->getSetting(static::CATALOG_SHOW_MAX_QUANTITY) === null
            || $this->getSetting(static::CATALOG_SHOW_MAX_QUANTITY) === 'Y') {
            return 'Y';
        }

        if($this->getSetting(static::CATALOG_SHOW_MAX_QUANTITY) === 'M') {
            return 'M';
        }

        return 'N';
    }

    /*public function getShowQuantityText(): string
    {
        return ($this->getSetting(static::CATALOG_SHOW_MAX_QUANTITY_TEXT) ?? l::get('QUANTITY_TEXT')).' ';
    }*/
    public function getShowQuantityInt(): int
    {
        return (int) ($this->getSetting(static::CATALOG_SHOW_MAX_QUANTITY_INT) ?? l::get('QUANTITY_VALUE'));
    }
    public function getShowQuantityTextMin(): string
    {
        return $this->getSetting(static::CATALOG_SHOW_MAX_QUANTITY_TEXT_MIN) ?? l::get('QUANTITY_MIN');
    }
    public function getShowQuantityTextMax(): string
    {
        return $this->getSetting(static::CATALOG_SHOW_MAX_QUANTITY_TEXT_MAX) ?? l::get('QUANTITY_MAX');
    }

    public function isShowDeactivated()
    {
        return !empty($this->getSetting(static::CATALOG_SHOW_DEACTIVATED))
            && $this->getSetting(static::CATALOG_SHOW_DEACTIVATED) === 'Y';
    }

    public function getPersonalUserProperties()
    {
        $return = [];
        $settings = $this->getSettings();

        foreach($settings as $key => $setting) {
            if($setting && stripos($key, static::PERSONAL_USER_PROPERTY) !== false) {
                $return[$key] = Helper::isJson($setting) ? array_filter(json_decode($setting)) : $setting;
            }
        }

        return $return;
    }
}