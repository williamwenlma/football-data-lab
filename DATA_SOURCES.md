# 数据来源、字段与样本口径

## U19 出生月份案例

来源为 UEFA 的 [2025 European Under-19 Championship Final Tournament Press Kit](https://editorial.uefa.com/resources/029a-1df9fcba9b73-1eef3cfac692-1000/2025_u19_tournament_final.pdf)。2026-10-27 整理时，从原项目保存的同名 PDF 重新提取；该本地文件共 43 页，PDF 创建日期标注为 2025-06-06。网上的官方文档链接已找到，未宣称本地文件与在线文件逐字节相同。

使用的是各队 **Qualifying phase - Squad** 表：

| 国家 | PDF 页码，从 1 开始 | 含生日记录数 |
|---|---:|---:|
| Denmark | 9 | 25 |
| England | 13 | 27 |
| Germany | 17 | 26 |
| Montenegro | 21 | 25 |
| Netherlands | 25 | 26 |
| Norway | 29 | 28 |
| Spain | 35 | 25 |
| 合计 | | 182 |

这七支球队的预选赛阶段名单，并不是每队固定人数的决赛圈报名名单。罗马尼亚的相关页没有同口径的含生日预选赛阵容表，故没有补造数据。

`data/raw/u19-players.csv`：

| 字段 | 含义 |
|---|---|
| `country` | 来源表所属国家，英文 |
| `player_name` | 来源表球员姓名，保留 Unicode |
| `birth_date` | 生日，ISO `YYYY-MM-DD` |
| `source_page` | PDF 页码，从 1 开始 |

`data/csv/u19-monthly.csv` 每行是国家与月份的汇总，`month` 为 1-12，`players` 为记录条数。图表不对国家人口、总出生人数、入选机会或日期长度做标准化，不进行显著性或因果推断。

## 世界杯本地快照

来源标注来自原项目：

- [FIFA Player Statistics](https://www.fifa.com/en/tournaments/mens/worldcup/canadamexicousa2026/statistics/player-statistics)：原项目构建脚本标注日期 2026-07-20，没有随球员 JSON 保存独立采集元数据。
- [FIFA Team Statistics](https://www.fifa.com/en/tournaments/mens/worldcup/canadamexicousa2026/statistics/team-statistics)：原项目 `_metadata.json` 标注采集时间 `2026-07-21T04:03:56.026Z`。

这些日期是继承的来源标注，不是本次重新采集日期。本次保持原始 JSON 值，做结构、连接和内部一致性检查；官网可搜索到部分头部数据，但没有逐字段在线复核全部快照，也没有重新抓取。

### 分类表覆盖

| 球员子表 | 保存行数，不含表头 |
|---|---:|
| adidas Golden Boot | 280 |
| Attacking | 280 |
| Distribution | 280 |
| Defending | 280 |
| Discipline | 50 |
| Goalkeeping | 145 |
| Movement | 50 |
| Physical | 280 |

七张球队子表每张保存 48 行。这些表各自按指标排序，同一球员不保证出现在所有子表。`Rank` 是所在子表的排序名次，不是总体能力评分。

### 12 人页面样本

样本由 `data/raw/world-cup-cohort.json` 维护，沿用原项目的 12 人选择；不根据俱乐部归属动态筛选，也不证明这些人属于同一俱乐部。名单包括 Mbappe、Bellingham、Vinicius Junior、Guler、Brahim Diaz、Dumfries、Cucurella、Tchouameni、Ruediger、Courtois、Valverde 和 Endrick。国家与位置从原始统计行末尾的三字母国家代码与位置代码解析。

| 输出字段 | 原始分类 / 字段 | 单位 |
|---|---|---|
| `rank` | adidas Golden Boot / Rank | 名次 |
| `goals` | adidas Golden Boot / Goals | 球 |
| `assists` | adidas Golden Boot / Assists | 次 |
| `minutes` | adidas Golden Boot / Minutes Played | 分钟 |
| `shots` | Attacking / Attempts At Goal | 次 |
| `xg` | Attacking / xG | 预期进球 |
| `passAccuracy` | Distribution / Passing Accuracy (%) | 百分点，87 表示 87% |
| `speed` | Physical / Top Speed (km/h) | km/h |
| `sprints` | Physical / Sprints | 次 |
| `saves` | Goalkeeping / Goalkeeper Saves | 次 |

连接只使用来源表中的精确姓名；不做模糊匹配。中文显示名由样本名单提供。缺少某子表记录时，输出 `null`，CSV 留空，页面显示 `—`。例如真实记录的零进球与未收录进球字段是不同状态。

页面的进球与助攻加总只针对有值字段，并同时显示有效样本数，因此不作为所有 12 人的完整总成绩。`goals - xG` 仅为同一球员所保存数值的差，不解释为稳定能力或预测结果。

原项目手工维护的“全场最佳”获奖场次没有相应的逐场原始记录随项目保存，本版没有纳入。也未保留原页面关于皇马现役名单核对的断言。

## 可复现与更新

`npm run build` 从 `data/raw` 重建浏览器数据、JSON、CSV 及 SHA-256 来源摘要。构建不访问网络，也不依赖 Codex 的私有运行库。`npm run check` 会在输出过期时失败，而非默默展示旧图表。

更新数据时，保留原始字段和缺失值，更新来源日期说明，重新构建并运行检查。替换样本版本时应同时更新固定样本的测试与范围说明。

## 第三方内容

统计记录来源于上述机构，仓库的 MIT 代码许可不替第三方数据授予许可。原始 PDF、球员照片、队徽和背景图片没有随本版分发。页面的球员标记使用姓名首字母生成，不使用第三方肖像。
