BX.ready(function () {
    BX.namespace("BX.MyWebstor.HMS.Doctor");

    BX.MyWebstor.HMS.Doctor.List = function (gridID) {
        var grid = BX.Main.gridManager.getById(gridID);
        if (!grid) throw new Error("Grid not found");

        this.gridID = gridID;
        this.grid = grid.instance;
    };

    BX.MyWebstor.HMS.Doctor.List.prototype.delete = function (doctorID = 0) {
        if (doctorID <= 0) return;

        BX.ajax
            .runComponentAction("mywebstor:hms.doctor.details", "delete", {
                mode: "class",
                data: {
                    doctorID,
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
                        TITLE: "Delete error №" + doctorID,
                        TEXT: errors,
                    },
                ];
                this.grid.messages.show();
            });
    };

    BX.MyWebstor.HMS.Doctor.List.Instance = null;
    BX.MyWebstor.HMS.Doctor.List.getInstance = function (gridID) {
        if (BX.MyWebstor.HMS.Doctor.List.Instance === null) BX.MyWebstor.HMS.Doctor.List.Instance = new BX.MyWebstor.HMS.Doctor.List(gridID);

        return BX.MyWebstor.HMS.Doctor.List.Instance;
    };
});
