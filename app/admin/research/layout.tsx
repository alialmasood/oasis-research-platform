import { ResearchSubNav } from "./_components/ResearchSubNav";

export default function AdminResearchLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="space-y-4">
      <ResearchSubNav />
      {children}
    </div>
  );
}
