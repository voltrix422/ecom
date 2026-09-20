"use client";

import { useEffect, useRef, useState } from "react";
import { Mic, Pause, Play, Square, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import { fileToDataUrlRaw } from "@/lib/image-upload";
import { cn } from "cn";

const BAR_COUNT = 48;
const MAX_VOICE_MS = 60_000;
const IDLE_PEAKS = Array.from({ length: BAR_COUNT }, () => 0.14);

function formatClipTime(seconds: number) {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const total = Math.floor(seconds);
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, "0")}`;
}

function timeDomainPeaks(data: Uint8Array, count: number) {
  const size = Math.floor(data.length / count) || 1;
  const peaks: number[] = [];
  for (let i = 0; i < count; i++) {
    let sum = 0;
    const start = i * size;
    for (let j = 0; j < size; j++) {
      const sample = ((data[start + j] ?? 128) - 128) / 128;
      sum += sample * sample;
    }
    peaks.push(Math.min(1, Math.max(0.08, Math.sqrt(sum / size) * 2.4)));
  }
  return peaks;
}

function resamplePeaks(source: number[], count: number) {
  if (!source.length) return Array.from({ length: count }, () => 0.14);
  if (source.length === count) return source;
  return Array.from({ length: count }, (_, i) => {
    const start = Math.floor((i / count) * source.length);
    const end = Math.max(start + 1, Math.floor(((i + 1) / count) * source.length));
    let max = 0;
    for (let j = start; j < end; j++) max = Math.max(max, source[j] ?? 0);
    return Math.max(0.1, max);
  });
}

async function peaksFromSrc(src: string, count: number) {
  try {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;
    const ctx = new AudioCtx();
    const response = await fetch(src);
    const raw = await response.arrayBuffer();
    const buffer = await ctx.decodeAudioData(raw.slice(0));
    const data = buffer.getChannelData(0);
    const step = Math.floor(data.length / count) || 1;
    const peaks: number[] = [];
    for (let i = 0; i < count; i++) {
      let max = 0;
      const start = i * step;
      for (let j = 0; j < step; j += 12) {
        const value = Math.abs(data[start + j] ?? 0);
        if (value > max) max = value;
      }
      peaks.push(max);
    }
    await ctx.close();
    const peak = Math.max(...peaks, 0.08);
    return peaks.map((value) => Math.max(0.12, value / peak));
  } catch {
    return IDLE_PEAKS;
  }
}

function Waveform({
  peaks,
  progress,
  live,
  onSeek,
}: {
  peaks: number[];
  progress?: number;
  live?: boolean;
  onSeek?: (ratio: number) => void;
}) {
  return (
    <div
      role={onSeek ? "slider" : undefined}
      aria-valuemin={onSeek ? 0 : undefined}
      aria-valuemax={onSeek ? 100 : undefined}
      aria-valuenow={
        onSeek && progress != null ? Math.round(progress * 100) : undefined
      }
      aria-label={onSeek ? "Voice note position" : undefined}
      tabIndex={onSeek ? 0 : undefined}
      className={cn(
        "flex h-8 min-w-0 flex-1 items-center gap-px overflow-hidden",
        onSeek && "cursor-pointer"
      )}
      onClick={
        onSeek
          ? (event) => {
              const rect = event.currentTarget.getBoundingClientRect();
              onSeek(
                Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width))
              );
            }
          : undefined
      }
    >
      {peaks.map((peak, index) => {
        const ratio = (index + 0.5) / peaks.length;
        const filled = live || (progress != null && ratio <= progress);
        return (
          <span
            key={index}
            className={cn(
              "w-[2px] min-h-[3px] rounded-full transition-[height,background-color] duration-75",
              filled ? "bg-foreground" : "bg-foreground/20"
            )}
            style={{ height: `${Math.round(Math.max(12, peak * 100))}%` }}
          />
        );
      })}
    </div>
  );
}

export function VoicePlayer({
  src,
  onRemove,
  className,
}: {
  src: string;
  onRemove?: () => void;
  className?: string;
}) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [peaks, setPeaks] = useState(IDLE_PEAKS);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setPeaks(IDLE_PEAKS);
    setPlaying(false);
    setProgress(0);
    setCurrent(0);
    peaksFromSrc(src, BAR_COUNT).then((next) => {
      if (!cancelled) setPeaks(next);
    });
    return () => {
      cancelled = true;
    };
  }, [src]);

  function togglePlay() {
    const el = audioRef.current;
    if (!el) return;
    if (el.paused) {
      void el.play();
      setPlaying(true);
    } else {
      el.pause();
      setPlaying(false);
    }
  }

  function seek(ratio: number) {
    const el = audioRef.current;
    if (!el || !Number.isFinite(el.duration)) return;
    el.currentTime = ratio * el.duration;
    setProgress(ratio);
    setCurrent(el.currentTime);
  }

  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <audio
        ref={audioRef}
        src={src}
        preload="metadata"
        className="hidden"
        onTimeUpdate={(event) => {
          const el = event.currentTarget;
          const nextDuration = el.duration || 0;
          setDuration(nextDuration);
          setCurrent(el.currentTime);
          setProgress(nextDuration ? el.currentTime / nextDuration : 0);
        }}
        onLoadedMetadata={(event) => {
          setDuration(event.currentTarget.duration || 0);
        }}
        onEnded={() => {
          setPlaying(false);
          setProgress(0);
          setCurrent(0);
        }}
      />
      <button
        type="button"
        onClick={togglePlay}
        aria-label={playing ? "Pause voice note" : "Play voice note"}
        className="flex size-8 shrink-0 items-center justify-center bg-foreground text-background"
      >
        {playing ? (
          <Pause className="size-3.5 fill-current" />
        ) : (
          <Play className="size-3.5 translate-x-px fill-current" />
        )}
      </button>
      <Waveform peaks={peaks} progress={progress} onSeek={seek} />
      <span className="w-9 shrink-0 text-right font-mono text-[11px] tabular-nums text-muted-foreground">
        {formatClipTime(playing || current > 0 ? current : duration)}
      </span>
      {onRemove ? (
        <button
          type="button"
          onClick={onRemove}
          aria-label="Remove voice note"
          className="text-muted-foreground hover:text-foreground"
        >
          <Trash2 className="size-3.5" />
        </button>
      ) : null}
    </div>
  );
}

export function VoiceRecorder({
  value,
  onChange,
}: {
  value: string | null;
  onChange: (next: string | null) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const historyRef = useRef<number[]>([]);
  const timerRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const startedAtRef = useRef(0);
  const aliveRef = useRef(true);

  const [recording, setRecording] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [livePeaks, setLivePeaks] = useState(IDLE_PEAKS);

  useEffect(() => {
    aliveRef.current = true;
    return () => {
      aliveRef.current = false;
      stopCapture(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function stopCapture(commit: boolean) {
    if (timerRef.current) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    if (audioCtxRef.current) {
      void audioCtxRef.current.close();
      audioCtxRef.current = null;
    }
    analyserRef.current = null;
    const recorder = recorderRef.current;
    if (recorder && recorder.state !== "inactive") {
      if (!commit) {
        recorder.ondataavailable = null;
        recorder.onstop = null;
      }
      recorder.stop();
      recorder.stream.getTracks().forEach((track) => track.stop());
    }
    recorderRef.current = null;
    if (!commit) setRecording(false);
  }

  function tickAnalyser() {
    const analyser = analyserRef.current;
    if (!analyser) return;
    const data = new Uint8Array(analyser.fftSize);
    analyser.getByteTimeDomainData(data);
    const peaks = timeDomainPeaks(data, BAR_COUNT);
    setLivePeaks(peaks);
    const energy =
      peaks.reduce((sum, value) => sum + value, 0) / Math.max(peaks.length, 1);
    historyRef.current.push(energy);
    setElapsed((Date.now() - startedAtRef.current) / 1000);
    rafRef.current = requestAnimationFrame(tickAnalyser);
  }

  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mime = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : MediaRecorder.isTypeSupported("audio/mp4")
          ? "audio/mp4"
          : "";
      const recorder = mime
        ? new MediaRecorder(stream, { mimeType: mime })
        : new MediaRecorder(stream);
      chunksRef.current = [];
      historyRef.current = [];
      recorder.ondataavailable = (event) => {
        if (event.data.size) chunksRef.current.push(event.data);
      };
      recorder.onstop = async () => {
        stream.getTracks().forEach((track) => track.stop());
        if (!aliveRef.current) return;
        const blob = new Blob(chunksRef.current, {
          type: recorder.mimeType || "audio/webm",
        });
        if (!blob.size) {
          setRecording(false);
          return;
        }
        const ext = blob.type.includes("mp4") ? "m4a" : "webm";
        const file = new File([blob], `voice.${ext}`, { type: blob.type });
        onChange(await fileToDataUrlRaw(file));
        setRecording(false);
        setLivePeaks(resamplePeaks(historyRef.current, BAR_COUNT));
      };

      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext;
      const ctx = new AudioCtx();
      if (ctx.state === "suspended") await ctx.resume();
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.55;
      source.connect(analyser);
      audioCtxRef.current = ctx;
      analyserRef.current = analyser;

      recorderRef.current = recorder;
      startedAtRef.current = Date.now();
      setElapsed(0);
      setLivePeaks(IDLE_PEAKS);
      recorder.start();
      setRecording(true);
      tickAnalyser();
      timerRef.current = window.setTimeout(() => stopRecording(), MAX_VOICE_MS);
    } catch {
      toast.error("Microphone is not available. Upload an audio file instead.");
    }
  }

  function stopRecording() {
    stopCapture(true);
  }

  async function addVoiceFile(files: FileList | null) {
    const file = files?.[0];
    if (!file) return;
    if (!file.type.startsWith("audio/")) {
      toast.error("Choose an audio file");
      return;
    }
    onChange(await fileToDataUrlRaw(file));
    if (fileRef.current) fileRef.current.value = "";
  }

  return (
    <div>
      <input
        ref={fileRef}
        type="file"
        accept="audio/*"
        className="hidden"
        onChange={(event) => addVoiceFile(event.target.files)}
      />

      {value && !recording ? (
        <VoicePlayer src={value} onRemove={() => onChange(null)} />
      ) : recording ? (
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={stopRecording}
            aria-label="Stop recording"
            className="relative flex size-8 shrink-0 items-center justify-center overflow-hidden bg-red-600 text-white"
          >
            <span className="absolute size-8 animate-ping rounded-full bg-red-500/70" />
            <Square className="relative size-3 fill-current" />
          </button>
          <Waveform peaks={livePeaks} live />
          <span className="w-9 shrink-0 text-right font-mono text-[11px] tabular-nums text-red-600">
            {formatClipTime(elapsed)}
          </span>
        </div>
      ) : (
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={startRecording}
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
          >
            <Mic className="size-3.5" />
            Record
          </button>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
          >
            <Upload className="size-3.5" />
            Upload
          </button>
        </div>
      )}
    </div>
  );
}
