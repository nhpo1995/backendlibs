import { useState } from "react";
import "./validation-walkthrough.css";

const stages = [
  { name: "JSON", icon: "{ }", action: "Gửi dữ liệu", title: "Client gửi JSON" },
  { name: "Jackson", icon: "↳", action: "Chuyển kiểu", title: "Đọc request body" },
  { name: "@Valid", icon: "✓", action: "Kiểm tra", title: "Kiểm tra ràng buộc" },
  { name: "Controller", icon: "↦", action: "Trả kết quả", title: "Controller xử lý request" },
];
const cases = [
  {
    label: "Sai kiểu JSON",
    username: { value: "an_nguyen" },
    stop: 1,
    status: 400,
    notes: [
      "Client gửi một JSON hợp lệ về cú pháp, nhưng username chứa một object.",
      "Jackson không thể ánh xạ object vào trường String username. Spring MVC trả 400 vì không đọc được request body.",
    ],
  },
  {
    label: "Username toàn dấu cách",
    username: "   ",
    stop: 2,
    status: 400,
    notes: [
      "Client gửi username gồm ba dấu cách. Đây vẫn là một chuỗi JSON hợp lệ.",
      "Jackson tạo được đối tượng Registration vì username có kiểu String.",
      "@NotBlank từ chối username toàn dấu cách. Spring MVC trả 400 do dữ liệu vi phạm ràng buộc.",
    ],
  },
  {
    label: "Dữ liệu hợp lệ",
    username: "an_nguyen",
    stop: 3,
    status: 200,
    notes: [
      "Client gửi username và email dưới dạng chuỗi JSON.",
      "Jackson ánh xạ hai chuỗi vào đối tượng Registration.",
      "Username đạt @NotBlank và @Size. Email đạt @NotBlank và @Email.",
      "Controller chạy và trả { \"valid\": true }. Endpoint minh họa chỉ kiểm tra dữ liệu.",
    ],
  },
];

export function ValidationWalkthrough() {
  const [scenario, setScenario] = useState(0);
  const [step, setStep] = useState(0);
  const current = cases[scenario];
  const finished = step === current.stop;

  return (
    <section className="chapter validation-walkthrough" id="mo-phong-validation" aria-labelledby="validation-walkthrough-title">
      <h2 id="validation-walkthrough-title">Mô phỏng luồng Validation</h2>
      <p>Chọn payload rồi bấm vào một bước để xem dữ liệu đi tiếp hay dừng ở đâu.</p>
      <div className="validation-scenarios" role="group" aria-label="Tình huống mô phỏng">
        {cases.map((item, index) => (
          <button type="button" key={item.label} aria-pressed={scenario === index} onClick={() => {
            setScenario(index);
            setStep(0);
          }}>
            {item.label}
          </button>
        ))}
      </div>
      <div className="validation-scene">
        <div className="validation-flow">
          <h3>Đường đi của request</h3>
          <ol className="validation-stages" aria-label="Đường đi của request">
            {stages.map((stage, index) => {
              const skipped = index > current.stop;
              return (
                <li key={stage.name} data-passed={index < step || undefined}>
                  <button
                    type="button"
                    aria-current={index === step ? "step" : undefined}
                    data-error={finished && index === step && current.status === 400 || undefined}
                    disabled={skipped}
                    onClick={() => setStep(index)}
                  >
                    <span className="validation-stage-icon" aria-hidden="true">{stage.icon}</span>
                    <strong>{stage.name}</strong>
                    <small>{skipped ? "Không chạy" : stage.action}</small>
                  </button>
                </li>
              );
            })}
          </ol>
          <p className="validation-flow-note">Jackson kiểm tra khả năng chuyển kiểu trước khi Bean Validation kiểm tra nội dung.</p>
        </div>
        <div className="validation-details">
          <div className="validation-explanation" role="status">
            <span className="eyebrow">Bước {step + 1} / {current.stop + 1}</span>
            <h3>{stages[step].title}</h3>
            <p>{current.notes[step]}</p>
            {finished && <span className="validation-result" data-error={current.status === 400}>HTTP {current.status}</span>}
          </div>
          <div className="validation-payload">
            <strong>POST /registrations/check</strong>
            <pre><code>{JSON.stringify({ username: current.username, email: "an@example.test" }, null, 2)}</code></pre>
          </div>
        </div>
      </div>
      <div className="validation-controls">
        <button type="button" disabled={step === 0} onClick={() => setStep(step - 1)}>Bước trước</button>
        <button type="button" disabled={finished} onClick={() => setStep(step + 1)}>Bước tiếp</button>
        <button type="button" onClick={() => setStep(0)}>Về đầu</button>
      </div>
    </section>
  );
}
