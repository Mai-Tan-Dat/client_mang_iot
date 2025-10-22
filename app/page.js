"use client";
import { useEffect, useState } from "react";

export default function Home() {
  const [data, setData] = useState([]);
  const [ledStatus, setLedStatus] = useState(false);
  const [threshold, setThreshold] = useState(30);
  const [thresholdInput, setThresholdInput] = useState(30);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  const deviceId = "24:0A:C4:00:01:10";

  const fetchSensorData = async () => {
    try {
      const res = await fetch("https://server-mangiot.vercel.app/data");
      const result = await res.json();
      setData(result.data || []);
    } catch (err) {
      console.error("❌ Lỗi khi lấy dữ liệu cảm biến:", err);
    }
  };

  useEffect(() => {
    fetchSensorData();
    const interval = setInterval(fetchSensorData, 3000); 

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    fetch("https://server-mangiot.vercel.app/data-device", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id_device: deviceId }),
    })
      .then((res) => res.json())
      .then((result) => {
        if (result.data?.length) {
          const info = result.data[0];
          setLedStatus(Boolean(info.led_control));
          setThreshold(info.threshold_control ?? 30);
          setThresholdInput(info.threshold_control ?? 30);
        }
      })
      .catch((err) => console.error("❌ Lỗi khi lấy dữ liệu thiết bị:", err));
  }, []);

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentData = data.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(data.length / itemsPerPage);
  const handlePrevPage = () => currentPage > 1 && setCurrentPage(currentPage - 1);
  const handleNextPage = () => currentPage < totalPages && setCurrentPage(currentPage + 1);

  // 💡 Điều khiển LED
  const handleToggleLed = async () => {
    const newStatus = !ledStatus;
    setLedStatus(newStatus);
    try {
      const response = await fetch("https://server-mangiot.vercel.app/control-led", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id_device: deviceId,
          led_control: newStatus,
        }),
      });
      const result = await response.json();
      console.log("Kết quả từ server:", result);
    } catch (err) {
      console.error("❌ Lỗi khi gửi điều khiển LED:", err);
    }
  };

  const handleSetThreshold = async () => {
    try {
      const response = await fetch("https://server-mangiot.vercel.app/update-threshold", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id_device: deviceId,
          new_threshold: thresholdInput,
        }),
      });
      const result = await response.json();
      console.log("✅ Ngưỡng đã cập nhật:", result);
      setThreshold(thresholdInput);
      alert(`✅ Ngưỡng mới: ${thresholdInput}°C`);
    } catch (err) {
      console.error("❌ Lỗi khi cập nhật ngưỡng:", err);
    }
  };

  return (
    <main className="p-8 bg-gray-50 min-h-screen font-sans">
      <h1 className="text-3xl font-bold text-center text-blue-700 mb-10">
        🌤️ Giám sát & Điều khiển IoT (Edge - Cloud)
      </h1>

      <div className="grid md:grid-cols-2 gap-8">
        {/* ================= BẢNG DỮ LIỆU ================= */}
        <section className="bg-white shadow-lg rounded-xl p-6">
          <h2 className="text-2xl font-semibold text-blue-600 mb-4 text-center">
            📊 Dữ liệu cảm biến
          </h2>

          <div className="overflow-x-auto">
            <table className="min-w-full border border-gray-300 rounded-lg">
              <thead className="bg-blue-600 text-white">
                <tr>
                  <th className="px-4 py-2 text-left">Device ID</th>
                  <th className="px-4 py-2 text-left">Nhiệt độ (°C)</th>
                  <th className="px-4 py-2 text-left">Độ ẩm (%)</th>
                  <th className="px-4 py-2 text-left">Thời gian</th>
                </tr>
              </thead>
              <tbody>
                {currentData.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="text-center py-4 text-gray-500">
                      ⏳ Chưa có dữ liệu
                    </td>
                  </tr>
                ) : (
                  currentData.map((item, idx) => (
                    <tr
                      key={idx}
                      className={`${
                        idx % 2 === 0 ? "bg-gray-50" : "bg-white"
                      } hover:bg-blue-50 transition`}
                    >
                      <td className="px-4 py-2">{item.device_id}</td>
                      <td
                        className={`px-4 py-2 font-semibold ${
                          item.temp > threshold
                            ? "text-red-600"
                            : "text-gray-700"
                        }`}
                      >
                        {item.temp}°C
                      </td>
                      <td className="px-4 py-2">{item.humi}%</td>
                      <td className="px-4 py-2 text-sm text-gray-500">
                        {new Date(item.created_at).toLocaleString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* ✅ PHÂN TRANG */}
          {data.length > itemsPerPage && (
            <div className="flex justify-center items-center mt-4 gap-4">
              <button
                onClick={handlePrevPage}
                disabled={currentPage === 1}
                className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50"
              >
                Trước
              </button>
              <span className="text-gray-700 font-medium">
                Trang {currentPage} / {totalPages}
              </span>
              <button
                onClick={handleNextPage}
                disabled={currentPage === totalPages}
                className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50"
              >
                Sau
              </button>
            </div>
          )}
        </section>

        {/* ================= ĐIỀU KHIỂN LED ================= */}
        <section className="bg-white shadow-lg rounded-xl p-6 flex flex-col items-center justify-center">
          <h2 className="text-2xl font-semibold text-blue-600 mb-6">
            💡 Điều khiển đèn ESP32
          </h2>

          <div
            className={`w-40 h-40 rounded-full shadow-inner mb-6 flex items-center justify-center transition ${
              ledStatus ? "bg-yellow-300 shadow-yellow-400" : "bg-gray-300"
            }`}
          >
            <span className="text-xl font-semibold text-gray-800">
              {ledStatus ? "BẬT" : "TẮT"}
            </span>
          </div>

          <button
            onClick={handleToggleLed}
            className={`px-6 py-3 text-lg font-semibold text-white rounded-lg shadow-md transition ${
              ledStatus
                ? "bg-red-500 hover:bg-red-600"
                : "bg-green-500 hover:bg-green-600"
            }`}
          >
            {ledStatus ? "Tắt đèn" : "Bật đèn"}
          </button>

          {/* ✅ INPUT NGƯỠNG NHIỆT ĐỘ */}
          <div className="mt-8 w-full text-center">
            <h3 className="text-xl font-semibold text-gray-700 mb-3">
              🌡️ Cài đặt ngưỡng nhiệt độ
            </h3>
            <div className="flex justify-center items-center gap-3">
              <input
                type="number"
                value={thresholdInput ?? ""}
                onChange={(e) => setThresholdInput(Number(e.target.value))}
                className="w-32 px-3 py-2 border border-gray-300 rounded-lg text-center focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
              <button
                onClick={handleSetThreshold}
                className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-lg shadow-md"
              >
                Xác nhận
              </button>
            </div>
            <p className="text-sm text-gray-500 mt-2">
              Ngưỡng đang áp dụng:{" "}
              <span className="font-semibold text-blue-600">
                {threshold}°C
              </span>
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
