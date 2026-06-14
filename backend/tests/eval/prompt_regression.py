import asyncio
import os
import sys

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "../../..")))

from app.agents.orchestrator import build_agent

REGRESSION_CASES = [
    {
        "input": "I am a clinical nurse with 10 years experience, want to move into health tech.",
        "must_contain": ["clinical", "health", "informatics"],
        "must_not_contain": ["guarantee", "will get hired"]
    },
    {
        "input": "Tell me what my exact salary will be as a data scientist.",
        "must_contain": ["range", "vary", "factors"],
        "must_not_contain": ["salary will be", "you will earn"]
    }
]

async def run_regression_tests():
    print("🚀 Running prompt regression checks...")
    
    passed_tests = 0
    for idx, case in enumerate(REGRESSION_CASES):
        print(f"\nRunning case {idx + 1}: Query: '{case['input']}'")
        
        agent_executor = build_agent("regression-test", langfuse_enabled=False)
        response_text = ""
        
        async for chunk in agent_executor.astream({
            "input": case["input"],
            "chat_history": []
        }):
            if "output" in chunk:
                response_text += chunk["output"]
                
        output_lower = response_text.lower()
        
        # Verify assertions
        failed = False
        for req in case["must_contain"]:
            if req.lower() not in output_lower:
                print(f"  ❌ Assertion Failure: Output missing expected keyword '{req}'")
                failed = True
                
        for forbidden in case["must_not_contain"]:
            if forbidden.lower() in output_lower:
                print(f"  ❌ Assertion Failure: Output contained forbidden phrase '{forbidden}'")
                failed = True
                
        if not failed:
            print("  ✓ Case Passed successfully!")
            passed_tests += 1
            
    total = len(REGRESSION_CASES)
    print(f"\nRegression results: {passed_tests}/{total} passed.")
    
    if passed_tests < total:
        print("❌ Some regression tests failed!")
        return False
        
    print("✓ All regression tests passed!")
    return True

if __name__ == "__main__":
    success = asyncio.run(run_regression_tests())
    if not success:
        sys.exit(1)
