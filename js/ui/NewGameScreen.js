export function renderNewGameScreen(container, handlers) {
  container.innerHTML = `
    <div class="signboard" style="max-width:420px;">
      <h1 style="font-size:22px;">CHÀO MỪNG ĐẾN KHU PHỐ</h1>
      <p style="font-style:normal;margin-top:10px;">Bạn vừa thuê được một mặt bằng nhỏ.<br/>
      Vốn khởi nghiệp: <b>30.000.000đ</b><br/>
      Mục tiêu: <b>300.000.000đ</b> tổng tài sản<br/>
      Hãy biến tiệm nhỏ thành cửa hàng được cả khu phố yêu thích.</p>
      <div style="margin-top:16px;text-align:left;">
        <label style="font-size:13px;font-weight:700;">Tên tiệm:</label>
        <input type="text" id="storeNameInput" placeholder="VD: Tiệm Nhà Tui" maxlength="30" style="width:100%;margin-top:6px;"/>
      </div>
      <button class="btn block" id="btnLaunch" style="margin-top:16px;">🎉 KHAI TRƯƠNG</button>
      <button class="btn secondary block" id="btnBack" style="margin-top:8px;">← Quay lại</button>
    </div>
  `;
  container.querySelector('#btnLaunch').onclick = () => {
    const name = container.querySelector('#storeNameInput').value.trim() || 'Tiệm Nhà Tui';
    handlers.onConfirm(name);
  };
  container.querySelector('#btnBack').onclick = handlers.onBack;
}
