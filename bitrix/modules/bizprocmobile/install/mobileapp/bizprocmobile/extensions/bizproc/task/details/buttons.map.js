{"version":3,"file":"buttons.map.js","names":["jn","define","require","exports","module","AppTheme","Alert","EventEmitter","Loc","NotifyManager","showToast","Position","PureComponent","TaskErrorCode","TaskButtons","DelegateButton","TaskDetailsButtons","constructor","props","super","this","uid","Random","getString","customEventEmitter","createWithUid","layout","task","isMyTask","canShowTaskButtons","isTaskCompleted","buttons","length","canShowDelegateButton","canDelegate","canShowTimelineButton","render","hasBeforeSeparatorButtons","hasAfterSeparatorButtons","ScrollView","style","height","horizontal","View","paddingTop","paddingBottom","flexDirection","alignContent","alignItems","paddingHorizontal","testId","renderTaskButtons","renderDelegateButton","renderSeparator","renderTimelineButton","maxWidth","device","screen","onBeforeAction","onBeforeTaskButtonAction","bind","onComplete","onTaskCompleted","onFail","onTaskCompleteFailed","async","button","showLoadingIndicator","detailsRef","Promise","resolve","hasErrors","data","getFieldValues","catch","hideLoadingIndicator","reject","responseData","taskCompletionParams","hideLoadingIndicatorWithoutFallback","Notify","showIndicatorSuccess","hideAfter","emit","response","request","setTimeout","close","errors","Array","isArray","firstError","isTaskNotFoundErrorCode","code","showNotifications","message","position","TOP","alert","onClick","onDelegateButtonClick","flexGrow","marginLeft","width","backgroundColor","colors","base6","paddingLeft","justifyContent","borderRadius","borderWidth","borderColor","base5","padding","marginRight","onTimelineButtonClick","Text","fontWeight","fontSize","color","base2","text","getMessage","renderTimelineCounter","value","allTaskCount","top","left","accentMainAlert","textAlign","baseWhiteFixed","String"],"sources":["buttons.js"],"mappings":"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"}