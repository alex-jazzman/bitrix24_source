{"version":3,"file":"script.map.js","names":["this","BX","Socialnetwork","exports","main_core_events","main_core","_classPrivateMethodInitSpec","obj","privateSet","_checkPrivateRedeclaration","add","_classPrivateFieldInitSpec","privateMap","value","set","privateCollection","has","TypeError","_classPrivateMethodGet","receiver","fn","_window","WeakMap","_changeNavigation","WeakSet","_changeBreadcrumbsNavigation","Disk","_EventEmitter","babelHelpers","inherits","params","_this","classCallCheck","possibleConstructorReturn","getPrototypeOf","call","assertThisInitialized","writable","setEventNamespace","classPrivateFieldSet","window","classPrivateFieldGet","Event","EventEmitter","subscribe","_changeNavigation2","bind","_changeBreadcrumbsNavigation2","baseEvent","_baseEvent$getCompatD","getCompatData","_baseEvent$getCompatD2","slicedToArray","item","isFolder","emit","titleLink","href","_baseEvent$getCompatD3","_baseEvent$getCompatD4","breadcrumbLink","_templateObject","_templateObject2","_classPrivateMethodInitSpec$1","_checkPrivateRedeclaration$1","_classPrivateMethodGet$1","_renderSvg","DefaultLoader","createClass","key","render","Tag","taggedTemplateLiteral","_renderSvg2","_templateObject$1","CalendarBaseLoader","_DefaultLoader","apply","arguments","_templateObject$2","CalendarScheduleLoader","_templateObject$3","DiscussionsLoader","_templateObject$4","FilesListLoader","_templateObject$5","FilesTileLoader","_templateObject$6","FilesBigTileLoader","_templateObject$7","TasksCalendarLoader","_templateObject$8","TasksGanttLoader","_templateObject$9","TasksKanbanLoader","_templateObject$a","TasksListLoader","_templateObject$b","_classPrivateFieldInitSpec$1","_checkPrivateRedeclaration$2","_pageView","TasksScrumPlanLoader","pageView","_templateObject$c","TasksTimelineLoader","_classPrivateMethodInitSpec$2","_checkPrivateRedeclaration$3","_classPrivateFieldInitSpec$2","_classPrivateMethodGet$2","_pageUrl","_node","_container","_loader","_initLoader","Loader","pageUrl","setLoader","show","container","Dom","addClass","prepend","hide","removeClass","remove","isShown","_initLoader2","_templateObject$d","_classPrivateMethodInitSpec$3","_checkPrivateRedeclaration$4","_classPrivateFieldInitSpec$3","_classPrivateMethodGet$3","_pageId","_pageView$1","_id","_src","_className","_loader$1","_sidePanelManager","_container$1","_node$1","_window$1","_render","_setSrc","_load","_initHacks","_initObserver","_changeLinksTargets","Frame","pageId","id","className","src","SidePanel","Instance","_setSrc2","updateSrcDebounced","Runtime","debounce","updateSrc","renderTo","append","_render2","reload","getFrameNode","getWindow","concat","_load2","uri","Uri","setQueryParams","IFRAME","toString","event","_this2","target","contentWindow","url","URL","location","searchParams","_initHacks2","_changeLinksTargets2","document","body","_initObserver2","registerAnchorListener","_this3","Type","isUndefined","MutationObserver","observer","mutations","forEach","mutation","i","addedNodes","length","observe","childList","subtree","context","list","tagName","isElementNode","toConsumableArray","querySelectorAll","filter","a","_templateObject$e","_classPrivateMethodInitSpec$4","_checkPrivateRedeclaration$5","_classPrivateFieldInitSpec$4","_classPrivateMethodGet$4","_popupId","_workpiece","_containerWithoutOverlay","_overlay","_leftOverlay","_topOverlay","_rightOverlay","_createOverlay","_createPartOfOverlay","_resizeWindow","_getSizes","_getOverlayParams","_resizeOverlay","Overlay","_params","popupId","workpiece","containerWithoutOverlay","_createOverlay2","_resizeWindow2","_getOverlayParams2","_createPartOfOverlay2","left","width","height","top","right","undefined","overlay","cloneNode","_resizeOverlay2","_getSizes2","scrollWidth","documentElement","scrollHeight","Math","max","offsetHeight","clientHeight","_classPrivateMethodGe","_classPrivateMethodGe2","rect","getPosition","style","_classPrivateMethodInitSpec$5","_checkPrivateRedeclaration$6","_classPrivateFieldInitSpec$5","_classPrivateMethodGet$5","_cache","_frame","_disk","_overlays","_popupIds","_blockScroll","_unblockScroll","_initServices","_updateBaseTheme","_getParam","_changeBrowserHistory","_getPageType","_consoleError","Space","Cache","MemoryCache","Map","Set","setParams","_initServices2","renderContentTo","isDomNode","Error","reloadPageContent","pageType","_getPageType2","viewMode","viewSize","fState","_uri$getQueryParam","getQueryParam","isTrashMode","_uri$getQueryParam2","_uri$getQueryParam3","getPath","includes","ajax","runComponentAction","mode","data","userId","_getParam2","groupId","F_STATE","then","response","error","_consoleError2","showOverlay","frameOverlay","_blockScroll2","topOverlay","get","hideOverlay","_unblockScroll2","hideOverlays","querySelector","size","info","getData","removeQueryParam","_changeBrowserHistory2","innerBaseEvent","theme","Intranet","Bitrix24","ThemePicker","Singleton","getAppliedThemeId","themeStyles","head","Promise","all","map","link","resolve","_updateBaseTheme2","currentTheme","baseTheme","match","contentDocument","replace","param","history","replaceState","action","console","Spaces"],"sources":["script.js"],"mappings":"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"}