# Cumulative Full-spatial Flow Intervention

동일한 expert action·물리 상태·초기 noise에서, 배경으로 달라진 전체 raw flow를 누적 교정하면 최종 로봇 궤적이 BG0에 가까워지는지 확인했다. BGb main observation을 유지하고, 실제 현재 latent에서 다시 계산한 BG0 반사실 flow를 선택한 단계의 tensor 전체에 넣었다. 비교 대상은 기존 Robot-only와 새 Full-spatial E / E+M / M+L / All-steps다.

Result · 평균 회복률: E 14.35% → E+M 49.91% → All-steps 56.44%. E+M 뒤 Late는 BGb flow로 진행했습니다.
Result · E+M − M+L: 5.87 [-1.94, 15.01]%p (95% CI). 어느 구간이 우세한지 확정할 수 없습니다.
Result · 같은 E+M 구간에서 Full-spatial − Robot-only: 37.12 [13.02, 62.35]%p. 더 넓고 강한 교정의 추가 회복을 지지합니다.
All-steps 잔여 ADE는 평균 0.071px입니다. 평균 회복률은 작은 baseline 표본의 비율에 민감합니다. D_BG≥1px인 47개 (4 tasks)에서는 97.34% 회복입니다 (보조 분석).

핵심 해석: 시간 제한 Full-spatial 교정의 회복은 배경에 따른 전체 generative flow 차이가 최종 궤적 차이에 인과적으로 기여함을 지지한다. E+M 이후 Late를 BGb flow로 되돌려도 평균 회복이 남는다. Robot-only와의 비교에는 공간 범위뿐 아니라 soft/hard 교정 강도와 view 범위 차이도 있다. 순수한 robot-local 대 background-local 인과 분해는 아니다.

## 연구 질문

| 질문 | 답 | 직접 근거와 한계 |
|---|---|---|
| 1. Full-spatial이 Robot-only보다 더 회복하는가? | YES (E+M) | Matched E+M paired 차이 37.12 [13.02, 62.35]%p (n=270). 공간·강도·view가 함께 다름. |
| 2. Early만의 회복이 이후에도 남는가? | YES | 최종 E recovery 14.35 [3.65, 24.57]%; ΔD 0.24 [0.03, 0.55]px. 양수 여부와 회복의 크기를 구분. |
| 3. Middle까지 교정하면 추가 회복이 있는가? | YES | E+M − E 35.56 [16.42, 54.96]%p. |
| 4. E+M 이후 Late BGb flow가 회복을 얼마나 줄이는가? | YES (Late 추가 교정 이득) | All-steps − E+M 6.53 [2.24, 11.54]%p. 이는 최종 결과의 paired 차이이며, Middle 종료 시점에 이미 회복된 궤적을 직접 측정한 것은 아님. |
| 5. 같은 24회에서 E+M이 M+L보다 강한가? | INCONCLUSIVE | 5.87 [-1.94, 15.01]%p. 평가 수는 같지만 sigma 구간과 실제 update 크기는 다름. |
| 6. All-steps가 BG0에 접근하는가? | YES | Recovery 56.44 [32.51, 77.70]%, ADE_BG0 0.07 [0.05, 0.09]px. 미래 clean latent 완전 일치 270/270. |
| 7. Task 간 일관적인가? | YES (E+M 평균 방향) | E+M task평균 6.34–92.06%. 크기·구간 순위의 일관성이나 새로운 task로의 일반화는 별도. |
| 8. Flow 차이가 robot-local에 한정되는가? | NO; 공간별 인과적 우위는 INCONCLUSIVE | 초기 step0에서 미래 robot-mask 밖 flow RMS 평균 0.1605; robot-mask 안 0.1059. Mask 밖에도 차이가 존재하지만, 이것만으로 공간별 인과 기여를 정할 수는 없습니다. |
| 9. All-steps 뒤 잔여 궤적 차이는? | NO (완전 일치는 아님) | 평균 ADE_BG0 0.0714px; sample별 잔여 비율 평균 43.56%. 관측-frame anchor와 decode·tracking 경로가 유지되어, 잔여 오차만으로 독립적인 추가 메커니즘을 확정할 수 없음. |

## 수치와 통계

회복률 = 100 × (D_BG − D_k)/(D_BG + 1e−8). D는 20 future frame의 손 표면 query 중심 2D ADE(px). D_BG ≤ 0.0001px이면 회복률은 undefined. BG0는 모델 reference이고 물리 GT는 MuJoCo다. 표본 단위는 task/background/seed이며 frame을 독립 표본으로 쓰지 않았다.

| Full-spatial window | n | Recovery mean [95% CI] % | Median % | D_BG px | ADE_BG0 px | FDE_BG0 px | ΔD px | ADE_GT px | FDE_GT px |
|---|---:|---|---:|---:|---:|---:|---:|---:|---:|
| Full-spatial E | 269 | 14.35 [3.65, 24.57] | 11.64 | 1.3778 | 1.1389 | 2.6941 | 0.2389 | 2.0213 | 4.4557 |
| Full-spatial E+M | 269 | 49.91 [25.96, 73.45] | 68.94 | 1.3778 | 0.0935 | 0.1099 | 1.2843 | 1.1048 | 2.1038 |
| Full-spatial M+L | 269 | 44.03 [26.49, 59.47] | 56.58 | 1.3778 | 0.2559 | 0.4263 | 1.1219 | 1.2170 | 2.3343 |
| Full-spatial All-steps | 269 | 56.44 [32.51, 77.70] | 72.58 | 1.3778 | 0.0714 | 0.0780 | 1.3063 | 1.0868 | 2.0696 |

전체 평균 CI는 6 task cluster를 1,000회 bootstrap(seed42)했다. Paired 비교는 네 조건 모두에 공통 유효한 frame을 사용했다. GT ADE는 각 궤적의 valid frame, GT improvement는 paired valid frame 기준이다. 모든 query가 visible인 future frame이 95% 미만인 표본은 해당 지표에서 제외했다. Confidence·visibility와 실패 표본을 CSV에 보존했고 보간하지 않았다.

GT 해석: E+M의 GT 오차 개선은 T01에서 −0.034px, T02에서 −0.019px였다. BG0 방향 회복이 모든 task의 GT 개선을 뜻하지 않는다. 위 전체 양의 평균에는 Original task의 큰 개선이 영향을 준다.

## 구현 검증과 잔여 경로

새 rollout 1080; step 검사 38880; 저장된 실제 현재 latent hash 38880개 확인. 활성 단계 v_used == v_0, 비활성 v_used == v_b. Pilot BG0/BGb baseline과 same-background no-op은 latent·decoded frame·CoTracker track이 정확히 일치했다. 기존 MuJoCo GT의 배경 간 동일성 검사 96개, 최대 차이0.

A2World 공식 denoiser는 raw flow를 clean estimate로 변환한 후 관측-frame 위치를 main condition으로 고정한다. 이 위치는 BGb로 유지했다. All-steps의 미래 latent가 BG0와 같아도, 이 관측 anchor와 시간적 VAE decode 때문에 최종 영상 전체가 BG0와 bitwise 동일할 필요는 없다. All-steps는 구현 상한이며, E+M release 실험을 대체하는 주 결과가 아니다.

원래 RGB/latent robot mask는 분석용으로 재사용했다. Full-spatial 교정에는 mask를 적용하지 않았다. Nonrobot은 mask의 complement로 다른 camera와 관측-frame도 포함한다. 미래 nonrobot 지표에서는 관측-frame을 제외했지만 순수한 물리 배경 분할은 아니다.

실행 중 외부 A2World 소스 폴더가 사라져 568개 완료 표본을 보존한 상태로 중단됐다. 새 실험 runtime에 같은 commit을 확보했고, 기록된 source SHA-256 10개가 모두 일치했다. BG0/BGb baseline·no-op·E+M·All-steps의 전체 latent·raw-flow hash·decoded frame을 bitwise 재현한 뒤 남은 512개만 재개했다. 기존 결과 파일은 변경하지 않았다.

## 해석의 범위

이 개입은 전체 generative flow field를 바꾸며 appearance·object·background 관련 변화도 포함한다. Raw action은 변하지 않는다. “Action realization / 생성 궤적이 달라진다”가 적절한 표현이다. Early를 planning stage라고 부르지 않고, 단일 critical stage나 전체 causal mediation을 주장하지 않는다.

기존 Robot-only는 soft coverage에 따른 부분 교정이다. Full-spatial의 강한 회복만으로 공간 밖 flow의 단독 원인을 확정할 수 없다. 기존 mask는 MuJoCo GT 기준이어서, 생성 로봇이 다른 위치로 움직인 경우 robot flow 일부를 놓칠 수도 있다. 같은 hard 교정 강도·view 범위·mask coverage를 맞춘 공간 대조군이 이 설명을 더 구분할 수 있다. 작은 D_BG에서의 ratio 민감도, CoTracker 2D 추적 오차, 6 task만의 cluster CI도 한계다.

## 재현 파일

- `configs/protocol.json`: 실행된 window와 조건. 상속된 robot-mask/negative-control 항목은 이전 실험 문맥이며, 새 primary 공간 정의는 `space`, 시간 정의는 `windows`다.
- `docs/implementation.md`, `docs/model_provenance.json`: 실제 raw flow hook / scheduler / checkpoint 근거.
- `results/flow_steps.csv`, `trajectories.csv`, `rollout_metrics.csv`: 모든 step와 궤적·endpoint.
- `results/paired_window_metrics.csv`, `paired_summary.csv`, `spatial_summary.csv`: paired 기준.
- `results/summary.csv`, `bootstrap_statistics.json`, `sensitivity.csv`: 평균·중앙값·CI 및 baseline drift 민감도.
- `results/final_validation.json`, `resources.csv`: validation와 CPU/GPU 실측.
- `results/<task>/seed<seed>/<BG>/<condition>/`: 무손실 frames, latent 경로, tracking, 대표 raw flow. 원시 tensor와 checkpoint는 공개 사이트에 넣지 않음.
