import { StaffAccount } from "@/features/account/components/staff-account";
import { requireAdmin } from "@/features/auth/guards";

export default async function AdminAccountPage() {
  return <StaffAccount profile={await requireAdmin()} homeHref="/admin" />;
}
