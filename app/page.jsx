'use client';

import { useEffect, useState } from 'react';

// ===== 設定 =====
const PROPERTIES = ['今魚店の家', '樹々庵', 'はぎうみ'];

const PROPERTY_COLORS = {
  '今魚店の家': '#8B5A2B', // 茶色
  '樹々庵': '#F4C430',     // 黄色
  'はぎうみ': '#4DB6E6',   // 水色
};

const STORAGE_KEY = 'timecard_logs';

// ★ 実際に使っている GAS WebアプリURL（確定）
const GAS_URL =
  'https://script.google.com/macros/s/AKfycbzCNZTwFpGuyYsbsBR2lZ20SZMi6k-8QSX3mg-8PgIMgfJSYeJrMv8deQKKWpIXvtPR/exec';

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

    const record = {
      property: selectedProperty,
      type,
      time: new Date().toISOString(),
    };

    // ① 画面表示用に保存
    setLogs((prev) => [record, ...prev]);

    // ② GAS に送信（結果は気にしない）
    try {
      await fetch(GAS_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(record),
      });
    } catch {
      alert('通信エラー');
    }
  };

  // 対象月のログ
  const monthLogs = logs.filter((l) =>
    l.time.startsWith(targetMonth)
  );

  // 作業時間計算（分）
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
    <main style={{ padding: 24, fontSize: 18 }}>
      <h1 style={{ fontSize: 28 }}>タイムカード</h1>

      {/* 対象月 */}
      <section style={{ marginBottom: 24 }}>
        <h2>対象月</h2>
        <input
          type="month"
          value={targetMonth}
          onChange={(e) => setTargetMonth(e.target.value)}
          style={{ fontSize: 18, padding: 8 }}
        />
      </section>

      {/* 宿選択 */}
      <section style={{ marginBottom: 24 }}>
        <h2>宿を選択</h2>
        {PROPERTIES.map((p) => {
          const active = selectedProperty === p;
          return (
            <button
              key={p}
              onClick={() => setSelectedProperty(p)}
              style={{
                display: 'block',
                width: '100%',
                height: 56,
                marginBottom: 12,
                fontSize: 20,
                fontWeight: 'bold',
                borderRadius: 8,
                border: 'none',
                background: active ? PROPERTY_COLORS[p] : '#eee',
                color: active ? '#fff' : '#333',
              }}
            >
              {p}
            </button>
          );
        })}
      </section>

      {/* 打刻 */}
      <section style={{ marginBottom: 32 }}>
        <h2>打刻</h2>
        <button
          onClick={() => handleClock('出勤')}
          style={{
            width: '100%',
            height: 60,
            fontSize: 22,
            marginBottom: 12,
            background: '#2E7D32',
            color: '#fff',
            border: 'none',
            borderRadius: 8,
          }}
        >
          出勤
        </button>

        <button
          onClick={() => handleClock('退勤')}
          style={{
            width: '100%',
            height: 60,
            fontSize: 22,
            background: '#C62828',
            color: '#fff',
            border: 'none',
            borderRadius: 8,
          }}
        >
          退勤
        </button>
      </section>

      {/* 月次集計 */}
      <section style={{ marginBottom: 24 }}>
        <h2>月次作業時間（分）</h2>
        <ul>
          {PROPERTIES.map((p) => (
            <li
              key={p}
              style={{ color: PROPERTY_COLORS[p], fontWeight: 'bold' }}
            >
              {p}：{calculateMinutes(p)} 分
            </li>
          ))}
        </ul>
      </section>

      {/* 打刻履歴 */}
      <section>
        <h2>打刻履歴（当月）</h2>
        <ul style={{ padding: 0 }}>
          {monthLogs.map((l, i) => {
            const d = new Date(l.time);
            return (
              <li
                key={i}
                style={{
                  listStyle: 'none',
                  marginBottom: 16,
                  padding: 12,
                  borderRadius: 8,
                  background: '#f9f9f9',
                  lineHeight: 1.6,
                  color: PROPERTY_COLORS[l.property],
                  fontSize: 18,
                }}
              >
                <div style={{ fontWeight: 'bold' }}>
                  {l.property}（{l.type}）
                </div>
                <div>{d.toLocaleDateString('ja-JP')}</div>
                <div style={{ fontSize: 22 }}>
                  {d.toLocaleTimeString('ja-JP')}
                </div>
              </li>
            );
          })}
        </ul>
      </section>
    </main>
  );
}
