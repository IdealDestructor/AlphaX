"use client";

import { useCallback, useEffect, useRef } from "react";
import {
  createChart,
  ColorType,
  CrosshairMode,
  CandlestickSeries,
  LineSeries,
  HistogramSeries,
  type IChartApi,
  type ISeriesApi,
  type CandlestickData,
  type LineData,
  type HistogramData,
  type Time,
} from "lightweight-charts";
import type { Candle, Timeframe } from "@/features/market/types";

const colors = {
  bg: "transparent",
  text: "#6b7689",
  grid: "#1e2633",
  up: "#22c55e",
  down: "#ef4444",
  volUp: "#22c55e33",
  volDown: "#ef444433",
  crosshair: "#3ecf8e",
  ma20: "#f59e0b",
  ma50: "#8b5cf6",
};

interface Props {
  candles: Candle[];
  timeframe: Timeframe;
  height?: number;
}

export function MarketChart({ candles, height = 480 }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candleSeriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const volSeriesRef = useRef<ISeriesApi<"Histogram"> | null>(null);
  const ma20Ref = useRef<ISeriesApi<"Line"> | null>(null);
  const ma50Ref = useRef<ISeriesApi<"Line"> | null>(null);

  const handleResize = useCallback(() => {
    if (chartRef.current && containerRef.current) {
      chartRef.current.applyOptions({
        width: containerRef.current.clientWidth,
      });
    }
  }, []);

  useEffect(() => {
    if (!containerRef.current) return;

    const chart = createChart(containerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: colors.bg },
        textColor: colors.text,
        fontSize: 11,
        fontFamily: "'Geist Mono', 'Roboto Mono', ui-monospace, monospace",
      },
      grid: {
        vertLines: { color: colors.grid },
        horzLines: { color: colors.grid },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: {
          color: colors.crosshair,
          width: 1,
          labelBackgroundColor: colors.crosshair,
        },
        horzLine: {
          color: colors.crosshair,
          width: 1,
          labelBackgroundColor: colors.crosshair,
        },
      },
      rightPriceScale: {
        borderColor: colors.grid,
        scaleMargins: { top: 0.05, bottom: 0.15 },
      },
      timeScale: {
        borderColor: colors.grid,
        timeVisible: true,
        secondsVisible: false,
      },
      handleScroll: { vertTouchDrag: false },
      width: containerRef.current.clientWidth,
      height,
    });

    chartRef.current = chart;

    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: colors.up,
      downColor: colors.down,
      borderUpColor: colors.up,
      borderDownColor: colors.down,
      wickUpColor: colors.up,
      wickDownColor: colors.down,
      priceFormat: {
        type: "price",
        precision: 2,
        minMove: 0.01,
      },
    });

    candleSeriesRef.current = candleSeries;

    const volSeries = chart.addSeries(HistogramSeries, {
      color: colors.volUp,
      priceFormat: { type: "volume" },
      priceScaleId: "volume",
    });

    chart.priceScale("volume").applyOptions({
      scaleMargins: { top: 0.85, bottom: 0 },
      borderColor: colors.grid,
    });

    volSeriesRef.current = volSeries;

    const ma20Series = chart.addSeries(LineSeries, {
      color: colors.ma20,
      lineWidth: 2,
      priceLineVisible: false,
      lastValueVisible: false,
    });

    const ma50Series = chart.addSeries(LineSeries, {
      color: colors.ma50,
      lineWidth: 2,
      priceLineVisible: false,
      lastValueVisible: false,
    });

    ma20Ref.current = ma20Series;
    ma50Ref.current = ma50Series;

    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
      chart.remove();
      chartRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [height]);

  useEffect(() => {
    if (!candleSeriesRef.current || !volSeriesRef.current || !candles.length) return;

    const cdata: CandlestickData<Time>[] = candles.map((c) => ({
      time: c.time as Time,
      open: c.open,
      high: c.high,
      low: c.low,
      close: c.close,
    }));

    candleSeriesRef.current.setData(cdata);

    const vdata: HistogramData<Time>[] = candles.map((c) => ({
      time: c.time as Time,
      value: c.volume,
      color: c.close >= c.open ? colors.volUp : colors.volDown,
    }));

    volSeriesRef.current.setData(vdata);

    const closes = candles.map((c) => c.close);
    const times = candles.map((c) => c.time);

    const ma20 = computeMA(closes, 20).map((v, i) => ({
      time: times[i + 19] as Time,
      value: v,
    }));
    ma20Ref.current?.setData(ma20 as LineData<Time>[]);

    const ma50 = computeMA(closes, 50).map((v, i) => ({
      time: times[i + 49] as Time,
      value: v,
    }));
    ma50Ref.current?.setData(ma50 as LineData<Time>[]);

    chartRef.current?.timeScale().fitContent();
  }, [candles]);

  return <div ref={containerRef} className="w-full" style={{ height: `${height}px` }} />;
}

function computeMA(values: number[], period: number): number[] {
  const result: number[] = [];
  for (let i = period - 1; i < values.length; i++) {
    let sum = 0;
    for (let j = 0; j < period; j++) sum += values[i - j]!;
    result.push(sum / period);
  }
  return result;
}
