"use client";
import React from "react";

type Props = {
  users: string[];
  isConnected: boolean;
};

export default function Collaborators({ users, isConnected }: Props) {
  return (
    <div style={{ position: "fixed", top: 16, right: 16, zIndex: 50 }}>
      <div
        style={{
          background: "rgba(255,255,255,0.95)",
          backdropFilter: "blur(6px)",
          padding: "10px 12px",
          borderRadius: 12,
          boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
          minWidth: 200,
        }}
      >
        
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 8,
          }}
        >
          <span style={{ fontWeight: 600, fontSize: 14, color: "#374151" }}>
            Collaborators
          </span>

          
          <span
            title={isConnected ? "Connected" : "Disconnected"}
            style={{
              width: 10,
              height: 10,
              borderRadius: "50%",
              background: isConnected ? "#22c55e" : "#ef4444",
              boxShadow: isConnected
                ? "0 0 0 2px rgba(34,197,94,0.25)"
                : "0 0 0 2px rgba(239,68,68,0.25)",
            }}
          />
        </div>

       
        {users.length === 0 ? (
          <div style={{ fontSize: 13, color: "#6b7280" }}>
            You’re working solo
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {users.map((u, i) => (
              <div
                key={i}
                style={{ display: "flex", alignItems: "center", gap: 8 }}
              >
                <div
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: "50%",
                    background: "#6366f1",
                    color: "white",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 12,
                    fontWeight: 600,
                  }}
                >
                  {u[0]?.toUpperCase()}
                </div>

                <span
                  style={{
                    fontSize: 14,
                    fontWeight: 500,
                    color: "#111827",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {u}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
