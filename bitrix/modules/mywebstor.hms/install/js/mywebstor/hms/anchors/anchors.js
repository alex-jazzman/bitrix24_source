BX.ready(() => {
    let sidePanelInstance;
    if (!BX || !BX.SidePanel || !(sidePanelInstance = BX.SidePanel.Instance))
        return;

    const rootWindow = BX.PageObject.getRootWindow();
    if (rootWindow !== window) return;

    sidePanelInstance.bindAnchors({
        rules: [
            {
                condition: [/\/hms\/config\/clinic\/details\//i],
                options: {
                    cacheable: false,
                    loader: "crm-entity-details-loader",
                    width: 675,
                    label: {
                        text: BX.message("HMS_CLINIC_LABEL_TEXT"),
                    },
                    events: {
                        onLoad: function () {
                            BX.SidePanel.Instance.pageUrl =
                                "/hms/config/clinic/";
                        },
                    },
                },
            },
            {
                condition: [/\/hms\/config\/office\/details\//i],
                options: {
                    cacheable: false,
                    loader: "crm-entity-details-loader",
                    width: 675,
                    label: {
                        text: BX.message("HMS_OFFICE_LABEL_TEXT"),
                    },
                    events: {
                        onLoad: function () {
                            BX.SidePanel.Instance.pageUrl =
                                "/hms/config/office/";
                        },
                    },
                },
            },
            {
                condition: [/\/hms\/config\/doctor\/details\//i],
                options: {
                    cacheable: false,
                    loader: "crm-entity-details-loader",
                    width: 675,
                    label: {
                        text: BX.message("HMS_DOCTOR_LABEL_TEXT"),
                    },
                    events: {
                        onLoad: function () {
                            BX.SidePanel.Instance.pageUrl =
                                "/hms/config/doctor/";
                        },
                    },
                },
            },
            {
                condition: [/\/hms\/config\/schedule\/details\//i],
                options: {
                    cacheable: false,
                    label: {
                        text: BX.message("HMS_SCHEDULE_LABEL_TEXT"),
                    },
                    events: {
                        onLoad: function () {
                            BX.SidePanel.Instance.pageUrl =
                                "/hms/config/schedule/";
                        },
                    },
                },
            },
            {
                condition: [/\/hms\/config\/shift_work\/details\//i],
                options: {
                    cacheable: false,
                    width: 675,
                    label: {
                        text: BX.message("HMS_SHIFT_WORK_LABEL_TEXT"),
                    },
                    events: {
                        onLoad: function () {
                            BX.SidePanel.Instance.pageUrl =
                                "/hms/config/shift_work/";
                        },
                    },
                },
            },
            {
                condition: [/\/hms\/config\/filling_method\/details\//i],
                options: {
                    cacheable: false,
                    width: 675,
                    label: {
                        text: BX.message("HMS_FILLING_METHOD_LABEL_TEXT"),
                    },
                    events: {
                        onLoad: function () {
                            BX.SidePanel.Instance.pageUrl =
                                "/hms/config/filling_method/";
                        },
                    },
                },
            },
            {
                condition: [/\/hms\/config\/specialization\/details\//i],
                options: {
                    cacheable: false,
                    loader: "crm-entity-details-loader",
                    width: 675,
                    label: {
                        text: BX.message("HMS_SPECIALIZATION_LABEL_TEXT"),
                    },
                    events: {
                        onLoad: function () {
                            BX.SidePanel.Instance.pageUrl =
                                "/hms/config/specialization/";
                        },
                    },
                },
            },
            {
                condition: [/\/hms\/config\/vhi\/details\//i],
                options: {
                    cacheable: false,
                    allowChangeHistory: false,
                    loader: "crm-entity-details-loader",
                    width: 675,
                    label: {
                        text: BX.message("HMS_VHI_LABEL_TEXT"),
                    },
                    events: {
                        onLoad: function () {
                            // BX.SidePanel.Instance.pageUrl = "/hms/reception/";
                        },
                    },
                },
            },
            {
                condition: [/\/hms\/reception\/appointment\/details\//i],
                options: {
                    cacheable: false,
                    loader: "crm-entity-details-loader",
                    // width: 675,
                    label: {
                        text: BX.message("HMS_APPOINTMENT_LABEL_TEXT"),
                    },
                    events: {
                        onLoad: function () {
                            // BX.SidePanel.Instance.pageUrl = "/hms/reception/";
                        },
                    },
                },
            },
            {
                condition: [/\/hms\/config\/teeth_chart\/details\//i],
                options: {
                    cacheable: false,
                    allowChangeHistory: false,
                    loader: "crm-entity-details-loader",
                    // width: 675,
                    label: {
                        text: BX.message("HMS_TEETH_CHART_LABEL_TEXT"),
                    },
                    events: {
                        onLoad: function () {
                            // BX.SidePanel.Instance.pageUrl = "/hms/reception/";
                        },
                    },
                },
            },
            {
                condition: [/\/hms\/config\/vhi\/type\/details\//i],
                options: {
                    cacheable: false,
                    allowChangeHistory: false,
                    loader: "crm-entity-details-loader",
                    width: 675,
                    label: {
                        text: BX.message("HMS_VHI_TYPE_LABEL_TEXT"),
                    },
                    events: {
                        onLoad: function () {
                            BX.SidePanel.Instance.pageUrl =
                                "/hms/config/vhi/type/";
                        },
                    },
                },
            },
            {
                condition: [/\/hms\/config\/vhi\/service_type\/details\//i],
                options: {
                    cacheable: false,
                    allowChangeHistory: false,
                    loader: "crm-entity-details-loader",
                    width: 675,
                    label: {
                        text: BX.message("HMS_VHI_SERVICE_TYPE_LABEL_TEXT"),
                    },
                    events: {
                        onLoad: function () {
                            BX.SidePanel.Instance.pageUrl =
                                "/hms/config/vhi/service_type/";
                        },
                    },
                },
            },
        ],
    });
});
