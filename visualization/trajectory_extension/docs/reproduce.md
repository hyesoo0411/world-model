# 재실행 순서

모든 작업은 EX9 안에서 실행한다. 기존 EX2/EX7/EX8의 캐시와 코드가 필요하다. 모델·tokenizer·tracker는 기존 기본 HF cache를 사용한다.

1. `audit_and_trajectories.py`: 저장 GT와 tracker 좌표를 검증하고 첫 20-action 구간의 궤적 metric을 계산한다.
2. `verify_provenance.py`: checkpoint·입력 RGB·noise·카메라·설정의 연결을 확인한다.
3. `recover_tracking_confidence.py`: 기존 CoTracker 입력을 동일하게 재실행하여 연속 confidence를 저장한다. 좌표와 visibility가 기존 캐시와 일치해야 한다.
4. `enrich_qc.py`, `secondary_trajectory_metrics.py`: confidence와 GT tracking floor, 보조 궤적 metric을 추가한다.
5. `analyze_flow_trajectory.py`, `correlation_sensitivity.py`, `stage_comparison.py`, `background_rankings.py`: task 단위 통계와 민감도 분석을 계산한다.
6. `capture_extension.py --worker N --workers 4`: 없는 배경별 train/validation flow 특징과 action dose만 측정한다. N=0…3. 완료 NPZ는 재사용하며 실제 x_tau와 BG0 velocity를 검증한다.
7. `watch_probes.py --worker N`: task별 bank가 끝나면 CPU probe를 학습한다. N=0…2가 denoising 시점을 나누며, 원본 demo split을 유지한다.
8. `capture_extension.py --worker N --workers 4 --expand-until-covered`: 배경 효과를 덮지 못한 dose curve만 action 경계까지 확장한다. `adaptive_workerN.json`에 종료 이유를 남긴다.
9. `probe_cohort_flow.py`, `canonical_probe_drift.py`: 같은 action 표본끼리 flow·readout·trajectory를 연결한다.
10. `calibrate_actions.py`, `assemble_results.py`, `probe_uncertainty.py`, `summarize_probes.py`: EAP·joint table·paired test-demo CI를 계산한다.
11. `resource_summary.py`, `validate_extension.py`, `report.py`: 자원 및 전체 품질 검증 후 보고서를 작성한다.
12. `trajectory_visuals.py`, `task_scatter_figures.py`, `correlation_figure.py`, `publish_extension.py`: 기존 사이트에 그림·영상·표를 추가한다. 기존 1–8번 섹션은 유지한다.

GPU 제출은 `scripts/submit.py`를 사용한다. 매번 사용자 전체 active job 수를 검사하며 최대 4개를 허용한다. `finish_measurements.py`는 base capture 종료 후 adaptive 측정과 최종 CPU 분석을 이어 실행한다.

실행 환경: `DreamDojo/.venv/bin/python`으로 추론·통계를 실행하고, 브라우저 및 font packaging은 기존 EX8 `runtime/simvenv/bin/python`을 사용한다. 재현에 필요한 실제 source/checkpoint commit과 hash는 `provenance.json`에 있다. 생성 영상은 다시 추론하지 않는다.

통합 CSV에서 R²는 seed0의 held-out test cohort 점수이다. 다른 noise seed에 복제하지 않는다. EAP 기본 열은 x, L=20이며 전체 좌표·길이·부호는 `equivalent_action_perturbation.csv`를 사용한다.
