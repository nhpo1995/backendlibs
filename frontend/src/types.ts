export interface Module {
  id: string;
  title: string;
  summary: string;
}
export interface Lesson {
  slug: string;
  title: string;
  module: string;
  summary: string;
  prerequisites: string;
  lab: {
    goal: string;
    instructions?: string;
    starter: string;
    solution: string;
    expected: string;
    language: string;
    filename: string;
    comparison?: "whole" | "addition" | "manual";
  };
  understanding: { title: string; prompt: string; answer: string; criterion: string }[];
  quiz: {
    question: string;
    answers: string[];
    correct: number;
    explanation: string;
  };
}
export interface Course {
  title: string;
  baseline: string;
  modules: Module[];
  lessons: Lesson[];
  aliases: Record<string, string>;
  alias_fragments: Record<string, Record<string, string>>;
}
export interface ArticleData {
  bodyHtml: string;
  introHtml: string;
  referencesHtml: string;
  videoHtml: string;
  toc: { id: string; title: string }[];
  simulation?: LessonSimulation;
}

export interface LessonSimulation {
  title: string;
  setup: string;
  steps: { label: string; result: string }[];
}
