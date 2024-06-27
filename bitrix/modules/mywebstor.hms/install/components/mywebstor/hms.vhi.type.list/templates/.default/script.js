BX.ready(function () {
    BX.namespace("BX.MyWebstor.HMS.Vhi.Type");

    BX.MyWebstor.HMS.Vhi.Type.List = function ({ GRID_ID: gridID }) {
        var grid = BX.Main.gridManager.getById(gridID);
        if (!grid) throw new Error("Grid not found");

        this.gridID = gridID;
        this.grid = grid.instance;
    };

    BX.MyWebstor.HMS.Vhi.Type.List.prototype.delete = function (vhiTypeID = 0) {
        if (vhiTypeID <= 0) return;

        BX.ajax
            .runComponentAction("mywebstor:hms.vhi.type.details", "delete", {
                mode: "class",
                data: {
                    vhiTypeID,
                },
            })
            .then((result) => {
                this.grid.reload();
            })
            .catch((result) => {
                var errors = result.errors.shift().message;
                this.grid.arParams.MESSAGES = [
                    {
                        TYPE: "error",
                        TITLE: "Delete error №" + vhiTypeID,
                        TEXT: errors,
                    },
                ];
                this.grid.messages.show();
            });
    };

    BX.MyWebstor.HMS.Vhi.Type.List.Instance = null;
    BX.MyWebstor.HMS.Vhi.Type.List.getInstance = function (gridID) {
        if (BX.MyWebstor.HMS.Vhi.Type.List.Instance === null)
            BX.MyWebstor.HMS.Vhi.Type.List.Instance =
                new BX.MyWebstor.HMS.Vhi.Type.List(gridID);

        return BX.MyWebstor.HMS.Vhi.Type.List.Instance;
    };
});
