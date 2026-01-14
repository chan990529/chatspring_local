// src/components/StockChartRFC.jsx
import React, { useRef, useState, useEffect } from 'react';
import { ChartCanvas, Chart } from '@react-financial-charts/core';
import { CandlestickSeries } from '@react-financial-charts/series';
import { discontinuousTimeScaleProviderBuilder } from '@react-financial-charts/scales';

// Hook to measure container width (수정 없음)
const useContainerWidth = () => {
    const ref = useRef();
    const [width, setWidth] = useState(0);
    useEffect(() => {
        const ro = new ResizeObserver(entries => {
            for (let entry of entries) {
                setWidth(entry.contentRect.width);
            }
        });
        if (ref.current) ro.observe(ref.current);
        return () => ro.disconnect();
    }, []);
    return [ref, width];
};

const StockChart = ({
                        chartData,
                        stockName,
                        targetAspectRatio = 1.8
                    }) => {
    const [containerRef, width] = useContainerWidth();
    const height = width > 0 ? Math.round(width / targetAspectRatio) : 400;

    // 디버깅용 console.log는 그대로 두었습니다.
    console.log("0. 컴포넌트가 받은 초기 데이터 (chartData):", chartData);

    if (!chartData || chartData.length === 0 || width === 0) {
        return <div ref={containerRef} style={{ height: `${height}px` }}>차트 데이터를 불러오는 중...</div>;
    }

    // 데이터 처리 로직 (수정 없음)
    const parsed = chartData
        .map(d => ({
            date: new Date(
                +d.date.slice(0,4),
                +d.date.slice(4,6) - 1,
                +d.date.slice(6,8)
            ),
            open: +d.open,
            high: +d.high,
            low: +d.low,
            close: +d.close,
        }))
        .sort((a, b) => a.date.getTime() - b.date.getTime());

    console.log("1. 날짜 파싱 및 정렬 후 데이터 (parsed):", parsed);
    if (parsed.length > 0) {
        console.log("1-1. 첫 번째 요소의 date 필드 확인:", parsed[0].date, "(이것이 Date 객체여야 합니다)");
        console.log("1-2. 첫 번째 요소의 close 필드 확인:", parsed[0].close, `(타입: ${typeof parsed[0].close}, 이것이 number여야 합니다)`);
    }

    const ScaleProvider = discontinuousTimeScaleProviderBuilder()
        .inputDateAccessor(d => d.date);

    const scaleProviderOutput = ScaleProvider(parsed);
    const { data, xScale, xAccessor, displayXAccessor } = scaleProviderOutput;

    console.log("2. ScaleProvider가 생성한 최종 차트 데이터 (data):", data);
    console.log("2-1. ScaleProvider가 반환한 전체 객체:", scaleProviderOutput);

    const margin = { left: 10, right: 10, top: 10, bottom: 10 };

    // 양봉(빨강), 음봉(파랑) 색상을 결정하는 함수
    const getCandleColor = (d) => {
        // 종가(close)가 시가(open)보다 크면 양봉(상승)
        return d.close > d.open ? "#D84315" : "#1565C0";
    };

    return (
        <div ref={containerRef} style={{ width: '100%' }}>
            <h3 style={{ textAlign: 'center' }}>{stockName} 일봉 차트</h3>
            <ChartCanvas
                height={height}
                width={width}
                ratio={window.devicePixelRatio}
                margin={margin}
                data={data}
                xScale={xScale}
                xAccessor={xAccessor}
                displayXAccessor={displayXAccessor}
                seriesName={stockName}
                disableInteraction={true}
            >
                <Chart id={1} yExtents={d => [d.high, d.low]}>
                    {/* ===== 여기가 핵심 수정 부분 ===== */}
                    <CandlestickSeries
                        stroke={getCandleColor}
                        wickStroke={getCandleColor}
                        fill={getCandleColor}
                    />
                    {/* =============================== */}
                </Chart>
            </ChartCanvas>
        </div>
    );
};

export default StockChart;