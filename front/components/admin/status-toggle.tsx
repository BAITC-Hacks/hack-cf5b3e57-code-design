"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import type { UpdateContractorStatusRequest } from "../../../shared/contract";

type StatusToggleProps = {
  contractorId: string;
  contractorName: string;
  initialActive: boolean;
};

export function StatusToggle({
  contractorId,
  contractorName,
  initialActive,
}: StatusToggleProps) {
  const router = useRouter();
  const [isActive, setIsActive] = useState(initialActive);
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function toggleStatus() {
    const nextStatus = !isActive;
    setIsPending(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/admin/contractors/${contractorId}/status`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            isActive: nextStatus,
          } satisfies UpdateContractorStatusRequest),
        },
      );

      if (response.status === 401 || response.status === 403) {
        router.replace("/admin/login?error=session");
        return;
      }

      if (!response.ok) {
        throw new Error("Status update failed");
      }

      setIsActive(nextStatus);
      router.refresh();
    } catch {
      setError("Не удалось изменить статус");
    } finally {
      setIsPending(false);
    }
  }

  return (
    <div className="status-control">
      <button
        className="status-toggle"
        type="button"
        role="switch"
        aria-checked={isActive}
        aria-busy={isPending}
        aria-label={`${isActive ? "Деактивировать" : "Активировать"} ${contractorName}`}
        disabled={isPending}
        onClick={toggleStatus}
      >
        <span className="status-toggle__track" aria-hidden="true">
          <span className="status-toggle__thumb" />
        </span>
        <span className="status-toggle__label">
          {isPending ? "Сохраняем" : isActive ? "Активен" : "Выключен"}
        </span>
      </button>
      {error ? (
        <span className="status-control__error" role="status">
          {error}
        </span>
      ) : null}
    </div>
  );
}
