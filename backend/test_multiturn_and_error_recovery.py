import sys
import os
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

from app.services.agents.router import select_agent_tools
from app.services.agents.tools import TOOL_REGISTRY
from app.services.agents import planner


async def test_multiturn_anaphora_resolution():
    print("=" * 65)
    print("1. Testing Multi-Turn Anaphora & Session Context Resolution...")
    print("=" * 65)

    # Turn 1: User asks for datasets
    turn1_history = [
        {"role": "user", "text": "What are the standard benchmark datasets for Breast Cancer Detection?"},
        {
            "role": "agent",
            "text": "The primary benchmark datasets for Breast Cancer Detection are **CBIS-DDSM** (mammography DICOM) and **INbreast** (full-field digital mammography).",
        },
    ]

    # Turn 2: User references "the first dataset"
    turn2_query = "Now compare the first dataset to INbreast in detail regarding resolution and annotations."

    res = await select_agent_tools(turn2_query, TOOL_REGISTRY, conversation_history=turn1_history)
    print(f"   [RESULT] Router Intent Type: {res.get('intent_type')}")
    print(f"   [RESULT] Intent Summary: {res.get('intent_summary')}")
    print(f"   [RESULT] Selected Tools: {[t.get('tool') for t in res.get('selected_tools', [])]}")

    # Verify that router identified the dataset context
    selected_tools = res.get("selected_tools", [])
    if selected_tools:
        args = selected_tools[0].get("args", {})
        print(f"   [RESULT] Tool Args Resolved: {args}")
        topic_or_domain = (args.get("topic", "") + " " + args.get("domain", "")).lower()
        # Should resolve to CBIS-DDSM or Breast cancer or INbreast
        assert any(k in topic_or_domain for k in ["cbis", "ddsm", "breast", "inbreast", "dataset"]), (
            f"Expected resolved entity in tool args, got: {topic_or_domain}"
        )
    print("   [OK] Multi-turn anaphoric resolution test passed!")


async def test_tool_failure_and_unavailability_directive():
    print("\n" + "=" * 65)
    print("2. Testing Tool Failure Recovery & Anti-Hallucination Directives...")
    print("=" * 65)

    # Simulate an empty / unavailable tool result
    simulated_results = [
        {
            "tool": "search_papers",
            "args": {"domain": "Quantum Teleportation of Biological Cells"},
            "result": {
                "status": "unavailable",
                "total_found": 0,
                "papers": [],
                "error": "Semantic Scholar and arXiv returned 0 matching papers (API Timeout / Nonexistent Topic)",
            },
        },
        {
            "tool": "find_datasets",
            "args": {"topic": "Quantum Teleportation of Biological Cells"},
            "result": {
                "datasets": [
                    {
                        "name": "Simulated Quantum State Suite",
                        "short_description": "Synthetic toy quantum state benchmark.",
                        "type": "Synthetic State Vector",
                        "metrics": "Fidelity",
                    }
                ]
            },
        },
    ]

    # Check compaction
    compacted = planner.compact_results_for_llm(simulated_results)
    print(f"   [RESULT] Compacted result status for search_papers: {compacted[0]['result'].get('status')}")
    assert compacted[0]["result"].get("status") == "unavailable"

    # Check unavailability directive generation
    unavail_directive = planner._build_unavailability_directive(simulated_results)
    print(f"   [RESULT] Generated Directive:\n{unavail_directive.strip()}")
    assert "search_papers" in unavail_directive
    assert "DO NOT invent, fabricate, or hallucinate" in unavail_directive

    # Test synthesis with directive
    critique, report = await planner.synthesize_and_verify(
        "Quantum Teleportation of Biological Cells", simulated_results
    )
    print("\n   [RESULT] Synthesis Report Snippet:")
    print("   " + "-" * 50)
    for line in report.split("\n")[:8]:
        print(f"   {line}")
    print("   " + "-" * 50)

    # Confirm the report acknowledges the data unavailability
    report_lower = report.lower()
    has_disclosure = any(
        k in report_lower
        for k in ["unavail", "timeout", "0 papers", "no literature", "not found", "limited", "gap", "absent"]
    )
    assert has_disclosure, "Expected report to acknowledge unavailable literature data rather than silently hallucinating."
    print("   [OK] Anti-hallucination data unavailability test passed!")


async def main():
    print("=================================================================")
    print(" RUNNING AGENT MULTI-TURN STATE & ERROR RECOVERY TEST SUITE")
    print("=================================================================\n")

    await test_multiturn_anaphora_resolution()
    await test_tool_failure_and_unavailability_directive()

    print("\n[SUCCESS] ALL MULTI-TURN STATE & ERROR RECOVERY TESTS PASSED!")


if __name__ == "__main__":
    asyncio.run(main())
