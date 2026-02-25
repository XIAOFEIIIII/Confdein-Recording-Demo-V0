# Figma 里导入 Token

## 方式一：Tokens Studio for Figma（推荐）

1. 在 Figma 安装插件 **Tokens Studio for Figma**（搜 “Tokens Studio” 或 “Figma Tokens”）。
2. 打开你的 Figma 文件，菜单 **Plugins** → **Tokens Studio for Figma**。
3. 在插件里：
   - 点 **「+」** 或 **Add token set**，新建一个 set，名字随便（如 `Confidein`）。
   - 选中这个 set，上方切到 **「JSON」** 视图（不要用 List 视图）。
   - 把 JSON 视图里原有内容**全选删掉**，然后：
     - **粘贴 `tokens.figma.set.json` 里的全部内容**（扁平 key 格式，方便识别），  
     - 或者粘贴 `tokens.figma.json` 里 **`"Confidein"` 对应的那整块对象**（从第一个 `"color"` 到最后一个 `}`，不要外层的 `"Confidein": { ... }`）。
   - 点 **Save** / **Update** 保存。
4. 再在插件里点 **Apply to document** / **Sync**，把 token 推到当前文件的 Variables（若提示选 mode/collection，选默认即可）。

如果 **点了「确认」或「Import」没反应**：

- 很多版本没有「从本机选 JSON 文件」的入口，要用 **「在 JSON 视图里粘贴」** 才能把 token 写进当前 set。
- 确认你贴的是 **一个 token set 的「内容」**（即纯对象 `{ "key": { "value": ..., "type": "..." }, ... }`），不要带最外层的 set 名字（例如不要 `{ "Confidein": { ... } }` 整段贴进去，只贴里面的 `{ ... }`）。
- 贴完后一定要点一次 **Save**，再 **Apply to document**。

## 方式二：用 Figma 自带 Variables

Figma 自带 Variables 不能直接导入 JSON，需要手动建变量，或靠插件从 token 同步过去。  
建议仍用方式一，在 Tokens Studio 里粘贴 → Save → Apply to document，就会在 Figma 里生成/更新 Variables。

## 文件说明

| 文件 | 用途 |
|------|------|
| `tokens.figma.set.json` | 扁平 key，适合在 Tokens Studio 的 **JSON 视图里整段粘贴** 进一个 token set。 |
| `tokens.figma.json` | 带 set 名 `Confidein` 的完整结构；若要粘贴，只贴 `Confidein` 的值（内层对象）。 |
