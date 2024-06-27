<? if (!defined("B_PROLOG_INCLUDED") || B_PROLOG_INCLUDED !== true) die();

return array(
    "settings" => array(
        "entities" => array(
            array(
                "id" => "hms-office",
                "options" => array(
                    "dynamicLoad" => true,
                    "dynamicSearch" => true,
                    "searchFields" => array(),
                ),
            ),
            array(
                "id" => "hms-clinic",
                "options" => array(
                    "dynamicLoad" => true,
                    "dynamicSearch" => true,
                    "searchFields" => array(),
                ),
            ),
            array(
                "id" => "hms-doctor",
                "options" => array(
                    "dynamicLoad" => true,
                    "dynamicSearch" => true,
                    "searchFields" => array(),
                ),
            ),
            array(
                "id" => "hms-shift-work",
                "options" => array(
                    "dynamicLoad" => true,
                    "dynamicSearch" => true,
                    "searchFields" => array(),
                ),
            ),
            array(
                "id" => "hms-filling-method",
                "options" => array(
                    "dynamicLoad" => true,
                    "dynamicSearch" => true,
                    "searchFields" => array(),
                ),
            ),
            array(
                "id" => "hms-section",
                "options" => array(
                    "dynamicLoad" => true,
                    "dynamicSearch" => true,
                    "itemOptions" => array(
                        "default" => array(
                            "avatar" => "/bitrix/js/mywebstor/hms/entity-selector/icon/section.png",
                            "avatarOptions" => array(
                                "borderRadius" => "0"
                            )
                        )
                    ),
                    "searchFields" => array(),
                ),
            ),
            array(
                "id" => "hms-product",
                "options" => array(
                    "dynamicLoad" => true,
                    "dynamicSearch" => true,
                    "itemOptions" => array(
                        "default" => array(
                            "avatar" => "/bitrix/js/mywebstor/hms/entity-selector/icon/product.png",
                            "avatarOptions" => array(
                                "borderRadius" => "0"
                            )
                        )
                    ),
                    "searchFields" => array(),
                ),
            ),
            array(
                "id" => "hms-specialization",
                "options" => array(
                    "dynamicLoad" => true,
                    "dynamicSearch" => true,
                    "searchFields" => array(),
                ),
            ),
            array(
                "id" => "hms-vhi-type",
                "options" => array(
                    "dynamicLoad" => true,
                    "dynamicSearch" => true,
                    "searchFields" => array(),
                ),
            ),
            array(
                "id" => "hms-vhi-service-type",
                "options" => array(
                    "dynamicLoad" => true,
                    "dynamicSearch" => true,
                    "searchFields" => array(),
                ),
            ),
            array(
                "id" => "hms-vhi-storage",
                "options" => array(
                    "dynamicLoad" => true,
                    "dynamicSearch" => true,
                    "searchFields" => array(),
                ),
            ),
            array(
                "id" => "hms-receive-type",
                "options" => array(
                    "dynamicLoad" => true,
                    "dynamicSearch" => true,
                    "searchFields" => array(),
                ),
            ),

            array(
                "id" => "contact",
                "options" => array(
                    "dynamicLoad" => true,
                    "dynamicSearch" => true,
                )
            ),
            array(
                "id" => "company",
                "options" => array(
                    "dynamicLoad" => true,
                    "dynamicSearch" => true,
                )
            ),
        )
    )
);
