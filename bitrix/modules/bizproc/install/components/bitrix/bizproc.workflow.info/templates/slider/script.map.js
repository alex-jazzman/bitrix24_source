{"version":3,"file":"script.map.js","names":["this","BX","Bizproc","exports","main_core","main_core_events","ui_buttons","bizproc_task","ui_dialogs_messagebox","_renderButtons","babelHelpers","classPrivateFieldLooseKey","_handleTaskButtonClick","_handleDelegateButtonClick","_delegateTask","_sendMarkAsRead","WorkflowInfo","constructor","options","Object","defineProperty","value","_sendMarkAsRead2","_delegateTask2","_handleDelegateButtonClick2","_handleTaskButtonClick2","_renderButtons2","currentUserId","workflowId","taskId","taskUserId","taskButtons","taskForm","buttonsPanel","canDelegateTask","handleMarkAsRead","Runtime","debounce","classPrivateFieldLooseBase","init","EventEmitter","subscribe","event","xmlId","getData","forEach","taskButton","targetStatus","UserStatus","TARGET_USER_STATUS","isDecline","isNo","isCancel","button","Button","color","ButtonColor","LIGHT_BORDER","SUCCESS","round","size","ButtonSize","MEDIUM","text","TEXT","onclick","btn","Dom","style","getContainer","attr","append","LINK","Loc","getMessage","uiButton","formData","FormData","NAME","VALUE","setDisabled","ajax","runAction","data","then","_BX$SidePanel$Instanc","SidePanel","Instance","getSliderByWindow","window","close","catch","response","MessageBox","alert","errors","pop","message","loadExtension","Dialog","dialog","targetNode","context","entities","id","intranetUsersOnly","emailUsers","inviteEmployeeLink","inviteGuestLink","selectMode","popupOptions","bindOptions","forceBindPosition","enableSearch","events","item","getId","onHide","getTarget","destroy","hideOnSelect","offsetTop","clearUnavailableItems","multiple","show","e","console","error","toUserId","actionData","taskIds","fromUserId","_BX$SidePanel$Instanc2","userId","Component","Event","UI","Dialogs"],"sources":["script.js"],"mappings":"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"}