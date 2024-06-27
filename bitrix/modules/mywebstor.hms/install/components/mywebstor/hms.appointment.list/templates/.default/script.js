BX.ready(function () {
    BX.namespace("BX.MyWebstor.HMS.Appointment");

    BX.MyWebstor.HMS.Appointment.List = function ({
        GRID_ID: gridID,
        IS_TAB: isTab,
        SIGNED_PARAMETERS: signedParameters,
    }) {
        var grid = BX.Main.gridManager.getById(gridID);
        if (!grid) throw new Error("Grid not found");

        this.gridID = gridID;
        this.grid = grid.instance;
        this.signedParameters = signedParameters;

        if (isTab)
            BX.addCustomEvent(
                "Grid::beforeRequest",
                this.configRequest.bind(this)
            );
    };

    BX.MyWebstor.HMS.Appointment.List.prototype.configRequest = function (
        grid,
        config
    ) {
        if (config.gridId !== this.gridID) return;

        if (config.url === "")
            config.url =
                "/bitrix/components/mywebstor/hms.appointment.list/lazyload.ajax.php?&site=" +
                BX.message("SITE_ID") +
                "&sessid=" +
                BX.message("bitrix_sessid");
        config.method = "POST";
        config.data.PARAMS = {
            signedParameters: this.signedParameters,
        };
    };

    BX.MyWebstor.HMS.Appointment.List.prototype.delete = function (
        appointmentID = 0
    ) {
        if (appointmentID <= 0) return;

        BX.ajax
            .runComponentAction("mywebstor:hms.appointment.details", "delete", {
                mode: "class",
                data: {
                    appointmentID,
                },
            })
            .then((result) => {
                this.grid.reloadTable();
            })
            .catch((result) => {
                var errors = result.errors.shift().message;
                this.grid.arParams.MESSAGES = [
                    {
                        TYPE: "error",
                        TITLE: "Delete error №" + appointmentID,
                        TEXT: errors,
                    },
                ];
                this.grid.messages.show();
            });
    };

    BX.MyWebstor.HMS.Appointment.List.Instance = null;
    BX.MyWebstor.HMS.Appointment.List.getInstance = function (gridID) {
        if (BX.MyWebstor.HMS.Appointment.List.Instance === null)
            BX.MyWebstor.HMS.Appointment.List.Instance =
                new BX.MyWebstor.HMS.Appointment.List(gridID);

        return BX.MyWebstor.HMS.Appointment.List.Instance;
    };
});
