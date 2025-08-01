// components/action-bar/action-bar.tsx
"use client";

import { TOOLS, Tool } from "../../store/useSketchStore";
import { LuPencil } from "react-icons/lu";
import { FiCircle, FiMinus, FiMousePointer, FiSquare, FiType } from "react-icons/fi";
import { IoHandRightOutline } from "react-icons/io5";
import styles from "./ActionBar.module.css";

type ActionBarProps = {
  tool: Tool;
  setTool: (tool: Tool) => void;
};

export function ActionBar({ tool, setTool }: ActionBarProps) {
  return (
    <div className={styles.actionBarWrapper}>
    <div className={styles.actionBar}>
      {TOOLS.map((t, index) => (
        <div
          className={`${styles.inputWrapper} ${tool === t ? styles.selected : ""}`}
          key={t}
          onClick={() => setTool(t)}
        >
          <input
            type="radio"
            id={t}
            checked={tool === t}
            onChange={() => setTool(t)}
            readOnly
          />
          <label htmlFor={t}>
            {t === "pan" && <IoHandRightOutline />}
            {t === "selection" && <FiMousePointer />}
            {t === "rectangle" && <FiSquare />}
            {t === "line" && <FiMinus />}
            {t === "pencil" && <LuPencil />}
            {t === "text" && <FiType />}
            {t === "circle" && <FiCircle />}
          </label>
          {/* <span>{index + 1}</span> */}
        </div>
      ))}
    </div>
    </div>
  );
}