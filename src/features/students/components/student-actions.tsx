import { useTranslations } from "next-intl";
import { ActionButton } from "@/components/ui/action-button";
import type { ButtonProps } from "@/components/ui/button";
import type { Profile } from "@/lib/supabase/types";
import { approveStudent, blockStudent, unblockStudent } from "../actions";

/** The buttons that make sense for the student's current status. */
export function StudentActions({
  student,
  size = "md",
}: {
  student: Pick<Profile, "id" | "status">;
  size?: ButtonProps["size"];
}) {
  const t = useTranslations("students");
  const toasts = useTranslations("toasts");

  if (student.status === "incomplete") return null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {student.status === "pending" && (
        <ActionButton
          size={size}
          action={approveStudent.bind(null, student.id)}
          successMessage={toasts("studentApproved")}
        >
          {t("approve")}
        </ActionButton>
      )}
      {student.status === "blocked" ? (
        <ActionButton
          size={size}
          variant="outline"
          action={unblockStudent.bind(null, student.id)}
          successMessage={toasts("studentUnblocked")}
        >
          {t("unblock")}
        </ActionButton>
      ) : (
        <ActionButton
          size={size}
          variant="outline"
          action={blockStudent.bind(null, student.id)}
          successMessage={toasts("studentBlocked")}
          confirm={{
            title: t("blockTitle"),
            description: t("blockBody"),
            confirmLabel: t("block"),
            cancelLabel: t("cancel"),
          }}
        >
          {t("block")}
        </ActionButton>
      )}
    </div>
  );
}
