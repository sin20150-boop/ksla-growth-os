import type { GrowthData } from "./types";

export const initialData: GrowthData = {
  profile: {
    name: "KSLA 選手",
    grade: "中学1年",
    dominantHand: "右利き",
    playStyle: "ラリーで粘りながらチャンスを作る",
    goal: "3ヶ月以内に大会で1勝する",
    guardianMemo: "練習後の疲労と睡眠の変化を見守りたい",
  },
  practiceLogs: [
    {
      id: "practice-1",
      date: new Date().toISOString().slice(0, 10),
      durationMinutes: 120,
      theme: "レシーブからラリーを始める",
      menu: "フットワーク、レシーブ、半面ラリー",
      goodPoint: "最後までシャトルを追う姿勢が増えた",
      issue: "戻りが遅れて次の打点が低くなる",
      nextAction: "打った後の一歩目を早くする",
      intensity: 72,
    },
  ],
  matchLogs: [
    {
      id: "match-1",
      date: new Date().toISOString().slice(0, 10),
      tournament: "練習試合",
      opponent: "同学年の選手",
      score: "18-21",
      result: "lose",
      goodPoint: "長いラリーで粘れた",
      issue: "終盤にサーブレシーブが甘くなった",
      lesson: "緊張した場面でも低いレシーブを徹底する",
    },
  ],
  evaluations: [
    {
      id: "eval-1",
      date: new Date().toISOString().slice(0, 10),
      scores: {
        mind: 68,
        skill: 61,
        body: 66,
        tactics: 58,
        reasoning: 54,
        reinforcement: 62,
        nutrition: 57,
      },
      nutrition: {
        mealQuality: 62,
        snackTiming: 48,
        hydration: 55,
        sleepRelation: 60,
        conditionImpact: 58,
        matchCondition: 52,
      },
      nutritionMemo: "練習前の補食が遅く、後半に集中力が落ちやすい。",
      memo: "考えてプレーする意識が出てきた。次は戻りの速さを重点にする。",
    },
  ],
};
