import { useMemo, type RefObject } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(ScrollTrigger);

function setReducedMotionState(root: HTMLElement) {
  root.querySelectorAll(".gsap-reveal").forEach((el) => {
    gsap.set(el as HTMLElement, { autoAlpha: 1, y: 0, clearProps: "transform" });
  });
  root.querySelectorAll(".gsap-stagger").forEach((list) => {
    Array.from(list.children).forEach((child) => {
      gsap.set(child as HTMLElement, { autoAlpha: 1, y: 0, clearProps: "transform" });
    });
  });
  root.querySelectorAll(".gsap-parallax").forEach((el) => {
    gsap.set(el as HTMLElement, { y: 0, clearProps: "transform" });
  });
  root.querySelectorAll(".gsap-clip").forEach((el) => {
    gsap.set(el as HTMLElement, { clipPath: "inset(0% 0% 0% 0%)" });
  });
}

/**
 * GSAP + ScrollTrigger scoped to a container ref (e.g. home page root).
 * Use class hooks: .gsap-reveal, .gsap-stagger (direct children), .gsap-parallax, .gsap-cta
 */
export function useMawaScrollAnimations(scope: RefObject<HTMLElement | null>) {
  const reducedMotion = useMemo(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    [],
  );

  useGSAP(
    () => {
      const root = scope.current;
      if (!root) return undefined;

      if (reducedMotion) {
        setReducedMotionState(root);
        return undefined;
      }

      const ctaCleanups: Array<() => void> = [];

      const ctx = gsap.context(() => {
        const reveals = gsap.utils.toArray<HTMLElement>(
          root.querySelectorAll(".gsap-reveal"),
        );
        reveals.forEach((item) => {
          gsap.fromTo(
            item,
            { autoAlpha: 0, y: 34 },
            {
              autoAlpha: 1,
              y: 0,
              duration: 0.9,
              ease: "power3.out",
              scrollTrigger: {
                trigger: item,
                start: "top 82%",
                once: true,
              },
            },
          );
        });

        const staggerLists = gsap.utils.toArray<HTMLElement>(
          root.querySelectorAll(".gsap-stagger"),
        );
        staggerLists.forEach((list) => {
          const items = list.children;
          if (items.length === 0) return;
          gsap.fromTo(
            items,
            { autoAlpha: 0, y: 24 },
            {
              autoAlpha: 1,
              y: 0,
              duration: 0.72,
              stagger: 0.12,
              ease: "power3.out",
              scrollTrigger: {
                trigger: list,
                start: "top 85%",
                once: true,
              },
            },
          );
        });

        const parallaxEls = gsap.utils.toArray<HTMLElement>(
          root.querySelectorAll(".gsap-parallax"),
        );
        parallaxEls.forEach((el) => {
          gsap.fromTo(
            el,
            { y: -22 },
            {
              y: 22,
              ease: "none",
              scrollTrigger: {
                trigger: root,
                start: "top top",
                end: "bottom bottom",
                scrub: 1,
              },
            },
          );
        });

        const clipEls = gsap.utils.toArray<HTMLElement>(
          root.querySelectorAll(".gsap-clip"),
        );
        clipEls.forEach((el) => {
          gsap.fromTo(
            el,
            { clipPath: "inset(12% 10% 12% 10%)", scale: 1.04 },
            {
              clipPath: "inset(0% 0% 0% 0%)",
              scale: 1,
              duration: 1.1,
              ease: "power3.out",
              scrollTrigger: {
                trigger: el,
                start: "top 82%",
                once: true,
              },
            },
          );
        });

        const ctaButtons = gsap.utils.toArray<HTMLElement>(
          root.querySelectorAll(".gsap-cta"),
        );
        ctaButtons.forEach((button) => {
          const enter = () => {
            gsap.to(button, { y: -2, duration: 0.2, ease: "power2.out" });
          };
          const leave = () => {
            gsap.to(button, { y: 0, duration: 0.2, ease: "power2.out" });
          };
          button.addEventListener("mouseenter", enter);
          button.addEventListener("mouseleave", leave);
          ctaCleanups.push(() => {
            button.removeEventListener("mouseenter", enter);
            button.removeEventListener("mouseleave", leave);
          });
        });

        requestAnimationFrame(() => {
          ScrollTrigger.refresh();
        });
      }, root);

      return () => {
        ctaCleanups.forEach((fn) => fn());
        ctx.revert();
      };
    },
    { scope, dependencies: [reducedMotion] },
  );
}
