import { Reflection } from "main.core";

import { Factory } from "./factory";
import { TimestampConverter } from "./timestamp-converter";
import { TimezoneOffset } from "./dictionary/timezone-offset";

const namespace = Reflection.namespace('BX.Crm.DateTime');

namespace.Factory = Factory;
namespace.TimestampConverter = TimestampConverter;
namespace.Dictionary = {
	TimezoneOffset,
};

export {
	Factory,
	TimestampConverter,
	TimezoneOffset,
};
