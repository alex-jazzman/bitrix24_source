BX.ready(function () {
    BX.namespace("BX.MyWebstor.HMS.FillingMethod");

    BX.MyWebstor.HMS.FillingMethod.List = function (gridID) {
        var grid = BX.Main.gridManager.getById(gridID);
        if (!grid) throw new Error("Grid not found");

        this.gridID = gridID;
        this.grid = grid.instance;
    };

    BX.MyWebstor.HMS.FillingMethod.List.prototype.delete = function (fillingMethodID = 0) {
        if (fillingMethodID <= 0) return;

        BX.ajax
            .runComponentAction("mywebstor:hms.filling_method.list", "delete", {
                mode: "class",
                data: {
                    fillingMethodID,
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
                        TITLE: "Delete error №" + fillingMethodID,
                        TEXT: errors,
                    },
                ];
                this.grid.messages.show();
            });
    };

    BX.MyWebstor.HMS.FillingMethod.List.Instance = null;
    BX.MyWebstor.HMS.FillingMethod.List.getInstance = function (gridID) {
        if (BX.MyWebstor.HMS.FillingMethod.List.Instance === null) BX.MyWebstor.HMS.FillingMethod.List.Instance = new BX.MyWebstor.HMS.FillingMethod.List(gridID);

        return BX.MyWebstor.HMS.FillingMethod.List.Instance;
    };
});
