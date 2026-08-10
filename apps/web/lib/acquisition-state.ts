import { AcquisitionIntentStore } from "@vsi/acquisition-intent";
import { createInspectionRegistry } from "@vsi/inspection-registry";

export const inspectionRegistry = createInspectionRegistry();
export const acquisitionIntentStore = new AcquisitionIntentStore();
