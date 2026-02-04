'use client';

import { useEffect, useState } from 'react';

const PROPERTIES = ['今魚店の家', '樹々庵', 'はぎうみ'];
const STORAGE_KEY = 'timecard_logs';

const GAS_URL =
  'https://script.google.com/macros/s/AKfycbzwQ2ARHjnncmSRdap2EQJ0sh6Mj67x8k-d9z0olqhAaAjlUGrw8sKTGEhsdbhfsPVB/exec';

export default function Page() {
  const [selectedProperty, setSelectedProperty] = useState('');
  const [logs, setLogs] = useState([]);
  const [targetMonth, setTargetMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });

  // 初回読み込み
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) setLogs(JSON.parse(saved));
  }, []);

  // 保存
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
    const log = {
      property: selectedProperty,
      type,
      time: now.toISOString(),
    };

    // 画面用
    setLogs((prev) => [log, ...prev]);

    // Googleへ送信
    try {
      await fetch(GAS_URL, {
  method: 'POST',
  mode: 'no-cors',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(log),
});
    } catch (e) {
      alert('通信エラー');
    }
  };

  // 対象月のログ
  const monthLogs = logs.filter((l) =>
    l.time.startsWith(targetMonth)
  );

  // 分数計算
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

      <section>
        <h2>対象月</h2>
        <input
          type="month"
          value={targetMonth}
          onChange={(e) => setTargetMonth(e.target.value)}
        />
      </section>

      <section>
        <h2>宿を選択</h2>
        {PROPERTIES.map((p) => (
          <button
            key={p}
            onClick={() => setSelectedProperty(p)}
            style={{
              marginRight: 8,
              padding: '8px 12px',
              background: selectedProperty === p ? '#333' : '#eee',
              color: selectedProperty === p ? '#fff' : '#000',
            }}
          >
            {p}
          </button>
        ))}
      </section>

      <section>
        <h2>打刻</h2>
        <button onClick={() => handleClock('出勤')}>出勤</button>
        <button onClick={() => handleClock('退勤')}>退勤</button>
      </section>

      <section>
        <h2>月次作業時間（分）</h2>
        <ul>
          {PROPERTIES.map((p) => (
            <li key={p}>
              {p}：{calculateMinutes(p)} 分
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2>打刻履歴</h2>
        <ul>
          {monthLogs.map((l, i) => (
            <li key={i}>
              [{l.property}] {l.type} –{' '}
              {new Date(l.time).toLocaleString('ja-JP')}
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
