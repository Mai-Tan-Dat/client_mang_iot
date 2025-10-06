"use client";
import { useEffect, useState } from "react";

export default function Home() {
  const [data, setData] = useState([]);

  useEffect(() => {
    fetch(`https://server-mangiot.vercel.app/data`) 
      .then((res) => res.json())
      .then((result) => {
        setData(result.data || []);
      })
      .catch((err) => console.error(err));
  }, []);

  return (
    <main style={{ padding: "20px", fontFamily: "sans-serif" }}>
      <h1>📡 Giám sát cảm biến IoT (Edge - Cloud)</h1>
      <table border="1" cellPadding="8" style={{ marginTop: "20px", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th>Device ID</th>
            <th>Nhiệt độ (°C)</th>
            <th>Độ ẩm (%)</th>
            <th>Thời gian</th>
          </tr>
        </thead>
        <tbody>
          {data.map((item, idx) => (
            <tr key={idx}>
              <td>{item.device_id}</td>
              <td>{item.temp}</td>
              <td>{item.humi}</td>
              <td>{new Date(item.created_at).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}
