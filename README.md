# KSLA Growth OS

バドミントン選手の競技力・思考力・自己管理能力を、KSLA独自の7s Demandで可視化する成長管理アプリのMVPです。

## 技術構成

- Next.js App Router
- TypeScript
- Tailwind CSS
- ローカル状態管理
- localStorage保存
- 外部DB/API連携なし

## 画面

- ダッシュボード
- 選手プロフィール
- 練習ログ追加
- 試合ログ追加
- 月次レポート

7s Demand評価はダッシュボード内の入力カードから登録できます。

## 7s Demand

- 心
- 技
- 体
- 戦術
- 推論
- 強化学習
- 栄養

各項目を0〜100点で入力できます。

## 栄養詳細

栄養項目では以下を記録・評価できます。

- 食事の質
- 練習前後の補食
- 水分補給
- 睡眠との関係
- 体調への影響
- 試合前後のコンディション

## 月次レポート

練習ログ、試合ログ、7s Demand評価をもとに、以下をテンプレート文章で自動生成します。

- 今月の成長ポイント
- 現在の課題
- 次にやるべき練習
- 栄養・コンディション面の改善ポイント
- 保護者向けコメント
- 指導者向けコメント

## 起動方法

Node.js と npm をインストールした環境で実行してください。

```bash
npm install
npm run dev
```

ブラウザで `http://localhost:3000` を開きます。

## Vercel公開

1. GitHubで新しいリポジトリを作成します。
2. このフォルダのファイルをGitHubへアップロードします。
3. Vercelで `Add New Project` からGitHubリポジトリを選択します。
4. Framework Preset は `Next.js` を選びます。
5. Build Command は `npm run build`、Install Command は `npm install` のままで公開します。

公開後は、スマホでVercelのURLを開き、ブラウザの共有メニューからホーム画面に追加するとアプリのように使えます。

## 将来の拡張ポイント

- `lib/types.ts`: Supabaseのテーブル設計に転用しやすいデータ型
- `lib/report.ts`: OpenAI API連携時に置き換えやすい月次レポート生成ロジック
- `components/growth-os-app.tsx`: 現在は単一クライアントアプリ。画面ごとにコンポーネント分割可能
