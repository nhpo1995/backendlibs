import { useState } from "react";
import type { Lesson } from "./types";

export function Quiz({ lesson }: { lesson: Lesson }) {
  const [answer, setAnswer] = useState<string>("");
  const [feedback, setFeedback] = useState("");
  const [correct, setCorrect] = useState<boolean | undefined>();
  const q = lesson.quiz;
  return (
    <section className="chapter" id="kiem-tra-nang-luc">
      <h2>Kiểm tra cách hiểu</h2>
      <p>Trước khi mở đáp án, hãy ghi dự đoán, lý do và dấu hiệu bạn sẽ dùng để kiểm chứng.</p>
      <div className="understanding-cases">
        {lesson.understanding.map((item) => (
          <section className="understanding-case" key={item.title}>
            <h3>{item.title}</h3>
            <p>{item.prompt}</p>
            <details className="question">
              <summary>Mở đáp án và tiêu chí</summary>
              <p>{item.answer}</p>
              <p><strong>Tự đánh giá.</strong> {item.criterion}</p>
            </details>
          </section>
        ))}
      </div>
      <details className="quick-quiz">
        <summary>Ôn nhanh bằng trắc nghiệm</summary>
        <form
          className="quiz"
          data-quiz
          onSubmit={(event) => {
            event.preventDefault();
            if (answer === "") {
              setFeedback("Chọn một đáp án trước khi kiểm tra.");
              setCorrect(undefined);
              return;
            }
            const ok = Number(answer) === q.correct;
            setCorrect(ok);
            setFeedback(`${ok ? "Đúng." : "Chưa đúng."} ${q.explanation}`);
          }}
        >
          <fieldset>
            <legend>{q.question}</legend>
            {q.answers.map((item, i) => (
              <label key={i}>
                <input
                  type="radio"
                  name={`quiz-${lesson.slug}`}
                  value={i}
                  checked={answer === String(i)}
                  onChange={(event) => setAnswer(event.target.value)}
                />
                <span>{item}</span>
              </label>
            ))}
          </fieldset>
          <button type="submit">Kiểm tra đáp án</button>
          <p
            role="status"
            aria-live="polite"
            data-feedback
            data-result={
              correct === undefined
                ? undefined
                : correct
                  ? "correct"
                  : "incorrect"
            }
          >
            {feedback}
          </p>
        </form>
      </details>
    </section>
  );
}
