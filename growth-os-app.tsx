"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { generateMonthlyReport, getLatestEvaluation, getThisMonthData } from "../lib/report";
import { initialData } from "../lib/sample-data";
import {
  demandLabels,
  nutritionLabels,
  type DemandEvaluation,
  type DemandKey,
  type GrowthData,
  type MatchLog,
  type NutritionKey,
  type PracticeLog,
} from "../lib/types";

type Screen = "dashboard" | "profile" | "practice" | "match" | "report";

const screens: {
  id: Screen;
  label: string;
  title: string;
  role: string;
  action: string;
}[] = [
  {
    id: "dashboard",
    label: "ホーム",
    title: "全体を見る",
    role: "現在地と次にやることを確認",
    action: "まず見る",
  },
  {
    id: "profile",
    label: "選手",
    title: "選手を整える",
    role: "目標・特徴・保護者メモ",
    action: "プロフィール",
  },
  {
    id: "practice",
    label: "練習",
    title: "練習を残す",
    role: "良かった点・課題・次の練習",
    action: "練習入力",
  },
  {
    id: "match",
    label: "試合",
    title: "試合を振り返る",
    role: "結果・課題・実戦の学び",
    action: "試合入力",
  },
  {
    id: "report",
    label: "月報",
    title: "月報を読む",
    role: "保護者・指導者向けコメント",
    action: "月報確認",
  },
];

const demandKeys = Object.keys(demandLabels) as DemandKey[];
const nutritionKeys = Object.keys(nutritionLabels) as NutritionKey[];
const storageKey = "ksla-growth-os-7s-demand-v1";

function today() {
  return new Date().toISOString().slice(0, 10);
}

function makeId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function clampScore(value: number) {
  return Math.max(0, Math.min(100, value || 0));
}

function scoreTone(score: number) {
  if (score >= 75) return "bg-court";
  if (score >= 55) return "bg-amber-500";
  return "bg-rose-500";
}

function scoreLabel(score?: number) {
  if (score === undefined) return "未評価";
  if (score >= 75) return "強み";
  if (score >= 55) return "安定";
  return "重点";
}

function Panel({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <section className={`rounded-2xl border border-stone-200 bg-white p-4 shadow-soft ${className}`}>
      {children}
    </section>
  );
}

function SectionTitle({
  eyebrow,
  title,
  copy,
}: {
  eyebrow?: string;
  title: string;
  copy?: string;
}) {
  return (
    <div className="grid gap-1.5">
      {eyebrow && <p className="text-xs font-black uppercase tracking-[0.14em] text-court">{eyebrow}</p>}
      <h2 className="text-xl font-black leading-snug text-ink">{title}</h2>
      {copy && <p className="text-base leading-7 text-stone-600">{copy}</p>}
    </div>
  );
}

function Field({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) {
  return (
    <label className="grid gap-2 text-base font-bold text-stone-800">
      {label}
      {children}
      {hint && <span className="text-sm font-medium leading-6 text-stone-500">{hint}</span>}
    </label>
  );
}

function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className="min-h-14 rounded-xl border border-stone-300 bg-white px-4 text-base text-ink outline-none transition placeholder:text-stone-400 focus:border-court focus:ring-4 focus:ring-court/15"
    />
  );
}

function TextArea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className="min-h-32 rounded-xl border border-stone-300 bg-white px-4 py-3 text-base leading-8 text-ink outline-none transition placeholder:text-stone-400 focus:border-court focus:ring-4 focus:ring-court/15"
    />
  );
}

function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className="min-h-14 rounded-xl border border-stone-300 bg-white px-4 text-base text-ink outline-none transition focus:border-court focus:ring-4 focus:ring-court/15"
    />
  );
}

function PrimaryButton({ children, onClick }: { children: ReactNode; onClick?: () => void }) {
  return (
    <button
      type={onClick ? "button" : "submit"}
      onClick={onClick}
      className="min-h-14 rounded-xl bg-court px-5 text-base font-black text-white shadow-sm transition active:scale-[0.99]"
    >
      {children}
    </button>
  );
}

function SecondaryButton({ children, onClick }: { children: ReactNode; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="min-h-12 rounded-xl border border-stone-300 bg-white px-4 text-sm font-black text-ink transition active:scale-[0.99]"
    >
      {children}
    </button>
  );
}

function ScoreSlider({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
}) {
  const safeValue = clampScore(value);

  return (
    <div className="rounded-2xl border border-stone-200 bg-stone-50 p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <span className="block font-black text-ink">{label}</span>
          <span className="text-xs font-bold text-stone-500">{scoreLabel(safeValue)}</span>
        </div>
        <input
          type="number"
          min={0}
          max={100}
          value={safeValue}
          onChange={(event) => onChange(clampScore(Number(event.target.value)))}
          className="h-11 w-20 rounded-xl border border-stone-300 px-2 text-right text-base font-black"
        />
      </div>
      <input
        type="range"
        min={0}
        max={100}
        value={safeValue}
        onChange={(event) => onChange(Number(event.target.value))}
        className="w-full accent-court"
      />
    </div>
  );
}

export function GrowthOsApp() {
  const [activeScreen, setActiveScreen] = useState<Screen>("dashboard");
  const [data, setData] = useState<GrowthData>(initialData);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(storageKey);
      if (saved) setData(JSON.parse(saved) as GrowthData);
    } catch {
      setData(initialData);
    }
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (loaded) window.localStorage.setItem(storageKey, JSON.stringify(data));
  }, [data, loaded]);

  const monthly = useMemo(() => getThisMonthData(data), [data]);
  const latestEvaluation = useMemo(() => getLatestEvaluation(data.evaluations), [data.evaluations]);
  const report = useMemo(() => generateMonthlyReport(data), [data]);
  const currentScreen = screens.find((screen) => screen.id === activeScreen) ?? screens[0];

  function moveTo(screen: Screen) {
    setActiveScreen(screen);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function updateProfile(field: keyof GrowthData["profile"], value: string) {
    setData((current) => ({ ...current, profile: { ...current.profile, [field]: value } }));
  }

  function addPracticeLog(log: PracticeLog) {
    setData((current) => ({ ...current, practiceLogs: [...current.practiceLogs, log] }));
    moveTo("dashboard");
  }

  function addMatchLog(log: MatchLog) {
    setData((current) => ({ ...current, matchLogs: [...current.matchLogs, log] }));
    moveTo("dashboard");
  }

  function addEvaluation(evaluation: DemandEvaluation) {
    setData((current) => ({ ...current, evaluations: [...current.evaluations, evaluation] }));
    moveTo("report");
  }

  function exportData() {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `ksla-growth-os-${today()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }

  function importData(file: File) {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const nextData = JSON.parse(String(reader.result)) as GrowthData;
        if (!nextData.profile || !Array.isArray(nextData.practiceLogs)) {
          window.alert("KSLA Growth OSのバックアップファイルではありません。");
          return;
        }
        setData(nextData);
        window.alert("バックアップを復元しました。");
      } catch {
        window.alert("ファイルを読み込めませんでした。");
      }
    };
    reader.readAsText(file);
  }

  return (
    <main className="min-h-screen bg-paper pb-24 text-ink">
      <header className="sticky top-0 z-30 border-b border-white/70 bg-paper/95 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3">
          <div className="min-w-0">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-court">KSLA Growth OS</p>
            <h1 className="truncate text-lg font-black leading-tight">{currentScreen.label}</h1>
          </div>
          <span className="rounded-full bg-court/10 px-3 py-2 text-xs font-black text-court">
            {currentScreen.title}
          </span>
        </div>
      </header>

      <div className="mx-auto grid max-w-5xl gap-4 px-4 py-4 lg:grid-cols-[250px_1fr]">
        <aside className="hidden lg:block">
          <Panel className="sticky top-24">
            <nav className="grid gap-2" aria-label="画面切り替え">
              {screens.map((screen, index) => (
                <NavButton
                  key={screen.id}
                  index={index + 1}
                  screen={screen}
                  active={activeScreen === screen.id}
                  onClick={() => moveTo(screen.id)}
                />
              ))}
            </nav>
          </Panel>
        </aside>

        <div className="grid gap-4">
          <HeroPanel
            data={data}
            monthly={monthly}
            latestEvaluation={latestEvaluation}
            currentScreen={currentScreen}
            onNavigate={moveTo}
          />
          <FlowNav activeScreen={activeScreen} onNavigate={moveTo} />
          <ScreenIntro screen={currentScreen} />

          {activeScreen === "dashboard" && (
            <Dashboard
              data={data}
              latestEvaluation={latestEvaluation}
              onAddEvaluation={addEvaluation}
              onExportData={exportData}
              onImportData={importData}
              onNavigate={moveTo}
            />
          )}
          {activeScreen === "profile" && <ProfileScreen data={data} updateProfile={updateProfile} />}
          {activeScreen === "practice" && <PracticeScreen onAdd={addPracticeLog} />}
          {activeScreen === "match" && <MatchScreen onAdd={addMatchLog} />}
          {activeScreen === "report" && <ReportScreen report={report} data={data} />}
        </div>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-stone-200 bg-white px-2 py-2 shadow-[0_-14px_32px_rgba(17,24,23,0.12)] lg:hidden">
        <div className="mx-auto grid max-w-lg grid-cols-5 gap-1">
          {screens.map((screen) => (
            <button
              key={screen.id}
              type="button"
              onClick={() => moveTo(screen.id)}
              aria-current={activeScreen === screen.id ? "page" : undefined}
              className={`min-h-14 rounded-xl text-xs font-black transition ${
                activeScreen === screen.id ? "bg-court text-white" : "bg-white text-stone-600"
              }`}
            >
              {screen.label}
              {activeScreen === screen.id && <span className="mt-1 block text-[10px] text-white/80">表示中</span>}
            </button>
          ))}
        </div>
      </nav>
    </main>
  );
}

function HeroPanel({
  data,
  monthly,
  latestEvaluation,
  currentScreen,
  onNavigate,
}: {
  data: GrowthData;
  monthly: ReturnType<typeof getThisMonthData>;
  latestEvaluation?: DemandEvaluation;
  currentScreen: (typeof screens)[number];
  onNavigate: (screen: Screen) => void;
}) {
  const average =
    latestEvaluation &&
    Math.round(
      demandKeys.reduce((sum, key) => sum + latestEvaluation.scores[key], 0) /
        demandKeys.length,
    );

  return (
    <section className="overflow-hidden rounded-2xl bg-ink text-white shadow-soft">
      <div className="grid gap-5 p-5">
        <div className="grid gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-lime px-3 py-1 text-xs font-black text-ink">トップ</span>
            <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-bold text-white/80">
              現在: {currentScreen.label}
            </span>
          </div>
          <div>
            <h2 className="text-2xl font-black leading-snug">{data.profile.name}さんの成長管理</h2>
            <p className="mt-2 text-base leading-8 text-white/78">
              入力、振り返り、月報作成までを1つの流れで進めます。
            </p>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-2 text-center">
          <MiniStat label="練習" value={monthly.practices.length} />
          <MiniStat label="試合" value={monthly.matches.length} />
          <MiniStat label="評価" value={monthly.evaluations.length} />
          <MiniStat label="平均" value={average ?? "-"} />
        </div>

        <div className="grid gap-2 sm:grid-cols-3">
          <button type="button" onClick={() => onNavigate("practice")} className="min-h-12 rounded-xl bg-lime px-4 text-sm font-black text-ink">
            練習を入力
          </button>
          <button type="button" onClick={() => onNavigate("match")} className="min-h-12 rounded-xl border border-white/20 bg-white/10 px-4 text-sm font-black text-white">
            試合を入力
          </button>
          <button type="button" onClick={() => onNavigate("report")} className="min-h-12 rounded-xl border border-white/20 bg-white/10 px-4 text-sm font-black text-white">
            月報を見る
          </button>
        </div>
      </div>
    </section>
  );
}

function FlowNav({
  activeScreen,
  onNavigate,
}: {
  activeScreen: Screen;
  onNavigate: (screen: Screen) => void;
}) {
  return (
    <Panel>
      <div className="mb-3 flex items-end justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.14em] text-court">Flow</p>
          <h2 className="text-lg font-black">操作の流れ</h2>
        </div>
        <p className="text-xs font-bold text-stone-500">色付きが現在地</p>
      </div>
      <div className="grid grid-cols-5 gap-1.5">
        {screens.map((screen, index) => (
          <button
            key={screen.id}
            type="button"
            onClick={() => onNavigate(screen.id)}
            className={`min-h-20 rounded-2xl border p-2 text-center transition ${
              activeScreen === screen.id
                ? "border-court bg-court text-white"
                : "border-stone-200 bg-stone-50 text-stone-700"
            }`}
          >
            <span className={`mx-auto grid h-7 w-7 place-items-center rounded-full text-xs font-black ${
              activeScreen === screen.id ? "bg-white text-court" : "bg-white text-stone-500"
            }`}>
              {index + 1}
            </span>
            <span className="mt-1 block text-xs font-black">{screen.label}</span>
            <span className={`mt-0.5 hidden text-[10px] leading-4 sm:block ${
              activeScreen === screen.id ? "text-white/80" : "text-stone-500"
            }`}>
              {screen.action}
            </span>
          </button>
        ))}
      </div>
    </Panel>
  );
}

function ScreenIntro({ screen }: { screen: (typeof screens)[number] }) {
  return (
    <section className="rounded-2xl border-l-4 border-court bg-white px-4 py-3 shadow-sm">
      <p className="text-sm font-black text-court">{screen.label}</p>
      <h2 className="mt-1 text-xl font-black leading-snug">{screen.title}</h2>
      <p className="mt-1 text-base leading-7 text-stone-600">{screen.role}</p>
    </section>
  );
}

function NavButton({
  index,
  screen,
  active,
  onClick,
}: {
  index: number;
  screen: (typeof screens)[number];
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      className={`rounded-2xl px-4 py-3 text-left transition ${
        active ? "bg-court text-white" : "bg-stone-50 text-stone-700 hover:bg-stone-100"
      }`}
    >
      <span className="flex items-center gap-2">
        <span className={`grid h-7 w-7 place-items-center rounded-full text-xs font-black ${
          active ? "bg-white text-court" : "bg-white text-stone-500"
        }`}>
          {index}
        </span>
        <span className="text-sm font-black">{screen.label}</span>
      </span>
      <span className={`mt-2 block text-xs leading-5 ${active ? "text-white/80" : "text-stone-500"}`}>
        {active ? "現在表示中" : screen.role}
      </span>
    </button>
  );
}

function MiniStat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-2xl border border-white/15 bg-white/10 px-2 py-3">
      <strong className="block text-xl leading-none">{value}</strong>
      <span className="text-[11px] text-white/70">{label}</span>
    </div>
  );
}

function Dashboard({
  data,
  latestEvaluation,
  onAddEvaluation,
  onExportData,
  onImportData,
  onNavigate,
}: {
  data: GrowthData;
  latestEvaluation?: DemandEvaluation;
  onAddEvaluation: (evaluation: DemandEvaluation) => void;
  onExportData: () => void;
  onImportData: (file: File) => void;
  onNavigate: (screen: Screen) => void;
}) {
  const recentPractice = data.practiceLogs.at(-1);
  const recentMatch = data.matchLogs.at(-1);
  const nextSuggestion = recentPractice?.nextAction ?? "練習ログを入力すると、次の練習テーマがここに出ます。";

  return (
    <div className="grid gap-4">
      <Panel className="border-court/25 bg-emerald-50/70">
        <SectionTitle
          eyebrow="Priority"
          title="次にやること"
          copy={nextSuggestion}
        />
        <div className="mt-4 grid gap-2 sm:grid-cols-3">
          <PrimaryButton onClick={() => onNavigate("practice")}>練習を入力</PrimaryButton>
          <SecondaryButton onClick={() => onNavigate("match")}>試合を入力</SecondaryButton>
          <SecondaryButton onClick={() => onNavigate("report")}>月報を見る</SecondaryButton>
        </div>
      </Panel>

      <div className="grid gap-3 sm:grid-cols-3">
        <StatusCard title="プロフィール" value={data.profile.name} detail={data.profile.goal} onClick={() => onNavigate("profile")} />
        <StatusCard title="最新練習" value={recentPractice?.theme ?? "未入力"} detail={recentPractice?.goodPoint ?? "練習ログを追加してください。"} onClick={() => onNavigate("practice")} />
        <StatusCard title="最新試合" value={recentMatch?.score ?? "未入力"} detail={recentMatch?.lesson ?? "試合ログを追加してください。"} onClick={() => onNavigate("match")} />
      </div>

      {latestEvaluation && <DemandSnapshot evaluation={latestEvaluation} />}
      <EvaluationForm onAdd={onAddEvaluation} />

      <Panel className="border-stone-300 bg-stone-50">
        <SectionTitle
          eyebrow="Backup"
          title="データを守る"
          copy="今はブラウザ保存です。週1回ほどバックアップを保存しておくと安心です。"
        />
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          <button type="button" onClick={onExportData} className="min-h-14 rounded-xl bg-ink px-4 text-base font-black text-white">
            バックアップ保存
          </button>
          <label className="grid min-h-14 cursor-pointer place-items-center rounded-xl border border-court bg-white px-4 text-base font-black text-court">
            バックアップ復元
            <input
              type="file"
              accept="application/json"
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) onImportData(file);
                event.currentTarget.value = "";
              }}
            />
          </label>
        </div>
      </Panel>
    </div>
  );
}

function StatusCard({
  title,
  value,
  detail,
  onClick,
}: {
  title: string;
  value: string;
  detail: string;
  onClick: () => void;
}) {
  return (
    <button type="button" onClick={onClick} className="rounded-2xl border border-stone-200 bg-white p-4 text-left shadow-sm transition active:scale-[0.99]">
      <span className="text-xs font-black uppercase tracking-[0.12em] text-court">{title}</span>
      <strong className="mt-2 block line-clamp-2 text-lg leading-snug text-ink">{value}</strong>
      <span className="mt-2 block line-clamp-3 text-sm leading-6 text-stone-600">{detail}</span>
    </button>
  );
}

function DemandSnapshot({ evaluation }: { evaluation: DemandEvaluation }) {
  const weakest = demandKeys.reduce((weak, key) =>
    evaluation.scores[key] < evaluation.scores[weak] ? key : weak,
  );

  return (
    <Panel>
      <SectionTitle
        eyebrow="7s Demand"
        title={`最新評価 ${evaluation.date}`}
        copy={`次に見るべき重点は「${demandLabels[weakest]}」です。`}
      />
      <div className="mt-4 grid gap-3">
        {demandKeys.map((key) => (
          <div key={key}>
            <div className="mb-1 flex justify-between text-sm font-bold">
              <span>{demandLabels[key]}</span>
              <span>{evaluation.scores[key]}点 / {scoreLabel(evaluation.scores[key])}</span>
            </div>
            <div className="h-2.5 overflow-hidden rounded-full bg-stone-100">
              <div className={`h-full rounded-full ${scoreTone(evaluation.scores[key])}`} style={{ width: `${evaluation.scores[key]}%` }} />
            </div>
          </div>
        ))}
      </div>
      {evaluation.memo && <p className="mt-4 rounded-2xl bg-stone-50 p-3 text-base leading-8 text-stone-700">{evaluation.memo}</p>}
    </Panel>
  );
}

function EvaluationForm({ onAdd }: { onAdd: (evaluation: DemandEvaluation) => void }) {
  const [date, setDate] = useState(today());
  const [scores, setScores] = useState(Object.fromEntries(demandKeys.map((key) => [key, 60])) as Record<DemandKey, number>);
  const [nutrition, setNutrition] = useState(Object.fromEntries(nutritionKeys.map((key) => [key, 60])) as Record<NutritionKey, number>);
  const [nutritionMemo, setNutritionMemo] = useState("");
  const [memo, setMemo] = useState("");

  return (
    <Panel>
      <form
        className="grid gap-4"
        onSubmit={(event) => {
          event.preventDefault();
          onAdd({ id: makeId("eval"), date, scores, nutrition, nutritionMemo, memo });
        }}
      >
        <SectionTitle eyebrow="Evaluation" title="7s Demand評価" copy="スライダーで現在地を記録します。細かく悩まず、今日の感覚で入力します。" />
        <Field label="評価日">
          <TextInput type="date" value={date} onChange={(event) => setDate(event.target.value)} />
        </Field>

        <div className="grid gap-3">
          {demandKeys.map((key) => (
            <ScoreSlider key={key} label={demandLabels[key]} value={scores[key]} onChange={(value) => setScores({ ...scores, [key]: value })} />
          ))}
        </div>

        <div className="rounded-2xl border border-emerald-100 bg-emerald-50/80 p-4">
          <h3 className="text-lg font-black text-ink">栄養・コンディション</h3>
          <p className="mt-1 text-base leading-7 text-stone-600">練習前後、睡眠、体調を分けて見ると原因が探しやすくなります。</p>
          <div className="mt-3 grid gap-3">
            {nutritionKeys.map((key) => (
              <ScoreSlider key={key} label={nutritionLabels[key]} value={nutrition[key]} onChange={(value) => setNutrition({ ...nutrition, [key]: value })} />
            ))}
          </div>
        </div>

        <Field label="栄養メモ" hint="短くて大丈夫です。気づいたことだけ残します。">
          <TextArea value={nutritionMemo} onChange={(event) => setNutritionMemo(event.target.value)} placeholder="例: 練習前の補食が遅く、後半に集中力が落ちた。" />
        </Field>
        <Field label="評価メモ">
          <TextArea value={memo} onChange={(event) => setMemo(event.target.value)} placeholder="例: 次は戻りの速さを重点にする。" />
        </Field>
        <PrimaryButton>保存して月報を見る</PrimaryButton>
      </form>
    </Panel>
  );
}

function ProfileScreen({
  data,
  updateProfile,
}: {
  data: GrowthData;
  updateProfile: (field: keyof GrowthData["profile"], value: string) => void;
}) {
  return (
    <Panel>
      <form className="grid gap-4">
        <SectionTitle eyebrow="Profile" title="選手プロフィール" copy="この情報が月報の土台になります。変更すると自動で保存されます。" />
        <Field label="選手名">
          <TextInput value={data.profile.name} onChange={(event) => updateProfile("name", event.target.value)} />
        </Field>
        <Field label="学年・カテゴリ">
          <TextInput value={data.profile.grade} onChange={(event) => updateProfile("grade", event.target.value)} />
        </Field>
        <Field label="利き手">
          <TextInput value={data.profile.dominantHand} onChange={(event) => updateProfile("dominantHand", event.target.value)} />
        </Field>
        <Field label="プレースタイル">
          <TextInput value={data.profile.playStyle} onChange={(event) => updateProfile("playStyle", event.target.value)} />
        </Field>
        <Field label="目標">
          <TextArea value={data.profile.goal} onChange={(event) => updateProfile("goal", event.target.value)} />
        </Field>
        <Field label="保護者メモ">
          <TextArea value={data.profile.guardianMemo} onChange={(event) => updateProfile("guardianMemo", event.target.value)} />
        </Field>
      </form>
    </Panel>
  );
}

function PracticeScreen({ onAdd }: { onAdd: (log: PracticeLog) => void }) {
  const [form, setForm] = useState({
    date: today(),
    durationMinutes: 120,
    theme: "",
    menu: "",
    goodPoint: "",
    issue: "",
    nextAction: "",
    intensity: 70,
  });

  return (
    <Panel>
      <form
        className="grid gap-4"
        onSubmit={(event) => {
          event.preventDefault();
          onAdd({ ...form, id: makeId("practice") });
        }}
      >
        <SectionTitle eyebrow="Practice" title="練習ログ追加" copy="「何をしたか」よりも「次に何をするか」まで残すと、成長につながります。" />
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="日付">
            <TextInput type="date" value={form.date} onChange={(event) => setForm({ ...form, date: event.target.value })} />
          </Field>
          <Field label="練習時間（分）">
            <TextInput type="number" value={form.durationMinutes} onChange={(event) => setForm({ ...form, durationMinutes: Number(event.target.value) })} />
          </Field>
        </div>
        <Field label="テーマ">
          <TextInput value={form.theme} onChange={(event) => setForm({ ...form, theme: event.target.value })} placeholder="例: レシーブからラリーを始める" required />
        </Field>
        <ScoreSlider label="練習強度" value={form.intensity} onChange={(value) => setForm({ ...form, intensity: value })} />
        <Field label="練習メニュー">
          <TextArea value={form.menu} onChange={(event) => setForm({ ...form, menu: event.target.value })} placeholder="例: フットワーク、レシーブ、ゲーム形式" />
        </Field>
        <Field label="良かった点">
          <TextArea value={form.goodPoint} onChange={(event) => setForm({ ...form, goodPoint: event.target.value })} required />
        </Field>
        <Field label="課題">
          <TextArea value={form.issue} onChange={(event) => setForm({ ...form, issue: event.target.value })} required />
        </Field>
        <Field label="次にやる練習">
          <TextArea value={form.nextAction} onChange={(event) => setForm({ ...form, nextAction: event.target.value })} required />
        </Field>
        <PrimaryButton>練習ログを保存</PrimaryButton>
      </form>
    </Panel>
  );
}

function MatchScreen({ onAdd }: { onAdd: (log: MatchLog) => void }) {
  const [form, setForm] = useState({
    date: today(),
    tournament: "",
    opponent: "",
    score: "",
    result: "lose" as MatchLog["result"],
    goodPoint: "",
    issue: "",
    lesson: "",
  });

  return (
    <Panel>
      <form
        className="grid gap-4"
        onSubmit={(event) => {
          event.preventDefault();
          onAdd({ ...form, id: makeId("match") });
        }}
      >
        <SectionTitle eyebrow="Match" title="試合ログ追加" copy="勝敗の記録ではなく、次の練習材料として残します。" />
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="日付">
            <TextInput type="date" value={form.date} onChange={(event) => setForm({ ...form, date: event.target.value })} />
          </Field>
          <Field label="結果">
            <Select value={form.result} onChange={(event) => setForm({ ...form, result: event.target.value as MatchLog["result"] })}>
              <option value="win">勝ち</option>
              <option value="lose">負け</option>
              <option value="draw">引き分け</option>
            </Select>
          </Field>
        </div>
        <Field label="大会・試合名">
          <TextInput value={form.tournament} onChange={(event) => setForm({ ...form, tournament: event.target.value })} required />
        </Field>
        <Field label="対戦相手">
          <TextInput value={form.opponent} onChange={(event) => setForm({ ...form, opponent: event.target.value })} />
        </Field>
        <Field label="スコア">
          <TextInput value={form.score} onChange={(event) => setForm({ ...form, score: event.target.value })} placeholder="例: 21-18, 18-21, 21-19" />
        </Field>
        <Field label="良かった点">
          <TextArea value={form.goodPoint} onChange={(event) => setForm({ ...form, goodPoint: event.target.value })} required />
        </Field>
        <Field label="課題">
          <TextArea value={form.issue} onChange={(event) => setForm({ ...form, issue: event.target.value })} required />
        </Field>
        <Field label="試合からの学び">
          <TextArea value={form.lesson} onChange={(event) => setForm({ ...form, lesson: event.target.value })} required />
        </Field>
        <PrimaryButton>試合ログを保存</PrimaryButton>
      </form>
    </Panel>
  );
}

function ReportScreen({
  report,
  data,
}: {
  report: ReturnType<typeof generateMonthlyReport>;
  data: GrowthData;
}) {
  const reportText = [
    "KSLA Growth OS 月次レポート",
    `選手: ${data.profile.name}`,
    "",
    "今月の成長ポイント",
    ...report.growthPoints.map((item) => `・${item}`),
    "",
    "現在の課題",
    ...report.currentIssues.map((item) => `・${item}`),
    "",
    "次にやるべき練習",
    ...report.nextPractice.map((item) => `・${item}`),
    "",
    "栄養・コンディション面",
    ...report.nutritionCondition.map((item) => `・${item}`),
    "",
    `保護者向けコメント\n${report.guardianComment}`,
    "",
    `指導者向けコメント\n${report.coachComment}`,
  ].join("\n");

  return (
    <div className="grid gap-4">
      <Panel className="bg-ink text-white">
        <SectionTitle
          eyebrow="Monthly Report"
          title={`${data.profile.name}さんの月次レポート`}
          copy="入力内容からテンプレート文章を自動生成しています。"
        />
        <button
          type="button"
          onClick={() => {
            navigator.clipboard.writeText(reportText);
            window.alert("月次レポートをコピーしました。");
          }}
          className="mt-4 min-h-14 w-full rounded-xl bg-lime px-4 text-base font-black text-ink"
        >
          レポートをコピー
        </button>
      </Panel>
      <ReportBlock title="今月の成長ポイント" items={report.growthPoints} />
      <ReportBlock title="現在の課題" items={report.currentIssues} />
      <ReportBlock title="次にやるべき練習" items={report.nextPractice} />
      <ReportBlock title="栄養・コンディション面の改善ポイント" items={report.nutritionCondition} />
      <Panel>
        <h3 className="text-lg font-black">保護者向けコメント</h3>
        <p className="mt-3 text-base leading-8 text-stone-700">{report.guardianComment}</p>
      </Panel>
      <Panel>
        <h3 className="text-lg font-black">指導者向けコメント</h3>
        <p className="mt-3 text-base leading-8 text-stone-700">{report.coachComment}</p>
      </Panel>
    </div>
  );
}

function ReportBlock({ title, items }: { title: string; items: string[] }) {
  return (
    <Panel>
      <h3 className="text-lg font-black">{title}</h3>
      <ul className="mt-3 grid gap-2">
        {items.map((item) => (
          <li key={item} className="rounded-2xl bg-stone-50 p-3 text-base leading-8 text-stone-700">
            {item}
          </li>
        ))}
      </ul>
    </Panel>
  );
}
