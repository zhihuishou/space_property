import React from 'react';
import styled from 'styled-components';
import SeatingLayout from './components/SeatingLayout';
import { useState, useEffect } from 'react';
import { fetchLayoutData } from './api/api';


const AppContainer = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
`;

const Title = styled.h1`
  text-align: center;
  color: #333;
  margin-bottom: 30px;
`;




function App() {
  const [titleData, setTitleData] = useState<string>('共用码');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [active, setActive] = useState('none');
  const [showSeatNumber, setShowSeatNumber] = useState(false);
  const [showOverlayValue, setShowOverlayValue] = useState(false);
  const [commonCode, setCommonCode] = useState('0438');
  const [searchInput, setSearchInput] = useState('0438');

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const data = await fetchLayoutData(commonCode);
        const newTitle = data.data?.commonCode || '共用码';
        document.title = newTitle;
        setTitleData(newTitle);
      } catch (err: any) {
        setError(err.message || '获取标题失败');
        document.title = '加载失败';
      } finally {
        setLoading(false);
      }
    };
    fetchData();
    return () => {
      document.title = '默认标题';
    };
  }, [commonCode]);

  if (loading) return <div>加载中...</div>;
  if (error) return <div>错误: {error}</div>;

  // Unified square button style
  const buttonStyle = {
    width: 100,
    height: 40,
    fontSize: 18,
    borderRadius: 5,
    backgroundColor: 'white',
    border: '1px solid #ccc',
    boxSizing: 'border-box' as const,
    cursor: 'pointer',
    padding: 0,
  };

  return (
    <div className="App">
      {/* 搜索区块 */}
      <div style={{ padding: 24, background: '#f8f8f8', borderBottom: '1px solid #eee', marginBottom: 24 }}>
        {/* 请输入4位数common code */}
        <label htmlFor="commonCodeInput" style={{ marginRight: 8 }}>请输入共用码：</label>
        <input
          id="commonCodeInput"
          type="text"
          value={searchInput}
          maxLength={4}
          onChange={e => setSearchInput(e.target.value.replace(/[^0-9]/g, ''))}
          style={{ width: 100, height: 32, fontSize: 16, marginRight: 8, borderRadius: 4, border: '1px solid #ccc', paddingLeft: 8 }}
          placeholder="如2500"
        />
        <button
          onClick={() => setCommonCode(searchInput)}
          style={{ height: 32, fontSize: 16, borderRadius: 4, border: '1px solid #ccc', background: '#fff', cursor: 'pointer' }}
        >
          搜索
        </button>
      </div>
      <AppContainer>
        <Title style={{marginTop: 80}}>{titleData}</Title>
        <div
          style={{
            marginTop: 80,
            marginBottom: 10,
            display: 'flex',
            gap: 10,

          }}
        >
          <button
            onClick={() => setActive('seatingRate')}
            style={{
              ...buttonStyle,
              backgroundColor: active === 'seatingRate' ? 'lightblue' : buttonStyle.backgroundColor,
            }}
          >
            上座率
          </button>
          <button
            onClick={() => setActive('RevPAC')}
            style={{
              ...buttonStyle,
              backgroundColor: active === 'RevPAC' ? 'lightblue' : buttonStyle.backgroundColor,
            }}
          >
            RevPAC
          </button>
          <button
            onClick={() => setActive('avgPrice')}
            style={{
              ...buttonStyle,
              backgroundColor: active === 'avgPrice' ? 'lightblue' : buttonStyle.backgroundColor,
            }}
          >
            均价
          </button>
          <button
            onClick={() => setActive('setPrice')}
            style={{
              ...buttonStyle,
              backgroundColor: active === 'setPrice' ? 'lightblue' : buttonStyle.backgroundColor,
            }}
          >
            定价
          </button>
          <button
            onClick={() => setActive('Discount')}
            style={{
              ...buttonStyle,
              backgroundColor: active === 'Discount' ? 'lightblue' : buttonStyle.backgroundColor,
            }}
          >
            折扣
          </button>
          <button
            onClick={() => setActive('none')}
            style={{
              ...buttonStyle,
              backgroundColor: active === 'none' ? 'lightblue' : buttonStyle.backgroundColor,
            }}
          >
            平面图
          </button>
        </div>
        <button
          onClick={() => {
            setShowSeatNumber(true);
            setShowOverlayValue(false);
          }}
          style={{ marginBottom: 20, marginLeft: 10, marginTop: 20, backgroundColor: showSeatNumber ? 'lightblue' : undefined }}
        >
          显示座位号
        </button>
        <button
          onClick={() => {
            setShowOverlayValue(true);
            setShowSeatNumber(false);
          }}
          style={{ marginBottom: 20, marginLeft: 10, marginTop: 20, backgroundColor: showOverlayValue ? 'lightblue' : undefined }}
        >
          显示数值
        </button>
        <SeatingLayout overlay={active as 'none' | 'seatingRate' | 'RevPAC' | 'avgPrice' | 'setPrice' | 'Discount'} showSeatNumber={showSeatNumber} showOverlayValue={showOverlayValue} commonCode={commonCode} />
      </AppContainer>
      {/* 页面其他内容 */}
    </div>

  );
}

export default App;