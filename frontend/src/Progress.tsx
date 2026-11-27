import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { read, write } from "./storage";
import type { Lesson } from "./types";

const Context = createContext<{
  completed: Record<string, boolean>;
  setCompleted(slug: string, value: boolean): boolean;
}>({ completed: {}, setCompleted: () => false });
export const useProgress = () => useContext(Context);

export function ProgressProvider({
  lessons,
  children,
}: {
  lessons: Lesson[];
  children: ReactNode;
}) {
  const load = () =>
    Object.fromEntries(
      lessons.map((lesson) => [
        lesson.slug,
        read(`backendlibs:complete:${lesson.slug}`) === "true",
      ]),
    );
  const [completed, setCompletedState] = useState(load);
  useEffect(() => {
    const sync = () => setCompletedState(load());
    window.addEventListener("storage", sync);
    return () => window.removeEventListener("storage", sync);
  }, [lessons]);
  return (
    <Context
      value={{
        completed,
        setCompleted(slug, value) {
          const ok = write(`backendlibs:complete:${slug}`, String(value));
          setCompletedState((previous) => ({ ...previous, [slug]: value }));
          return ok;
        },
      }}
    >
      {children}
    </Context>
  );
}
