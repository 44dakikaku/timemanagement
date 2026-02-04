'use client';

import { useEffect, useState } from 'react';

// ===== 設定 =====
const STAFFS = ['北川', '小池'];

const PROPERTIES = ['今魚店の家', '樹々庵', 'はぎうみ'];

const PROPERTY_COLORS = {
  '今魚店の家': '#8B5A2B',
  '樹々庵': '#F4C430',
  'はぎうみ': '#4DB6E6',
};

const PROPERTY_COLORS_LIGHT = {
  '今魚店の家': '#EFE6DB',
  '樹々庵': '#FFF3CC',
  'はぎうみ': '#E6F6FB',
};

const CLOCK_IN_COLOR = '#BFE6A8';   // 黄緑（薄）
const CLOCK_OUT_COLOR = '#F7C1D3';  // ピンク（薄)

const STORAGE_KEY = 'timecard_logs';
const STAFF_KEY = 'timecard_staff';

const GAS_URL =
  'https://script.google.com/macros/s/AKfycbxTz79fIWEdXCCvzR2jxMq9Rsbbm_lkhaLAYOSor1dPXyijg1eht4rJTQuSe48jQUMc/exec';

export default function Page() {
  const [staff, setStaff] = useState('');
  const [staffFixed, setStaffFixed] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState('');
  const [logs, setLogs] = useState([]);
  const [lastType, setLastType] = useState(null);

  // 初回読み込み
  useEffect(() => {
    const savedStaff = localStorage.getItem(STAFF_KEY);
    if (savedStaff) {
      setStaff(savedStaff);
      setStaffFixed(true);
    }

    const savedLogs = localStorage.getItem(STORAGE_KEY);
    if (savedLogs) setLogs(JSON.parse(savedLogs));
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(logs));
  }, [logs]);

  // スタッフ確定
  const confirmStaff = () => {
    if (!staff) return alert('スタッフを選んでください');
    localStorage.setItem(STAFF_KEY, staff);
    setStaffFixed(true);
  };

  // スタッフ変更
  const resetStaff = () => {
    localStorage.removeItem(STAFF_KEY);
    setStaff('');
    setStaffFixed(false);
  };

  // 打刻
  const handleClock = async (type) => {
    if (!staffFixed) return alert('スタッフを確定してください');
    if (!selectedProperty) return alert('宿を選んでください');
    if (lastType === type) return alert('同じ操作は続けてできません');

    const record = {
      staff,
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

  // 今日の勤務履歴のみ
  const today = new Date().toISOString().slice(0, 10);

  const todayPairs = [];
  let temp = null;

  logs
    .filter((l) => l.staff === staff && l.time.startsWith(today))
    .slice()
    .reverse()
    .forEach((l) => {
      if (l.type === '出勤') temp = l;
      if (l.type === '退勤' && temp) {
        todayPairs.push({
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

      {/* スタッフ選択 */}
      <section style={{ marginBottom: 24 }}>
        <h2>スタッフ</h2>

        {!staffFixed ? (
          <>
            {STAFFS.map((s) => (
              <button
                key={s}
                onClick={() => setStaff(s)}
                style={{
                  width: '100%',
                  padding: 14,
                  marginBottom: 8,
                  fontSize: 20,
                  fontWeight: staff === s ? 'bold' : 'normal',
                }}
              >
                {s}
              </button>
            ))}
            <button onClick={confirmStaff} style={{ width: '100%', marginTop: 8 }}>
              確定
            </button>
          </>
        ) : (
          <>
            <div style={{ fontSize: 22, fontWeight: 'bold' }}>{staff}</div>
            <button onClick={resetStaff} style={{ marginTop: 8 }}>
              変更
            </button>
          </>
        )}
      </section>

      {/* 宿選択（薄いカラー） */}
      <section style={{ marginBottom: 24 }}>
        <h2>宿を選択</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
          {PROPERTIES.map((p) => (
            <button
              key={p}
              onClick={() => setSelectedProperty(p)}
              style={{
                aspectRatio: '1 / 1',
                borderRadius: 12,
                border: 'none',
                fontWeight: selectedProperty === p ? 'bold' : 'normal',
                background:
                  selectedProperty === p
                    ? PROPERTY_COLORS[p]
                    : PROPERTY_COLORS_LIGHT[p],
                color: selectedProperty === p ? '#fff' : '#333',
              }}
            >
              {p}
            </button>
          ))}
        </div>
      </section>

      {/* 打刻 */}
      <section style={{ marginBottom: 24 }}>
        <button
          onClick={() => handleClock('出勤')}
          style={{
            width: '100%',
            height: 64,
            fontSize: 24,
            marginBottom: 12,
            background: lastType === '出勤' ? '#8FCF6A' : CLOCK_IN_COLOR,
            borderRadius: 12,
            border: 'none',
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
            background: lastType === '退勤' ? '#E38AA8' : CLOCK_OUT_COLOR,
            borderRadius: 12,
            border: 'none',
          }}
        >
          退勤
        </button>
      </section>

      {/* 今日の勤務履歴のみ */}
      <section>
        <h2>今日の勤務履歴</h2>
        <ul style={{ padding: 0 }}>
          {todayPairs.map((p, i) => (
            <li
              key={i}
              style={{
                listStyle: 'none',
                padding: 12,
                marginBottom: 8,
                borderRadius: 10,
                background: '#f5f5f5',
                color: PROPERTY_COLORS[p.property],
              }}
            >
              <strong>{p.property}</strong><br />
              {new Date(p.start).toLocaleTimeString('ja-JP')} 〜{' '}
              {new Date(p.end).toLocaleTimeString('ja-JP')}
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
