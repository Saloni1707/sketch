import { Tools } from "../store/useSketchStore";

export const adjustRequired = (type: keyof typeof Tools) => {
    ["line","rectangle","text"].includes(type)
};
