"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";

interface Project {
    id: string;
    name: string;
    slug: string;
    api_key: string;
    description?: string;
    created_at: string;
}

interface ProjectContextType {
    projects: Project[];
    activeProject: Project | null;
    setActiveProject: (p: Project) => void;
    loading: boolean;
    refresh: () => void;
}

const ProjectContext = createContext<ProjectContextType>({
    projects: [],
    activeProject: null,
    setActiveProject: () => { },
    loading: true,
    refresh: () => { },
});

export function useProjects() {
    return useContext(ProjectContext);
}

export function ProjectProvider({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const [projects, setProjects] = useState<Project[]>([]);
    const [activeProject, setActiveProjectState] = useState<Project | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchProjects = useCallback(async () => {
        try {
            const token = localStorage.getItem("skopos_access_token") ?? "";
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/v1/projects`, {
                credentials: "include",
                headers: token ? { "Authorization": `Bearer ${token}` } : {},
            });
            if (!res.ok) {
                if (res.status === 401) {
                    localStorage.clear();
                    const path = window.location.pathname;
                    const isPublicPage = path === "/login" || path === "/" || path.startsWith("/verify-email") || path.startsWith("/legal") || path.startsWith("/pricing") || path.startsWith("/docs") || path.startsWith("/status") || path.startsWith("/features") || path.startsWith("/landing") || path.startsWith("/how-it-works") || path.startsWith("/forgot-password") || path.startsWith("/reset-password");
                    if (!isPublicPage) router.push("/login");
                }
                return;
            }
            const data = await res.json();
            const projectsList: Project[] = Array.isArray(data) ? data : data.projects || [];
            setProjects(projectsList);

            const savedId = localStorage.getItem("skopos_active_project");
            // Ordina per data di creazione: il progetto più vecchio (principale) viene prima
            const sorted = [...projectsList].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
            const found = projectsList.find((p) => p.id === savedId) ?? sorted[0] ?? null;
            setActiveProjectState(found);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchProjects(); }, [fetchProjects]);

    const setActiveProject = (p: Project) => {
        setActiveProjectState(p);
        localStorage.setItem("skopos_active_project", p.id);
    };

    return (
        <ProjectContext.Provider value={{ projects, activeProject, setActiveProject, loading, refresh: fetchProjects }}>
            {children}
        </ProjectContext.Provider>
    );
}