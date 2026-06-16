"use client";

import { useEffect, useMemo, useState } from "react";
import { generateMonthlyReport, getLatestEvaluation, getThisMonthData } from "@/lib/report";
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

const screens: { id: Screen; label: string; short: string }[] = [
  { id: "dashboard", label: "ダッシュボード", short: "概要" },
  { id: "profile", label: "選手プロフィール", short: "選手" },
  { id: "practice", label: "練習ログ追加", short: "練習" },
  { id: "match", label: "試合ログ追加", short: "試合" },
  { id: "report", label: "月次レポート", short: "月報" },
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

function scoreColor(score: number) {
  if (score >= 75) return "bg-court";
  if (score >= 55) return "bg-amber-500";
  return "bg-rose-500";
}

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <section className={`rounded-lg border border-stone-200 bg-white p-4 shadow-soft ${className}`}>
      {children}
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="grid gap-2 text-sm font-bold text-stone-600">
      {label}
      {children}
    </label>
  );
}

function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className="min-h-11 rounded-lg border border-stone-300 bg-white px-3 text-base text-ink outline-none transition focus:border-court focus:ring-2 focus:ring-court/15"
    />
  );
}

function TextArea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className="min-h-24 rounded-lg border border-stone-300 bg-white px-3 py-2 text-base text-ink outline-none transition focus:border-court focus:ring-2 focus:ring-court/15"
    />
  );
}

function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className="min-h-11 rounded-lg border border-stone-300 bg-white px-3 text-base text-ink outline-none transition focus:border-court focus:ring-2 focus:ring-court/15"
    />
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
  const safeValue = Math.max(0, Math.min(100, value));

  return (
    <div className="rounded-lg border border-stone-200 bg-stone-50 p-3">
      <div className="mb-2 flex items-center justify-between gap-3">
        <span className="font-bold text-ink">{label}</span>
        <input
          type="number"
          min={0}
          max={100}
          value={safeValue}
          onChange={(event) => onChange(Math.max(0, Math.min(100, Number(event.target.value))))}
          className="h-9 w-20 rounded-lg border border-stone-300 px-2 text-right font-bold"
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
    const saved = window.localStorage.getItem(storageKey);
    if (saved) setData(JSON.parse(saved) as GrowthData);
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (loaded) window.localStorage.setItem(storageKey, JSON.stringify(data));
  }, [data, loaded]);

  const monthly = useMemo(() => getThisMonthData(data), [data]);
  const latestEvaluation = useMemo(() => getLatestEvaluation(data.evaluations), [data.evaluations]);
  const report = useMemo(() => generateMonthlyReport(data), [data]);
  const currentScreen = screens.find((screen) => screen.id === activeScreen);

  function updateProfile(field: keyof GrowthData["profile"], value: string) {
    setData((current) => ({ ...current, profile: { ...current.profile, [field]: value } }));
  }

  function addPracticeLog(log: PracticeLog) {
    setData((current) => ({ ...current, practiceLogs: [...current.practiceLogs, log] }));
    setActiveScreen("dashboard");
  }

  function addMatchLog(log: MatchLog) {
    setData((current) => ({ ...current, matchLogs: [...current.matchLogs, log] }));
    setActiveScreen("dashboard");
  }

  function addEvaluation(evaluation: DemandEvaluation) {
    setData((current) => ({ ...current, evaluations: [...current.evaluations, evaluation] }));
    setActiveScreen("report");
  }

  function exportData() {
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `ksla-growth-os-${new Date().toISOString().slice(0, 10)}.json`;
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
    <main className="min-h-screen pb-24">
      <header className="sticky top-0 z-20 border-b border-white/50 bg-paper/88 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-court">
              KSLA Growth OS
            </p>
            <h1 className="text-lg font-black leading-tight text-ink sm:text-2xl">
              7s Demand成長管理システム
            </h1>
          </div>
          <button
            type="button"
            onClick={() => setActiveScreen("report")}
            className="min-h-10 rounded-lg bg-ink px-4 text-sm font-black text-white"
          >
            月報
          </button>
        </div>
      </header>

      <div className="mx-auto grid max-w-6xl gap-5 px-4 py-5 lg:grid-cols-[260px_1fr]">
        <aside className="hidden lg:block">
          <Card className="sticky top-24">
            <nav className="grid gap-2" aria-label="画面切り替え">
              {screens.map((screen) => (
                <button
                  key={screen.id}
                  type="button"
                  onClick={() => setActiveScreen(screen.id)}
                  className={`rounded-lg px-4 py-3 text-left text-sm font-black transition ${
                    activeScreen === screen.id
                      ? "bg-court text-white"
                      : "bg-stone-50 text-stone-700 hover:bg-stone-100"
                  }`}
                >
                  {screen.label}
                </button>
              ))}
            </nav>
          </Card>
        </aside>

        <div className="grid gap-5">
          <section className="overflow-hidden rounded-lg bg-ink text-white shadow-soft">
            <div className="grid gap-4 p-5 sm:grid-cols-[1fr_auto] sm:items-end">
              <div>
                <p className="text-sm font-bold text-lime">現在の画面</p>
                <h2 className="mt-1 text-2xl font-black">{currentScreen?.label}</h2>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-white/72">
                  {data.profile.name}さんの競技力、思考力、自己管理能力を7s Demandで可視化します。
                </p>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center">
                <MiniStat label="練習" value={monthly.practices.length} />
                <MiniStat label="試合" value={monthly.matches.length} />
                <MiniStat label="評価" value={monthly.evaluations.length} />
              </div>
            </div>
          </section>

          {activeScreen === "dashboard" && (
            <Dashboard
              data={data}
              latestEvaluation={latestEvaluation}
              onAddEvaluation={addEvaluation}
              onExportData={exportData}
              onImportData={importData}
            />
          )}
          {activeScreen === "profile" && (
            <ProfileScreen data={data} updateProfile={updateProfile} />
          )}
          {activeScreen === "practice" && <PracticeScreen onAdd={addPracticeLog} />}
          {activeScreen === "match" && <MatchScreen onAdd={addMatchLog} />}
          {activeScreen === "report" && <ReportScreen report={report} data={data} />}
        </div>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-stone-200 bg-white px-2 py-2 shadow-[0_-12px_30px_rgba(17,24,23,0.08)] lg:hidden">
        <div className="mx-auto grid max-w-lg grid-cols-5 gap-1">
          {screens.map((screen) => (
            <button
              key={screen.id}
              type="button"
              onClick={() => setActiveScreen(screen.id)}
              className={`min-h-12 rounded-lg text-xs font-black ${
                activeScreen === screen.id ? "bg-court text-white" : "text-stone-600"
              }`}
            >
              {screen.short}
            </button>
          ))}
        </div>
      </nav>
    </main>
  );
}

function MiniStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-white/12 bg-white/8 px-3 py-2">
      <strong className="block text-xl leading-none">{value}</strong>
      <span className="text-xs text-white/68">{label}</span>
    </div>
  );
}

function Dashboard({
  data,
  latestEvaluation,
  onAddEvaluation,
  onExportData,
  onImportData,
}: {
  data: GrowthData;
  latestEvaluation?: DemandEvaluation;
  onAddEvaluation: (evaluation: DemandEvaluation) => void;
  onExportData: () => void;
  onImportData: (file: File) => void;
}) {
  const recentPractice = data.practiceLogs.at(-1);
  const recentMatch = data.matchLogs.at(-1);
  const average =
    latestEvaluation &&
    Math.round(
      demandKeys.reduce((sum, key) => sum + latestEvaluation.scores[key], 0) /
        demandKeys.length,
    );

  return (
    <div className="grid gap-5">
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <p className="text-sm font-bold text-stone-500">選手</p>
          <h3 className="mt-1 text-2xl font-black">{data.profile.name}</h3>
          <p className="mt-2 text-sm text-stone-600">{data.profile.goal}</p>
        </Card>
        <Card>
          <p className="text-sm font-bold text-stone-500">7s Demand平均</p>
          <h3 className="mt-1 text-3xl font-black">
            {average ?? "-"}
            <span className="text-base">点</span>
          </h3>
          <p className="mt-2 text-sm text-stone-600">最新評価の7項目平均です。</p>
        </Card>
        <Card>
          <p className="text-sm font-bold text-stone-500">次の優先行動</p>
          <h3 className="mt-1 text-lg font-black">
            {recentPractice?.nextAction ?? "練習ログを追加"}
          </h3>
          <p className="mt-2 text-sm text-stone-600">ログから次回テーマを見える化します。</p>
        </Card>
      </div>

      <Card className="border-court/20 bg-emerald-50/70">
        <div className="grid gap-4 sm:grid-cols-[1fr_auto] sm:items-center">
          <div>
            <p className="text-sm font-bold text-court">自分用に安全運用</p>
            <h3 className="text-xl font-black">入力データをバックアップできます</h3>
            <p className="mt-2 text-sm leading-6 text-stone-600">
              このMVPはブラウザ内に保存します。週1回ほどバックアップを保存しておくと、PC変更やブラウザ初期化に備えられます。
            </p>
          </div>
          <div className="grid gap-2 sm:min-w-48">
            <button
              type="button"
              onClick={onExportData}
              className="min-h-11 rounded-lg bg-ink px-4 text-sm font-black text-white"
            >
              バックアップ保存
            </button>
            <label className="grid min-h-11 cursor-pointer place-items-center rounded-lg border border-court bg-white px-4 text-sm font-black text-court">
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
        </div>
      </Card>

      {latestEvaluation && (
        <Card>
          <div className="mb-4">
            <p className="text-sm font-bold text-court">7s Demand Snapshot</p>
            <h3 className="text-xl font-black">最新評価 {latestEvaluation.date}</h3>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {demandKeys.map((key) => (
              <div key={key}>
                <div className="mb-1 flex justify-between text-sm font-bold">
                  <span>{demandLabels[key]}</span>
                  <span>{latestEvaluation.scores[key]}点</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-stone-100">
                  <div
                    className={`h-full rounded-full ${scoreColor(latestEvaluation.scores[key])}`}
                    style={{ width: `${latestEvaluation.scores[key]}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
          {latestEvaluation.memo && (
            <p className="mt-4 rounded-lg bg-stone-50 p-3 text-sm leading-6 text-stone-600">
              {latestEvaluation.memo}
            </p>
          )}
        </Card>
      )}

      <EvaluationForm onAdd={onAddEvaluation} />

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <h3 className="text-lg font-black">最新の練習ログ</h3>
          <p className="mt-3 text-sm leading-6 text-stone-600">
            {recentPractice
              ? `${recentPractice.date} / ${recentPractice.theme}。良かった点: ${recentPractice.goodPoint}`
              : "練習ログはまだありません。"}
          </p>
        </Card>
        <Card>
          <h3 className="text-lg font-black">最新の試合ログ</h3>
          <p className="mt-3 text-sm leading-6 text-stone-600">
            {recentMatch
              ? `${recentMatch.date} / ${recentMatch.tournament} / ${recentMatch.score}。学び: ${recentMatch.lesson}`
              : "試合ログはまだありません。"}
          </p>
        </Card>
      </div>
    </div>
  );
}

function EvaluationForm({ onAdd }: { onAdd: (evaluation: DemandEvaluation) => void }) {
  const [date, setDate] = useState(today());
  const [scores, setScores] = useState(
    Object.fromEntries(demandKeys.map((key) => [key, 60])) as Record<DemandKey, number>,
  );
  const [nutrition, setNutrition] = useState(
    Object.fromEntries(nutritionKeys.map((key) => [key, 60])) as Record<NutritionKey, number>,
  );
  const [nutritionMemo, setNutritionMemo] = useState("");
  const [memo, setMemo] = useState("");

  return (
    <Card>
      <form
        className="grid gap-4"
        onSubmit={(event) => {
          event.preventDefault();
          onAdd({ id: makeId("eval"), date, scores, nutrition, nutritionMemo, memo });
        }}
      >
        <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
          <div>
            <p className="text-sm font-bold text-court">7s Demand評価入力</p>
            <h3 className="text-xl font-black">
              心・技・体・戦術・推論・強化学習・栄養を記録
            </h3>
          </div>
          <TextInput type="date" value={date} onChange={(event) => setDate(event.target.value)} />
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          {demandKeys.map((key) => (
            <ScoreSlider
              key={key}
              label={demandLabels[key]}
              value={scores[key]}
              onChange={(value) => setScores({ ...scores, [key]: value })}
            />
          ))}
        </div>

        <div className="rounded-lg border border-emerald-100 bg-emerald-50/70 p-3">
          <p className="text-sm font-black text-court">栄養詳細</p>
          <p className="mt-1 text-sm leading-6 text-stone-600">
            食事、補食、水分、睡眠、体調、試合前後のコンディションを分けて記録します。
          </p>
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            {nutritionKeys.map((key) => (
              <ScoreSlider
                key={key}
                label={nutritionLabels[key]}
                value={nutrition[key]}
                onChange={(value) => setNutrition({ ...nutrition, [key]: value })}
              />
            ))}
          </div>
        </div>

        <Field label="栄養メモ">
          <TextArea
            value={nutritionMemo}
            onChange={(event) => setNutritionMemo(event.target.value)}
            placeholder="例：練習前の補食が遅く、後半に集中が落ちた"
          />
        </Field>
        <Field label="評価メモ">
          <TextArea
            value={memo}
            onChange={(event) => setMemo(event.target.value)}
            placeholder="例：推論は伸びている。次は戦術を言葉にしてからゲームに入る。"
          />
        </Field>
        <button className="min-h-12 rounded-lg bg-court px-5 font-black text-white">
          7s Demand評価を保存して月報を見る
        </button>
      </form>
    </Card>
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
    <Card>
      <div className="grid gap-4 md:grid-cols-2">
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
      </div>
    </Card>
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
    <Card>
      <form
        className="grid gap-4 md:grid-cols-2"
        onSubmit={(event) => {
          event.preventDefault();
          onAdd({ ...form, id: makeId("practice") });
        }}
      >
        <Field label="日付">
          <TextInput type="date" value={form.date} onChange={(event) => setForm({ ...form, date: event.target.value })} />
        </Field>
        <Field label="練習時間（分）">
          <TextInput type="number" value={form.durationMinutes} onChange={(event) => setForm({ ...form, durationMinutes: Number(event.target.value) })} />
        </Field>
        <Field label="テーマ">
          <TextInput value={form.theme} onChange={(event) => setForm({ ...form, theme: event.target.value })} placeholder="例：レシーブからラリーを始める" required />
        </Field>
        <Field label="強度 0〜100">
          <ScoreSlider label="練習強度" value={form.intensity} onChange={(value) => setForm({ ...form, intensity: value })} />
        </Field>
        <div className="md:col-span-2">
          <Field label="練習メニュー">
            <TextArea value={form.menu} onChange={(event) => setForm({ ...form, menu: event.target.value })} placeholder="フットワーク、ノック、ゲーム形式など" />
          </Field>
        </div>
        <Field label="良かった点">
          <TextArea value={form.goodPoint} onChange={(event) => setForm({ ...form, goodPoint: event.target.value })} required />
        </Field>
        <Field label="課題">
          <TextArea value={form.issue} onChange={(event) => setForm({ ...form, issue: event.target.value })} required />
        </Field>
        <div className="md:col-span-2">
          <Field label="次にやるべき練習">
            <TextArea value={form.nextAction} onChange={(event) => setForm({ ...form, nextAction: event.target.value })} required />
          </Field>
        </div>
        <button className="min-h-12 rounded-lg bg-court px-5 font-black text-white md:col-span-2">
          練習ログを保存
        </button>
      </form>
    </Card>
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
    <Card>
      <form
        className="grid gap-4 md:grid-cols-2"
        onSubmit={(event) => {
          event.preventDefault();
          onAdd({ ...form, id: makeId("match") });
        }}
      >
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
        <Field label="大会・試合名">
          <TextInput value={form.tournament} onChange={(event) => setForm({ ...form, tournament: event.target.value })} required />
        </Field>
        <Field label="対戦相手">
          <TextInput value={form.opponent} onChange={(event) => setForm({ ...form, opponent: event.target.value })} />
        </Field>
        <Field label="スコア">
          <TextInput value={form.score} onChange={(event) => setForm({ ...form, score: event.target.value })} placeholder="例：21-18, 18-21, 21-19" />
        </Field>
        <div />
        <Field label="良かった点">
          <TextArea value={form.goodPoint} onChange={(event) => setForm({ ...form, goodPoint: event.target.value })} required />
        </Field>
        <Field label="課題">
          <TextArea value={form.issue} onChange={(event) => setForm({ ...form, issue: event.target.value })} required />
        </Field>
        <div className="md:col-span-2">
          <Field label="試合からの学び">
            <TextArea value={form.lesson} onChange={(event) => setForm({ ...form, lesson: event.target.value })} required />
          </Field>
        </div>
        <button className="min-h-12 rounded-lg bg-court px-5 font-black text-white md:col-span-2">
          試合ログを保存
        </button>
      </form>
    </Card>
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
    `【KSLA Growth OS 月次レポート】`,
    `選手: ${data.profile.name}`,
    "",
    "■ 今月の成長ポイント",
    ...report.growthPoints.map((item) => `・${item}`),
    "",
    "■ 現在の課題",
    ...report.currentIssues.map((item) => `・${item}`),
    "",
    "■ 次にやるべき練習",
    ...report.nextPractice.map((item) => `・${item}`),
    "",
    "■ 栄養・コンディション面",
    ...report.nutritionCondition.map((item) => `・${item}`),
    "",
    `■ 保護者向けコメント\n${report.guardianComment}`,
    "",
    `■ 指導者向けコメント\n${report.coachComment}`,
  ].join("\n");

  return (
    <div className="grid gap-5">
      <Card className="bg-ink text-white">
        <div className="grid gap-4 sm:grid-cols-[1fr_auto] sm:items-end">
          <div>
            <p className="text-sm font-bold text-lime">Monthly Report</p>
            <h3 className="mt-1 text-2xl font-black">{data.profile.name}さんの月次レポート</h3>
            <p className="mt-2 text-sm leading-6 text-white/72">
              入力された練習ログ、試合ログ、7s Demand評価からテンプレート文章を自動生成しています。
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              navigator.clipboard.writeText(reportText);
              window.alert("月次レポートをコピーしました。");
            }}
            className="min-h-11 rounded-lg bg-lime px-4 text-sm font-black text-ink"
          >
            レポートをコピー
          </button>
        </div>
      </Card>
      <ReportBlock title="今月の成長ポイント" items={report.growthPoints} />
      <ReportBlock title="現在の課題" items={report.currentIssues} />
      <ReportBlock title="次にやるべき練習" items={report.nextPractice} />
      <ReportBlock title="栄養・コンディション面の改善ポイント" items={report.nutritionCondition} />
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <h3 className="text-lg font-black">保護者向けコメント</h3>
          <p className="mt-3 text-sm leading-7 text-stone-600">{report.guardianComment}</p>
        </Card>
        <Card>
          <h3 className="text-lg font-black">指導者向けコメント</h3>
          <p className="mt-3 text-sm leading-7 text-stone-600">{report.coachComment}</p>
        </Card>
      </div>
    </div>
  );
}

function ReportBlock({ title, items }: { title: string; items: string[] }) {
  return (
    <Card>
      <h3 className="text-lg font-black">{title}</h3>
      <ul className="mt-3 grid gap-2">
        {items.map((item) => (
          <li key={item} className="rounded-lg bg-stone-50 p-3 text-sm leading-6 text-stone-700">
            {item}
          </li>
        ))}
      </ul>
    </Card>
  );
}
