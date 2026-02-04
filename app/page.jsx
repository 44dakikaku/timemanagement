'use client';

import { useEffect, useState } from 'react';

// ===== 設定 =====
const PROPERTIES = ['今魚店の家', '樹々庵', 'はぎうみ'];
const STORAGE_KEY = 'timecard_logs';

// ★ 最新の GAS WebアプリURL（そのまま組み込み済み）
const GAS_URL = 'https://script.google.com/macros/s/AKfycb.../exec';

export default function Page() {
  const [selectedProperty, setSelectedProperty] = useState('');
  const [logs, setLogs] = useState([]);
  const [targetMonth, setTargetMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });

  // 初回：ローカル保存データ読み込み
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) setLogs(JSON.parse(saved));
  }, []);

  // ローカル保存
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(logs));
  }, [logs]);

  // 打刻処理
  const handleClock = async (type) => {
    if (!selectedProperty) {
      alert('宿を選んでください');
      return;
    }

    const now = new Date();

    const record = {
      property: selectedProperty,
      type,
      time: now.toISOString(),
    };

    // ① まずローカルに保存（画面用）
    setLogs((prev) => [record, ...prev]);

    // ② Google Apps Script に送信
    try {
      const res = await fetch(GAS_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(record),
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

  // 対象月のログのみ
  const monthLogs = logs.filter((l) =>
    l.time.startsWith(targetMonth)
  );

  // 出勤〜退勤の合計分数
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

      <h2>対象月</h2>
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
            padding: '8px 12px',
            background: selectedProperty === p ? '#000' : '#ccc',
            color: selectedProperty === p ? '#fff' : '#000',
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
          <li key={p}>
            {p}：{calculateMinutes(p)} 分
          </li>
        ))}
      </ul>

      <h2>打刻履歴（当月）</h2>
      <ul>
        {monthLogs.map((l, i) => (
          <li key={i}>
            [{l.property}] {l.type} –{' '}
            {new Date(l.time).toLocaleString('ja-JP')}
          </li>
        ))}
      </ul>
    </main>
  );
}
