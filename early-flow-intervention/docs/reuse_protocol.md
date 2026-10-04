# 재사용 및 사전 고정 설계

EX2 settled_v2의 6 tasks, BG0–BG15, seed 0–2와 첫 20-action chunk를 그대로 사용한다. EX9는 이미 있으므로 EX10을 생성했다.

- EX2 `run_a2world_paired.setup`: 동일 checkpoint, tokenizer, history adapter 및 전처리.
- EX8 `capture_flow.get_condition`: 같은 action 및 history-path 조건, 저장된 실제 initial noise. 조건은 관측과 관측 history만 배경에 따라 달라진다. Prompt는 기존처럼 빈 문자열이다.
- 실제 DiT 출력은 flow velocity. 공식 `denoise`의 scaling 및 조건-frame 고정으로 clean estimate를 만들고 공식 AB2 scheduler를 그대로 사용한다. 개입은 raw flow에만 적용한다.
- 35 scheduler updates + 마지막 clean-estimate용 flow 평가: 36회. Early 0–11, Middle 12–23, Late 24–35. EX9 progress-third 정의를 결과 확인 전에 고정한다. AB2 이전 예측은 경계에서도 유지된다.
- 로봇 mask는 EX8 simulator segmentation의 시간별 coverage를 그대로 사용한다. Agentview 미래 latent 1–5에만 적용한다. Soft boundary에서는 alpha=1도 부분 교체이고 coverage=1인 내부에서만 완전 교체이다. Metric은 기존 threshold0.5를 유지한다.
- EX2/EX7 CoTracker3 offline 구현 및 검증된 query를 재사용한다. 모든 조건을 같은21-frame 입력으로 새로 추적한다. 기존41-frame offline 추적은 baseline 재현 참고용이며 새 개입의 metric과 혼합하지 않는다.
- GT는 EX2 저장 physical trajectories와 projection oracle. 16배경의 모든 GT 배열이 동일한지 다시 검증한다.
- BG0는 모델 reference이며 물리 GT는 MuJoCo이다. Common-path observational flow와 on-current-path intervention flow를 구분한다.
- 기존 사이트는 수정하지 않는다. 새 사이트에서 기존 공개 사이트로 링크한다.

Full은 모든 denoising 시점의 robot-only 직접 조건 효과를 교정한다. BGb의 현재 latent 경로와 mask 밖/다른 view는 계속 유지되므로, 독립 BG0 경로의 전체 robot flow와 같아짐을 보장하지 않는다. Full의 작은 회복만으로 모든 background→flow→trajectory 경로를 부정하지 않는다.
