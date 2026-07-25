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
import { useColorScheme, type ChartColors } from "@/lib/use-color-scheme";

interface Props {
  candles: Candle[];
  timeframe: Timeframe;
  height?: number;
}

export function MarketChart({ candles, height = 480 }: Props) {
  const { chartColors } = useColorScheme();
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candleSeriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const volSeriesRef = useRef<ISeriesApi<"Histogram"> | null>(null);
  const ma20Ref = useRef<ISeriesApi<"Line"> | null>(null);
  const ma50Ref = useRef<ISeriesApi<"Line"> | null>(null);
  const lastCandlesRef = useRef<Candle[]>([]);

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
        background: { type: ColorType.Solid, color: "transparent" },
        textColor: chartColors.text,
        fontSize: 11,
        fontFamily: "'Geist Mono', 'Roboto Mono', ui-monospace, monospace",
      },
      grid: {
        vertLines: { color: chartColors.grid },
        horzLines: { color: chartColors.grid },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: {
          color: chartColors.crosshair,
          width: 1,
          labelBackgroundColor: chartColors.crosshair,
        },
        horzLine: {
          color: chartColors.crosshair,
          width: 1,
          labelBackgroundColor: chartColors.crosshair,
        },
      },
      rightPriceScale: {
        borderColor: chartColors.grid,
        scaleMargins: { top: 0.05, bottom: 0.15 },
      },
      timeScale: {
        borderColor: chartColors.grid,
        timeVisible: true,
        secondsVisible: false,
      },
      handleScroll: { vertTouchDrag: false },
      width: containerRef.current.clientWidth,
      height,
    });

    chartRef.current = chart;

    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: chartColors.up,
      downColor: chartColors.down,
      borderUpColor: chartColors.up,
      borderDownColor: chartColors.down,
      wickUpColor: chartColors.up,
      wickDownColor: chartColors.down,
      priceFormat: {
        type: "price",
        precision: 2,
        minMove: 0.01,
      },
    });

    candleSeriesRef.current = candleSeries;

    const volSeries = chart.addSeries(HistogramSeries, {
      color: chartColors.volUp,
      priceFormat: { type: "volume" },
      priceScaleId: "volume",
    });

    chart.priceScale("volume").applyOptions({
      scaleMargins: { top: 0.85, bottom: 0 },
      borderColor: chartColors.grid,
    });

    volSeriesRef.current = volSeries;

    const ma20Series = chart.addSeries(LineSeries, {
      color: chartColors.ma20,
      lineWidth: 2,
      priceLineVisible: false,
      lastValueVisible: false,
    });

    const ma50Series = chart.addSeries(LineSeries, {
      color: chartColors.ma50,
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
      candleSeriesRef.current = null;
      volSeriesRef.current = null;
      ma20Ref.current = null;
      ma50Ref.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [height]);

  useEffect(() => {
    if (!candleSeriesRef.current || !volSeriesRef.current || !candles.length) return;

    lastCandlesRef.current = candles;
    applyCandleData(candles, chartColors, candleSeriesRef.current, volSeriesRef.current, ma20Ref.current, ma50Ref.current, chartRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [candles]);

  useEffect(() => {
    if (!chartRef.current || !candleSeriesRef.current) return;

    chartRef.current.applyOptions({
      layout: { textColor: chartColors.text },
      grid: {
        vertLines: { color: chartColors.grid },
        horzLines: { color: chartColors.grid },
      },
      crosshair: {
        vertLine: { color: chartColors.crosshair, labelBackgroundColor: chartColors.crosshair },
        horzLine: { color: chartColors.crosshair, labelBackgroundColor: chartColors.crosshair },
      },
      rightPriceScale: { borderColor: chartColors.grid },
      timeScale: { borderColor: chartColors.grid },
    });

    candleSeriesRef.current.applyOptions({
      upColor: chartColors.up,
      downColor: chartColors.down,
      borderUpColor: chartColors.up,
      borderDownColor: chartColors.down,
      wickUpColor: chartColors.up,
      wickDownColor: chartColors.down,
    });

    ma20Ref.current?.applyOptions({ color: chartColors.ma20 });
    ma50Ref.current?.applyOptions({ color: chartColors.ma50 });

    if (volSeriesRef.current && lastCandlesRef.current.length) {
      const vdata: HistogramData<Time>[] = lastCandlesRef.current.map((c) => ({
        time: c.time as Time,
        value: c.volume,
        color: c.close >= c.open ? chartColors.volUp : chartColors.volDown,
      }));
      volSeriesRef.current.setData(vdata);
    }
  }, [chartColors]);

  return <div ref={containerRef} className="w-full" style={{ height: `${height}px` }} />;
}

function applyCandleData(
  candles: Candle[],
  colors: ChartColors,
  candleSeries: ISeriesApi<"Candlestick">,
  volSeries: ISeriesApi<"Histogram">,
  ma20Series: ISeriesApi<"Line"> | null,
  ma50Series: ISeriesApi<"Line"> | null,
  chart: IChartApi | null,
) {
  const cdata: CandlestickData<Time>[] = candles.map((c) => ({
    time: c.time as Time,
    open: c.open,
    high: c.high,
    low: c.low,
    close: c.close,
  }));

  candleSeries.setData(cdata);

  const vdata: HistogramData<Time>[] = candles.map((c) => ({
    time: c.time as Time,
    value: c.volume,
    color: c.close >= c.open ? colors.volUp : colors.volDown,
  }));

  volSeries.setData(vdata);

  const closes = candles.map((c) => c.close);
  const times = candles.map((c) => c.time);

  const ma20 = computeMA(closes, 20).map((v, i) => ({
    time: times[i + 19] as Time,
    value: v,
  }));
  ma20Series?.setData(ma20 as LineData<Time>[]);

  const ma50 = computeMA(closes, 50).map((v, i) => ({
    time: times[i + 49] as Time,
    value: v,
  }));
  ma50Series?.setData(ma50 as LineData<Time>[]);

  chart?.timeScale().fitContent();
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
