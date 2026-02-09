# User Story: Journal Entry 经文聚合功能

## 为什么需要这个功能？

### 用户痛点
1. **分散的经文引用难以回顾**：用户在多个 journal entry 中引用经文，但无法集中查看所有引用过的经文
2. **无法发现灵修模式**：用户不知道自己经常引用哪些经文，哪些主题的经文出现频率高
3. **查找相关 entry 困难**：想找到引用某段经文的所有 journal entry 需要逐个翻阅
4. **缺乏灵修连续性**：无法快速回顾自己在一段时间内引用的经文，建立灵修主题的连续性

### 产品价值
- **提升灵修连续性**：帮助用户发现自己的灵修主题和模式
- **增强内容关联性**：建立 journal entry 和经文之间的双向链接
- **简化信息检索**：提供统一的经文查看入口，无需在时间线中查找
- **支持灵修成长**：通过回顾引用的经文，帮助用户看到自己的灵修成长轨迹

---

## User Story

### 作为（As a）
**灵修日记用户**（Roman/Erica）

### 我想要（I want）
**自动聚合我在 journal entry 中记录的所有经文引用**

### 以便于（So that）
- 我可以在一个集中的地方查看所有引用过的经文
- 我可以快速找到引用某段经文的所有 journal entry
- 我可以发现自己的灵修主题和经常引用的经文
- 我可以建立灵修内容的连续性和关联性

---

## 功能说明

### 核心功能
1. **自动提取**：系统自动从用户保存的 journal entry 中提取 `scripture` 字段（经文引用）
2. **去重聚合**：相同引用的经文只显示一次，避免重复
3. **关联追踪**：每个聚合的经文都保留与源 journal entry 的关联（通过 `entryId`）
4. **集中展示**：所有聚合的经文在 Journal 页面的 Verse 子标签页中统一展示

### 数据流向
```
Journal Entry (保存时)
    ↓
提取 scripture 字段
    ↓
检查 verseList 中是否已存在相同 reference
    ↓
如果不存在 → 添加到 verseList（标记 source: 'journal', entryId: entry.id）
如果已存在 → 更新 entryId（保留最新关联的 entry）
    ↓
Verse Tab 显示所有 source === 'journal' 的经文
```

---

## 规则说明

### 1. 聚合规则
- **触发时机**：仅在 journal entry **保存时**进行聚合
- **数据来源**：仅聚合 journal entry 中的 `scripture` 字段
- **排除来源**：
  - ❌ 不包含从 Devotional 中提取的经文
  - ❌ 不包含用户手动添加的经文
  - ✅ 仅包含 journal entry 中记录的经文

### 2. 去重规则
- **去重依据**：基于 `reference`（经文引用）字符串完全匹配
- **去重行为**：
  - 如果 `verseList` 中已存在相同 `reference`，不添加新条目
  - 如果已存在但 `entryId` 不同，更新 `entryId` 为最新保存的 entry（保留最新关联）

### 3. 数据关联规则
- **单向关联**：Verse → Entry（经文可以追溯到 journal entry，但 entry 不强制依赖 verse）
- **关联信息**：
  - `entryId`：关联的 journal entry ID
  - `source: 'journal'`：标记来源为 journal entry
- **关联更新**：当相同 reference 的 entry 被保存时，更新 `entryId` 为最新保存的 entry

### 4. 显示规则
- **显示位置**：Journal 页面 → Verse 子标签页
- **显示内容**：
  - 经文文本（`verse` 字段，如果有）
  - 经文引用（`reference` 字段）
  - 来源标签："Journal"
  - 查看 entry 链接："← View entry"（如果有关联的 entry）
- **过滤规则**：Verse Tab 仅显示 `source === 'journal'` 的经文

### 5. 用户切换规则
- **用户隔离**：不同用户（Roman/Erica）的 `verseList` 完全独立
- **切换行为**：切换用户时，重新从该用户的所有 `entries` 中聚合经文，重建 `verseList`

---

## 交互说明

### 1. Journal Entry 中的经文显示

**位置**：Journal Timeline 中每个 entry 的 scripture 字段

**显示样式**：
- 使用 handwriting 字体
- 文字颜色：`text-stone-800`，透明度 90%
- 可点击状态：鼠标悬停时变为紫色（`hover:text-purple-600/70`）
- 光标样式：`cursor-pointer`

**交互行为**：
- **点击 scripture** → 跳转到 Journal 页面的 Verse 子标签页
- 跳转后，Verse Tab 显示所有聚合的经文（包括当前点击的经文）

### 2. Verse Tab 中的经文展示

**位置**：Journal 页面 → Verse 子标签页

**显示结构**：
```
"经文文本内容"
— 经文引用（如：Psalm 23:1）

JOURNAL  ← View entry
```

**交互元素**：
1. **经文文本**：
   - 如果有 `verse` 文本，显示带引号的完整文本
   - 如果没有 `verse` 文本，显示 `reference`
   - 如果正在加载，显示 "Loading..."

2. **来源标签**：
   - 显示 "JOURNAL"（大写，小字号，低透明度）
   - 表示该经文来自 journal entry

3. **查看 Entry 链接**：
   - 文字："← View entry"
   - 位置：来源标签右侧
   - 样式：小字号，低透明度，hover 时变深
   - **点击行为**：
     - 切换到 Journal 子标签页
     - 打开对应的 journal entry 编辑器（`handleEntryClick`）

### 3. Entry 保存时的自动聚合

**触发时机**：用户点击 Entry Editor 的保存按钮

**处理流程**：
1. 保存 entry 到 `entries` 数组
2. 检查 `updatedEntry.scripture` 是否存在
3. 如果存在：
   - 检查 `verseList` 中是否已有相同 `reference`
   - 如果不存在 → 添加新条目：`{ verse: '', reference: scripture, entryId: entry.id, source: 'journal' }`
   - 如果已存在 → 更新该条目的 `entryId` 为当前 entry.id
4. 更新后的 `verseList` 自动反映在 Verse Tab 中

### 4. 用户切换时的重新聚合

**触发时机**：用户通过 Settings 页面切换用户（Roman ↔ Erica）

**处理流程**：
1. 更新 `currentUser` 状态
2. 加载新用户的所有 `entries`
3. 扫描所有 `entries`，提取所有 `scripture` 字段
4. 去重后构建新的 `verseList`，标记 `source: 'journal'` 和对应的 `entryId`
5. Verse Tab 自动更新显示新用户的聚合经文

---

## 技术实现要点

### 状态管理
- `verseList` 存储在 `App.tsx` 的 state 中
- 类型定义：`Array<{ verse: string; reference: string; entryId?: string; source?: 'journal' }>`

### 关键函数
- `handleEntrySave`：处理 entry 保存时的聚合逻辑
- `getInitialState`：初始化时从现有 entries 聚合经文
- `useEffect`（监听 `currentUser` 变化）：用户切换时重新聚合

### 组件通信
- `JournalTimeline` → `App`：通过 `onNavigateToVerse` prop 传递跳转函数
- `App` → `VerseListWithFetch`：传递过滤后的 `verseList`（仅 `source === 'journal'`）
- `VerseListWithFetch` → `App`：通过 `onNavigateToEntry` 回调跳转回 journal entry

---

## 未来扩展可能性

1. **经文去重优化**：支持不同格式的相同经文识别（如 "Psalm 23:1" vs "Ps 23:1"）
2. **经文统计**：显示每段经文被引用的次数
3. **主题聚类**：基于引用的经文自动识别用户的灵修主题
4. **时间线视图**：按时间顺序查看经文引用历史
5. **经文搜索**：在 Verse Tab 中支持搜索功能
