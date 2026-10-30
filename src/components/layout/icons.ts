import {
  BookOpen,
  Bot,
  ClipboardCheck,
  House,
  Inbox,
  Info,
  LayoutDashboard,
  LogIn,
  Mail,
  Megaphone,
  MessageSquare,
  Mic,
  ShieldCheck,
  Sparkles,
  UserCog,
  Users,
  type LucideIcon,
} from "lucide-react";

/** Server components pass icon *names*; client nav components resolve them here. */
export const navIcons = {
  home: House,
  about: Info,
  features: Sparkles,
  contact: Mail,
  login: LogIn,
  test: ClipboardCheck,
  dashboard: LayoutDashboard,
  community: MessageSquare,
  bot: Bot,
  spokenEnglish: Mic,
  courses: BookOpen,
  students: Users,
  announcements: Megaphone,
  teachers: UserCog,
  messages: Inbox,
  panel: ShieldCheck,
} satisfies Record<string, LucideIcon>;

export type NavIconName = keyof typeof navIcons;

export interface NavItem {
  href: string;
  label: string;
  icon: NavIconName;
}
