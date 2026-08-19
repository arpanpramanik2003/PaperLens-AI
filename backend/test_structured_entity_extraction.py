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

from app.services.agents.react_agent import extract_structured_entities
from app.services.agents.tools import TOOL_REGISTRY, validate_and_normalize_tool_args
from app.services.agents import react_agent
from app.core.database import SessionLocal
from app.models.agent_task import AgentTask


async def test_entity_extraction_functions():
    print("=" * 65)
    print("1. Testing Tool-Specific Semantic Entity Extraction...")
    print("=" * 65)

    # 1. search_papers output extraction
    sample_papers_result = {
        "total_found": 35,
        "papers": [
            {
                "paper_id": "arxiv:2401.12345",
                "title": "SE(3)-Equivariant Transformers for Protein Ligand Binding",
                "year": 2024,
                "authors": ["Alice Smith", "Bob Jones"],
                "summary": "We propose an equivariant graph transformer that models allosteric protein pocket deformation under binding stress.",
            }
        ],
    }
    extracted_p = extract_structured_entities("search_papers", sample_papers_result)
    print(f"   [RESULT] Extracted Papers: {extracted_p}")
    assert "primary_papers" in extracted_p
    assert extracted_p["primary_papers"][0]["title"] == "SE(3)-Equivariant Transformers for Protein Ligand Binding"

    # 2. detect_gaps output extraction
    sample_gaps_result = {
        "gaps": [
            {
                "gap": "Lack of 3D Conformational Dynamics in 2D Assays",
                "description": "Current screening pipelines evaluate static 2D topological graphs and fail when protein pockets undergo induced fit deformation.",
                "opportunity": "Incorporate molecular dynamics trajectory tensors into equivariant graph convolutions.",
            }
        ]
    }
    extracted_g = extract_structured_entities("detect_gaps", sample_gaps_result)
    print(f"   [RESULT] Extracted Gaps: {extracted_g}")
    assert "identified_gaps" in extracted_g
    assert extracted_g["identified_gaps"][0]["gap"] == "Lack of 3D Conformational Dynamics in 2D Assays"

    # 3. Context inheritance into generate_problem arguments
    working_memory = {}
    working_memory.update(extracted_p)
    working_memory.update(extracted_g)

    # Tool 2 (generate_problem) called with empty args -> should inherit gap from Tool 1
    norm_args = validate_and_normalize_tool_args(
        "generate_problem",
        raw_args={},
        goal="Molecular Binding Generalization",
        structured_context=working_memory,
    )
    print(f"\n   [RESULT] generate_problem normalized args: {norm_args}")
    assert "Lack of 3D Conformational Dynamics in 2D Assays" in norm_args["gap_summary"]
    print("   [OK] Entity extraction and context inheritance verified successfully!\n")


async def test_end_to_end_context_flow():
    print("=" * 65)
    print("2. Testing End-to-End Context Flow (detect_gaps -> generate_problem)...")
    print("=" * 65)

    db = SessionLocal()
    task = AgentTask(
        id=f"test-flow-{int(asyncio.get_event_loop().time() * 1000)}",
        user_id="test-user",
        session_id="test-session-flow",
        goal="Detect research gaps in Equivariant GNNs for Drug Discovery and formulate targeted problem statements",
        status="pending",
    )
    db.add(task)
    db.commit()

    await react_agent.run_react_agent_loop(
        task_id=task.id,
        user_id="test-user",
        goal=task.goal,
        session_id="test-session-flow",
    )

    db.refresh(task)
    print(f"   [RESULT] Task Status: {task.status}")
    print(f"   [RESULT] Structured Memory Keys: {list(task.context_data.get('structured_memory', {}).keys())}")
    print(f"   [RESULT] Executed Tools: {task.context_data.get('executed_tools')}")

    assert task.status == "done"
    mem = task.context_data.get("structured_memory", {})
    # Verify that memory contains structured entities from execution
    assert any(k in mem for k in ["identified_gaps", "formulated_problems", "primary_papers", "suggested_datasets"])

    print("   [OK] End-to-end multi-step structured entity flow completed successfully!\n")


async def main():
    print("=================================================================")
    print(" RUNNING STRUCTURED ENTITY EXTRACTION & CONTEXT FLOW TEST SUITE")
    print("=================================================================\n")

    await test_entity_extraction_functions()
    await test_end_to_end_context_flow()

    print("=================================================================")
    print(" [SUCCESS] ALL STRUCTURED ENTITY EXTRACTION TESTS PASSED")
    print("=================================================================")


if __name__ == "__main__":
    asyncio.run(main())
