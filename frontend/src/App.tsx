import { useEffect, useState } from "react";
import {
  Link,
  Navigate,
  Route,
  Routes,
  useLocation,
  useParams,
} from "react-router-dom";
import rawCourse from "../generated/course.json";
import { Article } from "./Article";
import { CodingExercise } from "./CodingExercise";
import { ValidationWalkthrough } from "./ValidationWalkthrough";
import { AuthorizationWalkthrough } from "./AuthorizationWalkthrough";
import { LessonWalkthrough } from "./LessonWalkthrough";
import { SecurityCallGraph } from "./SecurityCallGraph";
import { securityCallGraphs } from "./securityCallGraphs";
import { Quiz } from "./Quiz";
import { ProgressProvider, useProgress } from "./Progress";
import type { ArticleData, Course, Lesson } from "./types";

export const course = rawCourse as Course;
const catalogPath = "/lessons/springboot/index.html";
const modulePath = (id: string) =>
  `/lessons/springboot/modules/${id}/index.html`;
const lessonPath = (slug: string) => `/lessons/springboot/${slug}/index.html`;
const articles = import.meta.glob<{ default: ArticleData }>(
  "../generated/lessons/*.json",
);
const practices = import.meta.glob<{
  default: { html: string; title: string };
}>("../generated/practice/*.json");

function Hero({
  title,
  summary,
  kicker,
  children,
}: {
  title: string;
  summary: string;
  kicker: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="hero">
      <div className="hero-inner catalog-hero">
        <p className="kicker">{kicker}</p>
        <h1>{title}</h1>
        <p className="lead">{summary}</p>
        {children}
      </div>
    </div>
  );
}

function ModuleLinks() {
  return (
    <nav className="module-links" aria-label="Các phần kiến thức">
      <Link to={catalogPath}>Tất cả chủ đề</Link>
      {course.modules.map((module) => (
        <Link key={module.id} to={modulePath(module.id)}>
          {module.title}
        </Link>
      ))}
    </nav>
  );
}

function LessonCards({ lessons }: { lessons: Lesson[] }) {
  const { completed } = useProgress();
  return lessons.map((lesson) => (
    <Link
      key={lesson.slug}
      className="course-card lesson-card"
      data-lesson-card
      data-slug={lesson.slug}
      to={lessonPath(lesson.slug)}
    >
      <span className="lesson-number">
        {String(course.lessons.indexOf(lesson) + 1).padStart(2, "0")}
      </span>
      <span>
        <strong>{lesson.title}</strong>
        <span>{lesson.summary}</span>
        <small>{lesson.prerequisites}</small>
      </span>
      <span
        className="lesson-state"
        aria-label={completed[lesson.slug] ? "Đã tự đánh dấu hoàn thành" : "Chưa đánh dấu"}
      >
        {completed[lesson.slug] ? "✓" : "○"}
      </span>
    </Link>
  ));
}

function ModuleAccordion() {
  const [openId, setOpenId] = useState<string | null>(null);
  return (
    <div className="topic-menu">
      {course.modules.map((module) => {
        const expanded = openId === module.id;
        const buttonId = `topic-toggle-${module.id}`;
        const panelId = `topic-lessons-${module.id}`;
        return (
          <div className="topic-menu-item" key={module.id}>
            <button
              className="course-card topic-toggle"
              type="button"
              id={buttonId}
              aria-expanded={expanded}
              aria-controls={panelId}
              onClick={() => setOpenId(expanded ? null : module.id)}
            >
              <span>
                <strong>{module.title}</strong>
                <span>{module.summary}</span>
              </span>
              <span className="topic-toggle-arrow" aria-hidden="true">⌄</span>
            </button>
            <section
              className="topic-lessons"
              id={panelId}
              data-module={module.id}
              aria-labelledby={buttonId}
              hidden={!expanded}
            >
              {expanded && <LessonCards lessons={course.lessons.filter((lesson) => lesson.module === module.id)} />}
            </section>
          </div>
        );
      })}
    </div>
  );
}

function HomePage() {
  return (
    <main id="noi-dung" tabIndex={-1}>
      <Hero
        title="Hiểu cơ chế. Tự xây backend."
        summary="Bài giảng tiếng Việt, ví dụ có đầu ra và bài tập lập trình để kiểm chứng kết quả."
        kicker="Giáo trình tự học backend"
      >
        <div className="hero-actions">
          <Link className="button" to={catalogPath}>
            Khám phá lộ trình Spring →
          </Link>
          <Link
            className="button secondary"
            to="/practice/spring-foundations/index.html"
          >
            Bắt đầu thực hành
          </Link>
        </div>
      </Hero>
      <section className="catalog">
        <h2>Lộ trình Spring</h2>
        <p>
          {course.lessons.length} bài trong {course.modules.length} phần. Chọn
          một chủ đề để xem các bài thuộc chủ đề đó.
        </p>
        <ModuleAccordion />
      </section>
    </main>
  );
}

const normalize = (value: string) =>
  value
    .toLowerCase()
    .replaceAll("đ", "d")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

function CoursePage({ moduleId }: { moduleId?: string }) {
  const [search, setSearch] = useState("");
  const { completed } = useProgress();
  const module = course.modules.find((item) => item.id === moduleId);
  const location = useLocation();
  if (
    !moduleId &&
    course.modules.some((item) => `#${item.id}` === location.hash)
  )
    return (
      <Navigate
        replace
        to={modulePath(location.hash.slice(1)) + location.search}
      />
    );
  if (moduleId && !module) return <NotFound />;
  const modules = module ? [module] : course.modules;
  const words = normalize(search).trim().split(/\s+/).filter(Boolean);
  const visible = course.lessons.filter(
    (lesson) =>
      (!module || lesson.module === module.id) &&
      words.every((word) =>
        normalize(
          `${lesson.title} ${lesson.summary} ${lesson.prerequisites}`,
        ).includes(word),
      ),
  );
  const total = module
    ? course.lessons.filter((lesson) => lesson.module === module.id).length
    : course.lessons.length;
  return (
    <>
      <Hero
        title={module?.title ?? course.title}
        summary={
          module?.summary ??
          "Học theo cơ chế: Spring Core, Boot, Web, dữ liệu, Security và kiểm thử."
        }
        kicker={
          module
            ? `${total} bài trong chủ đề`
            : `${course.lessons.length} bài · ${course.modules.length} phần kiến thức`
        }
      />
      <main className="catalog curriculum" id="noi-dung" tabIndex={-1}>
        {module && <ModuleLinks />}
        <div className="catalog-tools">
          <label htmlFor="lesson-search">Tìm bài theo chủ đề</label>
          <input
            id="lesson-search"
            data-search
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Ví dụ: transaction, bean, phân quyền"
          />
          <p role="status" aria-live="polite" data-search-status>
            {!module && !words.length
              ? `Chọn một chủ đề để mở danh sách trong ${total} bài.`
              : visible.length
              ? `Hiển thị ${visible.length} / ${total} bài.`
              : "Không tìm thấy bài phù hợp. Thử từ khóa khác."}
          </p>
          <p data-course-progress>
            {Object.values(completed).filter(Boolean).length} /{" "}
            {course.lessons.length} bài đã tự đánh dấu trên trình duyệt này.
          </p>
        </div>
        {!module && !words.length && <ModuleAccordion />}
        {(module || words.length > 0) && modules.map((item) => {
          const lessons = visible.filter((lesson) => lesson.module === item.id);
          return (
            <section
              className="module"
              data-module
              id={item.id}
              key={item.id}
              hidden={!lessons.length}
            >
              <h2>{item.title}</h2>
              <p>{item.summary}</p>
              <LessonCards lessons={lessons} />
            </section>
          );
        })}
      </main>
    </>
  );
}

function Completion({ slug }: { slug: string }) {
  const { completed, setCompleted } = useProgress();
  const [message, setMessage] = useState("");
  return (
    <div className="completion">
      <label>
        <input
          type="checkbox"
          data-complete={slug}
          checked={!!completed[slug]}
          onChange={(event) =>
            setMessage(
              setCompleted(slug, event.target.checked)
                ? "Đã lưu lựa chọn trên trình duyệt này."
                : "Trình duyệt không lưu được tiến độ; lựa chọn chỉ có trong trang đang mở.",
            )
          }
        />{" "}
        Tôi đã tự làm bài tập và giải thích được kết quả
      </label>
      <p>Đánh dấu để tự theo dõi; đây không phải kết quả chấm code.</p>
      <p role="status" data-progress-status>
        {message}
      </p>
    </div>
  );
}

function LessonPage({ lesson }: { lesson: Lesson }) {
  const hasValidationWalkthrough = lesson.slug === "bean-validation";
  const hasAuthorizationWalkthrough = lesson.slug === "security-authorization";
  const securityGraph = securityCallGraphs[lesson.slug];
  const securityGraphId = hasAuthorizationWalkthrough ? "luong-phan-quyen" : "mo-phong-bai-hoc";
  const inlineSecurityGraph = lesson.slug === "security-authentication";
  const [data, setData] = useState<ArticleData | null>(null);
  const [error, setError] = useState(false);
  useEffect(() => {
    let active = true;
    articles[`../generated/lessons/${lesson.slug}.json`]()
      .then((module) => {
        if (active) setData(module.default);
      })
      .catch(() => {
        if (active) setError(true);
      });
    return () => {
      active = false;
    };
  }, [lesson.slug]);
  const module = course.modules.find((item) => item.id === lesson.module)!;
  const index = course.lessons.indexOf(lesson);
  if (error)
    return (
      <main className="catalog" id="noi-dung">
        <h1>Chưa tải được bài học</h1>
        <p>Thử tải lại trang để lấy nội dung.</p>
        <button onClick={() => window.location.reload()}>Tải lại</button>
      </main>
    );
  if (!data)
    return (
      <main className="catalog" id="noi-dung" role="status">
        Đang tải bài học…
      </main>
    );
  return (
    <>
      <Hero
        title={lesson.title}
        summary={lesson.summary}
        kicker={`Bài ${index + 1} / ${course.lessons.length} · ${module.title}`}
      >
        <nav className="crumbs">
          <Link to="/">Trang chủ</Link> /{" "}
          <Link to={modulePath(module.id)}>{module.title}</Link>
        </nav>
        <div className="hero-actions">
          <a className="button" href="#noi-dung">
            Đọc bài ↓
          </a>
          <a className="button secondary" href="#bai-tap-code">
            Tự viết code
          </a>
        </div>
      </Hero>
      <div className="layout">
        <aside className="sidebar">
          <nav aria-label="Mục lục bài học">
            <h2>Nội dung bài học</h2>
            <ol>
              {hasValidationWalkthrough && <li><a href="#mo-phong-validation">Mô phỏng luồng Validation</a></li>}
              {securityGraph && !inlineSecurityGraph && <li><a href={`#${securityGraphId}`}>Sơ đồ lớp và lời gọi</a></li>}
              {hasAuthorizationWalkthrough && <li><a href="#mo-phong-phan-quyen">Mô phỏng quyết định phân quyền</a></li>}
              {!securityGraph && data.simulation && <li><a href="#mo-phong-bai-hoc">Mô phỏng bài học</a></li>}
              {data.toc.map((item) => (
                <li key={item.id}>
                  <a href={`#${item.id}`}>{item.title}</a>
                </li>
              ))}
            </ol>
          </nav>
        </aside>
        <main id="noi-dung" tabIndex={-1}>
          <Article html={data.introHtml} />
          {hasValidationWalkthrough && <ValidationWalkthrough />}
          {securityGraph && !inlineSecurityGraph && <SecurityCallGraph key={lesson.slug} graph={securityGraph} id={securityGraphId} />}
          {hasAuthorizationWalkthrough && <AuthorizationWalkthrough />}
          {!securityGraph && data.simulation && <LessonWalkthrough key={lesson.slug} simulation={data.simulation} />}
          <Article html={data.bodyHtml}>
            {securityGraph && inlineSecurityGraph && <SecurityCallGraph key={lesson.slug} graph={securityGraph} id={securityGraphId} inline />}
          </Article>
          <CodingExercise lesson={lesson} />
          <Quiz lesson={lesson} />
          <Article html={data.referencesHtml} />
          {data.videoHtml && <Article html={data.videoHtml} />}
          <Completion slug={lesson.slug} />
          <nav className="lesson-navigation" aria-label="Chuyển bài">
            {index > 0 && (
              <Link to={lessonPath(course.lessons[index - 1].slug)}>
                ← {course.lessons[index - 1].title}
              </Link>
            )}
            {index + 1 < course.lessons.length && (
              <Link to={lessonPath(course.lessons[index + 1].slug)}>
                {course.lessons[index + 1].title} →
              </Link>
            )}
          </nav>
          <p>
            <a href="#top">Về đầu trang ↑</a>
          </p>
        </main>
      </div>
    </>
  );
}

function LessonRoute() {
  const { slug = "" } = useParams();
  const location = useLocation();
  const canonical = course.aliases[slug];
  if (canonical) {
    const target =
      course.alias_fragments[slug]?.[location.hash.slice(1)] ?? canonical;
    return (
      <Navigate
        replace
        to={lessonPath(target) + location.search + location.hash}
      />
    );
  }
  const lesson = course.lessons.find((item) => item.slug === slug);
  return lesson ? <LessonPage key={slug} lesson={lesson} /> : <NotFound />;
}

function ModuleRoute() {
  const { id } = useParams();
  return <CoursePage key={id} moduleId={id} />;
}

function PracticePage() {
  const { id = "" } = useParams();
  const [data, setData] = useState<{ html: string; title: string } | null>(
    null,
  );
  const [error, setError] = useState(false);
  useEffect(() => {
    let active = true;
    const loader = practices[`../generated/practice/${id}.json`];
    if (!loader) {
      setError(true);
      return;
    }
    loader()
      .then((module) => {
        if (active) setData(module.default);
      })
      .catch(() => {
        if (active) setError(true);
      });
    return () => {
      active = false;
    };
  }, [id]);
  if (error) return <NotFound />;
  return (
    <main className="catalog practice-page" id="noi-dung" tabIndex={-1}>
      {data ? (
        <Article html={data.html} />
      ) : (
        <p role="status">Đang tải đề thực hành…</p>
      )}
    </main>
  );
}

function NotFound() {
  return (
    <main className="catalog" id="noi-dung">
      <h1>Không tìm thấy trang</h1>
      <Link to={catalogPath}>Về lộ trình Spring</Link>
    </main>
  );
}

function ScrollAndTitle() {
  const location = useLocation();
  useEffect(() => {
    document.title = `${course.lessons.find((lesson) => location.pathname === lessonPath(lesson.slug))?.title ?? course.modules.find((module) => location.pathname === modulePath(module.id))?.title ?? "Làm chủ Spring Boot"} · Backend Service`;
    if (!location.hash) {
      window.scrollTo(0, 0);
      return;
    }
    let id = location.hash.slice(1);
    try {
      id = decodeURIComponent(id);
    } catch {
      /* Keep malformed fragments harmless. */
    }
    let frame = 0;
    const observer = new MutationObserver(() => scroll());
    const scroll = () => {
      const target = document.getElementById(id);
      if (!target) return false;
      observer.disconnect();
      // Let article enhancement effects (syntax/copy controls) finish their layout first.
      frame = requestAnimationFrame(() => {
        frame = requestAnimationFrame(() => target.scrollIntoView());
      });
      return true;
    };
    if (!scroll())
      observer.observe(document.getElementById("root") ?? document.body, {
        childList: true,
        subtree: true,
      });
    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [location.pathname, location.hash]);
  return null;
}

export function App() {
  const location = useLocation();
  const directory = location.pathname.replace(/\/+$/, "");
  const knownDirectories = new Set([
    catalogPath.replace("/index.html", ""),
    ...course.lessons.map((lesson) =>
      lessonPath(lesson.slug).replace("/index.html", ""),
    ),
    ...Object.keys(course.aliases).map((slug) =>
      lessonPath(slug).replace("/index.html", ""),
    ),
    ...course.modules.map((module) =>
      modulePath(module.id).replace("/index.html", ""),
    ),
    "/practice/spring-foundations",
    "/practice/reference-directory",
  ]);
  if (knownDirectories.has(directory))
    return (
      <Navigate
        replace
        to={`${directory}/index.html${location.search}${location.hash}`}
      />
    );
  return (
    <ProgressProvider lessons={course.lessons}>
      <ScrollAndTitle />
      <a className="skip" href="#noi-dung">
        Đến nội dung
      </a>
      <header className="masthead">
        <div className="mast-inner">
          <Link className="brand" to="/">
            <span className="mark" aria-hidden="true">
              B
            </span>{" "}
            Backend Service
          </Link>
          <Link className="source" to={catalogPath}>
            Lộ trình Spring ↗
          </Link>
        </div>
      </header>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/index.html" element={<HomePage />} />
        <Route path={catalogPath} element={<CoursePage />} />
        <Route
          path="/lessons/springboot/modules/:id/index.html"
          element={<ModuleRoute />}
        />
        <Route
          path="/lessons/springboot/:slug/index.html"
          element={<LessonRoute />}
        />
        <Route path="/practice/:id/index.html" element={<PracticePage />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </ProgressProvider>
  );
}
