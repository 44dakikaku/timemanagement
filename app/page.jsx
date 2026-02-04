'use client';

import { useEffect, useState } from 'react';

const PROPERTIES = ['今魚店の家', '樹々庵', 'はぎうみ'];
const STORAGE_KEY = 'timecard_logs';
const GAS_URL =
  'https://script.google.com/macros/s/AKfycbxxxxxxxxxxxxxxxx/exec';
export default function Page() {
  const [selectedProperty, setSelectedProperty] = useState('');
  const [logs, setLogs] = useState([]);
  const [targetMonth, setTargetMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) setLogs(JSON.parse(saved));
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(logs));
  }, [logs]);

  const handleClock = async (type) => {
    if (!selectedProperty) {
      alert('宿を選んでください');
      return;
    }

    const now = new Date();

    const record = {
      property: selectedProperty,
      type,
      time: now.toISOString()
    };

    // ① ローカル保存
    setLogs((prev) => [record, ...prev]);

    // ② GASへ送信
    try {
     const res = await fetch(GAS_URL, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(record)
});

if (!res.ok) {
  throw new Error('GAS送信失敗');
}
      console.log('sent to GAS');
    } catch (err) {
      alert('通信エラー');
      console.error(err);
    }
  };

  const monthLogs = logs.filter((l) =>
    l.time.startsWith(targetMonth)
  );

  const calculateMinutes = (property) => {
    const list = monthLogs
      .filter((l) => l.property === property)
      .sort((a, b) => new Date(a.time) - new Date(b.time));

    let total = 0;
    let clockIn = null;

    list.forEach((l) => {
      if (l.type === '出勤') clockIn = new Date(l.time);
      if (l.type === '退勤' && clockIn) {
        total += Math.floor((new Date(l.time) - clockIn) / 60000);
        clockIn = null;
      }
    });

    return total;
  };

  return (
    <main style={{ padding: 20 }}>
      <h1>タイムカード</h1>

      <input
        type="month"
        value={targetMonth}
        onChange={(e) => setTargetMonth(e.target.value)}
      />

      <h2>宿を選択</h2>
      {PROPERTIES.map((p) => (
        <button
          key={p}
          onClick={() => setSelectedProperty(p)}
          style={{
            marginRight: 10,
            background: selectedProperty === p ? '#000' : '#ccc',
            color: selectedProperty === p ? '#fff' : '#000'
          }}
        >
          {p}
        </button>
      ))}

      <h2>打刻</h2>
      <button onClick={() => handleClock('出勤')}>出勤</button>
      <button onClick={() => handleClock('退勤')}>退勤</button>

      <h2>月次作業時間（分）</h2>
      <ul>
        {PROPERTIES.map((p) => (
          <li key={p}>{p}：{calculateMinutes(p)} 分</li>
        ))}
      </ul>

      <h2>打刻履歴</h2>
      <ul>
        {monthLogs.map((l, i) => (
          <li key={i}>
            [{l.property}] {l.type} – {new Date(l.time).toLocaleString()}
          </li>
        ))}
      </ul>
    </main>
  );
}
