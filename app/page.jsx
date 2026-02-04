'use client';

import { useEffect, useState } from 'react';

const PROPERTIES = ['今魚店の家', '樹々庵', 'はぎうみ'];
const STORAGE_KEY = 'timecard_logs';

export default function Page() {
  const [selectedProperty, setSelectedProperty] = useState('');
  const [logs, setLogs] = useState([]);
  const [targetMonth, setTargetMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });

  // 初回：保存データ読み込み
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      setLogs(JSON.parse(saved));
    }
  }, []);

  // 保存
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(logs));
  }, [logs]);

  const handleClock = (type) => {
    if (!selectedProperty) {
      alert('宿を選んでください');
      return;
    }

    const now = new Date();

    setLogs((prev) => [
      {
        property: selectedProperty,
        type,
        time: now.toISOString()
      },
      ...prev
    ]);
  };

  // 対象月のログ
  const monthLogs = logs.filter((l) =>
    l.time.startsWith(targetMonth)
  );

  // 出勤〜退勤の時間差分（分）
  const calculateMinutes = (property) => {
    const list = monthLogs
      .filter((l) => l.property === property)
      .sort((a, b) => new Date(a.time) - new Date(b.time));

    let total = 0;
    let clockIn = null;

    list.forEach((l) => {
      if (l.type === '出勤') {
        clockIn = new Date(l.time);
      }
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

      {/* 月選択 */}
      <section style={{ marginBottom: 20 }}>
        <h2>対象月</h2>
        <input
          type="month"
          value={targetMonth}
          onChange={(e) => setTargetMonth(e.target.value)}
        />
      </section>

      {/* 宿選択 */}
      <section style={{ marginBottom: 20 }}>
        <h2>宿を選択</h2>
        {PROPERTIES.map((p) => (
          <button
            key={p}
            onClick={() => setSelectedProperty(p)}
            style={{
              marginRight: 10,
              padding: '8px 12px',
              backgroundColor: selectedProperty === p ? '#333' : '#eee',
              color: selectedProperty === p ? '#fff' : '#000',
              border: 'none',
              borderRadius: 4
            }}
          >
            {p}
          </button>
        ))}
      </section>

      {/* 打刻 */}
      <section style={{ marginBottom: 20 }}>
        <h2>打刻</h2>
        <button
          onClick={() => handleClock('出勤')}
          style={{ marginRight: 10, padding: '10px 16px' }}
        >
          出勤
        </button>
        <button
          onClick={() => handleClock('退勤')}
          style={{ padding: '10px 16px' }}
        >
          退勤
        </button>
      </section>

      {/* 月次集計 */}
      <section style={{ marginBottom: 20 }}>
        <h2>月次作業時間（分）</h2>
        <ul>
          {PROPERTIES.map((p) => (
            <li key={p}>
              {p}：{calculateMinutes(p)} 分
            </li>
          ))}
        </ul>
      </section>

      {/* ログ一覧 */}
      <section>
        <h2>打刻履歴（当月）</h2>
        {monthLogs.length === 0 && <p>記録なし</p>}
        <ul>
          {monthLogs.map((l, i) => (
            <li key={i}>
              [{l.property}] {l.type} –
              {new Date(l.time).toLocaleString('ja-JP')}
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
