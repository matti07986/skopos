import { redirect } from "next/navigation";

/**
 * /projects/[id] è stata deprecata. Tutta la dashboard è ora su /projects
 * con tabs (overview/errors/warnings/logs/insights) che leggono dall'active project.
 *
 * Qualsiasi URL /projects/<uuid> ora redirecta a /projects.
 *
 * In futuro, se servirà tornare a una vista per-project (es. share links pubblici,
 * deeplinks da email), il modo pulito sarà accettare ?project=<id> su /projects
 * e settare activeProject dal context, NON creare di nuovo una sub-route separata.
 */
export default function ProjectByIdRedirect() {
  redirect("/projects");
}
