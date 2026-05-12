import { useCallback, useEffect, useMemo, useState } from "react";
import { HomePage } from "@/pages/HomePage";
import { MenuPage } from "@/pages/MenuPage";
import { OrderPage } from "@/pages/OrderPage";
import { AboutPage } from "@/pages/AboutPage";
import { ContactPage } from "@/pages/ContactPage";
import { GalleryPage } from "@/pages/GalleryPage";
import { SiteLayout } from "@/components/SiteLayout";
import type { AppPath, NavigateFn } from "@/pages/types";

function normalizePath(pathname: string): AppPath {
  const clean = pathname.replace(/\/+$/, "") || "/";
  const allowed: AppPath[] = ["/", "/menu", "/order", "/about", "/contact", "/gallery"];
  return allowed.includes(clean as AppPath) ? (clean as AppPath) : "/";
}

function App() {
  const [path, setPath] = useState<AppPath>(() => normalizePath(window.location.pathname));

  useEffect(() => {
    const handlePop = () => setPath(normalizePath(window.location.pathname));
    window.addEventListener("popstate", handlePop);
    return () => window.removeEventListener("popstate", handlePop);
  }, []);

  const navigate = useCallback<NavigateFn>((to) => {
    const next = normalizePath(to);
    setPath((current) => {
      if (next === current) return current;
      window.history.pushState({}, "", next);
      window.scrollTo({ top: 0, behavior: "auto" });
      return next;
    });
  }, []);

  const page = useMemo(() => {
    switch (path) {
      case "/menu":
        return <MenuPage navigate={navigate} />;
      case "/order":
        return <OrderPage navigate={navigate} />;
      case "/about":
        return <AboutPage />;
      case "/contact":
        return <ContactPage />;
      case "/gallery":
        return <GalleryPage />;
      default:
        return <HomePage navigate={navigate} />;
    }
  }, [navigate, path]);

  return (
    <SiteLayout currentPath={path} navigate={navigate}>
      {page}
    </SiteLayout>
  );
}

export default App;
