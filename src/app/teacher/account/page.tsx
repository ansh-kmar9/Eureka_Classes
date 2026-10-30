import { StaffAccount } from "@/features/account/components/staff-account";
import { requireStaff } from "@/features/auth/guards";

export default async function TeacherAccountPage() {
  return <StaffAccount profile={await requireStaff()} homeHref="/teacher" />;
}
