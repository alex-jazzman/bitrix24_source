{"version":3,"file":"rule.map.js","names":["jn","define","require","exports","module","Type","clone","useCallback","ButtonsWrapper","StartButton","TaskOpener","Rule","static","tasks","targetTask","constructor","props","this","layout","isArrayFilled","uid","completedTasks","delegatedTasks","onStartButtonClick","bind","renderEntryPoint","style","width","onClick","testId","calculateEntryPointButtons","start","then","onFinishRule","catch","errors","console","error","Boolean","async","Error","doTaskCollection","taskRequest","Promise","resolve","reject","onTasksCompleted","taskIds","map","task","id","BX","ajax","runAction","json","parseInt","delegateTasks","delegateRequest","onTasksDelegated","data","toUserId","fromUserId","isEarlyFinish","isFunction","taskOpener","parentLayout","widgetTitle","typeName","taskId","generateExitButton","open","result","doTaskRequest","finishRule","taskNotFound","onTasksCancel","onTaskNotFoundError","push"],"sources":["rule.js"],"mappings":"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"}