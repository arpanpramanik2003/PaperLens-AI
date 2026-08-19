import sys
import os
import time
import asyncio
from typing import Dict, Any

# Ensure UTF-8 output on Windows console
if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass

# Ensure backend app is in python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.services.agents.tools import TOOL_REGISTRY, NATIVE_TOOLS_SCHEMA, validate_and_normalize_tool_args
from app.services.agents.router import select_agent_tools
from app.services.agents import react_agent, planner
from app.core.database import SessionLocal
from app.models.agent_task import AgentTask


async def test_type_safe_argument_validation():
    print("=" * 65)
    print("1. Testing Type-Safe Parameter Normalization Layer (SEC-05)...")
    print("=" * 65)

    # Test 1: search_papers with malformed string limit and missing domain
    args1 = validate_and_normalize_tool_args(
        "search_papers",
        {"limit": "999", "query": "Brain Tumor MRI"},
        goal="Brain Tumor Classification",
    )
    print(f"   [RESULT] search_papers args: {args1}")
    assert args1["domain"] == "Brain Tumor MRI"
    assert args1["limit"] == 50, f"Expected limit capped at 50, got {args1['limit']}"

    # Test 2: find_datasets with empty dict
    args2 = validate_and_normalize_tool_args("find_datasets", {}, goal="Molecular GNN")
    print(f"   [RESULT] find_datasets args: {args2}")
    assert args2["topic"] == "Molecular GNN"

    # Test 3: detect_gaps with injected paper_id
    args3 = validate_and_normalize_tool_args(
        "detect_gaps",
        {"domain": "LLM Alignment"},
        goal="LLM Alignment",
        paper_id="paper-uuid-1234",
    )
    print(f"   [RESULT] detect_gaps args: {args3}")
    assert args3["paper_id"] == "paper-uuid-1234"
    assert args3["domain"] == "LLM Alignment"

    print("   [OK] Type-safe parameter validation tests passed!\n")


async def test_tier1_direct_execution_benchmark():
    print("=" * 65)
    print("2. Benchmarking Tier 1 Direct Execution Strategy (SEC-04)...")
    print("=" * 65)

    db = SessionLocal()
    task = AgentTask(
        id=f"test-bench-{int(time.time())}",
        user_id="test-user",
        session_id="test-session-bench",
        goal="Recommend SOTA datasets and benchmarks for Brain Tumor Classification",
        status="pending",
    )
    db.add(task)
    db.commit()

    start_time = time.time()
    await react_agent.run_react_agent_loop(
        task_id=task.id,
        user_id="test-user",
        goal=task.goal,
        session_id="test-session-bench",
    )
    elapsed = time.time() - start_time

    db.refresh(task)
    print(f"   [RESULT] Task Status: {task.status}")
    print(f"   [RESULT] Execution Mode: {task.context_data.get('execution_mode')}")
    print(f"   [RESULT] Executed Tools: {task.context_data.get('executed_tools')}")
    print(f"   [RESULT] Total Latency: {elapsed:.2f}s")

    assert task.status == "done"
    assert task.context_data.get("execution_mode") == "direct"
    assert "find_datasets" in task.context_data.get("executed_tools", [])

    print("   [OK] Tier 1 Direct Execution successfully completed with 0 ReAct re-routing delays!\n")


async def test_tier2_native_tool_calling():
    print("=" * 65)
    print("3. Testing Tier 2 Native Tool Calling ReAct Loop (SEC-05)...")
    print("=" * 65)

    db = SessionLocal()
    task = AgentTask(
        id=f"test-react-{int(time.time())}",
        user_id="test-user",
        session_id="test-session-react",
        goal="Perform an exploratory literature search and formulate an open research direction for GNN Drug Binding",
        status="pending",
    )
    db.add(task)
    db.commit()

    start_time = time.time()
    await react_agent.run_react_agent_loop(
        task_id=task.id,
        user_id="test-user",
        goal=task.goal,
        session_id="test-session-react",
    )
    elapsed = time.time() - start_time

    db.refresh(task)
    print(f"   [RESULT] Task Status: {task.status}")
    print(f"   [RESULT] Execution Mode: {task.context_data.get('execution_mode')}")
    print(f"   [RESULT] Executed Tools: {task.context_data.get('executed_tools')}")
    print(f"   [RESULT] Total Latency: {elapsed:.2f}s")

    assert task.status == "done"
    print("   [OK] Tier 2 Native Tool Calling test passed!\n")


async def main():
    print("=================================================================")
    print(" RUNNING TWO-TIER EXECUTION & NATIVE TOOL CALLING TEST SUITE")
    print("=================================================================\n")

    await test_type_safe_argument_validation()
    await test_tier1_direct_execution_benchmark()
    await test_tier2_native_tool_calling()

    print("=================================================================")
    print(" [SUCCESS] ALL TWO-TIER & NATIVE TOOL TESTS COMPLETED")
    print("=================================================================")


if __name__ == "__main__":
    asyncio.run(main())
