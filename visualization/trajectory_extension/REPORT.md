# Background-induced flow drift → action realization error

같은 물리 상태·action·초기 noise에서 배경만 바꾼 기존 A2World 영상을 사용하여, 로봇 flow 변화가 생성 궤적 차이와 연결되는지 확인했다. 배경별 action 재학습 probe로 표현 변화와 정보 감소를 구분하고, 실제 action 크기·지속 길이를 바꿔 flow 차이를 action 표준편차 단위로 보정한다.

상태: 전체 분석 및 품질 검증 완료.

## 무엇을 바꾸고 비교했는가

- EX2 settled_v2 그대로: 6 tasks, BG0–BG15, seeds 0/1/2. 추가 background 없음. 모델은 A2World LIBERO만 사용.
- 주 단위: (task, seed, background). frame 1–20의 하나의 action chunk. 270개 비원본 배경 조건을 상관 분석에 사용하고 자명한 BG0 0점은 제외.
- Flow: EX8의 동일 x_tau paired raw DiT velocity 및 기존 normalized robot mask RMS. 원본 경로의 조건 민감도이다.
- 궤적: EX2/EX7의 검증된 hand_visual query·CoTracker3·MuJoCo oracle 투영을 재사용. 고정 query 집합의 중심과 중심 사이 유클리드 거리로 ADE/FDE 계산. EE site와 표면 중심은 다른 점이며 서로 혼동하지 않는다.
- nADE/nFDE/nD_traj = pixel metric / image diagonal 362.04 px. nADE는 GT 오차, nD_traj는 BG0와의 차이.
- 생성 영상 288개를 재사용. CoTracker 연속 confidence는 원본 tracker 재실행으로 복구하고 기존 좌표/visibility와 일치함을 확인.
- 모든 probe는 task·τ별로 따로 학습한다. R²는 16 held-out windows의 cohort 통계이다. 단일 canonical rollout 점수가 아니며 seed0에서만 측정한다. Joint CSV의 다른 seed 행에는 R²를 채우지 않는다.

## 질문별 답

**Q1. 큰 robot-flow drift가 큰 생성 궤적 차이를 예측하는가? YES — 관측된 연관성.** 초기 step 0에서 task-demeaned Spearman ρ=0.779, 95% CI [0.562, 0.913], n=270. Pearson r=0.789, 95% CI [0.631, 0.892]. Pooled 최대 ρ=0.731. 모든 task의 초기 상관이 양수이다. 이는 표본 내 연관이며 별도 held-out 예측 성능이나 인과 매개 검증은 아니다.

**Q2. 큰 flow drift가 큰 MuJoCo GT 오차와 연결되는가? YES — task 평균 차이를 제거한 연관.** 최대 task-demeaned ρ=0.554, CI [0.224, 0.843], step 8. Pearson r=0.766, 95% CI [0.294, 0.890]. Original task를 제외한 초기 pooled GT 오차 상관은 ρ=0.141로 약하다. Pooled 결과는 task 구성의 영향을 받는다. 배경 변경 후 GT 오차가 증가한 것은 178/270 조건이며 모든 변경이 해롭지는 않다.

**Q3. 어느 denoising 단계가 가장 잘 연결되는가? YES — 측정한 시점 중 초기/high-noise 단계.** BG 궤적 차이는 step 0 (τ=0.99502, progress=0.000), GT 오차는 step 8 (τ=0.98145, progress=0.229)에서 최대 task-demeaned ρ. 이는 궤적과의 상관이 큰 단계이며, 평균 normalized flow 크기가 항상 가장 큰 단계라는 뜻은 아니다. 측정 후 선택한 최대값이며 인접 단계보다 통계적으로 우월하거나 motion planning 단계라는 뜻은 아니다.

**Q4. R² 하락은 주로 표현 변화인가? YES — 재학습 회복이 표현 변화 해석을 지지한다.** 비원본 배경·task·시점 평균 Linear R²는 transfer -0.283 → within 0.377. Within−transfer 차이가 양수인 조건 837/900, paired test-demo 95% CI가 0보다 큰 조건 510/900. 이 조건들은 같은 demo를 공유하므로 900개 독립 표본이 아니다. CI 개수는 기술 통계이며 다중비교 교정한 가설 검정이 아니다. MLP within 평균은 0.345. 전체 평균에서 MLP가 Linear보다 높지는 않아, 비선형 readout이 반드시 필요하다는 근거는 없다. 원래 BG0 test baseline과 within의 평균 차이는 -0.010이다. 회복은 정보 소실보다 배경별 readout 변화와 양립하지만, 잔여 정보 감소의 부재까지 증명하지는 않는다.

**Q5. 여러 배경으로 공통 action readout을 얻는가? YES — held-out background에서의 회복.** Linear LOBO 평균 R² 0.343, MLP 0.322. Linear LOBO−transfer 개선 771/900, paired CI가 0보다 큰 조건 462/900. Test background와 test demo는 학습·검증에 포함하지 않았다. 배경 반복은 독립 action 표본 수를 늘리지 않는다.

| Task | BG0→BG | BG→BG | LOBO→BG |
|---|---:|---:|---:|
| Original | -0.650 | 0.546 | 0.488 |
| T01 | -0.874 | 0.258 | 0.205 |
| T02 | -0.215 | 0.396 | 0.356 |
| T03 | 0.142 | 0.576 | 0.548 |
| T04 | 0.084 | 0.316 | 0.295 |
| T05 | -0.185 | 0.173 | 0.168 |

각 값은 BG1–BG15·10개 시점의 평균 Linear R²이다. 양의 R²는 test 평균 예측보다 낮은 오차를 뜻하며 정보 보존의 이진 판정 기준은 아니다.

**Q6. 실제 action을 얼마나 바꿔야 비슷한 flow 차이를 만드는가? YES — 측정 범위 내에서 조건별 보정값을 얻었다.** 좌표·부호·길이·τ에 의존하므로 하나의 보편적인 값으로 합치지 않는다. 아래 표는 Original/seed0/step0, negative x translation, L=20의 예시. 나머지는 EAP CSV에 저장. cm로 변환하지 않았다.

| Background | EAP (σ) | 상태 |
|---|---:|---|
| BG0 | 0.000 | zero_background |
| BG1 | 0.121 | interpolated_first_crossing |
| BG2 | 0.066 | interpolated_first_crossing |
| BG3 | 0.142 | interpolated_first_crossing |
| BG4 | 0.116 | interpolated_first_crossing |
| BG5 | 0.455 | interpolated_first_crossing |
| BG6 | 2.066 | interpolated_first_crossing |
| BG7 | 0.366 | interpolated_first_crossing |
| BG8 | 3.874 | interpolated_first_crossing |
| BG9 | 0.923 | interpolated_first_crossing |
| BG10 | >4.189 | above_tested_range |
| BG11 | 1.063 | interpolated_first_crossing |
| BG12 | 0.225 | interpolated_first_crossing |
| BG13 | 0.143 | interpolated_first_crossing |
| BG14 | 1.036 | interpolated_first_crossing |
| BG15 | 0.284 | interpolated_first_crossing |

EAP는 실제 측정한 action dose-response의 가장 이른 piecewise-linear 교차점이다. 일부 좌표에서 큰 dose의 반응이 다시 감소하므로 isotonic 적합은 보조 비교로만 사용한다. 단조성 위반과 보정량도 CSV로 남겼다. 보간에 사용한 ε 구간을 함께 저장했으며 EAP 자체를 정밀하게 직접 측정한 dose로 해석하지 않는다. 범위 밖에서는 외삽하지 않는다. 여러 σ의 큰 action은 유효 명령이어도 시연에서 흔한 크기라는 뜻은 아니다. Dose 비교는 원래 action의 GT robot mask를 고정해 사용한다. 동일 flow 크기는 동일 방향·동일 물리 동작을 뜻하지 않는다.

비단조 반응이 있는 curve: 1097/4320. 전체 EAP cell 69120개 중 범위 밖 7899개, 미약한 action 반응으로 undefined 0개. 이 cell들은 같은 task·action을 공유하므로 독립 표본 수가 아니다.

**Q7. 가장 flow-sensitive한 배경이 가장 큰 궤적 오차를 만드는가? INCONCLUSIVE — BG 궤적 차이와 GT 오차를 구분해야 한다.** 초기 18개 task/seed 그룹 모두 flow와 BG 궤적 차이의 순위 상관이 양수다. GT 오차 순위 상관은 16개에서 양수, 2개에서 음수다. 최대 flow 배경과 최대 BG 궤적 차이 배경이 같은 것은 9/18, 최대 GT 오차 배경과 같은 것은 8/18이었다. 큰 배경 의존성과 일관되게 큰 GT 오류는 같은 주장이 아니다.

**Q8. background → flow representation drift → action realization drift의 전체 경로를 지지하는가? INCONCLUSIVE — 일부 연결은 지지.** 배경만 바꾼 개입에서 flow와 생성 궤적이 모두 달라지고 두 변화가 연관된다. 그러나 내부 flow 변화를 직접 교정/개입해 궤적 변화를 막는 검증은 하지 않았다. Probe의 cohort 점수도 canonical rollout 단일 표본의 action 오차와 같지 않다. 인과 매개 전체를 확정할 수 없다.

## Task별 초기 상관

| Task | Flow ↔ BG 궤적 ρ | Flow ↔ GT ADE ρ | n |
|---|---:|---:|---:|
| Original | 0.902 | 0.904 | 45 |
| T01 | 0.613 | 0.167 | 45 |
| T02 | 0.715 | 0.175 | 45 |
| T03 | 0.835 | 0.446 | 45 |
| T04 | 0.375 | 0.260 | 45 |
| T05 | 0.862 | 0.310 | 45 |

## 연결별 검증

- nD_traj_BG: 사전에 구분한 early 평균과 late 평균의 상관 차이 Δρ=0.454, task bootstrap CI [0.204, 0.580]. 시점별 최대 선택과 별도 비교이다.
- nADE_GT: 사전에 구분한 early 평균과 late 평균의 상관 차이 Δρ=0.348, task bootstrap CI [0.063, 0.563]. 시점별 최대 선택과 별도 비교이다.
- 동일한 16 held-out action의 평균 flow drift ↔ BG0-probe R² 하락: 초기 task-demeaned ρ=0.861, CI [0.764, 0.933], n=90. Canonical action flow와 다른 cohort의 R²를 혼합하지 않은 비교이다.
- 동일 canonical action의 BG0 probe 예측 drift ↔ 생성 궤적 drift: 초기 task-demeaned ρ=0.726, CI [0.419, 0.919], n=90. Canonical demo는 Original/T01/T02에서 train, T03/T04에서 validation, T05에서 test에 속한다. 이 보조 상관을 held-out action 예측 성능으로 해석하지 않는다.

## 품질 관리와 해석 한계

- GT state trajectory는 16개 배경에서 모든 저장 필드가 동일하다. Action hash·initial noise·physical state·카메라·scheduler를 확인했다. EX8 보조 decoded Original/seed0 BG0/BG8과 EX2 영상의 첫 chunk RGB도 정확히 일치했다.
- 생성 궤적 실패 0/288. 전체 query의 최소 confidence 0.98081, 최소 영상 평균 0.99667. 높은 confidence 자체가 정확한 물리 추적을 보장하지는 않는다.
- 관측 BG 궤적 차이가 GT 영상의 tracker 배경 차이보다 작은 조건 0/270. GT tracker 오차를 빼서 물리 오차로 보정하지 않았다.
- 원래 CoTracker는 41-frame offline 영상으로 추적했다. 주 metric은 첫 20프레임이지만 tracker의 후속 frame 문맥을 완전히 제거한 분석은 아니다.
- RGB에서 얻은 2D 손 표면 중심의 오차이다. 3D end-effector·joint 오차나 과제 성공률로 일반화하지 않는다. MuJoCo EE/joint/gripper 정답 상태는 별도 원본 캐시에 보존된다.
- Flow는 공통 BG0 x_tau 경로에서의 민감도이다. 초기 공통 noise는 각 rollout의 출발점이지만 후반 x_tau는 BG0 경로에만 속한다. 이 측정 방식도 초기 상관이 더 높은 이유일 수 있다. GT mask 밖으로 이동한 생성 로봇과 tokenizer receptive-field 혼합도 한계이다.
- 시간별 GT robot mask는 action 단서를 포함할 수 있다. 기존 EX8의 fixed-mask / mask-only 검증을 보조 근거로 유지하며 representation 정의는 바꾸지 않았다.
- 기존 ratio는 EX8의 원래 0.05σ·첫 action 한 번의 control을 그대로 보존했다. 새 EAP의 선택 부호·window와 다를 수 있으므로 서로 같은 calibration으로 간주하지 않는다.
- EAP는 flow difference를 dose-response로 변환한 값이다. Flow↔EAP 상관은 정의상 생기므로 독립적인 mechanism 증거로 해석하지 않는다.
- Bootstrap은 개별 frame이 아닌 task 6개를 재표집했다. 적은 task cluster, 한 canonical action/task, seed 3개라는 범위 제한이 있다. τ 최대 선택은 탐색적이며 p-value만으로 결론 내리지 않았다.

## 파일

[Flow/trajectory correlations](results/correlations.csv) · [Summary features](results/flow_summary_features.csv) · [Trajectory metrics](results/trajectory_metrics.csv) · [Joint table](results/joint_metrics.csv) · [Probe comparison](results/probe_comparison.csv) · [EAP](results/equivalent_action_perturbation.csv)

설정·재사용 근거: [reuse_protocol.md](docs/reuse_protocol.md). EX2/EX7은 읽기 전용으로 재사용했고, 추가 추론·분석은 EX9에 보관했다.

최종 검증: 새 bank 7560건, action dose 4829건, 새 probe 점수 3840개, joint 2880행, EAP 69120행. [검증 결과](results/final_validation.json) · [재사용 조건](docs/reused_conditions.json) · [Source/checkpoint 근거](docs/provenance.json)

재현 확인: BG0 Linear 예측 최대 차이 2.11e-15. 같은 seed·구조·학습 규칙으로 별도 재학습한 MLP의 BG0 macro R² 최대 차이는 0.007869. MLP를 bitwise 재현이라고 주장하지 않으며, 주 결론은 Linear 결과를 사용한다. [Baseline 재현 CSV](results/baseline_reproduction.csv)

자원: A2World capture CPU VmHWM 최대 19.90 GiB / 요청 28 GiB. CUDA allocator peak 7.75 GiB는 CPU RAM과 별도이다. [측정·요청 근거](results/resource_usage.csv)
