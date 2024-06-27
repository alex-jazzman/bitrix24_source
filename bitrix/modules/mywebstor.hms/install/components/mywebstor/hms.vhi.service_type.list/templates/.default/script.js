BX.ready(function () {
    BX.namespace("BX.MyWebstor.HMS.Vhi.ServiceType");

    BX.MyWebstor.HMS.Vhi.ServiceType.List = function ({
        GRID_ID: gridID,
    }) {
        var grid = BX.Main.gridManager.getById(gridID);
        if (!grid) throw new Error("Grid not found");

        this.gridID = gridID;
        this.grid = grid.instance;
    };

    BX.MyWebstor.HMS.Vhi.ServiceType.List.prototype.delete = function (
        vhiServiceTypeID = 0
    ) {
        if (vhiServiceTypeID <= 0) return;

        BX.ajax
            .runComponentAction(
                "mywebstor:hms.vhi.service_type.details",
                "delete",
                {
                    mode: "class",
                    data: {
                        vhiServiceTypeID,
                    },
                }
            )
            .then((result) => {
                this.grid.reload();
            })
            .catch((result) => {
                var errors = result.errors.shift().message;
                this.grid.arParams.MESSAGES = [
                    {
                        TYPE: "error",
                        TITLE: "Delete error №" + vhiServiceTypeID,
                        TEXT: errors,
                    },
                ];
                this.grid.messages.show();
            });
    };

    BX.MyWebstor.HMS.Vhi.ServiceType.List.Instance = null;
    BX.MyWebstor.HMS.Vhi.ServiceType.List.getInstance = function (gridID) {
        if (BX.MyWebstor.HMS.Vhi.ServiceType.List.Instance === null)
            BX.MyWebstor.HMS.Vhi.ServiceType.List.Instance =
                new BX.MyWebstor.HMS.Vhi.ServiceType.List(gridID);

        return BX.MyWebstor.HMS.Vhi.ServiceType.List.Instance;
    };
});
