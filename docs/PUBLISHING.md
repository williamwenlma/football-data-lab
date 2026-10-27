# GitHub 发布说明

建议仓库名：`football-data-lab`。建议简介：

> Reproducible football analytics: UEFA U19 birth-month distributions and a World Cup player comparison dashboard.

建议 Topics：`football`、`soccer`、`data-visualization`、`sports-analytics`、`javascript`。

## 发布前本地检查

```sh
npm run check
npm start
```

确认首页能进入两个案例。正式仓库目录以此 README 所在的 `football-data-lab` 文件夹为根，不包含外层评估报告和 ZIP。

代码采用 MIT；数据来源与快照范围见 [DATA_SOURCES.md](../DATA_SOURCES.md)。这里没有 API 密钥或账号配置需求。

## 创建源码仓库

在 GitHub 上创建一个空仓库后，可通过 Git 推送当前目录。使用自己新建仓库的远端地址，不要把源码推到案例所引用的 FIFA、UEFA 或其他上游仓库。

```sh
git init -b main
git add .
git commit -m "Initial release: football data analysis cases"
```

接着按 GitHub 新建仓库页面给出的命令设置 `origin` 并推送。上传会创建公开可见内容，本说明没有替你执行上传。

## GitHub Pages

本项目是纯静态站点，已包含生成后的数据文件与 `.nojekyll`，无需在托管端运行 Node 构建。

仓库推送后，在 `Settings → Pages` 中选择 `Deploy from a branch`，发布分支为 `main`、目录为 `/(root)`，再保存。此设置遵循 [GitHub 官方发布来源说明](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site)。

GitHub 显示站点地址后，将其加入仓库 About 的 Website 字段。不要在发布前把尚未存在的站点地址写成可用 Demo。

`checks.yml` 只运行数据和生成文件检查，不自动创建仓库、开通 Pages 或发布外部内容。首个云端检查结果需在实际推送后确认。
