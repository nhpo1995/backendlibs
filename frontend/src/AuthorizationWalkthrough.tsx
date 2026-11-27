import { useState } from "react";

const scenarios = [
  {
    name: "Reader đọc nhóm",
    request: "GET /api/groups",
    identity: "reader · đã xác thực",
    rule: "GET /api/groups → authenticated()",
    method: "Thao tác đọc không gọi method gửi lời mời.",
    resource: "Áp dụng hợp đồng đọc của endpoint.",
    outcome: "Qua phân quyền. Controller tiếp tục thao tác đọc.",
  },
  {
    name: "Reader gửi lời mời",
    request: "POST /api/groups/42/invitations",
    identity: "reader · thiếu groups:invite",
    rule: "POST lời mời → qua vì đã xác thực.",
    method: "Dừng ở @PreAuthorize, vì thiếu groups:invite và ADMIN.",
    resource: "Chưa tra quyền trên nhóm. Thân method chưa chạy.",
    outcome: "HTTP 403 trong policy minh họa. Không ghi lời mời.",
  },
  {
    name: "Owner khác nhóm gửi lời mời",
    request: "POST /api/groups/42/invitations",
    identity: "owner-ops · có groups:invite",
    rule: "POST lời mời → qua vì đã xác thực.",
    method: "@PreAuthorize cho qua vì có groups:invite.",
    resource: "Từ chối vì nhóm 42 thuộc owner-backend.",
    outcome: "HTTP 403 trong policy minh họa. Không ghi lời mời.",
  },
  {
    name: "Owner của nhóm gửi lời mời",
    request: "POST /api/groups/42/invitations",
    identity: "owner-backend · có groups:invite",
    rule: "POST lời mời → qua vì đã xác thực.",
    method: "@PreAuthorize cho qua vì có groups:invite.",
    resource: "Cho qua vì caller sở hữu nhóm 42.",
    outcome: "Qua phân quyền. Use case tiếp tục kiểm tra nghiệp vụ trước khi ghi.",
  },
];

export function AuthorizationWalkthrough() {
  const [selected, setSelected] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const scenario = scenarios[selected];
  return (
    <section className="chapter validation-walkthrough" id="mo-phong-phan-quyen">
      <h2>Mô phỏng quyết định phân quyền</h2>
      <p>Dự đoán request đi đến tầng nào. Mô hình yêu cầu đăng nhập ở HTTP, quyền gửi lời mời ở service và quyền trên nhóm Backend có ID 42. Các ca POST giả định CSRF và body hợp lệ.</p>
      <div className="validation-scenarios" role="group" aria-label="Tình huống phân quyền">
        {scenarios.map((item, index) => (
          <button key={item.name} type="button" aria-pressed={index === selected}
            onClick={() => { setSelected(index); setRevealed(false); }}>
            {item.name}
          </button>
        ))}
      </div>
      <div className="callout">
        <p><code>{scenario.request}</code></p>
        <p>Danh tính: {scenario.identity}</p>
        <button type="button" aria-expanded={revealed} aria-controls="authorization-outcome"
          onClick={() => setRevealed(!revealed)}>
          {revealed ? "Ẩn kết quả" : "Xem quyết định"}
        </button>
      </div>
      <div id="authorization-outcome" hidden={!revealed}>
        <ol className="core-flow" aria-label="Các lớp ra quyết định">
          <li><strong>Chọn chain</strong><span>Chain API khớp /api/**.</span></li>
          <li><strong>Xét rule HTTP</strong><span>{scenario.rule}</span></li>
          <li><strong>Xét method security</strong><span>{scenario.method}</span></li>
          <li><strong>Kiểm tra quyền trên nhóm</strong><span>{scenario.resource}</span></li>
        </ol>
        <p role="status">{revealed ? scenario.outcome : ""}</p>
      </div>
    </section>
  );
}
