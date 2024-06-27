<?

use MyWebstor\Hms\Integration\UI\EntitySelector\ClinicProvider;
use MyWebstor\Hms\Integration\UI\EntitySelector\DoctorProvider;
use MyWebstor\Hms\Integration\UI\EntitySelector\OfficeProvider;
use MyWebstor\Hms\Integration\UI\EntitySelector\ShiftWorkProvider;
use MyWebstor\Hms\Integration\UI\EntitySelector\FillingMethodProvider;
use MyWebstor\Hms\Integration\UI\EntitySelector\ProductProvider;
use MyWebstor\Hms\Integration\UI\EntitySelector\ReceiveTypeProvider;
use MyWebstor\Hms\Integration\UI\EntitySelector\SectionProvider;
use MyWebstor\Hms\Integration\UI\EntitySelector\SpecializationProvider;
use MyWebstor\Hms\Integration\UI\EntitySelector\VhiServiceTypeProvider;
use MyWebstor\Hms\Integration\UI\EntitySelector\VhiStorageProvider;
use MyWebstor\Hms\Integration\UI\EntitySelector\VhiTypeProvider;

return array(
    "controllers" => array(
        "value" => array(
            "defaultNamespace" => "\\MyWebstor\\Hms\\Controller",
            "namespaces" => array(
                "\\MyWebstor\\Hms\\Controller\\Entity" => "entity",
                "\\MyWebstor\\Hms\\Controller\\DocumentGenerator" => "documentgenerator",
            )
        ),
        "readonly" => true,
    ),
    "ui.entity-selector" => array(
        "value" => array(
            "entities" => array(
                array(
                    "entityId" => "hms-office",
                    "provider" => array(
                        "moduleId" => "mywebstor.hms",
                        "className" => OfficeProvider::class,
                    )
                ),
                array(
                    "entityId" => "hms-clinic",
                    "provider" => array(
                        "moduleId" => "mywebstor.hms",
                        "className" => ClinicProvider::class,
                    )
                ),
                array(
                    "entityId" => "hms-doctor",
                    "provider" => array(
                        "moduleId" => "mywebstor.hms",
                        "className" => DoctorProvider::class,
                    )
                ),
                array(
                    "entityId" => "hms-shift-work",
                    "provider" => array(
                        "moduleId" => "mywebstor.hms",
                        "className" => ShiftWorkProvider::class,
                    )
                ),
                array(
                    "entityId" => "hms-filling-method",
                    "provider" => array(
                        "moduleId" => "mywebstor.hms",
                        "className" => FillingMethodProvider::class,
                    )
                ),
                array(
                    "entityId" => "hms-section",
                    "provider" => array(
                        "moduleId" => "mywebstor.hms",
                        "className" => SectionProvider::class,
                    )
                ),
                array(
                    "entityId" => "hms-product",
                    "provider" => array(
                        "moduleId" => "mywebstor.hms",
                        "className" => ProductProvider::class,
                    )
                ),
                array(
                    "entityId" => "hms-specialization",
                    "provider" => array(
                        "moduleId" => "mywebstor.hms",
                        "className" => SpecializationProvider::class,
                    )
                ),
                array(
                    "entityId" => "hms-vhi-type",
                    "provider" => array(
                        "moduleId" => "mywebstor.hms",
                        "className" => VhiTypeProvider::class,
                    )
                ),
                array(
                    "entityId" => "hms-vhi-service-type",
                    "provider" => array(
                        "moduleId" => "mywebstor.hms",
                        "className" => VhiServiceTypeProvider::class,
                    )
                ),
                array(
                    "entityId" => "hms-vhi-storage",
                    "provider" => array(
                        "moduleId" => "mywebstor.hms",
                        "className" => VhiStorageProvider::class,
                    )
                ),
                array(
                    "entityId" => "hms-receive-type",
                    "provider" => array(
                        "moduleId" => "mywebstor.hms",
                        "className" => ReceiveTypeProvider::class,
                    )
                ),
            ),
            "extensions" => array(
                "mywebstor.hms.entity-selector"
            ),
        ),
        "readonly" => true
    )
);
