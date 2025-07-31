import { Tools } from "../store/useSketchStore";

export const adjustRequired = (type:typeof Tools[keyof typeof Tools]) => {
    ["line","rectangle","text"].includes(type)
};
