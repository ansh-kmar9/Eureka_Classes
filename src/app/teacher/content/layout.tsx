import { ContentTabs } from "@/features/content/components/content-tabs";

export default function ContentLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <ContentTabs />
      {children}
    </div>
  );
}
