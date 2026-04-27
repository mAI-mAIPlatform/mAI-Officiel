import { ProjectsBreadcrumb } from "@/components/projects/projects-breadcrumb";

export default function ProjectsLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <ProjectsBreadcrumb />
      {children}
    </>
  );
}
