import { useState } from "react";
import type { LessonSimulation } from "./types";

export function LessonWalkthrough({ simulation }: { simulation: LessonSimulation }) {
  const [step, setStep] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const current = simulation.steps[step];

  function selectStep(index: number) {
    setStep(index);
    setRevealed(false);
  }

  return (
    <section className="chapter validation-walkthrough lesson-walkthrough" id="mo-phong-bai-hoc">
      <h2>Mô phỏng · {simulation.title}</h2>
      <p>{simulation.setup}</p>
      <div className="validation-scene">
        <div className="validation-flow">
          <h3>Các bước đối chiếu</h3>
          <ol className="validation-stages lesson-walkthrough-stages" aria-label="Các bước mô phỏng">
            {simulation.steps.map((item, index) => (
              <li key={item.label}>
                <button type="button" aria-current={index === step ? "step" : undefined}
                  onClick={() => selectStep(index)}>
                  <span className="validation-stage-icon" aria-hidden="true">{index + 1}</span>
                  <strong>{item.label}</strong>
                </button>
              </li>
            ))}
          </ol>
        </div>
        <div className="validation-details">
          <h3>{current.label}</h3>
          <p className="validation-explanation" role="status">
            {revealed ? current.result : "Dự đoán kết quả của bước này rồi mở phần giải thích."}
          </p>
          <button type="button" className="walkthrough-reveal" aria-expanded={revealed}
            onClick={() => setRevealed(!revealed)}>
            {revealed ? "Ẩn kết quả" : "Xem kết quả mô phỏng"}
          </button>
        </div>
      </div>
      <div className="validation-controls">
        <button type="button" disabled={step === 0} onClick={() => selectStep(step - 1)}>Bước trước</button>
        <button type="button" disabled={step === simulation.steps.length - 1}
          onClick={() => selectStep(step + 1)}>Bước tiếp</button>
      </div>
    </section>
  );
}
