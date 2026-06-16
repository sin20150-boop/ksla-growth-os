import {
  demandLabels,
  nutritionLabels,
  type DemandEvaluation,
  type DemandKey,
  type GrowthData,
  type MonthlyReport,
  type NutritionKey,
} from "./types";

const demandKeys = Object.keys(demandLabels) as DemandKey[];
const nutritionKeys = Object.keys(nutritionLabels) as NutritionKey[];

export function getThisMonthData(data: GrowthData) {
  const month = new Date().toISOString().slice(0, 7);

  return {
    practices: data.practiceLogs.filter((log) => log.date.startsWith(month)),
    matches: data.matchLogs.filter((log) => log.date.startsWith(month)),
    evaluations: data.evaluations.filter((log) => log.date.startsWith(month)),
  };
}

export function getLatestEvaluation(
  evaluations: DemandEvaluation[],
): DemandEvaluation | undefined {
  return [...evaluations].sort((a, b) => b.date.localeCompare(a.date))[0];
}

function weakestDemand(evaluation?: DemandEvaluation) {
  if (!evaluation) return null;
  return demandKeys.reduce((weakest, key) =>
    evaluation.scores[key] < evaluation.scores[weakest] ? key : weakest,
  );
}

function strongestDemand(evaluation?: DemandEvaluation) {
  if (!evaluation) return null;
  return demandKeys.reduce((strongest, key) =>
    evaluation.scores[key] > evaluation.scores[strongest] ? key : strongest,
  );
}

function weakestNutrition(evaluation?: DemandEvaluation) {
  if (!evaluation) return null;
  return nutritionKeys.reduce((weakest, key) =>
    evaluation.nutrition[key] < evaluation.nutrition[weakest] ? key : weakest,
  );
}

export function generateMonthlyReport(data: GrowthData): MonthlyReport {
  const monthly = getThisMonthData(data);
  const latest = getLatestEvaluation(monthly.evaluations) ?? getLatestEvaluation(data.evaluations);
  const strong = strongestDemand(latest);
  const weak = weakestDemand(latest);
  const weakNutrition = weakestNutrition(latest);
  const latestPractice = monthly.practices.at(-1) ?? data.practiceLogs.at(-1);
  const latestMatch = monthly.matches.at(-1) ?? data.matchLogs.at(-1);

  const growthPoints = [
    latestPractice
      ? `${latestPractice.theme}に取り組み、「${latestPractice.goodPoint}」という成長が見えました。`
      : "練習ログを入力すると、今月の成長ポイントが自動で整理されます。",
    latestMatch?.goodPoint
      ? `試合では「${latestMatch.goodPoint}」が確認でき、練習の成果が実戦に出始めています。`
      : "試合ログを追加すると、実戦で出た成長も反映されます。",
    strong
      ? `7s Demandでは「${demandLabels[strong]}」が比較的高く、現在の強みとして活かせます。`
      : "7s Demand評価を入力すると、強みの見える化ができます。",
  ];

  const currentIssues = [
    latestPractice?.issue
      ? `練習面の課題は「${latestPractice.issue}」です。`
      : "練習ログの課題欄を入力してください。",
    latestMatch?.issue
      ? `試合面では「${latestMatch.issue}」が次の改善ポイントです。`
      : "試合ログを追加すると、実戦課題が反映されます。",
    weak ? `7s Demandでは「${demandLabels[weak]}」を重点的に伸ばしたい状態です。` : "",
  ].filter(Boolean);

  const nextPractice = [
    latestPractice?.nextAction
      ? `次回は「${latestPractice.nextAction}」を最優先テーマにします。`
      : "次にやるべき練習を入力すると、提案が具体化されます。",
    latestMatch?.lesson
      ? `試合からの学びとして「${latestMatch.lesson}」を練習メニューに落とし込みます。`
      : "試合の学びを入力すると、練習への接続ができます。",
    weak ? `補助テーマとして「${demandLabels[weak]}」を意識した振り返りを入れましょう。` : "",
  ].filter(Boolean);

  const nutritionCondition = [
    weakNutrition
      ? `栄養・コンディション面では「${nutritionLabels[weakNutrition]}」を優先して改善しましょう。`
      : "栄養評価を入力すると、改善ポイントを自動で表示します。",
    latest?.nutritionMemo
      ? `記録メモ: ${latest.nutritionMemo}`
      : "練習前後の補食、水分、睡眠、体調変化を短く記録しましょう。",
  ];

  return {
    growthPoints,
    currentIssues,
    nextPractice,
    nutritionCondition,
    guardianComment: `${data.profile.name}さんは、今月の練習で成長の兆しが見えています。ご家庭では結果だけでなく、睡眠、補食、水分補給を含めて「何を整えると良いプレーにつながるか」を話せる時間を作ってください。`,
    coachComment: `次月は「${weak ? demandLabels[weak] : "重点課題"}」を軸に、練習ログと試合ログをつなげて成長を確認します。技術だけでなく、自分で考えて修正する力を育てましょう。`,
  };
}
