# Stage-wise Robot-Flow Intervention

BGb 관측을 모든 denoising 단계에서 고정하고, 현재 개입 latent에서 다시 계산한 BG0 robot flow를 선택한 구간에만 섞었다. 무엇을 바꾸었는가: robot-associated raw flow. 무엇을 비교했는가: 최종 CoTracker 손 궤적의 BG0까지 거리와 MuJoCo GT 오차.

**현재 답:** Early 교정의 제한적인 회복은 지지되지만, 보편적인 핵심 단계를 확정할 수 없다. Middle의 평균 회복률이 가장 크더라도 task별 차이와 paired CI를 함께 봐야 한다. Soft mask와 agentview 미래 latent에 한정된 개입이며, 관측 전환 결과는 이 보고서에 사용하지 않았다.

## 연구 질문

| 질문 | 답 | 근거 |
|---|---|---|
| Q1. Robot-flow-only correction recovers BG0 | YES | Early recovery %: 5.106 [1.334, 9.521], n=269. 고정 관측하에서 flow 교정의 제한적 인과 기여. |
| Q2. Which stage is largest? | INCONCLUSIVE | Mean: Early 5.106%, Middle 10.827%, Late 0.213%, Full 6.113%. Middle−Early: 5.722 [-3.674, 15.542], n=269 %p; Middle−Late: 10.615 [-0.923, 21.546], n=269 %p. |
| Q3. Consistent across tasks? | NO | Task별 양/음의 회복과 순위가 다르다. 보편적 stage 우위를 주장하지 않는다. |
| Q4. Robot > far-background? | YES (Early only) | Early paired advantage: 5.286 [1.523, 9.610], n=269 %p. Full advantage: 8.288 [-7.651, 19.798], n=268 %p. Mask 크기와 개입량은 다르다. |
| Q5. Original amount/direction predicts recovery? | INCONCLUSIVE | 아래 방향 상관 및 CSV 참고. Stage/task에 따라 달라지며 correlation은 causal mediation의 증거가 아니다. |
| Q6. How much remains after Full? | YES, substantial residual | 공통 paired 표본에서 평균 잔여 비율 93.887 [79.388, 111.181], n=269 %. Mean remaining ADE 1.110 [0.185, 2.915], n=269 px. Soft 경계·mask 밖·다른 view·상태경로를 통한 영향은 남는다. |

## 동일 paired 표본 비교

각 row는 BG0·BGb·Early·Middle·Late·Full의 동일 유효 frame을 사용한다. 비율은 sample별로 계산한 뒤 평균한다. 모든 수치는 20 future frames의 2D query-center 거리이다.

| Flow condition | n | D_BG px | ADE to BG0 px | FDE to BG0 px | Recovery mean % (95% CI) | Median % | DeltaD px (95% CI) | GT ADE px | GT FDE px |
|---|---:|---:|---:|---:|---|---:|---|---:|---:|
| early | 269 | 1.375 | 1.298 | 3.067 | 5.106 [1.334, 9.521], n=269 | 5.000 | 0.076 [0.009, 0.178], n=269 | 2.138 | 4.759 |
| middle | 269 | 1.375 | 1.198 | 2.814 | 10.827 [-1.899, 24.914], n=269 | 13.227 | 0.176 [0.044, 0.339], n=269 | 2.160 | 4.790 |
| late | 269 | 1.375 | 1.372 | 3.214 | 0.213 [-5.739, 5.742], n=269 | 1.692 | 0.003 [-0.010, 0.019], n=269 | 2.300 | 5.126 |
| full | 269 | 1.375 | 1.110 | 2.609 | 6.113 [-11.181, 20.612], n=269 | 18.700 | 0.265 [0.040, 0.583], n=269 | 2.082 | 4.582 |

GT ADE/FDE는 자체 visibility 기준, paired recovery는 공통 visibility 기준이다. 개별 condition-valid 표본의 수치도 `flow_only_metrics.csv`와 summary CSV에 별도로 저장했다.

## Task별 paired recovery (%)

| Task | Early | Middle | Late | Full |
|---|---:|---:|---:|---:|
| Original | 6.407 | 0.800 | -0.114 | 5.420 |
| T01 | -0.514 | -2.797 | 5.512 | -1.396 |
| T02 | 5.989 | 20.234 | 0.819 | 17.933 |
| T03 | 3.924 | 17.998 | -9.912 | 8.103 |
| T04 | 0.591 | -9.112 | -6.334 | -27.299 |
| T05 | 14.267 | 37.619 | 11.298 | 33.900 |

## 실제 교정량 및 대조군

보간 가중치 M은 기존 simulator robot coverage다. Coverage≥0.5인 metric cell에서 RMS를 구하며, soft 경계에서는 완전 교체가 아니다. 교정 직후 RMS 감소는 식에서 예상되는 구현 검증이다. 인과적 endpoint는 그 이후 최종 궤적이다.

| Stage | Flow correction mean % | Mean before RMS | Mean after RMS |
|---|---:|---:|---:|
| early | 78.198 | 0.105894 | 0.019719 |
| middle | 76.105 | 0.094468 | 0.020354 |
| late | 76.694 | 0.114708 | 0.025542 |
| full | 76.934 | 0.104858 | 0.021933 |

Same-BG no-op: BG8 ×6 tasks×3 seeds=18 cases. 매36단계의 두 BG8 forward, latent path 및 decoded pixels가 bitwise 동일. 동일 deterministic tracker의 기존 baseline 결과를 재사용했으며 별도 tracker 재실행으로 주장하지 않는다. 최종 궤적 변화 0px.

Far-background comparison: Early 5.286 [1.523, 9.610], n=269 %p; Full 8.288 [-7.651, 19.798], n=268 %p. Robot과 far mask 크기·교정량이 일치하지 않아 exhaustive spatial localization은 아니다.

## Flow direction ↔ recovery

원래 방향 차이는 EX8의 동일 BG0 latent 경로에서 측정한 1−cosine을 구간별로 평균했다. 반면 on-intervention-path 값은 개입된 현재 경로에서 계산했으므로 이미 앞선 교정의 영향을 받을 수 있다. 두 값을 구분한다.

| Stage | Original direction task-centered Spearman (95% CI) | Pearson | On-path direction Spearman (95% CI) |
|---|---|---:|---|
| early | 0.156 [-0.044, 0.426] | 0.006 | 0.158 [-0.044, 0.432] |
| middle | 0.133 [-0.107, 0.293] | 0.076 | 0.136 [-0.080, 0.287] |
| late | -0.127 [-0.300, -0.023] | -0.124 | -0.087 [-0.248, 0.001] |
| full | 0.114 [-0.139, 0.265] | 0.066 | 0.100 [-0.144, 0.269] |

## 해석과 한계

고정된 BGb 시각 조건에서 Early robot-flow-only 교정이 BG0 쪽의 작은 평균 회복을 만든다는 결과는, 이 robot-associated flow 차이가 측정된 2D 궤적 불일치에 일부 인과적으로 기여함을 지지한다. 전체 궤적 차이를 설명하거나 유일한 경로임을 입증하지 않는다.

Full에서도 잔여 차이가 크다. 이는 다른 경로의 존재와 양립하지만 그것만이 유일한 설명은 아니다. Soft mask로 교정량이 약77%이고, 한 camera·고정 GT mask·latent receptive-field mixing·생성 로봇의 mask 밖 이동도 남은 차이를 설명할 수 있다. Full이 항상 stage-specific보다 낫다는 단조성도 없다.

BG0는 모델 reference이며 physical GT가 아니다. BG0 회복과 GT ADE 개선을 별도로 보고한다. 회복률은 작은 D_BG에서 민감하다. cutoff0/1/5px 민감도 CSV와 absolute DeltaD를 함께 제시한다. 6 task bootstrap의 CI는 broad generalization 근거로 충분하지 않다. CoTracker 외형 의존 오차와 2D projection 한계가 있다. Early/Middle/Late를 planning 단계로 부르지 않는다.

## 검증 및 재현

- BG0/BGb smoke replay: 모든 raw flow·현재 latent·최종 pixels의 기존 캐시 재현. Same-current counterfactual은 독립 BG0 rollout tensor를 사용하지 않는다.
- 모든 1620 robot/far intervention cache에서 fixed observation, active window, mask 밖 및 비개입 flow 동일성, latent hash를 검증했다.
- MuJoCo GT: 기존6×16 background equality 검증 유지. 동일20 actions·물리 상태·camera·checkpoint·noise·AB2 schedule.
- Paired windows: Early0–11, Middle12–23, Late24–35. Step35는 최종 decode clean 평가. AB2 history는 유지. 각 구간의 적분된 개입량은 같지 않다.
- Model/loader: [provenance](docs/model_provenance.json). 구현: [audit](docs/flow_only_reuse_audit.md). [Protocol](configs/flow_only_protocol.json).
- [Metrics CSV](results/flow_only_metrics.csv) · [Paired metrics](results/flow_only_paired_stage_metrics.csv) · [Flow steps](results/flow_only_flow_steps.csv) · [Trajectories](results/flow_only_trajectories.csv) · [Summary](results/flow_only_summary.csv) · [Paired CI](results/flow_only_paired_summary.csv) · [Direction correlations](results/flow_only_direction_correlations.csv) · [No-op](results/flow_only_noop.csv) · [Sensitivity](results/flow_only_sensitivity.csv)

## 실행 자원

새 smoke/no-op GPU jobs: CPU RAM 요청28 GiB, 최대 프로세스 HWM 19.90 GiB (약41% 여유). GPU allocator 최대 7.70 GiB는 CPU RAM과 별도다. 기존 cache 검증과 통계는 CPU에서 수행했다. Slurm accounting 부재로 process HWM·cgroup과 PyTorch allocator를 기록했으며, device 전체 사용량은 아니다.

[Validation + resources](results/flow_only_validation_summary.json)
