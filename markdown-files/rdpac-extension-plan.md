# RDPAC 行为准则合规系统 - LLM 微调扩展方案

## 一、现状分析

### 当前系统架构
- **规则引擎**: 66 条预定义术语，基于关键词匹配
- **LLM 智能模式**: 使用 Claude (Sonnet/Opus) 和 Gemini Pro
- **路由策略**: 根据文本复杂度自动选择引擎
- **支持模式**: 检测、转换、高亮、审计

### 现有问题
| 问题 | 影响 | 优先级 |
|------|------|--------|
| System Prompt 过于简略 | LLM 对合规规则理解不够深入 | 高 |
| 缺少具体示例 | 输出质量不稳定 | 高 |
| RDPAC 条款引用不完整 | 法规依据不充分 | 中 |
| 无知识库支持 | 无法检索具体条款 | 高 |
| 复杂度评分规则简单 | 路由决策不够精准 | 低 |

---

## 二、LLM 微调方案

### 方案一：Prompt 工程优化（立即可实施）

#### 1. 增强 System Prompt

**当前 System Prompt**:
```
你是一个医药行业合规专家，精通以下法规和准则：
1. 《RDPAC 行为准则》（2022年修订版）
2. 《中华人民共和国反不正当竞争法》...
```

**优化后 System Prompt**:

```python
ENHANCED_SYSTEM_PROMPT = """你是医药行业合规专家，精通以下法规体系：

【核心法规】
1. RDPAC 行为准则（2022修订版）
   - 第1章：与医疗卫生人员的互动
     * 1.1 禁止不正当利益输送
     * 1.2 适度招待原则
     * 1.3 学术互动规范
   - 第2章：赞助与捐赠
     * 2.1 禁止以赞助为名的商业贿赂
     * 2.2 捐赠需有书面协议
     * 2.3 捐赠目的必须纯粹
   - 第3章：医学教育活动
     * 3.1 学术会议规范
     * 3.2 讲课劳务支付标准
     * 3.3 培训内容合规要求
   - 第4章：推广活动
     * 4.1 禁止超适应症推广
     * 4.2 禁止贬低竞品
     * 4.3 禁止夸大疗效

2. 相关法律法规
   - 《反不正当竞争法》第7条（商业贿赂）
   - 《药品管理法》第88条（违规推广）
   - 《医师法》第31条（医师执业规范）
   - 《医药代表备案管理办法》

【风险识别原则】
1. **明示违规**: 直接出现违禁词（统方费、回扣、带金销售）
2. **隐含风险**: 合法包装下的违规意图
   - "学术支持"掩盖的旅游招待
   - "咨询费"掩饰的利益输送
   - "市场调研"包装的处方数据获取
3. **语境依赖**: 同一词在不同场景风险不同

【分析流程】
1. 识别表面术语
2. 分析隐含意图
3. 引用具体条款（精确到章节号）
4. 给出合规替代方案
5. 评估风险等级（高/中/低/无）

【输出要求】
- 必须引用具体的 RDPAC 条款号
- 解释必须结合语境
- 替代方案必须保持原意且合规
- 风险评估必须给出明确理由"""
```

#### 2. 添加 Few-shot 示例

```python
FEW_SHOT_EXAMPLES = """

# 示例 1：明示违规检测
输入: "王建国医生，这是我们给您的统方费，请查收。"
输出:
```json
{
  "risk_level": "高",
  "risk_items": [
    {
      "detected_text": "统方费",
      "risk_type": "销售行为",
      "risk_level": "高",
      "explanation": "支付费用获取医生处方数据，属于商业贿赂，可能触犯刑法",
      "rdpac_clause": "RDPAC 第1.1条：禁止以任何形式向医疗卫生人员输送不正当利益",
      "legal_basis": "《反不正当竞争法》第7条",
      "compliant_alternative": "处方数据合规分析服务"
    }
  ],
  "overall_assessment": "存在严重合规风险，建议立即修改",
  "compliance_score": 20,
  "suggestions": ["去除费用支付表述", "改为合规的数据服务合作方式"],
  "rdpac_references": ["RDPAC 第1.1条", "RDPAC 第2.1条"]
}
```

# 示例 2：隐含风险检测
输入: "邀请您参加三亚学术会议，全程五星级海景房住宿，会后可安排家人度假行程。"
输出:
```json
{
  "risk_level": "中",
  "risk_items": [
    {
      "detected_text": "五星级海景房住宿",
      "risk_type": "医学互动",
      "risk_level": "中",
      "explanation": "豪华住宿超出适度招待范围，且提及家人度假涉嫌变相旅游",
      "rdpac_clause": "RDPAC 第3.2条：招待应适度且与学术目的直接相关",
      "legal_basis": null,
      "compliant_alternative": "会议标准住宿（与学术参会人员一致）"
    },
    {
      "detected_text": "家人度假行程",
      "risk_type": "医学互动",
      "risk_level": "中",
      "explanation": "为家属提供度假行程，属于不正当利益输送",
      "rdpac_clause": "RDPAC 第3.2条",
      "legal_basis": null,
      "compliant_alternative": "仅邀请参会医生本人，不涉及家属行程"
    }
  ],
  "overall_assessment": "以学术为名的高标准招待，存在合规风险",
  "compliance_score": 45,
  "suggestions": ["降低住宿标准", "移除家属相关安排", "确保学术内容占主导"],
  "rdpac_references": ["RDPAC 第3.2条"]
}
```

# 示例 3：话术转换
输入: "如果多用我们的药，年底会给您额外奖励。"
输出:
```json
{
  "original_text": "如果多用我们的药，年底会给您额外奖励。",
  "converted_text": "我们期待在临床实践中收集更多疗效数据，欢迎您参与我们的真实世界研究项目。",
  "changes": [
    {
      "from": "如果多用我们的药",
      "to": "我们期待在临床实践中收集更多疗效数据",
      "reason": "去除与处方量挂钩的利益暗示"
    },
    {
      "from": "年底会给您额外奖励",
      "to": "欢迎您参与我们的真实世界研究项目",
      "reason": "将利益输送转为合规的学术合作"
    }
  ],
  "risk_level": "高",
  "rdpac_references": ["RDPAC 第1.1条", "《反不正当竞争法》第7条"],
  "alternative_options": [
    "我们欢迎您关注产品的临床应用研究进展",
    "如有学术研讨需求，我们可以安排专家交流"
  ]
}
```

# 示例 4：语境依赖判断
输入: "感谢您的支持，我们会继续做好学术服务。"（在学术会议发言中）
输出:
```json
{
  "risk_level": "无",
  "risk_items": [],
  "overall_assessment": "在学术会议场景下，'支持'指对学术内容的认可，'学术服务'为合规活动",
  "compliance_score": 100,
  "suggestions": [],
  "rdpac_references": []
}
```
"""
```

#### 3. 优化复杂度评分规则

```python
# 当前: 简单的模式匹配
IMPLICIT_PATTERNS = [
    r'帮忙.*统计', r'查.*处方', ...
]

# 优化后: 分层评分
class EnhancedComplexityScorer:
    """增强的复杂度评分器"""

    # 高风险模式（权重 0.15）
    HIGH_RISK_PATTERNS = [
        r'统方|处方数据|开药量',
        r'回扣|提成|返点',
        r'感谢费|辛苦费|劳务费.*额外',
    ]

    # 中风险模式（权重 0.10）
    MEDIUM_RISK_PATTERNS = [
        r'学术.*旅游|会议.*度假',
        r'赞助.*讲课|顾问费',
        r'维护.*关系|重点客户',
    ]

    # 语境风险（权重 0.20）
    CONTEXTUAL_RISK_PATTERNS = [
        (r'多用.*药.*奖励', '销量挂钩奖励'),
        (r'帮忙.*推广.*好处', '利益输送暗示'),
    ]

    # 语义复杂度（权重 0.10）
    def _check_semantic_complexity(self, text: str) -> float:
        """检查语义复杂度"""
        # 检测委婉表达
        # 检测行业黑话
        # 检测反讽/暗示
        pass

    @classmethod
    def score(cls, text: str, context: Optional[Dict] = None) -> float:
        """计算复杂度分数 (0-1)"""
        score = 0.0

        # 1. 长度因子 (0-0.15)
        length = len(text)
        if length > 500:
            score += 0.15
        elif length > 200:
            score += 0.10
        elif length > 100:
            score += 0.05

        # 2. 高风险模式检测 (0-0.30)
        for pattern in cls.HIGH_RISK_PATTERNS:
            if re.search(pattern, text):
                score += 0.15
                break  # 检测到一个即可

        # 3. 中风险模式检测 (0-0.25)
        medium_count = sum(1 for p in cls.MEDIUM_RISK_PATTERNS if re.search(p, text))
        score += min(medium_count * 0.08, 0.25)

        # 4. 语境风险 (0-0.20)
        for pattern, risk_type in cls.CONTEXTUAL_RISK_PATTERNS:
            if re.search(pattern, text):
                score += 0.20
                break

        # 5. 医学术语密度 (0-0.10)
        # 保留原有逻辑

        return min(score, 1.0)
```

---

### 方案二：RAG 知识增强（推荐实施）

#### 架构设计

```
backend/
├── llm/
│   ├── rag/                    # 新增 RAG 模块
│   │   ├── __init__.py
│   │   ├── retriever.py        # 向量检索器
│   │   ├── knowledge_base.py   # 知识库管理
│   │   ├── embeddings.py       # 向量化处理
│   │   └── claude_router.py    # Claude semantic router
│   ├── prompts.py              # 现有，需增强
│   ├── router.py               # 现有，需集成 RAG
│   └── ...
├── data/
│   ├── terms.json              # 现有术语库
│   ├── rdpac/                  # 新增 RDPAC 法规库
│   │   ├── clauses.json        # 条款结构化数据
│   │   ├── full_text.md        # 完整文档
│   │   └── examples.json       # 官方案例
│   ├── cases/                  # 新增合规案例库
│   │   ├── high_risk_cases.jsonl
│   │   ├── medium_risk_cases.jsonl
│   │   └── edge_cases.jsonl
│   └── embeddings/             # 向量缓存
│       ├── clauses_embeddings.pkl
│       └── cases_embeddings.pkl
```

#### 数据结构设计

**rdpac/clauses.json**:
```json
{
  "clauses": [
    {
      "id": "RDPAC-1.1",
      "chapter": "第1章 与医疗卫生人员的互动",
      "section": "1.1 利益输送禁止",
      "content": "禁止以任何形式向医疗卫生人员输送不正当利益，包括但不限于现金、礼品、旅游、娱乐等。",
      "keywords": ["利益输送", "不正当利益", "礼品", "旅游", "娱乐"],
      "risk_level": "高",
      "examples": [
        "支付处方数据获取费用",
        "提供豪华旅游招待",
        "赠送贵重礼品"
      ]
    },
    {
      "id": "RDPAC-3.2",
      "chapter": "第3章 医学教育活动",
      "section": "3.2 招待适度原则",
      "content": "医学教育活动的招待应适度，不得超出合理范围，且必须与学术目的直接相关。",
      "keywords": ["招待", "适度", "学术活动", "会议"],
      "risk_level": "中",
      "examples": [
        "五星级酒店住宿",
        "高尔夫球活动",
        "家属参与行程"
      ]
    }
  ]
}
```

**cases/high_risk_cases.jsonl**:
```jsonl
{"input": "统方费结算", "output": "处方数据服务费", "reason": "去除贿赂暗示", "clause_ref": "RDPAC-1.1"}
{"input": "带金销售", "output": "基于疗效的学术推广", "reason": "禁止与处方量挂钩", "clause_ref": "RDPAC-1.1"}
{"input": "给医生的讲课费", "output": "专家劳务报酬", "reason": "规范化表述", "clause_ref": "RDPAC-3.1"}
```

#### RAG 实现代码

```python
# llm/rag/knowledge_base.py
import json
import pickle
from typing import List, Optional
from pathlib import Path

class ComplianceKnowledgeBase:
    """医药合规知识库"""

    def __init__(self, data_dir: str = "data"):
        self.data_dir = Path(data_dir)
        self.clauses = self._load_clauses()
        self.cases = self._load_cases()
        self.embeddings_cache = {}

    def _load_clauses(self) -> List[dict]:
        """加载 RDPAC 条款"""
        with open(self.data_dir / "rdpac" / "clauses.json", encoding="utf-8") as f:
            data = json.load(f)
        return data.get("clauses", [])

    def _load_cases(self) -> List[dict]:
        """加载合规案例"""
        cases = []
        for case_file in ["high_risk_cases.jsonl", "medium_risk_cases.jsonl"]:
            path = self.data_dir / "cases" / case_file
            if path.exists():
                with open(path, encoding="utf-8") as f:
                    for line in f:
                        cases.append(json.loads(line))
        return cases

    async def search_relevant_clauses(
        self,
        query: str,
        top_k: int = 3,
        min_similarity: float = 0.5
    ) -> List[dict]:
        """
        检索与查询相关的 RDPAC 条款

        Args:
            query: 查询文本
            top_k: 返回前 k 个最相关的条款
            min_similarity: 最小相似度阈值

        Returns:
            相关条款列表，按相似度排序
        """
        # 1. 关键词匹配（快速筛选）
        keyword_matches = self._keyword_search(query, self.clauses)

        # 2. 语义相似度（可选，使用 Claude API）
        semantic_matches = await self._semantic_search(query, keyword_matches)

        # 3. 排序并返回 top_k
        results = sorted(
            semantic_matches,
            key=lambda x: x.get("similarity", 0),
            reverse=True
        )[:top_k]

        return [r for r in results if r.get("similarity", 0) >= min_similarity]

    def _keyword_search(self, query: str, clauses: List[dict]) -> List[dict]:
        """关键词搜索"""
        matches = []
        for clause in clauses:
            score = 0
            # 检查 query 是否包含条款关键词
            for keyword in clause.get("keywords", []):
                if keyword in query:
                    score += 1
            # 检查条款内容是否相关
            if score > 0:
                matches.append({**clause, "similarity": score * 0.3})
        return matches

    async def _semantic_search(
        self,
        query: str,
        candidates: List[dict]
    ) -> List[dict]:
        """语义相似度搜索（使用 Claude）"""
        # 这里可以调用 Claude 的 embeddings API
        # 或者使用简单的文本相似度算法
        # 暂时返回候选结果
        return candidates

    async def search_similar_cases(
        self,
        query: str,
        top_k: int = 5,
        risk_level: Optional[str] = None
    ) -> List[dict]:
        """
        检索相似的合规案例

        Args:
            query: 查询文本
            top_k: 返回前 k 个案例
            risk_level: 筛选特定风险等级

        Returns:
            相似案例列表
        """
        results = self.cases.copy()

        # 按风险等级筛选
        if risk_level:
            results = [r for r in results if r.get("risk_level") == risk_level]

        # 简单的文本匹配（可优化为向量检索）
        for case in results:
            similarity = self._text_similarity(query, case.get("input", ""))
            case["similarity"] = similarity

        # 排序并返回
        results.sort(key=lambda x: x.get("similarity", 0), reverse=True)
        return results[:top_k]

    def _text_similarity(self, text1: str, text2: str) -> float:
        """简单的文本相似度计算"""
        words1 = set(text1)
        words2 = set(text2)
        if not words1 or not words2:
            return 0
        intersection = words1 & words2
        union = words1 | words2
        return len(intersection) / len(union)


# llm/rag/__init__.py
from .knowledge_base import ComplianceKnowledgeBase

_kb_instance: Optional[ComplianceKnowledgeBase] = None

def get_knowledge_base() -> ComplianceKnowledgeBase:
    """获取知识库单例"""
    global _kb_instance
    if _kb_instance is None:
        _kb_instance = ComplianceKnowledgeBase()
    return _kb_instance
```

#### 集成到 Prompt

```python
# llm/prompts.py 增强
from .rag import get_knowledge_base

async def build_rag_detection_prompt(text: str, context: Optional[Dict] = None) -> str:
    """基于 RAG 的检测 Prompt"""
    kb = get_knowledge_base()

    # 1. 检索相关条款
    relevant_clauses = await kb.search_relevant_clauses(text, top_k=3)

    # 2. 检索相似案例
    similar_cases = await kb.search_similar_cases(text, top_k=2)

    # 3. 格式化检索结果
    clauses_text = "\n".join([
        f"- [{c['id']}] {c['section']}: {c['content']}"
        for c in relevant_clauses
    ])

    cases_text = "\n".join([
        f"- 「{case['input']}」 → 「{case['output']}」 ({case['reason']})"
        for case in similar_cases
    ])

    # 4. 构建 Prompt
    prompt = f"""{ENHANCED_SYSTEM_PROMPT}

# 参考法规条款
{clauses_text if relevant_clauses else "未检索到直接相关条款，请基于通用原则判断"}

# 相似案例参考
{cases_text if similar_cases else "暂无相似案例"}

# 待分析文本
{text}

请结合上述法规条款和案例，分析文本的合规性，严格按照 JSON 格式输出。"""

    return prompt
```

---

### 方案三：模型 Fine-tuning（长期方案）

#### 数据准备

**训练数据格式** (JSONL):
```jsonl
{"messages": [
    {"role": "system", "content": "你是医药行业合规专家..."},
    {"role": "user", "content": "检测以下文本的合规风险：王医生，这是统方费"},
    {"role": "assistant", "content": "{\"risk_level\": \"高\", \"risk_items\": [...], ...}"}
]}

{"messages": [
    {"role": "system", "content": "你是医药行业合规专家..."},
    {"role": "user", "content": "转换以下话术为合规表达：如果多开药有奖励"},
    {"role": "assistant", "content": "{\"original_text\": ..., \"converted_text\": ..., ...}"}
]}
```

#### 数据收集计划

| 数据源 | 数量目标 | 收集方式 |
|--------|----------|----------|
| 现有术语扩展 | 200+ | 基于66条扩展同义词、变体 |
| 真实案例 | 500+ | 合规部门审计案例 |
| 合规转换对 | 1000+ | 专家标注的转换前后文本 |
| 边界案例 | 200+ | 困难、模糊场景 |

#### Fine-tuning 流程

```bash
# 1. 使用 Claude Fine-tuning API
# (或使用开源模型 Qwen/ChatGLM 在本地训练)

# 2. 验证与评估
#   - 准确率：风险等级判断准确度
#   - 召回率：违规术语识别覆盖率
#   - F1 分数：综合评估

# 3. A/B 测试
#   - 对比基线模型 vs 微调模型
#   - 在真实场景中测试
```

---

## 三、实施路线图

### 阶段一：Prompt 优化（1-2 周）⭐ **当前执行阶段**

#### 优化目标
| 指标 | 优化前 | 目标 |
|------|--------|------|
| System Prompt token数 | ~150 | >1500 |
| Few-shot 示例 | 0 | 10 |
| 高风险检测准确率 | ~70% | >80% |
| RDPAC 条款引用率 | ~30% | >80% |
| 误报率 | ~20% | <15% |

#### 实施步骤详解

##### 步骤 1：增强 System Prompt
**文件**: `backend/llm/prompts.py`

替换现有的 `SYSTEM_PROMPT`（第28-36行）为包含详细 RDPAC 条款的增强版本：

```python
ENHANCED_SYSTEM_PROMPT = """你是医药行业合规专家，精通中国医药行业法规体系。

【RDPAC 行为准则核心条款】

第1章 与医疗卫生人员的互动
  1.1 禁止利益输送
    - 禁止以任何形式输送不正当利益（现金、礼品卡、旅游等）
    - 违规术语：统方费、带金销售、处方提成、回扣
    - 相关法律：《反不正当竞争法》第7条、《刑法》第164条

  1.2 适度招待原则
    - 招待必须适度、合理，与学术目的直接相关
    - 不得提供奢华住宿、旅游、娱乐活动
    - 违规术语：宴请、客户旅游、学术旅游

  1.3 学术互动规范
    - 互动必须基于学术和医学需求
    - 讲课劳务需符合市场标准且有真实学术服务
    - 违规术语：顾问费、讲课费额外、维护关系

第2章 赞助与捐赠
  2.1 禁止以赞助为名的商业贿赂
    - 赞助必须有书面协议，不得与处方量挂钩
    - 违规术语：科室赞助、赞助客户、市场开发费

第3章 医学教育活动
  3.1 学术会议规范
    - 场所选择应合理，不得选择旅游胜地
    - 违规术语：学术旅游、会议招待

第4章 推广活动规范
  4.1 禁止超适应症推广、禁止贬低竞品
    - 违规术语：抢占市场、打压竞品、线下促销
  4.2 患者活动规范
    - 不得诱导患者用药或过度治疗
    - 违规术语：患者拉新、患者返利、病友群分销

第5章 互联网推广
  5.1 处方药网络销售限制
    - 违规术语：直播带货、违规处方药销售

【风险识别原则】
1. 明示违规：直接违禁词 → 高风险
2. 隐含风险：委婉语、暗语 → 中-高风险
3. 语境依赖：需结合场景判断 → 低-高风险

【分析流程】
1. 术语识别 → 2. 意图分析 → 3. 条款匹配 → 4. 风险评级 → 5. 替代建议

【输出要求】
- 必须引用具体的 RDPAC 条款号（如：RDPAC 第1.1条）
- 解释必须结合语境
- 替代方案必须保持原意且合规
"""
```

##### 步骤 2：添加 10 个 Few-shot 示例
**文件**: `backend/llm/prompts.py`

添加覆盖不同场景的示例：

| # | 场景 | 风险类型 | 风险等级 | 关键术语 |
|---|------|----------|----------|----------|
| 1 | 明示商业贿赂 | 销售行为 | 高 | 统方费、提成 |
| 2 | 隐含关系维护 | 客户管理 | 中 | VIP医生、维护关系、礼品旅游 |
| 3 | 学术活动伪装 | 费用管理 | 中 | 五星住宿、家属度假 |
| 4 | 话术转换 | 销售行为 | 高 | 多开药有奖励 |
| 5 | 患者诱导 | 患者项目 | 高 | 买赠、返利 |
| 6 | 竞品攻击 | 推广策略 | 高 | 贬低竞品 |
| 7 | 市场准入贿赂 | 市场准入 | 高 | 攻关、好处 |
| 8 | 语境依赖（安全） | 学术场景 | 无 | 学术会议发言 |
| 9 | 复杂多风险 | 多重 | 高 | 赞助+进院+旅游 |
| 10 | 数字化营销 | 数字营销 | 高 | 爬虫、定向推送 |

##### 步骤 3：更新 Prompt 模板
**文件**: `backend/llm/prompts.py`

修改 `COMPLIANCE_DETECTION` 和 `TEXT_CONVERSION` 模板，集成 few-shot 示例。

##### 步骤 4：增强复杂度评分算法
**文件**: `backend/llm/router.py`

替换 `ComplexityScorer` 类（第30-84行）：

```python
class EnhancedComplexityScorer:
    """增强的文本复杂度评分器"""

    # 高风险术语（权重 2.0）
    HIGH_RISK_PATTERNS = [
        r'统方|处方数据|处方量',
        r'回扣|提成|返点|辛苦费|感谢费',
        r'带金销售|处方激励|开药.*奖励',
        r'攻关|搞定|打点|疏通',
    ]

    # 中风险术语（权重 1.0）
    MEDIUM_RISK_PATTERNS = [
        r'维护.*关系|感情维护',
        r'学术.*旅游|会议.*度假|家属.*旅游',
        r'赞助.*讲课|顾问费|额外.*劳务',
        r'VIP.*医生|重点.*客户|核心.*客户',
    ]

    # 语境风险（权重 1.5）
    CONTEXTUAL_RISK_PATTERNS = [
        (r'多用.*药.*奖励', '销量挂钩奖励'),
        (r'帮忙.*推广.*好处', '利益输送暗示'),
    ]
```

调整路由阈值：
```python
self.thresholds = {
    'rule_engine': 0.20,     # 0-0.20: 规则引擎
    'sonnet': 0.55,          # 0.20-0.55: Claude Sonnet
    'opus': 0.80,            # 0.55-0.80: Claude Opus
}
```

##### 步骤 5：创建测试文件
**新文件**: `backend/tests/test_prompt_optimization.py`

```python
import pytest
from llm.prompts import PromptTemplates
from llm.router import EnhancedComplexityScorer

def test_system_prompt_contains_rdpac():
    """验证系统提示词包含 RDPAC 条款"""
    prompt = PromptTemplates.ENHANCED_SYSTEM_PROMPT
    assert "RDPAC" in prompt
    assert "1.1" in prompt
    assert "反不正当竞争法" in prompt

def test_high_risk_detection():
    """测试高风险术语检测"""
    result = EnhancedComplexityScorer.score("给医生的统方费和处方提成")
    assert result > 0.5

def test_no_risk_text():
    """测试无风险文本"""
    text = "我们欢迎您参加下周的学术研讨会"
    result = EnhancedComplexityScorer.score(text)
    assert result < 0.3
```

#### 时间表（2周）

**第1周：核心 Prompt 增强**
- Day 1: 实现 ENHANCED_SYSTEM_PROMPT
- Day 2: 添加前5个 Few-shot 示例
- Day 3: 完成剩余5个示例
- Day 4: 更新 Prompt 模板
- Day 5: 实现 EnhancedComplexityScorer
- Day 6-7: 单元测试和调整

**第2周：集成和验证**
- Day 1: 更新 ComplianceRouter
- Day 2: 更新 API 调试端点
- Day 3: 集成测试
- Day 4: 手动验证测试
- Day 5: 性能测试
- Day 6-7: 文档完善

#### 验证检查清单

| # | 测试用例 | 预期行为 | 状态 |
|---|----------|----------|------|
| 1 | 高风险术语（统方费） | 检测为"高"风险，引用 RDPAC 1.1 | ⬜ |
| 2 | 中风险（VIP医生维护） | 检测为"中"风险 | ⬜ |
| 3 | 无风险文本 | 返回"无"风险 | ⬜ |
| 4 | 语境依赖 | 考虑上下文分析 | ⬜ |
| 5 | RDPAC 条款引用 | 包含具体条款号 | ⬜ |
| 6 | 法律依据引用 | 包含具体法律条文 | ⬜ |
| 7 | 话术转换 | 提供合规替代方案 | ⬜ |
| 8 | 多风险文本 | 检测所有风险项 | ⬜ |
| 9 | 路由决策 | 选择正确模型 | ⬜ |
| 10 | 响应时间 | Sonnet <5s, Opus <10s | ⬜ |

#### 关键文件清单

| 文件 | 修改类型 | 修改内容 |
|------|----------|----------|
| `backend/llm/prompts.py` | 修改 | ENHANCED_SYSTEM_PROMPT、FEW_SHOT_EXAMPLES、更新模板 |
| `backend/llm/router.py` | 修改 | EnhancedComplexityScorer、更新路由逻辑 |
| `backend/tests/test_prompt_optimization.py` | 新增 | 单元测试 |
| `backend/api/main.py` | 可选 | 更新 `/api/v2/route-info` 调试端点 |

**预期效果**: 准确率提升 15-20%

### 阶段二：RAG 知识库（2-4 周）

- [ ] 结构化 RDPAC 条款数据
- [ ] 收集并标注合规案例
- [ ] 实现向量检索功能
- [ ] 集成到现有路由系统

**预期效果**: 准确率提升 30-40%，条款引用准确度显著提升

### 阶段三：Fine-tuning（3-6 个月）

- [ ] 收集 1000+ 训练样本
- [ ] 数据清洗与标注
- [ ] 模型训练与验证
- [ ] 部署与监控

**预期效果**: 形成专属合规模型，准确率 90%+

---

## 四、评估指标

### 质量指标

| 指标 | 目标值 | 计算方式 |
|------|--------|----------|
| 风险检测准确率 | >90% | 正确判断数 / 总判断数 |
| 违规术语召回率 | >95% | 检测到的违规数 / 实际违规数 |
| 条款引用准确率 | >85% | 正确引用条款数 / 总引用数 |
| 转换质量评分 | >4.0/5 | 专家打分 |
| 响应时间 | <3s | P95 延迟 |

### 监控指标

```python
# 监控 LLM 输出质量
class LLMQualityMonitor:
    """LLM 质量监控"""

    async def track_prediction(
        self,
        input_text: str,
        prediction: dict,
        ground_truth: Optional[dict] = None
    ):
        """追踪预测结果"""
        metrics = {
            "input_length": len(input_text),
            "risk_level": prediction.get("risk_level"),
            "num_risk_items": len(prediction.get("risk_items", [])),
            "has_clause_reference": bool(prediction.get("rdpac_references")),
            "latency_ms": prediction.get("latency_ms"),
        }

        if ground_truth:
            metrics["accuracy"] = self._calculate_accuracy(prediction, ground_truth)

        # 记录到监控系统
        await self.log(metrics)

    def _calculate_accuracy(self, prediction: dict, ground_truth: dict) -> float:
        """计算准确率"""
        # 比较风险等级
        risk_match = prediction.get("risk_level") == ground_truth.get("risk_level")

        # 比较风险项数量
        count_match = len(prediction.get("risk_items", [])) == len(ground_truth.get("risk_items", []))

        return 1.0 if (risk_match and count_match) else 0.5 if risk_match else 0.0
```

---

## 五、风险与注意事项

| 风险 | 影响 | 缓解措施 |
|------|------|----------|
| LLM 幻觉 | 条款引用错误 | RAG 检索 + 人工审核 |
| 过度敏感 | 误判正常话术 | 调整阈值 + 场景上下文 |
| 成本控制 | API 费用过高 | 路由优化 + 缓存 |
| 数据安全 | 合规数据泄露 | 本地部署 + 访问控制 |

---

## 六、附录：当前文件修改清单

### 需要修改的文件

1. **backend/llm/prompts.py**
   - 添加 `ENHANCED_SYSTEM_PROMPT`
   - 添加 `FEW_SHOT_EXAMPLES`
   - 添加 `build_rag_detection_prompt()`

2. **backend/llm/router.py**
   - 集成 RAG 检索
   - 更新复杂度评分算法

3. **backend/llm/rag/** (新建)
   - `knowledge_base.py`
   - `retriever.py`
   - `embeddings.py`

4. **backend/data/rdpac/** (新建)
   - `clauses.json`
   - `examples.json`

5. **backend/data/cases/** (新建)
   - `high_risk_cases.jsonl`
   - `medium_risk_cases.jsonl`
   - `edge_cases.jsonl`

---

*文档版本: v1.0*
*最后更新: 2026-01-09*
