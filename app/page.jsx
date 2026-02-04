'use client';

import { useEffect, useState } from 'react';

// ===== 設定 =====
const PROPERTIES = ['今魚店の家', '樹々庵', 'はぎうみ'];

const PROPERTY_COLORS = {
  '今魚店の家': '#8B5A2B',
  '樹々庵': '#F4C430',
  'はぎうみ': '#4DB6E6',
};

const PROPERTY_COLORS_LIGHT = {
  '今魚店の家': '#D8C3A5',
  '樹々庵': '#FBE7A1',
  'はぎうみ': '#CFEFFF',
};

const GRAY_COLOR = '#E0E0E0';

const CLOCK_IN_COLOR = '#A5D66F';   // 黄緑
const CLOCK_OUT_COLOR = '#F4A6B8';  // ピンク

const STORAGE_KEY = 'timecard_logs';
const STAFF_KEY = 'timecard_staff_name';

const GAS_URL =
  'https://script.google.com/macros/s/AKfycbxTz79fIWEdXCCvzR2jxMq9Rsbbm_lkhaLAYOSor1dPXyijg1eht4rJTQuSe48jQUMc/exec';

export default function Page() {
  const [staffName, setStaffName] = useState('');
  const [selectedProperty, setSelectedProperty] = useState('');
  const [logs, setLogs] = useState([]);
  const [lastType, setLastType] = useState(null);

  // 初回読み込み
  useEffect(() => {
    const savedLogs = localStorage.getItem(STORAGE_KEY);
    if (savedLogs) setLogs(JSON.parse(savedLogs));

    const savedStaff = localStorage.getItem(STAFF_KEY);
    if (savedStaff) setStaffName(savedStaff);
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(logs));
  }, [logs]);

  const saveStaffName = () => {
    if (!staffName) return alert('スタッフ名を入力してください');
    localStorage.setItem(STAFF_KEY, staffName);
  };

  const handleClock = async (type) => {
    if (!staffName) return alert('スタッフ名を入力してください');
    if (!selectedProperty) return alert('宿を選んでください');
    if (lastType === type) return alert('同じボタンは続けて押せません');

    const record = {
      staff: staffName,
      property: selectedProperty,
      type,
      time: new Date().toISOString(),
    };

    setLogs((prev) => [record, ...prev]);
    setLastType(type);

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

  // 出勤〜退勤をペア表示
  const pairedLogs = [];
  let temp = null;

  logs
    .slice()
    .reverse()
    .forEach((l) => {
      if (l.type === '出勤') {
        temp = l;
      } else if (l.type === '退勤' && temp) {
        pairedLogs.push({
          property: l.property,
          start: temp.time,
          end: l.time,
        });
        temp = null;
      }
    });

  return (
    <main style={{ padding: 24, fontSize: 18 }}>
      <h1 style={{ fontSize: 28 }}>タイムカード</h1>

      {/* スタッフ名 */}
      <section style={{ marginBottom: 24 }}>
        <h2>スタッフ名</h2>
        <input
          value={staffName}
          onChange={(e) => setStaffName(e.target.value)}
          style={{ width: '100%', padding: 10, fontSize: 18 }}
        />
        <button onClick={saveStaffName} style={{ marginTop: 8, width: '100%' }}>
          保存
        </button>
      </section>

      {/* 宿選択（正方形・横3・グレーアウト） */}
      <section style={{ marginBottom: 24 }}>
        <h2>宿を選択</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
          {PROPERTIES.map((p) => {
            const isSelected = selectedProperty === p;
            const hasSelection = !!selectedProperty;

            return (
              <button
                key={p}
                onClick={() => setSelectedProperty(p)}
                style={{
                  aspectRatio: '1 / 1',
                  fontSize: 16,
                  fontWeight: 'bold',
                  borderRadius: 12,
                  border: 'none',
                  background: hasSelection
                    ? isSelected
                      ? PROPERTY_COLORS[p]
                      : GRAY_COLOR
                    : PROPERTY_COLORS_LIGHT[p],
                  color: isSelected ? '#fff' : '#333',
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
            background: lastType === '出勤' ? '#7FBF3F' : CLOCK_IN_COLOR,
            border: 'none',
            borderRadius: 12,
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
            background: lastType === '退勤' ? '#E36A8D' : CLOCK_OUT_COLOR,
            border: 'none',
            borderRadius: 12,
          }}
        >
          退勤
        </button>
      </section>

      {/* 勤務履歴 */}
      <section>
        <h2>勤務履歴</h2>
        <ul style={{ padding: 0 }}>
          {pairedLogs.map((p, i) => (
            <li
              key={i}
              style={{
                listStyle: 'none',
                padding: 12,
                marginBottom: 12,
                borderRadius: 10,
                background: '#f5f5f5',
                color: PROPERTY_COLORS[p.property],
              }}
            >
              <div style={{ fontWeight: 'bold' }}>{p.property}</div>
              <div>
                {new Date(p.start).toLocaleTimeString('ja-JP')} 〜{' '}
                {new Date(p.end).toLocaleTimeString('ja-JP')}
              </div>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
