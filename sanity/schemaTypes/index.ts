import { documentTypes, singletonTypes } from "./documents";
import { elementorTypes } from "./elementor";

export const schemaTypes = [...documentTypes, ...elementorTypes];
export { singletonTypes };
