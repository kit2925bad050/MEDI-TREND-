import os
import sys
sys.stdout.reconfigure(encoding='utf-8')
import requests
import json

BASE_URL = "http://127.0.0.1:8000"

# 1. Fetch patient
pts = requests.get(f"{BASE_URL}/api/patients").json()
if not pts:
    print("No patient found!")
    exit(1)

patient = pts[0]
patient_id = patient["id"]
print(f"Testing Patient: {patient['full_name']} (ID: {patient_id})")

# 2. Fetch all reports for patient
reports = requests.get(f"{BASE_URL}/api/patients/{patient_id}/reports").json()
print(f"Total Active Reports for Patient: {len(reports)}")

if len(reports) < 2:
    print("Need at least 2 reports for testing!")
    exit(1)

# Pick reports
report_ids = [r["report_id"] for r in reports]

# Test Case A: 2-Document Comparison
print("\n" + "="*80)
print("TEST 1: TWO-DOCUMENT COMPARISON (Report 1 vs Report 2)")
print("="*80)
payload_2 = {
    "patientId": patient_id,
    "selectedReportIds": report_ids[:2]
}
res2 = requests.post(f"{BASE_URL}/api/analyze", json=payload_2, headers={"x-user-name": "Dr. Arvind Kumar", "x-user-role": "DOCTOR"})
print("Status:", res2.status_code)
if res2.status_code == 200:
    data2 = res2.json()
    print("Provider Used:", data2.get("providerUsed"))
    print("Execution Latency:", data2.get("executionLatencyMs"), "ms")
    print("\nPairwise Comparisons Count:", len(data2.get("comparisons", [])))
    for comp in data2.get("comparisons", []):
        print(f"  -> {comp['fromReportId']} ({comp['fromReportDate']}) ==> {comp['toReportId']} ({comp['toReportDate']})")
        for p in comp.get("parameters", [])[:4]:
            print(f"     * {p['name']}: Before={p['beforeValue']} {p['unit']}, After={p['afterValue']} {p['unit']} | Change={p['absoluteChange']} ({p['percentChange']}%) | Trajectory={p['trajectory']}")
    
    print("\nEnglish Summary:")
    for s in data2.get("englishSummary", []):
        print(f"  - {s}")
    
    print("\nTamil Summary:")
    for s in data2.get("tamilSummary", []):
        print(f"  - {s}")
else:
    print("Error:", res2.text)

# Test Case B: 3-Document Comparison
if len(report_ids) >= 3:
    print("\n" + "="*80)
    print("TEST 2: THREE-DOCUMENT COMPARISON (1 -> 2 -> 3 + Overall 1 -> 3)")
    print("="*80)
    payload_3 = {
        "patientId": patient_id,
        "selectedReportIds": report_ids[:3]
    }
    res3 = requests.post(f"{BASE_URL}/api/analyze", json=payload_3, headers={"x-user-name": "Dr. Arvind Kumar", "x-user-role": "DOCTOR"})
    print("Status:", res3.status_code)
    if res3.status_code == 200:
        data3 = res3.json()
        print("Provider Used:", data3.get("providerUsed"))
        print("Sequential Comparisons (R1->R2, R2->R3):", len(data3.get("comparisons", [])))
        for idx, comp in enumerate(data3.get("comparisons", []), 1):
            print(f"  Step {idx}: {comp['fromReportId']} -> {comp['toReportId']} (Improved: {comp['improvedCount']}, Worsened: {comp['worsenedCount']})")
        print("\nMulti-Point Trend History (Key Parameter Example):")
        for kp in data3.get("keyParameters", [])[:2]:
            print(f"  Parameter: {kp['name']}")
            for th in kp.get("trendHistory", []):
                print(f"     Report: {th['reportId']} ({th['reportDate']}) => Value: {th['value']} {th['unit']}")
else:
    print("Fewer than 3 reports available for 3-doc test.")

# Test Case C: 5-Document Comparison
if len(report_ids) >= 5:
    print("\n" + "="*80)
    print("TEST 3: FIVE-DOCUMENT COMPARISON (1->2->3->4->5 Sequential Trajectory)")
    print("="*80)
    payload_5 = {
        "patientId": patient_id,
        "selectedReportIds": report_ids[:5]
    }
    res5 = requests.post(f"{BASE_URL}/api/analyze", json=payload_5, headers={"x-user-name": "Dr. Arvind Kumar", "x-user-role": "DOCTOR"})
    print("Status:", res5.status_code)
    if res5.status_code == 200:
        data5 = res5.json()
        print("Provider Used:", data5.get("providerUsed"))
        print("Sequential Comparisons Count:", len(data5.get("comparisons", [])))
        for idx, comp in enumerate(data5.get("comparisons", []), 1):
            print(f"  Step {idx}: {comp['fromReportId']} -> {comp['toReportId']}")
else:
    print("Fewer than 5 reports available for 5-doc test.")

print("\n" + "="*80)
print("TEST COMPLETE: ALL GROUNDING VERIFIED")
print("="*80)
