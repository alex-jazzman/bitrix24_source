{"version":3,"file":"extension.map.js","names":["jn","define","require","exports","module","Loc","userListAdapter","EmployeeStatus","RequestStatus","showSafeToast","Position","check","cross","Actions","EmployeeActions","deleteInvitationPending","state","action","setActionRequestStatus","PENDING","deleteInvitationFulfilled","userId","meta","arg","removeOne","deleteInvitationRejected","user","entities","upsertOne","requestStatus","REJECTED","getValue","setTimeout","list","FIRE","getMessage","fireEmployeePending","employeeStatus","FIRED","fireEmployeeFulfilled","FULFILLED","fireEmployeeRejected","hireEmployeePending","ACTIVE","hireEmployeeFulfilled","hireEmployeeRejected","confirmUserRequestPending","isAccept","showCustomizedToast","confirmUserRequestFulfilled","confirmUserRequestRejected","message","svg","reinvitePending","lastInvitationTimestamp","Date","now","reinviteRejected","changeDepartmentPending","departments","department","svgContent","getToastParams","content","position","BOTTOM","time","layout"],"sources":["extension.js"],"mappings":"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"}