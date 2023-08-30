<?php

declare(strict_types=1);

namespace Sotbit\RestAPI\Config;

abstract class BaseConfig
{
    /**
     * Catalog data settings
     */
    public const CATALOG_ACTIVE = 'CATALOG_ACTIVE';
    public const CATALOG_ID = 'CATALOG_ID';
    public const CATALOG_TYPE = 'CATALOG_TYPE';
    public const CATALOG_ADD_PICT_PROP = 'CATALOG_ADD_PICT_PROP';
    public const CATALOG_OFFER_ADD_PICT_PROP = 'CATALOG_OFFER_ADD_PICT_PROP';
    public const CATALOG_ADD_PROPERTIES_TO_BASKET = 'CATALOG_ADD_PROPERTIES_TO_BASKET';
    public const CATALOG_PRODUCT_CART_PROPERTIES = 'CATALOG_PRODUCT_CART_PROPERTIES';
    public const CATALOG_OFFERS_CART_PROPERTIES = 'CATALOG_OFFERS_CART_PROPERTIES';
    public const CATALOG_PRICE_CODE = 'CATALOG_PRICE_CODE';
    public const CATALOG_CONVERT_CURRENCY = 'CATALOG_CONVERT_CURRENCY';
    public const CATALOG_CONVERT_CURRENCY_ID = 'CATALOG_CONVERT_CURRENCY_ID';
    public const CATALOG_PRICE_VAT_INCLUDE = 'CATALOG_PRICE_VAT_INCLUDE';

    public const CATALOG_ELEMENT_SORT_FIELD = 'CATALOG_ELEMENT_SORT_FIELD';
    public const CATALOG_ELEMENT_SORT_ORDER = 'CATALOG_ELEMENT_SORT_ORDER';
    public const CATALOG_ELEMENT_SORT_FIELD2 = 'CATALOG_ELEMENT_SORT_FIELD2';
    public const CATALOG_ELEMENT_SORT_ORDER2 = 'CATALOG_ELEMENT_SORT_ORDER2';

    public const CATALOG_DETAIL_OFFERS_FIELD_CODE = 'CATALOG_DETAIL_OFFERS_FIELD_CODE';
    public const CATALOG_DETAIL_OFFERS_PROPERTY_CODE = 'CATALOG_DETAIL_OFFERS_PROPERTY_CODE';
    public const CATALOG_DETAIL_PROPERTY_CODE = 'CATALOG_DETAIL_PROPERTY_CODE';
    public const CATALOG_DETAIL_USE_VOTE_RATING = 'CATALOG_DETAIL_USE_VOTE_RATING';

    public const CATALOG_HIDE_NOT_AVAILABLE = 'CATALOG_HIDE_NOT_AVAILABLE';
    public const CATALOG_HIDE_NOT_AVAILABLE_OFFERS = 'CATALOG_HIDE_NOT_AVAILABLE_OFFERS';

    public const CATALOG_LABEL_PROP = 'CATALOG_LABEL_PROP';
    public const CATALOG_LIST_OFFERS_FIELD_CODE = 'CATALOG_LIST_OFFERS_FIELD_CODE';
    public const CATALOG_LIST_OFFERS_PROPERTY_CODE = 'CATALOG_LIST_OFFERS_PROPERTY_CODE';
    public const CATALOG_LIST_PROPERTY_CODE = 'CATALOG_LIST_PROPERTY_CODE';
    public const CATALOG_MESS_NOT_AVAILABLE = 'CATALOG_MESS_NOT_AVAILABLE';
    public const CATALOG_NO_WORD_LOGIC = 'CATALOG_NO_WORD_LOGIC';
    public const CATALOG_PAGE_ELEMENT_COUNT = 'CATALOG_PAGE_ELEMENT_COUNT';
    public const CATALOG_OFFER_TREE_PROPS = 'CATALOG_OFFER_TREE_PROPS';

    public const CATALOG_PRICE_VAT_SHOW_VALUE = 'CATALOG_PRICE_VAT_SHOW_VALUE';
    public const CATALOG_SEARCH_RESTART = 'CATALOG_SEARCH_RESTART';
    public const CATALOG_SEARCH_PAGE_RESULT_COUNT = 'CATALOG_SEARCH_PAGE_RESULT_COUNT';
    public const CATALOG_SEARCH_USE_SEARCH_RESULT_ORDER = 'CATALOG_SEARCH_USE_SEARCH_RESULT_ORDER';
    public const CATALOG_SHOW_DEACTIVATED = 'CATALOG_SHOW_DEACTIVATED';
    public const CATALOG_SHOW_DISCOUNT_PERCENT = 'CATALOG_SHOW_DISCOUNT_PERCENT';
    public const CATALOG_SHOW_MAX_QUANTITY = 'CATALOG_SHOW_MAX_QUANTITY';
    //public const CATALOG_SHOW_MAX_QUANTITY_TEXT = 'CATALOG_SHOW_MAX_QUANTITY_TEXT';
    public const CATALOG_SHOW_MAX_QUANTITY_INT = 'CATALOG_SHOW_MAX_QUANTITY_INT';
    public const CATALOG_SHOW_MAX_QUANTITY_TEXT_MAX = 'CATALOG_SHOW_MAX_QUANTITY_TEXT_MAX';
    public const CATALOG_SHOW_MAX_QUANTITY_TEXT_MIN = 'CATALOG_SHOW_MAX_QUANTITY_TEXT_MIN';
    public const CATALOG_SHOW_OLD_PRICE = 'CATALOG_SHOW_OLD_PRICE';
    public const CATALOG_SHOW_PRICE_COUNT = 'CATALOG_SHOW_PRICE_COUNT';
    public const CATALOG_USE_LANGUAGE_GUESS = 'CATALOG_USE_LANGUAGE_GUESS';
    public const CATALOG_USE_PRICE_COUNT = 'CATALOG_USE_PRICE_COUNT';


    public const PERSONAL_USER_PROPERTY = 'PERSONAL_USER_PROPERTY';

    protected static $instance;

    protected function __construct()
    {
    }

    /**
     * @return static
     */
    final public static function getInstance()
    {
        if(!isset(static::$instance)) {
            static::$instance = new static();
        }

        return static::$instance;
    }

    /**
     * @return static
     */
    final public static function setInstance($instance)
    {
        static::$instance = new $instance();

        return static::$instance;
    }

    public function getDefaultSettings(): array
    {
        return [
            'catalog.active' => true,
            'catalog.id' => null,
            'catalog.type' => null,
            'catalog.limit' => 50,
            'catalog.sort' => [
                'sort' => 'asc',
                'id' => 'desc',
            ],
            'catalog.vat.included' => false,
            'catalog.prices' => [],
            'catalog.section.properties' => [],
            'catalog.section.properties.offer' => [],
            'catalog.detail.properties' => [],
            'catalog.detail.properties.offer' => [],
            'catalog.offer.treeprops' => [],
            'catalog.search.withoutMorphology' => true,
            'catalog.search.noWordLogic' => true,
            'catalog.search.LanguageGuess' => true,
            'catalog.hideNotAvailable' => true,
            'catalog.hideNotAvailableOffers' => true,
            'catalog.currencyConvert' => false,
            'catalog.morePhotoCode' => ['MORE_PHOTO'],
            'catalog.offer.MorePhotoCode' => ['MORE_PHOTO'],
            'catalog.showDeactivated' => false,
            'sale.basketOfferProperty' => [],
            'sale.showQuantity' => true,
        ];
    }

    final protected static function getClassName()
    {
        return get_called_class();
    }

    private function __clone()
    {
    }

    public function __wakeup()
    {
    }
}