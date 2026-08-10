import sys
import os

# Ensure backend app is in python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.services.agents.react_agent import ReActDecision
from app.services.llm_sections.analysis import enforce_strict_analysis_format
from app.services.llm_sections.qa import _sanitize_no_table_output, QAResponse


def test_react_decision_pydantic():
    print("Testing ReActDecision Pydantic schema validation...")
    sample_json = '''{
        "thought": "User wants literature search on GNNs",
        "action": "search_papers",
        "action_input": {"domain": "GNNs for Drug Discovery"},
        "is_final": false,
        "memory_summary": "Searching literature for GNN papers"
    }'''
    decision = ReActDecision.model_validate_json(sample_json)
    assert decision.action == "search_papers"
    assert decision.is_final is False
    assert decision.action_input["domain"] == "GNNs for Drug Discovery"
    print("[OK] ReActDecision schema validation passed!")


def test_analysis_xml_parsing():
    print("Testing enforce_strict_analysis_format XML section parsing...")
    sample_xml = '''
    <summary>
    This paper introduces a novel equivariant GNN architecture for molecular binding.
    </summary>

    <problem_statement>
    - 2D molecular graphs fail to represent 3D binding conformation dynamics.
    - Assay label sparsity limits zero-shot generalization.
    </problem_statement>

    <methodology>
    - Construct SE(3)-equivariant message passing layers.
    - Pre-train on 10M unlabeled molecular structures using substructure masking.
    </methodology>

    <results>
    - Achieves 30% MAE reduction on PDBbind v2020 benchmark [Page 4].
    </results>

    <limitations>
    - High computational complexity during 3D point cloud generation.
    </limitations>

    <future_work>
    - Extend to large protein-ligand complex docking models.
    </future_work>
    '''
    formatted_md = enforce_strict_analysis_format(sample_xml)
    assert "## Executive Summary" in formatted_md
    assert "## Problem Statement" in formatted_md
    assert "## Methodology" in formatted_md
    assert "## Results" in formatted_md
    assert "## Limitations" in formatted_md
    assert "## Future Work" in formatted_md
    print("[OK] enforce_strict_analysis_format XML parsing passed!")
    print("\nRendered Markdown Output Preview:\n" + "-"*40 + "\n" + formatted_md + "\n" + "-"*40)


def test_qa_xml_parsing():
    print("Testing _sanitize_no_table_output XML answer tag parsing...")
    sample_qa_output = '''
    <answer>
    The paper titled "Equivariant 3D Networks" was authored by Smith et al. [Page 1].
    
    Key Highlights:
    - Novel SE(3) architectural framework.
    - Benchmark accuracy gains across 3 datasets.
    </answer>
    <citations>
    Page 1, Page 4
    </citations>
    '''
    cleaned_answer = _sanitize_no_table_output(sample_qa_output)
    assert "Equivariant 3D Networks" in cleaned_answer
    assert "<answer>" not in cleaned_answer
    assert "</answer>" not in cleaned_answer
    print("[OK] QA XML answer extraction passed!")
    print("\nCleaned QA Answer Output Preview:\n" + "-"*40 + "\n" + cleaned_answer + "\n" + "-"*40)


if __name__ == "__main__":
    test_react_decision_pydantic()
    test_analysis_xml_parsing()
    test_qa_xml_parsing()
    print("\n[SUCCESS] ALL STRUCTURED OUTPUT UNIT TESTS PASSED SUCCESSFULLY!")
