<?php
use Bitrix\Main\Localization\Loc;
require __DIR__.'/../vendor/autoload.php';
try {

    $return = '';
    $returnRoutes = [];
    $core = new Sotbit\RestAPI\Core\Core();
    $core->initConstants();
    $app = new \Slim\App();
    $container = $app->getContainer();
    require __DIR__ . '/../app/dependencies.php';
    require __DIR__ . '/../app/repositories.php';
    require __DIR__ . '/../app/events.php';
    require __DIR__ . '/../app/routes.php';

    $routes = $app->getContainer()->router->getRoutes();
    foreach ($routes as $route) {
        $returnRoutes[] = [
            'data' => [
                'PATTERN' => $route->getPattern(),
                'METHOD' => implode(', ', $route->getMethods()),
            ]
        ];
    }
    if($returnRoutes) {
        ob_start();
        $list = $APPLICATION->IncludeComponent('bitrix:main.ui.grid', '', [
            'GRID_ID' => 'report_list',
            'COLUMNS' => [
                ['id' => 'PATTERN', 'name' => Loc::getMessage($moduleId.'_ROUTE_MAP_PATTERN'), 'sort' => 'PATTERN', 'default' => true],
                ['id' => 'METHOD', 'name' => Loc::getMessage($moduleId.'_ROUTE_MAP_METHOD'), 'sort' => 'METHOD', 'default' => true],
            ],
            'ROWS' => $returnRoutes,
            'SHOW_ROW_CHECKBOXES' => false,
            'AJAX_OPTION_JUMP'          => 'N',
            'SHOW_CHECK_ALL_CHECKBOXES' => false,
            'SHOW_ROW_ACTIONS_MENU'     => false,
            'SHOW_GRID_SETTINGS_MENU'   => false,
            'SHOW_NAVIGATION_PANEL'     => false,
            'SHOW_PAGINATION'           => false,
            'SHOW_SELECTED_COUNTER'     => false,
            'SHOW_TOTAL_COUNTER'        => false,
            'SHOW_PAGESIZE'             => false,
            'SHOW_ACTION_PANEL'         => false,
            'ACTION_PANEL'              => [
                'GROUPS' => [
                    'TYPE' => [
                        'ITEMS' => [
                        ],
                    ]
                ],
            ],
            'ALLOW_COLUMNS_SORT'        => false,
            'ALLOW_COLUMNS_RESIZE'      => false,
            'ALLOW_HORIZONTAL_SCROLL'   => false,
            'ALLOW_SORT'                => false,
            'ALLOW_PIN_HEADER'          => false,
            'ALLOW_COLUMN_RESIZE'       => true,
            'AJAX_OPTION_HISTORY'       => 'N'
        ]);
        $return = ob_get_contents();
        ob_end_clean();
    }

    return $return;

} catch(\Throwable $e) {
    return $e->getMessage();
}