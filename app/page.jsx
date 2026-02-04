'use client';

import { useEffect, useState } from 'react';

// ===== 設定 =====
const PROPERTIES = ['今魚店の家', '樹々庵', 'はぎうみ'];

const PROPERTY_COLORS = {
  '今魚店の家': '#8B5A2B', // 茶色
  '樹々庵': '#F4C430',     // 黄色
  'はぎうみ': '#4DB6E6',   // 水色
};

const PROPERTY_COLORS_LIGHT = {
  '今魚店の家': '#D8C3A5',
  '樹々庵': '#FBE7A1',
  'はぎうみ': '#CFEFFF',
};

const STORAGE_KEY = 'timecard_logs';
const STAFF_KEY = 'timecard_staff_name';

// ★ 最新・動作確認済み GAS WebアプリURL
const GAS_URL =
  'https://script.google.com/macros/s/AKfycbxTz79fIWEdXCCvzR2jxMq9Rsbbm_lkhaLAYOSor1dPXyijg1eht4rJTQuSe48jQUMc/exec';

export default function Page() {
  const [staffName, setStaffName] = useState('');
  const [selectedProperty, setSelectedProperty] = useState('');
  const [logs, setLogs] = useState([]);
  const [targetMonth, setTargetMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });

  // 初回読み込み
  useEffect(() => {
    const savedLogs = localStorage.getItem(STORAGE_KEY);
    if (savedLogs) setLogs(JSON.parse(savedLogs));

    const savedStaff = localStorage.getItem(STAFF_KEY);
    if (savedStaff) setStaffName(savedStaff);
  }, []);

  // ローカル保存
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(logs));
  }, [logs]);

  // スタッフ名保存
  const saveStaffName = () => {
    if (!staffName) {
      alert('スタッフ名を入力してください');
      return;
    }
    localStorage.setItem(STAFF_KEY, staffName);
  };

  // 最後の打刻
  const lastLog = logs[0];

  // 打刻処理
  const handleClock = async (type) => {
    if (!staffName) {
      alert('最初にスタッフ名を入力してください');
      return;
    }

    if (!selectedProperty) {
      alert('宿を選んでください');
      return;
    }

    // 退勤・出勤の連続防止
    if (lastLog && lastLog.type === type) {
      alert(
        type === '出勤'
          ? 'すでに出勤しています。退勤を押してください。'
          : 'すでに退勤しています。'
      );
      return;
    }

    const record = {
      staff: staffName,
      property: selectedProperty,
      type,
      time: new Date().toISOString(),
    };

    // ① 画面用
    setLogs((prev) => [record, ...prev]);

    // ② スプレッドシートへ送信
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

  // 対象月フィルタ
  const monthLogs = logs.filter((l) =>
    l.time.startsWith(targetMonth)
  );

  // 作業時間（画面表示用）
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

      {/* スタッフ名 */}
      <section style={{ marginBottom: 24 }}>
        <h2>スタッフ名</h2>
        <input
          type="text"
          value={staffName}
          placeholder="名前を入力"
          onChange={(e) => setStaffName(e.target.value)}
          style={{ fontSize: 18, padding: 8, width: '100%' }}
        />
        <button
          onClick={saveStaffName}
          style={{
            marginTop: 8,
            padding: 10,
            width: '100%',
            fontSize: 18,
          }}
        >
          保存
        </button>
      </section>

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

      {/* 宿選択（横3つ） */}
      <section style={{ marginBottom: 24 }}>
        <h2>宿を選択</h2>
        <div style={{ display: 'flex', gap: 12 }}>
          {PROPERTIES.map((p) => {
            const active = selectedProperty === p;
            return (
              <button
                key={p}
                onClick={() => setSelectedProperty(p)}
                style={{
                  flex: 1,
                  height: 64,
                  fontSize: 18,
                  fontWeight: 'bold',
                  borderRadius: 10,
                  border: 'none',
                  background: active
                    ? PROPERTY_COLORS[p]
                    : PROPERTY_COLORS_LIGHT[p],
                  color: active ? '#fff' : '#333',
                }}
              >
                {p}
              </button>
            );
          })}
        </div>
      </section>

      {/* 打刻 */}
      <section style={{ marginBottom: 32 }}>
        <button
          onClick={() => handleClock('出勤')}
          style={{
            width: '100%',
            height: 64,
            fontSize: 24,
            marginBottom: 14,
            background: '#2E7D32',
            color: '#fff',
            border: 'none',
            borderRadius: 10,
          }}
        >
          出勤
        </button>

        <button
          onClick={() => handleClock('退勤')}
          style={{
            width: '100%',
            height: 64,
            fontSize: 24,
            background: '#C62828',
            color: '#fff',
            border: 'none',
            borderRadius: 10,
          }}
        >
          退勤
        </button>
      </section>

      {/* 月次集計 */}
      <section>
        <h2>月次作業時間（分）</h2>
        <ul>
          {PROPERTIES.map((p) => (
            <li key={p} style={{ color: PROPERTY_COLORS[p], fontWeight: 'bold' }}>
              {p}：{calculateMinutes(p)} 分
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
