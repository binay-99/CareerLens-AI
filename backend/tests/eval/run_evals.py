import asyncio
import json
import os
import sys

# Add backend app directory to path so imports work cleanly
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "../../..")))

from backend.app.agents.orchestrator import build_agent

def score_role_relevance(output: str, expected: dict) -> float:
    output_lower = output.lower()
    hits = sum(1 for role in expected["top_roles_should_include"] 
               if role.lower() in output_lower)
    
    false_positives = sum(1 for role in expected["top_roles_should_not_include"] 
                         if role.lower() in output_lower)
                         
    base_score = hits / len(expected["top_roles_should_include"]) if expected["top_roles_should_include"] else 1.0
    penalty = false_positives * 0.2
    
    return max(0.0, base_score - penalty)

def score_gap_completeness(output: str, expected: dict) -> float:
    output_lower = output.lower()
    hits = sum(1 for gap in expected["critical_gaps_should_include"]
               if gap.lower() in output_lower)
    return hits / len(expected["critical_gaps_should_include"]) if expected["critical_gaps_should_include"] else 1.0

def score_responsible_ai(output: str) -> float:
    # Flag overconfident language that guarantees outcomes
    overconfident_phrases = [
        "guaranteed job",
        "will get hired",
        "definitely hired",
        "certain to get",
        "guarantee employment",
        "will double your salary"
    ]
    output_lower = output.lower()
    for phrase in overconfident_phrases:
        if phrase in output_lower:
            return 0.0
    return 1.0

async def run_golden_eval():
    seed_path = os.path.join(os.path.dirname(__file__), "../../data/golden_dataset.json")
    if not os.path.exists(seed_path):
        print(f"Golden dataset not found at {seed_path}")
        return False
        
    with open(seed_path, "r") as f:
        dataset = json.load(f)
        
    print(f"🚀 Starting evaluation suite on {len(dataset)} personas...")
    
    results = []
    for persona in dataset:
        p_id = persona["id"]
        p_info = persona["persona"]
        expected = persona["expected"]
        
        print(f"\nEvaluating Persona: {p_info['name']} ({p_id})")
        print(f"Background: {p_info['background']}")
        
        # Build agent executor
        agent_executor = build_agent(f"eval-{p_id}", langfuse_enabled=False)
        
        # Stream response text
        response_text = ""
        async for chunk in agent_executor.astream({
            "input": p_info["raw_input"],
            "chat_history": []
        }):
            if "output" in chunk:
                response_text += chunk["output"]
                
        # Scour output properties
        role_rel = score_role_relevance(response_text, expected)
        gap_comp = score_gap_completeness(response_text, expected)
        resp_ai = score_responsible_ai(response_text)
        
        scores = {
            "role_relevance": role_rel,
            "gap_completeness": gap_comp,
            "responsible_ai_check": resp_ai,
            "passed": role_rel >= 0.7 and gap_comp >= 0.5 and resp_ai == 1.0
        }
        
        results.append({
            "persona_id": p_id,
            "scores": scores
        })
        
        print(f"Result: {'PASS' if scores['passed'] else 'FAIL'}")
        print(f"  - Role Relevance: {scores['role_relevance'] * 100:.1f}%")
        print(f"  - Gap Completeness: {scores['gap_completeness'] * 100:.1f}%")
        print(f"  - Responsible AI Compliance: {'YES' if scores['responsible_ai_check'] == 1.0 else 'NO'}")

    # Aggregate summaries
    total_runs = len(results)
    pass_count = sum(1 for r in results if r["scores"]["passed"])
    
    avg_role = sum(r["scores"]["role_relevance"] for r in results) / total_runs
    avg_gap = sum(r["scores"]["gap_completeness"] for r in results) / total_runs
    avg_resp = sum(r["scores"]["responsible_ai_check"] for r in results) / total_runs
    
    print("\n==================================================")
    print("📊 Evaluation Run Final Summary:")
    print(f"  Total Runs: {total_runs}")
    print(f"  Pass Rate: {pass_count}/{total_runs} ({pass_count/total_runs*100:.1f}%)")
    print(f"  Avg Role Relevance Score: {avg_role*100:.1f}%")
    print(f"  Avg Skill Gap Match Score: {avg_gap*100:.1f}%")
    print(f"  Avg Responsible AI Compliance: {avg_resp*100:.1f}%")
    print("==================================================")
    
    # Assert criteria thresholds
    assert avg_role >= 0.70, "CI Gate Failure: Role relevance score below 70%"
    assert avg_resp >= 0.95, "CI Gate Failure: Responsible AI safety checks failed"
    
    print("✓ All evaluation thresholds pass successfully!")
    return True

if __name__ == "__main__":
    success = asyncio.run(run_golden_eval())
    if not success:
        sys.exit(1)
